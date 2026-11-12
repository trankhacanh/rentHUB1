const STATUS_OPTIONS = [
  { value: 'ALL', label: 'Tất cả trạng thái' },
  { value: 'PENDING', label: 'Chờ duyệt' },
  { value: 'APPROVED', label: 'Đã duyệt' },
  { value: 'REJECTED', label: 'Bị từ chối' },
  { value: 'IN_PROGRESS', label: 'Đang thuê' },
  { value: 'COMPLETED', label: 'Hoàn tất' },
  { value: 'CANCELLED', label: 'Đã hủy' },
];

export default function RentalFilters({
  keyword,
  onKeywordChange,
  statusFilter,
  onStatusChange,
  onRefresh,
  loading,
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <input
          type="search"
          value={keyword}
          onChange={(event) => onKeywordChange(event.target.value)}
          placeholder="Tìm mã đơn, thiết bị, người thuê..."
          aria-label="Tìm kiếm đơn thuê"
          className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </div>

      <select
        value={statusFilter}
        onChange={(event) => onStatusChange(event.target.value)}
        aria-label="Lọc trạng thái đơn thuê"
        className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:border-blue-500"
      >
        {STATUS_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={onRefresh}
        disabled={loading}
        className="h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? 'Đang tải...' : '↻ Làm mới'}
      </button>
    </div>
  );
}