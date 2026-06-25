import { createFileRoute, Link } from "@tanstack/react-router";
import { Users, Trophy, Flag, Calendar, ChevronRight, ShieldCheck, Flame } from "lucide-react";
import { useApp } from "@/lib/store";
import { haptic } from "@/lib/haptics";

export const Route = createFileRoute("/_authed/crew")({
  component: CrewHub,
});

function CrewHub() {
  const { crew, checkIns } = useApp();
  const pending = checkIns.filter((c) => c.pendingVerifications.length > 0).length;

  return (
    <div className="space-y-6 fade-up">
      <header>
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Crew hub
        </div>
        <h1 className="text-3xl font-display font-black tracking-tight mt-1">Your accountability circle.</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {crew.length} members · {pending} waiting on you
        </p>
      </header>

      {pending > 0 && (
        <Link
          to="/community"
          onClick={() => haptic("warn")}
          className="block rounded-2xl border-2 border-primary/50 bg-primary/10 p-4 active:scale-[0.99] transition"
        >
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary text-primary-foreground glow-pulse">
              <ShieldCheck className="h-6 w-6" />
            </span>
            <div className="flex-1">
              <div className="font-display font-bold">Verify {pending} check-in{pending !== 1 ? "s" : ""}</div>
              <div className="text-[12px] text-muted-foreground">+10 XP each · keeps the crew honest</div>
            </div>
            <ChevronRight className="h-5 w-5 text-primary" />
          </div>
        </Link>
      )}

      <div className="grid grid-cols-2 gap-3">
        <HubCard to="/community" icon={Users} label="Crew feed" hint="See verifications" />
        <HubCard to="/leaderboard" icon={Trophy} label="Rankings" hint="Cohort standings" />
        <HubCard to="/challenges" icon={Flag} label="Challenges" hint="Active quests" />
        <HubCard to="/events" icon={Calendar} label="Events" hint="Seasons & arenas" />
      </div>

      <section>
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground px-1 pb-2">
          Your crew
        </div>
        <div className="rounded-2xl border border-border/50 bg-card divide-y divide-border overflow-hidden">
          {crew.slice(0, 6).map((m) => (
            <div key={m.id} className="flex items-center gap-3 px-4 py-3">
              <span
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full font-display font-bold text-background"
                style={{ backgroundColor: m.avatarColor }}
              >
                {m.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold truncate">{m.name}</div>
                <div className="text-[11px] text-muted-foreground truncate">
                  @{m.handle} · Trust {m.trustScore}
                </div>
              </div>
              {m.streak ? (
                <span className="flex items-center gap-1 text-[11px] font-mono uppercase tracking-wider text-primary">
                  <Flame className="h-3 w-3" /> {m.streak}
                </span>
              ) : null}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function HubCard({ to, icon: Icon, label, hint }: { to: string; icon: typeof Users; label: string; hint: string }) {
  return (
    <Link
      to={to}
      onClick={() => haptic("select")}
      className="rounded-2xl p-4 border border-border/50 bg-card active:scale-[0.98] transition"
    >
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary mb-3">
        <Icon className="h-5 w-5" />
      </span>
      <div className="font-display font-bold text-sm">{label}</div>
      <div className="text-[11px] text-muted-foreground mt-0.5">{hint}</div>
    </Link>
  );
}
