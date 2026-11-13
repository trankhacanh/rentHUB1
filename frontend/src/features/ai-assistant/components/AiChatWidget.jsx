import { useEffect, useRef, useState } from "react";

import { useAiChat } from "../hooks/useAiChat";

import "./AiChatWidget.css";

function AssistantMark() {
  return (
    <span className="renthub-ai-mark" aria-hidden="true">
      ✦
    </span>
  );
}

export default function AiChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const {
    messages,
    conversationId,
    conversations,
    isStreaming,
    isLoadingHistory,
    error,

    sendMessage,
    stopGeneration,

    startNewConversation,
    loadConversations,
    openConversation,

    dismissError,
  } = useAiChat();

  useEffect(() => {
    if (!isOpen) return;

    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, isOpen]);

  useEffect(() => {
    if (isOpen && !historyOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen, historyOpen]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const message = draft.trim();

    if (!message || isStreaming) return;

    setDraft("");
    dismissError();

    await sendMessage(message);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  };

  const handleNewChat = () => {
    startNewConversation();
    setHistoryOpen(false);
    setDraft("");
  };

  const handleOpenHistory = async () => {
    const nextOpen = !historyOpen;

    setHistoryOpen(nextOpen);

    if (nextOpen) {
      await loadConversations();
    }
  };

  const handleSelectConversation = async (id) => {
    if (isStreaming) return;

    await openConversation(id);

    setHistoryOpen(false);
    setDraft("");
  };

  const formatConversationDate = (value) => {
    if (!value) return "";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "";

    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
  };

  return (
    <div className="renthub-ai-widget">
      {isOpen && (
        <section
          className="renthub-ai-panel"
          role="dialog"
          aria-label="Trợ lý RentHub AI"
          aria-modal="false"
        >
          <header className="renthub-ai-header">
            <div className="renthub-ai-header-identity">
              <div className="renthub-ai-avatar">
                <AssistantMark />
              </div>

              <div>
                <h2>RentHub AI</h2>

                <p>
                  <span className="renthub-ai-status-dot" />
                  Trợ lý cho thuê thiết bị
                </p>
              </div>
            </div>

            <div className="renthub-ai-header-actions">
              <button
                type="button"
                className="renthub-ai-icon-button"
                onClick={handleOpenHistory}
                aria-label="Lịch sử hội thoại"
                title="Lịch sử hội thoại"
                aria-expanded={historyOpen}
                disabled={isStreaming}
              >
                ☰
              </button>

              <button
                type="button"
                className="renthub-ai-icon-button"
                onClick={handleNewChat}
                aria-label="Cuộc trò chuyện mới"
                title="Cuộc trò chuyện mới"
                disabled={isStreaming}
              >
                +
              </button>

              <button
                type="button"
                className="renthub-ai-icon-button"
                onClick={() => setIsOpen(false)}
                aria-label="Đóng chatbot"
              >
                ×
              </button>
            </div>
          </header>

          {historyOpen && (
            <aside className="renthub-ai-history-panel">
              <div className="renthub-ai-history-header">
                <div>
                  <h3>Lịch sử hội thoại</h3>
                  <p>Các cuộc trò chuyện gần đây</p>
                </div>

                <button
                  type="button"
                  onClick={() => setHistoryOpen(false)}
                  aria-label="Đóng lịch sử"
                >
                  ×
                </button>
              </div>

              <button
                type="button"
                className="renthub-ai-history-new"
                onClick={handleNewChat}
                disabled={isStreaming}
              >
                <span>+</span>
                Cuộc trò chuyện mới
              </button>

              <div className="renthub-ai-history-list">
                {isLoadingHistory ? (
                  <p className="renthub-ai-history-empty">
                    Đang tải lịch sử...
                  </p>
                ) : conversations.length === 0 ? (
                  <p className="renthub-ai-history-empty">
                    Chưa có cuộc trò chuyện nào.
                  </p>
                ) : (
                  conversations.map((item) => (
                    <button
                      type="button"
                      key={item.conversationId}
                      className={[
                        "renthub-ai-history-item",
                        conversationId === item.conversationId
                          ? "is-active"
                          : "",
                      ].join(" ")}
                      onClick={() =>
                        handleSelectConversation(item.conversationId)
                      }
                      disabled={isStreaming}
                    >
                      <span className="renthub-ai-history-item-title">
                        {item.title || "Cuộc trò chuyện mới"}
                      </span>

                      <span className="renthub-ai-history-item-preview">
                        {item.lastMessagePreview || ""}
                      </span>

                      <span className="renthub-ai-history-item-date">
                        {formatConversationDate(item.updatedAt)}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </aside>
          )}

          <div className="renthub-ai-messages" aria-live="polite">
            <div className="renthub-ai-intro-label">
              TRỢ LÝ THÔNG MINH
            </div>

            {messages.map((message) => (
              <article
                key={message.id}
                className={`renthub-ai-message renthub-ai-message--${message.role}`}
              >
                {message.role === "assistant" && (
                  <div className="renthub-ai-message-avatar">
                    <AssistantMark />
                  </div>
                )}

                <div className="renthub-ai-bubble">
                  {message.content ? (
                    <p>{message.content}</p>
                  ) : (
                    <span
                      className="renthub-ai-typing"
                      aria-label="AI đang trả lời"
                    >
                      <i />
                      <i />
                      <i />
                    </span>
                  )}
                </div>
              </article>
            ))}

            <div ref={messagesEndRef} />
          </div>

          {error && (
            <div className="renthub-ai-error" role="alert">
              <span>{error}</span>

              <button
                type="button"
                onClick={dismissError}
                aria-label="Đóng thông báo lỗi"
              >
                ×
              </button>
            </div>
          )}

          <form
            className="renthub-ai-composer"
            onSubmit={handleSubmit}
          >
            <textarea
              ref={inputRef}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Hỏi RentHub AI điều gì đó..."
              rows={2}
              maxLength={2000}
              aria-label="Tin nhắn gửi RentHub AI"
              disabled={isStreaming || isLoadingHistory}
            />

            <div className="renthub-ai-composer-footer">
              <span>
                Enter để gửi · Shift + Enter xuống dòng
              </span>

              {isStreaming ? (
                <button
                  type="button"
                  className="renthub-ai-stop-button"
                  onClick={stopGeneration}
                >
                  Dừng
                </button>
              ) : (
                <button
                  type="submit"
                  className="renthub-ai-send-button"
                  disabled={!draft.trim() || isLoadingHistory}
                  aria-label="Gửi tin nhắn"
                >
                  ↑
                </button>
              )}
            </div>
          </form>

          <footer className="renthub-ai-disclaimer">
            AI có thể trả lời chưa chính xác. Giá và tình trạng thiết bị
            cần được xác minh từ hệ thống.
          </footer>
        </section>
      )}

      <button
        type="button"
        className={`renthub-ai-launcher${isOpen ? " is-open" : ""}`}
        onClick={() => setIsOpen((current) => !current)}
        aria-label={isOpen ? "Đóng RentHub AI" : "Mở RentHub AI"}
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <span aria-hidden="true">×</span>
        ) : (
          <AssistantMark />
        )}

        {!isOpen && (
          <span className="renthub-ai-launcher-label">
            Hỏi RentHub AI
          </span>
        )}
      </button>
    </div>
  );
}