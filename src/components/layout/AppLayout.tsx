import React from 'react';
import { Header } from '@/components/Header';
import { Toaster } from '@/components/ui/sonner';
type AppLayoutProps = {
  children: React.ReactNode;
};
export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />
      <main className="flex-1">{children}</main>
      <Toaster richColors closeButton />
    </div>
  );
}