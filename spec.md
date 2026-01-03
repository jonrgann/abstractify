# Email Workflow Feature Specification

## Overview

An email-triggered workflow system that processes incoming emails via Resend webhooks and executes workflows based on recipient email addresses. The MVP focuses on HOA report generation for Benton County, with architecture designed for future expansion to other report types and counties.

## MVP Scope

**In Scope:**
- Single workflow type: HOA Report Creation
- Single county: Benton County
- Single email address: `hoa@orders.abstractify.app`
- Webhook routing infrastructure
- Integration with existing workflow system
- Basic error handling and logging

**Out of Scope (Future Phases):**
- Title report workflows
- Multi-county support
- Complex email routing patterns
- Admin UI for configuration management
- Attachment processing
- Report persistence in database

## Architecture

### High-Level Flow

```
Incoming Email → Resend Webhook → Next.js API Route → Workflow Router → HOA Workflow (Stub) → Logs
```

### Component Details

#### 1. Webhook Endpoint
- **Location**: `/app/api/webhooks/email/route.ts`
- **Method**: POST
- **Responsibilities**:
  - Verify Resend webhook signature
  - Parse webhook payload
  - Extract email data
  - Route to appropriate workflow handler
  - Return 200 OK (always, even on errors)

#### 2. Workflow Router
- **Location**: Inline in webhook endpoint
- **Matching Strategy**: Exact email address matching against configuration file
- **Error Handling**: Log warnings for unmatched emails, return 200

#### 3. Workflow Configuration
- **Location**: `/workflows/email-routing.json`
- **Format**: JSON array of workflow definitions
- **Loaded at**: Runtime (allows configuration changes without rebuild)

#### 4. Workflow Handlers
- **Location**: `/workflows/hoa/hoaReport.ts` (MVP stub)
- **Type**: Durable workflow using `@workflow/ai`
- **Integration**: Separate from existing `generateReport` workflow (different entry point)

## Technical Implementation

### Resend Webhook Payload

Expected payload structure:

```json
{
  "type": "email.received",
  "data": {
    "from": {
      "email": "sender@example.com",
      "name": "Sender Name"
    },
    "to": ["hoa@orders.abstractify.app"],
    "subject": "123 Main St, Anytown",
    "text": "Please generate HOA report for 123 Main St, Anytown, WA",
    "html": "<p>Please generate HOA report for 123 Main St, Anytown, WA</p>",
    "message_id": "unique-message-id-from-resend",
    "attachments": []
  }
}
```

**Note**: Attachments are included in payload but will be ignored in MVP.

### Email Data Extraction

The webhook will extract and pass to workflows:

```typescript
interface EmailData {
  from: {
    email: string;
    name: string;
  };
  to: string[];
  subject: string;
  text: string;
  html: string;
  messageId: string; // For deduplication
  receivedAt: string; // Timestamp for logging
}
```

**Data Extraction Strategy**:
- Sender: `data.from.email` and `data.from.name`
- Recipient: `data.to[0]` (primary recipient)
- Subject: `data.subject`
- Body: `data.text` (plain text preferred) and `data.html` (fallback)
- Message ID: `data.message_id` (Resend unique identifier)
- Timestamp: Server timestamp when received

**Property Address Extraction**:
- Free-form email body/subject parsing
- Use AI agent within workflow to extract property address
- No template or structured format required from senders

### Configuration File Structure

**File**: `/workflows/email-routing.json`

```json
{
  "workflows": [
    {
      "id": "hoa-report-benton",
      "name": "HOA Report Creation - Benton County",
      "trigger": {
        "to": "hoa@orders.abstractify.app"
      },
      "handler": "createHOAReport",
      "enabled": true,
      "description": "Creates an HOA report for properties in Benton County from incoming email",
      "county": "Benton",
      "documentGroupId": "54766f37-bfad-4922-a607-30963a9c4a60"
    }
  ]
}
```

**Configuration Fields**:
- `id`: Unique workflow identifier (string)
- `name`: Human-readable workflow name (string)
- `trigger.to`: Email address that triggers this workflow (string)
- `handler`: Function/workflow name to execute (string)
- `enabled`: Boolean flag to enable/disable workflow (boolean)
- `description`: Documentation for the workflow (string)
- `county`: County name for logging and future use (string)
- `documentGroupId`: PropertySync document group ID for this county (string, optional)

### Webhook Endpoint Implementation

**File**: `/app/api/webhooks/email/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { verifyResendSignature } from '@/lib/resend/verify';
import { loadWorkflowConfig, findWorkflow } from '@/lib/workflow-router';
import { createHOAReport } from '@/workflows/hoa/hoaReport';

export async function POST(request: NextRequest) {
  try {
    // 1. Verify webhook signature
    const body = await request.text();
    const signature = request.headers.get('resend-signature');

    if (!verifyResendSignature(body, signature)) {
      console.error('Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // 2. Parse webhook payload
    const payload = JSON.parse(body);

    if (payload.type !== 'email.received') {
      console.log(`Ignoring webhook type: ${payload.type}`);
      return NextResponse.json({ received: true });
    }

    // 3. Extract email data
    const emailData = {
      from: payload.data.from,
      to: payload.data.to,
      subject: payload.data.subject,
      text: payload.data.text,
      html: payload.data.html,
      messageId: payload.data.message_id,
      receivedAt: new Date().toISOString(),
    };

    // 4. Load configuration and find matching workflow
    const config = loadWorkflowConfig();
    const workflow = findWorkflow(config, emailData.to[0]);

    if (!workflow) {
      console.warn(`No workflow found for email: ${emailData.to[0]}`);
      return NextResponse.json({ received: true });
    }

    if (!workflow.enabled) {
      console.warn(`Workflow disabled: ${workflow.id}`);
      return NextResponse.json({ received: true });
    }

    // 5. Execute workflow handler
    console.log(`Executing workflow: ${workflow.handler} for ${emailData.to[0]}`);

    // Map handler name to actual function
    const handlers: Record<string, Function> = {
      createHOAReport,
    };

    const handlerFn = handlers[workflow.handler];
    if (!handlerFn) {
      console.error(`Handler not found: ${workflow.handler}`);
      return NextResponse.json({ received: true });
    }

    // Execute workflow (non-blocking)
    handlerFn(emailData, workflow).catch((error: Error) => {
      console.error(`Workflow execution failed: ${error.message}`, error);
    });

    // 6. Return success immediately
    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook handler error:', error);
    // Return 200 even on errors to prevent Resend retries
    return NextResponse.json({ received: true });
  }
}
```

### Workflow Router Implementation

**File**: `/lib/workflow-router.ts`

```typescript
import fs from 'fs';
import path from 'path';

interface WorkflowConfig {
  workflows: WorkflowDefinition[];
}

interface WorkflowDefinition {
  id: string;
  name: string;
  trigger: {
    to: string;
  };
  handler: string;
  enabled: boolean;
  description: string;
  county?: string;
  documentGroupId?: string;
}

export function loadWorkflowConfig(): WorkflowConfig {
  const configPath = path.join(process.cwd(), 'workflows/email-routing.json');
  const configData = fs.readFileSync(configPath, 'utf-8');
  return JSON.parse(configData);
}

export function findWorkflow(
  config: WorkflowConfig,
  toEmail: string
): WorkflowDefinition | null {
  return config.workflows.find(
    (workflow) => workflow.trigger.to.toLowerCase() === toEmail.toLowerCase()
  ) || null;
}
```

### Stub HOA Workflow Handler

**File**: `/workflows/hoa/hoaReport.ts`

```typescript
"use workflow";

interface EmailData {
  from: {
    email: string;
    name: string;
  };
  to: string[];
  subject: string;
  text: string;
  html: string;
  messageId: string;
  receivedAt: string;
}

interface WorkflowDefinition {
  id: string;
  name: string;
  county?: string;
  documentGroupId?: string;
}

export async function createHOAReport(
  emailData: EmailData,
  workflow: WorkflowDefinition
) {
  console.log('=== HOA Report Workflow Started ===');
  console.log('Workflow ID:', workflow.id);
  console.log('County:', workflow.county);
  console.log('From:', emailData.from.email);
  console.log('Subject:', emailData.subject);
  console.log('Message ID:', emailData.messageId);
  console.log('Received At:', emailData.receivedAt);
  console.log('Email Body:', emailData.text);
  console.log('=== HOA Report Workflow Complete ===');

  return {
    success: true,
    message: 'HOA report workflow executed successfully (stub)',
    messageId: emailData.messageId,
  };
}
```

**Future Implementation**: This stub will be replaced with actual workflow logic that:
1. Extracts property address from email using AI
2. Authenticates with PropertySync
3. Searches for CC&Rs and HOA documents
4. Generates HOA report PDF
5. Sends report back to sender via email

### Webhook Signature Verification

**File**: `/lib/resend/verify.ts`

```typescript
import crypto from 'crypto';

export function verifyResendSignature(
  payload: string,
  signature: string | null
): boolean {
  if (!signature) {
    return false;
  }

  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    console.error('RESEND_WEBHOOK_SECRET not configured');
    return false;
  }

  try {
    const hmac = crypto.createHmac('sha256', secret);
    const digest = hmac.update(payload).digest('hex');

    // Resend signature format: "t=timestamp,v1=signature"
    const signatureParts = signature.split(',');
    const v1Signature = signatureParts
      .find(part => part.startsWith('v1='))
      ?.split('=')[1];

    if (!v1Signature) {
      return false;
    }

    return crypto.timingSafeEqual(
      Buffer.from(digest),
      Buffer.from(v1Signature)
    );
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}
```

**Reference**: [Resend Webhook Security](https://resend.com/docs/webhooks/verify)

## Security

### Webhook Verification

**Implementation**: HMAC-SHA256 signature verification

**Configuration**:
- Secret stored in environment variable: `RESEND_WEBHOOK_SECRET`
- Obtained from Resend dashboard when creating webhook endpoint
- Signature passed in `resend-signature` header
- Format: `t=<timestamp>,v1=<signature>`

**Behavior**:
- Invalid signatures return 401 Unauthorized
- Missing secret logs error and rejects request
- Timing-safe comparison prevents timing attacks

### Additional Security Measures

**For MVP**:
- Environment variable for webhook secret ✓
- Input validation (webhook payload structure) ✓
- Reject non-email.received events ✓

**Not Implemented (Future)**:
- Rate limiting on webhook endpoint
- Sender email domain allow-list
- Attachment scanning
- Request size limits

## Error Handling

### Strategy

**Primary Approach**: Log and Continue
- Always return 200 OK to Resend
- Log errors internally (console, Vercel logs)
- No automatic retries
- No sender notifications for failures

**Rationale**:
- Prevents Resend retry loops
- Simplifies MVP implementation
- Errors visible in Vercel dashboard logs
- Manual intervention for issues

### Error Scenarios

#### 1. Invalid Webhook Signature
- **Behavior**: Return 401 Unauthorized
- **Logging**: `console.error('Invalid webhook signature')`
- **User Impact**: Email not processed, no notification

#### 2. No Workflow Match
- **Behavior**: Return 200 OK
- **Logging**: `console.warn('No workflow found for email: [address]')`
- **User Impact**: Email ignored, sender receives no feedback

#### 3. Disabled Workflow
- **Behavior**: Return 200 OK
- **Logging**: `console.warn('Workflow disabled: [id]')`
- **User Impact**: Email ignored, sender receives no feedback

#### 4. Handler Not Found
- **Behavior**: Return 200 OK
- **Logging**: `console.error('Handler not found: [handler name]')`
- **User Impact**: Email ignored, sender receives no feedback

#### 5. Workflow Execution Failure
- **Behavior**: Return 200 OK (webhook already responded)
- **Logging**: `console.error('Workflow execution failed: [error]')`
- **User Impact**: Workflow fails, error logged, no sender notification
- **Note**: Workflow executes asynchronously after webhook response

#### 6. Invalid Payload Structure
- **Behavior**: Return 200 OK (caught in try/catch)
- **Logging**: `console.error('Webhook handler error:', error)`
- **User Impact**: Email not processed, no notification

#### 7. Missing Environment Variables
- **Behavior**: Return 401 (signature verification fails)
- **Logging**: `console.error('RESEND_WEBHOOK_SECRET not configured')`
- **User Impact**: All webhooks rejected until configuration fixed

### Duplicate Detection

**Strategy**: Message ID + Timestamp

**Implementation**: Not enforced in MVP
- Resend provides unique `message_id` for each email
- Future implementation can check database/cache for duplicate message IDs
- Current behavior: Process all incoming emails (potential duplicates allowed)

**Rationale**:
- Legitimate duplicate emails are rare
- Database/cache adds complexity
- Can be added in future phase if needed

## Monitoring & Logging

### Logging Strategy

**Development**: Console logs to terminal

**Production**: Vercel dashboard logs (structured logging)

### Log Levels

- **INFO**: Workflow execution start (`console.log`)
- **WARN**: Unmatched emails, disabled workflows (`console.warn`)
- **ERROR**: Signature failures, handler errors, exceptions (`console.error`)

### Logged Data Points

For each webhook:
- Timestamp (automatic)
- Recipient email address
- Sender email address
- Subject line
- Message ID
- Workflow ID (if matched)
- Handler name (if matched)
- Success/failure status
- Error details (if applicable)

### Metrics (Available in Logs)

- Total emails received (count log entries)
- Workflow executions by type (filter by workflow ID)
- Unmatched emails (filter by "No workflow found")
- Failures (filter by ERROR level)

**Monitoring UI**: None for MVP
- Use Vercel dashboard logs for monitoring
- No dedicated admin interface
- No real-time alerts

## Deployment Configuration

### Environment Variables

Add to `.env.local` and Vercel environment:

```bash
# Existing variables
RESEND_API_KEY=re_xxx...
PROPERTYSYNC_USERNAME=username
PROPERTYSYNC_PASSWORD=password
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# New for email webhooks
RESEND_WEBHOOK_SECRET=whsec_xxx...
```

**RESEND_WEBHOOK_SECRET**:
- Obtained from Resend dashboard when creating webhook
- Navigate to: Webhooks → Create Webhook → Copy signing secret
- Required for signature verification
- Different for each environment (development, staging, production)

### Middleware Configuration

**File**: `/middleware.ts`

Ensure webhook endpoint is excluded from authentication:

```typescript
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    '/((?!api/webhooks).*)', // Exclude webhook endpoints from auth
  ],
};
```

**Critical**: The webhook endpoint MUST NOT require authentication, as Resend cannot provide auth tokens.

### Resend Webhook Setup

1. **Login to Resend Dashboard**: https://resend.com/webhooks
2. **Create Webhook**:
   - Click "Create Webhook"
   - URL: `https://your-domain.com/api/webhooks/email`
   - Events: Select "Email Received" only
   - Copy the signing secret
3. **Add Environment Variable**:
   - Add `RESEND_WEBHOOK_SECRET` to Vercel environment variables
   - Redeploy application
4. **Configure Inbound Email**:
   - Navigate to Domains in Resend
   - Select `orders.abstractify.app` domain
   - Configure MX records as instructed
   - Add inbound route: `hoa@orders.abstractify.app` → Your webhook URL
5. **Test**:
   - Send test email to `hoa@orders.abstractify.app`
   - Check Vercel logs for webhook receipt
   - Verify workflow execution logs

### DNS Configuration

For `orders.abstractify.app` to receive emails:

**MX Records** (from Resend):
```
Priority 10: mx1.resend.com
Priority 20: mx2.resend.com
```

**Inbound Route** (Resend Dashboard):
- Pattern: `hoa@orders.abstractify.app`
- Forward to: Webhook URL (configured above)

## Future Enhancements

### Phase 2: Title Reports

- Add Title report workflow
- Email address: `titlereport@orders.abstractify.app`
- Different search parameters (focus on deeds, mortgages, judgments)
- Different PDF template
- Full chain of title analysis
- Add second entry to `/workflows/email-routing.json`

### Phase 3: Multi-County Support

**Option A: Email Subdomain Routing**
- `hoa-benton@orders.abstractify.app`
- `hoa-washington@orders.abstractify.app`
- Parse county from email address

**Option B: AI Content Parsing**
- Extract county from email body/subject
- Use existing subdivision autocomplete to validate county
- More flexible but requires sender training

**Option C: Separate Domains**
- `benton.orders.abstractify.app`
- `washington.orders.abstractify.app`
- DNS-based routing

### Phase 4: Workflow Implementation

Replace stub `createHOAReport` with full implementation:

1. **Email Parsing**: AI-based property address extraction from free-form text
2. **PropertySync Integration**: Authenticate and search for CC&Rs
3. **Document Retrieval**: Fetch relevant HOA documents
4. **PDF Generation**: Create HOA report using custom template
5. **Email Delivery**: Send report PDF back to sender

**Search Parameters for HOA Reports**:
- Document types: CC&Rs, Declarations, Bylaws, Amendments
- Search scope: Subdivision-based (not parcel-based)
- Name searches: Limited or skipped (only property search)

**HOA PDF Template Sections**:
- Property address and legal description
- Subdivision name
- CC&R summary and key provisions
- HOA contact information
- Assessment/fee amounts
- Relevant document images/excerpts

### Phase 5: Advanced Features

- **Admin UI**: Web interface for managing workflow configurations
- **Database Storage**: Persist workflow execution history and reports
- **Duplicate Detection**: Check message IDs against database
- **Sender Notifications**: Email replies for errors and status updates
- **Rate Limiting**: Prevent abuse from high-volume senders
- **Attachment Processing**: Download and classify PDF/DOCX attachments
- **Pattern Matching**: Wildcard email routing (e.g., `*@orders.abstractify.app`)
- **Async Processing**: Queue-based workflow execution for high volume
- **Analytics Dashboard**: Metrics and reporting on workflow performance

## Testing

### MVP Testing Strategy

**Approach**: Deploy and test in production
- No unit tests for MVP
- No local testing infrastructure
- Test with real Resend webhooks in deployed environment

**Testing Checklist**:
1. Deploy to Vercel
2. Configure environment variables
3. Set up Resend webhook
4. Send test email to `hoa@orders.abstractify.app`
5. Check Vercel logs for:
   - Webhook receipt
   - Signature verification success
   - Workflow match
   - Handler execution
   - Stub log output
6. Verify 200 OK response to Resend

### Future Testing Approach

**When adding tests**:
- Unit tests for signature verification
- Unit tests for workflow router matching
- Integration tests with mock Resend payloads
- Workflow execution tests using Workflow SDK test utilities
- End-to-end tests with local webhook tunneling (ngrok)

**Mocking Strategy**:
- Mock Resend webhook payloads (sample JSON)
- Mock PropertySync API responses
- Mock AI model responses (avoid API costs)
- Use in-memory configuration instead of file system

## Implementation Checklist

### MVP Phase 1

- [ ] Create workflow configuration file `/workflows/email-routing.json`
- [ ] Implement webhook endpoint `/app/api/webhooks/email/route.ts`
- [ ] Implement signature verification `/lib/resend/verify.ts`
- [ ] Implement workflow router `/lib/workflow-router.ts`
- [ ] Create stub HOA workflow `/workflows/hoa/hoaReport.ts`
- [ ] Add `RESEND_WEBHOOK_SECRET` environment variable
- [ ] Update middleware to exclude webhook endpoint from auth
- [ ] Deploy to Vercel
- [ ] Configure Resend webhook
- [ ] Configure DNS MX records
- [ ] Test with real email to `hoa@orders.abstractify.app`
- [ ] Verify logs in Vercel dashboard

### Post-MVP

- [ ] Implement full HOA workflow logic
- [ ] Add Title report workflow
- [ ] Add multi-county support
- [ ] Create admin UI for workflow management
- [ ] Add database persistence for reports
- [ ] Implement duplicate detection
- [ ] Add rate limiting
- [ ] Create monitoring dashboard

## Success Criteria

**MVP is successful when**:

1. ✓ Email sent to `hoa@orders.abstractify.app` is received by webhook
2. ✓ Resend signature is verified correctly
3. ✓ Email data is extracted and passed to workflow
4. ✓ Workflow router matches email to HOA workflow
5. ✓ Stub workflow handler executes and logs email data
6. ✓ Webhook returns 200 OK to Resend
7. ✓ All events are visible in Vercel logs
8. ✓ Invalid signatures are rejected with 401
9. ✓ Unmatched emails log warnings and return 200
10. ✓ Configuration file can be modified without code changes

## Documentation

### Setup Guide

**Prerequisites**:
- Vercel project deployed
- Resend account with verified domain
- Access to DNS configuration for `orders.abstractify.app`

**Steps**:
1. Configure MX records for email receiving
2. Create webhook in Resend dashboard
3. Add `RESEND_WEBHOOK_SECRET` to environment variables
4. Deploy application
5. Send test email
6. Monitor Vercel logs

### Workflow Configuration Guide

**To add a new workflow**:

1. Edit `/workflows/email-routing.json`
2. Add new workflow object to `workflows` array
3. Specify unique `id`, `trigger.to` email, and `handler` name
4. Create handler function in `/workflows` directory
5. Import handler in webhook route
6. Add to `handlers` map in webhook route
7. Deploy changes (config loaded at runtime, but code requires deploy)
8. Configure email address in Resend inbound routing

**Example**:

```json
{
  "id": "title-report-benton",
  "name": "Title Report - Benton County",
  "trigger": {
    "to": "titlereport@orders.abstractify.app"
  },
  "handler": "createTitleReport",
  "enabled": true,
  "description": "Creates title report for Benton County properties",
  "county": "Benton",
  "documentGroupId": "54766f37-bfad-4922-a607-30963a9c4a60"
}
```

### Troubleshooting Guide

**Problem**: Webhook returns 401 Unauthorized

**Solutions**:
- Verify `RESEND_WEBHOOK_SECRET` is configured
- Check secret matches Resend dashboard
- Ensure environment variable is deployed (redeploy after adding)

---

**Problem**: Email received but no logs appear

**Solutions**:
- Check Resend webhook dashboard for delivery status
- Verify webhook URL is correct
- Check middleware configuration (webhook should be excluded from auth)
- Check Vercel function logs (not just application logs)

---

**Problem**: "No workflow found" warning in logs

**Solutions**:
- Verify email address in `/workflows/email-routing.json` matches exactly
- Check for case sensitivity issues (router uses lowercase comparison)
- Ensure configuration file is deployed
- Verify email address is configured in Resend inbound routing

---

**Problem**: "Handler not found" error in logs

**Solutions**:
- Verify handler function is imported in webhook route
- Check handler is added to `handlers` map
- Ensure handler name in config matches exported function name
- Redeploy application after adding handler

---

**Problem**: Workflow executes but fails immediately

**Solutions**:
- Check workflow logs for specific error
- Verify workflow syntax (`"use workflow"` directive)
- Check for TypeScript errors in workflow file
- Ensure all dependencies are installed

---

**Problem**: Duplicate emails processed

**Solutions**:
- This is expected behavior in MVP (no deduplication)
- Check Resend dashboard for duplicate webhook deliveries
- Implement message ID caching if duplicates are problematic

## Appendices

### A. Related Documentation

- [Resend Webhooks Documentation](https://resend.com/docs/webhooks)
- [Resend Webhook Events Reference](https://resend.com/docs/api-reference/webhooks/webhook-events)
- [Resend Webhook Security](https://resend.com/docs/webhooks/verify)
- [Resend Inbound Email Guide](https://resend.com/docs/inbound)
- [Next.js App Router Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Workflow SDK Documentation](https://workflow.ai/docs) (if applicable)

### B. Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-01-03 | Use separate workflow runner for email vs upload | Cleaner separation of concerns, easier to maintain different input types |
| 2026-01-03 | Skip attachment processing in MVP | Reduces complexity, focus on routing infrastructure first |
| 2026-01-03 | Return 200 on all errors | Prevents Resend retry loops, simplifies error handling |
| 2026-01-03 | No database persistence for MVP | Email workflow handles delivery, no need to store reports |
| 2026-01-03 | JSON config file over TypeScript | Runtime configurability more important than type safety for routing config |
| 2026-01-03 | Single county/workflow for MVP | Prove concept with minimal scope before expansion |
| 2026-01-03 | Free-form email parsing with AI | Better user experience than requiring structured templates |
| 2026-01-03 | Environment variable for webhook secret | Consistent with existing patterns, secure |
| 2026-01-03 | Stub workflow for MVP | Focus on routing infrastructure, workflow implementation is separate effort |
| 2026-01-03 | Log warnings for unmatched emails | Aids debugging without treating as errors |

### C. Email Workflow Comparison

| Feature | Email-Triggered | Manual Upload (/chat, /workflow) |
|---------|----------------|-----------------------------------|
| Input Method | Email via Resend | File upload in browser |
| Property Address Source | AI extraction from email body | AI extraction from PDF/DOCX |
| Entry Point | `/api/webhooks/email` | `/chat` or `/workflow` pages |
| Workflow Function | `createHOAReport` (separate) | `generateReport` (shared) |
| Authentication | None (webhook public) | Supabase auth required |
| Report Delivery | Email reply via workflow | Download in browser UI |
| Monitoring | Vercel logs only | UI-based with progress updates |
| Error Feedback | Silent (logs only) | Shown to user in UI |

---

## Changelog

- **2026-01-03**: Initial specification created
  - Defined core architecture and components
  - Specified initial workflows (HOA and Title reports)
  - Outlined configuration system
  - Identified open questions and future enhancements

- **2026-01-03**: Updated with implementation decisions
  - Clarified MVP scope (HOA only, Benton County, stub workflow)
  - Specified separate workflow runner approach
  - Defined JSON configuration structure in `/workflows/email-routing.json`
  - Detailed security implementation (Resend signature with env var)
  - Established error handling strategy (return 200, log silently)
  - Removed TBD items with specific technical decisions
  - Added complete code examples for all components
  - Documented deployment and testing procedures
  - Created troubleshooting guide
  - Added decisions log and architecture comparison table
