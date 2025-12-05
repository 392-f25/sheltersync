import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../components/layout/PageHeader.tsx';
import { StatCard } from '../components/common/StatCard.tsx';
import { ResourceUpdateCard } from '../components/volunteer/ResourceUpdateCard.tsx';
import { UrgentNeedsBoard } from '../components/UrgentNeedsBoard.tsx';
import { StatusBadge } from '../components/common/StatusBadge.tsx';
import { useAppData } from '../contexts/AppDataContext.tsx';
import { useAuth } from '../contexts/AuthContext.tsx';
import type { ShelterUpdatePayload } from '../types/index.ts';

export const VolunteerMode = () => {
  const { shelters, publishUpdate, isLoading } = useAppData();
  const { user, isAuthLoading, authError, signInVolunteer, signOut, canManageShelter } = useAuth();
  const [shelterId, setShelterId] = useState<string | undefined>(undefined);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const accessibleShelters = useMemo(() => {
    if (!user || user.role === 'superAdmin') return shelters;
    if (user.allowedShelterIds.length === 0) return [];
    return shelters.filter((shelter) => user.allowedShelterIds.includes(String(shelter.id)));
  }, [shelters, user]);

  const activeShelter = useMemo(() => {
    if (accessibleShelters.length === 0) return undefined;
    if (!shelterId) return accessibleShelters[0];
    return (
      accessibleShelters.find((shelter) => String(shelter.id) === String(shelterId)) ??
      accessibleShelters[0]
    );
  }, [accessibleShelters, shelterId]);

  useEffect(() => {
    if (accessibleShelters.length === 0) {
      setShelterId(undefined);
      return;
    }
    if (!shelterId) {
      setShelterId(accessibleShelters[0].id);
      return;
    }
    const hasShelter = accessibleShelters.some((shelter) => String(shelter.id) === String(shelterId));
    if (!hasShelter) {
      setShelterId(accessibleShelters[0].id);
    }
  }, [accessibleShelters, shelterId]);

  const handleChange = async (payload: ShelterUpdatePayload) => {
    setUpdateError(null);
    if (!user) {
      setUpdateError('Sign in with Google to publish updates.');
      return;
    }
    if (!canManageShelter(payload.shelterId)) {
      setUpdateError('You are not authorized to update this shelter.');
      return;
    }

    await publishUpdate(payload);
  };

  const handleAuth = async () => {
    try {
      setUpdateError(null);
      if (!user) {
        await signInVolunteer();
      } else {
        await signOut();
      }
    } catch (error) {
      console.error('Unable to toggle volunteer session', error);
    }
  };

  if (!activeShelter && accessibleShelters.length === 0 && user && !isAuthLoading) {
    return (
      <div className="space-y-4">
        <PageHeader
          accent="Volunteer mode"
          title="Update availability in seconds"
          description="Share live bed counts, meals, services, and urgent needs. Updates instantly sync to guests."
        />
        <div className="rounded-2xl border border-amber-500/60 bg-amber-500/10 p-4 text-amber-50">
          You are signed in but have no shelters assigned. An Admin must add your email to a shelter before you can publish updates.
        </div>
      </div>
    );
  }

  if (!activeShelter) {
    return <p className="text-slate-300">Loading shelters.</p>;
  }

  const isAuthorizedForActiveShelter = canManageShelter(activeShelter.id);
  const accessHelper =
    !user || user.role === 'superAdmin'
      ? null
      : user.allowedShelterIds.length === 0
        ? 'No shelters assigned yet. An Admin must grant access.'
        : `Can edit: ${user.allowedShelterIds.join(', ')}`;
  const disabledReason = !user
    ? 'Sign in to publish updates for this shelter.'
    : !isAuthorizedForActiveShelter
      ? 'Your account is not authorized to update this shelter.'
      : undefined;

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
              value={shelterId ?? (accessibleShelters[0]?.id?.toString() ?? '')}
              onChange={(event) => setShelterId(event.target.value)}
            >
              {accessibleShelters.map((shelter) => (
                <option key={shelter.id} value={shelter.id.toString()}>
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
            {user ? 'Sign out' : isAuthLoading ? 'Loading...' : 'Sign in with Google'}
          </button>
          {user ? (
            <div className="space-y-1 text-xs text-emerald-200">
              <p>Signed in as {user.displayName}</p>
              <p className="text-emerald-200/80">
                Role: {user.role === 'superAdmin' ? 'Admin (all shelters)' : 'Volunteer'}
                {accessHelper ? ` - ${accessHelper}` : ''}
              </p>
            </div>
          ) : (
            <p className="text-xs text-slate-400">Authentication protects updates.</p>
          )}
          {(authError || updateError) && (
            <p className="text-xs text-red-400">{authError ?? updateError}</p>
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label="Beds"
          value={isLoading ? '.' : `${activeShelter.availability.bedsAvailable}`}
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
          helper="Make sure today's offerings are current"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ResourceUpdateCard
          shelterId={activeShelter.id}
          resource="beds"
          title="Bed availability"
          helper="Toggle open, limited, or full with current bed count."
          onSubmit={handleChange}
          isDisabled={!user || !isAuthorizedForActiveShelter}
          disabledReason={disabledReason}
          initialBedsAvailable={activeShelter.availability.bedsAvailable}
          initialStatus={activeShelter.availability.status}
        />
        <ResourceUpdateCard
          shelterId={activeShelter.id}
          resource="meals"
          title="Meal announcements"
          helper="Share when meals start and end or when supplies run low."
          onSubmit={handleChange}
          isDisabled={!user || !isAuthorizedForActiveShelter}
          disabledReason={disabledReason}
          initialMealNote={activeShelter.availability.meals}
        />
        <ResourceUpdateCard
          shelterId={activeShelter.id}
          resource="services"
          title="Services"
          helper="Update available services: showers, medical van, casework hours."
          onSubmit={handleChange}
          isDisabled={!user || !isAuthorizedForActiveShelter}
          disabledReason={disabledReason}
          initialServices={activeShelter.availability.services.join(', ')}
        />
        <ResourceUpdateCard
          shelterId={activeShelter.id}
          resource="urgentNeeds"
          title="Urgent needs"
          helper="Request donations like blankets, socks, or hygiene kits."
          onSubmit={handleChange}
          isDisabled={!user || !isAuthorizedForActiveShelter}
          disabledReason={disabledReason}
          initialUrgentNeeds={activeShelter.availability.urgentNeeds.join(', ')}
        />
      </div>

      <UrgentNeedsBoard shelters={shelters} />
    </div>
  );
};
