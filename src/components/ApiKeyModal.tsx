import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Key, X, Check, ExternalLink, Sparkles, ShieldCheck } from 'lucide-react';
import { getStoredApiKey, setStoredApiKey } from '../services/geminiService';
import { DakotaPlusLogo } from './DakotaLogo';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  isDarkMode
}) => {
  const [keyInput, setKeyInput] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setKeyInput(getStoredApiKey());
      setIsSaved(false);
    }
  }, [isOpen]);

  const handleSave = () => {
    setStoredApiKey(keyInput);
    setIsSaved(true);
    setTimeout(() => {
      onClose();
    }, 800);
  };

  const handleClear = () => {
    setStoredApiKey('');
    setKeyInput('');
    setIsSaved(false);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className={`relative w-full max-w-md p-6 rounded-2xl shadow-2xl border ${
            isDarkMode 
              ? 'bg-[#0e121e] border-zinc-800 text-zinc-100' 
              : 'bg-white border-zinc-200 text-zinc-900'
          }`}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 transition-colors"
          >
            <X size={18} />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <DakotaPlusLogo className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold font-geologica tracking-tight flex items-center gap-1">
                  Dakota<span className="text-emerald-500">+</span>
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Gemini IA
                </span>
              </div>
              <p className="text-xs text-zinc-400">Configuración de API Key para Static Site (Render)</p>
            </div>
          </div>

          <p className="text-xs text-zinc-300 dark:text-zinc-400 leading-relaxed mb-4">
            Para procesar cualquier Rate Con con IA sin costo de servidor, Dakota+ se conecta directamente a la API de Gemini desde el navegador. La clave se guarda de forma segura en tu propio navegador (<code className="text-emerald-400 font-mono">localStorage</code>).
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5 flex items-center gap-1.5">
                <Key size={13} className="text-emerald-400" />
                Google Gemini API Key
              </label>
              <input
                type="password"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-mono tracking-wide focus:outline-none transition-all ${
                  isDarkMode
                    ? 'bg-zinc-950/60 border-zinc-800 text-white focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10'
                    : 'bg-zinc-50 border-zinc-300 text-zinc-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                }`}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-zinc-400">
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1 font-medium transition-colors"
              >
                <span>Obtener API Key gratis en Google AI Studio</span>
                <ExternalLink size={12} />
              </a>
              {keyInput && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-red-400 hover:text-red-300 transition-colors"
                >
                  Eliminar clave
                </button>
              )}
            </div>

            <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/20 flex items-start gap-2.5 text-[11px] text-zinc-300">
              <ShieldCheck size={16} className="text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>1.500 lecturas diarias gratuitas</strong> con Gemini Flash. Para mayor seguridad, puedes restringir la clave por dominio (HTTP Referrer) desde Google Cloud Console.
              </span>
            </div>

            {/* Action buttons */}
            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaved}
                className={`px-5 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-md ${
                  isSaved
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-500 hover:bg-emerald-600 text-white hover:shadow-emerald-500/20'
                }`}
              >
                {isSaved ? (
                  <>
                    <Check size={14} />
                    <span>Guardado</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    <span>Guardar y Activar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
