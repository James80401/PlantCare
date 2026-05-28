import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthShell } from '../components/auth/AuthShell';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../context/AuthContext';
import { trackEvent } from '../utils/analytics';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const result = await register(email, password, name || undefined);
      if (result.requiresVerification || result.requiresAdminApproval) {
        setSuccess(
          result.message ||
            'Check your email to verify your account before signing in.',
        );
        trackEvent('UserSignedUp');
        return;
      }
      trackEvent('UserSignedUp');
      navigate('/garden/onboarding');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Could not create account. Email may already be in use.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start caring for your plants with a personalized schedule"
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-emerald-800 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <Link to="/" className="text-sm font-medium text-emerald-700 hover:underline">
        ← Back to home
      </Link>
      {success ? (
        <div className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-900 space-y-2">
          <p>{success}</p>
          <Link to="/login" className="font-semibold text-emerald-800 hover:underline">
            Go to sign in
          </Link>
        </div>
      ) : null}
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      {!success ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Name (optional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
          />
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            hint="At least 8 characters"
            autoComplete="new-password"
          />
          <Button type="submit" fullWidth disabled={loading}>
            {loading ? 'Creating account…' : 'Create account'}
          </Button>
        </form>
      ) : null}
    </AuthShell>
  );
}
