import type React from "react"
import { ScrollArea } from "@/components/ui/scroll-area"

// Reusable component with built-in masks
export function MaskedScrollArea({
    children,
    className,
    maskHeight = "h-16",
  }: {
    children: React.ReactNode
    className?: string
    maskHeight?: string
  }) {
    return (
      <div className="relative">
        <div
          className={`pointer-events-none absolute left-0 right-0 top-0 z-10 ${maskHeight} bg-gradient-to-b from-background to-transparent`}
        />
        <ScrollArea className={className}>
          {children}
        </ScrollArea>
        <div
          className={`pointer-events-none absolute bottom-0 left-0 right-0 z-10 ${maskHeight} bg-gradient-to-t from-background to-transparent`}
        />
      </div>
    )
  }