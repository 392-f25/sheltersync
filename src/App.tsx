import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.tsx';
import { AppDataProvider } from './contexts/AppDataContext.tsx';
import { AppShell } from './components/layout/AppShell.tsx';
import { GuestMode } from './routes/GuestMode.tsx';
import { VolunteerMode } from './routes/VolunteerMode.tsx';
import { SuperAdmin } from './routes/SuperAdmin.tsx';
import { NotFound } from './components/NotFound.tsx';

export const App = () => (
  <AuthProvider>
    <AppDataProvider>
      <BrowserRouter>
        <AppShell>
          <Routes>
          <Route path="/" element={<Navigate to="/guest" replace />} />
          <Route path="/guest" element={<GuestMode />} />
          <Route path="/volunteer" element={<VolunteerMode />} />
          <Route path="/admin" element={<SuperAdmin />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        </AppShell>
      </BrowserRouter>
    </AppDataProvider>
  </AuthProvider>
);
