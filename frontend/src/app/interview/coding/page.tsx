"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { API_BASE_URL } from "@/lib/api";
import { CodeEditor } from "@/components/coding/CodeEditor";
import { ProblemPanel } from "@/components/coding/ProblemPanel";
import { OutputPanel } from "@/components/coding/OutputPanel";
import { ControlBar } from "@/components/coding/ControlBar";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Loader2 } from "lucide-react";

interface Problem {
    id: string;
    title: string;
    description: string;
    difficulty: string;
    test_cases: any[];
    category?: string;
    tags?: string[];
}

export default function CodingInterviewPage() {
    const [problem, setProblem] = useState<Problem | null>(null);
    const [code, setCode] = useState<string>("# Write your solution here\n");
    const [language, setLanguage] = useState("python");
    const [output, setOutput] = useState("");
    const [status, setStatus] = useState<"idle" | "running" | "success" | "error">("idle");
    const [testResults, setTestResults] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Fetch a random problem or list
        const fetchProblem = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/coding/problems`);
                if (res.data && res.data.length > 0) {
                    setProblem(res.data[0]); // Just take the first one for now
                }
            } catch (err) {
                console.error("Failed to fetch problems", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProblem();
    }, []);

    const handleRun = async () => {
        if (!problem) return;
        setStatus("running");
        setOutput("");
        setTestResults([]);

        try {
            // Simulate run delay
            await new Promise(r => setTimeout(r, 800));

            // In a real app, we'd have a /run endpoint. 
            // For now, we'll use the submit endpoint but treat it as a "Run"
            // or just mock it if we don't want to record a submission.
            // Let's use the actual submit endpoint to get feedback.
            const res = await axios.post(`${API_BASE_URL}/coding/submit`, {
                problem_id: problem.id,
                code: code,
                language: language
            });

            const data = res.data;
            if (data.status === "accepted") {
                setStatus("success");
                setOutput("All test cases passed!");
            } else {
                setStatus("error");
                setOutput(data.feedback || "Some tests failed.");
            }
            setTestResults(data.test_results || []);

        } catch (err) {
            console.error("Run failed", err);
            setStatus("error");
            setOutput("Execution failed. Please check your code syntax.");
        }
    };

    const handleSubmit = async () => {
        if (!problem) return;
        setStatus("running");

        try {
            const res = await axios.post(`${API_BASE_URL}/coding/submit`, {
                problem_id: problem.id,
                code: code,
                language: language
            });

            const data = res.data;
            if (data.status === "accepted") {
                setStatus("success");
                setOutput(`Success! Pass Rate: ${(data.pass_rate * 100).toFixed(0)}%`);
            } else {
                setStatus("error");
                setOutput(`Submission Failed. Pass Rate: ${(data.pass_rate * 100).toFixed(0)}%\n\nFeedback: ${data.feedback}`);
            }
            setTestResults(data.test_results || []);
        } catch (err) {
            setStatus("error");
            setOutput("Submission failed due to server error.");
        }
    };

    const handleHint = async () => {
        if (!problem) return;
        try {
            const res = await axios.post(`${API_BASE_URL}/coding/hints`, {
                problem_id: problem.id,
                code: code,
                language: language
            });
            setOutput((prev) => prev + `\n\n[AI Hint]: ${res.data.hints}`);
        } catch (err) {
            console.error("Hint failed", err);
        }
    };

    if (isLoading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-slate-950 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin mb-4" />
            </div>
        );
    }

    if (!problem) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-slate-950 text-slate-400">
                <p>No problems found. Please seed the database.</p>
            </div>
        );
    }

    return (
        <div className="h-screen w-full bg-slate-950 flex flex-col overflow-hidden">
            {/* Top Bar */}
            <ControlBar
                language={language}
                onLanguageChange={setLanguage}
                onRun={handleRun}
                onSubmit={handleSubmit}
                onHint={handleHint}
                isRunning={status === "running"}
                isSubmitting={status === "running"}
            />

            {/* Main Content */}
            <div className="flex-1 overflow-hidden">
                <ResizablePanelGroup direction="horizontal">
                    {/* Left: Problem Description */}
                    <ResizablePanel defaultSize={40} minSize={20}>
                        <ProblemPanel problem={problem} />
                    </ResizablePanel>

                    <ResizableHandle withHandle className="bg-slate-800" />

                    {/* Right: Editor & Output */}
                    <ResizablePanel defaultSize={60}>
                        <ResizablePanelGroup direction="vertical">
                            {/* Editor */}
                            <ResizablePanel defaultSize={70} minSize={30}>
                                <CodeEditor
                                    language={language}
                                    value={code}
                                    onChange={(val) => setCode(val || "")}
                                />
                            </ResizablePanel>

                            <ResizableHandle withHandle className="bg-slate-800" />

                            {/* Output */}
                            <ResizablePanel defaultSize={30} minSize={10}>
                                <OutputPanel
                                    status={status}
                                    output={output}
                                    testResults={testResults}
                                />
                            </ResizablePanel>
                        </ResizablePanelGroup>
                    </ResizablePanel>
                </ResizablePanelGroup>
            </div>
        </div>
    );
}
