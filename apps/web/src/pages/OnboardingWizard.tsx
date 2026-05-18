import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { PageHeader } from '../components/ui/PageHeader';
import { useAuth } from '../context/AuthContext';
import { usersApi } from '../services/api';

type Step = 'welcome' | 'experience' | 'light' | 'done';

const experienceOptions = [
  { value: 'beginner', label: 'Beginner', hint: 'New to houseplants' },
  { value: 'intermediate', label: 'Intermediate', hint: 'A few plants at home' },
  { value: 'advanced', label: 'Advanced', hint: 'Confident with care routines' },
];

const lightOptions = [
  { value: 'low', label: 'Low light', hint: 'Away from windows' },
  { value: 'medium', label: 'Medium', hint: 'Near a window, indirect sun' },
  { value: 'bright', label: 'Bright', hint: 'Strong indirect or some direct sun' },
  { value: 'outdoor', label: 'Mostly outdoor', hint: 'Patio, garden, or balcony' },
];

export default function OnboardingWizard() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [step, setStep] = useState<Step>('welcome');
  const [experienceLevel, setExperienceLevel] = useState('beginner');
  const [defaultLightLevel, setDefaultLightLevel] = useState('medium');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const finish = async (skip = false) => {
    setSaving(true);
    setError('');
    try {
      await usersApi.completeOnboarding({
        experienceLevel,
        defaultLightLevel,
        skip,
      });
      await refreshUser();
      if (skip) {
        navigate('/garden');
      } else {
        setStep('done');
      }
    } catch {
      setError('Could not save your preferences. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <PageHeader
        eyebrow="Welcome"
        title={
          step === 'welcome'
            ? 'Let’s set up your garden'
            : step === 'experience'
              ? 'Your experience'
              : step === 'light'
                ? 'Your space'
                : 'You’re ready'
        }
        description={
          step === 'welcome'
            ? 'A quick setup helps us suggest the right plants and care cadence.'
            : step === 'done'
              ? 'Add your first plant with a photo or from our catalog.'
              : undefined
        }
      />

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      {step === 'welcome' && (
        <Card className="space-y-4">
          <p className="text-sm text-gray-600 leading-relaxed">
            Plant Care reminds you what matters today, explains why each task is due, and adapts
            when weather or your feedback changes.
          </p>
          <Button fullWidth onClick={() => setStep('experience')}>
            Get started
          </Button>
          <button
            type="button"
            onClick={() => finish(true)}
            disabled={saving}
            className="w-full text-sm font-medium text-gray-500 hover:text-emerald-800"
          >
            Skip for now
          </button>
        </Card>
      )}

      {step === 'experience' && (
        <Card className="space-y-3">
          <p className="text-sm text-gray-600">How would you describe your plant care experience?</p>
          <ul className="space-y-2">
            {experienceOptions.map((opt) => (
              <li key={opt.value}>
                <button
                  type="button"
                  onClick={() => setExperienceLevel(opt.value)}
                  className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                    experienceLevel === opt.value
                      ? 'border-emerald-600 bg-emerald-50'
                      : 'border-emerald-100 hover:bg-emerald-50/50'
                  }`}
                >
                  <span className="block font-semibold text-emerald-950">{opt.label}</span>
                  <span className="block text-xs text-gray-500">{opt.hint}</span>
                </button>
              </li>
            ))}
          </ul>
          <Button fullWidth onClick={() => setStep('light')}>
            Continue
          </Button>
        </Card>
      )}

      {step === 'light' && (
        <Card className="space-y-3">
          <p className="text-sm text-gray-600">
            Where do most of your plants live? This is like a light meter quiz — we use it for
            placement tips and watering context.
          </p>
          <ul className="space-y-2">
            {lightOptions.map((opt) => (
              <li key={opt.value}>
                <button
                  type="button"
                  onClick={() => setDefaultLightLevel(opt.value)}
                  className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                    defaultLightLevel === opt.value
                      ? 'border-emerald-600 bg-emerald-50'
                      : 'border-emerald-100 hover:bg-emerald-50/50'
                  }`}
                >
                  <span className="block font-semibold text-emerald-950">{opt.label}</span>
                  <span className="block text-xs text-gray-500">{opt.hint}</span>
                </button>
              </li>
            ))}
          </ul>
          <Button fullWidth disabled={saving} onClick={() => finish(false)}>
            {saving ? 'Saving…' : 'Continue'}
          </Button>
        </Card>
      )}

      {step === 'done' && (
        <Card className="space-y-4">
          <p className="text-sm text-gray-600">
            Snap a photo to identify a plant, or browse our catalog of 320+ species.
          </p>
          <Button fullWidth onClick={() => navigate('/garden/plants/new')}>
            Add your first plant
          </Button>
          <Link
            to="/garden/plants/browse"
            className="block text-center text-sm font-semibold text-emerald-800 hover:underline"
          >
            Browse catalog instead
          </Link>
          <Button variant="ghost" fullWidth onClick={() => navigate('/garden')}>
            Go to dashboard
          </Button>
        </Card>
      )}
    </div>
  );
}
