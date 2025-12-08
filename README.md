# EdgeRevenue — Ad Performance & Revenue Tracker

EdgeRevenue is a visually exceptional, Cloudflare edge-native web application designed to track historical ad revenue. It pulls spend data from Facebook Ads and daily earnings from Google AdSense (using mocked integrations in Phase 1), providing a beautiful dashboard with time-series charts, account management, historical reporting, and plan-based access. Built on Cloudflare Workers with a single Durable Object for persistence, the frontend leverages React, ShadCN UI, and Tailwind for optimal visual polish, performance, and responsive design.

## Key Features

- **Dashboard**: Interactive time-series charts for daily revenue and spend, KPI cards, date-range filters, account selectors, historical tables, and CSV export.
- **Integrations**: Manage Facebook Ads and Google AdSense accounts with mock credential setup, manual "pull now" functionality, and pull status tracking.
- **Settings**: Customize timezone, currency, notifications, and data retention policies.
- **Pricing**: Tiered plans (Free, Pro, Enterprise) with feature comparisons and upgrade CTAs.
- **Visual Excellence**: Modern UI with micro-interactions, smooth animations (Framer Motion), responsive layouts, and high-contrast accessibility.
- **Edge-Native Performance**: Low-latency data fetching via Cloudflare Workers, with mocked API pulls and Durable Object persistence for historical data.

## Technology Stack

- **Frontend**: React 18+, React Router, Tailwind CSS 3+, ShadCN UI, Framer Motion, Recharts, @tanstack/react-query, Zustand, Sonner, Lucide React, React Hook Form + Zod.
- **Backend**: Hono (routing), Cloudflare Workers, Durable Objects (persistence via custom entity system).
- **Data & Utils**: Date-fns, UUID, Immer, Class Variance Authority (CVA).
- **Build & Dev**: Vite, TypeScript, Bun (package manager), ESLint, Wrangler (Cloudflare CLI).
- **UI Primitives**: Radix UI-based components from ShadCN.

## Quick Start

Get started instantly with our one-click deployment:

[cloudflarebutton]

## Installation

This project uses Bun as the package manager for faster installation and development. Ensure Bun is installed on your system (visit [bun.sh](https://bun.sh) for setup).

1. Clone the repository:
   ```
   git clone <your-repo-url>
   cd edge-revenue
   ```

2. Install dependencies:
   ```
   bun install
   ```

3. Set up environment (if needed for local development):
   - Copy `.env.example` to `.env.local` and add any required variables (e.g., API keys for real integrations in future phases).
   - Run type generation for Cloudflare bindings:
     ```
     bun run cf-typegen
     ```

## Development

1. Start the development server:
   ```
   bun run dev
   ```
   The app will be available at `http://localhost:3000` (or the port specified in your environment).

2. In a separate terminal, start the Cloudflare Worker (for API development):
   ```
   bun run dev:worker
   ```

3. Key development commands:
   - Lint code: `bun run lint`
   - Build for production: `bun run build`
   - Preview build: `bun run preview`
   - Generate types: `bun run cf-typegen`

### Usage Examples

- **Dashboard Navigation**: After setup, visit `/dashboard` to view mock revenue data. Use date pickers to filter historical trends and click "Pull Now" for simulated data updates.
- **Adding Integrations**: Navigate to `/integrations`, fill in mock credentials for Facebook Ads or Google AdSense, and test the connection.
- **API Testing**: The backend exposes endpoints like `/api/integrations` and `/api/reports`. Use tools like curl or Postman:
  ```
  curl http://localhost:8787/api/test
  ```
- **Mock Data**: Initial mock accounts and revenue series are seeded on first API call. Extend `shared/mock-data.ts` for custom testing.

The app follows a mobile-first responsive design. Test across devices using browser dev tools.

## Deployment

Deploy to Cloudflare Workers for global edge performance:

1. Ensure Wrangler CLI is installed:
   ```
   bun add -g wrangler
   npx wrangler login
   ```

2. Configure your account ID in `wrangler.jsonc` if needed (auto-detected for logged-in users).

3. Deploy:
   ```
   bun run deploy
   ```

Your app will be live at `<project-name>.<account-id>.workers.dev`. For custom domains, update `wrangler.jsonc` and run `wrangler deploy --env production`.

One-click deployment is also available:

[cloudflarebutton]

### Post-Deployment

- Monitor logs and metrics via the Cloudflare Dashboard.
- For production, enable real integrations in Phase 2 by adding OAuth flows and cron triggers in Wrangler config.
- Scale with Cloudflare's edge network—no additional setup required.

## Contributing

1. Fork the repository and create a feature branch.
2. Make changes and ensure tests pass (`bun run lint`).
3. Commit with conventional messages and push.
4. Open a Pull Request with a clear description.

We welcome contributions for visual enhancements, new features, or bug fixes. Review the [phases roadmap](docs/phases.md) for upcoming work.

## License

This project is MIT licensed. See [LICENSE](LICENSE) for details.