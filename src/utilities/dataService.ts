import type { Shelter, ShelterUpdatePayload } from '../types/index.ts';

const initialShelters: Shelter[] = [
  {
    id: 'beacon-haven',
    name: 'Beacon Haven',
    distanceMiles: 0.2,
    location: {
      latitude: 41.8805,
      longitude: -87.6292,
      address: '123 Hope St, Chicago, IL',
    },
    availability: {
      bedsAvailable: 5,
      status: 'open',
      meals: 'Dinner served until 8 PM. Breakfast at 7 AM.',
      services: ['Showers', 'Casework', 'Day storage'],
      urgentNeeds: ['Blankets', 'Socks'],
      lastUpdated: new Date().toISOString(),
    },
  },
  {
    id: 'ashland-shelter',
    name: 'Ashland Overnight Center',
    distanceMiles: 0.9,
    location: {
      latitude: 41.8851,
      longitude: -87.6278,
      address: '456 Ashland Ave, Chicago, IL',
    },
    availability: {
      bedsAvailable: 2,
      status: 'limited',
      meals: 'Sandwiches and coffee available until supplies run out.',
      services: ['Nurse visit 6-9 PM', 'Charging station'],
      urgentNeeds: ['Gloves', 'Hygiene kits'],
      lastUpdated: new Date().toISOString(),
    },
  },
  {
    id: 'harbor-shelter',
    name: 'Harbor Light Shelter',
    distanceMiles: 1.4,
    location: {
      latitude: 41.8781,
      longitude: -87.6359,
      address: '789 Harbor Ave, Chicago, IL',
    },
    availability: {
      bedsAvailable: 0,
      status: 'full',
      meals: 'Meal service ends at 9 PM.',
      services: ['Laundry tokens tomorrow 10 AM', 'Case management appointments'],
      urgentNeeds: ['Reusable water bottles'],
      lastUpdated: new Date().toISOString(),
    },
  },
];

let shelters = initialShelters;

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

export const subscribeToShelters = (onUpdate: Subscriber) => {
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
};

export const pushShelterUpdate = async (payload: ShelterUpdatePayload) => {
  shelters = shelters.map((shelter) =>
    shelter.id === payload.shelterId ? applyShelterUpdate(shelter, payload) : shelter,
  );
};
