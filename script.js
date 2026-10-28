// Nav: show a hairline once the page has scrolled.
const nav = document.getElementById('nav');
const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 8);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// Nav: highlight the link for the section currently in view.
const links = new Map(
  [...document.querySelectorAll('.nav__links a')].map(a => [a.getAttribute('href').slice(1), a])
);
const observer = new IntersectionObserver(entries => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    links.forEach((a, id) => a.classList.toggle('is-active', id === entry.target.id));
  }
}, { rootMargin: '-45% 0px -50% 0px' });
// Case study pages share this script but don't have these sections.
links.forEach((_, id) => {
  const section = document.getElementById(id);
  if (section) observer.observe(section);
});

// Clear the highlight when back at the top, above the first section.
window.addEventListener('scroll', () => {
  if (window.scrollY < 80) links.forEach(a => a.classList.remove('is-active'));
}, { passive: true });

// Hero: desk objects can be dragged around with a mouse on desktop layouts.
// The offset is stored in --dx/--dy, which styles.css adds to each object's transform.
const hero = document.querySelector('.hero');
const canDrag = window.matchMedia('(min-width: 760px) and (pointer: fine)');
let topLayer = 1;

document.querySelectorAll('.obj').forEach(obj => {
  let drag = null;

  obj.addEventListener('pointerdown', e => {
    if (!canDrag.matches || e.button !== 0) return;
    e.preventDefault();
    obj.setPointerCapture(e.pointerId);
    const dx = parseFloat(obj.style.getPropertyValue('--dx')) || 0;
    const dy = parseFloat(obj.style.getPropertyValue('--dy')) || 0;
    const box = obj.getBoundingClientRect();
    const bounds = hero.getBoundingClientRect();
    drag = {
      startX: e.clientX - dx,
      startY: e.clientY - dy,
      // How far the object may travel before it leaves the hero.
      minX: bounds.left - (box.left - dx), maxX: bounds.right - (box.right - dx),
      minY: bounds.top - (box.top - dy), maxY: bounds.bottom - (box.bottom - dy),
    };
    obj.style.zIndex = ++topLayer;
    obj.classList.add('is-dragging');
  });

  obj.addEventListener('pointermove', e => {
    if (!drag) return;
    const dx = Math.min(drag.maxX, Math.max(drag.minX, e.clientX - drag.startX));
    const dy = Math.min(drag.maxY, Math.max(drag.minY, e.clientY - drag.startY));
    obj.style.setProperty('--dx', dx + 'px');
    obj.style.setProperty('--dy', dy + 'px');
  });

  const drop = () => {
    drag = null;
    obj.classList.remove('is-dragging');
  };
  obj.addEventListener('pointerup', drop);
  obj.addEventListener('pointercancel', drop);
});

document.getElementById('year').textContent = new Date().getFullYear();

// Dev-only: the comment overlay never loads on the published site.
if (['localhost', '127.0.0.1'].includes(location.hostname)) {
  document.body.appendChild(Object.assign(document.createElement('script'), { src: '/dev/annotate.js?v=resolve1' }));
}

// Lightweight password gate for the external Unified Filters deck.
(() => {
  const link = document.querySelector('.work-filters > a');
  const dialog = document.getElementById('case-password');
  if (!link || !dialog) return;
  const input = document.getElementById('case-password-input');
  const error = document.getElementById('case-password-error');
  link.addEventListener('click', event => {
    event.preventDefault();
    input.value = '';
    error.textContent = '';
    dialog.showModal();
    input.focus();
  });
  document.getElementById('case-password-cancel').addEventListener('click', () => dialog.close());
  document.getElementById('case-password-form').addEventListener('submit', async event => {
    event.preventDefault();
    const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input.value));
    const hash = Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, '0')).join('');
    if (hash !== '6dea502e53d00cd5f9e702d23d5c005efcf6edea4df968681c9c6404aac91096') {
      error.textContent = 'Incorrect password. Please try again.';
      input.select();
      return;
    }
    dialog.close();
    window.location.assign(link.href);
  });
})();


(() => {
 const section=document.querySelector('#work'),rail=document.querySelector('.work-year');if(!section||!rail)return;
 const cards=[...section.querySelectorAll('.cards > li')],years=['2026','2024','2023','2023','2021','2019'],value=rail.querySelector('.work-year__value');let active=-1,queued=false;
 function update(){queued=false;const bounds=section.getBoundingClientRect();rail.style.opacity=bounds.top<innerHeight*.52&&bounds.bottom>innerHeight*.48?'1':'0';let next=0;cards.forEach((card,i)=>{if(card.getBoundingClientRect().top<innerHeight*.52)next=i});if(next!==active){const changed=years[next]!==years[active];active=next;value.textContent=years[next];rail.style.setProperty('--year-progress',((next+1)/cards.length*100)+'%');if(changed){value.classList.remove('is-changing');void value.offsetWidth;value.classList.add('is-changing')}}}
 addEventListener('scroll',()=>{if(!queued){queued=true;requestAnimationFrame(update)}},{passive:true});addEventListener('resize',update);update();
})();
