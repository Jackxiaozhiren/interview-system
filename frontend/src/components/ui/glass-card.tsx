import { cn } from "@/lib/utils";
import React from "react";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    className?: string;
    gradient?: boolean;
}

export function GlassCard({ children, className, gradient = false, ...props }: GlassCardProps) {
    return (
        <div
            className={cn(
                "relative overflow-hidden rounded-xl border border-white/20 bg-white/10 backdrop-blur-md shadow-xl transition-all duration-300 hover:shadow-2xl hover:bg-white/15 dark:bg-black/20 dark:border-white/10 dark:hover:bg-black/30",
                gradient && "bg-gradient-to-br from-white/10 to-white/5 dark:from-white/5 dark:to-transparent",
                className
            )}
            {...props}
        >
            {gradient && (
                <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-50" />
            )}
            {children}
        </div>
    );
}
