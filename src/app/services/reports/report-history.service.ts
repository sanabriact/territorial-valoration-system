import { Injectable, inject } from '@angular/core';

import { ReportHistoryEntry, ReportResponse, ReportViewType } from '../../models/Report';
import { StorageService } from '../storage/storage.service';

@Injectable({
  providedIn: 'root',
})
export class ReportHistoryService {
  private readonly storage = inject(StorageService);
  private readonly storageKey = 'territorial-report-history';
  private readonly maxEntries = 20;

  getAll(): ReportHistoryEntry[] {
    return this.storage.getObject<ReportHistoryEntry[]>(this.storageKey) ?? [];
  }

  save(query: string, report: ReportResponse, viewType: ReportViewType): ReportHistoryEntry[] {
    const entry: ReportHistoryEntry = {
      id: `${Date.now()}`,
      query,
      report,
      viewType,
      createdAt: new Date().toISOString(),
    };

    const entries = [
      entry,
      ...this.getAll().filter((item) => item.query.trim().toLowerCase() !== query.trim().toLowerCase()),
    ].slice(0, this.maxEntries);

    this.storage.setObject(this.storageKey, entries);
    return entries;
  }

  clear(): void {
    this.storage.removeItem(this.storageKey);
  }
}

