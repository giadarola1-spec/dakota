import { ParsedRateCon } from './parser';
import { ChainToken, CustomChainStyle, DriverInfo } from '../types/chain';

export const EMOJI_MAP: Record<string, string> = {
  green: "🟢",
  purple: "🟣",
  red: "🔴",
  blue: "🔵",
  none: ""
};

export const AVAILABLE_TOKENS: ChainToken[] = [
  // --- Truck & Driver ---
  { id: 'var_emoji', type: 'variable', value: '[TEAM_EMOJI]', label: 'Team Emoji (🟢)', category: 'truck_driver', iconName: 'Circle' },
  { id: 'var_truck', type: 'variable', value: '[TRUCK_NUM]', label: 'Truck # (e.g. 1021)', category: 'truck_driver', iconName: 'Truck' },
  { id: 'var_driver_name', type: 'variable', value: '[DRIVER_NAME]', label: 'Driver Name (e.g. John Doe)', category: 'truck_driver', iconName: 'User' },
  { id: 'var_driver_phone', type: 'variable', value: '[DRIVER_PHONE]', label: 'Driver Phone', category: 'truck_driver', iconName: 'Phone' },
  { id: 'var_trailer', type: 'variable', value: '[TRAILER_NUM]', label: 'Trailer # (e.g. 5301)', category: 'truck_driver', iconName: 'Container' },
  { id: 'var_company', type: 'variable', value: '[COMPANY_CODE]', label: 'Company Code (e.g. OD)', category: 'truck_driver', iconName: 'Building' },

  // --- Load & Broker ---
  { id: 'var_load_num', type: 'variable', value: '[LOAD_NUM]', label: 'Load # (e.g. OR564577)', category: 'load_broker', iconName: 'FileText' },
  { id: 'var_broker', type: 'variable', value: '[BROKER]', label: 'Broker (e.g. TRAFFIX)', category: 'load_broker', iconName: 'Briefcase' },
  { id: 'var_rate', type: 'variable', value: '[RATE]', label: 'Rate (e.g. $700.00)', category: 'load_broker', iconName: 'DollarSign' },
  { id: 'var_weight', type: 'variable', value: '[WEIGHT]', label: 'Weight (e.g. 20,000 LBS)', category: 'load_broker', iconName: 'Scale' },

  // --- Location & Route ---
  { id: 'var_lane', type: 'variable', value: '[LANE]', label: 'Lane (e.g. IL-IN)', category: 'location', iconName: 'Navigation' },
  { id: 'var_origin_state', type: 'variable', value: '[ORIGIN_STATE]', label: 'Origin State (e.g. IL)', category: 'location', iconName: 'MapPin' },
  { id: 'var_dest_state', type: 'variable', value: '[DEST_STATE]', label: 'Dest State (e.g. IN)', category: 'location', iconName: 'MapPin' },
  { id: 'var_origin_city', type: 'variable', value: '[ORIGIN_CITY]', label: 'Origin City (e.g. Chicago)', category: 'location', iconName: 'MapPin' },
  { id: 'var_dest_city', type: 'variable', value: '[DEST_CITY]', label: 'Dest City (e.g. Indianapolis)', category: 'location', iconName: 'MapPin' },
  { id: 'var_origin_city_state', type: 'variable', value: '[ORIGIN_CITY_STATE]', label: 'Origin City, ST', category: 'location', iconName: 'MapPin' },
  { id: 'var_dest_city_state', type: 'variable', value: '[DEST_CITY_STATE]', label: 'Dest City, ST', category: 'location', iconName: 'MapPin' },

  // --- Date & Time ---
  { id: 'var_date_dot', type: 'variable', value: '[DATE_DOTS]', label: 'Date MM.DD.YYYY', category: 'date_time', iconName: 'Calendar' },
  { id: 'var_date_slash', type: 'variable', value: '[DATE_SLASH]', label: 'Date MM/DD/YYYY', category: 'date_time', iconName: 'Calendar' },
  { id: 'var_date_dash', type: 'variable', value: '[DATE_DASH]', label: 'Date MM-DD-YYYY', category: 'date_time', iconName: 'Calendar' },
  { id: 'var_pu_time', type: 'variable', value: '[PU_TIME]', label: 'Pickup Time (e.g. 14:00)', category: 'date_time', iconName: 'Clock' },
  { id: 'var_del_time', type: 'variable', value: '[DEL_TIME]', label: 'Delivery Time', category: 'date_time', iconName: 'Clock' },

  // --- Keywords / Labels ---
  { id: 'kw_truck', type: 'keyword', value: 'TRUCK', label: 'TRUCK', category: 'keywords' },
  { id: 'kw_truck_hash', type: 'keyword', value: 'TRUCK#', label: 'TRUCK#', category: 'keywords' },
  { id: 'kw_truck_space_hash', type: 'keyword', value: 'TRUCK #', label: 'TRUCK #', category: 'keywords' },
  { id: 'kw_load', type: 'keyword', value: 'LOAD', label: 'LOAD', category: 'keywords' },
  { id: 'kw_load_hash', type: 'keyword', value: 'LOAD#', label: 'LOAD#', category: 'keywords' },
  { id: 'kw_load_space_hash', type: 'keyword', value: 'LOAD #', label: 'LOAD #', category: 'keywords' },
  { id: 'kw_po_hash', type: 'keyword', value: 'PO#', label: 'PO#', category: 'keywords' },
  { id: 'kw_driver', type: 'keyword', value: 'DRIVER', label: 'DRIVER', category: 'keywords' },
  { id: 'kw_phone', type: 'keyword', value: 'PHONE', label: 'PHONE', category: 'keywords' },

  // --- Separators ---
  { id: 'sep_space', type: 'separator', value: ' ', label: '␣ Espacio', category: 'separators' },
  { id: 'sep_dash', type: 'separator', value: '-', label: '-', category: 'separators' },
  { id: 'sep_spaced_dash', type: 'separator', value: ' - ', label: ' - ', category: 'separators' },
  { id: 'sep_slash', type: 'separator', value: '/', label: '/', category: 'separators' },
  { id: 'sep_pipe', type: 'separator', value: '|', label: '|', category: 'separators' },
  { id: 'sep_hash', type: 'separator', value: '#', label: '#', category: 'separators' },
  { id: 'sep_dot', type: 'separator', value: '.', label: '.', category: 'separators' },
  { id: 'sep_colon', type: 'separator', value: ':', label: ':', category: 'separators' },
  { id: 'sep_comma', type: 'separator', value: ',', label: ',', category: 'separators' },
  { id: 'sep_open_bracket', type: 'separator', value: '[', label: '[', category: 'separators' },
  { id: 'sep_close_bracket', type: 'separator', value: ']', label: ']', category: 'separators' },
  { id: 'sep_open_paren', type: 'separator', value: '(', label: '(', category: 'separators' },
  { id: 'sep_close_paren', type: 'separator', value: ')', label: ')', category: 'separators' }
];

export const PRESET_CHAINS: CustomChainStyle[] = [
  {
    id: 'standard',
    name: 'Std',
    isPreset: true,
    tokens: [
      { id: 'p1_1', type: 'variable', value: '[TEAM_EMOJI]', label: 'Team Emoji' },
      { id: 'p1_2', type: 'separator', value: ' ', label: 'Space' },
      { id: 'p1_3', type: 'variable', value: '[TRUCK_NUM]', label: 'Truck #' },
      { id: 'p1_4', type: 'separator', value: '-', label: '-' },
      { id: 'p1_5', type: 'variable', value: '[LANE]', label: 'Lane' },
      { id: 'p1_6', type: 'separator', value: '-', label: '-' },
      { id: 'p1_7', type: 'variable', value: '[DATE_DOTS]', label: 'Date MM.DD.YYYY' },
      { id: 'p1_8', type: 'separator', value: ' ', label: 'Space' },
      { id: 'p1_9', type: 'variable', value: '[BROKER]', label: 'Broker' },
      { id: 'p1_10', type: 'separator', value: ' ', label: 'Space' },
      { id: 'p1_11', type: 'keyword', value: 'LOAD', label: 'LOAD' },
      { id: 'p1_12', type: 'separator', value: ' ', label: 'Space' },
      { id: 'p1_13', type: 'variable', value: '[LOAD_NUM]', label: 'Load #' }
    ]
  },
  {
    id: 'alternative',
    name: 'Alt 1',
    isPreset: true,
    tokens: [
      { id: 'p2_1', type: 'variable', value: '[TEAM_EMOJI]', label: 'Team Emoji' },
      { id: 'p2_2', type: 'separator', value: ' ', label: 'Space' },
      { id: 'p2_3', type: 'keyword', value: 'TRUCK#', label: 'TRUCK#' },
      { id: 'p2_4', type: 'separator', value: ' ', label: 'Space' },
      { id: 'p2_5', type: 'variable', value: '[TRUCK_NUM]', label: 'Truck #' },
      { id: 'p2_6', type: 'separator', value: '-', label: '-' },
      { id: 'p2_7', type: 'variable', value: '[LANE]', label: 'Lane' },
      { id: 'p2_8', type: 'separator', value: '-', label: '-' },
      { id: 'p2_9', type: 'variable', value: '[DATE_DOTS]', label: 'Date MM.DD.YYYY' },
      { id: 'p2_10', type: 'separator', value: ' ', label: 'Space' },
      { id: 'p2_11', type: 'variable', value: '[BROKER]', label: 'Broker' },
      { id: 'p2_12', type: 'separator', value: ' ', label: 'Space' },
      { id: 'p2_13', type: 'keyword', value: 'LOAD#', label: 'LOAD#' },
      { id: 'p2_14', type: 'separator', value: ' ', label: 'Space' },
      { id: 'p2_15', type: 'variable', value: '[LOAD_NUM]', label: 'Load #' }
    ]
  },
  {
    id: 'alt2',
    name: 'Alt 2',
    isPreset: true,
    tokens: [
      { id: 'p3_1', type: 'variable', value: '[TEAM_EMOJI]', label: 'Team Emoji' },
      { id: 'p3_2', type: 'separator', value: ' ', label: 'Space' },
      { id: 'p3_3', type: 'keyword', value: 'TRUCK #', label: 'TRUCK #' },
      { id: 'p3_4', type: 'variable', value: '[TRUCK_NUM]', label: 'Truck #' },
      { id: 'p3_5', type: 'separator', value: ' ', label: 'Space' },
      { id: 'p3_6', type: 'variable', value: '[LANE]', label: 'Lane' },
      { id: 'p3_7', type: 'separator', value: ' ', label: 'Space' },
      { id: 'p3_8', type: 'variable', value: '[DATE_DOTS]', label: 'Date MM.DD.YYYY' },
      { id: 'p3_9', type: 'separator', value: ' ', label: 'Space' },
      { id: 'p3_10', type: 'variable', value: '[BROKER]', label: 'Broker' },
      { id: 'p3_11', type: 'separator', value: ' ', label: 'Space' },
      { id: 'p3_12', type: 'keyword', value: 'LOAD #', label: 'LOAD #' },
      { id: 'p3_13', type: 'variable', value: '[LOAD_NUM]', label: 'Load #' }
    ]
  },
  {
    id: 'alt3',
    name: 'Alt 3',
    isPreset: true,
    tokens: [
      { id: 'p4_1', type: 'variable', value: '[TEAM_EMOJI]', label: 'Team Emoji' },
      { id: 'p4_2', type: 'keyword', value: 'TRUCK', label: 'TRUCK' },
      { id: 'p4_3', type: 'separator', value: ' ', label: 'Space' },
      { id: 'p4_4', type: 'variable', value: '[TRUCK_NUM]', label: 'Truck #' },
      { id: 'p4_5', type: 'separator', value: ' ', label: 'Space' },
      { id: 'p4_6', type: 'variable', value: '[LANE]', label: 'Lane' },
      { id: 'p4_7', type: 'separator', value: ' ', label: 'Space' },
      { id: 'p4_8', type: 'variable', value: '[DATE_DOTS]', label: 'Date MM.DD.YYYY' },
      { id: 'p4_9', type: 'separator', value: ' ', label: 'Space' },
      { id: 'p4_10', type: 'variable', value: '[BROKER]', label: 'Broker' },
      { id: 'p4_11', type: 'separator', value: ' ', label: 'Space' },
      { id: 'p4_12', type: 'keyword', value: 'LOAD#', label: 'LOAD#' },
      { id: 'p4_13', type: 'separator', value: ' ', label: 'Space' },
      { id: 'p4_14', type: 'variable', value: '[LOAD_NUM]', label: 'Load #' }
    ]
  }
];

// Helper to extract State code
const getState = (addr?: string): string => {
  if (!addr) return "??";
  const match = addr.match(/,\s*([A-Z]{2})/i) || addr.match(/\b([A-Z]{2})\s+\d{5}/i);
  return match ? match[1].toUpperCase() : "??";
};

// Helper to extract City
const getCity = (addr?: string): string => {
  if (!addr) return "??";
  const parts = addr.split(',');
  if (parts.length >= 2) {
    return parts[0].trim();
  }
  return "??";
};

// Helper to extract City, ST
const getCityState = (addr?: string): string => {
  if (!addr) return "??, ??";
  const state = getState(addr);
  const city = getCity(addr);
  return `${city}, ${state}`;
};

// Normalize date to various formats
const formatDateHelper = (dateStr: string, separator: '.' | '/' | '-'): string => {
  if (!dateStr) return `MM${separator}DD${separator}YYYY`;
  const parts = dateStr.split(/[/.-]/);
  if (parts.length === 3) {
    let [m, d, y] = parts;
    if (m.length === 1) m = `0${m}`;
    if (d.length === 1) d = `0${d}`;
    if (y.length === 2) y = `20${y}`;
    return `${m}${separator}${d}${separator}${y}`;
  }
  return dateStr;
};

export function renderChainSubject(
  tokens: ChainToken[],
  data: Partial<ParsedRateCon>,
  truckNumber: string,
  broker: string,
  team: string,
  driver?: DriverInfo | null,
  robinsonDisplayMode: 'space' | 'no-space' | string = 'space'
): string {
  const emoji = EMOJI_MAP[team] ?? "";
  
  let displayBroker = broker || "";
  if (broker.toUpperCase().includes('ROBINSON')) {
    displayBroker = robinsonDisplayMode === 'no-space' ? 'CHROBINSON' : 'CH ROBINSON';
  }

  let loadNum = data.loadNumber || "123456";
  if (displayBroker.toUpperCase().includes('TRAFFIX') && !loadNum.startsWith('T') && !loadNum.startsWith('t')) {
    loadNum = `T${loadNum}`;
  }
  if (displayBroker.toUpperCase().includes('ROBINSON')) {
    loadNum = loadNum.replace(/^T/i, '');
  }

  const originState = getState(data.originAddress);
  const destState = getState(data.destinationAddress);
  const lane = `${originState}-${destState}`;

  const originCity = getCity(data.originAddress);
  const destCity = getCity(data.destinationAddress);
  const originCityState = getCityState(data.originAddress);
  const destCityState = getCityState(data.destinationAddress);

  const rawDate = data.pickupDate || "";
  const dateDots = formatDateHelper(rawDate, '.');
  const dateSlash = formatDateHelper(rawDate, '/');
  const dateDash = formatDateHelper(rawDate, '-');

  const weight = data.weight || "20,000 LBS";
  const rate = data.rate ? (data.rate.startsWith('$') ? data.rate : `$${data.rate}`) : "$700.00";
  const puTime = data.pickupTime || "14:00";
  const delTime = data.deliveryTime || "15:00-19:00";

  const resolvedValues: Record<string, string> = {
    '[TEAM_EMOJI]': emoji,
    '[TRUCK_NUM]': truckNumber || "TRUCK#",
    '[DRIVER_NAME]': driver?.driverName || "DRIVER",
    '[DRIVER_PHONE]': driver?.phoneNumber || "PHONE",
    '[TRAILER_NUM]': driver?.trailer || "TRAILER",
    '[COMPANY_CODE]': driver?.companyCode || "CO",
    '[LOAD_NUM]': loadNum,
    '[BROKER]': displayBroker,
    '[RATE]': rate,
    '[WEIGHT]': weight,
    '[LANE]': lane,
    '[ORIGIN_STATE]': originState,
    '[DEST_STATE]': destState,
    '[ORIGIN_CITY]': originCity,
    '[DEST_CITY]': destCity,
    '[ORIGIN_CITY_STATE]': originCityState,
    '[DEST_CITY_STATE]': destCityState,
    '[DATE_DOTS]': dateDots,
    '[DATE_SLASH]': dateSlash,
    '[DATE_DASH]': dateDash,
    '[PU_TIME]': puTime,
    '[DEL_TIME]': delTime,
  };

  let rendered = "";

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.type === 'variable') {
      const val = resolvedValues[token.value] !== undefined ? resolvedValues[token.value] : token.value;
      rendered += val;
    } else if (token.type === 'keyword' || token.type === 'separator' || token.type === 'custom') {
      rendered += token.value;
    }
  }

  // Clean leading spaces if team emoji is empty and next char is space
  if (!emoji && rendered.startsWith(" ")) {
    rendered = rendered.trimStart();
  }

  return rendered;
}
