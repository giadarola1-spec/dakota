import { ParsedRateCon } from '../utils/parser';

export type ChainTokenType = 
  | 'variable'
  | 'keyword'
  | 'separator'
  | 'custom';

export interface ChainToken {
  id: string;
  type: ChainTokenType;
  value: string;
  label: string;
  category?: 'truck_driver' | 'load_broker' | 'location' | 'date_time' | 'keywords' | 'separators' | 'custom';
  iconName?: string;
}

export interface CustomChainStyle {
  id: string;
  name: string;
  isPreset?: boolean;
  tokens: ChainToken[];
  createdAt?: number;
}

export interface DriverInfo {
  truck?: string;
  trailer?: string;
  companyCode?: string;
  driverName?: string;
  phoneNumber?: string;
  email?: string;
}
