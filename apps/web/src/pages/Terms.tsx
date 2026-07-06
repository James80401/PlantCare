import { Link } from 'react-router-dom';

/** Public terms of service — URL required for app-store listings. Customize before production. */
export default function Terms() {
  return (
    <div className="min-h-screen bg-[#f7f6f2] text-gray-800">
      <div className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
        <p className="text-sm text-emerald-800">
          <Link to="/" className="font-medium hover:underline">
            ← Dr. Plant
          </Link>
        </p>
        <h1 className="mt-4 font-display text-3xl font-bold text-emerald-950">Terms of Service</h1>
        <p className="mt-2 text-sm text-gray-600">Last updated: July 2026</p>

        <div className="prose prose-emerald mt-8 max-w-none space-y-4 text-sm leading-relaxed">
          <p>
            These terms govern your use of Dr. Plant (&quot;the app&quot;, &quot;the service&quot;).
            By creating an account or using the app you agree to them. If you do not agree, do not
            use the service.
          </p>

          <h2 className="font-display text-lg font-semibold text-emerald-950">The service</h2>
          <p>
            Dr. Plant helps you track plant care schedules, keep journals and photos, share gardens
            with your household, and optionally request AI-assisted plant identification and health
            guidance. Features may change, be added, or be removed over time.
          </p>

          <h2 className="font-display text-lg font-semibold text-emerald-950">Your account</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>You must provide accurate registration information and keep it up to date.</li>
            <li>You are responsible for activity under your account and for keeping your password secure.</li>
            <li>You may delete your account at any time from Settings, which removes your plant and account data subject to backup retention.</li>
          </ul>

          <h2 className="font-display text-lg font-semibold text-emerald-950">
            Plant care guidance is not professional advice
          </h2>
          <p>
            Care schedules, identifications, diagnoses, and recommendations — including AI-assisted
            ones — are informational suggestions generated from general horticultural knowledge and
            the details you provide. They may be incomplete or wrong. They are not a substitute for
            professional horticultural advice, and nothing in the app is medical or veterinary
            advice: always verify a plant&apos;s toxicity independently before allowing contact with
            children or pets. You are responsible for decisions you make about your plants.
          </p>

          <h2 className="font-display text-lg font-semibold text-emerald-950">Subscriptions</h2>
          <p>
            Some features may require a paid subscription, billed through our payment provider
            (Stripe). Prices, included features, and any free-trial length are shown before you
            subscribe. Subscriptions renew automatically until cancelled; cancelling stops future
            renewals and premium features remain available until the end of the paid period. Unless
            required by law, payments are non-refundable.
          </p>

          <h2 className="font-display text-lg font-semibold text-emerald-950">Your content</h2>
          <p>
            You own the notes, photos, and other content you add. You grant us the license needed to
            store, process, and display that content to operate the service — including to household
            members you share a garden with and, for content you explicitly post to the community
            feed, to other users. Do not upload content you do not have the right to share.
          </p>

          <h2 className="font-display text-lg font-semibold text-emerald-950">Acceptable use</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>No unlawful, harassing, or abusive behavior, including in community posts and comments.</li>
            <li>No uploading of explicit, infringing, or malicious content. Uploaded images may be automatically screened.</li>
            <li>No attempts to probe, overload, disrupt, or gain unauthorized access to the service or other accounts.</li>
            <li>No scraping or bulk extraction of the species catalog or other users&apos; content.</li>
          </ul>
          <p>
            We may remove content or suspend accounts that violate these rules, and may report
            unlawful activity where appropriate.
          </p>

          <h2 className="font-display text-lg font-semibold text-emerald-950">Availability</h2>
          <p>
            The service is provided &quot;as is&quot; and &quot;as available&quot;. We work to keep it
            reliable but do not guarantee uninterrupted operation, and we may modify or discontinue
            the service with reasonable notice where practical. You can export your data from
            Settings at any time.
          </p>

          <h2 className="font-display text-lg font-semibold text-emerald-950">
            Limitation of liability
          </h2>
          <p>
            To the maximum extent permitted by law, we are not liable for indirect, incidental, or
            consequential damages arising from your use of the service — including loss of plants,
            data, or profits. Our total liability for any claim is limited to the amount you paid
            for the service in the twelve months before the claim arose.
          </p>

          <h2 className="font-display text-lg font-semibold text-emerald-950">Changes to these terms</h2>
          <p>
            We may update these terms as the service evolves. For material changes we will give
            notice in the app or by email before the changes take effect. Continuing to use the
            service after that means you accept the updated terms.
          </p>

          <h2 className="font-display text-lg font-semibold text-emerald-950">Contact</h2>
          <p>
            For questions about these terms, contact the operator at the support email listed on the
            app-store listing. See also our <Link to="/privacy">Privacy Policy</Link>.
          </p>

          <p className="text-xs text-gray-500">
            This is a template agreement. Replace contact details and review with legal counsel
            before a public production launch.
          </p>
        </div>
      </div>
    </div>
  );
}
