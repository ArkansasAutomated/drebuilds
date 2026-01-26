

# Final Handshake Build - Routing Stability & Real-Time Revenue Tracking

## Current State Analysis

After thorough exploration, I found:

**Routing (ALREADY CORRECT)**
- `src/App.tsx` is already using `HashRouter` (line 5, 20)
- `src/hooks/useWhopUser.ts` has the correct redirect URI: `https://drebuilds.online/#/auth/whop/callback` (line 57)
- `src/pages/WhopCallback.tsx` also has the correct redirect URI (line 10)
- `whop-oauth` Edge Function validates against `https://drebuilds.online/#/auth/whop/callback` (line 45)

**Webhook Processor (PARTIALLY COMPLETE)**
- `whop-webhook` Edge Function exists and handles membership events
- Missing: Revenue event insertion into `telemetry_events`
- Missing: Supabase Realtime broadcasting to frontend

**Admin UI**
- `LiveEventLog.tsx` uses polling (5s interval) via `useLiveEvents` hook
- Missing: Real-time subscription to `admin_updates` channel
- `RevenuePanel.tsx` fetches from `whop-revenue` Edge Function (30-day aggregated data)

**Current Issues**
- Console shows `whop-products/plans` Edge Function failing with "Failed to fetch"
- No logs for `whop-webhook` (never been called yet)

---

## Implementation Plan

### Step 1: Add ScrollToTop Component

Create a scroll reset helper that resets Lenis/window scroll position on HashRouter navigation.

**File:** `src/components/ScrollToTop.tsx`

**Logic:**
- Listen to `location` changes from `useLocation()`
- On route change, reset `window.scrollTo(0, 0)`
- Integrate into `App.tsx` inside `HashRouter`

---

### Step 2: Enhance Webhook Processor for Revenue Events

Update `supabase/functions/whop-webhook/index.ts` to:

1. **Insert REVENUE telemetry events** when `payment.succeeded` is received:
   - Insert into `telemetry_events` table with:
     - `event_type: 'revenue'`
     - `element_id: payment.id`
     - `metadata: { amount, currency, plan_id, user_id, timestamp }`

2. **Broadcast to Realtime channel** after each event:
   - Use `supabase.channel('admin_updates').send()` to push events
   - Include event type, data summary, and timestamp

**Event Handler Updates:**

| Event Type | Action |
|------------|--------|
| `payment.succeeded` | Insert telemetry event + broadcast |
| `membership.activated` | Update plan_ids + broadcast |
| `membership.deactivated` | Update plan_ids + broadcast |

---

### Step 3: Add Real-Time Subscription to Admin Dashboard

Create a new hook: `src/hooks/useAdminRealtime.ts`

**Logic:**
- Subscribe to `admin_updates` Supabase Realtime channel
- On message received:
  - Prepend to LiveEventLog with glowing Amber animation
  - Trigger refetch of revenue data if event is `revenue` type
  - Show toast notification for significant events

**Integration:**
- Call hook in `AdminDashboard` component
- Pass new events to `LiveEventLog` via context or prop

---

### Step 4: Update LiveEventLog for Real-Time Events

Modify `src/components/admin/LiveEventLog.tsx`:

1. Accept optional `realtimeEvents` prop for pushed events
2. Merge with polled events, deduplicate by ID
3. Add glowing Amber animation for new real-time events:
   ```css
   @keyframes amber-glow {
     0%, 100% { box-shadow: 0 0 4px #FFBF00; }
     50% { box-shadow: 0 0 12px #FFBF00; }
   }
   ```
4. Auto-dismiss glow after 3 seconds

---

### Step 5: Enable Realtime on webhook_events Table

Run a migration to enable Supabase Realtime on the `webhook_events` table:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.webhook_events;
```

This allows the frontend to subscribe to database changes directly.

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/components/ScrollToTop.tsx` | Create | Reset scroll on route change |
| `src/App.tsx` | Modify | Add ScrollToTop component |
| `supabase/functions/whop-webhook/index.ts` | Modify | Add revenue telemetry + broadcast |
| `src/hooks/useAdminRealtime.ts` | Create | Real-time subscription hook |
| `src/components/admin/LiveEventLog.tsx` | Modify | Support real-time events + glow |
| `src/pages/Admin.tsx` | Modify | Integrate real-time hook |
| Migration SQL | Create | Enable realtime on webhook_events |

---

## Technical Details

### ScrollToTop Component

```typescript
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};
```

### Realtime Broadcasting in Edge Function

```typescript
// After processing event, broadcast to admin channel
await supabase.channel('admin_updates').send({
  type: 'broadcast',
  event: 'webhook_event',
  payload: {
    event_type: eventType,
    resource_id: resourceId,
    timestamp: new Date().toISOString(),
    summary: getSummary(eventType, payload),
  },
});
```

### Admin Realtime Hook

```typescript
export const useAdminRealtime = () => {
  const [realtimeEvents, setRealtimeEvents] = useState([]);
  
  useEffect(() => {
    const channel = supabase
      .channel('admin_updates')
      .on('broadcast', { event: 'webhook_event' }, (payload) => {
        setRealtimeEvents(prev => [payload.payload, ...prev.slice(0, 19)]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return { realtimeEvents };
};
```

---

## Verification Checklist

After implementation:

1. **Routing Test**
   - Navigate directly to `https://drebuilds.online/#/admin`
   - Navigate directly to `https://drebuilds.online/#/auth`
   - Confirm no 404 errors

2. **Whop Dashboard Verification**
   - Confirm Redirect URI is set to `https://drebuilds.online/#/auth/whop/callback`

3. **Webhook Test**
   - Configure Whop webhook to point to n8n
   - Trigger a test payment
   - Verify event appears in LiveEventLog with Amber glow

4. **Revenue HUD Test**
   - Confirm RevenuePanel updates after payment webhook

---

## Post-Deployment Configuration

### Whop Dashboard
- **Redirect URI:** `https://drebuilds.online/#/auth/whop/callback`
- **Webhook URL:** Your n8n endpoint

### n8n Workflow
- Forward validated webhooks to: `https://abtfccajohyxameotemf.supabase.co/functions/v1/whop-webhook`
- Include header: `x-webhook-secret: {{WHOP_WEBHOOK_KEY}}`

