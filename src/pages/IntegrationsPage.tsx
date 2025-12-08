import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { IntegrationAccount, IntegrationPlatform } from '@shared/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter, SheetDescription } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Loader2, CheckCircle, AlertTriangle, TestTube2, Trash } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
function IntegrationCard({ account }: { account: IntegrationAccount }) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<'idle' | 'pulling' | 'success' | 'error'>('idle');
  const pullMutation = useMutation({
    mutationFn: () => api(`/api/integrations/${account.id}/pull`, { method: 'POST' }),
    onMutate: () => setStatus('pulling'),
    onSuccess: (data: { message: string }) => {
      toast.success(`Pull for ${account.accountName} successful.`, { description: data.message });
      setStatus('success');
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      queryClient.invalidateQueries({ queryKey: ['report'] });
      queryClient.invalidateQueries({ queryKey: ['advancedReport'] });
      setTimeout(() => setStatus('idle'), 3000);
    },
    onError: (error: any) => {
      const errorMessage = error.message || 'An unknown error occurred.';
      toast.error(`Pull for ${account.accountName} failed.`, { description: errorMessage });
      setStatus('error');
      setTimeout(() => setStatus('idle'), 5000);
    },
  });
  const deleteMutation = useMutation({
    mutationFn: () => api(`/api/integrations/${account.id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success('Integration deleted successfully.');
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      queryClient.invalidateQueries({ queryKey: ['report'] });
      queryClient.invalidateQueries({ queryKey: ['advancedReport'] });
    },
    onError: (error: Error) => {
      toast.error('Failed to delete integration.', { description: error.message });
    },
  });
  const testConnection = () => {
    toast.info("Testing connection...", { id: 'test-connection' });
    setTimeout(() => {
        toast.success("Connection successful!", { id: 'test-connection' });
    }, 1500);
  }
  const getStatusIcon = () => {
    switch (status) {
      case 'pulling': return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return null;
    }
  };
  return (
    <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
      <Card className="flex flex-col h-full">
        <CardHeader className="flex-row items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {account.platform === 'facebook_ads' ? 'Facebook Ads' : 'Google AdSense'}
            </CardTitle>
            <CardDescription>{account.accountName}</CardDescription>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                <Trash className="h-4 w-4 text-muted-foreground" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Integration?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently remove the "{account.accountName}" integration and all its associated historical data. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => deleteMutation.mutate()} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardHeader>
        <CardContent className="flex-1">
          <p className="text-sm text-muted-foreground">
            Last pulled: {account.lastPulledAt ? `${formatDistanceToNow(new Date(account.lastPulledAt))} ago` : 'Never'}
          </p>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" size="sm" onClick={testConnection}><TestTube2 className="mr-2 h-4 w-4" />Test</Button>
          <Button size="sm" onClick={() => pullMutation.mutate()} disabled={status === 'pulling'}>
            {getStatusIcon()}
            <span className={status !== 'idle' ? 'ml-2' : ''}>
              {status === 'pulling' ? 'Pulling...' : 'Pull Now'}
            </span>
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
function EmptyStateCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const isDark = document.documentElement.classList.contains('dark');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const barColor = isDark ? '#3f3f46' : '#e4e4e7';
        const revenueColor = 'hsl(var(--chart-2))';
        const spendColor = 'hsl(var(--chart-5))';
        // Draw bars
        ctx.fillStyle = barColor;
        ctx.fillRect(30, 80, 20, -50);
        ctx.fillRect(60, 80, 20, -30);
        ctx.fillStyle = revenueColor;
        ctx.fillRect(90, 80, 20, -60);
        ctx.fillStyle = spendColor;
        ctx.fillRect(90, 80, 20, 20);
        ctx.fillStyle = barColor;
        ctx.fillRect(120, 80, 20, -40);
    }, []);
    return <canvas ref={canvasRef} width="170" height="100" className="opacity-50" />;
}
export function IntegrationsPage() {
  const [isSheetOpen, setSheetOpen] = useState(false);
  const [platform, setPlatform] = useState<IntegrationPlatform>('facebook_ads');
  const [accountName, setAccountName] = useState('');
  const queryClient = useQueryClient();
  const { data: accounts, isLoading } = useQuery<IntegrationAccount[]>({
    queryKey: ['integrations'],
    queryFn: () => api('/api/integrations'),
  });
  const addAccountMutation = useMutation({
    mutationFn: (newAccount: { platform: IntegrationPlatform; accountName: string }) =>
      api('/api/integrations', { method: 'POST', body: JSON.stringify(newAccount) }),
    onSuccess: () => {
      toast.success('Integration added successfully!');
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      setSheetOpen(false);
      setAccountName('');
    },
    onError: (error) => {
      toast.error('Failed to add integration.', { description: error.message });
    },
  });
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountName.trim()) {
      toast.warning('Account name is required.');
      return;
    }
    addAccountMutation.mutate({ platform, accountName });
  };
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-8 md:py-10 lg:py-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
            <p className="text-muted-foreground">Manage your connected ad accounts.</p>
          </div>
          <Sheet open={isSheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" /> Add Integration</Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Add New Integration</SheetTitle>
                <SheetDescription>Connect a new ad platform to start tracking.</SheetDescription>
              </SheetHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="platform">Platform</Label>
                    <Select onValueChange={(value) => setPlatform(value as IntegrationPlatform)} defaultValue={platform}>
                      <SelectTrigger id="platform"><SelectValue placeholder="Select a platform" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="facebook_ads">Facebook Ads</SelectItem>
                        <SelectItem value="google_adsense">Google AdSense</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Account Name</Label>
                    <Input id="name" value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder="e.g. My Main Campaign" />
                  </div>
                  <div className="space-y-2 pt-4">
                    <Label>API Credentials (Mock)</Label>
                    <Input disabled value="[mock-api-key-prefilled]" />
                    <p className="text-sm text-muted-foreground">In this demo, credentials are not required.</p>
                  </div>
                </div>
                <SheetFooter>
                  <Button type="submit" disabled={addAccountMutation.isPending}>
                    {addAccountMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Add Account
                  </Button>
                </SheetFooter>
              </form>
            </SheetContent>
          </Sheet>
        </div>
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({length: 3}).map((_, i) => <Skeleton key={i} className="h-56 w-full" />)}
          </div>
        ) : accounts && accounts.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {accounts.map(acc => <IntegrationCard key={acc.id} account={acc} />)}
          </div>
        ) : (
          <div className="text-center py-16 border-2 border-dashed rounded-lg flex flex-col items-center">
            <EmptyStateCanvas />
            <h3 className="text-xl font-semibold mt-4">No integrations yet</h3>
            <p className="text-muted-foreground mt-2">Click "Add Integration" to connect your first account.</p>
          </div>
        )}
      </div>
    </div>
  );
}