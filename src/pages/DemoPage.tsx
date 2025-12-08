import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { IntegrationAccount, RevenueSeries } from '@shared/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Download, Loader2, AlertTriangle, RefreshCw, BellRing } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { DatePickerWithRange } from '@/components/DatePickerWithRange';
import { DateRange } from 'react-day-picker';
import { subDays, format, getWeek } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PdfExporter } from '@/components/PdfExporter';
const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
interface AdvancedReport {
  totalRevenue: number;
  totalSpend: number;
  ltv: number;
  roi: number;
  cohorts: { week: string; revenue: number; spend: number }[];
}
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
  const { data: advancedReport, isLoading: isLoadingAdvanced } = useQuery<AdvancedReport>({
    queryKey: ['advancedReport', selectedAccountId, dateRange],
    queryFn: () => {
        const start = dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : '';
        const end = dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : '';
        return api(`/api/reports/advanced?accountId=${selectedAccountId}&start=${start}&end=${end}`);
    },
    enabled: !!selectedAccountId && !!dateRange?.from && !!dateRange?.to,
  });
  const checkAnomaliesMutation = useMutation({
    mutationFn: () => api(`/api/alerts/check?accountId=${selectedAccountId}`, { method: 'POST' }),
    onSuccess: (data: { anomalies: any[] }) => {
      if (data.anomalies.length > 0) {
        toast.warning(`Anomaly Detected!`, { description: `${data.anomalies.length} unusual event(s) found in the last 30 days.` });
      } else {
        toast.success("No anomalies detected.", { description: "Your performance looks stable." });
      }
    },
    onError: (error) => toast.error("Failed to check for anomalies.", { description: error.message }),
  });
  const chartData = useMemo(() => {
    if (!reportData) return [];
    return reportData.map(item => ({
      date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }),
      Revenue: item.revenueCents / 100,
      Spend: item.spendCents / 100,
    }));
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
            {isLoadingAccounts ? <Skeleton className="h-10 w-full sm:w-[200px]" /> : (
              <Select onValueChange={setSelectedAccountId} value={selectedAccountId ?? ''}>
                <SelectTrigger className="w-full sm:w-[200px]"><SelectValue placeholder="Select Account" /></SelectTrigger>
                <SelectContent>{accounts?.map(acc => (<SelectItem key={acc.id} value={acc.id}>{acc.accountName}</SelectItem>))}</SelectContent>
              </Select>
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
                            <Card><CardHeader><CardTitle>Avg. LTV</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{formatCurrency(advancedReport?.ltv ?? 0)}</p></CardContent></Card>
                            <Card><CardHeader><CardTitle>Overall ROI</CardTitle></CardHeader><CardContent><p className={`text-3xl font-bold ${(advancedReport?.roi ?? 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>{advancedReport?.roi.toFixed(2) ?? '0.00'}%</p></CardContent></Card>
                        </>
                    )}
                </div>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                    <Card id="chart-container">
                        <CardHeader><CardTitle>Performance Over Time</CardTitle><CardDescription>Revenue vs. Spend</CardDescription></CardHeader>
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
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
                    <Card>
                        <CardHeader><CardTitle>Weekly Cohorts</CardTitle><CardDescription>Performance grouped by week.</CardDescription></CardHeader>
                        <CardContent>
                            {isLoadingAdvanced ? <Skeleton className="h-40 w-full" /> :
                            <Table>
                                <TableHeader><TableRow><TableHead>Week</TableHead><TableHead className="text-right">Revenue</TableHead><TableHead className="text-right">Spend</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {advancedReport?.cohorts.map(c => (
                                        <TableRow key={c.week}><TableCell>{c.week}</TableCell><TableCell className="text-right">{formatCurrency(c.revenue)}</TableCell><TableCell className="text-right">{formatCurrency(c.spend)}</TableCell></TableRow>
                                    ))}
                                </TableBody>
                            </Table>}
                        </CardContent>
                    </Card>
                </motion.div>
            </main>
            <aside className="md:col-span-4 space-y-6">
                <Card>
                    <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
                    <CardContent className="grid gap-2">
                        <Button className="w-full" variant="outline" onClick={() => checkAnomaliesMutation.mutate()} disabled={!selectedAccountId || checkAnomaliesMutation.isPending}>
                            {checkAnomaliesMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BellRing className="mr-2 h-4 w-4" />} Check for Anomalies
                        </Button>
                        <Button className="w-full" variant="outline" onClick={handleExport} disabled={!selectedAccountId || isLoadingReport}><Download className="mr-2 h-4 w-4" /> Export CSV</Button>
                        <PdfExporter elementId="chart-container" accountId={selectedAccountId} />
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