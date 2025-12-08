import { Hono } from "hono";
import type { Env } from './core-utils';
import { IntegrationAccountEntity, RevenueSeriesEntity } from "./entities";
import { ok, bad, notFound, isStr } from './core-utils';
import type { IntegrationAccount, IntegrationPlatform } from "@shared/types";
import { format, subDays, startOfDay } from 'date-fns';
export function userRoutes(app: Hono<{ Bindings: Env }>) {
  // Ensure seed data is present on first load
  app.use('/api/*', async (c, next) => {
    await IntegrationAccountEntity.ensureSeed(c.env);
    await next();
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
    try {
      const recordsPulled = await RevenueSeriesEntity.pullMockData(c.env, id);
      return ok(c, { message: `Successfully pulled ${recordsPulled} new records.` });
    } catch (error) {
      console.error(`Pull failed for account ${id}:`, error);
      return notFound(c, error instanceof Error ? error.message : 'Pull failed');
    }
  });
  // REPORTS
  app.get('/api/reports/daily', async (c) => {
    const accountId = c.req.query('accountId');
    if (!isStr(accountId)) return bad(c, 'accountId is required');
    const endDate = startOfDay(new Date());
    const startDate = subDays(endDate, 29);
    const startStr = format(startDate, 'yyyy-MM-dd');
    const endStr = format(endDate, 'yyyy-MM-dd');
    const series = await RevenueSeriesEntity.getForRange(c.env, accountId, startStr, endStr);
    // Ensure data for all days in the range (fill gaps with 0)
    const dateMap = new Map(series.map(s => [s.date, s]));
    const fullSeries = [];
    for (let i = 0; i < 30; i++) {
        const date = subDays(endDate, i);
        const dateStr = format(date, 'yyyy-MM-dd');
        if (dateMap.has(dateStr)) {
            fullSeries.push(dateMap.get(dateStr)!);
        } else {
            fullSeries.push({
                id: `${accountId}:${dateStr}`,
                accountId,
                date: dateStr,
                revenueCents: 0,
                spendCents: 0,
            });
        }
    }
    return ok(c, fullSeries.sort((a, b) => a.date.localeCompare(b.date)));
  });
  // CSV EXPORT (simple implementation)
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