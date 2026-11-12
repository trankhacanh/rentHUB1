
import { useCallback, useEffect, useMemo, useState } from 'react';
import bookingService from '../../../../services/bookingService';

const normalizeBookings = (response) => {
  const data = response?.data?.data ?? response?.data;

  if (!Array.isArray(data)) {
    throw new Error('API không trả về danh sách đơn thuê hợp lệ.');
  }

  return data;
};

const useRentals = () => {
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchRentals = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await bookingService.getAdminBookings();
      const data = normalizeBookings(response);

      setRentals(data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Không thể tải danh sách đơn thuê.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRentals();
  }, [fetchRentals]);

const filteredRentals = useMemo(() => {
  const normalizedKeyword = keyword.trim().toLowerCase();

  return rentals.filter((rental) => {
    const searchableValues = [
      rental.id,
      rental.equipmentTitle,
      rental.renterName,
      rental.renterId,
    ];

    const matchesKeyword =
      !normalizedKeyword ||
      searchableValues.some((value) =>
        String(value ?? '').toLowerCase().includes(normalizedKeyword)
      );

    const matchesStatus =
      statusFilter === 'ALL' || rental.status === statusFilter;

    return matchesKeyword && matchesStatus;
  });
}, [rentals, keyword, statusFilter]);

  const stats = useMemo(() => {
    const countByStatus = (status) =>
      rentals.filter((rental) => rental.status === status).length;

    return {
      total: rentals.length,
      pending: countByStatus('PENDING'),
      approved: countByStatus('APPROVED'),
      inProgress: countByStatus('IN_PROGRESS'),
      completed: countByStatus('COMPLETED'),
      cancelled: countByStatus('CANCELLED'),
      rejected: countByStatus('REJECTED'),
    };
  }, [rentals]);

  return {
    rentals,
    filteredRentals,
    loading,
    error,
    keyword,
    setKeyword,
    statusFilter,
    setStatusFilter,
    stats,
    fetchRentals,
  };
};

export default useRentals;
