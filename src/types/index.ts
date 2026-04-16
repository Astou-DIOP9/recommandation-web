export interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    role?: string;
    is_admin?: boolean;
}

export interface Product {
    id: number;
    title: string;
    description: string;
    price: number;
    discount_price?: number;
    image: string;
    category: string;
    rating: number;
    reviews_count: number;
    in_stock: boolean;
}

export interface Review {
    id: number;
    user_id: number;
    product_id: number;
    rating: number;
    comment: string;
    user_name: string;
    user_avatar?: string;
    created_at: string;
}

export interface CartItem {
    product_id: number;
    quantity: number;
    product?: Product;
}

export interface AuthResponse {
    token: string;
    user: User;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
}

export interface Recommendation {
    product_id: number;
    score: number;
    reason: string;
    product?: Product;
}
