import { describe, it, expect, vi, beforeEach } from 'vitest'

// Move mocks to module scope
const mockSubscribe = vi.fn();
const mockActivate = vi.fn();
const mockDeactivate = vi.fn();

type StompMessage = { body: string }
let connectWebSocketCallback: ((msg: StompMessage) => void) | null = null;
vi.mock('@stomp/stompjs', () => ({
  Client: class {
    constructor(config?: { onConnect?: () => void }) {
      // Intercept the onConnect callback and simulate subscription
      if (config && typeof config.onConnect === 'function') {
        setTimeout(() => {
          // Simulate subscription inside onConnect
          config.onConnect?.();
        }, 0);
      }
    }
    subscribe(path: string, cb: (msg: StompMessage) => void) {
      mockSubscribe(path);
      connectWebSocketCallback = cb;
    }
    activate() {
      mockActivate();
      setTimeout(() => {
        if (connectWebSocketCallback) {
          connectWebSocketCallback({ body: JSON.stringify({ id: 'n1', notifType: 't', message: 'm', createdAt: '', read: false }) });
        }
      }, 0);
    }
    deactivate() {
      mockDeactivate();
    }
  }
}));
vi.mock('sockjs-client', () => ({ default: () => ({}) }))

describe('websocket', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    localStorage.clear();
    mockSubscribe.mockClear();
    mockActivate.mockClear();
    mockDeactivate.mockClear();
    connectWebSocketCallback = null;
  });

  it('connectWebSocket subscribes and processes messages', async () => {
    const ws = await import('../../features/notifications/api/websocket')

  const received: Array<{ id: string; notifType: string; message: string; createdAt: string; read: boolean }> = []
    const messagePromise = new Promise<void>((resolve) => {
      ws.connectWebSocket('user-1', (n) => {
        received.push(n)
        resolve()
      })
    })

    await messagePromise
    expect(received.length).toBeGreaterThanOrEqual(1)
    ws.disconnectWebSocket()
  })
})
