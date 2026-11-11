import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useStore } from '../data/store';
import { departmentMapping } from '../data/seed';
import { ScreenHeader } from '../components/Shell';
import { MSegmented, MEmpty, MPillBadge, statusTone } from '../components/bits';
import Sheet from '../components/Sheet';
import { Star, Zap, MessageSquareText, ClipboardList, MessageCircleWarning } from 'lucide-react';

const TABS = ['Feedback', 'Requests', 'Complaints'];
const SERVICE_MASTER = [
  { name: 'Doctor Consultation', dept: 'Consultation', applicable: ['IPD', 'OPD'] },
  { name: 'Nursing', dept: 'Nursing', applicable: ['IPD'] },
  { name: 'Laboratory', dept: 'Laboratory', applicable: ['IPD', 'OPD'] },
  { name: 'Housekeeping', dept: 'Housekeeping', applicable: ['IPD'] },
  { name: 'Billing', dept: 'Billing', applicable: ['IPD', 'OPD'] },
  { name: 'Pharmacy', dept: 'Pharmacy', applicable: ['IPD', 'OPD'] },
];
const REQ_CATEGORIES = [
  { name: 'Housekeeping', dept: 'Housekeeping' }, { name: 'Linen', dept: 'Housekeeping' },
  { name: 'Room/Bed Issue', dept: 'Facilities' }, { name: 'Maintenance', dept: 'Facilities' },
  { name: 'Nursing Assistance', dept: 'Nursing' }, { name: 'Wheelchair', dept: 'Nursing' },
];
const CMP_CATEGORIES = Object.keys(departmentMapping);

function slaMinsLeft(deadline: string) { return Math.round((new Date(deadline).getTime() - Date.now()) / 60000); }

export default function Care() {
  const store = useStore();
  const [params] = useSearchParams();
  const [tab, setTab] = useState(TABS.includes(params.get('tab') || '') ? (params.get('tab') as string) : 'Feedback');
  const patient = store.patients.find(p => p.uhid === store.currentPatientUhid)!;

  // Feedback
  const applicable = SERVICE_MASTER.filter(s => s.applicable.includes(patient.patientType));
  const [service, setService] = useState('');
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const myFeedback = store.feedback.filter(f => f.patientUhid === patient.uhid);
  const submitFb = () => {
    const svc = applicable.find(s => s.name === service); if (!svc || !rating) return;
    // Link Doctor Consultation feedback to the most recent completed appointment awaiting feedback (BRD FR-M10-04).
    const gateApt = svc.name === 'Doctor Consultation'
      ? store.appointments.find(a => a.patientUhid === patient.uhid && a.status === 'Consultation Completed' && !store.feedback.some(f => f.appointmentId === a.id))
      : undefined;
    store.submitFeedback(svc.name, svc.dept, rating, comment, gateApt?.id);
    setService(''); setRating(0); setComment('');
  };

  // Requests
  const [reqCategory, setReqCategory] = useState('');
  const [reqDesc, setReqDesc] = useState('');
  const myRequests = store.serviceRequests.filter(r => r.patientUhid === patient.uhid);
  const submitReq = () => { const cat = REQ_CATEGORIES.find(c => c.name === reqCategory); if (!cat || !reqDesc) return; store.submitServiceRequest(cat.name, cat.dept, reqDesc); setReqCategory(''); setReqDesc(''); };

  // Complaints
  const [cmpCategory, setCmpCategory] = useState('');
  const [cmpDesc, setCmpDesc] = useState('');
  const myComplaints = store.complaints.filter(c => c.patientUhid === patient.uhid);
  const submitCmp = () => { if (!cmpCategory || !cmpDesc) return; store.submitComplaint(cmpCategory, cmpCategory, cmpDesc); setCmpCategory(''); setCmpDesc(''); };
  const [activeCmpId, setActiveCmpId] = useState<string | null>(null);
  const activeCmp = myComplaints.find(c => c.id === activeCmpId);

  return (
    <div>
      <ScreenHeader title="Care" subtitle="Feedback, requests & complaints" />
      <div className="mb-4"><MSegmented options={TABS} value={tab} onChange={setTab} /></div>

      {tab === 'Feedback' && (
        <div className="space-y-4">
          <div className="m-card p-4 space-y-3">
            <select className="m-input" value={service} onChange={e => setService(e.target.value)}>
              <option value="">Select service</option>
              {applicable.map(s => <option key={s.name}>{s.name}</option>)}
            </select>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map(n => <button key={n} onClick={() => setRating(n)}><Star size={26} className={n <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'} /></button>)}
            </div>
            <textarea className="m-input" rows={2} placeholder="Comments" value={comment} onChange={e => setComment(e.target.value)} />
            {rating > 0 && rating <= 2 && <div className="text-[12px] text-amber-700 bg-amber-50 rounded-xl p-2.5 font-medium">Low rating will auto-escalate to a Service Request.</div>}
            <button className="m-btn-primary" disabled={!service || !rating} onClick={submitFb}>Submit Feedback</button>
          </div>
          {myFeedback.length === 0 ? <MEmpty title="No feedback yet" subtitle="Rate a service above to help us improve" icon={<MessageSquareText size={20} strokeWidth={1.75} />} /> : (
            <div className="space-y-2">
              {myFeedback.map(f => (
                <div key={f.id} className="m-card p-3.5">
                  <div className="flex justify-between items-center"><span className="text-[13px] font-bold text-slate-700">{f.service}</span><MPillBadge text={f.status} tone={statusTone(f.status)} /></div>
                  <div className="text-[12px] text-slate-400 mt-1">{'★'.repeat(f.rating)}{'☆'.repeat(5 - f.rating)} · "{f.comment}"</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'Requests' && (
        patient.patientType !== 'IPD' ? <MEmpty title="Not applicable" subtitle="IPD service requests apply to admitted patients." /> : (
          <div className="space-y-4">
            <div className="m-card p-4 space-y-3">
              <select className="m-input" value={reqCategory} onChange={e => setReqCategory(e.target.value)}>
                <option value="">Select category</option>
                {REQ_CATEGORIES.map(c => <option key={c.name}>{c.name}</option>)}
              </select>
              <textarea className="m-input" rows={2} placeholder="Describe the request" value={reqDesc} onChange={e => setReqDesc(e.target.value)} />
              <button className="m-btn-primary" disabled={!reqCategory || !reqDesc} onClick={submitReq}>Submit Request</button>
            </div>
            {myRequests.length === 0 ? <MEmpty title="No requests raised" subtitle="Submit a request above and track it here" icon={<ClipboardList size={20} strokeWidth={1.75} />} /> : (
              <div className="space-y-2">
                {myRequests.map(r => (
                  <div key={r.id} className="m-card p-3.5">
                    <div className="flex justify-between items-center"><span className="text-[13px] font-bold text-slate-700">{r.id} — {r.category}</span><MPillBadge text={r.status} tone={statusTone(r.status)} /></div>
                    <div className="text-[12px] text-slate-400 mt-1">{r.description}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      )}

      {tab === 'Complaints' && (
        <div className="space-y-4">
          <div className="m-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-bold text-slate-400 uppercase">Raise Complaint</span>
              <button className="flex items-center gap-1 text-[11.5px] font-bold text-[var(--brand-teal)]" onClick={() => store.escalateOverdueComplaints()}><Zap size={12} /> Run SLA Check</button>
            </div>
            <select className="m-input" value={cmpCategory} onChange={e => setCmpCategory(e.target.value)}>
              <option value="">Select category</option>
              {CMP_CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <textarea className="m-input" rows={2} placeholder="Describe the complaint" value={cmpDesc} onChange={e => setCmpDesc(e.target.value)} />
            <button className="m-btn-primary" disabled={!cmpCategory || !cmpDesc} onClick={submitCmp}>Submit Complaint</button>
          </div>
          {myComplaints.length === 0 ? <MEmpty title="No complaints raised" subtitle="Raise a complaint above and track its resolution here" icon={<MessageCircleWarning size={20} strokeWidth={1.75} />} /> : (
            <div className="space-y-2">
              {myComplaints.map(c => {
                const mins = slaMinsLeft(c.slaDeadline);
                const breached = mins <= 0 || c.status === 'SLA Breached';
                return (
                  <button key={c.id} onClick={() => setActiveCmpId(c.id)} className="w-full text-left m-card p-3.5 m-tap">
                    <div className="flex justify-between items-center"><span className="text-[13px] font-bold text-slate-700">{c.id} · {c.category} <span className="text-[10.5px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full ml-1">{c.level}</span></span></div>
                    <div className="text-[12px] text-slate-400 mt-1 truncate">{c.description}</div>
                    <div className="flex items-center gap-2 mt-2">
                      {!['Closed', 'Resolved'].includes(c.status) && <MPillBadge text={breached ? `Breached` : `${mins}m left`} tone={breached ? 'red' : mins < 15 ? 'amber' : 'emerald'} />}
                      <MPillBadge text={c.status} tone={statusTone(c.status)} />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      <Sheet open={!!activeCmpId} onClose={() => setActiveCmpId(null)} title={activeCmp?.id}>
        {activeCmp && (
          <div className="space-y-3">
            <div className="text-[13px] text-slate-600">{activeCmp.category} · {activeCmp.description}</div>
            <div className="flex items-center gap-2"><MPillBadge text={activeCmp.status} tone={statusTone(activeCmp.status)} /><MPillBadge text={`L${activeCmp.level.slice(1)}`} tone="slate" /></div>
            <div className="text-[12px] text-slate-400">Responsible: {activeCmp.responsiblePerson}</div>
            {activeCmp.response && <div className="text-[12.5px] text-sky-700 bg-sky-50 rounded-xl p-3 font-medium">Response: {activeCmp.response}</div>}
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase mb-2">Timeline</div>
              <div className="space-y-2.5">
                {activeCmp.timeline.map((e, i) => (
                  <div key={i} className="flex gap-2.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--brand-teal)] mt-1.5 shrink-0" />
                    <div>
                      <div className="text-[13px] font-semibold text-slate-700">{e.label}</div>
                      <div className="text-[11px] text-slate-400">{new Date(e.timestamp).toLocaleString('en-IN')}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {activeCmp.status === 'Response Provided' && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="text-[13px] font-bold text-slate-700">Satisfied with this response?</div>
                <div className="flex gap-2">
                  <button className="m-btn-primary flex-1" onClick={() => store.patientConfirmComplaint(activeCmp.id, true)}>Satisfied</button>
                  <button className="m-btn-danger-outline flex-1" onClick={() => store.patientConfirmComplaint(activeCmp.id, false)}>Not Satisfied</button>
                </div>
              </div>
            )}
          </div>
        )}
      </Sheet>
    </div>
  );
}
