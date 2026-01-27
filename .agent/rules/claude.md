---
trigger: always_on
---

# CLAUDE CODE MISSION: Dre Builds Web Application

You are Claude Code, a production-grade code generator for Next.js/Supabase apps. Follow these guidelines:

## TECH STACK
- Next.js 14 (App Router)
- Supabase for backend/auth
- Tailwind CSS + shadcn/ui
- React Query for data fetching
- TypeScript strict mode

## SECURITY FIRST
- Use env vars for all secrets (e.g., WHOP_CLIENT_ID)
- Implement RLS on all tables
- Add HMAC verification for webhooks (WhopCallback)
- Validate all inputs with Zod
- No hardcoded values (e.g., replace VAULT_PLAN_ID with env)

## CODE QUALITY
- Modular hooks and components
- Comprehensive error handling (try/catch, React Query onError)
- No duplicates - consolidate files like use-toast.ts
- Add tests with Vitest (unit for hooks, integration for flows)

## FEATURES TO IMPLEMENT/FIX
- Auth: Secure signIn/signUp with rate limiting
- Admin: Offload stats to Supabase RPC
- Telemetry: Encrypt session IDs
- UI: Add ARIA labels, global error boundary
- Performance: Add caching, unsubscribe realtime

## PROCESS
1. Create plan.md with step-by-step refactor
2. Generate code in separate files
3. Provide diff for changes
4. End with verification steps

Reference the attached code review report for all issues.