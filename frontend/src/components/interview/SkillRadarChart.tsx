"use client";

import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer,
    Tooltip
} from "recharts";

interface SkillData {
    subject: string;
    A: number; // Current Score
    fullMark: number;
}

interface SkillRadarChartProps {
    data: SkillData[];
}

export function SkillRadarChart({ data }: SkillRadarChartProps) {
    return (
        <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
                    <PolarGrid stroke="#334155" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar
                        name="My Performance"
                        dataKey="A"
                        stroke="#3b82f6"
                        strokeWidth={3}
                        fill="#3b82f6"
                        fillOpacity={0.3}
                    />
                    <Tooltip
                        contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b", color: "#f8fafc" }}
                        itemStyle={{ color: "#60a5fa" }}
                    />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    );
}
