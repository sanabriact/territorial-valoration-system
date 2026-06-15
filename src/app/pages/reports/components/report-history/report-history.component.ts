import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, input, output } from '@angular/core';

import { ReportHistoryEntry } from '../../../../models/Report';

@Component({
  selector: 'app-report-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './report-history.component.html',
  styleUrl: './report-history.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ReportHistoryComponent {
  readonly entries = input<ReportHistoryEntry[]>([]);
  readonly entrySelected = output<ReportHistoryEntry>();
  readonly historyCleared = output<void>();
}

