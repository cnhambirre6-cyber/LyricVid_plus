import { cn } from "@/lib/utils";
import { forwardRef } from "react";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "input-base min-h-[80px] resize-y py-2 text-sm leading-relaxed",
      className
    )}
    {...props}
  />
));
textarea.displayName = "Textarea";

export { Textarea };
