import React, { useEffect } from 'react';

const ClientAuthHandler: React.FC = () => {
    useEffect(() => {
        // Extract ID from URL: /portal-paciente/autenticar/:id
        const pathParts = window.location.pathname.split('/');
        const patientId = pathParts[pathParts.length - 1];

        if (patientId) {
            // Save session
            localStorage.setItem('client_portal_id', patientId);

            // Redirect to dashboard (clean URL)
            window.location.href = '/portal-paciente/dashboard';
        } else {
            // Error or invalid link
            window.location.href = '/portal-paciente/login';
        }
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
                <p className="text-slate-500 font-bold animate-pulse">Autenticando...</p>
            </div>
        </div>
    );
};

export default ClientAuthHandler;
