import type { Shelter } from '../types/index.ts';

type UrgentNeedsBoardProps = {
  shelters: Shelter[];
};

const aggregateNeeds = (shelters: Shelter[]) => {
  const tally = new Map<string, number>();
  shelters.forEach((shelter) => {
    shelter.availability.urgentNeeds.forEach((need) => {
      tally.set(need, (tally.get(need) ?? 0) + 1);
    });
  });
  return Array.from(tally.entries()).map(([label, count]) => ({ label, count }));
};

export const UrgentNeedsBoard = ({ shelters }: UrgentNeedsBoardProps) => {
  const needs = aggregateNeeds(shelters);

  return (
    <section className="rounded-2xl border border-amber-400/40 bg-amber-500/10 p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">Urgent needs</p>
          <p className="text-sm text-amber-100">Support volunteers with immediate supply requests.</p>
        </div>
        <span className="rounded-full bg-amber-400/30 px-3 py-1 text-xs font-semibold text-amber-900">
          {needs.length} items
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {needs.length === 0 ? (
          <p className="text-sm text-amber-50">No urgent needs listed right now.</p>
        ) : (
          needs.map((need) => (
            <span
              key={need.label}
              className="inline-flex items-center gap-2 rounded-full bg-amber-400/20 px-3 py-1 text-xs font-semibold text-amber-50 ring-1 ring-amber-300/50"
            >
              {need.label}
              <span className="rounded-full bg-amber-300 px-2 py-0.5 text-[11px] text-amber-900">{need.count}</span>
            </span>
          ))
        )}
      </div>
    </section>
  );
};
