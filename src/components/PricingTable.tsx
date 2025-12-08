import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
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
export function PricingTable() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {tiers.map((tier) => (
        <Card key={tier.name} className={cn('flex flex-col', tier.highlight && 'border-primary shadow-primary/20 shadow-lg')}>
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
                  <Check className="h-5 w-5 text-green-500 mr-2" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Button className="w-full" variant={tier.variant as any}>
              {tier.cta}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}