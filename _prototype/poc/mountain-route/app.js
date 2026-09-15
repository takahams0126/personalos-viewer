const DATA_URL = './data/jomonsugi-yamap-model.json';

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function metric(label, value) {
  const wrap = el('div', 'metric');
  wrap.append(el('div', 'metric-label', label), el('div', 'metric-value', value));
  return wrap;
}

function render(data) {
  const source = document.getElementById('source');
  source.innerHTML = '';
  const head = el('div', 'section-head');
  const left = el('div');
  left.append(el('div', 'eyebrow', 'Resolved source'), el('h2', '', data.resolution.title));
  const link = el('a', 'source-link', 'YAMAP公開モデルコースを開く');
  link.href = data.resolution.url;
  link.target = '_blank';
  link.rel = 'noreferrer';
  head.append(left, link);
  source.append(head);

  const sourceMetrics = el('div', 'metrics');
  sourceMetrics.append(
    metric('標準時間', data.source_metrics.standard_duration_label),
    metric('距離', `${data.source_metrics.distance_km} km`),
    metric('上り', `${data.source_metrics.ascent_m.toLocaleString()} m`),
    metric('下り', `${data.source_metrics.descent_m.toLocaleString()} m`)
  );
  source.append(sourceMetrics);

  const concept = document.getElementById('concept');
  concept.innerHTML = '';
  const conceptual = [
    '小杉谷集落跡',
    'ウィルソン株',
    '大王杉',
    '縄文杉'
  ];
  conceptual.forEach(name => concept.append(el('li', '', name)));

  const metrics = document.getElementById('metrics');
  metrics.innerHTML = '';
  metrics.append(
    metric('仮開始', data.poc_execution.assumed_start_time),
    metric('終了見込', data.poc_execution.expected_end_time),
    metric('Waypoints', String(data.poc_execution.waypoints.length)),
    metric('基準', 'YAMAP標準タイム')
  );

  const timeline = document.getElementById('timeline');
  timeline.innerHTML = '';
  data.poc_execution.waypoints.forEach((wp) => {
    const row = el('div', `timeline-row ${wp.kind === 'major_spot' || wp.kind === 'turnaround' ? 'major' : ''}`);
    const time = el('div', 'time', wp.time);
    const marker = el('div', `marker ${wp.direction}`);
    const body = el('div', 'timeline-body');
    const top = el('div', 'timeline-title', wp.label);
    const meta = el('div', 'timeline-meta', `${wp.direction} · +${wp.elapsed_min}分`);
    body.append(top, meta);
    row.append(time, marker, body);
    timeline.append(row);
  });

  const notes = document.getElementById('notes');
  notes.innerHTML = '';
  data.prototype_notes.forEach(note => notes.append(el('li', '', note)));
}

fetch(DATA_URL)
  .then(r => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  })
  .then(render)
  .catch(err => {
    document.body.innerHTML = `<pre>PoC data load failed: ${String(err)}</pre>`;
  });
