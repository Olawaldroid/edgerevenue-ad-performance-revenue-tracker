import { IndexedEntity, Index, type Env } from "./core-utils";
import type { IntegrationAccount, RevenueSeries, User, UserPlan } from "@shared/types";
import { MOCK_INTEGRATION_ACCOUNTS, MOCK_REVENUE_SERIES } from "@shared/mock-data";
import { differenceInDays, parseISO, startOfDay } from "date-fns";
// USER ENTITY
export class UserEntity extends IndexedEntity<User> {
  static readonly entityName = "user";
  static readonly indexName = "users";
  static readonly initialState: User = { id: "", plan: "free", dailyPulls: [] };
  static seedData: User[] = [{ id: 'default', plan: 'free', dailyPulls: [], createdAt: new Date().toISOString() }];
  async incrementDailyPull(date: string): Promise<void> {
    await this.mutate(currentUser => {
      const today = startOfDay(new Date());
      // Prune old entries
      const recentPulls = currentUser.dailyPulls.filter(p => differenceInDays(today, parseISO(p.date)) < 30);
      const pullIndex = recentPulls.findIndex(p => p.date === date);
      if (pullIndex > -1) {
        recentPulls[pullIndex].count++;
      } else {
        recentPulls.push({ date, count: 1 });
      }
      return { ...currentUser, dailyPulls: recentPulls };
    });
  }
  async checkLimit(date: string): Promise<boolean> {
    const state = await this.getState();
    const limits: Record<UserPlan, number> = {
      free: 20,
      pro: 100,
      enterprise: Infinity,
    };
    const limit = limits[state.plan] || 20;
    const pullForDate = state.dailyPulls.find(p => p.date === date);
    return (pullForDate?.count ?? 0) < limit;
  }
  async syncPlan(newPlan: UserPlan): Promise<void> {
    await this.patch({ plan: newPlan });
  }
}
// INTEGRATION ACCOUNT ENTITY
export class IntegrationAccountEntity extends IndexedEntity<IntegrationAccount> {
  static readonly entityName = "integration_account";
  static readonly indexName = "integration_accounts";
  static readonly initialState: IntegrationAccount = { id: "", platform: "facebook_ads", accountName: "" };
  static seedData = MOCK_INTEGRATION_ACCOUNTS;
  async recordPull(): Promise<void> {
    await this.patch({ lastPulledAt: new Date().toISOString() });
  }
}
// REVENUE SERIES ENTITY
export class RevenueSeriesEntity extends IndexedEntity<RevenueSeries> {
  static readonly entityName = "revenue_series";
  static readonly indexName = "revenue_series_by_account_date";
  static readonly initialState: RevenueSeries = { id: "", accountId: "", date: "", revenueCents: 0, spendCents: 0 };
  static override keyOf<U extends { id: string }>(state: U & Partial<RevenueSeries>): string {
    const s = state as RevenueSeries;
    return s.id || `${s.accountId}:${s.date}`;
  }
  static async pullMockData(env: Env, accountId: string): Promise<number> {
    const mockDataForAccount = MOCK_REVENUE_SERIES.filter(r => r.accountId === accountId);
    if (mockDataForAccount.length === 0) return 0;
    const account = new IntegrationAccountEntity(env, accountId);
    if (!(await account.exists())) throw new Error("Account not found");
    const allSeries = await this.listAll(env);
    const existingKeys = new Set<string>(allSeries.map(s => s.id));
    const newSeriesData = mockDataForAccount.filter(s => !existingKeys.has(this.keyOf(s)));
    for (const series of newSeriesData) {
      const newRecord: RevenueSeries = { ...series, id: this.keyOf(series) };
      await this.create(env, newRecord);
    }
    await account.recordPull();
    return newSeriesData.length;
  }
  static async getForRange(env: Env, accountId: string, start: string, end: string): Promise<RevenueSeries[]> {
    const allSeries = await this.listAll(env);
    return allSeries
      .filter(s => s.accountId === accountId && s.date >= start && s.date <= end)
      .sort((a, b) => a.date.localeCompare(b.date));
  }
  static async getAggregatedForGroup(env: Env, spendAccountIds: string[], revenueAccountId: string, start: string, end: string): Promise<RevenueSeries[]> {
    const allAccountIds = [...new Set([...spendAccountIds, revenueAccountId])];
    const allSeries = await this.listAll(env);
    const relevantSeries = allSeries.filter(s => allAccountIds.includes(s.accountId) && s.date >= start && s.date <= end);
    const aggregationMap = new Map<string, { revenueCents: number; spendCents: number; spendBreakdown: Map<string, number> }>();
    for (const item of relevantSeries) {
        const entry = aggregationMap.get(item.date) || { revenueCents: 0, spendCents: 0, spendBreakdown: new Map() };
        if (item.accountId === revenueAccountId) {
            entry.revenueCents += item.revenueCents;
            entry.spendCents += item.spendCents; // AdSense might have spend, though unlikely
        }
        if (spendAccountIds.includes(item.accountId)) {
            entry.spendCents += item.spendCents;
            const currentSpend = entry.spendBreakdown.get(item.accountId) || 0;
            entry.spendBreakdown.set(item.accountId, currentSpend + item.spendCents);
        }
        aggregationMap.set(item.date, entry);
    }
    const result: RevenueSeries[] = [];
    for (const [date, data] of aggregationMap.entries()) {
        result.push({
            id: `aggregated:${date}`,
            accountId: 'aggregated',
            date,
            revenueCents: data.revenueCents,
            spendCents: data.spendCents,
        });
    }
    return result.sort((a, b) => a.date.localeCompare(b.date));
  }
  static async listAll(env: Env): Promise<RevenueSeries[]> {
    const idx = new Index<string>(env, this.indexName);
    const ids = await idx.list();
    if (ids.length === 0) return [];
    const seriesPromises = ids.map(id => new this(env, id).getState());
    const results = await Promise.all(seriesPromises);
    return results.filter((s): s is RevenueSeries => !!s?.id);
  }
}