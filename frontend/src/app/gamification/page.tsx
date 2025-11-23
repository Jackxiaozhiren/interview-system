"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, PlayCircle, Trophy } from "lucide-react";
import { LevelProgressBar } from "@/components/gamification/LevelProgressBar";
import { BadgeDisplay } from "@/components/gamification/BadgeDisplay";
import { StreakDisplay } from "@/components/gamification/StreakDisplay";

interface GamificationProfile {
    level: number;
    total_xp: number;
    current_xp_in_level: number;
    xp_for_next_level: number;
    progress_percentage: number;
    current_streak: number;
    longest_streak: number;
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<GamificationProfile | null > (null);
const [badges, setBadges] = useState<BadgeInfo[]>([]);

useEffect(() => {
    if (!authLoading && !isAuthenticated) {
        router.push("/login?redirect=/gamification");
    }
}, [isAuthenticated, authLoading, router]);

useEffect(() => {
    if (isAuthenticated) {
        fetchGamificationData();
    }
}, [isAuthenticated]);

const fetchGamificationData = async () => {
    try {
        const [profileRes, badgesRes] = await Promise.all([
            api.get<GamificationProfile>("/gamification/profile"),
            api.get<BadgeInfo[]>("/gamification/badges")
        ]);
        setProfile(profileRes.data);
        setBadges(badgesRes.data);
    } catch (err) {
        console.error("Failed to load gamification data", err);
    } finally {
        setLoading(false);
    }
};

if (loading || authLoading) {
    return (
        <div className="flex justify-center items-center min-h-screen bg-slate-950">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
    );
}

if (!profile) {
    return <div className="p-10 text-center text-white">Failed to load profile.</div>;
}

const unlockedBadges = badges.filter(b => b.unlocked);

return (
    <main className="min-h-screen bg-slate-950 p-6 md:p-10">
        <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Trophy className="h-8 w-8 text-yellow-500" />
                        成就与进步
                    </h1>
                    <p className="text-slate-400 mt-1">追踪你的面试练习成长之路</p>
                </div>
                <Button
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => router.push("/interview/setup")}
                >
                    <PlayCircle className="mr-2 h-4 w-4" /> 开始练习
                </Button>
            </div>

            {/* Level Progress */}
            <LevelProgressBar
                level={profile.level}
                currentXP={profile.current_xp_in_level}
                xpForNext={profile.xp_for_next_level}
                progressPercentage={profile.progress_percentage}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Streak Card */}
                <div className="lg:col-span-1">
                    <StreakDisplay
                        currentStreak={profile.current_streak}
                        longestStreak={profile.longest_streak}
                    />
                </div>

                {/* Stats Summary */}
                <div className="lg:col-span-2 grid grid-cols-2 gap-6">
                    <Card className="bg-slate-900 border-slate-800">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm text-slate-400">总经验值</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold text-white">{profile.total_xp}</p>
                            <p className="text-xs text-slate-500 mt-1">累计获得</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-900 border-slate-800">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm text-slate-400">已解锁徽章</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold text-white">
                                {profile.badges_earned.length} / {profile.total_badges}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                                {((profile.badges_earned.length / profile.total_badges) * 100).toFixed(0)}% 完成度
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Badges Section */}
            <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                    <Tabs defaultValue="all" className="w-full">
                        <div className="flex justify-between items-center">
                            <CardTitle className="text-white">徽章墙</CardTitle>
                            <TabsList className="bg-slate-800">
                                <TabsTrigger value="all">全部 ({badges.length})</TabsTrigger>
                                <TabsTrigger value="unlocked">已解锁 ({unlockedBadges.length})</TabsTrigger>
                                <TabsTrigger value="locked">未解锁 ({badges.length - unlockedBadges.length})</TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContent value="all" className="mt-6">
                            <BadgeDisplay badges={badges} />
                        </TabsContent>

                        <TabsContent value="unlocked" className="mt-6">
                            {unlockedBadges.length > 0 ? (
                                <BadgeDisplay badges={unlockedBadges} />
                            ) : (
                                <div className="text-center py-12 text-slate-500">
                                    <p>还没有解锁任何徽章</p>
                                    <p className="text-sm mt-2">完成面试练习即可获得第一个徽章！</p>
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="locked" className="mt-6">
                            <BadgeDisplay badges={badges.filter(b => !b.unlocked)} />
                        </TabsContent>
                    </Tabs>
                </CardHeader>
            </Card>

            {/* Motivational Footer */}
            {profile.level < 20 && (
                <Card className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border-blue-800/30">
                    <CardContent className="p-6 text-center">
                        <p className="text-white font-medium mb-2">
                            💪 继续努力！你正在成为更好的自己
                        </p>
                        <p className="text-sm text-slate-400">
                            每一次练习都让你更接近面试成功
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    </main>
);
}
