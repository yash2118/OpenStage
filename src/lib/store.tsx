import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { seedCrew, seedLeaderboard, seedEvents, seedStrategies } from "./seed";

export type Goal =
  | "lose_weight"
  | "build_muscle"
  | "improve_strength"
  | "build_consistency"
  | "general_reset";

export type Visibility = "private" | "crew" | "public";

export interface UserProfile {
  name: string;
  email: string;
  handle: string;
  avatarColor: string;
  joinedAt: string;
}

export interface Onboarding {
  goals: Goal[];
  weeklyCommitment: number;
  experience: "new" | "returning" | "regular" | "advanced";
  eatingStyle: string;
  trainingDays: string[];
  trainingLocation: "home" | "gym" | "outdoor" | "mixed";
  heightCm: number;
  weightKg: number;
  goalWeightKg: number;
  privacyDefault: Visibility;
  accountabilityMode: "solo" | "crew" | "public";
  age?: number;
  gender?: "female" | "male" | "nonbinary" | "prefer_not";
  preferredTime?: "early" | "morning" | "midday" | "evening" | "night";
  sleepGoalHrs?: number;
  waterGoalL?: number;
  photoDataUrl?: string;
}

export interface FutureSelfMessage {
  text: string;
  mediaType: "text" | "voice" | "video";
  mediaDataUrl?: string;
  updatedAt: string;
}

export interface RecoveryLog {
  date: string; // YYYY-MM-DD
  sleep: number; // 1-5
  energy: number;
  mood: number;
  stress: number; // 1 calm - 5 wired
}

export interface HealthLog {
  date: string; // YYYY-MM-DD
  sleepHrs?: number;
  waterL?: number;
  steps?: number;
  calories?: number;
  proteinG?: number;
  weightKg?: number;
}

export interface BodyMetric {
  date: string; // YYYY-MM-DD
  weightKg?: number;
  waistCm?: number;
  chestCm?: number;
  armCm?: number;
  hipCm?: number;
  bodyFatPct?: number;
  note?: string;
}

export interface HabitStack {
  id: string;
  name: string;
  anchor: string;
  steps: string[];
  emoji: string;
  createdAt: string;
  completions: string[];
}

export interface WeeklyPlanSlot {
  day: number;
  title: string;
  type: "cardio" | "weights" | "lifestyle" | "sport" | "rest";
  time?: string;
}

export interface ReferralRecord {
  code: string;
  invited: { name: string; date: string; joined: boolean }[];
}

export interface MissionRecord {
  date: string; // YYYY-MM-DD
  missionId: string;
  completed: boolean;
}

export interface MomentumPoint {
  date: string; // YYYY-MM-DD
  score: number;
}

export interface MilestoneEvent {
  id: string;
  date: string;
  kind: "streak" | "verified" | "weight" | "event" | "level" | "checkin";
  title: string;
  detail?: string;
  emoji: string;
}

export interface CheckIn {
  id: string;
  date: string; // ISO
  activityType: "cardio" | "weights" | "lifestyle" | "sport";
  title: string;
  duration: number; // minutes
  effort: number; // 1-10
  note: string;
  proofLabel: string;
  proofEmoji: string;
  visibility: Visibility;
  verified: boolean;
  pendingVerifications: string[]; // crew ids requested
  approvals: string[]; // crew ids approved
  details?: Record<string, string | number>;
}

export interface CrewMember {
  id: string;
  name: string;
  handle: string;
  goal: Goal;
  streak: number;
  trustScore: number;
  avatarColor: string;
}

export interface PendingRequest {
  id: string;
  fromMemberId: string;
  activityTitle: string;
  activityType: CheckIn["activityType"];
  proofEmoji: string;
  proofLabel: string;
  note: string;
  effort: number;
  requestedAt: string;
}

interface State {
  user: UserProfile | null;
  onboarding: Onboarding | null;
  checkIns: CheckIn[];
  crew: CrewMember[];
  pending: PendingRequest[];
  trustScore: number;
  xp: number;
  questClaimedDate: string | null;
  futureSelf: FutureSelfMessage | null;
  recoveryLogs: RecoveryLog[];
  missions: MissionRecord[];
  protectionTokens: number;
  protectionsUsed: string[]; // dates protected
  verificationsGiven: number;
  momentumHistory: MomentumPoint[];
  milestones: MilestoneEvent[];
  healthLogs: HealthLog[];
  bodyMetrics: BodyMetric[];
  reactions: Record<string, Record<string, number>>;
  myReactions: Record<string, string[]>;
  habitStacks: HabitStack[];
  weeklyPlan: WeeklyPlanSlot[];
  referral: ReferralRecord;
}

interface Actions {
  signIn: (name: string, email: string) => void;
  signOut: () => void;
  completeOnboarding: (o: Onboarding) => void;
  addCheckIn: (c: Omit<CheckIn, "id" | "date" | "verified" | "approvals">) => CheckIn;
  approvePending: (id: string) => void;
  requestMoreProof: (id: string) => void;
  rejectPending: (id: string) => void;
  updateProfile: (patch: Partial<UserProfile>) => void;
  updatePrivacy: (v: Visibility) => void;
  claimDailyQuest: () => number;
  setFutureSelf: (m: FutureSelfMessage) => void;
  logRecovery: (r: Omit<RecoveryLog, "date">) => void;
  completeMission: (missionId: string) => number;
  useProtectionToken: () => boolean;
  addMilestone: (m: Omit<MilestoneEvent, "id">) => void;
  logHealth: (patch: Omit<HealthLog, "date">) => void;
  logBodyMetric: (patch: Omit<BodyMetric, "date">) => void;
  deleteBodyMetric: (date: string) => void;
  toggleReaction: (itemId: string, emoji: string) => void;
  addHabitStack: (h: Omit<HabitStack, "id" | "createdAt" | "completions">) => void;
  toggleHabitToday: (id: string) => void;
  deleteHabitStack: (id: string) => void;
  setWeeklyPlan: (slots: WeeklyPlanSlot[]) => void;
  inviteReferral: (name: string) => void;
  reset: () => void;
}

const Ctx = createContext<(State & Actions) | null>(null);

const STORAGE_KEY = "osg:v1";
const PROFILES_KEY = "osg:profiles";

export interface SavedProfile {
  name: string;
  email: string;
  avatarColor: string;
  lastSeen: string;
}

export function listSavedProfiles(): SavedProfile[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PROFILES_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedProfile[];
  } catch {
    return [];
  }
}

export function rememberProfile(p: SavedProfile) {
  if (typeof window === "undefined") return;
  const list = listSavedProfiles().filter((x) => x.email !== p.email);
  list.unshift(p);
  localStorage.setItem(PROFILES_KEY, JSON.stringify(list.slice(0, 5)));
}

export function forgetProfile(email: string) {
  if (typeof window === "undefined") return;
  const list = listSavedProfiles().filter((x) => x.email !== email);
  localStorage.setItem(PROFILES_KEY, JSON.stringify(list));
}

function loadState(): Partial<State> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Partial<State>;
  } catch {
    return {};
  }
}

function saveState(s: State) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

const initial: State = {
  user: null,
  onboarding: null,
  checkIns: [],
  crew: seedCrew,
  pending: [],
  trustScore: 72,
  xp: 240,
  questClaimedDate: null,
  futureSelf: null,
  recoveryLogs: [],
  missions: [],
  protectionTokens: 2,
  protectionsUsed: [],
  verificationsGiven: 0,
  momentumHistory: [],
  milestones: [],
  healthLogs: [],
  bodyMetrics: [],
  reactions: {},
  myReactions: {},
  habitStacks: [],
  weeklyPlan: [],
  referral: { code: "", invited: [] },
};

function freshPending(): PendingRequest[] {
  const now = Date.now();
  return [
    {
      id: "p1",
      fromMemberId: "c1",
      activityTitle: "Morning 5K run",
      activityType: "cardio",
      proofEmoji: "🏃‍♀️",
      proofLabel: "Selfie at the park entrance",
      note: "Negative split, felt strong on the last K.",
      effort: 7,
      requestedAt: new Date(now - 1000 * 60 * 22).toISOString(),
    },
    {
      id: "p2",
      fromMemberId: "c2",
      activityTitle: "Push day — Bench + OHP",
      activityType: "weights",
      proofEmoji: "🏋️",
      proofLabel: "Gym rack mirror selfie",
      note: "Bench 4x6 @70kg. New PR on last set.",
      effort: 9,
      requestedAt: new Date(now - 1000 * 60 * 58).toISOString(),
    },
    {
      id: "p3",
      fromMemberId: "c4",
      activityTitle: "Habit Loop — water + veg + walk",
      activityType: "lifestyle",
      proofEmoji: "🥗",
      proofLabel: "Plate photo + walking minutes",
      note: "3L water, 2 veg meals, 35 min evening walk.",
      effort: 5,
      requestedAt: new Date(now - 1000 * 60 * 60 * 3).toISOString(),
    },
  ];
}

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(initial);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const loaded = loadState();
    setState((s) => ({
      ...s,
      ...loaded,
      crew: loaded.crew ?? seedCrew,
      pending: loaded.pending ?? freshPending(),
      recoveryLogs: loaded.recoveryLogs ?? [],
      missions: loaded.missions ?? [],
      protectionTokens: loaded.protectionTokens ?? 2,
      protectionsUsed: loaded.protectionsUsed ?? [],
      verificationsGiven: loaded.verificationsGiven ?? 0,
      momentumHistory: loaded.momentumHistory ?? seedMomentumHistory(),
      milestones: loaded.milestones ?? [],
      futureSelf: loaded.futureSelf ?? null,
      healthLogs: loaded.healthLogs ?? [],
      bodyMetrics: loaded.bodyMetrics ?? [],
      reactions: loaded.reactions ?? {},
      myReactions: loaded.myReactions ?? {},
      habitStacks: loaded.habitStacks ?? [],
      weeklyPlan: loaded.weeklyPlan ?? defaultWeeklyPlan(),
      referral: loaded.referral ?? { code: makeReferralCode(), invited: [] },
    }));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveState(state);
  }, [state, hydrated]);

  function mutate(updater: (s: State) => State) {
    setState((s) => {
      const next = updater(s);
      saveState(next);
      return next;
    });
  }

  const value: State & Actions = {
    ...state,
    signIn: (name, email) => {
      const handle = name.toLowerCase().replace(/[^a-z0-9]+/g, "") || "athlete";
      const avatarColor = pickColor(name);
      mutate((s) => ({
        ...s,
        user: {
          name,
          email,
          handle,
          avatarColor,
          joinedAt: new Date().toISOString(),
        },
      }));
      rememberProfile({ name, email, avatarColor, lastSeen: new Date().toISOString() });
    },
    signOut: () => {
      localStorage.removeItem(STORAGE_KEY);
      setState(initial);
    },
    completeOnboarding: (o) => mutate((s) => ({ ...s, onboarding: o })),
    addCheckIn: (c) => {
      const ci: CheckIn = {
        ...c,
        id: `ci_${Date.now()}`,
        date: new Date().toISOString(),
        verified: false,
        approvals: [],
      };
      mutate((s) => ({ ...s, checkIns: [ci, ...s.checkIns] }));
      return ci;
    },
    approvePending: (id) =>
      mutate((s) => ({
        ...s,
        pending: s.pending.filter((p) => p.id !== id),
        trustScore: Math.min(100, s.trustScore + 2),
        xp: s.xp + 15,
        verificationsGiven: s.verificationsGiven + 1,
        protectionTokens: (s.verificationsGiven + 1) % 5 === 0 ? Math.min(5, s.protectionTokens + 1) : s.protectionTokens,
      })),
    requestMoreProof: (id) =>
      mutate((s) => ({
        ...s,
        pending: s.pending.filter((p) => p.id !== id),
      })),
    rejectPending: (id) =>
      mutate((s) => ({ ...s, pending: s.pending.filter((p) => p.id !== id) })),
    updateProfile: (patch) =>
      mutate((s) => ({ ...s, user: s.user ? { ...s.user, ...patch } : s.user })),
    updatePrivacy: (v) =>
      mutate((s) => ({
        ...s,
        onboarding: s.onboarding ? { ...s.onboarding, privacyDefault: v } : s.onboarding,
      })),
    claimDailyQuest: () => {
      const today = new Date().toISOString().slice(0, 10);
      let reward = 0;
      mutate((s) => {
        if (s.questClaimedDate === today) return s;
        reward = 50;
        return { ...s, questClaimedDate: today, xp: s.xp + reward };
      });
      return reward;
    },
    setFutureSelf: (m) => mutate((s) => ({ ...s, futureSelf: m })),
    logRecovery: (r) => {
      const date = new Date().toISOString().slice(0, 10);
      mutate((s) => ({
        ...s,
        recoveryLogs: [{ ...r, date }, ...s.recoveryLogs.filter((x) => x.date !== date)].slice(0, 60),
      }));
    },
    completeMission: (missionId) => {
      const date = new Date().toISOString().slice(0, 10);
      let reward = 0;
      mutate((s) => {
        if (s.missions.some((m) => m.date === date && m.completed)) return s;
        reward = 40;
        return {
          ...s,
          missions: [{ date, missionId, completed: true }, ...s.missions.filter((m) => m.date !== date)].slice(0, 120),
          xp: s.xp + reward,
        };
      });
      return reward;
    },
    useProtectionToken: () => {
      const today = new Date().toISOString().slice(0, 10);
      let ok = false;
      mutate((s) => {
        if (s.protectionTokens <= 0 || s.protectionsUsed.includes(today)) return s;
        ok = true;
        return { ...s, protectionTokens: s.protectionTokens - 1, protectionsUsed: [today, ...s.protectionsUsed] };
      });
      return ok;
    },
    addMilestone: (m) =>
      mutate((s) => ({
        ...s,
        milestones: [{ ...m, id: `m_${Date.now()}` }, ...s.milestones].slice(0, 60),
      })),
    logHealth: (patch) => {
      const date = new Date().toISOString().slice(0, 10);
      mutate((s) => {
        const existing = s.healthLogs.find((x) => x.date === date) ?? { date };
        const merged: HealthLog = { ...existing, ...patch, date };
        return {
          ...s,
          healthLogs: [merged, ...s.healthLogs.filter((x) => x.date !== date)].slice(0, 120),
        };
      });
    },
    logBodyMetric: (patch) => {
      const date = new Date().toISOString().slice(0, 10);
      mutate((s) => {
        const existing = s.bodyMetrics.find((x) => x.date === date) ?? { date };
        const merged: BodyMetric = { ...existing, ...patch, date };
        return {
          ...s,
          bodyMetrics: [merged, ...s.bodyMetrics.filter((x) => x.date !== date)]
            .sort((a, b) => (a.date < b.date ? 1 : -1))
            .slice(0, 365),
        };
      });
    },
    deleteBodyMetric: (date) =>
      mutate((s) => ({ ...s, bodyMetrics: s.bodyMetrics.filter((m) => m.date !== date) })),
    toggleReaction: (itemId, emoji) =>
      mutate((s) => {
        const mine = s.myReactions[itemId] ?? [];
        const has = mine.includes(emoji);
        const nextMine = has ? mine.filter((e) => e !== emoji) : [...mine, emoji];
        const counts = { ...(s.reactions[itemId] ?? {}) };
        counts[emoji] = Math.max(0, (counts[emoji] ?? 0) + (has ? -1 : 1));
        if (counts[emoji] === 0) delete counts[emoji];
        return {
          ...s,
          reactions: { ...s.reactions, [itemId]: counts },
          myReactions: { ...s.myReactions, [itemId]: nextMine },
          xp: has ? s.xp : s.xp + 1,
        };
      }),
    addHabitStack: (h) =>
      mutate((s) => ({
        ...s,
        habitStacks: [
          { ...h, id: `h_${Date.now()}`, createdAt: new Date().toISOString(), completions: [] },
          ...s.habitStacks,
        ].slice(0, 20),
      })),
    toggleHabitToday: (id) =>
      mutate((s) => {
        const today = new Date().toISOString().slice(0, 10);
        const wasDone = s.habitStacks.find((h) => h.id === id)?.completions.includes(today);
        return {
          ...s,
          habitStacks: s.habitStacks.map((h) =>
            h.id === id
              ? {
                  ...h,
                  completions: h.completions.includes(today)
                    ? h.completions.filter((d) => d !== today)
                    : [today, ...h.completions].slice(0, 365),
                }
              : h,
          ),
          xp: wasDone ? s.xp : s.xp + 5,
        };
      }),
    deleteHabitStack: (id) =>
      mutate((s) => ({ ...s, habitStacks: s.habitStacks.filter((h) => h.id !== id) })),
    setWeeklyPlan: (slots) => mutate((s) => ({ ...s, weeklyPlan: slots })),
    inviteReferral: (name) =>
      mutate((s) => ({
        ...s,
        referral: {
          code: s.referral.code || makeReferralCode(),
          invited: [
            { name, date: new Date().toISOString(), joined: false },
            ...s.referral.invited,
          ].slice(0, 50),
        },
        xp: s.xp + 10,
      })),
    reset: () => {
      localStorage.removeItem(STORAGE_KEY);
      setState({ ...initial, pending: freshPending() });
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp must be used inside AppStoreProvider");
  return ctx;
}

// Daily Quest — deterministic per day, rotates from a small pool
export interface DailyQuest {
  id: string;
  title: string;
  detail: string;
  emoji: string;
  reward: number;
}
const QUESTS: DailyQuest[] = [
  { id: "q1", title: "10-minute opener", detail: "Start any session within 10 min of your planned slot.", emoji: "⏱️", reward: 50 },
  { id: "q2", title: "Verify two", detail: "Verify two Crew check-ins before noon.", emoji: "🛡️", reward: 50 },
  { id: "q3", title: "Two anchor lifts", detail: "Run two compound anchors before accessories.", emoji: "🏋️", reward: 50 },
  { id: "q4", title: "Veg-first plate", detail: "Load vegetables first at one meal today.", emoji: "🥗", reward: 50 },
  { id: "q5", title: "Fast post", detail: "Post your check-in within 30 min of finishing.", emoji: "⚡", reward: 50 },
  { id: "q6", title: "Cohort shoutout", detail: "Send one cheer to a Crew member who hit a streak day.", emoji: "📣", reward: 50 },
  { id: "q7", title: "Sleep window", detail: "Lights-off by your target bedtime tonight.", emoji: "🌙", reward: 50 },
];
export function useDailyQuest(): DailyQuest {
  const day = new Date();
  const idx = (day.getFullYear() * 366 + day.getMonth() * 31 + day.getDate()) % QUESTS.length;
  return QUESTS[idx];
}
export function isQuestClaimedToday(claimedDate: string | null): boolean {
  return claimedDate === new Date().toISOString().slice(0, 10);
}

const COLORS = [
  "oklch(0.89 0.21 128)",
  "oklch(0.72 0.19 48)",
  "oklch(0.7 0.15 240)",
  "oklch(0.75 0.18 320)",
  "oklch(0.8 0.15 90)",
  "oklch(0.7 0.18 10)",
];
function pickColor(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return COLORS[h % COLORS.length];
}

// Derived helpers
export function useStreak() {
  const { checkIns } = useApp();
  return computeStreak(checkIns);
}

export function computeStreak(checkIns: CheckIn[]): number {
  if (checkIns.length === 0) return 0;
  const days = new Set(checkIns.map((c) => c.date.slice(0, 10)));
  let streak = 0;
  const d = new Date();
  for (let i = 0; i < 365; i++) {
    const key = d.toISOString().slice(0, 10);
    if (days.has(key)) streak++;
    else if (i > 0) break;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

export function weeklyProgress(checkIns: CheckIn[], target: number) {
  const now = new Date();
  const monday = new Date(now);
  const day = (now.getDay() + 6) % 7;
  monday.setDate(now.getDate() - day);
  monday.setHours(0, 0, 0, 0);
  const done = checkIns.filter((c) => new Date(c.date) >= monday).length;
  return { done, target, pct: Math.min(100, Math.round((done / Math.max(1, target)) * 100)) };
}

/* ===== Momentum Score (0-100) ===== */
export interface MomentumBreakdown {
  weekly: number; // out of 30
  verification: number; // out of 20
  consistency: number; // out of 25
  events: number; // out of 10
  accountability: number; // out of 15
}
export interface MomentumResult {
  score: number;
  delta: number;
  breakdown: MomentumBreakdown;
  level: { num: 1 | 2 | 3 | 4 | 5 | 6; name: string };
  improvements: { label: string; impact: number; to: string }[];
  changes: { reason: string; delta: number }[];
}

const LEVELS = [
  { num: 1 as const, name: "Started", min: 0 },
  { num: 2 as const, name: "Showing Up", min: 25 },
  { num: 3 as const, name: "Consistent", min: 45 },
  { num: 4 as const, name: "Reliable", min: 62 },
  { num: 5 as const, name: "Crew Leader", min: 78 },
  { num: 6 as const, name: "Unstoppable", min: 90 },
];

function pickLevel(score: number) {
  return [...LEVELS].reverse().find((l) => score >= l.min) ?? LEVELS[0];
}

export function computeMomentum(args: {
  checkIns: CheckIn[];
  weeklyTarget: number;
  verificationsGiven: number;
  eventsJoined?: number;
  prevHistory?: MomentumPoint[];
}): MomentumResult {
  const { checkIns, weeklyTarget, verificationsGiven, eventsJoined = 1, prevHistory = [] } = args;
  const weekly = weeklyProgress(checkIns, weeklyTarget);
  const weeklyPts = Math.round((weekly.done / Math.max(1, weeklyTarget)) * 30);
  const verifiedCount = checkIns.filter((c) => c.verified || c.approvals.length > 0).length;
  const verificationRate = checkIns.length === 0 ? 0.5 : verifiedCount / checkIns.length;
  const verifyPts = Math.round(verificationRate * 20);

  // 30-day consistency: count distinct days with activity in last 30
  const cutoff = Date.now() - 1000 * 60 * 60 * 24 * 30;
  const days = new Set(
    checkIns.filter((c) => new Date(c.date).getTime() >= cutoff).map((c) => c.date.slice(0, 10))
  );
  // forgiving: floor (no harsh penalty), curve favors any activity
  const consistencyPts = Math.min(25, Math.round(8 + (days.size / 12) * 17));

  const eventsPts = Math.min(10, eventsJoined * 5);
  const accountabilityPts = Math.min(15, 5 + verificationsGiven * 1.5);

  const breakdown: MomentumBreakdown = {
    weekly: Math.min(30, weeklyPts),
    verification: verifyPts,
    consistency: consistencyPts,
    events: eventsPts,
    accountability: Math.round(accountabilityPts),
  };
  const score = Math.max(
    8,
    Math.min(100, breakdown.weekly + breakdown.verification + breakdown.consistency + breakdown.events + breakdown.accountability)
  );
  const prev = prevHistory[prevHistory.length - 1]?.score ?? score - 3;
  const delta = score - prev;

  const improvements: { label: string; impact: number; to: string }[] = [];
  if (breakdown.weekly < 25) improvements.push({ label: "One more check-in this week", impact: Math.round((1 / weeklyTarget) * 30), to: "/check-in" });
  if (breakdown.verification < 18) improvements.push({ label: "Send to Crew within 30 min", impact: 4, to: "/check-in" });
  if (breakdown.accountability < 12) improvements.push({ label: "Verify one Crew check-in", impact: 2, to: "/community" });
  if (breakdown.events < 10) improvements.push({ label: "Join an event", impact: 5, to: "/events" });
  if (breakdown.consistency < 22) improvements.push({ label: "Log a light recovery day", impact: 3, to: "/recovery" });

  const changes: { reason: string; delta: number }[] = [];
  if (weekly.done > 0) changes.push({ reason: `${weekly.done} check-in${weekly.done === 1 ? "" : "s"} this week`, delta: breakdown.weekly });
  if (verifiedCount > 0) changes.push({ reason: `${verifiedCount} Crew-verified`, delta: breakdown.verification });
  if (verificationsGiven > 0) changes.push({ reason: `${verificationsGiven} verifications given`, delta: Math.round(breakdown.accountability - 5) });
  if (days.size > 0) changes.push({ reason: `Active ${days.size} of last 30 days`, delta: breakdown.consistency - 8 });

  return { score, delta, breakdown, level: pickLevel(score), improvements: improvements.slice(0, 3), changes };
}

function seedMomentumHistory(): MomentumPoint[] {
  const out: MomentumPoint[] = [];
  const base = 48;
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const wiggle = Math.sin(i / 2) * 6 + (13 - i) * 1.4;
    out.push({ date: d.toISOString().slice(0, 10), score: Math.max(20, Math.min(95, Math.round(base + wiggle))) });
  }
  return out;
}

/* ===== Trust tier ===== */
export type TrustTier = "Rookie" | "Reliable" | "Consistent" | "Elite Accountability Partner";
export function trustTier(score: number): { name: TrustTier; min: number; max: number; tone: string } {
  if (score >= 91) return { name: "Elite Accountability Partner", min: 91, max: 100, tone: "ember" };
  if (score >= 76) return { name: "Consistent", min: 76, max: 90, tone: "primary" };
  if (score >= 51) return { name: "Reliable", min: 51, max: 75, tone: "primary" };
  return { name: "Rookie", min: 0, max: 50, tone: "muted" };
}

/* ===== Daily Mission (rotates by goal + day) ===== */
export interface DailyMission {
  id: string;
  title: string;
  detail: string;
  emoji: string;
  reward: number;
}
const MISSION_POOL: DailyMission[] = [
  { id: "walk20", title: "Walk 20 minutes", detail: "Outdoors counts double for mood.", emoji: "🚶", reward: 40 },
  { id: "water", title: "Drink 2L water", detail: "A glass every two hours wins the day.", emoji: "💧", reward: 40 },
  { id: "stretch", title: "Stretch for 10 minutes", detail: "Hips, hamstrings, thoracic. Slow breaths.", emoji: "🧘", reward: 40 },
  { id: "verify", title: "Verify one Crew member", detail: "Honest, kind, fast. +2 trust each.", emoji: "🛡️", reward: 50 },
  { id: "workout", title: "Complete one workout", detail: "Anything 20+ min counts.", emoji: "🏋️", reward: 60 },
  { id: "sleep", title: "Lights out by 11pm", detail: "Recovery is built tonight.", emoji: "🌙", reward: 40 },
  { id: "protein", title: "Hit a protein anchor", detail: "1g per kg bodyweight as a floor.", emoji: "🍳", reward: 40 },
];
export function useDailyMission(goalKey?: string): DailyMission {
  const day = new Date();
  const seed = day.getFullYear() * 366 + day.getMonth() * 31 + day.getDate() + (goalKey?.length ?? 0);
  return MISSION_POOL[seed % MISSION_POOL.length];
}

export { seedLeaderboard, seedEvents, seedStrategies };

function makeReferralCode(): string {
  const a = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i++) out += a[Math.floor(Math.random() * a.length)];
  return out;
}

function defaultWeeklyPlan(): WeeklyPlanSlot[] {
  return [
    { day: 0, title: "Push session", type: "weights", time: "07:00" },
    { day: 1, title: "Easy run", type: "cardio", time: "07:30" },
    { day: 2, title: "Pull session", type: "weights", time: "07:00" },
    { day: 3, title: "Mobility + walk", type: "lifestyle", time: "18:00" },
    { day: 4, title: "Lower body", type: "weights", time: "07:00" },
    { day: 5, title: "Long effort", type: "cardio", time: "09:00" },
    { day: 6, title: "Rest & recover", type: "rest" },
  ];
}