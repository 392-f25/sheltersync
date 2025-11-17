import type { ShelterLocation } from '../types/index.ts';

export const buildDirectionsUrl = (location: ShelterLocation) => {
  const destination = `${location.latitude},${location.longitude}`;
  const address = encodeURIComponent(location.address);
  return `https://www.google.com/maps/dir/?api=1&destination=${destination}&destination_place_id=${address}`;
};
