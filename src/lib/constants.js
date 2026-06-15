export const SITE = {
  name: 'Naol Demisse',
  title: 'Quantum Theorist  |  Systems Architect  |  Founder of Sentinel Collective',
  location: 'Silver Spring, Maryland',
  email: 'naol@sentinelhq.world',
  contactEmail: 'naol@sentinelhq.world',
  linkedin: 'https://linkedin.com/in/naoldemisse',
  github: 'https://github.com/Ceoatnorthstar',
};

export const SKILLS = [
  { name: 'Python', category: 'Languages' },
  { name: 'TypeScript', category: 'Languages' },
  { name: 'Swift', category: 'Languages' },
  { name: 'Rust', category: 'Languages' },
  { name: 'C++', category: 'Languages' },
  { name: 'React', category: 'Frontend' },
  { name: 'Tailwind CSS', category: 'Frontend' },
  { name: 'Framer Motion', category: 'Frontend' },
  { name: 'Cloudflare Workers', category: 'Cloud' },
  { name: 'D1 / R2 / KV', category: 'Cloud' },
  { name: 'Node.js', category: 'Cloud' },
  { name: 'Qiskit', category: 'Quantum' },
  { name: 'Quantum Circuits', category: 'Quantum' },
  { name: 'NumPy', category: 'Quantum' },
  { name: 'LLM Integration', category: 'AI' },
  { name: 'PyTorch', category: 'AI' },
];

export const EXPERIENCE = {
  role: 'Founder',
  company: 'Sentinel Collective',
  period: 'Aug 2024 — Present',
  location: 'Ethiopia',
  description:
    'Founded Sentinel Collective to develop advanced solutions in quantum computing, AI, and defense tech. Leading R&D initiatives focused on next-gen encryption and scientific simulation.',
  research: [
    'Closed Timelike Curves (CTCs)',
    'Quantum Information',
    'Emergent Computation',
  ],
  topSkills: ['Quantum Information', 'Artificial Intelligence', 'Systems Architecture'],
};

// Research Log / Field Notes — replaces the old Experience section.
export const RESEARCH_LOG = {
  current:
    'Comparing Deutsch and post-selected closed timelike curves through circuit-level quantum simulations.',
  entries: [
    {
      year: '2025',
      title: 'Deutsch vs. Post-selected CTCs',
      note: 'Circuit simulations comparing the two leading models of computation in the presence of closed timelike curves.',
      tag: 'Quantum Information',
      link: 'https://zenodo.org/records/20693269',
    },
    {
      year: '2025',
      title: 'QuantaFlow',
      note: 'An in-development Python package for composing and simulating quantum information workflows.',
      tag: 'Open Source',
      link: 'https://pypi.org/project/quantaflow/',
    },
    {
      year: '2024',
      title: 'Sentinel Collective',
      note: 'Founded to push research at the intersection of quantum theory, AI, and resilient systems.',
      tag: 'Founding',
      link: null,
    },
  ],
};

export const NAV_ITEMS = [
  { label: 'Home', href: '#hero' },
  { label: 'About', href: '#about' },
  { label: 'Projects', href: '#projects' },
  { label: 'Research', href: '#research' },
  { label: 'Blog', href: '#blog' },
  { label: 'Contact', href: '#contact' },
];

export const PROJECTS = [
  {
    id: 1,
    title: 'Deutsch vs. Post-selected CTCs',
    category: 'Physics Paper',
    description:
      'A circuit-simulation study comparing the Deutsch and post-selected models of closed timelike curves, examining how each resolves quantum computation under time travel.',
    image: null,
    tags: ['Quantum Information', 'Qiskit', 'CTCs', 'Research'],
    githubUrl: 'https://github.com/CeoatNorthstar/Comparing-Deutsch-and-Postselected-CTC',
    demoUrl: 'https://zenodo.org/records/20693269',
    demoLabel: 'Read Paper',
  },
  {
    id: 2,
    title: 'BrewCap',
    category: 'macOS App',
    description:
      'A native macOS battery management app that caps charging to protect long-term battery health, with a clean menu-bar experience.',
    image: null,
    tags: ['Swift', 'SwiftUI', 'macOS', 'Battery'],
    githubUrl: 'https://github.com/CeoatNorthstar/BrewCap',
    demoUrl: 'https://brewcap.app',
    demoLabel: 'Visit Site',
  },
  {
    id: 3,
    title: 'QuantaFlow',
    category: 'Python Package',
    description:
      'A Python package for composing and simulating quantum information workflows. Actively in development.',
    image: null,
    tags: ['Python', 'Quantum', 'Open Source'],
    githubUrl: 'https://github.com/SentinelCollective/quantaflow',
    demoUrl: 'https://pypi.org/project/quantaflow/',
    demoLabel: 'View on PyPI',
    wip: true,
  },
];

export const BIO = {
  summary:
    "Quantum theorist and systems architect exploring the deep intersections of quantum physics, artificial intelligence, and intelligent software systems.",
  detail:
    "My research spans quantum information and the computational structure of closed timelike curves, through long-term models of spacetime and emergent computation. Alongside theoretical work, I engineer full-stack systems and native software using Python, Swift, and modern web infrastructure.",
  tagline: "Chase time until time kills me.",
};
