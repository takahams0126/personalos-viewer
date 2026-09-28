// Shared weather semantic-code -> Meteocons mapping.
// weather_code stays upstream; Presentation only resolves the visual asset.

const WEATHER_ICON_BASE = 'https://cdn.meteocons.com/3.0.0-next.10/svg/fill';

const WEATHER_ICON_BY_CODE = Object.freeze({
  CLEAR: 'clear-day',
  MOSTLY_CLEAR: 'mostly-clear-day',
  PARTLY_CLOUDY: 'partly-cloudy-day',
  CLOUDY: 'cloudy',
  LIGHT_RAIN: 'drizzle',
  RAIN: 'rain',
  HEAVY_RAIN: 'extreme-rain',
  SHOWER: 'rain',
  THUNDERSTORM: 'thunderstorms-day-rain',
  LIGHT_SNOW: 'snow',
  SNOW: 'snow',
  HEAVY_SNOW: 'snow',
  SLEET: 'sleet',
  FOG: 'fog-day',
  UNKNOWN: 'not-available'
});

export function resolveWeatherIconSrc(weatherCode) {
  const code = String(weatherCode || 'UNKNOWN').toUpperCase();
  const slug = WEATHER_ICON_BY_CODE[code] || WEATHER_ICON_BY_CODE.UNKNOWN;
  return `${WEATHER_ICON_BASE}/${slug}.svg`;
}
