import axiosClient from './axiosClient';

const bookingService = {
  createBooking(data) {
    return axiosClient.post('/bookings', data);
  },

  getMyBookings() {
    return axiosClient.get('/bookings/my');
  },

  getOwnerBookings() {
    return axiosClient.get('/bookings/owner');
  },
  getAdminBookings() {
    return axiosClient.get('/bookings/admin/all');
  },
  approveBooking(bookingId) {
    return axiosClient.put(
      `/bookings/${bookingId}/approve`
    );
  },

  rejectBooking(bookingId, data) {
    return axiosClient.put(
      `/bookings/${bookingId}/reject`,
      data
    );
  },

  cancelBooking(bookingId) {
    return axiosClient.put(
      `/bookings/${bookingId}/cancel`
    );
  },

  startBooking(bookingId) {
    return axiosClient.put(
      `/bookings/${bookingId}/start`
    );
  },

  completeBooking(bookingId) {
    return axiosClient.put(
      `/bookings/${bookingId}/complete`
    );
  },

  checkAvailability(equipmentId, startDate, endDate) {
  return axiosClient.get('/bookings/availability', {
    params: {
      equipmentId,
      startDate,
      endDate,
    },
  });
},
getUnavailableDates(equipmentId) {
  return axiosClient.get('/bookings/unavailable-dates', {
    params: { equipmentId },
  });
},



};

export default bookingService;