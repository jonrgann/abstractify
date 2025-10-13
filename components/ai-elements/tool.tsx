'use client';

import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import type { ToolUIPart } from 'ai';
import {
  CheckCircleIcon,
  ChevronDownIcon,
  CircleIcon,
  ClockIcon,
  WrenchIcon,
  XCircleIcon,
} from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';
import { CodeBlock } from './code-block';

// Type definitions for usage tracking
export type CompletionTokenUsage = {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
};

export type ToolProps = ComponentProps<typeof Collapsible>;

export const Tool = ({ className, ...props }: ToolProps) => (
  <Collapsible
    className={cn('not-prose mb-4 w-full rounded-md border', className)}
    {...props}
  />
);

export type ToolHeaderProps = {
  type: ToolUIPart['type'];
  state: ToolUIPart['state'];
  className?: string;
};

const getStatusBadge = (status: ToolUIPart['state']) => {
  const labels = {
    'input-streaming': 'Pending',
    'input-available': 'Running',
    'output-available': 'Completed',
    'output-error': 'Error',
  } as const;

  const icons = {
    'input-streaming': <CircleIcon className="size-4" />,
    'input-available': <ClockIcon className="size-4 animate-pulse" />,
    'output-available': <CheckCircleIcon className="size-4 text-green-600" />,
    'output-error': <XCircleIcon className="size-4 text-red-600" />,
  } as const;

  return (
    <Badge className="gap-1.5 rounded-full text-xs" variant="secondary">
      {icons[status]}
      {labels[status]}
    </Badge>
  );
};

export const ToolHeader = ({
  className,
  type,
  state,
  ...props
}: ToolHeaderProps) => (
  <CollapsibleTrigger
    className={cn(
      'flex w-full items-center justify-between gap-4 p-3',
      className
    )}
    {...props}
  >
    <div className="flex items-center gap-2">
      <WrenchIcon className="size-4 text-muted-foreground" />
      <span className="font-medium text-sm">{type}</span>
      {getStatusBadge(state)}
    </div>
    <ChevronDownIcon className="size-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
  </CollapsibleTrigger>
);

export type ToolContentProps = ComponentProps<typeof CollapsibleContent>;

export const ToolContent = ({ className, ...props }: ToolContentProps) => (
  <CollapsibleContent
    className={cn(
      'data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2 text-popover-foreground outline-none data-[state=closed]:animate-out data-[state=open]:animate-in',
      className
    )}
    {...props}
  />
);

export type ToolInputProps = ComponentProps<'div'> & {
  input: ToolUIPart['input'];
};

export const ToolInput = ({ className, input, ...props }: ToolInputProps) => (
  <div className={cn('space-y-2 overflow-hidden p-4', className)} {...props}>
    <h4 className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
      Parameters
    </h4>
    <div className="rounded-md bg-muted/50">
      <CodeBlock code={JSON.stringify(input, null, 2)} language="json" />
    </div>
  </div>
);

export type ToolOutputProps = ComponentProps<'div'> & {
  output: ReactNode;
  errorText: ToolUIPart['errorText'];
};

export const ToolOutput = ({
  className,
  output,
  errorText,
  ...props
}: ToolOutputProps) => {
  if (!(output || errorText)) {
    return null;
  }

  return (
    <div className={cn('space-y-2 p-4', className)} {...props}>
      <h4 className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
        {errorText ? 'Error' : 'Result'}
      </h4>
      <div
        className={cn(
          'overflow-x-auto rounded-md text-xs [&_table]:w-full',
          errorText
            ? 'bg-destructive/10 text-destructive'
            : 'bg-muted/50 text-foreground'
        )}
      >
        {errorText && <div>{errorText}</div>}
        {output &&     <div className="rounded-md bg-muted/50">
      <CodeBlock code={JSON.stringify(output, null, 2)} language="json" />
    </div>}
      </div>
    </div>
  );
};

export type ToolUsageProps = ComponentProps<'div'> & {
  totalUsage?: CompletionTokenUsage;
};

export const ToolUsage = ({
  className,
  totalUsage,
  ...props
}: ToolUsageProps) => {
  if (!totalUsage) {
    return null;
  }

  const { inputTokens, outputTokens, totalTokens } = totalUsage;
  const hasAnyTokens = inputTokens || outputTokens || totalTokens;

  if (!hasAnyTokens) {
    return null;
  }

  return (
    <div className={cn('space-y-2 border-t p-4', className)} {...props}>
      <div className="flex items-center gap-2">
        <h4 className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
          Token Usage
        </h4>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {inputTokens !== undefined && (
          <div className="flex flex-col rounded-md bg-muted/50 p-2">
            <span className="text-muted-foreground text-xs">Input Tokens</span>
            <span className="font-mono text-sm font-medium">
              {inputTokens.toLocaleString()}
            </span>
          </div>
        )}
        {outputTokens !== undefined && (
          <div className="flex flex-col rounded-md bg-muted/50 p-2">
            <span className="text-muted-foreground text-xs">Output Tokens</span>
            <span className="font-mono text-sm font-medium">
              {outputTokens.toLocaleString()}
            </span>
          </div>
        )}
        {totalTokens !== undefined && (
          <div className="flex flex-col rounded-md bg-muted/50 p-2">
            <span className="text-muted-foreground text-xs">Total Tokens</span>
            <span className="font-mono text-sm font-medium">
              {totalTokens.toLocaleString()}
            </span>
          </div>
        )}
      </div>
      {/* Show calculated total if only input/output are provided */}
      {!totalTokens && inputTokens !== undefined && outputTokens !== undefined && (
        <div className="flex justify-end">
          <div className="flex flex-col rounded-md bg-blue-50 p-2 dark:bg-blue-950">
            <span className="text-muted-foreground text-xs">Calculated Total</span>
            <span className="font-mono text-sm font-medium">
              {(inputTokens + outputTokens).toLocaleString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};