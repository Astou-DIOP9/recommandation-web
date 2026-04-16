import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Product } from '../types';
import { ProductCard } from '../components/ProductCard';
import { APIErrorAlert } from '../components/APIErrorAlert';
import { DemoModeBanner } from '../components/DemoModeBanner';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { DEMO_PRODUCTS } from '../services/mockData';
import { getErrorMessage, isNetworkError } from '../utils/errorHandler';

export const HomePage: React.FC = () => {
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const { isAuthenticated } = useAuth();
    const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [isUsingDemo, setIsUsingDemo] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            try {
                setIsLoading(true);
                setError('');
                setIsUsingDemo(false);

                // Charger les recommandations si l'utilisateur est connecté
                if (isAuthenticated) {
                    try {
                        const recommendations = await api.getRecommendations({ limit: 6 });
                        const recommedProducts = recommendations
                            .map(rec => rec.product)
                            .filter(Boolean) as Product[];
                        setRecommendedProducts(recommedProducts);
                    } catch (recErr) {
                        console.error('Erreur lors du chargement des recommandations:', recErr);
                    }
                }

                // Charger tous les produits (afficher jusqu'à 100)
                const productsData = await api.getProducts({ per_page: 100 });
                setAllProducts(productsData.data);
            } catch (err) {
                const networkError = isNetworkError(err);

                if (networkError) {
                    // Utiliser les données de démonstration
                    setIsUsingDemo(true);
                    setAllProducts(DEMO_PRODUCTS.slice(0, 100));
                    setError('');
                } else {
                    const errorMessage = getErrorMessage(err);
                    setError(errorMessage);
                    console.error('Erreur API:', err);
                }
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated]);

    const handleAddToCart = async (product: Product) => {
        try {
            if (!isAuthenticated) {
                navigate('/login');
                return;
            }
            await addToCart(product, 1);
            alert('Produit ajouté au panier');
        } catch (err) {
            alert('Erreur lors de l\'ajout au panier');
        }
    };

    const handleProductClick = (productId: number) => {
        navigate(`/products/${productId}`);
    };

    return (
        <div className="bg-gray-50 min-h-screen">
            <section className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-16 px-4">
                <div className="max-w-7xl mx-auto text-center">
                    <div className="flex justify-center mb-4 text-5xl"></div>
                    <h1 className="text-4xl font-bold mb-4">Système de Recommandation</h1>
                    <p className="text-xl text-purple-100">
                        Découvrez les produits sélectionnés spécialement pour vous
                    </p>
                </div>
            </section>

            {/* Recommended Section */}
            {isAuthenticated && recommendedProducts.length > 0 && (
                <section className="py-12 px-4">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex items-center space-x-3 mb-8">
                            <h2 className="text-3xl font-bold text-gray-800">Recommandés pour vous</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {recommendedProducts.map(product => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    onAddToCart={handleAddToCart}
                                    onClick={() => handleProductClick(product.id)}
                                />
                            ))}
                        </div>
                    </div>
                </section>
            )}

            <section className="py-12 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center space-x-3 mb-8">
                        <h2 className="text-3xl font-bold text-gray-800">Tous les produits</h2>
                    </div>

                    {isUsingDemo && <DemoModeBanner />}

                    {error && isNetworkError(new Error(error)) && (
                        <div className="mb-8">
                            <APIErrorAlert onRetry={() => window.location.reload()} />
                        </div>
                    )}

                    {error && !isNetworkError(new Error(error)) && (
                        <div className="bg-red-50 border-2 border-red-300 rounded-lg mb-6 p-6">
                            <p className="text-red-700">{error}</p>
                        </div>
                    )}

                    {isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="bg-gray-200 rounded-lg h-80 animate-pulse"></div>
                            ))}
                        </div>
                    ) : (
                        <>
                            {allProducts.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {allProducts.map(product => (
                                        <ProductCard
                                            key={product.id}
                                            product={product}
                                            onAddToCart={handleAddToCart}
                                            onClick={() => handleProductClick(product.id)}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <p className="text-gray-500 text-lg">Aucun produit trouvé</p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </section>
        </div>
    );
};
