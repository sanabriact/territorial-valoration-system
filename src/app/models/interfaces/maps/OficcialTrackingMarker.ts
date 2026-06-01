export type OfficialConnectionStatus = 'online' | 'offline';

export interface OfficialTrackingMarker {
  id: number;
  entityId: number;
  entityName: string;
  name: string;
  role: string;
  status: OfficialConnectionStatus;
  latitude: number;
  longitude: number;
  lastUpdate: Date | null;
}
