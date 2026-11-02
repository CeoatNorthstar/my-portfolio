// The books for sale. Prices are what a reader pays before shipping. Print files live in R2
// under print/<slug>/ and are only ever fetched by Lulu, through short-lived signed links.

// Digest 5.5 x 8.5 in, standard black & white, perfect bound, 60# cream paper, matte cover.
export const POD_PACKAGE = '0550X0850.BW.STD.PB.060UC444.MXX';

export const BOOKS = [
  {
    slug: 'no-further-action',
    title: 'No Further Action',
    author: 'Naol Demisse',
    year: 2026,
    pages: 202,
    spineIn: 0.515,
    priceCents: 1800,
    tagline: 'Who is allowed to forgive?',
    blurb: [
      'An auditor receives a letter from the Board of Clemency. He has been pardoned, fully, freely and without condition, for an offence he confessed.',
      'He has confessed nothing.',
      'The record has been destroyed to protect him. He cannot refuse the pardon, and he cannot appeal it. Within a month it has taken his work, his good name, and the music out of his daughter’s hands.',
      'So he does what an auditor does. He goes looking for the entry with no partner.',
    ],
  },
  {
    slug: 'the-small-difference',
    title: 'The Small Difference',
    author: 'Naol Demisse',
    year: 2026,
    pages: 168,
    spineIn: 0.438,
    priceCents: 1600,
    tagline: 'I believe it. I do not know it.',
    blurb: [
      'At his mother’s burial, in front of two hundred and forty people, a land surveyor says the one thing a funeral has no procedure for: the truth, with its error written beside it.',
      'For that, a town closes around him, gently, warmly, completely. A fiancée does her arithmetic. An uncle asks for a floor to stand on. An old priest, forty years certain in public, makes an appointment to confess.',
      'A philosophical novel after the paper Epistemic Theism, about the distance between believing and knowing.',
    ],
  },
];

export const bookBySlug = (slug) => BOOKS.find((b) => b.slug === slug) || null;

export const printKey = (slug, part) => `print/${slug}/${part}.pdf`;

// Turn a client cart into trusted line items (prices always come from the catalog).
export const cartItems = (cart) => {
  if (!Array.isArray(cart) || !cart.length || cart.length > BOOKS.length) return null;
  const items = [];
  for (const entry of cart) {
    const book = bookBySlug(entry && entry.slug);
    const qty = Math.floor(Number(entry && entry.qty));
    if (!book || !(qty >= 1 && qty <= 10) || items.some((i) => i.slug === book.slug)) return null;
    items.push({ slug: book.slug, title: book.title, qty, unit_cents: book.priceCents });
  }
  return items;
};
