type StatCardProps = {
  label: string;
  value: string;
  helper?: string;
};

export const StatCard = ({ label, value, helper }: StatCardProps) => (
  <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-sm">
    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
    <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    {helper ? <p className="mt-1 text-sm text-slate-400">{helper}</p> : null}
  </div>
);
