import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { seedEvents, useApp } from "@/lib/store";
import {
  Trophy,
  Users,
  Clock,
  ArrowRight,
  Check,
  Flame,
  ShieldCheck,
  Sparkles,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import { haptic } from "@/lib/haptics";
import type { EventInfo } from "@/lib/seed";

export const Route = createFileRoute("/_authed/events")({
  head: () => ({ meta: [{ title: "Events — OpenStage" }] }),
  component: Events,
});

type CategoryFilter = "All" | EventInfo["category"];
const CATEGORIES: CategoryFilter[] = ["All", "Cardio", "Weight Training", "Lifestyle", "Sports"];

function Events() {
  const { onboarding } = useApp();
  const [joined, setJoined] = useState<string[]>(["form-foundation"]);
  const [filter, setFilter] = useState<CategoryFilter>("All");

  const events = useMemo(
    () => (filter === "All" ? seedEvents : seedEvents.filter((e) => e.category === filter)),
    [filter],
  );

  const joinedEvents = seedEvents.filter((e) => joined.includes(e.id));

  function toggle(id: string, name: string) {
    haptic(joined.includes(id) ? "soft" : "success");
    if (joined.includes(id)) {
      setJoined(joined.filter((x) => x !== id));
      toast(`Left ${name}.`);
    } else {
      setJoined([...joined, id]);
      toast.success(`Joined ${name}. +5 momentum locked.`);
    }
  }

  return (
    <div className="space-y-6 md:space-y-8 fade-up">
      <header className="safe-top">
        <div className="font-mono text-xs uppercase tracking-[0.2em] text-primary">
          Weekly events
        </div>
        <h1 className="font-display font-bold text-3xl md:text-4xl mt-2 tracking-tight">
          Pick your arena.
        </h1>
        <p className="text-muted-foreground mt-2 max-w-xl text-sm md:text-base">
          Opt in. Compete against people on the same goal and frequency. Crew-verified entries
          weigh more. No spectators.
        </p>
      </header>

      {/* === Active events strip === */}
      {joinedEvents.length > 0 && (
        <section className="space-y-3 soft-rise">
          <div className="flex items-center justify-between">
            <div className="font-mono text-[10px] uppercase tracking-wider text-primary">
              In the arena · {joinedEvents.length}
            </div>
            <span className="text-xs text-muted-foreground">Live standings update hourly</span>
          </div>
          <div className="flex gap-3 overflow-x-auto snap-x-mandatory no-scrollbar momentum-scroll -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-2">
            {joinedEvents.map((e, i) => {
              const rank = 4 + i * 11;
              const total = e.participants;
              const percentile = Math.max(5, 100 - Math.round((rank / total) * 100));
              return (
                <div
                  key={e.id}
                  className="card-elevated p-5 snap-center-strong shrink-0 w-[88%] md:w-auto"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{e.emoji}</span>
                      <div>
                        <div className="font-display font-bold text-base leading-tight">
                          {e.name}
                        </div>
                        <div className="text-[11px] text-muted-foreground">{e.category}</div>
                      </div>
                    </div>
                    <span className="tag bg-primary/15 text-primary">#{rank}</span>
                  </div>
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                      <span>Top {percentile}%</span>
                      <span>
                        {rank} / {total.toLocaleString()}
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 rounded-full bg-surface-2 overflow-hidden">
                      <div
                        className="h-full progress-live rounded-full"
                        style={{ width: `${percentile}%` }}
                      />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <CountdownPill hours={e.endsInHours} />
                    <Link
                      to="/leaderboard"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary press"
                    >
                      Live board <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* === Filter chips === */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
        <span className="text-muted-foreground shrink-0">
          <Filter className="h-4 w-4" />
        </span>
        {CATEGORIES.map((c) => {
          const active = filter === c;
          return (
            <button
              key={c}
              onClick={() => {
                haptic("select");
                setFilter(c);
              }}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition press ${
                active
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:bg-accent"
              }`}
            >
              {c}
            </button>
          );
        })}
      </div>

      {/* === Event grid === */}
      <div className="grid md:grid-cols-2 gap-4">
        {events.map((e) => {
          const isJoined = joined.includes(e.id);
          const matchesGoal = onboarding?.goals?.some((g) =>
            (g === "build_muscle" && e.category === "Weight Training") ||
            (g === "improve_strength" && e.category === "Weight Training") ||
            (g === "lose_weight" && (e.category === "Cardio" || e.category === "Lifestyle")) ||
            (g === "build_consistency" && e.category === "Lifestyle") ||
            (g === "general_reset" && e.category === "Lifestyle"),
          );
          return (
            <div
              key={e.id}
              className={`card-elevated p-6 flex flex-col soft-rise ${
                matchesGoal ? "ring-1 ring-primary/40" : ""
              }`}
            >
              <div className="flex items-start justify-between">
                <span className="text-4xl">{e.emoji}</span>
                <div className="flex flex-col items-end gap-1.5">
                  {matchesGoal && (
                    <span className="tag bg-primary/15 text-primary">
                      <Sparkles className="h-3 w-3" /> Matches your goal
                    </span>
                  )}
                  <span className="tag bg-surface-2 text-muted-foreground">{e.category}</span>
                </div>
              </div>
              <h2 className="mt-4 font-display font-bold text-xl md:text-2xl leading-tight">
                {e.name}
              </h2>
              <p className="text-sm text-primary mt-1">{e.tagline}</p>
              <p className="text-sm text-muted-foreground mt-3 flex-1 leading-relaxed">
                {e.description}
              </p>

              <div className="mt-5 grid grid-cols-3 gap-2">
                <Mini icon={Trophy} label="Metric" value={e.metric} />
                <Mini icon={Users} label="In" value={e.participants.toLocaleString()} />
                <Mini
                  icon={Clock}
                  label="Ends"
                  value={
                    e.endsInHours > 24
                      ? `${Math.round(e.endsInHours / 24)}d`
                      : `${e.endsInHours}h`
                  }
                  tone={e.endsInHours < 48 ? "ember" : "default"}
                />
              </div>

              {/* Live mini-podium */}
              <div className="mt-4 rounded-xl bg-surface-2/50 p-3">
                <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
                  Current podium
                </div>
                <div className="space-y-1.5">
                  {[
                    { rank: 1, name: "Maya O.", v: 100 },
                    { rank: 2, name: "Sam C.", v: 96 },
                    { rank: 3, name: "Lena P.", v: 91 },
                  ].map((row) => (
                    <div key={row.rank} className="flex items-center gap-2 text-xs">
                      <span className="font-mono w-5 text-muted-foreground">#{row.rank}</span>
                      <span className="flex-1 font-semibold truncate">{row.name}</span>
                      <span className="font-mono text-primary">{row.v}%</span>
                      <ShieldCheck className="h-3 w-3 text-primary" />
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => toggle(e.id, e.name)}
                className={`mt-5 inline-flex items-center justify-center gap-2 rounded-full py-3 font-semibold transition press ${
                  isJoined
                    ? "bg-surface-2 text-foreground border border-border hover:bg-accent"
                    : "bg-primary text-primary-foreground hover:opacity-90 shadow-[0_12px_30px_-10px_var(--color-primary)]"
                }`}
              >
                {isJoined ? (
                  <>
                    <Check className="h-4 w-4" /> Joined — view standings
                  </>
                ) : (
                  <>
                    Enter the arena <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      <section className="card-elevated p-5 md:p-6">
        <div className="flex items-start gap-3">
          <Flame className="h-5 w-5 text-ember shrink-0 mt-1" />
          <div>
            <div className="font-display font-bold text-lg">
              Events are seasons, not feeds.
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Pick one. Show up for it. Verified entries beat raw volume — your Crew is your jury.
              New events drop every Monday at 6am local.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function CountdownPill({ hours }: { hours: number }) {
  const urgent = hours < 48;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-mono uppercase tracking-wider ${
        urgent ? "bg-ember/15 text-ember" : "bg-surface-2 text-muted-foreground"
      }`}
    >
      <Clock className="h-3 w-3" />
      Ends in {hours > 24 ? `${Math.round(hours / 24)}d` : `${hours}h`}
      {urgent && <span className="live-dot ml-1 inline-block h-1.5 w-1.5 rounded-full bg-ember" />}
    </span>
  );
}

function Mini({
  icon: Icon,
  label,
  value,
  tone = "default",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tone?: "default" | "ember";
}) {
  return (
    <div className="rounded-xl bg-surface-2/60 p-3">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Icon className="h-3 w-3" />
        <span className="font-mono text-[10px] uppercase tracking-wider">{label}</span>
      </div>
      <div
        className={`mt-1 font-display font-semibold text-sm truncate ${
          tone === "ember" ? "text-ember" : ""
        }`}
      >
        {value}
      </div>
    </div>
  );
}