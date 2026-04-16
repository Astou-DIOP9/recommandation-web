import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { Product, Review } from '../types';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Star, ShoppingCart, Heart } from 'lucide-react';
import { Price } from '../components/Price';

const LOCAL_FAVORITES_KEY = 'favorite_product_ids';

const getStoredFavoriteIds = (): number[] => {
    const raw = localStorage.getItem(LOCAL_FAVORITES_KEY);
    if (!raw) return [];

    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'number') : [];
    } catch {
        return [];
    }
};

const setStoredFavoriteIds = (ids: number[]) => {
    localStorage.setItem(LOCAL_FAVORITES_KEY, JSON.stringify(ids));
};

export const ProductDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const productId = Number(id);
    const { isAuthenticated } = useAuth();
    const { addToCart } = useCart();
    const [product, setProduct] = useState<Product | null>(null);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);
    const [isFavorite, setIsFavorite] = useState(false);

    useEffect(() => {
        if (!productId || Number.isNaN(productId)) return;

        let isMounted = true;

        const loadProductFast = async () => {
            try {
                setIsLoading(true);

                const productData = await api.getProductById(productId);
                if (!isMounted) return;

                setProduct(productData);
                setIsFavorite(getStoredFavoriteIds().includes(productData.id));
                setIsLoading(false);

                const [reviewsResult, relatedResult] = await Promise.allSettled([
                    api.getProductReviews(productId, { per_page: 10 }),
                    api.getProductRecommendations(productId),
                ]);

                if (!isMounted) return;

                if (reviewsResult.status === 'fulfilled') {
                    setReviews(reviewsResult.value.data);
                }

                if (relatedResult.status === 'fulfilled') {
                    setRelatedProducts(relatedResult.value.slice(0, 4));
                }
            } catch (err) {
                console.error('Error loading product:', err);
                if (isMounted) setIsLoading(false);
            }
        };

        loadProductFast();

        return () => {
            isMounted = false;
        };
    }, [productId]);

    const handleToggleFavorite = () => {
        if (!product) return;

        const currentIds = getStoredFavoriteIds();
        const alreadyFavorite = currentIds.includes(product.id);

        if (alreadyFavorite) {
            const updatedIds = currentIds.filter((candidateId) => candidateId !== product.id);
            setStoredFavoriteIds(updatedIds);
            setIsFavorite(false);
            return;
        }

        const updatedIds = Array.from(new Set([...currentIds, product.id]));
        setStoredFavoriteIds(updatedIds);
        setIsFavorite(true);
    };

    const handleAddToCart = async () => {
        if (!product) return;

        if (!isAuthenticated) {
            alert('Veuillez vous connecter pour ajouter au panier');
            return;
        }

        try {
            await addToCart(product, quantity);
            setQuantity(1);
            alert('Produit ajouté au panier');
        } catch (err) {
            alert('Erreur lors de l\'ajout au panier');
        }
    };

    const handleSubmitReview = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isAuthenticated) {
            alert('Veuillez vous connecter pour laisser un avis');
            return;
        }

        if (rating === 0) {
            alert('Veuillez attribuer une note');
            return;
        }

        if (!id) return;

        try {
            setIsSubmittingReview(true);
            await api.createReview(parseInt(id), {
                rating,
                comment,
            });

            // Rafraîchir les avis
            const reviewsData = await api.getProductReviews(parseInt(id), { per_page: 10 });
            setReviews(reviewsData.data);

            setRating(0);
            setComment('');
            alert('Avis publié avec succès');
        } catch (err) {
            alert('Erreur lors de la publication de l\'avis');
        } finally {
            setIsSubmittingReview(false);
        }
    };

    if (isLoading) {
        return (
            <div className="bg-gray-50 min-h-screen py-12 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="bg-gray-200 rounded-lg h-96 animate-pulse"></div>
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="bg-gray-50 min-h-screen py-12 px-4">
                <div className="max-w-7xl mx-auto text-center">
                    <h1 className="text-2xl font-bold text-gray-800">Produit non trouvé</h1>
                </div>
            </div>
        );
    }

    const displayPrice = product.discount_price || product.price;
    const hasDiscount = !!product.discount_price;

    return (
        <div className="bg-gray-50 min-h-screen py-12 px-4">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white rounded-lg shadow-lg p-8 mb-12">
                    <div className="flex items-center justify-center bg-gray-100 rounded-lg">
                        <img
                            src={product.image}
                            alt={product.title}
                            className="max-h-96 object-contain"
                        />
                    </div>

                    <div>
                        <div className="text-sm text-gray-500 mb-2">{product.category}</div>
                        <h1 className="text-4xl font-bold text-gray-800 mb-4">{product.title}</h1>

                        <div className="flex items-center space-x-2 mb-6">
                            <div className="flex text-yellow-400">
                                {[...Array(5)].map((_, i) => (
                                    <Star
                                        key={i}
                                        size={24}
                                        fill={i < Math.round(product.rating) ? 'currentColor' : 'none'}
                                    />
                                ))}
                            </div>
                            <span className="text-gray-600">
                                {product.rating.toFixed(1)} ({product.reviews_count} avis)
                            </span>
                        </div>

                        <p className="text-gray-600 text-lg mb-6">{product.description}</p>

                        <div className="flex items-center gap-4 mb-6">
                            <span className="text-4xl font-bold text-purple-600">
                                <Price price={displayPrice} />
                            </span>
                            {hasDiscount && (
                                <>
                                    <span className="text-2xl text-gray-500 line-through">
                                        <Price price={product.price} />
                                    </span>
                                    <span className="bg-red-500 text-white px-3 py-1 rounded-full font-bold">
                                        -
                                        {Math.round(
                                            ((product.price - product.discount_price!) / product.price) *
                                            100
                                        )}
                                        %
                                    </span>
                                </>
                            )}
                        </div>

                        <div className="mb-6">
                            {product.in_stock ? (
                                <span className="text-green-600 font-semibold">En stock</span>
                            ) : (
                                <span className="text-red-600 font-semibold">Rupture de stock</span>
                            )}
                        </div>

                        <div className="flex gap-4 mb-6">
                            <div className="flex items-center gap-3 border border-gray-300 rounded-lg">
                                <button
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    className="p-2 hover:bg-gray-100"
                                >
                                    −
                                </button>
                                <span className="w-8 text-center font-semibold">{quantity}</span>
                                <button
                                    onClick={() => setQuantity(quantity + 1)}
                                    className="p-2 hover:bg-gray-100"
                                >
                                    +
                                </button>
                            </div>

                            <button
                                onClick={handleAddToCart}
                                disabled={!product.in_stock}
                                className={`flex-1 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition ${product.in_stock
                                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    }`}
                            >
                                <ShoppingCart size={20} />
                                Ajouter au panier
                            </button>
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={handleToggleFavorite}
                                className={`flex-1 border-2 font-bold py-2 rounded-lg transition flex items-center justify-center gap-2 ${isFavorite
                                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                                    : 'bg-purple-600 text-white hover:bg-purple-700'
                                    }`}
                            >
                                <Heart size={20} fill={isFavorite ? 'currentColor' : 'none'} />
                                {isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                            </button>
                        </div>
                    </div>
                </div>

                <section className="mb-12">
                    <h2 className="text-3xl font-bold text-gray-800 mb-8">Avis Clients</h2>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <h3 className="text-2xl font-bold text-gray-800 mb-4">
                                Votre avis
                            </h3>

                            {!isAuthenticated ? (
                                <p className="text-gray-600">
                                    Veuillez vous connecter pour laisser un avis.
                                </p>
                            ) : (
                                <form onSubmit={handleSubmitReview} className="space-y-4">
                                    <div>
                                        <label className="block text-gray-700 font-semibold mb-2">
                                            Note
                                        </label>
                                        <div className="flex gap-2">
                                            {[1, 2, 3, 4, 5].map(star => (
                                                <button
                                                    key={star}
                                                    type="button"
                                                    onClick={() => setRating(star)}
                                                    className="p-1 transition"
                                                >
                                                    <Star
                                                        size={24}
                                                        className={
                                                            star <= rating
                                                                ? 'text-yellow-400 fill-yellow-400'
                                                                : 'text-gray-300'
                                                        }
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-gray-700 font-semibold mb-2">
                                            Commentaire
                                        </label>
                                        <textarea
                                            value={comment}
                                            onChange={e => setComment(e.target.value)}
                                            placeholder="Partagez votre expérience..."
                                            className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-purple-600 resize-none h-24"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isSubmittingReview}
                                        className="w-full bg-purple-600 text-white font-bold py-2 rounded-lg hover:bg-purple-700 transition disabled:bg-gray-400"
                                    >
                                        {isSubmittingReview ? 'Publication...' : 'Publier l\'avis'}
                                    </button>
                                </form>
                            )}
                        </div>

                        <div className="lg:col-span-2 space-y-4">
                            {reviews.length > 0 ? (
                                reviews.map(review => (
                                    <div key={review.id} className="bg-white rounded-lg shadow-md p-6">
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <h4 className="font-semibold text-gray-800">
                                                    {review.user_name}
                                                </h4>
                                                <div className="flex text-yellow-400">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star
                                                            key={i}
                                                            size={16}
                                                            fill={
                                                                i < review.rating ? 'currentColor' : 'none'
                                                            }
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                            <span className="text-gray-500 text-sm">
                                                {new Date(review.created_at).toLocaleDateString('fr-FR')}
                                            </span>
                                        </div>
                                        <p className="text-gray-600">{review.comment}</p>
                                    </div>
                                ))
                            ) : (
                                <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-500">
                                    Aucun avis pour le moment
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {relatedProducts.length > 0 && (
                    <section>
                        <h2 className="text-3xl font-bold text-gray-800 mb-8">
                            Produits similaires
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {relatedProducts.map(relatedProduct => (
                                <div
                                    key={relatedProduct.id}
                                    className="bg-white rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition"
                                    onClick={() =>
                                        window.location.href = `/products/${relatedProduct.id}`
                                    }
                                >
                                    <img
                                        src={relatedProduct.image}
                                        alt={relatedProduct.title}
                                        loading="lazy"
                                        className="w-full h-40 object-cover rounded-lg mb-3"
                                    />
                                    <h3 className="font-semibold text-gray-800 line-clamp-2">
                                        {relatedProduct.title}
                                    </h3>
                                    <p className="text-purple-600 font-bold mt-2">
                                        <Price price={relatedProduct.discount_price || relatedProduct.price} />
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
};
