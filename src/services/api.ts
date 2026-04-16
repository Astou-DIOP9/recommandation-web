import axios from 'axios';
import type { AxiosInstance } from 'axios';
import type { User, Product, Review, Recommendation, LoginRequest, RegisterRequest, AuthResponse } from '../types';
import { DEMO_PRODUCTS } from './mockData';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const API_TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT_MS || 10000);
const LOCAL_USER_KEY = 'local_auth_user';
const LEGACY_LOCAL_CART_KEY = 'local_cart_items';
const LOCAL_CART_KEY_PREFIX = 'local_cart_items_user_';
const LOCAL_ORDERS_KEY_PREFIX = 'local_orders_user_';
const LOCAL_USERS_KEY = 'local_users';
const LOCAL_PRODUCTS_KEY = 'local_products';
const LOCAL_ORDERS_KEY = 'local_orders';

interface OrderItemInput {
    product_id: number;
    quantity: number;
    product?: Product;
}

interface CreateOrderPayload {
    items: OrderItemInput[];
    subtotal: number;
    tax: number;
    shipping: number;
    total: number;
    payment_method: string;
    shipping_address: {
        fullName: string;
        email: string;
        phone: string;
        address: string;
        city: string;
        postalCode: string;
        country: string;
    };
}

interface OrderHistoryItem {
    id: number;
    status: 'completed' | 'pending' | 'cancelled';
    created_at: string;
    items_count: number;
    total: number;
    items?: OrderItemInput[];
}

export interface OrderDetails extends OrderHistoryItem {
    user_id?: number;
    user?: {
        id: number;
        name: string;
        email: string;
    } | null;
}

interface LaravelPaginationResponse<T> {
    data: T[];
    total?: number;
    last_page?: number;
}

interface NormalizedPagination<T> {
    data: T[];
    total: number;
    pages: number;
}

interface BackendCategory {
    id: number;
    name: string;
    slug: string;
}

interface BackendProduct {
    id: number;
    title?: string;
    nom?: string;
    description?: string | null;
    price?: number;
    discount_price?: number | null;
    image?: string | null;
    in_stock?: boolean | null;
    category?: BackendCategory | string | null;
    category_id?: number | null;
    rating?: number;
    reviews_count?: number;
    views_count?: number;
}

export interface BackendStatus {
    mode: 'unknown' | 'connected' | 'fallback';
    message: string;
    apiUrl: string;
}

let backendStatus: BackendStatus = {
    mode: 'unknown',
    message: 'Verification de la connexion au backend...',
    apiUrl: API_URL,
};

const backendStatusListeners = new Set<(status: BackendStatus) => void>();
let recommendationsEndpointMissing = false;
let productReviewsEndpointMissing = false;

const emitBackendStatus = () => {
    backendStatusListeners.forEach((listener) => listener(backendStatus));
};

const setBackendStatus = (status: BackendStatus) => {
    if (
        backendStatus.mode === status.mode &&
        backendStatus.message === status.message &&
        backendStatus.apiUrl === status.apiUrl
    ) {
        return;
    }

    backendStatus = status;
    emitBackendStatus();
};

export const getBackendStatus = (): BackendStatus => backendStatus;

export const subscribeBackendStatus = (listener: (status: BackendStatus) => void) => {
    backendStatusListeners.add(listener);
    return () => {
        backendStatusListeners.delete(listener);
    };
};

const toFrontendProduct = (raw: BackendProduct): Product => {
    const categoryLabel =
        typeof raw.category === 'string'
            ? raw.category
            : raw.category?.name || 'Général';

    const rating = typeof raw.rating === 'number' ? raw.rating : 4.5;
    const reviewsCount =
        typeof raw.reviews_count === 'number'
            ? raw.reviews_count
            : typeof raw.views_count === 'number'
                ? raw.views_count
                : 0;

    return {
        id: raw.id,
        title: raw.title || raw.nom || 'Produit',
        description: raw.description || '',
        price: typeof raw.price === 'number' ? raw.price : 0,
        discount_price: typeof raw.discount_price === 'number' ? raw.discount_price : undefined,
        image:
            raw.image ||
            'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop',
        category: categoryLabel,
        rating,
        reviews_count: reviewsCount,
        in_stock: raw.in_stock ?? true,
    };
};

const normalizePaginated = <T>(payload: unknown): NormalizedPagination<T> => {
    if (!payload || typeof payload !== 'object') {
        return { data: [], total: 0, pages: 1 };
    }

    // If the backend returned a plain array directly
    if (Array.isArray(payload)) {
        return { data: payload as T[], total: payload.length, pages: 1 };
    }

    const candidate = payload as Partial<LaravelPaginationResponse<T>> & {
        pages?: number;
    };

    const data = Array.isArray(candidate.data) ? candidate.data : [];
    const total = typeof candidate.total === 'number' ? candidate.total : data.length;
    const pages =
        typeof candidate.pages === 'number'
            ? candidate.pages
            : typeof candidate.last_page === 'number'
                ? candidate.last_page
                : 1;

    return { data, total, pages };
};

const unwrapData = <T>(payload: unknown): T => {
    if (payload && typeof payload === 'object' && 'data' in payload) {
        return (payload as { data: T }).data;
    }
    return payload as T;
};

const isHttpStatus = (error: unknown, status: number): boolean => {
    return axios.isAxiosError(error) && error.response?.status === status;
};

const shouldUseLocalAuthFallback = (error: unknown): boolean => {
    if (!axios.isAxiosError(error)) return false;

    // Network or timeout errors: backend unreachable, CORS/network issue, or very slow response.
    if (!error.response) {
        return error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED';
    }

    return false;
};

const shouldUseLocalCartFallback = (error: unknown): boolean => {
    if (shouldUseLocalAuthFallback(error) || isHttpStatus(error, 401)) {
        return true;
    }

    return axios.isAxiosError(error);
};

const shouldUseLocalAdminFallback = (error: unknown): boolean => {
    if (shouldUseLocalAuthFallback(error) || isHttpStatus(error, 401) || isHttpStatus(error, 403)) {
        return true;
    }


    return axios.isAxiosError(error);
};

const markBackendConnected = () => {
    setBackendStatus({
        mode: 'connected',
        message: 'Backend Laravel connecte.',
        apiUrl: API_URL,
    });
};

const markBackendFallback = (message: string) => {
    setBackendStatus({
        mode: 'fallback',
        message,
        apiUrl: API_URL,
    });
};

const getStoredUser = (): User | null => {
    const raw = localStorage.getItem(LOCAL_USER_KEY);
    if (!raw) return null;
    try {
        return JSON.parse(raw) as User;
    } catch {
        return null;
    }
};

const setStoredUser = (user: User) => {
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(user));
};

const getStoredUsers = (): User[] => {
    const raw = localStorage.getItem(LOCAL_USERS_KEY);
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? (parsed as User[]) : [];
    } catch {
        return [];
    }
};

const setStoredUsers = (users: User[]) => {
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
};

const getStoredProducts = (): Product[] => {
    const raw = localStorage.getItem(LOCAL_PRODUCTS_KEY);
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? (parsed as Product[]) : [];
    } catch {
        return [];
    }
};

const setStoredProducts = (products: Product[]) => {
    localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(products));
};

const getCurrentOrdersStorageKey = (): string => {
    const user = getStoredUser();

    if (user) {
        const normalizedEmail = user.email
            ?.trim()
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '_');

        if (normalizedEmail) {
            return `${LOCAL_ORDERS_KEY_PREFIX}email_${normalizedEmail}`;
        }

        if (typeof user.id === 'number' && !Number.isNaN(user.id)) {
            return `${LOCAL_ORDERS_KEY_PREFIX}id_${user.id}`;
        }
    }

    return `${LOCAL_ORDERS_KEY_PREFIX}guest`;
};

const getStoredOrders = (): OrderHistoryItem[] => {
    const currentKey = getCurrentOrdersStorageKey();
    const raw = localStorage.getItem(currentKey);

    if (!raw) {
        if (currentKey === `${LOCAL_ORDERS_KEY_PREFIX}guest`) {
            const legacyRaw = localStorage.getItem(LOCAL_ORDERS_KEY);
            if (!legacyRaw) return [];
            try {
                const legacyParsed = JSON.parse(legacyRaw);
                return Array.isArray(legacyParsed) ? (legacyParsed as OrderHistoryItem[]) : [];
            } catch {
                return [];
            }
        }

        return [];
    }

    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? (parsed as OrderHistoryItem[]) : [];
    } catch {
        return [];
    }
};

const setStoredOrders = (orders: OrderHistoryItem[]) => {
    const currentKey = getCurrentOrdersStorageKey();
    localStorage.setItem(currentKey, JSON.stringify(orders));

    if (currentKey !== `${LOCAL_ORDERS_KEY_PREFIX}guest`) {
        localStorage.removeItem(LOCAL_ORDERS_KEY);
    }
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null;

const normalizeOrderStatus = (value: unknown): OrderHistoryItem['status'] => {
    if (typeof value !== 'string') return 'completed';

    const normalized = value.toLowerCase();
    if (normalized === 'pending' || normalized === 'processing') return 'pending';
    if (normalized === 'cancelled' || normalized === 'canceled' || normalized === 'failed') return 'cancelled';
    return 'completed';
};

const toOrderHistoryItem = (raw: unknown): OrderHistoryItem | null => {
    if (!isRecord(raw)) return null;

    const idCandidate = raw.id;
    const id = typeof idCandidate === 'number' ? idCandidate : Number(idCandidate);

    if (Number.isNaN(id)) {
        return null;
    }

    const items = Array.isArray(raw.items) ? (raw.items as OrderItemInput[]) : undefined;
    const itemsCount =
        typeof raw.items_count === 'number'
            ? raw.items_count
            : items
                ? items.reduce((count, item) => count + (item.quantity || 0), 0)
                : 0;

    const totalCandidate = raw.total;
    const total = typeof totalCandidate === 'number' ? totalCandidate : Number(totalCandidate || 0);

    const createdAtCandidate = raw.created_at;
    const createdAt =
        typeof createdAtCandidate === 'string' && createdAtCandidate.length > 0
            ? createdAtCandidate
            : new Date().toISOString();

    return {
        id,
        status: normalizeOrderStatus(raw.status),
        created_at: createdAt,
        items_count: itemsCount,
        total,
        items,
    };
};

const mergeOrders = (primary: OrderHistoryItem[], secondary: OrderHistoryItem[]): OrderHistoryItem[] => {
    const deduped = new Map<number, OrderHistoryItem>();

    [...primary, ...secondary].forEach((order) => {
        deduped.set(order.id, order);
    });

    return Array.from(deduped.values()).sort((left, right) =>
        new Date(right.created_at).getTime() - new Date(left.created_at).getTime()
    );
};

const getLocalProductCatalog = (): Product[] => {
    const storedProducts = getStoredProducts();
    if (storedProducts.length > 0) {
        return storedProducts;
    }
    return DEMO_PRODUCTS;
};

const applyProductFilters = (
    products: Product[],
    params?: {
        page?: number;
        per_page?: number;
        search?: string;
        category?: string;
        sort?: string;
    }
): { data: Product[]; total: number; pages: number } => {
    const page = Math.max(1, params?.page || 1);
    const perPage = Math.max(1, params?.per_page || products.length || 1);
    const normalizedSearch = params?.search?.trim().toLowerCase() || '';
    const normalizedCategory = params?.category?.trim().toLowerCase() || '';

    let filtered = [...products];

    if (normalizedSearch) {
        filtered = filtered.filter((product) =>
            product.title.toLowerCase().includes(normalizedSearch) ||
            product.description.toLowerCase().includes(normalizedSearch) ||
            product.category.toLowerCase().includes(normalizedSearch)
        );
    }

    if (normalizedCategory) {
        filtered = filtered.filter(
            (product) => product.category.toLowerCase() === normalizedCategory
        );
    }

    switch (params?.sort) {
        case 'price-asc':
            filtered.sort((left, right) => left.price - right.price);
            break;
        case 'price-desc':
            filtered.sort((left, right) => right.price - left.price);
            break;
        case 'rating':
            filtered.sort((left, right) => right.rating - left.rating);
            break;
        case 'popular':
            filtered.sort((left, right) => right.reviews_count - left.reviews_count);
            break;
        case 'newest':
        default:
            filtered.sort((left, right) => right.id - left.id);
            break;
    }

    const total = filtered.length;
    const pages = Math.max(1, Math.ceil(total / perPage));
    const start = (page - 1) * perPage;
    const data = filtered.slice(start, start + perPage);

    return { data, total, pages };
};

const upsertStoredUser = (user: User) => {
    const users = getStoredUsers();
    const idx = users.findIndex((candidate) => candidate.id === user.id || candidate.email === user.email);
    if (idx >= 0) {
        users[idx] = { ...users[idx], ...user };
    } else {
        users.unshift(user);
    }
    setStoredUsers(users);
};

const readCartByKey = (key: string): any[] => {
    const raw = localStorage.getItem(key);
    if (!raw) return [];

    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

const getCurrentCartStorageKey = (): string => {
    const user = getStoredUser();

    if (user) {
        const normalizedEmail = user.email
            ?.trim()
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '_');

        if (normalizedEmail) {
            return `${LOCAL_CART_KEY_PREFIX}email_${normalizedEmail}`;
        }

        if (typeof user.id === 'number' && !Number.isNaN(user.id)) {
            return `${LOCAL_CART_KEY_PREFIX}id_${user.id}`;
        }
    }

    return `${LOCAL_CART_KEY_PREFIX}guest`;
};

const getStoredCart = (): any[] => {
    const currentKey = getCurrentCartStorageKey();
    const hasCurrentCartState = localStorage.getItem(currentKey) !== null;
    const currentItems = readCartByKey(currentKey);

    if (hasCurrentCartState) {
        return currentItems;
    }

    if (currentItems.length > 0) {
        return currentItems;
    }

    const user = getStoredUser();
    const normalizedEmail = user?.email
        ?.trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_');

    const idKey =
        user && typeof user.id === 'number' && !Number.isNaN(user.id)
            ? `${LOCAL_CART_KEY_PREFIX}id_${user.id}`
            : null;
    const emailKey = normalizedEmail ? `${LOCAL_CART_KEY_PREFIX}email_${normalizedEmail}` : null;

    const candidateKeys = [
        LEGACY_LOCAL_CART_KEY,
        ...(idKey && idKey !== currentKey ? [idKey] : []),
        ...(emailKey && emailKey !== currentKey ? [emailKey] : []),
    ];

    for (const key of candidateKeys) {
        const migratedItems = readCartByKey(key);
        if (migratedItems.length > 0) {
            localStorage.setItem(currentKey, JSON.stringify(migratedItems));
            return migratedItems;
        }
    }

    return [];
};

const setStoredCart = (items: any[]) => {
    localStorage.setItem(getCurrentCartStorageKey(), JSON.stringify(items));

    if (items.length === 0) {
        localStorage.removeItem(LEGACY_LOCAL_CART_KEY);
    }
};

const computeCartTotal = (items: any[]): number => {
    return items.reduce((sum, item) => {
        const price = item.product?.discount_price || item.product?.price || 0;
        return sum + price * (item.quantity || 0);
    }, 0);
};

class ApiService {
    private api: AxiosInstance;

    constructor() {
        this.api = axios.create({
            baseURL: API_URL,
            timeout: API_TIMEOUT_MS,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        this.api.interceptors.request.use((config) => {
            const token = localStorage.getItem('auth_token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        });

        this.api.interceptors.response.use(
            (response) => {
                markBackendConnected();
                return response;
            },
            (error) => {
                if (axios.isAxiosError(error) && !error.response) {
                    if (error.code === 'ECONNABORTED') {
                        markBackendFallback('Backend Laravel joignable mais trop lent. Le delai d\'attente du frontend a expire.');
                    } else {
                        markBackendFallback('Backend Laravel non joignable. L\'application utilise les donnees locales.');
                    }
                }

                return Promise.reject(error);
            }
        );
    }

    async login(credentials: LoginRequest): Promise<AuthResponse> {
        try {
            const response = await this.api.post<AuthResponse>('/login', credentials);
            setStoredUser(response.data.user);
            upsertStoredUser(response.data.user);
            return response.data;
        } catch (error) {
            if (!shouldUseLocalAuthFallback(error)) {
                console.error('Login error:', error);
                throw error;
            }

            markBackendFallback('Connexion backend indisponible. Authentification locale activee.');

            const existingUser = getStoredUsers().find((u) => u.email.toLowerCase() === credentials.email.toLowerCase());
            const fallbackUser: User = existingUser
                ? existingUser
                : {
                    id: Date.now(),
                    name: credentials.email.split('@')[0] || 'Utilisateur',
                    email: credentials.email,
                    is_admin: false,
                    role: 'user',
                };
            setStoredUser(fallbackUser);
            upsertStoredUser(fallbackUser);
            return {
                token: 'local-dev-token',
                user: fallbackUser,
            };
        }
    }

    async register(data: RegisterRequest): Promise<AuthResponse> {
        try {
            const response = await this.api.post<AuthResponse>('/register', data);
            setStoredUser(response.data.user);
            upsertStoredUser(response.data.user);
            return response.data;
        } catch (error) {
            if (!shouldUseLocalAuthFallback(error)) {
                console.error('Registration error:', error);
                throw error;
            }

            markBackendFallback('Inscription backend indisponible. Mode local actif.');

            const fallbackUser: User = {
                id: Date.now(),
                name: data.name,
                email: data.email,
                is_admin: false,
                role: 'user',
            };
            setStoredUser(fallbackUser);
            upsertStoredUser(fallbackUser);
            return {
                token: 'local-dev-token',
                user: fallbackUser,
            };
        }
    }

    async logout(): Promise<void> {
        try {
            await this.api.post('/logout');
        } catch (error) {
            if (!shouldUseLocalAuthFallback(error)) throw error;
        } finally {
            localStorage.removeItem(LOCAL_USER_KEY);
        }
    }

    getLocalUser(): User | null {
        return getStoredUser();
    }

    async getCurrentUser(): Promise<User> {
        const storedToken = localStorage.getItem('auth_token');
        if (storedToken === 'local-dev-token') {
            const localUser = getStoredUser();
            if (!localUser) throw new Error('Utilisateur non authentifie');
            return localUser;
        }

        try {
            const response = await this.api.get<User>('/me');
            setStoredUser(response.data);
            upsertStoredUser(response.data);
            return response.data;
        } catch (error) {
            markBackendFallback('Verification utilisateur impossible cote backend. Session locale utilisee.');
            const fallbackUser = getStoredUser();
            if (!fallbackUser) {
                throw new Error('Utilisateur non authentifie');
            }
            return fallbackUser;
        }
    }

    // Products
    async getProducts(params?: {
        page?: number;
        per_page?: number;
        search?: string;
        category?: string;
        sort?: string;
    }): Promise<{ data: Product[]; total: number; pages: number }> {
        try {
            const response = await this.api.get('/products', { params });
            const result = normalizePaginated<BackendProduct>(response.data);
            const normalized = result.data.map(toFrontendProduct);

            if (normalized.length === 0) {
                return applyProductFilters(getLocalProductCatalog(), params);
            }

            return { data: normalized, total: result.total, pages: result.pages };
        } catch (error) {
            if (!shouldUseLocalAdminFallback(error)) {
                throw error;
            }

            markBackendFallback('Catalogue backend indisponible. Produits locaux affiches.');

            return applyProductFilters(getLocalProductCatalog(), params);
        }
    }

    async getProductById(id: number): Promise<Product> {
        try {
            const response = await this.api.get<BackendProduct>(`/products/${id}`);
            return toFrontendProduct(response.data);
        } catch (error) {
            if (!shouldUseLocalAuthFallback(error) && !isHttpStatus(error, 404)) {
                throw error;
            }

            markBackendFallback('Detail produit charge depuis les donnees locales.');

            const product = getLocalProductCatalog().find((candidate) => candidate.id === id);
            if (!product) {
                throw new Error('Produit introuvable');
            }

            return product;
        }
    }

    async getRecommendations(params?: {
        limit?: number;
        user_id?: number;
    }): Promise<Recommendation[]> {
        if (recommendationsEndpointMissing) {
            return [];
        }

        let payload: Recommendation[] | Product[];

        try {
            const response = await this.api.get<Recommendation[]>('/recommendations', { params });
            payload = unwrapData<Recommendation[] | Product[]>(response.data);
        } catch (error) {
            if (!isHttpStatus(error, 404)) throw error;
            recommendationsEndpointMissing = true;
            return [];
        }

        if (!Array.isArray(payload)) {
            return [];
        }

        if (payload.length > 0 && 'id' in (payload[0] as Product)) {
            return (payload as Product[]).map((product) => ({
                product_id: product.id,
                product,
                score: 1,
                reason: 'recommandation',
            }));
        }

        return payload as Recommendation[];
    }

    async getProductRecommendations(productId: number): Promise<Product[]> {
        try {
            const response = await this.api.get<Product[]>(`/recommendations/products/${productId}`);
            const payload = unwrapData<Product[] | Recommendation[]>(response.data);

            if (!Array.isArray(payload)) return [];
            if (payload.length > 0 && 'product' in (payload[0] as Recommendation)) {
                return (payload as Recommendation[])
                    .map((r) => r.product)
                    .filter(Boolean) as Product[];
            }

            return payload as Product[];
        } catch (error) {
            if (!isHttpStatus(error, 404)) throw error;
            return [];
        }
    }

    async getProductReviews(productId: number, params?: {
        page?: number;
        per_page?: number;
        sort?: string;
    }): Promise<{ data: Review[]; total: number; pages: number }> {
        if (productReviewsEndpointMissing) {
            return { data: [], total: 0, pages: 1 };
        }

        try {
            const response = await this.api.get(`/products/${productId}/reviews`, { params });
            return normalizePaginated<Review>(response.data);
        } catch (error) {
            if (!isHttpStatus(error, 404)) throw error;
            productReviewsEndpointMissing = true;
            return { data: [], total: 0, pages: 1 };
        }
    }

    async createReview(productId: number, data: {
        rating: number;
        comment: string;
    }): Promise<Review> {
        try {
            const response = await this.api.post<Review>(`/products/${productId}/reviews`, data);
            return unwrapData<Review>(response.data);
        } catch (error) {
            if (!isHttpStatus(error, 404)) throw error;
            return {
                id: Date.now(),
                user_id: 0,
                product_id: productId,
                rating: data.rating,
                comment: data.comment,
                user_name: 'Utilisateur local',
                created_at: new Date().toISOString(),
            };
        }
    }

    async deleteReview(reviewId: number): Promise<void> {
        try {
            await this.api.delete(`/reviews/${reviewId}`);
        } catch (error) {
            if (!isHttpStatus(error, 404)) throw error;
        }
    }

    // Cart
    async getCart(): Promise<{ items: any[]; total: number }> {
        try {
            const response = await this.api.get('/cart');
            const payload = response.data as
                | { items?: any[]; total?: number }
                | { data?: { items?: any[]; total?: number } }
                | { cart?: { items?: any[] }; total?: number };

            const localItems = getStoredCart();

            if ('data' in payload && payload.data) {
                const backendItems = payload.data.items || [];

                if (backendItems.length === 0 && localItems.length > 0) {
                    return {
                        items: localItems,
                        total: computeCartTotal(localItems),
                    };
                }

                return {
                    items: backendItems.map((item) => ({
                        ...item,
                        quantity: item.quantity ?? item.quantite ?? 0,
                    })),
                    total: payload.data.total || 0,
                };
            }

            if ('cart' in payload && payload.cart) {
                const backendItems = payload.cart.items || [];

                if (backendItems.length === 0 && localItems.length > 0) {
                    return {
                        items: localItems,
                        total: computeCartTotal(localItems),
                    };
                }

                const normalized = backendItems.map((item) => ({
                    ...item,
                    product_id: item.product_id ?? item.product?.id,
                    quantity: item.quantity ?? item.quantite ?? 0,
                    product: item.product,
                }));

                return {
                    items: normalized,
                    total: typeof payload.total === 'number' ? payload.total : computeCartTotal(normalized),
                };
            }

            const directPayload = payload as { items?: any[]; total?: number };
            const backendItems = directPayload.items || [];

            if (backendItems.length === 0 && localItems.length > 0) {
                return {
                    items: localItems,
                    total: computeCartTotal(localItems),
                };
            }

            return {
                items: backendItems.map((item) => ({
                    ...item,
                    quantity: item.quantity ?? item.quantite ?? 0,
                })),
                total: directPayload.total || 0,
            };
        } catch (error) {
            if (!shouldUseLocalCartFallback(error)) throw error;
            const items = getStoredCart();
            return {
                items,
                total: computeCartTotal(items),
            };
        }
    }

    async addToCart(productId: number, quantity: number, product?: Product): Promise<void> {
        const syncLocalCart = () => {
            const items = getStoredCart();
            const index = items.findIndex((item) => item.product_id === productId);
            if (index >= 0) {
                items[index].quantity += quantity;
            } else {
                items.push({ product_id: productId, quantity, product });
            }
            setStoredCart(items);
        };

        try {
            await this.api.post('/cart', { product_id: productId, quantite: quantity });
            syncLocalCart();
        } catch (error) {
            if (!shouldUseLocalCartFallback(error)) throw error;
            syncLocalCart();
        }
    }

    async updateCartItem(productId: number, quantity: number): Promise<void> {
        const syncLocalCart = () => {
            const items = getStoredCart();
            const index = items.findIndex((item) => item.product_id === productId);
            if (index >= 0) {
                items[index].quantity = quantity;
                setStoredCart(items);
            }
        };

        try {
            const cartResponse = await this.api.get('/cart');
            const cartPayload = cartResponse.data as { cart?: { items?: any[] } };
            const cartItems = cartPayload.cart?.items || [];
            const targetItem = cartItems.find((item) => (item.product_id ?? item.product?.id) === productId);

            if (!targetItem?.id) {
                syncLocalCart();
                return;
            }

            await this.api.patch(`/cart/${targetItem.id}`, { quantite: quantity });
            syncLocalCart();
        } catch (error) {
            if (!shouldUseLocalCartFallback(error)) throw error;
            syncLocalCart();
        }
    }

    async removeFromCart(productId: number): Promise<void> {
        const syncLocalCart = () => {
            const items = getStoredCart().filter((item) => item.product_id !== productId);
            setStoredCart(items);
        };

        try {
            const cartResponse = await this.api.get('/cart');
            const cartPayload = cartResponse.data as { cart?: { items?: any[] } };
            const cartItems = cartPayload.cart?.items || [];
            const targetItem = cartItems.find((item) => (item.product_id ?? item.product?.id) === productId);

            if (!targetItem?.id) {
                syncLocalCart();
                return;
            }

            await this.api.delete(`/cart/${targetItem.id}`);
            syncLocalCart();
        } catch (error) {
            if (!shouldUseLocalCartFallback(error)) throw error;
            syncLocalCart();
        }
    }

    async clearCart(): Promise<void> {
        try {
            await this.api.delete('/cart');
            setStoredCart([]);
        } catch (error) {
            if (!shouldUseLocalCartFallback(error)) throw error;
            setStoredCart([]);
        }
    }

    // User Profile
    async updateProfile(data: Partial<User>): Promise<User> {
        try {
            const response = await this.api.put<User>('/profile', data);
            return unwrapData<User>(response.data);
        } catch (error) {
            if (!isHttpStatus(error, 404)) throw error;
            const current = getStoredUser();
            const updated = { ...(current || { id: 1, name: '', email: '' }), ...data } as User;
            setStoredUser(updated);
            upsertStoredUser(updated);
            return updated;
        }
    }

    async createOrder(payload: CreateOrderPayload): Promise<OrderHistoryItem> {
        try {
            const response = await this.api.post<OrderHistoryItem>('/orders', payload);
            const createdRaw = unwrapData<unknown>(response.data);
            const created =
                toOrderHistoryItem(createdRaw) || {
                    id: getStoredOrders().reduce((maxId, order) => Math.max(maxId, order.id), 0) + 1,
                    status: 'completed',
                    created_at: new Date().toISOString(),
                    items_count: payload.items.reduce((count, item) => count + item.quantity, 0),
                    total: payload.total,
                    items: payload.items,
                };

            setStoredOrders(mergeOrders([created], getStoredOrders()));
            markBackendConnected();
            return created;
        } catch (error) {
            if (!shouldUseLocalCartFallback(error)) {
                throw error;
            }

            markBackendFallback('Commande enregistree localement car le backend est indisponible.');

            const orders = getStoredOrders();
            const createdOrder: OrderHistoryItem = {
                id: orders.reduce((maxId, order) => Math.max(maxId, order.id), 0) + 1,
                status: 'completed',
                created_at: new Date().toISOString(),
                items_count: payload.items.reduce((count, item) => count + item.quantity, 0),
                total: payload.total,
                items: payload.items,
            };

            setStoredOrders(mergeOrders([createdOrder], orders));
            return createdOrder;
        }
    }

    async getUserOrderHistory(): Promise<OrderHistoryItem[]> {
        try {
            const response = await this.api.get('/orders');
            const payload = unwrapData<unknown>(response.data);

            let backendOrders: OrderHistoryItem[] = [];

            if (Array.isArray(payload)) {
                backendOrders = payload
                    .map((entry) => toOrderHistoryItem(entry))
                    .filter(Boolean) as OrderHistoryItem[];
            } else if (isRecord(payload) && Array.isArray(payload.orders)) {
                backendOrders = payload.orders
                    .map((entry) => toOrderHistoryItem(entry))
                    .filter(Boolean) as OrderHistoryItem[];
            } else if (isRecord(payload) && Array.isArray(payload.data)) {
                backendOrders = payload.data
                    .map((entry) => toOrderHistoryItem(entry))
                    .filter(Boolean) as OrderHistoryItem[];
            }

            const merged = mergeOrders(backendOrders, getStoredOrders());
            if (merged.length > 0) {
                setStoredOrders(merged);
            }

            return merged;
        } catch (error) {
            if (!shouldUseLocalCartFallback(error)) {
                throw error;
            }

            markBackendFallback('Historique de commandes charge depuis le stockage local.');
            return getStoredOrders();
        }
    }

    async getOrderById(orderId: number): Promise<OrderDetails> {
        try {
            const response = await this.api.get(`/orders/${orderId}`);
            const payload = unwrapData<unknown>(response.data);

            let orderRaw: unknown = payload;
            if (isRecord(payload) && isRecord(payload.data)) {
                orderRaw = payload.data;
            }

            const normalized = toOrderHistoryItem(orderRaw);
            if (!normalized) {
                throw new Error('Commande introuvable');
            }

            return {
                ...normalized,
                user_id: isRecord(orderRaw) ? Number(orderRaw.user_id || 0) : undefined,
                user:
                    isRecord(orderRaw) && isRecord(orderRaw.user)
                        ? {
                            id: Number(orderRaw.user.id || 0),
                            name: String(orderRaw.user.name || ''),
                            email: String(orderRaw.user.email || ''),
                        }
                        : null,
            };
        } catch (error) {
            if (!shouldUseLocalCartFallback(error)) {
                throw error;
            }

            const localOrder = getStoredOrders().find((order) => order.id === orderId);
            if (!localOrder) {
                throw new Error('Commande introuvable');
            }

            return localOrder;
        }
    }

    // Admin — Products CRUD
    async createProduct(data: Omit<Product, 'id' | 'rating' | 'reviews_count'>): Promise<Product> {
        try {
            const response = await this.api.post<BackendProduct>('/products', data);
            return toFrontendProduct(unwrapData<BackendProduct>(response.data));
        } catch (error) {
            if (!shouldUseLocalAdminFallback(error)) {
                throw error;
            }

            markBackendFallback('Creation produit effectuee en local car le backend est indisponible.');

            const products = getLocalProductCatalog();
            const created: Product = {
                id: products.reduce((maxId, product) => Math.max(maxId, product.id), 0) + 1,
                title: data.title,
                description: data.description,
                price: data.price,
                discount_price: data.discount_price,
                image: data.image,
                category: data.category,
                in_stock: data.in_stock,
                rating: 0,
                reviews_count: 0,
            };

            setStoredProducts([created, ...products]);
            return created;
        }
    }

    async updateProduct(id: number, data: Partial<Omit<Product, 'id'>>): Promise<Product> {
        try {
            const response = await this.api.put<BackendProduct>(`/products/${id}`, data);
            return toFrontendProduct(unwrapData<BackendProduct>(response.data));
        } catch (error) {
            if (!shouldUseLocalAdminFallback(error)) {
                throw error;
            }

            markBackendFallback('Modification produit effectuee en local car le backend est indisponible.');

            const products = getLocalProductCatalog();
            const index = products.findIndex((product) => product.id === id);

            if (index < 0) {
                throw new Error('Produit introuvable');
            }

            const updated: Product = {
                ...products[index],
                ...data,
            };

            products[index] = updated;
            setStoredProducts(products);
            return updated;
        }
    }

    async deleteProduct(id: number): Promise<void> {
        try {
            await this.api.delete(`/products/${id}`);
        } catch (error) {
            if (!shouldUseLocalAdminFallback(error)) {
                throw error;
            }

            markBackendFallback('Suppression produit effectuee en local car le backend est indisponible.');

            const products = getLocalProductCatalog().filter((product) => product.id !== id);
            setStoredProducts(products);
        }
    }

    async getUsers(): Promise<User[]> {
        const readLocalUsers = (): User[] => {
            const users = getStoredUsers();
            const current = getStoredUser();

            if (current) {
                upsertStoredUser(current);
            }

            const merged = getStoredUsers();
            return merged.length > 0 ? merged : users;
        };

        try {
            const endpoints = ['/users', '/admin/users'];
            const normalizeUsers = (payload: unknown): User[] => {
                if (Array.isArray(payload)) {
                    return payload as User[];
                }

                if (!payload || typeof payload !== 'object') {
                    return [];
                }

                const candidate = payload as {
                    users?: User[];
                    data?: User[];
                };

                if (Array.isArray(candidate.users)) {
                    return candidate.users;
                }

                if (Array.isArray(candidate.data)) {
                    return candidate.data;
                }

                return [];
            };

            let lastError: unknown = null;

            for (const endpoint of endpoints) {
                try {
                    const response = await this.api.get(endpoint);
                    const payload = unwrapData<unknown>(response.data);
                    const users = normalizeUsers(payload);

                    if (users.length > 0) {
                        setStoredUsers(users);
                        return users;
                    }
                } catch (requestError) {
                    lastError = requestError;
                }
            }

            if (lastError && !shouldUseLocalAdminFallback(lastError)) {
                throw lastError;
            }

            markBackendFallback('Liste utilisateurs chargee depuis le stockage local.');
            return readLocalUsers();
        } catch (error) {
            if (!shouldUseLocalAdminFallback(error)) {
                throw error;
            }

            markBackendFallback('Liste utilisateurs chargee depuis le stockage local.');
            return readLocalUsers();
        }
    }

    async setUserAdmin(userId: number, isAdmin: boolean): Promise<User> {
        try {
            const payload = {
                role: isAdmin ? 'admin' : 'user',
                is_admin: isAdmin,
            };

            const requests = [
                () => this.api.patch<User>(`/users/${userId}`, payload),
                () => this.api.patch<User>(`/admin/users/${userId}`, payload),
                () => this.api.put<User>(`/admin/users/${userId}/role`, payload),
            ];

            let lastError: unknown = null;

            for (const request of requests) {
                try {
                    const response = await request();
                    const updated = unwrapData<User>(response.data);
                    upsertStoredUser(updated);
                    const current = getStoredUser();
                    if (current && current.id === updated.id) {
                        setStoredUser(updated);
                    }
                    return updated;
                } catch (requestError) {
                    lastError = requestError;
                }
            }

            if (lastError && !shouldUseLocalAdminFallback(lastError)) {
                throw lastError;
            }

            throw new Error('Impossible de mettre a jour le role utilisateur.');
        } catch (error) {
            if (!shouldUseLocalAdminFallback(error)) {
                throw error;
            }

            markBackendFallback('Mise a jour utilisateur effectuee localement.');

            const users = getStoredUsers();
            const idx = users.findIndex((user) => user.id === userId);

            if (idx < 0) {
                throw new Error('Utilisateur introuvable');
            }

            const updatedUser: User = {
                ...users[idx],
                role: isAdmin ? 'admin' : 'user',
                is_admin: isAdmin,
            };

            users[idx] = updatedUser;
            setStoredUsers(users);

            const current = getStoredUser();
            if (current && current.id === userId) {
                setStoredUser(updatedUser);
            }

            return updatedUser;
        }
    }
}

export default new ApiService();
