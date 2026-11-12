import axiosClient from './axiosClient';

const notificationService = {
  getMyNotifications() {
    return axiosClient.get('/notifications/my');
  },

  getUnreadNotifications() {
    return axiosClient.get('/notifications/unread');
  },

  getUnreadCount() {
    return axiosClient.get('/notifications/unread/count');
  },

  markAsRead(notificationId) {
    return axiosClient.put(
      `/notifications/${notificationId}/read`
    );
  },

  markAllAsRead() {
    return axiosClient.put('/notifications/read-all');
  },

  deleteNotification(notificationId) {
    return axiosClient.delete(
      `/notifications/${notificationId}`
    );
  },
};

export default notificationService;