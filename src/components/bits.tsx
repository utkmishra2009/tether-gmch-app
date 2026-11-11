import React from 'react';
import { ChevronRight, Inbox, Star } from 'lucide-react';

// Aggregate doctor rating — stars + average only, never raw comments (Differentiator: doctor ratings).
export function StarRating({ avg, count, size = 13 }: { avg?: number; count?: number; size?: number }) {
  if (avg === undefined) return null;
  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center" style={{ gap: 1 }}>
        {[1, 2, 3, 4, 5].map(i => {
          const filled = avg >= i - 0.25;
          return <Star key={i} size={size} strokeWidth={1.75} className={filled ? 'text-amber-400' : 'text-slate-200'} fill={filled ? 'currentColor' : 'none'} />;
        })}
      </div>
      <span className="text-[11.5px] font-bold text-slate-500">{avg.toFixed(1)}</span>
      {count !== undefined && <span className="text-[11px] text-slate-400">({count})</span>}
    </div>
  );
}

export function MSection({ title, action, children }: { title?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      {title && (
        <div className="flex items-center justify-between mb-2.5 px-0.5">
          <h3 className="m-label text-slate-400">{title}</h3>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

export type IconTone = 'teal' | 'navy' | 'indigo' | 'emerald' | 'amber' | 'rose' | 'sky';
export function IconTile({ children, tone = 'teal', large }: { children: React.ReactNode; tone?: IconTone; large?: boolean }) {
  return <span className={`m-icontile ${large ? 'lg' : ''}`} data-tone={tone}>{children}</span>;
}
export function MRow({ title, subtitle, right, onClick, icon, tone }: { title: string; subtitle?: string; right?: React.ReactNode; onClick?: () => void; icon?: React.ReactNode; tone?: IconTone }) {
  const Comp: any = onClick ? 'button' : 'div';
  return (
    <Comp onClick={onClick} className={`w-full flex items-center gap-3 py-3 text-left ${onClick ? 'm-tap' : ''}`}>
      {icon && <IconTile tone={tone}>{icon}</IconTile>}
      <div className="flex-1 min-w-0">
        <div className="m-subhead text-slate-800 truncate">{title}</div>
        {subtitle && <div className="m-caption text-slate-400 truncate mt-0.5">{subtitle}</div>}
      </div>
      {right}
      {onClick && <ChevronRight size={18} strokeWidth={2} className="text-slate-300 shrink-0" />}
    </Comp>
  );
}

export function MSegmented({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-1.5 overflow-x-auto m-noscroll -mx-4 px-4 pb-1">
      {options.map(o => (
        <button key={o} onClick={() => onChange(o)} className={`m-chip m-tap shrink-0 ${value === o ? 'active' : ''}`}>{o}</button>
      ))}
    </div>
  );
}

export function MEmpty({ title, subtitle, icon, actionLabel, onAction }: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="text-center py-12 px-6 flex flex-col items-center">
      <div className="m-empty-art m-pop" aria-hidden="true">
        <span className="r1" /><span className="r2" /><span className="dot d1" /><span className="dot d2" /><span className="dot d3" />
        <span className="tile">{icon ?? <Inbox size={22} strokeWidth={1.75} />}</span>
      </div>
      <div className="m-subhead text-slate-600">{title}</div>
      {subtitle && <div className="m-caption text-slate-400 mt-1 max-w-[240px] leading-relaxed">{subtitle}</div>}
      {actionLabel && onAction && (
        <button onClick={onAction} className="m-tap mt-4 text-[13px] font-bold text-[var(--brand-teal)] bg-[var(--brand-teal-light)] px-4 py-2 rounded-xl">
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function MPillBadge({ text, tone = 'slate' }: { text: string; tone?: 'slate' | 'teal' | 'red' | 'amber' | 'emerald' | 'indigo' | 'rose' | 'sky' | 'orange' | 'purple' }) {
  const map: Record<string, string> = {
    slate: 'bg-slate-100 text-slate-600',
    teal: 'bg-[var(--brand-teal-light)] text-[var(--brand-teal)]',
    red: 'bg-red-50 text-red-700',
    amber: 'bg-amber-50 text-amber-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    indigo: 'bg-indigo-50 text-indigo-700',
    rose: 'bg-rose-50 text-rose-700',
    sky: 'bg-sky-50 text-sky-700',
    orange: 'bg-orange-50 text-orange-700',
    purple: 'bg-purple-50 text-purple-700',
  };
  return <span className={`text-[11px] font-bold px-2 py-1 rounded-full ${map[tone]}`}>{text}</span>;
}

export function statusTone(status: string): any {
  if (['Token Generated', 'Consultation Completed', 'Checked-in', 'Paid', 'Success', 'Resolved', 'Completed', 'Report Available', 'Delivered', 'Active', 'Processed'].includes(status)) return 'emerald';
  if (['Payment Pending', 'Pending Payment', 'Authorization Pending', 'In Progress', 'Refund Pending'].includes(status)) return 'amber';
  if (['Assigned', 'Submitted', 'Requested', 'Response Provided', 'Staff Verification'].includes(status)) return 'sky';
  if (['Escalated', 'Reopened', 'Escalated to Service Request'].includes(status)) return 'orange';
  if (['SLA Breached', 'Failed', 'Cancelled', 'Rejected', 'No Show', 'Not Eligible', 'Timeout', 'Blocked'].includes(status)) return 'red';
  return 'slate';
}
