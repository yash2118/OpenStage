import { createFileRoute } from "@tanstack/react-router";
import { useApp, type BodyMetric } from "@/lib/store";
import { useMemo, useState } from "react";
import { Ruler, Trash2, TrendingDown, TrendingUp, Minus, Plus } from "lucide-react";
import { haptic } from "@/lib/haptics";
import { toast } from "sonner";

export const Route = createFileRoute("/_authed/body")({
  head: () => ({ meta: [{ title: "Body Metrics — OpenStage" }] }),
  component: BodyPage,
});

type Field = { key: keyof BodyMetric; label: string; unit: string; step: number };
const FIELDS: Field[] = [
  { key: "weightKg", label: "Weight", unit: "kg", step: 0.1 },
  { key: "waistCm", label: "Waist", unit: "cm", step: 0.5 },
  { key: "chestCm", label: "Chest", unit: "cm", step: 0.5 },
  { key: "armCm", label: "Arm", unit: "cm", step: 0.5 },
  { key: "hipCm", label: "Hip", unit: "cm", step: 0.5 },
  { key: "bodyFatPct", label: "Body Fat", unit: "%", step: 0.1 },
];

function BodyPage() {
  const { bodyMetrics, onboarding, logBodyMetric, deleteBodyMetric } = useApp();
  const today = new Date().toISOString().slice(0, 10);
  const todayEntry = bodyMetrics.find((m) => m.date === today);
  const [draft, setDraft] = useState<Partial<BodyMetric>>(() => todayEntry ?? {});
  const [note, setNote] = useState(todayEntry?.note ?? "");

  const sorted = useMemo(
    () => [...bodyMetrics].sort((a, b) => (a.date < b.date ? 1 : -1)),
    [bodyMetrics],
  );

  const trend = (key: keyof BodyMetric) => {
    const series = sorted
      .map((m) => (typeof m[key] === "number" ? (m[key] as number) : null))
      .filter((v): v is number => v != null);
    if (series.length < 2) return { delta: 0, first: series[0], last: series[0] };
    const last = series[0];
    const first = series[series.length - 1];
    return { delta: last - first, first, last };
  };

  const startWeight = onboarding?.weightKg;
  const goalWeight = onboarding?.goalWeightKg;
  const latestWeight = sorted.find((m) => m.weightKg != null)?.weightKg ?? startWeight;
  const towardGoal =
    startWeight != null && goalWeight != null && latestWeight != null
      ? Math.max(0, Math.min(100, Math.round(((startWeight - latestWeight) / (startWeight - goalWeight)) * 100)))
      : null;

  const adjust = (key: keyof BodyMetric, step: number) => {
    haptic("select");
    setDraft((d) => {
      const cur = typeof d[key] === "number" ? (d[key] as number) : (todayEntry?.[key] as number | undefined) ?? 0;
      const next = Math.max(0, Math.round((cur + step) * 10) / 10);
      return { ...d, [key]: next };
    });
  };

  const save = () => {
    const payload: Omit<BodyMetric, "date"> = { ...draft, note: note.trim() || undefined };
    if (Object.values(payload).every((v) => v === undefined || v === "")) {
      toast.error("Add at least one measurement.");
      return;
    }
    logBodyMetric(payload);
    haptic("success");
    toast.success("Measurement saved.");
  };

  return (
    <div className="space-y-6 fade-up pb-10">
      <header>
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">Body</div>
        <h1 className="text-3xl font-display font-black tracking-tight mt-1">Measurements</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Weekly snapshots. The scale lies; the trend tells the truth.
        </p>
      </header>

      {towardGoal != null && (
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
          <div className="flex items-end justify-between">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Toward goal weight
              </div>
              <div className="font-display font-black text-2xl mt-1">
                {latestWeight}<span className="text-muted-foreground text-base"> kg</span>
                <span className="text-muted-foreground text-sm font-normal"> · target {goalWeight} kg</span>
              </div>
            </div>
            <div className="font-display font-black text-3xl text-primary">{towardGoal}%</div>
          </div>
          <div className="h-2 mt-3 bg-surface-2 rounded-full overflow-hidden">
            <div className="h-full bg-primary transition-all" style={{ width: `${towardGoal}%` }} />
          </div>
        </div>
      )}

      <section className="rounded-2xl border border-border/50 bg-card p-4">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Log today
        </div>
        <div className="grid grid-cols-2 gap-3 mt-3">
          {FIELDS.map((f) => {
            const val = (draft[f.key] ?? todayEntry?.[f.key]) as number | undefined;
            return (
              <div key={f.key} className="rounded-xl bg-surface-2/50 p-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold">{f.label}</div>
                  <div className="text-[10px] font-mono text-muted-foreground">{f.unit}</div>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <button
                    onClick={() => adjust(f.key, -f.step)}
                    className="grid h-7 w-7 place-items-center rounded-full bg-background border border-border active:scale-95 transition"
                    aria-label={`Decrease ${f.label}`}
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <div className="font-display font-black text-xl tabular-nums">
                    {val != null ? val : "—"}
                  </div>
                  <button
                    onClick={() => adjust(f.key, f.step)}
                    className="grid h-7 w-7 place-items-center rounded-full bg-primary text-primary-foreground active:scale-95 transition"
                    aria-label={`Increase ${f.label}`}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Note (energy, sleep last night, anything off)…"
          className="mt-3 w-full rounded-xl bg-surface-2/60 border border-border/40 p-3 text-sm resize-none"
          rows={2}
        />
        <button
          onClick={save}
          className="mt-3 w-full rounded-full bg-primary text-primary-foreground py-3 font-semibold active:scale-[0.98] transition"
        >
          Save snapshot
        </button>
      </section>

      <section>
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground px-1 pb-2">
          Trends
        </div>
        <div className="grid grid-cols-2 gap-3">
          {FIELDS.map((f) => {
            const t = trend(f.key);
            const dir = t.delta > 0.05 ? "up" : t.delta < -0.05 ? "down" : "flat";
            const Icon = dir === "up" ? TrendingUp : dir === "down" ? TrendingDown : Minus;
            const isGood = f.key === "weightKg" || f.key === "waistCm" || f.key === "bodyFatPct" ? dir === "down" : dir === "up";
            return (
              <div key={f.key} className="rounded-2xl border border-border/50 bg-card p-3">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">{f.label}</div>
                  <Icon className={`h-3.5 w-3.5 ${dir === "flat" ? "text-muted-foreground" : isGood ? "text-primary" : "text-ember"}`} />
                </div>
                <div className="font-display font-black text-xl mt-1 tabular-nums">
                  {t.last != null ? `${t.last}${f.unit}` : "—"}
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  {t.delta ? `${t.delta > 0 ? "+" : ""}${t.delta.toFixed(1)}${f.unit} all-time` : "no change"}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground px-1 pb-2">
          History · {sorted.length} {sorted.length === 1 ? "entry" : "entries"}
        </div>
        {sorted.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center">
            <Ruler className="h-8 w-8 text-muted-foreground mx-auto" />
            <div className="mt-2 text-sm text-muted-foreground">
              No snapshots yet. Log today to start your trend.
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-border/50 bg-card divide-y divide-border overflow-hidden">
            {sorted.map((m) => (
              <div key={m.date} className="flex items-start gap-3 p-3">
                <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground w-16 shrink-0 pt-1">
                  {new Date(m.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
                    {FIELDS.map((f) =>
                      m[f.key] != null ? (
                        <span key={f.key} className="tabular-nums">
                          <span className="text-muted-foreground">{f.label}</span>{" "}
                          <span className="font-semibold">{m[f.key] as number}{f.unit}</span>
                        </span>
                      ) : null,
                    )}
                  </div>
                  {m.note && <div className="text-xs text-muted-foreground mt-1 italic">"{m.note}"</div>}
                </div>
                <button
                  onClick={() => {
                    deleteBodyMetric(m.date);
                    haptic("warn");
                  }}
                  className="grid h-7 w-7 place-items-center rounded-full text-muted-foreground hover:text-ember active:scale-95 transition"
                  aria-label="Delete entry"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}