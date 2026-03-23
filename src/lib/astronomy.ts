/**
 * Astronomy calculations for StormGrid.
 * Moon phase, equinox/solstice dates, golden hour, blue hour.
 */

export interface MoonPhaseResult {
  phase: number;       // 0-1 (0/1 = new, 0.25 = first quarter, 0.5 = full, 0.75 = last quarter)
  phaseName: string;
  illumination: number; // 0-100
  nextFullMoon: string; // ISO date
  nextNewMoon: string;  // ISO date
}

// Compute moon phase for a given date
export function getMoonPhase(date: Date): MoonPhaseResult {
  // Known new moon reference: 2000-01-06 18:14 UTC
  const KNOWN_NEW_MOON = new Date('2000-01-06T18:14:00Z').getTime();
  const SYNODIC_MONTH = 29.53058867 * 24 * 3600 * 1000; // ms

  const elapsed = date.getTime() - KNOWN_NEW_MOON;
  const phase = ((elapsed % SYNODIC_MONTH) + SYNODIC_MONTH) % SYNODIC_MONTH / SYNODIC_MONTH;

  // Illumination approximation
  const illumination = Math.round((1 - Math.cos(2 * Math.PI * phase)) / 2 * 100);

  const phaseName = getPhaseName(phase);

  // Next full moon
  const fullMoonPhase = 0.5;
  let phaseToFull = fullMoonPhase - phase;
  if (phaseToFull <= 0.01) phaseToFull += 1;
  const nextFullMoon = new Date(date.getTime() + phaseToFull * SYNODIC_MONTH);

  // Next new moon
  let phaseToNew = 1 - phase;
  if (phase < 0.01) phaseToNew = 1;
  if (phaseToNew <= 0.01) phaseToNew += 1;
  const nextNewMoon = new Date(date.getTime() + phaseToNew * SYNODIC_MONTH);

  return {
    phase,
    phaseName,
    illumination,
    nextFullMoon: nextFullMoon.toISOString().split('T')[0],
    nextNewMoon: nextNewMoon.toISOString().split('T')[0],
  };
}

function getPhaseName(phase: number): string {
  if (phase < 0.02 || phase > 0.98) return 'New Moon';
  if (phase < 0.23) return 'Waxing Crescent';
  if (phase < 0.27) return 'First Quarter';
  if (phase < 0.48) return 'Waxing Gibbous';
  if (phase < 0.52) return 'Full Moon';
  if (phase < 0.73) return 'Waning Gibbous';
  if (phase < 0.77) return 'Last Quarter';
  return 'Waning Crescent';
}

// Equinox/Solstice dates for a given year (approximate)
export interface SeasonalEvent {
  date: string;    // ISO date
  type: 'spring-equinox' | 'summer-solstice' | 'autumn-equinox' | 'winter-solstice';
  label: string;
}

export function getSeasonalEvents(year: number, southernHemisphere = true): SeasonalEvent[] {
  // Approximate dates (mid-month values vary ±1-2 days)
  const y = year - 2000;

  // Jean Meeus simplified formulas (spring equinox northern = Sep equinox southern spring)
  const marchEquinox   = new Date(`${year}-03-20T00:00:00Z`);
  const juneSolstice   = new Date(`${year}-06-21T00:00:00Z`);
  const septEquinox    = new Date(`${year}-09-23T00:00:00Z`);
  const decSolstice    = new Date(`${year}-12-21T00:00:00Z`);

  // Fine-tune with a simple correction (days from J2000.0)
  marchEquinox.setDate(marchEquinox.getDate() + Math.round(y * 0.0001));
  juneSolstice.setDate(juneSolstice.getDate() + Math.round(y * 0.0001));
  septEquinox.setDate(septEquinox.getDate() + Math.round(y * 0.0001));
  decSolstice.setDate(decSolstice.getDate() + Math.round(y * 0.0001));

  if (southernHemisphere) {
    return [
      { date: marchEquinox.toISOString().split('T')[0], type: 'autumn-equinox', label: 'Autumn Equinox' },
      { date: juneSolstice.toISOString().split('T')[0], type: 'winter-solstice', label: 'Winter Solstice' },
      { date: septEquinox.toISOString().split('T')[0], type: 'spring-equinox', label: 'Spring Equinox' },
      { date: decSolstice.toISOString().split('T')[0], type: 'summer-solstice', label: 'Summer Solstice' },
    ];
  }

  return [
    { date: marchEquinox.toISOString().split('T')[0], type: 'spring-equinox', label: 'Spring Equinox' },
    { date: juneSolstice.toISOString().split('T')[0], type: 'summer-solstice', label: 'Summer Solstice' },
    { date: septEquinox.toISOString().split('T')[0], type: 'autumn-equinox', label: 'Autumn Equinox' },
    { date: decSolstice.toISOString().split('T')[0], type: 'winter-solstice', label: 'Winter Solstice' },
  ];
}

export function getCurrentSeason(date: Date, southernHemisphere = true): {
  season: 'Spring' | 'Summer' | 'Autumn' | 'Winter';
  daysRemaining: number;
} {
  const year = date.getFullYear();
  const events = getSeasonalEvents(year, southernHemisphere);
  const nextYearEvents = getSeasonalEvents(year + 1, southernHemisphere);
  const allEvents = [...events, ...nextYearEvents].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Find current season based on which event we're after
  let currentSeason: 'Spring' | 'Summer' | 'Autumn' | 'Winter' = 'Spring';
  let nextEventDate = new Date();

  for (let i = 0; i < allEvents.length - 1; i++) {
    const eventDate = new Date(allEvents[i].date);
    const nextDate = new Date(allEvents[i + 1].date);
    if (date >= eventDate && date < nextDate) {
      nextEventDate = nextDate;
      // Season is defined by what started at this event
      const type = allEvents[i].type;
      if (type === 'spring-equinox') currentSeason = 'Spring';
      else if (type === 'summer-solstice') currentSeason = 'Summer';
      else if (type === 'autumn-equinox') currentSeason = 'Autumn';
      else if (type === 'winter-solstice') currentSeason = 'Winter';
      break;
    }
  }

  const daysRemaining = Math.ceil(
    (nextEventDate.getTime() - date.getTime()) / 86400000
  );

  return { season: currentSeason, daysRemaining };
}

export function getNextSeasonalEvent(date: Date, southernHemisphere = true): {
  next: SeasonalEvent;
  daysUntil: number;
  afterNext: SeasonalEvent;
} {
  const year = date.getFullYear();
  const events = [
    ...getSeasonalEvents(year, southernHemisphere),
    ...getSeasonalEvents(year + 1, southernHemisphere),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const futureEvents = events.filter(e => new Date(e.date) > date);
  const next = futureEvents[0];
  const afterNext = futureEvents[1];
  const daysUntil = Math.ceil((new Date(next.date).getTime() - date.getTime()) / 86400000);

  return { next, daysUntil, afterNext };
}

// Golden hour / Blue hour from sunrise/sunset
export interface SolarTimes {
  goldenHourMorningEnd: string;   // ~1h after sunrise
  blueHourMorningStart: string;   // ~30min before sunrise
  goldenHourEveningStart: string; // ~1h before sunset
  blueHourEveningEnd: string;     // ~30min after sunset
  solarNoon: string;
}

export function getSolarTimes(sunriseISO: string, sunsetISO: string): SolarTimes {
  const sunrise = new Date(sunriseISO);
  const sunset = new Date(sunsetISO);

  const goldenHourMorningEnd = new Date(sunrise.getTime() + 60 * 60 * 1000);
  const blueHourMorningStart = new Date(sunrise.getTime() - 30 * 60 * 1000);
  const goldenHourEveningStart = new Date(sunset.getTime() - 60 * 60 * 1000);
  const blueHourEveningEnd = new Date(sunset.getTime() + 30 * 60 * 1000);
  const solarNoon = new Date((sunrise.getTime() + sunset.getTime()) / 2);

  return {
    goldenHourMorningEnd: goldenHourMorningEnd.toISOString(),
    blueHourMorningStart: blueHourMorningStart.toISOString(),
    goldenHourEveningStart: goldenHourEveningStart.toISOString(),
    blueHourEveningEnd: blueHourEveningEnd.toISOString(),
    solarNoon: solarNoon.toISOString(),
  };
}

// Sun position in arc (0 = sunrise, 0.5 = solar noon, 1 = sunset)
export function getSunArcPosition(sunriseISO: string, sunsetISO: string, now = new Date()): number {
  const sunrise = new Date(sunriseISO).getTime();
  const sunset = new Date(sunsetISO).getTime();
  const current = now.getTime();

  if (current <= sunrise) return 0;
  if (current >= sunset) return 1;

  return (current - sunrise) / (sunset - sunrise);
}
