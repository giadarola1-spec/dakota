/**
 * parser.ts - Logic to extract data from Rate Confirmation text
 */

// Regex patterns
const PATTERNS = {
  loadNumber: [
    /(?:Load\s*#|Order\s*#|PO\s*#|PO\s*:|Order\s*:|Shipment\s*ID|Pro\s*#|Ref\s*#|Reference\s*#|Booking\s*#|Confirmation\s*#|Control\s*#|Trip\s*#|Job\s*#|Shipment\s*#)\s*[:.]?\s*([A-Z0-9-]{4,})/i,
    /(?:Ref\s*#|Reference)\s*[:.]?\s*([A-Z0-9-]{4,})/i,
    /\b(\d{7,})\b/ // Fallback for long numeric strings
  ],
  weight: [
    /(?:Weight|Wt|Gross\s*Wt|Estimated\s*Weight|Total\s*Weight|Net\s*Wt|Actual\s*Wt|Wgt|Scale\s*Weight|Est\s*Wgt|Net\s*Weight|Kilograms)\s*[:.]?\s*(\d+(?:,\d{3})*|\d+)\s*(?:lbs|LBS|pounds|kgs|kg|kilograms)?/i,
    /(\d+(?:,\d{3})*|\d+)\s*(?:lbs|LBS|pounds|kgs|kg|kilograms)/i
  ],
  rate: [
    /(?:Rate|Total|Amount|Pay|Flat\s*Rate|Total\s*Pay|Total\s*Amount|Carrier\s*Pay|Linehaul|All-in|Grand\s*Total|Total\s*Carrier\s*Pay|Agreed\s*Amount|Total\s*Charges|Fuel\s*Surcharge|FSC|Accessorials|Lumper|Detention)\s*(?:USD|CAD|GBP)?\s*[:.]?\s*\$?\s*(\d+(?:,\d{3})(?:\.\d{2})?)/i, // Prefer matches with commas and decimals
    /(?:Rate|Total|Amount|Pay|Flat\s*Rate|Total\s*Pay|Total\s*Amount|Carrier\s*Pay|Linehaul|All-in|Grand\s*Total|Total\s*Carrier\s*Pay|Agreed\s*Amount|Total\s*Charges|Fuel\s*Surcharge|FSC|Accessorials|Lumper|Detention)\s*(?:USD|CAD|GBP)?\s*[:.]?\s*\$\s*(\d+(?:\.\d{2})?)/i, // Prefer matches with $
    /(?:Rate|Total|Amount|Pay|Flat\s*Rate|Total\s*Pay|Total\s*Amount|Carrier\s*Pay|Linehaul|All-in|Grand\s*Total|Total\s*Carrier\s*Pay|Agreed\s*Amount|Total\s*Charges|Fuel\s*Surcharge|FSC|Accessorials|Lumper|Detention)\s*(?:USD|CAD|GBP)?\s*[:.]?\s*\$?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
    /\$\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/
  ],
  // Time patterns: Look for HH:MM AM/PM, Military, or TBD
  // Made prefix optional to catch standalone values like "TBD"
  time: /(?:(?:Appt\s*|Appointment\s*Time\s*[:]?|Appointment\s*|Window\s*|ETA\s*|Scheduled\s*|Arrival\s*|Time\s*[:]?|Check-in|FCFS|ASAP|Delivery\s*Window|PU\s*Date\s*\/\s*Time|DEL\s*Date\s*\/\s*Time|Schedule)\s*[:.]?\s*)?(\d{1,2}:\d{2}\s*(?:AM|PM)?|\d{4}\s*hrs?|TBD|ASAP|FCFS)/i,
  
  // Date pattern: MM/DD/YYYY, MM-DD-YYYY, MM.DD.YYYY
  date: /\b(\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4})\b/,

  // Timezone pattern
  timezone: /\b(EST|CST|MST|PST|EDT|CDT|MDT|PDT|AST|HST|AKST|AKDT|UTC|GMT)\b/i,

  // Address patterns
  address: [
    // Pattern for Street, City, ST Zip (e.g., 5505 BROOKVILLE RD INDIANAPOLIS, IN 45235)
    /(\d+\s+[A-Z0-9\s\.,#-]{2,60}?[A-Z]{2}\s+\d{5}(?:-\d{4})?)/i,
    // Fallback for City, ST Zip
    /([A-Z][A-Za-z \.\/]{1,30}?)(?:,|\s+)\s*([A-Z]{2})\b(?:\s+((?:\d{5})(?:-\d{4})?))?/
  ]
};

export interface Stop {
  type: 'pickup' | 'delivery';
  date: string;
  time: string;
  address: string;
  sequence: number;
}

export interface ParsedRateCon {
  loadNumber: string;
  weight: string;
  rate: string;
  stops: Stop[];
  rawTextPreview: string;
}

/**
 * Parses raw text to find Rate Confirmation details.
 */
export function parseRateConfirmation(text: string): ParsedRateCon {
  const cleanAddress = (addr: string): string => {
    if (!addr) return "";
    // Remove common header words that might be captured, potentially multiple times
    return addr.replace(/^(?:\s*(?:LOCATION|DATE|TIME|PICK-UP|DELIVERY|DESTINATION|ORIGIN|SHIPPER|CONSIGNEE|PICKUP|ADDRESS|FROM|TO|RECEIVER|STOP\s*(?:#?\d+)?|LOADING|UNLOADING|PU|P\/U|DEL|FACILITY\s*NAME|SHIPPING\s*ADDRESS|RECEIVING\s*ADDRESS|DROP\s*OFF)\s*[:]?\s*)+/i, "").trim();
  };

  const result: ParsedRateCon = {
    loadNumber: "",
    weight: "",
    rate: "",
    stops: [],
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
    // Replace / or - with .
    return d.replace(/[/.-]/g, '.');
  };

  const normalizeTime = (t: string): string => {
    if (!t) return "";
    if (t.toUpperCase() === "TBD") return "TBD";

    // Remove common prefixes and suffixes
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
    
    // Detect AM/PM
    const isPM = /PM/i.test(clean);
    const isAM = /AM/i.test(clean);
    
    // Remove AM/PM text
    clean = clean.replace(/(?:AM|PM)/i, '').trim();
    
    // Handle "1400" case (already military, no colon)
    if (!clean.includes(':') && clean.length === 4 && !isNaN(Number(clean))) {
      return clean;
    }

    // Handle "14:00" or "2:00"
    if (clean.includes(':')) {
      let [hours, minutes] = clean.split(':');
      let h = parseInt(hours, 10);
      
      if (isPM && h < 12) h += 12;
      if (isAM && h === 12) h = 0;
      
      return `${h.toString().padStart(2, '0')}${minutes.substring(0, 2)}`;
    }

    return clean; // Fallback
  };

  // Improved Rate extraction: Look for the most likely "Total" amount
  const rateMatches: { value: string, score: number }[] = [];
  for (const pattern of PATTERNS.rate) {
    const matches = text.matchAll(new RegExp(pattern, 'gi'));
    for (const match of matches) {
      if (match[1]) {
        let score = 0;
        const val = match[1].replace(/,/g, '');
        const num = parseFloat(val);
        
        if (isNaN(num)) continue;
        
        // Prioritize matches with $ or currency codes
        if (match[0].includes('$')) score += 10;
        if (match[0].toUpperCase().includes('USD')) score += 10;
        
        // Prioritize "Total" or "Agreed Amount"
        if (match[0].toLowerCase().includes('total')) score += 5;
        if (match[0].toLowerCase().includes('agreed')) score += 5;
        
        // Penalize matches that look like counts or miles
        if (match[0].toLowerCase().includes('miles')) score -= 20;
        if (match[0].toLowerCase().includes('weight')) score -= 20;
        if (match[0].toLowerCase().includes('pieces')) score -= 20;
        
        // Penalize very small numbers (likely not a rate)
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

  // --- Multi-Stop Extraction ---
  
  const lowerText = text.toLowerCase();

  // 1. Find all stop markers and their positions
  const stopMarkers: { index: number, type: 'pickup' | 'delivery' }[] = [];
  
  const pickupKeys = ["shipper - pickup", "shipper:", "origin:", "stop 1", "stop #1", "pickup 1 of", "pick up", "pick-up", "pickup"];
  const deliveryKeys = ["consignee - delivery", "consignee:", "destination:", "stop 2", "stop #2", "delivery 1 of", "delivery", "dest", "drop", "unloading", "receiver"];

  pickupKeys.forEach(key => {
    let pos = lowerText.indexOf(key);
    while (pos !== -1) {
      stopMarkers.push({ index: pos, type: 'pickup' });
      pos = lowerText.indexOf(key, pos + 1);
    }
  });

  deliveryKeys.forEach(key => {
    let pos = lowerText.indexOf(key);
    while (pos !== -1) {
      stopMarkers.push({ index: pos, type: 'delivery' });
      pos = lowerText.indexOf(key, pos + 1);
    }
  });

  // 2. Sort and filter markers (remove duplicates or very close markers)
  stopMarkers.sort((a, b) => a.index - b.index);
  
  const uniqueMarkers: typeof stopMarkers = [];
  stopMarkers.forEach(m => {
    if (uniqueMarkers.length === 0 || m.index > uniqueMarkers[uniqueMarkers.length - 1].index + 50) {
      uniqueMarkers.push(m);
    }
  });

  // 3. Extract data for each stop section
  uniqueMarkers.forEach((marker, i) => {
    const start = marker.index;
    const end = uniqueMarkers[i + 1] ? uniqueMarkers[i + 1].index : text.length;
    const section = text.substring(start, end);
    
    const stop: Stop = {
      type: marker.type,
      date: "",
      time: "",
      address: "",
      sequence: i + 1
    };

    // Extract Date
    const dateMatch = section.match(PATTERNS.date);
    if (dateMatch) stop.date = normalizeDate(dateMatch[1]);

    // Extract Time
    const timeMatch = section.match(PATTERNS.time);
    if (timeMatch) {
      let time = normalizeTime(timeMatch[1]);
      const tzMatch = section.match(PATTERNS.timezone);
      if (tzMatch) {
        time += ` ${tzMatch[1].toUpperCase()}`;
      }
      stop.time = time;
    }

    // Extract Address
    const addrMatch = section.match(PATTERNS.address[0]) || section.match(PATTERNS.address[1]);
    if (addrMatch) {
      stop.address = cleanAddress(addrMatch[0] || addrMatch[1]);
    }

    result.stops.push(stop);
  });

  // Fallback if no stops found
  if (result.stops.length === 0) {
    // Try to find at least one address anywhere
    const allAddresses = Array.from(text.matchAll(new RegExp(PATTERNS.address[0], 'gi')));
    if (allAddresses.length > 0) {
      result.stops.push({
        type: 'pickup',
        date: normalizeDate(extract([PATTERNS.date], text)),
        time: normalizeTime(extract([PATTERNS.time], text)),
        address: cleanAddress(allAddresses[0][0]),
        sequence: 1
      });
    }
  }

  return result;
}
