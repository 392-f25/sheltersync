import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../components/layout/PageHeader.tsx';
import { StatCard } from '../components/common/StatCard.tsx';
import { ResourceUpdateCard } from '../components/volunteer/ResourceUpdateCard.tsx';
import { UrgentNeedsBoard } from '../components/UrgentNeedsBoard.tsx';
import { StatusBadge } from '../components/common/StatusBadge.tsx';
import { useAppData } from '../contexts/AppDataContext.tsx';
import type { ShelterUpdatePayload, VolunteerUser } from '../types/index.ts';
import { signInVolunteer, signOutVolunteer } from '../utilities/authService.ts';

export const VolunteerMode = () => {
  const { shelters, publishUpdate, isLoading } = useAppData();
  const [shelterId, setShelterId] = useState<string | undefined>(undefined);
  const [volunteer, setVolunteer] = useState<VolunteerUser | null>(null);

  const activeShelter = useMemo(
    () => shelters.find((shelter) => shelter.id === shelterId) ?? shelters[0],
    [shelterId, shelters],
  );

  useEffect(() => {
    if (!shelterId && shelters.length > 0) {
      setShelterId(shelters[0].id);
    }
  }, [shelters, shelterId]);

  const handleChange = async (payload: ShelterUpdatePayload) => {
    await publishUpdate(payload);
  };

  const handleAuth = async () => {
    try {
      if (!volunteer) {
        const user = await signInVolunteer();
        setVolunteer(user);
      } else {
        await signOutVolunteer();
        setVolunteer(null);
      }
    } catch (error) {
      console.error('Unable to toggle volunteer session', error);
    }
  };

  if (!activeShelter) {
    return <p className="text-slate-300">Loading shelters…</p>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        accent="Volunteer mode"
        title="Update availability in seconds"
        description="Share live bed counts, meals, services, and urgent needs. Updates instantly sync to guests."
      />

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">Active shelter</p>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-white">
            <h3 className="text-xl font-semibold">{activeShelter.name}</h3>
            <StatusBadge status={activeShelter.availability.status} />
            <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-200">
              {activeShelter.availability.bedsAvailable} beds
            </span>
          </div>
          <p className="text-sm text-slate-300">{activeShelter.location.address}</p>
        </div>
        <div className="flex flex-col gap-3 sm:items-end">
          <label className="text-sm text-slate-200">
            Switch shelter
            <select
              className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-white outline-none ring-emerald-400/30 focus:ring sm:w-72"
              value={activeShelter.id}
              onChange={(event) => setShelterId(event.target.value)}
            >
              {shelters.map((shelter) => (
                <option key={shelter.id} value={shelter.id}>
                  {shelter.name}
                </option>
              ))}
            </select>
          </label>
          <button
            className="inline-flex items-center justify-center gap-2 rounded-full border border-emerald-400/50 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-400 hover:text-slate-950"
            type="button"
            onClick={handleAuth}
          >
            {volunteer ? 'Sign out volunteer' : 'Sign in with Google'}
          </button>
          {volunteer ? (
            <p className="text-xs text-emerald-200">Signed in as {volunteer.displayName}</p>
          ) : (
            <p className="text-xs text-slate-400">Authentication protects updates.</p>
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label="Beds"
          value={isLoading ? '…' : `${activeShelter.availability.bedsAvailable}`}
          helper={activeShelter.availability.status === 'full' ? 'At capacity' : 'Update when beds change'}
        />
        <StatCard
          label="Last updated"
          value={new Date(activeShelter.availability.lastUpdated).toLocaleTimeString()}
          helper="Syncs to guest map"
        />
        <StatCard
          label="Services"
          value={`${activeShelter.availability.services.length}`}
          helper="Make sure today’s offerings are current"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ResourceUpdateCard
          shelterId={activeShelter.id}
          resource="beds"
          title="Bed availability"
          helper="Toggle open, limited, or full with current bed count."
          onSubmit={handleChange}
          isDisabled={!volunteer}
        />
        <ResourceUpdateCard
          shelterId={activeShelter.id}
          resource="meals"
          title="Meal announcements"
          helper="Share when meals start and end or when supplies run low."
          onSubmit={handleChange}
          isDisabled={!volunteer}
        />
        <ResourceUpdateCard
          shelterId={activeShelter.id}
          resource="services"
          title="Services"
          helper="Update available services: showers, medical van, casework hours."
          onSubmit={handleChange}
          isDisabled={!volunteer}
        />
        <ResourceUpdateCard
          shelterId={activeShelter.id}
          resource="urgentNeeds"
          title="Urgent needs"
          helper="Request donations like blankets, socks, or hygiene kits."
          onSubmit={handleChange}
          isDisabled={!volunteer}
        />
      </div>

      <UrgentNeedsBoard shelters={shelters} />
    </div>
  );
};
