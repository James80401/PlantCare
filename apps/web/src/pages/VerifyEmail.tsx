import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { authApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { setAccessToken } from '../services/authSession';

export default function VerifyEmail() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Missing verification token.');
      return;
    }
    authApi
      .verifyEmail(token)
      .then(async ({ data }) => {
        if (data.requiresAdminApproval) {
          setStatus('ok');
          setMessage(
            data.message ||
              'Email verified. Your account is awaiting admin approval.',
          );
          return;
        }
        if (data.accessToken) {
          setAccessToken(data.accessToken);
          await refreshUser();
        }
        setStatus('ok');
        setMessage(data.message || 'Email verified!');
        setTimeout(() => navigate('/garden'), 1500);
      })
      .catch((err) => {
        setStatus('error');
        setMessage(
          err.response?.data?.message || 'This verification link is invalid or has expired.',
        );
      });
  }, [token, navigate, refreshUser]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-b from-emerald-100 to-emerald-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 text-center space-y-4">
        <h1 className="text-2xl font-bold text-emerald-800">Email verification</h1>
        {status === 'loading' && <p className="text-gray-600">Verifying your email…</p>}
        {status === 'ok' && (
          <>
            <p className="text-emerald-700">{message}</p>
            <Link to="/login" className="text-emerald-800 font-medium text-sm block mt-2">
              Go to sign in
            </Link>
          </>
        )}
        {status === 'error' && (
          <>
            <p className="text-red-600 text-sm">{message}</p>
            <Link to="/login" className="text-emerald-700 font-medium text-sm block">
              Back to sign in
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
