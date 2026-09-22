export type AssetClass =
  | "EURUSD"
  | "GBPUSD"
  | "GBPJPY"
  | "XAUUSD"
  | "NAS100"
  | "SPX500";

export type TradingSession =
  | "Asia Killzone"
  | "London Killzone"
  | "London SB"
  | "NY AM Killzone"
  | "NY AM SB"
  | "NY PM Killzone"
  | "NY PM SB";

export interface Trade {
  id?: string;
  asset: AssetClass;
  session: TradingSession;
  result_pnl: number;
  created_at?: string;
}
