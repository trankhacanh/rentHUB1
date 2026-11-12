import axiosClient from './axiosClient';

/**
 * Lấy danh sách thiết bị dành cho Admin.
 * Backend: GET /api/equipments/admin
 */
export const getAdminEquipments = async () => {
  const response = await axiosClient.get('/equipments/admin');
  const payload = response.data;

  // Hỗ trợ ApiResponse có trường data hoặc trả về danh sách trực tiếp.
  const equipments = Array.isArray(payload) ? payload : payload?.data;

  if (!Array.isArray(equipments)) {
    throw new Error('API không trả về danh sách thiết bị hợp lệ.');
  }

  return equipments;
};

/**
 * Cập nhật thông tin thiết bị dành cho Admin.
 * Backend: PUT /api/equipments/admin/{id}
 */
export const updateAdminEquipment = async (id, equipmentData) => {
  if (!id) {
    throw new Error('Thiếu ID thiết bị cần cập nhật.');
  }

  const response = await axiosClient.put(
    `/equipments/admin/${id}`,
    equipmentData
  );

  return response.data;
};

/**
 * Cập nhật trạng thái thiết bị dành cho Admin.
 * Backend: PATCH /api/equipments/admin/{id}/status
 */
export const updateAdminEquipmentStatus = async (id, status) => {
  if (!id) {
    throw new Error('Thiếu ID thiết bị cần cập nhật trạng thái.');
  }

  const allowedStatuses = ['AVAILABLE', 'RENTED', 'INACTIVE'];

  if (!allowedStatuses.includes(status)) {
    throw new Error(`Trạng thái thiết bị không hợp lệ: ${status}`);
  }

  const response = await axiosClient.patch(
    `/equipments/admin/${id}/status`,
    { status }
  );

  return response.data;
};