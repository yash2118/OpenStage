import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useApp, type RecoveryLog } from "@/lib/store";
import { toast } from "sonner";
import { Moon, Battery, Smile, Activity } from "lucide-react";

export const Route = createFileRoute("/_authed/recovery")({
  head: () => ({ meta: [{ title: "Recovery — OpenStage" }] }),
  component: RecoveryPage,
});

const SCALES = [
  { key: "sleep" as const, label: "Sleep", icon: Moon, emojis: ["😵", "😪", "😐", "🙂", "😴"] },
  { key: "energy" as const, label: "Energy", icon: Battery, emojis: ["🪫", "🔋", "⚡", "🔥", "🚀"] },
  { key: "mood" as const, label: "Mood", icon: Smile, emojis: ["😞", "😕", "😐", "🙂", "😄"] },
  { key: "stress" as const, label: "Stress", icon: Activity, emojis: ["😌", "🙂", "😐", "😬", "🤯"] },
];

function RecoveryPage() {
  const { recoveryLogs, logRecovery } = useApp();
  const today = new Date().toISOString().slice(0, 10);
  const existing = recoveryLogs.find((r) => r.date === today);
  const [draft, setDraft] = useState<Omit<RecoveryLog, "date">>(
    existing ?? { sleep: 3, energy: 3, mood: 3, stress: 3 }
  );

  const avg = (k: keyof Omit<RecoveryLog, "date">) => {
    const last = recoveryLogs.slice(0, 7);
    if (last.length === 0) return 0;
    return Math.round((last.reduce((a, b) => a + b[k], 0) / last.length) * 10) / 10;
  };

  const recoveryScore = Math.round(((draft.sleep + draft.energy + draft.mood + (6 - draft.stress)) / 20) * 100);
  const suggestion =
    recoveryScore >= 75
      ? { tone: "primary", title: "Push harder today.", body: "Energy is high, stress low. Add 10% load or volume to your next session." }
      : recoveryScore >= 55
      ? { tone: "primary", title: "Maintain pace.", body: "You're in the safe band. Stay with your normal session — don't redline." }
      : { tone: "ember", title: "Recovery day.", body: "Sleep or stress is off. Choose a 20-min walk or mobility — it still counts." };

  return (
    <div className="space-y-8">
      <header>
        <div className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Recovery</div>
        <h1 className="font-display font-bold text-3xl md:text-4xl mt-2 tracking-tight">How are you arriving today?</h1>
        <p className="text-muted-foreground mt-2">Four taps. Powers the assistant's session call.</p>
      </header>

      <div className="grid sm:grid-cols-2 gap-4">
        {SCALES.map(({ key, label, icon: Icon, emojis }) => (
          <div key={key} className="card-elevated p-5">
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-primary" />
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
              <span className="ml-auto text-xs text-muted-foreground">7d avg {avg(key) || "—"}</span>
            </div>
            <div className="mt-4 grid grid-cols-5 gap-2">
              {emojis.map((e, i) => {
                const val = i + 1;
                const active = draft[key] === val;
                return (
                  <button
                    key={i}
                    onClick={() => setDraft({ ...draft, [key]: val })}
                    className={`aspect-square rounded-xl border text-2xl transition ${
                      active ? "border-primary bg-primary/10 scale-110" : "border-border hover:border-primary/60"
                    }`}
                    aria-label={`${label} ${val}`}
                  >
                    {e}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="card-elevated p-6">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <div className="font-mono text-xs uppercase tracking-wider text-primary">Today's call</div>
            <h2 className="font-display font-bold text-2xl mt-1">{suggestion.title}</h2>
            <p className="text-muted-foreground mt-1 max-w-md">{suggestion.body}</p>
          </div>
          <div className="text-right">
            <div className="font-display font-bold text-5xl">{recoveryScore}</div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">recovery</div>
          </div>
        </div>
        <button
          onClick={() => {
            logRecovery(draft);
            toast.success("Recovery logged. Coach updated.");
          }}
          className="mt-5 rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-semibold hover:opacity-90"
        >
          Save today
        </button>
      </div>

      {recoveryLogs.length > 0 && (
        <div className="card-elevated p-6">
          <div className="font-mono text-xs uppercase tracking-wider text-primary">Last 7 days</div>
          <div className="mt-4 grid grid-cols-7 gap-2">
            {recoveryLogs.slice(0, 7).reverse().map((r) => {
              const sc = Math.round(((r.sleep + r.energy + r.mood + (6 - r.stress)) / 20) * 100);
              return (
                <div key={r.date} className="rounded-lg bg-surface-2/60 p-2 text-center">
                  <div className="text-[10px] font-mono text-muted-foreground">{r.date.slice(5)}</div>
                  <div className="font-display font-bold text-lg mt-1">{sc}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}