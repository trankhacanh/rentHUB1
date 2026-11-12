
import { Client } from '@stomp/stompjs';

class ChatSocket {
  constructor() {
    this.client = null;
    this.userId = null;
    this.connected = false;
    this.heartbeatTimer = null;
    this.subscriptions = new Map();
    this.nextSubscriptionId = 1;
  }

  connect(userId) {
    if (!userId) {
      console.error('[ChatSocket] Missing userId');
      return;
    }

    const normalizedUserId = String(userId);

    // Reuse the existing connection for the same authenticated user.
    if (
      this.client &&
      this.userId === normalizedUserId &&
      this.client.active
    ) {
      return;
    }

    // A different user must not inherit the previous user's subscriptions.
    if (this.client || this.userId !== null) {
      this.disconnect();
    }

    const token = localStorage.getItem('token');

    if (!token) {
      console.error('[ChatSocket] Missing JWT token');
      return;
    }

    this.userId = normalizedUserId;

    const client = new Client({
      brokerURL: 'ws://localhost:8080/ws',

      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },

      reconnectDelay: 5000,

      onConnect: () => {
        // Ignore callbacks belonging to a replaced connection.
        if (this.client !== client) {
          return;
        }

        this.connected = true;

        console.info(
          `[ChatSocket] Connected for user ${this.userId}`
        );

        // Restore subscriptions after connecting or reconnecting.
        for (const entry of this.subscriptions.values()) {
          this.activateSubscription(entry);
        }

        this.startHeartbeat();
      },

      onDisconnect: () => {
        if (this.client !== client) {
          return;
        }

        this.connected = false;
        this.stopHeartbeat();

        // Keep the subscription registry for possible recovery.
        this.resetSubscriptions();
      },

      onStompError: (frame) => {
        console.error(
          '[ChatSocket] STOMP error:',
          frame.headers?.message,
          frame.body
        );
      },

      onWebSocketError: (error) => {
        console.error('[ChatSocket] WebSocket error:', error);
      },

      onWebSocketClose: () => {
        if (this.client !== client) {
          return;
        }

        this.connected = false;
        this.stopHeartbeat();

        // Do not clear the registry: STOMP may reconnect automatically.
        this.resetSubscriptions();
      },
    });

    this.client = client;
    void client.activate();
  }

  subscribe(destination, callback) {
    if (!destination || typeof callback !== 'function') {
      throw new Error(
        '[ChatSocket] destination and callback are required'
      );
    }

    const entry = {
      id: this.nextSubscriptionId++,
      destination,
      callback,
      subscription: null,
    };

    this.subscriptions.set(entry.id, entry);

    if (this.connected) {
      this.activateSubscription(entry);
    }

    // Each component owns only the subscription it created.
    return {
      unsubscribe: () => {
        const current = this.subscriptions.get(entry.id);

        if (current !== entry) {
          return;
        }

        try {
          current.subscription?.unsubscribe();
        } catch (error) {
          console.warn(
            '[ChatSocket] Failed to unsubscribe:',
            current.destination,
            error
          );
        } finally {
          this.subscriptions.delete(entry.id);
          current.subscription = null;
        }
      },
    };
  }

  activateSubscription(entry) {
    // Prevent removed or stale entries from being reactivated.
    if (this.subscriptions.get(entry.id) !== entry) {
      return;
    }

    if (!this.client?.connected || entry.subscription) {
      return;
    }

    entry.subscription = this.client.subscribe(
      entry.destination,
      (message) => {
        try {
          const data = JSON.parse(message.body);
          entry.callback(data, message);
        } catch (error) {
          console.error(
            `[ChatSocket] Failed to process ${entry.destination}:`,
            error
          );
        }
      }
    );
  }

  publish(destination, payload = {}) {
    if (!this.client?.connected) {
      console.warn(
        '[ChatSocket] Cannot publish: WebSocket is not connected'
      );
      return false;
    }

    this.client.publish({
      destination,
      body:
        typeof payload === 'string'
          ? payload
          : JSON.stringify(payload),
    });

    return true;
  }

  startHeartbeat() {
    this.stopHeartbeat();

    const sendHeartbeat = () => {
      if (!this.client?.connected) {
        return;
      }

      this.client.publish({
        destination: '/app/presence/heartbeat',
        body: '{}',
      });
    };

    sendHeartbeat();

    this.heartbeatTimer = setInterval(
      sendHeartbeat,
      30_000
    );
  }

  stopHeartbeat() {
    if (this.heartbeatTimer !== null) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  resetSubscriptions() {
    // A lost connection invalidates STOMP subscription handles,
    // but the entries must remain available for reconnection.
    for (const entry of this.subscriptions.values()) {
      entry.subscription = null;
    }
  }

  disconnect() {
    this.stopHeartbeat();

    // Explicit disconnect means logout or switching accounts.
    // Remove all old subscriptions so they cannot be restored
    // on a connection belonging to another user.
    for (const entry of this.subscriptions.values()) {
      try {
        entry.subscription?.unsubscribe();
      } catch (error) {
        console.warn(
          '[ChatSocket] Failed to unsubscribe during disconnect:',
          entry.destination,
          error
        );
      }

      entry.subscription = null;
    }

    this.subscriptions.clear();

    const client = this.client;

    // Reset the shared state before deactivating the old client.
    this.client = null;
    this.connected = false;
    this.userId = null;

    if (client) {
      void client.deactivate();
    }

    console.info('[ChatSocket] Disconnected');
  }
}

const chatSocket = new ChatSocket();

export default chatSocket;
