import { TradeLog } from "@/types/trading";

export type TimeframeFilter = "ALL" | "MONTH" | "WEEK";

export interface PerformanceKPIs {
  totalTrades: number;
  closedTrades: number;
  openTrades: number;
  wins: number;
  losses: number;
  breakevens: number;
  winRate: number;
  grossProfit: number;
  grossLoss: number;
  netPnL: number;
  netR: number;
  profitFactor: number | null;
  avgWin: number;
  avgLoss: number;
  expectancy: number;
}

export function filterTradesByTimeframe(
  trades: TradeLog[],
  filter: TimeframeFilter,
): TradeLog[] {
  if (filter === "ALL") return trades;

  const now = Date.now();
  const days = filter === "WEEK" ? 7 : 30;
  const cutoffTime = now - days * 24 * 60 * 60 * 1000;

  return trades.filter((t) => new Date(t.createdAt).getTime() >= cutoffTime);
}

export function calculatePerformanceKPIs(trades: TradeLog[]): PerformanceKPIs {
  let openTrades = 0;
  let wins = 0;
  let losses = 0;
  let breakevens = 0;
  let grossProfit = 0;
  let grossLoss = 0;
  let netR = 0;

  for (const t of trades) {
    if (t.status === "OPEN") {
      openTrades++;
      continue;
    }

    if (t.status === "WIN") {
      wins++;
      grossProfit += t.projectedProfit;
      netR += t.riskRewardRatio;
    } else if (t.status === "LOSS") {
      losses++;
      grossLoss += t.cashAtRisk;
      netR -= 1; // 1R loss
    } else if (t.status === "BE") {
      breakevens++;
    }
  }

  const closedTrades = wins + losses + breakevens;
  const winRate = closedTrades > 0 ? (wins / closedTrades) * 100 : 0;
  const netPnL = grossProfit - grossLoss;

  // Prevent division by zero
  const profitFactor =
    grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? null : 0;

  const avgWin = wins > 0 ? grossProfit / wins : 0;
  const avgLoss = losses > 0 ? grossLoss / losses : 0;

  // Expectancy = (Win% * AvgWin) - (Loss% * AvgLoss)
  const winProb = closedTrades > 0 ? wins / closedTrades : 0;
  const lossProb = closedTrades > 0 ? losses / closedTrades : 0;
  const expectancy = winProb * avgWin - lossProb * avgLoss;

  return {
    totalTrades: trades.length,
    closedTrades,
    openTrades,
    wins,
    losses,
    breakevens,
    winRate,
    grossProfit,
    grossLoss,
    netPnL,
    netR,
    profitFactor,
    avgWin,
    avgLoss,
    expectancy,
  };
}
