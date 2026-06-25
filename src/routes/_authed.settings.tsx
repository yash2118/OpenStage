import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useApp } from "@/lib/store";
import { Avatar } from "@/components/AppShell";
import {
  Bell,
  Download,
  Eye,
  LogOut,
  Moon,
  RotateCcw,
  Save,
  Shield,
  Sun,
  Upload,
  Vibrate,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { haptic } from "@/lib/haptics";
import { useTheme } from "@/lib/theme";
import { resetWelcomeTour } from "@/components/WelcomeTour";

type Prefs = {
  notifyCheckin: boolean;
  notifyCrew: boolean;
  notifyWeekly: boolean;
  notifyEvents: boolean;
  haptics: boolean;
  reducedMotion: boolean;
  defaultVisibility: "private" | "crew" | "public";
  shareHealth: boolean;
  shareLocation: boolean;
};

const PREFS_KEY = "openstage.prefs.v1";
const DEFAULT_PREFS: Prefs = {
  notifyCheckin: true,
  notifyCrew: true,
  notifyWeekly: true,
  notifyEvents: false,
  haptics: true,
  reducedMotion: false,
  defaultVisibility: "crew",
  shareHealth: false,
  shareLocation: false,
};

export const Route = createFileRoute("/_authed/settings")({
  head: () => ({ meta: [{ title: "Settings — OpenStage" }] }),
  component: Settings,
});

function Settings() {
  const { user, onboarding, updateProfile, signOut, reset } = useApp();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [name, setName] = useState(user?.name ?? "");
  const [handle, setHandle] = useState(user?.handle ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PREFS_KEY);
      if (raw) setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(raw) });
    } catch {
      // ignore
    }
  }, []);

  const update = <K extends keyof Prefs>(k: K, v: Prefs[K]) => {
    setPrefs((p) => {
      const next = { ...p, [k]: v };
      try {
        localStorage.setItem(PREFS_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
    haptic("select");
  };

  const exportData = () => {
    haptic("tap");
    const dump: Record<string, unknown> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith("openstage")) continue;
      try {
        dump[key] = JSON.parse(localStorage.getItem(key) ?? "null");
      } catch {
        dump[key] = localStorage.getItem(key);
      }
    }
    const blob = new Blob([JSON.stringify(dump, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `openstage-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Export downloaded.");
  };

  const importData = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        Object.entries(parsed).forEach(([k, v]) => {
          if (k.startsWith("openstage")) {
            localStorage.setItem(k, typeof v === "string" ? v : JSON.stringify(v));
          }
        });
        toast.success("Imported. Reloading…");
        haptic("success");
        setTimeout(() => window.location.reload(), 600);
      } catch {
        toast.error("Invalid file.");
      }
    };
    reader.readAsText(file);
  };

  if (!user) return null;

  return (
    <div className="space-y-8 max-w-2xl">
      <header>
        <div className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Settings</div>
        <h1 className="font-display font-bold text-3xl md:text-4xl mt-2">Your account</h1>
      </header>

      <div className="card-elevated p-6 flex items-center gap-4">
        <Avatar name={user.name} color={user.avatarColor} size="lg" />
        <div className="min-w-0">
          <div className="font-display font-bold text-lg truncate">{user.name}</div>
          <div className="text-sm text-muted-foreground truncate">@{user.handle} · {user.email}</div>
        </div>
      </div>

      <div className="card-elevated p-6 space-y-4">
        <div className="font-mono text-xs uppercase tracking-wider text-primary">Profile</div>
        <Field label="Display name" value={name} onChange={setName} />
        <Field label="Handle" value={handle} onChange={setHandle} prefix="@" />
        <Field label="Email" value={email} onChange={setEmail} type="email" />
        <button
          onClick={() => {
            haptic("success");
            updateProfile({ name, handle, email });
            toast.success("Profile saved.");
          }}
          className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-semibold hover:opacity-90"
        >
          <Save className="h-4 w-4" /> Save changes
        </button>
      </div>

      {onboarding && (
        <div className="card-elevated p-6">
          <div className="font-mono text-xs uppercase tracking-wider text-primary">Training profile</div>
          <div className="mt-3 grid sm:grid-cols-2 gap-3 text-sm">
            <Item label="Frequency" value={`${onboarding.weeklyCommitment}× / week`} />
            <Item label="Experience" value={onboarding.experience} />
            <Item label="Location" value={onboarding.trainingLocation} />
            <Item label="Eating style" value={onboarding.eatingStyle} />
          </div>
          <button
            onClick={() => navigate({ to: "/onboarding" })}
            className="mt-4 text-sm text-primary hover:underline"
          >
            Redo onboarding →
          </button>
        </div>
      )}

      <div className="card-elevated p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary" />
          <div className="font-mono text-xs uppercase tracking-wider text-primary">Notifications</div>
        </div>
        <Toggle
          label="Check-in reminders"
          hint="Nudge me on my training days"
          value={prefs.notifyCheckin}
          onChange={(v) => update("notifyCheckin", v)}
        />
        <Toggle
          label="Crew activity"
          hint="When your crew verifies or comments"
          value={prefs.notifyCrew}
          onChange={(v) => update("notifyCrew", v)}
        />
        <Toggle
          label="Weekly review"
          hint="Sunday recap delivered to you"
          value={prefs.notifyWeekly}
          onChange={(v) => update("notifyWeekly", v)}
        />
        <Toggle
          label="Event updates"
          hint="Leaderboard moves and countdowns"
          value={prefs.notifyEvents}
          onChange={(v) => update("notifyEvents", v)}
        />
      </div>

      <div className="card-elevated p-6 space-y-4">
        <div className="flex items-center gap-2">
          {theme === "dark" ? <Moon className="h-4 w-4 text-primary" /> : <Sun className="h-4 w-4 text-primary" />}
          <div className="font-mono text-xs uppercase tracking-wider text-primary">Appearance & feel</div>
        </div>
        <div>
          <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Theme</span>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {(["dark", "light"] as const).map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTheme(t);
                  haptic("select");
                }}
                className={`rounded-xl border px-3 py-2.5 text-sm font-semibold capitalize transition ${
                  theme === t
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-surface text-foreground/80 hover:bg-accent"
                }`}
              >
                {t === "dark" ? "Dark" : "Light"}
              </button>
            ))}
          </div>
        </div>
        <Toggle
          label="Haptic feedback"
          hint="Vibration on actions (supported devices)"
          value={prefs.haptics}
          onChange={(v) => update("haptics", v)}
          icon={<Vibrate className="h-4 w-4" />}
        />
        <Toggle
          label="Reduce motion"
          hint="Soften transitions and animations"
          value={prefs.reducedMotion}
          onChange={(v) => update("reducedMotion", v)}
        />
      </div>

      <div className="card-elevated p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          <div className="font-mono text-xs uppercase tracking-wider text-primary">Privacy</div>
        </div>
        <div>
          <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Default check-in visibility</span>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {(["private", "crew", "public"] as const).map((v) => (
              <button
                key={v}
                onClick={() => update("defaultVisibility", v)}
                className={`rounded-xl border px-3 py-2.5 text-xs font-semibold capitalize transition ${
                  prefs.defaultVisibility === v
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-surface text-foreground/80 hover:bg-accent"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
        <Toggle
          label="Share health metrics with crew"
          hint="Sleep, energy, mood averages"
          value={prefs.shareHealth}
          onChange={(v) => update("shareHealth", v)}
          icon={<Eye className="h-4 w-4" />}
        />
        <Toggle
          label="Share training location"
          hint="Show your gym/region on your passport"
          value={prefs.shareLocation}
          onChange={(v) => update("shareLocation", v)}
        />
      </div>

      <div className="card-elevated p-6 space-y-3">
        <div className="font-mono text-xs uppercase tracking-wider text-primary">Your data</div>
        <p className="text-sm text-muted-foreground">
          Everything lives on this device. Export a backup or move it to another browser.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={exportData}
            className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-accent"
          >
            <Download className="h-4 w-4" /> Export data
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-accent"
          >
            <Upload className="h-4 w-4" /> Import data
          </button>
          <button
            onClick={() => {
              resetWelcomeTour();
              haptic("tap");
              toast.success("Welcome tour will replay on next load.");
            }}
            className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-accent"
          >
            <Sparkles className="h-4 w-4" /> Replay tour
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) importData(f);
              e.target.value = "";
            }}
          />
        </div>
      </div>

      <div className="card-elevated p-6 space-y-3">
        <div className="font-mono text-xs uppercase tracking-wider text-destructive">Danger zone</div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              haptic("tap");
              reset();
              toast.success("Demo data reset.");
              navigate({ to: "/auth" });
            }}
            className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-accent"
          >
            <RotateCcw className="h-4 w-4" /> Reset demo
          </button>
          <button
            onClick={() => {
              haptic("tap");
              signOut();
              toast("Signed out.");
              navigate({ to: "/" });
            }}
            className="inline-flex items-center gap-2 rounded-full border border-destructive/40 text-destructive px-4 py-2 text-sm hover:bg-destructive/10"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </div>

      <p className="text-center text-[11px] text-muted-foreground/70 font-mono">
        OpenStage — local-first demo · v0.10
      </p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  prefix,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  prefix?: string;
}) {
  return (
    <label className="block">
      <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <div className="mt-1 flex items-center rounded-xl border border-border bg-surface px-3 focus-within:border-primary/60">
        {prefix && <span className="text-muted-foreground text-sm pr-1">{prefix}</span>}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-transparent py-2.5 text-sm outline-none"
        />
      </div>
    </label>
  );
}
function Item({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-surface-2/60 p-3">
      <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 font-display font-semibold capitalize">{value}</div>
    </div>
  );
}

function Toggle({
  label,
  hint,
  value,
  onChange,
  icon,
}: {
  label: string;
  hint?: string;
  value: boolean;
  onChange: (v: boolean) => void;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="w-full flex items-center justify-between gap-3 rounded-xl bg-surface-2/40 px-3 py-3 text-left hover:bg-surface-2/70 transition"
    >
      <div className="min-w-0 flex items-start gap-2">
        {icon && <span className="mt-0.5 text-muted-foreground">{icon}</span>}
        <div className="min-w-0">
          <div className="text-sm font-semibold truncate">{label}</div>
          {hint && <div className="text-xs text-muted-foreground truncate">{hint}</div>}
        </div>
      </div>
      <span
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${
          value ? "bg-primary" : "bg-surface-2 border border-border"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 rounded-full bg-background shadow transition-transform ${
            value ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </span>
    </button>
  );
}