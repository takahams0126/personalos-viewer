const METEOCONS_BASE = 'https://cdn.meteocons.com/1.0.0/svg-static/fill';

const ICON_BY_CODE = Object.freeze({
  clear: 'clear-day',
  clear_day: 'clear-day',
  sunny: 'clear-day',
  partly_cloudy: 'partly-cloudy-day',
  partly_cloudy_day: 'partly-cloudy-day',
  cloudy: 'overcast',
  overcast: 'overcast',
  drizzle: 'drizzle',
  rain: 'rain',
  showers: 'rain',
  fog: 'fog',
  mist: 'fog',
  snow: 'snow',
  sleet: 'sleet',
  thunderstorm: 'thunderstorms',
  thunderstorms: 'thunderstorms'
});

function iconSlug(condition) {
  const code = condition?.code ? String(condition.code).toLowerCase() : '';
  return ICON_BY_CODE[code] || 'not-available';
}

function weatherIcon(condition, className) {
  const image = document.createElement('img');
  image.className = className;
  image.src = `${METEOCONS_BASE}/${iconSlug(condition)}.svg`;
  image.alt = '';
  image.setAttribute('aria-hidden', 'true');
  image.loading = 'lazy';
  return image;
}

function startTime(label) {
  if (!label) return '';
  return String(label).split('〜')[0] || String(label);
}

function fact(label, value) {
  if (!value) return null;
  const item = document.createElement('span');
  item.className = 'hourly-weather-detail-fact';
  const key = document.createElement('span');
  key.className = 'hourly-weather-detail-label';
  key.textContent = label;
  const content = document.createElement('strong');
  content.textContent = value;
  item.append(key, content);
  return item;
}

function renderPeriodDetail(panel, period) {
  panel.replaceChildren();

  const header = document.createElement('div');
  header.className = 'hourly-weather-detail-heading';
  header.append(
    weatherIcon(period.condition, 'weather-icon weather-icon-detail')
  );

  const copy = document.createElement('div');
  const time = document.createElement('strong');
  time.textContent = period.time_label || '';
  const condition = document.createElement('span');
  condition.textContent = period.condition?.label || '';
  copy.append(time, condition);
  header.append(copy);

  const facts = document.createElement('div');
  facts.className = 'hourly-weather-detail-facts';
  [
    fact('気温', period.temperature_label),
    fact('降水確率', period.precipitation_probability_label),
    fact('降水量', period.precipitation_amount_label),
    fact('風', period.wind_label)
  ].filter(Boolean).forEach(item => facts.append(item));

  panel.append(header, facts);
  panel.hidden = false;
}

function buildHourlyStrip(weatherDay) {
  const periods = weatherDay?.periods || [];
  if (!periods.length) return null;

  const wrapper = document.createElement('section');
  wrapper.className = 'hourly-weather';
  wrapper.dataset.semantic = 'hourly-weather-presentation';

  const strip = document.createElement('div');
  strip.className = 'hourly-weather-strip';
  strip.setAttribute('role', 'group');
  strip.setAttribute('aria-label', '3時間ごとの天気');

  const detail = document.createElement('div');
  detail.className = 'hourly-weather-detail-panel';
  detail.hidden = true;
  detail.setAttribute('aria-live', 'polite');

  periods.forEach((period, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'hourly-weather-period';
    button.setAttribute('aria-pressed', 'false');
    button.setAttribute(
      'aria-label',
      [period.time_label, period.condition?.label, period.temperature_label].filter(Boolean).join(' ')
    );

    const time = document.createElement('time');
    time.textContent = startTime(period.time_label);
    const temperature = document.createElement('span');
    temperature.className = 'hourly-weather-temperature';
    temperature.textContent = period.temperature_label || '';

    button.append(
      time,
      weatherIcon(period.condition, 'weather-icon weather-icon-hourly'),
      temperature
    );

    button.addEventListener('click', () => {
      const wasSelected = button.getAttribute('aria-pressed') === 'true';
      strip.querySelectorAll('.hourly-weather-period').forEach(item => item.setAttribute('aria-pressed', 'false'));
      if (wasSelected) {
        detail.hidden = true;
        return;
      }
      button.setAttribute('aria-pressed', 'true');
      renderPeriodDetail(detail, period);
    });

    if (index === 0) button.dataset.first = 'true';
    strip.append(button);
  });

  wrapper.append(strip, detail);
  return wrapper;
}

function decorateTripWeather(root, dayByOrdinal) {
  root.querySelectorAll('.trip-weather-day[data-day]').forEach(row => {
    const weatherDay = dayByOrdinal.get(Number(row.dataset.day));
    if (!weatherDay) return;
    const condition = row.querySelector('.trip-weather-condition');
    if (!condition || condition.querySelector('.weather-icon')) return;
    condition.prepend(weatherIcon(weatherDay.condition, 'weather-icon weather-icon-daily'));
  });
}

function decorateDaySummary(disclosure, weatherDay) {
  const compact = disclosure.querySelector('.concrete-day-weather');
  if (!compact || compact.querySelector('.weather-icon')) return;
  compact.prepend(weatherIcon(weatherDay.condition, 'weather-icon weather-icon-summary'));
}

function decorateDayWeather(disclosure, weatherDay) {
  const weather = disclosure.querySelector('.day-weather');
  if (!weather || weather.dataset.weatherHydrated === 'true') return;

  const summary = weather.querySelector('.weather-summary');
  if (summary && !summary.querySelector('.weather-icon')) {
    summary.prepend(weatherIcon(weatherDay.condition, 'weather-icon weather-icon-primary'));
  }

  const hourly = buildHourlyStrip(weatherDay);
  if (hourly) {
    const legacyDetail = weather.querySelector('.weather-detail');
    if (legacyDetail) {
      legacyDetail.before(hourly);
      legacyDetail.hidden = true;
    } else {
      weather.append(hourly);
    }
  }

  weather.dataset.weatherHydrated = 'true';
}

export function hydrateWeatherPresentation(root, concretePlan) {
  const days = concretePlan?.weather?.days || [];
  if (!root || !days.length) return;

  const dayByOrdinal = new Map(days.map(day => [Number(day.day), day]));
  decorateTripWeather(root, dayByOrdinal);

  root.querySelectorAll('.concrete-day-disclosure[data-day]').forEach(disclosure => {
    const weatherDay = dayByOrdinal.get(Number(disclosure.dataset.day));
    if (!weatherDay) return;
    decorateDaySummary(disclosure, weatherDay);
    decorateDayWeather(disclosure, weatherDay);
  });
}
