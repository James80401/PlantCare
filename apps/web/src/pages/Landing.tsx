import { Link } from 'react-router-dom';
import PhoneMockup from '../components/landing/PhoneMockup';

const FEATURES = [
  {
    title: 'Intelligent watering reminders',
    description:
      'Personalized schedules use your plant species, pot size, and care style so you water at the right time—not too much, not too little.',
    icon: '💧',
  },
  {
    title: 'Fertilize, mist, repot & more',
    description:
      'Beyond watering: get timely nudges for fertilizing, misting, pruning, pest checks, pH tests, and repotting.',
    icon: '📅',
  },
  {
    title: 'Dr. Plant: cure sick plants',
    description:
      'Yellow leaves, pests, or weak growth? Describe symptoms or snap a photo for AI-powered diagnosis and a clear treatment plan.',
    icon: '🩺',
  },
  {
    title: 'Plant identification',
    description:
      'Not sure what you brought home? Upload a photo to identify the species and pull care requirements into your garden instantly.',
    icon: '🔍',
  },
  {
    title: 'Step-by-step care guides',
    description:
      'Every task links to detailed, species-specific instructions with diagrams—watering, pruning, repotting, and more.',
    icon: '📖',
  },
  {
    title: 'Weather-aware care',
    description:
      'Local weather can adjust your schedule so rainy weeks mean fewer water tasks when your plants do not need them.',
    icon: '🌦️',
  },
  {
    title: 'Your plant journal',
    description:
      'Log notes and photos over time. Watch your collection grow while every plant keeps its own care history.',
    icon: '📓',
  },
  {
    title: '240+ species catalog',
    description:
      'From monsteras to herbs—browse a rich library of houseplants with science-backed defaults you can fine-tune.',
    icon: '🌱',
  },
] as const;

function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-emerald-900/5 bg-[#f7f6f2]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2 text-[#16352f]">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-800 text-lg text-white">
            🌿
          </span>
          <span className="font-display text-xl font-semibold tracking-tight">Plant Care</span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm font-medium text-[#16352f]/80 md:flex">
          <a href="#features" className="transition hover:text-emerald-800">
            Features
          </a>
          <a href="#how-it-works" className="transition hover:text-emerald-800">
            How it works
          </a>
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            to="/login"
            className="rounded-full px-4 py-2 text-sm font-medium text-[#16352f] transition hover:bg-emerald-900/5"
          >
            Sign in
          </Link>
          <Link
            to="/register"
            className="rounded-full bg-[#1a3c34] px-4 py-2 text-sm font-medium text-white shadow-md shadow-emerald-900/15 transition hover:bg-[#16352f] sm:px-5"
          >
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-8 pb-16 sm:pt-12 sm:pb-24">
      <div
        className="pointer-events-none absolute -right-32 top-0 h-96 w-96 rounded-full bg-emerald-200/50 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-amber-100/60 blur-3xl"
        aria-hidden
      />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16">
        <div>
          <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-sm font-medium text-emerald-800 shadow-sm ring-1 ring-emerald-900/5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
            Smart care for every plant in your home
          </p>
          <h1 className="font-display text-4xl font-semibold leading-[1.1] tracking-tight text-[#16352f] sm:text-5xl lg:text-6xl">
            Keep your plants alive
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-[#16352f]/75">
            Individual care schedules and reminders, species-specific guides, plant identification,
            and Dr. Plant diagnosis—everything you need to grow with confidence.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to="/register"
              className="inline-flex items-center justify-center rounded-full bg-[#1a3c34] px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-emerald-900/20 transition hover:bg-[#16352f]"
            >
              Get started free
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-full border-2 border-[#1a3c34]/20 bg-white px-7 py-3.5 text-base font-semibold text-[#16352f] transition hover:border-emerald-800/30 hover:bg-white/80"
            >
              Sign in
            </Link>
          </div>
          <dl className="mt-10 grid grid-cols-3 gap-4 border-t border-emerald-900/10 pt-8">
            {[
              { value: '240+', label: 'Plant species' },
              { value: '7', label: 'Care task types' },
              { value: 'AI', label: 'Dr. Plant diagnosis' },
            ].map(({ value, label }) => (
              <div key={label}>
                <dt className="font-display text-2xl font-semibold text-[#16352f]">{value}</dt>
                <dd className="mt-0.5 text-xs text-[#16352f]/60 sm:text-sm">{label}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="flex justify-center lg:justify-end">
          <PhoneMockup />
        </div>
      </div>
    </section>
  );
}

function TrustStrip() {
  return (
    <section className="border-y border-emerald-900/5 bg-white/60 py-6">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-10 gap-y-3 px-4 text-center text-sm text-[#16352f]/70 sm:px-6">
        <span>Trusted by plant parents everywhere</span>
        <span className="hidden h-4 w-px bg-emerald-900/15 sm:block" aria-hidden />
        <span>★★★★★ Personalized care schedules</span>
        <span className="hidden h-4 w-px bg-emerald-900/15 sm:block" aria-hidden />
        <span>Made for houseplant lovers</span>
      </div>
    </section>
  );
}

function FeaturesSection() {
  return (
    <section id="features" className="scroll-mt-20 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <p className="text-center text-sm font-semibold uppercase tracking-widest text-emerald-700">
          Plant Care features
        </p>
        <h2 className="font-display mt-3 text-center text-3xl font-semibold text-[#16352f] sm:text-4xl">
          Green tools for green thumbs
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-[#16352f]/70">
          Everything Planta fans love—smart reminders, expert guides, and diagnosis—built for your
          web garden.
        </p>
        <ul className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature) => (
            <li
              key={feature.title}
              className="group rounded-3xl bg-white p-6 shadow-sm ring-1 ring-emerald-900/5 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <span
                className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-2xl transition group-hover:bg-emerald-100"
                aria-hidden
              >
                {feature.icon}
              </span>
              <h3 className="mt-4 font-semibold text-[#16352f]">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#16352f]/65">{feature.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    {
      step: '01',
      title: 'Add your plants',
      text: 'Search 240+ species or identify from a photo. Set pot size and location.',
    },
    {
      step: '02',
      title: 'Get your schedule',
      text: 'We generate watering, feeding, and care tasks tailored to each plant.',
    },
    {
      step: '03',
      title: 'Follow guided care',
      text: 'Complete tasks with step-by-step guides. Ask Dr. Plant when something looks off.',
    },
  ];

  return (
    <section id="how-it-works" className="scroll-mt-20 bg-[#1a3c34] py-20 text-white sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="font-display text-center text-3xl font-semibold sm:text-4xl">How it works</h2>
        <p className="mx-auto mt-4 max-w-xl text-center text-emerald-100/80">
          Three simple steps from “I hope it survives” to a thriving indoor jungle.
        </p>
        <ol className="mt-14 grid gap-8 md:grid-cols-3">
          {steps.map((item) => (
            <li key={item.step} className="relative rounded-3xl bg-white/10 p-8 backdrop-blur-sm">
              <span className="font-display text-4xl font-bold text-emerald-300/40">{item.step}</span>
              <h3 className="mt-4 text-xl font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-emerald-50/85">{item.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function CtaSection() {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
        <h2 className="font-display text-3xl font-semibold text-[#16352f] sm:text-4xl">
          Ready to keep your plants alive?
        </h2>
        <p className="mt-4 text-lg text-[#16352f]/70">
          Join Plant Care free—set up your first plant in under a minute.
        </p>
        <Link
          to="/register"
          className="mt-8 inline-flex rounded-full bg-[#1a3c34] px-8 py-4 text-base font-semibold text-white shadow-lg shadow-emerald-900/20 transition hover:bg-[#16352f]"
        >
          Create your free account
        </Link>
      </div>
    </section>
  );
}

function LandingFooter() {
  return (
    <footer className="border-t border-emerald-900/5 bg-white/80 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
        <p className="text-sm text-[#16352f]/60">
          © {new Date().getFullYear()} Plant Care. Keep your plants alive.
        </p>
        <nav className="flex gap-6 text-sm font-medium text-[#16352f]/70">
          <Link to="/login" className="hover:text-emerald-800">
            Sign in
          </Link>
          <Link to="/register" className="hover:text-emerald-800">
            Register
          </Link>
        </nav>
      </div>
    </footer>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#f7f6f2] text-[#16352f]">
      <LandingHeader />
      <main>
        <HeroSection />
        <TrustStrip />
        <FeaturesSection />
        <HowItWorksSection />
        <CtaSection />
      </main>
      <LandingFooter />
    </div>
  );
}
