import { get, onValue, ref, update } from 'firebase/database';
import type { Shelter, ShelterUpdatePayload } from '../types/index.ts';
import { publishShelterUpdate } from '../api/homelessShelters.tsx';
import { db } from './firebase.ts';

type Subscriber = (nextValue: Shelter[]) => void;
type ShelterOverride = Partial<Shelter['availability']>;

let shelters: Shelter[] = [];
let subscriber: Subscriber | null = null;
let activeDbUnsubscribes: Array<() => void> = [];

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

const mergeShelterOverride = (shelter: Shelter, override?: ShelterOverride | null): Shelter => {
  if (!override) return shelter;
  return {
    ...shelter,
    availability: {
      ...shelter.availability,
      ...override,
    },
  };
};

const fetchShelterOverrides = async (ids: string[]) => {
  const entries = await Promise.all(
    ids.map(async (id) => {
      try {
        const snapshot = await get(ref(db, `shelters/${id}`));
        return [id, snapshot.exists() ? (snapshot.val() as ShelterOverride) : null] as const;
      } catch (error) {
        console.warn('Failed to load shelter override', id, error);
        return [id, null] as const;
      }
    }),
  );
  return Object.fromEntries(entries) as Record<string, ShelterOverride | null>;
};

const clearDbSubscriptions = () => {
  activeDbUnsubscribes.forEach((fn) => fn());
  activeDbUnsubscribes = [];
};

const attachDbSubscriptions = () => {
  clearDbSubscriptions();
  if (!subscriber || shelters.length === 0) return;

  activeDbUnsubscribes = shelters.map((shelter) =>
    onValue(ref(db, `shelters/${shelter.id}`), (snapshot) => {
      if (!snapshot.exists()) return;
      const override = snapshot.val() as ShelterOverride;
      shelters = shelters.map((existing) =>
        existing.id === shelter.id ? mergeShelterOverride(existing, override) : existing,
      );
      subscriber?.([...shelters]);
    }),
  );
};

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
  subscriber = onUpdate;
  attachDbSubscriptions();
  return () => {
    subscriber = null;
    clearDbSubscriptions();
  };
};

export const pushShelterUpdate = async (payload: ShelterUpdatePayload) => {
  shelters = shelters.map((shelter) =>
    shelter.id === payload.shelterId ? applyShelterUpdate(shelter, payload) : shelter,
  );
  const updateFields: ShelterOverride = { lastUpdated: new Date().toISOString() };
  if (payload.resource === 'beds') {
    if (typeof payload.bedsAvailable === 'number') {
      updateFields.bedsAvailable = payload.bedsAvailable;
    }
    if (payload.status) {
      updateFields.status = payload.status;
    }
  }
  if (payload.resource === 'meals') {
    if (payload.mealNote) {
      updateFields.meals = payload.mealNote;
    }
  }
  if (payload.resource === 'services') {
    if (payload.services) {
      updateFields.services = payload.services;
    }
  }
  if (payload.resource === 'urgentNeeds') {
    if (payload.urgentNeeds) {
      updateFields.urgentNeeds = payload.urgentNeeds;
    }
  }

  try {
    await update(ref(db, `shelters/${payload.shelterId}`), updateFields);
  } catch (error) {
    console.error('Failed to write shelter update to Firebase', error);
  }

  try {
    await publishShelterUpdate(payload);
  } catch (error) {
    console.error('Failed to publish shelter update to remote API', error);
  }
};

export const replaceShelters = async (next: Shelter[]) => {
  if (next.length === 0) {
    shelters = [];
    clearDbSubscriptions();
    return shelters;
  }

  const overrides = await fetchShelterOverrides(next.map((s) => s.id));
  shelters = next.map((shelter) => mergeShelterOverride(shelter, overrides[shelter.id]));
  attachDbSubscriptions();
  return shelters;
};
