import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface Entity {
  animal: 'rabbit' | 'wolf' | string;
  x: number;
  y: number;
  orientation: number;
  angleMouth: number;
  facing: 'left' | 'right' | string;
}

const PUPPET_WS_URL = 'ws://localhost:8765';

@Injectable({
  providedIn: 'root'
})
export class EntityStreamService {
  stream(): Observable<Entity[]> {
    return new Observable<Entity[]>(observer => {
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
            if (msg.type === 'frame') return;
            if (msg.type === 'hands' && Array.isArray(msg.entities)) {
              observer.next(msg.entities as Entity[]);
            }
          } catch { /* ignore malformed frames */ }
        };

        const scheduleReconnect = () => {
          if (reconnectTimer) clearTimeout(reconnectTimer);
          reconnectTimer = setTimeout(connect, 1000);
        };

        ws.onerror = scheduleReconnect;
        ws.onclose = scheduleReconnect;
      };

      connect();

      // Teardown: close WS and cancel any pending reconnect
      return () => {
        if (reconnectTimer) clearTimeout(reconnectTimer);
        ws?.close();
      };
    });
  }
}
