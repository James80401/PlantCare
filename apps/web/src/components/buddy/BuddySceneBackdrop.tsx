import type { BackgroundAccent } from './buddyBackgrounds';

/**
 * Distinct, detailed decorative backdrop per home background (sunny / greenhouse
 * / rainy / forest). Purely decorative and static (no perpetual animation),
 * layered behind the buddy and home. Paired with SceneForeground for depth.
 */
export function SceneBackdrop({ accent }: { accent: BackgroundAccent }) {
  if (accent === 'rain') {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute left-4 top-4 h-11 w-32 rounded-full bg-slate-200/70 blur-[2px]" />
        <div className="absolute right-6 top-8 h-10 w-24 rounded-full bg-slate-300/65 blur-[2px]" />
        <div className="absolute left-1/3 top-2 h-9 w-28 rounded-full bg-slate-100/60 blur-[2px]" />
        {Array.from({ length: 22 }).map((_, i) => (
          <span
            key={i}
            className="absolute h-10 w-[2px] rotate-[14deg] rounded-full bg-sky-100/55"
            style={{ left: `${(i * 4.5 + 2) % 100}%`, top: `${(i * 13) % 120}px` }}
          />
        ))}
        {/* droplets resting on the 'glass' */}
        {[
          [18, 70],
          [40, 54],
          [62, 80],
          [82, 60],
        ].map(([l, t], i) => (
          <span
            key={`d${i}`}
            className="absolute h-2 w-1.5 rounded-full bg-sky-200/70"
            style={{ left: `${l}%`, top: `${t}px` }}
          />
        ))}
      </div>
    );
  }

  if (accent === 'trees') {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -left-6 bottom-12 h-48 w-20 rounded-t-[3rem] bg-emerald-900/35" />
        <div className="absolute left-[26%] bottom-12 h-40 w-16 -translate-x-1/2 rounded-t-[3rem] bg-emerald-800/30" />
        <div className="absolute -right-7 bottom-12 h-56 w-24 rounded-t-[3rem] bg-emerald-950/35" />
        <div className="absolute left-[24%] top-2 h-24 w-28 -translate-x-1/2 rounded-full bg-emerald-800/25 blur-[1px]" />
        <div className="absolute right-[24%] top-6 h-20 w-24 rounded-full bg-emerald-900/25 blur-[1px]" />
        {/* dappled light */}
        {[
          [14, 9],
          [16, 22],
          [50, 12],
          [78, 8],
          [86, 24],
        ].map(([l, t], i) => (
          <span
            key={i}
            className="absolute rounded-full bg-lime-100/70 blur-[1px]"
            style={{ left: `${l}%`, top: `${t}px`, width: `${10 - (i % 3) * 2}px`, height: `${10 - (i % 3) * 2}px` }}
          />
        ))}
        {/* tiny mushrooms */}
        <span className="absolute bottom-12 left-[12%] h-3 w-4 rounded-t-full bg-rose-400/80" />
        <span className="absolute bottom-12 right-[14%] h-2.5 w-3 rounded-t-full bg-amber-400/80" />
      </div>
    );
  }

  if (accent === 'leaves') {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        {/* glasshouse frame */}
        <div className="absolute inset-x-2 top-3 border-t-2 border-white/35" />
        {[28, 50, 72].map((l) => (
          <div key={l} className="absolute top-0 h-14 w-0.5 bg-white/25" style={{ left: `${l}%` }} />
        ))}
        {/* hanging vines */}
        {[
          [8, 18, 6],
          [30, 14, -8],
          [50, 22, 6],
          [70, 16, -10],
          [90, 20, 8],
        ].map(([l, h, r], i) => (
          <div
            key={i}
            className="absolute top-0 w-3 rounded-b-full bg-emerald-600/50"
            style={{ left: `${l}%`, height: `${h * 4}px`, transform: `rotate(${r}deg)` }}
          />
        ))}
        {/* potted shelf plants */}
        <span className="absolute bottom-14 left-3 h-6 w-7 rounded-b-md bg-orange-400/70" />
        <span className="absolute bottom-[5.5rem] left-3 h-6 w-9 rounded-t-full bg-emerald-600/70" />
        <span className="absolute bottom-14 right-4 h-6 w-7 rounded-b-md bg-orange-400/70" />
        <span className="absolute bottom-[5.5rem] right-4 h-7 w-8 rounded-t-full bg-emerald-700/70" />
      </div>
    );
  }

  // sun (sunny windowsill)
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute left-7 top-7 h-16 w-16 rounded-full bg-yellow-200/85 shadow-[0_0_55px_rgba(253,224,71,0.75)]" />
      <div className="absolute left-3 top-3 h-24 w-24 rounded-full border-4 border-yellow-100/40" />
      {/* clouds */}
      <div className="absolute right-9 top-9 h-8 w-24 rounded-full bg-white/75 blur-[1px]" />
      <div className="absolute right-24 top-16 h-6 w-16 rounded-full bg-white/55 blur-[1px]" />
      <div className="absolute left-[42%] top-6 h-6 w-20 rounded-full bg-white/55 blur-[1px]" />
      {/* little birds */}
      <svg viewBox="0 0 24 8" className="absolute right-[30%] top-12 h-2.5 w-7 text-emerald-900/45">
        <path d="M1 7 Q6 1 12 6 Q18 1 23 7" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      {/* sparkles */}
      <span className="absolute right-12 top-28 h-2 w-2 rounded-full bg-yellow-100 shadow-[0_0_12px_rgba(254,240,138,.9)]" />
      <span className="absolute left-1/2 top-20 h-1.5 w-1.5 rounded-full bg-yellow-50 shadow-[0_0_10px_rgba(254,240,138,.8)]" />
    </div>
  );
}

/**
 * Universal foreground that frames the ground (grass tufts, flowers, pebbles,
 * a small side fern) for depth across every home background. Kept low and to the
 * sides so it never covers the buddy or its home.
 */
export function SceneForeground() {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 overflow-hidden" aria-hidden>
      {/* grass tufts along the ground */}
      {[4, 13, 22, 78, 88, 96].map((left, i) => (
        <svg
          key={i}
          viewBox="0 0 20 16"
          className="absolute bottom-1 h-6 w-7 text-emerald-700/80"
          style={{ left: `${left}%` }}
        >
          <path
            d="M10 16 V5 M6 16 Q4 9 8 4 M14 16 Q16 9 12 4"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      ))}
      {/* small flowers */}
      <span className="absolute bottom-3 left-[10%] h-2.5 w-2.5 rounded-full bg-rose-400 ring-2 ring-rose-200" />
      <span className="absolute bottom-2 left-[26%] h-2 w-2 rounded-full bg-amber-300 ring-2 ring-amber-100" />
      <span className="absolute bottom-3 right-[12%] h-2.5 w-2.5 rounded-full bg-fuchsia-400 ring-2 ring-fuchsia-200" />
      {/* pebbles */}
      <span className="absolute bottom-2 left-[34%] h-1.5 w-3 rounded-full bg-emerald-950/20" />
      <span className="absolute bottom-2 right-[30%] h-1.5 w-3.5 rounded-full bg-emerald-950/20" />
      {/* a leafy side plant */}
      <svg viewBox="0 0 30 30" className="absolute -bottom-1 right-1 h-10 w-10 text-emerald-600/80">
        <path
          d="M15 30 V14 M15 16 Q5 12 4 4 Q14 6 15 14 M15 16 Q25 12 26 4 Q16 6 15 14"
          fill="currentColor"
          stroke="#0f5132"
          strokeWidth="1"
        />
      </svg>
    </div>
  );
}
