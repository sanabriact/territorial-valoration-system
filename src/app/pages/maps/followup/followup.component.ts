import { CommonModule, DatePipe } from '@angular/common';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { catchError, forkJoin, interval, of, startWith, switchMap } from 'rxjs';
import { MaterialModule } from '../../../material.module';
import { Entity } from '../../../models/Entity';
import { Official } from '../../../models/Official';
import { EntityService } from '../../../services/entities/entities.service';
import { OfficialService } from '../../../services/officials/official.service';
import { OfficialTrackingMapComponent } from './components/official-tracking-map/official-tracking-map.component';
import { OfficialTrackingMarker } from '../../../models/interfaces/maps/OficcialTrackingMarker';
import { isTrackableOfficial, toOfficialTrackingMarker } from './utils/official-tracking.mapper';

@Component({
  selector: 'app-followup',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MaterialModule,
    OfficialTrackingMapComponent,
  ],
  providers: [DatePipe],
  templateUrl: './followup.component.html',
  styleUrl: './followup.component.scss',
})
export class FollowupComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly entityService = inject(EntityService);
  private readonly officialService = inject(OfficialService);
  private readonly datePipe = inject(DatePipe);

  readonly loading = signal(true);
  readonly refreshing = signal(false);
  readonly hasLoadError = signal(false);
  readonly entities = signal<Entity[]>([]);
  readonly officials = signal<Official[]>([]);
  readonly selectedEntityId = signal<number | null>(null);
  readonly searchQuery = signal('');
  readonly lastUpdate = signal<Date | null>(null);

  readonly entityNameById = computed(() => {
    return new Map(this.entities().map((entity) => [entity.id_entity, entity.name]));
  });

  readonly markers = computed<OfficialTrackingMarker[]>(() => {
    const entityMap = this.entityNameById();

    return this.officials()
      .filter(isTrackableOfficial)
      .map((official) =>
        toOfficialTrackingMarker(
          official,
          entityMap.get(official.id_entity) ?? 'Entidad no registrada',
        ),
      )
      .filter((marker): marker is OfficialTrackingMarker => marker !== null);
  });

  readonly filteredMarkers = computed(() => {
    const selectedEntityId = this.selectedEntityId();
    const query = this.searchQuery().trim().toLowerCase();

    return this.markers().filter((marker) => {
      const matchesEntity = selectedEntityId === null || marker.entityId === selectedEntityId;
      const matchesQuery =
        !query ||
        [marker.name, marker.entityName, marker.role].some((value) =>
          value.toLowerCase().includes(query),
        );

      return matchesEntity && matchesQuery;
    });
  });

  readonly onlineCount = computed(() =>
    this.filteredMarkers().filter((marker) => marker.status === 'online').length,
  );

  readonly offlineCount = computed(() =>
    this.filteredMarkers().filter((marker) => marker.status === 'offline').length,
  );

  ngOnInit(): void {
    this.loadInitialData();
    this.startRealtimeRefresh();
  }

  onEntityFilterChange(value: string): void {
    this.selectedEntityId.set(value ? Number(value) : null);
  }

  refreshNow(): void {
    this.refreshing.set(true);
    this.loadOfficials();
  }

  formatLastUpdate(date: Date | null): string {
    if (!date) return 'Sin registro';
    return this.datePipe.transform(date, 'h:mm a') ?? 'Sin registro';
  }

  private loadInitialData(): void {
    this.loading.set(true);

    forkJoin({
      entities: this.entityService.getAll().pipe(catchError(() => of([] as Entity[]))),
      officials: this.officialService.getAll().pipe(catchError(() => of([] as Official[]))),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ entities, officials }) => {
        this.entities.set(entities);
        this.officials.set(officials);
        this.lastUpdate.set(new Date());
        this.hasLoadError.set(entities.length === 0 && officials.length === 0);
        this.loading.set(false);
      });
  }

  private startRealtimeRefresh(): void {
    interval(15000)
      .pipe(
        startWith(0),
        switchMap(() => this.officialService.getAll().pipe(catchError(() => of(null)))),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((officials) => {
        if (!officials) {
          this.hasLoadError.set(true);
          return;
        }

        this.officials.set(officials);
        this.lastUpdate.set(new Date());
        this.hasLoadError.set(false);
        this.refreshing.set(false);
      });
  }

  private loadOfficials(): void {
    this.officialService.getAll()
      .pipe(
        catchError(() => of(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((officials) => {
        if (!officials) {
          this.hasLoadError.set(true);
          this.refreshing.set(false);
          return;
        }

        this.officials.set(officials);
        this.lastUpdate.set(new Date());
        this.hasLoadError.set(false);
        this.refreshing.set(false);
      });
  }
}
