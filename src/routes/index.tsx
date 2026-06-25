import { createFileRoute, Link } from "@tanstack/react-router";
import { Logo } from "@/components/AppShell";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  Flame,
  Play,
  Sparkles,
  Brain,
  TrendingUp,
  ChevronDown,
  Star,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "OpenStage Gym — Accountability-first online gym" },
      {
        name: "description",
        content:
          "Commit, check in, get Crew Verified, see where you rank. Small steps. Consistent habits. Real progress.",
      },
      { property: "og:title", content: "OpenStage Gym" },
      {
        property: "og:description",
        content: "An accountability-first online gym where progress becomes visible.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-border bg-background/70 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 md:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Logo />
            <span className="font-display font-bold tracking-tight text-lg">OpenStage</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#loop" className="hover:text-foreground">How it works</a>
            <a href="#momentum" className="hover:text-foreground">Momentum</a>
            <a href="#events" className="hover:text-foreground">Events</a>
            <a href="#crew" className="hover:text-foreground">The Crew</a>
            <a href="#faq" className="hover:text-foreground">FAQ</a>
            <a href="#pricing" className="hover:text-foreground">Pricing</a>
          </nav>
          <div className="flex items-center gap-2">
            <span className="hidden md:inline-flex"><ThemeToggle size="sm" /></span>
            <span className="md:hidden"><ThemeToggle size="sm" variant="cycle" /></span>
            <Link to="/auth" className="hidden sm:inline text-sm text-muted-foreground hover:text-foreground px-3 py-2">
              Log in
            </Link>
            <Link
              to="/auth"
              className="inline-flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground px-3.5 py-2 text-[13px] sm:text-sm font-semibold hover:opacity-90"
            >
              <span className="hidden xs:inline sm:inline">Start free trial</span>
              <span className="sm:hidden">Start</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-dot-bg opacity-40 pointer-events-none" />
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
        <div className="absolute top-40 -left-32 h-80 w-80 rounded-full bg-ember/30 blur-3xl pointer-events-none" />
        <div className="mx-auto max-w-6xl px-4 md:px-8 pt-16 md:pt-24 pb-16 md:pb-28 relative">
          <span className="tag bg-primary/10 text-primary border border-primary/20">
            <Flame className="h-3 w-3" /> Accountability-first online gym
          </span>
          <h1 className="mt-6 font-display font-bold text-5xl md:text-7xl leading-[0.95] tracking-tight max-w-4xl">
            Your workouts should <span className="text-primary">count somewhere</span>.
          </h1>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl">
            Stay accountable. Build consistency. See real progress. OpenStage is the
            accountability-first online gym where every check-in is verified by your crew
            and every week leaves a trace.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-6 py-3 text-base font-semibold hover:opacity-90 shadow-[0_8px_32px_-8px_var(--color-primary)]"
            >
              Start free trial <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/today"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-background/60 backdrop-blur px-6 py-3 text-base font-semibold hover:bg-surface-2"
            >
              Explore demo
            </Link>
            <a
              href="#tour"
              className="inline-flex items-center gap-2 rounded-full px-4 py-3 text-base font-semibold text-muted-foreground hover:text-foreground"
            >
              <Play className="h-4 w-4" /> Watch product tour
            </a>
          </div>
          <div className="mt-3 text-xs text-muted-foreground">First week free · Cancel anytime · No credit card</div>

          <HeroCarousel />

          <LiveMetrics />
        </div>
      </section>

      <PhoneShowcase />
      <HowItWorks />
      <MomentumSection />
      <HealthSection />
      <CoachSection />
      <PassportSection />
      <Testimonials />

      <section id="loop" className="border-t border-border bg-surface/40">
        <div className="mx-auto max-w-6xl px-4 md:px-8 py-16 md:py-24">
          <SectionLabel>The product loop</SectionLabel>
          <h2 className="font-display font-bold text-3xl md:text-5xl mt-3 max-w-2xl">
            Five steps. Repeat weekly. Nothing wasted.
          </h2>
          <div className="mt-10 grid md:grid-cols-5 gap-4">
            {LOOP.map((l, i) => (
              <div key={l.title} className="card-elevated p-5 relative">
                <div className="font-mono text-xs text-primary">0{i + 1}</div>
                <div className="mt-3 font-display font-bold text-lg">{l.title}</div>
                <p className="mt-2 text-sm text-muted-foreground">{l.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="crew" className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 md:px-8 py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-10 items-start">
            <div>
              <SectionLabel>Check-In Crew</SectionLabel>
              <h2 className="font-display font-bold text-3xl md:text-5xl mt-3">
                Self-reported is not progress.<br />
                <span className="text-primary">Crew Verified is.</span>
              </h2>
              <p className="mt-4 text-muted-foreground text-lg max-w-md">
                Your Crew is a small group of users with similar goals. They verify your
                check-ins and you verify theirs. Trust score and ranking confidence come from there.
              </p>
              <ul className="mt-6 space-y-3 text-sm">
                {[
                  "Send a check-in to Crew in two taps",
                  "Crew can verify, ask for more proof, or pass",
                  "Trust score grows when you verify well",
                  "Privacy is per check-in: private, Crew, or public",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-3">
                    <ShieldCheck className="h-4 w-4 mt-0.5 text-primary" /> {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="card-elevated p-6">
              <div className="flex items-center justify-between">
                <span className="tag bg-primary/10 text-primary">Pending verification</span>
                <span className="font-mono text-xs text-muted-foreground">22m ago</span>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-ember grid place-items-center text-2xl">🏃‍♀️</div>
                <div>
                  <div className="font-display font-bold text-lg leading-tight">Morning 5K run</div>
                  <div className="text-xs text-muted-foreground">Maya · @mayaruns · cardio</div>
                </div>
              </div>
              <div className="mt-4 rounded-lg bg-surface-2 p-3 text-sm">
                <div className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Proof</div>
                <div>Selfie at the park entrance · Negative split, felt strong on the last K.</div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <FakeBtn label="Verify" tone="primary" />
                <FakeBtn label="More proof" />
                <FakeBtn label="Pass" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="events" className="border-t border-border bg-surface/40">
        <div className="mx-auto max-w-6xl px-4 md:px-8 py-16 md:py-24">
          <SectionLabel>Weekly gym events</SectionLabel>
          <h2 className="font-display font-bold text-3xl md:text-5xl mt-3 max-w-2xl">
            Compete with people <span className="text-primary">like you</span>. Not the internet.
          </h2>
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {EVENTS.map((e) => (
              <div key={e.name} className="card-elevated p-5">
                <div className="text-3xl">{e.emoji}</div>
                <div className="mt-3 font-display font-bold text-lg leading-tight">{e.name}</div>
                <div className="text-xs text-muted-foreground mt-1">{e.category}</div>
                <p className="text-sm text-muted-foreground mt-3">{e.tagline}</p>
              </div>
            ))}
          </div>

          <div className="mt-10">
            <div className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">
              Live across the gym right now
            </div>
            <EventsMarquee />
          </div>
        </div>
      </section>

      <section id="pricing" className="border-t border-border">
        <div className="mx-auto max-w-3xl px-4 md:px-8 py-16 md:py-24 text-center">
          <SectionLabel className="justify-center">Pricing</SectionLabel>
          <h2 className="font-display font-bold text-3xl md:text-5xl mt-3">One plan. First week free.</h2>
          <div className="mt-10 card-elevated p-8 text-left">
            <div className="flex items-baseline gap-2">
              <span className="font-display font-bold text-5xl">$12</span>
              <span className="text-muted-foreground">/ month</span>
            </div>
            <div className="mt-1 text-sm text-muted-foreground">First 7 days free. Cancel anytime.</div>
            <ul className="mt-6 space-y-3 text-sm">
              {[
                "Unlimited check-ins and Crew verifications",
                "Cohort, event, and global leaderboards",
                "Public Passport you actually control",
                "Assistant guidance grounded in your context",
              ].map((t) => (
                <li key={t} className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-primary" /> {t}
                </li>
              ))}
            </ul>
            <Link
              to="/auth"
              className="mt-8 inline-flex items-center justify-center w-full gap-2 rounded-full bg-primary text-primary-foreground px-6 py-3 font-semibold hover:opacity-90"
            >
              Start your free trial <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <FAQSection />

      <footer className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 md:px-8 py-8 flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Logo /> <span className="font-display font-bold text-foreground">OpenStage Gym</span>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <a href="#loop" className="hover:text-foreground">How it works</a>
            <a href="#pricing" className="hover:text-foreground">Pricing</a>
            <a href="#faq" className="hover:text-foreground">FAQ</a>
            <Link to="/auth" className="hover:text-foreground">Log in</Link>
          </div>
          <div className="font-mono text-xs">Small steps. Consistent habits. Real progress.</div>
        </div>
      </footer>
    </div>
  );
}

function SectionLabel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <span className="h-px w-8 bg-primary" />
      <span className="font-mono text-xs uppercase tracking-[0.2em] text-primary">{children}</span>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="card-elevated p-4">
      <div className="font-display font-bold text-2xl md:text-3xl">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

function FakeBtn({ label, tone }: { label: string; tone?: "primary" }) {
  return (
    <div
      className={`text-center text-xs font-semibold py-2 rounded-md border ${
        tone === "primary"
          ? "bg-primary text-primary-foreground border-transparent"
          : "border-border text-muted-foreground"
      }`}
    >
      {label}
    </div>
  );
}

const LOOP = [
  { title: "Commit", body: "Choose your goal, weekly frequency, and Crew." },
  { title: "Check in", body: "30 seconds: what, how hard, proof. Done." },
  { title: "Get verified", body: "Crew confirms — or asks for more proof." },
  { title: "Compare fairly", body: "Rank against people with your goal & frequency." },
  { title: "Learn", body: "See what's working for people like you." },
];

const EVENTS = [
  { name: "Step Into It Challenge", category: "Cardio", tagline: "Movement that adds up.", emoji: "👟" },
  { name: "Form & Foundation League", category: "Weight training", tagline: "Earn the rep. Earn the rank.", emoji: "🏋️" },
  { name: "Habit Loop Showdown", category: "Lifestyle", tagline: "Win the boring stuff.", emoji: "🥗" },
  { name: "Playbook Performance", category: "Sports", tagline: "Play the game. Log the game.", emoji: "⚽" },
];

const SLIDES = [
  {
    tag: "Verified by Crew",
    title: "Maya · Morning 5K",
    body: "Negative split. Felt strong on the last K.",
    emoji: "🏃‍♀️",
    meta: "RPE 7 · 28:14 · cardio",
  },
  {
    tag: "Streak +1",
    title: "Jordan · Push day",
    body: "Bench 4×6 @72.5kg. Bar speed felt sharp.",
    emoji: "🏋️",
    meta: "RPE 8 · 52 min · weights",
  },
  {
    tag: "Habit win",
    title: "Sana · Water · Veg · Walk",
    body: "All three, three days running. Quiet wins.",
    emoji: "🥗",
    meta: "lifestyle · daily",
  },
  {
    tag: "Match logged",
    title: "Devon · 3v3 pickup",
    body: "Held the press the whole second half.",
    emoji: "⚽",
    meta: "RPE 9 · 60 min · sport",
  },
];

function HeroCarousel() {
  const [i, setI] = useState(0);
  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (reduced) return;
    const id = window.setInterval(() => setI((x) => (x + 1) % SLIDES.length), 3800);
    return () => window.clearInterval(id);
  }, [reduced]);

  return (
    <div className="mt-12 grid md:grid-cols-[1.1fr_0.9fr] gap-4">
      <div className="card-elevated p-6 relative overflow-hidden min-h-[260px]">
        <div className="absolute inset-x-0 top-0 h-1 bg-surface-2">
          <div
            key={i}
            className="h-full progress-live"
            style={{ width: "100%", animation: reduced ? undefined : "os-shimmer 2.2s linear infinite" }}
          />
        </div>
        {SLIDES.map((s, idx) =>
          idx === i ? (
            <div key={idx} className="step-enter">
              <div className="flex items-center justify-between">
                <span className="tag bg-primary/15 text-primary border border-primary/25">
                  {s.tag}
                </span>
                <span className="font-mono text-xs text-muted-foreground">
                  {String(idx + 1).padStart(2, "0")} / {String(SLIDES.length).padStart(2, "0")}
                </span>
              </div>
              <div className="mt-5 flex items-start gap-4">
                <div className="h-14 w-14 rounded-2xl bg-surface-2 grid place-items-center text-3xl pop-in">
                  {s.emoji}
                </div>
                <div className="min-w-0">
                  <div className="font-display font-bold text-2xl md:text-3xl leading-tight">
                    {s.title}
                  </div>
                  <div className="text-xs font-mono text-muted-foreground mt-1">{s.meta}</div>
                </div>
              </div>
              <p className="mt-5 text-base text-muted-foreground max-w-md">{s.body}</p>
              <div className="mt-5 flex items-center gap-2">
                {SLIDES.map((_, dotI) => (
                  <button
                    type="button"
                    key={dotI}
                    onClick={() => setI(dotI)}
                    aria-label={`Show slide ${dotI + 1}`}
                    className={`h-1.5 rounded-full transition-all ${
                      dotI === i ? "w-8 bg-primary" : "w-3 bg-surface-2 hover:bg-border"
                    }`}
                  />
                ))}
              </div>
            </div>
          ) : null
        )}
      </div>

      <div className="card-elevated p-5 grid grid-cols-2 gap-3">
        {EVENTS.map((e) => (
          <div
            key={e.name}
            className="rounded-xl bg-surface-2/60 border border-border p-3 hover-lift"
          >
            <div className="text-2xl">{e.emoji}</div>
            <div className="mt-1 font-display font-bold text-sm leading-tight">{e.name}</div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-primary mt-1">
              {e.category}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EventsMarquee() {
  const items = [
    "🏃 Maya logged a 5K · Crew verified",
    "🏋️ Jordan hit a Bench PR · +2.5kg",
    "🥗 Sana · 3-day habit streak",
    "⚽ Devon · 60 min pickup logged",
    "🚴 Priya · 32km ride · RPE 8",
    "🧗 Theo · Bouldering · 4 sends",
    "🏊 Lena · 1500m swim · steady",
    "🥋 Sam · BJJ practice · 75 min",
  ];
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-surface/60 py-3">
      <div className="flex gap-4 whitespace-nowrap marquee w-max">
        {[...items, ...items].map((t, idx) => (
          <span
            key={idx}
            className="font-mono text-xs px-3 py-1.5 rounded-full bg-background/60 border border-border text-muted-foreground"
          >
            {t}
          </span>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-background to-transparent" />
    </div>
  );
}

/* ============== New marketing sections ============== */

function useCountUp(target: number, duration = 1600) {
  const [n, setN] = useState(0);
  const ref = useRef<HTMLDivElement | null>(null);
  const started = useRef(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting && !started.current) {
          started.current = true;
          if (reduced) { setN(target); return; }
          const start = performance.now();
          const tick = (t: number) => {
            const p = Math.min(1, (t - start) / duration);
            const eased = 1 - Math.pow(1 - p, 3);
            setN(Math.round(target * eased));
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      });
    }, { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, [target, duration]);
  return { ref, n };
}

function MetricCard({ value, suffix, label, hint }: { value: number; suffix?: string; label: string; hint?: string }) {
  const { ref, n } = useCountUp(value);
  return (
    <div ref={ref} className="card-elevated p-5">
      <div className="font-display font-bold text-3xl md:text-4xl tabular-nums">
        {n.toLocaleString()}{suffix}
      </div>
      <div className="text-xs uppercase tracking-wider text-primary mt-2 font-mono">{label}</div>
      {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
    </div>
  );
}

function LiveMetrics() {
  return (
    <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
      <MetricCard value={48213} label="Weekly check-ins" hint="across the gym this week" />
      <MetricCard value={92} suffix="%" label="Crew verified" hint="within 30 minutes" />
      <MetricCard value={74} label="Avg momentum" hint="0–100 score" />
      <MetricCard value={14} label="Median streak" hint="active days in a row" />
    </div>
  );
}

function PhoneShowcase() {
  const screens = [
    { tag: "Today", title: "Mission · Walk 20 min", body: "Momentum 78 · 3 missions left", emoji: "🎯" },
    { tag: "Check-In", title: "Step 4 of 10 · Effort", body: "RPE 7 · feeling sharp", emoji: "💪" },
    { tag: "Crew", title: "Maya needs verification", body: "5K run · 22m ago", emoji: "🏃‍♀️" },
    { tag: "Rank", title: "You moved up 3 spots", body: "Beginner · 4×/week cohort", emoji: "📈" },
  ];
  const [i, setI] = useState(0);
  useEffect(() => {
    const reduced = typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    const id = window.setInterval(() => setI((x) => (x + 1) % screens.length), 2400);
    return () => window.clearInterval(id);
  }, [screens.length]);
  const s = screens[i];
  return (
    <section id="tour" className="border-t border-border bg-surface/30">
      <div className="mx-auto max-w-6xl px-4 md:px-8 py-16 md:py-24 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <SectionLabel>Product tour</SectionLabel>
          <h2 className="font-display font-bold text-3xl md:text-5xl mt-3">
            A daily loop that <span className="text-primary">earns the open</span>.
          </h2>
          <p className="mt-4 text-muted-foreground text-lg max-w-md">
            One mission. One check-in. One verified rep of consistency. OpenStage
            replaces endless scrolling with the smallest meaningful action you can
            take today.
          </p>
          <ul className="mt-6 space-y-3 text-sm">
            {[
              ["🎯", "Daily mission you can actually finish"],
              ["🤝", "Crew verification in two taps"],
              ["📊", "Momentum score that rewards consistency"],
              ["🛡", "Streak Shield protects bad days"],
            ].map(([e, t]) => (
              <li key={t} className="flex items-start gap-3">
                <span className="text-lg">{e}</span><span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex justify-center">
          <div className="relative w-[280px] h-[560px] rounded-[44px] border-[10px] border-foreground/90 bg-background shadow-2xl overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-6 bg-foreground/90 z-10" />
            <div className="absolute top-1 left-1/2 -translate-x-1/2 h-4 w-24 rounded-full bg-foreground z-20" />
            <div className="absolute inset-0 pt-8 px-4 pb-4 flex flex-col gap-3 bg-gradient-to-b from-background to-surface">
              <div className="flex items-center justify-between">
                <span className="tag bg-primary/15 text-primary border border-primary/25">{s.tag}</span>
                <span className="font-mono text-[10px] text-muted-foreground">{String(i+1).padStart(2,"0")}/{String(screens.length).padStart(2,"0")}</span>
              </div>
              <div key={i} className="step-enter card-elevated p-4 flex-1">
                <div className="text-4xl">{s.emoji}</div>
                <div className="mt-3 font-display font-bold text-xl leading-tight">{s.title}</div>
                <div className="mt-1 text-xs text-muted-foreground">{s.body}</div>
                <div className="mt-4 h-2 rounded-full bg-surface-2 overflow-hidden">
                  <div className="h-full bg-primary progress-live" style={{ width: `${(i+1)*22}%` }} />
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {["XP +20","🔥 streak","Verified"].map((t) => (
                    <div key={t} className="text-[10px] text-center py-1.5 rounded-md bg-surface-2 text-muted-foreground">{t}</div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-5 gap-1 pt-1">
                {["Today","Crew","Check","Rank","Me"].map((t, idx) => (
                  <div key={t} className={`text-[9px] text-center py-1.5 rounded-md ${idx === i % 5 ? "bg-primary/15 text-primary" : "text-muted-foreground"}`}>{t}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { icon: Sparkles, title: "Commit your goal", body: "Pick a goal, frequency, and your Crew during onboarding." },
    { icon: CheckCircle2, title: "Check in daily", body: "30-second wizard. Activity, effort, proof, done." },
    { icon: ShieldCheck, title: "Get Crew Verified", body: "Real humans confirm. Trust score grows over time." },
    { icon: TrendingUp, title: "Watch momentum rise", body: "Score, rank, and streak update live." },
  ];
  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-6xl px-4 md:px-8 py-16 md:py-24">
        <SectionLabel>How it works</SectionLabel>
        <h2 className="font-display font-bold text-3xl md:text-5xl mt-3 max-w-2xl">
          Four steps. One <span className="text-primary">honest gym</span>.
        </h2>
        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {steps.map((s, i) => (
            <div key={s.title} className="card-elevated p-6 hover-lift">
              <div className="h-10 w-10 rounded-xl bg-primary/15 text-primary grid place-items-center">
                <s.icon className="h-5 w-5" />
              </div>
              <div className="mt-4 font-mono text-xs text-muted-foreground">STEP 0{i+1}</div>
              <div className="mt-1 font-display font-bold text-lg">{s.title}</div>
              <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function MomentumSection() {
  return (
    <section id="momentum" className="border-t border-border bg-surface/40">
      <div className="mx-auto max-w-6xl px-4 md:px-8 py-16 md:py-24 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <SectionLabel>Momentum Score</SectionLabel>
          <h2 className="font-display font-bold text-3xl md:text-5xl mt-3">
            Streaks are fragile. <span className="text-primary">Momentum isn't.</span>
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            A 0–100 score that blends consistency, verification, health, missions, and
            crew activity. Miss a day? You won't lose everything. Show up tomorrow and
            momentum rebuilds.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
            {["Workout consistency","Crew verification","Health tracking","Mission completion","Event participation","Helping crew"].map((t) => (
              <div key={t} className="flex items-center gap-2"><Zap className="h-3.5 w-3.5 text-primary"/>{t}</div>
            ))}
          </div>
        </div>
        <div className="card-elevated p-8 flex items-center justify-center">
          <MomentumRing value={78} />
        </div>
      </div>
    </section>
  );
}

function MomentumRing({ value }: { value: number }) {
  const r = 80, c = 2 * Math.PI * r;
  const { ref, n } = useCountUp(value, 1400);
  const dash = (n / 100) * c;
  return (
    <div ref={ref} className="relative">
      <svg width="220" height="220" className="-rotate-90">
        <circle cx="110" cy="110" r={r} stroke="var(--color-surface-2)" strokeWidth="14" fill="none" />
        <circle cx="110" cy="110" r={r} stroke="var(--color-primary)" strokeWidth="14" fill="none"
          strokeDasharray={`${dash} ${c}`} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="font-display font-bold text-5xl tabular-nums">{n}</div>
          <div className="text-xs text-muted-foreground font-mono uppercase tracking-wider">Momentum</div>
          <div className="text-xs text-primary mt-1">+6 this week</div>
        </div>
      </div>
    </div>
  );
}

function HealthSection() {
  const metrics = [
    { label: "Sleep", value: "7h 42m", icon: "💤" },
    { label: "Water", value: "2.1 / 3 L", icon: "💧" },
    { label: "Steps", value: "9,418", icon: "👟" },
    { label: "Protein", value: "112 g", icon: "🍗" },
    { label: "Mood", value: "😊 7/10", icon: "🧠" },
    { label: "Recovery", value: "82%", icon: "🛌" },
  ];
  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-6xl px-4 md:px-8 py-16 md:py-24 grid md:grid-cols-2 gap-12 items-center">
        <div className="grid grid-cols-2 gap-3 order-2 md:order-1">
          {metrics.map((m) => (
            <div key={m.label} className="card-elevated p-4 hover-lift">
              <div className="text-2xl">{m.icon}</div>
              <div className="mt-3 font-display font-bold text-xl">{m.value}</div>
              <div className="text-xs text-muted-foreground">{m.label}</div>
            </div>
          ))}
        </div>
        <div className="order-1 md:order-2">
          <SectionLabel>Health tracking</SectionLabel>
          <h2 className="font-display font-bold text-3xl md:text-5xl mt-3">
            Train hard. <span className="text-primary">Recover smarter.</span>
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            Log sleep, water, steps, protein, mood, stress, and energy in seconds. Your
            AI Coach turns it into advice: push, maintain, or recover today.
          </p>
        </div>
      </div>
    </section>
  );
}

function CoachSection() {
  return (
    <section className="border-t border-border bg-surface/40">
      <div className="mx-auto max-w-6xl px-4 md:px-8 py-16 md:py-24 grid md:grid-cols-2 gap-12 items-start">
        <div>
          <SectionLabel>AI Coach</SectionLabel>
          <h2 className="font-display font-bold text-3xl md:text-5xl mt-3">
            Not a chatbot. <span className="text-primary">An accountability partner.</span>
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            Your coach reads your goals, workouts, health, and crew activity, then tells
            you the one highest-impact thing to do today.
          </p>
        </div>
        <div className="card-elevated p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <span className="font-mono text-xs uppercase tracking-wider text-primary">Today's call</span>
          </div>
          <div className="font-display font-bold text-xl leading-snug">
            Sleep is down 14% this week. Skip the heavy session — go for a 25-min Zone 2 walk.
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            {["Push","Maintain","Recover"].map((t,i) => (
              <div key={t} className={`text-center py-2 rounded-md ${i===2?"bg-primary/15 text-primary":"bg-surface-2 text-muted-foreground"}`}>{t}</div>
            ))}
          </div>
          <div className="text-xs text-muted-foreground">Built from your last 30 days · updates daily</div>
        </div>
      </div>
    </section>
  );
}

function PassportSection() {
  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-6xl px-4 md:px-8 py-16 md:py-24 grid md:grid-cols-2 gap-12 items-center">
        <div className="card-elevated p-6">
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 rounded-2xl bg-ember grid place-items-center text-2xl">🎟️</div>
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-primary">Public Passport</div>
              <div className="font-display font-bold text-xl">@mayaruns · Level 4 Reliable</div>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-3 text-center">
            {[
              ["📅","124","check-ins"],
              ["🛡","12","verifications"],
              ["🔥","31","day streak"],
            ].map(([e,v,l]) => (
              <div key={l} className="rounded-xl bg-surface-2 p-3">
                <div className="text-xl">{e}</div>
                <div className="font-display font-bold text-lg mt-1">{v}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{l}</div>
              </div>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {["🏅 First 30","🤝 Crew leader","🏃 5K club","🌅 Morning bird"].map((b) => (
              <span key={b} className="tag bg-primary/10 text-primary border border-primary/20">{b}</span>
            ))}
          </div>
        </div>
        <div>
          <SectionLabel>Passport</SectionLabel>
          <h2 className="font-display font-bold text-3xl md:text-5xl mt-3">
            A profile that <span className="text-primary">earns itself</span>.
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            Your Passport is a timeline of verified workouts, milestones, and badges.
            Share it publicly or keep it for your crew. It's your honest gym résumé.
          </p>
        </div>
      </div>
    </section>
  );
}

const TESTIMONIALS = [
  { name: "Maya R.", role: "Runner · 4×/week", body: "It's the first app that actually noticed when I didn't show up. The Crew makes it personal.", stars: 5 },
  { name: "Jordan T.", role: "Strength · 5×/week", body: "Verified check-ins killed my ego. I train cleaner and my numbers are honest now.", stars: 5 },
  { name: "Sana K.", role: "Lifestyle · daily", body: "Momentum > streaks. I missed a day and didn't quit. That's never happened before.", stars: 5 },
];

function Testimonials() {
  return (
    <section className="border-t border-border bg-surface/40">
      <div className="mx-auto max-w-6xl px-4 md:px-8 py-16 md:py-24">
        <SectionLabel>What members say</SectionLabel>
        <h2 className="font-display font-bold text-3xl md:text-5xl mt-3 max-w-2xl">
          Built for the people who <span className="text-primary">actually show up</span>.
        </h2>
        <div className="mt-10 grid md:grid-cols-3 gap-4">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="card-elevated p-6 hover-lift">
              <div className="flex gap-0.5 text-primary">
                {Array.from({ length: t.stars }).map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
              </div>
              <p className="mt-4 text-base leading-relaxed">"{t.body}"</p>
              <div className="mt-5 pt-4 border-t border-border">
                <div className="font-display font-bold">{t.name}</div>
                <div className="text-xs text-muted-foreground">{t.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const FAQS = [
  { q: "Do I need a real gym to use OpenStage?", a: "No. Train anywhere — home, park, sport, or full gym. We track the habit, not the equipment." },
  { q: "What is the Check-In Crew?", a: "A small group of users with similar goals who verify each other's check-ins and build trust over time." },
  { q: "How is OpenStage different from a workout tracker?", a: "Trackers log workouts. OpenStage verifies them, ranks you fairly, and keeps you accountable to people, not just to numbers." },
  { q: "What if I miss a day?", a: "Momentum bends, it doesn't break. Use a Streak Shield if you have one, or just show up tomorrow." },
  { q: "Is my data private?", a: "Every check-in has its own visibility: private, Crew, or public. You control what your Passport shows." },
];

function FAQSection() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="border-t border-border bg-surface/40">
      <div className="mx-auto max-w-3xl px-4 md:px-8 py-16 md:py-24">
        <SectionLabel className="justify-center">FAQ</SectionLabel>
        <h2 className="font-display font-bold text-3xl md:text-5xl mt-3 text-center">Questions, answered.</h2>
        <div className="mt-10 space-y-3">
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <button
                key={f.q}
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                className="w-full text-left card-elevated p-5 hover-lift"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="font-display font-bold text-lg">{f.q}</div>
                  <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </div>
                {isOpen && <p className="mt-3 text-sm text-muted-foreground">{f.a}</p>}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
