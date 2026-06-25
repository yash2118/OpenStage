import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  useApp,
  useDailyMission,
  computeMomentum,
  computeStreak,
  trustTier,
} from "@/lib/store";
import {
  Trophy,
  Shield,
  Flame,
  Sparkles,
  Target,
  Star,
  Lock,
  Check,
  ArrowRight,
  Palette,
  Zap,
} from "lucide-react";

export const Route = createFileRoute("/_authed/rewards")({
  head: () => ({
    meta: [
      { title: "Rewards & Journey — OpenStage" },
      {
        name: "description",
        content:
          "Track your Momentum, daily mission, streak shields, journey level, and badge collection.",
      },
    ],
  }),
  component: RewardsPage,
});

const JOURNEY = [
  { num: 1, name: "Started", min: 0, blurb: "First steps. Show up once." },
  { num: 2, name: "Showing Up", min: 25, blurb: "Two real weeks of effort." },
  { num: 3, name: "Consistent", min: 45, blurb: "Habits are forming." },
  { num: 4, name: "Reliable", min: 62, blurb: "Crew can count on you." },
  { num: 5, name: "Crew Leader", min: 78, blurb: "You set the pace." },
  { num: 6, name: "Unstoppable", min: 90, blurb: "Top 1% of accountability." },
] as const;

const THEMES = [
  { id: "default", name: "Stage", unlockAt: 0, swatch: ["#0ea5e9", "#22d3ee"] },
  { id: "ember", name: "Ember", unlockAt: 200, swatch: ["#f97316", "#ef4444"] },
  { id: "forest", name: "Forest", unlockAt: 600, swatch: ["#22c55e", "#14b8a6"] },
  { id: "violet", name: "Violet", unlockAt: 1200, swatch: ["#8b5cf6", "#ec4899"] },
  { id: "gold", name: "Gold Card", unlockAt: 2400, swatch: ["#facc15", "#f97316"] },
] as const;

const BADGES = [
  { id: "first", name: "First Step", emoji: "👟", req: (s: any) => s.checkIns.length >= 1 },
  { id: "week", name: "Full Week", emoji: "🗓️", req: (s: any) => s.streak >= 7 },
  { id: "verified5", name: "Verified x5", emoji: "🛡️", req: (s: any) => s.verifiedCount >= 5 },
  { id: "trusted", name: "Trusted Partner", emoji: "🤝", req: (s: any) => s.verificationsGiven >= 5 },
  { id: "month", name: "30-Day Build", emoji: "🏗️", req: (s: any) => s.streak >= 30 },
  { id: "momentum75", name: "Momentum 75+", emoji: "🚀", req: (s: any) => s.momentum >= 75 },
  { id: "events", name: "Event Joiner", emoji: "🏁", req: (s: any) => s.eventsJoined >= 1 },
  { id: "xp1000", name: "1,000 XP", emoji: "⭐", req: (s: any) => s.xp >= 1000 },
] as const;

function RewardsPage() {
  const app = useApp();
  const mission = useDailyMission(app.onboarding?.goals?.[0]);

  const streak = useMemo(() => computeStreak(app.checkIns), [app.checkIns]);
  const momentum = useMemo(
    () =>
      computeMomentum({
        checkIns: app.checkIns,
        weeklyTarget: app.onboarding?.weeklyCommitment ?? 4,
        verificationsGiven: app.verificationsGiven,
        prevHistory: app.momentumHistory,
      }),
    [app.checkIns, app.onboarding, app.verificationsGiven, app.momentumHistory],
  );

  const today = new Date().toISOString().slice(0, 10);
  const todayMission = app.missions.find((m) => m.date === today && m.completed);
  const verifiedCount = app.checkIns.filter((c) => c.verified || c.approvals.length > 0).length;
  const tier = trustTier(app.trustScore);

  const badgeCtx = {
    checkIns: app.checkIns,
    streak,
    verifiedCount,
    verificationsGiven: app.verificationsGiven,
    momentum: momentum.score,
    eventsJoined: 1,
    xp: app.xp,
  };

  const earnedBadges = BADGES.filter((b) => b.req(badgeCtx));
  const lockedBadges = BADGES.filter((b) => !b.req(badgeCtx));

  const currentLevel =
    [...JOURNEY].reverse().find((l) => momentum.score >= l.min) ?? JOURNEY[0];
  const nextLevel = JOURNEY.find((l) => l.min > momentum.score);
  const progressToNext = nextLevel
    ? Math.round(
        ((momentum.score - currentLevel.min) / (nextLevel.min - currentLevel.min)) * 100,
      )
    : 100;

  return (
    <div className="space-y-6">
      <header className="space-y-1.5">
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-muted-foreground">
          <Trophy className="h-3.5 w-3.5" /> Rewards & Journey
        </div>
        <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight">
          Earn it. Wear it. Keep it.
        </h1>
        <p className="text-sm text-muted-foreground">
          Momentum, missions, shields and your journey level — all in one place.
        </p>
      </header>

      {/* Momentum hero */}
      <section className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-surface-2/80 to-surface-1/40 p-5 md:p-6">
        <div className="grid md:grid-cols-[auto,1fr] gap-5 items-center">
          <MomentumRing score={momentum.score} />
          <div className="space-y-3">
            <div className="flex flex-wrap items-baseline gap-2">
              <div className="text-3xl md:text-4xl font-display font-bold">{momentum.score}</div>
              <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                / 100 Momentum
              </div>
              <span
                className={`ml-auto inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                  momentum.delta >= 0
                    ? "bg-primary/15 text-primary"
                    : "bg-destructive/15 text-destructive"
                }`}
              >
                {momentum.delta >= 0 ? "▲" : "▼"} {Math.abs(momentum.delta)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Star className="h-4 w-4 text-primary" />
              <span className="font-semibold">
                Level {currentLevel.num} — {currentLevel.name}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{currentLevel.blurb}</p>
            {nextLevel && (
              <div>
                <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${progressToNext}%` }}
                  />
                </div>
                <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground font-mono">
                  <span>{progressToNext}% to {nextLevel.name}</span>
                  <span>{nextLevel.min - momentum.score} pts to go</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {momentum.improvements.length > 0 && (
          <div className="mt-5 grid sm:grid-cols-3 gap-2">
            {momentum.improvements.map((imp) => (
              <Link
                key={imp.label}
                to={imp.to as any}
                className="group flex items-center justify-between rounded-xl border border-border bg-background/60 px-3 py-2.5 hover:border-primary/60 transition-colors"
              >
                <div>
                  <div className="text-sm font-semibold">{imp.label}</div>
                  <div className="text-[11px] text-muted-foreground">+{imp.impact} momentum</div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Daily mission + Streak shield */}
      <div className="grid md:grid-cols-2 gap-4">
        <section className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-muted-foreground">
            <Target className="h-3.5 w-3.5" /> Daily Mission
          </div>
          <div className="mt-3 flex items-start gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/15 text-2xl">
              {mission.emoji}
            </div>
            <div className="flex-1">
              <div className="font-display font-bold">{mission.title}</div>
              <div className="text-xs text-muted-foreground">{mission.detail}</div>
              <div className="mt-1 text-[11px] font-mono text-primary">+{mission.reward} XP</div>
            </div>
          </div>
          <button
            disabled={!!todayMission}
            onClick={() => app.completeMission(mission.id)}
            className={`mt-4 w-full rounded-xl py-2.5 text-sm font-semibold transition-colors ${
              todayMission
                ? "bg-primary/15 text-primary cursor-not-allowed"
                : "bg-primary text-primary-foreground hover:opacity-90"
            }`}
          >
            {todayMission ? (
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-4 w-4" /> Completed today
              </span>
            ) : (
              "Mark complete"
            )}
          </button>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-muted-foreground">
            <Shield className="h-3.5 w-3.5" /> Streak Shields
          </div>
          <div className="mt-3 flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-ember/15 text-ember">
              <Flame className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <div className="font-display text-2xl font-bold">{streak}-day streak</div>
              <div className="text-xs text-muted-foreground">
                One shield protects a missed day. Earn one every 5 verifications.
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            {Array.from({ length: 5 }).map((_, i) => {
              const filled = i < app.protectionTokens;
              return (
                <div
                  key={i}
                  className={`grid h-10 w-10 place-items-center rounded-lg border ${
                    filled
                      ? "border-primary/60 bg-primary/10 text-primary"
                      : "border-border bg-surface-2/40 text-muted-foreground"
                  }`}
                >
                  <Shield className="h-4 w-4" />
                </div>
              );
            })}
          </div>
          <button
            onClick={() => app.useProtectionToken()}
            disabled={app.protectionTokens <= 0}
            className="mt-4 w-full rounded-xl border border-border py-2.5 text-sm font-semibold hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Use a shield today
          </button>
        </section>
      </div>

      {/* Journey ladder */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-muted-foreground">
          <Zap className="h-3.5 w-3.5" /> Journey
        </div>
        <div className="mt-3 grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {JOURNEY.map((l) => {
            const unlocked = momentum.score >= l.min;
            const current = currentLevel.num === l.num;
            return (
              <div
                key={l.num}
                className={`rounded-xl border p-3 ${
                  current
                    ? "border-primary bg-primary/10"
                    : unlocked
                      ? "border-border bg-surface-2/40"
                      : "border-border/60 bg-background/40 opacity-70"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="text-[11px] font-mono uppercase text-muted-foreground">
                    Lvl {l.num}
                  </div>
                  {current ? (
                    <span className="text-[10px] font-semibold text-primary">CURRENT</span>
                  ) : unlocked ? (
                    <Check className="h-3.5 w-3.5 text-primary" />
                  ) : (
                    <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </div>
                <div className="font-display font-bold">{l.name}</div>
                <div className="text-[11px] text-muted-foreground">{l.blurb}</div>
                <div className="mt-1 text-[10px] font-mono text-muted-foreground">
                  Unlocks at {l.min}+ momentum
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Badges */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" /> Badges
          </div>
          <div className="text-xs text-muted-foreground">
            {earnedBadges.length} / {BADGES.length} earned
          </div>
        </div>
        <div className="mt-3 grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
          {[...earnedBadges, ...lockedBadges].map((b) => {
            const earned = earnedBadges.includes(b);
            return (
              <div
                key={b.id}
                title={b.name}
                className={`flex flex-col items-center gap-1 rounded-xl border p-2 text-center ${
                  earned
                    ? "border-primary/40 bg-primary/5"
                    : "border-border bg-surface-2/30 opacity-50"
                }`}
              >
                <div className="text-2xl">{earned ? b.emoji : "🔒"}</div>
                <div className="text-[10px] font-semibold leading-tight">{b.name}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Themes / cosmetics */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-muted-foreground">
            <Palette className="h-3.5 w-3.5" /> Cosmetics
          </div>
          <div className="text-xs text-muted-foreground">{app.xp} XP</div>
        </div>
        <div className="mt-3 grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {THEMES.map((t) => {
            const unlocked = app.xp >= t.unlockAt;
            return (
              <div
                key={t.id}
                className={`flex items-center gap-3 rounded-xl border p-3 ${
                  unlocked ? "border-border bg-surface-2/40" : "border-border/60 opacity-60"
                }`}
              >
                <div
                  className="h-10 w-10 rounded-lg shrink-0"
                  style={{
                    background: `linear-gradient(135deg, ${t.swatch[0]}, ${t.swatch[1]})`,
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold">{t.name}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {unlocked ? "Unlocked" : `${t.unlockAt} XP to unlock`}
                  </div>
                </div>
                {unlocked ? (
                  <Check className="h-4 w-4 text-primary" />
                ) : (
                  <Lock className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Trust tier */}
      <section className="rounded-2xl border border-border bg-card p-5 flex items-center gap-4">
        <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/15 text-primary">
          <Trophy className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
            Trust tier
          </div>
          <div className="font-display text-lg font-bold">{tier.name}</div>
          <div className="text-xs text-muted-foreground">
            Score {app.trustScore} · {tier.min}–{tier.max}
          </div>
        </div>
        <Link
          to="/community"
          className="rounded-lg border border-border px-3 py-2 text-xs font-semibold hover:bg-accent"
        >
          Earn more
        </Link>
      </section>
    </div>
  );
}

function MomentumRing({ score }: { score: number }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const filled = (score / 100) * c;
  return (
    <div className="relative h-32 w-32 shrink-0">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle cx="60" cy="60" r={r} stroke="var(--color-border)" strokeWidth="10" fill="none" />
        <circle
          cx="60"
          cy="60"
          r={r}
          stroke="var(--color-primary)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${c}`}
          fill="none"
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <div className="font-display text-3xl font-bold">{score}</div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            momentum
          </div>
        </div>
      </div>
    </div>
  );
}