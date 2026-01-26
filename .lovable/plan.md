
# HashRouter Migration Plan

## Overview
Switch from `BrowserRouter` to `HashRouter` to ensure 100% deployment stability. This changes URL structure from `/path` to `/#/path`, which works on any static hosting platform without server-side configuration.

---

## Files to Modify

### 1. Core Routing Setup
**File:** `src/App.tsx`

| Line | Current | Change To |
|------|---------|-----------|
| 5 | `import { BrowserRouter, Routes, Route }` | `import { HashRouter, Routes, Route }` |
| 20 | `<BrowserRouter>` | `<HashRouter>` |
| 30 | `</BrowserRouter>` | `</HashRouter>` |

---

### 2. Whop OAuth Redirect URIs (Frontend)

**File:** `src/hooks/useWhopUser.ts`

| Line | Current | Change To |
|------|---------|-----------|
| 34 | `const REDIRECT_URI = "https://drebuilds.online/auth/whop/callback";` | `const REDIRECT_URI = "https://drebuilds.online/#/auth/whop/callback";` |

**File:** `src/pages/WhopCallback.tsx`

| Line | Current | Change To |
|------|---------|-----------|
| 10 | `const REDIRECT_URI = "https://drebuilds.online/auth/whop/callback";` | `const REDIRECT_URI = "https://drebuilds.online/#/auth/whop/callback";` |

---

### 3. Whop OAuth Redirect URI (Edge Function)

**File:** `supabase/functions/whop-oauth/index.ts`

| Line | Current | Change To |
|------|---------|-----------|
| 30 | `const EXPECTED_REDIRECT_URI = "https://drebuilds.online/auth/whop/callback";` | `const EXPECTED_REDIRECT_URI = "https://drebuilds.online/#/auth/whop/callback";` |

---

### 4. Auth Redirect URL

**File:** `src/hooks/useAuth.ts`

| Line | Current | Change To |
|------|---------|-----------|
| 79 | `const redirectUrl = \`\${window.location.origin}/\`;` | `const redirectUrl = \`\${window.location.origin}/#/\`;` |

---

### 5. Checkout Redirect URLs

**File:** `src/hooks/useWhopProducts.ts`

| Line | Current | Change To |
|------|---------|-----------|
| 50 | `redirect_url: redirectUrl \|\| window.location.origin + "/vault",` | `redirect_url: redirectUrl \|\| window.location.origin + "/#/vault",` |

**File:** `supabase/functions/whop-products/index.ts`

| Line | Current | Change To |
|------|---------|-----------|
| 172 | `redirect_url: redirect_url \|\| "https://drebuilds.online/vault",` | `redirect_url: redirect_url \|\| "https://drebuilds.online/#/vault",` |

---

## URL Structure After Migration

| Current URL | New Hash-Based URL |
|-------------|-------------------|
| `drebuilds.online/` | `drebuilds.online/#/` |
| `drebuilds.online/auth` | `drebuilds.online/#/auth` |
| `drebuilds.online/vault` | `drebuilds.online/#/vault` |
| `drebuilds.online/admin` | `drebuilds.online/#/admin` |
| `drebuilds.online/auth/whop/callback` | `drebuilds.online/#/auth/whop/callback` |

---

## What Stays the Same

### Internal Navigation (No Changes Needed)
All of the following continue to work automatically because React Router handles the hash prefix internally:
- `<Link to="/vault">` - Works (navigates to `/#/vault`)
- `navigate("/admin")` - Works (navigates to `/#/admin`)
- `<NavLink to="/auth">` - Works (navigates to `/#/auth`)
- `location.pathname` checks - Work correctly under HashRouter

### Anchor Scrolling (No Changes Needed)
- `#hero`, `#logic-gates`, `#tech-stack` in `MobileCommandCenter.tsx`
- These are DOM element IDs, not routes, so they remain unchanged

### Static Assets (No Changes Needed)
- `/favicon.svg`, `/og-terminal-card.svg` - Absolute paths from root are unaffected
- Brand SVGs imported via ES modules - Bundled by Vite, unaffected
- All images and fonts load from their original paths

---

## External Configuration Required

### Whop Dashboard Update
After deployment, update the OAuth redirect URI in your Whop application settings:
- **Current:** `https://drebuilds.online/auth/whop/callback`
- **New:** `https://drebuilds.online/#/auth/whop/callback`

---

## Implementation Order

1. **Update `src/App.tsx`** - Switch BrowserRouter to HashRouter
2. **Update `src/hooks/useWhopUser.ts`** - Hash-based OAuth redirect URI
3. **Update `src/pages/WhopCallback.tsx`** - Hash-based OAuth redirect URI
4. **Update `src/hooks/useAuth.ts`** - Hash-based email confirmation redirect
5. **Update `src/hooks/useWhopProducts.ts`** - Hash-based checkout redirect
6. **Update `supabase/functions/whop-oauth/index.ts`** - Expected redirect URI validation
7. **Update `supabase/functions/whop-products/index.ts`** - Fallback checkout redirect
8. **Deploy and redeploy Edge Functions**
9. **Update Whop Dashboard** with new redirect URI

---

## Verification Steps

After deployment:
1. Navigate directly to `https://drebuilds.online/#/admin` - Should load Admin page
2. Navigate directly to `https://drebuilds.online/#/vault` - Should load Vault page
3. Navigate directly to `https://drebuilds.online/#/auth` - Should load Auth page
4. Test Whop OAuth flow end-to-end
5. Test internal navigation from all CTA buttons
