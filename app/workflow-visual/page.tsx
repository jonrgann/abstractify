'use client';

import { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { VisualWorkflowStep, PaletteDragData } from './types/visual-workflow';
import { useWorkflowState } from './hooks/useWorkflowState';
import { useTemplateVariables } from './hooks/useTemplateVariables';
import { useWorkflowExecution } from './hooks/useWorkflowExecution';
import { getStepMetadata } from './lib/step-metadata';
import { WorkflowToolbar } from './components/WorkflowToolbar';
import { StepPalette } from './components/StepPalette';
import { WorkflowCanvas } from './components/WorkflowCanvas';
import { StepConfigSheet } from './components/StepConfigSheet';
import { StepCard } from './components/StepCard';
import { Card } from '@/components/ui/card';
import { AlertCircle, CheckCircle, Loader2, GripVertical } from 'lucide-react';

export default function VisualWorkflowBuilder() {
  const [selectedStep, setSelectedStep] = useState<VisualWorkflowStep | null>(null);
  const [configSheetOpen, setConfigSheetOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Workflow state management
  const {
    workflow,
    addStep,
    updateStep,
    reorderSteps,
    removeStep,
    updateWorkflowMetadata,
    updateConfig,
    loadWorkflow,
    isStepNameUnique,
    duplicateStep
  } = useWorkflowState();

  // Workflow execution
  const {
    isRunning,
    status,
    error: executionError,
    runWorkflow,
    cancelExecution,
    resetExecution
  } = useWorkflowExecution();

  // Template variables (for config sheet)
  const availableVariables = useTemplateVariables(
    workflow,
    selectedStep?.position
  );

  // Configure drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 } // Prevent accidental drags
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  // Drag handlers
  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeData = active.data.current;

    // Handle palette → canvas drop
    if (activeData && 'type' in activeData && activeData.type === 'palette-step') {
      const paletteData = activeData as PaletteDragData;

      // If dropped on a step, insert before it
      if (over.id !== 'canvas-drop-zone') {
        const overIndex = workflow.steps.findIndex(s => s.id === over.id);
        addStep(paletteData.stepFunction, overIndex >= 0 ? overIndex : workflow.steps.length);
      } else {
        // Dropped on empty canvas
        addStep(paletteData.stepFunction);
      }
      return;
    }

    // Handle reordering within timeline
    if (active.id !== over.id) {
      const oldIndex = workflow.steps.findIndex(s => s.id === active.id);
      const newIndex = workflow.steps.findIndex(s => s.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        reorderSteps(oldIndex, newIndex);
      }
    }
  }

  // Render drag overlay
  const renderDragOverlay = () => {
    if (!activeId) return null;

    // Check if dragging from palette
    if (activeId.startsWith('palette-')) {
      const stepFunction = activeId.replace('palette-', '');
      const metadata = getStepMetadata(stepFunction);
      return metadata ? (
        <Card className="p-3 opacity-90">
          <div className="flex items-start gap-2">
            <GripVertical className="w-4 h-4 mt-0.5 text-muted-foreground" />
            <div>
              <h4 className="text-sm font-medium">{metadata.name}</h4>
              <p className="text-xs text-muted-foreground">{metadata.description}</p>
            </div>
          </div>
        </Card>
      ) : null;
    }

    // Dragging existing step
    const step = workflow.steps.find(s => s.id === activeId);
    return step ? (
      <div className="opacity-90">
        <StepCard
          step={step}
          onClick={() => {}}
          onDuplicate={() => {}}
          onDelete={() => {}}
        />
      </div>
    ) : null;
  };

  const handleStepClick = (step: VisualWorkflowStep) => {
    setSelectedStep(step);
    setConfigSheetOpen(true);
  };

  const handleSaveStep = (stepId: string, updates: Partial<VisualWorkflowStep>) => {
    updateStep(stepId, updates);
  };

  const handleImport = (importedWorkflow: typeof workflow) => {
    loadWorkflow(importedWorkflow);
    resetExecution();
  };

  const handleRun = () => {
    resetExecution();
    runWorkflow(workflow);
  };

  const handleWorkflowUpdate = (updates: Partial<Pick<typeof workflow, 'name' | 'description' | 'config'>>) => {
    if (updates.name !== undefined || updates.description !== undefined) {
      updateWorkflowMetadata({
        ...(updates.name !== undefined && { name: updates.name }),
        ...(updates.description !== undefined && { description: updates.description })
      });
    }
    if (updates.config !== undefined) {
      updateConfig(updates.config);
    }
  };

  return (
    <div className="h-screen flex flex-col">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/* Toolbar */}
        <WorkflowToolbar
          workflow={workflow}
          onWorkflowUpdate={handleWorkflowUpdate}
          onImport={handleImport}
          onRun={handleRun}
          isRunning={isRunning}
          onCancelRun={cancelExecution}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar - Step Palette */}
          <div className="w-80 flex-shrink-0 h-full">
            <StepPalette />
          </div>

          {/* Main Canvas */}
          <div className="flex-1 overflow-hidden">
            <WorkflowCanvas
              steps={workflow.steps}
              onStepClick={handleStepClick}
              onDuplicateStep={duplicateStep}
              onDeleteStep={removeStep}
            />
          </div>
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {renderDragOverlay()}
        </DragOverlay>
      </DndContext>

      {/* Execution Status Bar */}
      {(isRunning || status || executionError) && (
        <div className="border-t bg-background p-4">
          <Card className="p-4">
            {isRunning && (
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Workflow Running</p>
                  {status && (
                    <p className="text-xs text-muted-foreground">
                      Status: {status.status} {status.runId && `• Run ID: ${status.runId}`}
                    </p>
                  )}
                </div>
              </div>
            )}

            {!isRunning && status?.status === 'completed' && (
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Workflow Completed</p>
                    <p className="text-xs text-muted-foreground">
                      {status.workflowName} • Run ID: {status.runId}
                    </p>
                  </div>
                </div>
                {status.result && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                      View Results
                    </summary>
                    <pre className="mt-2 p-3 bg-secondary rounded overflow-auto max-h-48">
                      {JSON.stringify(status.result, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            )}

            {!isRunning && (status?.status === 'failed' || executionError) && (
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-destructive">Workflow Failed</p>
                    <p className="text-xs text-muted-foreground">
                      {executionError || 'An error occurred during execution'}
                    </p>
                  </div>
                </div>
                {status?.error && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                      View Error Details
                    </summary>
                    <pre className="mt-2 p-3 bg-destructive/10 rounded overflow-auto max-h-48">
                      {JSON.stringify(status.error, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Step Configuration Sheet */}
      <StepConfigSheet
        step={selectedStep}
        open={configSheetOpen}
        onOpenChange={setConfigSheetOpen}
        onSave={handleSaveStep}
        isStepNameUnique={isStepNameUnique}
        availableVariables={availableVariables}
      />
    </div>
  );
}
