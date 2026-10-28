"use client";

import { useId } from "react";
import { EquityPoint } from "@/lib/analytics";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";

interface EquityChartProps {
  data: EquityPoint[];
}

export function EquityChart({ data }: EquityChartProps) {
  const gradientId = useId();

  if (data.length <= 1) {
    return (
      <div className="h-64 rounded-md border border-[#1e222d] bg-[#121318] flex flex-col items-center justify-center text-zinc-500 font-mono text-xs space-y-2">
        <DollarSign className="w-6 h-6 text-zinc-600" />
        <span>No closed trade history available for equity curve.</span>
        <span className="text-[10px] text-zinc-600">
          Mark logged trades as WIN, LOSS, or BE in the journal to view
          cumulative performance.
        </span>
      </div>
    );
  }

  // Virtual SVG coordinate space
  const width = 800;
  const height = 260;
  const paddingX = 40;
  const paddingY = 30;

  const pnlValues = data.map((d) => d.cumulativePnL);
  const minPnL = Math.min(0, ...pnlValues);
  const maxPnL = Math.max(0, ...pnlValues);
  const pnlRange = maxPnL - minPnL || 1;

  // Coordinate projections
  const getX = (index: number) => {
    return paddingX + (index / (data.length - 1)) * (width - paddingX * 2);
  };

  const getY = (val: number) => {
    return (
      height - paddingY - ((val - minPnL) / pnlRange) * (height - paddingY * 2)
    );
  };

  const zeroY = getY(0);

  // Line path definition
  const points = data.map((d, i) => `${getX(i)},${getY(d.cumulativePnL)}`);
  const pathD = `M ${points.join(" L ")}`;

  // Closed area polygon under the path down to the zero baseline
  const areaD = `${pathD} L ${getX(data.length - 1)},${zeroY} L ${getX(0)},${zeroY} Z`;

  const finalPnL = data[data.length - 1].cumulativePnL;
  const isPositive = finalPnL >= 0;
  const strokeColor = isPositive ? "#10b981" : "#f43f5e";
  const fillColor = isPositive ? "#10b981" : "#f43f5e";

  return (
    <div className="w-full rounded-md border border-[#1e222d] bg-[#121318] p-4 font-mono space-y-3">
      {/* Chart Summary HUD Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#1e222d] pb-2 text-xs gap-2">
        <div className="flex items-center gap-2">
          <span className="text-zinc-400 font-bold uppercase tracking-wider text-[11px]">
            Cumulative Equity Trajectory
          </span>
          <span className="text-zinc-600">•</span>
          <span className="text-zinc-500 text-[10px]">
            {data.length - 1} Closed Executions
          </span>
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <div>
            <span className="text-zinc-500 mr-1.5">PEAK:</span>
            <span className="text-emerald-400 font-bold">
              +${maxPnL.toFixed(2)}
            </span>
          </div>
          <div>
            <span className="text-zinc-500 mr-1.5">LOW:</span>
            <span className="text-rose-400 font-bold">
              {minPnL < 0 ? `-$${Math.abs(minPnL).toFixed(2)}` : "$0.00"}
            </span>
          </div>
          <div className="flex items-center gap-1 font-bold">
            <span className="text-zinc-500">NET:</span>
            {isPositive ? (
              <span className="text-emerald-400 inline-flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" /> +${finalPnL.toFixed(2)}
              </span>
            ) : (
              <span className="text-rose-400 inline-flex items-center gap-0.5">
                <TrendingDown className="w-3 h-3" /> -$
                {Math.abs(finalPnL).toFixed(2)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* SVG Viewport */}
      <div className="w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-56 select-none overflow-visible"
        >
          <defs>
            <linearGradient
              id={`grad-${gradientId}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor={fillColor} stopOpacity="0.25" />
              <stop offset="100%" stopColor={fillColor} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Zero baseline */}
          <line
            x1={paddingX}
            y1={zeroY}
            x2={width - paddingX}
            y2={zeroY}
            stroke="#27272a"
            strokeDasharray="4 4"
            strokeWidth="1.5"
          />
          <text
            x={paddingX - 6}
            y={zeroY + 3}
            fill="#71717a"
            fontSize="10"
            textAnchor="end"
            fontFamily="monospace"
          >
            $0
          </text>

          {/* Value boundary labels */}
          <text
            x={paddingX - 6}
            y={getY(maxPnL) + 3}
            fill="#71717a"
            fontSize="9"
            textAnchor="end"
            fontFamily="monospace"
          >
            +${maxPnL.toFixed(0)}
          </text>
          {minPnL < 0 && (
            <text
              x={paddingX - 6}
              y={getY(minPnL) + 3}
              fill="#71717a"
              fontSize="9"
              textAnchor="end"
              fontFamily="monospace"
            >
              -${Math.abs(minPnL).toFixed(0)}
            </text>
          )}

          {/* Gradient area fill */}
          <path d={areaD} fill={`url(#grad-${gradientId})`} />

          {/* Main equity path */}
          <path
            d={pathD}
            fill="none"
            stroke={strokeColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Interactive trade nodes */}
          {data.map((d, i) => {
            if (i === 0) return null; // Skip origin node
            const cx = getX(i);
            const cy = getY(d.cumulativePnL);
            const isWin = d.realizedPnL > 0;

            return (
              <circle
                key={d.tradeId + i}
                cx={cx}
                cy={cy}
                r="3"
                fill={isWin ? "#10b981" : "#f43f5e"}
                stroke="#09090b"
                strokeWidth="1.5"
                className="hover:r-5 transition-all cursor-pointer"
              >
                <title>{`Trade #${d.tradeNumber} (${d.asset}): ${
                  d.realizedPnL >= 0 ? "+" : ""
                }$${d.realizedPnL.toFixed(2)} (Total: $${d.cumulativePnL.toFixed(2)})`}</title>
              </circle>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
