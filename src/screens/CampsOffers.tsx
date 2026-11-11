import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../data/store';
import { ScreenHeader } from '../components/Shell';
import { MSegmented, MEmpty } from '../components/bits';
import { SearchX } from 'lucide-react';
import Sheet from '../components/Sheet';
import { ContentCard, ContentDetailSheet, contentWindowLabel } from '../components/content';
import PullToRefresh from '../components/PullToRefresh';
import { useSkeletonLoading, SkeletonGrid } from '../components/Skeleton';
import { CoachMark, useCoachMark } from '../components/CoachMark';
import type { ContentCategory } from '../data/types';

const CATEGORIES: (ContentCategory | 'All')[] = ['All', 'Health Camp', 'Health Check-up Package', 'New Doctor', 'Achievement', 'New Facility', 'Offer', 'Announcement'];
const WINDOWS = ['All', 'Ongoing', 'Upcoming'];

export default function CampsOffers() {
  const store = useStore();
  const navigate = useNavigate();
  const patient = store.patients.find(p => p.uhid === store.currentPatientUhid)!;

  const [category, setCategory] = useState<ContentCategory | 'All'>('All');
  const [win, setWin] = useState('All');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, refresh] = useSkeletonLoading();
  const [discoverCoachDismissed, dismissDiscoverCoach] = useCoachMark('discover');

  const all = store.getTargetedContent(patient)
    .filter(c => c.placements.includes('Camps Tab') || c.placements.includes('Home Carousel'))
    .map(c => ({ ...c, _win: contentWindowLabel(c) }))
    .filter(c => c._win !== 'Ended');

  const filtered = all
    .filter(c => category === 'All' || c.category === category)
    .filter(c => win === 'All' || c._win === win)
    .sort((a, b) => (a._win === b._win ? a.startDate.localeCompare(b.startDate) : a._win === 'Ongoing' ? -1 : 1));

  const active = filtered.find(c => c.id === activeId) || all.find(c => c.id === activeId);

  return (
    <div className="flex flex-col h-full">
      <div className="m-safe-top shrink-0" />
      <div className="flex-1 overflow-y-auto m-noscroll px-4 pb-3">
      <PullToRefresh onRefresh={refresh}>
        <ScreenHeader title="Discover" subtitle="Health camps, packages, offers & hospital news" />
        <div className="mb-3"><MSegmented options={WINDOWS} value={win} onChange={setWin} /></div>
        <div className="mb-4"><MSegmented options={CATEGORIES} value={category} onChange={v => setCategory(v as any)} /></div>
        <CoachMark show={!discoverCoachDismissed} onDismiss={dismissDiscoverCoach}
          text="Browse health camps, packages & offers here — tap the bookmark icon on any card to save it for later." />

        {loading ? <SkeletonGrid count={6} /> : filtered.length === 0 ? (
          <MEmpty
            title="Nothing matches these filters"
            subtitle="Try a different category or window"
            icon={<SearchX size={20} strokeWidth={1.75} />}
            actionLabel={(category !== 'All' || win !== 'All') ? 'Clear Filters' : undefined}
            onAction={() => { setCategory('All'); setWin('All'); }}
          />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((c, i) => (
              <div key={c.id} className="m-rise" style={{ animationDelay: `${Math.min(i, 8) * 35}ms` }}>
                <ContentCard item={c}
                  bookmarked={store.bookmarkedContentIds.includes(c.id)}
                  onToggleBookmark={() => store.bookmarkedContentIds.includes(c.id) ? store.unbookmarkContent(c.id) : store.bookmarkContent(c.id)}
                  onOpen={() => { store.recordTap(c.id); setActiveId(c.id); }} />
              </div>
            ))}
          </div>
        )}
      </PullToRefresh>
      </div>

      <Sheet open={!!active} onClose={() => setActiveId(null)} title={active?.category}>
        {active && (
          <ContentDetailSheet
            item={active}
            bookmarked={store.bookmarkedContentIds.includes(active.id)}
            onToggleBookmark={() => store.bookmarkedContentIds.includes(active.id) ? store.unbookmarkContent(active.id) : store.bookmarkContent(active.id)}
            registrationCount={store.getCampRegistrationCount(active.id)}
            alreadyRegistered={store.campRegistrations.some(r => r.contentId === active.id && r.patientUhid === patient.uhid)}
            onRegister={() => store.registerForCamp(active.id, patient.uhid)}
            onBookAppointment={(ctaTarget) => { setActiveId(null); navigate(ctaTarget ? `/appointments/book?dept=${encodeURIComponent(ctaTarget)}` : '/appointments/book'); }}
            hospitalPhone={active.contactNumber}
          />
        )}
      </Sheet>
    </div>
  );
}
