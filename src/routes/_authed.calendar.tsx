import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useApp, useStreak } from "@/lib/store";
import {
  addDays,
  differenceInCalendarDays,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  startOfWeek,
  subDays,
} from "date-fns";
import { Activity, Dumbbell, Apple, Trophy, Flame, ShieldCheck, ArrowLeft, ArrowRight, Plus } from "lucide-react";
import { haptic } from "@/lib/haptics";

export const Route = createFileRoute("/_authed/calendar")({
  head: () => ({ meta: [{ title: "Calendar — OpenStage" }] }),
  component: Calendar,
});

const ICONS = { cardio: Activity, weights: Dumbbell, lifestyle: Apple, sport: Trophy } as const;

const WEEKS = 26; // ~6 months heatmap
const RANGE_DAYS = WEEKS * 7;

function Calendar() {
  const { checkIns, onboarding } = useApp();
  const streak = useStreak();
  const [selected, setSelected] = useState<string>(() => new Date().toISOString().slice(0, 10));

  // group check-ins by YYYY-MM-DD
  const byDay = useMemo(() => {
    const m = new Map<string, typeof checkIns>();
    checkIns.forEach((c) => {
      const k = c.date.slice(0, 10);
      if (!m.has(k)) m.set(k, [] as typeof checkIns);
      m.get(k)!.push(c);
    });
    return m;
  }, [checkIns]);

  // build a 7×WEEKS grid ending at end-of-current-week (so today is in the last column area)
  const today = new Date();
  const gridEnd = endOfWeek(today, { weekStartsOn: 1 });
  const gridStart = startOfWeek(subDays(gridEnd, RANGE_DAYS - 1), { weekStartsOn: 1 });

  const columns: { date: Date; key: string; count: number }[][] = [];
  let cursor = gridStart;
  while (cursor <= gridEnd) {
    const col: { date: Date; key: string; count: number }[] = [];
    for (let i = 0; i < 7; i++) {
      const k = cursor.toISOString().slice(0, 10);
      col.push({ date: cursor, key: k, count: byDay.get(k)?.length ?? 0 });
      cursor = addDays(cursor, 1);
    }
    columns.push(col);
  }

  // month labels: show only at column where month changes
  const monthLabels = columns.map((col, i) => {
    if (i === 0) return format(col[0].date, "MMM");
    const prev = columns[i - 1][0].date;
    if (!isSameMonth(prev, col[0].date)) return format(col[0].date, "MMM");
    return "";
  });

  const sel = parseISO(selected);
  const selDay = byDay.get(selected) ?? [];

  const target = onboarding?.weeklyCommitment ?? 4;
  // active weeks in current grid (weeks with >= target)
  const activeWeeks = columns.filter((col) => col.reduce((s, d) => s + d.count, 0) >= target).length;
  // best day
  const bestDay = [...byDay.entries()].sort((a, b) => b[1].length - a[1].length)[0];

  // longest historical streak (scan all days with check-ins)
  const allStreak = useMemo(() => {
    const sorted = [...byDay.keys()].sort();
    let longest = 0;
    let cur = 0;
    let prev: Date | null = null;
    for (const k of sorted) {
      const d = parseISO(k);
      if (prev && differenceInCalendarDays(d, prev) === 1) {
        cur += 1;
      } else {
        cur = 1;
      }
      if (cur > longest) longest = cur;
      prev = d;
    }
    return longest;
  }, [byDay]);

  const shiftSelected = (delta: number) => {
    const next = addDays(parseISO(selected), delta);
    setSelected(next.toISOString().slice(0, 10));
    haptic("select");
  };

  return (
    <div className="space-y-8">
      <header className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Calendar</div>
          <h1 className="font-display font-bold text-3xl md:text-4xl mt-2 tracking-tight">
            Six months of showing up.
          </h1>
          <p className="text-muted-foreground mt-2 max-w-xl">
            Every square is a day. Brighter means more sessions. Tap one to see what happened.
          </p>
        </div>
        <Link
          to="/check-in"
          onClick={() => haptic("tap")}
          className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Check in
        </Link>
      </header>

      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Current streak" value={`${streak}d`} icon={Flame} tint="text-ember" />
        <Stat label="Longest run" value={`${allStreak}d`} icon={Flame} />
        <Stat label="Weeks on target" value={`${activeWeeks}/${WEEKS}`} />
        <Stat label="Verified" value={`${checkIns.filter((c) => c.verified).length}`} icon={ShieldCheck} tint="text-primary" />
      </section>

      <section className="card-elevated p-4 md:p-6 overflow-hidden">
        {/* month labels */}
        <div className="flex gap-[3px] pl-7">
          {monthLabels.map((m, i) => (
            <div key={i} className="w-[14px] text-[10px] font-mono text-muted-foreground">
              {m}
            </div>
          ))}
        </div>

        <div className="flex gap-[3px] mt-1 overflow-x-auto momentum-scroll pb-1">
          {/* weekday labels */}
          <div className="flex flex-col gap-[3px] pr-1 shrink-0 sticky left-0 bg-background/60 backdrop-blur">
            {["Mon", "", "Wed", "", "Fri", "", "Sun"].map((d, i) => (
              <div
                key={i}
                className="h-[14px] w-6 text-[9px] font-mono text-muted-foreground flex items-center"
              >
                {d}
              </div>
            ))}
          </div>

          {columns.map((col, ci) => (
            <div key={ci} className="flex flex-col gap-[3px] shrink-0">
              {col.map((d) => {
                const future = d.date > today;
                const intensity =
                  d.count >= 3 ? 4 : d.count === 2 ? 3 : d.count === 1 ? 2 : 0;
                const tint =
                  intensity === 4
                    ? "bg-primary"
                    : intensity === 3
                      ? "bg-primary/70"
                      : intensity === 2
                        ? "bg-primary/35"
                        : future
                          ? "bg-surface-2/30"
                          : "bg-surface-2/70";
                const isSel = isSameDay(d.date, sel);
                return (
                  <button
                    key={d.key}
                    onClick={() => {
                      if (future) return;
                      setSelected(d.key);
                      haptic("select");
                    }}
                    disabled={future}
                    title={`${format(d.date, "EEE MMM d")} — ${d.count} session${d.count === 1 ? "" : "s"}`}
                    className={`h-[14px] w-[14px] rounded-sm transition relative ${tint} ${
                      isSel ? "ring-2 ring-foreground/80" : ""
                    } ${isToday(d.date) ? "outline outline-1 outline-primary" : ""} ${
                      future ? "cursor-default" : "hover:scale-110 cursor-pointer"
                    }`}
                  />
                );
              })}
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-end gap-2 text-[10px] font-mono text-muted-foreground">
          less
          <span className="h-3 w-3 rounded-sm bg-surface-2/70" />
          <span className="h-3 w-3 rounded-sm bg-primary/35" />
          <span className="h-3 w-3 rounded-sm bg-primary/70" />
          <span className="h-3 w-3 rounded-sm bg-primary" />
          more
        </div>
      </section>

      <section className="card-elevated p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="font-mono text-xs uppercase tracking-wider text-primary">
              {isToday(sel) ? "Today" : format(sel, "EEEE")}
            </div>
            <h2 className="font-display font-bold text-2xl mt-1">{format(sel, "MMM d, yyyy")}</h2>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => shiftSelected(-1)}
              className="h-9 w-9 rounded-full border border-border grid place-items-center hover:bg-accent"
              aria-label="Previous day"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => shiftSelected(1)}
              disabled={addDays(sel, 1) > today}
              className="h-9 w-9 rounded-full border border-border grid place-items-center hover:bg-accent disabled:opacity-40"
              aria-label="Next day"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {selDay.length === 0 ? (
          <div className="mt-5 rounded-xl bg-surface-2/40 p-6 text-center">
            <div className="text-4xl">🕯️</div>
            <div className="mt-2 font-display font-semibold">Nothing logged this day.</div>
            <p className="text-sm text-muted-foreground mt-1">
              {isToday(sel)
                ? "Still time. One rep counts."
                : "Rest day, missed day, or before you joined."}
            </p>
            {isToday(sel) && (
              <Link
                to="/check-in"
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold hover:opacity-90"
              >
                <Plus className="h-4 w-4" /> Log now
              </Link>
            )}
          </div>
        ) : (
          <div className="mt-5 space-y-2">
            {selDay.map((c) => {
              const Icon = ICONS[c.activityType];
              return (
                <div key={c.id} className="rounded-xl bg-surface-2/40 p-4 flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-surface-2 text-xl shrink-0">
                    {c.proofEmoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Icon className="h-3.5 w-3.5 text-primary shrink-0" />
                      <div className="font-display font-semibold truncate">{c.title}</div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5 truncate">
                      {c.duration} min · RPE {c.effort} · {format(new Date(c.date), "h:mm a")}
                    </div>
                  </div>
                  <span
                    className={`tag shrink-0 ${
                      c.verified ? "bg-primary/15 text-primary" : "bg-surface-2 text-muted-foreground"
                    }`}
                  >
                    <ShieldCheck className="h-3 w-3" /> {c.verified ? "Verified" : "Pending"}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {bestDay && (
        <section className="card-elevated p-6">
          <div className="font-mono text-xs uppercase tracking-wider text-primary">Heaviest day</div>
          <div className="mt-2 flex items-baseline gap-3">
            <div className="font-display font-bold text-2xl">
              {format(parseISO(bestDay[0]), "MMM d")}
            </div>
            <div className="text-sm text-muted-foreground">
              {bestDay[1].length} session{bestDay[1].length === 1 ? "" : "s"} ·{" "}
              {bestDay[1].reduce((s, c) => s + c.duration, 0)} min
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-2 max-w-xl">
            One outlier day doesn't move the needle. Consistency across weeks is what your cohort
            sees — your heatmap is the proof.
          </p>
        </section>
      )}
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  tint,
}: {
  icon?: typeof Flame;
  label: string;
  value: string | number;
  tint?: string;
}) {
  return (
    <div className="card-elevated p-4">
      <div className="flex items-center gap-2">
        {Icon && <Icon className={`h-4 w-4 ${tint ?? "text-muted-foreground"}`} />}
        <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
      </div>
      <div className="font-display font-bold text-2xl mt-1.5 tabular-nums">{value}</div>
    </div>
  );
}