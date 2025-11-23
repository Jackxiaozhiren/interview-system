"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Target, Zap, Repeat } from "lucide-react";

interface Drill {
    id: string;
    title: string;
    description: string;
    difficulty: "Easy" | "Medium" | "Hard";
    duration: string;
    type: "content" | "delivery" | "behavioral";
}

interface ActionableDrillsProps {
    weaknesses?: string[];
}

export function ActionableDrills({ weaknesses = [] }: ActionableDrillsProps) {
    // In a real app, we would generate these based on the weaknesses
    const recommendedDrills: Drill[] = [
        {
            id: "star-method",
            title: "Master the STAR Method",
            description: "Practice structuring your answers using Situation, Task, Action, Result.",
            difficulty: "Medium",
            duration: "5 min",
            type: "content"
        },
        {
            id: "filler-reduction",
            title: "Filler Word Reduction",
            description: "Speak for 2 minutes without using 'um', 'uh', or 'like'.",
            difficulty: "Hard",
            duration: "2 min",
            type: "delivery"
        },
        {
            id: "eye-contact",
            title: "Eye Contact Challenge",
            description: "Maintain eye contact with the camera for 90% of your answer.",
            difficulty: "Easy",
            duration: "3 min",
            type: "delivery"
        }
    ];

    return (
        <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 border-slate-200 dark:border-slate-800">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-blue-600" />
                    <CardTitle>Actionable Drills</CardTitle>
                </div>
                <CardDescription>Personalized practice to improve your weak spots.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {weaknesses.length > 0 && (
                    <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg text-sm text-red-800 dark:text-red-300 mb-4">
                        <strong>Focus Areas:</strong> {weaknesses.join(", ")}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {recommendedDrills.map((drill) => (
                        <div key={drill.id} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                            <div className="space-y-2">
                                <div className="flex justify-between items-start">
                                    <Badge variant={drill.type === 'content' ? 'default' : 'secondary'} className="text-[10px]">
                                        {drill.type.toUpperCase()}
                                    </Badge>
                                    <span className="text-xs text-slate-500">{drill.duration}</span>
                                </div>
                                <h3 className="font-semibold text-slate-900 dark:text-slate-100">{drill.title}</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{drill.description}</p>
                            </div>

                            <Button variant="ghost" size="sm" className="w-full mt-4 justify-between group">
                                Start Drill
                                <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
