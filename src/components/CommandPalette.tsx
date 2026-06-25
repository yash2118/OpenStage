import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Home,
  CheckCircle2,
  Users,
  Trophy,
  IdCard,
  Sparkles,
  Settings,
  Activity,
  HeartPulse,
  BarChart3,
  Droplet,
  Calendar,
  Search,
  ArrowRight,
  Command as CommandIcon,
  LogOut,
  RotateCcw,
  Target,
  Flag,
  Timer as TimerIcon,
  Camera,
  Ruler,
  Link2,
  CalendarRange,
  Gift,
} from "lucide-react";
import { haptic } from "@/lib/haptics";
import { useApp } from "@/lib/store";
import { toast } from "sonner";

type Item = {
  id: string;
  label: string;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
  group: "Navigate" | "Actions";
  keywords?: string;
  run: () => void;
};

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { signOut, reset } = useApp();

  // global hotkey
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
        haptic("tap");
      } else if (e.key === "Escape" && open) {
        e.preventDefault();
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (open) {
      setQ("");
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("openstage:openCommand", handler as EventListener);
    return () => window.removeEventListener("openstage:openCommand", handler as EventListener);
  }, []);

  const items = useMemo<Item[]>(() => {
    const go = (to: string) => () => {
      navigate({ to });
      haptic("select");
      setOpen(false);
    };
    return [
      { id: "today", label: "Today", hint: "Mission control", icon: Home, group: "Navigate", run: go("/today") },
      { id: "checkin", label: "New check-in", hint: "Log a session", icon: CheckCircle2, group: "Actions", keywords: "log post session workout", run: go("/check-in") },
      { id: "recovery", label: "Log recovery", hint: "Sleep · mood · energy", icon: HeartPulse, group: "Actions", run: go("/recovery") },
      { id: "health", label: "Health tracker", hint: "Water · steps · weight", icon: Droplet, group: "Navigate", run: go("/health") },
      { id: "activities", label: "Activities", hint: "Training log", icon: Activity, group: "Navigate", run: go("/activities") },
      { id: "calendar", label: "Calendar heatmap", hint: "6-month consistency view", icon: Calendar, group: "Navigate", keywords: "heatmap year history", run: go("/calendar") },
      { id: "goals", label: "Goals & PRs", hint: "Track lifts, times, body comp", icon: Target, group: "Navigate", keywords: "personal records targets", run: go("/goals") },
      { id: "challenges", label: "Challenges", hint: "Time-boxed targets", icon: Flag, group: "Navigate", keywords: "streak event sprint", run: go("/challenges") },
      { id: "timer", label: "Session timer", hint: "Tabata · EMOM · AMRAP", icon: TimerIcon, group: "Actions", keywords: "interval stopwatch focus", run: go("/timer") },
      { id: "progress", label: "Progress photos", hint: "Snapshots & compare", icon: Camera, group: "Navigate", keywords: "body photos before after", run: go("/progress") },
      { id: "body", label: "Body metrics", hint: "Weight, waist, BF% trends", icon: Ruler, group: "Navigate", keywords: "weight waist chest measurements body fat", run: go("/body") },
      { id: "habits", label: "Habit stacks", hint: "Anchor tiny habits", icon: Link2, group: "Navigate", keywords: "routine stack atomic habit", run: go("/habits") },
      { id: "plan", label: "Weekly plan", hint: "Build Mon → Sun", icon: CalendarRange, group: "Navigate", keywords: "schedule week training plan", run: go("/plan") },
      { id: "referral", label: "Invite crew", hint: "Share your code", icon: Gift, group: "Actions", keywords: "referral invite friend share", run: go("/referral") },
      { id: "community", label: "Community / Crew", hint: "Verify & rankings", icon: Users, group: "Navigate", run: go("/community") },
      { id: "events", label: "Events", hint: "Join an arena", icon: Trophy, group: "Navigate", run: go("/events") },
      { id: "leaderboard", label: "Rankings", hint: "Cohort leaderboard", icon: Trophy, group: "Navigate", run: go("/leaderboard") },
      { id: "insights", label: "Insights", hint: "Patterns & cohort", icon: BarChart3, group: "Navigate", run: go("/insights") },
      { id: "rewards", label: "Rewards", hint: "XP · badges · shields", icon: Sparkles, group: "Navigate", run: go("/rewards") },
      { id: "passport", label: "Passport", hint: "Your timeline", icon: IdCard, group: "Navigate", run: go("/passport") },
      { id: "weekly", label: "Weekly review", hint: "Sunday report", icon: Calendar, group: "Navigate", run: go("/weekly-review") },
      { id: "assistant", label: "Assistant", hint: "Ask the coach", icon: Sparkles, group: "Navigate", run: go("/assistant") },
      { id: "settings", label: "Settings", hint: "Profile · prefs · data", icon: Settings, group: "Navigate", run: go("/settings") },
      {
        id: "reset",
        label: "Reset demo data",
        hint: "Wipe and reseed",
        icon: RotateCcw,
        group: "Actions",
        run: () => {
          reset();
          toast.success("Demo data reset.");
          navigate({ to: "/auth" });
          setOpen(false);
        },
      },
      {
        id: "signout",
        label: "Sign out",
        icon: LogOut,
        group: "Actions",
        run: () => {
          signOut();
          toast("Signed out.");
          navigate({ to: "/" });
          setOpen(false);
        },
      },
    ];
  }, [navigate, reset, signOut]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return items;
    return items.filter((i) =>
      `${i.label} ${i.hint ?? ""} ${i.keywords ?? ""}`.toLowerCase().includes(term),
    );
  }, [items, q]);

  const groups = useMemo(() => {
    const map = new Map<Item["group"], Item[]>();
    filtered.forEach((i) => {
      if (!map.has(i.group)) map.set(i.group, []);
      map.get(i.group)!.push(i);
    });
    return Array.from(map.entries());
  }, [filtered]);

  useEffect(() => {
    setActive(0);
  }, [q]);

  if (!open) return null;

  const flat = filtered;
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, flat.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      flat[active]?.run();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[12vh] bg-background/60 backdrop-blur-sm"
      onClick={() => setOpen(false)}
      role="dialog"
      aria-label="Command palette"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl rounded-2xl border border-border bg-background shadow-2xl overflow-hidden soft-rise"
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search routes & actions…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 rounded-md border border-border bg-surface-2/60 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
            esc
          </kbd>
        </div>

        <div className="max-h-[55vh] overflow-y-auto momentum-scroll">
          {flat.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-muted-foreground">
              No matches for "{q}".
            </div>
          ) : (
            groups.map(([group, list]) => (
              <div key={group} className="py-2">
                <div className="px-4 py-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  {group}
                </div>
                {list.map((item) => {
                  const idx = flat.indexOf(item);
                  const isActive = idx === active;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onMouseEnter={() => setActive(idx)}
                      onClick={item.run}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition ${
                        isActive ? "bg-primary/10 text-foreground" : "text-foreground/85 hover:bg-accent/50"
                      }`}
                    >
                      <Icon
                        className={`h-4 w-4 shrink-0 ${
                          isActive ? "text-primary" : "text-muted-foreground"
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold truncate">{item.label}</div>
                        {item.hint && (
                          <div className="text-xs text-muted-foreground truncate">{item.hint}</div>
                        )}
                      </div>
                      {isActive && <ArrowRight className="h-3.5 w-3.5 text-primary" />}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div className="flex items-center justify-between gap-3 px-4 py-2 border-t border-border bg-surface-2/40 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <CommandIcon className="h-3 w-3" /> OpenStage palette
          </div>
          <div className="flex items-center gap-2">
            <span>↑↓ navigate</span>
            <span>↵ open</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CommandPaletteTrigger() {
  return (
    <button
      type="button"
      onClick={() => {
        window.dispatchEvent(new Event("openstage:openCommand"));
        haptic("tap");
      }}
      className="w-full flex items-center gap-2 rounded-lg border border-border bg-surface-2/50 px-3 py-2 text-xs text-muted-foreground hover:bg-accent transition"
      aria-label="Open command palette"
    >
      <Search className="h-3.5 w-3.5" />
      <span className="flex-1 text-left">Search & jump…</span>
      <kbd className="font-mono text-[10px] rounded border border-border bg-background px-1.5 py-0.5">
        ⌘K
      </kbd>
    </button>
  );
}