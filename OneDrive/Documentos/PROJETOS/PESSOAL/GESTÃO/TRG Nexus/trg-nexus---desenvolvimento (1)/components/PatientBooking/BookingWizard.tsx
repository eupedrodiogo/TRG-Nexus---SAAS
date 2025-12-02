import React, { useState } from 'react';
import { BrainCircuit, Check } from 'lucide-react';
import RegisterStep from './steps/RegisterStep';
import AnamnesisStep from './steps/AnamnesisStep';
import ScheduleStep from './steps/ScheduleStep';
import PaymentStep from './steps/PaymentStep';

const BookingWizard: React.FC = () => {
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        complaint: '',
        history: '',
        medication: '',
        date: '',
        time: ''
    });
    const [isCompleted, setIsCompleted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const updateData = (data: any) => {
        setFormData(prev => ({ ...prev, ...data }));
    };

    const nextStep = () => setCurrentStep(prev => prev + 1);
    const prevStep = () => setCurrentStep(prev => prev - 1);

    const handleCompletion = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/booking', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                setIsCompleted(true);
            } else {
                const errorData = await response.json();
                alert(`Erro ao realizar agendamento: ${errorData.error || 'Tente novamente.'}`);
            }
        } catch (error) {
            console.error('Booking error:', error);
            alert('Erro de conexão. Verifique sua internet.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isCompleted) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-2xl text-center animate-scale-in">
                    <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600 dark:text-green-400">
                        <Check size={40} strokeWidth={3} />
                    </div>
                    <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-4">Agendamento Confirmado!</h2>
                    <p className="text-slate-600 dark:text-slate-300 mb-8">
                        Obrigado, {formData.name}. Sua sessão foi agendada para o dia {new Date(formData.date).toLocaleDateString('pt-BR')} às {formData.time}.
                        Enviamos os detalhes para seu email.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="w-full py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-white font-bold rounded-xl transition-all"
                    >
                        Voltar ao Início
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans">
            {/* Header */}
            <header className="h-20 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between px-6 lg:px-12 sticky top-0 z-50">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/20">
                        <BrainCircuit size={24} className="text-white" />
                    </div>
                    <span className="font-bold text-xl tracking-tight text-slate-800 dark:text-white">
                        TRG<span className="text-primary-500">Nexus</span>
                    </span>
                </div>

                {/* Progress Steps */}
                <div className="hidden md:flex items-center gap-4">
                    {[1, 2, 3, 4].map(step => (
                        <div key={step} className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all
                ${step === currentStep
                                    ? 'bg-primary-600 text-white ring-4 ring-primary-100 dark:ring-primary-900/30'
                                    : step < currentStep
                                        ? 'bg-green-500 text-white'
                                        : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                                }
              `}>
                                {step < currentStep ? <Check size={16} /> : step}
                            </div>
                            {step < 4 && <div className={`w-12 h-1 rounded-full ${step < currentStep ? 'bg-green-500' : 'bg-slate-200 dark:bg-slate-800'}`}></div>}
                        </div>
                    ))}
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex items-center justify-center p-4 md:p-8">
                <div className="w-full max-w-5xl">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-4"></div>
                            <p className="text-slate-500 font-medium">Processando agendamento...</p>
                        </div>
                    ) : (
                        <>
                            {currentStep === 1 && <RegisterStep data={formData} onUpdate={updateData} onNext={nextStep} />}
                            {currentStep === 2 && <AnamnesisStep data={formData} onUpdate={updateData} onNext={nextStep} onBack={prevStep} />}
                            {currentStep === 3 && <ScheduleStep data={formData} onUpdate={updateData} onNext={nextStep} onBack={prevStep} />}
                            {currentStep === 4 && <PaymentStep data={formData} onBack={prevStep} onComplete={handleCompletion} />}
                        </>
                    )}
                </div>
            </main>
        </div>
    );
};

export default BookingWizard;
