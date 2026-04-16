import React from 'react';
import { Sparkles } from 'lucide-react';

export const DemoModeBanner: React.FC = () => {
    return (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-l-4 border-blue-500 rounded-lg p-4 mb-6 flex items-center gap-3">
            <Sparkles size={20} className="text-blue-600 flex-shrink-0" />
            <div>
                <p className="text-blue-900 font-semibold">Mode Démonstration</p>
                <p className="text-blue-700 text-sm">
                    Les données affichées sont des exemples. Démarrez votre API Laravel pour voir les véritables données.
                </p>
            </div>
        </div>
    );
};
