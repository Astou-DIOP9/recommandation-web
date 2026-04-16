import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { Trash2, Plus, Minus } from 'lucide-react';
import { Price } from '../components/Price';

const getCategoryLabel = (category: unknown): string => {
    if (typeof category === 'string') {
        return category;
    }

    if (category && typeof category === 'object' && 'name' in category) {
        const name = (category as { name?: unknown }).name;
        if (typeof name === 'string') {
            return name;
        }
    }

    return 'General';
};

export const CartPage: React.FC = () => {
    const navigate = useNavigate();
    const { items, total, removeFromCart, updateCartItem, clearCart } = useCart();
    const safeItems = Array.isArray(items) ? items : [];

    const handleCheckout = () => {
        if (safeItems.length === 0) {
            alert('Votre panier est vide');
            return;
        }
        // Rediriger vers la page de paiement
        navigate('/checkout');
    };

    return (
        <div className="bg-gray-50 min-h-screen py-12 px-4">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-4xl font-bold text-gray-800 mb-8">Mon Panier</h1>

                {safeItems.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-md p-8 text-center">
                        <p className="text-gray-600 text-lg mb-4">Votre panier est vide</p>
                        <button
                            onClick={() => navigate('/products')}
                            className="inline-block bg-purple-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-purple-700 transition"
                        >
                            Continuer les achats
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Cart Items */}
                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                                {safeItems.map(item => (
                                    <div
                                        key={item.product_id}
                                        className="flex items-center gap-4 p-6 border-b last:border-b-0"
                                    >
                                        {/* Product Image */}
                                        <div className="w-24 h-24 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                                            {item.product?.image && (
                                                <img
                                                    src={item.product.image}
                                                    alt={item.product.title}
                                                    className="w-full h-full object-cover"
                                                />
                                            )}
                                        </div>

                                        {/* Product Info */}
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-gray-800 mb-1">
                                                {item.product?.title}
                                            </h3>
                                            <p className="text-gray-600 text-sm mb-2">
                                                {getCategoryLabel(item.product?.category)}
                                            </p>
                                            <p className="text-purple-600 font-bold text-lg">
                                                <Price price={item.product?.discount_price || item.product?.price || 0} />
                                            </p>
                                        </div>

                                        {/* Quantity Control */}
                                        <div className="flex items-center gap-2 border border-gray-300 rounded-lg">
                                            <button
                                                onClick={() =>
                                                    updateCartItem(
                                                        item.product_id,
                                                        Math.max(1, item.quantity - 1)
                                                    )
                                                }
                                                className="p-2 hover:bg-gray-100 transition"
                                            >
                                                <Minus size={16} />
                                            </button>
                                            <span className="w-8 text-center font-semibold">
                                                {item.quantity}
                                            </span>
                                            <button
                                                onClick={() => updateCartItem(item.product_id, item.quantity + 1)}
                                                className="p-2 hover:bg-gray-100 transition"
                                            >
                                                <Plus size={16} />
                                            </button>
                                        </div>

                                        <button
                                            onClick={() => removeFromCart(item.product_id)}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={clearCart}
                                className="mt-4 text-red-600 hover:text-red-700 font-semibold transition"
                            >
                                Vider le panier
                            </button>
                        </div>

                        {/* Order Summary */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-lg shadow-md p-6 sticky top-20">
                                <h2 className="text-xl font-bold text-gray-800 mb-6">
                                    Résumé de la commande
                                </h2>

                                {/* Items Count */}
                                <div className="flex justify-between text-gray-600 mb-4">
                                    <span>Nombre d'articles:</span>
                                    <span className="font-semibold">
                                        {safeItems.reduce((sum, item) => sum + item.quantity, 0)}
                                    </span>
                                </div>

                                {/* Subtotal */}
                                <div className="flex justify-between text-gray-600 mb-4 pb-4 border-b">
                                    <span>Sous-total:</span>
                                    <span className="font-semibold"><Price price={total} /></span>
                                </div>

                                {/* Shipping */}
                                <div className="flex justify-between text-gray-600 mb-4">
                                    <span>Frais de port:</span>
                                    <span className="font-semibold">Gratuit</span>
                                </div>

                                {/* Tax */}
                                <div className="flex justify-between text-gray-600 mb-4 pb-4 border-b">
                                    <span>Taxes estimées:</span>
                                    <span className="font-semibold">
                                        <Price price={total * 0.2} />
                                    </span>
                                </div>

                                {/* Total */}
                                <div className="flex justify-between text-xl font-bold text-gray-800 mb-6">
                                    <span>Total:</span>
                                    <span className="text-purple-600">
                                        <Price price={total * 1.2} />
                                    </span>
                                </div>

                                {/* Checkout Button */}
                                <button
                                    onClick={handleCheckout}
                                    className="w-full bg-purple-600 text-white font-bold py-3 rounded-lg hover:bg-purple-700 transition mb-4"
                                >
                                    Procéder au paiement
                                </button>

                                {/* Continue Shopping */}
                                <button
                                    onClick={() => navigate('/products')}
                                    className="w-full border-2 border-gray-300 text-gray-800 font-bold py-2 rounded-lg hover:bg-gray-50 transition"
                                >
                                    Continuer les achats
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
