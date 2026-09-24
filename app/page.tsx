"use client";

import { useState } from "react";
import { Navbar } from "@/components/navbar";
import { PositionCalculator } from "@/components/calculator";
import { ActiveTab } from "@/types/trading";

export default function Home() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("calculator");

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col font-sans">
      <Navbar activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6">
        {activeTab === "calculator" && <PositionCalculator />}
        {activeTab === "journal" && (
          <div className="p-6 rounded-md border border-[#1e222d] bg-[#121318] text-xs font-mono text-zinc-400">
            Journal view placeholder
          </div>
        )}
        {activeTab === "analytics" && (
          <div className="p-6 rounded-md border border-[#1e222d] bg-[#121318] text-xs font-mono text-zinc-400">
            Analytics view placeholder
          </div>
        )}
      </main>
    </div>
  );
}
