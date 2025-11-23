"use client";

import { GlassCard } from "@/components/ui/glass-card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { motion } from "framer-motion";

interface Badge {
    id: string;
    badge_code: string;
    name: string;
    description: string;
    icon: string;
    earned_at: string;
}

interface BadgeDisplayProps {
    badges: Badge[];
}

export function BadgeDisplay({ badges }: BadgeDisplayProps) {
    return (
        <GlassCard className="p-6 bg-slate-900/50 border-slate-800">
            <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4">Achievements</h3>

            {badges.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">
                    No badges earned yet. Start practicing!
                </div>
            ) : (
                <div className="grid grid-cols-4 gap-4">
                    <TooltipProvider>
                        {badges.map((badge, i) => (
                            <Tooltip key={badge.id}>
                                <TooltipTrigger>
                                    <motion.div
                                        initial={{ scale: 0, rotate: -20 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{ delay: i * 0.1, type: "spring" }}
                                        className="aspect-square rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 flex items-center justify-center text-2xl shadow-lg hover:shadow-indigo-500/20 hover:border-indigo-500/50 transition-all cursor-help"
                                    >
                                        {badge.icon}
                                    </motion.div>
                                </TooltipTrigger>
                                <TooltipContent className="bg-slate-900 border-slate-800 text-slate-200">
                                    <p className="font-bold text-indigo-400">{badge.name}</p>
                                    <p className="text-xs">{badge.description}</p>
                                </TooltipContent>
                            </Tooltip>
                        ))}
                    </TooltipProvider>
                </div>
            )}
        </GlassCard>
    );
}
