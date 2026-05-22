import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../ui/Card';
import { buddyApi } from '../../services/api';

interface SeasonalStatus {
  active: boolean;
  event?: {
    id: string;
    title: string;
    description: string;
    emoji: string;
    shopItemIds: string[];
  };
  items?: { id: string; name: string; cost: number }[];
}

export default function SeasonalBanner() {
  const [status, setStatus] = useState<SeasonalStatus | null>(null);

  useEffect(() => {
    buddyApi
      .seasonalStatus()
      .then(({ data }) => setStatus(data))
      .catch(() => setStatus({ active: false }));
  }, []);

  if (!status?.active || !status.event) return null;

  return (
    <Card className="border-lime-300 bg-gradient-to-br from-lime-50 to-emerald-50/90">
      <p className="text-sm font-semibold text-lime-950">
        {status.event.emoji} {status.event.title}
      </p>
      <p className="mt-1 text-xs leading-relaxed text-lime-900">{status.event.description}</p>
      {status.items && status.items.length > 0 && (
        <p className="mt-2 text-xs text-lime-800">
          Limited items: {status.items.map((i) => i.name).join(', ')}
        </p>
      )}
      <Link
        to="/garden/buddy/style/shop"
        className="mt-2 inline-block text-xs font-semibold text-emerald-800 hover:underline"
      >
        Open seasonal shop →
      </Link>
    </Card>
  );
}
