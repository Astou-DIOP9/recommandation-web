import React from 'react';
import { useCurrency } from '../context/CurrencyContext';
import { formatPrice } from '../utils/currency';

interface PriceProps {
    price: number;
    className?: string;
}

export const Price: React.FC<PriceProps> = ({ price, className = '' }) => {
    const { currency } = useCurrency();
    return <span className={className}>{formatPrice(price, currency)}</span>;
};
