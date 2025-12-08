import { useState, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { IntegrationAccount, RevenueSeries } from '@shared/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Download, Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { DatePickerWithRange } from '@/components/DatePickerWithRange';
import { DateRange } from 'react-day-picker';
import { subDays, format } from 'date-fns';
const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
export function DemoPage() {
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });
  const queryClient = useQueryClient();
  const { data: accounts, isLoading: isLoadingAccounts } = useQuery<IntegrationAccount[]>({
    queryKey: ['integrations'],
    queryFn: () => api('/api/integrations'),
  });
  useEffect(() => {
    if (accounts && accounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts, selectedAccountId]);
  const { data: reportData, isLoading: isLoadingReport, isError, error, refetch } = useQuery<RevenueSeries[]>({
    queryKey: ['report', selectedAccountId, dateRange],
    queryFn: () => {
        const start = dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : '';
        const end = dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : '';
        return api(`/api/reports/daily?accountId=${selectedAccountId}&start=${start}&end=${end}`);
    },
    enabled: !!selectedAccountId && !!dateRange?.from && !!dateRange?.to,
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
            <p className="text-muted-foreground">Your performance overview.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {isLoadingAccounts ? (
              <Skeleton className="h-10 w-full sm:w-[200px]" />
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
             <DatePickerWithRange date={dateRange} setDate={setDateRange} />
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-12">
            <main className="md:col-span-8 space-y-6">
                <div className="grid gap-6 sm:grid-cols-3">
                    {isLoadingReport ? Array.from({length: 3}).map((_, i) => <Card key={i}><CardHeader><Skeleton className="h-5 w-24" /></CardHeader><CardContent><Skeleton className="h-8 w-32" /></CardContent></Card>) : (
                        <>
                            <Card><CardHeader><CardTitle>Total Revenue</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{formatCurrency(totalRevenue)}</p></CardContent></Card>
                            <Card><CardHeader><CardTitle>Total Spend</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{formatCurrency(totalSpend)}</p></CardContent></Card>
                            <Card><CardHeader><CardTitle>Net Profit</CardTitle></CardHeader><CardContent><p className={`text-3xl font-bold ${netProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>{formatCurrency(netProfit)}</p></CardContent></Card>
                        </>
                    )}
                </div>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                    <Card>
                        <CardHeader><CardTitle>Performance Over Time</CardTitle><CardDescription>Revenue vs. Spend</CardDescription></CardHeader>
                        <CardContent>
                            {isLoadingReport ? <div className="h-[400px] w-full flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div> : 
                             isError ? <div className="h-[400px] w-full flex flex-col items-center justify-center text-destructive"><AlertTriangle className="h-8 w-8 mb-2" /><p>{error.message}</p><Button variant="outline" size="sm" className="mt-4" onClick={() => refetch()}><RefreshCw className="mr-2 h-4 w-4" />Retry</Button></div> :
                             <div className="h-[400px] w-full">
                                <ResponsiveContainer>
                                    <AreaChart data={chartData}>
                                        <defs>
                                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.8}/><stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0}/></linearGradient>
                                            <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(var(--chart-5))" stopOpacity={0.8}/><stop offset="95%" stopColor="hsl(var(--chart-5))" stopOpacity={0}/></linearGradient>
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
                            </div>}
                        </CardContent>
                    </Card>
                </motion.div>
            </main>
            <aside className="md:col-span-4 space-y-6">
                <Card>
                    <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
                    <CardContent>
                        <Button className="w-full" variant="outline" onClick={handleExport} disabled={!selectedAccountId || isLoadingReport}>
                            <Download className="mr-2 h-4 w-4" /> Export CSV
                        </Button>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Recent Pulls</CardTitle></CardHeader>
                    <CardContent>
                        {isLoadingAccounts ? <Skeleton className="h-20 w-full" /> : 
                        <ul className="space-y-3">
                            {accounts?.slice(0, 4).map(acc => (
                                <li key={acc.id} className="text-sm flex justify-between items-center">
                                    <span>{acc.accountName}</span>
                                    <span className="text-muted-foreground">{acc.lastPulledAt ? format(new Date(acc.lastPulledAt), 'PPp') : 'N/A'}</span>
                                </li>
                            ))}
                        </ul>}
                    </CardContent>
                </Card>
            </aside>
        </div>
      </div>
    </div>
  );
}