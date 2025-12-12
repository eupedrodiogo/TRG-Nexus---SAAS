import React, { useState, useEffect } from 'react';
import {
   FileBarChart2,
   Search,
   Download,
   Plus,
   Calendar,
   CheckCircle2,
   FileText,
   Printer,
   Sparkles,
   TrendingDown,
   ArrowRight,
   History
} from 'lucide-react';
import {
   AreaChart,
   Area,
   XAxis,
   CartesianGrid,
   Tooltip,
   ResponsiveContainer,
} from 'recharts';

// Mock Data specific for reports
const SUD_EVOLUTION_DATA = [
   { sessao: 'Sessão 1', sud: 9, bemEstar: 2 },
   { sessao: 'Sessão 2', sud: 8, bemEstar: 3 },
   { sessao: 'Sessão 3', sud: 6, bemEstar: 5 },
   { sessao: 'Sessão 4', sud: 4, bemEstar: 7 },
   { sessao: 'Sessão 5', sud: 1, bemEstar: 9 },
];

const REPORT_TEMPLATES = [
   { id: 'evolution', title: 'Relatório de Evolução Clínica', desc: 'Análise detalhada do progresso com gráficos SUD e notas.', icon: FileBarChart2, color: 'bg-blue-500' },
   { id: 'statement', title: 'Declaração de Comparecimento', desc: 'Documento simples atestando presença nas sessões.', icon: Calendar, color: 'bg-green-500' },
   { id: 'laudo', title: 'Laudo Técnico Psicológico', desc: 'Documento formal para fins médicos ou jurídicos.', icon: FileText, color: 'bg-purple-500' },
];

const ReportsView: React.FC = () => {
   const [step, setStep] = useState<'list' | 'create' | 'preview'>('list');
   const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
   const [selectedPatient, setSelectedPatient] = useState<string>('');
   const [reportText, setReportText] = useState('');
   const [isGeneratingText, setIsGeneratingText] = useState(false);
   const [patients, setPatients] = useState<any[]>([]);
   const [sudData, setSudData] = useState<any[]>([]);

   useEffect(() => {
      const fetchPatients = async () => {
         try {
            const therapistStr = localStorage.getItem('therapist');
            if (!therapistStr) return;
            const therapist = JSON.parse(therapistStr);
            const response = await fetch(`/api/patients?therapistId=${therapist.id}`);
            if (response.ok) {
               const data = await response.json();
               setPatients(data);
            }
         } catch (error) {
            console.error('Error fetching patients:', error);
         }
      };
      fetchPatients();
   }, []);

   // Fetch patient details when selected to get SUD data
   useEffect(() => {
      if (!selectedPatient) return;
      const fetchDetails = async () => {
         try {
            const response = await fetch(`/api/patient-details?patientId=${selectedPatient}`);
            if (response.ok) {
               const data = await response.json();
               // Transform timeline to SUD data if possible, or leave empty
               // For now, we don't have explicit SUD history in DB, so we'll leave it empty or mock 0
               setSudData([]);
            }
         } catch (e) { console.error(e); }
      };
      fetchDetails();
   }, [selectedPatient]);

   // --- Mock Generation Logic ---
   const handleGenerateAI = () => {
      setIsGeneratingText(true);
      setTimeout(() => {
         setReportText(
            `RESUMO CLÍNICO\n\n` +
            `O paciente ${patients.find(p => p.id === selectedPatient)?.name || 'selecionado'} apresentou evolução significativa ao longo das últimas 5 sessões. ` +
            `Iniciou o tratamento com queixa principal de ansiedade generalizada e traumas de infância (Método Cronológico), apresentando SUD inicial de nível 9.\n\n` +
            `Durante o reprocessamento, observou-se uma redução progressiva da carga emocional associada aos eventos traumáticos. ` +
            `Na fase Somática, o paciente relatou diminuição das tensões físicas. Atualmente, encontra-se estável, com SUD residual próximo a 1 e aumento perceptível nos índices de bem-estar.\n\n` +
            `Recomenda-se a continuidade do protocolo para a fase de Potencialização.`
         );
         setIsGeneratingText(false);
      }, 1500);
   };

   const handleStartCreate = () => {
      setStep('create');
      setSelectedTemplate(null);
      setSelectedPatient('');
      setReportText('');
   };

   const handleSelectTemplate = (id: string) => {
      setSelectedTemplate(id);
   };

   const canProceedToPreview = selectedTemplate && selectedPatient;

   return (
      <div className="space-y-6 animate-fade-in pb-20 md:pb-0 relative">

         {/* Header */}
         <div className="flex flex-col md:flex-row justify-between gap-4">
            <div>
               <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Relatórios Inteligentes</h1>
               <p className="text-slate-500 dark:text-slate-400 text-sm">Gere laudos, declarações e análises de evolução com dados reais.</p>
            </div>
            {step === 'list' && (
               <button
                  onClick={handleStartCreate}
                  className="bg-primary-600 dark:bg-secondary-600 hover:bg-primary-700 dark:hover:bg-secondary-700 text-white px-6 py-2.5 rounded-xl shadow-lg shadow-primary-500/20 dark:shadow-secondary-600/20 transition-all flex items-center gap-2 active:scale-95 font-bold"
               >
                  <Plus size={18} /> Novo Relatório
               </button>
            )}
            {step !== 'list' && (
               <button
                  onClick={() => setStep('list')}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-bold text-sm"
               >
                  Cancelar
               </button>
            )}
         </div>

         {/* --- STEP 1: LIST / DASHBOARD --- */}
         {step === 'list' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
               {/* Stats Cards */}
               <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                  <div className="relative z-10">
                     <div className="p-3 bg-white/20 w-fit rounded-xl mb-4"><FileBarChart2 size={24} /></div>
                     <h3 className="text-3xl font-bold mb-1">12</h3>
                     <p className="text-primary-100 text-sm font-medium">Relatórios gerados este mês</p>
                  </div>
                  <div className="absolute -right-4 -bottom-4 opacity-10"><FileBarChart2 size={120} /></div>
               </div>

               <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                     <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                        <History size={18} className="text-slate-400" /> Recentes
                     </h3>
                     <button className="text-xs font-bold text-primary-600 dark:text-secondary-400 hover:underline">Ver Todos</button>
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                     {[
                        { id: 1, name: 'Laudo - Ana Silva', type: 'Laudo Técnico', date: 'Hoje', status: 'Finalizado' },
                        { id: 2, name: 'Evolução - Carlos O.', type: 'Relatório Clínico', date: 'Ontem', status: 'Finalizado' },
                        { id: 3, name: 'Declaração - Mariana S.', type: 'Declaração', date: '20 Out', status: 'Rascunho' },
                     ].map((rep) => (
                        <div key={rep.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group">
                           <div className="flex items-center gap-4">
                              <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500 group-hover:text-primary-500 dark:group-hover:text-secondary-400 transition-colors">
                                 <FileText size={20} />
                              </div>
                              <div>
                                 <p className="font-bold text-slate-800 dark:text-white text-sm">{rep.name}</p>
                                 <p className="text-xs text-slate-500">{rep.type} • {rep.date}</p>
                              </div>
                           </div>
                           <div className="flex items-center gap-3">
                              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${rep.status === 'Finalizado' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                                 {rep.status}
                              </span>
                              <button className="p-2 text-slate-400 hover:text-primary-600 dark:hover:text-secondary-400"><Download size={16} /></button>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            </div>
         )}

         {/* --- STEP 2: CREATE WIZARD --- */}
         {step === 'create' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

               {/* Left: Configuration */}
               <div className="lg:col-span-4 space-y-6">
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm animate-slide-up">
                     <h3 className="font-bold text-slate-800 dark:text-white mb-4">1. Selecione o Paciente</h3>
                     <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <select
                           className="w-full pl-10 p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 dark:text-white appearance-none cursor-pointer"
                           value={selectedPatient}
                           onChange={(e) => setSelectedPatient(e.target.value)}
                        >
                           <option value="" disabled>Buscar paciente...</option>
                           {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                     </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm animate-slide-up" style={{ animationDelay: '0.1s' }}>
                     <h3 className="font-bold text-slate-800 dark:text-white mb-4">2. Tipo de Documento</h3>
                     <div className="space-y-3">
                        {REPORT_TEMPLATES.map(template => (
                           <div
                              key={template.id}
                              onClick={() => handleSelectTemplate(template.id)}
                              className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${selectedTemplate === template.id
                                 ? 'bg-primary-50 dark:bg-slate-800 border-primary-500 dark:border-secondary-500 ring-1 ring-primary-500 dark:ring-secondary-500'
                                 : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800'
                                 }`}
                           >
                              <div className={`p-2 rounded-lg text-white shrink-0 ${template.color}`}>
                                 <template.icon size={18} />
                              </div>
                              <div>
                                 <h4 className="font-bold text-sm text-slate-800 dark:text-white">{template.title}</h4>
                                 <p className="text-xs text-slate-500 dark:text-slate-400 leading-tight mt-1">{template.desc}</p>
                              </div>
                              {selectedTemplate === template.id && <CheckCircle2 size={18} className="text-primary-600 dark:text-secondary-400 ml-auto" />}
                           </div>
                        ))}
                     </div>
                  </div>

                  <button
                     disabled={!canProceedToPreview}
                     onClick={() => setStep('preview')}
                     className="w-full py-4 bg-slate-900 dark:bg-slate-700 text-white font-bold rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-800 dark:hover:bg-slate-600 transition-all flex items-center justify-center gap-2"
                  >
                     Continuar <ArrowRight size={18} />
                  </button>
               </div>

               {/* Right: Preview / Placeholder */}
               <div className="lg:col-span-8 bg-slate-100 dark:bg-slate-950/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center min-h-[500px]">
                  <div className="text-center max-w-xs opacity-50">
                     <FileBarChart2 size={64} className="mx-auto mb-4 text-slate-400" />
                     <h3 className="text-lg font-bold text-slate-600 dark:text-slate-400">Visualização</h3>
                     <p className="text-sm text-slate-500">Selecione um paciente e um modelo para começar a editar o relatório.</p>
                  </div>
               </div>
            </div>
         )}

         {/* --- STEP 3: PREVIEW & EDIT --- */}
         {step === 'preview' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-slide-up">

               {/* Editor */}
               <div className="lg:col-span-7 space-y-6">

                  {/* AI Generator Card */}
                  <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 rounded-2xl text-white shadow-lg relative overflow-hidden">
                     <div className="relative z-10 flex justify-between items-center">
                        <div>
                           <h3 className="font-bold text-lg flex items-center gap-2"><Sparkles size={18} /> Assistente IA</h3>
                           <p className="text-indigo-100 text-xs">Gere um resumo clínico automático baseado nas notas.</p>
                        </div>
                        <button
                           onClick={handleGenerateAI}
                           disabled={isGeneratingText}
                           className="px-4 py-2 bg-white text-indigo-600 font-bold rounded-lg text-sm hover:bg-indigo-50 transition-colors flex items-center gap-2"
                        >
                           {isGeneratingText ? 'Gerando...' : 'Gerar Resumo'}
                        </button>
                     </div>
                     {/* Decor */}
                     <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                  </div>

                  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                     <h3 className="font-bold text-slate-800 dark:text-white mb-4">Conteúdo do Relatório</h3>
                     <textarea
                        className="w-full h-[400px] p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 dark:text-white resize-none font-serif leading-relaxed text-base"
                        placeholder="O conteúdo do relatório aparecerá aqui..."
                        value={reportText}
                        onChange={(e) => setReportText(e.target.value)}
                     />
                  </div>
               </div>

               {/* Visuals & Export */}
               <div className="lg:col-span-5 space-y-6">
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                     <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                        <TrendingDown size={18} className="text-green-500" /> Evolução do SUD
                     </h3>
                     <div className="h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                           <AreaChart data={sudData}>
                              <defs>
                                 <linearGradient id="colorSud" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                 </linearGradient>
                                 <linearGradient id="colorBemEstar" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                 </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.1} />
                              <XAxis dataKey="sessao" hide />
                              <Tooltip contentStyle={{ borderRadius: '8px' }} />
                              <Area type="monotone" dataKey="sud" name="SUD (Desconforto)" stroke="#ef4444" fillOpacity={1} fill="url(#colorSud)" />
                              <Area type="monotone" dataKey="bemEstar" name="Bem-Estar" stroke="#10b981" fillOpacity={1} fill="url(#colorBemEstar)" />
                           </AreaChart>
                        </ResponsiveContainer>
                     </div>
                  </div>

                  <div className="flex flex-col gap-3">
                     <button className="w-full py-3 bg-slate-800 dark:bg-slate-700 text-white font-bold rounded-xl shadow-lg hover:bg-slate-900 dark:hover:bg-slate-600 transition-all flex items-center justify-center gap-2">
                        <Download size={18} /> Baixar PDF
                     </button>
                     <button className="w-full py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2">
                        <Printer size={18} /> Imprimir
                     </button>
                  </div>
               </div>
            </div>
         )}

      </div>
   );
};

export default ReportsView;