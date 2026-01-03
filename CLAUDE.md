# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Abstractify is an automated title research application for real estate title companies. It integrates with PropertySync (a title plant system) to automate the generation of title reports, perform property and name searches, and streamline title research workflows.

## Development Commands

### Core Commands
- `pnpm dev` - Start Next.js development server with Turbopack
- `pnpm build` - Build the production application
- `pnpm start` - Start the production server
- `pnpm lint` - Run ESLint

### Package Manager
This project uses **pnpm** (not npm or yarn). All dependency operations should use `pnpm`.

## Architecture Overview

### Framework Stack
- **Next.js 15** with App Router (RSC architecture)
- **React 19** for UI components
- **TypeScript** with strict mode enabled
- **Tailwind CSS 4** for styling
- **Vercel AI SDK** for AI agent capabilities
- **Workflow SDK** (@workflow/ai) for durable workflows
- **Supabase** for authentication and file storage

### AI Integration
The application uses multiple AI providers via the Vercel AI SDK:
- Google Gemini (primary: `gemini-2.5-flash` with thinking mode)
- OpenAI (via `@ai-sdk/openai`)
- Cohere (via `@ai-sdk/cohere`)

### Key Directories

#### `/app`
Next.js App Router pages and API routes:
- `/app/chat` - Interactive chat interface for title research
- `/app/workflow` - Workflow management UI
- `/app/agent` - Agent-based interactions
- `/app/auth` - Authentication pages (login, signup, password reset)
- `/app/api` - API routes for chat, research, workflow triggers, document generation

#### `/lib`
Core business logic and utilities:
- `/lib/agents/` - AI agent implementations using Vercel AI SDK
  - `researchAgent.ts` - Main title research agent (ToolLoopAgent)
  - `property-search-agent.ts` - Property search functionality
  - `name-search-agent.ts` - Name-based document search
  - `classify-agent.ts` - Document classification
  - `subdivision-agent.ts` - Legal description parsing
  - `order-entry-agent.ts` - Order processing
- `/lib/propertysync/` - PropertySync API client
- `/lib/supabase/` - Supabase client, server, and middleware utilities
- `/lib/research/utils.ts` - Title research utilities (chain of title, vesting, deed filtering)
- `/lib/types.ts` - TypeScript type definitions for PropertySync API and workflows

#### `/workflows`
Durable workflow definitions using the Workflow SDK:
- `/workflows/report/` - Title report generation workflow
- `/workflows/chat/` - Chat-based workflow
- `/workflows/steps/` - Reusable workflow steps:
  - `extract-order-info.ts` - Parse order documents
  - `login-propertysync.ts` - PropertySync authentication
  - `search.ts` - Execute PropertySync searches
  - `generate-search-queries.ts` - Generate property search queries
  - `get-subdivisions.ts` - Retrieve subdivision autocomplete data
  - `select-subdivision.ts` - Normalize subdivision names
  - `retrieve-results.ts` - Fetch search results
  - `get-document-details.ts` - Retrieve document metadata and images
  - `get-vesting-info.ts` - Extract vesting information
  - `generate-pdf.ts` - Create PDF reports
  - `send-email.ts` - Email delivery via Resend

#### `/components`
React components organized by function:
- `/components/ui/` - Reusable UI primitives (Radix UI + Tailwind)
- `/components/ai-elements/` - AI-specific components (conversation, message, reasoning, tool displays)
- `/components/tutorial/` - Onboarding components
- Document-specific components: `order.tsx`, `name-search.tsx`, `property-search.tsx`, `search-results.tsx`

#### `/middleware.ts`
Supabase session management middleware. Note: excludes workflow endpoints (`/api/workflow`, `.well-known/workflow/`) and document generation endpoints from auth checks.

## Agent Architecture

### ToolLoopAgent Pattern
The primary research agent (`researchAgent`) uses the `ToolLoopAgent` pattern from Vercel AI SDK with:
- **Tools**: `search` (PropertySync search) and `readDocument` (document OCR/analysis)
- **Output Schema**: Structured responses with `answer` and `sourceDocument`
- **Context Propagation**: Uses `experimental_context` to pass `countyId` and `token` to tools
- **Thinking Mode**: Google Gemini with `thinkingBudget: 8192` for reasoning
- **Stop Condition**: `stepCountIs(10)` prevents infinite loops

### Tool Execution Pattern
Tools use async generators (`async *execute`) to yield status updates:
```typescript
yield { status: 'Searching...' };
// ... perform work
yield { status: 'Search complete.', results: [...] };
```

## PropertySync Integration

### Authentication Flow
1. Login with credentials from environment variables (`PROPERTYSYNC_USERNAME`, `PROPERTYSYNC_PASSWORD`)
2. Receive bearer token
3. Pass token to all subsequent API calls via `Authorization: Bearer ${token}` header

### Document Group Context
- Each county has a unique `documentGroupId` (e.g., Benton: `54766f37-bfad-4922-a607-30963a9c4a60`)
- The document group determines which title plant to search
- All searches require both `documentGroupId` and `token`

### Search Query Structure
PropertySync searches use complex query objects defined in `/lib/types.ts`:
- `subdivisions[]` - Lot, block, addition (legal description)
- `parties[]` - Grantor/grantee names
- `recordingInfos[]` - Date ranges, instrument types
- `excludeOrders`, `excludeRelatedDocuments` - Common filters

### Subdivision Normalization
Legal descriptions must be normalized against the title plant's subdivision autocomplete list:
1. Fetch autocompletes via `/v1/indexing/document-groups/{id}/auto-completes/?type=addition`
2. Use `subdivisionAgent` to fuzzy-match user input to plant data
3. Pass normalized values to search queries

## Workflow Execution Model

### Durable Workflows
The project uses `@workflow/ai` for long-running processes that must survive server restarts:
- Workflows are defined with `"use workflow"` directive
- Each step is durable (survives process restarts)
- Email-triggered workflows (`/api/workflow`) receive attachments, generate reports, and send results

### Workflow Communication
- Workflows use `getWritable()` to stream status updates
- UI components consume workflow streams via `WorkflowChatTransport`
- Data parts in `MyUIMessage` type define all possible workflow events

### Report Generation Flow (`generateReport` workflow)
1. Extract order info from uploaded document (PDF/DOCX)
2. Authenticate with PropertySync
3. Generate and normalize property search queries
4. Execute property search
5. Retrieve all matching documents
6. Perform name searches for chain of title
7. Filter documents by type (deeds, mortgages, exceptions, judgments)
8. Calculate vesting and chain of title
9. Generate PDF report
10. Send email with report attachment

## Environment Variables

Required variables (stored in `.env.local`):
- `PROPERTYSYNC_USERNAME` - PropertySync API username
- `PROPERTYSYNC_PASSWORD` - PropertySync API password
- `RESEND_API_KEY` - Email delivery API key
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (server-side only)

## UI Component Patterns

### AI Elements
The `/components/ai-elements/` directory contains specialized components for AI interactions:
- `Conversation` - Container for message history with scroll management
- `Message` - Individual message rendering (user/assistant)
- `Reasoning` - Collapsible reasoning/thinking display
- `Tool` - Tool call visualization with input/output
- `PromptInput` - Multi-part input with attachments and model selection
- `Sources` - Citation display for grounded responses

### Message Type System
Uses typed messages (`ResearchAgentUIMessage`, `MyUIMessage`) to ensure type-safe rendering of:
- Text responses
- Tool calls and results
- Workflow status updates
- Document attachments

## Document Processing

### PDF Generation
- Uses `@react-pdf/renderer` for structured PDF templates
- Template located in `/workflows/report/templates/title-report.ts`
- Uploads to Supabase storage via `uploadToSupabase` step
- Returns public URL for email embedding

### Document Classification
The `classify-agent` uses AI to categorize uploaded documents (deeds, mortgages, etc.) based on visual analysis.

## Title Research Domain Logic

### Chain of Title
The `createChainOfTitle` utility in `/lib/research/utils.ts`:
- Analyzes deed sequence to determine ownership periods
- Extracts names in title for each period
- Used to scope name searches to relevant timeframes

### Vesting Determination
The `getVestingInfo` step:
- Identifies the most recent deed
- Extracts current owner names
- Returns recording information for title commitment

### Open Mortgage Detection
Mortgages are filtered against releases to identify unreleased liens:
```typescript
const releasedDocumentIds = releases.flatMap(r => r.related.map(d => d.documentId));
const openMortgages = mortgages.filter(m => !releasedDocumentIds.includes(m.documentId));
```

## Configuration Files

### `next.config.ts`
- Wrapped with `withWorkflow()` to enable Workflow SDK integration
- `serverExternalPackages: ["puppeteer"]` prevents bundling issues
- `devIndicators: false` disables dev mode indicators

### `tsconfig.json`
- Uses `workflow` TypeScript plugin for workflow syntax support
- Path alias: `@/*` maps to project root

### `middleware.ts`
Critically excludes certain paths from Supabase auth middleware:
- `/api/workflow` - Workflow webhook endpoint (unauthenticated)
- `/api/create-document`, `/api/create-pdf`, `/api/upload` - Server-to-server endpoints
- `.well-known/workflow/` - Workflow SDK discovery endpoint

## Testing Considerations

- No test framework currently configured
- When adding tests, ensure PropertySync API calls are mocked (use bearer token authentication)
- Workflow tests should use Workflow SDK test utilities
- Agent tests should mock model responses to avoid API costs

## Common Gotchas

1. **Subdivision names must be normalized** - Always use `subdivisionAgent` to match user input to autocomplete values before searching
2. **Document Group ID determines county** - Searches in the wrong county return no results
3. **Bearer tokens expire** - Re-authenticate if PropertySync returns 401
4. **Workflow steps must be pure** - Avoid side effects outside workflow context
5. **Middleware excludes workflow endpoints** - Don't add auth to `/api/workflow` or it will break email triggers
6. **Related documents contain release information** - Check `relatedDocuments` array to identify released mortgages

## Development Workflow

When working on this codebase:
1. Start dev server with `pnpm dev`
2. PropertySync credentials must be configured in `.env.local`
3. Test chat interface at `/chat` with county selection
4. Test workflow execution at `/workflow`
5. Monitor workflow logs in terminal for durable execution status
6. Use browser DevTools to inspect AI SDK streaming responses
