export type ReportChartType = 'bar' | 'pie' | 'line';
export type ReportViewType = 'simple-bar' | 'grouped-bar' | 'pie' | 'line';

export interface ReportQueryRequest {
  query: string;
}

export interface ReportSeries {
  name: string;
  data: number[];
}

export interface ReportResponse {
  type: ReportChartType;
  labels?: string[];
  categories?: string[];
  series: number[] | ReportSeries[];
  title?: string;
  subtitle?: string;
  message?: string;
}

export interface ReportViewOption {
  type: ReportViewType;
  label: string;
  icon: string;
  enabled: boolean;
  disabledReason?: string;
}

export interface ReportChatMessage {
  id: number;
  sender: 'user' | 'assistant';
  text: string;
  createdAt: Date;
}

export interface ReportHistoryEntry {
  id: string;
  query: string;
  report: ReportResponse;
  viewType: ReportViewType;
  createdAt: string;
}
