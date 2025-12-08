import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { IntegrationAccount, IntegrationPlatform } from '@shared/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter, SheetDescription } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
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
      setTimeout(() => setStatus('idle'), 3000);
    },
    onError: (error) => {
      toast.error(`Pull for ${account.accountName} failed.`, { description: error.message });
      setStatus('error');
      setTimeout(() => setStatus('idle'), 5000);
    },
  });
  const getStatusIcon = () => {
    switch (status) {
      case 'pulling': return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return null;
    }
  };
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {account.platform === 'facebook_ads' ? 'Facebook Ads' : 'Google AdSense'}
        </CardTitle>
        <CardDescription>{account.accountName}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Last pulled: {account.lastPulledAt ? `${formatDistanceToNow(new Date(account.lastPulledAt))} ago` : 'Never'}
        </p>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" size="sm" disabled>Test Connection</Button>
        <Button size="sm" onClick={() => pullMutation.mutate()} disabled={status === 'pulling'}>
          {getStatusIcon()}
          <span className={status !== 'idle' ? 'ml-2' : ''}>
            {status === 'pulling' ? 'Pulling...' : 'Pull Now'}
          </span>
        </Button>
      </CardFooter>
    </Card>
  );
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
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="platform" className="text-right">Platform</Label>
                    <Select onValueChange={(value) => setPlatform(value as IntegrationPlatform)} defaultValue={platform}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select a platform" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="facebook_ads">Facebook Ads</SelectItem>
                        <SelectItem value="google_adsense">Google AdSense</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">Account Name</Label>
                    <Input id="name" value={accountName} onChange={(e) => setAccountName(e.target.value)} className="col-span-3" placeholder="e.g. My Main Campaign" />
                  </div>
                  <p className="text-sm text-muted-foreground text-center col-span-4 pt-4">
                    In this demo, credentials are not required. We'll use mock data.
                  </p>
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
          <p>Loading integrations...</p>
        ) : accounts && accounts.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {accounts.map(acc => <IntegrationCard key={acc.id} account={acc} />)}
          </div>
        ) : (
          <div className="text-center py-16 border-2 border-dashed rounded-lg">
            <h3 className="text-xl font-semibold">No integrations yet</h3>
            <p className="text-muted-foreground mt-2">Click "Add Integration" to connect your first account.</p>
          </div>
        )}
      </div>
    </div>
  );
}