import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../data/store';
import { seedStaff } from '../../data/seed';
import { ScreenHeader } from '../../components/Shell';
import { MSegmented, MPillBadge, MEmpty } from '../../components/bits';
import Sheet from '../../components/Sheet';
import { ContentBanner } from '../../components/content';
import { ChevronLeft, ChevronUp, ChevronDown, Eye, MousePointerClick, Users2, Megaphone } from 'lucide-react';
import type { Announcement, ContentCategory, ContentApprovalStatus, ContentCTA } from '../../data/types';

const CATEGORIES: ContentCategory[] = ['Health Camp', 'Health Check-up Package', 'New Doctor', 'Achievement', 'New Facility', 'Offer', 'Announcement'];
const CTAS: ContentCTA[] = ['None', 'Book Appointment', 'Register for Camp', 'View Package', 'Call Hospital', 'Get Directions'];
const STATUS_FILTERS = ['All', 'Draft', 'Pending Approval', 'Approved', 'Rejected'];
const CATEGORY_FILTERS = ['All', ...CATEGORIES];

const approvalTone = (s: ContentApprovalStatus) => s === 'Approved' ? 'emerald' : s === 'Rejected' ? 'red' : s === 'Pending Approval' ? 'amber' : 'slate';

const emptyDraft = (createdBy: string): Omit<Announcement, 'id' | 'approvalStatus' | 'displaySequence'> => ({
  category: 'Announcement', title: '', body: '', startDate: '', endDate: '', feeType: 'Free',
  priority: 'Medium', active: true, targeting: { patientType: 'All' }, placements: ['Home Carousel', 'Camps Tab'],
  cta: 'None', createdBy, pinned: false,
});

export default function StaffContentConsole() {
  const store = useStore();
  const navigate = useNavigate();
  const staffUser = seedStaff.find(s => s.id === store.currentStaffId)!;
  const canApprove = staffUser.role === 'Admin' || staffUser.role === 'Management';

  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [createOpen, setCreateOpen] = useState(false);
  const [draft, setDraft] = useState(emptyDraft(staffUser.name));
  const [detailId, setDetailId] = useState<string | null>(null);

  const items = [...store.contentItems]
    .filter(c => statusFilter === 'All' || c.approvalStatus === statusFilter)
    .filter(c => categoryFilter === 'All' || c.category === categoryFilter)
    .sort((a, b) => a.displaySequence - b.displaySequence);

  const detail = store.contentItems.find(c => c.id === detailId);

  const submitCreate = () => {
    if (!draft.title.trim() || !draft.body.trim() || !draft.startDate || !draft.endDate) return;
    store.createContentItem(draft);
    setDraft(emptyDraft(staffUser.name));
    setCreateOpen(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="m-safe-top shrink-0" />
      <div className="flex-1 overflow-y-auto m-noscroll px-4 pb-3">
        <div className="flex items-center gap-2 pt-1 pb-1">
          <button onClick={() => navigate('/staff/dashboard')} className="m-tap text-slate-500"><ChevronLeft size={24} strokeWidth={2} /></button>
          <ScreenHeader title="Content Console" subtitle="Health camps, offers & advertisements" right={
            <button onClick={() => { setDraft(emptyDraft(staffUser.name)); setCreateOpen(true); }} className="w-10 h-10 rounded-full bg-[var(--brand-teal)] text-white flex items-center justify-center m-tap font-bold text-[20px] leading-none">+</button>
          } />
        </div>
        <div className="mb-3"><MSegmented options={STATUS_FILTERS} value={statusFilter} onChange={setStatusFilter} /></div>
        <div className="mb-4"><MSegmented options={CATEGORY_FILTERS} value={categoryFilter} onChange={setCategoryFilter} /></div>

        {items.length === 0 ? <MEmpty title="No content items" subtitle="Tap + to create one" icon={<Megaphone size={20} strokeWidth={1.75} />} /> : (
          <div className="space-y-2.5">
            {items.map((c, idx) => {
              const analytics = store.contentAnalytics[c.id] || { impressions: 0, taps: 0 };
              const regs = store.campRegistrations.filter(r => r.contentId === c.id).length;
              return (
                <div key={c.id} className="m-card p-0 overflow-hidden">
                  <button onClick={() => setDetailId(c.id)} className="w-full text-left m-tap">
                    <ContentBanner item={c} height={72} />
                  </button>
                  <div className="p-3.5">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <MPillBadge text={c.approvalStatus} tone={approvalTone(c.approvalStatus)} />
                      <div className="flex items-center gap-1.5">
                        <MPillBadge text={c.active ? 'Active' : 'Inactive'} tone={c.active ? 'emerald' : 'slate'} />
                        <button onClick={() => store.toggleContentActive(c.id)} className="text-[11px] font-bold text-slate-500 px-2 py-1 rounded-lg bg-slate-100 m-tap">{c.active ? 'Deactivate' : 'Activate'}</button>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-[11.5px] text-slate-500 font-medium">
                      <span className="flex items-center gap-1"><Eye size={13} /> {analytics.impressions}</span>
                      <span className="flex items-center gap-1"><MousePointerClick size={13} /> {analytics.taps}</span>
                      {c.category === 'Health Camp' && <span className="flex items-center gap-1"><Users2 size={13} /> {regs}{c.capacity !== undefined ? `/${c.capacity}` : ''}</span>}
                      <span className="ml-auto">{c.createdBy}</span>
                    </div>
                    <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-slate-50">
                      <div className="flex items-center gap-1">
                        <button disabled={idx === 0} onClick={() => store.reorderContent(c.id, 'up')} className="w-7 h-7 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center m-tap disabled:opacity-30"><ChevronUp size={15} /></button>
                        <button disabled={idx === items.length - 1} onClick={() => store.reorderContent(c.id, 'down')} className="w-7 h-7 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center m-tap disabled:opacity-30"><ChevronDown size={15} /></button>
                        <span className="text-[11px] text-slate-400 ml-1">Seq {c.displaySequence}</span>
                      </div>
                      {canApprove && c.approvalStatus === 'Pending Approval' && (
                        <div className="flex gap-1.5">
                          <button onClick={() => store.setContentApproval(c.id, 'Rejected')} className="text-[11.5px] font-bold text-red-600 px-2.5 py-1.5 rounded-lg bg-red-50 m-tap">Reject</button>
                          <button onClick={() => store.setContentApproval(c.id, 'Approved')} className="text-[11.5px] font-bold text-emerald-700 px-2.5 py-1.5 rounded-lg bg-emerald-50 m-tap">Approve</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Sheet open={!!detail} onClose={() => setDetailId(null)} title={detail?.title}>
        {detail && (
          <div className="space-y-2 text-[13px] text-slate-600">
            <div><b>Category:</b> {detail.category}</div>
            <div><b>Window:</b> {detail.startDate} → {detail.endDate}</div>
            {detail.venue && <div><b>Venue:</b> {detail.venue}</div>}
            <div><b>Targeting:</b> {detail.targeting.patientType}{detail.targeting.gender ? `, ${detail.targeting.gender}` : ''}{detail.targeting.ageMin !== undefined ? `, ${detail.targeting.ageMin}-${detail.targeting.ageMax ?? '∞'}y` : ''}</div>
            <div><b>Placements:</b> {detail.placements.join(', ')}</div>
            <div><b>CTA:</b> {detail.cta}{detail.ctaTarget ? ` (${detail.ctaTarget})` : ''}</div>
            <div className="pt-2 border-t border-slate-100">{detail.body}</div>
          </div>
        )}
      </Sheet>

      <Sheet open={createOpen} onClose={() => setCreateOpen(false)} title="New Content Item">
        <div className="space-y-2.5">
          <label className="text-[12px] font-semibold text-slate-400">Category</label>
          <select className="m-input" value={draft.category} onChange={e => setDraft({ ...draft, category: e.target.value as ContentCategory })}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <label className="text-[12px] font-semibold text-slate-400">Title</label>
          <input className="m-input" value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} />
          <label className="text-[12px] font-semibold text-slate-400">Description</label>
          <textarea className="m-input" rows={3} value={draft.body} onChange={e => setDraft({ ...draft, body: e.target.value })} />
          <label className="text-[12px] font-semibold text-slate-400">Venue (optional)</label>
          <input className="m-input" value={draft.venue || ''} onChange={e => setDraft({ ...draft, venue: e.target.value })} />
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-[12px] font-semibold text-slate-400">Start Date</label>
              <input type="date" className="m-input" value={draft.startDate} onChange={e => setDraft({ ...draft, startDate: e.target.value })} />
            </div>
            <div>
              <label className="text-[12px] font-semibold text-slate-400">End Date</label>
              <input type="date" className="m-input" value={draft.endDate} onChange={e => setDraft({ ...draft, endDate: e.target.value })} />
            </div>
          </div>
          {draft.category === 'Health Camp' && (
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[12px] font-semibold text-slate-400">Registration Opens</label>
                <input type="date" className="m-input" value={draft.registrationOpenDate || ''} onChange={e => setDraft({ ...draft, registrationOpenDate: e.target.value })} />
              </div>
              <div>
                <label className="text-[12px] font-semibold text-slate-400">Registration Closes</label>
                <input type="date" className="m-input" value={draft.registrationCloseDate || ''} onChange={e => setDraft({ ...draft, registrationCloseDate: e.target.value })} />
              </div>
              <div className="col-span-2">
                <label className="text-[12px] font-semibold text-slate-400">Capacity</label>
                <input type="number" className="m-input" value={draft.capacity ?? ''} onChange={e => setDraft({ ...draft, capacity: e.target.value ? Number(e.target.value) : undefined })} />
              </div>
            </div>
          )}
          <label className="text-[12px] font-semibold text-slate-400">Fee</label>
          <div className="flex gap-2">
            <select className="m-input flex-1" value={draft.feeType} onChange={e => setDraft({ ...draft, feeType: e.target.value as 'Free' | 'Paid' })}>
              <option value="Free">Free</option><option value="Paid">Paid</option>
            </select>
            {draft.feeType === 'Paid' && <input type="number" className="m-input flex-1" placeholder="Amount (₹)" value={draft.fee ?? ''} onChange={e => setDraft({ ...draft, fee: Number(e.target.value) })} />}
          </div>
          <label className="text-[12px] font-semibold text-slate-400">Eligibility (optional)</label>
          <input className="m-input" value={draft.eligibility || ''} onChange={e => setDraft({ ...draft, eligibility: e.target.value })} />
          <label className="text-[12px] font-semibold text-slate-400">Contact Number (optional)</label>
          <input className="m-input" value={draft.contactNumber || ''} onChange={e => setDraft({ ...draft, contactNumber: e.target.value })} />
          <label className="text-[12px] font-semibold text-slate-400">Priority</label>
          <select className="m-input" value={draft.priority} onChange={e => setDraft({ ...draft, priority: e.target.value as any })}>
            <option>High</option><option>Medium</option><option>Low</option>
          </select>
          <label className="text-[12px] font-semibold text-slate-400">Targeting — Patient Type</label>
          <select className="m-input" value={draft.targeting.patientType} onChange={e => setDraft({ ...draft, targeting: { ...draft.targeting, patientType: e.target.value as any } })}>
            <option value="All">All</option><option value="OPD">OPD only</option><option value="IPD">IPD only</option>
          </select>
          <label className="text-[12px] font-semibold text-slate-400">Targeting — Gender</label>
          <select className="m-input" value={draft.targeting.gender || 'All'} onChange={e => setDraft({ ...draft, targeting: { ...draft.targeting, gender: e.target.value as any } })}>
            <option value="All">All</option><option value="Male">Male only</option><option value="Female">Female only</option>
          </select>
          <label className="text-[12px] font-semibold text-slate-400">Placements</label>
          <div className="flex flex-wrap gap-2">
            {(['Home Carousel', 'Camps Tab', 'Interstitial'] as const).map(p => (
              <button key={p} onClick={() => setDraft({ ...draft, placements: draft.placements.includes(p) ? draft.placements.filter(x => x !== p) : [...draft.placements, p] })}
                className={`px-3 py-1.5 rounded-xl text-[12px] font-bold border m-tap ${draft.placements.includes(p) ? 'text-[var(--brand-teal)]' : 'border-slate-200 text-slate-600'}`}
                style={draft.placements.includes(p) ? { borderColor: 'var(--brand-teal)', borderWidth: 2, background: 'var(--brand-teal-light)' } : undefined}>
                {p}
              </button>
            ))}
          </div>
          <label className="text-[12px] font-semibold text-slate-400">Call-to-Action</label>
          <select className="m-input" value={draft.cta} onChange={e => setDraft({ ...draft, cta: e.target.value as ContentCTA })}>
            {CTAS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          {draft.cta === 'Book Appointment' && (
            <>
              <label className="text-[12px] font-semibold text-slate-400">CTA Target (Department)</label>
              <input className="m-input" value={draft.ctaTarget || ''} onChange={e => setDraft({ ...draft, ctaTarget: e.target.value })} />
            </>
          )}
          <label className="text-[12px] font-semibold text-slate-400">Disclaimer / Terms (optional)</label>
          <textarea className="m-input" rows={2} value={draft.disclaimer || ''} onChange={e => setDraft({ ...draft, disclaimer: e.target.value })} />
          <label className="flex items-center gap-2.5 py-1 cursor-pointer">
            <input type="checkbox" className="w-4 h-4 accent-[var(--brand-teal)]" checked={draft.pinned} onChange={e => setDraft({ ...draft, pinned: e.target.checked })} />
            <span className="text-[12.5px] font-semibold text-slate-600">Pin as urgent/emergency advisory (bypasses ordering)</span>
          </label>
          <p className="text-[11px] text-slate-400 leading-relaxed">This will be created with status "Pending Approval" — an Admin/Management user must approve it before patients can see it.</p>
          <button className="m-btn-primary" disabled={!draft.title.trim() || !draft.body.trim() || !draft.startDate || !draft.endDate} onClick={submitCreate}>Submit for Approval</button>
        </div>
      </Sheet>
    </div>
  );
}
