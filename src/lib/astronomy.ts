/**
 * Astronomy calculations for moon phases, solstices, equinoxes.
 * Algorithms are approximations suitable for a weather dashboard.
 */

/** Moon phase calculation using Conway's method */
export function getMoonPhase(date: Date): {
  phase: number; // 0-1 where 0 = new moon, 0.5 = full moon
  name: string;
  illumination: number;
} {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  // Simplified lunar phase calculation
  let c = 0;
  let e = 0;
  let jd = 0;
  let b = 0;

  if (month < 3) {
    c = year - 1;
    e = month + 12;
  } else {
    c = year;
    e = month;
  }

  jd =
    Math.floor(365.25 * (c + 4716)) +
    Math.floor(30.6001 * (e + 1)) +
    day -
    1524.5;

  // Days since known new moon (Jan 6, 2000 18:14 UTC)
  const daysSinceNew = jd - 2451550.1;
  const synodicMonth = 29.53058868;
  const newMoons = daysSinceNew / synodicMonth;
  const phase = newMoons - Math.floor(newMoons);

  // Moon phase illumination (approximate)
  const illumination = Math.round((1 - Math.cos(phase * 2 * Math.PI)) * 50);

  // Phase name
  let name: string;
  if (phase < 0.0625) name = "New Moon";
  else if (phase < 0.1875) name = "Waxing Crescent";
  else if (phase < 0.3125) name = "First Quarter";
  else if (phase < 0.4375) name = "Waxing Gibbous";
  else if (phase < 0.5625) name = "Full Moon";
  else if (phase < 0.6875) name = "Waning Gibbous";
  else if (phase < 0.8125) name = "Last Quarter";
  else if (phase < 0.9375) name = "Waning Crescent";
  else name = "New Moon";

  return { phase, name, illumination };
}

/** Find next occurrence of a specific moon phase */
export function getNextMoonPhaseDate(
  targetPhase: "new" | "full",
  after: Date
): Date {
  const target = targetPhase === "new" ? 0 : 0.5;
  const synodicMonth = 29.53058868;
  const date = new Date(after);

  // Search day by day for up to 30 days
  for (let i = 1; i <= 31; i++) {
    date.setDate(date.getDate() + 1);
    const { phase } = getMoonPhase(date);
    const dist = Math.abs(phase - target);
    if (dist < 0.02 || (target === 0 && (phase > 0.98 || phase < 0.02))) {
      return date;
    }
  }

  // Fallback: approximate
  const current = getMoonPhase(after);
  let daysToTarget: number;
  if (targetPhase === "new") {
    daysToTarget =
      current.phase < 0.02
        ? synodicMonth
        : (1 - current.phase) * synodicMonth;
  } else {
    daysToTarget =
      current.phase < 0.5
        ? (0.5 - current.phase) * synodicMonth
        : (1.5 - current.phase) * synodicMonth;
  }

  const result = new Date(after);
  result.setDate(result.getDate() + Math.round(daysToTarget));
  return result;
}

/** Approximate moonrise/moonset times (very rough estimation) */
export function getMoonTimes(
  date: Date,
  latitude: number
): { moonrise: string; moonset: string } {
  const { phase } = getMoonPhase(date);
  // Moon rises ~50 min later each day, new moon rises with sun
  const sunriseHour = 6; // approximate
  const riseHour = (sunriseHour + phase * 24) % 24;
  const setHour = (riseHour + 12) % 24;

  const rise = new Date(date);
  rise.setHours(Math.floor(riseHour), Math.round((riseHour % 1) * 60), 0, 0);

  const set = new Date(date);
  set.setHours(Math.floor(setHour), Math.round((setHour % 1) * 60), 0, 0);

  return {
    moonrise: rise.toISOString(),
    moonset: set.toISOString(),
  };
}

/** Calculate golden hour and blue hour from sunrise/sunset */
export function getGoldenBlueHours(
  sunrise: string,
  sunset: string
): {
  goldenHourMorning: { start: string; end: string };
  goldenHourEvening: { start: string; end: string };
  blueHourMorning: { start: string; end: string };
  blueHourEvening: { start: string; end: string };
} {
  const rise = new Date(sunrise);
  const set = new Date(sunset);

  // Golden hour: first/last hour of sunlight
  const goldenMorningEnd = new Date(rise.getTime() + 60 * 60 * 1000);
  const goldenEveningStart = new Date(set.getTime() - 60 * 60 * 1000);

  // Blue hour: ~20-30 min before sunrise / after sunset
  const blueMorningStart = new Date(rise.getTime() - 30 * 60 * 1000);
  const blueMorningEnd = new Date(rise.getTime());
  const blueEveningStart = new Date(set.getTime());
  const blueEveningEnd = new Date(set.getTime() + 30 * 60 * 1000);

  return {
    goldenHourMorning: {
      start: rise.toISOString(),
      end: goldenMorningEnd.toISOString(),
    },
    goldenHourEvening: {
      start: goldenEveningStart.toISOString(),
      end: set.toISOString(),
    },
    blueHourMorning: {
      start: blueMorningStart.toISOString(),
      end: blueMorningEnd.toISOString(),
    },
    blueHourEvening: {
      start: blueEveningStart.toISOString(),
      end: blueEveningEnd.toISOString(),
    },
  };
}

/** Get equinox and solstice dates for the current year (Southern Hemisphere aware) */
export function getSeasonalDates(year: number) {
  // Approximate dates (these shift by ~6 hours each year)
  // These are UTC dates — good enough for a dashboard
  return {
    marchEquinox: new Date(year, 2, 20, 12), // ~Mar 20
    juneSolstice: new Date(year, 5, 21, 12), // ~Jun 21
    septemberEquinox: new Date(year, 8, 23, 12), // ~Sep 23
    decemberSolstice: new Date(year, 11, 21, 12), // ~Dec 21
  };
}

/** Get current season for Southern Hemisphere (New Zealand) */
export function getCurrentSeason(date: Date): {
  name: string;
  daysRemaining: number;
  nextSeason: string;
  nextSeasonDate: Date;
} {
  const year = date.getFullYear();
  const dates = getSeasonalDates(year);
  const nextYearDates = getSeasonalDates(year + 1);

  // Southern Hemisphere seasons
  const seasons = [
    { name: "Summer", start: getSeasonalDates(year - 1).decemberSolstice, end: dates.marchEquinox, next: "Autumn", nextDate: dates.marchEquinox },
    { name: "Autumn", start: dates.marchEquinox, end: dates.juneSolstice, next: "Winter", nextDate: dates.juneSolstice },
    { name: "Winter", start: dates.juneSolstice, end: dates.septemberEquinox, next: "Spring", nextDate: dates.septemberEquinox },
    { name: "Spring", start: dates.septemberEquinox, end: dates.decemberSolstice, next: "Summer", nextDate: dates.decemberSolstice },
    { name: "Summer", start: dates.decemberSolstice, end: nextYearDates.marchEquinox, next: "Autumn", nextDate: nextYearDates.marchEquinox },
  ];

  for (const s of seasons) {
    if (date >= s.start && date < s.end) {
      const daysRemaining = Math.ceil(
        (s.end.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
      );
      return {
        name: s.name,
        daysRemaining,
        nextSeason: s.next,
        nextSeasonDate: s.nextDate,
      };
    }
  }

  // Fallback
  return {
    name: "Summer",
    daysRemaining: 0,
    nextSeason: "Autumn",
    nextSeasonDate: dates.marchEquinox,
  };
}

/** Calculate day length in minutes from sunrise/sunset ISO strings */
export function getDayLength(sunrise: string, sunset: string): number {
  const rise = new Date(sunrise);
  const set = new Date(sunset);
  return Math.round((set.getTime() - rise.getTime()) / 60000);
}

/** Format day length as "Xh Ym" */
export function formatDayLength(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

/** Get solar noon (midpoint between sunrise and sunset) */
export function getSolarNoon(sunrise: string, sunset: string): string {
  const rise = new Date(sunrise);
  const set = new Date(sunset);
  const noon = new Date((rise.getTime() + set.getTime()) / 2);
  return noon.toISOString();
}
