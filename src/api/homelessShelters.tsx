/*
  Minimal RapidAPI wrapper for the `homeless-shelter` API.

  Exports:
    - fetchSheltersByCityState(city, state): Promise<Shelter[]>

  Notes:
  - The real RapidAPI endpoint shape may vary. This wrapper attempts a conservative
    GET request to the base URL with `city` and `state` query params and maps the
    returned objects into the app's `Shelter` shape with safe defaults.
  - It will read an API key from one of these env vars (first found):
      VITE_SHELTER_API_KEY, SHELTER_API_KEY, VITE_API_KEY
    Prefer adding `VITE_SHELTER_API_KEY` to your `.env` for Vite to expose it to
    the client.
*/

import type { Shelter } from '../types/index.ts';

const BASE_URL = 'https://homeless-shelters-and-foodbanks-api.p.rapidapi.com/resources';



const buildHeaders = () => ({
  'X-RapidAPI-Key': import.meta.env.VITE_SHELTER_API_KEY,
  'X-RapidAPI-Host': 'homeless-shelters-and-foodbanks-api.p.rapidapi.com',
});

const mapToShelter = (raw: any): Shelter => {
  // Best-effort mapping; use defaults when fields are missing
  const id = raw.id || raw._id || raw.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || String(Math.random());
  const name = raw.name || raw.title || 'Unknown shelter';
  const latitude = Number(raw.latitude ?? raw.lat ?? raw.location?.lat ?? raw.coordinates?.[1]) || 0;
  const longitude = Number(raw.longitude ?? raw.lng ?? raw.location?.lng ?? raw.coordinates?.[0]) || 0;
  const address = raw.full_address || raw.location?.address || raw.location?.display || '';
  const bedsAvailable = Number(raw.bedsAvailable ?? raw.available_beds ?? raw.capacity ?? 0) || 0;
  const status = (raw.status as any) || (bedsAvailable === 0 ? 'full' : bedsAvailable < 3 ? 'limited' : 'open');
  const meals = raw.meals || raw.meal_note || '';
  const services = Array.isArray(raw.services) ? raw.services : raw.services ? String(raw.services).split(',').map((s: string) => s.trim()) : [];
  const urgentNeeds = Array.isArray(raw.urgentNeeds) ? raw.urgentNeeds : raw.urgent_needs ? String(raw.urgent_needs).split(',').map((s: string) => s.trim()) : [];

  return {
    id,
    name,
    distanceMiles: Number(raw.distanceMiles ?? raw.distance ?? 0) || 0,
    location: {
      latitude,
      longitude,
      address,
    },
    availability: {
      bedsAvailable,
      status: status === 'open' || status === 'limited' || status === 'full' ? status : 'open',
      meals: meals || 'No meal info',
      services,
      urgentNeeds,
      lastUpdated: raw.lastUpdated || raw.updated_at || new Date().toISOString(),
    },
  };
};

export const fetchSheltersByCityState = async (city: string, state: string): Promise<Shelter[]> => {
  if (!city || !state) return [];

  const params = new URLSearchParams({ city, state });
  // Try a conservative GET to the base URL — many RapidAPI wrappers accept query params.
  const url = `${BASE_URL}?${params.toString()}`;

  try {
    const res = await fetch(url, { method: 'GET', headers: buildHeaders() });
    if (!res.ok) {
      // If the base call fails, return an empty array (caller should show an error)
      console.warn('homelessShelters API returned non-OK', res.status);
      return [];
    }
    const json = await res.json();

    // If the API returns an object with a items array, prefer that
    const items = Array.isArray(json) ? json : Array.isArray(json.items) ? json.items : [];

    return items.map(mapToShelter);
  } catch (error) {
    console.error('Failed to fetch shelters by city/state', error);
    return [];
  }
};

export default fetchSheltersByCityState;
