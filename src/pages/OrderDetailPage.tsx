import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Package } from 'lucide-react';
import api, { type OrderDetails } from '../services/api';
import { Price } from '../components/Price';
import { useAuth } from '../context/AuthContext';

export const OrderDetailPage: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const { isAdmin } = useAuth();

    const [order, setOrder] = useState<OrderDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadOrder = async () => {
            const numericId = Number(id);

            if (Number.isNaN(numericId)) {
                navigate('/profile');
                return;
            }

            try {
                setIsLoading(true);
                const found = await api.getOrderById(numericId);
                setOrder(found);
            } catch {
                navigate('/profile');
            } finally {
                setIsLoading(false);
            }
        };

        loadOrder();
    }, [id, navigate]);

    if (isLoading) {
        return (
            <div className="bg-gray-50 min-h-screen py-12 px-4">
                <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
                    <div className="h-8 bg-gray-200 rounded w-1/3 mb-6 animate-pulse"></div>
                    <div className="h-24 bg-gray-200 rounded mb-4 animate-pulse"></div>
                    <div className="h-24 bg-gray-200 rounded animate-pulse"></div>
                </div>
            </div>
        );
    }

    if (!order) {
        return null;
    }

    const statusLabel =
        order.status === 'completed'
            ? 'Livree'
            : order.status === 'pending'
                ? 'En cours'
                : 'Annulee';

    return (
        <div className="bg-gray-50 min-h-screen py-12 px-4">
            <div className="max-w-4xl mx-auto">
                <button
                    onClick={() => navigate('/profile')}
                    className="inline-flex items-center gap-2 text-gray-700 hover:text-purple-600 transition mb-6"
                >
                    <ArrowLeft size={18} />
                    Retour au profil
                </button>

                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">Commande #{order.id}</h1>
                            <p className="text-gray-600 mt-1">
                                {new Date(order.created_at).toLocaleDateString('fr-FR')}
                            </p>
                        </div>
                        <span className="px-3 py-1 rounded-full text-sm font-bold bg-purple-100 text-purple-800">
                            {statusLabel}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-gray-500 text-sm">Articles</p>
                            <p className="text-xl font-bold text-gray-800">{order.items_count}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-gray-500 text-sm">Total</p>
                            <p className="text-xl font-bold text-purple-600"><Price price={order.total} /></p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-gray-500 text-sm">Statut</p>
                            <p className="text-xl font-bold text-gray-800">{statusLabel}</p>
                        </div>
                    </div>

                    {isAdmin && order.user && (
                        <div className="border rounded-lg p-4 mb-6 bg-blue-50 border-blue-200">
                            <h2 className="text-lg font-semibold text-gray-800 mb-2">Acheteur</h2>
                            <p className="text-sm text-gray-700">
                                <span className="font-semibold">Nom:</span> {order.user.name}
                            </p>
                            <p className="text-sm text-gray-700">
                                <span className="font-semibold">Email:</span> {order.user.email}
                            </p>
                            <p className="text-sm text-gray-700">
                                <span className="font-semibold">ID utilisateur:</span> {order.user.id}
                            </p>
                        </div>
                    )}

                    <div className="border rounded-lg p-4">
                        <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                            <Package size={18} />
                            Produits de la commande
                        </h2>

                        {order.items && order.items.length > 0 ? (
                            <div className="space-y-3">
                                {order.items.map((item, index) => (
                                    <div key={`${item.product_id}-${index}`} className="flex justify-between text-sm">
                                        <span className="text-gray-700">
                                            {item.product?.title || `Produit #${item.product_id}`}
                                        </span>
                                        <span className="text-gray-600">x{item.quantity}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-sm">Details produits indisponibles.</p>
                        )}
                    </div>

                    <div className="mt-6">
                        <Link
                            to="/products"
                            className="inline-flex items-center justify-center bg-purple-700 !text-white font-bold px-5 py-2.5 rounded-lg border border-purple-800 hover:bg-purple-800 hover:!text-white transition shadow-sm"
                        >
                            Continuer les achats
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};
