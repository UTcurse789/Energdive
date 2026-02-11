import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";


// Since I haven't installed class-variance-authority yet, I'll use a simpler approach or install it. 
// Given the prompt "No external UI libraries" usually refers to component libraries like MUI/Chakra, 
// but utility libraries are often okay. However, to be safe and stick to "No external UI libraries" strictly unless needed,
// I will implement a custom button component without cva if I can, OR I will install it.
// Actually, I'll just use standard template literals and props for now to keep it dependency-light as per strict interpretation, 
// though cva is standard in Shadcn-like setups. I'll stick to manual clsx for simplicity and robustness.

// simplified props
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "outline" | "ghost" | "link";
    size?: "sm" | "md" | "lg";
    fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "primary", size = "md", fullWidth = false, ...props }, ref) => {

        const baseStyles = "inline-flex items-center justify-center rounded-none font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";

        const variants = {
            primary: "bg-primary text-primary-foreground hover:bg-primary/90",
            secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
            outline: "border border-input bg-transparent hover:bg-accent hover:text-accent-foreground",
            ghost: "hover:bg-accent hover:text-accent-foreground",
            link: "text-primary underline-offset-4 hover:underline",
        };

        const sizes = {
            sm: "h-9 px-3 text-xs",
            md: "h-10 px-4 py-2",
            lg: "h-12 px-8 text-lg",
        };

        return (
            <button
                ref={ref}
                className={cn(
                    baseStyles,
                    variants[variant],
                    sizes[size],
                    fullWidth && "w-full",
                    className
                )}
                {...props}
            />
        );
    }
);
Button.displayName = "Button";

export { Button };
