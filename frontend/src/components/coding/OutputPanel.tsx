"use client";

import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle, Terminal } from "lucide-react";

interface TestResult {
    input: string;
    expected: string;
    actual: string;
    passed: boolean;
    error?: string;
}

interface OutputPanelProps {
    status: "idle" | "running" | "success" | "error";
    output: string;
    testResults?: TestResult[];
    error?: string;
}

export const OutputPanel: React.FC<OutputPanelProps> = ({
    status,
    output,
    testResults = [],
    error
}) => {
    return (
        <div className="h-full flex flex-col bg-[#1e1e1e] border-t border-slate-800">
            <Tabs defaultValue="output" className="flex-1 flex flex-col">
                <div className="px-4 pt-2 border-b border-slate-800 bg-slate-900/50">
                    <TabsList className="bg-transparent h-9 p-0">
                        <TabsTrigger
                            value="output"
                            className="data-[state=active]:bg-transparent data-[state=active]:text-blue-400 data-[state=active]:border-b-2 data-[state=active]:border-blue-400 rounded-none px-4 pb-2"
                        >
                            <Terminal className="w-4 h-4 mr-2" />
                            Console
                        </TabsTrigger>
                        <TabsTrigger
                            value="tests"
                            className="data-[state=active]:bg-transparent data-[state=active]:text-blue-400 data-[state=active]:border-b-2 data-[state=active]:border-blue-400 rounded-none px-4 pb-2"
                        >
                            Test Results
                            {testResults.length > 0 && (
                                <span className="ml-2 text-xs bg-slate-800 px-1.5 py-0.5 rounded-full">
                                    {testResults.filter(t => t.passed).length}/{testResults.length}
                                </span>
                            )}
                        </TabsTrigger>
                    </TabsList>
                </div>

                <ScrollArea className="flex-1 p-4 font-mono text-sm">
                    <TabsContent value="output" className="mt-0 h-full">
                        {status === "running" && (
                            <div className="text-yellow-400 animate-pulse">Running code...</div>
                        )}
                        {error && (
                            <div className="text-red-400 whitespace-pre-wrap mb-4 bg-red-950/30 p-3 rounded border border-red-900/50">
                                {error}
                            </div>
                        )}
                        <div className="text-slate-300 whitespace-pre-wrap">
                            {output || (status === "idle" ? "Run your code to see output." : "")}
                        </div>
                    </TabsContent>

                    <TabsContent value="tests" className="mt-0 space-y-3">
                        {testResults.length === 0 ? (
                            <div className="text-slate-500 italic">No tests run yet.</div>
                        ) : (
                            testResults.map((test, idx) => (
                                <div
                                    key={idx}
                                    className={`p-3 rounded border ${test.passed ? "border-green-900/50 bg-green-950/10" : "border-red-900/50 bg-red-950/10"}`}
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        {test.passed ? (
                                            <CheckCircle className="w-4 h-4 text-green-400" />
                                        ) : (
                                            <AlertCircle className="w-4 h-4 text-red-400" />
                                        )}
                                        <span className={`font-semibold ${test.passed ? "text-green-400" : "text-red-400"}`}>
                                            Test Case {idx + 1}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs">
                                        <span className="text-slate-500">Input:</span>
                                        <span className="text-slate-300 font-mono">{test.input}</span>
                                        <span className="text-slate-500">Expected:</span>
                                        <span className="text-slate-300 font-mono">{test.expected}</span>
                                        <span className="text-slate-500">Actual:</span>
                                        <span className={`${test.passed ? "text-slate-300" : "text-red-300"} font-mono`}>{test.actual}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </TabsContent>
                </ScrollArea>
            </Tabs>
        </div>
    );
};
