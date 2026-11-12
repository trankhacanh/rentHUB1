
import axiosClient from './axiosClient';

/**
 * Lấy danh sách người dùng dành cho Admin.
 * Backend: GET /api/users/admin/all
 *
 * axiosClient đã chịu trách nhiệm cấu hình base URL
 * và access token theo cấu hình hiện có của dự án.
 */
export const getAdminUsers = async () => {
  const response = await axiosClient.get('/users/admin/all');

  const users = response.data?.data ?? response.data;

  if (!Array.isArray(users)) {
    throw new Error(
      'API không trả về danh sách người dùng hợp lệ.'
    );
  }

  return users;
};
