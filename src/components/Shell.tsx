import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, CalendarHeart, HeartPulse, MessagesSquare, UserRound, Gift } from 'lucide-react';
import { APP_NAME } from '../data/seed';
import logo from '../assets/sofscript-logo.png';

const TABS = [
  { to: '/home', label: 'Home', icon: Home },
  { to: '/appointments', label: 'Visits', icon: CalendarHeart },
  { to: '/health', label: 'Health', icon: HeartPulse },
  { to: '/camps', label: 'Discover', icon: Gift },
  { to: '/care', label: 'Care', icon: MessagesSquare },
  { to: '/profile', label: 'Profile', icon: UserRound },
];

export function TabBar() {
  return (
    <nav className="m-tabbar-glass m-safe-bottom absolute bottom-0 inset-x-0 z-20 flex px-1 pt-1.5">
      {TABS.map(t => (
        <NavLink key={t.to} to={t.to} className={({ isActive }) => `m-tabbar-item m-tap ${isActive ? 'text-[var(--brand-teal)]' : 'text-slate-400'}`}>
          {({ isActive }) => (
            <>
              <span key={String(isActive)} className={isActive ? 'm-tab-pop' : ''} style={{ display: 'inline-flex' }}><t.icon size={24} strokeWidth={isActive ? 2 : 1.7} fill={isActive ? 'currentColor' : 'none'} fillOpacity={isActive ? 0.2 : 0} /></span>
              <span className="text-[10.5px] font-semibold leading-[1.05] text-center w-full px-0.5">{t.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

export function ScreenHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: React.ReactNode }) {
  return (
    <div className="px-5 pt-1 pb-3 flex items-center justify-between shrink-0">
      <div>
        <div className="m-display text-slate-800 leading-tight">{title}</div>
        {subtitle && <div className="m-caption text-slate-400 mt-1.5">{subtitle}</div>}
      </div>
      {right}
    </div>
  );
}

function BrandStrip() {
  return (
    <div className="flex items-center gap-1.5 px-4 pt-1.5 pb-0.5 shrink-0">
      <div className="w-4.5 h-4.5 rounded-md bg-white flex items-center justify-center overflow-hidden" style={{ width: 18, height: 18 }}>
        <img src={logo} alt={APP_NAME} className="w-full h-full object-contain" />
      </div>
      <span className="text-[10.5px] font-extrabold text-slate-400 tracking-wide">{APP_NAME}</span>
    </div>
  );
}

export default function Shell({ children }: { children: React.ReactNode }) {
  const loc = useLocation();
  return (
    <div className="flex flex-col h-full relative">
      <div className="m-safe-top shrink-0" />
      <BrandStrip />
      <div key={loc.pathname} className="flex-1 overflow-y-auto m-screen-enter px-4" style={{ paddingBottom: 'calc(78px + env(safe-area-inset-bottom))' }}>
        {children}
      </div>
      <TabBar />
    </div>
  );
}
