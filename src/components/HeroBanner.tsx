import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, BarChart, DollarSign, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
export function HeroBanner() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute inset-0 grid grid-cols-2 -space-x-52 opacity-40 dark:opacity-20"
      >
        <div className="blur-[106px] h-56 bg-gradient-to-br from-primary to-purple-400 dark:from-blue-700" />
        <div className="blur-[106px] h-32 bg-gradient-to-r from-cyan-400 to-sky-300 dark:to-indigo-600" />
      </div>
       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-16 md:py-24 lg:py-32 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-bold tracking-tight text-foreground">
              Unified Ad Revenue <br />
              <span className="text-gradient bg-gradient-primary">At The Edge</span>
            </h1>
            <p className="mt-6 text-lg md:text-xl max-w-2xl mx-auto text-muted-foreground text-pretty">
              Stop juggling tabs. EdgeRevenue connects to your ad platforms, pulling spend and earnings into one beautiful, real-time dashboard.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Button size="lg" asChild className="btn-gradient shadow-lg hover:shadow-primary/80 transition-shadow">
                <Link to="/dashboard">
                  View Your Dashboard <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/pricing">See Pricing</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}