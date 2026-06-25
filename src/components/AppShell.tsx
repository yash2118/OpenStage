import { Link, Outlet, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  Home,
  CheckCircle2,
  Users,
  Trophy,
  IdCard,
  Sparkles,
  Settings,
  LogOut,
  Activity,
  HeartPulse,
  BarChart3,
  Droplet,
  CalendarDays,
  Target,
  Flag,
  Timer as TimerIcon,
  Camera,
  Ruler,
  Link2,
  CalendarRange,
  Gift,
  User as UserIcon,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { ThemeToggle } from "@/components/ThemeToggle";
import { haptic } from "@/lib/haptics";
import { CommandPalette, CommandPaletteTrigger } from "@/components/CommandPalette";
import { NotificationsBell } from "@/components/Notifications";
import { WelcomeTour } from "@/components/WelcomeTour";

const NAV = [
  { to: "/today", label: "Today", icon: Home },
  { to: "/check-in", label: "Check in", icon: CheckCircle2, primary: true },
  { to: "/activities", label: "Activities", icon: Activity },
  { to: "/community", label: "Community", icon: Users },
  { to: "/events", label: "Events", icon: Trophy },
  { to: "/leaderboard", label: "Rankings", icon: Trophy },
  { to: "/insights", label: "Insights", icon: BarChart3 },
  { to: "/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/goals", label: "Goals", icon: Target },
  { to: "/challenges", label: "Challenges", icon: Flag },
  { to: "/timer", label: "Timer", icon: TimerIcon },
  { to: "/progress", label: "Photos", icon: Camera },
  { to: "/body", label: "Body", icon: Ruler },
  { to: "/habits", label: "Habit stacks", icon: Link2 },
  { to: "/plan", label: "Weekly plan", icon: CalendarRange },
  { to: "/referral", label: "Invite", icon: Gift },
  { to: "/recovery", label: "Recovery", icon: HeartPulse },
  { to: "/health", label: "Health", icon: Droplet },
  { to: "/rewards", label: "Rewards", icon: Trophy },
  { to: "/passport", label: "Passport", icon: IdCard },
  { to: "/assistant", label: "Assistant", icon: Sparkles },
] as const;

// iPhone-style 5-tab nav: Home · Stats · Log (FAB) · Crew · Me
const MOBILE_NAV = [
  { to: "/today", label: "Home", icon: Home },
  { to: "/stats", label: "Stats", icon: BarChart3 },
  { to: "/check-in", label: "Log", icon: CheckCircle2, primary: true },
  { to: "/crew", label: "Crew", icon: Users },
  { to: "/me", label: "Me", icon: UserIcon },
] as const;

export function AppShell() {
  const { user, signOut } = useApp();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const handleSignOut = () => {
    signOut();
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-border bg-sidebar/60 backdrop-blur sticky top-0 h-screen z-50">
        <div className="px-5 pt-5 pb-3 shrink-0">
          <Link to="/today" className="flex items-center gap-2 mb-5">
            <Logo />
            <div className="font-display font-bold tracking-tight text-lg">OpenStage</div>
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <CommandPaletteTrigger />
            </div>
            <NotificationsBell />
          </div>
        </div>
        <nav className="flex-1 min-h-0 overflow-y-auto px-5 pb-3 flex flex-col gap-1">
          {NAV.map((n) => {
            const active = pathname === n.to || (n.to !== "/today" && pathname.startsWith(n.to));
            const Icon = n.icon;
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                <Icon className="h-4 w-4" />
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="shrink-0 px-5 pt-4 pb-5 border-t border-border space-y-1 bg-sidebar/60">
          <div className="flex items-center justify-between px-1 pb-2">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Theme
            </span>
            <ThemeToggle size="sm" />
          </div>
          <Link
            to="/settings"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent"
          >
            <Settings className="h-4 w-4" /> Settings
          </Link>
          {user && (
            <div className="flex items-center gap-3 px-3 py-3 rounded-lg bg-surface-2/40">
              <Avatar name={user.name} color={user.avatarColor} />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold truncate">{user.name}</div>
                <div className="text-xs text-muted-foreground truncate">@{user.handle}</div>
              </div>
              <button
                onClick={handleSignOut}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      <header className="md:hidden sticky top-0 z-50 flex items-center justify-between border-b border-border bg-background/80 backdrop-blur px-4 h-14">
        <Link to="/today" className="flex items-center gap-2">
          <Logo />
          <span className="font-display font-bold">OpenStage</span>
        </Link>
        <div className="flex items-center gap-2">
          <NotificationsBell />
          <ThemeToggle size="sm" variant="cycle" />
          {user && (
            <Link to="/settings" className="flex items-center gap-2">
              <Avatar name={user.name} color={user.avatarColor} size="sm" />
            </Link>
          )}
        </div>
      </header>

      <main className="relative z-0 flex-1 min-w-0 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-8">
        <div key={pathname} className="mx-auto w-full max-w-5xl px-4 md:px-8 py-5 md:py-10 page-enter">
          <Outlet />
        </div>
      </main>

      <CommandPalette />
      <WelcomeTour />

      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/90 backdrop-blur-xl pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_-12px_rgba(0,0,0,0.45)]"
        aria-label="Primary"
      >
        <div className="grid grid-cols-5 px-1 pt-1.5">
          {MOBILE_NAV.map((n) => {
            const active = pathname === n.to || (n.to !== "/today" && pathname.startsWith(n.to));
            const Icon = n.icon;
            const isPrimary = "primary" in n && n.primary;
            if (isPrimary) {
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  aria-label={n.label}
                  className="relative flex flex-col items-center justify-end pb-1.5"
                  onClick={() => haptic("success")}
                >
                  <span
                    className={`-mt-7 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground ring-4 ring-background transition-transform ${
                      active ? "scale-105 shadow-[0_10px_30px_-6px_var(--color-primary)]" : "shadow-[0_8px_22px_-8px_var(--color-primary)]"
                    }`}
                  >
                    <Icon className="h-6 w-6" strokeWidth={2.5} />
                  </span>
                  <span className="mt-1 text-[10px] font-display font-bold uppercase tracking-wider text-foreground">
                    {n.label}
                  </span>
                </Link>
              );
            }
            return (
              <Link
                key={n.to}
                to={n.to}
                className="relative flex flex-col items-center justify-center gap-0.5 py-2 min-h-[56px]"
                aria-current={active ? "page" : undefined}
                onClick={() => haptic("select")}
              >
                <span
                  className={`absolute top-0 h-0.5 w-8 rounded-full transition-all ${
                    active ? "bg-primary opacity-100" : "opacity-0"
                  }`}
                />
                <Icon
                  className={`h-[22px] w-[22px] transition-colors ${active ? "tab-pop" : ""} ${
                    active ? "text-primary" : "text-muted-foreground"
                  }`}
                  strokeWidth={active ? 2.5 : 2}
                />
                <span
                  className={`text-[10px] font-semibold tracking-wide ${
                    active ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {n.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export function Logo() {
  return (
    <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground font-display font-bold text-sm shadow-[0_0_24px_-4px_var(--color-primary)]">
      OS
    </span>
  );
}

export function Avatar({
  name,
  color,
  size = "md",
}: {
  name: string;
  color: string;
  size?: "sm" | "md" | "lg";
}) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const sz =
    size === "sm" ? "h-8 w-8 text-xs" : size === "lg" ? "h-14 w-14 text-lg" : "h-10 w-10 text-sm";
  return (
    <span
      className={`grid place-items-center rounded-full font-display font-bold text-background shrink-0 ${sz}`}
      style={{ backgroundColor: color }}
    >
      {initials}
    </span>
  );
}