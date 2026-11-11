import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore, getScopedComplaints, getScopedServiceRequests } from '../../data/store';
import { seedStaff } from '../../data/seed';
import { ScreenHeader } from '../../components/Shell';
import { MSegmented, MEmpty, MPillBadge, statusTone } from '../../components/bits';
import Sheet from '../../components/Sheet';
import { useSkeletonLoading, SkeletonList } from '../../components/Skeleton';
import { LogOut, Inbox, FileCheck2 } from 'lucide-react';
import type { Complaint, ServiceRequest } from '../../data/types';

type Item = ({ kind: 'complaint' } & Complaint) | ({ kind: 'request' } & ServiceRequest);

export default function StaffDashboard() {
  const store = useStore();
  const navigate = useNavigate();
  const staffUser = seedStaff.find(s => s.id === store.currentStaffId)!;

  const [tab, setTab] = useState('My Queue');
  const [loading] = useSkeletonLoading();
  const isAdminTier = staffUser.role === 'Admin' || staffUser.role === 'Management';
  const tabs = isAdminTier
    ? ['My Queue', 'Escalated', 'Resolved', 'MRD Queue', 'Content', 'Masters']
    : ['My Queue', 'Escalated', 'Resolved', 'MRD Queue', 'Content'];

  const pendingCorrections = store.correctionRequests.filter(c => c.status === 'Pending').sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const resolvedCorrections = store.correctionRequests.filter(c => c.status !== 'Pending').sort((a, b) => (b.resolvedAt || '').localeCompare(a.resolvedAt || ''));
  const [corActiveId, setCorActiveId] = useState<string | null>(null);
  const corActive = store.correctionRequests.find(c => c.id === corActiveId);
  const [corRemarks, setCorRemarks] = useState('');
  const resolveCorrection = (decision: 'Approved' | 'Rejected') => {
    if (!corActiveId) return;
    store.staffResolveCorrectionRequest(corActiveId, decision, corRemarks);
    setCorRemarks(''); setCorActiveId(null);
  };

  const scopedComplaints = getScopedComplaints(store.complaints, staffUser);
  const scopedRequests = getScopedServiceRequests(store.serviceRequests, staffUser);

  const complaintItems: Item[] = scopedComplaints.map(c => ({ kind: 'complaint', ...c }));
  const requestItems: Item[] = scopedRequests.map(r => ({ kind: 'request', ...r }));
  const all = [...complaintItems, ...requestItems];

  const isResolved = (i: Item) => i.kind === 'complaint' ? ['Resolved', 'Closed'].includes(i.status) : i.status === 'Completed';
  const isEscalated = (i: Item) => i.kind === 'complaint' ? (i.level !== 'L1' && !isResolved(i)) : (i.status === 'SLA Breached' && !isResolved(i));

  const visible = tab === 'Resolved' ? all.filter(isResolved)
    : tab === 'Escalated' ? all.filter(isEscalated)
    : tab === 'My Queue' ? all.filter(i => !isResolved(i) && !isEscalated(i))
    : [];

  visible.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const [activeKey, setActiveKey] = useState<string | null>(null);
  const active = all.find(i => `${i.kind}-${i.id}` === activeKey);
  const [response, setResponse] = useState('');

  const canRespond = true;
  const canEscalate = staffUser.role !== 'Staff';
  const canClose = staffUser.role !== 'Staff';

  const doRespond = () => {
    if (!active || !response.trim()) return;
    if (active.kind === 'complaint') store.staffRespondComplaint(active.id, response);
    else store.staffRespondServiceRequest(active.id, response);
    setResponse(''); setActiveKey(null);
  };
  const doEscalate = () => {
    if (!active) return;
    if (active.kind === 'request') store.staffEscalateServiceRequest(active.id);
    setActiveKey(null);
  };
  const doClose = () => {
    if (!active) return;
    if (active.kind === 'complaint') store.staffCloseComplaint(active.id);
    else store.staffCloseServiceRequest(active.id);
    setActiveKey(null);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="m-safe-top shrink-0" />
      <div className="flex-1 overflow-y-auto m-noscroll px-4 pb-3">
        <ScreenHeader title={staffUser.name} subtitle={`${staffUser.role} · ${staffUser.department}`} right={
          <button onClick={() => { store.staffLogout(); navigate('/staff/login'); }} className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center m-tap"><LogOut size={18} strokeWidth={1.9} /></button>
        } />
        <div className="mb-4">
          <MSegmented options={tabs} value={tab} onChange={v => v === 'Masters' ? navigate('/staff/masters') : v === 'Content' ? navigate('/staff/content') : setTab(v)} />
        </div>

        {loading ? <SkeletonList count={4} /> : tab === 'MRD Queue' ? (
          <div className="space-y-4">
            <div>
              <div className="text-[12px] font-bold text-slate-400 uppercase mb-2">Pending ({pendingCorrections.length})</div>
              {pendingCorrections.length === 0 ? <MEmpty title="No pending correction requests" subtitle="New MRD correction requests will queue up here" icon={<FileCheck2 size={20} strokeWidth={1.75} />} /> : (
                <div className="space-y-2.5">
                  {pendingCorrections.map(c => {
                    const p = store.patients.find(pp => pp.uhid === c.patientUhid);
                    return (
                      <button key={c.id} onClick={() => { setCorActiveId(c.id); setCorRemarks(''); }} className="w-full text-left m-card p-3.5 m-tap">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11.5px] font-bold text-slate-400">{c.id} · Profile Correction</span>
                          <MPillBadge text={c.status} tone={statusTone(c.status)} />
                        </div>
                        <div className="font-bold text-slate-800 text-[14.5px]">{p?.name || c.patientUhid} — {c.field}</div>
                        <div className="text-[12.5px] text-slate-400 mt-0.5">"{c.currentValue}" → "{c.requestedValue}"</div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <div>
              <div className="text-[12px] font-bold text-slate-400 uppercase mb-2">Resolved</div>
              {resolvedCorrections.length === 0 ? <MEmpty title="No resolved requests yet" icon={<FileCheck2 size={20} strokeWidth={1.75} />} /> : (
                <div className="space-y-2.5">
                  {resolvedCorrections.map(c => {
                    const p = store.patients.find(pp => pp.uhid === c.patientUhid);
                    return (
                      <div key={c.id} className="m-card p-3.5">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11.5px] font-bold text-slate-400">{c.id}</span>
                          <MPillBadge text={c.status} tone={statusTone(c.status)} />
                        </div>
                        <div className="font-bold text-slate-800 text-[14.5px]">{p?.name || c.patientUhid} — {c.field}</div>
                        {c.staffRemarks && <div className="text-[12px] text-slate-400 mt-0.5">{c.staffRemarks}</div>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : visible.length === 0 ? <MEmpty title="Nothing here" subtitle="Items matching this view will appear here" icon={<Inbox size={20} strokeWidth={1.75} />} /> : (
          <div className="space-y-2.5">
            {visible.map(i => (
              <button key={`${i.kind}-${i.id}`} onClick={() => setActiveKey(`${i.kind}-${i.id}`)} className="w-full text-left m-card p-3.5 m-tap">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11.5px] font-bold text-slate-400">{i.id} · {i.kind === 'complaint' ? 'Complaint' : 'Service Request'}</span>
                  <MPillBadge text={i.status} tone={statusTone(i.status)} />
                </div>
                <div className="font-bold text-slate-800 text-[14.5px]">{i.category}</div>
                <div className="text-[12.5px] text-slate-400 mt-0.5 truncate">{i.description}</div>
                <div className="text-[11.5px] text-slate-400 mt-1">{i.department}{i.kind === 'complaint' ? ` · SLA ${new Date(i.slaDeadline).toLocaleString('en-IN')}` : ''}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      <Sheet open={!!active} onClose={() => setActiveKey(null)} title={active?.id}>
        {active && (
          <div className="space-y-3">
            <div className="text-[13px] text-slate-600">{active.category} · {active.description}</div>
            <div className="flex items-center gap-2"><MPillBadge text={active.status} tone={statusTone(active.status)} /><MPillBadge text={active.department} tone="indigo" /></div>
            {active.kind === 'complaint' && active.response && <div className="text-[12.5px] text-sky-700 bg-sky-50 rounded-xl p-3 font-medium">Existing response: {active.response}</div>}
            {canRespond && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <textarea className="m-input" rows={2} placeholder="Write a response / remark" value={response} onChange={e => setResponse(e.target.value)} />
                <button className="m-btn-primary" disabled={!response.trim()} onClick={doRespond}>Respond</button>
              </div>
            )}
            <div className="flex gap-2 pt-1">
              {canEscalate && active.kind === 'request' && <button className="m-btn-secondary flex-1" onClick={doEscalate}>Escalate</button>}
              {canClose && <button className="m-btn-secondary flex-1 !text-emerald-700" onClick={doClose}>Close</button>}
            </div>
          </div>
        )}
      </Sheet>

      <Sheet open={!!corActive} onClose={() => setCorActiveId(null)} title={corActive?.id}>
        {corActive && (
          <div className="space-y-3">
            <div className="text-[13px] text-slate-600">{store.patients.find(p => p.uhid === corActive.patientUhid)?.name || corActive.patientUhid} · {corActive.field}</div>
            <div className="bg-slate-50 rounded-2xl p-3 text-[13px] space-y-1.5">
              <div className="flex justify-between"><span className="text-slate-400">Current value</span><span className="font-bold">{corActive.currentValue}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Requested value</span><span className="font-bold">{corActive.requestedValue}</span></div>
            </div>
            <div className="text-[12.5px] text-slate-500">Reason: {corActive.reason}</div>
            <textarea className="m-input" rows={2} placeholder="Remarks (visible to patient)" value={corRemarks} onChange={e => setCorRemarks(e.target.value)} />
            <div className="flex gap-2">
              <button className="m-btn-danger-outline flex-1" onClick={() => resolveCorrection('Rejected')}>Reject</button>
              <button className="m-btn-primary flex-1" onClick={() => resolveCorrection('Approved')}>Approve</button>
            </div>
          </div>
        )}
      </Sheet>
    </div>
  );
}
