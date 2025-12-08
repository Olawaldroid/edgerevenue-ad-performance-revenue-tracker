import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { IntegrationAccount, RevenueSeries } from '@shared/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
export function DemoPage() {
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const { data: accounts, isLoading: isLoadingAccounts } = useQuery<IntegrationAccount[]>({
    queryKey: ['integrations'],
    queryFn: () => api('/api/integrations'),
    onSuccess: (data) => {
      if (data && data.length > 0 && !selectedAccountId) {
        setSelectedAccountId(data[0].id);
      }
    },
  });
  const { data: reportData, isLoading: isLoadingReport } = useQuery<RevenueSeries[]>({
    queryKey: ['report', selectedAccountId],
    queryFn: () => api(`/api/reports/daily?accountId=${selectedAccountId}`),
    enabled: !!selectedAccountId,
  });
  const { totalRevenue, totalSpend, netProfit, chartData } = useMemo(() => {
    if (!reportData) return { totalRevenue: 0, totalSpend: 0, netProfit: 0, chartData: [] };
    const totals = reportData.reduce(
      (acc, item) => {
        acc.revenue += item.revenueCents;
        acc.spend += item.spendCents;
        return acc;
      },
      { revenue: 0, spend: 0 }
    );
    const formattedChartData = reportData.map(item => ({
      date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }),
      Revenue: item.revenueCents / 100,
      Spend: item.spendCents / 100,
    }));
    return {
      totalRevenue: totals.revenue / 100,
      totalSpend: totals.spend / 100,
      netProfit: (totals.revenue - totals.spend) / 100,
      chartData: formattedChartData,
    };
  }, [reportData]);
  const handleExport = () => {
    if (!selectedAccountId) {
        toast.error("Please select an account to export.");
        return;
    }
    window.open(`/api/export/csv?accountId=${selectedAccountId}`, '_blank');
  };
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-8 md:py-10 lg:py-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">Your 30-day performance overview.</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            {isLoadingAccounts ? (
              <Skeleton className="h-10 w-[200px]" />
            ) : (
              <Select onValueChange={setSelectedAccountId} value={selectedAccountId ?? ''}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Select Account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts?.map(acc => (
                    <SelectItem key={acc.id} value={acc.id}>{acc.accountName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button variant="outline" onClick={handleExport} disabled={!selectedAccountId}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
            <Card>
                <CardHeader><CardTitle>Total Revenue</CardTitle></CardHeader>
                <CardContent><p className="text-3xl font-bold">{formatCurrency(totalRevenue)}</p></CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle>Total Spend</CardTitle></CardHeader>
                <CardContent><p className="text-3xl font-bold">{formatCurrency(totalSpend)}</p></CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle>Net Profit</CardTitle></CardHeader>
                <CardContent><p className={`text-3xl font-bold ${netProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>{formatCurrency(netProfit)}</p></CardContent>
            </Card>
        </div>
        <div className="mt-8">
            <Card>
                <CardHeader>
                    <CardTitle>Performance Over Time</CardTitle>
                    <CardDescription>Revenue vs. Spend for the last 30 days.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoadingReport ? (
                        <div className="h-[400px] w-full flex items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <div className="h-[400px] w-full">
                            <ResponsiveContainer>
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.8}/>
                                            <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="hsl(var(--chart-5))" stopOpacity={0.8}/>
                                            <stop offset="95%" stopColor="hsl(var(--chart-5))" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis tickFormatter={(value) => formatCurrency(value as number)} />
                                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} formatter={(value) => formatCurrency(value as number)} />
                                    <Legend />
                                    <Area type="monotone" dataKey="Revenue" stroke="hsl(var(--chart-2))" fillOpacity={1} fill="url(#colorRevenue)" />
                                    <Area type="monotone" dataKey="Spend" stroke="hsl(var(--chart-5))" fillOpacity={1} fill="url(#colorSpend)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}