import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Check } from "lucide-react";

interface Personality {
    id: string;
    name: string;
    name_en: string;
    description: string;
}

interface PersonalitySelectorProps {
    onSelect: (personalityId: string) => void;
    selectedId?: string;
}

const PERSONALITIES: Personality[] = [
    {
        id: "friendly",
        name: "友善导师",
        name_en: "Friendly Mentor",
        description: "温和鼓励，适合新手练习"
    },
    {
        id: "professional",
        name: "专业面试官",
        name_en: "Professional Interviewer",
        description: "中性专业，标准化流程"
    },
    {
        id: "challenging",
        name: "挑战型面试官",
        name_en: "Challenging Interviewer",
        description: "深入追问，压力测试"
    }
];

export function PersonalitySelector({ onSelect, selectedId = "professional" }: PersonalitySelectorProps) {
    const [selected, setSelected] = useState(selectedId);

    const handleSelect = (id: string) => {
        setSelected(id);
        onSelect(id);
    };

    const getIcon = (id: string) => {
        switch (id) {
            case "friendly": return "😊";
            case "professional": return "😐";
            case "challenging": return "🤨";
            default: return "😐";
        }
    };

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">选择面试官风格</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {PERSONALITIES.map((personality) => (
                    <Card
                        key={personality.id}
                        className={`cursor-pointer transition-all duration-200 ${selected === personality.id
                                ? "border-blue-500 bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                                : "border-slate-700 bg-slate-900 hover:border-slate-600 hover:bg-slate-800"
                            }`}
                        onClick={() => handleSelect(personality.id)}
                    >
                        <CardContent className="p-6 relative">
                            {/* Selection Indicator */}
                            {selected === personality.id && (
                                <div className="absolute top-3 right-3">
                                    <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                                        <Check className="w-4 h-4 text-white" />
                                    </div>
                                </div>
                            )}

                            {/* Icon */}
                            <div className="text-5xl mb-3">
                                {getIcon(personality.id)}
                            </div>

                            {/* Name */}
                            <h4 className="font-semibold text-white mb-1">
                                {personality.name}
                            </h4>
                            <p className="text-xs text-slate-500 mb-2">
                                {personality.name_en}
                            </p>

                            {/* Description */}
                            <p className="text-sm text-slate-400">
                                {personality.description}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
