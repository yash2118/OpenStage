import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  X,
  ArrowRight,
  CheckCircle2,
  Users,
  Trophy,
  Sparkles,
  Command as CommandIcon,
  Bell,
  Share2,
} from "lucide-react";
import { haptic } from "@/lib/haptics";
import { useApp } from "@/lib/store";

const KEY = "openstage.tour.completed.v1";

type Step = {
  tag: string;
  title: string;
  body: string;
  icon: React.ComponentType<{ className?: string }>;
  cta?: { label: string; to: string };
};

const STEPS: Step[] = [
  {
    tag: "01 · WELCOME",
    title: "This is your stage.",
    body: "OpenStage isn't a workout feed — it's a verified accountability arena. Show up, get seen, earn trust.",
    icon: Sparkles,
  },
  {
    tag: "02 · CHECK IN",
    title: "Post sessions in 10 seconds.",
    body: "Tap the lime button anywhere on mobile, or hit ⌘K → New check-in. Optional crew verification turns it into trust.",
    icon: CheckCircle2,
    cta: { label: "Try a check-in", to: "/check-in" },
  },
  {
    tag: "03 · CREW",
    title: "Your Crew is your jury.",
    body: "Verify their sessions, they verify yours. Trust score compounds — the higher it goes, the more your rank counts.",
    icon: Users,
    cta: { label: "See your Crew", to: "/community" },
  },
  {
    tag: "04 · MOMENTUM",
    title: "Rank against people like you.",
    body: "Cohort leaderboards, season-style events, and a momentum score that tracks how alive your training is.",
    icon: Trophy,
    cta: { label: "Open Rankings", to: "/leaderboard" },
  },
  {
    tag: "05 · PRO TIPS",
    title: "A few shortcuts.",
    body: "⌘K opens the command palette · Bell shows pending verifications · Passport generates a shareable card · Settings has data export.",
    icon: CommandIcon,
  },
];

export function WelcomeTour() {
  const { user, onboarding } = useApp();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [i, setI] = useState(0);

  useEffect(() => {
    if (!user || !onboarding) return;
    try {
      if (localStorage.getItem(KEY)) return;
    } catch {
      return;
    }
    const t = setTimeout(() => setOpen(true), 800);
    return () => clearTimeout(t);
  }, [user, onboarding]);

  if (!open) return null;

  const step = STEPS[i];
  const StepIcon = step.icon;
  const last = i === STEPS.length - 1;

  const close = () => {
    setOpen(false);
    try {
      localStorage.setItem(KEY, String(Date.now()));
    } catch {
      // ignore
    }
  };

  const next = () => {
    haptic("select");
    if (last) {
      close();
    } else {
      setI((v) => Math.min(v + 1, STEPS.length - 1));
    }
  };

  const jump = (to: string) => {
    haptic("tap");
    close();
    navigate({ to });
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-4 bg-background/80 backdrop-blur-md"
      role="dialog"
      aria-label="Welcome tour"
    >
      <div className="relative w-full max-w-md rounded-3xl border border-border bg-background shadow-2xl overflow-hidden soft-rise">
        <button
          onClick={close}
          aria-label="Skip tour"
          className="absolute top-3 right-3 rounded-full p-1.5 text-muted-foreground hover:bg-accent z-10"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative p-6 pb-4 bg-gradient-to-br from-primary/12 via-transparent to-transparent">
          <div className="absolute inset-0 grid-dot-bg opacity-40 pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-2">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground shadow-[0_0_24px_-4px_var(--color-primary)]">
                <StepIcon className="h-5 w-5" />
              </span>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
                {step.tag}
              </div>
            </div>
            <h2 className="mt-4 font-display font-bold text-2xl leading-tight">
              {step.title}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">{step.body}</p>
          </div>
        </div>

        <div className="px-6 pb-5 pt-2">
          <div className="flex items-center gap-1.5">
            {STEPS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setI(idx)}
                aria-label={`Step ${idx + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  idx === i
                    ? "w-7 bg-primary"
                    : idx < i
                      ? "w-3 bg-primary/40"
                      : "w-3 bg-surface-2"
                }`}
              />
            ))}
            <span className="ml-auto text-[10px] font-mono text-muted-foreground">
              {i + 1} / {STEPS.length}
            </span>
          </div>

          <div className="mt-4 flex flex-col gap-2">
            {step.cta && (
              <button
                onClick={() => jump(step.cta!.to)}
                className="w-full inline-flex items-center justify-center gap-2 rounded-full border border-primary/40 bg-primary/5 text-primary py-2.5 text-sm font-semibold hover:bg-primary/10"
              >
                {step.cta.label} <ArrowRight className="h-4 w-4" />
              </button>
            )}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={close}
                className="rounded-full border border-border py-2.5 text-sm font-semibold text-muted-foreground hover:bg-accent"
              >
                Skip tour
              </button>
              <button
                onClick={next}
                className="rounded-full bg-primary text-primary-foreground py-2.5 text-sm font-semibold hover:opacity-90 inline-flex items-center justify-center gap-2"
              >
                {last ? "Get to work" : "Next"}{" "}
                {last ? (
                  <Share2 className="h-3.5 w-3.5" />
                ) : (
                  <ArrowRight className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-center gap-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            <Bell className="h-3 w-3" /> Re-run anytime from Settings
          </div>
        </div>
      </div>
    </div>
  );
}

/** Reset so the tour shows again on next mount. */
export function resetWelcomeTour() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}