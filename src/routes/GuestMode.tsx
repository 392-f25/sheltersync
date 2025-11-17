import { useEffect, useMemo, useRef, useState } from 'react';
import { PageHeader } from '../components/layout/PageHeader.tsx';
import { MapPreview } from '../components/guest/MapPreview.tsx';
import { ShelterList } from '../components/guest/ShelterList.tsx';
import { StatCard } from '../components/common/StatCard.tsx';
import { UrgentNeedsBoard } from '../components/UrgentNeedsBoard.tsx';
import { useAppData } from '../contexts/AppDataContext.tsx';
import { fetchSheltersByCityState } from '../api/homelessShelters.tsx';
import { useUserLocation } from '../hooks/useUserLocation.ts';
import { reverseGeocodeCityState } from '../utilities/locationService.ts';

export const GuestMode = () => {
  const { shelters, isLoading, replaceShelters, reloadShelters } = useAppData();
  const [focusedId, setFocusedId] = useState<string | undefined>(undefined);
  const { location: liveLocation, error: locationError } = useUserLocation();
  const [geoStatus, setGeoStatus] = useState<'idle' | 'locating' | 'located' | 'error'>('idle');
  const [geoError, setGeoError] = useState<string | null>(null);
  const locationSearchDone = useRef(false);

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

  const normalizeState = (input: string) => {
    const trimmed = input.trim();
    if (trimmed.length === 2) return trimmed.toUpperCase();
    const map: Record<string, string> = {
      alabama: 'AL',
      alaska: 'AK',
      arizona: 'AZ',
      arkansas: 'AR',
      california: 'CA',
      colorado: 'CO',
      connecticut: 'CT',
      delaware: 'DE',
      florida: 'FL',
      georgia: 'GA',
      hawaii: 'HI',
      idaho: 'ID',
      illinois: 'IL',
      indiana: 'IN',
      iowa: 'IA',
      kansas: 'KS',
      kentucky: 'KY',
      louisiana: 'LA',
      maine: 'ME',
      maryland: 'MD',
      massachusetts: 'MA',
      michigan: 'MI',
      minnesota: 'MN',
      mississippi: 'MS',
      missouri: 'MO',
      montana: 'MT',
      nebraska: 'NE',
      nevada: 'NV',
      'new hampshire': 'NH',
      'new jersey': 'NJ',
      'new mexico': 'NM',
      'new york': 'NY',
      'north carolina': 'NC',
      'north dakota': 'ND',
      ohio: 'OH',
      oklahoma: 'OK',
      oregon: 'OR',
      pennsylvania: 'PA',
      'rhode island': 'RI',
      'south carolina': 'SC',
      'south dakota': 'SD',
      tennessee: 'TN',
      texas: 'TX',
      utah: 'UT',
      vermont: 'VT',
      virginia: 'VA',
      washington: 'WA',
      'west virginia': 'WV',
      wisconsin: 'WI',
      wyoming: 'WY',
    };
    const key = trimmed.toLowerCase();
    return map[key] || trimmed.toUpperCase();
  };

  const performSearch = async (targetCity: string, targetState: string) => {
    if (!targetCity || !targetState) {
      setSearchError('Please enter both city and state');
      return;
    }
    const normalizedState = normalizeState(targetState);
    setSearching(true);
    setSearchError(null);
    try {
      const results = await fetchSheltersByCityState(targetCity.trim(), normalizedState);
      // Replace the global shelters so VolunteerMode and other areas reflect the search results
      replaceShelters(results);
    } catch (err: any) {
      setSearchError(err?.message || 'Search failed');
    } finally {
      setSearching(false);
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    await performSearch(city, stateCode);
  };

  useEffect(() => {
    if (locationError) {
      setGeoStatus('error');
      setGeoError(locationError);
    }
  }, [locationError]);

  useEffect(() => {
    if (!liveLocation || locationSearchDone.current) {
      return;
    }

    const detectAndSearch = async () => {
      setGeoStatus('locating');
      try {
        const { city: detectedCity, state } = await reverseGeocodeCityState({
          lat: liveLocation.latitude,
          lng: liveLocation.longitude,
        });
        if (detectedCity && state) {
          setCity(detectedCity);
          setStateCode(state);
          await performSearch(detectedCity, state);
          setGeoStatus('located');
          locationSearchDone.current = true;
          return;
        }
        setGeoStatus('error');
        setGeoError('Unable to determine city/state from your location.');
      } catch (error: any) {
        setGeoStatus('error');
        setGeoError(error?.message || 'Unable to detect your location.');
      }
    };

    detectAndSearch();
  }, [liveLocation]);

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
          onClick={() => reloadShelters()}
        >
          Clear
        </button>
      </form>

      {geoStatus === 'locating' && <p className="text-sm text-slate-300">Detecting your location…</p>}
      {geoError && <div className="text-sm text-red-400">{geoError}</div>}

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <ShelterList shelters={shelters} focusedId={focusedId} onSelect={setFocusedId} />
        <MapPreview shelters={shelters} highlightedId={focusedId} onSelect={setFocusedId} />
      </div>

      {searchError && <div className="text-sm text-red-400">{searchError}</div>}

      <UrgentNeedsBoard shelters={shelters} />
    </div>
  );
};
