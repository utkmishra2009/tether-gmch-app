import { haptic } from '../lib/haptics';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore, isChiefComplaintLocked, getQueueEstimate, getCancellationPolicy, getSlotsForDoctor, dayCode } from '../data/store';
import { CHIEF_COMPLAINT_OPTIONS } from '../data/seed';
import { ScreenHeader } from '../components/Shell';
import { MEmpty, MPillBadge, statusTone } from '../components/bits';
import Sheet from '../components/Sheet';
import PullToRefresh from '../components/PullToRefresh';
import { useSkeletonLoading, SkeletonList } from '../components/Skeleton';
import { CalendarPlus, Building2, ClipboardList, CalendarClock, Users2, Star, CheckCircle2 } from 'lucide-react';

const RESCHED_POLICY_TEXT = 'Free reschedule/cancellation up to 4 hours before your slot. Within 4 hours: cancellation fee of ₹100 applies (waived for Pay Later unpaid appointments). Maximum 2 reschedules per appointment.';

const selStyle: React.CSSProperties = { borderColor: 'var(--brand-teal)', borderWidth: 2, background: 'var(--brand-teal-light)' };

export default function Appointments() {
  const store = useStore();
  const navigate = useNavigate();
  const patient = store.patients.find(p => p.uhid === store.currentPatientUhid)!;
  const headUhid = store.authedAsFamilyHead || patient.uhid;
  const family = store.patients.filter(p => p.uhid === headUhid || p.familyHeadUhid === headUhid).map(p => p.uhid);
  const list = store.appointments.filter(a => family.includes(a.patientUhid)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const [loading, refresh] = useSkeletonLoading();

  // Feature 5 — My Waitlist: doctor/date combos the family is waiting on for a slot to open up.
  const myWaitlist = store.waitlist.filter(w => family.includes(w.patientUhid)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  // BRD FR-M10-04 — mandatory (soft) OP post-consultation feedback gate: nudge for the most recent
  // completed OP appointment that has no feedback recorded against it yet.
  const feedbackGateApt = store.mandatoryFeedbackGateOpPost
    ? list.find(a => a.status === 'Consultation Completed' && !store.feedback.some(f => f.appointmentId === a.id))
    : undefined;

  const [ccAptId, setCcAptId] = useState<string | null>(null);
  const [ccSelected, setCcSelected] = useState<string[]>([]);
  const [ccFreeText, setCcFreeText] = useState('');
  const ccApt = store.appointments.find(a => a.id === ccAptId);
  const ccExisting = ccAptId ? store.getChiefComplaint(ccAptId) : undefined;
  const ccLocked = ccApt ? isChiefComplaintLocked(ccApt) : false;

  const openChiefComplaint = (id: string) => {
    const existing = store.getChiefComplaint(id);
    setCcSelected(existing?.predefinedItems || []);
    setCcFreeText(existing?.freeText || '');
    setCcAptId(id);
  };
  const toggleCcItem = (item: string) => setCcSelected(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
  const submitCc = () => {
    if (!ccAptId) return;
    store.submitChiefComplaint(ccAptId, { predefinedItems: ccSelected, freeText: ccFreeText });
    setCcAptId(null);
  };

  const [activeId, setActiveId] = useState<string | null>(null);
  const [payResult, setPayResult] = useState<'idle' | 'processing' | 'done'>('idle');
  const [counterStep, setCounterStep] = useState<'none' | 'verify' | 'reconcile' | 'done'>('none');
  const [finalTariff, setFinalTariff] = useState(0);
  const [newPayer, setNewPayer] = useState<'Cash' | 'RGHS' | 'TPA' | ''>('');

  const active = store.appointments.find(a => a.id === activeId);
  const activeDoctor = active ? store.doctors.find(d => d.id === active.doctorId) : null;
  const activePatient = active ? store.patients.find(p => p.uhid === active.patientUhid) : null;

  const openDetail = (id: string) => {
    setActiveId(id); setPayResult('idle'); setCounterStep('none');
    const apt = store.appointments.find(a => a.id === id);
    if (apt) { setFinalTariff(apt.finalTariff || 0); setNewPayer(apt.payer); }
  };

  const [rcAptId, setRcAptId] = useState<string | null>(null);
  const [rcMode, setRcMode] = useState<'menu' | 'reschedule' | 'cancel-confirm' | 'done'>('menu');
  const [rcDate, setRcDate] = useState('');
  const [rcTime, setRcTime] = useState('');
  const [rcResult, setRcResult] = useState<{ ok: boolean; message: string } | null>(null);
  const rcApt = store.appointments.find(a => a.id === rcAptId);
  const rcDoctor = rcApt ? store.doctors.find(d => d.id === rcApt.doctorId) : null;
  const rcPolicy = rcApt ? getCancellationPolicy(rcApt) : null;
  const rcSlotInfo = rcDoctor && rcDate ? getSlotsForDoctor(rcDoctor, rcDate) : null;

  const openManage = (id: string) => {
    const apt = store.appointments.find(a => a.id === id);
    setRcAptId(id); setRcMode('menu'); setRcResult(null);
    setRcDate(apt?.date || ''); setRcTime('');
  };
  const submitReschedule = () => {
    if (!rcAptId || !rcDate || !rcTime) return;
    const res = store.rescheduleAppointment(rcAptId, rcDate, rcTime);
    setRcResult(res); if (res.ok) setRcMode('done');
  };
  const submitCancel = () => {
    if (!rcAptId) return;
    const res = store.cancelAppointment(rcAptId);
    setRcResult(res); setRcMode('done');
  };

  const doPayNow = (result: 'success' | 'failed' | 'timeout') => {
    setPayResult('processing');
    setTimeout(() => { store.payNow(activeId!, result); setPayResult('done'); result === 'success' ? haptic.success() : haptic.warn(); }, 600);
  };
  const doCounterCollect = () => { store.counterCollectPayLater(activeId!); setCounterStep('done'); };
  const doReconcile = () => { store.reconcileAtCounter(activeId!, finalTariff, newPayer || undefined); setCounterStep('done'); };

  return (
    <PullToRefresh onRefresh={refresh}>
    <div>
      <ScreenHeader title="My Visits" subtitle={`${list.length} appointment(s)`} right={
        <button onClick={() => navigate('/appointments/book')} className="w-10 h-10 rounded-full bg-[var(--brand-teal)] text-white flex items-center justify-center m-tap shadow-[0_2px_8px_rgba(14,124,134,0.3)]"><CalendarPlus size={20} strokeWidth={1.9} /></button>
      } />
      {loading ? <SkeletonList count={3} /> : (
      <>
      {feedbackGateApt && (() => {
        const doc = store.doctors.find(d => d.id === feedbackGateApt.doctorId);
        return (
          <button onClick={() => navigate('/care?tab=Feedback')} className="w-full text-left rounded-2xl p-3.5 mb-3 bg-amber-50 border border-amber-100 flex gap-2.5 m-tap">
            <Star size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1 text-[12.5px] text-amber-700 font-medium leading-relaxed">
              How was your consultation with {doc?.name}? Please share your feedback — it helps us improve.
            </div>
          </button>
        );
      })()}
      {myWaitlist.length > 0 && (
        <div className="mb-4">
          <div className="text-[12px] font-bold text-slate-400 uppercase mb-2">My Waitlist</div>
          <div className="space-y-2">
            {myWaitlist.map(w => {
              const doc = store.doctors.find(d => d.id === w.doctorId);
              const pt = store.patients.find(p => p.uhid === w.patientUhid);
              return (
                <div key={w.id} className="m-card p-3.5 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-[13px] font-bold text-slate-700 truncate">{doc?.name}</div>
                    <div className="text-[11.5px] text-slate-400 truncate">{pt?.name} · {w.date}</div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <button className="text-[11.5px] font-bold text-[var(--brand-teal)] m-tap" onClick={() => navigate(`/appointments/book?doctorId=${w.doctorId}&date=${w.date}`)}>Book Now</button>
                    <button className="text-[11.5px] font-bold text-red-500 m-tap" onClick={() => store.cancelWaitlistEntry(w.id)}>Cancel</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {list.length === 0 ? (
        <MEmpty
          title="No appointments yet"
          subtitle="Book your first visit to see it here"
          icon={<CalendarPlus size={20} strokeWidth={1.75} />}
          actionLabel="Book a Visit"
          onAction={() => navigate('/appointments/book')}
        />
      ) : (
        <div className="space-y-2.5">
          {list.map(a => {
            const doc = store.doctors.find(d => d.id === a.doctorId);
            const pt = store.patients.find(p => p.uhid === a.patientUhid);
            const notYetCheckedIn = !['Cancelled', 'No Show'].includes(a.status) && !isChiefComplaintLocked(a);
            const cc = store.chiefComplaints.find(c => c.appointmentId === a.id);
            const queue = getQueueEstimate(store.appointments, a);
            return (
              <div key={a.id} className="w-full m-card p-3.5 text-left">
                <button onClick={() => openDetail(a.id)} className="w-full text-left m-tap">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11.5px] font-bold text-slate-400">{a.id}</span>
                    <MPillBadge text={a.status} tone={statusTone(a.status)} />
                  </div>
                  <div className="font-bold text-slate-800 text-[14.5px]">{doc?.name}</div>
                  <div className="text-[12.5px] text-slate-400 mt-0.5">{pt?.name} · {doc?.department} · {a.date} {a.time}</div>
                  {a.token && <div className="mt-2 inline-block bg-[var(--brand-teal-light)] text-[var(--brand-teal)] text-[11.5px] font-bold px-2.5 py-1 rounded-full">Token {a.token}</div>}
                </button>
                {queue && store.enableLiveQueue && (
                  <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center gap-2 text-[12px]">
                    <Users2 size={16} strokeWidth={1.9} className="text-[var(--brand-teal)] shrink-0" />
                    <span className="text-slate-600">Current token: <b className="text-slate-800">{queue.currentToken}</b> · Your token: <b className="text-slate-800">{queue.myToken}</b> · Approx. wait: <b className="text-slate-800">{queue.waitMinutes} min</b></span>
                  </div>
                )}
                {notYetCheckedIn && (
                  <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center gap-3">
                    <button onClick={() => openChiefComplaint(a.id)} className="flex-1 flex items-center gap-1.5 text-[12.5px] font-bold text-[var(--brand-teal)] m-tap">
                      <ClipboardList size={16} strokeWidth={1.9} /> {cc ? 'Edit Chief Complaint' : 'Add Chief Complaint'}
                    </button>
                    <button onClick={() => openManage(a.id)} className="flex items-center gap-1.5 text-[12.5px] font-bold text-slate-500 m-tap">
                      <CalendarClock size={16} strokeWidth={1.9} /> Reschedule/Cancel
                    </button>
                  </div>
                )}
                {!notYetCheckedIn && cc && (
                  <button onClick={() => openChiefComplaint(a.id)} className="mt-2.5 pt-2.5 border-t border-slate-100 w-full flex items-center gap-1.5 text-[12.5px] font-bold text-slate-500 m-tap">
                    <ClipboardList size={16} strokeWidth={1.9} /> View Chief Complaint
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
      </>
      )}

      <Sheet open={!!active} onClose={() => setActiveId(null)} title={active?.id}>
        {active && activeDoctor && activePatient && (
          <div className="space-y-3">
            <div className="bg-slate-50 rounded-2xl p-3.5 text-[13.5px] space-y-2">
              <Row label="Patient" value={activePatient.name} />
              <Row label="Doctor" value={`${activeDoctor.name} (${activeDoctor.department})`} />
              <Row label="Date/Time" value={`${active.date} · ${active.time}`} />
              <Row label="Payer" value={<MPillBadge text={active.payer} tone="indigo" />} />
              <Row label="Online Paid" value={`₹${active.onlinePaid}`} />
              <Row label="Status" value={<MPillBadge text={active.status} tone={statusTone(active.status)} />} />
              {active.token && <Row label="Token" value={<MPillBadge text={active.token} tone="teal" />} />}
            </div>

            {active.status === 'Appointment Requested' && payResult === 'idle' && (
              <div className="space-y-2">
                <div className="text-[12.5px] text-sky-700 bg-sky-50 rounded-xl p-3 font-medium">Redirecting to mock Payment Gateway for ₹{activeDoctor.fee}.</div>
                <button className="m-btn-primary" onClick={() => doPayNow('success')}>Simulate Payment Success</button>
                <div className="flex gap-2">
                  <button className="m-btn-danger-outline flex-1 !py-2.5 !text-[13px]" onClick={() => doPayNow('failed')}>Simulate Failure</button>
                  <button className="m-btn-secondary flex-1 !py-2.5 !text-[13px]" onClick={() => doPayNow('timeout')}>Simulate Timeout</button>
                </div>
              </div>
            )}
            {payResult === 'processing' && <div className="text-[13px] text-slate-500 text-center py-2">Processing payment…</div>}
            {payResult === 'done' && active.status === 'Token Generated' && (<div className="m-rise flex flex-col items-center text-center py-3"><div className="w-14 h-14 rounded-full flex items-center justify-center m-pop" style={{ background: 'var(--grad-teal)', boxShadow: '0 10px 22px rgba(14,124,134,.3)' }}><svg className="m-check-svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg></div><div className="m-heading text-slate-800 mt-3">Payment successful</div><div className="text-[13px] text-slate-500 mt-1">Appointment confirmed · token <span className="font-bold m-num">{active.token}</span></div></div>)}
            {payResult === 'done' && active.status === 'Cancelled' && <Banner tone="red">Payment failed/timed out. No appointment or token created.</Banner>}

            {active.status === 'Payment Pending' && counterStep === 'none' && (
              <div className="space-y-2">
                <Banner tone="amber">Pay Later reservation — no token yet.</Banner>
                <button className="m-btn-primary flex items-center justify-center gap-2" onClick={() => setCounterStep('verify')}><Building2 size={16} /> Simulate Counter Arrival</button>
              </div>
            )}
            {counterStep === 'verify' && <button className="m-btn-primary" onClick={doCounterCollect}>Collect Payment & Check-in</button>}
            {counterStep === 'done' && active.paymentOption === 'Pay Later' && <Banner tone="emerald">Counter payment collected. Token {active.token} issued.</Banner>}

            {active.status === 'Token Generated' && active.paymentOption === 'Pay Now' && counterStep === 'none' && (
              <button className="m-btn-secondary flex items-center justify-center gap-2" onClick={() => setCounterStep('reconcile')}><Building2 size={16} /> Simulate Counter Visit</button>
            )}
            {counterStep === 'reconcile' && (
              <div className="space-y-2.5 border-t border-slate-100 pt-3">
                <div className="text-[13.5px] font-bold text-slate-700">Tariff Reconciliation</div>
                <select className="m-input" value={newPayer} onChange={e => setNewPayer(e.target.value as any)}>
                  <option value="Cash">Cash</option><option value="RGHS">RGHS</option><option value="TPA">TPA</option>
                </select>
                <input type="number" className="m-input" value={finalTariff} onChange={e => setFinalTariff(Number(e.target.value))} />
                <div className="text-[12px] text-slate-500">Diff: {finalTariff - active.onlinePaid > 0 ? `Collect ₹${finalTariff - active.onlinePaid}` : finalTariff - active.onlinePaid < 0 ? `Refund ₹${active.onlinePaid - finalTariff}` : 'Exact'}</div>
                <button className="m-btn-primary" onClick={doReconcile}>Confirm & Issue Slip</button>
              </div>
            )}
            {counterStep === 'done' && active.status === 'Checked-in' && <Banner tone="emerald">Reconciliation complete. Final OPD slip issued.</Banner>}
          </div>
        )}
      </Sheet>

      <Sheet open={!!ccAptId} onClose={() => setCcAptId(null)} title="Chief Complaint">
        {ccApt && (
          <div className="space-y-3.5">
            <div className="text-[12.5px] text-slate-400">{ccApt.id} · {ccApt.date} {ccApt.time}</div>
            {ccLocked ? (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {(ccExisting?.predefinedItems.length ? ccExisting.predefinedItems : ['None selected']).map(item => (
                    <MPillBadge key={item} text={item} tone="slate" />
                  ))}
                </div>
                <div className="text-[13.5px] text-slate-600">{ccExisting?.freeText || 'No additional notes provided.'}</div>
                <div className="text-[12px] text-amber-700 bg-amber-50 rounded-xl p-3 font-medium">Locked after check-in — please inform your doctor directly of any changes.</div>
              </div>
            ) : (
              <div className="space-y-3.5">
                <div>
                  <div className="text-[12px] font-bold text-slate-400 uppercase mb-2">Select what applies</div>
                  <div className="flex flex-wrap gap-2">
                    {CHIEF_COMPLAINT_OPTIONS.map(item => (
                      <button key={item} onClick={() => toggleCcItem(item)}
                        className={`px-3 py-1.5 rounded-xl text-[12.5px] font-bold border m-tap ${ccSelected.includes(item) ? '' : 'border-slate-200 text-slate-600'}`}
                        style={ccSelected.includes(item) ? selStyle : undefined}>
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-[12px] font-bold text-slate-400 uppercase mb-2">Anything else you'd like the doctor to know?</div>
                  <textarea className="m-input" rows={3} placeholder="Optional free text" value={ccFreeText} onChange={e => setCcFreeText(e.target.value)} />
                </div>
                <button className="m-btn-primary" disabled={ccSelected.length === 0 && !ccFreeText.trim()} onClick={submitCc}>Save Chief Complaint</button>
              </div>
            )}
          </div>
        )}
      </Sheet>

      <Sheet open={!!rcAptId} onClose={() => setRcAptId(null)} title="Reschedule / Cancel">
        {rcApt && rcDoctor && rcPolicy && (
          <div className="space-y-3.5">
            <div className="text-[12.5px] text-slate-400">{rcApt.id} · {rcDoctor.name} · {rcApt.date} {rcApt.time}</div>
            <div className="text-[12px] text-slate-500 bg-slate-50 rounded-xl p-3 leading-relaxed">{RESCHED_POLICY_TEXT}</div>
            <div className="flex items-center gap-2 text-[12.5px] font-semibold">
              <span className={rcPolicy.withinFreeWindow ? 'text-emerald-600' : 'text-amber-600'}>
                {rcPolicy.withinFreeWindow ? 'You are in the free window — no fee applies.' : `Within 4 hours of your slot — a ₹${rcPolicy.fee > 0 ? rcPolicy.fee : 100} fee may apply (waived for unpaid Pay Later).`}
              </span>
            </div>

            {rcMode === 'menu' && (
              <div className="space-y-2 pt-1">
                <button className="m-btn-primary" disabled={rcApt.rescheduleCount >= 2} onClick={() => setRcMode('reschedule')}>
                  Reschedule{rcApt.rescheduleCount > 0 ? ` (${rcApt.rescheduleCount}/2 used)` : ''}
                </button>
                {rcApt.rescheduleCount >= 2 && <div className="text-[11.5px] text-red-600 font-medium">Maximum 2 reschedules reached for this appointment.</div>}
                <button className="m-btn-danger-outline" onClick={() => setRcMode('cancel-confirm')}>Cancel Appointment</button>
              </div>
            )}

            {rcMode === 'reschedule' && (
              <div className="space-y-2.5">
                <input type="date" className="m-input" value={rcDate} onChange={e => { setRcDate(e.target.value); setRcTime(''); }} min="2026-09-07" max="2026-09-30" />
                <div className="text-[11.5px] text-slate-400">Day: {dayCode(rcDate)}</div>
                {rcSlotInfo?.reason ? (
                  <div className="text-[12.5px] text-red-700 bg-red-50 rounded-xl p-3 font-medium">{rcSlotInfo.reason}</div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {rcSlotInfo?.slots.map(s => (
                      <button key={s.time} disabled={!s.available} onClick={() => setRcTime(s.time)}
                        className={`px-3 py-2 rounded-xl text-[12.5px] font-bold border m-tap ${!s.available ? 'bg-slate-100 text-slate-300 border-slate-100 line-through' : rcTime === s.time ? 'bg-[var(--brand-teal)] text-white border-[var(--brand-teal)]' : 'border-slate-200 text-slate-600'}`}>
                        {s.time}
                      </button>
                    ))}
                  </div>
                )}
                {rcResult && !rcResult.ok && <div className="text-[12.5px] text-red-700 bg-red-50 rounded-xl p-3 font-medium">{rcResult.message}</div>}
                <button className="m-btn-primary" disabled={!rcTime} onClick={submitReschedule}>Confirm Reschedule</button>
              </div>
            )}

            {rcMode === 'cancel-confirm' && (
              <div className="space-y-2.5">
                <div className="text-[12.5px] text-red-700 bg-red-50 rounded-xl p-3 font-medium">Are you sure you want to cancel this appointment? {rcPolicy.fee > 0 ? `A ₹${rcPolicy.fee} cancellation fee applies.` : 'No fee applies.'}</div>
                <button className="m-btn-danger" onClick={submitCancel}>Yes, Cancel Appointment</button>
                <button className="m-btn-secondary" onClick={() => setRcMode('menu')}>Go Back</button>
              </div>
            )}

            {rcMode === 'done' && rcResult && (
              <div className="space-y-3">
                <div className={`text-[12.5px] rounded-xl p-3 font-medium ${rcResult.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{rcResult.message}</div>
                <button className="m-btn-secondary" onClick={() => setRcAptId(null)}>Close</button>
              </div>
            )}
          </div>
        )}
      </Sheet>
    </div>
    </PullToRefresh>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="flex items-center justify-between"><span className="text-slate-400 font-medium">{label}</span><span className="font-bold text-slate-700">{value}</span></div>;
}
function Banner({ tone, children }: { tone: 'emerald' | 'red' | 'amber' | 'sky'; children: React.ReactNode }) {
  const map = { emerald: 'bg-emerald-50 text-emerald-700', red: 'bg-red-50 text-red-700', amber: 'bg-amber-50 text-amber-700', sky: 'bg-sky-50 text-sky-700' };
  return (
    <div className={`text-[12.5px] rounded-xl p-3 font-medium flex items-start gap-2 m-rise ${map[tone]}`}>
      {tone === 'emerald' && <CheckCircle2 size={16} strokeWidth={2} className="shrink-0 mt-0.5 m-pop" />}
      <span>{children}</span>
    </div>
  );
}
