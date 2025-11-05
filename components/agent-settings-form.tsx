"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import {
    Field,
    FieldContent,
    FieldDescription,
    FieldError,
    FieldGroup,
    FieldLabel,
    FieldLegend,
    FieldSeparator,
    FieldSet,
    FieldTitle,
  } from "@/components/ui/field"

import { Switch } from "@/components/ui/switch"

interface AgentSettingsFormProps {
  onSuccess?: () => void
}

export function SettingsForm({ onSuccess }: AgentSettingsFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    company: "",
    jobTitle: "",
    bio: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // This is a placeholder that demonstrates the integration pattern
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error("Failed to save settings")
      }

    //   toast({
    //     title: "Success",
    //     description: "Your settings have been saved.",
    //   })

      onSuccess?.()
    } catch (error) {
      console.error("Error saving settings:", error)
    //   toast({
    //     title: "Error",
    //     description: "Failed to save your settings. Please try again.",
    //     variant: "destructive",
    //   })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
        <FieldSet>
        <FieldGroup>
        <FieldSeparator>PropertySync Credentials</FieldSeparator>
            <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input id="email" autoComplete="off" placeholder="m@example.com" />
            </Field>
            <Field>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Input id="password" autoComplete="off"  />
            </Field>
            <FieldDescription>
                    The agent needs your PropertySync email and password to search on your behalf.
                </FieldDescription>
            <FieldSeparator>Permissions</FieldSeparator>
            <Field orientation="horizontal">
                <FieldContent>
                <FieldLabel htmlFor="2fa">Create Orders</FieldLabel>
                <FieldDescription>
                    Allow the agent to create orders on your behalf in PropertySync.
                </FieldDescription>
                </FieldContent>
                <Switch id="2fa" />
            </Field>
            <FieldSeparator />
        </FieldGroup>
        <Field orientation="horizontal">
            <Button type="submit" className="w-full">Save</Button>
          </Field>
        </FieldSet>
    </form>
  )
}
