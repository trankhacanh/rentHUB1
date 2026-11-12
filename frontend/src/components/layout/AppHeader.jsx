
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosClient from '../../services/axiosClient';
import notificationService from '../../services/notificationService';
import chatSocket from '../../services/chatSocket';
import NotificationPopup from '../notification/NotificationPopup';
import { useLocation } from 'react-router-dom';
import { usePreferences } from '../../context/preferences';
import PreferenceControls from './PreferenceControls';
const DEFAULT_NAV_ITEMS = [
  { label: 'Home', to: '/' },
  { label: 'Browse Equipment', to: '/browse' },
  { label: 'Cart & Checkout', to: '/cartcheckout' },
  { label: 'How It Works', to: '/how-it-works' },
];

function Icon({ name }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
  };

  if (name === 'bell') {
    return (
      <svg {...common}>
        <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.7 21a2 2 0 0 1-3.4 0" />
      </svg>
    );
  }

  if (name === 'message') {
    return (
      <svg {...common}>
        <path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H6l-3 2v-5.5A7.5 7.5 0 1 1 20 11.5z" />
      </svg>
    );
  }

  if (name === 'search') {
    return (
      <svg {...common}>
        <circle cx="11" cy="11" r="7" />
        <path d="m21 21-4.3-4.3" />
      </svg>
    );
  }

  return null;
}

export default function AppHeader({
  navItems = DEFAULT_NAV_ITEMS,
  activePath,
  onSearch,
}) {
  const { t } = usePreferences();
  const location = useLocation();

  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const fullName = [user?.firstName, user?.lastName]
    .filter(Boolean)
    .join(' ');

  const initials = [user?.firstName?.[0], user?.lastName?.[0]]
    .filter(Boolean)
    .join('')
    .toUpperCase();


useEffect(() => {
  let cancelled = false;

  const loadUser = async () => {
    const token = localStorage.getItem('token');

    if (!token) {
      // Prevent an old authenticated connection from lingering.
      chatSocket.disconnect();

      if (!cancelled) {
        setUser(null);
        setAuthLoading(false);
        setUnreadMessageCount(0);
        setUnreadCount(0);
      }

      return;
    }

    try {
      const response = await axiosClient.get('/users/me');
      const currentUser = response.data?.data;

      if (!currentUser?.id) {
        throw new Error('Invalid user profile response.');
      }

      if (cancelled) {
        return;
      }

      setUser(currentUser);

      // Load initial unread message count.
      try {
        const conversationsResponse =
          await axiosClient.get('/conversations');

        const conversations = Array.isArray(
          conversationsResponse.data
        )
          ? conversationsResponse.data
          : Array.isArray(conversationsResponse.data?.data)
            ? conversationsResponse.data.data
            : [];

        const totalUnread = conversations.reduce(
          (total, conversation) =>
            total + (Number(conversation.unreadCount) || 0),
          0
        );

        if (!cancelled) {
          setUnreadMessageCount(totalUnread);
        }
      } catch (error) {
        if (!cancelled) {
          console.error(
            'Unable to load unread message count:',
            error
          );
          setUnreadMessageCount(0);
        }
      }

      // Load initial unread notification count.
      try {
        const notificationResponse =
          await notificationService.getUnreadCount();

        if (!cancelled) {
          const value =
            notificationResponse.data?.data ??
            notificationResponse.data;

          setUnreadCount(Number(value) || 0);
        }
      } catch (error) {
        if (!cancelled) {
          console.error(
            'Unable to load unread notification count:',
            error
          );
        }
      }
    } catch (error) {
      if (!cancelled) {
        console.error('Unable to load current user:', error);

        chatSocket.disconnect();

        localStorage.removeItem('token');
        localStorage.removeItem('user');

        setUser(null);
        setUnreadMessageCount(0);
        setUnreadCount(0);
      }
    } finally {
      if (!cancelled) {
        setAuthLoading(false);
      }
    }
  };

  loadUser();

  return () => {
    cancelled = true;
  };
}, []);


useEffect(() => {
  if (!user?.id) {
    return;
  }

  let cancelled = false;

  chatSocket.connect(user.id);

  const notificationSubscription = chatSocket.subscribe(
    `/topic/notifications/${user.id}`,
    () => {
      if (!cancelled) {
        setUnreadCount((count) => count + 1);
      }
    }
  );

  const messageSubscription = chatSocket.subscribe(
    `/topic/messages/${user.id}`,
    async (event) => {
      if (cancelled || event?.type !== 'NEW_MESSAGE') {
        return;
      }

      try {
        const response = await axiosClient.get('/conversations');

        const conversations = Array.isArray(response.data)
          ? response.data
          : Array.isArray(response.data?.data)
            ? response.data.data
            : [];

        const totalUnread = conversations.reduce(
          (total, conversation) =>
            total + (Number(conversation.unreadCount) || 0),
          0
        );

        if (!cancelled) {
          setUnreadMessageCount(totalUnread);
        }
      } catch (error) {
        if (!cancelled) {
          console.error(
            'Unable to refresh unread message count:',
            error
          );
        }
      }
    }
  );

  return () => {
    cancelled = true;

    // Only remove AppHeader's own subscriptions.
    // Do not disconnect the shared WebSocket here.
    notificationSubscription.unsubscribe();
    messageSubscription.unsubscribe();
  };
}, [user?.id]);


// Refresh unread message badge when a conversation is marked as read.
useEffect(() => {
  const refreshUnreadMessageCount = async () => {
    try {
      const response = await axiosClient.get('/conversations');

      const conversations = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.data)
          ? response.data.data
          : [];

      const totalUnread = conversations.reduce(
        (total, conversation) =>
          total + (Number(conversation.unreadCount) || 0),
        0
      );

      setUnreadMessageCount(totalUnread);
    } catch (error) {
      console.error(
        'Unable to refresh unread message count after reading:',
        error
      );
    }
  };

  window.addEventListener(
    'renthub:messages-read',
    refreshUnreadMessageCount
  );

  return () => {
    window.removeEventListener(
      'renthub:messages-read',
      refreshUnreadMessageCount
    );
  };
}, []);


const handleLogout = () => {
  chatSocket.disconnect();

  localStorage.removeItem('token');
  localStorage.removeItem('user');

  setUser(null);
  setUnreadMessageCount(0);
  setUnreadCount(0);
  setUserMenuOpen(false);
  setMobileMenuOpen(false);
  setNotificationOpen(false);

  navigate('/login');
};

  const renderAccount = () => {
    if (authLoading) {
      return <div className="h-9 w-24 animate-pulse rounded-lg bg-gray-100" />;
    }

    if (!user) {
      return (
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm font-semibold text-gray-700">
            {t('Sign In')}
          </Link>
          <Link
            to="/register"
            className="rounded-lg px-4 py-2.5 text-sm font-semibold text-white"
            style={{ background: '#2F5FE0' }}
          >
            {t('Register')}
          </Link>
        </div>
      );
    }

    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => setUserMenuOpen((open) => !open)}
          aria-expanded={userMenuOpen}
          className="flex items-center gap-2 rounded-full px-1 py-1 hover:bg-gray-100"
        >
          <span
            className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-white"
            style={{ background: '#1E3A8A' }}
          >
            {initials || '?'}
          </span>
          <span className="max-w-36 truncate text-sm font-medium text-gray-700">
            {fullName || user.email}
          </span>

        </button>

        {userMenuOpen && (
          <div className="absolute right-0 z-50 mt-2 w-48 rounded-xl border border-gray-100 bg-white py-2 shadow-lg">
            <Link
              to="/profile"
              onClick={() => setUserMenuOpen(false)}
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              {t('My Profile')}
            </Link>
            <Link
              to="/my-bookings"
              onClick={() => setUserMenuOpen(false)}
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              {t('My Rentals')}
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-50"
            >
              {t('Logout')}
            </button>
          </div>
        )}
      </div>
    );
  };
  if (location.pathname.startsWith('/admin')) {
  return null;
}

  return (
    <header
      className="sticky top-0 z-40 border-b bg-white/95 backdrop-blur"
      style={{ borderColor: '#EEF0F3' }}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
        <Link to="/" className="flex shrink-0 items-center gap-2.5">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-lg text-lg font-extrabold text-white"
            style={{ background: '#2F5FE0' }}
          >
            R
          </span>
          <span className="text-lg font-bold tracking-tight text-[#0F1B3D]">
            RentHub
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-gray-700 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="hover:text-[#2F5FE0]"
              style={
                activePath === item.to
                  ? { color: '#2F5FE0', fontWeight: 600 }
                  : undefined
              }
            >
              {t(item.label)}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <PreferenceControls />
          {onSearch && (
            <button
              type="button"
              aria-label={t('Search')}
              onClick={onSearch}
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
            >
              <Icon name="search" />
            </button>
          )}

          {user && (
            <>
              <div className="relative">
                <button
                  type="button"
                  aria-label={t('Notifications')}
                  onClick={() => setNotificationOpen((open) => !open)}
                  className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                >
                  <Icon name="bell" />
                  {unreadCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>

                <NotificationPopup
                  isOpen={notificationOpen}
                  onClose={() => setNotificationOpen(false)}
                  onUnreadCountChange={(change) => {
                    setUnreadCount((count) =>
                      Math.max(0, count + change)
                    );
                  }}
                />
              </div>

             
        <Link
          to="/messages"
          aria-label={t('Messages')}
          title={t('Messages')}
          className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100"
        >
          <Icon name="message" />

          {unreadMessageCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {unreadMessageCount > 99 ? '99+' : unreadMessageCount}
            </span>
          )}
        </Link>

            </>
          )}

          <div className="flex items-center gap-3">
  {renderAccount()}

  {user?.roles?.includes('ROLE_OWNER') && (
    <Link
      to="/list-equipment"
      className="hidden xl:inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
      style={{ background: '#2F5FE0' }}
    >
      + {t('Create Equipment')}
    </Link>
  )}
</div>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <PreferenceControls />
          <button
            type="button"
            className="p-2 text-gray-600"
            aria-label={t('Toggle navigation')}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((open) => !open)}
          >
            ☰
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="flex flex-col gap-4 border-t bg-white px-5 py-4 text-sm lg:hidden">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMobileMenuOpen(false)}
              className="text-gray-700"
              style={
                activePath === item.to
                  ? { color: '#2F5FE0', fontWeight: 600 }
                  : undefined
              }
            >
              {t(item.label)}
            </Link>
          ))}

          <div className="border-t border-gray-100 pt-3">
            {renderAccount()}
          </div>

          {user && (
            <Link
              to="/messages"
              onClick={() => setMobileMenuOpen(false)}
              className="text-gray-700"
            >
              {t('Messages')}
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
