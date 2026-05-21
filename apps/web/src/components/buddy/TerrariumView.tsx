import type { ShopItem } from '../../hooks/buddy/shopTypes';

interface TerrariumViewProps {
  backgroundKey: string;
  layout: Record<string, unknown>;
  furniture: ShopItem[];
  onPlace?: (slot: string, itemId: string | null) => void;
}

const BG_LABELS: Record<string, string> = {
  sunny_windowsill: 'Sunny windowsill',
  greenhouse: 'Greenhouse',
  moonlit_porch: 'Moonlit porch',
  rainy_greenhouse: 'Rainy greenhouse',
};

const SLOTS = ['left', 'center', 'right'] as const;

export default function TerrariumView({
  backgroundKey,
  layout,
  furniture,
  onPlace,
}: TerrariumViewProps) {
  const label = BG_LABELS[backgroundKey] ?? backgroundKey.replace(/_/g, ' ');

  return (
    <div className="overflow-hidden rounded-3xl border border-emerald-200 bg-gradient-to-b from-sky-100 via-lime-50 to-amber-100 p-4 shadow-inner">
      <p className="mb-3 text-center text-xs font-medium uppercase tracking-wide text-emerald-800">
        {label}
      </p>
      <div className="grid min-h-[140px] grid-cols-3 gap-2">
        {SLOTS.map((slot) => {
          const itemId = layout[slot] ? String(layout[slot]) : null;
          const item = furniture.find((f) => f.id === itemId);
          return (
            <button
              key={slot}
              type="button"
              disabled={!onPlace}
              onClick={() => onPlace?.(slot, itemId)}
              className="flex min-h-[100px] flex-col items-center justify-end rounded-2xl border border-dashed border-emerald-300/80 bg-white/40 p-2 text-center"
            >
              {item ? (
                <>
                  <span className="text-2xl">🪴</span>
                  <span className="mt-1 text-[10px] font-medium text-emerald-900">
                    {item.name}
                  </span>
                </>
              ) : (
                <span className="text-xs text-gray-500">Empty</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
