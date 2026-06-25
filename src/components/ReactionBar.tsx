import { useApp } from "@/lib/store";
import { haptic } from "@/lib/haptics";

const EMOJIS = ["🔥", "💪", "👏", "🙌", "🫡"];

export function ReactionBar({ itemId, compact = false }: { itemId: string; compact?: boolean }) {
  const { reactions, myReactions, toggleReaction } = useApp();
  const counts = reactions[itemId] ?? {};
  const mine = myReactions[itemId] ?? [];
  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${compact ? "" : "mt-3"}`}>
      {EMOJIS.map((e) => {
        const active = mine.includes(e);
        const n = counts[e] ?? 0;
        return (
          <button
            key={e}
            type="button"
            onClick={() => {
              haptic("tap");
              toggleReaction(itemId, e);
            }}
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold transition active:scale-95 ${
              active
                ? "border-primary/60 bg-primary/15 text-primary"
                : "border-border bg-surface-2/60 text-muted-foreground hover:text-foreground"
            }`}
            aria-pressed={active}
            aria-label={`React ${e}`}
          >
            <span className="text-sm leading-none">{e}</span>
            {n > 0 && <span className="font-mono tabular-nums">{n}</span>}
          </button>
        );
      })}
    </div>
  );
}