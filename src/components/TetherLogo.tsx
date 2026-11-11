import React from 'react';

// The Tether app mark — a standalone logotype glyph (not the Sofscript maker's-mark used
// elsewhere in the app for hospital/vendor branding). Reads as "T" whose stem resolves into a
// single anchor point, evoking the product name (a tether: a line anchored to a fixed point —
// the patient's continuous, anchored connection to their care). Built as flat vector shapes so it
// stays crisp at any size, with a soft top gloss and inner ring for a modern, dimensional finish.
export default function TetherLogo({ size = 70 }: { size?: number }) {
  const r = size * 0.31; // badge corner radius, proportional to size
  return (
    <div
      className="mx-auto flex items-center justify-center shrink-0 relative"
      style={{
        width: size,
        height: size,
        borderRadius: r,
        background: 'linear-gradient(150deg, #12b3ab 0%, #0e7c86 46%, #123859 100%)',
        boxShadow: '0 14px 32px rgba(6,20,30,0.38), inset 0 1px 0 rgba(255,255,255,0.25)',
      }}
    >
      <svg width={size * 0.56} height={size * 0.56} viewBox="0 0 100 100" fill="none">
        <defs>
          <linearGradient id="tetherGlyphSheen" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="100%" stopColor="#eafffd" stopOpacity="0.92" />
          </linearGradient>
        </defs>
        {/* Crossbar */}
        <rect x="18" y="20" width="64" height="15" rx="7.5" fill="url(#tetherGlyphSheen)" />
        {/* Stem */}
        <rect x="42.5" y="20" width="15" height="34" rx="7.5" fill="url(#tetherGlyphSheen)" />
        {/* Anchor node */}
        <circle cx="50" cy="66" r="15" fill="url(#tetherGlyphSheen)" />
        <circle cx="50" cy="66" r="6.5" fill="#0e7c86" />
      </svg>
      {/* Top gloss */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          borderRadius: r,
          background: 'linear-gradient(180deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0) 55%)',
        }}
      />
    </div>
  );
}
