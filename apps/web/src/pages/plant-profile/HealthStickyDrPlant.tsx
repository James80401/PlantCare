import { DR_PLANT_SECTION_ID } from './constants';

/** Mobile-only shortcut to the Dr. Plant chat block on the Health tab. */
export function HealthStickyDrPlant() {
  return (
    <div
      className="fixed inset-x-0 z-10 border-t border-emerald-100 bg-white/95 px-4 py-2 shadow-[0_-8px_24px_rgba(6,78,59,0.08)] backdrop-blur sm:hidden"
      style={{ bottom: 'calc(4.75rem + env(safe-area-inset-bottom))' }}
    >
      <a
        href={`#${DR_PLANT_SECTION_ID}`}
        className="flex min-h-11 w-full items-center justify-center rounded-full bg-emerald-800 text-sm font-semibold text-white hover:bg-emerald-900"
      >
        Ask Dr. Plant
      </a>
    </div>
  );
}
