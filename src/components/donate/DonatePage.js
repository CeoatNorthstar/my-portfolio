import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Rocket, Atom, Code, Zap, Star, ArrowRight, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';
import EmbeddedDonate from './EmbeddedDonate';
import { SITE } from '../../lib/constants';

/**
 * Interactive 6-phase journey that tells Naol's story before asking
 * for support. Each phase is a mini "level" the user clicks through.
 */

const PHASES = [
  {
    icon: Atom,
    title: 'The Spark',
    body: 'It started with a question: what if we could model quantum entanglement computationally? Not in a lab — but in code.',
    accent: 'A teenager in Ethiopia writing his first Python script.',
    bg: 'from-white/[0.02] to-transparent',
  },
  {
    icon: Code,
    title: 'The Grind',
    body: 'Hundreds of hours learning full-stack development. Express, React, Node, databases — building the tools to bring ideas to life.',
    accent: 'Bootcamp graduate. Self-taught quantum researcher.',
    bg: 'from-white/[0.03] to-transparent',
  },
  {
    icon: Rocket,
    title: 'Sentinel Collective',
    body: 'Founded Sentinel Collective to push the boundaries of quantum computing, AI, and defense technology. Not a side project — a mission.',
    accent: 'R&D in encryption, simulation, and emergent computation.',
    bg: 'from-white/[0.03] to-transparent',
  },
  {
    icon: Zap,
    title: 'The Research',
    body: 'Published circuit-level studies of closed timelike curves — comparing the Deutsch and post-selected models. Exploring quantum information and emergent computation.',
    accent: 'Building the mathematical groundwork for next-gen physics.',
    bg: 'from-white/[0.04] to-transparent',
  },
  {
    icon: Star,
    title: 'The Vision',
    body: '"Chase time until time kills me." Every project, every line of code, every equation moves toward this goal.',
    accent: 'Quantum physics meets intelligent software systems.',
    bg: 'from-white/[0.04] to-transparent',
  },
  {
    icon: Heart,
    title: 'Your Turn',
    body: 'This work takes time, compute, and resources. A $10 contribution directly fuels research, server costs, and the tools that make this possible.',
    accent: "You're not donating to a person — you're investing in a future.",
    bg: 'from-white/[0.05] to-transparent',
    isFinal: true,
  },
];

const PhaseCard = ({ phase, index, isCurrent, onNext, isCompleted }) => {
  const Icon = phase.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -30, scale: 0.95 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-lg mx-auto"
    >
      <GlassCard hover={false} className="relative overflow-hidden">
        {/* Phase number */}
        <div className="absolute top-4 right-4 font-mono text-[10px] text-text-3/40 uppercase tracking-widest">
          {index + 1} / {PHASES.length}
        </div>

        {/* Icon */}
        <motion.div
          className="w-14 h-14 rounded-2xl border border-white/[0.08] bg-white/[0.03] flex items-center justify-center mb-6"
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
        >
          <Icon size={24} className="text-white/70" />
        </motion.div>

        {/* Title */}
        <motion.h2
          className="font-display text-2xl text-white font-semibold mb-3"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          {phase.title}
        </motion.h2>

        {/* Body */}
        <motion.p
          className="text-text-2 text-sm leading-relaxed mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {phase.body}
        </motion.p>

        {/* Accent */}
        <motion.p
          className="font-mono text-xs text-text-3 italic mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {phase.accent}
        </motion.p>

        {/* Progress bar */}
        <div className="h-[1px] bg-white/[0.06] rounded-full mb-6 overflow-hidden">
          <motion.div
            className="h-full bg-white/30"
            initial={{ width: 0 }}
            animate={{ width: `${((index + 1) / PHASES.length) * 100}%` }}
            transition={{ duration: 0.8, delay: 0.3 }}
          />
        </div>

        {/* Action */}
        {phase.isFinal ? (
          <div className="space-y-3">
            <EmbeddedDonate />
            <p className="font-mono text-[10px] text-text-3 text-center">
              Secure payment via Stripe — you never leave this page.
            </p>
          </div>
        ) : (
          <GlassButton onClick={onNext} className="w-full group">
            Continue
            <motion.span
              className="inline-block"
              animate={{ x: [0, 4, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <ArrowRight size={14} />
            </motion.span>
          </GlassButton>
        )}
      </GlassCard>
    </motion.div>
  );
};

const DonatePage = () => {
  const [currentPhase, setCurrentPhase] = useState(0);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-24 relative">
      {/* Subtle background animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-px h-px bg-white rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0, 0.3, 0],
              scale: [0, 1.5, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 5,
            }}
          />
        ))}
      </div>

      {/* Back button */}
      <motion.div
        className="absolute top-6 left-6 z-10"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Link
          to="/"
          className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/[0.08] bg-white/[0.03] font-mono text-[10px] text-text-2 uppercase tracking-widest hover:text-white hover:bg-white/[0.06] hover:border-white/[0.15] transition-all duration-300"
        >
          <ArrowLeft size={12} />
          Home
        </Link>
      </motion.div>

      {/* Header */}
      <motion.div
        className="text-center mb-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <p className="font-mono text-[10px] text-text-3 uppercase tracking-[0.2em] mb-2">
          The Journey
        </p>
        <h1 className="font-display text-3xl md:text-4xl text-white font-bold">
          {SITE.name}
        </h1>
      </motion.div>

      {/* Phase dots */}
      <div className="flex gap-2 mb-8">
        {PHASES.map((_, i) => (
          <motion.button
            key={i}
            onClick={() => setCurrentPhase(i)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              i === currentPhase
                ? 'bg-white scale-125'
                : i < currentPhase
                ? 'bg-white/40'
                : 'bg-white/10'
            }`}
            whileHover={{ scale: 1.5 }}
            aria-label={`Phase ${i + 1}`}
          />
        ))}
      </div>

      {/* Current phase */}
      <AnimatePresence mode="wait">
        <PhaseCard
          key={currentPhase}
          phase={PHASES[currentPhase]}
          index={currentPhase}
          isCurrent={true}
          isCompleted={false}
          onNext={() => setCurrentPhase((p) => Math.min(p + 1, PHASES.length - 1))}
        />
      </AnimatePresence>

      {/* Skip link */}
      {currentPhase < PHASES.length - 1 && (
        <motion.button
          className="mt-6 font-mono text-[10px] text-text-3/40 hover:text-text-3 transition-colors uppercase tracking-widest"
          onClick={() => setCurrentPhase(PHASES.length - 1)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          Skip to donate
        </motion.button>
      )}
    </div>
  );
};

export default DonatePage;
