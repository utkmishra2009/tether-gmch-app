import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useStore } from '../../data/store';
import { seedStaff } from '../../data/seed';
import { ScreenHeader } from '../../components/Shell';
import { MSegmented, MPillBadge } from '../../components/bits';
import Sheet from '../../components/Sheet';
import { ChevronLeft } from 'lucide-react';
import type {
  ServiceMasterEntry, DepartmentMappingEntry, SLAMasterEntry, NotificationMasterEntry,
  PayerMasterEntry, TariffMasterEntry, FeedbackMasterEntry, ComplaintCategoryMasterEntry, SelfRegistrationMode,
} from '../../data/types';

const TABS = ['Services', 'Dept. Mapping', 'SLA Master', 'Notifications', 'Payer Master', 'Tariff Master', 'Feedback Master', 'Complaint Categories', 'Policy & Config'];

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!value)} className="w-full flex items-center justify-between py-2 m-tap">
      <span className="text-[13.5px] font-semibold text-slate-700">{label}</span>
      <span className={`w-10 h-6 rounded-full relative transition-colors ${value ? 'bg-[var(--brand-teal)]' : 'bg-slate-200'}`}>
        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${value ? 'left-[18px]' : 'left-0.5'}`} />
      </span>
    </button>
  );
}

export default function StaffAdminMasters() {
  const store = useStore();
  const navigate = useNavigate();
  const staffUser = seedStaff.find(s => s.id === store.currentStaffId);

  const [tab, setTab] = useState('Services');

  const [svcId, setSvcId] = useState<string | null>(null);
  const [svcDraft, setSvcDraft] = useState<ServiceMasterEntry | null>(null);
  const openSvc = (e: ServiceMasterEntry) => { setSvcId(e.id); setSvcDraft({ ...e }); };
  const saveSvc = () => { if (svcDraft) store.updateServiceMasterEntry(svcDraft.id, svcDraft); setSvcId(null); };

  const [depId, setDepId] = useState<string | null>(null);
  const [depDraft, setDepDraft] = useState<DepartmentMappingEntry | null>(null);
  const openDep = (e: DepartmentMappingEntry) => { setDepId(e.id); setDepDraft({ ...e }); };
  const saveDep = () => { if (depDraft) store.updateDepartmentMappingEntry(depDraft.id, depDraft); setDepId(null); };

  const [slaId, setSlaId] = useState<string | null>(null);
  const [slaDraft, setSlaDraft] = useState<SLAMasterEntry | null>(null);
  const openSla = (e: SLAMasterEntry) => { setSlaId(e.id); setSlaDraft({ ...e }); };
  const saveSla = () => { if (slaDraft) store.updateSLAMasterEntry(slaDraft.id, slaDraft); setSlaId(null); };

  const [payId, setPayId] = useState<string | null>(null);
  const [payDraft, setPayDraft] = useState<PayerMasterEntry | null>(null);
  const openPay = (e: PayerMasterEntry) => { setPayId(e.id); setPayDraft({ ...e }); };
  const savePay = () => { if (payDraft) store.updatePayerMasterEntry(payDraft.id, payDraft); setPayId(null); };

  const [trfId, setTrfId] = useState<string | null>(null);
  const [trfDraft, setTrfDraft] = useState<TariffMasterEntry | null>(null);
  const openTrf = (e: TariffMasterEntry) => { setTrfId(e.id); setTrfDraft({ ...e }); };
  const saveTrf = () => { if (trfDraft) store.updateTariffMasterEntry(trfDraft.id, trfDraft); setTrfId(null); };

  const [fbmId, setFbmId] = useState<string | null>(null);
  const [fbmDraft, setFbmDraft] = useState<FeedbackMasterEntry | null>(null);
  const openFbm = (e: FeedbackMasterEntry) => { setFbmId(e.id); setFbmDraft({ ...e }); };
  const saveFbm = () => { if (fbmDraft) store.updateFeedbackMasterEntry(fbmDraft.id, fbmDraft); setFbmId(null); };

  const [ccmId, setCcmId] = useState<string | null>(null);
  const [ccmDraft, setCcmDraft] = useState<ComplaintCategoryMasterEntry | null>(null);
  const openCcm = (e: ComplaintCategoryMasterEntry) => { setCcmId(e.id); setCcmDraft({ ...e }); };
  const saveCcm = () => { if (ccmDraft) store.updateComplaintCategoryMasterEntry(ccmDraft.id, ccmDraft); setCcmId(null); };

  if (!staffUser || (staffUser.role !== 'Admin' && staffUser.role !== 'Management')) {
    return <Navigate to="/staff/dashboard" replace />;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="m-safe-top shrink-0" />
      <div className="flex-1 overflow-y-auto m-noscroll px-4 pb-3">
        <div className="flex items-center gap-2 pt-1 pb-1">
          <button onClick={() => navigate('/staff/dashboard')} className="m-tap text-slate-500"><ChevronLeft size={24} strokeWidth={2} /></button>
          <ScreenHeader title="Admin Masters" subtitle="Configure services, mappings, SLA & notifications" />
        </div>
        <div className="mb-4"><MSegmented options={TABS} value={tab} onChange={setTab} /></div>

        {tab === 'Services' && (
          <div className="space-y-2">
            {store.serviceMaster.map(s => (
              <button key={s.id} onClick={() => openSvc(s)} className="w-full text-left m-card p-3.5 m-tap">
                <div className="font-bold text-slate-800 text-[14px]">{s.serviceName}</div>
                <div className="text-[12px] text-slate-400 mt-0.5">{s.serviceCategory} · {s.applicability}</div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <MPillBadge text={s.active ? 'Active' : 'Inactive'} tone={s.active ? 'emerald' : 'red'} />
                  <MPillBadge text={s.portalVisible ? 'Portal Visible' : 'Hidden'} tone={s.portalVisible ? 'teal' : 'slate'} />
                  {s.feedbackEnabled && <MPillBadge text="Feedback" tone="sky" />}
                  {s.complaintEnabled && <MPillBadge text="Complaint" tone="amber" />}
                  {s.requestEnabled && <MPillBadge text="Request" tone="indigo" />}
                </div>
              </button>
            ))}
          </div>
        )}

        {tab === 'Dept. Mapping' && (
          <div className="space-y-2">
            {store.departmentMappingMaster.map(d => (
              <button key={d.id} onClick={() => openDep(d)} className="w-full text-left m-card p-3.5 m-tap">
                <div className="font-bold text-slate-800 text-[14px]">{d.serviceOrCategory}</div>
                <div className="text-[12px] text-slate-400 mt-0.5">{d.department}</div>
                <div className="text-[12px] text-slate-500 mt-1.5">L1 {d.level1Person} → L2 {d.level2Person} → L3 {d.level3Person}</div>
                <div className="text-[11.5px] text-slate-400 mt-1">Final authority: {d.finalEscalationAuthority}</div>
              </button>
            ))}
          </div>
        )}

        {tab === 'SLA Master' && (
          <div className="space-y-2">
            {store.slaMasterConfig.map(s => (
              <button key={s.id} onClick={() => openSla(s)} className="w-full text-left m-card p-3.5 m-tap">
                <div className="font-bold text-slate-800 text-[14px]">{s.serviceOrCategory}</div>
                <div className="text-[12px] text-slate-500 mt-1">Response {s.initialResponseMinutes}m · L1 {s.level1SlaMinutes}m · L2 {s.level2SlaMinutes}m · L3 {s.level3SlaMinutes}m · Escalation {s.escalationMinutes}m</div>
              </button>
            ))}
          </div>
        )}

        {tab === 'Notifications' && (
          <div className="space-y-2">
            {store.notificationMaster.map(n => (
              <div key={n.id} className="m-card p-3.5">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-bold text-slate-800 text-[13.5px]">{n.eventType}</div>
                  <MPillBadge text={n.recipient} tone="indigo" />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(['portal', 'whatsapp', 'sms', 'email'] as const).map(ch => (
                    <button key={ch} onClick={() => store.updateNotificationMasterEntry(n.id, { [ch]: !n[ch] } as any)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold m-tap ${n[ch] ? 'bg-[var(--brand-teal-light)] text-[var(--brand-teal)]' : 'bg-slate-100 text-slate-400'}`}>
                      {ch === 'sms' ? 'SMS' : ch[0].toUpperCase() + ch.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'Payer Master' && (
          <div className="space-y-2">
            {store.payerMaster.map(p => (
              <button key={p.id} onClick={() => openPay(p)} className="w-full text-left m-card p-3.5 m-tap">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-800 text-[14px]">{p.payerCategory}</div>
                  <MPillBadge text={p.active ? 'Active' : 'Inactive'} tone={p.active ? 'emerald' : 'red'} />
                </div>
                <div className="text-[12px] text-slate-400 mt-1">{p.description}</div>
              </button>
            ))}
          </div>
        )}

        {tab === 'Tariff Master' && (
          <div className="space-y-2">
            {store.tariffMaster.map(t => (
              <button key={t.id} onClick={() => openTrf(t)} className="w-full text-left m-card p-3.5 m-tap flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-800 text-[13.5px]">{t.serviceName}</div>
                  <div className="text-[11.5px] text-slate-400 mt-0.5">{t.payerCategory}</div>
                </div>
                <div className="m-num text-[15px] text-[var(--brand-teal)]">₹{t.amount}</div>
              </button>
            ))}
          </div>
        )}

        {tab === 'Feedback Master' && (
          <div className="space-y-2">
            {store.feedbackMaster.map(f => (
              <button key={f.id} onClick={() => openFbm(f)} className="w-full text-left m-card p-3.5 m-tap">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-800 text-[14px]">{f.serviceName}</div>
                  <MPillBadge text={f.applicablePatientType} tone="indigo" />
                </div>
                <div className="text-[12px] text-slate-500 mt-1">Scale 1–{f.ratingScale} · Auto-escalates at ≤{f.escalationThreshold}</div>
              </button>
            ))}
          </div>
        )}

        {tab === 'Complaint Categories' && (
          <div className="space-y-2">
            {store.complaintCategoryMaster.map(c => (
              <button key={c.id} onClick={() => openCcm(c)} className="w-full text-left m-card p-3.5 m-tap">
                <div className="font-bold text-slate-800 text-[14px]">{c.categoryName}</div>
                <div className="text-[12px] text-slate-400 mt-1">Dept: {c.department} · SLA Category: {c.slaCategory}</div>
              </button>
            ))}
          </div>
        )}

        {tab === 'Policy & Config' && (
          <div className="space-y-3">
            <div className="m-card p-3.5">
              <div className="text-[11px] font-bold text-slate-400 uppercase mb-2">Live in this prototype</div>
              <div className="space-y-1">
                <label className="text-[12px] font-semibold text-slate-400">Self-Registration Mode</label>
                <select className="m-input" value={store.selfRegistrationMode} onChange={e => store.setSelfRegistrationMode(e.target.value as SelfRegistrationMode)}>
                  <option value="HOSPITAL_ONLY">HOSPITAL_ONLY</option>
                  <option value="SELF_WITH_DUP_CHECK">SELF_WITH_DUP_CHECK</option>
                </select>
                <Toggle label="Enable Pay Later (Book Visit)" value={store.enablePayLater} onChange={store.setEnablePayLater} />
                <Toggle label="Enable Live Queue Widget" value={store.enableLiveQueue} onChange={store.setEnableLiveQueue} />
              </div>
            </div>
            <div className="m-card p-3.5">
              <div className="text-[11px] font-bold text-slate-400 uppercase mb-2">Display-only in this prototype</div>
              <div className="space-y-2.5">
                <div>
                  <label className="text-[12px] font-semibold text-slate-400">EMR Visibility Window (days, 0 = unlimited)</label>
                  <input type="number" className="m-input" value={store.emrVisibilityWindowDays} onChange={e => store.setEmrVisibilityWindowDays(Number(e.target.value))} />
                  <p className="text-[10.5px] text-slate-400 mt-1">Wired: greys out old Investigation reports on the patient's Records screen.</p>
                </div>
                <div>
                  <label className="text-[12px] font-semibold text-slate-400">EMR Download Limit per Document (0 = unlimited)</label>
                  <input type="number" className="m-input" value={store.emrDownloadLimitPerDoc} onChange={e => store.setEmrDownloadLimitPerDoc(Number(e.target.value))} />
                </div>
                <Toggle label="Mandatory Feedback Gate — OP Post-Consultation" value={store.mandatoryFeedbackGateOpPost} onChange={store.setMandatoryFeedbackGateOpPost} />
                <p className="text-[10.5px] text-slate-400 -mt-2">Wired: shows a soft nudge banner on My Visits when a completed OP consult has no feedback yet.</p>
                <Toggle label="Mandatory Feedback Gate — IP Pre-Discharge" value={store.mandatoryFeedbackGateIpPreDischarge} onChange={store.setMandatoryFeedbackGateIpPreDischarge} />
                <Toggle label="Allow In-App Correction Requests" value={store.allowInappCorrectionRequest} onChange={store.setAllowInappCorrectionRequest} />
                <Toggle label="Auto-Authorize Linked UHIDs" value={store.autoAuthorizeLinkedUhids} onChange={store.setAutoAuthorizeLinkedUhids} />
              </div>
            </div>
          </div>
        )}
      </div>

      <Sheet open={!!svcDraft} onClose={() => setSvcId(null)} title={svcDraft?.serviceName}>
        {svcDraft && (
          <div className="space-y-1">
            <Toggle label="Active" value={svcDraft.active} onChange={v => setSvcDraft({ ...svcDraft, active: v })} />
            <Toggle label="Portal Visible" value={svcDraft.portalVisible} onChange={v => setSvcDraft({ ...svcDraft, portalVisible: v })} />
            <Toggle label="Feedback Enabled" value={svcDraft.feedbackEnabled} onChange={v => setSvcDraft({ ...svcDraft, feedbackEnabled: v })} />
            <Toggle label="Complaint Enabled" value={svcDraft.complaintEnabled} onChange={v => setSvcDraft({ ...svcDraft, complaintEnabled: v })} />
            <Toggle label="Request Enabled" value={svcDraft.requestEnabled} onChange={v => setSvcDraft({ ...svcDraft, requestEnabled: v })} />
            <button className="m-btn-primary mt-3" onClick={saveSvc}>Save</button>
          </div>
        )}
      </Sheet>

      <Sheet open={!!depDraft} onClose={() => setDepId(null)} title={depDraft?.serviceOrCategory}>
        {depDraft && (
          <div className="space-y-2.5">
            <label className="text-[12px] font-semibold text-slate-400">Level 1</label>
            <input className="m-input" value={depDraft.level1Person} onChange={e => setDepDraft({ ...depDraft, level1Person: e.target.value })} />
            <label className="text-[12px] font-semibold text-slate-400">Level 2</label>
            <input className="m-input" value={depDraft.level2Person} onChange={e => setDepDraft({ ...depDraft, level2Person: e.target.value })} />
            <label className="text-[12px] font-semibold text-slate-400">Level 3</label>
            <input className="m-input" value={depDraft.level3Person} onChange={e => setDepDraft({ ...depDraft, level3Person: e.target.value })} />
            <label className="text-[12px] font-semibold text-slate-400">Final Escalation Authority</label>
            <input className="m-input" value={depDraft.finalEscalationAuthority} onChange={e => setDepDraft({ ...depDraft, finalEscalationAuthority: e.target.value })} />
            <button className="m-btn-primary mt-1" onClick={saveDep}>Save</button>
          </div>
        )}
      </Sheet>

      <Sheet open={!!slaDraft} onClose={() => setSlaId(null)} title={slaDraft?.serviceOrCategory}>
        {slaDraft && (
          <div className="space-y-2.5">
            {([
              ['initialResponseMinutes', 'Initial Response (min)'],
              ['level1SlaMinutes', 'Level 1 SLA (min)'],
              ['level2SlaMinutes', 'Level 2 SLA (min)'],
              ['level3SlaMinutes', 'Level 3 SLA (min)'],
              ['escalationMinutes', 'Escalation Buffer (min)'],
            ] as const).map(([key, label]) => (
              <div key={key}>
                <label className="text-[12px] font-semibold text-slate-400">{label}</label>
                <input type="number" className="m-input" value={slaDraft[key]} onChange={e => setSlaDraft({ ...slaDraft, [key]: Number(e.target.value) })} />
              </div>
            ))}
            <button className="m-btn-primary mt-1" onClick={saveSla}>Save</button>
          </div>
        )}
      </Sheet>

      <Sheet open={!!payDraft} onClose={() => setPayId(null)} title={payDraft?.payerCategory}>
        {payDraft && (
          <div className="space-y-2.5">
            <label className="text-[12px] font-semibold text-slate-400">Description</label>
            <textarea className="m-input" rows={2} value={payDraft.description} onChange={e => setPayDraft({ ...payDraft, description: e.target.value })} />
            <Toggle label="Active" value={payDraft.active} onChange={v => setPayDraft({ ...payDraft, active: v })} />
            <button className="m-btn-primary mt-1" onClick={savePay}>Save</button>
          </div>
        )}
      </Sheet>

      <Sheet open={!!trfDraft} onClose={() => setTrfId(null)} title={trfDraft ? `${trfDraft.serviceName} — ${trfDraft.payerCategory}` : undefined}>
        {trfDraft && (
          <div className="space-y-2.5">
            <label className="text-[12px] font-semibold text-slate-400">Amount (₹)</label>
            <input type="number" className="m-input" value={trfDraft.amount} onChange={e => setTrfDraft({ ...trfDraft, amount: Number(e.target.value) })} />
            <button className="m-btn-primary mt-1" onClick={saveTrf}>Save</button>
          </div>
        )}
      </Sheet>

      <Sheet open={!!fbmDraft} onClose={() => setFbmId(null)} title={fbmDraft?.serviceName}>
        {fbmDraft && (
          <div className="space-y-2.5">
            <label className="text-[12px] font-semibold text-slate-400">Applicable Patient Type</label>
            <select className="m-input" value={fbmDraft.applicablePatientType} onChange={e => setFbmDraft({ ...fbmDraft, applicablePatientType: e.target.value as any })}>
              <option value="IPD">IPD</option><option value="OPD">OPD</option><option value="Both">Both</option>
            </select>
            <label className="text-[12px] font-semibold text-slate-400">Rating Scale (out of)</label>
            <input type="number" className="m-input" value={fbmDraft.ratingScale} onChange={e => setFbmDraft({ ...fbmDraft, ratingScale: Number(e.target.value) })} />
            <label className="text-[12px] font-semibold text-slate-400">Auto-Escalation Threshold (rating ≤ this escalates)</label>
            <input type="number" className="m-input" value={fbmDraft.escalationThreshold} onChange={e => setFbmDraft({ ...fbmDraft, escalationThreshold: Number(e.target.value) })} />
            <button className="m-btn-primary mt-1" onClick={saveFbm}>Save</button>
          </div>
        )}
      </Sheet>

      <Sheet open={!!ccmDraft} onClose={() => setCcmId(null)} title={ccmDraft?.categoryName}>
        {ccmDraft && (
          <div className="space-y-2.5">
            <label className="text-[12px] font-semibold text-slate-400">Department</label>
            <input className="m-input" value={ccmDraft.department} onChange={e => setCcmDraft({ ...ccmDraft, department: e.target.value })} />
            <label className="text-[12px] font-semibold text-slate-400">SLA Category</label>
            <select className="m-input" value={ccmDraft.slaCategory} onChange={e => setCcmDraft({ ...ccmDraft, slaCategory: e.target.value })}>
              {store.slaMasterConfig.map(s => <option key={s.id} value={s.serviceOrCategory}>{s.serviceOrCategory}</option>)}
            </select>
            <button className="m-btn-primary mt-1" onClick={saveCcm}>Save</button>
          </div>
        )}
      </Sheet>
    </div>
  );
}
