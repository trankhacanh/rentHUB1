
import axiosClient from './axiosClient';

const paymentService = {
  createPayment(data) {
    return axiosClient.post('/payments', data);
  },

  mockPay(paymentId) {
    return axiosClient.put(`/payments/${paymentId}/mock-pay`);
  },

  getPayment(paymentId) {
    return axiosClient.get(`/payments/${paymentId}`);
  },

  getMyPayments() {
    return axiosClient.get('/payments/my');
  },

  // Admin: lấy danh sách tất cả giao dịch thanh toán
  getAdminPayments() {
    return axiosClient.get('/payments/admin/all');
  },
};

export default paymentService;
