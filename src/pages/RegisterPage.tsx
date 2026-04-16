import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Lock } from 'lucide-react';

export const RegisterPage: React.FC = () => {
    const navigate = useNavigate();
    const { register } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });
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

        if (!formData.name.trim()) {
            setError('Veuillez entrer votre nom complet');
            return;
        }

        if (!formData.email.trim()) {
            setError('Veuillez entrer votre email');
            return;
        }

        if (formData.password.length < 6) {
            setError('Le mot de passe doit contenir au moins 6 caractères');
            return;
        }

        if (formData.password !== formData.password_confirmation) {
            setError('Les mots de passe ne correspondent pas');
            return;
        }

        setIsLoading(true);

        try {
            await register(
                formData.name,
                formData.email,
                formData.password,
                formData.password_confirmation
            );
            navigate('/');
        } catch (err: any) {
            let errorMessage = 'Erreur lors de l\'inscription';

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
                <h1 className="text-3xl font-bold text-purple-600 mb-8 text-center">
                    S'inscrire
                </h1>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Name */}
                    <div>
                        <label className="block text-gray-700 font-semibold mb-2">Nom complet</label>
                        <div className="relative">
                            <User size={20} className="absolute left-3 top-3 text-gray-400" />
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Astou DIOP"
                                required
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                            />
                        </div>
                    </div>

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

                    {/* Password Confirmation */}
                    <div>
                        <label className="block text-gray-700 font-semibold mb-2">
                            Confirmer le mot de passe
                        </label>
                        <div className="relative">
                            <Lock size={20} className="absolute left-3 top-3 text-gray-400" />
                            <input
                                type="password"
                                name="password_confirmation"
                                value={formData.password_confirmation}
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
                        {isLoading ? 'Inscription en cours...' : 'S\'inscrire'}
                    </button>
                </form>

                {/* Login Link */}
                <p className="text-center text-gray-600 mt-6">
                    Vous avez déjà un compte?{' '}
                    <Link to="/login" className="text-purple-600 font-semibold hover:underline">
                        Se connecter
                    </Link>
                </p>
            </div>
        </div>
    );
};
