import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ReportChatMessage } from '../../../../models/Report';

@Component({
  selector: 'app-report-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './report-chat.component.html',
  styleUrl: './report-chat.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ReportChatComponent {
  readonly messages = input<ReportChatMessage[]>([]);
  readonly loading = input(false);
  readonly querySubmit = output<string>();

  readonly query = signal('');

  submit(): void {
    const value = this.query().trim();
    if (!value || this.loading()) return;

    this.querySubmit.emit(value);
    this.query.set('');
  }

  useExample(example: string): void {
    if (this.loading()) return;
    this.query.set(example);
  }
}

