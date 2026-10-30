
(() => {
  if (!new URLSearchParams(location.search).has('hero-preview')) return;
  const hero = document.querySelector('.hero');
  if (!hero) return;
  const css = document.createElement('link');
  css.rel = 'stylesheet'; css.href = 'hero-options.css'; document.head.append(css);
  const panel = document.createElement('div'); panel.className = 'hero-preview-controls';
  panel.innerHTML = `<fieldset><legend>Hero motion explorations</legend><button type="button" data-option="draw">03 · Doodle reveal</button><button type="button" data-option="sketch">04 · Margin notes</button><button type="button" data-option="collage">05 · Collected moments</button><button type="button" data-option="systems">06 · Finding clarity</button><button type="button" data-option="none">Still</button><button type="button" class="hero-preview-replay">Replay ↻</button></fieldset><p aria-live="polite"></p>`;
  hero.before(panel);
  const art = document.createElement('div'); art.className = 'hero-art'; art.setAttribute('aria-hidden','true');
  art.innerHTML = `<svg class="hero-art__drawing" viewBox="0 0 360 360" fill="none"><path class="art-orbit" pathLength="1" d="M69 278C-22 187 36 29 175 31C302 32 348 127 307 241C281 313 176 341 88 289"/><path class="art-arrow" pathLength="1" d="M36 273C7 290 19 329 80 325M70 316L83 325L71 334"/><path class="art-flow" pathLength="1" d="M12 78C83 78 40 170 106 170M12 170H106M12 262C83 262 40 170 106 170M253 170H344"/><circle class="art-node" cx="12" cy="78" r="5"/><circle class="art-node" cx="12" cy="170" r="5"/><circle class="art-node" cx="12" cy="262" r="5"/><path class="art-spark" pathLength="1" d="M306 35L312 52L330 57L312 63L306 81L300 63L282 57L300 52Z"/></svg><span class="hero-art__note">a little curiosity goes a long way</span><span class="hero-art__caption">CHARLENE, OUTSIDE THE GRID ↗</span><span class="hero-art__tape"></span><span class="hero-art__index">FIG. 01 — A HUMAN IN THE SYSTEM</span>`;
  hero.querySelector('.hero__portrait').append(art);
  const line = document.createElementNS('http://www.w3.org/2000/svg','svg');
  line.setAttribute('viewBox','0 0 560 18'); line.setAttribute('preserveAspectRatio','none'); line.setAttribute('aria-hidden','true'); line.classList.add('hero-title-line');
  line.innerHTML = '<path pathLength="1" d="M3 11C112 0 302 4 552 7M24 16C201 9 395 15 523 12"/>';
  hero.querySelector('h1').append(line);
  const descriptions = {
    entrance: 'A staggered entrance for the headline, description, and portrait. Plays once and settles.',
    float: 'A slow, subtle portrait float with a shifting outline and gently turning doodle. Loops while the hero is visible.',
    draw: 'Doodle strokes draw on as the portrait and headline appear. Plays once and settles.',
    sketch: 'Margin notes · A hand-drawn orbit traces the portrait, the headline gets a pencil underline, and a quiet note appears in the margin.',
    collage: 'Collected moments · A photographic paper scrap lands on the page, followed by tape and a small editorial caption.',
    systems: 'Finding clarity · Three loose signals converge into a single portrait. A small visual metaphor for turning complexity into clarity.',
    none: 'The current composition, with no animation.' 
  };
  let selected = 'sketch';
  function play(option) {
    selected = option;
    hero.removeAttribute('data-motion');
    void hero.offsetWidth;
    hero.dataset.motion = option;
    panel.querySelectorAll('[data-option]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.option === option)));
    panel.querySelector('p').textContent = descriptions[option];
  }
  panel.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (button) play(button.dataset.option || selected);
  });
  new IntersectionObserver(entries => {
    hero.querySelectorAll('*').forEach(element => { element.style.animationPlayState = entries[0].isIntersecting ? 'running' : 'paused'; });
  }).observe(hero);
  css.addEventListener('load', () => play(selected));
})();
