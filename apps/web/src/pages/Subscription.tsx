import { Link } from 'react-router-dom';

export default function Subscription() {
  return (
    <div className="max-w-lg mx-auto space-y-6 pb-20">
      <h1 className="text-2xl font-bold text-emerald-900">Subscription</h1>
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-sm text-emerald-900">
        <p className="font-semibold text-lg mb-2">All features enabled</p>
        <p>
          Payments are turned off during development. Every account has full access:
          unlimited plants, diagnosis, identification, and advanced care tasks.
        </p>
        <Link to="/garden" className="inline-block mt-4 text-emerald-700 font-medium hover:underline">
          Back to garden →
        </Link>
      </div>
    </div>
  );
}
