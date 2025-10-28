"use client"

import { useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

export interface LogEntry {
  id: string
  timestamp: Date
  message: string
  type?: "info" | "success" | "warning" | "error"
}

interface TaskLogProps {
  logs: LogEntry[]
  className?: string
  maxHeight?: string
  autoScroll?: boolean
}

export function TaskLog({ logs, className, maxHeight = "400px", autoScroll = true }: TaskLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new logs are added
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [logs, autoScroll])

  const formatTimestamp = (timestamp: Date) => {
    const hours = timestamp.getHours().toString().padStart(2, "0")
    const minutes = timestamp.getMinutes().toString().padStart(2, "0")
    const seconds = timestamp.getSeconds().toString().padStart(2, "0")
    const milliseconds = timestamp.getMilliseconds().toString().padStart(3, "0")
    return `${hours}:${minutes}:${seconds}.${milliseconds}`
  }

  const getTypeColor = (type?: string) => {
    switch (type) {
      case "success":
        return "text-green-400"
      case "warning":
        return "text-yellow-400"
      case "error":
        return "text-red-400"
      default:
        return "text-green-300"
    }
  }

  return (
    <div className={cn("bg-black border border-gray-800 rounded-lg overflow-hidden", className)}>
      <div ref={scrollRef} className="p-4 overflow-y-auto font-mono text-sm leading-relaxed" style={{ maxHeight }}>
        {logs.map((log) => (
          <div key={log.id} className={cn("whitespace-pre-wrap wrap-break-word", getTypeColor(log.type))}>
            <span className="text-gray-400">[{formatTimestamp(log.timestamp)}]</span> {log.message}
          </div>
        ))}
        {logs.length === 0 && <div className="text-gray-500 italic">No logs to display...</div>}
      </div>
    </div>
  )
}

// Hook for managing log entries
export function useTaskLog() {
  const [logs, setLogs] = useState<LogEntry[]>([])

  const addLog = (message: string, type?: LogEntry["type"]) => {
    const newLog: LogEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      message,
      type,
    }
    setLogs((prev) => [...prev, newLog])
  }

  const clearLogs = () => {
    setLogs([])
  }

  return {
    logs,
    addLog,
    clearLogs,
  }
}
