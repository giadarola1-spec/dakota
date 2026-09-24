import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, 
  ArrowRight, 
  Check, 
  Copy, 
  FileText, 
  ShieldCheck, 
  Truck, 
  CornerDownLeft, 
  Layers, 
  Eye, 
  Sparkles,
  ChevronRight
} from 'lucide-react';

const DakotaLogo = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 349.899 349.898" xmlns="http://www.w3.org/2000/svg">
    <path fill="#BF0A30" d="M175.522,12.235c-42.6,0-77.256,34.649-77.256,77.25c0,42.6,34.656,77.255,77.256,77.255 c42.591,0,77.257-34.656,77.257-77.255C252.779,46.895,218.113,12.235,175.522,12.235z" />
    <path fill="#FFFFFF" stroke="#e2e8f0" strokeWidth="4" d="M77.255,337.663c42.599,0,77.255-34.641,77.255-77.251c0-42.594-34.656-77.25-77.255-77.25 C34.653,183.162,0,217.818,0,260.412C0,303.012,34.653,337.663,77.255,337.663z" />
    <path fill="#002868" d="M272.648,183.151c-42.603,0-77.256,34.65-77.256,77.256c0,42.604,34.653,77.25,77.256,77.25 c42.6,0,77.251-34.646,77.251-77.25C349.909,217.818,315.248,183.151,272.648,183.151z" />
  </svg>
);

interface WelcomeViewProps {
  onGetStarted: () => void;
  team: 'green' | 'purple' | 'red' | 'blue' | 'none';
  setTeam: (team: 'green' | 'purple' | 'red' | 'blue' | 'none') => void;
  isDarkMode: boolean;
  theme: any;
  onFileSelect?: (file: File) => void;
  onLoadSample?: () => void;
}

interface BrokerDemo {
  id: string;
  name: string;
  loadLabel: string;
  loadNumber: string;
  origin: string;
  pickupTime: string;
  destination: string;
  deliveryTime: string;
  weight: string;
  rate: string;
  chain: string;
  notes: string;
  rename: string;
}

const BROKER_DEMOS: BrokerDemo[] = [
  {
    id: 'chr',
    name: 'C.H. Robinson',
    loadLabel: 'LOAD',
    loadNumber: '568382261',
    origin: 'GROVEPORT, OH 43125',
    pickupTime: '09/19 10:30 EDT',
    destination: 'GREENFIELD, IN 46140',
    deliveryTime: '09/19 13:30 EDT',
    weight: '42,800 LBS',
    rate: '$1,450.00',
    chain: '102-OH-IN-09.19.2026 CH ROBINSON LOAD 568382261',
    notes: `102-OH-IN-09.19.2026 CH ROBINSON LOAD 568382261

PU: GROVEPORT, OH
DATE: 09/19/2026 10:30
DEL: GREENFIELD, IN
DATE: 09/19/2026 13:30
WEIGHT: 42,800 LBS
COMMODITY: DRY GOODS
RATE: $1,450.00`,
    rename: '102-OH-IN-09.19.2026-C.pdf'
  },
  {
    id: 'tql',
    name: 'TQL',
    loadLabel: 'PO',
    loadNumber: '9842105',
    origin: 'CINCINNATI, OH 45202',
    pickupTime: '09/20 08:00 EDT',
    destination: 'LOUISVILLE, KY 40202',
    deliveryTime: '09/20 14:00 EDT',
    weight: '38,500 LBS',
    rate: '$1,200.00',
    chain: '102-OH-KY-09.20.2026 TQL PO 9842105',
    notes: `102-OH-KY-09.20.2026 TQL PO 9842105

PU: CINCINNATI, OH
DATE: 09/20/2026 08:00
DEL: LOUISVILLE, KY
DATE: 09/20/2026 14:00
WEIGHT: 38,500 LBS
COMMODITY: BEVERAGES
RATE: $1,200.00`,
    rename: '102-OH-KY-09.20.2026-C.pdf'
  },
  {
    id: 'traffix',
    name: 'Traffix',
    loadLabel: 'ORDER',
    loadNumber: 'TRX-77491',
    origin: 'DETROIT, MI 48201',
    pickupTime: '09/21 07:00 EDT',
    destination: 'CHICAGO, IL 60607',
    deliveryTime: '09/21 16:30 CDT',
    weight: '44,000 LBS',
    rate: '$1,650.00',
    chain: '102-MI-IL-09.21.2026 TRAFFIX ORDER TRX-77491',
    notes: `102-MI-IL-09.21.2026 TRAFFIX ORDER TRX-77491

PU: DETROIT, MI
DATE: 09/21/2026 07:00
DEL: CHICAGO, IL
DATE: 09/21/2026 16:30
WEIGHT: 44,000 LBS
COMMODITY: AUTO PARTS
RATE: $1,650.00`,
    rename: '102-MI-IL-09.21.2026-C.pdf'
  }
];

export const WelcomeView: React.FC<WelcomeViewProps> = ({
  onGetStarted,
  team,
  setTeam,
  isDarkMode,
  theme,
  onFileSelect,
  onLoadSample
}) => {
  const [selectedDemoIndex, setSelectedDemoIndex] = useState(0);
  const [copiedType, setCopiedType] = useState<'chain' | 'notes' | 'rename' | null>(null);
  const [isDragOverWelcome, setIsDragOverWelcome] = useState(false);

  const activeDemo = BROKER_DEMOS[selectedDemoIndex];

  const handleCopy = (text: string, type: 'chain' | 'notes' | 'rename') => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => {
      setCopiedType(null);
    }, 2000);
  };

  // Keyboard shortcut: Press Enter to get started
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
        onGetStarted();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onGetStarted]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverWelcome(true);
  };

  const handleDragLeave = () => {
    setIsDragOverWelcome(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverWelcome(false);
    const file = e.dataTransfer.files?.[0];
    if (file && onFileSelect) {
      onFileSelect(file);
    } else {
      onGetStarted();
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onFileSelect) {
      onFileSelect(file);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.98, filter: 'blur(10px)' }}
      transition={{ duration: 0.25 }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="fixed inset-0 z-[200] bg-[#050814] text-zinc-100 overflow-y-auto overflow-x-hidden font-sans select-none"
    >
      {/* Background Subtle Grid Texture */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      />
      {/* Soft Ambient Radial Lights */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[360px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-[600px] right-0 w-[500px] h-[400px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Sticky Header */}
      <header className="sticky top-0 z-50 w-full bg-[#050814]/85 backdrop-blur-xl border-b border-zinc-800/60">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <DakotaLogo className="w-7 h-7" />
            <div className="flex items-center gap-2">
              <span className="text-xl font-geologica font-bold tracking-tight text-white lowercase">dakota</span>
              <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded-md bg-zinc-800/80 text-zinc-400 border border-zinc-700/50">
                Rate Con Engine
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-zinc-400 bg-zinc-900/80 px-3 py-1.5 rounded-lg border border-zinc-800">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>7 Brokers Compatibles</span>
            </div>

            <button
              onClick={onGetStarted}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-100 hover:bg-white text-zinc-900 text-xs font-semibold tracking-wide transition-all shadow-sm hover:shadow-md cursor-pointer active:scale-95"
            >
              <span>Abrir Workspace</span>
              <CornerDownLeft size={13} className="opacity-60" />
            </button>
          </div>
        </div>
      </header>

      {/* Drag & Drop Overlay Feedback */}
      {isDragOverWelcome && (
        <div className="fixed inset-0 z-50 bg-blue-950/80 backdrop-blur-sm flex flex-col items-center justify-center border-4 border-dashed border-blue-400 m-4 rounded-3xl pointer-events-none">
          <Upload size={54} className="text-blue-300 animate-bounce mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Suelta tu Rate Confirmation aquí</h2>
          <p className="text-blue-200 text-sm">Dakota procesará el PDF inmediatamente</p>
        </div>
      )}

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 pt-12 pb-24 relative z-10">
        
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900/90 border border-zinc-800 text-zinc-300 text-xs font-medium mb-6">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span>Procesamiento 100% local en tu navegador • Sin servidores externos</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-[54px] font-extrabold text-white tracking-tight leading-[1.12] mb-5">
            Extracción rápida de Rate Confirmations para despacho
          </h1>

          <p className="text-base sm:text-lg text-zinc-400 leading-relaxed max-w-2xl mx-auto font-normal mb-8">
            Convierte PDFs de C.H. Robinson, TQL, Traffix y más en cadenas para correo, notas formateadas para choferes y nombres de archivo estandarizados.
          </p>

          {/* Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-lg mx-auto">
            <button
              onClick={onGetStarted}
              className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition-all shadow-lg shadow-blue-600/25 cursor-pointer active:scale-[0.98]"
            >
              <span>Comenzar a Despachar</span>
              <ArrowRight size={16} />
              <span className="hidden sm:inline-block ml-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-700/60 text-blue-200">
                ↵ Enter
              </span>
            </button>

            {onLoadSample && (
              <button
                onClick={onLoadSample}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800/90 text-zinc-200 border border-zinc-800 font-medium text-sm transition-all cursor-pointer active:scale-[0.98]"
              >
                <Eye size={16} className="text-zinc-400" />
                <span>Ver Carga de Prueba</span>
              </button>
            )}

            <label className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800/90 text-zinc-200 border border-zinc-800 font-medium text-sm transition-all cursor-pointer active:scale-[0.98]">
              <Upload size={16} className="text-zinc-400" />
              <span>Cargar PDF</span>
              <input 
                type="file" 
                accept=".pdf" 
                onChange={handleFileInputChange} 
                className="hidden" 
              />
            </label>
          </div>
        </div>

        {/* Interactive Dispatch Workbench Preview */}
        <div className="max-w-5xl mx-auto rounded-3xl border border-zinc-800 bg-[#090d1a]/90 backdrop-blur-xl shadow-2xl overflow-hidden mb-20">
          
          {/* Workbench Top Bar */}
          <div className="px-6 py-4 border-b border-zinc-800/80 flex flex-wrap items-center justify-between gap-4 bg-zinc-950/40">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-700 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-700 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-700 inline-block" />
              <span className="text-xs font-mono text-zinc-400 ml-2">Demostración en vivo • Selección de broker</span>
            </div>

            {/* Broker Tabs */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-900/90 border border-zinc-800">
              {BROKER_DEMOS.map((demo, idx) => (
                <button
                  key={demo.id}
                  onClick={() => setSelectedDemoIndex(idx)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    selectedDemoIndex === idx
                      ? 'bg-zinc-800 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                  }`}
                >
                  {demo.name}
                </button>
              ))}
            </div>
          </div>

          {/* Workbench Body (Two Columns: Input Document & Output Generation) */}
          <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            
            {/* Left: Input Rate Confirmation Data */}
            <div className="lg:col-span-5 rounded-2xl border border-zinc-800/80 bg-zinc-950/60 p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-800/70">
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-blue-400" />
                    <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                      Rate Confirmation PDF
                    </span>
                  </div>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                    {activeDemo.name}
                  </span>
                </div>

                <div className="space-y-3.5 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-mono text-zinc-500 block mb-0.5">
                      {activeDemo.loadLabel} NUMBER
                    </span>
                    <span className="font-mono text-sm font-semibold text-white">
                      #{activeDemo.loadNumber}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <span className="text-[10px] uppercase font-mono text-zinc-500 block mb-0.5">
                        Shipper / Pick Up
                      </span>
                      <p className="font-medium text-zinc-200 text-[11px] leading-snug">
                        {activeDemo.origin}
                      </p>
                      <span className="text-[10px] font-mono text-zinc-400">
                        {activeDemo.pickupTime}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-mono text-zinc-500 block mb-0.5">
                        Receiver / Delivery
                      </span>
                      <p className="font-medium text-zinc-200 text-[11px] leading-snug">
                        {activeDemo.destination}
                      </p>
                      <span className="text-[10px] font-mono text-zinc-400">
                        {activeDemo.deliveryTime}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-zinc-800/50">
                    <div>
                      <span className="text-[10px] uppercase font-mono text-zinc-500 block mb-0.5">
                        Carga / Peso
                      </span>
                      <span className="font-mono font-medium text-zinc-300">
                        {activeDemo.weight}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-mono text-zinc-500 block mb-0.5">
                        Tarifa Confirmada
                      </span>
                      <span className="font-mono font-bold text-emerald-400">
                        {activeDemo.rate}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-zinc-800/70 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
                <span>OCR / PDF Nativo</span>
                <span className="text-emerald-400 font-medium">● 100% Detectado</span>
              </div>
            </div>

            {/* Middle: Transform indicator on desktop */}
            <div className="hidden lg:flex lg:col-span-1 items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
                <ChevronRight size={18} />
              </div>
            </div>

            {/* Right: Extracted Dispatch Formats */}
            <div className="lg:col-span-6 flex flex-col gap-4">
              
              {/* Output 1: Chain for Email Subject */}
              <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/60 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] uppercase font-bold tracking-wider text-zinc-400">
                      Cadena de Correo (Chain)
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">(Asunto de email)</span>
                  </div>
                  <button
                    onClick={() => handleCopy(activeDemo.chain, 'chain')}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-all cursor-pointer"
                  >
                    {copiedType === 'chain' ? (
                      <>
                        <Check size={12} className="text-emerald-400" />
                        <span className="text-emerald-400">Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy size={12} />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800/80 font-mono text-xs text-blue-300 break-all select-all">
                  {activeDemo.chain}
                </div>
              </div>

              {/* Output 2: Dispatch Notes for Driver */}
              <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/60 p-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] uppercase font-bold tracking-wider text-zinc-400">
                        Notas para Chofer / TMS
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono">(WhatsApp / SMS)</span>
                    </div>
                    <button
                      onClick={() => handleCopy(activeDemo.notes, 'notes')}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-all cursor-pointer"
                    >
                      {copiedType === 'notes' ? (
                        <>
                          <Check size={12} className="text-emerald-400" />
                          <span className="text-emerald-400">Copiado</span>
                        </>
                      ) : (
                        <>
                          <Copy size={12} />
                          <span>Copiar</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800/80 font-mono text-[11px] text-zinc-300 whitespace-pre-wrap leading-relaxed select-all">
                    {activeDemo.notes}
                  </pre>
                </div>

                {/* Output 3: Standard File Rename */}
                <div className="mt-3 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-xs font-mono">
                  <span className="text-zinc-500 text-[11px]">Nomenclatura PDF:</span>
                  <span className="text-zinc-400 text-[11px] bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                    {activeDemo.rename}
                  </span>
                </div>
              </div>

            </div>

          </div>

          {/* Workbench Footer Action */}
          <div className="px-6 py-4 bg-zinc-950/70 border-t border-zinc-800/70 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-400">
            <span>¿Listo para procesar tus propias confirmaciones?</span>
            <button
              onClick={onGetStarted}
              className="inline-flex items-center gap-1.5 text-blue-400 hover:text-blue-300 font-medium cursor-pointer"
            >
              <span>Abrir área de trabajo de Dakota</span>
              <ArrowRight size={14} />
            </button>
          </div>

        </div>

        {/* 4 Practical Pillars (Ground truth, zero AI fluff) */}
        <div className="max-w-5xl mx-auto mb-20">
          <div className="text-center mb-10">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
              Diseñado para el ritmo real de una oficina de despacho
            </h2>
            <p className="text-sm text-zinc-400 max-w-xl mx-auto">
              Herramientas de precisión para evitar errores en números de carga, estados y citas.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Pillar 1 */}
            <div className="p-5 rounded-2xl border border-zinc-800/80 bg-zinc-950/40 hover:border-zinc-700/80 transition-all">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-3.5 border border-blue-500/20">
                <ShieldCheck size={18} />
              </div>
              <h3 className="text-sm font-semibold text-white mb-1.5">
                Privacidad Absoluta
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                El texto y OCR se procesan 100% en tu navegador. Tus tarifas y clientes nunca se envían a servidores externos.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="p-5 rounded-2xl border border-zinc-800/80 bg-zinc-950/40 hover:border-zinc-700/80 transition-all">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3.5 border border-emerald-500/20">
                <Layers size={18} />
              </div>
              <h3 className="text-sm font-semibold text-white mb-1.5">
                Chains Estandarizadas
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Genera al instante el asunto del email con formato de camión, estados origen-destino y fecha para responder rápido al broker.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="p-5 rounded-2xl border border-zinc-800/80 bg-zinc-950/40 hover:border-zinc-700/80 transition-all">
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-3.5 border border-purple-500/20">
                <Truck size={18} />
              </div>
              <h3 className="text-sm font-semibold text-white mb-1.5">
                Notas para el Chofer
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Estructura automática de paradas (PU / DEL), pesos y números de confirmación lista para enviar por WhatsApp o SMS.
              </p>
            </div>

            {/* Pillar 4 */}
            <div className="p-5 rounded-2xl border border-zinc-800/80 bg-zinc-950/40 hover:border-zinc-700/80 transition-all">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-3.5 border border-amber-500/20">
                <FileText size={18} />
              </div>
              <h3 className="text-sm font-semibold text-white mb-1.5">
                OCR para Escaneados
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Si el broker envía una confirmación escaneada o de baja resolución, el motor óptico local extrae los datos sin fallar.
              </p>
            </div>

          </div>
        </div>

        {/* Supported Brokers Strip */}
        <div className="max-w-5xl mx-auto p-6 rounded-2xl border border-zinc-800/80 bg-zinc-950/40 text-center">
          <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 block mb-4">
            Brokers Soportados con Reglas Verificadas
          </span>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {[
              { name: 'C.H. Robinson', note: 'Multi-stop & pesos' },
              { name: 'TQL (Total Quality Logistics)', note: 'PO & citas' },
              { name: 'Traffix', note: 'Order standard' },
              { name: 'Landstar', note: 'Load confirmations' },
              { name: 'North Star Transport', note: 'Carrier dispatch' },
              { name: 'Arrive Logistics', note: 'Verified rates' },
              { name: 'OpenRoad', note: 'Standard tags' }
            ].map((broker) => (
              <span 
                key={broker.name}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-800 bg-zinc-900/80 text-zinc-300 text-xs font-medium"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>{broker.name}</span>
              </span>
            ))}
          </div>
        </div>

      </main>

      {/* Clean Footer */}
      <footer className="border-t border-zinc-800/80 py-10 bg-zinc-950 text-zinc-500 text-xs">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <DakotaLogo className="w-5 h-5" />
            <span className="font-geologica font-bold text-zinc-300 lowercase">dakota</span>
            <span className="text-zinc-600">|</span>
            <span>Rate Confirmation Dispatching Suite</span>
          </div>

          <div className="flex items-center gap-6 font-mono text-[11px] text-zinc-400">
            <span>Atajo: [Enter] para entrar</span>
            <span>Arrastra PDFs en cualquier momento</span>
          </div>
        </div>
      </footer>

    </motion.div>
  );
};
