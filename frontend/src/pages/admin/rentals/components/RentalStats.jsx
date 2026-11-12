const CARDS = [
  { key: 'total', label: 'Tổng đơn thuê', color: 'text-blue-600', icon: '▤' },
  { key: 'pending', label: 'Chờ duyệt', color: 'text-amber-600', icon: '◷' },
  { key: 'approved', label: 'Đã duyệt', color: 'text-indigo-600', icon: '✓' },
  { key: 'inProgress', label: 'Đang thuê', color: 'text-violet-600', icon: '↗' },
  { key: 'completed', label: 'Hoàn tất', color: 'text-emerald-600', icon: '✓' },
  { key: 'cancelled', label: 'Đã hủy', color: 'text-red-600', icon: '×' },
];

export default function RentalStats({ stats }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
      {CARDS.map((card) => (
        <div
          key={card.key}
          className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-gray-500">{card.label}</span>
            <span className={`text-xl font-bold ${card.color}`}>
              {card.icon}
            </span>
          </div>

          <p className="mt-3 text-2xl font-bold text-slate-900">
            {(stats?.[card.key] ?? 0).toLocaleString('vi-VN')}
          </p>
        </div>
      ))}
    </div>
  );
}