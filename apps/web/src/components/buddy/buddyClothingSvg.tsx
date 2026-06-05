/**
 * SVG clothing/accessory layers drawn INSIDE the Buddy character's
 * `0 0 160 180` viewBox, so equipped items anchor to the head/eyes/body and
 * move with the idle bob. Shapes are intentionally bold (thick dark outlines,
 * chunky silhouettes) and distinct per item so each cosmetic reads clearly.
 *
 * Anatomy anchors (viewBox units): head crown ≈ y48 @ x80, eye line y83
 * (eyes x66 / x102), belly center x82 y124, right "hand" ≈ x118 y116.
 */

export type EquippedItems = Record<string, unknown>;

const INK = '#243244'; // shared bold outline

function id(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

const TOP_COLOR: Record<string, string> = {
  top_scarf: '#f59e0b',
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
  return <path d={bodyPath} fill={tint} opacity={0.24} className="pointer-events-none" />;
}

export function BuddyBodyPattern({ bodyPattern }: { bodyPattern: string }) {
  if (bodyPattern.includes('stripe')) {
    return (
      <g opacity={0.55} stroke="#ffffff" strokeWidth={4} strokeLinecap="round">
        <path d="M58 110 q24 10 48 0" fill="none" />
        <path d="M55 124 q27 11 54 0" fill="none" />
        <path d="M58 138 q24 9 48 0" fill="none" />
      </g>
    );
  }
  return (
    <g opacity={0.6} fill="#ffffff">
      {[
        [64, 112],
        [98, 112],
        [82, 126],
        [62, 140],
        [102, 140],
      ].map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={4} />
      ))}
    </g>
  );
}

export function BuddyTop({ top }: { top: string }) {
  if (top.includes('petal') || top.includes('rose')) {
    return (
      <g stroke="#be123c" strokeWidth={2} strokeLinejoin="round">
        {[
          [58, 118, -34],
          [72, 124, -12],
          [88, 124, 12],
          [102, 118, 34],
        ].map(([x, y, r], i) => (
          <path
            key={i}
            d={`M${x} ${y} q-8 16 0 24 q8 -8 0 -24 Z`}
            fill={i % 2 ? '#fb7185' : '#f9a8d4'}
            transform={`rotate(${r} ${x} ${y})`}
          />
        ))}
      </g>
    );
  }
  const color = TOP_COLOR[top] ?? '#34d399';
  if (top.includes('scarf')) {
    return (
      <g stroke={INK} strokeWidth={3} strokeLinejoin="round">
        <path d="M48 110 Q80 131 112 110 L112 123 Q80 142 48 123 Z" fill={color} />
        <path d="M98 120 q13 14 6 30 l-12 -2 q6 -16 -3 -26 Z" fill={color} />
        <path d="M56 116 q24 11 48 0" fill="none" stroke="#ffffff" strokeWidth={2} opacity={0.5} />
      </g>
    );
  }
  // Sweater / cardigan / overalls covering the lower belly.
  return (
    <g stroke={INK} strokeWidth={3.2} strokeLinejoin="round">
      <path d="M47 116 Q82 104 117 116 L114 154 Q82 171 50 154 Z" fill={color} />
      <path d="M64 120 L60 152 M100 120 L104 152" stroke="#ffffff" strokeWidth={2.5} opacity={0.5} />
      <circle cx={82} cy={132} r={2.6} fill="#ffffff" opacity={0.8} stroke="none" />
      <circle cx={82} cy={143} r={2.6} fill="#ffffff" opacity={0.8} stroke="none" />
    </g>
  );
}

export function BuddyGlasses({ glasses }: { glasses: string }) {
  const dark = glasses.includes('sun') || glasses.includes('shade');
  const lens = dark ? '#0f172a' : '#7dd3fc';
  return (
    <g stroke="#111827" strokeWidth={4.5} strokeLinecap="round">
      <circle cx={66} cy={83} r={12.5} fill={lens} fillOpacity={dark ? 0.92 : 0.5} />
      <circle cx={102} cy={83} r={12.5} fill={lens} fillOpacity={dark ? 0.92 : 0.5} />
      <path d="M78 81 H90" fill="none" />
      <path d="M53 78 L44 72 M115 78 L124 72" fill="none" />
      {!dark ? (
        <>
          <path d="M60 78 q3 -3 7 -2" fill="none" stroke="#ffffff" strokeWidth={2} opacity={0.75} />
          <path d="M96 78 q3 -3 7 -2" fill="none" stroke="#ffffff" strokeWidth={2} opacity={0.75} />
        </>
      ) : null}
    </g>
  );
}

export function BuddyHat({ hat }: { hat: string }) {
  if (hat.includes('mushroom')) {
    return (
      <g stroke={INK} strokeWidth={2.6} strokeLinejoin="round">
        <path d="M42 53 Q80 2 118 53 Z" fill="#ef4444" />
        <ellipse cx={80} cy={53} rx={38} ry={8} fill="#dc2626" />
        <circle cx={61} cy={34} r={5.2} fill="#fff" stroke="none" />
        <circle cx={95} cy={28} r={6.2} fill="#fff" stroke="none" />
        <circle cx={80} cy={42} r={4} fill="#fff" stroke="none" />
        <rect x={70} y={50} width={20} height={9} rx={4} fill="#f7e9cf" />
      </g>
    );
  }
  if (hat.includes('beanie') || hat.includes('knit')) {
    return (
      <g stroke={INK} strokeWidth={2.6} strokeLinejoin="round">
        <path d="M48 54 Q80 4 112 54 Z" fill="#2f8f6a" />
        <rect x={46} y={47} width={68} height={13} rx={6.5} fill="#1f7a55" />
        <circle cx={80} cy={11} r={7.5} fill="#bbf7d0" />
        <path d="M58 30 q22 -8 44 0" fill="none" stroke="#1f7a55" strokeWidth={2.5} />
      </g>
    );
  }
  if (hat.includes('visor')) {
    return (
      <g stroke={INK} strokeWidth={2.6} strokeLinejoin="round">
        <path d="M40 51 Q80 63 120 51 Q113 39 80 39 Q47 39 40 51 Z" fill="#fbbf24" />
        <path d="M50 44 Q80 37 110 44" fill="none" stroke="#f59e0b" strokeWidth={7} strokeLinecap="round" />
      </g>
    );
  }
  if (hat.includes('daisy')) {
    return (
      <g>
        <path d="M46 49 Q80 29 114 49" fill="none" stroke="#16a34a" strokeWidth={4.5} strokeLinecap="round" />
        {[
          [52, 47],
          [80, 31],
          [108, 47],
        ].map(([cx, cy], i) => (
          <g key={i}>
            {[0, 72, 144, 216, 288].map((a) => (
              <ellipse
                key={a}
                cx={cx}
                cy={cy}
                rx={3.6}
                ry={6.4}
                fill="#ffffff"
                stroke="#e5e7eb"
                strokeWidth={0.8}
                transform={`rotate(${a} ${cx} ${cy})`}
              />
            ))}
            <circle cx={cx} cy={cy} r={3.2} fill="#fde047" />
          </g>
        ))}
      </g>
    );
  }
  if (hat.includes('laurel')) {
    return (
      <g>
        <path d="M48 49 Q80 31 112 49" fill="none" stroke="#ca8a04" strokeWidth={5.5} strokeLinecap="round" />
        {[54, 64, 74, 86, 96, 106].map((x, i) => (
          <ellipse
            key={x}
            cx={x}
            cy={44 - (i % 2) * 5}
            rx={5.4}
            ry={2.8}
            fill="#eab308"
            transform={`rotate(${i % 2 ? -32 : 32} ${x} 44)`}
          />
        ))}
      </g>
    );
  }
  if (hat.includes('wreath') || hat.includes('crown') || hat.includes('rose') || hat.includes('flower')) {
    return (
      <g>
        <path d="M46 49 Q80 29 114 49" fill="none" stroke="#16a34a" strokeWidth={4.5} strokeLinecap="round" />
        <circle cx={54} cy={46} r={5.4} fill="#fb7185" stroke="#be123c" strokeWidth={1.2} />
        <circle cx={80} cy={31} r={6.4} fill="#f472b6" stroke="#be123c" strokeWidth={1.2} />
        <circle cx={108} cy={46} r={5.4} fill="#fb7185" stroke="#be123c" strokeWidth={1.2} />
        <circle cx={67} cy={37} r={3.8} fill="#fda4af" />
        <circle cx={95} cy={37} r={3.8} fill="#fda4af" />
      </g>
    );
  }
  // Default: bold straw sun hat (hat_sun, hat_garden_wide).
  const wide = hat.includes('wide') || hat.includes('garden');
  return (
    <g stroke="#a16207" strokeWidth={2.6} strokeLinejoin="round">
      <ellipse cx={80} cy={51} rx={wide ? 41 : 35} ry={9.5} fill="#fcd34d" />
      <path d="M57 51 Q80 15 103 51 Z" fill="#fde68a" />
      <path d="M59 46 Q80 39 101 46" fill="none" stroke="#65a30d" strokeWidth={6.5} strokeLinecap="round" />
    </g>
  );
}

export function BuddyHeldItem({ heldItem }: { heldItem: string }) {
  if (heldItem.includes('watering_can')) {
    const gold = heldItem.includes('gold');
    const body = gold ? '#facc15' : '#38bdf8';
    const edge = gold ? '#b45309' : '#0369a1';
    return (
      <g transform="translate(114 112)" stroke={edge} strokeWidth={2.8} strokeLinejoin="round">
        <rect x={0} y={8} width={24} height={20} rx={6} fill={body} />
        <path d="M21 13 L36 4" strokeWidth={5.5} strokeLinecap="round" />
        <path d="M2 8 Q12 -3 20 8" fill="none" />
        <circle cx={37} cy={3} r={1.8} fill="#fff" stroke="none" />
        <circle cx={39} cy={8} r={1.8} fill="#fff" stroke="none" />
      </g>
    );
  }
  if (heldItem.includes('lantern') || heldItem.includes('firefl')) {
    const fire = heldItem.includes('firefl');
    return (
      <g transform="translate(118 108)" stroke="#92400e" strokeWidth={2.8} strokeLinejoin="round">
        <path d="M6 2 Q13 -6 20 2" fill="none" />
        <rect x={3} y={4} width={20} height={24} rx={6} fill={fire ? '#dcfce7' : '#fde047'} />
        <circle cx={13} cy={16} r={5} fill={fire ? '#84cc16' : '#fff7cc'} stroke="none" />
        {fire ? (
          <>
            <circle cx={8} cy={9} r={1.4} fill="#a3e635" stroke="none" />
            <circle cx={18} cy={22} r={1.4} fill="#a3e635" stroke="none" />
          </>
        ) : null}
      </g>
    );
  }
  // Hand trowel.
  return (
    <g transform="translate(116 114)" stroke="#475569" strokeWidth={2.4} strokeLinejoin="round">
      <rect x={10} y={-2} width={4.5} height={17} rx={2} fill="#92400e" />
      <path d="M3 13 Q12 34 21 13 Z" fill="#cbd5e1" />
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
