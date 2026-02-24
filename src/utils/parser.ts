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
    /\b([A-Z][A-Za-z\s\.\/]{1,30})(?:,|\s+)\s*([A-Z]{2})\b(?:\s*(\d{5}(?:-\d{4})?))?/i
  ]
};

export interface ParsedRateCon {
  loadNumber: string;
  weight: string;
  rate: string;
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
  const cleanAddress = (addr: string): string => {
    if (!addr) return "";
    // Remove common header words that might be captured, potentially multiple times
    // Added more TQL/Traffix specific noise like "Location", "Date", "Time", "Notes"
    // Also allowed / and - as separators in the prefix
    const cleaned = addr.replace(/^(?:\s*(?:LOCATION|DATE|TIME|PICK-UP|DELIVERY|DESTINATION|ORIGIN|SHIPPER|CONSIGNEE|PICKUP|ADDRESS|FROM|TO|RECEIVER|STOP\s*(?:#?\d+)?|LOADING|UNLOADING|PU|P\/U|DEL|FACILITY\s*NAME|SHIPPING\s*ADDRESS|RECEIVING\s*ADDRESS|DROP\s*OFF|PICK-UP\s*LOCATION|DELIVERY\s*LOCATION|DATE\s*TIME|NOTES|SPECIAL\s*INSTRUCTIONS)\s*[:\/\-]?\s*)+/i, "").trim();
    
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
    
    // If it's just a few characters or just "OR", it's likely a false positive
    if (cleaned.length < 5) return "";
    
    return cleaned;
  };

  const result: ParsedRateCon = {
    loadNumber: "",
    weight: "",
    rate: "",
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
    // Replace / or - with .
    return d.replace(/[/.-]/g, '.');
  };

  const normalizeTime = (t: string): string => {
    if (!t) return "";
    const upper = t.toUpperCase();
    if (upper === "TBD" || upper === "ASAP" || upper === "FCFS") return upper;

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
      return `${clean.substring(0, 2)}:${clean.substring(2, 4)}`;
    }

    // Handle "14:00" or "2:00"
    if (clean.includes(':')) {
      let [hours, minutes] = clean.split(':');
      let h = parseInt(hours, 10);
      let m = minutes.substring(0, 2).padStart(2, '0');
      
      if (isPM && h < 12) h += 12;
      if (isAM && h === 12) h = 0;
      
      return `${h.toString().padStart(2, '0')}:${m}`;
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

  // Context-aware parsing for Times and Addresses
  // Strategy: Find First Pickup and First Delivery after Pickup
  
  const lowerText = text.toLowerCase();
  
  // Stronger anchors for sections to avoid false positives in notes
  // We prioritize these over generic "pickup" or "delivery" words which might appear in notes
  const pickupAnchors = [
    "shipper - pickup", "shipper:", "origin:", "stop 1", "stop #1", "pickup 1 of", 
    "shipper", "origin", "pick up at", "picking up at", "pickup", "pku#",
    "stop 1: pick up", "stop 1: pickup", "load at", "load at:", "shipper :", "name/address",
    "pick-up location", "pick-up", "pickup location"
  ];
  const pickupKeys = [
    "pick up", "pick-up", "pickup", "loading", "pu", "p/u", "facility name", "shipping address", "pick-up location"
  ];
  
  let firstPickupIdx = -1;
  // Try anchors first
  for (const key of pickupAnchors) {
    const idx = lowerText.indexOf(key);
    if (idx !== -1 && (firstPickupIdx === -1 || idx < firstPickupIdx)) {
      firstPickupIdx = idx;
    }
  }
  // If no anchor found, try keys
  if (firstPickupIdx === -1) {
    for (const key of pickupKeys) {
      const idx = lowerText.indexOf(key);
      if (idx !== -1 && (firstPickupIdx === -1 || idx < firstPickupIdx)) {
        firstPickupIdx = idx;
      }
    }
  }

  const deliveryAnchors = [
    "consignee - delivery", "consignee:", "destination:", "stop 2", "stop #2", "delivery 1 of",
    "consignee", "destination", "deliver to", "delivering to", "drop off at", "receiver", "receiver #1",
    "drop", "delv#", "stop 2: delivery", "stop 2: drop", "consignee #", "unload",
    "delivery location"
  ];
  const deliveryKeys = [
    "delivery", "dest", "drop", "unloading", "receiver", "del", "unloading point", "drop off", "receiving address", "delivery location", "unload"
  ];
  
  let firstDeliveryIdx = -1;
  
  if (firstPickupIdx !== -1) {
    // Try anchors first (after pickup)
    for (const key of deliveryAnchors) {
      const idx = lowerText.indexOf(key, firstPickupIdx + 10); // Offset to skip the anchor itself
      if (idx !== -1 && (firstDeliveryIdx === -1 || idx < firstDeliveryIdx)) {
        firstDeliveryIdx = idx;
      }
    }
    // If no anchor found, try keys
    if (firstDeliveryIdx === -1) {
      for (const key of deliveryKeys) {
        const idx = lowerText.indexOf(key, firstPickupIdx + 10);
        if (idx !== -1 && (firstDeliveryIdx === -1 || idx < firstDeliveryIdx)) {
          firstDeliveryIdx = idx;
        }
      }
    }
  } else {
    // If no pickup found, search for delivery from start
    for (const key of deliveryAnchors) {
      const idx = lowerText.indexOf(key);
      if (idx !== -1 && (firstDeliveryIdx === -1 || idx < firstDeliveryIdx)) {
        firstDeliveryIdx = idx;
      }
    }
    if (firstDeliveryIdx === -1) {
      for (const key of deliveryKeys) {
        const idx = lowerText.indexOf(key);
        if (idx !== -1 && (firstDeliveryIdx === -1 || idx < firstDeliveryIdx)) {
          firstDeliveryIdx = idx;
        }
      }
    }
  }

  let pickupSection = text;
  let deliverySection = "";

  if (firstPickupIdx !== -1 && firstDeliveryIdx !== -1 && firstDeliveryIdx > firstPickupIdx) {
    // Pickup section: From first pickup keyword to delivery keyword
    pickupSection = text.substring(firstPickupIdx, firstDeliveryIdx);
    // Delivery section: From delivery keyword to end
    deliverySection = text.substring(firstDeliveryIdx);
  } else if (firstPickupIdx !== -1) {
    // Only found pickup?
    pickupSection = text.substring(firstPickupIdx);
  } else if (firstDeliveryIdx !== -1) {
    // Only found delivery?
    // Assume everything before delivery is pickup/header
    pickupSection = text.substring(0, firstDeliveryIdx);
    deliverySection = text.substring(firstDeliveryIdx);
  }

  // Extract Times & Dates
  const puTimeMatch = pickupSection.match(PATTERNS.time);
  if (puTimeMatch) {
    let time = normalizeTime(puTimeMatch[1]);
    const tzMatch = pickupSection.match(PATTERNS.timezone);
    if (tzMatch) {
      time += ` ${tzMatch[1].toUpperCase()}`;
    }
    result.pickupTime = time;
  }

  const puDateMatch = pickupSection.match(PATTERNS.date);
  if (puDateMatch) result.pickupDate = normalizeDate(puDateMatch[1]);

  const delTimeMatch = deliverySection.match(PATTERNS.time);
  if (delTimeMatch) {
    let time = normalizeTime(delTimeMatch[1]);
    const tzMatch = deliverySection.match(PATTERNS.timezone);
    if (tzMatch) {
      time += ` ${tzMatch[1].toUpperCase()}`;
    }
    result.deliveryTime = time;
  }

  // Extract Addresses - Find earliest valid address in each section
  const findEarliestAddress = (section: string): string => {
    const matches: { text: string, index: number, patternIdx: number }[] = [];
    for (let i = 0; i < PATTERNS.address.length; i++) {
      const pattern = PATTERNS.address[i];
      const mAll = section.matchAll(new RegExp(pattern, 'gi'));
      for (const m of mAll) {
        const cleaned = cleanAddress(m[0]);
        if (cleaned) {
          matches.push({ text: cleaned, index: m.index || 0, patternIdx: i });
        }
      }
    }
    if (matches.length === 0) return "";
    
    // Prioritize pattern 0 (Full address with street) over pattern 1 (City, ST)
    const fullAddressMatches = matches.filter(m => m.patternIdx === 0);
    if (fullAddressMatches.length > 0) {
      fullAddressMatches.sort((a, b) => a.index - b.index);
      return fullAddressMatches[0].text;
    }
    
    matches.sort((a, b) => a.index - b.index);
    return matches[0].text;
  };

  result.originAddress = findEarliestAddress(pickupSection);
  result.destinationAddress = findEarliestAddress(deliverySection);

  // Address extraction fallback if sectioning failed
  if (!result.originAddress) {
    const allAddresses: { text: string, index: number, patternIdx: number }[] = [];
    for (let i = 0; i < PATTERNS.address.length; i++) {
      const pattern = PATTERNS.address[i];
      const matches = text.matchAll(new RegExp(pattern, 'gi'));
      for (const m of matches) {
        const cleaned = cleanAddress(m[0]);
        if (cleaned) {
          allAddresses.push({ text: cleaned, index: m.index || 0, patternIdx: i });
        }
      }
    }
    
    if (allAddresses.length > 0) {
      const fullMatches = allAddresses.filter(m => m.patternIdx === 0).sort((a, b) => a.index - b.index);
      if (fullMatches.length > 0) {
        result.originAddress = fullMatches[0].text;
      } else {
        allAddresses.sort((a, b) => a.index - b.index);
        result.originAddress = allAddresses[0].text;
      }
    }
  }
  if (!result.destinationAddress) {
    const allAddresses: { text: string, index: number, patternIdx: number }[] = [];
    for (let i = 0; i < PATTERNS.address.length; i++) {
      const pattern = PATTERNS.address[i];
      const matches = text.matchAll(new RegExp(pattern, 'gi'));
      for (const m of matches) {
        const cleaned = cleanAddress(m[0]);
        if (cleaned) {
          allAddresses.push({ text: cleaned, index: m.index || 0, patternIdx: i });
        }
      }
    }
    
    if (allAddresses.length > 1) {
      // Pick the last one that isn't the origin
      const filtered = allAddresses.filter(a => a.text !== result.originAddress);
      if (filtered.length > 0) {
        const fullMatches = filtered.filter(m => m.patternIdx === 0).sort((a, b) => b.index - a.index);
        if (fullMatches.length > 0) {
          result.destinationAddress = fullMatches[0].text;
        } else {
          filtered.sort((a, b) => b.index - a.index);
          result.destinationAddress = filtered[0].text;
        }
      }
    }
  }

  return result;
}
