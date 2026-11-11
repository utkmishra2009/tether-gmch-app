import LiveBackdrop from '../components/LiveBackdrop';
import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../data/store';
import { APP_NAME, HOSPITAL_NAME, HOSPITAL_CITY, HOSPITAL_ADDRESS, HOSPITAL_TIMINGS } from '../data/seed';
import TetherLogo from '../components/TetherLogo';
import sofscriptLogo from '../assets/sofscript-logo.png';
import type { Patient, ConsentPurpose } from '../data/types';
import Sheet from '../components/Sheet';
import NoticeSheet from '../components/NoticeSheet';
import { PURPOSES, type CopyPurpose } from '../data/consentCopy';
import { Phone, ShieldCheck, ChevronLeft, MapPin, Clock, Navigation, ArrowRight, RotateCcw, ChevronRight, UserPlus, AlertTriangle, Building2 } from 'lucide-react';

const OPTIONAL: CopyPurpose[] = ['reminders', 'whatsapp', 'marketing'];
type Mode = 'mobile' | 'otp' | 'multiMatch' | 'register-form' | 'uncertain' | 'visit-hospital';

export default function MobileLogin() {
  const store = useStore();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('mobile');
  const [mobile, setMobile] = useState('9414023871');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [multiMatches, setMultiMatches] = useState<Patient[]>([]);
  const [form, setForm] = useState({ name: '', dob: '', gender: 'Male', address: '', idNumber: '' });
  const [regResult, setRegResult] = useState<{ outcome: string; message: string; patient?: Patient } | null>(null);
  const [consented, setConsented] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [showOptional, setShowOptional] = useState(false);
  const [optional, setOptional] = useState<Partial<Record<ConsentPurpose, boolean>>>({});
  const optionalCount = OPTIONAL.filter(k => optional[k]).length;
  const otpInputRef = useRef<HTMLInputElement>(null);

  const sendOtp = () => { if (!consented) return; if (mobile.length !== 10) { setError('Enter a valid 10-digit mobile number.'); return; } setError(''); store.recordLoginConsent(mobile, optional); setMode('otp'); setTimeout(() => otpInputRef.current?.focus(), 50); };

  const verifyOtp = () => {
    const res = store.loginWithOtp(mobile, otp);
    if (res.ok) { navigate('/home'); return; }
    if (res.multiMatch) { setMultiMatches(res.multiMatch); setMode('multiMatch'); return; }
    if (res.message.includes('No matching HIMS profile')) {
      setError('');
      // D1 (BRD §5.3/5.4): HOSPITAL_ONLY tenants never create a UHID from the app.
      setMode(store.selfRegistrationMode === 'HOSPITAL_ONLY' ? 'visit-hospital' : 'register-form');
      return;
    }
    setError(res.message);
  };

  const submitRegistration = () => {
    const res = store.registerPatient({ ...form, mobile, gender: form.gender as any });
    setRegResult(res);
    if (res.outcome === 'created') setTimeout(() => navigate('/home'), 1200);
    else if (res.outcome === 'uncertain') setMode('uncertain');
  };

  const useExistingProfile = () => { if (regResult?.patient) { store.selectPatientProfile(regResult.patient.uhid); navigate('/home'); } };

  return (
    <div className="h-full flex flex-col relative overflow-hidden" style={{ background: 'var(--grad-navy-teal)' }}>
      <LiveBackdrop />
      <div className="m-safe-top shrink-0 relative" />
      <div className="flex-1 overflow-y-auto m-noscroll px-6 pb-8 flex flex-col relative">
        <div className="text-center pt-6 pb-6 m-rise">
          <span data-live-anchor style={{ display: 'inline-flex' }}><TetherLogo size={62} /></span>
          <div className="text-white mt-3.5 leading-[0.95]" style={{ fontFamily: 'var(--font-wordmark)', fontWeight: 700, fontSize: 36, letterSpacing: '-0.03em' }}>{APP_NAME}</div>
          <div className="text-white/40 text-[10px] font-bold uppercase mt-2" style={{ letterSpacing: '0.24em' }}>Patient Portal</div>
          <div className="inline-flex items-center gap-2 mt-4 bg-white/10 border border-white/15 rounded-full pl-3 pr-3.5 py-1.5 backdrop-blur-sm">
            <Building2 size={12.5} className="text-white/60" />
            <span className="text-white/90 text-[12px] font-bold">{HOSPITAL_NAME}</span>
            <span className="w-1 h-1 rounded-full bg-white/30" />
            <span className="text-white/55 text-[12px] font-medium">{HOSPITAL_CITY}</span>
          </div>
        </div>

        <div className="m-card-floating bg-white p-5 pt-3 mt-auto">
          <div className="flex justify-center pb-2.5"><div className="w-9 h-1.5 rounded-full bg-slate-100" /></div>

          {mode === 'mobile' && (
            <div className="space-y-3">
              <div>
                <div className="text-slate-800 font-bold" style={{ fontFamily: 'var(--font-display)', fontSize: 22, letterSpacing: '-0.015em' }}>Welcome back</div>
                <div className="text-[12.5px] text-slate-400 mt-0.5 leading-snug">Sign in with your registered mobile number</div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase" style={{ letterSpacing: '0.06em' }}>Mobile Number</label>
                <div className="relative mt-1.5">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-slate-400 pointer-events-none">
                    <Phone size={16} strokeWidth={2} />
                    <span className="text-[14.5px] font-semibold text-slate-500">+91</span>
                    <span className="w-px h-4 bg-slate-200 ml-0.5" />
                  </span>
                  <input
                    className="m-input"
                    style={{ paddingLeft: 84 }}
                    inputMode="numeric"
                    value={mobile}
                    onChange={e => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="10-digit mobile number"
                  />
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 border border-slate-100 p-3 space-y-2.5">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input type="checkbox" className="mt-0.5 w-[18px] h-[18px] accent-[var(--brand-teal)] shrink-0" checked={consented} onChange={e => setConsented(e.target.checked)} />
                  <span className="text-[12.5px] text-slate-600 leading-snug">
                    I agree that {HOSPITAL_NAME} may use my mobile number and health records to verify me and provide care in Tether.{' '}
                    <button type="button" onClick={e => { e.preventDefault(); setNoticeOpen(true); }} className="font-bold text-[var(--brand-teal)] underline underline-offset-2">Read the privacy notice</button>
                  </span>
                </label>
                <button type="button" onClick={() => setShowOptional(true)} className="w-full flex items-center justify-between text-[12px] font-bold text-slate-500 pt-2 border-t border-slate-200/70 m-tap">
                  <span>Optional choices · {optionalCount ? `${optionalCount} on` : 'all off'}</span>
                  <ChevronRight size={15} />
                </button>
              </div>

              {error && <div className="text-[12.5px] text-red-600 font-medium flex items-center gap-1.5"><AlertTriangle size={13} />{error}</div>}

              <button className="m-btn-primary flex items-center justify-center gap-2 disabled:opacity-40" disabled={!consented || mobile.length !== 10} onClick={sendOtp}>
                Send OTP <ArrowRight size={17} strokeWidth={2.25} />
              </button>

              <p className="text-[10.5px] text-slate-400 text-center leading-snug">{consented ? 'You can change or withdraw any choice later in Profile → Privacy & Consent.' : 'Tick the box above to continue. Nothing is shared until you do.'}<br />Try 9414023871 (existing) or any new number.</p>
              <button className="text-[11.5px] text-slate-400 font-semibold w-full text-center pt-1 border-t border-slate-100" onClick={() => navigate('/staff/login')}>Hospital Staff Login →</button>
            </div>
          )}

          {mode === 'otp' && (
            <div className="space-y-3.5">
              <button onClick={() => setMode('mobile')} className="flex items-center gap-1 text-[13px] text-slate-400 font-semibold -ml-1"><ChevronLeft size={16} />Change number</button>
              <div>
                <div className="flex items-center gap-2 text-slate-800 font-bold" style={{ fontFamily: 'var(--font-display)', fontSize: 24, letterSpacing: '-0.015em' }}><ShieldCheck size={21} strokeWidth={2} className="text-[var(--brand-teal)]" /> Verify OTP</div>
                <p className="text-[13px] text-slate-400 mt-1 leading-snug">Sent to <span className="font-semibold text-slate-600">+91 {mobile}</span> — demo OTP <b className="text-slate-600">123456</b></p>
              </div>

              <div className="relative" onClick={() => otpInputRef.current?.focus()}>
                <div className="flex gap-2 justify-center">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-11 h-13 rounded-xl border-2 flex items-center justify-center text-[19px] font-extrabold text-slate-700 transition-colors"
                      style={{
                        height: 52,
                        borderColor: otp.length === i ? 'var(--brand-teal)' : (otp[i] ? 'var(--brand-teal)' : '#e3e8ec'),
                        background: otp[i] ? 'var(--brand-teal-light)' : '#fafbfc',
                      }}
                    >
                      {otp[i] || ''}
                    </div>
                  ))}
                </div>
                <input
                  ref={otpInputRef}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  inputMode="numeric"
                  maxLength={6}
                  autoFocus
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                />
              </div>

              {error && <div className="text-[12.5px] text-red-600 font-medium flex items-center gap-1.5"><AlertTriangle size={13} />{error}</div>}

              <button className="m-btn-primary flex items-center justify-center gap-2" onClick={verifyOtp}>
                Verify & Continue <ArrowRight size={17} strokeWidth={2.25} />
              </button>
              <button className="flex items-center justify-center gap-1.5 text-[12.5px] text-[var(--brand-teal)] font-bold w-full text-center" onClick={() => setOtp('')}>
                <RotateCcw size={13} /> Resend OTP
              </button>
            </div>
          )}

          {mode === 'multiMatch' && (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 m-heading text-slate-800"><UserPlus size={19} className="text-amber-500" /> Confirm Your Profile</div>
              <div className="text-[12.5px] text-amber-700 bg-amber-50 rounded-xl p-3 font-medium">Multiple HIMS records share this number. Select yours to continue.</div>
              {multiMatches.map(p => (
                <button key={p.uhid} className="w-full text-left border border-slate-200 rounded-2xl p-3.5 m-tap" onClick={() => { store.selectPatientProfile(p.uhid); navigate('/home'); }}>
                  <div className="font-bold text-slate-700 text-[14.5px]">{p.name}</div>
                  <div className="text-[12px] text-slate-400">{p.uhid} · DOB {p.dob}</div>
                </button>
              ))}
            </div>
          )}

          {mode === 'register-form' && (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 m-heading text-slate-800"><UserPlus size={19} className="text-[var(--brand-teal)]" /> New Patient Registration</div>
              <div className="text-[12.5px] text-sky-700 bg-sky-50 rounded-xl p-3 font-medium">No profile found for +91 {mobile}. Complete registration below.</div>
              <input className="m-input" placeholder="Full Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              <div className="grid grid-cols-2 gap-2.5">
                <input type="date" className="m-input" value={form.dob} onChange={e => setForm({ ...form, dob: e.target.value })} />
                <select className="m-input" value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}><option>Male</option><option>Female</option></select>
              </div>
              <input className="m-input" placeholder="Address" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
              <input className="m-input" placeholder="Aadhaar / Identity Number" value={form.idNumber} onChange={e => setForm({ ...form, idNumber: e.target.value })} />
              {regResult?.outcome === 'conclusive' && <div className="text-[12.5px] text-amber-700 bg-amber-50 rounded-xl p-3 font-medium">{regResult.message}</div>}
              {regResult?.outcome === 'created' && <div className="text-[12.5px] text-emerald-700 bg-emerald-50 rounded-xl p-3 font-medium">{regResult.message}</div>}
              {regResult?.outcome === 'conclusive' ? (
                <div className="flex gap-2">
                  <button className="m-btn-secondary flex-1" onClick={() => setRegResult(null)}>Edit</button>
                  <button className="m-btn-primary flex-1" onClick={useExistingProfile}>Use profile</button>
                </div>
              ) : (
                <button className="m-btn-primary" disabled={!form.name || !form.dob} onClick={submitRegistration}>Submit Registration</button>
              )}
            </div>
          )}

          {mode === 'uncertain' && (
            <div className="text-center space-y-3">
              <div className="text-[13px] text-red-700 bg-red-50 rounded-xl p-3 font-medium">{regResult?.message}</div>
              <button className="m-btn-secondary" onClick={() => { setMode('mobile'); setRegResult(null); }}>Back to Login</button>
            </div>
          )}

          {mode === 'visit-hospital' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 m-heading text-slate-800"><Building2 size={19} className="text-[var(--brand-teal)]" /> Visit Verification Required</div>
              <div className="text-[13.5px] text-slate-700 bg-sky-50 rounded-xl p-3.5 font-semibold leading-relaxed">
                Please complete identity verification and UHID creation by visiting our hospital.
              </div>
              <div className="border border-slate-100 rounded-2xl p-3.5 space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <MapPin size={16} className="text-[var(--brand-teal)] shrink-0 mt-0.5" />
                  <span className="text-[12.5px] text-slate-600 leading-relaxed">{HOSPITAL_ADDRESS}</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Clock size={16} className="text-[var(--brand-teal)] shrink-0 mt-0.5" />
                  <span className="text-[12.5px] text-slate-600 leading-relaxed">{HOSPITAL_TIMINGS}</span>
                </div>
              </div>
              <button className="m-btn-primary flex items-center justify-center gap-2"><Navigation size={16} /> Get Directions</button>
              <button className="text-[12.5px] text-slate-400 font-semibold w-full text-center" onClick={() => setMode('mobile')}>Back to Login</button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-center gap-1.5 pt-3 pb-1 shrink-0">
          <span className="text-white/35 text-[11px] font-medium">Powered by</span>
          <div className="w-4 h-4 rounded-[5px] bg-white flex items-center justify-center overflow-hidden p-0.5 shrink-0"><img src={sofscriptLogo} alt="Sofscript" className="w-full h-full object-contain" /></div>
          <span className="text-white/55 text-[11.5px] font-bold">Sofscript</span>
        </div>
      </div>
      <Sheet open={showOptional} onClose={() => setShowOptional(false)} title="Optional choices">
        <p className="text-[12.5px] text-slate-500 leading-relaxed mb-3">These are your choice. Everything is off unless you turn it on, and you can change it any time in Profile → Privacy & Consent.</p>
        <div className="space-y-4">
          {OPTIONAL.map(k => (
            <div key={k} className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-bold text-slate-800">{PURPOSES[k].en.title}</div>
                <div className="text-[12px] text-slate-500 leading-snug">{PURPOSES[k].en.desc}</div>
              </div>
              <button role="switch" aria-checked={!!optional[k]} aria-label={PURPOSES[k].en.title} onClick={() => setOptional(o => ({ ...o, [k]: !o[k] }))}
                className={`w-12 h-7 rounded-full relative transition-colors shrink-0 m-tap ${optional[k] ? 'bg-[var(--brand-teal)]' : 'bg-slate-300'}`}>
                <span className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-all ${optional[k] ? 'left-[22px]' : 'left-0.5'}`} />
              </button>
            </div>
          ))}
        </div>
        <button className="m-btn-primary mt-5" onClick={() => setShowOptional(false)}>Done</button>
      </Sheet>
      <NoticeSheet open={noticeOpen} onClose={() => setNoticeOpen(false)} />
    </div>
  );
}
