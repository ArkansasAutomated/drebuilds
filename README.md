# Dre Builds

AI education content platform and link-in-bio landing page with admin dashboard and telemetry tracking.

**Production URL**: https://drebuilds.online/

## Tech Stack

- **Frontend**: Vite + React 18 + TypeScript
- **Backend**: Supabase (PostgreSQL, Auth, Realtime, Edge Functions)
- **Styling**: Tailwind CSS + shadcn/ui components
- **State**: TanStack React Query

## Features

- 🏠 **Landing Page** - Animated link-in-bio with Framer Motion
- 📊 **Admin Dashboard** - Real-time stats, conversion funnel, live event log
- 📈 **Telemetry** - Click tracking, scroll milestones, session analytics
- 📧 **Newsletter** - Email subscription with rate limiting
- 🔐 **Auth** - Supabase Auth (email + password)
- 🗄️ **Vault** - Admin-only content area with automation assets

## Getting Started

```bash
# Clone and install
git clone https://github.com/drebuilds/drebuilds.git
cd drebuilds
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## Environment Variables

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
VITE_SITE_URL=https://drebuilds.online
```

## Project Structure

```
src/
├── components/     # UI components (shadcn/ui based)
├── hooks/          # Custom React hooks
├── pages/          # Route pages
├── integrations/   # Supabase client
└── test/           # Vitest tests

supabase/
├── functions/      # Edge Functions (admin setup)
└── migrations/     # Database schema
```

## Security

- Row Level Security (RLS) on all tables
- Session ID hashing with tamper detection
- Rate limiting on auth and subscriptions

## License

Private - All rights reserved.
