export interface MapCoordinates {
  latitude: number;
  longitude: number;
}

export interface MapLocation extends MapCoordinates {
  address: string;
}

export interface AddressSearchResult extends MapLocation {
  label: string;
}
