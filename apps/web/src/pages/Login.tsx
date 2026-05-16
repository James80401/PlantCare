import { FormEvent, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-b from-emerald-100 to-emerald-50">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 space-y-4"
      >
        <Link to="/" className="text-sm text-emerald-600 hover:text-emerald-800">
          ← Back to home
        </Link>
        <h1 className="text-2xl font-bold text-emerald-800">Welcome back</h1>
        {notice && <p className="text-emerald-700 text-sm">{notice}</p>}
        {error && <p className="text-red-600 text-sm">{error}</p>}
        {needsVerification && (
          <p className="text-sm">
            <Link to="/resend-verification" className="text-emerald-700 font-medium">
              Resend verification email
            </Link>
          </p>
        )}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full border border-gray-200 rounded-lg px-3 py-2"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          className="w-full border border-gray-200 rounded-lg px-3 py-2"
        />
        <p className="text-right text-sm">
          <Link to="/forgot-password" className="text-emerald-700 font-medium">
            Forgot password?
          </Link>
        </p>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-700 text-white py-2 rounded-lg font-medium hover:bg-emerald-800 disabled:opacity-50"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
        <p className="text-sm text-center text-gray-600">
          No account?{' '}
          <Link to="/register" className="text-emerald-700 font-medium">
            Register
          </Link>
        </p>
      </form>
    </div>
  );
}
