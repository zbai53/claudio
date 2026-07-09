export type WsMessage =
  | { type: 'dj'; say: string; segue: string }
  | { type: 'track'; name: string; artist: string; uri: string }
  | { type: 'plan'; date: string; trackCount: number }
  | { type: 'mood'; reason: string };

export type WsHandler = (message: WsMessage) => void;

export function connectWebSocket(onMessage: WsHandler): WebSocket {
  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${location.host}/stream`;

  const ws = new WebSocket(wsUrl);

  ws.addEventListener('open', () => {
    console.log('[ws] connected');
  });

  ws.addEventListener('message', (event) => {
    try {
      const message = JSON.parse(event.data as string) as WsMessage;
      onMessage(message);
    } catch (err) {
      console.error('[ws] failed to parse message:', err);
    }
  });

  ws.addEventListener('close', () => {
    console.log('[ws] disconnected');
    setTimeout(() => connectWebSocket(onMessage), 3000);
  });

  ws.addEventListener('error', (event) => {
    console.error('[ws] error:', event);
  });

  return ws;
}
