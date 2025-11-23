import React from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, X, Crown } from "lucide-react";

interface UpgradeModalProps {
    open: boolean;
    onClose: () => void;
    reason?: string;  // Why they need to upgrade
    feature?: string; // What feature they tried to access
}

const TIER_FEATURES = {
    free: [
        { text: "每月3次面试", included: true },
        { text: "专业面试官风格", included: true },
        { text: "基础反馈报告", included: true },
        { text: "语音AI面试官", included: false },
        { text: "AI答案优化", included: false },
        { text: "视频下载", included: false },
        { text: "所有面试官风格", included: false },
        { text: "双倍经验值", included: false },
    ],
    pro: [
        { text: "无限次面试", included: true },
        { text: "所有面试官风格", included: true },
        { text: "完整反馈报告", included: true },
        { text: "语音AI面试官", included: true },
        { text: "AI答案优化", included: true },
        { text: "视频下载", included: true },
        { text: "高级数据分析", included: true },
        { text: "双倍经验值加速", included: true },
    ],
};

export function UpgradeModal({ open, onClose, reason, feature }: UpgradeModalProps) {
    const router = useRouter();

    const handleUpgrade = () => {
        router.push("/pricing");
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
                        <Crown className="h-6 w-6 text-yellow-500" />
                        升级到专业版
                    </DialogTitle>
                    <DialogDescription className="text-slate-300">
                        {reason || "解锁所有高级功能，无限次面试练习"}
                    </DialogDescription>
                </DialogHeader>

                {/* Feature Comparison */}
                <div className="grid grid-cols-2 gap-4 my-6">
                    {/* Free Tier */}
                    <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
                        <h3 className="font-semibold text-white mb-3">免费版</h3>
                        <div className="space-y-2">
                            {TIER_FEATURES.free.map((feature, idx) => (
                                <div key={idx} className="flex items-start gap-2 text-sm">
                                    {feature.included ? (
                                        <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                    ) : (
                                        <X className="h-4 w-4 text-slate-600 mt-0.5 flex-shrink-0" />
                                    )}
                                    <span className={feature.included ? "text-slate-300" : "text-slate-600"}>
                                        {feature.text}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Pro Tier */}
                    <div className="p-4 bg-gradient-to-br from-blue-900/30 to-purple-900/30 rounded-lg border-2 border-blue-500 relative">
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                            <span className="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                                推荐
                            </span>
                        </div>
                        <h3 className="font-semibold text-white mb-3">专业版</h3>
                        <div className="space-y-2">
                            {TIER_FEATURES.pro.map((feature, idx) => (
                                <div key={idx} className="flex items-start gap-2 text-sm">
                                    <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                    <span className="text-white">
                                        {feature.text}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Price */}
                        <div className="mt-4 pt-4 border-t border-slate-600">
                            <div className="text-center">
                                <div className="text-3xl font-bold text-white">
                                    ¥99<span className="text-sm font-normal text-slate-400">/月</span>
                                </div>
                                <div className="text-xs text-slate-400 mt-1">
                                    或 ¥990/年（相当于2个月免费）
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* CTA */}
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800"
                    >
                        稍后再说
                    </Button>
                    <Button
                        onClick={handleUpgrade}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold"
                    >
                        <Crown className="mr-2 h-4 w-4" />
                        立即升级
                    </Button>
                </div>

                {/* Trust Indicators */}
                <div className="mt-4 text-center text-xs text-slate-500">
                    <p>✓ 30天无理由退款 ✓ 安全支付 ✓ 随时取消</p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
