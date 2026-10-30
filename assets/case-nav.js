// Case study side nav: highlight the section in view and show the rail after the intro.
// Exported pages can repeat an id across hidden layout variants, so each link targets the visible match.
(() => {
  const nav = document.querySelector('.case-nav');
  if (!nav) return;
  const links = [...nav.querySelectorAll('a')];
  const find = id => [...document.querySelectorAll(`[id="${id}"]`)].find(el => el.getClientRects().length);
  const target = n => find(links[n].getAttribute('href').slice(1));
  links.forEach((a, n) => a.addEventListener('click', e => {
    const t = target(n);
    if (!t) return;
    e.preventDefault();
    scrollTo({ top: t.getBoundingClientRect().top + scrollY - 48, behavior: 'smooth' });
    history.replaceState(null, '', a.getAttribute('href'));
  }));
  const update = () => {
    const y = innerHeight * 0.35;
    let i = 0;
    links.forEach((a, n) => { const t = target(n); if (t && t.getBoundingClientRect().top <= y) i = n; });
    links.forEach((a, n) => a.toggleAttribute('aria-current', n === i));
    nav.classList.toggle('is-shown', scrollY > 200);
    nav.classList.toggle('case-nav--on-dark', isDark());
  };
  // Switch to light labels when the rail sits over a dark band.
  const isDark = () => {
    const r = nav.getBoundingClientRect();
    const under = document.elementsFromPoint(r.left + 4, r.top + r.height / 2).find(el => !nav.contains(el));
    for (let el = under; el; el = el.parentElement) {
      const m = getComputedStyle(el).backgroundColor.match(/[\d.]+/g);
      if (m && (m.length < 4 || +m[3] > 0.5)) {
        nav.style.setProperty('--cn-surface', `rgb(${m[0]}, ${m[1]}, ${m[2]})`);
        return (0.299 * m[0] + 0.587 * m[1] + 0.114 * m[2]) < 110;
      }
    }
    return false;
  };
  addEventListener('scroll', update, { passive: true });
  update();
})();
