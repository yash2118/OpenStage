import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Sparkles,
  IdCard,
  Trophy,
  Settings as SettingsIcon,
  HelpCircle,
  LogOut,
  ChevronRight,
  CalendarRange,
  Flame,
  Zap,
  Link2,
  Gift,
} from "lucide-react";
import { useApp, useStreak } from "@/lib/store";
import { Avatar } from "@/components/AppShell";
import { ThemeToggle } from "@/components/ThemeToggle";
import { haptic } from "@/lib/haptics";

export const Route = createFileRoute("/_authed/me")({
  component: MeHub,
});

function MeHub() {
  const { user, signOut, xp, checkIns } = useApp();
  const streak = useStreak();
  const navigate = useNavigate();
  if (!user) return null;
  const verified = checkIns.filter((c) => c.verified).length;
  const verifiedRate = checkIns.length ? Math.round((verified / checkIns.length) * 100) : 0;
  const handleSignOut = () => {
    haptic("warn");
    signOut();
    navigate({ to: "/" });
  };
  const level = Math.min(6, Math.floor(xp / 500) + 1);
  const nextLvlXp = level * 500;
  const pct = Math.min(100, Math.round((xp / nextLvlXp) * 100));

  const sections: { title: string; items: { to?: string; onClick?: () => void; icon: typeof Trophy; label: string; hint?: string; danger?: boolean }[] }[] = [
    {
      title: "Coaching",
      items: [
        { to: "/assistant", icon: Sparkles, label: "AI Coach", hint: "Ask, plan, analyze" },
        { to: "/weekly-review", icon: CalendarRange, label: "Weekly review", hint: "Your Sunday recap" },
        { to: "/plan", icon: CalendarRange, label: "Weekly plan", hint: "Build your training week" },
        { to: "/habits", icon: Link2, label: "Habit stacks", hint: "Anchor tiny habits" },
      ],
    },
    {
      title: "Achievements",
      items: [
        { to: "/rewards", icon: Trophy, label: "Rewards", hint: "Badges, XP, themes" },
        { to: "/passport", icon: IdCard, label: "Passport", hint: "Shareable proof card" },
        { to: "/referral", icon: Gift, label: "Invite crew", hint: "Share your code · +10 XP each" },
      ],
    },
    {
      title: "Account",
      items: [
        { to: "/settings", icon: SettingsIcon, label: "Settings", hint: "Profile · notifications · data" },
        { to: "/settings", icon: HelpCircle, label: "Help & tour", hint: "Replay onboarding" },
        { onClick: handleSignOut, icon: LogOut, label: "Sign out", danger: true },
      ],
    },
  ];

  return (
    <div className="space-y-6 fade-up">
      <Link
        to="/settings"
        onClick={() => haptic("select")}
        className="block rounded-3xl border border-border/50 bg-card p-5 active:scale-[0.99] transition"
      >
        <div className="flex items-center gap-4">
          <Avatar name={user.name} color={user.avatarColor} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="font-display font-black text-xl truncate">{user.name}</div>
            <div className="text-[12px] text-muted-foreground truncate">@{user.handle}</div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </div>

        <div className="mt-5">
          <div className="flex items-center justify-between text-[11px] mb-1.5">
            <span className="font-mono uppercase tracking-wider text-muted-foreground">
              Level {level}
            </span>
            <span className="font-mono text-muted-foreground">
              {xp} / {nextLvlXp} XP
            </span>
          </div>
          <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
            <div className="h-full progress-live" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </Link>

      <div className="grid grid-cols-3 gap-3">
        <MiniStat icon={Flame} label="Streak" value={`${streak}`} />
        <MiniStat icon={Zap} label="XP" value={`${xp}`} />
        <MiniStat icon={Trophy} label="Verified" value={`${verifiedRate}%`} />
      </div>

      <div className="flex items-center justify-between rounded-2xl bg-surface-2/40 px-4 py-3 border border-border/50">
        <div>
          <div className="text-sm font-semibold">Appearance</div>
          <div className="text-[11px] text-muted-foreground">Tap to cycle theme</div>
        </div>
        <ThemeToggle size="sm" variant="cycle" />
      </div>

      {sections.map((s) => (
        <section key={s.title}>
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground px-1 pb-2">
            {s.title}
          </div>
          <div className="overflow-hidden rounded-2xl bg-card border border-border/50 divide-y divide-border">
            {s.items.map((it, idx) => {
              const Icon = it.icon;
              const inner = (
                <>
                  <span
                    className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
                      it.danger ? "bg-ember/10 text-ember" : "bg-primary/10 text-primary"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div
                      className={`text-sm font-semibold truncate ${it.danger ? "text-ember" : ""}`}
                    >
                      {it.label}
                    </div>
                    {it.hint && (
                      <div className="text-[11px] text-muted-foreground truncate">{it.hint}</div>
                    )}
                  </div>
                  {!it.danger && <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
                </>
              );
              if (it.to) {
                return (
                  <Link
                    key={idx}
                    to={it.to}
                    onClick={() => haptic("select")}
                    className="flex items-center gap-3 px-4 py-3.5 active:bg-accent transition-colors"
                  >
                    {inner}
                  </Link>
                );
              }
              return (
                <button
                  key={idx}
                  onClick={it.onClick}
                  className="flex w-full items-center gap-3 px-4 py-3.5 text-left active:bg-accent transition-colors"
                >
                  {inner}
                </button>
              );
            })}
          </div>
        </section>
      ))}

      <div className="text-center text-[10px] font-mono uppercase tracking-wider text-muted-foreground pt-2">
        OpenStage · v0.9 · Built for accountability
      </div>
    </div>
  );
}

function MiniStat({ icon: Icon, label, value }: { icon: typeof Flame; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/50 bg-card p-3 text-center">
      <Icon className="h-4 w-4 text-primary mx-auto" />
      <div className="font-display font-black text-lg tracking-tight mt-1">{value}</div>
      <div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}
