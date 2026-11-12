
import { useCallback, useEffect, useMemo, useState } from 'react';
import { getAdminUsers } from '../../../../services/userService';

const normalize = (value) =>
  String(value ?? '').trim().toLowerCase();

const getFullName = (user) =>
  `${user.firstName || ''} ${user.lastName || ''}`.trim();

export default function useUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortOrder, setSortOrder] = useState('DEFAULT');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const data = await getAdminUsers();
      setUsers(data);
    } catch (err) {
      console.error('Failed to fetch admin users:', err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          'Không thể tải danh sách người dùng.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = useMemo(() => {
    const keyword = normalize(search);

    return users
      .filter((user) => {
        const fullName = getFullName(user);
        const roles = Array.isArray(user.roles) ? user.roles : [];

        const matchesSearch =
          !keyword ||
          [
            fullName,
            user.firstName,
            user.lastName,
            user.email,
            user.phoneNumber,
          ].some((value) => normalize(value).includes(keyword));

        const matchesRole =
          roleFilter === 'ALL' || roles.includes(roleFilter);

        const normalizedStatus = String(
          user.status || ''
        ).toUpperCase();

        const matchesStatus =
          statusFilter === 'ALL' ||
          normalizedStatus === statusFilter;

        return matchesSearch && matchesRole && matchesStatus;
      })
      .sort((a, b) => {
        if (sortOrder === 'NAME_ASC') {
          return getFullName(a).localeCompare(getFullName(b));
        }

        if (sortOrder === 'EMAIL_ASC') {
          return (a.email || '').localeCompare(b.email || '');
        }

        return 0;
      });
  }, [users, search, roleFilter, statusFilter, sortOrder]);

  const stats = useMemo(() => {
    const getStatus = (user) =>
      String(user.status || '').toUpperCase();

    return {
      total: users.length,
      active: users.filter(
        (user) => getStatus(user) === 'ACTIVE'
      ).length,
      suspended: users.filter((user) =>
        ['SUSPENDED', 'LOCKED'].includes(getStatus(user))
      ).length,
      other: users.filter(
        (user) =>
          !['ACTIVE', 'SUSPENDED', 'LOCKED'].includes(
            getStatus(user)
          )
      ).length,
    };
  }, [users]);

  return {
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
  };
}
