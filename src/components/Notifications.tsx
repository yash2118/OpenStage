import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "@tanstack/react-router";
import { Bell, ShieldCheck, Flame, Trophy, Sparkles, Users, HeartPulse, Check } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useApp, useStreak } from "@/lib/store";
import { haptic } from "@/lib/haptics";

const READ_KEY = "openstage.notifs.readAt.v1";

type Notif = {
  id: string;
  ts: number;
  icon: React.ComponentType<{ className?: string }>;
  tint: string;
  title: string;
  body: string;
  to: string;
};

function loadReadAt(): number {
  try {
    const raw = localStorage.getItem(READ_KEY);
    return raw ? Number(raw) : 0;
  } catch {
    return 0;
  }
}

export function NotificationsBell({ className = "" }: { className?: string }) {
  const { pending, crew, milestones, recoveryLogs, checkIns } = useApp();
  const streak = useStreak();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [readAt, setReadAt] = useState<number>(() => loadReadAt());
  const triggerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({});

  const items = useMemo<Notif[]>(() => {
    const list: Notif[] = [];

    pending.forEach((p) => {
      const m = crew.find((c) => c.id === p.fromMemberId);
      list.push({
        id: `p_${p.id}`,
        ts: new Date(p.requestedAt).getTime(),
        icon: ShieldCheck,
        tint: "text-primary bg-primary/10",
        title: `${m?.name.split(" ")[0] ?? "A crew member"} needs verification`,
        body: `${p.activityTitle} · ${p.proofLabel}`,
        to: "/community",
      });
    });

    milestones.slice(0, 8).forEach((m) => {
      list.push({
        id: `m_${m.id}`,
        ts: new Date(m.date).getTime(),
        icon: Trophy,
        tint: "text-ember bg-ember/10",
        title: m.title,
        body: m.detail ?? `${m.emoji} milestone unlocked`,
        to: "/passport",
      });
    });

    if (streak > 0 && (streak === 3 || streak === 7 || streak % 14 === 0)) {
      list.push({
        id: `streak_${streak}`,
        ts: Date.now() - 1000 * 60 * 60,
        icon: Flame,
        tint: "text-ember bg-ember/10",
        title: `${streak}-day streak`,
        body: "Keep the pattern alive — log today.",
        to: "/today",
      });
    }

    const today = new Date().toISOString().slice(0, 10);
    if (!recoveryLogs.some((r) => r.date === today)) {
      list.push({
        id: `rec_${today}`,
        ts: Date.now() - 1000 * 60 * 60 * 2,
        icon: HeartPulse,
        tint: "text-primary bg-primary/10",
        title: "Log recovery for today",
        body: "Four taps powers the assistant's call.",
        to: "/recovery",
      });
    }

    const recentCrew = checkIns.slice(0, 3);
    if (recentCrew.length > 0 && crew[0]) {
      list.push({
        id: `crew_active`,
        ts: Date.now() - 1000 * 60 * 30,
        icon: Users,
        tint: "text-accent bg-accent/10",
        title: `${crew[0].name.split(" ")[0]} just checked in`,
        body: "Send a verify nudge or react.",
        to: "/community",
      });
    }

    if (new Date().getDay() === 0) {
      list.push({
        id: `weekly_${today}`,
        ts: Date.now() - 1000 * 60 * 10,
        icon: Sparkles,
        tint: "text-primary bg-primary/10",
        title: "Your weekly review is ready",
        body: "See how the past 7 days stacked up.",
        to: "/weekly-review",
      });
    }

    return list.sort((a, b) => b.ts - a.ts).slice(0, 20);
  }, [pending, crew, milestones, recoveryLogs, checkIns, streak]);

  const unread = items.filter((i) => i.ts > readAt).length;

  useEffect(() => {
    if (!open) return;
    const placePanel = () => {
      const trigger = triggerRef.current;
      if (!trigger || typeof window === "undefined") return;
      const rect = trigger.getBoundingClientRect();
      const margin = 12;
      const desktopWidth = 352;
      const isDesktop = window.matchMedia("(min-width: 768px)").matches;

      if (!isDesktop) {
        setPanelStyle({
          top: `calc(${Math.max(rect.bottom + 8, 58)}px + env(safe-area-inset-top))`,
          left: margin,
          right: margin,
          width: "auto",
          maxWidth: "none",
        });
        return;
      }

      const preferredLeft = rect.right + margin;
      const left = Math.max(margin, Math.min(preferredLeft, window.innerWidth - desktopWidth - margin));
      const top = margin;

      setPanelStyle({
        top,
        left,
        width: desktopWidth,
        maxWidth: `calc(100vw - ${margin * 2}px)`,
      });
    };

    placePanel();
    const onDoc = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        panelRef.current &&
        !panelRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("resize", placePanel);
    window.addEventListener("scroll", placePanel, true);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("resize", placePanel);
      window.removeEventListener("scroll", placePanel, true);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const toggle = () => {
    setOpen((o) => !o);
    haptic("tap");
  };

  const markRead = () => {
    const now = Date.now();
    setReadAt(now);
    try {
      localStorage.setItem(READ_KEY, String(now));
    } catch {
      // ignore
    }
  };

  return (
    <div className={`relative ${className}`} ref={triggerRef}>
      <button
        type="button"
        onClick={toggle}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface hover:bg-accent transition"
        aria-label="Notifications"
        aria-expanded={open}
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-ember text-background text-[10px] font-bold font-mono flex items-center justify-center ring-2 ring-background">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && typeof document !== "undefined" &&
        createPortal(
        <div
          ref={panelRef}
          style={panelStyle}
          className="fixed rounded-2xl border border-border bg-background shadow-2xl overflow-hidden z-[9999] soft-rise"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-wider text-primary">Inbox</div>
              <div className="font-display font-bold">Notifications</div>
            </div>
            {unread > 0 && (
              <button
                onClick={markRead}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
              >
                <Check className="h-3 w-3" /> Mark read
              </button>
            )}
          </div>

          <div className="max-h-[60vh] overflow-y-auto momentum-scroll divide-y divide-border">
            {items.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-muted-foreground">
                You're all clear.
              </div>
            ) : (
              items.map((n) => {
                const Icon = n.icon;
                const isNew = n.ts > readAt;
                return (
                  <button
                    key={n.id}
                    onClick={() => {
                      navigate({ to: n.to });
                      haptic("select");
                      markRead();
                      setOpen(false);
                    }}
                    className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-accent/40 transition ${
                      isNew ? "bg-primary/[0.04]" : ""
                    }`}
                  >
                    <span className={`grid h-9 w-9 place-items-center rounded-xl shrink-0 ${n.tint}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-semibold truncate">{n.title}</div>
                        {isNew && <span className="h-1.5 w-1.5 rounded-full bg-ember shrink-0" />}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">{n.body}</div>
                      <div className="text-[10px] font-mono text-muted-foreground/70 mt-0.5">
                        {formatDistanceToNow(new Date(n.ts))} ago
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}