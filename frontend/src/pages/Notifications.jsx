
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import notificationService from '../services/notificationService';

/* ================================================================== */
/* Icons                                                              */
/* ================================================================== */

const Icon = {
  bell: (p) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}>
      <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </svg>
  ),

  calendar: (p) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2F5FE0" strokeWidth="1.8" {...p}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 10h18" />
    </svg>
  ),

  wallet: (p) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="1.8" {...p}>
      <rect x="2" y="6" width="20" height="14" rx="2" />
      <path d="M16 12h4" />
      <path d="M2 10h20" />
    </svg>
  ),

  message: (p) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="1.8" {...p}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),

  box: (p) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="1.8" {...p}>
      <path d="M21 8V21H3V8" />
      <path d="M1 3h22v5H1z" />
      <path d="M10 12h4" />
    </svg>
  ),

  star: (p) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#F59E0B" stroke="#F59E0B" {...p}>
      <path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.9L12 17.8 5.8 21l1.2-6.9-5-4.9 6.9-1z" />
    </svg>
  ),

  shield: (p) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="1.8" {...p}>
      <path d="M12 2l8 4v6c0 5-3.4 8.4-8 10-4.6-1.6-8-5-8-10V6z" />
    </svg>
  ),

  search: (p) => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </svg>
  ),

  dots: (p) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" {...p}>
      <circle cx="5" cy="12" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="19" cy="12" r="1.6" />
    </svg>
  ),

  check: (p) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" {...p}>
      <path d="M20 6L9 17l-5-5" />
    </svg>
  ),

  trash: (p) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}>
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6" />
    </svg>
  ),

  settings: (p) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 0 1-4 0v-.09A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.55-1H3a2 2 0 0 1 0-4h.09A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.55V3a2 2 0 0 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9a1.7 1.7 0 0 0 1.55 1H21a2 2 0 0 1 0 4h-.09a1.7 1.7 0 0 0-1.51 1z" />
    </svg>
  ),
};

/* ================================================================== */
/* Category metadata                                                   */
/* ================================================================== */

const CATEGORY_META = {
  Booking: {
    icon: Icon.calendar,
    bg: 'rgba(47,95,224,0.10)',
  },

  Payment: {
    icon: Icon.wallet,
    bg: 'rgba(22,163,74,0.10)',
  },

  Message: {
    icon: Icon.message,
    bg: 'rgba(124,58,237,0.10)',
  },

  Equipment: {
    icon: Icon.box,
    bg: 'rgba(217,119,6,0.10)',
  },

  Review: {
    icon: Icon.star,
    bg: 'rgba(245,158,11,0.10)',
  },

  System: {
    icon: Icon.shield,
    bg: 'rgba(107,114,128,0.10)',
  },
};

/* ================================================================== */
/* Helpers                                                            */
/* ================================================================== */

function getCategory(type) {
  if (!type) return 'System';

  if (type.startsWith('BOOKING')) {
    return 'Booking';
  }

  if (type.startsWith('PAYMENT')) {
    return 'Payment';
  }

  if (type.startsWith('MESSAGE')) {
    return 'Message';
  }

  if (type.startsWith('EQUIPMENT')) {
    return 'Equipment';
  }

  if (type.startsWith('REVIEW')) {
    return 'Review';
  }

  return 'System';
}

function formatNotificationTime(createdAt) {
  if (!createdAt) return '';

  const date = new Date(createdAt);
  const now = new Date();

  const diffMs = now - date;
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) {
    return 'Just now';
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours < 24) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  }

  const diffDays = Math.floor(diffHours / 24);

  if (diffDays === 1) {
    return 'Yesterday';
  }

  if (diffDays < 7) {
    return `${diffDays} days ago`;
  }

  return date.toLocaleDateString();
}

function getNotificationGroup(createdAt) {
  if (!createdAt) return 'Older';

  const date = new Date(createdAt);
  const now = new Date();

  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);

  const diffMs = startOfToday - date;
  const diffDays = Math.floor(diffMs / 86400000);

  if (date >= startOfToday) {
    return 'Today';
  }

  if (date >= startOfYesterday) {
    return 'Yesterday';
  }

  if (diffDays < 7) {
    return 'This Week';
  }

  return 'Older';
}

function mapNotification(notification) {
  return {
    id: notification.id,
    category: getCategory(notification.type),
    title: notification.title,
    text: notification.message,
    time: formatNotificationTime(notification.createdAt),
    group: getNotificationGroup(notification.createdAt),
    read: notification.read,
    createdAt: notification.createdAt,
    type: notification.type,
    referenceId: notification.referenceId,
    referenceType: notification.referenceType,
  };
}

/* ================================================================== */
/* Main component                                                      */
/* ================================================================== */

const GROUP_ORDER = ['Today', 'Yesterday', 'This Week', 'Older'];

const TABS = [
  'all',
  'unread',
  'Booking',
  'Payment',
  'Message',
  'Equipment',
  'Review',
  'System',
];

const FILTER_OPTIONS = TABS;

const TAB_LABEL = {
  all: 'All',
  unread: 'Unread',
  Booking: 'Bookings',
  Payment: 'Payments',
  Message: 'Messages',
  Equipment: 'Equipment',
  Review: 'Reviews',
  System: 'System',
};

export default function Notifications() {
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);

  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('Newest');
  const [openMenuId, setOpenMenuId] = useState(null);

  /* ================================================================ */
  /* Load notifications from backend                                  */
  /* ================================================================ */

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response =
          await notificationService.getMyNotifications();

        const mappedNotifications =
          response.data.map(mapNotification);

        setNotifications(mappedNotifications);
      } catch (error) {
        console.error(
          'Failed to fetch notifications:',
          error
        );
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  /* ================================================================ */
  /* Counts                                                            */
  /* ================================================================ */

  const counts = useMemo(() => {
    const c = {
      all: notifications.length,
      unread: notifications.filter((n) => !n.read).length,
    };

    [
      'Booking',
      'Payment',
      'Message',
      'Equipment',
      'Review',
      'System',
    ].forEach((category) => {
      c[category] = notifications.filter(
        (n) => n.category === category
      ).length;
    });

    return c;
  }, [notifications]);

  /* ================================================================ */
  /* Filtering                                                         */
  /* ================================================================ */

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    let result = notifications.filter((n) => {
      const matchesTab =
        tab === 'all'
          ? true
          : tab === 'unread'
            ? !n.read
            : n.category === tab;

      const matchesSearch = q
        ? `${n.title} ${n.text}`
            .toLowerCase()
            .includes(q)
        : true;

      return matchesTab && matchesSearch;
    });

    result = [...result].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();

      return sort === 'Newest'
        ? dateB - dateA
        : dateA - dateB;
    });

    return result;
  }, [notifications, tab, search, sort]);

  /* ================================================================ */
  /* Group notifications                                               */
  /* ================================================================ */

  const grouped = useMemo(() => {
    if (sort === 'Oldest') {
      return null;
    }

    const map = {};

    filtered.forEach((n) => {
      if (!map[n.group]) {
        map[n.group] = [];
      }

      map[n.group].push(n);
    });

    return map;
  }, [filtered, sort]);

  /* ================================================================ */
  /* Mark all as read                                                   */
  /* ================================================================ */

  const markAllRead = async () => {
    try {
      await notificationService.markAllAsRead();

      setNotifications((list) =>
        list.map((n) => ({
          ...n,
          read: true,
        }))
      );
    } catch (error) {
      console.error(
        'Failed to mark all notifications as read:',
        error
      );
    }
  };

  /* ================================================================ */
  /* Mark one notification as read                                      */
  /* ================================================================ */

  const markRead = async (id) => {
    try {
      await notificationService.markAsRead(id);

      setNotifications((list) =>
        list.map((n) =>
          n.id === id
            ? {
                ...n,
                read: true,
              }
            : n
        )
      );
    } catch (error) {
      console.error(
        'Failed to mark notification as read:',
        error
      );
    }
  };

  /* ================================================================ */
  /* Delete notification                                                */
  /* ================================================================ */

  const deleteNotification = async (id) => {
    try {
      await notificationService.deleteNotification(id);

      setNotifications((list) =>
        list.filter((n) => n.id !== id)
      );
    } catch (error) {
      console.error(
        'Failed to delete notification:',
        error
      );
    }
  };

  /* ================================================================ */
  /* Render                                                             */
  /* ================================================================ */

  return (
    <div
      className="rh-root min-h-screen"
      style={{
        background: '#F7F9FC',
        color: '#111827',
      }}
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
          border: 1px solid #EEF0F3;
          border-radius: 16px;
          background: #fff;
        }

        .rh-btn-primary {
          background: #2F5FE0;
          color: #fff;
          font-weight: 600;
          border-radius: 10px;
          transition: background .15s ease;
        }

        .rh-btn-primary:hover {
          background: #274DBD;
        }

        .rh-btn-outline {
          border: 1px solid #E5E7EB;
          color: #374151;
          font-weight: 600;
          border-radius: 10px;
          background: #fff;
          transition: background .15s ease;
        }

        .rh-btn-outline:hover {
          background: #F9FAFB;
        }

        .rh-tab {
          transition: background .15s ease, color .15s ease;
        }

        .rh-item {
          transition: background .15s ease;
          position: relative;
        }

        .rh-item:hover .rh-more-btn {
          opacity: 1;
        }

        .rh-more-btn {
          opacity: 0;
          transition: opacity .15s ease;
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
          border-radius: 8px;
        }

        @keyframes rh-shimmer {
          0% {
            background-position: 100% 0;
          }

          100% {
            background-position: 0 0;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .rh-skel {
            animation: none;
          }
        }
      `}</style>

      <div className="max-w-4xl mx-auto px-5 lg:px-8 py-8 sm:py-10">

        {/* ========================================================== */}
        {/* HEADER                                                      */}
        {/* ========================================================== */}

        <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
          <div>
            <h1
              className="rh-heading text-2xl sm:text-3xl font-extrabold"
              style={{ color: '#0F1B3D' }}
            >
              Notifications
            </h1>

            <p
              className="text-sm mt-1.5"
              style={{ color: '#6B7280' }}
            >
              Stay updated with your rentals, payments, messages,
              and account activity.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={markAllRead}
              disabled={counts.unread === 0}
              className="rh-btn-outline px-4 py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Mark all as read
            </button>

            <button
              className="rh-btn-outline p-2.5"
              aria-label="Notification settings"
            >
              <Icon.settings />
            </button>
          </div>
        </div>

        {/* ========================================================== */}
        {/* SUMMARY TABS                                                 */}
        {/* ========================================================== */}

        <div className="flex items-center gap-2 overflow-x-auto pb-1 mb-4">
          {TABS.map((t) => {
            const active = tab === t;

            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="rh-tab shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
                style={{
                  background: active ? '#2F5FE0' : '#fff',
                  color: active ? '#fff' : '#374151',
                  border: `1px solid ${
                    active ? '#2F5FE0' : '#E5E7EB'
                  }`,
                }}
              >
                {TAB_LABEL[t]}

                <span
                  className="text-xs font-semibold px-1.5 py-0.5 rounded-full"
                  style={{
                    background: active
                      ? 'rgba(255,255,255,0.25)'
                      : '#F1F3F6',

                    color: active
                      ? '#fff'
                      : '#6B7280',
                  }}
                >
                  {counts[t] ?? 0}
                </span>
              </button>
            );
          })}
        </div>

        {/* ========================================================== */}
        {/* SEARCH / FILTER / SORT                                      */}
        {/* ========================================================== */}

        <div className="flex flex-col sm:flex-row gap-2.5 mb-6">

          <div
            className="flex items-center gap-2 h-11 px-3.5 rounded-lg flex-1"
            style={{
              border: '1px solid #E5E7EB',
              background: '#fff',
            }}
          >
            <Icon.search style={{ color: '#9CA3AF' }} />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notifications"
              className="w-full text-sm outline-none"
            />
          </div>

          <select
            value={tab}
            onChange={(e) => setTab(e.target.value)}
            className="h-11 px-3.5 rounded-lg text-sm"
            style={{
              border: '1px solid #E5E7EB',
              background: '#fff',
              color: '#374151',
            }}
          >
            {FILTER_OPTIONS.map((f) => (
              <option key={f} value={f}>
                {TAB_LABEL[f]}
              </option>
            ))}
          </select>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="h-11 px-3.5 rounded-lg text-sm"
            style={{
              border: '1px solid #E5E7EB',
              background: '#fff',
              color: '#374151',
            }}
          >
            <option>Newest</option>
            <option>Oldest</option>
          </select>
        </div>

        {/* ========================================================== */}
        {/* LOADING                                                      */}
        {/* ========================================================== */}

        {loading ? (
          <div
            className="rh-card divide-y"
            style={{ borderColor: '#EEF0F3' }}
          >
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex gap-3.5 p-5"
              >
                <div className="rh-skel w-10 h-10 rounded-full shrink-0" />

                <div className="flex-1">
                  <div className="rh-skel h-3.5 w-1/3 mb-2.5" />
                  <div className="rh-skel h-3 w-2/3 mb-2.5" />
                  <div className="rh-skel h-2.5 w-1/5" />
                </div>
              </div>
            ))}
          </div>

        ) : filtered.length === 0 ? (

          /* ======================================================== */
          /* EMPTY STATE                                               */
          /* ======================================================== */

          <div className="rh-card p-14 text-center flex flex-col items-center">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
              style={{ background: '#F7F9FC' }}
            >
              <Icon.bell
                style={{
                  width: 28,
                  height: 28,
                  color: '#9CA3AF',
                }}
              />
            </div>

            <p
              className="font-semibold text-sm"
              style={{ color: '#111827' }}
            >
              You're all caught up!
            </p>

            <p
              className="text-sm mt-1.5"
              style={{ color: '#6B7280' }}
            >
              You don't have any new notifications right now.
            </p>

            <Link
              to="/browse"
              className="rh-btn-primary px-5 py-2.5 text-sm mt-5 inline-block"
            >
              Browse Equipment
            </Link>
          </div>

        ) : grouped ? (

          /* ======================================================== */
          /* GROUPED LIST                                               */
          /* ======================================================== */

          <div className="space-y-6">
            {GROUP_ORDER
              .filter((g) => grouped[g]?.length)
              .map((g) => (
                <div key={g}>
                  <p
                    className="text-xs font-bold uppercase tracking-wide mb-2.5 px-1"
                    style={{ color: '#9CA3AF' }}
                  >
                    {g}
                  </p>

                  <div
                    className="rh-card divide-y overflow-visible"
                    style={{ borderColor: '#EEF0F3' }}
                  >
                    {grouped[g].map((n) => (
                      <NotificationRow
                        key={n.id}
                        n={n}
                        openMenu={openMenuId === n.id}
                        onToggleMenu={() =>
                          setOpenMenuId(
                            openMenuId === n.id
                              ? null
                              : n.id
                          )
                        }
                        onMarkRead={markRead}
                        onDelete={deleteNotification}
                      />
                    ))}
                  </div>
                </div>
              ))}
          </div>

        ) : (

          /* ======================================================== */
          /* OLDEST-FIRST FLAT LIST                                    */
          /* ======================================================== */

          <div
            className="rh-card divide-y"
            style={{ borderColor: '#EEF0F3' }}
          >
            {filtered.map((n) => (
              <NotificationRow
                key={n.id}
                n={n}
                openMenu={openMenuId === n.id}
                onToggleMenu={() =>
                  setOpenMenuId(
                    openMenuId === n.id
                      ? null
                      : n.id
                  )
                }
                onMarkRead={markRead}
                onDelete={deleteNotification}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ================================================================== */
/* Notification Row                                                    */
/* ================================================================== */

function NotificationRow({
  n,
  openMenu,
  onToggleMenu,
  onMarkRead,
  onDelete,
}) {
  const meta =
    CATEGORY_META[n.category] ||
    CATEGORY_META.System;

  return (
    <div
      className="rh-item flex gap-3.5 p-4 sm:p-5 cursor-pointer"
      style={{
        background: n.read
          ? '#fff'
          : '#F5F8FF',
      }}
      onClick={() => {
        if (!n.read) {
          onMarkRead(n.id);
        }
      }}
    >

      {/* ========================================================== */}
      {/* ICON                                                        */}
      {/* ========================================================== */}

      <div
        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
        style={{
          background: meta.bg,
        }}
      >
        <meta.icon />
      </div>

      {/* ========================================================== */}
      {/* CONTENT                                                     */}
      {/* ========================================================== */}

      <div className="flex-1 min-w-0">

        <div className="flex items-start justify-between gap-2">

          <p
            className="text-sm"
            style={{
              color: '#111827',
              fontWeight: n.read ? 500 : 700,
            }}
          >
            {!n.read && (
              <span
                className="inline-block w-2 h-2 rounded-full mr-2 align-middle"
                style={{
                  background: '#2F5FE0',
                }}
              />
            )}

            {n.title}
          </p>

          {/* ====================================================== */}
          {/* MENU                                                    */}
          {/* ====================================================== */}

          <div
            className="relative shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onToggleMenu}
              className="rh-more-btn p-1.5 rounded-lg hover:bg-gray-100"
              style={{
                color: '#9CA3AF',
                opacity: openMenu ? 1 : undefined,
              }}
              aria-label="More options"
            >
              <Icon.dots />
            </button>

            {openMenu && (
              <div
                className="absolute right-0 mt-1 w-40 rh-card p-1.5 z-20"
                style={{
                  boxShadow:
                    '0 8px 24px -8px rgba(15,27,61,0.2)',
                }}
              >

                {!n.read && (
                  <button
                    onClick={() => {
                      onMarkRead(n.id);
                      onToggleMenu();
                    }}
                    className="w-full flex items-center gap-2 text-left px-3 py-2 rounded-lg text-sm hover:bg-gray-50"
                    style={{
                      color: '#374151',
                    }}
                  >
                    <Icon.check />
                    Mark as read
                  </button>
                )}

                <button
                  onClick={() => {
                    onDelete(n.id);
                    onToggleMenu();
                  }}
                  className="w-full flex items-center gap-2 text-left px-3 py-2 rounded-lg text-sm hover:bg-gray-50"
                  style={{
                    color: '#DC2626',
                  }}
                >
                  <Icon.trash />
                  Delete
                </button>

              </div>
            )}
          </div>
        </div>

        {/* ======================================================== */}
        {/* MESSAGE                                                   */}
        {/* ======================================================== */}

        <p
          className="text-sm mt-1 line-clamp-2"
          style={{
            color: '#6B7280',
          }}
        >
          {n.text}
        </p>

        {/* ======================================================== */}
        {/* TIME                                                      */}
        {/* ======================================================== */}

        <div className="flex items-center justify-between mt-2.5 flex-wrap gap-2">
          <p
            className="text-xs"
            style={{
              color: '#9CA3AF',
            }}
          >
            {n.time}
          </p>
        </div>

      </div>
    </div>
  );
}

