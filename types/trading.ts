export const ASSETS = [
  "NAS100",
  "US30",
  "EURUSD",
  "GBPUSD",
  "XAUUSD",
  "BTCUSD",
] as const;
export type AssetSymbol = (typeof ASSETS)[number];

export type AssetCategory = "Forex" | "Indices" | "Metals" | "Crypto";

export type TradeDirection = "long" | "short";

export interface AssetSpec {
  name: string;
  category: AssetCategory;
  tickSize: number;
  tickValue: number;
  defaultEntry: number;
  defaultSl: number;
  defaultTp: number;
}

export const ASSET_SPECS: Record<AssetSymbol, AssetSpec> = {
  NAS100: {
    name: "Nasdaq 100",
    category: "Indices",
    tickSize: 0.25,
    tickValue: 0.5,
    defaultEntry: 20250.0,
    defaultSl: 20200.0,
    defaultTp: 20400.0,
  },
  US30: {
    name: "Dow Jones 30",
    category: "Indices",
    tickSize: 1.0,
    tickValue: 1.0,
    defaultEntry: 43500.0,
    defaultSl: 43400.0,
    defaultTp: 43750.0,
  },
  EURUSD: {
    name: "Euro / US Dollar",
    category: "Forex",
    tickSize: 0.0001,
    tickValue: 10.0,
    defaultEntry: 1.085,
    defaultSl: 1.0825,
    defaultTp: 1.0925,
  },
  GBPUSD: {
    name: "British Pound / US Dollar",
    category: "Forex",
    tickSize: 0.0001,
    tickValue: 10.0,
    defaultEntry: 1.295,
    defaultSl: 1.292,
    defaultTp: 1.3025,
  },
  XAUUSD: {
    name: "Gold",
    category: "Metals",
    tickSize: 0.01,
    tickValue: 1.0,
    defaultEntry: 2720.0,
    defaultSl: 2710.0,
    defaultTp: 2750.0,
  },
  BTCUSD: {
    name: "Bitcoin",
    category: "Crypto",
    tickSize: 1.0,
    tickValue: 1.0,
    defaultEntry: 67000.0,
    defaultSl: 65500.0,
    defaultTp: 71000.0,
  },
};

export const SESSIONS = [
  "Asia Killzone",
  "London Killzone",
  "London SB",
  "NY AM Killzone",
  "NY AM SB",
  "NY PM Killzone",
  "NY PM SB",
] as const;
export type TradingSession = (typeof SESSIONS)[number];

export type ActiveTab = "calculator" | "journal" | "analytics";
