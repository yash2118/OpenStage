import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { haptic } from "@/lib/haptics";

const DISMISS_KEY = "openstage.install.dismissedAt";
const COOLDOWN_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function InstallPrompt() {
  const [evt, setEvt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Already installed?
    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      // iOS Safari
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window.navigator as any).standalone === true;
    if (standalone) return;

    try {
      const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) ?? "0");
      if (dismissedAt && Date.now() - dismissedAt < COOLDOWN_MS) return;
    } catch {
      // ignore
    }

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvt(e as BeforeInstallPromptEvent);
      // Delay so it doesn't fight the first-paint experience.
      setTimeout(() => setVisible(true), 1800);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  const dismiss = () => {
    haptic("tap");
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // ignore
    }
  };

  const install = async () => {
    if (!evt) return;
    haptic("success");
    await evt.prompt();
    await evt.userChoice;
    setVisible(false);
    setEvt(null);
  };

  if (!visible || !evt) return null;

  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 z-50 bottom-[calc(6.5rem+env(safe-area-inset-bottom))] md:bottom-6 w-[min(28rem,calc(100vw-2rem))] soft-rise"
      role="dialog"
      aria-label="Install OpenStage"
    >
      <div className="card-elevated p-4 flex items-center gap-3 shadow-2xl border-primary/30">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 text-primary shrink-0">
          <Download className="h-5 w-5" />
        </span>
        <div className="flex-1 min-w-0">
          <div className="font-display font-bold text-sm">Install OpenStage</div>
          <div className="text-xs text-muted-foreground">
            Add to your home screen for full-screen training.
          </div>
        </div>
        <button
          onClick={install}
          className="rounded-full bg-primary text-primary-foreground px-3.5 py-1.5 text-xs font-semibold hover:opacity-90 shrink-0"
        >
          Install
        </button>
        <button
          onClick={dismiss}
          className="text-muted-foreground hover:text-foreground p-1.5 shrink-0"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}