import { createClient } from "@/lib/supabase";
import { TradeLog } from "@/types/trading";
import { LogTradePayload } from "@/components/calculator";

export async function fetchTrades(): Promise<TradeLog[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("trades")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch trades from Supabase:", error);
    return [];
  }

  return (data || []).map((row) => ({
    id: row.id,
    asset: row.asset,
    direction: row.direction,
    entryPrice: Number(row.entry_price),
    stopLossPrice: Number(row.stop_loss_price),
    takeProfitPrice: Number(row.take_profit_price),
    positionSize: Number(row.position_size),
    riskPercentage: Number(row.risk_percentage),
    cashAtRisk: Number(row.cash_at_risk),
    projectedProfit: Number(row.projected_profit),
    riskRewardRatio: Number(row.risk_reward_ratio),
    status: row.status,
    session: row.session,
    notes: row.notes,
    createdAt: row.created_at,
  }));
}

export async function insertTrade(
  payload: LogTradePayload,
  activeSession?: string,
): Promise<TradeLog | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("trades")
    .insert({
      asset: payload.asset,
      direction: payload.direction,
      entry_price: payload.entryPrice,
      stop_loss_price: payload.stopLossPrice,
      take_profit_price: payload.takeProfitPrice,
      position_size: payload.positionSize,
      risk_percentage: payload.riskPercentage,
      cash_at_risk: payload.cashAtRisk,
      projected_profit: payload.projectedProfit,
      risk_reward_ratio: payload.riskRewardRatio,
      status: "OPEN",
      session: activeSession ?? null,
    })
    .select()
    .single();

  if (error || !data) {
    console.error("Failed to insert trade into Supabase:", error);
    return null;
  }

  return {
    id: data.id,
    asset: data.asset,
    direction: data.direction,
    entryPrice: Number(data.entry_price),
    stopLossPrice: Number(data.stop_loss_price),
    takeProfitPrice: Number(data.take_profit_price),
    positionSize: Number(data.position_size),
    riskPercentage: Number(data.risk_percentage),
    cashAtRisk: Number(data.cash_at_risk),
    projectedProfit: Number(data.projected_profit),
    riskRewardRatio: Number(data.risk_reward_ratio),
    status: data.status,
    session: data.session,
    notes: data.notes,
    createdAt: data.created_at,
  };
}

export async function updateTradeOutcome(
  id: string,
  status: TradeLog["status"],
): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from("trades")
    .update({ status })
    .eq("id", id);

  if (error) {
    console.error(`Failed to update trade outcome for ${id}:`, error);
    return false;
  }

  return true;
}
