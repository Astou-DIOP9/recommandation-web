import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ShieldOff, Loader, AlertCircle, Check } from 'lucide-react';
import api from '../services/api';
import type { User } from '../types';

export const AdminUsersPage: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [pendingUserId, setPendingUserId] = useState<number | null>(null);

    const loadUsers = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await api.getUsers();
            setUsers(data);
        } catch {
            setError('Impossible de charger les utilisateurs.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const toggleAdmin = async (user: User) => {
        try {
            setPendingUserId(user.id);
            const updated = await api.setUserAdmin(user.id, !(user.is_admin || user.role === 'admin'));
            setUsers((prev) => prev.map((candidate) => (candidate.id === user.id ? updated : candidate)));
            setSuccess(`${updated.name} est maintenant ${updated.is_admin || updated.role === 'admin' ? 'admin' : 'utilisateur'}.`);
            setTimeout(() => setSuccess(null), 3000);
        } catch {
            setError('La mise à jour du rôle a échoué.');
        } finally {
            setPendingUserId(null);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-purple-700 text-white py-6 px-4 shadow">
                <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold">Administration — Utilisateurs</h1>
                        <p className="text-purple-200 text-sm mt-1">Promouvoir ou rétrograder les comptes admin</p>
                    </div>
                    <div className="flex gap-3">
                        <Link to="/admin" className="admin-top-link px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded text-sm transition">
                            Gérer les produits
                        </Link>
                        <Link to="/" className="admin-top-link px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded text-sm transition">
                            Retour au site
                        </Link>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 py-6">
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
                    </div>
                )}

                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <Loader className="animate-spin text-purple-600" size={36} />
                    </div>
                ) : users.length === 0 ? (
                    <div className="text-center py-16 text-gray-500">Aucun utilisateur disponible.</div>
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
                                                        onClick={() => toggleAdmin(user)}
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
            </div>
        </div>
    );
};
