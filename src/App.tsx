import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, FileText, Copy, Check, RefreshCw, ChevronRight, ChevronLeft, Eye, Edit2, Menu, X, Sun, Moon, Shield, HelpCircle, Info, AlertTriangle, MapPin, ZoomIn, ZoomOut, Maximize, Hand, MousePointer, Sliders, Target, Zap, Search, TrendingUp, Mail, Truck, Building2, Plus, Trash2, Settings, Hash, ClipboardList } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';

// Set worker source to CDN for reliable production behavior
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@5.4.624/build/pdf.worker.min.mjs';

import { parseRateConfirmation, ParsedRateCon } from './utils/parser';
import { DottedMapBackground } from './components/DottedMapBackground';
import { LoadingScreen } from './components/LoadingScreen';
import { DriverNumberModal } from './components/DriverNumberModal';
import { TemplatesView } from './components/TemplatesView';

const DakotaLogo = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 349.899 349.898" xmlns="http://www.w3.org/2000/svg">
    <path fill="#BF0A30" d="M175.522,12.235c-42.6,0-77.256,34.649-77.256,77.25c0,42.6,34.656,77.255,77.256,77.255 c42.591,0,77.257-34.656,77.257-77.255C252.779,46.895,218.113,12.235,175.522,12.235z" />
    <path fill="#FFFFFF" stroke="#e2e8f0" strokeWidth="4" d="M77.255,337.663c42.599,0,77.255-34.641,77.255-77.251c0-42.594-34.656-77.25-77.255-77.25 C34.653,183.162,0,217.818,0,260.412C0,303.012,34.653,337.663,77.255,337.663z" />
    <path fill="#002868" d="M272.648,183.151c-42.603,0-77.256,34.65-77.256,77.256c0,42.604,34.653,77.25,77.256,77.25 c42.6,0,77.251-34.646,77.251-77.25C349.909,217.818,315.248,183.151,272.648,183.151z" />
  </svg>
);

// --- Types ---

type HistoryItem = {
  id: string;
  timestamp: number;
  dateStr: string; // YYYY-MM-DD for grouping
  loadNumber: string;
  broker: string;
  rate: string;
  route: string;
  notes: string;
  chain: string;
  rename: string;
};

type VerificationStep = {
  key: keyof ParsedRateCon | string;
  label: string;
  description: string;
  stopIndex?: number;
  field?: 'time' | 'address' | 'date';
};

const isMultiStop = (data: ParsedRateCon | null) => {
  if (!data || !data.stops) return false;
  const pickups = data.stops.filter(s => s.type === 'pickup');
  const deliveries = data.stops.filter(s => s.type === 'delivery');
  // Multi-stop means more than one pickup OR more than one delivery
  return pickups.length > 1 || deliveries.length > 1;
};

const getBaseSteps = (data: ParsedRateCon | null): VerificationStep[] => {
  const baseSteps: VerificationStep[] = [
    { key: 'loadNumber', label: 'Load Number', description: 'Confirm the Load Reference Number' },
    { key: 'weight', label: 'Weight', description: 'Confirm the total weight' },
    { key: 'rate', label: 'Rate', description: 'Confirm the total rate amount' },
  ];

  if (!isMultiStop(data)) {
    return [
      ...baseSteps,
      { key: 'pickupTime', label: 'Pickup Time', description: 'Check the scheduled pickup time' },
      { key: 'deliveryTime', label: 'Delivery Time', description: 'Check the scheduled delivery time' },
      { key: 'originAddress', label: 'Origin', description: 'Verify the pickup location' },
      { key: 'destinationAddress', label: 'Destination', description: 'Verify the delivery location' },
    ];
  }

  const stopSteps: VerificationStep[] = [];
  data!.stops.forEach((stop, index) => {
    stopSteps.push({
      key: `stop_${index}_time`,
      label: `${stop.label} Time`,
      description: `Check the scheduled time for ${stop.label}`,
      stopIndex: index,
      field: 'time'
    });
    stopSteps.push({
      key: `stop_${index}_address`,
      label: `${stop.label} Address`,
      description: `Verify the location for ${stop.label}`,
      stopIndex: index,
      field: 'address'
    });
  });

  return [...baseSteps, ...stopSteps];
};

// --- Helper Functions ---

const formatAddress = (fullAddress: string, simplified: boolean) => {
  if (!simplified || !fullAddress) return fullAddress;

  // Specific Facility Mapping as requested - using regex for robustness
  const upperAddr = fullAddress.toUpperCase();
  if (upperAddr.includes("1671") && (upperAddr.includes("GREENBOURNE") || upperAddr.includes("GREENSBORO"))) {
    return "GREENSBORO, NC 27409";
  }
  if (upperAddr.includes("GREENBOURNE DR") && upperAddr.includes("STE 101")) {
    return "GREENSBORO, NC 27409";
  }

  const extractCity = (partBefore: string, state: string, zip: string) => {
    // Robust regex for suite/unit/building prefixes
    const suiteRegex = /(?:STE|UNIT|SUITE|BLDG|APT|#|STB|RM|ROOM)\.?\s*[A-Z0-9-]+\.?\s+/gi;
    
    let cleanedPart = partBefore.trim();
    // Strip suite info from the start
    cleanedPart = cleanedPart.replace(/^(?:STE|UNIT|SUITE|BLDG|APT|#|STB|RM|ROOM)\.?\s*[A-Z0-9-]+\.?\s+/i, "").trim();

    // Strategy 1: If there's a comma, assume City is after the last comma
    if (cleanedPart.includes(',')) {
      const parts = cleanedPart.split(',');
      let city = parts[parts.length - 1].trim();
      city = city.replace(/^(?:STE|UNIT|SUITE|BLDG|APT|#|STB|RM|ROOM)\.?\s*[A-Z0-9-]+\.?\s+/i, "").trim();
      if (city && isNaN(Number(city))) {
        return `${city.toUpperCase()}, ${state.toUpperCase()} ${zip}`.trim();
      }
    }

    // Strategy 2: Try to split by common street suffixes
    const suffixes = ["AVE", "RD", "ST", "DR", "BLVD", "LN", "CT", "PL", "WAY", "CIR", "PKWY", "HWY", "TER", "TRL", "LOOP", "PIKE", "SQUARE", "SQ", "PARKWAY", "ROAD", "STREET", "DRIVE", "AVENUE", "LANE", "COURT", "PLACE"];
    const suffixPattern = new RegExp(`\\b(?:${suffixes.join("|")})\\.?\\s*,?\\s+(?!.*\\b(?:${suffixes.join("|")})\\b)(.*)$`, "i");
    
    const match = cleanedPart.match(suffixPattern);
    if (match && match[1].trim().length > 0) {
      let cityCandidate = match[1].trim();
      cityCandidate = cityCandidate.replace(/^(?:STE|UNIT|SUITE|BLDG|APT|#|STB|RM|ROOM)\.?\s*[A-Z0-9-]+\.?\s+/i, "").trim();
      cityCandidate = cityCandidate.replace(/(?:STE|UNIT|SUITE|BLDG|APT|#|STB|RM|ROOM)\.?\s*[A-Z0-9-]+\.?\s+/gi, "").trim();

      if (cityCandidate && isNaN(Number(cityCandidate))) {
        return `${cityCandidate.toUpperCase()}, ${state.toUpperCase()} ${zip}`.trim();
      }
    }
    
    // Fallback: Just take the last word if it looks like a city
    const words = cleanedPart.split(/\s+/);
    if (words.length >= 1) {
      const lastWord = words[words.length - 1];
      if (isNaN(Number(lastWord)) && lastWord.length > 2) {
         return `${lastWord.toUpperCase()}, ${state.toUpperCase()} ${zip}`.trim();
      }
    }

    return `${cleanedPart.toUpperCase()}, ${state.toUpperCase()} ${zip}`.trim();
  };

  const trimmedAddr = fullAddress.trim();

  // 1. Find State and Zip at the end (Zip is optional but preferred)
  const stateZipMatch = trimmedAddr.match(/,\s*([A-Z]{2})(?:\s+(\d{5}(?:-\d{4})?))?\s*$/i);
  if (!stateZipMatch) {
     const stateZipMatchNoComma = trimmedAddr.match(/\s+([A-Z]{2})(?:\s+(\d{5}(?:-\d{4})?))?\s*$/i);
     if (!stateZipMatchNoComma) return fullAddress;
     
     const [_, state, zip] = stateZipMatchNoComma;
     const partBefore = trimmedAddr.substring(0, stateZipMatchNoComma.index).trim();
     
     return extractCity(partBefore, state, zip || "");
  }

  const [_, state, zip] = stateZipMatch;
  const partBefore = trimmedAddr.substring(0, stateZipMatch.index).trim();
  
  return extractCity(partBefore, state, zip || "");
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
  const [isRendering, setIsRendering] = useState(false);
  const [highlights, setHighlights] = useState<any[]>([]);
  const lastHighlightRef = useRef<string>("");

  // 1. Render Base PDF
  useEffect(() => {
    let renderTask: any = null;
    let isCancelled = false;

    const renderPage = async () => {
      if (!pdfDocument || !canvasRef.current || !viewportRef.current) return;

      try {
        setIsRendering(true);
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
        setIsRendering(false);

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

      const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
      let cleanSearch = normalize(highlightText);
      
      // Special cases for weights and times
      if (cleanSearch.endsWith('lbs')) cleanSearch = cleanSearch.replace(/lbs$/, '');
      const timeMatch = cleanSearch.match(/^(\d{4})(?:est|cst|mst|pst|edt|cdt|mdt|pdt|ast|hst|akst|akdt|utc|gmt)$/);
      if (timeMatch) cleanSearch = timeMatch[1];

      const isMatchOnPage = async (page: any) => {
        const textContent = await page.getTextContent();
        const items = [...textContent.items] as any[];
        items.sort((a, b) => {
          const yDiff = b.transform[5] - a.transform[5];
          if (Math.abs(yDiff) > 5) return yDiff;
          return a.transform[4] - b.transform[4];
        });
        const fullText = normalize(items.map(it => it.str).join(""));
        return fullText.includes(cleanSearch);
      };

      // Check current page first
      if (pageData) {
        if (await isMatchOnPage(pageData.page)) return;
      }

      // Search other pages
      for (let i = 1; i <= pdfDocument.numPages; i++) {
        if (i === currentPage) continue;
        const page = await pdfDocument.getPage(i);
        if (await isMatchOnPage(page)) {
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
      if (!pageData) return;
      
      const { page, viewport } = pageData;
      
      // Reset zoom if disabled or no text
      if (!isAutoZoomEnabled || !highlightText || highlightText.length < 2) {
        if (isAutoZoomEnabled && highlightText !== lastHighlightRef.current) {
             setScale(1);
             setPosition({ x: 0, y: 0 });
        }
        setHighlights([]);
        lastHighlightRef.current = highlightText;
        return;
      }

      try {
        const textContent = await page.getTextContent();
        const items = [...textContent.items] as any[];
        
        // Sort items visually
        items.sort((a, b) => {
          const yDiff = b.transform[5] - a.transform[5];
          if (Math.abs(yDiff) > 5) return yDiff;
          return a.transform[4] - b.transform[4];
        });

        const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
        let cleanSearch = normalize(highlightText);
        if (cleanSearch.endsWith('lbs')) cleanSearch = cleanSearch.replace(/lbs$/, '');
        const timeMatch = cleanSearch.match(/^(\d{4})(?:est|cst|mst|pst|edt|cdt|mdt|pdt|ast|hst|akst|akdt|utc|gmt)$/);
        if (timeMatch) cleanSearch = timeMatch[1];

        if (cleanSearch.length < 2) return;

        // Build a map of characters to items
        let combinedText = "";
        const charToItemMap: { item: any, indexInItem: number }[] = [];
        
        items.forEach(item => {
          const str = item.str;
          for (let i = 0; i < str.length; i++) {
            combinedText += str[i].toLowerCase();
            charToItemMap.push({ item, indexInItem: i });
          }
          // Add a space between items for better matching
          combinedText += " ";
          charToItemMap.push({ item: null, indexInItem: -1 });
        });

        // Use a regex that ignores non-alphanumeric characters
        const escapedSearch = cleanSearch.split('').join('[^a-z0-9]*');
        const regex = new RegExp(escapedSearch, 'i');
        const match = combinedText.match(regex);

        if (match && match.index !== undefined) {
          const startIndex = match.index;
          const endIndex = startIndex + match[0].length;
          
          const matchedItems = new Set<any>();
          for (let i = startIndex; i < endIndex; i++) {
            const mapping = charToItemMap[i];
            if (mapping && mapping.item) {
              matchedItems.add(mapping.item);
            }
          }

          let firstMatchRect: number[] | null = null;
          const newHighlights: any[] = [];

          matchedItems.forEach(item => {
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

            const x = Math.min(rect[0], rect[2]);
            const y = Math.min(rect[1], rect[3]);
            const w = Math.abs(rect[0] - rect[2]);
            const h = Math.abs(rect[1] - rect[3]);

            if (!firstMatchRect) {
              firstMatchRect = [x, y, w, h];
            }
            newHighlights.push({ x, y, w, h });
          });

          setHighlights(newHighlights);

          // Apply Auto Zoom
          if (isAutoZoomEnabled && firstMatchRect && viewportRef.current) {
            const [x, y, w, h] = firstMatchRect;
            const centerX = x + w / 2;
            const centerY = y + h / 2;
            
            const containerW = viewportRef.current.clientWidth;
            const containerH = viewportRef.current.clientHeight || 600;
            
            const newScale = 2.0;
            const translateX = containerW / 2 - centerX * newScale;
            const translateY = containerH / 2 - centerY * newScale;

            setScale(newScale);
            setPosition({ x: translateX, y: translateY });
          }
        } else {
          // Fallback to word-based matching if sequence fails (for very fragmented PDFs)
          const highlightWords = highlightText.toLowerCase().split(/\s+/).filter(w => w.length >= 3);
          const newHighlights: any[] = [];
          let firstMatchRect: number[] | null = null;

          items.forEach(item => {
            const cleanItem = normalize(item.str);
            if (cleanItem.length < 2) return;

            const isWordMatch = highlightWords.some(w => {
              const cw = normalize(w);
              return cw.length >= 3 && (cleanItem.includes(cw) || cw.includes(cleanItem));
            });

            if (isWordMatch && !cleanItem.includes('address') && !cleanItem.includes('origin') && !cleanItem.includes('destination')) {
              const pdfX = item.transform[4];
              const pdfY = item.transform[5];
              const pdfHeight = Math.sqrt(item.transform[2] * item.transform[2] + item.transform[3] * item.transform[3]);
              const pdfWidth = item.width;

              const rect = viewport.convertToViewportRectangle([pdfX, pdfY, pdfX + pdfWidth, pdfY + pdfHeight]);
              const x = Math.min(rect[0], rect[2]);
              const y = Math.min(rect[1], rect[3]);
              const w = Math.abs(rect[0] - rect[2]);
              const h = Math.abs(rect[1] - rect[3]);

              if (!firstMatchRect) firstMatchRect = [x, y, w, h];
              newHighlights.push({ x, y, w, h });
            }
          });

          setHighlights(newHighlights);
          if (isAutoZoomEnabled && firstMatchRect && viewportRef.current && highlightText !== lastHighlightRef.current) {
            const [x, y, w, h] = firstMatchRect;
            const centerX = x + w / 2;
            const centerY = y + h / 2;
            const containerW = viewportRef.current.clientWidth;
            const containerH = viewportRef.current.clientHeight || 600;
            const newScale = 2.0;
            setScale(newScale);
            setPosition({ x: containerW / 2 - centerX * newScale, y: containerH / 2 - centerY * newScale });
          } else if (isAutoZoomEnabled && !firstMatchRect && highlightText !== lastHighlightRef.current) {
            setScale(1);
            setPosition({ x: 0, y: 0 });
          }
        }
        
        lastHighlightRef.current = highlightText;

      } catch (err) {
        console.error("Highlight error:", err);
      }
    };

    drawHighlights();
  }, [highlightText, pageData, isAutoZoomEnabled]);

  const [copiedLocation, setCopiedLocation] = useState<{x: number, y: number} | null>(null);

  // Handlers for Manual Controls
  const handleZoomIn = () => setScale(s => Math.min(s + 0.5, 5));
  const handleZoomOut = () => setScale(s => Math.max(s - 0.5, 0.5));
  const handleFitPage = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const showCopiedFeedback = (x: number, y: number) => {
    setCopiedLocation({ x, y });
    setTimeout(() => setCopiedLocation(null), 2000);
  };

  const handleTextLayerClick = (e: React.MouseEvent) => {
    if (tool !== 'cursor') return;
    
    // If user just clicked (no drag selection), select the word and copy
    const selection = window.getSelection();
    if (selection && selection.isCollapsed) {
      const target = e.target as HTMLElement;
      if (target.tagName === 'SPAN') {
        const range = document.createRange();
        range.selectNodeContents(target);
        selection.removeAllRanges();
        selection.addRange(range);
        
        const text = target.textContent;
        if (text) {
          navigator.clipboard.writeText(text);
          showCopiedFeedback(e.clientX, e.clientY);
        }
      }
    }
  };

  const handleTextLayerMouseUp = (e: React.MouseEvent) => {
    if (tool !== 'cursor') return;
    
    // Check for drag selection
    const selection = window.getSelection();
    const text = selection?.toString();
    
    if (text && text.length > 0 && !selection?.isCollapsed) {
       navigator.clipboard.writeText(text);
       showCopiedFeedback(e.clientX, e.clientY);
    }
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

  const handleWheel = (e: React.WheelEvent) => {
    // Zoom with wheel
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setScale(s => Math.min(Math.max(s + delta, 0.5), 5));
  };

  // Use a non-passive listener to prevent page scroll during zoom
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const preventDefaultWheel = (e: WheelEvent) => {
      if (e.currentTarget === viewport) {
        e.preventDefault();
      }
    };

    viewport.addEventListener('wheel', preventDefaultWheel, { passive: false });
    return () => viewport.removeEventListener('wheel', preventDefaultWheel);
  }, []);

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
        onWheel={handleWheel}
      >
        <motion.div 
          ref={contentRef}
          className="relative shadow-2xl origin-top-left"
          animate={{
            x: position.x,
            y: position.y,
            scale: scale
          }}
          transition={isDragging ? { type: "tween", duration: 0 } : {
            type: "spring",
            damping: 30,
            stiffness: 120,
            mass: 0.8
          }}
        >
          <canvas ref={canvasRef} className="rounded-sm" />
          <div 
            ref={textLayerRef} 
            className={`textLayer ${tool === 'cursor' ? 'cursor-mode' : ''}`}
            style={{ pointerEvents: tool === 'cursor' ? 'auto' : 'none' }}
            onClick={handleTextLayerClick}
            onMouseUp={handleTextLayerMouseUp}
          />
          <div className="absolute inset-0 pointer-events-none">
            {highlights.map((h, i) => (
              <div 
                key={i}
                style={{
                  position: 'absolute',
                  left: `${h.x}px`,
                  top: `${h.y}px`,
                  width: `${h.w}px`,
                  height: `${h.h}px`,
                  backgroundColor: 'rgba(255, 255, 0, 0.3)',
                  border: '1px solid rgba(255, 200, 0, 0.8)',
                  borderRadius: '2px',
                  boxSizing: 'border-box'
                }}
              />
            ))}
          </div>
        </motion.div>
      </div>

      {/* Copied Feedback Toast */}
      <AnimatePresence>
        {copiedLocation && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.9 }}
            style={{
              position: 'fixed',
              left: copiedLocation.x,
              top: copiedLocation.y - 40,
              zIndex: 100,
              pointerEvents: 'none'
            }}
            className="bg-black/80 text-white text-xs px-2 py-1 rounded shadow-lg backdrop-blur-sm flex items-center gap-1"
          >
            <Check size={12} className="text-green-400" />
            Copied!
          </motion.div>
        )}
      </AnimatePresence>
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

const ManageView = ({ 
  theme, 
  isDarkMode, 
  savedTrucks, 
  setSavedTrucks, 
  onBack 
}: {
  theme: any,
  isDarkMode: boolean,
  savedTrucks: string[],
  setSavedTrucks: (v: string[]) => void,
  onBack: () => void
}) => {
  const [newTruck, setNewTruck] = useState("");

  const addTruck = () => {
    if (newTruck && !savedTrucks.includes(newTruck)) {
      setSavedTrucks([...savedTrucks, newTruck]);
      setNewTruck("");
    }
  };

  const removeTruck = (t: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedTrucks(savedTrucks.filter(truck => truck !== t));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <h2 className={`text-3xl font-display font-medium ${theme.text}`}>Manage Data</h2>
        <button 
          onClick={onBack}
          className={`px-4 py-2 rounded-lg border ${theme.border} ${theme.textMuted} hover:${theme.text} hover:${theme.cardBg} transition-colors flex items-center gap-2`}
        >
          <ChevronLeft size={18} />
          Back
        </button>
      </div>
      
      <div className="max-w-md mx-auto">
        {/* Trucks Manager */}
        <div className={`${theme.cardBg} rounded-2xl border ${theme.border} p-6 shadow-sm`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className={`text-lg font-medium ${theme.text} flex items-center gap-2`}>
                <Truck size={20} className="text-indigo-500" /> Trucks
            </h3>
            <span className={`text-xs ${theme.textMuted} bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full`}>{savedTrucks.length} saved</span>
          </div>
          
          <div className="flex gap-2 mb-6">
            <input 
              type="text" 
              value={newTruck}
              onChange={(e) => setNewTruck(e.target.value.toUpperCase())}
              placeholder="Add Truck #"
              className={`flex-1 ${theme.inputBg} border ${theme.border} rounded-lg px-3 py-2 text-sm ${theme.text} focus:outline-none focus:border-indigo-500`}
              onKeyDown={(e) => {
                if (e.key === 'Enter') addTruck();
              }}
            />
            <button 
              onClick={addTruck}
              className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-lg transition-colors"
            >
              <Plus size={20} />
            </button>
          </div>

          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {savedTrucks.map(t => (
              <div key={t} className={`flex items-center justify-between p-3 rounded-lg border ${theme.border} ${isDarkMode ? 'bg-white/5' : 'bg-slate-50'} group hover:border-indigo-500/30 transition-colors`}>
                <span className={`font-mono font-medium ${theme.text}`}>{t}</span>
                <button 
                  onClick={(e) => removeTruck(t, e)}
                  className="text-slate-400 hover:text-red-500 p-1 rounded-md hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100 border-none"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            {savedTrucks.length === 0 && (
              <p className={`text-sm ${theme.textMuted} text-center py-8 italic`}>No trucks saved yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const HistoryView = ({ 
  theme, 
  isDarkMode, 
  history, 
  onBack,
  onSelectItem,
  searchTerm
}: {
  theme: any,
  isDarkMode: boolean,
  history: HistoryItem[],
  onBack: () => void,
  onSelectItem: (item: HistoryItem) => void,
  searchTerm: string
}) => {
  const filteredHistory = history.filter(item => 
    item.loadNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.broker.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.route.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group by date
  const groups = filteredHistory.reduce((acc, item) => {
    if (!acc[item.dateStr]) acc[item.dateStr] = [];
    acc[item.dateStr].push(item);
    return acc;
  }, {} as Record<string, HistoryItem[]>);

  const sortedDates = Object.keys(groups).sort((a, b) => b.localeCompare(a));

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00'); // Avoid timezone shifts
    return date.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-8 px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className={`text-3xl font-display font-medium ${theme.text}`}>History</h2>
          <p className={`${theme.textMuted} text-sm`}>Local storage of your processed loads</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className={`px-4 py-2 rounded-xl border ${theme.border} ${theme.textMuted} hover:${theme.text} hover:${theme.cardBg} transition-colors flex items-center gap-2`}
          >
            <ChevronLeft size={18} />
            Back
          </button>
        </div>
      </div>

      <div className="space-y-12">
        {sortedDates.map(date => (
          <div key={date} className="space-y-4">
            <h3 className={`text-sm font-bold uppercase tracking-widest ${theme.textMuted} flex items-center gap-3`}>
              <span className="bg-indigo-500/10 text-indigo-500 px-2 py-0.5 rounded text-[10px]">{groups[date].length}</span>
              {formatDate(date)}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groups[date].map(item => (
                <div 
                  key={item.id}
                  onClick={() => onSelectItem(item)}
                  className={`${theme.cardBg} glass-card border ${theme.border} p-5 rounded-2xl shadow-sm hover:border-indigo-500/50 transition-all cursor-pointer group relative overflow-hidden`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className={`font-bold ${theme.text} group-hover:text-indigo-500 transition-colors`}>#{item.loadNumber}</h4>
                      <p className={`text-xs ${theme.textMuted} font-medium`}>{item.broker}</p>
                    </div>
                    <span className="text-emerald-500 font-mono text-sm font-bold">${item.rate}</span>
                  </div>
                  
                  <div className={`text-[10px] ${theme.textMuted} font-mono line-clamp-2 mb-4 opacity-70`}>
                    {item.route.split('\n')[0]} → {item.route.split('\n').pop()}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-white/5">
                    <span className={`text-[10px] ${theme.textMuted}`}>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <ChevronRight size={14} className={`${theme.textMuted} group-hover:translate-x-1 transition-transform`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {history.length === 0 && (
          <div className="text-center py-20 space-y-4">
            <div className={`w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto ${theme.textMuted}`}>
              <FileText size={32} />
            </div>
            <p className={`${theme.textMuted} italic`}>No history found. Upload a RateCon to get started.</p>
          </div>
        )}

        {history.length > 0 && filteredHistory.length === 0 && (
          <p className={`text-center py-20 ${theme.textMuted} italic`}>No results matching "{searchTerm}"</p>
        )}
      </div>
    </div>
  );
};

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  
  // App State: 'upload' | 'verify' | 'results' | 'manage' | 'history' | 'templates'
  const [appState, setAppState] = useState<'upload' | 'verify' | 'results' | 'manage' | 'history' | 'templates'>('upload');
  
  // Data State
  const [extractedData, setExtractedData] = useState<ParsedRateCon | null>(null);
  const extractedDataRef = useRef<ParsedRateCon | null>(null);
  const [isViewingHistory, setIsViewingHistory] = useState(false);
  const [currentHistoryItem, setCurrentHistoryItem] = useState<HistoryItem | null>(null);
  const [showPdfInResults, setShowPdfInResults] = useState(false);
  const [pdfLoadNumber, setPdfLoadNumber] = useState<string | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [currentSteps, setCurrentSteps] = useState<VerificationStep[]>([]);
  const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);
  
  // History State
  const [history, setHistory] = useLocalStorage<HistoryItem[]>("dakota_history", []);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Output States
  const [routeText, setRouteText] = useState("");
  const [notesText, setNotesText] = useState("");
  const [copiedRoute, setCopiedRoute] = useState(false);
  const [copiedNotes, setCopiedNotes] = useState(false);

  // Chain State
  const [truckNumber, setTruckNumber] = useState("TRUCK#");
  const [savedTrucks, setSavedTrucks] = useLocalStorage<string[]>("dakota_savedTrucks", []);
  const broker = "TRAFFIX";
  const [chainText, setChainText] = useState("");
  const [copiedChain, setCopiedChain] = useState(false);
  const [renameText, setRenameText] = useState("");
  const [copiedRename, setCopiedRename] = useState(false);
  const [team, setTeam] = useLocalStorage<'green' | 'purple' | 'red' | 'blue' | 'none'>("dakota_team", 'none');

  // Quick Look State
  const [quickLook, setQuickLook] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
    text: string;
  }>({ isOpen: false, x: 0, y: 0, text: "" });

  const handleQuickLook = (e: React.MouseEvent, text: string) => {
    if (!text) return;
    e.preventDefault();
    e.stopPropagation();
    
    // Adjust position to keep it on screen
    const x = e.clientX;
    const y = e.clientY;
    
    setQuickLook({
      isOpen: true,
      x,
      y,
      text: text.split('\n')[0].trim() || text.trim()
    });
  };

  // Close Quick Look on click anywhere
  useEffect(() => {
    const handleGlobalClick = () => {
      if (quickLook.isOpen) setQuickLook(prev => ({ ...prev, isOpen: false }));
    };
    window.addEventListener('click', handleGlobalClick);
    window.addEventListener('contextmenu', handleGlobalClick);
    return () => {
      window.removeEventListener('click', handleGlobalClick);
      window.removeEventListener('contextmenu', handleGlobalClick);
    };
  }, [quickLook.isOpen]);

  // Loading Screen Effect
  useEffect(() => {
    setIsLoading(false);
  }, []);

  // Global Mouse Position for Glass Effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      document.documentElement.style.setProperty('--mouse-x', `${e.clientX}px`);
      document.documentElement.style.setProperty('--mouse-y', `${e.clientY}px`);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Extension Integration Effect
  useEffect(() => {
    const handleHashChange = async () => {
      const hash = window.location.hash.substring(1);
      if (!hash) return;
      
      const params = new URLSearchParams(hash);
      const pdfUrl = params.get('pdfUrl');
      
      if (pdfUrl) {
        setIsProcessing(true);
        try {
          // Fetch the PDF
          const response = await fetch(pdfUrl);
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          
          const blob = await response.blob();
          const arrayBuffer = await blob.arrayBuffer();
          
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          setPdfDoc(pdf);
          setFileName("Extension Document.pdf"); 
          
          await processPdfData(pdf);
        } catch (error) {
           console.error("Extension Load Error:", error);
           alert("Could not auto-load PDF from extension. Security restrictions may prevent direct access. Please download the file and drag it here.");
        } finally {
           setIsProcessing(false);
        }
      }
    };

    // Handle PDF data via postMessage (for Gmail attachments where fetch fails)
    const handleMessage = async (event: MessageEvent) => {
      // 1. OPEN_PDF_DATA (Legacy/Alternative)
      if (event.data && event.data.type === 'OPEN_PDF_DATA') {
        const { data, name } = event.data; // data should be base64 string or ArrayBuffer
        if (data) {
           setIsProcessing(true);
           try {
             // Convert base64 to Uint8Array if needed
             let pdfData = data;
             if (typeof data === 'string') {
               const binaryString = window.atob(data);
               const len = binaryString.length;
               const bytes = new Uint8Array(len);
               for (let i = 0; i < len; i++) {
                 bytes[i] = binaryString.charCodeAt(i);
               }
               pdfData = bytes.buffer;
             }

             const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
             setPdfDoc(pdf);
             setFileName(name || "Extension Document.pdf");
             await processPdfData(pdf);
           } catch (error) {
             console.error("Message Load Error:", error);
             alert("Error loading PDF data from extension.");
           } finally {
             setIsProcessing(false);
           }
        }
      }

      // 2. LOAD_PDF_BASE64 (New Standard)
      if (event.data && event.data.type === 'LOAD_PDF_BASE64') {
        const { pdfData } = event.data;
        
        try {
          // Convert Base64 to File
          const byteCharacters = atob(pdfData);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const file = new File([byteArray], "rate_confirmation.pdf", { type: "application/pdf" });

          console.log("PDF received from extension successfully");
          
          // Use processFile to handle the File object directly
          await processFile(file);

        } catch (error) {
          console.error("Error processing PDF from extension:", error);
          alert("Error processing PDF from extension.");
        }
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  // Settings State
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useLocalStorage("dakota_isDarkMode", true);
  const [isAutoZoomEnabled, setIsAutoZoomEnabled] = useLocalStorage("dakota_isAutoZoomEnabled", true);
  const [isSimplifiedAddress, setIsSimplifiedAddress] = useLocalStorage("dakota_isSimplifiedAddress", false);
  const [dragSensitivity, setDragSensitivity] = useLocalStorage("dakota_dragSensitivity", 1.5);

  // --- Styles Helper ---
  const theme = React.useMemo(() => ({
    bg: isDarkMode ? 'bg-[#020617]' : 'bg-slate-50',
    text: isDarkMode ? 'text-white' : 'text-slate-900',
    textMuted: isDarkMode ? 'text-slate-400' : 'text-slate-500',
    border: isDarkMode ? 'border-white/10' : 'border-slate-200',
    cardBg: isDarkMode ? 'bg-slate-900' : 'bg-white',
    cardHover: isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-50',
    inputBg: isDarkMode ? 'bg-slate-800' : 'bg-slate-100',
    headerBg: isDarkMode ? 'bg-[#020617]' : 'bg-white',
    accent: 'text-indigo-400',
    accentBg: 'bg-indigo-600',
    accentHover: 'hover:bg-indigo-500',
  }), [isDarkMode]);

  const processPdfData = async (pdf: any) => {
    let fullText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      // Sort items by visual position (top-to-bottom, left-to-right)
      // item.transform: [scaleX, skewY, skewX, scaleY, x, y]
      const items = (textContent.items as any[]).filter(item => item.str !== undefined);
      
      items.sort((a, b) => {
        const yDiff = b.transform[5] - a.transform[5];
        if (Math.abs(yDiff) > 5) { // Threshold for "same line"
          return yDiff;
        }
        return a.transform[4] - b.transform[4];
      });

      const pageText = items.map((item: any) => item.str).join(" ");
      fullText += pageText + "\n";
    }

    const data = parseRateConfirmation(fullText);
    setExtractedData(data);
    extractedDataRef.current = data; // Sync ref immediately
    setPdfLoadNumber(data.loadNumber);
    
    const steps = getBaseSteps(data);
    setCurrentSteps(steps);
    
    setAppState('verify');
    setCurrentStepIndex(0);
  };

  const processFile = async (uploadedFile: File) => {
    if (!uploadedFile) return;
    
    setIsViewingHistory(false);
    setCurrentHistoryItem(null);
    setFileName(uploadedFile.name);
    setIsProcessing(true);

    try {
      const arrayBuffer = await uploadedFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      setPdfDoc(pdf);
      setShowPdfInResults(false);
      await processPdfData(pdf);

    } catch (error) {
      console.error("PDF Error:", error);
      alert("Error reading PDF. Please try another file.");
    } finally {
      setIsProcessing(false);
    }
  };

  const sendToGmail = () => {
    if (!extractedData) return;
    
    window.parent.postMessage({
        type: 'DAKOTA_COMPLETE',
        payload: {
            to: extractedData.brokerEmail || "",
            subject: `Confirmation Load #${extractedData.loadNumber}`,
            body: `Rate confirmed: $${extractedData.rate}. Thanks.`
        }
    }, "*");
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
    if (currentStepIndex < currentSteps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      setIsDriverModalOpen(true);
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    } else {
      setAppState('upload');
    }
  };

  const handleDriverNumberConfirm = (num: string) => {
    setTruckNumber(num);
    setIsDriverModalOpen(false);
    
    // If we were in the middle of a flow, finish it
    if (appState === 'verify') {
      finishVerification(null, num);
    }
  };

  const handleDataChange = (val: string) => {
    if (!currentSteps[currentStepIndex] || !extractedDataRef.current) return;
    const step = currentSteps[currentStepIndex];
    
    // Update ref synchronously to avoid stale closures and async state issues
    const newData = { ...extractedDataRef.current };
    
    if (step.stopIndex !== undefined && step.field) {
      const newStops = [...newData.stops];
      newStops[step.stopIndex] = {
        ...newStops[step.stopIndex],
        [step.field]: val
      };
      newData.stops = newStops;
      
      // Sync root fields if first/last stop changed
      if (step.stopIndex === 0) {
        if (step.field === 'address') newData.originAddress = val;
        if (step.field === 'date') newData.pickupDate = val;
        if (step.field === 'time') newData.pickupTime = val;
      }
      if (step.stopIndex === newData.stops.length - 1) {
        if (step.field === 'address') newData.destinationAddress = val;
        if (step.field === 'time') newData.deliveryTime = val;
      }
    } else {
      // @ts-ignore - dynamic key assignment
      newData[step.key as keyof ParsedRateCon] = val;
    }
    
    extractedDataRef.current = newData;
    setExtractedData(newData);
  };

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (appState !== 'verify') return;
      
      // Don't navigate if user is typing in an input, unless it's Enter
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        if (e.key === 'Enter') {
          handleNextStep();
        }
        return;
      }

      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        handleNextStep();
      } else if (e.key === 'ArrowLeft') {
        handlePrevStep();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [appState, currentStepIndex, extractedData]);

  const finishVerification = (dataOverride: ParsedRateCon | null = null, truckNumberOverride: string | null = null) => {
    const data = dataOverride || extractedDataRef.current;
    if (!data) return;
    
    const tNum = truckNumberOverride || truckNumber;

    // Format Outputs
    let route = "";
    if (data.stops && data.stops.length > 0) {
      route = data.stops.map(s => formatAddress(s.address || "Address Not Found", isSimplifiedAddress)).join("\n").toUpperCase();
    } else {
      route = `${formatAddress(data.originAddress || "Origin Not Found", isSimplifiedAddress)}\n${formatAddress(data.destinationAddress || "Dest Not Found", isSimplifiedAddress)}`.toUpperCase();
    }
    setRouteText(route);

    const chain = generateChainString(data, tNum, broker, team);
    setChainText(chain);

    const rename = generateRenameString(data, tNum);
    setRenameText(rename);

    let notes = `W${data.weight || "?"}\n`;
    if (data.stops && data.stops.length > 0) {
      data.stops.forEach(s => {
        const prefix = s.type === 'pickup' ? 'PU' : 'DEL';
        const label = s.label.match(/\d+/)?.[0] || "";
        notes += `${prefix}${label ? ' ' + label : ''} ${s.time || "?"}\n`;
      });
    } else {
      notes += `PU ${data.pickupTime || "?"}\nDEL ${data.deliveryTime || "?"}\n`;
    }
    notes += chain;
    setNotesText(notes);

    setIsViewingHistory(false);
    setCurrentHistoryItem(null);
    setAppState('results');

    // Save to History
    const now = new Date();
    const historyItem: HistoryItem = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: now.getTime(),
      dateStr: now.toISOString().split('T')[0],
      loadNumber: data.loadNumber || "UNKNOWN",
      broker: broker,
      rate: data.rate || "0",
      route: route,
      notes: notes,
      chain: chain,
      rename: rename
    };
    setHistory(prev => [historyItem, ...prev].slice(0, 100)); // Keep last 100
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

  // Update chain and notes when dependencies change (if in results view and NOT viewing history)
  useEffect(() => {
    if (appState === 'results' && extractedData && !isViewingHistory) {
      const chain = generateChainString(extractedData, truckNumber, broker, team);
      setChainText(chain);
      
      const rename = generateRenameString(extractedData, truckNumber);
      setRenameText(rename);
      
      // Update notes with new chain (replace last line)
      setNotesText(prev => {
        let notes = `W${extractedData.weight || "?"}\n`;
        if (extractedData.stops && extractedData.stops.length > 0) {
          extractedData.stops.forEach(s => {
            const prefix = s.type === 'pickup' ? 'PU' : 'DEL';
            const label = s.label.match(/\d+/)?.[0] || "";
            notes += `${prefix}${label ? ' ' + label : ''} ${s.time || "?"}\n`;
          });
        } else {
          notes += `PU ${extractedData.pickupTime || "?"}\nDEL ${extractedData.deliveryTime || "?"}\n`;
        }
        notes += chain;
        return notes;
      });
    }
  }, [truckNumber, broker, extractedData, team, isViewingHistory, appState]);

  useEffect(() => {
    if (appState === 'results' && extractedData && !isViewingHistory) {
      let route = "";
      if (extractedData.stops && extractedData.stops.length > 0) {
        route = extractedData.stops.map(s => formatAddress(s.address || "Address Not Found", isSimplifiedAddress)).join("\n").toUpperCase();
      } else {
        route = `${formatAddress(extractedData.originAddress || "Origin Not Found", isSimplifiedAddress)}\n${formatAddress(extractedData.destinationAddress || "Dest Not Found", isSimplifiedAddress)}`.toUpperCase();
      }
      setRouteText(route);
    }
  }, [isSimplifiedAddress, extractedData, appState, isViewingHistory]);

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
    const step = currentSteps[currentStepIndex];
    if (!step) return null;

    let value = "";
    if (step.stopIndex !== undefined && step.field) {
      value = extractedData.stops[step.stopIndex]?.[step.field] || "";
    } else {
      value = (extractedData[step.key as keyof ParsedRateCon] as string) || "";
    }

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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`${theme.cardBg} glass-card border ${theme.border} p-8 rounded-3xl shadow-2xl relative overflow-hidden`}
          >
            {/* Background Glow */}
            {isDarkMode && <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />}

            <div className="relative z-10 space-y-6">
              <div className="flex items-center justify-between">
                <span className={`text-xs font-medium ${isDarkMode ? 'text-indigo-400 border-indigo-500/30' : 'text-indigo-600 border-indigo-200'} uppercase tracking-widest border px-3 py-1 rounded-full`}>
                  Step {currentStepIndex + 1} of {currentSteps.length}
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
                  className={`px-6 py-3 rounded-xl border ${theme.border} ${theme.textMuted} hover:${theme.text} transition-colors flex items-center gap-2 glass-button`}
                >
                  <ChevronLeft size={18} />
                  Back
                </button>
                <button 
                  onClick={handleNextStep}
                  className={`flex-1 px-6 py-3 rounded-xl ${theme.accentBg} ${theme.accentHover} text-white font-medium shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 group glass-button border-none`}
                >
                  {currentStepIndex === currentSteps.length - 1 ? 'Finish & Generate' : 'Confirm & Next'}
                  <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  };

  const startOver = () => {
    setAppState('upload');
    setIsViewingHistory(false);
    setCurrentHistoryItem(null);
    setShowPdfInResults(false);
    setPdfLoadNumber(null);
    setPdfDoc(null);
  };

  const renderResults = () => {
    const isCurrentPdf = pdfDoc && pdfLoadNumber === (isViewingHistory ? currentHistoryItem?.loadNumber : extractedData?.loadNumber);

    return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-3">
          <h2 className={`text-2xl font-display font-medium ${theme.text}`}>
            {isViewingHistory ? currentHistoryItem?.loadNumber : (extractedData?.loadNumber || "Generated Output")}
          </h2>
          {(isViewingHistory ? currentHistoryItem?.rate : extractedData?.rate) && (
            <span className={`text-lg ${theme.textMuted} opacity-60 font-normal`}>
              ${isViewingHistory ? currentHistoryItem?.rate : extractedData?.rate}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {isCurrentPdf && (
            <button
              onClick={() => setShowPdfInResults(!showPdfInResults)}
              className={`px-4 py-2 rounded-lg border ${theme.border} ${theme.textMuted} hover:${theme.text} hover:${theme.cardBg} transition-all flex items-center gap-2 shadow-sm text-sm`}
            >
              <FileText size={16} className="text-indigo-500" />
              {showPdfInResults ? 'Hide RateCon' : 'View RateCon'}
            </button>
          )}
          <button 
            onClick={startOver}
            className={`text-sm ${theme.textMuted} hover:${theme.text} flex items-center gap-2 transition-colors`}
          >
            <RefreshCw size={14} />
            Start Over
          </button>
        </div>
      </div>

      {showPdfInResults && isCurrentPdf && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="h-[600px] rounded-2xl overflow-hidden border border-indigo-500/30 shadow-2xl shadow-indigo-500/10"
        >
          <PdfViewer 
            pdfDocument={pdfDoc} 
            highlightText="" 
            isDarkMode={isDarkMode} 
            isAutoZoomEnabled={false}
            dragSensitivity={dragSensitivity}
          />
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Box 1: Route */}
        <div className={`${theme.cardBg} glass-card rounded-2xl border ${theme.border} overflow-hidden flex flex-col hover:border-indigo-500/30 transition-colors group shadow-sm`}>
          <div className={`px-6 py-4 border-b ${theme.border} flex justify-between items-center ${isDarkMode ? 'bg-white/[0.02]' : 'bg-slate-50'}`}>
            <span className={`font-medium ${theme.textMuted} text-xs uppercase tracking-wider`}>ROUTE</span>
            <button 
              onClick={() => copyToClipboard(routeText, setCopiedRoute)}
              className={`${theme.textMuted} hover:text-indigo-400 transition-colors flex items-center gap-1.5 text-xs font-medium ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-white border-slate-200'} px-3 py-1.5 rounded-lg border hover:border-indigo-500/30 glass-button`}
            >
              {copiedRoute ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
              {copiedRoute ? "COPIED" : "COPY"}
            </button>
          </div>
          <textarea 
            value={routeText}
            onChange={(e) => setRouteText(e.target.value)}
            onContextMenu={(e) => handleQuickLook(e, routeText)}
            className={`w-full h-40 p-6 bg-transparent ${isDarkMode ? 'text-slate-200' : 'text-slate-700'} font-mono text-sm resize-none focus:outline-none leading-relaxed`}
            spellCheck={false}
          />
        </div>

        {/* Box 2: Notes */}
        <div className={`${theme.cardBg} glass-card rounded-2xl border ${theme.border} overflow-hidden flex flex-col hover:border-indigo-500/30 transition-colors group shadow-sm`}>
          <div className={`px-6 py-4 border-b ${theme.border} flex justify-between items-center ${isDarkMode ? 'bg-white/[0.02]' : 'bg-slate-50'}`}>
            <span className={`font-medium ${theme.textMuted} text-xs uppercase tracking-wider`}>NOTES</span>
            <button 
              onClick={() => copyToClipboard(notesText, setCopiedNotes)}
              className={`${theme.textMuted} hover:text-indigo-400 transition-colors flex items-center gap-1.5 text-xs font-medium ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-white border-slate-200'} px-3 py-1.5 rounded-lg border hover:border-indigo-500/30 glass-button`}
            >
              {copiedNotes ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
              {copiedNotes ? "COPIED" : "COPY"}
            </button>
          </div>
          <textarea 
            value={notesText}
            onChange={(e) => setNotesText(e.target.value)}
            onContextMenu={(e) => handleQuickLook(e, notesText)}
            className={`w-full h-40 p-6 bg-transparent ${isDarkMode ? 'text-slate-200' : 'text-slate-700'} font-mono text-sm resize-none focus:outline-none leading-relaxed`}
            spellCheck={false}
          />
        </div>

        {/* Box 3: Chain (Full Width) */}
        <div className={`md:col-span-2 ${theme.cardBg} glass-card rounded-2xl border ${theme.border} overflow-hidden flex flex-col hover:border-indigo-500/30 transition-colors group shadow-sm`}>
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
                  <button
                    key={t}
                    onClick={() => setTruckNumber(t)}
                    className={`px-2 py-1 text-xs rounded border ${truckNumber === t ? 'bg-indigo-500 text-white border-indigo-500' : `${theme.textMuted} border-transparent hover:bg-white/5`} glass-button`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* Broker Info (Fixed to TRAFFIX) */}
              <div className="flex items-center gap-2 ml-4">
                <span className={`px-2 py-1 text-xs rounded border bg-indigo-500/10 text-indigo-500 border-indigo-500/30 font-bold`}>
                  TRAFFIX
                </span>
              </div>
            </div>

            <button 
              onClick={() => copyToClipboard(chainText, setCopiedChain)}
              className={`${theme.textMuted} hover:text-indigo-400 transition-colors flex items-center gap-1.5 text-xs font-medium ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-white border-slate-200'} px-3 py-1.5 rounded-lg border hover:border-indigo-500/30 glass-button`}
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
              onContextMenu={(e) => handleQuickLook(e, chainText)}
              className={`w-full bg-transparent ${isDarkMode ? 'text-slate-200' : 'text-slate-700'} font-mono text-lg focus:outline-none`}
              spellCheck={false}
            />
          </div>
        </div>

        {/* Box 4: Rename (Full Width) */}
        <div className={`md:col-span-2 ${theme.cardBg} glass-card rounded-2xl border ${theme.border} overflow-hidden flex flex-col hover:border-indigo-500/30 transition-colors group shadow-sm`}>
          <div className={`px-6 py-4 border-b ${theme.border} flex justify-between items-center ${isDarkMode ? 'bg-white/[0.02]' : 'bg-slate-50'}`}>
            <span className={`font-medium ${theme.textMuted} text-xs uppercase tracking-wider`}>RENAME</span>
            <button 
              onClick={() => copyToClipboard(renameText, setCopiedRename)}
              className={`${theme.textMuted} hover:text-indigo-400 transition-colors flex items-center gap-1.5 text-xs font-medium ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-white border-slate-200'} px-3 py-1.5 rounded-lg border hover:border-indigo-500/30 glass-button`}
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
              onContextMenu={(e) => handleQuickLook(e, renameText)}
              className={`w-full bg-transparent ${isDarkMode ? 'text-slate-200' : 'text-slate-700'} font-mono text-lg focus:outline-none`}
              spellCheck={false}
            />
          </div>
        </div>
      </div>
    </div>
    );
  };

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.text} font-sans selection:bg-indigo-500/30 transition-colors duration-300 flex flex-col relative overflow-hidden`}>
      {isDarkMode && (
        <div className="atmospheric-bg">
          <div className="atmosphere-orb w-[600px] h-[600px] bg-indigo-600/20 -top-[200px] -left-[100px]" />
          <div className="atmosphere-orb w-[500px] h-[500px] bg-purple-600/10 bottom-[10%] -right-[100px]" style={{ animationDelay: '-5s' }} />
          <div className="atmosphere-orb w-[400px] h-[400px] bg-blue-600/10 top-[40%] left-[20%]" style={{ animationDelay: '-12s' }} />
        </div>
      )}
      <AnimatePresence>
        {isLoading && <LoadingScreen isDarkMode={isDarkMode} />}
      </AnimatePresence>
      <DottedMapBackground className="fixed inset-0" color={isDarkMode ? "#4F46E5" : "#94A3B8"} />
      
      {/* Header */}
      <header className={`border-b ${appState === 'verify' ? 'border-indigo-500/30' : theme.border} sticky top-0 z-20 ${theme.headerBg} transition-all duration-300 flex-none border-x-0 border-t-0 rounded-none relative`}>
        <div className="w-full px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setAppState('upload')}>
            <DakotaLogo className="w-7 h-7" />
            <h1 className={`text-2xl font-geologica font-bold tracking-tight ${theme.text} lowercase`}>dakota</h1>
          </div>

          {/* Header Search Bar */}
          <div className="flex-1 max-w-md mx-8 hidden sm:block">
            <div className="relative group">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${theme.textMuted} group-focus-within:text-indigo-500 transition-colors`} size={18} />
              <input 
                type="text"
                placeholder="Search history (Load #, Broker, Route)..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  if (appState !== 'history' && e.target.value.length > 0) {
                    setAppState('history');
                  }
                }}
                className={`w-full pl-10 pr-4 py-2 rounded-xl border ${theme.border} ${theme.inputBg} ${theme.text} text-sm focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/5 transition-all`}
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setAppState('templates')}
              className={`p-2 rounded-xl transition-all ${appState === 'templates' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25' : `${theme.textMuted} hover:${theme.cardBg} hover:${theme.text}`}`}
              title="Templates"
            >
              <ClipboardList size={20} />
            </button>
            <button 
              onClick={() => setAppState('history')}
              className={`p-2 rounded-xl transition-all ${appState === 'history' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25' : `${theme.textMuted} hover:${theme.cardBg} hover:${theme.text}`}`}
              title="History"
            >
              <Search size={20} />
            </button>
            <button 
              onClick={() => setAppState('manage')}
              className={`p-2 rounded-xl transition-all ${appState === 'manage' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25' : `${theme.textMuted} hover:${theme.cardBg} hover:${theme.text}`}`}
              title="Manage Data"
            >
              <Settings size={20} />
            </button>

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
      </div>

      {/* Progress Bar Line */}
      {appState === 'verify' && (
        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-indigo-500/10 overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${((currentStepIndex + 1) / currentSteps.length) * 100}%` }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
          />
        </div>
      )}
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
                className={`flex-1 flex flex-col items-center justify-center text-center space-y-6 transition-all duration-300 cursor-pointer rounded-3xl border-2 border-dashed ${isDragging ? 'border-indigo-500 bg-indigo-500/5 opacity-100 scale-[1.02]' : `${theme.border} opacity-50 hover:opacity-100`} glass-card`}
              >
                <input 
                  type="file" 
                  accept=".pdf" 
                  onChange={handleFileUpload}
                  className="hidden" 
                />
                <div className={`w-24 h-24 rounded-full ${theme.cardBg} border ${theme.border} flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm ${isDragging ? 'border-indigo-500 text-indigo-500' : ''} glass-card`}>
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
            {appState === 'manage' && (
              <ManageView 
                theme={theme}
                isDarkMode={isDarkMode}
                savedTrucks={savedTrucks}
                setSavedTrucks={setSavedTrucks}
                onBack={() => setAppState('upload')}
              />
            )}
            {appState === 'history' && (
              <HistoryView 
                theme={theme}
                isDarkMode={isDarkMode}
                history={history}
                onBack={() => {
                  setAppState('upload');
                  setIsViewingHistory(false);
                  setCurrentHistoryItem(null);
                }}
                searchTerm={searchTerm}
                onSelectItem={(item) => {
                  setIsViewingHistory(true);
                  setCurrentHistoryItem(item);
                  setRouteText(item.route);
                  setNotesText(item.notes);
                  setChainText(item.chain);
                  setRenameText(item.rename);
                  setAppState('results');
                }}
              />
            )}
            {appState === 'templates' && (
              <TemplatesView 
                theme={theme}
                isDarkMode={isDarkMode}
                onBack={() => setAppState('upload')}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Quick Look Popover */}
      <AnimatePresence>
        {quickLook.isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            style={{
              position: 'fixed',
              left: Math.min(quickLook.x + 20, window.innerWidth - 440),
              top: Math.min(quickLook.y - 150, window.innerHeight - 340),
              width: '400px',
              height: '300px',
              zIndex: 100,
            }}
            className={`${theme.cardBg} glass-card border-2 border-indigo-500/50 rounded-2xl shadow-2xl overflow-hidden pointer-events-none`}
          >
            <div className="absolute top-2 left-3 z-10 bg-indigo-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter shadow-lg">
              Quick Look
            </div>
            
            {pdfDoc ? (
              <PdfViewer 
                pdfDocument={pdfDoc} 
                highlightText={quickLook.text} 
                isDarkMode={isDarkMode} 
                isAutoZoomEnabled={true}
                dragSensitivity={dragSensitivity}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center space-y-3">
                <AlertTriangle className="text-amber-500" size={32} />
                <p className={`text-sm font-medium ${theme.text}`}>PDF not available for Quick Look</p>
                <p className={`text-xs ${theme.textMuted}`}>Quick Look only works for the document currently being processed.</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black/40 z-40"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className={`fixed right-0 top-0 bottom-0 w-72 ${isDarkMode ? 'bg-[#0F172A]' : 'bg-white'} border-l ${theme.border} z-50 shadow-2xl flex flex-col rounded-none border-y-0 border-r-0 overflow-hidden`}
            >
              <div className="p-5 flex justify-between items-center border-b border-white/5">
                <div className="flex items-center gap-2">
                  <Settings size={18} className="text-indigo-500" />
                  <h2 className="text-lg font-semibold font-display tracking-tight">Settings</h2>
                </div>
                <button 
                  onClick={() => setIsMenuOpen(false)} 
                  className={`p-1.5 rounded-full hover:${theme.cardBg} transition-colors`}
                >
                  <X size={20} className={theme.textMuted} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-8 custom-scrollbar">
                {/* Navigation Links (Mobile) */}
                <div className="md:hidden space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 px-1">Navigation</p>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        setAppState('templates');
                        setIsMenuOpen(false);
                      }}
                      className={`flex-1 flex items-center justify-center p-3 rounded-xl transition-all ${appState === 'templates' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : `${theme.textMuted} ${theme.cardBg} border ${theme.border}`}`}
                      title="Templates"
                    >
                      <ClipboardList size={20} />
                    </button>
                    <button 
                      onClick={() => {
                        setAppState('history');
                        setIsMenuOpen(false);
                      }}
                      className={`flex-1 flex items-center justify-center p-3 rounded-xl transition-all ${appState === 'history' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : `${theme.textMuted} ${theme.cardBg} border ${theme.border}`}`}
                      title="History"
                    >
                      <Search size={20} />
                    </button>
                    <button 
                      onClick={() => {
                        setAppState('manage');
                        setIsMenuOpen(false);
                      }}
                      className={`flex-1 flex items-center justify-center p-3 rounded-xl transition-all ${appState === 'manage' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : `${theme.textMuted} ${theme.cardBg} border ${theme.border}`}`}
                      title="Manage Data"
                    >
                      <Settings size={20} />
                    </button>
                  </div>
                </div>

                {/* Preferences Section */}
                <div className="space-y-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 px-1">Preferences</p>
                  
                  {/* Team Selector */}
                  <div className="space-y-2 px-1">
                    <label className="text-xs font-medium text-slate-400">Team Color</label>
                    <div className="flex items-center gap-2">
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
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all border-2 ${team === t.id ? 'border-indigo-500 scale-110 shadow-lg shadow-indigo-500/20' : 'border-transparent opacity-60 hover:opacity-100'}`}
                          title={t.label}
                        >
                           {t.id === 'none' ? 
                             <div className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center"><X size={10} className="text-white" /></div> : 
                             <span className="text-lg leading-none">{t.label}</span>
                           }
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Driver Number */}
                  <button 
                    onClick={() => {
                      setIsDriverModalOpen(true);
                      setIsMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border ${theme.border} ${theme.cardBg} hover:border-indigo-500/50 transition-all group`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                        <Hash size={16} />
                      </div>
                      <span className="text-sm font-medium">Driver Number</span>
                    </div>
                    <ChevronRight size={14} className="text-slate-600 group-hover:text-indigo-400 transition-colors" />
                  </button>

                  {/* Theme Toggle */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-xs font-medium text-slate-400">Appearance</span>
                      <span className="text-[10px] font-mono text-indigo-400 uppercase">{isDarkMode ? 'Dark' : 'Light'}</span>
                    </div>
                    <div className={`flex p-1 rounded-xl ${isDarkMode ? 'bg-black/20' : 'bg-slate-100'} border ${theme.border}`}>
                      <button 
                        onClick={() => setIsDarkMode(false)}
                        className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded-lg transition-all ${!isDarkMode ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-400'}`}
                      >
                        <Sun size={14} />
                        Light
                      </button>
                      <button 
                        onClick={() => setIsDarkMode(true)}
                        className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded-lg transition-all ${isDarkMode ? 'bg-slate-800 shadow-sm text-white' : 'text-slate-500 hover:text-slate-400'}`}
                      >
                        <Moon size={14} />
                        Dark
                      </button>
                    </div>
                  </div>

                  {/* Address Format Toggle */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-xs font-medium text-slate-400">Address Format</span>
                      <span className="text-[10px] font-mono text-indigo-400 uppercase">{isSimplifiedAddress ? 'Simple' : 'Full'}</span>
                    </div>
                    <div className={`flex p-1 rounded-xl ${isDarkMode ? 'bg-black/20' : 'bg-slate-100'} border ${theme.border}`}>
                      <button 
                        onClick={() => setIsSimplifiedAddress(false)}
                        className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${!isSimplifiedAddress ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-400'}`}
                      >
                        Full
                      </button>
                      <button 
                        onClick={() => setIsSimplifiedAddress(true)}
                        className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${isSimplifiedAddress ? 'bg-indigo-500 shadow-sm text-white' : 'text-slate-500 hover:text-slate-400'}`}
                      >
                        City/Zip
                      </button>
                    </div>
                  </div>

                  {/* Drag Sensitivity */}
                  <div className="space-y-3 px-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-400">Drag Sensitivity</span>
                      <span className="text-[10px] font-mono text-indigo-400">{dragSensitivity.toFixed(1)}x</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input 
                        type="range" 
                        min="0.5" 
                        max="3" 
                        step="0.1" 
                        value={dragSensitivity} 
                        onChange={(e) => setDragSensitivity(parseFloat(e.target.value))}
                        className="flex-1 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Info Section */}
                <div className="space-y-4 pt-4 border-t border-white/5">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-slate-500">
                      <HelpCircle size={14} />
                      <p className="text-[10px] font-bold uppercase tracking-widest">Help</p>
                    </div>
                    <ul className="text-xs text-slate-500 space-y-2 leading-relaxed px-1">
                      <li className="flex gap-2">
                        <span className="text-indigo-500">•</span>
                        <span>Upload PDF via sidebar</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-indigo-500">•</span>
                        <span>Verify data in wizard</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-indigo-500">•</span>
                        <span>Copy formatted route</span>
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Shield size={14} />
                      <p className="text-[10px] font-bold uppercase tracking-widest">Privacy</p>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed px-1">
                      Documents are processed locally. No data is uploaded to external servers.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5 border-t border-white/5 bg-black/5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-medium text-slate-600 uppercase tracking-tighter">Dakota Stable 0410</span>
                  <div className="flex gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <DriverNumberModal 
        isOpen={isDriverModalOpen}
        onClose={() => {
          setIsDriverModalOpen(false);
          if (appState === 'verify') finishVerification();
        }}
        onConfirm={handleDriverNumberConfirm}
        isDarkMode={isDarkMode}
        theme={theme}
      />
    </div>
  );
}
