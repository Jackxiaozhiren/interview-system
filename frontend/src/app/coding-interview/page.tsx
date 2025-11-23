"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Code, TrendingUp, ArrowRight, Filter } from "lucide-react";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Problem {
    id: string;
    title: string;
    description: string;
    difficulty: string;
    category: string;
    tags: string[];
}

export default function CodingInterviewListPage() {
    const router = useRouter();
    const [problems, setProblems] = useState<Problem[]>([]);
    const [filter, setFilter] = useState<string>("all");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProblems();
    }, [filter]);

    const fetchProblems = async () => {
        try {
            const token = localStorage.getItem("token");
            const params: any = {};
            if (filter !== "all") {
                params.difficulty = filter;
            }

            const response = await axios.get(`${API_URL}/coding/problems`, {
                params,
                headers: { Authorization: `Bearer ${token}` }
            });

            setProblems(response.data);
        } catch (error) {
            console.error("Failed to fetch problems:", error);
        } finally {
            setLoading(false);
        }
    };

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case "easy":
                return "bg-green-500/20 text-green-400 border-green-500/50";
            case "medium":
                return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
            case "hard":
                return "bg-red-500/20 text-red-400 border-red-500/50";
            default:
                return "bg-slate-500/20 text-slate-400 border-slate-500/50";
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <Code className="h-8 w-8 text-blue-500" />
                        <h1 className="text-4xl font-bold text-white">
                            Technical Interview
                        </h1>
                    </div>
                    <p className="text-slate-400 text-lg">
                        Practice coding problems with AI-powered feedback
                    </p>
                </div>

                {/* Filters */}
                <Card className="bg-slate-900 border-slate-700 mb-6">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <Filter className="h-5 w-5 text-slate-400" />
                            <span className="text-slate-400">Difficulty:</span>
                            <div className="flex gap-2">
                                {["all", "easy", "medium", "hard"].map((level) => (
                                    <Button
                                        key={level}
                                        variant={filter === level ? "default" : "outline"}
                                        onClick={() => setFilter(level)}
                                        className={
                                            filter === level
                                                ? "bg-blue-600"
                                                : "border-slate-700 text-slate-400"
                                        }
                                    >
                                        {level.charAt(0).toUpperCase() + level.slice(1)}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Problems List */}
                <div className="space-y-4">
                    {loading ? (
                        <div className="text-center text-slate-400 py-12">
                            Loading problems...
                        </div>
                    ) : problems.length === 0 ? (
                        <Card className="bg-slate-900 border-slate-700">
                            <CardContent className="p-12 text-center">
                                <Code className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-slate-400 mb-2">
                                    No problems found
                                </h3>
                                <p className="text-slate-500">
                                    Try adjusting your filters or check back later
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        problems.map((problem) => (
                            <Card
                                key={problem.id}
                                className="bg-slate-900 border-slate-700 hover:border-blue-500/50 transition-all cursor-pointer group"
                                onClick={() =>
                                    router.push(`/coding-interview/${problem.id}`)
                                }
                            >
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-xl font-semibold text-white group-hover:text-blue-400 transition-colors">
                                                    {problem.title}
                                                </h3>
                                                <Badge
                                                    className={getDifficultyColor(
                                                        problem.difficulty
                                                    )}
                                                >
                                                    {problem.difficulty.toUpperCase()}
                                                </Badge>
                                            </div>

                                            <p className="text-slate-400 mb-3 line-clamp-2">
                                                {problem.description}
                                            </p>

                                            {/* Tags */}
                                            {problem.tags && problem.tags.length > 0 && (
                                                <div className="flex flex-wrap gap-2">
                                                    {problem.tags.map((tag, idx) => (
                                                        <span
                                                            key={idx}
                                                            className="text-xs px-2 py-1 bg-slate-800 text-slate-400 rounded"
                                                        >
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <ArrowRight className="h-5 w-5 text-slate-600 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>

                {/* Stats */}
                {!loading && problems.length > 0 && (
                    <Card className="bg-slate-900 border-slate-700 mt-8">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-white">
                                <TrendingUp className="h-5 w-5" />
                                Your Progress
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-3 gap-6">
                                <div>
                                    <div className="text-3xl font-bold text-white">
                                        {problems.length}
                                    </div>
                                    <div className="text-sm text-slate-400">
                                        Total Problems
                                    </div>
                                </div>
                                <div>
                                    <div className="text-3xl font-bold text-green-400">0</div>
                                    <div className="text-sm text-slate-400">Solved</div>
                                </div>
                                <div>
                                    <div className="text-3xl font-bold text-blue-400">0%</div>
                                    <div className="text-sm text-slate-400">
                                        Acceptance Rate
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
