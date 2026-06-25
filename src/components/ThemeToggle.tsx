import { Sun, Moon, Zap } from "lucide-react";
import { useTheme, type Theme } from "@/lib/theme";

const OPTIONS: { id: Theme; icon: React.ComponentType<{ className?: string }>; label: string }[] = [
  { id: "dark", icon: Moon, label: "Dark" },
  { id: "light", icon: Sun, label: "Light" },
  { id: "neon", icon: Zap, label: "Neon" },
];

export function ThemeToggle({
  size = "md",
  variant = "group",
}: {
  size?: "sm" | "md";
  variant?: "group" | "cycle";
}) {
  const { theme, setTheme } = useTheme();
  const cell = size === "sm" ? "h-7 w-7" : "h-8 w-8";

  if (variant === "cycle") {
    const idx = OPTIONS.findIndex((o) => o.id === theme);
    const current = OPTIONS[idx === -1 ? 0 : idx];
    const next = OPTIONS[(idx + 1) % OPTIONS.length];
    const Icon = current.icon;
    return (
      <button
        type="button"
        aria-label={`Theme: ${current.label}. Switch to ${next.label}`}
        title={`Theme: ${current.label}`}
        onClick={() => setTheme(next.id)}
        className={`grid place-items-center ${cell} rounded-full border border-border bg-surface-2/70 text-foreground backdrop-blur transition-colors hover:bg-surface-2`}
      >
        <Icon className="h-3.5 w-3.5" />
      </button>
    );
  }

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className="inline-flex items-center gap-0.5 p-1 rounded-full bg-surface-2/70 border border-border backdrop-blur"
    >
      {OPTIONS.map((o) => {
        const Icon = o.icon;
        const active = theme === o.id;
        return (
          <button
            key={o.id}
            role="radio"
            aria-checked={active}
            aria-label={o.label}
            title={o.label}
            onClick={() => setTheme(o.id)}
            className={`grid place-items-center ${cell} rounded-full transition-all ${
              active
                ? "bg-primary text-primary-foreground shadow-[0_0_18px_-4px_var(--color-primary)] scale-105"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        );
      })}
    </div>
  );
}
