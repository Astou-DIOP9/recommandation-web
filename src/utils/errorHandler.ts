import type { AxiosError } from 'axios';

export const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
        // Erreurs axios
        const axiosError = error as AxiosError<any>;
        if (axiosError.response?.data?.message) {
            return axiosError.response.data.message;
        }
        if (axiosError.code === 'ERR_NETWORK') {
            return 'Impossible de se connecter au serveur. Assurez-vous que l\'API est disponible sur http://localhost:8000';
        }
        if (axiosError.message === 'Network Error') {
            return 'Erreur de connexion réseau. Vérifiez que votre serveur est en cours d\'exécution.';
        }
        return error.message;
    }
    return 'Une erreur inconnue s\'est produite';
};

export const isNetworkError = (error: unknown): boolean => {
    if (error instanceof Error) {
        const axiosError = error as AxiosError;
        return (
            axiosError.code === 'ERR_NETWORK' ||
            axiosError.message === 'Network Error' ||
            !axiosError.response
        );
    }
    return false;
};
