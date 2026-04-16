import React, { createContext, useState, useContext } from 'react';
import type { Currency } from '../utils/currency';

interface CurrencyContextType {
    currency: Currency;
    setCurrency: (currency: Currency) => void;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const detectDefaultCurrency = (): Currency => {
    const locale = navigator.language || 'en-US';
    const region = locale.split('-')[1]?.toUpperCase();

    if (!region) return 'EUR';

    if (region === 'US') return 'USD';
    if (region === 'GB') return 'GBP';
    if (region === 'CA') return 'CAD';
    if (region === 'JP') return 'JPY';

    const xofRegions = ['SN', 'CI', 'ML', 'BF', 'NE', 'TG', 'BJ', 'GW'];
    if (xofRegions.includes(region)) return 'XOF';

    return 'EUR';
};

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currency, setCurrency] = useState<Currency>(() => {
        const stored = localStorage.getItem('selected_currency') as Currency | null;
        return stored || detectDefaultCurrency();
    });

    const handleSetCurrency = (newCurrency: Currency) => {
        setCurrency(newCurrency);
        localStorage.setItem('selected_currency', newCurrency);
    };

    return (
        <CurrencyContext.Provider value={{ currency, setCurrency: handleSetCurrency }}>
            {children}
        </CurrencyContext.Provider>
    );
};

export const useCurrency = () => {
    const context = useContext(CurrencyContext);
    if (!context) {
        throw new Error('useCurrency must be used within CurrencyProvider');
    }
    return context;
};
