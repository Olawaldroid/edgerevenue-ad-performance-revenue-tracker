import { IndexedEntity, Index, type Env } from "./core-utils";
import type { IntegrationAccount, RevenueSeries } from "@shared/types";
import { MOCK_INTEGRATION_ACCOUNTS, MOCK_REVENUE_SERIES } from "@shared/mock-data";
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
  // Use a composite key for ID to ensure uniqueness per account per day
  static override keyOf<U extends { id: string }>(state: U & Partial<RevenueSeries>): string {
    const s = state as RevenueSeries;
    return s.id || `${s.accountId}:${s.date}`;
  }
  static async pullMockData(env: Env, accountId: string): Promise<number> {
    const mockDataForAccount = MOCK_REVENUE_SERIES.filter(r => r.accountId === accountId);
    if (mockDataForAccount.length === 0) {
      return 0;
    }
    const account = new IntegrationAccountEntity(env, accountId);
    if (!(await account.exists())) {
      throw new Error("Account not found");
    }
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
    // This is inefficient for large datasets. A real implementation would use better indexing.
    // For the demo, we list all and filter.
    const allSeries = await this.listAll(env);
    return allSeries
      .filter(s => s.accountId === accountId && s.date >= start && s.date <= end)
      .sort((a, b) => a.date.localeCompare(b.date));
  }
  static async listAll(env: Env): Promise<RevenueSeries[]> {
    const idx = new Index<string>(env, this.indexName);
    const ids = await idx.list();
    if (ids.length === 0) return [];
    const seriesPromises = ids.map(id => new this(env, id).getState());
    const results = await Promise.all(seriesPromises);
    // Filter out any potentially null/undefined states if entity was deleted but index not pruned
    return results.filter((s): s is RevenueSeries => !!s?.id);
  }
}