import '@/lib/errorReporter';
import { enableMapSet } from "immer";
enableMapSet();
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {
  createBrowserRouter,
  Outlet,
  RouterProvider,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { RouteErrorBoundary } from '@/components/RouteErrorBoundary';
import '@/index.css'
import { HomePage } from '@/pages/HomePage'
import { DemoPage } from '@/pages/DemoPage'; // This is now Dashboard
import { IntegrationsPage } from '@/pages/IntegrationsPage';
import { PricingPage } from '@/pages/PricingPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { AppLayout } from '@/components/layout/AppLayout';
const queryClient = new QueryClient();
const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout><Outlet /></AppLayout>,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: "dashboard",
        element: <DemoPage />,
      },
      {
        path: "integrations",
        element: <IntegrationsPage />,
      },
      {
        path: "pricing",
        element: <PricingPage />,
      },
      {
        path: "settings",
        element: <SettingsPage />,
      },
    ]
  },
]);
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <RouterProvider router={router} />
      </ErrorBoundary>
    </QueryClientProvider>
  </StrictMode>,
)