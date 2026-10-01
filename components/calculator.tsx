"use client";

import { useState } from "react";
import {
  ASSETS,
  ASSET_SPECS,
  AssetSymbol,
  TradeDirection,
} from "@/types/trading";
import { TrendingUp, TrendingDown } from "lucide-react";

const RISK_PRESETS = [0.25, 0.5, 1.0, 1.5, 2.0] as const;

export function PositionCalculator() {
  const [selectedAsset, setSelectedAsset] = useState<AssetSymbol>("NAS100");
  const [direction, setDirection] = useState<TradeDirection>("long");

  // Capital & Risk state
  const [accountBalance, setAccountBalance] = useState<number>(10000);
  const [riskPercentage, setRiskPercentage] = useState<number>(1.0);

  // Benchmark prices initialized from the selected asset spec
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
  const cashAtRiskPreview = (accountBalance * (riskPercentage / 100)).toFixed(
    2,
  );

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
                  ${cashAtRiskPreview}
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
    </div>
  );
}
