import {
  ApexAxisChartSeries,
  ApexChart,
  ApexDataLabels,
  ApexGrid,
  ApexLegend,
  ApexNonAxisChartSeries,
  ApexPlotOptions,
  ApexStroke,
  ApexTitleSubtitle,
  ApexXAxis,
  ApexYAxis,
} from 'ng-apexcharts';

import { ReportResponse, ReportSeries, ReportViewOption, ReportViewType } from '../../../models/Report';

export interface ReportChartOptions {
  chart: ApexChart;
  series: ApexAxisChartSeries | ApexNonAxisChartSeries;
  labels: string[];
  xaxis: ApexXAxis;
  yaxis: ApexYAxis | ApexYAxis[];
  plotOptions: ApexPlotOptions;
  dataLabels: ApexDataLabels;
  stroke: ApexStroke;
  legend: ApexLegend;
  grid: ApexGrid;
  title: ApexTitleSubtitle;
  subtitle: ApexTitleSubtitle;
  colors: string[];
}

const CHART_COLORS = ['#2563eb', '#0f766e', '#f97316', '#7c3aed', '#dc2626', '#0891b2'];

export class ReportChartMapper {
  static getViewOptions(report: ReportResponse | null): ReportViewOption[] {
    const baseOptions: ReportViewOption[] = [
      { type: 'simple-bar', label: 'Barra simple', icon: 'solar:chart-2-bold', enabled: false },
      { type: 'grouped-bar', label: 'Barra agrupada', icon: 'solar:chart-square-bold', enabled: false },
      { type: 'pie', label: 'Circular', icon: 'solar:pie-chart-2-bold', enabled: false },
      { type: 'line', label: 'Lineas', icon: 'solar:chart-bold', enabled: false },
    ];

    if (!report) {
      return baseOptions.map((option) => ({
        ...option,
        disabledReason: 'Genera un reporte para habilitar este formato.',
      }));
    }

    const axisSeries = this.toAxisSeries(report);
    const categories = this.getCategories(report);
    const singleSeries = axisSeries.length === 1;
    const hasValues = axisSeries.some((series) => series.data.length > 0);

    return baseOptions.map((option) => {
      const enabled = this.isViewEnabled(option.type, report, axisSeries, categories, singleSeries, hasValues);
      return {
        ...option,
        enabled,
        disabledReason: enabled ? undefined : this.getDisabledReason(option.type),
      };
    });
  }

  static getDefaultView(report: ReportResponse): ReportViewType {
    const options = this.getViewOptions(report);
    const preferredByBackend: Record<string, ReportViewType> = {
      bar: 'simple-bar',
      pie: 'pie',
      line: 'line',
    };
    const preferred = preferredByBackend[report.type];
    return options.find((option) => option.type === preferred && option.enabled)?.type
      ?? options.find((option) => option.enabled)?.type
      ?? 'simple-bar';
  }

  static toChartOptions(report: ReportResponse, viewType: ReportViewType): ReportChartOptions {
    const categories = this.getCategories(report);
    const axisSeries = this.toAxisSeries(report);
    const title = report.title ?? this.getFallbackTitle(viewType);
    const subtitle = report.subtitle ?? 'Reporte generado desde consulta en lenguaje natural';

    if (viewType === 'pie') {
      return this.toPieOptions(report, categories, title, subtitle);
    }

    return {
      chart: {
        type: viewType === 'line' ? 'line' : 'bar',
        height: 310,
        toolbar: { show: false },
        fontFamily: 'Inter, Arial, sans-serif',
      },
      series: viewType === 'simple-bar' ? [axisSeries[0]] : axisSeries,
      labels: [],
      xaxis: {
        categories,
        labels: { style: { colors: '#223154', fontWeight: 700 } },
      },
      yaxis: {
        labels: { style: { colors: '#223154', fontWeight: 700 } },
        title: { text: 'Valor', style: { color: '#223154', fontWeight: 800 } },
      },
      plotOptions: {
        bar: {
          horizontal: viewType === 'simple-bar',
          borderRadius: 4,
          columnWidth: '52%',
          dataLabels: { position: 'top' },
        },
      },
      dataLabels: {
        enabled: viewType !== 'line',
        style: { colors: ['#102044'], fontWeight: 800 },
      },
      stroke: {
        curve: 'smooth',
        width: viewType === 'line' ? 3 : 0,
      },
      legend: {
        show: axisSeries.length > 1,
        position: 'top',
        horizontalAlign: 'right',
        fontWeight: 800,
      },
      grid: {
        borderColor: '#e6ebf4',
        strokeDashArray: 3,
      },
      title: {
        text: title,
        style: { color: '#121a3d', fontWeight: 900, fontSize: '15px' },
      },
      subtitle: {
        text: subtitle,
        style: { color: '#5f6b84', fontWeight: 700 },
      },
      colors: CHART_COLORS,
    };
  }

  static getSummaryText(report: ReportResponse): string {
    const categories = this.getCategories(report);
    const series = this.toAxisSeries(report);
    const total = series.reduce(
      (sum, item) => sum + item.data.reduce((seriesSum, value) => seriesSum + Number(value || 0), 0),
      0,
    );

    if (report.message) return report.message;
    if (categories.length === 0) return 'El reporte fue generado correctamente.';
    return `He encontrado ${total} registros distribuidos en ${categories.length} categoria(s).`;
  }

  private static toPieOptions(
    report: ReportResponse,
    categories: string[],
    title: string,
    subtitle: string,
  ): ReportChartOptions {
    return {
      chart: {
        type: 'pie',
        height: 310,
        toolbar: { show: false },
        fontFamily: 'Inter, Arial, sans-serif',
      },
      series: this.toPieSeries(report),
      labels: categories,
      xaxis: {},
      yaxis: {},
      plotOptions: {},
      dataLabels: {
        enabled: true,
        style: { fontWeight: 900 },
      },
      stroke: { width: 2, colors: ['#ffffff'] },
      legend: {
        show: true,
        position: 'bottom',
        fontWeight: 800,
      },
      grid: {},
      title: {
        text: title,
        style: { color: '#121a3d', fontWeight: 900, fontSize: '15px' },
      },
      subtitle: {
        text: subtitle,
        style: { color: '#5f6b84', fontWeight: 700 },
      },
      colors: CHART_COLORS,
    };
  }

  private static toAxisSeries(report: ReportResponse): ReportSeries[] {
    if (this.isNumberSeries(report.series)) {
      return [{ name: 'Resultado', data: report.series }];
    }

    return report.series.map((series) => ({
      name: series.name,
      data: series.data.map((value) => Number(value || 0)),
    }));
  }

  private static toPieSeries(report: ReportResponse): number[] {
    if (this.isNumberSeries(report.series)) {
      return report.series.map((value) => Number(value || 0));
    }

    return report.series[0]?.data.map((value) => Number(value || 0)) ?? [];
  }

  private static getCategories(report: ReportResponse): string[] {
    const axisSeries = this.toAxisSeries(report);
    const length = axisSeries[0]?.data.length ?? this.toPieSeries(report).length;

    return report.labels?.length
      ? report.labels
      : report.categories?.length
        ? report.categories
        : Array.from({ length }, (_, index) => `Dato ${index + 1}`);
  }

  private static isViewEnabled(
    viewType: ReportViewType,
    report: ReportResponse,
    series: ReportSeries[],
    categories: string[],
    singleSeries: boolean,
    hasValues: boolean,
  ): boolean {
    if (!hasValues || categories.length === 0) return false;
    if (viewType === 'grouped-bar') return series.length > 1;
    if (viewType === 'pie') return singleSeries;
    if (viewType === 'line') return report.type === 'line' || series.length > 1 || categories.length > 1;
    return singleSeries;
  }

  private static getDisabledReason(viewType: ReportViewType): string {
    const reasons: Record<ReportViewType, string> = {
      'simple-bar': 'Requiere una sola serie de datos.',
      'grouped-bar': 'Requiere dos o mas series comparables.',
      pie: 'Requiere una distribucion de una sola serie.',
      line: 'Requiere datos ordenados o comparables en una secuencia.',
    };

    return reasons[viewType];
  }

  private static getFallbackTitle(viewType: ReportViewType): string {
    const titles: Record<ReportViewType, string> = {
      'simple-bar': 'Reporte en barra simple',
      'grouped-bar': 'Reporte en barra agrupada',
      pie: 'Reporte circular',
      line: 'Reporte en lineas',
    };

    return titles[viewType];
  }

  private static isNumberSeries(series: ReportResponse['series']): series is number[] {
    return Array.isArray(series) && (series.length === 0 || typeof series[0] === 'number');
  }
}

