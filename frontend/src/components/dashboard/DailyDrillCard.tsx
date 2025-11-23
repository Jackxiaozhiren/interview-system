"use client";

import { GlassCard } from "@/components/ui/glass-card";
import { PulseButton } from "@/components/ui/pulse-button";
import { Zap, Clock, ArrowRight } from "lucide-react";

export function DailyDrillCard() {
    return (
        <GlassCard className="p-6 bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border-indigo-500/30 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Zap className="w-32 h-32 text-white" />
            </div>

            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-wider border border-indigo-500/30">
                        Daily Drill
                    </span>
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                        <Clock className="w-3 h-3" /> 2 min
                    </span>
                </div>

                <h3 className="text-2xl font-bold text-white mb-2">The "Elevator Pitch"</h3>
                <p className="text-slate-300 text-sm mb-6 max-w-md">
                    Introduce yourself and your key strengths in under 60 seconds. Focus on energy and clarity.
                </p>

                <PulseButton
                    className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/20 group-hover:scale-105 transition-transform"
                    pulse={true}
                >
                    Start Drill <ArrowRight className="ml-2 w-4 h-4" />
                </PulseButton>
            </div>
        </GlassCard>
    );
}
