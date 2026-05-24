import { Component, EventEmitter, Input, Output, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-alert-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay" (click)="onClose()">
      <div class="modal-box" (click)="$event.stopPropagation()">
        <div class="modal-icon">{{ icon }}</div>
        <h2 class="modal-title">{{ title }}</h2>
        <p class="modal-message">{{ message }}</p>
        <div class="modal-buttons">
          <button *ngIf="showCancel" class="btn-cancel" (click)="onCancel()">{{ cancelText }}</button>
          <button class="btn-confirm" (click)="onConfirm()">{{ confirmText }}</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      backdrop-filter: blur(5px);
      animation: fadeIn 0.2s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .modal-box {
      background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
      border: 4px solid white;
      border-radius: 25px;
      padding: 40px;
      max-width: 500px;
      width: 90%;
      box-shadow: 0 20px 60px rgba(0,0,0,0.4);
      text-align: center;
      animation: slideIn 0.3s ease-out;
      font-family: 'Comic Sans MS', cursive, sans-serif;
    }

    @keyframes slideIn {
      from {
        transform: translateY(-50px) scale(0.9);
        opacity: 0;
      }
      to {
        transform: translateY(0) scale(1);
        opacity: 1;
      }
    }

    .modal-icon {
      font-size: 4rem;
      margin-bottom: 20px;
    }

    .modal-title {
      margin: 0 0 15px 0;
      color: #d63031;
      font-size: 2rem;
      text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
    }

    .modal-message {
      margin: 0 0 30px 0;
      color: #2d3436;
      font-size: 1.2rem;
      line-height: 1.6;
      white-space: pre-line;
    }

    .modal-buttons {
      display: flex;
      gap: 15px;
      justify-content: center;
    }

    .btn-confirm, .btn-cancel {
      padding: 15px 30px;
      font-size: 18px;
      border: none;
      border-radius: 25px;
      cursor: pointer;
      font-weight: bold;
      box-shadow: 0 4px 15px rgba(0,0,0,0.2);
      transition: transform 0.2s;
      font-family: 'Comic Sans MS', cursive, sans-serif;
    }

    .btn-confirm {
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
      color: white;
    }

    .btn-cancel {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      color: white;
    }

    .btn-confirm:hover, .btn-cancel:hover {
      transform: scale(1.05);
    }
  `]
})
export class AlertModalComponent implements OnInit, OnDestroy {
  @Input() title: string = 'Attention';
  @Input() message: string = '';
  @Input() icon: string = '⚠️';
  @Input() confirmText: string = 'OK';
  @Input() cancelText: string = 'Annuler';
  @Input() showCancel: boolean = false;
  @Input() autoDismiss: number = 0; // Auto-dismiss after N milliseconds (0 = disabled)
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  private autoDismissTimer: any = null;

  ngOnInit(): void {
    if (this.autoDismiss > 0) {
      this.autoDismissTimer = setTimeout(() => {
        this.onConfirm();
      }, this.autoDismiss);
    }
  }

  ngOnDestroy(): void {
    if (this.autoDismissTimer) {
      clearTimeout(this.autoDismissTimer);
    }
  }

  onConfirm(): void {
    if (this.autoDismissTimer) {
      clearTimeout(this.autoDismissTimer);
    }
    this.confirm.emit();
    this.close.emit();
  }

  onCancel(): void {
    if (this.autoDismissTimer) {
      clearTimeout(this.autoDismissTimer);
    }
    this.cancel.emit();
    this.close.emit();
  }

  onClose(): void {
    if (!this.showCancel) {
      if (this.autoDismissTimer) {
        clearTimeout(this.autoDismissTimer);
      }
      this.close.emit();
    }
  }
}
