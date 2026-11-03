/* =========================================================================
   España 2021—2025 · motor de la presentación
   Navegación tipo slides + revelados al entrar + parallax + notas
   ========================================================================= */
(() => {
  'use strict';

  const slides = Array.from(document.querySelectorAll('.slide'));
  const total = slides.length;
  const rail = document.getElementById('rail');
  const pageEl = document.getElementById('page');
  const hudSection = document.getElementById('hudSection');
  const prog = document.getElementById('prog');
  const notes = document.getElementById('notes');
  const notesBody = document.getElementById('notesBody');

  const params = new URLSearchParams(location.search);
  const isStatic = params.has('static');
  if (isStatic) document.body.classList.add('static');

  let index = 0;
  let lock = false;

  /* ---------------------------------------------------------- navegación */
  const pad = (n) => String(n).padStart(2, '0');

  function buildRail() {
    slides.forEach((s, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', `Diapositiva ${i + 1}: ${s.dataset.section || ''}`);
      b.innerHTML = `<span>${pad(i + 1)} · ${(s.dataset.section || '').toUpperCase()}</span>`;
      b.addEventListener('click', () => go(i));
      rail.appendChild(b);
    });
  }

  function animateCounters(slide) {
    slide.querySelectorAll('[data-count]').forEach((el) => {
      if (el.dataset.done === '1') return;
      const target = parseFloat(el.dataset.count);
      const dec = parseInt(el.dataset.dec || '0', 10);
      const prefix = el.dataset.prefix || '';
      const suffix = el.dataset.suffix || '';
      const dur = 1100;
      const t0 = performance.now();
      el.dataset.done = '1';
      const fmt = (v) =>
        v.toFixed(dec).replace('.', ',') + suffix;
      if (isStatic) { el.textContent = prefix + fmt(target); return; }
      const tick = (t) => {
        const p = Math.min(1, (t - t0) / dur);
        const e = 1 - Math.pow(1 - p, 3);
        el.textContent = prefix + fmt(target * e);
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }

  function go(n, opts = {}) {
    const target = Math.max(0, Math.min(total - 1, n));
    if (target === index && !opts.force) return;

    slides.forEach((s, i) => {
      s.classList.remove('is-active', 'is-before');
      if (i < target) s.classList.add('is-before');
    });

    index = target;
    const slide = slides[index];
    slide.classList.add('is-active');

    document.body.dataset.theme = slide.classList.contains('dark') ? 'dark' : 'light';
    pageEl.textContent = pad(index + 1);
    hudSection.textContent = slide.dataset.section || '';
    prog.style.width = `${((index + 1) / total) * 100}%`;
    Array.from(rail.children).forEach((b, i) => b.classList.toggle('on', i === index));

    if (notes.classList.contains('open')) renderNotes();
    animateCounters(slide);
    markNav();
    history.replaceState(null, '', `#${index + 1}`);
  }

  const next = () => { if (lock) return; lock = true; go(index + 1); setTimeout(() => (lock = false), 760); };
  const prev = () => { if (lock) return; lock = true; go(index - 1); setTimeout(() => (lock = false), 760); };

  /* ---------------------------------------------------------- entradas */
  document.addEventListener('keydown', (e) => {
    const k = e.key;
    if (['ArrowRight', 'ArrowDown', 'PageDown', ' '].includes(k)) { e.preventDefault(); next(); }
    else if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(k)) { e.preventDefault(); prev(); }
    else if (k === 'Home') { e.preventDefault(); go(0); }
    else if (k === 'End') { e.preventDefault(); go(total - 1); }
    else if (k === 'n' || k === 'N') { toggleNotes(); }
    else if (k === 'f' || k === 'F') {
      if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
      else document.exitFullscreen?.();
    } else if (k === 'Escape') { notes.classList.remove('open'); }
  });

  let wheelAcc = 0, wheelTimer = null;
  window.addEventListener('wheel', (e) => {
    if (isStatic) return;
    e.preventDefault();
    if (lock) return;
    wheelAcc += e.deltaY;
    clearTimeout(wheelTimer);
    wheelTimer = setTimeout(() => (wheelAcc = 0), 180);
    if (Math.abs(wheelAcc) > 60) {
      wheelAcc > 0 ? next() : prev();
      wheelAcc = 0;
    }
  }, { passive: false });

  let touchY = null;
  window.addEventListener('touchstart', (e) => { touchY = e.touches[0].clientY; }, { passive: true });
  window.addEventListener('touchend', (e) => {
    if (touchY === null) return;
    const dy = touchY - e.changedTouches[0].clientY;
    if (Math.abs(dy) > 55) dy > 0 ? next() : prev();
    touchY = null;
  }, { passive: true });

  /* ---------------------------------------------------------- notas */
  function renderNotes() {
    const s = slides[index];
    notesBody.innerHTML = '';
    (s.dataset.notes || '').split('\n').forEach((p) => {
      if (!p.trim()) return;
      const el = document.createElement('p');
      el.textContent = p.trim();
      notesBody.appendChild(el);
    });
  }
  function toggleNotes() {
    notes.classList.toggle('open');
    if (notes.classList.contains('open')) renderNotes();
  }

  /* ------------------------------------------------------ nav y botones */
  function bindNav() {
    document.querySelectorAll('[data-go]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        go(parseInt(el.dataset.go, 10) - 1);
      });
    });
    const b = document.getElementById('btnNotes');
    if (b) b.addEventListener('click', toggleNotes);
  }

  function markNav() {
    document.querySelectorAll('.nav__links a').forEach((a) => {
      const f = parseInt(a.dataset.from || '0', 10);
      const t = parseInt(a.dataset.to || '0', 10);
      const n = index + 1;
      a.classList.toggle('on', n >= f && n <= t);
    });
  }

  /* ---------------------------------------------------------- parallax */
  let px = 0, py = 0, tx = 0, ty = 0, raf = null;
  function loop() {
    px += (tx - px) * 0.08;
    py += (ty - py) * 0.08;
    document.documentElement.style.setProperty('--mx', px.toFixed(3));
    document.documentElement.style.setProperty('--my', py.toFixed(3));
    if (Math.abs(tx - px) > 0.001 || Math.abs(ty - py) > 0.001) {
      raf = requestAnimationFrame(loop);
    } else { raf = null; }
  }
  window.addEventListener('pointermove', (e) => {
    tx = (e.clientX / window.innerWidth - 0.5) * 2;
    ty = (e.clientY / window.innerHeight - 0.5) * 2;
    document.documentElement.style.setProperty('--cx', e.clientX + 'px');
    document.documentElement.style.setProperty('--cy', e.clientY + 'px');
    if (!raf) raf = requestAnimationFrame(loop);
  }, { passive: true });

  /* ---------------------------------------------------------- medidas svg */
  function measureDraws() {
    document.querySelectorAll('path.draw').forEach((p) => {
      try {
        const len = p.getTotalLength();
        p.style.setProperty('--len', len.toFixed(1));
      } catch (_) { /* path sin geometría */ }
    });
  }

  /* ---------------------------------------------------------- arranque */
  buildRail();
  bindNav();
  measureDraws();
  window.addEventListener('resize', measureDraws);

  const fromHash = parseInt((location.hash || '').replace('#', ''), 10);
  const fromParam = parseInt(params.get('slide') || '0', 10);
  const start = fromParam ? fromParam - 1 : (fromHash ? fromHash - 1 : 0);

  // arranque sin animación de entrada para el primer slide
  document.body.classList.add('booting');
  go(start, { force: true });
  requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.remove('booting')));

  // precarga del resto de imágenes
  window.addEventListener('load', () => {
    document.querySelectorAll('img').forEach((img) => { img.decoding = 'async'; });
  });
})();
