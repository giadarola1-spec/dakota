/**
 * parser.ts - Logic to extract data from Rate Confirmation text
 * Uses a windowed regex strategy for improved accuracy.
 */

// Regex patterns
const PATTERNS = {
  loadNumber: [
    /(?:Load\s*#|Order\s*#|PO\s*#|PO\s*:|Order\s*:|Shipment\s*ID|Pro\s*#|Ref\s*#|Reference\s*#|Booking\s*#|Confirmation\s*#|Confirmation\s*-\s*#|Control\s*#|Trip\s*#|Job\s*#|Shipment\s*#|Arrive\s*Order|Convoy\s*ID|Reference\s*ID|Service\s*for\s*Load\s*#|Carrier\s*Confirmation\s*for\s*Load|FB\s*#)\s*[:.]?\s*([A-Z0-9-]{4,})/i,
    /(?:Ref\s*#|Reference)\s*[:.]?\s*([A-Z0-9-]{4,})/i,
    /\b(\d{7,})\b/
  ],
  weight: [
    /(?:Weight|Wt|Gross\s*Wt|Estimated\s*Weight|Total\s*Weight|Net\s*Wt|Actual\s*Wt|Wgt|Scale\s*Weight|Est\s*Wgt|Est\s*wgt|Exp\s*wt|Net\s*Weight|Kilograms)\s*[:.]?\s*(\d+(?:,\d{3})*|\d+)\s*(?:lbs|LBS|pounds|kgs|kg|kilograms)?/i,
    /(\d+(?:,\d{3})*|\d+)\s*(?:lbs|LBS|pounds|kgs|kg|kilograms)/i
  ],
  rate: [
    /(?:Rate|Total|Amount|Pay|Flat\s*Rate|Total\s*Pay|Total\s*Amount|Carrier\s*Pay|Linehaul|All-in|Grand\s*Total|Total\s*Carrier\s*Pay|Agreed\s*Amount|Total\s*Charges|Fuel\s*Surcharge|FSC|Accessorials|Lumper|Detention|Payout|Pay\s*Summary|Total\s*Rate|Carrier\s*Pay)\s*(?:USD|CAD|GBP)?\s*[:.]?\s*\$?\s*(\d+(?:,\d{3})(?:\.\d{2})?)/i,
    /(?:Rate|Total|Amount|Pay|Flat\s*Rate|Total\s*Pay|Total\s*Amount|Carrier\s*Pay|Linehaul|All-in|Grand\s*Total|Total\s*Carrier\s*Pay|Agreed\s*Amount|Total\s*Charges|Fuel\s*Surcharge|FSC|Accessorials|Lumper|Detention|Payout|Pay\s*Summary|Total\s*Rate|Carrier\s*Pay)\s*(?:USD|CAD|GBP)?\s*[:.]?\s*\$\s*(\d+(?:\.\d{2})?)/i,
    /(?:Rate|Total|Amount|Pay|Flat\s*Rate|Total\s*Pay|Total\s*Amount|Carrier\s*Pay|Linehaul|All-in|Grand\s*Total|Total\s*Carrier\s*Pay|Agreed\s*Amount|Total\s*Charges|Fuel\s*Surcharge|FSC|Accessorials|Lumper|Detention|Payout|Pay\s*Summary|Total\s*Rate|Carrier\s*Pay)\s*(?:USD|CAD|GBP)?\s*[:.]?\s*\$?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
    /\$\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/
  ],
  time: /(?:(?:Appt\s*|Appointment\s*Time\s*[:]?|Appointment\s*|Window\s*|ETA\s*|Scheduled\s*|Arrival\s*|Time\s*[:]?|Check-in|FCFS|ASAP|Delivery\s*Window|PU\s*Date\s*\/\s*Time|DEL\s*Date\s*\/\s*Time|Pick\s*up\s*time|Delivery\s*time|Schedule|Earliest|Latest|Appointment\s*Scheduled\s*For|Pick-up\s*Location|Delivery\s*Location)\s*[:.]?\s*)?(\d{1,2}:\d{2}\s*(?:AM|PM)?|\d{4}\s*hrs?|TBD|ASAP|FCFS)/i,
  date: /\b(\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4})\b/,
  timezone: /\b(EST|CST|MST|PST|EDT|CDT|MDT|PDT|AST|HST|AKST|AKDT|UTC|GMT)\b/i,
  address: [
    /(\d+\s+[A-Z0-9\s\.,#-]{2,60}?[A-Z]{2}\s+\d{5}(?:-\d{4})?)/i,
    /\b([A-Z][A-Za-z \t\.\/]{1,30})(?:,|\s+)\s*([A-Z]{2})\b(?:\s*(\d{5}(?:-\d{4})?))?/i
  ]
};

export interface Stop {
  type: 'pickup' | 'delivery';
  address: string;
  date: string;
  time: string;
  label: string;
}

export interface ParsedRateCon {
  loadNumber: string;
  weight: string;
  rate: string;
  stops: Stop[];
  pickupTime: string;
  pickupDate: string;
  deliveryTime: string;
  originAddress: string;
  destinationAddress: string;
  rawTextPreview: string;
}

/**
 * Windowed Regex Strategy:
 * Searches for a value within a specific character window after an anchor keyword.
 */
function extractInWindow(text: string, anchors: (string | RegExp)[], patterns: RegExp[], windowSize: number = 150): string {
  for (const anchor of anchors) {
    let anchorRegex: RegExp;
    if (anchor instanceof RegExp) {
      anchorRegex = new RegExp(anchor.source, anchor.flags + 'i');
    } else {
      // Escape anchor and make spaces flexible
      const escapedAnchor = anchor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s*');
      const startBound = /^\w/.test(anchor) ? '\\b' : '';
      // Only use end boundary if it ends with a word character
      const endBound = /\w$/.test(anchor) ? '\\b' : '';
      anchorRegex = new RegExp(`${startBound}${escapedAnchor}${endBound}`, 'i');
    }
    
    const match = text.match(anchorRegex);
    
    if (match && match.index !== undefined) {
      const start = match.index + match[0].length;
      const end = Math.min(start + windowSize, text.length);
      const window = text.substring(start, end);
      
      for (const pattern of patterns) {
        const valueMatch = window.match(pattern);
        if (valueMatch && valueMatch[1]) {
          return valueMatch[1].trim();
        }
      }
    }
  }
  return "";
}

export function parseRateConfirmation(text: string): ParsedRateCon {
  text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/[ \t]+/g, ' ');

  const cleanAddress = (addr: string): string => {
    if (!addr) return "";
    const cleaned = addr.replace(/^(?:\s*(?:LOCATION|DATE|TIME|PICK-UP|DELIVERY|DESTINATION|ORIGIN|SHIPPER|CONSIGNEE|PICKUP|ADDRESS|FROM|TO|RECEIVER|STOP\s*(?:#?\d+)?|LOADING|UNLOADING|PU|P\/U|DEL|FACILITY\s*NAME|SHIPPING\s*ADDRESS|RECEIVING\s*ADDRESS|DROP\s*OFF|PICK-UP\s*LOCATION|DELIVERY\s*LOCATION|DATE\s*TIME|NOTES|SPECIAL\s*INSTRUCTIONS|UP|PICK|INFO|CONTACT|NAME|PHONE|EMAIL|FAX|MC|DOT|DISPATCHER|DRIVER|TRUCK|TRAILER|LOAD|RATE|TYPE|UNIT|QUANTITY|TOTAL|MODE|SIZE|LINEAR|FEET|TEMPERATURE|PALLET|CASE|HAZMAT|WEIGHT|ESTIMATED|UNLOADING|RECEIPT|EXCHANGE|NOTE|CARRIER)\s*[:\/\-]?\s*)+/i, "").trim();
    
    const blacklist = [
      "1701 Edison Drive", "PO Box 9049", "Louisville, KY 40209", "Milford, OH 45150",
      "FLEET ONE FACTORING", "WEX", "PO BOX 94565", "CLEVELAND, OH 44101",
      "pickup / delivery", "pickup/delivery", "pickup / delivery OR BOTH",
      "delivery OR BOTH", "pickup / delivery OR"
    ];
    
    for (const item of blacklist) {
      if (cleaned.toUpperCase().includes(item.toUpperCase())) return "";
    }
    
    if (cleaned.length < 5) return "";
    return cleaned;
  };

  const result: ParsedRateCon = {
    loadNumber: "",
    weight: "",
    rate: "",
    stops: [],
    pickupTime: "",
    pickupDate: "",
    deliveryTime: "",
    originAddress: "",
    destinationAddress: "",
    rawTextPreview: text.substring(0, 200) + "..."
  };

  const normalizeWeight = (w: string): string => {
    if (!w) return "";
    const clean = w.replace(/,/g, '').trim();
    return clean ? `${clean} LBS` : "";
  };

  const normalizeDate = (d: string): string => {
    if (!d) return "";
    return d.replace(/[/.-]/g, '.');
  };

  const normalizeTime = (t: string): string => {
    if (!t) return "";
    const upper = t.toUpperCase();
    if (upper === "TBD" || upper === "ASAP" || upper === "FCFS") return upper;

    let clean = t.replace(/hrs?/i, '')
                 .replace(/Appointment\s*Time\s*[:]?/i, '')
                 .replace(/Appointment/i, '')
                 .replace(/Appt/i, '')
                 .replace(/Window/i, '')
                 .replace(/ETA/i, '')
                 .replace(/Scheduled/i, '')
                 .replace(/Arrival/i, '')
                 .replace(/Time\s*[:]?/i, '')
                 .trim();
    
    const isPM = /PM/i.test(clean);
    const isAM = /AM/i.test(clean);
    clean = clean.replace(/(?:AM|PM)/i, '').trim();
    
    if (!clean.includes(':') && clean.length === 4 && !isNaN(Number(clean))) {
      return `${clean.substring(0, 2)}:${clean.substring(2, 4)}`;
    }

    if (clean.includes(':')) {
      let [hours, minutes] = clean.split(':');
      let h = parseInt(hours, 10);
      let m = minutes.substring(0, 2).padStart(2, '0');
      
      if (isPM && h < 12) h += 12;
      if (isAM && h === 12) h = 0;
      
      return `${h.toString().padStart(2, '0')}:${m}`;
    }

    return clean;
  };

  // --- Windowed Extraction for Header Fields ---
  
  result.loadNumber = extractInWindow(text, 
    ['Traffix Load #', 'Load #', 'Order #', 'PO #', 'PO#', 'Shipment ID', 'Pro #', 'Ref #', 'Reference #', 'Booking #', 'Confirmation #', 'Trip #', 'Job #', 'Convoy ID', 'TQL PO#'], 
    [/\s*[:.]?\s*([A-Z0-9-]{4,})/i, /([A-Z0-9-]{4,})/i]
  ) || (text.match(PATTERNS.loadNumber[0])?.[1] || "");

  result.weight = normalizeWeight(extractInWindow(text, 
    ['Estimated Weight', 'Total Weight', 'Actual Weight', 'Gross Weight', 'Weight', 'Wt', 'Wgt', 'Est Wgt'], 
    [/\s*[:.]?\s*(\d+(?:,\d{3})*|\d+)/i]
  )) || normalizeWeight(text.match(PATTERNS.weight[0])?.[1] || "");

  // Rate extraction with scoring
  const rateAnchors = ['Rate', 'Total', 'Amount', 'Pay', 'Flat Rate', 'Carrier Pay', 'Linehaul', 'All-in', 'Grand Total', 'Agreed Amount'];
  let bestRate = "";
  let bestScore = -100;

  for (const anchor of rateAnchors) {
    const escaped = anchor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s*');
    const startBound = /^\w/.test(anchor) ? '\\b' : '';
    const endBound = /\w$/.test(anchor) ? '\\b' : '';
    const anchorRegex = new RegExp(`${startBound}${escaped}${endBound}`, 'i');
    
    const match = text.match(anchorRegex);
    if (match && match.index !== undefined) {
      const window = text.substring(match.index, Math.min(match.index + 100, text.length));
      for (const pattern of PATTERNS.rate) {
        const vMatch = window.match(pattern);
        if (vMatch && vMatch[1]) {
          const val = vMatch[1].replace(/,/g, '');
          const num = parseFloat(val);
          if (isNaN(num)) continue;
          let score = 0;
          if (window.includes('$')) score += 10;
          if (window.toUpperCase().includes('USD')) score += 10;
          if (anchor.toLowerCase().includes('total')) score += 5;
          
          // Penalty if it looks like a weight (e.g., TQL often has weight near rate labels)
          if (num > 10000) score -= 20; 

          if (score > bestScore) {
            bestScore = score;
            bestRate = val;
          }
        }
      }
    }
  }
  result.rate = bestRate || (text.match(PATTERNS.rate[0])?.[1]?.replace(/,/g, '') || "");

  // --- Multi-Stop Detection with Segmentation ---
  
  const stopMarkers = [
    { pattern: /(?:Shipper|Origin|Pickup|Pick-up)\s*-\s*(?:Pickup|Stop)\s*(\d+)\s*of\s*(\d+)/i, type: 'pickup', priority: 3 },
    { pattern: /(?:Consignee|Destination|Delivery)\s*-\s*(?:Delivery|Stop)\s*(\d+)\s*of\s*(\d+)/i, type: 'delivery', priority: 3 },
    { pattern: /Stop\s*#?\s*(\d+)\s*[:\-]?\s*(Pick|Del)/i, type: 'auto', priority: 2 },
    { pattern: /Stop\s*#?\s*(\d+)/i, type: 'auto', priority: 2 },
    // Flexible markers for TQL and others: look for label followed by colon/hyphen OR followed by "Date" (table header)
    { pattern: /(?:Shipper|Origin|Pickup|Pick-up)\s*(?:Location|Address)?(?:\s*[:\-]|(?=\s+Date))/i, type: 'pickup', priority: 1 },
    { pattern: /(?:Consignee|Destination|Delivery)\s*(?:Location|Address)?(?:\s*[:\-]|(?=\s+Date))/i, type: 'delivery', priority: 1 }
  ];

  let foundMarkers: { index: number, type: string, label: string, priority: number }[] = [];
  
  for (const marker of stopMarkers) {
    const matches = text.matchAll(new RegExp(marker.pattern, 'gi'));
    for (const match of matches) {
      let type = marker.type;
      let label = "";
      if (type === 'auto') {
        const sub = match[0].toLowerCase();
        type = sub.includes('pick') || sub.includes('shipper') ? 'pickup' : 'delivery';
      }
      if (match[1] && match[2]) {
        label = `${type.charAt(0).toUpperCase() + type.slice(1)} ${match[1]} of ${match[2]}`;
      } else if (match[1]) {
        label = `${type.charAt(0).toUpperCase() + type.slice(1)} ${match[1]}`;
      } else {
        label = `${type.charAt(0).toUpperCase() + type.slice(1)}`;
      }
      if (!foundMarkers.some(m => Math.abs(m.index - (match.index || 0)) < 15)) {
        foundMarkers.push({ index: match.index || 0, type, label, priority: marker.priority });
      }
    }
  }

  const maxPriority = foundMarkers.length > 0 ? Math.max(...foundMarkers.map(m => m.priority)) : 0;
  if (maxPriority > 1) {
    foundMarkers = foundMarkers.filter(m => m.priority === maxPriority);
  }
  foundMarkers.sort((a, b) => a.index - b.index);

  if (foundMarkers.length === 0) {
    // Improved fallback using regex to handle "pick-up" etc.
    const pickupMatch = text.match(/(?:pickup|pick-up|shipper|origin)/i);
    const deliveryMatch = text.match(/(?:delivery|consignee|destination)/i);
    
    if (pickupMatch) foundMarkers.push({ index: pickupMatch.index || 0, type: 'pickup', label: 'Pickup', priority: 1 });
    if (deliveryMatch) foundMarkers.push({ index: deliveryMatch.index || 0, type: 'delivery', label: 'Delivery', priority: 1 });
  }

  for (let i = 0; i < foundMarkers.length; i++) {
    const start = foundMarkers[i].index;
    const end = (i < foundMarkers.length - 1) ? foundMarkers[i + 1].index : text.length;
    const section = text.substring(start, end);
    
    // Windowed extraction within the stop section
    const timeMatch = section.match(PATTERNS.time);
    let time = timeMatch ? normalizeTime(timeMatch[1]) : "";
    const tzMatch = section.match(PATTERNS.timezone);
    if (time && tzMatch) time += ` ${tzMatch[1].toUpperCase()}`;

    const dateMatch = section.match(PATTERNS.date);
    const date = dateMatch ? normalizeDate(dateMatch[1]) : "";

    // Address extraction: look for the first valid address in the section
    let address = "";
    for (const pattern of PATTERNS.address) {
      const mAll = section.matchAll(new RegExp(pattern, 'gi'));
      for (const m of mAll) {
        const cleaned = cleanAddress(m[0]);
        if (cleaned) {
          address = cleaned;
          break;
        }
      }
      if (address) break;
    }

    result.stops.push({
      type: foundMarkers[i].type as 'pickup' | 'delivery',
      label: foundMarkers[i].label,
      address,
      date,
      time
    });
  }

  const uniqueStops: Stop[] = [];
  for (const stop of result.stops) {
    if (stop.address && !uniqueStops.some(s => s.address === stop.address)) {
      uniqueStops.push(stop);
    }
  }
  result.stops = uniqueStops;

  const pickups = result.stops.filter(s => s.type === 'pickup');
  const deliveries = result.stops.filter(s => s.type === 'delivery');

  if (pickups.length > 0) {
    result.pickupTime = pickups[0].time;
    result.pickupDate = pickups[0].date;
    result.originAddress = pickups[0].address;
  }
  if (deliveries.length > 0) {
    const lastDel = deliveries[deliveries.length - 1];
    result.deliveryTime = lastDel.time;
    result.destinationAddress = lastDel.address;
  }

  return result;
}
