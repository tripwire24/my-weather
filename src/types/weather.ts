export interface Location {
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  region?: string;
  timezone?: string;
}

export interface CurrentWeather {
  temperature: number;
  feelsLike: number;
  humidity: number;
  dewPoint: number;
  windSpeed: number;
  windGusts: number;
  windDirection: number;
  pressure: number;
  visibility: number;
  uvIndex: number;
  weatherCode: number;
  isDay: boolean;
  precipitation: number;
  precipitationType: 'none' | 'rain' | 'snow' | 'sleet' | 'hail';
  cloudCover: number;
}

export interface HourlyForecast {
  time: string; // ISO string
  temperature: number;
  feelsLike: number;
  humidity: number;
  precipitationProbability: number;
  precipitation: number;
  weatherCode: number;
  windSpeed: number;
  windDirection: number;
  windGusts: number;
  uvIndex: number;
  isDay: boolean;
  visibility: number;
  pressure: number;
  dewPoint: number;
}

export interface DailyForecast {
  date: string; // ISO date string
  tempMax: number;
  tempMin: number;
  weatherCode: number;
  precipitationProbability: number;
  precipitation: number;
  windSpeedMax: number;
  windGustsMax: number;
  windDirectionDominant: number;
  uvIndexMax: number;
  sunrise: string;
  sunset: string;
  precipitationHours: number;
  shortwaveRadiation: number;
  hourly?: HourlyForecast[]; // expanded day view
}

export interface AirQuality {
  aqi: number;
  pm25: number;
  pm10: number;
  no2: number;
  o3: number;
  so2: number;
  dominantPollutant: string;
  category: 'Good' | 'Fair' | 'Moderate' | 'Poor' | 'Very Poor';
}

export interface MoonPhaseInfo {
  phase: number; // 0-1, where 0/1 = new moon, 0.5 = full moon
  phaseName: string;
  illumination: number; // 0-100 percent
  moonrise: string | null;
  moonset: string | null;
  nextFullMoon: string;
  nextNewMoon: string;
}

export interface SunInfo {
  sunrise: string;
  sunset: string;
  solarNoon: string;
  dayLength: number; // minutes
  goldenHourMorningEnd: string;
  goldenHourEveningStart: string;
  blueHourMorningStart: string;
  blueHourEveningEnd: string;
  currentPosition: number; // 0-1 through the day arc
}

export interface AstronomyInfo {
  nextSolstice: { date: string; type: 'summer' | 'winter' };
  nextEquinox: { date: string; type: 'spring' | 'autumn' };
  currentSeason: 'Spring' | 'Summer' | 'Autumn' | 'Winter';
  daysRemainingInSeason: number;
  dayLengthTrend: 'increasing' | 'decreasing';
  dayLengthChangeTodayMinutes: number;
}

export interface WeatherData {
  location: Location;
  current: CurrentWeather;
  hourly: HourlyForecast[];
  daily: DailyForecast[];
  airQuality?: AirQuality;
  sun: SunInfo;
  moon: MoonPhaseInfo;
  astronomy: AstronomyInfo;
  fetchedAt: string; // ISO timestamp
}

export interface WeatherState {
  data: WeatherData | null;
  loading: boolean;
  error: string | null;
  isStale: boolean;
  lastUpdated: string | null;
}
