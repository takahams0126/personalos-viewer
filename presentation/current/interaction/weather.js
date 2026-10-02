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

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'hourly-weather-toggle';
  toggle.setAttribute('aria-expanded', 'false');

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
    detail.hidden = open;
  });

  wrapper.append(toggle, detail);
  return wrapper;
}

function createWeatherTab({ ordinal, weatherDay, executionDay, panelId, selected }) {
  const tab = document.createElement('button');
  tab.type = 'button';
  tab.className = 'trip-weather-tab';
  tab.id = `trip-weather-day-${ordinal}-tab`;
  tab.setAttribute('role', 'tab');
  tab.setAttribute('aria-controls', panelId);
  tab.setAttribute('aria-selected', selected ? 'true' : 'false');
  tab.tabIndex = selected ? 0 : -1;
  tab.dataset.day = String(ordinal);

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

  tab.append(dayLabel, icon, condition, date);
  return tab;
}

function decorateTripWeather(root, dayByOrdinal, executionDayByOrdinal) {
  const overview = root.querySelector('.trip-weather-overview');
  const sourceList = overview?.querySelector('.trip-weather-days');
  if (!overview || !sourceList || overview.dataset.weatherHydrated === 'true') return;

  const ordinals = [...dayByOrdinal.keys()].sort((a, b) => a - b);
  if (!ordinals.length) return;

  const tabList = document.createElement('div');
  tabList.className = 'trip-weather-tabs';
  tabList.setAttribute('role', 'tablist');
  tabList.setAttribute('aria-label', '日別天気');

  const panel = document.createElement('div');
  panel.className = 'trip-weather-panel';
  panel.id = 'trip-weather-detail-panel';
  panel.setAttribute('role', 'tabpanel');

  const activate = ordinal => {
    const weatherDay = dayByOrdinal.get(ordinal);
    const executionDay = executionDayByOrdinal.get(ordinal);
    if (!weatherDay) return;

    tabList.querySelectorAll('[role="tab"]').forEach(tab => {
      const active = Number(tab.dataset.day) === ordinal;
      tab.setAttribute('aria-selected', active ? 'true' : 'false');
      tab.tabIndex = active ? 0 : -1;
      if (active) panel.setAttribute('aria-labelledby', tab.id);
    });

    const matrix = buildHourlyMatrix(weatherDay, executionDay);
    panel.replaceChildren(matrix || document.createTextNode('3時間天気はありません。'));
  };

  ordinals.forEach((ordinal, index) => {
    const tab = createWeatherTab({
      ordinal,
      weatherDay: dayByOrdinal.get(ordinal),
      executionDay: executionDayByOrdinal.get(ordinal),
      panelId: panel.id,
      selected: index === 0
    });
    tab.addEventListener('click', () => activate(ordinal));
    tab.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const tabs = [...tabList.querySelectorAll('[role="tab"]')];
      const current = tabs.indexOf(event.currentTarget);
      let next = current;
      if (event.key === 'ArrowLeft') next = (current - 1 + tabs.length) % tabs.length;
      if (event.key === 'ArrowRight') next = (current + 1) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      tabs[next].focus();
      activate(Number(tabs[next].dataset.day));
    });
    tabList.append(tab);
  });

  sourceList.replaceWith(tabList);
  overview.append(panel);
  overview.dataset.weatherHydrated = 'true';
  activate(ordinals[0]);
}

function decorateDaySummary(disclosure, weatherDay) {
  const compact = disclosure.querySelector('.concrete-day-weather');
  if (!compact || compact.querySelector('.weather-icon')) return;
  compact.prepend(weatherIcon(weatherDay.condition, 'weather-icon weather-icon-summary'));
}

function removeDayWeather(disclosure) {
  const weather = disclosure.querySelector('.day-weather');
  if (weather) weather.remove();
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
    removeDayWeather(disclosure);
  });
}
