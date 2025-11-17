import type { PropsWithChildren } from 'react';
import { NavBar } from '../navigation/NavBar.tsx';

export const AppShell = ({ children }: PropsWithChildren) => (
  <div className="min-h-screen bg-slate-950 text-slate-50">
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <NavBar />
      {children}
    </div>
  </div>
);
