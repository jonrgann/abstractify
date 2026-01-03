import { useState, useCallback, useEffect, useRef } from 'react';
import { VisualWorkflowState } from '../types/visual-workflow';
import { visualToJson, validateWorkflow } from '../lib/workflow-converter';

interface WorkflowStatus {
  runId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  workflowName?: string;
  createdAt?: string;
  startedAt?: string;
  completedAt?: string;
  result?: any;
  error?: any;
}

export function useWorkflowExecution() {
  const [isRunning, setIsRunning] = useState(false);
  const [status, setStatus] = useState<WorkflowStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Start polling for workflow status
   */
  const startPolling = useCallback((runId: string) => {
    // Clear any existing polling
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    const poll = async () => {
      try {
        const response = await fetch(`/api/run-workflow?runId=${runId}`);
        const data = await response.json();

        setStatus(data);

        // Stop polling if completed or failed
        if (data.status === 'completed' || data.status === 'failed') {
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          setIsRunning(false);
        }
      } catch (err) {
        console.error('Polling error:', err);
        setError(err instanceof Error ? err.message : 'Failed to poll workflow status');
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        setIsRunning(false);
      }
    };

    // Poll immediately, then every 2 seconds
    poll();
    pollingIntervalRef.current = setInterval(poll, 2000);
  }, []);

  /**
   * Run a workflow
   */
  const runWorkflow = useCallback(async (workflow: VisualWorkflowState) => {
    // Reset state
    setError(null);
    setStatus(null);
    setIsRunning(true);

    // Validate workflow
    const validationErrors = validateWorkflow(workflow);
    if (validationErrors.length > 0) {
      setError(validationErrors.join('; '));
      setIsRunning(false);
      return;
    }

    try {
      // Convert to JSON config
      const config = visualToJson(workflow);
      const configJson = JSON.stringify(config);

      // Start workflow
      const response = await fetch('/api/run-workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: configJson }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to start workflow');
        setIsRunning(false);
        return;
      }

      // Start polling for status
      startPolling(data.runId);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setIsRunning(false);
    }
  }, [startPolling]);

  /**
   * Cancel workflow execution (stop polling)
   */
  const cancelExecution = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    setIsRunning(false);
  }, []);

  /**
   * Reset execution state
   */
  const resetExecution = useCallback(() => {
    cancelExecution();
    setStatus(null);
    setError(null);
  }, [cancelExecution]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  return {
    isRunning,
    status,
    error,
    runWorkflow,
    cancelExecution,
    resetExecution
  };
}
