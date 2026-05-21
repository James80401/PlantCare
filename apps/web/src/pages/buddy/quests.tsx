import { useState } from 'react';
import { Link } from 'react-router-dom';
import QuestCard, { type QuestCardData } from '../../components/buddy/QuestCard';
import { Card } from '../../components/ui/Card';
import { PageHeader } from '../../components/ui/PageHeader';
import { useBuddyQuests } from '../../hooks/buddy/useBuddyQuests';

export default function BuddyQuestsPage() {
  const { data, loading, error, claiming, claim, refresh } = useBuddyQuests();
  const [message, setMessage] = useState('');

  const handleClaim = async (questId: string) => {
    setMessage('');
    try {
      const result = await claim(questId);
      setMessage(`Claimed ${result.dewdropsAwarded} dewdrops!`);
    } catch {
      setMessage('Could not claim reward.');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-emerald-700">
        Loading quests…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-lg text-center text-red-700">
        {error || 'Quests unavailable'}
        <button type="button" className="mt-2 block w-full text-emerald-800" onClick={() => refresh()}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <PageHeader
        eyebrow="Plant Buddy"
        title="Quests"
        description={`${data.dewdrops} dewdrops · daily goals and achievements`}
      />

      {message && <p className="text-center text-sm text-emerald-800">{message}</p>}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-emerald-800">
          Today&apos;s quests
        </h2>
        {data.daily.map((q: QuestCardData) => (
          <QuestCard key={q.questId} quest={q} claiming={claiming} onClaim={handleClaim} />
        ))}
      </section>

      {data.monthly && (
        <section>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-emerald-800">
            Monthly challenge
          </h2>
          <Card>
            <p className="font-semibold text-emerald-950">{data.monthly.title}</p>
            <p className="mt-1 text-sm text-gray-600">{data.monthly.description}</p>
            <p className="mt-3 text-sm">
              Step {data.monthly.stepsCompleted} of {data.monthly.totalSteps}
            </p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-emerald-100">
              <div
                className="h-full rounded-full bg-lime-500"
                style={{
                  width: `${(data.monthly.stepsCompleted / data.monthly.totalSteps) * 100}%`,
                }}
              />
            </div>
            {data.monthly.nextStep && (
              <p className="mt-2 text-xs text-gray-600">Next: {data.monthly.nextStep.label}</p>
            )}
            <p className="mt-2 text-xs text-amber-800">
              Finish reward: {data.monthly.rewardDewdrops} 💧
            </p>
          </Card>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-emerald-800">
          Achievements
        </h2>
        {data.achievements.map((q: QuestCardData) => (
          <QuestCard key={q.questId} quest={q} claiming={claiming} onClaim={handleClaim} />
        ))}
      </section>

      <Link
        to="/garden/buddy"
        className="block text-center text-sm font-medium text-emerald-800 hover:underline"
      >
        ← Back to buddy
      </Link>
    </div>
  );
}
