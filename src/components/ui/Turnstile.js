import { useEffect, useRef, useState } from 'react';
import { getConfig } from '../../lib/api';

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
let scriptPromise = null;

const loadScript = () => {
  if (window.turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = SCRIPT_SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = reject;
    document.head.appendChild(s);
  });
  return scriptPromise;
};

let cachedSiteKey = null;

/**
 * Cloudflare Turnstile widget. Calls onToken(token) when solved and
 * onToken('') when the token expires.
 */
const Turnstile = ({ onToken }) => {
  const ref = useRef(null);
  const widgetId = useRef(null);
  const [siteKey, setSiteKey] = useState(cachedSiteKey);

  useEffect(() => {
    let cancelled = false;
    if (!siteKey) {
      getConfig()
        .then((c) => {
          if (cancelled) return;
          cachedSiteKey = c.turnstileSiteKey;
          setSiteKey(c.turnstileSiteKey);
        })
        .catch(() => {});
    }
    return () => {
      cancelled = true;
    };
  }, [siteKey]);

  useEffect(() => {
    if (!siteKey) return undefined;
    let mounted = true;
    loadScript().then(() => {
      if (!mounted || !ref.current || !window.turnstile) return;
      widgetId.current = window.turnstile.render(ref.current, {
        sitekey: siteKey,
        theme: 'auto',
        callback: (token) => onToken(token),
        'expired-callback': () => onToken(''),
        'error-callback': () => onToken(''),
      });
    });
    return () => {
      mounted = false;
      if (widgetId.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetId.current);
        } catch {
          /* ignore */
        }
      }
    };
  }, [siteKey, onToken]);

  return <div ref={ref} className="my-2" />;
};

export default Turnstile;
