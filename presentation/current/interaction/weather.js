const ICON_BY_CODE = Object.freeze({
  clear: 'clear-day',
  clear_day: 'clear-day',
  sunny: 'clear-day',
  mostly_clear: 'clear-day',
  mostly_clear_day: 'clear-day',
  partly_cloudy: 'partly-cloudy-day',
  partly_cloudy_day: 'partly-cloudy-day',
  cloudy: 'cloudy',
  overcast: 'cloudy',
  drizzle: 'rain',
  light_rain: 'rain',
  rain: 'rain',
  showers: 'rain',
  heavy_rain: 'rain',
  extreme_rain: 'rain',
  thunderstorm: 'thunderstorms-day-rain',
  thunderstorms: 'thunderstorms-day-rain'
});

function weatherIcon(condition, className) {
  const code = condition?.code ? String(condition.code).toLowerCase() : '';
  const slug = ICON_BY_CODE[code] || 'not-available';
  const node = document.createElement('img');
  node.className = className;
  node.src = new URL(`../assets/weather/${slug}.svg`, import.meta.url).href;
  node.alt = '';
  node.setAttribute('aria-hidden', 'true');
  node.loading = 'lazy';
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
  wrapper.className = 'hourly-weather';
  wrapper.dataset.semantic = 'hourly-weather-presentation';
  wrapper.style.setProperty('--weather-period-count', String(periods.length));

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'hourly-weather-toggle';
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-label', '3時間天気の詳細を表示');

  const preview = document.createElement('span');
  preview.className = 'weather-matrix weather-matrix-preview';
  preview.append(
    matrixRow('', periods, period => startTime(period.time_label), 'weather-matrix-time-row'),
    matrixRow('天気', periods, period => {
      const icon = weatherIcon(period.condition, 'weather-icon weather-icon-hourly');
      icon.title = period.condition?.label || '';
      return icon;
    }, 'weather-matrix-icon-row')
  );
  toggle.append(preview);

  const detail = document.createElement('div');
  detail.className = 'weather-matrix weather-matrix-detail';
  detail.hidden = true;
  detail.append(
    matrixRow('気温', periods, period => period.temperature_label),
    matrixRow('降水確率', periods, period => period.precipitation_probability_label),
    matrixRow('降水量', periods, period => period.precipitation_amount_label),
    matrixRow('風', periods, period => period.wind_label)
  );

  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', open ? 'false' : 'true');
    toggle.setAttribute('aria-label', open ? '3時間天気の詳細を表示' : '3時間天気の詳細を閉じる');
    detail.hidden = open;
  });

  wrapper.append(toggle, detail);
  return wrapper;
}

function decorateDayNavigation(root, dayByOrdinal) {
  root.querySelectorAll('[data-day-navigation] [role="tab"][data-day]').forEach(tab => {
    if (tab.querySelector('.primary-day-tab-weather')) return;
    const ordinal = Number(tab.dataset.day);
    const weatherDay = dayByOrdinal.get(ordinal);
    if (!weatherDay) return;

    const weather = document.createElement('span');
    weather.className = 'primary-day-tab-weather';
    weather.append(weatherIcon(weatherDay.condition, 'weather-icon weather-icon-day-tab'));

    const condition = document.createElement('span');
    condition.className = 'primary-day-tab-condition';
    condition.textContent = weatherDay.condition?.label || '—';
    weather.append(condition);

    const title = tab.querySelector('.primary-day-tab-title');
    if (title) tab.insertBefore(weather, title);
    else tab.append(weather);
  });
}

function decorateDayWeather(root, dayByOrdinal) {
  root.querySelectorAll('[data-day-navigation-panel][data-day]').forEach(panel => {
    if (panel.querySelector('[data-semantic="hourly-weather-presentation"]')) return;
    const ordinal = Number(panel.dataset.day);
    const weatherDay = dayByOrdinal.get(ordinal);
    if (!weatherDay) return;

    const source = panel.querySelector(':scope .day-weather');
    if (!source) return;
    const matrix = buildHourlyMatrix(weatherDay);
    if (!matrix) {
      source.remove();
      return;
    }

    const presentation = document.createElement('section');
    presentation.className = 'selected-day-weather';
    presentation.dataset.semantic = 'selected-day-weather';
    const heading = document.createElement('h3');
    heading.textContent = '3時間天気';
    presentation.append(heading, matrix);
    source.replaceWith(presentation);
  });
}

export function hydrateWeatherPresentation(root, concretePlan) {
  const days = concretePlan?.weather?.days || [];
  if (!root || !days.length) return;

  const dayByOrdinal = new Map(days.map(day => [Number(day.day), day]));
  decorateDayNavigation(root, dayByOrdinal);
  decorateDayWeather(root, dayByOrdinal);
}
