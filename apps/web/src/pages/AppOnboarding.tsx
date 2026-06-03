import { Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { PageHeader } from '../components/ui/PageHeader';

const tourSections = [
  {
    title: 'Home',
    body: 'See what needs attention today, recent garden activity, reminders, and your overall garden story.',
    to: '/garden',
    action: 'Go home',
  },
  {
    title: 'Gardens',
    body: 'Create indoor or outdoor spaces, add plants inside each garden, and keep care organized by area.',
    to: '/garden/gardens',
    action: 'View gardens',
  },
  {
    title: 'Browse',
    body: 'Look up plant species, care notes, and ideas before adding something new to your collection.',
    to: '/garden/plants/browse',
    action: 'Browse plants',
  },
  {
    title: 'Add Plant',
    body: 'Add a plant when you are ready. Photos, life stage, garden area, and age help DrPlant tune suggestions.',
    to: '/garden/plants/new',
    action: 'Add a plant',
  },
  {
    title: 'DrPlant',
    body: 'Open a plant profile and use the Health tab to ask for diagnosis help, recovery steps, and follow-up care.',
    to: '/garden/plants/browse',
    action: 'Find a plant',
  },
  {
    title: 'Settings',
    body: 'Control reminders, Plant Buddy display, account preferences, and other app-level options.',
    to: '/garden/settings',
    action: 'Open settings',
  },
];

export default function AppOnboarding() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          eyebrow="Quick tour"
          title="Use DrPlant at your pace"
          description="A fast map of what the app does. Nothing here is required, and you can come back any time from the menu."
        />
        <Link
          to="/garden"
          className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-800 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2"
        >
          Skip for now
        </Link>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-label="App tour sections">
        {tourSections.map((section) => (
          <Card key={section.title} className="flex h-full flex-col gap-3">
            <div className="flex-1 space-y-2">
              <h2 className="text-base font-semibold text-emerald-950">{section.title}</h2>
              <p className="text-sm leading-6 text-gray-600">{section.body}</p>
            </div>
            <Link
              to={section.to}
              className="inline-flex min-h-10 items-center justify-center rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2"
            >
              {section.action}
            </Link>
          </Card>
        ))}
      </section>

      <Card className="border-amber-200 bg-amber-50/80">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-emerald-950">Guidance stays optional</h2>
            <p className="mt-1 text-sm leading-6 text-gray-700">
              You can start with one plant, browse first, or ignore the tour entirely. DrPlant should support
              your garden, not make you complete homework before you can use it.
            </p>
          </div>
          <Link
            to="/garden"
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2"
          >
            Start using app
          </Link>
        </div>
      </Card>
    </div>
  );
}
