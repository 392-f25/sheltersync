import { useMemo, useState } from 'react';
import { PageHeader } from '../components/layout/PageHeader.tsx';
import { MapPreview } from '../components/guest/MapPreview.tsx';
import { ShelterList } from '../components/guest/ShelterList.tsx';
import { StatCard } from '../components/common/StatCard.tsx';
import { UrgentNeedsBoard } from '../components/UrgentNeedsBoard.tsx';
import { useAppData } from '../contexts/AppDataContext.tsx';
import { fetchSheltersByCityState } from '../api/homelessShelters.tsx';

export const GuestMode = () => {
  const { shelters, isLoading } = useAppData();
  const [focusedId, setFocusedId] = useState<string | undefined>(undefined);

  const summary = useMemo(() => {
    const open = shelters.filter((shelter) => shelter.availability.status === 'open').length;
    const limited = shelters.filter((shelter) => shelter.availability.status === 'limited').length;
    const beds = shelters.reduce((total, shelter) => total + shelter.availability.bedsAvailable, 0);
    return { open, limited, beds };
  }, [shelters]);

  // Search state
  const [city, setCity] = useState('');
  const [stateCode, setStateCode] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!city || !stateCode) return setSearchError('Please enter both city and state');
    setSearching(true);
    setSearchError(null);
    try {
      const results = await fetchSheltersByCityState(city.trim(), stateCode.trim());
      // Replace the displayed shelters with the search results by publishing to context is complex;
      // simpler: locally show results while preserving the global list. We'll use a local overlay.
      setSearchResults(results);
    } catch (err: any) {
      setSearchError(err?.message || 'Search failed');
    } finally {
      setSearching(false);
    }
  };

  const [searchResults, setSearchResults] = useState<typeof shelters>([]);

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

      <form className="flex gap-2" onSubmit={handleSearch}>
        <input
          className="w-1/2 rounded-md border px-3 py-2 bg-slate-900 text-sm text-slate-100"
          placeholder="City (e.g. Chicago)"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />
        <input
          className="w-1/4 rounded-md border px-3 py-2 bg-slate-900 text-sm text-slate-100"
          placeholder="State (e.g. IL)"
          value={stateCode}
          onChange={(e) => setStateCode(e.target.value)}
        />
        <button
          className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950"
          type="submit"
          disabled={searching}
        >
          {searching ? 'Searching…' : 'Search'}
        </button>
        <button
          type="button"
          className="rounded-full border border-slate-700 px-4 py-2 text-sm font-semibold text-white"
          onClick={() => setSearchResults([])}
        >
          Clear
        </button>
      </form>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <ShelterList shelters={searchResults.length ? searchResults : shelters} focusedId={focusedId} onSelect={setFocusedId} />
        <MapPreview shelters={searchResults.length ? searchResults : shelters} highlightedId={focusedId} onSelect={setFocusedId} />
      </div>

      {searchError && <div className="text-sm text-red-400">{searchError}</div>}

      <UrgentNeedsBoard shelters={shelters} />
    </div>
  );
};
