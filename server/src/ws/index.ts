import { Server } from 'http';

import { WebSocket, WebSocketServer } from 'ws';

type WsMessage =
  | { type: 'dj'; say: string; segue: string }
  | { type: 'track'; name: string; artist: string; uri: string }
  | { type: 'plan'; date: string; trackCount: number }
  | { type: 'mood'; reason: string };

const clients = new Set<WebSocket>();

export function initWebSocket(server: Server): void {
  const wss = new WebSocketServer({ server, path: '/stream' });

  wss.on('connection', (ws) => {
    clients.add(ws);
    console.log('[ws] client connected');

    ws.on('close', () => {
      clients.delete(ws);
      console.log('[ws] client disconnected');
    });

    ws.on('error', (err) => {
      console.error('[ws] client error:', err);
    });
  });
}

export function broadcast(message: WsMessage): void {
  const payload = JSON.stringify(message);
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(payload);
      } catch (err) {
        console.error('[ws] send failed:', err);
      }
    }
  }
}
