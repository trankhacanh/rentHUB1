
const getFullName = (user) =>
  `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
  'Chưa cập nhật';

const formatStatus = (status) => {
  const labels = {
    ACTIVE: 'Đang hoạt động',
    SUSPENDED: 'Bị đình chỉ',
    LOCKED: 'Bị khóa',
  };

  const normalized = String(status || '').toUpperCase();

  return labels[normalized] || status || 'Chưa xác định';
};

function InfoRow({ label, value }) {
  return (
    <div className="border-b border-gray-100 py-3 last:border-b-0">
      <dt className="text-xs font-medium text-gray-500">{label}</dt>
      <dd className="mt-1 break-words text-sm font-medium text-gray-900">
        {value || 'Chưa cập nhật'}
      </dd>
    </div>
  );
}

export default function UserDetailModal({ user, onClose }) {
  if (!user) return null;

  const roles = Array.isArray(user.roles) ? user.roles : [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose?.();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-detail-title"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl"
      >
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
          <div>
            <h2
              id="user-detail-title"
              className="text-lg font-semibold text-gray-900"
            >
              Chi tiết người dùng
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Thông tin tài khoản trên RentHub
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng cửa sổ"
            className="rounded-lg px-3 py-1 text-xl text-gray-500 hover:bg-gray-100"
          >
            ×
          </button>
        </div>

        <div className="px-6 py-4">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-50 text-lg font-semibold text-blue-600">
              {getFullName(user).charAt(0).toUpperCase()}
            </div>

            <div className="min-w-0">
              <p className="break-words font-semibold text-gray-900">
                {getFullName(user)}
              </p>
              <p className="break-words text-sm text-gray-500">
                {user.email || 'Chưa cập nhật email'}
              </p>
            </div>
          </div>

          <dl>
            <InfoRow label="Mã người dùng" value={user.id} />
            <InfoRow label="Họ" value={user.firstName} />
            <InfoRow label="Tên" value={user.lastName} />
            <InfoRow label="Email" value={user.email} />
            <InfoRow label="Số điện thoại" value={user.phoneNumber} />
            <InfoRow
              label="Trạng thái"
              value={formatStatus(user.status)}
            />
            <InfoRow
              label="Vai trò"
              value={
                roles.length
                  ? roles
                      .map((role) =>
                        String(role)
                          .replace(/^ROLE_/, '')
                          .replaceAll('_', ' ')
                      )
                      .join(', ')
                  : 'Chưa phân quyền'
              }
            />
          </dl>
        </div>

        <div className="flex justify-end border-t border-gray-100 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Đóng
          </button>
        </div>
      </section>
    </div>
  );
}
