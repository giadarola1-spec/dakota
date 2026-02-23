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
    /(?:Rate|Total|Amount|Pay|Flat\s*Rate|Total\s*Pay|Total\s*Amount|Carrier\s*Pay|Linehaul|All-in|Grand\s*Total|Total\s*Carrier\s*Pay|Agreed\s*Amount|Total\s*Charges|Fuel\s*Surcharge|FSC|Accessorials|Lumper|Detention)\s*[:.]?\s*\$?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
    /\$\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/
  ],
  // Time patterns: Look for HH:MM AM/PM, Military, or TBD
  // Made prefix optional to catch standalone values like "TBD"
  time: /(?:(?:Appt\s*|Appointment\s*Time\s*[:]?|Appointment\s*|Window\s*|ETA\s*|Scheduled\s*|Arrival\s*|Time\s*[:]?|Check-in|FCFS|ASAP|Delivery\s*Window|PU\s*Date\s*\/\s*Time|DEL\s*Date\s*\/\s*Time|Schedule)\s*[:.]?\s*)?(\d{1,2}:\d{2}\s*(?:AM|PM)?|\d{4}\s*hrs?|TBD|ASAP|FCFS)/i,
  
  // Date pattern: MM/DD/YYYY, MM-DD-YYYY, MM.DD.YYYY
  date: /\b(\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4})\b/,

  // Address pattern: City, ST Zip
  address: /\b([A-Z][A-Za-z \.\/]{1,30}?)(?:,|\s+)\s*([A-Z]{2})\b(?:\s+((?:\d{5})(?:-\d{4})?))?/
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

  result.loadNumber = extract(PATTERNS.loadNumber, text);
  result.weight = normalizeWeight(extract(PATTERNS.weight, text));
  result.rate = extract(PATTERNS.rate, text);

  // Context-aware parsing for Times and Addresses
  // Strategy: Find First Pickup and First Delivery after Pickup
  
  const lowerText = text.toLowerCase();
  
  // Find start of First Pickup Section
  // Removed "from" as it's too common in sentences
  const pickupKeys = ["shipper", "pick up", "pick-up", "pickup", "origin", "loading", "stop 1", "stop #1", "pu", "p/u", "facility name", "shipping address", "pick-up location"];
  let firstPickupIdx = -1;
  for (const key of pickupKeys) {
    const idx = lowerText.indexOf(key);
    if (idx !== -1 && (firstPickupIdx === -1 || idx < firstPickupIdx)) {
      firstPickupIdx = idx;
    }
  }

  // Find start of Delivery Section (First occurrence AFTER pickup)
  // Removed "to" as it's too common
  const deliveryKeys = ["consignee", "delivery", "dest", "drop", "unloading", "receiver", "stop 2", "stop #2", "del", "unloading point", "drop off", "receiving address", "delivery location"];
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
  const cleanAddress = (addr: string): string => {
    if (!addr) return "";
    // Remove common header words that might be captured, potentially multiple times
    return addr.replace(/^(?:\s*(?:LOCATION|DATE|TIME|PICK-UP|DELIVERY|DESTINATION|ORIGIN|SHIPPER|CONSIGNEE|PICKUP|ADDRESS|FROM|TO|RECEIVER|STOP\s*(?:#?\d+)?|LOADING|UNLOADING|PU|P\/U|DEL|FACILITY\s*NAME|SHIPPING\s*ADDRESS|RECEIVING\s*ADDRESS|DROP\s*OFF)\s*[:]?\s*)+/i, "").trim();
  };

  const puAddrMatch = pickupSection.match(PATTERNS.address);
  if (puAddrMatch) {
    // Construct full address string: City, ST Zip
    const city = cleanAddress(puAddrMatch[1]);
    result.originAddress = `${city}, ${puAddrMatch[2]} ${puAddrMatch[3] ? puAddrMatch[3].trim() : ''}`.trim();
  }

  const delAddrMatch = deliverySection.match(PATTERNS.address);
  if (delAddrMatch) {
    const city = cleanAddress(delAddrMatch[1]);
    result.destinationAddress = `${city}, ${delAddrMatch[2]} ${delAddrMatch[3] ? delAddrMatch[3].trim() : ''}`.trim();
  }

  return result;
}
