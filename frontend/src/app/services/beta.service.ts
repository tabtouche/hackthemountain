import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class BetaService {
  private _enabled$ = new BehaviorSubject<boolean>(false);

  get enabled$() {
    return this._enabled$.asObservable();
  }

  get enabled(): boolean {
    return this._enabled$.value;
  }

  set enabled(v: boolean) {
    this._enabled$.next(v);
  }

  toggle() {
    this.enabled = !this.enabled;
  }
}
