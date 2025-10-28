import { cn } from "@/lib/utils"
import { TypewriterText } from "./typewrter"

interface TaskLogEntryProps {
  log: LogEntry
  className?: string
  delay?: number; // Animation delay in milliseconds
}

export interface LogEntry {
    id: string
    message: string
    type?: "info" | "success" | "warning" | "error" | "description"
  }
  

export function TaskLogEntry({ log, className, delay = 0 }: TaskLogEntryProps) {

  const getTypeColor = (type?: string) => {
    switch (type) {
    case "info":
        return "text-foreground"
      case "success":
        return "text-green-400"
      case "warning":
        return "text-yellow-400"
      case "error":
        return "text-red-400"
      default:
        return "text-foreground font-bold"
    }
  }

  return (
    <div className={cn("whitespace-pre-wrap wrap-break-word ", getTypeColor(log.type), className)}>
      <TypewriterText text={log.message} delay={delay}/>
    </div>
  )
}
