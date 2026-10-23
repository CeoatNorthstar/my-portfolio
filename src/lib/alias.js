// Mirrors anonymousAlias() in functions/_lib/util.js so the comment form can
// show "Posting as ..." before the server assigns the same alias.
const ADJECTIVES = ['Curious', 'Quiet', 'Charmed', 'Strange', 'Wandering', 'Patient', 'Restless', 'Gentle', 'Bright', 'Entangled'];
const PARTICLES = ['Muon', 'Gluon', 'Photon', 'Neutrino', 'Quark', 'Boson', 'Tau', 'Pion', 'Kaon', 'Positron', 'Lepton', 'Tachyon'];

export const anonymousAlias = (seed) => {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h >>>= 0;
  return `${ADJECTIVES[h % ADJECTIVES.length]} ${PARTICLES[Math.floor(h / ADJECTIVES.length) % PARTICLES.length]}`;
};
