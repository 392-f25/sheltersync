import { Link } from 'react-router-dom';

export const NotFound = () => (
  <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center shadow-lg">
    <p className="text-sm font-semibold text-emerald-400">Oops</p>
    <h2 className="mt-2 text-2xl font-semibold text-white">Page not found</h2>
    <p className="mt-2 text-sm text-slate-300">Pick a mode to continue.</p>
    <div className="mt-6 flex justify-center gap-3">
      <Link className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950" to="/guest">
        Go to Guest Mode
      </Link>
      <Link className="rounded-full border border-slate-700 px-4 py-2 text-sm font-semibold text-white" to="/volunteer">
        Go to Volunteer Mode
      </Link>
    </div>
  </div>
);
