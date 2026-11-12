
import { useMemo, useState } from 'react';
import useUsers from './hooks/useUsers';
import UserFilters from './components/UserFilters';
import UserTable from './components/UserTable';
import UserDetailModal from './components/UserDetailModal';

function StatCard({ label, value, description, accent }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-gray-500">{label}</p>
        <span
          className={`h-2.5 w-2.5 rounded-full ${accent}`}
          aria-hidden="true"
        />
      </div>
      <p className="mt-3 text-2xl font-bold tracking-tight text-gray-900">
        {value}
      </p>
      <p className="mt-1 text-xs text-gray-500">{description}</p>
    </div>
  );
}

export default function UserManagement() {
  const {
    users,
    filteredUsers,
    loading,
    error,
    stats,
    search,
    setSearch,
    roleFilter,
    setRoleFilter,
    statusFilter,
    setStatusFilter,
    sortOrder,
    setSortOrder,
    fetchUsers,
  } = useUsers();

  const [selectedUser, setSelectedUser] = useState(null);

  const roleOptions = useMemo(() => {
    const roles = users.flatMap((user) =>
      Array.isArray(user.roles) ? user.roles : []
    );

    return [...new Set(roles)].sort((a, b) => a.localeCompare(b));
  }, [users]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-gray-900">
            Quản lý người dùng
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Theo dõi tài khoản, vai trò và trạng thái người dùng RentHub.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchUsers}
          disabled={loading}
          className="inline-flex h-10 items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Đang tải...' : 'Làm mới'}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Tổng người dùng"
          value={stats.total}
          description="Tổng số tài khoản API trả về"
          accent="bg-blue-500"
        />
        <StatCard
          label="Đang hoạt động"
          value={stats.active}
          description="Tài khoản có trạng thái ACTIVE"
          accent="bg-green-500"
        />
        <StatCard
          label="Bị đình chỉ / khóa"
          value={stats.suspended}
          description="SUSPENDED hoặc LOCKED"
          accent="bg-red-500"
        />
        <StatCard
          label="Trạng thái khác"
          value={stats.other}
          description="Các trạng thái còn lại"
          accent="bg-orange-400"
        />
      </div>

      <UserFilters
        search={search}
        setSearch={setSearch}
        roleFilter={roleFilter}
        setRoleFilter={setRoleFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        onRefresh={fetchUsers}
        loading={loading}
        roleOptions={roleOptions}
      />

      <UserTable
        users={filteredUsers}
        loading={loading}
        error={error}
        onSelectUser={setSelectedUser}
        onRetry={fetchUsers}
      />

      {!loading && !error && (
        <p className="text-right text-xs text-gray-500">
          Đang hiển thị {filteredUsers.length} / {users.length} người dùng
        </p>
      )}

      <UserDetailModal
        user={selectedUser}
        onClose={() => setSelectedUser(null)}
      />
    </div>
  );
}
