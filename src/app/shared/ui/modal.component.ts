import { Component, input, output, HostListener } from '@angular/core';

@Component({
  selector: 'app-modal',
  standalone: true,
  templateUrl: './modal.component.html',
})
export class ModalComponent {
  close = output<void>();

  @HostListener('document:keydown.escape')
  onEsc(): void {
    this.close.emit();
  }
}
