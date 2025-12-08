import { Hono } from "hono";
import type { Env } from './core-utils';
import { IntegrationAccountEntity, RevenueSeriesEntity, UserEntity } from "./entities";
import { ok, bad, notFound, isStr } from './core-utils';
import type { IntegrationAccount, IntegrationPlatform, RevenueSeries, UserPlan } from "@shared/types";
import { format, subDays, startOfDay, getWeek, parseISO } from 'date-fns';
export function userRoutes(app: Hono<{ Bindings: Env }>) {
  // Ensure seed data is present on first load
  app.use('/api/*', async (c, next) => {
    await IntegrationAccountEntity.ensureSeed(c.env);
    await UserEntity.ensureSeed(c.env);
    await next();
  });
  // USER
  app.get('/api/user', async (c) => {
    const users = await UserEntity.list(c.env);
    return ok(c, users.items[0] || null);
  });
  app.post('/api/user/plan-sync', async (c) => {
    const { plan } = (await c.req.json()) as { plan?: UserPlan };
    if (!plan || !['free', 'pro', 'enterprise'].includes(plan)) return bad(c, 'Invalid plan');
    const users = await UserEntity.list(c.env);
    if (!users.items.length) {
        return notFound(c, 'User not found for plan sync.');
    }
    const user = new UserEntity(c.env, users.items[0].id);
    await user.syncPlan(plan);
    return ok(c, await user.getState());
  });
  // INTEGRATIONS
  app.get('/api/integrations', async (c) => {
    const page = await IntegrationAccountEntity.list(c.env);
    return ok(c, page.items);
  });
  app.post('/api/integrations', async (c) => {
    const { platform, accountName } = (await c.req.json()) as { platform?: IntegrationPlatform, accountName?: string };
    if (!platform || !accountName?.trim()) return bad(c, 'platform and accountName required');
    const newAccount: IntegrationAccount = {
      id: crypto.randomUUID(),
      platform,
      accountName: accountName.trim(),
    };
    const created = await IntegrationAccountEntity.create(c.env, newAccount);
    return ok(c, created);
  });
  app.post('/api/integrations/:id/pull', async (c) => {
    const { id } = c.req.param();
    if (!isStr(id)) return bad(c, 'Invalid ID');
    const dateStr = format(startOfDay(new Date()), 'yyyy-MM-dd');
    const users = await UserEntity.list(c.env);
    if (!users.items.length) return bad(c, 'User not found');
    const userEntity = new UserEntity(c.env, users.items[0].id);
    const canPull = await userEntity.checkLimit(dateStr);
    if (!canPull) {
      return c.json({ success: false, error: 'Daily pull limit exceeded' }, 429);
    }
    try {
      const recordsPulled = await RevenueSeriesEntity.pullMockData(c.env, id);
      await userEntity.incrementDailyPull(dateStr);
      return ok(c, { message: `Successfully pulled ${recordsPulled} new records.` });
    } catch (error) {
      console.error(`Pull failed for account ${id}:`, error);
      return notFound(c, error instanceof Error ? error.message : 'Pull failed');
    }
  });
  app.delete('/api/integrations/:id', async (c) => {
    const { id } = c.req.param();
    if (!isStr(id)) return bad(c, 'Invalid ID');
    const deleted = await IntegrationAccountEntity.delete(c.env, id);
    if (!deleted) return notFound(c, 'Account not found');
    const allSeries = await RevenueSeriesEntity.listAll(c.env);
    const toDelete = allSeries.filter(s => s.accountId === id).map(s => s.id);
    if (toDelete.length > 0) {
      await RevenueSeriesEntity.deleteMany(c.env, toDelete);
    }
    return ok(c, { message: 'Account deleted along with associated data.' });
  });
  // REPORTS
  app.get('/api/reports/daily', async (c) => {
    const spendAccountsStr = c.req.query('spendAccounts');
    const revenueAccount = c.req.query('revenueAccount');
    if (!isStr(revenueAccount)) return bad(c, 'revenueAccount is required');
    const spendAccounts = spendAccountsStr ? spendAccountsStr.split(',') : [];
    const endQuery = c.req.query('end') ? parseISO(c.req.query('end')!) : startOfDay(new Date());
    const startQuery = c.req.query('start') ? parseISO(c.req.query('start')!) : subDays(endQuery, 29);
    const startStr = format(startQuery, 'yyyy-MM-dd');
    const endStr = format(endQuery, 'yyyy-MM-dd');
    const series = await RevenueSeriesEntity.getAggregatedForGroup(c.env, spendAccounts, revenueAccount, startStr, endStr);
    const dateMap = new Map(series.map(s => [s.date, s]));
    const fullSeries = [];
    const dayCount = Math.round((endQuery.getTime() - startQuery.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    for (let i = 0; i < dayCount; i++) {
        const date = subDays(endQuery, i);
        const dateStr = format(date, 'yyyy-MM-dd');
        if (dateMap.has(dateStr)) {
            fullSeries.push(dateMap.get(dateStr)!);
        } else {
            fullSeries.push({
                id: `aggregated:${dateStr}`,
                accountId: 'aggregated',
                date: dateStr,
                revenueCents: 0,
                spendCents: 0,
            });
        }
    }
    return ok(c, fullSeries.sort((a, b) => a.date.localeCompare(b.date)));
  });
  app.get('/api/reports/advanced', async (c) => {
    const spendAccountsStr = c.req.query('spendAccounts');
    const revenueAccount = c.req.query('revenueAccount');
    if (!isStr(revenueAccount)) return bad(c, 'revenueAccount is required');
    const spendAccounts = spendAccountsStr ? spendAccountsStr.split(',') : [];
    const endQuery = c.req.query('end') ? parseISO(c.req.query('end')!) : startOfDay(new Date());
    const startQuery = c.req.query('start') ? parseISO(c.req.query('start')!) : subDays(endQuery, 29);
    const startStr = format(startQuery, 'yyyy-MM-dd');
    const endStr = format(endQuery, 'yyyy-MM-dd');
    const allSeries = await RevenueSeriesEntity.listAll(c.env);
    const relevantSeries = allSeries.filter(s => 
        (spendAccounts.includes(s.accountId) || s.accountId === revenueAccount) && 
        s.date >= startStr && s.date <= endStr
    );
    const totals = relevantSeries.reduce((acc, item) => {
        if (item.accountId === revenueAccount) acc.revenue += item.revenueCents;
        acc.spend += item.spendCents;
        return acc;
    }, { revenue: 0, spend: 0 });
    const spendBreakdown = spendAccounts.map(id => {
        const totalSpend = relevantSeries
            .filter(s => s.accountId === id)
            .reduce((sum, item) => sum + item.spendCents, 0);
        return { accountId: id, totalSpend: totalSpend / 100 };
    });
    const uniqueDays = new Set(relevantSeries.map(s => s.date)).size;
    const ltv = uniqueDays > 0 ? (totals.revenue / 100) / uniqueDays : 0;
    const roi = totals.spend > 0 ? ((totals.revenue - totals.spend) / totals.spend) * 100 : 0;
    const aggregatedSeries = await RevenueSeriesEntity.getAggregatedForGroup(c.env, spendAccounts, revenueAccount, startStr, endStr);
    const cohorts = aggregatedSeries.reduce((acc, item) => {
        const week = `Week ${getWeek(parseISO(item.date))}`;
        if (!acc[week]) acc[week] = { week, revenue: 0, spend: 0 };
        acc[week].revenue += item.revenueCents / 100;
        acc[week].spend += item.spendCents / 100;
        return acc;
    }, {} as Record<string, { week: string; revenue: number; spend: number }>);
    return ok(c, {
        totalRevenue: totals.revenue / 100,
        totalSpend: totals.spend / 100,
        ltv,
        roi,
        cohorts: Object.values(cohorts).sort((a, b) => a.week.localeCompare(b.week)),
        spendAccountsBreakdown: spendBreakdown,
    });
  });
  // CSV EXPORT
  app.get('/api/export/csv', async (c) => {
    const accountId = c.req.query('accountId');
    if (!isStr(accountId)) return bad(c, 'accountId is required');
    const endDate = startOfDay(new Date());
    const startDate = subDays(endDate, 29);
    const startStr = format(startDate, 'yyyy-MM-dd');
    const endStr = format(endDate, 'yyyy-MM-dd');
    const series = await RevenueSeriesEntity.getForRange(c.env, accountId, startStr, endStr);
    let csv = 'Date,Revenue,Spend\n';
    series.forEach(s => {
      csv += `${s.date},${(s.revenueCents / 100).toFixed(2)},${(s.spendCents / 100).toFixed(2)}\n`;
    });
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="export-${accountId}-${endStr}.csv"`,
      },
    });
  });
}