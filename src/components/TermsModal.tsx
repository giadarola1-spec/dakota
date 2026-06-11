import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, Check, X, Lock, ScrollText, AlertTriangle } from 'lucide-react';

interface TermsModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onReject: () => void;
  isDarkMode: boolean;
}

const DakotaLogo = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 349.899 349.898" xmlns="http://www.w3.org/2000/svg">
    <path fill="#BF0A30" d="M175.522,12.235c-42.6,0-77.256,34.649-77.256,77.25c0,42.6,34.656,77.255,77.256,77.255 c42.591,0,77.257-34.656,77.257-77.255C252.779,46.895,218.113,12.235,175.522,12.235z" />
    <path fill="#FFFFFF" stroke="#e2e8f0" strokeWidth="4" d="M77.255,337.663c42.599,0,77.255-34.641,77.255-77.251c0-42.594-34.656-77.25-77.255-77.25 C34.653,183.162,0,217.818,0,260.412C0,303.012,34.653,337.663,77.255,337.663z" />
    <path fill="#002868" d="M272.648,183.151c-42.603,0-77.256,34.65-77.256,77.256c0,42.604,34.653,77.25,77.256,77.25 c42.6,0,77.251-34.646,77.251-77.25C349.909,217.818,315.248,183.151,272.648,183.151z" />
  </svg>
);

export const TermsModal: React.FC<TermsModalProps> = ({
  isOpen,
  onAccept,
  onReject,
  isDarkMode
}) => {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (container) {
      const { scrollTop, scrollHeight, clientHeight } = container;
      // If user is within 10px of the bottom, allow accepting
      if (scrollHeight - scrollTop - clientHeight < 15) {
        setHasScrolledToBottom(true);
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
          {/* Backdrop screen lock - user cannot click outside to close */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            transition={{ type: "spring", duration: 0.5 }}
            className={`relative w-full max-w-2xl ${isDarkMode ? 'bg-[#0c1020] border-zinc-800' : 'bg-white border-zinc-200'} border rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]`}
          >
            {/* Header */}
            <div className={`p-6 md:p-8 border-b ${isDarkMode ? 'border-zinc-850' : 'border-zinc-100'} flex-none`}>
              <div className="flex items-center gap-3">
                <DakotaLogo className="w-8 h-8 flex-none" />
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className={`text-2xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-zinc-900'} lowercase`}>dakota</h1>
                    <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full font-bold bg-zinc-500/10 text-zinc-400">EULA</span>
                  </div>
                  <p className={`text-xs ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'} font-medium mt-0.5`}>End-User License Agreement (EULA) for Dakota</p>
                </div>
              </div>
            </div>

            {/* Scrollable EULA Text content */}
            <div 
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className={`p-6 md:p-8 overflow-y-auto space-y-6 flex-grow text-xs leading-relaxed ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'} scrollbar-thin`}
            >
              <div className="space-y-4">
                <p className="font-semibold text-sm">Last Updated: June 11, 2026</p>
                <p>
                  Please read these Terms and Conditions ("Terms", "Agreement") carefully before downloading, installing, or
                  using <strong>Dakota</strong> (hereinafter referred to as the "Software" or the "Application"). This Agreement constitutes a
                  legally binding contract between you (the "User") and <strong>Gianfranco Iadarola Aponte</strong>, the sole creator,
                  developer, and lawful owner of the Software.
                </p>
                <p>
                  By installing, copying, or otherwise using Dakota, you acknowledge that you have read, understood, and agree
                  to be bound by the terms of this Agreement. <strong>If you do not agree to these terms, do not install or use the
                  Software.</strong>
                </p>
              </div>

              <div className={`p-4 rounded-2xl ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800' : 'bg-zinc-50 border-zinc-200'} border flex gap-3`}>
                <ScrollText className="text-zinc-500 flex-none" size={18} />
                <p className={`text-[11px] ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'} leading-normal`}>
                  You are required to scroll down and review all clauses completely before accepting. This software is designed for local extraction and operates entirely inside your runtime.
                </p>
              </div>

              {/* Section 1 */}
              <div className="space-y-2">
                <h3 className={`font-extrabold tracking-tight ${isDarkMode ? 'text-zinc-200' : 'text-zinc-800'} text-xs uppercase`}>
                  1. INTELLECTUAL PROPERTY AND COPYRIGHT OWNERSHIP
                </h3>
                <p>
                  Dakota, including its source code, object code, user interface, design, algorithms, documentation, and all
                  associated intellectual property rights, is and shall remain the exclusive property of <strong>Gianfranco Iadarola
                  Aponte</strong>. The Software is protected by national and international copyright laws and treaties.
                </p>
                <p>
                  This Agreement does not sell, transfer, or assign any ownership rights of the Software to the User. The User is
                  granted only a limited, non-exclusive, non-transferable, revocable license to use the Software strictly in
                  accordance with these Terms.
                </p>
              </div>

              {/* Section 2 */}
              <div className="space-y-2">
                <h3 className={`font-extrabold tracking-tight ${isDarkMode ? 'text-zinc-200' : 'text-zinc-800'} text-xs uppercase`}>
                  2. LICENSE RESTRICTIONS
                </h3>
                <p>The User shall not, and shall not permit any third party to:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Decompile, disassemble, reverse engineer, or attempt to derive the source code of the Application.</li>
                  <li>Modify, adapt, alter, translate, or create derivative works based upon the Software.</li>
                  <li>Rent, lease, loan, resell, sublicense, distribute, or otherwise commercially exploit the Software.</li>
                  <li>Remove, alter, or obscure any copyright notices, trademarks, or proprietary legends embedded within or displayed by the Application.</li>
                </ul>
              </div>

              {/* Section 3 */}
              <div className="space-y-3">
                <h3 className={`font-extrabold tracking-tight ${isDarkMode ? 'text-zinc-200' : 'text-zinc-800'} text-xs uppercase`}>
                  3. NATURE OF SOFTWARE AND DATA PRIVACY (LOCAL EXECUTION)
                </h3>
                <p>
                  Dakota is strictly a <strong>local text extraction utility</strong> designed to process files directly on the User's personal
                  computer or local workstation.
                </p>

                {/* Privacy Warning highlight Box */}
                <div className="p-5 border-l-4 border-emerald-500 bg-emerald-500/5 rounded-r-2xl space-y-2">
                  <span className="text-[10px] font-bold text-emerald-500 tracking-wider uppercase flex items-center gap-1.5">
                    <Check size={12} /> CRITICAL PRIVACY ASSURANCE
                  </span>
                  <p className={`${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'} text-[11px] leading-relaxed`}>
                    Dakota operates entirely client-side. The Software <strong>does not</strong> utilize cloud storage, external servers, or remote transmission methods. It <strong>does not collect, store, log, or transmit</strong> any data handled within the app, including but not limited to: driver details, shipping rates, load prices, routing details, or client logistics information.
                  </p>
                </div>

                <p>
                  Because all processing occurs strictly within the User's local environment, the User maintains full and absolute
                  responsibility for the security, confidentiality, and management of any data extracted or processed using the
                  Software.
                </p>
              </div>

              {/* Section 4 */}
              <div className="space-y-2">
                <h3 className={`font-extrabold tracking-tight ${isDarkMode ? 'text-zinc-200' : 'text-zinc-800'} text-xs uppercase`}>
                  4. RIGHT TO MODIFY, SUSPEND, OR TERMINATE SERVICE
                </h3>
                <p>
                  Gianfranco Iadarola Aponte reserves the absolute, unilateral right to modify, suspend, update, or permanently 
                  <strong> discontinue and delete Dakota at any time, for any reason, or no reason at all, without prior notice</strong> and 
                  without any liability to the User or any third party.
                </p>
                <p>
                  In the event that the Software is discontinued, deleted, or rendered obsolete, Gianfranco Iadarola Aponte is
                  under no obligation to provide support, updates, source code access, or alternative solutions. The User
                  acknowledges that their reliance on the continued availability of Dakota is entirely at their own risk.
                </p>
              </div>

              {/* Section 5 */}
              <div className="space-y-2">
                <h3 className={`font-extrabold tracking-tight ${isDarkMode ? 'text-zinc-200' : 'text-zinc-800'} text-xs uppercase`}>
                  5. DISCLAIMER OF WARRANTIES
                </h3>
                <p className="uppercase tracking-wide text-[11px] leading-relaxed select-all">
                  THE SOFTWARE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS, WITHOUT WARRANTIES OF ANY KIND,
                  EITHER EXPRESS OR IMPLIED. TO THE MAXIMUM EXTENT PERMITTED BY LAW, GIANFRANCO IADAROLA
                  APONTE DISCLAIMS ALL WARRANTIES, INCLUDING ANY IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS
                  FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. NO WARRANTY IS MADE THAT THE SOFTWARE WILL
                  MEET YOUR REQUIREMENTS, OPERATE WITHOUT INTERRUPTION, BE COMPLETELY ERROR-FREE, OR
                  CORRECTLY EXTRACT TEXT FROM ALL INPUT FORMATS.
                </p>
              </div>

              {/* Section 6 */}
              <div className="space-y-2">
                <h3 className={`font-extrabold tracking-tight ${isDarkMode ? 'text-zinc-200' : 'text-zinc-800'} text-xs uppercase`}>
                  6. LIMITATION OF LIABILITY
                </h3>
                <p className="uppercase tracking-wide text-[11px] leading-relaxed select-all">
                  IN NO EVENT SHALL GIANFRANCO IADAROLA APONTE BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
                  SPECIAL, EXEMPLARY, PUNITIVE, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
                  PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
                  INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT
                  LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
                  SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
                </p>
              </div>

              {/* Section 7 */}
              <div className="space-y-2">
                <h3 className={`font-extrabold tracking-tight ${isDarkMode ? 'text-zinc-200' : 'text-zinc-800'} text-xs uppercase`}>
                  7. INDEMNIFICATION
                </h3>
                <p>
                  The User agrees to defend, indemnify, and hold harmless Gianfranco Iadarola Aponte from and against any
                  and all claims, damages, obligations, losses, liabilities, costs, or debt, and expenses (including but not limited to
                  attorney's fees) arising from the User's misuse of the Software, violation of any third-party privacy or intellectual
                  property rights, or breach of this Agreement.
                </p>
              </div>

              {/* Section 8 */}
              <div className="space-y-2">
                <h3 className={`font-extrabold tracking-tight ${isDarkMode ? 'text-zinc-200' : 'text-zinc-800'} text-xs uppercase`}>
                  8. SEVERABILITY
                </h3>
                <p>
                  If any provision of this Agreement is found to be unenforceable, invalid, or illegal under applicable law, such
                  provision shall be changed and interpreted to accomplish the objectives of such provision to the greatest extent
                  possible, and the remaining provisions shall continue in full force and effect.
                </p>
              </div>

              {/* Section 9 */}
              <div className="space-y-2">
                <h3 className={`font-extrabold tracking-tight ${isDarkMode ? 'text-zinc-200' : 'text-zinc-800'} text-xs uppercase`}>
                  9. GOVERNING LAW AND JURISDICTION
                </h3>
                <p>
                  This Agreement and any dispute arising out of or in connection with it shall be governed by, and construed in
                  accordance with, the laws governing the domicile of the creator, <strong>Gianfranco Iadarola Aponte</strong>, without regard to
                  conflict of law principles. Any legal action or proceeding relating to this Software shall be brought exclusively in
                  the competent courts of said jurisdiction.
                </p>
              </div>

              {/* Section 10 */}
              <div className="space-y-2">
                <h3 className={`font-extrabold tracking-tight ${isDarkMode ? 'text-zinc-200' : 'text-zinc-800'} text-xs uppercase`}>
                  10. ENTIRE AGREEMENT
                </h3>
                <p>
                  These Terms and Conditions constitute the entire legal agreement between the User and <strong>Gianfranco Iadarola
                  Aponte</strong> regarding Dakota, superseding any prior verbal or written agreements, communications, or
                  understandings regarding the Software.
                </p>
              </div>
            </div>

            {/* Checkbox confirmation & Action Button panel */}
            <div className={`p-6 md:p-8 border-t ${isDarkMode ? 'border-zinc-850 bg-black/20' : 'border-zinc-100 bg-zinc-50/50'} flex-none space-y-4`}>
              <label className="flex items-start gap-3 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={isChecked}
                  onChange={(e) => setIsChecked(e.target.checked)}
                  className={`mt-0.5 rounded border-2 ${isDarkMode ? 'bg-zinc-900 border-zinc-750 text-blue-500 focus:ring-blue-500/20' : 'border-zinc-300 text-zinc-900 focus:ring-zinc-900/20'} pr-0`} 
                />
                <span className={`text-[11px] ${isDarkMode ? 'text-zinc-400 group-hover:text-zinc-300' : 'text-zinc-600 group-hover:text-zinc-900'} leading-tight select-none`}>
                  I have read, understood, and agree to be bound by the Terms and Conditions of Use and the End-User License Agreement (EULA) for Dakota.
                </span>
              </label>

              <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                {/* Reject buttons */}
                <button
                  type="button"
                  onClick={onReject}
                  className="w-full sm:w-1/3 py-3 px-4 rounded-xl text-xs font-bold border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all text-center"
                >
                  Decline & Block Access
                </button>
                
                {/* Accept to continue */}
                <button
                  type="button"
                  disabled={!isChecked}
                  onClick={onAccept}
                  className={`w-full sm:w-2/3 py-3 px-6 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-lg ${
                    isChecked 
                      ? isDarkMode 
                        ? 'bg-white text-zinc-900 hover:bg-zinc-100' 
                        : 'bg-zinc-900 hover:bg-zinc-800 text-white shadow-zinc-950/20'
                      : 'bg-zinc-500/10 text-zinc-500 cursor-not-allowed border border-transparent'
                  }`}
                >
                  <Check size={14} />
                  Accept & Continue
                </button>
              </div>
              <p className={`text-[10px] text-center ${isDarkMode ? 'text-zinc-550' : 'text-zinc-400'}`}>
                Must accept the EULA to licensed Dakota strictly for local execution.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

interface TermsBlockedViewProps {
  isDarkMode: boolean;
  onReviewTerms: () => void;
}

export const TermsBlockedView: React.FC<TermsBlockedViewProps> = ({
  isDarkMode,
  onReviewTerms
}) => {
  return (
    <div className={`fixed inset-0 z-[600] flex items-center justify-center px-4 ${isDarkMode ? 'bg-[#060810]' : 'bg-zinc-50'}`}>
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-y-0 w-full bg-[radial-gradient(#BF0A30_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className={`relative w-full max-w-md p-8 ${isDarkMode ? 'bg-[#0c1020] border-zinc-900' : 'bg-white border-zinc-200'} border rounded-[32px] shadow-2xl overflow-hidden text-center space-y-6 z-10`}
      >
        <div className="mx-auto w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 animate-pulse">
          <Lock size={32} />
        </div>

        <div className="space-y-2">
          <h2 className={`text-xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
            Access Blocked
          </h2>
          <p className={`text-xs ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'} leading-relaxed`}>
            You have declined the Terms and Conditions of Use. Legally, we cannot grant you access to Dakota's local extraction utility without your agreement to the End-User License Agreement (EULA).
          </p>
        </div>

        <div className={`p-4 rounded-2xl ${isDarkMode ? 'bg-zinc-900/30' : 'bg-zinc-100/50'} text-left flex gap-3 text-[11px] leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
          <ShieldAlert className="text-red-500 flex-none" size={16} />
          <p>
            No data is collected or sent out of your system, your privacy remains completely private. Read the agreement first to confirm.
          </p>
        </div>

        <button
          type="button"
          onClick={onReviewTerms}
          className={`w-full py-3.5 px-6 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-950/20 active:scale-[0.98] cursor-pointer`}
        >
          <ScrollText size={14} />
          Review & Accept Terms
        </button>

        <p className={`text-[10px] ${isDarkMode ? 'text-zinc-550' : 'text-zinc-400'}`}>
          Dakota © 2026. Manufactured by Gianfranco Iadarola Aponte.
        </p>
      </motion.div>
    </div>
  );
};
