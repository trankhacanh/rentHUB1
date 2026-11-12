import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  useSearchParams,
  useNavigate,
  Link,
} from 'react-router-dom';
import ContractCard from '../components/chat/ContractCard';
import axiosClient from '../services/axiosClient';
import chatSocket from '../services/chatSocket';
import { formatVnd } from '../utils/currency';
/* ================================================================== */
/* Icons (inline SVG — no external icon package, so nothing can break  */
/* if a library like lucide-react isn't installed in this project).    */
/* ================================================================== */

const Icon = {
  search: (p) => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>,
  send: (p) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><path d="M22 2L11 13" /><path d="M22 2l-7 20-4-9-9-4z" /></svg>,
  paperclip: (p) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><path d="M21.4 11.5L12 20.9a5 5 0 0 1-7.1-7.1L13.7 5a3.5 3.5 0 0 1 5 5l-8.9 8.9a2 2 0 0 1-2.8-2.8l8.2-8.2" /></svg>,
  smile: (p) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" /></svg>,
  phone: (p) => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7A2 2 0 0 1 22 16.9z" /></svg>,
  more: (p) => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" {...p}><circle cx="12" cy="5" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="12" cy="19" r="1.8" /></svg>,
  arrowLeft: (p) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}><path d="M19 12H5M12 19l-7-7 7-7" /></svg>,
  chat: (p) => <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.4" {...p}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>,
  bell: (p) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></svg>,
  chevronDown: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}><path d="M6 9l6 6 6-6" /></svg>,
  pin: (p) => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 1 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>,
};

/* ================================================================== */
/* Mock data — structured to match the future Spring Boot response     */
/* shape, so it's a straightforward swap once the endpoints exist:     */
/*   GET  /api/messages/conversations                                  */
/*   GET  /api/messages/conversations/{id}                              */
/*   POST /api/messages/conversations/{id}  { content }                 */
/* ================================================================== */

const CURRENT_USER_FALLBACK = { id: 'current-user', name: 'Alex Nguyen', avatar: 'AN' };

const MOCK_CONVERSATIONS = [
  {
    id: 'conversation-1',
    user: { id: 'user-101', name: 'Minh Tran', avatar: 'MT', online: true },
    equipment: { id: '1', name: 'Sony A7 IV', category: 'Camera', price: 450000, priceUnit: 'day', status: 'Available', image: 'https://picsum.photos/seed/sonya7iv/200/200' },
    rental: { period: 'Aug 15 – Aug 17', status: 'Pending', bookingId: 'RH-2026-001' },
    lastMessage: 'Is the camera still available this weekend?',
    lastMessageAt: '10:42 AM',
    unreadCount: 2,
  },
  {
    id: 'conversation-2',
    user: { id: 'user-102', name: 'David Nguyen', avatar: 'DN', online: false },
    equipment: { id: '3', name: 'MacBook Pro 14"', category: 'Laptop', price: 300000, priceUnit: 'day', status: 'Available', image: 'https://picsum.photos/seed/macbookpro14/200/200' },
    rental: { period: 'Aug 20 – Aug 23', status: 'Confirmed', bookingId: 'RH-2026-014' },
    lastMessage: 'Can I rent it for three days instead of two?',
    lastMessageAt: 'Yesterday',
    unreadCount: 0,
  },
  {
    id: 'conversation-3',
    user: { id: 'user-103', name: 'Linh Pham', avatar: 'LP', online: true },
    equipment: { id: '5', name: 'DJI Mini 4 Pro', category: 'Drone', price: 350000, priceUnit: 'day', status: 'Available', image: 'https://picsum.photos/seed/djimini4pro/200/200' },
    rental: { period: 'Aug 25 – Aug 26', status: 'Pending', bookingId: 'RH-2026-021' },
    lastMessage: 'Does the rental include extra batteries?',
    lastMessageAt: '9:05 AM',
    unreadCount: 1,
  },
  {
    id: 'conversation-4',
    user: { id: 'user-104', name: 'Kevin Le', avatar: 'KL', online: false },
    equipment: { id: '4', name: 'JBL PartyBox 310', category: 'Audio', price: 220000, priceUnit: 'day', status: 'Rented', image: 'https://picsum.photos/seed/jblpartybox310/200/200' },
    rental: { period: 'Sep 1 – Sep 2', status: 'Active', bookingId: 'RH-2026-033' },
    lastMessage: null,
    lastMessageAt: null,
    unreadCount: 0,
  },
  {
    id: 'conversation-5',
    user: { id: 'user-105', name: 'An Nguyen', avatar: 'AN', online: true },
    equipment: { id: '2', name: 'Epson EB-X06', category: 'Projector', price: 180000, priceUnit: 'day', status: 'Available', image: 'https://picsum.photos/seed/epsonebx06/200/200' },
    rental: { period: 'Aug 12 – Aug 14', status: 'Completed', bookingId: 'RH-2026-007' },
    lastMessage: 'Thanks, the projector worked great for our event!',
    lastMessageAt: '2 days ago',
    unreadCount: 3,
  },
];

const MOCK_MESSAGES = {
  'conversation-1': [
    { id: 1, senderId: 'user-101', text: 'Hi, is the Sony A7 IV still available this weekend?', createdAt: '2026-08-11T10:30:00', status: 'read' },
    { id: 2, senderId: 'current-user', text: "Yes, it's available. You can pick it up anytime Saturday.", createdAt: '2026-08-11T10:32:00', status: 'read' },
    { id: 3, senderId: 'current-user', text: 'It comes with a 28–70mm lens and 2 batteries.', createdAt: '2026-08-11T10:32:40', status: 'read' },
    { id: 4, senderId: 'user-101', text: 'Perfect, that works for me. Is a security deposit required?', createdAt: '2026-08-11T10:40:00', status: 'read' },
    { id: 5, senderId: 'user-101', text: 'Is the camera still available this weekend?', createdAt: '2026-08-12T10:42:00', status: 'delivered' },
  ],
  'conversation-2': [
    { id: 1, senderId: 'user-102', text: 'Hi! Can I rent the MacBook Pro for three days instead of two?', createdAt: '2026-08-10T09:00:00', status: 'read' },
    { id: 2, senderId: 'current-user', text: 'Sure, three days works. I\'ll update the booking to Aug 20–23.', createdAt: '2026-08-10T09:05:00', status: 'read' },
    { id: 3, senderId: 'user-102', text: 'Can I rent it for three days instead of two?', createdAt: '2026-08-11T08:15:00', status: 'read' },
  ],
  'conversation-3': [
    { id: 1, senderId: 'user-103', text: 'Does the DJI Mini 4 Pro rental include extra batteries?', createdAt: '2026-08-12T09:05:00', status: 'delivered' },
  ],
  'conversation-4': [],
  'conversation-5': [
    { id: 1, senderId: 'user-105', text: 'Thanks, the projector worked great for our event!', createdAt: '2026-08-10T18:20:00', status: 'read' },
    { id: 2, senderId: 'current-user', text: "Glad to hear it went well! Let me know if you need it again.", createdAt: '2026-08-10T18:25:00', status: 'read' },
  ],
};

const EMOJI_QUICK_LIST = ['😊', '👍', '❤️', '😂', '🙏', '🎉'];

/* ================================================================== */
/* Small date/time helpers (plain functions, not components)            */
/* ================================================================== */

function isSameDay(a, b) {
  return a.toDateString() === b.toDateString();
}

function formatMessageTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function formatDateSeparator(iso) {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (isSameDay(date, today)) return 'Today';
  if (isSameDay(date, yesterday)) return 'Yesterday';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}
function getPresenceLabel(user) {
  if (user?.online) {
    return '● Online';
  }

  if (!user?.lastSeenAt) {
    return 'Offline';
  }

  const lastSeen = new Date(user.lastSeenAt);

  if (Number.isNaN(lastSeen.getTime())) {
    return 'Offline';
  }

  const formattedTime = lastSeen.toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return `Offline · Last seen ${formattedTime}`;
}
/* ================================================================== */

export default function Messages() {
  const [searchParams] = useSearchParams();

  const conversationIdFromUrl =
    searchParams.get('conversationId');
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const [authChecked, setAuthChecked] = useState(false);
  // Do not connect using the mock fallback ID before /users/me resolves.
  const [currentUser, setCurrentUser] = useState(null);
  const currentUserIdRef = useRef(null);

  const selectedIdRef = useRef(null);
  const loadedMessagesRef = useRef(new Set());

  const subscriptionsRef = useRef({});
  const presenceSubscriptionsRef = useRef({});
  const handledConversationUrlRef = useRef(null);

  const [conversations, setConversations] = useState([]);
  const [conversationsOwnerId, setConversationsOwnerId] = useState(null);
  const [messagesByConversation, setMessagesByConversation] = useState({});
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [conversationsError, setConversationsError] = useState(false);

  const conversationIdsKey = useMemo(
    () => JSON.stringify(
      conversations.map((conversation) => String(conversation.id)).sort()
    ),
    [conversations]
  );

  const [selectedId, setSelectedId] = useState(null);
  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);
  const [search, setSearch] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [mobileView, setMobileView] = useState('list'); // 'list' | 'chat' — mobile only
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  /* ---------------- 1. Auth guard ---------------- */
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    setAuthChecked(true);
  }, [navigate]);

  /* ---------------- 2. Current user (API first, mock fallback) ---------------- */
  useEffect(() => {
    if (!authChecked) return;
    let cancelled = false;
    (async () => {
      try {

        const res = await axiosClient.get('/users/me');

        const user = res?.data?.data ?? res?.data;

        if (!cancelled && user?.id) {
          const nextUserId = String(user.id);
          const previousUserId = currentUserIdRef.current;

          // Never carry cached conversations/messages across user accounts.
          if (previousUserId && previousUserId !== nextUserId) {
            setConversations([]);
            setConversationsOwnerId(null);
            setMessagesByConversation({});
            setSelectedId(null);
            loadedMessagesRef.current.clear();
            handledConversationUrlRef.current = null;
          }

          currentUserIdRef.current = nextUserId;

          const name =
            `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
            CURRENT_USER_FALLBACK.name;

          const initials = name
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map((w) => w[0].toUpperCase())
            .join('');

          setCurrentUser({
            id: user.id,
            name,
            avatar: initials || CURRENT_USER_FALLBACK.avatar,
          });
        } else if (!cancelled) {
          throw new Error('Invalid current user response.');
        }

      } catch (error) {
        if (!cancelled) {
          console.error('Unable to load current user:', error);
          currentUserIdRef.current = null;
          setCurrentUser(null);
          setConversations([]);
          setConversationsOwnerId(null);
          setConversationsError(true);
          setLoadingConversations(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [authChecked]);



  /* ---------------- 3. Load conversations ---------------- */
  const loadConversations = async () => {
    const requestedUserId = currentUserIdRef.current;

    if (!requestedUserId) {
      setLoadingConversations(false);
      return [];
    }

    setLoadingConversations(true);
    setConversationsError(false);

    try {
      const res = await axiosClient.get('/conversations');

      // Ignore late responses belonging to a previous account.
      if (requestedUserId !== currentUserIdRef.current) {
        return [];
      }

      const data = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.data?.data)
          ? res.data.data
          : [];

      const mappedConversations = data.map((conversation) => {
        const userName = conversation.userName || 'Unknown User';
        const initials = userName
          .split(' ')
          .filter(Boolean)
          .slice(0, 2)
          .map((word) => word[0].toUpperCase())
          .join('');

        return {
          id: conversation.id,
          user: {
            id: conversation.userId,
            name: userName,
            avatar: initials || 'U',
            online: Boolean(conversation.online),
            lastSeenAt: conversation.lastSeenAt ?? null,
          },
          equipment: {
            id: conversation.equipmentId,
            name: conversation.equipmentTitle || 'Unknown Equipment',
            category: 'Equipment',
            price: conversation.pricePerDay ?? 0,
            priceUnit: 'day',
            status:
              conversation.equipmentStatus === 'AVAILABLE'
                ? 'Available'
                : conversation.equipmentStatus || 'Unknown',
            image: null,
          },
          rental: {
            period: 'Not available',
            status: 'Not available',
            bookingId: null,
          },
          lastMessage: conversation.lastMessage || null,
          lastMessageAt: conversation.lastMessageAt
            ? formatMessageTime(conversation.lastMessageAt)
            : null,
          lastMessageAtRaw: conversation.lastMessageAt || null,
          unreadCount: Number(conversation.unreadCount) || 0,
        };
      });

      setConversations(mappedConversations);
      setConversationsOwnerId(requestedUserId);
      return mappedConversations;
    } catch (error) {
      if (requestedUserId === currentUserIdRef.current) {
        console.error('Failed to load conversations:', error);
        setConversationsError(true);
        setConversations([]);
        setConversationsOwnerId(requestedUserId);
      }
      return [];
    } finally {
      if (requestedUserId === currentUserIdRef.current) {
        setLoadingConversations(false);
      }
    }
  };
  const loadMessages = async (conversationId) => {
    if (!conversationId) return;

    const requestedUserId = currentUserIdRef.current;
    if (!requestedUserId) return;

    setLoadingMessages(true);

    try {
      const res = await axiosClient.get(
        `/conversations/${conversationId}/messages`
      );

      // Ignore responses that complete after the authenticated user changes.
      if (requestedUserId !== currentUserIdRef.current) {
        return;
      }

      const data = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.data?.data)
          ? res.data.data
          : [];

      const mappedMessages = data.map((message) => ({
        id: message.id,
        senderId: message.senderId,
        senderName: message.senderName,

        text: message.content || '',
        messageType: message.messageType || 'TEXT',

        contractId: message.contractId || null,
        contractVersionId: message.contractVersionId || null,
        contractVersionNumber: message.contractVersionNumber ?? null,
        contractStatus: message.contractStatus || null,

        createdAt: message.createdAt,
        status: message.status || 'sent',
      }));

      setMessagesByConversation((prev) => {
        const existingMessages = prev[conversationId] || [];
        const mergedMessages = [...existingMessages, ...mappedMessages];

        const uniqueMessages = Array.from(
          new Map(
            mergedMessages.map((message) => [message.id, message])
          ).values()
        );

        uniqueMessages.sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        );

        return {
          ...prev,
          [conversationId]: uniqueMessages,
        };
      });

      loadedMessagesRef.current.add(conversationId);
    } catch (error) {
      if (requestedUserId === currentUserIdRef.current) {
        console.error(
          `Failed to load messages for conversation ${conversationId}:`,
          error
        );
      }
    } finally {
      if (requestedUserId === currentUserIdRef.current) {
        setLoadingMessages(false);
      }
    }
  };
  useEffect(() => {
    if (!authChecked || !currentUser?.id) {
      return;
    }

    let cancelled = false;

    const initializeMessages = async () => {
      await loadConversations();

      if (cancelled) {
        return;
      }

      // Use the shared application connection. AppHeader and Messages
      // reuse the same client when they belong to the same user.
      chatSocket.connect(currentUser.id);
    };

    void initializeMessages();

    return () => {
      cancelled = true;

      // Messages owns these subscriptions, not the shared connection.
      Object.values(presenceSubscriptionsRef.current).forEach(
        (subscription) => subscription.unsubscribe()
      );
      presenceSubscriptionsRef.current = {};

      Object.values(subscriptionsRef.current).forEach(
        (subscription) => subscription.unsubscribe()
      );
      subscriptionsRef.current = {};
    };
  }, [authChecked, currentUser?.id]);

  // Open a conversation supplied by the URL only after the list has loaded.
  // This effect is separate from the socket lifecycle, so changing the URL
  // does not tear down every conversation subscription.
  useEffect(() => {
    if (
      !authChecked ||
      !currentUser?.id ||
      String(conversationsOwnerId ?? '') !== String(currentUser.id) ||
      !conversationIdFromUrl ||
      loadingConversations
    ) {
      return;
    }

    const targetConversation = conversations.find(
      (conversation) =>
        String(conversation.id) === String(conversationIdFromUrl)
    );

    if (!targetConversation) {
      return;
    }

    const requestKey = `${currentUser.id}:${targetConversation.id}`;

    if (handledConversationUrlRef.current === requestKey) {
      return;
    }

    handledConversationUrlRef.current = requestKey;
    let cancelled = false;

    const openConversationFromUrl = async () => {
      setSelectedId(targetConversation.id);
      setMobileView('chat');

      if (!loadedMessagesRef.current.has(targetConversation.id)) {
        await loadMessages(targetConversation.id);
      }

      if (cancelled) {
        return;
      }

      try {
        await axiosClient.post(
          `/conversations/${targetConversation.id}/read`
        );

        if (cancelled) {
          return;
        }

        setConversations((previous) =>
          previous.map((conversation) =>
            String(conversation.id) === String(targetConversation.id)
              ? { ...conversation, unreadCount: 0 }
              : conversation
          )
        );

        window.dispatchEvent(
          new CustomEvent('renthub:messages-read')
        );
      } catch (error) {
        if (!cancelled) {
          console.error(
            'Failed to mark conversation as read:',
            error
          );
        }
      }
    };

    void openConversationFromUrl();

    return () => {
      cancelled = true;
    };
  }, [
    authChecked,
    currentUser?.id,
    conversationsOwnerId,
    conversationIdFromUrl,
    loadingConversations,
  ]);

  /* ---------------- Derived state ---------------- */
  const filteredConversations = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) =>
      c.user.name.toLowerCase().includes(q) ||
      c.equipment.name.toLowerCase().includes(q) ||
      (c.lastMessage || '').toLowerCase().includes(q)
    );
  }, [conversations, search]);

  const selectedConversation = conversations.find((c) => c.id === selectedId) || null;
  const messages = selectedConversation ? (messagesByConversation[selectedConversation.id] || []) : [];

  const totalUnread = useMemo(() => conversations.reduce((sum, c) => sum + c.unreadCount, 0), [conversations]);


  const subscribeToConversation = (conversationId) => {
    if (!conversationId) {
      return;
    }

    if (subscriptionsRef.current[conversationId]) {
      return;
    }

    const subscription = chatSocket.subscribe(
      `/topic/conversations/${conversationId}`,
      (receivedMessage) => {
        console.log('[STOMP] Received message:', receivedMessage);

        if (!receivedMessage || typeof receivedMessage !== 'object') {
          console.warn('[STOMP] Invalid message payload:', receivedMessage);
          return;
        }

        if (receivedMessage.type === 'READ_RECEIPT') {

          const readIds = new Set(
            receivedMessage.messageIds || []
          );

          setMessagesByConversation((prev) => {

            const existingMessages =
              prev[conversationId] || [];

            return {
              ...prev,
              [conversationId]: existingMessages.map(
                (message) =>
                  readIds.has(message.id)
                    ? {
                      ...message,
                      status: 'read',
                    }
                    : message
              ),
            };
          });

          return;
        }
        const mappedMessage = {
          id: receivedMessage.id,
          senderId: receivedMessage.senderId,
          senderName: receivedMessage.senderName,

          text: receivedMessage.content || '',
          messageType: receivedMessage.messageType || 'TEXT',

          contractId: receivedMessage.contractId || null,
          contractVersionId: receivedMessage.contractVersionId || null,
          contractVersionNumber:
            receivedMessage.contractVersionNumber ?? null,
          contractStatus: receivedMessage.contractStatus || null,

          createdAt: receivedMessage.createdAt,
          status: receivedMessage.status || 'sent',
        };

        // Add message without duplicates
        setMessagesByConversation((prev) => {
          const existingMessages =
            prev[conversationId] || [];

          if (
            existingMessages.some(
              (message) =>
                message.id === mappedMessage.id
            )
          ) {
            return prev;
          }

          return {
            ...prev,
            [conversationId]: [
              ...existingMessages,
              mappedMessage,
            ],
          };
        });

        // Update conversation + unread count
        setConversations((prev) => {
          const updatedConversations = prev.map((conversation) => {
            if (conversation.id !== conversationId) {
              return conversation;
            }

            const isCurrentConversation =
              selectedIdRef.current === conversationId;

            return {
              ...conversation,

              lastMessage: mappedMessage.text,

              lastMessageAt: formatMessageTime(
                mappedMessage.createdAt
              ),

              lastMessageAtRaw: mappedMessage.createdAt,

              unreadCount: isCurrentConversation
                ? 0
                : (conversation.unreadCount ?? 0) + 1,
            };
          });

          return updatedConversations.sort((a, b) => {
            const timeA = a.lastMessageAtRaw
              ? new Date(a.lastMessageAtRaw).getTime()
              : 0;

            const timeB = b.lastMessageAtRaw
              ? new Date(b.lastMessageAtRaw).getTime()
              : 0;

            return timeB - timeA;
          });
        });
      }
    );

    subscriptionsRef.current[conversationId] = subscription;
  };
  /* ---------------- Handlers ---------------- */
  const subscribeToPresence = (conversationId) => {
    if (!conversationId) {
      return;
    }

    if (presenceSubscriptionsRef.current[conversationId]) {
      return;
    }

    const subscription = chatSocket.subscribe(
      `/topic/conversations/${conversationId}/presence`,
      (event) => {
        if (
          !event?.userId ||
          !['ONLINE', 'OFFLINE'].includes(event.status)
        ) {
          console.warn('[PRESENCE] Invalid event:', event);
          return;
        }

        setConversations((previous) =>
          previous.map((conversation) =>
            String(conversation.user.id) === String(event.userId)
              ? {
                ...conversation,
                user: {
                  ...conversation.user,

                  online: event.status === 'ONLINE',

                  // Clear previous last-seen time when the user comes online.
                  // Preserve the previous value if an OFFLINE event has no timestamp.
                  lastSeenAt:
                    event.status === 'ONLINE'
                      ? null
                      : event.lastSeenAt ?? conversation.user.lastSeenAt ?? null,
                },
              }
              : conversation
          )
        );
      }
    );

    presenceSubscriptionsRef.current[conversationId] = subscription;
  };

  const handleSelectConversation = async (id) => {
    setSelectedId(id);
    setMobileView('chat');

    try {
      await axiosClient.post(
        `/conversations/${id}/read`
      );

      setConversations((prev) =>
        prev.map((c) =>
          c.id === id
            ? { ...c, unreadCount: 0 }
            : c
        )
      );

      // Notify AppHeader to refresh the unread message badge.
      window.dispatchEvent(
        new CustomEvent('renthub:messages-read')
      );
    } catch (error) {
      console.error(
        'Failed to mark conversation as read:',
        error
      );
    }

    if (!loadedMessagesRef.current.has(id)) {
      await loadMessages(id);
    }
  };

  useEffect(() => {
    if (
      !currentUser?.id ||
      String(conversationsOwnerId ?? '') !== String(currentUser.id)
    ) {
      // Clear page-owned subscriptions while the new user's conversation list loads.
      Object.values(subscriptionsRef.current).forEach(
        (subscription) => subscription.unsubscribe()
      );
      subscriptionsRef.current = {};

      Object.values(presenceSubscriptionsRef.current).forEach(
        (subscription) => subscription.unsubscribe()
      );
      presenceSubscriptionsRef.current = {};
      return;
    }

    const activeConversationIds = new Set(
      conversations.map((conversation) => String(conversation.id))
    );

    // Remove subscriptions for conversations that are no longer in the list.
    Object.keys(subscriptionsRef.current).forEach((conversationId) => {
      if (!activeConversationIds.has(String(conversationId))) {
        subscriptionsRef.current[conversationId].unsubscribe();
        delete subscriptionsRef.current[conversationId];
      }
    });

    Object.keys(presenceSubscriptionsRef.current).forEach((conversationId) => {
      if (!activeConversationIds.has(String(conversationId))) {
        presenceSubscriptionsRef.current[conversationId].unsubscribe();
        delete presenceSubscriptionsRef.current[conversationId];
      }
    });

    conversations.forEach((conversation) => {
      subscribeToConversation(conversation.id);
      subscribeToPresence(conversation.id);
    });

    // The key changes only when the set/order of conversation IDs changes.
  }, [currentUser?.id, conversationsOwnerId, conversationIdsKey]);
  const handleBackToList = () => setMobileView('list');

  const handleSend = () => {
    const text = messageInput.trim();

    if (!text || !selectedConversation) {
      return;
    }

    const sent = chatSocket.publish('/app/chat', {
      conversationId: selectedConversation.id,
      content: text,
    });

    if (!sent) {
      console.error('WebSocket is not connected');
      return;
    }

    setMessageInput('');
    setEmojiPickerOpen(false);
  };
  const handleComposerKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    // Shift+Enter falls through and inserts a newline naturally (textarea default).
  };

  const insertEmoji = (emoji) => setMessageInput((v) => v + emoji);

  /* ---------------- Auto-scroll to latest message ---------------- */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, selectedId]);

  // Don't render the page content before the auth check has resolved
  // (it redirects to /login almost immediately if there's no token).
  if (!authChecked) return null;

  return (
    <div className="rh-root h-screen flex flex-col" style={{ background: '#F7F8FC', color: '#111827' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800&family=Inter:wght@400;500;600&display=swap');
        .rh-root { font-family: 'Inter', sans-serif; }
        .rh-heading { font-family: 'Plus Jakarta Sans', sans-serif; }
        .rh-btn-primary { background: #2F5FE0; color: #fff; font-weight: 600; border-radius: 10px; transition: background .15s ease; }
        .rh-btn-primary:hover:not(:disabled) { background: #274DBD; }
        .rh-btn-primary:disabled { opacity: .5; cursor: not-allowed; }
        .rh-conv-item { transition: background .15s ease; }
        .rh-conv-item:hover { background: #F7F9FC; }
        .rh-scroll::-webkit-scrollbar { width: 6px; }
        .rh-scroll::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 3px; }
        .rh-skel { background: linear-gradient(90deg, #F1F3F6 25%, #E9ECF1 37%, #F1F3F6 63%); background-size: 400% 100%; animation: rh-shimmer 1.4s ease infinite; border-radius: 8px; }
        @keyframes rh-shimmer { 0% { background-position: 100% 0; } 100% { background-position: 0 0; } }
        @media (prefers-reduced-motion: reduce) { .rh-skel { animation: none; } }
      `}</style>



      {/* ---------------- BODY ---------------- */}
      <div className="flex-1 min-h-0 w-full max-w-7xl mx-auto lg:px-6 lg:py-6 grid grid-cols-1 md:grid-cols-[300px_1fr] lg:grid-cols-[320px_1fr_300px] gap-0 lg:gap-5">

        {/* ================= CONVERSATION SIDEBAR ================= */}
        <aside
          className={`${mobileView === 'chat' ? 'hidden' : 'flex'} md:flex flex-col bg-white lg:rounded-2xl border overflow-hidden`}
          style={{ borderColor: '#E5E7EB' }}
        >
          <div className="p-4 border-b" style={{ borderColor: '#E5E7EB' }}>
            <div className="flex items-center justify-between mb-3">
              <h1 className="rh-heading text-lg font-bold" style={{ color: '#0F1B3D' }}>Messages</h1>
              <span className="text-xs" style={{ color: '#6B7280' }}>{conversations.length} conversations</span>
            </div>
            <div className="flex items-center gap-2 h-10 px-3 rounded-lg" style={{ border: '1px solid #E5E7EB' }}>
              <Icon.search style={{ color: '#9CA3AF' }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search conversations..."
                aria-label="Search conversations"
                className="w-full text-sm outline-none"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto rh-scroll">
            {loadingConversations ? (
              <div className="p-4 space-y-4">
                <p className="text-xs mb-2" style={{ color: '#9CA3AF' }}>Loading conversations...</p>
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="rh-skel w-11 h-11 rounded-full shrink-0" />
                    <div className="flex-1">
                      <div className="rh-skel h-3.5 w-2/3 mb-2" />
                      <div className="rh-skel h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : conversationsError ? (
              <div className="p-6 text-center">
                <p className="text-sm font-medium" style={{ color: '#111827' }}>Unable to load messages.</p>
                <p className="text-xs mt-1" style={{ color: '#6B7280' }}>Please try again.</p>
                <button onClick={loadConversations} className="rh-btn-primary px-4 py-2 text-xs mt-4">Retry</button>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-sm font-medium" style={{ color: '#111827' }}>No conversations found</p>
                <p className="text-xs mt-1" style={{ color: '#6B7280' }}>Try searching with another name or equipment.</p>
              </div>
            ) : (
              filteredConversations.map((c) => {
                const active = c.id === selectedId;
                return (
                  <button
                    key={c.id}
                    onClick={() => handleSelectConversation(c.id)}
                    className="rh-conv-item w-full flex items-start gap-3 px-4 py-3.5 text-left border-b"
                    style={{ borderColor: '#F1F3F6', background: active ? '#EFF4FF' : 'transparent' }}
                  >
                    <div className="relative shrink-0">
                      <div className="w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-semibold" style={{ background: '#1E3A8A' }}>{c.user.avatar}</div>
                      {c.user.online && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white" style={{ background: '#16A34A' }} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: '#111827' }}>
                            {c.user.name}
                          </p>

                          <p
                            className="text-[10px] mt-0.5 truncate"
                            style={{
                              color: c.user.online ? '#16A34A' : '#9CA3AF',
                            }}
                          >
                            {getPresenceLabel(c.user)}
                          </p>
                        </div>

                        {c.lastMessageAt && (
                          <span className="text-[11px] shrink-0" style={{ color: '#9CA3AF' }}>
                            {c.lastMessageAt}
                          </span>
                        )}
                      </div>
                      <p className="text-xs truncate mt-0.5" style={{ color: '#2F5FE0' }}>{c.equipment.name}</p>
                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <p className="text-xs truncate" style={{ color: '#6B7280' }}>{c.lastMessage || 'No messages yet'}</p>
                        {c.unreadCount > 0 && (
                          <span className="text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center text-white shrink-0" style={{ background: '#2F5FE0' }}>{c.unreadCount}</span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* ================= CHAT WINDOW ================= */}
        <section
          className={`${mobileView === 'list' ? 'hidden' : 'flex'} md:flex flex-col bg-white lg:rounded-2xl border min-h-0`}
          style={{ borderColor: '#E5E7EB' }}
        >
          {!selectedConversation ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <Icon.chat />
              <p className="font-semibold text-sm mt-4" style={{ color: '#111827' }}>Select a conversation</p>
              <p className="text-sm mt-1 max-w-xs" style={{ color: '#6B7280' }}>Choose a conversation from the left to start messaging.</p>
              <Link to="/browse" className="rh-btn-primary px-5 py-2.5 text-sm mt-5">Browse Equipment</Link>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="flex items-center justify-between px-4 py-3.5 border-b shrink-0" style={{ borderColor: '#E5E7EB' }}>
                <div className="flex items-center gap-3 min-w-0">
                  <button onClick={handleBackToList} className="md:hidden p-1.5 -ml-1.5 rounded-lg hover:bg-gray-100" style={{ color: '#374151' }} aria-label="Back to conversations" title="Back">
                    <Icon.arrowLeft />
                  </button>
                  <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold" style={{ background: '#1E3A8A' }}>{selectedConversation.user.avatar}</div>
                    {selectedConversation.user.online && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white" style={{ background: '#16A34A' }} />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: '#111827' }}>{selectedConversation.user.name}</p>
                    <p
                      className="text-xs"
                      style={{
                        color: selectedConversation.user.online
                          ? '#16A34A'
                          : '#9CA3AF',
                      }}
                    >
                      {getPresenceLabel(selectedConversation.user)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => alert('Coming soon')} className="p-2 rounded-lg hover:bg-gray-100" style={{ color: '#6B7280' }} aria-label="Call" title="Call"><Icon.phone /></button>
                  <button onClick={() => alert('Coming soon')} className="p-2 rounded-lg hover:bg-gray-100" style={{ color: '#6B7280' }} aria-label="More options" title="More"><Icon.more /></button>
                </div>
              </div>

              {/* Equipment context card */}
              <div className="flex items-center gap-3 px-4 py-3 border-b shrink-0" style={{ background: '#F7F9FC', borderColor: '#E5E7EB' }}>
                <EquipmentThumb equipment={selectedConversation.equipment} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: '#111827' }}>{selectedConversation.equipment.name}</p>
                  <p className="text-xs" style={{ color: '#6B7280' }}>
                    {selectedConversation.equipment.category} · {formatVnd(selectedConversation.equipment.price)}/{selectedConversation.equipment.priceUnit}
                    {' · '}
                    <span style={{ color: selectedConversation.equipment.status === 'Available' ? '#16A34A' : '#A16207' }}>{selectedConversation.equipment.status}</span>
                  </p>
                </div>
                <button
                  onClick={() => navigate(`/equipment/${selectedConversation.equipment.id}`)}
                  className="text-xs font-semibold whitespace-nowrap shrink-0"
                  style={{ color: '#2F5FE0' }}
                >
                  View Equipment →
                </button>
              </div>

              {/* Messages */}
              <div
                className="flex-1 overflow-y-auto rh-scroll px-4 py-4"
                style={{ minHeight: 0 }}
              >
                {loadingMessages ? (
                  <div className="h-full flex items-center justify-center">
                    <p
                      className="text-sm"
                      style={{ color: '#9CA3AF' }}
                    >
                      Loading messages...
                    </p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <p
                      className="text-sm"
                      style={{ color: '#9CA3AF' }}
                    >
                      No messages yet
                    </p>
                  </div>
                ) : (
                  messages.map((m, i) => {
                    const isOwn =
  String(m.senderId) === String(currentUser?.id);
                    const prev = messages[i - 1];
                    const showDateSeparator = !prev || !isSameDay(new Date(prev.createdAt), new Date(m.createdAt));
                    const sameSenderAsPrev = prev && prev.senderId === m.senderId && !showDateSeparator;

                    return (
                      <div key={m.id}>
                        {showDateSeparator && (
                          <div className="flex items-center gap-3 my-4">
                            <div className="flex-1 h-px" style={{ background: '#EEF0F3' }} />
                            <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: '#9CA3AF' }}>{formatDateSeparator(m.createdAt)}</span>
                            <div className="flex-1 h-px" style={{ background: '#EEF0F3' }} />
                          </div>
                        )}
                        <div
                          className={`flex ${isOwn ? 'justify-end' : 'justify-start'
                            }`}
                          style={{
                            marginTop: sameSenderAsPrev ? 4 : 12,
                          }}
                        >
                          {m.messageType === 'CONTRACT_CARD' ? (
                            <div className="max-w-[90%] sm:max-w-[80%]">
                              <ContractCard
                                message={m}
                                onOpen={() => {
                                  if (!m.contractId || !m.contractVersionNumber) {
                                    console.error('Invalid contract card:', m);
                                    return;
                                  }

                                  navigate(
                                    `/contracts/${m.contractId}?version=${m.contractVersionNumber}`
                                  );
                                }}
                              />

                              <div
                                className={`mt-1 flex items-center gap-1 ${isOwn ? 'justify-end' : 'justify-start'
                                  }`}
                              >
                                <span className="text-[10px] text-gray-400">
                                  {formatMessageTime(m.createdAt)}
                                </span>

                                {isOwn && (
                                  <span className="text-[10px] text-gray-400">
                                    {m.status === 'read' ? '✓✓' : '✓'}
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div
                              className="max-w-[75%] sm:max-w-[70%] px-3.5 py-2.5"
                              style={{
                                background: isOwn ? '#2F5FE0' : '#fff',
                                color: isOwn ? '#fff' : '#111827',
                                border: isOwn ? 'none' : '1px solid #E5E7EB',
                                borderRadius: 14,
                                boxShadow: isOwn
                                  ? 'none'
                                  : '0 1px 2px rgba(15,27,61,0.04)',
                              }}
                            >
                              <p className="text-sm whitespace-pre-wrap break-words">
                                {m.text}
                              </p>

                              <div className="flex items-center justify-end gap-1 mt-1">
                                <span
                                  className="text-[10px]"
                                  style={{
                                    color: isOwn
                                      ? 'rgba(255,255,255,0.75)'
                                      : '#9CA3AF',
                                  }}
                                >
                                  {formatMessageTime(m.createdAt)}
                                </span>

                                {isOwn && (
                                  <span className="text-[10px] text-white/75">
                                    {m.status === 'read' ? '✓✓' : '✓'}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Composer */}
              <div className="border-t p-3 shrink-0 relative" style={{ borderColor: '#E5E7EB' }}>
                {emojiPickerOpen && (
                  <div className="absolute bottom-full left-3 mb-2 bg-white rounded-xl p-2 flex gap-1" style={{ border: '1px solid #E5E7EB', boxShadow: '0 8px 24px -8px rgba(15,27,61,0.2)' }}>
                    {EMOJI_QUICK_LIST.map((e) => (
                      <button key={e} onClick={() => insertEmoji(e)} className="w-9 h-9 rounded-lg hover:bg-gray-100 text-lg" aria-label={`Insert ${e}`}>{e}</button>
                    ))}
                  </div>
                )}
                <div className="flex items-end gap-2 rounded-xl px-3 py-2" style={{ border: '1px solid #E5E7EB' }}>
                  <button onClick={() => alert('Coming soon')} className="p-2 rounded-lg hover:bg-gray-100 shrink-0" style={{ color: '#6B7280' }} aria-label="Attach file" title="Attach file">
                    <Icon.paperclip />
                  </button>
                  <input ref={fileInputRef} type="file" className="hidden" />
                  <textarea
                    rows={1}
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={handleComposerKeyDown}
                    placeholder="Write a message..."
                    aria-label="Write a message"
                    className="flex-1 text-sm outline-none resize-none py-1.5 max-h-28"
                  />
                  <button onClick={() => setEmojiPickerOpen((o) => !o)} className="p-2 rounded-lg hover:bg-gray-100 shrink-0" style={{ color: '#6B7280' }} aria-label="Insert emoji" title="Emoji">
                    <Icon.smile />
                  </button>
                  <button
                    onClick={handleSend}
                    disabled={!messageInput.trim()}
                    className="rh-btn-primary w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    aria-label="Send message"
                    title="Send message"
                  >
                    <Icon.send />
                  </button>
                </div>
              </div>
            </>
          )}
        </section>

        {/* ================= RIGHT DETAILS (desktop only) ================= */}
        <aside className="hidden lg:flex flex-col bg-white rounded-2xl border p-5 overflow-y-auto rh-scroll" style={{ borderColor: '#E5E7EB' }}>
          {!selectedConversation ? (
            <p className="text-sm" style={{ color: '#9CA3AF' }}>Select a conversation to see rental details.</p>
          ) : (
            <>
              <h2 className="rh-heading text-sm font-bold mb-4" style={{ color: '#0F1B3D' }}>Rental Details</h2>

              <EquipmentThumb equipment={selectedConversation.equipment} tall />
              <p className="text-sm font-semibold mt-3" style={{ color: '#111827' }}>{selectedConversation.equipment.name}</p>
              <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{selectedConversation.equipment.category}</p>
              <p className="text-sm font-bold mt-2" style={{ color: '#0F1B3D' }}>{formatVnd(selectedConversation.equipment.price)} / {selectedConversation.equipment.priceUnit}</p>

              <div className="h-px my-4" style={{ background: '#EEF0F3' }} />

              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-xs" style={{ color: '#9CA3AF' }}>Rental period</p>
                  <p className="font-medium mt-0.5" style={{ color: '#111827' }}>{selectedConversation.rental.period}</p>
                </div>
                <div>
                  <p className="text-xs" style={{ color: '#9CA3AF' }}>Status</p>
                  <p className="font-medium mt-0.5" style={{ color: '#111827' }}>{selectedConversation.rental.status}</p>
                </div>
                <div>
                  <p className="text-xs" style={{ color: '#9CA3AF' }}>Booking</p>
                  <p className="font-medium mt-0.5" style={{ color: '#111827' }}>#{selectedConversation.rental.bookingId}</p>
                </div>
              </div>

              <div className="h-px my-4" style={{ background: '#EEF0F3' }} />

              <p className="text-xs font-semibold mb-2" style={{ color: '#9CA3AF' }}>OWNER</p>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-semibold" style={{ background: '#1E3A8A' }}>{selectedConversation.user.avatar}</div>
                <div>
                  <p className="text-sm font-medium" style={{ color: '#111827' }}>{selectedConversation.user.name}</p>
                  <p
                    className="text-xs"
                    style={{
                      color: selectedConversation.user.online
                        ? '#16A34A'
                        : '#9CA3AF',
                    }}
                  >
                    {getPresenceLabel(selectedConversation.user)}
                  </p>
                </div>
              </div>

              <div className="h-px my-4" style={{ background: '#EEF0F3' }} />

              <p className="text-xs font-semibold mb-2" style={{ color: '#9CA3AF' }}>ACTIONS</p>
              <div className="flex flex-col gap-2">
                <button onClick={() => navigate(`/equipment/${selectedConversation.equipment.id}`)} className="text-left text-sm font-medium px-3 py-2 rounded-lg hover:bg-gray-50" style={{ color: '#2F5FE0' }}>View Equipment</button>
                <button onClick={() => alert('Coming soon')} className="text-left text-sm font-medium px-3 py-2 rounded-lg hover:bg-gray-50" style={{ color: '#374151' }}>View Booking</button>
                <button onClick={() => alert('Coming soon')} className="text-left text-sm font-medium px-3 py-2 rounded-lg hover:bg-gray-50" style={{ color: '#374151' }}>Report</button>
                <button onClick={() => alert('Coming soon')} className="text-left text-sm font-medium px-3 py-2 rounded-lg hover:bg-gray-50" style={{ color: '#DC2626' }}>Block User</button>
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}

/* ================================================================== */
/* Equipment thumbnail with graceful image fallback (initials/box)      */
/* ================================================================== */

function EquipmentThumb({ equipment, tall }) {
  const [imgFailed, setImgFailed] = useState(false);
  const size = tall ? 'w-full h-32' : 'w-11 h-11 shrink-0';

  return (
    <div className={`${size} rounded-lg overflow-hidden flex items-center justify-center`} style={{ background: '#EEF0F3' }}>
      {imgFailed || !equipment.image ? (
        <span className="text-xs font-semibold text-center px-2" style={{ color: '#9CA3AF' }}>{equipment.name}</span>
      ) : (
        <img
          src={equipment.image}
          alt={equipment.name}
          onError={() => setImgFailed(true)}
          className="w-full h-full object-cover"
        />
      )}
    </div>
  );
}