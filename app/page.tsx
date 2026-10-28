"use client";

import { useState } from "react";
import { Navbar } from "@/components/navbar";
import { PositionCalculator, LogTradePayload } from "@/components/calculator";
import { JournalTable } from "@/components/journal-table";
import { AnalyticsView } from "@/components/analytics-view";
import { ActiveTab, TradingSession } from "@/types/trading";
import { insertTrade } from "@/lib/supabase/trades";

function getCurrentSession(): TradingSession {
  const now = new Date();
  const utcHours = now.getUTCHours();
  const utcMinutes = now.getUTCMinutes();
  const totalMinutes = utcHours * 60 + utcMinutes;

  // 00:00 - 07:00 UTC -> Asian Session (Tokyo / Sydney)
  if (totalMinutes >= 0 && totalMinutes < 420) {
    return "Asian Session";
  }
  // 07:00 - 12:00 UTC -> London Session (European Cash Open)
  if (totalMinutes >= 420 && totalMinutes < 720) {
    return "London Session";
  }
  // 12:00 - 21:00 UTC -> New York Session (US Open & Cash Session)
  if (totalMinutes >= 720 && totalMinutes < 1260) {
    return "New York Session";
  }

  // 21:00 - 24:00 UTC -> Market Rollover / Off-Hours
  return "Off-Hours";
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
        {activeTab === "analytics" && <AnalyticsView />}
      </main>
    </div>
  );
}
