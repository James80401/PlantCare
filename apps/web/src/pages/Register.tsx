import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthShell } from '../components/auth/AuthShell';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../context/AuthContext';
import { trackEvent } from '../utils/analytics';
import { formatApiErrorMessage } from '../utils/apiError';

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
    trackEvent('signup_start');
    try {
      const result = await register(email, password, name || undefined);
      if (result.requiresVerification || result.requiresAdminApproval) {
        setSuccess(
          result.message ||
            'Check your email to verify your account before signing in.',
        );
        trackEvent('signup_complete', {
          requiresVerification: result.requiresVerification,
          requiresAdminApproval: result.requiresAdminApproval,
        });
        return;
      }
      trackEvent('signup_complete', {
        requiresVerification: false,
        requiresAdminApproval: false,
      });
      navigate('/garden');
    } catch (err: unknown) {
      setError(formatApiErrorMessage(err, 'Could not create account. Email may already be in use.'));
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
          <p className="text-center text-xs leading-5 text-gray-500">
            By creating an account you agree to the{' '}
            <Link to="/terms" className="font-semibold text-emerald-800 hover:underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="font-semibold text-emerald-800 hover:underline">
              Privacy Policy
            </Link>
            .
          </p>
        </form>
      ) : null}
    </AuthShell>
  );
}
