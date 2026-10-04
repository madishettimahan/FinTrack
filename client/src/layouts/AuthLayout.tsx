import React from 'react';

export const AuthLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 flex items-center justify-center p-4">
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white">💰 FinanceFlow</h1>
        <p className="text-emerald-100 mt-1">Your personal finance companion</p>
      </div>
      <div className="bg-white rounded-2xl shadow-2xl p-8">{children}</div>
    </div>
  </div>
);
