import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Timer as TimerIcon,
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Plus,
  Minus,
  Volume2,
  VolumeX,
  CheckCircle2,
  Dumbbell,
  Activity,
  Flame,
  Hourglass,
} from "lucide-react";
import { haptic } from "@/lib/haptics";
import { toast } from "sonner";

export const Route = createFileRoute("/_authed/timer")({
  head: () => ({ meta: [{ title: "Session Timer — OpenStage" }] }),
  component: TimerRoute,
});

type Mode = "interval" | "amrap" | "stopwatch";

type Preset = {
  id: string;
  name: string;
  mode: Mode;
  work: number; // seconds
  rest: number;
  rounds: number;
  emoji: string;
  hint: string;
};

const PRESETS: Preset[] = [
  { id: "tabata", name: "Tabata", mode: "interval", work: 20, rest: 10, rounds: 8, emoji: "🔥", hint: "20s on · 10s off × 8" },
  { id: "emom10", name: "EMOM 10", mode: "interval", work: 40, rest: 20, rounds: 10, emoji: "⏱️", hint: "Every minute · 10 rounds" },
  { id: "circuit", name: "Circuit", mode: "interval", work: 45, rest: 15, rounds: 6, emoji: "🔁", hint: "45/15 · 6 rounds" },
  { id: "amrap12", name: "AMRAP 12", mode: "amrap", work: 720, rest: 0, rounds: 1, emoji: "⚡", hint: "12 minutes, all-out" },
  { id: "stop", name: "Stopwatch", mode: "stopwatch", work: 0, rest: 0, rounds: 1, emoji: "⌛", hint: "Free-form count up" },
];

const SETTINGS_KEY = "openstage.timer.settings.v1";

type Settings = { sound: boolean; lastPresetId: string };

function loadSettings(): Settings {
  if (typeof window === "undefined") return { sound: true, lastPresetId: "tabata" };
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { sound: true, lastPresetId: "tabata" };
    return { sound: true, lastPresetId: "tabata", ...JSON.parse(raw) };
  } catch {
    return { sound: true, lastPresetId: "tabata" };
  }
}

function saveSettings(s: Settings) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

function beep(freq: number, ms: number) {
  try {
    const Ctx = (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.value = 0.15;
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    setTimeout(() => {
      osc.stop();
      ctx.close();
    }, ms);
  } catch {
    /* noop */
  }
}

function fmt(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

function TimerRoute() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<Settings>({ sound: true, lastPresetId: "tabata" });
  const [hydrated, setHydrated] = useState(false);
  const [preset, setPreset] = useState<Preset>(PRESETS[0]);
  const [work, setWork] = useState(20);
  const [rest, setRest] = useState(10);
  const [rounds, setRounds] = useState(8);

  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0); // seconds since segment start
  const [round, setRound] = useState(1);
  const [phase, setPhase] = useState<"work" | "rest" | "done">("work");
  const [totalElapsed, setTotalElapsed] = useState(0);

  const tickRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);
  const baseRef = useRef<number>(0);

  // hydrate
  useEffect(() => {
    const s = loadSettings();
    setSettings(s);
    const p = PRESETS.find((x) => x.id === s.lastPresetId) ?? PRESETS[0];
    applyPreset(p, false);
    setHydrated(true);
  }, []);
  useEffect(() => {
    if (hydrated) saveSettings(settings);
  }, [settings, hydrated]);

  function applyPreset(p: Preset, resetClock = true) {
    setPreset(p);
    setWork(p.work);
    setRest(p.rest);
    setRounds(p.rounds);
    if (resetClock) reset(p);
    setSettings((s) => ({ ...s, lastPresetId: p.id }));
  }

  function reset(p: Preset = preset) {
    stopTick();
    setRunning(false);
    setElapsed(0);
    setTotalElapsed(0);
    setRound(1);
    setPhase(p.mode === "stopwatch" ? "work" : "work");
  }

  function stopTick() {
    if (tickRef.current) {
      cancelAnimationFrame(tickRef.current);
      tickRef.current = null;
    }
  }

  function startTick() {
    startRef.current = performance.now();
    const loop = () => {
      const dt = (performance.now() - startRef.current) / 1000;
      setElapsed(baseRef.current + dt);
      setTotalElapsed((t) => t + 0); // trigger no-op; real total computed below
      tickRef.current = requestAnimationFrame(loop);
    };
    tickRef.current = requestAnimationFrame(loop);
  }

  // Drive phase transitions from elapsed
  useEffect(() => {
    if (!running) return;
    if (preset.mode === "stopwatch") {
      setTotalElapsed(elapsed);
      return;
    }
    if (preset.mode === "amrap") {
      const remain = work - elapsed;
      setTotalElapsed(elapsed);
      if (remain <= 0) {
        finish();
      } else if (remain <= 3 && remain > 2.9) {
        if (settings.sound) beep(700, 80);
      } else if (remain <= 2 && remain > 1.9) {
        if (settings.sound) beep(700, 80);
      } else if (remain <= 1 && remain > 0.9) {
        if (settings.sound) beep(700, 80);
      }
      return;
    }
    // interval
    const segLen = phase === "work" ? work : rest;
    setTotalElapsed((prev) => prev);
    if (elapsed >= segLen) {
      if (phase === "work") {
        if (rest > 0 && round <= rounds) {
          setPhase("rest");
          baseRef.current = 0;
          startRef.current = performance.now();
          setElapsed(0);
          haptic("tap");
          if (settings.sound) beep(440, 140);
        } else {
          nextRound();
        }
      } else {
        nextRound();
      }
    } else if (segLen - elapsed <= 3 && segLen - elapsed > 2.9) {
      if (settings.sound) beep(700, 80);
    } else if (segLen - elapsed <= 2 && segLen - elapsed > 1.9) {
      if (settings.sound) beep(700, 80);
    } else if (segLen - elapsed <= 1 && segLen - elapsed > 0.9) {
      if (settings.sound) beep(700, 80);
    }
  }, [elapsed, running]);

  function nextRound() {
    if (round >= rounds) {
      finish();
      return;
    }
    setRound((r) => r + 1);
    setPhase("work");
    baseRef.current = 0;
    startRef.current = performance.now();
    setElapsed(0);
    haptic("success");
    if (settings.sound) beep(880, 180);
  }

  function finish() {
    stopTick();
    setRunning(false);
    setPhase("done");
    haptic("success");
    if (settings.sound) {
      beep(880, 200);
      setTimeout(() => beep(1100, 220), 220);
    }
    toast.success("Session complete. Log it as a check-in?", {
      action: {
        label: "Log it",
        onClick: () =>
          navigate({
            to: "/check-in",
            search: { from: "timer" } as never,
          } as never),
      },
    });
  }

  function toggle() {
    if (phase === "done") {
      reset();
      return;
    }
    if (running) {
      stopTick();
      baseRef.current = elapsed;
      setRunning(false);
      haptic("tap");
    } else {
      setRunning(true);
      haptic("success");
      startTick();
    }
  }

  function skip() {
    if (preset.mode === "stopwatch") return;
    if (preset.mode === "amrap") {
      finish();
      return;
    }
    if (phase === "work") {
      if (rest > 0) {
        setPhase("rest");
        baseRef.current = 0;
        startRef.current = performance.now();
        setElapsed(0);
      } else nextRound();
    } else {
      nextRound();
    }
  }

  // cleanup on unmount
  useEffect(() => () => stopTick(), []);

  const segLen = preset.mode === "stopwatch" ? 0 : phase === "work" ? work : rest;
  const remain = preset.mode === "stopwatch"
    ? elapsed
    : preset.mode === "amrap"
      ? Math.max(0, work - elapsed)
      : Math.max(0, segLen - elapsed);
  const ringPct = preset.mode === "stopwatch" ? 0 : segLen ? Math.min(1, elapsed / segLen) : 0;

  const totalDuration = useMemo(() => {
    if (preset.mode === "stopwatch") return 0;
    if (preset.mode === "amrap") return work;
    return (work + rest) * rounds;
  }, [preset, work, rest, rounds]);

  const phaseColor =
    phase === "done"
      ? "var(--color-primary)"
      : preset.mode === "stopwatch" || phase === "work"
        ? "var(--color-primary)"
        : "oklch(0.7 0.15 240)";

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-muted-foreground">
          <TimerIcon className="h-3.5 w-3.5" /> Session timer
        </div>
        <div className="flex items-start justify-between gap-3">
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
            Focus mode. One screen, one job.
          </h1>
          <button
            onClick={() => setSettings((s) => ({ ...s, sound: !s.sound }))}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-2/40 px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
            aria-label="Toggle sound"
          >
            {settings.sound ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            {settings.sound ? "Sound on" : "Muted"}
          </button>
        </div>
      </header>

      <div className="flex gap-2 overflow-x-auto momentum-scroll -mx-4 px-4 md:mx-0 md:px-0">
        {PRESETS.map((p) => {
          const active = preset.id === p.id;
          return (
            <button
              key={p.id}
              onClick={() => applyPreset(p)}
              className={`shrink-0 rounded-xl border px-3 py-2 text-left min-w-[140px] transition ${
                active
                  ? "border-primary bg-primary/[0.07]"
                  : "border-border bg-surface-2/40 hover:bg-accent"
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="text-base">{p.emoji}</span>
                <span className="font-display font-bold text-sm">{p.name}</span>
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">{p.hint}</div>
            </button>
          );
        })}
      </div>

      <div className="rounded-3xl border border-border bg-surface-2/40 p-6 md:p-10">
        <div className="grid place-items-center">
          <Dial
            pct={ringPct}
            color={phaseColor}
            label={
              phase === "done"
                ? "Done"
                : preset.mode === "stopwatch"
                  ? "Stopwatch"
                  : preset.mode === "amrap"
                    ? "AMRAP"
                    : phase === "work"
                      ? "Work"
                      : "Rest"
            }
            value={fmt(remain)}
            sub={
              preset.mode === "interval"
                ? `Round ${Math.min(round, rounds)} / ${rounds}`
                : preset.mode === "amrap"
                  ? `Total ${fmt(work)}`
                  : "Counting up"
            }
          />
        </div>

        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="grid h-12 w-12 place-items-center rounded-full border border-border bg-background text-muted-foreground hover:text-foreground"
            aria-label="Reset"
          >
            <RotateCcw className="h-5 w-5" />
          </button>
          <button
            onClick={toggle}
            className="grid h-16 w-16 place-items-center rounded-full bg-primary text-primary-foreground shadow-[0_12px_36px_-10px_var(--color-primary)] hover:brightness-110"
            aria-label={running ? "Pause" : "Start"}
          >
            {phase === "done" ? (
              <RotateCcw className="h-6 w-6" />
            ) : running ? (
              <Pause className="h-7 w-7" />
            ) : (
              <Play className="h-7 w-7 ml-0.5" />
            )}
          </button>
          <button
            onClick={skip}
            disabled={preset.mode === "stopwatch"}
            className="grid h-12 w-12 place-items-center rounded-full border border-border bg-background text-muted-foreground hover:text-foreground disabled:opacity-30"
            aria-label="Skip"
          >
            <SkipForward className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-2 max-w-md mx-auto">
          <Mini icon={Flame} label="Elapsed" value={fmt(preset.mode === "interval" ? roundElapsed(round, phase, work, rest, elapsed) : elapsed)} />
          <Mini icon={Hourglass} label="Total" value={totalDuration ? fmt(totalDuration) : "—"} />
          <Mini icon={Activity} label="Phase" value={phase === "done" ? "Done" : preset.mode === "stopwatch" ? "Run" : phase} />
        </div>
      </div>

      {preset.mode === "interval" && (
        <div className="rounded-2xl border border-border bg-surface-2/30 p-5">
          <div className="font-display font-bold text-sm mb-3">Tune the interval</div>
          <div className="grid grid-cols-3 gap-3">
            <Stepper label="Work (s)" value={work} onChange={setWork} step={5} min={5} max={600} />
            <Stepper label="Rest (s)" value={rest} onChange={setRest} step={5} min={0} max={600} />
            <Stepper label="Rounds" value={rounds} onChange={setRounds} step={1} min={1} max={50} />
          </div>
        </div>
      )}

      {preset.mode === "amrap" && (
        <div className="rounded-2xl border border-border bg-surface-2/30 p-5">
          <div className="font-display font-bold text-sm mb-3">Window length</div>
          <Stepper label="Minutes" value={Math.round(work / 60)} onChange={(v) => setWork(v * 60)} step={1} min={1} max={60} />
        </div>
      )}

      <div className="rounded-2xl border border-border bg-surface-2/30 p-5">
        <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2">
          <Dumbbell className="h-3 w-3" /> Pro tip
        </div>
        <p className="text-sm text-muted-foreground">
          When the timer ends, we'll prompt you to log a check-in. Keep your phone on
          do-not-disturb — the screen stays awake while running.
        </p>
        <button
          onClick={() =>
            navigate({
              to: "/check-in",
              search: { from: "timer" } as never,
            } as never)
          }
          className="mt-4 inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-semibold hover:bg-accent"
        >
          <CheckCircle2 className="h-4 w-4" /> Log a check-in
        </button>
      </div>
    </div>
  );
}

function roundElapsed(round: number, phase: "work" | "rest" | "done", work: number, rest: number, segElapsed: number) {
  const finishedRounds = round - 1;
  const segOffset = phase === "rest" ? work : 0;
  return finishedRounds * (work + rest) + segOffset + segElapsed;
}

function Dial({
  pct,
  color,
  label,
  value,
  sub,
}: {
  pct: number;
  color: string;
  label: string;
  value: string;
  sub: string;
}) {
  const size = 260;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - pct);
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="var(--color-border)"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 80ms linear" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            {label}
          </div>
          <div className="font-display font-bold tabular-nums text-6xl mt-1 leading-none">
            {value}
          </div>
          <div className="text-xs text-muted-foreground mt-2">{sub}</div>
        </div>
      </div>
    </div>
  );
}

function Mini({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-background px-3 py-2 text-center">
      <div className="flex items-center justify-center gap-1 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3 w-3" /> {label}
      </div>
      <div className="font-display font-bold text-sm mt-0.5 tabular-nums capitalize">{value}</div>
    </div>
  );
}

function Stepper({
  label,
  value,
  onChange,
  step,
  min,
  max,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step: number;
  min: number;
  max: number;
}) {
  return (
    <div className="rounded-xl border border-border bg-background p-2">
      <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground text-center">
        {label}
      </div>
      <div className="mt-1 flex items-center justify-between gap-1">
        <button
          onClick={() => onChange(Math.max(min, value - step))}
          className="grid h-8 w-8 place-items-center rounded-md border border-border text-muted-foreground hover:text-foreground"
          aria-label="Decrease"
        >
          <Minus className="h-4 w-4" />
        </button>
        <div className="font-display font-bold text-xl tabular-nums">{value}</div>
        <button
          onClick={() => onChange(Math.min(max, value + step))}
          className="grid h-8 w-8 place-items-center rounded-md border border-border text-muted-foreground hover:text-foreground"
          aria-label="Increase"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
