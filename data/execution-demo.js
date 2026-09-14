const qs = new URLSearchParams(location.search);
const type = qs.get('type');
const id = qs.get('id');

if (type === 'plan' && id) initConcreteDemo();

async function initConcreteDemo() {
  let concrete;
  try {
    const r = await fetch(`./data/concrete-plans/${encodeURIComponent(id)}.json`, {cache:'no-store'});
    if (!r.ok) return;
    concrete = await r.json();
  } catch { return; }

  const app = document.querySelector('#app');
  const attach = () => {
    const hero = app?.querySelector('.hero');
    if (!hero || app.dataset.concreteDemoAttached) return false;
    app.dataset.concreteDemoAttached = '1';

    const planPanel = document.createElement('div');
    planPanel.id = 'plan-mode-panel';
    planPanel.className = 'mode-panel active';
    const current = [...app.children].filter(x => x !== hero);
    current.forEach(x => planPanel.appendChild(x));

    const executionPanel = document.createElement('div');
    executionPanel.id = 'execution-mode-panel';
    executionPanel.className = 'mode-panel';
    executionPanel.hidden = true;
    executionPanel.innerHTML = executionHtml(concrete);

    const switcher = document.createElement('div');
    switcher.className = 'plan-mode-switch';
    switcher.innerHTML = `
      <button class="plan-mode-btn active" data-mode="plan"><span>◯</span> 計画</button>
      <button class="plan-mode-btn" data-mode="execution"><span>✓</span> 実施</button>
      <span class="demo-chip">表示仕様デモ</span>`;

    hero.after(switcher, planPanel, executionPanel);
    let mapReady = false;
    switcher.addEventListener('click', e => {
      const btn = e.target.closest('.plan-mode-btn');
      if (!btn) return;
      const mode = btn.dataset.mode;
      switcher.querySelectorAll('.plan-mode-btn').forEach(x => x.classList.toggle('active', x === btn));
      planPanel.hidden = mode !== 'plan';
      executionPanel.hidden = mode !== 'execution';
      planPanel.classList.toggle('active', mode === 'plan');
      executionPanel.classList.toggle('active', mode === 'execution');
      if (mode === 'execution' && !mapReady) {
        mapReady = true;
        loadExecutionMap(concrete.map).catch(showMapError);
      }
    });
    return true;
  };

  if (attach()) return;
  const observer = new MutationObserver(() => { if (attach()) observer.disconnect(); });
  observer.observe(app, {childList:true, subtree:true});
}

function e(v='') { return String(v).replace(/[&<>'\"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c])); }
const labels = {
  mode:{walk:'徒歩',train:'電車',air:'飛行機',rental_car:'レンタカー',bus:'バス'},
  point:{home:'自宅',station:'駅',airport:'空港',parking:'駐車場',trailhead:'登山口',rental_car_office:'レンタカー営業所'},
  feasibility:{viable:'実施可能',conditional:'条件付き',confirmed:'確認済み',unknown:'未確認'}
};
const l=(g,v)=>labels[g]?.[v]||String(v||'').replaceAll('_',' ');

function endpoint(v) {
  if (!v) return '';
  const kind = v.type === 'travel_point' && v.point_type ? `<span class="exec-point-kind">${e(l('point',v.point_type))}</span>` : '';
  return `<span class="exec-endpoint ${v.type==='travel_point'?'travel-point':'spot-point'}">${e(v.label||v.id||'')}${kind}</span>`;
}
function stepIcon(step) {
  if (step.type === 'spot') return '●';
  if (step.type === 'route') return '★';
  if (step.type === 'operation') return step.label?.includes('駐車') ? 'P' : '✓';
  return ({walk:'🚶',train:'🚃',air:'✈',rental_car:'🚙',bus:'🚌'}[step.mode] || '↔');
}
function stepHtml(step) {
  const time = `<div class="exec-time"><strong>${e(step.time||'')}</strong>${step.end_time?`<span>${e(step.end_time)}</span>`:''}</div>`;
  const fromTo = step.from || step.to ? `<div class="exec-fromto">${endpoint(step.from)}${step.from&&step.to?'<span class="exec-arrow">➜</span>':''}${endpoint(step.to)}</div>` : '';
  const at = step.at ? `<div class="exec-fromto">${endpoint(step.at)}</div>` : '';
  const mode = step.mode ? `<span class="badge">${e(l('mode',step.mode))}</span>` : '';
  const detail = step.detail ? `<div class="exec-detail">${e(step.detail)}</div>` : '';
  return `<li class="exec-step ${e(step.type||'')}">${time}<div class="exec-node">${stepIcon(step)}</div><div class="exec-body"><div class="exec-title">${e(step.label||'')} ${mode}</div>${fromTo}${at}${detail}</div></li>`;
}
function executionDay(day) {
  const f = day.feasibility ? `<span class="exec-status ${e(day.feasibility)}">${e(l('feasibility',day.feasibility))}</span>` : '';
  return `<article class="execution-day"><header><div><div class="execution-day-no">${e(day.day)}日目</div><h3>${e(day.purpose||'')}</h3><p>${e(day.date_label||'')}</p></div>${f}</header><ol class="exec-timeline">${(day.steps||[]).map(stepHtml).join('')}</ol></article>`;
}
function executionHtml(data) {
  return `
    <section class="section execution-intro">
      <div class="execution-title-row"><div><div class="kicker">実施プラン</div><h2>確定時間ベースの行動計画</h2></div><span class="demo-chip warn">仮想データ</span></div>
      <p>${e(data.notice||'')}</p>
      <div class="execution-principle"><strong>計画のFlowを保ったまま詳細化</strong><span>TravelPoint・駐車・徒歩アクセス・乗換・待ち時間まで実行stepとして展開します。</span></div>
    </section>
    <section class="section"><div class="section-heading"><h2>実施タイムスケジュール</h2><p>時刻、移動手段、Spot、TravelPointを同じ時系列で追います。</p></div>${(data.days||[]).map(executionDay).join('')}</section>
    ${data.map?`<section class="section"><div class="section-heading"><h2>実施ルートの地図</h2><p>Spotだけでなく駅・空港・レンタカー受取・駐車場などのTravelPointも表示します。</p></div><div class="exec-map-legend"><span><i class="rail"></i>電車</span><span><i class="air"></i>飛行機</span><span><i class="car"></i>車</span><span><i class="walk"></i>徒歩</span></div><div class="map-wrap"><div id="execution-map"></div><div id="execution-map-message" class="map-message"></div></div><p class="note">${e(data.map.note||'')}</p></section>`:''}`;
}

function showMapError(err){const el=document.querySelector('#execution-map-message');const map=document.querySelector('#execution-map');if(map)map.style.display='none';if(el)el.textContent=`地図の読み込みに失敗しました: ${err.message}`;}
async function ensureMaps(){if(window.google?.maps)return;const key=window.PERSONALOS_CONFIG?.googleMapsApiKey||'';if(!key)throw new Error('Google Maps API key 未設定');if(window.__concreteMapsPromise)return window.__concreteMapsPromise;window.__concreteMapsPromise=new Promise((resolve,reject)=>{window.__personalosConcreteMapsReady=resolve;const s=document.createElement('script');s.src=`https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&callback=__personalosConcreteMapsReady&v=weekly`;s.async=true;s.defer=true;s.onerror=()=>reject(new Error('Google Maps JavaScript API load error'));document.head.appendChild(s);});return window.__concreteMapsPromise;}
async function loadExecutionMap(spec){if(!spec)return;await ensureMaps();const el=document.querySelector('#execution-map');if(!el)return;const map=new google.maps.Map(el,{mapTypeControl:true,streetViewControl:false,fullscreenControl:true});const bounds=new google.maps.LatLngBounds();const byId=Object.fromEntries((spec.points||[]).map(p=>[p.id,p]));const info=new google.maps.InfoWindow();for(const p of spec.points||[]){const pos={lat:Number(p.lat),lng:Number(p.lon)};bounds.extend(pos);const isTravel=p.entity_type==='travel_point';const marker=new google.maps.Marker({map,position:pos,label:{text:String(p.order||''),color:'#fff',fontWeight:'700'},title:p.name,zIndex:100+Number(p.order||0)});marker.addListener('click',()=>{const kind=isTravel&&p.point_type?`<div>${e(l('point',p.point_type))}</div>`:'';info.setContent(`<div class="pin-popup"><strong>${e(p.name)}</strong>${kind}</div>`);info.open({map,anchor:marker});});}
  const segmentStyle={train:{strokeColor:'#7b61ff',strokeWeight:6},air:{strokeColor:'#34a853',strokeWeight:4,strokeOpacity:.75},rental_car:{strokeColor:'#1a73e8',strokeWeight:7},walk:{strokeColor:'#f9ab00',strokeWeight:5}};
  for(const s of spec.segments||[]){const a=byId[s.from],b=byId[s.to];if(!a||!b)continue;new google.maps.Polyline({map,path:[{lat:Number(a.lat),lng:Number(a.lon)},{lat:Number(b.lat),lng:Number(b.lon)}],strokeOpacity:.9,...(segmentStyle[s.mode]||{})});}
  if(!bounds.isEmpty())map.fitBounds(bounds,34);const msg=document.querySelector('#execution-map-message');if(msg)msg.textContent='';}
