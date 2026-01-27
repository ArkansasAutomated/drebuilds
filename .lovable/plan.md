
# Fix Plan: Restore Auto-Hash Redirect Guard

## Problem

When users navigate directly to clean URLs like `/admin`, `/auth`, or `/vault`, the app loads but shows the home page instead of the correct route. This happens because:

1. The server's `_redirects` file serves `index.html` for all paths
2. The app loads with URL `/admin` (no hash)
3. `HashRouter` only reads after the `#` symbol (which is empty)
4. HashRouter interprets the path as `/` and renders the home page

## Solution

Add an auto-hash redirect guard in `src/main.tsx` that runs **before** React renders. This guard:
- Detects if the user is on a "clean" URL (has a pathname other than `/`)
- Redirects the browser to the hash-equivalent route (e.g., `/admin` → `/#/admin`)
- Only then allows the React app to render

## Implementation

### File: `src/main.tsx`

Add redirect logic before the `createRoot` call:

```text
┌─────────────────────────────────────────────────┐
│  User visits /admin                             │
│              ↓                                  │
│  Check: pathname !== "/" ?                      │
│              ↓ YES                              │
│  Redirect to: origin + "/#" + pathname + search │
│              ↓                                  │
│  Page reloads at /#/admin                       │
│              ↓                                  │
│  HashRouter reads path as /admin                │
│              ↓                                  │
│  Correct Admin page renders                     │
└─────────────────────────────────────────────────┘
```

**Code to add:**
```typescript
// Auto-redirect clean URLs to hash-based URLs for HashRouter compatibility
const { pathname, search, hash } = window.location;

// If there's a pathname (not just "/") and no hash, redirect to hash-equivalent
if (pathname !== "/" && !hash) {
  // Redirect /admin → /#/admin, /auth?foo=bar → /#/auth?foo=bar
  window.location.replace(window.location.origin + "/#" + pathname + search);
} else {
  // Render the app normally
  createRoot(document.getElementById("root")!).render(<App />);
}
```

This ensures:
- Direct navigation to `/admin` redirects to `/#/admin`
- Query parameters are preserved (e.g., `/auth?callback=...` → `/#/auth?callback=...`)
- The redirect happens before React mounts, so no flash of wrong content

## Routes Protected

| Clean URL | Redirects To |
|-----------|--------------|
| `/admin` | `/#/admin` |
| `/auth` | `/#/auth` |
| `/vault` | `/#/vault` |
| `/auth/whop/callback?code=...` | `/#/auth/whop/callback?code=...` |

## Technical Notes

- Uses `window.location.replace()` instead of `assign()` to avoid adding the broken URL to browser history
- The conditional render ensures the app only mounts after the URL is correct
- Works on all static hosting platforms (Netlify, Vercel, Lovable hosting)
