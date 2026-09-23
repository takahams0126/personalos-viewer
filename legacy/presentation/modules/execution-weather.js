import { resolveWeatherIconSrc } from '../shared/weather-icons.js';

const qs = new URLSearchParams(location.search);
if (qs.get('type') === 'plan' && qs.get('id')) initWeather();

async function initWeather(){
  const id = qs.get('id');
  let payload;
  try {
    const response = await fetch(`./data/concrete-plans/${encodeURIComponent(id)}.json`, {cache:'no-store'});
    if (!response.ok) return;
    payload = await response.json();
  } catch { return; }

  const attach = () => {
    const panel = document.querySelector('#execution-mode-panel');
    if (!panel || panel.dataset.weatherAttached) return false;
    let attached = 0;
    for (const daySpec of payload.days || []) {
      const card = panel.querySelector(`.execution-day[data-day="${Number(daySpec.day)}"]`);
      if (!card || card.querySelector('.exec-weather-day')) continue;
      const overview = card.querySelector('.exec-day-overview');
      if (!overview) continue;
      overview.insertAdjacentHTML('afterend', weatherHtml(resolveWeather(daySpec)));
      attached++;
    }
    if (!attached) return false;
    panel.dataset.weatherAttached = '1';
    return true;
  };

  if (attach()) return;
  const observer = new MutationObserver(() => { if (attach()) observer.disconnect(); });
  observer.observe(document.querySelector('#app') || document.body, {childList:true, subtree:true});
}

const esc = value => String(value ?? '').replace(/[&<>'\"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]));

function resolveWeather(day = {}){
  const direct = day.weather_forecast || day.weather_assess || day.weather;
  if (direct?.periods) return direct;
  return null;
}

function weatherHtml(weather){
  if (!weather?.periods?.length) {
    return `<section class="exec-weather-day is-empty"><div class="exec-weather-day-head"><strong>天気</strong><span>3時間予報 未取得</span></div></section>`;
  }

  const periods = weather.periods;
  const head = periods.map(p => `<th scope="col">${esc(timeLabel(p.start, p.end))}</th>`).join('');
  const weatherRow = periods.map(p => `<td class="exec-weather-icon-cell"><img src="${resolveWeatherIconSrc(p.weather_code)}" alt="${esc(weatherLabel(p.weather_code))}" width="42" height="42" loading="lazy"></td>`).join('');
  const popRow = periods.map(p => `<td>${esc(rangeLabel(p.precip_probability_pct, '%'))}</td>`).join('');
  const rainRow = periods.map(p => `<td>${esc(rangeLabel(p.precip_mm_h, ' mm/h'))}</td>`).join('');
  const tempRow = periods.map(p => `<td>${esc(rangeLabel(p.temperature_c, '℃'))}</td>`).join('');
  const summary = weather.summary || {};
  const summaryText = [
    weather.location?.label,
    summary.weather_code ? weatherLabel(summary.weather_code) : '',
    tempSummary(summary)
  ].filter(Boolean).join('　');

  return `<section class="exec-weather-day">
    <div class="exec-weather-day-head"><strong>天気</strong>${summaryText ? `<span>${esc(summaryText)}</span>` : ''}</div>
    <div class="exec-weather-table-wrap" tabindex="0">
      <table class="exec-weather-table">
        <thead><tr><th scope="col">時間</th>${head}</tr></thead>
        <tbody>
          <tr><th scope="row">天気</th>${weatherRow}</tr>
          <tr><th scope="row">降水確率</th>${popRow}</tr>
          <tr><th scope="row">降水量</th>${rainRow}</tr>
          <tr><th scope="row">気温</th>${tempRow}</tr>
        </tbody>
      </table>
    </div>
  </section>`;
}

function timeLabel(start, end){
  const hour = value => {
    const match = String(value || '').match(/^(\d{1,2}):/);
    return match ? String(Number(match[1])) : String(value || '—');
  };
  return `${hour(start)}-${hour(end)}`;
}

function rangeLabel(value, suffix=''){
  if (!value || (value.min == null && value.max == null)) return '—';
  const min = value.min;
  const max = value.max;
  if (min == null) return `${formatNumber(max)}${suffix}`;
  if (max == null || Number(min) === Number(max)) return `${formatNumber(min)}${suffix}`;
  return `${formatNumber(min)}-${formatNumber(max)}${suffix}`;
}

function formatNumber(value){
  if (value == null || value === '') return '—';
  const n = Number(value);
  if (Number.isNaN(n)) return String(value);
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 10) / 10);
}

function tempSummary(summary = {}){
  if (summary.temperature_min_c == null && summary.temperature_max_c == null) return '';
  const min = summary.temperature_min_c == null ? '—' : formatNumber(summary.temperature_min_c);
  const max = summary.temperature_max_c == null ? '—' : formatNumber(summary.temperature_max_c);
  return `${min}-${max}℃`;
}

function weatherLabel(code){
  return ({
    CLEAR:'晴', MOSTLY_CLEAR:'概ね晴', PARTLY_CLOUDY:'晴時々曇', CLOUDY:'曇',
    LIGHT_RAIN:'小雨', RAIN:'雨', HEAVY_RAIN:'強雨', SHOWER:'にわか雨',
    THUNDERSTORM:'雷雨', LIGHT_SNOW:'小雪', SNOW:'雪', HEAVY_SNOW:'大雪',
    SLEET:'みぞれ', FOG:'霧', UNKNOWN:'不明'
  })[String(code || 'UNKNOWN').toUpperCase()] || String(code || '');
}
