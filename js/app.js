/* Arco Motion — site de lançamento (protótipo)
   Tudo aqui é demonstrativo: estudos de movimento feitos em SVG.
   Nada é enviado, guardado ou medido (sem cookies, storage ou analytics). */
(function () {
  'use strict';

  const SC = window.ARCO_SCENES;
  const NS = 'http://www.w3.org/2000/svg';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) document.documentElement.classList.add('reduce');

  /* Quando existirem gravações reais, informe o arquivo aqui. Ex.:
     hero: { src: 'midia/hero.mp4', poster: 'midia/hero.jpg' }
     Com um arquivo informado, o player passa a tocar o vídeo no lugar do estudo. */
  const MIDIA_REAL = { hero: null, tutorial: null };

  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.prototype.slice.call((r || document).querySelectorAll(s));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const r1 = (n) => Math.round(n * 10) / 10;
  const easeIO = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const easeS = (t) => -(Math.cos(Math.PI * t) - 1) / 2;
  const smooth = (u, a, b) => { const t = clamp((u - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const parseAspect = (s) => { const p = String(s).split('/'); return p.length === 2 ? (+p[0]) / (+p[1]) : +s; };
  const ICON = {
    play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l13-7.5z"/></svg>',
    pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>',
    replay: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5V1L7 6l5 5V7a6 6 0 1 1-6 6H4a8 8 0 1 0 8-8z"/></svg>'
  };

  /* ---------------- movimentos (estudos) ---------------- */
  const CAM = [[340, 700, 260], [540, 440, 260], [860, 320, 260], [1170, 470, 260], [1320, 700, 260]];
  const TUT = [[420, 640, 380], [860, 400, 360], [1220, 560, 360]];
  /* Movimento exportado do Arco Motion (JSON do Roberto). frames: [nx,ny,nw,nh,rot,pausa,freioChegada,freioSaida]; segs: [duração,outDx,outDy,inDx,inDy] */
  const FOTO_JSON = { aspect: 1.8423645320197044, frames: [[0.1403, 0.017, 0.8607, 0.8919, 0, 0, 78, 78], [0.1649, 0.137, 0.2471, 0.2561, 0, 0, 78, 78], [0.5549, 0.0251, 0.3961, 0.4105, 5, 0, 89, 88], [0.6055, 0.2967, 0.3519, 0.3646, 7.6, 0, 78, 78], [0.5871, 0.5252, 0.284, 0.2943, 0, 2.3000000000000003, 100, 78], [0.5539, 0.5146, 0.3206, 0.3322, 5.775417728018939, 0, 100, 78]], segs: [[6.3, 0, 0, -0.0218, 0.1817], [6.4, 0.1403, -0.0322, -0.0597, -0.1076], [2.1, 0.0251, 0.0509, 0.0114, -0.1063], [3.3, -0.0114, 0.1063, 0.0224, -0.0348], [2, -0.003, 0.0046, 0.0038, 0.0014]], closeDur: 5 };
  function jsonMotion(J) {
    const W = 1600, H = W / J.aspect, Y0 = (1000 - H) / 2, n = J.frames.length;
    const rect = (f) => ({ cx: (f[0] + f[2] / 2) * W, cy: Y0 + (f[1] + f[3] / 2) * H, h: f[3] * H, rot: f[4] });
    const segs = [], T = [];
    let t = 0;
    for (let i = 0; i < n; i++) {
      const a = rect(J.frames[i]), b = rect(J.frames[(i + 1) % n]), s = J.segs[i];
      const o = s || [J.closeDur, 0, 0, 0, 0];
      const dep = J.frames[i][7], arr = J.frames[(i + 1) % n][6];
      segs.push({ a: a, b: b, d: o[0], o: [o[1] * W, o[2] * H], i: [o[3] * W, o[4] * H], k: Math.min(1, (dep + arr) / 200) });
      T.push([t, t + o[0]]); t += o[0];
      const p = J.frames[(i + 1) % n][5];
      if (p && i < n - 1) { T.push([t, t + p, 1]); t += p; }
    }
    const total = t;
    const rd = (k) => (k < .5 ? 0 : 0) + k * k * k * (k * (k * 6 - 15) + 10);
    const fn = (u) => {
      const tt = clamp(u, 0, 1) * total;
      let si = 0, acc = 0;
      for (let i = 0; i < segs.length; i++) {
        const pause = J.frames[(i + 1) % n][5] && i < n - 1 ? J.frames[(i + 1) % n][5] : 0;
        if (tt <= acc + segs[i].d || i === segs.length - 1) { si = i; break; }
        if (tt <= acc + segs[i].d + pause) return [segs[i].b.cx, segs[i].b.cy, segs[i].b.h, segs[i].b.rot];
        acc += segs[i].d + pause;
      }
      const s = segs[si], x = clamp((tt - acc) / s.d, 0, 1), e = x + s.k * (rd(x) - x), m = 1 - e;
      const x0 = s.a.cx, y0 = s.a.cy, x3 = s.b.cx, y3 = s.b.cy, x1 = x0 + s.o[0], y1 = y0 + s.o[1], x2 = x3 + s.i[0], y2 = y3 + s.i[1];
      const c0 = m * m * m, c1 = 3 * m * m * e, c2 = 3 * m * e * e, c3 = e * e * e;
      const sm = rd(x);
      return [c0 * x0 + c1 * x1 + c2 * x2 + c3 * x3, c0 * y0 + c1 * y1 + c2 * y2 + c3 * y3, s.a.h + (s.b.h - s.a.h) * sm, s.a.rot + (s.b.rot - s.a.rot) * sm];
    };
    return { scene: 'foto2', fn: fn, dur: total * 1000, pu: 0 };
  }
  const MOT = {
    hero: { scene: 'paisagem', mode: 'curve', dur: 15000, kf: [[800, 500, 900], [470, 640, 520], [800, 570, 700], [1150, 380, 430], [800, 500, 900]] },
    tutorial: { scene: 'caminho', mode: 'curve', dur: 10000, kf: TUT },
    zoom: { scene: 'paisagem', mode: 'curve', dur: 7000, kf: [[800, 500, 1000], [800, 500, 1000], [1150, 380, 330], [1150, 380, 330], [800, 500, 1000]] },
    kenburns: { scene: 'escada', mode: 'ease', hold: .4, dur: 18000, kf: [[800, 500, 520], [990, 410, 300], [520, 730, 330], [700, 270, 300]] },
    parallax: { scene: 'paisagem', mode: 'curve', dur: 12000, kf: [[480, 620, 560], [900, 480, 600], [1190, 400, 480], [480, 620, 560]] },
    hand: { scene: 'caminho', mode: 'curve', wobble: 14, dur: 15000, kf: CAM },
    vector: { scene: 'caminho', mode: 'curve', wobble: 0, dur: 15000, kf: CAM },
    t_text: { scene: 'paisagem_txt', mode: 'curve', dur: 8000, pu: .5, kf: [[260, 600, 620], [700, 560, 600], [1080, 520, 600]] },
    t_shapes: { scene: 'paisagem', mode: 'curve', dur: 8000, pu: .86, kf: [[800, 500, 820], [800, 500, 812]] },
    t_gif: { scene: 'paisagem', mode: 'curve', dur: 8000, pu: .2, kf: [[900, 480, 700], [800, 500, 640]] },
    dir: { scene: 'paisagem', mode: 'curve', dur: 14000, pu: .6, kf: [[800, 500, 820], [800, 500, 812]] },
    clip: { scene: 'mar', mode: 'curve', dur: 4500, pu: .5, kf: [[800, 500, 900], [800, 500, 900]] },
    formats: { scene: 'paisagem', mode: 'curve', dur: 14000, kf: [[800, 500, 900], [1150, 400, 520], [600, 640, 520], [800, 500, 900]] },
    tzoomin: { scene: 'mar', mode: 'curve', dur: 7000, kf: [[800, 500, 900], [1150, 620, 330]] },
    tzoomout: { scene: 'cidade', mode: 'curve', dur: 7000, kf: [[1250, 240, 280], [800, 500, 900]] },
    tperc: { scene: 'escada', mode: 'curve', dur: 9000, kf: [[300, 860, 420], [650, 650, 420], [1000, 430, 420], [1060, 300, 380]] },
    tpan: { scene: 'cartaz', mode: 'curve', dur: 8000, kf: [[560, 500, 560], [1040, 500, 560]] },
    c1: { scene: 'raposa', mode: 'curve', dur: 8000, kf: [[900, 470, 760], [900, 470, 560], [900, 470, 760]] },
    c2: { scene: 'cidade', mode: 'curve', dur: 8000, kf: [[480, 470, 700], [1120, 470, 700]] },
    c3: { scene: 'mar', mode: 'curve', dur: 8000, kf: [[420, 360, 760], [760, 520, 520], [1220, 600, 380]] },
    c4: { scene: 'paisagem', mode: 'curve', dur: 8000, kf: [[420, 480, 700], [1100, 480, 700]] },
    c5: { scene: 'escada', mode: 'curve', dur: 8000, kf: [[400, 760, 600], [1040, 430, 420]] },
    c6: { scene: 'cartaz', mode: 'curve', dur: 8000, kf: [[800, 500, 900], [520, 430, 330]] },
    ia: { scene: 'baloes', mode: 'curve', dur: 12000, kf: [[800, 500, 900], [520, 400, 440], [1250, 520, 380]] },
    x_infantil: { scene: 'raposa', mode: 'curve', dur: 14000, kf: [[800, 520, 900], [1060, 250, 420], [900, 570, 400], [800, 520, 900]] },
    x_paisagem: { scene: 'paisagem', mode: 'ease', hold: .3, dur: 16000, kf: [[800, 500, 900], [1150, 380, 420], [500, 640, 380], [800, 500, 900]] },
    x_editorial: { scene: 'escada', mode: 'curve', dur: 14000, kf: [[800, 500, 900], [900, 330, 420], [600, 720, 420], [800, 500, 900]] },
    x_cartaz: { scene: 'cartaz', mode: 'curve', dur: 12000, kf: [[800, 500, 900], [520, 430, 380], [1200, 420, 420], [800, 500, 900]] },
    x_arq: { scene: 'arq', mode: 'curve', dur: 14000, kf: [[800, 560, 900], [520, 630, 380], [800, 340, 360], [1230, 640, 480], [800, 560, 900]] },
    xi2: { scene: 'mar', mode: 'curve', dur: 13000, kf: [[800, 500, 900], [1150, 620, 380], [420, 300, 520], [800, 500, 900]] },
    xi3: { scene: 'cidade', mode: 'curve', dur: 12000, kf: [[800, 500, 900], [520, 700, 440], [1250, 240, 330], [800, 500, 900]] },
    xp2: { scene: 'paisagem', mode: 'curve', dur: 12000, kf: [[800, 500, 900], [1150, 380, 400], [1000, 520, 700], [800, 500, 900]] },
    xp3: { scene: 'paisagem', mode: 'curve', dur: 12000, kf: [[500, 640, 380], [820, 560, 600], [1150, 380, 420]] },
    xe2: { scene: 'escada', mode: 'curve', dur: 12000, kf: [[1000, 300, 380], [900, 500, 600], [800, 500, 900]] },
    xe3: { scene: 'raposa', mode: 'curve', dur: 12000, kf: [[300, 240, 300], [700, 400, 560], [900, 500, 560]] },
    xc2: { scene: 'cartaz', mode: 'curve', dur: 11000, kf: [[1250, 300, 420], [900, 640, 500], [520, 430, 380]] },
    xc3: { scene: 'cartaz', mode: 'curve', dur: 10000, kf: [[300, 500, 560], [800, 500, 560], [1300, 500, 560]] },
    xa2: { scene: 'arq', mode: 'curve', dur: 12000, kf: [[800, 540, 900], [1190, 700, 420], [700, 920, 320]] },
    x_tut: { scene: 'caminho', mode: 'curve', dur: 15000, kf: [[800, 500, 900], [340, 700, 380], [540, 440, 340], [860, 320, 340], [1170, 470, 340], [800, 500, 900]] },
    xt2: { scene: 'baloes', mode: 'curve', dur: 13000, kf: [[800, 500, 900], [500, 400, 440], [1000, 330, 380], [1250, 520, 360], [800, 500, 900]] },
    xt3: { scene: 'mar', mode: 'curve', dur: 13000, kf: [[800, 500, 900], [1050, 640, 420], [1250, 620, 380], [800, 500, 900]] },
    x_foto: jsonMotion(FOTO_JSON),
    xa3: { scene: 'arq', mode: 'curve', dur: 12000, kf: [[470, 640, 360], [700, 680, 380], [885, 640, 360]] }
  };

  function catmull(a, b, c, d, t) {
    const t2 = t * t, t3 = t2 * t;
    return .5 * ((2 * b) + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
  }
  const PATHS = {};
  function buildPath(m) {
    if (m._p) return m._p;
    const kf = m.kf, n = kf.length - 1, N = 720, out = new Float32Array(N * 3);
    const mode = m.mode || 'curve', hold = m.hold || 0, wob = m.wobble || 0;
    const pt = (i) => kf[clamp(i, 0, n)];
    for (let k = 0; k < N; k++) {
      const u = k / (N - 1);
      let cx, cy, ls;
      if (mode === 'ease') {
        const pos = Math.min(u * (n + hold), n);
        const i = Math.min(Math.floor(pos), n - 1);
        let f = pos - i;
        f = f < hold ? 0 : (f - hold) / (1 - hold);
        f = easeIO(f);
        const a = pt(i), b = pt(i + 1);
        cx = a[0] + (b[0] - a[0]) * f; cy = a[1] + (b[1] - a[1]) * f;
        ls = Math.log(a[2]) + (Math.log(b[2]) - Math.log(a[2])) * f;
      } else {
        const pos = easeS(u) * n;
        const i = Math.min(Math.floor(pos), n - 1), f = pos - i;
        const p0 = pt(i - 1), p1 = pt(i), p2 = pt(i + 1), p3 = pt(i + 2);
        cx = catmull(p0[0], p1[0], p2[0], p3[0], f);
        cy = catmull(p0[1], p1[1], p2[1], p3[1], f);
        ls = catmull(Math.log(p0[2]), Math.log(p1[2]), Math.log(p2[2]), Math.log(p3[2]), f);
      }
      if (wob) {
        const env = Math.sqrt(Math.sin(Math.PI * u));
        cx += wob * env * (Math.sin(u * 28) * .6 + Math.sin(u * 61 + 1.3) * .4);
        cy += wob * env * (Math.cos(u * 24) * .6 + Math.sin(u * 47 + .7) * .4);
      }
      out[k * 3] = cx; out[k * 3 + 1] = cy; out[k * 3 + 2] = Math.exp(ls);
    }
    m._p = out;
    return out;
  }
  function sample(path, u) {
    const last = path.length / 3 - 1, x = clamp(u, 0, 1) * last, i = Math.floor(x), j = Math.min(i + 1, last), f = x - i;
    return [path[i * 3] + (path[j * 3] - path[i * 3]) * f, path[i * 3 + 1] + (path[j * 3 + 1] - path[i * 3 + 1]) * f, path[i * 3 + 2] + (path[j * 3 + 2] - path[i * 3 + 2]) * f];
  }
  function uOfFrame(m, i) {
    const n = m.kf.length - 1;
    if ((m.mode || 'curve') === 'ease') return clamp(i / (n + (m.hold || 0)), 0, 1);
    return Math.acos(1 - 2 * clamp(i / n, 0, 1)) / Math.PI;
  }

  /* ---------------- cenas e câmera ---------------- */
  function sceneSVG(key, o) {
    o = o || {};
    const sc = SC[key], svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', o.vb || '0 0 1600 1000');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    svg.setAttribute('class', 'scene');
    let h = '';
    sc.layers.forEach((l, i) => { if (o.only && o.only.indexOf(i) < 0) return; h += '<g class="ly" data-f="' + l.f + '">' + l.svg + '</g>'; });
    svg.innerHTML = h;
    return svg;
  }
  class Stage {
    constructor(host, key, aspect, o) {
      this.aspect = aspect; this.par = !(o && o.parallax === false);
      this.svg = sceneSVG(key); host.appendChild(this.svg);
      this.ly = $$('.ly', this.svg);
    }
    setParallax(v) { this.par = v; if (this.last) this.cam(this.last[0], this.last[1], this.last[2]); }
    cam(cx, cy, s, rot) {
      this.last = [cx, cy, s];
      const h = s, w = s * this.aspect;
      this.svg.setAttribute('viewBox', r1(cx - w / 2) + ' ' + r1(cy - h / 2) + ' ' + r1(w) + ' ' + r1(h));
      for (let i = 0; i < this.ly.length; i++) {
        const g = this.ly[i];
        if (this.par) g.setAttribute('transform', 'translate(' + r1((cx - 800) * +g.dataset.f) + ' ' + r1((cy - 500) * +g.dataset.f * .6) + ')');
        else if (rot) g.setAttribute('transform', 'rotate(' + r1(-rot) + ' ' + r1(cx) + ' ' + r1(cy) + ')');
        else g.removeAttribute('transform');
      }
    }
  }

  /* ---------------- player ---------------- */
  let CURRENT = null;
  const players = [];
  class Player {
    constructor(o) {
      this.o = o; this.stages = o.stages; this.m = o.motion; this.root = o.root;
      this.u = 0; this.state = 'poster'; this.loops = 0; this.maxLoops = Infinity; this.raf = 0;
      const ui = o.ui;
      this.pp = ui.pp; this.seekEl = ui.seek; this.big = ui.big;
      if (this.pp) this.pp.addEventListener('click', () => this.toggle());
      if (this.big) this.big.addEventListener('click', () => this.play());
      if (this.seekEl) this.seekEl.addEventListener('input', () => { this.seek(this.seekEl.value / 1000); });
      this.render(this.m.pu || 0); this.ui();
      players.push(this);
    }
    setMotion(m) { this.m = m; const was = this.state === 'playing'; this.seek(0); if (was) this.play(); else { this.state = 'poster'; this.render(m.pu || 0); this.ui(); } }
    path() { return buildPath(this.m); }
    render(u) {
      this.u = u;
      const c = this.m.fn ? this.m.fn(u) : sample(this.path(), u);
      for (let i = 0; i < this.stages.length; i++) this.stages[i].cam(c[0], c[1], c[2], c[3]);
      if (this.o.onCam) this.o.onCam(c[0], c[1], c[2], u);
      if (this.o.onU) this.o.onU(u);
    }
    ui() {
      const r = this.root, st = this.state;
      if (r) { r.classList.toggle('is-poster', st === 'poster'); r.classList.toggle('is-playing', st === 'playing'); r.classList.toggle('is-paused', st === 'paused'); }
      if (this.pp) {
        const done = st === 'paused' && this.u >= .999;
        this.pp.innerHTML = st === 'playing' ? ICON.pause : (done ? ICON.replay : ICON.play);
        this.pp.setAttribute('aria-label', st === 'playing' ? 'Pausar' : (done ? 'Reproduzir de novo' : 'Reproduzir'));
      }
      if (this.seekEl) this.seekEl.value = Math.round(this.u * 1000);
    }
    toggle() { if (this.state === 'playing') this.pause(); else this.play(); }
    play() {
      if (CURRENT && CURRENT !== this) CURRENT.pause();
      CURRENT = this;
      if (this.u >= .999 || this.state === 'poster') this.u = 0;
      this.state = 'playing'; this.t0 = performance.now() - this.u * this.m.dur;
      this.ui();
      cancelAnimationFrame(this.raf);
      const tick = (now) => {
        if (this.state !== 'playing') return;
        let u = (now - this.t0) / this.m.dur;
        if (u >= 1) {
          this.loops++;
          if (this.loops >= this.maxLoops) { this.render(1); this.state = 'poster'; this.render(this.m.pu || 0); this.ui(); return; }
          this.t0 = now; u = 0;
        }
        this.render(u); if (this.seekEl) this.seekEl.value = Math.round(u * 1000);
        this.raf = requestAnimationFrame(tick);
      };
      this.raf = requestAnimationFrame(tick);
    }
    pause() {
      if (this.state !== 'playing') return;
      this.state = 'paused'; cancelAnimationFrame(this.raf); this.ui();
    }
    seek(u) {
      u = clamp(u, 0, 1);
      if (this.state === 'poster') this.state = 'paused';
      this.t0 = performance.now() - u * this.m.dur;
      this.render(u); this.ui();
    }
  }

  document.addEventListener('visibilitychange', () => { if (document.hidden && CURRENT) CURRENT.pause(); });
  const io = 'IntersectionObserver' in window ? new IntersectionObserver((es) => {
    es.forEach((e) => {
      const p = e.target.__player; if (!p) return;
      if (!e.isIntersecting) { p.pause(); return; }
      if (e.intersectionRatio > .35 && e.target.dataset.autoplay && !e.target.__auto && !reduce) {
        e.target.__auto = true; p.maxLoops = 2; p.play();
      }
    });
  }, { threshold: [0, .15, .36, .5] }) : null;

  function bar(host, compact, free) {
    const b = document.createElement('div');
    b.className = free ? 'bar free' : 'bar';
    b.innerHTML = '<button class="pp" type="button"></button><input class="seek" type="range" min="0" max="1000" value="0" aria-label="Posição do estudo de movimento">';
    if (host) host.appendChild(b);
    return { el: b, pp: $('.pp', b), seek: $('.seek', b) };
  }

  function mountPlayer(root) {
    const id = root.dataset.id || '';
    const m = MOT[root.dataset.motion];
    const asp = parseAspect(root.dataset.aspect || '16/9');
    const compact = root.classList.contains('compact');
    const title = root.dataset.title || 'Estudo de movimento';
    const real = MIDIA_REAL[id];
    const wrap = document.createElement('div');
    wrap.className = 'stagewrap'; wrap.style.setProperty('--ar', asp);
    wrap.setAttribute('role', 'group'); wrap.setAttribute('aria-label', title);
    root.appendChild(wrap);
    if (real) return mountVideo(root, wrap, real, compact);

    const ov = root.dataset.overlay;
    let stages, onU;
    if (ov === 'clip') {
      stages = ['caminho_noite', 'caminho_aurora', 'caminho'].map((k) => new Stage(wrap, k, asp));
      const o = document.createElementNS(NS, 'svg');
      o.setAttribute('class', 'ov'); o.setAttribute('viewBox', '0 0 160 100'); o.setAttribute('aria-hidden', 'true');
      o.innerHTML = '<rect x="3" y="3" width="154" height="94" rx="3" fill="none" stroke="#04fff2" stroke-width="1.2" stroke-dasharray="3 2"/><circle cx="70" cy="90" r="2.6"/><circle cx="80" cy="90" r="2.6"/><circle cx="90" cy="90" r="2.6"/>' + '<g id="cl"><rect x="102" y="76" width="52" height="13" rx="4" fill="rgba(10,10,10,.82)"/><text id="clt" x="128" y="85" fill="#fff" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="6.6" font-weight="800"></text></g>';
      wrap.appendChild(o);
      const dots = $$('circle', o), clt = $('#clt', o), NAMES = ['1 · Madrugada', '2 · Amanhecer', '3 · Manhã'];
      onU = (u) => {
        const idx = Math.min(2, Math.floor(u * 3)); clt.textContent = NAMES[idx];
        stages.forEach((s, i) => { s.svg.style.visibility = i === idx ? 'visible' : 'hidden'; });
        dots.forEach((d, i) => { d.setAttribute('fill', i === idx ? '#04fff2' : 'rgba(255,255,255,.45)'); });
      };
    } else {
      stages = [new Stage(wrap, m.scene, asp)];
      if (ov) {
        const o = document.createElementNS(NS, 'svg');
        o.setAttribute('class', 'ov'); o.setAttribute('viewBox', '0 0 160 100'); o.setAttribute('aria-hidden', 'true');
        wrap.appendChild(o);
        onU = overlayFor(ov, o);
      }
    }
    const tag = document.createElement('span');
    tag.className = 'tag'; tag.textContent = compact ? 'Estudo' : 'Estudo de movimento';
    root.appendChild(tag);
    const big = document.createElement('button');
    big.type = 'button'; big.className = 'bigplay'; big.setAttribute('aria-label', 'Reproduzir: ' + title);
    big.innerHTML = '<span>' + ICON.play + '</span>';
    root.appendChild(big);
    const b = bar(root, compact);
    const p = new Player({ root: root, stages: stages, motion: m, ui: { pp: b.pp, seek: b.seek, big: big }, onU: onU, onCam: root.__onCam });
    root.__player = p;
    if (io) io.observe(root);
    return p;
  }

  function mountVideo(root, wrap, real, compact) {
    const v = document.createElement('video');
    v.muted = true; v.playsInline = true; v.preload = 'metadata'; v.loop = false; v.src = real.src;
    if (real.poster) v.poster = real.poster;
    v.setAttribute('aria-label', root.dataset.title || 'Gravação do Arco Motion');
    wrap.appendChild(v);
    const big = document.createElement('button');
    big.type = 'button'; big.className = 'bigplay'; big.setAttribute('aria-label', 'Reproduzir gravação'); big.innerHTML = '<span>' + ICON.play + '</span>';
    root.appendChild(big);
    const b = bar(root, compact);
    let state = 'poster';
    const set = (s) => {
      state = s;
      root.classList.toggle('is-poster', s === 'poster'); root.classList.toggle('is-playing', s === 'playing'); root.classList.toggle('is-paused', s === 'paused');
      b.pp.innerHTML = s === 'playing' ? ICON.pause : ICON.play; b.pp.setAttribute('aria-label', s === 'playing' ? 'Pausar' : 'Reproduzir');
    };
    const play = () => { if (CURRENT && CURRENT.pause && CURRENT !== api) CURRENT.pause(); CURRENT = api; v.play(); set('playing'); };
    const api = { pause() { v.pause(); if (state === 'playing') set('paused'); } };
    big.addEventListener('click', play);
    b.pp.addEventListener('click', () => (state === 'playing' ? api.pause() : play()));
    v.addEventListener('timeupdate', () => { if (v.duration) b.seek.value = Math.round(v.currentTime / v.duration * 1000); });
    b.seek.addEventListener('input', () => { if (v.duration) v.currentTime = b.seek.value / 1000 * v.duration; });
    v.addEventListener('ended', () => { set('poster'); v.currentTime = 0; });
    set('poster');
    return api;
  }

  /* sobreposições dos cartões da seção 6 (texto, setas e formas, GIF) */
  function overlayFor(kind, o) {
    /* formas prontas que entram sobre o desenho para destacar algo (não são desenhadas traço a traço) */
    const pop = (el, cx, cy, s, op) => { el.setAttribute('transform', 'translate(' + cx + ' ' + cy + ') scale(' + s.toFixed(3) + ') translate(' + -cx + ' ' + -cy + ')'); el.setAttribute('opacity', op.toFixed(2)); };
    if (kind === 'shapes') {
      o.innerHTML = '<rect id="sr" x="29" y="52" width="30" height="26" rx="5" fill="rgba(4,255,242,.16)" stroke="#04fff2" stroke-width="1.5"/>' +
        '<g id="sa"><path d="M96 22 L78 40 L81 43 L62 52 L67 46 L64 44 Z" fill="#ffaa00" stroke="#fff" stroke-width=".8" stroke-linejoin="round"/></g>' +
        '<circle id="sc" cx="123" cy="33" r="17" fill="rgba(255,107,91,.14)" stroke="#ff6b5b" stroke-width="1.5"/>';
      const a = $('#sa', o), r = $('#sr', o), c = $('#sc', o);
      return (u) => {
        const fade = 1 - smooth(u, .9, .99);
        const t1 = smooth(u, .08, .22), t2 = smooth(u, .3, .44), t3 = smooth(u, .56, .7);
        pop(r, 44, 65, .8 + .2 * t1 + .03 * Math.sin(u * 30) * t1, t1 * fade);
        a.setAttribute('transform', 'translate(' + ((1 - t2) * 14).toFixed(2) + ' ' + (-(1 - t2) * 10).toFixed(2) + ')'); a.setAttribute('opacity', (t2 * fade).toFixed(2));
        pop(c, 123, 33, .7 + .3 * t3 + .04 * Math.sin(u * 34) * t3, t3 * fade);
      };
    }
    if (kind === 'dir') {
      /* o mesmo quadro, em sequência: texto, seta e GIF */
      let rays = '';
      for (let i = 0; i < 12; i++) rays += '<line class="ry" x1="0" y1="-16" x2="0" y2="-22" transform="rotate(' + (i * 30) + ')" stroke="' + (i % 2 ? '#ffd23f' : '#ffaa00') + '" stroke-width="2.6" stroke-linecap="round"/>';
      o.innerHTML = '<g id="dt"><rect x="95" y="64" width="56" height="13" rx="4" fill="rgba(10,10,10,.85)"/><text x="123" y="73" fill="#fff" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="6.6" font-weight="800">Sol da manhã</text></g>' +
        '<rect id="dr" x="29" y="52" width="30" height="26" rx="5" fill="rgba(4,255,242,.16)" stroke="#04fff2" stroke-width="1.5"/>' +
        '<g id="da"><path d="M100 26 L70.3 46.3" stroke="#fff" stroke-width="5.4" stroke-linecap="round" fill="none"/><path d="M100 26 L70.3 46.3" stroke="#ffaa00" stroke-width="3.4" stroke-linecap="round" fill="none"/><polygon points="62,52 73.1,50.5 67.4,42.2" fill="#ffaa00" stroke="#fff" stroke-width="1.2" stroke-linejoin="round"/></g>' +
        '<g id="dg" transform="translate(123 33)">' + rays + '</g>' +
        '<g id="db"><rect x="126" y="84" width="26" height="11" rx="3" fill="rgba(10,10,10,.78)"/><text x="139" y="92.2" fill="#fff" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="7" font-weight="800">GIF</text></g>';
      const tx = $('#dt', o), r = $('#dr', o), a = $('#da', o), g = $('#dg', o), bd = $('#db', o), rs = $$('.ry', o), items = $$('#dir-steps li');
      let cur = -1;
      return (u) => {
        const fade = 1 - smooth(u, .93, .99);
        const t1 = smooth(u, .06, .2), t2 = smooth(u, .34, .46), t3 = smooth(u, .6, .72);
        tx.setAttribute('transform', 'translate(0 ' + ((1 - t1) * 4).toFixed(2) + ')'); tx.setAttribute('opacity', (t1 * fade).toFixed(2));
        pop(r, 44, 65, .8 + .2 * t2, t2 * fade);
        a.setAttribute('transform', 'translate(' + ((1 - t2) * 14).toFixed(2) + ' ' + (-(1 - t2) * 10).toFixed(2) + ')'); a.setAttribute('opacity', (t2 * fade).toFixed(2));
        g.setAttribute('opacity', (t3 * fade).toFixed(2)); bd.setAttribute('opacity', (t3 * fade).toFixed(2));
        g.setAttribute('transform', 'translate(123 33) rotate(' + (u * 60).toFixed(1) + ')');
        rs.forEach((l, i) => { const pp = (Math.sin(u * 6.2832 * 3 - i * .52) + 1) / 2; l.setAttribute('y1', (-(16 + 3 * pp)).toFixed(2)); l.setAttribute('y2', (-(20 + 9 * pp)).toFixed(2)); l.setAttribute('opacity', (.45 + .55 * pp).toFixed(2)); });
        const k = u < .3 ? 0 : u < .55 ? 1 : 2;
        if (k !== cur) { cur = k; items.forEach((li, i) => li.classList.toggle('on', i === k)); }
      };
    }
    if (kind === 'gif') {
      let rays = '';
      for (let i = 0; i < 12; i++) rays += '<line class="ry" x1="0" y1="-16" x2="0" y2="-22" transform="rotate(' + (i * 30) + ')" stroke="' + (i % 2 ? '#ffd23f' : '#ffaa00') + '" stroke-width="2.6" stroke-linecap="round"/>';
      o.innerHTML = '<g id="gr" transform="translate(123 33)">' + rays + '</g>' +
        '<g><rect x="126" y="84" width="26" height="11" rx="3" fill="rgba(10,10,10,.78)"/><text x="139" y="92.2" fill="#fff" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="7" font-weight="800">GIF</text></g>';
      const g = $('#gr', o), rs = $$('.ry', o);
      return (u) => {
        g.setAttribute('transform', 'translate(123 33) rotate(' + (u * 60).toFixed(1) + ')');
        rs.forEach((l, i) => {
          const p = (Math.sin(u * 6.2832 * 3 - i * .52) + 1) / 2, y2 = -(17 + 3 + 9 * p);
          l.setAttribute('y1', (-(16 + 3 * p)).toFixed(2)); l.setAttribute('y2', y2.toFixed(2));
          l.setAttribute('opacity', (.45 + .55 * p).toFixed(2));
        });
      };
    }
    return null;
  }

  /* ---------------- visão geral da obra (enquadramentos, percurso, câmera) ---------------- */
  function overview(host, key, o) {
    const svg = sceneSVG(key, { vb: o.vb });
    svg.removeAttribute('aria-hidden'); svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', o.label || 'Obra inteira com os enquadramentos marcados');
    host.appendChild(svg);
    const g = document.createElementNS(NS, 'g'), lv = document.createElementNS(NS, 'rect');
    svg.appendChild(g);
    lv.setAttribute('fill', '#fff'); lv.setAttribute('fill-opacity', '.14'); lv.setAttribute('stroke', '#fff'); lv.setAttribute('stroke-width', '6'); lv.setAttribute('visibility', 'hidden');
    svg.appendChild(lv);
    const FONT = 'font-family="Helvetica,Arial,sans-serif" font-weight="800"';
    const api = {
      draw(opt) {
        opt = Object.assign({}, o, opt || {});
        const a = opt.aspect || 16 / 9, frames = opt.frames || [];
        let h = '';
        if (opt.path) {
          const p = opt.path, pts = [];
          for (let k = 0; k < p.length / 3; k += 6) pts.push(r1(p[k * 3]) + ',' + r1(p[k * 3 + 1]));
          const L = p.length / 3 - 1;
          pts.push(r1(p[L * 3]) + ',' + r1(p[L * 3 + 1]));
          h += '<polyline points="' + pts.join(' ') + '" fill="none" stroke="#ffaa00" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" opacity=".95"/>';
          const ex = p[L * 3], ey = p[L * 3 + 1], bx = p[(L - 24) * 3], by = p[(L - 24) * 3 + 1];
          const ang = Math.atan2(ey - by, ex - bx), ah = 46;
          const pt = (da, d) => r1(ex - Math.cos(ang + da) * d) + ',' + r1(ey - Math.sin(ang + da) * d);
          h += '<polygon points="' + r1(ex) + ',' + r1(ey) + ' ' + pt(.5, ah) + ' ' + pt(-.5, ah) + '" fill="#ffaa00"/>';
        }
        if (opt.appStyle) {
          /* Frame no estilo do editor do Arco (arco-app-test, v8z4b32E): borda cinza-clara com cantos arredondados,
             número no canto, mira central fina, quatro alças brancas nos cantos e escurecimento fora do Frame ativo. */
          const bd = '#c6c6c6', badge = (x, y, n, op, on) => '<g opacity="' + op + '"><rect x="' + r1(x + 16) + '" y="' + r1(y + 14) + '" width="56" height="44" rx="11" fill="#2a2a2d" fill-opacity=".92"/><text x="' + r1(x + 44) + '" y="' + r1(y + 46) + '" text-anchor="middle" font-size="30" fill="' + (on ? '#ffffff' : '#a9a9ae') + '" ' + FONT + '>' + n + '</text></g>';
          const ai = opt.hl, af = frames[ai];
          const adj2 = opt.adj || { dx: 0, dy: 0, s: 1, rot: 0 };
          const acx = af[0] + adj2.dx, acy = af[1] + adj2.dy, ah2 = af[2] * adj2.s, aw = ah2 * a, rad = (adj2.rot || 0) * Math.PI / 180;
          const cs = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map((q) => { const px = q[0] * aw / 2, py = q[1] * ah2 / 2; return [acx + px * Math.cos(rad) - py * Math.sin(rad), acy + px * Math.sin(rad) + py * Math.cos(rad)]; });
          h += '<path fill-rule="evenodd" fill="rgba(0,0,0,.5)" d="M-800 -500H2400V1500H-800Z M' + cs.map((c) => r1(c[0]) + ' ' + r1(c[1])).join(' L') + ' Z"/>';
          frames.forEach((f, i) => {
            if (i === ai) return;
            const w2 = f[2] * a;
            h += '<rect x="' + r1(f[0] - w2 / 2) + '" y="' + r1(f[1] - f[2] / 2) + '" width="' + r1(w2) + '" height="' + r1(f[2]) + '" rx="18" fill="none" stroke="' + bd + '" stroke-width="7" opacity=".55"/>' + badge(f[0] - w2 / 2, f[1] - f[2] / 2, i + 1, .55);
          });
          if (opt.adj) h += '<rect x="' + r1(af[0] - af[2] * a / 2) + '" y="' + r1(af[1] - af[2] / 2) + '" width="' + r1(af[2] * a) + '" height="' + r1(af[2]) + '" rx="18" fill="none" stroke="#fff" stroke-width="6" stroke-dasharray="20 14" opacity=".8"/>';
          const ax = acx - aw / 2, ay = acy - ah2 / 2;
          h += '<g transform="rotate(' + r1(adj2.rot || 0) + ' ' + r1(acx) + ' ' + r1(acy) + ')">' +
            '<rect x="' + r1(ax) + '" y="' + r1(ay) + '" width="' + r1(aw) + '" height="' + r1(ah2) + '" rx="20" fill="none" stroke="#04fff2" stroke-width="11"/>' + badge(ax, ay, ai + 1, 1, true) +
            '<path d="M' + r1(acx - 34) + ' ' + r1(acy) + 'H' + r1(acx + 34) + 'M' + r1(acx) + ' ' + r1(acy - 34) + 'V' + r1(acy + 34) + '" stroke="rgba(255,255,255,.5)" stroke-width="4"/>' +
            [[ax - 52, ay - 62], [ax + aw + 52, ay - 62], [ax - 52, ay + ah2 + 62], [ax + aw + 52, ay + ah2 + 62]].map((c) => '<circle cx="' + r1(c[0]) + '" cy="' + r1(c[1]) + '" r="28" fill="#e4e4e6" fill-opacity=".94" stroke="rgba(0,0,0,.18)" stroke-width="3"/>').join('') + '</g>';
          g.innerHTML = h;
          return;
        }
        frames.forEach((f, i) => {
          const isHl = opt.hl === i, dim = opt.hl != null && !isHl;
          const adj = isHl ? (opt.adj || (opt.shift ? { dx: opt.shift[0], dy: opt.shift[1], s: 1, rot: 0 } : null)) : null;
          let cx = f[0], cy = f[1], hh = f[2];
          if (adj) { cx += adj.dx; cy += adj.dy; hh *= adj.s; }
          const w = hh * a, x = cx - w / 2, y = cy - hh / 2, op = dim ? .38 : 1;
          if (adj) h += '<rect x="' + r1(f[0] - f[2] * a / 2) + '" y="' + r1(f[1] - f[2] / 2) + '" width="' + r1(f[2] * a) + '" height="' + r1(f[2]) + '" fill="none" stroke="#fff" stroke-width="5" stroke-dasharray="18 14" opacity=".7"/>';
          if (adj && adj.rot) h += '<g transform="rotate(' + r1(adj.rot) + ' ' + r1(cx) + ' ' + r1(cy) + ')">';
          h += '<rect x="' + r1(x) + '" y="' + r1(y) + '" width="' + r1(w) + '" height="' + r1(hh) + '" fill="rgba(4,255,242,.07)" stroke="#04fff2" stroke-width="7" opacity="' + op + '"/>';
          if (opt.numbers !== false) h += '<g opacity="' + op + '"><rect x="' + r1(x + 16) + '" y="' + r1(y + 14) + '" width="56" height="44" rx="11" fill="#2a2a2d" fill-opacity=".92"/><text x="' + r1(x + 44) + '" y="' + r1(y + 46) + '" text-anchor="middle" font-size="30" fill="' + (isHl || opt.hl == null ? '#ffffff' : '#a9a9ae') + '" ' + FONT + '>' + (i + 1) + '</text></g>';
          if (isHl && opt.handles) {
            [[x, y], [x + w, y], [x, y + hh], [x + w, y + hh]].forEach((c) => { h += '<rect x="' + r1(c[0] - 16) + '" y="' + r1(c[1] - 16) + '" width="32" height="32" rx="6" fill="#fff" stroke="#04fff2" stroke-width="6"/>'; });
            if (adj && adj.rot !== undefined) h += '<line x1="' + r1(cx) + '" y1="' + r1(y) + '" x2="' + r1(cx) + '" y2="' + r1(y - 46) + '" stroke="#04fff2" stroke-width="5"/><circle cx="' + r1(cx) + '" cy="' + r1(y - 58) + '" r="15" fill="#ffaa00" stroke="#fff" stroke-width="5"/>';
          }
          if (adj && adj.rot) h += '</g>';
        });
        if (opt.vector) {
          const n = frames.length;
          frames.forEach((f, i) => {
            const pa = frames[Math.max(0, i - 1)], pb = frames[Math.min(n - 1, i + 1)];
            const tx = (pb[0] - pa[0]), ty = (pb[1] - pa[1]), len = Math.hypot(tx, ty) || 1, d = 120;
            const dx = tx / len * d, dy = ty / len * d;
            h += '<line x1="' + r1(f[0] - dx) + '" y1="' + r1(f[1] - dy) + '" x2="' + r1(f[0] + dx) + '" y2="' + r1(f[1] + dy) + '" stroke="#fff" stroke-width="4"/>' +
              '<circle cx="' + r1(f[0] - dx) + '" cy="' + r1(f[1] - dy) + '" r="12" fill="#fff" stroke="#ffaa00" stroke-width="4"/><circle cx="' + r1(f[0] + dx) + '" cy="' + r1(f[1] + dy) + '" r="12" fill="#fff" stroke="#ffaa00" stroke-width="4"/>' +
              '<rect x="' + r1(f[0] - 16) + '" y="' + r1(f[1] - 16) + '" width="32" height="32" fill="#ffaa00" stroke="#fff" stroke-width="5"/>';
          });
        }
        g.innerHTML = h + (opt.extra || '');
      },
      hideCam() { lv.setAttribute('visibility', 'hidden'); },
      setCam(cx, cy, s, a) {
        const w = s * (a || 16 / 9);
        lv.setAttribute('x', r1(cx - w / 2)); lv.setAttribute('y', r1(cy - s / 2)); lv.setAttribute('width', r1(w)); lv.setAttribute('height', r1(s)); lv.setAttribute('visibility', 'visible');
      }
    };
    api.draw();
    return api;
  }


  /* ---------- simulação do desenho do percurso: Lápis (à mão) e Caneta (curva vetorial) ----------
     Reconstrução animada do fluxo do app (spec "Lápis e Caneta", arco-app-test): + → ferramenta → gesto →
     Frames criados após o Frame de origem e reconectados ao sucessor. Não é captura de tela. */
  function drawSim(host) {
    const svg = sceneSVG('caminho');
    svg.removeAttribute('aria-hidden'); svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', 'Simulação do desenho de um percurso e da criação dos Frames');
    host.appendChild(svg);
    const g = document.createElementNS(NS, 'g'); svg.appendChild(g);
    const IC = {
      ind: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M8 12h8"/><path d="M12 8v8"/>',
      pencil: '<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/>',
      pen: '<path d="M15.707 21.293a1 1 0 0 1-1.414 0l-1.586-1.586a1 1 0 0 1 0-1.414l5.586-5.586a1 1 0 0 1 1.414 0l1.586 1.586a1 1 0 0 1 0 1.414z"/><path d="m18 13-1.375-6.874a1 1 0 0 0-.746-.776L3.235 2.028a1 1 0 0 0-1.207 1.207L5.35 15.879a1 1 0 0 0 .776.746L13 18"/><path d="m2.3 2.3 7.286 7.286"/><circle cx="11" cy="11" r="2"/>',
      arm: '<path d="M6 3h8l5 5v13H6z"/><path d="M10 12c-1.2 0-1.6.6-1.6 1.5S8.8 15 10 15M14 12c1.2 0 1.6.6 1.6 1.5S15.2 15 14 15"/>',
      ok: '<path d="M20 6 9 17l-5-5"/>', x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>'
    };
    const ib = (k, cls) => '<span class="sb ' + (cls || '') + '" data-k="' + k + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + IC[k] + '</svg></span>';
    host.insertAdjacentHTML('beforeend',
      '<div class="simhud menu" aria-hidden="true"><div class="pill pmenu">' + ib('ind') + ib('pencil') + ib('pen') + ib('arm') + ib('x', 'cancel') + '</div><div class="pill phud">' + ib('ok', 'ok') + ib('x', 'cancelhud') + '</div></div>' +
      '<div class="simcap" role="status" aria-live="off"></div><span class="tag sch">Esquema animado</span>');
    const hud = $('.simhud', host), cap = $('.simcap', host), kPencil = $('.pmenu [data-k=pencil]', host), kPen = $('.pmenu [data-k=pen]', host), kOk = $('.phud .ok', host);
    const O = [340, 700], S = [1320, 700], FH = 260, FW = FH * 16 / 9, N = [[540, 440], [860, 320], [1170, 470]];
    const ez = (t) => t * t * (3 - 2 * t), cl = (t) => Math.min(1, Math.max(0, t)), ph = (t, a, b) => ez(cl((t - a) / (b - a))), lin = (t, a, b) => cl((t - a) / (b - a));
    const f1 = (n) => r1(n);
    /* traço bruto do dedo: passa exatamente pelos três pontos, com tremor suave entre eles */
    const raw = (function () {
      const P = [N[0], N[1], N[2]], pts = [], cr = (a, b, c, d, u) => 0.5 * ((2 * b) + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u * u + (-a + 3 * b - 3 * c + d) * u * u * u);
      const ext = [[N[0][0] - (N[1][0] - N[0][0]) * .6, N[0][1] - (N[1][1] - N[0][1]) * .6], N[0], N[1], N[2], [N[2][0] + (N[2][0] - N[1][0]) * .6, N[2][1] + (N[2][1] - N[1][1]) * .6]];
      for (let sg = 0; sg < 2; sg++) for (let i = 0; i < 46; i++) {
        const u = i / 46, a = ext[sg], b = ext[sg + 1], c = ext[sg + 2], d = ext[sg + 3], env = Math.sin(Math.PI * u);
        const nx = Math.sin(u * 23 + sg * 2.1) * 9 + Math.sin(u * 51 + 1.3) * 4, ny = Math.cos(u * 19 + sg * 1.7) * 9 + Math.sin(u * 47) * 4;
        pts.push([cr(a[0], b[0], c[0], d[0], u) + nx * env, cr(a[1], b[1], c[1], d[1], u) + ny * env]);
      }
      pts.push([N[2][0], N[2][1]]); return pts;
    })();
    const handlesPencil = N.map((p, i) => { const pr = i ? N[i - 1] : [p[0] - (N[1][0] - p[0]), p[1] - (N[1][1] - p[1])], nx = i < 2 ? N[i + 1] : [p[0] + (p[0] - N[1][0]), p[1] + (p[1] - N[1][1])]; const o = [(nx[0] - pr[0]) / 6, (nx[1] - pr[1]) / 6]; return { o: o, i: [-o[0], -o[1]] }; });
    const handlesPen = [{ o: [0, 0], i: [0, 0] }, { o: [130, -40], i: [-130, 40] }, { o: [0, 0], i: [0, 0] }];
    const pathD = (nodes, hs, withS) => {
      let d = 'M' + f1(O[0]) + ' ' + f1(O[1]), prev = { p: O, o: [0, 0] };
      nodes.forEach((p, i) => { const h = hs[i]; d += ' C' + f1(prev.p[0] + prev.o[0]) + ' ' + f1(prev.p[1] + prev.o[1]) + ' ' + f1(p[0] + h.i[0]) + ' ' + f1(p[1] + h.i[1]) + ' ' + f1(p[0]) + ' ' + f1(p[1]); prev = { p: p, o: h.o }; });
      if (withS) d += ' C' + f1(prev.p[0] + prev.o[0]) + ' ' + f1(prev.p[1] + prev.o[1]) + ' ' + f1(S[0]) + ' ' + f1(S[1]) + ' ' + f1(S[0]) + ' ' + f1(S[1]);
      return d;
    };
    const FONTA = 'font-family="Helvetica,Arial,sans-serif" font-weight="800"';
    const frame = (c, o) => {
      o = o || {};
      const sc = o.sc == null ? 1 : o.sc, op = o.op == null ? 1 : o.op, x = c[0] - FW / 2, y = c[1] - FH / 2, col = o.col || '#c6c6c6';
      if (sc <= .01 || op <= .01) return '';
      return '<g opacity="' + f1(op * 100) / 100 + '" transform="translate(' + f1(c[0]) + ' ' + f1(c[1]) + ') scale(' + f1(sc * 100) / 100 + ') translate(' + f1(-c[0]) + ' ' + f1(-c[1]) + ')"><rect x="' + f1(x) + '" y="' + f1(y) + '" width="' + f1(FW) + '" height="' + FH + '" rx="16" fill="rgba(0,0,0,.001)" stroke="' + col + '" stroke-width="' + (o.col ? 9 : 7) + '"/>' +
        '<rect x="' + f1(x + 14) + '" y="' + f1(y + 12) + '" width="52" height="40" rx="10" fill="#2a2a2d" fill-opacity=".92"/><text x="' + f1(x + 40) + '" y="' + f1(y + 42) + '" text-anchor="middle" font-size="28" fill="' + (o.flash ? '#04fff2' : '#a9a9ae') + '" ' + FONTA + '>' + o.num + '</text></g>';
    };
    const finger = (p, a, press) => a <= .01 ? '' : '<g opacity="' + f1(a * 100) / 100 + '"><circle cx="' + f1(p[0]) + '" cy="' + f1(p[1]) + '" r="' + (press ? 30 : 36) + '" fill="rgba(255,255,255,.3)" stroke="rgba(255,255,255,.85)" stroke-width="5"/></g>';
    const ripple = (p, u) => (u <= 0 || u >= 1) ? '' : '<circle cx="' + f1(p[0]) + '" cy="' + f1(p[1]) + '" r="' + f1(30 + u * 70) + '" fill="none" stroke="#fff" stroke-width="5" opacity="' + f1((1 - u) * 70) / 100 + '"/>';
    const nodeDots = (nodes, hs, a) => a <= .01 ? '' : nodes.map((p, i) => { const h = hs[i], has = Math.abs(h.o[0]) + Math.abs(h.o[1]) > 1; let o = '<g opacity="' + f1(a * 100) / 100 + '">'; if (has) o += '<path d="M' + f1(p[0] + h.i[0]) + ' ' + f1(p[1] + h.i[1]) + ' L' + f1(p[0] + h.o[0]) + ' ' + f1(p[1] + h.o[1]) + '" stroke="#04fff2" stroke-width="3" fill="none"/>'; (has ? [[p[0] + h.i[0], p[1] + h.i[1]], [p[0] + h.o[0], p[1] + h.o[1]], p] : [p]).forEach((q) => { o += '<circle cx="' + f1(q[0]) + '" cy="' + f1(q[1]) + '" r="13" fill="#303238" stroke="#04fff2" stroke-width="3.5"/>'; }); return o + '</g>'; }).join('');
    const handlesAt = (c, a) => a <= .01 ? '' : '<g opacity="' + f1(a * 100) / 100 + '">' + [[-1, -1], [1, -1], [-1, 1], [1, 1]].map((q) => '<circle cx="' + f1(c[0] + q[0] * (FW / 2 + 34)) + '" cy="' + f1(c[1] + q[1] * (FH / 2 + 38)) + '" r="17" fill="#e4e4e6" fill-opacity=".94" stroke="rgba(0,0,0,.18)" stroke-width="3"/>').join('') + '</g>';
    const oldPath = 'M' + O[0] + ' ' + O[1] + ' C600 980 1060 980 ' + S[0] + ' ' + S[1];
    let mode = 'pencil', t0 = 0, raf = 0, lastHud = '', lastCap = '';
    const LOOP = { pencil: 11500, pen: 13800 };
    function setHud(k) { if (k !== lastHud) { hud.className = 'simhud ' + k; lastHud = k; } }
    function setCap(t) { if (t !== lastCap) { cap.textContent = t; lastCap = t; } }
    function scene(ms) {
      let h = '', dim = 1, hudK = '';
      if (mode === 'pencil') {
        const SESS = lin(ms, 1500, 1900) - lin(ms, 5900, 6300); dim = 1 - .6 * ez(SESS);
        hudK = ms < 1500 ? 'menu' : ms < 5900 ? 'hud' : '';
        kPencil.classList.toggle('sel', ms > 600 && ms < 1500); kPen.classList.remove('sel');
        const draw = lin(ms, 1900, 4900), np = Math.floor(draw * (raw.length - 1)), fa = (ms >= 1800 && ms < 4900 ? 1 : 0) * ph(ms, 1800, 2000) + (ms >= 4900 ? 1 - ph(ms, 4900, 5200) : 0) * (ms >= 4900 ? 1 : 0);
        const fit = ph(ms, 4900, 5300), rawA = ms < 4900 ? 1 : 1 - ph(ms, 4900, 5500), commit = ph(ms, 5900, 6500);
        h += '<path d="' + oldPath + '" fill="none" stroke="#ffaa00" stroke-width="5" stroke-linecap="round" opacity="' + f1((.9 * (1 - ph(ms, 5000, 5700)) * (1 - .6 * SESS)) * 100) / 100 + '" stroke-dasharray="2 12"/>';
        h += frame(O, { num: 1, op: dim }) + frame(S, { num: ms > 6000 ? 5 : 2, op: dim, flash: ms > 6000 && ms < 6900 });
        if (ms >= 5000) {
          const pops = [5000, 5200, 5400].map((a) => ph(ms, a, a + 350));
          if (fit > 0) h += '<path d="' + pathD(N, handlesPencil, true) + '" fill="none" stroke="' + (commit > .5 ? '#ffaa00' : '#04fff2') + '" stroke-width="' + (commit > .5 ? 5 : 3) + '" stroke-linecap="round" opacity="' + f1(fit * 100) / 100 + '"/>';
          N.forEach((p, i) => { h += frame(p, { num: i + 2, sc: .8 + .2 * pops[i], op: pops[i] * (SESS > .5 ? 1 : 1), col: commit < .5 ? (i === 2 ? '#04fff2' : '#c6c6c6') : null }); });
          h += nodeDots(N, handlesPencil, fit * (1 - ph(ms, 5900, 6300)));
        }
        if (ms < 5500 && draw > 0) h += '<polyline points="' + raw.slice(0, np + 1).map((q) => f1(q[0]) + ',' + f1(q[1])).join(' ') + '" fill="none" stroke="#04fff2" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" opacity="' + f1(rawA * 100) / 100 + '"/>';
        else if (ms >= 5500) { /* traço bruto já substituído */ }
        h += finger(raw[Math.min(np, raw.length - 1)], fa, true);
        setCap(ms < 1500 ? '1 · Toque em + e escolha Lápis' : ms < 4900 ? '2 · Desenhe com o dedo' : ms < 6200 ? '3 · Solte: o traço vira curva e os Frames são criados' : 'Frames 2, 3 e 4 entram depois do Frame 1; o antigo 2 passa a ser o 5');
      } else {
        const SESS = lin(ms, 1500, 1900) - lin(ms, 7500, 7900); dim = 1 - .6 * ez(SESS);
        hudK = ms < 1500 ? 'menu' : ms < 7500 ? 'hud' : '';
        kPen.classList.toggle('sel', ms > 600 && ms < 1500); kPencil.classList.remove('sel');
        const t1 = 2000, t2 = 3600, t3 = 5800, pr = 6900;
        const pops = [t1, t2, t3].map((a) => ph(ms, a, a + 350));
        const drag = ph(ms, t2 + 200, t2 + 1000), hsC = handlesPen.map((hh, i) => i === 1 ? { o: [hh.o[0] * drag, hh.o[1] * drag], i: [hh.i[0] * drag, hh.i[1] * drag] } : hh);
        const commit = ph(ms, pr + 400, pr + 900), nShown = pops.filter((a) => a > 0).length;
        h += '<path d="' + oldPath + '" fill="none" stroke="#ffaa00" stroke-width="5" stroke-linecap="round" opacity="' + f1((.9 * (1 - ph(ms, pr + 300, pr + 800)) * (1 - .6 * SESS)) * 100) / 100 + '" stroke-dasharray="2 12"/>';
        h += frame(O, { num: 1, op: dim }) + frame(S, { num: ms > pr + 600 ? 5 : 2, op: dim, flash: ms > pr + 600 && ms < pr + 1500 });
        if (nShown) {
          const nodes = N.slice(0, nShown), withS = commit > 0;
          h += '<path d="' + pathD(nodes, hsC, withS) + '" fill="none" stroke="' + (commit > .5 ? '#ffaa00' : '#04fff2') + '" stroke-width="' + (commit > .5 ? 5 : 3) + '" stroke-linecap="round"/>';
          nodes.forEach((p, i) => { const active = i === nShown - 1 && commit < .5; h += frame(p, { num: i + 2, sc: .8 + .2 * pops[i], op: pops[i], col: commit < .5 ? (active ? '#04fff2' : '#c6c6c6') : null }); });
          h += nodeDots(nodes, hsC, 1 - commit);
          if (commit < .5) { const li = nShown - 1; h += handlesAt(N[li], pops[li] * (1 - commit)); }
        }
        const fpos = ms < t2 - 200 ? N[0] : ms < t3 - 200 ? [N[1][0] + 130 * drag, N[1][1] - 40 * drag] : N[2];
        const fa = (ms > t1 - 150 && ms < t1 + 450 ? 1 : 0) + (ms > t2 - 150 && ms < t2 + 1250 ? 1 : 0) + (ms > t3 - 150 && ms < t3 + 450 ? 1 : 0);
        h += finger(fpos, Math.min(1, fa), true) + ripple(N[0], lin(ms, t1, t1 + 500)) + ripple(N[1], lin(ms, t2, t2 + 500)) + ripple(N[2], lin(ms, t3, t3 + 500));
        kOk.classList.toggle('press', ms > pr && ms < pr + 500);
        setCap(ms < 1500 ? '1 · Toque em + e escolha Caneta' : ms < t2 - 100 ? '2 · Toque: cria um Frame no ponto' : ms < t3 - 100 ? '3 · Toque e arraste: cria o Frame e as alças da curva' : ms < pr ? '4 · Continue tocando para adicionar pontos' : ms < pr + 1500 ? '5 · Finalizar: o bloco é ligado ao Frame seguinte' : 'Frames 2, 3 e 4 entram depois do Frame 1; o antigo 2 passa a ser o 5');
      }
      g.innerHTML = h; setHud(hudK);
    }
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    function tick(now) { if (!t0) t0 = now; scene((now - t0) % LOOP[mode]); raf = requestAnimationFrame(tick); }
    function stop() { cancelAnimationFrame(raf); raf = 0; }
    function still() { scene(LOOP[mode] - 600); }
    still();
    if (!reduce && 'IntersectionObserver' in window) new IntersectionObserver((es) => { es.forEach((e) => { if (e.isIntersecting && !raf) { t0 = 0; raf = requestAnimationFrame(tick); } else if (!e.isIntersecting && raf) { stop(); still(); } }); }, { threshold: .3 }).observe(host);
    return { setMode(m) { mode = m; t0 = 0; lastHud = ''; lastCap = ''; if (!raf) still(); } };
  }

  /* camadas separadas (vista explodida) */
  function explode(host, key, idxs) {
    const n = idxs.length, sc = SC[key];
    idxs.forEach((li, i) => {
      const d = document.createElement('div');
      d.className = 'pl';
      const off = n > 1 ? i * (36 / (n - 1)) : 0;
      d.style.left = off + '%'; d.style.top = off + '%'; d.style.zIndex = String(i + 1);
      d.appendChild(sceneSVG(key, { only: [li] }));
      const s = document.createElement('span'); s.textContent = sc.layers[li].name; d.appendChild(s);
      host.appendChild(d);
    });
  }
  function thumb(host, key, cam, extra) {
    const d = document.createElement('div');
    d.style.cssText = 'position:relative;aspect-ratio:1;border-radius:8px;overflow:hidden;flex:1 1 0;min-width:0;' + (extra || '');
    host.appendChild(d);
    const st = new Stage(d, key, 1); st.svg.style.cssText = 'position:absolute;inset:0;width:100%;height:100%';
    st.cam(cam[0], cam[1], cam[2]);
    return d;
  }
  function fileIcon(small) {
    const w = small ? 'width:34%' : 'width:42%';
    return '<svg viewBox="0 0 120 150" style="' + w + ';height:auto" aria-hidden="true"><path d="M8 4h72l32 32v110H8z" fill="#f4f2ea"/><path d="M80 4v32h32z" fill="#b9b7ac"/>' +
      '<path d="M26 112 C44 62 70 126 94 70" fill="none" stroke="#ffaa00" stroke-width="5" stroke-linecap="round"/>' +
      '<rect x="20" y="104" width="14" height="14" fill="#04fff2"/><rect x="52" y="84" width="14" height="14" fill="#04fff2"/><rect x="86" y="62" width="14" height="14" fill="#04fff2"/></svg>';
  }

  /* ---------------- esquemas dos passos ---------------- */
  /* laço de animação leve: só roda à vista e sem "reduzir movimento"; stop() devolve o quadro final parado */
  function onView(el, tick, stop) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
    let raf = 0, t0 = 0;
    const loop = (now) => { if (!t0) t0 = now; tick(now - t0); raf = requestAnimationFrame(loop); };
    new IntersectionObserver((es) => { es.forEach((e) => {
      if (e.isIntersecting && !raf) raf = requestAnimationFrame(loop);
      else if (!e.isIntersecting && raf) { cancelAnimationFrame(raf); raf = 0; t0 = 0; if (stop) stop(); }
    }); }, { threshold: .3 }).observe(el);
  }
  /* Frames entrando um a um: cada um chega um pouco maior e assenta no tamanho final */
  function growFrames(list, t, starts, len) {
    const out = []; let newest = -1;
    list.forEach((f, i) => { if (t >= starts[i]) { const k = smooth(t, starts[i], starts[i] + len); out.push([f[0], f[1], f[2] * (1.3 - .3 * k)]); newest = i; } });
    return { frames: out, newest: newest };
  }

  function fillVis(vis) {
    const kind = vis.dataset.vis;
    const flex = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;gap:4%;padding:8% 6%';
    if (kind === 'image') {
      /* uma imagem só entra no palco; camadas são opcionais e aparecem mais adiante */
      vis.insertAdjacentHTML('beforeend', '<div class="imgstage"><div class="imgcard"></div><span class="imglbl">Sua imagem</span></div>');
      const card = $('.imgcard', vis), lbl = $('.imglbl', vis);
      const st = new Stage(card, 'caminho', 1.6); st.svg.style.cssText = 'position:absolute;inset:0;width:100%;height:100%'; st.cam(800, 500, 1000);
      const put = (k) => { card.style.transform = 'translateY(' + ((1 - k) * -34).toFixed(1) + '%) rotate(' + ((1 - k) * -5).toFixed(1) + 'deg) scale(' + (.55 + .45 * k).toFixed(3) + ')'; card.style.opacity = Math.min(1, k * 2).toFixed(2); lbl.style.opacity = k > .9 ? '1' : '0'; };
      put(1);
      onView(vis, (ms) => { const t = (ms % 6000) / 6000; put(t < .8 ? smooth(t, .06, .4) : 1 - smooth(t, .88, .98)); }, () => put(1));
    }
    else if (kind === 'plan') {
      const PA = { aspect: 16 / 9, numbers: true, vector: true };
      const pathOf = (kf) => buildPath({ kf: kf, mode: 'curve' });
      const ov = overview(vis, 'caminho', Object.assign({ frames: TUT, path: pathOf(TUT) }, PA));
      /* Frames entram um a um, o percurso os liga e o Frame selecionado é arrastado, mudando a curva */
      onView(vis, (ms) => {
        const t = (ms % 13000) / 13000;
        if (t > .97) { ov.draw({ frames: [], hl: null }); return; }
        if (t < .42) { const gf = growFrames(TUT, t, [.04, .16, .28], .07); ov.draw({ frames: gf.frames, hl: gf.newest, handles: true, vector: false }); return; }
        if (t < .5) { ov.draw({ frames: TUT, hl: null, handles: false, vector: false, path: null }); return; }
        const m1 = smooth(t, .56, .72) - smooth(t, .8, .93), kf = [TUT[0], [TUT[1][0] + 120 * m1, TUT[1][1] - 150 * m1, TUT[1][2]], TUT[2]];
        ov.draw({ frames: kf, path: pathOf(kf), hl: 1, handles: true, vector: true });
      }, () => ov.draw({ frames: TUT, path: pathOf(TUT), hl: null, handles: false, vector: true }));
    }
    else if (kind === 'format') {
      const st = new Stage(vis, 'caminho', 1.6); st.svg.style.cssText = 'position:absolute;inset:0;width:100%;height:100%'; st.cam(800, 500, 1000);
      const o = document.createElementNS(NS, 'svg'); o.setAttribute('viewBox', '0 0 160 100'); o.setAttribute('preserveAspectRatio', 'none'); o.setAttribute('aria-hidden', 'true'); o.style.cssText = 'position:absolute;inset:0;width:100%;height:100%';
      o.innerHTML = '<path id="fd" fill-rule="evenodd" fill="rgba(0,0,0,.55)"/><rect id="fr" rx="3" fill="none" stroke="#04fff2" stroke-width="1.6"/>';
      vis.appendChild(o);
      const lb = document.createElement('div'); lb.className = 'fmtlbl'; lb.innerHTML = '<span></span>'; vis.appendChild(lb);
      const FM = [[142, 80, 'YouTube · 16:9'], [45, 80, 'Reels, Stories e TikTok · 9:16'], [80, 80, 'Post do Instagram · 1:1']];
      const fd = $('#fd', o), fr = $('#fr', o), tx = $('span', lb);
      const put = (w, h) => { const x = 80 - w / 2, y = 46 - h / 2; fr.setAttribute('x', x.toFixed(1)); fr.setAttribute('y', y.toFixed(1)); fr.setAttribute('width', w.toFixed(1)); fr.setAttribute('height', h.toFixed(1)); fd.setAttribute('d', 'M0 0H160V100H0Z M' + x.toFixed(1) + ' ' + y.toFixed(1) + 'h' + w.toFixed(1) + 'v' + h.toFixed(1) + 'h' + (-w).toFixed(1) + 'Z'); };
      put(FM[0][0], FM[0][1]); tx.textContent = FM[0][2];
      onView(vis, (ms) => {
        const seg = 3000, k = Math.floor(ms / seg) % 3, n = (k + 1) % 3, t = smooth((ms % seg) / seg, .72, .98);
        put(FM[k][0] + (FM[n][0] - FM[k][0]) * t, FM[k][1] + (FM[n][1] - FM[k][1]) * t);
        tx.textContent = FM[t > .5 ? n : k][2];
      }, () => { put(FM[0][0], FM[0][1]); tx.textContent = FM[0][2]; });
    }
    else if (kind === 'export') {
      /* exportar: o filme é "salvo no rolo de fotos" (esquema, sem arquivo real) */
      let cells = '<div class="rcell new"><i class="film"></i><b class="pb" aria-hidden="true"></b></div>';
      for (let i = 0; i < 7; i++) cells += '<div class="rcell"></div>';
      vis.insertAdjacentHTML('beforeend', '<div class="expbox"><div class="roll" aria-hidden="true">' + cells + '</div><div class="prog"><i></i></div><span class="lb"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="ck"><path d="M20 6 9 17l-5-5"/></svg><em>Seu filme</em></span></div>');
      const nc = $('.rcell.new', vis), fl = $('.film', nc), bar = $('.prog i', vis), lbl = $('.lb', vis), em = $('.lb em', vis);
      const fs = new Stage(fl, 'caminho', 1.6); fs.svg.style.cssText = 'position:absolute;inset:0;width:100%;height:100%'; fs.cam(800, 500, 1000);
      const show = (v, done) => { bar.style.transform = 'scaleX(' + v.toFixed(3) + ')'; nc.style.opacity = done ? '1' : '.18'; nc.style.transform = 'scale(' + (done ? 1 : .86) + ')'; lbl.classList.toggle('ok', done); em.textContent = done ? 'Salvo no rolo de fotos' : v > 0 ? 'Exportando' : 'Seu filme'; $('.prog', vis).style.opacity = done ? '0' : '1'; };
      show(1, true);
      onView(vis, (ms) => { const t = (ms % 6000) / 6000, v = smooth(t, .06, .55); show(v, t > .6 && t < .97); if (t >= .97) show(0, false); }, () => show(1, true));
    }
    else if (kind === 'play') {
      const r = document.createElement('div'); r.className = 'player compact'; r.dataset.motion = 'tutorial'; r.dataset.aspect = '1.6'; r.dataset.title = 'Estudo: reprodução do percurso'; r.dataset.id = 'tutorial';
      vis.appendChild(r); mountPlayer(r);
    }
    else if (kind === 'adjust') {
      const ADJF = [[460, 560, 400], [900, 400, 360], [1240, 620, 300]];
      const ov = overview(vis, 'caminho', { frames: ADJF, aspect: 16 / 9, hl: 0, appStyle: true, adj: { dx: 70, dy: -30, s: 1, rot: 0 } });
      /* barra de quatro abas do menu de Frame do app: Pausa, Rotação, Escala, Posição */
      const IC = {
        pausa: '<circle cx="12" cy="12" r="9.5"/><path d="M9.5 8.2v7.6M14.5 8.2v7.6"/>',
        rot: '<path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/><circle cx="12" cy="12" r="1"/>',
        esc: '<path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M14 15H9v-5"/><path d="M16 3h5v5"/><path d="M21 3 9 15"/>',
        pos: '<path d="M12 2v20"/><path d="m15 19-3 3-3-3"/><path d="m19 9 3 3-3 3"/><path d="M2 12h20"/><path d="m5 9-3 3 3 3"/><path d="m9 5 3-3 3 3"/>'
      };
      const bar = document.createElement('div');
      bar.className = 'frametabs'; bar.setAttribute('role', 'group'); bar.setAttribute('aria-label', 'Abas do Frame selecionado (esquema)');
      const tabs = {};
      [['pausa', 'Pausa'], ['rot', 'Rotação'], ['esc', 'Escala'], ['pos', 'Posição']].forEach((t) => {
        const d = document.createElement('div'); d.className = 'ftab';
        d.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + IC[t[0]] + '</svg><span>' + t[1] + '</span>';
        bar.appendChild(d); tabs[t[0]] = d;
      });
      vis.appendChild(bar);
      const setTab = (k) => { Object.keys(tabs).forEach((n) => tabs[n].classList.toggle('on', n === k)); };
      setTab('pos');
      /* o Frame 1 é movido, redimensionado e girado, em ciclo; parado com movimento reduzido ou fora da tela */
      const ez = (t) => t * t * (3 - 2 * t), seg = (t, a, b) => ez(Math.min(1, Math.max(0, (t - a) / (b - a))));
      let raf = 0, t0 = 0;
      const frame = (now) => {
        if (!t0) t0 = now;
        const t = ((now - t0) % 8000) / 8000;
        const mv = seg(t, .04, .26) - seg(t, .9, .99), sc = seg(t, .3, .52) - seg(t, .9, .99);
        const rt = seg(t, .56, .7) - seg(t, .7, .84);
        ov.draw({ adj: { dx: 150 * mv, dy: -50 * mv, s: 1 - .2 * sc, rot: -9 * rt } });
        setTab(t < .28 ? 'pos' : t < .54 ? 'esc' : t < .86 ? 'rot' : 'pos');
        raf = requestAnimationFrame(frame);
      };
      const stop = () => { cancelAnimationFrame(raf); raf = 0; t0 = 0; ov.draw({}); setTab('pos'); };
      if (!matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window) {
        new IntersectionObserver((es) => { es.forEach((e) => { if (e.isIntersecting && !raf) raf = requestAnimationFrame(frame); else if (!e.isIntersecting && raf) stop(); }); }, { threshold: .3 }).observe(vis);
      }
    }
    else if (kind === 'choose') {
      vis.insertAdjacentHTML('beforeend', '<div style="' + flex + '"></div>');
      const f = vis.lastChild;
      thumb(f, 'cidade', [800, 500, 900]); thumb(f, 'mar', [800, 500, 900], 'outline:4px solid #04fff2;outline-offset:2px'); thumb(f, 'escada', [800, 500, 900]);
    }
    else if (kind === 'file') {
      /* imagem do movimento + o texto e o arquivo ao lado, para copiar ou salvar (esquema) */
      vis.insertAdjacentHTML('beforeend', '<div class="obtain"><div class="ob-img"></div><div class="ob-side"><div class="ob-code" aria-hidden="true"><b>movimento</b><span>4 Frames</span></div><span class="ob-btn" data-k="copy">Copiar texto</span><span class="ob-btn" data-k="save">Salvar arquivo</span></div><span class="tag sch" style="position:absolute;right:8px;top:8px">Esquema</span></div>');
      const wrap = $('.ob-img', vis); wrap.appendChild(document.createElement('div'));
      const th = thumb(wrap.parentNode, 'cidade', [900, 500, 760], 'flex:0 0 44%'); wrap.parentNode.replaceChild(th, wrap);
      const bc = $('[data-k=copy]', vis), bs = $('[data-k=save]', vis);
      const setB = (b, on, t1, t2) => { b.classList.toggle('on', on); b.textContent = on ? t2 : t1; };
      onView(vis, (ms) => { const t = (ms % 6000) / 6000; setB(bc, t > .2 && t < .48, 'Copiar texto', 'Texto copiado'); setB(bs, t > .6 && t < .9, 'Salvar arquivo', 'Arquivo salvo'); }, () => { setB(bc, false, 'Copiar texto', ''); setB(bs, false, 'Salvar arquivo', ''); });
    }
    else if (kind === 'import') {
      /* importar é quase só copiar e colar: o texto copiado cai no projeto e os Frames aparecem na obra */
      const KF = [[420, 640, 420], [860, 400, 380], [1220, 560, 380]];
      vis.insertAdjacentHTML('beforeend', '<div style="' + flex + '"><div class="ob-code mini" aria-hidden="true"><b>Texto copiado</b><span>movimento-exemplo</span></div><svg viewBox="0 0 60 24" style="width:12%;flex:none" aria-hidden="true"><path d="M2 12h48M40 3l12 9-12 9" fill="none" stroke="#04fff2" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg><div class="ob-prj"></div></div>');
      const box = $('.ob-prj', vis), ov = overview(box, 'caminho', { frames: [], aspect: 16 / 9, label: 'Sua obra recebe os Frames do movimento copiado' });
      box.firstChild.style.cssText = 'position:absolute;inset:0;width:100%;height:100%';
      ov.draw({ frames: KF });
      const code = $('.ob-code', vis), arr = $('svg', vis);
      onView(vis, (ms) => {
        const t = (ms % 6500) / 6500;
        code.classList.toggle('on', t > .05 && t < .3); arr.style.opacity = (.25 + .75 * smooth(t, .28, .4)).toFixed(2);
        const gf = growFrames(KF, t, [.42, .52, .62], .07);
        ov.draw({ frames: t > .94 ? [] : gf.frames, hl: null });
      }, () => { code.classList.remove('on'); arr.style.opacity = ''; ov.draw({ frames: KF }); });
    }
    else if (kind === 'adapt') {
      /* na sua obra: todos os Frames selecionados e escalados juntos (como no Ken Burns) */
      const KF = [[420, 640, 420], [860, 400, 380], [1220, 560, 380]];
      const ov = overview(vis, 'caminho', { frames: KF, aspect: 16 / 9, label: 'Os Frames do movimento sendo escalados juntos na sua obra' });
      onView(vis, (ms) => {
        const t = (ms % 6500) / 6500, cx = 840, cy = 530;
        const sc = 1 - .28 * smooth(t, .3, .5) + .28 * smooth(t, .6, .8);
        const fr = KF.map((f) => [cx + (f[0] - cx) * sc, cy + (f[1] - cy) * sc, f[2] * sc]);
        let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
        fr.forEach((f) => { const w = f[2] * 16 / 9; x0 = Math.min(x0, f[0] - w / 2); x1 = Math.max(x1, f[0] + w / 2); y0 = Math.min(y0, f[1] - f[2] / 2); y1 = Math.max(y1, f[1] + f[2] / 2); });
        const sel = smooth(t, .08, .2) * (1 - smooth(t, .92, .98)), pad = 22;
        const bx = '<g opacity="' + sel.toFixed(2) + '"><rect x="' + r1(x0 - pad) + '" y="' + r1(y0 - pad) + '" width="' + r1(x1 - x0 + pad * 2) + '" height="' + r1(y1 - y0 + pad * 2) + '" fill="none" stroke="#ffaa00" stroke-width="6" stroke-dasharray="22 14"/>' +
          [[x0 - pad, y0 - pad], [x1 + pad, y0 - pad], [x0 - pad, y1 + pad], [x1 + pad, y1 + pad]].map((c) => '<rect x="' + r1(c[0] - 15) + '" y="' + r1(c[1] - 15) + '" width="30" height="30" rx="6" fill="#fff" stroke="#ffaa00" stroke-width="5"/>').join('') + '</g>';
        ov.draw({ frames: fr, hl: null, handles: false, extra: bx });
      }, () => ov.draw({ frames: KF, hl: null, handles: false }));
    }
    else if (kind === 'speed' || kind === 'smart') {
      /* esquemas do tempo: velocidade constante x tempos iguais; movimento rígido x movimento inteligente */
      const sp = kind === 'speed';
      const KF = sp ? [[300, 720, 300], [520, 650, 300], [1260, 420, 300]] : [[380, 720, 300], [800, 400, 300], [1220, 700, 300]];
      const ov = overview(vis, 'caminho', { frames: KF, aspect: 16 / 9, label: sp ? 'Três Frames a distâncias diferentes' : 'Três Frames ligados por um percurso' });
      vis.insertAdjacentHTML('beforeend', '<span class="vlbl" aria-hidden="true"></span>');
      const lb = $('.vlbl', vis), TOT = 6;
      const d1 = Math.hypot(KF[1][0] - KF[0][0], KF[1][1] - KF[0][1]), d2 = Math.hypot(KF[2][0] - KF[1][0], KF[2][1] - KF[1][1]), D = d1 + d2;
      const fm = (n) => n.toFixed(1).replace('.', ',');
      const lerp2 = (a, b, f) => [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
      const curve = buildPath({ kf: KF, mode: 'curve' });
      /* posição ao longo do percurso, p de 0 a 1 */
      const posAt = (mode, p) => {
        if (mode === 'equal') { const u = p * 2, i = Math.min(1, Math.floor(u)); return lerp2(KF[i], KF[i + 1], u - i); }
        if (mode === 'const') { const s = p * D; return s <= d1 ? lerp2(KF[0], KF[1], s / d1) : lerp2(KF[1], KF[2], (s - d1) / d2); }
        if (mode === 'hard') { const u = p * 2, i = Math.min(1, Math.floor(u)), f = u - i, g = f < .25 ? 0 : (f - .25) / .75; return lerp2(KF[i], KF[i + 1], g); }
        const e = p * p * (3 - 2 * p), s = e * D; return s <= d1 ? lerp2(KF[0], KF[1], s / d1) : lerp2(KF[1], KF[2], (s - d1) / d2);
      };
      const line = (mode) => {
        let pts = '';
        if (mode === 'smooth') { for (let k = 0; k <= 60; k++) { const q = sample(curve, k / 60); pts += r1(q[0]) + ',' + r1(q[1]) + ' '; } }
        else KF.forEach((f) => { pts += f[0] + ',' + f[1] + ' '; });
        return '<polyline points="' + pts + '" fill="none" stroke="#ffaa00" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="' + (mode === 'smooth' ? '0' : '0') + '" opacity=".95"/>';
      };
      const dot = (q) => '<circle cx="' + r1(q[0]) + '" cy="' + r1(q[1]) + '" r="26" fill="#04fff2" stroke="#fff" stroke-width="7"/>';
      const MODES = sp ? ['equal', 'const'] : ['hard', 'smooth'];
      const LAB = sp ? { equal: ['Tempos iguais', '3 s + 3 s: acelera no trecho longo'], const: ['Velocidade constante', fm(TOT * d1 / D) + ' s + ' + fm(TOT * d2 / D) + ' s: tempos recalculados'] } :
        { hard: ['Sem suavização', 'freia e acelera a cada Frame'], smooth: ['Movimento inteligente', 'média das velocidades, sem trancos'] };
      const show = (mode, p) => {
        const line1 = sp ? line('flat') : line('hard');
        ov.draw({ frames: KF, hl: null, extra: line1 + dot(posAt(mode, p)) });
        lb.innerHTML = '<b>' + LAB[mode][0] + '</b><span>' + LAB[mode][1] + '</span>'; lb.classList.toggle('on', mode === MODES[1]);
      };
      show(MODES[1], 1);
      const CYC = 12000;
      onView(vis, (ms) => {
        const t = (ms % CYC) / CYC, half = t < .5 ? 0 : 1, l = (t % .5) / .5, p = clamp((l - .1) / .72, 0, 1);
        show(MODES[half], p);
      }, () => show(MODES[1], 1));
    }
    else if (kind === 'ease') {
      /* linear x easing: rastros de posições em tempos iguais mostram onde a velocidade muda */
      const X0 = 34, X1 = 286, rows = [{ y: 74, name: 'Linear', note: 'espaços iguais', f: (p) => p }, { y: 150, name: 'Com easing', note: 'espaços menores no começo e no fim', f: (p) => easeS(p) }];
      let h = '';
      rows.forEach((r) => {
        h += '<text x="' + X0 + '" y="' + (r.y - 30) + '" fill="#f6f5f0" font-family="Helvetica,Arial,sans-serif" font-size="13" font-weight="800">' + r.name + '</text><text x="' + X1 + '" y="' + (r.y - 30) + '" fill="#c6c7cd" text-anchor="end" font-family="Helvetica,Arial,sans-serif" font-size="9.5">' + r.note + '</text>' +
          '<line x1="' + X0 + '" y1="' + r.y + '" x2="' + X1 + '" y2="' + r.y + '" stroke="#5b5e68" stroke-width="3" stroke-linecap="round"/>';
        for (let k = 0; k <= 10; k++) h += '<circle cx="' + (X0 + (X1 - X0) * r.f(k / 10)).toFixed(1) + '" cy="' + r.y + '" r="4.2" fill="#ffaa00" opacity=".85"/>';
        h += '<circle class="ed" cx="' + X1 + '" cy="' + r.y + '" r="10" fill="#04fff2" stroke="#fff" stroke-width="2.5"/>';
      });
      vis.insertAdjacentHTML('beforeend', '<svg viewBox="0 0 320 200" role="img" aria-label="Duas bolinhas percorrem o mesmo caminho: a de cima em velocidade igual, a de baixo com easing, devagar no começo e no fim">' + h + '<text x="160" y="190" fill="#c6c7cd" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="9.5">Pontos laranja: onde a bolinha está em tempos iguais</text></svg>');
      const eds = $$('.ed', vis);
      const place = (p) => rows.forEach((r, i) => eds[i].setAttribute('cx', (X0 + (X1 - X0) * r.f(p)).toFixed(1)));
      place(1);
      onView(vis, (ms) => { const t = (ms % 5000) / 5000; place(clamp((t - .08) / .74, 0, 1)); }, () => place(1));
    }
    else if (kind === 'prompt') {
      /* caixa de conversa: imagem anexada, prompt em cinza e botão de enviar */
      vis.insertAdjacentHTML('beforeend', '<div class="chatbox"><div class="chat-att" aria-label="Imagem anexada"></div><div class="chat-txt" aria-label="Exemplo de prompt"><span class="t"></span><i class="cur"></i></div><span class="chat-send" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 19V6M6 12l6-6 6 6" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg></span></div>');
      const att = $('.chat-att', vis), st = new Stage(att, 'baloes', 1.6); st.svg.style.cssText = 'position:absolute;inset:0;width:100%;height:100%'; st.cam(800, 500, 1000);
      const TXT = 'Comece nos balões inteiros, aproxime-se do balão vermelho e termine no pôr do sol.', tt = $('.t', vis), snd = $('.chat-send', vis);
      tt.textContent = TXT;
      onView(vis, (ms) => {
        const t = (ms % 8000) / 8000, n = Math.floor(TXT.length * clamp((t - .05) / .6, 0, 1));
        tt.textContent = TXT.slice(0, n); snd.classList.toggle('on', t > .7 && t < .86);
      }, () => { tt.textContent = TXT; snd.classList.remove('on'); });
    }
    else if (kind === 'edit') {
      /* edição: o resultado do agente sendo refinado, com um Frame ajustado e o percurso acompanhando */
      const KF = MOT.ia.kf, ov = overview(vis, 'baloes', { frames: KF, aspect: 16 / 9, label: 'Os Frames criados pelo agente sendo ajustados' });
      vis.insertAdjacentHTML('beforeend', '<span class="vlbl on" aria-hidden="true"><b>Edição</b><span>mova, escale e gire os Frames</span></span>');
      const draw = (k) => {
        const dx = 110 * Math.sin(k * 6.2832), dy = -70 * Math.sin(k * 6.2832 * 1), s = 1 + .22 * Math.sin(k * 6.2832), rot = 6 * Math.sin(k * 6.2832);
        const kf2 = KF.map((f) => f.slice()); kf2[1] = [KF[1][0] + dx, KF[1][1] + dy, KF[1][2] * s];
        ov.draw({ frames: kf2, hl: 1, appStyle: true, path: buildPath({ kf: kf2, mode: 'curve' }), adj: { dx: 0, dy: 0, s: 1, rot: rot } });
      };
      draw(0);
      onView(vis, (ms) => draw((ms % 6000) / 6000), () => draw(0));
    }
    else if (kind === 'prepare') overview(vis, 'cidade', { frames: MOT.ia.kf, aspect: 16 / 9, path: buildPath(MOT.ia), numbers: true });
    else if (kind === 'result') {
      const r = document.createElement('div'); r.className = 'player compact'; r.dataset.motion = 'ia'; r.dataset.aspect = '1.6'; r.dataset.title = 'Estudo: resultado do prompt de exemplo';
      vis.appendChild(r); mountPlayer(r);
    }
  }

  /* ---------------- inicialização das seções ---------------- */
  function init() {
    /* passos */
    $$('.vis[data-vis]').forEach(fillVis);

    /* players simples (hero, cartões) */
    $$('.player[data-motion]').forEach((r) => { if (!r.__player && !$('.stagewrap', r)) mountPlayer(r); });

    /* 3. Ken Burns */
    if ($('#kb-pl')) (function () {
      const m = MOT.kenburns, root = $('#kb-pl'), ov = overview($('#kb-ov'), m.scene, { frames: m.kf, aspect: 16 / 9, vb: '300 0 1000 1000', label: 'Obra quadrada com quatro enquadramentos 16:9' });
      $('#kb-ov').insertAdjacentHTML('beforeend', '<span class="tag sch">Esquema</span>');
      const p = root.__player;
      root.__onCam = null;
      const box = $('#kb-chips'), chips = m.kf.map((f, i) => {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'chip'; b.textContent = 'Frame ' + (i + 1); b.setAttribute('aria-pressed', 'false');
        b.addEventListener('click', () => p.seek(uOfFrame(m, i)));
        box.appendChild(b); return b;
      });
      p.o.onCam = (cx, cy, s) => { ov.setCam(cx, cy, s, 16 / 9); mark(cx, cy, s); };
      p.render(0);
      /* antes de rodar: os quatro Frames entram um a um; depois todos são selecionados e escalados juntos; por fim, o play */
      let building = false;
      const bigp = () => $('.bigplay', root);
      onView($('#kb-ov'), (ms) => {
        if (p.state === 'playing') { if (building) { building = false; ov.draw({ frames: m.kf }); p.render(p.u); const bp = bigp(); if (bp) bp.classList.remove('pulse'); } return; }
        building = true;
        const t = (ms % 15000) / 15000;
        ov.hideCam();
        const bp = bigp(); if (bp) bp.classList.toggle('pulse', t > .88 && t < .985);
        if (t > .985) { ov.draw({ frames: [], hl: null }); return; }
        const gf = growFrames(m.kf, t, [.04, .15, .26, .37], .06);
        if (t < .46) { const last = t < .44; ov.draw({ frames: gf.frames, hl: last ? gf.newest : null, handles: last }); return; }
        /* todos os Frames agrupados: caixa de seleção e escala conjunta em torno do centro do grupo */
        const sc = 1 - .3 * smooth(t, .54, .68) + .3 * smooth(t, .72, .86), cx = 800, cy = 500;
        const fr = m.kf.map((f) => [cx + (f[0] - cx) * sc, cy + (f[1] - cy) * sc, f[2] * sc]);
        let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
        fr.forEach((f) => { const w = f[2] * 16 / 9; x0 = Math.min(x0, f[0] - w / 2); x1 = Math.max(x1, f[0] + w / 2); y0 = Math.min(y0, f[1] - f[2] / 2); y1 = Math.max(y1, f[1] + f[2] / 2); });
        const sel = smooth(t, .47, .52), pad = 22;
        const box = '<g opacity="' + sel.toFixed(2) + '"><rect x="' + r1(x0 - pad) + '" y="' + r1(y0 - pad) + '" width="' + r1(x1 - x0 + pad * 2) + '" height="' + r1(y1 - y0 + pad * 2) + '" fill="none" stroke="#ffaa00" stroke-width="6" stroke-dasharray="22 14"/>' +
          [[x0 - pad, y0 - pad], [x1 + pad, y0 - pad], [x0 - pad, y1 + pad], [x1 + pad, y1 + pad]].map((c) => '<rect x="' + r1(c[0] - 15) + '" y="' + r1(c[1] - 15) + '" width="30" height="30" rx="6" fill="#fff" stroke="#ffaa00" stroke-width="5"/>').join('') + '</g>';
        ov.draw({ frames: fr, hl: null, handles: false, extra: box });
      }, () => { if (building) { building = false; ov.draw({ frames: m.kf, hl: null, handles: false }); p.render(p.u); } });
      function mark(cx, cy, s) {
        let best = 0, bd = 1e9;
        m.kf.forEach((f, i) => { const d = Math.hypot(f[0] - cx, f[1] - cy) + Math.abs(Math.log(f[2] / s)) * 600; if (d < bd) { bd = d; best = i; } });
        chips.forEach((c, i) => c.setAttribute('aria-pressed', i === best ? 'true' : 'false'));
      }
    })();

    /* 4. Camadas */
    if ($('#par-pl')) (function () {
      explode($('#xl'), 'paisagem', [0, 1, 2, 3]);
      /* vista explodida em perspectiva: as quatro camadas empilhadas em profundidade, com leve balanço */
      (function () {
        const xl = $('#xl'), pls = [].slice.call(xl.querySelectorAll('.pl')), st = document.createElement('div');
        st.className = 'stack3d';
        pls.forEach((p, i) => { p.style.left = ''; p.style.top = ''; p.style.zIndex = ''; p.style.setProperty('--i', i); st.appendChild(p); });
        xl.appendChild(st);
        xl.insertAdjacentHTML('beforeend', '<div class="depth" aria-hidden="true"><span>Mais perto</span><i></i><span>Mais longe</span></div>');
        xl.classList.add('persp');
        /* a profundidade sendo ajustada: uma camada de cada vez (a selecionada) é puxada para a frente e volta */
        onView(xl, (ms) => {
          const t = (ms % 9000) / 9000, sel = 1 + Math.min(2, Math.floor(t * 3)), u = (t * 3) % 1, d = 120 * Math.sin(Math.PI * smooth(u, .08, .92));
          pls.forEach((pl, i) => { pl.style.transform = 'translateZ(' + (i * 58 + (i === sel ? d : 0)).toFixed(1) + 'px)'; pl.classList.toggle('sel', i === sel); });
        }, () => pls.forEach((pl) => { pl.style.transform = ''; pl.classList.remove('sel'); }));
        if ('IntersectionObserver' in window) new IntersectionObserver((es) => { es.forEach((e) => st.classList.toggle('on', e.isIntersecting)); }, { threshold: .2 }).observe(xl);
      })();
      $('#xl').insertAdjacentHTML('beforeend', '<span class="tag sch" style="position:absolute;right:10px;top:10px;z-index:9">Esquema</span>');
      const p = $('#par-pl').__player, st = p.stages[0], sw = $('#par-sw'), lb = $('#par-lbl');
      sw.addEventListener('click', () => {
        const on = sw.getAttribute('aria-checked') !== 'true';
        sw.setAttribute('aria-checked', on ? 'true' : 'false'); lb.textContent = on ? 'Parallax ligado' : 'Parallax desligado'; st.setParallax(on);
      });
    })();

    /* 5. Percurso à mão x curva vetorial */
    if ($('#mao-pl')) (function () {
      const root = $('#mao-pl'), p = root.__player, host = $('#mao-ov');
      const sim = drawSim(host);
      p.render(0);
      const bh = $('#m-hand'), bv = $('#m-vec');
      function setMode(vec) {
        const m = vec ? MOT.vector : MOT.hand;
        bh.setAttribute('aria-pressed', vec ? 'false' : 'true'); bv.setAttribute('aria-pressed', vec ? 'true' : 'false');
        sim.setMode(vec ? 'pen' : 'pencil');
        p.setMotion(m);
      }
      bh.addEventListener('click', () => setMode(false)); bv.addEventListener('click', () => setMode(true));
    })();

    /* 7. Formatos */
    if ($('#fmts')) (function () {
      const FM = [['YouTube', '16:9', 16 / 9, 230], ['TikTok', '9:16', 9 / 16, 230], ['Stories', '9:16', 9 / 16, 230], ['Post do Instagram', '4:5', 4 / 5, 230], ['Post do Instagram', '1:1', 1, 230]];
      const host = $('#fmts'), stages = [];
      FM.forEach((f) => {
        const fig = document.createElement('figure'); fig.className = 'fmt'; fig.style.setProperty('--ar', f[2]);
        const w = document.createElement('div'); w.className = 'stagewrap'; w.style.setProperty('--ar', f[2]); w.setAttribute('role', 'img'); w.setAttribute('aria-label', 'Estudo enquadrado em ' + f[0] + ' ' + f[1]);
        fig.appendChild(w);
        fig.insertAdjacentHTML('beforeend', '<figcaption><b>' + f[0] + '</b>' + f[1] + '</figcaption>');
        host.appendChild(fig); stages.push(new Stage(w, 'paisagem', f[2]));
      });
      const b = bar($('#fmts-bar'), false, true);
      const p = new Player({ root: $('#fmts-bar'), stages: stages, motion: MOT.formats, ui: { pp: b.pp, seek: b.seek, big: null } });
      p.ui();
    })();

    /* 11. Abas */
    if ($('#tabs')) (function () {
      /* cada tipo de trabalho traz um carrossel com vários exemplos (estudos); fotografia (inclusive paisagem fotográfica) fica fora: é outra linguagem e entra só com fotos reais */
      const T = [
        ['Ilustração', [['x_infantil', 'Estudo de ilustração: menina e balão'], ['xi2', 'Estudo de ilustração: rio de outono'], ['xi3', 'Estudo de ilustração: lagoa dos patos']]],
        ['Pintura', [['x_paisagem', 'Estudo de pintura: montanhas e sol'], ['xp2', 'Estudo de pintura: aproximação do sol'], ['xp3', 'Estudo de pintura: vale e flores']]],
        ['Apresentações', [['x_arq', 'Estudo de apresentação: elevação de arquitetura'], ['xa2', 'Estudo de apresentação: cotas e escala humana'], ['xa3', 'Estudo de apresentação: janela e porta']]],
        ['Tutoriais', [['x_tut', 'Estudo de tutorial: do conjunto a cada detalhe'], ['xt2', 'Estudo de tutorial: os balões, um a um'], ['xt3', 'Estudo de tutorial: o rio, a ponte e a casinha']]],
        ['Fotografia', [['@foto', 'Fotografia']]],
        ['Design gráfico', [['x_cartaz', 'Estudo de design gráfico: cartaz com texto'], ['xc2', 'Estudo de design gráfico: detalhes e faixas'], ['xc3', 'Estudo de design gráfico: varredura']]]
      ];
      const tabs = $('#tabs'), panels = $('#tabpanels'), btns = [], pans = [];
      function show(i, focus) {
        if (CURRENT) CURRENT.pause();
        btns.forEach((b, k) => { b.setAttribute('aria-selected', k === i ? 'true' : 'false'); b.tabIndex = k === i ? 0 : -1; pans[k].hidden = k !== i; });
        if (pans[i].__go) pans[i].__go(pans[i].__cur || 0);
        if (focus) btns[i].focus();
      }
      T.forEach((t, i) => {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'chip'; b.setAttribute('role', 'tab'); b.id = 'tab' + i; b.setAttribute('aria-controls', 'pan' + i); b.textContent = t[0];
        b.addEventListener('click', () => show(i));
        b.addEventListener('keydown', (e) => {
          let n = null;
          if (e.key === 'ArrowRight') n = (i + 1) % T.length; else if (e.key === 'ArrowLeft') n = (i + T.length - 1) % T.length; else if (e.key === 'Home') n = 0; else if (e.key === 'End') n = T.length - 1;
          if (n !== null) { e.preventDefault(); show(n, true); }
        });
        tabs.appendChild(b); btns.push(b);
        const d = document.createElement('div');
        d.setAttribute('role', 'tabpanel'); d.id = 'pan' + i; d.setAttribute('aria-labelledby', 'tab' + i); d.className = 'tabpanel';
        const items = t[1];
        d.innerHTML = items.map((it, k) => it[0] === '@foto' ? '<div class="exitem" hidden><div class="slot"><div><b>Fotografia</b><p>Espaço para as suas fotos reais. Envie as fotografias e o movimento é montado sobre elas, com o mesmo controle de enquadramentos e curvas. O parallax só entra quando a foto tem camadas.</p></div></div></div>' : '<div class="exitem" hidden><div class="player" data-id="' + it[0] + '" data-motion="' + it[0] + '" data-aspect="16/9" data-title="' + it[1] + '"></div></div>').join('') +
          '<div class="carbar"' + (items.length < 2 ? ' hidden' : '') + ' role="group" aria-label="Exemplos de ' + t[0] + '"><button type="button" class="chip cprev" aria-label="Exemplo anterior">Anterior</button><span class="cnt" aria-live="polite"></span><button type="button" class="chip cnext" aria-label="Próximo exemplo">Próximo</button></div>';
        const els = $$('.exitem', d), cnt = $('.cnt', d);
        d.__go = (k) => {
          k = (k + items.length) % items.length; d.__cur = k;
          if (CURRENT) CURRENT.pause();
          els.forEach((e, n) => { e.hidden = n !== k; });
          const pl = $('.player', els[k]);
          if (pl && !pl.__player && !$('.stagewrap', pl)) mountPlayer(pl);
          cnt.textContent = 'Exemplo ' + (k + 1) + ' de ' + items.length + ' · ' + items[k][1].replace(/^Estudo (de |conceitual: |)/, '');
        };
        $('.cprev', d).addEventListener('click', () => d.__go(d.__cur - 1));
        $('.cnext', d).addEventListener('click', () => d.__go(d.__cur + 1));
        panels.appendChild(d); pans.push(d);
      });
      show(0);
    })();

    /* 12. Lista demonstrativa (não envia nem guarda nada) */
    if ($('#signup')) (function () {
      const f = $('#signup'), em = $('#em'), msg = $('#msg');
      f.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!em.value || !em.checkValidity()) { msg.textContent = 'Digite um e-mail válido para testar a demonstração.'; em.focus(); return; }
        if (!f.querySelector('input[name=interesse]:checked')) {
          msg.textContent = 'Escolha pelo menos um interesse para testar a demonstração.';
          f.querySelector('input[name=interesse]').focus();
          return;
        }
        f.reset();
        msg.textContent = 'Demonstração: nada foi enviado nem guardado.';
      });
    })();
  }

  init();
})();
