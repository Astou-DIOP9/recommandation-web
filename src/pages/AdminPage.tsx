import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import type { Product, User } from '../types';
import api from '../services/api';
import { Price } from '../components/Price';
import { CURRENCIES } from '../utils/currency';
import { Plus, Pencil, Trash2, X, Check, AlertCircle, Loader, ShieldCheck, ShieldOff, Package, Users } from 'lucide-react';

type ProductForm = {
    title: string;
    description: string;
    price: string;
    discount_price: string;
    image: string;
    category: string;
    in_stock: boolean;
};

const emptyForm: ProductForm = {
    title: '',
    description: '',
    price: '',
    discount_price: '',
    image: '',
    category: '',
    in_stock: true,
};

const CATEGORIES = [
    'Électronique',
    'Vêtements',
    'Maison & Jardin',
    'Sports & Loisirs',
    'Beauté & Santé',
    'Alimentation',
    'Livres & Médias',
    'Jouets',
    'Autre',
];

const XOF_RATE = CURRENCIES.XOF.rate;

const eurToXofInput = (eurPrice: number): string => String(Math.round(eurPrice * XOF_RATE));

const xofToEur = (xofPrice: string): number => parseFloat(xofPrice) / XOF_RATE;

export const AdminPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'products' | 'users'>('products');
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Form state
    const [showForm, setShowForm] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [form, setForm] = useState<ProductForm>(emptyForm);
    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [isDraggingImage, setIsDraggingImage] = useState(false);
    const [localImageUrl, setLocalImageUrl] = useState<string | null>(null);
    const imageInputRef = useRef<HTMLInputElement | null>(null);

    // Delete confirm
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Search
    const [search, setSearch] = useState('');

    // Users management
    const [users, setUsers] = useState<User[]>([]);
    const [isUsersLoading, setIsUsersLoading] = useState(false);
    const [pendingUserId, setPendingUserId] = useState<number | null>(null);

    const filteredProducts = products.filter(p =>
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase())
    );

    const loadProducts = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const result = await api.getProducts({ per_page: 100 });
            setProducts(result.data);
        } catch {
            setError('Impossible de charger les produits.');
        } finally {
            setIsLoading(false);
        }
    };

    const loadUsers = async () => {
        try {
            setIsUsersLoading(true);
            setError(null);
            const data = await api.getUsers();
            setUsers(data);
        } catch {
            setError('Impossible de charger les utilisateurs.');
        } finally {
            setIsUsersLoading(false);
        }
    };

    useEffect(() => {
        loadProducts();
    }, []);

    useEffect(() => {
        if (activeTab === 'users' && users.length === 0) {
            loadUsers();
        }
    }, [activeTab]);

    const openAddForm = () => {
        if (localImageUrl) {
            URL.revokeObjectURL(localImageUrl);
            setLocalImageUrl(null);
        }
        setEditingProduct(null);
        setForm(emptyForm);
        setFormError(null);
        setShowForm(true);
    };

    const openEditForm = (product: Product) => {
        if (localImageUrl) {
            URL.revokeObjectURL(localImageUrl);
            setLocalImageUrl(null);
        }
        setEditingProduct(product);
        setForm({
            title: product.title,
            description: product.description,
            price: eurToXofInput(product.price),
            discount_price: product.discount_price ? eurToXofInput(product.discount_price) : '',
            image: product.image,
            category: product.category,
            in_stock: product.in_stock,
        });
        setFormError(null);
        setShowForm(true);
    };

    const closeForm = () => {
        if (localImageUrl) {
            URL.revokeObjectURL(localImageUrl);
            setLocalImageUrl(null);
        }
        setShowForm(false);
        setEditingProduct(null);
        setForm(emptyForm);
        setFormError(null);
    };

    useEffect(() => {
        return () => {
            if (localImageUrl) {
                URL.revokeObjectURL(localImageUrl);
            }
        };
    }, [localImageUrl]);

    const handleFormChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            setForm(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
        } else {
            setForm(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleImageFile = (file: File) => {
        if (!file.type.startsWith('image/')) {
            setFormError('Veuillez sélectionner un fichier image valide.');
            return;
        }

        if (localImageUrl) {
            URL.revokeObjectURL(localImageUrl);
        }

        const objectUrl = URL.createObjectURL(file);
        setLocalImageUrl(objectUrl);
        setForm(prev => ({ ...prev, image: objectUrl }));
        setFormError(null);
    };

    const handleImageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        handleImageFile(file);
    };

    const handleImageDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDraggingImage(false);

        const file = e.dataTransfer.files?.[0];
        if (!file) return;
        handleImageFile(file);
    };

    const validateForm = (): string | null => {
        if (!form.title.trim()) return 'Le titre est requis.';
        if (!form.description.trim()) return 'La description est requise.';
        const price = parseFloat(form.price);
        if (isNaN(price) || price <= 0) return 'Le prix doit être un nombre positif.';
        if (form.discount_price) {
            const dp = parseFloat(form.discount_price);
            if (isNaN(dp) || dp <= 0) return 'Le prix réduit doit être un nombre positif.';
            if (dp >= price) return 'Le prix réduit doit être inférieur au prix normal.';
        }
        if (!form.image.trim()) return "L'URL de l'image est requise.";
        if (!form.category) return 'La catégorie est requise.';
        return null;
    };

    const convertBlobToBase64 = (imageUrl: string): Promise<string> => {
        return new Promise((resolve, reject) => {
            // If not a blob URL, return as-is
            if (!imageUrl.startsWith('blob:')) {
                resolve(imageUrl);
                return;
            }

            // Convert blob to base64
            fetch(imageUrl)
                .then(response => response.blob())
                .then(blob => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        resolve(reader.result as string);
                    };
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                })
                .catch(reject);
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const validationError = validateForm();
        if (validationError) {
            setFormError(validationError);
            return;
        }

        try {
            setFormLoading(true);
            setFormError(null);

            // Convert blob URL to base64 if needed
            const imageUrl = await convertBlobToBase64(form.image.trim());

            const payload = {
                title: form.title.trim(),
                description: form.description.trim(),
                price: xofToEur(form.price),
                discount_price: form.discount_price ? xofToEur(form.discount_price) : undefined,
                image: imageUrl,
                category: form.category,
                in_stock: form.in_stock,
            };

            if (editingProduct) {
                const updated = await api.updateProduct(editingProduct.id, payload);
                setProducts(prev => prev.map(p => (p.id === updated.id ? updated : p)));
                setSuccess(`Produit "${updated.title}" mis à jour avec succès.`);
            } else {
                const created = await api.createProduct(payload);
                setProducts(prev => [created, ...prev]);
                setSuccess(`Produit "${created.title}" ajouté avec succès.`);
            }

            closeForm();
            setTimeout(() => setSuccess(null), 4000);
        } catch (error) {
            console.error('Erreur lors de la soumission:', error);
            setFormError('Une erreur est survenue. Vérifiez les données et réessayez.');
        } finally {
            setFormLoading(false);
        }
    };

    const handleDelete = async () => {
        if (deleteId === null) return;
        try {
            setDeleteLoading(true);
            await api.deleteProduct(deleteId);
            const deleted = products.find(p => p.id === deleteId);
            setProducts(prev => prev.filter(p => p.id !== deleteId));
            setSuccess(`Produit "${deleted?.title}" supprimé.`);
            setDeleteId(null);
            setTimeout(() => setSuccess(null), 4000);
        } catch {
            setError('Impossible de supprimer ce produit.');
            setDeleteId(null);
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleToggleAdmin = async (user: User) => {
        try {
            setPendingUserId(user.id);
            const updated = await api.setUserAdmin(user.id, !(user.is_admin || user.role === 'admin'));
            setUsers((prev) => prev.map((candidate) => (candidate.id === user.id ? updated : candidate)));
            setSuccess(`${updated.name} est maintenant ${updated.is_admin || updated.role === 'admin' ? 'admin' : 'utilisateur'}.`);
            setTimeout(() => setSuccess(null), 4000);
        } catch {
            setError('La mise à jour du rôle a échoué.');
        } finally {
            setPendingUserId(null);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header Admin */}
            <div className="bg-purple-700 text-white py-6 px-4 shadow">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold">Administration</h1>
                        <p className="text-purple-200 text-sm mt-1">
                            {activeTab === 'products'
                                ? `${products.length} produit(s) au total`
                                : `${users.length} utilisateur(s) au total`}
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Link to="/" className="admin-top-link px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white hover:text-white rounded text-sm transition">
                            ← Retour au site
                        </Link>
                        {activeTab === 'products' && (
                            <button
                                onClick={openAddForm}
                                className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-400 rounded text-sm font-semibold transition"
                            >
                                <Plus size={16} />
                                Ajouter un produit
                            </button>
                        )}
                    </div>
                </div>
                <div className="max-w-7xl mx-auto mt-4 flex gap-2">
                    <button
                        onClick={() => setActiveTab('products')}
                        className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-semibold transition ${activeTab === 'products' ? 'bg-white text-purple-700' : 'bg-purple-600 text-purple-100 hover:bg-purple-500'
                            }`}
                    >
                        <Package size={16} />
                        Produits
                    </button>
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-semibold transition ${activeTab === 'users' ? 'bg-white text-purple-700' : 'bg-purple-600 text-purple-100 hover:bg-purple-500'
                            }`}
                    >
                        <Users size={16} />
                        Utilisateurs
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-6">
                {/* Notifications */}
                {success && (
                    <div className="mb-4 flex items-center gap-2 bg-green-50 border border-green-300 text-green-800 rounded px-4 py-3">
                        <Check size={18} />
                        {success}
                    </div>
                )}
                {error && (
                    <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-300 text-red-800 rounded px-4 py-3">
                        <AlertCircle size={18} />
                        {error}
                        <button onClick={() => setError(null)} className="ml-auto"><X size={16} /></button>
                    </div>
                )}

                {activeTab === 'products' && (
                    <>
                        {/* Search */}
                        <div className="mb-4">
                            <input
                                type="text"
                                placeholder="Rechercher un produit..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full sm:w-80 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                            />
                        </div>

                        {/* Products Table */}
                        {isLoading ? (
                            <div className="flex justify-center py-20">
                                <Loader className="animate-spin text-purple-600" size={36} />
                            </div>
                        ) : filteredProducts.length === 0 ? (
                            <div className="text-center py-16 text-gray-400">
                                {search ? 'Aucun produit correspondant à la recherche.' : 'Aucun produit trouvé.'}
                            </div>
                        ) : (
                            <div className="bg-white rounded-lg shadow overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full text-sm">
                                        <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
                                            <tr>
                                                <th className="px-4 py-3 text-left">Image</th>
                                                <th className="px-4 py-3 text-left">Titre</th>
                                                <th className="px-4 py-3 text-left">Catégorie</th>
                                                <th className="px-4 py-3 text-right">Prix</th>
                                                <th className="px-4 py-3 text-center">Stock</th>
                                                <th className="px-4 py-3 text-center">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {filteredProducts.map(product => (
                                                <tr key={product.id} className="hover:bg-gray-50 transition">
                                                    <td className="px-4 py-3">
                                                        <img
                                                            src={product.image}
                                                            alt={product.title}
                                                            className="w-12 h-12 object-cover rounded border"
                                                            onError={e => {
                                                                (e.target as HTMLImageElement).src = 'https://placehold.co/48x48?text=No+img';
                                                            }}
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="font-medium text-gray-900 max-w-xs truncate">{product.title}</div>
                                                        <div className="text-gray-400 text-xs max-w-xs truncate">{product.description}</div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full">
                                                            {product.category}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-right whitespace-nowrap">
                                                        {product.discount_price ? (
                                                            <div>
                                                                <span className="text-red-600 font-semibold">
                                                                    <Price price={product.discount_price} />
                                                                </span>
                                                                <span className="line-through text-gray-400 ml-1 text-xs">
                                                                    <Price price={product.price} />
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <span className="font-semibold text-gray-800">
                                                                <Price price={product.price} />
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${product.in_stock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                            {product.in_stock ? 'En stock' : 'Rupture'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-center whitespace-nowrap">
                                                        <button
                                                            onClick={() => openEditForm(product)}
                                                            className="inline-flex items-center gap-1 px-3 py-1.5 text-blue-600 border border-blue-300 rounded hover:bg-blue-50 transition mr-2"
                                                            title="Modifier"
                                                        >
                                                            <Pencil size={14} />
                                                            Modifier
                                                        </button>
                                                        <button
                                                            onClick={() => setDeleteId(product.id)}
                                                            className="inline-flex items-center gap-1 px-3 py-1.5 text-red-600 border border-red-300 rounded hover:bg-red-50 transition"
                                                            title="Supprimer"
                                                        >
                                                            <Trash2 size={14} />
                                                            Supprimer
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {activeTab === 'users' && (
                    <>
                        {isUsersLoading ? (
                            <div className="flex justify-center py-20">
                                <Loader className="animate-spin text-purple-600" size={36} />
                            </div>
                        ) : users.length === 0 ? (
                            <div className="text-center py-16 text-gray-400">Aucun utilisateur trouvé.</div>
                        ) : (
                            <div className="bg-white rounded-lg shadow overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full text-sm">
                                        <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
                                            <tr>
                                                <th className="px-4 py-3 text-left">Nom</th>
                                                <th className="px-4 py-3 text-left">Email</th>
                                                <th className="px-4 py-3 text-left">Rôle</th>
                                                <th className="px-4 py-3 text-center">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {users.map((user) => {
                                                const isAdmin = user.is_admin || user.role === 'admin';
                                                const isPending = pendingUserId === user.id;

                                                return (
                                                    <tr key={user.id} className="hover:bg-gray-50">
                                                        <td className="px-4 py-3 font-medium text-gray-900">{user.name}</td>
                                                        <td className="px-4 py-3 text-gray-600">{user.email}</td>
                                                        <td className="px-4 py-3">
                                                            <span
                                                                className={`text-xs font-semibold px-2 py-1 rounded-full ${isAdmin ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
                                                                    }`}
                                                            >
                                                                {isAdmin ? 'Admin' : 'Utilisateur'}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <button
                                                                onClick={() => handleToggleAdmin(user)}
                                                                disabled={isPending}
                                                                className={`role-color-preserve inline-flex items-center gap-2 px-3 py-1.5 rounded border text-sm transition disabled:opacity-60 ${isAdmin
                                                                    ? 'text-red-600 border-red-300 hover:bg-red-50'
                                                                    : 'text-purple-700 border-purple-300 hover:bg-purple-50'
                                                                    }`}
                                                            >
                                                                {isPending ? (
                                                                    <Loader size={14} className="animate-spin" />
                                                                ) : isAdmin ? (
                                                                    <ShieldOff size={14} />
                                                                ) : (
                                                                    <ShieldCheck size={14} />
                                                                )}
                                                                {isAdmin ? 'Retirer admin' : 'Rendre admin'}
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Modal — Add / Edit Product */}
            {activeTab === 'products' && showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between px-6 py-4 border-b">
                            <h2 className="text-lg font-bold text-gray-800">
                                {editingProduct ? 'Modifier le produit' : 'Ajouter un produit'}
                            </h2>
                            <button onClick={closeForm} className="text-gray-400 hover:text-gray-600">
                                <X size={22} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                            {formError && (
                                <div className="flex items-center gap-2 bg-red-50 border border-red-300 text-red-700 rounded px-3 py-2 text-sm">
                                    <AlertCircle size={16} />
                                    {formError}
                                </div>
                            )}

                            {/* Title */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Titre <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="title"
                                    value={form.title}
                                    onChange={handleFormChange}
                                    placeholder="Nom du produit"
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    name="description"
                                    value={form.description}
                                    onChange={handleFormChange}
                                    rows={3}
                                    placeholder="Description du produit"
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
                                />
                            </div>

                            {/* Price + Discount */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Prix (FCFA) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        name="price"
                                        value={form.price}
                                        onChange={handleFormChange}
                                        min="0"
                                        step="1"
                                        placeholder="0"
                                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Prix réduit (FCFA)
                                    </label>
                                    <input
                                        type="number"
                                        name="discount_price"
                                        value={form.discount_price}
                                        onChange={handleFormChange}
                                        min="0"
                                        step="1"
                                        placeholder="Optionnel"
                                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                                    />
                                </div>
                            </div>

                            {/* Category */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Catégorie <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="category"
                                    value={form.category}
                                    onChange={handleFormChange}
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                                >
                                    <option value="">-- Choisir une catégorie --</option>
                                    {CATEGORIES.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Image URL */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Image <span className="text-red-500">*</span>
                                </label>
                                <div
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        setIsDraggingImage(true);
                                    }}
                                    onDragLeave={() => setIsDraggingImage(false)}
                                    onDrop={handleImageDrop}
                                    onClick={() => imageInputRef.current?.click()}
                                    className={`mb-2 border-2 border-dashed rounded px-4 py-5 text-center text-sm cursor-pointer transition ${isDraggingImage
                                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                                        : 'border-gray-300 text-gray-500 hover:border-purple-400 hover:text-purple-700'
                                        }`}
                                >
                                    Glisser-déposer une image ici ou cliquer pour choisir
                                </div>
                                <input
                                    ref={imageInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleImageInputChange}
                                />
                                <input
                                    type="text"
                                    name="image"
                                    value={form.image}
                                    onChange={handleFormChange}
                                    placeholder="https://exemple.com/image.jpg"
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                                />
                                {form.image && (
                                    <img
                                        src={form.image}
                                        alt="Aperçu"
                                        className="mt-2 h-20 w-20 object-cover rounded border"
                                        onError={e => { (e.target as HTMLImageElement).hidden = true; }}
                                    />
                                )}
                            </div>

                            {/* In Stock */}
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    name="in_stock"
                                    id="in_stock"
                                    checked={form.in_stock}
                                    onChange={handleFormChange}
                                    className="w-4 h-4 accent-purple-600"
                                />
                                <label htmlFor="in_stock" className="text-sm font-medium text-gray-700 cursor-pointer">
                                    En stock
                                </label>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-3 pt-2 border-t mt-4">
                                <button
                                    type="button"
                                    onClick={closeForm}
                                    className="px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50 transition"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={formLoading}
                                    className="flex items-center gap-2 px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm font-semibold transition disabled:opacity-60"
                                >
                                    {formLoading ? (
                                        <Loader size={16} className="animate-spin" />
                                    ) : editingProduct ? (
                                        <Check size={16} />
                                    ) : (
                                        <Plus size={16} />
                                    )}
                                    {editingProduct ? 'Enregistrer' : 'Ajouter'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal — Delete Confirm */}
            {activeTab === 'products' && deleteId !== null && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-red-100 text-red-600 rounded-full p-2">
                                <Trash2 size={20} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-800">Confirmer la suppression</h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-6">
                            Cette action est irréversible. Voulez-vous vraiment supprimer ce produit ?
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setDeleteId(null)}
                                className="px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50 transition"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deleteLoading}
                                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-semibold transition disabled:opacity-60"
                            >
                                {deleteLoading ? <Loader size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                Supprimer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
