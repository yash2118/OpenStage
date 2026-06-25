import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useApp, type HealthLog } from "@/lib/store";
import {
  Droplet,
  Moon,
  Footprints,
  Flame,
  Beef,
  Scale,
  Plus,
  Minus,
  TrendingUp,
  Sparkles,
  HeartPulse,
  ArrowRight,
  Check,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authed/health")({
  head: () => ({ meta: [{ title: "Health — OpenStage" }] }),
  component: HealthPage,
});

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function HealthPage() {
  const { onboarding, healthLogs, logHealth, recoveryLogs } = useApp();
  const today = healthLogs.find((h) => h.date === todayKey());
  const sleepGoal = onboarding?.sleepGoalHrs ?? 8;
  const waterGoal = onboarding?.waterGoalL ?? 2.5;
  const stepsGoal = 8000;
  const calGoal = 2200;
  const proteinGoal = Math.round((onboarding?.weightKg ?? 75) * 1.6);

  const last7 = useMemo(() => {
    const out: HealthLog[] = [];
    const map = new Map(healthLogs.map((h) => [h.date, h]));
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const k = d.toISOString().slice(0, 10);
      out.push(map.get(k) ?? { date: k });
    }
    return out;
  }, [healthLogs]);

  const avg7 = (sel: (h: HealthLog) => number | undefined) => {
    const vals = last7.map(sel).filter((v): v is number => typeof v === "number");
    if (!vals.length) return 0;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  };

  const insight = useMemo(() => {
    const recentRec = recoveryLogs[0];
    const sleepAvg = avg7((h) => h.sleepHrs);
    if (recentRec && recentRec.energy >= 4 && sleepAvg >= sleepGoal - 0.5) {
      return {
        tone: "primary" as const,
        label: "Push harder",
        body: "Sleep + energy trending high. Add a hard set or extend cardio by 10 min.",
      };
    }
    if (recentRec && (recentRec.stress >= 4 || recentRec.sleep <= 2)) {
      return {
        tone: "ember" as const,
        label: "Recovery day",
        body: "Stress high, sleep low. Keep RPE ≤ 6, prioritize water + a walk.",
      };
    }
    return {
      tone: "muted" as const,
      label: "Maintain pace",
      body: "Steady baseline. Stay in your normal training window today.",
    };
  }, [recoveryLogs, last7]);

  return (
    <div className="space-y-6">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4">
        <div className="min-w-0">
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-primary">
            Health tracker
          </div>
          <h1 className="font-display font-bold text-3xl md:text-4xl mt-2 tracking-tight">
            Your daily inputs
          </h1>
          <p className="text-muted-foreground mt-1 max-w-prose">
            Low-friction logging. Tap to add. We use it to tune today&apos;s coaching.
          </p>
        </div>
        <Link
          to="/recovery"
          className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1.5 text-xs font-semibold hover:bg-surface-2/70"
        >
          <HeartPulse className="h-3.5 w-3.5 text-ember" /> Recovery
        </Link>
      </header>

      <section
        className={`card-elevated p-5 sm:p-6 relative overflow-hidden ${
          insight.tone === "ember"
            ? "bg-ember/10 border-ember/30"
            : insight.tone === "primary"
              ? "bg-primary/10 border-primary/30"
              : ""
        }`}
      >
        <div className="flex items-start gap-4">
          <span
            className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${
              insight.tone === "ember"
                ? "bg-ember text-ember-foreground"
                : insight.tone === "primary"
                  ? "bg-primary text-primary-foreground"
                  : "bg-surface-2 text-foreground"
            }`}
          >
            <Sparkles className="h-5 w-5" />
          </span>
          <div className="flex-1 min-w-0">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
              Coach signal
            </div>
            <div className="font-display font-bold text-lg mt-1">{insight.label}</div>
            <p className="text-sm text-muted-foreground mt-1">{insight.body}</p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <Ring
          icon={Moon}
          label="Sleep"
          unit="h"
          value={today?.sleepHrs ?? 0}
          goal={sleepGoal}
          step={0.5}
          color="oklch(0.7 0.15 240)"
          onChange={(v) => logHealth({ sleepHrs: v })}
        />
        <Ring
          icon={Droplet}
          label="Water"
          unit="L"
          value={today?.waterL ?? 0}
          goal={waterGoal}
          step={0.25}
          color="oklch(0.78 0.16 220)"
          onChange={(v) => logHealth({ waterL: v })}
        />
        <Ring
          icon={Footprints}
          label="Steps"
          unit=""
          value={today?.steps ?? 0}
          goal={stepsGoal}
          step={500}
          color="oklch(0.85 0.18 130)"
          onChange={(v) => logHealth({ steps: v })}
        />
        <Ring
          icon={Flame}
          label="Calories"
          unit=""
          value={today?.calories ?? 0}
          goal={calGoal}
          step={50}
          color="oklch(0.72 0.19 48)"
          onChange={(v) => logHealth({ calories: v })}
        />
        <Ring
          icon={Beef}
          label="Protein"
          unit="g"
          value={today?.proteinG ?? 0}
          goal={proteinGoal}
          step={5}
          color="oklch(0.7 0.18 10)"
          onChange={(v) => logHealth({ proteinG: v })}
        />
        <WeightCard
          value={today?.weightKg}
          goal={onboarding?.goalWeightKg}
          onSave={(v) => {
            logHealth({ weightKg: v });
            toast.success(`Logged ${v}kg`);
          }}
        />
      </section>

      <section className="card-elevated p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-mono text-xs uppercase tracking-wider text-primary">
              7-day trend
            </div>
            <div className="font-display font-bold text-xl mt-1">How you&apos;ve been</div>
          </div>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="mt-5 grid sm:grid-cols-3 gap-4">
          <MiniBar
            label="Sleep"
            unit="h"
            goal={sleepGoal}
            values={last7.map((h) => h.sleepHrs ?? 0)}
            color="oklch(0.7 0.15 240)"
          />
          <MiniBar
            label="Water"
            unit="L"
            goal={waterGoal}
            values={last7.map((h) => h.waterL ?? 0)}
            color="oklch(0.78 0.16 220)"
          />
          <MiniBar
            label="Steps (k)"
            unit="k"
            goal={stepsGoal / 1000}
            values={last7.map((h) => (h.steps ?? 0) / 1000)}
            color="oklch(0.85 0.18 130)"
          />
        </div>
      </section>

      <section className="card-elevated p-5 sm:p-6">
        <div className="font-mono text-xs uppercase tracking-wider text-primary">
          Quick log · emoji mode
        </div>
        <div className="font-display font-bold text-xl mt-1">How do you feel right now?</div>
        <p className="text-sm text-muted-foreground mt-1">
          One tap. Routes to the full recovery form.
        </p>
        <div className="mt-4 grid grid-cols-5 gap-2">
          {[
            { e: "😩", l: "Drained" },
            { e: "😴", l: "Tired" },
            { e: "🙂", l: "Okay" },
            { e: "💪", l: "Strong" },
            { e: "🔥", l: "On fire" },
          ].map((m) => (
            <Link
              key={m.l}
              to="/recovery"
              className="rounded-2xl border border-border bg-surface px-2 py-3 text-center hover:border-primary/60 transition"
            >
              <div className="text-2xl">{m.e}</div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mt-1">
                {m.l}
              </div>
            </Link>
          ))}
        </div>
        <Link
          to="/recovery"
          className="mt-4 inline-flex items-center gap-1.5 text-sm text-primary font-semibold"
        >
          Full recovery log <ArrowRight className="h-3 w-3" />
        </Link>
      </section>
    </div>
  );
}

function Ring({
  icon: Icon,
  label,
  unit,
  value,
  goal,
  step,
  color,
  onChange,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  unit: string;
  value: number;
  goal: number;
  step: number;
  color: string;
  onChange: (v: number) => void;
}) {
  const pct = Math.min(100, (value / Math.max(0.0001, goal)) * 100);
  const r = 38;
  const c = 2 * Math.PI * r;
  const dash = (pct / 100) * c;
  const done = pct >= 100;
  return (
    <div className="card-elevated p-4 flex flex-col">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="grid h-7 w-7 place-items-center rounded-lg"
            style={{ background: `${color}22`, color }}
          >
            <Icon className="h-4 w-4" />
          </span>
          <span className="font-display font-semibold text-sm">{label}</span>
        </div>
        {done && <Check className="h-4 w-4 text-primary" />}
      </div>
      <div className="mt-3 relative grid place-items-center">
        <svg viewBox="0 0 100 100" className="h-28 w-28 -rotate-90">
          <circle cx="50" cy="50" r={r} stroke="var(--color-surface-2)" strokeWidth="9" fill="none" />
          <circle
            cx="50"
            cy="50"
            r={r}
            stroke={color}
            strokeWidth="9"
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${dash} ${c}`}
            style={{ transition: "stroke-dasharray 500ms ease" }}
          />
        </svg>
        <div className="absolute text-center">
          <div className="font-display font-bold text-xl leading-none">
            {formatNum(value)}
            <span className="text-xs text-muted-foreground ml-0.5">{unit}</span>
          </div>
          <div className="text-[10px] font-mono text-muted-foreground mt-1">
            / {formatNum(goal)}
            {unit}
          </div>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, +(value - step).toFixed(2)))}
          className="inline-flex items-center justify-center gap-1 rounded-lg border border-border bg-surface py-2 text-xs font-semibold hover:bg-surface-2"
        >
          <Minus className="h-3 w-3" /> {formatNum(step)}
        </button>
        <button
          type="button"
          onClick={() => onChange(+(value + step).toFixed(2))}
          className="inline-flex items-center justify-center gap-1 rounded-lg bg-primary text-primary-foreground py-2 text-xs font-semibold hover:opacity-90"
        >
          <Plus className="h-3 w-3" /> {formatNum(step)}
        </button>
      </div>
    </div>
  );
}

function WeightCard({
  value,
  goal,
  onSave,
}: {
  value?: number;
  goal?: number;
  onSave: (v: number) => void;
}) {
  const [draft, setDraft] = useState<string>(value ? String(value) : "");
  const delta = value && goal ? +(value - goal).toFixed(1) : null;
  return (
    <div className="card-elevated p-4 flex flex-col">
      <div className="flex items-center gap-2">
        <span
          className="grid h-7 w-7 place-items-center rounded-lg"
          style={{ background: "oklch(0.75 0.18 320 / 0.15)", color: "oklch(0.75 0.18 320)" }}
        >
          <Scale className="h-4 w-4" />
        </span>
        <span className="font-display font-semibold text-sm">Weight</span>
      </div>
      <div className="mt-4 flex items-baseline gap-1">
        <span className="font-display font-bold text-3xl">{value ?? "—"}</span>
        <span className="text-xs text-muted-foreground">kg</span>
      </div>
      {goal && (
        <div className="text-[11px] text-muted-foreground mt-1">
          Goal {goal}kg{delta !== null && ` · ${delta > 0 ? "+" : ""}${delta}`}
        </div>
      )}
      <div className="mt-auto pt-3 flex gap-2">
        <input
          type="number"
          step="0.1"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="kg"
          className="flex-1 min-w-0 rounded-lg border border-border bg-surface px-2 py-2 text-sm outline-none focus:border-primary/60"
        />
        <button
          type="button"
          onClick={() => {
            const n = Number(draft);
            if (n > 0) onSave(n);
          }}
          className="shrink-0 rounded-lg bg-primary text-primary-foreground px-3 py-2 text-xs font-semibold hover:opacity-90"
        >
          Save
        </button>
      </div>
    </div>
  );
}

function MiniBar({
  label,
  unit,
  goal,
  values,
  color,
}: {
  label: string;
  unit: string;
  goal: number;
  values: number[];
  color: string;
}) {
  const max = Math.max(goal, ...values, 1);
  const avg = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="font-display font-semibold text-sm">{label}</span>
        <span className="text-xs text-muted-foreground">
          avg {formatNum(avg)}
          {unit}
        </span>
      </div>
      <div className="mt-2 flex items-end gap-1 h-20">
        {values.map((v, i) => (
          <div
            key={i}
            className="flex-1 rounded-t-md transition-all"
            style={{
              height: `${Math.max(4, (v / max) * 100)}%`,
              background: v >= goal ? color : `${color}55`,
            }}
            title={`${formatNum(v)}${unit}`}
          />
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[10px] font-mono text-muted-foreground">
        <span>7d ago</span>
        <span>today</span>
      </div>
    </div>
  );
}

function formatNum(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(n < 1 ? 2 : 1);
}