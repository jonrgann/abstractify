import { z } from 'zod';

export const WorkflowStepSchema = z.object({
  name: z.string()
    .min(1, "Step name is required")
    .regex(/^[a-zA-Z0-9_-]+$/, "Step name must be alphanumeric with hyphens/underscores"),
  stepFunction: z.string()
    .min(1, "Step function is required"),
  params: z.record(z.any(), z.any()).default({})
});

export const WorkflowConfigSchema = z.object({
  name: z.string().min(1, "Workflow name is required"),
  description: z.string().optional(),
  config: z.record(z.any(), z.any()).optional().default({}),
  steps: z.array(WorkflowStepSchema)
    .min(1, "At least one step is required")
});

export type WorkflowConfig = z.infer<typeof WorkflowConfigSchema>;
export type WorkflowStep = z.infer<typeof WorkflowStepSchema>;
