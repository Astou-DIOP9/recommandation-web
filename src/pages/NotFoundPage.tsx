import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center px-4">
            <div className="text-center max-w-md">
                <div className="mb-6">
                    <AlertCircle size={80} className="mx-auto text-purple-600 opacity-50" />
                </div>

                <h1 className="text-6xl font-bold text-gray-800 mb-2">404</h1>
                <h2 className="text-2xl font-semibold text-gray-700 mb-4">
                    Page non trouvée
                </h2>
                <p className="text-gray-600 mb-8">
                    Désolé, la page que vous recherchez n'existe pas ou a been supprimée.
                </p>

                <div className="flex gap-4">
                    <button
                        onClick={() => navigate('/')}
                        className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg transition"
                    >
                        Retour à l'accueil
                    </button>
                    <button
                        onClick={() => navigate(-1)}
                        className="flex-1 border-2 border-purple-600 text-purple-600 hover:bg-purple-50 font-bold py-3 rounded-lg transition"
                    >
                        Retour
                    </button>
                </div>
            </div>
        </div>
    );
};
