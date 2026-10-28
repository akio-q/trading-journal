"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { TradeLog, TradingSession } from "@/types/trading";
import { fetchTrades, updateTradeOutcome } from "@/lib/supabase/trades";
import { TradeDrawer } from "@/components/trade-drawer";
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Clock,
  Search,
  Filter,
  ArrowUpDown,
  X,
} from "lucide-react";

const STATUS_OPTIONS: Array<TradeLog["status"]> = ["OPEN", "WIN", "LOSS", "BE"];

const SESSIONS: Array<TradingSession | "Off-Hours"> = [
  "London Session",
  "New York Session",
  "Asian Session",
  "Off-Hours",
];

export function JournalTable() {
  const [trades, setTrades] = useState<TradeLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Selected trade for side drawer
  const [selectedTrade, setSelectedTrade] = useState<TradeLog | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  // Filter & Search States
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [sessionFilter, setSessionFilter] = useState<string>("ALL");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  const loadTrades = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchTrades();
      setTrades(data);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    async function initialFetch() {
      const data = await fetchTrades();
      if (!ignore) {
        setTrades(data);
        setIsLoading(false);
      }
    }

    initialFetch();

    return () => {
      ignore = true;
    };
  }, []);

  const handleStatusChange = async (
    e: React.MouseEvent,
    tradeId: string,
    newStatus: TradeLog["status"],
  ) => {
    e.stopPropagation();
    setUpdatingId(tradeId);

    setTrades((prev) =>
      prev.map((t) => (t.id === tradeId ? { ...t, status: newStatus } : t)),
    );

    const success = await updateTradeOutcome(tradeId, newStatus);
    if (!success) {
      await loadTrades();
    }
    setUpdatingId(null);
  };

  const handleRowClick = (trade: TradeLog) => {
    setSelectedTrade(trade);
    setIsDrawerOpen(true);
  };

  const handleTradeUpdated = (updatedTrade: TradeLog) => {
    setTrades((prev) =>
      prev.map((t) => (t.id === updatedTrade.id ? updatedTrade : t)),
    );
    setSelectedTrade(updatedTrade);
  };

  const handleTradeDeleted = (deletedId: string) => {
    setTrades((prev) => prev.filter((t) => t.id !== deletedId));
    setSelectedTrade(null);
  };

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    statusFilter !== "ALL" ||
    sessionFilter !== "ALL";

  const resetFilters = () => {
    setSearchQuery("");
    setStatusFilter("ALL");
    setSessionFilter("ALL");
  };

  // Filtered and sorted trade list
  const filteredTrades = useMemo(() => {
    return trades
      .filter((trade) => {
        // 1. Text Search (Asset symbol or Notes content)
        if (searchQuery.trim() !== "") {
          const query = searchQuery.toLowerCase();
          const matchesAsset = trade.asset.toLowerCase().includes(query);
          const matchesNotes =
            trade.notes?.toLowerCase().includes(query) ?? false;
          if (!matchesAsset && !matchesNotes) return false;
        }

        // 2. Status / Outcome Filter
        if (statusFilter !== "ALL" && trade.status !== statusFilter) {
          return false;
        }

        // 3. Session / Killzone Filter
        if (sessionFilter !== "ALL") {
          const tradeSession = trade.session ?? "Off-Hours";
          if (tradeSession !== sessionFilter) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(a.createdAt).getTime();
        const timeB = new Date(b.createdAt).getTime();
        return sortOrder === "desc" ? timeB - timeA : timeA - timeB;
      });
  }, [trades, searchQuery, statusFilter, sessionFilter, sortOrder]);

  const formatPrice = (val: number) => {
    return val > 100 ? val.toFixed(2) : val.toFixed(4);
  };

  return (
    <div className="w-full space-y-4">
      {/* Table Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1e222d]">
        <div>
          <h2 className="text-lg font-bold font-mono tracking-tight text-zinc-100">
            Execution Log & Journal
          </h2>
          <p className="text-xs font-mono text-zinc-500">
            Historical trade executions, market sessions, and outcome tracking.
            Click any row for details.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-zinc-500">
            MATCHING:{" "}
            <span className="text-zinc-200 font-bold">
              {filteredTrades.length}
            </span>{" "}
            / {trades.length}
          </span>
          <button
            type="button"
            onClick={loadTrades}
            disabled={isLoading}
            className="p-1.5 rounded border border-[#1e222d] bg-[#121318] text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition-colors disabled:opacity-50 cursor-pointer"
            title="Refresh logs"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* Filter and Search Control Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 font-mono text-xs">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search asset, tag, or note..."
            className="w-full pl-8 pr-3 py-1.5 rounded bg-[#121318] border border-[#1e222d] text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
          />
        </div>

        {/* Outcome Filter */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-1.5 rounded bg-[#121318] border border-[#1e222d] text-zinc-200 focus:outline-none focus:border-zinc-500 cursor-pointer"
          >
            <option value="ALL">Status: All Outcomes</option>
            <option value="OPEN">Status: OPEN</option>
            <option value="WIN">Status: WIN</option>
            <option value="LOSS">Status: LOSS</option>
            <option value="BE">Status: BE</option>
          </select>
        </div>

        {/* Session Filter */}
        <div className="relative">
          <select
            value={sessionFilter}
            onChange={(e) => setSessionFilter(e.target.value)}
            className="w-full px-3 py-1.5 rounded bg-[#121318] border border-[#1e222d] text-zinc-200 focus:outline-none focus:border-zinc-500 cursor-pointer"
          >
            <option value="ALL">Session: All Sessions</option>
            {SESSIONS.map((sess) => (
              <option key={sess} value={sess}>
                {sess}
              </option>
            ))}
          </select>
        </div>

        {/* Sorting & Filter Reset */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"))
            }
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded border border-[#1e222d] bg-[#121318] text-zinc-300 hover:text-zinc-100 hover:border-zinc-700 transition-colors cursor-pointer"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-zinc-500" />
            <span>
              {sortOrder === "desc" ? "Newest First" : "Oldest First"}
            </span>
          </button>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer"
              title="Reset all filters"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Table Container */}
      <div className="rounded-md border border-[#1e222d] bg-[#121318] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-[#1e222d] bg-[#09090b]/60 text-zinc-400 text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4">Date / Session</th>
                <th className="py-3 px-3">Asset</th>
                <th className="py-3 px-3">Dir</th>
                <th className="py-3 px-3 text-right">Entry</th>
                <th className="py-3 px-3 text-right">Stop Loss</th>
                <th className="py-3 px-3 text-right">Take Profit</th>
                <th className="py-3 px-3 text-right">Size</th>
                <th className="py-3 px-3 text-right">Risk ($)</th>
                <th className="py-3 px-3 text-right">Reward ($)</th>
                <th className="py-3 px-3 text-center">R:R</th>
                <th className="py-3 px-4 text-center">Outcome</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e222d]">
              {isLoading ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-zinc-500">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-zinc-400" />
                    Querying Supabase execution logs...
                  </td>
                </tr>
              ) : filteredTrades.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-zinc-500">
                    {hasActiveFilters
                      ? "No trades match the active search or filter criteria."
                      : "No trades logged yet. Calculate and dispatch a setup from the Position Calculator."}
                  </td>
                </tr>
              ) : (
                filteredTrades.map((trade) => {
                  const date = new Date(trade.createdAt);
                  const formattedDate = `${date.getMonth() + 1}/${date.getDate()} ${date
                    .getHours()
                    .toString()
                    .padStart(
                      2,
                      "0",
                    )}:${date.getMinutes().toString().padStart(2, "0")}`;

                  return (
                    <tr
                      key={trade.id}
                      onClick={() => handleRowClick(trade)}
                      className="hover:bg-zinc-900/60 cursor-pointer transition-colors tabular-nums"
                    >
                      {/* Date & Session */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="text-zinc-200 font-semibold">
                          {formattedDate}
                        </div>
                        <div className="text-[10px] text-zinc-500 flex items-center gap-1 mt-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          {trade.session ?? "Off-Hours"}
                        </div>
                      </td>

                      {/* Asset Symbol */}
                      <td className="py-3 px-3 font-bold text-zinc-100 whitespace-nowrap">
                        {trade.asset}
                      </td>

                      {/* Direction */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {trade.direction === "long" ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                            <TrendingUp className="w-3 h-3" /> LONG
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                            <TrendingDown className="w-3 h-3" /> SHORT
                          </span>
                        )}
                      </td>

                      {/* Prices */}
                      <td className="py-3 px-3 text-right text-zinc-200">
                        {formatPrice(trade.entryPrice)}
                      </td>
                      <td className="py-3 px-3 text-right text-rose-400/90">
                        {formatPrice(trade.stopLossPrice)}
                      </td>
                      <td className="py-3 px-3 text-right text-emerald-400/90">
                        {formatPrice(trade.takeProfitPrice)}
                      </td>

                      {/* Size */}
                      <td className="py-3 px-3 text-right font-bold text-zinc-200">
                        {trade.positionSize.toFixed(2)}
                      </td>

                      {/* Cash at Risk */}
                      <td className="py-3 px-3 text-right text-rose-400">
                        -${trade.cashAtRisk.toFixed(2)}
                      </td>

                      {/* Target Profit */}
                      <td className="py-3 px-3 text-right text-emerald-400">
                        +${trade.projectedProfit.toFixed(2)}
                      </td>

                      {/* Risk:Reward */}
                      <td className="py-3 px-3 text-center text-zinc-300 font-semibold">
                        1:{trade.riskRewardRatio.toFixed(2)}
                      </td>

                      {/* Outcome Selector */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div
                          className="inline-flex items-center gap-1 bg-[#09090b] p-1 rounded border border-[#1e222d]"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {STATUS_OPTIONS.map((status) => {
                            const isSelected = trade.status === status;
                            let activeClass =
                              "text-zinc-500 hover:text-zinc-300";

                            if (isSelected) {
                              if (status === "WIN") {
                                activeClass =
                                  "bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/40";
                              } else if (status === "LOSS") {
                                activeClass =
                                  "bg-rose-500/20 text-rose-400 font-bold border border-rose-500/40";
                              } else if (status === "BE") {
                                activeClass =
                                  "bg-amber-500/20 text-amber-400 font-bold border border-amber-500/40";
                              } else {
                                activeClass =
                                  "bg-zinc-800 text-zinc-200 font-bold border border-zinc-700";
                              }
                            }

                            return (
                              <button
                                key={status}
                                type="button"
                                disabled={updatingId === trade.id}
                                onClick={(e) =>
                                  handleStatusChange(e, trade.id, status)
                                }
                                className={`px-2 py-0.5 rounded text-[10px] transition-all cursor-pointer ${activeClass}`}
                              >
                                {status}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Trade Details / Notes Drawer */}
      <TradeDrawer
        trade={selectedTrade}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onTradeUpdated={handleTradeUpdated}
        onTradeDeleted={handleTradeDeleted}
      />
    </div>
  );
}
