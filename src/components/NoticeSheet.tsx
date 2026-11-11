import React, { useState } from 'react';
import Sheet from './Sheet';
import { NOTICE, type Lang } from '../data/consentCopy';
import { CONSENT_VERSION, DPO_NAME, DPO_EMAIL, DPO_PHONE } from '../data/seed';
import { ShieldCheck, Mail, Phone } from 'lucide-react';

export default function NoticeSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [lang, setLang] = useState<Lang>('en');
  const n = NOTICE[lang];
  return (
    <Sheet open={open} onClose={onClose} title={n.title}>
      <div className="flex items-center justify-between mb-3">
        <span className="inline-flex items-center gap-1.5 text-[11.5px] font-bold text-[var(--brand-teal)]"><ShieldCheck size={14} /> Notice v{CONSENT_VERSION}</span>
        <div className="inline-flex rounded-full p-0.5" style={{ background: 'var(--surface-raised)' }} role="group" aria-label="Language">
          {(['en', 'hi'] as Lang[]).map(l => (
            <button key={l} onClick={() => setLang(l)} aria-pressed={lang === l}
              className={`px-3 py-1 rounded-full text-[12px] font-bold m-tap ${lang === l ? 'bg-[var(--brand-teal)] text-white' : 'text-slate-500'}`}>
              {l === 'en' ? 'English' : 'हिन्दी'}
            </button>
          ))}
        </div>
      </div>
      <p className="text-[13px] text-slate-500 leading-relaxed mb-4">{n.intro}</p>
      <div className="space-y-3.5">
        {n.sections.map(s => (
          <div key={s.h}>
            <div className="text-[13.5px] font-bold text-slate-800">{s.h}</div>
            <div className="text-[13px] text-slate-500 leading-relaxed mt-0.5">{s.b}</div>
          </div>
        ))}
      </div>
      <div className="m-card p-3.5 mt-5 space-y-1.5">
        <div className="text-[12px] font-bold text-slate-400 uppercase tracking-[.06em]">{n.contact}</div>
        <div className="text-[13px] font-bold text-slate-700">{DPO_NAME}</div>
        <div className="flex items-center gap-2 text-[12.5px] text-slate-500"><Mail size={14} /> {DPO_EMAIL}</div>
        <div className="flex items-center gap-2 text-[12.5px] text-slate-500"><Phone size={14} /> {DPO_PHONE}</div>
      </div>
    </Sheet>
  );
}
