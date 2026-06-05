/**
 * SVG clothing/accessory layers drawn INSIDE the Buddy character's
 * `0 0 160 180` viewBox, so equipped items anchor to the head/eyes/body and
 * move with the idle bob — instead of floating as separate CSS overlays.
 *
 * Anatomy anchors (viewBox units): head crown ≈ y48 @ x80, eye line y83
 * (eyes x66 / x102), belly center x82 y124, right "hand" ≈ x124 y126.
 */

export type EquippedItems = Record<string, unknown>;

function id(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

const TOP_COLOR: Record<string, string> = {
  top_scarf: '#84cc16',
  top_overall: '#38bdf8',
  top_spring_cardigan: '#f472b6',
  top_cozy_scarf: '#f59e0b',
};

const BODY_TINT: Record<string, string> = {
  color_monstera_natural: '#34d399',
  color_cactus_natural: '#a3e635',
  color_rose_blush: '#fb7185',
  color_succulent_blue: '#38bdf8',
};

export function BuddyBodyTint({ bodyColor, bodyPath }: { bodyColor: string; bodyPath: string }) {
  const tint = BODY_TINT[bodyColor];
  if (!tint) return null;
  return <path d={bodyPath} fill={tint} opacity={0.22} className="pointer-events-none" />;
}

export function BuddyBodyPattern({ bodyPattern }: { bodyPattern: string }) {
  if (bodyPattern.includes('stripe')) {
    return (
      <g opacity={0.5} stroke="#ffffff" strokeWidth={3} strokeLinecap="round">
        <path d="M58 110 q24 10 48 0" fill="none" />
        <path d="M55 124 q27 11 54 0" fill="none" />
        <path d="M58 138 q24 9 48 0" fill="none" />
      </g>
    );
  }
  return (
    <g opacity={0.55} fill="#ffffff">
      {[
        [64, 112],
        [98, 112],
        [82, 126],
        [62, 140],
        [102, 140],
      ].map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={3.4} />
      ))}
    </g>
  );
}

export function BuddyTop({ top }: { top: string }) {
  const color = TOP_COLOR[top] ?? '#34d399';
  if (top.includes('scarf')) {
    return (
      <g stroke="#0f5132" strokeWidth={2} strokeLinejoin="round">
        <path d="M50 112 Q80 130 110 112 L110 122 Q80 140 50 122 Z" fill={color} />
        <path d="M97 120 q11 13 5 28 l-11 -2 q5 -15 -3 -24 Z" fill={color} />
      </g>
    );
  }
  // Sweater / cardigan / overalls covering the lower belly.
  return (
    <g stroke="#0f5132" strokeWidth={2.5} strokeLinejoin="round">
      <path d="M49 116 Q82 106 115 116 L112 152 Q82 168 52 152 Z" fill={color} opacity={0.96} />
      <path d="M66 120 L62 150 M98 120 L102 150" stroke="#ffffff" strokeWidth={2} opacity={0.45} />
    </g>
  );
}

export function BuddyGlasses({ glasses }: { glasses: string }) {
  const dark = glasses.includes('sun') || glasses.includes('shade');
  return (
    <g stroke="#1f2937" strokeWidth={3} strokeLinecap="round">
      <circle cx={66} cy={83} r={11} fill={dark ? '#111827' : '#bae6fd'} fillOpacity={dark ? 0.9 : 0.45} />
      <circle cx={102} cy={83} r={11} fill={dark ? '#111827' : '#bae6fd'} fillOpacity={dark ? 0.9 : 0.45} />
      <path d="M77 82 H91" fill="none" />
      <path d="M55 78 L47 74 M113 78 L121 74" fill="none" />
    </g>
  );
}

export function BuddyHat({ hat }: { hat: string }) {
  if (hat.includes('mushroom')) {
    return (
      <g>
        <path d="M48 50 Q80 8 112 50 Z" fill="#ef5350" />
        <ellipse cx={80} cy={50} rx={32} ry={7} fill="#e53935" />
        <circle cx={64} cy={36} r={4} fill="#fff" />
        <circle cx={92} cy={31} r={5} fill="#fff" />
        <circle cx={80} cy={44} r={3.4} fill="#fff" />
        <rect x={71} y={48} width={18} height={7} rx={3.5} fill="#f7e9cf" />
      </g>
    );
  }
  if (hat.includes('beanie') || hat.includes('knit')) {
    return (
      <g>
        <path d="M52 50 Q80 10 108 50 Z" fill="#2f8f6a" />
        <rect x={50} y={45} width={60} height={11} rx={5.5} fill="#256f53" />
        <circle cx={80} cy={15} r={6} fill="#bbf7d0" />
      </g>
    );
  }
  if (hat.includes('laurel') || hat.includes('wreath') || hat.includes('flower') || hat.includes('crown')) {
    return (
      <g>
        <path d="M50 46 Q80 26 110 46" fill="none" stroke="#65a30d" strokeWidth={4} strokeLinecap="round" />
        <circle cx={52} cy={45} r={4.5} fill="#f9a8d4" />
        <circle cx={80} cy={28} r={5} fill="#fde68a" />
        <circle cx={108} cy={45} r={4.5} fill="#f9a8d4" />
      </g>
    );
  }
  // Default: straw sun hat.
  return (
    <g stroke="#caa05a" strokeWidth={2} strokeLinejoin="round">
      <ellipse cx={80} cy={50} rx={34} ry={9} fill="#fcd9a8" />
      <path d="M58 50 Q80 18 102 50 Z" fill="#fde2b3" />
      <path d="M61 47 Q80 40 99 47" stroke="#7fae5a" strokeWidth={5} strokeLinecap="round" fill="none" />
    </g>
  );
}

export function BuddyHeldItem({ heldItem }: { heldItem: string }) {
  if (heldItem.includes('watering_can')) {
    return (
      <g transform="translate(118 116)">
        <rect x={0} y={8} width={20} height={16} rx={4} fill="#38bdf8" stroke="#0369a1" strokeWidth={2} />
        <path d="M18 12 L30 6" stroke="#0ea5e9" strokeWidth={4} strokeLinecap="round" />
        <path d="M4 8 Q10 0 16 8" fill="none" stroke="#0369a1" strokeWidth={2.5} />
        <circle cx={31} cy={5} r={1.4} fill="#bae6fd" />
        <circle cx={33} cy={9} r={1.4} fill="#bae6fd" />
      </g>
    );
  }
  if (heldItem.includes('lantern') || heldItem.includes('firefl')) {
    return (
      <g transform="translate(120 112)">
        <path d="M6 2 Q11 -4 16 2" fill="none" stroke="#92400e" strokeWidth={2.5} />
        <rect x={4} y={4} width={16} height={20} rx={5} fill="#fde047" stroke="#b45309" strokeWidth={2} />
        <circle cx={12} cy={14} r={4} fill="#fff7cc" />
      </g>
    );
  }
  // Default: little hand trowel.
  return (
    <g transform="translate(120 116)">
      <rect x={9} y={0} width={3.5} height={14} rx={1.5} fill="#92400e" />
      <path d="M4 12 Q11 30 18 12 Z" fill="#cbd5e1" stroke="#64748b" strokeWidth={1.6} />
    </g>
  );
}

/** Layers drawn over the body but under the face (tint, pattern). */
export function BuddyClothingUnderFace({
  equipped,
  bodyPath,
}: {
  equipped: EquippedItems;
  bodyPath: string;
}) {
  const bodyColor = id(equipped.bodyColor);
  const bodyPattern = id(equipped.bodyPattern);
  return (
    <>
      {bodyColor && BODY_TINT[bodyColor] ? (
        <g data-clothing="bodyColor">
          <BuddyBodyTint bodyColor={bodyColor} bodyPath={bodyPath} />
        </g>
      ) : null}
      {bodyPattern && bodyPattern !== 'pattern_none' ? (
        <g data-clothing="bodyPattern">
          <BuddyBodyPattern bodyPattern={bodyPattern} />
        </g>
      ) : null}
    </>
  );
}

/** Layers drawn over the face/head (top, glasses, hat, held item). */
export function BuddyClothingOverFace({ equipped }: { equipped: EquippedItems }) {
  const top = id(equipped.top);
  const glasses = id(equipped.glasses);
  const hat = id(equipped.hat);
  const heldItem = id(equipped.heldItem);
  return (
    <>
      {top ? (
        <g data-clothing="top">
          <BuddyTop top={top} />
        </g>
      ) : null}
      {glasses ? (
        <g data-clothing="glasses">
          <BuddyGlasses glasses={glasses} />
        </g>
      ) : null}
      {hat ? (
        <g data-clothing="hat">
          <BuddyHat hat={hat} />
        </g>
      ) : null}
      {heldItem ? (
        <g data-clothing="heldItem">
          <BuddyHeldItem heldItem={heldItem} />
        </g>
      ) : null}
    </>
  );
}
