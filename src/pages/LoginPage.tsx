import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock } from 'lucide-react';

export const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!formData.email.trim() || !formData.password.trim()) {
            setError('Veuillez entrer votre email et mot de passe');
            return;
        }

        setIsLoading(true);

        try {
            await login(formData.email, formData.password);
            navigate('/');
        } catch (err: any) {
            let errorMessage = 'Erreur de connexion';

            if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
            } else if (err.response?.data?.errors) {
                const errors = err.response.data.errors;
                const firstError = Object.values(errors)[0];
                errorMessage = Array.isArray(firstError) ? firstError[0] : String(firstError);
            } else if (err.message) {
                errorMessage = err.message;
            }

            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center px-4">
            <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-extrabold text-purple-600 mb-2">SysReco</h1>
                    <p className="text-gray-600 text-lg font-semibold">Bienvenue dans SysReco</p>
                    <p className="text-gray-500 text-sm mt-2">Système de recommandation de produits artisanaux</p>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Email */}
                    <div>
                        <label className="block text-gray-700 font-semibold mb-2">Email</label>
                        <div className="relative">
                            <Mail size={20} className="absolute left-3 top-3 text-gray-400" />
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="votre@email.com"
                                required
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-gray-700 font-semibold mb-2">Mot de passe</label>
                        <div className="relative">
                            <Lock size={20} className="absolute left-3 top-3 text-gray-400" />
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="••••••••"
                                required
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                            />
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-purple-600 text-white font-bold py-2 rounded-lg hover:bg-purple-700 transition disabled:bg-gray-400"
                    >
                        {isLoading ? 'Connexion en cours...' : 'Se connecter'}
                    </button>
                </form>

                {/* Register Link */}
                <p className="text-center text-gray-600 mt-6">
                    Pas encore de compte?{' '}
                    <Link to="/register" className="text-purple-600 font-semibold hover:underline">
                        S'inscrire
                    </Link>
                </p>
            </div>
        </div>
    );
};
