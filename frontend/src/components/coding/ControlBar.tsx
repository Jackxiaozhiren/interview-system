"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Send, Lightbulb, Loader2 } from "lucide-react";
import { PulseButton } from "@/components/ui/pulse-button";

interface ControlBarProps {
    language: string;
    onLanguageChange: (lang: string) => void;
    onRun: () => void;
    onSubmit: () => void;
    onHint: () => void;
    isRunning: boolean;
    isSubmitting: boolean;
}

export const ControlBar: React.FC<ControlBarProps> = ({
    language,
    onLanguageChange,
    onRun,
    onSubmit,
    onHint,
    isRunning,
    isSubmitting
}) => {
    return (
        <div className="h-14 border-b border-slate-800 bg-[#1e1e1e] flex items-center justify-between px-4">
            <div className="flex items-center gap-4">
                <Select value={language} onValueChange={onLanguageChange}>
                    <SelectTrigger className="w-[140px] bg-slate-800 border-slate-700 text-slate-200">
                        <SelectValue placeholder="Language" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700 text-slate-200">
                        <SelectItem value="python">Python</SelectItem>
                        <SelectItem value="javascript">JavaScript</SelectItem>
                        <SelectItem value="java">Java</SelectItem>
                        <SelectItem value="cpp">C++</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="flex items-center gap-3">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onHint}
                    className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-400/10"
                >
                    <Lightbulb className="w-4 h-4 mr-2" />
                    Get Hint
                </Button>

                <Button
                    variant="secondary"
                    size="sm"
                    onClick={onRun}
                    disabled={isRunning || isSubmitting}
                    className="bg-slate-700 hover:bg-slate-600 text-slate-200"
                >
                    {isRunning ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                        <Play className="w-4 h-4 mr-2 fill-current" />
                    )}
                    Run Code
                </Button>

                <PulseButton
                    size="sm"
                    onClick={onSubmit}
                    disabled={isRunning || isSubmitting}
                    pulse={!isSubmitting}
                    className="bg-green-600 hover:bg-green-500 text-white border-none"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            Submitting...
                        </>
                    ) : (
                        <>
                            Submit Solution <Send className="w-4 h-4 ml-2" />
                        </>
                    )}
                </PulseButton>
            </div>
        </div>
    );
};
