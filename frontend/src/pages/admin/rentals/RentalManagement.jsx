import { useCallback, useState } from 'react';
import useRentals from './hooks/useRentals';
import RentalStats from './components/RentalStats';
import RentalFilters from './components/RentalFilters';
import RentalTable from './components/RentalTable';
import RentalDetailModal from './components/RentalDetailModal';

export default function RentalManagement() {
  const {
    filteredRentals,
    stats,
    loading,
    error,
    keyword,
    setKeyword,
    statusFilter,
    setStatusFilter,
    fetchRentals,
  } = useRentals();

  const [selectedBooking, setSelectedBooking] = useState(null);

  const closeDetail = useCallback(() => {
    setSelectedBooking(null);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Quản lý đơn thuê
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Theo dõi đơn thuê và trạng thái giao dịch trên RentHub.
          </p>
        </div>

        <p className="text-sm text-gray-500">
          {filteredRentals.length} đơn thuê
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p className="font-semibold text-red-800">
              Không thể tải dữ liệu đơn thuê
            </p>
            <p className="mt-1 break-words text-sm text-red-700">{error}</p>
          </div>

          <button
            type="button"
            onClick={fetchRentals}
            disabled={loading}
            className="shrink-0 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 disabled:opacity-50"
          >
            Thử lại
          </button>
        </div>
      )}

      <RentalStats stats={stats} />

      <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-100 p-4 sm:p-5">
          <RentalFilters
            keyword={keyword}
            onKeywordChange={setKeyword}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            onRefresh={fetchRentals}
            loading={loading}
          />
        </div>

        <RentalTable
          rentals={filteredRentals}
          loading={loading}
          onView={setSelectedBooking}
        />

        {!loading && !error && filteredRentals.length > 0 && (
          <div className="border-t border-gray-100 px-4 py-3 text-xs text-gray-500">
            Hiển thị {filteredRentals.length} / {stats.total} đơn thuê
          </div>
        )}
      </section>

      <RentalDetailModal
        booking={selectedBooking}
        onClose={closeDetail}
      />
    </div>
  );
}