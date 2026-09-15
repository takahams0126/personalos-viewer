#!/usr/bin/env python3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
APP = ROOT / "app.js"
ROUTE_VIEW = ROOT / "data" / "route-demo.js"


def replace_function(text: str, start_name: str, next_name: str, replacement: str) -> str:
    start = text.index(f"function {start_name}")
    end = text.index(f"function {next_name}", start)
    return text[:start] + replacement.rstrip() + "\n\n" + text[end:]


def replace_until(text: str, start_marker: str, end_marker: str, replacement: str) -> str:
    start = text.index(start_marker)
    end = text.index(end_marker, start)
    return text[:start] + replacement.rstrip() + "\n" + text[end:]


text = APP.read_text(encoding="utf-8")
render = '''function renderRoute(data) {
  const r=data.route||{},m=data.map||null; breadcrumb.innerHTML=`<a href="./">Home</a><span>›</span>${(data.parent_refs||[]).map(x=>`${refInline(x)}<span>›</span>`).join('')}<span>${esc(data.id)}</span>`;
  app.innerHTML=`<section class="hero"><div class="kicker">ルート · ${esc(data.id)}</div><h1>${esc(data.title)}</h1><p class="summary">${esc(data.summary||'')}</p><p>${esc(r.purpose||'')}</p></section>
    ${m?`<section class="section"><h2>ルートの地図</h2><div class="map-wrap"><div id="map"></div><div id="map-message" class="map-message"></div></div><p class="note">${esc(m.note||'立ち寄り順を示す概念地図です。')}</p></section>`:''}
    ${(r.highlights||[]).length?`<section class="section"><h2>このルートの魅力</h2><div class="cards">${r.highlights.map(x=>`<article class="card">${esc(x)}</article>`).join('')}</div></section>`:''}
    <section class="section"><h2>立ち寄り順</h2><div class="route-stops vertical">${(r.sequence||r.sequence_refs||[]).map((x,i)=>`<span class="route-stop"><span class="stop-no">${i+1}</span>${refInline(x)}${x.role?` <small>${esc(roleLabel(x.role))}</small>`:''}</span>`).join('')}</div></section>
    <section class="section"><h2>所要時間・難易度</h2><p>${esc(r.duration||'')} ${r.difficulty?`<span class="badge">${esc(difficultyLabel(r.difficulty))}</span>`:''}</p></section>
    ${(r.constraints||[]).length?`<section class="section"><h2>重要な条件</h2><ul class="list">${r.constraints.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></section>`:''}`;
  if(m) initRouteMap(m,r.sequence||r.sequence_refs||[]);
}'''
text = replace_function(text, "renderRoute(data)", "renderSpot(data)", render)

init_map = '''function initRouteMap(mapSpec,sequence){const spots=Object.fromEntries(sequence.map((x,index)=>[x.id,{...x,sequenceOrder:index+1}]));loadGoogleMap(mapSpec,spots);}'''
text = replace_function(text, "initRouteMap(mapSpec,sequence)", "googleMapsSearchUrl(name,placeId='')", init_map)

load_map = '''async function loadGoogleMap(mapSpec,spots={}){const key=window.PERSONALOS_CONFIG?.googleMapsApiKey||'',message=document.querySelector('#map-message'),mapElement=document.querySelector('#map');if(!mapElement||!message)return;mapElement.style.display='';mapElement.replaceChildren();if(!key){mapElement.style.display='none';message.textContent='Google Maps API key 未設定。';return;}try{await ensureGoogleMaps(key);const pointArtifact=await fetchJson(mapSpec.points_json);const map=new google.maps.Map(mapElement,{mapTypeControl:true,streetViewControl:false,fullscreenControl:true}),info=new google.maps.InfoWindow(),bounds=new google.maps.LatLngBounds(),points=pointArtifact.points||[];points.forEach(point=>addPointMarker({map,info,point,spot:spots[normalizeEntityId(point.entity_id||point.spot_id)]||{},bounds}));if(!bounds.isEmpty())map.fitBounds(bounds,28);message.textContent='';}catch(e){mapElement.style.display='none';message.textContent=`地図の読み込みに失敗しました: ${e.message}`;}}'''
text = replace_until(text, "async function loadGoogleMap(mapSpec,spots={},mode='conceptual')", "let googlePromise", load_map)

# Conceptual markers no longer need an execution-map mode.
text = text.replace("function addPointMarker({map,info,point,spot,mode,bounds}){", "function addPointMarker({map,info,point,spot,bounds}){")
text = text.replace("label=mode==='actual'?routeLetter(order):(order?String(order):'');", "label=order?String(order):'';")

APP.write_text(text, encoding="utf-8")

route = ROUTE_VIEW.read_text(encoding="utf-8")
route = route.replace("if (routeType === 'route' && routeId === 'R011') initRouteDemo();", "if (routeType === 'route' && routeId) initRouteDemo();")
ROUTE_VIEW.write_text(route, encoding="utf-8")
