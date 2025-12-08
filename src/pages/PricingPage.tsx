import { PricingTable } from '@/components/PricingTable';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
export function PricingPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-8 md:py-10 lg:py-12">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-display font-bold">Find the perfect plan</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Start for free, then scale as you grow. All plans include our core features for tracking ad performance.
          </p>
        </div>
        <div className="mt-12">
          <PricingTable />
        </div>
        <div className="mt-24 text-center">
            <h3 className="text-2xl font-semibold">Stay updated</h3>
            <p className="text-muted-foreground mt-2">Subscribe to our newsletter for product updates and industry insights.</p>
            <form className="mt-6 max-w-md mx-auto flex gap-2">
                <Input type="email" placeholder="Enter your email" required />
                <Button type="submit">Subscribe</Button>
            </form>
        </div>
      </div>
    </div>
  );
}