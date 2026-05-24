import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

const PUPPET_WS_URL = 'ws://localhost:8765';

@Injectable({ providedIn: 'root' })
export class VideoStreamService {
  stream(): Observable<string> {
    return new Observable<string>(observer => {
      if (typeof window === 'undefined' || !('WebSocket' in window)) {
        observer.complete();
        return;
      }

      let ws: WebSocket;
      let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
      let reconnectAttempts = 0;
      const MAX_RECONNECT_ATTEMPTS = 3;
      const BASE_DELAY = 2000;

      const connect = () => {
        if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
          return; // Stop trying after max attempts
        }

        ws = new WebSocket(PUPPET_WS_URL);

        ws.onopen = () => {
          reconnectAttempts = 0; // Reset on successful connection
        };

        ws.onmessage = (ev) => {
          try {
            const msg = JSON.parse(ev.data);
            if (msg.type === 'frame' && msg.data) {
              observer.next(`data:image/jpeg;base64,${msg.data}`);
            }
          } catch { /* ignore */ }
        };

        const scheduleReconnect = () => {
          if (reconnectTimer) clearTimeout(reconnectTimer);
          reconnectAttempts++;
          
          if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            // Exponential backoff: 2s, 4s, 8s
            const delay = BASE_DELAY * Math.pow(2, reconnectAttempts - 1);
            reconnectTimer = setTimeout(connect, delay);
          }
        };

        ws.onerror = () => {
          scheduleReconnect();
        };
        ws.onclose = scheduleReconnect;
      };

      connect();

      return () => {
        if (reconnectTimer) clearTimeout(reconnectTimer);
        ws?.close();
      };
    });
  }
}
