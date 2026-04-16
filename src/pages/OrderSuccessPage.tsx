import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, Package, User } from 'lucide-react';
import api from '../services/api';
import { Price } from '../components/Price';

interface OrderSuccessState {
    orderId?: number;
    total?: number;
    itemsCount?: number;
}

interface OrderSummary {
    id: number;
    total: number;
    items_count: number;
    created_at: string;
    status: string;
}

export const OrderSuccessPage: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const location = useLocation();
    const state = (location.state || {}) as OrderSuccessState;

    const [order, setOrder] = useState<OrderSummary | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const orderId = useMemo(() => {
        if (state.orderId) return state.orderId;
        const numericId = Number(id);
        return Number.isNaN(numericId) ? null : numericId;
    }, [id, state.orderId]);

    useEffect(() => {
        const hydratedFromState = () => {
            if (!orderId || !state.total || !state.itemsCount) {
                return false;
            }

            setOrder({
                id: orderId,
                total: state.total,
                items_count: state.itemsCount,
                created_at: new Date().toISOString(),
                status: 'completed',
            });
            return true;
        };

        const loadOrder = async () => {
            if (!orderId) {
                navigate('/profile');
                return;
            }

            if (hydratedFromState()) {
                return;
            }

            try {
                setIsLoading(true);
                const history = await api.getUserOrderHistory();
                const found = history.find((entry) => entry.id === orderId);
                if (!found) {
                    navigate('/profile');
                    return;
                }
                setOrder({
                    id: found.id,
                    total: found.total,
                    items_count: found.items_count,
                    created_at: found.created_at,
                    status: found.status,
                });
            } catch {
                navigate('/profile');
            } finally {
                setIsLoading(false);
            }
        };

        loadOrder();
    }, [navigate, orderId, state.itemsCount, state.total]);

    if (isLoading || !order) {
        return (
            <div className="bg-gray-50 min-h-screen py-16 px-4">
                <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md p-8">
                    <div className="h-8 bg-gray-200 rounded w-2/3 mb-4 animate-pulse"></div>
                    <div className="h-5 bg-gray-200 rounded w-full mb-2 animate-pulse"></div>
                    <div className="h-5 bg-gray-200 rounded w-4/5 mb-8 animate-pulse"></div>
                    <div className="h-28 bg-gray-200 rounded animate-pulse"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-100 min-h-screen py-14 px-4">
            <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg p-8 md:p-10">
                <div className="flex items-center justify-center mb-5">
                    <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle2 size={44} className="text-green-700" />
                    </div>
                </div>

                <h1 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-3">
                    Paiement confirmé
                </h1>
                <p className="text-center text-gray-800 mb-8">
                    Merci pour votre commande. Nous avons bien reçu votre paiement.
                </p>

                <div className="rounded-xl border border-gray-300 bg-gray-50 p-5 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-gray-900">
                        <div>
                            <p className="text-sm text-gray-700 mb-1">Numéro de commande</p>
                            <p className="font-bold text-lg text-gray-900">#{order.id}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-700 mb-1">Date</p>
                            <p className="font-semibold text-gray-900">
                                {new Date(order.created_at).toLocaleDateString('fr-FR')}
                            </p>
                        </div>
                        <div className="flex items-center gap-2 text-gray-900">
                            <Package size={18} className="text-purple-700" />
                            <span>{order.items_count} article(s)</span>
                        </div>
                        <div className="text-lg font-bold text-purple-700">
                            <Price price={order.total} />
                        </div>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    <Link
                        to="/profile"
                        className="flex-1 inline-flex items-center justify-center gap-2 bg-purple-800 border-2 border-purple-800 text-white font-bold py-3 rounded-lg hover:bg-purple-900 transition"
                    >
                        <User size={18} />
                        Voir commande
                    </Link>
                    <Link
                        to="/products"
                        className="flex-1 inline-flex items-center justify-center gap-2 bg-white border-2 border-gray-500 text-gray-900 font-bold py-3 rounded-lg hover:bg-gray-100 transition"
                    >
                        Continuer les achats
                    </Link>
                </div>
            </div>
        </div>
    );
};