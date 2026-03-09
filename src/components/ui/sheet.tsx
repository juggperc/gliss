"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { XIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

function Sheet(props: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="sheet" {...props} />
}

function SheetTrigger(props: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

function SheetClose(props: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="sheet-close" {...props} />
}

function SheetPortal(props: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="sheet-portal" {...props} />
}

function SheetOverlay({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="sheet-overlay"
      className={cn("fixed inset-0 z-50 bg-slate-950/18 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0", className)}
      {...props}
    />
  )
}

const sheetVariants: Record<"top" | "right" | "bottom" | "left", string> = {
  top: "inset-x-0 top-0 border-b data-[state=open]:slide-in-from-top-10 data-[state=closed]:slide-out-to-top-10",
  right: "inset-y-0 right-0 h-full w-full border-l sm:max-w-xl data-[state=open]:slide-in-from-right-10 data-[state=closed]:slide-out-to-right-10",
  bottom: "inset-x-0 bottom-0 border-t data-[state=open]:slide-in-from-bottom-10 data-[state=closed]:slide-out-to-bottom-10",
  left: "inset-y-0 left-0 h-full w-full border-r sm:max-w-sm data-[state=open]:slide-in-from-left-10 data-[state=closed]:slide-out-to-left-10",
}

function SheetContent({ className, children, side = "right", showCloseButton = true, ...props }: React.ComponentProps<typeof DialogPrimitive.Content> & { side?: "top" | "right" | "bottom" | "left"; showCloseButton?: boolean }) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <DialogPrimitive.Content
        data-slot="sheet-content"
        className={cn(
          "fixed z-50 flex flex-col gap-4 border-border/70 bg-background/98 p-4 shadow-[0_24px_80px_rgba(15,23,42,0.18)] transition ease-in-out data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
          sheetVariants[side],
          className,
        )}
        {...props}
      >
        {children}
        {showCloseButton ? (
          <DialogPrimitive.Close asChild>
            <Button type="button" variant="ghost" size="icon-sm" className="absolute right-3 top-3 rounded-full">
              <XIcon className="size-4" />
              <span className="sr-only">Close</span>
            </Button>
          </DialogPrimitive.Close>
        ) : null}
      </DialogPrimitive.Content>
    </SheetPortal>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="sheet-header" className={cn("flex flex-col gap-1.5", className)} {...props} />
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="sheet-footer" className={cn("mt-auto flex flex-col gap-2", className)} {...props} />
}

function SheetTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return <DialogPrimitive.Title data-slot="sheet-title" className={cn("text-lg font-semibold", className)} {...props} />
}

function SheetDescription({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return <DialogPrimitive.Description data-slot="sheet-description" className={cn("text-sm leading-7 text-muted-foreground", className)} {...props} />
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
