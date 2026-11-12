import RentalStatusBadge from './RentalStatusBadge';

import { formatVnd } from '../../../../utils/currency';

const formatCurrency = (value) =>
  value == null
    ? '—'
    : formatVnd(value);

const formatDate = (value) => {
  if (!value) return '—';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleDateString('vi-VN');
};

export default function RentalTable({
  rentals,
  loading,
  onView,
}) {
  if (loading) {
    return (
      <div className="py-12 text-center text-sm text-gray-500">
        Đang tải danh sách đơn thuê...
      </div>
    );
  }

  if (rentals.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="font-semibold text-gray-700">
          Không tìm thấy đơn thuê
        </p>
        <p className="mt-1 text-sm text-gray-500">
          Thử thay đổi từ khóa hoặc bộ lọc.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1000px] text-left text-sm">
        <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
          <tr>
            <th className="px-4 py-3 font-semibold">Mã đơn</th>
            <th className="px-4 py-3 font-semibold">Thiết bị</th>
            <th className="px-4 py-3 font-semibold">Người thuê</th>
            <th className="px-4 py-3 font-semibold">Ngày bắt đầu</th>
            <th className="px-4 py-3 font-semibold">Ngày kết thúc</th>
            <th className="px-4 py-3 text-right font-semibold">Tổng tiền</th>
            <th className="px-4 py-3 font-semibold">Trạng thái</th>
            <th className="px-4 py-3 text-center font-semibold">Chi tiết</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100">
          {rentals.map((booking) => (
            <tr
              key={booking.id}
              className="transition hover:bg-gray-50/70"
            >
              <td className="px-4 py-4 font-medium text-gray-900">
                <span className="block max-w-36 truncate" title={String(booking.id)}>
                  {booking.id}
                </span>
              </td>

              <td className="px-4 py-4">
                <div className="flex items-center gap-3">
                  {booking.equipmentImageUrl ? (
                    <img
                      src={booking.equipmentImageUrl}
                      alt={booking.equipmentTitle || 'Thiết bị'}
                      className="h-10 w-10 shrink-0 rounded-lg border border-gray-100 object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-400">
                      ▣
                    </div>
                  )}

                  <span className="max-w-44 truncate font-medium text-gray-800">
                    {booking.equipmentTitle || 'Chưa có tên thiết bị'}
                  </span>
                </div>
              </td>

              <td className="px-4 py-4 text-gray-600">
                {booking.renterName || '—'}
              </td>

              <td className="px-4 py-4 whitespace-nowrap text-gray-600">
                {formatDate(booking.startDate)}
              </td>

              <td className="px-4 py-4 whitespace-nowrap text-gray-600">
                {formatDate(booking.endDate)}
              </td>

              <td className="px-4 py-4 whitespace-nowrap text-right font-semibold text-gray-900">
                {formatCurrency(booking.totalAmount)}
              </td>

              <td className="px-4 py-4">
                <RentalStatusBadge status={booking.status} />
              </td>

              <td className="px-4 py-4 text-center">
                <button
                  type="button"
                  onClick={() => onView(booking)}
                  aria-label={`Xem đơn thuê ${booking.id}`}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-blue-600 transition hover:border-blue-200 hover:bg-blue-50"
                >
                  Xem
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}