import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore, getAge } from '../data/store';
import { ScreenHeader } from '../components/Shell';
import { MRow, MSection, MPillBadge, MEmpty, MSegmented, statusTone } from '../components/bits';
import Sheet from '../components/Sheet';
import { ContentBanner, contentWindowLabel } from '../components/content';
import { useTheme } from '../lib/theme';
import { useA11yMode } from '../lib/a11y';
import { CoachMark, useCoachMark } from '../components/CoachMark';
import type { CorrectionField, AccessRelationship, AccessBasis, AccessScope } from '../data/types';
import {
  Users, Bell, Megaphone, ShieldCheck, FileText, LogOut, ChevronRight, UserPlus, Smartphone, Mail, Globe, MessageSquare,
  Edit3, KeyRound, Lock, BellOff, History, SunMoon, Accessibility, IdCard,
} from 'lucide-react';

const ICON: Record<string, any> = { SMS: Smartphone, WhatsApp: MessageSquare, Email: Mail, Portal: Globe, 'Staff Portal': Globe };
const CORRECTION_FIELDS: CorrectionField[] = ['Name', 'DOB', 'Gender', 'Mobile Number', 'Other'];
const RELATIONSHIPS: AccessRelationship[] = ['Natural Guardian', 'Spouse', 'Parent', 'Child', 'Caregiver', 'Legal Guardian', 'Other'];
const SCOPES: AccessScope[] = ['Appointments', 'Payments', 'Reports', 'Prescriptions', 'IPD Services', 'Full'];

export default function Profile() {
  const store = useStore();
  const navigate = useNavigate();
  const patient = store.patients.find(p => p.uhid === store.currentPatientUhid)!;
  const headUhid = store.authedAsFamilyHead || patient.uhid;
  const isFamilyHead = headUhid === patient.uhid;
  const family = store.patients.filter(p => p.uhid === headUhid || p.familyHeadUhid === headUhid);

  const [sheet, setSheet] = useState<'family' | 'addFamily' | 'notifications' | 'announcements' | 'audit' | 'correction' | 'myCorrections' | 'access' | 'grantAccess' | null>(null);
  const [form, setForm] = useState({ name: '', mobile: '', dob: '', idNumber: '' });
  const [linkResult, setLinkResult] = useState<{ outcome: string; message: string } | null>(null);
  const [famConsent, setFamConsent] = useState(false);
  const formIsMinor = !!form.dob && getAge(form.dob) < 18;
  const submitLink = () => {
    const res = store.addFamilyMember(form); setLinkResult(res);
    if (res.outcome === 'linked') {
      store.setConsent(patient.mobile, formIsMinor ? 'guardian' : 'family-link', true, 'Family', `${form.name}${formIsMinor ? ' (minor, as parent/guardian)' : ' (their authorisation confirmed)'}`);
      setForm({ name: '', mobile: '', dob: '', idNumber: '' }); setFamConsent(false);
    }
  };
  const [gaConsent, setGaConsent] = useState(false);

  const myCorrections = store.correctionRequests.filter(c => c.patientUhid === patient.uhid).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const [corField, setCorField] = useState<CorrectionField>('Name');
  const [corRequested, setCorRequested] = useState('');
  const [corReason, setCorReason] = useState('');
  const corCurrentValue = corField === 'Name' ? patient.name : corField === 'DOB' ? patient.dob : corField === 'Gender' ? patient.gender : corField === 'Mobile Number' ? patient.mobile : '—';
  const submitCorrection = () => {
    store.submitCorrectionRequest(corField, corCurrentValue, corRequested, corReason);
    setCorRequested(''); setCorReason(''); setSheet('myCorrections');
  };

  const { choice: themeChoice, setChoice: setThemeChoice } = useTheme();
  const { on: a11yOn, setOn: setA11yOn } = useA11yMode();

  const [accessTab, setAccessTab] = useState<'Who Can Access My Records' | 'Access History'>('Who Can Access My Records');
  const [accessCoachDismissed, dismissAccessCoach] = useCoachMark('access-grants');
  const grantsOnMe = store.getGrantsForPatient(patient.uhid);
  const accessHistory = store.audit.filter(a => a.action.startsWith('Cross-Patient Record Access') || a.action.startsWith('Access Grant'));
  const [revokeReason, setRevokeReason] = useState<Record<string, string>>({});
  const doRevoke = (grantId: string) => { store.revokeAccessGrant(grantId, revokeReason[grantId] || 'Revoked by patient via app'); };

  const linkableUhid = family.filter(f => f.uhid !== patient.uhid);
  const [gaTargetUhid, setGaTargetUhid] = useState('');
  const [gaRelationship, setGaRelationship] = useState<AccessRelationship>('Spouse');
  const [gaBasis, setGaBasis] = useState<AccessBasis>('Patient Consent');
  const [gaScope, setGaScope] = useState<AccessScope[]>(['Appointments']);
  const [gaValidUntil, setGaValidUntil] = useState('');
  const [gaRevocable, setGaRevocable] = useState(true);
  const [gaResult, setGaResult] = useState<{ ok: boolean; message: string } | null>(null);
  const toggleScope = (s: AccessScope) => setGaScope(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  const submitGrant = () => {
    const res = store.grantAccess({ patientUhid: patient.uhid, authorizedUserUhid: gaTargetUhid, relationship: gaRelationship, basis: gaBasis, scope: gaScope, validUntil: gaValidUntil || undefined, revocable: gaRevocable });
    setGaResult(res);
    if (res.ok) {
      const target = store.patients.find(x => x.uhid === gaTargetUhid);
      store.setConsent(patient.mobile, 'share-access', true, 'Sharing', `${target?.name || gaTargetUhid} · ${gaScope.join(', ')}${gaValidUntil ? ` · until ${gaValidUntil}` : ''}`);
      setGaConsent(false);
      setTimeout(() => { setSheet('access'); setGaResult(null); setGaTargetUhid(''); }, 900);
    }
  };

  return (
    <div>
      <ScreenHeader title="Profile" />

      <div className="m-card p-4 mb-5 flex items-center gap-3">
        <div className="w-14 h-14 rounded-full bg-[var(--brand-navy)] text-white flex items-center justify-center font-extrabold text-[19px]">{patient.name[0]}</div>
        <div className="flex-1 min-w-0">
          <div className="font-extrabold text-slate-800 text-[15.5px] truncate">{patient.name}</div>
          <div className="text-[12px] text-slate-400">{patient.uhid}</div>
          <div className="flex gap-1.5 mt-1.5">
            <MPillBadge text={patient.patientType} tone={patient.patientType === 'IPD' ? 'rose' : 'teal'} />
            <MPillBadge text={patient.payer} tone="indigo" />
          </div>
        </div>
      </div>

      <MSection title="Hospital-Controlled Details" action={<span className="text-[10.5px] font-bold text-slate-300 flex items-center gap-1"><Lock size={11} /> Read-only</span>}>
        <div className="m-card px-4 py-1 divide-y divide-slate-50">
          <div className="flex items-center justify-between py-2.5"><span className="text-[12.5px] text-slate-400 font-medium">Full Name</span><span className="text-[13.5px] font-bold text-slate-700">{patient.name}</span></div>
          <div className="flex items-center justify-between py-2.5"><span className="text-[12.5px] text-slate-400 font-medium">Date of Birth</span><span className="text-[13.5px] font-bold text-slate-700">{patient.dob}</span></div>
          <div className="flex items-center justify-between py-2.5"><span className="text-[12.5px] text-slate-400 font-medium">Gender</span><span className="text-[13.5px] font-bold text-slate-700">{patient.gender}</span></div>
          <div className="flex items-center justify-between py-2.5"><span className="text-[12.5px] text-slate-400 font-medium">Primary Mobile</span><span className="text-[13.5px] font-bold text-slate-700">{patient.mobile}</span></div>
          <div className="flex items-center justify-between py-2.5"><span className="text-[12.5px] text-slate-400 font-medium">UHID</span><span className="text-[13.5px] font-bold text-slate-700">{patient.uhid}</span></div>
        </div>
        <p className="text-[11px] text-slate-400 mt-2 px-0.5 leading-relaxed">These fields are set by hospital Registration/MRD staff and can't be edited in the app. Use "Request Profile Correction" below for changes.</p>
      </MSection>

      <MSection title="Account">
        <div className="m-card px-4 divide-y divide-slate-50">
          <MRow tone="emerald" title="Privacy & Consent" subtitle="Your choices, data rights & consent history" icon={<ShieldCheck size={19} className="text-[var(--brand-teal)]" />} onClick={() => navigate('/privacy')} />
          <MRow tone="navy" title="Digital Medical ID" subtitle="Tap to flip for your scannable QR" icon={<IdCard size={19} className="text-[var(--brand-teal)]" />} onClick={() => navigate('/medical-id')} />
          <MRow tone="indigo" title="My Family" subtitle={`${family.length} member(s)`} icon={<Users size={19} className="text-[var(--brand-teal)]" />} onClick={() => setSheet('family')} />
          <MRow tone="amber" title="Request Profile Correction" subtitle="Name, DOB, gender or mobile number" icon={<Edit3 size={19} className="text-[var(--brand-teal)]" />} onClick={() => { setCorField('Name'); setCorRequested(''); setCorReason(''); setSheet('correction'); }} />
          <MRow tone="amber" title="My Correction Requests" subtitle={`${myCorrections.length} submitted`} icon={<FileText size={19} className="text-[var(--brand-teal)]" />} onClick={() => setSheet('myCorrections')} />
          <MRow tone="sky" title="Who Can Access My Records" subtitle={`${grantsOnMe.length} active grant(s)`} icon={<KeyRound size={19} className="text-[var(--brand-teal)]" />} onClick={() => { setAccessTab('Who Can Access My Records'); setSheet('access'); }} />
          <MRow tone="rose" title="Notifications" subtitle={`${store.notifications.length} recent`} icon={<Bell size={19} className="text-[var(--brand-teal)]" />} onClick={() => setSheet('notifications')} />
          <MRow tone="indigo" title="Announcements" icon={<Megaphone size={19} className="text-[var(--brand-teal)]" />} onClick={() => setSheet('announcements')} />
          <MRow tone="navy" title="Audit Trail" subtitle="Full activity history" icon={<ShieldCheck size={19} className="text-[var(--brand-teal)]" />} onClick={() => setSheet('audit')} />
          <MRow tone="teal" title="Medical Records" subtitle="Visit history, reports & prescriptions" icon={<FileText size={19} className="text-[var(--brand-teal)]" />} onClick={() => navigate('/records')} />
        </div>
      </MSection>

      <MSection title="Display & Accessibility">
        <div className="m-card p-4 space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2"><SunMoon size={17} className="text-[var(--brand-teal)]" strokeWidth={1.9} /><span className="text-[13.5px] font-bold text-slate-700">Dark Mode</span></div>
            <MSegmented options={['Light', 'Dark', 'System']} value={themeChoice === 'light' ? 'Light' : themeChoice === 'dark' ? 'Dark' : 'System'}
              onChange={v => setThemeChoice(v === 'Light' ? 'light' : v === 'Dark' ? 'dark' : 'system')} />
          </div>
          <div className="pt-1 border-t border-slate-50">
            <div className="flex items-center justify-between pt-3">
              <div className="flex items-center gap-2"><Accessibility size={17} className="text-[var(--brand-teal)]" strokeWidth={1.9} /><span className="text-[13.5px] font-bold text-slate-700">Accessibility Mode</span></div>
              <button onClick={() => setA11yOn(!a11yOn)} className={`w-11 h-6 rounded-full relative transition-colors m-tap ${a11yOn ? 'bg-[var(--brand-teal)]' : 'bg-slate-200'}`} aria-pressed={a11yOn} aria-label="Toggle accessibility mode">
                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${a11yOn ? 'left-[22px]' : 'left-0.5'}`} />
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">Larger text, higher-contrast borders & bigger touch targets throughout the app.</p>
          </div>
        </div>
      </MSection>

      <button onClick={() => { store.logout(); navigate('/'); }} className="w-full flex items-center justify-center gap-2 py-3.5 text-red-600 font-bold text-[14.5px] m-tap">
        <LogOut size={17} /> Logout
      </button>

      <Sheet open={sheet === 'family'} onClose={() => setSheet(null)} title="My Family">
        <div className="space-y-1">
          {family.map(f => (
            <div key={f.uhid} className="flex items-center gap-3 py-2.5">
              <div className="w-10 h-10 rounded-full bg-[var(--brand-teal-light)] text-[var(--brand-teal)] flex items-center justify-center font-bold">{f.name[0]}</div>
              <div className="flex-1">
                <div className="text-[14px] font-bold text-slate-700">{f.name} {f.relation && <span className="text-slate-400 font-medium">({f.relation})</span>}</div>
                <div className="text-[11.5px] text-slate-400">{f.uhid}</div>
              </div>
              {getAge(f.dob) < 18 && <MPillBadge text="Minor" tone="amber" />}
              <MPillBadge text={f.patientType} tone={f.patientType === 'IPD' ? 'rose' : 'teal'} />
            </div>
          ))}
          {isFamilyHead && (
            <button onClick={() => { setSheet('addFamily'); setLinkResult(null); }} className="w-full flex items-center justify-center gap-2 mt-3 py-3 rounded-2xl bg-slate-50 text-[var(--brand-teal)] font-bold text-[13.5px] m-tap">
              <UserPlus size={16} /> Add Family Member
            </button>
          )}
        </div>
      </Sheet>

      <Sheet open={sheet === 'addFamily'} onClose={() => setSheet(null)} title="Add Family Member">
        <div className="space-y-2.5">
          <p className="text-[12px] text-slate-400">Matched against HIMS using multiple parameters together. Aadhaar/ID alone is never sufficient.</p>
          <input className="m-input" placeholder="Full Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <input className="m-input" placeholder="Mobile Number" value={form.mobile} onChange={e => setForm({ ...form, mobile: e.target.value })} />
          <input type="date" className="m-input" value={form.dob} onChange={e => setForm({ ...form, dob: e.target.value })} />
          <input className="m-input" placeholder="Aadhaar / Patient ID" value={form.idNumber} onChange={e => setForm({ ...form, idNumber: e.target.value })} />
          {linkResult && <div className={`text-[12.5px] rounded-xl p-3 font-medium ${linkResult.outcome === 'linked' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{linkResult.message}</div>}
          <label className="flex items-start gap-2.5 rounded-2xl p-3 cursor-pointer" style={{ background: 'var(--surface-raised)' }}>
            <input type="checkbox" className="mt-0.5 w-[18px] h-[18px] accent-[var(--brand-teal)] shrink-0" checked={famConsent} onChange={e => setFamConsent(e.target.checked)} />
            <span className="text-[12px] text-slate-600 leading-snug">
              {formIsMinor
                ? 'This person is under 18. I confirm I am their parent or lawful guardian, and I consent to their records being linked and managed by me.'
                : 'I confirm this person has agreed to link their records to my family account and that I may view them.'}
            </span>
          </label>
          <button className="m-btn-primary" disabled={!form.name || !form.mobile || !famConsent} onClick={submitLink}>Verify & Link</button>
        </div>
      </Sheet>

      <Sheet open={sheet === 'notifications'} onClose={() => setSheet(null)} title="Notifications">
        {store.notifications.length === 0 ? <MEmpty title="No notifications" subtitle="Reminders and updates will appear here" icon={<BellOff size={20} strokeWidth={1.75} />} /> : (
          <div className="space-y-1">
            {store.notifications.map(n => {
              const Icon = ICON[n.channel] || Globe;
              return (
                <div key={n.id} className="flex items-center gap-3 py-2.5">
                  <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0"><Icon size={15} /></div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold text-slate-700 truncate">{n.event}</div>
                    <div className="text-[11px] text-slate-400">{n.channel} · {new Date(n.timestamp).toLocaleString('en-IN')}</div>
                  </div>
                  <MPillBadge text={n.status} tone="emerald" />
                </div>
              );
            })}
          </div>
        )}
      </Sheet>

      <Sheet open={sheet === 'announcements'} onClose={() => setSheet(null)} title="Announcements">
        <p className="text-[11.5px] text-slate-400 mb-3 leading-relaxed">Hospital news, camps & offers — separate from your clinical/transactional notifications above.</p>
        {store.getTargetedContent(patient).length === 0 ? <MEmpty title="No announcements right now" subtitle="Hospital news and offers will appear here" icon={<Megaphone size={20} strokeWidth={1.75} />} /> : (
          <div className="space-y-2.5">
            {store.getTargetedContent(patient).map(a => (
              <div key={a.id} className="m-card p-0 overflow-hidden">
                <ContentBanner item={a} height={64} />
                <div className="px-3.5 py-2.5 flex items-center justify-between gap-2">
                  <span className="text-[10.5px] font-bold text-[var(--brand-teal)] bg-[var(--brand-teal-light)] px-2 py-0.5 rounded-full">Marketing</span>
                  <MPillBadge text={contentWindowLabel(a)} tone={contentWindowLabel(a) === 'Ongoing' ? 'emerald' : contentWindowLabel(a) === 'Upcoming' ? 'sky' : 'slate'} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Sheet>

      <Sheet open={sheet === 'audit'} onClose={() => setSheet(null)} title="Audit Trail">
        <div className="space-y-2.5">
          {store.audit.map(a => (
            <div key={a.id} className="border border-slate-100 rounded-2xl p-3">
              <div className="flex justify-between items-start gap-2">
                <span className="text-[13px] font-bold text-slate-700">{a.action}</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">{new Date(a.timestamp).toLocaleString('en-IN')} · {a.user} ({a.role})</div>
              {(a.previousState || a.newState) && (
                <div className="text-[11.5px] mt-1">
                  {a.previousState && <span className="line-through text-slate-400 mr-1.5">{a.previousState}</span>}
                  {a.newState && <span className="font-bold text-[var(--brand-teal)]">→ {a.newState}</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      </Sheet>

      <Sheet open={sheet === 'correction'} onClose={() => setSheet(null)} title="Request Profile Correction">
        <div className="space-y-2.5">
          <label className="text-[12px] font-semibold text-slate-400">Field to correct</label>
          <select className="m-input" value={corField} onChange={e => setCorField(e.target.value as CorrectionField)}>
            {CORRECTION_FIELDS.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
          <label className="text-[12px] font-semibold text-slate-400">Current value</label>
          <input className="m-input opacity-60" readOnly value={corCurrentValue} />
          <label className="text-[12px] font-semibold text-slate-400">Requested new value</label>
          <input className="m-input" value={corRequested} onChange={e => setCorRequested(e.target.value)} placeholder="Enter the corrected value" />
          <label className="text-[12px] font-semibold text-slate-400">Reason</label>
          <textarea className="m-input" rows={3} value={corReason} onChange={e => setCorReason(e.target.value)} placeholder="Why is this correction needed?" />
          <div className="text-[12px] text-amber-700 bg-amber-50 rounded-xl p-3 font-medium leading-relaxed">Please also bring supporting documents in person to the Registration desk.</div>
          <button className="m-btn-primary" disabled={!corRequested.trim() || !corReason.trim()} onClick={submitCorrection}>Submit Request</button>
        </div>
      </Sheet>

      <Sheet open={sheet === 'myCorrections'} onClose={() => setSheet(null)} title="My Correction Requests">
        {myCorrections.length === 0 ? <MEmpty title="No correction requests" subtitle="Submitted requests will appear here" icon={<FileText size={20} strokeWidth={1.75} />} /> : (
          <div className="space-y-2.5">
            {myCorrections.map(c => (
              <div key={c.id} className="border border-slate-100 rounded-2xl p-3">
                <div className="flex justify-between items-start gap-2 mb-1">
                  <span className="text-[13px] font-bold text-slate-700">{c.field}</span>
                  <MPillBadge text={c.status} tone={statusTone(c.status)} />
                </div>
                <div className="text-[12.5px] text-slate-500">"{c.currentValue}" → "{c.requestedValue}"</div>
                <div className="text-[11.5px] text-slate-400 mt-1">{new Date(c.createdAt).toLocaleString('en-IN')}</div>
                {c.staffRemarks && <div className="text-[12px] text-sky-700 bg-sky-50 rounded-xl p-2.5 mt-2 font-medium">MRD remarks: {c.staffRemarks}</div>}
              </div>
            ))}
          </div>
        )}
      </Sheet>

      <Sheet open={sheet === 'access'} onClose={() => setSheet(null)} title="Records Access">
        <div className="space-y-3.5">
          <MSegmented options={['Who Can Access My Records', 'Access History']} value={accessTab} onChange={v => setAccessTab(v as any)} />
          {accessTab === 'Who Can Access My Records' && (
            <div className="space-y-2.5">
              <CoachMark show={!accessCoachDismissed} onDismiss={dismissAccessCoach}
                text="Grant a trusted family member access to view your appointments, reports & prescriptions — and revoke it any time." />
              {grantsOnMe.length === 0 ? <MEmpty title="No one else has access" subtitle="Grant access to a family member below" icon={<KeyRound size={20} strokeWidth={1.75} />} /> : grantsOnMe.map(g => {
                const user = store.patients.find(p => p.uhid === g.authorizedUserUhid);
                const expiringSoon = store.isGrantExpiringSoon(g);
                return (
                  <div key={g.id} className="border border-slate-100 rounded-2xl p-3.5">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <div className="text-[13.5px] font-bold text-slate-700">{user?.name || g.authorizedUserUhid}</div>
                        <div className="text-[11.5px] text-slate-400">{g.relationship} · {g.basis}</div>
                      </div>
                      <MPillBadge text={g.validUntil ? (expiringSoon ? 'Expiring Soon' : 'Active') : 'Active'} tone={expiringSoon ? 'amber' : 'emerald'} />
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {g.scope.map(s => <MPillBadge key={s} text={s} tone="indigo" />)}
                    </div>
                    <div className="text-[11.5px] text-slate-400 mt-2">Granted {g.createdAt.slice(0, 10)} · {g.validUntil ? `Expires ${g.validUntil}` : 'No expiry'}</div>
                    {g.revocable ? (
                      <div className="flex gap-2 mt-2.5 pt-2.5 border-t border-slate-50">
                        <input className="m-input !py-1.5 !text-[12px] flex-1" placeholder="Reason (optional)" value={revokeReason[g.id] || ''} onChange={e => setRevokeReason(prev => ({ ...prev, [g.id]: e.target.value }))} />
                        <button className="m-btn-danger-outline !py-1.5 !px-3 !text-[12px] shrink-0" onClick={() => doRevoke(g.id)}>Revoke</button>
                      </div>
                    ) : (
                      <div className="text-[11.5px] text-slate-400 mt-2.5 pt-2.5 border-t border-slate-50 font-medium">Hospital action required to revoke</div>
                    )}
                  </div>
                );
              })}
              <button onClick={() => { setSheet('grantAccess'); setGaResult(null); }} className="w-full flex items-center justify-center gap-2 mt-1 py-3 rounded-2xl bg-slate-50 text-[var(--brand-teal)] font-bold text-[13.5px] m-tap">
                <UserPlus size={16} /> Grant Access
              </button>
              <p className="text-[11px] text-slate-400 leading-relaxed px-0.5">Simplified for this demo — access is granted immediately. In production, the invitee must accept the request before the grant becomes active (BRD FR-M2-03).</p>
            </div>
          )}
          {accessTab === 'Access History' && (
            accessHistory.length === 0 ? <MEmpty title="No access events yet" subtitle="Grants and access changes will be logged here" icon={<History size={20} strokeWidth={1.75} />} /> : (
              <div className="space-y-2">
                {accessHistory.map(a => (
                  <div key={a.id} className="border border-slate-100 rounded-2xl p-3">
                    <div className="text-[12.5px] font-bold text-slate-700">{a.action}</div>
                    <div className="text-[11px] text-slate-400 mt-1">{new Date(a.timestamp).toLocaleString('en-IN')} · {a.user} · on {a.reference}</div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </Sheet>

      <Sheet open={sheet === 'grantAccess'} onClose={() => setSheet(null)} title="Grant Access">
        <div className="space-y-2.5">
          <label className="text-[12px] font-semibold text-slate-400">Person (UHID)</label>
          <select className="m-input" value={gaTargetUhid} onChange={e => setGaTargetUhid(e.target.value)}>
            <option value="">Select a family member, or enter UHID below</option>
            {linkableUhid.map(f => <option key={f.uhid} value={f.uhid}>{f.name} ({f.uhid})</option>)}
          </select>
          <input className="m-input" placeholder="Or type a UHID directly" value={linkableUhid.some(f => f.uhid === gaTargetUhid) ? '' : gaTargetUhid} onChange={e => setGaTargetUhid(e.target.value)} />
          <label className="text-[12px] font-semibold text-slate-400">Relationship</label>
          <select className="m-input" value={gaRelationship} onChange={e => setGaRelationship(e.target.value as AccessRelationship)}>
            {RELATIONSHIPS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <label className="text-[12px] font-semibold text-slate-400">Basis</label>
          <select className="m-input" value={gaBasis} onChange={e => setGaBasis(e.target.value as AccessBasis)}>
            <option value="Patient Consent">Patient Consent</option>
            <option value="Natural Guardianship">Natural Guardianship</option>
            <option value="Legal Guardianship">Legal Guardianship</option>
          </select>
          <label className="text-[12px] font-semibold text-slate-400">Scope</label>
          <div className="flex flex-wrap gap-2">
            {SCOPES.map(s => (
              <button key={s} onClick={() => toggleScope(s)} className={`px-3 py-1.5 rounded-xl text-[12px] font-bold border m-tap ${gaScope.includes(s) ? 'text-[var(--brand-teal)]' : 'border-slate-200 text-slate-600'}`}
                style={gaScope.includes(s) ? { borderColor: 'var(--brand-teal)', borderWidth: 2, background: 'var(--brand-teal-light)' } : undefined}>
                {s}
              </button>
            ))}
          </div>
          <label className="text-[12px] font-semibold text-slate-400">Expiry (optional)</label>
          <input type="date" className="m-input" value={gaValidUntil} onChange={e => setGaValidUntil(e.target.value)} />
          <label className="flex items-center gap-2.5 py-1 cursor-pointer">
            <input type="checkbox" className="w-4 h-4 accent-[var(--brand-teal)]" checked={gaRevocable} onChange={e => setGaRevocable(e.target.checked)} />
            <span className="text-[12.5px] font-semibold text-slate-600">Revocable by me at any time</span>
          </label>
          {gaResult && <div className={`text-[12.5px] rounded-xl p-3 font-medium ${gaResult.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{gaResult.message}</div>}
          {gaTargetUhid && gaScope.length > 0 && (
            <div className="rounded-2xl p-3 text-[12px] leading-relaxed m-rise" style={{ background: 'var(--surface-raised)' }}>
              <div className="font-bold text-slate-700 mb-1">You are about to share</div>
              <div className="text-slate-500"><b>{gaScope.join(', ')}</b> records with <b>{store.patients.find(x => x.uhid === gaTargetUhid)?.name || gaTargetUhid}</b>{gaValidUntil ? <> until <b>{gaValidUntil}</b></> : ' with no end date'}. {gaRevocable ? 'You can stop sharing any time in "Who Can Access My Records".' : 'This grant cannot be revoked by you.'}</div>
              <label className="flex items-start gap-2.5 mt-2.5 cursor-pointer">
                <input type="checkbox" className="mt-0.5 w-[18px] h-[18px] accent-[var(--brand-teal)] shrink-0" checked={gaConsent} onChange={e => setGaConsent(e.target.checked)} />
                <span className="text-slate-600">I consent to this sharing of my health records.</span>
              </label>
            </div>
          )}
          <button className="m-btn-primary" disabled={!gaTargetUhid || gaScope.length === 0 || !gaConsent} onClick={submitGrant}>Grant Access</button>
        </div>
      </Sheet>
    </div>
  );
}
