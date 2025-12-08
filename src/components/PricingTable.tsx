import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
const tiers = [
  {
    name: 'Free',
    price: '$0',
    description: 'For individuals and hobbyists getting started.',
    features: ['2 Integrations', '30-day data retention', 'Manual data pulls', 'Community support'],
    cta: 'Get Started',
    variant: 'outline',
  },
  {
    name: 'Pro',
    price: '$49',
    description: 'For professionals and small teams who need more power.',
    features: ['10 Integrations', '1-year data retention', 'Automated daily pulls', 'Email support', 'CSV Exports'],
    cta: 'Upgrade to Pro',
    variant: 'default',
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    description: 'For large organizations with custom requirements.',
    features: ['Unlimited Integrations', 'Unlimited data retention', 'Real-time data sync', 'Dedicated support', 'API Access'],
    cta: 'Contact Sales',
    variant: 'outline',
  },
];
function UpgradeButton({ tier }: { tier: typeof tiers[0] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    toast.info("Processing your subscription...");
    setTimeout(() => {
      localStorage.setItem('plan', tier.name);
      toast.success(`Successfully upgraded to ${tier.name}!`, {
        description: "Your new features are now available.",
      });
      setIsSubmitting(false);
      setIsOpen(false);
      // In a real app, you'd likely invalidate queries to refetch user/plan data.
      // queryClient.invalidateQueries({ queryKey: ['user'] });
    }, 1500);
  };
  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button className="w-full" variant={tier.variant as any}>
          {tier.cta}
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Upgrade to {tier.name}</SheetTitle>
          <SheetDescription>
            Complete your payment to unlock new features. This is a mock checkout.
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="card-number">Card Number</Label>
              <Input id="card-number" placeholder="**** **** **** 1234" defaultValue="4242 4242 4242 4242" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expiry">Expiry</Label>
                <Input id="expiry" placeholder="MM/YY" defaultValue="12/28" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cvc">CVC</Label>
                <Input id="cvc" placeholder="123" defaultValue="123" />
              </div>
            </div>
          </div>
          <SheetFooter>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Payment
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
export function PricingTable() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {tiers.map((tier) => (
        <motion.div
          key={tier.name}
          whileHover={{ y: -5 }}
          transition={{ duration: 0.2 }}
        >
          <Card className={cn('flex flex-col h-full', tier.highlight && 'border-primary shadow-primary/20 shadow-lg ring-2 ring-primary/20')}>
            <CardHeader>
              <CardTitle>{tier.name}</CardTitle>
              <CardDescription>{tier.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="mb-6">
                <span className="text-4xl font-bold">{tier.price}</span>
                {tier.name !== 'Enterprise' && <span className="text-muted-foreground">/ month</span>}
              </div>
              <ul className="space-y-3">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              {tier.name === 'Free' ? (
                <Button asChild className="w-full" variant="outline">
                  <Link to="/dashboard">{tier.cta}</Link>
                </Button>
              ) : (
                <UpgradeButton tier={tier} />
              )}
            </CardFooter>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}