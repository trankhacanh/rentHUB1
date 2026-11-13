import axiosClient from "../../../services/axiosClient";

const API_BASE_URL = (
  axiosClient.defaults.baseURL || "http://localhost:8080/api"
).replace(/\/+$/, "");

function readApiError(rawBody, fallback) {
  if (!rawBody) return fallback;

  try {
    const payload = JSON.parse(rawBody);

    return (
      payload.message ||
      payload.error ||
      payload.errors?.[0]?.defaultMessage ||
      payload.errors?.[0] ||
      fallback
    );
  } catch {
    return rawBody.trim() || fallback;
  }
}

function dispatchSseFrame(frame, onToken) {
  let eventName = "message";
  const dataLines = [];

  for (const line of frame.split(/\r\n|\r|\n/)) {
    if (!line || line.startsWith(":")) continue;

    const separatorIndex = line.indexOf(":");
    const field = separatorIndex === -1
      ? line
      : line.slice(0, separatorIndex);

    const value = separatorIndex === -1
      ? ""
      : line.slice(separatorIndex + 1);

    if (field === "event") {
      eventName = value;
    } else if (field === "data") {
      dataLines.push(value);
    }
  }

  if (dataLines.length === 0) return null;

  const data = dataLines.join("\n");

  if (eventName === "token") {
    onToken(data);
    return null;
  }

  if (eventName === "done" || data === "[DONE]") {
    return "done";
  }

  if (eventName === "error") {
    throw new Error(
      data || "RentHub AI đang tạm thời không khả dụng."
    );
  }

  return null;
}

/**
 * Get the latest conversations of current user.
 */
export async function getAiConversations() {
  const response = await axiosClient.get("/ai/conversations");

  return response.data?.data ?? [];
}

/**
 * Get all messages of a conversation.
 */
export async function getAiConversationMessages(conversationId) {
  if (!conversationId) {
    throw new Error("Conversation ID không hợp lệ.");
  }

  const response = await axiosClient.get(
    `/ai/conversations/${encodeURIComponent(conversationId)}/messages`
  );

  return response.data?.data ?? {
    conversationId,
    messages: [],
  };
}

/**
 * Stream AI response using Spring MVC SSE.
 */
export async function streamAiChat({
  message,
  conversationId = null,
  signal,
  onToken,
  onConversationId,
}) {
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("Vui lòng đăng nhập để sử dụng RentHub AI.");
  }

  const response = await fetch(
    `${API_BASE_URL}/ai/chat/stream`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "text/event-stream, application/json",
      },
      body: JSON.stringify({
        message,
        ...(conversationId ? { conversationId } : {}),
      }),
      signal,
    }
  );

  if (!response.ok) {
    const responseBody = await response.text();

    throw new Error(
      readApiError(
        responseBody,
        `Không thể gửi tin nhắn (HTTP ${response.status}).`
      )
    );
  }

  const contentType = response.headers.get("content-type") || "";

  if (!contentType.includes("text/event-stream")) {
    const responseBody = await response.text();

    throw new Error(
      readApiError(
        responseBody,
        "Backend không trả về luồng SSE hợp lệ."
      )
    );
  }

  const returnedConversationId = response.headers.get(
    "X-Conversation-Id"
  );

  if (returnedConversationId) {
    onConversationId?.(returnedConversationId);
  }

  if (!response.body) {
    throw new Error(
      "Trình duyệt không hỗ trợ đọc response streaming này."
    );
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");

  let buffer = "";
  let receivedDoneEvent = false;

  const processFrames = () => {
    const frameBoundary = /\r?\n\r?\n/;
    let match = frameBoundary.exec(buffer);

    while (match) {
      const frame = buffer.slice(0, match.index);

      buffer = buffer.slice(
        match.index + match[0].length
      );

      if (dispatchSseFrame(frame, onToken) === "done") {
        receivedDoneEvent = true;
      }

      match = frameBoundary.exec(buffer);
    }
  };

  try {
    while (true) {
      const { value, done } = await reader.read();

      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      processFrames();
    }

    buffer += decoder.decode();

    if (buffer.trim()) {
      if (dispatchSseFrame(buffer, onToken) === "done") {
        receivedDoneEvent = true;
      }
    }

    if (!receivedDoneEvent) {
      throw new Error(
        "Luồng AI kết thúc mà không nhận được sự kiện [DONE]."
      );
    }

    if (!returnedConversationId) {
      throw new Error(
        "Backend không trả về X-Conversation-Id."
      );
    }

    return {
      conversationId: returnedConversationId,
      completed: true,
    };
  } finally {
    reader.releaseLock();
  }
}