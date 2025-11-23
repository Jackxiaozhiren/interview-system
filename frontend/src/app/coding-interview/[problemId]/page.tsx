"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CodeEditor, LANGUAGE_DEFAULTS } from "@/components/CodeEditor";
import {
    Play,
    Lightbulb,
    Check,
    X,
    Clock,
    MemoryStick,
    ArrowLeft,
    Loader2
} from "lucide-react";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Problem {
    id: string;
    title: string;
    description: string;
    difficulty: string;
    test_cases: Array<{ input: string; expected_output: string }>;
    constraints: any;
    language_support: string[];
}

interface SubmissionResult {
    id: string;
    status: string;
    pass_rate: number;
    feedback: string;
    time_complexity: string;
    space_complexity: string;
    test_results: Array<{
        case: number;
        passed: boolean;
        explanation: string;
    }>;
}

export default function CodingInterviewPage() {
    const params = useParams();
    const router = useRouter();
    const problemId = params.problemId as string;

    const [problem, setProblem] = useState<Problem | null>(null);
    const [language, setLanguage] = useState("python");
    const [code, setCode] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<SubmissionResult | null>(null);
    const [hints, setHints] = useState<string[]>([]);
    const [loadingHints, setLoadingHints] = useState(false);

    useEffect(() => {
        fetchProblem();
    }, [problemId]);

    useEffect(() => {
        // Set default code template when language changes
        setCode(LANGUAGE_DEFAULTS[language as keyof typeof LANGUAGE_DEFAULTS] || "");
    }, [language]);

    const fetchProblem = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(`${API_URL}/coding/problems/${problemId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProblem(response.data);
        } catch (error) {
            console.error("Failed to fetch problem:", error);
        }
    };

    const handleSubmit = async () => {
        if (!code.trim()) return;

        setSubmitting(true);
        setResult(null);

        try {
            const token = localStorage.getItem("token");
            const response = await axios.post(
                `${API_URL}/coding/submit`,
                {
                    problem_id: problemId,
                    code,
                    language
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            setResult(response.data);
        } catch (error) {
            console.error("Submission failed:", error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleGetHints = async () => {
        setLoadingHints(true);
        try {
            const token = localStorage.getItem("token");
            const response = await axios.post(
                `${API_URL}/coding/hints`,
                {
                    problem_id: problemId,
                    code,
                    language
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            setHints(response.data.hints);
        } catch (error) {
            console.error("Failed to get hints:", error);
        } finally {
            setLoadingHints(false);
        }
    };

    if (!problem) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
        );
    }

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case "easy": return "bg-green-500/20 text-green-400 border-green-500/50";
            case "medium": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
            case "hard": return "bg-red-500/20 text-red-400 border-red-500/50";
            default: return "bg-slate-500/20 text-slate-400 border-slate-500/50";
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "accepted": return <Check className="h-5 w-5 text-green-500" />;
            case "wrong_answer": return <X className="h-5 w-5 text-red-500" />;
            default: return <X className="h-5 w-5 text-orange-500" />;
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 p-6">
            {/* Header */}
            <div className="max-w-[1800px] mx-auto mb-6">
                <Button
                    variant="ghost"
                    onClick={() => router.push("/coding-interview")}
                    className="text-slate-400 hover:text-white mb-4"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Problems
                </Button>

                <div className="flex items-center gap-4 mb-2">
                    <h1 className="text-3xl font-bold text-white">{problem.title}</h1>
                    <Badge className={getDifficultyColor(problem.difficulty)}>
                        {problem.difficulty.toUpperCase()}
                    </Badge>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-[1800px] mx-auto grid grid-cols-2 gap-6">
                {/* Left Panel: Problem Description */}
                <Card className="bg-slate-900 border-slate-700">
                    <CardHeader>
                        <CardTitle className="text-white">Problem Description</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="text-slate-300 whitespace-pre-wrap">
                            {problem.description}
                        </div>

                        {/* Test Cases */}
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-3">Test Cases</h3>
                            <div className="space-y-3">
                                {problem.test_cases.map((testCase, idx) => (
                                    <div key={idx} className="p-3 bg-slate-800 rounded-lg">
                                        <div className="text-sm text-slate-400 mb-1">Test Case {idx + 1}</div>
                                        <div className="space-y-1">
                                            <div>
                                                <span className="text-slate-500">Input: </span>
                                                <code className="text-green-400">{testCase.input}</code>
                                            </div>
                                            <div>
                                                <span className="text-slate-500">Expected: </span>
                                                <code className="text-blue-400">{testCase.expected_output}</code>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Hints */}
                        {hints.length > 0 && (
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                                    <Lightbulb className="h-5 w-5 text-yellow-500" />
                                    Hints
                                </h3>
                                <div className="space-y-2">
                                    {hints.map((hint, idx) => (
                                        <div key={idx} className="p-3 bg-yellow-900/20 border border-yellow-700/30 rounded-lg text-yellow-200">
                                            <span className="font-semibold">Hint {idx + 1}: </span>
                                            {hint}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Right Panel: Code Editor */}
                <div className="space-y-4">
                    {/* Language Selector & Actions */}
                    <Card className="bg-slate-900 border-slate-700">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <label className="text-sm text-slate-400">Language:</label>
                                    <select
                                        value={language}
                                        onChange={(e) => setLanguage(e.target.value)}
                                        className="bg-slate-800 text-white px-3 py-2 rounded-lg border border-slate-700"
                                    >
                                        {problem.language_support.map((lang) => (
                                            <option key={lang} value={lang}>
                                                {lang.charAt(0).toUpperCase() + lang.slice(1)}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={handleGetHints}
                                        disabled={loadingHints}
                                        className="border-slate-700"
                                    >
                                        {loadingHints ? (
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        ) : (
                                            <Lightbulb className="h-4 w-4 mr-2" />
                                        )}
                                        Get Hint
                                    </Button>

                                    <Button
                                        onClick={handleSubmit}
                                        disabled={submitting || !code.trim()}
                                        className="bg-gradient-to-r from-blue-600 to-purple-600"
                                    >
                                        {submitting ? (
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        ) : (
                                            <Play className="h-4 w-4 mr-2" />
                                        )}
                                        Submit Code
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Code Editor */}
                    <CodeEditor
                        language={language}
                        value={code}
                        onChange={(value) => setCode(value || "")}
                        height="450px"
                    />

                    {/* Results */}
                    {result && (
                        <Card className="bg-slate-900 border-slate-700">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-white">
                                    {getStatusIcon(result.status)}
                                    {result.status === "accepted" ? "Accepted!" : "Wrong Answer"}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Pass Rate */}
                                <div className="flex items-center gap-4">
                                    <span className="text-slate-400">Pass Rate:</span>
                                    <span className="text-2xl font-bold text-white">
                                        {(result.pass_rate * 100).toFixed(0)}%
                                    </span>
                                </div>

                                {/* Complexity */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-blue-400" />
                                        <span className="text-slate-400">Time:</span>
                                        <code className="text-blue-400">{result.time_complexity}</code>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <MemoryStick className="h-4 w-4 text-purple-400" />
                                        <span className="text-slate-400">Space:</span>
                                        <code className="text-purple-400">{result.space_complexity}</code>
                                    </div>
                                </div>

                                {/* Feedback */}
                                <div>
                                    <h4 className="font-semibold text-white mb-2">Feedback:</h4>
                                    <p className="text-slate-300 whitespace-pre-wrap">{result.feedback}</p>
                                </div>

                                {/* Test Results */}
                                {result.test_results && result.test_results.length > 0 && (
                                    <div>
                                        <h4 className="font-semibold text-white mb-2">Test Results:</h4>
                                        <div className="space-y-2">
                                            {result.test_results.map((test, idx) => (
                                                <div
                                                    key={idx}
                                                    className={`p-3 rounded-lg ${test.passed
                                                            ? "bg-green-900/20 border border-green-700/30"
                                                            : "bg-red-900/20 border border-red-700/30"
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-2 mb-1">
                                                        {test.passed ? (
                                                            <Check className="h-4 w-4 text-green-500" />
                                                        ) : (
                                                            <X className="h-4 w-4 text-red-500" />
                                                        )}
                                                        <span className="font-semibold text-white">
                                                            Test Case {test.case}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-slate-300">{test.explanation}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
