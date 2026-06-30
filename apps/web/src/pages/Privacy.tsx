import { Link } from 'react-router-dom';

/** Public privacy policy — URL required for Google Play Console. Customize before production. */
export default function Privacy() {
  return (
    <div className="min-h-screen bg-[#f7f6f2] text-gray-800">
      <div className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
        <p className="text-sm text-emerald-800">
          <Link to="/" className="font-medium hover:underline">
            ← Dr. Plant
          </Link>
        </p>
        <h1 className="mt-4 font-display text-3xl font-bold text-emerald-950">Privacy Policy</h1>
        <p className="mt-2 text-sm text-gray-600">Last updated: May 2026</p>

        <div className="prose prose-emerald mt-8 max-w-none space-y-4 text-sm leading-relaxed">
          <p>
            Dr. Plant (&quot;we&quot;, &quot;the app&quot;) helps you track plant care tasks, journal
            notes, and optional health diagnosis. This policy describes what we collect and how we
            use it.
          </p>

          <h2 className="font-display text-lg font-semibold text-emerald-950">Information we collect</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>Account email and name when you register</li>
            <li>Plant details, care tasks, and journal entries you create</li>
            <li>Photos you upload for plants, journal, or diagnosis</li>
            <li>Optional location for weather-based care advice</li>
            <li>Device tokens if you enable push notifications (when available)</li>
          </ul>

          <h2 className="font-display text-lg font-semibold text-emerald-950">How we use data</h2>
          <p>
            We use your data to provide care schedules, sync your garden across devices, send
            account emails (verification, password reset), and optionally run AI-assisted diagnosis
            when you request it. We do not sell your personal information.
          </p>

          <h2 className="font-display text-lg font-semibold text-emerald-950">Third-party services</h2>
          <p>
            Depending on configuration, the app may send data to hosting providers, email (SMTP),
            payment (Stripe), plant identification (PlantNet), and AI (OpenAI) only when you use
            those features.
          </p>

          <h2 className="font-display text-lg font-semibold text-emerald-950">Retention & deletion</h2>
          <p>
            You may delete your account from Settings. We remove associated plant and account data
            subject to backup retention on our servers.
          </p>

          <h2 className="font-display text-lg font-semibold text-emerald-950">Contact</h2>
          <p>
            For privacy questions, contact the operator at the support email listed on the Google
            Play store listing.
          </p>

          <p className="text-xs text-gray-500">
            This is a template policy. Replace contact details and review with legal counsel before a
            public production launch.
          </p>
        </div>
      </div>
    </div>
  );
}
