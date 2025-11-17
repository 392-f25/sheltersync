import type { Shelter } from '../../types/index.ts';
import { StatusBadge } from '../common/StatusBadge.tsx';

type MapPreviewProps = {
  shelters: Shelter[];
  highlightedId?: string;
  onSelect?: (shelterId: string) => void;
};

export const MapPreview = ({ shelters, highlightedId, onSelect }: MapPreviewProps) => (
  <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-4 shadow-inner">
    <div className="mb-3 flex items-center justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">Map-first view</p>
        <p className="text-sm text-slate-300">Mapbox/Google Maps slot for live shelter pins.</p>
      </div>
      <div className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-200">Live updating</div>
    </div>
    <div className="grid gap-2 sm:grid-cols-2">
      {shelters.map((shelter) => (
        <button
          key={shelter.id}
          type="button"
          className={`flex items-center justify-between rounded-xl border px-3 py-2 text-left transition hover:border-emerald-400/60 hover:bg-slate-900/80 ${
            highlightedId === shelter.id ? 'border-emerald-400/60 bg-slate-900/70' : 'border-slate-800 bg-slate-900/50'
          }`}
          onClick={() => onSelect?.(shelter.id)}
        >
          <div>
            <p className="text-sm font-semibold text-white">{shelter.name}</p>
            <p className="text-xs text-slate-300">{shelter.distanceMiles.toFixed(1)} miles</p>
          </div>
          <StatusBadge status={shelter.availability.status} />
        </button>
      ))}
    </div>
    <p className="mt-4 text-xs text-slate-400">
      Tap a shelter to focus. Replace this block with a Mapbox or Google Maps component wired to shelter coordinates and directions.
    </p>
  </div>
);
