# EdgeRevenue — Ad Performance & Revenue Tracker
EdgeRevenue is a visually exceptional, Cloudflare edge-native web application designed to track historical ad revenue. It pulls spend data from Facebook Ads and daily earnings from Google AdSense (using mocked integrations), providing a beautiful dashboard with time-series charts, account management, historical reporting, and plan-based access. Built on Cloudflare Workers with a single Durable Object for persistence, the frontend leverages React, ShadCN UI, and Tailwind for optimal visual polish, performance, and responsive design.
## Quick Start
Get started instantly with our one-click deployment to Cloudflare Pages:
`[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/Olawaldroid/edgerevenue-ad-performance-revenue-tracker)` (Placeholder for one-click deploy button)
## Features
- **Unified Dashboard**: Interactive time-series charts for daily revenue and spend, KPI cards (Total Revenue, Spend, ROI), and date-range filters.
- **Multi-Account Aggregation**: Select multiple spend sources (e.g., Facebook Ads accounts) and a single revenue source (e.g., Google AdSense) to see combined performance.
- **Integrations Management**: Easily add, remove, and manage connections to Facebook Ads and Google AdSense with a mock credential setup.
- **Manual Data Pulls**: Simulate fetching the latest 30 days of data for any integration with a "Pull Now" button.
- **Plan-Based Limits**: A mock user system with Free, Pro, and Enterprise tiers demonstrates usage limits on daily data pulls.
- **Mock Billing Flow**: Upgrade your plan through a simulated checkout process that updates your capabilities locally.
- **Reporting & Exports**: Download aggregated performance data as a CSV file or a mock PDF snapshot of your main chart.
- **Settings**: Customize mock preferences for timezone, currency, notifications, and data retention.
- **Visual Excellence**: Modern UI with micro-interactions, smooth animations (Framer Motion), responsive layouts, and high-contrast accessibility.
- **Edge-Native Performance**: Low-latency data fetching via Cloudflare Workers, with mocked API pulls and Durable Object persistence for historical data.
## Technology Stack
- **Frontend**: React 18+, React Router, Tailwind CSS 3+, ShadCN UI, Framer Motion, Recharts, @tanstack/react-query, Zustand, Sonner, Lucide React, React Hook Form + Zod.
- **Backend**: Hono (routing), Cloudflare Workers, Durable Objects (persistence via custom entity system).
- **Build & Dev**: Vite, TypeScript, Bun (package manager), ESLint, Wrangler (Cloudflare CLI).
## Installation
This project uses Bun as the package manager for faster installation and development. Ensure Bun is installed on your system (visit [bun.sh](https://bun.sh) for setup).
1.  **Clone the repository:**
    ```bash
    git clone <your-repo-url>
    cd edge-revenue
    ```
2.  **Install dependencies:**
    ```bash
    bun install
    ```
3.  **Type Generation:**
    Generate types for Cloudflare bindings:
    ```bash
    bun run cf-typegen
    ```
## Development
1.  **Start the development server (Frontend & Backend):**
    This single command starts the Vite frontend and the Wrangler backend worker simultaneously.
    ```bash
    bun run dev
    ```
    The app will be available at `http://localhost:3000` (or the specified port). API endpoints are available at `http://localhost:8787`.
2.  **Key development commands:**
    -   Lint code: `bun run lint`
    -   Build for production: `bun run build`
    -   Preview production build: `bun run preview`
## Deployment
Deploy to Cloudflare Workers for global edge performance:
1.  **Log in to Wrangler:**
    ```bash
    npx wrangler login
    ```
2.  **Deploy:**
    ```bash
    bun run deploy
    ```
    Your app will be live at `<project-name>.<your-account>.workers.dev`.
## Troubleshooting
-   **Blank Page on Deploy:** If your deployed Cloudflare Pages site is blank, ensure `public/_headers` and `vite.config.ts` are correctly configured. The `_headers` file is critical for serving assets with the correct MIME types.
-   **API Errors (404):** Make sure your worker is correctly bound in `wrangler.jsonc` and that the API routes in `worker/user-routes.ts` match what the frontend is calling.
-   **Build Failures:** Ensure all dependencies are correctly listed in `package.json` and that you are using a compatible version of Node.js/Bun.
## Production Notes
-   **Mock Data Limitation:** This application currently uses mock data seeded on the server. It does not connect to live Facebook or Google APIs.
-   **Upgrade Path:** To connect to real APIs, you would need to:
    1.  Implement OAuth2 flows for Facebook and Google.
    2.  Securely store API tokens/credentials using Cloudflare's secret management.
    3.  Replace the mock data generation in `worker/entities.ts` with actual API calls.
    4.  Set up Cloudflare Cron Triggers in `wrangler.jsonc` to automate daily data pulls.
## License
This project is MIT licensed. See the LICENSE file for details.