import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send, Bot, ChevronDown, Zap } from 'lucide-react';
import { AppView } from '../types';

interface Message {
  id: string;
  role: 'user' | 'ai';
  text: string;
  type?: 'text' | 'suggestion';
}

interface AiAssistantProps {
  currentView?: AppView;
}

const TRG_KNOWLEDGE_BASE: Record<string, string> = {
  'anamnese': 'A Anamnese é a fase de coleta de dados. Foque na queixa principal e histórico familiar. Pergunte sobre medicamentos e tratamentos anteriores.',
  'cronologico': 'No método Cronológico, trabalhamos a linha do tempo. Peça para o cliente fazer o "pior filme" do período. Use a escala SUD para medir o desconforto.',
  'somatico': 'O método Somático foca na dor física. "Onde dói? Qual a cor/forma da dor?". Peça para o cliente mergulhar na sensação.',
  'tematico': 'Use o Temático para medos específicos (altura, animais, situações). É ótimo para fobias pontuais.',
  'futuro': 'Na Ponte ao Futuro, validamos se o trauma foi resolvido. O cliente deve imaginar o futuro sem desconforto.',
  'potencializacao': 'Instalação de recursos positivos. Coragem, Força, Calma. Use para fechar a sessão com alta energia.',
  'financeiro': 'Para gerenciar pagamentos, vá até o módulo Financeiro no menu lateral. Você pode emitir recibos e criar links de pagamento.',
  'marketing': 'No módulo de Marketing, você pode gerenciar leads e gerar conteúdo com IA. Use o Kanban para mover leads até o fechamento.',
  'agenda': 'Use o botão de "Otimização Inteligente" na Agenda para reagrupar horários e diminuir janelas ociosas.',
  'default': 'Sou o Nexus AI. Posso ajudar com dúvidas sobre o Protocolo TRG, scripts de sessão, financeiro ou marketing. Como posso ajudar?'
};

const CONTEXT_SUGGESTIONS: Record<string, string[]> = {
  'dashboard': ['Como aumentar minha retenção?', 'Previsão de receita', 'Dicas de produtividade'],
  'therapy': ['Script para bloqueio emocional', 'O que fazer se o SUD não baixar?', 'Encerrar sessão com segurança'],
  'marketing': ['Ideia de post para ansiedade', 'Script de vendas WhatsApp', 'Como captar mais pacientes'],
  'financial': ['Como calcular meu ROI?', 'Estratégia de precificação', 'Reduzir inadimplência'],
  'agenda': ['Otimizar agenda', 'Lembretes automáticos', 'Confirmar consultas'],
  'patients': ['Como fidelizar pacientes?', 'Modelo de prontuário', 'Anamnese eficiente'],
  'reports': ['Como interpretar o gráfico SUD?', 'Modelo de laudo técnico', 'Estatísticas de evolução'],
  'settings': ['Configurar backup', 'Segurança de dados', 'Personalizar perfil']
};

const AiAssistant: React.FC<AiAssistantProps> = ({ currentView = AppView.DASHBOARD }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'ai', text: 'Olá! Sou seu copiloto TRG. Estou analisando o contexto da sua tela para ajudar.' }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Context Detection
  const [currentContext, setCurrentContext] = useState<string>(currentView);

  useEffect(() => {
    setCurrentContext(currentView);
  }, [currentView]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen, isTyping]);

  const handleSendMessage = async (e?: React.FormEvent, overrideText?: string) => {
    e?.preventDefault();
    const textToSend = overrideText || inputValue;
    if (!textToSend.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: textToSend };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    setTimeout(() => {
      let responseText = TRG_KNOWLEDGE_BASE['default'];
      const lowerInput = textToSend.toLowerCase();

      Object.keys(TRG_KNOWLEDGE_BASE).forEach(key => {
        if (lowerInput.includes(key)) {
          responseText = TRG_KNOWLEDGE_BASE[key];
        }
      });

      const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'ai', text: responseText };
      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1500);
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-[90] w-14 h-14 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full shadow-2xl flex items-center justify-center text-white hover:scale-110 transition-transform active:scale-95 animate-fade-in group"
      >
        <Sparkles size={24} className="group-hover:animate-spin-slow" />
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
      </button>
    );
  }

  return (
    <div className={`fixed z-[90] bg-white dark:bg-slate-900 shadow-2xl rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden transition-all duration-300 flex flex-col ${isMinimized ? 'bottom-6 right-6 w-72 h-16' : 'bottom-6 right-6 w-full max-w-[380px] h-[550px]'}`}>
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 flex items-center justify-between cursor-pointer shrink-0" onClick={() => !isMinimized && setIsMinimized(true)}>
        <div className="flex items-center gap-2 text-white"><Bot size={20} /><div><h3 className="font-bold text-sm">Nexus AI Copilot</h3><span className="text-[10px] opacity-80 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span> Online</span></div></div>
        <div className="flex items-center gap-2 text-white/80">
          {isMinimized ? <button onClick={(e) => { e.stopPropagation(); setIsMinimized(false); }}><ChevronDown className="transform rotate-180" size={18} /></button> : <button onClick={(e) => { e.stopPropagation(); setIsMinimized(true); }}><ChevronDown size={18} /></button>}
          <button onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}><X size={18} /></button>
        </div>
      </div>

      {!isMinimized && (
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-950">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'ai' && <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center mr-2 shrink-0 text-indigo-600 dark:text-indigo-400"><Bot size={16} /></div>}
                <div className={`max-w-[85%] p-3 rounded-xl text-sm leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-tl-none'}`}>{msg.text}</div>
              </div>
            ))}
            {isTyping && <div className="flex justify-start"><div className="bg-white dark:bg-slate-800 p-3 rounded-xl rounded-tl-none border border-slate-200 dark:border-slate-700 shadow-sm flex gap-1 ml-10"><div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div><div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div><div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div></div></div>}
            <div ref={messagesEndRef} />
          </div>
          <div className="p-2 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 overflow-x-auto flex gap-2 no-scrollbar">
             {(CONTEXT_SUGGESTIONS[currentContext] || CONTEXT_SUGGESTIONS['dashboard']).map((sugg, i) => (
                <button key={i} onClick={() => handleSendMessage(undefined, sugg)} className="whitespace-nowrap px-3 py-1.5 bg-white dark:bg-slate-800 border border-indigo-100 dark:border-slate-700 rounded-full text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-1"><Zap size={10} /> {sugg}</button>
             ))}
          </div>
          <form onSubmit={handleSendMessage} className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0">
            <div className="relative">
              <input type="text" placeholder="Digite sua dúvida..." className="w-full pl-4 pr-10 py-3 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 dark:text-white outline-none" value={inputValue} onChange={(e) => setInputValue(e.target.value)} />
              <button type="submit" disabled={!inputValue.trim() || isTyping} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"><Send size={16} /></button>
            </div>
          </form>
        </>
      )}
    </div>
  );
};

export default AiAssistant;