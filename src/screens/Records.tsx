import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../data/store';
import { seedConsultations } from '../data/seed';
import type { VitalsReading } from '../data/types';
import { ScreenHeader } from '../components/Shell';
import { MSegmented, MEmpty, MPillBadge, statusTone } from '../components/bits';
import Sheet from '../components/Sheet';
import PullToRefresh from '../components/PullToRefresh';
import { useSkeletonLoading, SkeletonList } from '../components/Skeleton';
import { CoachMark, useCoachMark } from '../components/CoachMark';
import { ChevronLeft, Stethoscope, BedDouble, FlaskConical, Pill, Activity, Check, CalendarCheck2 } from 'lucide-react';

const TABS = ['Visit History', 'Timeline', 'Reports', 'Prescriptions', 'Vitals'];
const VISIT_SUBTABS = ['OP Visits', 'IP Visits'];

interface VitalDef {
  key: string;
  label: string;
  unit: string;
  get: (v: VitalsReading) => number | undefined;
  format: (v: VitalsReading) => string;
}

const VITAL_DEFS: VitalDef[] = [
  {
    key: 'bp', label: 'Blood Pressure', unit: 'mmHg',
    get: v => v.bloodPressureSystolic,
    format: v => `${v.bloodPressureSystolic}/${v.bloodPressureDiastolic}`,
  },
  {
    key: 'hr', label: 'Heart Rate', unit: 'bpm',
    get: v => v.heartRateBpm,
    format: v => `${v.heartRateBpm}`,
  },
  {
    key: 'temp', label: 'Temperature', unit: '°F',
    get: v => v.temperatureF,
    format: v => `${v.temperatureF}`,
  },
  {
    key: 'spo2', label: 'SpO2', unit: '%',
    get: v => v.spo2Percent,
    format: v => `${v.spo2Percent}`,
  },
  {
    key: 'rbs', label: 'Blood Sugar (Random)', unit: 'mg/dL',
    get: v => v.randomBloodSugarMgDl,
    format: v => `${v.randomBloodSugarMgDl}`,
  },
  {
    key: 'weight', label: 'Weight', unit: 'kg',
    get: v => v.weightKg,
    format: v => `${v.weightKg}`,
  },
];

function Sparkline({ values }: { values: number[] }) {
  const w = 240, h = 56, pad = 6;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const step = values.length > 1 ? (w - pad * 2) / (values.length - 1) : 0;
  const points = values.map((v, i) => {
    const x = pad + i * step;
    const y = pad + (1 - (v - min) / range) * (h - pad * 2);
    return { x, y };
  });
  const poly = points.map(p => `${p.x},${p.y}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-14" preserveAspectRatio="none">
      <polyline points={poly} fill="none" stroke="var(--brand-teal)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={2.5} fill="var(--brand-teal)" />
      ))}
    </svg>
  );
}

// Feature 3 — Investigation trend graphs: extract a numeric value out of a free-text resultSummary
// (e.g. "HbA1c: 6.8% — fair glycemic control" -> 6.8). Mock parsing, not a real lab-report parser.
function parseNumericResult(summary?: string): number | undefined {
  if (!summary) return undefined;
  // Parse only the portion after the first ":" (the result value, e.g. "HbA1c: 6.8% — ...") —
  // the test name itself can contain digits (e.g. "HbA1c", "T3", "COVID-19 PCR") that would
  // otherwise be matched first and misread as the result.
  const afterColon = summary.includes(':') ? summary.slice(summary.indexOf(':') + 1) : summary;
  const m = afterColon.match(/(\d+(\.\d+)?)/);
  return m ? parseFloat(m[1]) : undefined;
}

// Best-effort unit suffix for the trend headline (e.g. "6.8" -> "6.8%") — looks at whatever
// non-space characters immediately follow the parsed number in the same result string.
function parseResultUnit(summary?: string): string {
  if (!summary) return '';
  const afterColon = summary.includes(':') ? summary.slice(summary.indexOf(':') + 1) : summary;
  const m = afterColon.match(/\d+(?:\.\d+)?\s*(%|mg\/dL|g\/dL|bpm|mmHg)/);
  return m ? m[1] : '';
}

export default function Records() {
  const store = useStore();
  const navigate = useNavigate();
  const patient = store.patients.find(p => p.uhid === store.currentPatientUhid)!;
  const [tab, setTab] = useState(TABS[0]);
  const [visitSubtab, setVisitSubtab] = useState(VISIT_SUBTABS[0]);
  const [openInvId, setOpenInvId] = useState<string | null>(null);
  const [openVitalKey, setOpenVitalKey] = useState<string | null>(null);
  const [openTrendName, setOpenTrendName] = useState<string | null>(null);
  const [loading, refresh] = useSkeletonLoading();
  const [vitalsCoachDismissed, dismissVitalsCoach] = useCoachMark('vitals');

  const myConsultations = seedConsultations
    .filter(c => c.patientUhid === patient.uhid)
    .sort((a, b) => b.date.localeCompare(a.date));

  const myIPVisits = store.ipVisits
    .filter(v => v.patientUhid === patient.uhid)
    .sort((a, b) => b.admissionDate.localeCompare(a.admissionDate));

  const investigations = store.investigations
    .filter(i => i.patientUhid === patient.uhid)
    .sort((a, b) => b.orderedAt.localeCompare(a.orderedAt));

  // BRD FR-M7-03 — EMR visibility window: reports older than the configured window are visually
  // greyed out with a note rather than removed (0 = unlimited / no window applied).
  const emrWindowMs = store.emrVisibilityWindowDays > 0 ? store.emrVisibilityWindowDays * 86400000 : Infinity;
  const isOutsideEmrWindow = (orderedAt: string) => (Date.now() - new Date(orderedAt).getTime()) > emrWindowMs;

  const medicines = store.medicines.filter(m => m.patientUhid === patient.uhid);

  // Engagement — one chronological "care timeline" stitched from everything already on record.
  type TLEvent = { date: string; title: string; sub: string; tone: string; icon: React.ReactNode };
  const timeline: TLEvent[] = [
    ...myConsultations.map(c => ({ date: c.date, title: c.diagnosis, sub: `Consultation · ${store.doctors.find(d => d.id === c.doctorId)?.name ?? 'Doctor'}`, tone: 'var(--brand-teal)', icon: <Stethoscope size={14} /> })),
    ...store.appointments.filter(a => a.patientUhid === patient.uhid && a.status !== 'Cancelled').map(a => ({ date: a.date, title: `Appointment · ${store.doctors.find(d => d.id === a.doctorId)?.name ?? 'Doctor'}`, sub: `${a.time} · ${a.status}`, tone: '#0ea5e9', icon: <CalendarCheck2 size={14} /> })),
    ...investigations.map(i => ({ date: i.orderedAt.slice(0, 10), title: i.name, sub: `Investigation · ${i.status}`, tone: '#6366f1', icon: <FlaskConical size={14} /> })),
    ...myIPVisits.flatMap(v => [
      { date: v.admissionDate, title: `Admitted · ${v.ward}`, sub: `${v.ipNo} · ${v.treatingDoctor}`, tone: '#e11d48', icon: <BedDouble size={14} /> },
      ...(v.dischargeDate ? [{ date: v.dischargeDate, title: 'Discharged', sub: v.ipNo, tone: '#e11d48', icon: <BedDouble size={14} /> }] : []),
    ]),
  ].sort((a, b) => b.date.localeCompare(a.date));
  const timelineByMonth = timeline.reduce<Record<string, TLEvent[]>>((acc, e) => {
    const k = new Date(e.date + 'T00:00:00').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    (acc[k] ||= []).push(e);
    return acc;
  }, {});

  const myVitals = store.vitals
    .filter(v => v.patientUhid === patient.uhid)
    .sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));

  const openInv = investigations.find(i => i.id === openInvId);
  const reportAvailable = (i: (typeof investigations)[number]) =>
    (i.status === 'Report Available' || i.status === 'Completed') && !!i.resultSummary;

  // Feature 3 — group same-named investigations with 2+ parseable numeric results into a trend.
  const trendGroups = (() => {
    const byName: Record<string, typeof investigations> = {};
    investigations.filter(reportAvailable).forEach(i => { (byName[i.name] ||= []).push(i); });
    return Object.entries(byName)
      .map(([name, items]) => {
        const sorted = [...items].sort((a, b) => a.orderedAt.localeCompare(b.orderedAt));
        const values = sorted.map(i => parseNumericResult(i.resultSummary));
        if (sorted.length < 2 || values.some(v => v === undefined)) return null;
        return { name, items: sorted, values: values as number[] };
      })
      .filter((g): g is { name: string; items: typeof investigations; values: number[] } => !!g);
  })();
  const openTrend = trendGroups.find(g => g.name === openTrendName);

  const openVitalDef = VITAL_DEFS.find(d => d.key === openVitalKey);
  const openVitalReadings = openVitalDef ? myVitals.filter(v => openVitalDef.get(v) !== undefined) : [];

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 pt-1 pb-2 shrink-0">
        <button onClick={() => navigate(-1)} className="m-tap text-slate-500"><ChevronLeft size={24} strokeWidth={2} /></button>
        <div className="flex-1">
          <ScreenHeader title="Medical Records" subtitle="Visit history, reports & prescriptions" />
        </div>
      </div>
      <div className="mb-4 shrink-0"><MSegmented options={TABS} value={tab} onChange={setTab} /></div>

      <div className="flex-1 overflow-y-auto m-noscroll pb-3">
      <PullToRefresh onRefresh={refresh}>
      {loading ? <SkeletonList count={3} /> : (
      <>
        {tab === 'Visit History' && (
          <>
            <div className="mb-3"><MSegmented options={VISIT_SUBTABS} value={visitSubtab} onChange={setVisitSubtab} /></div>

            {visitSubtab === 'OP Visits' && (
              myConsultations.length === 0 ? <MEmpty title="No OP consultation records" subtitle="Your outpatient visit history will appear here" icon={<Stethoscope size={20} strokeWidth={1.75} />} /> : (
                <div className="space-y-2.5">
                  {myConsultations.map((c) => {
                    const doc = store.doctors.find(d => d.id === c.doctorId);
                    return (
                      <div key={c.id} className="m-card p-3.5">
                        <div className="flex justify-between items-start">
                          <span className="font-bold text-slate-700 text-[13.5px]">{doc?.name}</span>
                          <span className="text-[11.5px] text-slate-400">{c.date}</span>
                        </div>
                        <div className="text-[13px] font-bold text-slate-800 mt-1.5">{c.diagnosis}</div>
                        <div className="text-[12px] text-slate-500 mt-1">{c.advice}</div>
                        {c.prescription.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {c.prescription.map((p) => <MPillBadge key={p} text={p} tone="slate" />)}
                          </div>
                        )}
                        {c.followUpDate && (
                          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-[11.5px] text-slate-400">Follow-up</span>
                            <MPillBadge text={c.followUpDate} tone="teal" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )
            )}

            {visitSubtab === 'IP Visits' && (
              myIPVisits.length === 0 ? <MEmpty title="No IP admission records" subtitle="Your admission history will appear here" icon={<BedDouble size={20} strokeWidth={1.75} />} /> : (
                <div className="space-y-2.5">
                  {myIPVisits.map((v) => (
                    <div key={v.id} className="m-card p-3.5">
                      <div className="flex justify-between items-start">
                        <span className="font-extrabold text-[var(--brand-teal)] text-[13.5px]">{v.ipNo}</span>
                        <MPillBadge text={v.ward} tone="slate" />
                      </div>
                      <div className="flex items-center justify-between mt-1.5 text-[12px] text-slate-500">
                        <span>{v.admissionDate} → {v.dischargeDate}</span>
                        <span className="text-slate-400">Bed {v.bed}</span>
                      </div>
                      <div className="text-[12px] text-slate-400 mt-0.5">Treating Doctor: {v.treatingDoctor}</div>
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 mt-2.5">
                        <div className="text-[11px] font-bold text-slate-400 uppercase mb-1.5">Discharge Summary</div>
                        <div className="text-[12.5px] text-slate-700 leading-relaxed">{v.dischargeSummary}</div>
                      </div>
                      {v.recoveryChecklist && v.recoveryChecklist.length > 0 && (
                        <div className="bg-white border border-slate-200 rounded-2xl p-3 mt-2.5">
                          <div className="text-[11px] font-bold text-slate-400 uppercase mb-1.5">Recovery Checklist</div>
                          <div className="space-y-2">
                            {v.recoveryChecklist.map(item => {
                              const done = store.recoveryChecklistLog.some(l => l.ipVisitId === v.id && l.itemId === item.id);
                              return (
                                <button key={item.id} onClick={() => store.toggleRecoveryChecklistItem(patient.uhid, v.id, item.id)} className="w-full flex items-start gap-2 text-left m-tap">
                                  <div className={`w-5 h-5 rounded-md border shrink-0 mt-0.5 flex items-center justify-center ${done ? 'bg-[var(--brand-teal)] border-[var(--brand-teal)]' : 'border-slate-300'}`}>
                                    {done && <Check size={13} className="text-white" strokeWidth={3} />}
                                  </div>
                                  <span className={`text-[12.5px] leading-relaxed ${done ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{item.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )
            )}
          </>
        )}

        {tab === 'Reports' && (
          investigations.length === 0 ? <MEmpty title="No investigations ordered" subtitle="Lab and diagnostic reports will appear here" icon={<FlaskConical size={20} strokeWidth={1.75} />} /> : (
            <div className="space-y-2.5">
              {trendGroups.map(g => {
                const latestVal = g.values[g.values.length - 1];
                const latestItem = g.items[g.items.length - 1];
                const unit = parseResultUnit(latestItem.resultSummary);
                return (
                  <button key={g.name} onClick={() => setOpenTrendName(g.name)} className="w-full text-left m-card p-3.5 m-tap">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wide">{g.name} Trend</span>
                      <span className="text-[11px] text-slate-400">{new Date(latestItem.orderedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                    </div>
                    <div className="m-hero text-[26px] text-slate-800">{latestVal}{unit && <span className="text-[15px] font-semibold text-slate-400 ml-0.5">{unit}</span>}</div>
                    <div className="mt-2"><Sparkline values={g.values} /></div>
                    <div className="text-[11px] text-slate-400 mt-1">{g.items.length} readings</div>
                  </button>
                );
              })}
              {investigations.map(inv => {
                const outsideWindow = isOutsideEmrWindow(inv.orderedAt);
                const tappable = reportAvailable(inv) && !outsideWindow;
                const Comp: any = tappable ? 'button' : 'div';
                return (
                  <Comp key={inv.id} onClick={tappable ? () => setOpenInvId(inv.id) : undefined} className={`w-full text-left m-card p-3.5 ${tappable ? 'm-tap' : ''} ${outsideWindow ? 'opacity-50' : ''}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[13.5px] font-bold text-slate-700">{inv.name}</span>
                      <MPillBadge text={inv.status} tone={statusTone(inv.status)} />
                    </div>
                    <div className="text-[12px] text-slate-400">{inv.orderedBy} · {new Date(inv.orderedAt).toLocaleDateString('en-IN')} · ₹{inv.charge}</div>
                    {outsideWindow ? (
                      <div className="text-[11.5px] text-slate-400 mt-1.5 italic">Older reports are outside your hospital's configured visibility window ({store.emrVisibilityWindowDays} days).</div>
                    ) : tappable ? (
                      <div className="text-[12px] font-bold text-[var(--brand-teal)] mt-1.5">View Report →</div>
                    ) : (
                      <div className="text-[12px] text-slate-400 mt-1.5 italic">Report pending</div>
                    )}
                  </Comp>
                );
              })}
            </div>
          )
        )}

        {tab === 'Prescriptions' && (
          medicines.length === 0 ? <MEmpty title="No medicines prescribed" subtitle="Your prescription history will appear here" icon={<Pill size={20} strokeWidth={1.75} />} /> : (
            <div className="space-y-2.5">
              {medicines.map(m => (
                <div key={m.id} className="m-card p-3.5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[13.5px] font-bold text-slate-700">{m.medicine}</span>
                    <MPillBadge text={m.status} tone={statusTone(m.status)} />
                  </div>
                  <div className="text-[12px] text-slate-400">Qty {m.qty} × ₹{m.unitPrice} = ₹{m.qty * m.unitPrice} · {m.prescribedBy}</div>
                </div>
              ))}
            </div>
          )
        )}

        {tab === 'Timeline' && (
          timeline.length === 0 ? <MEmpty title="Nothing on your timeline yet" subtitle="Visits, tests and admissions appear here as they happen" icon={<Activity size={20} strokeWidth={1.75} />} /> : (
            <div>
              {Object.entries(timelineByMonth).map(([month, events]) => (
                <div key={month} className="mb-4">
                  <div className="m-label text-slate-400 mb-2.5">{month}</div>
                  {events.map((e, i) => (
                    <div key={i} className="flex gap-3 m-rise" style={{ animationDelay: `${Math.min(i, 8) * 35}ms` }}>
                      <div className="flex flex-col items-center">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white shrink-0" style={{ background: e.tone }}>{e.icon}</div>
                        {i < events.length - 1 && <div className="w-px flex-1 my-1" style={{ background: 'var(--border-default, #e3e8ec)' }} />}
                      </div>
                      <div className="pb-4 min-w-0">
                        <div className="text-[13.5px] font-bold text-slate-700 leading-snug">{e.title}</div>
                        <div className="text-[12px] text-slate-400 mt-0.5">{new Date(e.date + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} · {e.sub}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )
        )}

        {tab === 'Vitals' && (
          <CoachMark show={!vitalsCoachDismissed} onDismiss={dismissVitalsCoach}
            text="Tap a vital sign to see its full reading history and trend over time." />
        )}
        {tab === 'Vitals' && (
          myVitals.length === 0 ? <MEmpty title="No vitals recorded" subtitle="Vitals recorded during your visits will appear here" icon={<Activity size={20} strokeWidth={1.75} />} /> : (
            <div className="space-y-2.5">
              {VITAL_DEFS.map(def => {
                const readings = myVitals.filter(v => def.get(v) !== undefined);
                if (readings.length === 0) return null;
                const latest = readings[readings.length - 1];
                const values = readings.map(r => def.get(r)!);
                const earliest = readings[0];
                return (
                  <button key={def.key} onClick={() => setOpenVitalKey(def.key)} className="w-full text-left m-card p-3.5 m-tap">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wide">{def.label}</span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(latest.recordedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="m-hero text-[26px] text-slate-800">{def.format(latest)}</span>
                      <span className="text-[12px] text-slate-400 font-semibold">{def.unit}</span>
                    </div>
                    <div className="text-[11.5px] text-slate-400 mt-0.5">{latest.recordedBy}</div>
                    {readings.length > 1 && (
                      <div className="mt-2">
                        <Sparkline values={values} />
                      </div>
                    )}
                    <div className="text-[11px] text-slate-400 mt-1">
                      {readings.length} reading{readings.length > 1 ? 's' : ''} since {new Date(earliest.recordedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </div>
                  </button>
                );
              })}
            </div>
          )
        )}
      </>
      )}
      </PullToRefresh>
      </div>

      <Sheet open={!!openInvId} onClose={() => setOpenInvId(null)} title={openInv?.name}>
        {openInv && (
          <div className="space-y-3">
            <div className="text-[12.5px] text-slate-500 space-y-1">
              <div className="flex justify-between"><span className="text-slate-400">Ordered by</span><span className="font-bold text-slate-700">{openInv.orderedBy}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Date</span><span className="font-bold text-slate-700">{new Date(openInv.orderedAt).toLocaleDateString('en-IN')}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Charge</span><span className="font-bold text-slate-700">₹{openInv.charge}</span></div>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5">
              <div className="text-[11px] font-bold text-slate-400 uppercase mb-1.5">Report</div>
              <div className="text-[13px] text-slate-700 leading-relaxed">{openInv.resultSummary}</div>
            </div>
            <div className="text-[11px] text-slate-400 italic">Simulated report for demo purposes.</div>
          </div>
        )}
      </Sheet>

      <Sheet open={!!openTrendName} onClose={() => setOpenTrendName(null)} title={openTrendName ? `${openTrendName} Trend` : undefined}>
        {openTrend && (
          <div className="space-y-2">
            {[...openTrend.items].reverse().map((inv, idx) => (
              <div key={inv.id} className="flex items-center justify-between border-b border-slate-100 pb-2 last:border-b-0">
                <div className="text-[13px] font-bold text-slate-700">{openTrend.values[openTrend.items.length - 1 - idx]}</div>
                <div className="text-[11.5px] text-slate-400 text-right shrink-0">
                  {new Date(inv.orderedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </div>
              </div>
            ))}
          </div>
        )}
      </Sheet>

      <Sheet open={!!openVitalKey} onClose={() => setOpenVitalKey(null)} title={openVitalDef?.label}>
        {openVitalDef && (
          <div className="space-y-2">
            {[...openVitalReadings].reverse().map(r => (
              <div key={r.id} className="flex items-center justify-between border-b border-slate-100 pb-2 last:border-b-0">
                <div>
                  <div className="text-[13px] font-bold text-slate-700">{openVitalDef.format(r)} <span className="text-[11px] font-semibold text-slate-400">{openVitalDef.unit}</span></div>
                  <div className="text-[11.5px] text-slate-400">{r.context} · {r.recordedBy}</div>
                </div>
                <div className="text-[11.5px] text-slate-400 text-right shrink-0">
                  {new Date(r.recordedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
          </div>
        )}
      </Sheet>
    </div>
  );
}
