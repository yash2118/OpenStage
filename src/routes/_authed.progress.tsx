import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useApp } from "@/lib/store";
import {
  Camera,
  Upload,
  Trash2,
  X,
  ArrowLeftRight,
  Scale,
  Ruler,
  Lock,
  Calendar as CalendarIcon,
  Sparkles,
  ImagePlus,
} from "lucide-react";
import { toast } from "sonner";
import { haptic } from "@/lib/haptics";
import { format, formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/_authed/progress")({
  head: () => ({ meta: [{ title: "Progress Photos — OpenStage" }] }),
  component: ProgressRoute,
});

type Pose = "front" | "side" | "back" | "other";

type Snap = {
  id: string;
  date: string; // ISO
  dataUrl: string;
  pose: Pose;
  weightKg?: number;
  note?: string;
};

const STORAGE_KEY = "openstage.progress.snaps.v1";

function loadSnaps(): Snap[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as Snap[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function saveSnaps(snaps: Snap[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snaps));
  } catch {
    toast.error("Storage full. Delete some old photos and try again.");
  }
}

async function fileToDataUrl(file: File, maxDim = 1280): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no canvas");
  ctx.drawImage(bitmap, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", 0.82);
}

function ProgressRoute() {
  const { onboarding } = useApp();
  const [snaps, setSnaps] = useState<Snap[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [adding, setAdding] = useState(false);
  const [viewing, setViewing] = useState<Snap | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);

  useEffect(() => {
    setSnaps(loadSnaps());
    setHydrated(true);
  }, []);
  useEffect(() => {
    if (hydrated) saveSnaps(snaps);
  }, [snaps, hydrated]);

  function addSnap(s: Omit<Snap, "id">) {
    const ns: Snap = { ...s, id: `snap_${Date.now()}` };
    setSnaps((xs) => [ns, ...xs].slice(0, 60));
    haptic("success");
    toast.success("Photo saved — stays on this device.");
  }

  function remove(id: string) {
    setSnaps((xs) => xs.filter((x) => x.id !== id));
    setCompareIds((c) => c.filter((x) => x !== id));
    haptic("tap");
  }

  function toggleCompare(id: string) {
    setCompareIds((c) => {
      if (c.includes(id)) return c.filter((x) => x !== id);
      if (c.length >= 2) return [c[1], id];
      return [...c, id];
    });
  }

  const grouped = useMemo(() => {
    const map = new Map<string, Snap[]>();
    [...snaps]
      .sort((a, b) => b.date.localeCompare(a.date))
      .forEach((s) => {
        const k = s.date.slice(0, 7); // YYYY-MM
        if (!map.has(k)) map.set(k, []);
        map.get(k)!.push(s);
      });
    return Array.from(map.entries());
  }, [snaps]);

  const compareSnaps = compareIds
    .map((id) => snaps.find((s) => s.id === id))
    .filter((x): x is Snap => !!x);

  const goalWeight = onboarding?.goalWeightKg;
  const firstWeight = [...snaps].sort((a, b) => a.date.localeCompare(b.date))[0]?.weightKg;
  const lastWeight = snaps[0]?.weightKg;
  const delta =
    firstWeight !== undefined && lastWeight !== undefined ? lastWeight - firstWeight : undefined;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-muted-foreground">
          <Camera className="h-3.5 w-3.5" /> Progress photos
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
          The body doesn't lie. Show it the receipts.
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Drop monthly snapshots. We'll line them up so you can spot real change instead of
          mirror-mood. Photos stay on your device.
        </p>
      </header>

      <div className="grid grid-cols-3 gap-3">
        <Stat
          icon={Camera}
          label="Snapshots"
          value={`${snaps.length}`}
          hint={snaps[0] ? `Last ${formatDistanceToNow(new Date(snaps[0].date))} ago` : "Add your first"}
        />
        <Stat
          icon={Scale}
          label="Weight Δ"
          value={delta !== undefined ? `${delta > 0 ? "+" : ""}${delta.toFixed(1)} kg` : "—"}
          hint={firstWeight !== undefined && lastWeight !== undefined ? `${firstWeight} → ${lastWeight} kg` : "Log weight per photo"}
        />
        <Stat
          icon={Ruler}
          label="Target"
          value={goalWeight ? `${goalWeight} kg` : "—"}
          hint={goalWeight && lastWeight ? `${(lastWeight - goalWeight).toFixed(1)} to go` : "Set in onboarding"}
        />
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Lock className="h-3.5 w-3.5" />
          Stored locally — never uploaded.
        </div>
        <div className="flex items-center gap-2">
          {compareIds.length === 2 && (
            <button
              onClick={() => setCompareIds([])}
              className="rounded-lg border border-border bg-surface-2/40 px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              Clear compare
            </button>
          )}
          <button
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-[0_10px_30px_-12px_var(--color-primary)] hover:brightness-110"
          >
            <ImagePlus className="h-4 w-4" /> Add photo
          </button>
        </div>
      </div>

      {compareSnaps.length === 2 && <CompareStrip a={compareSnaps[0]} b={compareSnaps[1]} />}

      {snaps.length === 0 ? (
        <EmptyState onAdd={() => setAdding(true)} />
      ) : (
        <div className="space-y-6">
          {grouped.map(([month, list]) => (
            <section key={month}>
              <div className="mb-2 flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-muted-foreground">
                <CalendarIcon className="h-3.5 w-3.5" />
                {format(new Date(`${month}-01T00:00:00`), "MMMM yyyy")}
                <span className="text-muted-foreground/60">· {list.length}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {list.map((s) => {
                  const picked = compareIds.includes(s.id);
                  return (
                    <div
                      key={s.id}
                      className={`group relative aspect-[3/4] rounded-xl overflow-hidden border ${
                        picked ? "border-primary" : "border-border"
                      } bg-surface-2/40`}
                    >
                      <button
                        onClick={() => setViewing(s)}
                        className="absolute inset-0"
                        aria-label="View photo"
                      >
                        <img
                          src={s.dataUrl}
                          alt={`${s.pose} on ${format(new Date(s.date), "MMM d")}`}
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      </button>
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                        <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-white">
                          <span>{format(new Date(s.date), "MMM d")}</span>
                          <span className="capitalize">{s.pose}</span>
                        </div>
                        {s.weightKg !== undefined && (
                          <div className="text-white font-semibold text-xs">{s.weightKg} kg</div>
                        )}
                      </div>
                      <div className="absolute top-1.5 right-1.5 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleCompare(s.id);
                          }}
                          className={`grid h-7 w-7 place-items-center rounded-md backdrop-blur-sm text-xs font-bold ${
                            picked ? "bg-primary text-primary-foreground" : "bg-background/80 text-foreground"
                          }`}
                          aria-label="Toggle compare"
                          title="Compare"
                        >
                          <ArrowLeftRight className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            remove(s.id);
                          }}
                          className="grid h-7 w-7 place-items-center rounded-md bg-background/80 backdrop-blur-sm text-foreground hover:text-red-500"
                          aria-label="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {adding && <AddDialog onClose={() => setAdding(false)} onSave={addSnap} />}
      {viewing && <ViewerDialog snap={viewing} onClose={() => setViewing(null)} onDelete={() => { remove(viewing.id); setViewing(null); }} />}
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface-2/40 p-3">
      <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3 w-3" /> {label}
      </div>
      <div className="font-display text-2xl font-bold mt-1 tabular-nums">{value}</div>
      <div className="text-[11px] text-muted-foreground truncate">{hint}</div>
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-surface-2/20 p-10 text-center">
      <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-background border border-border">
        <Camera className="h-6 w-6 text-muted-foreground" />
      </div>
      <div className="font-display font-bold text-lg">No snapshots yet</div>
      <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
        Take one front, one side, one back. Same lighting, same time of day. Future-you will
        thank you.
      </p>
      <button
        onClick={onAdd}
        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:brightness-110"
      >
        <ImagePlus className="h-4 w-4" /> Add first photo
      </button>
    </div>
  );
}

function CompareStrip({ a, b }: { a: Snap; b: Snap }) {
  const [older, newer] = a.date < b.date ? [a, b] : [b, a];
  const dayGap = Math.abs(
    Math.round((new Date(newer.date).getTime() - new Date(older.date).getTime()) / 86_400_000),
  );
  const weightDelta =
    older.weightKg !== undefined && newer.weightKg !== undefined
      ? newer.weightKg - older.weightKg
      : undefined;
  return (
    <div className="rounded-2xl border border-primary/40 bg-primary/[0.06] p-4">
      <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-primary mb-3">
        <ArrowLeftRight className="h-3.5 w-3.5" /> Compare · {dayGap}d apart
      </div>
      <div className="grid grid-cols-2 gap-3">
        <CompareCard label="Before" snap={older} />
        <CompareCard label="After" snap={newer} />
      </div>
      {weightDelta !== undefined && (
        <div className="mt-3 text-center text-sm">
          <span className="font-mono text-xs text-muted-foreground">Weight Δ</span>{" "}
          <span className="font-display font-bold">
            {weightDelta > 0 ? "+" : ""}
            {weightDelta.toFixed(1)} kg
          </span>
        </div>
      )}
    </div>
  );
}

function CompareCard({ label, snap }: { label: string; snap: Snap }) {
  return (
    <div className="rounded-xl overflow-hidden border border-border bg-background">
      <div className="aspect-[3/4] relative">
        <img src={snap.dataUrl} alt={label} className="h-full w-full object-cover" />
        <div className="absolute top-1.5 left-1.5 rounded-md bg-background/85 backdrop-blur-sm px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider">
          {label}
        </div>
      </div>
      <div className="px-3 py-2 text-xs">
        <div className="font-semibold">{format(new Date(snap.date), "MMM d, yyyy")}</div>
        <div className="text-muted-foreground capitalize">
          {snap.pose}
          {snap.weightKg !== undefined ? ` · ${snap.weightKg} kg` : ""}
        </div>
      </div>
    </div>
  );
}

function ViewerDialog({
  snap,
  onClose,
  onDelete,
}: {
  snap: Snap;
  onClose: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-background/80 backdrop-blur-md p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-md w-full rounded-2xl overflow-hidden border border-border bg-background shadow-2xl"
      >
        <img src={snap.dataUrl} alt="" className="w-full" />
        <button
          onClick={onClose}
          className="absolute top-2 right-2 grid h-9 w-9 place-items-center rounded-full bg-background/80 backdrop-blur-sm text-foreground"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-display font-bold">{format(new Date(snap.date), "EEEE, MMM d, yyyy")}</div>
              <div className="text-xs text-muted-foreground capitalize">
                {snap.pose} pose{snap.weightKg !== undefined ? ` · ${snap.weightKg} kg` : ""}
              </div>
            </div>
            <button
              onClick={onDelete}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface-2/40 px-2.5 py-1.5 text-xs font-semibold text-muted-foreground hover:text-red-500"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
          </div>
          {snap.note && <p className="text-sm text-muted-foreground">{snap.note}</p>}
        </div>
      </div>
    </div>
  );
}

function AddDialog({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (s: Omit<Snap, "id">) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [pose, setPose] = useState<Pose>("front");
  const [weight, setWeight] = useState<string>("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));

  async function onFile(f: File | null) {
    if (!f) return;
    setBusy(true);
    try {
      const url = await fileToDataUrl(f);
      setDataUrl(url);
    } catch {
      toast.error("Couldn't read that image.");
    } finally {
      setBusy(false);
    }
  }

  function submit() {
    if (!dataUrl) {
      toast.error("Pick a photo first.");
      return;
    }
    const w = weight.trim() ? Number(weight) : undefined;
    onSave({
      date: new Date(`${date}T12:00:00`).toISOString(),
      dataUrl,
      pose,
      weightKg: w && !Number.isNaN(w) ? w : undefined,
      note: note.trim() || undefined,
    });
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end md:items-center justify-center bg-background/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full md:max-w-md rounded-t-2xl md:rounded-2xl border border-border bg-background shadow-2xl p-5 space-y-4 soft-rise"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              New snapshot
            </div>
            <div className="font-display text-lg font-bold">Capture a check-point</div>
          </div>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => onFile(e.target.files?.[0] ?? null)}
        />

        {dataUrl ? (
          <div className="relative rounded-xl overflow-hidden border border-border bg-surface-2/40">
            <img src={dataUrl} alt="preview" className="w-full max-h-72 object-contain" />
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute bottom-2 right-2 rounded-md bg-background/85 backdrop-blur-sm px-2.5 py-1.5 text-xs font-semibold"
            >
              Replace
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="w-full rounded-xl border-2 border-dashed border-border bg-surface-2/30 p-8 text-center hover:bg-accent/40 transition disabled:opacity-50"
          >
            <Upload className="h-6 w-6 mx-auto text-muted-foreground" />
            <div className="mt-2 font-display font-bold text-sm">
              {busy ? "Processing…" : "Tap to pick or shoot"}
            </div>
            <div className="text-xs text-muted-foreground">JPEG / PNG, auto-compressed</div>
          </button>
        )}

        <div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1.5">
            Pose
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {(["front", "side", "back", "other"] as Pose[]).map((p) => (
              <button
                key={p}
                onClick={() => setPose(p)}
                className={`rounded-md border px-2 py-1.5 text-xs font-semibold capitalize ${
                  pose === p
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border bg-surface-2/40 text-muted-foreground hover:text-foreground"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1.5">
              Date
            </div>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface-2/40 px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1.5">
              Weight (kg, optional)
            </div>
            <input
              type="number"
              step="0.1"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="—"
              className="w-full rounded-lg border border-border bg-surface-2/40 px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
        </div>

        <div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1.5">
            Note (optional)
          </div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="How you feel, what's working, what's not."
            rows={2}
            className="w-full rounded-lg border border-border bg-surface-2/40 px-3 py-2 text-sm outline-none focus:border-primary resize-none"
          />
        </div>

        <div className="rounded-lg bg-surface-2/40 border border-border px-3 py-2 text-[11px] text-muted-foreground flex items-start gap-2">
          <Sparkles className="h-3.5 w-3.5 mt-0.5 text-primary shrink-0" />
          Pro: same outfit, same wall, morning light. Consistency beats angles.
        </div>

        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-border bg-surface-2/40 px-3 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:brightness-110"
          >
            <Camera className="h-3.5 w-3.5" /> Save snapshot
          </button>
        </div>
      </div>
    </div>
  );
}
