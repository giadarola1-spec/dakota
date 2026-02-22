/**
 * parser.ts - Logic to extract data from Rate Confirmation text
 */

// Regex patterns
const PATTERNS = {
  loadNumber: [
    /(?:Load\s*#|Order\s*#|Shipment\s*ID|Pro\s*#|Ref\s*#|Reference\s*#)\s*[:.]?\s*([A-Z0-9-]{4,})/i,
    /(?:Ref\s*#)\s*[:.]?\s*([A-Z0-9-]{4,})/i,
    /\b(\d{7,})\b/ // Fallback
  ],
  weight: [
    /(?:Weight|Wt|Gross\s*Wt)\s*[:.]?\s*(\d{1,3}(?:,\d{3})*|\d+)\s*(?:lbs|LBS|pounds|kgs)?/i,
    /(\d{1,3}(?:,\d{3})*|\d+)\s*(?:lbs|LBS|pounds|kgs)/
  ],
  rate: [
    /(?:Rate|Total|Amount|Pay|Flat\s*Rate)\s*[:.]?\s*\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
    /\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/
  ],
  // Time patterns: Look for HH:MM AM/PM or Military
  time: /(\d{1,2}:\d{2}\s*(?:AM|PM)?|\d{4}\s*hrs?)/i,
  
  // Date pattern: MM/DD/YYYY, MM-DD-YYYY, MM.DD.YYYY
  date: /\b(\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4})\b/,

  // Address pattern: City, ST Zip (Simplified)
  // Looks for: Word(s), 2-letter State, 5-digit Zip
  // Updated to be more flexible: City (lazy), comma/space, State, Zip
  // Added capturing group for Zip
  address: /([A-Za-z\s\.]+?)(?:,|\s+)\s*([A-Z]{2})\s+((?:\d{5})(?:-\d{4})?)/
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
    return w.replace(/,/g, '');
  };

  const normalizeDate = (d: string): string => {
    if (!d) return "";
    // Replace / or - with .
    return d.replace(/[/.-]/g, '.');
  };

  const normalizeTime = (t: string): string => {
    if (!t) return "";
    // Remove "hrs"
    let clean = t.replace(/hrs?/i, '').trim();
    
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
      
      return `${h.toString().padStart(2, '0')}${minutes}`;
    }

    return clean; // Fallback
  };

  result.loadNumber = extract(PATTERNS.loadNumber, text);
  result.weight = normalizeWeight(extract(PATTERNS.weight, text));
  result.rate = extract(PATTERNS.rate, text);

  // Context-aware parsing for Times and Addresses
  // Strategy: Find First Pickup and First Delivery after Pickup
  
  const lowerText = text.toLowerCase();
  
  // Find start of First Pickup Section
  const pickupKeys = ["shipper", "pick up", "pickup", "origin", "loading"];
  let firstPickupIdx = -1;
  for (const key of pickupKeys) {
    const idx = lowerText.indexOf(key);
    if (idx !== -1 && (firstPickupIdx === -1 || idx < firstPickupIdx)) {
      firstPickupIdx = idx;
    }
  }

  // Find start of Delivery Section (First occurrence AFTER pickup)
  const deliveryKeys = ["consignee", "delivery", "dest", "drop", "unloading"];
  let firstDeliveryIdx = -1;
  
  if (firstPickupIdx !== -1) {
    // Search for delivery keywords starting from the pickup index
    for (const key of deliveryKeys) {
      const idx = lowerText.indexOf(key, firstPickupIdx);
      if (idx !== -1 && (firstDeliveryIdx === -1 || idx < firstDeliveryIdx)) {
        firstDeliveryIdx = idx;
      }
    }
  } else {
    // Fallback: Search anywhere if pickup not found
    for (const key of deliveryKeys) {
      const idx = lowerText.indexOf(key);
      if (idx !== -1 && (firstDeliveryIdx === -1 || idx < firstDeliveryIdx)) {
        firstDeliveryIdx = idx;
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
    deliverySection = text.substring(firstDeliveryIdx);
  }

  // Extract Times & Dates
  const puTimeMatch = pickupSection.match(PATTERNS.time);
  if (puTimeMatch) result.pickupTime = normalizeTime(puTimeMatch[1]);

  const puDateMatch = pickupSection.match(PATTERNS.date);
  if (puDateMatch) result.pickupDate = normalizeDate(puDateMatch[1]);

  const delTimeMatch = deliverySection.match(PATTERNS.time);
  if (delTimeMatch) result.deliveryTime = normalizeTime(delTimeMatch[1]);

  // Extract Addresses
  // We look for the City, ST Zip pattern in the respective sections
  const puAddrMatch = pickupSection.match(PATTERNS.address);
  if (puAddrMatch) {
    // Construct full address string: City, ST Zip
    result.originAddress = `${puAddrMatch[1].trim()}, ${puAddrMatch[2]} ${puAddrMatch[3] ? puAddrMatch[3].trim() : ''}`.trim();
  }

  const delAddrMatch = deliverySection.match(PATTERNS.address);
  if (delAddrMatch) {
    result.destinationAddress = `${delAddrMatch[1].trim()}, ${delAddrMatch[2]} ${delAddrMatch[3] ? delAddrMatch[3].trim() : ''}`.trim();
  }

  return result;
}
