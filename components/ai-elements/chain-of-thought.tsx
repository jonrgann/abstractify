"use client";

import { useControllableState } from "@radix-ui/react-use-controllable-state";
import { Badge } from "@/components/ui/badge";
import { TypewriterText } from "../typewrter";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import {
  BrainIcon,
  ChevronDownIcon,
  DotIcon,
  LoaderIcon,
  Loader2Icon,
  CheckIcon,
  TriangleAlertIcon,
  type LucideIcon,
} from "lucide-react";
import type { ComponentProps } from "react";
import { createContext, memo, useContext } from "react";

type ChainOfThoughtContextValue = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
};

const ChainOfThoughtContext = createContext<ChainOfThoughtContextValue | null>(
  null
);

const useChainOfThought = () => {
  const context = useContext(ChainOfThoughtContext);
  if (!context) {
    throw new Error(
      "ChainOfThought components must be used within ChainOfThought"
    );
  }
  return context;
};

export type ChainOfThoughtProps = ComponentProps<"div"> & {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export const ChainOfThought = memo(
  ({
    className,
    open,
    defaultOpen = false,
    onOpenChange,
    children,
    ...props
  }: ChainOfThoughtProps) => {
    const [isOpen, setIsOpen] = useControllableState({
      prop: open,
      defaultProp: defaultOpen,
      onChange: onOpenChange,
    });

    return (
      <ChainOfThoughtContext.Provider value={{ isOpen, setIsOpen }}>
        <div
          className={cn("not-prose max-w-prose space-y-4", className)}
          {...props}
        >
          {children}
        </div>
      </ChainOfThoughtContext.Provider>
    );
  }
);

export type ChainOfThoughtHeaderProps = ComponentProps<
  typeof CollapsibleTrigger
>;

export const ChainOfThoughtHeader = memo(
  ({ className, children, ...props }: ChainOfThoughtHeaderProps) => {
    const { isOpen, setIsOpen } = useChainOfThought();

    return (
      <Collapsible onOpenChange={setIsOpen} open={isOpen}>
        <CollapsibleTrigger
          className={cn(
            "flex w-full items-center gap-2 text-muted-foreground text-base transition-colors hover:text-foreground",
            className
          )}
          {...props}
        >
          <BrainIcon className="size-4" />
          <span className="flex-1 text-left">
            {children ?? "Chain of Thought"}
          </span>
          <ChevronDownIcon
            className={cn(
              "size-4 transition-transform",
              isOpen ? "rotate-180" : "rotate-0"
            )}
          />
        </CollapsibleTrigger>
      </Collapsible>
    );
  }
);

export type ChainOfThoughtStepProps = ComponentProps<"div"> & {
  icon?: LucideIcon;
  label: string;
  description?: string;
  status?: "complete" | "active" | "pending" | "failed"
};

export const ChainOfThoughtStep = memo(
  ({
    className,
    icon: Icon = DotIcon,
    label,
    description,
    status = "complete",
    children,
    ...props
  }: ChainOfThoughtStepProps) => {
    const statusStyles = {
      complete: "text-foreground",
      active: "text-foreground",
      pending: "text-muted-foreground/50",
      failed: "text-rose-400"
    };

    let DisplayIcon;

    switch (status) {
      case "active":
        DisplayIcon = LoaderIcon;
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
      <div
        className={cn(
          "flex gap-2 text-base",
          statusStyles[status],
          "fade-in-0 slide-in-from-top-2 animate-in",
          className
        )}
        {...props}
      >
        <div className="relative mt-0.5">
        <DisplayIcon className={cn("size-4", (status === "active") && "animate-spin")} />
          <div className="-mx-px absolute top-7 bottom-0 left-1/2 w-px bg-border" />
        </div>
        <div className="flex-1 space-y-2">
          <div>
          <TypewriterText text={label} className=""/>
          </div>
          {description && (
            <div className="text-muted-foreground text-base italic">
              <TypewriterText text={description} className="text-muted-foreground text-base italic" delay={(200)}/>
            </div>
          )}
          {children}
        </div>
      </div>
    );
  }
);

export type ChainOfThoughtSearchResultsProps = ComponentProps<"div">;

export const ChainOfThoughtSearchResults = memo(
  ({ className, ...props }: ChainOfThoughtSearchResultsProps) => (
    <div className={cn("flex flex-col gap-2", className)} {...props} />
  )
);

export type ChainOfThoughtSearchResultProps = ComponentProps<typeof Badge>;

export const ChainOfThoughtSearchResult = memo(
  ({ className, children, ...props }: ChainOfThoughtSearchResultProps) => (
    <Badge
      className={cn("gap-1 px-2 py-0.5 font-normal text-xs", className)}
      variant="secondary"
      {...props}
    >
      {children}
    </Badge>
  )
);

export type ChainOfThoughtContentProps = ComponentProps<
  typeof CollapsibleContent
>;

export const ChainOfThoughtContent = memo(
  ({ className, children, ...props }: ChainOfThoughtContentProps) => {
    const { isOpen } = useChainOfThought();

    return (
      <Collapsible open={isOpen}>
        <CollapsibleContent
          className={cn(
            "mt-2 space-y-3",
            "data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2 text-popover-foreground outline-none data-[state=closed]:animate-out data-[state=open]:animate-in",
            className
          )}
          {...props}
        >
          {children}
        </CollapsibleContent>
      </Collapsible>
    );
  }
);

export type ChainOfThoughtImageProps = ComponentProps<"div"> & {
  caption?: string;
};

export const ChainOfThoughtImage = memo(
  ({ className, children, caption, ...props }: ChainOfThoughtImageProps) => (
    <div className={cn("mt-2 space-y-2", className)} {...props}>
      <div className="relative flex max-h-[22rem] items-center justify-center overflow-hidden rounded-lg bg-muted p-3">
        {children}
      </div>
      {caption && <p className="text-muted-foreground text-xs">{caption}</p>}
    </div>
  )
);

ChainOfThought.displayName = "ChainOfThought";
ChainOfThoughtHeader.displayName = "ChainOfThoughtHeader";
ChainOfThoughtStep.displayName = "ChainOfThoughtStep";
ChainOfThoughtSearchResults.displayName = "ChainOfThoughtSearchResults";
ChainOfThoughtSearchResult.displayName = "ChainOfThoughtSearchResult";
ChainOfThoughtContent.displayName = "ChainOfThoughtContent";
ChainOfThoughtImage.displayName = "ChainOfThoughtImage";
