# Dre Builds Refactor Plan

> Based on code review report. Estimated total: **3-5 days**.

---

## Phase 1: Immediate Fixes (1 day)

### 1.1 Deduplicate Files
| File | Action |
|------|--------|
| `src/hooks/use-toast.ts` | Keep (primary implementation) |
| `src/components/ui/use-toast.ts` | Delete (just re-exports) |
| `src/App.css` | Delete (unused Vite template) |

### 1.2 Add Error Boundaries
- Create `src/components/ErrorBoundary.tsx`
- Wrap `<App />` in `main.tsx`
- Add React Query `onError` callbacks to all hooks

### 1.3 Secure Auth Flow
| File | Change |
|------|--------|
| [useAuth.ts](file:///Users/brassfieldventuresllc/Documents/GitHub/drebuilds/src/hooks/useAuth.ts) | Add rate limiting via Supabase edge function |
| [useAuth.ts](file:///Users/brassfieldventuresllc/Documents/GitHub/drebuilds/src/hooks/useAuth.ts#L79-89) | Move `emailRedirectTo` to env var |

### Evidence Required
- [ ] Screenshot: No duplicate files in `src/hooks/` and `src/components/ui/`
- [ ] Screenshot: ErrorBoundary catching a test error
- [ ] Test run: Auth rate limiting edge function

---

## Phase 2: Security Hardening (1 day)

### 2.1 HMAC Webhook Verification
| File | Change |
|------|--------|
| [WhopCallback.tsx](file:///Users/brassfieldventuresllc/Documents/GitHub/drebuilds/src/pages/WhopCallback.tsx) | Add CSRF token check |
| `supabase/functions/whop-oauth/` | Add HMAC signature verification |

### 2.2 RLS Verification
- Verify RLS policies on: `subscribers`, `telemetry_events`, `content_items`, `button_clicks`, `webhook_events`
- Add admin-only policies if missing

### 2.3 Session Encryption
| File | Change |
|------|--------|
| [useTelemetry.ts](file:///Users/brassfieldventuresllc/Documents/GitHub/drebuilds/src/hooks/useTelemetry.ts#L5-15) | Hash session ID before storage |

### Evidence Required
- [ ] Screenshot: RLS policies in Supabase dashboard
- [ ] Test: Webhook with invalid HMAC returns 401
- [ ] Code diff: Session ID hashing implementation

---

## Phase 3: Performance & Testing (2 days)

### 3.1 Offload Stats to RPC
| File | Change |
|------|--------|
| [useAdminStats.ts](file:///Users/brassfieldventuresllc/Documents/GitHub/drebuilds/src/hooks/useAdminStats.ts) | Create Supabase RPC for `subscriber_stats` |
| [useAdminStats.ts](file:///Users/brassfieldventuresllc/Documents/GitHub/drebuilds/src/hooks/useAdminStats.ts) | Create Supabase RPC for `click_stats` |

### 3.2 Add Query Caching
- Add `staleTime` to: `useContentItems`, `useClickStats`, `useOfferSettings`

### 3.3 Realtime Cleanup
| File | Change |
|------|--------|
| [useAdminRealtime.ts](file:///Users/brassfieldventuresllc/Documents/GitHub/drebuilds/src/hooks/useAdminRealtime.ts#L96-99) | Verified: cleanup already implemented ✓ |

### 3.4 Tests
- Add Vitest unit tests for hooks (target 80% coverage)
- Priority: `useAuth`, `useTelemetry`, `useExitIntent`

### Evidence Required
- [ ] Screenshot: RPC functions in Supabase
- [ ] Test run: `npm run test` with coverage report
- [ ] Performance trace: Before/after query timing

---

## Phase 4: Polish (1 day)

### 4.1 Documentation
- Update `README.md` with project-specific info
- Add JSDoc to all hooks

### 4.2 Global Error Toast
- Add `onError` to `QueryClient` defaultOptions

### 4.3 Tailwind Optimization
- Run `npx tailwindcss --purge` analysis
- Remove unused animation extensions

### 4.4 Accessibility
- Add ARIA labels to `BlinkingCursor`, loaders
- Add `role="progressbar"` to progress indicators

### Evidence Required
- [ ] Screenshot: Updated README
- [ ] Screenshot: ARIA attributes in DevTools
- [ ] Bundle size comparison: Before/after

---

## Summary Checklist

| Phase | Est. Time | Status |
|-------|-----------|--------|
| Phase 1: Immediate Fixes | 1 day | ⬜ Pending |
| Phase 2: Security Hardening | 1 day | ⬜ Pending |
| Phase 3: Performance & Testing | 2 days | ⬜ Pending |
| Phase 4: Polish | 1 day | ⬜ Pending |

---

## Notes

- **Correction from report:** `useAdminRealtime.ts` already has proper cleanup at lines 96-99.
- **Correction from report:** `use-mobile.tsx` uses `matchMedia` with event listener, not raw resize—no debounce needed.
- **Security priority:** Focus on HMAC and RLS before performance work.
