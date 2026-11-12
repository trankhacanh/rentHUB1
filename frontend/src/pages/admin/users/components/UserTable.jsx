
const getFullName = (user) =>
  `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
  'Chưa cập nhật';

const statusConfig = {
  ACTIVE: {
    label: 'Đang hoạt động',
    className: 'bg-green-50 text-green-700',
  },
  SUSPENDED: {
    label: 'Bị đình chỉ',
    className: 'bg-red-50 text-red-700',
  },
  LOCKED: {
    label: 'Bị khóa',
    className: 'bg-orange-50 text-orange-700',
  },
};

const formatRoles = (roles) => {
  if (!Array.isArray(roles) || roles.length === 0) {
    return 'Chưa phân quyền';
  }

  return roles
    .map((role) =>
      String(role).replace(/^ROLE_/, '').replaceAll('_', ' ')
    )
    .join(', ');
};

export default function UserTable({
  users = [],
  loading = false,
  error = '',
  onSelectUser,
  onRetry,
}) {
  if (loading) {
    return (
      <div className="rounded-xl border border-gray-100 bg-white p-10 text-center">
        <p className="text-sm text-gray-500">
          Đang tải danh sách người dùng...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        role="alert"
        className="rounded-xl border border-red-100 bg-white p-8 text-center"
      >
        <p className="font-medium text-red-600">
          Không thể tải danh sách người dùng
        </p>
        <p className="mt-2 break-words text-sm text-gray-500">
          {error}
        </p>

        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white">
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
        <h3 className="font-semibold text-gray-900">
          Danh sách người dùng
        </h3>
        <span className="text-sm text-gray-500">
          {users.length} người dùng
        </span>
      </div>

      {users.length === 0 ? (
        <div className="px-5 py-12 text-center">
          <p className="font-medium text-gray-700">
            Không tìm thấy người dùng
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Thử thay đổi từ khóa hoặc bộ lọc.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th scope="col" className="px-5 py-3 font-medium">
                  Người dùng
                </th>
                <th scope="col" className="px-5 py-3 font-medium">
                  Số điện thoại
                </th>
                <th scope="col" className="px-5 py-3 font-medium">
                  Vai trò
                </th>
                <th scope="col" className="px-5 py-3 font-medium">
                  Trạng thái
                </th>
                <th scope="col" className="px-5 py-3 text-right font-medium">
                  Thao tác
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {users.map((user) => {
                const status = String(
                  user.status || ''
                ).toUpperCase();

                const config = statusConfig[status] || {
                  label: user.status || 'Chưa xác định',
                  className: 'bg-gray-100 text-gray-600',
                };

                return (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <div className="font-medium text-gray-900">
                        {getFullName(user)}
                      </div>
                      <div className="mt-1 text-gray-500">
                        {user.email || 'Chưa cập nhật email'}
                      </div>
                    </td>

                    <td className="px-5 py-4 text-gray-600">
                      {user.phoneNumber || '—'}
                    </td>

                    <td className="px-5 py-4 text-gray-600">
                      {formatRoles(user.roles)}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${config.className}`}
                      >
                        {config.label}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => onSelectUser?.(user)}
                        className="rounded-lg px-3 py-2 font-medium text-blue-600 hover:bg-blue-50"
                        aria-label={`Xem chi tiết ${getFullName(user)}`}
                      >
                        Chi tiết
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
