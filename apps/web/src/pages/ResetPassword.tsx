import { FormEvent, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { authApi } from '../services/api';

export default function ResetPassword() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    if (!token) {
      setError('Invalid reset link');
      return;
    }
    setLoading(true);
    try {
      await authApi.resetPassword(token, password);
      navigate('/login', { state: { message: 'Password updated. Please sign in.' } });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Could not reset password. The link may have expired.');
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
        <h1 className="text-2xl font-bold text-emerald-800">Set new password</h1>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <input
          type="password"
          placeholder="New password (min 8 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          className="w-full border border-gray-200 rounded-lg px-3 py-2"
        />
        <input
          type="password"
          placeholder="Confirm password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          minLength={8}
          className="w-full border border-gray-200 rounded-lg px-3 py-2"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-700 text-white py-2 rounded-lg font-medium hover:bg-emerald-800 disabled:opacity-50"
        >
          {loading ? 'Saving…' : 'Update password'}
        </button>
        <p className="text-sm text-center text-gray-600">
          <Link to="/login" className="text-emerald-700 font-medium">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
