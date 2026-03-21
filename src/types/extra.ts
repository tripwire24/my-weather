export interface MarineData {
  waveHeight: number | null;      // metres
  waveDirection: number | null;   // degrees
  wavePeriod: number | null;      // seconds
  swellHeight: number | null;     // metres
  swellDirection: number | null;  // degrees
  swellPeriod: number | null;     // seconds
  available: boolean;             // false for inland locations
}

export interface EarthquakeEvent {
  id: string;
  magnitude: number;
  place: string;
  time: number;       // unix ms
  depth: number;      // km
  lat: number;
  lon: number;
  distanceKm: number; // from user location
}

export interface SpaceWeatherData {
  kpIndex: number;   // 0–9
  kpLabel: string;
  auroraChance: 'none' | 'low' | 'possible' | 'likely' | 'high';
  history: { time: string; kp: number }[]; // sampled ~30min readings
}

export interface FlightInfo {
  callsign: string;
  originCountry: string;
  altitude: number;  // metres
  velocity: number;  // km/h (converted from m/s)
  heading: number;   // degrees
}

export interface FlightsData {
  count: number;
  flights: FlightInfo[];
}

export interface ExtraData {
  marine: MarineData | null;
  earthquakes: EarthquakeEvent[];
  spaceWeather: SpaceWeatherData | null;
  flights: FlightsData | null;
  fetchedAt: string;
}

export interface ExtraState {
  data: ExtraData | null;
  loading: boolean;
  errors: Partial<Record<'marine' | 'earthquakes' | 'spaceWeather' | 'flights', string>>;
}
