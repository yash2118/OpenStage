import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useApp, type Visibility, type CheckIn } from "@/lib/store";
import {
  Activity,
  Dumbbell,
  Apple,
  Trophy,
  Camera,
  Lock,
  Users,
  Globe,
  ArrowRight,
  ArrowLeft,
  Check,
  HeartPulse,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { haptic } from "@/lib/haptics";

export const Route = createFileRoute("/_authed/check-in")({
  head: () => ({ meta: [{ title: "Check in — OpenStage" }] }),
  component: CheckInPage,
});

const TYPES: {
  id: CheckIn["activityType"];
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  emoji: string;
  defaults: string[];
}[] = [
  { id: "cardio", label: "Cardio", icon: Activity, emoji: "🏃", defaults: ["Morning run", "Bike ride", "HIIT", "Walk"] },
  { id: "weights", label: "Weight training", icon: Dumbbell, emoji: "🏋️", defaults: ["Push day", "Pull day", "Leg day", "Full body"] },
  { id: "lifestyle", label: "Habit & lifestyle", icon: Apple, emoji: "🥗", defaults: ["Water + veg + walk", "Sleep + stretch", "Mindful eating"] },
  { id: "sport", label: "Sport", icon: Trophy, emoji: "⚽", defaults: ["Pickup game", "Practice", "Match"] },
];

const PROOFS = [
  { emoji: "🤳", label: "Selfie at end of session" },
  { emoji: "📸", label: "Workout environment photo" },
  { emoji: "🪞", label: "Mirror check at the rack" },
  { emoji: "🥗", label: "Plate / nutrition photo" },
  { emoji: "👟", label: "Shoes / route screenshot" },
];

const RPE = ["easy", "easy", "moderate", "moderate", "steady", "steady", "hard", "hard", "very hard", "all-out"];

function CheckInPage() {
  const navigate = useNavigate();
  const { addCheckIn, onboarding } = useApp();

  // step -1 = "Did you train today?" gate, 0..3 = original flow
  const [step, setStep] = useState(-1);
  const [type, setType] = useState<CheckIn["activityType"]>("weights");
  const [title, setTitle] = useState("Push day");
  const [duration, setDuration] = useState(45);
  const [effort, setEffort] = useState(7);
  const [proof, setProof] = useState(PROOFS[0]);
  const [note, setNote] = useState("");
  const [visibility, setVisibility] = useState<Visibility>(onboarding?.privacyDefault ?? "crew");
  const [details, setDetails] = useState<Record<string, string | number>>({});

  function submit() {
    haptic("success");
    addCheckIn({
      activityType: type,
      title,
      duration,
      effort,
      note,
      proofLabel: proof.label,
      proofEmoji: proof.emoji,
      visibility,
      pendingVerifications: visibility !== "private" ? ["c1", "c2", "c4"] : [],
      details,
    });
    toast.success("Check-in posted. Sent to Crew.");
    navigate({ to: "/check-in/done" });
  }

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      {step === -1 ? (
        <div className="min-h-[70vh] flex flex-col">
          <div>
            <div className="font-mono text-xs uppercase tracking-[0.22em] text-primary">
              60-second check-in
            </div>
            <h1 className="font-display font-extrabold text-3xl md:text-5xl mt-3 leading-[1.05] tracking-tight">
              Did you train<br />today?
            </h1>
            <p className="text-muted-foreground mt-3 max-w-md">
              No long form. Two taps and a proof shot. Your Crew sees the receipt.
            </p>
          </div>
          <div className="mt-auto pt-10 grid gap-3">
            <button
              type="button"
              onClick={() => { haptic("success"); setStep(0); }}
              className="w-full inline-flex items-center justify-between rounded-3xl bg-primary text-primary-foreground px-6 py-5 text-left shadow-[0_14px_40px_-10px_var(--color-primary)] active:scale-[0.99]"
            >
              <span>
                <span className="block font-display font-extrabold text-2xl">Yes — log it</span>
                <span className="block text-xs opacity-80 mt-1">Activity · effort · proof · share</span>
              </span>
              <ArrowRight className="h-6 w-6" />
            </button>
            <Link
              to="/recovery"
              className="w-full inline-flex items-center justify-between rounded-3xl border border-border bg-surface px-6 py-5"
            >
              <span>
                <span className="block font-display font-bold text-lg">Recovery day</span>
                <span className="block text-xs text-muted-foreground mt-1">Log sleep, energy, mood — still counts.</span>
              </span>
              <HeartPulse className="h-5 w-5 text-ember" />
            </Link>
            <button
              type="button"
              onClick={() => navigate({ to: "/today" })}
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" /> Not now
            </button>
          </div>
        </div>
      ) : (
      <>
      <div>
        <div className="font-mono text-xs uppercase tracking-[0.2em] text-primary">
          Check-in · Step {step + 2} of 5
        </div>
        <h1 className="font-display font-bold text-3xl md:text-4xl mt-2">
          {step === 0 && "What did you train?"}
          {step === 1 && "How hard? How long?"}
          {step === 2 && "Post your proof."}
          {step === 3 && "Who sees this?"}
        </h1>
      </div>

      <div className="grid grid-cols-5 gap-1.5">
        {[-1, 0, 1, 2, 3].map((i) => (
          <div key={i} className="h-2 rounded-full bg-surface-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                i < step ? "bg-primary w-full" : i === step ? "progress-live w-full" : "w-0"
              }`}
            />
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between -mt-6 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        <span>Start</span><span>Activity</span><span>Effort</span><span>Proof</span><span>Share</span>
      </div>

      {step === 0 && (
        <div key="s0" className="space-y-6 step-enter">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {TYPES.map((t) => {
              const active = type === t.id;
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    haptic("select");
                    setType(t.id);
                    setTitle(t.defaults[0]);
                  }}
                  className={`card-elevated p-4 text-left transition ${active ? "ring-2 ring-primary border-primary" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <Icon className="h-5 w-5 text-primary" />
                    <span className="text-2xl">{t.emoji}</span>
                  </div>
                  <div className="mt-3 font-display font-bold">{t.label}</div>
                </button>
              );
            })}
          </div>

          <div>
            <Label>Quick title</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {TYPES.find((t) => t.id === type)?.defaults.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setTitle(d)}
                  className={`rounded-full border px-3 py-1.5 text-sm ${
                    title === d
                      ? "bg-primary text-primary-foreground border-transparent"
                      : "border-border bg-surface hover:border-primary/60"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Or write your own"
              className="mt-3 w-full rounded-xl border border-border bg-surface px-4 py-3 text-base outline-none focus:border-primary/60"
            />
          </div>

          {type === "weights" && (
            <div className="card-elevated p-5 space-y-3">
              <Label>Anchor lifts (optional)</Label>
              <div className="grid sm:grid-cols-2 gap-3">
                {["Bench", "Squat", "Deadlift", "Overhead press"].map((lift) => (
                  <input
                    key={lift}
                    type="text"
                    placeholder={`${lift} sets · e.g. 4x6 @70kg`}
                    onChange={(e) => setDetails({ ...details, [lift]: e.target.value })}
                    className="rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary/60"
                  />
                ))}
              </div>
            </div>
          )}
          {type === "cardio" && (
            <div className="card-elevated p-5 grid sm:grid-cols-3 gap-3">
              <NumField label="Distance (km)" onChange={(v) => setDetails({ ...details, distance: v })} />
              <NumField label="Avg pace (sec/km)" onChange={(v) => setDetails({ ...details, pace: v })} />
              <NumField label="Avg HR" onChange={(v) => setDetails({ ...details, hr: v })} />
            </div>
          )}
          {type === "lifestyle" && (
            <div className="card-elevated p-5 grid grid-cols-2 sm:grid-cols-4 gap-2">
              {["Water ≥ 2L", "Vegetables ×2", "Sleep ≥ 7h", "Walk ≥ 30m"].map((h) => (
                <ToggleChip key={h} label={h} onToggle={(v) => setDetails({ ...details, [h]: v ? 1 : 0 })} />
              ))}
            </div>
          )}
          {type === "sport" && (
            <div className="card-elevated p-5 grid sm:grid-cols-2 gap-3">
              <select
                onChange={(e) => setDetails({ ...details, sport: e.target.value })}
                className="rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none"
                defaultValue=""
              >
                <option value="" disabled>Pick a sport</option>
                {["Football", "Basketball", "Tennis", "Climbing", "Boxing", "Swimming"].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Drill or benchmark (e.g. 3v3 scrim)"
                onChange={(e) => setDetails({ ...details, drill: e.target.value })}
                className="rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none"
              />
            </div>
          )}
        </div>
      )}

      {step === 1 && (
        <div key="s1" className="space-y-8 step-enter">
          <div>
            <Label>Effort (RPE)</Label>
            <div className="mt-4">
              <div className="flex items-baseline gap-2">
                <span className="font-display font-bold text-6xl pop-in" key={effort}>{effort}</span>
                <span className="text-muted-foreground">/ 10 · {RPE[effort - 1]}</span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                value={effort}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (v !== effort) haptic("soft");
                  setEffort(v);
                }}
                className="slider-bold mt-5"
                style={{ ["--val" as string]: `${((effort - 1) / 9) * 100}%` }}
              />
              <div className="ticks h-2 mt-1 mx-1 rounded-full opacity-50" />
              <div className="flex justify-between mt-2 font-mono text-[10px] text-muted-foreground">
                <span>easy</span><span>steady</span><span>all-out</span>
              </div>
            </div>
          </div>

          <div>
            <Label>Duration</Label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-3">
              {[15, 30, 45, 60, 75, 90].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => { haptic("select"); setDuration(d); }}
                  className={`rounded-xl border py-3 font-display font-bold ${
                    duration === d
                      ? "bg-primary text-primary-foreground border-transparent"
                      : "border-border bg-surface"
                  }`}
                >
                  {d}<span className="text-xs font-normal text-muted-foreground">m</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label>Quick note (optional)</Label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="One line about how it felt."
              className="mt-2 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-primary/60 resize-none"
            />
          </div>
        </div>
      )}

      {step === 2 && (
        <div key="s2" className="space-y-6 step-enter">
          <div className="grid sm:grid-cols-5 gap-3">
            {PROOFS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => { haptic("select"); setProof(p); }}
                className={`card-elevated p-4 transition ${proof.label === p.label ? "ring-2 ring-primary border-primary" : ""}`}
              >
                <div className="text-3xl">{p.emoji}</div>
                <div className="mt-2 text-xs">{p.label}</div>
              </button>
            ))}
          </div>
          <button
            type="button"
            className="w-full rounded-2xl border-2 border-dashed border-border hover:border-primary/60 hover:bg-primary/5 p-8 text-center transition"
          >
            <Camera className="h-8 w-8 mx-auto text-muted-foreground" />
            <div className="mt-3 font-display font-semibold">Tap to capture proof</div>
            <div className="text-xs text-muted-foreground mt-1">
              {proof.emoji} {proof.label}
            </div>
          </button>
        </div>
      )}

      {step === 3 && (
        <div key="s3" className="space-y-6 step-enter">
          <div className="grid sm:grid-cols-3 gap-3">
            <VisCard active={visibility === "private"} onClick={() => { haptic("select"); setVisibility("private"); }} icon={Lock} label="Private" body="Only you see. Still counts." />
            <VisCard active={visibility === "crew"} onClick={() => { haptic("select"); setVisibility("crew"); }} icon={Users} label="Crew" body="3 Crew members verify." />
            <VisCard active={visibility === "public"} onClick={() => { haptic("select"); setVisibility("public"); }} icon={Globe} label="Public" body="On Passport + leaderboard." />
          </div>

          <div className="card-elevated p-5">
            <div className="font-mono text-xs uppercase tracking-wider text-primary">Summary</div>
            <div className="mt-3 space-y-2 text-sm">
              <Row label="Activity">{TYPES.find((t) => t.id === type)?.label} · {title}</Row>
              <Row label="Duration">{duration} min · RPE {effort}</Row>
              <Row label="Proof">{proof.emoji} {proof.label}</Row>
              <Row label="Visibility">{visibility}</Row>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => { haptic("tap"); setStep(Math.max(-1, step - 1)); }}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        {step < 3 ? (
          <button
            type="button"
            onClick={() => {
              const next = step + 1;
              setStep(next);
              haptic("success");
              const msgs = ["Activity locked in 💪", "Intensity dialed 🔥", "Proof loaded 📸"];
              toast.success(msgs[step] ?? "Next");
            }}
            className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-7 py-3.5 font-semibold hover:opacity-90 min-h-[52px]"
          >
            Next <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={submit}
            className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-7 py-3.5 font-semibold hover:opacity-90 shadow-[0_8px_32px_-8px_var(--color-primary)] min-h-[52px]"
          >
            <Check className="h-4 w-4" /> Post check-in
          </button>
        )}
      </div>
      </>
      )}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">{children}</div>;
}
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{children}</span>
    </div>
  );
}
function NumField({ label, onChange }: { label: string; onChange: (v: number) => void }) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <input
        type="number"
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary/60"
      />
    </label>
  );
}
function ToggleChip({ label, onToggle }: { label: string; onToggle: (v: boolean) => void }) {
  const [on, setOn] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        const v = !on;
        setOn(v);
        onToggle(v);
      }}
      className={`rounded-lg border px-3 py-3 text-sm font-medium ${
        on ? "bg-primary text-primary-foreground border-transparent" : "border-border bg-surface"
      }`}
    >
      {label}
    </button>
  );
}
function VisCard({
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
      className={`text-left card-elevated p-4 transition ${active ? "ring-2 ring-primary border-primary" : ""}`}
    >
      <Icon className="h-5 w-5 text-primary" />
      <div className="mt-3 font-display font-bold capitalize">{label}</div>
      <div className="text-xs text-muted-foreground mt-1">{body}</div>
    </button>
  );
}