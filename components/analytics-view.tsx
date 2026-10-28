"use client";

import { useState, useEffect, useMemo } from "react";
import { TradeLog } from "@/types/trading";
import { fetchTrades } from "@/lib/supabase/trades";
import {
  TimeframeFilter,
  filterTradesByTimeframe,
  calculatePerformanceKPIs,
  calculateSessionPerformance,
  calculateModelPerformance,
  generateEquityCurve,
} from "@/lib/analytics";
import { EquityChart } from "@/components/equity-chart";
import {
  TrendingUp,
  TrendingDown,
  Percent,
  Activity,
  Layers,
  Clock,
  RefreshCw,
  Compass,
} from "lucide-react";

export function AnalyticsView() {
  const [trades, setTrades] = useState<TradeLog[]>([]);
  const [timeframe, setTimeframe] = useState<TimeframeFilter>("ALL");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Safe data fetching with cleanup flag to avoid cascading render warnings
  useEffect(() => {
    let ignore = false;
    async function load() {
      const data = await fetchTrades();
      if (!ignore) {
        setTrades(data);
        setIsLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, []);

  // Filter trades whenever timeframe selection changes
  const filteredTrades = useMemo(() => {
    return filterTradesByTimeframe(trades, timeframe);
  }, [trades, timeframe]);

  // Derived financial analytics
  const kpis = useMemo(
    () => calculatePerformanceKPIs(filteredTrades),
    [filteredTrades],
  );
  const sessionEdge = useMemo(
    () => calculateSessionPerformance(filteredTrades),
    [filteredTrades],
  );
  const modelEdge = useMemo(
    () => calculateModelPerformance(filteredTrades),
    [filteredTrades],
  );
  const equityData = useMemo(
    () => generateEquityCurve(filteredTrades),
    [filteredTrades],
  );

  if (isLoading) {
    return (
      <div className="h-96 rounded-md border border-[#1e222d] bg-[#121318] flex flex-col items-center justify-center font-mono text-zinc-500 text-xs">
        <RefreshCw className="w-5 h-5 animate-spin mb-2 text-zinc-400" />
        Computing institutional analytics engine...
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 font-mono">
      {/* Header Bar & Timeframe Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1e222d]">
        <div>
          <h2 className="text-lg font-bold text-zinc-100 tracking-tight">
            Institutional Performance Analytics
          </h2>
          <p className="text-xs text-zinc-500">
            Realized expectancy, market session edge, and strategy setup
            attribution.
          </p>
        </div>

        {/* Timeframe Filter Buttons */}
        <div className="inline-flex items-center gap-1 bg-[#09090b] p-1 rounded border border-[#1e222d] text-xs">
          {(["ALL", "MONTH", "WEEK"] as TimeframeFilter[]).map((tf) => (
            <button
              key={tf}
              type="button"
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1 rounded text-xs transition-colors cursor-pointer ${
                timeframe === tf
                  ? "bg-zinc-800 text-zinc-100 font-bold border border-zinc-700"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {tf === "ALL"
                ? "ALL TIME"
                : tf === "MONTH"
                  ? "30 DAYS"
                  : "7 DAYS"}
            </button>
          ))}
        </div>
      </div>

      {/* KPI 4-Card Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Net PnL */}
        <div className="p-4 rounded-md border border-[#1e222d] bg-[#121318] space-y-1">
          <div className="flex items-center justify-between text-zinc-500 text-[11px]">
            <span>NET REALIZED PNL</span>
            {kpis.netPnL >= 0 ? (
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
            )}
          </div>
          <div className="text-xl font-bold text-zinc-100 flex items-baseline gap-2">
            <span
              className={
                kpis.netPnL >= 0 ? "text-emerald-400" : "text-rose-400"
              }
            >
              {kpis.netPnL >= 0 ? "+" : "-"}${Math.abs(kpis.netPnL).toFixed(2)}
            </span>
            <span
              className={`text-[11px] px-1.5 py-0.2 rounded border ${
                kpis.netR >= 0
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : "bg-rose-500/10 text-rose-400 border-rose-500/20"
              }`}
            >
              {kpis.netR >= 0
                ? `+${kpis.netR.toFixed(2)}R`
                : `${kpis.netR.toFixed(2)}R`}
            </span>
          </div>
          <div className="text-[10px] text-zinc-500">
            Gross Win:{" "}
            <span className="text-emerald-400/90">
              +${kpis.grossProfit.toFixed(0)}
            </span>{" "}
            | Gross Loss:{" "}
            <span className="text-rose-400/90">
              -${kpis.grossLoss.toFixed(0)}
            </span>
          </div>
        </div>

        {/* Card 2: Win Rate */}
        <div className="p-4 rounded-md border border-[#1e222d] bg-[#121318] space-y-1">
          <div className="flex items-center justify-between text-zinc-500 text-[11px]">
            <span>WIN RATE</span>
            <Percent className="w-3.5 h-3.5 text-zinc-400" />
          </div>
          <div className="text-xl font-bold text-zinc-100">
            {kpis.winRate.toFixed(1)}%
          </div>
          <div className="text-[10px] text-zinc-500 flex items-center gap-1.5">
            <span className="text-emerald-400 font-semibold">{kpis.wins}W</span>
            <span>-</span>
            <span className="text-rose-400 font-semibold">{kpis.losses}L</span>
            <span>-</span>
            <span className="text-amber-400 font-semibold">
              {kpis.breakevens}BE
            </span>
            <span className="text-zinc-600">({kpis.closedTrades} total)</span>
          </div>
        </div>

        {/* Card 3: Profit Factor */}
        <div className="p-4 rounded-md border border-[#1e222d] bg-[#121318] space-y-1">
          <div className="flex items-center justify-between text-zinc-500 text-[11px]">
            <span>PROFIT FACTOR</span>
            <Activity className="w-3.5 h-3.5 text-zinc-400" />
          </div>
          <div className="text-xl font-bold text-zinc-100">
            {kpis.profitFactor === null ? "MAX" : kpis.profitFactor.toFixed(2)}
          </div>
          <div className="text-[10px] text-zinc-500">
            {kpis.profitFactor && kpis.profitFactor >= 2.0 ? (
              <span className="text-emerald-400">
                Institutional Grade Edge (&gt; 2.0)
              </span>
            ) : kpis.profitFactor && kpis.profitFactor >= 1.0 ? (
              <span className="text-amber-400">Profitable (1.0 - 2.0)</span>
            ) : (
              <span className="text-zinc-500">Sub-optimal (&lt; 1.0)</span>
            )}
          </div>
        </div>

        {/* Card 4: Expectancy */}
        <div className="p-4 rounded-md border border-[#1e222d] bg-[#121318] space-y-1">
          <div className="flex items-center justify-between text-zinc-500 text-[11px]">
            <span>TRADE EXPECTANCY</span>
            <Compass className="w-3.5 h-3.5 text-zinc-400" />
          </div>
          <div
            className={`text-xl font-bold ${
              kpis.expectancy >= 0 ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {kpis.expectancy >= 0 ? "+" : "-"}$
            {Math.abs(kpis.expectancy).toFixed(2)}
          </div>
          <div className="text-[10px] text-zinc-500">
            Avg W:{" "}
            <span className="text-emerald-400">${kpis.avgWin.toFixed(0)}</span>{" "}
            | Avg L:{" "}
            <span className="text-rose-400">${kpis.avgLoss.toFixed(0)}</span>
          </div>
        </div>
      </div>

      {/* SVG Cumulative Equity Trajectory */}
      <EquityChart data={equityData} />

      {/* 2-Column Edge Attribution Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Module 1: Session / Killzone Edge */}
        <div className="rounded-md border border-[#1e222d] bg-[#121318] p-4 space-y-3">
          <div className="flex items-center gap-2 border-b border-[#1e222d] pb-2">
            <Clock className="w-4 h-4 text-zinc-400" />
            <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
              Market Session Edge
            </h3>
          </div>
          {sessionEdge.length === 0 ? (
            <div className="py-8 text-center text-zinc-600 text-xs">
              No session execution data available.
            </div>
          ) : (
            <div className="space-y-2">
              {sessionEdge.map((s) => (
                <div
                  key={s.name}
                  className="p-2.5 rounded bg-[#09090b] border border-[#1e222d] flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-zinc-200">{s.name}</span>
                    <div className="text-[10px] text-zinc-500">
                      {s.totalTrades} closed • {s.wins}W / {s.losses}L /{" "}
                      {s.breakevens}BE
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`font-bold ${
                        s.netPnL >= 0 ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {s.netPnL >= 0 ? "+" : "-"}$
                      {Math.abs(s.netPnL).toFixed(2)} (
                      {s.netR >= 0
                        ? `+${s.netR.toFixed(1)}R`
                        : `${s.netR.toFixed(1)}R`}
                      )
                    </div>
                    <div className="text-[10px] text-zinc-400">
                      Win Rate:{" "}
                      <span className="text-zinc-200 font-bold">
                        {s.winRate.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Module 2: ICT Setup Model Edge */}
        <div className="rounded-md border border-[#1e222d] bg-[#121318] p-4 space-y-3">
          <div className="flex items-center gap-2 border-b border-[#1e222d] pb-2">
            <Layers className="w-4 h-4 text-zinc-400" />
            <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
              Strategy & Setup Edge
            </h3>
          </div>
          {modelEdge.length === 0 ? (
            <div className="py-8 text-center text-zinc-600 text-xs">
              No strategy setup tags logged. Tag setups in the trade drawer to
              see performance attribution.
            </div>
          ) : (
            <div className="space-y-2">
              {modelEdge.map((m) => (
                <div
                  key={m.name}
                  className="p-2.5 rounded bg-[#09090b] border border-[#1e222d] flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-zinc-200">{m.name}</span>
                    <div className="text-[10px] text-zinc-500">
                      {m.totalTrades} closed • {m.wins}W / {m.losses}L /{" "}
                      {m.breakevens}BE
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`font-bold ${
                        m.netPnL >= 0 ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {m.netPnL >= 0 ? "+" : "-"}$
                      {Math.abs(m.netPnL).toFixed(2)} (
                      {m.netR >= 0
                        ? `+${m.netR.toFixed(1)}R`
                        : `${m.netR.toFixed(1)}R`}
                      )
                    </div>
                    <div className="text-[10px] text-zinc-400">
                      Win Rate:{" "}
                      <span className="text-zinc-200 font-bold">
                        {m.winRate.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
