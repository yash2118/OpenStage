import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useApp, weeklyProgress } from "@/lib/store";
import {
  Dumbbell,
  Activity,
  Apple,
  Target,
  Plus,
  TrendingUp,
  Trash2,
  Trophy,
  CalendarCheck,
  Scale,
  X,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { haptic } from "@/lib/haptics";
import { format } from "date-fns";

export const Route = createFileRoute("/_authed/goals")({
  head: () => ({ meta: [{ title: "Goals & PRs — OpenStage" }] }),
  component: GoalsRoute,
});

type PRKind = "lift" | "cardio" | "habit";

type PR = {
  id: string;
  kind: PRKind;
  name: string;
  unit: string;
  current: number;
  target: number;
  best: number;
  bestDate: string;
  history: { date: string; value: number }[];
};

const STORAGE_KEY = "openstage.prs.v2";

const SEED: PR[] = [
  {
    id: "pr_bench",
    kind: "lift",
    name: "Bench press 1RM",
    unit: "kg",
    current: 85,
    target: 100,
    best: 85,
    bestDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
    history: [
      { date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(), value: 72.5 },
      { date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 35).toISOString(), value: 80 },
      { date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(), value: 85 },
    ],
  },
  {
    id: "pr_squat",
    kind: "lift",
    name: "Back squat 1RM",
    unit: "kg",
    current: 120,
    target: 140,
    best: 120,
    bestDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    history: [
      { date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 80).toISOString(), value: 100 },
      { date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(), value: 112.5 },
      { date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), value: 120 },
    ],
  },
  {
    id: "pr_5k",
    kind: "cardio",
    name: "5K time",
    unit: "min",
    current: 24.2,
    target: 22.0,
    best: 24.2,
    bestDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
    history: [
      { date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90).toISOString(), value: 27.5 },
      { date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 40).toISOString(), value: 25.4 },
      { date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(), value: 24.2 },
    ],
  },
];

const KIND_META: Record<
  PRKind,
  { label: string; icon: typeof Dumbbell; tint: string; lowerIsBetter?: boolean }
> = {
  lift: { label: "Lift", icon: Dumbbell, tint: "text-primary bg-primary/10" },
  cardio: { label: "Cardio", icon: Activity, tint: "text-ember bg-ember/10", lowerIsBetter: true },
  habit: { label: "Habit", icon: Apple, tint: "text-accent bg-accent/10" },
};

function loadPRs(): PR[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    return SEED;
  } catch {
    return SEED;
  }
}

function savePRs(prs: PR[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prs));
  } catch {
    // ignore
  }
}

function GoalsRoute() {
  const { onboarding, checkIns } = useApp();
  const [prs, setPRs] = useState<PR[]>([]);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    setPRs(loadPRs());
  }, []);

  useEffect(() => {
    if (prs.length > 0) savePRs(prs);
  }, [prs]);

  const weekly = weeklyProgress(checkIns, onboarding?.weeklyCommitment ?? 4);

  const grouped = useMemo(() => {
    const m = new Map<PRKind, PR[]>();
    (Object.keys(KIND_META) as PRKind[]).forEach((k) => m.set(k, []));
    prs.forEach((p) => m.get(p.kind)!.push(p));
    return m;
  }, [prs]);

  const logUpdate = (id: string, value: number) => {
    const today = new Date().toISOString();
    setPRs((list) =>
      list.map((p) => {
        if (p.id !== id) return p;
        const meta = KIND_META[p.kind];
        const beats = meta.lowerIsBetter ? value < p.best : value > p.best;
        return {
          ...p,
          current: value,
          best: beats ? value : p.best,
          bestDate: beats ? today : p.bestDate,
          history: [...p.history, { date: today, value }].slice(-12),
        };
      }),
    );
    haptic("success");
    toast.success("PR logged.");
  };

  const remove = (id: string) => {
    setPRs((list) => list.filter((p) => p.id !== id));
    haptic("tap");
    toast("Removed.");
  };

  const addPR = (input: Omit<PR, "id" | "history" | "best" | "bestDate">) => {
    const id = `pr_${Date.now()}`;
    const now = new Date().toISOString();
    setPRs((list) => [
      ...list,
      {
        ...input,
        id,
        best: input.current,
        bestDate: now,
        history: [{ date: now, value: input.current }],
      },
    ]);
    haptic("success");
    toast.success("Goal added.");
  };

  const totalAtTarget = prs.filter((p) => {
    const meta = KIND_META[p.kind];
    return meta.lowerIsBetter ? p.best <= p.target : p.best >= p.target;
  }).length;

  // body weight progress from onboarding
  const bodyGoal = onboarding
    ? (() => {
        const from = onboarding.weightKg;
        const target = onboarding.goalWeightKg;
        const cur = onboarding.weightKg; // demo: no live tracking yet
        const total = Math.abs(from - target);
        const done = Math.abs(from - cur);
        const pct = total ? Math.min(100, Math.round((done / total) * 100)) : 0;
        return { from, target, cur, pct };
      })()
    : null;

  return (
    <div className="space-y-8">
      <header className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Goals & PRs</div>
          <h1 className="font-display font-bold text-3xl md:text-4xl mt-2 tracking-tight">
            What you're chasing.
          </h1>
          <p className="text-muted-foreground mt-2 max-w-xl">
            Numbers you've promised your future self. Update them when you beat them — the curve does the rest.
          </p>
        </div>
        <button
          onClick={() => {
            setAdding(true);
            haptic("tap");
          }}
          className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> New goal
        </button>
      </header>

      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat icon={Trophy} label="At target" value={`${totalAtTarget}/${prs.length}`} tint="text-primary" />
        <Stat icon={Target} label="Open goals" value={prs.length - totalAtTarget} />
        <Stat
          icon={CalendarCheck}
          label="Weekly cadence"
          value={`${weekly.done}/${weekly.target}`}
          tint={weekly.done >= weekly.target ? "text-primary" : undefined}
        />
        <Stat icon={Scale} label="Body goal" value={bodyGoal ? `${bodyGoal.target}kg` : "—"} />
      </section>

      {bodyGoal && (
        <section className="card-elevated p-6">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <div className="font-mono text-xs uppercase tracking-wider text-primary">Body composition</div>
              <h2 className="font-display font-bold text-xl mt-1">
                {bodyGoal.from}kg → {bodyGoal.target}kg
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Update your weight in <Link to="/health" className="text-primary hover:underline">Health</Link> to move this bar.
              </p>
            </div>
            <div className="text-right">
              <div className="font-display font-bold text-3xl tabular-nums">{bodyGoal.pct}%</div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">to goal</div>
            </div>
          </div>
          <div className="mt-4 h-2 rounded-full bg-surface-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-ember transition-all"
              style={{ width: `${bodyGoal.pct}%` }}
            />
          </div>
        </section>
      )}

      {(Object.keys(KIND_META) as PRKind[]).map((kind) => {
        const list = grouped.get(kind) ?? [];
        const meta = KIND_META[kind];
        const KindIcon = meta.icon;
        if (list.length === 0 && kind === "habit") return null;
        return (
          <section key={kind}>
            <div className="flex items-center gap-2 mb-3">
              <span className={`grid h-8 w-8 place-items-center rounded-xl ${meta.tint}`}>
                <KindIcon className="h-4 w-4" />
              </span>
              <h2 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                {meta.label} goals
              </h2>
              <div className="ml-auto text-[10px] font-mono text-muted-foreground">
                {list.length} active
              </div>
            </div>
            {list.length === 0 ? (
              <div className="card-elevated p-6 text-center text-sm text-muted-foreground">
                No {meta.label.toLowerCase()} goals yet — add one to start tracking.
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {list.map((p) => (
                  <PRCard key={p.id} pr={p} onLog={(v) => logUpdate(p.id, v)} onRemove={() => remove(p.id)} />
                ))}
              </div>
            )}
          </section>
        );
      })}

      <AddPRDialog open={adding} onClose={() => setAdding(false)} onAdd={addPR} />
    </div>
  );
}

function PRCard({
  pr,
  onLog,
  onRemove,
}: {
  pr: PR;
  onLog: (v: number) => void;
  onRemove: () => void;
}) {
  const meta = KIND_META[pr.kind];
  const startVal = pr.history[0]?.value ?? pr.current;
  const total = Math.abs(pr.target - startVal);
  const done = meta.lowerIsBetter
    ? Math.max(0, startVal - pr.current)
    : Math.max(0, pr.current - startVal);
  const pct = total ? Math.min(100, Math.round((done / total) * 100)) : 0;
  const atTarget = meta.lowerIsBetter ? pr.best <= pr.target : pr.best >= pr.target;
  const remaining = meta.lowerIsBetter ? pr.current - pr.target : pr.target - pr.current;
  const [value, setValue] = useState(String(pr.current));

  // sparkline path
  const max = Math.max(...pr.history.map((h) => h.value), pr.target);
  const min = Math.min(...pr.history.map((h) => h.value), pr.target);
  const range = max - min || 1;
  const w = 220;
  const h = 36;
  const pts = pr.history
    .map((p, i, arr) => {
      const x = (i / Math.max(1, arr.length - 1)) * w;
      const norm = (p.value - min) / range;
      const y = h - norm * h;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <div className="card-elevated p-5 relative">
      <button
        onClick={onRemove}
        className="absolute top-3 right-3 text-muted-foreground hover:text-destructive p-1"
        aria-label="Remove"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="font-display font-semibold truncate pr-6">{pr.name}</div>
          <div className="text-xs text-muted-foreground mt-0.5">
            target {pr.target}
            {pr.unit} {meta.lowerIsBetter ? "(lower is better)" : ""}
          </div>
        </div>
        {atTarget && (
          <span className="tag bg-primary/15 text-primary shrink-0">
            <Check className="h-3 w-3" /> Hit
          </span>
        )}
      </div>

      <div className="mt-4 flex items-end gap-4">
        <div>
          <div className="font-display font-bold text-3xl tabular-nums">
            {pr.current}
            <span className="text-sm text-muted-foreground font-mono ml-1">{pr.unit}</span>
          </div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mt-1">
            current · best {pr.best}
            {pr.unit}
          </div>
        </div>
        <div className="ml-auto text-right">
          <div className="text-xs text-muted-foreground">
            {atTarget ? "Beat by" : "To go"}
          </div>
          <div className={`font-display font-bold text-lg ${atTarget ? "text-primary" : ""}`}>
            {Math.abs(remaining).toFixed(remaining % 1 ? 1 : 0)}
            {pr.unit}
          </div>
        </div>
      </div>

      <div className="mt-3 h-2 rounded-full bg-surface-2 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary to-ember transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>

      <svg viewBox={`0 0 ${w} ${h}`} className="mt-4 w-full h-9 overflow-visible">
        <path d={pts} fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>

      <div className="mt-3 flex items-center gap-2">
        <input
          type="number"
          step="0.1"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary/60"
        />
        <button
          onClick={() => {
            const v = Number(value);
            if (!Number.isFinite(v)) return toast.error("Enter a number.");
            onLog(v);
          }}
          className="rounded-lg bg-primary text-primary-foreground px-3 py-2 text-xs font-semibold hover:opacity-90 inline-flex items-center gap-1"
        >
          <TrendingUp className="h-3.5 w-3.5" /> Log
        </button>
      </div>

      <div className="mt-2 text-[10px] font-mono text-muted-foreground">
        last updated {format(new Date(pr.history[pr.history.length - 1]?.date ?? pr.bestDate), "MMM d")}
      </div>
    </div>
  );
}

function AddPRDialog({
  open,
  onClose,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (p: Omit<PR, "id" | "history" | "best" | "bestDate">) => void;
}) {
  const [kind, setKind] = useState<PRKind>("lift");
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("kg");
  const [current, setCurrent] = useState("0");
  const [target, setTarget] = useState("0");

  if (!open) return null;

  const submit = () => {
    if (!name.trim()) return toast.error("Name your goal.");
    const c = Number(current);
    const t = Number(target);
    if (!Number.isFinite(c) || !Number.isFinite(t)) return toast.error("Enter valid numbers.");
    onAdd({ kind, name: name.trim(), unit: unit.trim() || "", current: c, target: t });
    setName("");
    setCurrent("0");
    setTarget("0");
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-background/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-3xl border border-border bg-background shadow-2xl overflow-hidden soft-rise"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-primary">New</div>
            <div className="font-display font-bold">Add a goal</div>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 text-muted-foreground hover:bg-accent" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Type</span>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {(Object.keys(KIND_META) as PRKind[]).map((k) => {
                const Icon = KIND_META[k].icon;
                return (
                  <button
                    key={k}
                    onClick={() => {
                      setKind(k);
                      haptic("select");
                    }}
                    className={`flex flex-col items-center gap-1 rounded-xl border px-3 py-3 text-xs font-semibold transition ${
                      kind === k
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-surface text-foreground/80 hover:bg-accent"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {KIND_META[k].label}
                  </button>
                );
              })}
            </div>
          </div>

          <Input label="Goal name" value={name} onChange={setName} placeholder="e.g. Deadlift 1RM" />
          <div className="grid grid-cols-3 gap-2">
            <Input label="Current" value={current} onChange={setCurrent} type="number" />
            <Input label="Target" value={target} onChange={setTarget} type="number" />
            <Input label="Unit" value={unit} onChange={setUnit} placeholder="kg / min" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 p-4 border-t border-border">
          <button onClick={onClose} className="rounded-full border border-border py-2.5 text-sm font-semibold hover:bg-accent">
            Cancel
          </button>
          <button
            onClick={submit}
            className="rounded-full bg-primary text-primary-foreground py-2.5 text-sm font-semibold hover:opacity-90"
          >
            Add goal
          </button>
        </div>
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary/60"
      />
    </label>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  tint,
}: {
  icon: typeof Target;
  label: string;
  value: string | number;
  tint?: string;
}) {
  return (
    <div className="card-elevated p-4">
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${tint ?? "text-muted-foreground"}`} />
        <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      </div>
      <div className="font-display font-bold text-2xl mt-1.5 tabular-nums">{value}</div>
    </div>
  );
}