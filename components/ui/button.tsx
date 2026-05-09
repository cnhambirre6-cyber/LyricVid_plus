import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Slot } from "@radix-ui/react-slot";
import { forwardRef } from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-studio text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-glow focus-visible:ring-offset-2 focus-visible:ring-offset-studio-bg disabled:pointer-events-none disabled:opacity-40 select-none",
  {
    variants: {
      variant: {
        primary:
          "bg-accent-gradient text-white shadow-glow-sm hover:shadow-glow hover:brightness-110 active:scale-[0.98]",
        secondary:
          "bg-studio-elevated border border-studio-border text-ink-primary hover:border-studio-ring hover:bg-studio-float active:scale-[0.98]",
        ghost:
          "text-ink-secondary hover:text-ink-primary hover:bg-studio-elevated active:scale-[0.98]",
        destructive:
          "bg-status-failed/10 border border-status-failed/30 text-status-failed hover:bg-status-failed/20 active:scale-[0.98]",
        outline:
          "border border-studio-border text-ink-primary hover:border-accent hover:text-ink-accent active:scale-[0.98]",
        link: "text-ink-accent underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-9 px-4",
        lg: "h-11 px-6 text-base",
        xl: "h-13 px-8 text-base font-semibold",
        icon: "h-9 w-9 p-0",
        "icon-sm": "h-7 w-7 p-0",
      },
    },
    defaultVariants: { variant: "secondary", size: "md" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
