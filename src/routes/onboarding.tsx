import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useApp, type Goal, type Onboarding } from "@/lib/store";
import { Logo } from "@/components/AppShell";
import { ArrowRight, ArrowLeft, Check, ShieldCheck, Globe, Users, Lock, Camera } from "lucide-react";
import { GOAL_LABELS } from "@/lib/seed";
import { toast } from "sonner";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: "Set up your account — OpenStage" }] }),
  component: OnboardingPage,
});

const STEPS = [
  "Goal",
  "About You",
  "Commitment",
  "Body",
  "Daily Habits",
  "Style",
  "Future Self",
  "Privacy",
] as const;

function OnboardingPage() {
  const { user, completeOnboarding, setFutureSelf } = useApp();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [futureMessage, setFutureMessage] = useState(
    "I'm here because I want to feel strong, sleep well, and prove to myself I can show up — even on the days I don't feel like it."
  );

  useEffect(() => {
    if (!user) navigate({ to: "/auth" });
  }, [user, navigate]);

  const [data, setData] = useState<Onboarding>({
    goals: [],
    weeklyCommitment: 4,
    experience: "returning",
    eatingStyle: "Balanced",
    trainingDays: ["Mon", "Wed", "Fri"],
    trainingLocation: "gym",
    heightCm: 175,
    weightKg: 78,
    goalWeightKg: 73,
    privacyDefault: "crew",
    accountabilityMode: "crew",
    age: 28,
    gender: "prefer_not",
    preferredTime: "morning",
    sleepGoalHrs: 8,
    waterGoalL: 2.5,
  });

  function next() {
    if (step === 0 && data.goals.length === 0) {
      toast.error("Pick at least one goal.");
      return;
    }
    if (step === STEPS.length - 1) {
      completeOnboarding(data);
      setFutureSelf({ text: futureMessage.trim() || "Show up — even on the hard days.", mediaType: "text", updatedAt: new Date().toISOString() });
      toast.success("You're set. Let's check in.");
      navigate({ to: "/today" });
      return;
    }
    setStep(step + 1);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border">
        <div className="mx-auto max-w-3xl px-4 md:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Logo />
            <span className="font-display font-bold">OpenStage</span>
          </Link>
          <div className="font-mono text-xs text-muted-foreground">
            Step {step + 1} of {STEPS.length}
          </div>
        </div>
        <div className="h-1 bg-surface-2">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-3xl px-4 md:px-8 py-10">
        <div className="font-mono text-xs uppercase tracking-[0.2em] text-primary">
          {STEPS[step]}
        </div>

        {step === 0 && (
          <Step
            title="What are you here for?"
            subtitle="Pick one or more. We use this to personalize check-ins and keep rankings fair."
          >
            <div className="grid sm:grid-cols-2 gap-3">
              {(Object.keys(GOAL_LABELS) as Goal[]).map((g) => {
                const active = data.goals.includes(g);
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() =>
                      setData({
                        ...data,
                        goals: active ? data.goals.filter((x) => x !== g) : [...data.goals, g],
                      })
                    }
                    className={`text-left card-elevated p-4 transition ${
                      active ? "ring-2 ring-primary border-primary" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-display font-bold text-lg">{GOAL_LABELS[g]}</div>
                      {active && <Check className="h-4 w-4 text-primary" />}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {GOAL_HINTS[g]}
                    </div>
                  </button>
                );
              })}
            </div>
          </Step>
        )}

        {step === 1 && (
          <Step title="A little about you" subtitle="Helps the assistant set realistic targets. Skip anything you'd rather not share.">
            <div className="grid sm:grid-cols-2 gap-4">
              <NumberField label="Age" value={data.age ?? 28} onChange={(v) => setData({ ...data, age: v })} min={13} max={99} />
              <div>
                <Label>Gender</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {(["female", "male", "nonbinary", "prefer_not"] as const).map((g) => (
                    <Chip
                      key={g}
                      active={data.gender === g}
                      onClick={() => setData({ ...data, gender: g })}
                      label={g === "prefer_not" ? "Prefer not" : g[0].toUpperCase() + g.slice(1)}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-8">
              <Label>Profile photo (optional)</Label>
              <div className="mt-2 flex items-center gap-4">
                <div className="h-20 w-20 rounded-full border border-border bg-surface overflow-hidden grid place-items-center">
                  {data.photoDataUrl ? (
                    <img src={data.photoDataUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <Camera className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <label className="rounded-lg border border-border bg-surface px-3 py-2 text-sm cursor-pointer hover:border-primary/60">
                  Upload
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      const r = new FileReader();
                      r.onload = () => setData({ ...data, photoDataUrl: String(r.result) });
                      r.readAsDataURL(f);
                    }}
                  />
                </label>
                {data.photoDataUrl && (
                  <button
                    type="button"
                    onClick={() => setData({ ...data, photoDataUrl: undefined })}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </Step>
        )}

        {step === 2 && (
          <Step
            title="How many sessions per week?"
            subtitle="This sets your weekly target and the cohort you'll be ranked against."
          >
            <div className="grid grid-cols-7 gap-2">
              {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setData({ ...data, weeklyCommitment: n })}
                  className={`aspect-square rounded-xl border font-display font-bold text-2xl ${
                    data.weeklyCommitment === n
                      ? "bg-primary text-primary-foreground border-transparent"
                      : "border-border bg-surface hover:border-primary/60"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            <div className="mt-8">
              <Label>Experience</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                {(["new", "returning", "regular", "advanced"] as const).map((x) => (
                  <Chip
                    key={x}
                    active={data.experience === x}
                    onClick={() => setData({ ...data, experience: x })}
                    label={x[0].toUpperCase() + x.slice(1)}
                  />
                ))}
              </div>
            </div>
            <div className="mt-8">
              <Label>Training days (we'll nudge on these)</Label>
              <div className="grid grid-cols-7 gap-2 mt-2">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                  <Chip
                    key={d}
                    active={data.trainingDays.includes(d)}
                    onClick={() =>
                      setData({
                        ...data,
                        trainingDays: data.trainingDays.includes(d)
                          ? data.trainingDays.filter((x) => x !== d)
                          : [...data.trainingDays, d],
                      })
                    }
                    label={d}
                  />
                ))}
              </div>
            </div>
            <div className="mt-8">
              <Label>Preferred time of day</Label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mt-2">
                {(
                  [
                    ["early", "Early (5–7am)"],
                    ["morning", "Morning"],
                    ["midday", "Midday"],
                    ["evening", "Evening"],
                    ["night", "Night"],
                  ] as const
                ).map(([v, l]) => (
                  <Chip
                    key={v}
                    active={data.preferredTime === v}
                    onClick={() => setData({ ...data, preferredTime: v })}
                    label={l}
                  />
                ))}
              </div>
            </div>
          </Step>
        )}

        {step === 3 && (
          <Step
            title="Baseline body context"
            subtitle="Optional but recommended — the assistant uses this to keep advice realistic. Never medical."
          >
            <div className="grid sm:grid-cols-3 gap-4">
              <NumberField
                label="Height (cm)"
                value={data.heightCm}
                onChange={(v) => setData({ ...data, heightCm: v })}
                min={120}
                max={230}
              />
              <NumberField
                label="Current weight (kg)"
                value={data.weightKg}
                onChange={(v) => setData({ ...data, weightKg: v })}
                min={35}
                max={250}
              />
              <NumberField
                label="Goal weight (kg)"
                value={data.goalWeightKg}
                onChange={(v) => setData({ ...data, goalWeightKg: v })}
                min={35}
                max={250}
              />
            </div>
            <div className="mt-6 rounded-xl border border-border bg-surface p-4 text-sm text-muted-foreground">
              We don&apos;t share these numbers. They&apos;re used to set realistic weekly check-in targets and to flag when you should slow down.
            </div>
          </Step>
        )}

        {step === 4 && (
          <Step
            title="Daily habits"
            subtitle="Light defaults you can change anytime. The Health tracker uses these."
          >
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Sleep target (hours)</Label>
                <div className="grid grid-cols-5 gap-2 mt-2">
                  {[6, 7, 8, 9, 10].map((h) => (
                    <Chip
                      key={h}
                      active={data.sleepGoalHrs === h}
                      onClick={() => setData({ ...data, sleepGoalHrs: h })}
                      label={`${h}h`}
                    />
                  ))}
                </div>
              </div>
              <div>
                <Label>Water target (litres)</Label>
                <div className="grid grid-cols-5 gap-2 mt-2">
                  {[1.5, 2, 2.5, 3, 3.5].map((w) => (
                    <Chip
                      key={w}
                      active={data.waterGoalL === w}
                      onClick={() => setData({ ...data, waterGoalL: w })}
                      label={`${w}L`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </Step>
        )}

        {step === 5 && (
          <Step
            title="Where and how you train"
            subtitle="Sets your activity presets and saved templates."
          >
            <Label>Training location</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
              {(["home", "gym", "outdoor", "mixed"] as const).map((x) => (
                <Chip
                  key={x}
                  active={data.trainingLocation === x}
                  onClick={() => setData({ ...data, trainingLocation: x })}
                  label={x[0].toUpperCase() + x.slice(1)}
                />
              ))}
            </div>
            <div className="mt-8">
              <Label>Eating style</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                {["Balanced", "High-protein", "Lower-carb", "Plant-forward", "Whatever works", "Tracked"].map((x) => (
                  <Chip
                    key={x}
                    active={data.eatingStyle === x}
                    onClick={() => setData({ ...data, eatingStyle: x })}
                    label={x}
                  />
                ))}
              </div>
            </div>
          </Step>
        )}

        {step === 6 && (
          <Step
            title="Write a note to your future self"
            subtitle="On the days you don't feel like it, we'll show this. Be honest — not heroic."
          >
            <textarea
              value={futureMessage}
              onChange={(e) => setFutureMessage(e.target.value)}
              rows={6}
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-base outline-none focus:border-primary/60 leading-relaxed"
              placeholder="Why am I doing this?"
            />
            <div className="mt-3 text-xs text-muted-foreground">
              You can update this monthly in your Passport. Voice and video options unlock there.
            </div>
          </Step>
        )}

        {step === 7 && (
          <Step
            title="Privacy and accountability"
            subtitle="You can change this per check-in. We default visible to Crew only."
          >
            <Label>Default check-in visibility</Label>
            <div className="grid sm:grid-cols-3 gap-3 mt-2">
              <PrivacyCard
                active={data.privacyDefault === "private"}
                onClick={() => setData({ ...data, privacyDefault: "private" })}
                icon={Lock}
                label="Private"
                body="Only you can see. Still counts for streak and rank."
              />
              <PrivacyCard
                active={data.privacyDefault === "crew"}
                onClick={() => setData({ ...data, privacyDefault: "crew" })}
                icon={Users}
                label="Crew only"
                body="Your Check-In Crew sees and verifies. Default."
              />
              <PrivacyCard
                active={data.privacyDefault === "public"}
                onClick={() => setData({ ...data, privacyDefault: "public" })}
                icon={Globe}
                label="Public"
                body="Anyone can see on your Passport and leaderboard."
              />
            </div>
            <div className="mt-8">
              <Label>Accountability mode</Label>
              <div className="grid sm:grid-cols-3 gap-2 mt-2">
                {(
                  [
                    ["solo", "Solo — just track me"],
                    ["crew", "Crew — verify together"],
                    ["public", "Public — open Passport"],
                  ] as const
                ).map(([v, l]) => (
                  <Chip
                    key={v}
                    active={data.accountabilityMode === v}
                    onClick={() => setData({ ...data, accountabilityMode: v })}
                    label={l}
                  />
                ))}
              </div>
            </div>
            <div className="mt-6 flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm">
              <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
              <div>
                Every check-in screen shows a visibility chip before you post. No surprises.
              </div>
            </div>
          </Step>
        )}

        <div className="mt-10 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-30"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <button
            type="button"
            onClick={next}
            className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-6 py-3 font-semibold hover:opacity-90"
          >
            {step === STEPS.length - 1 ? "Enter the gym" : "Continue"} <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </main>
    </div>
  );
}

function Step({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-3">
      <h1 className="font-display font-bold text-3xl md:text-4xl tracking-tight">{title}</h1>
      <p className="text-muted-foreground mt-2 max-w-xl">{subtitle}</p>
      <div className="mt-8">{children}</div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">{children}</div>;
}

function Chip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition ${
        active
          ? "bg-primary text-primary-foreground border-transparent"
          : "border-border bg-surface hover:border-primary/60"
      }`}
    >
      {label}
    </button>
  );
}

function NumberField({
  label,
  value,
  onChange,
  min,
  max,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
}) {
  return (
    <label className="block">
      <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-lg font-display font-semibold outline-none focus:border-primary/60"
      />
    </label>
  );
}

function PrivacyCard({
  active,
  onClick,
  icon: Icon,
  label,
  body,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  body: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left card-elevated p-4 transition ${
        active ? "ring-2 ring-primary border-primary" : ""
      }`}
    >
      <Icon className="h-5 w-5 text-primary" />
      <div className="mt-3 font-display font-bold">{label}</div>
      <p className="text-xs text-muted-foreground mt-1">{body}</p>
    </button>
  );
}

const GOAL_HINTS: Record<Goal, string> = {
  lose_weight: "Sustainable fat loss, no crash diets.",
  build_muscle: "Hypertrophy and consistent volume.",
  improve_strength: "Push the big lifts forward.",
  build_consistency: "Show up. Every week. That's the win.",
  general_reset: "Restart movement and habits gently.",
};
