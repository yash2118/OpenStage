import type { CrewMember, Goal } from "./store";

export const seedCrew: CrewMember[] = [
  { id: "c1", name: "Maya Okafor", handle: "mayaruns", goal: "build_consistency", streak: 14, trustScore: 92, avatarColor: "oklch(0.89 0.21 128)" },
  { id: "c2", name: "Diego Martín", handle: "diegolifts", goal: "build_muscle", streak: 22, trustScore: 88, avatarColor: "oklch(0.72 0.19 48)" },
  { id: "c3", name: "Priya Shah", handle: "priyaflow", goal: "lose_weight", streak: 9, trustScore: 81, avatarColor: "oklch(0.75 0.18 320)" },
  { id: "c4", name: "Sam Carter", handle: "samhabits", goal: "general_reset", streak: 31, trustScore: 95, avatarColor: "oklch(0.7 0.15 240)" },
  { id: "c5", name: "Lena Park", handle: "lenastrong", goal: "improve_strength", streak: 17, trustScore: 86, avatarColor: "oklch(0.8 0.15 90)" },
];

export interface LeaderRow {
  rank: number;
  name: string;
  handle: string;
  weeklyCheckIns: number;
  streak: number;
  verifiedPct: number;
  goal: Goal;
  isYou?: boolean;
}

export const seedLeaderboard: LeaderRow[] = [
  { rank: 1, name: "Maya Okafor", handle: "mayaruns", weeklyCheckIns: 6, streak: 14, verifiedPct: 100, goal: "build_consistency" },
  { rank: 2, name: "Sam Carter", handle: "samhabits", weeklyCheckIns: 6, streak: 31, verifiedPct: 100, goal: "general_reset" },
  { rank: 3, name: "Lena Park", handle: "lenastrong", weeklyCheckIns: 5, streak: 17, verifiedPct: 96, goal: "improve_strength" },
  { rank: 4, name: "Diego Martín", handle: "diegolifts", weeklyCheckIns: 5, streak: 22, verifiedPct: 91, goal: "build_muscle" },
  { rank: 5, name: "Priya Shah", handle: "priyaflow", weeklyCheckIns: 4, streak: 9, verifiedPct: 88, goal: "lose_weight" },
  { rank: 6, name: "Jordan Hale", handle: "jhale", weeklyCheckIns: 4, streak: 6, verifiedPct: 82, goal: "build_consistency" },
  { rank: 7, name: "Aiko Tanaka", handle: "aikolift", weeklyCheckIns: 4, streak: 11, verifiedPct: 78, goal: "build_muscle" },
  { rank: 8, name: "Noah Bishop", handle: "noahruns", weeklyCheckIns: 3, streak: 4, verifiedPct: 72, goal: "lose_weight" },
];

export interface EventInfo {
  id: string;
  name: string;
  category: "Cardio" | "Weight Training" | "Lifestyle" | "Sports";
  tagline: string;
  description: string;
  metric: string;
  participants: number;
  endsInHours: number;
  emoji: string;
}

export const seedEvents: EventInfo[] = [
  {
    id: "step-into-it",
    name: "Step Into It Challenge",
    category: "Cardio",
    tagline: "Movement that adds up.",
    description: "Log walking minutes or steps every day. Crew-verified streaks unlock the weekly badge.",
    metric: "Movement minutes",
    participants: 1247,
    endsInHours: 52,
    emoji: "👟",
  },
  {
    id: "form-foundation",
    name: "Form & Foundation League",
    category: "Weight Training",
    tagline: "Earn the rep. Earn the rank.",
    description: "Squat, hinge, push, pull. Log sets, reps, and form rating. Verification weighs form, not weight.",
    metric: "Quality sets",
    participants: 832,
    endsInHours: 76,
    emoji: "🏋️",
  },
  {
    id: "habit-loop",
    name: "Habit Loop Showdown",
    category: "Lifestyle",
    tagline: "Win the boring stuff.",
    description: "Water, vegetables, sleep, walk. Daily check-ins compound across the week.",
    metric: "Habit completion",
    participants: 1601,
    endsInHours: 41,
    emoji: "🥗",
  },
  {
    id: "playbook",
    name: "Playbook Performance Tracker",
    category: "Sports",
    tagline: "Play the game. Log the game.",
    description: "Log session type, drills, benchmark and result. Sport-specific cohorts compare fairly.",
    metric: "Benchmark progress",
    participants: 419,
    endsInHours: 68,
    emoji: "⚽",
  },
];

export interface Strategy {
  id: string;
  title: string;
  pattern: string;
  source: string;
  cohortPct: number;
  body: string;
  tag: string;
}

export const seedStrategies: Strategy[] = [
  {
    id: "s1",
    title: "Lock in the first 10 minutes",
    pattern: "Schedule pattern",
    source: "Top 20% in your cohort",
    cohortPct: 73,
    body: "People hitting weekly targets start training within 10 minutes of their planned slot. They don't negotiate the start, only the length.",
    tag: "Consistency",
  },
  {
    id: "s2",
    title: "Two anchor lifts per session",
    pattern: "Workout pattern",
    source: "Build-muscle cohort",
    cohortPct: 61,
    body: "Lifters making the fastest verified strength gains run two compound anchors first, then accessories. They stop early on bad-form days.",
    tag: "Programming",
  },
  {
    id: "s3",
    title: "Veg-first plate, twice a day",
    pattern: "Nutrition pattern",
    source: "Lose-weight cohort",
    cohortPct: 68,
    body: "Members down >2kg in 8 weeks load veg first at two meals daily, then protein, then carbs. No calorie counting required to start.",
    tag: "Nutrition",
  },
  {
    id: "s4",
    title: "Crew within 30 minutes",
    pattern: "Accountability pattern",
    source: "All cohorts",
    cohortPct: 84,
    body: "Check-ins sent to Crew within 30 minutes of finishing are verified 3x more often. Speed compounds trust.",
    tag: "Crew",
  },
];

export const GOAL_LABELS: Record<Goal, string> = {
  lose_weight: "Lose weight",
  build_muscle: "Build muscle",
  improve_strength: "Improve strength",
  build_consistency: "Build consistency",
  general_reset: "General reset",
};