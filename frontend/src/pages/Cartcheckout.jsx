import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import bookingService from '../services/bookingService';
import paymentService from '../services/paymentService';
import { formatVnd } from '../utils/currency';
import { usePreferences } from '../context/preferences';

const Icon = {
  check: (p) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" {...p}>
      <path d="M20 6L9 17l-5-5" />
    </svg>
  ),

  checkCircle: (p) => (
    <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}>
      <circle cx="12" cy="12" r="10" />
      <path d="M8 12l3 3 5-6" />
    </svg>
  ),

  xCircle: (p) => (
    <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}>
      <circle cx="12" cy="12" r="10" />
      <path d="M15 9l-6 6M9 9l6 6" />
    </svg>
  ),

  clock: (p) => (
    <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  ),

  spinner: (p) => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" {...p}>
      <circle cx="12" cy="12" r="9" opacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" />
    </svg>
  ),
};

function formatVND(value) {
  return formatVnd(value);
}

function formatDate(value) {
  if (!value) return '—';

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString('vi-VN');
}

export default function CartCheckout() {
  const { t } = usePreferences();
  const [searchParams] = useSearchParams();

  const bookingId = searchParams.get('bookingId');

  const [booking, setBooking] = useState(null);
  const [payment, setPayment] = useState(null);

  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [error, setError] = useState('');

  const [status, setStatus] = useState('idle');
  // idle | processing | paid | pending | failed

  /*
   * Current backend payment implementation supports the MOCK method.
   *
   * IMPORTANT:
   * We intentionally create the payment as PENDING first.
   * The payment becomes PAID only after the backend /mock-pay endpoint
   * is called successfully.
   *
   * Later, this value can be replaced by MOMO / VNPAY / CARD when the
   * real gateway backend is implemented.
   */
  const paymentMethod = 'MOCK';

  const rentalFee = useMemo(() => {
    if (!booking) return 0;

    return Number(booking.pricePerDay || 0) * Number(booking.totalDays || 0);
  }, [booking]);

  const depositAmount = useMemo(() => {
    return Number(booking?.depositAmount || 0);
  }, [booking]);

  const totalAmount = useMemo(() => {
  const rentalAmount = Number(booking?.totalAmount || 0);
  const deposit = Number(booking?.depositAmount || 0);

  return rentalAmount + deposit;
}, [booking]);

  const loadPaymentPage = async () => {
    if (!bookingId) {
      setError('Missing bookingId in the payment URL.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      /*
       * 1. Load the current user's bookings.
       * There is currently no dedicated GET /bookings/{id} endpoint
       * in the frontend service, so we use /bookings/my.
       */
      const bookingResponse = await bookingService.getMyBookings();

      const bookings = Array.isArray(bookingResponse.data)
        ? bookingResponse.data
        : [];

      const currentBooking = bookings.find(
        (item) => item.id === bookingId
      );

      if (!currentBooking) {
        throw new Error('Booking not found.');
      }

      setBooking(currentBooking);

      /*
       * 2. Find an existing payment for this booking.
       *
       * This prevents the page from creating duplicate PENDING payments
       * every time the user opens /payment?bookingId=...
       */
      const paymentsResponse = await paymentService.getMyPayments();

      const payments = Array.isArray(paymentsResponse.data)
        ? paymentsResponse.data
        : [];

      const existingPayment = payments.find(
        (item) =>
          item.bookingId === bookingId ||
          item.booking?.id === bookingId
      );

      if (existingPayment) {
        setPayment(existingPayment);

        if (existingPayment.status === 'PAID') {
          setStatus('paid');
        } else if (existingPayment.status === 'PENDING') {
          setStatus('pending');
        } else {
          setStatus('failed');
        }

        return;
      }

      /*
       * 3. No payment exists yet.
       *
       * Create it in PENDING state.
       * createPayment() must NOT be followed by mockPay() here.
       */
      const createResponse = await paymentService.createPayment({
        bookingId: currentBooking.id,
        amount: currentBooking.totalAmount,
        paymentMethod,
      });

      setPayment(createResponse.data);
      setStatus('pending');
    } catch (err) {
      console.error('Failed to load payment page:', err);

      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Failed to load payment information.';

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPaymentPage();
  }, [bookingId]);

  /*
   * Development/test payment.
   *
   * This is the ONLY place in this page that changes the payment from
   * PENDING -> PAID.
   *
   * For production, replace this call with the real gateway flow:
   *   1. backend creates gateway transaction
   *   2. frontend redirects to MoMo/VNPay
   *   3. gateway returns/calls backend
   *   4. backend verifies the signature
   *   5. backend changes payment to PAID
   *   6. frontend refreshes payment status
   */
  const handleMockPayment = async () => {
    if (!payment?.id || paymentLoading) {
      return;
    }

    try {
      setPaymentLoading(true);
      setError('');
      setStatus('processing');

      const response = await paymentService.mockPay(payment.id);

      const updatedPayment = response.data;

      setPayment(updatedPayment);

      if (updatedPayment?.status === 'PAID') {
        setStatus('paid');
      } else {
        setStatus('pending');
      }
    } catch (err) {
      console.error('Failed to complete mock payment:', err);

      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Payment could not be completed.';

      setError(message);
      setStatus('failed');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleRefreshPayment = async () => {
    if (!payment?.id || paymentLoading) {
      return;
    }

    try {
      setPaymentLoading(true);
      setError('');

      const response = await paymentService.getPayment(payment.id);
      const updatedPayment = response.data;

      setPayment(updatedPayment);

      if (updatedPayment?.status === 'PAID') {
        setStatus('paid');
      } else if (updatedPayment?.status === 'PENDING') {
        setStatus('pending');
      } else {
        setStatus('failed');
      }
    } catch (err) {
      console.error('Failed to refresh payment:', err);

      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Failed to refresh payment status.';

      setError(message);
    } finally {
      setPaymentLoading(false);
    }
  };

  if (loading) {
    return (
      <PageShell>
        <div className="flex flex-col items-center justify-center py-24">
          <Icon.spinner
            className="rh-spin"
            style={{ color: '#2F5FE0' }}
          />
          <p className="text-sm mt-3" style={{ color: '#6B7280' }}>
            Loading payment information...
          </p>
        </div>
      </PageShell>
    );
  }

  if (error && !booking) {
    return (
      <ResultScreen
        icon={<Icon.xCircle />}
        bg="#FEF2F2"
        iconColor="#DC2626"
        title="Unable to Open Payment"
      >
        <p className="text-sm" style={{ color: '#6B7280' }}>
          {error}
        </p>

        <div className="flex gap-3 mt-6 justify-center flex-wrap">
          <Link
            to="/profile"
            className="rh-btn-primary px-5 py-2.5 text-sm"
          >
            Back to My Rentals
          </Link>

          <Link
            to="/browse"
            className="rh-btn-outline px-5 py-2.5 text-sm"
          >
            Browse Equipment
          </Link>
        </div>
      </ResultScreen>
    );
  }

  if (status === 'paid') {
    return (
      <ResultScreen
        icon={<Icon.checkCircle />}
        bg="#ECFDF3"
        iconColor="#16A34A"
        title="Payment Successful"
      >
        <p className="text-sm" style={{ color: '#6B7280' }}>
          Your payment has been confirmed successfully.
        </p>

        <div className="rh-card p-5 mt-6 text-left w-full max-w-md mx-auto">
          <Row
            label="Equipment"
            value={booking?.equipmentTitle || 'Rental equipment'}
          />

          <Row
            label="Rental period"
            value={`${formatDate(booking?.startDate)} – ${formatDate(booking?.endDate)}`}
          />

          <Row
            label="Rental days"
            value={booking?.totalDays ?? 0}
          />

          <Row
            label="Payment ID"
            value={payment?.id || '—'}
          />

          <Row
            label="Total paid"
            value={formatVND(payment?.totalAmount ?? totalAmount)}
            bold
          />

          <Row
            label="Status"
            value="PAID"
            valueClassName="text-green-600"
            bold
          />
        </div>

        <div className="flex gap-3 mt-6 justify-center flex-wrap">
          <Link
            to="/profile"
            className="rh-btn-primary px-5 py-2.5 text-sm"
          >
            View My Rental
          </Link>

          <Link
            to="/"
            className="rh-btn-outline px-5 py-2.5 text-sm"
          >
            Back to Home
          </Link>
        </div>
      </ResultScreen>
    );
  }

  return (
    <PageShell>
      <div className="max-w-6xl mx-auto px-5 lg:px-8 py-8">
        <p className="text-sm mb-5" style={{ color: '#9CA3AF' }}>
          <Link to="/" className="hover:text-[#2F5FE0]">
            Home
          </Link>
          {' / '}
          <Link to="/profile" className="hover:text-[#2F5FE0]">
            My Rentals
          </Link>
          {' / '}
          <span style={{ color: '#374151' }}>{t('Payment')}</span>
        </p>

        <div className="flex items-center gap-2 mb-8">
          <Step number="1" label={t('Booking')} completed />
          <div className="w-10 h-px" style={{ background: '#16A34A' }} />
          <Step number="2" label={t('Payment')} active />
          <div className="w-10 h-px" style={{ background: '#E5E7EB' }} />
          <Step number="3" label={t('Completed')} />
        </div>

        <div className="grid lg:grid-cols-[1fr_360px] gap-6">
          <div className="space-y-6">
            <section className="rh-card p-5 sm:p-6">
              <h1
                className="rh-heading text-xl font-bold"
                style={{ color: '#0F1B3D' }}
              >
                {t('Payment')}
              </h1>

              <p className="text-sm mt-2" style={{ color: '#6B7280' }}>
                {t('Complete the payment for your approved rental booking.')}
              </p>

              <div className="mt-6 rounded-xl p-4" style={{ background: '#F8FAFC' }}>
                <Row
                  label={t('Equipment')}
                  value={booking?.equipmentTitle || t('Rental equipment')}
                />

                <Row
                  label={t('Rental period')}
                  value={`${formatDate(booking?.startDate)} – ${formatDate(booking?.endDate)}`}
                />

                <Row
                  label={t('Rental days')}
                  value={booking?.totalDays ?? 0}
                />

                <Row
                  label={t('Price per day')}
                  value={formatVND(booking?.pricePerDay)}
                />

                <Row
                  label={t('Security deposit')}
                  value={formatVND(depositAmount)}
                />

                <div
                  className="h-px my-4"
                  style={{ background: '#E5E7EB' }}
                />

                <Row
                  label={t('Amount to pay')}
                  value={formatVND(totalAmount)}
                  bold
                />
              </div>
            </section>

            <section className="rh-card p-5 sm:p-6">
              <h2
                className="rh-heading text-base font-bold"
                style={{ color: '#0F1B3D' }}
              >
                {t('Payment Method')}
              </h2>

              <div
                className="mt-4 rounded-xl border p-4"
                style={{
                  borderColor: '#2F5FE0',
                  background: 'rgba(47,95,224,0.04)',
                }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="text-[10px] font-extrabold px-2 py-1 rounded-md text-white"
                    style={{ background: '#374151' }}
                  >
                    TEST
                  </span>

                  <div>
                    <p
                      className="text-sm font-semibold"
                      style={{ color: '#111827' }}
                    >
                      Mock Payment
                    </p>

                    <p
                      className="text-xs mt-1"
                      style={{ color: '#6B7280' }}
                    >
                      Development mode. The payment is created as
                      PENDING first and becomes PAID only after
                      confirmation.
                    </p>
                  </div>
                </div>
              </div>

              <div
                className="rounded-lg p-3.5 mt-4 text-xs"
                style={{
                  background: '#EFF6FF',
                  color: '#374151',
                }}
              >
                <strong>Current development flow:</strong>
                <br />
                Create Payment → PENDING → Confirm Test Payment →
                PAID
              </div>
            </section>

            {error && (
              <div
                className="rounded-lg px-4 py-3 text-sm"
                style={{
                  background: '#FEF2F2',
                  color: '#DC2626',
                  border: '1px solid #FEE2E2',
                }}
              >
                {error}
              </div>
            )}
          </div>

          <div className="lg:sticky lg:top-24 h-fit">
            <div className="rh-card p-5 sm:p-6">
              <h2
                className="rh-heading text-base font-bold"
                style={{ color: '#0F1B3D' }}
              >
                Payment Summary
              </h2>

              <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>
                Booking #{booking?.id}
              </p>

              <div className="space-y-3 mt-5 text-sm">
                <Row
                  label="Rental fee"
                  value={formatVND(rentalFee)}
                />

                <Row
                  label="Security deposit"
                  value={formatVND(depositAmount)}
                />
              </div>

              <div
                className="h-px my-4"
                style={{ background: '#E5E7EB' }}
              />

              <div className="flex items-center justify-between">
                <span
                  className="text-sm font-bold"
                  style={{ color: '#0F1B3D' }}
                >
                  Total
                </span>

                <span
                  className="rh-heading text-xl font-extrabold"
                  style={{ color: '#0F1B3D' }}
                >
                  {formatVND(totalAmount)}
                </span>
              </div>

              <div
                className="rounded-lg p-3.5 mt-4"
                style={{ background: '#F8FAFC' }}
              >
                <p className="text-xs" style={{ color: '#6B7280' }}>
                  Payment status
                </p>

                <p
                  className="text-sm font-bold mt-1"
                  style={{
                    color:
                      status === 'processing'
                        ? '#2F5FE0'
                        : status === 'failed'
                          ? '#DC2626'
                          : '#D97706',
                  }}
                >
                  {status === 'processing'
                    ? 'PROCESSING'
                    : status === 'failed'
                      ? 'FAILED'
                      : payment?.status || 'PENDING'}
                </p>
              </div>

              {status === 'failed' && (
                <button
                  type="button"
                  onClick={handleRefreshPayment}
                  disabled={paymentLoading}
                  className="rh-btn-outline w-full py-3 text-sm mt-5"
                >
                  {paymentLoading ? 'Checking...' : 'Check Payment Status'}
                </button>
              )}

              {status !== 'failed' && (
                <button
                  type="button"
                  onClick={handleMockPayment}
                  disabled={
                    paymentLoading ||
                    !payment?.id ||
                    payment?.status === 'PAID'
                  }
                  className="rh-btn-primary w-full py-3 text-sm mt-5"
                >
                  {paymentLoading && (
                    <Icon.spinner className="rh-spin" />
                  )}

                  {paymentLoading
                    ? 'Processing payment...'
                    : 'Confirm Test Payment'}
                </button>
              )}

              <button
                type="button"
                onClick={handleRefreshPayment}
                disabled={paymentLoading || !payment?.id}
                className="w-full mt-3 py-2 text-xs font-semibold"
                style={{ color: '#2F5FE0' }}
              >
                Refresh payment status
              </button>

              <p
                className="text-xs text-center mt-3"
                style={{ color: '#9CA3AF' }}
              >
                No service fee is charged.
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

function PageShell({ children }) {
  return (
    <div
      className="rh-root min-h-screen"
      style={{ background: '#F8FAFC', color: '#111827' }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800&family=Inter:wght@400;500;600&display=swap');

        .rh-root {
          font-family: 'Inter', sans-serif;
        }

        .rh-heading {
          font-family: 'Plus Jakarta Sans', sans-serif;
        }

        .rh-card {
          border: 1px solid #E5E7EB;
          border-radius: 12px;
          background: #fff;
        }

        .rh-btn-primary {
          background: #2F5FE0;
          color: #fff;
          font-weight: 600;
          border-radius: 10px;
          transition: background .15s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .rh-btn-primary:hover:not(:disabled) {
          background: #24429E;
        }

        .rh-btn-primary:disabled {
          opacity: .55;
          cursor: not-allowed;
        }

        .rh-btn-outline {
          border: 1px solid #E5E7EB;
          color: #374151;
          font-weight: 600;
          border-radius: 10px;
          background: #fff;
          transition: background .15s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .rh-btn-outline:hover:not(:disabled) {
          background: #F9FAFB;
        }

        .rh-btn-outline:disabled {
          opacity: .55;
          cursor: not-allowed;
        }

        .rh-spin {
          animation: rh-spin-anim .8s linear infinite;
        }

        @keyframes rh-spin-anim {
          to {
            transform: rotate(360deg);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .rh-spin {
            animation: none;
          }
        }
      `}</style>

      {children}
    </div>
  );
}

function Step({ number, label, completed, active }) {
  return (
    <div className="flex items-center gap-2 shrink-0">
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
        style={{
          background: completed
            ? '#16A34A'
            : active
              ? '#2F5FE0'
              : '#EEF0F3',
          color: completed || active ? '#fff' : '#9CA3AF',
        }}
      >
        {completed ? <Icon.check /> : number}
      </div>

      <span
        className="text-xs font-medium whitespace-nowrap"
        style={{
          color: active
            ? '#0F1B3D'
            : completed
              ? '#374151'
              : '#9CA3AF',
        }}
      >
        {label}
      </span>
    </div>
  );
}

function Row({
  label,
  value,
  bold = false,
  valueClassName = '',
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span style={{ color: '#6B7280' }}>{label}</span>

      <span
        className={`text-right ${valueClassName}`}
        style={{
          color: valueClassName ? undefined : '#111827',
          fontWeight: bold ? 700 : 500,
        }}
      >
        {value}
      </span>
    </div>
  );
}

function ResultScreen({
  icon,
  bg,
  iconColor,
  title,
  children,
}) {
  return (
    <PageShell>
      <div className="min-h-screen flex items-center justify-center px-5">
        <div className="text-center max-w-md w-full py-10">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{
              background: bg,
              color: iconColor,
            }}
          >
            {icon}
          </div>

          <h1
            className="rh-heading text-2xl font-extrabold"
            style={{ color: '#0F1B3D' }}
          >
            {title}
          </h1>

          <div className="mt-3">{children}</div>
        </div>
      </div>
    </PageShell>
  );
}
