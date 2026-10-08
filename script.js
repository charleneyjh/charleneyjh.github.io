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
links.forEach((_, id) => observer.observe(document.getElementById(id)));

// Clear the highlight when back at the top, above the first section.
window.addEventListener('scroll', () => {
  if (window.scrollY < 80) links.forEach(a => a.classList.remove('is-active'));
}, { passive: true });

document.getElementById('year').textContent = new Date().getFullYear();

// Dev-only: the comment overlay never loads on the published site.
if (['localhost', '127.0.0.1'].includes(location.hostname)) {
  document.body.appendChild(Object.assign(document.createElement('script'), { src: 'dev/annotate.js' }));
}
