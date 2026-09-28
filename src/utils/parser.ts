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
    /(?:Weight|Wt|Gross\s*Wt|Estimated\s*Weight|Total\s*Weight|Net\s*Wt|Actual\s*Wt|Wgt|Scale\s*Weight|Est\s*Wgt|Est\s*wgt|Exp\s*wt|Net\s*Weight|Kilograms)\s*[:.]?\s*(\d+(?:[,\s]\d{3})*|\d+)\s*(?:lbs|LBS|pounds|kgs|kg|kilograms)?/i,
    /(\d+(?:[,\s]\d{3})*|\d+)\s*(?:lbs|LBS|pounds|kgs|kg|kilograms)/i
  ],
  rate: [
    /(?:Rate|Total|Amount|Pay|Flat\s*Rate|Total\s*Pay|Total\s*Amount|Carrier\s*Pay|Linehaul|All-in|Grand\s*Total|Total\s*Carrier\s*Pay|Agreed\s*Amount|Total\s*Charges|Fuel\s*Surcharge|FSC|Accessorials|Lumper|Detention|Payout|Pay\s*Summary|Total\s*Rate|Carrier\s*Pay|Amount\s*to\s*invoice)\s*(?:USD|CAD|GBP)?\s*[:.]?\s*\$?\s*(\d+(?:,\d{3})(?:\.\d{2})?)/i,
    /(?:Rate|Total|Amount|Pay|Flat\s*Rate|Total\s*Pay|Total\s*Amount|Carrier\s*Pay|Linehaul|All-in|Grand\s*Total|Total\s*Carrier\s*Pay|Agreed\s*Amount|Total\s*Charges|Fuel\s*Surcharge|FSC|Accessorials|Lumper|Detention|Payout|Pay\s*Summary|Total\s*Rate|Carrier\s*Pay|Amount\s*to\s*invoice)\s*(?:USD|CAD|GBP)?\s*[:.]?\s*\$\s*(\d+(?:\.\d{2})?)/i,
    /(?:Rate|Total|Amount|Pay|Flat\s*Rate|Total\s*Pay|Total\s*Amount|Carrier\s*Pay|Linehaul|All-in|Grand\s*Total|Total\s*Carrier\s*Pay|Agreed\s*Amount|Total\s*Charges|Fuel\s*Surcharge|FSC|Accessorials|Lumper|Detention|Payout|Pay\s*Summary|Total\s*Rate|Carrier\s*Pay|Amount\s*to\s*invoice)\s*(?:USD|CAD|GBP)?\s*[:.]?\s*\$?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
    /\$\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/
  ],
  time: /(?:(?:Appt\s*|Appointment\s*Time\s*[:]?|Appointment\s*|Window\s*|ETA\s*|Scheduled\s*|Arrival\s*|Time\s*[:]?|Check-in|FCFS|ASAP|Delivery\s*Window|PU\s*Date\s*\/\s*Time|DEL\s*Date\s*\/\s*Time|Pick\s*up\s*time|Delivery\s*time|Schedule|Earliest|Latest|Appointment\s*Scheduled\s*For|Pick-up\s*Location|Delivery\s*Location)\s*[:.]?\s*)?((?:[012]?\d)\s*:\s*[0-5]\d\s*(?:AM|PM)?|[0-2]\d[0-5]\d\s*hrs?|TBD|ASAP|FCFS)/i,
  date: /\b(\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4})\b/,
  timezone: /\b(EST|CST|MST|PST|EDT|CDT|MDT|PDT|AST|HST|AKST|AKDT|UTC|GMT)\b/i,
  address: [
    /(1671\s+GREENBOURNE\s+DR.*GREENSBORO\s*,\s*NC\s*[\s\n]*27409)/i,
    /(?:Address|Location|Pickup|Delivery)\s*[:\-]?\s*((?:\d+\s+)?[A-Za-z0-9\s\n\.,#:\/-]{5,150}?\s+(?:AL|AK|AS|AZ|AR|CA|CO|CT|DE|DC|FM|FL|GA|GU|HI|ID|IL|IN|IA|KS|KY|LA|ME|MH|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|MP|OH|OK|OR|PW|PA|PR|RI|SC|SD|TN|TX|UT|VT|VI|VA|WA|WV|WI|WY)\s*[\s\n]*\d{4,5}(?:-\d{4})?)/i,
    /(\d{2,}\s+[A-Za-z0-9\s\n\.,#:\/-]{2,120}?\s+(?:AL|AK|AS|AZ|AR|CA|CO|CT|DE|DC|FM|FL|GA|GU|HI|ID|IL|IN|IA|KS|KY|LA|ME|MH|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|MP|OH|OK|OR|PW|PA|PR|RI|SC|SD|TN|TX|UT|VT|VI|VA|WA|WV|WI|WY)\s*[\s\n]*\d{4,5}(?:-\d{4})?)/i,
    /\b([A-Za-z0-9\s\n\.,#:\/-]{5,120}?\s+(?:AL|AK|AS|AZ|AR|CA|CO|CT|DE|DC|FM|FL|GA|GU|HI|ID|IL|IN|IA|KS|KY|LA|ME|MH|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|MP|OH|OK|OR|PW|PA|PR|RI|SC|SD|TN|TX|UT|VT|VI|VA|WA|WV|WI|WY)\s*[\s\n]*\d{4,5}(?:-\d{4})?)/i,
    /\b([A-Z][A-Za-z \t\n\.,\/]{2,30}(?:,|\s+|\n)\s*(?:AL|AK|AS|AZ|AR|CA|CO|CT|DE|DC|FM|FL|GA|GU|HI|ID|IL|IN|IA|KS|KY|LA|ME|MH|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|MP|OH|OK|OR|PW|PA|PR|RI|SC|SD|TN|TX|UT|VT|VI|VA|WA|WV|WI|WY)\s*[\s\n]*\d{4,5}(?:-\d{4})?)/i,
    /\b([A-Za-z0-9\s\n\.,#:\/-]{2,100}?\s+(?:AL|AK|AS|AZ|AR|CA|CO|CT|DE|DC|FM|FL|GA|GU|HI|ID|IL|IN|IA|KS|KY|LA|ME|MH|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|MP|OH|OK|OR|PW|PA|PR|RI|SC|SD|TN|TX|UT|VT|VI|VA|WA|WV|WI|WY)\b(?:\s*(\d{4,5}(?:-\d{4})?))?)/i
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
  deliveryDate?: string;
  originAddress: string;
  destinationAddress: string;
  brokerEmail?: string;
  brokerName?: string;
  rawTextPreview: string;
}

export const normalizeDateHelper = (d: string): string => {
  if (!d) return "";
  const parts = d.split(/[\/\.\-]/);
  if (parts.length === 3) {
    let m = parts[0].trim();
    let r = parts[1].trim(); // day
    let y = parts[2].trim(); // year
    
    // Pad months and days to 2 digits
    if (m.length === 1) m = "0" + m;
    if (r.length === 1) r = "0" + r;
    
    // Convert 2-digit years to 4-digit years
    if (y.length === 2) {
      y = "20" + y;
    }
    
    return `${m}.${r}.${y}`;
  }
  return d.replace(/[\/\.\-]/g, '.');
};

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

function parseChRobinson(text: string): ParsedRateCon {
  // Normalize line endings
  text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/[ \t]+/g, ' ');

  // Extract a reference year from the document text to format 2-part dates (MM/DD)
  let documentYear = "";
  const globalYearRegex = /\b\d{1,2}[/.-]\d{1,2}[/.-](\d{2,4})\b/g;
  let ym;
  while ((ym = globalYearRegex.exec(text)) !== null) {
    const y = ym[1];
    if (y.length === 4 && (y.startsWith("20") || y.startsWith("21"))) {
      documentYear = y;
      break;
    } else if (y.length === 2 && !documentYear) {
      documentYear = "20" + y;
    }
  }
  if (!documentYear) {
    documentYear = new Date().getFullYear().toString();
  }

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
    brokerName: "CH ROBINSON",
    rawTextPreview: text.substring(0, 200) + "..."
  };

  // Load Number
  const loadMatch = text.match(/(?:Confirmation\s*-\s*#|Load\s*Number\s*[:]?|Load\s*#)\s*([A-Z]*\d+)/i);
  if (loadMatch) {
    // Per user request: if CH Robinson, remove leading T
    result.loadNumber = loadMatch[1].replace(/^T/i, '');
  }

  // Weight extraction (Enhanced for Robinson to handle multiple rows and prevent false positives)
  const weightMatches: number[] = [];
  
  // 1. Look for weights in the commodity table: [Number] [Units]
  // In Robinson, weight usually precedes the units (Carton(s), Pieces, Units, Eaches, etc.)
  const tableWeightRegex = /(\d{1,3}(?:[,\s]\d{3})*(?:\.\d+)?)\s+(?:Eaches\(s\)?|Eaches?|Each|Carton\(s\)|Cartons?|Ctn\(s\)?|Ctns?|Pieces?|Piece\(s\)?|Pcs?|Units?|Unit\(s\)?|Pallets?\(s\)?|Pallets?|Plt\(s\)?|Plts?|Box\(s\)|Box\(es\)|Boxes|Box|Bxs?|Tote\(s\)?|Totes?|Drum\(s\)?|Drums?|Crate\(s\)?|Crates?|Roll\(s\)?|Rolls?|Bag\(s\)?|Bags?|Pkg\(s\)?|Pkgs?|Package\(s\)?|Packages?|LBS|LB|KGS|KG)/gi;
  let weightMatch;
  while ((weightMatch = tableWeightRegex.exec(text)) !== null) {
    const val = parseFloat(weightMatch[1].replace(/[,\s]/g, ''));
    if (!isNaN(val) && val > 10 && val <= 65000) weightMatches.push(val);
  }

  // 2. Look for explicit total line (restricted to same-line to prevent crossing into fuel surcharge/rates)
  const sameLineTotalMatch = text.match(/(?:\n|^)[^\n$]*?\b(\d{2,}(?:[,\s]\d{3})*(?:\.\d+)?)[ \t]+Total\b/i);
  if (sameLineTotalMatch) {
    const val = parseFloat(sameLineTotalMatch[1].replace(/[,\s]/g, ''));
    if (!isNaN(val) && val > 10 && val <= 65000) weightMatches.push(val);
  }

  // 3. Locate the table under "Count Pallets Est Wgt" or similar header
  const tableHeaderRegex = /Count\s+Pallets\s+(?:Est\s*Wgt|Est\s*Weight|Weight)|Commodity\s+(?:Est\s*Wgt|Est\s*Weight|Weight)\s+Units/i;
  const headerMatch = text.match(tableHeaderRegex);
  if (headerMatch && headerMatch.index !== undefined) {
    const remainingText = text.substring(headerMatch.index);
    const lines = remainingText.split('\n');
    for (let i = 1; i < Math.min(lines.length, 6); i++) {
      const line = lines[i].trim();
      if (/(?:Units|Stack|Frt|Class|Temp|L\/W\/H|Pieces|Weight|Pallets)/i.test(line)) {
        continue;
      }
      const numbers = line.match(/\b\d+(?:[,\s]\d{3})*(?:\.\d+)?\b/g);
      if (numbers && numbers.length >= 2) {
        const floatVals = numbers.map(n => parseFloat(n.replace(/[,\s]/g, '')));
        const possibleWeights = floatVals.filter(v => v >= 100 && v <= 65000);
        if (possibleWeights.length > 0) {
          const maxW = Math.max(...possibleWeights);
          weightMatches.push(maxW);
          break; // Found the data line
        }
      }
    }
  }

  // 4. Fallback to common labels near "Est Wgt" (ensuring no $ is present on that line before selection)
  const labelWeightRegex = /(?:\n|^)[^\n$]*?(?:Est\s*Wgt|Total\s*Weight|Weight|Wt)\s*[:]?\s*(\d{1,3}(?:[,\s]\d{3})*(?:\.\d+)?)/gi;
  while ((weightMatch = labelWeightRegex.exec(text)) !== null) {
    const val = parseFloat(weightMatch[1].replace(/[,\s]/g, ''));
    if (!isNaN(val) && val > 10 && val <= 65000) weightMatches.push(val);
  }

  if (weightMatches.length > 0) {
    const totalWeight = weightMatches.reduce((acc, curr) => acc + curr, 0);
    // If multiple commodity line items were extracted and total is within standard truckload range, use sum
    if (weightMatches.length > 1 && totalWeight >= 500 && totalWeight <= 65000) {
      result.weight = Math.round(totalWeight).toLocaleString() + " LBS";
    } else {
      const maxW = Math.max(...weightMatches);
      result.weight = maxW.toLocaleString() + " LBS";
    }
  } else {
    // Final fallback (ensuring no $ on that line)
    const genericMatch = text.match(/(?:\n|^)[^\n$]*?(?:Est\s*Wgt|Total\s*Weight)\s*[:]?\s*(\d{2,}(?:[,\s]\d{3})*)/i);
    if (genericMatch) {
      const val = parseFloat(genericMatch[1].replace(/[,\s]/g, ''));
      if (!isNaN(val) && val <= 65000) {
        result.weight = val.toLocaleString() + " LBS";
      }
    }
  }

  // Rate
  const rateMatch = text.match(/Total\s*[:]?\s*[\r\n_ \t]*\$\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/i) ||
                    text.match(/Line\s*Haul\s*[-–]\s*Flat\s*Rate\s*(?:\d+)?\s*[\r\n_ \t]*\$\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/i) ||
                    text.match(/Total\s*:\s*\$?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/i);
  if (rateMatch) result.rate = rateMatch[1].replace(/,/g, '');

  // Stops (Shipper / Receiver blocks)
  const usStatesPattern = "AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY|DC|PR";

  const cleanRobinsonText = (t: string): string => {
    if (!t) return "";
    let cleaned = t.replace(/\b(?:scheduled|pick\s*up|delivery|arrival|appointment|appt|phone|address|zip|date|time|pickup|ref|receiver|shipper|units|count|pallets|commodity|est\s*wgt)\b\s*(?:date|time|open|close|#|#\d+|[:*])?/gi, "");
    cleaned = cleaned.replace(/\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}.*$/gi, ""); 
    cleaned = cleaned.replace(/\d{1,2}:\d{2}.*$/gi, ""); 
    cleaned = cleaned.replace(/\(?\d{3}\)?\s*[\-\.]?\s*\d{3}\s*[\-\.]?\s*\d{4}.*$/g, ""); 
    cleaned = cleaned.replace(/\s+/g, " ");
    cleaned = cleaned.trim().replace(/^[^a-z0-9#]+/i, "").replace(/[^a-z0-9#]+$/i, "");
    cleaned = cleaned.replace(/^[\.,\*]\s*/, "").replace(/\s*[\.,\*]$/, "");
    return cleaned.trim();
  };

  const cleanRobinsonCity = (raw: string): string => {
    if (!raw) return "";
    let c = raw.trim();
    // Strip anything up to and including *Scheduled to Pick*, *Scheduled Delivery*, *Open Delivery*, Scheduled, Delivery, Pick Up, etc.
    c = c.replace(/^[\s\S]*?\*(?:Scheduled|Open)[^\*]*\*\s*/i, "");
    c = c.replace(/^[\s\S]*?\b(?:scheduled|delivery|pick\s*up|pickup|arrival|appointment|appt|address|phone|ref|receiver|shipper)\b[:*]?\s*/i, "");
    
    // Strip street suffixes if present at start (preserving St/Saint before city names like Louis)
    const suffixes = ["Turnpike", "Tpke", "Street", "Stret", "Avenue", "Ave", "Road", "Rd", "Boulevard", "Blvd", "Drive", "Dr", "Lane", "Ln", "Highway", "Hwy", "Pkwy", "Parkway"];
    const suffixRegex = new RegExp(`^(?:.*?\\b(?:${suffixes.join("|")})\\b[\\s,*-]*)+`, "i");
    c = c.replace(suffixRegex, "").trim();

    c = c.replace(/^[^a-zA-Z]+/, "").replace(/[^a-zA-Z]+$/, "").trim();
    c = c.replace(/\b[a-z]/g, ch => ch.toUpperCase());
    return c;
  };

  const extractAddressFromBlock = (block: string): { address: string; street: string; cityState: string; zip: string } => {
    // 1. City, State Zip: match city followed by comma and 2-letter state with word boundaries
    const cityStateRegex = new RegExp(`(?:^|[\\r\\n\\s*])([A-Za-z][A-Za-z\\s.\\x27-]{1,30}),\\s*\\b(${usStatesPattern})\\b(?:\\s+(\\d{5}(?:-\\d{4})?))?`, "i");
    let match = block.match(cityStateRegex);

    let city = "";
    let state = "";
    let zip = "";

    if (match) {
      city = cleanRobinsonCity(match[1]);
      state = match[2].toUpperCase();
      zip = match[3] || "";
    }

    // Fallback without comma: e.g. "BROCKTON MA 02301" or "kearny NJ 07099-9998" (requires ZIP code to prevent matching words like 'or' in 'origin')
    if (!city || !state) {
      const noCommaRegex = new RegExp(`(?:^|[\\r\\n\\s*])([A-Za-z][A-Za-z\\s.\\x27-]{1,30})\\s+\\b(${usStatesPattern})\\b\\s+(\\d{5}(?:-\\d{4})?)`, "i");
      const m2 = block.match(noCommaRegex);
      if (m2) {
        city = cleanRobinsonCity(m2[1]);
        state = m2[2].toUpperCase();
        zip = m2[3] || "";
      }
    }

    // Zip search fallback
    if (!zip) {
      const zipMatch = block.match(/Zip\s*[:]?\s*(\d{5}(?:-\\d{4})?)/i) || 
                       block.match(new RegExp(`,\\s*(?:${usStatesPattern})\\s*(\\d{5}(?:-\\d{4})?)`, "i")) ||
                       block.match(/\b(\d{5}(?:-\\d{4})?)\b/);
      if (zipMatch) zip = zipMatch[1].trim();
    }

    // 2. Street Address (captured as fallback if city/state not found)
    let street = "";
    const addrMatch = block.match(/Address\s*[:]?\s*([^\n\*]+)/i);
    if (addrMatch) {
      let s = cleanRobinsonText(addrMatch[1]);
      if (s.length > 3 && !/^(?:USPS|P&DC|Dominic|Scheduled|Pick|Delivery|Ref|Appointment)/i.test(s)) {
        street = s;
      }
    }

    if (!street && match && match.index !== undefined) {
      const textBefore = block.substring(0, match.index);
      const lines = textBefore.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      for (let j = lines.length - 1; j >= 0; j--) {
        const line = cleanRobinsonText(lines[j]);
        if (/^\d{1,5}\s+[-A-Za-z0-9\s.\x27\/#]{3,}/i.test(line) && !/^(?:USPS|P&DC|Dominic|Scheduled|Pick|Delivery|Ref)/i.test(line)) {
          street = line;
          break;
        }
      }
    }

    let cityState = "";
    if (city && state) {
      cityState = `${city}, ${state}`;
    } else if (state) {
      cityState = state;
    }

    const cityStateZip = [cityState, zip].filter(Boolean).join(" ");
    // Per user request for CH Robinson: "solo quiero la ciudad, la abreviacion y el zip" (e.g. BROCKTON, MA 02301)
    const address = cityStateZip || street;
    return { address, street, cityState, zip };
  };

  const extractDateTimeFromBlock = (block: string): { date: string; time: string } => {
    const dateMatch = block.match(/(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})/) || 
                      block.match(/(?:Pick\s*Up\s*Date|Delivery\s*Date)\s*[:]?\s*(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})/i);
    let date = "";
    if (dateMatch) {
      date = normalizeDateHelper(dateMatch[1]);
    } else {
      const twoPartMatch = block.match(/\b(\d{1,2})[\/.-](\d{1,2})\b/);
      if (twoPartMatch) {
        const m = twoPartMatch[1].padStart(2, "0");
        const d = twoPartMatch[2].padStart(2, "0");
        const monthInt = parseInt(m, 10);
        const dayInt = parseInt(d, 10);
        if (monthInt >= 1 && monthInt <= 12 && dayInt >= 1 && dayInt <= 31) {
          date = `${m}.${d}.${documentYear}`;
        }
      }
    }

    const rangeMatch = block.match(/(\d{1,2}:\d{2}\s*(?:AM|PM)?\s*[-–]\s*\d{1,2}:\d{2}\s*(?:AM|PM)?)/i);
    const militaryRangeStr = block.match(/(?:Time|Open|Close|At)\b[:]?\s*(\d{4}\s*[-–]\s*\d{4})/i)?.[1];
    const apptMatch = block.match(/(\b\d{1,2}:\d{2}(?:\s*(?:AM|PM))?\s*Appt)/i) || block.match(/(\b\d{4}\b\s*Appt)/i);
    const labeledTimeMatch = block.match(/(?:Pick\s*Up\s*Open|Pick\s*Up\s*Time|Pick\s*Up\s*Close|Delivery\s*Open|Delivery\s*Time|Delivery\s*Close)\s*(?:\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})?\s*(\d{1,2}[:]\d{2}(?:\s*(?:AM|PM))?)/i);
    const fallbackTimeMatch = block.match(/(\b\d{1,2}:\d{2}(?:\s*(?:AM|PM))?)/i);

    let time = "";
    if (rangeMatch) time = rangeMatch[1];
    else if (militaryRangeStr) time = militaryRangeStr;
    else if (apptMatch) time = apptMatch[1];
    else if (labeledTimeMatch) time = labeledTimeMatch[1];
    else if (fallbackTimeMatch) time = fallbackTimeMatch[1];

    if (time) {
      time = time.trim();
      if (time.includes(":") && !time.includes("-") && !time.includes("–")) {
        const t = time.replace(/Appt/i, "").trim();
        const [h, m] = t.split(":");
        let hours = parseInt(h, 10);
        const mins = m?.match(/\d{2}/)?.[0] || "00";
        if (/PM/i.test(time) && hours < 12) hours += 12;
        if (/AM/i.test(time) && hours === 12) hours = 0;
        time = `${hours.toString().padStart(2, "0")}:${mins}`;
      } else if (/^\d{4}$/.test(time)) {
        time = time.substring(0, 2) + ":" + time.substring(2, 4);
      }
    }
    return { date, time };
  };

  // Extract stops:
  // 1. Primary Strategy: C.H. Robinson rate confirmations reliably designate stops via status markers:
  // e.g. *Scheduled to Pick*, *Scheduled Delivery*, *Open Delivery*, Scheduled to Pick, Scheduled Delivery, etc.
  const markerRegex = /[*•"'\s]*\b(Scheduled\s+(?:to\s+Pick|Pickup)|Open\s+(?:to\s+Pick|Pick|Pickup)|Scheduled\s+Delivery|Open\s+Delivery)\b[*•"'\s]*/gi;
  let m;
  const markerList: { text: string; index: number; isPick: boolean }[] = [];
  while ((m = markerRegex.exec(text)) !== null) {
    const isPick = /Pick/i.test(m[1] || m[0]);
    markerList.push({ text: m[1] || m[0], index: m.index, isPick });
  }

  if (markerList.length >= 2) {
    for (let i = 0; i < markerList.length; i++) {
      const curr = markerList[i];
      const prev = i > 0 ? markerList[i - 1] : null;
      const next = i < markerList.length - 1 ? markerList[i + 1] : null;

      const start = prev ? Math.floor((prev.index + curr.index) / 2) : Math.max(0, curr.index - 400);
      const end = next ? Math.floor((curr.index + next.index) / 2) : Math.min(text.length, curr.index + 400);

      const block = text.substring(start, end);
      const addr = extractAddressFromBlock(block);
      const dt = extractDateTimeFromBlock(block);

      const type = curr.isPick ? 'pickup' : 'delivery';
      const pickCount = result.stops.filter(s => s.type === 'pickup').length;
      const delCount = result.stops.filter(s => s.type === 'delivery').length;

      // Match explicit label if present in block, e.g. SHIPPER#1, RECEIVER #1, RECEIVER #2
      const labelMatch = block.match(curr.isPick ? /SHIPPER\s*#\s*\d+/i : /RECEIVER\s*#\s*\d+/i);
      const label = labelMatch ? labelMatch[0].replace(/\s+/g, ' ') : (curr.isPick ? `SHIPPER#${pickCount + 1}` : `RECEIVER #${delCount + 1}`);

      if (addr.address || dt.date || dt.time) {
        result.stops.push({
          type,
          label,
          address: addr.address,
          date: dt.date,
          time: dt.time
        });
      }
    }
  }

  // 2. Secondary Strategy: Standard section splitting or OCR fallback if markers not found or gave < 2 stops
  if (result.stops.length < 2) {
    result.stops.length = 0;
    const standardSections = text.split(/(?=SHIPPER\s*#|RECEIVER\s*#)/i);
    let useStandard = false;

    if (standardSections.length > 1) {
      let hasPick = false;
      let hasDel = false;
      standardSections.forEach(s => {
        const isP = /SHIPPER\s*#/i.test(s);
        const isD = /RECEIVER\s*#/i.test(s);
        const addr = extractAddressFromBlock(s).address;
        if (isP && addr) hasPick = true;
        if (isD && addr) hasDel = true;
      });
      if (hasPick && hasDel) {
        useStandard = true;
      }
    }

    if (useStandard) {
      standardSections.forEach(section => {
        const isPickup = /SHIPPER\s*#/i.test(section);
        const isDelivery = /RECEIVER\s*#/i.test(section);
        
        if (isPickup || isDelivery) {
          const type = isPickup ? 'pickup' : 'delivery';
          const labelMatch = section.match(/(?:SHIPPER|RECEIVER)\s*#\s*\d+/i);
          const label = labelMatch ? labelMatch[0].replace(/\s+/g, ' ') : (isPickup ? 'SHIPPER#1' : 'RECEIVER #1');
          const { address } = extractAddressFromBlock(section);
          const { date, time } = extractDateTimeFromBlock(section);

          if (address || date || time) {
            result.stops.push({
              type,
              address,
              date,
              time,
              label
            });
          }
        }
      });
    } else {
      const schedDelMatch = text.match(/[*•"'\s]*(?:Scheduled|Open)\s+Delivery[*•"'\s]*/i);
      const delLabelMatch = text.match(/RECEIVER\s*#/i);
      const splitIdx = schedDelMatch ? schedDelMatch.index : (delLabelMatch ? delLabelMatch.index : -1);

      if (splitIdx !== -1 && splitIdx !== undefined) {
        const beforeDel = text.substring(0, splitIdx);
        const lastDivider = beforeDel.search(/(?:Ref\s*#|Dominic)[^\n]*$/m) !== -1
          ? (beforeDel.lastIndexOf("Ref #") !== -1 ? beforeDel.lastIndexOf("Ref #") : beforeDel.lastIndexOf("Dominic"))
          : splitIdx - 150;

        const pickSection = text.substring(0, lastDivider > 0 ? lastDivider : splitIdx);
        const delSection = text.substring(lastDivider > 0 ? lastDivider : splitIdx);

        const pAddr = extractAddressFromBlock(pickSection);
        const pDT = extractDateTimeFromBlock(pickSection);
        if (pAddr.address || pDT.date || pDT.time) {
          result.stops.push({
            type: 'pickup',
            label: 'SHIPPER#1',
            address: pAddr.address,
            date: pDT.date,
            time: pDT.time
          });
        }

        const dAddr = extractAddressFromBlock(delSection);
        const dDT = extractDateTimeFromBlock(delSection);
        if (dAddr.address || dDT.date || dDT.time) {
          result.stops.push({
            type: 'delivery',
            label: 'RECEIVER #1',
            address: dAddr.address,
            date: dDT.date,
            time: dDT.time
          });
        }
      }
    }
  }

  // Safety rule: In logistics, every shipment requires a delivery.
  // If we found at least 2 stops and none was marked delivery, the last stop must be a delivery!
  if (result.stops.length >= 2 && !result.stops.some(s => s.type === 'delivery')) {
    result.stops[result.stops.length - 1].type = 'delivery';
    result.stops[result.stops.length - 1].label = 'RECEIVER #1';
  }

  // Final check: filter pickups & deliveries and populate top-level fields
  const finalPickups = result.stops.filter(s => s.type === 'pickup');
  const finalDeliveries = result.stops.filter(s => s.type === 'delivery');

  if (finalPickups.length > 0) {
    result.pickupTime = finalPickups[0].time;
    result.pickupDate = finalPickups[0].date;
    result.originAddress = finalPickups[0].address;
  } else if (result.stops.length > 0) {
    result.pickupTime = result.stops[0].time;
    result.pickupDate = result.stops[0].date;
    result.originAddress = result.stops[0].address;
  }

  if (finalDeliveries.length > 0) {
    const lastDel = finalDeliveries[finalDeliveries.length - 1];
    result.deliveryTime = lastDel.time;
    result.deliveryDate = lastDel.date;
    result.destinationAddress = lastDel.address;
  } else if (result.stops.length > 1) {
    const lastStop = result.stops[result.stops.length - 1];
    result.deliveryTime = lastStop.time;
    result.deliveryDate = lastStop.date;
    result.destinationAddress = lastStop.address;
  }

  return result;
}

function parseLandstar(text: string): ParsedRateCon {
  // Normalize line endings and spaces
  text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/[ \t]+/g, ' ');
  
  // Common OCR fixes
  text = text.replace(/\bKOKORO\b/ig, 'KOKOMO');

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
    brokerName: "LANDSTAR",
    rawTextPreview: text.substring(0, 200) + "..."
  };

  // Load Number
  // Freight Bill # 3101610 or EL # EL10420551
  const loadMatch = text.match(/Freight\s*Bill\s*#\s*(\d+)/i) || 
                    text.match(/EL\s*#\s*(EL\d+)/i) ||
                    text.match(/EL\s*#\s*(\d+)/i);
  if (loadMatch) result.loadNumber = loadMatch[1];

  // Weight extraction (Collect all and pick max, consistent with Robinson preference)
  const weightMatches: number[] = [];
  const landstarWeightRegex = /(?:Wgt|Weight)\s*[:]?\s*(\d{1,3}(?:[,\s]\d{3})*(?:\.\d+)?)/gi;
  let wMatch;
  while ((wMatch = landstarWeightRegex.exec(text)) !== null) {
    const val = parseFloat(wMatch[1].replace(/[,\s]/g, ''));
    if (!isNaN(val) && val > 10) weightMatches.push(val);
  }
  if (weightMatches.length > 0) {
    result.weight = Math.max(...weightMatches).toLocaleString() + " LBS";
  }

  // Rate
  const rateMatch = text.match(/Total\s*[:]?\s*\$?\s*(\d+(?:[,\s]\d{3})*(?:\.\d{2})?)/i) ||
                    text.match(/Charge\s*\$?\s*(\d+(?:[,\s]\d{3})*(?:\.\d{2})?)/i) ||
                    text.match(/Agreed\s*Rate[\s\S]*?Charge[\s\S]*?\$?\s*(\d+(?:[,\s]\d{3})*(?:\.\d{2})?)/i);
  if (rateMatch) result.rate = rateMatch[1].replace(/[,\s]/g, '');

  // Stops
  // Stop #1 Pickup - 
  const stopsRaw = text.split(/(?=Stop\s*#\d+\s*(?:Pickup|Drop|Delivery|Drop-off))/i);
  stopsRaw.forEach(section => {
    const isPickup = /Stop\s*#\d+\s*Pickup/i.test(section);
    const isDelivery = /Stop\s*#\d+\s*(?:Drop|Delivery|Drop-off)/i.test(section);
    
    if (isPickup || isDelivery) {
      const type = isPickup ? 'pickup' : 'delivery';
      const labelMatch = section.match(/Stop\s*#\d+\s*(?:Pickup|Drop|Delivery|Drop-off)/i);
      const label = labelMatch ? labelMatch[0].trim() : (isPickup ? 'Pickup' : 'Delivery');

      // Date & Time from "Target Window"
      // Target Window 05/06/2026 06:00 - 05/06/2026 06:00
      const windowMatch = section.match(/Target\s*Window\s*(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})(?:\s*(\d{1,2}:\d{2}))?\s*[-–]\s*(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})?(?:\s*(\d{1,2}:\d{2}))?/i);
      let date = "";
      let time = "";
      if (windowMatch) {
         date = normalizeDateHelper(windowMatch[1]);
         const startTime = windowMatch[2];
         const endTime = windowMatch[4];
         if (startTime && endTime && startTime !== endTime) {
           time = `${startTime} - ${endTime}`;
         } else if (startTime) {
           time = startTime;
         }
      }

      // Address extraction
      let addressParts: string[] = [];
      
      // Split the section by known labels to isolate address components
      const blocks = section.split(/\b(?:Stop\s*#\d+|Target\s*Window|Location|Address|Contact|Phone|Notes|Item|Qty|Wgt|Appoint)\b/i);
      blocks.forEach(b => {
        let clean = b.trim();
        if (clean.length > 2) {
          // Remove trailing/leading punctuation specifically for Landstar headers
          clean = clean.replace(/^[:\-\s,]+|[:\-\s,]+$/g, "");
          if (clean && !addressParts.includes(clean)) {
            addressParts.push(clean);
          }
        }
      });

      // Per user request: Favor the part that contains "City, ST Zip"
      // We use case-insensitive matching for the city name to avoid missing parts due to OCR case errors
      let cityStateZip = "";
      for (const part of addressParts) {
        // High confidence match: "City, ST 12345" or "City, ST" 
        // We look for at least 3 letters for city name, a comma, and a 2-letter state code
        if (part.match(/\b[A-Za-z\s\.]{3,},\s*[A-Z]{2}\b/i)) {
          cityStateZip = part;
          break;
        }
      }

      let address = cityStateZip || addressParts.filter(p => p.length > 5 && !p.match(/^\d+$/)).join(", ");

      // Fallback address logic if labels are messy
      if (!address) {
        const lines = section.split('\n');
        const startIdx = lines.findIndex(l => /Stop\s*#\d+/i.test(l));
        if (startIdx !== -1) {
          for (let i = 1; i < 8; i++) {
            const line = lines[startIdx + i]?.trim();
            if (line && line.length > 5 && !/Stop|Window|Date|Time|Appoint|Contact|Phone|Notes|Item|Qty|Wgt/i.test(line)) {
              if (line.match(/\b[A-Za-z\s]+,\s*[A-Z]{2}\b/i) || line.match(/\b[A-Z]{2}\s+\d{4,5}/)) {
                address = line;
                break;
              }
            }
          }
        }
      }
      
      if (address) {
        result.stops.push({
          type,
          address,
          date,
          time,
          label
        });
      }
    }
  });

  if (result.stops.length > 0) {
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
  }

  return result;
}

function parseNST(text: string): ParsedRateCon {
  // Normalize
  text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/[ \t]+/g, ' ');

  // Look for sequences of single characters separated by single spaces
  text = text.replace(/(?:^|(?<=\s))([A-Z0-9])\s(?=([A-Z0-9])(?:\s|$))/gi, '$1');
  text = text.replace(/(?:^|(?<=\s))([A-Z0-9])\s(?=([A-Z0-9])(?:\s|$))/gi, '$1');

  const cleanAddress = (addr: string): string => {
    if (!addr) return "";
    
    // Replace newlines with spaces and normalize whitespace
    let cleaned = addr.replace(/\n/g, " ").replace(/\s+/g, " ").trim();
    
    // Replace "EARLIEST" and "LATEST" from the address if they appear
    cleaned = cleaned.replace(/\b(?:EARLIEST|LATEST)\b/gi, "").trim();
    
    // Exclude DC if it looks like a Distribution Center rather than District of Columbia state (e.g., DC 2042)
    if (/\bDC\s+\d{2,4}\b/i.test(cleaned) && !/Washington/i.test(cleaned)) {
      return "";
    }

    // Specifically handle common OCR artifacts where multiple labels are joined
    // Remove specific labels from anywhere in the string
    const noisyLabels = [/REFERENCE\s*NUMBERS/i, /CONSIGNEE\s*[:]?/i, /SHIPPER\s*[:]?/i, /FACILITY\s*NAME\s*[:]?/i, /SPRINGFIELD\s*NDC\s*01Z/i, /\bEARLIEST\b/i, /\bLATEST\b/i];
    for (const label of noisyLabels) {
      cleaned = cleaned.replace(label, "");
    }

    // If "Address:" or "Location:" is in the middle of the string, it often indicates facility name noise before it
    const addrLabelMatch = cleaned.match(/(?:ADDRESS|LOCATION)\s*[:]?\s*/i);
    if (addrLabelMatch && addrLabelMatch.index && addrLabelMatch.index > 5) {
      cleaned = cleaned.substring(addrLabelMatch.index + addrLabelMatch[0].length).trim();
    }

    // If there is Phone/Earliest/Latest/Date/Jul/Aug etc., truncate there to prevent matching date as address
    const truncateIndex = cleaned.search(/\b(?:Phone|Earliest|Latest|Date|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/i);
    if (truncateIndex !== -1 && truncateIndex > 5) {
      cleaned = cleaned.substring(0, truncateIndex).trim();
    }

    // Remove leading noise (labels at the start)
    const prefixPattern = /^(?:\s*(?:\d+\s+)?\b(?:EARLIEST|LATEST|LOCATION|DATE|TIME|PICK-UP|DELIVERY|DESTINATION|ORIGIN|SHIPPER|CONSIGNEE|PICKUP|ADDRESS|FROM|TO|RECEIVER|STOP\s*(?:#?\d+)?|LOADING|UNLOADING|PU|P\/U|DO|DEL|FACILITY\s*NAME|SHIPPING\s*ADDRESS|RECEIVING\s*ADDRESS|DROP\s*OFF|PICK-UP\s*LOCATION|DELIVERY\s*LOCATION|DATE\s*TIME|NOTES|SPECIAL\s*INSTRUCTIONS|UP|PICK|INFO|CONTACT|NAME|PHONE|EMAIL|FAX|MC|DOT|DISPATCHER|DRIVER|TRUCK|TRAILER|LOAD|RATE|TYPE|UNIT|QUANTITY|TOTAL|MODE|SIZE|LINEAR|FEET|TEMPERATURE|PALLET|CASE|HAZMAT|WEIGHT|ESTIMATED|UNLOADING|RECEIPT|EXCHANGE|NOTE|CARRIER|COMMODITY|HANDLING|UNITS|STACKABLE|PIECES|DIMS|TEMP|TEMPERATURE|CONFIRM|RECEIPT|OF|REFERENCE\s*NUMBERS|REF\s*#|REFERENCE)\b\s*[:\/\-]?\s*)+/i;
    cleaned = cleaned.replace(prefixPattern, "").trim();
    
    // Handle cases like "480 Address: 711..." where a number from a previous field is caught
    cleaned = cleaned.replace(/^\d+\s+(?:ADDRESS|LOCATION|SHIPPER|CONSIGNEE|PICKUP|DELIVERY|REFERENCE\s*NUMBERS)[:\-]?\s*/i, "").trim();

    // Strip leading DC/facility codes or stray leading numbers (e.g. "2042 5510 Exploration Dr" -> "5510 Exploration Dr")
    cleaned = cleaned.replace(/^\d{2,4}\s+(?=\d{2,5}\s+[A-Za-z])/i, "").trim();
    cleaned = cleaned.replace(/^\bDC\s*\d+\s+/i, "").trim();

    // Strip township or area noise before the main city (e.g., "5510 Exploration Dr, Decatur Indianapolis" -> "5510 Exploration Dr, Indianapolis")
    cleaned = cleaned.replace(/\bDecatur\s*,?\s+(?=Indianapolis\b)/gi, "").trim();
    cleaned = cleaned.replace(/,\s*Decatur\s*,?\s*(?=Indianapolis\b)/gi, ", ").trim();

    // Strip pieces, pallets, units, cartons, cases, boxes, lbs, commodities and PO numbers from anywhere in address
    cleaned = cleaned.replace(/\b\d+\s*(?:PIECES?|PCS?|PALLETS?|PLTS?|UNITS?|CASES?|BOXES?|CARTONS?|CTNS?|LBS?)\b/gi, "").trim();
    cleaned = cleaned.replace(/\b(?:PIECES?|PCS?|PALLETS?|PLTS?|COMMODITY|TOTAL\s*WEIGHT)\b/gi, "").trim();
    cleaned = cleaned.replace(/\bPO\s*#?\s*\d+\b/gi, "").trim();
    cleaned = cleaned.replace(/\b\d+(?:,\d{3})*\s*(?:LB|LBS|KG|KGS)\b/gi, "").trim();
    cleaned = cleaned.replace(/\s+/g, " ").replace(/,\s*,/g, ", ").replace(/^,\s*|,\s*$/g, "").trim();

    // Remove trailing noise
    const suffixPattern = /(?:\s*\b(?:REFERENCE\s*NUMBERS|REF\s*#|BOL\s*#|PICKUP\s*#|PU\s*#|DO\s*#|STOP\s*#|NOTES|SPECIAL\s*INSTRUCTIONS|CONTACT|PHONE|EMAIL|FAX|DATE|TIME|APPOINTMENT|APPT|WINDOW|ETA|SCHEDULED|ARRIVAL|CHECK-IN|FCFS|ASAP|DELIVERY|PICKUP|SHIPPER|CONSIGNEE|ORIGIN|DESTINATION|LOCATION|ADDRESS|FROM|TO|RECEIVER|LOADING|UNLOADING|PU|P\/U|DEL|FACILITY|SHIPPING|RECEIVING|DROP|UP|PICK|INFO|NAME|MC|DOT|DISPATCHER|DRIVER|TRUCK|TRAILER|LOAD|RATE|TYPE|UNIT|QUANTITY|TOTAL|MODE|SIZE|LINEAR|FEET|TEMPERATURE|PALLET|CASE|HAZMAT|WEIGHT|ESTIMATED|RECEIPT|EXCHANGE|NOTE|CARRIER|COMMODITY|HANDLING|UNITS|STACKABLE|PIECES|DIMS|TEMP|CONFIRM|OF)\b\s*[:\/\-]?\s*)+$/i;
    cleaned = cleaned.replace(suffixPattern, "").trim();
    
    const blacklist = [
      "1701 Edison Drive", "PO Box 9049", "Louisville, KY 40209", "Milford, OH 45150",
      "FLEET ONE FACTORING", "WEX", "PO BOX 94565",
      "pickup / delivery", "pickup/delivery", "pickup / delivery OR BOTH",
      "delivery OR BOTH", "pickup / delivery OR", "Pallet Yes", "Piece 20000",
      "Pallet", "Piece", "Commodity", "Handling Units"
    ];
    
    for (const item of blacklist) {
      if (cleaned.toUpperCase().includes(item.toUpperCase())) return "";
    }
    
    if (cleaned.length < 5) return "";

    // Deduplicate duplicate consecutive words or phrases
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

    let words = cleaned.replace(/\s+/g, ' ').split(' ');
    let k = 0;

    while (k < words.length) {
      let advanced = false;
      for (let len = 4; len >= 1; len--) {
        if (k + len * 2 <= words.length) {
          const firstPhrase = words.slice(k, k + len).join(' ');
          const secondPhrase = words.slice(k + len, k + len * 2).join(' ');
          
          if (norm(firstPhrase) === norm(secondPhrase)) {
            const lastWordOfSecond = words[k + len * 2 - 1];
            const hasComma = lastWordOfSecond.endsWith(',');
            
            words.splice(k + len, len);
            
            if (hasComma && !words[k + len - 1].endsWith(',')) {
              words[k + len - 1] += ',';
            }
            
            advanced = true;
            break;
          }
        }
      }
      if (!advanced) {
        k++;
      }
    }

    cleaned = words.join(' ').replace(/\s+,/g, ',').replace(/\s+/g, ' ').trim();

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
    brokerName: "NST",
    rawTextPreview: text.substring(0, 200) + "..."
  };

  const normalizeWeight = (w: string): string => {
    if (!w) return "";
    const clean = w.replace(/,/g, '').trim();
    return clean ? `${clean} LBS` : "";
  };

  const normalizeDate = (d: string): string => {
    // If the date contains alphabetical month (e.g. Jul 15, 2026)
    const m = d.match(/\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s*(\d{2,4})\b/i);
    if (m) {
      const months: Record<string, string> = {
        jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
        jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
      };
      const key = m[1].substring(0, 3).toLowerCase();
      const month = months[key];
      if (month) {
        const day = m[2].padStart(2, '0');
        let year = m[3];
        if (year.length === 2) year = `20${year}`;
        return `${month}.${day}.${year}`;
      }
    }
    return normalizeDateHelper(d);
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
    
    // Handle HHMM format
    if (!clean.includes(':') && clean.length === 4 && !isNaN(Number(clean))) {
      const h = parseInt(clean.substring(0, 2), 10);
      const m = parseInt(clean.substring(2, 4), 10);
      if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      }
      return "";
    }

    // Handle HH:MM format
    if (clean.includes(':')) {
      let [hours, minutes] = clean.split(':');
      let h = parseInt(hours, 10);
      let mStr = minutes.match(/^\d{2}/)?.[0] || "00";
      let m = parseInt(mStr, 10);
      
      if (isNaN(h) || isNaN(m)) return "";
      
      if (isPM && h < 12) h += 12;
      if (isAM && h === 12) h = 0;
      
      if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      }
      return "";
    }

    return "";
  };

  // --- Windowed Extraction for Header Fields ---
  result.loadNumber = extractInWindow(text, 
    ['Our Invoice Reference Load #', 'Turvo Shipment #', 'Load #', 'Order #', 'PO #', 'PO#', 'Shipment ID', 'Pro #', 'PRO NUMBER', 'Reference #', 'Booking #', 'Confirmation #', 'Trip #', 'Job #', 'Convoy ID'], 
    [/\s*[:.]?\s*([A-Z0-9-]{4,})/i, /([A-Z0-9-]{4,})/i]
  ) || (text.match(PATTERNS.loadNumber[0])?.[1] || "");

  result.weight = normalizeWeight(extractInWindow(text, 
    ['total gross weight', 'Gross Weight', 'Estimated Weight', 'Total Weight', 'Actual Weight', 'Weight', 'Wt', 'Wgt', 'Est Wgt'], 
    [/\s*[:.]?\s*(\d+(?:,\d{3})*|\d+)/i]
  )) || normalizeWeight(text.match(PATTERNS.weight[0])?.[1] || "");

  // Rate extraction with scoring
  const rateAnchors = ['Total Pay', 'Rate', 'Total', 'Amount', 'Pay', 'Flat Rate', 'Carrier Pay', 'Linehaul', 'All-in', 'Grand Total', 'Agreed Amount', 'Amount to invoice'];
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
  
  // Extract Broker Email
  const emailMatch = text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/);
  if (emailMatch) {
    result.brokerEmail = emailMatch[0];
  }

  // --- Multi-Stop Detection with Segmentation ---
  const stopMarkers = [
    { pattern: /(?:Shipper|Origin|Pickup|Pick-up)\s*[\-\u2010-\u2015]\s*(?:Pickup|Stop)\s*(\d+)\s*of\s*(\d+)/i, type: 'pickup', priority: 5 },
    { pattern: /(?:Consignee|Destination|Delivery)\s*[\-\u2010-\u2015]\s*(?:Delivery|Stop)\s*(\d+)\s*of\s*(\d+)/i, type: 'delivery', priority: 5 },
    { pattern: /(?:PU|DO|Stop)\s*#?\s*(\d+)/i, type: 'auto', priority: 4 },
    { pattern: /#\s*(\d+)\s*(Shipper|Consignee|Destination)/i, type: 'auto', priority: 4 },
    { pattern: /Stop\s*#?\s*(\d+)\s*[:\-]?\s*(Pick|Del)/i, type: 'auto', priority: 2 },
    { pattern: /Stop\s*#?\s*(\d+)/i, type: 'auto', priority: 2 },
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
        type = sub.includes('pick') || sub.includes('shipper') || sub.includes('pu') ? 'pickup' : 'delivery';
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
    const pickupMatch = text.match(/(?:pickup|pick-up|shipper|origin)/i);
    const deliveryMatch = text.match(/(?:delivery|consignee|destination)/i);
    
    if (pickupMatch) foundMarkers.push({ index: pickupMatch.index || 0, type: 'pickup', label: 'Pickup', priority: 1 });
    if (deliveryMatch) foundMarkers.push({ index: deliveryMatch.index || 0, type: 'delivery', label: 'Delivery', priority: 1 });
  }

  for (let i = 0; i < foundMarkers.length; i++) {
    const start = foundMarkers[i].index;
    const end = (i < foundMarkers.length - 1) ? foundMarkers[i + 1].index : text.length;
    let section = text.substring(start, end);
    
    if (i === foundMarkers.length - 1) {
      const termsIndex = section.search(/\b(?:Terms\s*(?:and|&)\s*Conditions|FAILURE\s*TO\s*COMPLY|Special\s*Instructions:|Trailer\s*Maintenance|Accept\/Decline\/View\s*Tender)\b/i);
      if (termsIndex !== -1) {
        section = section.substring(0, termsIndex);
      }
    }
    
    // Windowed extraction within the stop section
    const rangeMatch = section.match(/(\d{1,2}:\d{2}\s*(?:AM|PM)?\s*(?:[-–]|to|through)\s*\d{1,2}:\d{2}\s*(?:AM|PM)?)/i);
    let time = "";
    if (rangeMatch) {
      const parts = rangeMatch[1].split(/(?:[-–]|to|through)/gi);
      const normParts = parts.map(p => normalizeTime(p.trim())).filter(Boolean);
      if (normParts.length === 2) {
        time = `${normParts[0]} - ${normParts[1]}`;
      } else if (normParts.length === 1) {
        time = normParts[0];
      } else {
        time = rangeMatch[1].trim();
      }
    } else {
      // Look for Date Jul 15, 2026 17:00
      const dateWithTimeMatch = section.match(/Date\s+(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2},?\s*\d{4}\s+(\d{1,2}:\d{2})/i);
      if (dateWithTimeMatch) {
        time = normalizeTime(dateWithTimeMatch[1]);
      } else {
        const timeMatch = section.match(PATTERNS.time);
        time = timeMatch ? normalizeTime(timeMatch[1]) : "";
      }
    }
    const tzMatch = section.match(PATTERNS.timezone);
    if (time && tzMatch && !PATTERNS.timezone.test(time)) time += ` ${tzMatch[1].toUpperCase()}`;

    // Handle alpha date match like "Date Jul 15, 2026"
    const alphaDateMatch = section.match(/(?:Date\s+)?\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s*(\d{2,4})\b/i);
    let date = "";
    if (alphaDateMatch) {
      date = normalizeDate(alphaDateMatch[0]);
    } else {
      const dateMatch = section.match(PATTERNS.date);
      date = dateMatch ? normalizeDate(dateMatch[1]) : "";
    }

    // Address extraction
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

function parseTQL(text: string): ParsedRateCon {
  // Normalize
  text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/[ \t]+/g, ' ');

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
    brokerName: "TQL",
    rawTextPreview: text.substring(0, 200) + "..."
  };

  // Load Number: TQL PO# 36493960
  const poMatch = text.match(/TQL\s*PO#\s*(\d+)/i) || text.match(/PO#\s*(\d{8})/);
  if (poMatch) result.loadNumber = poMatch[1];

  // Weight: Estimated Weight 42000
  const weightMatch = text.match(/Estimated\s*Weight\s*(\d+)/i) || 
                      text.match(/Weight\s*[:]?\s*(\d{1,3}(?:[,\s]\d{3})*)/i);
  if (weightMatch) result.weight = weightMatch[1].replace(/[,\s]/g, '') + " LBS";

  // Rate: TQL often hides rate on info sheets, but look for it.
  const rateMatch = text.match(/(?:Total\s*Charge|Carrier\s*Pay|Rate)\s*[:]?\s*\$?\s*(\d+(?:[,\s]\d{3})*(?:\.\d{2})?)/i);
  if (rateMatch) result.rate = rateMatch[1].replace(/[,\s]/g, '');

  // Stops Detection
  // TQL uses PICKUPS and DROPS headers
  // sometimes DROPS is placed at the end of OCR or we have "Consignee City State" as section head
  let pickupSection = "";
  let dropSection = "";

  const dropsIndex = text.search(/\bDROPS\b/i);
  const consigneeIndex = text.search(/\bConsignee\b/i);

  let splitIndex = -1;
  const isDropsIndexAtEnd = dropsIndex > text.length - 150;
  if (consigneeIndex !== -1 && (consigneeIndex < dropsIndex || dropsIndex === -1 || isDropsIndexAtEnd)) {
    splitIndex = consigneeIndex;
  } else {
    splitIndex = dropsIndex;
  }

  if (splitIndex !== -1) {
    pickupSection = text.substring(0, splitIndex);
    dropSection = text.substring(splitIndex);
  } else {
    const splitByDrops = text.split(/\bDROPS\b/i);
    if (splitByDrops.length > 1) {
      pickupSection = splitByDrops[0];
      dropSection = splitByDrops[1];
    } else {
      pickupSection = text;
      dropSection = "";
    }
  }

  const extractTQLStops = (section: string, type: 'pickup' | 'delivery') => {
    // TQL tables: [Name/Shed] [City] [State] [Zip] [Ref#] [Date] [Time]
    // We look for patterns like "Pittsburgh PA 15225"
    // Restricting state abbreviation to actual valid US/Canadian identifiers to avoid matching PO Box, etc.
    const stopRegex = /\b([A-Z][A-Za-z\s\.\,\/\(\)\-]{2,40})\s+(AL|AK|AS|AZ|AR|CA|CO|CT|DE|DC|FM|FL|GA|GU|HI|ID|IL|IN|IA|KS|KY|LA|ME|MH|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|MP|OH|OK|OR|PW|PA|PR|RI|SC|SD|TN|TX|UT|VT|VI|VA|WA|WV|WI|WY|AB|BC|MB|NB|NL|NS|NT|NU|ON|PE|QC|SK|YT)\s+(\d{5}(?:-\d{4})?)\b/gi;
    let match;
    const addedZips = new Set<string>();

    while ((match = stopRegex.exec(section)) !== null) {
      let rawCity = match[1].trim();
      const st = match[2].toUpperCase();
      const zip = match[3];

      // 1. Remove parenthetical text: "(NEVILLE ISLAND,PA)"
      let city = rawCity.replace(/\([^\)]*\)/g, "").trim();
      
      // 2. Split by common delimiters
      const parts = city.split(/[\/\n,]/);
      city = parts[parts.length - 1].trim();
      
      // 3. Filter common facility keywords
      const facilityKeywords = ["RECYCLING", "WASTE", "MANAGEMENT", "GREENSTAR", "PLANT", "WAREHOUSE", "LOGISTICS", "INDUSTRIES", "CORP", "INC", "LLC", "Shed"];
      let words = city.split(/\s+/).filter(w => w.length > 0);
      words = words.filter(w => !facilityKeywords.includes(w.toUpperCase()));
      
      // 4. Refine to last 1-2 words (most cities are 1-2 words)
      if (words.length > 2) {
        words = words.slice(-2);
      }
      
      // 5. De-duplicate consecutive identical words (e.g. HENDERSON HENDERSON)
      if (words.length === 2 && words[0].toLowerCase() === words[1].toLowerCase()) {
        city = words[1];
      } else {
        city = words.join(" ");
      }
      
      // Clean up punctuation
      city = city.replace(/^[\s,.-]+|[\s,.-]+$/g, "").trim();
      
      const cleanAddress = `${city}, ${st} ${zip}`;
      
      // De-duplicate: If we already have this zip in this section, skip it
      // This handles the case where the city is mentioned multiple times or in slightly different ways
      if (addedZips.has(zip)) continue;
      
      // Look forward for date and time
      const forwardWindow = section.substring(match.index, Math.min(match.index + 300, section.length));
      const dateMatch = forwardWindow.match(/(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})/);
      
      // TQL Time formats: "FCFS 06:00 to 16:00", "Appt 09:10", "Window 08:00 - 12:00"
      const timeMatch = forwardWindow.match(/(?:FCFS|Appt|Window|Target)?\s*(\d{1,2}:\d{2}\s*(?:to|[-–]|through)\s*\d{1,2}:\d{2}|\d{1,2}:\d{2}(?:\s*(?:AM|PM))?)/i) ||
                        forwardWindow.match(/(\d{1,2}:\d{2}\s*(?:to|[-–]|through)\s*\d{1,2}:\d{2})/);
      
      const date = dateMatch ? normalizeDateHelper(dateMatch[1]) : "";
      // Clean up newlines or extra spacing inside the matched time string
      let time = timeMatch ? timeMatch[0].replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim() : "";
      
      // Clean up "FCFS", "Appt" from the start of time
      time = time.replace(/^(?:FCFS|Appt|Window|Target)\s+/i, "");

      if (city) {
        result.stops.push({
          type,
          address: cleanAddress,
          date,
          time,
          label: type === 'pickup' ? 'Pickup' : 'Delivery'
        });
        addedZips.add(zip);
      }
    }
  };

  extractTQLStops(pickupSection, 'pickup');
  extractTQLStops(dropSection, 'delivery');

  // Fallback: search the entire text for city, state, zip patterns if no stops were found
  if (result.stops.length === 0) {
    const stopRegex = /\b([A-Z][A-Za-z\s\.\,\/\(\)\-]{2,40})\s+(AL|AK|AS|AZ|AR|CA|CO|CT|DE|DC|FM|FL|GA|GU|HI|ID|IL|IN|IA|KS|KY|LA|ME|MH|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|MP|OH|OK|OR|PW|PA|PR|RI|SC|SD|TN|TX|UT|VT|VI|VA|WA|WV|WI|WY|AB|BC|MB|NB|NL|NS|NT|NU|ON|PE|QC|SK|YT)\s+(\d{5}(?:-\d{4})?)\b/gi;
    let match;
    const foundStops: { type: 'pickup' | 'delivery'; address: string; date: string; time: string; index: number }[] = [];
    const addedZips = new Set<string>();

    while ((match = stopRegex.exec(text)) !== null) {
      const rawCity = match[1].trim();
      const st = match[2].toUpperCase();
      const zip = match[3];

      // Remove parenthetical noise & facility keywords
      let city = rawCity.replace(/\([^\)]*\)/g, "").trim();
      const parts = city.split(/[\/\n,]/);
      city = parts[parts.length - 1].trim();
      
      const facilityKeywords = ["RECYCLING", "WASTE", "MANAGEMENT", "GREENSTAR", "PLANT", "WAREHOUSE", "LOGISTICS", "INDUSTRIES", "CORP", "INC", "LLC", "Shed", "TQL"];
      let words = city.split(/\s+/).filter(w => w.length > 0);
      words = words.filter(w => !facilityKeywords.includes(w.toUpperCase()));
      
      if (words.length > 2) words = words.slice(-2);
      if (words.length === 2 && words[0].toLowerCase() === words[1].toLowerCase()) {
        city = words[1];
      } else {
        city = words.join(" ");
      }
      city = city.replace(/^[\s,.-]+|[\s,.-]+$/g, "").trim();
      
      if (!city || city.length < 3) continue;
      if (addedZips.has(zip)) continue;

      const cleanAddress = `${city}, ${st} ${zip}`;

      // Search 150 chars before the match for type cues
      const startIdx = Math.max(0, match.index - 150);
      const beforeText = text.substring(startIdx, match.index).toLowerCase();
      
      let type: 'pickup' | 'delivery' = 'pickup';
      if (beforeText.includes('delivery') || beforeText.includes('drop') || beforeText.includes('consignee') || beforeText.includes('receiver') || beforeText.includes('del:')) {
        type = 'delivery';
      } else if (beforeText.includes('pickup') || beforeText.includes('pick up') || beforeText.includes('p/u') || beforeText.includes('shipper')) {
        type = 'pickup';
      }

      // Extract date/time from a forward window
      const forwardWindow = text.substring(match.index, Math.min(match.index + 200, text.length));
      const dateMatch = forwardWindow.match(/(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})/);
      const timeMatch = forwardWindow.match(/(?:FCFS|Appt|Window|Target)?\s*(\d{1,2}:\d{2}\s*(?:to|[-–]|through)\s*\d{1,2}:\d{2}|\d{1,2}:\d{2}(?:\s*(?:AM|PM))?)/i) ||
                        forwardWindow.match(/(\d{1,2}:\d{2}\s*(?:to|[-–]|through)\s*\d{1,2}:\d{2})/);
      
      const date = dateMatch ? normalizeDateHelper(dateMatch[1]) : "";
      let time = timeMatch ? timeMatch[0].replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim() : "";
      time = time.replace(/^(?:FCFS|Appt|Window|Target)\s+/i, "");

      foundStops.push({
        type,
        address: cleanAddress,
        date,
        time,
        index: match.index
      });
      addedZips.add(zip);
    }

    // Adjust types if needed
    if (foundStops.length === 2 && foundStops[0].type === foundStops[1].type) {
      foundStops[0].type = 'pickup';
      foundStops[1].type = 'delivery';
    } else if (foundStops.length > 2) {
      const hasPickup = foundStops.some(s => s.type === 'pickup');
      const hasDelivery = foundStops.some(s => s.type === 'delivery');
      if (hasPickup && !hasDelivery) {
        foundStops[foundStops.length - 1].type = 'delivery';
      } else if (!hasPickup && hasDelivery) {
        foundStops[0].type = 'pickup';
      }
    }

    // Map to result.stops
    foundStops.forEach(s => {
      result.stops.push({
        type: s.type,
        address: s.address,
        date: s.date,
        time: s.time,
        label: s.type === 'pickup' ? 'Pickup' : 'Delivery'
      });
    });
  }

  // Final verification for required fields
  if (result.stops.length > 0) {
    const p = result.stops.filter(s => s.type === 'pickup');
    const d = result.stops.filter(s => s.type === 'delivery');
    if (p.length > 0) {
      result.pickupDate = p[0].date;
      result.pickupTime = p[0].time;
      result.originAddress = p[0].address;
    }
    if (d.length > 0) {
      const last = d[d.length - 1];
      result.deliveryTime = last.time;
      result.destinationAddress = last.address;
    }
  }

  return result;
}

function extractAddressFromRXOBlock(block: string): string {
  let cleaned = block.replace(/\s+/g, ' ').trim();
  
  // Look for city, state zip at end or near end
  const cityStateZipMatch = cleaned.match(/(?:,\s*|\s+)([A-Za-z\s.-]+,\s*[A-Z]{2}\s*\d{5}(?:-\d{4})?)/i) ||
                            cleaned.match(/(?:,\s*|\s+)([A-Za-z\s.-]+\s+[A-Z]{2}\s+\d{5}(?:-\d{4})?)/i) ||
                            cleaned.match(/(?:,\s*|\s+)([A-Za-z\s.-]+,\s*[A-Z]{2})/i);

  if (!cityStateZipMatch) {
    return cleaned;
  }

  const cityStateZip = cityStateZipMatch[1].trim();
  const prefix = cleaned.substring(0, cityStateZipMatch.index).trim();

  if (!prefix) return cityStateZip;

  // Find street address inside prefix:
  // Look for street number followed by street suffix words
  const streetRegex = /\b(\d{1,5}\s+[A-Za-z0-9\s.#\/-]+?(?:DR|ROAD|RD|AVE|AVENUE|ST|STREET|BLVD|BOULDER|WAY|LN|LANE|CT|COURT|PL|PLACE|HWY|HIGHWAY|PKWY|PARKWAY|SUITE|STE|UNIT|BLDG|BUILDING)\b(?:\s+(?:SUITE|STE|UNIT|#|BLDG)\s*[A-Za-z0-9-]+)?)/gi;
  
  const streetMatches = [...prefix.matchAll(streetRegex)];
  if (streetMatches.length > 0) {
    let street = streetMatches[streetMatches.length - 1][1].trim();
    if (street.includes('.')) {
      const parts = street.split('.').map(p => p.trim()).filter(Boolean);
      street = parts[parts.length - 1];
    }
    return `${street}, ${cityStateZip}`;
  }

  // Fallback: try matching simple street number + words
  const simpleStreetMatch = prefix.match(/\b(\d{1,5}\s+[A-Za-z0-9\s.#\/-]{3,40})$/i);
  if (simpleStreetMatch) {
    let street = simpleStreetMatch[1].trim();
    if (street.includes('.')) {
      const parts = street.split('.').map(p => p.trim()).filter(Boolean);
      street = parts[parts.length - 1];
    }
    return `${street}, ${cityStateZip}`;
  }

  return cityStateZip;
}

function parseRXO(text: string): ParsedRateCon {
  // Normalize line endings and spaces
  text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/[ \t]+/g, ' ');

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
    brokerName: "RXO",
    rawTextPreview: text.substring(0, 200) + "..."
  };

  // Load Number
  // "Load Confirmation 23604126", "Order # ... 23604126", "LZ23604126"
  const loadMatch = text.match(/Load\s*Confirmation\s*[:#]?\s*(\d+)/i) ||
                    text.match(/Order\s*#[\s\S]*?\n?\s*(\d{7,10})/i) ||
                    text.match(/\bLZ(\d{7,10})\b/i) ||
                    text.match(/\b(\d{7,9})\b/);
  if (loadMatch) {
    result.loadNumber = loadMatch[1];
  }

  // Weight extraction
  let extractedWeight = "";
  const totalWeightMatch = text.match(/Total\s*Weight\s*\([^)]*\)[\s\S]{0,100}?\b(\d{4,6}(?:\.\d{1,2})?)\b/i) ||
                           text.match(/Order\s*#[\s\S]{0,100}?\b(\d{4,6}(?:\.\d{1,2})?)\b/i) ||
                           text.match(/Weight[\s\S]{0,50}?\b(\d{4,6}(?:\.\d{1,2})?)\b/i);

  if (totalWeightMatch) {
    const wVal = parseFloat(totalWeightMatch[1]);
    if (!isNaN(wVal) && wVal > 1000 && wVal < 80000) {
      extractedWeight = Math.round(wVal).toLocaleString() + " LBS";
    }
  }

  if (!extractedWeight) {
    const stopWeightRegex = /\b(\d{4,5}(?:\.\d{1,2})?)\b(?=\s*(?:\(\d+\)|PO|SI|AO|WATER|LBS|\(lbs\)))/gi;
    const matches: number[] = [];
    let m;
    while ((m = stopWeightRegex.exec(text)) !== null) {
      const val = parseFloat(m[1]);
      if (!isNaN(val) && val > 1000 && val < 80000) matches.push(val);
    }
    if (matches.length > 0) {
      extractedWeight = Math.max(...matches).toLocaleString() + " LBS";
    }
  }
  result.weight = extractedWeight;

  // Rate
  const rateMatch = text.match(/Total\s*Carrier\s*Pay\s*\$?\s*(\d+(?:[,\s]\d{3})*(?:\.\d{2})?)/i) ||
                    text.match(/Line\s*Haul[\s\S]*?\$?\s*(\d+(?:[,\s]\d{3})*(?:\.\d{2})?)/i) ||
                    text.match(/Total\s*[:]?\s*\$?\s*(\d+(?:[,\s]\d{3})*(?:\.\d{2})?)/i);
  if (rateMatch) {
    result.rate = rateMatch[1].replace(/[,\s]/g, '');
  }

  // Broker Email
  const rxoEmailMatch = text.match(/([a-zA-Z0-9._-]+@rxo\.com)/i);
  if (rxoEmailMatch) {
    result.brokerEmail = rxoEmailMatch[1];
  } else {
    const genericEmail = text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/);
    if (genericEmail) result.brokerEmail = genericEmail[0];
  }

  // Stops Extraction
  const stopDetailIndex = text.search(/STOP\s*DETAIL/i);
  const stopSectionText = stopDetailIndex !== -1 ? text.substring(stopDetailIndex) : text;

  const stopRegex = /\b(PU|SO|DO|DEL)\b\s+(?:Arrival|Scheduled|\d{1,2}[\/.-])[\s\S]*?(?=\b(?:PU|SO|DO|DEL)\b\s+(?:Arrival|Scheduled|\d{1,2}[\/.-])|\bNOTES\b|\bOrder Notes\b|\bINSTRUCTIONS\b|$)/gi;
  const stopMatches = [...stopSectionText.matchAll(stopRegex)];

  stopMatches.forEach(sm => {
    const section = sm[0];
    const stopTypeStr = sm[1].toUpperCase();
    const isPickup = stopTypeStr === 'PU';
    const type = isPickup ? 'pickup' : 'delivery';
    const label = isPickup ? 'PU' : 'SO';

    // Date: e.g. Arrival 07/22/26 or 07/22/2026
    const dateMatch = section.match(/(?:Arrival|Scheduled|\b)\s*(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})/i) ||
                      section.match(/\b(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})\b/);
    let date = dateMatch ? normalizeDateHelper(dateMatch[1]) : "";

    // Time: e.g. 09:00 - 21:59 or 09:00 - 12:00 or 09:00 - 1200
    const timeRangeMatch = section.match(/(\d{1,2}:\d{2}\s*(?:AM|PM)?\s*[-–]\s*\d{1,2}:?\d{2}\s*(?:AM|PM)?)/i);
    const singleTimeMatch = section.match(/(\d{1,2}:\d{2}\s*(?:AM|PM)?)/i);
    let time = "";
    if (timeRangeMatch) {
      time = timeRangeMatch[1].trim();
      time = time.replace(/(\b\d{1,2}):?(\d{2})\b/g, (_m, h, min) => {
        return `${h.padStart(2, '0')}:${min}`;
      });
    } else if (singleTimeMatch) {
      time = singleTimeMatch[1].trim();
    }

    // Extract address block: everything between departure/N/A and commodity/WATER/PO/Dim:/Weight
    let addrBlock = section.replace(/^[\s\S]*?(?:Arrival|Departure|N\/A|\d{1,2}:\d{2}(?:\s*[-–]\s*\d{1,2}:?\d{2})?)\s*(?:N\/A)?/i, "")
                          .split(/\b(?:WATER|Dim:|PO\b|SI\b|AO\b|Commodity|Weight|Reference)\b/i)[0]
                          .trim();

    let address = extractAddressFromRXOBlock(addrBlock);

    if (address) {
      result.stops.push({
        type,
        address,
        date,
        time,
        label
      });
    }
  });

  if (result.stops.length > 0) {
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
  }

  return result;
}

function parseOpenRoad(text: string): ParsedRateCon {
  text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

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
    brokerName: "OPENROAD",
    rawTextPreview: text.substring(0, 200) + "..."
  };

  // Load Number
  const loadMatch = text.match(/(?:Carrier\s*Rate\s*Confirmation|Load\s*Number|Load\s*#)\s*[:#]?\s*([A-Z0-9-]+)/i) ||
                    text.match(/\b(OR\d{5,8})\b/i);
  if (loadMatch) {
    result.loadNumber = loadMatch[1].trim();
  }

  // Weight
  const weightMatch = text.match(/(\d+(?:,\d{3})*|\d+)\s*(?:lbs|LBS|pounds)/i) ||
                      text.match(/Weight\s*[:]?\s*(\d+(?:,\d{3})*|\d+)/i);
  if (weightMatch) {
    const rawW = weightMatch[1].replace(/,/g, '');
    const numW = parseInt(rawW, 10);
    if (!isNaN(numW)) {
      result.weight = numW.toLocaleString() + " LBS";
    }
  }

  // Rate
  const rateMatch = text.match(/Total\s*Cost\s*(?:USD|\$)?\s*(\d+(?:[,\s]\d{3})*(?:\.\d{2})?)/i) ||
                    text.match(/Net\s*Freight\s*Charges\s*(?:USD|\$)?\s*(\d+(?:[,\s]\d{3})*(?:\.\d{2})?)/i) ||
                    text.match(/(?:Rate|Total|Pay)\s*[:]?\s*(?:USD|\$)?\s*(\d+(?:[,\s]\d{3})*(?:\.\d{2})?)/i);
  if (rateMatch) {
    result.rate = rateMatch[1].replace(/[,\s]/g, '');
  }

  // Broker Email
  const openRoadEmailMatch = text.match(/([a-zA-Z0-9._-]+@openroad\.inc)/i);
  if (openRoadEmailMatch) {
    result.brokerEmail = openRoadEmailMatch[1];
  } else {
    const genericEmail = text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/);
    if (genericEmail) result.brokerEmail = genericEmail[0];
  }

  // Stops extraction
  const stopBlockRegex = /(Shipper\s*Pickup|Consignee\s*Delivery|Pickup|Delivery)\s*\((?:Stop\s*)?(\d+)\)[\s\S]*?(?=(?:Shipper\s*Pickup|Consignee\s*Delivery|Pickup|Delivery)\s*\((?:Stop\s*)?\d+\)|Shipment\s*Information|Carrier\s*Fees|Pursuant\s*to|$)/gi;

  const matches = [...text.matchAll(stopBlockRegex)];

  if (matches.length > 0) {
    matches.forEach(m => {
      const section = m[0];
      const headerType = m[1].toLowerCase();
      const isPickup = headerType.includes('pickup') || headerType.includes('shipper');
      const type: 'pickup' | 'delivery' = isPickup ? 'pickup' : 'delivery';
      const stopNum = m[2];
      const label = `${isPickup ? 'Pickup' : 'Delivery'} ${stopNum}`;

      // Date
      const dateMatch = section.match(/(?:Pick\s*Up\s*Date|Delivery\s*Date|Expected\s*Date)\s*[:]?\s*(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})/i) ||
                        section.match(/\b(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})\b/);
      const date = dateMatch ? normalizeDateHelper(dateMatch[1]) : "";

      // Time
      const timeMatch = section.match(/Appointment\s*Time\s*[:]?\s*(\d{1,2}:\d{2}(?:\s*[-–]\s*\d{1,2}:\d{2})?(?:\s*(?:AM|PM))?)/i) ||
                        section.match(/(\d{1,2}:\d{2}\s*[-–]\s*\d{1,2}:\d{2})/i) ||
                        section.match(/(\d{1,2}:\d{2})/);
      let time = "";
      if (timeMatch) {
        time = timeMatch[1].trim();
        if (time.includes('-')) {
          time = time.replace(/\s*-\s*/, ' - ');
        }
      }

      // Address
      const lines = section.split('\n').map(l => l.trim()).filter(Boolean);
      let address = "";

      const cityStateZipIdx = lines.findIndex(l => 
        /\b[A-Za-z\s.-]+,\s*[A-Z]{2}\s*(?:US\s*)?\d{5}(?:-\d{4})?\b/i.test(l)
      );

      if (cityStateZipIdx !== -1) {
        let cityStateZip = lines[cityStateZipIdx].match(/\b([A-Za-z\s.-]+,\s*[A-Z]{2}\s*(?:US\s*)?\d{5}(?:-\d{4})?)\b/i)?.[1] || lines[cityStateZipIdx];
        cityStateZip = cityStateZip.replace(/\b([A-Z]{2})\s+US\s+(\d{5})/i, '$1 $2');

        let street = "";
        let facility = "";

        if (cityStateZipIdx > 0) {
          const lineBefore = lines[cityStateZipIdx - 1];
          if (/\d{1,5}\s+[A-Za-z0-9\s.#\/-]+/i.test(lineBefore)) {
            street = lineBefore;
            if (cityStateZipIdx > 1) {
              const line2Before = lines[cityStateZipIdx - 2];
              if (!/Shipper|Consignee|Pickup|Delivery|Stop|Date|Appointment/i.test(line2Before)) {
                facility = line2Before;
              }
            }
          } else if (!/Shipper|Consignee|Pickup|Delivery|Stop|Date|Appointment/i.test(lineBefore)) {
            facility = lineBefore;
          }
        }

        const addrParts = [facility, street, cityStateZip].filter(Boolean);
        address = addrParts.join(', ');
      }

      if (!address) {
        const generalAddrMatch = section.match(/\b(\d{1,5}\s+[A-Za-z0-9\s.#\/-]+,\s*[A-Za-z\s.-]+,\s*[A-Z]{2}\s*(?:US\s*)?\d{5})\b/i);
        if (generalAddrMatch) {
          address = generalAddrMatch[1].replace(/\b([A-Z]{2})\s+US\s+(\d{5})/i, '$1 $2');
        }
      }

      result.stops.push({
        type,
        address,
        date,
        time,
        label
      });
    });
  }

  if (result.stops.length > 0) {
    const pickups = result.stops.filter(s => s.type === 'pickup');
    const deliveries = result.stops.filter(s => s.type === 'delivery');
    if (pickups.length > 0) {
      result.pickupDate = pickups[0].date;
      result.pickupTime = pickups[0].time;
      result.originAddress = pickups[0].address;
    }
    if (deliveries.length > 0) {
      const lastDel = deliveries[deliveries.length - 1];
      result.deliveryTime = lastDel.time;
      result.destinationAddress = lastDel.address;
    }
  }

  return result;
}

function parseArrive(text: string): ParsedRateCon {
  // Normalize line endings
  text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

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
    brokerName: "ARRIVE",
    rawTextPreview: text.substring(0, 200) + "..."
  };

  // Helper for dates like "Aug 12, 2026", "August 12, 2026", "08/12/2026"
  const parseArriveDate = (str: string): string => {
    if (!str) return "";
    const m = str.match(/\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s*(\d{2,4})\b/i);
    if (m) {
      const months: Record<string, string> = {
        jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
        jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
      };
      const key = m[1].substring(0, 3).toLowerCase();
      const month = months[key];
      if (month) {
        const day = m[2].padStart(2, '0');
        let year = m[3];
        if (year.length === 2) year = `20${year}`;
        return `${month}.${day}.${year}`;
      }
    }
    const std = str.match(/\b(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})\b/);
    if (std) {
      return normalizeDateHelper(std[0]);
    }
    return normalizeDateHelper(str);
  };

  // 1. Load Number (Arrive Order 9412775 or reference order 9412775)
  const loadMatch = text.match(/Arrive\s*Order\s*[:#]?\s*(\d+)/i) ||
                    text.match(/reference\s*order\s*[:#]?\s*(\d+)/i) ||
                    text.match(/Order\s*[:#]?\s*(\d{7,10})/i) ||
                    text.match(/\b(\d{7})\b/);
  if (loadMatch) {
    result.loadNumber = loadMatch[1].trim();
  }

  // 2. Weight (Total Weight 44604 lb or Weight 44604 lb)
  const weightMatch = text.match(/Total\s*Weight\s*[:]?\s*(\d+(?:,\d{3})*|\d+)\s*(?:lb|lbs)?/i) ||
                      text.match(/Weight\s*[:]?\s*(\d+(?:,\d{3})*|\d+)\s*(?:lb|lbs)?/i) ||
                      text.match(/(\d+(?:,\d{3})*|\d+)\s*(?:lb|lbs)\b/i);
  if (weightMatch) {
    const rawVal = weightMatch[1].replace(/,/g, '');
    const num = parseInt(rawVal, 10);
    if (!isNaN(num)) {
      result.weight = num.toLocaleString() + " LBS";
    }
  }

  // 3. Rate (LineHaul $3,100.00 / Total $3,100.00)
  const totalRateMatch = text.match(/\b(?:Total|LineHaul|Grand\s*Total|Total\s*Pay|Rate)\s*[:]?\s*\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i) ||
                         text.match(/\$\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/i);
  if (totalRateMatch) {
    result.rate = totalRateMatch[1].replace(/,/g, '');
  }

  // 4. Broker Email
  const arriveEmailMatch = text.match(/([a-zA-Z0-9._-]+@arrivelogistics\.com)/i) ||
                           text.match(/([a-zA-Z0-9._-]+@arrivefresh\.com)/i) ||
                           text.match(/([a-zA-Z0-9._-]+@arvy\.us)/i) ||
                           text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/i);
  if (arriveEmailMatch) {
    result.brokerEmail = arriveEmailMatch[1];
  }

  // Common street suffixes for extracting clean street lines
  const streetSuffixes = 'ST|STREET|AVE|AVENUE|BLVD|BOULEVARD|RD|ROAD|DR|DRIVE|PKWY|PARKWAY|WAY|LANE|LN|CT|COURT|PL|PLACE|PIKE|HWY|HIGHWAY|TRAIL|TRL|CIR|CIRCLE|LOOP|EXPWY|EXPRESSWAY|RUN|TER|TERRACE';
  const streetRegex = new RegExp(`^(\\d{1,6}\\s+[A-Za-z0-9\\s.,#-]+?\\b(?:\\s*STE|UNIT|SUITE|BLDG|APT|#|STB|RM|ROOM\\.?\\s*[A-Z0-9-]+|\\b(?:${streetSuffixes}))\\b)`, 'i');

  // 5. Stops (Pickup #1, Delivery #1, etc.)
  const stopSections = text.split(/(?=(?:Pickup|Delivery)\s*#\d+)/i);

  stopSections.forEach(section => {
    const isPickup = /Pickup\s*#\d+/i.test(section);
    const isDelivery = /Delivery\s*#\d+/i.test(section);

    if (isPickup || isDelivery) {
      const type = isPickup ? 'pickup' : 'delivery';
      const labelMatch = section.match(/(?:Pickup|Delivery)\s*#\d+/i);
      const label = labelMatch ? labelMatch[0].trim() : (isPickup ? 'Pickup' : 'Delivery');

      // Date: e.g. "Aug 12, 2026" or "08/12/2026"
      const dateMatch = section.match(/\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2}(?:st|nd|rd|th)?,?\s*\d{2,4}\b/i) ||
                        section.match(/\b(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})\b/);
      const date = dateMatch ? parseArriveDate(dateMatch[0]) : "";

      // Time: Support explicit ranges, Earliest/Latest Date/Time windows, and single times
      let time = "";
      const explicitRange = section.match(/(\d{1,2}:\d{2}(?:\s*(?:AM|PM))?\s*[-–]\s*\d{1,2}:\d{2}(?:\s*(?:AM|PM))?(?:\s*[A-Z]{3})?)/i);
      const timeRegex = /\b(\d{1,2}:\d{2})(?:\s*(AM|PM))?(?:\s*(EDT|EST|CDT|CST|MDT|MST|PDT|PST|AST|HST|AKST|AKDT|UTC|GMT))?\b/gi;
      const timeMatches = Array.from(section.matchAll(timeRegex));
      const hasEarliest = /Earliest/i.test(section);
      const hasLatest = /Latest/i.test(section);

      if (explicitRange) {
        time = explicitRange[1].trim();
      } else if ((hasEarliest || hasLatest) && timeMatches.length >= 2) {
        const t1 = timeMatches[0][1] + (timeMatches[0][2] ? ' ' + timeMatches[0][2].toUpperCase() : '');
        const t2 = timeMatches[1][1] + (timeMatches[1][2] ? ' ' + timeMatches[1][2].toUpperCase() : '');
        const tz = timeMatches[1][3] || timeMatches[0][3] || '';
        if (t1 === t2) {
          time = `${t1}${tz ? ' ' + tz.toUpperCase() : ''}`.trim();
        } else {
          time = `${t1} - ${t2}${tz ? ' ' + tz.toUpperCase() : ''}`.trim();
        }
      } else if (timeMatches.length > 0) {
        const m = timeMatches[0];
        const t = m[1] + (m[2] ? ' ' + m[2].toUpperCase() : '');
        const tz = m[3] ? ' ' + m[3].toUpperCase() : '';
        time = `${t}${tz ? ' ' + tz : ''}`.replace(/\s+/g, ' ').trim();
      }

      // Address:
      // In Arrive format:
      // Locate the city, state zip line: e.g. "Richburg, SC 29729" or "Bloomington, IN 47404"
      const cityStateZipMatch = section.match(/([A-Za-z\s.-]+),\s*([A-Z]{2})\s*(\d{5}(?:-\d{4})?)/);
      let address = "";
      if (cityStateZipMatch) {
        const rawCity = cityStateZipMatch[1].trim();
        const st = cityStateZipMatch[2].trim().toUpperCase();
        const zip = cityStateZipMatch[3].trim();

        // Clean city from any table artifacts
        const cleanCity = rawCity
          .replace(/\b(?:Loading\s*Type|Live\s*Load|EDT|EST|CDT|CST|MDT|MST|PDT|PST|Pieces?|Pallets?|Appt\.?\s*Type|By\s*Appointment|Confirmed)\b/gi, '')
          .replace(/\bDecatur\s*,?\s+(?=Indianapolis\b)/gi, '')
          .replace(/^\d+\s+/, '')
          .trim();

        const cleanCityStateZip = `${cleanCity}, ${st} ${zip}`;

        const preLines = section.substring(0, cityStateZipMatch.index).split('\n');
        let streetLine = '';
        let facilityLine = '';

        for (let i = preLines.length - 1; i >= 0; i--) {
          const rawL = preLines[i].trim();
          if (!rawL) continue;
          if (/Pickup\s*Address|Delivery\s*Address|Appointment|Ref\/PO#|Commodity|Weight|Pickup\s*#|Delivery\s*#/i.test(rawL)) {
            break;
          }
          if (/Driver\s*Instructions|Pickup\s*Notes|Delivery\s*Notes|Comments/i.test(rawL)) {
            continue;
          }

          // Check if line contains a recognized street address
          const sMatch = rawL.match(streetRegex);
          if (sMatch && !streetLine) {
            streetLine = sMatch[1].trim();
            continue;
          }

          // Extract facility/company name if not identified yet
          if (!facilityLine) {
            let fac = rawL
              .replace(/\b(?:Earliest|Latest|Appointment|Appt|PO\s*#|Ref|Date|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|\d{1,2}:\d{2}|\d{5,}).*$/i, '')
              .replace(/\b\d+(?:,\d{3})*\s*(?:lb|lbs|kg|kgs)\b/gi, '')
              .replace(/\b\d+\s*(?:Pieces?|Piece|Pcs?|Pallets?|Pallet|Plts?|Plt|Units?|Cartons?|Ctns?|Boxes?|Cases?|Bags?|Pkgs?|Drums?|Totes?|Rolls?)\b/gi, '')
              .replace(/\b(?:Pieces?|Piece|Pcs?|Pallets?|Pallet|Plts?|Plt|Units?|Cartons?|Ctns?|Boxes?|Cases?|Bags?|Pkgs?|Commodity)\b/gi, '')
              .replace(/\b\d{10}\b/gi, '')
              .replace(/\b(?:Loading\s*Type|Live\s*Load|Appt\.?\s*Type|By\s*Appointment|FCFS|Confirmed)\b/gi, '')
              .replace(/\s+/g, ' ')
              .replace(/^[\s,:-]+|[\s,:-]+$/g, '')
              .trim();

            if (fac && fac.length > 2 && isNaN(Number(fac))) {
              facilityLine = fac;
            }
          }
        }

        if (streetLine) {
          if (facilityLine) {
            address = `${facilityLine}, ${streetLine}, ${cleanCityStateZip}`;
          } else {
            address = `${streetLine}, ${cleanCityStateZip}`;
          }
        } else if (facilityLine) {
          address = `${facilityLine}, ${cleanCityStateZip}`;
        } else {
          address = cleanCityStateZip;
        }
      }

      if (address || date || time) {
        result.stops.push({
          type,
          label,
          address,
          date,
          time
        });
      }
    }
  });

  if (result.stops.length > 0) {
    const pickups = result.stops.filter(s => s.type === 'pickup');
    const deliveries = result.stops.filter(s => s.type === 'delivery');
    if (pickups.length > 0) {
      result.pickupDate = pickups[0].date;
      result.pickupTime = pickups[0].time;
      result.originAddress = pickups[0].address;
    }
    if (deliveries.length > 0) {
      const lastDel = deliveries[deliveries.length - 1];
      result.deliveryTime = lastDel.time;
      result.destinationAddress = lastDel.address;
    }
  }

  return result;
}

function parseEcho(text: string): ParsedRateCon {
  // Normalize line endings
  text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

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
    brokerName: "ECHO",
    brokerEmail: "",
    rawTextPreview: text.substring(0, 200) + "..."
  };

  // 1. Load Number / Order Number
  const loadMatch = text.match(/(?:ORDER|Load\s*Number|Broker[’']s\s*load\s*number|Service\s*for\s*Load\s*#)\s*[:#]?\s*(\d{7,10})/i) ||
                    text.match(/\bORDER\s*(\d{7,10})/i) ||
                    text.match(/\b(\d{8})\b/);
  if (loadMatch) {
    result.loadNumber = loadMatch[1].trim();
  }

  // 2. Weight
  const weightMatch = text.match(/Weight\s*[:]?\s*(\d+(?:,\d{3})*|\d+)/i);
  if (weightMatch) {
    const rawVal = weightMatch[1].replace(/,/g, '');
    const num = parseInt(rawVal, 10);
    if (!isNaN(num)) {
      result.weight = num.toLocaleString('en-US') + " LBS";
    }
  }

  // 3. Rate from PAY SUMMARY (Total & Line Haul)
  const paySummaryIdx = text.search(/PAY\s*SUMMARY/i);
  if (paySummaryIdx !== -1) {
    const payBlock = text.substring(paySummaryIdx, paySummaryIdx + 300);
    const totalMatch = payBlock.match(/Total\s*[:]?\s*\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i);
    const lineHaulMatch = payBlock.match(/Line\s*Haul\s*[:]?\s*\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i);
    if (totalMatch) {
      result.rate = totalMatch[1].replace(/,/g, '');
    } else if (lineHaulMatch) {
      result.rate = lineHaulMatch[1].replace(/,/g, '');
    }
  }

  if (!result.rate) {
    const totalTableMatch = text.match(/Total\s*[:]?\s*\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i) ||
                            text.match(/Line\s*Haul\s*[:]?\s*\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i);
    if (totalTableMatch) {
      result.rate = totalTableMatch[1].replace(/,/g, '');
    }
  }

  // 4. Broker Email
  const repEmailMatch = text.match(/Rep\s*Email\s*[:]?\s*([a-zA-Z0-9._%+-]+@echo\.com)/i);
  if (repEmailMatch) {
    result.brokerEmail = repEmailMatch[1].trim();
  } else {
    const genericEmailMatch = text.match(/([a-zA-Z0-9._%+-]+@echo\.com)/i);
    if (genericEmailMatch) {
      result.brokerEmail = genericEmailMatch[1].trim();
    }
  }

  // 5. Stops (Pickup and Drop)
  const usStatesPattern = "AL|AK|AS|AZ|AR|CA|CO|CT|DE|DC|FM|FL|GA|GU|HI|ID|IL|IN|IA|KS|KY|LA|ME|MH|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|MP|OH|OK|OR|PW|PA|PR|RI|SC|SD|TN|TX|UT|VT|VI|VA|WA|WV|WI|WY";
  const cityStateZipRegex = new RegExp(`\\b([A-Za-z][A-Za-z\\s.-]{1,30})[\\s,]+\\b(${usStatesPattern})\\b\\s+(\\d{5})\\b`, "i");

  // Locate Pickup and Drop stop headers
  const markerRegex = /(?:^|\n)\s*(Pickup|Drop)\s*(?:\n|$)/gi;
  const markers: { type: 'pickup' | 'delivery'; index: number }[] = [];
  let m: RegExpExecArray | null;

  while ((m = markerRegex.exec(text)) !== null) {
    const isPick = m[1].toLowerCase() === 'pickup';
    const idx = m.index + m[0].indexOf(m[1]);
    markers.push({
      type: isPick ? 'pickup' : 'delivery',
      index: idx
    });
  }

  for (let i = 0; i < markers.length; i++) {
    const curr = markers[i];
    const nextIdx = (i < markers.length - 1) ? markers[i + 1].index : text.length;
    let block = text.substring(curr.index, nextIdx);

    const cutoffMatch = block.match(/\b(?:Pickup\s*INSTRUCTIONS|Drop\s*INSTRUCTIONS|INVOICE\s*PAYMENT|SUBMIT\s*INVOICE|compliance\s*with)\b/i);
    if (cutoffMatch && cutoffMatch.index !== undefined) {
      block = block.substring(0, cutoffMatch.index);
    }

    // Strict 5-digit ZIP validation
    const addrMatch = block.match(cityStateZipRegex);
    let address = "";
    if (addrMatch) {
      let rawCity = addrMatch[1].trim();
      rawCity = rawCity.replace(/^(?:Earliest|Latest|Drop|Pickup|Pieces|Pallets|Weight|DELV|PKU|Item)[\s:]*/i, '').trim();
      const cityLines = rawCity.split(/\n/);
      rawCity = cityLines[cityLines.length - 1].trim();
      rawCity = rawCity.replace(/^[^a-zA-Z]+/, '').replace(/[^a-zA-Z]+$/, '');
      const state = addrMatch[2].toUpperCase();
      const zip = addrMatch[3];
      address = `${rawCity.toUpperCase()}, ${state} ${zip}`;
    }

    // Earliest / Eearliest / Latest
    const earliestMatch = block.match(/(?:E+arliest|Earliest)\s*[:]?\s*(?:(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})\s+)?(\d{1,2}:\d{2})/i);
    const latestMatch = block.match(/Latest\s*[:]?\s*(?:(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})\s+)?(\d{1,2}:\d{2})/i);

    let date = "";
    if (earliestMatch && earliestMatch[1]) {
      date = normalizeDateHelper(earliestMatch[1]);
    } else if (latestMatch && latestMatch[1]) {
      date = normalizeDateHelper(latestMatch[1]);
    } else {
      const genericDate = block.match(/\b(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})\b/);
      if (genericDate) date = normalizeDateHelper(genericDate[1]);
    }

    let time = "";
    const startTime = earliestMatch ? earliestMatch[2] : "";
    const endTime = latestMatch ? latestMatch[2] : "";

    if (startTime && endTime) {
      if (startTime === endTime) {
        time = startTime;
      } else {
        time = `${startTime} - ${endTime}`;
      }
    } else if (startTime) {
      time = startTime;
    } else if (endTime) {
      time = endTime;
    }

    const type = curr.type;
    const sameTypeCount = result.stops.filter(s => s.type === type).length;
    const label = type === 'pickup' 
      ? (sameTypeCount === 0 ? 'Pickup' : `Pickup ${sameTypeCount + 1}`)
      : (sameTypeCount === 0 ? 'Delivery' : `Delivery ${sameTypeCount + 1}`);

    if (address || date || time) {
      result.stops.push({
        type,
        address,
        date,
        time,
        label
      });
    }
  }

  // Populate top-level fields
  const pickups = result.stops.filter(s => s.type === 'pickup');
  const deliveries = result.stops.filter(s => s.type === 'delivery');

  if (pickups.length > 0) {
    result.pickupDate = pickups[0].date;
    result.pickupTime = pickups[0].time;
    result.originAddress = pickups[0].address;
  }
  if (deliveries.length > 0) {
    const lastDel = deliveries[deliveries.length - 1];
    result.deliveryTime = lastDel.time;
    result.deliveryDate = lastDel.date;
    result.destinationAddress = lastDel.address;
  }

  return result;
}

export function parseRateConfirmation(text: string): ParsedRateCon {
  const lowerText = text.toLowerCase();
  
  // ECHO detection
  const isEcho = lowerText.includes('echo global logistics') || 
                 lowerText.includes('@echo.com') ||
                 lowerText.includes('echodrive') ||
                 (lowerText.includes('echo') && (lowerText.includes('load confirmation') || lowerText.includes('echo rep') || lowerText.includes('order 69')));
  if (isEcho) {
    return parseEcho(text);
  }

  // ARRIVE detection
  const isArrive = lowerText.includes('arrive logistics') || 
                   lowerText.includes('arrivelogistics.com') ||
                   lowerText.includes('arrive order') ||
                   (lowerText.includes('arrive') && (lowerText.includes('dm trans') || lowerText.includes('arvy.us') || lowerText.includes('arrivenow')));
  if (isArrive) {
    return parseArrive(text);
  }
  
  // TQL detection - check first to prevent co-brokered boilerplates from triggering other brokers
  const isTQL = lowerText.includes('tql') && (lowerText.includes('po#') || lowerText.includes('p.o.#') || lowerText.includes('total quality logistics'));
  if (isTQL) {
    return parseTQL(text);
  }

  // OPENROAD detection
  const isOpenRoad = lowerText.includes('openroad') || lowerText.includes('open road');
  if (isOpenRoad) {
    return parseOpenRoad(text);
  }

  // High-confidence Robinson detection
  const isRobinson = (lowerText.includes('c.h. robinson') || lowerText.includes('ch robinson')) && 
                     !lowerText.includes('traffix') && 
                     !lowerText.includes('tql');

  if (isRobinson) {
    return parseChRobinson(text);
  }

  // Landstar detection
  const isLandstar = lowerText.includes('landstar') || lowerText.includes('freight bill #');
  if (isLandstar) {
    return parseLandstar(text);
  }

  // NST detection
  const isNST = lowerText.includes('north star transport') || lowerText.includes('turvo shipment') || (lowerText.includes('carrier load confirmation') && lowerText.includes('rcmoore.com'));
  if (isNST) {
    return parseNST(text);
  }

  const isTraffix = lowerText.includes('traffix');

  // --- TRAFFIX / GENERIC LOGIC ---
  // Example: "2 5 8 1 0 S R I D G E L A N D" -> "25810 SRIDGELAND"
  // We look for sequences of single characters separated by single spaces
  text = text.replace(/(?:^|(?<=\s))([A-Z0-9])\s(?=([A-Z0-9])(?:\s|$))/gi, '$1');
  // Run it twice to catch overlapping matches
  text = text.replace(/(?:^|(?<=\s))([A-Z0-9])\s(?=([A-Z0-9])(?:\s|$))/gi, '$1');

  const cleanAddress = (addr: string): string => {
    if (!addr) return "";
    
    // Replace newlines with spaces and normalize whitespace
    let cleaned = addr.replace(/\n/g, " ").replace(/\s+/g, " ").trim();
    
    // Specifically handle common OCR artifacts where multiple labels are joined
    // Remove specific labels from anywhere in the string
    const noisyLabels = [/REFERENCE\s*NUMBERS/i, /CONSIGNEE\s*[:]?/i, /SHIPPER\s*[:]?/i, /FACILITY\s*NAME\s*[:]?/i, /SPRINGFIELD\s*NDC\s*01Z/i];
    for (const label of noisyLabels) {
      cleaned = cleaned.replace(label, "");
    }

    // If "Address:" or "Location:" is in the middle of the string, it often indicates facility name noise before it
    const addrLabelMatch = cleaned.match(/(?:ADDRESS|LOCATION)\s*[:]?\s*/i);
    if (addrLabelMatch && addrLabelMatch.index && addrLabelMatch.index > 5) {
      cleaned = cleaned.substring(addrLabelMatch.index + addrLabelMatch[0].length).trim();
    }

    // Remove leading noise (labels at the start)
    const prefixPattern = /^(?:\s*(?:\d+\s+)?\b(?:LOCATION|DATE|TIME|PICK-UP|DELIVERY|DESTINATION|ORIGIN|SHIPPER|CONSIGNEE|PICKUP|ADDRESS|FROM|TO|RECEIVER|STOP\s*(?:#?\d+)?|LOADING|UNLOADING|PU|P\/U|DO|DEL|FACILITY\s*NAME|SHIPPING\s*ADDRESS|RECEIVING\s*ADDRESS|DROP\s*OFF|PICK-UP\s*LOCATION|DELIVERY\s*LOCATION|DATE\s*TIME|NOTES|SPECIAL\s*INSTRUCTIONS|UP|PICK|INFO|CONTACT|NAME|PHONE|EMAIL|FAX|MC|DOT|DISPATCHER|DRIVER|TRUCK|TRAILER|LOAD|RATE|TYPE|UNIT|QUANTITY|TOTAL|MODE|SIZE|LINEAR|FEET|TEMPERATURE|PALLET|CASE|HAZMAT|WEIGHT|ESTIMATED|UNLOADING|RECEIPT|EXCHANGE|NOTE|CARRIER|COMMODITY|HANDLING|UNITS|STACKABLE|PIECES|DIMS|TEMP|TEMPERATURE|CONFIRM|RECEIPT|OF|REFERENCE\s*NUMBERS|REF\s*#|REFERENCE)\b\s*[:\/\-]?\s*)+/i;
    cleaned = cleaned.replace(prefixPattern, "").trim();
    
    // Handle cases like "480 Address: 711..." where a number from a previous field is caught
    cleaned = cleaned.replace(/^\d+\s+(?:ADDRESS|LOCATION|SHIPPER|CONSIGNEE|PICKUP|DELIVERY|REFERENCE\s*NUMBERS)[:\-]?\s*/i, "").trim();

    // Strip leading DC/facility codes or stray leading numbers (e.g. "2042 5510 Exploration Dr" -> "5510 Exploration Dr")
    cleaned = cleaned.replace(/^\d{2,4}\s+(?=\d{2,5}\s+[A-Za-z])/i, "").trim();
    cleaned = cleaned.replace(/^\bDC\s*\d+\s+/i, "").trim();

    // Strip township or area noise before the main city (e.g., "5510 Exploration Dr, Decatur Indianapolis" -> "5510 Exploration Dr, Indianapolis")
    cleaned = cleaned.replace(/\bDecatur\s*,?\s+(?=Indianapolis\b)/gi, "").trim();
    cleaned = cleaned.replace(/,\s*Decatur\s*,?\s*(?=Indianapolis\b)/gi, ", ").trim();

    // Remove trailing noise
    const suffixPattern = /(?:\s*\b(?:REFERENCE\s*NUMBERS|REF\s*#|BOL\s*#|PICKUP\s*#|PU\s*#|DO\s*#|STOP\s*#|NOTES|SPECIAL\s*INSTRUCTIONS|CONTACT|PHONE|EMAIL|FAX|DATE|TIME|APPOINTMENT|APPT|WINDOW|ETA|SCHEDULED|ARRIVAL|CHECK-IN|FCFS|ASAP|DELIVERY|PICKUP|SHIPPER|CONSIGNEE|ORIGIN|DESTINATION|LOCATION|ADDRESS|FROM|TO|RECEIVER|LOADING|UNLOADING|PU|P\/U|DEL|FACILITY|SHIPPING|RECEIVING|DROP|UP|PICK|INFO|NAME|MC|DOT|DISPATCHER|DRIVER|TRUCK|TRAILER|LOAD|RATE|TYPE|UNIT|QUANTITY|TOTAL|MODE|SIZE|LINEAR|FEET|TEMPERATURE|PALLET|CASE|HAZMAT|WEIGHT|ESTIMATED|RECEIPT|EXCHANGE|NOTE|CARRIER|COMMODITY|HANDLING|UNITS|STACKABLE|PIECES|DIMS|TEMP|CONFIRM|OF)\b\s*[:\/\-]?\s*)+$/i;
    cleaned = cleaned.replace(suffixPattern, "").trim();
    
    // Per user feedback, if the address contains "City, ST Zip" twice or is redundant, try to shorten it
    // Or if it clearly has a street followed by city state zip, just keep that.
    
    // Strip pieces, pallets, units, cartons, cases, boxes, lbs, commodities and PO numbers from anywhere in address
    cleaned = cleaned.replace(/\b\d+\s*(?:PIECES?|PCS?|PALLETS?|PLTS?|UNITS?|CASES?|BOXES?|CARTONS?|CTNS?|LBS?)\b/gi, "").trim();
    cleaned = cleaned.replace(/\b(?:PIECES?|PCS?|PALLETS?|PLTS?|COMMODITY|TOTAL\s*WEIGHT)\b/gi, "").trim();
    cleaned = cleaned.replace(/\bPO\s*#?\s*\d+\b/gi, "").trim();
    cleaned = cleaned.replace(/\b\d+(?:,\d{3})*\s*(?:LB|LBS|KG|KGS)\b/gi, "").trim();
    cleaned = cleaned.replace(/\s+/g, " ").replace(/,\s*,/g, ", ").replace(/^,\s*|,\s*$/g, "").trim();
    
    const blacklist = [
      "1701 Edison Drive", "PO Box 9049", "Louisville, KY 40209", "Milford, OH 45150",
      "FLEET ONE FACTORING", "WEX", "PO BOX 94565",
      "pickup / delivery", "pickup/delivery", "pickup / delivery OR BOTH",
      "delivery OR BOTH", "pickup / delivery OR", "Pallet Yes", "Piece 20000",
      "Pallet", "Piece", "Commodity", "Handling Units"
    ];
    
    for (const item of blacklist) {
      if (cleaned.toUpperCase().includes(item.toUpperCase())) return "";
    }
    
    if (cleaned.length < 5) return "";

    // Deduplicate duplicate consecutive words or phrases (e.g. FOX VALLEY Fox Valley)
    // Helper to normalize a word/phrase for comparison (lowercase, alphanumeric only)
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

    let words = cleaned.replace(/\s+/g, ' ').split(' ');
    let k = 0;

    while (k < words.length) {
      let advanced = false;
      // Check for duplicate phrases of length up to 4 words
      for (let len = 4; len >= 1; len--) {
        if (k + len * 2 <= words.length) {
          const firstPhrase = words.slice(k, k + len).join(' ');
          const secondPhrase = words.slice(k + len, k + len * 2).join(' ');
          
          if (norm(firstPhrase) === norm(secondPhrase)) {
            const lastWordOfSecond = words[k + len * 2 - 1];
            const hasComma = lastWordOfSecond.endsWith(',');
            
            words.splice(k + len, len);
            
            if (hasComma && !words[k + len - 1].endsWith(',')) {
              words[k + len - 1] += ',';
            }
            
            advanced = true;
            break; // restart checking at index k with the updated words array
          }
        }
      }
      if (!advanced) {
        k++;
      }
    }

    cleaned = words.join(' ').replace(/\s+,/g, ',').replace(/\s+/g, ' ').trim();

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
    brokerName: isTraffix ? "TRAFFIX" : "",
    rawTextPreview: text.substring(0, 200) + "..."
  };

  const normalizeWeight = (w: string): string => {
    if (!w) return "";
    const clean = w.replace(/,/g, '').trim();
    return clean ? `${clean} LBS` : "";
  };

  const normalizeDate = (d: string): string => {
    return normalizeDateHelper(d);
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
    
    // Handle HHMM format (e.g., 1400)
    if (!clean.includes(':') && clean.length === 4 && !isNaN(Number(clean))) {
      const h = parseInt(clean.substring(0, 2), 10);
      const m = parseInt(clean.substring(2, 4), 10);
      if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      }
      return "";
    }

    // Handle HH:MM format
    if (clean.includes(':')) {
      let [hours, minutes] = clean.split(':');
      let h = parseInt(hours, 10);
      // Minutes might have extra text after them
      let mStr = minutes.match(/^\d{2}/)?.[0] || "00";
      let m = parseInt(mStr, 10);
      
      if (isNaN(h) || isNaN(m)) return "";
      
      if (isPM && h < 12) h += 12;
      if (isAM && h === 12) h = 0;
      
      // Final validation: hours must be 0-23, minutes 0-59
      if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      }
      return "";
    }

    return "";
  };

  // --- Windowed Extraction for Header Fields ---
  
  result.loadNumber = extractInWindow(text, 
    ['Traffix Load #', 'Load #', 'Order #', 'PO #', 'PO#', 'Shipment ID', 'Pro #', 'PRO NUMBER', 'Reference #', 'Booking #', 'Confirmation #', 'Trip #', 'Job #', 'Convoy ID', 'TQL PO#'], 
    [/\s*[:.]?\s*([A-Z0-9-]{4,})/i, /([A-Z0-9-]{4,})/i]
  ) || (text.match(PATTERNS.loadNumber[0])?.[1] || "");

  result.weight = normalizeWeight(extractInWindow(text, 
    ['Estimated Weight', 'Total Weight', 'Actual Weight', 'Gross Weight', 'Weight', 'Wt', 'Wgt', 'Est Wgt'], 
    [/\s*[:.]?\s*(\d+(?:,\d{3})*|\d+)/i]
  )) || normalizeWeight(text.match(PATTERNS.weight[0])?.[1] || "");

  // Rate extraction with scoring
  const rateAnchors = ['Rate', 'Total', 'Amount', 'Pay', 'Flat Rate', 'Carrier Pay', 'Linehaul', 'All-in', 'Grand Total', 'Agreed Amount', 'Amount to invoice'];
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
  
  // Extract Broker Email
  const emailMatch = text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/);
  if (emailMatch) {
    result.brokerEmail = emailMatch[0];
  }

  // --- Multi-Stop Detection with Segmentation ---
  
  const stopMarkers = [
    { pattern: /(?:Shipper|Origin|Pickup|Pick-up)\s*[\-\u2010-\u2015]\s*(?:Pickup|Stop)\s*(\d+)\s*of\s*(\d+)/i, type: 'pickup', priority: 5 },
    { pattern: /(?:Consignee|Destination|Delivery)\s*[\-\u2010-\u2015]\s*(?:Delivery|Stop)\s*(\d+)\s*of\s*(\d+)/i, type: 'delivery', priority: 5 },
    { pattern: /(?:PU|DO|Stop)\s*#?\s*(\d+)/i, type: 'auto', priority: 4 },
    { pattern: /#\s*(\d+)\s*(Shipper|Consignee|Destination)/i, type: 'auto', priority: 4 },
    { pattern: /Stop\s*#?\s*(\d+)\s*[:\-]?\s*(Pick|Del)/i, type: 'auto', priority: 2 },
    { pattern: /Stop\s*#?\s*(\d+)/i, type: 'auto', priority: 2 },
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
        type = sub.includes('pick') || sub.includes('shipper') || sub.includes('pu') ? 'pickup' : 'delivery';
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
    let section = text.substring(start, end);
    
    // Truncate Terms & Conditions or boilerplates from the stop section to prevent false address matches
    if (i === foundMarkers.length - 1) {
      const termsIndex = section.search(/\b(?:Terms\s*(?:and|&)\s*Conditions|FAILURE\s*TO\s*COMPLY|Special\s*Instructions:|Trailer\s*Maintenance|Accept\/Decline\/View\s*Tender)\b/i);
      if (termsIndex !== -1) {
        section = section.substring(0, termsIndex);
      }
    }
    
    // Windowed extraction within the stop section
    const rangeMatch = section.match(/(\d{1,2}:\d{2}\s*(?:AM|PM)?\s*(?:[-–]|to|through)\s*\d{1,2}:\d{2}\s*(?:AM|PM)?)/i);
    let time = "";
    if (rangeMatch) {
      const parts = rangeMatch[1].split(/(?:[-–]|to|through)/gi);
      const normParts = parts.map(p => normalizeTime(p.trim())).filter(Boolean);
      if (normParts.length === 2) {
        time = `${normParts[0]} - ${normParts[1]}`;
      } else if (normParts.length === 1) {
        time = normParts[0];
      } else {
        time = rangeMatch[1].trim();
      }
    } else {
      const timeMatch = section.match(PATTERNS.time);
      time = timeMatch ? normalizeTime(timeMatch[1]) : "";
    }
    const tzMatch = section.match(PATTERNS.timezone);
    if (time && tzMatch && !PATTERNS.timezone.test(time)) time += ` ${tzMatch[1].toUpperCase()}`;

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
