"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { SettingsForm } from "./agent-settings-form"
import { SettingsIcon} from 'lucide-react';
import { Separator } from "@/components/ui/separator"

export function AgentSettingsDialog() {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
      <Button variant="outline"  aria-label="Configure">
          Configure<SettingsIcon />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Agent Settings</SheetTitle>
          <SheetDescription>
            Configure the search strategies and preferences for your title research agent.
          </SheetDescription>
        </SheetHeader>
        <div className="px-4">
        <SettingsForm onSuccess={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  )
}
