import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { useStore } from '../data/store';
import { APP_NAME } from '../data/seed';
import { ChevronLeft, RotateCw, ScanLine, Info } from 'lucide-react';
import logo from '../assets/sofscript-logo.png';

// Differentiator — Digital Medical ID Card. Front shows patient identity at a glance; a tap flips
// the card (like a physical ID) to reveal a QR code encoding the patient's UHID, for a future
// hospital-scanner integration (kiosks/registration counters) — never shown by default, and never
// carries anything beyond the UHID + a short non-sensitive verification token.
export default function MedicalId() {
  const store = useStore();
  const navigate = useNavigate();
  const patient = store.patients.find(p => p.uhid === store.currentPatientUhid)!;
  const [flipped, setFlipped] = useState(false);
  const [gate, setGate] = useState(false);
  const [qrOk, setQrOk] = useState(false);
  const onCardTap = () => {
    if (flipped) { setFlipped(false); return; }
    if (qrOk) { setFlipped(true); return; }
    setGate(true);
  };
  const allowQr = () => { setQrOk(true); setGate(false); setFlipped(true); store.setConsent(patient.mobile, 'qr-share', true, 'Sharing', 'Showed Medical ID QR'); };

  // A short, deterministic, non-sensitive verification token derived from the UHID — not a secret,
  // just something a scanner-side integration could cross-check against the UHID itself.
  const verifyToken = (() => {
    let h = 0;
    for (let i = 0; i < patient.uhid.length; i++) h = (h * 31 + patient.uhid.charCodeAt(i)) >>> 0;
    return (h % 900000 + 100000).toString();
  })();
  const qrValue = `TETHER-ID|${patient.uhid}|${verifyToken}`;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 pt-1 pb-3 shrink-0">
        <button onClick={() => navigate(-1)} className="m-tap text-slate-500"><ChevronLeft size={24} strokeWidth={2} /></button>
        <div className="flex-1">
          <div className="m-display text-slate-800 leading-tight">Digital Medical ID</div>
          <div className="m-caption text-slate-400 mt-1.5">Tap the card to flip it</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto m-noscroll pb-4">
        <div className="m-flip-scene mt-2 mb-5" onClick={onCardTap}>
          <div className={`m-flip-card ${flipped ? 'is-flipped' : ''}`}>
            {/* Front — identity */}
            <div className="m-flip-face m-card-floating justify-between p-5" style={{ background: 'var(--grad-navy-teal)' }}>
              <svg aria-hidden="true" className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 340 262" preserveAspectRatio="xMaxYMax slice" fill="none" style={{ zIndex: 0 }}>
                {[58, 96, 134, 172, 210].map((r, i) => <circle key={r} cx="318" cy="238" r={r} stroke="#fff" strokeOpacity={0.13 - i * 0.02} strokeWidth="1" />)}
                <rect width="340" height="262" fill="url(#idsheen)" />
                <defs><linearGradient id="idsheen" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff" stopOpacity="0.14" /><stop offset="0.45" stopColor="#fff" stopOpacity="0" /></linearGradient></defs>
              </svg>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-md bg-white flex items-center justify-center overflow-hidden p-1 shrink-0"><img src={logo} alt={APP_NAME} className="w-full h-full object-contain" /></div>
                  <span className="text-white/85 text-[11.5px] font-extrabold tracking-wide">GMCH · Patient ID</span>
                </div>
                <RotateCw size={16} className="text-white/50 shrink-0" />
              </div>
              <div>
                <div className="text-white font-extrabold text-[19px] leading-tight truncate" style={{ fontFamily: 'var(--font-display)' }}>{patient.name}</div>
                <div className="text-white/60 text-[12.5px] mt-0.5 truncate">{patient.relation ? `${patient.relation} · ` : ''}{patient.gender} · DOB {patient.dob}</div>
              </div>
              <div className="flex items-end justify-between">
                <div className="min-w-0">
                  <div className="text-white/50 text-[10.5px] font-bold uppercase tracking-wide">UHID</div>
                  <div className="text-white font-extrabold text-[16px] m-num tracking-wide truncate">{patient.uhid}</div>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <div className="text-white/50 text-[10.5px] font-bold uppercase tracking-wide">Patient Type</div>
                  <div className="text-white font-bold text-[13px]">{patient.patientType}</div>
                </div>
              </div>
              <div className="text-[10.5px] text-white/40 text-center">Tap to reveal QR</div>
            </div>

            {/* Back — QR code */}
            <div className="m-flip-face m-flip-back m-card-floating items-center justify-center gap-2.5 p-4" style={{ background: 'var(--grad-navy-teal)' }}>
              <div className="bg-white rounded-2xl p-2.5 shrink-0 leading-[0]">
                <QRCodeSVG value={qrValue} size={128} level="M" />
              </div>
              <div className="text-white/70 text-[10.5px] text-center leading-snug px-4 max-w-[240px]">Scan at hospital kiosks or registration counters to quickly pull up {patient.name.split(' ')[0]}'s UHID</div>
              <div className="text-white/40 text-[10px] text-center">Tap to flip back</div>
            </div>
          </div>
        </div>

        {gate && (
          <div role="alertdialog" aria-label="Show QR code" className="m-card p-4 mb-5 m-rise space-y-3">
            <div className="m-heading text-slate-800">Show your QR code?</div>
            <p className="text-[12.5px] text-slate-500 leading-relaxed">Anyone who scans it can see your UHID. Show it only to hospital staff or people you trust. We'll note this in your consent history.</p>
            <div className="flex gap-2"><button className="m-btn-secondary flex-1" onClick={() => setGate(false)}>Not now</button><button className="m-btn-primary flex-1" onClick={allowQr}>Show QR</button></div>
          </div>
        )}

        <div className="m-card p-3.5 flex gap-2.5">
          <Info size={17} className="text-slate-400 shrink-0 mt-0.5" />
          <div className="text-[12px] text-slate-500 leading-relaxed">This QR only encodes your UHID and a short verification code — no clinical or payment data. It's meant for future hospital-scanner integrations (fast check-in at kiosks/counters) and isn't linked to any live system yet.</div>
        </div>

        <div className="flex items-center gap-2 mt-3 px-1 text-slate-300">
          <ScanLine size={13} />
          <span className="text-[10.5px] font-medium">Works offline — no network needed to display your ID</span>
        </div>
      </div>
    </div>
  );
}
