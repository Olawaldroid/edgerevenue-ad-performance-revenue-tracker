import { IndexedEntity } from "./core-utils";
import type { IntegrationAccount, RevenueSeries } from "@shared/types";
import { MOCK_INTEGRATION_ACCOUNTS, MOCK_REVENUE_SERIES } from "@shared/mock-data";
import { format } from 'date-fns';
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
  static keyOf(state: RevenueSeries): string {
    return `${state.accountId}:${state.date}`;
  }
  static async pullMockData(env: Env, accountId: string): Promise<number> {
    const mockDataForAccount = MOCK_REVENUE_SERIES.filter(r => r.accountId === accountId);
    if (mockDataForAccount.length === 0) {
      return 0;
    }
    // In a real scenario, you'd fetch from an API. Here we just "find" the mock data.
    // For this demo, we'll just ensure the mock data is seeded.
    const account = new IntegrationAccountEntity(env, accountId);
    if (!await account.exists()) {
      throw new Error("Account not found");
    }
    const existingKeys = new Set<string>();
    const allSeries = await this.listAll(env);
    allSeries.forEach(s => existingKeys.add(s.id));
    const newSeries = mockDataForAccount.filter(s => !existingKeys.has(this.keyOf(s)));
    for (const series of newSeries) {
      await this.create(env, { ...series, id: this.keyOf(series) });
    }
    await account.recordPull();
    return newSeries.length;
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
    const idx = new (this.getIndexClass())(env, this.indexName);
    const ids = await idx.list();
    return Promise.all(ids.map(id => new this(env, id).getState()));
  }
  // Helper to get the Index class constructor
  private static getIndexClass() {
    // A bit of a hack to access the protected Index class from core-utils if needed,
    // but for now we can just use the public static methods.
    // This is just to satisfy the type system for creating an index instance.
    const { Index } = require("./core-utils");
    return Index;
  }
}