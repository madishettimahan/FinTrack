import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BarChart3, Shield, Target, RefreshCcw, PieChart, Wallet } from 'lucide-react';

const FEATURES = [
  { icon: Wallet, title: 'Track Expenses', desc: 'Log income and expenses with categories, payment methods, and detailed notes.' },
  { icon: PieChart, title: 'Set Budgets', desc: 'Create monthly budgets for spending categories and track your progress.' },
  { icon: Target, title: 'Savings Goals', desc: 'Set financial goals and track deposits toward what matters to you.' },
  { icon: RefreshCcw, title: 'Subscriptions', desc: 'Monitor recurring payments and never be surprised by auto-renewals.' },
  { icon: BarChart3, title: 'Analytics', desc: 'Visualize spending trends, compare months, and discover insights.' },
  { icon: Shield, title: 'Secure & Private', desc: 'Your data is protected with JWT auth, encryption, and strict access controls.' },
];

export default function Landing() {
  const { isAuthenticated } = useAuth();
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <span className="text-xl font-bold text-slate-900">💰 FinanceFlow</span>
        <div className="flex gap-3">
          {isAuthenticated ? (
            <Link to="/dashboard" className="btn-primary">Dashboard</Link>
          ) : (
            <>
              <Link to="/login" className="btn-secondary">Login</Link>
              <Link to="/register" className="btn-primary">Get Started</Link>
            </>
          )}
        </div>
      </nav>
      {/* Hero */}
      <section className="max-w-4xl mx-auto px-4 pt-20 pb-16 text-center">
        <h1 className="text-5xl sm:text-6xl font-extrabold text-slate-900 leading-tight">
          Take Control of Your <span className="text-emerald-600">Finances</span>
        </h1>
        <p className="mt-6 text-lg text-slate-600 max-w-2xl mx-auto">
          Track spending, set budgets, reach savings goals, and gain insight into your financial health — all in one secure, modern dashboard.
        </p>
        <div className="mt-8 flex gap-4 justify-center">
          <Link to="/register" className="btn-primary text-lg px-8 py-3">Start Free →</Link>
          <Link to="/login" className="btn-secondary text-lg px-8 py-3">Sign In</Link>
        </div>
      </section>
      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 pb-24">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="card hover:shadow-md transition-shadow">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
                <Icon className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">{title}</h3>
              <p className="text-sm text-slate-500">{desc}</p>
            </div>
          ))}
        </div>
      </section>
      <footer className="border-t border-slate-200 py-6 text-center text-sm text-slate-500">© {new Date().getFullYear()} FinanceFlow. Built for portfolio demonstration.</footer>
    </div>
  );
}
