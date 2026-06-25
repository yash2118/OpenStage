import { useEffect, useRef } from "react";
import { X, Download, Copy } from "lucide-react";
import { renderShareCard, downloadCanvas, type ShareCardInput } from "@/lib/shareCard";
import { haptic } from "@/lib/haptics";
import { toast } from "sonner";

export function ShareCardDialog({
  open,
  onClose,
  input,
}: {
  open: boolean;
  onClose: () => void;
  input: ShareCardInput;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!open || !canvasRef.current) return;
    renderShareCard(canvasRef.current, input);
  }, [open, input]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const download = () => {
    if (!canvasRef.current) return;
    haptic("success");
    const name = `openstage-${input.variant ?? "share"}-${new Date()
      .toISOString()
      .slice(0, 10)}.png`;
    downloadCanvas(canvasRef.current, name);
    toast.success("Share card downloaded.");
  };

  const copyLink = async () => {
    haptic("tap");
    try {
      await navigator.clipboard.writeText(`https://openstage.app/@${input.user.handle}`);
      toast.success("Passport link copied.");
    } catch {
      toast.error("Could not copy link.");
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-background/70 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-label="Share card"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-3xl border border-border bg-background shadow-2xl overflow-hidden soft-rise"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-primary">Share</div>
            <div className="font-display font-bold">
              {input.variant === "passport" ? "Passport card" : "Check-in card"}
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-muted-foreground hover:bg-accent"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4 bg-surface-2/40 max-h-[70vh] overflow-y-auto">
          <div className="rounded-2xl overflow-hidden border border-border shadow-lg">
            <canvas
              ref={canvasRef}
              className="w-full h-auto block"
              style={{ aspectRatio: "1080 / 1350" }}
            />
          </div>
          <p className="text-xs text-muted-foreground text-center mt-3">
            1080×1350 — sized for stories & feeds.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 p-4 border-t border-border">
          <button
            onClick={copyLink}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-border py-2.5 text-sm font-semibold hover:bg-accent"
          >
            <Copy className="h-4 w-4" /> Copy link
          </button>
          <button
            onClick={download}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground py-2.5 text-sm font-semibold hover:opacity-90"
          >
            <Download className="h-4 w-4" /> Download
          </button>
        </div>
      </div>
    </div>
  );
}