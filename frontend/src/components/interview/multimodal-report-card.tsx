"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Brain, Mic, Video, Activity } from "lucide-react";

interface MultimodalReportCardProps {
    audioFeatures?: {
        speech_rate?: number | null;
        pause_ratio?: number | null;
        filler_word_ratio?: number | null;
        pitch_variance?: number | null;
        emotion?: string | null;
    };
    videoFeatures?: {
        eye_contact_score?: number | null;
        smile_ratio?: number | null;
        posture_score?: number | null;
        head_movement_score?: number | null;
        dominant_emotion?: string | null;
    };
    contentScore?: number; // Placeholder for content quality
}

export function MultimodalReportCard({ audioFeatures, videoFeatures, contentScore = 75 }: MultimodalReportCardProps) {

    const speechRate = audioFeatures?.speech_rate ?? null;
    const pauseRatio = audioFeatures?.pause_ratio ?? null;
    const fillerRatio = audioFeatures?.filler_word_ratio ?? null;
    const eyeContact = videoFeatures?.eye_contact_score ?? null;
    const smileRatio = videoFeatures?.smile_ratio ?? null;
    const postureScore = videoFeatures?.posture_score ?? null;
    const dominantEmotion = videoFeatures?.dominant_emotion ?? null;

    const speechRateStatus = (() => {
        if (speechRate == null) return "数据不足";
        if (speechRate < 110) return "偏慢";
        if (speechRate > 170) return "偏快";
        return "适中";
    })();

    const fillerStatus = (() => {
        if (fillerRatio == null) return "数据不足";
        if (fillerRatio <= 0.03) return "良好";
        if (fillerRatio <= 0.06) return "偏多";
        return "明显偏多";
    })();

    const eyeContactStatus = (() => {
        if (eyeContact == null) return "数据不足";
        if (eyeContact >= 0.75) return "良好";
        if (eyeContact >= 0.55) return "略低";
        return "明显不足";
    })();

    const emotionLabel = (() => {
        if (!dominantEmotion) return "中性";
        if (["happy", "surprise"].includes(dominantEmotion)) return "积极";
        if (["angry", "disgust", "fear", "sad"].includes(dominantEmotion)) return "消极";
        return "中性";
    })();

    const clampScore = (v: number) => Math.max(0, Math.min(100, v));

    const clarityScore = (() => {
        if (fillerRatio == null && pauseRatio == null) return 65;
        const fillerPenalty = fillerRatio != null ? Math.min(50, fillerRatio * 2000) : 0; // ~30% penalty at 3%
        const pausePenalty = pauseRatio != null ? Math.min(20, Math.abs(pauseRatio - 0.15) * 200) : 0;
        return clampScore(90 - fillerPenalty - pausePenalty);
    })();

    const pacingScore = (() => {
        if (speechRate == null && pauseRatio == null) return 65;
        let score = 90;
        if (speechRate != null) {
            if (speechRate < 110 || speechRate > 170) score -= 20;
        }
        if (pauseRatio != null) {
            if (pauseRatio > 0.5 || pauseRatio < 0.05) score -= 15;
        }
        return clampScore(score);
    })();

    const confidenceScore = (() => {
        const posturePart = postureScore != null ? postureScore * 60 : 30;
        const emotionPart = emotionLabel === "积极" ? 30 : emotionLabel === "中性" ? 20 : 10;
        return clampScore(posturePart + emotionPart);
    })();

    const engagementScore = (() => {
        const eyePart = eyeContact != null ? eyeContact * 60 : 30;
        const smilePart = smileRatio != null ? smileRatio * 40 : 20;
        return clampScore(eyePart + smilePart);
    })();

    // Prepare data for Radar Chart (Skills Overview)
    const skillsData = [
        { subject: "Clarity", A: clarityScore, fullMark: 100 },
        { subject: "Confidence", A: confidenceScore, fullMark: 100 },
        { subject: "Engagement", A: engagementScore, fullMark: 100 },
        { subject: "Content", A: clampScore(contentScore), fullMark: 100 },
        { subject: "Pacing", A: pacingScore, fullMark: 100 },
        { subject: "Positivity", A: clampScore((smileRatio ?? 0.5) * 100), fullMark: 100 },
    ];

    // Mock Sentiment Data (Timeline) - In real app, this would come from backend analysis over time
    const sentimentData = [
        { time: '0:00', confidence: 60, nervousness: 40 },
        { time: '0:30', confidence: 70, nervousness: 30 },
        { time: '1:00', confidence: 65, nervousness: 35 },
        { time: '1:30', confidence: 80, nervousness: 20 },
        { time: '2:00', confidence: 85, nervousness: 15 },
        { time: '2:30', confidence: 75, nervousness: 25 },
    ];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Speech Rate</CardTitle>
                        <Mic className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {speechRate != null ? speechRate.toFixed(0) : "--"}
                            <span className="ml-1 text-xs font-normal text-muted-foreground">WPM</span>
                        </div>
                        <div className="mt-1 flex items-center justify-between">
                            <p className="text-xs text-muted-foreground">Target: 130-160 WPM</p>
                            <Badge variant={speechRateStatus === "适中" ? "secondary" : "outline"} className="text-[10px] px-1.5 py-0">
                                {speechRateStatus}
                            </Badge>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Eye Contact</CardTitle>
                        <Video className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {eyeContact != null ? (eyeContact * 100).toFixed(0) : "--"}%
                        </div>
                        <div className="mt-1 flex items-center justify-between">
                            <p className="text-xs text-muted-foreground">Target: {">"}70%</p>
                            <Badge
                                variant={eyeContactStatus === "良好" ? "secondary" : "outline"}
                                className="text-[10px] px-1.5 py-0"
                            >
                                {eyeContactStatus}
                            </Badge>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Filler Words</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {fillerRatio != null ? (fillerRatio * 100).toFixed(1) : "--"}%
                        </div>
                        <div className="mt-1 flex items-center justify-between">
                            <p className="text-xs text-muted-foreground">Target: {"<"}3%</p>
                            <Badge
                                variant={fillerStatus === "良好" ? "secondary" : "outline"}
                                className="text-[10px] px-1.5 py-0"
                            >
                                {fillerStatus}
                            </Badge>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Dominant Emotion</CardTitle>
                        <Brain className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold capitalize">
                            {dominantEmotion ? dominantEmotion : "neutral"}
                        </div>
                        <p className="text-xs text-muted-foreground">整体情绪倾向：{emotionLabel}</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Skills Radar */}
                <Card>
                    <CardHeader>
                        <CardTitle>Skills Assessment</CardTitle>
                        <CardDescription>Holistic view of your interview performance.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={skillsData}>
                                <PolarGrid />
                                <PolarAngleAxis dataKey="subject" />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} />
                                <Radar
                                    name="You"
                                    dataKey="A"
                                    stroke="#2563eb"
                                    fill="#3b82f6"
                                    fillOpacity={0.6}
                                />
                                <Tooltip />
                            </RadarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Sentiment Timeline */}
                <Card>
                    <CardHeader>
                        <CardTitle>Emotional Journey</CardTitle>
                        <CardDescription>Confidence vs. Nervousness over time.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={sentimentData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="time" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="confidence" stroke="#10b981" strokeWidth={2} />
                                <Line type="monotone" dataKey="nervousness" stroke="#ef4444" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
