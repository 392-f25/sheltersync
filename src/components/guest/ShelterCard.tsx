import type { Shelter } from '../../types/index.ts';
import { buildDirectionsUrl } from '../../utilities/navigation.ts';
import { StatusBadge } from '../common/StatusBadge.tsx';

type ShelterCardProps = {
  shelter: Shelter;
  isFocused?: boolean;
  onSelect?: (shelterId: string) => void;
};

export const ShelterCard = ({ shelter, isFocused = false, onSelect }: ShelterCardProps) => (
  <article
    className={`rounded-2xl border p-4 transition hover:border-emerald-400/60 hover:bg-slate-900/80 ${
      isFocused ? 'border-emerald-400/60 bg-slate-900/70' : 'border-slate-800 bg-slate-900/40'
    }`}
    onMouseEnter={() => onSelect?.(shelter.id)}
  >
    <div className="flex items-start justify-between gap-3">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-white">{shelter.name}</h3>
        <p className="text-sm text-slate-300">{shelter.location.address}</p>
        <p className="text-xs text-slate-400">{shelter.distanceMiles.toFixed(1)} miles away</p>
      </div>
      <StatusBadge status={shelter.availability.status} />
    </div>

    <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-200">
      <span className="rounded-full bg-slate-800 px-3 py-1 font-semibold">{shelter.availability.bedsAvailable} beds</span>
      <span className="rounded-full bg-slate-800 px-3 py-1">Meals: {shelter.availability.meals}</span>
    </div>

    <div className="mt-3 text-sm text-slate-300">
      <p className="font-semibold text-slate-200">Services</p>
      <p>{shelter.availability.services.join(', ')}</p>
    </div>

    <div className="mt-3 text-sm text-slate-300">
      <p className="font-semibold text-slate-200">Urgent needs</p>
      <p>{shelter.availability.urgentNeeds.join(', ') || 'None listed'}</p>
    </div>

    <div className="mt-4 flex flex-wrap gap-3">
      <a
        className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5 hover:shadow-lg"
        href={buildDirectionsUrl(shelter.location)}
        target="_blank"
        rel="noreferrer"
      >
        Directions
      </a>
    </div>
  </article>
);
