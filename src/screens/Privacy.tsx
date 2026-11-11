import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore, getAge } from '../data/store';
import { PURPOSES, type CopyPurpose } from '../data/consentCopy';
import { CONSENT_VERSION, DPO_NAME, DPO_EMAIL, DPO_PHONE, GRIEVANCE_SLA_DAYS } from '../data/seed';
import NoticeSheet from '../components/NoticeSheet';
import Sheet from '../components/Sheet';
import { MPillBadge } from '../components/bits';
import { haptic } from '../lib/haptics';
import type { ConsentPurpose, DataRightType } from '../data/types';
import { ChevronLeft, ShieldCheck, Download, PencilLine, Trash2, UserCheck, MessageSquareWarning, FileText, Lock, ChevronDown, Baby, Check } from 'lucide-react';

const CHOICES: CopyPurpose[] = ['reminders', 'whatsapp', 'marketing', 'research'];
const LABEL: Partial<Record<ConsentPurpose, string>> = {
  care: 'Care & records', reminders: 'Reminders', whatsapp: 'WhatsApp & calls', marketing: 'Health camps & offers', research: 'Quality & research',
  'share-access': 'Record sharing', 'qr-share': 'Medical ID QR', 'family-link': 'Family link', guardian: "Guardian consent",
};
const fmt = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const fmtT = (iso: string) => new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
const tone = (s: string) => (s === 'Completed' ? 'emerald' : s === 'In Review' ? 'amber' : 'sky');

export default function Privacy() {
  const store = useStore();
  const navigate = useNavigate();
  const patient = store.patients.find(p => p.uhid === store.currentPatientUhid)!;
  const subject = patient.mobile;
  const state = store.getConsentState(subject);
  const headUhid = store.authedAsFamilyHead || patient.uhid;
  const minors = store.patients.filter(p => (p.uhid === headUhid || p.familyHeadUhid === headUhid) && getAge(p.dob) < 18);
  const history = useMemo(() => store.consents.filter(c => c.subject === subject).sort((a, b) => b.timestamp.localeCompare(a.timestamp)), [store.consents, subject]);
  const lastChange = (k: ConsentPurpose) => history.find(h => h.purpose === k);
  const myRequests = store.dataRequests.filter(r => r.patientUhid === patient.uhid);
  const nominee = store.nominees.find(n => n.subject === subject);

  const [notice, setNotice] = useState(false);
  const [sheet, setSheet] = useState<null | 'erase' | 'correct' | 'nominate' | 'grievance'>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [careInfo, setCareInfo] = useState(false);
  const [saved, setSaved] = useState('');
  const [text, setText] = useState('');
  const [ack, setAck] = useState(false);
  const [nm, setNm] = useState({ name: '', relation: '', mobile: '' });
  const [cat, setCat] = useState('Consent or notice');
  const [done, setDone] = useState<{ id: string; type: DataRightType } | null>(null);

  const toggle = (k: CopyPurpose) => {
    const next = !state[k];
    haptic.tick();
    store.setConsent(subject, k, next, 'Consent Centre');
    setSaved(`${PURPOSES[k].en.title} ${next ? 'turned on' : 'turned off'}. Saved.`);
    setTimeout(() => setSaved(''), 2600);
  };

  const closeSheet = () => { setSheet(null); setText(''); setAck(false); setDone(null); };
  const submit = (type: DataRightType, detail: string) => { const r = store.submitDataRequest(patient.uhid, type, detail); haptic.success(); setDone({ id: r.id, type }); };

  const downloadCopy = () => {
    const mine = (x: any) => x.patientUhid === patient.uhid;
    const data = {
      generatedAt: new Date().toISOString(), noticeVersion: CONSENT_VERSION,
      profile: patient,
      appointments: store.appointments.filter(mine), investigations: store.investigations.filter(mine), medicines: store.medicines.filter(mine),
      consents: history, requests: myRequests,
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    const a = document.createElement('a'); a.href = url; a.download = `my-health-data-${patient.uhid}.json`; a.click(); URL.revokeObjectURL(url);
    store.submitDataRequest(patient.uhid, 'Access', 'Copy of personal data downloaded', true);
    haptic.success(); setSaved('Your data copy has been downloaded.'); setTimeout(() => setSaved(''), 2600);
  };

  const Switch = ({ on, locked, label, onClick }: { on: boolean; locked?: boolean; label: string; onClick?: () => void }) => (
    <button role="switch" aria-checked={on} aria-label={label} disabled={locked} onClick={onClick}
      className={`w-12 h-7 rounded-full relative transition-colors shrink-0 m-tap ${on ? 'bg-[var(--brand-teal)]' : 'bg-slate-300'} ${locked ? 'opacity-60' : ''}`}>
      <span className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-all ${on ? 'left-[22px]' : 'left-0.5'}`} />
    </button>
  );

  const Right = ({ icon: Icon, title, sub, onClick, tint }: { icon: any; title: string; sub: string; onClick: () => void; tint?: string }) => (
    <button onClick={onClick} className="w-full flex items-center gap-3 py-3 text-left m-tap">
      <span className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0" style={{ background: tint || 'var(--brand-teal-light)' }}><Icon size={19} className="text-[var(--brand-teal)]" /></span>
      <span className="flex-1 min-w-0"><span className="block text-[14px] font-bold text-slate-800">{title}</span><span className="block text-[12px] text-slate-400 leading-snug">{sub}</span></span>
    </button>
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 pt-1 pb-3 shrink-0">
        <button onClick={() => navigate(-1)} aria-label="Back" className="m-tap text-slate-500"><ChevronLeft size={24} strokeWidth={2} /></button>
        <div className="flex-1">
          <div className="m-display text-slate-800">Privacy & Consent</div>
          <div className="m-caption text-slate-400 mt-1.5">You decide how Tether uses your data</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto m-noscroll pb-6 space-y-5">
        <div className="m-quick p-4">
          <div className="relative z-[1] flex items-start gap-3">
            <span className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'rgba(255,255,255,.16)' }}><ShieldCheck size={21} className="text-white" /></span>
            <div className="flex-1">
              <div className="m-heading text-white">Your health data is yours</div>
              <div className="text-[12.5px] text-white/75 leading-snug mt-1">We never sell it. You can see who has access, change your choices, take a copy, or ask us to erase it, any time.</div>
              <button onClick={() => setNotice(true)} className="mt-2.5 text-[12.5px] font-bold text-white underline underline-offset-2">Read the privacy notice (v{CONSENT_VERSION})</button>
            </div>
          </div>
        </div>

        {saved && <div role="status" className="m-rise flex items-center gap-2 text-[12.5px] font-bold rounded-2xl px-3.5 py-2.5 bg-emerald-50 text-emerald-700"><Check size={15} /> {saved}</div>}

        <section>
          <div className="m-label text-slate-400 mb-2 px-1">Your consents</div>
          <div className="m-card px-4 divide-y divide-slate-100">
            <div className="py-3.5">
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2"><span className="text-[14px] font-bold text-slate-800">{PURPOSES.care.en.title}</span><MPillBadge text="Required" tone="teal" /></div>
                  <div className="text-[12px] text-slate-500 leading-snug mt-0.5">{PURPOSES.care.en.desc}</div>
                </div>
                <Switch on locked label="Care and records, required" />
              </div>
              <button onClick={() => setCareInfo(v => !v)} className="mt-2 inline-flex items-center gap-1 text-[12px] font-bold text-[var(--brand-teal)]"><Lock size={12} /> Why can't I turn this off?</button>
              {careInfo && <div className="m-rise text-[12px] text-slate-500 leading-relaxed mt-1.5">Tether can't work without this. If you no longer want us to hold your data, use <b>Erase my data</b> below — we'll tell you what we must keep by law.</div>}
              <div className="text-[11px] text-slate-400 mt-1.5">Given {lastChange('care') ? fmt(lastChange('care')!.timestamp) : '—'} · notice v{lastChange('care')?.version || CONSENT_VERSION}</div>
            </div>
            {CHOICES.map(k => (
              <div key={k} className="py-3.5 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-bold text-slate-800">{PURPOSES[k].en.title}</div>
                  <div className="text-[12px] text-slate-500 leading-snug mt-0.5">{PURPOSES[k].en.desc}</div>
                  <div className="text-[11px] text-slate-400 mt-1">{lastChange(k) ? `${state[k] ? 'On' : 'Off'} since ${fmt(lastChange(k)!.timestamp)}` : 'Off — never asked'}</div>
                </div>
                <Switch on={!!state[k]} label={PURPOSES[k].en.title} onClick={() => toggle(k)} />
              </div>
            ))}
          </div>
          <p className="text-[11.5px] text-slate-400 leading-snug mt-2 px-1">Turning something off is as easy as turning it on, and takes effect straight away.</p>
        </section>

        {minors.length > 0 && (
          <section>
            <div className="m-label text-slate-400 mb-2 px-1">Children in your family</div>
            <div className="m-card p-4 space-y-3">
              {minors.map(m => (
                <div key={m.uhid} className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--brand-teal-light)' }}><Baby size={19} className="text-[var(--brand-teal)]" /></span>
                  <div className="flex-1"><div className="text-[14px] font-bold text-slate-800">{m.name} <span className="font-medium text-slate-400">· {getAge(m.dob)} yrs</span></div><div className="text-[12px] text-slate-400">You consent on their behalf as parent / guardian</div></div>
                </div>
              ))}
              <div className="text-[12px] text-slate-500 leading-relaxed pt-2 border-t border-slate-100">We never track children or show them targeted advertising. They can take over their own consent at 18.</div>
            </div>
          </section>
        )}

        <section>
          <div className="m-label text-slate-400 mb-2 px-1">Your data rights</div>
          <div className="m-card px-4 divide-y divide-slate-100">
            <Right icon={Download} title="Get a copy of my data" sub="Instant download of your profile, visits, reports and consents." onClick={downloadCopy} />
            <Right icon={PencilLine} title="Correct my data" sub="Tell us what's wrong or out of date." onClick={() => setSheet('correct')} />
            <Right icon={Trash2} title="Erase my data" sub="Ask us to delete what we're not required to keep." onClick={() => setSheet('erase')} tint="rgba(192,57,43,.1)" />
            <Right icon={UserCheck} title="Nominate someone" sub={nominee ? `${nominee.name} (${nominee.relation}) can act for you if you can't.` : "Choose who can exercise your rights if you can't."} onClick={() => { setNm(nominee ? { name: nominee.name, relation: nominee.relation, mobile: nominee.mobile } : { name: '', relation: '', mobile: '' }); setSheet('nominate'); }} />
            <Right icon={MessageSquareWarning} title="Raise a concern" sub={`We reply within ${GRIEVANCE_SLA_DAYS} days. You can also write to our officer.`} onClick={() => setSheet('grievance')} />
          </div>
        </section>

        {myRequests.length > 0 && (
          <section>
            <div className="m-label text-slate-400 mb-2 px-1">My requests</div>
            <div className="m-card px-4 divide-y divide-slate-100">
              {myRequests.map(r => (
                <div key={r.id} className="py-3 flex items-center gap-3">
                  <FileText size={17} className="text-slate-300 shrink-0" />
                  <div className="flex-1 min-w-0"><div className="text-[13.5px] font-bold text-slate-700">{r.type}</div><div className="text-[11.5px] text-slate-400 truncate">{r.id} · {r.status === 'Completed' ? `Done ${fmt(r.createdAt)}` : `Reply by ${fmt(r.dueBy)}`}</div></div>
                  <MPillBadge text={r.status} tone={tone(r.status) as any} />
                </div>
              ))}
            </div>
          </section>
        )}

        <section>
          <button onClick={() => setShowHistory(v => !v)} aria-expanded={showHistory} className="w-full flex items-center justify-between px-1 mb-2 m-tap">
            <span className="m-label text-slate-400">Consent history ({history.length})</span>
            <ChevronDown size={16} className="text-slate-400" style={{ transform: showHistory ? 'rotate(180deg)' : 'none', transition: 'transform .25s' }} />
          </button>
          {showHistory && (
            <div className="m-card px-4 divide-y divide-slate-100 m-rise">
              {history.map(h => (
                <div key={h.id} className="py-2.5 flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${h.granted ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  <div className="flex-1 min-w-0"><div className="text-[13px] font-semibold text-slate-700">{LABEL[h.purpose] || h.purpose} — {h.granted ? 'given' : 'withdrawn'}</div><div className="text-[11px] text-slate-400 truncate">{fmtT(h.timestamp)} · {h.channel} · v{h.version}{h.detail ? ` · ${h.detail}` : ''}</div></div>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="text-[11.5px] text-slate-400 leading-relaxed px-1 pb-2">
          <div className="font-bold text-slate-500">{DPO_NAME}</div>
          {DPO_EMAIL} · {DPO_PHONE}
        </div>
      </div>

      <NoticeSheet open={notice} onClose={() => setNotice(false)} />

      <Sheet open={sheet === 'correct'} onClose={closeSheet} title="Correct my data">
        {done ? <Done id={done.id} onClose={closeSheet} msg={`We'll review and update your records. Reply by ${fmt(new Date(Date.now() + GRIEVANCE_SLA_DAYS * 864e5).toISOString())}.`} /> : (
          <div className="space-y-3">
            <p className="text-[12.5px] text-slate-500 leading-relaxed">Name, date of birth and mobile are controlled by hospital registration, so we'll verify with you. For anything else, just describe what's wrong.</p>
            <textarea className="m-input" rows={4} placeholder="What should be corrected, and to what?" value={text} onChange={e => setText(e.target.value)} />
            <button className="m-btn-primary" disabled={text.trim().length < 5} onClick={() => submit('Correction', text.trim())}>Send correction request</button>
          </div>
        )}
      </Sheet>

      <Sheet open={sheet === 'erase'} onClose={closeSheet} title="Erase my data">
        {done ? <Done id={done.id} onClose={closeSheet} msg="We'll confirm what was erased and what we must keep by law." /> : (
          <div className="space-y-3">
            <div className="rounded-2xl p-3.5 text-[12.5px] leading-relaxed" style={{ background: 'rgba(245,158,11,.14)', color: 'var(--text-primary)', border: '1px solid rgba(245,158,11,.35)' }}>Hospital law requires us to keep medical records for a set period. We'll erase everything else — like your app preferences and contact details we're not required to hold — and tell you exactly what we kept and why.</div>
            <ul className="text-[12.5px] text-slate-500 leading-relaxed list-disc pl-5 space-y-1"><li>You'll be signed out and lose access to the app.</li><li>Upcoming appointments may be cancelled.</li><li>This can't be undone once completed.</li></ul>
            <label className="flex items-start gap-2.5 cursor-pointer"><input type="checkbox" className="mt-0.5 w-[18px] h-[18px] accent-[var(--brand-red)]" checked={ack} onChange={e => setAck(e.target.checked)} /><span className="text-[12.5px] text-slate-600 leading-snug">I understand and want to request erasure.</span></label>
            <button className="m-btn-danger" disabled={!ack} onClick={() => submit('Erasure', 'Erase all data not required to be retained by law')}>Request erasure</button>
          </div>
        )}
      </Sheet>

      <Sheet open={sheet === 'nominate'} onClose={closeSheet} title="Nominate someone">
        <div className="space-y-2.5">
          <p className="text-[12.5px] text-slate-500 leading-relaxed">If you die or become unable to act, this person can use your data rights for you. You can change or remove them any time.</p>
          <input className="m-input" placeholder="Full name" value={nm.name} onChange={e => setNm({ ...nm, name: e.target.value })} />
          <input className="m-input" placeholder="Relationship (e.g. Spouse)" value={nm.relation} onChange={e => setNm({ ...nm, relation: e.target.value })} />
          <input className="m-input" inputMode="numeric" placeholder="Mobile number" value={nm.mobile} onChange={e => setNm({ ...nm, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) })} />
          <button className="m-btn-primary" disabled={!nm.name || !nm.relation || nm.mobile.length !== 10} onClick={() => { store.setNominee(subject, nm); haptic.success(); closeSheet(); setSaved('Nominee saved.'); setTimeout(() => setSaved(''), 2600); }}>Save nominee</button>
          {nominee && <button className="m-btn-ghost w-full" onClick={() => { store.setNominee(subject, null); closeSheet(); setSaved('Nominee removed.'); setTimeout(() => setSaved(''), 2600); }}>Remove nominee</button>}
        </div>
      </Sheet>

      <Sheet open={sheet === 'grievance'} onClose={closeSheet} title="Raise a concern">
        {done ? <Done id={done.id} onClose={closeSheet} msg={`We'll reply within ${GRIEVANCE_SLA_DAYS} days. If it isn't resolved, you can complain to the Data Protection Board of India.`} /> : (
          <div className="space-y-3">
            <select className="m-input" value={cat} onChange={e => setCat(e.target.value)}>
              {['Consent or notice', 'Someone saw my records', 'Wrong or missing data', 'Erasure or access request', 'Something else'].map(c => <option key={c}>{c}</option>)}
            </select>
            <textarea className="m-input" rows={4} placeholder="Tell us what happened" value={text} onChange={e => setText(e.target.value)} />
            <button className="m-btn-primary" disabled={text.trim().length < 5} onClick={() => submit('Grievance', `${cat}: ${text.trim()}`)}>Send to our privacy officer</button>
            <div className="text-[11.5px] text-slate-400 leading-snug">Prefer to write? {DPO_EMAIL} · {DPO_PHONE}</div>
          </div>
        )}
      </Sheet>
    </div>
  );
}

function Done({ id, msg, onClose }: { id: string; msg: string; onClose: () => void }) {
  return (
    <div className="text-center py-3">
      <div className="w-14 h-14 mx-auto rounded-full flex items-center justify-center m-pop" style={{ background: 'var(--grad-teal)' }}>
        <svg className="m-check-svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
      </div>
      <div className="m-heading text-slate-800 mt-3">Request received</div>
      <div className="text-[12px] text-slate-400 mt-1 m-num">{id}</div>
      <p className="text-[13px] text-slate-500 leading-relaxed mt-2">{msg}</p>
      <button className="m-btn-primary mt-4" onClick={onClose}>Done</button>
    </div>
  );
}
