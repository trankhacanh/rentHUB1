import React from 'react';
import { formatVnd } from '../../../../utils/currency';

const STATUS_CONFIG = {
  AVAILABLE: {
    label: 'Available',
    className: 'bg-green-100 text-green-800',
  },
  RENTED: {
    label: 'Rented',
    className: 'bg-yellow-100 text-yellow-800',
  },
  INACTIVE: {
    label: 'Inactive',
    className: 'bg-gray-100 text-gray-700',
  },
  'PENDING APPROVAL': {
    label: 'Pending Approval',
    className: 'bg-blue-100 text-blue-800',
  },
  REJECTED: {
    label: 'Rejected',
    className: 'bg-red-100 text-red-800',
  },
};

const formatPrice = (value) => {
  if (value === null || value === undefined || value === '') {
    return '—';
  }

  const price = Number(value);

  if (!Number.isFinite(price)) {
    return '—';
  }

  return formatVnd(price);
};

const formatDate = (value) => {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const getStatusConfig = (status) => {
  const normalizedStatus = String(status || 'INACTIVE').toUpperCase();

  return (
    STATUS_CONFIG[normalizedStatus] || {
      label: normalizedStatus,
      className: 'bg-gray-100 text-gray-700',
    }
  );
};

function LoadingState() {
  return (
    <div
      role="status"
      className="flex flex-col items-center justify-center py-12 text-center"
    >
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
      <p className="mt-3 text-sm text-gray-500">
        Đang tải danh sách thiết bị...
      </p>
    </div>
  );
}

function ErrorState({ error, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-xl text-red-600">
        !
      </div>

      <p className="text-sm font-semibold text-gray-800">
        Không thể tải danh sách thiết bị
      </p>

      <p role="alert" className="mt-2 max-w-lg text-sm text-red-600">
        {error}
      </p>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          Thử lại
        </button>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-2xl">
        📦
      </div>

      <p className="text-sm font-semibold text-gray-800">
        Không tìm thấy thiết bị
      </p>

      <p className="mt-1 text-sm text-gray-500">
        Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc.
      </p>
    </div>
  );
}

function EquipmentImage({ item }) {
  const imageUrl = item.coverImageUrl || item.imageUrls?.[0];

  if (!imageUrl) {
    return (
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-xl">
        📦
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={item.title || 'Thiết bị RentHub'}
      loading="lazy"
      className="h-12 w-12 shrink-0 rounded-lg border border-gray-100 object-cover"
      onError={(event) => {
        event.currentTarget.style.display = 'none';
      }}
    />
  );
}

function ActionButton({ children, onClick, disabled, className = '', title }) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`rounded-md px-2 py-1.5 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}

export default function EquipmentTable({
  equipments = [],
  loading = false,
  error = '',
  onView,
  onEdit,
  onChangeStatus,
  onRetry,
  changingStatus = false,
}) {
  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={onRetry} />;
  }

  if (!Array.isArray(equipments) || equipments.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-[1000px] divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th
              scope="col"
              className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
            >
              Thiết bị
            </th>

            <th
              scope="col"
              className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
            >
              Chủ sở hữu
            </th>

            <th
              scope="col"
              className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
            >
              Danh mục
            </th>

            <th
              scope="col"
              className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500"
            >
              Giá/ngày
            </th>

            <th
              scope="col"
              className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
            >
              Trạng thái
            </th>

            <th
              scope="col"
              className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
            >
              Ngày tạo
            </th>

            <th
              scope="col"
              className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
            >
              Thao tác
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100 bg-white">
          {equipments.map((item) => {
            const status = getStatusConfig(item.status);
            const itemId = item.id;

            const categoryName =
              item.categoryName ||
              item.category?.name ||
              'Chưa phân loại';

            const ownerName =
              item.ownerName ||
              item.owner?.fullName ||
              item.owner?.name ||
              '—';

            return (
              <tr
                key={itemId}
                className="transition-colors hover:bg-gray-50"
              >
                <td className="px-4 py-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <EquipmentImage item={item} />

                    <div className="min-w-0">
                      <p
                        className="max-w-[220px] truncate font-semibold text-gray-900"
                        title={item.title || ''}
                      >
                        {item.title || 'Chưa có tiêu đề'}
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        ID: {itemId ?? '—'}
                      </p>
                    </div>
                  </div>
                </td>

                <td className="px-4 py-4">
                  <span className="text-sm text-gray-700">
                    {ownerName}
                  </span>
                </td>

                <td className="px-4 py-4">
                  <span className="text-sm text-gray-700">
                    {categoryName}
                  </span>
                </td>

                <td className="whitespace-nowrap px-4 py-4 text-right">
                  <span className="font-semibold text-gray-900">
                    {formatPrice(item.pricePerDay)}
                  </span>
                </td>

                <td className="px-4 py-4">
                  <span
                    className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${status.className}`}
                  >
                    {status.label}
                  </span>
                </td>

                <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-500">
                  {formatDate(item.createdAt)}
                </td>

                <td className="px-4 py-4">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {onView && (
                      <ActionButton
                        title="Xem chi tiết"
                        onClick={() => onView(item)}
                        className="bg-blue-50 text-blue-700 hover:bg-blue-100"
                      >
                        Xem
                      </ActionButton>
                    )}

                    {onEdit && (
                      <ActionButton
                        title="Chỉnh sửa thiết bị"
                        onClick={() => onEdit(item)}
                        className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                      >
                        Sửa
                      </ActionButton>
                    )}

                    {onChangeStatus && (
                      <ActionButton
                        title="Thay đổi trạng thái thiết bị"
                        disabled={changingStatus}
                        onClick={() => onChangeStatus(item)}
                        className="bg-amber-50 text-amber-700 hover:bg-amber-100"
                      >
                        {changingStatus ? 'Đang xử lý...' : 'Đổi trạng thái'}
                      </ActionButton>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
