import { useEffect, useState, useCallback } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js';
import { getConfig, createCheckoutSession } from '../../lib/api';

/**
 * Inline Stripe Embedded Checkout — the full payment UI is mounted on the page
 * so the user never leaves the site. The publishable key comes from /api/config
 * and the session client_secret from /api/stripe/checkout-session.
 */
const EmbeddedDonate = () => {
  const [stripePromise, setStripePromise] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getConfig()
      .then((cfg) => {
        if (!active) return;
        if (!cfg.stripePublishableKey) {
          setError('Payments are not configured yet.');
          return;
        }
        setStripePromise(loadStripe(cfg.stripePublishableKey));
      })
      .catch(() => active && setError('Could not load payment configuration.'));
    return () => {
      active = false;
    };
  }, []);

  const fetchClientSecret = useCallback(
    () => createCheckoutSession().then((r) => r.clientSecret),
    []
  );

  if (error) {
    return <p className="font-mono text-xs text-text-3 text-center py-6">{error}</p>;
  }
  if (!stripePromise) {
    return <p className="font-mono text-xs text-text-3 text-center py-6">Loading secure checkout…</p>;
  }

  return (
    <div className="rounded-2xl overflow-hidden border border-white/[0.08] bg-white">
      <EmbeddedCheckoutProvider stripe={stripePromise} options={{ fetchClientSecret }}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
};

export default EmbeddedDonate;
