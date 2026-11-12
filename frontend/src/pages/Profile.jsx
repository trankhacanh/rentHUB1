import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosClient from '../services/axiosClient';
import bookingService from '../services/bookingService';
import paymentService from '../services/paymentService';
import { formatVnd } from '../utils/currency';
import { usePreferences } from '../context/preferences';
/* ------------------------------------------------------------------ */
/* Mock data (still used for stats/rentals/equipment/etc. not yet wired */
/* to real endpoints) — USER below is only the fallback shape.          */
/* ------------------------------------------------------------------ */

const USER = {
  id: 'user-001',
  firstName: 'Minh',
  lastName: 'Nguyen',
  email: 'minh.nguyen@example.com',
  phoneNumber: '+84 912 345 678',
  location: 'District 1, Ho Chi Minh City',
  dob: '12 March 2002',
  memberSince: 'January 2025',
  verified: true,
  rating: 4.9,
  reviewCount: 32,
  totalRentals: 24,
  equipmentListed: 8,
};

const MY_EQUIPMENT = [
  { id: 1, name: 'Sony Alpha A7 IV', category: 'Camera', price: 250000, status: 'Available', views: 32, rentals: 12, icon: '📷' },
  { id: 2, name: 'MacBook Pro 14"', category: 'Laptop', price: 300000, status: 'Available', views: 48, rentals: 21, icon: '💻' },
  { id: 3, name: 'DJI Mini 4 Pro', category: 'Drone', price: 350000, status: 'Rented', views: 76, rentals: 18, icon: '🚁' },
];

const MY_RENTALS = [
  { id: 1, name: 'Sony Alpha A7 IV', owner: 'Minh Nguyen', period: 'Aug 15 – Aug 18, 2026', total: 2000000, status: 'Confirmed', icon: '📷' },
  { id: 2, name: 'JBL PartyBox 310', owner: 'Khoa Pham', period: 'Jul 20 – Jul 22, 2026', total: 1100000, status: 'Completed', icon: '🔊' },
];

const RENTAL_HISTORY = [
  { id: 1, name: 'Sony A7 IV', period: 'Aug 15–18', total: 2000000, status: 'Confirmed' },
  { id: 2, name: 'JBL PartyBox 310', period: 'Jul 20–22', total: 1100000, status: 'Completed' },
  { id: 3, name: 'Epson Projector', period: 'Jul 05–07', total: 1350000, status: 'Completed' },
];

const FAVORITES = [
  { id: 1, name: 'Sony A7 III', price: 220000, rating: 4.9, icon: '📷' },
  { id: 2, name: 'Canon EOS R6 Mark II', price: 280000, rating: 4.8, icon: '📷' },
  { id: 3, name: 'DJI Mini 4 Pro', price: 350000, rating: 4.9, icon: '🚁' },
  { id: 4, name: 'JBL PartyBox 310', price: 220000, rating: 4.9, icon: '🔊' },
];

const MY_REVIEWS = [
  { id: 1, equipment: 'Sony Alpha A7 IV', rating: 5, text: 'Great camera and very friendly owner. The equipment was exactly as described.', date: 'August 10, 2026' },
  { id: 2, equipment: 'JBL PartyBox 310', rating: 5, text: 'Everything worked perfectly and pickup was very convenient.', date: 'July 25, 2026' },
];

const REVIEWS_ABOUT_ME = [
  { author: 'Hoang Le', text: 'Excellent renter. Returned the equipment on time and kept everything in perfect condition.' },
];

const NOTIFICATIONS = [
  { id: 1, color: '#16A34A', title: 'Rental confirmed', text: 'Your request for Sony Alpha A7 IV has been accepted.', time: '10 minutes ago' },
  { id: 2, color: '#2F5FE0', title: 'New message', text: 'Minh Nguyen sent you a message.', time: '1 hour ago' },
  { id: 3, color: '#F59E0B', title: 'Rental reminder', text: 'Your rental starts tomorrow.', time: '5 hours ago' },
];

const STATUS_META = {
  Pending: { bg: '#FEF9C3', color: '#A16207', dot: '#F59E0B' },
  Confirmed: { bg: '#ECFDF3', color: '#16A34A', dot: '#16A34A' },
  Completed: { bg: '#EFF6FF', color: '#2563EB', dot: '#2563EB' },
  Cancelled: { bg: '#FEF2F2', color: '#DC2626', dot: '#DC2626' },
  Available: { bg: '#ECFDF3', color: '#16A34A', dot: '#16A34A' },
  Rented: { bg: '#FEF9C3', color: '#A16207', dot: '#F59E0B' },
};

/* ------------------------------------------------------------------ */
/* Icons                                                                */
/* ------------------------------------------------------------------ */

const Icon = {
  user: (p) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></svg>,
  rentals: (p) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><rect x="3" y="7" width="18" height="14" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>,
  box: (p) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><path d="M21 8V21H3V8" /><path d="M1 3h22v5H1z" /><path d="M10 12h4" /></svg>,
  heart: (p) => <svg width="18" height="18" viewBox="0 0 24 24" fill={p.filled ? '#EF4444' : 'none'} stroke={p.filled ? '#EF4444' : 'currentColor'} strokeWidth="1.8"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" /></svg>,
  star: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill={p.empty ? '#E5E7EB' : '#F59E0B'} stroke={p.empty ? '#E5E7EB' : '#F59E0B'}><path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.9L12 17.8 5.8 21l1.2-6.9-5-4.9 6.9-1z" /></svg>,
  bell: (p) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></svg>,
  settings: (p) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 0 1-4 0v-.09A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.55-1H3a2 2 0 0 1 0-4h.09A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.55V3a2 2 0 0 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9a1.7 1.7 0 0 0 1.55 1H21a2 2 0 0 1 0 4h-.09a1.7 1.7 0 0 0-1.51 1z" /></svg>,
  pin: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 1 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>,
  shield: (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2" {...p}><path d="M12 2l8 4v6c0 5-3.4 8.4-8 10-4.6-1.6-8-5-8-10V6z" /></svg>,
  logout: (p) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" /></svg>,
  menu: (p) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><path d="M3 6h18M3 12h18M3 18h18" /></svg>,
  close: (p) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><path d="M18 6L6 18M6 6l12 12" /></svg>,
  trash: (p) => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6" /></svg>,
};

function Stars({ value }) {
  const rounded = Math.round(value);
  return <span className="inline-flex gap-0.5">{Array.from({ length: 5 }).map((_, i) => <Icon.star key={i} empty={i >= rounded} />)}</span>;
}

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || { bg: '#F1F3F6', color: '#6B7280', dot: '#9CA3AF' };
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: meta.bg, color: meta.color }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: meta.dot }} /> {status}
    </span>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="w-10 h-6 rounded-full relative transition-colors"
      style={{ background: checked ? '#2F5FE0' : '#E5E7EB' }}
    >
      <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all" style={{ left: checked ? '18px' : '2px' }} />
    </button>
  );
}

const MENU = [
  { key: 'profile', label: 'Profile', icon: Icon.user },
  { key: 'rentals', label: 'My Rentals', icon: Icon.rentals },
  { key: 'bookingRequests', label: 'Booking Requests', icon: Icon.box },
  { key: 'equipment', label: 'My Equipment', icon: Icon.box },
  { key: 'favorites', label: 'Favorites', icon: Icon.heart },
  { key: 'reviews', label: 'Reviews', icon: Icon.star },
  { key: 'notifications', label: 'Notifications', icon: Icon.bell },
  { key: 'settings', label: 'Settings', icon: Icon.settings },
];

/* ------------------------------------------------------------------ */

export default function Profile() {
  const { t } = usePreferences();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const [paymentTarget, setPaymentTarget] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);


  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [form, setForm] = useState({
    firstName: USER.firstName, lastName: USER.lastName, email: USER.email, phoneNumber: USER.phoneNumber, location: USER.location,
  });

  const [equipment, setEquipment] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [ownerBookings, setOwnerBookings] = useState([]);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [favorites, setFavorites] = useState(FAVORITES);
  const [myBookings, setMyBookings] = useState([]);
  const [myBookingsLoading, setMyBookingsLoading] = useState(false);
  const [myReviews, setMyReviews] = useState([]);
  const [reviewTarget, setReviewTarget] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState('');
  
  const handleSubmitReview = async (e) => {
  e.preventDefault();

  if (!reviewTarget?.id) {
    setReviewError('Không tìm thấy thông tin đơn thuê.');
    return;
  }

  if (reviewRating < 1 || reviewRating > 5) {
    setReviewError('Vui lòng chọn số sao từ 1 đến 5.');
    return;
  }

  try {
    setReviewSubmitting(true);
    setReviewError('');

    await axiosClient.post('/reviews', {
      bookingId: reviewTarget.id,
      rating: reviewRating,
      comment: reviewComment.trim() || null,
    });

    await fetchMyReviews();

    setReviewTarget(null);
    setReviewRating(5);
    setReviewComment('');
    alert('Đánh giá đã được gửi thành công.');
  } catch (error) {
    console.error('Failed to submit review:', error);

    setReviewError(
      error.response?.data?.message ||
      error.response?.data?.error ||
      'Không thể gửi đánh giá. Vui lòng thử lại.'
    );
  } finally {
    setReviewSubmitting(false);
  }
};

  const [payments, setPayments] = useState([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);

  const [historyFilter, setHistoryFilter] = useState('All');
  const [cancelBookingTarget, setCancelBookingTarget] = useState(null);
  const [cancelBookingLoading, setCancelBookingLoading] = useState(false);

  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const [toggles, setToggles] = useState({
    profileVisible: true, showLocation: true, showHistory: false,
    emailNotif: true, rentalUpdates: true, messages: true, promotions: false,
    twoFactor: false,
  });

  const fetchOwnerBookings = async () => {
    try {
      setBookingLoading(true);

      const response = await bookingService.getOwnerBookings();
      const items = Array.isArray(response.data) ? response.data : [];

      setOwnerBookings(items);
    } catch (error) {
      console.error('Failed to fetch owner bookings:', error);
      setOwnerBookings([]);
    } finally {
      setBookingLoading(false);
    }
  };
  const fetchMyReviews = async () => {
  try {
    const response = await axiosClient.get('/reviews/my');
    const items = Array.isArray(response.data)
      ? response.data
      : [];

    setMyReviews(items);
    return items;
  } catch (error) {
    console.error('Failed to fetch my reviews:', error);
    setMyReviews([]);
    return [];
  }
};

  const fetchMyBookings = async (paymentItems = []) => {
  try {
    setMyBookingsLoading(true);

    const response = await bookingService.getMyBookings();

    const items = Array.isArray(response.data)
      ? response.data
      : [];

    const enrichedBookings = items.map((booking) => {
      const payment = paymentItems.find(
        (item) =>
          item.bookingId === booking.id ||
          item.booking?.id === booking.id
      );

      return {
        ...booking,
        payment: payment || null,
      };
    });

    console.log(
      'Bookings with payments:',
      enrichedBookings
    );
    console.log('FIRST BOOKING DATA:', enrichedBookings[0]);
    setMyBookings(enrichedBookings);
  } catch (error) {
    console.error('Failed to fetch my bookings:', error);
    setMyBookings([]);
  } finally {
    setMyBookingsLoading(false);
  }
};

const fetchMyPayments = async () => {
  try {
    setPaymentsLoading(true);

    const response = await paymentService.getMyPayments();
    console.log('RAW GET MY PAYMENTS RESPONSE:', response);
    console.log('PAYMENT RESPONSE DATA:', response.data);
    const items = Array.isArray(response.data)
      ? response.data
      : [];

    console.log('My payments:', items);

    setPayments(items);

    return items;
  } catch (error) {
    console.error('Failed to fetch my payments:', error);
    setPayments([]);
    return [];
  } finally {
    setPaymentsLoading(false);
  }
};

  const handleApproveBooking = async (bookingId) => {
    try {
      await bookingService.approveBooking(bookingId);

      alert('Booking approved successfully.');
      await fetchOwnerBookings();
    } catch (error) {
      console.error('Failed to approve booking:', error);

      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Failed to approve booking.';

      alert(message);
    }
  };

  const handleStartBooking = async (bookingId) => {
  try {
    await bookingService.startBooking(bookingId);

    alert('Rental started successfully.');

    await fetchOwnerBookings();
  } catch (error) {
    console.error('Failed to start rental:', error);

    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      'Failed to start rental.';

    alert(message);
  }
};

const handleCompleteBooking = async (bookingId) => {
  try {
    await bookingService.completeBooking(bookingId);

    alert('Rental completed successfully.');

    await fetchOwnerBookings();
  } catch (error) {
    console.error('Failed to complete rental:', error);

    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      'Failed to complete rental.';

    alert(message);
  }
};

  const handleRejectBooking = async (bookingId) => {
    const reason = window.prompt('Enter rejection reason:');

    if (reason === null) return;

    if (!reason.trim()) {
      alert('Rejection reason cannot be empty.');
      return;
    }

    try {
      await bookingService.rejectBooking(bookingId, {
        rejectionReason: reason.trim(),
      });

      alert('Booking rejected successfully.');
      await fetchOwnerBookings();
    } catch (error) {
      console.error('Failed to reject booking:', error);

      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Failed to reject booking.';

      alert(message);
    }
  };

  const handleCancelBooking = async (bookingId) => {
  try {
    setCancelBookingLoading(true);

    await bookingService.cancelBooking(bookingId);

    alert('Rental cancelled successfully.');

    setCancelBookingTarget(null);

    const paymentItems = await fetchMyPayments();
await fetchMyBookings(paymentItems);
  } catch (error) {
    console.error('Failed to cancel booking:', error);

    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      'Failed to cancel rental.';

    alert(message);
  } finally {
    setCancelBookingLoading(false);
  }
};
const handlePayBooking = (booking) => {
  if (!booking?.id) {
    alert('Booking information is missing.');
    return;
  }

  navigate(`/payment?bookingId=${booking.id}`);
};
  // Fetch the logged-in user's profile. `loading` is controlled solely by
  // this request now — no artificial setTimeout racing against it, which
  // previously caused the UI to flash mock data before the real profile
  // arrived.
  useEffect(() => {
    let cancelled = false;

    const fetchCurrentUser = async () => {
      try {
        const response = await axiosClient.get('/users/me');

console.log('GET /users/me - FULL RESPONSE:', response);
console.log('GET /users/me - RESPONSE DATA:', response.data);

if (cancelled) return;

const user = response.data?.data ?? response.data?.user ?? response.data;

console.log('GET /users/me - NORMALIZED USER:', user);

setCurrentUser(user);
        setForm({
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.email || '',
          phoneNumber: user.phoneNumber || '',
          location: user.location || USER.location,
        });
      } catch (error) {
        console.error('Failed to fetch current user profile:', error);
        if (!cancelled) setCurrentUser(null);
      }
    };

    const fetchMyEquipment = async () => {
      try {
        const response = await axiosClient.get('/equipments/my-equipment');
        if (cancelled) return;

        const items = Array.isArray(response.data) ? response.data : [];
        const mapped = items.map((item, index) => ({
          id: item.id || index,
          name: item.title || 'Untitled equipment',
          category: item.category || 'Uncategorized',
          price: item.pricePerDay ?? 0,
          status: item.status || 'AVAILABLE',
          views: 0,
          rentals: 0,
          icon: ['📷', '💻', '🚁', '🎧', '📦'][index % 5],
        }));

        setEquipment(mapped);
      } catch (error) {
        console.error('Failed to fetch my equipment:', error);
        if (!cancelled) setEquipment([]);
      }
    };
const loadProfileData = async () => {
  await Promise.all([
    fetchCurrentUser(),
    fetchMyEquipment(),
    fetchOwnerBookings(),
  ]);

 const paymentItems = await fetchMyPayments();

if (!cancelled) {
  await Promise.all([
    fetchMyBookings(paymentItems),
    fetchMyReviews(),
  ]);

  setLoading(false);
}
};
    loadProfileData();
    return () => { cancelled = true; };
  }, []);

  const displayUser = currentUser || USER;

  const filteredHistory = useMemo(
    () => (historyFilter === 'All' ? RENTAL_HISTORY : RENTAL_HISTORY.filter((r) => r.status === historyFilter)),
    [historyFilter]
  );

  const validateForm = () => {
    const errs = {};
    if (!form.firstName.trim()) errs.firstName = 'First name is required';
    if (!form.lastName.trim()) errs.lastName = 'Last name is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Please enter a valid email address';
    if (!/^[0-9+\-\s]{8,15}$/.test(form.phoneNumber)) errs.phoneNumber = 'Please enter a valid phone number';
    return errs;
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    const errs = validateForm();
    setFormErrors(errs);
    if (Object.keys(errs).length) return;

    setSaving(true);

    try {
      const payload = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phoneNumber: form.phoneNumber.trim(),
      };

      const response = await axiosClient.put('/users/me', payload);
      const updatedUser = response.data?.user || { ...displayUser, ...payload };

      setCurrentUser(updatedUser);
      setForm({
        firstName: updatedUser.firstName || '',
        lastName: updatedUser.lastName || '',
        email: updatedUser.email || '',
        phoneNumber: updatedUser.phoneNumber || '',
        location: updatedUser.location || form.location,
      });

      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setEditOpen(false);
      }, 1200);
    } catch (error) {
      console.error('Failed to update profile:', error);
      setFormErrors((previous) => ({
        ...previous,
        submit: error.response?.data?.message || 'Unable to update profile. Please try again.',
      }));
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteEquipment = () => {
    setEquipment((list) => list.filter((e) => e.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  const toggleFavorite = (id) => setFavorites((list) => list.filter((f) => f.id !== id));

  const handleSignOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const initials = `${(displayUser.firstName || 'U')[0]}${(displayUser.lastName || 'S')[0]}`;


  return (
    <div className="rh-root min-h-screen" style={{ background: '#F7F9FC', color: '#111827' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800&family=Inter:wght@400;500;600&display=swap');
        .rh-root { font-family: 'Inter', sans-serif; }
        .rh-heading { font-family: 'Plus Jakarta Sans', sans-serif; }
        .rh-card { border: 1px solid #EEF0F3; border-radius: 16px; background: #fff; }
        .rh-card-hover { transition: box-shadow .2s ease, transform .2s ease; }
        .rh-card-hover:hover { box-shadow: 0 16px 32px -16px rgba(15,27,61,0.18); transform: translateY(-3px); }
        .rh-btn-primary { background: #2F5FE0; color: #fff; font-weight: 600; border-radius: 10px; transition: background .15s ease, transform .1s ease; }
        .rh-btn-primary:hover:not(:disabled) { background: #274DBD; }
        .rh-btn-primary:disabled { opacity: .6; cursor: not-allowed; }
        .rh-btn-outline { border: 1px solid #E5E7EB; color: #374151; font-weight: 600; border-radius: 10px; transition: background .15s ease; }
        .rh-btn-outline:hover { background: #F9FAFB; }
        .rh-btn-danger { border: 1px solid #FCA5A5; color: #DC2626; font-weight: 600; border-radius: 10px; transition: background .15s ease; }
        .rh-btn-danger:hover { background: #FEF2F2; }
        .rh-input { height: 46px; border: 1px solid #E5E7EB; border-radius: 10px; transition: border-color .15s ease, box-shadow .15s ease; }
        .rh-input:focus-within { border-color: #2F5FE0; box-shadow: 0 0 0 3px rgba(47,95,224,0.12); }
        .rh-input.rh-err { border-color: #DC2626; }
        .rh-input input { outline: none; background: transparent; width: 100%; }
        .rh-skel { background: linear-gradient(90deg, #F1F3F6 25%, #E9ECF1 37%, #F1F3F6 63%); background-size: 400% 100%; animation: rh-shimmer 1.4s ease infinite; border-radius: 10px; }
        @keyframes rh-shimmer { 0% { background-position: 100% 0; } 100% { background-position: 0 0; } }
        .rh-navitem { transition: background .15s ease, color .15s ease; }
        .rh-fade { animation: rh-in .3s ease both; }
        @keyframes rh-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @media (prefers-reduced-motion: reduce) { .rh-skel, .rh-fade { animation: none; } .rh-card-hover:hover { transform: none; } }
      `}</style>

      {/* ---------------- TOP HEADER (mobile) ---------------- */}
      <header className="lg:hidden sticky top-0 z-40 bg-white border-b flex items-center justify-between px-5 h-16" style={{ borderColor: '#EEF0F3' }}>
        <Link to="/" className="flex items-center gap-2.5">
          <div className="rh-heading w-8 h-8 rounded-lg flex items-center justify-center text-white font-extrabold" style={{ background: '#2F5FE0' }}>R</div>
          <span className="rh-heading text-lg font-bold" style={{ color: '#0F1B3D' }}>RentHub</span>
        </Link>
        <button onClick={() => setMobileMenuOpen((o) => !o)} aria-label="Menu">{mobileMenuOpen ? <Icon.close /> : <Icon.menu />}</button>
      </header>
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b px-5 py-3 flex gap-2 overflow-x-auto" style={{ borderColor: '#EEF0F3' }}>
          {MENU.map((m) => (
            <button
              key={m.key}
              onClick={() => { setActiveTab(m.key); setMobileMenuOpen(false); }}
              className="rh-navitem shrink-0 flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg"
              style={{ background: activeTab === m.key ? 'rgba(47,95,224,0.1)' : 'transparent', color: activeTab === m.key ? '#2F5FE0' : '#374151' }}
            >
              <m.icon /> {t(m.label)}
            </button>
          ))}
        </div>
      )}

      <div className="max-w-7xl mx-auto lg:px-8 lg:py-8 lg:grid lg:grid-cols-[260px_1fr] lg:gap-8">
        {/* ---------------- SIDEBAR (desktop) ---------------- */}
        <aside className="hidden lg:flex lg:flex-col rh-card p-5 h-fit sticky top-8">
        

          <div className="flex items-center gap-3 px-1 mb-6">
            <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-semibold shrink-0" style={{ background: '#1E3A8A' }}>{initials}</div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: '#111827' }}>{displayUser.firstName} {displayUser.lastName}</p>
              <p className="text-xs truncate" style={{ color: '#9CA3AF' }}>{displayUser.email}</p>
            </div>
          </div>
          {USER.verified && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full mb-6 w-fit" style={{ background: '#ECFDF3', color: '#16A34A' }}>
              <Icon.shield /> {t('Verified User')}
            </span>
          )}

          <nav className="flex flex-col gap-1">
            {MENU.map((m) => (
              <button
                key={m.key}
                onClick={() => setActiveTab(m.key)}
                className="rh-navitem flex items-center gap-2.5 text-sm font-medium px-3 py-2.5 rounded-lg text-left"
                style={{ background: activeTab === m.key ? 'rgba(47,95,224,0.1)' : 'transparent', color: activeTab === m.key ? '#2F5FE0' : '#374151' }}
              >
                <m.icon /> {t(m.label)}
              </button>
            ))}
          </nav>

          <button onClick={handleSignOut} className="rh-navitem flex items-center gap-2.5 text-sm font-medium px-3 py-2.5 rounded-lg text-left mt-6" style={{ color: '#DC2626' }}>
            <Icon.logout /> {t('Sign Out')}
          </button>
        </aside>

        {/* ---------------- MAIN CONTENT ---------------- */}
        <main className="px-5 py-6 lg:px-0 lg:py-0">
          {loading ? (
            <div>
              <div className="rh-card p-6 mb-6 flex items-center gap-5">
                <div className="rh-skel w-20 h-20 rounded-full shrink-0" />
                <div className="flex-1"><div className="rh-skel h-5 w-40 mb-2" /><div className="rh-skel h-3 w-56" /></div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="rh-skel h-20" />)}</div>
              <div className="rh-skel h-48 w-full" />
            </div>
          ) : (
            <div className="rh-fade">
              {activeTab === 'profile' && (
                <ProfileTab
                  displayUser={displayUser}
                  initials={initials}
                  setEditOpen={setEditOpen}
                />
              )}
              {activeTab === 'rentals' && (
              <RentalsTab
  historyFilter={historyFilter}
  setHistoryFilter={setHistoryFilter}
  filteredHistory={filteredHistory}
  bookings={myBookings}
  loading={myBookingsLoading}
  onCancel={setCancelBookingTarget}
  onPay={handlePayBooking}
  myReviews={myReviews}
  onReview={(booking) => {
    setReviewTarget(booking);
    setReviewRating(5);
    setReviewComment('');
    setReviewError('');
  }}
/>
              )}
              {activeTab === 'bookingRequests' && (
  <BookingRequestsTab
    bookings={ownerBookings}
    loading={bookingLoading}
    onApprove={handleApproveBooking}
    onReject={handleRejectBooking}
    onStart={handleStartBooking}
    onComplete={handleCompleteBooking}

  />
)}

              {activeTab === 'equipment' && <EquipmentTab equipment={equipment} onDelete={setDeleteTarget} />}
              {activeTab === 'favorites' && <FavoritesTab favorites={favorites} onToggle={toggleFavorite} />}
              {activeTab === 'reviews' && (
  <ReviewsTab myReviews={myReviews} />
)}
              {activeTab === 'notifications' && <NotificationsTab />}
              {activeTab === 'settings' && (
                <SettingsTab toggles={toggles} setToggles={setToggles} onDeleteAccount={() => setDeleteAccountOpen(true)} />
              )}
            </div>
          )}
        </main>
      </div>
{reviewTarget && (
  <Modal
    onClose={() => {
      if (!reviewSubmitting) {
        setReviewTarget(null);
        setReviewError('');
      }
    }}
  >
    <h3 className="rh-heading text-lg font-bold mb-2">
      Write a Review
    </h3>

    <p className="text-sm text-slate-500 mb-4">
      {reviewTarget.equipmentTitle || 'Rental equipment'}
    </p>

    {reviewError && (
      <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
        {reviewError}
      </div>
    )}

    <form onSubmit={handleSubmitReview}>
      <label className="block text-sm font-medium mb-2">
        Rating
      </label>

      <div className="flex gap-2 mb-5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setReviewRating(star)}
            disabled={reviewSubmitting}
            aria-label={`${star} sao`}
            className="text-3xl"
            style={{
              color: star <= reviewRating ? '#F59E0B' : '#D1D5DB',
            }}
          >
            ★
          </button>
        ))}
      </div>

      <label className="block text-sm font-medium mb-2">
        Comment (optional)
      </label>

      <textarea
        value={reviewComment}
        onChange={(e) => setReviewComment(e.target.value)}
        maxLength={2000}
        rows={4}
        placeholder="Share your experience..."
        disabled={reviewSubmitting}
        className="w-full rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-blue-500"
      />

      <div className="flex gap-3 mt-5">
        <button
          type="button"
          onClick={() => setReviewTarget(null)}
          disabled={reviewSubmitting}
          className="rh-btn-outline flex-1 py-2.5 text-sm"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={reviewSubmitting}
          className="rh-btn-primary flex-1 py-2.5 text-sm disabled:opacity-50"
        >
          {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
        </button>
      </div>
    </form>
  </Modal>
)}
      {/* ---------------- EDIT PROFILE MODAL ---------------- */}
      {editOpen && (
        <Modal onClose={() => !saving && setEditOpen(false)}>
          <h3 className="rh-heading text-lg font-bold mb-4" style={{ color: '#0F1B3D' }}>Edit Profile</h3>
          {saveSuccess ? (
            <div className="py-8 text-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: '#ECFDF3' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.4"><path d="M20 6L9 17l-5-5" /></svg>
              </div>
              <p className="font-semibold text-sm" style={{ color: '#111827' }}>Profile updated successfully!</p>
            </div>
          ) : (
            <form onSubmit={handleSaveProfile}>
              {formErrors.submit && (
                <div className="mb-4 px-3.5 py-2.5 rounded-lg text-sm" style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FEE2E2' }}>
                  {formErrors.submit}
                </div>
              )}
              <div className="flex items-center gap-4 mb-5">
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-lg font-semibold" style={{ background: '#1E3A8A' }}>{initials}</div>
                <button type="button" className="rh-btn-outline px-4 py-2 text-xs">Change Photo</button>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <Field label="First name" error={formErrors.firstName}>
                  <input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
                </Field>
                <Field label="Last name" error={formErrors.lastName}>
                  <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
                </Field>
              </div>
              <Field label="Email" error={formErrors.email}>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </Field>
              <Field label="Phone number" error={formErrors.phoneNumber}>
                <input value={form.phoneNumber} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} />
              </Field>
              <Field label="Location">
                <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              </Field>
              <div className="flex gap-3 mt-5">
                <button type="button" onClick={() => setEditOpen(false)} className="rh-btn-outline flex-1 py-2.5 text-sm" disabled={saving}>Cancel</button>
                <button type="submit" disabled={saving} className="rh-btn-primary flex-1 py-2.5 text-sm">{saving ? 'Saving...' : 'Save Changes'}</button>
              </div>
            </form>
          )}
        </Modal>
      )}
  
      {/* ---------------- DELETE EQUIPMENT CONFIRM ---------------- */}
      {deleteTarget && (
        <Modal onClose={() => setDeleteTarget(null)}>
          <h3 className="rh-heading text-lg font-bold mb-2" style={{ color: '#0F1B3D' }}>Delete "{deleteTarget.name}"?</h3>
          <p className="text-sm mb-6" style={{ color: '#6B7280' }}>This will permanently remove the listing. This action cannot be undone.</p>
          <div className="flex gap-3">
            <button onClick={() => setDeleteTarget(null)} className="rh-btn-outline flex-1 py-2.5 text-sm">Cancel</button>
            <button onClick={confirmDeleteEquipment} className="flex-1 py-2.5 text-sm font-semibold rounded-lg text-white" style={{ background: '#DC2626' }}>Delete</button>
          </div>
        </Modal>
      )}
      {paymentTarget && (
  <Modal
    onClose={() => !paymentLoading && setPaymentTarget(null)}
  >
    <h3
      className="rh-heading text-lg font-bold mb-2"
      style={{ color: '#0F1B3D' }}
    >
      Confirm Payment
    </h3>

    <p
      className="text-sm mb-5"
      style={{ color: '#6B7280' }}
    >
      Please confirm your payment for this rental.
    </p>

    <div className="rounded-xl bg-slate-50 p-4 mb-5">
      <div className="flex justify-between gap-4 text-sm">
        <span className="text-slate-500">
          Equipment
        </span>

        <span className="font-semibold text-slate-900 text-right">
          {paymentTarget.booking.equipment?.title ||
            'Rental equipment'}
        </span>
      </div>

      <div className="flex justify-between gap-4 text-sm mt-3">
        <span className="text-slate-500">
          Rental days
        </span>

        <span className="font-semibold text-slate-900">
          {paymentTarget.booking.totalDays ?? 0}
        </span>
      </div>

      <div className="flex justify-between gap-4 text-sm mt-3">
        <span className="text-slate-500">
          Total
        </span>

        <span className="font-bold text-slate-900">
          {formatVnd(paymentTarget.booking.totalAmount)}
        </span>
      </div>
    </div>

    <div className="flex gap-3">
      <button
        type="button"
        onClick={() => setPaymentTarget(null)}
        disabled={paymentLoading}
        className="rh-btn-outline flex-1 py-2.5 text-sm"
      >
        Cancel
      </button>

     <button
  type="button"
  onClick={async () => {
    try {
      setPaymentLoading(true);

      const paymentId = paymentTarget.payment?.id;

      if (!paymentId) {
        alert('Payment information is missing.');
        return;
      }

      const response =
        await paymentService.mockPay(paymentId);

      console.log(
        'Payment completed successfully:',
        response.data
      );

      alert('Payment completed successfully.');

      setPaymentTarget(null);

    } catch (error) {
      console.error(
        'Failed to complete payment:',
        error
      );

      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Failed to complete payment.';

      alert(message);

    } finally {
      setPaymentLoading(false);
    }
  }}
  disabled={paymentLoading}
  className="rh-btn-primary flex-1 py-2.5 text-sm disabled:opacity-50"
>
  {paymentLoading ? 'Processing...' : 'Confirm Payment'}
</button>
    </div>
  </Modal>
)}

{cancelBookingTarget && (
  <Modal onClose={() => !cancelBookingLoading && setCancelBookingTarget(null)}>
    <h3
      className="rh-heading text-lg font-bold mb-2"
      style={{ color: '#0F1B3D' }}
    >
      Cancel Rental?
    </h3>

    <p className="text-sm mb-5" style={{ color: '#6B7280' }}>
      Are you sure you want to cancel this rental?
    </p>

    <div className="flex gap-3">
      <button
        type="button"
        onClick={() => setCancelBookingTarget(null)}
        disabled={cancelBookingLoading}
        className="rh-btn-outline flex-1 py-2.5 text-sm"
      >
        Keep Rental
      </button>

      <button
        type="button"
        onClick={() =>
          handleCancelBooking(cancelBookingTarget.id)
        }
        disabled={cancelBookingLoading}
        className="flex-1 py-2.5 text-sm font-semibold rounded-lg text-white disabled:opacity-50"
        style={{ background: '#DC2626' }}
      >
        {cancelBookingLoading ? 'Cancelling...' : 'Cancel Rental'}
      </button>
    </div>
  </Modal>
)}
      {/* ---------------- DELETE ACCOUNT CONFIRM ---------------- */}
      {deleteAccountOpen && (
        <Modal onClose={() => { setDeleteAccountOpen(false); setDeleteConfirmText(''); }}>
          <h3 className="rh-heading text-lg font-bold mb-2" style={{ color: '#DC2626' }}>Delete your account?</h3>
          <p className="text-sm mb-4" style={{ color: '#6B7280' }}>This will permanently delete your profile, listings and rental history. Type <strong>DELETE</strong> to confirm.</p>
          <div className="rh-input px-3 mb-5"><input value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} placeholder="DELETE" /></div>
          <div className="flex gap-3">
            <button onClick={() => { setDeleteAccountOpen(false); setDeleteConfirmText(''); }} className="rh-btn-outline flex-1 py-2.5 text-sm">Cancel</button>
            <button
              disabled={deleteConfirmText !== 'DELETE'}
              className="flex-1 py-2.5 text-sm font-semibold rounded-lg text-white disabled:opacity-50"
              style={{ background: '#DC2626' }}
            >
              Delete Account
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Shared bits                                                         */
/* ------------------------------------------------------------------ */

function Modal({ children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(15,27,61,0.45)' }} onClick={onClose}>
      <div className="rh-card w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>
  );
}

function Field({ label, error, children }) {
  const { t } = usePreferences();
  return (
    <div className="mb-3">
      <label className="block text-xs font-medium mb-1.5" style={{ color: '#374151' }}>{t(label)}</label>
      <div className={`rh-input px-3 ${error ? 'rh-err' : ''}`}>{children}</div>
      {error && <p className="text-xs mt-1" style={{ color: '#DC2626' }}>{error}</p>}
    </div>
  );
}

function SectionHeading({ title, subtitle, action }) {
  const { t } = usePreferences();
  return (
    <div className="flex items-start justify-between flex-wrap gap-3 mb-5">
      <div>
        <h2 className="rh-heading text-lg font-bold" style={{ color: '#0F1B3D' }}>{t(title)}</h2>
        {subtitle && <p className="text-sm mt-1" style={{ color: '#6B7280' }}>{t(subtitle)}</p>}
      </div>
      {action}
    </div>
  );
}

function EmptyState({ icon, text, ctaLabel, ctaTo }) {
  return (
    <div className="rh-card p-12 text-center">
      <div className="text-4xl mb-3">{icon}</div>
      <p className="text-sm font-medium mb-5" style={{ color: '#374151' }}>{text}</p>
      <Link to={ctaTo} className="rh-btn-primary inline-block px-5 py-2.5 text-sm">{ctaLabel}</Link>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Tabs                                                                 */
/* ------------------------------------------------------------------ */

function ProfileTab({ displayUser, initials, setEditOpen }) {
  return (
    <div>
      {/* Profile header */}
      <div className="rh-card p-6 sm:p-8 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-semibold shrink-0" style={{ background: '#1E3A8A' }}>
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="rh-heading text-xl font-extrabold" style={{ color: '#0F1B3D' }}>{displayUser.firstName} {displayUser.lastName}</h1>
              {USER.verified && (
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: '#ECFDF3', color: '#16A34A' }}>
                  <Icon.shield /> Verified User
                </span>
              )}
            </div>
            <p className="text-sm mt-1" style={{ color: '#6B7280' }}>{displayUser.email}</p>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm" style={{ color: '#6B7280' }}>
              <span className="flex items-center gap-1"><Icon.pin /> {displayUser.location || 'Not provided'}</span>
              <span>Member since {USER.memberSince}</span>
              <span className="flex items-center gap-1.5"><Stars value={USER.rating} /> {USER.rating} ({USER.reviewCount} reviews)</span>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={() => setEditOpen(true)} className="rh-btn-primary px-4 py-2.5 text-sm">Edit Profile</button>
            <button className="rh-btn-outline px-4 py-2.5 text-sm">Share Profile</button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          [USER.totalRentals, 'Rentals'], [USER.equipmentListed, 'Equipment Listed'],
          [USER.reviewCount, 'Reviews'], [USER.rating, 'Average Rating'],
        ].map(([value, label]) => (
          <div key={label} className="rh-card p-5 text-center">
            <p className="rh-heading text-2xl font-extrabold" style={{ color: '#2F5FE0' }}>{value}</p>
            <p className="text-xs mt-1" style={{ color: '#6B7280' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Personal information */}
      <div className="rh-card p-6 mb-6">
        <SectionHeading title="Personal Information" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-sm">
          {[
            ['First Name', displayUser.firstName], ['Last Name', displayUser.lastName], ['Email', displayUser.email],
            ['Phone Number', displayUser.phoneNumber || 'Not provided'], ['Location', displayUser.location || 'Not provided'], ['Date of Birth', USER.dob],
          ].map(([label, value]) => (
            <div key={label}>
              <p style={{ color: '#9CA3AF' }}>{label}</p>
              <p className="font-medium mt-0.5" style={{ color: '#111827' }}>{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Account verification */}
      <div className="rh-card p-6">
        <SectionHeading title="Account Verification" />
        <div className="space-y-3">
          {[['Email', true], ['Phone Number', true], ['Identity', false]].map(([label, verified]) => (
            <div key={label} className="flex items-center justify-between text-sm py-2 border-b last:border-b-0" style={{ borderColor: '#EEF0F3' }}>
              <span style={{ color: '#374151' }}>{label}</span>
              {verified ? (
                <span className="flex items-center gap-1.5 font-medium" style={{ color: '#16A34A' }}><span className="w-2 h-2 rounded-full" style={{ background: '#16A34A' }} /> Verified</span>
              ) : (
                <span className="flex items-center gap-1.5 font-medium" style={{ color: '#A16207' }}><span className="w-2 h-2 rounded-full" style={{ background: '#F59E0B' }} /> Not verified</span>
              )}
            </div>
          ))}
        </div>
        <button className="rh-btn-primary mt-4 px-5 py-2.5 text-sm">Verify Identity</button>
      </div>
    </div>
  );
}

function RentalsTab({
  historyFilter,
  setHistoryFilter,
  filteredHistory,
  bookings,
  loading,
  onCancel,
  onPay,
  myReviews,
  onReview,
}) {
  if (loading) {
  return (
    <div className="py-10 text-center text-slate-500">
      Loading your rentals...
    </div>
  );
}

if (bookings.length === 0) {
  return (

<EmptyState
  icon="📦"
  text="You have not rented any equipment yet."
  ctaLabel="Browse Equipment"
  ctaTo="/browse"
/>

  );
}
  return (
    <div>
      <SectionHeading title="My Rentals" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {bookings.map((booking) => {
  const equipmentName =
  booking.equipmentTitle || 'Unknown equipment';

  const startDate = booking.startDate
    ? new Date(booking.startDate).toLocaleDateString('en-GB')
    : '-';

  const endDate = booking.endDate
    ? new Date(booking.endDate).toLocaleDateString('en-GB')
    : '-';

  const status = booking.status || 'PENDING';
  const paymentStatus =
  booking.payment?.status || 'UNPAID';
  return (
    <div
      key={booking.id}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold text-slate-900">
            {equipmentName}
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Rental period: {startDate} – {endDate}
          </p>
        </div>

        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
          {status}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-slate-500">Price / day</p>
          <p className="font-medium text-slate-900">
            {formatVnd(booking.pricePerDay)}
          </p>
        </div>

        <div>
          <p className="text-slate-500">Total</p>
          <p className="font-medium text-slate-900">
            {formatVnd(booking.totalAmount)}
          </p>
        </div>
      </div>

     <div className="mt-4 border-t border-slate-100 pt-4 text-sm">
  <div className="flex items-center justify-between">
    <span className="text-slate-500">
      Rental days
    </span>

    <span className="font-medium text-slate-900">
      {booking.totalDays ?? 0}
    </span>
  </div>

  <div className="flex items-center justify-between mt-3">
    <span className="text-slate-500">
      Payment
    </span>

    {paymentStatus === 'PAID' ? (
      <span className="font-semibold text-green-600">
        ✓ Paid
      </span>
    ) : (
      <span className="font-semibold text-amber-600">
        {paymentStatus}
      </span>
    )}
  </div>
</div>
  <Link
  to={`/rental-detail?bookingId=${booking.id}`}
  className="mt-4 block w-full rounded-lg border border-slate-200 py-2.5 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
>
  View Details
</Link>

{status === 'COMPLETED' &&
  !myReviews.some(
    (review) => review.bookingId === booking.id
  ) && (
    <button
      type="button"
      onClick={() => onReview(booking)}
      className="rh-btn-primary w-full mt-4 py-2.5 text-sm"
    >
      Write a Review
    </button>
  )}

{status === 'APPROVED' && paymentStatus !== 'PAID' && (
  <button
    type="button"
    onClick={() => onPay(booking)}
    className="rh-btn-primary w-full mt-4 py-2.5 text-sm"
  >
  

    Pay Now
  </button>
)}


{['PENDING', 'APPROVED'].includes(status) && (
  <button
    type="button"
   onClick={() => onCancel(booking)}
    className="rh-btn-danger w-full mt-4 py-2.5 text-sm"
  >
    Cancel Rental
  </button>
)}
    </div>
  );
})}
      </div>

      <div className="mt-10">
        <SectionHeading
          title="Rental History"
          action={
            <div className="flex gap-2 text-xs font-medium flex-wrap">
              {['All', 'Pending', 'Confirmed', 'Completed', 'Cancelled'].map((f) => (
                <button
                  key={f}
                  onClick={() => setHistoryFilter(f)}
                  className="px-3 py-1.5 rounded-full border"
                  style={{
                    borderColor: historyFilter === f ? '#2F5FE0' : '#E5E7EB',
                    background: historyFilter === f ? 'rgba(47,95,224,0.08)' : 'transparent',
                    color: historyFilter === f ? '#2F5FE0' : '#374151',
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
          }
        />
        {filteredHistory.length === 0 ? (
          <div className="rh-card p-8 text-center text-sm" style={{ color: '#6B7280' }}>No rentals with status "{historyFilter}".</div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block rh-card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left" style={{ background: '#F7F9FC', color: '#6B7280' }}>
                    <th className="px-5 py-3 font-medium">Equipment</th>
                    <th className="px-5 py-3 font-medium">Rental Period</th>
                    <th className="px-5 py-3 font-medium">Total</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.map((r) => (
                    <tr key={r.id} className="border-t" style={{ borderColor: '#EEF0F3' }}>
                      <td className="px-5 py-3 font-medium" style={{ color: '#111827' }}>{r.name}</td>
                      <td className="px-5 py-3" style={{ color: '#6B7280' }}>{r.period}</td>
                      <td className="px-5 py-3" style={{ color: '#111827' }}>{formatVnd(r.total)}</td>
                      <td className="px-5 py-3"><StatusBadge status={r.status} /></td>
                      <td className="px-5 py-3"><button className="font-semibold hover:underline" style={{ color: '#2F5FE0' }}>View</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Mobile cards */}
            <div className="sm:hidden space-y-3">
              {filteredHistory.map((r) => (
                <div key={r.id} className="rh-card p-4">
                  <div className="flex items-start justify-between"><p className="font-semibold text-sm" style={{ color: '#111827' }}>{r.name}</p><StatusBadge status={r.status} /></div>
                  <p className="text-xs mt-1" style={{ color: '#6B7280' }}>{r.period}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm font-bold" style={{ color: '#0F1B3D' }}>{formatVnd(r.total)}</span>
                    <button className="text-sm font-semibold" style={{ color: '#2F5FE0' }}>View</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function EquipmentTab({ equipment, onDelete }) {
  return (
    <div>
      <SectionHeading
        title="My Equipment"
        subtitle="Manage the equipment you're currently renting out."
        action={<Link to="/list-equipment" className="rh-btn-primary px-4 py-2.5 text-sm">+ List New Equipment</Link>}
      />
      {equipment.length === 0 ? (
        <EmptyState icon="🧰" text="You haven't listed any equipment yet." ctaLabel="List Your Equipment" ctaTo="/list-equipment" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {equipment.map((e) => (
            <div key={e.id} className="rh-card p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ background: '#F7F9FC' }}>{e.icon}</div>
                <StatusBadge status={e.status} />
              </div>
              <p className="font-semibold text-sm" style={{ color: '#111827' }}>{e.name}</p>
              <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>{e.category} · {formatVnd(e.price)}/day</p>
              <div className="flex items-center gap-4 mt-3 text-xs" style={{ color: '#6B7280' }}>
                <span>{e.views} views</span><span>{e.rentals} rentals</span>
              </div>
              <div className="flex gap-2 mt-4">
                <Link to={`/equipment/${e.id}`} className="rh-btn-outline flex-1 py-2 text-xs text-center">View</Link>
                <button className="rh-btn-outline flex-1 py-2 text-xs">Edit</button>
                <button onClick={() => onDelete(e)} className="rh-btn-danger px-3 py-2 text-xs flex items-center justify-center"><Icon.trash /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FavoritesTab({ favorites, onToggle }) {
  return (
    <div>
      <SectionHeading title="Favorite Equipment" />
      {favorites.length === 0 ? (
        <EmptyState icon="💙" text="No favorite equipment yet." ctaLabel="Browse Equipment" ctaTo="/browse" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {favorites.map((f) => (
            <div key={f.id} className="rh-card rh-card-hover overflow-hidden">
              <div className="relative h-32 flex items-center justify-center text-4xl" style={{ background: '#F7F9FC' }}>
                {f.icon}
                <button onClick={() => onToggle(f.id)} className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white flex items-center justify-center" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }} aria-label="Remove favorite">
                  <Icon.heart filled />
                </button>
              </div>
              <div className="p-4">
                <p className="text-sm font-semibold" style={{ color: '#111827' }}>{f.name}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm font-bold" style={{ color: '#0F1B3D' }}>{formatVnd(f.price)}<span className="text-xs font-normal" style={{ color: '#9CA3AF' }}>/day</span></span>
                  <span className="flex items-center gap-1 text-xs" style={{ color: '#6B7280' }}><Icon.star /> {f.rating}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


function ReviewsTab({ myReviews = [] }) {
  return (
    <div>
      <SectionHeading title="My Reviews" />

      {myReviews.length === 0 ? (
        <div className="rh-card p-8 text-center">
          <p className="text-sm text-slate-500">
            You haven't written any reviews yet.
          </p>
        </div>
      ) : (
        <div className="space-y-4 mb-10">
          {myReviews.map((review) => (
            <div key={review.id} className="rh-card p-5">
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-sm text-slate-900">
                  {review.equipmentTitle || 'Rental equipment'}
                </p>
                <span className="text-xs text-slate-500">
                  {review.createdAt
                    ? new Date(review.createdAt).toLocaleDateString('vi-VN')
                    : ''}
                </span>
              </div>

              <div className="mt-2">
                <Stars value={review.rating || 0} />
              </div>

              <p className="text-sm mt-2 text-slate-700 whitespace-pre-wrap">
                {review.comment || 'No comment provided.'}
              </p>
            </div>
          ))}
        </div>
      )}

      <SectionHeading title="Reviews About Me" />
      <div className="rh-card p-6">
        <p className="text-sm text-slate-500">
          Reviews about you have not been connected to the backend yet.
        </p>
      </div>
    </div>
  );
}

function NotificationsTab() {
  return (
    <div>
      <SectionHeading title="Notifications" />
      <div className="rh-card divide-y" style={{ borderColor: '#EEF0F3' }}>
        {NOTIFICATIONS.map((n) => (
          <div key={n.id} className="flex items-start gap-3 p-5" style={{ borderColor: '#EEF0F3' }}>
            <span className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0" style={{ background: n.color }} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold" style={{ color: '#111827' }}>{n.title}</p>
              <p className="text-sm mt-0.5" style={{ color: '#6B7280' }}>{n.text}</p>
              <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>{n.time}</p>
            </div>
          </div>
        ))}
      </div>
      <button className="rh-btn-outline mt-4 px-5 py-2.5 text-sm">View All Notifications</button>
    </div>
  );
}

function SettingsTab({ toggles, setToggles, onDeleteAccount }) {
  const set = (key) => (val) => setToggles((t) => ({ ...t, [key]: val }));
  return (
    <div>
      <SectionHeading title="Account Settings" />

      <div className="rh-card p-6 mb-5">
        <h3 className="font-semibold text-sm mb-4" style={{ color: '#111827' }}>Account</h3>
        {['Change Email', 'Phone Number'].map((label) => (
          <div key={label} className="flex items-center justify-between text-sm py-2.5 border-b" style={{ borderColor: '#EEF0F3' }}>
            <span style={{ color: '#374151' }}>{label}</span>
            <button className="font-semibold" style={{ color: '#2F5FE0' }}>Edit</button>
          </div>
        ))}
        <div className="flex items-center justify-between text-sm py-2.5">
          <span style={{ color: '#374151' }}>Change Password</span>
          <Link to="/profile/change-password" className="font-semibold" style={{ color: '#2F5FE0' }}>Edit</Link>
        </div>
      </div>

      <div className="rh-card p-6 mb-5">
        <h3 className="font-semibold text-sm mb-4" style={{ color: '#111827' }}>Privacy</h3>
        {[['Profile Visibility', 'profileVisible'], ['Show Location', 'showLocation'], ['Show Rental History', 'showHistory']].map(([label, key]) => (
          <div key={key} className="flex items-center justify-between text-sm py-2.5 border-b last:border-b-0" style={{ borderColor: '#EEF0F3' }}>
            <span style={{ color: '#374151' }}>{label}</span>
            <Toggle checked={toggles[key]} onChange={set(key)} />
          </div>
        ))}
      </div>

      <div className="rh-card p-6 mb-5">
        <h3 className="font-semibold text-sm mb-4" style={{ color: '#111827' }}>Notifications</h3>
        {[['Email Notifications', 'emailNotif'], ['Rental Updates', 'rentalUpdates'], ['Messages', 'messages'], ['Promotions', 'promotions']].map(([label, key]) => (
          <div key={key} className="flex items-center justify-between text-sm py-2.5 border-b last:border-b-0" style={{ borderColor: '#EEF0F3' }}>
            <span style={{ color: '#374151' }}>{label}</span>
            <Toggle checked={toggles[key]} onChange={set(key)} />
          </div>
        ))}
      </div>

      <div className="rh-card p-6 mb-5">
        <h3 className="font-semibold text-sm mb-4" style={{ color: '#111827' }}>Security</h3>
        <div className="flex items-center justify-between text-sm py-2.5 border-b" style={{ borderColor: '#EEF0F3' }}>
          <span style={{ color: '#374151' }}>Two-Factor Authentication</span>
          <Toggle checked={toggles.twoFactor} onChange={set('twoFactor')} />
        </div>
        <div className="flex items-center justify-between text-sm py-2.5">
          <span style={{ color: '#374151' }}>Active Sessions</span>
          <button className="font-semibold" style={{ color: '#2F5FE0' }}>Manage</button>
        </div>
      </div>

      <div className="rh-card p-6" style={{ borderColor: '#FCA5A5' }}>
        <h3 className="font-semibold text-sm mb-1.5" style={{ color: '#DC2626' }}>Danger Zone</h3>
        <p className="text-xs mb-4" style={{ color: '#6B7280' }}>Deleting your account is permanent and cannot be undone.</p>
        <button onClick={onDeleteAccount} className="rh-btn-danger px-5 py-2.5 text-sm">Delete Account</button>
      </div>
    </div>
  );
}

function BookingRequestsTab({
  bookings,
  loading,
  onApprove,
  onReject,
  onStart,
  onComplete,
}) {
  return (
    <div>
      <SectionHeading
        title="Booking Requests"
        subtitle="Review rental requests from customers for your equipment."
      />

      {loading ? (
        <div className="rh-card p-8 text-center">
          <p className="text-sm" style={{ color: '#6B7280' }}>
            Loading booking requests...
          </p>
        </div>
      ) : bookings.length === 0 ? (
        <EmptyState
          icon="📋"
          text="You don't have any booking requests yet."
          ctaLabel="View My Equipment"
          ctaTo="/profile"
        />
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div key={booking.id} className="rh-card p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p
                    className="font-semibold text-sm"
                    style={{ color: '#111827' }}
                  >
                    {booking.equipmentTitle || booking.equipment?.title || 'Equipment'}
                  </p>

                  <p
                    className="text-xs mt-1"
                    style={{ color: '#6B7280' }}
                  >
                    Renter: {booking.renterName || [booking.renter?.firstName, booking.renter?.lastName].filter(Boolean).join(' ') || 'Unknown'}
                  </p>
                </div>

                <StatusBadge
                  status={
                    booking.status === 'APPROVED'
                      ? 'Confirmed'
                      : booking.status === 'PENDING'
                        ? 'Pending'
                        : booking.status === 'CANCELLED'
                          ? 'Cancelled'
                          : booking.status
                  }
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 text-sm">
                <div>
                  <p
                    className="text-xs"
                    style={{ color: '#9CA3AF' }}
                  >
                    Rental Period
                  </p>

                  <p
                    className="font-medium mt-1"
                    style={{ color: '#111827' }}
                  >
                    {booking.startDate} → {booking.endDate}
                  </p>
                </div>

                <div>
                  <p
                    className="text-xs"
                    style={{ color: '#9CA3AF' }}
                  >
                    Total
                  </p>

                  <p
                    className="font-bold mt-1"
                    style={{ color: '#0F1B3D' }}
                  >
                    {formatVnd(booking.totalAmount)}
                  </p>
                </div>

                <div>
                  <p
                    className="text-xs"
                    style={{ color: '#9CA3AF' }}
                  >
                    Deposit
                  </p>

                  <p
                    className="font-medium mt-1"
                    style={{ color: '#111827' }}
                  >
                    {formatVnd(booking.depositAmount)}
                  </p>
                </div>
              </div>

              {booking.renterNote && (
                <div
                  className="mt-4 p-3 rounded-lg"
                  style={{ background: '#F7F9FC' }}
                >
                  <p
                    className="text-xs"
                    style={{ color: '#9CA3AF' }}
                  >
                    Renter note
                  </p>

                  <p
                    className="text-sm mt-1"
                    style={{ color: '#374151' }}
                  >
                    {booking.renterNote}
                  </p>
              </div>
)}

{booking.status === 'PENDING' && (
  <div className="flex gap-2 mt-4">
    <button
      type="button"
      onClick={() => onApprove(booking.id)}
    >
      Approve
    </button>

    <button
      type="button"
      onClick={() => onReject(booking.id)}
    >
      Reject
    </button>
  </div>
)}

{booking.status === 'APPROVED' && (
  <div className="flex gap-2 mt-4">
    <button
      type="button"
      onClick={() => onStart(booking.id)}
      className="rh-btn-primary px-4 py-2.5 text-sm"
    >
      Start Rental
    </button>
  </div>
)}
{booking.status === 'IN_PROGRESS' && (
  <div className="flex gap-2 mt-4">
    <button
      type="button"
      onClick={() => onComplete(booking.id)}
      className="rh-btn-primary px-4 py-2.5 text-sm"
    >
      Complete Rental
    </button>
  </div>
)}

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
