const qs = new URLSearchParams(location.search);
const type = qs.get('type');
const id = qs.get('id');

if (type === 'plan' && id) initExecutionDayHeader();

async function initExecutionDayHeader() {
  const panel = document.querySelector('#execution-mode-panel');
  if (!panel) return;

  let data;
  try {
    const response = await fetch(`./data/concrete-plans/${encodeURIComponent(id)}.json`, { cache: 'no-store' });
    if (!response.ok) return;
    data = await response.json();
  } catch {
    return;
  }

  const heading = panel.querySelector('.execution-days .section-heading h2');
  if (heading) heading.textContent = '実施計画';

  const days = Object.fromEntries((data.days || []).map(day => [Number(day.day), day]));

  panel.querySelectorAll('.execution-day').forEach(card => {
    const day = days[Number(card.dataset.day)];
    if (!day) return;

    const header = card.querySelector('.execution-day-header');
    const dayNo = header?.querySelector('.execution-day-no');
    if (!header || !dayNo) return;

    dayNo.classList.add('day-number');
    header.querySelector('.exec-day-date-inline')?.remove();
    header.querySelector('.exec-day-date-pill')?.remove();

    const dateLabel = formatDayDate(day.date, day.weekday);
    if (!dateLabel) return;

    const pill = document.createElement('div');
    pill.className = 'exec-day-date-pill day-date';
    pill.textContent = dateLabel;
    dayNo.after(pill);
  });
}

function formatDayDate(value, weekday) {
  const match = String(value || '').match(/^\d{4}-(\d{2})-(\d{2})$/);
  if (!match) return '';
  const month = Number(match[1]);
  const day = Number(match[2]);
  return `${month}/${day}${weekday ? ` ${weekday}` : ''}`;
}
