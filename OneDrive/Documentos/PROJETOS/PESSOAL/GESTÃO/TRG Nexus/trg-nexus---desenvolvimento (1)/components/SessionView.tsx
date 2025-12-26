
import React, { useState, useRef, useEffect } from 'react';
import {
  Clock,
  Save,
  PlayCircle,
  BrainCircuit,
  AlertCircle,
  Mic,
  PauseCircle,
  FileText,
  PenTool,
  VideoIcon,
  VideoOff,
  MicOff,
  Download,
  Users,
  Play,
  MessageSquare,
  Wind,
  ArrowRight,
  Settings,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  X,
  PlusCircle,
  Trash2,
  Edit2,
  RefreshCw,
  Film,
  Video,
  Sparkles,
  Waves,
  Menu,
  ChevronRight,
  Plus,
  Zap,
  Target,
  Smile,
  AlertTriangle,
  Flag,
  Radio,
  Square,
  Calendar,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { ClientIntakeData } from '../types';
import { useVideoCall } from '../hooks/useVideoCall';

// ... (Keep Interfaces and SudScale component as is) ...
interface PhaseRecord {
  duration: string;
  response: string;
  observation: string;
}

interface SessionRecording {
  id: string;
  patientId: string;
  patientName: string;
  date: string;
  duration: string;
  type: 'video' | 'audio';
  phase: string;
  size: string;
  blobUrl?: string;
}

interface ProtocolPhase {
  id: string;
  label: string;
  isSystem?: boolean;
  customScript?: string;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

const SudScale = ({ value, onChange, label }: { value: number, onChange: (v: number) => void, label?: string }) => {
  const getLabel = (v: number) => {
    if (v === 0) return "Neutro / Paz";
    if (v <= 2) return "Desconforto Mínimo";
    if (v <= 4) return "Desconforto Leve";
    if (v <= 6) return "Desconforto Moderado";
    if (v <= 8) return "Desconforto Alto";
    return "Desconforto Extremo";
  };

  const getColorClasses = (v: number) => {
    if (v === 0) return { bg: 'bg-emerald-500', text: 'text-emerald-600', border: 'border-emerald-500', ring: 'ring-emerald-500/30' };
    if (v <= 3) return { bg: 'bg-cyan-500', text: 'text-cyan-600', border: 'border-cyan-500', ring: 'ring-cyan-500/30' };
    if (v <= 7) return { bg: 'bg-amber-500', text: 'text-amber-600', border: 'border-amber-500', ring: 'ring-amber-500/30' };
    return { bg: 'bg-rose-600', text: 'text-rose-600', border: 'border-rose-600', ring: 'ring-rose-600/30' };
  };

  const colors = getColorClasses(value);

  return (
    <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm transition-all hover:shadow-md">
      <div className="flex justify-between items-end mb-4">
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            {label || "SUD (Nível de Perturbação)"}
          </h3>
          <p className={`text-lg font-bold mt-1 transition-colors ${colors.text} dark:${colors.text}`}>
            {value} - {getLabel(value)}
          </p>
        </div>
        <div className="text-right hidden lg:block">
          <span className="text-[10px] text-slate-400 font-medium bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full border border-slate-200 dark:border-slate-600">
            0 = Sem Queixa | 10 = O Pior Possível
          </span>
        </div>
      </div>

      {/* MOBILE: Vertical Slider Design */}
      <div className="lg:hidden">
        <div className="flex gap-4 items-center">
          {/* Slider Track */}
          <div className="relative flex-1">
            <input
              type="range"
              min="0"
              max="10"
              value={value}
              onChange={(e) => onChange(Number(e.target.value))}
              className={`w-full h-3 rounded-lg appearance-none cursor-pointer transition-all
                bg-gradient-to-r from-emerald-200 via-amber-200 to-rose-200
                dark:from-emerald-900/30 dark:via-amber-900/30 dark:to-rose-900/30
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-8
                [&::-webkit-slider-thumb]:h-8
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:${colors.bg}
                [&::-webkit-slider-thumb]:shadow-lg
                [&::-webkit-slider-thumb]:ring-4
                [&::-webkit-slider-thumb]:${colors.ring}
                [&::-webkit-slider-thumb]:cursor-pointer
                [&::-webkit-slider-thumb]:transition-all
                [&::-webkit-slider-thumb]:hover:scale-110
                [&::-moz-range-thumb]:w-8
                [&::-moz-range-thumb]:h-8
                [&::-moz-range-thumb]:rounded-full
                [&::-moz-range-thumb]:${colors.bg}
                [&::-moz-range-thumb]:border-0
                [&::-moz-range-thumb]:shadow-lg
                [&::-moz-range-thumb]:cursor-pointer
              `}
            />
            {/* Value Markers */}
            <div className="flex justify-between mt-2 px-1">
              {[0, 2, 4, 6, 8, 10].map((num) => (
                <button
                  key={num}
                  onClick={() => onChange(num)}
                  className={`text-xs font-bold transition-all ${value === num
                      ? `${colors.text} scale-125`
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                    }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          {/* Large Value Display */}
          <div className={`flex-shrink-0 w-20 h-20 rounded-2xl ${colors.bg} text-white flex items-center justify-center shadow-lg ring-4 ${colors.ring}`}>
            <span className="text-3xl font-bold">{value}</span>
          </div>
        </div>

        {/* Quick Select Buttons */}
        <div className="grid grid-cols-11 gap-1 mt-4">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
            const btnColors = getColorClasses(num);
            return (
              <button
                key={num}
                onClick={() => onChange(num)}
                className={`h-8 rounded-lg text-xs font-bold transition-all ${value === num
                    ? `${btnColors.bg} text-white shadow-md scale-110`
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
              >
                {num}
              </button>
            );
          })}
        </div>
      </div>

      {/* DESKTOP: Horizontal Segmented Control */}
      <div className="hidden lg:block relative">
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-100 dark:bg-slate-700 -translate-y-1/2 rounded-full -z-0"></div>
        <div className="flex justify-between items-center gap-2 relative z-10">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
            const isActive = value === num;
            const isLower = num < value;
            const btnColors = getColorClasses(num);

            return (
              <button
                key={num}
                onClick={() => onChange(num)}
                className={`
                  relative flex flex-col items-center justify-center transition-all duration-300 group
                  ${isActive ? 'flex-1 scale-110' : 'w-10 hover:scale-105'}
                `}
              >
                <div className={`
                  w-10 h-14 rounded-xl flex items-center justify-center text-sm font-bold shadow-sm transition-all
                  ${isActive
                    ? `${btnColors.bg} text-white shadow-lg ring-4 ${btnColors.ring} -translate-y-2`
                    : `bg-white dark:bg-slate-800 border-2 ${isLower ? 'border-primary-100 dark:border-slate-700/50 text-slate-400' : 'border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400'} hover:border-primary-300 dark:hover:border-primary-700 hover:-translate-y-1`
                  }
                `}>
                  {num}
                </div>
                {isActive && <div className={`absolute -bottom-2 w-1 h-1 rounded-full ${btnColors.bg}`}></div>}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  );
};

const TherapistScript = ({ children, title, editable, onEdit }: { children?: React.ReactNode, title?: string, editable?: boolean, onEdit?: (text: string) => void }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(typeof children === 'string' ? children : '');

  return (
    <div className="bg-slate-50 dark:bg-slate-800/50 border-l-4 border-primary-500 dark:border-secondary-500 rounded-r-xl p-4 my-4 shadow-sm group transition-all hover:shadow-md">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-primary-700 dark:text-secondary-400 font-bold text-xs uppercase tracking-wider">
          <MessageSquare size={14} />
          {title || "Script do Terapeuta"}
        </div>
        {editable && (
          <button onClick={() => setIsEditing(!isEditing)} className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-primary-600">
            <Edit2 size={12} />
          </button>
        )}
      </div>
      {isEditing && editable && onEdit ? (
        <textarea className="w-full p-2 text-sm border rounded bg-white dark:bg-slate-900 dark:text-white dark:border-slate-700" value={text} onChange={(e) => { setText(e.target.value); onEdit(e.target.value); }} onBlur={() => setIsEditing(false)} autoFocus />
      ) : (
        <p className="text-sm text-slate-700 dark:text-slate-300 italic leading-relaxed whitespace-pre-line">"{text || children}"</p>
      )}
    </div>
  );
};

const DEFAULT_PHASES: ProtocolPhase[] = [
  { id: 'anamnese', label: 'Anamnese', isSystem: true },
  { id: 'cronologico', label: '1. Cronológico', isSystem: true },
  { id: 'somatico', label: '2. Somático', isSystem: true },
  { id: 'tematico', label: '3. Temático', isSystem: true },
  { id: 'futuro', label: '4. Futuro', isSystem: true },
  { id: 'potencializacao', label: '5. Potencialização', isSystem: true },
];

const SessionView: React.FC = () => {
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');

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

          // Check for saved patient ID from navigation
          const savedPatientId = localStorage.getItem('TRG_CURRENT_PATIENT_ID');
          if (savedPatientId && data.some((p: any) => p.id === savedPatientId)) {
            setSelectedPatientId(savedPatientId);
            localStorage.removeItem('TRG_CURRENT_PATIENT_ID'); // Clear after use
          } else if (data.length > 0) {
            setSelectedPatientId(data[0].id);
          }
        }
      } catch (error) {
        console.error('Error fetching patients:', error);
      }
    };
    fetchPatients();
  }, []);

  // Fetch Intake Data (Anamnesis) for selected patient
  useEffect(() => {
    const fetchIntakeData = async () => {
      if (!selectedPatientId) return;

      try {
        const therapistStr = localStorage.getItem('therapist');
        if (!therapistStr) return;
        const therapist = JSON.parse(therapistStr);

        // Fetch appointments to find the intake form (saved in notes of the first appointment)
        const response = await fetch(`/api/appointments?therapistId=${therapist.id}`);
        if (response.ok) {
          const appointments = await response.json();
          // Filter for this patient and sort by date (descending) to get latest or find the one with intake data
          const patientAppointments = appointments
            .filter((appt: any) => appt.patientId === selectedPatientId)
            .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

          if (patientAppointments.length > 0) {
            // Check the latest appointment for notes
            const latestAppt = patientAppointments[0];
            setCurrentAppointmentId(latestAppt.id); // Set ID for video call
            setCurrentAppointment(latestAppt);

            // Calculate session number (reverse index since sorted descending)
            setSessionNumber(patientAppointments.length);

            if (latestAppt.notes) {
              try {
                // The notes field contains the JSON string of anamnesis data
                const parsedData = JSON.parse(latestAppt.notes);

                // Map the parsed data to ClientIntakeData interface
                // The booking form sends: complaint, history, medication, etc.
                // ClientIntakeData expects: complaint, history, medications, goals, etc.
                setIntakeData({
                  // Dados Pessoais
                  nome: parsedData.nome,
                  dataNascimento: parsedData.dataNascimento,
                  rg: parsedData.rg,
                  cpf: parsedData.cpf,
                  endereco: parsedData.endereco,
                  bairro: parsedData.bairro,
                  cep: parsedData.cep,
                  cidade: parsedData.cidade,
                  uf: parsedData.uf,
                  telefone: parsedData.telefone,
                  celular: parsedData.celular,
                  email: parsedData.email,
                  profissao: parsedData.profissao,
                  empresa: parsedData.empresa,
                  estadoCivil: parsedData.estadoCivil,
                  religiao: parsedData.religiao,
                  escolaridade: parsedData.escolaridade,

                  // Queixa Principal
                  complaint: parsedData.queixaPrincipal || parsedData.complaint || '',

                  // Fase 01 - Vida Pessoal
                  motivoDivorcio: parsedData.motivoDivorcio,
                  numeroFilhos: parsedData.numeroFilhos,
                  relacaoFilhos: parsedData.relacaoFilhos,
                  relacaoParceiro: parsedData.relacaoParceiro,
                  sentimentoCasa: parsedData.sentimentoCasa,
                  sentimentoTrabalho: parsedData.sentimentoTrabalho,
                  pertenceFamilia: parsedData.pertenceFamilia,
                  pertenceSocial: parsedData.pertenceSocial,
                  frustracoes: parsedData.frustracoes,

                  // Saúde e Hábitos
                  history: parsedData.historico || parsedData.history || '',
                  sexualidade: parsedData.sexualidade,
                  traumas: parsedData.traumas,
                  fobias: parsedData.fobias,
                  drogas: parsedData.drogas,
                  alcool: parsedData.alcool,
                  insonia: parsedData.insonia,
                  doresCabeca: parsedData.doresCabeca,
                  ideiasSuicidas: parsedData.ideiasSuicidas,
                  medications: parsedData.medicacao || parsedData.medications || '',
                  nivelStress: parsedData.nivelStress,

                  // Fase 02 - Mental
                  pensamentosSi: parsedData.pensamentosSi,
                  pensamentosCorpo: parsedData.pensamentosCorpo,
                  pensamentosCompetencia: parsedData.pensamentosCompetencia,
                  visaoFuturo: parsedData.visaoFuturo,
                  felicidade: parsedData.felicidade,
                  mudanca: parsedData.mudanca,

                  // Fase 03 - Infância
                  criadoPais: parsedData.criadoPais,
                  relacaoPai: parsedData.relacaoPai,
                  relacaoMae: parsedData.relacaoMae,
                  paisAgressivos: parsedData.paisAgressivos,
                  paisAlcool: parsedData.paisAlcool,
                  relacaoEntrePais: parsedData.relacaoEntrePais,
                  crencaRelacionamento: parsedData.crencaRelacionamento,
                  magoaInfancia: parsedData.magoaInfancia,
                  medoInfancia: parsedData.medoInfancia,

                  // Fase 04 - Emocional
                  maioresMedosHoje: parsedData.maioresMedosHoje,
                  papelVida: parsedData.papelVida,
                  dominanteSubmisso: parsedData.dominanteSubmisso,
                  raivaRancor: parsedData.raivaRancor,
                  sentimentoCulpa: parsedData.sentimentoCulpa,

                  // Tabela de Sentimentos
                  int_raiva: parsedData.int_raiva,
                  int_medo: parsedData.int_medo,
                  int_culpa: parsedData.int_culpa,
                  int_tristeza: parsedData.int_tristeza,
                  int_ansiedade: parsedData.int_ansiedade,
                  int_solidão: parsedData.int_solidão,
                  int_desanimo: parsedData.int_desanimo,
                  int_angustia: parsedData.int_angustia,

                  // Legacy
                  goals: parsedData.objetivos || '',
                  previousTherapy: parsedData.terapiaAnterior || '',
                  familyHistory: parsedData.historicoFamiliar || '',
                  traumaHistory: parsedData.historicoTraumas || '',
                  resources: parsedData.recursos || ''
                });
              } catch (e) {
                console.error('Error parsing appointment notes:', e);
                setIntakeData(null);
              }
            } else {
              setIntakeData(null);
            }
          } else {
            setIntakeData(null);
          }
        }
      } catch (error) {
        console.error('Error fetching intake data:', error);
      }
    };

    fetchIntakeData();
  }, [selectedPatientId]);
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [protocolPhases, setProtocolPhases] = useState<ProtocolPhase[]>(DEFAULT_PHASES);
  const [phase, setPhase] = useState<string>('anamnese');
  const [isEditingProtocol, setIsEditingProtocol] = useState(false);

  // Video
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isVideoActive, setIsVideoActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const recordInterval = useRef<any>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [recordings, setRecordings] = useState<SessionRecording[]>([]);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [playbackRecording, setPlaybackRecording] = useState<SessionRecording | null>(null);
  const [currentAppointmentId, setCurrentAppointmentId] = useState<string | null>(null);
  const [currentAppointment, setCurrentAppointment] = useState<any | null>(null);
  const [sessionNumber, setSessionNumber] = useState<number>(1);
  const [isImmersiveMode, setIsImmersiveMode] = useState(false);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // PeerJS Integration
  // Therapist ID: therapist-{patientId}
  // Target ID: client-{patientId}
  const { remoteStream, connectionStatus, connect } = useVideoCall({
    myId: selectedPatientId ? `therapist-${selectedPatientId}` : '',
    targetId: selectedPatientId ? `client-${selectedPatientId}` : '',
    isInitiator: true,
    localStream: stream
  });

  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
      remoteVideoRef.current.play().catch(console.error);
    }
  }, [remoteStream]);

  // AI Transcription & Insights
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcription, setTranscription] = useState<string[]>([]);
  const [sentiment, setSentiment] = useState<'neutral' | 'stress' | 'calm'>('neutral');
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const recognitionRef = useRef<any>(null);

  // Logic State
  const [bookmark, setBookmark] = useState<{ phase: string; time: string } | null>(null);
  const [isSafetyOpen, setIsSafetyOpen] = useState(false);
  const [intakeData, setIntakeData] = useState<ClientIntakeData | null>(null);
  const [cycleScores, setCycleScores] = useState<Record<string, number[]>>({ cronologico: [10], somatico: [10], tematico: [10] });
  const [phaseRecords, setPhaseRecords] = useState<Record<string, PhaseRecord>>({
    anamnese: { duration: '', response: '', observation: '' },
    cronologico: { duration: '', response: '', observation: '' },
    somatico: { duration: '', response: '', observation: '' },
    tematico: { duration: '', response: '', observation: '' },
    futuro: { duration: '', response: '', observation: '' },
    potencializacao: { duration: '', response: '', observation: '' },
  });
  const [futureConfidence, setFutureConfidence] = useState(5);
  const [futureGoals, setFutureGoals] = useState<string[]>([]);
  const [newGoal, setNewGoal] = useState('');
  const [selectedResources, setSelectedResources] = useState<string[]>([]);
  const [newResource, setNewResource] = useState('');
  const [ageRanges, setAgeRanges] = useState(['0 a 5 anos', '5 a 10 anos', '10 a 15 anos', '15 a 20 anos', '20 a 25 anos']);
  const [newAgeRange, setNewAgeRange] = useState('');
  const [editingAgeIndex, setEditingAgeIndex] = useState<number | null>(null);
  const [editAgeValue, setEditAgeValue] = useState('');
  const [selectedAgeRange, setSelectedAgeRange] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<'notes' | 'script'>('script');
  const [showRestoreAlert, setShowRestoreAlert] = useState(false);

  const patient = patients.find(p => p.id === selectedPatientId);

  // ... (Keep useEffects for load/timer/stream as is) ...
  useEffect(() => {
    const savedData = localStorage.getItem('TRG_SESSION_BACKUP');
    if (savedData) setShowRestoreAlert(true);
    const savedProtocol = localStorage.getItem('TRG_PROTOCOL_PHASES');
    if (savedProtocol) setProtocolPhases(JSON.parse(savedProtocol));
    const savedIntake = localStorage.getItem('TRG_CLIENT_INTAKE');
    if (savedIntake) setIntakeData(JSON.parse(savedIntake));
  }, []);

  // Load Recordings from Cloud
  useEffect(() => {
    if (selectedPatientId) {
      fetch(`/api/recordings?patientId=${selectedPatientId}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setRecordings(data.map((r: any) => ({
              id: r.id,
              patientId: r.patient_id,
              patientName: patient?.name || 'Cliente',
              date: r.created_at,
              duration: r.duration,
              type: r.type,
              phase: r.phase,
              size: r.size,
              blobUrl: r.url
            })));
          }
        })
        .catch(console.error);
    }
  }, [selectedPatientId, patient]);

  useEffect(() => {
    let interval: any;
    if (isTimerRunning) interval = setInterval(() => setTimer((prev) => prev + 1), 1000);
    else if (!isTimerRunning && timer !== 0) clearInterval(interval);
    return () => clearInterval(interval);
  }, [isTimerRunning, timer]);

  useEffect(() => {
    if (isVideoActive && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(e => { console.error(e); setCameraError("Erro ao reproduzir vídeo."); });
    }
  }, [isVideoActive, stream]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStrokeColor = (score: number) => {
    if (score === 0) return '#22c55e';
    if (score <= 3) return '#3b82f6';
    if (score <= 7) return '#f59e0b';
    return '#ef4444';
  };
  const getTrend = (scores: number[]) => {
    if (!scores || scores.length < 2) return 0;
    return (scores[scores.length - 1] || 0) - (scores[scores.length - 2] || 0);
  };
  const getAverage = (scores: number[]) => {
    if (!scores || scores.length === 0) return 0;
    return Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10;
  };

  const toggleTimer = () => setIsTimerRunning(!isTimerRunning);

  // --- AI Logic ---
  const toggleTranscription = () => {
    if (isTranscribing) {
      recognitionRef.current?.stop();
      setIsTranscribing(false);
    } else {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'pt-BR';

        recognition.onresult = (event: any) => {
          const current = event.resultIndex;
          const transcript = event.results[current][0].transcript.toLowerCase();

          // Sentiment & Keyword Logic
          if (transcript.includes('dor') || transcript.includes('medo') || transcript.includes('pânico') || transcript.includes('não aguento')) {
            setSentiment('stress');
            setAiSuggestions(prev => ["Detectada alta intensidade. Sugira o Mecanismo de Segurança.", ...prev.slice(0, 2)]);
          } else if (transcript.includes('melhor') || transcript.includes('leve') || transcript.includes('passou')) {
            setSentiment('calm');
            setAiSuggestions(prev => ["Cliente relatando alívio. Valide e verifique SUD.", ...prev.slice(0, 2)]);
          } else {
            setSentiment('neutral');
          }

          if (phase === 'somatico' && transcript.includes('peito') || transcript.includes('cabeça')) {
            setAiSuggestions(prev => ["Foco somático identificado. Pergunte: 'Qual a cor/forma dessa sensação?'", ...prev.slice(0, 2)]);
          }

          if (event.results[current].isFinal) {
            setTranscription(prev => [...prev, transcript]);
          }
        };

        recognition.start();
        recognitionRef.current = recognition;
        setIsTranscribing(true);
      } else {
        alert("Seu navegador não suporta transcrição de áudio.");
      }
    }
  };

  // ... (Keep Camera/Recording functions as is) ...
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (navigator.mediaDevices) {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: true });
        setStream(mediaStream);
        setIsVideoActive(true);
      } else { setCameraError("Navegador não suporta câmera."); }
    } catch (err) { setCameraError("Erro ao acessar câmera."); }
  };

  const stopCamera = () => {
    if (stream) stream.getTracks().forEach(track => track.stop());
    if (isRecording) stopRecording();
    setIsVideoActive(false);
    setStream(null);
  };

  const toggleMic = () => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) { audioTrack.enabled = !audioTrack.enabled; setIsMicMuted(!audioTrack.enabled); }
    }
  };

  const toggleVideo = () => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) { videoTrack.enabled = !videoTrack.enabled; setIsVideoMuted(!videoTrack.enabled); }
    }
  };

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const startRecording = () => {
    if (!stream || !remoteStream) {
      alert("Aguarde a conexão com o cliente para iniciar a gravação.");
      return;
    }
    setRecordedChunks([]);

    try {
      // 1. Setup Canvas for Composite Video
      const canvas = document.createElement('canvas');
      canvas.width = 1280;
      canvas.height = 720;
      canvasRef.current = canvas;
      const ctx = canvas.getContext('2d');

      // 2. Setup Audio Mixing
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;
      const dest = audioContext.createMediaStreamDestination();

      // Mix Local Audio
      if (stream.getAudioTracks().length > 0) {
        const localSource = audioContext.createMediaStreamSource(stream);
        localSource.connect(dest);
      }

      // Mix Remote Audio
      if (remoteStream.getAudioTracks().length > 0) {
        const remoteSource = audioContext.createMediaStreamSource(remoteStream);
        remoteSource.connect(dest);
      }

      // 3. Draw Loop
      const draw = () => {
        if (!ctx) return;

        // Draw Remote Video (Full Screen)
        if (remoteVideoRef.current) {
          ctx.drawImage(remoteVideoRef.current, 0, 0, canvas.width, canvas.height);
        } else {
          // Placeholder if no remote video
          ctx.fillStyle = '#1e293b'; // slate-800
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // Draw Local Video (PiP - Bottom Right)
        if (videoRef.current) {
          const pipWidth = 320;
          const pipHeight = 180;
          const padding = 20;
          const x = canvas.width - pipWidth - padding;
          const y = canvas.height - pipHeight - padding;

          // Border
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.strokeRect(x, y, pipWidth, pipHeight);

          // Video
          ctx.save();
          ctx.translate(x + pipWidth, y);
          ctx.scale(-1, 1); // Mirror local video
          ctx.drawImage(videoRef.current, 0, 0, pipWidth, pipHeight);
          ctx.restore();
        }

        animationFrameRef.current = requestAnimationFrame(draw);
      };
      draw();

      // 4. Create Combined Stream
      const canvasStream = canvas.captureStream(30); // 30 FPS
      const combinedStream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...dest.stream.getAudioTracks()
      ]);

      // 5. Start Recording
      const recorder = new MediaRecorder(combinedStream, { mimeType: 'video/webm;codecs=vp8,opus' });
      recorder.ondataavailable = (event) => { if (event.data.size > 0) setRecordedChunks(prev => [...prev, event.data]); };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      recordInterval.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);

    } catch (e) {
      console.error(e);
      alert("Erro ao iniciar gravação. Verifique permissões.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      if (recordInterval.current) clearInterval(recordInterval.current);

      // Cleanup
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close();

      setIsRecording(false);
    }
  };

  const [isUploading, setIsUploading] = useState(false);

  const saveRecordingToGallery = async () => {
    if (recordedChunks.length === 0) return;

    setIsUploading(true);
    try {
      const blob = new Blob(recordedChunks, { type: 'video/webm' });
      const currentPhaseLabel = protocolPhases.find(p => p.id === phase)?.label || phase;
      const duration = formatTime(recordingTime);
      const size = (blob.size / 1024 / 1024).toFixed(1) + ' MB';

      // Upload to Cloud
      const response = await fetch(`/api/recordings?filename=session-${Date.now()}.webm&patientId=${selectedPatientId}&duration=${duration}&size=${size}&phase=${currentPhaseLabel}`, {
        method: 'POST',
        body: blob
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Falha no upload');
      }

      const data = await response.json();

      const newRecording: SessionRecording = {
        id: Date.now().toString(), // Temporary ID, refresh will get real ID
        patientId: selectedPatientId,
        patientName: patient?.name || 'Cliente',
        date: new Date().toISOString(),
        duration,
        type: 'video',
        phase: currentPhaseLabel,
        size,
        blobUrl: data.url // Cloud URL
      };

      setRecordings([newRecording, ...recordings]);
      setRecordedChunks([]);
      setRecordingTime(0);
      alert('Gravação salva na nuvem com sucesso!');
    } catch (error: any) {
      console.error(error);
      alert(`Erro ao salvar gravação: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const deleteRecording = (id: string) => {
    if (window.confirm('Excluir gravação?')) {
      const updated = recordings.filter(r => r.id !== id);
      setRecordings(updated);
      localStorage.setItem('TRG_RECORDINGS', JSON.stringify(updated.map(({ blobUrl, ...rest }) => rest)));
    }
  };

  const downloadRecording = (rec: SessionRecording) => {
    if (rec.blobUrl) {
      const a = document.createElement('a');
      a.href = rec.blobUrl;
      a.download = `trg-session-${rec.date}.webm`;
      a.click();
    } else { alert('Arquivo antigo arquivado. Apenas metadados disponíveis.'); }
  };

  // ... (Keep Logic Handlers: Cycle, Phase, Bookmark, etc) ...
  const handleBookmark = () => setBookmark({ phase: phase, time: formatTime(timer) });

  const handlePhaseRecordChange = (field: keyof PhaseRecord, value: string) => {
    setPhaseRecords(prev => {
      // Ensure we have a valid object to spread, providing defaults for all required fields
      const currentRecord = prev[phase] || { duration: '', response: '', observation: '' };
      return {
        ...prev,
        [phase]: {
          ...currentRecord,
          [field]: value
        }
      };
    });
  };

  const handleCycleChange = (phaseKey: string, index: number, value: number) => {
    const newScores = [...(cycleScores[phaseKey] || [])];
    newScores[index] = value;
    setCycleScores(prev => ({ ...prev, [phaseKey]: newScores }));
  };
  const addCycle = (phaseKey: string) => setCycleScores(prev => ({ ...prev, [phaseKey]: [...(prev[phaseKey] || []), 10] }));
  const removeCycle = (phaseKey: string, index: number) => { if (window.confirm("Remover ciclo?")) setCycleScores(prev => ({ ...prev, [phaseKey]: (cycleScores[phaseKey] || []).filter((_, i) => i !== index) })); };
  const removeLastCycle = (phaseKey: string) => setCycleScores(prev => ({ ...prev, [phaseKey]: (prev[phaseKey] || []).slice(0, -1) }));
  const resetCycles = (phaseKey: string) => { if (window.confirm("Reiniciar ciclos?")) setCycleScores(prev => ({ ...prev, [phaseKey]: [10] })); };

  const toggleResource = (resource: string) => setSelectedResources(prev => prev.includes(resource) ? prev.filter(r => r !== resource) : [...prev, resource]);
  const addGoal = () => { if (newGoal.trim()) { setFutureGoals([...futureGoals, newGoal.trim()]); setNewGoal(''); } };
  const removeGoal = (index: number) => setFutureGoals(futureGoals.filter((_, i) => i !== index));
  const addCustomResource = () => { if (newResource.trim()) { setSelectedResources(prev => [...prev, newResource.trim()]); setNewResource(''); } };

  const handleAddAgeRange = () => { if (newAgeRange.trim()) { setAgeRanges([...ageRanges, newAgeRange.trim()]); setNewAgeRange(''); } };
  const handleStartEditAge = (index: number) => { setEditingAgeIndex(index); setEditAgeValue(ageRanges[index]); };
  const handleSaveEditAge = (index: number) => { if (editAgeValue.trim()) { const n = [...ageRanges]; n[index] = editAgeValue.trim(); setAgeRanges(n); setEditingAgeIndex(null); } };
  const handleDeleteAge = (index: number) => { if (window.confirm('Remover faixa?')) setAgeRanges(ageRanges.filter((_, i) => i !== index)); };
  const handleSelectAgeRange = (range: string) => setSelectedAgeRange(range === selectedAgeRange ? null : range);
  const hasPhaseData = (phaseKey: string) => { const r = phaseRecords[phaseKey]; return r && (r.duration || r.response || r.observation); };

  const movePhase = (index: number, dir: 'up' | 'down') => {
    const n = [...protocolPhases];
    const t = dir === 'up' ? index - 1 : index + 1;
    if (t >= 0 && t < n.length) { [n[index], n[t]] = [n[t], n[index]]; setProtocolPhases(n); }
  };
  const addCustomPhase = () => { const name = prompt("Nome:"); if (name) { const id = `custom_${Date.now()}`; setProtocolPhases([...protocolPhases, { id, label: name }]); setPhaseRecords(prev => ({ ...prev, [id]: { duration: '', response: '', observation: '' } })); } };
  const deletePhase = (idx: number) => { if (!protocolPhases[idx].isSystem && window.confirm("Apagar?")) setProtocolPhases(protocolPhases.filter((_, i) => i !== idx)); };
  const renamePhase = (idx: number, val: string) => { const n = [...protocolPhases]; n[idx].label = val; setProtocolPhases(n); };
  const updateCustomScript = (id: string, val: string) => setProtocolPhases(protocolPhases.map(p => p.id === id ? { ...p, customScript: val } : p));
  const goToNextPhase = () => {
    const idx = protocolPhases.findIndex(p => p.id === phase);
    if (idx < protocolPhases.length - 1) { setPhase(protocolPhases[idx + 1].id); setMobileTab('script'); }
    else alert("Protocolo concluído!");
  };

  const handleSaveProgress = () => {
    localStorage.setItem('TRG_SESSION_BACKUP', JSON.stringify({ selectedPatientId, timer, phase, phaseRecords, cycleScores, futureConfidence, futureGoals, selectedResources, ageRanges, bookmark, selectedAgeRange, protocolPhases }));
    alert('Salvo!');
  };
  const handleRestoreSession = () => {
    const d = localStorage.getItem('TRG_SESSION_BACKUP');
    if (d) { const p = JSON.parse(d); setSelectedPatientId(p.selectedPatientId); setTimer(p.timer); if (p.protocolPhases) setProtocolPhases(p.protocolPhases); setPhase(p.phase); setPhaseRecords(p.phaseRecords); setCycleScores(p.cycleScores); setFutureConfidence(p.futureConfidence); setFutureGoals(p.futureGoals); setSelectedResources(p.selectedResources); setAgeRanges(p.ageRanges); setBookmark(p.bookmark); setSelectedAgeRange(p.selectedAgeRange); setShowRestoreAlert(false); }
  };
  const handleDiscardSession = () => { localStorage.removeItem('TRG_SESSION_BACKUP'); setShowRestoreAlert(false); };

  const commonResources = ['Coragem', 'Calma', 'Segurança', 'Confiança', 'Alegria', 'Paz', 'Força'];
  const currentPhaseObj = protocolPhases.find(p => p.id === phase) || protocolPhases[0];
  const currentRecord = phaseRecords[phase] || { duration: '', response: '', observation: '' };

  return (
    <div className={`flex flex-col h-full animate-fade-in pb-20 md:pb-0 relative transition-all duration-300 ${isImmersiveMode ? 'fixed inset-0 z-[100] bg-white dark:bg-slate-950 !pb-0' : ''}`}>

      {showRestoreAlert && (
        <div className="bg-amber-50 dark:bg-amber-900/30 border-l-4 border-amber-500 p-4 mb-4 flex justify-between items-center rounded-r-lg shadow-sm shrink-0">
          <div className="flex items-center gap-3">
            <AlertCircle className="text-amber-500" />
            <div><p className="font-bold text-amber-800 dark:text-amber-200">Sessão não salva</p><p className="text-sm text-amber-700 dark:text-amber-300">Restaurar progresso?</p></div>
          </div>
          <div className="flex gap-3">
            <button onClick={handleDiscardSession} className="px-4 py-2 text-sm font-bold hover:bg-amber-100 dark:hover:bg-amber-800/50 rounded-lg">Descartar</button>
            <button onClick={handleRestoreSession} className="px-4 py-2 text-sm font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-lg">Restaurar</button>
          </div>
        </div>
      )}

      {/* Floating Exit Button for Immersive Mode */}
      {isImmersiveMode && (
        <button
          onClick={() => setIsImmersiveMode(false)}
          className="absolute top-4 right-4 z-[110] p-3 bg-slate-900/80 text-white rounded-full hover:bg-slate-800 backdrop-blur-md shadow-lg transition-all"
          title="Sair do Modo Imersivo"
        >
          <Minimize2 size={24} />
        </button>
      )}

      {/* Toolbar */}
      {/* Sidebar - Hide in Immersive Mode */}
      {/* Toolbar - Hide in Immersive Mode */}
      {!isImmersiveMode && (
        <div className="flex flex-col xl:flex-row justify-between xl:items-center gap-4 mb-6 shrink-0 sticky top-0 z-10 bg-slate-50/70 dark:bg-slate-900/70 backdrop-blur-md p-3 rounded-xl">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white">Sessão TRG</h2>
              <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold uppercase rounded-md border border-green-200 dark:border-green-800">Em Andamento</span>
            </div>
            <select className="bg-transparent text-sm text-slate-500 dark:text-slate-400 font-medium outline-none cursor-pointer" value={selectedPatientId} onChange={(e) => setSelectedPatientId(e.target.value)}>
              {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          {/* Session Info Display */}
          {currentAppointment && (
            <div className="mt-1 flex items-center gap-3 text-xs font-medium text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1"><Calendar size={10} /> {new Date(currentAppointment.date).toLocaleDateString('pt-BR')}</span>
              <span className="flex items-center gap-1"><Clock size={10} /> {currentAppointment.time}</span>
              <span className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 rounded text-slate-600 dark:text-slate-300 font-bold">{sessionNumber}ª Sessão</span>
            </div>
          )}


          <div className="flex flex-wrap items-center gap-3">
            {/* AI Transcription Widget */}
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${sentiment === 'stress' ? 'bg-red-50 border-red-200' : sentiment === 'calm' ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700'}`}>
              <button onClick={toggleTranscription} className={`p-1.5 rounded-full ${isTranscribing ? 'bg-primary-500 text-white animate-pulse' : 'text-slate-400 hover:bg-slate-200'}`} title="IA: Análise de Sentimento">
                <Waves size={18} />
              </button>
              {isTranscribing && <span className="text-xs font-bold text-slate-600 dark:text-slate-300 hidden sm:inline">{sentiment === 'stress' ? 'Tensão Detectada' : sentiment === 'calm' ? 'Calma Detectada' : 'Ouvindo...'}</span>}
            </div>

            <div className="flex items-center gap-2 md:gap-3 bg-white dark:bg-slate-900 px-3 md:px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <Clock size={18} className={`${isTimerRunning ? 'text-green-500 animate-pulse' : 'text-slate-400'}`} />
              <span className="font-mono text-lg md:text-xl font-bold text-slate-700 dark:text-white min-w-[72px] md:min-w-[80px] text-center">{formatTime(timer)}</span>
              <button onClick={toggleTimer} className={`p-1.5 rounded-full transition-colors ${isTimerRunning ? 'hover:bg-red-50 text-red-500' : 'hover:bg-green-50 text-green-500'}`}>{isTimerRunning ? <PauseCircle size={20} /> : <PlayCircle size={20} />}</button>
            </div>

            <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block"></div>

            <button onClick={isVideoActive ? stopCamera : startCamera} className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${isVideoActive ? 'bg-red-50 text-red-600 border-red-200' : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800'}`}>
              {isVideoActive ? <VideoOff size={20} /> : <VideoIcon size={20} />}
              <span className="text-sm font-bold hidden sm:inline">{isVideoActive ? 'Encerrar' : 'Câmera'}</span>
            </button>

            <button onClick={() => setIsGalleryOpen(true)} className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 transition-colors">
              <Film size={20} />
            </button>

            <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block"></div>

            <button onClick={() => setIsImmersiveMode(!isImmersiveMode)} className={`p-2.5 rounded-xl border transition-colors ${isImmersiveMode ? 'bg-primary-500 text-white border-primary-600' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500'}`} title={isImmersiveMode ? "Sair do Modo Imersivo" : "Modo Imersivo"}>
              {isImmersiveMode ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
            </button>

            <button onClick={handleBookmark} className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-amber-500 hover:bg-amber-50 transition-colors"><Flag size={20} /></button>
            <button onClick={handleSaveProgress} className="flex items-center gap-2 px-3 md:px-4 py-2.5 bg-primary-600 dark:bg-secondary-600 text-white rounded-xl shadow-lg hover:bg-primary-700 font-bold text-sm active:scale-95"><Save size={18} /><span className="hidden sm:inline">Salvar</span></button>
          </div>
        </div>
      )
      }

      {/* Video Area */}
      {
        isVideoActive && (
          <div className="mb-6 bg-slate-900 rounded-2xl overflow-hidden shadow-2xl ring-1 ring-slate-700 animate-slide-up relative shrink-0">
            <div className="absolute top-0 left-0 right-0 p-3 bg-gradient-to-b from-black/60 to-transparent z-20 flex justify-between pointer-events-none">
              <div className="flex items-center gap-2 px-3 py-1 bg-black/40 backdrop-blur-sm rounded-lg border border-white/10 pointer-events-auto">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-bold text-white uppercase tracking-wider">Ao Vivo</span>
              </div>
              {isRecording && (
                <div className="flex items-center gap-2 px-3 py-1 bg-red-600/90 rounded-lg border border-red-500 pointer-events-auto">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  <span className="text-xs font-bold text-white uppercase tracking-wider">REC {formatTime(recordingTime)}</span>
                </div>
              )}
            </div>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 bg-slate-950/80 backdrop-blur-md p-2 rounded-2xl border border-white/10 shadow-lg">
              <button onClick={toggleMic} className={`p-3 rounded-xl transition-all ${isMicMuted ? 'bg-red-500 text-white' : 'bg-slate-800 text-white hover:bg-slate-700'}`}>{isMicMuted ? <MicOff size={20} /> : <Mic size={20} />}</button>
              <button onClick={toggleVideo} className={`p-3 rounded-xl transition-all ${isVideoMuted ? 'bg-red-500 text-white' : 'bg-slate-800 text-white hover:bg-slate-700'}`}>{isVideoMuted ? <VideoOff size={20} /> : <VideoIcon size={20} />}</button>
              <div className="w-px h-8 bg-white/10 mx-1"></div>
              {!isRecording ? (
                <button onClick={startRecording} className="flex items-center gap-2 px-4 py-3 bg-white hover:bg-slate-200 text-red-600 rounded-xl font-bold text-sm transition-all shadow-lg"><Radio size={16} /><span className="hidden sm:inline">Gravar</span></button>
              ) : (
                <button onClick={stopRecording} className="flex items-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white border border-red-500 rounded-xl font-bold text-sm transition-all animate-pulse"><Square size={14} fill="currentColor" /><span className="font-mono">Parar</span></button>
              )}
              {recordedChunks.length > 0 && !isRecording && <button onClick={saveRecordingToGallery} className="flex items-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-lg font-bold text-sm"><Save size={18} /><span>Salvar</span></button>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-1 p-1 bg-slate-950">
              <div className="relative aspect-video bg-slate-900 rounded-xl overflow-hidden group">
                <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover transform scale-x-[-1] ${isVideoMuted ? 'opacity-0' : 'opacity-100'}`} />
                {isVideoMuted && <div className="absolute inset-0 flex items-center justify-center text-slate-500"><VideoOff size={48} /></div>}
                <div className="absolute bottom-4 left-4 bg-black/60 px-3 py-1 rounded-lg text-xs font-bold text-white backdrop-blur-sm pointer-events-none">Você</div>
                {/* Debug Info */}
                <div className="absolute top-2 left-2 bg-black/50 text-[10px] text-white p-1 rounded font-mono opacity-50 hover:opacity-100">
                  My: therapist-{currentAppointmentId?.slice(0, 8)}...<br />
                  Target: client-{currentAppointmentId?.slice(0, 8)}...
                </div>
              </div>
              <div className="relative aspect-video bg-slate-800 rounded-xl overflow-hidden flex flex-col items-center justify-center text-slate-500 border border-slate-700/50">
                {remoteStream ? (
                  <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                ) : (
                  <>
                    <div className="w-20 h-20 bg-slate-700/50 rounded-full flex items-center justify-center mb-4"><Users size={32} className="text-slate-400" /></div>
                    <h3 className="text-white font-bold mb-1">Aguardando Cliente...</h3>
                    <p className="text-xs text-slate-500">{connectionStatus === 'connecting' ? 'Conectando...' : 'Aguardando conexão'}</p>
                  </>
                )}
                <div className="absolute bottom-4 left-4 bg-black/60 px-3 py-1 rounded-lg text-xs font-bold text-white backdrop-blur-sm pointer-events-none">{patient?.name || "Cliente"}</div>
              </div>
            </div>
          </div>
        )
      }

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">

        {/* Mobile Tabs */}
        <div className="lg:hidden flex border-b border-slate-200 dark:border-slate-800 mb-4 shrink-0">
          <button onClick={() => setMobileTab('script')} className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 ${mobileTab === 'script' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-slate-500'}`}><FileText size={16} /> Roteiro</button>
          <button onClick={() => setMobileTab('notes')} className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 ${mobileTab === 'notes' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-slate-500'}`}><PenTool size={16} /> Anotações</button>
        </div>

        {/* Left: Phase Nav */}
        <div className={`hidden lg:flex lg:w-72 flex-col gap-4 shrink-0`}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-3 bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fases</span>
              <button onClick={() => setIsEditingProtocol(!isEditingProtocol)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"><Settings size={14} /></button>
            </div>
            {isEditingProtocol && (
              <div className="p-2 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                <div className="space-y-1 mb-2">
                  {protocolPhases.map((p, idx) => (
                    <div key={p.id} className="flex items-center gap-2">
                      <div className="flex flex-col gap-0.5">
                        <button onClick={() => movePhase(idx, 'up')} disabled={idx === 0} className="p-0.5 hover:bg-slate-200 rounded disabled:opacity-30"><ArrowUp size={12} /></button>
                        <button onClick={() => movePhase(idx, 'down')} disabled={idx === protocolPhases.length - 1} className="p-0.5 hover:bg-slate-200 rounded disabled:opacity-30"><ArrowDown size={12} /></button>
                      </div>
                      <input value={p.label} onChange={(e) => renamePhase(idx, e.target.value)} className="flex-1 text-xs bg-white dark:bg-slate-800 border border-slate-200 rounded px-2 py-1" />
                      {!p.isSystem && <button onClick={() => deletePhase(idx)} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 size={14} /></button>}
                    </div>
                  ))}
                </div>
                <button onClick={addCustomPhase} className="w-full py-1.5 text-xs font-bold text-primary-600 border border-primary-100 border-dashed rounded">+ Fase</button>
              </div>
            )}
            <div className="p-2 space-y-1">
              {protocolPhases.map((p, idx) => {
                const isActive = phase === p.id;
                return (
                  <button key={p.id} onClick={() => setPhase(p.id)} className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center justify-between ${isActive ? 'bg-primary-50 dark:bg-slate-800 text-primary-700 dark:text-white font-bold border border-primary-100 dark:border-slate-700 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-colors ${isActive ? 'bg-primary-600 dark:bg-secondary-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>{idx + 1}</div>
                      <span>{p.label}</span>
                    </div>
                    {hasPhaseData(p.id) && <div className="w-2 h-2 rounded-full bg-green-500"></div>}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <button onClick={() => setIsSafetyOpen(!isSafetyOpen)} className="w-full p-4 flex items-center justify-between bg-red-50 dark:bg-red-900/10 hover:bg-red-100 transition-colors">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold text-sm uppercase tracking-wider"><Wind size={16} /> Mecanismo de Segurança</div>
              {isSafetyOpen ? <ArrowUp size={16} className="text-red-400" /> : <ArrowDown size={16} className="text-red-400" />}
            </button>
            {isSafetyOpen && (
              <div className="p-4 bg-red-50/50 dark:bg-red-900/5 animate-slide-up">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 italic mb-2">"Feche os olhos, repouse suas mãos ao lado do corpo..."</p>
                <p className="mt-3 text-xs font-bold text-slate-500 uppercase text-center border-t border-red-200 pt-2">"Cheira a florzinha e sopra a velinha"</p>
              </div>
            )}
          </div>

          {/* AI Clinical Assistant Panel */}
          <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800 shadow-sm overflow-hidden p-4">
            <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-300 uppercase tracking-wider mb-3 flex items-center gap-2"><Sparkles size={14} /> Nexus AI Assistant</h4>
            {aiSuggestions.length > 0 ? (
              <div className="space-y-2">
                {aiSuggestions.map((sugg, i) => (
                  <div key={i} className="bg-white dark:bg-slate-900 p-2 rounded-lg text-xs text-slate-600 dark:text-slate-300 border border-indigo-100 dark:border-indigo-900/50 animate-fade-in">
                    {sugg}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-indigo-400 italic text-center py-2">Ouvindo e analisando...</p>
            )}
          </div>
        </div>

        {/* Middle: Phase Content */}
        <div className={`flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col ${mobileTab === 'script' ? 'flex' : 'hidden lg:flex'}`}>
          <div className="p-4 md:p-6 lg:p-8 flex-1 overflow-y-auto">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white">{currentPhaseObj.label}</h3>
              <button onClick={() => setIsSafetyOpen(!isSafetyOpen)} className="lg:hidden p-2 bg-red-50 text-red-500 rounded-full"><Wind size={20} /></button>
            </div>
            <div className="lg:hidden mb-4">
              <select className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold outline-none dark:text-white" value={phase} onChange={(e) => setPhase(e.target.value)}>
                {protocolPhases.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </div>

            {sentiment === 'stress' && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3 animate-pulse">
                <AlertTriangle className="text-red-500" size={20} />
                <p className="text-sm text-red-700 dark:text-red-300 font-bold">Alta Intensidade Emocional Detectada. Considere o Mecanismo de Segurança.</p>
              </div>
            )}

            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
              {phase === 'anamnese' ? 'Coleta de dados iniciais e queixa principal.' : phase === 'cronologico' ? 'Processamento de traumas por linha do tempo.' : phase === 'somatico' ? 'Foco nas sensações corporais e desconforto físico.' : phase === 'tematico' ? 'Processamento focado em temas específicos.' : phase === 'futuro' ? 'Visualização e preparação para cenários futuros.' : 'Instalação de recursos e fortalecimento.'}
            </p>

            {/* --- ANAMNESE --- */}
            {phase === 'anamnese' && (
              <div className="space-y-6 animate-fade-in">
                {intakeData ? (
                  <div className="space-y-4">
                    {/* Header Card */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                      <div className="flex items-center gap-3 mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg">
                          <FileText size={24} />
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-slate-800 dark:text-white">Prontuário Inicial</h4>
                          <p className="text-sm text-slate-500">Dados coletados no formulário de agendamento</p>
                        </div>
                      </div>

                      <div className="space-y-8">
                        {/* 1. Dados Pessoais & Queixa */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-6">
                            <div>
                              <h5 className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                                <AlertCircle size={14} /> Queixa Principal
                              </h5>
                              <p className="text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 leading-relaxed text-lg">
                                {intakeData.complaint || "Não informado"}
                              </p>
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-900/30 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                              <h5 className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                                <Users size={14} /> Dados Pessoais
                              </h5>
                              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                                <div><span className="text-slate-500 text-xs">Nome:</span> <p className="font-medium text-slate-700 dark:text-slate-300">{intakeData.nome || '-'}</p></div>
                                <div><span className="text-slate-500 text-xs">Idade/Nasc:</span> <p className="font-medium text-slate-700 dark:text-slate-300">{intakeData.dataNascimento || '-'}</p></div>
                                <div><span className="text-slate-500 text-xs">Estado Civil:</span> <p className="font-medium text-slate-700 dark:text-slate-300">{intakeData.estadoCivil || '-'}</p></div>
                                <div><span className="text-slate-500 text-xs">Profissão:</span> <p className="font-medium text-slate-700 dark:text-slate-300">{intakeData.profissao || '-'}</p></div>
                                <div><span className="text-slate-500 text-xs">Religião:</span> <p className="font-medium text-slate-700 dark:text-slate-300">{intakeData.religiao || '-'}</p></div>
                                <div><span className="text-slate-500 text-xs">Cidade/UF:</span> <p className="font-medium text-slate-700 dark:text-slate-300">{intakeData.cidade && intakeData.uf ? `${intakeData.cidade}/${intakeData.uf}` : '-'}</p></div>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-6">
                            {/* Tabela de Sentimentos */}
                            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                              <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 text-center">Intensidade de Sentimentos (0-10)</h5>
                              <div className="grid grid-cols-4 gap-2">
                                {[
                                  { l: 'Raiva', v: intakeData.int_raiva }, { l: 'Medo', v: intakeData.int_medo },
                                  { l: 'Culpa', v: intakeData.int_culpa }, { l: 'Tristeza', v: intakeData.int_tristeza },
                                  { l: 'Ansiedade', v: intakeData.int_ansiedade }, { l: 'Solidão', v: intakeData.int_solidão },
                                  { l: 'Desânimo', v: intakeData.int_desanimo }, { l: 'Angústia', v: intakeData.int_angustia }
                                ].map((item, i) => (
                                  <div key={i} className="flex flex-col items-center p-2 bg-slate-50 dark:bg-slate-900 rounded-lg">
                                    <span className="text-[10px] text-slate-500 uppercase font-bold">{item.l}</span>
                                    <span className={`text-lg font-bold ${item.v === 'Muita' ? 'text-red-500' : item.v === 'Média' ? 'text-amber-500' : 'text-green-500'}`}>{item.v || '-'}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div>
                              <h5 className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                                <Target size={14} /> Saúde e Hábitos
                              </h5>
                              <div className="space-y-3 text-sm">
                                <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-800">
                                  <span className="block text-xs font-bold text-slate-500 mb-1">Medicamentos</span>
                                  <p className="text-slate-700 dark:text-slate-300">{intakeData.medications || "Nenhum"}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-800">
                                    <span className="block text-xs font-bold text-slate-500 mb-1">Álcool/Drogas</span>
                                    <p className="text-slate-700 dark:text-slate-300">{intakeData.alcool || '-'} / {intakeData.drogas || '-'}</p>
                                  </div>
                                  <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-800">
                                    <span className="block text-xs font-bold text-slate-500 mb-1">Sono/Stress</span>
                                    <p className="text-slate-700 dark:text-slate-300">{intakeData.insonia ? `Insônia: ${intakeData.insonia}` : 'Sono Normal'} / Stress: {intakeData.nivelStress || '-'}</p>
                                  </div>
                                </div>
                                {intakeData.ideiasSuicidas === 'sim' && (
                                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-600 dark:text-red-400 font-bold">
                                    <AlertTriangle size={16} /> Relatou Ideias Suicidas
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* 2. Contexto Familiar e Pessoal */}
                        <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
                          <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2"><Users size={16} className="text-primary-500" /> Contexto Familiar e Pessoal</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                              <h5 className="text-xs font-bold text-slate-500 uppercase mb-2">Relacionamentos</h5>
                              <p className="mb-2"><span className="font-bold text-slate-600 dark:text-slate-400">Parceiro(a):</span> {intakeData.relacaoParceiro || '-'}</p>
                              <p className="mb-2"><span className="font-bold text-slate-600 dark:text-slate-400">Filhos:</span> {intakeData.numeroFilhos || '0'} - {intakeData.relacaoFilhos || '-'}</p>
                              <p><span className="font-bold text-slate-600 dark:text-slate-400">Divórcio:</span> {intakeData.motivoDivorcio || '-'}</p>
                            </div>
                            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                              <h5 className="text-xs font-bold text-slate-500 uppercase mb-2">Infância e Pais</h5>
                              <p className="mb-2"><span className="font-bold text-slate-600 dark:text-slate-400">Pai:</span> {intakeData.relacaoPai || '-'}</p>
                              <p className="mb-2"><span className="font-bold text-slate-600 dark:text-slate-400">Mãe:</span> {intakeData.relacaoMae || '-'}</p>
                              <p className="mb-2"><span className="font-bold text-slate-600 dark:text-slate-400">Entre Pais:</span> {intakeData.relacaoEntrePais || '-'}</p>
                              <p><span className="font-bold text-slate-600 dark:text-slate-400">Traumas Infância:</span> {intakeData.magoaInfancia || '-'}</p>
                            </div>
                            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                              <h5 className="text-xs font-bold text-slate-500 uppercase mb-2">Mental e Emocional</h5>
                              <p className="mb-2"><span className="font-bold text-slate-600 dark:text-slate-400">Autoimagem:</span> {intakeData.pensamentosSi || '-'}</p>
                              <p className="mb-2"><span className="font-bold text-slate-600 dark:text-slate-400">Medos:</span> {intakeData.maioresMedosHoje || '-'}</p>
                              <p className="mb-2"><span className="font-bold text-slate-600 dark:text-slate-400">Culpa:</span> {intakeData.sentimentoCulpa || '-'}</p>
                              <p><span className="font-bold text-slate-600 dark:text-slate-400">Raiva/Rancor:</span> {intakeData.raivaRancor || '-'}</p>
                            </div>
                          </div>
                        </div>

                        {/* 3. Outros Detalhes */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                            <h5 className="text-xs font-bold text-slate-500 uppercase mb-2">Visão de Futuro e Mudança</h5>
                            <p className="mb-2"><span className="font-bold text-slate-600 dark:text-slate-400">O que mudaria:</span> {intakeData.mudanca || '-'}</p>
                            <p><span className="font-bold text-slate-600 dark:text-slate-400">Visão Futuro:</span> {intakeData.visaoFuturo || '-'}</p>
                          </div>
                          <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                            <h5 className="text-xs font-bold text-slate-500 uppercase mb-2">Traumas e Fobias</h5>
                            <p className="mb-2"><span className="font-bold text-slate-600 dark:text-slate-400">Traumas:</span> {intakeData.traumas || '-'}</p>
                            <p><span className="font-bold text-slate-600 dark:text-slate-400">Fobias:</span> {intakeData.fobias || '-'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-12 bg-slate-50 dark:bg-slate-900 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-center">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-400">
                      <FileText size={32} />
                    </div>
                    <h4 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2">Nenhum formulário recebido</h4>
                    <p className="text-slate-500 max-w-xs mx-auto">O cliente não preencheu o formulário de anamnese durante o agendamento.</p>
                  </div>
                )}

                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                      <PenTool size={16} className="text-primary-500" /> Notas da Sessão
                    </label>
                    <span className="text-xs text-slate-400">Salvo automaticamente</span>
                  </div>
                  <textarea
                    className="w-full h-48 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 dark:text-white outline-none resize-none transition-all font-medium leading-relaxed"
                    placeholder="Registre suas observações clínicas, percepções e pontos importantes desta sessão..."
                    value={phaseRecords.anamnese.observation}
                    onChange={(e) => handlePhaseRecordChange('observation', e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* --- CRONOLÓGICO --- */}
            {phase === 'cronologico' && (
              <div className="space-y-8 animate-fade-in">
                <TherapistScript>Feche os olhos, respire fundo e faça o pior filme desse período da sua vida.</TherapistScript>
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                  {ageRanges.map((range, idx) => (
                    <div key={idx} className="flex group shrink-0">
                      {editingAgeIndex === idx ? (
                        <div className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-primary-500 rounded-full px-1"><input autoFocus className="w-24 px-2 py-1 text-xs bg-transparent outline-none dark:text-white" value={editAgeValue} onChange={(e) => setEditAgeValue(e.target.value)} onBlur={() => handleSaveEditAge(idx)} onKeyDown={(e) => e.key === 'Enter' && handleSaveEditAge(idx)} /></div>
                      ) : (
                        <button onClick={() => handleSelectAgeRange(range)} className={`px-4 py-2 rounded-full text-sm font-bold border transition-all relative pr-8 ${selectedAgeRange === range ? 'bg-primary-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>{range}<div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100"><span onClick={(e) => { e.stopPropagation(); handleStartEditAge(idx); }} className="p-1"><Edit2 size={10} /></span><span onClick={(e) => { e.stopPropagation(); handleDeleteAge(idx); }} className="p-1 hover:text-red-300"><X size={10} /></span></div></button>
                      )}
                    </div>
                  ))}
                  <div className="flex items-center gap-1"><input className="w-24 px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-full bg-slate-50 dark:bg-slate-800 dark:text-white outline-none" placeholder="+ Faixa" value={newAgeRange} onChange={(e) => setNewAgeRange(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddAgeRange()} /><button onClick={handleAddAgeRange} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full"><Plus size={16} /></button></div>
                </div>
                <div className="p-5 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="flex flex-wrap gap-3 justify-between items-center mb-4">
                    <h4 className="font-bold text-slate-700 dark:text-slate-300">Ciclos</h4>
                    <div className="flex items-center gap-3 text-xs font-bold">
                      <span className="px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">Média: {getAverage(cycleScores.cronologico || [])}</span>
                      <span className={`px-2 py-1 rounded border ${getTrend(cycleScores.cronologico || []) < 0 ? 'text-green-600 border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/20' : 'text-red-600 border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/20'}`}>{getTrend(cycleScores.cronologico || []) < 0 ? 'Tendência: ↓' : 'Tendência: ↑'}</span>
                      <div className="flex gap-2"><button onClick={() => removeLastCycle('cronologico')} className="p-2 text-slate-400 hover:text-red-500"><RotateCcw size={16} /></button><button onClick={() => resetCycles('cronologico')} className="p-2 text-slate-400 hover:text-red-500"><RefreshCw size={16} /></button><button onClick={() => addCycle('cronologico')} className="p-2 text-slate-400 hover:text-primary-600"><PlusCircle size={16} /></button></div>
                    </div>
                  </div>
                  <div className="overflow-x-auto pb-2">
                    <svg className="w-full h-40 min-w-[320px]">
                      {(() => {
                        const data = (cycleScores.cronologico || []);
                        const w = 800, h = 160, pad = 16;
                        const step = data.length > 1 ? (w - pad * 2) / (data.length - 1) : 0;
                        const y = (v: number) => h - pad - (Math.max(v, 0) / 10) * (h - pad * 2);
                        const points = data.map((v, i) => `${pad + i * step},${y(v)}`).join(' ');
                        const last = data[data.length - 1] || 0;
                        return (
                          <g>
                            <polyline fill="none" stroke={getStrokeColor(last)} strokeWidth="3" points={points} />
                            {data.map((v, i) => (
                              <circle key={i} cx={pad + i * step} cy={y(v)} r="4" fill={getStrokeColor(v)} />
                            ))}
                          </g>
                        );
                      })()}
                    </svg>
                  </div>
                  <SudScale label="SUD Atual" value={(cycleScores.cronologico || [])[(cycleScores.cronologico || []).length - 1] || 0} onChange={(val) => handleCycleChange('cronologico', (cycleScores.cronologico || []).length - 1, val)} />
                </div>
              </div>
            )}

            {/* --- SOMÁTICO --- */}
            {phase === 'somatico' && (
              <div className="space-y-8 animate-fade-in">
                <TherapistScript>Feche os olhos e se concentre na dor, na sensação. Mergulhe na dor.</TherapistScript>
                <div className="p-5 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="flex flex-wrap gap-3 justify-between items-center mb-4">
                    <h4 className="font-bold text-slate-700 dark:text-slate-300">Ciclos</h4>
                    <div className="flex items-center gap-3 text-xs font-bold">
                      <span className="px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">Média: {getAverage(cycleScores.somatico || [])}</span>
                      <span className={`px-2 py-1 rounded border ${getTrend(cycleScores.somatico || []) < 0 ? 'text-green-600 border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/20' : 'text-red-600 border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/20'}`}>{getTrend(cycleScores.somatico || []) < 0 ? 'Tendência: ↓' : 'Tendência: ↑'}</span>
                      <div className="flex gap-2"><button onClick={() => removeLastCycle('somatico')} className="p-2 text-slate-400 hover:text-red-500"><RotateCcw size={16} /></button><button onClick={() => resetCycles('somatico')} className="p-2 text-slate-400 hover:text-red-500"><RefreshCw size={16} /></button><button onClick={() => addCycle('somatico')} className="p-2 text-slate-400 hover:text-primary-600"><PlusCircle size={16} /></button></div>
                    </div>
                  </div>
                  <div className="overflow-x-auto pb-2">
                    <svg className="w-full h-40 min-w-[320px]">
                      {(() => {
                        const data = (cycleScores.somatico || []);
                        const w = 800, h = 160, pad = 16;
                        const step = data.length > 1 ? (w - pad * 2) / (data.length - 1) : 0;
                        const y = (v: number) => h - pad - (Math.max(v, 0) / 10) * (h - pad * 2);
                        const points = data.map((v, i) => `${pad + i * step},${y(v)}`).join(' ');
                        const last = data[data.length - 1] || 0;
                        return (
                          <g>
                            <polyline fill="none" stroke={getStrokeColor(last)} strokeWidth="3" points={points} />
                            {data.map((v, i) => (
                              <circle key={i} cx={pad + i * step} cy={y(v)} r="4" fill={getStrokeColor(v)} />
                            ))}
                          </g>
                        );
                      })()}
                    </svg>
                  </div>
                  <SudScale label="SUD Atual" value={(cycleScores.somatico || [])[(cycleScores.somatico || []).length - 1] || 0} onChange={(val) => handleCycleChange('somatico', (cycleScores.somatico || []).length - 1, val)} />
                </div>
              </div>
            )}

            {/* --- TEMÁTICO --- */}
            {phase === 'tematico' && (
              <div className="space-y-8 animate-fade-in">
                <TherapistScript>Escolha um tema por vez (medo, humilhação, fobia...). Refazer até zerar.</TherapistScript>
                <div className="p-5 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between items-center mb-4"><h4 className="font-bold text-slate-700 dark:text-slate-300">Ciclos</h4><div className="flex gap-2"><button onClick={() => removeLastCycle('tematico')} className="p-2 text-slate-400 hover:text-red-500"><RotateCcw size={16} /></button><button onClick={() => resetCycles('tematico')} className="p-2 text-slate-400 hover:text-red-500"><RefreshCw size={16} /></button></div></div>
                  <div className="overflow-x-auto pb-2">
                    <svg className="w-full h-40 min-w-[320px]">
                      {(() => {
                        const data = (cycleScores.tematico || []);
                        const w = 800, h = 160, pad = 16;
                        const step = data.length > 1 ? (w - pad * 2) / (data.length - 1) : 0;
                        const y = (v: number) => h - pad - (Math.max(v, 0) / 10) * (h - pad * 2);
                        const points = data.map((v, i) => `${pad + i * step},${y(v)}`).join(' ');
                        const last = data[data.length - 1] || 0;
                        return (
                          <g>
                            <polyline fill="none" stroke={getStrokeColor(last)} strokeWidth="3" points={points} />
                            {data.map((v, i) => (
                              <circle key={i} cx={pad + i * step} cy={y(v)} r="4" fill={getStrokeColor(v)} />
                            ))}
                          </g>
                        );
                      })()}
                    </svg>
                  </div>
                  <SudScale label="SUD Atual" value={(cycleScores.tematico || [])[(cycleScores.tematico || []).length - 1] || 0} onChange={(val) => handleCycleChange('tematico', (cycleScores.tematico || []).length - 1, val)} />
                </div>
                <div><label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Tema</label><input type="text" className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 dark:text-white outline-none mb-4" placeholder="Ex: Medo de altura" value={phaseRecords.tematico.response} onChange={(e) => handlePhaseRecordChange('response', e.target.value)} /></div>
              </div>
            )}

            {/* --- FUTURO --- */}
            {phase === 'futuro' && (
              <div className="space-y-6 animate-fade-in">
                <TherapistScript>Quais os medos que você tem sobre seu futuro? Faça o pior filme.</TherapistScript>
                <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl border border-slate-100 dark:border-slate-800">
                  <h4 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2"><Target size={18} className="text-primary-500" /> Metas e Objetivos</h4>
                  <div className="flex gap-2 mb-4"><input className="flex-1 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none dark:text-white" placeholder="Adicionar novo objetivo..." value={newGoal} onChange={(e) => setNewGoal(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addGoal()} /><button onClick={addGoal} className="px-4 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-bold"><Plus size={20} /></button></div>
                  <div className="space-y-2">{futureGoals.map((goal, idx) => (<div key={idx} className="flex justify-between items-center p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 shadow-sm"><span className="text-sm text-slate-700 dark:text-slate-200">{goal}</span><button onClick={() => removeGoal(idx)} className="text-slate-400 hover:text-red-500"><Trash2 size={16} /></button></div>))}</div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Ponte ao Futuro (Nível de Confiança)</label>
                  <input type="range" min="0" max="10" value={futureConfidence} onChange={(e) => setFutureConfidence(parseInt(e.target.value))} className="w-full accent-primary-600 cursor-pointer mb-2" />
                  <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-wider"><span>Inseguro (0)</span><span className="text-primary-600 dark:text-secondary-400 text-lg">{futureConfidence}</span><span>Confiante (10)</span></div>
                </div>
              </div>
            )}

            {/* --- POTENCIALIZAÇÃO --- */}
            {phase === 'potencializacao' && (
              <div className="space-y-6 animate-fade-in">
                <TherapistScript>Imagine o melhor cenário para o seu futuro. De zero a dez, quanto este filme tem potencial?</TherapistScript>
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-6 rounded-xl border border-amber-100 dark:border-amber-900/30">
                  <h4 className="font-bold text-amber-900 dark:text-amber-100 mb-4 flex items-center gap-2"><Zap size={18} className="text-amber-500" /> Recursos a Instalar</h4>
                  <div className="flex flex-wrap gap-2 mb-4">{[...commonResources, ...selectedResources.filter(r => !commonResources.includes(r))].map(resource => (<button key={resource} onClick={() => toggleResource(resource)} className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${selectedResources.includes(resource) ? 'bg-amber-500 text-white shadow-md transform scale-105' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'}`}>{resource}</button>))}</div>
                  <div className="flex gap-2"><input className="flex-1 p-2 text-sm bg-white dark:bg-slate-800 border border-amber-200 rounded-lg outline-none dark:text-white" placeholder="Outro recurso..." value={newResource} onChange={(e) => setNewResource(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addCustomResource()} /><button onClick={addCustomResource} className="px-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600"><Plus size={18} /></button></div>
                </div>
              </div>
            )}

            {/* Generic Phase */}
            {!currentPhaseObj.isSystem && (
              <div className="space-y-6 animate-fade-in">
                <TherapistScript editable title={`Script: ${currentPhaseObj.label}`} onEdit={(val) => updateCustomScript(phase, val)}>{currentPhaseObj.customScript || "Clique no ícone de lápis para adicionar um script."}</TherapistScript>
                <div><label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Anotações</label><textarea className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 dark:text-white outline-none resize-none h-64" value={currentRecord.observation} onChange={(e) => handlePhaseRecordChange('observation', e.target.value)} /></div>
              </div>
            )}

            <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button onClick={goToNextPhase} className="bg-slate-900 dark:bg-slate-700 text-white px-4 md:px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-slate-800 transition-all flex items-center gap-2">{phase === protocolPhases[protocolPhases.length - 1].id ? 'Concluir' : 'Próxima'} <ArrowRight size={18} /></button>
            </div>
          </div>
        </div>



        {/* Gallery Modal */}
        {
          isGalleryOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsGalleryOpen(false)} />
              <div className="relative bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-slide-up">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950"><h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2"><Film size={20} /> Galeria</h3><button onClick={() => setIsGalleryOpen(false)}><X size={24} /></button></div>
                <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {recordings.map((rec) => (
                    <div key={rec.id} className="bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden group">
                      <div className="aspect-video bg-slate-200 dark:bg-slate-900 relative flex items-center justify-center">
                        {rec.type === 'video' ? <Video size={32} className="text-slate-400" /> : <Mic size={32} className="text-slate-400" />}
                        <button onClick={() => setPlaybackRecording(rec)} className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"><PlayCircle size={48} className="text-white" /></button>
                        <span className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/60 text-white text-[10px] font-bold rounded">{rec.duration}</span>
                      </div>
                      <div className="p-3">
                        <h4 className="font-bold text-sm text-slate-700 dark:text-white truncate">{rec.patientName}</h4>
                        <p className="text-xs text-slate-500 mb-3">{new Date(rec.date).toLocaleDateString('pt-BR')}</p>
                        <div className="flex gap-2"><button onClick={() => downloadRecording(rec)} className="flex-1 py-1.5 bg-white dark:bg-slate-700 border rounded-lg text-xs font-bold">Baixar</button><button onClick={() => deleteRecording(rec.id)} className="p-1.5 text-red-400 rounded-lg"><Trash2 size={16} /></button></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        }

        {/* Playback Modal */}
        {
          playbackRecording && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90">
              <div className="relative w-full max-w-4xl bg-black rounded-2xl overflow-hidden shadow-2xl flex flex-col">
                <div className="absolute top-4 right-4 z-50"><button onClick={() => setPlaybackRecording(null)} className="p-2 bg-black/50 text-white rounded-full"><X size={24} /></button></div>
                <div className="aspect-video bg-black flex items-center justify-center"><video src={playbackRecording.blobUrl} controls autoPlay className="w-full h-full" /></div>
              </div>
            </div>
          )
        }
      </div>
    </div >
  );
};

export default SessionView;
