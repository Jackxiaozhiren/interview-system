"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight, Sparkles } from "lucide-react";

interface OnboardingStep {
    title: string;
    description: string;
    icon: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
    {
        title: "欢迎来到AI面试系统",
        description: "让AI帮你成为面试高手",
        icon: "👋"
    },
    {
        title: "智能匹配分析",
        description: "上传简历，我们会分析你与岗位的匹配度",
        icon: "🎯"
    },
    {
        title: "真实模拟面试",
        description: "AI面试官会像真人一样提问，还能语音播报哦",
        icon: "🎙️"
    },
    {
        title: "精准反馈改进",
        description: "查看视频复盘，AI会告诉你哪里可以改进",
        icon: "📹"
    },
    {
        title: "游戏化成长",
        description: "获得经验值、解锁徽章，记录你的进步",
        icon: "🎮"
    }
];

export default function OnboardingPage() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(0);

    const handleNext = () => {
        if (currentStep < ONBOARDING_STEPS.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            // Mark onboarding as complete and redirect
            localStorage.setItem("onboarding_completed", "true");
            router.push("/interview/setup");
        }
    };

    const handleSkip = () => {
        localStorage.setItem("onboarding_completed", "true");
        router.push("/interview/setup");
    };

    const step = ONBOARDING_STEPS[currentStep];
    const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-purple-950 flex items-center justify-center p-6">
            <Card className="w-full max-w-2xl bg-slate-900/80 backdrop-blur border-slate-700">
                <CardContent className="p-8">
                    {/* Progress Indicators */}
                    <div className="flex justify-center gap-2 mb-8">
                        {ONBOARDING_STEPS.map((_, idx) => (
                            <div
                                key={idx}
                                className={`h-2 rounded-full transition-all duration-300 ${idx === currentStep
                                        ? "w-8 bg-blue-500"
                                        : idx < currentStep
                                            ? "w-2 bg-green-500"
                                            : "w-2 bg-slate-700"
                                    }`}
                            />
                        ))}
                    </div>

                    {/* Step Content */}
                    <div className="text-center mb-8 animate-in fade-in duration-300">
                        {/* Icon */}
                        <div className="text-8xl mb-6">{step.icon}</div>

                        {/* Title */}
                        <h1 className="text-3xl font-bold text-white mb-4">
                            {step.title}
                        </h1>

                        {/* Description */}
                        <p className="text-lg text-slate-300 max-w-md mx-auto">
                            {step.description}
                        </p>
                    </div>

                    {/* Features List (for last step) */}
                    {isLastStep && (
                        <div className="mb-8 space-y-2">
                            <div className="flex items-center gap-2 text-sm text-slate-300">
                                <Check className="h-4 w-4 text-green-500" />
                                <span>免费用户每月3次面试机会</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-300">
                                <Check className="h-4 w-4 text-green-500" />
                                <span>升级专业版享受无限次面试</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-300">
                                <Check className="h-4 w-4 text-green-500" />
                                <span>邀请好友注册，双方都能获得奖励</span>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3">
                        {!isLastStep && (
                            <Button
                                variant="ghost"
                                onClick={handleSkip}
                                className="flex-1 text-slate-400 hover:text-white"
                            >
                                跳过
                            </Button>
                        )}
                        <Button
                            onClick={handleNext}
                            className={`${isLastStep ? "w-full" : "flex-1"
                                } bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700`}
                        >
                            {isLastStep ? (
                                <>
                                    <Sparkles className="mr-2 h-4 w-4" />
                                    开始我的第一次面试
                                </>
                            ) : (
                                <>
                                    下一步
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </>
                            )}
                        </Button>
                    </div>

                    {/* Skip Text */}
                    {isLastStep && (
                        <p className="text-center text-xs text-slate-500 mt-4">
                            阅读完引导后就可以开始啦
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
