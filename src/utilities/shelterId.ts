const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-');

export const buildShelterId = (name?: string, address?: string, latitude?: number, longitude?: number) => {
  const base = slugify([name ?? '', address ?? ''].filter(Boolean).join('-'));
  if (base) return base;

  if (typeof latitude === 'number' && typeof longitude === 'number') {
    const lat = latitude.toFixed(3);
    const lng = longitude.toFixed(3);
    return `geo-${lat}-${lng}`;
  }

  return `shelter-${Date.now()}`;
};
