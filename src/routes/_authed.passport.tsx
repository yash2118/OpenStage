import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useApp, useStreak, weeklyProgress, trustTier } from "@/lib/store";
import { GOAL_LABELS } from "@/lib/seed";
import { Avatar } from "@/components/AppShell";
import { ShieldCheck, Flame, Globe, Lock, Users, IdCard, Copy, Heart, Mic, Video, Type, Trophy, CheckCircle2, Share2 } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ShareCardDialog } from "@/components/ShareCardDialog";
import { haptic } from "@/lib/haptics";

export const Route = createFileRoute("/_authed/passport")({
  head: () => ({ meta: [{ title: "Gym Passport — OpenStage" }] }),
  component: Passport,
});

function Passport() {
  const { user, onboarding, checkIns, trustScore, updatePrivacy, futureSelf, setFutureSelf, milestones } = useApp();
  const streak = useStreak();
  const weekly = weeklyProgress(checkIns, onboarding?.weeklyCommitment ?? 4);
  const [view, setView] = useState<"public" | "private">("public");
  const [routines, setRoutines] = useState(["Push / Pull / Legs · 4×/wk", "Easy Zone 2 · 2×/wk"]);
  const [newRoutine, setNewRoutine] = useState("");
  const [shareOpen, setShareOpen] = useState(false);
  const tier = trustTier(trustScore);

  if (!user || !onboarding) return null;

  function copyLink() {
    navigator.clipboard?.writeText(`openstage.app/@${user!.handle}`);
    toast.success("Passport link copied.");
  }

  return (
    <div className="space-y-8">
      <div className="card-elevated p-6 md:p-8 relative overflow-hidden">
        <div className="absolute inset-0 grid-dot-bg opacity-40 pointer-events-none" />
        <div className="relative flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div className="flex items-center gap-4">
            <Avatar name={user.name} color={user.avatarColor} size="lg" />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <IdCard className="h-4 w-4 text-primary" />
                <span className="font-mono text-xs uppercase tracking-wider text-primary">Gym Passport</span>
              </div>
              <h1 className="font-display font-bold text-3xl md:text-4xl mt-1">{user.name}</h1>
              <div className="text-sm text-muted-foreground">
                @{user.handle} · openstage.app/@{user.handle}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={copyLink}
              className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-accent"
            >
              <Copy className="h-3.5 w-3.5" /> Share Passport
            </button>
            <button
              onClick={() => {
                haptic("tap");
                setShareOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold hover:opacity-90"
            >
              <Share2 className="h-3.5 w-3.5" /> Share card
            </button>
            <div className="inline-flex p-1 rounded-full bg-surface-2 border border-border">
              {(["public", "private"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-3 py-1 text-xs font-semibold rounded-full uppercase tracking-wider ${
                    view === v ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="relative mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat icon={Flame} value={streak} label="day streak" tone="ember" />
          <Stat icon={ShieldCheck} value={trustScore} label={tier.name} />
          <Stat icon={Users} value={checkIns.filter((c) => c.verified).length} label="verified check-ins" />
          <Stat icon={Globe} value={`${weekly.done}/${weekly.target}`} label="weekly target" />
        </div>
        <div className="relative mt-4">
          <TrustTierBar score={trustScore} />
        </div>
      </div>

      <FutureSelfPanel
        message={futureSelf}
        onSave={(m) => {
          setFutureSelf(m);
          toast.success("Future Self note updated.");
        }}
      />

      <PassportTimeline checkIns={checkIns} milestones={milestones} streak={streak} />

      <section className="grid lg:grid-cols-3 gap-4">
        <div className="card-elevated p-6 lg:col-span-2">
          <div className="font-mono text-xs uppercase tracking-wider text-primary">Goals & commitment</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {onboarding.goals.map((g) => (
              <span key={g} className="tag bg-primary/10 text-primary">{GOAL_LABELS[g]}</span>
            ))}
          </div>
          <div className="mt-6 grid sm:grid-cols-3 gap-3">
            <Mini label="Frequency" value={`${onboarding.weeklyCommitment}×/week`} />
            <Mini label="Experience" value={onboarding.experience} />
            <Mini label="Style" value={onboarding.eatingStyle} />
            <Mini label="Location" value={onboarding.trainingLocation} />
            <Mini label="Days" value={onboarding.trainingDays.join(" · ")} />
            <Mini label="Mode" value={onboarding.accountabilityMode} />
          </div>
        </div>
        <div className="card-elevated p-6">
          <div className="font-mono text-xs uppercase tracking-wider text-primary">Default privacy</div>
          <div className="mt-3 space-y-2">
            {[
              { id: "private", icon: Lock, label: "Private", body: "Counts but hidden." },
              { id: "crew", icon: Users, label: "Crew", body: "Verified by Crew." },
              { id: "public", icon: Globe, label: "Public", body: "On Passport + leaderboard." },
            ].map((p) => {
              const active = onboarding.privacyDefault === p.id;
              const Icon = p.icon;
              return (
                <button
                  key={p.id}
                  onClick={() => {
                    updatePrivacy(p.id as "private" | "crew" | "public");
                    toast.success(`Default set to ${p.label.toLowerCase()}.`);
                  }}
                  className={`w-full text-left rounded-xl border px-3 py-2.5 flex items-center gap-3 transition ${
                    active ? "border-primary bg-primary/5" : "border-border hover:bg-accent"
                  }`}
                >
                  <Icon className="h-4 w-4 text-primary" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold">{p.label}</div>
                    <div className="text-xs text-muted-foreground">{p.body}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="grid lg:grid-cols-2 gap-4">
        <div className="card-elevated p-6">
          <div className="font-mono text-xs uppercase tracking-wider text-primary">Routines</div>
          <ul className="mt-3 space-y-2">
            {routines.map((r, i) => (
              <li key={i} className="rounded-lg bg-surface-2/60 px-3 py-2 text-sm flex items-center justify-between">
                {r}
                <button
                  onClick={() => setRoutines(routines.filter((_, x) => x !== i))}
                  className="text-muted-foreground hover:text-destructive text-xs"
                >
                  remove
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex gap-2">
            <input
              value={newRoutine}
              onChange={(e) => setNewRoutine(e.target.value)}
              placeholder="Add routine (e.g. Sunday long ride · 90 min)"
              className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary/60"
            />
            <button
              onClick={() => {
                if (!newRoutine.trim()) return;
                setRoutines([...routines, newRoutine.trim()]);
                setNewRoutine("");
              }}
              className="rounded-lg bg-primary text-primary-foreground px-4 text-sm font-semibold hover:opacity-90"
            >
              Add
            </button>
          </div>
        </div>

        <div className="card-elevated p-6">
          <div className="font-mono text-xs uppercase tracking-wider text-primary">
            Recent {view === "private" ? "all" : "public"} check-ins
          </div>
          {checkIns.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">Post your first check-in to see history here.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {checkIns
                .filter((c) => view === "private" || c.visibility !== "private")
                .slice(0, 6)
                .map((c) => (
                  <div key={c.id} className="rounded-lg bg-surface-2/60 px-3 py-2 flex items-center gap-3 text-sm">
                    <span className="text-xl">{c.proofEmoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">{c.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {c.duration}m · RPE {c.effort} · {formatDistanceToNow(new Date(c.date))} ago
                      </div>
                    </div>
                    <span className="tag bg-surface-2 text-muted-foreground capitalize">{c.visibility}</span>
                  </div>
                ))}
            </div>
          )}
        </div>
      </section>

      <ShareCardDialog
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        input={{
          user,
          checkIn: checkIns[0],
          streak,
          trustScore,
          weeklyDone: weekly.done,
          weeklyTarget: weekly.target,
          variant: "passport",
        }}
      />
    </div>
  );
}

function Stat({
  icon: Icon,
  value,
  label,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: string | number;
  label: string;
  tone?: "ember";
}) {
  return (
    <div className="rounded-xl bg-surface-2/60 p-4">
      <Icon className={`h-5 w-5 ${tone === "ember" ? "text-ember" : "text-primary"}`} />
      <div className="mt-2 font-display font-bold text-2xl">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}
function Mini({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-surface-2/60 p-3">
      <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 font-display font-semibold capitalize truncate">{value}</div>
    </div>
  );
}

function TrustTierBar({ score }: { score: number }) {
  const stops = [
    { name: "Rookie", at: 0 },
    { name: "Reliable", at: 51 },
    { name: "Consistent", at: 76 },
    { name: "Elite", at: 91 },
  ];
  return (
    <div>
      <div className="relative h-2 rounded-full bg-surface-2 overflow-hidden">
        <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-ember" style={{ width: `${score}%`, transition: "width 1s ease" }} />
      </div>
      <div className="mt-2 grid grid-cols-4 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
        {stops.map((s) => (
          <span key={s.name} className={score >= s.at ? "text-primary" : ""}>{s.name}</span>
        ))}
      </div>
    </div>
  );
}

function FutureSelfPanel({
  message,
  onSave,
}: {
  message: ReturnType<typeof useApp>["futureSelf"];
  onSave: (m: NonNullable<ReturnType<typeof useApp>["futureSelf"]>) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message?.text ?? "");
  const [mode, setMode] = useState<"text" | "voice" | "video">(message?.mediaType ?? "text");
  const [recording, setRecording] = useState(false);
  const [mediaUrl, setMediaUrl] = useState<string | undefined>(message?.mediaDataUrl);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  async function startRecording(kind: "voice" | "video") {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(
        kind === "video" ? { video: true, audio: true } : { audio: true }
      );
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: kind === "video" ? "video/webm" : "audio/webm" });
        const url = URL.createObjectURL(blob);
        setMediaUrl(url);
      };
      rec.start();
      recorderRef.current = rec;
      setRecording(true);
    } catch {
      toast.error("Microphone or camera permission needed.");
    }
  }
  function stopRecording() {
    recorderRef.current?.stop();
    setRecording(false);
  }

  return (
    <section className="card-elevated p-6">
      <div className="flex items-start gap-4">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-ember/15 text-ember">
          <Heart className="h-5 w-5" />
        </span>
        <div className="flex-1 min-w-0">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-ember">Future Self</div>
          <div className="mt-2">
            {!editing && message ? (
              <>
                <p className="font-display text-lg leading-snug italic">"{message.text}"</p>
                {message.mediaDataUrl && message.mediaType === "voice" && (
                  <audio controls src={message.mediaDataUrl} className="mt-3 w-full" />
                )}
                {message.mediaDataUrl && message.mediaType === "video" && (
                  <video controls src={message.mediaDataUrl} className="mt-3 w-full max-h-64 rounded-xl" />
                )}
                <div className="mt-3 text-xs text-muted-foreground">
                  Updated {formatDistanceToNow(new Date(message.updatedAt))} ago · update monthly recommended.
                </div>
              </>
            ) : (
              <>
                <div className="inline-flex p-1 rounded-full bg-surface-2 border border-border">
                  {[
                    { id: "text" as const, icon: Type, label: "Text" },
                    { id: "voice" as const, icon: Mic, label: "Voice" },
                    { id: "video" as const, icon: Video, label: "Video" },
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setMode(m.id)}
                      className={`inline-flex items-center gap-1 px-3 py-1 text-xs rounded-full ${
                        mode === m.id ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                      }`}
                    >
                      <m.icon className="h-3 w-3" /> {m.label}
                    </button>
                  ))}
                </div>
                {mode === "text" && (
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    rows={4}
                    placeholder="Why are you doing this?"
                    className="mt-3 w-full rounded-xl border border-border bg-surface px-4 py-3 text-base outline-none focus:border-primary/60"
                  />
                )}
                {(mode === "voice" || mode === "video") && (
                  <div className="mt-3 space-y-2">
                    {mediaUrl && mode === "voice" && <audio controls src={mediaUrl} className="w-full" />}
                    {mediaUrl && mode === "video" && <video controls src={mediaUrl} className="w-full max-h-64 rounded-xl" />}
                    <button
                      onClick={() => (recording ? stopRecording() : startRecording(mode))}
                      className="rounded-full bg-primary text-primary-foreground px-4 py-2 text-xs font-semibold"
                    >
                      {recording ? "Stop recording" : mediaUrl ? "Re-record" : "Start recording"}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
          <div className="mt-4 flex gap-2">
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="rounded-full border border-border px-4 py-1.5 text-xs font-semibold hover:bg-accent"
              >
                {message ? "Update message" : "Write message"}
              </button>
            ) : (
              <>
                <button
                  onClick={() => {
                    onSave({
                      text: draft.trim() || message?.text || "Show up — even on the hard days.",
                      mediaType: mode,
                      mediaDataUrl: mediaUrl,
                      updatedAt: new Date().toISOString(),
                    });
                    setEditing(false);
                  }}
                  className="rounded-full bg-primary text-primary-foreground px-4 py-1.5 text-xs font-semibold"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="rounded-full border border-border px-4 py-1.5 text-xs font-semibold hover:bg-accent"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function PassportTimeline({
  checkIns,
  milestones,
  streak,
}: {
  checkIns: ReturnType<typeof useApp>["checkIns"];
  milestones: ReturnType<typeof useApp>["milestones"];
  streak: number;
}) {
  type Item = { id: string; date: string; emoji: string; title: string; detail?: string; kind: string };
  const items: Item[] = [];
  if (streak >= 3) items.push({ id: "s", date: new Date().toISOString(), emoji: "🔥", title: `${streak}-day streak`, kind: "streak" });
  for (const m of milestones) items.push({ id: m.id, date: m.date, emoji: m.emoji, title: m.title, detail: m.detail, kind: m.kind });
  for (const c of checkIns.slice(0, 20))
    items.push({
      id: c.id,
      date: c.date,
      emoji: c.proofEmoji,
      title: c.title,
      detail: `${c.duration}m · RPE ${c.effort}${c.verified ? " · Crew verified" : ""}`,
      kind: c.verified ? "verified" : "checkin",
    });
  items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const byMonth = new Map<string, Item[]>();
  for (const it of items) {
    const k = new Date(it.date).toLocaleDateString(undefined, { month: "long", year: "numeric" });
    byMonth.set(k, [...(byMonth.get(k) ?? []), it]);
  }

  return (
    <section className="card-elevated p-6">
      <div className="flex items-center justify-between">
        <div className="font-mono text-xs uppercase tracking-wider text-primary">Passport timeline</div>
        <div className="text-xs text-muted-foreground">{items.length} moments</div>
      </div>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">Your story starts with your first check-in.</p>
      ) : (
        <div className="mt-5 space-y-6">
          {Array.from(byMonth.entries()).map(([month, group]) => (
            <div key={month}>
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{month} · {group.length} moment{group.length === 1 ? "" : "s"}</div>
              <ol className="mt-3 relative border-l border-border pl-5 space-y-3">
                {group.map((it) => {
                  const Icon = it.kind === "verified" ? CheckCircle2 : it.kind === "streak" ? Flame : Trophy;
                  return (
                    <li key={it.id} className="relative">
                      <span className="absolute -left-[27px] grid h-5 w-5 place-items-center rounded-full bg-surface-2 border border-border text-[10px]">
                        <Icon className="h-3 w-3 text-primary" />
                      </span>
                      <div className="rounded-xl bg-surface-2/50 p-3 flex items-center gap-3">
                        <span className="text-2xl">{it.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm truncate">{it.title}</div>
                          {it.detail && <div className="text-xs text-muted-foreground">{it.detail}</div>}
                        </div>
                        <div className="text-[10px] font-mono text-muted-foreground">
                          {new Date(it.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}