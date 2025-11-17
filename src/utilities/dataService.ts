import type { Shelter, ShelterUpdatePayload } from '../types/index.ts';
import { publishShelterUpdate } from '../api/homelessShelters.tsx';

let shelters: Shelter[] = [];

type Subscriber = (nextValue: Shelter[]) => void;

const applyBedsUpdate = (current: Shelter, payload: ShelterUpdatePayload) => ({
  ...current,
  availability: {
    ...current.availability,
    bedsAvailable: payload.bedsAvailable ?? current.availability.bedsAvailable,
    status: payload.status ?? current.availability.status,
    lastUpdated: new Date().toISOString(),
  },
});

const applyMealsUpdate = (current: Shelter, payload: ShelterUpdatePayload) => ({
  ...current,
  availability: {
    ...current.availability,
    meals: payload.mealNote ?? current.availability.meals,
    lastUpdated: new Date().toISOString(),
  },
});

const applyServicesUpdate = (current: Shelter, payload: ShelterUpdatePayload) => ({
  ...current,
  availability: {
    ...current.availability,
    services: payload.services ?? current.availability.services,
    lastUpdated: new Date().toISOString(),
  },
});

const applyUrgentNeedsUpdate = (current: Shelter, payload: ShelterUpdatePayload) => ({
  ...current,
  availability: {
    ...current.availability,
    urgentNeeds: payload.urgentNeeds ?? current.availability.urgentNeeds,
    lastUpdated: new Date().toISOString(),
  },
});

export const applyShelterUpdate = (current: Shelter, payload: ShelterUpdatePayload) => {
  switch (payload.resource) {
    case 'beds':
      return applyBedsUpdate(current, payload);
    case 'meals':
      return applyMealsUpdate(current, payload);
    case 'services':
      return applyServicesUpdate(current, payload);
    case 'urgentNeeds':
      return applyUrgentNeedsUpdate(current, payload);
    default:
      return current;
  }
};

export const fetchShelters = async (): Promise<Shelter[]> => Promise.resolve([...shelters]);

export const subscribeToShelters = (_onUpdate: Subscriber) => {
  // Auto-update disabled - data will only change through manual volunteer updates
  // Uncomment the code below to enable automatic bed availability changes every 8 seconds
  
  /*
  const interval = setInterval(() => {
    shelters = shelters.map((shelter) => {
      const variance = Math.random();
      if (variance > 0.7 && shelter.availability.status !== 'full') {
        const bedsAvailable = Math.max(0, shelter.availability.bedsAvailable - 1);
        return {
          ...shelter,
          availability: {
            ...shelter.availability,
            bedsAvailable,
            status: bedsAvailable === 0 ? 'full' : bedsAvailable < 3 ? 'limited' : 'open',
            lastUpdated: new Date().toISOString(),
          },
        };
      }
      return shelter;
    });
    onUpdate([...shelters]);
  }, 8000);

  return () => clearInterval(interval);
  */
  
  // Return empty cleanup function
  return () => {};
};

export const pushShelterUpdate = async (payload: ShelterUpdatePayload) => {
  shelters = shelters.map((shelter) =>
    shelter.id === payload.shelterId ? applyShelterUpdate(shelter, payload) : shelter,
  );
  // Best-effort: try to persist the update to the remote API. If it fails,
  // the local in-memory update above keeps the UI in sync (guest view will
  // see the change).
  try {
    await publishShelterUpdate(payload);
  } catch (error) {
    // Swallow network errors — already applied locally.
    console.error('Failed to publish shelter update to remote API', error);
  }
};

export const replaceShelters = (next: Shelter[]) => {
  shelters = next;
};
