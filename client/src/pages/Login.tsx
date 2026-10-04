import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { AuthLayout } from '../layouts/AuthLayout';
import { Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const { login, isAuthenticated, loading: authLoading } = useAuth();
  const { addToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!authLoading && isAuthenticated) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    try { await login(email, password); addToast('Welcome back!', 'success'); }
    catch (err: any) { setError(err.response?.data?.message || 'Invalid credentials'); }
    finally { setLoading(false); }
  };

  return (
    <AuthLayout>
      <h2 className="text-2xl font-bold text-slate-900 mb-1">Welcome back</h2>
      <p className="text-sm text-slate-500 mb-6">Sign in to your account</p>
      {error && <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg mb-4">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="label">Email</label>
          <input id="email" type="email" className="input" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required autoFocus />
        </div>
        <div>
          <label htmlFor="password" className="label">Password</label>
          <div className="relative">
            <input id="password" type={showPw ? 'text' : 'password'} className="input pr-10" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
            <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" aria-label={showPw ? 'Hide password' : 'Show password'}>
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <button type="submit" className="btn-primary w-full" disabled={loading}>{loading ? 'Signing in...' : 'Sign In'}</button>
      </form>
      <p className="text-sm text-slate-500 text-center mt-6">Don't have an account? <Link to="/register" className="text-emerald-600 font-medium hover:underline">Sign up</Link></p>
    </AuthLayout>
  );
}
