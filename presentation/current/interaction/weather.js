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

function executionWindow(day) {
  const actions = [...(day?.actions || [])].sort((a, b) => a.order - b.order);
  if (!actions.length) return null;
  const first = actions.find(action => action.arrival_label || action.departure_label);
  const last = [...actions].reverse().find(action => action.departure_label || action.arrival_label);
  const start = first?.arrival_label || first?.departure_label || day.start_time_label || '';
  const end = last?.departure_label || last?.arrival_label || '';
  if (!start && !end) return null;
  return { start, end };
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

function buildHourlyMatrix(weatherDay, executionDay) {
  const periods = weatherDay?.periods || [];
  if (!periods.length) return null;

  const wrapper = document.createElement('section');
  wrapper.className = 'hourly-weather';
  wrapper.dataset.semantic = 'hourly-weather-presentation';
  wrapper.style.setProperty('--weather-period-count', String(periods.length));

  const window = executionWindow(executionDay);
  if (window) {
    const execution = document.createElement('p');
    execution.className = 'weather-execution-window';
    execution.dataset.semantic = 'weather-execution-window';
    const label = document.createElement('span');
    label.textContent = '標準行程';
    const value = document.createElement('strong');
    value.textContent = window.start && window.end && window.start !== window.end
      ? `${window.start}〜${window.end}`
      : window.start || window.end;
    execution.append(label, value);
    wrapper.append(execution);
  }

  const matrix = document.createElement('div');
  matrix.className = 'weather-matrix weather-matrix-complete';
  matrix.append(
    matrixRow('', periods, period => startTime(period.time_label), 'weather-matrix-time-row'),
    matrixRow('天気', periods, period => {
      const icon = weatherIcon(period.condition, 'weather-icon weather-icon-hourly');
      icon.title = period.condition?.label || '';
      return icon;
    }, 'weather-matrix-icon-row'),
    matrixRow('気温', periods, period => period.temperature_label),
    matrixRow('降水確率', periods, period => period.precipitation_probability_label),
    matrixRow('降水量', periods, period => period.precipitation_amount_label),
    matrixRow('風', periods, period => period.wind_label)
  );

  wrapper.append(matrix);
  return wrapper;
}

function decorateTripWeather(root, dayByOrdinal, executionDayByOrdinal) {
  const list = root.querySelector('.trip-weather-days');
  if (list) list.dataset.presentation = 'icon-strip';

  root.querySelectorAll('.trip-weather-day[data-day]').forEach(row => {
    const ordinal = Number(row.dataset.day);
    const weatherDay = dayByOrdinal.get(ordinal);
    if (!weatherDay) return;
    const executionDay = executionDayByOrdinal.get(ordinal);

    const dayLabel = document.createElement('strong');
    dayLabel.className = 'trip-weather-day-label';
    dayLabel.textContent = `Day ${ordinal}`;

    const icon = weatherIcon(weatherDay.condition, 'weather-icon weather-icon-trip');

    const condition = document.createElement('span');
    condition.className = 'trip-weather-condition';
    condition.textContent = weatherDay.condition?.label || '—';

    const date = document.createElement('span');
    date.className = 'trip-weather-date';
    date.textContent = [executionDay?.date, executionDay?.weekday_label].filter(Boolean).join(' ');

    row.replaceChildren(dayLabel, icon, condition, date);
  });
}

function decorateDaySummary(disclosure, weatherDay) {
  const compact = disclosure.querySelector('.concrete-day-weather');
  if (!compact || compact.querySelector('.weather-icon')) return;
  compact.prepend(weatherIcon(weatherDay.condition, 'weather-icon weather-icon-summary'));
}

function decorateDayWeather(disclosure, weatherDay, executionDay) {
  const weather = disclosure.querySelector('.day-weather');
  if (!weather || weather.dataset.weatherHydrated === 'true') return;

  const summary = weather.querySelector('.weather-summary');
  if (summary) {
    const icon = weatherIcon(weatherDay.condition, 'weather-icon weather-icon-primary');
    const condition = summary.querySelector('strong');
    summary.replaceChildren(icon, condition || document.createTextNode(weatherDay.condition?.label || ''));
  }

  const matrix = buildHourlyMatrix(weatherDay, executionDay);
  if (matrix) {
    const legacyDetail = weather.querySelector('.weather-detail');
    if (legacyDetail) {
      legacyDetail.before(matrix);
      legacyDetail.remove();
    } else {
      weather.append(matrix);
    }
  }

  weather.dataset.weatherHydrated = 'true';
}

export function hydrateWeatherPresentation(root, concretePlan) {
  const days = concretePlan?.weather?.days || [];
  if (!root || !days.length) return;

  const dayByOrdinal = new Map(days.map(day => [Number(day.day), day]));
  const executionDayByOrdinal = new Map((concretePlan?.days || []).map(day => [Number(day.ordinal), day]));
  decorateTripWeather(root, dayByOrdinal, executionDayByOrdinal);

  root.querySelectorAll('.concrete-day-disclosure[data-day]').forEach(disclosure => {
    const ordinal = Number(disclosure.dataset.day);
    const weatherDay = dayByOrdinal.get(ordinal);
    if (!weatherDay) return;
    decorateDaySummary(disclosure, weatherDay);
    decorateDayWeather(disclosure, weatherDay, executionDayByOrdinal.get(ordinal));
  });
}
