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
  originAddress: string;
  destinationAddress: string;
  brokerEmail?: string;
  brokerName?: string;
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

function parseChRobinson(text: string): ParsedRateCon {
  // Normalize line endings
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
    brokerName: "CH ROBINSON",
    rawTextPreview: text.substring(0, 200) + "..."
  };

  // Load Number
  const loadMatch = text.match(/(?:Confirmation\s*-\s*#|Load\s*Number\s*[:]?|Load\s*#)\s*([A-Z]*\d+)/i);
  if (loadMatch) {
    // Per user request: if CH Robinson, remove leading T
    result.loadNumber = loadMatch[1].replace(/^T/i, '');
  }

  // Weight extraction (Enhanced for Robinson to handle multiple rows)
  const weightMatches: number[] = [];
  
  // 1. Look for weights in the commodity table: [Number] [Units]
  // In Robinson, weight usually precedes the units (Carton(s), Pieces, Units, etc.)
  const tableWeightRegex = /(\d{1,3}(?:[,\s]\d{3})*(?:\.\d+)?)\s+(?:Carton\(s\)|Pieces|Units|Piece|Pallets|LBS|LB|KGS|KG)/gi;
  let weightMatch;
  while ((weightMatch = tableWeightRegex.exec(text)) !== null) {
    const val = parseFloat(weightMatch[1].replace(/[,\s]/g, ''));
    if (!isNaN(val) && val > 10) weightMatches.push(val);
  }

  // 2. Look for explicit total line
  const totalMatch = text.match(/[\s\S]*?(\d+(?:[,\s]\d{3})*(?:\.\d+)?)\s+Total\b/i) ||
                     text.match(/(\d+)\s+(\d+)\s+(\d+(?:[,\s]\d{3})*(?:\.\d+)?)\s+Total/i);
  if (totalMatch) {
    const totalVal = parseFloat((totalMatch[3] || totalMatch[1]).replace(/[,\s]/g, ''));
    if (!isNaN(totalVal)) weightMatches.push(totalVal);
  }

  // 3. Fallback to common labels near "Est Wgt"
  const labelWeightRegex = /(?:Est\s*Wgt|Total\s*Weight|Weight|Wt)\s*[:]?\s*(\d{1,3}(?:[,\s]\d{3})*(?:\.\d+)?)/gi;
  while ((weightMatch = labelWeightRegex.exec(text)) !== null) {
    const val = parseFloat(weightMatch[1].replace(/[,\s]/g, ''));
    if (!isNaN(val) && val > 10) weightMatches.push(val);
  }

  if (weightMatches.length > 0) {
    // Per user request, pick the largest weight found
    const maxW = Math.max(...weightMatches);
    result.weight = maxW.toLocaleString() + " LBS";
  } else {
    // Final fallback
    const genericMatch = text.match(/(?:Est\s*Wgt|Total\s*Weight)\s*[:]?\s*(\d{2,}(?:[,\s]\d{3})*)/i);
    if (genericMatch) {
       result.weight = genericMatch[1].replace(/[,\s]/g, '') + " LBS";
    }
  }

  // Rate
  const rateMatch = text.match(/Total\s*[:]?\s*\$\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/i) ||
                    text.match(/Line\s*Haul\s*[-–]\s*Flat\s*Rate\s*\d+\s*\$\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/i) ||
                    text.match(/Total\s*:\s*\$?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/i);
  if (rateMatch) result.rate = rateMatch[1].replace(/,/g, '');

  // Stops (Shipper / Receiver blocks)
  // Split by SHIPPER# or RECEIVER# (allowing spaces)
  const stopsRaw = text.split(/(?=SHIPPER\s*#|RECEIVER\s*#)/i);
  
  stopsRaw.forEach(section => {
    const isPickup = /SHIPPER\s*#/i.test(section);
    const isDelivery = /RECEIVER\s*#/i.test(section);
    
    if (isPickup || isDelivery) {
      const type = isPickup ? 'pickup' : 'delivery';
      const labelMatch = section.match(/(?:SHIPPER|RECEIVER)\s*#\d+/i);
      const label = labelMatch ? labelMatch[0] : (isPickup ? 'Pickup' : 'Delivery');

      // Date extraction: Scheduled Pick Up* 5/13/2026 or Pick Up Date: 5/12/2026
      const dateMatch = section.match(/(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})/) || 
                        section.match(/(?:Pick\s*Up\s*Date|Delivery\s*Date)\s*[:]?\s*(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})/i);
      let date = dateMatch ? dateMatch[1].replace(/[\/.-]/g, '.') : "";

      // Time extraction: Pick Up Open 5/13/2026 5:10 AM or Pick Up Time: 22:00 Appt.
      // Handlers ranges like 07:00-14:30 or 13:00 Appt or 0700-1400
      // CRITICAL: Avoid zip codes like 46123-1772
      const timeRegex = /\b(?:[01]?\d|2[0-3])[:][0-5]\d\b/;
      const rangeMatch = section.match(/(\d{1,2}:\d{2}\s*(?:AM|PM)?\s*[-–]\s*\d{1,2}:\d{2}\s*(?:AM|PM)?)/i);
      
      // Only capture 4-digit ranges if they look like military time and aren't zip codes
      // We check if it follows a time label or doesn't have 5 digits before the dash
      const militaryRangeStr = section.match(/(?:Time|Open|Close|At)\b[:]?\s*(\d{4}\s*[-–]\s*\d{4})/i)?.[1];
      
      const apptMatch = section.match(/(\b\d{1,2}:\d{2}(?:\s*AM|PM)?\s*Appt)/i) ||
                        section.match(/(\b\d{4}\b\s*Appt)/i);
      
      const labeledTimeMatch = section.match(/(?:Pick\s*Up\s*Open|Pick\s*Up\s*Time|Pick\s*Up\s*Close|Delivery\s*Open|Delivery\s*Time|Delivery\s*Close)\s*(?:\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})?\s*(\d{1,2}[:]\d{2}(?:\s*AM|PM)?)/i);
      
      const fallbackTimeMatch = section.match(/(\b\d{1,2}:\d{2}(?:\s*AM|PM)?)/i);
      
      let time = "";
      if (rangeMatch) time = rangeMatch[1];
      else if (militaryRangeStr) time = militaryRangeStr;
      else if (apptMatch) time = apptMatch[1];
      else if (labeledTimeMatch) time = labeledTimeMatch[1];
      else if (fallbackTimeMatch) time = fallbackTimeMatch[1];
      
      if (time) {
         time = time.trim();
         // If it's a simple HH:MM AM/PM or HH:MM Appt, normalize it. If range, keep it.
         if (time.includes(':') && !time.includes('-') && !time.includes('–')) {
           const t = time.replace(/Appt/i, '').trim();
           let [h, m] = t.split(':');
           let hours = parseInt(h, 10);
           const mins = m.match(/\d{2}/)?.[0] || "00";
           const isPM = /PM/i.test(time);
           const isAM = /AM/i.test(time);
           if (isPM && hours < 12) hours += 12;
           if (isAM && hours === 12) hours = 0;
           time = `${hours.toString().padStart(2, '0')}:${mins}`;
         } else if (/^\d{4}$/.test(time)) {
           // HHMM format
           time = time.substring(0, 2) + ":" + time.substring(2, 4);
         }
      }

      // Address extraction
      // Look for Address: ... until next key field or Zip:
      const addrMatch = section.match(/Address\s*[:]?\s*([^\n\*]+)/i);
      let cityStateMatch = section.match(/([A-Z][A-Za-z\s]+,\s*[A-Z]{2})/) || section.match(/([A-Z\s]{2,},\s*[A-Z]{2})/); // Knoxville, TN or FRANKFORT, IN
      const zipMatch = section.match(/Zip\s*[:]?\s*(\d{4,5})/i) || section.match(/,\s*[A-Z]{2}\s*(\d{4,5})/);
      
      const cleanRobinsonText = (t: string): string => {
        if (!t) return "";
        // Use word boundaries \b to avoid catching parts of words (e.g., "County" -> "ty" because of "count")
        let cleaned = t.replace(/\b(?:scheduled|pick up|delivery|arrival|appointment|appt|phone|address|zip|date|time|pickup|ref|receiver|shipper|units|count|pallets|commodity|est wgt)\b\s*(?:date|time|open|close|#|#\d+|[:*])?/gi, "");
        cleaned = cleaned.replace(/\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}.*$/gi, ""); 
        cleaned = cleaned.replace(/\d{1,2}:\d{2}.*$/gi, ""); 
        cleaned = cleaned.replace(/\(?\d{3}\)?\s*[\-\.]?\s*\d{3}\s*[\-\.]?\s*\d{4}.*$/g, ""); 
        cleaned = cleaned.replace(/\s+/g, " ");
        
        // Remove leading/trailing non-alphanumeric noise
        cleaned = cleaned.trim().replace(/^[^a-z0-9#]+/i, "").replace(/[^a-z0-9#]+$/i, "");
        cleaned = cleaned.replace(/^[\.,\*]\s*/, "").replace(/\s*[\.,\*]$/, "");
        
        return cleaned.trim();
      };
      
      let street = addrMatch ? cleanRobinsonText(addrMatch[1]) : "";
      
      // If we didn't find street via "Address:", it might be on a line after "RECEIVER #1"
      if (!street) {
        const lines = section.split('\n');
        for (let i = 0; i < lines.length; i++) {
          if (/(?:SHIPPER|RECEIVER)\s*#\d+/i.test(lines[i])) {
            let found = false;
            for (let j = 1; j <= 2; j++) {
              let nextLine = lines[i+j] ? lines[i+j].trim() : "";
              if (nextLine && nextLine.length > 5 && !/Scheduled|Pick\s*Up|Delivery|Address|Phone|Date:|Time:/i.test(nextLine)) {
                street = cleanRobinsonText(nextLine);
                found = true;
                break;
              }
            }
            if (found) break;
          }
        }
      }

      let cityState = cityStateMatch ? cleanRobinsonText(cityStateMatch[1]) : "";
      let zip = zipMatch ? zipMatch[1] : "";
      
      if (!cityState) {
        const fallbackCityState = section.match(/\b([A-Za-z\s]{2,30}),\s*(AL|AK|AS|AZ|AR|CA|CO|CT|DE|DC|FM|FL|GA|GU|HI|ID|IL|IN|IA|KS|KY|LA|ME|MH|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|MP|OH|OK|OR|PW|PA|PR|RI|SC|SD|TN|TX|UT|VT|VI|VA|WA|WV|WI|WY)\b/i);
        if (fallbackCityState) cityState = `${fallbackCityState[1]}, ${fallbackCityState[2].toUpperCase()}`;
      }

      // Per user request: "solo quiero la ciudad, la abreviacion y el zip" for CH Robinson
      let address = [cityState, zip].filter(Boolean).join(" ");
      
      // If NOT CH Robinson, we can keep the street if found
      if (street && !text.toLowerCase().includes('robinson')) {
        address = [street, cityState, zip].filter(Boolean).join(", ");
      }

      if (address && (date || time)) {
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
         date = windowMatch[1].replace(/[\/.-]/g, '.');
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

export function parseRateConfirmation(text: string): ParsedRateCon {
  const lowerText = text.toLowerCase();
  
  // High-confidence Robinson detection
  const isRobinson = (lowerText.includes('c.h. robinson') || lowerText.includes('ch robinson')) && 
                     !lowerText.includes('traffix');

  if (isRobinson) {
    return parseChRobinson(text);
  }

  // Landstar detection
  const isLandstar = lowerText.includes('landstar') || lowerText.includes('freight bill #');
  if (isLandstar) {
    return parseLandstar(text);
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
    const prefixPattern = /^(?:\s*(?:\d+\s+)?(?:LOCATION|DATE|TIME|PICK-UP|DELIVERY|DESTINATION|ORIGIN|SHIPPER|CONSIGNEE|PICKUP|ADDRESS|FROM|TO|RECEIVER|STOP\s*(?:#?\d+)?|LOADING|UNLOADING|PU|P\/U|DO|DEL|FACILITY\s*NAME|SHIPPING\s*ADDRESS|RECEIVING\s*ADDRESS|DROP\s*OFF|PICK-UP\s*LOCATION|DELIVERY\s*LOCATION|DATE\s*TIME|NOTES|SPECIAL\s*INSTRUCTIONS|UP|PICK|INFO|CONTACT|NAME|PHONE|EMAIL|FAX|MC|DOT|DISPATCHER|DRIVER|TRUCK|TRAILER|LOAD|RATE|TYPE|UNIT|QUANTITY|TOTAL|MODE|SIZE|LINEAR|FEET|TEMPERATURE|PALLET|CASE|HAZMAT|WEIGHT|ESTIMATED|UNLOADING|RECEIPT|EXCHANGE|NOTE|CARRIER|COMMODITY|HANDLING|UNITS|STACKABLE|PIECES|DIMS|TEMP|TEMPERATURE|CONFIRM|RECEIPT|OF|REFERENCE\s*NUMBERS|REF\s*#|REFERENCE)\s*[:\/\-]?\s*)+/i;
    cleaned = cleaned.replace(prefixPattern, "").trim();
    
    // Handle cases like "480 Address: 711..." where a number from a previous field is caught
    cleaned = cleaned.replace(/^\d+\s+(?:ADDRESS|LOCATION|SHIPPER|CONSIGNEE|PICKUP|DELIVERY|REFERENCE\s*NUMBERS)[:\-]?\s*/i, "").trim();

    // Remove trailing noise
    const suffixPattern = /(?:\s*(?:REFERENCE\s*NUMBERS|REF\s*#|BOL\s*#|PICKUP\s*#|PU\s*#|DO\s*#|STOP\s*#|NOTES|SPECIAL\s*INSTRUCTIONS|CONTACT|PHONE|EMAIL|FAX|DATE|TIME|APPOINTMENT|APPT|WINDOW|ETA|SCHEDULED|ARRIVAL|CHECK-IN|FCFS|ASAP|DELIVERY|PICKUP|SHIPPER|CONSIGNEE|ORIGIN|DESTINATION|LOCATION|ADDRESS|FROM|TO|RECEIVER|LOADING|UNLOADING|PU|P\/U|DEL|FACILITY|SHIPPING|RECEIVING|DROP|UP|PICK|INFO|NAME|MC|DOT|DISPATCHER|DRIVER|TRUCK|TRAILER|LOAD|RATE|TYPE|UNIT|QUANTITY|TOTAL|MODE|SIZE|LINEAR|FEET|TEMPERATURE|PALLET|CASE|HAZMAT|WEIGHT|ESTIMATED|RECEIPT|EXCHANGE|NOTE|CARRIER|COMMODITY|HANDLING|UNITS|STACKABLE|PIECES|DIMS|TEMP|CONFIRM|OF)\s*[:\/\-]?\s*)+$/i;
    cleaned = cleaned.replace(suffixPattern, "").trim();
    
    // Per user feedback, if the address contains "City, ST Zip" twice or is redundant, try to shorten it
    // Or if it clearly has a street followed by city state zip, just keep that.
    
    const blacklist = [
      "1701 Edison Drive", "PO Box 9049", "Louisville, KY 40209", "Milford, OH 45150",
      "FLEET ONE FACTORING", "WEX", "PO BOX 94565", "CLEVELAND, OH 44101",
      "pickup / delivery", "pickup/delivery", "pickup / delivery OR BOTH",
      "delivery OR BOTH", "pickup / delivery OR", "Pallet Yes", "Piece 20000",
      "Pallet", "Piece", "Commodity", "Handling Units"
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
    brokerName: isTraffix ? "TRAFFIX" : "",
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
