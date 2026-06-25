import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useApp, type CheckIn } from "@/lib/store";
import {
  Flag,
  Flame,
  Plus,
  Trophy,
  Users,
  Check,
  X,
  Sparkles,
  Calendar as CalendarIcon,
  Timer,
  Dumbbell,
  Activity,
  Apple,
} from "lucide-react";
import { toast } from "sonner";
import { haptic } from "@/lib/haptics";
import { format, differenceInCalendarDays } from "date-fns";

export const Route = createFileRoute("/_authed/challenges")({
  head: () => ({ meta: [{ title: "Challenges — OpenStage" }] }),
  component: ChallengesRoute,
});

type ChallengeKind = "cardio" | "weights" | "lifestyle" | "any";
type ChallengeMetric = "sessions" | "minutes" | "days";

type Challenge = {
  id: string;
  name: string;
  tagline: string;
  kind: ChallengeKind;
  metric: ChallengeMetric;
  target: number;
  durationDays: number;
  emoji: string;
  participants: number;
  joinedAt: string | null;
};

const STORAGE_KEY = "openstage.challenges.v1";

const now = () => new Date().toISOString();
const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();

const SEED: Challenge[] = [
  {
    id: "ch_30run",
    name: "30-day Run Streak",
    tagline: "Get out and move every day, even if it's a short shake-out.",
    kind: "cardio",
    metric: "days",
    target: 30,
    durationDays: 30,
    emoji: "🏃",
    participants: 248,
    joinedAt: daysAgo(6),
  },
  {
    id: "ch_pushpull",
    name: "Push / Pull / Squat — 24 sessions",
    tagline: "Hit 24 strength sessions in 8 weeks. Bias for compound lifts.",
    kind: "weights",
    metric: "sessions",
    target: 24,
    durationDays: 56,
    emoji: "🏋️",
    participants: 132,
    joinedAt: daysAgo(14),
  },
  {
    id: "ch_zone2",
    name: "Zone 2 — 600 minutes",
    tagline: "Build the aerobic base. Easy nasal-breathing pace only.",
    kind: "cardio",
    metric: "minutes",
    target: 600,
    durationDays: 42,
    emoji: "🫁",
    participants: 87,
    joinedAt: null,
  },
  {
    id: "ch_habit21",
    name: "21-day Habit Loop",
    tagline: "Three weeks of veg-first plates, water target, and an evening walk.",
    kind: "lifestyle",
    metric: "days",
    target: 21,
    durationDays: 21,
    emoji: "🥗",
    participants: 410,
    joinedAt: null,
  },
  {
    id: "ch_anymove",
    name: "Move Daily — 14 days",
    tagline: "Any deliberate movement counts. Build the habit, then build the volume.",
    kind: "any",
    metric: "days",
    target: 14,
    durationDays: 14,
    emoji: "⚡",
    participants: 612,
    joinedAt: null,
  },
];

function loadChallenges(): Challenge[] {
  if (typeof window === "undefined") return SEED;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED;
    const parsed = JSON.parse(raw) as Challenge[];
    return Array.isArray(parsed) && parsed.length ? parsed : SEED;
  } catch {
    return SEED;
  }
}

function saveChallenges(list: Challenge[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function progressFor(c: Challenge, checkIns: CheckIn[]) {
  if (!c.joinedAt) return { value: 0, pct: 0, daysLeft: c.durationDays, ended: false };
  const start = new Date(c.joinedAt).getTime();
  const endMs = start + c.durationDays * 86_400_000;
  const ended = Date.now() >= endMs;
  const daysLeft = Math.max(0, Math.ceil((endMs - Date.now()) / 86_400_000));
  const inRange = checkIns.filter((ci) => {
    const t = new Date(ci.date).getTime();
    if (t < start || t > endMs) return false;
    if (c.kind === "any") return true;
    return ci.activityType === c.kind;
  });
  let value = 0;
  if (c.metric === "sessions") value = inRange.length;
  else if (c.metric === "minutes") value = inRange.reduce((s, ci) => s + (ci.duration || 0), 0);
  else {
    const days = new Set(inRange.map((ci) => ci.date.slice(0, 10)));
    value = days.size;
  }
  const pct = Math.min(100, Math.round((value / c.target) * 100));
  return { value, pct, daysLeft, ended };
}

function kindIcon(k: ChallengeKind) {
  if (k === "cardio") return Activity;
  if (k === "weights") return Dumbbell;
  if (k === "lifestyle") return Apple;
  return Sparkles;
}

function metricLabel(m: ChallengeMetric) {
  if (m === "sessions") return "sessions";
  if (m === "minutes") return "min";
  return "days";
}

function ChallengesRoute() {
  const { checkIns } = useApp();
  const [list, setList] = useState<Challenge[]>(SEED);
  const [hydrated, setHydrated] = useState(false);
  const [tab, setTab] = useState<"active" | "browse">("active");
  const [showNew, setShowNew] = useState(false);

  useEffect(() => {
    setList(loadChallenges());
    setHydrated(true);
  }, []);
  useEffect(() => {
    if (hydrated) saveChallenges(list);
  }, [list, hydrated]);

  const active = useMemo(() => list.filter((c) => !!c.joinedAt), [list]);
  const browse = useMemo(() => list.filter((c) => !c.joinedAt), [list]);

  function join(id: string) {
    setList((xs) =>
      xs.map((c) =>
        c.id === id ? { ...c, joinedAt: now(), participants: c.participants + 1 } : c,
      ),
    );
    haptic("success");
    toast.success("You're in. The clock starts now.");
    setTab("active");
  }
  function leave(id: string) {
    setList((xs) =>
      xs.map((c) =>
        c.id === id
          ? { ...c, joinedAt: null, participants: Math.max(0, c.participants - 1) }
          : c,
      ),
    );
    haptic("tap");
    toast("Left the challenge.");
  }
  function remove(id: string) {
    setList((xs) => xs.filter((c) => c.id !== id));
    haptic("tap");
  }
  function add(c: Omit<Challenge, "id" | "participants" | "joinedAt">) {
    const ch: Challenge = {
      ...c,
      id: `ch_${Date.now()}`,
      participants: 1,
      joinedAt: now(),
    };
    setList((xs) => [ch, ...xs]);
    haptic("success");
    toast.success(`Created "${ch.name}". You're in.`);
    setShowNew(false);
    setTab("active");
  }

  const totalDone = active.reduce((s, c) => s + progressFor(c, checkIns).value, 0);
  const totalGoal = active.reduce((s, c) => s + c.target, 0);
  const finished = active.filter((c) => progressFor(c, checkIns).pct >= 100).length;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-muted-foreground">
          <Flag className="h-3.5 w-3.5" /> Challenges
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
          Pick a fight. Win it loud.
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Time-boxed challenges turn vague intent into concrete reps. Join one, and every
          check-in counts toward it automatically.
        </p>
      </header>

      <div className="grid grid-cols-3 gap-3">
        <StatCard icon={Flame} label="Active" value={`${active.length}`} hint="in flight" />
        <StatCard icon={Trophy} label="Cleared" value={`${finished}`} hint="hit target" />
        <StatCard
          icon={Sparkles}
          label="Progress"
          value={totalGoal ? `${Math.round((totalDone / totalGoal) * 100)}%` : "—"}
          hint="across active"
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="inline-flex rounded-lg border border-border bg-surface-2/40 p-1">
          <TabBtn active={tab === "active"} onClick={() => setTab("active")}>
            Active <span className="ml-1 text-muted-foreground">· {active.length}</span>
          </TabBtn>
          <TabBtn active={tab === "browse"} onClick={() => setTab("browse")}>
            Browse <span className="ml-1 text-muted-foreground">· {browse.length}</span>
          </TabBtn>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-[0_10px_30px_-12px_var(--color-primary)] hover:brightness-110"
        >
          <Plus className="h-4 w-4" /> New challenge
        </button>
      </div>

      {tab === "active" ? (
        active.length === 0 ? (
          <EmptyState
            title="No active challenges"
            body="Join one from Browse, or design your own. We'll track your progress from your check-ins."
            cta={
              <button
                onClick={() => setTab("browse")}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface-2/60 px-3 py-2 text-sm font-semibold hover:bg-accent"
              >
                Browse challenges
              </button>
            }
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {active.map((c) => (
              <ActiveCard
                key={c.id}
                c={c}
                checkIns={checkIns}
                onLeave={() => leave(c.id)}
                onRemove={() => remove(c.id)}
              />
            ))}
          </div>
        )
      ) : browse.length === 0 ? (
        <EmptyState
          title="You've joined everything"
          body="That's ambitious. Create a custom challenge to keep stacking."
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {browse.map((c) => (
            <BrowseCard key={c.id} c={c} onJoin={() => join(c.id)} />
          ))}
        </div>
      )}

      <div className="rounded-2xl border border-border bg-surface-2/30 p-5">
        <div className="flex items-start gap-3">
          <Users className="h-5 w-5 mt-0.5 text-primary shrink-0" />
          <div className="space-y-1">
            <div className="font-display text-base font-bold">Rally your crew</div>
            <p className="text-sm text-muted-foreground">
              Invite a Crew member to a challenge — verified sessions count double toward the
              leaderboard. Head to{" "}
              <Link to="/community" className="text-primary hover:underline">
                Community
              </Link>{" "}
              to send a nudge.
            </p>
          </div>
        </div>
      </div>

      {showNew && <NewChallengeDialog onClose={() => setShowNew(false)} onSubmit={add} />}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface-2/40 p-3">
      <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3 w-3" /> {label}
      </div>
      <div className="font-display text-2xl font-bold mt-1">{value}</div>
      <div className="text-[11px] text-muted-foreground">{hint}</div>
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-sm font-semibold rounded-md transition ${
        active
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function ActiveCard({
  c,
  checkIns,
  onLeave,
  onRemove,
}: {
  c: Challenge;
  checkIns: CheckIn[];
  onLeave: () => void;
  onRemove: () => void;
}) {
  const { value, pct, daysLeft, ended } = progressFor(c, checkIns);
  const Icon = kindIcon(c.kind);
  const won = pct >= 100;
  const dayIn = c.joinedAt
    ? Math.max(1, differenceInCalendarDays(new Date(), new Date(c.joinedAt)) + 1)
    : 1;
  return (
    <div
      className={`rounded-2xl border p-5 ${
        won
          ? "border-primary/60 bg-primary/[0.06]"
          : "border-border bg-surface-2/40"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-background border border-border text-xl shrink-0">
            {c.emoji}
          </div>
          <div className="min-w-0">
            <div className="font-display font-bold text-base leading-tight truncate">{c.name}</div>
            <div className="text-xs text-muted-foreground line-clamp-2">{c.tagline}</div>
          </div>
        </div>
        <button
          onClick={onRemove}
          aria-label="Remove"
          className="text-muted-foreground hover:text-foreground p-1"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 space-y-1.5">
        <div className="flex items-baseline justify-between gap-2">
          <div className="font-mono text-xs text-muted-foreground">
            {value} / {c.target} {metricLabel(c.metric)}
          </div>
          <div className="font-display text-lg font-bold">{pct}%</div>
        </div>
        <div className="h-2 rounded-full bg-background overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              won ? "bg-primary" : "bg-primary/80"
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Icon className="h-3.5 w-3.5" />
          {c.kind === "any" ? "Any session" : c.kind}
        </span>
        <span className="inline-flex items-center gap-1.5">
          {won ? (
            <>
              <Trophy className="h-3.5 w-3.5 text-primary" />
              <span className="text-primary font-semibold">Cleared</span>
            </>
          ) : ended ? (
            <>
              <Timer className="h-3.5 w-3.5" /> Window closed
            </>
          ) : (
            <>
              <CalendarIcon className="h-3.5 w-3.5" />
              Day {dayIn} · {daysLeft}d left
            </>
          )}
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between gap-2">
        <div className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
          <Users className="h-3 w-3" /> {c.participants.toLocaleString()} in
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/check-in"
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-2.5 py-1.5 text-xs font-semibold text-primary-foreground hover:brightness-110"
          >
            <Check className="h-3.5 w-3.5" /> Log session
          </Link>
          <button
            onClick={onLeave}
            className="rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            Leave
          </button>
        </div>
      </div>
    </div>
  );
}

function BrowseCard({ c, onJoin }: { c: Challenge; onJoin: () => void }) {
  const Icon = kindIcon(c.kind);
  return (
    <div className="rounded-2xl border border-border bg-surface-2/30 p-5 flex flex-col">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-background border border-border text-xl shrink-0">
          {c.emoji}
        </div>
        <div className="min-w-0">
          <div className="font-display font-bold text-base leading-tight">{c.name}</div>
          <div className="text-xs text-muted-foreground">{c.tagline}</div>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
        <Stat label="Target" value={`${c.target} ${metricLabel(c.metric)}`} />
        <Stat label="Window" value={`${c.durationDays}d`} />
        <Stat label="In" value={c.participants.toLocaleString()} />
      </div>
      <div className="mt-4 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Icon className="h-3.5 w-3.5" />
          {c.kind === "any" ? "Any session" : `${c.kind} only`}
        </span>
        <button
          onClick={onJoin}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:brightness-110"
        >
          <Flag className="h-3.5 w-3.5" /> Join
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-background border border-border px-2 py-1.5">
      <div className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="font-semibold text-xs">{value}</div>
    </div>
  );
}

function EmptyState({
  title,
  body,
  cta,
}: {
  title: string;
  body: string;
  cta?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-surface-2/20 p-10 text-center">
      <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-background border border-border">
        <Flag className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="font-display font-bold text-base">{title}</div>
      <div className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">{body}</div>
      {cta && <div className="mt-4 flex justify-center">{cta}</div>}
    </div>
  );
}

function NewChallengeDialog({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (c: Omit<Challenge, "id" | "participants" | "joinedAt">) => void;
}) {
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [emoji, setEmoji] = useState("🔥");
  const [kind, setKind] = useState<ChallengeKind>("any");
  const [metric, setMetric] = useState<ChallengeMetric>("sessions");
  const [target, setTarget] = useState(12);
  const [durationDays, setDurationDays] = useState(30);

  function submit() {
    if (!name.trim()) {
      toast.error("Give your challenge a name.");
      return;
    }
    onSubmit({
      name: name.trim(),
      tagline: tagline.trim() || "Custom challenge.",
      emoji: emoji || "🔥",
      kind,
      metric,
      target: Math.max(1, Math.round(target)),
      durationDays: Math.max(1, Math.round(durationDays)),
    });
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end md:items-center justify-center bg-background/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full md:max-w-md rounded-t-2xl md:rounded-2xl border border-border bg-background shadow-2xl p-5 space-y-4 soft-rise"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              New challenge
            </div>
            <div className="font-display text-lg font-bold">Design your fight</div>
          </div>
          <button onClick={onClose} aria-label="Close" className="p-1 text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-[64px_1fr] gap-3">
          <input
            value={emoji}
            onChange={(e) => setEmoji(e.target.value.slice(0, 2))}
            className="text-center text-2xl rounded-lg border border-border bg-surface-2/40 py-2 outline-none focus:border-primary"
            aria-label="Emoji"
          />
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name (e.g. 100 push-ups a day)"
            className="rounded-lg border border-border bg-surface-2/40 px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </div>

        <input
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
          placeholder="One-line intent"
          className="w-full rounded-lg border border-border bg-surface-2/40 px-3 py-2 text-sm outline-none focus:border-primary"
        />

        <div>
          <Label>Activity type</Label>
          <div className="mt-1.5 grid grid-cols-4 gap-1.5">
            {(["any", "cardio", "weights", "lifestyle"] as ChallengeKind[]).map((k) => (
              <button
                key={k}
                onClick={() => setKind(k)}
                className={`rounded-md border px-2 py-1.5 text-xs font-semibold capitalize transition ${
                  kind === k
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border bg-surface-2/40 text-muted-foreground hover:text-foreground"
                }`}
              >
                {k}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label>Track</Label>
          <div className="mt-1.5 grid grid-cols-3 gap-1.5">
            {(["sessions", "minutes", "days"] as ChallengeMetric[]).map((m) => (
              <button
                key={m}
                onClick={() => setMetric(m)}
                className={`rounded-md border px-2 py-1.5 text-xs font-semibold capitalize transition ${
                  metric === m
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border bg-surface-2/40 text-muted-foreground hover:text-foreground"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Target ({metricLabel(metric)})</Label>
            <input
              type="number"
              min={1}
              value={target}
              onChange={(e) => setTarget(Number(e.target.value))}
              className="mt-1.5 w-full rounded-lg border border-border bg-surface-2/40 px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
          <div>
            <Label>Window (days)</Label>
            <input
              type="number"
              min={1}
              value={durationDays}
              onChange={(e) => setDurationDays(Number(e.target.value))}
              className="mt-1.5 w-full rounded-lg border border-border bg-surface-2/40 px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-border bg-surface-2/40 px-3 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:brightness-110"
          >
            <Flag className="h-3.5 w-3.5" /> Create & join
          </button>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Progress is computed live from your check-ins in the selected window. Joined: {format(new Date(), "MMM d")}.
        </p>
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
      {children}
    </div>
  );
}
