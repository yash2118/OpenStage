import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useApp, seedLeaderboard, weeklyProgress, useStreak } from "@/lib/store";
import { GOAL_LABELS } from "@/lib/seed";
import type { LeaderRow } from "@/lib/seed";
import {
  Crown,
  Medal,
  Flame,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Minus,
  Filter,
  ArrowRight,
} from "lucide-react";

export const Route = createFileRoute("/_authed/leaderboard")({
  head: () => ({
    meta: [
      { title: "Rankings — OpenStage" },
      {
        name: "description",
        content:
          "See where you stand. Cohort-matched leaderboard with weekly check-ins, streak, and Crew-verified rate.",
      },
    ],
  }),
  component: LeaderboardPage,
});

type Scope = "global" | "cohort" | "crew";
type Window = "week" | "month" | "all";
type Sort = "rank" | "streak" | "verified";

function LeaderboardPage() {
  const { user, onboarding, checkIns, crew, trustScore } = useApp();
  const streak = useStreak();
  const [scope, setScope] = useState<Scope>("cohort");
  const [window, setWindow] = useState<Window>("week");
  const [sort, setSort] = useState<Sort>("rank");

  const youRow: LeaderRow | null = useMemo(() => {
    if (!user || !onboarding) return null;
    const w = weeklyProgress(checkIns, onboarding.weeklyCommitment);
    const verifiedCount = checkIns.filter((c) => c.verified || c.approvals.length > 0).length;
    const verifiedPct =
      checkIns.length === 0 ? 0 : Math.round((verifiedCount / checkIns.length) * 100);
    return {
      rank: 0,
      name: user.name,
      handle: user.handle,
      weeklyCheckIns: w.done,
      streak,
      verifiedPct,
      goal: onboarding.goals[0] ?? "build_consistency",
      isYou: true,
    };
  }, [user, onboarding, checkIns, streak]);

  const filtered = useMemo(() => {
    if (!youRow) return [] as LeaderRow[];
    let pool: LeaderRow[] = [...seedLeaderboard];
    if (scope === "cohort") pool = pool.filter((r) => onboarding?.goals.includes(r.goal));
    if (scope === "crew") {
      const crewHandles = new Set(crew.map((c) => c.handle));
      pool = pool.filter((r) => crewHandles.has(r.handle));
    }
    // window multiplier (purely cosmetic re-ordering for now)
    const winMul = window === "month" ? 1 : window === "all" ? 1.2 : 1;
    pool = pool.map((r) => ({
      ...r,
      weeklyCheckIns: Math.round(r.weeklyCheckIns * winMul),
    }));
    const all = [...pool, youRow];
    // sort
    all.sort((a, b) => {
      if (sort === "streak") return b.streak - a.streak;
      if (sort === "verified") return b.verifiedPct - a.verifiedPct;
      // rank: weekly first, streak tiebreak
      if (b.weeklyCheckIns !== a.weeklyCheckIns) return b.weeklyCheckIns - a.weeklyCheckIns;
      return b.streak - a.streak;
    });
    return all.map((r, i) => ({ ...r, rank: i + 1 }));
  }, [youRow, scope, window, sort, crew, onboarding]);

  const yourRank = filtered.findIndex((r) => r.isYou) + 1;
  const yourEntry = filtered.find((r) => r.isYou);
  const above = filtered[Math.max(0, yourRank - 2)];
  const totalCount = filtered.length;

  if (!user || !onboarding) return null;

  return (
    <div className="space-y-6">
      <header className="space-y-1.5">
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-muted-foreground">
          <Crown className="h-3.5 w-3.5" /> Rankings
        </div>
        <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight">
          You're #{yourRank} of {totalCount}.
        </h1>
        <p className="text-sm text-muted-foreground">
          Matched by goal and frequency. Crew verification weighs more than volume.
        </p>
      </header>

      {/* Your row hero */}
      {yourEntry && (
        <section className="rounded-2xl border border-primary/40 bg-gradient-to-br from-primary/15 to-primary/5 p-5">
          <div className="flex items-start gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-xl bg-primary text-primary-foreground font-display text-xl font-bold">
              #{yourRank}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-display font-bold text-lg truncate">{user.name}</div>
              <div className="text-xs text-muted-foreground">@{user.handle} · You</div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <Mini label="Workouts" value={yourEntry.weeklyCheckIns} />
                <Mini label="Streak" value={`${yourEntry.streak}d`} />
                <Mini label="Verified" value={`${yourEntry.verifiedPct}%`} />
              </div>
            </div>
          </div>
          {above && above.handle !== yourEntry.handle && (
            <div className="mt-4 rounded-xl border border-border bg-background/60 p-3 flex items-center justify-between gap-3">
              <div>
                <div className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                  Next up
                </div>
                <div className="text-sm font-semibold">
                  #{above.rank} {above.name}
                </div>
                <div className="text-xs text-muted-foreground">
                  {Math.max(1, above.weeklyCheckIns - yourEntry.weeklyCheckIns)} workout
                  {above.weeklyCheckIns - yourEntry.weeklyCheckIns === 1 ? "" : "s"} to overtake
                </div>
              </div>
              <Link
                to="/check-in"
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90"
              >
                Close the gap <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          )}
        </section>
      )}

      {/* Filters */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-muted-foreground">
          <Filter className="h-3.5 w-3.5" /> Filters
        </div>
        <div className="space-y-2">
          <Chips
            label="Scope"
            value={scope}
            options={[
              { id: "cohort", label: "My cohort" },
              { id: "global", label: "Global" },
              { id: "crew", label: "My crew" },
            ]}
            onChange={(v) => setScope(v as Scope)}
          />
          <Chips
            label="Window"
            value={window}
            options={[
              { id: "week", label: "This week" },
              { id: "month", label: "This month" },
              { id: "all", label: "All-time" },
            ]}
            onChange={(v) => setWindow(v as Window)}
          />
          <Chips
            label="Sort"
            value={sort}
            options={[
              { id: "rank", label: "Workouts" },
              { id: "streak", label: "Streak" },
              { id: "verified", label: "Verified %" },
            ]}
            onChange={(v) => setSort(v as Sort)}
          />
        </div>
        <div className="text-[11px] text-muted-foreground">
          Trust score: <span className="text-foreground font-semibold">{trustScore}</span>
        </div>
      </section>

      {/* Leaderboard list */}
      <section className="space-y-2">
        {filtered.map((row, i) => {
          const prevRank = i > 0 ? filtered[i - 1].rank : row.rank;
          void prevRank;
          return <RankCard key={`${row.handle}-${row.rank}`} row={row} />;
        })}
        {filtered.length === 0 && (
          <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
            No one matches that filter yet. Try a wider scope.
          </div>
        )}
      </section>
    </div>
  );
}

function RankCard({ row }: { row: LeaderRow }) {
  const top3 = row.rank <= 3;
  const trend = (row.handle.charCodeAt(0) + row.rank) % 3; // 0 up, 1 down, 2 same
  const TrendIcon = trend === 0 ? TrendingUp : trend === 1 ? TrendingDown : Minus;
  const trendColor =
    trend === 0 ? "text-primary" : trend === 1 ? "text-destructive" : "text-muted-foreground";

  return (
    <div
      className={`flex items-center gap-3 rounded-xl border p-3 ${
        row.isYou
          ? "border-primary bg-primary/10"
          : top3
            ? "border-border bg-gradient-to-r from-surface-2/60 to-surface-1/30"
            : "border-border bg-card"
      }`}
    >
      <div className="grid h-10 w-10 place-items-center shrink-0">
        {row.rank === 1 ? (
          <Crown className="h-5 w-5 text-amber-400" />
        ) : row.rank <= 3 ? (
          <Medal className="h-5 w-5 text-muted-foreground" />
        ) : (
          <span className="font-display text-sm font-bold text-muted-foreground">
            #{row.rank}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <div className="font-semibold truncate">{row.name}</div>
          {row.isYou && (
            <span className="rounded bg-primary px-1.5 py-0.5 text-[9px] font-bold text-primary-foreground uppercase tracking-wider">
              You
            </span>
          )}
        </div>
        <div className="text-[11px] text-muted-foreground truncate">
          @{row.handle} · {GOAL_LABELS[row.goal]}
        </div>
      </div>
      <div className="hidden sm:flex items-center gap-3 text-xs">
        <Pill icon={Flame} value={`${row.streak}d`} />
        <Pill icon={ShieldCheck} value={`${row.verifiedPct}%`} />
      </div>
      <div className="flex flex-col items-end gap-0.5">
        <div className="font-display font-bold">{row.weeklyCheckIns}</div>
        <div className={`flex items-center gap-0.5 text-[10px] ${trendColor}`}>
          <TrendIcon className="h-2.5 w-2.5" />
          {trend === 0 ? "+2" : trend === 1 ? "-1" : "—"}
        </div>
      </div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-background/60 p-2 text-center">
      <div className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="font-display font-bold">{value}</div>
    </div>
  );
}

function Pill({
  icon: Icon,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: string;
}) {
  return (
    <span className="inline-flex items-center gap-1 text-muted-foreground">
      <Icon className="h-3 w-3" />
      <span className="font-mono text-[11px]">{value}</span>
    </span>
  );
}

function Chips<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { id: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto">
      <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground shrink-0 w-14">
        {label}
      </span>
      <div className="flex gap-1.5">
        {options.map((o) => {
          const active = value === o.id;
          return (
            <button
              key={o.id}
              onClick={() => onChange(o.id)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                active
                  ? "bg-primary text-primary-foreground"
                  : "bg-surface-2/60 text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}