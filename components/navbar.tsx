"use client";

import { useState, useEffect } from "react";
import { Calculator, BookOpen, BarChart3, Clock } from "lucide-react";
import { ActiveTab } from "@/types/trading";

interface NavbarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
}

function getCurrentKillzone(utcHour: number): string {
  if (utcHour >= 0 && utcHour < 4) return "Asia Killzone";
  if (utcHour >= 7 && utcHour < 10) return "London Killzone";
  if (utcHour >= 12 && utcHour < 15) return "NY AM Killzone";
  if (utcHour >= 18 && utcHour < 20) return "NY PM Killzone";
  return "Interbank / Off-Hours";
}

export function Navbar({ activeTab, onTabChange }: NavbarProps) {
  const [timeString, setTimeString] = useState<string>("--:--:-- UTC");
  const [currentSession, setCurrentSession] = useState<string>("Syncing...");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getUTCHours()).padStart(2, "0");
      const minutes = String(now.getUTCMinutes()).padStart(2, "0");
      const seconds = String(now.getUTCSeconds()).padStart(2, "0");

      setTimeString(`${hours}:${minutes}:${seconds} UTC`);
      setCurrentSession(getCurrentKillzone(now.getUTCHours()));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const navItems: { id: ActiveTab; label: string; icon: typeof Calculator }[] =
    [
      { id: "calculator", label: "Position Calculator", icon: Calculator },
      { id: "journal", label: "Journal & Logs", icon: BookOpen },
      { id: "analytics", label: "Performance Analytics", icon: BarChart3 },
    ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#1e222d] bg-[#09090b]/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Бренд та статус */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-100 border border-zinc-700">
              T
            </span>
            <span className="font-mono text-sm font-semibold tracking-wider text-zinc-100">
              TERMINAL <span className="text-zinc-500">//</span> JOURNAL
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-2 border-l border-[#1e222d] pl-3">
            <div className="flex items-center gap-1.5 text-xs font-mono text-zinc-400">
              <Clock className="w-3.5 h-3.5 text-zinc-500" />
              <span className="tabular-nums">{timeString}</span>
            </div>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {currentSession}
            </span>
          </div>
        </div>

        {/* Перемикач вкладок */}
        <nav className="flex items-center gap-1 bg-[#121318] p-1 rounded-md border border-[#1e222d]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-sm transition-all duration-150 ${
                  isActive
                    ? "bg-zinc-800 text-zinc-100 shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden md:inline">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
