/**
 * geminiService.ts - Client-side AI parser for Dakota+ using Google Gen AI SDK
 * 
 * SECURITY WARNING FOR CLIENT-SIDE STATIC APPS:
 * When used on a static host like Render (client-only), the API key is provided
 * via VITE_GEMINI_API_KEY or stored locally in the browser's localStorage.
 * Restrict your API key to your specific domain in the Google Cloud Console.
 */

import { GoogleGenAI, Type } from '@google/genai';
import { ParsedRateCon, Stop } from '../utils/parser';

export const getStoredApiKey = (): string => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('dakota_gemini_api_key');
    if (saved && saved.trim()) return saved.trim();
  }
  const env = (import.meta as any)?.env || {};
  const envKey = env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY;
  if (envKey && typeof envKey === 'string' && envKey.trim()) {
    return envKey.trim();
  }
  return '';
};

export const setStoredApiKey = (key: string): void => {
  if (typeof window !== 'undefined') {
    if (!key || !key.trim()) {
      localStorage.removeItem('dakota_gemini_api_key');
    } else {
      localStorage.setItem('dakota_gemini_api_key', key.trim());
    }
  }
};

const EXTRACTION_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    loadNumber: { type: Type.STRING, description: 'The unique Load #, Order #, PO #, Booking # or Confirmation #. Null/empty if not present.' },
    brokerName: { type: Type.STRING, description: 'The broker or 3PL company name (e.g. C.H. Robinson, TQL, Echo, Arrive, Coyote, etc.).' },
    brokerEmail: { type: Type.STRING, description: 'Contact email for the broker if found.' },
    rate: { type: Type.STRING, description: 'Total agreed carrier pay (just the number, e.g. 1450.00).' },
    weight: { type: Type.STRING, description: 'Total weight with unit (e.g. 42000 lbs or 42 KLB).' },
    originAddress: { type: Type.STRING, description: 'Full address of the first pickup location (Street, City, ST ZIP).' },
    pickupDate: { type: Type.STRING, description: 'First pickup date in MM/DD/YYYY format.' },
    pickupTime: { type: Type.STRING, description: 'First pickup appointment time or window (e.g. 08:00, 08:00 - 16:00, FCFS).' },
    destinationAddress: { type: Type.STRING, description: 'Full address of the final delivery location (Street, City, ST ZIP).' },
    deliveryDate: { type: Type.STRING, description: 'Final delivery date in MM/DD/YYYY format.' },
    deliveryTime: { type: Type.STRING, description: 'Final delivery appointment time or window.' },
    stops: {
      type: Type.ARRAY,
      description: 'Ordered sequence of all stops (pickups followed by deliveries).',
      items: {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING, description: 'Must be either "pickup" or "delivery"' },
          label: { type: Type.STRING, description: 'Stop label, e.g. Shipper #1, Receiver #1' },
          address: { type: Type.STRING, description: 'Full address (City, State, Zip)' },
          date: { type: Type.STRING, description: 'Date of stop in MM/DD/YYYY format' },
          time: { type: Type.STRING, description: 'Time of stop (e.g. 09:00, FCFS, 14:00)' }
        },
        required: ['type', 'address']
      }
    }
  },
  required: ['loadNumber', 'originAddress', 'destinationAddress']
};

export async function extractRateConWithGemini(
  pdfText: string,
  regexData?: ParsedRateCon,
  customApiKey?: string
): Promise<{ data: ParsedRateCon; aiSuccess: boolean; error?: string }> {
  const apiKey = (customApiKey && customApiKey.trim()) || getStoredApiKey();

  if (!apiKey) {
    return {
      data: regexData || createEmptyParsedData(pdfText),
      aiSuccess: false,
      error: 'NO_API_KEY'
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `You are the specialized Dakota+ Rate Confirmation Extraction AI for freight dispatchers.
Your mission is to read the raw text of a Rate Confirmation PDF and extract structured data with 100% factual accuracy.

=== CRITICAL ANTI-HALLUCINATION RULES ===
1. Extract ONLY facts that appear explicitly in the provided text.
2. NEVER guess or fabricate load numbers, addresses, rates, dates, or weights.
3. If any field is not stated in the document, return an empty string "" or null.
4. If there are multiple stops, capture ALL pickups in order, followed by ALL deliveries in order.
5. For State and City: ensure the 2-letter state abbreviation is extracted accurately from the address.
6. Rate: extract the total gross pay amount (numbers only, e.g. 1850.00).
7. Weight: if multiple commodities are listed, sum them or extract the total gross weight.

Here is the document text:
"""
${pdfText.slice(0, 16000)}
"""

${regexData ? `Note: Preliminary regex extraction detected the following hints (use to verify, but override if the document text clearly says otherwise):
- Detected Load #: ${regexData.loadNumber || 'none'}
- Detected Rate: ${regexData.rate || 'none'}
- Detected Weight: ${regexData.weight || 'none'}
- Detected Origin: ${regexData.originAddress || 'none'}
- Detected Dest: ${regexData.destinationAddress || 'none'}
` : ''}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: EXTRACTION_SCHEMA,
        temperature: 0.1, // Near-zero temperature to completely eliminate creative hallucination
      }
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error('Gemini returned an empty response.');
    }

    const aiResult = JSON.parse(responseText);

    // Merge AI result with regex data for maximum reliability
    const mergedData = mergeRegexAndAi(regexData, aiResult, pdfText);

    return {
      data: mergedData,
      aiSuccess: true
    };
  } catch (err: any) {
    console.error('Dakota+ Gemini Extraction Error:', err);
    return {
      data: regexData || createEmptyParsedData(pdfText),
      aiSuccess: false,
      error: err?.message || 'Error processing with AI'
    };
  }
}

function mergeRegexAndAi(
  regex: ParsedRateCon | undefined,
  ai: any,
  rawText: string
): ParsedRateCon {
  const base = regex || createEmptyParsedData(rawText);

  // Helper to choose non-empty value, prioritizing AI if valid or regex if clean
  const choose = (aiVal: any, regexVal: string | undefined): string => {
    if (aiVal && typeof aiVal === 'string' && aiVal.trim() && !aiVal.includes('??')) {
      return aiVal.trim();
    }
    return regexVal || '';
  };

  const loadNumber = choose(ai.loadNumber, base.loadNumber);
  const brokerName = choose(ai.brokerName, base.brokerName);
  const brokerEmail = choose(ai.brokerEmail, base.brokerEmail);
  const rate = choose(ai.rate, base.rate);
  const weight = choose(ai.weight, base.weight);
  const originAddress = choose(ai.originAddress, base.originAddress);
  const destinationAddress = choose(ai.destinationAddress, base.destinationAddress);
  const pickupTime = choose(ai.pickupTime, base.pickupTime);
  const pickupDate = choose(ai.pickupDate, base.pickupDate);
  const deliveryTime = choose(ai.deliveryTime, base.deliveryTime);
  const deliveryDate = choose(ai.deliveryDate, base.deliveryDate);

  // Merge stops
  let stops: Stop[] = [];
  if (Array.isArray(ai.stops) && ai.stops.length > 0) {
    stops = ai.stops.map((s: any, idx: number) => ({
      type: (s.type === 'delivery' ? 'delivery' : 'pickup') as 'pickup' | 'delivery',
      label: s.label || (s.type === 'delivery' ? `DELIVERY #${idx + 1}` : `SHIPPER #${idx + 1}`),
      address: s.address || '',
      date: s.date || (s.type === 'delivery' ? deliveryDate : pickupDate) || '',
      time: s.time || (s.type === 'delivery' ? deliveryTime : pickupTime) || 'FCFS'
    }));
  } else if (base.stops && base.stops.length > 0) {
    stops = [...base.stops];
  } else {
    // Synthesize from origin & destination if stops are empty
    if (originAddress) {
      stops.push({
        type: 'pickup',
        label: 'SHIPPER',
        address: originAddress,
        date: pickupDate,
        time: pickupTime || 'FCFS'
      });
    }
    if (destinationAddress) {
      stops.push({
        type: 'delivery',
        label: 'RECEIVER',
        address: destinationAddress,
        date: deliveryDate || pickupDate,
        time: deliveryTime || 'FCFS'
      });
    }
  }

  return {
    ...base,
    loadNumber: loadNumber || base.loadNumber,
    brokerName: brokerName || base.brokerName,
    brokerEmail: brokerEmail || base.brokerEmail,
    rate: rate || base.rate,
    weight: weight || base.weight,
    originAddress: originAddress || base.originAddress,
    destinationAddress: destinationAddress || base.destinationAddress,
    pickupTime: pickupTime || base.pickupTime,
    pickupDate: pickupDate || base.pickupDate,
    deliveryTime: deliveryTime || base.deliveryTime,
    deliveryDate: deliveryDate || base.deliveryDate,
    stops,
    rawTextPreview: rawText
  };
}

function createEmptyParsedData(rawText: string): ParsedRateCon {
  return {
    loadNumber: '',
    weight: '',
    rate: '',
    stops: [],
    pickupTime: '',
    pickupDate: '',
    deliveryTime: '',
    deliveryDate: '',
    originAddress: '',
    destinationAddress: '',
    brokerName: '',
    brokerEmail: '',
    rawTextPreview: rawText
  };
}
