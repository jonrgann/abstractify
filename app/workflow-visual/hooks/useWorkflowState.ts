import { useState, useCallback } from 'react';
import { nanoid } from 'nanoid';
import { VisualWorkflowState, VisualWorkflowStep } from '../types/visual-workflow';
import { createEmptyWorkflow } from '../lib/workflow-converter';
import { hasRequiredParameters, getStepMetadata } from '../lib/step-metadata';

export function useWorkflowState(initialState?: VisualWorkflowState) {
  const [workflow, setWorkflow] = useState<VisualWorkflowState>(
    initialState || createEmptyWorkflow()
  );

  /**
   * Add a new step to the workflow
   */
  const addStep = useCallback((stepFunction: string, position?: number) => {
    setWorkflow(prev => {
      const stepName = getStepMetadata(stepFunction)?.name ?? 'Untitled'
      const newStep: VisualWorkflowStep = {
        id: nanoid(),
        name: stepName.replaceAll(" ", "-"),
        stepFunction,
        params: {},
        position: position ?? prev.steps.length,
        isConfigured: !hasRequiredParameters(stepFunction) // Auto-configure if no required params
      };

      // Insert at position or append to end
      const updatedSteps = [...prev.steps];
      if (position !== undefined && position < prev.steps.length) {
        updatedSteps.splice(position, 0, newStep);
      } else {
        updatedSteps.push(newStep);
      }

      // Recalculate positions
      return {
        ...prev,
        steps: updatedSteps.map((step, index) => ({
          ...step,
          position: index
        }))
      };
    });
  }, []);

  /**
   * Update a step's properties
   */
  const updateStep = useCallback((stepId: string, updates: Partial<VisualWorkflowStep>) => {
    setWorkflow(prev => ({
      ...prev,
      steps: prev.steps.map(step =>
        step.id === stepId
          ? { ...step, ...updates }
          : step
      )
    }));
  }, []);

  /**
   * Reorder steps (for drag and drop)
   */
  const reorderSteps = useCallback((fromIndex: number, toIndex: number) => {
    setWorkflow(prev => {
      const updatedSteps = [...prev.steps];
      const [movedStep] = updatedSteps.splice(fromIndex, 1);
      updatedSteps.splice(toIndex, 0, movedStep);

      // Recalculate positions
      return {
        ...prev,
        steps: updatedSteps.map((step, index) => ({
          ...step,
          position: index
        }))
      };
    });
  }, []);

  /**
   * Remove a step from the workflow
   */
  const removeStep = useCallback((stepId: string) => {
    setWorkflow(prev => {
      const updatedSteps = prev.steps.filter(step => step.id !== stepId);

      // Recalculate positions
      return {
        ...prev,
        steps: updatedSteps.map((step, index) => ({
          ...step,
          position: index
        }))
      };
    });
  }, []);

  /**
   * Update workflow metadata (name, description)
   */
  const updateWorkflowMetadata = useCallback((updates: Partial<Pick<VisualWorkflowState, 'name' | 'description'>>) => {
    setWorkflow(prev => ({
      ...prev,
      ...updates
    }));
  }, []);

  /**
   * Update global workflow config
   */
  const updateConfig = useCallback((config: Record<string, any>) => {
    setWorkflow(prev => ({
      ...prev,
      config
    }));
  }, []);

  /**
   * Load a complete workflow (for import)
   */
  const loadWorkflow = useCallback((newWorkflow: VisualWorkflowState) => {
    setWorkflow(newWorkflow);
  }, []);

  /**
   * Reset workflow to empty state
   */
  const resetWorkflow = useCallback(() => {
    setWorkflow(createEmptyWorkflow());
  }, []);

  /**
   * Get step by ID
   */
  const getStep = useCallback((stepId: string): VisualWorkflowStep | undefined => {
    return workflow.steps.find(step => step.id === stepId);
  }, [workflow.steps]);

  /**
   * Get step by name
   */
  const getStepByName = useCallback((stepName: string): VisualWorkflowStep | undefined => {
    return workflow.steps.find(step => step.name === stepName);
  }, [workflow.steps]);

  /**
   * Check if step name is unique
   */
  const isStepNameUnique = useCallback((name: string, excludeStepId?: string): boolean => {
    return !workflow.steps.some(step =>
      step.name === name && step.id !== excludeStepId
    );
  }, [workflow.steps]);

  /**
   * Duplicate a step
   */
  const duplicateStep = useCallback((stepId: string) => {
    const stepToDuplicate = workflow.steps.find(s => s.id === stepId);
    if (!stepToDuplicate) return;

    const newStep: VisualWorkflowStep = {
      ...stepToDuplicate,
      id: nanoid(),
      name: `${stepToDuplicate.name}-copy`,
      position: stepToDuplicate.position + 1
    };

    setWorkflow(prev => {
      const updatedSteps = [...prev.steps];
      updatedSteps.splice(newStep.position, 0, newStep);

      return {
        ...prev,
        steps: updatedSteps.map((step, index) => ({
          ...step,
          position: index
        }))
      };
    });
  }, [workflow.steps]);

  return {
    workflow,
    addStep,
    updateStep,
    reorderSteps,
    removeStep,
    updateWorkflowMetadata,
    updateConfig,
    loadWorkflow,
    resetWorkflow,
    getStep,
    getStepByName,
    isStepNameUnique,
    duplicateStep
  };
}
