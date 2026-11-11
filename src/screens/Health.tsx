import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useStore, getDoseLabelsForMedicine } from '../data/store';
import { seedDietOrders, TODAYS_MENU } from '../data/seed';
import { ScreenHeader } from '../components/Shell';
import { haptic } from '../lib/haptics';
import { MSegmented, MEmpty, MPillBadge, statusTone } from '../components/bits';
import Sheet from '../components/Sheet';
import ProgressRing from '../components/ProgressRing';
import { doseStatsForDay, doseStreak } from '../lib/adherence';
import { useSkeletonLoading, SkeletonList } from '../components/Skeleton';
import { Lock, Receipt, FlaskConical, Pill, UtensilsCrossed, CheckCircle2 } from 'lucide-react';

const TABS = ['Bills', 'Investigations', 'Medicines', 'Diet'];
const MEAL_TYPES: Array<'Breakfast' | 'Lunch' | 'Dinner' | 'Evening Snack'> = ['Breakfast', 'Lunch', 'Dinner', 'Evening Snack'];
const selStyle: React.CSSProperties = { borderColor: 'var(--brand-teal)', borderWidth: 2, background: 'var(--brand-teal-light)' };

export default function Health() {
  const store = useStore();
  const [params] = useSearchParams();
  const [tab, setTab] = useState(TABS.includes(params.get('tab') || '') ? (params.get('tab') as string) : 'Bills');
  const patient = store.patients.find(p => p.uhid === store.currentPatientUhid)!;
  const [loading] = useSkeletonLoading();

  // Bills
  const headUhid = store.authedAsFamilyHead || patient.uhid;
  const family = store.patients.filter(p => p.uhid === headUhid || p.familyHeadUhid === headUhid).map(p => p.uhid);
  const payments = store.payments.filter(p => family.includes(p.patientUhid)).sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  const ipBills = store.ipBills.filter(b => family.includes(b.patientUhid)).sort((a, b) => b.lastUpdated.localeCompare(a.lastUpdated));
  const [refundTxn, setRefundTxn] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [rStep, setRStep] = useState<'form' | 'result' | 'auth' | 'staff' | 'done'>('form');
  const [refundId, setRefundId] = useState<string | null>(null);
  const activeRefund = store.refunds.find(r => r.id === refundId);
  const openRefund = (id: string) => { setRefundTxn(id); setReason(''); setRStep('form'); setRefundId(null); };
  const submitRefund = () => { const r = store.requestRefund(refundTxn!, reason); setRefundId(r.id); setRStep(r.eligibility === 'Eligible' ? 'auth' : 'result'); };
  const authorize = (m: 'Patient OTP' | 'Patient Portal Approval') => { store.authorizeRefund(refundId!, m); setRStep('staff'); };
  const staffApprove = () => { store.staffApproveRefund(refundId!); setRStep('done'); };

  // Investigations / Medicines
  const investigations = store.investigations.filter(i => i.patientUhid === patient.uhid);
  const [procInv, setProcInv] = useState<string | null>(null);
  const payInv = (id: string, r: 'success' | 'failed') => { setProcInv(id); setTimeout(() => { store.payInvestigation(id, r); setProcInv(null); }, 500); };
  const medicines = store.medicines.filter(m => m.patientUhid === patient.uhid);
  const [procMed, setProcMed] = useState<string | null>(null);
  const payMed = (id: string, r: 'success' | 'failed') => { setProcMed(id); setTimeout(() => { store.payMedicine(id, r); setProcMed(null); }, 500); };

  // Feature 2 — Today's Doses checklist for paid/dispensed medicine orders.
  const todayIso = new Date().toISOString().slice(0, 10);
  const doseEligibleMeds = medicines.filter(m => m.status === 'Paid' || m.status === 'Dispensed');
  const adherence = doseStatsForDay(store.medicines, store.doseLog, patient.uhid, todayIso);
  const allDosesDone = adherence.total > 0 && adherence.taken === adherence.total;
  const streak = doseStreak(store.medicines, store.doseLog, patient.uhid, todayIso);

  // Diet
  const dietOrder = seedDietOrders.find(d => d.patientUhid === patient.uhid);
  const myDietRequests = store.dietRequests.filter(r => r.patientUhid === patient.uhid);
  const [mealType, setMealType] = useState<'Breakfast' | 'Lunch' | 'Dinner' | 'Evening Snack'>('Breakfast');
  const [menuItems, setMenuItems] = useState<string[]>([]);
  const [adhocRequest, setAdhocRequest] = useState('');
  const toggleMenuItem = (item: string) => setMenuItems(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
  const submitDiet = () => {
    if (menuItems.length === 0 && !adhocRequest.trim()) return;
    store.submitDietRequest(mealType, menuItems, adhocRequest.trim());
    setMenuItems([]);
    setAdhocRequest('');
  };

  return (
    <div>
      <ScreenHeader title="Health" subtitle="Bills, tests, medicines & diet" />
      <div className="mb-4"><MSegmented options={TABS} value={tab} onChange={setTab} /></div>

      {loading ? <SkeletonList count={3} /> : (
      <>
      {tab === 'Bills' && (
        <div className="space-y-5">
          <div>
            <div className="text-[12px] font-bold text-slate-400 uppercase mb-2">OP Vouchers</div>
            {payments.length === 0 ? <MEmpty title="No transactions yet" subtitle="Your OP payment history will show up here" icon={<Receipt size={20} strokeWidth={1.75} />} /> : (
              <div className="space-y-2.5">
                {payments.map(p => (
                  <div key={p.id} className="m-card p-3.5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[13.5px] font-bold text-slate-700">{p.purpose}</span>
                      <MPillBadge text={p.status} tone={statusTone(p.status)} />
                    </div>
                    <div className="text-[12px] text-slate-400">{p.reference} · {p.method}</div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="m-num text-[16px] text-slate-800">₹{p.amount}</span>
                      {(p.status === 'Success' || p.status === 'Paid at Counter') && (
                        <button className="text-[12px] font-bold text-[var(--brand-teal)]" onClick={() => openRefund(p.id)}>Request Refund</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {ipBills.length > 0 && (
            <div>
              <div className="text-[12px] font-bold text-slate-400 uppercase mb-2">IP Bills</div>
              <div className="space-y-2.5">
                {ipBills.map(b => (
                  <div key={b.id} className="m-card p-3.5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[13.5px] font-extrabold text-[var(--brand-teal)]">{b.ipNo}</span>
                      <MPillBadge text={b.status} tone={statusTone(b.status)} />
                    </div>
                    <div className="space-y-1 mb-2">
                      {b.lineItems.map((li, idx) => (
                        <div key={idx} className="flex items-center justify-between text-[12.5px]">
                          <span className="text-slate-500">{li.label}</span>
                          <span className="text-slate-700 font-semibold">₹{li.amount.toLocaleString('en-IN')}</span>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-slate-100 pt-2 space-y-1">
                      <div className="flex items-center justify-between text-[12.5px]">
                        <span className="text-slate-400">Total</span>
                        <span className="font-bold text-slate-700">₹{b.totalAmount.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex items-center justify-between text-[12.5px]">
                        <span className="text-slate-400">Paid</span>
                        <span className="font-bold text-emerald-700">₹{b.amountPaid.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex items-center justify-between text-[13px]">
                        <span className="text-slate-500 font-semibold">Balance Due</span>
                        <span className={`m-num text-[15px] ${b.balanceDue > 0 ? 'text-red-600' : 'text-emerald-700'}`}>₹{b.balanceDue.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'Investigations' && (
        investigations.length === 0 ? <MEmpty title="No investigations ordered" subtitle="Lab and diagnostic orders from your doctor will appear here" icon={<FlaskConical size={20} strokeWidth={1.75} />} /> : (
          <div className="space-y-2.5">
            {investigations.map(inv => (
              <div key={inv.id} className="m-card p-3.5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[13.5px] font-bold text-slate-700">{inv.name}</span>
                  <MPillBadge text={inv.status} tone={statusTone(inv.status)} />
                </div>
                <div className="text-[12px] text-slate-400">{inv.orderedBy} · ₹{inv.charge}</div>
                {inv.status === 'Pending Payment' && (
                  procInv === inv.id ? <div className="text-[12px] text-slate-400 mt-2">Processing…</div> : (
                    <div className="flex gap-2 mt-2.5">
                      <button className="m-btn-primary !py-2 !text-[12.5px] flex-1" onClick={() => payInv(inv.id, 'success')}>Pay Online</button>
                      <button className="m-btn-danger-outline !py-2 !text-[12.5px] flex-1" onClick={() => payInv(inv.id, 'failed')}>Simulate Fail</button>
                    </div>
                  )
                )}
              </div>
            ))}
          </div>
        )
      )}

      {tab === 'Medicines' && (
        medicines.length === 0 ? <MEmpty title="No medicines prescribed" subtitle="Prescriptions from your doctor will appear here" icon={<Pill size={20} strokeWidth={1.75} />} /> : (
          <div className="space-y-5">
            {doseEligibleMeds.length > 0 && (
              <div>
                <div className="m-card p-4 mb-3 flex items-center gap-4">
                  <ProgressRing value={adherence.total ? adherence.taken / adherence.total : 0} done={allDosesDone} size={68} stroke={7}>
                    {allDosesDone ? <CheckCircle2 size={26} className="text-emerald-500 m-pop" /> : <span className="m-num text-[17px] text-slate-700">{adherence.taken}<span className="text-slate-300">/{adherence.total}</span></span>}
                  </ProgressRing>
                  <div className="flex-1 min-w-0">
                    <div className="m-subhead text-slate-800">{allDosesDone ? 'All doses done today' : adherence.taken === 0 ? 'Start today\'s doses' : `${adherence.total - adherence.taken} dose${adherence.total - adherence.taken === 1 ? '' : 's'} to go`}</div>
                    <div className="text-[12px] text-slate-400 mt-0.5 leading-snug">{allDosesDone ? 'Nicely done — consistency is what makes treatment work.' : 'Tap each dose as you take it.'}</div>
                    {streak > 0 && <div className="mt-1.5"><MPillBadge text={`${streak}-day streak`} tone="emerald" /></div>}
                  </div>
                </div>
                <div className="text-[12px] font-bold text-slate-400 uppercase mb-2">Today's Doses</div>
                <div className="space-y-2.5">
                  {doseEligibleMeds.map(m => {
                    const labels = getDoseLabelsForMedicine(m.medicine);
                    return (
                      <div key={m.id} className="m-card p-3.5">
                        <div className="text-[13.5px] font-bold text-slate-700 mb-2">{m.medicine}</div>
                        <div className="flex flex-wrap gap-2">
                          {labels.map(label => {
                            const taken = store.doseLog.some(d => d.patientUhid === patient.uhid && d.medicineOrderId === m.id && d.doseLabel === label && d.date === todayIso);
                            return (
                              <button key={label} onClick={() => { haptic.tick(); store.toggleDoseTaken(patient.uhid, m.id, label, todayIso); }}
                                className={`px-3 py-1.5 rounded-xl text-[12px] font-bold border m-tap flex items-center gap-1.5 ${taken ? '' : 'border-slate-200 text-slate-600'}`}
                                style={taken ? selStyle : undefined}>
                                {taken && <CheckCircle2 size={14} />} {label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            <div className="space-y-2.5">
            {medicines.map(m => (
              <div key={m.id} className="m-card p-3.5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[13.5px] font-bold text-slate-700">{m.medicine}</span>
                  <MPillBadge text={m.status} tone={statusTone(m.status)} />
                </div>
                <div className="text-[12px] text-slate-400">Qty {m.qty} × ₹{m.unitPrice} = ₹{m.qty * m.unitPrice} · {m.prescribedBy}</div>
                {m.status === 'Pending Payment' && (
                  procMed === m.id ? <div className="text-[12px] text-slate-400 mt-2">Processing…</div> : (
                    <div className="flex gap-2 mt-2.5">
                      <button className="m-btn-primary !py-2 !text-[12.5px] flex-1" onClick={() => payMed(m.id, 'success')}>Pay</button>
                      <button className="m-btn-danger-outline !py-2 !text-[12.5px] flex-1" onClick={() => payMed(m.id, 'failed')}>Fail</button>
                    </div>
                  )
                )}
              </div>
            ))}
            </div>
          </div>
        )
      )}

      {tab === 'Diet' && (
        patient.patientType !== 'IPD' ? <MEmpty title="Not applicable" subtitle="Diet management is an IPD-only service." /> : (
          <div className="space-y-4">
            <div className="m-card p-4">
              <div className="flex items-center justify-between mb-2"><span className="text-[12px] font-bold text-slate-400 uppercase">Prescribed Diet</span><Lock size={14} className="text-slate-300" /></div>
              {dietOrder ? (
                <div className="space-y-1.5 text-[13.5px]">
                  <div className="flex justify-between"><span className="text-slate-400">Type</span><span className="font-bold">{dietOrder.dietType}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Meal</span><span>{dietOrder.mealType}</span></div>
                  <div className="text-slate-500 text-[12.5px] mt-1">{dietOrder.instructions}</div>
                  <div className="flex justify-between mt-1"><span className="text-slate-400">Status</span><MPillBadge text={dietOrder.status} tone="emerald" /></div>
                </div>
              ) : <MEmpty title="No prescribed diet" />}
            </div>
            <div>
              <div className="text-[12px] font-bold text-slate-400 uppercase mb-2">Self Request (Optional)</div>
              <div className="mb-3"><MSegmented options={MEAL_TYPES} value={mealType} onChange={v => { setMealType(v as any); setMenuItems([]); }} /></div>
              <div className="text-[11.5px] font-bold text-slate-400 uppercase mb-2">Today's {mealType} Menu</div>
              <div className="flex flex-wrap gap-2 mb-3">
                {TODAYS_MENU[mealType].map(item => (
                  <button key={item} onClick={() => toggleMenuItem(item)}
                    className={`px-3 py-1.5 rounded-xl text-[12.5px] font-bold border m-tap ${menuItems.includes(item) ? '' : 'border-slate-200 text-slate-600'}`}
                    style={menuItems.includes(item) ? selStyle : undefined}>
                    {item}
                  </button>
                ))}
              </div>
              <input className="m-input mb-3" placeholder="Anything else? (optional)" value={adhocRequest} onChange={e => setAdhocRequest(e.target.value)} />
              <button className="m-btn-primary" disabled={menuItems.length === 0 && !adhocRequest.trim()} onClick={submitDiet}>Submit Request</button>
              <div className="space-y-2 mt-3">
                {myDietRequests.map(r => (
                  <div key={r.id} className="m-card p-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[13px] font-bold text-slate-700">{r.mealType}</span>
                      <MPillBadge text={r.status} tone={statusTone(r.status)} />
                    </div>
                    {r.menuItems.length > 0 && <div className="text-[12px] text-slate-500 mt-1">{r.menuItems.join(', ')}</div>}
                    {r.adhocRequest && <div className="text-[12px] text-slate-400 mt-0.5 italic">"{r.adhocRequest}"</div>}
                    {r.blockedReason && <div className="text-[11.5px] text-amber-700 mt-1.5">{r.blockedReason}</div>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      )}
      </>
      )}

      <Sheet open={!!refundTxn} onClose={() => setRefundTxn(null)} title="Refund Request">
        {refundTxn && (
          <div className="space-y-3">
            {rStep === 'form' && (
              <>
                <textarea className="m-input" rows={3} placeholder="Reason for refund" value={reason} onChange={e => setReason(e.target.value)} />
                <button className="m-btn-primary" disabled={!reason} onClick={submitRefund}>Submit Request</button>
              </>
            )}
            {rStep === 'result' && activeRefund?.eligibility === 'Not Eligible' && <div className="text-[12.5px] text-red-700 bg-red-50 rounded-xl p-3 font-medium">Not eligible for refund. Request rejected.</div>}
            {rStep === 'auth' && (
              <div className="space-y-2">
                <div className="text-[12.5px] text-emerald-700 bg-emerald-50 rounded-xl p-3 font-medium">Eligible — patient authorization required (family cannot authorize independently).</div>
                <button className="m-btn-primary" onClick={() => authorize('Patient OTP')}>Authorize via OTP (123456)</button>
                <button className="m-btn-secondary" onClick={() => authorize('Patient Portal Approval')}>Authorize via Portal Approval</button>
              </div>
            )}
            {rStep === 'staff' && (
              <div className="space-y-2">
                <div className="text-[12.5px] text-sky-700 bg-sky-50 rounded-xl p-3 font-medium">Awaiting authorised staff verification.</div>
                <button className="m-btn-primary" onClick={staffApprove}>Simulate Staff Approval</button>
              </div>
            )}
            {rStep === 'done' && <div className="text-[12.5px] text-emerald-700 bg-emerald-50 rounded-xl p-3 font-medium">Refund processed. Audit trail recorded.</div>}
          </div>
        )}
      </Sheet>
    </div>
  );
}
