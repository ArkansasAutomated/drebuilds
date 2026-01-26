

# Whop Webhooks Integration via n8n

## Overview

Create a `whop-webhook` Edge Function to receive forwarded Whop events from your n8n workflow. The n8n workflow will receive webhooks from Whop, validate the signature using `WHOP_WEBHOOK_KEY`, and forward valid payloads to the Edge Function for processing.

---

## Architecture Flow

```text
┌─────────────────────┐                 ┌────────────────────────┐
│   Whop Platform     │   POST event    │   n8n Workflow         │
│   (webhook sender)  │────────────────▶│   (Whop Event Webhook) │
└─────────────────────┘                 └────────────────────────┘
                                                 │
                                                 │ Validate Signature
                                                 │ (Standard Webhooks)
                                                 ▼
                                        ┌────────────────────────┐
                                        │   HTTP Request Node    │
                                        │   POST to Edge Function│
                                        └────────────────────────┘
                                                 │
                                                 ▼
                                        ┌────────────────────────┐
                                        │  whop-webhook          │
                                        │  Edge Function         │
                                        │  • Process events      │
                                        │  • Update database     │
                                        └────────────────────────┘
```

---

## Implementation Steps

### Step 1: Create Database Table for Event Logging

A `webhook_events` table stores all incoming events for auditing and deduplication.

**Schema:**

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| event_id | TEXT | Whop's unique event ID (prevents duplicates) |
| event_type | TEXT | Event type (e.g., `payment.succeeded`) |
| resource_id | TEXT | ID of affected resource |
| payload | JSONB | Full webhook payload |
| processed | BOOLEAN | Whether event was handled |
| error_message | TEXT | Error details if failed |
| created_at | TIMESTAMP | When received |

**RLS Policies:**
- Admin-only SELECT for viewing logs
- No INSERT policy needed (uses service role from Edge Function)

---

### Step 2: Create `whop-webhook` Edge Function

**File:** `supabase/functions/whop-webhook/index.ts`

This function will:
1. Accept POST requests from n8n (with a shared secret for verification)
2. Check for duplicate events using `event_id`
3. Route to appropriate handler based on event type
4. Update `whop_users.plan_ids` for membership events
5. Log all events to `webhook_events` table

**Security:**
- Validates `x-webhook-secret` header matches `WHOP_WEBHOOK_KEY`
- No CORS needed (server-to-server communication)
- Rate limiting via n8n (no browser access)

**Event Handlers:**

| Event Type | Action |
|------------|--------|
| `payment.succeeded` | Log payment event |
| `membership.activated` | Add `plan_id` to user's `plan_ids` array |
| `membership.deactivated` | Remove `plan_id` from `plan_ids` array |
| `membership.went_valid` | Same as activated |
| `membership.went_invalid` | Same as deactivated |
| `checkout.completed` | Log checkout for analytics |

---

### Step 3: Update n8n Workflow

Add nodes to your existing workflow:

1. **IF Node**: Check if webhook-signature is valid (n8n can validate Standard Webhooks)
2. **HTTP Request Node**: POST to Edge Function with:
   - URL: `https://abtfccajohyxameotemf.supabase.co/functions/v1/whop-webhook`
   - Header: `x-webhook-secret: {{WHOP_WEBHOOK_KEY}}`
   - Body: Forward the entire Whop payload

---

### Step 4: Update `supabase/config.toml`

Add the new function configuration:

```toml
[functions.whop-webhook]
verify_jwt = false
```

---

## Detailed Edge Function Logic

### Membership Plan Updates

When a membership event is received, the function will:

1. Extract `membership.user.id` (Whop user ID) and `membership.plan.id` (Plan ID)
2. Query `whop_users` by `whop_user_id`
3. For activation: Use Postgres array append if plan not already present
4. For deactivation: Use Postgres array remove to delete the plan

**SQL Pattern for Updates:**
```sql
-- Add plan_id (activation)
UPDATE whop_users 
SET plan_ids = array_append(plan_ids, 'new_plan_id')
WHERE whop_user_id = 'xxx' 
  AND NOT ('new_plan_id' = ANY(plan_ids));

-- Remove plan_id (deactivation)
UPDATE whop_users 
SET plan_ids = array_remove(plan_ids, 'old_plan_id')
WHERE whop_user_id = 'xxx';
```

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `supabase/functions/whop-webhook/index.ts` | Create | Webhook event processor |
| `supabase/config.toml` | Modify | Add function config |
| Migration SQL | Create | `webhook_events` table + RLS |

---

## n8n Workflow Updates

After deployment, update your n8n workflow to add:

1. **Crypto Node** (or Code Node): Validate Standard Webhooks signature using `WHOP_WEBHOOK_KEY`
2. **HTTP Request Node**: Forward valid events to the Edge Function

**Webhook Validation Logic (for n8n Code Node):**
```javascript
// Standard Webhooks signature validation
const crypto = require('crypto');

const webhookId = $input.headers['webhook-id'];
const timestamp = $input.headers['webhook-timestamp'];
const signature = $input.headers['webhook-signature'];
const body = JSON.stringify($input.body);

// Check timestamp (reject if > 5 min old)
const now = Math.floor(Date.now() / 1000);
if (Math.abs(now - parseInt(timestamp)) > 300) {
  throw new Error('Webhook timestamp too old');
}

// Compute expected signature
const signedPayload = `${webhookId}.${timestamp}.${body}`;
const secret = Buffer.from(webhookKey, 'base64');
const expectedSig = crypto
  .createHmac('sha256', secret)
  .update(signedPayload)
  .digest('base64');

// Compare (v1 prefix in signature header)
const sigParts = signature.split(' ');
const isValid = sigParts.some(s => s.startsWith('v1,') && s.slice(3) === expectedSig);

return { isValid, payload: $input.body };
```

---

## Whop Dashboard Configuration

Configure the webhook in Whop dashboard to point to your n8n URL:

**Webhook URL:** `https://n8n.srv1020587.hstgr.cloud/webhook/04426f25-847d-4ce7-b43f-7e95e780f2c8`

**Events to Enable:**
- `payment.succeeded`
- `membership.activated`
- `membership.deactivated`
- `membership.went_valid`
- `membership.went_invalid`
- `checkout.completed`

---

## Verification Steps

After implementation:

1. Deploy the Edge Function
2. Update n8n workflow with HTTP Request node
3. Configure Whop webhook in dashboard pointing to n8n
4. Trigger a test event (test purchase or membership change)
5. Check `webhook_events` table for logged event
6. Verify `whop_users.plan_ids` updates correctly

---

## Technical Details

### Edge Function Header Validation

```typescript
// Verify request is from n8n with shared secret
const webhookSecret = req.headers.get("x-webhook-secret");
const expectedSecret = Deno.env.get("WHOP_WEBHOOK_KEY");

if (!webhookSecret || webhookSecret !== expectedSecret) {
  console.warn("Invalid webhook secret");
  return new Response(
    JSON.stringify({ error: "Unauthorized" }),
    { status: 401 }
  );
}
```

### Plan ID Management

The `has_vault_plan()` function already checks for `plan_vault_access` in `plan_ids`:

```sql
EXISTS (
  SELECT 1 FROM public.whop_users 
  WHERE user_id = _user_id 
  AND 'plan_vault_access' = ANY(plan_ids)
)
```

When you configure a vault-access plan in Whop, you'll need to:
1. Note the Plan ID from Whop dashboard
2. The webhook will automatically add/remove this ID from `plan_ids`
3. Update `has_vault_plan()` to check for your specific plan ID if needed

