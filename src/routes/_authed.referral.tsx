import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Copy, Send, Gift, Check } from "lucide-react";
import { useApp } from "@/lib/store";
import { haptic } from "@/lib/haptics";
import { toast } from "sonner";

export const Route = createFileRoute("/_authed/referral")({
  component: ReferralPage,
});

function ReferralPage() {
  const { referral, inviteReferral, user } = useApp();
  const [name, setName] = useState("");
  const [copied, setCopied] = useState(false);
  const code = referral.code || "JOIN-OS";
  const link = `https://openstage.gym/r/${code}`;
  const joined = referral.invited.filter((i) => i.joined).length;

  function copy() {
    navigator.clipboard?.writeText(link);
    setCopied(true);
    haptic("success");
    toast.success("Invite link copied.");
    setTimeout(() => setCopied(false), 1500);
  }

  function send() {
    if (!name.trim()) return;
    inviteReferral(name.trim());
    haptic("success");
    toast.success(`Invite sent to ${name.trim()}.`);
    setName("");
  }

  function share() {
    const text = `${user?.name ?? "I"} invited you to OpenStage — accountability that actually sticks. Code: ${code}`;
    if (navigator.share) {
      navigator.share({ title: "OpenStage", text, url: link }).catch(() => {});
    } else {
      copy();
    }
  }

  return (
    <div className="space-y-6 fade-up max-w-xl">
      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Invite crew
        </div>
        <h1 className="font-display font-black text-3xl tracking-tight mt-1">
          Bring your people in
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          Each friend who joins unlocks a streak shield for both of you and +50 XP on their first verified check-in.
        </p>
      </div>

      <div className="rounded-3xl border border-primary/40 bg-gradient-to-br from-primary/10 to-primary/5 p-6 text-center">
        <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Your code
        </div>
        <div className="font-display font-black text-5xl tracking-[0.2em] text-primary mt-2">
          {code}
        </div>
        <div className="mt-4 flex flex-col sm:flex-row gap-2">
          <button
            onClick={copy}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-background border border-border px-4 py-2.5 text-sm font-semibold active:scale-95 transition"
          >
            {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied" : "Copy link"}
          </button>
          <button
            onClick={share}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 py-2.5 text-sm font-semibold active:scale-95 transition"
          >
            <Send className="h-4 w-4" /> Share invite
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Invited" value={referral.invited.length} />
        <Stat label="Joined" value={joined} />
        <Stat label="XP earned" value={referral.invited.length * 10} />
      </div>

      <div className="rounded-2xl border border-border/50 bg-card p-4 space-y-3">
        <div className="flex items-center gap-2 font-display font-bold">
          <Gift className="h-4 w-4 text-primary" /> Send personal invite
        </div>
        <div className="flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Friend's name"
            className="flex-1 rounded-lg bg-surface-2 border border-border px-3 py-2 text-sm"
          />
          <button
            onClick={send}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground active:scale-95 transition"
          >
            Invite
          </button>
        </div>
      </div>

      {referral.invited.length > 0 && (
        <section>
          <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground px-1 pb-2">
            History
          </div>
          <div className="rounded-2xl border border-border/50 bg-card divide-y divide-border">
            {referral.invited.map((i, idx) => (
              <div key={idx} className="flex items-center justify-between px-4 py-3">
                <div>
                  <div className="font-semibold text-sm">{i.name}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {new Date(i.date).toLocaleDateString()}
                  </div>
                </div>
                <span
                  className={`text-[10px] font-mono uppercase tracking-wider rounded-full px-2 py-0.5 ${
                    i.joined
                      ? "bg-primary/15 text-primary"
                      : "bg-surface-2 text-muted-foreground"
                  }`}
                >
                  {i.joined ? "Joined" : "Pending"}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border/50 bg-card p-3 text-center">
      <div className="font-display font-black text-2xl">{value}</div>
      <div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
    </div>
  );
}