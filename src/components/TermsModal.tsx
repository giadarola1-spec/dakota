import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Lock, AlertTriangle, FileText, CheckCircle2, ChevronRight, X } from 'lucide-react';
import { DakotaLogo } from './DakotaLogo';

export interface TermsModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onReject: () => void;
  isDarkMode: boolean;
}

export interface TermsBlockedViewProps {
  isDarkMode: boolean;
  onReviewTerms: () => void;
}

export const TermsModal: React.FC<TermsModalProps> = ({
  isOpen,
  onAccept,
  onReject,
  isDarkMode,
}) => {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 24) {
      setHasScrolledToBottom(true);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`fixed inset-0 backdrop-blur-md transition-colors ${
            isDarkMode ? 'bg-[#05070f]/80' : 'bg-slate-900/40'
          }`}
          onClick={onReject}
        />

        {/* Modal Window */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 16 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className={`relative z-10 w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
            isDarkMode
              ? 'bg-[#0c0e17] border-white/10 text-slate-100'
              : 'bg-white border-slate-200 text-slate-900'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className={`p-6 border-b flex items-start justify-between gap-4 ${
              isDarkMode ? 'border-white/10 bg-white/[0.02]' : 'border-slate-100 bg-slate-50/70'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                <DakotaLogo className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold tracking-tight">Terms of Service & Privacy Policy</h2>
                  <span
                    className={`text-[10px] font-mono uppercase tracking-wider font-semibold px-2 py-0.5 rounded-md ${
                      isDarkMode
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-400/20'
                        : 'bg-blue-100 text-blue-700 border border-blue-200'
                    }`}
                  >
                    v1.0 Local
                  </span>
                </div>
                <p
                  className={`text-xs mt-0.5 ${
                    isDarkMode ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  Please review and accept our operating standards and client-side privacy commitments.
                </p>
              </div>
            </div>

            <button
              onClick={onReject}
              aria-label="Decline and close"
              className={`p-1.5 rounded-lg border transition-colors shrink-0 ${
                isDarkMode
                  ? 'border-white/10 text-slate-400 hover:text-white hover:bg-white/5'
                  : 'border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-100'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Highlights Grid */}
          <div
            className={`px-6 py-4 grid grid-cols-1 sm:grid-cols-3 gap-3 border-b text-xs ${
              isDarkMode ? 'border-white/10 bg-white/[0.01]' : 'border-slate-100 bg-slate-50/40'
            }`}
          >
            <div
              className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                isDarkMode
                  ? 'bg-white/[0.03] border-white/5 text-slate-300'
                  : 'bg-white border-slate-200/80 text-slate-700'
              }`}
            >
              <Lock className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block text-slate-100 dark:text-slate-100">100% Client-Side</span>
                <span className="text-[11px] leading-snug block mt-0.5 text-slate-400">
                  Rate documents process strictly in your browser memory.
                </span>
              </div>
            </div>

            <div
              className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                isDarkMode
                  ? 'bg-white/[0.03] border-white/5 text-slate-300'
                  : 'bg-white border-slate-200/80 text-slate-700'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block text-slate-100 dark:text-slate-100">Zero Telemetry</span>
                <span className="text-[11px] leading-snug block mt-0.5 text-slate-400">
                  Rates, driver numbers, and customer data are never transmitted.
                </span>
              </div>
            </div>

            <div
              className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                isDarkMode
                  ? 'bg-white/[0.03] border-white/5 text-slate-300'
                  : 'bg-white border-slate-200/80 text-slate-700'
              }`}
            >
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block text-slate-100 dark:text-slate-100">Dispatcher Verification</span>
                <span className="text-[11px] leading-snug block mt-0.5 text-slate-400">
                  You are responsible for confirming all appointment windows.
                </span>
              </div>
            </div>
          </div>

          {/* Scrollable Terms Content */}
          <div
            onScroll={handleScroll}
            className={`p-6 overflow-y-auto space-y-5 text-xs leading-relaxed border-b flex-1 ${
              isDarkMode ? 'border-white/10 text-slate-300' : 'border-slate-100 text-slate-600'
            }`}
          >
            <section className="space-y-1.5">
              <h3
                className={`text-sm font-semibold tracking-tight ${
                  isDarkMode ? 'text-slate-100' : 'text-slate-900'
                }`}
              >
                1. Local Execution & Data Privacy
              </h3>
              <p>
                Dakota operates on a privacy-first architectural model. When you upload or paste rate confirmations,
                load documents, bills of lading, or dispatch notes, all parsing, optical character recognition (OCR),
                text layer extraction, and chain formatting are executed directly within your web browser. No rate
                confirmation PDFs, shipment values, shipper/receiver addresses, broker contact names, phone numbers,
                or carrier rate agreements are uploaded, saved, or logged to remote servers or third-party telemetry.
              </p>
            </section>

            <section className="space-y-1.5">
              <h3
                className={`text-sm font-semibold tracking-tight ${
                  isDarkMode ? 'text-slate-100' : 'text-slate-900'
                }`}
              >
                2. Dispatcher Verification & Operational Responsibility
              </h3>
              <p>
                Dakota is an operational productivity utility intended to accelerate workflow efficiency. Automated
                parsing algorithms may encounter irregular document layouts, obscured scans, or atypical brokerage
                formats. The user (freight dispatcher, carrier operator, or logistics manager) retains sole and
                exclusive responsibility for verifying all critical operational variables—including appointment times,
                strict check-in deadlines, pickup and delivery physical addresses, trailer requirements, temperature
                settings, and special load instructions—prior to tendering, dispatching drivers, or executing freight.
              </p>
            </section>

            <section className="space-y-1.5">
              <h3
                className={`text-sm font-semibold tracking-tight ${
                  isDarkMode ? 'text-slate-100' : 'text-slate-900'
                }`}
              >
                3. Permitted Use & Operational Integrity
              </h3>
              <p>
                You may use Dakota solely for lawful transportation logistics management and carrier operations.
                You agree not to reverse engineer, tamper with, or introduce malicious payloads into the client
                application. All generated chain templates, history records, and custom configurations are stored
                in your browser's local storage and can be cleared at any time through application settings or by
                clearing browser site data.
              </p>
            </section>

            <section className="space-y-1.5">
              <h3
                className={`text-sm font-semibold tracking-tight ${
                  isDarkMode ? 'text-slate-100' : 'text-slate-900'
                }`}
              >
                4. Disclaimer of Warranties & Limitation of Liability
              </h3>
              <p>
                Dakota is provided on an &ldquo;AS IS&rdquo; and &ldquo;AS AVAILABLE&rdquo; basis without warranties of
                any kind, express or implied. Under no circumstances shall Dakota, its developers, or its affiliates
                be liable for any direct, indirect, incidental, punitive, or consequential damages resulting from
                missed pickup or delivery appointments, detention disputes, freight claims, inaccurate rates, or carrier
                contractual disputes arising from the use of this utility.
              </p>
            </section>

            <section className="space-y-1.5">
              <h3
                className={`text-sm font-semibold tracking-tight ${
                  isDarkMode ? 'text-slate-100' : 'text-slate-900'
                }`}
              >
                5. Acknowledgment & Consent
              </h3>
              <p>
                By clicking &ldquo;Accept &amp; Continue&rdquo;, you signify that you have reviewed these terms and
                explicitly accept that load verification remains under your operational supervision.
              </p>
            </section>
          </div>

          {/* Footer Controls */}
          <div
            className={`p-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 ${
              isDarkMode ? 'bg-[#090b13]' : 'bg-slate-50'
            }`}
          >
            {/* Acknowledgment checkbox */}
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
              />
              <span
                className={`text-xs ${
                  isDarkMode ? 'text-slate-300' : 'text-slate-700'
                }`}
              >
                I have read and agree to the Dakota operating terms
              </span>
            </label>

            {/* Action buttons */}
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={onReject}
                className={`px-4 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                  isDarkMode
                    ? 'border-white/10 text-slate-300 hover:bg-white/5 hover:text-white'
                    : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Decline &amp; Exit
              </button>

              <button
                type="button"
                onClick={onAccept}
                disabled={!acknowledged}
                className={`px-5 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-sm ${
                  acknowledged
                    ? 'bg-blue-600 hover:bg-blue-500 text-white cursor-pointer active:scale-95'
                    : 'bg-blue-600/40 text-white/50 cursor-not-allowed'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Accept &amp; Continue</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export const TermsBlockedView: React.FC<TermsBlockedViewProps> = ({
  isDarkMode,
  onReviewTerms,
}) => {
  return (
    <div
      className={`min-h-screen flex items-center justify-center p-6 selection:bg-blue-500/20 ${
        isDarkMode ? 'bg-[#05070f] text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      <div
        className={`w-full max-w-lg rounded-2xl border p-8 shadow-2xl relative overflow-hidden flex flex-col items-center text-center ${
          isDarkMode
            ? 'bg-[#0c0e17] border-white/10'
            : 'bg-white border-slate-200'
        }`}
      >
        <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-6">
          <DakotaLogo className="w-8 h-8" />
        </div>

        <div
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-4 ${
            isDarkMode
              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
              : 'bg-amber-50 text-amber-800 border border-amber-200'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
          <span>Terms Acceptance Required</span>
        </div>

        <h1 className="text-xl font-bold tracking-tight mb-2">
          Operating Terms Acceptance Paused
        </h1>

        <p
          className={`text-xs leading-relaxed max-w-sm mb-6 ${
            isDarkMode ? 'text-slate-400' : 'text-slate-600'
          }`}
        >
          Access to Dakota is currently paused because the Terms of Service &amp; Privacy Policy were declined.
          Dakota operates 100% client-side with zero telemetry or remote storage of sensitive rate documents.
        </p>

        <div
          className={`w-full p-4 rounded-xl border mb-6 text-left space-y-2 text-xs ${
            isDarkMode
              ? 'bg-white/[0.02] border-white/5 text-slate-300'
              : 'bg-slate-50 border-slate-200 text-slate-600'
          }`}
        >
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>Zero customer rate confirmations uploaded to remote servers.</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span>Zero third-party tracking, profiling, or telemetry.</span>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Dispatcher oversight and manual verification guaranteed.</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onReviewTerms}
          className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 active:scale-98 text-white text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Review &amp; Accept Terms</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
