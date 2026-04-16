export type Currency = 'EUR' | 'USD' | 'GBP' | 'CAD' | 'JPY' | 'XOF';

export interface CurrencyConfig {
    symbol: string;
    code: string;
    name: string;
    rate: number; // relative to EUR
}

export const CURRENCIES: Record<Currency, CurrencyConfig> = {
    EUR: {
        symbol: '€',
        code: 'EUR',
        name: 'Euro',
        rate: 1,
    },
    USD: {
        symbol: '$',
        code: 'USD',
        name: 'Dollar US',
        rate: 1.08,
    },
    GBP: {
        symbol: '£',
        code: 'GBP',
        name: 'Livre Sterling',
        rate: 0.86,
    },
    CAD: {
        symbol: 'C$',
        code: 'CAD',
        name: 'Dollar Canadien',
        rate: 1.46,
    },
    JPY: {
        symbol: '¥',
        code: 'JPY',
        name: 'Yen Japonais',
        rate: 160.5,
    },
    XOF: {
        symbol: 'CFA',
        code: 'XOF',
        name: 'Franc CFA',
        rate: 655.957,
    },
};

export const formatPrice = (price: number, currency: Currency = 'EUR'): string => {
    const config = CURRENCIES[currency];
    const convertedPrice = price * config.rate;

    // JPY and XOF are commonly shown without decimals
    if (currency === 'JPY' || currency === 'XOF') {
        return `${Math.round(convertedPrice)} ${config.symbol}`;
    }

    return `${convertedPrice.toFixed(2)}${config.symbol}`;
};

export const convertPrice = (price: number, toCurrency: Currency): number => {
    const config = CURRENCIES[toCurrency];
    return price * config.rate;
};
