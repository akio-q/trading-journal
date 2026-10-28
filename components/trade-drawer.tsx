"use client";

import { useState, useMemo } from "react";
import { TradeLog } from "@/types/trading";
import { updateTradeNotes, deleteTrade } from "@/lib/supabase/trades";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  TrendingUp,
  TrendingDown,
  Trash2,
  Save,
  Check,
  Tag,
  Clock,
  Shield,
  Target,
  Plus,
} from "lucide-react";

const DEFAULT_STRATEGY_TAGS = [
  "Breakout",
  "Retest / Pullback",
  "Trend Continuation",
  "Reversal",
  "Supply & Demand",
  "Liquidity Sweep",
  "Fair Value Gap",
] as const;

interface TradeDrawerProps {
  trade: TradeLog | null;
  isOpen: boolean;
  onClose: () => void;
  onTradeUpdated: (updatedTrade: TradeLog) => void;
  onTradeDeleted: (tradeId: string) => void;
}

interface TradeDrawerFormProps {
  trade: TradeLog;
  onClose: () => void;
  onTradeUpdated: (updatedTrade: TradeLog) => void;
  onTradeDeleted: (tradeId: string) => void;
}

function TradeDrawerContent({
  trade,
  onClose,
  onTradeUpdated,
  onTradeDeleted,
}: TradeDrawerFormProps) {
  const [notes, setNotes] = useState<string>(trade.notes ?? "");
  const [customTagInput, setCustomTagInput] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // Extract all [#Tag] patterns currently present in the trade notes
  const activeTagsInNotes = useMemo(() => {
    const regex = /\[#([^\]]+)\]/g;
    return Array.from(notes.matchAll(regex), (m) => m[1]);
  }, [notes]);

  // Combine default presets with any unique custom tags saved in notes
  const allAvailableTags = useMemo(() => {
    const combined = new Set<string>(DEFAULT_STRATEGY_TAGS);
    activeTagsInNotes.forEach((tag) => combined.add(tag));
    return Array.from(combined);
  }, [activeTagsInNotes]);

  const handleSaveNotes = async () => {
    setIsSaving(true);
    const success = await updateTradeNotes(trade.id, notes);
    setIsSaving(false);

    if (success) {
      setSavedSuccess(true);
      onTradeUpdated({ ...trade, notes });
      setTimeout(() => setSavedSuccess(false), 2000);
    }
  };

  const handleToggleTag = async (tag: string) => {
    const tagString = `[#${tag}]`;
    let newNotes = "";

    if (notes.includes(tagString)) {
      newNotes = notes.replace(tagString, "").replace(/\s+/g, " ").trim();
    } else {
      newNotes = notes ? `${tagString} ${notes}` : tagString;
    }

    setNotes(newNotes);
    onTradeUpdated({ ...trade, notes: newNotes });
    await updateTradeNotes(trade.id, newNotes);
  };

  const handleAddCustomTag = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTag = customTagInput.trim().replace(/[\[\]#]/g, "");
    if (!cleanTag) return;

    if (!notes.includes(`[#${cleanTag}]`)) {
      await handleToggleTag(cleanTag);
    }
    setCustomTagInput("");
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this trade permanently from journal?")) return;

    setIsDeleting(true);
    const success = await deleteTrade(trade.id);
    setIsDeleting(false);

    if (success) {
      onTradeDeleted(trade.id);
      onClose();
    }
  };

  const formattedDate = new Date(trade.createdAt).toLocaleString();

  return (
    <>
      <SheetHeader className="text-left pb-4 border-b border-[#1e222d] space-y-1">
        <div className="flex items-center justify-between">
          <SheetTitle className="text-base font-bold text-zinc-100 flex items-center gap-2">
            <span>{trade.asset}</span>
            {trade.direction === "long" ? (
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30">
                <TrendingUp className="w-3 h-3" /> LONG
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/30">
                <TrendingDown className="w-3 h-3" /> SHORT
              </span>
            )}
          </SheetTitle>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
              trade.status === "WIN"
                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                : trade.status === "LOSS"
                  ? "bg-rose-500/15 text-rose-400 border-rose-500/30"
                  : trade.status === "BE"
                    ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                    : "bg-zinc-800 text-zinc-300 border-zinc-700"
            }`}
          >
            STATUS: {trade.status}
          </span>
        </div>
        <SheetDescription className="text-zinc-500 text-xs flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {formattedDate} {trade.session ? `• ${trade.session}` : ""}
        </SheetDescription>
      </SheetHeader>

      {/* Execution Geometry HUD */}
      <div className="py-4 space-y-3">
        <span className="text-[11px] text-zinc-500 uppercase tracking-wider block font-bold">
          Execution Geometry
        </span>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="p-2.5 rounded bg-[#09090b] border border-[#1e222d]">
            <span className="text-[10px] text-zinc-500 block">ENTRY</span>
            <span className="text-zinc-200 font-bold">{trade.entryPrice}</span>
          </div>
          <div className="p-2.5 rounded bg-[#09090b] border border-[#1e222d]">
            <span className="text-[10px] text-rose-400/80 block">
              STOP LOSS
            </span>
            <span className="text-rose-400 font-bold">
              {trade.stopLossPrice}
            </span>
          </div>
          <div className="p-2.5 rounded bg-[#09090b] border border-[#1e222d]">
            <span className="text-[10px] text-emerald-400/80 block">
              TAKE PROFIT
            </span>
            <span className="text-emerald-400 font-bold">
              {trade.takeProfitPrice}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="p-2.5 rounded bg-[#09090b] border border-[#1e222d]">
            <span className="text-[10px] text-zinc-500 block">SIZE</span>
            <span className="text-zinc-200 font-bold">
              {trade.positionSize.toFixed(2)}
            </span>
          </div>
          <div className="p-2.5 rounded bg-[#09090b] border border-[#1e222d]">
            <span className="text-[10px] text-rose-400/80 block flex items-center gap-0.5">
              <Shield className="w-2.5 h-2.5" /> RISK ($)
            </span>
            <span className="text-rose-400 font-bold">
              -${trade.cashAtRisk.toFixed(2)}
            </span>
          </div>
          <div className="p-2.5 rounded bg-[#09090b] border border-[#1e222d]">
            <span className="text-[10px] text-emerald-400/80 block flex items-center gap-0.5">
              <Target className="w-2.5 h-2.5" /> REWARD ($)
            </span>
            <span className="text-emerald-400 font-bold">
              +${trade.projectedProfit.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Dynamic Strategy & Setup Tags */}
      <div className="py-2 space-y-2 border-t border-[#1e222d]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 font-bold">
            <Tag className="w-3 h-3 text-zinc-500" />
            <span>STRATEGY & SETUP TAGS</span>
          </div>
        </div>

        {/* Tag Chips */}
        <div className="flex flex-wrap gap-1.5">
          {allAvailableTags.map((tag) => {
            const isActive = notes.includes(`[#${tag}]`);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => handleToggleTag(tag)}
                className={`text-[10px] px-2 py-1 rounded border transition-colors cursor-pointer ${
                  isActive
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-semibold"
                    : "bg-[#09090b] text-zinc-400 border-[#1e222d] hover:text-zinc-200 hover:border-zinc-700"
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>

        {/* Custom Tag Input Form */}
        <form
          onSubmit={handleAddCustomTag}
          className="flex items-center gap-1.5 pt-1"
        >
          <input
            type="text"
            value={customTagInput}
            onChange={(e) => setCustomTagInput(e.target.value)}
            placeholder="Add custom setup tag..."
            className="flex-1 px-2.5 py-1 text-[11px] rounded bg-[#09090b] border border-[#1e222d] text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 font-mono"
          />
          <button
            type="submit"
            disabled={!customTagInput.trim()}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] rounded bg-zinc-800 text-zinc-200 border border-zinc-700 hover:bg-zinc-700 disabled:opacity-40 cursor-pointer transition-colors"
          >
            <Plus className="w-3 h-3" />
            <span>Add</span>
          </button>
        </form>
      </div>

      {/* Trade Log Notes */}
      <div className="py-4 space-y-2 border-t border-[#1e222d]">
        <label className="text-[11px] text-zinc-400 font-bold block">
          TRADE LOG NOTES & CONFLUENCES
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={5}
          placeholder="Document setup reasoning, execution errors, or mental state..."
          className="w-full p-3 rounded bg-[#09090b] border border-[#1e222d] text-zinc-200 text-xs font-mono placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 resize-none leading-relaxed"
        />
        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={handleSaveNotes}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold bg-zinc-800 text-zinc-200 border border-zinc-700 hover:bg-zinc-700 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
          >
            {savedSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                SAVED
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5 text-zinc-400" />
                {isSaving ? "SAVING..." : "SAVE NOTES"}
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="inline-flex items-center gap-1 text-xs text-rose-400/80 hover:text-rose-400 hover:bg-rose-500/10 px-2 py-1 rounded transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {isDeleting ? "DELETING..." : "DELETE TRADE"}
          </button>
        </div>
      </div>
    </>
  );
}

export function TradeDrawer({
  trade,
  isOpen,
  onClose,
  onTradeUpdated,
  onTradeDeleted,
}: TradeDrawerProps) {
  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-md bg-[#121318] border-l border-[#1e222d] text-zinc-100 p-6 overflow-y-auto font-mono">
        {trade && (
          <TradeDrawerContent
            key={trade.id}
            trade={trade}
            onClose={onClose}
            onTradeUpdated={onTradeUpdated}
            onTradeDeleted={onTradeDeleted}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
