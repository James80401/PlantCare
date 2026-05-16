import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
      if (result.requiresVerification) {
        setSuccess(result.message || 'Check your email to verify your account before signing in.');
        trackEvent('UserSignedUp');
        return;
      }
      trackEvent('UserSignedUp');
      navigate('/garden');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Could not create account. Email may already be in use.');
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
        <h1 className="text-2xl font-bold text-emerald-800">Create account</h1>
        {success && (
          <div className="text-emerald-700 text-sm space-y-2">
            <p>{success}</p>
            <Link to="/login" className="font-medium underline">
              Sign in after verifying
            </Link>
          </div>
        )}
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <input
          type="text"
          placeholder="Name (optional)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2"
        />
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
          placeholder="Password (min 8 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          className="w-full border border-gray-200 rounded-lg px-3 py-2"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-700 text-white py-2 rounded-lg font-medium hover:bg-emerald-800 disabled:opacity-50"
        >
          {loading ? 'Creating…' : 'Register'}
        </button>
        <p className="text-sm text-center text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="text-emerald-700 font-medium">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
