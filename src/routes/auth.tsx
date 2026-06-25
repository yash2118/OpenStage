import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useApp, listSavedProfiles, forgetProfile, type SavedProfile } from "@/lib/store";
import { Logo } from "@/components/AppShell";
import { ArrowRight, Mail, Lock, User, Apple, Chrome, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — OpenStage Gym" }] }),
  component: Auth,
});

type Mode = "signin" | "signup" | "forgot" | "reset";

function Auth() {
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [remember, setRemember] = useState(true);
  const [profiles, setProfiles] = useState<SavedProfile[]>([]);
  const { signIn, onboarding } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    setProfiles(listSavedProfiles());
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === "forgot") {
      if (!email) return toast.error("Enter your email.");
      toast.success("If that account exists, we sent a reset link.");
      setMode("reset");
      return;
    }
    if (mode === "reset") {
      if (!password || password.length < 6) return toast.error("Use 6+ characters.");
      if (password !== confirm) return toast.error("Passwords don't match.");
      toast.success("Password updated. Sign in to continue.");
      setMode("signin");
      setPassword("");
      setConfirm("");
      return;
    }
    if (!email || !password || (mode === "signup" && !name)) {
      return toast.error("Fill in all fields to continue.");
    }
    const displayName = mode === "signup" ? name : email.split("@")[0];
    signIn(displayName, email);
    if (!remember) forgetProfile(email);
    toast.success(mode === "signup" ? "Welcome to OpenStage." : "Welcome back.");
    navigate({ to: onboarding ? "/today" : "/onboarding" });
  }

  function demo() {
    signIn("Alex Rivera", "alex@openstage.app");
    toast.success("Signed in as demo athlete.");
    navigate({ to: onboarding ? "/today" : "/onboarding" });
  }

  function social(provider: "google" | "apple") {
    const seed =
      provider === "google"
        ? { name: "Jordan Lee", email: "jordan@google.demo" }
        : { name: "Sam Park", email: "sam@apple.demo" };
    signIn(seed.name, seed.email);
    toast.success(`Signed in with ${provider === "google" ? "Google" : "Apple"} (demo).`);
    navigate({ to: onboarding ? "/today" : "/onboarding" });
  }

  function useProfile(p: SavedProfile) {
    signIn(p.name, p.email);
    toast.success(`Welcome back, ${p.name.split(" ")[0]}.`);
    navigate({ to: onboarding ? "/today" : "/onboarding" });
  }

  function removeProfile(e: React.MouseEvent, email: string) {
    e.stopPropagation();
    forgetProfile(email);
    setProfiles(listSavedProfiles());
  }

  const heading =
    mode === "signup"
      ? "Create your account"
      : mode === "forgot"
        ? "Reset your password"
        : mode === "reset"
          ? "Set a new password"
          : "Sign in";
  const tag =
    mode === "signup"
      ? "Start your free week"
      : mode === "forgot"
        ? "We'll email a reset link"
        : mode === "reset"
          ? "Almost done"
          : "Welcome back";
  const subtitle =
    mode === "signup"
      ? "No card needed. First week is on us."
      : mode === "forgot"
        ? "Enter the email tied to your account."
        : mode === "reset"
          ? "Choose a password you'll actually remember."
          : "Pick up where you left off.";

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <div className="hidden md:flex flex-col justify-between p-10 border-r border-border bg-surface/40 relative overflow-hidden">
        <div className="absolute inset-0 grid-dot-bg opacity-50 pointer-events-none" />
        <Link to="/" className="flex items-center gap-2 relative">
          <Logo />
          <span className="font-display font-bold tracking-tight text-lg">OpenStage</span>
        </Link>
        <div className="relative">
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-primary">The promise</div>
          <h2 className="mt-3 font-display font-bold text-4xl leading-tight">
            Small steps.<br />Consistent habits.<br />
            <span className="text-primary">Real progress.</span>
          </h2>
          <p className="mt-4 text-muted-foreground max-w-sm">
            You&apos;re signing into a gym that follows up — not a passive workout library.
          </p>
        </div>
        <div className="relative font-mono text-xs text-muted-foreground">© OpenStage Gym</div>
      </div>

      <div className="flex flex-col p-6 md:p-10">
        <Link to="/" className="md:hidden flex items-center gap-2 mb-8">
          <Logo />
          <span className="font-display font-bold">OpenStage</span>
        </Link>
        <div className="m-auto w-full max-w-sm">
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-primary">{tag}</div>
          <h1 className="font-display font-bold text-3xl mt-2">{heading}</h1>
          <p className="text-sm text-muted-foreground mt-2">{subtitle}</p>

          {(mode === "signin" || mode === "signup") && profiles.length > 0 && (
            <div className="mt-6 space-y-2">
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Continue as
              </div>
              {profiles.map((p) => (
                <button
                  key={p.email}
                  type="button"
                  onClick={() => useProfile(p)}
                  className="w-full flex items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2.5 hover:border-primary/60 text-left group"
                >
                  <span
                    className="h-9 w-9 rounded-full grid place-items-center text-sm font-bold text-black"
                    style={{ background: p.avatarColor }}
                  >
                    {p.name.slice(0, 1)}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-medium truncate">{p.name}</span>
                    <span className="block text-xs text-muted-foreground truncate">{p.email}</span>
                  </span>
                  <span
                    role="button"
                    onClick={(e) => removeProfile(e, p.email)}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground"
                    aria-label="Forget profile"
                  >
                    <X className="h-4 w-4" />
                  </span>
                </button>
              ))}
              <div className="text-center text-[11px] text-muted-foreground pt-1">or use a different account</div>
            </div>
          )}

          {(mode === "signin" || mode === "signup") && (
            <div className="mt-6 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => social("google")}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-surface px-3 py-2.5 text-sm hover:border-primary/60"
              >
                <Chrome className="h-4 w-4" /> Google
              </button>
              <button
                type="button"
                onClick={() => social("apple")}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-surface px-3 py-2.5 text-sm hover:border-primary/60"
              >
                <Apple className="h-4 w-4" /> Apple
              </button>
            </div>
          )}

          {(mode === "signin" || mode === "signup") && (
            <div className="mt-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">or email</span>
              <div className="h-px flex-1 bg-border" />
            </div>
          )}

          <form onSubmit={submit} className="mt-5 space-y-3">
            {mode === "signup" && (
              <Field icon={User} placeholder="Your name" value={name} onChange={setName} />
            )}
            {mode !== "reset" && (
              <Field
                icon={Mail}
                placeholder="you@email.com"
                type="email"
                value={email}
                onChange={setEmail}
              />
            )}
            {mode !== "forgot" && (
              <Field
                icon={Lock}
                placeholder={mode === "reset" ? "New password" : "Password"}
                type="password"
                value={password}
                onChange={setPassword}
              />
            )}
            {mode === "reset" && (
              <Field
                icon={Lock}
                placeholder="Confirm password"
                type="password"
                value={confirm}
                onChange={setConfirm}
              />
            )}

            {(mode === "signin" || mode === "signup") && (
              <div className="flex items-center justify-between text-xs">
                <label className="inline-flex items-center gap-2 text-muted-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-3.5 w-3.5 accent-[var(--color-primary)]"
                  />
                  Remember me
                </label>
                {mode === "signin" && (
                  <button
                    type="button"
                    onClick={() => setMode("forgot")}
                    className="text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
            )}

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground py-3 font-semibold hover:opacity-90"
            >
              {mode === "signup"
                ? "Create account"
                : mode === "forgot"
                  ? "Send reset link"
                  : mode === "reset"
                    ? "Update password"
                    : "Sign in"}{" "}
              <ArrowRight className="h-4 w-4" />
            </button>
            {(mode === "signin" || mode === "signup") && (
              <button
                type="button"
                onClick={demo}
                className="w-full text-xs text-muted-foreground hover:text-foreground py-2"
              >
                or continue as demo athlete
              </button>
            )}
          </form>

          <div className="mt-6 text-sm text-muted-foreground text-center">
            {mode === "signup" && (
              <>
                Already have an account?{" "}
                <button onClick={() => setMode("signin")} className="text-primary hover:underline font-medium">
                  Sign in
                </button>
              </>
            )}
            {mode === "signin" && (
              <>
                New to OpenStage?{" "}
                <button onClick={() => setMode("signup")} className="text-primary hover:underline font-medium">
                  Create an account
                </button>
              </>
            )}
            {(mode === "forgot" || mode === "reset") && (
              <button onClick={() => setMode("signin")} className="text-primary hover:underline font-medium">
                Back to sign in
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  icon: Icon,
  type = "text",
  ...p
}: {
  icon: React.ComponentType<{ className?: string }>;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="flex items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2.5 focus-within:border-primary/60">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <input
        type={type}
        placeholder={p.placeholder}
        value={p.value}
        onChange={(e) => p.onChange(e.target.value)}
        className="bg-transparent outline-none text-sm flex-1"
      />
    </label>
  );
}