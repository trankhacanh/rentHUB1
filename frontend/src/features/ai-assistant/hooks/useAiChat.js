import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  streamAiChat,
  getAiConversations,
  getAiConversationMessages,
} from "../services/aiApi";

const INITIAL_MESSAGES = [
  {
    id: "renthub-ai-welcome",
    role: "assistant",
    content:
      "Xin chào! Mình là RentHub AI. Mình có thể hỗ trợ bạn tìm kiếm thiết bị, kiểm tra tình trạng khả dụng, xem báo giá và giải đáp thông tin về RentHub.",
  },
];

function createMessageId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeHistoryMessages(history) {
  if (!Array.isArray(history)) return [];

  return history.map((item) => ({
    id: item.messageId || createMessageId(),
    role:
      item.role?.toUpperCase() === "USER"
        ? "user"
        : "assistant",
    content: item.content || "",
  }));
}

export function useAiChat() {
  const [messages, setMessages] = useState(INITIAL_MESSAGES);

  const [conversationId, setConversationId] = useState(null);

  const [conversations, setConversations] = useState([]);

  const [isStreaming, setIsStreaming] = useState(false);

  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const [error, setError] = useState("");

  const abortControllerRef = useRef(null);

  const conversationIdRef = useRef(null);

  const generationRef = useRef(0);

  const historyRequestRef = useRef(0);

  /**
   * Load conversation list.
   */
  const loadConversations = useCallback(
    async ({ silent = false } = {}) => {
      try {
        const result = await getAiConversations();

        setConversations(
          Array.isArray(result) ? result : []
        );

        return result;
      } catch (requestError) {
        if (!silent) {
          setError(
            requestError.message ||
              "Không thể tải lịch sử hội thoại."
          );
        }

        return [];
      }
    },
    []
  );

  /**
   * Load conversation history.
   */
  const openConversation = useCallback(
    async (targetConversationId) => {
      if (!targetConversationId) return;

      if (abortControllerRef.current) {
        setError("Vui lòng dừng phản hồi hiện tại trước khi chuyển hội thoại.");
        return;
      }

      const requestId = ++historyRequestRef.current;

      setIsLoadingHistory(true);
      setError("");

      try {
        const result = await getAiConversationMessages(
          targetConversationId
        );

        if (requestId !== historyRequestRef.current) {
          return;
        }

        const historyMessages = normalizeHistoryMessages(
          result.messages
        );

        conversationIdRef.current = targetConversationId;

        setConversationId(targetConversationId);

        setMessages(
          historyMessages.length > 0
            ? historyMessages
            : INITIAL_MESSAGES
        );
      } catch (requestError) {
        if (requestId === historyRequestRef.current) {
          setError(
            requestError.message ||
              "Không thể tải nội dung cuộc trò chuyện."
          );
        }
      } finally {
        if (requestId === historyRequestRef.current) {
          setIsLoadingHistory(false);
        }
      }
    },
    []
  );

  /**
   * Start a new conversation.
   * Backend creates the actual database record on first message.
   */
  const startNewConversation = useCallback(() => {
    generationRef.current += 1;
    historyRequestRef.current += 1;

    abortControllerRef.current?.abort();
    abortControllerRef.current = null;

    conversationIdRef.current = null;

    setConversationId(null);
    setMessages(INITIAL_MESSAGES);
    setError("");
    setIsStreaming(false);
    setIsLoadingHistory(false);
  }, []);

  /**
   * Send a new message or continue the current conversation.
   */
  const sendMessage = useCallback(async (rawMessage) => {
    const message = rawMessage.trim();

    if (!message || abortControllerRef.current) return;

    const requestGeneration = ++generationRef.current;

    const userMessage = {
      id: createMessageId(),
      role: "user",
      content: message,
    };

    const assistantMessageId = createMessageId();

    const controller = new AbortController();

    abortControllerRef.current = controller;

    setError("");
    setIsStreaming(true);

    setMessages((current) => [
      ...current,
      userMessage,
      {
        id: assistantMessageId,
        role: "assistant",
        content: "",
      },
    ]);

    try {
      await streamAiChat({
        message,

        conversationId: conversationIdRef.current,

        signal: controller.signal,

        onConversationId: (newConversationId) => {
          if (requestGeneration !== generationRef.current) {
            return;
          }

          conversationIdRef.current = newConversationId;

          setConversationId(newConversationId);
        },

        onToken: (token) => {
          if (requestGeneration !== generationRef.current) {
            return;
          }

          setMessages((current) =>
            current.map((item) =>
              item.id === assistantMessageId
                ? {
                    ...item,
                    content: item.content + token,
                  }
                : item
            )
          );
        },
      });

      // Refresh sidebar after a completed exchange.
      if (requestGeneration === generationRef.current) {
        await loadConversations({ silent: true });
      }
    } catch (requestError) {
      if (requestError.name !== "AbortError") {
        setError(
          requestError.message ||
            "Đã xảy ra lỗi khi kết nối RentHub AI."
        );

        setMessages((current) =>
          current.filter(
            (item) =>
              item.id !== assistantMessageId ||
              item.content.trim().length > 0
          )
        );
      } else {
        setMessages((current) =>
          current.filter(
            (item) =>
              item.id !== assistantMessageId ||
              item.content.trim().length > 0
          )
        );
      }
    } finally {
      if (requestGeneration === generationRef.current) {
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
        }

        setIsStreaming(false);
      }
    }
  }, [loadConversations]);

  /**
   * Stop current response.
   */
  const stopGeneration = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  /**
   * Backward-compatible alias for previous widget.
   */
  const clearConversation = startNewConversation;

  const dismissError = useCallback(() => {
    setError("");
  }, []);

  /**
   * Load sidebar history when hook mounts.
   */
  useEffect(() => {
    loadConversations({ silent: true });
  }, [loadConversations]);

  /**
   * Abort an active stream when component unmounts.
   */
  useEffect(() => {
    return () => {
      generationRef.current += 1;
      abortControllerRef.current?.abort();
    };
  }, []);

  return {
    messages,
    conversationId,
    conversations,
    isStreaming,
    isLoadingHistory,
    error,

    sendMessage,
    stopGeneration,

    clearConversation,
    startNewConversation,

    loadConversations,
    openConversation,

    dismissError,
  };
}