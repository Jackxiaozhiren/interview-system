import React from "react";
import { AlertTriangle, Mic, Activity, Gauge } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface HUDOverlayProps {
    wpm: number;
    fillerCount: number;
    volume: number;
    nudge: string | null;
    isSpeaking: boolean;
}

export function HUDOverlay({ wpm, fillerCount, volume, nudge, isSpeaking }: HUDOverlayProps) {
    // Determine color for WPM
    const getWpmColor = (w: number) => {
        if (w < 100) return "text-yellow-400";
        if (w > 160) return "text-red-400";
        return "text-green-400";
    };

    return (
        <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between">
            {/* Top Right: Metrics */}
            <div className="flex justify-end gap-3">
                {/* WPM Gauge */}
                <div className="bg-black/60 backdrop-blur-md rounded-lg p-2 flex items-center gap-2 border border-white/10">
                    <Gauge className={`h-4 w-4 ${getWpmColor(wpm)}`} />
                    <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400 uppercase font-bold">Speed</span>
                        <span className={`text-sm font-mono font-bold ${getWpmColor(wpm)}`}>
                            {wpm} <span className="text-[10px]">WPM</span>
                        </span>
                    </div>
                </div>

                {/* Filler Counter */}
                <div className="bg-black/60 backdrop-blur-md rounded-lg p-2 flex items-center gap-2 border border-white/10">
                    <Activity className="h-4 w-4 text-blue-400" />
                    <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400 uppercase font-bold">Fillers</span>
                        <span className="text-sm font-mono font-bold text-white">
                            {fillerCount}
                        </span>
                    </div>
                </div>
            </div>

            {/* Center: Nudge Alert */}
            <div className="flex justify-center">
                {nudge && (
                    <div className="bg-black/80 backdrop-blur-md border border-yellow-500/50 text-yellow-400 px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-4 fade-in zoom-in duration-300">
                        <AlertTriangle className="h-5 w-5 animate-pulse" />
                        <span className="font-medium tracking-wide">{nudge}</span>
                    </div>
                )}
            </div>

            {/* Bottom Left: Volume / Status */}
            <div className="flex items-end">
                <div className={`bg-black/60 backdrop-blur-md rounded-full px-4 py-2 flex items-center gap-3 border border-white/10 transition-all duration-300 ${isSpeaking ? "border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.3)]" : ""}`}>
                    <Mic className={`h-4 w-4 ${isSpeaking ? "text-green-400" : "text-slate-500"}`} />
                    <div className="flex gap-1 items-end h-3">
                        {[...Array(5)].map((_, i) => (
                            <div
                                key={i}
                                className={`w-1 rounded-full transition-all duration-75 ${volume * 100 > (i + 1) * 10 // Simple visualizer logic
                                        ? "bg-green-400 h-full"
                                        : "bg-slate-600 h-1"
                                    }`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
