import { NextResponse } from 'next/server';
import { start, getRun } from 'workflow/api';
import { executeDynamicWorkflow } from '@/workflows/dynamic';

// POST /api/run-workflow - Start a new workflow
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { config } = body;

    if (!config) {
      return NextResponse.json(
        { error: 'Missing config in request body' },
        { status: 400 }
      );
    }

    // Validate it's a string (JSON)
    if (typeof config !== 'string') {
      return NextResponse.json(
        { error: 'Config must be a JSON string' },
        { status: 400 }
      );
    }

    // Start the workflow (returns Run object with runId)
    const run = await start(executeDynamicWorkflow, [config]);

    // Return the run ID for polling
    return NextResponse.json({
      runId: run.runId,
      status: 'started',
      message: 'Workflow started successfully. Use the runId to poll for status.'
    });

  } catch (error) {
    console.error('Error starting workflow:', error);
    return NextResponse.json(
      {
        error: 'Failed to start workflow',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// GET /api/run-workflow?runId=xxx - Poll workflow status
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const runId = searchParams.get('runId');

    if (!runId) {
      return NextResponse.json(
        { error: 'Missing runId parameter' },
        { status: 400 }
      );
    }

    // Get the workflow run
    const run = getRun(runId);

    // Get current status
    const status = await run.status;

    // Build response based on status
    const response: any = {
      runId,
      status,
      workflowName: await run.workflowName,
      createdAt: await run.createdAt,
      startedAt: await run.startedAt,
    };

    // If completed, include results
    if (status === 'completed') {
      response.completedAt = await run.completedAt;
      response.result = await run.returnValue;
    }

    // If failed, include error (status will be 'failed')
    if (status === 'failed') {
      response.completedAt = await run.completedAt;
      try {
        response.error = await run.returnValue;
      } catch (error) {
        response.error = 'Workflow failed';
      }
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error polling workflow:', error);
    return NextResponse.json(
      {
        error: 'Failed to poll workflow status',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
