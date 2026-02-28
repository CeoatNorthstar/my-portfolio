import { Heart } from 'lucide-react';
import ScrollReveal from '../ui/ScrollReveal';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';
import { STRIPE } from '../../lib/constants';

const DonatePage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center section-container">
      <ScrollReveal>
        <GlassCard className="max-w-md mx-auto text-center">
          <div className="w-16 h-16 rounded-full border border-white/10 bg-white/[0.03] flex items-center justify-center mx-auto mb-6">
            <Heart size={24} className="text-white/60" />
          </div>

          <h1 className="font-display text-2xl text-white font-semibold mb-3">
            Support My Work
          </h1>
          <p className="text-text-2 text-sm mb-8 leading-relaxed">
            If my research or projects have been helpful, consider supporting with a small
            donation. Every contribution helps fuel exploration at the intersection of
            quantum physics and technology.
          </p>

          <GlassButton
            variant="primary"
            href={STRIPE.donateLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full"
          >
            <Heart size={14} />
            Donate $10
          </GlassButton>

          <p className="font-mono text-[10px] text-text-3 mt-4">
            Powered by Stripe — secure payment
          </p>
        </GlassCard>
      </ScrollReveal>
    </div>
  );
};

export default DonatePage;
