export const formatDate = (ts) => {
  if (!ts) return '';
  try {
    return new Date(ts).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '';
  }
};

export const TYPE_LABELS = {
  article: 'Article',
  research: 'Research',
  link: 'Link',
};
