import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../services/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const { data } = await authApi.forgotPassword(email);
      setMessage(data.message);
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string | string[] }; status?: number }; message?: string };
      const raw = ax.response?.data?.message;
      const msg = Array.isArray(raw) ? raw.join(' ') : raw;
      if (!ax.response) {
        setError('Cannot reach the API. Start the server (npm run dev) and try again.');
      } else {
        setError(msg || 'Could not send reset email.');
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
        <h1 className="text-2xl font-bold text-emerald-800">Forgot password</h1>
        <p className="text-sm text-gray-600">
          Enter your email and we will send a link to reset your password.
        </p>
        {message && <p className="text-emerald-700 text-sm">{message}</p>}
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full border border-gray-200 rounded-lg px-3 py-2"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-700 text-white py-2 rounded-lg font-medium hover:bg-emerald-800 disabled:opacity-50"
        >
          {loading ? 'Sending…' : 'Send reset link'}
        </button>
        <p className="text-sm text-center text-gray-600">
          <Link to="/login" className="text-emerald-700 font-medium">
            Back to sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
