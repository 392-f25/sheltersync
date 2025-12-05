import { NavLink } from 'react-router-dom';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-full px-3 py-2 text-sm font-semibold transition hover:bg-slate-800 hover:text-white ${
    isActive ? 'bg-emerald-400 text-slate-950' : 'text-slate-200'
  }`;

export const NavBar = () => (
  <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <div className="space-y-1">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">ShelterSync</p>
      <h1 className="text-2xl font-semibold text-white">Real-time shelter availability</h1>
      <p className="text-sm text-slate-300">Live updates for volunteers and guests in crisis.</p>
    </div>
    <nav className="flex items-center gap-2 rounded-full bg-slate-900/50 p-2 shadow-sm ring-1 ring-slate-800">
      <NavLink to="/guest" className={navLinkClass}>
        Guest Mode
      </NavLink>
      <NavLink to="/volunteer" className={navLinkClass}>
        Volunteer Mode
      </NavLink>
      <NavLink to="/admin" className={navLinkClass}>
        Admin
      </NavLink>
    </nav>
  </header>
);
