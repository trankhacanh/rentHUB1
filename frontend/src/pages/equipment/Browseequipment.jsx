import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../../services/axiosClient';
import { formatVnd } from '../../utils/currency';
import { usePreferences } from '../../context/preferences';

/* ================================================================== */
/* Icons                                                                */
/* ================================================================== */

const Icon = {
  search: (p) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>,
  message: (p) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H6l-3 2v-5.5A7.5 7.5 0 1 1 20 11.5z" /></svg>,
  heart: (p) => <svg width="17" height="17" viewBox="0 0 24 24" fill={p.filled ? '#EF4444' : 'none'} stroke={p.filled ? '#EF4444' : '#374151'} strokeWidth="1.8"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" /></svg>,
  star: (p) => <svg width="13" height="13" viewBox="0 0 24 24" fill={p.empty ? '#E5E7EB' : '#F59E0B'} stroke={p.empty ? '#E5E7EB' : '#F59E0B'}><path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.9L12 17.8 5.8 21l1.2-6.9-5-4.9 6.9-1z" /></svg>,
  pin: (p) => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 1 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>,
  sliders: (p) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><line x1="4" y1="6" x2="20" y2="6" /><circle cx="9" cy="6" r="2" fill="#fff" /><line x1="4" y1="12" x2="20" y2="12" /><circle cx="15" cy="12" r="2" fill="#fff" /><line x1="4" y1="18" x2="20" y2="18" /><circle cx="7" cy="18" r="2" fill="#fff" /></svg>,
  chevronLeft: (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}><path d="M15 6l-6 6 6 6" /></svg>,
  chevronRight: (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}><path d="M9 6l6 6-6 6" /></svg>,
  close: (p) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><path d="M18 6L6 18M6 6l12 12" /></svg>,
  box: (p) => <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.4" {...p}><path d="M21 8V21H3V8" /><path d="M1 3h22v5H1z" /><path d="M10 12h4" /></svg>,
};

const CATEGORY_ICON = {
  Camera: '📷', Laptop: '💻', Drone: '🚁', Projector: '🎥',
  Audio: '🔊', Gaming: '🎮', Lighting: '💡', Other: '📦',
};

const CONDITIONS = ['Like New', 'Excellent', 'Good'];
const SORT_OPTIONS = ['Recommended', 'Price: Low to High', 'Price: High to Low', 'Highest Rated', 'Newest'];
const RATING_OPTIONS = [4.5, 4.0, 3.5];
const ITEMS_PER_PAGE = 8;

const STATUS_META = {
  AVAILABLE: { label: 'Available', bg: '#ECFDF3', color: '#16A34A' },
  RENTED: { label: 'Currently Rented', bg: '#FEF9C3', color: '#A16207' },
  AVAILABLE_SOON: { label: 'Available Soon', bg: '#EFF6FF', color: '#2563EB' },
};

function normalizeEquipment(item) {
  return {
    ...item,
    title: item.title || 'Untitled equipment',
    category: item.categoryName || 'Other',
    location: [item.district, item.city].filter(Boolean).join(', ') || item.address || 'Location unavailable',
    pricePerDay: Number(item.pricePerDay),
    condition: item.condition || 'Other',
    rating: Number(item.rating) || 0,
    reviewCount: Number(item.reviewCount) || 0,
    createdAt: item.createdAt || item.updatedAt || 0,
    icon: CATEGORY_ICON[item.categoryName] || '📦',
  };
}

/* ================================================================== */
/* Sub-components (kept in this one file for now — split into         */
/* pages/equipment/BrowseEquipment.jsx + components/equipment/*.jsx    */
/* whenever convenient).                                               */
/* ================================================================== */

function EquipmentCard({ item, isFavorite, onToggleFavorite }) {
  const { t } = usePreferences();
  const status = STATUS_META[item.status] || STATUS_META.AVAILABLE;
  return (
    <div className="rh-card rh-card-hover overflow-hidden">
      <div className="relative h-40 flex items-center justify-center text-5xl" style={{ background: '#F7F9FC' }}>
        <Link to={`/equipment/${item.id}`} className="absolute inset-0 flex items-center justify-center">
          {item.icon}
        </Link>
        {item.coverImageUrl && (
          <Link to={`/equipment/${item.id}`} className="absolute inset-0">
            <img
              src={item.coverImageUrl}
              alt={item.title}
              className="w-full h-full object-cover"
              onError={(event) => {
                event.currentTarget.style.display = 'none';
              }}
            />
          </Link>
        )}
        <span className="absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-full pointer-events-none" style={{ background: status.bg, color: status.color }}>
          {status.label}
        </span>
        <button
          onClick={() => onToggleFavorite(item.id)}
          aria-label="Toggle favorite"
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white flex items-center justify-center transition-transform active:scale-90"
          style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}
        >
          <Icon.heart filled={isFavorite} />
        </button>
      </div>
      <div className="p-4">
        <Link to={`/equipment/${item.id}`} className="block">
          <h3 className="font-semibold text-sm truncate" style={{ color: '#111827' }}>{item.title}</h3>
        </Link>
        <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>{item.category}</p>
        <div className="flex items-center gap-1 mt-2 text-xs" style={{ color: '#6B7280' }}>
          <Icon.pin /> <span className="truncate">{item.location}</span>
        </div>
        <div className="flex items-center gap-1 mt-1.5 text-xs" style={{ color: '#6B7280' }}>
          <Icon.star /> <span style={{ color: '#111827' }} className="font-medium">{item.rating}</span>
          <span style={{ color: '#9CA3AF' }}>({item.reviewCount} reviews)</span>
        </div>
        <p className="text-sm font-bold mt-3" style={{ color: '#0F1B3D' }}>
          {formatVnd(item.pricePerDay)}<span className="text-xs font-normal" style={{ color: '#9CA3AF' }}> / day</span>
        </p>
        <Link to={`/equipment/${item.id}`} className="rh-btn-primary w-full text-center block mt-3 py-2.5 text-sm">{t('View Details')}</Link>
      </div>
    </div>
  );
}

function LoadingSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rh-card overflow-hidden">
          <div className="rh-skel h-40 w-full" style={{ borderRadius: 0 }} />
          <div className="p-4">
            <div className="rh-skel h-4 w-3/4 mb-2" />
            <div className="rh-skel h-3 w-1/3 mb-3" />
            <div className="rh-skel h-3 w-2/3 mb-2" />
            <div className="rh-skel h-3 w-1/2 mb-3" />
            <div className="rh-skel h-4 w-1/3 mb-3" />
            <div className="rh-skel h-9 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ onClearFilters }) {
  return (
    <div className="rh-card p-14 text-center flex flex-col items-center">
      <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: '#F7F9FC' }}>
        <Icon.box />
      </div>
      <p className="font-semibold text-sm" style={{ color: '#111827' }}>No equipment found</p>
      <p className="text-sm mt-1.5" style={{ color: '#6B7280' }}>Try adjusting your search or filters.</p>
      <button onClick={onClearFilters} className="rh-btn-primary px-5 py-2.5 text-sm mt-5">Clear all filters</button>
    </div>
  );
}

function EquipmentGrid({ items, loading, favorites, onToggleFavorite, onClearFilters }) {
  if (loading) return <LoadingSkeleton />;
  if (items.length === 0) return <EmptyState onClearFilters={onClearFilters} />;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {items.map((item) => (
        <EquipmentCard key={item.id} item={item} isFavorite={favorites.has(item.id)} onToggleFavorite={onToggleFavorite} />
      ))}
    </div>
  );
}

function EquipmentSearch({ value, onChange }) {
  const { t } = usePreferences();
  return (
    <div className="rh-card p-2 flex flex-col sm:flex-row gap-2 max-w-2xl mx-auto" style={{ boxShadow: '0 12px 30px -16px rgba(15,27,61,0.15)' }}>
      <div className="flex items-center gap-2.5 px-3.5 flex-1 h-12">
        <Icon.search style={{ color: '#9CA3AF' }} />
        <input
          className="w-full text-sm outline-none"
          placeholder={t('Search equipment')}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
      <button type="button" className="rh-btn-primary px-6 h-12 text-sm shrink-0">{t('Search')}</button>
    </div>
  );
}

function SortDropdown({ value, onChange }) {
  const { t } = usePreferences();
  return (
    <div className="flex items-center gap-2">
      <label className="text-sm shrink-0" style={{ color: '#6B7280' }}>{t('Sort by')}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 pl-3 pr-8 rounded-lg text-sm"
        style={{ border: '1px solid #E5E7EB', background: '#fff', color: '#374151' }}
      >
        {SORT_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </div>
  );
}

function Pagination({ currentPage, totalPages, onChange }) {
  const { t } = usePreferences();
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  return (
    <div className="flex items-center justify-center gap-2 mt-10">
      <button onClick={() => onChange(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="w-9 h-9 rounded-lg flex items-center justify-center disabled:opacity-40" style={{ border: '1px solid #E5E7EB', color: '#374151' }} aria-label={t('Previous page')}>
        <Icon.chevronLeft />
      </button>
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className="w-9 h-9 rounded-lg text-sm font-medium"
          style={{ border: `1px solid ${p === currentPage ? '#2F5FE0' : '#E5E7EB'}`, background: p === currentPage ? '#2F5FE0' : '#fff', color: p === currentPage ? '#fff' : '#374151' }}
        >
          {p}
        </button>
      ))}
      <button onClick={() => onChange(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} className="w-9 h-9 rounded-lg flex items-center justify-center disabled:opacity-40" style={{ border: '1px solid #E5E7EB', color: '#374151' }} aria-label={t('Next page')}>
        <Icon.chevronRight />
      </button>
    </div>
  );
}

function FilterSection({ title, children }) {
  const { t } = usePreferences();
  return (
    <div className="py-5 border-b last:border-b-0" style={{ borderColor: '#EEF0F3' }}>
      <h3 className="text-sm font-semibold mb-3" style={{ color: '#111827' }}>{t(title)}</h3>
      {children}
    </div>
  );
}

function RadioRow({ label, checked, onChange }) {
  const { t } = usePreferences();
  return (
    <label className="flex items-center gap-2.5 text-sm py-1 cursor-pointer" style={{ color: '#374151' }}>
      <input type="radio" checked={checked} onChange={onChange} style={{ accentColor: '#2F5FE0' }} />
      {t(label)}
    </label>
  );
}

function EquipmentFilter({ filters, setFilters, onClear, categories }) {
  const { t } = usePreferences();
  const set = (key, val) => setFilters((f) => ({ ...f, [key]: val }));
  const toggleCondition = (c) => {
    setFilters((f) => {
      const next = new Set(f.conditions);
      next.has(c) ? next.delete(c) : next.add(c);
      return { ...f, conditions: next };
    });
  };

  return (
    <div className="rh-card p-5">
      <div className="flex items-center justify-between mb-1">
        <h2 className="rh-heading text-base font-bold" style={{ color: '#0F1B3D' }}>{t('Filters')}</h2>
        <button onClick={onClear} className="text-xs font-semibold" style={{ color: '#2F5FE0' }}>{t('Clear Filters')}</button>
      </div>

      <FilterSection title="Category">
        {categories.map((c) => <RadioRow key={c} label={c} checked={filters.category === c} onChange={() => set('category', c)} />)}
      </FilterSection>

      <FilterSection title="Price per Day (VND)">
        <div className="flex items-center gap-2">
          <input type="number" placeholder="Min" value={filters.minPrice} onChange={(e) => set('minPrice', e.target.value)} className="w-full h-10 px-3 rounded-lg text-sm" style={{ border: '1px solid #E5E7EB' }} />
          <span className="text-sm" style={{ color: '#9CA3AF' }}>–</span>
          <input type="number" placeholder="Max" value={filters.maxPrice} onChange={(e) => set('maxPrice', e.target.value)} className="w-full h-10 px-3 rounded-lg text-sm" style={{ border: '1px solid #E5E7EB' }} />
        </div>
      </FilterSection>

      <FilterSection title="Location">
        <input type="text" placeholder={t('Enter location')} value={filters.location} onChange={(e) => set('location', e.target.value)} className="w-full h-10 px-3 rounded-lg text-sm" style={{ border: '1px solid #E5E7EB' }} />
      </FilterSection>

      <FilterSection title="Availability">
        <RadioRow label="Any time" checked={filters.availability === 'any'} onChange={() => set('availability', 'any')} />
        <RadioRow label="Available now" checked={filters.availability === 'now'} onChange={() => set('availability', 'now')} />
        <RadioRow label="Available on selected date" checked={filters.availability === 'date'} onChange={() => set('availability', 'date')} />
        {filters.availability === 'date' && (
          <input type="date" value={filters.selectedDate} onChange={(e) => set('selectedDate', e.target.value)} className="w-full h-10 px-3 rounded-lg text-sm mt-2" style={{ border: '1px solid #E5E7EB' }} />
        )}
      </FilterSection>

      <FilterSection title="Rating">
        <RadioRow label="Any rating" checked={filters.minRating === 0} onChange={() => set('minRating', 0)} />
        {RATING_OPTIONS.map((r) => <RadioRow key={r} label={`${r}+`} checked={filters.minRating === r} onChange={() => set('minRating', r)} />)}
      </FilterSection>

      <FilterSection title="Condition">
        {CONDITIONS.map((c) => (
          <label key={c} className="flex items-center gap-2.5 text-sm py-1 cursor-pointer" style={{ color: '#374151' }}>
            <input type="checkbox" checked={filters.conditions.has(c)} onChange={() => toggleCondition(c)} style={{ accentColor: '#2F5FE0' }} />
            {c}
          </label>
        ))}
      </FilterSection>
    </div>
  );
}

/* ================================================================== */
/* Page                                                                 */
/* ================================================================== */

const INITIAL_FILTERS = {
  category: 'All Categories',
  minPrice: '',
  maxPrice: '',
  location: '',
  availability: 'any',
  selectedDate: '',
  minRating: 0,
  conditions: new Set(),
};

export default function BrowseEquipment() {
  const { t } = usePreferences();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [sort, setSort] = useState('Recommended');
  const [page, setPage] = useState(1);
  const [favorites, setFavorites] = useState(new Set());
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [loginNotice, setLoginNotice] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const isLoggedIn = !!currentUser;

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      setAuthLoading(false);
      return;
    }

    axiosClient.get('/users/me')
      .then((response) => {
        setCurrentUser(response.data);
      })
      .catch(() => {
        localStorage.removeItem('token');
        setCurrentUser(null);
      })
      .finally(() => {
        setAuthLoading(false);
      });
  }, []);

  const getInitials = (user) => {
    if (!user) return '';
    return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setCurrentUser(null);
    setUserMenuOpen(false);
  };

  
useEffect(() => {
  let cancelled = false;

  const fetchEquipment = async () => {
    try {
      const response = await axiosClient.get('/equipments');
      const data = response.data?.data;

      if (!Array.isArray(data)) {
        throw new Error('Invalid equipment response format.');
      }

      if (!cancelled) {
        setItems(data.map(normalizeEquipment));
        setLoadError(false);
      }
    } catch (error) {
      if (!cancelled) {
        console.error('Unable to load equipment:', error);
        setLoadError(true);
        setItems([]);
      }
    } finally {
      if (!cancelled) {
        setLoading(false);
      }
    }
  };

  fetchEquipment();

  return () => {
    cancelled = true;
  };
}, []);


  useEffect(() => setPage(1), [search, filters, sort]);

  const handleClearFilters = () => {
    setFilters(INITIAL_FILTERS);
    setSearch('');
  };

  const handleToggleFavorite = (id) => {
    if (!isLoggedIn) {
      setLoginNotice(true);
      setTimeout(() => setLoginNotice(false), 3500);
      return;
    }
    setFavorites((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();

    let result = items.filter((item) => {
      const matchesSearch = q ? [item.title, item.category, item.location].some((f) => f.toLowerCase().includes(q)) : true;
      const matchesCategory = filters.category === 'All Categories' || item.category === filters.category;

      const min = parseFloat(filters.minPrice);
      const max = parseFloat(filters.maxPrice);
      const matchesMin = Number.isNaN(min) ? true : item.pricePerDay >= min;
      const matchesMax = Number.isNaN(max) ? true : item.pricePerDay <= max;

      const matchesLocation = filters.location.trim() ? item.location.toLowerCase().includes(filters.location.trim().toLowerCase()) : true;

      let matchesAvailability = true;
      if (filters.availability === 'now') {
        matchesAvailability = item.status === 'AVAILABLE';
      } else if (filters.availability === 'date' && filters.selectedDate) {
        matchesAvailability = item.status !== 'RENTED' && filters.selectedDate >= item.availableFrom && filters.selectedDate <= item.availableUntil;
      }

      const matchesRating = item.rating >= filters.minRating;
      const matchesCondition = filters.conditions.size === 0 || filters.conditions.has(item.condition);

      return matchesSearch && matchesCategory && matchesMin && matchesMax && matchesLocation && matchesAvailability && matchesRating && matchesCondition;
    });

    switch (sort) {
      case 'Price: Low to High': result = [...result].sort((a, b) => a.pricePerDay - b.pricePerDay); break;
      case 'Price: High to Low': result = [...result].sort((a, b) => b.pricePerDay - a.pricePerDay); break;
      case 'Highest Rated': result = [...result].sort((a, b) => b.rating - a.rating); break;
      case 'Newest': result = [...result].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); break;
      default: break; // Recommended: keep original order
    }

    return result;
  }, [items, search, filters, sort]);

  const categories = useMemo(
    () => ['All Categories', ...new Set(items.map((item) => item.category).filter(Boolean))],
    [items]
  );

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / ITEMS_PER_PAGE));
  const pagedItems = filteredItems.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <div className="rh-root" style={{ background: '#F7F9FC', color: '#111827' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800&family=Inter:wght@400;500;600&display=swap');
        .rh-root { font-family: 'Inter', sans-serif; }
        .rh-heading { font-family: 'Plus Jakarta Sans', sans-serif; }
        .rh-card { border: 1px solid #EEF0F3; border-radius: 16px; background: #fff; }
        .rh-card-hover { transition: box-shadow .2s ease, transform .2s ease; position: relative; }
        .rh-card-hover:hover { box-shadow: 0 16px 32px -16px rgba(15,27,61,0.18); transform: translateY(-3px); }
        .rh-btn-primary { background: #2F5FE0; color: #fff; font-weight: 600; border-radius: 10px; transition: background .15s ease; }
        .rh-btn-primary:hover { background: #274DBD; }
        .rh-btn-outline { border: 1px solid #E5E7EB; color: #374151; font-weight: 600; border-radius: 10px; background: #fff; transition: background .15s ease; }
        .rh-btn-outline:hover { background: #F9FAFB; }
        .rh-skel { background: linear-gradient(90deg, #F1F3F6 25%, #E9ECF1 37%, #F1F3F6 63%); background-size: 400% 100%; animation: rh-shimmer 1.4s ease infinite; }
        @keyframes rh-shimmer { 0% { background-position: 100% 0; } 100% { background-position: 0 0; } }
        @media (prefers-reduced-motion: reduce) { .rh-skel { animation: none; } .rh-card-hover:hover { transform: none; } }
      `}</style>




      {/* ---------------- HERO ---------------- */}
      <section className="px-5 lg:px-8 pt-12 pb-8 text-center" style={{ background: '#fff' }}>
        <h1 className="rh-heading text-3xl sm:text-4xl font-extrabold" style={{ color: '#0F1B3D' }}>{t('Browse Equipment')}</h1>
        <p className="text-sm mt-2" style={{ color: '#6B7280' }}>{t('Find the right equipment for your next project.')}</p>
        <div className="mt-6"><EquipmentSearch value={search} onChange={setSearch} /></div>
      </section>

      {loginNotice && (
        <div className="max-w-7xl mx-auto px-5 lg:px-8 pt-4">
          <div className="rounded-lg px-4 py-3 text-sm" style={{ background: '#EFF6FF', color: '#2F5FE0', border: '1px solid #DBEAFE' }}>
            {t('Please login to save equipment to your favorites.')}
          </div>
        </div>
      )}

      {/* ---------------- BODY: SIDEBAR + GRID ---------------- */}
      <div className="max-w-7xl mx-auto px-5 lg:px-8 py-8 grid lg:grid-cols-[280px_1fr] gap-8">
        <aside className="hidden lg:block h-fit sticky top-24">
          <EquipmentFilter filters={filters} setFilters={setFilters} onClear={handleClearFilters} categories={categories} />
        </aside>

        <div>
          <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
            <p className="text-sm" style={{ color: '#6B7280' }}>
              {loading ? `${t('Searching')}...` : loadError ? t('Unable to load equipment') : `${filteredItems.length} ${t('equipment found')}`}
            </p>
            <div className="flex items-center gap-3">
              <button onClick={() => setMobileFilterOpen(true)} className="lg:hidden rh-btn-outline flex items-center gap-2 px-4 py-2 text-sm">
                <Icon.sliders /> {t('Filters')}
              </button>
              <SortDropdown value={sort} onChange={setSort} />
            </div>
          </div>

          <EquipmentGrid
            items={pagedItems}
            loading={loading}
            favorites={favorites}
            onToggleFavorite={handleToggleFavorite}
            onClearFilters={handleClearFilters}
          />

          {!loading && <Pagination currentPage={page} totalPages={totalPages} onChange={setPage} />}
        </div>
      </div>

      {/* ---------------- MOBILE FILTER DRAWER ---------------- */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0" style={{ background: 'rgba(15,27,61,0.45)' }} onClick={() => setMobileFilterOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-[85%] max-w-sm bg-white overflow-y-auto">
            <div className="sticky top-0 bg-white flex items-center justify-between px-5 h-16 border-b" style={{ borderColor: '#EEF0F3' }}>
              <h2 className="rh-heading text-base font-bold" style={{ color: '#0F1B3D' }}>{t('Filters')}</h2>
              <button onClick={() => setMobileFilterOpen(false)} aria-label={t('Close filters')}><Icon.close /></button>
            </div>
            <div className="p-5">
              <EquipmentFilter filters={filters} setFilters={setFilters} onClear={handleClearFilters} categories={categories} />
              <button onClick={() => setMobileFilterOpen(false)} className="rh-btn-primary w-full py-3 text-sm mt-5">
                {t('Show results')} ({filteredItems.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}