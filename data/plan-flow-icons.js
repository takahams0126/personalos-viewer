import {
  renderTablerIcon,
  resolveDestinationIcon,
  resolveTransferIcon
} from './icon-registry.js?v=20260915-13';

const planIconQs = new URLSearchParams(location.search);
if (planIconQs.get('type') === 'plan') initPlanFlowIcons();

function destinationSemantics(item) {
  const text = item.textContent || '';

  // Match specific semantic entities before broad substrings.
  // Example: "屋久島空港周辺レンタカー営業所" contains "空港" but is a rental_car_office.
  if (text.includes('レンタカー営業所')) return {pointType:'rental_car_office'};
  if (text.includes('自宅')) return {pointType:'home'};
  if (text.includes('空港')) return {pointType:'airport'};
  if (text.includes('宿泊') || text.includes('素泊民宿')) return {category:'lodging'};
  if (text.includes('温泉')) return {category:'onsen'};
  if (text.includes('夕食')) return {role:'dinner'};
  if (text.includes('昼食')) return {role:'lunch'};

  return {};
}

function transferModeFor(item) {
  const text = item.textContent || '';
  if (text.includes('飛行機')) return 'air';
  if (text.includes('電車')) return 'train';
  if (text.includes('徒歩')) return 'walk';
  if (text.includes('レンタカー') || text.includes('車＋登山アクセス')) return 'rental_car';
  return 'default';
}

function decoratePlanFlow(root=document) {
  root.querySelectorAll('.plan-axis .plan-axis-point > .flow-icon, .plan-axis .plan-axis-destination > .flow-icon').forEach(icon => {
    const item = icon.closest('.flow-item');
    if (!item || icon.dataset.semanticIcon === '1') return;
    icon.dataset.semanticIcon = '1';
    const iconName = resolveDestinationIcon(destinationSemantics(item));
    icon.innerHTML = renderTablerIcon(iconName, 'plan-destination-icon');
  });

  root.querySelectorAll('.plan-axis .plan-axis-transfer > .flow-icon').forEach(icon => {
    const item = icon.closest('.flow-item');
    if (!item || icon.dataset.semanticIcon === '1') return;
    icon.dataset.semanticIcon = '1';
    const iconName = resolveTransferIcon(transferModeFor(item));
    icon.innerHTML = renderTablerIcon(iconName, 'plan-transfer-icon');
  });
}

function initPlanFlowIcons() {
  const app = document.querySelector('#app');
  if (!app) return;
  decoratePlanFlow(app);
  const observer = new MutationObserver(() => decoratePlanFlow(app));
  observer.observe(app, {childList:true, subtree:true});
}
