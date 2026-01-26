
# Complete Fix Plan: Routing & Whop API Corrections

## Problem Summary

Two critical issues are preventing proper site functionality:

### Issue 1: Clean URL Links Breaking HashRouter

The `FooterSection.tsx` component uses standard `<a href="/path">` tags instead of React Router's `<Link>` component. With `HashRouter`, clicking these links causes a full browser navigation to `/auth` or `/vault` (without hash), which:
- Triggers a server request for a non-existent path
- Falls back to `index.html` (via the `_redirects` file)
- Loads the app at root `/` instead of the intended route

**Affected Files:**
- `src/components/sections/FooterSection.tsx` - Lines 79-86 use `<a href={link.href}>`
- `src/pages/NotFound.tsx` - Line 16 uses `<a href="/">`

### Issue 2: Whop API v2 Missing Plan Titles

The `whop-products` Edge Function uses v2 API which returns `null` for plan `title` and `description`. The v5 API returns proper `product.title` values like "Vault Membership" and "Premium Access". The current code falls back to generic "Plan plan_xxx" names.

**Current API Response Structure (v2):**
- `initial_price`: Works correctly
- `title`: Always `null`
- `description`: Always `null`
- `direct_link`: Deprecated

**V5 API Response Structure:**
- `initial_price`: Works
- `title`: Still `null` (plan-level title)
- `product.title`: Contains actual name like "Vault Membership"
- `purchase_url`: Replaces `direct_link`

---

## Implementation Plan

### Step 1: Fix FooterSection Navigation

Convert standard anchor tags to React Router `Link` components.

**File:** `src/components/sections/FooterSection.tsx`

**Changes:**
1. Add import for `Link` from `react-router-dom`
2. Replace `<a href={link.href}>` with `<Link to={link.href}>`

**Before:**
```tsx
import { ... } from "framer-motion";

const navLinks = [
  { path: "~/home", label: "Home", href: "/" },
  { path: "~/vault", label: "Vault", href: "/vault" },
  { path: "~/auth", label: "Login", href: "/auth" },
];

<a href={link.href} className="...">
```

**After:**
```tsx
import { Link } from "react-router-dom";

const navLinks = [
  { path: "~/home", label: "Home", href: "/" },
  { path: "~/vault", label: "Vault", href: "/vault" },
  { path: "~/auth", label: "Login", href: "/auth" },
];

<Link to={link.href} className="...">
```

---

### Step 2: Fix NotFound Page Navigation

Convert the "Return to Home" link to use React Router.

**File:** `src/pages/NotFound.tsx`

**Before:**
```tsx
<a href="/" className="text-primary underline hover:text-primary/90">
  Return to Home
</a>
```

**After:**
```tsx
import { Link } from "react-router-dom";

<Link to="/" className="text-primary underline hover:text-primary/90">
  Return to Home
</Link>
```

---

### Step 3: Update Whop Products Edge Function to v5 API

Migrate from v2 to v5 API endpoints and update response field mappings.

**File:** `supabase/functions/whop-products/index.ts`

**Changes:**

1. **Update Plans Endpoint URL (Line 110-111):**
   - From: `https://api.whop.com/api/v2/plans?company_id=...`
   - To: `https://api.whop.com/api/v5/plans?company_id=...`

2. **Update Interface to Match v5 Response:**
```typescript
interface WhopPlan {
  id: string;
  company: { id: string; title: string };
  product: { id: string; title: string };  // New: product object
  plan_type: string;
  visibility: string;
  billing_period: number | null;
  initial_price: number;
  renewal_price: number | null;
  title: string | null;
  description: string | null;
  purchase_url: string;  // Replaces direct_link
}

interface WhopPlansResponse {
  data: WhopPlan[];
  page_info: { /* pagination */ };
}
```

3. **Update Plans Mapping (Lines 133-143):**
```typescript
const plans = (data.data || [])
  .filter((plan) => plan.visibility === "visible")
  .map((plan) => ({
    id: plan.id,
    name: plan.product?.title || plan.title || plan.description || `Plan ${plan.id}`,
    description: plan.description || '',
    price: plan.initial_price / 100,
    renewal_price: plan.renewal_price ? plan.renewal_price / 100 : null,
    billing_period: plan.billing_period,
    direct_link: plan.purchase_url,  // Use purchase_url instead of direct_link
  }));
```

4. **Update Fallback in Checkout (Lines 206-214):**
   - From: `https://api.whop.com/api/v2/plans/${plan_id}`
   - To: `https://api.whop.com/api/v5/plans/${plan_id}`
   - Use `planData.purchase_url` instead of `planData.direct_link`

---

### Step 4: Update Vault Page Plan ID

Configure the actual Whop Plan ID for vault access based on the discovered plans.

**File:** `src/pages/Vault.tsx`

**Change (Line 13):**
```typescript
// Current
const VAULT_PLAN_ID = "plan_vault_access"; // TODO: Replace with actual Whop Plan ID

// Updated (use the Vault Membership plan)
const VAULT_PLAN_ID = "plan_Os2m8UuDrE3w5"; // Vault Membership plan
```

---

## Files Modified Summary

| File | Change Type | Description |
|------|-------------|-------------|
| `src/components/sections/FooterSection.tsx` | Modify | Use `<Link>` instead of `<a>` for navigation |
| `src/pages/NotFound.tsx` | Modify | Use `<Link>` instead of `<a>` for home link |
| `supabase/functions/whop-products/index.ts` | Modify | Upgrade to v5 API, fix field mappings |
| `src/pages/Vault.tsx` | Modify | Set correct vault plan ID |

---

## Whop Plans Reference

Based on API query, here are your active plans:

| Plan ID | Product Title | Price | Type |
|---------|---------------|-------|------|
| `plan_Os2m8UuDrE3w5` | Vault Membership | Free | one_time |
| `plan_dYdU7ewFEENPb` | Website Integration | Free | one_time |
| `plan_BVlDwgD5eVPoW` | Revenue Recovery | Free | one_time |
| `plan_Qu3RCvotmJjyN` | Premium Access | $79.99/mo | renewal (7-day trial) |
| `plan_UBXlF7LJUY36C` | VaultX | Free | one_time |

---

## Technical Details

### Why Standard `<a>` Tags Break HashRouter

When using `HashRouter`:
- URL format: `https://example.com/#/path`
- The browser only sends `https://example.com/` to the server
- Everything after `#` is client-side routing

With `<a href="/path">`:
- Browser navigates to `https://example.com/path`
- Server receives request for `/path`
- Falls back to `index.html` (via `_redirects`)
- App loads at root, hash is empty
- User sees the home page, not `/path`

With `<Link to="/path">`:
- React Router intercepts the click
- Updates URL to `https://example.com/#/path`
- No server request, instant navigation
- Correct route component renders

### V5 API Authorization Header

The v5 API requires the same `Bearer` token format:
```
Authorization: Bearer {WHOP_API_KEY}
```

Your existing `WHOP_API_KEY` secret should work if it has `plan:basic:read` permission.

---

## Verification Steps

After implementation:

1. **Footer Navigation Test:**
   - Click ~/vault link in footer
   - URL should show `/#/vault`, not `/vault`
   - Vault page should render (not redirect to home)

2. **Auth Page Test:**
   - Click ~/auth link in footer
   - URL should show `/#/auth`
   - Login form should appear

3. **Direct URL Test:**
   - Navigate directly to `https://drebuilds.online/#/admin`
   - Admin dashboard should load (if authenticated and admin)

4. **Whop Plans Test:**
   - Visit /vault page
   - Plans should show actual names: "Vault Membership", "Premium Access", etc.
   - Checkout buttons should redirect to Whop purchase URLs
