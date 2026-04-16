import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, MapPin, ShieldCheck } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Price } from '../components/Price';
import api from '../services/api';

interface CheckoutFormData {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
    cardName: string;
    cardNumber: string;
    expiry: string;
    cvv: string;
}

const INITIAL_FORM_DATA: CheckoutFormData = {
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'Senegal',
    cardName: '',
    cardNumber: '',
    expiry: '',
    cvv: '',
};

const LOCAL_CHECKOUT_PROFILE_KEY = 'checkout_profile_draft';

const normalizeCheckoutCountry = (country?: string): string => {
    if (!country || country.trim().length === 0) return 'Senegal';
    return country.trim().toLowerCase() === 'france' ? 'Senegal' : country;
};

const getStoredCheckoutProfile = (): Partial<CheckoutFormData> => {
    const raw = localStorage.getItem(LOCAL_CHECKOUT_PROFILE_KEY);
    if (!raw) return {};

    try {
        const parsed = JSON.parse(raw);
        if (!(typeof parsed === 'object' && parsed)) {
            return {};
        }

        const profile = parsed as Partial<CheckoutFormData>;
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

export const CheckoutPage: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { items, total, clearCart } = useCart();
    const [formData, setFormData] = useState<CheckoutFormData>(() => {
        const storedProfile = getStoredCheckoutProfile();

        return {
            ...INITIAL_FORM_DATA,
            ...storedProfile,
            fullName: user?.name || storedProfile.fullName || '',
            email: user?.email || storedProfile.email || '',
            cardName: storedProfile.cardName || user?.name || '',
        };
    });
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const itemCount = useMemo(
        () => items.reduce((count, item) => count + item.quantity, 0),
        [items]
    );

    const tax = useMemo(() => total * 0.2, [total]);
    const shipping = 0;
    const grandTotal = total + tax + shipping;

    useEffect(() => {
        if (!user) return;

        setFormData((previous) => ({
            ...previous,
            fullName: previous.fullName || user.name,
            email: previous.email || user.email,
            cardName: previous.cardName || user.name,
        }));
    }, [user]);

    useEffect(() => {
        const profileDraft: Partial<CheckoutFormData> = {
            fullName: formData.fullName,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            city: formData.city,
            postalCode: formData.postalCode,
            country: formData.country,
            cardName: formData.cardName,
        };

        localStorage.setItem(LOCAL_CHECKOUT_PROFILE_KEY, JSON.stringify(profileDraft));
    }, [
        formData.fullName,
        formData.email,
        formData.phone,
        formData.address,
        formData.city,
        formData.postalCode,
        formData.country,
        formData.cardName,
    ]);

    const applyProfileInfo = () => {
        const storedProfile = getStoredCheckoutProfile();

        setFormData((previous) => ({
            ...previous,
            fullName: user?.name || storedProfile.fullName || previous.fullName,
            email: user?.email || storedProfile.email || previous.email,
            phone: storedProfile.phone || previous.phone,
            address: storedProfile.address || previous.address,
            city: storedProfile.city || previous.city,
            postalCode: storedProfile.postalCode || previous.postalCode,
            country: storedProfile.country || previous.country,
            cardName: previous.cardName || user?.name || storedProfile.cardName || '',
        }));
    };

    const onInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;

        if (name === 'cardNumber') {
            const numeric = value.replace(/\D/g, '').slice(0, 16);
            const grouped = numeric.replace(/(.{4})/g, '$1 ').trim();
            setFormData((previous) => ({ ...previous, [name]: grouped }));
            return;
        }

        if (name === 'expiry') {
            const numeric = value.replace(/\D/g, '').slice(0, 4);
            const normalized = numeric.length > 2 ? `${numeric.slice(0, 2)}/${numeric.slice(2)}` : numeric;
            setFormData((previous) => ({ ...previous, [name]: normalized }));
            return;
        }

        if (name === 'cvv') {
            setFormData((previous) => ({ ...previous, [name]: value.replace(/\D/g, '').slice(0, 4) }));
            return;
        }

        setFormData((previous) => ({ ...previous, [name]: value }));
    };

    const validateForm = (): string | null => {
        if (items.length === 0) {
            return 'Votre panier est vide.';
        }

        if (!formData.fullName || !formData.email || !formData.phone) {
            return 'Veuillez renseigner vos informations de contact.';
        }

        if (!formData.address || !formData.city || !formData.postalCode || !formData.country) {
            return 'Veuillez renseigner votre adresse de livraison.';
        }

        if (!formData.cardName || !formData.cardNumber || !formData.expiry || !formData.cvv) {
            return 'Veuillez renseigner vos informations de paiement.';
        }

        if (formData.cardNumber.replace(/\s/g, '').length < 16) {
            return 'Le numero de carte doit contenir 16 chiffres.';
        }

        if (formData.expiry.length !== 5) {
            return 'La date d expiration doit etre au format MM/AA.';
        }

        if (formData.cvv.length < 3) {
            return 'Le code de securite doit contenir au moins 3 chiffres.';
        }

        return null;
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError('');
        setSuccessMessage('');

        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        try {
            setIsSubmitting(true);

            const order = await api.createOrder({
                items,
                subtotal: total,
                tax,
                shipping,
                total: grandTotal,
                payment_method: 'card',
                shipping_address: {
                    fullName: formData.fullName,
                    email: formData.email,
                    phone: formData.phone,
                    address: formData.address,
                    city: formData.city,
                    postalCode: formData.postalCode,
                    country: formData.country,
                },
            });

            await clearCart();
            navigate(`/order-success/${order.id}`, {
                state: {
                    orderId: order.id,
                    total: grandTotal,
                    itemsCount: itemCount,
                },
            });
        } catch {
            setError('Impossible de finaliser le paiement. Merci de reessayer.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (items.length === 0 && !successMessage) {
        return (
            <div className="bg-gray-50 min-h-screen py-16 px-4">
                <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md p-8 text-center">
                    <h1 className="text-3xl font-bold text-gray-800 mb-3">Paiement</h1>
                    <p className="text-gray-600 mb-6">Votre panier est vide. Ajoutez des produits avant de payer.</p>
                    <button
                        onClick={() => navigate('/products')}
                        className="inline-flex items-center gap-2 bg-purple-600 text-white font-bold py-2.5 px-6 rounded-lg hover:bg-purple-700 transition"
                    >
                        <ArrowLeft size={18} />
                        Retour aux produits
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 min-h-screen py-8 px-4">
            <div className="max-w-7xl mx-auto">
                <button
                    onClick={() => navigate('/cart')}
                    className="inline-flex items-center gap-2 text-gray-700 hover:text-purple-600 transition mb-6"
                >
                    <ArrowLeft size={18} />
                    Retour au panier
                </button>

                <h1 className="text-4xl font-bold text-gray-800 mb-2">Paiement securise</h1>
                <p className="text-gray-600 mb-8">Finalisez votre commande en quelques secondes.</p>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                        {error}
                    </div>
                )}

                {successMessage && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
                        {successMessage}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
                        <section className="bg-white rounded-xl shadow-md p-6">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
                                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                                    <MapPin size={22} className="text-purple-600" />
                                    Informations de livraison
                                </h2>
                                <button
                                    type="button"
                                    onClick={applyProfileInfo}
                                    className="px-4 py-2 text-sm font-semibold rounded-lg border border-purple-200 text-purple-700 hover:bg-purple-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Utiliser mes infos profil
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={onInputChange}
                                    placeholder="Nom complet"
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-600"
                                />
                                <input
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={onInputChange}
                                    placeholder="Email"
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-600"
                                />
                                <input
                                    name="phone"
                                    value={formData.phone}
                                    onChange={onInputChange}
                                    placeholder="Telephone"
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-600"
                                />
                                <input
                                    name="address"
                                    value={formData.address}
                                    onChange={onInputChange}
                                    placeholder="Adresse"
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-600"
                                />
                                <input
                                    name="city"
                                    value={formData.city}
                                    onChange={onInputChange}
                                    placeholder="Ville"
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-600"
                                />
                                <input
                                    name="postalCode"
                                    value={formData.postalCode}
                                    onChange={onInputChange}
                                    placeholder="Code postal"
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-600"
                                />
                                <input
                                    name="country"
                                    value={formData.country}
                                    onChange={onInputChange}
                                    placeholder="Pays"
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-600 md:col-span-2"
                                />
                                <p className="md:col-span-2 text-xs text-gray-500 -mt-1">
                                    Pays par defaut: Senegal
                                </p>
                            </div>
                        </section>

                        <section className="bg-white rounded-xl shadow-md p-6">
                            <h2 className="text-2xl font-bold text-gray-800 mb-5 flex items-center gap-2">
                                <CreditCard size={22} className="text-purple-600" />
                                Details de paiement
                            </h2>
                            <div className="space-y-4">
                                <input
                                    name="cardName"
                                    value={formData.cardName}
                                    onChange={onInputChange}
                                    placeholder="Nom sur la carte"
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-600"
                                />
                                <input
                                    name="cardNumber"
                                    value={formData.cardNumber}
                                    onChange={onInputChange}
                                    placeholder="Numero de carte"
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-600"
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <input
                                        name="expiry"
                                        value={formData.expiry}
                                        onChange={onInputChange}
                                        placeholder="MM/AA"
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-600"
                                    />
                                    <input
                                        name="cvv"
                                        value={formData.cvv}
                                        onChange={onInputChange}
                                        placeholder="CVV"
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-600"
                                    />
                                </div>
                            </div>

                            <div className="mt-5 flex items-center gap-2 text-sm text-gray-500">
                                <ShieldCheck size={16} className="text-green-600" />
                                Paiement chiffre TLS et verification anti-fraude activee.
                            </div>
                        </section>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-purple-600 text-white font-bold py-3 rounded-lg hover:bg-purple-700 transition disabled:bg-gray-400"
                        >
                            {isSubmitting ? 'Traitement du paiement...' : 'Payer maintenant'}
                        </button>
                    </form>

                    <aside className="lg:col-span-1">
                        <div className="bg-white rounded-xl shadow-md p-6 sticky top-24">
                            <h2 className="text-2xl font-bold text-gray-800 mb-5">Resume</h2>

                            <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
                                {items.map((item) => {
                                    const unitPrice = item.product?.discount_price || item.product?.price || 0;
                                    return (
                                        <div key={item.product_id} className="flex justify-between items-start gap-3">
                                            <div>
                                                <p className="font-semibold text-gray-800 leading-tight">{item.product?.title}</p>
                                                <p className="text-sm text-gray-500">Quantite: {item.quantity}</p>
                                            </div>
                                            <Price price={unitPrice * item.quantity} className="font-semibold text-gray-800" />
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="border-t mt-5 pt-5 space-y-3">
                                <div className="flex justify-between text-gray-600">
                                    <span>Articles</span>
                                    <span>{itemCount}</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>Sous-total</span>
                                    <Price price={total} className="font-semibold text-gray-800" />
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>Taxes (20%)</span>
                                    <Price price={tax} className="font-semibold text-gray-800" />
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>Livraison</span>
                                    <span className="font-semibold text-green-700">Gratuite</span>
                                </div>
                                <div className="flex justify-between text-xl font-bold text-gray-900 border-t pt-4">
                                    <span>Total</span>
                                    <Price price={grandTotal} className="text-purple-600" />
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
};