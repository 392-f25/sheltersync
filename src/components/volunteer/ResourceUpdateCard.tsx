import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import type { AvailabilityStatus, ResourceCategory, ShelterUpdatePayload } from '../../types/index.ts';

type ResourceUpdateCardProps = {
  shelterId: string;
  resource: ResourceCategory;
  title: string;
  helper: string;
  onSubmit: (payload: ShelterUpdatePayload) => Promise<void>;
  isDisabled?: boolean;
  disabledReason?: string;
  /** Optional initial values so the form reflects the selected shelter instead of hard defaults */
  initialBedsAvailable?: number;
  initialStatus?: AvailabilityStatus;
  initialMealNote?: string;
  initialServices?: string;
  initialUrgentNeeds?: string;
};

const statusOptions: AvailabilityStatus[] = ['open', 'limited', 'full'];

export const ResourceUpdateCard = ({
  shelterId,
  resource,
  title,
  helper,
  onSubmit,
  isDisabled = false,
  disabledReason,
  initialBedsAvailable,
  initialStatus,
  initialMealNote,
  initialServices,
  initialUrgentNeeds,
}: ResourceUpdateCardProps) => {
  const [bedsAvailable, setBedsAvailable] = useState<number>(initialBedsAvailable ?? 5);
  const [status, setStatus] = useState<AvailabilityStatus>(initialStatus ?? 'open');
  const [mealNote, setMealNote] = useState<string>(initialMealNote ?? 'Dinner served until 8 PM.');
  const [services, setServices] = useState<string>(initialServices ?? 'Showers, Casework, Charging');
  const [urgentNeeds, setUrgentNeeds] = useState<string>(initialUrgentNeeds ?? 'Blankets, Socks');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const reset = () => {
    setBedsAvailable(initialBedsAvailable ?? 5);
    setStatus(initialStatus ?? 'open');
    setMealNote(initialMealNote ?? '');
    setServices(initialServices ?? '');
    setUrgentNeeds(initialUrgentNeeds ?? '');
  };

  // When the selected shelter changes, update form fields to reflect its current values.
  useEffect(() => {
    setBedsAvailable(initialBedsAvailable ?? 5);
    setStatus(initialStatus ?? 'open');
    setMealNote(initialMealNote ?? '');
    setServices(initialServices ?? '');
    setUrgentNeeds(initialUrgentNeeds ?? '');
  }, [shelterId, initialBedsAvailable, initialStatus, initialMealNote, initialServices, initialUrgentNeeds]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    const payload: ShelterUpdatePayload = { shelterId, resource };

    if (resource === 'beds') {
      payload.bedsAvailable = bedsAvailable;
      payload.status = status;
    }
    if (resource === 'meals') {
      payload.mealNote = mealNote;
    }
    if (resource === 'services') {
      payload.services = services
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    }
    if (resource === 'urgentNeeds') {
      payload.urgentNeeds = urgentNeeds
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    }

    try {
      await onSubmit(payload);
      reset();
    } catch (error) {
      console.error('Failed to publish update', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-sm ring-1 ring-transparent transition hover:border-emerald-400/40 hover:ring-emerald-500/20"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">{resource}</p>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <p className="text-sm text-slate-300">{helper}</p>
        </div>
        {resource === 'beds' ? (
          <span className="rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-semibold text-emerald-100 ring-1 ring-emerald-400/60">
            Instant sync
          </span>
        ) : null}
      </div>

      {resource === 'beds' ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-sm text-slate-200">
            <span>Open beds</span>
            <input
              className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-white outline-none ring-emerald-400/30 focus:ring"
              type="number"
              min={0}
              value={bedsAvailable}
              onChange={(event) => setBedsAvailable(Number(event.target.value))}
              disabled={isDisabled}
            />
          </label>
          <label className="space-y-1 text-sm text-slate-200">
            <span>Status</span>
            <select
              className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-white outline-none ring-emerald-400/30 focus:ring"
              value={status}
              onChange={(event) => setStatus(event.target.value as AvailabilityStatus)}
              disabled={isDisabled}
            >
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>
      ) : null}

      {resource === 'meals' ? (
        <label className="mt-4 block space-y-1 text-sm text-slate-200">
          <span>Meal details</span>
          <textarea
            className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-white outline-none ring-emerald-400/30 focus:ring"
            rows={3}
            value={mealNote}
            onChange={(event) => setMealNote(event.target.value)}
            placeholder="Dinner served until 8 PM."
            disabled={isDisabled}
          />
        </label>
      ) : null}

      {resource === 'services' ? (
        <label className="mt-4 block space-y-1 text-sm text-slate-200">
          <span>Services (comma separated)</span>
          <input
            className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-white outline-none ring-emerald-400/30 focus:ring"
            value={services}
            onChange={(event) => setServices(event.target.value)}
            placeholder="Showers, Nurse visit, Casework"
            disabled={isDisabled}
          />
        </label>
      ) : null}

      {resource === 'urgentNeeds' ? (
        <label className="mt-4 block space-y-1 text-sm text-slate-200">
          <span>Urgent needs (comma separated)</span>
          <input
            className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-white outline-none ring-emerald-400/30 focus:ring"
            value={urgentNeeds}
            onChange={(event) => setUrgentNeeds(event.target.value)}
            placeholder="Blankets, Socks, Hygiene kits"
            disabled={isDisabled}
          />
        </label>
      ) : null}

      <div className="mt-4 flex items-center justify-between">
        <p className="text-xs text-slate-400">
          {isDisabled
            ? disabledReason || 'Sign in to publish updates for this shelter.'
            : 'Changes sync to guests immediately.'}
        </p>
        <button
          type="submit"
          className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSubmitting || isDisabled}
        >
          {isSubmitting ? 'Updating.' : 'Update'}
        </button>
      </div>
    </form>
  );
};
