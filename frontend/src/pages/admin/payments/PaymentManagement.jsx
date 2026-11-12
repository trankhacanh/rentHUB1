
import { useEffect, useMemo, useState } from 'react';
import paymentService from '../../../services/paymentService';
import { formatVnd } from '../../../utils/currency';

const STATUS_LABELS = {
  PENDING: 'Đang chờ',
  PAID: 'Đã thanh toán',
  FAILED: 'Thất bại',
  REFUNDED: 'Đã hoàn tiền',
  CANCELLED: 'Đã hủy',
};

const STATUS_STYLES = {
  PENDING: 'bg-amber-50 text-amber-700',
  PAID: 'bg-emerald-50 text-emerald-700',
  FAILED: 'bg-red-50 text-red-700',
  REFUNDED: 'bg-gray-100 text-gray-700',
  CANCELLED: 'bg-gray-100 text-gray-600',
};

const formatMoney = formatVnd;

const formatDate = (value) => {
  if (!value) return '—';

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleString('vi-VN');
};

const displayStatus = (status) =>
  STATUS_LABELS[status] || status || 'Không xác định';

const displayMethod = (method) => {
  const labels = {
    VNPAY: 'VNPay',
    MOMO: 'MoMo',
    CASH: 'Tiền mặt',
    BANK_TRANSFER: 'Chuyển khoản',
    MOCK: 'Thanh toán thử nghiệm',
  };

  return labels[method] || method || '—';
};

function StatCard({ title, value, description }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="mt-2 break-words text-xl font-bold text-gray-900">
        {value}
      </p>
      <p className="mt-1 text-xs text-gray-400">{description}</p>
    </div>
  );
}

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${
        STATUS_STYLES[status] || 'bg-gray-100 text-gray-600'
      }`}
    >
      {displayStatus(status)}
    </span>
  );
}

function DetailItem({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 break-all text-sm font-medium text-gray-900">
        {value ?? '—'}
      </p>
    </div>
  );
}

function PaymentDetailModal({ payment, onClose }) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-detail-title"
        className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl"
      >
        <header className="sticky top-0 flex items-center justify-between border-b bg-white px-6 py-4">
          <h2
            id="payment-detail-title"
            className="text-lg font-bold text-gray-900"
          >
            Chi tiết thanh toán
          </h2>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng chi tiết"
            className="rounded-lg px-3 py-2 text-gray-500 hover:bg-gray-100"
          >
            Đóng
          </button>
        </header>

        <div className="p-6">
          <div className="mb-6 rounded-xl bg-slate-50 p-5">
            <p className="text-sm text-gray-500">Tổng tiền</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">
              {formatMoney(payment.totalAmount ?? payment.amount)}
            </p>
            <div className="mt-3">
              <StatusBadge status={payment.status} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <DetailItem label="Mã thanh toán" value={payment.id} />
            <DetailItem label="Mã booking" value={payment.bookingId} />
            <DetailItem label="Mã người trả" value={payment.payerId} />
            <DetailItem label="Số tiền" value={formatMoney(payment.amount)} />
            <DetailItem
              label="Tiền đặt cọc"
              value={formatMoney(payment.depositAmount)}
            />
            <DetailItem
              label="Tổng tiền"
              value={formatMoney(payment.totalAmount)}
            />
            <DetailItem
              label="Phương thức"
              value={displayMethod(payment.paymentMethod)}
            />
            <DetailItem
              label="Mã giao dịch cổng thanh toán"
              value={payment.transactionId || '—'}
            />
            <DetailItem
              label="Thời điểm thanh toán"
              value={formatDate(payment.paidAt)}
            />
            <DetailItem
              label="Ngày tạo"
              value={formatDate(payment.createdAt)}
            />
            <DetailItem
              label="Cập nhật lần cuối"
              value={formatDate(payment.updatedAt)}
            />
          </div>
        </div>
      </section>
    </div>
  );
}

export default function PaymentManagement() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [methodFilter, setMethodFilter] = useState('ALL');

  const fetchPayments = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await paymentService.getAdminPayments();
setPayments(response.data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          'Không thể tải danh sách thanh toán.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const statuses = useMemo(
    () => [...new Set(payments.map((p) => p.status).filter(Boolean))],
    [payments]
  );

  const methods = useMemo(
    () => [...new Set(payments.map((p) => p.paymentMethod).filter(Boolean))],
    [payments]
  );

  const filteredPayments = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return payments.filter((payment) => {
      const matchesSearch = [
        payment.id,
        payment.bookingId,
        payment.payerId,
        payment.transactionId,
      ].some((value) =>
        String(value ?? '').toLowerCase().includes(keyword)
      );

      const matchesStatus =
        statusFilter === 'ALL' || payment.status === statusFilter;

      const matchesMethod =
        methodFilter === 'ALL' ||
        payment.paymentMethod === methodFilter;

      return matchesSearch && matchesStatus && matchesMethod;
    });
  }, [payments, search, statusFilter, methodFilter]);

  const paidPayments = payments.filter((p) => p.status === 'PAID');
  const pendingPayments = payments.filter((p) => p.status === 'PENDING');
  const refundedPayments = payments.filter((p) => p.status === 'REFUNDED');

  const revenue = paidPayments.reduce(
    (sum, p) => sum + Number(p.totalAmount ?? p.amount ?? 0),
    0
  );

  const refundedAmount = refundedPayments.reduce(
    (sum, p) => sum + Number(p.totalAmount ?? p.amount ?? 0),
    0
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Tổng doanh thu đã thanh toán"
          value={formatMoney(revenue)}
          description="Tổng giá trị các giao dịch PAID"
        />
        <StatCard
          title="Thanh toán thành công"
          value={paidPayments.length.toLocaleString('vi-VN')}
          description="Giao dịch đã thanh toán"
        />
        <StatCard
          title="Đang chờ thanh toán"
          value={pendingPayments.length.toLocaleString('vi-VN')}
          description="Giao dịch đang chờ xử lý"
        />
        <StatCard
          title="Tổng tiền hoàn trả"
          value={formatMoney(refundedAmount)}
          description="Giao dịch có trạng thái REFUNDED"
        />
      </div>

      <section className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-5">
          <h2 className="text-lg font-bold text-gray-900">
            Quản lý giao dịch
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Danh sách thanh toán lấy trực tiếp từ hệ thống.
          </p>
        </div>

        <div className="mb-5 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_190px_190px]">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm mã thanh toán, booking, giao dịch..."
            className="min-w-0 rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
          />

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm"
          >
            <option value="ALL">Tất cả trạng thái</option>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {displayStatus(status)}
              </option>
            ))}
          </select>

          <select
            value={methodFilter}
            onChange={(event) => setMethodFilter(event.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm"
          >
            <option value="ALL">Tất cả phương thức</option>
            {methods.map((method) => (
              <option key={method} value={method}>
                {displayMethod(method)}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-gray-500">
            Đang tải danh sách thanh toán...
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-700">{error}</p>
            <button
              type="button"
              onClick={fetchPayments}
              className="mt-3 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-red-700"
            >
              Thử lại
            </button>
          </div>
        ) : (
          <>
            <div className="mb-3 text-sm text-gray-500">
              Hiển thị {filteredPayments.length} / {payments.length} giao dịch
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] text-left text-sm">
                <thead className="bg-slate-50 text-gray-500">
                  <tr>
                    {[
                      'Mã thanh toán',
                      'Mã booking',
                      'Người trả',
                      'Tổng tiền',
                      'Phương thức',
                      'Trạng thái',
                      'Ngày tạo',
                      'Thao tác',
                    ].map((heading) => (
                      <th
                        key={heading}
                        className="whitespace-nowrap px-3 py-3 font-medium"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {filteredPayments.map((payment) => (
                    <tr
                      key={payment.id}
                      className="border-t border-gray-100 hover:bg-slate-50"
                    >
                      <td className="max-w-48 break-all px-3 py-3 font-medium text-gray-900">
                        {payment.id}
                      </td>
                      <td className="max-w-40 break-all px-3 py-3">
                        {payment.bookingId ?? '—'}
                      </td>
                      <td className="max-w-40 break-all px-3 py-3">
                        {payment.payerId ?? '—'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 font-medium">
                        {formatMoney(payment.totalAmount ?? payment.amount)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3">
                        {displayMethod(payment.paymentMethod)}
                      </td>
                      <td className="px-3 py-3">
                        <StatusBadge status={payment.status} />
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-gray-500">
                        {formatDate(payment.createdAt)}
                      </td>
                      <td className="px-3 py-3">
                        <button
                          type="button"
                          onClick={() => setSelectedPayment(payment)}
                          className="whitespace-nowrap rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-50"
                        >
                          Chi tiết
                        </button>
                      </td>
                    </tr>
                  ))}

                  {filteredPayments.length === 0 && (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-3 py-12 text-center text-gray-500"
                      >
                        {payments.length === 0
                          ? 'Chưa có giao dịch thanh toán.'
                          : 'Không tìm thấy giao dịch phù hợp.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      {selectedPayment && (
        <PaymentDetailModal
          payment={selectedPayment}
          onClose={() => setSelectedPayment(null)}
        />
      )}
    </div>
  );
}
