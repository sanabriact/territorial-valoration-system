import { CommonModule } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { ChartComponent } from 'ng-apexcharts';

import { ReportResponse, ReportViewType } from '../../../../models/Report';
import { ReportChartMapper } from '../../utils/report-chart.mapper';

@Component({
  selector: 'app-report-chart',
  standalone: true,
  imports: [CommonModule, ChartComponent],
  templateUrl: './report-chart.component.html',
  styleUrl: './report-chart.component.scss',
})
export class ReportChartDisplayComponent {
  readonly report = input.required<ReportResponse>();
  readonly viewType = input.required<ReportViewType>();

  readonly chartOptions = computed(() =>
    ReportChartMapper.toChartOptions(this.report(), this.viewType()),
  );
}

