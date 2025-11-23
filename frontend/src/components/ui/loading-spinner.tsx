import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
    className?: string;
    size?: "sm" | "md" | "lg" | "xl";
}

export function LoadingSpinner({ className, size = "md" }: LoadingSpinnerProps) {
    const sizeClasses = {
        sm: "h-4 w-4",
        md: "h-8 w-8",
        lg: "h-12 w-12",
        xl: "h-16 w-16"
    };

    return (
        <div className={cn("flex items-center justify-center", className)}>
            <Loader2 className={cn("animate-spin text-blue-500", sizeClasses[size])} />
        </div>
    );
}
