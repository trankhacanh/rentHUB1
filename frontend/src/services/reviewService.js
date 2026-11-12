
import axiosClient from './axiosClient';

const reviewService = {
  createReview(data) {
    return axiosClient.post('/reviews', data);
  },

  getReviewById(reviewId) {
    return axiosClient.get(`/reviews/${reviewId}`);
  },

  getReviewsByEquipment(equipmentId) {
    return axiosClient.get(`/reviews/equipment/${equipmentId}`);
  },

  getMyReviews() {
    return axiosClient.get('/reviews/my');
  },

  updateReview(reviewId, data) {
    return axiosClient.put(`/reviews/${reviewId}`, data);
  },

  deleteReview(reviewId) {
    return axiosClient.delete(`/reviews/${reviewId}`);
  },

  getAllReviewsForAdmin() {
    return axiosClient.get('/reviews/admin/all');
  },
};

export default reviewService;
