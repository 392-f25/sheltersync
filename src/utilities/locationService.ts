export const reverseGeocodeCityState = async (point: { lat: number; lng: number }) => {
  if (!import.meta.env.VITE_MAPBOX_ACCESS_TOKEN) {
    throw new Error('Missing VITE_MAPBOX_ACCESS_TOKEN for reverse geocoding.');
  }

  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${point.lng},${point.lat}.json?types=place,region&access_token=${import.meta.env.VITE_MAPBOX_ACCESS_TOKEN}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Reverse geocoding failed.');
  }

  const data = await res.json();
  const features: any[] = data?.features || [];

  const cityFeature = features.find((f) => f.place_type?.includes('place'));
  const regionFeature = features.find((f) => f.place_type?.includes('region'));

  return {
    city: cityFeature?.text || '',
    state: regionFeature?.short_code?.replace('US-', '') || regionFeature?.text || '',
  };
};
