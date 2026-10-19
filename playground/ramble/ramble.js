// Ramble demo: a scripted simulation of the app's fn → talk → fn flow.
// The cat's behaviour follows the app's Sources/ListeningBar.swift.

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const now = () => performance.now() / 1000;
const $ = id => document.getElementById(id);

// ---------- What to say ----------
// Markup: {f:…} filler, {s:…} repeat, {c:…} taken back, {g:old>new} grammar fix, {t:…} smoothed by
// the tidy step. A trailing * marks a word said loudly (the cat goes wide-eyed).
const scenarios = [
  {
    id: 'plan',
    label: 'Weekly plan',
    said: "{f:Um,} {t:okay so} for the portfolio this week {s:I} I think I need to do three things. First, {f:uh,} finish the Ramble case study. Second, fix the hero spacing on mobile, it's {f:like,} really* tight. Third, send the link to my mentor on {c:Tuesday, no wait,} Wednesday. {t:Oh and,} {f:um,} I'm still not sure if the playground should go before the work section.",
    notes: {
      clean: `For the portfolio this week, I need to do three things:

1. Finish the Ramble case study.
2. Fix the hero spacing on mobile. It's really tight.
3. Send the link to my mentor on Wednesday.

I'm still not sure if the playground should go before the work section.`,
      organize: `# Portfolio plan for this week
## To finish
- Ramble case study
- Hero spacing on mobile, which is really tight
## To share
- Send the link to my mentor on Wednesday
## Still deciding
- Should the playground go before the work section?`,
      todos: `## Tasks
- [ ] Finish the Ramble case study
- [ ] Fix the hero spacing on mobile
- [ ] Send the link to my mentor on Wednesday
## Open questions
- Should the playground go before the work section?`,
    },
  },
  {
    id: 'email',
    label: 'Email reply',
    said: "Hi Sam, thanks for {s:the,} {f:um,} the update. {s:I} I looked at the filter designs yesterday and I {g:very>really} like the new chip layout. Can we, {f:like,} meet on Thursday to go through the {c:tree open questions? Sorry, the} three open questions? Thanks, Charlene.",
    notes: {
      clean: `Hi Sam,

Thanks for the update. I looked at the filter designs yesterday and I really like the new chip layout. Can we meet on Thursday to go through the three open questions?

Thanks,
Charlene`,
      organize: `# Filter designs follow-up
## Feedback
- Really like the new chip layout
## Next step
- Meet on Thursday to go through the three open questions`,
      todos: `## Tasks
- [ ] Meet Sam on Thursday to go through the three open questions
## Open questions
- The three open questions on the filter designs`,
    },
  },
];

const styles = [
  { id: 'clean', label: 'Clean' },
  { id: 'organize', label: 'Organize' },
  { id: 'todos', label: 'To-dos' },
];

const markTypes = { f: 'filler', s: 'repeat', c: 'back', g: 'grammar', t: 'smooth' };

// Splits a script into words, each with its mark type (or null) and loudness.
function parse(said) {
  const words = [];
  const re = /\{(\w):([^}]+)\}|(\S+)/g;
  let m;
  while ((m = re.exec(said))) {
    const type = m[1] ? markTypes[m[1]] : null;
    for (const raw of (m[2] || m[3]).split(' ')) {
      const loud = raw.endsWith('*');
      const [text, fix] = (loud ? raw.slice(0, -1) : raw).split('>');
      words.push({ text, fix, type, loud });
    }
  }
  return words;
}

// A tiny Markdown renderer for the tidied notes.
function render(md) {
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const html = [];
  let list = null, para = [];
  const flushPara = () => { if (para.length) html.push(`<p>${para.join('<br>')}</p>`); para = []; };
  const closeList = () => { if (list) html.push(`</${list}>`); list = null; };
  const openList = tag => { flushPara(); if (list !== tag) { closeList(); html.push(`<${tag}>`); list = tag; } };

  for (const line of md.split('\n')) {
    let m;
    if (!line.trim()) { flushPara(); closeList(); }
    else if ((m = line.match(/^## (.*)/))) { flushPara(); closeList(); html.push(`<h4>${esc(m[1])}</h4>`); }
    else if ((m = line.match(/^# (.*)/))) { flushPara(); closeList(); html.push(`<h3>${esc(m[1])}</h3>`); }
    else if ((m = line.match(/^- \[ \] (.*)/))) { openList('ul'); html.push(`<li class="todo">${esc(m[1])}</li>`); }
    else if ((m = line.match(/^- (.*)/))) { openList('ul'); html.push(`<li>${esc(m[1])}</li>`); }
    else if ((m = line.match(/^\d+\. (.*)/))) { openList('ol'); html.push(`<li>${esc(m[1])}</li>`); }
    else { closeList(); para.push(esc(line)); }
  }
  flushPara();
  closeList();
  return html.join('');
}

// ---------- Segmented controls ----------
let scenario = scenarios[0];
let style = 'clean';

function segmented(el, options, current, onPick) {
  el.replaceChildren(...options.map(o => {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('role', 'radio');
    b.setAttribute('aria-checked', String(o.id === current));
    b.textContent = o.label;
    b.addEventListener('click', () => {
      el.querySelectorAll('button').forEach(x => x.setAttribute('aria-checked', String(x === b)));
      onPick(o.id);
    });
    return b;
  }));
}

// ---------- Demo state ----------
const screen = document.querySelector('.screen');
const bar = $('bar'), pill = $('pill'), pillText = $('pill-text');
const fnKey = $('fn'), status = $('status');
const noteEl = $('note'), transcript = $('transcript');
const waveBars = [...$('wave').children];

let phase = 'idle'; // idle | recording | tidying | done
let words = [];
let spoken = 0;         // words said so far
let timers = [];
let doneAt = 0;
let hasNote = false;
let level = 0;          // simulated microphone level, 0–1

// Follows the rhythm of speech so the cat can react like a listener (as in the app).
const attention = {
  lastVoice: -100, wokeAt: -100, tiltLeft: false,
  boredAfter: 10, playFor: 2 * 2.8,
  get dozeAfter() { return this.boredAfter + this.playFor + 5; },
  reset(t) { this.lastVoice = t; this.wokeAt = -100; },
  hear(t) {
    if (t - this.lastVoice > this.dozeAfter) this.wokeAt = t;
    if (t - this.lastVoice > 0.5) this.tiltLeft = !this.tiltLeft;
    this.lastVoice = t;
  },
  speaking(t) { return t - this.lastVoice < 0.5; },
  dozing(t) { return t - this.lastVoice > this.dozeAfter; },
  startled(t) { return t - this.wokeAt < 0.6; },
};

const later = (ms, fn) => timers.push(setTimeout(fn, ms));
const clearTimers = () => { timers.forEach(clearTimeout); timers = []; };

function setStatus(text) { status.textContent = text; }

function showBar(mode, text = '') {
  bar.classList.add('is-up');
  pill.dataset.mode = mode;
  pillText.textContent = text;
  pill.classList.toggle('is-hidden', mode === 'none');
}

function hideBar() { bar.classList.remove('is-up'); }

function resetTranscript() {
  transcript.classList.remove('is-marked');
  transcript.innerHTML = '<span class="transcript__empty">Your words show up here as you talk.</span>';
}

function start() {
  clearTimers();
  phase = 'recording';
  words = parse(scenario.said);
  spoken = 0;
  transcript.replaceChildren();
  transcript.classList.remove('is-marked');
  screen.classList.add('is-recording');
  attention.reset(now());
  showBar('rec');
  fnKey.disabled = true;
  fnKey.classList.remove('is-ready');
  setStatus('Listening…');
  later(500, speakNext);
}

// Says the next word, then waits a beat that depends on punctuation.
function speakNext() {
  if (phase !== 'recording') return;
  const word = words[spoken++];
  const span = document.createElement('span');
  span.className = word.type ? `w m t-${word.type}` : 'w';
  span.textContent = word.text;
  if (word.fix) span.dataset.fix = word.fix;
  transcript.append(span, ' ');
  level = word.loud ? 0.85 : 0.35 + Math.random() * 0.25;
  attention.hear(now());

  if (spoken < words.length) {
    const end = /[.?!]$/.test(word.text) ? 950 : /,$/.test(word.text) ? 260 : 0;
    later(200 + word.text.length * 26 + end, speakNext);
  } else {
    later(700, () => {
      fnKey.disabled = false;
      fnKey.classList.add('is-ready');
      setStatus('Tap fn to finish. Or wait, and watch the cat.');
    });
  }
}

function finish() {
  clearTimers();
  phase = 'tidying';
  level = 0;
  screen.classList.remove('is-recording');
  fnKey.classList.remove('is-ready');
  fnKey.disabled = true;
  showBar('text', 'Grooming…');
  setStatus('Tidying on device…');

  // Colour what's being cleaned up, then strike it out one by one.
  transcript.classList.add('is-marked');
  transcript.querySelectorAll('.m').forEach((el, i) => later(450 + i * 90, () => {
    el.classList.add('is-gone');
    // A grammar fix shows the word it became.
    if (el.dataset.fix) el.insertAdjacentHTML('afterend', ` <span class="fix">${el.dataset.fix}</span>`);
  }));

  later(2000, () => {
    phase = 'done';
    doneAt = now();
    showBar('none');
    writeNote(true);
    setStatus('Typed into Notes and copied. Try another style, or tap fn again.');
    fnKey.disabled = false;
    later(1900, hideBar);
  });
}

function cancel() {
  if (phase !== 'recording') return;
  clearTimers();
  phase = 'idle';
  level = 0;
  screen.classList.remove('is-recording');
  hideBar();
  resetTranscript();
  fnKey.disabled = false;
  fnKey.classList.remove('is-ready');
  setStatus('Thrown away. Nothing was saved, copied or typed.');
}

// Types the tidied note into the window, block by block.
function writeNote(animate) {
  noteEl.innerHTML = render(scenario.notes[style]) + '<span class="caret" aria-hidden="true"></span>';
  if (animate) {
    [...noteEl.children].forEach((el, i) => {
      el.classList.add('typed');
      el.style.animationDelay = `${i * 70}ms`;
    });
  }
  noteEl.scrollTop = 0;
  hasNote = true;
}

function clearNote() {
  noteEl.innerHTML = '<span class="caret" aria-hidden="true"></span>';
  hasNote = false;
}

function pressFn() {
  if (fnKey.disabled) return;
  fnKey.classList.add('is-pressed');
  setTimeout(() => fnKey.classList.remove('is-pressed'), 120);
  if (phase === 'recording') finish();
  else start();
}

fnKey.addEventListener('click', pressFn);
$('cancel').addEventListener('click', cancel);

// Space taps fn while the demo is on screen (unless a control has focus).
let demoInView = false;
new IntersectionObserver(([e]) => { demoInView = e.isIntersecting; }).observe($('demo'));
document.addEventListener('keydown', e => {
  if (e.code !== 'Space' || !demoInView || e.repeat) return;
  if (e.target.closest('button, a, input, textarea, select')) return;
  e.preventDefault();
  pressFn();
});

segmented($('scenarios'), scenarios, scenario.id, id => {
  scenario = scenarios.find(s => s.id === id);
  if (phase === 'recording' || phase === 'tidying') return;
  clearNote();
  resetTranscript();
  setStatus('Tap fn to start talking.');
});

segmented($('styles'), styles, style, id => {
  style = id;
  if (hasNote && phase !== 'recording' && phase !== 'tidying') {
    writeNote(true);
    setStatus(`Redone as ${styles.find(s => s.id === id).label}.`);
  }
});

// ---------- Drawing the cat ----------
const SCALE = 3;
const catCtx = $('cat').getContext('2d');
const bubbleCtx = $('bubble').getContext('2d');

// Picks the cat's pose from the phase, the time and the rhythm of speech.
function barPose(t) {
  const pose = { eyes: 'open', ears: 'normal', tail: Math.floor(t * 2.5) % 2 ? 'swish' : 'up', nod: 0, tilt: 0 };
  let bob = Math.floor(t * 1.6) % 2 ? SCALE : 0;
  const blinking = t % 3.4 < 0.14;

  if (phase === 'recording') {
    const quiet = t - attention.lastVoice;
    const { boredAfter, playFor } = attention;
    if (attention.speaking(t)) {
      pose.ears = 'perked';
      pose.eyes = attention.startled(t) || level > 0.6 ? 'wide' : 'lookUp';
      pose.tail = 'up';
      bob = 0;
    } else if (quiet < 4) {
      pose.ears = attention.tiltLeft ? 'tiltLeft' : 'tiltRight';
      pose.tilt = attention.tiltLeft ? -1 : 1;
      pose.eyes = blinking ? 'blink' : 'open';
      pose.tail = Math.floor(t * 1.2) % 2 ? 'swish' : 'up';
    } else if (quiet < boredAfter || (quiet >= boredAfter + playFor && !attention.dozing(t))) {
      pose.eyes = blinking ? 'blink' : 'open';
      if (t % 4.9 < 0.3) pose.ears = 'twitch';
    } else if (!attention.dozing(t)) {
      Object.assign(pose, Cat.play(quiet - boredAfter), { ears: 'perked', nod: 1 });
      pose.tail = Math.floor(t * 4) % 2 ? 'swish' : 'up';
      bob = 0;
    } else {
      Object.assign(pose, { eyes: 'closed', ears: 'flat', nod: 1, tail: 'up' });
      bob = Math.floor(t * 0.7) % 2 ? SCALE : 0;
    }
  } else if (phase === 'tidying') {
    pose.eyes = 'closed';
    pose.tail = Math.floor(t * 1.2) % 2 ? 'swish' : 'up';
  } else if (phase === 'done') {
    pose.eyes = 'happy';
    pose.tail = Math.floor(t * 5) % 2 ? 'happyFlick' : 'happy';
    bob = 0;
  }
  return { pose, bob };
}

function drawGlyph(ctx, rows, x, y, scale, alpha = 1, color = '#fff') {
  ctx.save();
  ctx.globalAlpha = alpha;
  if (color === '#fff') {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 1;
  }
  ctx.fillStyle = color;
  rows.forEach((row, dy) => [...row].forEach((c, dx) => {
    if (c === 'k') ctx.fillRect(x + dx * scale, y + dy * scale, scale, scale);
  }));
  ctx.restore();
}

// "Z"s while dozing, "!" when startled awake, thinking dots while tidying.
function drawBubble(ctx, t, size) {
  ctx.clearRect(0, 0, size, size);
  if (phase === 'recording' && attention.startled(t)) {
    drawGlyph(ctx, Cat.glyphs.bang, 14, 16, 3);
  } else if (phase === 'recording' && attention.dozing(t)) {
    for (let i = 0; i < 2; i++) {
      const rise = (t * 0.5 + i * 0.5) % 1;
      const s = rise < 0.5 ? 2 : 3;
      drawGlyph(ctx, Cat.glyphs.z, 4 + rise * 12, size - 4 * s - rise * 26, s, 1 - rise);
    }
  } else if (phase === 'tidying') {
    const count = Math.floor(t * 3) % 4;
    for (let i = 0; i < 3; i++) {
      ctx.globalAlpha = i < count ? 1 : 0.2;
      ctx.fillStyle = Cat.palette.w;
      ctx.fillRect(4 + i * 7, size - 8, 4, 4);
    }
    ctx.globalAlpha = 1;
  }
}

function drawWave(t) {
  if (phase === 'recording' && !attention.speaking(t)) level *= 0.9;
  waveBars.forEach((bar, i) => {
    const wobble = 0.55 + 0.45 * Math.sin(t * 9 + i * 0.9);
    const center = 1 - Math.abs(i - 3) / 5;
    bar.style.height = `${3 + Math.min(1, level * wobble * center * 1.4) * 11}px`;
  });
}

function frame() {
  const t = now();
  if (bar.classList.contains('is-up') || phase !== 'idle') {
    const { pose, bob } = barPose(t);
    catCtx.save();
    catCtx.clearRect(0, 0, 144, 66);
    catCtx.translate(0, bob);
    Cat.draw(catCtx, SCALE, pose);
    catCtx.restore();
    drawBubble(bubbleCtx, t, 40);
    drawWave(t);
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// ---------- Meet the cat ----------
const catStates = [
  { label: 'Speaking', pose: () => ({ eyes: 'lookUp', ears: 'perked', tail: 'up' }) },
  { label: 'Pause: head tilt', pose: t => {
      const left = Math.floor(t / 2) % 2 === 0;
      return { eyes: t % 3.4 < 0.14 ? 'blink' : 'open', ears: left ? 'tiltLeft' : 'tiltRight', tilt: left ? -1 : 1,
               tail: Math.floor(t * 1.2) % 2 ? 'swish' : 'up' };
    } },
  { label: 'Loud', pose: () => ({ eyes: 'wide', ears: 'perked', tail: 'up' }) },
  { label: 'Bored: yarn', pose: t => ({ ...Cat.play(t), ears: 'perked', nod: 1, tail: Math.floor(t * 4) % 2 ? 'swish' : 'up' }) },
  { label: 'Dozing', glyph: 'z', pose: () => ({ eyes: 'closed', ears: 'flat', nod: 1, tail: 'up' }) },
  { label: 'Startled awake', glyph: 'bang', pose: () => ({ eyes: 'wide', ears: 'perked', tail: 'up' }) },
  { label: 'Grooming…', glyph: 'dots', pose: t => ({ eyes: 'closed', tail: Math.floor(t * 1.2) % 2 ? 'swish' : 'up' }) },
  { label: 'Done: happy tail', pose: t => ({ eyes: 'happy', tail: Math.floor(t * 5) % 2 ? 'happyFlick' : 'happy' }) },
];

const gallery = catStates.map(state => {
  const li = document.createElement('li');
  const canvas = document.createElement('canvas');
  canvas.width = 144;
  canvas.height = 66;
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', `The cat: ${state.label}`);
  const label = document.createElement('p');
  label.textContent = state.label;
  li.append(canvas, label);
  $('cats').append(li);
  return { state, ctx: canvas.getContext('2d') };
});

// Glyphs go in the empty columns right of the tail (grid columns 36+).
function drawGalleryGlyph(ctx, kind, t) {
  const x0 = 37 * SCALE;
  if (kind === 'bang') drawGlyph(ctx, Cat.glyphs.bang, x0 + 6, 6, 3, 1, Cat.palette.k);
  if (kind === 'z') {
    for (let i = 0; i < 2; i++) {
      const rise = (t * 0.5 + i * 0.5) % 1;
      const s = rise < 0.5 ? 2 : 3;
      drawGlyph(ctx, Cat.glyphs.z, x0 + rise * 12, 40 - rise * 26, s, 1 - rise, Cat.palette.k);
    }
  }
  if (kind === 'dots') {
    const count = Math.floor(t * 3) % 4;
    for (let i = 0; i < 3; i++) {
      ctx.globalAlpha = i < count ? 1 : 0.25;
      ctx.fillStyle = Cat.palette.k;
      ctx.fillRect(x0 + i * 7, 12, 4, 4);
    }
    ctx.globalAlpha = 1;
  }
}

let galleryInView = false;
new IntersectionObserver(([e]) => { galleryInView = e.isIntersecting; }).observe($('cats'));

function drawGallery(t) {
  gallery.forEach(({ state, ctx }) => {
    Cat.draw(ctx, SCALE, state.pose(t));
    if (state.glyph) drawGalleryGlyph(ctx, state.glyph, t);
  });
}

drawGallery(1.2);
if (!reduceMotion) {
  let last = 0;
  const loop = ms => {
    if (galleryInView && ms - last > 60) { drawGallery(ms / 1000); last = ms; }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}

$('year').textContent = new Date().getFullYear();
