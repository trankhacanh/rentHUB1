import React, { useState } from 'react';
import useEquipments from './hooks/useEquipments';
import EquipmentTable from './components/EquipmentTable';
import {
  updateAdminEquipment,
  updateAdminEquipmentStatus,
} from '../../../services/equipmentService';
import { formatVnd } from '../../../utils/currency';

const EMPTY_FORM = {
  title: '',
  description: '',
  pricePerDay: '',
  depositAmount: '',
  address: '',
  categoryId: '',
};

const STATUS_OPTIONS = [
  { value: 'AVAILABLE', label: 'Available' },
  { value: 'RENTED', label: 'Rented' },
  { value: 'INACTIVE', label: 'Inactive' },
];

const formatPrice = (value) => {
  const number = Number(value);
  return Number.isFinite(number)
    ? formatVnd(number)
    : '—';
};

export default function EquipmentManagement() {
  const {
    equipments,
    filteredEquipments,
    categories,
    loading,
    error,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    categoryFilter,
    setCategoryFilter,
    fetchEquipments,
  } = useEquipments();

  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (message) => setToast(message);

  const openEdit = (item) => {
    setSelected(item);
    setForm({
      title: item.title || '',
      description: item.description || '',
      pricePerDay: item.pricePerDay ?? '',
      depositAmount: item.depositAmount ?? '',
      address: item.address || '',
      categoryId: item.category?.id || item.categoryId || '',
    });
    setFormError('');
  };

  const closeModal = () => {
    if (saving) return;
    setSelected(null);
    setForm(EMPTY_FORM);
    setFormError('');
  };

  const handleSave = async (event) => {
    event.preventDefault();

    if (!selected) return;

    const title = form.title.trim();
    const price = Number(form.pricePerDay);
    const deposit =
      form.depositAmount === '' ? 0 : Number(form.depositAmount);

    if (!title) {
      setFormError('Tên thiết bị không được để trống.');
      return;
    }

    if (!Number.isFinite(price) || price <= 0) {
      setFormError('Giá thuê mỗi ngày phải lớn hơn 0.');
      return;
    }

    if (!Number.isFinite(deposit) || deposit < 0) {
      setFormError('Tiền đặt cọc không được âm.');
      return;
    }

    setSaving(true);
    setFormError('');

    try {
      await updateAdminEquipment(selected.id, {
        title,
        description: form.description.trim(),
        pricePerDay: price,
        depositAmount: deposit,
        address: form.address.trim(),
        categoryId: form.categoryId || null,
      });

      setSelected(null);
      setForm(EMPTY_FORM);
      showToast('Cập nhật thiết bị thành công.');
      await fetchEquipments();
    } catch (err) {
      setFormError(
        err?.response?.data?.message ||
          err?.message ||
          'Không thể cập nhật thiết bị.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleChangeStatus = async (item) => {
    const currentStatus = String(item.status || '').toUpperCase();
    const nextStatus =
      currentStatus === 'AVAILABLE' ? 'INACTIVE' : 'AVAILABLE';

    const confirmed = window.confirm(
      `Bạn có chắc muốn đổi trạng thái "${item.title}" thành ${nextStatus}?`
    );

    if (!confirmed) return;

    setChangingStatus(true);

    try {
      await updateAdminEquipmentStatus(item.id, nextStatus);
      showToast(`Đã chuyển trạng thái thành ${nextStatus}.`);
      await fetchEquipments();
    } catch (err) {
      showToast(
        err?.response?.data?.message ||
          err?.message ||
          'Không thể cập nhật trạng thái.'
      );
    } finally {
      setChangingStatus(false);
    }
  };

  const stats = [
    {
      label: 'Tổng thiết bị',
      value: equipments.length,
    },
    {
      label: 'Đang khả dụng',
      value: equipments.filter(
        (item) => String(item.status).toUpperCase() === 'AVAILABLE'
      ).length,
    },
    {
      label: 'Đang thuê',
      value: equipments.filter(
        (item) => String(item.status).toUpperCase() === 'RENTED'
      ).length,
    },
    {
      label: 'Ngừng hoạt động',
      value: equipments.filter(
        (item) => String(item.status).toUpperCase() === 'INACTIVE'
      ).length,
    },
  ];

  return (
    <div className="space-y-6">
      {toast && (
        <div
          role="status"
          className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800"
        >
          <span>{toast}</span>
          <button
            type="button"
            onClick={() => setToast('')}
            className="ml-3 font-semibold"
            aria-label="Đóng thông báo"
          >
            ×
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-gray-200 bg-white p-5"
          >
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Quản lý thiết bị
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Dữ liệu được tải từ API quản trị thiết bị.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchEquipments}
            disabled={loading}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {loading ? 'Đang tải...' : 'Làm mới'}
          </button>
        </div>

        <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-3">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm theo tên thiết bị hoặc chủ sở hữu..."
            className="h-10 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-blue-500"
          />

          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            className="h-10 rounded-lg border border-gray-300 px-3 text-sm"
          >
            <option value="ALL">Tất cả danh mục</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="h-10 rounded-lg border border-gray-300 px-3 text-sm"
          >
            <option value="ALL">Tất cả trạng thái</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>

        <EquipmentTable
          equipments={filteredEquipments}
          loading={loading}
          error={error}
          onEdit={openEdit}
          onChangeStatus={handleChangeStatus}
          onRetry={fetchEquipments}
        />

        {!loading && !error && (
          <p className="mt-4 text-sm text-gray-500">
            Hiển thị {filteredEquipments.length} / {equipments.length} thiết bị
          </p>
        )}
      </section>

      {selected && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/40 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <form
            onSubmit={handleSave}
            className="my-8 w-full max-w-2xl rounded-xl bg-white shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h3 className="text-lg font-bold text-gray-900">
                Chỉnh sửa thiết bị
              </h3>
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="text-xl text-gray-500 hover:text-gray-900"
                aria-label="Đóng"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium">
                  Tên thiết bị *
                </label>
                <input
                  required
                  maxLength={255}
                  value={form.title}
                  onChange={(event) =>
                    setForm({ ...form, title: event.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium">
                  Mô tả
                </label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(event) =>
                    setForm({ ...form, description: event.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Giá thuê/ngày (VND) *
                </label>
                <input
                  required
                  type="number"
                  min="0.01"
                  step="1"
                  value={form.pricePerDay}
                  onChange={(event) =>
                    setForm({ ...form, pricePerDay: event.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Tiền đặt cọc (VND)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={form.depositAmount}
                  onChange={(event) =>
                    setForm({ ...form, depositAmount: event.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Danh mục
                </label>
                <select
                  value={form.categoryId}
                  onChange={(event) =>
                    setForm({ ...form, categoryId: event.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                >
                  <option value="">Chưa phân loại</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Địa chỉ
                </label>
                <input
                  value={form.address}
                  onChange={(event) =>
                    setForm({ ...form, address: event.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              </div>

              {formError && (
                <p
                  role="alert"
                  className="rounded-lg bg-red-50 p-3 text-sm text-red-700 md:col-span-2"
                >
                  {formError}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </form>
        </div>
      )}

      {changingStatus && (
        <div className="fixed bottom-5 right-5 rounded-lg bg-gray-900 px-4 py-3 text-sm text-white shadow-lg">
          Đang cập nhật trạng thái...
        </div>
      )}
    </div>
  );
}