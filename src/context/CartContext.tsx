import React, { createContext, useState, useContext, useEffect } from 'react';
import type { CartItem, Product } from '../types';
import api from '../services/api';
import { useAuth } from './AuthContext';

interface CartContextType {
    items: CartItem[];
    isLoading: boolean;
    total: number;
    addToCart: (product: Product, quantity: number) => Promise<void>;
    removeFromCart: (productId: number) => Promise<void>;
    updateCartItem: (productId: number, quantity: number) => Promise<void>;
    clearCart: () => Promise<void>;
    fetchCart: () => Promise<void>;
    getItemCount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { token, user } = useAuth();
    const [items, setItems] = useState<CartItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [total, setTotal] = useState(0);

    const normalizeItems = (rawItems: unknown): CartItem[] => {
        if (!Array.isArray(rawItems)) {
            return [];
        }

        return rawItems
            .map((entry) => {
                const item = entry as Partial<CartItem> & { quantite?: number; product?: Product };
                const productId = Number(item.product_id ?? item.product?.id);
                const quantity = Number(item.quantity ?? item.quantite ?? 0);

                if (!Number.isFinite(productId) || productId <= 0 || !Number.isFinite(quantity) || quantity <= 0) {
                    return null;
                }

                return {
                    product_id: productId,
                    quantity,
                    product: item.product,
                } as CartItem;
            })
            .filter(Boolean) as CartItem[];
    };

    const computeItemsTotal = (sourceItems: CartItem[]) => {
        return sourceItems.reduce((sum, item) => {
            const price = item.product?.discount_price || item.product?.price || 0;
            return sum + price * item.quantity;
        }, 0);
    };

    const fetchCart = async () => {
        try {
            setIsLoading(true);
            const cartData = await api.getCart();
            const normalizedItems = normalizeItems(cartData.items);
            setItems(normalizedItems);
            setTotal(typeof cartData.total === 'number' ? cartData.total : computeItemsTotal(normalizedItems));
        } catch (error) {
            console.error('Error fetching cart:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (token && user) {
            fetchCart();
            return;
        }

        setItems([]);
        setTotal(0);
    }, [token, user?.id, user?.email]);

    const addToCart = async (product: Product, quantity: number) => {
        try {
            setIsLoading(true);
            await api.addToCart(product.id, quantity, product);
            setItems((previous) => {
                const index = previous.findIndex((item) => item.product_id === product.id);
                if (index < 0) {
                    const next = [...previous, { product_id: product.id, quantity, product }];
                    setTotal(computeItemsTotal(next));
                    return next;
                }

                const next = previous.map((item, idx) =>
                    idx === index ? { ...item, quantity: item.quantity + quantity } : item
                );
                setTotal(computeItemsTotal(next));
                return next;
            });
        } catch (error) {
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const removeFromCart = async (productId: number) => {
        try {
            setIsLoading(true);
            await api.removeFromCart(productId);
            setItems((previous) => {
                const next = previous.filter((item) => item.product_id !== productId);
                setTotal(computeItemsTotal(next));
                return next;
            });
        } catch (error) {
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const updateCartItem = async (productId: number, quantity: number) => {
        try {
            setIsLoading(true);
            if (quantity <= 0) {
                await removeFromCart(productId);
            } else {
                await api.updateCartItem(productId, quantity);
                setItems((previous) => {
                    const next = previous.map((item) =>
                        item.product_id === productId ? { ...item, quantity } : item
                    );
                    setTotal(computeItemsTotal(next));
                    return next;
                });
            }
        } catch (error) {
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const clearCart = async () => {
        try {
            setIsLoading(true);
            await api.clearCart();
            setItems([]);
            setTotal(0);
        } catch (error) {
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const getItemCount = () => {
        return items.reduce((count, item) => count + item.quantity, 0);
    };

    return (
        <CartContext.Provider
            value={{
                items,
                isLoading,
                total,
                addToCart,
                removeFromCart,
                updateCartItem,
                clearCart,
                fetchCart,
                getItemCount,
            }}
        >
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within CartProvider');
    }
    return context;
};
