import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useApp, useStreak, weeklyProgress } from "@/lib/store";
import { Avatar } from "@/components/AppShell";
import { Flame, ShieldCheck, Trophy, ArrowRight, Sparkles, Home, Share2 } from "lucide-react";
import { ShareCardDialog } from "@/components/ShareCardDialog";
import { haptic } from "@/lib/haptics";

export const Route = createFileRoute("/_authed/check-in/done")({
  head: () => ({ meta: [{ title: "Check-in posted — OpenStage" }] }),
  component: Done,
});

function Done() {
  const { checkIns, crew, onboarding, user, trustScore } = useApp();
  const last = checkIns[0];
  const streak = useStreak();
  const weekly = weeklyProgress(checkIns, onboarding?.weeklyCommitment ?? 4);
  const [shareOpen, setShareOpen] = useState(false);
  const milestone =
    streak > 0 && (streak % 7 === 0 || streak === 3 || streak === 1)
      ? streak === 1
        ? "Day one. Welcome to the streak."
        : streak === 3
          ? "Three in a row. Pattern starting."
          : `${streak} days locked in.`
      : null;

  useEffect(() => {
    const c = document.getElementById("celebrate");
    if (!c) return;
    c.animate(
      [
        { transform: "scale(0.6)", opacity: 0 },
        { transform: "scale(1.05)", opacity: 1 },
        { transform: "scale(1)", opacity: 1 },
      ],
      { duration: 600, easing: "cubic-bezier(.2,.9,.3,1.2)" },
    );
  }, []);

  const confetti = useMemo(() => Array.from({ length: 36 }).map((_, i) => i), []);

  if (!last) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">No check-in found.</p>
        <Link to="/check-in" className="mt-4 inline-block text-primary underline">
          Post one now
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 relative">
      {/* Confetti burst */}
      <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden" aria-hidden>
        {confetti.map((i) => {
          const colors = ["var(--color-primary)", "var(--color-accent)", "var(--color-ember)", "oklch(0.9 0.18 100)"];
          const cx = (Math.sin(i * 7.7) * 280).toFixed(0) + "px";
          const left = (5 + ((i * 13) % 90)).toFixed(0) + "%";
          const delay = ((i % 12) * 35).toFixed(0) + "ms";
          return (
            <span
              key={i}
              className="confetti-piece"
              style={{
                left,
                background: colors[i % colors.length],
                ["--cx" as never]: cx,
                animationDelay: delay,
              }}
            />
          );
        })}
      </div>

      <div id="celebrate" className="text-center space-y-3">
        <div className="text-6xl">{last.proofEmoji}</div>
        <div className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Check-in posted</div>
        <h1 className="font-display font-bold text-4xl md:text-5xl">
          That&apos;s a <span className="text-primary">rep</span> in the bank.
        </h1>
        <p className="text-muted-foreground">
          {last.title} · {last.duration} min · RPE {last.effort}
        </p>
        {milestone && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-ember/15 border border-ember/30 px-4 py-2 pop-in">
            <Flame className="h-4 w-4 text-ember" />
            <span className="font-display font-bold text-ember">{milestone}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat icon={Flame} value={streak} label="day streak" tone="ember" pulse />
        <Stat icon={Trophy} value={`${weekly.done}/${weekly.target}`} label="weekly target" />
        <Stat icon={ShieldCheck} value="+2" label="trust pending" />
      </div>

      {last.visibility !== "private" && (
        <div className="card-elevated p-6">
          <div className="font-mono text-xs uppercase tracking-wider text-primary">Sent to Crew</div>
          <h2 className="font-display font-bold text-xl mt-1">Waiting on verification</h2>
          <div className="mt-4 flex items-center gap-4 flex-wrap">
            {crew.slice(0, 3).map((c) => (
              <div key={c.id} className="flex items-center gap-2">
                <Avatar name={c.name} color={c.avatarColor} size="sm" />
                <div className="text-xs">
                  <div className="font-semibold">{c.name.split(" ")[0]}</div>
                  <div className="text-muted-foreground">pending</div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-xs text-muted-foreground">
            Tip: check-ins sent within 30 min of finishing are verified 3x more often.
          </div>
        </div>
      )}

      <div className="card-elevated p-6">
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div>
            <div className="font-display font-bold">Assistant read</div>
            <p className="text-sm text-muted-foreground mt-1">
              You&apos;re trending {weekly.pct}% of weekly target with {streak} consecutive day{streak === 1 ? "" : "s"}.{" "}
              {weekly.done >= weekly.target
                ? "Consider a mobility or walk session tomorrow."
                : "One more this week and you unlock the cohort top 25%."}
            </p>
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <Link
          to="/today"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground py-3 font-semibold hover:opacity-90"
        >
          <Home className="h-4 w-4" /> Back to Today
        </Link>
        <Link
          to="/community"
          className="inline-flex items-center justify-center gap-2 rounded-full border border-border py-3 font-semibold hover:bg-accent"
        >
          Verify Crew check-ins <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <button
        onClick={() => {
          haptic("tap");
          setShareOpen(true);
        }}
        className="w-full inline-flex items-center justify-center gap-2 rounded-full border border-primary/40 bg-primary/5 text-primary py-3 font-semibold hover:bg-primary/10"
      >
        <Share2 className="h-4 w-4" /> Generate share card
      </button>

      {user && (
        <ShareCardDialog
          open={shareOpen}
          onClose={() => setShareOpen(false)}
          input={{
            user,
            checkIn: last,
            streak,
            trustScore,
            weeklyDone: weekly.done,
            weeklyTarget: weekly.target,
            variant: "checkin",
          }}
        />
      )}
    </div>
  );
}

function Stat({
  icon: Icon,
  value,
  label,
  tone,
  pulse,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: string | number;
  label: string;
  tone?: "ember";
  pulse?: boolean;
}) {
  return (
    <div className={`card-elevated p-4 text-center ${pulse ? "glow-pulse" : ""}`}>
      <Icon className={`h-5 w-5 mx-auto ${tone === "ember" ? "text-ember" : "text-primary"}`} />
      <div className="font-display font-bold text-2xl mt-2 count-up">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}