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
}