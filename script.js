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

// Name tag: on hover, the photo drifts slightly with the pointer.
const badge = document.querySelector('.badge__card');
const badgePhotos = document.querySelectorAll('.badge__photo');
if (badge && badgePhotos.length && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  badge.addEventListener('pointermove', e => {
    const r = badge.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    badgePhotos.forEach(p => {
      p.style.setProperty('--px', `${(-x * 14).toFixed(1)}px`);
      p.style.setProperty('--py', `${(-y * 14).toFixed(1)}px`);
    });
  });
  badge.addEventListener('pointerleave', () => {
    badgePhotos.forEach(p => {
      p.style.removeProperty('--px');
      p.style.removeProperty('--py');
    });
  });
}

document.getElementById('year').textContent = new Date().getFullYear();

// Dev-only: the comment overlay never loads on the published site.
if (['localhost', '127.0.0.1'].includes(location.hostname)) {
  document.body.appendChild(Object.assign(document.createElement('script'), { src: '/dev/annotate.js' }));
}
