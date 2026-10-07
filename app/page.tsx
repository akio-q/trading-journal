"use client";

import { useState } from "react";
import { Navbar } from "@/components/navbar";
import { PositionCalculator, LogTradePayload } from "@/components/calculator";
import { JournalTable } from "@/components/journal-table";
import { ActiveTab, TradingSession } from "@/types/trading";
import { insertTrade } from "@/lib/supabase/trades";

function getCurrentSession(): TradingSession | undefined {
  const now = new Date();
  const utcHours = now.getUTCHours();
  const utcMinutes = now.getUTCMinutes();
  const totalMinutes = utcHours * 60 + utcMinutes;

  if (totalMinutes >= 0 && totalMinutes < 360) return "Asia Killzone";
  if (totalMinutes >= 420 && totalMinutes < 600) return "London Killzone";
  if (totalMinutes >= 720 && totalMinutes < 900) return "NY AM Killzone";
  if (totalMinutes >= 1080 && totalMinutes < 1200) return "NY PM Killzone";

  return undefined;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("calculator");

  const handleLogTrade = async (payload: LogTradePayload) => {
    try {
      const activeSession = getCurrentSession();
      const savedTrade = await insertTrade(payload, activeSession);

      if (savedTrade) {
        console.log("Successfully logged trade to Supabase:", savedTrade);
      } else {
        console.error("Failed to persist trade to Supabase.");
      }
    } catch (err) {
      console.error("Unexpected error logging trade:", err);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col font-sans">
      <Navbar activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6">
        {activeTab === "calculator" && (
          <PositionCalculator onLogTrade={handleLogTrade} />
        )}
        {activeTab === "journal" && <JournalTable />}
        {activeTab === "analytics" && (
          <div className="p-6 rounded-md border border-[#1e222d] bg-[#121318] text-xs font-mono text-zinc-400">
            Analytics view placeholder
          </div>
        )}
      </main>
    </div>
  );
}
