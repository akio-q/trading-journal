"use client";

import { useState } from "react";
import {
  ASSETS,
  ASSET_SPECS,
  AssetSymbol,
  TradeDirection,
} from "@/types/trading";
import { TrendingUp, TrendingDown } from "lucide-react";

export function PositionCalculator() {
  const [selectedAsset, setSelectedAsset] = useState<AssetSymbol>("NAS100");
  const [direction, setDirection] = useState<TradeDirection>("long");

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

  return (
    <div className="w-full space-y-6">
      {/* Instrument & Direction Header Bar */}
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

        {/* Temporary debug info for testing prices */}
        <div className="mt-4 pt-3 border-t border-[#1e222d] flex items-center gap-4 text-[11px] font-mono text-zinc-500">
          <span>
            Active: <strong className="text-zinc-300">{selectedAsset}</strong> (
            {currentSpec.name})
          </span>
          <span>
            Entry: <strong className="text-zinc-300">{entryPrice}</strong>
          </span>
          <span>
            SL: <strong className="text-zinc-300">{stopLossPrice}</strong>
          </span>
          <span>
            TP: <strong className="text-zinc-300">{takeProfitPrice}</strong>
          </span>
        </div>
      </div>
    </div>
  );
}
