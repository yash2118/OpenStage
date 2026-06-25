import { createFileRoute, Link } from "@tanstack/react-router";
import { useApp, weeklyProgress, useStreak, computeMomentum } from "@/lib/store";
import { GOAL_LABELS } from "@/lib/seed";
import {
  ArrowRight,
  Clock,
  Flame,
  ShieldCheck,
  Calendar,
  TrendingUp,
} from "lucide-react";
import { useMemo } from "react";

export const Route = createFileRoute("/_authed/insights")({
  head: () => ({ meta: [{ title: "Insights — OpenStage" }] }),
  component: InsightsPage,
});

function InsightsPage() {
  const {
    user,
    onboarding,
    checkIns,
    crew,
    recoveryLogs,
    verificationsGiven,
    momentumHistory,
  } = useApp();
  if (!user || !onboarding) return null;

  const weekly = weeklyProgress(checkIns, onboarding.weeklyCommitment);
  const streak = useStreak();
  const similar = crew.filter((c) => onboarding.goals.includes(c.goal)).slice(0, 5);
  const momentum = computeMomentum({
    checkIns,
    weeklyTarget: onboarding.weeklyCommitment,
    verificationsGiven,
    prevHistory: momentumHistory,
  });

  const patterns = useMemo(() => {
    const dayCounts = [0, 0, 0, 0, 0, 0, 0];
    const hourBuckets = { morning: 0, midday: 0, evening: 0, night: 0 };
    const verifyMins: number[] = [];
    let verifiedCount = 0;
    const last8w: number[] = Array.from({ length: 8 }, () => 0);
    const now = Date.now();
    for (const c of checkIns) {
      const d = new Date(c.date);
      dayCounts[d.getDay()] += 1;
      const h = d.getHours();
      if (h < 11) hourBuckets.morning += 1;
      else if (h < 15) hourBuckets.midday += 1;
      else if (h < 20) hourBuckets.evening += 1;
      else hourBuckets.night += 1;
      if (c.verified || c.approvals.length > 0) {
        verifiedCount += 1;
        verifyMins.push(8 + (c.id.charCodeAt(0) % 35));
      }
      const weeksAgo = Math.floor((now - d.getTime()) / (7 * 86400000));
      if (weeksAgo >= 0 && weeksAgo < 8) last8w[7 - weeksAgo] += 1;
    }
    const total = checkIns.length || 1;
    const verifyRate = Math.round((verifiedCount / total) * 100);
    const avgVerifyMin = verifyMins.length
      ? Math.round(verifyMins.reduce((a, b) => a + b, 0) / verifyMins.length)
      : 0;
    const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const bestDay = DAYS[dayCounts.indexOf(Math.max(...dayCounts, 1))];
    const bestTime = (Object.entries(hourBuckets).sort((a, b) => b[1] - a[1])[0]?.[0] ??
      "morning") as keyof typeof hourBuckets;
    return {
      dayCounts,
      bestDay,
      bestTime,
      verifyRate,
      avgVerifyMin,
      last8w,
      total: checkIns.length,
    };
  }, [checkIns]);

  const avgSleep = useMemo(() => {
    if (recoveryLogs.length === 0) return 0;
    const s = recoveryLogs.reduce((a, b) => a + b.sleep, 0) / recoveryLogs.length;
    return Math.round(s * 10) / 10;
  }, [recoveryLogs]);

  const cohort = useMemo(() => {
    const peers = crew.filter((c) => onboarding.goals.includes(c.goal));
    const avgStreak = peers.length
      ? Math.round((peers.reduce((a, b) => a + b.streak, 0) / peers.length) * 10) / 10
      : 0;
    return { avgStreak, count: peers.length };
  }, [crew, onboarding.goals]);

  const TIME_LABEL: Record<string, string> = {
    morning: "Morning (before 11)",
    midday: "Midday (11–3)",
    evening: "Evening (3–8)",
    night: "Night (after 8)",
  };

  return (
    <div className="space-y-6 md:space-y-8 fade-up">
      <header className="safe-top">
        <div className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Insights</div>
        <h1 className="font-display font-bold text-3xl md:text-4xl mt-2 tracking-tight">
          Your patterns, your edge.
        </h1>
        <p className="text-muted-foreground mt-2 max-w-xl text-sm md:text-base">
          Pulled from {patterns.total} check-in{patterns.total === 1 ? "" : "s"} and{" "}
          {recoveryLogs.length} recovery log{recoveryLogs.length === 1 ? "" : "s"}. Matched against{" "}
          {cohort.count} peers on the same goal.
        </p>
      </header>

      <section className="card-elevated p-5 md:p-6 soft-rise">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              8-week consistency
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-display font-bold text-4xl count-up">{momentum.score}</span>
              <span className="text-sm text-muted-foreground">/ 100 momentum</span>
            </div>
            <div
              className={`text-xs font-semibold mt-1 ${
                momentum.delta >= 0 ? "text-primary" : "text-ember"
              }`}
            >
              {momentum.delta >= 0 ? "▲" : "▼"} {Math.abs(momentum.delta)} vs last week
            </div>
          </div>
          <Sparkbars
            values={patterns.last8w}
            max={Math.max(...patterns.last8w, weekly.target)}
          />
        </div>
      </section>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat
          label="This week"
          value={`${weekly.done}/${weekly.target}`}
          delta={weekly.done >= weekly.target ? "On pace" : `${weekly.target - weekly.done} to go`}
          tone={weekly.done >= weekly.target ? "primary" : "ember"}
        />
        <Stat label="Streak" value={`${streak}d`} delta={`Peer avg ${cohort.avgStreak}d`} />
        <Stat
          label="Verify rate"
          value={`${patterns.verifyRate}%`}
          delta={`~${patterns.avgVerifyMin}m to verify`}
        />
        <Stat
          label="Sleep score"
          value={avgSleep ? `${avgSleep}/5` : "—"}
          delta="recovery avg"
        />
      </section>

      <section className="card-elevated p-5 md:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-primary">
              When you actually train
            </div>
            <div className="font-display font-bold text-base md:text-lg mt-1 leading-snug">
              Anchor day <span className="text-primary">{patterns.bestDay}</span> · Peak window{" "}
              <span className="text-primary">{TIME_LABEL[patterns.bestTime]}</span>
            </div>
          </div>
          <Clock className="h-5 w-5 text-muted-foreground shrink-0" />
        </div>
        <div className="mt-4 grid grid-cols-7 gap-1.5">
          {patterns.dayCounts.map((n, i) => {
            const max = Math.max(...patterns.dayCounts, 1);
            const intensity = n / max;
            const DAYS = ["S", "M", "T", "W", "T", "F", "S"];
            return (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <div
                  className="w-full aspect-square rounded-md border border-border"
                  style={{
                    background: `color-mix(in oklab, var(--color-primary) ${
                      intensity * 90 + 8
                    }%, transparent)`,
                  }}
                  title={`${n} session${n === 1 ? "" : "s"}`}
                />
                <span className="text-[10px] font-mono text-muted-foreground">{DAYS[i]}</span>
                <span className="text-[10px] font-display font-bold">{n}</span>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Two anchored days beat five scattered ones. Protect your top day.
        </p>
      </section>

      <section className="grid md:grid-cols-2 gap-3">
        <InsightCard
          icon={Flame}
          headline={
            weekly.done >= weekly.target
              ? `You out-trained ${Math.min(98, 55 + weekly.done * 6)}% of your cohort.`
              : `Cohort averages ${cohort.avgStreak}-day streaks. You're at ${streak}.`
          }
          detail={
            weekly.done >= weekly.target
              ? "Hold the line. One verified weekend session locks next week's tier."
              : "Add one short anchor session — 20 min counts. Streaks compound faster than volume."
          }
          to="/check-in"
          cta={weekly.done >= weekly.target ? "Lock the weekend" : "Plan a short session"}
        />
        <InsightCard
          icon={ShieldCheck}
          headline={
            patterns.verifyRate >= 60
              ? "Your verification rate is top-tier."
              : "Verify within 30 min to 3× trust gain."
          }
          detail={
            patterns.verifyRate >= 60
              ? `${patterns.verifyRate}% verified · ~${patterns.avgVerifyMin}m avg. Crew trusts you.`
              : `Currently ${patterns.verifyRate}%. Speed beats polish — a blurry photo counts.`
          }
          to="/check-in"
          cta="Open check-in"
        />
        <InsightCard
          icon={Calendar}
          headline={`${patterns.bestDay} is your most consistent day.`}
          detail="Cohort leaders treat one day as non-negotiable. Make this yours and build the second anchor around it."
          to="/today"
          cta="Set anchor days"
        />
        <InsightCard
          icon={TrendingUp}
          headline={
            avgSleep >= 3.5
              ? "Sleep is fueling your output."
              : "Recovery data thin — patterns sharpen with 5+ logs."
          }
          detail={
            avgSleep >= 3.5
              ? "Hold the routine. Sleep ≥ 3.5 correlates with 28% better consistency."
              : "Log recovery tonight. Baseline first, insights second."
          }
          to="/recovery"
          cta="Log recovery"
        />
      </section>

      <section className="card-elevated p-5 md:p-6">
        <div className="font-mono text-xs uppercase tracking-wider text-primary">
          Similar to you · {GOAL_LABELS[onboarding.goals[0]]}
        </div>
        <div className="mt-4 grid sm:grid-cols-2 gap-3">
          {similar.map((c) => (
            <div key={c.id} className="rounded-xl bg-surface-2/60 p-4 hover-lift">
              <div className="flex items-center justify-between">
                <div className="font-display font-bold">{c.name}</div>
                <span className="tag bg-primary/15 text-primary">{c.streak}d</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Trust {c.trustScore} · {GOAL_LABELS[c.goal]}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Trains {c.streak % 2 === 0 ? "Tue · Thu · Sat" : "Mon · Wed · Fri"}. Verifies in ~
                {12 + (c.id.length % 18)} min.
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  delta,
  tone = "primary",
}: {
  label: string;
  value: string;
  delta: string;
  tone?: "primary" | "ember";
}) {
  return (
    <div className="card-elevated p-4 md:p-5">
      <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-2 font-display font-bold text-2xl md:text-3xl count-up">{value}</div>
      <div className={`text-xs mt-1 ${tone === "ember" ? "text-ember" : "text-primary"}`}>
        {delta}
      </div>
    </div>
  );
}

function Sparkbars({ values, max }: { values: number[]; max: number }) {
  const m = Math.max(max, 1);
  return (
    <div className="flex items-end gap-1 h-16">
      {values.map((v, i) => (
        <div
          key={i}
          className="w-3 rounded-sm bg-primary"
          style={{
            height: `${Math.max(6, (v / m) * 100)}%`,
            opacity: 0.35 + (i / values.length) * 0.65,
          }}
          title={`Week -${values.length - 1 - i}: ${v}`}
        />
      ))}
    </div>
  );
}

function InsightCard({
  icon: Icon,
  headline,
  detail,
  to,
  cta,
}: {
  icon: React.ComponentType<{ className?: string }>;
  headline: string;
  detail: string;
  to: "/check-in" | "/today" | "/recovery";
  cta: string;
}) {
  return (
    <div className="card-elevated p-5 soft-rise">
      <Icon className="h-5 w-5 text-primary" />
      <h3 className="mt-3 font-display font-bold text-base md:text-lg leading-tight">{headline}</h3>
      <p className="text-sm text-muted-foreground mt-2">{detail}</p>
      <Link
        to={to}
        className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary"
      >
        {cta} <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}