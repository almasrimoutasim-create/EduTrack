import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-white shadow-md hover:bg-primary/90 hover:shadow-lg",
        destructive:
          "bg-rose-600 text-white shadow-sm hover:bg-rose-700",
        outline:
          "border-2 border-stone-300 bg-white shadow-sm hover:bg-stone-50 hover:border-stone-400 hover:shadow",
        secondary:
          "bg-stone-100 text-stone-800 shadow-sm hover:bg-stone-200",
        ghost: "hover:bg-stone-100 hover:text-stone-900",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-5 py-2",
        sm: "h-9 rounded-lg px-3 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

/** @type {any} */
const Button = React.forwardRef(
  /** @param {any} props */
  ({ className, variant = "default", size = "default", asChild = false, children, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  const isOutline = variant === "outline"
  const isGhost = variant === "ghost"
  const isSecondary = variant === "secondary"
  const isDestructive = variant === "destructive"
  const hasText = typeof children === 'string' || (Array.isArray(children) && children.some(c => typeof c === 'string'))
  
  const textColor = (isOutline || isGhost || isSecondary) ? "#1c1917" : "#ffffff"
  
  return (
    (<Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      style={{ color: textColor }}
      {...props} />)
  );
})
Button.displayName = "Button"

export { Button, buttonVariants }
