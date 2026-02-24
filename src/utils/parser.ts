/**
 * parser.ts - Logic to extract data from Rate Confirmation text
 */

// Regex patterns
const PATTERNS = {
  loadNumber: [
    /(?:Load\s*#|Order\s*#|PO\s*#|PO\s*:|Order\s*:|Shipment\s*ID|Pro\s*#|Ref\s*#|Reference\s*#|Booking\s*#|Confirmation\s*#|Confirmation\s*-\s*#|Control\s*#|Trip\s*#|Job\s*#|Shipment\s*#|Arrive\s*Order|Convoy\s*ID|Reference\s*ID|Service\s*for\s*Load\s*#|Carrier\s*Confirmation\s*for\s*Load|FB\s*#)\s*[:.]?\s*([A-Z0-9-]{4,})/i,
    /(?:Ref\s*#|Reference)\s*[:.]?\s*([A-Z0-9-]{4,})/i,
    /\b(\d{7,})\b/ // Fallback for long numeric strings
  ],
  weight: [
    /(?:Weight|Wt|Gross\s*Wt|Estimated\s*Weight|Total\s*Weight|Net\s*Wt|Actual\s*Wt|Wgt|Scale\s*Weight|Est\s*Wgt|Est\s*wgt|Exp\s*wt|Net\s*Weight|Kilograms)\s*[:.]?\s*(\d+(?:,\d{3})*|\d+)\s*(?:lbs|LBS|pounds|kgs|kg|kilograms)?/i,
    /(\d+(?:,\d{3})*|\d+)\s*(?:lbs|LBS|pounds|kgs|kg|kilograms)/i
  ],
  rate: [
    /(?:Rate|Total|Amount|Pay|Flat\s*Rate|Total\s*Pay|Total\s*Amount|Carrier\s*Pay|Linehaul|All-in|Grand\s*Total|Total\s*Carrier\s*Pay|Agreed\s*Amount|Total\s*Charges|Fuel\s*Surcharge|FSC|Accessorials|Lumper|Detention|Payout|Pay\s*Summary|Total\s*Rate|Carrier\s*Pay)\s*(?:USD|CAD|GBP)?\s*[:.]?\s*\$?\s*(\d+(?:,\d{3})(?:\.\d{2})?)/i, // Prefer matches with commas and decimals
    /(?:Rate|Total|Amount|Pay|Flat\s*Rate|Total\s*Pay|Total\s*Amount|Carrier\s*Pay|Linehaul|All-in|Grand\s*Total|Total\s*Carrier\s*Pay|Agreed\s*Amount|Total\s*Charges|Fuel\s*Surcharge|FSC|Accessorials|Lumper|Detention|Payout|Pay\s*Summary|Total\s*Rate|Carrier\s*Pay)\s*(?:USD|CAD|GBP)?\s*[:.]?\s*\$\s*(\d+(?:\.\d{2})?)/i, // Prefer matches with $
    /(?:Rate|Total|Amount|Pay|Flat\s*Rate|Total\s*Pay|Total\s*Amount|Carrier\s*Pay|Linehaul|All-in|Grand\s*Total|Total\s*Carrier\s*Pay|Agreed\s*Amount|Total\s*Charges|Fuel\s*Surcharge|FSC|Accessorials|Lumper|Detention|Payout|Pay\s*Summary|Total\s*Rate|Carrier\s*Pay)\s*(?:USD|CAD|GBP)?\s*[:.]?\s*\$?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
    /\$\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/
  ],
  // Time patterns: Look for HH:MM AM/PM, Military, or TBD
  // Made prefix optional to catch standalone values like "TBD"
  time: /(?:(?:Appt\s*|Appointment\s*Time\s*[:]?|Appointment\s*|Window\s*|ETA\s*|Scheduled\s*|Arrival\s*|Time\s*[:]?|Check-in|FCFS|ASAP|Delivery\s*Window|PU\s*Date\s*\/\s*Time|DEL\s*Date\s*\/\s*Time|Pick\s*up\s*time|Delivery\s*time|Schedule|Earliest|Latest|Appointment\s*Scheduled\s*For|Pick-up\s*Location|Delivery\s*Location)\s*[:.]?\s*)?(\d{1,2}:\d{2}\s*(?:AM|PM)?|\d{4}\s*hrs?|TBD|ASAP|FCFS)/i,
  
  // Date pattern: MM/DD/YYYY, MM-DD-YYYY, MM.DD.YYYY
  date: /\b(\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4})\b/,

  // Timezone pattern
  timezone: /\b(EST|CST|MST|PST|EDT|CDT|MDT|PDT|AST|HST|AKST|AKDT|UTC|GMT)\b/i,

  // Address patterns
  address: [
    // Pattern for Street, City, ST Zip (e.g., 5505 BROOKVILLE RD INDIANAPOLIS, IN 45235)
    /(\d+\s+[A-Z0-9\s\.,#-]{2,60}?[A-Z]{2}\s+\d{5}(?:-\d{4})?)/i,
    // Fallback for City, ST Zip (or just City, ST)
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
 * Parses raw text to find Rate Confirmation details.
 */
export function parseRateConfirmation(text: string): ParsedRateCon {
  // Normalize text: line endings, multiple spaces, etc.
  text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/[ \t]+/g, ' ');

  const cleanAddress = (addr: string): string => {
    if (!addr) return "";
    // Remove common header words that might be captured, potentially multiple times
    const cleaned = addr.replace(/^(?:\s*(?:LOCATION|DATE|TIME|PICK-UP|DELIVERY|DESTINATION|ORIGIN|SHIPPER|CONSIGNEE|PICKUP|ADDRESS|FROM|TO|RECEIVER|STOP\s*(?:#?\d+)?|LOADING|UNLOADING|PU|P\/U|DEL|FACILITY\s*NAME|SHIPPING\s*ADDRESS|RECEIVING\s*ADDRESS|DROP\s*OFF|PICK-UP\s*LOCATION|DELIVERY\s*LOCATION|DATE\s*TIME|NOTES|SPECIAL\s*INSTRUCTIONS|UP|PICK|INFO|CONTACT|NAME|PHONE|EMAIL|FAX|MC|DOT|DISPATCHER|DRIVER|TRUCK|TRAILER|LOAD|RATE|TYPE|UNIT|QUANTITY|TOTAL|MODE|SIZE|LINEAR|FEET|TEMPERATURE|PALLET|CASE|HAZMAT|WEIGHT|ESTIMATED|UNLOADING|RECEIPT|EXCHANGE|NOTE|CARRIER)\s*[:\/\-]?\s*)+/i, "").trim();
    
    // Blacklist for corporate addresses and common false positives
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

  // Helper to extract first match
  const extract = (patterns: RegExp[], text: string): string => {
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    return "";
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

  // Improved Rate extraction
  const rateMatches: { value: string, score: number }[] = [];
  for (const pattern of PATTERNS.rate) {
    const matches = text.matchAll(new RegExp(pattern, 'gi'));
    for (const match of matches) {
      if (match[1]) {
        let score = 0;
        const val = match[1].replace(/,/g, '');
        const num = parseFloat(val);
        if (isNaN(num)) continue;
        if (match[0].includes('$')) score += 10;
        if (match[0].toUpperCase().includes('USD')) score += 10;
        if (match[0].toLowerCase().includes('total')) score += 5;
        if (match[0].toLowerCase().includes('agreed')) score += 5;
        if (match[0].toLowerCase().includes('miles')) score -= 20;
        if (match[0].toLowerCase().includes('weight')) score -= 20;
        if (match[0].toLowerCase().includes('pieces')) score -= 20;
        if (num < 50) score -= 15;
        rateMatches.push({ value: val, score });
      }
    }
  }
  
  if (rateMatches.length > 0) {
    rateMatches.sort((a, b) => b.score - a.score);
    result.rate = rateMatches[0].value;
  }

  result.loadNumber = extract(PATTERNS.loadNumber, text);
  result.weight = normalizeWeight(extract(PATTERNS.weight, text));

  // --- Multi-Stop Detection ---
  
  const stopMarkers = [
    { pattern: /(?:Shipper|Origin|Pickup)\s*-\s*(?:Pickup|Stop)\s*(\d+)\s*of\s*(\d+)/i, type: 'pickup', priority: 2 },
    { pattern: /(?:Consignee|Destination|Delivery)\s*-\s*(?:Delivery|Stop)\s*(\d+)\s*of\s*(\d+)/i, type: 'delivery', priority: 2 },
    { pattern: /Stop\s*#?\s*(\d+)\s*[:\-]?\s*(Pick|Del)/i, type: 'auto', priority: 2 },
    { pattern: /Stop\s*#?\s*(\d+)/i, type: 'auto', priority: 2 },
    { pattern: /(?:Shipper|Origin|Pickup)\s*[:\-]/i, type: 'pickup', priority: 1 },
    { pattern: /(?:Consignee|Destination|Delivery)\s*[:\-]/i, type: 'delivery', priority: 1 }
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
      
      // Avoid duplicates at same index
      if (!foundMarkers.some(m => Math.abs(m.index - (match.index || 0)) < 10)) {
        foundMarkers.push({ index: match.index || 0, type, label, priority: marker.priority });
      }
    }
  }

  // If we found high priority markers (numbered stops), filter out low priority ones (generic headers)
  const maxPriority = foundMarkers.length > 0 ? Math.max(...foundMarkers.map(m => m.priority)) : 0;
  if (maxPriority > 1) {
    foundMarkers = foundMarkers.filter(m => m.priority === maxPriority);
  }

  foundMarkers.sort((a, b) => a.index - b.index);

  // If no markers found, use legacy logic as fallback
  if (foundMarkers.length === 0) {
    const pickupIdx = text.toLowerCase().indexOf('pickup');
    const deliveryIdx = text.toLowerCase().indexOf('delivery', pickupIdx + 1);
    
    if (pickupIdx !== -1) foundMarkers.push({ index: pickupIdx, type: 'pickup', label: 'Pickup', priority: 1 });
    if (deliveryIdx !== -1) foundMarkers.push({ index: deliveryIdx, type: 'delivery', label: 'Delivery', priority: 1 });
  }

  // Split text into sections based on markers
  for (let i = 0; i < foundMarkers.length; i++) {
    const start = foundMarkers[i].index;
    const end = (i < foundMarkers.length - 1) ? foundMarkers[i + 1].index : text.length;
    const section = text.substring(start, end);
    
    const findEarliestAddress = (sec: string): string => {
      const matches: { text: string, index: number, patternIdx: number }[] = [];
      for (let j = 0; j < PATTERNS.address.length; j++) {
        const pattern = PATTERNS.address[j];
        const mAll = sec.matchAll(new RegExp(pattern, 'gi'));
        for (const m of mAll) {
          const cleaned = cleanAddress(m[0]);
          if (cleaned) matches.push({ text: cleaned, index: m.index || 0, patternIdx: j });
        }
      }
      if (matches.length === 0) return "";
      const full = matches.filter(m => m.patternIdx === 0).sort((a, b) => a.index - b.index);
      if (full.length > 0) return full[0].text;
      matches.sort((a, b) => a.index - b.index);
      return matches[0].text;
    };

    const timeMatch = section.match(PATTERNS.time);
    let time = timeMatch ? normalizeTime(timeMatch[1]) : "";
    const tzMatch = section.match(PATTERNS.timezone);
    if (time && tzMatch) time += ` ${tzMatch[1].toUpperCase()}`;

    const dateMatch = section.match(PATTERNS.date);
    const date = dateMatch ? normalizeDate(dateMatch[1]) : "";
    const address = findEarliestAddress(section);

    result.stops.push({
      type: foundMarkers[i].type as 'pickup' | 'delivery',
      label: foundMarkers[i].label,
      address,
      date,
      time
    });
  }

  // Deduplicate stops by address to avoid redundant steps for the same location
  const uniqueStops: Stop[] = [];
  for (const stop of result.stops) {
    if (stop.address && !uniqueStops.some(s => s.address === stop.address)) {
      uniqueStops.push(stop);
    }
  }
  result.stops = uniqueStops;

  // Populate legacy fields for compatibility
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
