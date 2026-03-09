"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "touch-manipulation inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] outline-none will-change-transform active:scale-[0.985] focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 disabled:active:scale-100 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-[0_10px_24px_rgba(15,23,42,0.10)] hover:bg-primary/90 hover:shadow-[0_14px_30px_rgba(15,23,42,0.14)]",
        outline: "border border-border bg-background/88 text-foreground shadow-[0_6px_16px_rgba(15,23,42,0.06)] hover:bg-muted/70 hover:shadow-[0_10px_22px_rgba(15,23,42,0.10)]",
        secondary: "bg-secondary text-secondary-foreground shadow-[0_8px_18px_rgba(15,23,42,0.08)] hover:bg-secondary/85 hover:shadow-[0_12px_24px_rgba(15,23,42,0.10)]",
        ghost: "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
        destructive: "bg-destructive text-white shadow-sm hover:bg-destructive/90",
        link: "text-primary underline-offset-4 hover:underline",
        aurora: "aurora-button text-white",
        "aurora-muted": "aurora-button aurora-button-muted text-white/90",
      },
      size: {
        default: "h-11 px-4 py-2 sm:h-10",
        xs: "h-7 rounded-[0.85rem] px-2.5 text-xs",
        sm: "h-10 rounded-[0.95rem] px-3 text-sm sm:h-8",
        lg: "h-11 rounded-xl px-5 text-sm",
        icon: "size-10",
        "icon-xs": "size-10 rounded-[0.95rem] sm:size-8",
        "icon-sm": "size-10 rounded-[0.95rem] sm:size-9",
        "icon-lg": "size-11 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button"

  return <Comp data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />
}

export { Button, buttonVariants }
