'use client';

import { useState, useEffect, useCallback } from 'react';

export type ThemeMode = 'dark' | 'light' | 'adaptive';

interface AdaptiveVars {
  '--sg-bg': string;
  '--sg-bg-secondary': string;
  '--sg-bg-card': string;
  '--sg-glass-bg': string;
  '--sg-text-primary': string;
  '--sg-text-secondary': string;
  '--sg-text-muted': string;
  '--sg-cyan': string;
  '--sg-cyan-dim': string;
  '--sg-cyan-glow': string;
  '--sg-magenta': string;
  '--sg-amber': string;
  '--sg-amber-glow': string;
  '--sg-blue': string;
  '--sg-green': string;
  '--sg-red': string;
  '--sg-border': string;
  '--sg-border-bright': string;
  '--sg-grid-color': string;
  '--sg-glow-cyan': string;
  '--sg-glow-amber': string;
  '--sg-scanline-alpha': string;
  '--sg-flare-color': string;
  '--sg-sheen-color': string;
}

type AdaptivePalette = {
  name: string;
  vars: AdaptiveVars;
};

// Determine which adaptive palette to use based on hour and weather code
function getAdaptivePalette(hour: number, weatherCode: number): AdaptivePalette {
  const isStormy = weatherCode >= 95;
  const isRainy = (weatherCode >= 51 && weatherCode <= 67) || (weatherCode >= 80 && weatherCode <= 82);
  const isSnowy = (weatherCode >= 71 && weatherCode <= 77) || weatherCode === 85 || weatherCode === 86;
  const isFoggy = weatherCode >= 45 && weatherCode <= 48;
  const isClear = weatherCode <= 1;
  const isPartlyCloudy = weatherCode >= 2 && weatherCode <= 3;

  // Night: 10pm–5am
  if (hour >= 22 || hour < 5) {
    if (isStormy) return PALETTES.stormyNight;
    return PALETTES.night;
  }
  // Dawn: 5am–7am
  if (hour >= 5 && hour < 7) {
    if (isRainy) return PALETTES.rainyMorning;
    return PALETTES.dawn;
  }
  // Morning: 7am–10am
  if (hour >= 7 && hour < 10) {
    if (isStormy) return PALETTES.stormyDay;
    if (isRainy) return PALETTES.rainyMorning;
    if (isSnowy) return PALETTES.snowy;
    return PALETTES.morning;
  }
  // Midday: 10am–4pm
  if (hour >= 10 && hour < 16) {
    if (isStormy) return PALETTES.stormyDay;
    if (isRainy) return PALETTES.rainyDay;
    if (isSnowy) return PALETTES.snowy;
    if (isFoggy) return PALETTES.foggy;
    if (isClear) return PALETTES.clearDay;
    return PALETTES.cloudyDay;
  }
  // Evening: 4pm–7pm
  if (hour >= 16 && hour < 19) {
    if (isRainy) return PALETTES.rainyDay;
    if (isStormy) return PALETTES.stormyNight;
    return PALETTES.dusk;
  }
  // Late evening: 7pm–10pm
  if (isRainy) return PALETTES.rainyMorning;
  if (isStormy) return PALETTES.stormyNight;
  return PALETTES.evening;
}

const PALETTES: Record<string, AdaptivePalette> = {
  // Deep dark — default night
  night: {
    name: 'Night',
    vars: {
      '--sg-bg': '#060810',
      '--sg-bg-secondary': '#0a0c1a',
      '--sg-bg-card': 'rgba(8,10,28,0.7)',
      '--sg-glass-bg': 'rgba(6,8,24,0.8)',
      '--sg-text-primary': '#d0e8ff',
      '--sg-text-secondary': '#6080a0',
      '--sg-text-muted': '#304060',
      '--sg-cyan': '#00e8e0',
      '--sg-cyan-dim': 'rgba(0,232,224,0.55)',
      '--sg-cyan-glow': 'rgba(0,232,224,0.12)',
      '--sg-magenta': '#e800e8',
      '--sg-amber': '#ffaa00',
      '--sg-amber-glow': 'rgba(255,170,0,0.12)',
      '--sg-blue': '#4466ff',
      '--sg-green': '#00e87a',
      '--sg-red': '#ff2244',
      '--sg-border': 'rgba(0,232,224,0.18)',
      '--sg-border-bright': 'rgba(0,232,224,0.45)',
      '--sg-grid-color': 'rgba(0,232,224,0.03)',
      '--sg-glow-cyan': '0 0 10px rgba(0,232,224,0.35), 0 0 22px rgba(0,232,224,0.15)',
      '--sg-glow-amber': '0 0 10px rgba(255,170,0,0.35), 0 0 22px rgba(255,170,0,0.15)',
      '--sg-scanline-alpha': '0.07',
      '--sg-flare-color': 'rgba(255,255,255,0.07)',
      '--sg-sheen-color': 'rgba(255,255,255,0.1)',
    },
  },
  // Amber-rose dawn
  dawn: {
    name: 'Dawn',
    vars: {
      '--sg-bg': '#150a08',
      '--sg-bg-secondary': '#200d0a',
      '--sg-bg-card': 'rgba(30,12,8,0.72)',
      '--sg-glass-bg': 'rgba(25,10,6,0.8)',
      '--sg-text-primary': '#ffd8b0',
      '--sg-text-secondary': '#cc8855',
      '--sg-text-muted': '#704030',
      '--sg-cyan': '#ff9944',
      '--sg-cyan-dim': 'rgba(255,153,68,0.6)',
      '--sg-cyan-glow': 'rgba(255,153,68,0.15)',
      '--sg-magenta': '#ff4488',
      '--sg-amber': '#ffcc44',
      '--sg-amber-glow': 'rgba(255,204,68,0.15)',
      '--sg-blue': '#cc6688',
      '--sg-green': '#ffaa55',
      '--sg-red': '#ff3344',
      '--sg-border': 'rgba(255,120,60,0.25)',
      '--sg-border-bright': 'rgba(255,120,60,0.55)',
      '--sg-grid-color': 'rgba(255,120,60,0.04)',
      '--sg-glow-cyan': '0 0 10px rgba(255,120,60,0.4), 0 0 22px rgba(255,120,60,0.18)',
      '--sg-glow-amber': '0 0 10px rgba(255,200,50,0.4), 0 0 22px rgba(255,200,50,0.18)',
      '--sg-scanline-alpha': '0.05',
      '--sg-flare-color': 'rgba(255,180,80,0.12)',
      '--sg-sheen-color': 'rgba(255,200,120,0.18)',
    },
  },
  // Bright sky morning
  morning: {
    name: 'Morning',
    vars: {
      '--sg-bg': '#e8f4ff',
      '--sg-bg-secondary': '#d8ecff',
      '--sg-bg-card': 'rgba(255,255,255,0.78)',
      '--sg-glass-bg': 'rgba(230,244,255,0.85)',
      '--sg-text-primary': '#0a1830',
      '--sg-text-secondary': '#305580',
      '--sg-text-muted': '#7090b0',
      '--sg-cyan': '#0077bb',
      '--sg-cyan-dim': 'rgba(0,119,187,0.6)',
      '--sg-cyan-glow': 'rgba(0,119,187,0.12)',
      '--sg-magenta': '#8800aa',
      '--sg-amber': '#bb7700',
      '--sg-amber-glow': 'rgba(187,119,0,0.12)',
      '--sg-blue': '#2255cc',
      '--sg-green': '#007744',
      '--sg-red': '#cc2244',
      '--sg-border': 'rgba(0,100,180,0.18)',
      '--sg-border-bright': 'rgba(0,100,180,0.45)',
      '--sg-grid-color': 'rgba(0,100,180,0.04)',
      '--sg-glow-cyan': '0 0 8px rgba(0,119,187,0.3), 0 0 16px rgba(0,119,187,0.12)',
      '--sg-glow-amber': '0 0 8px rgba(187,119,0,0.3), 0 0 16px rgba(187,119,0,0.12)',
      '--sg-scanline-alpha': '0.01',
      '--sg-flare-color': 'rgba(255,255,255,0.55)',
      '--sg-sheen-color': 'rgba(255,255,255,0.75)',
    },
  },
  // Crisp clear day
  clearDay: {
    name: 'Clear Day',
    vars: {
      '--sg-bg': '#eaf2ff',
      '--sg-bg-secondary': '#dce9ff',
      '--sg-bg-card': 'rgba(255,255,255,0.82)',
      '--sg-glass-bg': 'rgba(235,246,255,0.88)',
      '--sg-text-primary': '#0a1830',
      '--sg-text-secondary': '#2d4f7a',
      '--sg-text-muted': '#6888aa',
      '--sg-cyan': '#0066bb',
      '--sg-cyan-dim': 'rgba(0,102,187,0.6)',
      '--sg-cyan-glow': 'rgba(0,102,187,0.12)',
      '--sg-magenta': '#7700aa',
      '--sg-amber': '#cc7700',
      '--sg-amber-glow': 'rgba(204,119,0,0.12)',
      '--sg-blue': '#1144cc',
      '--sg-green': '#006633',
      '--sg-red': '#cc1133',
      '--sg-border': 'rgba(0,90,170,0.2)',
      '--sg-border-bright': 'rgba(0,90,170,0.5)',
      '--sg-grid-color': 'rgba(0,90,170,0.04)',
      '--sg-glow-cyan': '0 0 8px rgba(0,102,187,0.3), 0 0 16px rgba(0,102,187,0.1)',
      '--sg-glow-amber': '0 0 8px rgba(204,119,0,0.3), 0 0 16px rgba(204,119,0,0.1)',
      '--sg-scanline-alpha': '0.01',
      '--sg-flare-color': 'rgba(255,255,255,0.6)',
      '--sg-sheen-color': 'rgba(255,255,255,0.8)',
    },
  },
  // Overcast cloudy day
  cloudyDay: {
    name: 'Cloudy',
    vars: {
      '--sg-bg': '#d8dce8',
      '--sg-bg-secondary': '#ccd0de',
      '--sg-bg-card': 'rgba(240,242,250,0.8)',
      '--sg-glass-bg': 'rgba(220,224,238,0.85)',
      '--sg-text-primary': '#1a2040',
      '--sg-text-secondary': '#404870',
      '--sg-text-muted': '#7880a0',
      '--sg-cyan': '#3355aa',
      '--sg-cyan-dim': 'rgba(51,85,170,0.6)',
      '--sg-cyan-glow': 'rgba(51,85,170,0.12)',
      '--sg-magenta': '#663388',
      '--sg-amber': '#886633',
      '--sg-amber-glow': 'rgba(136,102,51,0.12)',
      '--sg-blue': '#2244aa',
      '--sg-green': '#336655',
      '--sg-red': '#aa2244',
      '--sg-border': 'rgba(51,85,170,0.2)',
      '--sg-border-bright': 'rgba(51,85,170,0.45)',
      '--sg-grid-color': 'rgba(51,85,170,0.04)',
      '--sg-glow-cyan': '0 0 8px rgba(51,85,170,0.25), 0 0 14px rgba(51,85,170,0.1)',
      '--sg-glow-amber': '0 0 8px rgba(136,102,51,0.25), 0 0 14px rgba(136,102,51,0.1)',
      '--sg-scanline-alpha': '0.015',
      '--sg-flare-color': 'rgba(255,255,255,0.35)',
      '--sg-sheen-color': 'rgba(255,255,255,0.5)',
    },
  },
  // Rainy morning
  rainyMorning: {
    name: 'Rain',
    vars: {
      '--sg-bg': '#0e1220',
      '--sg-bg-secondary': '#121828',
      '--sg-bg-card': 'rgba(14,18,36,0.72)',
      '--sg-glass-bg': 'rgba(12,16,32,0.82)',
      '--sg-text-primary': '#b0c8e8',
      '--sg-text-secondary': '#5577aa',
      '--sg-text-muted': '#2a4060',
      '--sg-cyan': '#4499cc',
      '--sg-cyan-dim': 'rgba(68,153,204,0.6)',
      '--sg-cyan-glow': 'rgba(68,153,204,0.14)',
      '--sg-magenta': '#4466cc',
      '--sg-amber': '#8899cc',
      '--sg-amber-glow': 'rgba(136,153,204,0.12)',
      '--sg-blue': '#3366dd',
      '--sg-green': '#336688',
      '--sg-red': '#884466',
      '--sg-border': 'rgba(68,153,204,0.2)',
      '--sg-border-bright': 'rgba(68,153,204,0.45)',
      '--sg-grid-color': 'rgba(68,153,204,0.04)',
      '--sg-glow-cyan': '0 0 10px rgba(68,153,204,0.35), 0 0 22px rgba(68,153,204,0.15)',
      '--sg-glow-amber': '0 0 10px rgba(136,153,204,0.3), 0 0 18px rgba(136,153,204,0.12)',
      '--sg-scanline-alpha': '0.06',
      '--sg-flare-color': 'rgba(100,160,220,0.1)',
      '--sg-sheen-color': 'rgba(140,190,240,0.14)',
    },
  },
  // Rainy day (lighter)
  rainyDay: {
    name: 'Rainy Day',
    vars: {
      '--sg-bg': '#c8d0e0',
      '--sg-bg-secondary': '#bcc4d8',
      '--sg-bg-card': 'rgba(200,210,230,0.8)',
      '--sg-glass-bg': 'rgba(190,200,222,0.85)',
      '--sg-text-primary': '#1a2840',
      '--sg-text-secondary': '#3a5070',
      '--sg-text-muted': '#6878a0',
      '--sg-cyan': '#2255aa',
      '--sg-cyan-dim': 'rgba(34,85,170,0.6)',
      '--sg-cyan-glow': 'rgba(34,85,170,0.12)',
      '--sg-magenta': '#4455aa',
      '--sg-amber': '#556688',
      '--sg-amber-glow': 'rgba(85,102,136,0.12)',
      '--sg-blue': '#1144aa',
      '--sg-green': '#225566',
      '--sg-red': '#884455',
      '--sg-border': 'rgba(34,85,170,0.22)',
      '--sg-border-bright': 'rgba(34,85,170,0.5)',
      '--sg-grid-color': 'rgba(34,85,170,0.04)',
      '--sg-glow-cyan': '0 0 8px rgba(34,85,170,0.25), 0 0 14px rgba(34,85,170,0.1)',
      '--sg-glow-amber': '0 0 8px rgba(85,102,136,0.22), 0 0 12px rgba(85,102,136,0.08)',
      '--sg-scanline-alpha': '0.015',
      '--sg-flare-color': 'rgba(160,190,230,0.3)',
      '--sg-sheen-color': 'rgba(180,210,240,0.45)',
    },
  },
  // Stormy dark
  stormyNight: {
    name: 'Storm',
    vars: {
      '--sg-bg': '#08060e',
      '--sg-bg-secondary': '#0e0a18',
      '--sg-bg-card': 'rgba(12,8,24,0.78)',
      '--sg-glass-bg': 'rgba(8,6,18,0.85)',
      '--sg-text-primary': '#c0a8e8',
      '--sg-text-secondary': '#6844aa',
      '--sg-text-muted': '#382060',
      '--sg-cyan': '#9955ff',
      '--sg-cyan-dim': 'rgba(153,85,255,0.55)',
      '--sg-cyan-glow': 'rgba(153,85,255,0.14)',
      '--sg-magenta': '#ff44aa',
      '--sg-amber': '#ddaa00',
      '--sg-amber-glow': 'rgba(221,170,0,0.14)',
      '--sg-blue': '#5533cc',
      '--sg-green': '#6633aa',
      '--sg-red': '#ff2255',
      '--sg-border': 'rgba(120,60,220,0.22)',
      '--sg-border-bright': 'rgba(120,60,220,0.5)',
      '--sg-grid-color': 'rgba(100,50,200,0.04)',
      '--sg-glow-cyan': '0 0 12px rgba(153,85,255,0.4), 0 0 25px rgba(153,85,255,0.18)',
      '--sg-glow-amber': '0 0 12px rgba(221,170,0,0.4), 0 0 25px rgba(221,170,0,0.18)',
      '--sg-scanline-alpha': '0.08',
      '--sg-flare-color': 'rgba(180,120,255,0.1)',
      '--sg-sheen-color': 'rgba(200,150,255,0.14)',
    },
  },
  // Stormy day
  stormyDay: {
    name: 'Storm',
    vars: {
      '--sg-bg': '#1a1420',
      '--sg-bg-secondary': '#201828',
      '--sg-bg-card': 'rgba(26,18,36,0.74)',
      '--sg-glass-bg': 'rgba(20,14,30,0.82)',
      '--sg-text-primary': '#d0b8f0',
      '--sg-text-secondary': '#7055a0',
      '--sg-text-muted': '#402860',
      '--sg-cyan': '#aa66ff',
      '--sg-cyan-dim': 'rgba(170,102,255,0.55)',
      '--sg-cyan-glow': 'rgba(170,102,255,0.14)',
      '--sg-magenta': '#ff55bb',
      '--sg-amber': '#eebb00',
      '--sg-amber-glow': 'rgba(238,187,0,0.14)',
      '--sg-blue': '#6644dd',
      '--sg-green': '#7744aa',
      '--sg-red': '#e85c78',
      '--sg-border': 'rgba(140,80,240,0.22)',
      '--sg-border-bright': 'rgba(140,80,240,0.5)',
      '--sg-grid-color': 'rgba(120,70,210,0.04)',
      '--sg-glow-cyan': '0 0 10px rgba(170,102,255,0.38), 0 0 22px rgba(170,102,255,0.16)',
      '--sg-glow-amber': '0 0 10px rgba(238,187,0,0.38), 0 0 22px rgba(238,187,0,0.16)',
      '--sg-scanline-alpha': '0.07',
      '--sg-flare-color': 'rgba(200,140,255,0.1)',
      '--sg-sheen-color': 'rgba(220,170,255,0.14)',
    },
  },
  // Dusk — orange-purple sunset
  dusk: {
    name: 'Dusk',
    vars: {
      '--sg-bg': '#120a18',
      '--sg-bg-secondary': '#1c1020',
      '--sg-bg-card': 'rgba(20,10,28,0.74)',
      '--sg-glass-bg': 'rgba(16,8,24,0.82)',
      '--sg-text-primary': '#ffc8a0',
      '--sg-text-secondary': '#cc7755',
      '--sg-text-muted': '#663344',
      '--sg-cyan': '#ff7733',
      '--sg-cyan-dim': 'rgba(255,119,51,0.6)',
      '--sg-cyan-glow': 'rgba(255,119,51,0.15)',
      '--sg-magenta': '#cc44aa',
      '--sg-amber': '#ffcc44',
      '--sg-amber-glow': 'rgba(255,204,68,0.15)',
      '--sg-blue': '#8844cc',
      '--sg-green': '#cc6644',
      '--sg-red': '#ff3333',
      '--sg-border': 'rgba(240,100,60,0.25)',
      '--sg-border-bright': 'rgba(240,100,60,0.55)',
      '--sg-grid-color': 'rgba(220,80,40,0.04)',
      '--sg-glow-cyan': '0 0 10px rgba(255,100,50,0.42), 0 0 22px rgba(255,100,50,0.18)',
      '--sg-glow-amber': '0 0 10px rgba(255,200,50,0.42), 0 0 22px rgba(255,200,50,0.18)',
      '--sg-scanline-alpha': '0.06',
      '--sg-flare-color': 'rgba(255,160,80,0.14)',
      '--sg-sheen-color': 'rgba(255,190,120,0.2)',
    },
  },
  // Evening — deep purple transition
  evening: {
    name: 'Evening',
    vars: {
      '--sg-bg': '#0c0814',
      '--sg-bg-secondary': '#120e1c',
      '--sg-bg-card': 'rgba(14,10,22,0.74)',
      '--sg-glass-bg': 'rgba(10,7,18,0.82)',
      '--sg-text-primary': '#d8b8f8',
      '--sg-text-secondary': '#8855cc',
      '--sg-text-muted': '#442266',
      '--sg-cyan': '#8866ee',
      '--sg-cyan-dim': 'rgba(136,102,238,0.6)',
      '--sg-cyan-glow': 'rgba(136,102,238,0.14)',
      '--sg-magenta': '#ee44cc',
      '--sg-amber': '#ddaa44',
      '--sg-amber-glow': 'rgba(221,170,68,0.14)',
      '--sg-blue': '#5533bb',
      '--sg-green': '#44ccaa',
      '--sg-red': '#ee3366',
      '--sg-border': 'rgba(120,80,200,0.22)',
      '--sg-border-bright': 'rgba(120,80,200,0.5)',
      '--sg-grid-color': 'rgba(100,60,180,0.04)',
      '--sg-glow-cyan': '0 0 10px rgba(136,102,238,0.38), 0 0 22px rgba(136,102,238,0.16)',
      '--sg-glow-amber': '0 0 10px rgba(221,170,68,0.38), 0 0 22px rgba(221,170,68,0.16)',
      '--sg-scanline-alpha': '0.06',
      '--sg-flare-color': 'rgba(170,120,255,0.1)',
      '--sg-sheen-color': 'rgba(190,150,255,0.14)',
    },
  },
  // Snowy — ice white/blue
  snowy: {
    name: 'Snow',
    vars: {
      '--sg-bg': '#d8e8f8',
      '--sg-bg-secondary': '#cce0f4',
      '--sg-bg-card': 'rgba(245,250,255,0.82)',
      '--sg-glass-bg': 'rgba(230,242,255,0.88)',
      '--sg-text-primary': '#0a1828',
      '--sg-text-secondary': '#2a4870',
      '--sg-text-muted': '#6888aa',
      '--sg-cyan': '#0055aa',
      '--sg-cyan-dim': 'rgba(0,85,170,0.6)',
      '--sg-cyan-glow': 'rgba(0,85,170,0.12)',
      '--sg-magenta': '#5566aa',
      '--sg-amber': '#6688aa',
      '--sg-amber-glow': 'rgba(102,136,170,0.12)',
      '--sg-blue': '#0033aa',
      '--sg-green': '#226688',
      '--sg-red': '#884466',
      '--sg-border': 'rgba(0,80,160,0.2)',
      '--sg-border-bright': 'rgba(0,80,160,0.48)',
      '--sg-grid-color': 'rgba(0,80,160,0.04)',
      '--sg-glow-cyan': '0 0 8px rgba(0,85,170,0.28), 0 0 14px rgba(0,85,170,0.1)',
      '--sg-glow-amber': '0 0 8px rgba(102,136,170,0.25), 0 0 12px rgba(102,136,170,0.08)',
      '--sg-scanline-alpha': '0.01',
      '--sg-flare-color': 'rgba(200,230,255,0.55)',
      '--sg-sheen-color': 'rgba(220,240,255,0.75)',
    },
  },
  // Foggy — muted greys
  foggy: {
    name: 'Fog',
    vars: {
      '--sg-bg': '#c0c8d0',
      '--sg-bg-secondary': '#b8c0ca',
      '--sg-bg-card': 'rgba(200,208,218,0.82)',
      '--sg-glass-bg': 'rgba(188,198,210,0.88)',
      '--sg-text-primary': '#1a2030',
      '--sg-text-secondary': '#404858',
      '--sg-text-muted': '#707880',
      '--sg-cyan': '#445566',
      '--sg-cyan-dim': 'rgba(68,85,102,0.6)',
      '--sg-cyan-glow': 'rgba(68,85,102,0.1)',
      '--sg-magenta': '#556677',
      '--sg-amber': '#667788',
      '--sg-amber-glow': 'rgba(102,119,136,0.1)',
      '--sg-blue': '#334466',
      '--sg-green': '#446655',
      '--sg-red': '#775566',
      '--sg-border': 'rgba(68,85,102,0.2)',
      '--sg-border-bright': 'rgba(68,85,102,0.44)',
      '--sg-grid-color': 'rgba(68,85,102,0.04)',
      '--sg-glow-cyan': '0 0 6px rgba(68,85,102,0.2), 0 0 12px rgba(68,85,102,0.08)',
      '--sg-glow-amber': '0 0 6px rgba(102,119,136,0.18), 0 0 10px rgba(102,119,136,0.06)',
      '--sg-scanline-alpha': '0.02',
      '--sg-flare-color': 'rgba(255,255,255,0.3)',
      '--sg-sheen-color': 'rgba(255,255,255,0.45)',
    },
  },
};

export function useTheme(weatherCode?: number) {
  const [mode, setMode] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return 'dark';
    return (localStorage.getItem('sg-theme') as ThemeMode) ?? 'dark';
  });

  const applyAdaptiveVars = useCallback((vars: AdaptiveVars) => {
    const root = document.documentElement;
    Object.entries(vars).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
  }, []);

  const clearAdaptiveVars = useCallback(() => {
    const root = document.documentElement;
    const keys: (keyof AdaptiveVars)[] = [
      '--sg-bg', '--sg-bg-secondary', '--sg-bg-card', '--sg-glass-bg',
      '--sg-text-primary', '--sg-text-secondary', '--sg-text-muted',
      '--sg-cyan', '--sg-cyan-dim', '--sg-cyan-glow',
      '--sg-magenta', '--sg-amber', '--sg-amber-glow', '--sg-blue',
      '--sg-green', '--sg-red', '--sg-border', '--sg-border-bright',
      '--sg-grid-color', '--sg-glow-cyan', '--sg-glow-amber',
      '--sg-scanline-alpha', '--sg-flare-color', '--sg-sheen-color',
    ];
    keys.forEach(k => root.style.removeProperty(k));
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', mode);
    localStorage.setItem('sg-theme', mode);

    if (mode !== 'adaptive') {
      clearAdaptiveVars();
      return;
    }

    // Adaptive: compute and apply palette
    const apply = () => {
      const hour = new Date().getHours();
      const code = weatherCode ?? 0;
      const palette = getAdaptivePalette(hour, code);
      applyAdaptiveVars(palette.vars);
    };

    apply();
    // Re-evaluate every 5 minutes
    const interval = setInterval(apply, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [mode, weatherCode, applyAdaptiveVars, clearAdaptiveVars]);

  // Re-apply adaptive when weather code changes
  useEffect(() => {
    if (mode !== 'adaptive') return;
    const hour = new Date().getHours();
    const code = weatherCode ?? 0;
    const palette = getAdaptivePalette(hour, code);
    applyAdaptiveVars(palette.vars);
  }, [weatherCode, mode, applyAdaptiveVars]);

  const setTheme = useCallback((newMode: ThemeMode) => {
    setMode(newMode);
  }, []);

  // Get current adaptive palette name for display
  const adaptivePaletteName =
    mode === 'adaptive'
      ? getAdaptivePalette(new Date().getHours(), weatherCode ?? 0).name
      : null;

  return { mode, setTheme, adaptivePaletteName };
}
