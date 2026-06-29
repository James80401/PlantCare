import { Link, Navigate, useLocation } from 'react-router-dom';
import {
  findMarketingRoute,
  findProblemGuide,
  findSpeciesGuide,
  problemGuides,
  speciesGuides,
  type MarketingRouteMeta,
} from '../../seo/marketingRegistry';
import { publicSiteConfig, shouldRenderMarketingRoutes } from '../../seo/siteConfig';
import { trackEvent } from '../../utils/analytics';

interface MarketingRoutePageProps {
  routePath?: string;
}

function primaryCtaPath(route: MarketingRouteMeta) {
  if (route.kind === 'waitlist') return '/register?source=waitlist';
  return publicSiteConfig.mode === 'teaser' ? '/waitlist' : '/register';
}

function trackCta(route: MarketingRouteMeta, target: string, label: string) {
  trackEvent('marketing_cta_click', {
    route: route.path,
    target,
    label,
    siteMode: publicSiteConfig.mode,
  });
  if (route.kind === 'waitlist') {
    trackEvent('waitlist_submit', { route: route.path, target });
  }
}

function CtaLink({ route, label, to }: { route: MarketingRouteMeta; label?: string; to?: string }) {
  const target = to ?? primaryCtaPath(route);
  const ctaLabel = label ?? route.ctaLabel;
  return (
    <Link
      to={target}
      onClick={() => trackCta(route, target, ctaLabel)}
      className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#1f4d3a] px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-emerald-950/15 transition hover:bg-[#173c2d]"
    >
      {ctaLabel}
    </Link>
  );
}

function MarketingHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-emerald-950/10 bg-[#f8f4ea]/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link to="/" className="min-w-0 text-lg font-bold tracking-tight text-[#18362b]">
          Dr. Plant
        </Link>
        <nav className="hidden items-center gap-5 text-sm font-medium text-[#18362b]/75 md:flex">
          <Link to="/plant-problems" className="hover:text-[#1f4d3a]">
            Problems
          </Link>
          <Link to="/plant-care-guides" className="hover:text-[#1f4d3a]">
            Guides
          </Link>
          <Link to="/plant-diagnosis-app" className="hover:text-[#1f4d3a]">
            Diagnosis
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          {publicSiteConfig.mode === 'private' ? (
            <span className="hidden rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900 sm:inline-flex">
              Private preview
            </span>
          ) : null}
          <Link
            to="/login"
            className="rounded-full px-3 py-2 text-sm font-semibold text-[#18362b] hover:bg-white/70"
          >
            Sign in
          </Link>
        </div>
      </div>
    </header>
  );
}

function MarketingFooter() {
  return (
    <footer className="border-t border-emerald-950/10 bg-white/70">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-[#18362b]/70 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>Dr. Plant by Plant Care. Private until launch.</p>
        <nav className="flex flex-wrap gap-4">
          <Link to="/privacy" className="font-semibold hover:text-[#1f4d3a]">
            Privacy
          </Link>
          <Link to="/login" className="font-semibold hover:text-[#1f4d3a]">
            Sign in
          </Link>
          <Link to="/register" className="font-semibold hover:text-[#1f4d3a]">
            Request access
          </Link>
        </nav>
      </div>
    </footer>
  );
}

function PreviewNotice() {
  if (publicSiteConfig.mode !== 'private') return null;
  return (
    <div className="border-b border-amber-200 bg-amber-50">
      <div className="mx-auto max-w-6xl px-4 py-2 text-sm font-medium text-amber-950 sm:px-6">
        Private pre-launch mode: this marketing surface is built for protected preview and is not indexable.
      </div>
    </div>
  );
}

function ProductScene() {
  return (
    <div className="grid gap-4 rounded-[2rem] border border-emerald-950/10 bg-white p-4 shadow-xl shadow-emerald-950/10 sm:p-5">
      <div className="rounded-3xl bg-[#18362b] p-4 text-white">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-100">Dr. Plant health chat</p>
        <p className="mt-3 text-2xl font-bold">Yellowing lower leaves</p>
        <p className="mt-2 text-sm leading-6 text-emerald-50/85">
          Likely watering stress. Check soil moisture two inches down, review drainage, and pause feeding while the plant stabilizes.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ['Photo context', 'Add the full plant and leaf close-up.'],
          ['Recovery plan', 'Watch for rebound over seven days.'],
          ['Care task', 'Schedule a health check reminder.'],
        ].map(([title, text]) => (
          <div key={title} className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
            <p className="text-sm font-bold text-[#18362b]">{title}</p>
            <p className="mt-1 text-xs leading-5 text-[#18362b]/70">{text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Hero({ route }: { route: MarketingRouteMeta }) {
  return (
    <section className="bg-[#f8f4ea]">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-wide text-emerald-800">{route.eyebrow}</p>
          <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-[#18362b] sm:text-5xl">
            {route.h1}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[#18362b]/75">{route.summary}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <CtaLink route={route} />
            <Link
              to="/plant-problems"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-emerald-900/20 bg-white px-5 py-3 text-sm font-semibold text-[#18362b] transition hover:border-emerald-800/40"
            >
              Browse symptom guides
            </Link>
          </div>
        </div>
        {route.kind === 'landing' ? (
          <div className="mt-10">
            <ProductScene />
          </div>
        ) : null}
      </div>
    </section>
  );
}

function FeatureGrid({ route }: { route: MarketingRouteMeta }) {
  const items = [
    ['Symptom-first help', 'Start with what you see: yellow leaves, droop, brown tips, pests, or root rot clues.'],
    ['Per-plant memory', 'Each plant keeps its own care history, diagnosis conversations, photos, and follow-up tasks.'],
    ['Beginner language', 'Guidance focuses on the next safe step instead of overwhelming you with plant jargon.'],
    ['Recovery routines', 'Turn advice into reminders for health checks, watering changes, pruning, and notes.'],
  ];
  return (
    <section className="bg-white py-14 sm:py-18">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map(([title, text]) => (
            <article key={title} className="rounded-2xl border border-emerald-950/10 bg-[#fbfaf6] p-5">
              <h2 className="text-base font-bold text-[#18362b]">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-[#18362b]/70">{text}</p>
            </article>
          ))}
        </div>
        <div className="mt-8">
          <CtaLink route={route} label="Request private access" />
        </div>
      </div>
    </section>
  );
}

function AppPageBody({ route }: { route: MarketingRouteMeta }) {
  const rows = [
    ['Capture the context', 'Photos, symptoms, plant species, recent care, and location help Dr. Plant narrow the likely cause.'],
    ['Choose a safe first step', 'Beginner guidance favors observation, drainage checks, and stability before drastic changes.'],
    ['Follow up inside the plant profile', 'Recovery advice becomes a plant-specific thread and care routine you can revisit.'],
  ];
  return (
    <section className="bg-white py-14">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-[1fr_0.8fr]">
        <div className="space-y-4">
          {rows.map(([title, text]) => (
            <article key={title} className="rounded-2xl border border-emerald-950/10 bg-[#fbfaf6] p-5">
              <h2 className="text-lg font-bold text-[#18362b]">{title}</h2>
              <p className="mt-2 leading-7 text-[#18362b]/72">{text}</p>
            </article>
          ))}
        </div>
        <aside className="rounded-2xl border border-sky-200 bg-sky-50 p-5 text-sky-950">
          <h2 className="text-lg font-bold">Best launch keyword fit</h2>
          <p className="mt-2 leading-7">
            This page is built for searchers looking for a plant diagnosis app, plant care app, or watering reminder app. In private mode it stays hidden from indexing.
          </p>
          <div className="mt-5">
            <CtaLink route={route} />
          </div>
        </aside>
      </div>
    </section>
  );
}

function BeginnerBody({ route }: { route: MarketingRouteMeta }) {
  return (
    <section className="bg-white py-14">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 sm:px-6 md:grid-cols-3">
        {[
          ['Light first', 'Most care advice fails if the plant is in the wrong light. Start by matching the plant to the room.'],
          ['Water by condition', 'Use soil feel, pot weight, and plant symptoms before following a calendar.'],
          ['Change one thing', 'When a plant struggles, make one safe change and watch the response before piling on fixes.'],
        ].map(([title, text]) => (
          <article key={title} className="rounded-2xl border border-emerald-950/10 bg-[#fbfaf6] p-5">
            <h2 className="text-lg font-bold text-[#18362b]">{title}</h2>
            <p className="mt-2 leading-7 text-[#18362b]/72">{text}</p>
          </article>
        ))}
        <div className="md:col-span-3">
          <CtaLink route={route} />
        </div>
      </div>
    </section>
  );
}

function ProblemIndex({ route }: { route: MarketingRouteMeta }) {
  return (
    <section className="bg-white py-14">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-2">
          {problemGuides.map((guide) => (
            <Link
              key={guide.slug}
              to={`/plant-problems/${guide.slug}`}
              className="rounded-2xl border border-emerald-950/10 bg-[#fbfaf6] p-5 transition hover:border-emerald-700/40 hover:bg-emerald-50/60"
            >
              <p className="text-sm font-bold uppercase tracking-wide text-emerald-800">{guide.symptom}</p>
              <h2 className="mt-2 text-xl font-bold text-[#18362b]">{guide.title}</h2>
              <p className="mt-2 leading-7 text-[#18362b]/72">{guide.description}</p>
            </Link>
          ))}
        </div>
        <div className="mt-8">
          <CtaLink route={route} />
        </div>
      </div>
    </section>
  );
}

function ProblemGuideBody({ route }: { route: MarketingRouteMeta }) {
  const guide = findProblemGuide(route.path);
  if (!guide) return null;
  return (
    <section className="bg-white py-14">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 sm:px-6 lg:grid-cols-2">
        <article className="rounded-2xl border border-emerald-950/10 bg-[#fbfaf6] p-5">
          <h2 className="text-xl font-bold text-[#18362b]">Quick checks before you react</h2>
          <ul className="mt-4 space-y-3">
            {guide.checks.map((item) => (
              <li key={item} className="rounded-xl bg-white px-4 py-3 text-[#18362b]/75 ring-1 ring-emerald-950/10">
                {item}
              </li>
            ))}
          </ul>
        </article>
        <article className="rounded-2xl border border-emerald-950/10 bg-[#fbfaf6] p-5">
          <h2 className="text-xl font-bold text-[#18362b]">Beginner-safe recovery steps</h2>
          <ul className="mt-4 space-y-3">
            {guide.recovery.map((item) => (
              <li key={item} className="rounded-xl bg-white px-4 py-3 text-[#18362b]/75 ring-1 ring-emerald-950/10">
                {item}
              </li>
            ))}
          </ul>
        </article>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-950 lg:col-span-2">
          Dr. Plant can help organize symptoms and next steps, but severe toxicity concerns, pet ingestion, or unknown chemical exposure need a qualified local expert.
        </div>
        <div className="lg:col-span-2">
          <CtaLink route={route} />
        </div>
      </div>
    </section>
  );
}

function SpeciesIndex({ route }: { route: MarketingRouteMeta }) {
  return (
    <section className="bg-white py-14">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {speciesGuides.map((guide) => (
            <Link
              key={guide.slug}
              to={`/plant-care-guides/${guide.slug}`}
              className="rounded-2xl border border-emerald-950/10 bg-[#fbfaf6] p-5 transition hover:border-emerald-700/40 hover:bg-emerald-50/60"
            >
              <p className="text-sm font-bold uppercase tracking-wide text-emerald-800">{guide.commonName}</p>
              <h2 className="mt-2 text-xl font-bold text-[#18362b]">{guide.title}</h2>
              <p className="mt-2 text-sm italic text-[#18362b]/55">{guide.scientificName}</p>
              <p className="mt-2 leading-7 text-[#18362b]/72">{guide.description}</p>
            </Link>
          ))}
        </div>
        <div className="mt-8">
          <CtaLink route={route} />
        </div>
      </div>
    </section>
  );
}

function SpeciesGuideBody({ route }: { route: MarketingRouteMeta }) {
  const guide = findSpeciesGuide(route.path);
  if (!guide) return null;
  return (
    <section className="bg-white py-14">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 sm:px-6 lg:grid-cols-2">
        <article className="rounded-2xl border border-emerald-950/10 bg-[#fbfaf6] p-5">
          <h2 className="text-xl font-bold text-[#18362b]">Care rhythm</h2>
          <ul className="mt-4 space-y-3">
            {guide.careRhythm.map((item) => (
              <li key={item} className="rounded-xl bg-white px-4 py-3 text-[#18362b]/75 ring-1 ring-emerald-950/10">
                {item}
              </li>
            ))}
          </ul>
        </article>
        <article className="rounded-2xl border border-emerald-950/10 bg-[#fbfaf6] p-5">
          <h2 className="text-xl font-bold text-[#18362b]">Beginner risks</h2>
          <ul className="mt-4 space-y-3">
            {guide.beginnerRisks.map((item) => (
              <li key={item} className="rounded-xl bg-white px-4 py-3 text-[#18362b]/75 ring-1 ring-emerald-950/10">
                {item}
              </li>
            ))}
          </ul>
        </article>
        <div className="lg:col-span-2">
          <CtaLink route={route} />
        </div>
      </div>
    </section>
  );
}

function WaitlistBody({ route }: { route: MarketingRouteMeta }) {
  return (
    <section className="bg-white py-14">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="rounded-2xl border border-emerald-950/10 bg-[#fbfaf6] p-6">
          <h2 className="text-2xl font-bold text-[#18362b]">Private access stays intentional</h2>
          <p className="mt-3 leading-7 text-[#18362b]/72">
            The public app remains gated while Dr. Plant prepares for open testing. Request access to join the private flow and help validate the diagnosis, reminder, and beginner guide experience.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <CtaLink route={route} />
            <Link
              to="/login"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-emerald-900/20 bg-white px-5 py-3 text-sm font-semibold text-[#18362b]"
            >
              I already have access
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function Body({ route }: { route: MarketingRouteMeta }) {
  if (route.kind === 'landing') return <FeatureGrid route={route} />;
  if (route.kind === 'waitlist') return <WaitlistBody route={route} />;
  if (route.kind === 'app') return <AppPageBody route={route} />;
  if (route.kind === 'beginner') return <BeginnerBody route={route} />;
  if (route.kind === 'problem-index') return <ProblemIndex route={route} />;
  if (route.kind === 'problem') return <ProblemGuideBody route={route} />;
  if (route.kind === 'guide-index') return <SpeciesIndex route={route} />;
  return <SpeciesGuideBody route={route} />;
}

export default function MarketingRoutePage({ routePath }: MarketingRoutePageProps) {
  const location = useLocation();
  const route = findMarketingRoute(routePath ?? location.pathname);

  if (!route) return <Navigate to="/" replace />;
  if (!shouldRenderMarketingRoutes(publicSiteConfig)) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-[#f8f4ea] text-[#18362b]">
      <MarketingHeader />
      <PreviewNotice />
      <main>
        <Hero route={route} />
        <Body route={route} />
      </main>
      <MarketingFooter />
    </div>
  );
}
