import type { IntegrationAccount, RevenueSeries } from './types';
import { subDays, format } from 'date-fns';
export const MOCK_INTEGRATION_ACCOUNTS: IntegrationAccount[] = [
  { id: 'fb1', platform: 'facebook_ads', accountName: 'Primary FB Campaign' },
  { id: 'ga1', platform: 'google_adsense', accountName: 'Main Content Site' },
  { id: 'fb2', platform: 'facebook_ads', accountName: 'Secondary FB Campaign' },
  { id: 'ga2', platform: 'google_adsense', accountName: 'Blog AdSense' },
];
export const MOCK_REVENUE_SERIES: RevenueSeries[] = [];
const today = new Date();
const accounts = ['fb1', 'ga1', 'fb2', 'ga2'];
accounts.forEach(accountId => {
  for (let i = 0; i < 30; i++) {
    const date = subDays(today, i);
    const dateStr = format(date, 'yyyy-MM-dd');
    let revenueCents = 0;
    let spendCents = 0;
    if (accountId.startsWith('fb')) {
      // Facebook is spend-heavy
      spendCents = Math.floor(Math.random() * 5000) + 1000; // $10 - $60
      revenueCents = Math.floor(spendCents * (Math.random() * 0.5 + 0.9)); // 90% - 140% ROI
    } else {
      // AdSense is revenue-only
      spendCents = 0;
      revenueCents = Math.floor(Math.random() * 8000) + 2000; // $20 - $100
    }
    MOCK_REVENUE_SERIES.push({
      id: `${accountId}:${dateStr}`,
      accountId,
      date: dateStr,
      revenueCents,
      spendCents,
    });
  }
});