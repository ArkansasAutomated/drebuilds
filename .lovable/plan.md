
# Fix Plan: Routing and Whop OAuth Issues

## Problems Identified

### Problem 1: Whop OAuth "no_auth_code" Error
When Whop redirects back after authentication, the URL looks like:
```
https://drebuilds.online/?code=ABC123#/auth/whop/callback
```

The authorization code appears BEFORE the `#` hash, not after it. React Router's `useSearchParams()` only reads parameters from WITHIN the hash portion (e.g., `/#/path?code=...`), so it cannot find the code.

### Problem 2: /auth and /admin Show Home Page
When visiting `/auth` or `/admin` directly:
- The auto-hash redirect guard runs and redirects to `/#/auth` or `/#/admin`
- However, the home page with boot animation loads instead
- `/vault` works correctly, which is puzzling

**Root cause**: The ProtectedRoute on `/admin` runs `useAuth()` and `useWhopUser()` which may redirect the user while loading. Combined with the OAuth issue, authentication state may be corrupted.

---

## Solution Overview

### Fix 1: WhopCallback.tsx - Read Code from Window Location
Modify the callback handler to check BOTH React Router's search params AND `window.location.search` for the authorization code.

### Fix 2: main.tsx - Handle OAuth Callback Query Params
Update the redirect guard to preserve query parameters that appear before the hash by moving them into the hash-based URL format.

---

## Implementation Details

### File 1: `src/pages/WhopCallback.tsx`

**Change**: Extract authorization code from `window.location.search` as primary source, with React Router `useSearchParams` as fallback.

```typescript
// Current (broken):
const code = searchParams.get("code");

// Fixed approach:
// First check window.location.search (where Whop puts the code)
const windowParams = new URLSearchParams(window.location.search);
const code = windowParams.get("code") || searchParams.get("code");
```

The `handleCallback` function will be updated to:
1. Parse `window.location.search` using native `URLSearchParams`
2. Extract `code`, `error`, and `error_description` from there
3. Fall back to `useSearchParams()` if not found in window search

### File 2: `src/main.tsx`

**Change**: When redirecting clean URLs to hash-based URLs, also handle the case where query params exist in `window.location.search` and need to be moved into the hash portion.

Current logic:
```typescript
if (pathname !== "/" && !hash) {
  window.location.replace(origin + "/#" + pathname + search);
}
```

Updated logic:
```typescript
// Handle OAuth callbacks: move query params from before # to after route
if (pathname === "/" && search && hash) {
  // URL like: /?code=ABC#/auth/whop/callback
  // Whop puts code in search, route in hash
  // Keep as-is, WhopCallback will read from window.location.search
}

if (pathname !== "/" && !hash) {
  // Clean URL redirect: /admin → /#/admin
  window.location.replace(origin + "/#" + pathname + search);
} else {
  // Render app normally
  createRoot(document.getElementById("root")!).render(<App />);
}
```

The current logic is actually correct for the redirect case. The real fix is in WhopCallback reading from the right place.

---

## Technical Flow After Fix

```text
Whop OAuth Flow:
┌─────────────────────────────────────────────────────────────┐
│ 1. User clicks "Connect with Whop"                          │
│ 2. Redirected to whop.com/oauth                             │
│ 3. User authorizes on Whop                                  │
│ 4. Whop redirects to:                                       │
│    https://drebuilds.online/?code=ABC123#/auth/whop/callback│
│                             │                               │
│ 5. main.tsx sees:           ▼                               │
│    pathname="/" hash="#/auth/whop/callback" search="?code=" │
│    → Condition fails, app renders normally                  │
│                             │                               │
│ 6. HashRouter routes to WhopCallback                        │
│                             │                               │
│ 7. WhopCallback reads code from window.location.search  ◀── │
│    (new fix - was using useSearchParams which returns null) │
│                             │                               │
│ 8. Edge function exchanges code for tokens                  │
│ 9. User authenticated, redirected to /admin or /            │
└─────────────────────────────────────────────────────────────┘
```

---

## Files to Modify

| File | Change Summary |
|------|----------------|
| `src/pages/WhopCallback.tsx` | Read `code` from `window.location.search` instead of React Router's `useSearchParams()` |
| `src/main.tsx` | No changes needed - current logic is correct |

---

## After Implementation

1. **Republish the app** to `drebuilds.online` to deploy the fix
2. Test the Whop OAuth flow:
   - Click "Connect with Whop" on the auth page
   - Authorize on Whop
   - Verify redirect completes successfully without "no_auth_code" error
3. Test direct navigation to `/admin` and `/auth` to confirm routing works

---

## Why /vault Works But /auth and /admin Don't

`/vault` doesn't require authentication to load - it shows content regardless of login state (just gates the assets). However, `/admin` uses `ProtectedRoute` which immediately checks auth state and redirects if not logged in. If there's any timing issue with the auth check running before the route fully mounts, it could cause unexpected behavior.

The OAuth fix should resolve the authentication issues, which should then make `/admin` work correctly once users can successfully authenticate via Whop.
