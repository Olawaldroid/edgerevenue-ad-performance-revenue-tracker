import '@/lib/errorReporter';
import { enableMapSet } from "immer";
enableMapSet();
import { StrictMode, Suspense, lazy } from 'react'
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
import { AppLayout } from '@/components/layout/AppLayout';
import { Loader2 } from 'lucide-react';
// Lazy load pages for better initial performance
const HomePage = lazy(() => import('@/pages/HomePage').then(module => ({ default: module.HomePage })));
const DemoPage = lazy(() => import('@/pages/DemoPage').then(module => ({ default: module.DemoPage })));
const IntegrationsPage = lazy(() => import('@/pages/IntegrationsPage').then(module => ({ default: module.IntegrationsPage })));
const PricingPage = lazy(() => import('@/pages/PricingPage').then(module => ({ default: module.PricingPage })));
const SettingsPage = lazy(() => import('@/pages/SettingsPage').then(module => ({ default: module.SettingsPage })));
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
        <Suspense fallback={
          <div className="flex h-screen w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        }>
          <RouterProvider router={router} />
        </Suspense>
      </ErrorBoundary>
    </QueryClientProvider>
  </StrictMode>,
)