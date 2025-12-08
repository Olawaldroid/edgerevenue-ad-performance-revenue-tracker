import { HeroBanner } from '@/components/HeroBanner';
import { PricingTable } from '@/components/PricingTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, DollarSign, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
const features = [
  {
    icon: <Zap className="h-8 w-8 text-primary" />,
    title: 'Automated Sync',
    description: 'Connect your ad accounts once. We handle the rest, pulling your latest data automatically.',
  },
  {
    icon: <BarChart className="h-8 w-8 text-primary" />,
    title: 'Visual Dashboards',
    description: 'Instantly visualize your revenue, spend, and profitability with our beautiful, interactive charts.',
  },
  {
    icon: <DollarSign className="h-8 w-8 text-primary" />,
    title: 'Unified View',
    description: 'No more switching between platforms. See all your ad performance data in a single, unified interface.',
  },
];
export function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        <HeroBanner />
        <section id="features" className="bg-muted/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-16 md:py-24 lg:py-32">
              <div className="text-center max-w-2xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-display font-bold">Everything you need, nothing you don't.</h2>
                <p className="mt-4 text-lg text-muted-foreground">
                  Focus on what matters: growing your business. We'll handle the data aggregation.
                </p>
              </div>
              <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
                {features.map((feature) => (
                  <Card key={feature.title} className="text-center">
                    <CardHeader>
                      <div className="mx-auto bg-primary/10 rounded-full p-3 w-fit">
                        {feature.icon}
                      </div>
                      <CardTitle className="mt-4">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">{feature.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>
        <section id="pricing">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-16 md:py-24 lg:py-32">
              <div className="text-center max-w-2xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-display font-bold">Simple, transparent pricing.</h2>
                <p className="mt-4 text-lg text-muted-foreground">
                  Choose the plan that's right for you. No hidden fees, ever.
                </p>
              </div>
              <div className="mt-12">
                <PricingTable />
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} EdgeRevenue. Built with ❤️ at Cloudflare.</p>
            <div className="flex gap-4 text-sm text-muted-foreground">
                <Link to="/" className="hover:text-foreground">Terms</Link>
                <Link to="/" className="hover:text-foreground">Privacy</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}