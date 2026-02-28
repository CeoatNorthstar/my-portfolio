import { useState, useRef } from 'react';
import emailjs from '@emailjs/browser';
import { motion } from 'framer-motion';
import ScrollReveal from '../ui/ScrollReveal';
import ASCIIHeading from '../ui/ASCIIHeading';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';
import { SITE, EMAILJS } from '../../lib/constants';
import { Send, Mail, Linkedin, MapPin } from 'lucide-react';

const Contact = () => {
  const formRef = useRef();
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error

  const handleSubmit = (e) => {
    e.preventDefault();
    setStatus('sending');

    emailjs
      .sendForm(EMAILJS.serviceId, EMAILJS.templateId, formRef.current, EMAILJS.publicKey)
      .then(() => {
        setStatus('sent');
        formRef.current.reset();
        setTimeout(() => setStatus('idle'), 4000);
      })
      .catch(() => {
        setStatus('error');
        setTimeout(() => setStatus('idle'), 4000);
      });
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
            <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                name="from_name"
                placeholder="Name"
                required
                className={inputClasses}
              />
              <input
                type="email"
                name="from_email"
                placeholder="Email"
                required
                className={inputClasses}
              />
              <textarea
                name="message"
                placeholder="Message"
                rows={5}
                required
                className={`${inputClasses} resize-none`}
              />

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
                  'Failed — try again'
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
                "Not just to understand reality — but to help shape it."
              </p>
            </div>
          </GlassCard>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default Contact;
