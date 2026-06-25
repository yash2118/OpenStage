import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useApp, type WeeklyPlanSlot } from "@/lib/store";
import { haptic } from "@/lib/haptics";
import { toast } from "sonner";
import { Save, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authed/plan")({
  component: PlanPage,
});

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const TYPES: WeeklyPlanSlot["type"][] = ["cardio", "weights", "lifestyle", "sport", "rest"];
const TYPE_TONE: Record<WeeklyPlanSlot["type"], string> = {
  cardio: "bg-[#ff6b35]/15 text-[#ff6b35] border-[#ff6b35]/30",
  weights: "bg-primary/15 text-primary border-primary/30",
  lifestyle: "bg-[#10b981]/15 text-[#10b981] border-[#10b981]/30",
  sport: "bg-[#8b5cf6]/15 text-[#8b5cf6] border-[#8b5cf6]/30",
  rest: "bg-muted text-muted-foreground border-border",
};

function PlanPage() {
  const { weeklyPlan, setWeeklyPlan, onboarding } = useApp();
  const [draft, setDraft] = useState<WeeklyPlanSlot[]>(
    DAYS.map((_, i) => weeklyPlan.find((s) => s.day === i) ?? { day: i, title: "Rest & recover", type: "rest" }),
  );

  function update(i: number, patch: Partial<WeeklyPlanSlot>) {
    setDraft((d) => d.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }

  function save() {
    setWeeklyPlan(draft);
    haptic("success");
    toast.success("Weekly plan locked in.");
  }

  function suggest() {
    const target = onboarding?.weeklyCommitment ?? 4;
    const order: WeeklyPlanSlot["type"][] = ["weights", "cardio", "weights", "lifestyle", "weights", "cardio", "rest"];
    let used = 0;
    const next = DAYS.map((_, i) => {
      const t = order[i];
      const isTraining = t !== "lifestyle" && t !== "rest";
      if (isTraining && used >= target) {
        return { day: i, title: "Active recovery", type: "lifestyle" as const, time: "18:00" };
      }
      if (isTraining) used++;
      const titles: Record<WeeklyPlanSlot["type"], string> = {
        weights: "Strength session",
        cardio: "Conditioning",
        lifestyle: "Mobility + walk",
        sport: "Sport practice",
        rest: "Full rest day",
      };
      return { day: i, title: titles[t], type: t, time: t === "rest" ? undefined : "07:00" };
    });
    setDraft(next);
    haptic("tap");
  }

  return (
    <div className="space-y-6 fade-up max-w-3xl">
      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Weekly plan builder
        </div>
        <h1 className="font-display font-black text-3xl tracking-tight mt-1">
          Plan the week, win the week
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          Design Monday → Sunday. We'll surface today's slot on the Today screen.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={suggest}
          className="inline-flex items-center gap-2 rounded-xl bg-surface-2 px-4 py-2 text-sm font-semibold border border-border active:scale-95 transition"
        >
          <Sparkles className="h-4 w-4 text-primary" /> Auto-suggest
        </button>
        <button
          onClick={save}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground active:scale-95 transition"
        >
          <Save className="h-4 w-4" /> Save plan
        </button>
      </div>

      <div className="space-y-3">
        {draft.map((slot, i) => (
          <div key={i} className="rounded-2xl border border-border/50 bg-card p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="font-display font-black text-lg">{DAYS[i]}</div>
              <span
                className={`text-[10px] font-mono uppercase tracking-wider rounded-full border px-2 py-0.5 ${TYPE_TONE[slot.type]}`}
              >
                {slot.type}
              </span>
            </div>
            <input
              value={slot.title}
              onChange={(e) => update(i, { title: e.target.value })}
              className="w-full rounded-lg bg-surface-2 border border-border px-3 py-2 text-sm font-semibold"
              placeholder="Session name"
            />
            <div className="mt-2 flex items-center gap-2">
              <input
                type="time"
                value={slot.time ?? ""}
                disabled={slot.type === "rest"}
                onChange={(e) => update(i, { time: e.target.value })}
                className="rounded-lg bg-surface-2 border border-border px-3 py-1.5 text-sm disabled:opacity-40"
              />
              <select
                value={slot.type}
                onChange={(e) => update(i, { type: e.target.value as WeeklyPlanSlot["type"] })}
                className="rounded-lg bg-surface-2 border border-border px-3 py-1.5 text-sm capitalize"
              >
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}