const qs=new URLSearchParams(location.search);
if(qs.get('type')==='plan'&&qs.get('id')) initWeatherPoc();

async function initWeatherPoc(){
  const id=qs.get('id'); let payload;
  try{const r=await fetch(`./data/_staging/concrete-plans/${encodeURIComponent(id)}.json`,{cache:'no-store'});if(!r.ok)return;payload=await r.json();}catch{return;}
  const days=(payload.days||[]).filter(day=>day.weather_assessment);
  const attach=()=>{
    const panel=document.querySelector('#execution-mode-panel');
    if(!panel||panel.dataset.weatherPocAttached)return false;
    let attached=0;
    for(const daySpec of days){
      const dayKey=String(daySpec.day);
      const card=panel.querySelector(`.execution-day[data-day="${dayKey}"]`);
      if(!card)continue;
      const body=card.querySelector('.exec-day-body');
      const overview=card.querySelector('.exec-day-overview');
      const summary=card.querySelector('.exec-day-summary');
      const target=summary||overview||body;
      if(!target||card.querySelector('.exec-weather-assessment'))continue;
      target.insertAdjacentHTML('afterend',weatherHtml(daySpec.weather_assessment));
      attached++;
    }
    if(!attached)return false;
    panel.dataset.weatherPocAttached='1';
    return true;
  };
  if(attach())return;
  const ob=new MutationObserver(()=>{if(attach())ob.disconnect();});
  ob.observe(document.querySelector('#app')||document.body,{childList:true,subtree:true});
}

const esc=v=>String(v??'').replace(/[&<>'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]));

function weatherHtml(w={}){
  const status=w.status||'unknown';
  const checked=w.checked_at?formatChecked(w.checked_at):'未確認';
  const reasons=(w.decision_reasons||[]).map(x=>`<li>${esc(x)}</li>`).join('');
  return `<section class="exec-weather-assessment is-${esc(status)}">
    <div class="exec-weather-head"><div><span>天候判断</span><strong>${esc(w.scope||'')}</strong></div><b>${esc(w.status_label||status)}</b></div>
    <div class="exec-weather-facts">
      <div><small>予報</small><strong>${esc(w.forecast_summary||'未確認')}</strong></div>
      <div><small>午前降水</small><strong>${esc(w.precipitation?.morning||'未確認')}</strong></div>
      <div><small>午後降水</small><strong>${esc(w.precipitation?.afternoon||'未確認')}</strong></div>
      <div><small>風</small><strong>${esc(w.wind||'未確認')}</strong></div>
      <div><small>山岳条件</small><strong>${esc(w.mountain_condition||'未確認')}</strong></div>
    </div>
    <div class="exec-weather-decision"><small>実施判断</small><strong>${esc(w.decision||'未判断')}</strong>${reasons?`<ul>${reasons}</ul>`:''}</div>
    ${w.alternative_rule?`<div class="exec-weather-alt"><small>代替条件</small><span>${esc(w.alternative_rule)}</span></div>`:''}
    <div class="exec-weather-checked">最終確認 ${esc(checked)}</div>
  </section>`;
}

function formatChecked(v){
  const d=new Date(v); if(Number.isNaN(d.getTime()))return v;
  return new Intl.DateTimeFormat('ja-JP',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'}).format(d);
}
