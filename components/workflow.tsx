import { memo, type ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { TypewriterText } from "./typewrter";
import { Card } from "@/components/ui/card"
import {
    CheckIcon,
    DotIcon,
    Loader2Icon,
    TriangleAlertIcon,
    type LucideIcon,
  } from "lucide-react";


export type WorkflowProps = ComponentProps<"div"> & {
    icon?: LucideIcon;
    label: string;
    description?: string;
    status?: "complete" | "active" | "pending" | "failed",
    content?: { type: 'text' | 'list' | 'results', value: any }
  };



  export const Workflow = memo(
    ({
      className,
      icon: Icon = DotIcon,
      label,
      description,
      content,
      status = "complete",
      children,
      ...props
    }: WorkflowProps) => {
      const statusStyles = {
        complete: "text-foreground",
        active: "text-foreground",
        pending: "text-muted-foreground/50",
        failed: "text-rose-400"
      };
  
      let DisplayIcon;
  
      switch (status) {
        case "active":
          DisplayIcon = Loader2Icon;
          break;
        case "pending":
          DisplayIcon = DotIcon;
          break;
          case "complete":
          DisplayIcon = CheckIcon;
          break;
          case "failed":
          DisplayIcon = TriangleAlertIcon;
          break;
        default:
          DisplayIcon = Icon;
          break;
      }
  
      return (

        <Card>
        <div
        className={cn(
          "flex gap-2 text-base",
          statusStyles[status],
          "fade-in-0 slide-in-from-top-2 animate-in px-6",
          className
        )}
        {...props}
      >
        <div className="relative mt-0.5">
        <DisplayIcon className={cn("size-5", (status === "active") && "animate-spin")} />
          <div className="-mx-px absolute top-7 bottom-0 left-1/2 w-px bg-border" />
        </div>
        <div className="flex-1 space-y-2">
          <div>
            <span className="font-bold">{label}</span>
          {/* <TypewriterText text={label} className="font-bold"/> */}
          </div>
          {description && (
            <div className="text-muted-foreground text-base italic">
              <TypewriterText text={description} className="text-muted-foreground text-base italic" delay={(200)}/>
            </div>
          )}

            {content && (
            <div className="mt-2">
                {content.type === 'text' && <p>{content.value}</p>}
                {content.type === 'list' && (
                <ul className="list-disc list-inside">
                    {content.value.map((item: string, i: number) => (
                    <li key={i}>{item}</li>
                    ))}
                </ul>
                )}
                {content.type === 'results' && (
                <pre className="text-sm">{JSON.stringify(content.value, null, 2)}</pre>
                )}
            </div>
            )}
          {children}
        </div>
      </div>
      </Card>
      );
    }
  );
  
  Workflow.displayName = 'Workflow';