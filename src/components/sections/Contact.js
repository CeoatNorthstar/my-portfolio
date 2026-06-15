import { useState } from 'react';
import { motion } from 'framer-motion';
import ScrollReveal from '../ui/ScrollReveal';
import ASCIIHeading from '../ui/ASCIIHeading';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';
import Turnstile from '../ui/Turnstile';
import { SITE } from '../../lib/constants';
import { sendContact } from '../../lib/api';
import { Send, Mail, Linkedin, MapPin } from 'lucide-react';

const Contact = () => {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [token, setToken] = useState('');
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error
  const [error, setError] = useState('');

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!token) {
      setError('Please complete the verification.');
      return;
    }
    setStatus('sending');
    try {
      await sendContact({ ...form, turnstileToken: token });
      setStatus('sent');
      setForm({ name: '', email: '', message: '' });
      setToken('');
      setTimeout(() => setStatus('idle'), 5000);
    } catch (err) {
      setError(err.message || 'Something went wrong.');
      setStatus('error');
    }
  };

  const inputClasses =
    'w-full bg-transparent border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder:text-text-3 focus:border-white/20 focus:outline-none transition-colors duration-300 font-sans';

  return (
    <section id="contact" className="section-container">
      <ScrollReveal>
        <ASCIIHeading text="contact" />
        <h2 className="text-heading text-white mb-12">Contact</h2>
      </ScrollReveal>

      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* Form */}
        <ScrollReveal delay={0.1}>
          <GlassCard hover={false}>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Name"
                required
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                className={inputClasses}
              />
              <input
                type="email"
                placeholder="Email"
                required
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                className={inputClasses}
              />
              <textarea
                placeholder="Message"
                rows={5}
                required
                value={form.message}
                onChange={(e) => set('message', e.target.value)}
                className={`${inputClasses} resize-none`}
              />

              <Turnstile onToken={setToken} />

              {error && <p className="font-mono text-xs text-red-400">{error}</p>}

              <GlassButton
                type="submit"
                variant="primary"
                className="w-full"
                disabled={status === 'sending'}
              >
                {status === 'sending' ? (
                  'Sending...'
                ) : status === 'sent' ? (
                  'Sent!'
                ) : status === 'error' ? (
                  'Try again'
                ) : (
                  <>
                    <Send size={14} />
                    Send Message
                  </>
                )}
              </GlassButton>

              {status === 'sent' && (
                <motion.p
                  className="text-center font-mono text-xs text-green-400"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  Message sent successfully.
                </motion.p>
              )}
            </form>
          </GlassCard>
        </ScrollReveal>

        {/* Info */}
        <ScrollReveal delay={0.2}>
          <GlassCard hover={false} className="h-full flex flex-col justify-between">
            <div>
              <p className="text-text-2 leading-relaxed mb-8">
                Have a project in mind, want to collaborate on research, or just want to talk
                quantum physics? I'd love to hear from you.
              </p>

              <div className="space-y-4">
                <a
                  href={`mailto:${SITE.email}`}
                  className="flex items-center gap-3 text-text-2 hover:text-white transition-colors group"
                >
                  <Mail size={16} className="text-text-3 group-hover:text-white transition-colors" />
                  <span className="text-sm">{SITE.email}</span>
                </a>
                <a
                  href={SITE.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-text-2 hover:text-white transition-colors group"
                >
                  <Linkedin size={16} className="text-text-3 group-hover:text-white transition-colors" />
                  <span className="text-sm">LinkedIn</span>
                </a>
                <div className="flex items-center gap-3 text-text-2">
                  <MapPin size={16} className="text-text-3" />
                  <span className="text-sm">{SITE.location}</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/[0.06]">
              <p className="font-mono text-xs text-text-3 italic">
                "Chase time until time kills me."
              </p>
            </div>
          </GlassCard>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default Contact;
