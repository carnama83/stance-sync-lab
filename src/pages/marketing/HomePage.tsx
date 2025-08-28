import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Shield, MapPin, Sparkles } from "lucide-react";

export default function HomePage() {
  const sampleTopics = [
    { id: "t1", title: "Should cities create car-free downtown zones?", summary: "Many communities are weighing safety, small business impact, and air quality.", category: "Community", language: "English" },
    { id: "t2", title: "How should schools handle smartphones in class?", summary: "Balancing learning tools with distraction and wellbeing.", category: "Education", language: "English" },
    { id: "t3", title: "Do you support universal basic income pilots?", summary: "Cities are testing monthly stipends to reduce poverty and instability.", category: "Policy", language: "English" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 via-white to-white text-neutral-900">
      <Header />
      <main>
        <Hero />
        <LiveTopicsPreview items={sampleTopics} />
        <HowItWorks />
        <PrivacyHighlights />
        <PulseTeaser />
      </main>
      <Footer />
    </div>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-10 w-full border-b border-sky-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="text-lg font-semibold tracking-tight">Website V2</Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link to="/feed" className="text-sky-900 hover:text-sky-950 hover:underline">Feed</Link>
          <Link to="/pulse" className="text-sky-900 hover:text-sky-950 hover:underline">Community Pulse</Link>
          <Link to="/auth/signup" className="rounded-2xl border border-sky-400 text-sky-900 px-3 py-1 shadow-sm hover:bg-sky-100">Sign up</Link>
        </nav>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <div className="grid items-center gap-8 md:grid-cols-2">
        <div>
          <h1 className="text-4xl font-bold leading-tight md:text-5xl">
            Speak freely on trending topics — private by default.
          </h1>
          <p className="mt-4 max-w-prose text-neutral-600">
            A new-age social platform where anyone can voice their opinion without fear of backlash.
            Pseudonymous IDs, coarse location only, and civility-by-design tools help you share
            honestly and compare viewpoints across regions.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/auth/signup" className="inline-flex items-center gap-2 rounded-2xl bg-sky-700 px-4 py-2 text-white shadow-sm hover:bg-sky-800">
              Sign up free <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/feed" className="inline-flex items-center gap-2 rounded-2xl border border-sky-400 text-sky-900 px-4 py-2 shadow-sm hover:bg-sky-100">
              Explore topics
            </Link>
          </div>
        </div>
        <HeroCard />
      </div>
    </section>
  );
}

function HeroCard() {
  const labels = ["Strongly Against", "Against", "Neutral", "For", "Strongly For"];
  return (
    <div className="rounded-3xl border border-sky-200 bg-white p-5 shadow-sm">
      <div className="rounded-2xl bg-neutral-50 p-4">
        <div className="mb-3 text-xs font-medium text-sky-900">Topic</div>
        <div className="text-lg font-semibold">Should cities create car-free downtown zones?</div>
        <p className="mt-2 text-sm text-neutral-600">
          Many communities are weighing safety, small business impact, and air quality.
        </p>
        <div className="mt-4">
          <label className="mb-1 block text-xs text-neutral-600">Your stance</label>
          <div className="grid grid-cols-5 gap-2 text-xs">
            {labels.map((l) => (
              <button key={l} disabled className="rounded-xl border border-sky-300 bg-white px-2 py-2 text-neutral-700 opacity-80">
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function LiveTopicsPreview({ items }: { items: Array<any> }) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <h2 className="text-xl font-semibold text-sky-950">Trending topics (preview)</h2>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {items.map((q) => (
          <article key={q.id} className="rounded-3xl border border-sky-200 bg-white p-5 shadow-sm hover:ring-1 hover:ring-sky-300">
            <h3 className="font-medium leading-snug">{q.title}</h3>
            <p className="mt-2 text-sm text-neutral-600">{q.summary}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-sky-50 px-2 py-1 text-sky-800">{q.category}</span>
              <span className="rounded-full bg-sky-50 px-2 py-1 text-sky-800">{q.language}</span>
            </div>
            <Link className="mt-4 inline-block text-sm underline text-sky-900 hover:text-sky-950" to="/feed">
              Join the conversation →
            </Link>
          </article>
        ))}
      </div>
      <div className="mt-6">
        <Link to="/feed" className="text-sm underline text-sky-900 hover:text-sky-950">
          Explore all topics →
        </Link>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { title: "Discover topics", desc: "See what's trending across communities and regions.", icon: <Sparkles className="h-4 w-4" /> },
    { title: "Share your stance", desc: "Use a 5-point slider and optional rationale to express yourself.", icon: <ArrowRight className="h-4 w-4" /> },
    { title: "Compare perspectives", desc: "View how opinions differ in your city, state, country, and globally.", icon: <MapPin className="h-4 w-4" /> },
    { title: "Build better debates", desc: "Civility nudges and reporting reduce dogpiling and keep things constructive.", icon: <Shield className="h-4 w-4" /> }
  ];
  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <h2 className="text-xl font-semibold text-sky-950">How it works</h2>
      <div className="mt-5 grid gap-4 md:grid-cols-4">
        {steps.map((s, i) => (
          <div key={i} className="rounded-3xl border border-sky-200 bg-white p-5 shadow-sm hover:ring-1 hover:ring-sky-300">
            <div className="flex items-center gap-2 text-sm font-medium">{s.icon} {s.title}</div>
            <p className="mt-2 text-sm text-neutral-600">{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function PrivacyHighlights() {
  const items = [
    { title: "Pseudonymous by default", desc: "Random IDs by default; username optional.", icon: <Shield className="h-4 w-4" /> },
    { title: "Coarse location only", desc: "City / State / Country — never GPS or raw IP.", icon: <MapPin className="h-4 w-4" /> },
    { title: "Civility-first safety", desc: "Warnings & reporting tools to minimize backlash; you control visibility.", icon: <Shield className="h-4 w-4" /> }
  ];
  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <h2 className="text-xl font-semibold text-sky-950">Why we're different</h2>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {items.map((s, i) => (
          <div key={i} className="rounded-3xl border border-sky-200 bg-white p-5 shadow-sm hover:ring-1 hover:ring-sky-300">
            <div className="flex items-center gap-2 text-sm font-medium">{s.icon} {s.title}</div>
            <p className="mt-2 text-sm text-neutral-600">{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function PulseTeaser() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <h2 className="text-xl font-semibold text-sky-950">See how your region thinks</h2>
      <p className="mt-2 text-sm text-neutral-600">Compare My City, State, Country, Global.</p>
      <Link to="/pulse" className="mt-4 inline-flex items-center gap-2 text-sm underline text-sky-900 hover:text-sky-950">
        Open Community Pulse <ArrowRight className="h-4 w-4" />
      </Link>
    </section>
  );
}

function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-sky-200">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 text-xs text-neutral-600">
        <span>© {year} Website V2</span>
        <div className="flex gap-3">
          <Link to="/privacy" className="hover:underline hover:text-sky-900">Privacy</Link>
          <Link to="/terms" className="hover:underline hover:text-sky-900">Terms</Link>
        </div>
      </div>
    </footer>
  );
}