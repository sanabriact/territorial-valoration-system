import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, CUSTOM_ELEMENTS_SCHEMA, computed, inject, signal } from '@angular/core';
import Swal from 'sweetalert2';

import {
  ReportChatMessage,
  ReportResponse,
  ReportViewOption,
  ReportViewType,
} from '../../models/Report';
import { ReportService } from '../../services/reports/report.service';
import { ReportChatComponent } from './components/report-chat/report-chat.component';
import { ReportChartDisplayComponent } from './components/report-chart/report-chart.component';
import { ReportChartMapper } from './utils/report-chart.mapper';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, ReportChatComponent, ReportChartDisplayComponent],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ReportsComponent {
  private readonly reportService = inject(ReportService);

  readonly loading = signal(false);
  readonly currentReport = signal<ReportResponse | null>(null);
  readonly selectedView = signal<ReportViewType>('simple-bar');
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

  submitQuery(query: string): void {
    if (this.loading()) return;

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

  private handleReport(report: ReportResponse): void {
    this.loading.set(false);
    this.currentReport.set(report);
    this.selectedView.set(ReportChartMapper.getDefaultView(report));
    this.pushMessage('assistant', ReportChartMapper.getSummaryText(report));
  }

  private handleError(error: HttpErrorResponse): void {
    this.loading.set(false);
    const message = this.getErrorMessage(error);
    this.pushMessage('assistant', message);

    if (error.status >= 500) {
      void Swal.fire('Error', message, 'error');
    }
  }

  private getErrorMessage(error: HttpErrorResponse): string {
    if (error.status === 400) {
      return 'La consulta esta vacia o malformada. Intenta escribir una pregunta mas especifica.';
    }

    if (error.status === 422) {
      return 'No pude asociar la consulta a un tipo de reporte. Prueba con ejemplos como: anotaciones por categoria este mes, top barrios con mas puntos criticos o anotaciones por entidad responsable.';
    }

    if (error.status === 404) {
      return 'No hay registros para los filtros indicados en la consulta.';
    }

    return 'No se pudo generar el reporte en este momento. Intenta nuevamente.';
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

