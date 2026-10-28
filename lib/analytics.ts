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

export interface GroupPerformance {
  name: string;
  totalTrades: number;
  wins: number;
  losses: number;
  breakevens: number;
  winRate: number;
  netPnL: number;
  netR: number;
}

export interface EquityPoint {
  tradeNumber: number;
  tradeId: string;
  date: string;
  asset: string;
  realizedPnL: number;
  cumulativePnL: number;
  cumulativeR: number;
}

export function calculateSessionPerformance(
  trades: TradeLog[],
): GroupPerformance[] {
  const sessionMap = new Map<string, TradeLog[]>();

  for (const t of trades) {
    const session = t.session ?? "Off-Hours";
    if (!sessionMap.has(session)) {
      sessionMap.set(session, []);
    }
    sessionMap.get(session)!.push(t);
  }

  const results: GroupPerformance[] = [];

  sessionMap.forEach((sessionTrades, sessionName) => {
    const kpis = calculatePerformanceKPIs(sessionTrades);
    if (kpis.closedTrades > 0) {
      results.push({
        name: sessionName,
        totalTrades: kpis.closedTrades,
        wins: kpis.wins,
        losses: kpis.losses,
        breakevens: kpis.breakevens,
        winRate: kpis.winRate,
        netPnL: kpis.netPnL,
        netR: kpis.netR,
      });
    }
  });

  return results.sort((a, b) => b.netPnL - a.netPnL);
}

export function calculateModelPerformance(
  trades: TradeLog[],
): GroupPerformance[] {
  const modelTagRegex = /\[#([^\]]+)\]/g;
  const modelMap = new Map<string, TradeLog[]>();

  for (const t of trades) {
    if (!t.notes) continue;
    const matches = Array.from(t.notes.matchAll(modelTagRegex), (m) => m[1]);

    for (const model of matches) {
      if (!modelMap.has(model)) {
        modelMap.set(model, []);
      }
      modelMap.get(model)!.push(t);
    }
  }

  const results: GroupPerformance[] = [];

  modelMap.forEach((modelTrades, modelName) => {
    const kpis = calculatePerformanceKPIs(modelTrades);
    if (kpis.closedTrades > 0) {
      results.push({
        name: modelName,
        totalTrades: kpis.closedTrades,
        wins: kpis.wins,
        losses: kpis.losses,
        breakevens: kpis.breakevens,
        winRate: kpis.winRate,
        netPnL: kpis.netPnL,
        netR: kpis.netR,
      });
    }
  });

  return results.sort((a, b) => b.netPnL - a.netPnL);
}

export function generateEquityCurve(trades: TradeLog[]): EquityPoint[] {
  // 1. Filter out open trades & sort oldest to newest
  const sorted = [...trades]
    .filter((t) => t.status !== "OPEN")
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );

  let cumulativePnL = 0;
  let cumulativeR = 0;

  // Origin point (Trade #0 at $0 PnL and 0R)
  const points: EquityPoint[] = [
    {
      tradeNumber: 0,
      tradeId: "origin",
      date: sorted[0]?.createdAt ?? new Date().toISOString(),
      asset: "BASE",
      realizedPnL: 0,
      cumulativePnL: 0,
      cumulativeR: 0,
    },
  ];

  // 2. Accumulate chronological PnL and R
  sorted.forEach((t, index) => {
    let pnl = 0;
    let r = 0;

    if (t.status === "WIN") {
      pnl = t.projectedProfit;
      r = t.riskRewardRatio;
    } else if (t.status === "LOSS") {
      pnl = -t.cashAtRisk;
      r = -1;
    }

    cumulativePnL += pnl;
    cumulativeR += r;

    points.push({
      tradeNumber: index + 1,
      tradeId: t.id,
      date: t.createdAt,
      asset: t.asset,
      realizedPnL: pnl,
      cumulativePnL,
      cumulativeR,
    });
  });

  return points;
}
