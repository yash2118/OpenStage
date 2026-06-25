import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useApp, useStreak, weeklyProgress, seedStrategies, computeMomentum, trustTier } from "@/lib/store";
import { GOAL_LABELS } from "@/lib/seed";
import { Sparkles, Send, ArrowRight, Flame, ShieldCheck, Clock, Lightbulb, Target, TrendingUp, Activity } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { haptic } from "@/lib/haptics";

export const Route = createFileRoute("/_authed/assistant")({
  head: () => ({ meta: [{ title: "Assistant — OpenStage" }] }),
  component: Assistant,
});

interface Msg {
  from: "assistant" | "you";
  text: string;
}

const SUGGESTED = [
  "Plan my next session",
  "Explain my rank change",
  "What's working for similar users?",
  "I missed two days — how do I recover?",
];

function generateReply(q: string, weekly: { done: number; target: number; pct: number }, streak: number) {
  const lower = q.toLowerCase();
  if (lower.includes("plan") || lower.includes("next")) {
    return `Given your ${streak}-day streak and ${weekly.pct}% weekly target, your next session should be a 40-min push or steady cardio. Keep RPE 6–7. Send to Crew within 30 min of finishing.`;
  }
  if (lower.includes("rank")) {
    return `You moved from #6 → #4 in your cohort. Driver: 2 Crew-Verified check-ins above the cohort median for effort. Hold ${weekly.target}× this week to lock in top 25%.`;
  }
  if (lower.includes("similar") || lower.includes("working")) {
    return `Top 20% of your cohort runs two anchor lifts first, then accessories — and submits to Crew within 30 min. That last bit is the trust multiplier.`;
  }
  if (lower.includes("miss") || lower.includes("recover")) {
    return `Don't double up. Resume at 70% of your usual load and post the check-in with a quick note. Streaks rebuild faster than confidence — get one easy win on the board today.`;
  }
  return `Here's a read: you're at ${weekly.done}/${weekly.target} with a ${streak}-day streak. Want a session plan or a recovery suggestion?`;
}

function Assistant() {
  const { user, onboarding, checkIns, pending, trustScore, verificationsGiven, momentumHistory } = useApp();
  const streak = useStreak();
  const weekly = weeklyProgress(checkIns, onboarding?.weeklyCommitment ?? 4);
  const momentum = onboarding
    ? computeMomentum({ checkIns, weeklyTarget: onboarding.weeklyCommitment, verificationsGiven, prevHistory: momentumHistory })
    : null;
  const tier = trustTier(trustScore);
  const highestImpact = momentum?.improvements[0];
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [msgs, setMsgs] = useState<Msg[]>(() => [
    {
      from: "assistant",
      text:
        user && onboarding
          ? `Hi ${user.name.split(" ")[0]}. You're at ${weekly.done}/${weekly.target} this week with a ${streak}-day streak. Focused on ${onboarding.goals.map((g) => GOAL_LABELS[g]).join(" + ")}. What do you want to tackle?`
          : "Hi. Set up onboarding to get personalized guidance.",
    },
  ]);

  function send(text: string) {
    haptic("tap");
    const reply = generateReply(text, weekly, streak);
    setMsgs((m) => [...m, { from: "you", text }]);
    setInput("");
    setTyping(true);
    const delay = 450 + Math.min(1100, reply.length * 12);
    window.setTimeout(() => {
      setTyping(false);
      setMsgs((m) => [...m, { from: "assistant", text: reply }]);
      haptic("soft");
    }, delay);
  }

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, typing]);

  const insights = useMemo(() => {
    const out: { icon: React.ComponentType<{ className?: string }>; tone: "primary" | "ember"; label: string; body: string; q?: string }[] = [];
    if (streak >= 3)
      out.push({
        icon: Flame,
        tone: "ember",
        label: `Streak · ${streak}d`,
        body: `Your ${streak}-day streak puts you ahead of 72% of similar users. One easy check-in today protects the chain.`,
        q: "How do I protect my streak today?",
      });
    if (weekly.done < weekly.target)
      out.push({
        icon: Clock,
        tone: "primary",
        label: "Weekly gap",
        body: `${weekly.target - weekly.done} away from target. A 25-min session is enough to count and keep momentum.`,
        q: "Plan my next session",
      });
    if (pending.length > 0)
      out.push({
        icon: ShieldCheck,
        tone: "primary",
        label: `Trust · ${trustScore}`,
        body: `${pending.length} Crew verification${pending.length === 1 ? "" : "s"} pending. Each one is +2 trust and a faster verify on your next post.`,
        q: "Why does trust matter?",
      });
    if (out.length === 0)
      out.push({
        icon: Lightbulb,
        tone: "primary",
        label: "Tip",
        body: "Send check-ins to Crew within 30 min of finishing — verified 3× more often.",
        q: "What's working for similar users?",
      });
    return out;
  }, [streak, weekly.done, weekly.target, pending.length, trustScore]);

  return (
    <div className="space-y-8">
      <header>
        <div className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Assistant</div>
        <h1 className="font-display font-bold text-3xl md:text-4xl mt-2">Your accountability coach.</h1>
        <p className="text-muted-foreground mt-2 max-w-xl">
          Reads your momentum, ranking, Crew, and recovery. Tells you the one thing to do next.
        </p>
      </header>

      {momentum && (
        <section className="card-elevated p-6 relative overflow-hidden border-primary/40">
          <div className="absolute inset-0 grid-dot-bg opacity-30 pointer-events-none" />
          <div className="relative grid md:grid-cols-[1fr_auto] gap-4 items-center">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">Highest impact right now</div>
              <h2 className="font-display font-bold text-2xl md:text-3xl mt-2 leading-tight">
                {highestImpact ? highestImpact.label : "Hold your line — you're on track."}
              </h2>
              <p className="text-sm text-muted-foreground mt-2 max-w-lg">
                Momentum {momentum.score} · Level {momentum.level.num} {momentum.level.name} · Trust tier {tier.name}.
                {highestImpact ? ` Expected lift: +${highestImpact.impact} momentum.` : " Bonus check-in compounds without burn."}
              </p>
            </div>
            {highestImpact && (
              <Link
                to={highestImpact.to}
                className="shrink-0 inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-semibold hover:opacity-90 glow-primary"
              >
                Do it now <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
          <div className="relative mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
            <Mini label="Momentum" value={momentum.score} sub={`${momentum.delta >= 0 ? "+" : ""}${momentum.delta}`} icon={TrendingUp} />
            <Mini label="Streak" value={streak} sub="days" icon={Flame} />
            <Mini label="Crew given" value={verificationsGiven} sub="verified" icon={ShieldCheck} />
            <Mini label="Weekly" value={`${weekly.done}/${weekly.target}`} sub="target" icon={Target} />
          </div>
        </section>
      )}

      <section className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-3 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {insights.map((ins, i) => {
            const Icon = ins.icon;
            return (
              <button
                key={i}
                onClick={() => ins.q && send(ins.q)}
                className="card-elevated card-elevated-hover p-4 text-left fade-up"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${ins.tone === "ember" ? "text-ember" : "text-primary"}`} />
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {ins.label}
                  </span>
                </div>
                <p className="mt-2 text-sm">{ins.body}</p>
                {ins.q && (
                  <div className="mt-2 text-[11px] font-mono uppercase tracking-wider text-primary inline-flex items-center gap-1">
                    Ask coach <ArrowRight className="h-3 w-3" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="lg:col-span-2 card-elevated p-5 flex flex-col h-[28rem]">
          <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 pr-2 momentum-scroll">
            {msgs.map((m, i) => (
              <div key={i} className={`flex soft-rise ${m.from === "you" ? "justify-end" : ""}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                    m.from === "you"
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-surface-2 text-foreground rounded-bl-sm"
                  }`}
                >
                  {m.from === "assistant" && <Sparkles className="h-3.5 w-3.5 text-primary inline mr-1" />}
                  {m.text}
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex soft-rise">
                <div className="bg-surface-2 text-foreground rounded-2xl rounded-bl-sm px-4 py-2.5 inline-flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  <span className="typing-dot" />
                  <span className="typing-dot" style={{ animationDelay: "120ms" }} />
                  <span className="typing-dot" style={{ animationDelay: "240ms" }} />
                </div>
              </div>
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {SUGGESTED.map((q) => (
              <button
                key={q}
                onClick={() => send(q)}
                className="text-xs rounded-full border border-border bg-surface px-3 py-1.5 hover:border-primary/60 hover:text-foreground text-muted-foreground"
              >
                {q}
              </button>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (input.trim()) send(input.trim());
            }}
            className="mt-3 flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about your training week..."
              className="bg-transparent flex-1 outline-none text-sm"
            />
            <button
              type="submit"
              className="rounded-full bg-primary text-primary-foreground h-8 w-8 grid place-items-center hover:opacity-90"
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>

        <div className="space-y-3">
          <div className="font-mono text-xs uppercase tracking-wider text-primary">Strategies from people like you</div>
          {seedStrategies.map((s) => (
            <div key={s.id} className="card-elevated p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="tag bg-primary/10 text-primary">{s.tag}</span>
                <span>{s.cohortPct}%</span>
              </div>
              <div className="mt-2 font-display font-bold">{s.title}</div>
              <p className="text-xs text-muted-foreground mt-1">{s.body}</p>
              <button className="mt-3 text-xs text-primary inline-flex items-center gap-1">
                Apply to my week <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Mini({
  label,
  value,
  sub,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  sub: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-xl bg-surface-2/50 p-3">
      <div className="flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 text-primary" />
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
      <div className="mt-1 font-display font-bold text-xl">{value}</div>
      <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{sub}</div>
    </div>
  );
}