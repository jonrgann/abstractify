'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, CheckCircle, AlertCircle, Copy, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { VisualWorkflowStep } from '../types/visual-workflow';
import { getStepMetadata } from '../lib/step-metadata';

interface StepCardProps {
  step: VisualWorkflowStep;
  onClick: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

export function StepCard({ step, onClick, onDuplicate, onDelete }: StepCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: step.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  const metadata = getStepMetadata(step.stepFunction);

  return (
    <div ref={setNodeRef} style={style}>
      <Card
        className={`p-4 cursor-pointer hover:border-primary transition-colors ${
          isDragging ? 'shadow-lg' : ''
        }`}
        onClick={onClick}
      >
        <div className="flex items-start gap-3">
          {/* Drag Handle */}
          <div
            className="mt-1 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="w-5 h-5" />
          </div>

          {/* Step Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {/* Configuration Status Icon */}
              {step.isConfigured ? (
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              )}

              {/* Step Name */}
              <h3 className="font-medium text-sm truncate">{step.name}</h3>

              {/* Category Badge */}
              {metadata && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground flex-shrink-0">
                  {metadata.category}
                </span>
              )}
            </div>

            {/* Step Description */}
            {metadata && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {metadata.description}
              </p>
            )}

            {/* Step Function Name */}
            <p className="text-xs text-muted-foreground mt-1 font-mono">
              {step.stepFunction}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate();
              }}
              title="Duplicate step"
            >
              <Copy className="w-3.5 h-3.5" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 text-destructive hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              title="Delete step"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
