const qs = new URLSearchParams(location.search);
if (qs.get('type') === 'plan' && qs.get('id')) initExecutionOverview();

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

async function initExecutionOverview(){
  const id = qs.get('id');
  let spec;
  try {
    const response = await fetch(`./data/concrete-plans/${encodeURIComponent(id)}.json`, {cache:'no-store'});
    if (!response.ok) return;
    spec = await response.json();
  } catch { return; }

  const attach = () => {
    const panel = document.querySelector('#execution-mode-panel');
    const intro = panel?.querySelector('.execution-intro');
    const overview = spec.display?.execution_overview;
    if (!panel || !intro || !overview || panel.dataset.executionOverviewAttached) return false;
    panel.dataset.executionOverviewAttached = '1';
    intro.outerHTML = renderOverview(spec, overview);
    return true;
  };

  if (attach()) return;
  const observer = new MutationObserver(() => { if (attach()) observer.disconnect(); });
  observer.observe(document.querySelector('#app') || document.body, {childList:true, subtree:true});
}

const esc = value => String(value ?? '').replace(/[&<>'\"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]));

function renderOverview(spec, overview){
  const period = formatPeriod(spec.execution_window);
  const state = stateLabel(spec.status);
  const verified = spec.last_verified_at ? formatDateTime(spec.last_verified_at) : '未確認';
  const weather = (overview.weather_daily || []).map(renderWeatherDay).join('');
  const sharedFacts = (overview.shared_facts || []).map(item => `<div class="exec-overview-fact"><span>${esc(item.label)}</span><strong>${esc(item.value)}</strong></div>`).join('');

  return `<section class="section execution-overview">
    <div class="exec-overview-head">
      <div>
        <div class="kicker">実施プラン</div>
        <h2>${esc(overview.heading || '実施概要')}</h2>
      </div>
      ${state ? `<span class="exec-overview-state is-${esc(spec.status || 'unknown')}">${esc(state)}</span>` : ''}
    </div>
    <div class="exec-overview-meta">
      <div><span>実施期間</span><strong>${esc(period || '未設定')}${overview.stay_label ? `　${esc(overview.stay_label)}` : ''}</strong></div>
      <div><span>実施情報更新</span><strong>${esc(verified)}</strong></div>
    </div>
    ${weather ? `<div class="exec-overview-weather">
      <div class="exec-overview-weather-title"><strong>${esc(overview.weather_heading || '天気')}</strong>${overview.weather_note ? `<span>${esc(overview.weather_note)}</span>` : ''}</div>
      <div class="exec-overview-weather-days">${weather}</div>
    </div>` : ''}
    ${sharedFacts ? `<div class="exec-overview-facts">${sharedFacts}</div>` : ''}
  </section>`;
}

function renderWeatherDay(day){
  const code = String(day.weather_code || 'UNKNOWN').toUpperCase();
  const slug = WEATHER_ICON_BY_CODE[code] || WEATHER_ICON_BY_CODE.UNKNOWN;
  const src = `${WEATHER_ICON_BASE}/${slug}.svg`;
  return `<div class="exec-overview-weather-day">
    <div class="exec-overview-weather-date"><strong>${esc(day.date_label || '')}</strong><span>${esc(day.weekday ? `(${day.weekday})` : '')}</span></div>
    <img src="${src}" alt="" aria-hidden="true" width="76" height="76" loading="lazy">
    <div class="exec-overview-weather-label">${esc(day.label || '')}</div>
  </div>`;
}

function stateLabel(value){
  return ({confirmed:'確認済み', viable:'実施可能', conditional:'条件付き', unknown:'未確認'})[value] || value || '';
}

function formatPeriod(windowSpec = {}){
  const start = formatDateWithWeekday(windowSpec.start_date);
  const end = formatDateWithWeekday(windowSpec.end_date);
  if (!start && !end) return '';
  if (windowSpec.start_date === windowSpec.end_date) return start;
  return `${start || '—'} 〜 ${end || '—'}`;
}

function formatDateWithWeekday(value){
  if (!value) return '';
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return String(value);
  const date = new Date(`${value}T00:00:00+09:00`);
  const weekday = ['日','月','火','水','木','金','土'][date.getDay()];
  return `${Number(match[2])}/${Number(match[3])}(${weekday})`;
}

function formatDateTime(value){
  try {
    return new Intl.DateTimeFormat('ja-JP', {month:'numeric', day:'numeric', hour:'2-digit', minute:'2-digit', timeZone:'Asia/Tokyo'}).format(new Date(value));
  } catch { return String(value); }
}
