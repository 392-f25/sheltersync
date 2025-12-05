export type AvailabilityStatus = 'open' | 'limited' | 'full';

export type ResourceCategory = 'beds' | 'meals' | 'services' | 'urgentNeeds';

export type ShelterLocation = {
  latitude: number;
  longitude: number;
  address: string;
};

export type Shelter = {
  id: string;
  name: string;
  distanceMiles: number;
  location: ShelterLocation;
  /** Optional resource type reported by upstream API (e.g. 'foodbank' or 'shelter') */
  type?: 'shelter' | 'foodbank' | 'other';
  availability: {
    bedsAvailable: number;
    status: AvailabilityStatus;
    meals: string;
    services: string[];
    urgentNeeds: string[];
    lastUpdated: string;
  };
};

export type ShelterUpdatePayload = {
  shelterId: string;
  resource: ResourceCategory;
  status?: AvailabilityStatus;
  bedsAvailable?: number;
  mealNote?: string;
  services?: string[];
  urgentNeeds?: string[];
  note?: string;
};

export type UserRole = 'volunteer' | 'superAdmin';

export type VolunteerUser = {
  uid: string;
  displayName: string;
  email: string;
  isAuthenticated: boolean;
  role: UserRole;
  /** Shelter IDs the volunteer can update. Super admins can access all shelters regardless of this list. */
  allowedShelterIds: string[];
};

export type VolunteerAccessRecord = {
  email: string;
  shelterIds: string[];
  updatedAt?: string;
  updatedBy?: string | null;
};
