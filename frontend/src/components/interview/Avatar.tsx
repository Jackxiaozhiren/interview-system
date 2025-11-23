import React, { useEffect, useState } from "react";
import { PenLine } from "lucide-react";

export type AvatarState = "idle" | "listening" | "nodding" | "taking_notes";

interface AvatarProps {
    state: AvatarState;
    className?: string;
}

export function Avatar({ state, className }: AvatarProps) {
    const [animationClass, setAnimationClass] = useState("");

    useEffect(() => {
        switch (state) {
            case "nodding":
                setAnimationClass("animate-bounce");
                break;
            case "listening":
                setAnimationClass("animate-pulse");
                break;
            case "taking_notes":
                setAnimationClass("scale-105");
                break;
            default:
                setAnimationClass("");
        }
    }, [state]);

    return (
        <div className={`relative ${className}`}>
            {/* Base Avatar Circle */}
            <div
                className={`w-24 h-24 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 mx-auto shadow-[0_0_30px_rgba(37,99,235,0.5)] transition-all duration-500 ease-in-out ${animationClass}`}
            >
                {/* Face/Eyes (Simple Abstraction) */}
                <div className="absolute top-1/3 left-1/4 w-2 h-2 bg-white/50 rounded-full"></div>
                <div className="absolute top-1/3 right-1/4 w-2 h-2 bg-white/50 rounded-full"></div>
            </div>

            {/* Status Label */}
            <div className="mt-3 text-center">
                <p className="text-slate-400 text-sm font-medium transition-all duration-300">
                    {state === "taking_notes" ? (
                        <span className="text-blue-400 flex items-center justify-center gap-1">
                            <PenLine className="w-3 h-3" /> Taking Notes...
                        </span>
                    ) : (
                        "AI Interviewer"
                    )}
                </p>
            </div>

            {/* Note Taking Overlay Icon */}
            {state === "taking_notes" && (
                <div className="absolute -right-4 top-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="bg-white text-blue-600 p-2 rounded-full shadow-lg">
                        <PenLine className="w-5 h-5" />
                    </div>
                </div>
            )}
        </div>
    );
}
