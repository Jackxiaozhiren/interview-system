"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface ProblemPanelProps {
    problem: {
        title: string;
        difficulty: string;
        description: string;
        tags?: string[];
        category?: string;
    };
}

export const ProblemPanel: React.FC<ProblemPanelProps> = ({ problem }) => {
    const getDifficultyColor = (diff: string) => {
        switch (diff.toLowerCase()) {
            case "easy": return "text-green-400 bg-green-400/10 border-green-400/20";
            case "medium": return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20";
            case "hard": return "text-red-400 bg-red-400/10 border-red-400/20";
            default: return "text-slate-400 bg-slate-400/10 border-slate-400/20";
        }
    };

    return (
        <div className="h-full flex flex-col bg-slate-900/50 backdrop-blur-sm border-r border-slate-800">
            <div className="p-6 border-b border-slate-800">
                <div className="flex items-center gap-3 mb-3">
                    <h1 className="text-xl font-bold text-slate-100">{problem.title}</h1>
                    <Badge variant="outline" className={`${getDifficultyColor(problem.difficulty)} border`}>
                        {problem.difficulty}
                    </Badge>
                </div>
                <div className="flex gap-2 flex-wrap">
                    {problem.category && (
                        <Badge variant="secondary" className="bg-slate-800 text-slate-400 hover:bg-slate-700">
                            {problem.category}
                        </Badge>
                    )}
                    {problem.tags?.map(tag => (
                        <Badge key={tag} variant="secondary" className="bg-slate-800 text-slate-400 hover:bg-slate-700">
                            {tag}
                        </Badge>
                    ))}
                </div>
            </div>

            <ScrollArea className="flex-1 p-6">
                <div className="prose prose-invert max-w-none prose-p:text-slate-300 prose-headings:text-slate-200 prose-pre:bg-slate-950 prose-pre:border prose-pre:border-slate-800">
                    {/* 
                        In a real app, we'd use a Markdown renderer here like react-markdown.
                        For now, we'll just render the text, assuming it's pre-formatted or simple.
                        If the description contains markdown, we should parse it.
                    */}
                    <div className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                        {problem.description}
                    </div>
                </div>
            </ScrollArea>
        </div>
    );
};
