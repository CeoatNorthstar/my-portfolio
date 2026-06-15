import { json } from '../_lib/response.js';

// Public, non-secret config consumed by the client (Turnstile site key, Stripe
// publishable key).
export const onRequestGet = ({ env }) =>
  json({
    turnstileSiteKey: env.TURNSTILE_SITE_KEY || '1x00000000000000000000AA',
    stripePublishableKey: env.STRIPE_PUBLISHABLE_KEY || '',
    donationAmountCents: Number(env.DONATION_AMOUNT_CENTS || 1000),
  });
