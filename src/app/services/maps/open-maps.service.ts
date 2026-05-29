import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, of, shareReplay, tap } from 'rxjs';
import {
  AddressSearchResult,
  MapCoordinates,
} from '../../models/interfaces/maps/MapLocation';
import { OpenLayersMapsController } from '../../models/interfaces/maps/OpenLayersMapsController';
import { OpenMapsController } from '../../models/interfaces/maps/OpenMapsController';
import { NominatimReverseResponse } from '../../models/interfaces/maps/NominatimReverseResponse';
import { NominatimSearchResponse } from '../../models/interfaces/maps/NominatimSearchResponse';

@Injectable({
  providedIn: 'root',
})
export class OpenMapsService {
  private readonly reverseGeocodeUrl = 'https://nominatim.openstreetmap.org/reverse';
  private readonly searchUrl = 'https://nominatim.openstreetmap.org/search';
  private readonly addressCache = new Map<string, string>();
  private readonly addressRequestCache = new Map<string, Observable<string>>();

  readonly manizalesCenter: MapCoordinates = {
    latitude: 5.070275,
    longitude: -75.513817,
  };

  constructor(private readonly http: HttpClient) {}

  createMap(target: HTMLElement, options: { center?: MapCoordinates; zoom?: number } = {}): OpenMapsController {
    return new OpenLayersMapsController(
      target,
      options.center ?? this.manizalesCenter,
      options.zoom ?? 13,
    );
  }

  reverseGeocode(point: MapCoordinates): Observable<string> {
    if (!this.hasValidCoordinates(point)) {
      return of('Direccion no disponible');
    }

    const cacheKey = this.getCacheKey(point);
    const cachedAddress = this.addressCache.get(cacheKey);

    if (cachedAddress) {
      return of(cachedAddress);
    }

    const cachedRequest = this.addressRequestCache.get(cacheKey);

    if (cachedRequest) {
      return cachedRequest;
    }

    const params = new HttpParams()
      .set('format', 'jsonv2')
      .set('lat', String(point.latitude))
      .set('lon', String(point.longitude))
      .set('addressdetails', '1')
      .set('accept-language', 'es');

    const request = this.http.get<NominatimReverseResponse>(this.reverseGeocodeUrl, { params }).pipe(
      map((response) => this.extractReadableAddress(response) || this.formatCoordinates(point)),
      tap((address) => this.addressCache.set(cacheKey, address)),
      catchError(() => of(this.formatCoordinates(point))),
      shareReplay(1),
    );

    this.addressRequestCache.set(cacheKey, request);
    return request;
  }

  searchAddress(query: string): Observable<AddressSearchResult[]> {
    const normalizedQuery = query.trim();

    if (!normalizedQuery) {
      return of([]);
    }

    const params = new HttpParams()
      .set('format', 'jsonv2')
      .set('q', `${normalizedQuery}, Manizales, Caldas, Colombia`)
      .set('limit', '5')
      .set('addressdetails', '1')
      .set('accept-language', 'es');

    return this.http.get<NominatimSearchResponse[]>(this.searchUrl, { params }).pipe(
      map((results) =>
        results
          .map((result) => ({
            latitude: Number(result.lat),
            longitude: Number(result.lon),
            address: result.display_name,
            label: result.display_name,
          }))
          .filter((result) => this.hasValidCoordinates(result)),
      ),
      catchError(() => of([])),
    );
  }

  formatCoordinates(point: MapCoordinates): string {
    return `${point.latitude.toFixed(6)}, ${point.longitude.toFixed(6)}`;
  }

  private extractReadableAddress(response: NominatimReverseResponse): string {
    const address = response.address;

    if (!address) {
      return response.display_name ?? '';
    }

    const road = address['road'] ?? address['pedestrian'] ?? address['footway'] ?? address['path'];
    const houseNumber = address['house_number'];
    const neighborhood = address['suburb'] ?? address['neighbourhood'];
    const city = address['city'] ?? address['town'] ?? address['municipality'] ?? address['county'];
    const department = address['state'];
    const firstPart = road ? `${road}${houseNumber ? ` # ${houseNumber}` : ''}` : neighborhood;
    const parts = [firstPart, city, department].filter(Boolean);

    if (parts.length > 0) {
      return parts.join(', ');
    }

    return response.display_name ?? '';
  }

  private hasValidCoordinates(point: MapCoordinates): boolean {
    return (
      Number.isFinite(point.latitude) &&
      Number.isFinite(point.longitude) &&
      point.latitude >= -90 &&
      point.latitude <= 90 &&
      point.longitude >= -180 &&
      point.longitude <= 180
    );
  }

  private getCacheKey(point: MapCoordinates): string {
    return `${point.latitude.toFixed(6)},${point.longitude.toFixed(6)}`;
  }
}


