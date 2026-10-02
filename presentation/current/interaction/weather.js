const SYMBOL_BY_CODE = Object.freeze({
  clear: '☀',
  clear_day: '☀',
  sunny: '☀',
  partly_cloudy: '⛅',
  partly_cloudy_day: '⛅',
  cloudy: '☁',
  overcast: '☁',
  drizzle: '🌦',
  rain: '🌧',
  showers: '🌧',
  fog: '🌫',
  mist: '🌫',
  snow: '❄',
  sleet: '🌨',
  thunderstorm: '⛈',
  thunderstorms: '⛈'
});

function weatherSymbol(condition, className) {
  const code = condition?.code ? String(condition.code).toLowerCase() : '';
  const symbol = SYMBOL_BY_CODE[code] || '•';
  const node = document.createElement('span');
  node.className = className;
  node.textContent = symbol;
  node.setAttribute('aria-hidden', 'true');
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

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'hourly-weather-toggle';
  toggle.setAttribute('aria-expanded', 'false');

  const title = document.createElement('span');
  title.className = 'hourly-weather-toggle-label';
  title.textContent = '3時間ごとの天気';

  const preview = document.createElement('span');
  preview.className = 'weather-matrix weather-matrix-preview';
  preview.append(
    matrixRow('', periods, period => startTime(period.time_label), 'weather-matrix-time-row'),
    matrixRow('天気', periods, period => {
      const icon = weatherSymbol(period.condition, 'weather-symbol weather-symbol-hourly');
      icon.title = period.condition?.label || '';
      return icon;
    }, 'weather-matrix-icon-row')
  );

  toggle.append(title, preview);

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
    detail.hidden = open;
  });

  wrapper.append(toggle, detail);
  return wrapper;
}

function decorateTripWeather(root, dayByOrdinal) {
  root.querySelectorAll('.trip-weather-day[data-day]').forEach(row => {
    const weatherDay = dayByOrdinal.get(Number(row.dataset.day));
    if (!weatherDay) return;
    const condition = row.querySelector('.trip-weather-condition');
    if (!condition || condition.querySelector('.weather-symbol')) return;
    condition.prepend(weatherSymbol(weatherDay.condition, 'weather-symbol weather-symbol-daily'));
  });
}

function decorateDaySummary(disclosure, weatherDay) {
  const compact = disclosure.querySelector('.concrete-day-weather');
  if (!compact || compact.querySelector('.weather-symbol')) return;
  compact.prepend(weatherSymbol(weatherDay.condition, 'weather-symbol weather-symbol-summary'));
}

function decorateDayWeather(disclosure, weatherDay, executionDay) {
  const weather = disclosure.querySelector('.day-weather');
  if (!weather || weather.dataset.weatherHydrated === 'true') return;

  const summary = weather.querySelector('.weather-summary');
  if (summary && !summary.querySelector('.weather-symbol')) {
    summary.prepend(weatherSymbol(weatherDay.condition, 'weather-symbol weather-symbol-primary'));
  }

  const matrix = buildHourlyMatrix(weatherDay, executionDay);
  if (matrix) {
    const legacyDetail = weather.querySelector('.weather-detail');
    if (legacyDetail) {
      legacyDetail.before(matrix);
      legacyDetail.hidden = true;
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
  decorateTripWeather(root, dayByOrdinal);

  root.querySelectorAll('.concrete-day-disclosure[data-day]').forEach(disclosure => {
    const ordinal = Number(disclosure.dataset.day);
    const weatherDay = dayByOrdinal.get(ordinal);
    if (!weatherDay) return;
    decorateDaySummary(disclosure, weatherDay);
    decorateDayWeather(disclosure, weatherDay, executionDayByOrdinal.get(ordinal));
  });
}
