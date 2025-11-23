"use client";

import { GlassCard } from "@/components/ui/glass-card";
import { Flame } from "lucide-react";

interface StreakWidgetProps {
    streak: number;
}

export function StreakWidget({ streak }: StreakWidgetProps) {
    return (
        <GlassCard className="p-4 bg-orange-950/20 border-orange-500/20 flex items-center gap-4">
            <div className={`p-3 rounded-full ${streak > 0 ? "bg-orange-500/20 text-orange-500" : "bg-slate-800 text-slate-600"}`}>
                <Flame className={`w-6 h-6 ${streak > 0 ? "animate-pulse" : ""}`} />
            </div>
            <div>
                <div className="text-2xl font-bold text-white">{streak}</div>
                <div className="text-xs text-orange-200/70 uppercase tracking-wider font-bold">Day Streak</div>
            </div>
        </GlassCard>
    );
}
