import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { PropsWithChildren } from 'react';
import type { Shelter, ShelterUpdatePayload } from '../types/index.ts';
import { applyShelterUpdate, fetchShelters, pushShelterUpdate, subscribeToShelters } from '../utilities/dataService.ts';

type AppDataContextValue = {
  shelters: Shelter[];
  publishUpdate: (payload: ShelterUpdatePayload) => Promise<void>;
  isLoading: boolean;
};

const AppDataContext = createContext<AppDataContextValue | undefined>(undefined);

export const AppDataProvider = ({ children }: PropsWithChildren) => {
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const load = async () => {
      setIsLoading(true);
      try {
        const initialShelters = await fetchShelters();
        setShelters(initialShelters);
        unsubscribe = subscribeToShelters(setShelters);
      } catch (error) {
        console.error('Failed to load shelters', error);
      } finally {
        setIsLoading(false);
      }
    };

    load();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const publishUpdate = useCallback(async (payload: ShelterUpdatePayload) => {
    setShelters((previous) =>
      previous.map((shelter) =>
        shelter.id === payload.shelterId ? applyShelterUpdate(shelter, payload) : shelter,
      ),
    );
    try {
      await pushShelterUpdate(payload);
    } catch (error) {
      console.error('Failed to sync update', error);
    }
  }, []);

  const value = useMemo(
    () => ({
      shelters,
      publishUpdate,
      isLoading,
    }),
    [shelters, publishUpdate, isLoading],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
};

export const useAppData = () => {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error('useAppData must be used within an AppDataProvider');
  }
  return context;
};
