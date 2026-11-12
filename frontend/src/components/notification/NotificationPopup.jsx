
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import notificationService from '../../services/notificationService';

const CATEGORY_CONFIG = {
  Booking: {
    icon: '📋',
    color: '#2F5FE0',
    bg: '#EEF4FF',
  },
  Payment: {
    icon: '💳',
    color: '#16A34A',
    bg: '#ECFDF3',
  },
  Message: {
    icon: '💬',
    color: '#8B5CF6',
    bg: '#F5F3FF',
  },
  Equipment: {
    icon: '📦',
    color: '#EA580C',
    bg: '#FFF7ED',
  },
  Review: {
    icon: '⭐',
    color: '#D97706',
    bg: '#FFFBEB',
  },
  System: {
    icon: '🔔',
    color: '#6B7280',
    bg: '#F3F4F6',
  },
};

function getCategory(type = '') {
  if (type.startsWith('BOOKING')) return 'Booking';
  if (type.startsWith('PAYMENT')) return 'Payment';
  if (type.startsWith('MESSAGE')) return 'Message';
  if (type.startsWith('EQUIPMENT')) return 'Equipment';
  if (type.startsWith('REVIEW')) return 'Review';

  return 'System';
}

function formatTime(createdAt) {
  if (!createdAt) return '';

  const date = new Date(createdAt);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) {
    return 'Just now';
  }

  if (diff < hour) {
    return `${Math.floor(diff / minute)} min ago`;
  }

  if (diff < day) {
    return `${Math.floor(diff / hour)} hr ago`;
  }

  if (diff < 7 * day) {
    return `${Math.floor(diff / day)} day ago`;
  }

  return date.toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function getNotificationLink(notification) {
  if (!notification.referenceId) {
    return null;
  }

  switch (notification.referenceType) {
    case 'BOOKING':
      return `/bookings/${notification.referenceId}`;

    case 'PAYMENT':
      return `/payments/${notification.referenceId}`;

    case 'EQUIPMENT':
      return `/equipment/${notification.referenceId}`;

    default:
      return null;
  }
}

export default function NotificationPopup({
  isOpen,
  onClose,
  onUnreadCountChange,
}) {
  const popupRef = useRef(null);

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  /*
   * Load notifications whenever popup opens.
   */
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const fetchNotifications = async () => {
      const token = localStorage.getItem('token');

      if (!token) {
        setNotifications([]);
        return;
      }

      setLoading(true);

      try {
        const response = await notificationService.getMyNotifications();

        setNotifications(response.data || []);
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
  }, [isOpen]);

  /*
   * Close popup when clicking outside.
   */
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleClickOutside = (event) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target)
      ) {
        onClose();
      }
    };

    document.addEventListener(
      'mousedown',
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        'mousedown',
        handleClickOutside
      );
    };
  }, [isOpen, onClose]);

  /*
   * Close popup with Escape.
   */
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener(
        'keydown',
        handleEscape
      );
    };
  }, [isOpen, onClose]);

  const unreadCount = notifications.filter(
    (notification) => !notification.read
  ).length;

  const markAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);

      setNotifications((current) =>
        current.map((notification) =>
          notification.id === notificationId
            ? {
                ...notification,
                read: true,
              }
            : notification
        )
      );

      if (onUnreadCountChange) {
        onUnreadCountChange(-1);
      }
    } catch (error) {
      console.error(
        'Failed to mark notification as read:',
        error
      );
    }
  };

  const markAllAsRead = async () => {
    if (unreadCount === 0) {
      return;
    }

    try {
      await notificationService.markAllAsRead();

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          read: true,
        }))
      );

      if (onUnreadCountChange) {
        onUnreadCountChange(-unreadCount);
      }
    } catch (error) {
      console.error(
        'Failed to mark all notifications as read:',
        error
      );
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      const target = notifications.find(
        (notification) =>
          notification.id === notificationId
      );

      await notificationService.deleteNotification(
        notificationId
      );

      setNotifications((current) =>
        current.filter(
          (notification) =>
            notification.id !== notificationId
        )
      );

      if (
        target &&
        !target.read &&
        onUnreadCountChange
      ) {
        onUnreadCountChange(-1);
      }
    } catch (error) {
      console.error(
        'Failed to delete notification:',
        error
      );
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      ref={popupRef}
      className="absolute right-0 top-full mt-3 w-[390px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl"
      style={{
        zIndex: 1000,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
        <div>
          <h3 className="text-base font-semibold text-[#0F1B3D]">
            Notifications
          </h3>

          {unreadCount > 0 && (
            <p className="mt-0.5 text-xs text-gray-500">
              {unreadCount} unread notification
              {unreadCount > 1 ? 's' : ''}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={markAllAsRead}
          disabled={unreadCount === 0}
          className="text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:text-gray-300"
          style={{
            color:
              unreadCount > 0
                ? '#2F5FE0'
                : undefined,
          }}
        >
          Mark all as read
        </button>
      </div>

      {/* Notification list */}
      <div className="max-h-[440px] overflow-y-auto">
        {loading ? (
          <div className="space-y-3 p-4">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="animate-pulse rounded-xl p-3"
              >
                <div className="flex gap-3">
                  <div className="h-10 w-10 rounded-full bg-gray-200" />

                  <div className="flex-1">
                    <div className="mb-2 h-3 w-3/4 rounded bg-gray-200" />
                    <div className="mb-2 h-3 w-full rounded bg-gray-200" />
                    <div className="h-2 w-1/4 rounded bg-gray-200" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-2xl">
              🔔
            </div>

            <h4 className="text-sm font-semibold text-[#0F1B3D]">
              No notifications
            </h4>

            <p className="mt-1 text-xs text-gray-500">
              You're all caught up.
            </p>
          </div>
        ) : (
          notifications.slice(0, 8).map((notification) => {
            const category = getCategory(
              notification.type
            );

            const config =
              CATEGORY_CONFIG[category];

            const link = getNotificationLink(
              notification
            );

            const content = (
              <div
                className={`group relative flex gap-3 px-5 py-4 transition-colors ${
                  notification.read
                    ? 'bg-white hover:bg-gray-50'
                    : 'bg-[#EEF4FF] hover:bg-[#E6EEFF]'
                }`}
              >
                {/* Unread dot */}
                {!notification.read && (
                  <span
                    className="absolute left-2 top-6 h-2 w-2 rounded-full"
                    style={{
                      backgroundColor: '#2F5FE0',
                    }}
                  />
                )}

                {/* Icon */}
                <div
                  className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-base"
                  style={{
                    backgroundColor: config.bg,
                  }}
                >
                  {config.icon}
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className={`text-sm leading-5 ${
                        notification.read
                          ? 'font-medium text-gray-700'
                          : 'font-semibold text-[#0F1B3D]'
                      }`}
                    >
                      {notification.title}
                    </p>

                    <button
                      type="button"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();

                        deleteNotification(
                          notification.id
                        );
                      }}
                      className="hidden flex-shrink-0 rounded-md px-1.5 py-0.5 text-xs text-gray-400 hover:bg-gray-200 hover:text-gray-700 group-hover:block"
                      aria-label="Delete notification"
                    >
                      ×
                    </button>
                  </div>

                  {notification.message && (
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-gray-500">
                      {notification.message}
                    </p>
                  )}

                  <p className="mt-1.5 text-[11px] text-gray-400">
                    {formatTime(
                      notification.createdAt
                    )}
                  </p>
                </div>
              </div>
            );

            if (link) {
              return (
                <Link
                  key={notification.id}
                  to={link}
                  onClick={() => {
                    handleNotificationClick(
                      notification
                    );
                    onClose();
                  }}
                  className="block border-b border-gray-100 last:border-b-0"
                >
                  {content}
                </Link>
              );
            }

            return (
  <div
    key={notification.id}
    role="button"
    tabIndex={0}
    onClick={() => handleNotificationClick(notification)}
    onKeyDown={(event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        handleNotificationClick(notification);
      }
    }}
    className="block w-full cursor-pointer border-b border-gray-100 text-left last:border-b-0"
  >
                {content}
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="border-t border-gray-100 px-5 py-3 text-center">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-medium"
            style={{
              color: '#2F5FE0',
            }}
          >
            View recent notifications
          </button>
        </div>
      )}
    </div>
  );
}
