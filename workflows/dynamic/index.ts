import { WorkflowConfig, WorkflowConfigSchema } from '@/lib/workflow-config-schema';
import { TemplateResolver } from './template-resolver';
import { loadStepFunction, convertParamsToArgs } from './step-loader';
import { FatalError } from 'workflow';

export async function executeDynamicWorkflow(configJson: string) {
  "use workflow";

  let config: WorkflowConfig;

  // Step 1: Parse and validate JSON config
  try {
    const parsedConfig = JSON.parse(configJson);
    config = WorkflowConfigSchema.parse(parsedConfig);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new FatalError(`Invalid JSON: ${error.message}`);
    }
    throw new FatalError(`Config validation failed: ${error}`);
  }

  // Step 2: Initialize template resolver with global config
  const resolver = new TemplateResolver(config.config);

  // Step 3: Execute steps sequentially
  const results: Record<string, any> = {};

  for (const step of config.steps) {
    try {
      // Load the step function dynamically
      const stepFunction = await loadStepFunction(step.stepFunction);

      // Resolve template variables in params
      const resolvedParams = resolver.resolve(step.params);

      // Convert params object to positional arguments based on the function signature
      const args = convertParamsToArgs(step.stepFunction, resolvedParams);

      // Execute step function with resolved params
      const output = await stepFunction(...args);

      // Store output for future steps to reference
      resolver.addStepOutput(step.name, output);
      results[step.name] = output;

    } catch (error) {
      // Wrap errors with step context
      if (error instanceof FatalError) {
        throw error;
      }
      throw new FatalError(
        `Step '${step.name}' (${step.stepFunction}) failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  // Return final workflow results
  return {
    workflowName: config.name,
    description: config.description,
    results,
    finalOutput: results[config.steps[config.steps.length - 1].name]
  };
}
