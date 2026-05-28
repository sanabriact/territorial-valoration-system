import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import {
  AddressSearchResult,
  MapCoordinates,
  MapLocation,
} from '../../../../models/interfaces/maps/MapLocation';
import {
  OpenMapsService,
} from '../../../../services/maps/open-maps.service';
import { OpenMapsController } from '../../../../models/interfaces/maps/OpenMapsController';

@Component({
  selector: 'app-citizen-location-picker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './citizen-location-picker.component.html',
  styleUrl: './citizen-location-picker.component.scss',
})
export class CitizenLocationPickerComponent implements AfterViewInit, OnDestroy {
  private readonly openMapsService = inject(OpenMapsService);
  private readonly mapTarget = viewChild.required<ElementRef<HTMLDivElement>>('mapTarget');

  readonly initialLocation = input<MapLocation | null>(null);
  readonly readOnly = input(false, { alias: 'readonly' });

  readonly locationSelected = output<MapLocation>();
  readonly locationCleared = output<void>();

  readonly selectedLocation = signal<MapLocation | null>(null);
  readonly searchQuery = signal('');
  readonly searchResults = signal<AddressSearchResult[]>([]);
  readonly searching = signal(false);
  readonly resolvingAddress = signal(false);
  readonly errorMessage = signal('');

  private mapController: OpenMapsController | null = null;
  private removeClickListener: (() => void) | null = null;
  private syncedLocationKey = '';

  constructor() {
    effect(() => {
      const location = this.initialLocation();

      if (this.mapController) {
        this.syncInitialLocation(location);
      }
    });
  }

  ngAfterViewInit(): void {
    const initialLocation = this.initialLocation();
    const center = initialLocation ?? this.openMapsService.manizalesCenter;

    this.mapController = this.openMapsService.createMap(this.mapTarget().nativeElement, {
      center,
      zoom: initialLocation ? 16 : 13,
    });

    if (!this.readOnly()) {
      this.removeClickListener = this.mapController.onMapClick((point) => this.selectPoint(point));
    }

    this.syncInitialLocation(initialLocation);
  }

  ngOnDestroy(): void {
    this.removeClickListener?.();
    this.mapController?.destroy();
  }

  onSearchInput(query: string): void {
    this.searchQuery.set(query);

    if (!query.trim()) {
      this.searchResults.set([]);
      this.errorMessage.set('');
    }
  }

  searchAddress(): void {
    const query = this.searchQuery().trim();

    if (!query || this.readOnly()) {
      return;
    }

    this.searching.set(true);
    this.errorMessage.set('');

    this.openMapsService
      .searchAddress(query)
      .pipe(finalize(() => this.searching.set(false)))
      .subscribe({
        next: (results) => {
          this.searchResults.set(results);

          if (results.length === 0) {
            this.errorMessage.set('No se encontraron coincidencias para esa direccion.');
          }
        },
        error: () => {
          this.errorMessage.set('No se pudo buscar la direccion.');
          this.searchResults.set([]);
        },
      });
  }

  selectSearchResult(result: AddressSearchResult): void {
    this.searchQuery.set(result.label);
    this.searchResults.set([]);
    this.applyLocation(result, true, 17);
  }

  clearLocation(): void {
    if (this.readOnly()) {
      return;
    }

    this.selectedLocation.set(null);
    this.searchQuery.set('');
    this.searchResults.set([]);
    this.errorMessage.set('');
    this.mapController?.setMarker(null);
    this.locationCleared.emit();
  }

  private selectPoint(point: MapCoordinates): void {
    const fallbackLocation: MapLocation = {
      ...point,
      address: this.openMapsService.formatCoordinates(point),
    };

    this.applyLocation(fallbackLocation, true);
    this.resolvingAddress.set(true);
    this.errorMessage.set('');

    this.openMapsService
      .reverseGeocode(point)
      .pipe(finalize(() => this.resolvingAddress.set(false)))
      .subscribe((address) => {
        this.applyLocation({ ...point, address }, true);
      });
  }

  private syncInitialLocation(location: MapLocation | null): void {
    const key = location
      ? `${location.latitude.toFixed(6)},${location.longitude.toFixed(6)},${location.address}`
      : '';

    if (key === this.syncedLocationKey) {
      return;
    }

    this.syncedLocationKey = key;

    if (!location) {
      this.selectedLocation.set(null);
      this.mapController?.setMarker(null);
      return;
    }

    this.applyLocation(location, false, 16);

    if (!location.address.trim()) {
      this.resolvingAddress.set(true);
      this.openMapsService
        .reverseGeocode(location)
        .pipe(finalize(() => this.resolvingAddress.set(false)))
        .subscribe((address) => {
          this.applyLocation({ ...location, address }, true, 16);
        });
    }
  }

  private applyLocation(location: MapLocation, emit: boolean, zoom?: number): void {
    this.selectedLocation.set(location);
    this.mapController?.setMarker(location);
    this.mapController?.setCenter(location, zoom);

    if (emit) {
      this.locationSelected.emit(location);
    }
  }
}
