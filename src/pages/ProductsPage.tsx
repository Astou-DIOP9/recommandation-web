import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Product } from '../types';
import { ProductCard } from '../components/ProductCard';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Search } from 'lucide-react';

export const ProductsPage: React.FC = () => {
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const { isAuthenticated } = useAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [sortBy, setSortBy] = useState('newest');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [categories, setCategories] = useState<string[]>([]);

    useEffect(() => {
        const loadProducts = async () => {
            try {
                setIsLoading(true);
                const data = await api.getProducts({
                    page: currentPage,
                    per_page: 12,
                    search: searchQuery,
                    category: selectedCategory,
                    sort: sortBy,
                });
                setProducts(data.data);
                setTotalPages(data.pages);

                // Extract unique categories
                const uniqueCategories = Array.from(
                    new Set(data.data.map(p => p.category))
                );
                setCategories(uniqueCategories);
            } catch (err) {
                console.error('Error loading products:', err);
            } finally {
                setIsLoading(false);
            }
        };

        loadProducts();
    }, [currentPage, searchQuery, selectedCategory, sortBy]);

    const handleAddToCart = async (product: Product) => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        try {
            await addToCart(product, 1);
            alert('Produit ajouté au panier');
        } catch (err) {
            alert('Erreur lors de l\'ajout au panier');
        }
    };

    const handleProductClick = (productId: number) => {
        navigate(`/products/${productId}`);
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setCurrentPage(1);
    };

    return (
        <div className="bg-gray-50 min-h-screen py-12 px-4">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-4xl font-bold text-gray-800 mb-8">Nos Produits</h1>

                {/* Search Bar */}
                <form onSubmit={handleSearch} className="mb-8">
                    <div className="relative">
                        <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Rechercher un produit..."
                            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                        />
                    </div>
                </form>
                {/* Category Filter */}
                <div className="mb-8">
                    <h3 className="font-semibold text-gray-800 mb-3">Catégories</h3>
                    <div className="flex flex-wrap gap-4">
                        {categories.map(category => (
                            <label key={category} className="flex items-center">
                                <input
                                    type="radio"
                                    name="category"
                                    value={category}
                                    checked={selectedCategory === category}
                                    onChange={e => {
                                        setSelectedCategory(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="w-4 h-4 text-purple-600 cursor-pointer"
                                />
                                <span className="ml-2 text-gray-700 cursor-pointer">
                                    {category}
                                </span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Sort Filter */}
                <div>
                    <h3 className="font-semibold text-gray-800 mb-3">Trier par</h3>
                    <select
                        value={sortBy}
                        onChange={e => {
                            setSortBy(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-purple-600"
                    >
                        <option value="newest">Plus récents</option>
                        <option value="price-asc">Prix croissant</option>
                        <option value="price-desc">Prix décroissant</option>
                        <option value="rating">Meilleures notes</option>
                        <option value="popular">Les plus populaires</option>
                    </select>
                </div>

                {/* Products Grid */}
                <div className="lg:col-span-3 mt-8">
                    {isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[...Array(6)].map((_, i) => (
                                <div
                                    key={i}
                                    className="bg-gray-200 rounded-lg h-80 animate-pulse"
                                ></div>
                            ))}
                        </div>
                    ) : (
                        <>
                            {products.length > 0 ? (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                                        {products.map(product => (
                                            <ProductCard
                                                key={product.id}
                                                product={product}
                                                onAddToCart={handleAddToCart}
                                                onClick={() => handleProductClick(product.id)}
                                            />
                                        ))}
                                    </div>

                                    {/* Pagination */}
                                    {totalPages > 1 && (
                                        <div className="flex justify-center gap-2">
                                            <button
                                                onClick={() =>
                                                    setCurrentPage(Math.max(1, currentPage - 1))
                                                }
                                                disabled={currentPage === 1}
                                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                            >
                                                ← Précédent
                                            </button>

                                            {Array.from({ length: totalPages }).map((_, i) => (
                                                <button
                                                    key={i + 1}
                                                    onClick={() => setCurrentPage(i + 1)}
                                                    className={`w-10 h-10 rounded-lg transition ${currentPage === i + 1
                                                        ? 'bg-purple-600 text-white'
                                                        : 'border border-gray-300 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    {i + 1}
                                                </button>
                                            ))}

                                            <button
                                                onClick={() =>
                                                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                                                }
                                                disabled={currentPage === totalPages}
                                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                            >
                                                Suivant →
                                            </button>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="text-center py-12">
                                    <p className="text-gray-500 text-lg">
                                        Aucun produit ne correspond à votre recherche
                                    </p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
