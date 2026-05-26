import { FormEvent, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthShell } from '../components/auth/AuthShell';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [needsVerification, setNeedsVerification] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const msg = (location.state as { message?: string } | null)?.message;
    if (msg) setNotice(msg);
  }, [location.state]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setNeedsVerification(false);
    setLoading(true);
    try {
      await login(email, password);
      navigate('/garden');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      if (msg?.toLowerCase().includes('verify')) {
        setNeedsVerification(true);
        setError(msg);
      } else {
        setError(msg || 'Invalid email or password');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your garden"
      footer={
        <>
          No account?{' '}
          <Link to="/register" className="font-semibold text-emerald-800 hover:underline">
            Register
          </Link>
        </>
      }
    >
      <Link to="/" className="text-sm font-medium text-emerald-700 hover:underline">
        ← Back to home
      </Link>
      {import.meta.env.DEV ? (
        <p className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs leading-5 text-emerald-900">
          Local demo after <code className="rounded bg-white px-1">npm run db:seed</code>:{' '}
          <strong>demo@plantcare.local</strong> / <strong>DemoPlant1!</strong>
        </p>
      ) : null}
      {notice ? <p className="text-sm text-emerald-700">{notice}</p> : null}
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      {needsVerification ? (
        <p className="text-sm">
          <Link to="/resend-verification" className="font-semibold text-emerald-800 hover:underline">
            Resend verification email
          </Link>
        </p>
      ) : null}
      <form onSubmit={handleSubmit} className="space-y-4">
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
          autoComplete="current-password"
        />
        <p className="text-right text-sm">
          <Link to="/forgot-password" className="font-semibold text-emerald-800 hover:underline">
            Forgot password?
          </Link>
        </p>
        <Button type="submit" fullWidth disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </AuthShell>
  );
}
