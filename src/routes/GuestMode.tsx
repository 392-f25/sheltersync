import { useMemo, useState } from 'react';
import { PageHeader } from '../components/layout/PageHeader.tsx';
import { MapPreview } from '../components/guest/MapPreview.tsx';
import { ShelterList } from '../components/guest/ShelterList.tsx';
import { StatCard } from '../components/common/StatCard.tsx';
import { UrgentNeedsBoard } from '../components/UrgentNeedsBoard.tsx';
import { useAppData } from '../contexts/AppDataContext.tsx';

export const GuestMode = () => {
  const { shelters, isLoading } = useAppData();
  const [focusedId, setFocusedId] = useState<string | undefined>(undefined);

  const summary = useMemo(() => {
    const open = shelters.filter((shelter) => shelter.availability.status === 'open').length;
    const limited = shelters.filter((shelter) => shelter.availability.status === 'limited').length;
    const beds = shelters.reduce((total, shelter) => total + shelter.availability.bedsAvailable, 0);
    return { open, limited, beds };
  }, [shelters]);

  return (
    <div className="space-y-6">
      <PageHeader
        accent="Guest mode"
        title="Find nearby shelters immediately"
        description="Map-first experience with live bed counts, meals, and services. Tap a shelter for details and walking directions."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Open shelters" value={isLoading ? '…' : summary.open.toString()} helper="Color coded availability" />
        <StatCard label="Limited availability" value={isLoading ? '…' : summary.limited.toString()} helper="Arrive quickly to secure a bed" />
        <StatCard label="Total open beds" value={isLoading ? '…' : summary.beds.toString()} helper="Syncs with volunteer updates" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <ShelterList shelters={shelters} focusedId={focusedId} onSelect={setFocusedId} />
        <MapPreview shelters={shelters} highlightedId={focusedId} onSelect={setFocusedId} />
      </div>

      <UrgentNeedsBoard shelters={shelters} />
    </div>
  );
};
