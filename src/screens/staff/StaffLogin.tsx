import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../data/store';
import { seedStaff, APP_NAME, HOSPITAL_NAME, HOSPITAL_CITY } from '../../data/seed';
import logo from '../../assets/sofscript-logo.png';
import { ShieldCheck, ChevronLeft } from 'lucide-react';

export default function StaffLogin() {
  const store = useStore();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const login = () => {
    const res = store.staffLogin(username.trim(), password);
    if (res.ok) { navigate('/staff/dashboard'); return; }
    setError(res.message);
  };

  return (
    <div className="h-full flex flex-col" style={{ background: 'linear-gradient(160deg,#0f2a4a,#0e7c86)' }}>
      <div className="m-safe-top" />
      <div className="px-5 pt-1">
        <button onClick={() => navigate('/login')} className="flex items-center gap-1 text-[13px] text-white/70 font-semibold m-tap"><ChevronLeft size={16} />Patient Login</button>
      </div>
      <div className="flex-1 overflow-y-auto m-noscroll px-6 pb-8 flex flex-col">
        <div className="text-center text-white pt-6 pb-8">
          <div className="w-16 h-16 rounded-[20px] bg-white mx-auto flex items-center justify-center p-2 mb-4 shadow-lg">
            <img src={logo} alt={APP_NAME} className="w-full h-full object-contain" />
          </div>
          <div className="text-[26px]" style={{ fontFamily: 'var(--font-wordmark)', fontWeight: 700, letterSpacing: '-0.02em' }}>{APP_NAME}</div>
          <div className="text-white/80 text-[14px] mt-1.5">{HOSPITAL_NAME}</div>
          <div className="text-white/60 text-[13px] mt-0.5">{HOSPITAL_CITY} · Staff Portal</div>
        </div>

        <div className="m-card-raised p-5 mt-auto">
          <div className="space-y-3">
            <div className="flex items-center gap-2 m-subhead text-slate-700"><ShieldCheck size={18} strokeWidth={1.9} className="text-[var(--brand-teal)]" /> Staff Login</div>
            <label className="text-[12px] font-semibold text-slate-400">Username</label>
            <input className="m-input" value={username} onChange={e => setUsername(e.target.value)} placeholder="e.g. neha.supervisor" />
            <label className="text-[12px] font-semibold text-slate-400">Password</label>
            <input className="m-input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="any password works in this demo" />
            {error && <div className="text-[12.5px] text-red-600 font-medium">{error}</div>}
            <button className="m-btn-primary mt-1" onClick={login}>Login</button>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100">
            <div className="text-[11px] font-bold text-slate-400 uppercase mb-2">Quick-fill demo accounts</div>
            <div className="flex flex-wrap gap-2">
              {seedStaff.map(s => (
                <button key={s.id} onClick={() => setUsername(s.username)} className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-[11.5px] font-bold text-slate-600 m-tap">
                  {s.name.split(' ')[0]} <span className="text-slate-400 font-medium">({s.role})</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
