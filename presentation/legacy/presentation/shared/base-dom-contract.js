// Canonical Presentation DOM normalization.
// Base renderer may emit legacy classes; Presentation normalizes semantics before page-specific enhancement.
// No observers: call explicitly at deterministic points in the Normal Path.

export function normalizeBaseDom(root=document){
  root.querySelectorAll('.hero').forEach(node=>node.classList.add('ui-entity-hero'));
  root.querySelectorAll('.spot-demo-hero').forEach(node=>node.classList.add('ui-entity-hero','is-spot-hero'));
  root.querySelectorAll('.spot-demo-hero-copy').forEach(node=>node.classList.add('ui-entity-hero-copy'));

  root.querySelectorAll('.section').forEach(node=>node.classList.add('ui-section'));
  root.querySelectorAll('.card').forEach(node=>node.classList.add('ui-card'));

  root.querySelectorAll('.badge').forEach(node=>{
    node.classList.add('ui-badge');
    if(node.classList.contains('subtle')) node.classList.add('is-subtle');
  });

  root.querySelectorAll('.ui-entity-hero > .summary, .ui-entity-hero > p.summary, .spot-demo-summary').forEach(node=>node.classList.add('ui-hero-copy'));

  return root;
}
