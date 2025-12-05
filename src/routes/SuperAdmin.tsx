import type { FormEvent } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../components/layout/PageHeader.tsx';
import { useAuth } from '../contexts/AuthContext.tsx';
import { useAppData } from '../contexts/AppDataContext.tsx';
import type { VolunteerAccessRecord } from '../types/index.ts';
import { fetchVolunteerAccessDirectory, saveVolunteerAccess } from '../utilities/authService.ts';

export const SuperAdmin = () => {
  const { user, isAuthLoading, authError, signInSuperAdmin, signOut } = useAuth();
  const { shelters } = useAppData();
  const [directory, setDirectory] = useState<VolunteerAccessRecord[]>([]);
  const [isDirectoryLoading, setIsDirectoryLoading] = useState(false);
  const [formEmail, setFormEmail] = useState('');
  const [selectedShelters, setSelectedShelters] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditingExisting, setIsEditingExisting] = useState(false);

  const shelterNameById = useMemo(
    () => Object.fromEntries(shelters.map((shelter) => [String(shelter.id), shelter.name])),
    [shelters],
  );

  const loadDirectory = useCallback(async () => {
    setIsDirectoryLoading(true);
    setFormError(null);
    try {
      const records = await fetchVolunteerAccessDirectory();
      setDirectory(records.sort((a, b) => a.email.localeCompare(b.email)));
    } catch (error) {
      console.error('Failed to load volunteer directory', error);
      setFormError('Unable to load volunteer access right now.');
    } finally {
      setIsDirectoryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === 'superAdmin') {
      loadDirectory();
    } else {
      setDirectory([]);
    }
  }, [user, loadDirectory]);

  const toggleShelterSelection = (shelterId: string) => {
    setSelectedShelters((previous) =>
      previous.includes(shelterId)
        ? previous.filter((value) => value !== shelterId)
        : [...previous, shelterId],
    );
  };

  const handleEditRecord = (record: VolunteerAccessRecord) => {
    setFormEmail(record.email);
    setSelectedShelters(record.shelterIds.map(String));
    setIsEditingExisting(true);
  };

  const resetForm = () => {
    setFormEmail('');
    setSelectedShelters([]);
    setIsEditingExisting(false);
    setFormError(null);
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || user.role !== 'superAdmin') {
      setFormError('Only Admins can change volunteer access.');
      return;
    }
    const normalizedEmail = formEmail.trim().toLowerCase();
    if (!normalizedEmail) {
      setFormError('Email is required.');
      return;
    }
    setFormError(null);
    setIsSaving(true);

    try {
      const existing = directory.find((entry) => entry.email.toLowerCase() === normalizedEmail);
      const desiredShelterIds =
        isEditingExisting || !existing
          ? selectedShelters
          : Array.from(new Set([...(existing?.shelterIds ?? []), ...selectedShelters]));
      const payload = await saveVolunteerAccess(normalizedEmail, desiredShelterIds, user.email ?? null);
      const savedShelters = Object.keys(payload.shelters ?? {});

      setDirectory((previous) => {
        const filtered = previous.filter((entry) => entry.email.toLowerCase() !== normalizedEmail);
        if (savedShelters.length === 0) return filtered;
        return [
          ...filtered,
          {
            email: normalizedEmail,
            shelterIds: savedShelters,
            updatedAt: payload.updatedAt,
            updatedBy: payload.updatedBy ?? user.email ?? null,
          },
        ].sort((a, b) => a.email.localeCompare(b.email));
      });
      resetForm();
    } catch (error: any) {
      console.error('Unable to save volunteer access', error);
      setFormError(error?.message || 'Unable to save volunteer access.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveAccess = async (email: string) => {
    if (!user || user.role !== 'superAdmin') {
      setFormError('Only Admins can change volunteer access.');
      return;
    }
    setIsSaving(true);
    setFormError(null);
    try {
      await saveVolunteerAccess(email.toLowerCase(), [], user.email ?? null);
      setDirectory((previous) => previous.filter((entry) => entry.email.toLowerCase() !== email.toLowerCase()));
      if (formEmail.toLowerCase() === email.toLowerCase()) {
        resetForm();
      }
    } catch (error: any) {
      console.error('Unable to remove volunteer access', error);
      setFormError(error?.message || 'Unable to remove volunteer access.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isAuthLoading) {
    return <p className="text-slate-300">Checking your admin access.</p>;
  }

  if (!user || user.role !== 'superAdmin') {
    return (
      <div className="space-y-4">
        <PageHeader
          accent="Admin"
          title="Authorize volunteers"
          description="Gate shelter updates by approved Google accounts."
        />
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 text-slate-50">
          <p className="text-sm text-slate-200">
            Only approved Admin emails can manage volunteer assignments. Sign in with Google to continue.
          </p>
          <button
            className="mt-3 inline-flex items-center justify-center rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5 hover:shadow-lg"
            type="button"
            onClick={() => signInSuperAdmin().catch(() => undefined)}
          >
            Sign in as Admin
          </button>
          {authError && <p className="mt-2 text-xs text-red-400">{authError}</p>}
        </div>
      </div>
    );
  }

  const hasShelterOptions = shelters.length > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        accent="Admin"
        title="Authorize volunteers"
        description="Assign shelters to specific Google accounts so only approved volunteers can publish updates."
      />

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">Signed in</p>
          <p className="text-sm text-white">{user.email}</p>
          <p className="text-xs text-slate-400">
            Admins can add or remove volunteer access by email. Updates apply instantly for volunteers.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="rounded-full border border-slate-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            onClick={loadDirectory}
          >
            Refresh access
          </button>
          <button
            type="button"
            className="rounded-full border border-emerald-400/50 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-400 hover:text-slate-950"
            onClick={() => signOut().catch(() => undefined)}
          >
            Sign out
          </button>
        </div>
        {authError && <p className="text-xs text-red-400">{authError}</p>}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <form
          onSubmit={handleSave}
          className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-sm ring-1 ring-transparent transition hover:border-emerald-400/40 hover:ring-emerald-500/20"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">Add or edit volunteer</p>
              <h3 className="text-lg font-semibold text-white">Assign shelters to an email</h3>
              <p className="text-sm text-slate-300">Pick shelters this volunteer can update. Save to overwrite their access.</p>
            </div>
            <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-200">
              {isEditingExisting ? 'Editing existing' : 'New assignment'}
            </span>
          </div>

          <label className="mt-4 block space-y-1 text-sm text-slate-200">
            <span>Volunteer email (Google account)</span>
            <input
              className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-white outline-none ring-emerald-400/30 focus:ring"
              type="email"
              value={formEmail}
              onChange={(event) => setFormEmail(event.target.value)}
              placeholder="volunteer@sheltersync.app"
            />
          </label>

          <div className="mt-4 space-y-2">
            <p className="text-sm font-semibold text-slate-200">Shelter access</p>
            {hasShelterOptions ? (
              <div className="grid gap-2 sm:grid-cols-2">
                {shelters.map((shelter) => (
                  <label key={shelter.id} className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-emerald-400"
                      checked={selectedShelters.includes(String(shelter.id))}
                      onChange={() => toggleShelterSelection(String(shelter.id))}
                    />
                    <span>{shelter.name}</span>
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">No shelters loaded yet. Volunteers need at least one shelter assignment.</p>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="submit"
              className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSaving || (!formEmail.trim() && !selectedShelters.length)}
            >
              {isSaving ? 'Saving access...' : 'Save access'}
            </button>
            <button
              type="button"
              className="rounded-full border border-slate-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              onClick={resetForm}
            >
              Clear form
            </button>
            {formError && <span className="text-xs text-red-400">{formError}</span>}
          </div>
        </form>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">Volunteer directory</p>
              <h3 className="text-lg font-semibold text-white">Who can update?</h3>
            </div>
            {isDirectoryLoading ? (
              <span className="text-xs text-slate-400">Loading...</span>
            ) : (
              <button
                type="button"
                className="rounded-full border border-slate-700 px-3 py-1 text-xs font-semibold text-white transition hover:bg-slate-800"
                onClick={loadDirectory}
              >
                Reload
              </button>
            )}
          </div>

          <div className="mt-3 space-y-3">
            {directory.length === 0 && !isDirectoryLoading ? (
              <p className="text-sm text-slate-300">
                No volunteer access has been configured yet. Add an email and choose shelters to authorize updates.
              </p>
            ) : null}

            {directory.map((record) => {
              const shelterNames =
                record.shelterIds.length === 0
                  ? 'No shelters'
                  : record.shelterIds.map((id) => shelterNameById[id] ?? id).join(', ');
              return (
                <div
                  key={record.email}
                  className="flex flex-col gap-2 rounded-xl border border-slate-800 bg-slate-950/60 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-semibold text-white">{record.email}</p>
                    <p className="text-xs text-slate-300">Access: {shelterNames}</p>
                    <p className="text-[11px] text-slate-500">
                      Updated {record.updatedAt ? new Date(record.updatedAt).toLocaleString() : 'just now'}
                      {record.updatedBy ? ` by ${record.updatedBy}` : ''}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="rounded-full border border-slate-700 px-3 py-1 text-xs font-semibold text-white transition hover:bg-slate-800"
                      onClick={() => handleEditRecord(record)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="rounded-full border border-red-500/60 px-3 py-1 text-xs font-semibold text-red-100 transition hover:bg-red-500 hover:text-slate-950"
                      onClick={() => handleRemoveAccess(record.email)}
                      disabled={isSaving}
                    >
                      Remove access
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
