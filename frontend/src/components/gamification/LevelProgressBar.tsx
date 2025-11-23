"use client";

import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/glass-card";

interface LevelProgressBarProps {
    level: number;
    currentXP: number;
    nextLevelXP: number;
}

export function LevelProgressBar({ level, currentXP, nextLevelXP }: LevelProgressBarProps) {
    const progress = Math.min(100, (currentXP / nextLevelXP) * 100);

    return (
        <GlassCard className="p-6 bg-gradient-to-r from-indigo-900/50 to-purple-900/50 border-indigo-500/30">
            <div className="flex justify-between items-end mb-2">
                <div>
                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Current Level</span>
                    <div className="text-3xl font-bold text-white">Lvl {level}</div>
                </div>
                <div className="text-right">
                    <span className="text-xs text-slate-400">{currentXP} / {nextLevelXP} XP</span>
                </div>
            </div>

            <div className="h-3 bg-slate-800 rounded-full overflow-hidden relative">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 relative"
                >
                    <div className="absolute top-0 right-0 bottom-0 w-1 bg-white/50 shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
                </motion.div>
            </div>

            <div className="mt-2 text-xs text-slate-500 text-center">
                {nextLevelXP - currentXP} XP to Level {level + 1}
            </div>
        </GlassCard>
    );
}
