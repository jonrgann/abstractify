'use client';

import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { AlertCircle } from 'lucide-react';
import { VisualWorkflowStep } from '../types/visual-workflow';
import { StepCard } from './StepCard';

interface WorkflowCanvasProps {
  steps: VisualWorkflowStep[];
  onStepClick: (step: VisualWorkflowStep) => void;
  onDuplicateStep: (stepId: string) => void;
  onDeleteStep: (stepId: string) => void;
}

export function WorkflowCanvas({
  steps,
  onStepClick,
  onDuplicateStep,
  onDeleteStep
}: WorkflowCanvasProps) {
  // Add droppable zone for the canvas
  const { setNodeRef: setCanvasRef } = useDroppable({
    id: 'canvas-drop-zone'
  });

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Canvas Header */}
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Workflow Timeline</h2>
        <p className="text-sm text-muted-foreground">
          {steps.length} step{steps.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Step Timeline */}
      <div className="flex-1 overflow-y-auto p-4" ref={setCanvasRef}>
        {steps.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No steps yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Drag steps from the palette on the left to build your workflow.
              Steps will execute in order from top to bottom.
            </p>
          </div>
        ) : (
          <SortableContext
            items={steps.map(s => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3 max-w-2xl mx-auto">
              {steps.map((step, index) => (
                <div key={step.id} className="relative">
                  {/* Step number indicator */}
                  <div className="absolute -left-8 top-4 text-xs text-muted-foreground font-medium">
                    {index + 1}
                  </div>

                  {/* Timeline connector line */}
                  {index < steps.length - 1 && (
                    <div className="absolute -left-5 top-12 bottom-0 w-0.5 bg-border" />
                  )}

                  <StepCard
                    step={step}
                    onClick={() => onStepClick(step)}
                    onDuplicate={() => onDuplicateStep(step.id)}
                    onDelete={() => onDeleteStep(step.id)}
                  />
                </div>
              ))}
            </div>
          </SortableContext>
        )}
      </div>
    </div>
  );
}
