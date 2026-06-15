import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, computed, inject, signal } from '@angular/core';
import Swal from 'sweetalert2';

import {
  ReportChatMessage,
  ReportHistoryEntry,
  ReportResponse,
  ReportViewOption,
  ReportViewType,
} from '../../models/Report';
import { ReportHistoryService } from '../../services/reports/report-history.service';
import { ReportService } from '../../services/reports/report.service';
import { ReportChatComponent } from './components/report-chat/report-chat.component';
import { ReportChartDisplayComponent } from './components/report-chart/report-chart.component';
import { ReportHistoryComponent } from './components/report-history/report-history.component';
import { ReportChartMapper } from './utils/report-chart.mapper';
import { ReportErrorMessageMapper } from './utils/report-error-message.mapper';

type ReportsTab = 'chat' | 'history';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, ReportChatComponent, ReportChartDisplayComponent, ReportHistoryComponent],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ReportsComponent implements OnInit {
  private readonly reportService = inject(ReportService);
  private readonly reportHistoryService = inject(ReportHistoryService);

  readonly loading = signal(false);
  readonly activeTab = signal<ReportsTab>('chat');
  readonly currentReport = signal<ReportResponse | null>(null);
  readonly currentQuery = signal('');
  readonly selectedView = signal<ReportViewType>('simple-bar');
  readonly historyEntries = signal<ReportHistoryEntry[]>([]);
  readonly messages = signal<ReportChatMessage[]>([
    {
      id: 1,
      sender: 'assistant',
      text: 'Escribe una consulta sobre anotaciones, comunas, barrios, categorias o entidades. Te mostrare el reporte en los formatos compatibles.',
      createdAt: new Date(),
    },
  ]);

  readonly viewOptions = computed<ReportViewOption[]>(() =>
    ReportChartMapper.getViewOptions(this.currentReport()),
  );

  readonly activeReport = computed(() => this.currentReport());

  ngOnInit(): void {
    this.historyEntries.set(this.reportHistoryService.getAll());
  }

  submitQuery(query: string): void {
    if (this.loading()) return;

    this.currentQuery.set(query);
    this.pushMessage('user', query);
    this.loading.set(true);

    this.reportService.generate(query).subscribe({
      next: (report) => this.handleReport(report),
      error: (error: HttpErrorResponse) => this.handleError(error),
    });
  }

  selectView(option: ReportViewOption): void {
    if (!option.enabled) {
      void Swal.fire('Formato no disponible', option.disabledReason ?? 'Este formato no aplica al reporte.', 'info');
      return;
    }

    this.selectedView.set(option.type);
  }

  showTab(tab: ReportsTab): void {
    this.activeTab.set(tab);
  }

  restoreHistory(entry: ReportHistoryEntry): void {
    this.currentQuery.set(entry.query);
    this.currentReport.set(entry.report);
    this.selectedView.set(entry.viewType);
    this.activeTab.set('chat');
    this.pushMessage('user', entry.query);
    this.pushMessage('assistant', ReportChartMapper.getSummaryText(entry.report));
  }

  clearHistory(): void {
    this.reportHistoryService.clear();
    this.historyEntries.set([]);
  }

  private handleReport(report: ReportResponse): void {
    this.loading.set(false);
    this.currentReport.set(report);
    const viewType = ReportChartMapper.getDefaultView(report);
    this.selectedView.set(viewType);
    this.historyEntries.set(this.reportHistoryService.save(this.currentQuery(), report, viewType));
    this.pushMessage('assistant', ReportChartMapper.getSummaryText(report));
  }

  private handleError(error: HttpErrorResponse): void {
    this.loading.set(false);
    const message = ReportErrorMessageMapper.toMessage(error);
    this.pushMessage('assistant', message);

    if (error.status >= 500) {
      void Swal.fire('Error', message, 'error');
    }
  }

  private pushMessage(sender: ReportChatMessage['sender'], text: string): void {
    this.messages.update((messages) => [
      ...messages,
      {
        id: Date.now() + messages.length,
        sender,
        text,
        createdAt: new Date(),
      },
    ]);
  }
}
