import { Official } from '../../../../models/Official';
import { OfficialTrackingMarker } from '../../../../models/interfaces/maps/OficcialTrackingMarker';

export function toOfficialTrackingMarker(
  official: Official,
  entityName: string,
): OfficialTrackingMarker | null {
  const latitude = Number(official.last_latitude);
  const longitude = Number(official.last_longitude);

  if (!hasValidManizalesCoordinates(latitude, longitude)) {
    return null;
  }

  return {
    id: official.id_official,
    entityId: official.id_entity,
    entityName,
    name: official.name,
    role: official.role,
    status: official.gps_active ? 'online' : 'offline',
    latitude,
    longitude,
    lastUpdate: parseDate(official.last_gps_update),
  };
}

export function isTrackableOfficial(official: Official): boolean {
  return String(official.status).toLowerCase() === 'active';
}

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function hasValidManizalesCoordinates(latitude: number, longitude: number): boolean {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= 4.8 &&
    latitude <= 5.3 &&
    longitude >= -75.8 &&
    longitude <= -75.2
  );
}
