import { createFileRoute, Link } from "@tanstack/react-router";
import {
  useApp,
  useStreak,
  weeklyProgress,
  seedLeaderboard,
  seedStrategies,
  useDailyQuest,
  isQuestClaimedToday,
  useDailyMission,
  computeMomentum,
  trustTier,
} from "@/lib/store";
import { GOAL_LABELS } from "@/lib/seed";
import { Avatar } from "@/components/AppShell";
import {
  CheckCircle2,
  ShieldCheck,
  Trophy,
  Sparkles,
  Flame,
  ArrowRight,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  Gift,
  Check,
  Shield,
  Heart,
  Target,
  Lock as LockIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authed/today")({
  head: () => ({ meta: [{ title: "Today — OpenStage" }] }),
  component: Today,
});

function Today() {
  const {
    user,
    onboarding,
    checkIns,
    pending,
    crew,
    trustScore,
    xp,
    questClaimedDate,
    claimDailyQuest,
    verificationsGiven,
    momentumHistory,
    futureSelf,
    protectionTokens,
    protectionsUsed,
    useProtectionToken,
    missions,
    completeMission,
  } = useApp();
  const streak = useStreak();
  const weekly = weeklyProgress(checkIns, onboarding?.weeklyCommitment ?? 4);
  const today = new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
  const youRank = 4 + Math.max(0, 3 - weekly.done);
  const quest = useDailyQuest();
  const questDone = isQuestClaimedToday(questClaimedDate);
  const mission = useDailyMission(onboarding?.goals?.[0]);
  const missionDoneToday = missions.some((m) => m.date === new Date().toISOString().slice(0, 10) && m.completed);
  const momentum = computeMomentum({
    checkIns,
    weeklyTarget: onboarding?.weeklyCommitment ?? 4,
    verificationsGiven,
    prevHistory: momentumHistory,
  });
  const tier = trustTier(trustScore);
  const streakDropped = streak === 0 && checkIns.length > 0;
  const showFutureSelf = futureSelf && (streakDropped || weekly.done === 0);
  const todayKey = new Date().toISOString().slice(0, 10);
  const protectedToday = protectionsUsed.includes(todayKey);

  if (!user || !onboarding) return null;

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-primary">{today}</div>
          <h1 className="font-display font-bold text-3xl md:text-4xl mt-2 tracking-tight">
            Hey {user.name.split(" ")[0]}. Ready to make today count?
          </h1>
          <p className="text-muted-foreground mt-1">
            {weekly.done < weekly.target
              ? `${weekly.target - weekly.done} check-in${weekly.target - weekly.done === 1 ? "" : "s"} to hit your weekly target.`
              : "You've hit your weekly target. Anything else this week is bonus."}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Stat icon={Flame} value={streak} label="day streak" tone="ember" />
          <Stat icon={ShieldCheck} value={`${trustScore}`} label={tier.name.split(" ")[0].toLowerCase()} />
          <Stat icon={Sparkles} value={xp} label="XP" />
        </div>
      </header>

      <MobileDailyCarousel
        mission={mission}
        missionDone={missionDoneToday}
        weekly={weekly}
        pendingCount={pending.length}
        rankDelta={Math.max(1, weekly.done) - 2}
        rank={youRank}
        streak={streak}
        momentum={momentum.score}
      />

      <MomentumCard momentum={momentum} history={momentumHistory} />

      {showFutureSelf && futureSelf && <FutureSelfCard message={futureSelf.text} />}

      <CoachCard streak={streak} weekly={weekly} pendingCount={pending.length} lastCheckIn={checkIns[0]?.date} />

      <DailyMissionCard
        mission={mission}
        completed={missionDoneToday}
        onComplete={() => {
          const r = completeMission(mission.id);
          if (r > 0) toast.success(`Mission complete · +${r} XP`);
        }}
      />

      <StreakProtectionCard
        tokens={protectionTokens}
        protectedToday={protectedToday}
        atRisk={streak >= 3 && weekly.done === 0}
        onProtect={() => {
          const ok = useProtectionToken();
          if (ok) toast.success("Your consistency is protected. Streak intact.");
          else toast.error("No tokens available — verify Crew members to earn them.");
        }}
      />

      <DailyQuestCard
        quest={quest}
        claimed={questDone}
        onClaim={() => {
          const r = claimDailyQuest();
          if (r > 0) toast.success(`Daily Quest complete · +${r} XP`);
        }}
      />

      <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <ActionCard
          to="/check-in"
          tone="primary"
          icon={CheckCircle2}
          title="Check in now"
          body="30 seconds. What. How hard. Proof."
        />
        <ActionCard
          to="/community"
          icon={Users2}
          title="Verify check-ins"
          body={`${pending.length} from your Crew`}
          badge={pending.length > 0 ? pending.length : undefined}
        />
        <ActionCard
          to="/insights"
          icon={Target}
          title="Similar to you"
          body={`#${youRank} in cohort · see patterns`}
        />
        <ActionCard
          to="/weekly-review"
          icon={Sparkles}
          title="Weekly review"
          body="Sunday report · what worked"
        />
      </section>

      <section className="grid lg:grid-cols-3 gap-4">
        <div className="card-elevated p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-mono text-xs uppercase tracking-wider text-primary">Today module</div>
              <h2 className="font-display font-bold text-2xl mt-1">Suggested session</h2>
            </div>
            <Link
              to="/check-in"
              className="inline-flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground px-3 py-1.5 text-xs font-semibold"
            >
              Start <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="mt-5 grid sm:grid-cols-3 gap-3">
            <Info label="Focus" value="Push — chest & shoulders" />
            <Info label="Duration" value="45 min" />
            <Info label="Intensity" value="RPE 7" />
          </div>
          <div className="mt-5 grid sm:grid-cols-2 gap-2 text-sm">
            {[
              "Bench press 4×6",
              "Overhead press 3×8",
              "Incline DB press 3×10",
              "Cable fly 3×12",
              "Triceps pushdown 3×12",
              "Optional 10 min cardio finisher",
            ].map((t) => (
              <div key={t} className="flex items-center gap-2 rounded-lg bg-surface-2/60 px-3 py-2">
                <Check className="h-3.5 w-3.5 text-primary" />
                <span>{t}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card-elevated p-6">
          <div className="font-mono text-xs uppercase tracking-wider text-primary">Weekly target</div>
          <div className="mt-2 font-display font-bold text-4xl">
            {weekly.done}<span className="text-muted-foreground text-2xl">/{weekly.target}</span>
          </div>
          <div className="h-2 bg-surface-2 rounded-full mt-3 overflow-hidden">
            <div className="h-full bg-primary transition-all" style={{ width: `${weekly.pct}%` }} />
          </div>
          <div className="mt-6 space-y-2">
            {(onboarding.trainingDays ?? []).map((d) => (
              <div key={d} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{d}</span>
                <span className="font-mono text-xs">
                  {Math.random() > 0.5 ? "✓" : "—"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid lg:grid-cols-2 gap-4">
        <div className="card-elevated p-6">
          <div className="flex items-center justify-between">
            <div className="font-mono text-xs uppercase tracking-wider text-primary">Your crew</div>
            <Link to="/community" className="text-xs text-muted-foreground hover:text-foreground">
              Manage →
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {crew.slice(0, 4).map((c) => (
              <div key={c.id} className="flex items-center gap-3">
                <Avatar name={c.name} color={c.avatarColor} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">{c.name}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {GOAL_LABELS[c.goal]} · {c.streak}d streak
                  </div>
                </div>
                <span className="tag bg-surface-2 text-muted-foreground">
                  <ShieldCheck className="h-3 w-3" /> {c.trustScore}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="card-elevated p-6">
          <div className="flex items-center justify-between">
            <div className="font-mono text-xs uppercase tracking-wider text-primary">From people like you</div>
            <Link to="/assistant" className="text-xs text-muted-foreground hover:text-foreground">
              All strategies →
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {seedStrategies.slice(0, 2).map((s) => (
              <div key={s.id} className="rounded-xl bg-surface-2/40 p-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="tag bg-primary/10 text-primary">{s.tag}</span>
                  <span>{s.cohortPct}% of {s.source.toLowerCase()}</span>
                </div>
                <div className="mt-2 font-display font-bold">{s.title}</div>
                <p className="text-sm text-muted-foreground mt-1">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <LiveLeaderboard userName={user.name} />
    </div>
  );
}

function Stat({
  icon: Icon,
  value,
  label,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: string | number;
  label: string;
  tone?: "ember";
}) {
  return (
    <div className="card-elevated px-4 py-3 flex items-center gap-3">
      <Icon className={`h-5 w-5 ${tone === "ember" ? "text-ember" : "text-primary"}`} />
      <div>
        <div className="font-display font-bold text-xl leading-none">{value}</div>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">{label}</div>
      </div>
    </div>
  );
}

function ActionCard({
  to,
  icon: Icon,
  title,
  body,
  tone,
  badge,
}: {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
  tone?: "primary";
  badge?: number;
}) {
  return (
    <Link
      to={to}
      className={`group card-elevated p-5 transition hover:-translate-y-0.5 ${
        tone === "primary" ? "bg-primary text-primary-foreground border-transparent shadow-[0_8px_32px_-8px_var(--color-primary)]" : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <Icon className={`h-6 w-6 ${tone === "primary" ? "" : "text-primary"}`} />
        {badge ? (
          <span className="tag bg-ember text-ember-foreground">{badge} new</span>
        ) : (
          <ArrowRight className="h-4 w-4 opacity-50 group-hover:opacity-100 transition" />
        )}
      </div>
      <div className="mt-6 font-display font-bold text-lg leading-tight">{title}</div>
      <p className={`text-sm mt-1 ${tone === "primary" ? "opacity-80" : "text-muted-foreground"}`}>{body}</p>
    </Link>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface-2/60 p-3">
      <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 font-display font-semibold">{value}</div>
    </div>
  );
}

function Users2({ className }: { className?: string }) {
  return <ShieldCheck className={className} />;
}

// Keep an unused import out
void Clock;

/* ===== Coach (contextual assistant) ===== */
function CoachCard({
  streak,
  weekly,
  pendingCount,
  lastCheckIn,
}: {
  streak: number;
  weekly: { done: number; target: number; pct: number };
  pendingCount: number;
  lastCheckIn?: string;
}) {
  const tip = useMemo(() => {
    const hour = new Date().getHours();
    const since = lastCheckIn ? Math.floor((Date.now() - new Date(lastCheckIn).getTime()) / 36e5) : null;
    if (weekly.done >= weekly.target)
      return {
        kind: "Bonus",
        title: "You're past target — bank a mobility win.",
        body: "A 15-min walk or stretch counts. Bonus check-ins compound your trust score without burning you out.",
        cta: { label: "Log bonus session", to: "/check-in" as const },
      };
    if (pendingCount >= 2)
      return {
        kind: "Crew",
        title: `${pendingCount} Crew check-ins waiting on you.`,
        body: "Verifying within the hour earns +2 trust each and keeps your Crew tight. Quick wins, real impact.",
        cta: { label: "Verify now", to: "/community" as const },
      };
    if (since !== null && since < 2)
      return {
        kind: "Window",
        title: "You finished recently — post inside the 30-min window.",
        body: "Fast posts get verified 3× more often. Send proof to Crew while the session is still fresh.",
        cta: { label: "Post check-in", to: "/check-in" as const },
      };
    if (streak >= 3 && weekly.done < weekly.target)
      return {
        kind: "Streak",
        title: `Protect your ${streak}-day streak with one easy win.`,
        body: "Don't chase a hero session today. A short, honest check-in keeps the chain alive.",
        cta: { label: "Start light", to: "/check-in" as const },
      };
    if (hour < 11)
      return {
        kind: "Morning",
        title: "Mornings have the highest finish rate.",
        body: "Cohort data: people who train before 11am hit their weekly target 38% more often. Lock the slot.",
        cta: { label: "Plan it", to: "/assistant" as const },
      };
    if (hour >= 18)
      return {
        kind: "Evening",
        title: "Evening session — keep RPE 6–7.",
        body: "Late high-intensity work hurts sleep. Aim for steady effort and log it before the day closes.",
        cta: { label: "Start session", to: "/check-in" as const },
      };
    return {
      kind: "Coach",
      title: "One check-in moves your rank tonight.",
      body: `You're ${weekly.target - weekly.done} away from target. The fastest unlock is your next post.`,
      cta: { label: "Check in", to: "/check-in" as const },
    };
  }, [streak, weekly.done, weekly.target, pendingCount, lastCheckIn]);

  return (
    <section className="card-elevated p-5 sm:p-6 fade-up relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-50 grid-dot-bg" />
      <div className="relative flex items-start gap-4">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground glow-pulse">
          <Sparkles className="h-5 w-5" />
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">Coach · {tip.kind}</span>
            <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-primary live-dot" /> live
            </span>
          </div>
          <h3 className="font-display font-bold text-lg sm:text-xl mt-1.5 leading-tight">{tip.title}</h3>
          <p className="text-sm text-muted-foreground mt-1">{tip.body}</p>
          <Link
            to={tip.cta.to}
            className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground px-3.5 py-1.5 text-xs font-semibold hover:opacity-90"
          >
            {tip.cta.label} <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ===== Daily Quest ===== */
function DailyQuestCard({
  quest,
  claimed,
  onClaim,
}: {
  quest: { id: string; title: string; detail: string; emoji: string; reward: number };
  claimed: boolean;
  onClaim: () => void;
}) {
  return (
    <section className="card-elevated p-5 sm:p-6 fade-up">
      <div className="flex items-start gap-4">
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-ember/15 text-3xl">
          {quest.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ember">Daily Quest</span>
            <span className="tag bg-ember/10 text-ember">+{quest.reward} XP</span>
          </div>
          <h3 className="font-display font-bold text-lg sm:text-xl mt-1.5">{quest.title}</h3>
          <p className="text-sm text-muted-foreground mt-1">{quest.detail}</p>
        </div>
        <button
          onClick={onClaim}
          disabled={claimed}
          className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition ${
            claimed
              ? "bg-surface-2 text-muted-foreground cursor-default"
              : "bg-primary text-primary-foreground hover:opacity-90 glow-primary"
          }`}
        >
          {claimed ? (
            <>
              <Check className="h-3.5 w-3.5" /> Claimed
            </>
          ) : (
            <>
              <Gift className="h-3.5 w-3.5" /> Claim
            </>
          )}
        </button>
      </div>
    </section>
  );
}

/* ===== Live Leaderboard with animated rank updates ===== */
function LiveLeaderboard({ userName }: { userName: string }) {
  // Build initial state from seed; "you" is at rank 4.
  const initial = seedLeaderboard.slice(0, 6).map((r, i) => ({
    ...r,
    isYou: i === 3,
    delta: 0 as number,
  }));
  const [rows, setRows] = useState(initial);
  const [pulseId, setPulseId] = useState<number | null>(null);

  useEffect(() => {
    // Simulate live updates: every 6s, "you" gains a position, then later a peer overtakes.
    let step = 0;
    const id = setInterval(() => {
      step++;
      setRows((prev) => {
        const next = [...prev];
        const youIdx = next.findIndex((r) => r.isYou);
        if (step % 2 === 1 && youIdx > 0) {
          // swap you upward
          const above = next[youIdx - 1];
          next[youIdx - 1] = { ...next[youIdx], delta: 1 };
          next[youIdx] = { ...above, delta: -1 };
        } else if (youIdx < next.length - 1) {
          // a peer overtakes
          const below = next[youIdx + 1];
          next[youIdx + 1] = { ...next[youIdx], delta: -1 };
          next[youIdx] = { ...below, delta: 1 };
        }
        return next.map((r, i) => ({ ...r, rank: i + 1 }));
      });
      setPulseId(Date.now());
    }, 6000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="card-elevated p-6">
      <div className="flex items-center justify-between">
        <div className="font-mono text-xs uppercase tracking-wider text-primary inline-flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-primary live-dot" />
          Live cohort leaderboard
        </div>
        <Link to="/community" className="text-xs text-muted-foreground hover:text-foreground">
          Open community →
        </Link>
      </div>
      <div className="mt-4 divide-y divide-border">
        {rows.slice(0, 5).map((r) => (
          <div
            key={`${r.handle}-${pulseId ?? "init"}-${r.rank}`}
            className={`flex items-center gap-3 py-3 ${r.isYou ? "bg-primary/5 -mx-2 px-2 rounded-lg" : ""} ${
              r.delta > 0 ? "row-rank-up" : ""
            }`}
          >
            <span className="font-mono w-6 text-muted-foreground text-sm">#{r.rank}</span>
            <Avatar
              name={r.isYou ? userName : r.name}
              color={r.isYou ? "oklch(0.89 0.21 128)" : "oklch(0.7 0.15 240)"}
              size="sm"
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate">
                {r.isYou ? userName : r.name}{" "}
                {r.isYou && (
                  <span className="text-primary text-xs font-mono uppercase tracking-wider">you</span>
                )}
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {GOAL_LABELS[r.goal]} · {r.weeklyCheckIns}/wk
              </div>
            </div>
            <RankDelta delta={r.delta} />
            <div className="font-mono text-xs text-muted-foreground hidden sm:block">
              {r.verifiedPct}%
            </div>
            <span className="tag bg-ember/10 text-ember">
              <Flame className="h-3 w-3" /> {r.streak}d
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function RankDelta({ delta }: { delta: number }) {
  if (delta > 0)
    return (
      <span className="inline-flex items-center gap-0.5 text-[11px] font-mono font-semibold text-primary count-up">
        <TrendingUp className="h-3 w-3" /> {delta}
      </span>
    );
  if (delta < 0)
    return (
      <span className="inline-flex items-center gap-0.5 text-[11px] font-mono font-semibold text-ember count-up">
        <TrendingDown className="h-3 w-3" /> {Math.abs(delta)}
      </span>
    );
  return (
    <span className="inline-flex items-center text-[11px] font-mono text-muted-foreground">
      <Minus className="h-3 w-3" />
    </span>
  );
}

/* ===== Momentum Score ===== */
function MomentumCard({
  momentum,
  history,
}: {
  momentum: ReturnType<typeof computeMomentum>;
  history: { date: string; score: number }[];
}) {
  const pts = history.slice(-14);
  const max = 100;
  const w = 280;
  const h = 60;
  const step = pts.length > 1 ? w / (pts.length - 1) : w;
  const path = pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${i * step},${h - (p.score / max) * h}`)
    .join(" ");
  const r = 54;
  const c = 2 * Math.PI * r;
  const offset = c - (momentum.score / 100) * c;

  return (
    <section className="card-elevated p-5 sm:p-6 fade-up relative overflow-hidden">
      <div className="absolute inset-0 grid-dot-bg opacity-30 pointer-events-none" />
      <div className="relative grid lg:grid-cols-[auto_1fr] gap-6 items-center">
        <div className="flex items-center gap-5">
          <div className="relative h-32 w-32 shrink-0">
            <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
              <circle cx="60" cy="60" r={r} stroke="var(--surface-2)" strokeWidth="10" fill="none" />
              <circle
                cx="60"
                cy="60"
                r={r}
                stroke="var(--primary)"
                strokeWidth="10"
                strokeLinecap="round"
                fill="none"
                strokeDasharray={c}
                strokeDashoffset={offset}
                style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(.2,.7,.2,1)" }}
              />
            </svg>
            <div className="absolute inset-0 grid place-items-center">
              <div className="text-center">
                <div className="font-display font-bold text-3xl leading-none">{momentum.score}</div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mt-0.5">momentum</div>
              </div>
            </div>
          </div>
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">Level {momentum.level.num} · {momentum.level.name}</div>
            <div className="mt-1 font-display font-bold text-xl leading-tight">Forward, not backward.</div>
            <div className="mt-1 text-xs text-muted-foreground">
              {momentum.delta >= 0 ? "+" : ""}{momentum.delta} vs last read · trends from your week, Crew verifications, 30-day pattern, events.
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="rounded-xl bg-surface-2/50 p-4">
            <div className="font-mono text-[10px] uppercase tracking-wider text-primary">Why it changed</div>
            <ul className="mt-2 space-y-1.5 text-sm">
              {momentum.changes.slice(0, 4).map((c, i) => (
                <li key={i} className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">{c.reason}</span>
                  <span className="font-mono text-xs text-primary">+{Math.max(1, c.delta)}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl bg-surface-2/50 p-4">
            <div className="font-mono text-[10px] uppercase tracking-wider text-ember">What improves it</div>
            <ul className="mt-2 space-y-1.5 text-sm">
              {momentum.improvements.map((imp, i) => (
                <li key={i}>
                  <Link to={imp.to} className="flex items-center justify-between gap-3 hover:text-foreground text-muted-foreground">
                    <span>{imp.label}</span>
                    <span className="font-mono text-xs text-ember">+{imp.impact}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="relative mt-5">
        <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
          <span>14 day history</span>
          <span>0 — 100</span>
        </div>
        <svg viewBox={`0 0 ${w} ${h}`} className="mt-1 w-full h-16">
          <defs>
            <linearGradient id="momGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.5" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={`${path} L${(pts.length - 1) * step},${h} L0,${h} Z`} fill="url(#momGrad)" />
          <path d={path} stroke="var(--primary)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          {pts.map((p, i) => (
            <circle key={i} cx={i * step} cy={h - (p.score / max) * h} r={i === pts.length - 1 ? 3 : 1.5} fill="var(--primary)" />
          ))}
        </svg>
      </div>
    </section>
  );
}

function FutureSelfCard({ message }: { message: string }) {
  return (
    <section className="card-elevated p-5 sm:p-6 fade-up relative overflow-hidden border-ember/40">
      <div className="flex items-start gap-4">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-ember/15 text-ember">
          <Heart className="h-5 w-5" />
        </span>
        <div className="flex-1 min-w-0">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-ember">Note from your past self</div>
          <p className="mt-2 font-display text-lg leading-snug italic">"{message}"</p>
          <div className="mt-3 flex gap-2 flex-wrap">
            <Link to="/check-in" className="rounded-full bg-primary text-primary-foreground px-4 py-1.5 text-xs font-semibold">
              One small step today
            </Link>
            <Link to="/passport" className="rounded-full border border-border px-4 py-1.5 text-xs font-semibold hover:bg-accent">
              Update message
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function DailyMissionCard({
  mission,
  completed,
  onComplete,
}: {
  mission: { title: string; detail: string; emoji: string; reward: number };
  completed: boolean;
  onComplete: () => void;
}) {
  return (
    <section className="card-elevated p-5 sm:p-6 fade-up">
      <div className="flex items-start gap-4">
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-primary/15 text-3xl">
          {mission.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">Daily Mission</span>
            <span className="tag bg-primary/10 text-primary">+{mission.reward} XP</span>
          </div>
          <h3 className="font-display font-bold text-lg sm:text-xl mt-1.5">{mission.title}</h3>
          <p className="text-sm text-muted-foreground mt-1">{mission.detail}</p>
        </div>
        <button
          onClick={onComplete}
          disabled={completed}
          className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition ${
            completed
              ? "bg-surface-2 text-muted-foreground cursor-default"
              : "bg-primary text-primary-foreground hover:opacity-90 glow-primary"
          }`}
        >
          {completed ? (<><Check className="h-3.5 w-3.5" /> Done</>) : (<>Mark done</>)}
        </button>
      </div>
    </section>
  );
}

function StreakProtectionCard({
  tokens,
  protectedToday,
  atRisk,
  onProtect,
}: {
  tokens: number;
  protectedToday: boolean;
  atRisk: boolean;
  onProtect: () => void;
}) {
  if (!atRisk && !protectedToday && tokens > 0) {
    return (
      <section className="card-elevated p-4 flex items-center gap-3 fade-up">
        <Shield className="h-5 w-5 text-primary" />
        <div className="flex-1 min-w-0 text-sm">
          <div className="font-semibold">{tokens} streak protection token{tokens === 1 ? "" : "s"} ready.</div>
          <div className="text-xs text-muted-foreground">Earn one for every 5 Crew verifications. Spend on a missed day.</div>
        </div>
        <div className="flex gap-1">
          {Array.from({ length: Math.min(5, tokens) }).map((_, i) => (
            <span key={i} className="h-2.5 w-2.5 rounded-full bg-primary glow-primary" />
          ))}
        </div>
      </section>
    );
  }
  if (protectedToday) {
    return (
      <section className="card-elevated p-4 flex items-center gap-3 fade-up border-primary/40">
        <Shield className="h-5 w-5 text-primary" />
        <div className="text-sm font-semibold">Your consistency is protected today.</div>
      </section>
    );
  }
  if (atRisk) {
    return (
      <section className="card-elevated p-5 fade-up border-ember/40">
        <div className="flex items-start gap-3">
          <LockIcon className="h-5 w-5 text-ember mt-0.5" />
          <div className="flex-1">
            <div className="font-display font-bold">Tough day? You can protect your streak.</div>
            <p className="text-sm text-muted-foreground mt-1">
              You have {tokens} token{tokens === 1 ? "" : "s"}. Spend one to keep your chain alive — no shame.
            </p>
            <button
              onClick={onProtect}
              disabled={tokens === 0}
              className="mt-3 rounded-full bg-ember text-ember-foreground px-4 py-1.5 text-xs font-semibold disabled:opacity-50"
            >
              Spend a token
            </button>
          </div>
        </div>
      </section>
    );
  }
  return null;
}

/* ===== Mobile-only swipeable daily carousel ===== */
function MobileDailyCarousel({
  mission,
  missionDone,
  weekly,
  pendingCount,
  rank,
  rankDelta,
  streak,
  momentum,
}: {
  mission: { id: string; title: string; detail: string; emoji: string };
  missionDone: boolean;
  weekly: { done: number; target: number; pct: number };
  pendingCount: number;
  rank: number;
  rankDelta: number;
  streak: number;
  momentum: number;
}) {
  const [idx, setIdx] = useState(0);
  const cards = [
    {
      tag: "Today mission",
      emoji: mission.emoji,
      title: mission.title,
      body: mission.detail,
      cta: missionDone ? "Completed today" : "Mark complete",
      to: "/today",
      tone: "bg-gradient-to-br from-primary/25 via-primary/5 to-transparent",
    },
    {
      tag: "Check-in status",
      emoji: weekly.done >= weekly.target ? "✅" : "⏱️",
      title:
        weekly.done >= weekly.target
          ? "Week target hit"
          : `${weekly.target - weekly.done} to weekly target`,
      body: `${weekly.done}/${weekly.target} this week · momentum ${momentum}`,
      cta: "Start 60-sec check-in",
      to: "/check-in",
      tone: "bg-gradient-to-br from-ember/25 via-ember/5 to-transparent",
    },
    {
      tag: "Crew requests",
      emoji: "🛡️",
      title: pendingCount > 0 ? `${pendingCount} waiting on you` : "Crew is clear",
      body:
        pendingCount > 0
          ? "Verify Crew check-ins to earn trust and tokens."
          : "Your Crew is clear. Verify later or invite a partner.",
      cta: pendingCount > 0 ? "Verify now" : "Open Crew",
      to: "/community",
      tone: "bg-gradient-to-br from-chart-3/30 via-chart-3/5 to-transparent",
    },
    {
      tag: "Rank movement",
      emoji: rankDelta > 0 ? "📈" : rankDelta < 0 ? "📉" : "➖",
      title: `You're #${rank} in your cohort`,
      body:
        rankDelta > 0
          ? `Up ${rankDelta} this week — keep the chain.`
          : rankDelta < 0
            ? `Down ${Math.abs(rankDelta)} — one check-in turns it.`
            : "Holding rank. One bonus session pushes you up.",
      cta: "See rankings",
      to: "/insights",
      tone: "bg-gradient-to-br from-chart-2/25 via-chart-2/5 to-transparent",
    },
    {
      tag: "Assistant tip",
      emoji: "💡",
      title:
        streak === 0
          ? "Your next rep is just showing up."
          : streak < 3
            ? "Day three is where it sticks."
            : "Protect what you've built today.",
      body: "One thing now beats a perfect plan later.",
      cta: "Ask the coach",
      to: "/assistant",
      tone: "bg-gradient-to-br from-chart-5/25 via-chart-5/5 to-transparent",
    },
  ];

  return (
    <section className="md:hidden -mx-4">
      <div className="flex items-center justify-between px-4 mb-2">
        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          Today · swipe
        </div>
        <div className="flex gap-1.5">
          {cards.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${i === idx ? "w-5 bg-primary" : "w-1.5 bg-muted"}`}
            />
          ))}
        </div>
      </div>
      <div
        className="flex gap-3 overflow-x-auto px-4 pb-3 snap-x-mandatory no-scrollbar"
        onScroll={(e) => {
          const el = e.currentTarget;
          const w = el.clientWidth - 16;
          setIdx(Math.round(el.scrollLeft / w));
        }}
      >
        {cards.map((c, i) => (
          <Link
            key={i}
            to={c.to}
            className={`snap-center-strong shrink-0 w-[85%] rounded-3xl border border-border p-5 ${c.tone} relative overflow-hidden active:scale-[0.98]`}
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
                {c.tag}
              </span>
              <span className="text-2xl">{c.emoji}</span>
            </div>
            <div className="mt-4 font-display font-extrabold text-xl leading-tight">
              {c.title}
            </div>
            <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{c.body}</p>
            <div className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-foreground/90 text-background px-3.5 py-1.5 text-xs font-bold">
              {c.cta} <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}