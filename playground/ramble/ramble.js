// Ramble "Try it": tap Option, talk, tap Option again. The browser's speech recognition transcribes what you
// say into the mock Notes window, then Ramble's rule-based cleanup (ported from Cleanup.swift) tidies it.
// The cat follows the app's ListeningBar.swift, driven by the real microphone level.
(() => {
  const root = document.querySelector('.rb');
  if (!root) return;
  const $ = sel => root.querySelector(sel);
  const now = () => performance.now() / 1000;

  const screen = $('.rb-screen');
  const note = $('.rb-note');
  const bar = $('.rb-bar'), pill = $('.rb-pill'), pillText = $('.rb-pill__text');
  const fnKey = $('.rb-key'), status = $('.rb-status');
  const waveBars = [...root.querySelectorAll('.rb-pill__wave i')];
  const catCtx = $('.rb-cat').getContext('2d');
  const bubbleCtx = $('.rb-bubble').getContext('2d');

  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  // ---------- Cleanup rules (Cleanup.swift) ----------
  // Instant and remove-only, so they can never invent words.
  const rules = [
    // "like" as filler: set off by commas, or opening a sentence with a comma.
    [/,\s*like\s*,\s*/giu, ' '],
    [/(^|(?<=[.!?])\s+)like,\s*/giu, '$1'],
    [/,\s*like(?=[.!?])/giu, ''],
    // Hesitation sounds, with any punctuation that trails them.
    [/,?\s*(?<![\p{L}'])(?:u+m+|u+h+m*|e+r+m+|e+r+|a+h+|h+m+|m{2,}|mhm)(?![\p{L}'])[,…]*/giu, ' '],
    [/[嗯呃]+[，,。]?/gu, ''],
    // "you know" used as filler.
    [/,\s*you know(?=[,.!?])/giu, ''],
    [/(?<![\p{L}'])you know,\s*/giu, ''],
    // Stutters and repeats: "I I think" → "I think".
    [/(?<![\p{L}'])(\p{L}+)(?:[\s,]+\1)+(?![\p{L}'])/giu, '$1'],
    // Tidy the punctuation and spacing left behind.
    [/\s+([,.!?;:])/gu, '$1'],
    [/([,;:])(?:\s*[,;:])+/gu, '$1'],
    [/,\s*([.!?])/gu, '$1'],
    [/([.!?])(?:\s*\.)+/gu, '$1'],
    [/^[\s,.;:]+/gu, ''],
    [/[ \t]{2,}/gu, ' '],
  ];

  function cleanup(text) {
    let out = text;
    for (const [pattern, replacement] of rules) out = out.replace(pattern, replacement);
    out = out.trim();
    // Capitalise the first letter and each sentence start, and end with a full stop.
    out = out.replace(/(^|[.!?]\s+)(\p{Ll})/gu, (_, before, letter) => before + letter.toUpperCase());
    if (out && !/[.!?。！？]$/.test(out)) out += '.';
    return out;
  }

  // ---------- State ----------
  let phase = 'idle'; // idle | recording | tidying | done
  let recognition = null;
  let finalText = '', interimText = '';
  let mic = null; // { stream, ctx, analyser, data }
  let level = 0;
  let timers = [];
  let notes = []; // finished notes, newest last

  const later = (ms, fn) => timers.push(setTimeout(fn, ms));
  const clearTimers = () => { timers.forEach(clearTimeout); timers = []; };
  const setStatus = text => { status.textContent = text; };

  // Follows the rhythm of speech so the cat can react like a listener.
  const attention = {
    lastVoice: -100, wokeAt: -100, tiltLeft: false,
    boredAfter: 10, playFor: 3 * 2.8, // three full rounds of yarn, so it never stops mid-swat
    get dozeAfter() { return this.boredAfter + this.playFor + 5; },
    reset(t) { this.lastVoice = t; this.wokeAt = -100; },
    // Back to ordinary waiting (not playing, not dozing), gently: no startled "!".
    keepAwake(t) { this.lastVoice = Math.max(this.lastVoice, t - 4); this.wokeAt = -100; },
    hear(t) {
      if (t - this.lastVoice > this.dozeAfter) this.wokeAt = t;
      if (t - this.lastVoice > 0.5) this.tiltLeft = !this.tiltLeft;
      this.lastVoice = t;
    },
    speaking(t) { return t - this.lastVoice < 0.5; },
    dozing(t) { return t - this.lastVoice > this.dozeAfter; },
    startled(t) { return t - this.wokeAt < 0.6; },
  };

  // ---------- The note window ----------
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

  function renderNote({ live = false, typedLast = false } = {}) {
    const parts = notes.map((n, i) =>
      `<p${typedLast && i === notes.length - 1 ? ' class="rb-typed"' : ''}>${esc(n)}</p>`);
    if (live) {
      const said = esc(finalText) + (interimText ? `<span class="rb-interim">${esc(interimText)}</span>` : '');
      parts.push(`<p>${said}<span class="rb-caret" aria-hidden="true"></span></p>`);
    } else if (!notes.length) {
      parts.push('<p><span class="rb-hint">Tap ⌥ Option and start talking…</span><span class="rb-caret" aria-hidden="true"></span></p>');
    } else {
      parts.push('<p><span class="rb-caret" aria-hidden="true"></span></p>');
    }
    note.innerHTML = parts.join('');
    note.scrollTop = note.scrollHeight;
  }

  // ---------- The bar ----------
  function showBar(mode, text = '') {
    bar.classList.add('is-up');
    pill.dataset.mode = mode;
    pillText.textContent = text;
    pill.classList.toggle('is-hidden', mode === 'none');
  }
  const hideBar = () => bar.classList.remove('is-up');

  // ---------- Microphone level (for the cat and the wave bars) ----------
  async function openMic() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      ctx.createMediaStreamSource(stream).connect(analyser);
      mic = { stream, ctx, analyser, data: new Float32Array(analyser.fftSize) };
      return true;
    } catch (err) {
      return err;
    }
  }

  function closeMic() {
    if (!mic) return;
    mic.stream.getTracks().forEach(t => t.stop());
    mic.ctx.close();
    mic = null;
  }

  function readLevel(t) {
    if (!mic) { level *= 0.9; return; }
    mic.analyser.getFloatTimeDomainData(mic.data);
    let sum = 0;
    for (const v of mic.data) sum += v * v;
    const rms = Math.sqrt(sum / mic.data.length);
    level = Math.min(1, rms * 6);
    if (phase === 'recording' && level > 0.22) attention.hear(t);
  }

  // ---------- Recording ----------
  async function start() {
    clearTimers();
    finalText = '';
    interimText = '';
    fnKey.disabled = true;
    setStatus('Asking for your microphone…');

    const micResult = await openMic();
    if (micResult !== true) {
      fnKey.disabled = false;
      setStatus(micResult && micResult.name === 'NotAllowedError'
        ? 'Microphone access was blocked. Allow it in your browser\'s site settings, then tap Option again.'
        : 'Couldn\'t open a microphone on this device.');
      return;
    }

    recognition = new Recognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = navigator.language || 'en-US';
    recognition.onresult = e => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const text = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalText += (finalText && !/\s$/.test(finalText) ? ' ' : '') + text.trim();
        else interim += text;
      }
      interimText = interim ? (finalText ? ' ' : '') + interim.trim() : '';
      attention.hear(now());
      renderNote({ live: true });
    };
    recognition.onerror = e => {
      if (e.error === 'no-speech' || e.error === 'aborted') return;
      stopEverything();
      setStatus(e.error === 'not-allowed' || e.error === 'service-not-allowed'
        ? 'Speech recognition was blocked. Allow the microphone for this site, then tap Option again.'
        : 'Speech recognition isn\'t working in this browser window. Try Chrome or Safari.');
    };
    // Chrome ends a session after a long silence; keep listening until Option is tapped.
    recognition.onend = () => {
      if (phase === 'recording') {
        try { recognition.start(); } catch { /* already restarting */ }
      }
    };

    try {
      recognition.start();
    } catch {
      closeMic();
      fnKey.disabled = false;
      setStatus('Speech recognition couldn\'t start. Try again in a moment.');
      return;
    }

    phase = 'recording';
    screen.classList.add('is-recording');
    attention.reset(now());
    showBar('rec');
    renderNote({ live: true });
    fnKey.disabled = false;
    fnKey.classList.add('is-live');
    setStatus('Listening… tap Option again when you\'re done.');
  }

  function stopRecognition() {
    if (!recognition) return;
    recognition.onend = null;
    recognition.onresult = null;
    try { recognition.abort(); } catch { /* already stopped */ }
    recognition = null;
  }

  function stopEverything() {
    clearTimers();
    phase = 'idle';
    stopRecognition();
    closeMic();
    screen.classList.remove('is-recording');
    fnKey.classList.remove('is-live');
    fnKey.disabled = false;
    hideBar();
    renderNote();
  }

  function finish() {
    const said = (finalText + interimText).trim();
    stopRecognition();
    closeMic();
    screen.classList.remove('is-recording');
    fnKey.classList.remove('is-live');

    if (!said) {
      // Like the app: stay quiet when nothing was said.
      stopEverything();
      setStatus('Didn\'t catch anything. Tap Option and try again.');
      return;
    }

    phase = 'tidying';
    fnKey.disabled = true;
    showBar('text', 'Grooming…');
    setStatus('Tidying…');

    later(1100, () => {
      phase = 'done';
      notes.push(cleanup(said));
      renderNote({ typedLast: true });
      showBar('none');
      fnKey.disabled = false;
      setStatus('Done: filler words and repeats removed. Tap Option to add another note.');
      // A quick flick of the happy tail.
      later(700, () => { hideBar(); phase = 'idle'; });
    });
  }

  function cancel() {
    if (phase !== 'recording') return;
    stopEverything();
    setStatus('Thrown away. Nothing was saved.');
  }

  function pressFn() {
    if (fnKey.disabled) return;
    fnKey.classList.add('is-pressed');
    setTimeout(() => fnKey.classList.remove('is-pressed'), 120);
    if (phase === 'recording') finish();
    else if (phase === 'idle' || phase === 'done') start();
  }

  if (!Recognition || !navigator.mediaDevices) {
    fnKey.disabled = true;
    setStatus('This browser can\'t transcribe speech. Open the page in Chrome or Safari to try it.');
  } else {
    fnKey.addEventListener('click', pressFn);
    $('.rb-pill__cancel').addEventListener('click', cancel);

    // Tapping Option on its own (pressed and released with no other key) works like the on-screen
    // key while the demo is on screen. Option used with another key, or held down, is left alone.
    let inView = false;
    let optionDown = 0;
    new IntersectionObserver(([e]) => { inView = e.isIntersecting; }).observe(screen);
    document.addEventListener('keydown', e => {
      optionDown = e.key === 'Alt' && !e.repeat ? performance.now() : 0;
    });
    document.addEventListener('keyup', e => {
      if (e.key !== 'Alt' || !optionDown) return;
      const tapped = performance.now() - optionDown < 500;
      optionDown = 0;
      if (!tapped || !inView || e.target.closest('input, textarea, select, [contenteditable]')) return;
      e.preventDefault();
      pressFn();
    });
    window.addEventListener('blur', () => { optionDown = 0; });
  }
  renderNote();

  // ---------- Drawing the cat ----------
  const SCALE = 3;
  let hovering = false;
  const catBox = $('.rb-bar__cat');
  catBox.addEventListener('pointerenter', () => { hovering = true; });
  catBox.addEventListener('pointerleave', () => { hovering = false; });

  // Picks the cat's pose from the phase, the time and the rhythm of speech.
  function barPose(t) {
    const pose = { eyes: 'open', ears: 'normal', tail: Math.floor(t * 2.5) % 2 ? 'swish' : 'up', nod: 0, tilt: 0 };
    let bob = Math.floor(t * 1.6) % 2 ? SCALE : 0;
    const blinking = t % 3.4 < 0.14;

    if (phase === 'recording') {
      // The pointer over the cat brings it back from playing or dozing to ordinary waiting.
      if (hovering) attention.keepAwake(t);
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

  function drawGlyph(ctx, rows, x, y, scale, alpha = 1) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 1;
    ctx.fillStyle = '#fff';
    rows.forEach((row, dy) => [...row].forEach((c, dx) => {
      if (c === 'k') ctx.fillRect(x + dx * scale, y + dy * scale, scale, scale);
    }));
    ctx.restore();
  }

  // "Z"s while dozing, "!" when startled awake, thinking dots while tidying.
  function drawBubble(t) {
    const size = 40;
    bubbleCtx.clearRect(0, 0, size, size);
    if (phase === 'recording' && attention.startled(t)) {
      drawGlyph(bubbleCtx, Cat.glyphs.bang, 14, 16, 3);
    } else if (phase === 'recording' && attention.dozing(t)) {
      for (let i = 0; i < 2; i++) {
        const rise = (t * 0.5 + i * 0.5) % 1;
        const s = rise < 0.5 ? 2 : 3;
        drawGlyph(bubbleCtx, Cat.glyphs.z, 4 + rise * 12, size - 4 * s - rise * 26, s, 1 - rise);
      }
    } else if (phase === 'tidying') {
      const count = Math.floor(t * 3) % 4;
      for (let i = 0; i < 3; i++) {
        bubbleCtx.globalAlpha = i < count ? 1 : 0.2;
        bubbleCtx.fillStyle = Cat.palette.w;
        bubbleCtx.fillRect(4 + i * 7, size - 8, 4, 4);
      }
      bubbleCtx.globalAlpha = 1;
    }
  }

  function drawWave(t) {
    waveBars.forEach((b, i) => {
      const wobble = 0.55 + 0.45 * Math.sin(t * 9 + i * 0.9);
      const center = 1 - Math.abs(i - 3) / 5;
      b.style.height = `${3 + Math.min(1, level * wobble * center * 1.4) * 11}px`;
    });
  }

  function frame() {
    const t = now();
    if (phase !== 'idle' || bar.classList.contains('is-up')) {
      readLevel(t);
      const { pose, bob } = barPose(t);
      catCtx.save();
      catCtx.clearRect(0, 0, 144, 66);
      catCtx.translate(0, bob);
      Cat.draw(catCtx, SCALE, pose);
      catCtx.restore();
      drawBubble(t);
      drawWave(t);
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
