import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UiService {
  private _manageMode = new BehaviorSubject<boolean>(false);
  readonly manageMode$ = this._manageMode.asObservable();

  toggleManage(): void {
    this._manageMode.next(!this._manageMode.value);
  }

  setManage(value: boolean): void {
    this._manageMode.next(value);
  }

  get value(): boolean {
    return this._manageMode.value;
  }
}
