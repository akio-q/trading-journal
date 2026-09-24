"use client";

import { useState } from "react";
import { Navbar } from "@/components/navbar";
import { ActiveTab } from "@/types/trading";

export default function Home() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("calculator");

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col font-sans">
      <Navbar activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-8">
        <div className="p-4 rounded-md border border-[#1e222d] bg-[#121318] text-xs font-mono text-zinc-400">
          Active Tab:{" "}
          <span className="text-emerald-400 font-bold">{activeTab}</span>
        </div>
      </main>
    </div>
  );
}
