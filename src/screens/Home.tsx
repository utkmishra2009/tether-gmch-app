import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../data/store';
import { seedDietOrders, seedConsultations } from '../data/seed';
import { MSection, MPillBadge, statusTone } from '../components/bits';
import Sheet from '../components/Sheet';
import ProgressRing from '../components/ProgressRing';
import { doseStatsForDay, doseStreak } from '../lib/adherence';
import { AnnouncementBoard, ContentDetailSheet } from '../components/content';
import PullToRefresh from '../components/PullToRefresh';
import { useSkeletonLoading, SkeletonBlock } from '../components/Skeleton';
import { CalendarPlus, Wallet, MessageCircleWarning, Salad, Bell, ChevronRight, LogOut, ShieldAlert, ArrowRight, CalendarClock, CheckCircle2 } from 'lucide-react';

export default function Home() {
  const store = useStore();
  const navigate = useNavigate();
  const patient = store.patients.find(p => p.uhid === store.currentPatientUhid)!;
  const headUhid = store.authedAsFamilyHead || patient.uhid;
  const family = store.patients.filter(p => p.uhid === headUhid || p.familyHeadUhid === headUhid);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  // Home doesn't need an entry skeleton, only a pull-to-refresh one (there's no real fetch to wait on).
  const [refreshing, refresh] = useSkeletonLoading({ skipInitial: true });

  const myAppointments = store.appointments.filter(a => a.patientUhid === patient.uhid).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const upcoming = myAppointments.find(a => !['Consultation Completed', 'Cancelled', 'No Show'].includes(a.status));
  const doctor = upcoming ? store.doctors.find(d => d.id === upcoming.doctorId) : null;
  const pendingPay = store.investigations.filter(i => i.patientUhid === patient.uhid && i.status === 'Pending Payment').length
    + store.medicines.filter(m => m.patientUhid === patient.uhid && m.status === 'Pending Payment').length;
  const openComplaints = store.complaints.filter(c => c.patientUhid === patient.uhid && !['Closed', 'Resolved'].includes(c.status)).length;

  // Feature 1 — Family dashboard: an at-a-glance strip per family member, each card doubling as a
  // shortcut into store.switchActivePatient (the full "Switch Patient" sheet below stays as-is).
  const todayIso = new Date().toISOString().slice(0, 10);
  const familyOverview = family.map(f => {
    const apts = store.appointments
      .filter(a => a.patientUhid === f.uhid && !['Consultation Completed', 'Cancelled', 'No Show'].includes(a.status))
      .sort((a, b) => a.date.localeCompare(b.date));
    const nextApt = apts[0];
    const pendingCount = store.investigations.filter(i => i.patientUhid === f.uhid && i.status === 'Pending Payment').length
      + store.medicines.filter(m => m.patientUhid === f.uhid && m.status === 'Pending Payment').length;
    const dietOrder = seedDietOrders.find(d => d.patientUhid === f.uhid && d.status === 'Active');
    const dietAwaiting = !!dietOrder && !store.dietRequests.some(r => r.patientUhid === f.uhid && r.createdAt.slice(0, 10) === todayIso);
    return { patient: f, nextApt, pendingCount, dietAwaiting };
  });

  // Differentiator — Follow-up nudge: the most recent past consultation whose doctor-advised
  // follow-up date is due/overdue and no later appointment with that same doctor is already booked.
  const dueFollowUp = seedConsultations
    .filter(c => c.patientUhid === patient.uhid && c.followUpDate && c.followUpDate <= todayIso)
    .sort((a, b) => b.followUpDate!.localeCompare(a.followUpDate!))
    .find(c => !store.appointments.some(a => a.patientUhid === patient.uhid && a.doctorId === c.doctorId && a.date >= c.followUpDate! && a.status !== 'Cancelled'));
  const dueFollowUpDoctor = dueFollowUp ? store.doctors.find(d => d.id === dueFollowUp.doctorId) : null;

  // Engagement — today's dose-adherence ring (derived from the dose log; same source as Health → Medicines).
  const doseToday = doseStatsForDay(store.medicines, store.doseLog, patient.uhid, todayIso);
  const doseDone = doseToday.total > 0 && doseToday.taken === doseToday.total;
  const doseStreakDays = doseStreak(store.medicines, store.doseLog, patient.uhid, todayIso);

  // M2 age-18 auto-expiry notice (BRD D6/FR-M2-05): grants this patient HOLDS on someone else's record, expiring soon.
  const expiringGrants = store.getGrantsByUser(patient.uhid).filter(g => store.isGrantExpiringSoon(g));

  // M14 — Health Camps, Offers & Advertisements (BRD §18): priority-ordered carousel of live content.
  const visibleContent = store.getVisibleContent(patient).filter(c => c.placements.includes('Home Carousel'));
  const [activeContentId, setActiveContentId] = useState<string | null>(null);
  const activeContent = visibleContent.find(c => c.id === activeContentId);
  const impressedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    visibleContent.forEach(c => {
      if (!impressedRef.current.has(c.id)) {
        impressedRef.current.add(c.id);
        store.recordImpression(c.id);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleContent.map(c => c.id).join(',')]);
  const openContent = (id: string) => { store.recordTap(id); setActiveContentId(id); };

  const actions = [
    { label: 'Book Visit', icon: CalendarPlus, to: '/appointments/book', tone: 'teal' },
    { label: 'Pay Bills', icon: Wallet, to: '/health?tab=Bills', tone: 'indigo' },
    { label: 'Diet', icon: Salad, to: '/health?tab=Diet', tone: 'emerald' },
    { label: 'Complaint', icon: MessageCircleWarning, to: '/care?tab=Complaints', tone: 'rose' },
  ];

  return (
    <PullToRefresh onRefresh={refresh}>
    <div className="pt-2">
      <div className="flex items-center justify-between mb-5">
        <button className="flex items-center gap-2.5 m-tap" onClick={() => setSwitcherOpen(true)}>
          <div className="w-11 h-11 rounded-full bg-[var(--brand-navy)] text-white flex items-center justify-center font-bold text-[16px]">{patient.name[0]}</div>
          <div className="text-left">
            <div className="text-[11.5px] text-slate-400 font-medium">Good day,</div>
            <div className="text-[15.5px] font-extrabold text-slate-800 flex items-center gap-1">{patient.name.split(' ')[0]} <ChevronRight size={14} className="text-slate-300" /></div>
          </div>
        </button>
        <button onClick={() => navigate('/profile')} className="w-10 h-10 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-500 m-tap relative">
          <Bell size={20} strokeWidth={1.9} />
          {store.notifications.length > 0 && <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-red-500" />}
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2.5 mb-6">
        {actions.map((a, i) => (
          <button key={a.label} onClick={() => navigate(a.to)} className="flex flex-col items-center gap-1.5 m-tap m-rise" style={{ animationDelay: `${i * 40}ms` }}>
            <span className="m-icontile lg" data-tone={a.tone}><a.icon /></span>
            <span className="text-[11.5px] font-semibold text-slate-600 text-center leading-tight" style={{ letterSpacing: '.005em' }}>{a.label}</span>
          </button>
        ))}
      </div>

      {family.length > 1 && (
        <MSection title="Family">
          <div className="flex gap-2.5 overflow-x-auto m-noscroll -mx-4 px-4 pb-1">
            {familyOverview.map(({ patient: f, nextApt, pendingCount, dietAwaiting }) => {
              const doc = nextApt ? store.doctors.find(d => d.id === nextApt.doctorId) : null;
              return (
                <button
                  key={f.uhid}
                  onClick={() => store.switchActivePatient(f.uhid)}
                  className={`shrink-0 w-[152px] text-left m-card p-3 m-tap ${f.uhid === patient.uhid ? 'bg-slate-50' : ''}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-[var(--brand-teal-light)] text-[var(--brand-teal)] flex items-center justify-center font-bold text-[13px] shrink-0">{f.name[0]}</div>
                    <div className="min-w-0">
                      <div className="text-[12.5px] font-bold text-slate-700 truncate">{f.name.split(' ')[0]}</div>
                      {f.relation && <div className="text-[10.5px] text-slate-400 truncate">{f.relation}</div>}
                    </div>
                  </div>
                  {nextApt && doc ? (
                    <div className="text-[11px] text-slate-500 leading-snug">{doc.name.replace('Dr. ', 'Dr ')}<br />{nextApt.date}</div>
                  ) : (
                    <div className="text-[11px] text-slate-300">No upcoming visit</div>
                  )}
                  {(pendingCount > 0 || dietAwaiting) && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {pendingCount > 0 && <MPillBadge text="Payment Due" tone="amber" />}
                      {dietAwaiting && <MPillBadge text="Diet" tone="emerald" />}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </MSection>
      )}

      {refreshing ? (
        <div className="space-y-3 mb-6">
          <SkeletonBlock className="h-24 w-full" />
          <div className="grid grid-cols-2 gap-3">
            <SkeletonBlock className="h-16 w-full" />
            <SkeletonBlock className="h-16 w-full" />
          </div>
          <SkeletonBlock className="h-20 w-full" />
        </div>
      ) : (
      <>
      {expiringGrants.length > 0 && (
        <div className="mb-5 space-y-2">
          {expiringGrants.map(g => {
            const ward = store.patients.find(p => p.uhid === g.patientUhid);
            return (
              <div key={g.id} className="rounded-2xl p-3.5 bg-amber-50 border border-amber-100 flex gap-2.5">
                <ShieldAlert size={18} className="text-amber-600 shrink-0 mt-0.5" />
                <div className="text-[12.5px] text-amber-700 font-medium leading-relaxed">
                  Your access to {ward?.name}'s records expires on {g.validUntil} — per hospital policy, guardian access ends automatically at age 18.
                </div>
              </div>
            );
          })}
        </div>
      )}

      {dueFollowUp && dueFollowUpDoctor && (
        <button onClick={() => navigate(`/appointments/book?doctorId=${dueFollowUpDoctor.id}`)} className="w-full text-left rounded-2xl p-3.5 mb-5 bg-sky-50 border border-sky-100 flex gap-2.5 m-tap">
          <CalendarClock size={18} className="text-sky-600 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="text-[12.5px] text-sky-700 font-semibold leading-relaxed">Follow-up with {dueFollowUpDoctor.name} was due {dueFollowUp.followUpDate}. Tap to rebook.</div>
          </div>
          <ChevronRight size={16} className="text-sky-400 shrink-0 mt-0.5" />
        </button>
      )}

      {upcoming && doctor && (
        <button onClick={() => navigate('/appointments')} className="w-full text-left m-card-raised p-4 mb-6 m-tap" style={{ background: 'var(--grad-navy-teal)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="m-label text-white/60">Next Visit</span>
            <MPillBadge text={upcoming.status} tone={statusTone(upcoming.status)} />
          </div>
          <div className="text-white font-bold text-[17px]" style={{ fontFamily: 'var(--font-display)' }}>{doctor.name}</div>
          <div className="text-white/60 text-[12.5px] mt-0.5">{doctor.department} · {upcoming.date} · {upcoming.time}</div>
          {upcoming.token && <div className="mt-2 inline-block bg-white/15 text-white text-[12px] font-bold px-2.5 py-1 rounded-full">Token {upcoming.token}</div>}
        </button>
      )}

      {doseToday.total > 0 && (
        <button onClick={() => navigate('/health?tab=Medicines')} className="w-full text-left m-card p-3.5 mb-6 m-tap flex items-center gap-3.5">
          <ProgressRing value={doseToday.taken / doseToday.total} done={doseDone} size={52} stroke={6}>
            {doseDone ? <CheckCircle2 size={20} className="text-emerald-500 m-pop" /> : <span className="m-num text-[13px] text-slate-700">{doseToday.taken}/{doseToday.total}</span>}
          </ProgressRing>
          <div className="flex-1 min-w-0">
            <div className="m-subhead text-slate-800">{doseDone ? 'All doses done today' : "Today's medicines"}</div>
            <div className="text-[12px] text-slate-400 mt-0.5">{doseDone ? 'Great consistency — see you tomorrow.' : `${doseToday.total - doseToday.taken} dose${doseToday.total - doseToday.taken === 1 ? '' : 's'} still to take`}{doseStreakDays > 0 ? ` · ${doseStreakDays}-day streak` : ''}</div>
          </div>
          <ChevronRight size={16} className="text-slate-300 shrink-0" />
        </button>
      )}

      <div className="grid grid-cols-2 gap-3 mb-6">
        <button onClick={() => navigate('/health?tab=Bills')} className="m-card p-3.5 text-left m-tap">
          <div className="m-display m-num text-[var(--stat-num-color)]">{pendingPay}</div>
          <div className="text-[11.5px] text-slate-400 font-semibold">Pending Payments</div>
        </button>
        <button onClick={() => navigate('/care?tab=Complaints')} className="m-card p-3.5 text-left m-tap">
          <div className="m-display m-num text-[var(--stat-num-color)]">{openComplaints}</div>
          <div className="text-[11.5px] text-slate-400 font-semibold">Open Complaints</div>
        </button>
      </div>

      {visibleContent.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2.5">
            <span className="m-label text-slate-400">Discover</span>
            <button onClick={() => navigate('/camps')} className="flex items-center gap-0.5 text-[11.5px] font-bold text-[var(--brand-teal)] m-tap">View All <ArrowRight size={12} /></button>
          </div>
          <AnnouncementBoard items={visibleContent} onOpen={openContent} />
        </div>
      )}
      </>
      )}

      <Sheet open={!!activeContent} onClose={() => setActiveContentId(null)} title={activeContent?.category}>
        {activeContent && (
          <ContentDetailSheet
            item={activeContent}
            bookmarked={store.bookmarkedContentIds.includes(activeContent.id)}
            onToggleBookmark={() => store.bookmarkedContentIds.includes(activeContent.id) ? store.unbookmarkContent(activeContent.id) : store.bookmarkContent(activeContent.id)}
            registrationCount={store.getCampRegistrationCount(activeContent.id)}
            alreadyRegistered={store.campRegistrations.some(r => r.contentId === activeContent.id && r.patientUhid === patient.uhid)}
            onRegister={() => store.registerForCamp(activeContent.id, patient.uhid)}
            onBookAppointment={(ctaTarget) => { setActiveContentId(null); navigate(ctaTarget ? `/appointments/book?dept=${encodeURIComponent(ctaTarget)}` : '/appointments/book'); }}
            hospitalPhone={activeContent.contactNumber}
          />
        )}
      </Sheet>

      <Sheet open={switcherOpen} onClose={() => setSwitcherOpen(false)} title="Switch Patient">
        <div className="space-y-1">
          {family.map(f => (
            <button key={f.uhid} onClick={() => { store.switchActivePatient(f.uhid); setSwitcherOpen(false); }}
              className={`w-full flex items-center gap-3 py-2.5 m-tap rounded-xl ${f.uhid === patient.uhid ? 'bg-slate-50' : ''}`}>
              <div className="w-10 h-10 rounded-full bg-[var(--brand-teal-light)] text-[var(--brand-teal)] flex items-center justify-center font-bold">{f.name[0]}</div>
              <div className="flex-1 text-left">
                <div className="text-[14.5px] font-bold text-slate-700">{f.name} {f.relation && <span className="text-slate-400 font-medium">({f.relation})</span>}</div>
                <div className="text-[11.5px] text-slate-400">{f.uhid}</div>
              </div>
              <MPillBadge text={f.patientType} tone={f.patientType === 'IPD' ? 'rose' : 'teal'} />
            </button>
          ))}
          <button onClick={() => { store.logout(); navigate('/'); }} className="w-full flex items-center gap-2 py-3 mt-2 text-red-600 font-bold text-[14px] m-tap">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </Sheet>
    </div>
    </PullToRefresh>
  );
}
