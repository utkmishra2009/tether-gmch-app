import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { StoreProvider, useStore } from './data/store';
import { APP_NAME } from './data/seed';
import TetherLogo from './components/TetherLogo';
import Shell from './components/Shell';
import Login from './screens/Login';
import Home from './screens/Home';
import Appointments from './screens/Appointments';
import Book from './screens/Book';
import Privacy from './screens/Privacy';
import Health from './screens/Health';
import Care from './screens/Care';
import Profile from './screens/Profile';
import Records from './screens/Records';
import MedicalId from './screens/MedicalId';
import CampsOffers from './screens/CampsOffers';
import StaffLogin from './screens/staff/StaffLogin';
import StaffDashboard from './screens/staff/StaffDashboard';
import StaffAdminMasters from './screens/staff/StaffAdminMasters';
import StaffContentConsole from './screens/staff/StaffContentConsole';

function Splash() {
  return (
    <div className="h-full flex flex-col items-center justify-center" style={{ background: 'linear-gradient(160deg,#0f2a4a,#0e7c86)' }}>
      <div className="m-pop">
        <TetherLogo size={88} />
      </div>
      <div className="mt-4 text-white" style={{ fontFamily: 'var(--font-wordmark)', fontWeight: 700, fontSize: 26, letterSpacing: '-0.02em' }}>{APP_NAME}</div>
      <div className="mt-5 w-6 h-6 rounded-full border-2 border-white/30 border-t-white m-spin" />
    </div>
  );
}

function OfflineBanner() {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);
  if (online) return null;
  return <div className="m-offline-banner shrink-0">You're offline — showing cached data</div>;
}

function Tabbed({ children }: { children: React.ReactNode }) {
  const store = useStore();
  if (!store.currentPatientUhid) return <Navigate to="/login" replace />;
  return <Shell>{children}</Shell>;
}

function FullScreen({ children }: { children: React.ReactNode }) {
  const store = useStore();
  if (!store.currentPatientUhid) return <Navigate to="/login" replace />;
  return <div className="flex flex-col h-full px-4"><div className="m-safe-top shrink-0" />{children}</div>;
}

function StaffGuard({ children }: { children: React.ReactNode }) {
  const store = useStore();
  if (!store.currentStaffId) return <Navigate to="/staff/login" replace />;
  return <div className="flex flex-col h-full">{children}</div>;
}

function Root() {
  const store = useStore();
  return <Navigate to={store.currentPatientUhid ? '/home' : '/login'} replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Root />} />
      <Route path="/login" element={<Login />} />
      <Route path="/home" element={<Tabbed><Home /></Tabbed>} />
      <Route path="/appointments" element={<Tabbed><Appointments /></Tabbed>} />
      <Route path="/appointments/book" element={<FullScreen><Book /></FullScreen>} />
      <Route path="/health" element={<Tabbed><Health /></Tabbed>} />
      <Route path="/care" element={<Tabbed><Care /></Tabbed>} />
      <Route path="/profile" element={<Tabbed><Profile /></Tabbed>} />
      <Route path="/records" element={<FullScreen><Records /></FullScreen>} />
      <Route path="/privacy" element={<FullScreen><Privacy /></FullScreen>} />
      <Route path="/medical-id" element={<FullScreen><MedicalId /></FullScreen>} />
      <Route path="/camps" element={<Tabbed><CampsOffers /></Tabbed>} />
      <Route path="/staff/login" element={<StaffLogin />} />
      <Route path="/staff/dashboard" element={<StaffGuard><StaffDashboard /></StaffGuard>} />
      <Route path="/staff/masters" element={<StaffGuard><StaffAdminMasters /></StaffGuard>} />
      <Route path="/staff/content" element={<StaffGuard><StaffContentConsole /></StaffGuard>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  const [booting, setBooting] = useState(true);
  useEffect(() => { document.title = APP_NAME; const t = setTimeout(() => setBooting(false), 650); return () => clearTimeout(t); }, []);

  return (
    <StoreProvider>
      <div className="m-viewport-wrap">
        <div className="m-viewport">
          <OfflineBanner />
          {booting ? <Splash /> : <AppRoutes />}
        </div>
      </div>
    </StoreProvider>
  );
}
