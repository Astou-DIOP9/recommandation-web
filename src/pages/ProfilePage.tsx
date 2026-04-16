import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Save, Mail, User, Phone, MapPin } from 'lucide-react';
import { Price } from '../components/Price';

interface CheckoutProfileDraft {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
    cardName: string;
}

interface ProfileFieldErrors {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    postalCode?: string;
    country?: string;
}

const LOCAL_CHECKOUT_PROFILE_KEY = 'checkout_profile_draft';

const normalizeCheckoutCountry = (country?: string): string => {
    if (!country || country.trim().length === 0) return 'Senegal';
    return country.trim().toLowerCase() === 'france' ? 'Senegal' : country;
};

const getStoredCheckoutProfile = (): Partial<CheckoutProfileDraft> => {
    const raw = localStorage.getItem(LOCAL_CHECKOUT_PROFILE_KEY);
    if (!raw) return {};

    try {
        const parsed = JSON.parse(raw);
        if (!(typeof parsed === 'object' && parsed)) {
            return {};
        }

        const profile = parsed as Partial<CheckoutProfileDraft>;
        const normalizedCountry = normalizeCheckoutCountry(profile.country);

        if (normalizedCountry !== profile.country) {
            const migrated = { ...profile, country: normalizedCountry };
            localStorage.setItem(LOCAL_CHECKOUT_PROFILE_KEY, JSON.stringify(migrated));
            return migrated;
        }

        return profile;
    } catch {
        return {};
    }
};

export const ProfilePage: React.FC = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const storedCheckoutProfile = getStoredCheckoutProfile();
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
    });
    const [shippingData, setShippingData] = useState({
        phone: storedCheckoutProfile.phone || '',
        address: storedCheckoutProfile.address || '',
        city: storedCheckoutProfile.city || '',
        postalCode: storedCheckoutProfile.postalCode || '',
        country: storedCheckoutProfile.country || 'Senegal',
    });
    const [orders, setOrders] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [fieldErrors, setFieldErrors] = useState<ProfileFieldErrors>({});

    useEffect(() => {
        if (!user) return;

        setFormData((previous) => ({
            ...previous,
            name: user.name || previous.name,
            email: user.email || previous.email,
        }));
    }, [user]);

    useEffect(() => {
        if (!user) {
            navigate('/login');
        }
    }, [user, navigate]);

    useEffect(() => {
        const loadOrders = async () => {
            try {
                setIsLoading(true);
                const orderData = await api.getUserOrderHistory();
                setOrders(orderData);
            } catch (err) {
                console.error('Error loading orders:', err);
            } finally {
                setIsLoading(false);
            }
        };

        if (user) {
            loadOrders();
        }
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });

        if (fieldErrors[e.target.name as keyof ProfileFieldErrors]) {
            setFieldErrors((previous) => ({
                ...previous,
                [e.target.name]: undefined,
            }));
        }
    };

    const handleShippingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setShippingData({
            ...shippingData,
            [e.target.name]: e.target.value,
        });

        if (fieldErrors[e.target.name as keyof ProfileFieldErrors]) {
            setFieldErrors((previous) => ({
                ...previous,
                [e.target.name]: undefined,
            }));
        }
    };

    const validateForm = (): ProfileFieldErrors => {
        const nextErrors: ProfileFieldErrors = {};

        if (!formData.name.trim() || formData.name.trim().length < 2) {
            nextErrors.name = 'Le nom doit contenir au moins 2 caracteres.';
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email.trim())) {
            nextErrors.email = 'Veuillez saisir un email valide.';
        }

        const phoneRegex = /^\+?[\d\s().-]{8,}$/;
        if (!phoneRegex.test(shippingData.phone.trim())) {
            nextErrors.phone = 'Veuillez saisir un numero de telephone valide.';
        }

        if (!shippingData.address.trim() || shippingData.address.trim().length < 5) {
            nextErrors.address = 'Veuillez saisir une adresse complete.';
        }

        if (!shippingData.city.trim()) {
            nextErrors.city = 'La ville est obligatoire.';
        }

        if (!shippingData.country.trim()) {
            nextErrors.country = 'Le pays est obligatoire.';
        }

        const postalCode = shippingData.postalCode.trim();
        const isFrance = shippingData.country.trim().toLowerCase() === 'france';

        if (!postalCode) {
            nextErrors.postalCode = 'Le code postal est obligatoire.';
        } else if (isFrance && !/^\d{5}$/.test(postalCode)) {
            nextErrors.postalCode = 'Pour la France, le code postal doit contenir 5 chiffres.';
        } else if (!isFrance && !/^[A-Za-z0-9\s-]{3,10}$/.test(postalCode)) {
            nextErrors.postalCode = 'Code postal invalide.';
        }

        return nextErrors;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        const validationErrors = validateForm();
        if (Object.keys(validationErrors).length > 0) {
            setFieldErrors(validationErrors);
            setError('Veuillez corriger les champs en erreur.');
            return;
        }

        setFieldErrors({});

        try {
            setIsLoading(true);
            await api.updateProfile(formData);

            const checkoutProfileDraft: CheckoutProfileDraft = {
                fullName: formData.name,
                email: formData.email,
                phone: shippingData.phone,
                address: shippingData.address,
                city: shippingData.city,
                postalCode: shippingData.postalCode,
                country: shippingData.country,
                cardName: formData.name,
            };

            localStorage.setItem(LOCAL_CHECKOUT_PROFILE_KEY, JSON.stringify(checkoutProfileDraft));
            setSuccess('Profil et informations de livraison mis a jour avec succes');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Erreur lors de la mise à jour');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    if (!user) {
        return null;
    }

    return (
        <div className="bg-gray-50 min-h-screen py-12 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-purple-600 mb-2">Mon Profil</h1>
                    <p className="text-gray-600">Gérez vos informations personnelles et votre historique</p>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
                        {success}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Profile Form */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <h2 className="text-2xl font-bold text-gray-800 mb-6">
                                Informations Personnelles
                            </h2>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Name */}
                                <div>
                                    <label className="block text-gray-700 font-semibold mb-2">
                                        Nom complet
                                    </label>
                                    <div className="relative">
                                        <User size={20} className="absolute left-3 top-3 text-gray-400" />
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${fieldErrors.name ? 'border-red-400 focus:ring-red-500' : 'border-gray-300 focus:ring-purple-600'}`}
                                        />
                                    </div>
                                    {fieldErrors.name && <p className="text-red-600 text-sm mt-1">{fieldErrors.name}</p>}
                                </div>

                                {/* Email */}
                                <div>
                                    <label className="block text-gray-700 font-semibold mb-2">
                                        Email
                                    </label>
                                    <div className="relative">
                                        <Mail size={20} className="absolute left-3 top-3 text-gray-400" />
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${fieldErrors.email ? 'border-red-400 focus:ring-red-500' : 'border-gray-300 focus:ring-purple-600'}`}
                                        />
                                    </div>
                                    {fieldErrors.email && <p className="text-red-600 text-sm mt-1">{fieldErrors.email}</p>}
                                </div>

                                <div>
                                    <label className="block text-gray-700 font-semibold mb-2">
                                        Telephone
                                    </label>
                                    <div className="relative">
                                        <Phone size={20} className="absolute left-3 top-3 text-gray-400" />
                                        <input
                                            type="text"
                                            name="phone"
                                            value={shippingData.phone}
                                            onChange={handleShippingChange}
                                            className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${fieldErrors.phone ? 'border-red-400 focus:ring-red-500' : 'border-gray-300 focus:ring-purple-600'}`}
                                        />
                                    </div>
                                    {fieldErrors.phone && <p className="text-red-600 text-sm mt-1">{fieldErrors.phone}</p>}
                                </div>

                                <div>
                                    <label className="block text-gray-700 font-semibold mb-2">
                                        Adresse
                                    </label>
                                    <div className="relative">
                                        <MapPin size={20} className="absolute left-3 top-3 text-gray-400" />
                                        <input
                                            type="text"
                                            name="address"
                                            value={shippingData.address}
                                            onChange={handleShippingChange}
                                            className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${fieldErrors.address ? 'border-red-400 focus:ring-red-500' : 'border-gray-300 focus:ring-purple-600'}`}
                                        />
                                    </div>
                                    {fieldErrors.address && <p className="text-red-600 text-sm mt-1">{fieldErrors.address}</p>}
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-gray-700 font-semibold mb-2">
                                            Ville
                                        </label>
                                        <input
                                            type="text"
                                            name="city"
                                            value={shippingData.city}
                                            onChange={handleShippingChange}
                                            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${fieldErrors.city ? 'border-red-400 focus:ring-red-500' : 'border-gray-300 focus:ring-purple-600'}`}
                                        />
                                        {fieldErrors.city && <p className="text-red-600 text-sm mt-1">{fieldErrors.city}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-gray-700 font-semibold mb-2">
                                            Code postal
                                        </label>
                                        <input
                                            type="text"
                                            name="postalCode"
                                            value={shippingData.postalCode}
                                            onChange={handleShippingChange}
                                            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${fieldErrors.postalCode ? 'border-red-400 focus:ring-red-500' : 'border-gray-300 focus:ring-purple-600'}`}
                                        />
                                        {fieldErrors.postalCode && <p className="text-red-600 text-sm mt-1">{fieldErrors.postalCode}</p>}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-gray-700 font-semibold mb-2">
                                        Pays
                                    </label>
                                    <input
                                        type="text"
                                        name="country"
                                        value={shippingData.country}
                                        onChange={handleShippingChange}
                                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${fieldErrors.country ? 'border-red-400 focus:ring-red-500' : 'border-gray-300 focus:ring-purple-600'}`}
                                    />
                                    {fieldErrors.country && <p className="text-red-600 text-sm mt-1">{fieldErrors.country}</p>}
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-purple-600 text-white font-bold py-2 rounded-lg hover:bg-purple-700 transition disabled:bg-gray-400 flex items-center justify-center gap-2"
                                >
                                    <Save size={20} />
                                    {isLoading ? 'Enregistrement...' : 'Enregistrer les modifications'}
                                </button>
                            </form>

                            {/* Logout Button */}
                            <button
                                onClick={handleLogout}
                                className="w-full mt-4 border-2 border-red-600 text-red-600 font-bold py-2 rounded-lg hover:bg-red-50 transition"
                            >
                                Se déconnecter
                            </button>
                        </div>
                    </div>

                    {/* Order History */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <h2 className="text-2xl font-bold text-gray-800 mb-6">
                                Historique des Commandes
                            </h2>

                            {isLoading ? (
                                <div className="space-y-4">
                                    {[...Array(3)].map((_, i) => (
                                        <div key={i} className="bg-gray-200 h-24 rounded-lg animate-pulse"></div>
                                    ))}
                                </div>
                            ) : (
                                <>
                                    {orders.length > 0 ? (
                                        <div className="space-y-4">
                                            {orders.map(order => (
                                                <div
                                                    key={order.id}
                                                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                                                >
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div>
                                                            <h3 className="font-semibold text-gray-800">
                                                                Commande #{order.id}
                                                            </h3>
                                                            <p className="text-gray-600 text-sm">
                                                                {new Date(order.created_at).toLocaleDateString('fr-FR')}
                                                            </p>
                                                        </div>
                                                        <span
                                                            className={`px-3 py-1 rounded-full text-sm font-bold ${order.status === 'completed'
                                                                ? 'bg-green-100 text-green-800'
                                                                : order.status === 'pending'
                                                                    ? 'bg-yellow-100 text-yellow-800'
                                                                    : 'bg-red-100 text-red-800'
                                                                }`}
                                                        >
                                                            {order.status === 'completed'
                                                                ? 'Livrée'
                                                                : order.status === 'pending'
                                                                    ? 'En cours'
                                                                    : 'Annulée'}
                                                        </span>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                                        <div>
                                                            <p className="text-gray-600">Articles: {order.items_count}</p>
                                                            <p className="text-gray-600">
                                                                Total: <span className="font-bold text-purple-600"><Price price={order.total} /></span>
                                                            </p>
                                                        </div>
                                                        <div className="text-right">
                                                            <button
                                                                onClick={() => navigate(`/orders/${order.id}`)}
                                                                className="text-purple-600 hover:text-purple-800 font-semibold transition"
                                                            >
                                                                Détails →
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8">
                                            <p className="text-gray-500 text-lg">
                                                Vous n'avez pas encore de commandes
                                            </p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
