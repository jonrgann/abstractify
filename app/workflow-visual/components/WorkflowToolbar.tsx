'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, Upload, Play, Settings, FileJson, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { VisualWorkflowState } from '../types/visual-workflow';
import { exportWorkflow, importWorkflow, validateWorkflow } from '../lib/workflow-converter';

interface WorkflowToolbarProps {
  workflow: VisualWorkflowState;
  onWorkflowUpdate: (updates: Partial<Pick<VisualWorkflowState, 'name' | 'description' | 'config'>>) => void;
  onImport: (workflow: VisualWorkflowState) => void;
  onRun: () => void;
  isRunning: boolean;
  onCancelRun?: () => void;
}

export function WorkflowToolbar({
  workflow,
  onWorkflowUpdate,
  onImport,
  onRun,
  isRunning,
  onCancelRun
}: WorkflowToolbarProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [workflowName, setWorkflowName] = useState(workflow.name);
  const [workflowDescription, setWorkflowDescription] = useState(workflow.description || '');
  const [globalConfig, setGlobalConfig] = useState(JSON.stringify(workflow.config, null, 2));

  const handleExport = () => {
    exportWorkflow(workflow);
  };

  const handleImport = async () => {
    try {
      const imported = await importWorkflow();
      onImport(imported);
    } catch (error) {
      console.error('Import failed:', error);
      alert(error instanceof Error ? error.message : 'Failed to import workflow');
    }
  };

  const handleSaveSettings = () => {
    try {
      const parsedConfig = globalConfig.trim() ? JSON.parse(globalConfig) : {};
      onWorkflowUpdate({
        name: workflowName,
        description: workflowDescription,
        config: parsedConfig
      });
      setShowSettings(false);
    } catch (error) {
      alert('Invalid JSON in global config');
    }
  };

  const handleRun = () => {
    const errors = validateWorkflow(workflow);
    if (errors.length > 0) {
      alert(`Cannot run workflow:\n\n${errors.join('\n')}`);
      return;
    }
    onRun();
  };

  // Update local state when workflow changes
  const handleOpenSettings = () => {
    setWorkflowName(workflow.name);
    setWorkflowDescription(workflow.description || '');
    setGlobalConfig(JSON.stringify(workflow.config, null, 2));
    setShowSettings(true);
  };

  return (
    <>
      <div className="border-b bg-background px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Workflow Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold truncate">{workflow.name}</h1>
            {workflow.description && (
              <p className="text-sm text-muted-foreground truncate">{workflow.description}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenSettings}
              disabled={isRunning}
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleImport}
              disabled={isRunning}
            >
              <Upload className="w-4 h-4 mr-2" />
              Import
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={workflow.steps.length === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>

            {isRunning ? (
              <Button
                variant="destructive"
                size="sm"
                onClick={onCancelRun}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={handleRun}
                disabled={workflow.steps.length === 0}
              >
                <Play className="w-4 h-4 mr-2" />
                Run Workflow
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Workflow Settings</DialogTitle>
            <DialogDescription>
              Configure workflow metadata and global configuration
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Workflow Name */}
            <div className="space-y-2">
              <Label htmlFor="workflow-name">
                Workflow Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="workflow-name"
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                placeholder="e.g., property-lookup-workflow"
              />
            </div>

            {/* Workflow Description */}
            <div className="space-y-2">
              <Label htmlFor="workflow-description">Description</Label>
              <Textarea
                id="workflow-description"
                value={workflowDescription}
                onChange={(e) => setWorkflowDescription(e.target.value)}
                placeholder="Describe what this workflow does..."
                rows={3}
              />
            </div>

            {/* Global Config */}
            <div className="space-y-2">
              <Label htmlFor="global-config">
                Global Configuration (JSON)
              </Label>
              <Textarea
                id="global-config"
                value={globalConfig}
                onChange={(e) => setGlobalConfig(e.target.value)}
                placeholder='{"documentGroupId": "..."}'
                className="font-mono text-sm"
                rows={6}
              />
              <p className="text-xs text-muted-foreground">
                Config values can be referenced in steps using <code>{'{{config.key}}'}</code>
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSettings(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSettings} disabled={!workflowName.trim()}>
              Save Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
