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

      const connect = () => {
        ws = new WebSocket(PUPPET_WS_URL);

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
          reconnectTimer = setTimeout(connect, 1000);
        };

        ws.onerror = scheduleReconnect;
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
