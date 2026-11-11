import React, { useEffect, useState } from 'react';
import { HeartPulse, Stethoscope, UserPlus, Award, Building2, Tag, Megaphone, Bookmark, MapPin, Phone, Users2, CalendarRange, IndianRupee, Info, ChevronRight } from 'lucide-react';
import type { Announcement, ContentCategory } from '../data/types';
import { MPillBadge } from './bits';

export const CATEGORY_STYLE: Record<ContentCategory, { gradient: string; icon: any; label: string }> = {
  'Health Camp': { gradient: 'linear-gradient(135deg,#0e7c86,#0a4f56)', icon: HeartPulse, label: 'Health Camp' },
  'Health Check-up Package': { gradient: 'linear-gradient(135deg,#0f2a4a,#1c4a73)', icon: Stethoscope, label: 'Health Package' },
  'New Doctor': { gradient: 'linear-gradient(135deg,#155e75,#0e7c86)', icon: UserPlus, label: 'New Doctor' },
  'Achievement': { gradient: 'linear-gradient(135deg,#b8860b,#8a6508)', icon: Award, label: 'Achievement' },
  'New Facility': { gradient: 'linear-gradient(135deg,#334155,#0f2a4a)', icon: Building2, label: 'New Facility' },
  'Offer': { gradient: 'linear-gradient(135deg,#c0392b,#8e2a20)', icon: Tag, label: 'Offer' },
  'Announcement': { gradient: 'linear-gradient(135deg,#0f2a4a,#0b1f36)', icon: Megaphone, label: 'Announcement' },
};

export function contentWindowLabel(item: Announcement): 'Ongoing' | 'Upcoming' | 'Ended' {
  const now = Date.now();
  const start = new Date(item.startDate + 'T00:00:00').getTime();
  const end = new Date(item.endDate + 'T23:59:59').getTime();
  if (now < start) return 'Upcoming';
  if (now > end) return 'Ended';
  return 'Ongoing';
}

export function ContentBanner({ item, height = 96 }: { item: Announcement; height?: number }) {
  const style = CATEGORY_STYLE[item.category];
  const Icon = style.icon;
  return (
    <div className="rounded-t-2xl relative overflow-hidden shrink-0 flex items-end px-3.5 pb-3"
      style={{ height, background: item.pinned ? 'linear-gradient(135deg,#c0392b,#7a1d14)' : style.gradient }}>
      <Icon size={72} className="text-white/15 absolute -right-3 -top-3" strokeWidth={1.5} />
      <div className="relative z-10 min-w-0">
        <div className="text-white/70 text-[10px] font-extrabold uppercase tracking-wide flex items-center gap-1">
          {item.pinned && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
          {item.pinned ? 'Urgent Advisory' : style.label}
        </div>
        <div className="text-white font-bold text-[14px] leading-snug mt-1 line-clamp-2" style={{ fontFamily: 'var(--font-display)' }}>{item.title}</div>
      </div>
    </div>
  );
}

/**
 * Compact, auto-scrolling advertisement/announcement board — one item visible at a time,
 * cycling automatically. Replaces a dense grid of cards on Home with a single slim strip;
 * the full browsable grid still lives on the dedicated Discover screen ("View All").
 */
export function AnnouncementBoard({ items, onOpen, intervalMs = 4500 }: {
  items: Announcement[]; onOpen: (id: string) => void; intervalMs?: number;
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reducedMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const item = items[index % Math.max(items.length, 1)];

  useEffect(() => { setIndex(0); }, [items.length]);
  useEffect(() => {
    if (items.length <= 1 || paused) return;
    const t = setInterval(() => setIndex(i => (i + 1) % items.length), intervalMs);
    return () => clearInterval(t);
  }, [items.length, paused, intervalMs]);

  if (!item) return null;
  const style = CATEGORY_STYLE[item.category];
  const Icon = style.icon;

  return (
    <button
      onClick={() => onOpen(item.id)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      className="w-full text-left rounded-2xl relative overflow-hidden m-tap"
      style={{ minHeight: 76, boxShadow: 'var(--shadow-raised)' }}
    >
      <div
        key={item.id}
        className={reducedMotion ? '' : 'm-fade-swap'}
        style={{ background: item.pinned ? 'linear-gradient(120deg,#c0392b,#7a1d14)' : style.gradient, padding: '13px 14px' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
            <Icon size={18} className="text-white" strokeWidth={2} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-white/70 text-[10px] font-extrabold uppercase tracking-wide flex items-center gap-1">
              {item.pinned && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
              {item.pinned ? 'Urgent Advisory' : style.label}
            </div>
            <div className="text-white font-bold text-[13.5px] leading-snug truncate mt-0.5" style={{ fontFamily: 'var(--font-display)' }}>{item.title}</div>
          </div>
          <ChevronRight size={16} className="text-white/50 shrink-0" />
        </div>
      </div>
      {items.length > 1 && (
        <div className="absolute bottom-1.5 right-3 flex items-center gap-1">
          {items.map((it, i) => (
            <span key={it.id} className="rounded-full transition-all" style={{ width: i === index ? 12 : 4, height: 4, background: i === index ? 'rgba(255,255,255,.9)' : 'rgba(255,255,255,.35)' }} />
          ))}
        </div>
      )}
    </button>
  );
}

export function ContentCard({ item, bookmarked, onToggleBookmark, onOpen, width }: {
  item: Announcement; bookmarked: boolean; onToggleBookmark: () => void; onOpen: () => void; width?: number;
}) {
  const win = contentWindowLabel(item);
  return (
    <button onClick={onOpen} className={`m-card p-0 overflow-hidden text-left m-tap ${width ? 'shrink-0' : 'w-full'}`} style={width ? { width } : undefined}>
      <ContentBanner item={item} />
      <div className="p-3">
        <div className="flex items-center justify-between gap-2">
          <MPillBadge text={win} tone={win === 'Ongoing' ? 'emerald' : win === 'Upcoming' ? 'sky' : 'slate'} />
          <button onClick={(e) => { e.stopPropagation(); onToggleBookmark(); }} className="text-slate-300 m-tap shrink-0">
            <Bookmark size={17} className={bookmarked ? 'fill-[var(--brand-teal)] text-[var(--brand-teal)]' : ''} />
          </button>
        </div>
        <div className="text-[11px] text-slate-400 mt-1.5">{item.startDate} – {item.endDate}</div>
      </div>
    </button>
  );
}

export function ContentDetailSheet({
  item, bookmarked, onToggleBookmark, registrationCount, alreadyRegistered, onRegister, onBookAppointment, hospitalPhone,
}: {
  item: Announcement;
  bookmarked: boolean;
  onToggleBookmark: () => void;
  registrationCount: number;
  alreadyRegistered: boolean;
  onRegister: () => { ok: boolean; message: string };
  onBookAppointment: (ctaTarget?: string) => void;
  hospitalPhone?: string;
}) {
  const [regResult, setRegResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [enquired, setEnquired] = useState(false);
  const full = item.capacity !== undefined && registrationCount >= item.capacity;
  const win = contentWindowLabel(item);

  const doRegister = () => setRegResult(onRegister());

  return (
    <div className="space-y-3.5 -mt-1">
      <ContentBanner item={item} height={120} />
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <MPillBadge text={win} tone={win === 'Ongoing' ? 'emerald' : win === 'Upcoming' ? 'sky' : 'slate'} />
          <MPillBadge text={item.priority} tone={item.priority === 'High' ? 'red' : item.priority === 'Medium' ? 'amber' : 'slate'} />
          {item.feeType === 'Free' ? <MPillBadge text="Free" tone="emerald" /> : <MPillBadge text={item.fee ? `₹${item.fee}` : 'Paid'} tone="indigo" />}
        </div>
        <button onClick={onToggleBookmark} className="text-slate-300 m-tap shrink-0">
          <Bookmark size={20} className={bookmarked ? 'fill-[var(--brand-teal)] text-[var(--brand-teal)]' : ''} />
        </button>
      </div>

      <p className="text-[13.5px] text-slate-600 leading-relaxed">{item.body}</p>

      <div className="bg-slate-50 rounded-2xl p-3.5 space-y-2 text-[12.5px]">
        <div className="flex items-center gap-2 text-slate-600"><CalendarRange size={16} className="text-[var(--brand-teal)] shrink-0" /><span className="font-semibold">{item.startDate} → {item.endDate}</span></div>
        {item.venue && <div className="flex items-center gap-2 text-slate-600"><MapPin size={16} className="text-[var(--brand-teal)] shrink-0" /><span>{item.venue}</span></div>}
        {item.organizingDoctor && <div className="flex items-center gap-2 text-slate-600"><Users2 size={16} className="text-[var(--brand-teal)] shrink-0" /><span>{item.organizingDoctor}</span></div>}
        {item.eligibility && <div className="flex items-center gap-2 text-slate-600"><Info size={16} className="text-[var(--brand-teal)] shrink-0" /><span>{item.eligibility}</span></div>}
        {item.fee !== undefined && <div className="flex items-center gap-2 text-slate-600"><IndianRupee size={16} className="text-[var(--brand-teal)] shrink-0" /><span>₹{item.fee}</span></div>}
        {item.contactNumber && <div className="flex items-center gap-2 text-slate-600"><Phone size={16} className="text-[var(--brand-teal)] shrink-0" /><span>{item.contactNumber}</span></div>}
      </div>

      {item.category === 'Health Camp' && item.capacity !== undefined && (
        <div className="text-[12px] text-slate-400 font-medium">{registrationCount}/{item.capacity} registered{full ? ' — camp full' : ''}</div>
      )}

      {item.disclaimer && <div className="text-[11.5px] text-slate-400 bg-slate-50 rounded-xl p-3 leading-relaxed italic">{item.disclaimer}</div>}

      {item.cta === 'Register for Camp' && (
        <div className="space-y-2">
          {regResult && <div className={`text-[12.5px] rounded-xl p-3 font-medium ${regResult.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{regResult.message}</div>}
          <button className="m-btn-primary" disabled={alreadyRegistered || full || (regResult?.ok ?? false)} onClick={doRegister}>
            {alreadyRegistered || (regResult?.ok ?? false) ? 'Registered' : full ? 'Capacity Full' : 'Register for Camp'}
          </button>
        </div>
      )}
      {item.cta === 'Book Appointment' && (
        <button className="m-btn-primary" onClick={() => onBookAppointment(item.ctaTarget)}>Book Appointment{item.ctaTarget ? ` — ${item.ctaTarget}` : ''}</button>
      )}
      {item.cta === 'View Package' && (
        enquired
          ? <div className="text-[12.5px] rounded-xl p-3 font-medium bg-emerald-50 text-emerald-700">Noted — our team will reach out with package details and slot options.</div>
          : <button className="m-btn-primary" onClick={() => setEnquired(true)}>Enquire About This Package</button>
      )}
      {item.cta === 'Call Hospital' && hospitalPhone && (
        <a href={`tel:${hospitalPhone.replace(/[^0-9+]/g, '')}`} className="m-btn-primary block text-center">Call {hospitalPhone}</a>
      )}
      {item.cta === 'Get Directions' && (
        <button className="m-btn-secondary" onClick={() => {}}>Get Directions</button>
      )}
    </div>
  );
}
