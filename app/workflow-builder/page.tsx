'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

const EXAMPLE_CONFIG = JSON.stringify({
  name: "simple-property-lookup",
  description: "Login to PropertySync and search for a property",
  config: {
    documentGroupId: "54766f37-bfad-4922-a607-30963a9c4a60"
  },
  steps: [
    {
      name: "authenticate",
      stepFunction: "getPropertySyncBearerToken",
      params: {}
    },
    {
      name: "search",
      stepFunction: "searchPropertySync",
      params: {
        documentGroupId: "{{config.documentGroupId}}",
        token: "{{authenticate.token}}",
        query: {
          queryParams: {
            excludeOrders: 1,
            subdivisions: [{
              lot: "98",
              block: null,
              addition: "YORKTOWN SUBDIVISION PHASE 1"
            }]
          }
        }
      }
    }
  ]
}, null, 2);

export default function WorkflowBuilder() {
  const [config, setConfig] = useState(EXAMPLE_CONFIG);
  const [runId, setRunId] = useState<string | null>(null);
  const [status, setStatus] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  const handleRunWorkflow = async () => {
    setError(null);
    setRunId(null);
    setStatus(null);

    try {
      const response = await fetch('/api/run-workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to start workflow');
        return;
      }

      setRunId(data.runId);
      startPolling(data.runId);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const startPolling = (runId: string) => {
    setIsPolling(true);

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/run-workflow?runId=${runId}`);
        const data = await response.json();

        setStatus(data);

        // Stop polling if completed or failed
        if (data.status === 'completed' || data.status === 'failed') {
          clearInterval(pollInterval);
          setIsPolling(false);
        }

      } catch (err) {
        console.error('Polling error:', err);
        clearInterval(pollInterval);
        setIsPolling(false);
      }
    }, 2000); // Poll every 2 seconds
  };

  return (
    <div className="relative w-full min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Workflow Builder</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Define and execute workflows from JSON configuration
        </p>

        <div className="space-y-4">
          {/* JSON Config Input */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Workflow Configuration (JSON)
            </label>
            <textarea
              value={config}
              onChange={(e) => setConfig(e.target.value)}
              className="w-full h-96 p-4 font-mono text-sm border rounded-lg bg-secondary"
              placeholder="Enter workflow JSON configuration..."
            />
          </div>

          {/* Run Button */}
          <Button
            onClick={handleRunWorkflow}
            disabled={isPolling}
            className="w-full"
          >
            {isPolling ? 'Running...' : 'Run Workflow'}
          </Button>

          {/* Error Display */}
          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive rounded-lg">
              <p className="text-sm font-medium text-destructive">Error</p>
              <p className="text-sm text-destructive/80 mt-1">{error}</p>
            </div>
          )}

          {/* Run ID Display */}
          {runId && (
            <div className="p-4 bg-secondary rounded-lg">
              <p className="text-sm font-medium">Run ID</p>
              <p className="text-xs font-mono mt-1">{runId}</p>
            </div>
          )}

          {/* Status Display */}
          {status && (
            <div className="p-4 bg-secondary rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">Status</p>
                <span className={`text-xs px-2 py-1 rounded ${
                  status.status === 'completed' ? 'bg-green-500/20 text-green-700' :
                  status.status === 'failed' ? 'bg-red-500/20 text-red-700' :
                  'bg-blue-500/20 text-blue-700'
                }`}>
                  {status.status}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Workflow: </span>
                  <span>{status.workflowName}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Created: </span>
                  <span>{new Date(status.createdAt).toLocaleString()}</span>
                </div>
                {status.startedAt && (
                  <div>
                    <span className="text-muted-foreground">Started: </span>
                    <span>{new Date(status.startedAt).toLocaleString()}</span>
                  </div>
                )}
                {status.completedAt && (
                  <div>
                    <span className="text-muted-foreground">Completed: </span>
                    <span>{new Date(status.completedAt).toLocaleString()}</span>
                  </div>
                )}
              </div>

              {/* Results */}
              {status.result && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">Results</p>
                  <pre className="text-xs bg-background p-3 rounded overflow-auto max-h-96">
                    {JSON.stringify(status.result, null, 2)}
                  </pre>
                </div>
              )}

              {/* Error Details */}
              {status.error && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-destructive mb-2">Error Details</p>
                  <pre className="text-xs bg-destructive/10 p-3 rounded overflow-auto">
                    {JSON.stringify(status.error, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
