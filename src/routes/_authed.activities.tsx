import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useApp, computeStreak } from "@/lib/store";
import { format, formatDistanceToNow, isThisWeek, parseISO, startOfWeek } from "date-fns";
import {
  Activity,
  Dumbbell,
  Apple,
  Trophy,
  ArrowRight,
  ShieldCheck,
  Clock,
  Plus,
  Flame,
  Timer,
  Calendar,
  Search,
} from "lucide-react";
import { haptic } from "@/lib/haptics";

export const Route = createFileRoute("/_authed/activities")({
  head: () => ({ meta: [{ title: "Activities — OpenStage" }] }),
  component: Activities,
});

const ICONS = { cardio: Activity, weights: Dumbbell, lifestyle: Apple, sport: Trophy } as const;
const FILTERS = [
  { key: "all" as const, label: "All" },
  { key: "weights" as const, label: "Weights" },
  { key: "cardio" as const, label: "Cardio" },
  { key: "lifestyle" as const, label: "Lifestyle" },
  { key: "sport" as const, label: "Sport" },
];

const TEMPLATES = [
  { name: "Push day — Bench + OHP", type: "weights" as const, emoji: "🏋️", min: 45 },
  { name: "Pull day — Rows + Pulls", type: "weights" as const, emoji: "💪", min: 45 },
  { name: "Leg day — Squat focus", type: "weights" as const, emoji: "🦵", min: 60 },
  { name: "Easy 5K shake-out", type: "cardio" as const, emoji: "🏃", min: 28 },
  { name: "Zone 2 ride", type: "cardio" as const, emoji: "🚴", min: 60 },
  { name: "Habit loop — water+veg+walk", type: "lifestyle" as const, emoji: "🥗", min: 30 },
];

function Activities() {
  const { checkIns } = useApp();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("all");
  const [query, setQuery] = useState("");

  const streak = computeStreak(checkIns);
  const thisWeek = checkIns.filter((c) => isThisWeek(new Date(c.date), { weekStartsOn: 1 }));
  const totalMin = checkIns.reduce((s, c) => s + (c.duration || 0), 0);
  const verifiedRate = checkIns.length
    ? Math.round((checkIns.filter((c) => c.verified).length / checkIns.length) * 100)
    : 0;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return checkIns.filter((c) => {
      if (filter !== "all" && c.activityType !== filter) return false;
      if (q && !`${c.title} ${c.note} ${c.proofLabel}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [checkIns, filter, query]);

  // group by date label
  const groups = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    filtered.forEach((c) => {
      const d = parseISO(c.date);
      const wk = startOfWeek(d, { weekStartsOn: 1 });
      const key = `Week of ${format(wk, "MMM d")}`;
      if (!map.has(key)) map.set(key, [] as typeof filtered);
      map.get(key)!.push(c);
    });
    return Array.from(map.entries());
  }, [filtered]);

  return (
    <div className="space-y-8">
      <header className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Activities</div>
          <h1 className="font-display font-bold text-3xl md:text-4xl mt-2">Your training log</h1>
        </div>
        <Link
          to="/check-in"
          onClick={() => haptic("tap")}
          className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> New check-in
        </Link>
      </header>

      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat icon={Flame} label="Streak" value={`${streak}d`} tint="text-primary" />
        <Stat icon={Calendar} label="This week" value={thisWeek.length} />
        <Stat icon={Timer} label="All-time" value={`${totalMin}m`} />
        <Stat icon={ShieldCheck} label="Verified" value={`${verifiedRate}%`} tint="text-primary" />
      </section>

      <section>
        <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-3">
          Saved templates
        </div>
        <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory -mx-4 px-4 pb-2 md:grid md:grid-cols-3 md:overflow-visible md:mx-0 md:px-0">
          {TEMPLATES.map((t) => {
            const Icon = ICONS[t.type];
            return (
              <Link
                key={t.name}
                to="/check-in"
                onClick={() => haptic("tap")}
                className="card-elevated p-4 hover:-translate-y-0.5 transition snap-start shrink-0 w-[68%] md:w-auto"
              >
                <div className="flex items-center justify-between">
                  <Icon className="h-5 w-5 text-primary" />
                  <span className="text-2xl">{t.emoji}</span>
                </div>
                <div className="mt-3 font-display font-semibold">{t.name}</div>
                <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                  <Clock className="h-3 w-3" /> {t.min} min · {t.type}
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            History
          </div>
          <div className="text-xs text-muted-foreground">{filtered.length} of {checkIns.length}</div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 mb-3">
          <div className="flex items-center rounded-full border border-border bg-surface px-3 py-2 focus-within:border-primary/60 flex-1">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search title, note, proof…"
              className="flex-1 bg-transparent text-sm outline-none px-2"
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => {
                  setFilter(f.key);
                  haptic("select");
                }}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold border transition ${
                  filter === f.key
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-surface text-foreground/80 hover:bg-accent"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {checkIns.length === 0 ? (
          <div className="card-elevated p-10 text-center">
            <div className="text-5xl">🚀</div>
            <div className="mt-3 font-display font-bold text-xl">No check-ins yet</div>
            <p className="text-muted-foreground text-sm mt-1">Post your first to start the streak.</p>
            <Link
              to="/check-in"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-semibold hover:opacity-90"
            >
              Check in now <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : filtered.length === 0 ? (
          <div className="card-elevated p-10 text-center">
            <div className="text-4xl">🔎</div>
            <div className="mt-3 font-display font-bold text-lg">No matches</div>
            <p className="text-muted-foreground text-sm mt-1">Try a different filter or search term.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {groups.map(([label, items]) => {
              const wkMin = items.reduce((s, c) => s + (c.duration || 0), 0);
              return (
                <div key={label}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      {label}
                    </div>
                    <div className="text-[10px] font-mono text-muted-foreground">
                      {items.length} sessions · {wkMin}m
                    </div>
                  </div>
                  <div className="space-y-2">
                    {items.map((c) => {
                      const Icon = ICONS[c.activityType];
                      return (
                        <div key={c.id} className="card-elevated p-4 flex items-center gap-4 soft-rise">
                          <div className="grid h-10 w-10 place-items-center rounded-xl bg-surface-2 text-xl shrink-0">
                            {c.proofEmoji}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Icon className="h-3.5 w-3.5 text-primary shrink-0" />
                              <div className="font-display font-semibold truncate">{c.title}</div>
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5 truncate">
                              {c.duration} min · RPE {c.effort} · {formatDistanceToNow(new Date(c.date))} ago
                            </div>
                          </div>
                          <span
                            className={`tag shrink-0 ${
                              c.verified
                                ? "bg-primary/15 text-primary"
                                : "bg-surface-2 text-muted-foreground"
                            }`}
                          >
                            <ShieldCheck className="h-3 w-3" />{" "}
                            {c.verified ? "Verified" : c.visibility === "private" ? "Private" : "Pending"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  tint,
}: {
  icon: typeof Activity;
  label: string;
  value: string | number;
  tint?: string;
}) {
  return (
    <div className="card-elevated p-4">
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${tint ?? "text-muted-foreground"}`} />
        <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
      </div>
      <div className="font-display font-bold text-2xl mt-1.5 tabular-nums">{value}</div>
    </div>
  );
}