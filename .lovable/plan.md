
# Phase 4: Dynamic Commerce and Content Gating

## Overview
This phase implements three major features:
1. **The Product Sync** - Fetch Whop plans dynamically and generate checkout sessions
2. **The Builder's Vault** - A gated content page with membership-based access control
3. **Revenue Telemetry** - Admin dashboard with payment visualization

---

## Task 1: The Product Sync

### New Edge Function: `whop-products`
Create a dedicated Edge Function to handle Whop product operations.

**File:** `supabase/functions/whop-products/index.ts`

**Capabilities:**
- `GET /plans` - Fetch active plans from Whop API using company_id
- `POST /checkout` - Generate dynamic checkout session using `checkoutConfigurations.create`

**Implementation:**
```text
+---------------------------+
|   whop-products function  |
+---------------------------+
|  GET: List company plans  |
|  - Uses WHOP_API_KEY      |
|  - Returns plan details   |
|    (id, name, price, desc)|
+---------------------------+
|  POST: Create checkout    |
|  - Receives plan_id       |
|  - Creates checkout config|
|  - Returns checkout_url   |
+---------------------------+
```

### Update LogicGatesSection.tsx

**Changes:**
- Add `useQuery` hook to fetch Whop plans from the new Edge Function
- Map `initial_price` and `description` from Whop API to UI cards
- Replace static `TextSwapButton` with checkout-enabled version
- On click: Call Edge Function to generate checkout session, then redirect

**Data Flow:**
```text
LogicGatesSection
      |
      v
[useQuery: whop-products/plans]
      |
      v
[Map: whop_plan -> UI card]
      |
      v
[onClick: POST /checkout]
      |
      v
[Redirect: checkout_url]
```

### Hook: `useWhopProducts`
Create a new hook for fetching and managing Whop products.

**File:** `src/hooks/useWhopProducts.ts`

**Returns:**
- `plans` - Array of Whop plans with pricing
- `isLoading` - Loading state
- `createCheckout(planId)` - Function to generate checkout session

---

## Task 2: The Builder's Vault (Gated UI)

### New Page: `/vault`

**File:** `src/pages/Vault.tsx`

**Access Logic:**
```text
User visits /vault
      |
      v
[Check: useWhopUser().hasPlan(VAULT_PLAN_ID)]
      |
      +---> YES --> Display Asset Grid
      |
      +---> NO  --> Display Locked Terminal
```

### Unlocked State: Asset Grid

**Design (Technical Brutalist):**
- High-density grid of downloadable assets
- Categories: Blueprints, Code Snippets, Templates
- Each card shows: Title, Description, File Type, Download button
- Download button triggers telemetry event via `useTelemetry`

**Component Structure:**
```text
src/components/vault/
  ├── VaultAssetGrid.tsx      # Main grid container
  ├── VaultAssetCard.tsx      # Individual asset card
  └── VaultLockedState.tsx    # Locked terminal overlay
```

### Locked State: Terminal Overlay

**Design:**
- Blurred background showing the asset grid (teaser)
- Terminal-style overlay with:
  - Header: `> ACCESS_RESTRICTED`
  - Message: `Upgrade to [Plan Name] to unlock The Builder's Vault`
  - CTA Button: "Upgrade Now" -> triggers checkout flow
- Electric Amber accents consistent with admin dashboard

### Database: `vault_assets` Table

**Schema:**
```sql
CREATE TABLE public.vault_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- 'blueprint', 'code', 'template'
  file_url TEXT NOT NULL,
  file_type TEXT, -- 'pdf', 'zip', 'ts', etc.
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: Only authenticated users with vault access can download
```

### Route Configuration

**Update:** `src/App.tsx`
- Add `/vault` route pointing to new Vault page
- No ProtectedRoute wrapper (handled internally for UX)

---

## Task 3: Revenue Telemetry

### New Edge Function: `whop-revenue`

**File:** `supabase/functions/whop-revenue/index.ts`

**Capabilities:**
- Fetch payments from Whop API using `payments.list` endpoint
- Filter by company_id and date range (last 30 days)
- Return daily aggregated revenue data

### Admin Dashboard: Revenue Panel

**File:** `src/components/admin/RevenuePanel.tsx`

**Design:**
- Card with Technical Brutalist styling
- Header: `> REVENUE_STREAM`
- Cyan-Blue (#00E5FF) line chart showing daily revenue
- Quick stats: Total 30-day revenue, Average daily, Peak day
- Uses recharts `LineChart` component

**Chart Implementation:**
```text
+--------------------------------+
| > REVENUE_STREAM         LIVE  |
+--------------------------------+
|  $12,450      $415      $890  |
|  30D Total    Daily Avg  Peak  |
+--------------------------------+
|                                |
|     [Cyan Line Chart]          |
|     ___/\___/\_______/\__      |
|    /                           |
|   /                            |
+--------------------------------+
|  // Last 30 days               |
+--------------------------------+
```

### Hook: `useRevenueData`

**File:** `src/hooks/useRevenueData.ts`

**Returns:**
- `dailyRevenue` - Array of { date, amount } for charting
- `totalRevenue` - Sum of last 30 days
- `averageDaily` - Daily average
- `peakDay` - Highest revenue day
- `isLoading` - Loading state

### Admin Integration

**Update:** `src/pages/Admin.tsx`
- Add RevenuePanel to the dashboard layout
- Position in Row 2 alongside ConversionFunnel or as a new row

---

## Technical Implementation Details

### Edge Function: `whop-products/index.ts`

```typescript
// Key endpoints:
// GET:  Fetch plans -> https://api.whop.com/v5/companies/{company_id}/plans
// POST: Create checkout -> https://api.whop.com/v5/checkout_configurations

// Security:
// - Rate limiting (10 req/min/IP)
// - JWT validation for checkout creation
// - CORS headers
```

### Edge Function: `whop-revenue/index.ts`

```typescript
// Key endpoint:
// GET: Fetch payments -> https://api.whop.com/v5/companies/{company_id}/payments

// Query params:
// - created_after: 30 days ago (ISO timestamp)
// - status: 'completed'

// Returns aggregated daily totals
```

### Vault Access Control

```typescript
// In Vault.tsx
const { hasPlan, isLoading } = useWhopUser();
const VAULT_PLAN_ID = "plan_xxxxxxxxx"; // Configured plan ID

const hasVaultAccess = hasPlan(VAULT_PLAN_ID);
```

### Telemetry Integration

```typescript
// In VaultAssetCard.tsx
const { trackClick } = useTelemetry();

const handleDownload = (assetId: string) => {
  trackClick(`vault_download_${assetId}`, { category: asset.category });
  // Trigger download
};
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `supabase/functions/whop-products/index.ts` | Whop plans & checkout Edge Function |
| `supabase/functions/whop-revenue/index.ts` | Revenue data Edge Function |
| `src/pages/Vault.tsx` | Builder's Vault page |
| `src/components/vault/VaultAssetGrid.tsx` | Asset grid component |
| `src/components/vault/VaultAssetCard.tsx` | Individual asset card |
| `src/components/vault/VaultLockedState.tsx` | Locked terminal overlay |
| `src/components/admin/RevenuePanel.tsx` | Revenue chart panel |
| `src/hooks/useWhopProducts.ts` | Whop products hook |
| `src/hooks/useRevenueData.ts` | Revenue data hook |

## Files to Modify

| File | Changes |
|------|---------|
| `src/App.tsx` | Add `/vault` route |
| `src/components/sections/LogicGatesSection.tsx` | Integrate Whop products & checkout |
| `src/pages/Admin.tsx` | Add RevenuePanel |
| `supabase/config.toml` | Register new Edge Functions |

## Database Migration

- Create `vault_assets` table with RLS policies
- Admins can manage assets
- Authenticated users with vault plan can read/download

---

## Configuration Required

### Vault Plan ID
You will need to provide the Whop Plan ID that grants access to The Builder's Vault. This will be used in the `useWhopUser().hasPlan(planId)` check.

### Sample Vault Assets
Initial seed data for the vault can be added after the table is created.

---

## Security Considerations

1. **Edge Functions**: All Whop API calls happen server-side (secrets protected)
2. **Checkout Sessions**: Generated per-request, not stored client-side
3. **Asset Downloads**: Protected by RLS and plan membership verification
4. **Revenue Data**: Only accessible by admin users

