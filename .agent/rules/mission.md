---
trigger: always_on
---

# MISSION: Dre Builds Web Application

## OBJECTIVE
Build Dre Builds, an AI education content platform for creators like Dre, with admin dashboards for stats/revenue, telemetry tracking, newsletter subscriptions, Whop product integration, and secure auth flows.

## CORE FEATURES
1. Authentication (sign in/up, Whop OAuth callback)
2. Admin dashboard (stats, realtime updates, conversion pipeline, revenue data)
3. Telemetry tracking (events, sessions)
4. Newsletter subscription
5. Content management (items, logs)
6. Mobile detection and responsive UI

## SUCCESS CRITERIA
- [ ] All features implemented per code review fixes
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] All API calls have error handling
- [ ] RLS policies enforced on all tables
- [ ] Responsive design tested on mobile/desktop
- [ ] Security vulnerabilities fixed (auth bypass, webhook HMAC)

## CONSTRAINTS
- Never compromise security
- Never use lazy implementations
- Always follow rules.md

## TECH STACK
- Frontend: Next.js 14 with App Router
- Backend: Supabase
- Styling: Tailwind CSS + shadcn/ui
- State: React Query
- Auth: Supabase Auth with edge verification
- Integrations: Whop API

## DATABASE SCHEMA
[From rules.md - paste complete schema here]

## New: Whop Integration Subsystem
- Path: whop/
- Goal: Seamless API/infra setup for Dre Builds landing page (payments, subs, products, community, auth).
- Master: whop/CLAUDE.md
- Skills: 7 modular .md for auth, payments, delivery, community, apps, webhooks, orchestration.
- Usage: Direct invoke in Claude Code (e.g., "Use whop-auth-setup for OAuth"). No deps on main skills.
- MCP: Connects via Whop's Claude SSE endpoint for automated actions.

## Whop v1.1 Enhancements
- Security rules, analytics (churn/ROI), n8n webhook automation, update monitoring.
- Real @whop/sdk code patterns – ready for live deploy.
- Prioritize: Test analytics skill → expect instant visibility on subscription health (<10% churn target).