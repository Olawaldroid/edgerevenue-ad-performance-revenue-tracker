import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { IntegrationAccount, RevenueSeries, AggregatedReport, UserPlan } from '@shared/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Download, Loader2, AlertTriangle, RefreshCw, BellRing } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { DatePickerWithRange } from '@/components/DatePickerWithRange';
import { DateRange } from 'react-day-picker';
import { subDays, format, getWeek, startOfMonth, parseISO } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PdfExporter } from '@/components/PdfExporter';
import { MultiSelect } from '@/components/MultiSelect';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
export function DemoPage() {
  const [spendAccountIds, setSpendAccountIds] = useState<string[]>([]);
  const [revenueAccountId, setRevenueAccountId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({ from: subDays(new Date(), 29), to: new Date() });
  const [activeTab, setActiveTab] = useState('week');
  const queryClient = useQueryClient();
  useEffect(() => {
    const plan = localStorage.getItem('plan') as UserPlan;
    if (plan) {
      api('/api/user/plan-sync', { method: 'POST', body: JSON.stringify({ plan }) }).catch(console.error);
    }
  }, []);
  const { data: accounts, isLoading: isLoadingAccounts } = useQuery<IntegrationAccount[]>({
    queryKey: ['integrations'],
    queryFn: () => api('/api/integrations'),
  });
  useEffect(() => {
    if (accounts && accounts.length > 0) {
      if (spendAccountIds.length === 0) {
        setSpendAccountIds(accounts.filter(a => a.platform === 'facebook_ads').map(a => a.id));
      }
      if (!revenueAccountId) {
        setRevenueAccountId(accounts.find(a => a.platform === 'google_adsense')?.id || null);
      }
    }
  }, [accounts, spendAccountIds, revenueAccountId]);
  const queryParams = useMemo(() => {
    const start = dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : '';
    const end = dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : '';
    return `spendAccounts=${spendAccountIds.join(',')}&revenueAccount=${revenueAccountId}&start=${start}&end=${end}`;
  }, [spendAccountIds, revenueAccountId, dateRange]);
  const { data: reportData, isLoading: isLoadingReport, isError, error, refetch } = useQuery<RevenueSeries[]>({
    queryKey: ['report', queryParams],
    queryFn: () => api(`/api/reports/daily?${queryParams}`),
    enabled: spendAccountIds.length > 0 && !!revenueAccountId && !!dateRange?.from && !!dateRange?.to,
  });
  const { data: advancedReport, isLoading: isLoadingAdvanced } = useQuery<AggregatedReport>({
    queryKey: ['advancedReport', queryParams],
    queryFn: () => api(`/api/reports/advanced?${queryParams}`),
    enabled: spendAccountIds.length > 0 && !!revenueAccountId && !!dateRange?.from && !!dateRange?.to,
  });
  const checkAnomaliesMutation = useMutation({
    mutationFn: () => api(`/api/alerts/check?accountId=${revenueAccountId}`, { method: 'POST' }),
    onSuccess: (data: { anomalies: any[] }) => {
      if (data.anomalies.length > 0) {
        toast.warning(`Anomaly Detected!`, { description: `${data.anomalies.length} unusual event(s) found.` });
      } else {
        toast.success("No anomalies detected.", { description: "Your performance looks stable." });
      }
    },
    onError: (error: Error) => toast.error("Failed to check for anomalies.", { description: error.message }),
  });
  const chartData = useMemo(() => {
    if (!reportData) return [];
    return reportData.map(item => ({
      date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }),
      Revenue: item.revenueCents / 100,
      Spend: item.spendCents / 100,
    }));
  }, [reportData]);
  const cohortData = useMemo(() => {
    if (!reportData) return {};
    const groupBy = (data: RevenueSeries[], keyFn: (item: RevenueSeries) => string) => {
        return data.reduce((acc, item) => {
            const key = keyFn(item);
            if (!acc[key]) acc[key] = { revenue: 0, spend: 0 };
            acc[key].revenue += item.revenueCents / 100;
            acc[key].spend += item.spendCents / 100;
            return acc;
        }, {} as Record<string, { revenue: number; spend: number }>);
    };
    return {
        day: groupBy(reportData, item => format(parseISO(item.date), 'MMM d, yyyy')),
        week: groupBy(reportData, item => `Week ${getWeek(parseISO(item.date))}, ${format(parseISO(item.date), 'yyyy')}`),
        month: groupBy(reportData, item => format(startOfMonth(parseISO(item.date)), 'MMM yyyy')),
    };
  }, [reportData]);
  const handleExport = () => {
    if (!revenueAccountId) {
        toast.error("Please select a revenue account to export.");
        return;
    }
    window.open(`/api/export/csv?accountId=${revenueAccountId}`, '_blank');
  };
  const spendAccountOptions = useMemo(() => accounts?.filter(a => a.platform === 'facebook_ads').map(a => ({ value: a.id, label: a.accountName })) || [], [accounts]);
  const revenueAccountOptions = useMemo(() => accounts?.filter(a => a.platform === 'google_adsense') || [], [accounts]);
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-8 md:py-10 lg:py-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">Your performance overview.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {isLoadingAccounts ? <Skeleton className="h-10 w-full sm:w-[200px]" /> : (
              <>
                <MultiSelect options={spendAccountOptions} value={spendAccountIds} onValueChange={setSpendAccountIds} placeholder="Spend Sources" />
                <Select onValueChange={setRevenueAccountId} value={revenueAccountId ?? ''}>
                  <SelectTrigger className="w-full sm:w-[200px]"><SelectValue placeholder="Revenue Source" /></SelectTrigger>
                  <SelectContent>{revenueAccountOptions.map(acc => (<SelectItem key={acc.id} value={acc.id}>{acc.accountName}</SelectItem>))}</SelectContent>
                </Select>
              </>
            )}
             <DatePickerWithRange date={dateRange} setDate={setDateRange} />
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-12">
            <main className="md:col-span-8 space-y-6">
                <div className="grid gap-6 sm:grid-cols-3">
                    {isLoadingAdvanced ? Array.from({length: 3}).map((_, i) => <Card key={i}><CardHeader><Skeleton className="h-5 w-24" /></CardHeader><CardContent><Skeleton className="h-8 w-32" /></CardContent></Card>) : (
                        <>
                            <Card><CardHeader><CardTitle>Total Revenue</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{formatCurrency(advancedReport?.totalRevenue ?? 0)}</p></CardContent></Card>
                            <Card><CardHeader><CardTitle>Total Spend</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{formatCurrency(advancedReport?.totalSpend ?? 0)}</p></CardContent></Card>
                            <Card><CardHeader><CardTitle>Overall ROI</CardTitle></CardHeader><CardContent><p className={`text-3xl font-bold ${(advancedReport?.roi ?? 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>{advancedReport?.roi.toFixed(2) ?? '0.00'}%</p></CardContent></Card>
                        </>
                    )}
                </div>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                    <Card>
                        <CardHeader><CardTitle>Spend Breakdown</CardTitle></CardHeader>
                        <CardContent>
                            {isLoadingAdvanced ? <Skeleton className="h-24 w-full" /> :
                            <Table>
                                <TableHeader><TableRow><TableHead>Account</TableHead><TableHead className="text-right">Total Spend</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {advancedReport?.spendAccountsBreakdown.map(b => (
                                        <TableRow key={b.accountId}><TableCell>{accounts?.find(a => a.id === b.accountId)?.accountName}</TableCell><TableCell className="text-right">{formatCurrency(b.totalSpend)}</TableCell></TableRow>
                                    ))}
                                    <TableRow className="font-semibold border-t-2"><TableCell>Total</TableCell><TableCell className="text-right">{formatCurrency(advancedReport?.totalSpend || 0)}</TableCell></TableRow>
                                </TableBody>
                            </Table>}
                        </CardContent>
                    </Card>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
                    <Card id="chart-container">
                        <CardHeader><CardTitle>Performance Over Time</CardTitle><CardDescription>Aggregated Revenue vs. Spend</CardDescription></CardHeader>
                        <CardContent>
                            {isLoadingReport ? <div className="h-[400px] w-full flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div> :
                             isError ? <div className="h-[400px] w-full flex flex-col items-center justify-center text-destructive"><AlertTriangle className="h-8 w-8 mb-2" /><p>{error.message}</p><Button variant="outline" size="sm" className="mt-4" onClick={() => refetch()}><RefreshCw className="mr-2 h-4 w-4" />Retry</Button></div> :
                             <div className="h-[400px] w-full">
                                <ResponsiveContainer>
                                    <AreaChart data={chartData}>
                                        <defs><linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.8}/><stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0}/></linearGradient><linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(var(--chart-5))" stopOpacity={0.8}/><stop offset="95%" stopColor="hsl(var(--chart-5))" stopOpacity={0}/></linearGradient></defs>
                                        <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" /><YAxis tickFormatter={(value) => formatCurrency(value as number)} />
                                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} formatter={(value) => formatCurrency(value as number)} />
                                        <Legend /><Area type="monotone" dataKey="Revenue" stroke="hsl(var(--chart-2))" fillOpacity={1} fill="url(#colorRevenue)" /><Area type="monotone" dataKey="Spend" stroke="hsl(var(--chart-5))" fillOpacity={1} fill="url(#colorSpend)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>}
                        </CardContent>
                    </Card>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
                    <Card>
                        <CardHeader><CardTitle>Performance Cohorts</CardTitle><CardDescription>Data grouped by time period.</CardDescription></CardHeader>
                        <CardContent>
                            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                                <TabsList className="grid w-full grid-cols-3"><TabsTrigger value="day">Daily</TabsTrigger><TabsTrigger value="week">Weekly</TabsTrigger><TabsTrigger value="month">Monthly</TabsTrigger></TabsList>
                                <AnimatePresence mode="wait">
                                    <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                                        <TabsContent value={activeTab} className="mt-4">
                                            <Table>
                                                <TableHeader><TableRow><TableHead>Period</TableHead><TableHead className="text-right">Revenue</TableHead><TableHead className="text-right">Spend</TableHead></TableRow></TableHeader>
                                                <TableBody>
                                                    {Object.entries(cohortData[activeTab as keyof typeof cohortData] || {}).map(([period, data]) => (
                                                        <TableRow key={period}><TableCell>{period}</TableCell><TableCell className="text-right">{formatCurrency(data.revenue)}</TableCell><TableCell className="text-right">{formatCurrency(data.spend)}</TableCell></TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </TabsContent>
                                    </motion.div>
                                </AnimatePresence>
                            </Tabs>
                        </CardContent>
                    </Card>
                </motion.div>
            </main>
            <aside className="md:col-span-4 space-y-6">
                <Card>
                    <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
                    <CardContent className="grid gap-2">
                        <Button className="w-full" variant="outline" onClick={() => checkAnomaliesMutation.mutate()} disabled={!revenueAccountId || checkAnomaliesMutation.isPending}>
                            {checkAnomaliesMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BellRing className="mr-2 h-4 w-4" />} Check for Anomalies
                        </Button>
                        <Button className="w-full" variant="outline" onClick={handleExport} disabled={!revenueAccountId || isLoadingReport}><Download className="mr-2 h-4 w-4" /> Export CSV</Button>
                        <PdfExporter elementId="chart-container" accountId={revenueAccountId} />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Recent Pulls</CardTitle></CardHeader>
                    <CardContent>
                        {isLoadingAccounts ? <Skeleton className="h-20 w-full" /> :
                        <ul className="space-y-3">
                            {accounts?.slice(0, 4).map(acc => (
                                <li key={acc.id} className="text-sm flex justify-between items-center">
                                    <span className="truncate pr-2">{acc.accountName}</span>
                                    <span className="text-muted-foreground flex-shrink-0">{acc.lastPulledAt ? format(new Date(acc.lastPulledAt), 'PP') : 'N/A'}</span>
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