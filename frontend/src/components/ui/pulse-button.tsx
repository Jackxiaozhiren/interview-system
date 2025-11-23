import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
    "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden",
    {
        variants: {
            variant: {
                default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25",
                destructive:
                    "bg-destructive text-destructive-foreground hover:bg-destructive/90",
                outline:
                    "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
                secondary:
                    "bg-secondary text-secondary-foreground hover:bg-secondary/80",
                ghost: "hover:bg-accent hover:text-accent-foreground",
                link: "text-primary underline-offset-4 hover:underline",
                glass: "bg-white/20 backdrop-blur-sm border border-white/20 hover:bg-white/30 text-foreground shadow-sm",
            },
            size: {
                default: "h-10 px-4 py-2",
                sm: "h-9 rounded-md px-3",
                lg: "h-11 rounded-md px-8",
                icon: "h-10 w-10",
            },
            pulse: {
                true: "animate-pulse-subtle",
                false: "",
            }
        },
        defaultVariants: {
            variant: "default",
            size: "default",
            pulse: false,
        },
    }
)

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    asChild?: boolean
}

const PulseButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, pulse, asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : "button"
        return (
            <Comp
                className={cn(buttonVariants({ variant, size, pulse, className }))}
                ref={ref}
                {...props}
            >
                {pulse && (
                    <span className="absolute inset-0 rounded-md ring-2 ring-primary/50 animate-ping opacity-75 duration-1000" />
                )}
                <span className="relative z-10 flex items-center gap-2">
                    {props.children}
                </span>
            </Comp>
        )
    }
)
PulseButton.displayName = "PulseButton"

export { PulseButton, buttonVariants }
