"use client";

import { useState } from "react";
import {
  ASSETS,
  ASSET_SPECS,
  AssetSymbol,
  TradeDirection,
} from "@/types/trading";
import { calculatePositionSize } from "@/lib/calculations";
import {
  TrendingUp,
  TrendingDown,
  Target,
  ShieldAlert,
  Navigation,
  AlertTriangle,
  Scale,
  DollarSign,
  ArrowUpRight,
} from "lucide-react";

const RISK_PRESETS = [0.25, 0.5, 1.0, 1.5, 2.0] as const;

export function PositionCalculator() {
  const [selectedAsset, setSelectedAsset] = useState<AssetSymbol>("NAS100");
  const [direction, setDirection] = useState<TradeDirection>("long");

  // Capital & Risk state
  const [accountBalance, setAccountBalance] = useState<number>(10000);
  const [riskPercentage, setRiskPercentage] = useState<number>(1.0);

  // Execution Price state initialized from selected asset spec
  const [entryPrice, setEntryPrice] = useState<number>(
    ASSET_SPECS.NAS100.defaultEntry,
  );
  const [stopLossPrice, setStopLossPrice] = useState<number>(
    ASSET_SPECS.NAS100.defaultSl,
  );
  const [takeProfitPrice, setTakeProfitPrice] = useState<number>(
    ASSET_SPECS.NAS100.defaultTp,
  );

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
  const slTicks =
    currentSpec.tickSize > 0 ? Math.round(slDelta / currentSpec.tickSize) : 0;
  const tpTicks =
    currentSpec.tickSize > 0 ? Math.round(tpDelta / currentSpec.tickSize) : 0;

  // Real-time pure position calculation
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

  return (
    <div className="w-full space-y-6">
      {/* 1. Instrument & Direction Header Bar */}
      <div className="p-4 rounded-md border border-[#1e222d] bg-[#121318]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Asset Pills */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                Instrument
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                {currentSpec.category}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {ASSETS.map((asset) => {
                const isSelected = selectedAsset === asset;
                return (
                  <button
                    key={asset}
                    type="button"
                    onClick={() => handleSelectAsset(asset)}
                    className={`px-2.5 py-1 text-xs font-mono rounded-md border transition-all duration-150 ${
                      isSelected
                        ? "bg-zinc-100 text-zinc-950 font-bold border-zinc-100 shadow-sm"
                        : "bg-[#09090b] text-zinc-400 border-[#1e222d] hover:text-zinc-200 hover:border-zinc-700"
                    }`}
                  >
                    {asset}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Direction Toggle */}
          <div className="space-y-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 block">
              Direction
            </span>
            <div className="inline-flex items-center p-1 rounded-md bg-[#09090b] border border-[#1e222d]">
              <button
                type="button"
                onClick={() => setDirection("long")}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-mono font-semibold rounded transition-all duration-150 ${
                  direction === "long"
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                LONG
              </button>
              <button
                type="button"
                onClick={() => setDirection("short")}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-mono font-semibold rounded transition-all duration-150 ${
                  direction === "short"
                    ? "bg-rose-500/15 text-rose-400 border border-rose-500/30 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <TrendingDown className="w-3.5 h-3.5" />
                SHORT
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Capital & Risk Allocation Grid */}
      <div className="p-4 rounded-md border border-[#1e222d] bg-[#121318]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Account Balance */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="account-balance"
                className="text-[11px] font-mono uppercase tracking-wider text-zinc-400"
              >
                Account Balance
              </label>
              <span className="text-[11px] font-mono text-zinc-500">USD</span>
            </div>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-zinc-500 font-mono text-xs pointer-events-none">
                $
              </span>
              <input
                id="account-balance"
                type="number"
                min="0"
                step="500"
                value={accountBalance || ""}
                onChange={(e) =>
                  setAccountBalance(parseFloat(e.target.value) || 0)
                }
                className="w-full pl-7 pr-3 py-2 bg-[#09090b] border border-[#1e222d] text-zinc-100 rounded-md font-mono text-sm tabular-nums focus:border-zinc-500 focus:outline-none transition-colors"
                placeholder="10000"
              />
            </div>
          </div>

          {/* Risk Percentage */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="risk-percentage"
                className="text-[11px] font-mono uppercase tracking-wider text-zinc-400"
              >
                Risk Allocation
              </label>
              <span className="text-[11px] font-mono text-zinc-400">
                Risk Capital:{" "}
                <strong className="text-rose-400 font-semibold tabular-nums">
                  ${result.cashAtRisk.toFixed(2)}
                </strong>
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Quick Select Presets */}
              <div className="flex items-center gap-1">
                {RISK_PRESETS.map((preset) => {
                  const isActive = riskPercentage === preset;
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setRiskPercentage(preset)}
                      className={`px-2 py-2 text-xs font-mono rounded-md border transition-all duration-150 ${
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

              {/* Custom Risk Input */}
              <div className="relative flex-1 flex items-center">
                <input
                  id="risk-percentage"
                  type="number"
                  min="0.01"
                  max="100"
                  step="0.1"
                  value={riskPercentage || ""}
                  onChange={(e) =>
                    setRiskPercentage(parseFloat(e.target.value) || 0)
                  }
                  className="w-full pr-7 pl-3 py-2 bg-[#09090b] border border-[#1e222d] text-zinc-100 rounded-md font-mono text-sm tabular-nums focus:border-zinc-500 focus:outline-none transition-colors text-right"
                  placeholder="1.0"
                />
                <span className="absolute right-3 text-zinc-500 font-mono text-xs pointer-events-none">
                  %
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Execution Prices (Entry, SL, TP) */}
      <div className="p-4 rounded-md border border-[#1e222d] bg-[#121318]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Entry Price */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="entry-price"
                className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-zinc-400"
              >
                <Navigation className="w-3 h-3 text-sky-400" />
                Entry Price
              </label>
              <span className="text-[10px] font-mono text-zinc-500">
                Tick: {currentSpec.tickSize}
              </span>
            </div>
            <input
              id="entry-price"
              type="number"
              step={currentSpec.tickSize}
              value={entryPrice || ""}
              onChange={(e) => setEntryPrice(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-[#09090b] border border-[#1e222d] text-zinc-100 rounded-md font-mono text-sm tabular-nums focus:border-sky-500/60 focus:outline-none transition-colors"
            />
            <div className="text-[11px] font-mono text-zinc-500 flex justify-between">
              <span>Benchmark level</span>
              <span className="text-zinc-400 font-semibold">
                {selectedAsset}
              </span>
            </div>
          </div>

          {/* Stop Loss Price */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="stop-loss"
                className={`flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider ${
                  isSlInvalid ? "text-rose-400 font-semibold" : "text-zinc-400"
                }`}
              >
                <ShieldAlert className="w-3 h-3 text-rose-400" />
                Stop Loss
              </label>
              <span
                className={`text-[10px] font-mono ${
                  isSlInvalid ? "text-rose-400 font-bold" : "text-zinc-500"
                }`}
              >
                {isSlInvalid ? "INVALID SL" : `${slTicks} ticks`}
              </span>
            </div>
            <input
              id="stop-loss"
              type="number"
              step={currentSpec.tickSize}
              value={stopLossPrice || ""}
              onChange={(e) =>
                setStopLossPrice(parseFloat(e.target.value) || 0)
              }
              className={`w-full px-3 py-2 bg-[#09090b] border rounded-md font-mono text-sm tabular-nums focus:outline-none transition-colors ${
                isSlInvalid
                  ? "border-rose-500/50 text-rose-300 focus:border-rose-500"
                  : "border-[#1e222d] text-zinc-100 focus:border-rose-500/60"
              }`}
            />
            <div className="text-[11px] font-mono text-zinc-500 flex justify-between">
              <span>Risk span</span>
              <span className={isSlInvalid ? "text-rose-400" : "text-zinc-400"}>
                Δ {slDelta.toFixed(4)}
              </span>
            </div>
          </div>

          {/* Take Profit Price */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="take-profit"
                className={`flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider ${
                  isTpInvalid ? "text-amber-400 font-semibold" : "text-zinc-400"
                }`}
              >
                <Target className="w-3 h-3 text-emerald-400" />
                Take Profit
              </label>
              <span
                className={`text-[10px] font-mono ${
                  isTpInvalid ? "text-amber-400 font-bold" : "text-zinc-500"
                }`}
              >
                {isTpInvalid ? "INVALID TP" : `${tpTicks} ticks`}
              </span>
            </div>
            <input
              id="take-profit"
              type="number"
              step={currentSpec.tickSize}
              value={takeProfitPrice || ""}
              onChange={(e) =>
                setTakeProfitPrice(parseFloat(e.target.value) || 0)
              }
              className={`w-full px-3 py-2 bg-[#09090b] border rounded-md font-mono text-sm tabular-nums focus:outline-none transition-colors ${
                isTpInvalid
                  ? "border-amber-500/50 text-amber-300 focus:border-amber-500"
                  : "border-[#1e222d] text-zinc-100 focus:border-emerald-500/60"
              }`}
            />
            <div className="text-[11px] font-mono text-zinc-500 flex justify-between">
              <span>Reward span</span>
              <span
                className={isTpInvalid ? "text-amber-400" : "text-zinc-400"}
              >
                Δ {tpDelta.toFixed(4)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Live Results HUD Card */}
      <div className="p-5 rounded-md border border-[#1e222d] bg-[#121318]">
        {!result.isValid ? (
          <div className="flex items-center gap-3 p-3 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 font-mono text-xs">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{result.errorMessage || "Invalid trade geometry."}</span>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-4 pb-4 border-b border-[#1e222d]">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 block mb-1">
                  Recommended Position Size
                </span>
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-mono font-bold text-zinc-100 tracking-tight tabular-nums">
                    {result.positionSize.toFixed(2)}
                  </span>
                  <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                    {positionUnitLabel}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block">
                    Direction
                  </span>
                  <span
                    className={`font-mono text-sm font-bold uppercase ${
                      direction === "long"
                        ? "text-emerald-400"
                        : "text-rose-400"
                    }`}
                  >
                    {direction}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block">
                    Asset
                  </span>
                  <span className="font-mono text-sm font-bold text-zinc-200">
                    {selectedAsset}
                  </span>
                </div>
              </div>
            </div>

            {/* Metrics Breakdown Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 rounded bg-[#09090b] border border-[#1e222d] space-y-1">
                <div className="flex items-center gap-1.5 text-zinc-400">
                  <Scale className="w-3.5 h-3.5 text-sky-400" />
                  <span className="text-[10px] font-mono uppercase tracking-wider">
                    Risk / Reward
                  </span>
                </div>
                <div
                  className={`text-lg font-mono font-bold tabular-nums ${
                    result.riskRewardRatio >= 2
                      ? "text-emerald-400"
                      : result.riskRewardRatio >= 1
                        ? "text-zinc-200"
                        : "text-amber-400"
                  }`}
                >
                  {result.formattedRr}
                </div>
              </div>

              <div className="p-3 rounded bg-[#09090b] border border-[#1e222d] space-y-1">
                <div className="flex items-center gap-1.5 text-zinc-400">
                  <DollarSign className="w-3.5 h-3.5 text-rose-400" />
                  <span className="text-[10px] font-mono uppercase tracking-wider">
                    Total Risk
                  </span>
                </div>
                <div className="text-lg font-mono font-bold text-rose-400 tabular-nums">
                  -${result.cashAtRisk.toFixed(2)}
                </div>
              </div>

              <div className="p-3 rounded bg-[#09090b] border border-[#1e222d] space-y-1">
                <div className="flex items-center gap-1.5 text-zinc-400">
                  <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[10px] font-mono uppercase tracking-wider">
                    Target Return
                  </span>
                </div>
                <div className="text-lg font-mono font-bold text-emerald-400 tabular-nums">
                  +${result.projectedProfit.toFixed(2)}
                </div>
              </div>

              <div className="p-3 rounded bg-[#09090b] border border-[#1e222d] space-y-1">
                <div className="flex items-center gap-1.5 text-zinc-400">
                  <ShieldAlert className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="text-[10px] font-mono uppercase tracking-wider">
                    Stop Distance
                  </span>
                </div>
                <div className="text-lg font-mono font-bold text-zinc-200 tabular-nums">
                  {slTicks}{" "}
                  <span className="text-xs font-normal text-zinc-400">
                    ticks
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
