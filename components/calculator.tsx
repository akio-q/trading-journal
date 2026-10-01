"use client";

import { useState } from "react";
import {
  ASSETS,
  ASSET_SPECS,
  AssetSymbol,
  TradeDirection,
  TradeLog,
} from "@/types/trading";
import { calculatePositionSize } from "@/lib/calculations";
import {
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  BookOpenCheck,
} from "lucide-react";

const RISK_PRESETS = [0.25, 0.5, 1.0, 1.5, 2.0] as const;

export type LogTradePayload = Omit<TradeLog, "id" | "createdAt" | "status">;

interface PositionCalculatorProps {
  onLogTrade?: (trade: LogTradePayload) => void;
}

export function PositionCalculator({ onLogTrade }: PositionCalculatorProps) {
  const [selectedAsset, setSelectedAsset] = useState<AssetSymbol>("NAS100");
  const [direction, setDirection] = useState<TradeDirection>("long");

  // Equity & Sizing Model State
  const [accountBalance, setAccountBalance] = useState<number>(25000);
  const [riskPercentage, setRiskPercentage] = useState<number>(1.0);

  // Execution Price State
  const [entryPrice, setEntryPrice] = useState<number>(
    ASSET_SPECS.NAS100.defaultEntry,
  );
  const [stopLossPrice, setStopLossPrice] = useState<number>(
    ASSET_SPECS.NAS100.defaultSl,
  );
  const [takeProfitPrice, setTakeProfitPrice] = useState<number>(
    ASSET_SPECS.NAS100.defaultTp,
  );

  const [lastLoggedAt, setLastLoggedAt] = useState<string | null>(null);

  const handleSelectAsset = (asset: AssetSymbol) => {
    setSelectedAsset(asset);
    const spec = ASSET_SPECS[asset];
    setEntryPrice(spec.defaultEntry);
    setStopLossPrice(spec.defaultSl);
    setTakeProfitPrice(spec.defaultTp);
  };

  const currentSpec = ASSET_SPECS[selectedAsset];

  // Derived price validation
  const isSlInvalid =
    direction === "long"
      ? stopLossPrice >= entryPrice
      : stopLossPrice <= entryPrice;

  const isTpInvalid =
    direction === "long"
      ? takeProfitPrice <= entryPrice
      : takeProfitPrice >= entryPrice;

  const slDelta = Math.abs(entryPrice - stopLossPrice);
  const tpDelta = Math.abs(takeProfitPrice - entryPrice);

  // Real-time calculation engine
  const result = calculatePositionSize({
    accountBalance,
    riskPercentage,
    entryPrice,
    stopLossPrice,
    takeProfitPrice,
    direction,
    spec: currentSpec,
  });

  const positionUnitLabel =
    currentSpec.category === "Indices" ? "CONTRACTS" : "LOTS";

  const handleLogTrade = () => {
    if (!result.isValid) return;

    const payload: LogTradePayload = {
      asset: selectedAsset,
      direction,
      entryPrice,
      stopLossPrice,
      takeProfitPrice,
      positionSize: result.positionSize,
      riskPercentage,
      cashAtRisk: result.cashAtRisk,
      projectedProfit: result.projectedProfit,
      riskRewardRatio: result.riskRewardRatio,
    };

    if (onLogTrade) {
      onLogTrade(payload);
    }

    setLastLoggedAt(new Date().toLocaleTimeString());
  };

  return (
    <div className="w-full space-y-6">
      {/* Page Title & Subtitle Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#1e222d]">
        <div>
          <h1 className="text-xl font-bold font-mono tracking-tight text-zinc-100">
            Position Sizing & Risk Terminal
          </h1>
          <p className="text-xs font-mono text-zinc-500 mt-0.5">
            Precision contract calculation based on tick variance and account
            equity allocation.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
            MODE:
          </span>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            ICT EXECUTION
          </span>
        </div>
      </div>

      {/* Main 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Input Control Cards (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* 01 // ASSET CLASS & EXECUTION */}
          <div className="p-4 rounded-md border border-[#1e222d] bg-[#121318] space-y-4">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-400 font-bold tracking-wider">
                01 // ASSET CLASS & EXECUTION
              </span>
              <span className="text-zinc-500">{currentSpec.category}</span>
            </div>

            {/* Asset Selector Pills */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {ASSETS.map((asset) => {
                const isSelected = selectedAsset === asset;
                return (
                  <button
                    key={asset}
                    type="button"
                    onClick={() => handleSelectAsset(asset)}
                    className={`py-2 px-1 text-xs font-mono font-bold rounded border transition-all text-center ${
                      isSelected
                        ? "bg-zinc-100 text-zinc-950 border-zinc-100 shadow"
                        : "bg-[#09090b] text-zinc-400 border-[#1e222d] hover:text-zinc-200 hover:border-zinc-700"
                    }`}
                  >
                    {asset}
                  </button>
                );
              })}
            </div>

            {/* Direction Split Bar */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setDirection("long")}
                className={`flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-mono font-bold rounded border transition-all ${
                  direction === "long"
                    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/40 shadow-sm"
                    : "bg-[#09090b] text-zinc-500 border-[#1e222d] hover:text-zinc-300"
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                LONG (BUY)
              </button>
              <button
                type="button"
                onClick={() => setDirection("short")}
                className={`flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-mono font-bold rounded border transition-all ${
                  direction === "short"
                    ? "bg-rose-500/15 text-rose-400 border-rose-500/40 shadow-sm"
                    : "bg-[#09090b] text-zinc-500 border-[#1e222d] hover:text-zinc-300"
                }`}
              >
                <TrendingDown className="w-3.5 h-3.5" />
                SHORT (SELL)
              </button>
            </div>
          </div>

          {/* 02 // EQUITY & SIZING MODEL */}
          <div className="p-4 rounded-md border border-[#1e222d] bg-[#121318] space-y-4">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-400 font-bold tracking-wider">
                02 // EQUITY & SIZING MODEL
              </span>
              <span className="text-zinc-500">FIXED FRACTIONAL</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Account Balance */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                  <span>ACCOUNT BALANCE</span>
                  <span className="text-zinc-500">USD</span>
                </div>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-zinc-500 font-mono text-xs pointer-events-none">
                    $
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={accountBalance || ""}
                    onChange={(e) =>
                      setAccountBalance(parseFloat(e.target.value) || 0)
                    }
                    className="w-full pl-7 pr-3 py-2 bg-[#09090b] border border-[#1e222d] text-zinc-100 rounded font-mono text-sm tabular-nums focus:border-zinc-500 focus:outline-none"
                    placeholder="25000"
                  />
                </div>
              </div>

              {/* Risk Percentage */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                  <span>RISK PERCENTAGE</span>
                  <span className="text-zinc-500">{riskPercentage}%</span>
                </div>
                <div className="relative flex items-center">
                  <input
                    type="number"
                    min="0.01"
                    max="100"
                    step="0.1"
                    value={riskPercentage || ""}
                    onChange={(e) =>
                      setRiskPercentage(parseFloat(e.target.value) || 0)
                    }
                    className="w-full pr-7 pl-3 py-2 bg-[#09090b] border border-[#1e222d] text-zinc-100 rounded font-mono text-sm tabular-nums focus:border-zinc-500 focus:outline-none"
                    placeholder="1"
                  />
                  <span className="absolute right-3 text-zinc-500 font-mono text-xs pointer-events-none">
                    %
                  </span>
                </div>
              </div>
            </div>

            {/* Risk Presets Row */}
            <div className="flex items-center gap-2 pt-1 text-xs font-mono">
              <span className="text-zinc-500 text-[11px]">PILLS:</span>
              <div className="flex flex-wrap items-center gap-1.5">
                {RISK_PRESETS.map((preset) => {
                  const isActive = riskPercentage === preset;
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setRiskPercentage(preset)}
                      className={`px-2.5 py-1 text-xs font-mono rounded border transition-all ${
                        isActive
                          ? "bg-zinc-800 text-zinc-100 border-zinc-600 font-semibold"
                          : "bg-[#09090b] text-zinc-400 border-[#1e222d] hover:text-zinc-200 hover:border-zinc-700"
                      }`}
                    >
                      {preset}%
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 03 // EXECUTION PRICE LEVELS */}
          <div className="p-4 rounded-md border border-[#1e222d] bg-[#121318] space-y-4">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-400 font-bold tracking-wider">
                03 // EXECUTION PRICE LEVELS
              </span>
              <span className="text-zinc-500">STOP LOSS & TP</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Entry */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-mono text-zinc-400 block">
                  ENTRY PRICE
                </span>
                <input
                  type="number"
                  step={currentSpec.tickSize}
                  value={entryPrice || ""}
                  onChange={(e) =>
                    setEntryPrice(parseFloat(e.target.value) || 0)
                  }
                  className="w-full px-3 py-2 bg-[#09090b] border border-[#1e222d] text-zinc-100 rounded font-mono text-sm tabular-nums focus:border-zinc-500 focus:outline-none"
                />
              </div>

              {/* Stop Loss */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span
                    className={
                      isSlInvalid ? "text-rose-400 font-bold" : "text-rose-400"
                    }
                  >
                    STOP LOSS
                  </span>
                  <span className="text-[10px] text-zinc-500">
                    {direction === "long" ? "BELOW ENTRY" : "ABOVE ENTRY"}
                  </span>
                </div>
                <input
                  type="number"
                  step={currentSpec.tickSize}
                  value={stopLossPrice || ""}
                  onChange={(e) =>
                    setStopLossPrice(parseFloat(e.target.value) || 0)
                  }
                  className={`w-full px-3 py-2 bg-[#09090b] border rounded font-mono text-sm tabular-nums focus:outline-none ${
                    isSlInvalid
                      ? "border-rose-500/50 text-rose-300"
                      : "border-[#1e222d] text-zinc-100 focus:border-zinc-500"
                  }`}
                />
              </div>

              {/* Take Profit */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span
                    className={
                      isTpInvalid
                        ? "text-emerald-400 font-bold"
                        : "text-emerald-400"
                    }
                  >
                    TAKE PROFIT
                  </span>
                  <span className="text-[10px] text-zinc-500">
                    {direction === "long" ? "ABOVE ENTRY" : "BELOW ENTRY"}
                  </span>
                </div>
                <input
                  type="number"
                  step={currentSpec.tickSize}
                  value={takeProfitPrice || ""}
                  onChange={(e) =>
                    setTakeProfitPrice(parseFloat(e.target.value) || 0)
                  }
                  className={`w-full px-3 py-2 bg-[#09090b] border rounded font-mono text-sm tabular-nums focus:outline-none ${
                    isTpInvalid
                      ? "border-amber-500/50 text-amber-300"
                      : "border-[#1e222d] text-zinc-100 focus:border-zinc-500"
                  }`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Calculated Execution Sizing HUD (5 cols) */}
        <div className="lg:col-span-5">
          <div className="p-5 rounded-md border border-[#1e222d] bg-[#121318] space-y-6 lg:sticky lg:top-6">
            {/* HUD Header */}
            <div className="flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-zinc-200 tracking-wider">
                  CALCULATED EXECUTION SIZING
                </span>
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                LIVE METRIC
              </span>
            </div>

            {!result.isValid ? (
              <div className="p-4 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 font-mono text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold">
                  <AlertTriangle className="w-4 h-4" />
                  <span>INVALID TRADE GEOMETRY</span>
                </div>
                <p className="text-zinc-400">{result.errorMessage}</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Big Sizing Display */}
                <div className="space-y-1">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 block">
                    RECOMMENDED POSITION SIZE
                  </span>
                  <div className="flex items-baseline gap-3">
                    <span className="text-5xl font-mono font-bold text-zinc-100 tracking-tight tabular-nums">
                      {result.positionSize.toFixed(2)}
                    </span>
                    <span className="text-sm font-mono font-semibold text-zinc-400">
                      {positionUnitLabel}
                    </span>
                  </div>
                  <div className="text-xs font-mono text-zinc-500 flex justify-between pt-1">
                    <span>SL Risk Distance:</span>
                    <span className="text-zinc-300 font-semibold tabular-nums">
                      {slDelta.toFixed(2)} Pts
                    </span>
                  </div>
                </div>

                {/* 2x2 Metric Matrix */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Total Risk */}
                  <div className="p-3 rounded bg-[#09090b] border border-[#1e222d] space-y-1">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">
                      TOTAL RISK ($)
                    </span>
                    <div className="text-lg font-mono font-bold text-rose-400 tabular-nums">
                      -${result.cashAtRisk.toFixed(2)}
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500 block">
                      {riskPercentage}% Account Equity
                    </span>
                  </div>

                  {/* Target Reward */}
                  <div className="p-3 rounded bg-[#09090b] border border-[#1e222d] space-y-1">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">
                      TARGET REWARD ($)
                    </span>
                    <div className="text-lg font-mono font-bold text-emerald-400 tabular-nums">
                      +${result.projectedProfit.toFixed(2)}
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500 block">
                      {(riskPercentage * result.riskRewardRatio).toFixed(2)}%
                      Account Equity
                    </span>
                  </div>

                  {/* Risk-To-Reward */}
                  <div className="p-3 rounded bg-[#09090b] border border-[#1e222d] space-y-1">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">
                      RISK-TO-REWARD
                    </span>
                    <div className="text-lg font-mono font-bold text-zinc-100 tabular-nums">
                      1 : {result.riskRewardRatio.toFixed(2)}
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 block">
                      {result.riskRewardRatio >= 2
                        ? "Favorable R:R"
                        : "Sub-optimal R:R"}
                    </span>
                  </div>

                  {/* Target Distance */}
                  <div className="p-3 rounded bg-[#09090b] border border-[#1e222d] space-y-1">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">
                      TARGET DISTANCE
                    </span>
                    <div className="text-lg font-mono font-bold text-zinc-100 tabular-nums">
                      {tpDelta.toFixed(2)}
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500 block">
                      Pts to Target
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Execution / Log Action Button */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                disabled={!result.isValid}
                onClick={handleLogTrade}
                className={`w-full py-3 px-4 rounded font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                  result.isValid
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 hover:bg-emerald-500/30 active:scale-[0.99] cursor-pointer"
                    : "bg-zinc-900 text-zinc-600 border border-[#1e222d] cursor-not-allowed opacity-60"
                }`}
              >
                <BookOpenCheck className="w-4 h-4" />
                LOG POSITION TO JOURNAL
              </button>

              <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500 px-1">
                <span>STATUS:</span>
                {lastLoggedAt ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    LOGGED AT {lastLoggedAt}
                  </span>
                ) : !result.isValid ? (
                  <span className="text-rose-400 font-semibold">
                    EXECUTION BLOCKED
                  </span>
                ) : (
                  <span className="text-emerald-400 font-semibold">
                    READY FOR DISPATCH
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
