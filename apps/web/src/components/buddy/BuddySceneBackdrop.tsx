import type { BackgroundAccent } from './buddyBackgrounds';

/**
 * Distinct decorative backdrop per home background so each one reads clearly
 * differently (sunny vs greenhouse vs rainy vs forest) instead of sharing the
 * same generic sun + clouds. Purely decorative and static (no perpetual
 * animation), layered behind the buddy and home.
 */
export function SceneBackdrop({ accent }: { accent: BackgroundAccent }) {
  if (accent === 'rain') {
    return (
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute left-6 top-5 h-10 w-28 rounded-full bg-slate-200/70 blur-[2px]" />
        <div className="absolute right-8 top-9 h-9 w-20 rounded-full bg-slate-300/60 blur-[2px]" />
        <div className="absolute left-1/3 top-3 h-8 w-24 rounded-full bg-slate-100/60 blur-[2px]" />
        {Array.from({ length: 16 }).map((_, i) => (
          <span
            key={i}
            className="absolute h-9 w-[2px] rotate-[14deg] rounded-full bg-sky-100/55"
            style={{ left: `${(i * 6 + 3) % 100}%`, top: `${(i * 11) % 64}px` }}
          />
        ))}
      </div>
    );
  }

  if (accent === 'trees') {
    return (
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute -left-5 bottom-14 h-44 w-20 rounded-t-[3rem] bg-emerald-900/35" />
        <div className="absolute -right-6 bottom-14 h-52 w-24 rounded-t-[3rem] bg-emerald-950/35" />
        <div className="absolute left-[28%] top-2 h-24 w-28 -translate-x-1/2 rounded-full bg-emerald-800/25 blur-[1px]" />
        <div className="absolute right-[26%] top-6 h-20 w-24 rounded-full bg-emerald-900/25 blur-[1px]" />
        <div className="absolute right-14 top-9 h-3 w-3 rounded-full bg-lime-100/70 blur-[1px]" />
        <div className="absolute left-16 top-20 h-2.5 w-2.5 rounded-full bg-lime-100/60 blur-[1px]" />
        <div className="absolute left-1/2 top-12 h-2 w-2 rounded-full bg-lime-50/70 blur-[1px]" />
      </div>
    );
  }

  if (accent === 'leaves') {
    return (
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute inset-x-3 top-3 border-t-2 border-white/30" />
        <div className="absolute left-1/2 top-0 h-12 w-0.5 -translate-x-1/2 bg-white/25" />
        <div className="absolute left-[28%] top-0 h-12 w-0.5 -translate-x-1/2 bg-white/20" />
        <div className="absolute left-[72%] top-0 h-12 w-0.5 -translate-x-1/2 bg-white/20" />
        <div className="absolute left-6 top-0 h-16 w-3 rotate-6 rounded-b-full bg-emerald-600/45" />
        <div className="absolute right-10 top-0 h-20 w-3 -rotate-6 rounded-b-full bg-emerald-700/45" />
        <div className="absolute left-1/3 top-0 h-12 w-2.5 rotate-12 rounded-b-full bg-lime-600/45" />
        <div className="absolute right-1/3 top-0 h-14 w-2.5 -rotate-12 rounded-b-full bg-emerald-600/40" />
      </div>
    );
  }

  // sun (sunny windowsill)
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      <div className="absolute left-7 top-7 h-16 w-16 rounded-full bg-yellow-200/85 shadow-[0_0_55px_rgba(253,224,71,0.75)]" />
      <div className="absolute left-3 top-3 h-24 w-24 rounded-full border-4 border-yellow-100/40" />
      <div className="absolute right-9 top-9 h-8 w-24 rounded-full bg-white/75 blur-[1px]" />
      <div className="absolute right-24 top-16 h-6 w-16 rounded-full bg-white/55 blur-[1px]" />
      <div className="absolute right-12 top-28 h-2 w-2 rounded-full bg-yellow-100 shadow-[0_0_12px_rgba(254,240,138,.9)]" />
      <div className="absolute left-1/2 top-20 h-1.5 w-1.5 rounded-full bg-yellow-50 shadow-[0_0_10px_rgba(254,240,138,.8)]" />
    </div>
  );
}
