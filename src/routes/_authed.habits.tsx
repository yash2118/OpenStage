import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Check, Trash2, Link2 } from "lucide-react";
import { useApp } from "@/lib/store";
import { haptic } from "@/lib/haptics";
import { toast } from "sonner";

export const Route = createFileRoute("/_authed/habits")({
  component: HabitsPage,
});

const EMOJIS = ["☀️", "💧", "🧘", "📖", "🚶", "🥗", "🌙", "🦷", "💪"];

function HabitsPage() {
  const { habitStacks, addHabitStack, toggleHabitToday, deleteHabitStack } = useApp();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [anchor, setAnchor] = useState("After morning coffee");
  const [steps, setSteps] = useState("Pour water\n5 min stretch\nWrite top 3");
  const [emoji, setEmoji] = useState("☀️");

  const today = new Date().toISOString().slice(0, 10);
  const totalToday = habitStacks.filter((h) => h.completions.includes(today)).length;

  function save() {
    if (!name.trim()) return;
    addHabitStack({
      name: name.trim(),
      anchor: anchor.trim(),
      steps: steps.split("\n").map((s) => s.trim()).filter(Boolean),
      emoji,
    });
    haptic("success");
    toast.success("Habit stack created.");
    setOpen(false);
    setName("");
  }

  return (
    <div className="space-y-6 fade-up max-w-2xl">
      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Habit stacking
        </div>
        <h1 className="font-display font-black text-3xl tracking-tight mt-1">
          Tiny stacks, big momentum
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          Bolt a new habit onto an anchor you already do. Tap to check off — every stack adds +5 XP.
        </p>
      </div>

      <div className="rounded-2xl border border-border/50 bg-card p-4 flex items-center justify-between">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Today</div>
          <div className="font-display font-black text-2xl mt-0.5">
            {totalToday} / {habitStacks.length || 0}
          </div>
          <div className="text-[11px] text-muted-foreground">stacks completed</div>
        </div>
        <button
          onClick={() => {
            haptic("tap");
            setOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground active:scale-95 transition"
        >
          <Plus className="h-4 w-4" /> New stack
        </button>
      </div>

      {habitStacks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface-2/40 p-8 text-center">
          <div className="text-3xl mb-2">🔗</div>
          <div className="font-semibold">No stacks yet</div>
          <div className="text-sm text-muted-foreground mt-1">
            Try: <em>"After morning coffee → 5 min stretch + 1 glass water"</em>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {habitStacks.map((h) => {
            const done = h.completions.includes(today);
            return (
              <div
                key={h.id}
                className={`rounded-2xl border bg-card p-4 transition ${
                  done ? "border-primary/60 bg-primary/5" : "border-border/50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl">{h.emoji}</div>
                  <div className="min-w-0 flex-1">
                    <div className="font-display font-bold text-lg leading-tight">{h.name}</div>
                    <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Link2 className="h-3 w-3" /> {h.anchor}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      haptic(done ? "tap" : "success");
                      toggleHabitToday(h.id);
                    }}
                    className={`h-10 w-10 rounded-full grid place-items-center transition active:scale-90 ${
                      done
                        ? "bg-primary text-primary-foreground"
                        : "bg-surface-2 text-muted-foreground"
                    }`}
                    aria-label="Toggle done"
                  >
                    <Check className="h-5 w-5" />
                  </button>
                </div>
                {h.steps.length > 0 && (
                  <ul className="mt-3 space-y-1 pl-1">
                    {h.steps.map((s, i) => (
                      <li
                        key={i}
                        className="text-sm text-foreground/85 flex items-center gap-2"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-primary/60" /> {s}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-3 flex items-center justify-between text-[11px]">
                  <span className="font-mono text-muted-foreground">
                    {h.completions.length} day{h.completions.length === 1 ? "" : "s"} logged
                  </span>
                  <button
                    onClick={() => {
                      deleteHabitStack(h.id);
                      haptic("warn");
                    }}
                    className="text-muted-foreground hover:text-ember inline-flex items-center gap-1"
                  >
                    <Trash2 className="h-3 w-3" /> Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-background/70 backdrop-blur-sm p-4"
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-border bg-background p-5 space-y-4 soft-rise"
          >
            <div className="font-display font-black text-xl">New habit stack</div>
            <div className="space-y-3">
              <Field label="Name">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Morning reset"
                  className="w-full rounded-lg bg-surface-2 border border-border px-3 py-2 text-sm"
                />
              </Field>
              <Field label="Anchor (after I…)">
                <input
                  value={anchor}
                  onChange={(e) => setAnchor(e.target.value)}
                  className="w-full rounded-lg bg-surface-2 border border-border px-3 py-2 text-sm"
                />
              </Field>
              <Field label="Steps (one per line)">
                <textarea
                  value={steps}
                  onChange={(e) => setSteps(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg bg-surface-2 border border-border px-3 py-2 text-sm"
                />
              </Field>
              <Field label="Emoji">
                <div className="flex flex-wrap gap-1.5">
                  {EMOJIS.map((e) => (
                    <button
                      key={e}
                      onClick={() => setEmoji(e)}
                      className={`h-9 w-9 rounded-lg text-lg ${
                        emoji === e ? "bg-primary text-primary-foreground" : "bg-surface-2"
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </Field>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg px-4 py-2 text-sm text-muted-foreground"
              >
                Cancel
              </button>
              <button
                onClick={save}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
              >
                Create stack
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}