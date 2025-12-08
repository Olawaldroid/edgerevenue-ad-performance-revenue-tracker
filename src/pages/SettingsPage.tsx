import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
const useLocalStorage = <T,>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(error);
    }
  };
  return [storedValue, setValue];
};
interface User { id: string; name: string; email: string; }
export function SettingsPage() {
  const [timezone, setTimezone] = useLocalStorage('settings:timezone', 'utc');
  const [currency, setCurrency] = useLocalStorage('settings:currency', 'usd');
  const [emailNotifications, setEmailNotifications] = useLocalStorage('settings:emailNotifications', false);
  const [anomalyAlerts, setAnomalyAlerts] = useLocalStorage('settings:anomalyAlerts', true);
  const [dataRetention, setDataRetention] = useLocalStorage('settings:dataRetention', '30d');
  const [users, setUsers] = useLocalStorage<User[]>('settings:users', [{ id: 'user1', name: 'Demo User', email: 'demo@edgerevenue.com' }]);
  const [currentUser, setCurrentUser] = useLocalStorage('settings:currentUser', 'user1');
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [isSheetOpen, setSheetOpen] = useState(false);
  useEffect(() => {
    const hasShownToast = sessionStorage.getItem('settingsToastShown');
    if (!hasShownToast) {
      toast.info("Settings are saved locally in your browser.");
      sessionStorage.setItem('settingsToastShown', 'true');
    }
  }, []);
  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) {
      toast.warning("Name and email are required.");
      return;
    }
    const newUser = { id: `user${Date.now()}`, name: newUserName, email: newUserEmail };
    setUsers(prev => [...prev, newUser]);
    toast.success("Team member added.");
    setNewUserName('');
    setNewUserEmail('');
    setSheetOpen(false);
  };
  const handleDeleteAccount = () => {
    localStorage.clear();
    toast.success("Account data cleared from local storage.", {
        description: "The application will now reload."
    });
    setTimeout(() => window.location.reload(), 1500);
  };
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-8 md:py-10 lg:py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold tracking-tight mb-8">Settings</h1>
          <div className="space-y-8">
            <Card>
              <CardHeader><CardTitle>Team Members</CardTitle><CardDescription>Manage team access.</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between"><Label htmlFor="current-user">Current User</Label><Select value={currentUser} onValueChange={setCurrentUser}><SelectTrigger className="w-[240px]"><SelectValue placeholder="Select user" /></SelectTrigger><SelectContent>{users.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}</SelectContent></Select></div>
                <Sheet open={isSheetOpen} onOpenChange={setSheetOpen}>
                  <SheetTrigger asChild><Button variant="outline" size="sm"><Plus className="mr-2 h-4 w-4" /> Add Member</Button></SheetTrigger>
                  <SheetContent>
                    <SheetHeader><SheetTitle>Add Team Member</SheetTitle><SheetDescription>Invite a new member to your team.</SheetDescription></SheetHeader>
                    <form onSubmit={handleAddUser} className="py-4 space-y-4">
                      <div><Label htmlFor="new-name">Name</Label><Input id="new-name" value={newUserName} onChange={e => setNewUserName(e.target.value)} /></div>
                      <div><Label htmlFor="new-email">Email</Label><Input id="new-email" type="email" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} /></div>
                      <SheetFooter><Button type="submit">Add Member</Button></SheetFooter>
                    </form>
                  </SheetContent>
                </Sheet>
              </CardContent>
            </Card>
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
                <div className="flex items-center justify-between"><div><Label htmlFor="anomaly-alerts">Anomaly Alerts</Label><p className="text-sm text-muted-foreground">Get notified of unusual spend or revenue changes.</p></div><Switch id="anomaly-alerts" checked={anomalyAlerts} onCheckedChange={(checked) => { setAnomalyAlerts(checked); toast.info(`Anomaly alert emails ${checked ? 'enabled' : 'disabled'}.`); }} /></div>
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