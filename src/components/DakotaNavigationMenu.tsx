import React from 'react';
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuContent,
  NavigationMenuTrigger,
  NavigationMenuLink,
} from './ui/navigation-menu';
import {
  Upload,
  FileSpreadsheet,
  Layers,
  Users,
  Hash,
  Shield,
  HelpCircle,
  Settings,
  Search,
  FileText,
  Sliders,
} from 'lucide-react';

interface DakotaNavigationMenuProps {
  appState: 'upload' | 'verify' | 'results' | 'templates' | 'history' | 'manage';
  setAppState: (state: 'upload' | 'verify' | 'results' | 'templates' | 'history' | 'manage') => void;
  onOpenDriverModal?: () => void;
  onOpenTerms?: () => void;
  onOpenWelcome?: () => void;
  onOpenSettings?: () => void;
  isDarkMode?: boolean;
}

export const DakotaNavigationMenu: React.FC<DakotaNavigationMenuProps> = ({
  appState,
  setAppState,
  onOpenDriverModal,
  onOpenTerms,
  onOpenWelcome,
  onOpenSettings,
  isDarkMode = true,
}) => {
  return (
    <NavigationMenu viewport={false} className="hidden md:flex">
      <NavigationMenuList className="flex items-center gap-1 text-xs">
        {/* Operations Dropdown */}
        <NavigationMenuItem>
          <NavigationMenuTrigger
            className={`h-8 px-2.5 py-1 text-xs font-medium rounded transition-colors bg-transparent border-0 shadow-none cursor-pointer ${
              appState === 'upload' || appState === 'history'
                ? isDarkMode
                  ? 'bg-white/15 text-white font-semibold'
                  : 'bg-zinc-900 text-white font-semibold'
                : isDarkMode
                ? 'text-zinc-400 hover:text-white hover:bg-white/[0.06] data-[state=open]:bg-white/10 data-[state=open]:text-white'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 data-[state=open]:bg-zinc-100 data-[state=open]:text-zinc-900'
            }`}
          >
            Operations
          </NavigationMenuTrigger>
          <NavigationMenuContent
            className={`w-72 p-2 rounded-xl shadow-2xl border ${
              isDarkMode
                ? 'bg-[#0c0e17] border-white/10 text-zinc-200'
                : 'bg-white border-zinc-200 text-zinc-800'
            }`}
          >
            <div className="space-y-1">
              <NavigationMenuLink asChild>
                <button
                  type="button"
                  onClick={() => setAppState('upload')}
                  className={`w-full text-left flex items-start gap-3 p-2.5 rounded-lg transition-colors cursor-pointer ${
                    appState === 'upload'
                      ? isDarkMode
                        ? 'bg-white/10 text-white'
                        : 'bg-zinc-100 text-zinc-900 font-medium'
                      : isDarkMode
                      ? 'hover:bg-white/[0.05] text-zinc-300'
                      : 'hover:bg-zinc-50 text-zinc-700'
                  }`}
                >
                  <div className="w-8 h-8 rounded-md bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Upload size={16} />
                  </div>
                  <div>
                    <div className="font-semibold text-xs flex items-center gap-1.5">
                      Rate Con Intake
                      {appState === 'upload' && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 bg-blue-500/20 text-blue-400 rounded">
                          Active
                        </span>
                      )}
                    </div>
                    <div className={`text-[11px] leading-tight mt-0.5 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                      Drop PDFs, extract stops, appointments & rates locally
                    </div>
                  </div>
                </button>
              </NavigationMenuLink>

              <NavigationMenuLink asChild>
                <button
                  type="button"
                  onClick={() => setAppState('history')}
                  className={`w-full text-left flex items-start gap-3 p-2.5 rounded-lg transition-colors cursor-pointer ${
                    appState === 'history'
                      ? isDarkMode
                        ? 'bg-white/10 text-white'
                        : 'bg-zinc-100 text-zinc-900 font-medium'
                      : isDarkMode
                      ? 'hover:bg-white/[0.05] text-zinc-300'
                      : 'hover:bg-zinc-50 text-zinc-700'
                  }`}
                >
                  <div className="w-8 h-8 rounded-md bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Search size={16} />
                  </div>
                  <div>
                    <div className="font-semibold text-xs flex items-center gap-1.5">
                      Load History & Search
                      {appState === 'history' && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 rounded">
                          Active
                        </span>
                      )}
                    </div>
                    <div className={`text-[11px] leading-tight mt-0.5 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                      Search extracted rate confirmations & export archives
                    </div>
                  </div>
                </button>
              </NavigationMenuLink>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>

        {/* Templates Direct/Dropdown */}
        <NavigationMenuItem>
          <NavigationMenuTrigger
            className={`h-8 px-2.5 py-1 text-xs font-medium rounded transition-colors bg-transparent border-0 shadow-none cursor-pointer ${
              appState === 'templates'
                ? isDarkMode
                  ? 'bg-white/15 text-white font-semibold'
                  : 'bg-zinc-900 text-white font-semibold'
                : isDarkMode
                ? 'text-zinc-400 hover:text-white hover:bg-white/[0.06] data-[state=open]:bg-white/10 data-[state=open]:text-white'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 data-[state=open]:bg-zinc-100 data-[state=open]:text-zinc-900'
            }`}
          >
            Templates
          </NavigationMenuTrigger>
          <NavigationMenuContent
            className={`w-72 p-2 rounded-xl shadow-2xl border ${
              isDarkMode
                ? 'bg-[#0c0e17] border-white/10 text-zinc-200'
                : 'bg-white border-zinc-200 text-zinc-800'
            }`}
          >
            <div className="space-y-1">
              <NavigationMenuLink asChild>
                <button
                  type="button"
                  onClick={() => setAppState('templates')}
                  className={`w-full text-left flex items-start gap-3 p-2.5 rounded-lg transition-colors cursor-pointer ${
                    appState === 'templates'
                      ? isDarkMode
                        ? 'bg-white/10 text-white'
                        : 'bg-zinc-100 text-zinc-900 font-medium'
                      : isDarkMode
                      ? 'hover:bg-white/[0.05] text-zinc-300'
                      : 'hover:bg-zinc-50 text-zinc-700'
                  }`}
                >
                  <div className="w-8 h-8 rounded-md bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Layers size={16} />
                  </div>
                  <div>
                    <div className="font-semibold text-xs flex items-center gap-1.5">
                      Dispatch Chain Tokens
                      {appState === 'templates' && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 bg-amber-500/20 text-amber-400 rounded">
                          Active
                        </span>
                      )}
                    </div>
                    <div className={`text-[11px] leading-tight mt-0.5 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                      Build email subjects with tokens like {'{unit}'}, {'{orig_st}'}, {'{dest_st}'}
                    </div>
                  </div>
                </button>
              </NavigationMenuLink>

              <NavigationMenuLink asChild>
                <button
                  type="button"
                  onClick={() => setAppState('templates')}
                  className={`w-full text-left flex items-start gap-3 p-2.5 rounded-lg transition-colors cursor-pointer ${
                    isDarkMode
                      ? 'hover:bg-white/[0.05] text-zinc-300'
                      : 'hover:bg-zinc-50 text-zinc-700'
                  }`}
                >
                  <div className="w-8 h-8 rounded-md bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                    <FileText size={16} />
                  </div>
                  <div>
                    <div className="font-semibold text-xs">Standard Operations Notes</div>
                    <div className={`text-[11px] leading-tight mt-0.5 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                      Configure clipboard-ready carrier notes for TMS updates
                    </div>
                  </div>
                </button>
              </NavigationMenuLink>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>

        {/* Fleet & Drivers */}
        <NavigationMenuItem>
          <NavigationMenuTrigger
            className={`h-8 px-2.5 py-1 text-xs font-medium rounded transition-colors bg-transparent border-0 shadow-none cursor-pointer ${
              appState === 'manage'
                ? isDarkMode
                  ? 'bg-white/15 text-white font-semibold'
                  : 'bg-zinc-900 text-white font-semibold'
                : isDarkMode
                ? 'text-zinc-400 hover:text-white hover:bg-white/[0.06] data-[state=open]:bg-white/10 data-[state=open]:text-white'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 data-[state=open]:bg-zinc-100 data-[state=open]:text-zinc-900'
            }`}
          >
            Fleet
          </NavigationMenuTrigger>
          <NavigationMenuContent
            className={`w-72 p-2 rounded-xl shadow-2xl border ${
              isDarkMode
                ? 'bg-[#0c0e17] border-white/10 text-zinc-200'
                : 'bg-white border-zinc-200 text-zinc-800'
            }`}
          >
            <div className="space-y-1">
              <NavigationMenuLink asChild>
                <button
                  type="button"
                  onClick={() => setAppState('manage')}
                  className={`w-full text-left flex items-start gap-3 p-2.5 rounded-lg transition-colors cursor-pointer ${
                    appState === 'manage'
                      ? isDarkMode
                        ? 'bg-white/10 text-white'
                        : 'bg-zinc-100 text-zinc-900 font-medium'
                      : isDarkMode
                      ? 'hover:bg-white/[0.05] text-zinc-300'
                      : 'hover:bg-zinc-50 text-zinc-700'
                  }`}
                >
                  <div className="w-8 h-8 rounded-md bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Users size={16} />
                  </div>
                  <div>
                    <div className="font-semibold text-xs flex items-center gap-1.5">
                      Driver Directory
                      {appState === 'manage' && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 bg-blue-500/20 text-blue-400 rounded">
                          Active
                        </span>
                      )}
                    </div>
                    <div className={`text-[11px] leading-tight mt-0.5 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                      Manage truck assignments, driver names & contact phone numbers
                    </div>
                  </div>
                </button>
              </NavigationMenuLink>

              {onOpenDriverModal && (
                <NavigationMenuLink asChild>
                  <button
                    type="button"
                    onClick={onOpenDriverModal}
                    className={`w-full text-left flex items-start gap-3 p-2.5 rounded-lg transition-colors cursor-pointer ${
                      isDarkMode
                        ? 'hover:bg-white/[0.05] text-zinc-300'
                        : 'hover:bg-zinc-50 text-zinc-700'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-md bg-zinc-500/10 text-zinc-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Hash size={16} />
                    </div>
                    <div>
                      <div className="font-semibold text-xs">Enter Unit / Driver #</div>
                      <div className={`text-[11px] leading-tight mt-0.5 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                        Quick numerical keypad modal to assign a driver to current load
                      </div>
                    </div>
                  </button>
                </NavigationMenuLink>
              )}
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>

        {/* Resources & Setup */}
        <NavigationMenuItem>
          <NavigationMenuTrigger
            className={`h-8 px-2.5 py-1 text-xs font-medium rounded transition-colors bg-transparent border-0 shadow-none cursor-pointer ${
              isDarkMode
                ? 'text-zinc-400 hover:text-white hover:bg-white/[0.06] data-[state=open]:bg-white/10 data-[state=open]:text-white'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 data-[state=open]:bg-zinc-100 data-[state=open]:text-zinc-900'
            }`}
          >
            System
          </NavigationMenuTrigger>
          <NavigationMenuContent
            className={`w-72 p-2 rounded-xl shadow-2xl border ${
              isDarkMode
                ? 'bg-[#0c0e17] border-white/10 text-zinc-200'
                : 'bg-white border-zinc-200 text-zinc-800'
            }`}
          >
            <div className="space-y-1">
              {onOpenTerms && (
                <NavigationMenuLink asChild>
                  <button
                    type="button"
                    onClick={onOpenTerms}
                    className={`w-full text-left flex items-start gap-3 p-2.5 rounded-lg transition-colors cursor-pointer ${
                      isDarkMode
                        ? 'hover:bg-white/[0.05] text-zinc-300'
                        : 'hover:bg-zinc-50 text-zinc-700'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-md bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Shield size={16} />
                    </div>
                    <div>
                      <div className="font-semibold text-xs">Privacy & Operational Terms</div>
                      <div className={`text-[11px] leading-tight mt-0.5 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                        Review 100% local processing commitment & guidelines
                      </div>
                    </div>
                  </button>
                </NavigationMenuLink>
              )}

              {onOpenWelcome && (
                <NavigationMenuLink asChild>
                  <button
                    type="button"
                    onClick={onOpenWelcome}
                    className={`w-full text-left flex items-start gap-3 p-2.5 rounded-lg transition-colors cursor-pointer ${
                      isDarkMode
                        ? 'hover:bg-white/[0.05] text-zinc-300'
                        : 'hover:bg-zinc-50 text-zinc-700'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-md bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                      <HelpCircle size={16} />
                    </div>
                    <div>
                      <div className="font-semibold text-xs">Dakota Product Tour</div>
                      <div className={`text-[11px] leading-tight mt-0.5 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                        Revisit the introductory features and team colorway picker
                      </div>
                    </div>
                  </button>
                </NavigationMenuLink>
              )}

              {onOpenSettings && (
                <NavigationMenuLink asChild>
                  <button
                    type="button"
                    onClick={onOpenSettings}
                    className={`w-full text-left flex items-start gap-3 p-2.5 rounded-lg transition-colors cursor-pointer ${
                      isDarkMode
                        ? 'hover:bg-white/[0.05] text-zinc-300'
                        : 'hover:bg-zinc-50 text-zinc-700'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-md bg-zinc-500/10 text-zinc-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Sliders size={16} />
                    </div>
                    <div>
                      <div className="font-semibold text-xs">Workbench Preferences</div>
                      <div className={`text-[11px] leading-tight mt-0.5 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                        Wallpapers, default formats, and auto-copy toggles
                      </div>
                    </div>
                  </button>
                </NavigationMenuLink>
              )}
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
};
