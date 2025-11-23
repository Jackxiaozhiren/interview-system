"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

interface ResizablePanelGroupProps extends React.HTMLAttributes<HTMLDivElement> {
    direction?: "horizontal" | "vertical"
}

const ResizablePanelGroup = React.forwardRef<HTMLDivElement, ResizablePanelGroupProps>(
    ({ className, direction = "horizontal", ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    "flex",
                    direction === "horizontal" ? "flex-row" : "flex-col",
                    className
                )}
                {...props}
            />
        )
    }
)
ResizablePanelGroup.displayName = "ResizablePanelGroup"

interface ResizablePanelProps extends React.HTMLAttributes<HTMLDivElement> {
    defaultSize?: number
    minSize?: number
}

const ResizablePanel = React.forwardRef<HTMLDivElement, ResizablePanelProps>(
    ({ className, ...props }, ref) => {
        return <div ref={ref} className={cn("flex-1", className)} {...props} />
    }
)
ResizablePanel.displayName = "ResizablePanel"

interface ResizableHandleProps extends React.HTMLAttributes<HTMLDivElement> {
    withHandle?: boolean
}

const ResizableHandle = React.forwardRef<HTMLDivElement, ResizableHandleProps>(
    ({ className, withHandle, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn("w-px bg-border", className)}
                {...props}
            />
        )
    }
)
ResizableHandle.displayName = "ResizableHandle"

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }
