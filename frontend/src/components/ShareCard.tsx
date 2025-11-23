import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp, Award, Zap } from "lucide-react";

interface ShareCardProps {
    userName: string;
    score: number;
    level: number;
    badges: number;
    streak: number;
}

export function ShareCard({ userName, score, level, badges, streak }: ShareCardProps) {
    return (
        <div className="w-[400px] bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 p-8 rounded-2xl shadow-2xl border border-blue-500/30">
            {/* Header */}
            <div className="text-center mb-6">
                <h1 className="text-3xl font-bold text-white mb-2">
                    我的面试成绩单
                </h1>
                <p className="text-blue-200 text-sm">AI Mock Interview System</p>
            </div>

            {/* User Name */}
            <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 bg-white/10 px-6 py-3 rounded-full">
                    <Trophy className="h-5 w-5 text-yellow-400" />
                    <span className="text-xl font-semibold text-white">{userName}</span>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mb-8">
                {/* Score */}
                <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 p-4 rounded-xl border border-green-400/30">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-4 w-4 text-green-400" />
                        <span className="text-xs text-green-300">综合评分</span>
                    </div>
                    <div className="text-3xl font-bold text-white">{score}</div>
                    <div className="text-xs text-green-200 mt-1">满分100</div>
                </div>

                {/* Level */}
                <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 p-4 rounded-xl border border-blue-400/30">
                    <div className="flex items-center gap-2 mb-2">
                        <Award className="h-4 w-4 text-blue-400" />
                        <span className="text-xs text-blue-300">当前等级</span>
                    </div>
                    <div className="text-3xl font-bold text-white">Lv.{level}</div>
                    <div className="text-xs text-blue-200 mt-1">
                        {level >= 16 ? "面试大师" : level >= 11 ? "面试高手" : level >= 6 ? "面试学徒" : "面试新手"}
                    </div>
                </div>

                {/* Badges */}
                <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 p-4 rounded-xl border border-purple-400/30">
                    <div className="flex items-center gap-2 mb-2">
                        <Trophy className="h-4 w-4 text-purple-400" />
                        <span className="text-xs text-purple-300">徽章收集</span>
                    </div>
                    <div className="text-3xl font-bold text-white">{badges}</div>
                    <div className="text-xs text-purple-200 mt-1">个徽章</div>
                </div>

                {/* Streak */}
                <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 p-4 rounded-xl border border-orange-400/30">
                    <div className="flex items-center gap-2 mb-2">
                        <Zap className="h-4 w-4 text-orange-400" />
                        <span className="text-xs text-orange-300">连续练习</span>
                    </div>
                    <div className="text-3xl font-bold text-white">{streak}</div>
                    <div className="text-xs text-orange-200 mt-1">天</div>
                </div>
            </div>

            {/* Achievement Badge */}
            {score >= 80 && (
                <div className="text-center mb-6">
                    <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-400/50 px-4 py-2 text-sm">
                        🎉 优秀表现
                    </Badge>
                </div>
            )}

            {/* Footer CTA */}
            <div className="text-center pt-6 border-t border-white/10">
                <p className="text-sm text-blue-200 mb-3">
                    我正在使用AI面试系统提升面试技能
                </p>
                <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
                    <span>扫码体验</span>
                    <span>→</span>
                    <span className="font-mono bg-white/10 px-2 py-1 rounded">interview.ai</span>
                </div>
            </div>
        </div>
    );
}
