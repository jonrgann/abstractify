import { WorkflowConfig, WorkflowStep } from '@/lib/workflow-config-schema';

/**
 * Extended workflow step for visual editor with DnD metadata
 */
export interface VisualWorkflowStep extends WorkflowStep {
  id: string;                    // Unique ID for DnD operations
  position: number;              // Index in timeline (0-based)
  isConfigured: boolean;         // Whether all required params are set
}

/**
 * Visual workflow state (internal representation)
 */
export interface VisualWorkflowState {
  name: string;
  description?: string;
  config: Record<string, any>;   // Global workflow config
  steps: VisualWorkflowStep[];   // Ordered list of steps
}

/**
 * Template variable available for autocomplete
 */
export interface TemplateVariable {
  path: string;                   // Full path: e.g., "config.documentGroupId" or "authenticate.token"
  label: string;                  // Display label for UI
  type: 'config' | 'step';        // Source type
  stepName?: string;              // Only for step-type variables
}

/**
 * Drag data for palette items
 */
export interface PaletteDragData {
  type: 'palette-step';
  stepFunction: string;           // e.g., "searchPropertySync"
}

/**
 * Drag data for timeline items
 */
export interface TimelineDragData {
  type: 'timeline-step';
  stepId: string;                 // Unique step ID
  index: number;                  // Current position in timeline
}

/**
 * Union type for all drag operations
 */
export type DragData = PaletteDragData | TimelineDragData;

/**
 * Step parameter metadata
 */
export interface StepParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required: boolean;
  description?: string;
}

/**
 * Step metadata for palette display and configuration
 */
export interface StepMetadata {
  name: string;                   // Human-readable name
  description: string;            // What the step does
  category: string;               // Category for grouping in palette
  parameters: StepParameter[];    // Parameter definitions
  functionName: string;           // Actual function name (e.g., "searchPropertySync")
}

/**
 * Category for grouping steps in palette
 */
export interface StepCategory {
  id: string;
  name: string;
  steps: StepMetadata[];
}
