import { FormEvent, useState } from 'react';
import { Button, Input } from '../ui';
import { FormError } from '../a11y/FormError';
import { gardensApi, type GardenSummary } from '../../services/api';

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
  const [location, setLocation] = useState('');
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
      const { data } = await gardensApi.create(name.trim(), location.trim() || undefined);
      onCreated(data);
      setName('');
      setLocation('');
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
      <Input
        label="Location (optional)"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        placeholder="e.g. South-facing window"
        maxLength={120}
      />
      {error ? <FormError>{error}</FormError> : null}
      <Button type="submit" fullWidth disabled={saving} aria-busy={saving}>
        {saving ? 'Creating…' : submitLabel}
      </Button>
    </form>
  );
}
