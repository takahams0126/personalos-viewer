const ICON_BY_CODE = Object.freeze({
  clear: 'clear-day',
  clear_day: 'clear-day',
  sunny: 'clear-day',
  mostly_clear: 'clear-day',
  mostly_clear_day: 'clear-day',
  mainly_clear: 'clear-day',
  partly_cloudy: 'partly-cloudy-day',
  partly_cloudy_day: 'partly-cloudy-day',
  cloudy: 'cloudy',
  overcast: 'cloudy',
  fog: 'fog',
  drizzle: 'rain',
  light_rain: 'rain',
  rain: 'rain',
  rain_showers: 'rain',
  showers: 'rain',
  heavy_rain: 'rain',
  extreme_rain: 'rain',
  snow: 'snow',
  snow_showers: 'snow',
  thunderstorm: 'thunderstorms-day-rain',
  thunderstorms: 'thunderstorms-day-rain'
});

const METEOCONS_BASE = 'https://cdn.meteocons.com/3.0.0-next.10/svg/fill';

function weatherIcon(condition, className) {
  const code = condition?.code ? String(condition.code).toLowerCase() : '';
  const slug = ICON_BY_CODE[code] || 'not-available';
  const node = document.createElement('img');
  node.className = className;
  node.src = `${METEOCONS_BASE}/${slug}.svg`;
  node.alt = '';
  node.dataset.weatherCode = code || 'not-available';
  node.setAttribute('aria-hidden', 'true');
  node.loading = 'lazy';
  node.decoding = 'async';
  return node;
}

function startTime(label) {
  if (!label) return '';
  return String(label).split('〜')[0] || String(label);
}

function matrixRow(label, periods, selector, className = '') {
  const row = document.createElement('span');
  row.className = ['weather-matrix-row', className].filter(Boolean).join(' ');

  const heading = document.createElement('span');
  heading.className = 'weather-matrix-label';
  heading.textContent = label;
  row.append(heading);

  periods.forEach(period => {
    const cell = document.createElement('span');
    cell.className = 'weather-matrix-cell';
    const value = selector(period);
    if (value instanceof Node) cell.append(value);
    else cell.textContent = value || '—';
    row.append(cell);
  });

  return row;
}

function buildHourlyMatrix(weatherDay) {
  const periods = weatherDay?.periods || [];
  if (!periods.length) return null;

  const wrapper = document.createElement('section');
  wrapper.className = 'selected-day-weather hourly-weather';
  wrapper.dataset.semantic = 'hourly-weather-presentation';
  wrapper.style.setProperty('--weather-period-count', String(periods.length));

  const header = document.createElement('header');
  header.className = 'hourly-weather-header';

  const heading = document.createElement('h3');
  heading.textContent = '3時間天気';

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'hourly-weather-toggle';
  toggle.setAttribute('aria-expanded', 'false');
  toggle.textContent = '詳細表示';

  const location = document.createElement('span');
  location.className = 'hourly-weather-location';
  location.textContent = weatherDay.representative_location_label
    ? `代表: ${weatherDay.representative_location_label}`
    : '';

  header.append(heading, toggle, location);

  const viewport = document.createElement('div');
  viewport.className = 'weather-matrix-viewport';

  const matrix = document.createElement('div');
  matrix.className = 'weather-matrix';

  const detailRows = [
    matrixRow('気温', periods, period => period.temperature_label, 'weather-matrix-detail-row'),
    matrixRow('降水確率', periods, period => period.precipitation_probability_label, 'weather-matrix-detail-row'),
    matrixRow('降水量', periods, period => period.precipitation_amount_label, 'weather-matrix-detail-row'),
    matrixRow('風', periods, period => period.wind_label, 'weather-matrix-detail-row')
  ];
  detailRows.forEach(row => { row.hidden = true; });

  matrix.append(
    matrixRow('', periods, period => startTime(period.time_label), 'weather-matrix-time-row'),
    matrixRow('天気', periods, period => {
      if (!period.condition?.code) return '—';
      const icon = weatherIcon(period.condition, 'weather-icon weather-icon-hourly');
      icon.title = period.condition?.label || '';
      return icon;
    }, 'weather-matrix-icon-row'),
    ...detailRows
  );
  viewport.append(matrix);

  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', open ? 'false' : 'true');
    toggle.textContent = open ? '詳細表示' : '詳細非表示';
    detailRows.forEach(row => { row.hidden = open; });
  });

  wrapper.append(header, viewport);
  return wrapper;
}

function decorateItineraryOverview(root, dayByOrdinal) {
  root.querySelectorAll('[data-itinerary-day][data-day]').forEach(row => {
    const ordinal = Number(row.dataset.day);
    const weatherDay = dayByOrdinal.get(ordinal);
    const slot = row.querySelector('[data-weather-slot]');
    if (!weatherDay || !slot || slot.childElementCount) return;

    const label = document.createElement('span');
    label.className = 'itinerary-weather-label';

    if (weatherDay.condition) {
      const icon = weatherIcon(weatherDay.condition, 'weather-icon weather-icon-itinerary');
      icon.title = weatherDay.condition?.label || '';
      label.textContent = weatherDay.condition?.label || '—';
      slot.append(icon, label);
      return;
    }

    label.textContent = weatherDay.coverage_state?.label || '—';
    slot.append(label);
  });
}

function decorateDayWeather(root, dayByOrdinal) {
  root.querySelectorAll('[data-semantic="execution-day"][data-day]').forEach(panel => {
    if (panel.querySelector('[data-semantic="hourly-weather-presentation"]')) return;
    const ordinal = Number(panel.dataset.day);
    const weatherDay = dayByOrdinal.get(ordinal);
    if (!weatherDay) return;

    const source = panel.querySelector(':scope .day-weather');
    if (!source) return;
    const presentation = buildHourlyMatrix(weatherDay);
    if (!presentation) return;
    source.querySelector(':scope > .weather-detail')?.remove();
    source.insertAdjacentElement('afterend', presentation);
  });
}

export function hydrateWeatherPresentation(root, concretePlan) {
  const days = concretePlan?.weather?.days || [];
  if (!root || !days.length) return;

  const dayByOrdinal = new Map(days.map(day => [Number(day.day), day]));
  decorateItineraryOverview(root, dayByOrdinal);
  decorateDayWeather(root, dayByOrdinal);
}
