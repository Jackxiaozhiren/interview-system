import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Building2, Cpu, Briefcase, Monitor } from "lucide-react";

export type BackgroundType = "office" | "tech_lab" | "executive" | "minimal";

interface BackgroundSwitcherProps {
    currentBg: BackgroundType;
    onSelect: (bg: BackgroundType) => void;
}

export function BackgroundSwitcher({ currentBg, onSelect }: BackgroundSwitcherProps) {
    const backgrounds: { id: BackgroundType; label: string; icon: React.ReactNode }[] = [
        { id: "office", label: "Modern Office", icon: <Building2 className="w-4 h-4" /> },
        { id: "tech_lab", label: "Tech Lab", icon: <Cpu className="w-4 h-4" /> },
        { id: "executive", label: "Executive Suite", icon: <Briefcase className="w-4 h-4" /> },
        { id: "minimal", label: "Focus Mode", icon: <Monitor className="w-4 h-4" /> },
    ];

    return (
        <GlassCard className="p-2 flex gap-2">
            {backgrounds.map((bg) => (
                <Button
                    key={bg.id}
                    variant={currentBg === bg.id ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => onSelect(bg.id)}
                    className={`text-xs flex items-center gap-2 ${currentBg === bg.id ? "bg-white/20" : "text-slate-400 hover:text-white hover:bg-white/10"}`}
                >
                    {bg.icon}
                    <span className="hidden md:inline">{bg.label}</span>
                </Button>
            ))}
        </GlassCard>
    );
}
