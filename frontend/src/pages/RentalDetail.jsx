import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import bookingService from '../services/bookingService';
import paymentService from '../services/paymentService';
import { formatVnd } from '../utils/currency';
import { usePreferences } from '../context/preferences';

function formatDate(date) {
  if (!date) return '-';

  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatMoney(value) {
  return formatVnd(value);
}

function StatusBadge({ status }) {
  const styles = {
    PENDING: 'bg-amber-50 text-amber-700',
    APPROVED: 'bg-blue-50 text-blue-700',
    REJECTED: 'bg-red-50 text-red-700',
    CANCELLED: 'bg-slate-100 text-slate-600',
    IN_PROGRESS: 'bg-purple-50 text-purple-700',
    COMPLETED: 'bg-green-50 text-green-700',
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${styles[status] || 'bg-slate-100 text-slate-700'
        }`}
    >
      {status || 'UNKNOWN'}
    </span>
  );
}

export default function RentalDetail() {
  const { t } = usePreferences();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const bookingId = searchParams.get('bookingId');

  const [booking, setBooking] = useState(null);
  const [payment, setPayment] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const loadRentalDetail = async () => {
      if (!bookingId) {
        setError('Booking ID is missing.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');

        const [bookingsResponse, paymentsResponse] =
          await Promise.all([
            bookingService.getMyBookings(),
            paymentService.getMyPayments(),
          ]);

        if (cancelled) return;

        const bookings = Array.isArray(bookingsResponse.data)
          ? bookingsResponse.data
          : [];

        const payments = Array.isArray(paymentsResponse.data)
          ? paymentsResponse.data
          : [];

        const currentBooking = bookings.find(
          (item) => item.id === bookingId
        );

        if (!currentBooking) {
          setError('Rental booking not found.');
          return;
        }

        const currentPayment = payments.find(
          (item) =>
            item.bookingId === bookingId ||
            item.booking?.id === bookingId
        );

        setBooking(currentBooking);
        setPayment(currentPayment || null);
      } catch (err) {
        console.error('Failed to load rental detail:', err);

        const message =
          err.response?.data?.message ||
          err.response?.data?.error ||
          'Failed to load rental details.';

        if (!cancelled) {
          setError(message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadRentalDetail();

    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-5xl px-4 py-10">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
            <p className="text-slate-500">
              Loading rental details...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-5xl px-4 py-10">
          <div className="rounded-2xl border border-red-200 bg-white p-8 text-center">
            <h1 className="text-xl font-bold text-slate-900">
              {t('Unable to load rental')}
            </h1>

            <p className="mt-2 text-sm text-red-600">
              {error || t('Rental booking not found.')}
            </p>

            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="rh-btn-primary mt-6 px-5 py-2.5 text-sm"
            >
              {t('Back to My Rentals')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const paymentStatus = payment?.status || 'UNPAID';

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">

        {/* Back */}
        <div className="mb-6">
          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            ← {t('Back to My Rentals')}
          </button>
        </div>

        {/* Header */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                {t('Rental Detail')}
              </p>

              <h1 className="mt-1 text-2xl font-bold text-slate-900">
                {booking.equipmentTitle || 'Unknown equipment'}
              </h1>

              {booking.equipmentImageUrl ? (
                <img
                  src={booking.equipmentImageUrl}
                  alt={booking.equipmentTitle || 'Rental equipment'}
                  className="mt-4 h-56 w-full max-w-xl rounded-xl object-cover"
                  onError={(event) => {
                    event.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div className="mt-4 flex h-56 w-full max-w-xl items-center justify-center rounded-xl bg-slate-100 text-sm text-slate-500">
                  {t('No equipment image')}
                </div>
              )}

              <p className="mt-2 break-all text-xs text-slate-400">
                Booking ID: {booking.id}
              </p>
            </div>

            <StatusBadge status={booking.status} />
          </div>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

          {/* Rental information */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

              <h2 className="text-lg font-bold text-slate-900">
                {t('Rental Information')}
              </h2>

              <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">

                <div>
                  <p className="text-sm text-slate-500">
                    {t('Start date')}
                  </p>

                  <p className="mt-1 font-semibold text-slate-900">
                    {formatDate(booking.startDate)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">
                    {t('End date')}
                  </p>

                  <p className="mt-1 font-semibold text-slate-900">
                    {formatDate(booking.endDate)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">
                    Rental days
                  </p>

                  <p className="mt-1 font-semibold text-slate-900">
                    {booking.totalDays ?? 0} days
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">
                    Price per day
                  </p>

                  <p className="mt-1 font-semibold text-slate-900">
                    {formatMoney(booking.pricePerDay)}
                  </p>
                </div>

              </div>

              {/* Note */}
              <div className="mt-6 border-t border-slate-100 pt-6">
                <p className="text-sm text-slate-500">
                  Renter note
                </p>

                <p className="mt-2 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
                  {booking.renterNote?.trim()
                    ? booking.renterNote
                    : 'No note provided.'}
                </p>
              </div>

              {/* Rejection reason */}
              {booking.rejectionReason && (
                <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4">
                  <p className="text-sm font-semibold text-red-700">
                    Rejection reason
                  </p>

                  <p className="mt-1 text-sm text-red-600">
                    {booking.rejectionReason}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Payment summary */}
          <div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

              <h2 className="text-lg font-bold text-slate-900">
                Payment Summary
              </h2>

              <div className="mt-6 space-y-4 text-sm">

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">
                    Rental
                  </span>

                  <span className="font-medium text-slate-900">
                    {formatMoney(
                      Number(booking.pricePerDay || 0) *
                      Number(booking.totalDays || 0)
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">
                    Deposit
                  </span>

                  <span className="font-medium text-slate-900">
                    {formatMoney(booking.depositAmount)}
                  </span>
                </div>

                <div className="border-t border-slate-100 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900">
                      Total
                    </span>

                    <span className="text-lg font-bold text-slate-900">
                      {formatMoney(booking.totalAmount)}
                    </span>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">
                      Payment status
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

              </div>

              {/* Pay */}
              {booking.status === 'APPROVED' &&
                paymentStatus !== 'PAID' && (
                  <Link
                    to={`/payment?bookingId=${booking.id}`}
                    className="rh-btn-primary mt-6 block w-full py-2.5 text-center text-sm"
                  >
                    Pay Now
                  </Link>
                )}

              {paymentStatus === 'PAID' && (
                <div className="mt-6 rounded-xl bg-green-50 p-4 text-center">
                  <p className="font-semibold text-green-700">
                    ✓ Payment completed
                  </p>

                  {payment?.transactionId && (
                    <p className="mt-1 break-all text-xs text-green-600">
                      Transaction: {payment.transactionId}
                    </p>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>

        {/* Payment details */}
        {payment && (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <h2 className="text-lg font-bold text-slate-900">
              Payment Details
            </h2>

            <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">

              <div>
                <p className="text-sm text-slate-500">
                  Payment ID
                </p>

                <p className="mt-1 break-all text-xs font-medium text-slate-900">
                  {payment.id}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">
                  Method
                </p>

                <p className="mt-1 font-semibold text-slate-900">
                  {payment.paymentMethod || 'MOCK'}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">
                  Status
                </p>

                <p
                  className={`mt-1 font-semibold ${payment.status === 'PAID'
                      ? 'text-green-600'
                      : 'text-amber-600'
                    }`}
                >
                  {payment.status}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">
                  Transaction ID
                </p>

                <p className="mt-1 break-all text-xs font-medium text-slate-900">
                  {payment.transactionId || '-'}
                </p>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}