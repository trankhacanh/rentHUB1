
const inputClass =
  'w-full h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-blue-500';

export default function UserFilters({
  search,
  setSearch,
  roleFilter,
  setRoleFilter,
  statusFilter,
  setStatusFilter,
  sortOrder,
  setSortOrder,
  onRefresh,
  loading,
  roleOptions = [],
}) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div>
          <label
            htmlFor="user-search"
            className="mb-1.5 block text-xs font-medium text-gray-600"
          >
            Tìm kiếm người dùng
          </label>
          <input
            id="user-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tên, email hoặc số điện thoại..."
            className={inputClass}
          />
        </div>

        <div>
          <label
            htmlFor="user-role-filter"
            className="mb-1.5 block text-xs font-medium text-gray-600"
          >
            Vai trò
          </label>
          <select
            id="user-role-filter"
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
            className={inputClass}
          >
<option value="ALL">Tất cả vai trò</option>

{roleOptions.map((role) => (
  <option key={role} value={role}>
    {role.replace(/^ROLE_/, '').replaceAll('_', ' ')}
  </option>
))}
            <option value="ROLE_USER">Người dùng</option>
            <option value="ROLE_ADMIN">Quản trị viên</option>
            <option value="ROLE_OWNER">Chủ thiết bị</option>
            <option value="ROLE_RENTER">Người thuê</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="user-status-filter"
            className="mb-1.5 block text-xs font-medium text-gray-600"
          >
            Trạng thái
          </label>
          <select
            id="user-status-filter"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className={inputClass}
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="SUSPENDED">Bị đình chỉ</option>
            <option value="LOCKED">Bị khóa</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="user-sort"
            className="mb-1.5 block text-xs font-medium text-gray-600"
          >
            Sắp xếp
          </label>
          <select
            id="user-sort"
            value={sortOrder}
            onChange={(event) => setSortOrder(event.target.value)}
            className={inputClass}
          >
            <option value="DEFAULT">Mặc định</option>
            <option value="NAME_ASC">Tên A–Z</option>
            <option value="EMAIL_ASC">Email A–Z</option>
          </select>
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Đang tải...' : 'Làm mới dữ liệu'}
        </button>
      </div>
    </div>
  );
}
