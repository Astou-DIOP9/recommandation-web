import React from 'react';
import { AlertCircle, ExternalLink } from 'lucide-react';

interface APIErrorAlertProps {
    message?: string;
    onRetry?: () => void;
}

export const APIErrorAlert: React.FC<APIErrorAlertProps> = ({
    message,
    onRetry,
}) => {
    return (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-6 max-w-2xl mx-auto">
            <div className="flex items-start space-x-4">
                <AlertCircle size={28} className="text-amber-600 flex-shrink-0 mt-1" />
                <div className="flex-1">
                    <h3 className="text-lg font-bold text-amber-900 mb-2">
                        Serveur API indisponible
                    </h3>
                    <p className="text-amber-800 mb-4">
                        {message ||
                            'Impossible de se connecter au serveur API. L\'application fonctionne mode démo sans données.'}
                    </p>

                    <div className="bg-amber-100 rounded p-3 mb-4 font-mono text-sm text-amber-900">
                        <div className="mb-2">
                            <strong>URL attendue:</strong> http://localhost:8000/api
                        </div>
                        <div>
                            <strong>Status:</strong> <span className="text-red-600">❌ Non disponible</span>
                        </div>
                    </div>

                    <div className="bg-white rounded p-3 mb-4 border border-amber-200">
                        <p className="font-semibold text-amber-900 mb-2">💡 Pour démarrer le backend Laravel:</p>
                        <ol className="text-sm text-amber-800 space-y-1 ml-4 list-decimal">
                            <li>Allez dans le dossier de votre projet Laravel</li>
                            <li>Exécutez: <code className="bg-amber-100 px-1 rounded">php artisan serve</code></li>
                            <li>Configurez votre base de données dans <code className="bg-amber-100 px-1 rounded">.env</code></li>
                            <li>Créez les tables: <code className="bg-amber-100 px-1 rounded">php artisan migrate</code></li>
                        </ol>
                    </div>

                    <div className="flex gap-3">
                        {onRetry && (
                            <button
                                onClick={onRetry}
                                className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded font-semibold transition"
                            >
                                Réessayer
                            </button>
                        )}
                        <a
                            href="https://laravel.com/docs"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold transition"
                        >
                            Documentation Laravel
                            <ExternalLink size={16} />
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};
