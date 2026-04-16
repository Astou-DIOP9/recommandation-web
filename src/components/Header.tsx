import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useCurrency } from '../context/CurrencyContext';
import { ShoppingCart, LogOut, User, Menu, X, Globe, AlertCircle, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { CURRENCIES } from '../utils/currency';
import type { Currency } from '../utils/currency';

export const Header: React.FC = () => {
    const { user, isAuthenticated, isAdmin, logout, token } = useAuth();
    const { getItemCount } = useCart();
    const { currency, setCurrency } = useCurrency();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const isLocalDevMode = token === 'local-dev-token';
    const showLocalAuthBanner = import.meta.env.VITE_SHOW_LOCAL_AUTH_BANNER === 'true';

    const handleLogout = async () => {
        await logout();
        navigate('/login');
        setIsOpen(false);
    };

    return (
        <header className="bg-white shadow-md sticky top-0 z-50">
            {showLocalAuthBanner && isLocalDevMode && isAuthenticated && (
                <div className="bg-yellow-100 border-b border-yellow-300 px-4 py-2 flex items-center gap-2 text-sm text-yellow-800">
                    <AlertCircle size={16} />
                    <span>Mode développement - Authentification locale activée</span>
                </div>
            )}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center space-x-3">
                        <div className="text-2xl font-extrabold text-purple-600">
                            SysReco
                        </div>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center space-x-8">
                        <Link to="/" className="text-gray-700 hover:text-purple-600 transition">
                            Accueil
                        </Link>
                        <Link to="/products" className="text-gray-700 hover:text-purple-600 transition">
                            Produits
                        </Link>
                        <Link to="/cart" className="relative text-gray-700 hover:text-purple-600 transition flex items-center">
                            <ShoppingCart size={20} />
                            {getItemCount() > 0 && (
                                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                    {getItemCount()}
                                </span>
                            )}
                        </Link>
                    </nav>

                    {/* Right Controls */}
                    <div className="flex items-center space-x-3">
                        {/* Currency Selector */}
                        <div className="flex items-center space-x-2">
                            <Globe size={18} className="text-gray-600" />
                            <select
                                value={currency}
                                onChange={(e) => setCurrency(e.target.value as Currency)}
                                className="text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded px-2 py-1 cursor-pointer hover:border-purple-600 transition"
                                aria-label="Sélectionner la devise"
                            >
                                {(Object.keys(CURRENCIES) as Currency[]).map(curr => (
                                    <option key={curr} value={curr}>
                                        {CURRENCIES[curr].symbol} {CURRENCIES[curr].code}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Auth Links */}
                        <div className="hidden md:flex items-center space-x-4">
                            {isAdmin && (
                                <Link to="/admin" className="flex items-center gap-1 px-3 py-1.5 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition text-sm font-semibold">
                                    <ShieldCheck size={15} />
                                    <span>Panel Admin</span>
                                </Link>
                            )}
                            {isAuthenticated && user ? (
                                <>
                                    <Link
                                        to="/profile"
                                        className="flex items-center space-x-2 text-gray-700 hover:text-purple-600 transition"
                                    >
                                        <User size={20} />
                                        <span>{user.name}</span>
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center space-x-2 text-gray-700 hover:text-red-600 transition"
                                    >
                                        <LogOut size={20} />
                                        <span>Déconnexion</span>
                                    </button>
                                </>
                            ) : (
                                <Link
                                    to="/login"
                                    className="px-4 py-2 text-gray-700 border border-purple-600 rounded hover:bg-purple-50 transition"
                                >
                                    Connexion
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="md:hidden text-gray-700"
                    >
                        {isOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>

                {/* Mobile Navigation */}
                {isOpen && (
                    <div className="md:hidden pb-4 space-y-4">
                        <Link to="/" className="block text-gray-700 hover:text-purple-600">
                            Accueil
                        </Link>
                        <Link to="/products" className="block text-gray-700 hover:text-purple-600">
                            Produits
                        </Link>
                        <Link to="/cart" className="block text-gray-700 hover:text-purple-600">
                            Panier ({getItemCount()})
                        </Link>
                        {isAdmin && (
                            <Link to="/admin" className="block text-purple-700 font-semibold hover:text-purple-600" onClick={() => setIsOpen(false)}>
                                ⚙️ Administration
                            </Link>
                        )}
                        <hr />
                        {isAuthenticated && user ? (
                            <>
                                <Link to="/profile" className="block text-gray-700 hover:text-purple-600">
                                    Profil
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="block w-full text-left text-gray-700 hover:text-red-600"
                                >
                                    Déconnexion
                                </button>
                            </>
                        ) : (
                            <Link to="/login" className="block text-gray-700 hover:text-purple-600">
                                Connexion
                            </Link>
                        )}
                    </div>
                )}
            </div>
        </header>
    );
};
