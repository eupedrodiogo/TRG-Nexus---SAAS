import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { BrainCircuit, Mail, User, ArrowRight, Loader2 } from 'lucide-react';

const RegisterPage: React.FC = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const plan = new URLSearchParams(window.location.search).get('plan') || 'trial';
            const redirectUrl = `${window.location.origin}/dashboard`;

            // Basic validation
            if (!formData.phone || formData.phone.length < 10) {
                throw new Error('Por favor, insira um número de WhatsApp válido.');
            }

            console.log('Initiating Magic Link for:', formData.email);

            // 1. Sign In with OTP
            const { error: authError } = await supabase.auth.signInWithOtp({
                email: formData.email,
                options: {
                    emailRedirectTo: redirectUrl,
                    data: {
                        name: formData.name,
                        phone: formData.phone, // Save phone in metadata
                        plan: plan
                    }
                }
            });

            if (authError) throw authError;

            // 2. Send Notifications (Async - don't block success state)
            // A. Email
            fetch('/api/emails/welcome', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: formData.email, name: formData.name, plan: plan })
            }).catch(console.error);

            // B. WhatsApp
            fetch('/api/notifications/register-welcome', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: formData.name, phone: formData.phone })
            }).catch(console.error);

            setSuccess(true);

        } catch (err: any) {
            console.error('Registration Error:', err);
            setError(err.message || 'Erro ao realizar cadastro.');
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
                <div className="sm:mx-auto sm:w-full sm:max-w-md text-center px-4">
                    <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6 shadow-sm">
                        <Mail className="w-10 h-10 text-green-600 dark:text-green-400" />
                    </div>
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                        Tudo certo! Verifique seu email
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400 mb-8 text-lg leading-relaxed">
                        Enviamos um Link Mágico para <strong>{formData.email}</strong>.<br />
                        Também enviamos uma confirmação no seu <strong>WhatsApp</strong> 📲.
                    </p>

                    <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl mb-8 border border-blue-100 dark:border-blue-800">
                        <p className="text-blue-900 dark:text-blue-100 font-medium mb-4">
                            Abra seu email e clique no botão:
                        </p>
                        <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-dashed border-blue-200 dark:border-blue-700 font-bold text-primary-600 dark:text-primary-400 mb-4">
                            "Acessar Painel VIP"
                        </div>
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                            Isso validará sua conta automaticamente, sem senhas!
                        </p>
                    </div>

                    <a
                        href={`mailto:${formData.email}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-6 border border-transparent shadow-lg text-sm font-bold rounded-xl text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all active:scale-95 mb-4"
                    >
                        <Mail size={18} />
                        Abrir meu Email agora
                    </a>

                    <a href="/login" className="text-sm text-slate-500 hover:text-primary-600 transition-colors">
                        Voltar para Login
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center items-center gap-2 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/20">
                        <BrainCircuit size={24} className="text-white" />
                    </div>
                    <span className="font-bold text-2xl tracking-tight text-slate-800 dark:text-white">
                        TRG<span className="text-primary-500">Nexus</span>
                    </span>
                </div>
                <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                    Crie sua conta de Terapeuta
                </h2>
                <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">
                    Acesso seguro e simplificado via email.
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white dark:bg-slate-900 py-8 px-4 shadow-xl shadow-slate-200/50 dark:shadow-none sm:rounded-2xl sm:px-10 border border-slate-100 dark:border-slate-800">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Nome Completo</label>
                            <div className="mt-1 relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="appearance-none block w-full pl-10 px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-slate-800 dark:text-white transition-colors"
                                    placeholder="Seu nome"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">WhatsApp</label>
                            <div className="mt-1 relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="text-slate-400 text-xs font-bold">BR</span>
                                </div>
                                <input
                                    type="tel"
                                    required
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="appearance-none block w-full pl-10 px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-slate-800 dark:text-white transition-colors"
                                    placeholder="(11) 99999-9999"
                                />
                            </div>
                            <p className="mt-1 text-xs text-slate-500">Para receber confirmação e notificações.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Email Profissional</label>
                            <div className="mt-1 relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="appearance-none block w-full pl-10 px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-slate-800 dark:text-white transition-colors"
                                    placeholder="voce@exemplo.com"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="rounded-md bg-red-50 dark:bg-red-900/30 p-4">
                                <div className="flex">
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                                            Erro
                                        </h3>
                                        <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                                            {error}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-primary-500/30"
                            >
                                {isLoading ? (
                                    <Loader2 className="animate-spin h-5 w-5 text-white" />
                                ) : (
                                    <span className="flex items-center gap-2">
                                        Receber Link de Acesso
                                        <ArrowRight size={18} className="text-primary-100 group-hover:translate-x-1 transition-transform" />
                                    </span>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
