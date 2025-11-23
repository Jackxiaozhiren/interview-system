"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { PulseButton } from "@/components/ui/pulse-button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, Share2, Download, Trophy, Target, Zap, Brain } from "lucide-react";
import { TimelinePlayer, TimelineEvent } from "@/components/interview/TimelinePlayer";
import { SkillRadarChart } from "@/components/interview/SkillRadarChart";
import { motion } from "framer-motion";

export default function ReviewPage() {
    const params = useParams();
    const router = useRouter();
    const sessionId = params.sessionId as string;

    const [isLoading, setIsLoading] = useState(true);
    const [sessionData, setSessionData] = useState<any>(null);

    // Mock Data for Demo
    const mockEvents: TimelineEvent[] = [
        { id: "1", timestamp: 15, type: "positive", label: "Strong Opening", description: "Confident introduction with clear voice." },
        { id: "2", timestamp: 45, type: "negative", label: "Filler Words", description: "Used 'um' multiple times." },
        { id: "3", timestamp: 80, type: "positive", label: "STAR Method", description: "Great use of Situation-Task-Action-Result structure." },
        { id: "4", timestamp: 120, type: "neutral", label: "Pacing", description: "Slightly fast, but understandable." },
    ];

    const mockSkills = [
        { subject: 'Confidence', A: 85, fullMark: 100 },
        { subject: 'Clarity', A: 65, fullMark: 100 },
        { subject: 'Technical', A: 90, fullMark: 100 },
        { subject: 'Structure', A: 75, fullMark: 100 },
        { subject: 'Empathy', A: 60, fullMark: 100 },
    ];

    useEffect(() => {
        // Simulate fetching data
        setTimeout(() => {
            setSessionData({
                score: 78,
                summary: "Overall a solid performance. Your technical knowledge is impressive, but work on reducing filler words and pacing.",
                videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" // Placeholder
            });
            setIsLoading(false);
        }, 1500);
    }, []);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
                <p className="animate-pulse">Analyzing Game Tape...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans selection:bg-blue-500/30">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <header className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => router.push("/")} className="rounded-full hover:bg-slate-800">
                            <ArrowLeft className="h-6 w-6" />
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                                Game Tape Review
                            </h1>
                            <p className="text-slate-500 text-sm">Session #{sessionId.slice(0, 8)} • {new Date().toLocaleDateString()}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" className="border-slate-700 hover:bg-slate-800">
                            <Download className="mr-2 h-4 w-4" /> Export Report
                        </Button>
                        <Button className="bg-blue-600 hover:bg-blue-700">
                            <Share2 className="mr-2 h-4 w-4" /> Share
                        </Button>
                    </div>
                </header>

                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column: Video & Timeline */}
                    <div className="lg:col-span-2 space-y-6">
                        <GlassCard className="p-1 bg-slate-900/50 border-slate-800">
                            <TimelinePlayer videoUrl={sessionData.videoUrl} events={mockEvents} />
                        </GlassCard>

                        {/* Key Moments List */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <Zap className="h-5 w-5 text-yellow-500" /> Key Moments
                            </h3>
                            <div className="grid gap-3">
                                {mockEvents.map((event) => (
                                    <motion.div
                                        key={event.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="flex items-start gap-4 p-4 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer group"
                                    >
                                        <div className={`mt-1 w-2 h-2 rounded-full ${event.type === 'positive' ? 'bg-green-500' : event.type === 'negative' ? 'bg-red-500' : 'bg-blue-500'}`} />
                                        <div className="flex-1">
                                            <div className="flex justify-between items-center mb-1">
                                                <h4 className="font-medium text-slate-200 group-hover:text-blue-400 transition-colors">{event.label}</h4>
                                                <span className="text-xs font-mono text-slate-500">{Math.floor(event.timestamp / 60)}:{Math.floor(event.timestamp % 60).toString().padStart(2, '0')}</span>
                                            </div>
                                            <p className="text-sm text-slate-400">{event.description}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Analytics & Coach */}
                    <div className="space-y-6">

                        {/* Score Card */}
                        <GlassCard className="p-6 bg-gradient-to-br from-slate-900 to-slate-950 border-slate-800">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Overall Score</h2>
                                    <div className="text-5xl font-bold text-white mt-2">{sessionData.score}</div>
                                </div>
                                <div className="p-3 bg-blue-500/10 rounded-full">
                                    <Trophy className="h-8 w-8 text-blue-500" />
                                </div>
                            </div>
                            <div className="h-2 bg-slate-800 rounded-full overflow-hidden mb-4">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${sessionData.score}%` }}
                                    transition={{ duration: 1, delay: 0.5 }}
                                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                                />
                            </div>
                            <p className="text-sm text-slate-400 leading-relaxed">
                                {sessionData.summary}
                            </p>
                        </GlassCard>

                        {/* Radar Chart */}
                        <GlassCard className="p-6 bg-slate-900/50 border-slate-800">
                            <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4">Skill Breakdown</h3>
                            <SkillRadarChart data={mockSkills} />
                        </GlassCard>

                        {/* Coach's Corner */}
                        <GlassCard className="p-6 bg-indigo-950/20 border-indigo-500/20">
                            <h3 className="text-lg font-semibold text-indigo-300 mb-4 flex items-center gap-2">
                                <Brain className="h-5 w-5" /> Coach's Corner
                            </h3>
                            <ul className="space-y-3">
                                <li className="flex gap-3 text-sm text-indigo-100/80">
                                    <Target className="h-5 w-5 text-indigo-400 shrink-0" />
                                    <span>Try to pause for 2 seconds before answering complex questions to gather your thoughts.</span>
                                </li>
                                <li className="flex gap-3 text-sm text-indigo-100/80">
                                    <Target className="h-5 w-5 text-indigo-400 shrink-0" />
                                    <span>Your technical explanation of the API was excellent, keep using that level of detail.</span>
                                </li>
                                <li className="flex gap-3 text-sm text-indigo-100/80">
                                    <Target className="h-5 w-5 text-indigo-400 shrink-0" />
                                    <span>Maintain eye contact with the camera (avatar) more consistently.</span>
                                </li>
                            </ul>
                            <Button className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700">
                                Start Practice Drill
                            </Button>
                        </GlassCard>

                    </div>
                </div>
            </div>
        </div>
    );
}
