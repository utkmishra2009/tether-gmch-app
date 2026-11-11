import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStore, getSlotsForDoctor, dayCode, isPatientActivelyAdmitted, getAge } from '../data/store';
import { SYMPTOM_DEPARTMENT_MAP } from '../data/seed';
import { MPillBadge, StarRating } from '../components/bits';
import Sheet from '../components/Sheet';
import { haptic } from '../lib/haptics';
import { ChevronLeft, ChevronRight, AlertTriangle, Ban, BellRing, HelpCircle, Stethoscope, RotateCw, CalendarDays, Zap } from 'lucide-react';

const DEPARTMENTS = ['Cardiology', 'Orthopedics', 'General Medicine', 'Pediatrics', 'Gynaecology', 'Dermatology', 'General Surgery', 'ENT'];
const MIN_DATE = '2026-09-07';
const addDays = (iso: string, n: number) => { const d = new Date(iso + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const DAYS = Array.from({ length: 24 }, (_, i) => addDays(MIN_DATE, i));
const CONFETTI = ['#0e7c86', '#22b8c0', '#0f2a4a', '#f5b942', '#7c6cf0', '#10b981'].flatMap((c, i) => [0, 1].map(j => {
  const a = ((i * 2 + j) / 12) * Math.PI * 2 + 0.3, r = 90 + (j ? 30 : 0) + (i % 3) * 14;
  return { c, dx: Math.cos(a) * r, dy: Math.sin(a) * r - 20, rot: (i * 97 + j * 53) % 360, d: (i * 0.03 + j * 0.05) };
}));
const selStyle: React.CSSProperties = { borderColor: 'var(--brand-teal)', borderWidth: 2, background: 'var(--brand-teal-light)' };

export default function Book() {
  const store = useStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const patient = store.patients.find(p => p.uhid === store.currentPatientUhid)!;
  const headUhid = store.authedAsFamilyHead || patient.uhid;
  const family = store.patients.filter(p => p.uhid === headUhid || p.familyHeadUhid === headUhid);

  // Deep-link support from Discover "Book Appointment" CTA (?dept=<department>), and from the
  // "My Waitlist" → "Book Now" shortcut (?doctorId=<id>&date=<iso>) — Feature 5.
  const prefillDept = searchParams.get('dept') || '';
  const prefillDoctorId = searchParams.get('doctorId') || '';
  const prefillDate = searchParams.get('date') || '';
  const prefillDoctor = prefillDoctorId ? store.doctors.find(d => d.id === prefillDoctorId) : undefined;
  const [step, setStep] = useState(prefillDoctor ? 2 : (family.length === 1 ? 1 : 0));
  const [selectedPatient, setSelectedPatient] = useState(patient.uhid);
  const [dept, setDept] = useState(prefillDoctor ? prefillDoctor.department : (prefillDept && DEPARTMENTS.includes(prefillDept) ? prefillDept : ''));
  const [doctorId, setDoctorId] = useState(prefillDoctor ? prefillDoctor.id : '');
  const [date, setDate] = useState(prefillDoctor && prefillDate ? prefillDate : '2026-09-07');
  const [time, setTime] = useState('');
  const [waitlistMsg, setWaitlistMsg] = useState('');
  const [paymentOption, setPaymentOption] = useState<'Pay Now' | 'Pay Later' | ''>('Pay Now'); // smart default: one tap fewer
  const [bookError, setBookError] = useState('');
  const [confirmedApt, setConfirmedApt] = useState<any>(null);
  const [ackDuplicate, setAckDuplicate] = useState(false);
  const [ackAgeMismatch, setAckAgeMismatch] = useState(false);
  const [duesDismissed, setDuesDismissed] = useState(false);

  // Differentiator — Symptom → Department routing wizard: navigational help only, never a diagnosis.
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardSymptom, setWizardSymptom] = useState('');
  const wizardMatch = SYMPTOM_DEPARTMENT_MAP.find(s => s.symptom === wizardSymptom);
  const applyWizardDept = (d: string) => { setDept(d); setDoctorId(''); setWizardOpen(false); setWizardSymptom(''); };

  const bookingPatient = store.patients.find(p => p.uhid === selectedPatient)!;
  const doctor = store.doctors.find(d => d.id === doctorId);
  const slotInfo = doctor ? getSlotsForDoctor(doctor, date) : null;
  const steps = ['Patient', 'Doctor', 'Slot', 'Payer', 'Payment'];

  const familyUhids = family.map(f => f.uhid);

  // Faster booking — "Book again": last real visit in the family → doctor + earliest open slot, one tap.
  const lastVisit = useMemo(() => {
    const apt = [...store.appointments].filter(a => familyUhids.includes(a.patientUhid) && a.status !== 'Cancelled')
      .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time))[0];
    const doc = apt ? store.doctors.find(d => d.id === apt.doctorId) : undefined;
    if (!apt || !doc) return null;
    for (const iso of DAYS) {
      const info = getSlotsForDoctor(doc, iso);
      const slot = !info.reason ? info.slots.find(x => x.available) : undefined;
      if (slot) return { apt, doc, iso, time: slot.time };
    }
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.appointments, store.doctors, familyUhids.join(',')]);
  const earliest = useMemo(() => {
    if (!doctor) return null;
    for (const iso of DAYS) {
      const info = getSlotsForDoctor(doctor, iso);
      const slot = !info.reason ? info.slots.find(x => x.available) : undefined;
      if (slot) return { iso, time: slot.time };
    }
    return null;
  }, [doctor]);
  const rebook = () => {
    if (!lastVisit) return;
    haptic.commit();
    setSelectedPatient(lastVisit.apt.patientUhid); setDept(lastVisit.doc.department); setDoctorId(lastVisit.doc.id);
    setDate(lastVisit.iso); setTime(lastVisit.time); setStep(3);
  };

  // Smart Appointment Engine (BRD §7.4 / FR-M3 table)
  const activeAdmission = useMemo(() => isPatientActivelyAdmitted(store.ipVisits, selectedPatient), [store.ipVisits, selectedPatient]);
  const duplicateApt = useMemo(() => doctor ? store.appointments.find(a => a.patientUhid === selectedPatient && a.doctorId === doctorId && !['Cancelled', 'Consultation Completed', 'No Show'].includes(a.status)) : undefined, [store.appointments, selectedPatient, doctorId, doctor]);
  const bookingAge = getAge(bookingPatient.dob);
  const ageMismatch = useMemo(() => {
    if (!doctor) return false;
    const isPeds = doctor.department.includes('Pediatric');
    return (isPeds && bookingAge > 18) || (!isPeds && bookingAge < 12);
  }, [doctor, bookingAge]);
  const outstandingItems = useMemo(() => {
    const ipItems = store.ipBills.filter(b => familyUhids.includes(b.patientUhid) && b.balanceDue > 0).map(b => ({ label: `IP Bill ${b.ipNo}`, amount: b.balanceDue }));
    const invItems = store.investigations.filter(i => familyUhids.includes(i.patientUhid) && i.status === 'Pending Payment').map(i => ({ label: i.name, amount: i.charge }));
    const medItems = store.medicines.filter(m => familyUhids.includes(m.patientUhid) && m.status === 'Pending Payment').map(m => ({ label: m.medicine, amount: m.qty * m.unitPrice }));
    return [...ipItems, ...invItems, ...medItems];
  }, [store.ipBills, store.investigations, store.medicines, familyUhids]);
  const outstandingTotal = outstandingItems.reduce((s, i) => s + i.amount, 0);

  // Feature 5 — Waitlist: offered only when the doctor does hold OPD on this date (no leave/day-off
  // reason) but every generated slot is already booked, since only that case can genuinely free up
  // via a later cancellation/reschedule.
  const slotsFullyBooked = !!doctor && !!slotInfo && !slotInfo.reason && slotInfo.slots.length > 0 && slotInfo.slots.every(s => !s.available);
  const alreadyWaitlisted = doctor ? store.waitlist.some(w => w.patientUhid === selectedPatient && w.doctorId === doctor.id && w.date === date) : false;
  useEffect(() => { setWaitlistMsg(''); }, [doctorId, date, selectedPatient]);
  const joinWaitlist = () => {
    if (!doctor) return;
    const res = store.joinWaitlist(selectedPatient, doctor.id, date);
    setWaitlistMsg(res.message);
  };

  const smartEngineBlocking = step === 4 && (
    !!activeAdmission ||
    (!!duplicateApt && !ackDuplicate) ||
    (ageMismatch && !ackAgeMismatch) ||
    (outstandingItems.length > 0 && !duesDismissed)
  );

  const canContinue = [true, !!dept, !!doctorId && !!time, true, !!paymentOption && !smartEngineBlocking][step];

  const next = () => {
    if (step === 4) {
      if (activeAdmission) return; // hard block — never proceeds
      try {
        setBookError('');
        if (duplicateApt) store.pushAudit({ user: bookingPatient.name, role: 'Patient', action: `Smart Engine Override — Duplicate Appointment Warning confirmed (existing ${duplicateApt.id} with same doctor)`, reference: doctorId });
        if (ageMismatch) store.pushAudit({ user: bookingPatient.name, role: 'Patient', action: `Smart Engine Override — Age/Specialty Mismatch Warning confirmed (${doctor?.department})`, reference: doctorId });
        const apt = store.bookAppointment({ patientUhid: selectedPatient, doctorId, date, time, paymentOption: paymentOption as any });
        setConfirmedApt(apt); haptic.success();
      } catch (e: any) { setBookError(e.message); }
      return;
    }
    setStep(s => s + 1);
  };

  if (confirmedApt) {
    const payNow = confirmedApt.paymentOption === 'Pay Now';
    return (
      <div className="h-full flex flex-col px-5 pt-4 m-safe-bottom">
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="relative w-24 h-24 mb-6 flex items-center justify-center">
            <span className="m-burst" /><span className="m-burst b2" />
            {CONFETTI.map((c, i) => <span key={i} className="m-confetti" style={{ background: c.c, ['--dx' as any]: `${c.dx}px`, ['--dy' as any]: `${c.dy}px`, ['--rot' as any]: `${c.rot}deg`, animationDelay: `${0.2 + c.d}s` }} />)}
            <div className="relative w-24 h-24 rounded-full flex items-center justify-center m-pop" style={{ background: 'var(--grad-teal)', boxShadow: '0 14px 30px rgba(14,124,134,.35)' }}>
              <svg className="m-check-svg" width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
            </div>
          </div>
          <div className="m-display text-slate-800 m-rise" style={{ animationDelay: '.35s' }}>{payNow ? "You're all set" : 'Slot reserved'}</div>
          <div className="text-[14px] text-slate-500 mt-2 m-rise" style={{ animationDelay: '.45s' }}>{payNow ? 'Complete payment to receive your token.' : 'Pay at the counter and check in to get your token.'}</div>
          <div className="m-card w-full p-4 mt-7 text-left space-y-2.5 m-rise" style={{ animationDelay: '.55s' }}>
            <div className="flex justify-between text-[13.5px]"><span className="text-slate-400">Doctor</span><span className="font-bold text-slate-700">{doctor?.name}</span></div>
            <div className="flex justify-between text-[13.5px]"><span className="text-slate-400">When</span><span className="font-bold text-slate-700 m-num">{date} · {time}</span></div>
            <div className="flex justify-between text-[13.5px]"><span className="text-slate-400">Patient</span><span className="font-bold text-slate-700">{bookingPatient.name}</span></div>
            <div className="flex justify-between text-[13.5px]"><span className="text-slate-400">Reference</span><span className="font-bold text-slate-500 m-num">{confirmedApt.id}</span></div>
          </div>
        </div>
        <button className="m-btn-primary mb-3" onClick={() => navigate('/appointments')}>Go to My Visits</button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-3 pt-1 pb-3 shrink-0">
        <button onClick={() => step === 0 ? navigate(-1) : setStep(s => s - 1)} className="m-tap text-slate-500"><ChevronLeft size={24} strokeWidth={2} /></button>
        <div className="flex-1 flex gap-1.5">
          {steps.map((s, i) => <div key={s} className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-[var(--brand-teal)]' : 'bg-slate-200'}`} />)}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto m-noscroll pb-3">
        <div className="text-[12px] font-bold text-slate-400 uppercase mb-3">{steps[step]}</div>

        {step <= 1 && lastVisit && !doctorId && (
          <button onClick={rebook} className="m-quick w-full text-left p-4 mb-3 m-tap block">
            <div className="relative z-[1] flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[.08em] text-white/70"><RotateCw size={12} /> Book again</div>
            <div className="relative z-[1] m-heading text-white mt-1.5">{lastVisit.doc.name}</div>
            <div className="relative z-[1] text-[12.5px] text-white/70">{lastVisit.doc.department} · for {store.patients.find(x => x.uhid === lastVisit.apt.patientUhid)?.name.split(' ')[0]}</div>
            <div className="relative z-[1] mt-3 inline-flex items-center gap-1.5 bg-white/16 rounded-full pl-2.5 pr-3 py-1.5 text-[12.5px] font-bold text-white" style={{ background: 'rgba(255,255,255,.16)' }}><Zap size={13} /> Earliest {lastVisit.iso.slice(5)} · {lastVisit.time}</div>
          </button>
        )}
        {step === 0 && (
          <div className="space-y-2.5">
            {family.map(f => (
              <button key={f.uhid} onClick={() => { haptic.tick(); setSelectedPatient(f.uhid); }} className="w-full text-left m-card p-3.5 m-tap" style={selectedPatient === f.uhid ? selStyle : undefined}>
                <div className="font-bold text-slate-700 text-[14.5px]">{f.name} {f.relation && <span className="text-slate-400 font-medium">({f.relation})</span>}</div>
                <div className="text-[12px] text-slate-400">{f.uhid}</div>
              </button>
            ))}
          </div>
        )}

        {step === 1 && (
          <div className="grid grid-cols-2 gap-2.5">
            <button onClick={() => setWizardOpen(true)} className="col-span-2 m-card p-3 text-left m-tap flex items-center gap-2.5" style={{ background: 'var(--brand-teal-light)' }}>
              <HelpCircle size={19} className="text-[var(--brand-teal)] shrink-0" />
              <div className="flex-1">
                <div className="text-[13px] font-bold text-[var(--brand-teal)]">Not sure which department?</div>
                <div className="text-[11px] text-slate-500">Answer one quick question — we'll point you the right way</div>
              </div>
              <ChevronRight size={16} className="text-[var(--brand-teal)] shrink-0" />
            </button>
            {DEPARTMENTS.map(d => (
              <button key={d} onClick={() => { haptic.tick(); setDept(d); setDoctorId(''); }} className="m-card p-3 text-center m-tap" style={dept === d ? selStyle : undefined}>
                <div className="text-[13px] font-bold text-slate-700">{d}</div>
              </button>
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <div className="space-y-2.5">
              {store.doctors.filter(d => d.department === dept).map(d => (
                <button key={d.id} onClick={() => { haptic.tick(); setDoctorId(d.id); setTime(''); }} className="w-full text-left m-card p-3.5 m-tap" style={doctorId === d.id ? selStyle : undefined}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-bold text-slate-700 text-[14.5px]">{d.name}</div>
                    <StarRating avg={d.ratingAvg} count={d.ratingCount} />
                  </div>
                  <div className="text-[12px] text-slate-400">{d.unit} · {d.timing}</div>
                  <div className="text-[13.5px] m-num text-[var(--brand-teal)] mt-1">₹{d.fee}</div>
                </button>
              ))}
            </div>
            {doctor && (
              <>
                {earliest && (earliest.iso !== date || earliest.time !== time) && (
                  <button onClick={() => { haptic.commit(); setDate(earliest.iso); setTime(earliest.time); }} className="m-tap w-full flex items-center gap-2 text-left rounded-2xl px-3.5 py-3" style={{ background: 'var(--brand-teal-light)' }}>
                    <Zap size={16} className="text-[var(--brand-teal)] shrink-0" />
                    <span className="flex-1 text-[13px] font-bold text-[var(--brand-teal)]">Earliest available · {earliest.iso.slice(5)} at {earliest.time}</span>
                    <ChevronRight size={15} className="text-[var(--brand-teal)]" />
                  </button>
                )}
                <div className="flex items-center gap-1.5 text-[12px] font-bold text-slate-400 uppercase tracking-[.06em]"><CalendarDays size={13} /> Pick a day</div>
                <div className="m-daystrip m-noscroll" ref={el => { el?.querySelector('.m-day.active')?.scrollIntoView({ inline: 'center', block: 'nearest' }); }}>
                  {DAYS.map(iso => (
                    <button key={iso} className={`m-day ${iso === date ? 'active' : ''}`} onClick={() => { haptic.tick(); setDate(iso); setTime(''); }}>
                      <div className="d1">{dayCode(iso)}</div>
                      <div className="d2">{Number(iso.slice(8))}</div>
                    </button>
                  ))}
                </div>
                {slotInfo?.reason ? (
                  <div className="text-[12.5px] text-red-700 bg-red-50 rounded-xl p-3 font-medium">{slotInfo.reason}</div>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {slotInfo?.slots.map(sl => (
                      <button key={sl.time} disabled={!sl.available} onClick={() => { haptic.tick(); setTime(sl.time); }} className={`m-slot ${time === sl.time ? 'active' : ''}`}>
                        {sl.time}
                      </button>
                    ))}
                  </div>
                )}
                {slotsFullyBooked && doctor && (
                  <div className="rounded-2xl p-3.5 bg-sky-50 border border-sky-100 flex gap-2.5">
                    <BellRing size={18} className="text-sky-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-[12.5px] text-sky-700 font-medium leading-relaxed">All slots are booked for {doctor.name} on {date}.</div>
                      {alreadyWaitlisted ? (
                        <div className="text-[12px] font-bold text-sky-700 mt-1.5">You're on the waitlist — we'll notify you if a slot opens.</div>
                      ) : (
                        <button className="m-tap mt-2 text-[12.5px] font-bold text-sky-700 bg-white border border-sky-200 px-3 py-2 rounded-xl" onClick={joinWaitlist}>
                          Notify me if a slot opens
                        </button>
                      )}
                      {waitlistMsg && <div className="text-[11.5px] text-emerald-700 mt-1.5">{waitlistMsg}</div>}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {step === 3 && doctor && (
          <div className="space-y-3">
            <div className="m-card p-4 space-y-2 text-[13.5px]">
              <div className="flex justify-between"><span className="text-slate-400">Patient</span><span className="font-bold">{bookingPatient.name}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Doctor</span><span className="font-bold">{doctor.name}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Date/Time</span><span className="font-bold">{date} {time}</span></div>
              <div className="flex justify-between items-center"><span className="text-slate-400">Payer (locked)</span><MPillBadge text={bookingPatient.payer} tone="indigo" /></div>
              <div className="flex justify-between"><span className="text-slate-400">Tariff</span><span className="font-bold text-[var(--brand-teal)]">₹{doctor.fee}</span></div>
            </div>
            <div className="text-[12px] text-sky-700 bg-sky-50 rounded-xl p-3 font-medium">Payer and tariff are system-generated and locked — you cannot change them here.</div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-2.5">
            {activeAdmission && (
              <div className="rounded-2xl p-3.5 bg-red-50 border border-red-100 flex gap-2.5">
                <Ban size={18} className="text-red-600 shrink-0 mt-0.5" />
                <div className="text-[12.5px] text-red-700 font-medium leading-relaxed">
                  {bookingPatient.name} has an active IP admission ({activeAdmission.ipNo}, {activeAdmission.ward}) and cannot book an OPD appointment while admitted. Please contact the ward for consultation needs during this stay.
                </div>
              </div>
            )}
            {!activeAdmission && duplicateApt && (
              <label className="rounded-2xl p-3.5 bg-amber-50 border border-amber-100 flex gap-2.5 cursor-pointer">
                <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="text-[12.5px] text-amber-700 font-medium leading-relaxed">You already have an appointment with {doctor?.name} on {duplicateApt.date} ({duplicateApt.status}).</div>
                  <div className="flex items-center gap-2 mt-2">
                    <input type="checkbox" className="w-4 h-4 accent-amber-600" checked={ackDuplicate} onChange={e => setAckDuplicate(e.target.checked)} />
                    <span className="text-[12px] font-bold text-amber-700">Confirm anyway</span>
                  </div>
                </div>
              </label>
            )}
            {!activeAdmission && ageMismatch && (
              <label className="rounded-2xl p-3.5 bg-amber-50 border border-amber-100 flex gap-2.5 cursor-pointer">
                <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="text-[12.5px] text-amber-700 font-medium leading-relaxed">
                    You selected a {bookingAge > 18 ? 'Child' : 'Adult'} but are booking a {doctor?.department} doctor — confirm?
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <input type="checkbox" className="w-4 h-4 accent-amber-600" checked={ackAgeMismatch} onChange={e => setAckAgeMismatch(e.target.checked)} />
                    <span className="text-[12px] font-bold text-amber-700">Confirm anyway</span>
                  </div>
                </div>
              </label>
            )}
            {!activeAdmission && outstandingItems.length > 0 && !duesDismissed && (
              <div className="rounded-2xl p-3.5 bg-sky-50 border border-sky-100 space-y-2">
                <div className="text-[12.5px] text-sky-700 font-bold">Outstanding dues on your family account — ₹{outstandingTotal}</div>
                <div className="space-y-1">
                  {outstandingItems.map((it, i) => (
                    <div key={i} className="flex justify-between text-[12px] text-sky-700"><span>{it.label}</span><span className="font-bold">₹{it.amount}</span></div>
                  ))}
                </div>
                <div className="flex gap-2 pt-1">
                  <button className="m-btn-secondary flex-1 !py-2 !text-[12.5px]" onClick={() => setDuesDismissed(true)}>Dismiss & Continue</button>
                  <button className="m-btn-primary flex-1 !py-2 !text-[12.5px]" onClick={() => navigate('/health?tab=Bills')}>Pay Now</button>
                </div>
              </div>
            )}
            {!activeAdmission && (
              <>
                <button onClick={() => { haptic.tick(); setPaymentOption('Pay Now'); }} className="w-full text-left m-card p-4 m-tap" style={paymentOption === 'Pay Now' ? selStyle : undefined}>
                  <div className="font-bold text-slate-700">Pay Now</div>
                  <div className="text-[12px] text-slate-400 mt-1">Pay online now — appointment + token issued together on success.</div>
                </button>
                {store.enablePayLater && (
                  <button onClick={() => { haptic.tick(); setPaymentOption('Pay Later'); }} className="w-full text-left m-card p-4 m-tap" style={paymentOption === 'Pay Later' ? selStyle : undefined}>
                    <div className="font-bold text-slate-700">Pay Later</div>
                    <div className="text-[12px] text-slate-400 mt-1">Reserve now; token only after counter payment & check-in.</div>
                  </button>
                )}
              </>
            )}
            {bookError && <div className="text-[12.5px] text-red-700 bg-red-50 rounded-xl p-3 font-medium">{bookError}</div>}
          </div>
        )}
      </div>
      <div className="pt-2 m-safe-bottom shrink-0">
        <button className="m-btn-primary" disabled={!canContinue} onClick={next}>{step === 4 ? 'Confirm Booking' : 'Continue'}</button>
      </div>

      <Sheet open={wizardOpen} onClose={() => { setWizardOpen(false); setWizardSymptom(''); }} title="Find the Right Department">
        <div className="text-[12px] text-slate-500 bg-slate-50 rounded-xl p-3 mb-4 flex gap-2">
          <Stethoscope size={16} className="text-slate-400 shrink-0 mt-0.5" />
          <span>This is routing help, not a diagnosis. In a medical emergency, call your local emergency number or go to the nearest ER immediately.</span>
        </div>
        {!wizardMatch ? (
          <div className="space-y-2">
            <div className="text-[12px] font-bold text-slate-400 uppercase mb-1">What best describes it?</div>
            {SYMPTOM_DEPARTMENT_MAP.map(s => (
              <button key={s.symptom} onClick={() => setWizardSymptom(s.symptom)} className="w-full text-left m-card p-3 m-tap">
                <div className="text-[13.5px] font-semibold text-slate-700">{s.symptom}</div>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-2.5">
            <div className="text-[12px] font-bold text-slate-400 uppercase mb-1">Suggested department(s)</div>
            {wizardMatch.departments.map(d => (
              <button key={d} onClick={() => applyWizardDept(d)} className="w-full text-left m-card p-3.5 m-tap flex items-center justify-between">
                <div className="text-[14px] font-bold text-slate-700">{d}</div>
                <ChevronRight size={16} className="text-slate-300" />
              </button>
            ))}
            <button className="m-btn-ghost w-full !py-2 !text-[12.5px]" onClick={() => setWizardSymptom('')}>← Choose a different symptom</button>
          </div>
        )}
      </Sheet>
    </div>
  );
}
