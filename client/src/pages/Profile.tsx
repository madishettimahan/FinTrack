import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { put } from '../services/api';
import {
  User,
  Shield,
  Key,
  Globe,
  Check,
  X,
  Calendar,
} from 'lucide-react';

const PW_RULES = [
  { test: (p: string) => p.length >= 8, label: 'At least 8 characters' },
  { test: (p: string) => /[A-Z]/.test(p), label: 'Uppercase letter' },
  { test: (p: string) => /[a-z]/.test(p), label: 'Lowercase letter' },
  { test: (p: string) => /[0-9]/.test(p), label: 'Number' },
  { test: (p: string) => /[^A-Za-z0-9]/.test(p), label: 'Special character' },
];

const CURRENCIES = [
  { code: 'USD', symbol: '$', label: 'USD ($) - US Dollar' },
  { code: 'INR', symbol: '₹', label: 'INR (₹) - Indian Rupee' },
  { code: 'EUR', symbol: '€', label: 'EUR (€) - Euro' },
  { code: 'GBP', symbol: '£', label: 'GBP (£) - British Pound' },
];

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const { addToast } = useToast();

  // Profile info state
  const [name, setName] = useState(user?.name || '');
  const [currency, setCurrency] = useState(user?.currency || 'USD');
  const [profileLoading, setProfileLoading] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      addToast('Name cannot be empty', 'warning');
      return;
    }
    try {
      setProfileLoading(true);
      await updateProfile({ name: name.trim(), currency });
      addToast('Profile updated successfully', 'success');
    } catch (err: any) {
      addToast(err?.response?.data?.message || 'Failed to update profile', 'error');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const allValid = PW_RULES.every((r) => r.test(newPassword));
    if (!allValid) {
      addToast('New password does not satisfy security complexity', 'warning');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      addToast('New passwords do not match', 'warning');
      return;
    }

    try {
      setPwLoading(true);
      await put('/auth/change-password', {
        currentPassword,
        newPassword,
        confirmNewPassword,
      });
      addToast('Password changed successfully', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: any) {
      addToast(err?.response?.data?.message || 'Failed to change password', 'error');
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Account Settings</h1>
        <p className="text-sm text-slate-500">
          Manage your personal details, preferred currency, and security credentials
        </p>
      </div>

      {/* Profile Details Card */}
      <div className="card space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <User className="w-5 h-5 text-emerald-600" />
          <h2 className="text-base font-semibold text-slate-800">Personal Information</h2>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input"
                required
              />
            </div>
            <div>
              <label className="label">Email Address (Read-only)</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="input bg-slate-100 text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="label">Preferred Currency</label>
            <div className="relative max-w-sm">
              <Globe className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="input pl-9"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-2">
            <button type="submit" className="btn-primary" disabled={profileLoading}>
              {profileLoading ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Security & Password Card */}
      <div className="card space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Key className="w-5 h-5 text-emerald-600" />
          <h2 className="text-base font-semibold text-slate-800">Change Password</h2>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
          <div>
            <label className="label">Current Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="input"
              required
            />
          </div>

          <div>
            <label className="label">New Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="input"
              required
            />
            {newPassword && (
              <ul className="mt-2 space-y-1">
                {PW_RULES.map((r) => (
                  <li
                    key={r.label}
                    className={`flex items-center gap-1.5 text-xs ${
                      r.test(newPassword) ? 'text-emerald-600' : 'text-slate-400'
                    }`}
                  >
                    {r.test(newPassword) ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <X className="w-3.5 h-3.5" />
                    )}
                    {r.label}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <label className="label">Confirm New Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              className="input"
              required
            />
          </div>

          <div className="pt-2">
            <button type="submit" className="btn-secondary" disabled={pwLoading}>
              {pwLoading ? 'Updating Password...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>

      {/* Security & Membership Info */}
      <div className="card bg-slate-50 border-slate-200">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-600 space-y-1">
            <p className="font-semibold text-slate-800">Security & Privacy Protection</p>
            <p>
              Your account utilizes salted bcrypt / Argon2 hashing and isolated tenant scopes.
              Database records are only accessible via authenticated session tokens.
            </p>
            {user?.createdAt && (
              <p className="flex items-center gap-1 text-slate-400 pt-1">
                <Calendar className="w-3 h-3" />
                Member since {new Date(user.createdAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
