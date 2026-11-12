const STATUS_CONFIG = {
  PENDING: { label: 'Chờ duyệt', className: 'bg-amber-50 text-amber-700 ring-amber-200' },
  APPROVED: { label: 'Đã duyệt', className: 'bg-blue-50 text-blue-700 ring-blue-200' },
  REJECTED: { label: 'Bị từ chối', className: 'bg-red-50 text-red-700 ring-red-200' },
  CANCELLED: { label: 'Đã hủy', className: 'bg-gray-100 text-gray-600 ring-gray-200' },
  IN_PROGRESS: { label: 'Đang thuê', className: 'bg-violet-50 text-violet-700 ring-violet-200' },
  COMPLETED: { label: 'Hoàn tất', className: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
};

export default function RentalStatusBadge({ status }) {
  const config = STATUS_CONFIG[status] ?? {
    label: status || 'Không xác định',
    className: 'bg-gray-100 text-gray-600 ring-gray-200',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${config.className}`}
    >
      <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" />
      {config.label}
    </span>
  );
}