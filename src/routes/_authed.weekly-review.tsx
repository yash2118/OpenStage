import { createFileRoute, Link } from "@tanstack/react-router";
import {
  useApp,
  weeklyProgress,
  useStreak,
  computeMomentum,
} from "@/lib/store";
import { toast } from "sonner";
import {
  Trophy,
  ShieldCheck,
  TrendingUp,
  Sparkles,
  Share2,
  Flame,
  Heart,
  Check,
} from "lucide-react";
import { useMemo, useState } from "react";
import { haptic } from "@/lib/haptics";

export const Route = createFileRoute("/_authed/weekly-review")({
  head: () => ({ meta: [{ title: "Weekly Review — OpenStage" }] }),
  component: WeeklyReview,
});

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function WeeklyReview() {
  const {
    user,
    onboarding,
    checkIns,
    verificationsGiven,
    momentumHistory,
    recoveryLogs,
  } = useApp();
  const streak = useStreak();
  const [commitments, setCommitments] = useState<Record<string, boolean>>({});

  if (!user || !onboarding) return null;

  const weekly = weeklyProgress(checkIns, onboarding.weeklyCommitment);
  const momentum = computeMomentum({
    checkIns,
    weeklyTarget: onboarding.weeklyCommitment,
    verificationsGiven,
    prevHistory: momentumHistory,
  });

  // === Day-by-day grid for the current ISO week (Mon-start) ===
  const weekGrid = useMemo(() => {
    const today = new Date();
    const dow = (today.getDay() + 6) % 7; // 0=Mon
    const monday = new Date(today);
    monday.setDate(today.getDate() - dow);
    monday.setHours(0, 0, 0, 0);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dayCheckIns = checkIns.filter((c) => {
        const cd = new Date(c.date);
        return cd.toDateString() === d.toDateString();
      });
      return {
        date: d,
        label: DAYS[i],
        count: dayCheckIns.length,
        verified: dayCheckIns.some((c) => c.verified || c.approvals.length > 0),
        isToday: d.toDateString() === today.toDateString(),
        isFuture: d.getTime() > today.getTime(),
      };
    });
  }, [checkIns]);

  const verifiedThisWeek = weekGrid.filter((d) => d.verified).length;
  const recoveryAvg = useMemo(() => {
    const last7 = recoveryLogs.slice(0, 7);
    if (last7.length === 0) return 0;
    const overall =
      last7.reduce((a, r) => a + (r.sleep + r.energy + r.mood + (6 - r.stress)) / 4, 0) /
      last7.length;
    return Math.round(overall * 10) / 10;
  }, [recoveryLogs]);

  // === 12-week momentum sparkline ===
  const sparkline = useMemo(() => {
    const history = momentumHistory.slice(-12);
    while (history.length < 12) history.unshift({ date: "", score: momentum.score });
    return history.map((h) => h.score);
  }, [momentumHistory, momentum.score]);

  const wentWell =
    weekly.done >= weekly.target
      ? `Hit the target — ${weekly.done}/${weekly.target} sessions.`
      : verifiedThisWeek > 0
      ? `${verifiedThisWeek} verified day${verifiedThisWeek === 1 ? "" : "s"} — Crew sees you.`
      : "You opened the app every day. Tiny wins compound.";
  const couldImprove =
    weekly.done < weekly.target
      ? `${weekly.target - weekly.done} session${
          weekly.target - weekly.done === 1 ? "" : "s"
        } short — anchor two specific days next week.`
      : verifiedThisWeek < weekly.done
      ? "Verify within 30 min of finishing — speed beats polish."
      : recoveryAvg < 3
      ? "Recovery is dragging. Protect sleep this week."
      : "Push intensity by 10% on your anchor day.";
  const focus =
    streak < 3
      ? "Rebuild the streak — one short session tomorrow."
      : `Hold ${streak}-day streak. Verify two Crew members.`;

  const NEXT_WEEK = [
    { id: "anchor", label: "Lock my anchor day (Mon)", to: "/check-in" as const },
    { id: "verify", label: "Verify 2 Crew check-ins", to: "/community" as const },
    { id: "recover", label: "Log recovery 5 nights", to: "/recovery" as const },
  ];

  const toggle = (id: string) => {
    haptic("select");
    setCommitments((c) => ({ ...c, [id]: !c[id] }));
  };
  const lockIn = () => {
    haptic("success");
    const n = Object.values(commitments).filter(Boolean).length;
    if (n === 0) {
      toast.error("Pick at least one commitment.");
      return;
    }
    toast.success(`${n} commitment${n === 1 ? "" : "s"} locked. See you Monday.`);
  };

  const share = () => {
    haptic("tap");
    const text = `Week recap → ${weekly.done}/${weekly.target} sessions · ${verifiedThisWeek} verified · momentum ${momentum.score} (${momentum.delta >= 0 ? "+" : ""}${momentum.delta}). — @${user.handle}`;
    navigator.clipboard?.writeText(text);
    toast.success("Report copied. Drop it in your Crew chat.");
  };

  return (
    <div className="space-y-6 md:space-y-8 fade-up">
      <header className="flex flex-wrap items-end justify-between gap-3 safe-top">
        <div>
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-primary">
            Sunday report ·{" "}
            {new Date().toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          </div>
          <h1 className="font-display font-bold text-3xl md:text-4xl mt-2 tracking-tight">
            Your week, on paper.
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            One screen. No fluff. The truth and your next move.
          </p>
        </div>
        <button
          onClick={share}
          className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-accent press"
        >
          <Share2 className="h-3.5 w-3.5" /> Share to Crew
        </button>
      </header>

      {/* === Day grid === */}
      <section className="card-elevated p-5 md:p-6 soft-rise">
        <div className="flex items-center justify-between">
          <div className="font-mono text-[10px] uppercase tracking-wider text-primary">
            This week
          </div>
          <div className="text-xs text-muted-foreground">
            {weekly.done}/{weekly.target} sessions · {verifiedThisWeek} verified
          </div>
        </div>
        <div className="mt-4 grid grid-cols-7 gap-1.5">
          {weekGrid.map((d) => {
            const tone = d.isFuture
              ? "bg-surface-2/40 border-dashed"
              : d.verified
              ? "bg-primary text-primary-foreground border-primary"
              : d.count > 0
              ? "bg-primary/30 border-primary/50"
              : "bg-surface-2/60 border-border";
            return (
              <div key={d.label} className="flex flex-col items-center gap-1.5">
                <div
                  className={`w-full aspect-square rounded-lg border grid place-items-center ${tone} ${
                    d.isToday ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""
                  }`}
                >
                  {d.verified ? (
                    <ShieldCheck className="h-4 w-4" />
                  ) : d.count > 0 ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <span className="text-[10px] font-mono opacity-40">·</span>
                  )}
                </div>
                <span className="text-[10px] font-mono text-muted-foreground">{d.label}</span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat icon={Trophy} label="Workouts" value={weekly.done} sub={`/ ${weekly.target}`} />
        <Stat
          icon={ShieldCheck}
          label="Verified"
          value={verifiedThisWeek}
          sub={`${weekly.done ? Math.round((verifiedThisWeek / weekly.done) * 100) : 0}% rate`}
        />
        <Stat icon={Flame} label="Streak" value={`${streak}d`} sub="active" />
        <Stat
          icon={Sparkles}
          label="Momentum"
          value={momentum.score}
          sub={`${momentum.delta >= 0 ? "+" : ""}${momentum.delta} vs last`}
        />
      </section>

      {/* === Momentum sparkline + recovery bar === */}
      <section className="grid lg:grid-cols-3 gap-3">
        <div className="card-elevated p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              12-week momentum
            </div>
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          <div className="mt-4 flex items-end gap-1.5 h-24">
            {sparkline.map((v, i) => (
              <div
                key={i}
                className="flex-1 rounded-sm bg-primary transition-all"
                style={{
                  height: `${Math.max(8, (v / 100) * 100)}%`,
                  opacity: 0.3 + (i / sparkline.length) * 0.7,
                }}
                title={`Week -${sparkline.length - 1 - i}: ${v}`}
              />
            ))}
          </div>
        </div>
        <div className="card-elevated p-5">
          <div className="flex items-center justify-between">
            <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Recovery balance
            </div>
            <Heart className="h-4 w-4 text-ember" />
          </div>
          <div className="mt-3 font-display font-bold text-3xl">
            {recoveryAvg ? `${recoveryAvg}/5` : "—"}
          </div>
          <div className="mt-2 h-2 rounded-full bg-surface-2">
            <div
              className="h-full rounded-full bg-ember"
              style={{ width: `${(recoveryAvg / 5) * 100}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {recoveryAvg >= 3.5
              ? "Body's ready — push intensity."
              : recoveryAvg > 0
              ? "Protect sleep this week."
              : "Log recovery to see this."}
          </p>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-3">
        <Card title="What went well" tone="primary" body={wentWell} />
        <Card title="What could improve" tone="ember" body={couldImprove} />
        <Card title="Suggested focus" tone="primary" body={focus} />
      </section>

      {/* === Carry-forward commitments === */}
      <section className="card-elevated p-5 md:p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-mono text-xs uppercase tracking-wider text-primary">
              Lock next week
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Pick what you'll defend. We'll surface it on Today.
            </p>
          </div>
          <button
            onClick={lockIn}
            className="rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-bold shadow-[0_10px_30px_-10px_var(--color-primary)] press"
          >
            Lock in
          </button>
        </div>
        <div className="mt-4 grid gap-2">
          {NEXT_WEEK.map((c) => {
            const on = !!commitments[c.id];
            return (
              <button
                key={c.id}
                onClick={() => toggle(c.id)}
                className={`flex items-center justify-between rounded-xl border p-4 text-left transition-all press ${
                  on
                    ? "border-primary bg-primary/10"
                    : "border-border bg-surface-2/40 hover:bg-surface-2"
                }`}
              >
                <div>
                  <div className="font-display font-bold">{c.label}</div>
                  <Link
                    to={c.to}
                    onClick={(e) => e.stopPropagation()}
                    className="text-xs text-primary mt-0.5 inline-block"
                  >
                    Open →
                  </Link>
                </div>
                <span
                  className={`grid h-7 w-7 place-items-center rounded-full border-2 ${
                    on ? "bg-primary border-primary text-primary-foreground" : "border-border"
                  }`}
                >
                  {on && <Check className="h-4 w-4" />}
                </span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  sub: string;
}) {
  return (
    <div className="card-elevated p-4 md:p-5">
      <Icon className="h-4 w-4 text-primary" />
      <div className="mt-2 font-display font-bold text-2xl md:text-3xl count-up">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-[10px] font-mono uppercase tracking-wider text-primary mt-1">{sub}</div>
    </div>
  );
}

function Card({
  title,
  body,
  tone,
}: {
  title: string;
  body: string;
  tone: "primary" | "ember";
}) {
  return (
    <div className="card-elevated p-5">
      <div
        className={`font-mono text-[10px] uppercase tracking-wider ${
          tone === "ember" ? "text-ember" : "text-primary"
        }`}
      >
        {title}
      </div>
      <p className="mt-2 text-sm md:text-base leading-relaxed">{body}</p>
    </div>
  );
}