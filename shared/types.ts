export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
// EdgeRevenue specific types
export type IntegrationPlatform = 'facebook_ads' | 'google_adsense';
export interface IntegrationAccount {
  id: string;
  platform: IntegrationPlatform;
  accountName: string;
  lastPulledAt?: string; // ISO string
}
export interface RevenueSeries {
  id: string; // composite key: accountId:date
  accountId: string;
  date: string; // YYYY-MM-DD
  revenueCents: number;
  spendCents: number;
  // Used for aggregated reports to trace back spend
  originalAccountId?: string;
}
export type UserPlan = 'free' | 'pro' | 'enterprise';
export interface User {
  id: string;
  plan: UserPlan;
  dailyPulls: {
    date: string; // YYYY-MM-DD
    count: number;
  }[];
  createdAt?: string;
}
export interface AdvancedReport {
  totalRevenue: number;
  totalSpend: number;
  ltv: number;
  roi: number;
  cohorts: { week: string; revenue: number; spend: number }[];
}
export interface AggregatedReport extends AdvancedReport {
    spendAccountsBreakdown: {
        accountId: string;
        totalSpend: number;
    }[];
}