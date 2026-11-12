
import { useEffect, useMemo, useState } from 'react';
import paymentService from '../../../services/paymentService';
import { formatVnd } from '../../../utils/currency';

const toDateInput = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const getInitialRange = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);

  return {
    start: toDateInput(start),
    end: toDateInput(now),
  };
};

const parseDate = (value) => {
  if (!value) return null;

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
};

const getAmount = (payment) => {
  const amount = Number(payment.totalAmount ?? payment.amount ?? 0);

  return Number.isFinite(amount) ? amount : 0;
};

const formatMoney = formatVnd;

const formatDate = (value) => {
  const date = parseDate(value);

  return date
    ? new Intl.DateTimeFormat('vi-VN', {
        dateStyle: 'medium',
      }).format(date)
    : '—';
};

const csvCell = (value) =>
  `"${String(value ?? '').replace(/"/g, '""')}"`;

const downloadCsv = (rows, filename) => {
  const csv =
    '\uFEFF' +
    rows.map((row) => row.map(csvCell).join(',')).join('\r\n');

  const blob = new Blob([csv], {
    type: 'text/csv;charset=utf-8;',
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
};

function MetricCard({ label, value, helper }) {
  return (
    <div className="rh-card p-5">
      <p className="text-sm text-gray-500">{label}</p>

      <p
        className="rh-heading mt-2 text-2xl font-extrabold"
        style={{ color: '#0F1B3D' }}
      >
        {value}
      </p>

      <p className="mt-1 text-xs text-gray-400">{helper}</p>
    </div>
  );
}

export default function ReportsManagement() {
  const initialRange = useMemo(() => getInitialRange(), []);

  const [payments, setPayments] = useState([]);
  const [startDate, setStartDate] = useState(initialRange.start);
  const [endDate, setEndDate] = useState(initialRange.end);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadPayments = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await paymentService.getAdminPayments();

      if (!Array.isArray(response.data)) {
        throw new Error(
          'API thanh toán trả về dữ liệu không đúng định dạng.'
        );
      }

      setPayments(response.data);
    } catch (err) {
      let message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Không thể tải dữ liệu báo cáo.';

      if (err.response?.status === 401) {
        message = 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.';
      } else if (err.response?.status === 403) {
        message = 'Bạn không có quyền xem báo cáo thanh toán.';
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const invalidDateRange =
    Boolean(startDate && endDate && startDate > endDate);

  const filteredPayments = useMemo(() => {
    if (invalidDateRange) return [];

    const start = startDate
      ? new Date(`${startDate}T00:00:00`)
      : null;

    const end = endDate
      ? new Date(`${endDate}T23:59:59.999`)
      : null;

    return payments.filter((payment) => {
      const transactionDate = parseDate(
        payment.paidAt || payment.createdAt
      );

      const matchesStart =
        !start || (transactionDate && transactionDate >= start);

      const matchesEnd =
        !end || (transactionDate && transactionDate <= end);

      const matchesStatus =
        statusFilter === 'ALL' ||
        payment.status === statusFilter;

      return matchesStart && matchesEnd && matchesStatus;
    });
  }, [
    payments,
    startDate,
    endDate,
    statusFilter,
    invalidDateRange,
  ]);

  const metrics = useMemo(() => {
    const paid = filteredPayments.filter(
      (payment) => payment.status === 'PAID'
    );

    const pending = filteredPayments.filter(
      (payment) => payment.status === 'PENDING'
    );

    const totalRevenue = paid.reduce(
      (sum, payment) => sum + getAmount(payment),
      0
    );

    return {
      transactionCount: filteredPayments.length,
      paidCount: paid.length,
      pendingCount: pending.length,
      revenue: totalRevenue,
    };
  }, [filteredPayments]);

  const dailyRevenue = useMemo(() => {
    const grouped = new Map();

    filteredPayments
      .filter((payment) => payment.status === 'PAID')
      .forEach((payment) => {
        const date = parseDate(
          payment.paidAt || payment.createdAt
        );

        if (!date) return;

        const key = toDateInput(date);

        grouped.set(
          key,
          (grouped.get(key) || 0) + getAmount(payment)
        );
      });

    return [...grouped.entries()]
      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
      .map(([date, revenue]) => ({ date, revenue }));
  }, [filteredPayments]);

  const handleExportCsv = () => {
    if (
      loading ||
      error ||
      invalidDateRange ||
      filteredPayments.length === 0
    ) {
      return;
    }

    const headers = [
      'Payment ID',
      'Booking ID',
      'Payment Method',
      'Status',
      'Amount (VND)',
      'Transaction ID',
      'Paid At',
      'Created At',
    ];

    const rows = filteredPayments.map((payment) => [
      payment.id,
      payment.bookingId ?? payment.booking?.id,
      payment.paymentMethod,
      payment.status,
      getAmount(payment),
      payment.transactionId,
      payment.paidAt,
      payment.createdAt,
    ]);

    downloadCsv(
      [headers, ...rows],
      `renthub-payment-report-${startDate || 'all'}-${endDate || 'all'}.csv`
    );
  };

  const resetFilters = () => {
    const range = getInitialRange();

    setStartDate(range.start);
    setEndDate(range.end);
    setStatusFilter('ALL');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2
            className="rh-heading text-xl font-bold"
            style={{ color: '#0F1B3D' }}
          >
            Reports &amp; Analytics
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Tổng hợp doanh thu từ dữ liệu thanh toán thực tế.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={loadPayments}
            disabled={loading}
            className="rh-btn-outline px-4 py-2 text-sm disabled:opacity-50"
          >
            {loading ? 'Đang tải...' : 'Làm mới'}
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            disabled={
              loading ||
              Boolean(error) ||
              invalidDateRange ||
              filteredPayments.length === 0
            }
            className="rh-btn-primary px-4 py-2 text-sm disabled:opacity-50"
          >
            Xuất CSV
          </button>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <p>{error}</p>

          <button
            type="button"
            onClick={loadPayments}
            className="mt-2 font-semibold underline"
          >
            Thử tải lại
          </button>
        </div>
      )}

      <section className="rh-card p-5">
        <h3 className="font-semibold" style={{ color: '#0F1B3D' }}>
          Bộ lọc báo cáo
        </h3>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-4">
          <div>
            <label
              htmlFor="report-start-date"
              className="mb-1.5 block text-xs font-medium text-gray-600"
            >
              Từ ngày
            </label>

            <input
              id="report-start-date"
              type="date"
              value={startDate}
              max={endDate || undefined}
              onChange={(event) => setStartDate(event.target.value)}
              className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="report-end-date"
              className="mb-1.5 block text-xs font-medium text-gray-600"
            >
              Đến ngày
            </label>

            <input
              id="report-end-date"
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(event) => setEndDate(event.target.value)}
              className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="report-status"
              className="mb-1.5 block text-xs font-medium text-gray-600"
            >
              Trạng thái
            </label>

            <select
              id="report-status"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="PAID">Đã thanh toán</option>
              <option value="PENDING">Đang chờ</option>
              <option value="FAILED">Thất bại</option>
              <option value="REFUNDED">Đã hoàn tiền</option>
              <option value="CANCELLED">Đã hủy</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={resetFilters}
              className="rh-btn-outline h-10 w-full px-3 text-sm"
            >
              Đặt lại bộ lọc
            </button>
          </div>
        </div>

        {invalidDateRange && (
          <p className="mt-3 text-sm text-red-600">
            Ngày bắt đầu không được sau ngày kết thúc.
          </p>
        )}
      </section>

      {loading ? (
        <div className="rh-card p-10 text-center text-sm text-gray-500">
          Đang tải dữ liệu báo cáo...
        </div>
      ) : !error ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Doanh thu đã thanh toán"
              value={formatMoney(metrics.revenue)}
              helper="Chỉ tính giao dịch PAID"
            />

            <MetricCard
              label="Giao dịch thành công"
              value={metrics.paidCount}
              helper="Trạng thái PAID"
            />

            <MetricCard
              label="Đang chờ thanh toán"
              value={metrics.pendingCount}
              helper="Trạng thái PENDING"
            />

            <MetricCard
              label="Tổng giao dịch"
              value={metrics.transactionCount}
              helper="Theo bộ lọc đang chọn"
            />
          </div>

          <section className="rh-card p-5">
            <div className="mb-5">
              <h3
                className="font-semibold"
                style={{ color: '#0F1B3D' }}
              >
                Doanh thu theo ngày
              </h3>

              <p className="mt-1 text-xs text-gray-500">
                Các giao dịch PAID trong khoảng thời gian đã chọn.
              </p>
            </div>

            {dailyRevenue.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-500">
                Không có giao dịch thành công trong khoảng thời gian này.
              </p>
            ) : (
              <div className="space-y-4">
                {dailyRevenue.map((item) => {
                  const maxRevenue = Math.max(
                    ...dailyRevenue.map((entry) => entry.revenue),
                    1
                  );

                  const width = Math.max(
                    1,
                    (item.revenue / maxRevenue) * 100
                  );

                  return (
                    <div
                      key={item.date}
                      className="grid grid-cols-[90px_minmax(0,1fr)_130px] items-center gap-3 text-xs sm:grid-cols-[120px_minmax(0,1fr)_170px]"
                    >
                      <span className="text-gray-500">
                        {formatDate(item.date)}
                      </span>

                      <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-blue-600"
                          style={{ width: `${width}%` }}
                        />
                      </div>

                      <span className="text-right font-semibold text-gray-800">
                        {formatMoney(item.revenue)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="rh-card overflow-hidden">
            <div className="border-b border-gray-100 p-5">
              <h3
                className="font-semibold"
                style={{ color: '#0F1B3D' }}
              >
                Chi tiết giao dịch
              </h3>

              <p className="mt-1 text-xs text-gray-500">
                {filteredPayments.length} giao dịch phù hợp bộ lọc.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead className="bg-gray-50 text-gray-500">
                  <tr>
                    {[
                      'Mã thanh toán',
                      'Mã booking',
                      'Phương thức',
                      'Trạng thái',
                      'Số tiền',
                      'Ngày thanh toán',
                    ].map((heading) => (
                      <th
                        key={heading}
                        className="px-4 py-3 font-medium"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {filteredPayments.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-8 text-center text-gray-500"
                      >
                        Không có giao dịch phù hợp.
                      </td>
                    </tr>
                  ) : (
                    filteredPayments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-gray-50">
                        <td
                          className="max-w-52 truncate px-4 py-3 font-medium text-gray-800"
                          title={payment.id}
                        >
                          {payment.id || '—'}
                        </td>

                        <td
                          className="max-w-52 truncate px-4 py-3 text-gray-600"
                          title={payment.bookingId ?? payment.booking?.id}
                        >
                          {payment.bookingId ?? payment.booking?.id ?? '—'}
                        </td>

                        <td className="px-4 py-3 text-gray-600">
                          {payment.paymentMethod || '—'}
                        </td>

                        <td className="px-4 py-3">
                          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">
                            {payment.status || 'UNKNOWN'}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-800">
                          {formatMoney(getAmount(payment))}
                        </td>

                        <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                          {formatDate(payment.paidAt || payment.createdAt)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <p className="text-xs text-gray-500">
            Báo cáo hiện tổng hợp dữ liệu từ API thanh toán admin.
            Thống kê booking, người dùng và doanh thu theo danh mục cần
            API backend tương ứng để bảo đảm tính chính xác.
          </p>
        </>
      ) : null}
    </div>
  );
}
