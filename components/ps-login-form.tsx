"use client";

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Shimmer } from '@/components/ai-elements/shimmer';

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Spinner } from "./ui/spinner";
import { MailIcon, KeyRound, RefreshCcwDot } from "lucide-react"

interface LoginFormProps extends React.ComponentProps<"div"> {
  onLogin: (email: string, password: string) => Promise<void>
}

export function LoginForm({
  className,
  onLogin,
  ...props
}: LoginFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

 
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      await onLogin(email, password)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
          <form onSubmit={handleSubmit} className="py-6 px-2 mt-10">
            <FieldGroup>
            <FieldDescription>Sync your PropertySync account.</FieldDescription>
            <div className="grid grid-cols-[1fr_1fr_40px] gap-4">
              <Field>
                <InputGroup>
                <InputGroupInput id="email"
                  type="email"
                  placeholder="m@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required />
                <InputGroupAddon>
                <MailIcon />
                </InputGroupAddon>
              </InputGroup>
              </Field>
              <Field>
              <InputGroup>
                <InputGroupInput 
                  id="password"
                  type="password"
                  placeholder="ABC123"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading} />
                <InputGroupAddon>
                <KeyRound />
                </InputGroupAddon>
              </InputGroup>
              </Field>
              <Field>
              <Button type="submit" className="max-w-sm" disabled={isLoading}>
                  {isLoading ? <Spinner/> : <RefreshCcwDot />}
                </Button>
              </Field>
            </div>
            </FieldGroup>
          </form>
  )
}
