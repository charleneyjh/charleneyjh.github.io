// Dev-only comment overlay. Toggle comment mode, click an element, leave a note.
// Notes persist in localStorage under "annotations" and are mirrored on
// window.__annotations so they can be read back from the page.
(() => {
  const KEY = 'annotations';
  let notes = [];
  try { notes = JSON.parse(localStorage.getItem(KEY)) || []; } catch {}
  let active = false;
  let hovered = null;

  const root = document.createElement('div');
  root.id = 'annotate-root';
  const shadow = root.attachShadow({ mode: 'open' });
  shadow.innerHTML = `
    <style>
      :host { all: initial; font: 14px/1.4 ui-sans-serif, system-ui, sans-serif; }
      .toggle {
        position: fixed; right: 16px; bottom: 16px; z-index: 2147483647;
        padding: 10px 14px; border: 0; border-radius: 999px; cursor: pointer;
        background: #1f1d1a; color: #fff; font: inherit; font-weight: 600;
        box-shadow: 0 4px 16px rgba(0,0,0,.25);
      }
      .toggle.on { background: #2563eb; }
      /* Copies the notes as text, for pasting into chat from a browser Claude can't read */
      .copy {
        position: fixed; right: 16px; bottom: 64px; z-index: 2147483647;
        padding: 6px 12px; border: 1px solid #d4d4d4; border-radius: 999px; cursor: pointer;
        background: #fff; color: #1f1d1a; font: inherit; font-size: 12px; font-weight: 600;
        box-shadow: 0 2px 8px rgba(0,0,0,.15);
      }
      .outline {
        position: absolute; z-index: 2147483645; pointer-events: none;
        border: 2px solid #2563eb; background: rgba(37,99,235,.08); border-radius: 4px;
      }
      .pin {
        position: absolute; z-index: 2147483646; width: 24px; height: 24px;
        margin: -12px 0 0 -12px; border: 2px solid #fff; border-radius: 50%;
        background: #2563eb; color: #fff; font: inherit; font-size: 12px; font-weight: 700;
        cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,.3);
      }
      .box {
        position: absolute; z-index: 2147483647; width: 260px; padding: 10px;
        background: #fff; color: #1f1d1a; border: 1px solid #d4d4d4; border-radius: 10px;
        box-shadow: 0 8px 28px rgba(0,0,0,.22);
      }
      .box code { display: block; margin-bottom: 6px; color: #6b665e; font-size: 11px; word-break: break-all; }
      .box textarea {
        display: block; width: 100%; height: 70px; box-sizing: border-box; padding: 6px;
        border: 1px solid #d4d4d4; border-radius: 6px; font: inherit; resize: vertical;
      }
      .row { display: flex; gap: 6px; justify-content: flex-end; margin-top: 8px; }
      .row button {
        padding: 5px 10px; border: 1px solid #d4d4d4; border-radius: 6px;
        background: #fff; color: inherit; font: inherit; cursor: pointer;
      }
      .row .save { background: #2563eb; border-color: #2563eb; color: #fff; }
      .row .del { margin-right: auto; color: #b91c1c; }
    </style>
    <button class="toggle" type="button"></button>
    <button class="copy" type="button" hidden>Copy notes</button>
    <div class="outline" hidden></div>
    <div class="pins"></div>
  `;
  document.body.appendChild(root);

  const toggle = shadow.querySelector('.toggle');
  const copy = shadow.querySelector('.copy');
  const outline = shadow.querySelector('.outline');
  const pins = shadow.querySelector('.pins');
  let box = null;

  function selectorFor(el) {
    const parts = [];
    while (el && el !== document.body) {
      if (el.id) { parts.unshift('#' + CSS.escape(el.id)); break; }
      const tag = el.tagName.toLowerCase();
      const same = [...el.parentElement.children].filter(c => c.tagName === el.tagName);
      parts.unshift(same.length > 1 ? `${tag}:nth-of-type(${same.indexOf(el) + 1})` : tag);
      el = el.parentElement;
    }
    return parts.join(' > ');
  }

  function pageRect(el) {
    const r = el.getBoundingClientRect();
    return { left: r.left + scrollX, top: r.top + scrollY, width: r.width, height: r.height };
  }

  function save() {
    localStorage.setItem(KEY, JSON.stringify(notes));
    window.__annotations = notes;
    render();
  }

  function render() {
    toggle.textContent = (active ? 'Click an element…' : 'Comment') + (notes.length ? ` (${notes.length})` : '');
    toggle.classList.toggle('on', active);
    copy.hidden = !notes.length;
    pins.replaceChildren(...notes.map((n, i) => {
      const el = document.querySelector(n.selector);
      const pin = document.createElement('button');
      pin.className = 'pin';
      pin.textContent = i + 1;
      pin.title = n.comment;
      const r = el ? pageRect(el) : { left: 20, top: 20 + i * 28, width: 0 };
      pin.style.left = r.left + r.width + 'px';
      pin.style.top = r.top + 'px';
      pin.onclick = () => openBox(el, n);
      return pin;
    }));
  }

  function closeBox() { box?.remove(); box = null; }

  function openBox(el, note) {
    closeBox();
    const selector = note ? note.selector : selectorFor(el);
    const r = el ? pageRect(el) : { left: 20, top: 20, height: 0 };
    box = document.createElement('div');
    box.className = 'box';
    box.style.left = Math.max(8, Math.min(r.left, scrollX + innerWidth - 276)) + 'px';
    box.style.top = r.top + r.height + 8 + 'px';
    box.innerHTML = `
      <code></code>
      <textarea placeholder="What should change here?"></textarea>
      <div class="row">
        ${note ? '<button class="resolve" type="button">Resolve</button><button class="del" type="button">Delete</button>' : ''}
        <button class="cancel" type="button">Cancel</button>
        <button class="save" type="button">Save</button>
      </div>`;
    box.querySelector('code').textContent = selector;
    const ta = box.querySelector('textarea');
    ta.value = note ? note.comment : '';
    const commit = () => {
      const comment = ta.value.trim();
      if (!comment) return closeBox();
      if (note) note.comment = comment;
      else notes.push({
        id: Date.now(),
        selector,
        text: (el.innerText || '').trim().slice(0, 80),
        viewport: `${innerWidth}x${innerHeight}`,
        comment,
      });
      closeBox();
      save();
    };
    box.querySelector('.save').onclick = commit;
    box.querySelector('.cancel').onclick = closeBox;
    if (note) box.querySelector('.resolve').onclick = () => {
      let resolved = [];
      try { resolved = JSON.parse(localStorage.getItem('resolvedAnnotations')) || []; } catch {}
      resolved.push({ ...note, resolvedAt: new Date().toISOString() });
      localStorage.setItem('resolvedAnnotations', JSON.stringify(resolved));
      notes = notes.filter(n => n !== note);
      closeBox();
      save();
    };
    if (note) box.querySelector('.del').onclick = () => {
      notes = notes.filter(n => n !== note);
      closeBox();
      save();
    };
    ta.onkeydown = e => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) commit();
      if (e.key === 'Escape') closeBox();
    };
    shadow.appendChild(box);
    ta.focus();
  }

  function setActive(on) {
    active = on;
    hovered = null;
    outline.hidden = true;
    document.documentElement.style.cursor = on ? 'crosshair' : '';
    render();
  }

  toggle.onclick = () => setActive(!active);

  copy.onclick = async () => {
    const text = `Comments on ${location.href}\n\n` + notes.map((n, i) =>
      `${i + 1}. ${n.comment}\n   on: ${n.selector}\n   text: "${n.text}"\n   viewport: ${n.viewport}`).join('\n\n');
    let ok = false;
    try {
      await navigator.clipboard.writeText(text);
      ok = true;
    } catch {
      // Older fallback for when the clipboard API is unavailable.
      const area = Object.assign(document.createElement('textarea'), { value: text });
      document.body.appendChild(area);
      area.select();
      ok = document.execCommand('copy');
      area.remove();
    }
    copy.textContent = ok ? 'Copied: paste it in chat' : 'Copy failed';
    setTimeout(() => { copy.textContent = 'Copy notes'; }, 2500);
  };

  document.addEventListener('mousemove', e => {
    if (!active || e.target === root) { outline.hidden = true; return; }
    hovered = e.target;
    const r = pageRect(hovered);
    Object.assign(outline.style, {
      left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px',
    });
    outline.hidden = false;
  }, true);

  // Capture phase so the page's own click handlers don't fire while commenting.
  document.addEventListener('click', e => {
    if (!active || e.target === root) return;
    e.preventDefault();
    e.stopPropagation();
    const el = e.target;
    setActive(false);
    openBox(el);
  }, true);

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && active) setActive(false);
  });

  addEventListener('resize', render);
  window.__annotations = notes;
  window.__clearAnnotations = () => { notes = []; save(); };
  render();
})();
