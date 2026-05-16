/** Decorative app preview for the landing hero (Planta-style phone frame). */
export default function PhoneMockup() {
  return (
    <div className="relative mx-auto w-[280px] sm:w-[300px]">
      <div
        className="absolute -inset-6 rounded-[3rem] bg-emerald-200/40 blur-3xl"
        aria-hidden
      />
      <div className="relative rounded-[2.5rem] border-[10px] border-[#1a3c34] bg-[#1a3c34] shadow-2xl shadow-emerald-900/20">
        <div className="overflow-hidden rounded-[1.75rem] bg-[#f7f6f2]">
          <div className="flex items-center justify-between bg-emerald-800 px-5 py-3 text-white">
            <span className="text-sm font-semibold">My garden</span>
            <span className="rounded-full bg-amber-300 px-2 py-0.5 text-[10px] font-bold text-emerald-900">
              Premium
            </span>
          </div>
          <div className="space-y-3 p-4">
            {[
              { name: 'Monstera', task: 'Water today', pct: 72, color: 'bg-emerald-500' },
              { name: 'Snake plant', task: 'Water in 3 days', pct: 40, color: 'bg-emerald-400' },
              { name: 'Basil', task: 'Fertilize tomorrow', pct: 55, color: 'bg-amber-400' },
            ].map((plant) => (
              <div
                key={plant.name}
                className="flex gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-emerald-900/5"
              >
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-200 text-xl"
                  aria-hidden
                >
                  🌿
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[#16352f]">{plant.name}</p>
                  <p className="text-xs text-emerald-700">{plant.task}</p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-emerald-100">
                    <div
                      className={`h-full rounded-full ${plant.color}`}
                      style={{ width: `${plant.pct}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
            <div className="rounded-2xl border border-dashed border-emerald-300 bg-emerald-50/80 px-3 py-2 text-center text-xs font-medium text-emerald-800">
              + Add a plant
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
