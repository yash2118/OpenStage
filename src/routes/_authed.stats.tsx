import { createFileRoute, Link } from "@tanstack/react-router";
import { BarChart3, Target, CalendarDays, Droplet, HeartPulse, Camera, Activity, TrendingUp, ChevronRight, Sparkles, Ruler } from "lucide-react";
import { useApp, useStreak } from "@/lib/store";
import { haptic } from "@/lib/haptics";

export const Route = createFileRoute("/_authed/stats")({
  component: StatsHub,
});

function StatsHub() {
  const { checkIns, recoveryLogs, healthLogs, bodyMetrics } = useApp();
  const streak = useStreak();
  const week = checkIns.filter((c) => {
    const d = new Date(c.date).getTime();
    return Date.now() - d < 7 * 24 * 60 * 60 * 1000;
  }).length;
  const totalMin = checkIns.reduce((s, c) => s + (c.duration || 0), 0);
  const verifiedRate = checkIns.length
    ? Math.round((checkIns.filter((c) => c.verified).length / checkIns.length) * 100)
    : 0;
  const latestRec = recoveryLogs[0];
  const recScore = latestRec
    ? Math.round(((latestRec.sleep + latestRec.energy + latestRec.mood + (6 - latestRec.stress)) / 20) * 100)
    : null;
  const latestHealth = healthLogs[0];
  const latestBody = bodyMetrics[0];

  const sections: { title: string; items: { to: string; icon: typeof BarChart3; label: string; hint: string; chip?: string }[] }[] = [
    {
      title: "Performance",
      items: [
        { to: "/goals", icon: Target, label: "Goals & PRs", hint: "Track personal records", chip: "View" },
        { to: "/activities", icon: Activity, label: "Activity log", hint: `${checkIns.length} sessions`, chip: `${totalMin}m` },
        { to: "/calendar", icon: CalendarDays, label: "Calendar heatmap", hint: "6-month consistency view" },
      ],
    },
    {
      title: "Body",
      items: [
        { to: "/body", icon: Ruler, label: "Body metrics", hint: "Weight · waist · chest · arm · hip · BF%", chip: latestBody?.weightKg ? `${latestBody.weightKg}kg` : "Log" },
        { to: "/health", icon: Droplet, label: "Health rings", hint: "Water · steps · sleep · protein", chip: latestHealth?.steps ? `${latestHealth.steps} steps` : "Log" },
        { to: "/recovery", icon: HeartPulse, label: "Recovery", hint: "Sleep · energy · mood · stress", chip: recScore != null ? `${recScore}` : "Log" },
        { to: "/progress", icon: Camera, label: "Progress photos", hint: "Before / after timeline" },
      ],
    },
    {
      title: "Insight",
      items: [
        { to: "/insights", icon: BarChart3, label: "Patterns & cohorts", hint: "Day-of-week heatmap, benchmarks" },
        { to: "/weekly-review", icon: Sparkles, label: "Weekly review", hint: "Sunday recap report card" },
      ],
    },
  ];

  return (
    <div className="space-y-6 fade-up">
      <header>
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Stats hub
        </div>
        <h1 className="text-3xl font-display font-black tracking-tight mt-1">Your data, one place.</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Everything you've tracked — body, performance, momentum.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <Stat label="Streak" value={`${streak} d`} accent />
        <Stat label="This week" value={`${week}`} />
        <Stat label="Verified" value={`${verifiedRate}%`} />
        <Stat label="Total min" value={`${totalMin}`} />
      </div>

      {sections.map((s) => (
        <section key={s.title}>
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground px-1 pb-2">
            {s.title}
          </div>
          <div className="overflow-hidden rounded-2xl bg-card border border-border/50 divide-y divide-border">
            {s.items.map((it) => {
              const Icon = it.icon;
              return (
                <Link
                  key={it.to}
                  to={it.to}
                  onClick={() => haptic("select")}
                  className="flex items-center gap-3 px-4 py-3.5 active:bg-accent transition-colors"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold truncate">{it.label}</div>
                    <div className="text-[11px] text-muted-foreground truncate">{it.hint}</div>
                  </div>
                  {it.chip && (
                    <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground bg-surface-2/60 px-2 py-1 rounded-full">
                      {it.chip}
                    </span>
                  )}
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </Link>
              );
            })}
          </div>
        </section>
      ))}

      <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 flex items-start gap-3">
        <TrendingUp className="h-5 w-5 text-primary mt-0.5 shrink-0" />
        <div className="text-sm">
          <div className="font-semibold">You're trending up.</div>
          <div className="text-muted-foreground text-[12px] mt-0.5">
            Keep the streak alive — log today's check-in to extend it.
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div
      className={`rounded-2xl p-4 border ${
        accent ? "border-primary/40 bg-primary/10" : "border-border/50 bg-card"
      }`}
    >
      <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="font-display font-black text-2xl tracking-tight mt-1">{value}</div>
    </div>
  );
}
