"use client";

import { GlassCard } from "@/components/ui/glass-card";
import { motion } from "framer-motion";
import { Trophy, TrendingUp, Star } from "lucide-react";

interface SkillNode {
    id: string;
    name: string;
    level: number;
    progress: number;
    icon: React.ReactNode;
}

export function SkillTreeWidget() {
    // Mock Data
    const skills: SkillNode[] = [
        { id: "1", name: "Confidence", level: 3, progress: 75, icon: <Trophy className="w-4 h-4 text-yellow-400" /> },
        { id: "2", name: "Clarity", level: 2, progress: 40, icon: <TrendingUp className="w-4 h-4 text-blue-400" /> },
        { id: "3", name: "Structure", level: 4, progress: 90, icon: <Star className="w-4 h-4 text-purple-400" /> },
    ];

    return (
        <GlassCard className="p-6 bg-slate-900/50 border-slate-800">
            <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" /> Skill Tree
            </h3>
            <div className="space-y-4">
                {skills.map((skill) => (
                    <div key={skill.id} className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-300 flex items-center gap-2">
                                {skill.icon} {skill.name}
                            </span>
                            <span className="text-slate-500 font-mono">Lvl {skill.level}</span>
                        </div>
                        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${skill.progress}%` }}
                                transition={{ duration: 1, delay: 0.2 }}
                                className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                            />
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800 text-center">
                <p className="text-xs text-slate-500">Next Reward: <span className="text-blue-400">Pro Badge</span> at Lvl 5</p>
            </div>
        </GlassCard>
    );
}
