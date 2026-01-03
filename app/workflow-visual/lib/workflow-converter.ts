import { nanoid } from 'nanoid';
import { WorkflowConfig, WorkflowConfigSchema } from '@/lib/workflow-config-schema';
import { VisualWorkflowState, VisualWorkflowStep } from '../types/visual-workflow';
import { hasRequiredParameters } from './step-metadata';

/**
 * Convert visual workflow state to JSON config format for execution
 */
export function visualToJson(visual: VisualWorkflowState): WorkflowConfig {
  // Sort steps by position and strip visual-only fields
  const steps = visual.steps
    .sort((a, b) => a.position - b.position)
    .map(({ id, position, isConfigured, ...step }) => step);

  return {
    name: visual.name,
    description: visual.description,
    config: visual.config,
    steps
  };
}

/**
 * Convert JSON config to visual workflow state
 */
export function jsonToVisual(config: WorkflowConfig): VisualWorkflowState {
  // Validate config against schema
  const validatedConfig = WorkflowConfigSchema.parse(config);

  // Convert steps to visual format with IDs and positions
  const steps: VisualWorkflowStep[] = validatedConfig.steps.map((step, index) => ({
    ...step,
    id: nanoid(),
    position: index,
    isConfigured: true // Assume imported steps are configured
  }));

  return {
    name: validatedConfig.name,
    description: validatedConfig.description,
    config: validatedConfig.config || {},
    steps
  };
}

/**
 * Export workflow as downloadable JSON file
 */
export function exportWorkflow(visual: VisualWorkflowState): void {
  const config = visualToJson(visual);
  const json = JSON.stringify(config, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  // Create temporary download link
  const link = document.createElement('a');
  link.href = url;
  link.download = `${visual.name || 'workflow'}.json`;
  document.body.appendChild(link);
  link.click();

  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Import workflow from JSON file
 * Returns a promise that resolves with the visual workflow state
 */
export function importWorkflow(): Promise<VisualWorkflowState> {
  return new Promise((resolve, reject) => {
    // Create file input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) {
        reject(new Error('No file selected'));
        return;
      }

      try {
        const text = await file.text();
        const config = JSON.parse(text) as WorkflowConfig;
        const visual = jsonToVisual(config);
        resolve(visual);
      } catch (error) {
        reject(error instanceof Error ? error : new Error('Failed to parse JSON'));
      }
    };

    input.oncancel = () => {
      reject(new Error('File selection cancelled'));
    };

    // Trigger file picker
    input.click();
  });
}

/**
 * Validate workflow before execution
 * Returns array of error messages (empty if valid)
 */
export function validateWorkflow(visual: VisualWorkflowState): string[] {
  const errors: string[] = [];

  // Check workflow name
  if (!visual.name || visual.name.trim() === '') {
    errors.push('Workflow name is required');
  }

  // Check at least one step
  if (visual.steps.length === 0) {
    errors.push('At least one step is required');
  }

  // Check step names are unique
  const stepNames = visual.steps.map(s => s.name);
  const duplicates = stepNames.filter((name, index) => stepNames.indexOf(name) !== index);
  if (duplicates.length > 0) {
    errors.push(`Duplicate step names: ${[...new Set(duplicates)].join(', ')}`);
  }

  // Check step names are valid (alphanumeric with hyphens/underscores)
  visual.steps.forEach(step => {
    if (!/^[a-zA-Z0-9_-]+$/.test(step.name)) {
      errors.push(`Invalid step name "${step.name}": must be alphanumeric with hyphens/underscores only`);
    }
  });

  // Check all steps are configured
  const unconfigured = visual.steps
    .filter(step => !step.isConfigured && hasRequiredParameters(step.stepFunction))
    .map(step => step.name);

  if (unconfigured.length > 0) {
    errors.push(`Unconfigured steps: ${unconfigured.join(', ')}`);
  }

  return errors;
}

/**
 * Create empty visual workflow state
 */
export function createEmptyWorkflow(): VisualWorkflowState {
  return {
    name: 'New Workflow',
    description: '',
    config: {},
    steps: []
  };
}

/**
 * Clone a workflow step with new ID
 */
export function cloneStep(step: VisualWorkflowStep, newPosition: number): VisualWorkflowStep {
  return {
    ...step,
    id: nanoid(),
    position: newPosition,
    name: `${step.name}-copy`
  };
}
