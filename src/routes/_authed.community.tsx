import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useApp, seedLeaderboard } from "@/lib/store";
import { GOAL_LABELS } from "@/lib/seed";
import { Avatar } from "@/components/AppShell";
import { ReactionBar } from "@/components/ReactionBar";
import { ShieldCheck, Flame, MessageSquare, Check, X, AlertCircle, Trophy, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

export const Route = createFileRoute("/_authed/community")({
  head: () => ({ meta: [{ title: "Community — OpenStage" }] }),
  component: Community,
});

type Tab = "verify" | "crew" | "ranking";

function Community() {
  const { pending, crew, approvePending, requestMoreProof, rejectPending, trustScore, user, onboarding } = useApp();
  const [tab, setTab] = useState<Tab>("verify");
  const [scope, setScope] = useState<"cohort" | "global" | "event">("cohort");

  if (!user) return null;

  return (
    <div className="space-y-8">
      <header>
        <div className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Community</div>
        <h1 className="font-display font-bold text-3xl md:text-4xl mt-2">Accountability, made visible.</h1>
        <p className="text-muted-foreground mt-2 max-w-xl">
          Verify check-ins from your Crew, manage who&apos;s in it, and see how you rank against people with the same goal.
        </p>
      </header>

      <div className="inline-flex p-1 rounded-full bg-surface-2 border border-border">
        {(["verify", "crew", "ranking"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 text-sm font-semibold rounded-full transition ${
              tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            {t === "verify" ? `Verify (${pending.length})` : t === "crew" ? "Crew" : "Ranking"}
          </button>
        ))}
      </div>

      {tab === "verify" && (
        <section className="space-y-3">
          {pending.length === 0 ? (
            <div className="card-elevated p-10 text-center">
              <ShieldCheck className="h-10 w-10 mx-auto text-primary" />
              <div className="mt-3 font-display font-bold text-xl">All caught up.</div>
              <p className="text-muted-foreground text-sm mt-1">No pending verifications. Trust score: {trustScore}.</p>
            </div>
          ) : (
            pending.map((p) => {
              const member = crew.find((c) => c.id === p.fromMemberId);
              if (!member) return null;
              return (
                <div key={p.id} className="card-elevated p-5">
                  <div className="flex items-start gap-3">
                    <Avatar name={member.name} color={member.avatarColor} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-display font-semibold">{member.name}</span>
                        <span className="text-xs text-muted-foreground">@{member.handle}</span>
                        <span className="tag bg-surface-2 text-muted-foreground">
                          {p.activityType}
                        </span>
                        <span className="text-xs text-muted-foreground ml-auto">
                          {formatDistanceToNow(new Date(p.requestedAt))} ago
                        </span>
                      </div>
                      <div className="mt-2 font-display font-bold text-lg">{p.activityTitle}</div>
                      <div className="text-sm text-muted-foreground mt-1">RPE {p.effort} · {p.note}</div>
                      <div className="mt-3 rounded-xl bg-surface-2/60 p-3 flex items-center gap-3">
                        <div className="grid h-12 w-12 place-items-center rounded-lg bg-ember/20 text-2xl">{p.proofEmoji}</div>
                        <div className="text-sm">
                          <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Proof</div>
                          {p.proofLabel}
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-3 gap-2">
                        <button
                          onClick={() => {
                            approvePending(p.id);
                            toast.success(`Verified — ${member.name.split(" ")[0]}'s check-in. Trust +2.`);
                          }}
                          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary text-primary-foreground py-2 text-sm font-semibold hover:opacity-90"
                        >
                          <Check className="h-4 w-4" /> Verify
                        </button>
                        <button
                          onClick={() => {
                            requestMoreProof(p.id);
                            toast(`Asked ${member.name.split(" ")[0]} for more proof.`);
                          }}
                          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border py-2 text-sm font-semibold hover:bg-accent"
                        >
                          <AlertCircle className="h-4 w-4" /> More proof
                        </button>
                        <button
                          onClick={() => {
                            rejectPending(p.id);
                            toast("Passed on this one.");
                          }}
                          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border py-2 text-sm text-muted-foreground hover:bg-accent"
                        >
                          <X className="h-4 w-4" /> Pass
                        </button>
                      </div>
                      <ReactionBar itemId={p.id} />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </section>
      )}

      {tab === "crew" && (
        <section className="space-y-4">
          <CrewActivityFeed />
          <div className="card-elevated p-5">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <div className="font-display font-bold text-xl">Your Check-In Crew</div>
                <p className="text-sm text-muted-foreground">{crew.length} similar users matched by goal and frequency.</p>
              </div>
              <span className="tag bg-primary/10 text-primary">
                <ShieldCheck className="h-3 w-3" /> trust score {trustScore}
              </span>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {crew.map((c) => (
              <div key={c.id} className="card-elevated p-4 flex items-center gap-3">
                <Avatar name={c.name} color={c.avatarColor} size="lg" />
                <div className="flex-1 min-w-0">
                  <div className="font-display font-semibold truncate">{c.name}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {GOAL_LABELS[c.goal]} · @{c.handle}
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="tag bg-ember/10 text-ember">
                      <Flame className="h-3 w-3" /> {c.streak}d
                    </span>
                    <span className="tag bg-primary/10 text-primary">
                      <ShieldCheck className="h-3 w-3" /> {c.trustScore}
                    </span>
                  </div>
                </div>
                <button className="text-muted-foreground hover:text-foreground" aria-label="Message">
                  <MessageSquare className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {tab === "ranking" && (
        <section className="space-y-4">
          <div className="inline-flex p-1 rounded-full bg-surface-2 border border-border">
            {(["cohort", "event", "global"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setScope(s)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-full transition uppercase tracking-wider ${
                  scope === s ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="card-elevated p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-mono text-xs uppercase tracking-wider text-primary">
                  {scope === "cohort" && `${onboarding ? GOAL_LABELS[onboarding.goals[0] ?? "build_consistency"] : "Your"} · ${onboarding?.weeklyCommitment ?? 4}×/wk cohort`}
                  {scope === "event" && "Form & Foundation League · week 3"}
                  {scope === "global" && "Global · all goals"}
                </div>
                <h2 className="font-display font-bold text-2xl mt-1 flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" /> Leaderboard
                </h2>
              </div>
              <div className="text-right">
                <div className="font-display font-bold text-3xl">#4</div>
                <div className="text-xs text-muted-foreground">Your rank this week</div>
              </div>
            </div>
            <div className="mt-4 divide-y divide-border">
              <AnimatedRanking userName={user.name} />
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function AnimatedRanking({ userName }: { userName: string }) {
  const [rows, setRows] = useState(() =>
    seedLeaderboard.map((r, i) => ({ ...r, isYou: i === 3, delta: 0 })),
  );
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let step = 0;
    const id = setInterval(() => {
      step++;
      setRows((prev) => {
        const next = [...prev];
        // pick two adjacent rows to swap (deterministic-ish per step)
        const swapIdx = (step * 2) % (next.length - 1);
        const a = next[swapIdx];
        const b = next[swapIdx + 1];
        next[swapIdx] = { ...b, delta: 1 };
        next[swapIdx + 1] = { ...a, delta: -1 };
        return next.map((r, i) => ({ ...r, rank: i + 1 }));
      });
      setTick((t) => t + 1);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      {rows.map((r) => (
        <div
          key={`${r.handle}-${tick}-${r.rank}`}
          className={`flex items-center gap-3 py-3 ${r.isYou ? "bg-primary/5 -mx-2 px-2 rounded-lg" : ""} ${
            r.delta > 0 ? "row-rank-up" : ""
          }`}
        >
          <span className="font-mono w-7 text-muted-foreground text-sm">#{r.rank}</span>
          <Avatar
            name={r.isYou ? userName : r.name}
            color={r.isYou ? "oklch(0.89 0.21 128)" : "oklch(0.7 0.15 240)"}
            size="sm"
          />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate">
              {r.isYou ? userName : r.name}{" "}
              {r.isYou && <span className="text-primary text-[10px] font-mono uppercase tracking-wider">you</span>}
            </div>
            <div className="text-xs text-muted-foreground truncate">
              {GOAL_LABELS[r.goal]} · {r.weeklyCheckIns}/wk
            </div>
          </div>
          {r.delta > 0 ? (
            <span className="inline-flex items-center gap-0.5 text-[11px] font-mono font-semibold text-primary count-up">
              <TrendingUp className="h-3 w-3" /> {r.delta}
            </span>
          ) : r.delta < 0 ? (
            <span className="inline-flex items-center gap-0.5 text-[11px] font-mono font-semibold text-ember count-up">
              <TrendingDown className="h-3 w-3" /> {Math.abs(r.delta)}
            </span>
          ) : (
            <span className="inline-flex items-center text-[11px] font-mono text-muted-foreground">
              <Minus className="h-3 w-3" />
            </span>
          )}
          <div className="font-mono text-xs text-muted-foreground hidden sm:block">{r.verifiedPct}%</div>
          <span className="tag bg-ember/10 text-ember shrink-0">
            <Flame className="h-3 w-3" /> {r.streak}d
          </span>
        </div>
      ))}
    </>
  );
}

function CrewActivityFeed() {
  const { crew, checkIns } = useApp();
  // Compose a fabricated activity stream from crew members + recent your check-ins
  const items = [
    ...crew.slice(0, 4).map((c, i) => ({
      id: `crewact_${c.id}`,
      name: c.name,
      handle: c.handle,
      color: c.avatarColor,
      title:
        i % 3 === 0
          ? `Logged ${c.streak >= 7 ? "a heavy" : "a steady"} ${GOAL_LABELS[c.goal].toLowerCase()} session`
          : i % 3 === 1
            ? "Verified 2 Crew check-ins"
            : "Hit a new weekly target",
      meta: `${c.streak}d streak · trust ${c.trustScore}`,
      emoji: i % 3 === 0 ? "🏋️" : i % 3 === 1 ? "🛡️" : "🎯",
      when: `${(i + 1) * 27} min ago`,
    })),
    ...checkIns.slice(0, 2).map((ci) => ({
      id: `selfact_${ci.id}`,
      name: "You",
      handle: "you",
      color: "oklch(0.89 0.21 128)",
      title: ci.title ?? "Logged a session",
      meta: `RPE ${ci.effort} · ${ci.activityType}`,
      emoji: ci.proofEmoji ?? "✅",
      when: formatDistanceToNow(new Date(ci.date)) + " ago",
    })),
  ];
  return (
    <div className="card-elevated p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-mono text-xs uppercase tracking-wider text-primary">Crew activity</div>
          <div className="font-display font-bold text-lg mt-1">React to keep momentum visible</div>
        </div>
        <span className="tag bg-surface-2 text-muted-foreground">{items.length} updates</span>
      </div>
      <ul className="mt-4 divide-y divide-border">
        {items.map((it) => (
          <li key={it.id} className="py-3 flex items-start gap-3">
            <Avatar name={it.name} color={it.color} size="sm" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap text-sm">
                <span className="font-semibold truncate">{it.name}</span>
                <span className="text-xs text-muted-foreground">@{it.handle}</span>
                <span className="text-xs text-muted-foreground ml-auto">{it.when}</span>
              </div>
              <div className="mt-1 text-sm flex items-center gap-2">
                <span className="text-lg leading-none">{it.emoji}</span>
                <span className="truncate">{it.title}</span>
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">{it.meta}</div>
              <ReactionBar itemId={it.id} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}