// Normalize collapsible structure after page render.
// Headings contain only the interactive title; explanatory copy belongs to the body
// so it follows the section's open/closed state.

function normalizeCollapsibleDescriptions(root=document){
  root.querySelectorAll('.ui-collapsible').forEach(section=>{
    const heading=section.querySelector(':scope > .ui-collapsible-heading.section-heading');
    const body=section.querySelector(':scope > .ui-collapsible-body');
    if(!heading || !body || section.dataset.uiCollapsibleContent==='1') return;

    // section-heading may wrap its h2/p inside an inner div. Move any explanatory
    // paragraph found inside the interactive heading, regardless of nesting depth.
    const descriptions=[...heading.querySelectorAll('p')];
    if(!descriptions.length){
      section.dataset.uiCollapsibleContent='1';
      return;
    }

    // Preserve original paragraph order at the start of the collapsible body.
    [...descriptions].reverse().forEach(node=>{
      node.classList.add('ui-collapsible-description');
      body.insertBefore(node, body.firstChild);
    });

    section.dataset.uiCollapsibleContent='1';
  });
}

normalizeCollapsibleDescriptions();

export { normalizeCollapsibleDescriptions };
