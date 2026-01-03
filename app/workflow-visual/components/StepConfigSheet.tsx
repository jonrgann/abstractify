'use client';

import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle } from 'lucide-react';
import { VisualWorkflowStep, TemplateVariable } from '../types/visual-workflow';
import { getStepMetadata } from '../lib/step-metadata';
import { TemplateVariableInput } from './TemplateVariableInput';

interface StepConfigSheetProps {
  step: VisualWorkflowStep | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (stepId: string, updates: Partial<VisualWorkflowStep>) => void;
  isStepNameUnique: (name: string, excludeStepId?: string) => boolean;
  availableVariables: TemplateVariable[];
}

export function StepConfigSheet({
  step,
  open,
  onOpenChange,
  onSave,
  isStepNameUnique,
  availableVariables
}: StepConfigSheetProps) {
  const [stepName, setStepName] = useState('');
  const [params, setParams] = useState<Record<string, any>>({});
  const [nameError, setNameError] = useState<string | null>(null);

  // Load step data when sheet opens
  useEffect(() => {
    if (step) {
      setStepName(step.name);
      setParams(step.params || {});
      setNameError(null);
    }
  }, [step]);

  if (!step) return null;

  const metadata = getStepMetadata(step.stepFunction);
  if (!metadata) return null;

  const handleNameChange = (newName: string) => {
    setStepName(newName);

    // Validate step name
    if (!newName.trim()) {
      setNameError('Step name is required');
    } else if (!/^[a-zA-Z0-9_-]+$/.test(newName)) {
      setNameError('Step name must be alphanumeric with hyphens/underscores only');
    } else if (!isStepNameUnique(newName, step.id)) {
      setNameError('Step name must be unique');
    } else {
      setNameError(null);
    }
  };

  const handleParamChange = (paramName: string, value: any) => {
    setParams(prev => ({
      ...prev,
      [paramName]: value
    }));
  };

  const handleSave = () => {
    // Don't save if name is invalid
    if (nameError || !stepName.trim()) {
      return;
    }

    // Check if all required params are filled
    const allRequiredFilled = metadata.parameters
      .filter(p => p.required)
      .every(p => {
        const value = params[p.name];
        return value !== undefined && value !== null && value !== '';
      });

    onSave(step.id, {
      name: stepName,
      params,
      isConfigured: allRequiredFilled
    });

    onOpenChange(false);
  };

  return (
    <div className="p-8">
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{metadata.name}</SheetTitle>
          <SheetDescription>{metadata.description}</SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-6 px-4">
          {/* Step Name */}
          <div className="space-y-2">
            <Label htmlFor="step-name">
              Step Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="step-name"
              value={stepName}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g., authenticate, search, generate-pdf"
              className={nameError ? 'border-destructive' : ''}
            />
            {nameError && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {nameError}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Used to reference this step&apos;s output in later steps
            </p>
          </div>

          {/* Step Function (Read-only) */}
          <div className="space-y-2">
            <Label>Function</Label>
            <Input value={step.stepFunction} disabled className="font-mono text-sm" />
          </div>

          {/* Dynamic Parameters */}
          {metadata.parameters.length > 0 ? (
            <>
              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold mb-4">Parameters</h3>
                <div className="space-y-4">
                  {metadata.parameters.map((param) => {
                    const value = params[param.name] || '';

                    return (
                      <div key={param.name} className="space-y-2">
                        <Label htmlFor={`param-${param.name}`}>
                          {param.name}
                          {param.required && <span className="text-destructive ml-1">*</span>}
                        </Label>

                        {param.type === 'object' || param.type === 'array' ? (
                          <Textarea
                            id={`param-${param.name}`}
                            value={typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
                            onChange={(e) => {
                              try {
                                const parsed = JSON.parse(e.target.value);
                                handleParamChange(param.name, parsed);
                              } catch {
                                // Keep as string until valid JSON
                                handleParamChange(param.name, e.target.value);
                              }
                            }}
                            placeholder={`Enter JSON ${param.type} or use {{variables}}`}
                            className="font-mono text-sm"
                            rows={4}
                          />
                        ) : (
                          <TemplateVariableInput
                            value={String(value)}
                            onChange={(newValue) => handleParamChange(param.name, newValue)}
                            availableVariables={availableVariables}
                            placeholder={`Enter ${param.type} or use {{variables}}`}
                            parameterName={param.name}
                          />
                        )}

                        {param.description && (
                          <p className="text-xs text-muted-foreground">{param.description}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="border-t pt-4">
              <p className="text-sm text-muted-foreground">
                This step has no parameters to configure.
              </p>
            </div>
          )}
        </div>

        <SheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!!nameError || !stepName.trim()}>
            Save Configuration
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
    </div>
  );
}
