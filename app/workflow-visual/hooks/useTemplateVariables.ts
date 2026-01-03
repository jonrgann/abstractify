import { useMemo } from 'react';
import { VisualWorkflowState, TemplateVariable } from '../types/visual-workflow';

/**
 * Extract all template variables available for a given step position
 * Returns config variables and variables from previous steps only
 */
export function useTemplateVariables(
  workflow: VisualWorkflowState,
  currentStepPosition?: number
): TemplateVariable[] {
  return useMemo(() => {
    const variables: TemplateVariable[] = [];

    // Add config variables
    Object.keys(workflow.config).forEach(key => {
      variables.push({
        path: `config.${key}`,
        label: `config.${key}`,
        type: 'config'
      });
    });

    // Add step output variables (only from previous steps)
    const availableSteps = currentStepPosition !== undefined
      ? workflow.steps.filter(step => step.position < currentStepPosition)
      : workflow.steps;

    availableSteps.forEach(step => {
      // Add generic step reference (step outputs vary by function)
      variables.push({
        path: `${step.name}`,
        label: `${step.name} (output)`,
        type: 'step',
        stepName: step.name
      });

      // Add common output properties that steps might return
      // These are suggestions - actual availability depends on step execution
      const commonProperties = [
        'token',
        'searchId',
        'documentId',
        'data',
        'result',
        'results',
        'documents',
        'url',
        'id'
      ];

      commonProperties.forEach(prop => {
        variables.push({
          path: `${step.name}.${prop}`,
          label: `${step.name}.${prop}`,
          type: 'step',
          stepName: step.name
        });
      });
    });

    return variables;
  }, [workflow.config, workflow.steps, currentStepPosition]);
}

/**
 * Filter template variables by search query
 */
export function filterTemplateVariables(
  variables: TemplateVariable[],
  query: string
): TemplateVariable[] {
  const lowerQuery = query.toLowerCase();
  return variables.filter(v =>
    v.path.toLowerCase().includes(lowerQuery) ||
    v.label.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Parse template variable from string (e.g., "{{config.value}}" -> "config.value")
 */
export function parseTemplateVariable(str: string): string | null {
  const match = str.match(/\{\{([^}]+)\}\}/);
  return match ? match[1].trim() : null;
}

/**
 * Check if a string contains template variables
 */
export function hasTemplateVariables(str: string): boolean {
  return /\{\{[^}]+\}\}/.test(str);
}

/**
 * Extract all template variable paths from a string
 */
export function extractTemplateVariables(str: string): string[] {
  const matches = str.matchAll(/\{\{([^}]+)\}\}/g);
  return Array.from(matches, m => m[1].trim());
}

/**
 * Validate that template variable exists in available variables
 */
export function validateTemplateVariable(
  path: string,
  availableVariables: TemplateVariable[]
): boolean {
  return availableVariables.some(v => v.path === path);
}

/**
 * Get suggested variables for a given context
 * Groups by type and sorts by relevance
 */
export function getSuggestedVariables(
  variables: TemplateVariable[],
  parameterName?: string
): TemplateVariable[] {
  // If parameter name suggests a specific variable type, prioritize those
  const priorityMatches: TemplateVariable[] = [];
  const otherMatches: TemplateVariable[] = [];

  if (parameterName) {
    const lowerParamName = parameterName.toLowerCase();

    variables.forEach(v => {
      const lowerPath = v.path.toLowerCase();

      // Check if variable path contains parameter name
      if (lowerPath.includes(lowerParamName)) {
        priorityMatches.push(v);
      } else {
        otherMatches.push(v);
      }
    });

    return [...priorityMatches, ...otherMatches];
  }

  // Default: config vars first, then step vars
  const configVars = variables.filter(v => v.type === 'config');
  const stepVars = variables.filter(v => v.type === 'step');

  return [...configVars, ...stepVars];
}
