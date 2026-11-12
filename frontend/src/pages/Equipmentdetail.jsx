import React, { useState, useEffect, useMemo } from 'react';
import {
  useParams,
  Link,
  useNavigate,
} from 'react-router-dom';
import axiosClient from '../services/axiosClient';
import bookingService from '../services/bookingService';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { formatVnd } from '../utils/currency';
import { usePreferences } from '../context/preferences';

const CLOUDFRONT_URL = 'https://d1pttsn3tk8w5i.cloudfront.net';
const MINIO_URL = 'http://localhost:9000';

const RULES = [
  'Valid ID required.',
  'Security deposit is required.',
  'Equipment must be returned on time.',
  'User is responsible for damage caused during rental.',
  'No modification or disassembly of equipment.',
  'Late returns may incur additional fees.',
];




/*
|--------------------------------------------------------------------------
| Convert S3 URL -> CloudFront URL
|--------------------------------------------------------------------------
|
| Supported:
|
| https://renthub-dev-assets.s3.ap-southeast-1.amazonaws.com/file.jpg
|
| =>
|
| https://d1pttsn3tk8w5i.cloudfront.net/file.jpg
|
*/
const normalizeImageUrl = (url) => {
  if (!url || typeof url !== 'string') {
    return null;
  }

  const value = url.trim();

  if (!value) {
    return null;
  }

  // Already CloudFront
  if (value.startsWith(CLOUDFRONT_URL)) {
    return value;
  }

  if (value.startsWith(`${MINIO_URL}/`)) {
    return value;
  }

  // S3 virtual-hosted style URL
  const s3Prefix =
    'https://renthub-dev-assets.s3.ap-southeast-1.amazonaws.com/';

  if (value.startsWith(s3Prefix)) {
    const objectKey = value.substring(s3Prefix.length);

    return `${CLOUDFRONT_URL}/${objectKey}`;
  }

  // S3 path style URL
  const s3PathPrefix =
    'https://s3.ap-southeast-1.amazonaws.com/renthub-dev-assets/';

  if (value.startsWith(s3PathPrefix)) {
    const objectKey = value.substring(s3PathPrefix.length);

    return `${CLOUDFRONT_URL}/${objectKey}`;
  }

  // If backend already gives another HTTPS URL,
  // keep it unchanged.
  if (value.startsWith('https://')) {
    return value;
  }

  // If backend only gives object key
  return `${CLOUDFRONT_URL}/${value.replace(/^\/+/, '')}`;
};

const Icon = {
  heart: (p) => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill={p.filled ? '#EF4444' : 'none'}
      stroke={p.filled ? '#EF4444' : '#374151'}
      strokeWidth="1.8"
    >
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
    </svg>
  ),

  star: (p) => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill={p.empty ? '#E5E7EB' : '#F59E0B'}
      stroke={p.empty ? '#E5E7EB' : '#F59E0B'}
    >
      <path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.9L12 17.8 5.8 21l1.2-6.9-5-4.9 6.9-1z" />
    </svg>
  ),

  pin: (p) => (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      {...p}
    >
      <path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 1 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),

  chevronL: (p) => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      {...p}
    >
      <path d="M15 6l-6 6 6 6" />
    </svg>
  ),

  chevronR: (p) => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      {...p}
    >
      <path d="M9 6l6 6-6 6" />
    </svg>
  ),

  zoom: (p) => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      {...p}
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
      <path d="M11 8v6M8 11h6" />
    </svg>
  ),

  check: (p) => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#16A34A"
      strokeWidth="2.2"
      {...p}
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  ),

  shield: (p) => (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#16A34A"
      strokeWidth="2"
      {...p}
    >
      <path d="M12 2l8 4v6c0 5-3.4 8.4-8 10-4.6-1.6-8-5-8-10V6z" />
    </svg>
  ),
};

function Stars({ value }) {
  const rounded = Math.round(Number(value) || 0);

  return (
    <span className="inline-flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Icon.star key={i} empty={i >= rounded} />
      ))}
    </span>
  );
}

export default function EquipmentDetail() {
  const { t } = usePreferences();
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [equipment, setEquipment] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState('');

  const reviewSummary = useMemo(() => {
    const validReviews = Array.isArray(reviews) ? reviews : [];

    const totalReviews = validReviews.length;

    const averageRating =
      totalReviews > 0
        ? validReviews.reduce(
          (sum, review) => sum + Number(review.rating || 0),
          0
        ) / totalReviews
        : 0;

    const ratingBreakdown = [5, 4, 3, 2, 1].map((rating) => ({
      rating,
      count: validReviews.filter(
        (review) => Number(review.rating) === rating
      ).length,
    }));

    return {
      totalReviews,
      averageRating,
      ratingBreakdown,
    };
  }, [reviews]);

  const [mainImg, setMainImg] = useState(0);

  const [imageErrors, setImageErrors] = useState({});

  const [favorite, setFavorite] = useState(false);

  const [expanded, setExpanded] = useState(false);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dateError, setDateError] = useState('');

  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');

  const [availability, setAvailability] = useState(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [unavailableDates, setUnavailableDates] = useState([]);


  const handleRequestToRent = async () => {
    setBookingError('');

    // 1. Kiểm tra đăng nhập
    const token = localStorage.getItem('token');

    if (!token) {
      navigate('/login');
      return;
    }

    // 2. Kiểm tra ngày thuê
    if (!startDate || !endDate) {
      setBookingError('Please select start date and end date.');
      return;
    }

    if (duration <= 0) {
      setBookingError('Please select a valid rental period.');
      return;
    }

    // 3. Kiểm tra thiết bị
    if (!equipment?.id) {
      setBookingError('Equipment information is missing.');
      return;
    }

    try {
      setBookingLoading(true);

      // 4. Kiểm tra lại availability từ backend
      const availabilityResponse =
        await bookingService.checkAvailability(
          equipment.id,
          startDate,
          endDate
        );

      const availability = availabilityResponse.data;

      if (availability?.available !== true) {
        setBookingError(
          'These dates are no longer available. Please select another rental period.'
        );
        return;
      }

      // 5. Chỉ tạo booking nếu khoảng ngày còn trống
      const response = await bookingService.createBooking({
        equipmentId: equipment.id,
        startDate,
        endDate,
        renterNote: '',
      });

      console.log('Booking created successfully:', response.data);

      const blocked = [];
      const cursor = new Date(`${startDate}T00:00:00`);
      const checkout = new Date(`${endDate}T00:00:00`);
      while (cursor < checkout) {
        blocked.push([
          cursor.getFullYear(),
          String(cursor.getMonth() + 1).padStart(2, '0'),
          String(cursor.getDate()).padStart(2, '0'),
        ].join('-'));
        cursor.setDate(cursor.getDate() + 1);
      }
      setUnavailableDates((dates) => [...new Set([...dates, ...blocked])].sort());
      setAvailability(false);

      setBookingError('');
      alert('Rental request sent successfully!');
    } catch (error) {
      console.error('Failed to create booking:', error);

      const backendMessage =
        error.response?.data?.message ||
        error.response?.data?.error;

      let message = 'Không thể gửi yêu cầu thuê. Vui lòng thử lại.';

      if (
        backendMessage?.includes('You cannot book your own equipment')
      ) {
        message = 'Bạn không thể thuê thiết bị do chính mình sở hữu. Vui lòng đăng nhập bằng tài khoản người thuê khác.';
      } else if (backendMessage) {
        message = backendMessage;
      } else if (!error.response) {
        message = 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.';
      }

      setBookingError(message);
    } finally {
      setBookingLoading(false);
    }
  };


  const handleChatWithOwner = async () => {
    try {
      const me = await axiosClient.get('/users/me');

      console.log('CURRENT USER:', me.data);

    } catch (error) {
      console.error(
        'CURRENT USER ERROR:',
        error.response?.status,
        error.response?.data
      );
    }
    if (!equipment) {
      return;
    }

    if (!equipment.owner?.id) {
      console.error('Equipment owner ID is missing');
      return;
    }

    try {
      const response = await axiosClient.post(
        '/conversations',
        {
          userId: equipment.owner.id,
          equipmentId: equipment.id,
        }
      );

      const conversationId = response.data?.id;

      if (!conversationId) {
        console.error(
          'Conversation ID is missing:',
          response.data
        );
        return;
      }

      navigate(
        `/messages?conversationId=${conversationId}`
      );
    } catch (error) {
      console.error(
        'Failed to create/open conversation:',
        error
      );

      console.error(
        'Response:',
        error?.response?.data
      );
    }
  };

  useEffect(() => {
    let cancelled = false;

    const fetchReviews = async () => {
      if (!id) {
        setReviews([]);
        return;
      }

      try {
        setReviewsLoading(true);
        setReviewsError('');

        const response = await axiosClient.get(
          `/reviews/equipment/${id}`
        );

        if (cancelled) return;

        setReviews(
          Array.isArray(response.data) ? response.data : []
        );
      } catch (error) {
        if (cancelled) return;

        console.error('Failed to load equipment reviews:', error);
        setReviews([]);
        setReviewsError('Unable to load reviews. Please try again.');
      } finally {
        if (!cancelled) {
          setReviewsLoading(false);
        }
      }
    };

    fetchReviews();

    return () => {
      cancelled = true;
    };
  }, [id]);

  /*
  |--------------------------------------------------------------------------
  | Fetch equipment
  |--------------------------------------------------------------------------
  */
  useEffect(() => {
    const fetchEquipment = async () => {
      setLoading(true);
      setEquipment(null);
      setMainImg(0);
      setImageErrors({});
      setStartDate('');
      setEndDate('');

      try {
        console.log('Fetching equipment:', id);

        const response = await axiosClient.get(`/equipments/${id}`);
        const item = response.data?.data;

        if (!item || !item.id) {
          throw new Error('Invalid equipment detail response.');
        }

        /*
        |--------------------------------------------------------------------------
        | Extract images
        |--------------------------------------------------------------------------
        */


        // Backend EquipmentResponse trả về imageUrls và coverImageUrl
        const rawImages = [
          item.coverImageUrl,
          ...(Array.isArray(item.imageUrls) ? item.imageUrls : []),
        ].filter(
          (url) => typeof url === 'string' && url.trim() !== ''
        );

        // Chuẩn hóa URL và loại bỏ ảnh trùng lặp
        const imageList = [
          ...new Set(
            rawImages
              .map((url) => normalizeImageUrl(url))
              .filter(Boolean)
          ),
        ];


        console.log('Raw images:', rawImages);
        console.log('Normalized images:', imageList);

        const categoryName =
          item.categoryName ||
          item.category ||
          'Uncategorized';

        const location =
          [item.district, item.city]
            .filter(Boolean)
            .join(', ') ||
          item.address ||
          'Location not provided';

        const mappedEquipment = {
          id: item.id,

          title:
            item.title ||
            item.name ||
            'Untitled equipment',

          category: categoryName,

          brand:
            item.brand ||
            '—',

          model:
            item.model ||
            '—',

          condition:
            item.condition ||
            'Not specified',

          year:
            item.yearPurchased ||
            '—',

          weight:
            item.weight ||
            '—',

          resolution:
            item.resolution ||
            '—',

          sensor:
            item.sensor ||
            '—',

          connectivity:
            item.connectivity ||
            '—',

          status:
            item.status ||
            'AVAILABLE',

          location,

          rating:
            Number(item.rating ?? 4.8),

          reviewCount:
            Number(item.reviewCount ?? 0),

          pricePerDay:
            Number(item.pricePerDay ?? 0),

          pricePerWeek:
            Number(item.pricePerWeek ?? Number(item.pricePerDay ?? 0) * 7),

          depositAmount:
            Number(item.depositAmount ?? 0),

          owner: {
            id:
              item.ownerId ||
              item.owner?.id ||
              null,

            name:
              item.ownerName ||
              item.owner?.name ||
              'Owner',

            rating:
              Number(item.ownerRating ?? 4.8),

            reviewCount:
              Number(item.ownerReviewCount ?? 0),

            verified:
              item.ownerVerified ?? true,

            memberSince:
              item.ownerMemberSince ||
              'Recently',

            location,
          },

          description:
            item.description ||
            'No description available yet.',

          included:
            Array.isArray(item.included)
              ? item.included
              : ['Included item list not provided yet'],

          /*
          |--------------------------------------------------------------------------
          | IMPORTANT
          |--------------------------------------------------------------------------
          */

          gallery: imageList,

          icon:
            ['📷', '💻', '🎥', '🔊', '🚁', '🛠', '📦'][
            Math.abs(
              String(item.id)
                .split('')
                .reduce(
                  (sum, ch) => sum + ch.charCodeAt(0),
                  0
                )
            ) % 7
            ],
        };

        setEquipment(mappedEquipment);
      } catch (error) {
        console.error(
          'Failed to fetch equipment detail:',
          error
        );

        console.error(
          'Response:',
          error?.response?.data
        );

        setEquipment(null);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchEquipment();
    }
  }, [id]);

  /*
  |--------------------------------------------------------------------------
  | Gallery
  |--------------------------------------------------------------------------
  */

  const gallery = equipment?.gallery || [];

  /*
  |--------------------------------------------------------------------------
  | IMPORTANT:
  |
  | Do NOT filter images before rendering because filtering changes indexes.
  |
  | Instead remove broken image indexes through validImages.
  |--------------------------------------------------------------------------
  */

  const validImages = useMemo(() => {
    return gallery.filter(
      (_, index) => !imageErrors[index]
    );
  }, [gallery, imageErrors]);

  /*
  |--------------------------------------------------------------------------
  | Keep main image index valid
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (mainImg >= validImages.length) {
      setMainImg(
        validImages.length > 0
          ? validImages.length - 1
          : 0
      );
    }
  }, [mainImg, validImages.length]);

  /*
  |--------------------------------------------------------------------------
  | Image error
  |--------------------------------------------------------------------------
  */

  const handleImageError = (originalIndex) => {
    console.error(
      'Image failed to load:',
      gallery[originalIndex]
    );

    setImageErrors((prev) => ({
      ...prev,
      [originalIndex]: true,
    }));
  };

  /*
  |--------------------------------------------------------------------------
  | Duration
  |--------------------------------------------------------------------------
  */

  const duration = useMemo(() => {
    if (!startDate || !endDate) {
      return 0;
    }

    const s = new Date(`${startDate}T00:00:00`);
    const e = new Date(`${endDate}T00:00:00`);

    return Math.round(
      (e - s) / (1000 * 60 * 60 * 24)
    );
  }, [startDate, endDate]);

  useEffect(() => {
    if (!startDate || !endDate) {
      setDateError('');
      return;
    }

    if (duration <= 0) {
      setDateError(
        'Please select a valid rental period.'
      );
    } else {
      setDateError('');
    }
  }, [startDate, endDate, duration]);

  useEffect(() => {
    let active = true;
    const checkDateAvailability = async () => {
      if (!equipment?.id || !startDate || !endDate) {
        setAvailability(null);
        setAvailabilityLoading(false);
        return;
      }

      if (duration <= 0) {
        setAvailability(null);
        setAvailabilityLoading(false);
        return;
      }

      try {
        setAvailabilityLoading(true);

        const response =
          await bookingService.checkAvailability(
            equipment.id,
            startDate,
            endDate
          );

        if (active) setAvailability(response.data.available);

      } catch (error) {
        console.error(
          'Failed to check availability:',
          error
        );

        if (active) setAvailability(null);

      } finally {
        if (active) setAvailabilityLoading(false);
      }
    };

    checkDateAvailability();
    return () => { active = false; };
  }, [equipment?.id, startDate, endDate, duration]);

  useEffect(() => {
    const fetchUnavailableDates = async () => {
      if (!equipment?.id) {
        setUnavailableDates([]);
        return;
      }

      try {
        const response = await bookingService.getUnavailableDates(
          equipment.id
        );

        setUnavailableDates(response.data.dates || []);
      } catch (error) {
        console.error(
          'Failed to fetch unavailable dates:',
          error
        );

        setUnavailableDates([]);
      }
    };

    fetchUnavailableDates();
  }, [equipment?.id]);


  const isDateRangeAvailable = (start, end) => {
    if (!start || !end) {
      return true;
    }

    const startDateObj = new Date(`${start}T00:00:00`);
    const endDateObj = new Date(`${end}T00:00:00`);

    const unavailableSet = new Set(unavailableDates);

    const currentDate = new Date(startDateObj);

    while (currentDate < endDateObj) {
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const day = String(currentDate.getDate()).padStart(2, '0');

      const dateString = `${year}-${month}-${day}`;

      if (unavailableSet.has(dateString)) {
        return false;
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return true;
  };

  /*
  |--------------------------------------------------------------------------
  | Pricing
  |--------------------------------------------------------------------------
  */

  const validDuration =
    duration > 0 ? duration : 0;

  const subtotal = equipment
    ? equipment.pricePerDay * validDuration
    : 0;

  const total =
    equipment && validDuration > 0
      ? subtotal + equipment.depositAmount
      : 0;

  const isAvailable =
    equipment?.status === 'AVAILABLE' &&
    Boolean(startDate && endDate) &&
    duration > 0 &&
    !dateError &&
    !availabilityLoading &&
    availability === true;

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div
      className="rh-root pb-24 lg:pb-0"
      style={{
        background: '#fff',
        color: '#111827',
      }}
    >
      <style>{`
        .rh-root {
          font-family: Inter, sans-serif;
        }

        .rh-heading {
          font-family: "Plus Jakarta Sans", sans-serif;
        }

        .rh-btn-primary {
          background: #2F5FE0;
          color: #fff;
          font-weight: 600;
          border-radius: 10px;
          transition: background .15s ease, transform .1s ease;
        }

        .rh-btn-primary:hover:not(:disabled) {
          background: #274DBD;
        }

        .rh-btn-primary:active:not(:disabled) {
          transform: scale(0.98);
        }

        .rh-btn-primary:disabled {
          background: #D1D5DB;
          cursor: not-allowed;
        }

        .rh-btn-outline {
          border: 1px solid #E5E7EB;
          color: #374151;
          font-weight: 600;
          border-radius: 10px;
        }

        .rh-btn-outline:hover {
          background: #F9FAFB;
        }

        .rh-card {
          border: 1px solid #EEF0F3;
          border-radius: 16px;
          background: #fff;
        }

        .rh-input {
          height: 46px;
          border: 1px solid #E5E7EB;
          border-radius: 10px;
        }

        .rh-input input {
          outline: none;
          background: transparent;
          width: 100%;
          height: 100%;
        }

        .rh-skel {
          background: linear-gradient(
            90deg,
            #F1F3F6 25%,
            #E9ECF1 37%,
            #F1F3F6 63%
          );

          background-size: 400% 100%;
          animation: rh-shimmer 1.4s ease infinite;
          border-radius: 10px;
        }

        @keyframes rh-shimmer {
          0% {
            background-position: 100% 0;
          }

          100% {
            background-position: 0 0;
          }
        }
      `}</style>



      {/* ============================================================
          BREADCRUMB
      ============================================================ */}

      <div
        className="max-w-7xl mx-auto px-5 lg:px-8 py-4 text-sm"
        style={{
          color: '#9CA3AF',
        }}
      >
        <Link to="/">
          Home
        </Link>

        {' / '}

        <Link to="/categories">
          {equipment?.category || '...'}
        </Link>

        {' / '}

        <span
          style={{
            color: '#374151',
          }}
        >
          {equipment?.title || '...'}
        </span>
      </div>

      {/* ============================================================
          LOADING
      ============================================================ */}

      {loading && (
        <div className="max-w-7xl mx-auto px-5 lg:px-8 grid lg:grid-cols-[1.2fr_0.8fr] gap-10 pb-16">

          <div>
            <div className="rh-skel h-96 w-full mb-3" />

            <div className="flex gap-3">
              {Array.from({ length: 5 }).map(
                (_, i) => (
                  <div
                    key={i}
                    className="rh-skel h-16 w-16"
                  />
                )
              )}
            </div>

            <div className="rh-skel h-6 w-2/3 mt-8" />
            <div className="rh-skel h-4 w-1/3 mt-3" />
          </div>

          <div className="rh-skel h-80 w-full" />
        </div>
      )}

      {/* ============================================================
          NOT FOUND
      ============================================================ */}

      {!loading && !equipment && (
        <div className="max-w-7xl mx-auto px-5 lg:px-8 py-24 text-center">

          <div className="text-4xl mb-3">
            📦
          </div>

          <h2 className="rh-heading text-xl font-bold">
            Equipment not found
          </h2>

          <p className="text-sm mt-2 text-gray-500">
            This listing may have been removed or
            the link is incorrect.
          </p>

          <Link
            to="/browse"
            className="rh-btn-primary inline-block mt-6 px-6 py-2.5 text-sm"
          >
            Browse Equipment
          </Link>
        </div>
      )}

      {/* ============================================================
          MAIN
      ============================================================ */}

      {!loading && equipment && (
        <div className="max-w-7xl mx-auto px-5 lg:px-8 grid lg:grid-cols-[1.2fr_0.8fr] gap-10 pb-16">

          {/* ========================================================
              LEFT
          ======================================================== */}

          <div>

            {/* ======================================================
                IMAGE GALLERY
            ====================================================== */}

            <div
              className="relative rounded-2xl overflow-hidden"
              style={{
                background: '#F7F9FC',
                border: '1px solid #EEF0F3',
              }}
            >

              {validImages.length > 0 ? (
                <>
                  <img
                    key={validImages[mainImg]}
                    src={validImages[mainImg]}
                    alt={equipment.title}
                    className="h-80 sm:h-96 w-full object-cover"
                    onError={() => {

                      /*
                      Find original index in gallery
                      */

                      const originalIndex =
                        gallery.findIndex(
                          (url) =>
                            url ===
                            validImages[mainImg]
                        );

                      if (originalIndex !== -1) {
                        handleImageError(
                          originalIndex
                        );
                      }
                    }}
                  />

                  <span
                    className="absolute bottom-3 left-3 text-xs font-medium px-2.5 py-1 rounded-full bg-white"
                    style={{
                      color: '#374151',
                    }}
                  >
                    {mainImg + 1}/
                    {validImages.length}
                  </span>
                </>
              ) : (
                <div className="h-80 sm:h-96 flex flex-col items-center justify-center">

                  <div className="text-6xl">
                    {equipment.icon}
                  </div>

                  <p className="text-sm text-gray-400 mt-3">
                    No image available
                  </p>
                </div>
              )}

              {/* Favorite */}

              <button
                onClick={() =>
                  setFavorite((f) => !f)
                }
                aria-label="Toggle favorite"
                className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white flex items-center justify-center"
                style={{
                  boxShadow:
                    '0 2px 8px rgba(0,0,0,0.12)',
                }}
              >
                <Icon.heart
                  filled={favorite}
                />
              </button>

              {/* Zoom */}

              <button
                className="absolute top-3 left-3 w-9 h-9 rounded-full bg-white flex items-center justify-center"
                aria-label="Zoom"
                style={{
                  boxShadow:
                    '0 2px 8px rgba(0,0,0,0.12)',
                }}
              >
                <Icon.zoom />
              </button>

              {/* Previous */}

              {validImages.length > 1 && (
                <>
                  <button
                    onClick={() =>
                      setMainImg(
                        (i) =>
                          (i -
                            1 +
                            validImages.length) %
                          validImages.length
                      )
                    }
                    aria-label="Previous image"
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white flex items-center justify-center"
                    style={{
                      boxShadow:
                        '0 2px 8px rgba(0,0,0,0.12)',
                    }}
                  >
                    <Icon.chevronL />
                  </button>

                  {/* Next */}

                  <button
                    onClick={() =>
                      setMainImg(
                        (i) =>
                          (i + 1) %
                          validImages.length
                      )
                    }
                    aria-label="Next image"
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white flex items-center justify-center"
                    style={{
                      boxShadow:
                        '0 2px 8px rgba(0,0,0,0.12)',
                    }}
                  >
                    <Icon.chevronR />
                  </button>
                </>
              )}
            </div>

            {/* ======================================================
                THUMBNAILS
            ====================================================== */}

            {validImages.length > 0 && (
              <div className="flex gap-3 mt-3 overflow-x-auto pb-1">

                {validImages.map(
                  (image, i) => (
                    <button
                      key={image}
                      onClick={() =>
                        setMainImg(i)
                      }
                      className="w-16 h-16 rounded-xl shrink-0 overflow-hidden"
                      style={{
                        background: '#F7F9FC',
                        border:
                          i === mainImg
                            ? '2px solid #2F5FE0'
                            : '1px solid #EEF0F3',
                      }}
                    >
                      <img
                        src={image}
                        alt={`${equipment.title} thumbnail ${i + 1
                          }`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  )
                )}
              </div>
            )}

            {/* ======================================================
                INFO
            ====================================================== */}

            <div className="mt-8">

              <p
                className="text-xs font-semibold uppercase tracking-wide"
                style={{
                  color: '#2F5FE0',
                }}
              >
                {equipment.category}
              </p>

              <h1
                className="rh-heading text-2xl sm:text-3xl font-extrabold mt-1"
                style={{
                  color: '#0F1B3D',
                }}
              >
                {equipment.title}
              </h1>

              <div
                className="flex flex-wrap items-center gap-4 mt-3 text-sm"
                style={{
                  color: '#6B7280',
                }}
              >
                <span className="flex items-center gap-1.5">
                  <Stars
                    value={equipment.rating}
                  />

                  <strong
                    style={{
                      color: '#111827',
                    }}
                  >
                    {equipment.rating}
                  </strong>

                  ({equipment.reviewCount}{' '}
                  {t('reviews')})
                </span>

                <span className="flex items-center gap-1">
                  <Icon.pin />
                  {equipment.location}
                </span>

                <span
                  className="flex items-center gap-1.5 font-medium"
                  style={{
                    color: isAvailable
                      ? '#16A34A'
                      : '#DC2626',
                  }}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{
                      background:
                        isAvailable
                          ? '#16A34A'
                          : '#DC2626',
                    }}
                  />

                  {isAvailable
                    ? t('Available')
                    : t('Currently unavailable')}
                </span>
              </div>
            </div>

            {/* ======================================================
                PRICE
            ====================================================== */}

            <div className="mt-6 flex items-end gap-2">

              <span
                className="rh-heading text-3xl font-extrabold"
                style={{
                  color: '#0F1B3D',
                }}
              >
                {formatVnd(equipment.pricePerDay)}
              </span>

              <span
                className="text-sm mb-1"
                style={{
                  color: '#6B7280',
                }}
              >
                / {t('day')}
              </span>
            </div>

            <p
              className="text-sm mt-1"
              style={{
                color: '#6B7280',
              }}
            >
              {formatVnd(equipment.pricePerWeek)} / {t('week')} ·
              {t('Security deposit')}: {formatVnd(equipment.depositAmount)}
            </p>

            {/* ======================================================
                DETAILS
            ====================================================== */}

            <div className="mt-10">

              <h2
                className="rh-heading text-lg font-bold mb-4"
                style={{
                  color: '#0F1B3D',
                }}
              >
                {t('Equipment Details')}
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-3 gap-x-6 text-sm">

                {[
                  [t('Brand'), equipment.brand],
                  [t('Model'), equipment.model],
                  [t('Category'), equipment.category],
                  [t('Condition'), equipment.condition],
                  [t('Year'), equipment.year],
                  ['Weight', equipment.weight],
                  ['Spec', equipment.resolution],
                  ['Detail', equipment.sensor],
                  [
                    'Connectivity',
                    equipment.connectivity,
                  ],
                ].map(
                  ([label, value]) => (
                    <div key={label}>
                      <p className="text-gray-400">
                        {label}
                      </p>

                      <p className="font-medium text-gray-900">
                        {value}
                      </p>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* ======================================================
                DESCRIPTION
            ====================================================== */}

            <div className="mt-10">

              <h2
                className="rh-heading text-lg font-bold mb-3"
                style={{
                  color: '#0F1B3D',
                }}
              >
                About this equipment
              </h2>

              <p
                className="text-sm leading-relaxed"
                style={{
                  color: '#374151',
                }}
              >
                {expanded
                  ? equipment.description
                  : equipment.description.length >
                    140
                    ? `${equipment.description.slice(
                      0,
                      140
                    )}...`
                    : equipment.description}
              </p>

              {equipment.description.length >
                140 && (
                  <button
                    onClick={() =>
                      setExpanded((e) => !e)
                    }
                    className="text-sm font-semibold mt-2 hover:underline"
                    style={{
                      color: '#2F5FE0',
                    }}
                  >
                    {expanded
                      ? 'Show less'
                      : 'Read more'}
                  </button>
                )}
            </div>

            {/* ======================================================
                INCLUDED
            ====================================================== */}

            <div className="mt-10">

              <h2
                className="rh-heading text-lg font-bold mb-4"
                style={{
                  color: '#0F1B3D',
                }}
              >
                What's Included
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                {equipment.included.map(
                  (item) => (
                    <div
                      key={item}
                      className="flex items-center gap-2.5 text-sm"
                      style={{
                        color: '#374151',
                      }}
                    >
                      <Icon.check />
                      {item}
                    </div>
                  )
                )}
              </div>
            </div>

            {/* ======================================================
                RULES
            ====================================================== */}

            <div className="mt-10">

              <h2
                className="rh-heading text-lg font-bold mb-4"
                style={{
                  color: '#0F1B3D',
                }}
              >
                Rental Rules
              </h2>

              <ul className="space-y-2">

                {RULES.map((rule) => (
                  <li
                    key={rule}
                    className="text-sm flex items-start gap-2.5"
                    style={{
                      color: '#374151',
                    }}
                  >
                    <span
                      className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0"
                      style={{
                        background: '#2F5FE0',
                      }}
                    />

                    {rule}
                  </li>
                ))}
              </ul>
            </div>

            {/* ======================================================
                OWNER
            ====================================================== */}

            <div className="mt-10 rh-card p-6">

              <h2
                className="rh-heading text-lg font-bold mb-4"
                style={{
                  color: '#0F1B3D',
                }}
              >
                Equipment Owner
              </h2>

              <div className="flex items-center gap-4">

                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center text-white text-lg font-semibold shrink-0"
                  style={{
                    background: '#1E3A8A',
                  }}
                >
                  {equipment.owner.name
                    .split(' ')
                    .map((w) => w[0])
                    .join('')}
                </div>

                <div className="min-w-0">

                  <div className="flex items-center gap-2 flex-wrap">

                    <p className="font-semibold text-sm text-gray-900">
                      {equipment.owner.name}
                    </p>

                    {equipment.owner.verified && (
                      <span
                        className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{
                          background: '#ECFDF3',
                          color: '#16A34A',
                        }}
                      >
                        <Icon.shield />
                        Verified Owner
                      </span>
                    )}
                  </div>

                  <p className="text-xs mt-1 flex items-center gap-1.5 text-gray-500">
                    <Stars
                      value={
                        equipment.owner.rating
                      }
                    />

                    {equipment.owner.rating} ·{' '}
                    {equipment.owner.reviewCount}{' '}
                    reviews · Member since{' '}
                    {equipment.owner.memberSince}
                  </p>

                  <p className="text-xs mt-1 flex items-center gap-1 text-gray-400">
                    <Icon.pin />
                    {equipment.owner.location}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-5">

                <button className="rh-btn-outline flex-1 py-2.5 text-sm">
                  View Profile
                </button>

                <button
                  onClick={handleChatWithOwner}
                  className="rh-btn-primary flex-1 py-2.5 text-sm"
                >
                  Message Owner
                </button>
              </div>
            </div>

            {/* ======================================================
                REVIEWS
            ====================================================== */}

            <div className="mt-10">
              {reviewsLoading ? (
                <p className="text-sm text-gray-500 py-4">
                  Loading reviews...
                </p>
              ) : reviewsError ? (
                <p className="text-sm text-red-600 py-4">
                  {reviewsError}
                </p>
              ) : (
                <>
                  <div className="flex flex-col sm:flex-row gap-8 mb-6">
                    <div className="text-center sm:text-left shrink-0">
                      <p
                        className="rh-heading text-4xl font-extrabold"
                        style={{ color: '#0F1B3D' }}
                      >
                        {reviewSummary.averageRating.toFixed(1)}
                      </p>

                      <Stars value={reviewSummary.averageRating} />

                      <p className="text-xs mt-1 text-gray-400">
                        {reviewSummary.totalReviews}{' '}
                        {reviewSummary.totalReviews === 1
                          ? 'review'
                          : 'reviews'}
                      </p>
                    </div>

                    <div className="flex-1 space-y-1.5">
                      {reviewSummary.ratingBreakdown.map((item) => {
                        const percentage =
                          reviewSummary.totalReviews > 0
                            ? (item.count / reviewSummary.totalReviews) * 100
                            : 0;

                        return (
                          <div
                            key={item.rating}
                            className="flex items-center gap-2 text-xs text-gray-500"
                          >
                            <span className="w-8">
                              {item.rating} ★
                            </span>

                            <div className="flex-1 h-2 rounded-full bg-gray-100">
                              <div
                                className="h-2 rounded-full bg-amber-400"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>

                            <span className="w-10 text-right">
                              {Math.round(percentage)}%
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {reviews.length === 0 ? (
                    <div className="py-6 text-center border-t border-gray-100">
                      <p className="text-sm text-gray-500">
                        This equipment has no reviews yet.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {reviews.map((review) => (
                        <div
                          key={review.id}
                          className="pb-5 border-b"
                          style={{ borderColor: '#EEF0F3' }}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <p className="font-semibold text-sm text-gray-900">
                              {review.reviewerName || 'Anonymous'}
                            </p>

                            <span className="text-xs text-gray-400">
                              {review.createdAt
                                ? new Date(review.createdAt).toLocaleDateString(
                                  'vi-VN'
                                )
                                : ''}
                            </span>
                          </div>

                          <div className="mt-1">
                            <Stars value={review.rating} />
                          </div>

                          <p className="text-sm mt-1.5 text-gray-700 whitespace-pre-wrap">
                            {review.comment || 'No comment provided.'}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

             
            </div>

            {/* ======================================================
                LOCATION
            ====================================================== */}

            <div className="mt-10">

              <h2
                className="rh-heading text-lg font-bold mb-4"
                style={{
                  color: '#0F1B3D',
                }}
              >
                Location
              </h2>

              <p className="text-sm flex items-center gap-1.5 mb-3 text-gray-700">
                <Icon.pin />
                {equipment.location}
              </p>

              <div className="h-48 rounded-2xl flex items-center justify-center text-sm bg-gray-50 border border-gray-100 text-gray-400">
                Map preview
              </div>
            </div>
          </div>

          {/* ========================================================
              RIGHT - BOOKING
          ======================================================== */}

          <div className="hidden lg:block">

            <div
              className="sticky top-24 rh-card p-6"
              style={{
                boxShadow:
                  '0 12px 30px -16px rgba(15,27,61,0.15)',
              }}
            >

              <h3
                className="rh-heading text-lg font-bold mb-1"
                style={{
                  color: '#0F1B3D',
                }}
              >
                {t('Book this equipment')}
              </h3>

              <p
                className="text-2xl font-extrabold rh-heading mb-4"
                style={{
                  color: '#0F1B3D',
                }}
              >
                {formatVnd(equipment.pricePerDay)}

                <span className="text-sm font-normal text-gray-500">
                  {' '}
                  / day
                </span>
              </p>

              <div className="grid grid-cols-2 gap-3">

                <div>

                  <label className="block text-xs font-medium mb-1.5">
                    Start Date
                  </label>

                  <div className="rh-input px-3">
                    <DatePicker
                      selected={
                        startDate
                          ? new Date(`${startDate}T00:00:00`)
                          : null
                      }

                      onChange={(date) => {
                        if (!date) {
                          setStartDate('');
                          setEndDate('');
                          setDateError('');
                          setAvailability(null);
                          return;
                        }

                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');

                        const selectedStartDate = `${year}-${month}-${day}`;

                        if (selectedStartDate !== startDate) {
                          setStartDate(selectedStartDate);
                          setEndDate('');
                          setDateError('');
                          setAvailability(null);
                        }
                      }}

                      minDate={new Date()}
                      excludeDates={unavailableDates.map(
                        (date) => new Date(`${date}T00:00:00`)
                      )}
                      dateFormat="dd/MM/yyyy"
                      placeholderText="Select start date"
                      className="w-full bg-transparent outline-none"
                    />
                  </div>
                </div>

                <div>

                  <label className="block text-xs font-medium mb-1.5">
                    End Date
                  </label>

                  <div className="rh-input px-3">
                    <DatePicker
                      selected={
                        endDate
                          ? new Date(`${endDate}T00:00:00`)
                          : null
                      }
                      onChange={(date) => {
                        if (!date) {
                          setEndDate('');
                          return;
                        }

                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');

                        const selectedEndDate = `${year}-${month}-${day}`;

                        if (!isDateRangeAvailable(startDate, selectedEndDate)) {
                          setDateError(
                            'The selected rental period contains unavailable dates.'
                          );
                          setEndDate('');
                          return;
                        }

                        setDateError('');
                        setEndDate(selectedEndDate);
                      }}
                      minDate={
                        startDate
                          ? new Date(`${startDate}T00:00:00`)
                          : new Date()
                      }
                      dateFormat="dd/MM/yyyy"
                      placeholderText="Select end date"
                      className="w-full bg-transparent outline-none"
                    />
                  </div>
                </div>
                {availabilityLoading && (
                  <p className="mt-2 text-sm text-gray-500">
                    Checking availability...
                  </p>
                )}

                {!availabilityLoading && availability === true && (
                  <p className="mt-2 text-sm text-green-600">
                    ✓ This equipment is available for the selected dates.
                  </p>
                )}

                {!availabilityLoading && availability === false && (
                  <p className="mt-2 text-sm text-red-600">
                    ✕ This equipment is not available for the selected dates.
                  </p>
                )}

              </div>

              {dateError && (
                <p className="text-xs mt-2 text-red-600">
                  {dateError}
                </p>
              )}

              {validDuration > 0 && (
                <div className="mt-5 pt-5 border-t text-sm space-y-2">

                  <div className="flex justify-between">
                    <span className="text-gray-500">
                      Rental duration
                    </span>

                    <span className="font-medium">
                      {validDuration}{' '}
                      day
                      {validDuration > 1
                        ? 's'
                        : ''}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-500">
                      {formatVnd(equipment.pricePerDay)}{' '}
                      × {validDuration}{' '}
                      days
                    </span>

                    <span className="font-medium">
                      {formatVnd(subtotal)}
                    </span>
                  </div>



                  <div className="flex justify-between">
                    <span className="text-gray-500">
                      Security deposit
                    </span>

                    <span className="font-medium">
                      {formatVnd(equipment.depositAmount)}
                    </span>
                  </div>

                  <div className="flex justify-between pt-2 border-t font-bold">
                    <span>Total</span>

                    <span>{formatVnd(total)}</span>
                  </div>
                </div>
              )}

              <button
                onClick={handleRequestToRent}
                disabled={!isAvailable || bookingLoading}
                className="rh-btn-primary w-full py-3 text-sm mt-5"
              >
                {bookingLoading
                  ? 'Sending...'
                  : isAvailable
                    ? 'Request to Rent'
                    : 'Unavailable'}
              </button>
              {bookingError && (
                <div
                  role="alert"
                  aria-live="assertive"
                  className="mt-4 flex items-start gap-3 rounded-lg border border-red-300 bg-red-50 p-4 text-red-800"
                >
                  <span className="text-xl" aria-hidden="true">⚠️</span>

                  <div className="flex-1">
                    <p className="font-semibold">Không thể gửi yêu cầu thuê</p>
                    <p className="mt-1 text-sm">{bookingError}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setBookingError('')}
                    className="text-red-700 hover:text-red-900"
                    aria-label="Đóng thông báo"
                  >
                    ✕
                  </button>
                </div>
              )}
              <p className="text-xs text-center mt-3 text-gray-400">
                You won't be charged until
                the owner accepts your request.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          MOBILE BOOKING
      ============================================================ */}

      {!loading && equipment && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t px-5 py-3 flex items-center justify-between gap-4">

          <div>
            <p className="rh-heading text-lg font-extrabold">
              {formatVnd(equipment.pricePerDay)}

              <span className="text-xs font-normal text-gray-500">
                /day
              </span>
            </p>
          </div>

          <button
            onClick={handleRequestToRent}
            disabled={!isAvailable || bookingLoading}
            className="rh-btn-primary px-6 py-3 text-sm flex-1 max-w-[220px]"
          >
            {isAvailable
              ? 'Request to Rent'
              : 'Unavailable'}
          </button>
        </div>
      )}
    </div>
  );
}
