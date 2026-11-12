import { useEffect } from 'react';
import RentalStatusBadge from './RentalStatusBadge';

import { formatVnd } from '../../../../utils/currency';

const formatCurrency = (value) =>
  value == null ? '—' : formatVnd(value);

const formatDate = (value) => {
  if (!value) return '—';

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleDateString('vi-VN');
};

function DetailItem({ label, children }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-gray-500">{label}</p>
      <div className="mt-1 break-words text-sm font-medium text-gray-900">
        {children ?? '—'}
      </div>
    </div>
  );
}

export default function RentalDetailModal({ booking, onClose }) {
  useEffect(() => {
    if (!booking) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [booking, onClose]);

  if (!booking) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="rental-detail-title"
        className="my-auto max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
      >
        <header className="sticky top-0 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4">
          <div>
            <h2
              id="rental-detail-title"
              className="text-lg font-bold text-slate-900"
            >
              Chi tiết đơn thuê
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              Mã đơn: {booking.id}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng chi tiết"
            className="rounded-lg px-3 py-2 text-gray-500 hover:bg-gray-100"
          >
            ✕
          </button>
        </header>

        <div className="space-y-6 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm text-gray-500">Trạng thái đơn thuê</span>
            <RentalStatusBadge status={booking.status} />
          </div>

          <section>
            <h3 className="mb-4 text-sm font-bold text-slate-900">
              Thông tin thuê
            </h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DetailItem label="Thiết bị">
                {booking.equipmentTitle}
              </DetailItem>
              <DetailItem label="Người thuê">
                {booking.renterName}
              </DetailItem>
              <DetailItem label="ID thiết bị">
                {booking.equipmentId}
              </DetailItem>
              <DetailItem label="ID người thuê">
                {booking.renterId}
              </DetailItem>
              <DetailItem label="Ngày bắt đầu">
                {formatDate(booking.startDate)}
              </DetailItem>
              <DetailItem label="Ngày kết thúc">
                {formatDate(booking.endDate)}
              </DetailItem>
              <DetailItem label="Số ngày thuê">
                {booking.totalDays}
              </DetailItem>
              <DetailItem label="Giá mỗi ngày">
                {formatCurrency(booking.pricePerDay)}
              </DetailItem>
            </div>
          </section>

          <section className="rounded-xl bg-gray-50 p-4">
            <h3 className="mb-3 text-sm font-bold text-slate-900">
              Chi phí
            </h3>

            <div className="space-y-3">
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-gray-500">Tổng tiền thuê</span>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(booking.totalAmount)}
                </span>
              </div>

              <div className="flex justify-between gap-4 text-sm">
                <span className="text-gray-500">Tiền cọc</span>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(booking.depositAmount)}
                </span>
              </div>
            </div>
          </section>

          {booking.renterNote && (
            <section>
              <h3 className="mb-2 text-sm font-bold text-slate-900">
                Ghi chú người thuê
              </h3>
              <p className="whitespace-pre-wrap rounded-xl border border-gray-100 p-3 text-sm text-gray-600">
                {booking.renterNote}
              </p>
            </section>
          )}

          {booking.rejectionReason && (
            <section>
              <h3 className="mb-2 text-sm font-bold text-red-700">
                Lý do từ chối
              </h3>
              <p className="whitespace-pre-wrap rounded-xl bg-red-50 p-3 text-sm text-red-700">
                {booking.rejectionReason}
              </p>
            </section>
          )}

          <section className="grid grid-cols-1 gap-4 border-t border-gray-100 pt-4 sm:grid-cols-2">
            <DetailItem label="Ngày tạo">
              {formatDate(booking.createdAt)}
            </DetailItem>
            <DetailItem label="Cập nhật lần cuối">
              {formatDate(booking.updatedAt)}
            </DetailItem>
          </section>
        </div>

        <footer className="flex justify-end border-t border-gray-100 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Đóng
          </button>
        </footer>
      </section>
    </div>
  );
}   