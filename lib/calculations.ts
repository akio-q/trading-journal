import { AssetSpec, TradeDirection } from "@/types/trading";

export interface CalculationInput {
  accountBalance: number;
  riskPercentage: number;
  entryPrice: number;
  stopLossPrice: number;
  takeProfitPrice: number;
  direction: TradeDirection;
  spec: AssetSpec;
}

export interface CalculationResult {
  isValid: boolean;
  errorMessage?: string;
  cashAtRisk: number;
  positionSize: number; // Lots or contracts
  stopLossDistance: number; // Absolute price difference
  takeProfitDistance: number;
  riskRewardRatio: number; // e.g. 2.5
  formattedRr: string; // e.g. "1:2.50"
  projectedProfit: number; // Potential return in USD
}

export function calculatePositionSize(
  input: CalculationInput,
): CalculationResult {
  const {
    accountBalance,
    riskPercentage,
    entryPrice,
    stopLossPrice,
    takeProfitPrice,
    direction,
    spec,
  } = input;

  // 1. Initial sanity checks
  if (accountBalance <= 0 || riskPercentage <= 0 || entryPrice <= 0) {
    return {
      isValid: false,
      errorMessage:
        "Balance, risk percentage, and entry price must be greater than zero.",
      cashAtRisk: 0,
      positionSize: 0,
      stopLossDistance: 0,
      takeProfitDistance: 0,
      riskRewardRatio: 0,
      formattedRr: "1:0.00",
      projectedProfit: 0,
    };
  }

  // 2. Validate Stop Loss based on trade direction
  if (direction === "long" && stopLossPrice >= entryPrice) {
    return {
      isValid: false,
      errorMessage:
        "For a Long trade, Stop Loss must be strictly below Entry Price.",
      cashAtRisk: 0,
      positionSize: 0,
      stopLossDistance: 0,
      takeProfitDistance: 0,
      riskRewardRatio: 0,
      formattedRr: "1:0.00",
      projectedProfit: 0,
    };
  }

  if (direction === "short" && stopLossPrice <= entryPrice) {
    return {
      isValid: false,
      errorMessage:
        "For a Short trade, Stop Loss must be strictly above Entry Price.",
      cashAtRisk: 0,
      positionSize: 0,
      stopLossDistance: 0,
      takeProfitDistance: 0,
      riskRewardRatio: 0,
      formattedRr: "1:0.00",
      projectedProfit: 0,
    };
  }

  // 3. Compute risk amount
  const cashAtRisk = accountBalance * (riskPercentage / 100);

  // 4. Compute distances
  const stopLossDistance = Math.abs(entryPrice - stopLossPrice);
  const takeProfitDistance = Math.abs(takeProfitPrice - entryPrice);

  if (stopLossDistance === 0 || spec.tickSize <= 0 || spec.tickValue <= 0) {
    return {
      isValid: false,
      errorMessage: "Invalid stop distance or instrument tick parameters.",
      cashAtRisk,
      positionSize: 0,
      stopLossDistance,
      takeProfitDistance,
      riskRewardRatio: 0,
      formattedRr: "1:0.00",
      projectedProfit: 0,
    };
  }

  // 5. Position sizing math
  const ticksAtRisk = stopLossDistance / spec.tickSize;
  const rawPositionSize = cashAtRisk / (ticksAtRisk * spec.tickValue);

  // Precision formatting: 2 decimals for lots/contracts
  const positionSize = Math.max(0.01, Math.round(rawPositionSize * 100) / 100);

  // 6. Risk-to-Reward calculation
  const riskRewardRatio = takeProfitDistance / stopLossDistance;
  const projectedProfit = cashAtRisk * riskRewardRatio;

  return {
    isValid: true,
    cashAtRisk: Math.round(cashAtRisk * 100) / 100,
    positionSize,
    stopLossDistance: Math.round(stopLossDistance * 100000) / 100000,
    takeProfitDistance: Math.round(takeProfitDistance * 100000) / 100000,
    riskRewardRatio: Math.round(riskRewardRatio * 100) / 100,
    formattedRr: `1:${riskRewardRatio.toFixed(2)}`,
    projectedProfit: Math.round(projectedProfit * 100) / 100,
  };
}
