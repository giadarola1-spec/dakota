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
    /(?:Rate|Total|Amount|Pay|Flat\s*Rate|Total\s*Pay|Total\s*Amount|Carrier\s*Pay|Linehaul|All-in|Grand\s*Total|Total\s*Carrier\s*Pay|Agreed\s*Amount|Total\s*Charges|Fuel\s*Surcharge|FSC|Accessorials|Lumper|Detention)\s*(?:USD|CAD|GBP)?\s*[:.]?\s*\$?\s*(\d+(?:,\d{3})(?:\.\d{2})?)/i,
    /(?:Rate|Total|Amount|Pay|Flat\s*Rate|Total\s*Pay|Total\s*Amount|Carrier\s*Pay|Linehaul|All-in|Grand\s*Total|Total\s*Carrier\s*Pay|Agreed\s*Amount|Total\s*Charges|Fuel\s*Surcharge|FSC|Accessorials|Lumper|Detention)\s*(?:USD|CAD|GBP)?\s*[:.]?\s*\$\s*(\d+(?:\.\d{2})?)/i,
    /(?:Rate|Total|Amount|Pay|Flat\s*Rate|Total\s*Pay|Total\s*Amount|Carrier\s*Pay|Linehaul|All-in|Grand\s*Total|Total\s*Carrier\s*Pay|Agreed\s*Amount|Total\s*Charges|Fuel\s*Surcharge|FSC|Accessorials|Lumper|Detention)\s*(?:USD|CAD|GBP)?\s*[:.]?\s*\$?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
    /\$\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/
  ],
  time: /(?:(?:Appt\s*|Appointment\s*Time\s*[:]?|Appointment\s*|Window\s*|ETA\s*|Scheduled\s*|Arrival\s*|Time\s*[:]?|Check-in|FCFS|ASAP|Delivery\s*Window|PU\s*Date\s*\/\s*Time|DEL\s*Date\s*\/\s*Time|Schedule)\s*[:.]?\s*)?(\d{1,2}:\d{2}\s*(?:AM|PM)?|\d{4}\s*hrs?|TBD|ASAP|FCFS)/i,
  date: /\b(\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4})\b/,
  timezone: /\b(EST|CST|MST|PST|EDT|CDT|MDT|PDT|AST|HST|AKST|AKDT|UTC|GMT)\b/i,
  address: [
    // 0. Strict: Street, City, ST Zip (with strict state validation)
    new RegExp(`(\\d+\\s+[A-Z0-9\\s\\.,#-]{2,60}?(?:${"AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY|DC|AB|BC|MB|NB|NL|NS|NT|NU|ON|PE|QC|SK|YT"})\\s+\\d{5}(?:-\\d{4})?)`, 'i'),
    
    // 1. Fallback: City, ST Zip (with strict state validation)
    new RegExp(`([A-Z][A-Za-z \\.\\/]{1,30}?)(?:,|\\s+)\\s*(${ "AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY|DC|AB|BC|MB|NB|NL|NS|NT|NU|ON|PE|QC|SK|YT" })\\b(?:\\s+((?:\\d{5})(?:-\\d{4})?))?`, 'i'),
    
    // 2. Label: Address: ...
    /(?:Address|Location|Facility|Shipper|Consignee)\s*[:.]\s*([^\n\r]+)/i,
    
    // 3. Loose: Number + Street Type (no zip required)
    /(\d+\s+[A-Z0-9\s\.,#-]+(?:Rd|Road|Ave|Avenue|St|Street|Blvd|Boulevard|Dr|Drive|Ln|Lane|Way|Ct|Court|Pl|Place|Pkwy|Parkway)\b[^\n\r]*)/i
  ],
  // Specific labeled patterns (allow newlines)
  labeledTime: /(?:Appointment|Appt|Scheduled|Arrival)\s*(?:Time)?\s*[:.]\s*(?:[\r\n]+\s*)?(\d{1,2}:\d{2}(?:\s*(?:AM|PM))?)/i,
  labeledDate: /(?:Pickup|Delivery|Appt)\s*Date\s*[:.]\s*(?:[\r\n]+\s*)?(\d{1,2}[-./]\d{1,2}[-./]\d{2,4})/i
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
  pickupTime: string;
  pickupDate: string;
  deliveryTime: string;
  originAddress: string;
  destinationAddress: string;
  stops: Stop[];
  rawTextPreview: string;
}

export function parseRateConfirmation(text: string): ParsedRateCon {
  const cleanAddress = (addr: string): string => {
    if (!addr) return "";
    // Remove common header words
    let cleaned = addr.replace(/^(?:\s*(?:LOCATION|DATE|TIME|PICK-UP|DELIVERY|DESTINATION|ORIGIN|SHIPPER|CONSIGNEE|PICKUP|ADDRESS|FROM|TO|RECEIVER|STOP\s*(?:#?\d+)?|LOADING|UNLOADING|PU|P\/U|DEL|FACILITY\s*NAME|SHIPPING\s*ADDRESS|RECEIVING\s*ADDRESS|DROP\s*OFF)\s*[:]?\s*)+/i, "").trim();
    // Remove trailing phone numbers or emails if caught
    cleaned = cleaned.replace(/(?:\s*(?:Phone|Tel|Tele|Contact|Email)[:\.].*)$/i, "").trim();
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
    stops: [],
    rawTextPreview: text.substring(0, 200) + "..."
  };

  // Truncate text at "Terms and Conditions" to prevent footer noise
  const termsIndex = text.toLowerCase().indexOf("terms and conditions");
  const processText = termsIndex !== -1 ? text.substring(0, termsIndex) : text;

  // Helper to extract first match
  const extract = (patterns: RegExp[], text: string): string => {
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) return match[1].trim();
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
    if (t.toUpperCase() === "TBD") return "TBD";
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
    if (!clean.includes(':') && clean.length === 4 && !isNaN(Number(clean))) return clean;
    if (clean.includes(':')) {
      let [hours, minutes] = clean.split(':');
      let h = parseInt(hours, 10);
      if (isPM && h < 12) h += 12;
      if (isAM && h === 12) h = 0;
      return `${h.toString().padStart(2, '0')}${minutes.substring(0, 2)}`;
    }
    return clean;
  };

  // Rate extraction
  const rateMatches: { value: string, score: number }[] = [];
  for (const pattern of PATTERNS.rate) {
    const matches = processText.matchAll(new RegExp(pattern, 'gi'));
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

  result.loadNumber = extract(PATTERNS.loadNumber, processText);
  result.weight = normalizeWeight(extract(PATTERNS.weight, processText));

  // Stops extraction
  const lowerText = processText.toLowerCase();
  const stopMarkers: { index: number, type: 'pickup' | 'delivery' }[] = [];
  const pickupKeys = ["shipper - pickup", "shipper:", "origin:", "stop 1", "stop #1", "pickup 1 of", "pick up", "pick-up", "pickup", "pickup date:"];
  const deliveryKeys = ["consignee - delivery", "consignee:", "destination:", "stop 2", "stop #2", "delivery 1 of", "delivery", "dest", "drop", "unloading", "receiver", "delivery date:"];

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

  stopMarkers.sort((a, b) => a.index - b.index);
  const uniqueMarkers: typeof stopMarkers = [];
  stopMarkers.forEach(m => {
    if (uniqueMarkers.length === 0 || m.index > uniqueMarkers[uniqueMarkers.length - 1].index + 50) {
      uniqueMarkers.push(m);
    }
  });

  uniqueMarkers.forEach((marker, i) => {
    const start = marker.index;
    const end = uniqueMarkers[i + 1] ? uniqueMarkers[i + 1].index : processText.length;
    const section = processText.substring(start, end);
    const stop: Stop = { type: marker.type, date: "", time: "", address: "", sequence: i + 1 };

    // Date
    const dateMatch = section.match(PATTERNS.labeledDate) || section.match(PATTERNS.date);
    if (dateMatch) stop.date = normalizeDate(dateMatch[1]);

    // Time
    const timeMatch = section.match(PATTERNS.labeledTime) || section.match(PATTERNS.time);
    if (timeMatch) {
      let time = normalizeTime(timeMatch[1]);
      const tzMatch = section.match(PATTERNS.timezone);
      if (tzMatch) time += ` ${tzMatch[1].toUpperCase()}`;
      stop.time = time;
    }

    // Address
    // 1. Try "Address:" label
    const addrLabelMatch = section.match(PATTERNS.address[2]);
    // 2. Try loose address pattern (Number + Street)
    const looseAddrMatch = section.match(PATTERNS.address[3]);
    // 3. Try strict address pattern
    const strictAddrMatch = section.match(PATTERNS.address[0]);
    
    // Prioritize label match, then strict, then loose
    const addrMatch = addrLabelMatch || strictAddrMatch || looseAddrMatch || section.match(PATTERNS.address[1]);
    
    if (addrMatch) {
      // If we matched a label like "Address: ...", use group 1. 
      // If we matched strict/loose regex, use group 1 (or 0 if no group 1).
      stop.address = cleanAddress(addrMatch[1] || addrMatch[0]);
    }

    result.stops.push(stop);
  });

  // Fallback if no stops found
  if (result.stops.length === 0) {
    const allAddresses = Array.from(processText.matchAll(new RegExp(PATTERNS.address[0], 'gi')));
    if (allAddresses.length > 0) {
      result.stops.push({
        type: 'pickup',
        date: normalizeDate(extract([PATTERNS.date], processText)),
        time: normalizeTime(extract([PATTERNS.time], processText)),
        address: cleanAddress(allAddresses[0][0]),
        sequence: 1
      });
    }
  }

  // Populate flat fields
  const pickups = result.stops.filter(s => s.type === 'pickup');
  const deliveries = result.stops.filter(s => s.type === 'delivery');

  if (pickups.length > 0) {
    // Find first pickup with an address, or default to first
    const p = pickups.find(s => s.address) || pickups[0];
    result.originAddress = p.address;
    result.pickupTime = p.time;
    result.pickupDate = p.date;
  }
  if (deliveries.length > 0) {
    // Find last delivery with an address, or default to last
    const d = deliveries.reverse().find(s => s.address) || deliveries[0];
    result.destinationAddress = d.address;
    result.deliveryTime = d.time;
  }

  return result;
}
