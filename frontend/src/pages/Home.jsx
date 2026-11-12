import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AppFooter from '../components/layout/AppFooter';
import { getCategories } from '../services/categoryService';
import axiosClient from '../services/axiosClient';
import { formatVnd } from '../utils/currency';
import { usePreferences } from '../context/preferences';

/* ------------------------------------------------------------------
 * Design tokens
 * Navy #0F1B3D · Primary blue #2F5FE0
 * ------------------------------------------------------------------ */

const NEAR_YOU = [
  {
    id: 1,
    name: 'Sony Alpha A7 IV',
    location: 'District 1',
    price: 250000,
  },
  {
    id: 5,
    name: 'DJI Mini 4 Pro',
    location: 'District 7',
    price: 350000,
  },
  {
    id: 2,
    name: 'MacBook Pro 14"',
    location: 'District 3',
    price: 300000,
  },
  {
    id: 4,
    name: 'JBL PartyBox 310',
    location: 'Binh Thanh',
    price: 220000,
  },
];

const REVIEWS = [
  {
    name: 'Minh Nguyen',
    text: 'RentHub made it incredibly easy to find a camera for my weekend project. The owner was responsive and the equipment was exactly as described.',
  },
  {
    name: 'Linh Tran',
    text: 'I had some equipment sitting unused at home. Listing it on RentHub helped me earn extra income while keeping the process simple.',
  },
  {
    name: 'David Pham',
    text: 'The platform is clean and easy to use. I found a projector near me within a few minutes.',
  },
];

const STATS = [
  { value: '10,000+', label: 'Equipment Listed' },
  { value: '5,000+', label: 'Active Users' },
  { value: '15,000+', label: 'Successful Rentals' },
  { value: '4.8/5', label: 'Average Rating' },
];

const STEPS = [
  {
    n: '01',
    title: 'Find Equipment',
    text: 'Search and discover equipment that matches your needs.',
  },
  {
    n: '02',
    title: 'Book',
    text: 'Choose your rental dates and send a booking request.',
  },
  {
    n: '03',
    title: 'Meet & Rent',
    text: 'Connect with the owner and receive the equipment.',
  },
  {
    n: '04',
    title: 'Return & Review',
    text: 'Return the equipment and leave a review.',
  },
];

const FEATURES = [
  {
    title: 'Trusted Users',
    text: 'Connect with verified renters and equipment owners.',
    icon: 'shield',
  },
  {
    title: 'Flexible Rentals',
    text: 'Rent equipment for a day, a week, or longer.',
    icon: 'calendar',
  },
  {
    title: 'Secure Payments',
    text: 'Keep your transactions simple and secure.',
    icon: 'lock',
  },
  {
    title: 'Local Marketplace',
    text: 'Find equipment available near your location.',
    icon: 'pin',
  },
];

/* ------------------------------------------------------------------
 * Icons
 * ------------------------------------------------------------------ */

const Icon = {
  search: (props) => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      {...props}
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </svg>
  ),

  bell: (props) => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      {...props}
    >
      <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </svg>
  ),

  message: (props) => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      {...props}
    >
      <path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H6l-3 2v-5.5A7.5 7.5 0 1 1 20 11.5z" />
    </svg>
  ),

  menu: (props) => (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      {...props}
    >
      <path d="M3 6h18M3 12h18M3 18h18" />
    </svg>
  ),

  close: (props) => (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      {...props}
    >
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  ),

  heart: ({ filled = false, ...props }) => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill={filled ? '#EF4444' : 'none'}
      stroke={filled ? '#EF4444' : 'currentColor'}
      strokeWidth="1.8"
      {...props}
    >
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
    </svg>
  ),

  star: (props) => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="#F59E0B"
      stroke="#F59E0B"
      {...props}
    >
      <path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.9L12 17.8 5.8 21l1.2-6.9-5-4.9 6.9-1z" />
    </svg>
  ),

  pin: (props) => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      {...props}
    >
      <path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 1 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),

  shield: (props) => (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#2F5FE0"
      strokeWidth="1.8"
      {...props}
    >
      <path d="M12 2l8 4v6c0 5-3.4 8.4-8 10-4.6-1.6-8-5-8-10V6z" />
    </svg>
  ),

  calendar: (props) => (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#2F5FE0"
      strokeWidth="1.8"
      {...props}
    >
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 10h18" />
    </svg>
  ),

  lock: (props) => (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#2F5FE0"
      strokeWidth="1.8"
      {...props}
    >
      <rect x="4" y="10" width="16" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  ),

  chevron: (props) => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      {...props}
    >
      <path d="M9 6l6 6-6 6" />
    </svg>
  ),
};

const FEATURE_ICON = {
  shield: Icon.shield,
  calendar: Icon.calendar,
  lock: Icon.lock,
  pin: Icon.pin,
};

const CATEGORY_ICONS = {
  camera: '📷',
  cameras: '📷',
  laptop: '💻',
  laptops: '💻',
  projector: '🎥',
  projectors: '🎥',
  audio: '🔊',
  'audio equipment': '🔊',
  tool: '🛠',
  tools: '🛠',
  gaming: '🎮',
  vehicle: '🚗',
  vehicles: '🚗',
  drone: '🚁',
  'camera / drone': '🚁',
};

/* ------------------------------------------------------------------
 * API
 *
 * This project uses Vite.
 * Add VITE_API_URL to your .env file.
 * ------------------------------------------------------------------ */

const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const normalizeEquipment = (item) => ({
  ...item,
  name: item.title,
  category: item.categoryName || 'Other',
  location: [item.district, item.city].filter(Boolean).join(', ') || item.address || 'Location unavailable',
  price: Number(item.pricePerDay),
  status: item.status || 'AVAILABLE',
  owner: item.ownerName || 'RentHub owner',
});

/* ------------------------------------------------------------------
 * Home
 * ------------------------------------------------------------------ */

export default function Home() {
  const { t } = usePreferences();
  const [loading, setLoading] = useState(true);
  const [equipment, setEquipment] = useState([]);
  const [equipmentError, setEquipmentError] = useState(false);

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');

  const [favorites, setFavorites] = useState(new Set());
  const [categories, setCategories] = useState([]);

  const [menuOpen, setMenuOpen] = useState(false);

  // Auth state
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const isLoggedIn = !!currentUser;

  const userRoles = useMemo(() => {
    if (!currentUser) return [];

    if (Array.isArray(currentUser.roles)) return currentUser.roles;
    if (Array.isArray(currentUser.authorities)) return currentUser.authorities;
    if (typeof currentUser.role === 'string') return [currentUser.role];
    if (typeof currentUser.roles === 'string') {
      return currentUser.roles.split(',').map((role) => role.trim()).filter(Boolean);
    }

    return [];
  }, [currentUser]);

  const canManageEquipment = useMemo(
    () => userRoles.some((role) => ['ROLE_OWNER', 'ROLE_ADMIN'].includes(role)),
    [userRoles]
  );

  /* ------------------------------------------------------------------
   * Loading animation
   * ------------------------------------------------------------------ */

  useEffect(() => {
    const fetchEquipment = async () => {
      try {
       const response = await axiosClient.get('/equipments');
const items = response.data?.data;

if (!Array.isArray(items)) {
  throw new Error('Invalid equipment response format.');
}

setEquipment(items.slice(0, 12).map(normalizeEquipment));
      } catch (error) {
        console.error('Unable to load featured equipment', error);
        setEquipmentError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchEquipment();
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      const items = await getCategories();
      setCategories(items);
    };

    fetchCategories();
  }, []);

  const categoryOptions = useMemo(
    () =>
      categories.map((item) => ({
        ...item,
        icon:
          CATEGORY_ICONS[item.name?.toLowerCase()] ||
          CATEGORY_ICONS[item.name?.replace(/\s+/g, ' ').trim().toLowerCase()] ||
          '📦',
      })),
    [categories]
  );

  /* ------------------------------------------------------------------
   * Get current user
   * ------------------------------------------------------------------ */

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      setAuthLoading(false);
      return;
    }

    fetch(`${API_BASE_URL}/users/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Unauthorized');
        }

        return response.json();
      })
      
      .then((responseData) => {
        const user = responseData?.data;

        if (!user?.id) {
          throw new Error('Invalid user profile response.');
        }

        setCurrentUser(user);
      })

      .catch(() => {
        localStorage.removeItem('token');
        setCurrentUser(null);
      })
      .finally(() => {
        setAuthLoading(false);
      });
  }, []);

  /* ------------------------------------------------------------------
   * Logout
   * ------------------------------------------------------------------ */

  const handleLogout = () => {
    localStorage.removeItem('token');

    setCurrentUser(null);
    setUserMenuOpen(false);
    setMenuOpen(false);
  };

  /* ------------------------------------------------------------------
   * User initials
   * ------------------------------------------------------------------ */

  const getInitials = (user) => {
    if (!user) {
      return '';
    }

    const firstName = user.firstName?.[0] ?? '';
    const lastName = user.lastName?.[0] ?? '';

    return `${firstName}${lastName}`.toUpperCase();
  };

  /* ------------------------------------------------------------------
   * Favorite
   * ------------------------------------------------------------------ */

  const toggleFavorite = (id) => {
    setFavorites((previous) => {
      const next = new Set(previous);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  };

  /* ------------------------------------------------------------------
   * Filter equipment
   * ------------------------------------------------------------------ */

  const filteredEquipment = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const normalizedCategory = category.trim().toLowerCase();
    const normalizedLocation = location.trim().toLowerCase();

    return equipment.filter((item) => {
      const matchesQuery = normalizedQuery
        ? item.name.toLowerCase().includes(normalizedQuery) ||
          item.category.toLowerCase().includes(normalizedQuery)
        : true;

      const matchesCategory = normalizedCategory
        ? item.category.toLowerCase().includes(normalizedCategory) ||
          normalizedCategory.includes(item.category.toLowerCase())
        : true;

      const matchesLocation = normalizedLocation
        ? item.location.toLowerCase().includes(normalizedLocation)
        : true;

      return matchesQuery && matchesCategory && matchesLocation;
    });
  }, [equipment, query, category, location]);

  /* ------------------------------------------------------------------
   * Search
   * ------------------------------------------------------------------ */

  const handleSearch = () => {
    document
      .getElementById('featured')
      ?.scrollIntoView({ behavior: 'smooth' });
  };

  /* ------------------------------------------------------------------
   * Reset filters
   * ------------------------------------------------------------------ */

  const resetFilters = () => {
    setQuery('');
    setCategory('');
    setLocation('');
  };

  return (
    <div
      className="rh-root min-h-screen"
      style={{ background: '#FFFFFF' }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800&family=Inter:wght@400;500;600&display=swap');

        .rh-root {
          font-family: 'Inter', sans-serif;
          color: #111827;
        }

        .rh-heading {
          font-family: 'Plus Jakarta Sans', sans-serif;
        }

        .rh-btn-primary {
          background: #2F5FE0;
          color: #fff;
          font-weight: 600;
          border-radius: 10px;
          transition:
            background .15s ease,
            transform .1s ease;
        }

        .rh-btn-primary:hover {
          background: #274DBD;
        }

        .rh-btn-primary:active {
          transform: scale(0.98);
        }

        .rh-btn-primary:disabled {
          opacity: .6;
          cursor: not-allowed;
        }

        .rh-btn-outline {
          border: 1px solid #E5E7EB;
          color: #374151;
          font-weight: 600;
          border-radius: 10px;
          transition:
            background .15s ease,
            border-color .15s ease;
        }

        .rh-btn-outline:hover {
          background: #F9FAFB;
          border-color: #D1D5DB;
        }

        .rh-card {
          border: 1px solid #EEF0F3;
          border-radius: 16px;
          background: #fff;
          transition:
            box-shadow .2s ease,
            transform .2s ease,
            border-color .2s ease;
        }

        .rh-card:hover {
          box-shadow: 0 16px 32px -16px rgba(15,27,61,0.18);
          transform: translateY(-3px);
          border-color: #E5E7EB;
        }

        .rh-input {
          height: 48px;
          border: 1px solid #E5E7EB;
          border-radius: 10px;
          transition:
            border-color .15s ease,
            box-shadow .15s ease;
        }

        .rh-input:focus-within {
          border-color: #2F5FE0;
          box-shadow: 0 0 0 3px rgba(47,95,224,0.12);
        }

        .rh-input input,
        .rh-input select {
          outline: none;
          background: transparent;
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

        .rh-fade {
          animation: rh-fadeup .5s ease both;
        }

        @keyframes rh-fadeup {
          from {
            opacity: 0;
            transform: translateY(10px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .rh-fade,
          .rh-skel {
            animation: none;
          }

          .rh-card:hover {
            transform: none;
          }
        }
      `}</style>

      

      {/* ============================================================
          HERO
      ============================================================ */}

      <section
        className="relative overflow-hidden"
        style={{ background: '#F7F9FC' }}
      >
        <div className="max-w-7xl mx-auto px-5 lg:px-8 py-16 lg:py-24 grid lg:grid-cols-2 gap-12 items-center">
          <div className="rh-fade">
            <h1
              className="rh-heading text-4xl sm:text-5xl font-extrabold leading-tight"
              style={{ color: '#0F1B3D' }}
            >
              {t('Rent What You Need.')}
              <br />
              {t('Share What You Own.')}
            </h1>

            <p
              className="mt-5 text-base max-w-md"
              style={{ color: '#6B7280' }}
            >
              {t('Discover quality equipment near you or turn your unused equipment into extra income with RentHub.')}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/browse"
                className="rh-btn-primary px-6 py-3 text-sm"
              >
                {t('Explore Equipment')}
              </Link>

              {canManageEquipment && (
                <Link
                  to="/list-equipment"
                  className="rh-btn-outline px-6 py-3 text-sm bg-white"
                >
                  {t('List Your Equipment')}
                </Link>
              )}
            </div>
          </div>

          <div className="relative h-72 lg:h-96 hidden sm:block">
            <div
              className="absolute right-4 top-6 w-40 h-40 rounded-3xl"
              style={{
                background: 'rgba(47,95,224,0.10)',
              }}
            />

            <div
              className="absolute right-24 top-24 w-28 h-28 rounded-full"
              style={{
                background: 'rgba(15,27,61,0.06)',
              }}
            />

            {[
              { icon: '📷', top: '4%', left: '2%' },
              { icon: '💻', top: '28%', left: '38%' },
              { icon: '🎥', top: '55%', left: '8%' },
              { icon: '🔊', top: '10%', left: '62%' },
              { icon: '🛠', top: '60%', left: '55%' },
            ].map((item, index) => (
              <div
                key={index}
                className="absolute w-16 h-16 rounded-2xl flex items-center justify-center text-2xl bg-white"
                style={{
                  top: item.top,
                  left: item.left,
                  boxShadow:
                    '0 12px 24px -10px rgba(15,27,61,0.25)',
                }}
              >
                {item.icon}
              </div>
            ))}
          </div>
        </div>

        {/* Search */}

        <div className="max-w-5xl mx-auto px-5 lg:px-8 pb-14">
          <div
            className="rh-card p-4 sm:p-5"
            style={{
              boxShadow:
                '0 12px 30px -14px rgba(15,27,61,0.15)',
            }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr_1fr_auto] gap-3">
              <div className="rh-input flex items-center gap-2.5 px-3.5">
                <Icon.search style={{ color: '#9CA3AF' }} />

                <input
                  type="text"
                  className="w-full text-sm"
                  placeholder="What equipment are you looking for?"
                  value={query}
                  onChange={(event) =>
                    setQuery(event.target.value)
                  }
                />
              </div>

              <div className="rh-input flex items-center px-3.5">
                <select
                  className="w-full text-sm"
                  value={category || '__placeholder__'}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    setCategory(nextValue === '__placeholder__' ? '' : nextValue);
                  }}
                >
                  <option value="__placeholder__" hidden>
                    Category
                  </option>

                  {categoryOptions.map((item) => (
                    <option key={item.id || item.name} value={item.name}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rh-input flex items-center px-3.5">
                <select
                  className="w-full text-sm"
                  value={location || '__placeholder__'}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    setLocation(nextValue === '__placeholder__' ? '' : nextValue);
                  }}
                >
                  <option value="__placeholder__" hidden>
                    Location
                  </option>
                  <option value="District 1">District 1</option>
                  <option value="District 3">District 3</option>
                  <option value="District 4">District 4</option>
                  <option value="District 5">District 5</option>
                  <option value="District 7">District 7</option>
                  <option value="District 8">District 8</option>
                  <option value="District 10">District 10</option>
                  <option value="District 11">District 11</option>
                  <option value="Binh Thanh">Binh Thanh</option>
                  <option value="Go Vap">Go Vap</option>
                  <option value="Phu Nhuan">Phu Nhuan</option>
                  <option value="Tan Binh">Tan Binh</option>
                  <option value="Tan Phu">Tan Phu</option>
                  <option value="Thu Duc">Thu Duc</option>
                  <option value="Cau Giay">Cau Giay</option>
                  <option value="Nha Be">Nha Be</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleSearch}
                className="rh-btn-primary text-sm px-6 py-2.5 sm:py-0"
              >
                Search
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          CATEGORIES
      ============================================================ */}

      <section className="max-w-7xl mx-auto px-5 lg:px-8 py-16">
        <div className="text-center max-w-xl mx-auto mb-10">
          <h2
            className="rh-heading text-3xl font-bold"
            style={{ color: '#0F1B3D' }}
          >
            {t('Explore Popular Categories')}
          </h2>

          <p
            className="mt-2 text-sm"
            style={{ color: '#6B7280' }}
          >
            {t('Find the right equipment for your next project or event.')}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {categoryOptions.length > 0 ? (
            categoryOptions.map((item) => (
              <button
                type="button"
                key={item.id || item.name}
                onClick={() => {
                  setCategory(item.name);

                  document
                    .getElementById('featured')
                    ?.scrollIntoView({
                      behavior: 'smooth',
                    });
                }}
                className="rh-card p-5 text-left"
              >
                <div className="text-3xl mb-3">
                  {item.icon}
                </div>

                <div
                  className="text-sm font-semibold"
                  style={{ color: '#111827' }}
                >
                  {item.name}
                </div>

                <div
                  className="text-xs mt-0.5"
                  style={{ color: '#9CA3AF' }}
                >
                  Explore
                </div>
              </button>
            ))
          ) : (
            <div className="col-span-full text-center text-sm" style={{ color: '#6B7280' }}>
              Loading categories...
            </div>
          )}
        </div>
      </section>

      {/* ============================================================
          FEATURED EQUIPMENT
      ============================================================ */}

      <section
        id="featured"
        className="max-w-7xl mx-auto px-5 lg:px-8 py-16"
        style={{ background: '#fff' }}
      >
        <div className="flex items-end justify-between mb-10 flex-wrap gap-3">
          <div>
            <h2
              className="rh-heading text-3xl font-bold"
              style={{ color: '#0F1B3D' }}
            >
              Featured Equipment
            </h2>

            <p
              className="mt-2 text-sm"
              style={{ color: '#6B7280' }}
            >
              Popular equipment available for rent near you.
            </p>
          </div>

          {(category || location || query) && (
            <button
              type="button"
              onClick={resetFilters}
              className="text-sm font-medium hover:underline"
              style={{ color: '#2F5FE0' }}
            >
              Clear filters ✕
            </button>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="rh-card p-4"
              >
                <div className="rh-skel h-40 w-full mb-4" />
                <div className="rh-skel h-4 w-3/4 mb-2" />
                <div className="rh-skel h-3 w-1/2 mb-4" />
                <div className="rh-skel h-8 w-full" />
              </div>
            ))}
          </div>
        ) : filteredEquipment.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">
              🔍
            </div>

            <p
              className="font-semibold"
              style={{ color: '#111827' }}
            >
              No equipment found
            </p>

            <p
              className="text-sm mt-1"
              style={{ color: '#6B7280' }}
            >
              Try a different keyword or clear your filters.
            </p>

            <button
              type="button"
              onClick={resetFilters}
              className="rh-btn-outline mt-5 px-5 py-2 text-sm inline-block bg-white"
            >
              Reset search
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEquipment.map((item) => {
              const equipmentIcon =
                {
                  Camera: '📷',
                  Laptop: '💻',
                  Projector: '🎥',
                  Audio: '🔊',
                  Tools: '🛠',
                  'Camera / Drone': '🚁',
                }[item.category] || '📦';

              return (
                <div
                  key={item.id}
                  className="rh-card overflow-hidden"
                >
                  <div
                    className="relative h-40 flex items-center justify-center text-5xl"
                    style={{ background: '#F7F9FC' }}
                  >
                    <span aria-hidden="true">{equipmentIcon}</span>

                    {item.coverImageUrl && (
                      <img
                        src={item.coverImageUrl}
                        alt={item.name}
                        className="absolute inset-0 w-full h-full object-cover"
                        onError={(event) => {
                          event.currentTarget.style.display = 'none';
                        }}
                      />
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        toggleFavorite(item.id)
                      }
                      aria-label="Toggle favorite"
                      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white flex items-center justify-center"
                      style={{
                        boxShadow:
                          '0 2px 8px rgba(0,0,0,0.12)',
                      }}
                    >
                      <Icon.heart
                        filled={favorites.has(item.id)}
                      />
                    </button>

                    <span
                      className="absolute top-3 left-3 text-xs font-semibold px-2 py-1 rounded-full"
                      style={{
                        background: '#ECFDF3',
                        color: '#16A34A',
                      }}
                    >
                      {item.status}
                    </span>
                  </div>

                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3
                        className="font-semibold text-sm"
                        style={{ color: '#111827' }}
                      >
                        {item.name}
                      </h3>

                      <div
                        className="flex items-center gap-1 text-xs shrink-0"
                        style={{ color: '#6B7280' }}
                      >
                        <Icon.star />

                        {item.rating}

                        <span
                          style={{ color: '#9CA3AF' }}
                        >
                          ({item.reviews})
                        </span>
                      </div>
                    </div>

                    <p
                      className="text-xs mt-1"
                      style={{ color: '#9CA3AF' }}
                    >
                      {item.category}
                    </p>

                    <div
                      className="flex items-center gap-1 mt-2 text-xs"
                      style={{ color: '#6B7280' }}
                    >
                      <Icon.pin />

                      {item.location}
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold text-white"
                          style={{ background: '#1E3A8A' }}
                        >
                          {item.owner
                            .split(' ')
                            .map((word) => word[0])
                            .join('')}
                        </div>

                        <span
                          className="text-xs"
                          style={{ color: '#6B7280' }}
                        >
                          {item.owner}
                        </span>
                      </div>

                      <div
                        className="text-sm font-bold"
                        style={{ color: '#0F1B3D' }}
                      >
                        {formatVnd(item.price)}

                        <span
                          className="text-xs font-normal"
                          style={{ color: '#9CA3AF' }}
                        >
                          /day
                        </span>
                      </div>
                    </div>

                    <Link
                      to={`/equipment/${item.id}`}
                      className="rh-btn-primary w-full text-center block mt-4 py-2.5 text-sm"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && (
          <div className="text-center mt-10">
            <Link
              to="/browse"
              className="rh-btn-outline px-6 py-2.5 text-sm inline-block bg-white"
            >
              View All Equipment
            </Link>
          </div>
        )}
      </section>

      {/* ============================================================
          HOW IT WORKS
      ============================================================ */}

      <section
        className="py-16"
        style={{ background: '#F7F9FC' }}
      >
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-12">
            <h2
              className="rh-heading text-3xl font-bold"
              style={{ color: '#0F1B3D' }}
            >
              {t('How RentHub Works')}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((step) => (
              <div
                key={step.n}
                className="text-center"
              >
                <div
                  className="rh-heading text-3xl font-extrabold mb-3"
                  style={{
                    color: 'rgba(47,95,224,0.25)',
                  }}
                >
                  {step.n}
                </div>

                <h3
                  className="font-semibold text-sm mb-1.5"
                  style={{ color: '#111827' }}
                >
                  {step.title}
                </h3>

                <p
                  className="text-sm"
                  style={{ color: '#6B7280' }}
                >
                  {step.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          WHY CHOOSE RENTHUB
      ============================================================ */}

      <section className="max-w-7xl mx-auto px-5 lg:px-8 py-16">
        <div className="text-center max-w-xl mx-auto mb-12">
          <h2
            className="rh-heading text-3xl font-bold"
            style={{ color: '#0F1B3D' }}
          >
            {t('Why Choose RentHub?')}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map((feature) => {
            const IconComponent =
              FEATURE_ICON[feature.icon];

            return (
              <div
                key={feature.title}
                className="rh-card p-6"
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                  style={{
                    background:
                      'rgba(47,95,224,0.10)',
                  }}
                >
                  <IconComponent />
                </div>

                <h3
                  className="font-semibold text-sm mb-1.5"
                  style={{ color: '#111827' }}
                >
                  {feature.title}
                </h3>

                <p
                  className="text-sm"
                  style={{ color: '#6B7280' }}
                >
                  {feature.text}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ============================================================
          BECOME AN OWNER CTA
      ============================================================ */}

      <section className="max-w-7xl mx-auto px-5 lg:px-8 pb-16">
        <div
          className="rh-card p-8 sm:p-12 grid lg:grid-cols-[1.2fr_0.8fr] gap-8 items-center"
          style={{
            background: '#0F1B3D',
            border: 'none',
          }}
        >
          <div>
            <h2 className="rh-heading text-2xl sm:text-3xl font-extrabold text-white">
              Have Equipment You Don't Use Every Day?
            </h2>

            <p
              className="mt-3 text-sm max-w-md"
              style={{ color: '#93A3C7' }}
            >
              Turn your unused equipment into extra income by
              listing it on RentHub.
            </p>

            {canManageEquipment && (
              <Link
                to="/list-equipment"
                className="rh-btn-primary inline-block mt-6 px-6 py-3 text-sm"
              >
                Start Renting Out
              </Link>
            )}
          </div>

          <div className="flex gap-3 justify-center">
            {['📷', '💻', '🛠'].map((emoji, index) => (
              <div
                key={index}
                className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl bg-white"
                style={{
                  marginTop:
                    index === 1 ? '-16px' : 0,
                }}
              >
                {emoji}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          POPULAR NEAR YOU
      ============================================================ */}

      <section className="max-w-7xl mx-auto px-5 lg:px-8 py-16">
        <div className="flex items-end justify-between mb-8 flex-wrap gap-3">
          <h2
            className="rh-heading text-3xl font-bold"
            style={{ color: '#0F1B3D' }}
          >
            Popular Near You
          </h2>

          <div
            className="flex gap-2 text-xs font-medium"
            style={{ color: '#6B7280' }}
          >
            {[
              'Distance',
              'Price',
              'Rating',
              'Availability',
            ].map((filter) => (
              <button
                type="button"
                key={filter}
                className="px-3 py-1.5 rounded-full border cursor-pointer hover:bg-gray-50"
                style={{ borderColor: '#E5E7EB' }}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {NEAR_YOU.map((item) => (
            <Link
              to={`/equipment/${item.id}`}
              key={item.id}
              className="rh-card p-4 flex items-center gap-3"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0"
                style={{ background: '#F7F9FC' }}
              >
                📍
              </div>

              <div className="min-w-0">
                <p
                  className="text-sm font-semibold truncate"
                  style={{ color: '#111827' }}
                >
                  {item.name}
                </p>

                <p
                  className="text-xs"
                  style={{ color: '#9CA3AF' }}
                >
                  {item.location} · {formatVnd(item.price)}/day
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ============================================================
          REVIEWS
      ============================================================ */}

      <section
        className="py-16"
        style={{ background: '#F7F9FC' }}
      >
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-12">
            <h2
              className="rh-heading text-3xl font-bold"
              style={{ color: '#0F1B3D' }}
            >
              What Our Users Say
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {REVIEWS.map((review) => (
              <div
                key={review.name}
                className="rh-card p-6 bg-white"
              >
                <div className="flex gap-1 mb-3">
                  {Array.from({ length: 5 }).map(
                    (_, index) => (
                      <Icon.star key={index} />
                    )
                  )}
                </div>

                <p
                  className="text-sm"
                  style={{ color: '#374151' }}
                >
                  &ldquo;{review.text}&rdquo;
                </p>

                <p
                  className="text-sm font-semibold mt-4"
                  style={{ color: '#111827' }}
                >
                  {review.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          STATISTICS
      ============================================================ */}

      <section className="max-w-7xl mx-auto px-5 lg:px-8 py-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
          {STATS.map((stat) => (
            <div key={stat.label}>
              <div
                className="rh-heading text-3xl sm:text-4xl font-extrabold"
                style={{ color: '#2F5FE0' }}
              >
                {stat.value}
              </div>

              <div
                className="text-sm mt-1.5"
                style={{ color: '#6B7280' }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ============================================================
          FINAL CTA
      ============================================================ */}

      <section className="max-w-7xl mx-auto px-5 lg:px-8 pb-20">
        <div
          className="rounded-3xl text-center py-14 px-6"
          style={{ background: '#0F1B3D' }}
        >
          <h2 className="rh-heading text-3xl font-extrabold text-white">
            Ready to Start Renting?
          </h2>

          <p
            className="mt-3 text-sm max-w-md mx-auto"
            style={{ color: '#93A3C7' }}
          >
            Find the equipment you need or start earning from
            the equipment you already own.
          </p>

          <div className="mt-7 flex flex-wrap gap-3 justify-center">
            <Link
              to="/browse"
              className="rh-btn-primary px-6 py-3 text-sm"
            >
              Explore Equipment
            </Link>

            {canManageEquipment && (
              <Link
                to="/list-equipment"
                className="px-6 py-3 text-sm font-semibold rounded-lg text-white border"
                style={{
                  borderColor:
                    'rgba(255,255,255,0.3)',
                }}
              >
                List Your Equipment
              </Link>
            )}
          </div>
        </div>
      </section>

      <AppFooter />
    </div>
  );
}