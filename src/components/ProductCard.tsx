import React from 'react';
import type { Product } from '../types';
import { Price } from './Price';
import { ShoppingCart, Star } from 'lucide-react';

interface ProductCardProps {
    product: Product;
    onAddToCart?: (product: Product) => void;
    onClick?: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
    product,
    onAddToCart,
    onClick,
}) => {
    const displayPrice = product.discount_price || product.price;
    const hasDiscount = !!product.discount_price;

    return (
        <div
            className="bg-white rounded-lg shadow hover:shadow-xl transition duration-300 overflow-hidden cursor-pointer"
            onClick={onClick}
        >
            {/* Image */}
            <div className="relative h-56 bg-gray-200 overflow-hidden">
                <img
                    src={product.image}
                    alt={product.title}
                    className="w-full h-full object-cover hover:scale-105 transition duration-300"
                />
                {hasDiscount && (
                    <div className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                        -
                        {Math.round(
                            ((product.price - product.discount_price!) / product.price) * 100
                        )}
                        %
                    </div>
                )}
                {!product.in_stock && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <span className="text-white font-bold text-lg">Rupture de stock</span>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-4">
                <div className="text-sm text-gray-500 mb-2">{product.category}</div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2">
                    {product.title}
                </h3>

                {/* Rating */}
                <div className="flex items-center space-x-1 mb-3">
                    <div className="flex text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                            <Star
                                key={i}
                                size={16}
                                fill={i < Math.round(product.rating) ? 'currentColor' : 'none'}
                            />
                        ))}
                    </div>
                    <span className="text-sm text-gray-600">
                        ({product.reviews_count})
                    </span>
                </div>

                {/* Price */}
                <div className="flex items-center space-x-2 mb-4">
                    <Price price={displayPrice} className="text-2xl font-bold text-purple-600" />
                    {hasDiscount && (
                        <Price price={product.price} className="text-lg text-gray-500 line-through" />
                    )}
                </div>

                {/* Add to Cart Button */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onAddToCart?.(product);
                    }}
                    disabled={!product.in_stock}
                    className={`w-full py-2 rounded-lg font-semibold flex items-center justify-center space-x-2 transition ${product.in_stock
                            ? 'bg-purple-600 text-white hover:bg-purple-700'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                >
                    <ShoppingCart size={18} />
                    <span>{product.in_stock ? 'Ajouter au panier' : 'Indisponible'}</span>
                </button>
            </div>
        </div>
    );
};
