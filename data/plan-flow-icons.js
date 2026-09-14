const planIconQs = new URLSearchParams(location.search);
if (planIconQs.get('type') === 'plan') initPlanFlowIcons();

const iconPaths = {
  home: [
    '<path d="M5 12l-2 0l9 -9l9 9l-2 0" />',
    '<path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-7" />',
    '<path d="M9 21v-6a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v6" />'
  ],
  pin: [
    '<path d="M9 11a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" />',
    '<path d="M17.657 16.657l-4.243 4.243a2 2 0 0 1 -2.827 0l-4.244 -4.243a8 8 0 1 1 11.314 0" />'
  ],
  plane: ['<path d="M16 10h4a2 2 0 0 1 0 4h-4l-4 7h-3l2 -7h-4l-2 2h-3l2 -4l-2 -4h3l2 2h4l-2 -7h3l4 7" />'],
  train: [
    '<path d="M21 13c0 -3.87 -3.37 -7 -10 -7h-8" />',
    '<path d="M3 15h16a2 2 0 0 0 2 -2" />',
    '<path d="M3 6v5h17.5" />',
    '<path d="M3 11v4" />',
    '<path d="M8 11v-5" />',
    '<path d="M13 11v-4.5" />',
    '<path d="M3 19h18" />'
  ],
  car: [
    '<path d="M5 17a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />',
    '<path d="M15 17a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />',
    '<path d="M5 17h-2v-6l2 -5h9l4 5h1a2 2 0 0 1 2 2v4h-2m-4 0h-6m-6 -6h15m-6 0v-5" />'
  ],
  walk: [
    '<path d="M12 4a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />',
    '<path d="M7 21l3 -4" />',
    '<path d="M16 21l-2 -4l-3 -3l1 -6" />',
    '<path d="M6 12l2 -3l4 -1l3 3l3 1" />'
  ],
  bed: [
    '<path d="M5 9a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />',
    '<path d="M22 17v-3h-20" />',
    '<path d="M2 8v9" />',
    '<path d="M12 14h10v-2a3 3 0 0 0 -3 -3h-7v5" />'
  ],
  bath: [
    '<path d="M4 12h16a1 1 0 0 1 1 1v3a4 4 0 0 1 -4 4h-10a4 4 0 0 1 -4 -4v-3a1 1 0 0 1 1 -1" />',
    '<path d="M6 12v-7a2 2 0 0 1 2 -2h3v2.25" />',
    '<path d="M4 21l1 -1.5" />',
    '<path d="M20 21l-1 -1.5" />'
  ],
  food: ['<path d="M19 3v12h-5c-.023 -3.681 .184 -7.406 5 -12m0 12v6h-1v-3m-10 -14v17m-3 -17v3a3 3 0 1 0 6 0v-3" />']
};

function tablerIcon(name, cls='') {
  const paths = iconPaths[name] || iconPaths.pin;
  return `<svg class="plan-tabler-icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths.join('')}</svg>`;
}

function destinationIconFor(item) {
  const text = item.textContent || '';
  if (text.includes('自宅')) return 'home';
  if (text.includes('空港')) return 'plane';
  if (text.includes('レンタカー営業所')) return 'car';
  if (text.includes('宿泊')) return 'bed';
  if (text.includes('温泉')) return 'bath';
  if (text.includes('夕食') || text.includes('昼食')) return 'food';
  return 'pin';
}

function transferIconFor(item) {
  const text = item.textContent || '';
  if (text.includes('飛行機')) return 'plane';
  if (text.includes('電車')) return 'train';
  if (text.includes('徒歩')) return 'walk';
  if (text.includes('レンタカー') || text.includes('車＋登山アクセス')) return 'car';
  return 'pin';
}

function decoratePlanFlow(root=document) {
  root.querySelectorAll('.plan-axis .plan-axis-point > .flow-icon, .plan-axis .plan-axis-destination > .flow-icon').forEach(icon => {
    const item = icon.closest('.flow-item');
    if (!item || icon.dataset.semanticIcon === '1') return;
    icon.dataset.semanticIcon = '1';
    icon.innerHTML = tablerIcon(destinationIconFor(item), 'plan-destination-icon');
  });

  root.querySelectorAll('.plan-axis .plan-axis-transfer > .flow-icon').forEach(icon => {
    const item = icon.closest('.flow-item');
    if (!item || icon.dataset.semanticIcon === '1') return;
    icon.dataset.semanticIcon = '1';
    icon.innerHTML = tablerIcon(transferIconFor(item), 'plan-transfer-icon');
  });
}

function initPlanFlowIcons() {
  const app = document.querySelector('#app');
  if (!app) return;
  decoratePlanFlow(app);
  const observer = new MutationObserver(() => decoratePlanFlow(app));
  observer.observe(app, {childList:true, subtree:true});
}
