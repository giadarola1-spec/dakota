import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { AnimatePresence } from 'motion/react';
import { 
  X, 
  Copy, 
  Check, 
  Save, 
  RotateCcw,
  Sparkles,
  Layers,
  Trash2
} from 'lucide-react';
import { ChainToken, CustomChainStyle, DriverInfo } from '../types/chain';
import { renderChainSubject } from '../utils/chainBuilder';
import { ParsedRateCon } from '../utils/parser';

interface ChainEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  theme: any;
  customChains: CustomChainStyle[];
  setCustomChains: (chains: CustomChainStyle[]) => void;
  activeFormatId: string;
  setActiveFormatId: (id: string) => void;
  currentData?: Partial<ParsedRateCon>;
  truckNumber?: string;
  broker?: string;
  team?: string;
  driver?: DriverInfo | null;
  robinsonDisplayMode?: 'space' | 'no-space';
}

interface PaletteItem {
  type: 'variable' | 'keyword' | 'separator';
  value: string;
  label: string;
  category: 'truck_driver' | 'load_broker' | 'location' | 'date_time' | 'keywords' | 'separators';
  tint: string;
}

// Elements ordered according to Alt 1 chain format:
// 1. Color Emoji -> 2. TRUCK# -> 3. Truck -> 4. Route -> 5. Date -> 6. Broker -> 7. LOAD# -> 8. Load
// Followed by alternative keywords and separators
const PALETTE_ITEMS: PaletteItem[] = [
  // 1. Color Emoji
  { type: 'variable', value: '[TEAM_EMOJI]', label: '🟢 Color Emoji', category: 'truck_driver', tint: 'bg-blue-500/15 border-blue-500/35 text-blue-200 hover:border-blue-400 hover:bg-blue-500/25' },
  
  // 2. TRUCK#
  { type: 'keyword', value: 'TRUCK#', label: 'TRUCK#', category: 'keywords', tint: 'bg-indigo-500/15 border-indigo-500/35 text-indigo-200 hover:border-indigo-400 hover:bg-indigo-500/25' },
  
  // 3. Truck Number
  { type: 'variable', value: '[TRUCK_NUM]', label: 'Truck', category: 'truck_driver', tint: 'bg-amber-500/15 border-amber-500/40 text-amber-300 hover:border-amber-400 hover:bg-amber-500/25' },
  
  // 4. Route (Lane)
  { type: 'variable', value: '[LANE]', label: 'Route', category: 'location', tint: 'bg-amber-500/15 border-amber-500/40 text-amber-300 hover:border-amber-400 hover:bg-amber-500/25' },
  
  // 5. Date
  { type: 'variable', value: '[DATE_DOTS]', label: 'Date', category: 'date_time', tint: 'bg-blue-500/15 border-blue-500/35 text-blue-200 hover:border-blue-400 hover:bg-blue-500/25' },
  
  // 6. Broker
  { type: 'variable', value: '[BROKER]', label: 'Broker', category: 'load_broker', tint: 'bg-amber-500/15 border-amber-500/40 text-amber-300 hover:border-amber-400 hover:bg-amber-500/25' },
  
  // 7. LOAD#
  { type: 'keyword', value: 'LOAD#', label: 'LOAD#', category: 'keywords', tint: 'bg-indigo-500/15 border-indigo-500/35 text-indigo-200 hover:border-indigo-400 hover:bg-indigo-500/25' },
  
  // 8. Load Number
  { type: 'variable', value: '[LOAD_NUM]', label: 'Load', category: 'load_broker', tint: 'bg-blue-500/15 border-blue-500/35 text-blue-200 hover:border-blue-400 hover:bg-blue-500/25' },
  
  // Additional Keywords
  { type: 'keyword', value: 'TRUCK', label: 'TRUCK', category: 'keywords', tint: 'bg-indigo-500/15 border-indigo-500/35 text-indigo-200 hover:border-indigo-400 hover:bg-indigo-500/25' },
  { type: 'keyword', value: 'LOAD', label: 'LOAD', category: 'keywords', tint: 'bg-indigo-500/15 border-indigo-500/35 text-indigo-200 hover:border-indigo-400 hover:bg-indigo-500/25' },

  // Separators
  { type: 'separator', value: ' ', label: '␣ Space', category: 'separators', tint: 'bg-zinc-800/60 border-zinc-700/60 text-zinc-300 hover:border-zinc-500 hover:bg-zinc-800' },
  { type: 'separator', value: '-', label: '-', category: 'separators', tint: 'bg-zinc-800/60 border-zinc-700/60 text-zinc-300 hover:border-zinc-500 hover:bg-zinc-800' },
  { type: 'separator', value: ' - ', label: ' - ', category: 'separators', tint: 'bg-zinc-800/60 border-zinc-700/60 text-zinc-300 hover:border-zinc-500 hover:bg-zinc-800' },
  { type: 'separator', value: '#', label: '#', category: 'separators', tint: 'bg-zinc-800/60 border-zinc-700/60 text-zinc-300 hover:border-zinc-500 hover:bg-zinc-800' }
];

export const ChainEditorModal: React.FC<ChainEditorModalProps> = ({
  isOpen,
  onClose,
  customChains,
  setCustomChains,
  setActiveFormatId,
  currentData,
  truckNumber = "1021",
  broker = "TRAFFIX",
  team = "green",
  driver,
  robinsonDisplayMode = 'space'
}) => {
  const [tokens, setTokens] = useState<ChainToken[]>([]);
  const [copiedPreview, setCopiedPreview] = useState<boolean>(false);
  const [isSavedToast, setIsSavedToast] = useState<boolean>(false);
  const [isDragOverDropZone, setIsDragOverDropZone] = useState<boolean>(false);
  const [isDragOverPaletteZone, setIsDragOverPaletteZone] = useState<boolean>(false);
  const [draggedTokenIndex, setDraggedTokenIndex] = useState<number | null>(null);
  const [draggedPaletteItem, setDraggedPaletteItem] = useState<PaletteItem | null>(null);
  const [insertionIndex, setInsertionIndex] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Compute automatic next Alt name: Alt 4, Alt 5, etc.
  const nextAltName = useMemo(() => {
    return `Alt ${customChains.length + 4}`;
  }, [customChains.length]);

  const sampleData: Partial<ParsedRateCon> = useMemo(() => ({
    loadNumber: currentData?.loadNumber || "OR564577",
    pickupDate: currentData?.pickupDate || "08/03/2026",
    originAddress: currentData?.originAddress || "North Haven, CT 06473",
    destinationAddress: currentData?.destinationAddress || "Elizabeth, NJ 07201",
    weight: currentData?.weight || "20,000 LBS",
    rate: currentData?.rate || "700.00",
    pickupTime: currentData?.pickupTime || "14:00",
    deliveryTime: currentData?.deliveryTime || "15:00-19:00"
  }), [currentData]);

  const sampleDriver: DriverInfo = useMemo(() => driver || {
    truck: truckNumber || "1021",
    driverName: "John Doe",
    phoneNumber: "6303200913",
    trailer: "5301",
    companyCode: "OD"
  }, [driver, truckNumber]);

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setTokens([]);
      setIsSavedToast(false);
      setCopiedPreview(false);
      setDraggedTokenIndex(null);
      setDraggedPaletteItem(null);
      setInsertionIndex(null);
      setIsDragOverDropZone(false);
      setIsDragOverPaletteZone(false);
    }
  }, [isOpen]);

  const previewText = useMemo(() => {
    return renderChainSubject(
      tokens,
      sampleData,
      truckNumber,
      broker,
      team,
      sampleDriver,
      robinsonDisplayMode
    );
  }, [tokens, sampleData, truckNumber, broker, team, sampleDriver, robinsonDisplayMode]);

  const handleAddToken = useCallback((tokenTemplate: Omit<ChainToken, 'id'>, targetIndex?: number) => {
    const newToken: ChainToken = {
      ...tokenTemplate,
      id: `t_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
    };
    setTokens(prev => {
      if (typeof targetIndex === 'number' && targetIndex >= 0 && targetIndex <= prev.length) {
        const updated = [...prev];
        updated.splice(targetIndex, 0, newToken);
        return updated;
      }
      return [...prev, newToken];
    });
  }, []);

  const handleRemoveToken = useCallback((idToRemove: string) => {
    setTokens(prev => prev.filter(t => t.id !== idToRemove));
  }, []);

  const handleMoveToken = useCallback((fromIndex: number, targetInsertionIdx: number) => {
    if (fromIndex < 0) return;
    setTokens(prev => {
      if (fromIndex >= prev.length) return prev;
      const updated = [...prev];
      const [item] = updated.splice(fromIndex, 1);
      
      const finalIdx = targetInsertionIdx > fromIndex ? targetInsertionIdx - 1 : targetInsertionIdx;
      const clampedIdx = Math.max(0, Math.min(updated.length, finalIdx));
      
      updated.splice(clampedIdx, 0, item);
      return updated;
    });
  }, []);

  // Single-row horizontal position calculator
  const calculateInsertionIndex = useCallback((clientX: number): number => {
    if (!containerRef.current || tokens.length === 0) return 0;

    const tokenElements = containerRef.current.querySelectorAll<HTMLElement>('[data-token-idx]');
    if (tokenElements.length === 0) return 0;

    for (let i = 0; i < tokenElements.length; i++) {
      const el = tokenElements[i];
      const rect = el.getBoundingClientRect();
      const midpointX = rect.left + rect.width / 2;

      if (clientX < midpointX) {
        return i;
      }
    }

    return tokenElements.length;
  }, [tokens.length]);

  const handleSaveAndApply = useCallback(() => {
    const finalName = nextAltName;
    const newId = `custom_${Date.now()}`;
    
    const newStyle: CustomChainStyle = {
      id: newId,
      name: finalName,
      isPreset: false,
      tokens: tokens,
      createdAt: Date.now()
    };

    setCustomChains([...customChains, newStyle]);
    setActiveFormatId(newId);
    setIsSavedToast(true);
    setTimeout(() => {
      setIsSavedToast(false);
      onClose();
    }, 450);
  }, [nextAltName, customChains, tokens, setCustomChains, setActiveFormatId, onClose]);

  // Drop handler for all drop targets
  const handleProcessDrop = useCallback((targetIdx: number, dataTransfer?: DataTransfer | null) => {
    if (draggedTokenIndex !== null) {
      handleMoveToken(draggedTokenIndex, targetIdx);
    } else if (draggedPaletteItem) {
      handleAddToken({
        type: draggedPaletteItem.type,
        value: draggedPaletteItem.value,
        label: draggedPaletteItem.label,
        category: draggedPaletteItem.category
      }, targetIdx);
    } else if (dataTransfer) {
      const internalTokenDrag = dataTransfer.getData('text/plain');
      const rawPalette = dataTransfer.getData('application/json');

      if (internalTokenDrag && internalTokenDrag.startsWith('token_idx_')) {
        const fromIdx = parseInt(internalTokenDrag.replace('token_idx_', ''), 10);
        if (!isNaN(fromIdx)) {
          handleMoveToken(fromIdx, targetIdx);
        }
      } else if (rawPalette) {
        try {
          const item = JSON.parse(rawPalette) as PaletteItem;
          handleAddToken({
            type: item.type,
            value: item.value,
            label: item.label,
            category: item.category
          }, targetIdx);
        } catch {
          // ignore
        }
      }
    }
    setDraggedTokenIndex(null);
    setDraggedPaletteItem(null);
    setInsertionIndex(null);
    setIsDragOverDropZone(false);
  }, [draggedTokenIndex, draggedPaletteItem, handleMoveToken, handleAddToken]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-6 animate-in fade-in duration-150">
        <div className="w-full max-w-4xl lg:max-w-5xl rounded-3xl border border-blue-900/40 bg-zinc-950/95 text-zinc-100 shadow-[0_10px_40px_rgba(0,0,0,0.8)] flex flex-col max-h-[90vh] overflow-hidden">
          
          {/* Header */}
          <div className="px-6 py-4 border-b border-blue-900/30 flex items-center justify-between bg-blue-950/20">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
                <Layers size={14} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white tracking-wide">New Chain Format</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-blue-950/70 border border-blue-500/40 text-blue-300">
                    {nextAltName}
                  </span>
                </div>
                <p className="text-[11px] text-blue-300/50">Custom formats are automatically named {nextAltName}</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-blue-300/60 hover:text-white hover:bg-blue-900/30 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-5 sm:p-7 space-y-6">

            {/* 1. TOP BUILDER DROPZONE (ALWAYS SINGLE ROW) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-semibold tracking-wider text-blue-300/70 uppercase">
                  Chain Track (Drag & drop anywhere along the track)
                </span>
                {tokens.length > 0 && (
                  <button
                    onClick={() => setTokens([])}
                    className="text-[11px] text-blue-400/70 hover:text-red-400 transition-colors flex items-center gap-1 font-medium cursor-pointer"
                  >
                    <RotateCcw size={11} /> Clear All
                  </button>
                )}
              </div>

              {/* Single Horizontal Row Drop Area with custom sleek scrollbar */}
              <div
                ref={containerRef}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'copy';
                  if (!isDragOverDropZone) setIsDragOverDropZone(true);
                  const nearest = calculateInsertionIndex(e.clientX);
                  setInsertionIndex(nearest);
                }}
                onDragEnter={(e) => {
                  e.preventDefault();
                  setIsDragOverDropZone(true);
                }}
                onDragLeave={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                    setIsDragOverDropZone(false);
                    setInsertionIndex(null);
                  }
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragOverDropZone(false);
                  const nearest = insertionIndex !== null ? insertionIndex : calculateInsertionIndex(e.clientX);
                  handleProcessDrop(nearest, e.dataTransfer);
                }}
                className={`min-h-[88px] p-3.5 pb-4 rounded-2xl border transition-all flex flex-nowrap items-center overflow-x-auto whitespace-nowrap chain-track-scrollbar ${
                  isDragOverDropZone
                    ? 'border-blue-400 bg-blue-950/40 shadow-[0_0_20px_rgba(59,130,246,0.25)]'
                    : 'border-dashed border-blue-900/40 bg-blue-950/15'
                }`}
              >
                {tokens.length === 0 ? (
                  <div className="w-full py-5 text-center text-xs text-blue-300/40 font-medium select-none pointer-events-none">
                    Drag bubbles from below or click them to build your custom chain format.
                  </div>
                ) : (
                  <>
                    {/* First insertion slot (Index 0) */}
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        e.dataTransfer.dropEffect = 'copy';
                        setInsertionIndex(0);
                      }}
                      onDragEnter={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setInsertionIndex(0);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleProcessDrop(0, e.dataTransfer);
                      }}
                      className="flex-shrink-0 relative flex items-center justify-center w-2 h-9 cursor-pointer select-none"
                    >
                      {insertionIndex === 0 && (
                        <div className="w-1.5 h-7 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,1)] animate-pulse" />
                      )}
                    </div>

                    {tokens.map((token, index) => {
                      const isYellowVar = ['[TRUCK_NUM]', '[LANE]', '[BROKER]', 'Truck', 'Route', 'Broker'].includes(token.value) || ['Truck', 'Route', 'Broker'].includes(token.label);
                      const isBeingDragged = draggedTokenIndex === index;
                      const isTargetRight = insertionIndex === index + 1;

                      return (
                        <React.Fragment key={token.id}>
                          {/* Token Bubble */}
                          <div
                            data-token-idx={index}
                            draggable={true}
                            onDragStart={(e) => {
                              setDraggedTokenIndex(index);
                              e.dataTransfer.setData('text/plain', `token_idx_${index}`);
                              e.dataTransfer.effectAllowed = 'move';
                            }}
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              e.dataTransfer.dropEffect = 'copy';
                              
                              const rect = e.currentTarget.getBoundingClientRect();
                              const midpoint = rect.left + rect.width / 2;
                              if (e.clientX < midpoint) {
                                setInsertionIndex(index);
                              } else {
                                setInsertionIndex(index + 1);
                              }
                            }}
                            onDragEnd={() => {
                              setDraggedTokenIndex(null);
                              setInsertionIndex(null);
                              setIsDragOverDropZone(false);
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const targetIdx = insertionIndex !== null ? insertionIndex : index;
                              handleProcessDrop(targetIdx, e.dataTransfer);
                            }}
                            className={`flex-shrink-0 group relative cursor-grab active:cursor-grabbing select-none rounded-full px-3.5 py-1.5 inline-flex items-center gap-2 text-xs font-semibold shadow-sm transition-colors border ${
                              isBeingDragged ? 'opacity-30 border-dashed border-blue-400' : 'opacity-100'
                            } ${
                              isYellowVar
                                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 hover:border-amber-400'
                                : token.type === 'separator'
                                  ? 'bg-zinc-800/70 border-zinc-700/70 text-zinc-200 hover:border-zinc-500'
                                  : token.type === 'keyword'
                                    ? 'bg-indigo-500/15 border-indigo-500/35 text-indigo-200 hover:border-indigo-400'
                                    : 'bg-blue-500/15 border-blue-500/35 text-blue-200 hover:border-blue-400'
                            }`}
                          >
                            <span className="font-mono tracking-tight pointer-events-none">{token.label}</span>
                            
                            {/* Remove button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveToken(token.id);
                              }}
                              className={`p-0.5 rounded-full transition-colors cursor-pointer ${
                                isYellowVar 
                                  ? 'text-amber-400/70 hover:text-red-300 hover:bg-red-500/20' 
                                  : 'text-zinc-400 hover:text-red-300 hover:bg-red-500/20'
                              }`}
                              title="Remove item"
                            >
                              <X size={12} />
                            </button>
                          </div>

                          {/* Insertion Slot between tokens */}
                          <div
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              e.dataTransfer.dropEffect = 'copy';
                              setInsertionIndex(index + 1);
                            }}
                            onDragEnter={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setInsertionIndex(index + 1);
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleProcessDrop(index + 1, e.dataTransfer);
                            }}
                            className="flex-shrink-0 relative flex items-center justify-center w-2 h-9 cursor-pointer select-none"
                          >
                            {isTargetRight && (
                              <div className="w-1.5 h-7 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,1)] animate-pulse" />
                            )}
                          </div>
                        </React.Fragment>
                      );
                    })}
                  </>
                )}
              </div>
            </div>

            {/* 2. BOTTOM LIQUID BUBBLES (Also serves as drop target to remove tokens) */}
            <div 
              onDragOver={(e) => {
                if (draggedTokenIndex !== null) {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  if (!isDragOverPaletteZone) setIsDragOverPaletteZone(true);
                }
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  setIsDragOverPaletteZone(false);
                }
              }}
              onDrop={(e) => {
                if (draggedTokenIndex !== null && tokens[draggedTokenIndex]) {
                  e.preventDefault();
                  handleRemoveToken(tokens[draggedTokenIndex].id);
                  setDraggedTokenIndex(null);
                  setInsertionIndex(null);
                  setIsDragOverPaletteZone(false);
                }
              }}
              className={`space-y-2 p-2.5 rounded-2xl transition-all ${
                isDragOverPaletteZone ? 'bg-red-950/20 border border-red-500/30' : ''
              }`}
            >
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-semibold tracking-wider text-blue-300/70 uppercase">
                  Elements
                </span>
                {isDragOverPaletteZone && (
                  <span className="text-[11px] text-red-400 font-semibold flex items-center gap-1">
                    <Trash2 size={12} /> Drop here to remove
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {PALETTE_ITEMS.map((item, idx) => (
                  <div
                    key={idx}
                    draggable={true}
                    onDragStart={(e) => {
                      setDraggedPaletteItem(item);
                      e.dataTransfer.setData('application/json', JSON.stringify(item));
                      e.dataTransfer.setData('text/plain', `palette_${item.value}`);
                      e.dataTransfer.effectAllowed = 'copy';
                    }}
                    onDragEnd={() => {
                      setDraggedPaletteItem(null);
                      setInsertionIndex(null);
                      setIsDragOverDropZone(false);
                    }}
                    onClick={() => handleAddToken({
                      type: item.type,
                      value: item.value,
                      label: item.label,
                      category: item.category
                    })}
                    className={`cursor-grab active:cursor-grabbing select-none rounded-full px-3.5 py-1.5 text-xs font-semibold border shadow-sm transition-all duration-150 active:scale-95 ${item.tint}`}
                  >
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. PREVIEW AT BOTTOM */}
            <div className="p-3.5 rounded-2xl border border-blue-900/30 bg-blue-950/20 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-300/70 flex items-center gap-1.5">
                  <Sparkles size={12} className="text-blue-400" />
                  Live Preview
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(previewText);
                    setCopiedPreview(true);
                    setTimeout(() => setCopiedPreview(false), 1500);
                  }}
                  className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold border border-blue-500/30 bg-blue-950/40 hover:bg-blue-900/50 text-blue-200 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  {copiedPreview ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                  {copiedPreview ? "Copied" : "Copy"}
                </button>
              </div>
              <div className="p-2.5 rounded-xl font-mono text-xs sm:text-sm font-semibold border border-blue-900/40 bg-black/50 text-blue-100 select-all break-all">
                {previewText || <span className="text-blue-300/30 italic">Chain is currently empty...</span>}
              </div>
            </div>

          </div>

          {/* Footer Actions */}
          <div className="px-5 py-3 border-t border-blue-900/30 flex items-center justify-between bg-blue-950/20">
            <div>
              {isSavedToast && (
                <span className="text-xs text-emerald-400 font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1">
                  <Check size={12} /> Saved as {nextAltName}!
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-4 py-1.5 rounded-full border border-blue-900/50 bg-blue-950/30 hover:bg-blue-900/40 text-blue-200 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                onClick={handleSaveAndApply}
                disabled={tokens.length === 0}
                className="px-4 py-1.5 rounded-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Save size={13} /> Save {nextAltName}
              </button>
            </div>
          </div>
        </div>
      </div>
    </AnimatePresence>
  );
};
