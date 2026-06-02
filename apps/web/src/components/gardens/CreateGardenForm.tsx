import { FormEvent, useState } from 'react';
import { Button, Input } from '../ui';
import { FormError } from '../a11y/FormError';
import { gardensApi, type GardenSummary } from '../../services/api';

type GardenEnvironment = 'Indoor' | 'Outdoor';

/**
 * Create-a-garden form. Reused on the My Gardens page and in the garden-first Add Plant
 * flow. Calls back with the created garden so the caller can navigate / select it.
 */
export function CreateGardenForm({
  onCreated,
  submitLabel = 'Create garden',
}: {
  onCreated: (garden: GardenSummary) => void;
  submitLabel?: string;
}) {
  const [name, setName] = useState('');
  const [environment, setEnvironment] = useState<GardenEnvironment>('Indoor');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Give your garden a name.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const { data } = await gardensApi.create(name.trim(), environment);
      onCreated(data);
      setName('');
      setEnvironment('Indoor');
    } catch {
      setError('Could not create the garden. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Input
        label="Garden name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Living Room Plants"
        maxLength={80}
        required
      />
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-gray-700">Growing environment</legend>
        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Growing environment">
          {(['Indoor', 'Outdoor'] as const).map((option) => (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={environment === option}
              onClick={() => setEnvironment(option)}
              className={`min-h-11 rounded-2xl border px-3 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                environment === option
                  ? 'border-emerald-700 bg-emerald-700 text-white'
                  : 'border-emerald-100 bg-white text-emerald-900 hover:bg-emerald-50'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </fieldset>
      {error ? <FormError>{error}</FormError> : null}
      <Button type="submit" fullWidth disabled={saving} aria-busy={saving}>
        {saving ? 'Creating…' : submitLabel}
      </Button>
    </form>
  );
}
