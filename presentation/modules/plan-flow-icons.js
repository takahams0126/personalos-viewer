import {
  renderTablerIcon,
  resolveDestinationIcon,
  resolveTransferIcon
} from './icon-registry.js';

const DESTINATION_SELECTOR = '.plan-axis .plan-axis-point > .flow-icon, .plan-axis .plan-axis-destination > .flow-icon';
const TRANSFER_SELECTOR = '.plan-axis .plan-axis-transfer > .flow-icon';

function decorateDestination(icon){
  if(icon.dataset.semanticIcon==='1')return;
  const item=icon.closest('.flow-item');
  const flowType=item?.dataset.flowType||'';
  const pointType=item?.querySelector('.plan-axis-type')?.textContent?.trim()||'';
  const title=item?.querySelector('.flow-title')?.textContent?.trim()||'';
  let resolved='map-pin';
  if(/自宅/.test(pointType)||/自宅/.test(title))resolved='home';
  else if(/空港/.test(pointType)||/空港/.test(title))resolved='building-airport';
  else if(/駅/.test(pointType)||/駅/.test(title))resolved='track';
  else if(/レンタカー/.test(pointType)||/レンタカー/.test(title))resolved='building-store';
  else resolved=resolveDestinationIcon({});
  icon.innerHTML=renderTablerIcon(resolved,'plan-flow-svg');
  icon.dataset.semanticIcon='1';
  icon.dataset.flowType=flowType;
}

function decorateTransfer(icon){
  if(icon.dataset.semanticIcon==='1')return;
  const item=icon.closest('.flow-item');
  const text=item?.textContent||'';
  let mode='';
  if(/飛行機/.test(text))mode='air';
  else if(/電車/.test(text))mode='train';
  else if(/バス/.test(text))mode='bus';
  else if(/レンタカー/.test(text))mode='rental_car';
  else if(/徒歩/.test(text))mode='walk';
  icon.innerHTML=renderTablerIcon(resolveTransferIcon(mode),'plan-flow-svg');
  icon.dataset.semanticIcon='1';
}

function apply(){
  document.querySelectorAll(DESTINATION_SELECTOR).forEach(decorateDestination);
  document.querySelectorAll(TRANSFER_SELECTOR).forEach(decorateTransfer);
}

apply();
const observer=new MutationObserver(apply);
observer.observe(document.documentElement,{childList:true,subtree:true});
