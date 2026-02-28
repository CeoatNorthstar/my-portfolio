export const SITE = {
  name: 'Naol Demisse',
  title: 'Quantum Theorist  |  Systems Architect  |  Founder of AxionsLab',
  location: 'Silver Spring, Maryland',
  email: 'naoldemisse14@gmail.com',
  contactEmail: 'naol@naol.pro',
  linkedin: 'https://linkedin.com/in/naoldemisse',
  github: 'https://github.com/ProgNaol',
};

export const EMAILJS = {
  serviceId: 'service_sky8gq6',
  templateId: 'template_s669wyj',
  publicKey: 'pdnAuEv2s3pV0femb',
  toEmail: 'naol@naol.pro',
};

export const STRIPE = {
  donateLink: 'https://donate.stripe.com/aFabJ3aqh2dZ6pZfrb6AM00',
};

export const SKILLS = [
  { name: 'Python', level: 90, category: 'Languages' },
  { name: 'JavaScript', level: 85, category: 'Languages' },
  { name: 'React', level: 85, category: 'Frontend' },
  { name: 'Node.js', level: 80, category: 'Backend' },
  { name: 'Express', level: 80, category: 'Backend' },
  { name: 'MongoDB', level: 75, category: 'Database' },
  { name: 'PostgreSQL', level: 75, category: 'Database' },
  { name: 'Data Analysis', level: 85, category: 'Data' },
  { name: 'NumPy', level: 85, category: 'Data' },
  { name: 'Auth Systems', level: 80, category: 'Security' },
  { name: 'Full Stack Development', level: 85, category: 'Development' },
];

export const EXPERIENCE = {
  role: 'Founder',
  company: 'AxionsLab',
  period: 'Aug 2024 — Present',
  location: 'Ethiopia',
  description:
    'Founded AxionsLab to develop advanced solutions in quantum computing, AI, and defense tech. Leading R&D initiatives focused on next-gen encryption and scientific simulation.',
  research: [
    'Quantum Entanglement Coefficient (QEC)',
    'String Theory',
    'Emergent Computation',
  ],
  topSkills: ['Cybersecurity', 'Artificial Intelligence', 'C++'],
};

export const EDUCATION = {
  program: 'Full Stack Web Development Bootcamp',
  institution: 'Udemy',
  period: 'May 2024 — Aug 2024',
};

export const CERTIFICATIONS = [
  { title: 'Programming for Everybody (Getting Started with Python)', org: 'Coursera' },
  { title: 'The Complete 2024 Web Development Bootcamp', org: 'Udemy' },
];

export const NAV_ITEMS = [
  { label: 'Home', href: '#hero' },
  { label: 'About', href: '#about' },
  { label: 'Projects', href: '#projects' },
  { label: 'Blog', href: '#blog' },
  { label: 'Contact', href: '#contact' },
];

export const PROJECTS = [
  {
    id: 1,
    title: 'Weather App',
    category: 'Web Development',
    description:
      'Real-time weather forecasting with location services and beautiful visualizations.',
    image: '/Screenshot from 2024-10-20 09-46-47.png',
    tags: ['Express.js', 'MongoDB', 'EJS', 'CSS', 'Weather API'],
    githubUrl: 'https://github.com/ProgNaol/weatherapp',
    demoUrl: 'https://weather.naol.pro',
  },
  {
    id: 2,
    title: 'Dream Forex',
    category: 'Finance',
    description:
      'Interactive platform for learning forex trading strategies with real-time market data.',
    image: '/Screenshot from 2024-10-20 09-49-05.png',
    tags: ['Express.js', 'MongoDB', 'EJS', 'CSS', 'Finance API'],
    githubUrl: 'https://github.com/ProgNaol/dreamfx',
    demoUrl: 'https://dreamfx-0ode.onrender.com/',
  },
];

export const BIO = {
  summary:
    "Quantum theorist and systems architect exploring the deep intersections of quantum physics, artificial intelligence, and intelligent software systems.",
  detail:
    "My research spans from building original entanglement frameworks like the Quantum Entanglement Coefficient (QEC) — to developing long-term models around spacetime, string theory, and emergent computation. Alongside theoretical work, I engineer full-stack systems using Python, AI models, and quantum hardware.",
  tagline: "Not just to understand reality — but to help shape it.",
};
