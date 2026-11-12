import { useCallback, useEffect, useMemo, useState } from 'react';
import { getAdminEquipments } from '../../../../services/equipmentService';

export default function useEquipments() {
  const [equipments, setEquipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const fetchEquipments = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const data = await getAdminEquipments();
      setEquipments(data);
    } catch (err) {
      console.error('Failed to fetch admin equipments:', err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          'Không thể tải danh sách thiết bị.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEquipments();
  }, [fetchEquipments]);

  const categories = useMemo(() => {
    const categoryMap = new Map();

    equipments.forEach((item) => {
      const category = item.category;

      if (category?.id) {
        categoryMap.set(category.id, {
          id: category.id,
          name: category.name || 'Chưa phân loại',
        });
      } else if (item.categoryId) {
        categoryMap.set(item.categoryId, {
          id: item.categoryId,
          name: item.categoryName || 'Chưa phân loại',
        });
      }
    });

    return Array.from(categoryMap.values());
  }, [equipments]);

  const filteredEquipments = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return equipments.filter((item) => {
      const matchesSearch =
        !keyword ||
        [
          item.title,
          item.ownerName,
          item.categoryName,
          item.category?.name,
        ]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(keyword));

      const matchesStatus =
        statusFilter === 'ALL' || item.status === statusFilter;

      const itemCategoryId = item.category?.id || item.categoryId || '';
      const matchesCategory =
        categoryFilter === 'ALL' || itemCategoryId === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [equipments, search, statusFilter, categoryFilter]);

  return {
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
    setEquipments,
  };
}