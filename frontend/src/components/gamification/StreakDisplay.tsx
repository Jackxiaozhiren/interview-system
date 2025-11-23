import React from "react";
import { Flame } from "lucide-react";

interface StreakDisplayProps {
    currentStreak: number;
    longestStreak: number;
    compact?: boolean;
}

export function StreakDisplay({ currentStreak, longestStreak, compact = false }: StreakDisplayProps) {
    const getStreakColor = (streak: number) => {
        if (streak >= 30) return "text-purple-500";
        if (streak >= 14) return "text-orange-500";
        if (streak >= 7) return "text-red-500";
        if (streak >= 3) return "text-yellow-500";
        return "text-gray-500";
    };

    const getFlameIntensity = (streak: number) => {
        if (streak >= 30) return "[0_0_20px_rgba(168,85,247,0.6)]";
        if (streak >= 14) return "shadow-[0_0_15px_rgba(249,115,22,0.5)]";
        if (streak >= 7) return "shadow-[0_0_10px_rgba(239,68,68,0.4)]";
        if (streak >= 3) return "shadow-[0_0_5px_rgba(234,179,8,0.3)]";
        return "";
    };

    if (compact) {
        return (
            <div className="flex items-center gap-2">
                <Flame className={`w-5 h-5 ${getStreakColor(currentStreak)} drop-shadow-${getFlameIntensity(currentStreak)}`} />
                <span className={`font-bold text-lg ${getStreakColor(currentStreak)}`}>
                    {currentStreak}天
                </span>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-orange-900/20 to-red-900/20 p-6 rounded-xl border border-orange-800/30">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-slate-400 mb-1">连续练习</p>
                    <div className="flex items-center gap-3">
                        <Flame className={`w-10 h-10 ${getStreakColor(currentStreak)} drop-shadow-${getFlameIntensity(currentStreak)}`} />
                        <div>
                            <p className={`text-4xl font-bold ${getStreakColor(currentStreak)}`}>
                                {currentStreak}
                            </p>
                            <p className="text-xs text-slate-500">天</p>
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-xs text-slate-500 mb-1">最长记录</p>
                    <p className="text-2xl font-semibold text-slate-300">{longestStreak}天</p>
                </div>
            </div>

            {currentStreak > 0 && (
                <div className="mt-4 pt-4 border-t border-orange-800/20">
                    <p className="text-xs text-slate-400 text-center">
                        {currentStreak >= 7
                            ? "🎉 太棒了！你已经坚持了一周！"
                            : `再坚持 ${7 - currentStreak} 天解锁"毅力之星"徽章！`}
                    </p>
                </div>
            )}
        </div>
    );
}
