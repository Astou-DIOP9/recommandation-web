import React, { createContext, useState, useContext, useEffect } from 'react';
import type { User, AuthResponse } from '../types';
import api from '../services/api';

interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    isAdmin: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string, password_confirmation: string) => Promise<void>;
    logout: () => Promise<void>;
    checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const isTruthyAdminFlag = (value: unknown): boolean => {
    if (value === true || value === 1) return true;
    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        return normalized === 'true' || normalized === '1' || normalized === 'yes';
    }
    return false;
};

const hasAdminRights = (user: User | null): boolean => {
    if (!user) return false;

    return isTruthyAdminFlag((user as User & { is_admin?: unknown }).is_admin);
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(() => localStorage.getItem('auth_token'));
    const [isLoading, setIsLoading] = useState(true);
    const isAdmin = hasAdminRights(user);

    const checkAuth = async () => {
        const storedToken = localStorage.getItem('auth_token');
        if (storedToken) {
            // Mode local (pas de backend) : utiliser directement le user stocké
            if (storedToken === 'local-dev-token') {
                const localUser = api.getLocalUser();
                if (localUser) {
                    setUser(localUser);
                    setToken(storedToken);
                    setIsLoading(false);
                    return;
                }
                // Aucun user local → invalider le token
                localStorage.removeItem('auth_token');
                setToken(null);
                setIsLoading(false);
                return;
            }

            try {
                const currentUser = await api.getCurrentUser();
                setUser(currentUser);
                setToken(storedToken);
            } catch (error) {
                // Before giving up, check if there's a locally stored user
                // (e.g. when the backend is offline and the token is local).
                const localUser = api.getLocalUser();
                if (localUser) {
                    setUser(localUser);
                    setToken(storedToken);
                } else {
                    localStorage.removeItem('auth_token');
                    setToken(null);
                    setUser(null);
                }
            }
        }
        setIsLoading(false);
    };

    useEffect(() => {
        checkAuth();
    }, []);

    const login = async (email: string, password: string) => {
        try {
            const response: AuthResponse = await api.login({ email, password });
            localStorage.setItem('auth_token', response.token);
            setToken(response.token);
            setUser(response.user);
        } catch (error) {
            throw error;
        }
    };

    const register = async (name: string, email: string, password: string, password_confirmation: string) => {
        try {
            const response: AuthResponse = await api.register({
                name,
                email,
                password,
                password_confirmation,
            });
            localStorage.setItem('auth_token', response.token);
            setToken(response.token);
            setUser(response.user);
        } catch (error: any) {
            console.error('Register error:', error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            await api.logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.removeItem('auth_token');
            setToken(null);
            setUser(null);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                isLoading,
                isAuthenticated: !!user,
                isAdmin,
                login,
                register,
                logout,
                checkAuth,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};
