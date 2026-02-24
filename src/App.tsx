import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, FileText, Copy, Check, RefreshCw, ChevronRight, ChevronLeft, Eye, Edit2, Menu, X, Sun, Moon, Shield, HelpCircle, Info, AlertTriangle, MapPin, ZoomIn, ZoomOut, Maximize, Hand, MousePointer, Sliders } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import 'pdfjs-dist/build/pdf.worker.mjs';

// Set worker source
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

import { parseRateConfirmation, ParsedRateCon } from './utils/parser';
import { DottedMapBackground } from './components/DottedMapBackground';

// --- Types ---

type VerificationStep = {
  key: keyof ParsedRateCon;
  label: string;
  description: string;
};

const STEPS: VerificationStep[] = [
  { key: 'loadNumber', label: 'Load Number', description: 'Confirm the Load Reference Number' },
  { key: 'weight', label: 'Weight', description: 'Confirm the total weight' },
  { key: 'pickupTime', label: 'Pickup Time', description: 'Check the scheduled pickup time' },
  { key: 'deliveryTime', label: 'Delivery Time', description: 'Check the scheduled delivery time' },
  { key: 'rate', label: 'Rate', description: 'Confirm the total rate amount' },
  { key: 'originAddress', label: 'Origin', description: 'Verify the pickup location' },
  { key: 'destinationAddress', label: 'Destination', description: 'Verify the delivery location' },
];

// --- Helper Functions ---

const formatAddress = (fullAddress: string, simplified: boolean) => {
  if (!simplified || !fullAddress) return fullAddress;

  const extractCity = (partBefore: string, state: string, zip: string) => {
    // Strategy 1: If there's a comma, assume City is after the last comma
    if (partBefore.includes(',')) {
      const parts = partBefore.split(',');
      const city = parts[parts.length - 1].trim();
      // Ensure the city part isn't empty or just a number (suite number?)
      if (city && isNaN(Number(city))) {
        return `${city.toUpperCase()}, ${state.toUpperCase()} ${zip}`;
      }
    }

    // Strategy 2: Try to split by common street suffixes
    const suffixes = ["AVE", "RD", "ST", "DR", "BLVD", "LN", "CT", "PL", "WAY", "CIR", "PKWY", "HWY", "TER", "TRL", "LOOP", "PIKE", "SQUARE", "SQ", "PARKWAY", "ROAD", "STREET", "DRIVE", "AVENUE", "LANE", "COURT", "PLACE"];
    // Allow for optional dot, optional comma, and whitespace
    const regex = new RegExp(`\\b(?:${suffixes.join("|")})\\.?\\s*,?\\s+(.*)$`, "i");
    
    const match = partBefore.match(regex);
    if (match && match[1].trim().length > 0) {
      return `${match[1].trim().toUpperCase()}, ${state.toUpperCase()} ${zip}`;
    }
    
    return `${partBefore.toUpperCase()}, ${state.toUpperCase()} ${zip}`;
  };

  // 1. Find State and Zip at the end
  const stateZipMatch = fullAddress.match(/,\s*([A-Z]{2})\s*(\d{5}(?:-\d{4})?)$/i);
  if (!stateZipMatch) {
     // Try without comma before state
     const stateZipMatchNoComma = fullAddress.match(/\s+([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/i);
     if (!stateZipMatchNoComma) return fullAddress;
     
     const [_, state, zip] = stateZipMatchNoComma;
     const partBefore = fullAddress.substring(0, stateZipMatchNoComma.index).trim();
     
     return extractCity(partBefore, state, zip);
  }

  const [_, state, zip] = stateZipMatch;
  const partBefore = fullAddress.substring(0, stateZipMatch.index).trim();
  
  return extractCity(partBefore, state, zip);
};

// --- Components ---

const PdfViewer = ({ pdfDocument, highlightText, isDarkMode, isAutoZoomEnabled, dragSensitivity }: { pdfDocument: any, highlightText: string, isDarkMode: boolean, isAutoZoomEnabled: boolean, dragSensitivity: number }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const highlightLayerRef = useRef<HTMLDivElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [pageData, setPageData] = useState<{ page: any, viewport: any } | null>(null);
  
  // Zoom & Pan State
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [startPosition, setStartPosition] = useState({ x: 0, y: 0 });
  const [tool, setTool] = useState<'cursor' | 'hand'>('hand');

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // 1. Render Base PDF
  useEffect(() => {
    let renderTask: any = null;
    let isCancelled = false;

    const renderPage = async () => {
      if (!pdfDocument || !canvasRef.current || !viewportRef.current) return;

      try {
        setTotalPages(pdfDocument.numPages);
        const page = await pdfDocument.getPage(currentPage);
        
        if (isCancelled) return;

        const containerWidth = viewportRef.current.clientWidth - 64; // Subtract padding
        const unscaledViewport = page.getViewport({ scale: 1 });
        const baseScale = containerWidth / unscaledViewport.width;
        
        const outputScale = window.devicePixelRatio || 1;
        const renderScale = baseScale * Math.max(2, outputScale); 
        
        const viewport = page.getViewport({ scale: baseScale });
        const renderViewport = page.getViewport({ scale: renderScale });

        if (!isCancelled) {
          setPageData({ page, viewport });
        }

        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) return;

        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;
        canvas.height = renderViewport.height;
        canvas.width = renderViewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: renderViewport,
        };
        
        renderTask = page.render(renderContext);
        await renderTask.promise;

        // Render Text Layer
        if (textLayerRef.current) {
          textLayerRef.current.innerHTML = '';
          textLayerRef.current.style.width = `${viewport.width}px`;
          textLayerRef.current.style.height = `${viewport.height}px`;
          
          const textContent = await page.getTextContent();
          
          // Simple manual text layer rendering
          textContent.items.forEach((item: any) => {
            const tx = pdfjsLib.Util.transform(
              viewport.transform,
              item.transform
            );
            
            // Calculate font size (height)
            const fontHeight = Math.sqrt((tx[2] * tx[2]) + (tx[3] * tx[3]));
            
            if (fontHeight < 4) return; // Skip tiny text

            const span = document.createElement('span');
            span.textContent = item.str;
            span.style.left = `${tx[4]}px`;
            span.style.top = `${tx[5] - fontHeight}px`;
            span.style.fontSize = `${fontHeight}px`;
            span.style.fontFamily = item.fontName || 'sans-serif';
            
            // Approximate width scaling if needed, but simple positioning is often enough for selection
            // span.style.transform = `scaleX(${item.width / item.transform[0]})`; 
            
            textLayerRef.current?.appendChild(span);
          });
        }

      } catch (error: any) {
        if (error.name !== 'RenderingCancelledException') {
          console.error('PDF Render Error:', error);
        }
      }
    };

    renderPage();

    return () => {
      isCancelled = true;
      if (renderTask) {
        renderTask.cancel();
      }
    };
  }, [pdfDocument, currentPage]);

  // 2. Search all pages for highlight text and jump to page
  useEffect(() => {
    const findPageWithText = async () => {
      if (!pdfDocument || !highlightText || highlightText.length < 2) return;

      let cleanHighlight = highlightText.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (cleanHighlight.endsWith('lbs')) {
        cleanHighlight = cleanHighlight.replace(/lbs$/, '');
      }
      const timeWithTzMatch = cleanHighlight.match(/^(\d{4})(est|cst|mst|pst|edt|cdt|mdt|pdt|ast|hst|akst|akdt|utc|gmt)$/);
      if (timeWithTzMatch) {
        cleanHighlight = timeWithTzMatch[1];
      }
      
      // Check current page first
      if (pageData) {
        const textContent = await pageData.page.getTextContent();
        const hasMatch = textContent.items.some((item: any) => 
          item.str.toLowerCase().replace(/[^a-z0-9]/g, '').includes(cleanHighlight)
        );
        if (hasMatch) return; // Already on the right page
      }

      // Search other pages
      for (let i = 1; i <= pdfDocument.numPages; i++) {
        if (i === currentPage) continue;
        const page = await pdfDocument.getPage(i);
        const textContent = await page.getTextContent();
        const hasMatch = textContent.items.some((item: any) => 
          item.str.toLowerCase().replace(/[^a-z0-9]/g, '').includes(cleanHighlight)
        );
        if (hasMatch) {
          setCurrentPage(i);
          return;
        }
      }
    };

    findPageWithText();
  }, [pdfDocument, highlightText]);

  // 3. Render Highlights & Auto Zoom
  useEffect(() => {
    const drawHighlights = async () => {
      if (!highlightLayerRef.current || !pageData) return;
      
      const { page, viewport } = pageData;
      
      // Clear previous highlights
      highlightLayerRef.current.innerHTML = '';

      // Reset zoom if disabled or no text
      if (!isAutoZoomEnabled || !highlightText || highlightText.length < 2) {
        if (isAutoZoomEnabled) {
             setScale(1);
             setPosition({ x: 0, y: 0 });
        }
        if (!highlightText || highlightText.length < 2) return;
      }

      try {
        const textContent = await page.getTextContent();
        let cleanHighlight = highlightText.toLowerCase().replace(/[^a-z0-9]/g, '');
        
        // If it ends with 'lbs', try searching without it as well
        if (cleanHighlight.endsWith('lbs')) {
          cleanHighlight = cleanHighlight.replace(/lbs$/, '');
        }
        
        // If it's a time with a timezone (e.g. 0440est), strip the timezone
        const timeWithTzMatch = cleanHighlight.match(/^(\d{4})(est|cst|mst|pst|edt|cdt|mdt|pdt|ast|hst|akst|akdt|utc|gmt)$/);
        if (timeWithTzMatch) {
          cleanHighlight = timeWithTzMatch[1];
        }

        let firstMatchRect: number[] | null = null;

        textContent.items.forEach((item: any) => {
          const itemStr = item.str.toLowerCase().replace(/[^a-z0-9]/g, '');
          
          if (itemStr.length > 0 && itemStr.includes(cleanHighlight)) {
            // item.transform is [scaleX, skewY, skewX, scaleY, x, y]
            const pdfX = item.transform[4];
            const pdfY = item.transform[5];
            const pdfHeight = Math.sqrt(item.transform[2] * item.transform[2] + item.transform[3] * item.transform[3]);
            const pdfWidth = item.width;

            const rect = viewport.convertToViewportRectangle([
              pdfX,
              pdfY, 
              pdfX + pdfWidth,
              pdfY + pdfHeight
            ]);

            // rect is [x1, y1, x2, y2] in canvas coordinates
            const x = Math.min(rect[0], rect[2]);
            const y = Math.min(rect[1], rect[3]);
            const w = Math.abs(rect[0] - rect[2]);
            const h = Math.abs(rect[1] - rect[3]);

            if (!firstMatchRect) {
              firstMatchRect = [x, y, w, h];
            }

            const div = document.createElement('div');
            div.style.position = 'absolute';
            div.style.left = `${x}px`;
            div.style.top = `${y}px`;
            div.style.width = `${w}px`;
            div.style.height = `${h}px`;
            div.style.backgroundColor = 'rgba(255, 255, 0, 0.3)';
            div.style.border = '1px solid rgba(255, 200, 0, 0.8)';
            div.style.borderRadius = '2px';
            div.style.pointerEvents = 'none';
            div.style.boxSizing = 'border-box';
            
            highlightLayerRef.current?.appendChild(div);
          }
        });

        // Apply Auto Zoom to first match
        if (isAutoZoomEnabled && firstMatchRect && viewportRef.current) {
          const [x, y, w, h] = firstMatchRect;
          const centerX = x + w / 2;
          const centerY = y + h / 2;
          
          const containerW = viewportRef.current.clientWidth;
          const containerH = viewportRef.current.clientHeight || 600;
          
          const newScale = 2.0; // 2x Zoom
          const translateX = containerW / 2 - centerX * newScale;
          const translateY = containerH / 2 - centerY * newScale;

          setScale(newScale);
          setPosition({ x: translateX, y: translateY });
        }

      } catch (err) {
        console.error("Highlight error:", err);
      }
    };

    drawHighlights();
  }, [highlightText, pageData, isAutoZoomEnabled]);

  // Handlers for Manual Controls
  const handleZoomIn = () => setScale(s => Math.min(s + 0.5, 5));
  const handleZoomOut = () => setScale(s => Math.max(s - 0.5, 0.5));
  const handleFitPage = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (tool === 'hand') {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      setStartPosition({ x: position.x, y: position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && tool === 'hand') {
      const deltaX = (e.clientX - dragStart.x) * dragSensitivity;
      const deltaY = (e.clientY - dragStart.y) * dragSensitivity;
      
      setPosition({
        x: startPosition.x + deltaX,
        y: startPosition.y + deltaY
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  return (
    <div className={`w-full ${isAutoZoomEnabled ? 'h-full' : 'h-auto'} overflow-hidden rounded-lg shadow-lg border relative ${isDarkMode ? 'border-white/10 bg-slate-900' : 'border-slate-200 bg-slate-100'} flex flex-col`}>
      {/* Page Navigation */}
      {totalPages > 1 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-white text-xs font-medium">
          <button 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="hover:text-indigo-400 disabled:opacity-30 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="min-w-[60px] text-center">Page {currentPage} of {totalPages}</span>
          <button 
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="hover:text-indigo-400 disabled:opacity-30 transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Manual Controls Toolbar */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-1.5 rounded-full border border-white/10 text-white shadow-xl">
         <button 
            onClick={() => setTool('cursor')}
            className={`p-1.5 rounded-md transition-colors ${tool === 'cursor' ? 'bg-white/20 text-white' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
            title="Select Mode"
          >
            <MousePointer size={16} />
          </button>
          <button 
            onClick={() => setTool('hand')}
            className={`p-1.5 rounded-md transition-colors ${tool === 'hand' ? 'bg-white/20 text-white' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
            title="Pan Mode"
          >
            <Hand size={16} />
          </button>
          <div className="w-px h-4 bg-white/20 mx-1" />
          <button 
            onClick={handleZoomOut}
            className="p-1.5 rounded-md text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut size={16} />
          </button>
          <span className="text-xs font-mono min-w-[3ch] text-center">{Math.round(scale * 100)}%</span>
          <button 
            onClick={handleZoomIn}
            className="p-1.5 rounded-md text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            title="Zoom In"
          >
            <ZoomIn size={16} />
          </button>
          <div className="w-px h-4 bg-white/20 mx-1" />
          <button 
            onClick={handleFitPage}
            className="p-1.5 rounded-md text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            title="Fit to Page"
          >
            <Maximize size={16} />
          </button>
      </div>

      <div 
        ref={viewportRef}
        className={`flex-1 overflow-hidden p-4 md:p-8 flex justify-center items-start relative ${tool === 'hand' ? 'cursor-grab active:cursor-grabbing' : ''}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        <div 
          ref={contentRef}
          className="relative shadow-2xl transition-transform duration-100 ease-out origin-top-left"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`
          }}
        >
          <canvas ref={canvasRef} className="rounded-sm" />
          <div 
            ref={textLayerRef} 
            className="textLayer"
            style={{ pointerEvents: tool === 'cursor' ? 'auto' : 'none' }}
          />
          <div 
            ref={highlightLayerRef} 
            className="absolute inset-0 pointer-events-none"
          />
        </div>
      </div>
    </div>
  );
};

// --- Hooks ---

function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.warn(`Error writing localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue] as const;
}

export default function App() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  
  // App State: 'upload' | 'verify' | 'results'
  const [appState, setAppState] = useState<'upload' | 'verify' | 'results'>('upload');
  
  // Data State
  const [extractedData, setExtractedData] = useState<ParsedRateCon | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  
  // Output States
  const [routeText, setRouteText] = useState("");
  const [notesText, setNotesText] = useState("");
  const [copiedRoute, setCopiedRoute] = useState(false);
  const [copiedNotes, setCopiedNotes] = useState(false);

  // Chain State
  const [truckNumber, setTruckNumber] = useState("TRUCK#");
  const [savedTrucks, setSavedTrucks] = useLocalStorage<string[]>("dakota_savedTrucks", ["101", "102", "103"]);
  const [broker, setBroker] = useLocalStorage("dakota_broker", "TRAFFIX");
  const [chainText, setChainText] = useState("");
  const [copiedChain, setCopiedChain] = useState(false);
  const [renameText, setRenameText] = useState("");
  const [copiedRename, setCopiedRename] = useState(false);
  const [team, setTeam] = useLocalStorage<'green' | 'purple' | 'red' | 'blue' | 'none'>("dakota_team", 'none');

  // Settings State
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useLocalStorage("dakota_isDarkMode", true);
  const [isAutoZoomEnabled, setIsAutoZoomEnabled] = useLocalStorage("dakota_isAutoZoomEnabled", true);
  const [isSimplifiedAddress, setIsSimplifiedAddress] = useLocalStorage("dakota_isSimplifiedAddress", false);
  const [dragSensitivity, setDragSensitivity] = useLocalStorage("dakota_dragSensitivity", 1.5);

  // --- Styles Helper ---
  const theme = {
    bg: isDarkMode ? 'bg-[#0B1121]' : 'bg-slate-50',
    text: isDarkMode ? 'text-white' : 'text-slate-900',
    textMuted: isDarkMode ? 'text-slate-400' : 'text-slate-500',
    border: isDarkMode ? 'border-white/10' : 'border-slate-200',
    cardBg: isDarkMode ? 'bg-slate-900' : 'bg-white',
    cardHover: isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-50',
    inputBg: isDarkMode ? 'bg-slate-950' : 'bg-slate-100',
    headerBg: isDarkMode ? 'bg-[#0B1121]/80' : 'bg-white/80',
    accent: 'text-indigo-500',
    accentBg: 'bg-indigo-600',
    accentHover: 'hover:bg-indigo-500',
  };

  const processFile = async (uploadedFile: File) => {
    if (!uploadedFile) return;
    
    setFileName(uploadedFile.name);
    setIsProcessing(true);

    try {
      const arrayBuffer = await uploadedFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      setPdfDoc(pdf);

      let fullText = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(" ");
        fullText += pageText + "\n";
      }

      const data = parseRateConfirmation(fullText);
      setExtractedData(data);
      
      setAppState('verify');
      setCurrentStepIndex(0);

    } catch (error) {
      console.error("PDF Error:", error);
      alert("Error reading PDF. Please try another file.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (uploadedFile) processFile(uploadedFile);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleNextStep = () => {
    if (currentStepIndex < STEPS.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      finishVerification();
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    } else {
      setAppState('upload');
    }
  };

  const handleDataChange = (val: string) => {
    if (!extractedData) return;
    const key = STEPS[currentStepIndex].key;
    setExtractedData({ ...extractedData, [key]: val });
  };

  const finishVerification = (data: ParsedRateCon | null = extractedData) => {
    if (!data) return;
    
    // Format Outputs
    const route = `${formatAddress(data.originAddress || "Origin Not Found", isSimplifiedAddress)}\n${formatAddress(data.destinationAddress || "Dest Not Found", isSimplifiedAddress)}`.toUpperCase();
    setRouteText(route);

    const chain = generateChainString(data, truckNumber, broker, team);
    setChainText(chain);

    const rename = generateRenameString(data, truckNumber);
    setRenameText(rename);

    const notes = `W${data.weight || "?"}
PU ${data.pickupTime || "?"}
DEL ${data.deliveryTime || "?"}
${chain}`;
    setNotesText(notes);

    setAppState('results');
  };

  const generateChainString = (data: ParsedRateCon, tNum: string, brk: string, tm: string) => {
    // Logic: [EMOJI] [TRUCK#]-[LANE]-[DATE] [BROKER] [LOAD#]
    
    // Team Emoji
    const emojis: Record<string, string> = {
      green: "🟢",
      purple: "🟣",
      red: "🔴",
      blue: "🔵",
      none: ""
    };
    const emoji = emojis[tm] || "";

    // Lane: Origin State - Dest State
    const getRegion = (addr: string) => {
      const match = addr.match(/,\s*([A-Z]{2})/);
      return match ? match[1] : "??";
    };

    const originState = getRegion(data.originAddress);
    const destState = getRegion(data.destinationAddress);
    const lane = `${originState}-${destState}`;

    // Date: MM.DD.YYYY
    const date = data.pickupDate ? data.pickupDate.replace(/[\/-]/g, '.') : "MM.DD.YYYY";

    // Load Number
    let loadNum = data.loadNumber;
    if (brk.toUpperCase() === 'TRAFFIX' && !loadNum.startsWith('T')) {
      loadNum = `T${loadNum}`;
    }

    const chain = `${emoji ? emoji + " " : ""}${tNum}-${lane}-${date} ${brk} LOAD ${loadNum}`;
    return chain;
  };

  const generateRenameString = (data: ParsedRateCon, tNum: string) => {
    // Logic: TRUCK#-ORIGIN_STATE-DEST_STATE-DATE-C
    
    const getRegion = (addr: string) => {
      const match = addr.match(/,\s*([A-Z]{2})/);
      return match ? match[1] : "??";
    };

    const originState = getRegion(data.originAddress);
    const destState = getRegion(data.destinationAddress);
    
    // Date: MM.DD.YYYY
    const date = data.pickupDate ? data.pickupDate.replace(/[\/-]/g, '.') : "MM.DD.YYYY";

    return `${tNum}-${originState}-${destState}-${date}-C`;
  };

  // Update chain and notes when dependencies change (if in results view)
  useEffect(() => {
    if (appState === 'results' && extractedData) {
      const chain = generateChainString(extractedData, truckNumber, broker, team);
      setChainText(chain);
      
      const rename = generateRenameString(extractedData, truckNumber);
      setRenameText(rename);
      
      // Update notes with new chain (replace last line)
      setNotesText(prev => {
        return `W${extractedData.weight || "?"}
PU ${extractedData.pickupTime || "?"}
DEL ${extractedData.deliveryTime || "?"}
${chain}`;
      });
    }
  }, [truckNumber, broker, extractedData, team]);

  // Update route text when simplified address setting changes
  useEffect(() => {
    if (appState === 'results' && extractedData) {
      const route = `${formatAddress(extractedData.originAddress || "Origin Not Found", isSimplifiedAddress)}\n${formatAddress(extractedData.destinationAddress || "Dest Not Found", isSimplifiedAddress)}`.toUpperCase();
      setRouteText(route);
    }
  }, [isSimplifiedAddress, extractedData, appState]);

  const copyToClipboard = (text: string, setCopied: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const addSavedTruck = () => {
    if (truckNumber && !savedTrucks.includes(truckNumber) && truckNumber !== "TRUCK#") {
      setSavedTrucks([...savedTrucks, truckNumber]);
    }
  };

  const removeSavedTruck = (t: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedTrucks(savedTrucks.filter(truck => truck !== t));
  };

  // --- Render Helpers ---

  const renderVerification = () => {
    if (!extractedData) return null;
    const step = STEPS[currentStepIndex];
    const value = extractedData[step.key];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:h-[calc(100vh-140px)]">
        {/* Left: PDF View */}
        <div className={`h-[400px] md:h-full ${isAutoZoomEnabled ? 'overflow-hidden' : 'overflow-y-auto'} pr-2 custom-scrollbar relative`}>
          <PdfViewer pdfDocument={pdfDoc} highlightText={value} isDarkMode={isDarkMode} isAutoZoomEnabled={isAutoZoomEnabled} dragSensitivity={dragSensitivity} />
          
          {/* Zoom Toggle */}
          <button 
            onClick={() => setIsAutoZoomEnabled(!isAutoZoomEnabled)}
            className={`absolute bottom-4 right-4 p-2 rounded-lg shadow-lg backdrop-blur-md border transition-all ${isAutoZoomEnabled ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-white/10 text-slate-400 border-white/10 hover:bg-white/20'}`}
            title={isAutoZoomEnabled ? "Disable Auto Zoom" : "Enable Auto Zoom"}
          >
            <RefreshCw size={20} className={isAutoZoomEnabled ? "" : "opacity-50"} />
          </button>
        </div>

        {/* Right: Verification Controls */}
        <div className="flex flex-col justify-center space-y-8 pb-8 md:pb-0">
          <motion.div 
            key={step.key}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className={`${theme.cardBg} border ${theme.border} p-8 rounded-3xl shadow-2xl relative overflow-hidden`}
          >
            {/* Background Glow */}
            {isDarkMode && <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />}

            <div className="relative z-10 space-y-6">
              <div className="flex items-center justify-between">
                <span className={`text-xs font-medium ${isDarkMode ? 'text-indigo-400 border-indigo-500/30' : 'text-indigo-600 border-indigo-200'} uppercase tracking-widest border px-3 py-1 rounded-full`}>
                  Step {currentStepIndex + 1} of {STEPS.length}
                </span>
                <span className={`${theme.textMuted} text-xs`}>Human Supervision Required</span>
              </div>

              <div>
                <h2 className={`text-3xl font-display font-medium ${theme.text} mb-2`}>{step.label}</h2>
                <p className={`${theme.textMuted} font-light`}>{step.description}</p>
              </div>

              <div className="space-y-2">
                <label className={`text-xs ${theme.textMuted} uppercase tracking-wider font-medium`}>Extracted Value</label>
                <div className="relative group">
                  <input 
                    type="text" 
                    value={value}
                    onChange={(e) => handleDataChange(e.target.value)}
                    className={`w-full ${theme.inputBg} border ${theme.border} rounded-xl px-4 py-4 text-xl ${theme.text} font-mono focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all`}
                  />
                  <Edit2 className={`absolute right-4 top-1/2 -translate-y-1/2 ${theme.textMuted} w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity`} />
                </div>
              </div>

              <div className="pt-6 flex items-center gap-4">
                <button 
                  onClick={handlePrevStep}
                  className={`px-6 py-3 rounded-xl border ${theme.border} ${theme.textMuted} hover:${theme.cardBg} hover:${theme.text} transition-colors flex items-center gap-2`}
                >
                  <ChevronLeft size={18} />
                  Back
                </button>
                <button 
                  onClick={handleNextStep}
                  className={`flex-1 px-6 py-3 rounded-xl ${theme.accentBg} ${theme.accentHover} text-white font-medium shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 group`}
                >
                  {currentStepIndex === STEPS.length - 1 ? 'Finish & Generate' : 'Confirm & Next'}
                  <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </motion.div>

          {/* Progress Indicators */}
          <div className="flex justify-center gap-2">
            {STEPS.map((_, idx) => (
              <div 
                key={idx} 
                className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentStepIndex ? 'w-8 bg-indigo-500' : idx < currentStepIndex ? 'w-2 bg-emerald-500' : `w-2 ${isDarkMode ? 'bg-slate-700' : 'bg-slate-300'}`}`}
              />
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderResults = () => (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h2 className={`text-2xl font-display font-medium ${theme.text}`}>Generated Output</h2>
        <button 
          onClick={() => setAppState('upload')}
          className={`text-sm ${theme.textMuted} hover:${theme.text} flex items-center gap-2 transition-colors`}
        >
          <RefreshCw size={14} />
          Start Over
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Box 1: Route */}
        <div className={`${theme.cardBg} rounded-2xl border ${theme.border} overflow-hidden flex flex-col hover:border-indigo-500/30 transition-colors group shadow-sm`}>
          <div className={`px-6 py-4 border-b ${theme.border} flex justify-between items-center ${isDarkMode ? 'bg-white/[0.02]' : 'bg-slate-50'}`}>
            <span className={`font-medium ${theme.textMuted} text-xs uppercase tracking-wider`}>ROUTE</span>
            <button 
              onClick={() => copyToClipboard(routeText, setCopiedRoute)}
              className={`${theme.textMuted} hover:text-indigo-400 transition-colors flex items-center gap-1.5 text-xs font-medium ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-white border-slate-200'} px-3 py-1.5 rounded-lg border hover:border-indigo-500/30`}
            >
              {copiedRoute ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
              {copiedRoute ? "COPIED" : "COPY"}
            </button>
          </div>
          <textarea 
            value={routeText}
            onChange={(e) => setRouteText(e.target.value)}
            className={`w-full h-40 p-6 bg-transparent ${isDarkMode ? 'text-slate-200' : 'text-slate-700'} font-mono text-sm resize-none focus:outline-none leading-relaxed`}
            spellCheck={false}
          />
        </div>

        {/* Box 2: Notes */}
        <div className={`${theme.cardBg} rounded-2xl border ${theme.border} overflow-hidden flex flex-col hover:border-indigo-500/30 transition-colors group shadow-sm`}>
          <div className={`px-6 py-4 border-b ${theme.border} flex justify-between items-center ${isDarkMode ? 'bg-white/[0.02]' : 'bg-slate-50'}`}>
            <span className={`font-medium ${theme.textMuted} text-xs uppercase tracking-wider`}>NOTES</span>
            <button 
              onClick={() => copyToClipboard(notesText, setCopiedNotes)}
              className={`${theme.textMuted} hover:text-indigo-400 transition-colors flex items-center gap-1.5 text-xs font-medium ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-white border-slate-200'} px-3 py-1.5 rounded-lg border hover:border-indigo-500/30`}
            >
              {copiedNotes ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
              {copiedNotes ? "COPIED" : "COPY"}
            </button>
          </div>
          <textarea 
            value={notesText}
            onChange={(e) => setNotesText(e.target.value)}
            className={`w-full h-40 p-6 bg-transparent ${isDarkMode ? 'text-slate-200' : 'text-slate-700'} font-mono text-sm resize-none focus:outline-none leading-relaxed`}
            spellCheck={false}
          />
        </div>

        {/* Box 3: Chain (Full Width) */}
        <div className={`md:col-span-2 ${theme.cardBg} rounded-2xl border ${theme.border} overflow-hidden flex flex-col hover:border-indigo-500/30 transition-colors group shadow-sm`}>
          <div className={`px-6 py-4 border-b ${theme.border} flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${isDarkMode ? 'bg-white/[0.02]' : 'bg-slate-50'}`}>
            <div className="flex items-center gap-4 flex-wrap">
              <span className={`font-medium ${theme.textMuted} text-xs uppercase tracking-wider`}>CHAIN</span>
              
              {/* Truck Selector */}
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  value={truckNumber}
                  onChange={(e) => setTruckNumber(e.target.value.toUpperCase())}
                  className={`w-16 bg-transparent border-b ${theme.border} text-xs ${theme.text} focus:outline-none focus:border-indigo-500 font-mono`}
                  placeholder="TRUCK#"
                />
                {savedTrucks.map(t => (
                  <div key={t} className="relative group/truck">
                    <button
                      onClick={() => setTruckNumber(t)}
                      className={`px-2 py-1 text-xs rounded border ${truckNumber === t ? 'bg-indigo-500 text-white border-indigo-500' : `${theme.textMuted} border-transparent hover:bg-white/5`}`}
                    >
                      {t}
                    </button>
                    <button 
                      onClick={(e) => removeSavedTruck(t, e)}
                      className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-3 h-3 flex items-center justify-center opacity-0 group-hover/truck:opacity-100 transition-opacity shadow-sm"
                      title="Remove truck"
                    >
                      <X size={8} />
                    </button>
                  </div>
                ))}
                <button 
                  onClick={addSavedTruck} 
                  className={`px-2 py-1 text-xs rounded border border-dashed ${theme.border} ${theme.textMuted} hover:text-indigo-400`}
                  title="Save current truck number"
                >
                  +
                </button>
              </div>

              {/* Broker Selector */}
              <div className="flex items-center gap-2 ml-4">
                <button 
                  onClick={() => setBroker("TRAFFIX")}
                  className={`px-2 py-1 text-xs rounded border ${broker === "TRAFFIX" ? 'bg-indigo-500 text-white border-indigo-500' : `${theme.textMuted} border-transparent hover:bg-white/5`}`}
                >
                  TRAFFIX
                </button>
                <input 
                  type="text" 
                  value={broker}
                  onChange={(e) => setBroker(e.target.value.toUpperCase())}
                  className={`w-24 bg-transparent border-b ${theme.border} text-xs ${theme.text} focus:outline-none focus:border-indigo-500`}
                  placeholder="OTHER"
                />
              </div>
            </div>

            <button 
              onClick={() => copyToClipboard(chainText, setCopiedChain)}
              className={`${theme.textMuted} hover:text-indigo-400 transition-colors flex items-center gap-1.5 text-xs font-medium ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-white border-slate-200'} px-3 py-1.5 rounded-lg border hover:border-indigo-500/30`}
            >
              {copiedChain ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
              {copiedChain ? "COPIED" : "COPY"}
            </button>
          </div>
          <div className="p-6">
             <input 
              type="text"
              value={chainText}
              onChange={(e) => setChainText(e.target.value)}
              className={`w-full bg-transparent ${isDarkMode ? 'text-slate-200' : 'text-slate-700'} font-mono text-lg focus:outline-none`}
              spellCheck={false}
            />
          </div>
        </div>

        {/* Box 4: Rename (Full Width) */}
        <div className={`md:col-span-2 ${theme.cardBg} rounded-2xl border ${theme.border} overflow-hidden flex flex-col hover:border-indigo-500/30 transition-colors group shadow-sm`}>
          <div className={`px-6 py-4 border-b ${theme.border} flex justify-between items-center ${isDarkMode ? 'bg-white/[0.02]' : 'bg-slate-50'}`}>
            <span className={`font-medium ${theme.textMuted} text-xs uppercase tracking-wider`}>RENAME</span>
            <button 
              onClick={() => copyToClipboard(renameText, setCopiedRename)}
              className={`${theme.textMuted} hover:text-indigo-400 transition-colors flex items-center gap-1.5 text-xs font-medium ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-white border-slate-200'} px-3 py-1.5 rounded-lg border hover:border-indigo-500/30`}
            >
              {copiedRename ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
              {copiedRename ? "COPIED" : "COPY"}
            </button>
          </div>
          <div className="p-6">
             <input 
              type="text"
              value={renameText}
              onChange={(e) => setRenameText(e.target.value)}
              className={`w-full bg-transparent ${isDarkMode ? 'text-slate-200' : 'text-slate-700'} font-mono text-lg focus:outline-none`}
              spellCheck={false}
            />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.text} font-sans selection:bg-indigo-500/30 transition-colors duration-300 flex flex-col relative overflow-hidden`}>
      <DottedMapBackground className="fixed inset-0" color={isDarkMode ? "#4F46E5" : "#94A3B8"} />
      
      {/* Header */}
      <header className={`border-b ${theme.border} sticky top-0 z-20 ${theme.headerBg} backdrop-blur-xl transition-colors duration-300 flex-none`}>
        <div className="w-full px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className={`text-2xl font-geologica font-bold tracking-tight ${theme.text} lowercase`}>dakota</h1>
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#BF0A30] shadow-sm" />
              <div className="w-2.5 h-2.5 rounded-full bg-white shadow-sm border border-slate-200/50" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#002868] shadow-sm" />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {appState !== 'upload' && (
              <div className={`hidden md:flex items-center gap-2 text-xs font-medium ${theme.textMuted} ${theme.cardBg} px-3 py-1.5 rounded-full border ${theme.border}`}>
                <span className={appState === 'verify' ? 'text-indigo-500' : ''}>Verify</span>
                <ChevronRight size={12} />
                <span className={appState === 'results' ? 'text-indigo-500' : ''}>Results</span>
              </div>
            )}
            
            <button 
              onClick={() => setIsMenuOpen(true)}
              className={`p-2 rounded-lg hover:${theme.cardBg} transition-colors`}
            >
              <Menu size={24} className={theme.textMuted} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 relative z-10 flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={appState}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="max-w-7xl mx-auto w-full flex-1 flex flex-col"
          >
            {appState === 'upload' && (
              <label 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`flex-1 flex flex-col items-center justify-center text-center space-y-6 transition-all duration-300 cursor-pointer rounded-3xl border-2 border-dashed ${isDragging ? 'border-indigo-500 bg-indigo-500/5 opacity-100 scale-[1.02]' : `${theme.border} opacity-50 hover:opacity-100`}`}
              >
                <input 
                  type="file" 
                  accept=".pdf" 
                  onChange={handleFileUpload}
                  className="hidden" 
                />
                <div className={`w-24 h-24 rounded-full ${theme.cardBg} border ${theme.border} flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm ${isDragging ? 'border-indigo-500 text-indigo-500' : ''}`}>
                  <Upload size={40} className={isDragging ? 'text-indigo-500' : theme.textMuted} />
                </div>
                <div className="space-y-2">
                  <h2 className={`text-xl font-medium ${isDragging ? 'text-indigo-500' : theme.text}`}>
                    {isDragging ? 'Drop PDF here' : 'No Document Selected'}
                  </h2>
                  <p className={`text-sm ${theme.textMuted}`}>
                    {isDragging ? 'Release to upload' : 'Click or drag PDF here to upload'}
                  </p>
                </div>
              </label>
            )}
            {appState === 'verify' && renderVerification()}
            {appState === 'results' && renderResults()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className={`fixed right-0 top-0 bottom-0 w-80 ${isDarkMode ? 'bg-[#0F172A]' : 'bg-white'} border-l ${theme.border} z-50 shadow-2xl p-6 flex flex-col`}
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-bold font-sans">Menu</h2>
                <button onClick={() => setIsMenuOpen(false)} className={`p-2 rounded-lg hover:${theme.cardBg}`}>
                  <X size={24} className={theme.textMuted} />
                </button>
              </div>

              <div className="space-y-6 flex-1">
                {/* Team Selector */}
                <div className={`p-4 rounded-xl border ${theme.border} ${theme.cardBg}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">Team Color</span>
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {[
                      { id: 'none', label: 'None', color: 'bg-slate-500' },
                      { id: 'green', label: '🟢', color: 'bg-emerald-500' },
                      { id: 'purple', label: '🟣', color: 'bg-purple-500' },
                      { id: 'red', label: '🔴', color: 'bg-red-500' },
                      { id: 'blue', label: '🔵', color: 'bg-blue-500' },
                    ].map((t) => (
                      <button 
                        key={t.id}
                        onClick={() => setTeam(t.id as any)}
                        className={`h-8 rounded-lg border flex items-center justify-center transition-all ${team === t.id ? 'ring-2 ring-offset-2 ring-indigo-500 border-transparent' : 'border-transparent opacity-50 hover:opacity-100'}`}
                        style={{ backgroundColor: t.id === 'none' ? undefined : 'transparent' }}
                      >
                         {t.id === 'none' ? <X size={14} className="text-white" /> : <span className="text-xl">{t.label}</span>}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Theme Toggle */}
                <div className={`p-4 rounded-xl border ${theme.border} ${theme.cardBg}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">Appearance</span>
                    {isDarkMode ? <Moon size={18} className="text-indigo-400" /> : <Sun size={18} className="text-amber-500" />}
                  </div>
                  <div className="flex gap-2 bg-black/5 p-1 rounded-lg">
                    <button 
                      onClick={() => setIsDarkMode(false)}
                      className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${!isDarkMode ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Light
                    </button>
                    <button 
                      onClick={() => setIsDarkMode(true)}
                      className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${isDarkMode ? 'bg-slate-700 shadow text-white' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Dark
                    </button>
                  </div>
                </div>

                {/* Address Format Toggle */}
                <div className={`p-4 rounded-xl border ${theme.border} ${theme.cardBg}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">Address Format</span>
                    <MapPin size={18} className="text-indigo-400" />
                  </div>
                  <div className="flex gap-2 bg-black/5 p-1 rounded-lg">
                    <button 
                      onClick={() => setIsSimplifiedAddress(false)}
                      className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${!isSimplifiedAddress ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Full
                    </button>
                    <button 
                      onClick={() => setIsSimplifiedAddress(true)}
                      className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${isSimplifiedAddress ? 'bg-indigo-500 shadow text-white' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      City/Zip
                    </button>
                  </div>
                </div>

                {/* Drag Sensitivity Slider */}
                <div className={`p-4 rounded-xl border ${theme.border} ${theme.cardBg}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">Drag Sensitivity</span>
                    <Sliders size={18} className="text-indigo-400" />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500">1x</span>
                    <input 
                      type="range" 
                      min="0.5" 
                      max="3" 
                      step="0.1" 
                      value={dragSensitivity} 
                      onChange={(e) => setDragSensitivity(parseFloat(e.target.value))}
                      className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                    <span className="text-xs text-slate-500">3x</span>
                  </div>
                  <div className="text-center mt-1">
                     <span className="text-xs font-mono text-indigo-500">{dragSensitivity.toFixed(1)}x</span>
                  </div>
                </div>

                {/* Help Section */}
                <div className="space-y-3">
                  <h3 className={`text-sm font-semibold ${theme.textMuted} uppercase tracking-wider flex items-center gap-2`}>
                    <HelpCircle size={14} /> Help
                  </h3>
                  <ul className={`text-sm ${theme.textMuted} space-y-2 list-disc list-inside`}>
                    <li>Upload your Rate Confirmation PDF via the sidebar.</li>
                    <li>Verify extracted data in the wizard.</li>
                    <li>Copy the formatted route and notes.</li>
                  </ul>
                </div>

                {/* Privacy Section */}
                <div className="space-y-3">
                  <h3 className={`text-sm font-semibold ${theme.textMuted} uppercase tracking-wider flex items-center gap-2`}>
                    <Shield size={14} /> Privacy
                  </h3>
                  <p className={`text-sm ${theme.textMuted} leading-relaxed`}>
                    Your documents are processed entirely within your browser. No data is uploaded to any external server. We prioritize your privacy and data security.
                  </p>
                </div>
              </div>

              <div className={`mt-auto pt-6 border-t ${theme.border}`}>
                <p className={`text-xs ${theme.textMuted} text-center font-geologica`}>
                  dakota v1.0.0
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
