import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { AuthLayout } from '../layouts/AuthLayout';
import { Eye, EyeOff, Check, X } from 'lucide-react';

const PW_RULES = [
  { test: (p: string) => p.length >= 8, label: 'At least 8 characters' },
  { test: (p: string) => /[A-Z]/.test(p), label: 'Uppercase letter' },
  { test: (p: string) => /[a-z]/.test(p), label: 'Lowercase letter' },
  { test: (p: string) => /[0-9]/.test(p), label: 'Number' },
  { test: (p: string) => /[^A-Za-z0-9]/.test(p), label: 'Special character' },
];

export default function Register() {
  const { register, isAuthenticated, loading: authLoading } = useAuth();
  const { addToast } = useToast();
  const [name, setName] = useState(''); const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false); const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!authLoading && isAuthenticated) return <Navigate to="/dashboard" replace />;

  const allPwValid = PW_RULES.every(r => r.test(password));
  const pwMatch = password === confirmPassword && confirmPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    if (!allPwValid) { setError('Password does not meet requirements'); return; }
    if (!pwMatch) { setError('Passwords do not match'); return; }
    setLoading(true);
    try { await register(name, email, password, confirmPassword); addToast('Account created! Welcome to FinanceFlow.', 'success'); }
    catch (err: any) { setError(err.response?.data?.message || 'Registration failed'); }
    finally { setLoading(false); }
  };

  return (
    <AuthLayout>
      <h2 className="text-2xl font-bold text-slate-900 mb-1">Create an account</h2>
      <p className="text-sm text-slate-500 mb-6">Start tracking your finances today</p>
      {error && <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg mb-4">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div><label htmlFor="name" className="label">Full Name</label><input id="name" className="input" value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" required autoFocus /></div>
        <div><label htmlFor="email" className="label">Email</label><input id="email" type="email" className="input" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required /></div>
        <div>
          <label htmlFor="password" className="label">Password</label>
          <div className="relative">
            <input id="password" type={showPw ? 'text' : 'password'} className="input pr-10" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
            <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" aria-label="Toggle password">{showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
          </div>
          {password && (
            <ul className="mt-2 space-y-1">
              {PW_RULES.map(r => (
                <li key={r.label} className={`flex items-center gap-1.5 text-xs ${r.test(password) ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {r.test(password) ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}{r.label}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <label htmlFor="confirmPw" className="label">Confirm Password</label>
          <input id="confirmPw" type="password" className="input" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" required />
          {confirmPassword && !pwMatch && <p className="text-xs text-red-500 mt-1">Passwords do not match</p>}
        </div>
        <button type="submit" className="btn-primary w-full" disabled={loading}>{loading ? 'Creating account...' : 'Create Account'}</button>
      </form>
      <p className="text-sm text-slate-500 text-center mt-6">Already have an account? <Link to="/login" className="text-emerald-600 font-medium hover:underline">Sign in</Link></p>
    </AuthLayout>
  );
}
