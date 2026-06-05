import { buddyBackgroundClass, type BackgroundAccent } from './buddyBackgrounds';
import { furnitureEmoji } from './BuddyItemVisuals';
import type { ShopItem } from '../../hooks/buddy/shopTypes';

type PlacedFurniture = { slot: string; itemId: string; item?: ShopItem };

/** A small "view through the window" hint of the chosen outdoor background. */
function WindowView({ backgroundKey, accent }: { backgroundKey?: string | null; accent: BackgroundAccent }) {
  return (
    <div className={`relative h-full w-full overflow-hidden rounded-lg bg-gradient-to-b ${buddyBackgroundClass(backgroundKey)}`}>
      {accent === 'sun' ? (
        <>
          <div className="absolute left-3 top-2 h-7 w-7 rounded-full bg-yellow-200/90 shadow-[0_0_22px_rgba(253,224,71,.8)]" />
          <div className="absolute right-2 top-4 h-3 w-9 rounded-full bg-white/70 blur-[1px]" />
        </>
      ) : null}
      {accent === 'rain'
        ? Array.from({ length: 9 }).map((_, i) => (
            <span
              key={i}
              className="absolute h-6 w-px rotate-12 bg-sky-100/60"
              style={{ left: `${(i * 12 + 4) % 100}%`, top: `${(i * 9) % 36}px` }}
            />
          ))
        : null}
      {accent === 'trees' ? (
        <>
          <div className="absolute -left-1 bottom-0 h-16 w-8 rounded-t-2xl bg-emerald-900/45" />
          <div className="absolute -right-1 bottom-0 h-20 w-9 rounded-t-2xl bg-emerald-950/45" />
          <div className="absolute left-1/2 top-1 h-10 w-12 -translate-x-1/2 rounded-full bg-emerald-800/35" />
        </>
      ) : null}
      {accent === 'leaves' ? (
        <>
          <div className="absolute left-3 top-0 h-9 w-2 rounded-b-full bg-emerald-600/60" />
          <div className="absolute right-4 top-0 h-11 w-2 rounded-b-full bg-emerald-700/60" />
        </>
      ) : null}
      {/* window mullions */}
      <div className="absolute left-1/2 top-0 h-full w-1 -translate-x-1/2 bg-[#8b5a2b]/80" />
      <div className="absolute top-1/2 left-0 h-1 w-full -translate-y-1/2 bg-[#8b5a2b]/80" />
      <div className="absolute inset-0 bg-white/10" />
    </div>
  );
}

/**
 * Cozy interior of the buddy's home — the default scene. Warm walls and a wood
 * floor, a framed window that looks out onto the chosen background, a shelf with
 * plants, a picture, a rug, and any placed furniture. The buddy itself is drawn
 * on top by BuddyScene; this is purely the room around it.
 */
export function BuddyRoomInterior({
  backgroundKey,
  accent,
  placedFurniture,
  compact,
}: {
  backgroundKey?: string | null;
  accent: BackgroundAccent;
  placedFurniture: PlacedFurniture[];
  compact?: boolean;
}) {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      {/* wall */}
      <div className="absolute inset-x-0 top-0 bottom-[34%] bg-gradient-to-b from-[#f7e8d0] to-[#eed7b3]" />
      {/* baseboard */}
      <div className="absolute inset-x-0 bottom-[34%] h-2.5 bg-[#caa56e]" />
      {/* wood floor */}
      <div className="absolute inset-x-0 bottom-0 top-[66%] bg-gradient-to-b from-[#c4905a] to-[#9a6736]" />
      {[16, 34, 52, 70, 88].map((l) => (
        <div key={l} className="absolute bottom-0 top-[66%] w-px bg-[#7c4a1e]/35" style={{ left: `${l}%` }} />
      ))}

      {/* window onto the background */}
      <div
        className={`absolute left-1/2 top-6 -translate-x-1/2 rounded-2xl bg-[#8b5a2b] p-1.5 shadow-md ${
          compact ? 'h-24 w-40' : 'h-28 w-48'
        }`}
      >
        <WindowView backgroundKey={backgroundKey} accent={accent} />
      </div>

      {/* framed picture on the wall (left) */}
      <div className="absolute left-6 top-12 h-12 w-10 rounded-md bg-[#8b5a2b] p-1 shadow">
        <div className="h-full w-full rounded-sm bg-emerald-200/80">
          <div className="mt-4 h-3.5 w-full bg-emerald-500/60" />
          <div className="h-1 w-full bg-emerald-700/50" />
        </div>
      </div>

      {/* wall shelf with plants (right) */}
      <div className="absolute right-5 top-[5.5rem] h-1.5 w-20 rounded bg-[#8b5a2b]" />
      <span className="absolute right-7 top-[3.4rem] text-2xl">🪴</span>
      <span className="absolute right-[4.2rem] top-[3.7rem] text-xl">🌿</span>

      {/* rug under the buddy */}
      <div className="absolute bottom-5 left-1/2 h-11 w-52 -translate-x-1/2 rounded-[50%] bg-rose-300/45 ring-4 ring-rose-200/40" />
      <div className="absolute bottom-[1.65rem] left-1/2 h-7 w-36 -translate-x-1/2 rounded-[50%] bg-rose-200/40" />

      {/* placed furniture on the floor */}
      {placedFurniture.map(({ slot, itemId, item }, index) => (
        <div
          key={`${slot}-${itemId}`}
          className={`absolute bottom-7 flex h-14 w-14 items-center justify-center text-3xl drop-shadow-sm ${
            index === 0 ? 'left-6' : index === 1 ? 'right-7' : 'right-24'
          }`}
          title={item?.name ?? itemId}
        >
          {furnitureEmoji(itemId)}
        </div>
      ))}
    </div>
  );
}
