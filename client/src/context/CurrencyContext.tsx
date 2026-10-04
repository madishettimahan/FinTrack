import React, { createContext, useContext, ReactNode, useCallback } from 'react';
import { useAuth } from './AuthContext';

interface CurrencyContextType { formatCurrency: (amount: number) => string; symbol: string }
const CurrencyContext = createContext<CurrencyContextType>({ formatCurrency: (a) => `$${a.toFixed(2)}`, symbol: '$' });
export const useCurrency = () => useContext(CurrencyContext);

const SYMBOLS: Record<string, string> = { USD: '$', INR: '₹', EUR: '€', GBP: '£' };
const LOCALES: Record<string, string> = { USD: 'en-US', INR: 'en-IN', EUR: 'de-DE', GBP: 'en-GB' };

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const currency = user?.currency || 'USD';
  const symbol = SYMBOLS[currency] || '$';

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat(LOCALES[currency] || 'en-US', { style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
  }, [currency]);

  return <CurrencyContext.Provider value={{ formatCurrency, symbol }}>{children}</CurrencyContext.Provider>;
};
