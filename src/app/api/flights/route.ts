import type { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get('lat') ?? '0');
  const lon = parseFloat(searchParams.get('lon') ?? '0');

  if (!lat || !lon) {
    return Response.json({ count: 0, flights: [] });
  }

  const delta = 1.5;
  const url = `https://opensky-network.org/api/states/all?lamin=${(lat - delta).toFixed(4)}&lomin=${(lon - delta).toFixed(4)}&lamax=${(lat + delta).toFixed(4)}&lomax=${(lon + delta).toFixed(4)}`;

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'StormGrid/1.0 (weather PWA)' },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      return Response.json({ count: 0, flights: [] });
    }

    const data = await res.json() as { states?: unknown[][] };
    const states = data.states ?? [];

    // Filter airborne only, map to our schema
    const airborne = (states as unknown[][]).filter(s => s[8] === false);
    const flights = airborne
      .map(s => ({
        callsign:      ((s[1] as string) ?? '').trim() || 'UNKNWN',
        originCountry: (s[2] as string) ?? '',
        altitude:      Math.round((s[7] as number) ?? 0),
        velocity:      Math.round(((s[9] as number) ?? 0) * 3.6), // m/s → km/h
        heading:       Math.round((s[10] as number) ?? 0),
      }))
      .sort((a, b) => b.altitude - a.altitude)
      .slice(0, 20);

    return Response.json({ count: airborne.length, flights });
  } catch {
    return Response.json({ count: 0, flights: [] });
  }
}
