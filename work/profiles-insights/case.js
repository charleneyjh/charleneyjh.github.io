// Case study page: highlight the chapter being read, and drive the before/after slider.

// Chapter list: mark the link for the chapter nearest the top of the screen.
const tocLinks = [...document.querySelectorAll('.toc a')];
const chapters = tocLinks.map(a => document.querySelector(a.getAttribute('href')));
const chapterObserver = new IntersectionObserver(entries => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    tocLinks.forEach(a => a.classList.toggle('is-current', a.getAttribute('href') === `#${entry.target.id}`));
  }
}, { rootMargin: '-30% 0px -65% 0px' });
chapters.forEach(c => c && chapterObserver.observe(c));

// Before/after: the range input sets how much of the "after" image is revealed.
document.querySelectorAll('.compare').forEach(compare => {
  const input = compare.querySelector('input[type="range"]');
  const frame = compare.querySelector('.compare__frame');
  const set = value => compare.style.setProperty('--pos', `${value}%`);
  input.addEventListener('input', () => set(input.value));

  // Dragging directly on the images works too.
  let dragging = false;
  const fromPointer = e => {
    const r = frame.getBoundingClientRect();
    const value = Math.round(Math.min(100, Math.max(0, ((e.clientX - r.left) / r.width) * 100)));
    input.value = value;
    set(value);
  };
  frame.addEventListener('pointerdown', e => { dragging = true; frame.setPointerCapture(e.pointerId); fromPointer(e); });
  frame.addEventListener('pointermove', e => { if (dragging) fromPointer(e); });
  frame.addEventListener('pointerup', () => { dragging = false; });
  frame.addEventListener('pointercancel', () => { dragging = false; });
});
