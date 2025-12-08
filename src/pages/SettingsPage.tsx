import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
const useLocalStorage = <T,>(key: string, initialValue: T): [T, (value: T) => void] => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });
  const setValue = (value: T) => {
    try {
      setStoredValue(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(error);
    }
  };
  return [storedValue, setValue];
};
export function SettingsPage() {
  const [timezone, setTimezone] = useLocalStorage('settings:timezone', 'utc');
  const [currency, setCurrency] = useLocalStorage('settings:currency', 'usd');
  const [emailNotifications, setEmailNotifications] = useLocalStorage('settings:emailNotifications', false);
  const [anomalyAlerts, setAnomalyAlerts] = useLocalStorage('settings:anomalyAlerts', true);
  const [dataRetention, setDataRetention] = useLocalStorage('settings:dataRetention', '30d');
  useEffect(() => {
    toast.info("Settings are saved locally in your browser.");
  }, []);
  const handleDeleteAccount = () => {
    localStorage.clear();
    toast.success("Account data cleared from local storage.");
    // In a real app, this would navigate or reload.
    setTimeout(() => window.location.reload(), 1000);
  };
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-8 md:py-10 lg:py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold tracking-tight mb-8">Settings</h1>
          <div className="space-y-8">
            <Card>
              <CardHeader><CardTitle>Display</CardTitle><CardDescription>Customize the appearance of the app.</CardDescription></CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between"><Label htmlFor="timezone">Timezone</Label><Select value={timezone} onValueChange={setTimezone}><SelectTrigger className="w-[240px]"><SelectValue placeholder="Select timezone" /></SelectTrigger><SelectContent><SelectItem value="utc">UTC</SelectItem><SelectItem value="est">EST</SelectItem><SelectItem value="pst">PST</SelectItem></SelectContent></Select></div>
                <div className="flex items-center justify-between"><Label htmlFor="currency">Currency</Label><Select value={currency} onValueChange={setCurrency}><SelectTrigger className="w-[240px]"><SelectValue placeholder="Select currency" /></SelectTrigger><SelectContent><SelectItem value="usd">USD ($)</SelectItem><SelectItem value="eur">EUR (€)</SelectItem><SelectItem value="gbp">GBP (£)</SelectItem></SelectContent></Select></div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Notifications</CardTitle><CardDescription>Manage how you receive notifications.</CardDescription></CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between"><div><Label htmlFor="email-notifications">Email Notifications</Label><p className="text-sm text-muted-foreground">Receive weekly performance summaries.</p></div><Switch id="email-notifications" checked={emailNotifications} onCheckedChange={setEmailNotifications} /></div>
                <div className="flex items-center justify-between"><div><Label htmlFor="anomaly-alerts">Anomaly Alerts</Label><p className="text-sm text-muted-foreground">Get notified of unusual spend or revenue changes.</p></div><Switch id="anomaly-alerts" checked={anomalyAlerts} onCheckedChange={setAnomalyAlerts} /></div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Data</CardTitle><CardDescription>Manage your data retention policy.</CardDescription></CardHeader>
              <CardContent>
                <div className="flex items-center justify-between"><Label htmlFor="data-retention">Data Retention</Label><Select value={dataRetention} onValueChange={setDataRetention}><SelectTrigger className="w-[240px]"><SelectValue placeholder="Select period" /></SelectTrigger><SelectContent><SelectItem value="30d">30 Days</SelectItem><SelectItem value="1y">1 Year</SelectItem><SelectItem value="unlimited">Unlimited</SelectItem></SelectContent></Select></div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Account</CardTitle><CardDescription>Manage your account and data.</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <AlertDialog>
                  <AlertDialogTrigger asChild><Button variant="destructive">Delete Account</Button></AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete your account and all associated data from your browser's local storage. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDeleteAccount}>Continue</AlertDialogAction></AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <p className="text-sm text-muted-foreground">Permanently delete your account and all associated data.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}