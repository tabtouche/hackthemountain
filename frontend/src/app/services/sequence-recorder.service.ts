import { Injectable } from '@angular/core';
import { Entity } from './entity-stream-service';

export interface SequenceFrame {
  t: number;      // ms since recording start (pauses excluded)
  entities: Entity[];
}

export interface Sequence {
  frames: SequenceFrame[];
  duration: number;  // ms
}

@Injectable({ providedIn: 'root' })
export class SequenceRecorderService {
  private frames: SequenceFrame[] = [];
  private startTime = 0;
  private pausedAt = 0;
  private accumulatedPause = 0;
  private active = false;

  get isActive(): boolean { return this.active; }

  start(): void {
    this.frames = [];
    this.startTime = Date.now();
    this.accumulatedPause = 0;
    this.pausedAt = 0;
    this.active = true;
  }

  pause(): void {
    this.pausedAt = Date.now();
    this.active = false;
  }

  resume(): void {
    this.accumulatedPause += Date.now() - this.pausedAt;
    this.active = true;
  }

  record(entities: Entity[]): void {
    if (!this.active) return;
    const t = Date.now() - this.startTime - this.accumulatedPause;
    this.frames.push({ t, entities });
  }

  stop(): Sequence {
    this.active = false;
    const duration = this.frames.length > 0
      ? this.frames[this.frames.length - 1].t
      : 0;
    return { frames: [...this.frames], duration };
  }

  reset(): void {
    this.active = false;
    this.frames = [];
    this.startTime = 0;
    this.accumulatedPause = 0;
  }
}
