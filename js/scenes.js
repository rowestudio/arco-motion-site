/* Arco Motion — estudos de movimento
   Seis ilustrações originais, desenhadas em SVG para este protótipo.
   São ESTUDOS para revisar composição: não são obras de artistas,
   não são gravações nem exportações do aplicativo. */
(function () {
  'use strict';

  function rng(seed) {
    let s = seed >>> 0 || 1;
    return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  }
  const R = (x, y, w, h, f, o) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f}" ${o || ''}/>`;
  const C = (x, y, r, f, o) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${f}" ${o || ''}/>`;
  const E = (x, y, rx, ry, f, o) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${f}" ${o || ''}/>`;
  const P = (d, f, o) => `<path d="${d}" fill="${f}" ${o || ''}/>`;
  const G = (pts, f, o) => `<polygon points="${pts}" fill="${f}" ${o || ''}/>`;
  const L = (d, s, w, o) => `<path d="${d}" fill="none" stroke="${s}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" ${o || ''}/>`;

  /* ---------- A. Paisagem em camadas ---------- */
  function paisagem() {
    const r = rng(11);
    /* pontilhado de grão: um único path de pontos redondos (leve para animar) */
    const dots = function (pts, color, size, op) {
      let d = '';
      pts.forEach(function (p) { d += 'M' + p[0].toFixed(0) + ' ' + p[1].toFixed(0) + 'h0'; });
      return `<path d="${d}" fill="none" stroke="${color}" stroke-width="${size}" stroke-linecap="round" opacity="${op || 1}"/>`;
    };
    /* gradiente de pontos ao longo de uma faixa: densos junto à sombra, rareando para a luz */
    const band = function (x0, x1, y0, y1, n, test, size, color, op) {
      const pts = [];
      for (let i = 0; i < n; i++) {
        const x = x0 + r() * (x1 - x0), y = y0 + r() * (y1 - y0), p = test(x, y);
        if (p > 0 && r() < p) pts.push([x, y]);
      }
      return dots(pts, color, size, op);
    };
    const cloud = (x, y, k, f) => P(`M${x - 110 * k} ${y + 22 * k} C${x - 130 * k} ${y - 6 * k} ${x - 80 * k} ${y - 26 * k} ${x - 52 * k} ${y - 10 * k} C${x - 40 * k} ${y - 52 * k} ${x + 20 * k} ${y - 56 * k} ${x + 34 * k} ${y - 16 * k} C${x + 62 * k} ${y - 34 * k} ${x + 112 * k} ${y - 10 * k} ${x + 100 * k} ${y + 22 * k}Z`, f);
    const bird = (x, y, k) => L(`M${x} ${y} q${10 * k} ${-12 * k} ${20 * k} 0 q${10 * k} ${-12 * k} ${20 * k} 0`, '#6b3a3a', 4);
    const sunSpots = band(1030, 1270, 350, 480, 260, function (x, y) { const d = Math.hypot(x - 1150, y - 360); return d < 108 ? Math.min(1, (y - 350) / 120 + (x - 1050) / 400) * .9 : 0; }, 4, '#c84a12', .75);
    const sky = R(-800, -500, 3200, 1500, '#f8e9cd') + R(-800, 470, 3200, 300, '#f6dcae') +
      C(1150, 360, 215, '#f6b87c', 'opacity=".25"') + C(1150, 360, 108, '#f26a22') + sunSpots +
      cloud(300, 215, 1, '#d4e9e2') + cloud(780, 130, .75, '#d4e9e2') + cloud(1560, 175, .95, '#d4e9e2') + cloud(1980, 270, 1.1, '#d4e9e2') + cloud(-250, 300, 1, '#d4e9e2') +
      bird(640, 270, 1) + bird(715, 232, .8) + bird(575, 208, .7) + bird(1520, 330, .9);

    /* montanha de topo arredondado, com lado em sombra de borda ondulada e pontilhado de transição */
    const mountain = function (cx, top, hw, base, light, dark, dotCol, side) {
      const h = base - top, k = side || 1;
      const body = `M${cx - hw} ${base} C${cx - hw * .5} ${base - h * .5} ${cx - hw * .3} ${top + 10} ${cx} ${top} C${cx + hw * .22} ${top - 2} ${cx + hw * .5} ${top + h * .5} ${cx + hw} ${base}Z`;
      const cl = function (y) { return cx + k * (hw * .02 + hw * .08 * Math.sin((y - top) / h * 8.2)); };
      const sh = `M${cx} ${top} C${cx + k * hw * .22} ${top - 2} ${cx + k * hw * .5} ${top + h * .5} ${cx + k * hw} ${base} L${cx + k * hw * .06} ${base} C${cx - k * hw * .1} ${top + h * .85} ${cx + k * hw * .14} ${top + h * .66} ${cx + k * hw * .02} ${top + h * .5} C${cx - k * hw * .1} ${top + h * .36} ${cx + k * hw * .08} ${top + h * .2} ${cx} ${top}Z`;
      const stip = band(cx - hw * .5, cx + hw * .5, top + h * .08, base, 460, function (x, y) {
        const c = cl(y), d = (c - x) * k, w = hw * (.18 + .1 * ((y - top) / h)), half = hw * Math.pow((y - top) / h, .85) * .9;
        return (d > 0 && d < w && Math.abs(x - cx) < half) ? 1 - d / w : 0;
      }, 4.5, dotCol, .85);
      return P(body, light) + P(sh, dark) + stip;
    };
    const far = mountain(450, 318, 560, 800, '#8ccbc6', '#3f9792', '#3f9792') +
      mountain(1330, 410, 500, 800, '#8ccbc6', '#3f9792', '#3f9792', -1) +
      mountain(-130, 520, 470, 820, '#2f8b7f', '#16574f', '#16574f') +
      mountain(960, 560, 440, 830, '#2f8b7f', '#16574f', '#16574f', -1) +
      mountain(1900, 520, 480, 820, '#2f8b7f', '#16574f', '#16574f');

    const round = (x, y, k, f, f2) => R(x - 5 * k, y - 22 * k, 10 * k, 34 * k, '#5a2d22') + E(x, y - 56 * k, 36 * k, 46 * k, f) + E(x + 12 * k, y - 66 * k, 18 * k, 22 * k, f2);
    const cypress = (x, y, k, f) => R(x - 3 * k, y - 8 * k, 6 * k, 14 * k, '#5a2d22') + E(x, y - 52 * k, 15 * k, 52 * k, f);
    let trees = '';
    [[120, '#e8742a', '#f4a13a'], [230, '#f0b232', '#f7cf62'], [700, '#e8742a', '#f4a13a'], [900, '#f0b232', '#f7cf62'], [1330, '#c9552a', '#e8742a'], [1700, '#f0b232', '#f7cf62'], [-90, '#e8742a', '#f4a13a']].forEach(function (t, i) {
      const k = .85 + r() * .5, y = 692 + r() * 26;
      trees += round(t[0], y, k, t[1], t[2]) + band(t[0] - 40 * k, t[0] + 40 * k, y - 100 * k, y - 20 * k, 70, function (x, yy) { return Math.hypot((x - t[0]) / (36 * k), (yy - (y - 56 * k)) / (46 * k)) < .9 ? .5 : 0; }, 3.5, '#b63f1a', .5);
    });
    [[330, 1.1], [790, 1], [1010, 1.15], [1450, 1], [1580, .9], [-200, 1]].forEach(function (t) { trees += cypress(t[0], 696 + r() * 20, t[1], '#17604f'); });
    const hillShade = band(-500, 1900, 700, 800, 520, function (x, y) { const e = 760 + 34 * Math.sin(x / 190); return y > e - 40 && y < e + 40 ? Math.min(1, (y - (e - 40)) / 80) * .8 : 0; }, 4, '#1c6e61', .8);
    const mid = P('M-800 700 C-300 590 250 660 650 700 S1300 610 1800 690 S2200 640 2400 660 L2400 1100 L-800 1100Z', '#f2b236') +
      P('M820 780 C960 650 1260 640 1480 740 L1480 900 L820 900Z', '#ef7b2c') +
      P('M-800 740 C-250 650 280 690 700 706 S1500 700 2400 760 L2400 1100 L-800 1100Z', '#2f8b7f') + hillShade + trees +
      /* casa: paredes creme, telhado laranja, porta em arco */
      R(440, 612, 138, 88, '#fbf0dc') + R(440, 612, 38, 88, '#f0dcb8') + P('M425 616 L500 548 L593 616Z', '#e8582a') + P('M500 548 L593 616 L545 616Z', '#cf4620') + R(548, 560, 22, 40, '#e8582a') +
      P('M496 700 L496 662 Q510 640 524 662 L524 700Z', '#e8742a') + R(540, 636, 22, 24, '#f6c64d') + R(446, 636, 18, 22, '#f6c64d') +
      C(559, 534, 11, '#ffffff', 'opacity=".75"') + C(574, 510, 15, '#ffffff', 'opacity=".6"') + C(598, 482, 20, '#ffffff', 'opacity=".45"');
    let flowers = '';
    const daisy = function (x, y, k) {
      let p = L(`M${x} ${y + 120 * k} q${(r() * 16 - 8) * k} ${-60 * k} 0 ${-120 * k}`, '#12493f', 7 * k) + P(`M${x} ${y + 70 * k} q${30 * k} ${-24 * k} ${54 * k} ${-6 * k} q${-26 * k} ${30 * k} ${-54 * k} ${6 * k}Z`, '#1a6a58');
      const a0 = r() * 40;
      for (let i = 0; i < 8; i++) p += `<ellipse cx="${x}" cy="${y - 34 * k}" rx="${14 * k}" ry="${36 * k}" fill="#fff7e8" transform="rotate(${a0 + i * 45} ${x} ${y})"/>`;
      return p + C(x, y, 17 * k, '#f6a823') + C(x + 4 * k, y + 4 * k, 8 * k, '#e8782a', 'opacity=".55"');
    };
    [[110, 900, 1.1], [300, 960, .9], [520, 990, 1], [1000, 970, .85], [1230, 930, 1.05], [1420, 985, 1], [1560, 900, 1.1]].forEach(function (f) { flowers += daisy(f[0], f[1], f[2]); });
    const rn = 'M525 705 C590 790 385 850 565 930 C645 980 600 1010 640 1070';
    const near = P('M-800 830 C-200 780 400 870 900 830 S1700 790 2400 850 L2400 1200 L-800 1200Z', '#1d6f5f') +
      band(-300, 2000, 800, 900, 420, function (x, y) { const e = 835 + 30 * Math.sin(x / 240); return y > e && y < e + 70 ? 1 - (y - e) / 70 : 0; }, 4, '#0f4a41', .75) +
      L(rn, '#7cc3e6', 40) + L('M522 760 C560 800 470 830 520 870', '#e9f6fb', 6) + L('M580 905 C610 930 585 960 615 990', '#e9f6fb', 6) +
      P('M-120 1060 C-60 870 20 780 60 740 C140 830 190 950 230 1060Z', '#e8602a') + band(60, 230, 780, 1060, 230, function (x, y) { return x > 70 + (y - 780) * .12 && x < 70 + (y - 780) * .12 + 70 ? .8 : 0; }, 4.5, '#b43d12', .8) +
      P('M1500 1080 C1470 880 1520 780 1560 730 C1640 820 1690 960 1710 1080Z', '#e8602a') + flowers;
    return [{ name: 'Céu e sol', f: .85, svg: sky }, { name: 'Montanhas', f: .55, svg: far }, { name: 'Colina e casa', f: .25, svg: mid }, { name: 'Primeiro plano', f: 0, svg: near }];
  }

  /* ---------- ferramentas de pontilhado (mesmo estilo da paisagem) ---------- */
  function tools(seed) {
    const r = rng(seed);
    const dots = function (pts, color, size, op) {
      let d = '';
      pts.forEach(function (p) { d += 'M' + p[0].toFixed(0) + ' ' + p[1].toFixed(0) + 'h0'; });
      return `<path d="${d}" fill="none" stroke="${color}" stroke-width="${size}" stroke-linecap="round" opacity="${op || 1}"/>`;
    };
    const band = function (x0, x1, y0, y1, n, test, size, color, op) {
      const pts = [];
      for (let i = 0; i < n; i++) {
        const x = x0 + r() * (x1 - x0), y = y0 + r() * (y1 - y0), p = test(x, y);
        if (p > 0 && r() < p) pts.push([x, y]);
      }
      return dots(pts, color, size, op);
    };
    /* colina de borda suave: preenchimento + pontilhado junto à crista */
    const hill = function (edge, x0, x1, bottom, fill, dotCol, n, w, size) {
      let d = 'M' + x0 + ' ' + bottom + 'L' + x0 + ' ' + edge(x0).toFixed(0);
      for (let x = x0 + 40; x <= x1; x += 40) d += 'L' + x + ' ' + edge(x).toFixed(0);
      d += 'L' + x1 + ' ' + bottom + 'Z';
      return P(d, fill) + band(x0, x1, 0, bottom, n, function (x, y) { const e = edge(x); return y > e + 4 && y < e + w ? 1 - (y - e) / w : 0; }, size || 4, dotCol, .8);
    };
    return { r: r, dots: dots, band: band, hill: hill };
  }

  /* ---------- recursos de desenho macio (referências: formas orgânicas, copas com galhos, flores, degradês, grão) ---------- */
  const hexRGB = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const mixC = (a, b, t) => { const A = hexRGB(a), B = hexRGB(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
  /* degradê vertical por faixas finas (sem defs, funciona em qualquer recorte de camada) */
  function grad(y0, y1, stops, x0, w, n) {
    n = n || 30; let out = ''; const h = (y1 - y0) / n;
    for (let i = 0; i < n; i++) {
      const t = (i + .5) / n; let c = stops[stops.length - 1][1];
      for (let k = 0; k < stops.length - 1; k++) if (t >= stops[k][0] && t <= stops[k + 1][0]) { c = mixC(stops[k][1], stops[k + 1][1], (t - stops[k][0]) / (stops[k + 1][0] - stops[k][0])); break; }
      out += `<rect x="${x0}" y="${(y0 + i * h).toFixed(1)}" width="${w}" height="${(y1 - y0 - i * h + 1).toFixed(1)}" fill="${c}"/>`;
    }
    return out;
  }
  /* colina em cúpula suave, com lado em sombra de borda ondulada e pontilhado */
  function dome(T, cx, top, hw, base, light, dark, dotCol, side) {
    const h = base - top, k = side || 1;
    const body = `M${cx - hw} ${base} C${cx - hw * .85} ${base - h * .2} ${cx - hw * .5} ${top} ${cx} ${top} C${cx + hw * .5} ${top} ${cx + hw * .85} ${base - h * .2} ${cx + hw} ${base}Z`;
    const sh = `M${cx} ${top} C${cx + k * hw * .5} ${top} ${cx + k * hw * .85} ${base - h * .2} ${cx + k * hw} ${base} L${cx + k * hw * .22} ${base} C${cx + k * hw * .3} ${top + h * .8} ${cx + k * hw * .05} ${top + h * .6} ${cx + k * hw * .14} ${top + h * .42} C${cx + k * hw * .2} ${top + h * .24} ${cx + k * hw * .04} ${top + h * .1} ${cx} ${top}Z`;
    const stip = T.band(cx - hw * .4, cx + hw * .8, top, base, 360, function (x, y) { const half = hw * Math.min(1, .35 + (y - top) / h * .75), d = (x - cx) * k / half; return (d > .02 && d < .6) ? 1 - Math.abs(d - .28) / .4 : 0; }, 4.5, dotCol, .75);
    return P(body, light) + P(sh, dark) + stip;
  }
  /* árvore de copa fofa com tronco e galhos à vista */
  function leafTree(r, x, y, k, c1, c2, tr) {
    let cr = E(x, y - 178 * k, 58 * k, 70 * k, c1) + E(x - 40 * k, y - 142 * k, 40 * k, 46 * k, c1) + E(x + 42 * k, y - 146 * k, 42 * k, 48 * k, c1) + E(x + 8 * k, y - 206 * k, 34 * k, 40 * k, c2, 'opacity=".6"');
    for (let i = 0; i < 12; i++) { const lx = x + (r() * 100 - 50) * k, ly = y - (120 + r() * 120) * k; cr += E(lx, ly, 6 * k, 11 * k, c2, `opacity=".7" transform="rotate(${(r() * 140 - 70).toFixed(0)} ${lx.toFixed(0)} ${ly.toFixed(0)})"`); }
    return L(`M${x} ${y} C${x - 4 * k} ${y - 60 * k} ${x + 3 * k} ${y - 120 * k} ${x} ${y - 175 * k}`, tr, 10 * k) + cr + L(`M${x} ${y - 70 * k} L${x - 30 * k} ${y - 118 * k} M${x} ${y - 98 * k} L${x + 32 * k} ${y - 146 * k} M${x} ${y - 130 * k} L${x - 18 * k} ${y - 158 * k}`, tr, 5 * k);
  }
  const petal5 = (x, y, k, f, rot, rx, ry) => { let s = ''; for (let i = 0; i < 5; i++) s += `<ellipse cx="${x}" cy="${(y - ry * .8 * k).toFixed(1)}" rx="${(rx * k).toFixed(1)}" ry="${(ry * k).toFixed(1)}" fill="${f}" transform="rotate(${(rot + i * 72).toFixed(0)} ${x} ${y})"/>`; return s; };
  const daisy = (x, y, k, r) => L(`M${x} ${y + 110 * k} q${(r() * 16 - 8) * k} ${-55 * k} 0 ${-110 * k}`, '#12493f', 6 * k) + P(`M${x} ${y + 70 * k} q${28 * k} ${-24 * k} ${50 * k} ${-6 * k} q${-24 * k} ${28 * k} ${-50 * k} ${6 * k}Z`, '#1a6a58') + petal5(x, y, k, '#fff7e8', r() * 72, 15, 30) + C(x, y, 13 * k, '#f6a823');
  const poppy = (x, y, k, f, r) => L(`M${x} ${y + 110 * k} q${(r() * 14 - 7) * k} ${-55 * k} 0 ${-110 * k}`, '#12493f', 6 * k) + petal5(x, y, k, f, r() * 72, 20, 24) + C(x, y, 8 * k, '#2a1a14');
  const cloudS = (x, y, k, f) => P(`M${x - 110 * k} ${y + 24 * k} C${x - 134 * k} ${y - 6 * k} ${x - 80 * k} ${y - 30 * k} ${x - 50 * k} ${y - 10 * k} C${x - 40 * k} ${y - 56 * k} ${x + 24 * k} ${y - 60 * k} ${x + 36 * k} ${y - 16 * k} C${x + 66 * k} ${y - 36 * k} ${x + 118 * k} ${y - 10 * k} ${x + 104 * k} ${y + 24 * k}Z`, f);

  /* ---------- B. Menina e balão (lúdico, dia) ---------- */
  function raposa() {
    const T = tools(5), r = T.r, band = T.band, dots = T.dots, hill = T.hill;
    const sunShade = band(205, 395, 130, 310, 240, function (x, y) { const d = Math.hypot(x - 300, y - 220); return d < 90 ? Math.min(1, ((x - 300) + (y - 220) + 90) / 200) * .8 : 0; }, 4, '#f2a24a', .6);
    const sky = grad(-500, 900, [[0, '#9fd6d6'], [.5, '#cfe9dc'], [.8, '#f8e8c8'], [1, '#f9d6b8']], -800, 3200, 36) +
      cloudS(1500, 200, 1, '#ffffff') + cloudS(760, 130, .7, '#ffffff') + cloudS(-120, 300, .9, '#fff6ea') + cloudS(1900, 330, .8, '#fff6ea') +
      C(300, 220, 170, '#fbe0a0', 'opacity=".2"') + C(300, 220, 128, '#fbe0a0', 'opacity=".3"') + C(300, 220, 92, '#f9c85a') + sunShade;
    const e1 = function (x) { return 690 + 50 * Math.sin(x / 270) + 22 * Math.sin(x / 120); };
    const e2 = function (x) { return 810 + 36 * Math.sin(x / 220 + 1) + 14 * Math.sin(x / 90); };
    const far = hill(e1, -800, 2400, 1100, '#a8d8b0', '#7fbf93', 520, 80, 4) + hill(e2, -800, 2400, 1100, '#7cc592', '#5aa878', 460, 70, 4);
    let trees = '', bf = '';
    [[-100, .6], [180, .72], [1480, .66], [1720, .72], [-300, .6]].forEach(function (t, i) { trees += leafTree(r, t[0], 840 + r() * 20, t[1], i % 2 ? '#f2a0a0' : '#8fd0a0', i % 2 ? '#f8c4b8' : '#b5e0b8', '#7a4a3a'); });
    for (let i = 0; i < 9; i++) { const bx = 120 + r() * 1400, by = 420 + r() * 380; bf += E(bx - 9, by, 11, 7, '#f8a8c0', `transform="rotate(-25 ${bx} ${by})"`) + E(bx + 9, by, 11, 7, '#f8c85a', `transform="rotate(25 ${bx} ${by})"`) + R(bx - 1.5, by - 6, 3, 12, '#6b3a3a'); }
    /* menina com coroa, vestido e balão */
    const girl = R(838, 880, 34, 70, '#f3c4a0', 'rx="14"') + R(928, 880, 34, 70, '#f3c4a0', 'rx="14"') +
      E(852, 956, 34, 18, '#c8483a') + E(946, 956, 34, 18, '#c8483a') +
      P('M846 610 C790 700 764 800 752 888 C840 912 960 912 1048 888 C1036 800 1010 700 954 610Z', '#2f9a8c') +
      P('M846 610 C790 700 764 800 752 888 C790 898 830 904 860 906 C850 800 850 700 846 610Z', '#00000014') +
      L('M760 862 C840 884 960 884 1040 862', '#f8e0a0', 10) + C(850, 780, 11, '#f8e0a0') + C(920, 740, 11, '#f8e0a0') + C(980, 810, 11, '#f8e0a0') + C(900, 836, 11, '#f8e0a0') +
      L('M838 660 C800 700 790 740 800 780', '#f3c4a0', 28) + L('M958 650 C1000 640 1010 590 1004 552', '#f3c4a0', 28) + C(1004, 548, 19, '#f3c4a0') +
      E(900, 505, 104, 110, '#7a3f2a') + E(808, 560, 28, 60, '#7a3f2a') + E(992, 560, 28, 60, '#7a3f2a') +
      E(900, 532, 88, 92, '#f6cfae') + P('M812 500 C830 440 880 420 920 424 C960 428 988 460 990 506 C960 470 900 462 812 500Z', '#7a3f2a') +
      P('M834 442 L846 396 L874 424 L900 384 L926 424 L954 396 L966 442Z', '#f2b236') + C(846, 394, 7, '#e8602a') + C(900, 382, 7, '#e8602a') + C(954, 394, 7, '#e8602a') +
      L('M856 520 q12 -12 26 0', '#2b1a14', 6) + L('M918 520 q12 -12 26 0', '#2b1a14', 6) + C(834, 556, 17, '#ee8c7a', 'opacity=".5"') + C(966, 556, 17, '#ee8c7a', 'opacity=".5"') +
      L('M870 576 q30 28 60 0', '#a8402a', 6);
    const balloon = L('M1004 548 C1030 470 1040 380 1070 307', '#6b3a3a', 3) + E(1070, 215, 75, 92, '#e8602a') + P('M1070 123 C1030 150 1030 280 1070 307 C1110 280 1110 150 1070 123Z', '#f2b236') +
      band(1030, 1145, 130, 305, 150, function (x, y) { return Math.hypot((x - 1070) / 75, (y - 215) / 92) < .92 && x > 1085 ? .8 : 0; }, 4, '#b43d12', .7) +
      E(1042, 180, 12, 26, '#ffffff', 'opacity=".4" transform="rotate(20 1042 180)"');
    let grass = '', fl = '';
    for (let x = -300; x < 1900; x += 34) grass += L(`M${x} 1010 Q${x + 4} ${930 - (x % 5) * 10} ${x + 14} ${900 - (x % 7) * 9}`, x % 2 ? '#5aa878' : '#4a9868', 13);
    [[160, 930, 1], [610, 960, .9], [1250, 950, 1], [1520, 930, .9]].forEach(function (f) { fl += daisy(f[0], f[1], f[2], r); });
    fl += poppy(420, 980, .8, '#e8602a', r) + poppy(1120, 990, .8, '#f2a0a0', r) + poppy(1380, 975, .7, '#e8602a', r);
    const near = R(-800, 970, 3200, 400, '#4a9868') + band(-300, 1900, 960, 1040, 300, function (x, y) { return y < 1040 ? (1040 - y) / 80 : 0; }, 4, '#7cc592', .6) + grass + fl;
    return [{ name: 'Céu e sol', f: .85, svg: sky }, { name: 'Colinas', f: .55, svg: far }, { name: 'Árvores e borboletas', f: .3, svg: trees + bf }, { name: 'Menina e balão', f: .1, svg: girl + balloon }, { name: 'Primeiro plano', f: -.05, svg: near }];
  }

  /* ---------- C. Lagoa dos patos (lúdico, entardecer) ---------- */
  function cidade() {
    const T = tools(23), r = T.r, band = T.band, dots = T.dots, hill = T.hill;
    const sp = [];
    for (let i = 0; i < 50; i++) sp.push([-600 + r() * 2800, -100 + r() * 260]);
    const moonShade = band(1140, 1360, 120, 340, 220, function (x, y) { const d = Math.hypot(x - 1250, y - 230); return d < 96 ? Math.min(1, ((x - 1250) + (y - 230) + 96) / 190) * .75 : 0; }, 4, '#d9b58a', .7);
    const sky = grad(-500, 700, [[0, '#8a78b8'], [.3, '#c48ab8'], [.6, '#f0a890'], [1, '#f8d4a8']], -800, 3200, 36) + dots(sp, '#fff3e0', 5, .7) +
      cloudS(380, 330, 1.1, '#f6c3b8') + cloudS(900, 160, .8, '#f3b3b8') + cloudS(1700, 380, 1, '#f6c3b8') + cloudS(-200, 220, 1, '#f3b3b8') +
      C(1250, 230, 215, '#fbe3c4', 'opacity=".2"') + C(1250, 230, 160, '#fbe3c4', 'opacity=".25"') + C(1250, 230, 100, '#fff3dc') + moonShade + C(1218, 206, 14, '#ecd6ae') + C(1285, 262, 20, '#ecd6ae');
    const hills = hill(function (x) { return 560 + 40 * Math.sin(x / 300) + 18 * Math.sin(x / 110); }, -800, 2400, 1000, '#a68ac0', '#8a6ea8', 420, 90, 4.5) +
      hill(function (x) { return 610 + 30 * Math.sin(x / 240 + 2); }, -800, 2400, 1000, '#8a78b0', '#6f5c98', 360, 60, 4.5);
    let trees = '';
    [[-160, .9], [160, .75], [1560, .85], [1800, .8]].forEach(function (t, i) { trees += leafTree(r, t[0], 700, t[1], i % 2 ? '#f0a0a8' : '#8fcfa0', i % 2 ? '#f8c8c0' : '#b8e4bc', '#6a4a5a'); });
    const water = grad(640, 1100, [[0, '#8fd0d4'], [.5, '#5fb0c0'], [1, '#3f90a8']], -800, 3200, 20) +
      E(1250, 780, 100, 22, '#fff3dc', 'opacity=".5"') + E(1250, 820, 70, 14, '#fff3dc', 'opacity=".35"');
    let rip = '';
    for (let i = 0; i < 30; i++) { const x = -300 + r() * 2100, y = 670 + r() * 300; rip += L(`M${x.toFixed(0)} ${y.toFixed(0)} q14 -8 28 0 t28 0`, '#e9f6fb', 4, 'opacity=".6"'); }
    const pad = (x, y, k, fl) => E(x, y, 62 * k, 20 * k, '#4a9a6a') + P(`M${x} ${y} L${x + 62 * k} ${y - 6 * k} A${62 * k} ${20 * k} 0 0 1 ${x + 40 * k} ${y + 16 * k}Z`, '#5aa878', 'opacity=".0"') + (fl ? petal5(x + 14 * k, y - 8 * k, .5 * k, '#f8b4c8', 0, 14, 28) + C(x + 14 * k, y - 8 * k, 5 * k, '#f2b236') : '');
    const duck = (x, y, k, d) => {
      d = d || 1;
      return E(x, y + 10 * k, 76 * k, 22 * k, '#7fc4cc', 'opacity=".6"') +
        P(`M${x - 66 * k * d} ${y - 10 * k} Q${x - 92 * k * d} ${y - 34 * k} ${x - 82 * k * d} ${y - 40 * k} Q${x - 60 * k * d} ${y - 24 * k} ${x - 40 * k * d} ${y - 22 * k}Z`, '#fff3d6') +
        E(x, y - 8 * k, 70 * k, 42 * k, '#fff3d6') + E(x - 8 * k * d, y - 4 * k, 40 * k, 24 * k, '#f2d9a0') +
        C(x + 52 * k * d, y - 56 * k, 30 * k, '#fff3d6') +
        P(`M${x + 78 * k * d} ${y - 58 * k} Q${x + 100 * k * d} ${y - 54 * k} ${x + 98 * k * d} ${y - 46 * k} Q${x + 84 * k * d} ${y - 42 * k} ${x + 76 * k * d} ${y - 46 * k}Z`, '#f08a30') +
        C(x + 58 * k * d, y - 62 * k, 4.5 * k, '#2b1a14') + C(x + 44 * k * d, y - 46 * k, 8 * k, '#ee8c7a', 'opacity=".5"');
    };
    const frog = (x, y, k) => E(x, y - 28 * k, 52 * k, 38 * k, '#7fc872') + E(x, y - 16 * k, 36 * k, 22 * k, '#e8f2c0') + C(x - 28 * k, y - 66 * k, 18 * k, '#7fc872') + C(x + 28 * k, y - 66 * k, 18 * k, '#7fc872') +
      C(x - 28 * k, y - 68 * k, 10 * k, '#fff') + C(x + 28 * k, y - 68 * k, 10 * k, '#fff') + C(x - 26 * k, y - 68 * k, 5 * k, '#2b1a14') + C(x + 30 * k, y - 68 * k, 5 * k, '#2b1a14') +
      L(`M${x - 22 * k} ${y - 36 * k} q22 ${16 * k} ${44 * k} 0`, '#2b6a3a', 4 * k) + C(x - 40 * k, y - 36 * k, 8 * k, '#ee8c7a', 'opacity=".5"') + C(x + 40 * k, y - 36 * k, 8 * k, '#ee8c7a', 'opacity=".5"');
    const things = pad(960, 800, 1.1, true) + frog(980, 790, 1) + pad(1480, 900, 1, true) + pad(220, 880, 1.2, true) + pad(1700, 760, .8, false) +
      duck(520, 700, 1) + duck(700, 726, .42) + duck(790, 740, .38) + duck(860, 750, .34) + duck(1640, 880, .8, -1);
    let fies = '';
    for (let i = 0; i < 18; i++) { const fx = -200 + r() * 2000, fy = 420 + r() * 300; fies += C(fx, fy, 10 + r() * 4, '#f6e07a', 'opacity=".25"') + C(fx, fy, 3 + r() * 2, '#fff3d6'); }
    let reeds = '';
    for (let i = 0; i < 22; i++) { const x = -300 + i * 100 + r() * 40, h = 150 + r() * 120; reeds += L(`M${x} 1010 C${x - 6} ${1010 - h * .5} ${x + 10} ${1010 - h * .8} ${x + 2} ${1010 - h}`, i % 2 ? '#5aa878' : '#4a9868', 9) + (i % 3 === 0 ? E(x + 2, 1010 - h - 12, 8, 22, '#8a5a4a') : ''); }
    let fl = '';
    [[110, 960, 1], [1120, 990, .9], [1560, 960, 1]].forEach(function (f) { fl += daisy(f[0], f[1], f[2], r); });
    const near = R(-800, 980, 3200, 300, '#4a9868') + band(-800, 2400, 975, 1050, 400, function (x, y) { return (1050 - y) / 75; }, 4, '#7cc592', .7) + reeds + fl;
    return [{ name: 'Céu e lua', f: .85, svg: sky }, { name: 'Colinas', f: .55, svg: hills + trees }, { name: 'Lagoa e bichos', f: .2, svg: water + rip + things + fies }, { name: 'Juncos e flores', f: -.04, svg: near }];
  }

  /* ---------- D. Rio de outono (lúdico, tons quentes) ---------- */
  function mar() {
    const T = tools(41), r = T.r, band = T.band, dots = T.dots, hill = T.hill;
    const sunSh = band(330, 510, 210, 390, 260, function (x, y) { const d = Math.hypot(x - 420, y - 300); return d < 86 ? Math.min(1, ((x - 420) + (y - 300) + 86) / 180) * .8 : 0; }, 4, '#e0903a', .65);
    const sky = grad(-500, 800, [[0, '#f6d0a0'], [.5, '#fbe4bc'], [1, '#fdf1d8']], -800, 3200, 32) + C(420, 300, 200, '#fbd488', 'opacity=".25"') + C(420, 300, 150, '#fbd488', 'opacity=".3"') + C(420, 300, 88, '#f6a84a') + sunSh +
      cloudS(900, 170, .9, '#fff4e0') + cloudS(1500, 260, 1, '#fff4e0') + cloudS(-100, 200, .8, '#fff4e0') + dots([[200, 120], [640, 90], [1180, 110], [1420, 70], [1650, 150]], '#fff4e0', 6, .7);
    const h1 = function (x) { return 540 + 40 * Math.sin(x / 300) + 16 * Math.sin(x / 110); };
    const h2 = function (x) { return 660 + 30 * Math.sin(x / 240 + 2) + 10 * Math.sin(x / 90); };
    const far = hill(h1, -800, 2400, 1100, '#ecbf98', '#cc8e62', 420, 90, 4.5) + hill(h2, -800, 2400, 1100, '#dda070', '#b8703c', 380, 70, 4.5);
    const riverY = function (x) { return 700 + 34 * Math.sin(x / 170) + 12 * Math.sin(x / 60); };
    const rw = function (x) { return 34 + 8 * Math.sin(x / 230 + 1); };
    let top = '', bot = '';
    for (let x = -800; x <= 2400; x += 40) top += (x === -800 ? 'M' : 'L') + x + ' ' + (riverY(x) - rw(x)).toFixed(0);
    for (let x = 2400; x >= -800; x -= 40) bot += 'L' + x + ' ' + (riverY(x) + rw(x)).toFixed(0);
    const river = P(top + bot + 'Z', '#9fd2d8') + band(-800, 2400, 600, 800, 700, function (x, y) { const d = Math.abs(y - riverY(x)); return d < rw(x) - 4 ? (1 - d / rw(x)) * .5 : 0; }, 4, '#ffffff', .45) + L(top.replace(/^M/, 'M').replace(/L/g, 'L'), '#7fb8c2', 5, 'opacity=".6"');
    let trees = '';
    [[250, .9, '#e8742a', '#f4a13a'], [520, 1.05, '#f0b232', '#f7cf62'], [800, .85, '#c9552a', '#e8742a'], [1310, 1, '#e8742a', '#f4a13a'], [1560, .9, '#f0b232', '#f7cf62'], [-80, .95, '#c9552a', '#e8742a']].forEach(function (t) { trees += leafTree(r, t[0], 672, t[1], t[2], t[3], '#6a3a2a'); });
    const cot = R(996, 590, 110, 76, '#fff3dc', 'rx="6"') + R(996, 590, 32, 76, '#00000012', 'rx="6"') + P('M984 600 Q1051 530 1118 600Z', '#d8482a') + R(1082, 548, 18, 36, '#fff3dc', 'rx="3"') + P('M1038 666 L1038 628 Q1052 608 1066 628 L1066 666Z', '#e8742a') + R(1078, 618, 20, 22, '#f6c64d', 'rx="6"') + C(1092, 528, 12, '#ffffff', 'opacity=".65"') + C(1108, 504, 16, '#ffffff', 'opacity=".5"');
    const yb = riverY(1050);
    const bridge = P(`M968 ${yb + 14} Q1050 ${yb - 62} 1132 ${yb + 14} L1132 ${yb + 28} Q1050 ${yb - 40} 968 ${yb + 28}Z`, '#a8683a') + L(`M968 ${yb + 14} Q1050 ${yb - 62} 1132 ${yb + 14}`, '#7a4a28', 5) +
      L(`M990 ${yb - 6} V${yb - 40} M1020 ${yb - 24} V${yb - 56} M1050 ${yb - 31} V${yb - 63} M1080 ${yb - 24} V${yb - 56} M1110 ${yb - 6} V${yb - 40}`, '#7a4a28', 5) + L(`M990 ${yb - 40} Q1050 ${yb - 98} 1110 ${yb - 40}`, '#7a4a28', 5);
    const mid = trees + '<g transform="translate(1250 662) scale(1.3) translate(-1051 -666)">' + cot + '</g>' + river + bridge;
    let nd = 'M-800 1200 L-800 ' + (riverY(-800) + rw(-800) + 6).toFixed(0);
    for (let x = -760; x <= 2400; x += 40) nd += ' L' + x + ' ' + (riverY(x) + rw(x) + 6).toFixed(0);
    nd += ' L2400 1200Z';
    let lv = '';
    for (let i = 0; i < 26; i++) { const x = -200 + r() * 1900, y = 760 + r() * 240, c = ['#e8742a', '#f0b232', '#c9552a'][i % 3]; lv += E(x, y, 9, 15, c, `opacity=".9" transform="rotate(${(r() * 160 - 80).toFixed(0)} ${x.toFixed(0)} ${y.toFixed(0)})"`); }
    let fl = '';
    [[110, 930, 1], [700, 960, .9], [1300, 950, 1], [1560, 930, .8]].forEach(function (f) { fl += daisy(f[0], f[1], f[2], r); });
    fl += poppy(420, 990, .8, '#e8402a', r) + poppy(1000, 985, .8, '#e8602a', r) + poppy(1450, 1000, .7, '#e8402a', r);
    let gr = '';
    for (let x = -300; x < 1900; x += 38) gr += L(`M${x} 1010 Q${x + 4} ${940 - (x % 5) * 8} ${x + 14} ${915 - (x % 7) * 8}`, x % 2 ? '#a8803c' : '#b8903f', 12);
    const near = P(nd, '#c9a458') + band(-800, 2400, 700, 1100, 700, function (x, y) { const e = riverY(x) + rw(x) + 6; return y > e + 10 && y < e + 160 ? (1 - (y - e) / 160) * .8 : 0; }, 4, '#8f6a30', .6) + lv + gr + fl;
    return [{ name: 'Céu e sol', f: .85, svg: sky }, { name: 'Colinas', f: .55, svg: far }, { name: 'Rio, ponte e casinha', f: .2, svg: mid }, { name: 'Prado e folhas', f: -.05, svg: near }];
  }

  /* ---------- E. O morro e a casinha (lúdico, conceitual) ---------- */
  function escada() {
    const T = tools(77), r = T.r, band = T.band, dots = T.dots;
    const sp = [];
    for (let i = 0; i < 40; i++) sp.push([-300 + r() * 2400, -100 + r() * 400]);
    const bg = grad(-500, 1000, [[0, '#f4b8c0'], [.5, '#f9d4c0'], [1, '#fdf0d8']], -800, 3200, 32) + dots(sp, '#fff6ea', 5, .6) + C(900, 320, 340, '#fff3d8', 'opacity=".25"') + C(900, 320, 300, '#fff3d8', 'opacity=".35"') + C(900, 320, 270, '#fff6e2') +
      band(640, 1160, 70, 590, 420, function (x, y) { const d = Math.hypot(x - 900, y - 320); return d < 264 ? Math.min(1, ((x - 900) * .5 + (y - 320) + 264) / 420) * .8 : 0; }, 4.5, '#e8c89a', .6) +
      C(800, 250, 36, '#f0dcb8') + C(1000, 420, 48, '#f0dcb8') + C(760, 440, 22, '#f0dcb8') + cloudS(280, 260, 1, '#ffffff') + cloudS(1640, 200, .9, '#ffffff') + cloudS(1500, 520, .7, '#fff6ea');
    let tall = '';
    for (let i = 0; i < 9; i++) {
      const x = -300 + i * 250, h = 200 + r() * 160;
      tall += L(`M${x + 20} 900 C${x + 14} ${800 - h * .4} ${x + 26} ${800 - h * .7} ${x + 20} ${800 - h + 40}`, '#7a4a3a', 12) + E(x + 20, 800 - h, 80, 100, i % 2 ? '#f2a0a8' : '#8fd0a8') + E(x + 44, 800 - h - 24, 34, 64, i % 2 ? '#f8c4c0' : '#b5e4bc', 'opacity=".8"') +
        band(x + 30, x + 100, 800 - h - 90, 800 - h + 90, 50, function () { return .7; }, 4, i % 2 ? '#d87880' : '#5aa878', .5);
    }
    const edge = (x) => x < 1060 ? 1010 - 552 * Math.pow(Math.max(0, (x + 300) / 1360), .9) : 458 + (x - 1060) * .24;
    let hillD = 'M-800 1200 L-800 ' + edge(-800).toFixed(0);
    for (let x = -760; x <= 2400; x += 40) hillD += ' L' + x + ' ' + edge(x).toFixed(0);
    hillD += ' L2400 1200Z';
    const hillTop = '#8fcfa0', hillDark = '#5aa878';
    const pathPts = [[160, 930], [300, 870], [470, 800], [560, 722], [650, 650], [760, 612], [850, 560], [960, 506], [1040, 470]];
    let pd = 'M' + pathPts[0][0] + ' ' + pathPts[0][1];
    for (let i = 1; i < pathPts.length; i++) pd += ' L' + pathPts[i][0] + ' ' + pathPts[i][1];
    let stones = '';
    pathPts.forEach(function (p, i) { stones += E(p[0] + (i % 2 ? 22 : -22), p[1] + 22, 12, 6, '#e8d4a8'); });
    const house = R(1004, 370, 112, 88, '#fff3dc', 'rx="8"') + R(1004, 370, 34, 88, '#00000012', 'rx="8"') + P('M990 378 Q1060 300 1130 378Z', '#e0603a') + R(1090, 318, 18, 40, '#fff3dc', 'rx="3"') +
      P('M1040 458 L1040 420 Q1058 398 1076 420 L1076 458Z', '#e8742a') + R(1086, 394, 22, 24, '#f6c64d', 'rx="6"') + C(1100, 280, 14, '#ffffff', 'opacity=".7"') + C(1118, 250, 19, '#ffffff', 'opacity=".55"') + C(1146, 226, 24, '#ffffff', 'opacity=".4"');
    const kid = (x, y, k) => E(x, y - 40 * k, 14 * k, 8 * k, '#7a3f2a', 'opacity="0"') + C(x, y - 60 * k, 13 * k, '#f6cfae') + E(x, y - 66 * k, 15 * k, 12 * k, '#7a3f2a') + C(x, y - 58 * k, 12 * k, '#f6cfae') + P(`M${x - 14 * k} ${y - 76 * k} l5 -12 l9 8 l5 -10 l5 10 l9 -8 l5 12Z`, '#f2b236') +
      P(`M${x - 12 * k} ${y - 44 * k} L${x - 24 * k} ${y} L${x + 24 * k} ${y} L${x + 12 * k} ${y - 44 * k}Z`, '#2f9a8c') + R(x - 10 * k, y, 8 * k, 16 * k, '#f6cfae') + R(x + 4 * k, y, 8 * k, 16 * k, '#f6cfae');
    const kite = L('M1180 262 C1200 330 1160 380 1190 440', '#6b3a3a', 3) + G('1180,190 1230,262 1180,334 1130,262', '#e8602a') + G('1180,190 1230,262 1180,262', '#f2b236') + L('M1190 440 l-14 -20 M1190 440 l16 -22', '#e8602a', 6);
    let fl = '';
    [[220, 840], [420, 740], [620, 700], [760, 560], [900, 520]].forEach(function (f, i) { fl += i % 2 ? daisy(f[0] + 40, f[1] + 40, .38, r) : poppy(f[0] - 40, f[1] + 48, .4, '#e8402a', r); });
    const mid = P(hillD, hillTop) + band(-800, 2400, 380, 1100, 620, function (x, y) { const e = edge(x); return (y > e + 20 && y < e + 150) ? Math.min(1, (y - e - 20) / 130) * .7 : 0; }, 4, hillDark, .6) +
      L(pd, '#fff3dc', 38, 'opacity=".95"') + stones + house + kid(650, 645, .9) + fl + kite;
    let leaves = '', birds = '';
    for (let i = 0; i < 12; i++) { const x = -200 + i * 160; leaves += P(`M${x} 1010 C${x - 50} 960 ${x - 30} 900 ${x + 12} 880 C${x + 60} 910 ${x + 70} 970 ${x + 40} 1010Z`, i % 2 ? '#5aa878' : '#4a9868'); }
    for (let i = 0; i < 6; i++) birds += L(`M${300 + i * 150} ${200 + (i % 3) * 50} q14 -16 28 0 q14 -16 28 0`, '#7a4a3a', 5);
    let nf = '';
    [[60, 930, 1], [700, 960, .9], [1260, 940, 1]].forEach(function (f) { nf += daisy(f[0], f[1], f[2], r); });
    const near = R(-800, 990, 3200, 300, '#4a9868') + band(-800, 2400, 985, 1060, 400, function (x, y) { return (1060 - y) / 75; }, 4, '#7cc592', .7) + leaves + nf + birds;
    return [{ name: 'Lua e céu', f: .8, svg: bg }, { name: 'Árvores', f: .45, svg: tall }, { name: 'Morro, trilha e casinha', f: .15, svg: mid }, { name: 'Folhas e aves', f: -.06, svg: near }];
  }

  /* ---------- F. Cartaz (formas suaves, estilo boho) ---------- */
  function cartaz() {
    const T = tools(91), r = T.r, band = T.band, dots = T.dots;
    let waves = '';
    for (let i = 0; i < 7; i++) waves += L(`M-600 ${80 + i * 150} C-200 ${20 + i * 150} 200 ${140 + i * 150} 600 ${80 + i * 150} S1400 ${20 + i * 150} 1800 ${80 + i * 150} S2200 ${140 + i * 150} 2600 ${80 + i * 150}`, '#f2b236', 14, 'opacity=".16"');
    const dd = [];
    for (let i = 0; i < 160; i++) dd.push([-300 + r() * 2300, -100 + r() * 1100]);
    const bg = grad(-500, 1100, [[0, '#1d6a5f'], [1, '#14524a']], -800, 3200, 24) + waves + dots(dd, '#8ccbc6', 8, .35) + C(520, 430, 360, '#f6b87c', 'opacity=".16"') + C(520, 430, 330, '#e8602a') +
      band(190, 850, 100, 760, 700, function (x, y) { const d = Math.hypot(x - 520, y - 430); return d < 324 ? Math.min(1, ((x - 520) * .6 + (y - 430) * .8 + 324) / 560) * .9 : 0; }, 4.5, '#b43d12', .75) +
      C(520, 430, 240, '#f08a4a') + C(520, 430, 160, '#f6b87c') + C(520, 430, 80, '#fbf0dc');
    const arch = (cx, cy, rr, f) => P(`M${cx - rr} ${cy} A${rr} ${rr} 0 0 1 ${cx + rr} ${cy}Z`, f);
    const mid = arch(1100, 1010, 420, '#fbf0dc') + arch(1100, 1010, 340, '#f2b236') + arch(1100, 1010, 260, '#e8602a') + arch(1100, 1010, 180, '#8ccbc6') + arch(1100, 1010, 100, '#2f8b7f') +
      band(1100, 1500, 650, 1010, 300, function (x, y) { return Math.hypot(x - 1100, y - 1010) < 420 && x > 1220 ? .6 : 0; }, 4, '#b43d12', .5) +
      dome(T, 0, 520, 340, 1010, '#8ccbc6', '#3f9792', '#3f9792') + dome(T, 1820, 470, 360, 1010, '#2f8b7f', '#16574f', '#16574f', -1);
    let plants = '';
    [[110, 1010, 1.1, '#e8602a'], [1560, 1010, 1, '#f2b236'], [1700, 1010, .8, '#e8602a']].forEach(function (p) {
      for (let i = -2; i <= 2; i++) plants += P(`M${p[0]} ${p[1]} C${p[0] + i * 40 * p[2]} ${p[1] - 80 * p[2]} ${p[0] + i * 60 * p[2]} ${p[1] - 150 * p[2]} ${p[0] + i * 24 * p[2]} ${p[1] - 190 * p[2]} C${p[0] + i * 4 * p[2]} ${p[1] - 140 * p[2]} ${p[0] + i * 8 * p[2]} ${p[1] - 70 * p[2]} ${p[0]} ${p[1]}Z`, i % 2 ? p[3] : '#fbf0dc', 'opacity=".95"');
    });
    const near = C(1250, 300, 74, '#f2b236') + band(1250, 1324, 250, 374, 60, function (x, y) { return Math.hypot(x - 1250, y - 300) < 70 && x > 1260 ? .8 : 0; }, 4, '#e8602a', .75) +
      R(1180, 520, 200, 28, '#fbf0dc', 'rx="14"') + R(1180, 564, 140, 28, '#fbf0dc', 'rx="14"') + R(1180, 608, 170, 28, '#fbf0dc', 'rx="14"') + C(160, 820, 46, '#f2b236') + plants +
      petal5(1330, 840, .9, '#fff7e8', 0, 14, 28) + C(1330, 840, 12, '#f6a823');
    const txt = '<g font-family="Helvetica,Arial,sans-serif" font-weight="800" text-anchor="middle" fill="#10413a" letter-spacing="-4"><text x="520" y="410" font-size="150">Dias</text><text x="520" y="548" font-size="150">de sol</text></g><text x="520" y="620" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-weight="700" font-size="32" letter-spacing="8" fill="#10413a">CARTAZ DE EXEMPLO</text>';
    return [{ name: 'Fundo e círculo', f: .6, svg: bg }, { name: 'Texto', f: .42, svg: txt }, { name: 'Formas', f: .25, svg: mid }, { name: 'Detalhes', f: -.06, svg: near }];
  }

  /* ---------- G. Paisagem com texto atrás da montanha (exemplo de "Textos") ---------- */
  function paisagemTexto() {
    const ls = paisagem();
    const txt = '<g font-family="Helvetica,Arial,sans-serif" font-weight="800" text-anchor="middle" letter-spacing="-5">' +
      '<text x="640" y="470" font-size="190" fill="#fff6e4">Além do vale</text></g>';
    ls.splice(1, 0, { name: 'Texto atrás da montanha', f: .78, svg: txt });
    return ls;
  }

  /* ---------- H. Vila, igreja, moinho e farol: cenário feito para o percurso desenhado ----------
     O percurso passa por pontos de interesse: casas (340,700), igreja (540,440), moinho (860,320),
     farol (1170,470) e barco (1320,700). A simulação do desenho e o filme usam estes mesmos pontos. */
  function caminho(v) {
    v = v || 'dia';
    const T = tools(137), r = T.r, band = T.band, dots = T.dots;
    const bird = (x, y, k) => L(`M${x} ${y} q${10 * k} ${-12 * k} ${20 * k} 0 q${10 * k} ${-12 * k} ${20 * k} 0`, '#6b3a3a', 4);
    const sy = v === 'aurora' ? 470 : 170, sx = v === 'aurora' ? 1450 : 1010;
    const sunSpots = band(sx - 80, sx + 80, sy - 20, sy + 90, 200, function (x, y) { const d = Math.hypot(x - sx, y - sy); return d < 82 ? Math.min(1, (y - sy + 20) / 100 + (x - sx + 70) / 300) * .9 : 0; }, 4, '#c84a12', .75);
    const skyCols = v === 'noite' ? [[0, '#0f1b3d'], [.5, '#243a72'], [1, '#5a6fa8']] : v === 'aurora' ? [[0, '#6f7fc0'], [.45, '#f2a2a8'], [1, '#f9d2a0']] : [[0, '#f4c9a4'], [.5, '#f8dfbc'], [1, '#fbf0dc']];
    const cc = v === 'noite' ? '#3a4f8a' : v === 'aurora' ? '#fbd2c0' : '#fff3e0';
    let stars = '';
    if (v === 'noite') { const pts = []; for (let i = 0; i < 70; i++) pts.push([-300 + r() * 2300, -100 + r() * 640]); stars = dots(pts, '#fbf0dc', 5, .85) + dots(pts.filter(function (p, i) { return i % 5 === 0; }), '#fbf0dc', 10, .9); }
    const celestial = v === 'noite' ? C(1010, 210, 150, '#fbf0dc', 'opacity=".1"') + C(1010, 210, 70, '#fbf0dc') + C(1040, 192, 62, '#2e447c') :
      C(sx, sy, 230, '#f6b87c', 'opacity=".16"') + C(sx, sy, 160, '#f6b87c', 'opacity=".22"') + C(sx, sy, 84, v === 'aurora' ? '#ff7a3a' : '#f26a22') + sunSpots;
    const sky = grad(-500, 700, skyCols, -800, 3200, 30) + R(-800, 700, 3200, 300, skyCols[2][1]) + stars + celestial +
      cloudS(260, 190, 1, cc) + cloudS(1500, 120, .8, cc) + cloudS(1900, 260, 1, cc) + cloudS(-250, 280, 1, cc) + (v === 'noite' ? '' : bird(640, 120, 1) + bird(710, 90, .8) + bird(1420, 250, .9));
    let waves = '';
    for (let i = 0; i < 34; i++) { const x = 1000 + r() * 1300, y = 650 + r() * 260; waves += L(`M${x.toFixed(0)} ${y.toFixed(0)} q12 -8 24 0 t24 0`, '#e9f6fb', 4, 'opacity=".75"'); }
    const far = grad(570, 1100, [[0, '#a6dad6'], [.12, '#7cc3c6'], [1, '#4fa7b0']], -800, 3200, 14) + P('M1260 600 C1380 500 1560 470 1700 500 C1840 530 1900 570 1960 600Z', '#9ed3cd') + band(1500, 1960, 500, 600, 150, function (x, y) { return x > 1620 ? .8 : 0; }, 4, '#3f9792', .75) + waves;
    const cypress = (x, y, k, f) => R(x - 3 * k, y - 6 * k, 6 * k, 18 * k, '#5a2d22') + E(x, y - 50 * k, 15 * k, 52 * k, f);
    let church = R(520, 404, 34, 72, '#fbf0dc', 'rx="4"') + R(510, 470, 92, 66, '#fbf0dc', 'rx="4"') + R(510, 470, 26, 66, '#f0dcb8') + P('M504 476 Q556 418 608 476Z', '#e8582a') + P('M516 408 Q537 372 558 408Z', '#e8582a') + L('M537 372 V352 M529 360 H545', '#6b3a3a', 4) +
      P('M556 536 L556 506 Q574 484 592 506 L592 536Z', '#e8742a') + C(537, 436, 8, '#f6c64d') + R(520, 486, 14, 18, '#f6c64d', 'rx="6"');
    const blade = (a) => `<g transform="rotate(${a} 860 312)"><rect x="853" y="222" width="14" height="88" rx="7" fill="#fbf0dc"/><rect x="867" y="232" width="22" height="52" rx="6" fill="#f6c64d" opacity=".9"/></g>`;
    const mill = P('M833 414 L850 322 Q860 310 870 322 L887 414Z', '#fbf0dc') + P('M860 314 L870 322 L887 414 L866 414Z', '#f0dcb8') + P('M846 326 Q860 282 874 326Z', '#e8582a') + P('M850 414 L850 386 Q860 368 870 386 L870 414Z', '#e8742a') + blade(25) + blade(115) + blade(205) + blade(295) + C(860, 312, 9, '#8a4a22');
    const ex = (y) => 10 * (508 - y) / 116;
    const stripe = (y0, y1, c) => P(`M${1150 + ex(y0)} ${y0} L${1190 - ex(y0)} ${y0} L${1190 - ex(y1)} ${y1} L${1150 + ex(y1)} ${y1}Z`, c);
    const lighthouse = C(1170, 371, 46, '#f6c64d', 'opacity=".22"') + stripe(392, 508, '#fbf0dc') + stripe(420, 448, '#e8582a') + stripe(468, 496, '#e8582a') + R(1146, 384, 48, 10, '#8a4a22', 'rx="5"') + R(1154, 358, 32, 26, '#f6c64d', 'rx="8"') + P('M1148 360 Q1170 330 1192 360Z', '#e8582a');
    const boat = L('M1262 742 q14 -8 28 0 t28 0 t28 0 t28 0', '#e9f6fb', 4) + P('M1272 704 L1372 704 Q1356 738 1322 740 Q1288 738 1272 704Z', '#e8602a') + R(1319, 614, 5, 92, '#6b3a3a', 'rx="2"') +
      P('M1325 618 Q1372 662 1370 698 L1325 698Z', '#fbf0dc') + P('M1316 632 Q1284 664 1276 698 L1316 698Z', '#f6c64d') + L('M1272 704 H1372', '#8a4a22', 5);
    const road = L('M430 802 C396 748 560 706 504 652 C466 616 584 590 556 538', '#fbf0dc', 14, 'opacity=".9"');
    let trees = '';
    [[690, 560, 1], [1000, 590, 1.1], [300, 650, 1]].forEach(function (t) { trees += cypress(t[0], t[1], t[2], '#17604f'); });
    trees += leafTree(r, 740, 640, .5, '#e8742a', '#f4a13a', '#5a2d22') + leafTree(r, 960, 600, .45, '#c9552a', '#e8742a', '#5a2d22') + leafTree(r, 640, 700, .4, '#f0b232', '#f7cf62', '#5a2d22');
    const mid = P('M-800 690 C-420 620 -40 640 260 740 L260 880 L-800 880Z', '#2f8b7f') + dome(T, 1170, 500, 170, 840, '#e8742a', '#b43d12', '#b43d12') + lighthouse +
      dome(T, 880, 400, 340, 840, '#f2b236', '#ef7b2c', '#c9552a') + mill + dome(T, 500, 530, 310, 840, '#2f8b7f', '#16574f', '#16574f') + road + church + trees + boat;
    const edge = (x) => 790 + 10 * Math.sin(x / 180) + Math.max(0, x - 1250) * .5;
    let ground = 'M-800 1200 L-800 ' + edge(-800).toFixed(0);
    for (let x = -760; x <= 2400; x += 40) ground += ' L' + x + ' ' + edge(x).toFixed(0);
    ground += ' L2400 1200Z';
    let sand = 'M1180 ' + edge(1180).toFixed(0);
    for (let x = 1220; x <= 2400; x += 40) sand += ' L' + x + ' ' + edge(x).toFixed(0);
    sand += ' L2400 1200 L1480 1200Z';
    const house = (x, w, h, wall, roof) => R(x, 800 - h, w, h, wall, 'rx="6"') + R(x, 800 - h, w * .3, h, '#00000014') + P(`M${x - 12} ${804 - h} Q${x + w / 2} ${800 - h - w * .5} ${x + w + 12} ${804 - h}Z`, roof) + P(`M${x + w * .55} 800 L${x + w * .55} ${800 - h * .45} Q${x + w * .7} ${800 - h * .65} ${x + w * .85} ${800 - h * .45} L${x + w * .85} 800Z`, '#e8742a') + R(x + w * .1, 800 - h * .78, w * .22, h * .22, '#f6c64d', 'rx="5"');
    const houses = house(262, 92, 76, '#fbf0dc', '#e8582a') + house(372, 112, 92, '#f6dcae', '#cf4620') + C(430, 640, 11, '#ffffff', 'opacity=".7"') + C(446, 616, 15, '#ffffff', 'opacity=".55"') + house(500, 70, 58, '#fbf0dc', '#e8582a');
    let flowers = '';
    [[120, 930, 1], [820, 940, 1.1], [1010, 980, .9]].forEach(function (f) { flowers += daisy(f[0], f[1], f[2], r); });
    flowers += poppy(560, 960, .9, '#e8402a', r) + poppy(180, 900, .8, '#e8602a', r) + poppy(700, 990, .8, '#e8402a', r);
    const near = P(ground, '#2f8b7f') + band(-800, 2400, 780, 960, 520, function (x, y) { const e = edge(x); return (y > e + 30 && y < e + 130) ? Math.min(1, (y - e - 30) / 100) * .7 : 0; }, 4, '#16574f', .7) + P(sand, '#f2d9a3') +
      band(1300, 2400, 840, 1100, 260, function (x, y) { return y > edge(x) + 20 ? .6 : 0; }, 4, '#e8602a', .5) + houses + flowers;
    const tone = v === 'noite' ? R(-800, -500, 3200, 2000, '#101c44', 'opacity=".42"') : v === 'aurora' ? R(-800, -500, 3200, 2000, '#f59a70', 'opacity=".16"') : '';
    const L4 = [{ name: 'Céu e sol', f: .85, svg: sky }, { name: 'Mar e horizonte', f: .55, svg: far }, { name: 'Colinas e marcos', f: .12, svg: mid }, { name: 'Vila e primeiro plano', f: 0, svg: near }];
    if (tone) L4.push({ name: 'Luz do momento', f: 0, svg: tone });
    return L4;
  }

  /* ---------- I. Desenho de arquitetura (elevação a nanquim com aguadas suaves) ---------- */
  function arq() {
    const T = tools(53), r = T.r, band = T.band, dots = T.dots;
    const ink = '#2f2a26';
    let grid = '';
    for (let x = -800; x <= 2400; x += 80) grid += `M${x} -400V1400`;
    for (let y = -400; y <= 1400; y += 80) grid += `M-800 ${y}H2400`;
    const paper = R(-800, -500, 3200, 2000, '#f7f0e0') + L(grid, '#d8cdb4', 1.5, 'opacity=".7"') + band(-300, 1900, -100, 1100, 700, function () { return .35; }, 3.5, '#d9c9a4', .6);
    const GY = 800;
    let hatchWall = '';
    for (let y = 500; y < GY; y += 16) hatchWall += `M342 ${y}H1058`;
    let shade = '';
    for (let x = 346; x < 1050; x += 18) shade += `M${x} 494l-12 40`;
    let ground = '';
    for (let x = 120; x < 1700; x += 20) ground += `M${x} ${GY + 2}l-14 26`;
    const win = (x, y, w, h) => R(x, y, w, h, '#cfe6ea') + L(`M${x} ${y}h${w}v${h}h${-w}Z M${x + w / 2} ${y}v${h} M${x} ${y + h * .38}h${w}`, ink, 3) + R(x - 10, y + h, w + 20, 10, '#fffaf0', `stroke="${ink}" stroke-width="3"`) +
      L(`M${x + 10} ${y + 10}l${w * .3} ${h * .3}`, '#ffffff', 5, 'opacity=".7"');
    const house = R(340, 490, 720, 310, '#fffaf0') + L(hatchWall, ink, 1.4, 'opacity=".16"') + L(shade, ink, 2, 'opacity=".3"') +
      P('M300 494 L700 304 L1100 494Z', '#e6b8a0', 'opacity=".75"') + L('M300 494 L700 304 L1100 494 M318 506 L700 322 L1082 506', ink, 4) +
      R(870, 350, 54, 100, '#fffaf0', `stroke="${ink}" stroke-width="4"`) + R(862, 340, 70, 14, '#e6b8a0', `stroke="${ink}" stroke-width="4"`) +
      L('M340 490V800 M1060 490V800', ink, 5) + win(400, 560, 130, 160) + win(820, 560, 130, 160) +
      P('M630 800 V610 Q700 540 770 610 V800Z', '#9cc9bd') + L('M630 800 V610 Q700 540 770 610 V800 M700 556 V800', ink, 4) + C(738, 700, 6, ink) + R(610, 790, 180, 10, '#fffaf0', `stroke="${ink}" stroke-width="3"`) + R(595, 800, 210, 10, '#fffaf0', `stroke="${ink}" stroke-width="3"`);
    const pergola = R(1060, 520, 280, 16, '#e6b8a0', `stroke="${ink}" stroke-width="4"`) + L('M1100 536V800 M1300 536V800', ink, 6) + R(1090, 796, 26, 8, '#fffaf0', `stroke="${ink}" stroke-width="3"`) + R(1287, 796, 26, 8, '#fffaf0', `stroke="${ink}" stroke-width="3"`);
    let vine = '';
    for (let i = 0; i < 8; i++) vine += E(1090 + i * 30, 548 + (i % 2) * 14, 13, 8, '#9fd0a0', `stroke="${ink}" stroke-width="2"`);
    const tree = (x, y, k) => L(`M${x} ${y} C${x - 6 * k} ${y - 70 * k} ${x + 6 * k} ${y - 120 * k} ${x} ${y - 160 * k}`, ink, 5) + C(x, y - 220 * k, 90 * k, '#b9dcb0', `opacity=".8" stroke="${ink}" stroke-width="3"`) + C(x - 34 * k, y - 196 * k, 46 * k, '#9fd0a0', 'opacity=".6"') +
      L(`M${x - 40 * k} ${y - 230 * k} q20 -22 44 -6 M${x + 10 * k} ${y - 260 * k} q24 4 34 22`, ink, 2.5);
    const figure = C(1190, 640, 15, '#f3c4a0', `stroke="${ink}" stroke-width="3"`) + P('M1170 666 Q1190 656 1210 666 L1216 740 L1164 740Z', '#e8602a', 'opacity=".8"') + L('M1170 666 Q1190 656 1210 666 L1216 740 L1164 740Z M1176 740 L1174 800 M1204 740 L1206 800', ink, 3);
    const mid = house + pergola + vine + tree(110, GY, .9) + tree(1470, GY, 1.1) + figure + L(`M120 ${GY} H1700`, ink, 6) + L(ground, ink, 2, 'opacity=".4"');
    const dim = (x1, y1, x2, y2, txt, vert) => L(`M${x1} ${y1} L${x2} ${y2}`, ink, 2.5) + (vert ? L(`M${x1 - 12} ${y1}h24 M${x2 - 12} ${y2}h24`, ink, 2.5) : L(`M${x1} ${y1 - 12}v24 M${x2} ${y2 - 12}v24`, ink, 2.5)) +
      (vert ? `<text x="${x1 - 22}" y="${(y1 + y2) / 2}" font-family="Helvetica,Arial,sans-serif" font-size="30" font-weight="700" fill="${ink}" text-anchor="middle" transform="rotate(-90 ${x1 - 22} ${(y1 + y2) / 2})">${txt}</text>` : `<text x="${(x1 + x2) / 2}" y="${y1 - 16}" font-family="Helvetica,Arial,sans-serif" font-size="30" font-weight="700" fill="${ink}" text-anchor="middle">${txt}</text>`);
    const notes = dim(340, 900, 1060, 900, '7,20 m', false) + dim(250, 304, 250, 800, '4,90 m', true) + L('M250 304H300 M250 800H300', ink, 1.5, 'opacity=".5"') +
      L(`M1500 ${GY} l22 -30 l22 30Z`, ink, 3) + `<text x="1560" y="${GY - 8}" font-family="Helvetica,Arial,sans-serif" font-size="26" font-weight="700" fill="${ink}">±0,00</text>` +
      `<text x="160" y="966" font-family="Helvetica,Arial,sans-serif" font-size="34" font-weight="800" fill="${ink}" letter-spacing="3">ELEVAÇÃO FRONTAL</text><text x="160" y="1000" font-family="Helvetica,Arial,sans-serif" font-size="22" fill="${ink}" opacity=".7">estudo de desenho de arquitetura · esc. 1:50</text>` +
      C(1420, 190, 40, 'none', `stroke="${ink}" stroke-width="3"`) + P('M1420 150 L1432 200 L1420 190 L1408 200Z', ink) + `<text x="1420" y="250" font-family="Helvetica,Arial,sans-serif" font-size="24" font-weight="800" fill="${ink}" text-anchor="middle">N</text>`;
    return [{ name: 'Papel e malha', f: .55, svg: paper }, { name: 'Edificação e entorno', f: .2, svg: mid }, { name: 'Cotas e anotações', f: 0, svg: notes }];
  }

  /* ---------- J. Festa dos balões (alto contraste, cena viva; usada na seção de IA) ---------- */
  function baloes() {
    const T = tools(311), r = T.r, band = T.band, dots = T.dots, hill = T.hill;
    const st = [];
    for (let i = 0; i < 60; i++) st.push([-300 + r() * 2300, -100 + r() * 360]);
    const sunSh = band(1140, 1360, 440, 640, 240, function (x, y) { const d = Math.hypot(x - 1250, y - 540); return d < 100 ? Math.min(1, ((x - 1250) + (y - 540) + 100) / 200) * .8 : 0; }, 4, '#d9561a', .7);
    const sky = grad(-500, 900, [[0, '#2f2a6a'], [.3, '#8a3f94'], [.58, '#f0605a'], [.82, '#f9a24a'], [1, '#fbd27a']], -800, 3200, 40) + dots(st, '#fff3e0', 5, .8) +
      C(1250, 540, 260, '#ffd27a', 'opacity=".2"') + C(1250, 540, 190, '#ffd27a', 'opacity=".28"') + C(1250, 540, 104, '#fff0b8') + sunSh +
      cloudS(300, 470, 1.1, '#f78a78') + cloudS(1650, 380, 1, '#e8708a') + cloudS(900, 600, .9, '#f7a070') + cloudS(-200, 330, 1, '#c8588e');
    const far = hill(function (x) { return 640 + 60 * Math.sin(x / 280) + 22 * Math.sin(x / 100); }, -800, 2400, 1100, '#5a2f7a', '#3a1a5a', 420, 100, 4.5) + hill(function (x) { return 740 + 40 * Math.sin(x / 210 + 1); }, -800, 2400, 1100, '#3f2468', '#2a1450', 380, 80, 4.5);
    const balloon = function (x, y, k, c1, c2, c3) {
      const rx = 92 * k, ry = 112 * k;
      return L(`M${x - 22 * k} ${y + ry * .95} L${x - 16 * k} ${y + ry + 62 * k} M${x + 22 * k} ${y + ry * .95} L${x + 16 * k} ${y + ry + 62 * k}`, '#3a1a3a', 3 * k) +
        R(x - 22 * k, y + ry + 58 * k, 44 * k, 30 * k, '#7a4a2a', `rx="${5 * k}"`) +
        E(x, y, rx, ry, c1) + P(`M${x} ${y - ry} C${x - rx * .55} ${y - ry * .6} ${x - rx * .55} ${y + ry * .5} ${x - 24 * k} ${y + ry * .96} L${x + 24 * k} ${y + ry * .96} C${x + rx * .55} ${y + ry * .5} ${x + rx * .55} ${y - ry * .6} ${x} ${y - ry}Z`, c2) +
        P(`M${x} ${y - ry} C${x - rx * .22} ${y - ry * .5} ${x - rx * .22} ${y + ry * .4} ${x - 8 * k} ${y + ry * .97} L${x + 8 * k} ${y + ry * .97} C${x + rx * .22} ${y + ry * .4} ${x + rx * .22} ${y - ry * .5} ${x} ${y - ry}Z`, c3) +
        E(x - rx * .42, y - ry * .3, rx * .14, ry * .3, '#ffffff', `opacity=".32" transform="rotate(18 ${x - rx * .42} ${y - ry * .3})"`) +
        P(`M${x - 26 * k} ${y + ry * .96} Q${x} ${y + ry * 1.06} ${x + 26 * k} ${y + ry * .96} L${x + 22 * k} ${y + ry} L${x - 22 * k} ${y + ry}Z`, '#3a1a3a');
    };
    const b3 = balloon(1560, 300, .5, '#f2b236', '#fff3dc', '#e8402a') + balloon(220, 250, .55, '#5fc0b0', '#fff3dc', '#2f8b7f') + balloon(1180, 200, .62, '#f78ab0', '#fff3dc', '#c8386a');
    const b2 = balloon(1000, 330, .9, '#f2b236', '#e8602a', '#fff3dc') + balloon(760, 560, .55, '#3f9792', '#fff3dc', '#f2b236');
    const b1 = balloon(500, 400, 1.15, '#e8402a', '#fff3dc', '#f2b236');
    const hillsD = P('M-800 1100 L-800 820 C-500 760 -200 790 120 840 C500 900 760 810 1100 790 C1500 770 1800 820 2400 800 L2400 1100Z', '#1d3a52');
    let houses = '';
    [[160, 840, 1], [330, 870, .9], [1250, 800, 1.1], [1430, 810, .9]].forEach(function (h) { const x = h[0], y = h[1], k = h[2]; houses += R(x, y - 70 * k, 86 * k, 70 * k, '#2a2c4e', `rx="${5 * k}"`) + P(`M${x - 10 * k} ${y - 66 * k} Q${x + 43 * k} ${y - 120 * k} ${x + 96 * k} ${y - 66 * k}Z`, '#4a2a5a') + R(x + 14 * k, y - 50 * k, 20 * k, 22 * k, '#ffd36a', `rx="${5 * k}"`) + R(x + 52 * k, y - 50 * k, 20 * k, 22 * k, '#ffd36a', `rx="${5 * k}"`) + C(x + 43 * k, y - 82 * k, 6 * k, '#ffd36a', 'opacity=".0"'); });
    let trees = '';
    for (let x = -300; x < 1900; x += 70 + r() * 50) { const k = .9 + r() * .8, y = 826 + r() * 30; trees += R(x - 4, y - 10, 8, 20, '#14283c') + E(x, y - 52 * k, 22 * k, 64 * k, r() > .5 ? '#16304a' : '#102840'); }
    const mid = hillsD + houses + trees;
    let grass = '', fl = '';
    for (let x = -300; x < 1900; x += 30) grass += L(`M${x} 1010 Q${x + 4} ${940 - (x % 5) * 9} ${x + 14} ${906 - (x % 7) * 9}`, x % 2 ? '#0f2438' : '#0b1c2e', 12);
    [[160, 960, .9], [700, 980, .8], [1300, 970, .9]].forEach(function (f) { fl += poppy(f[0], f[1], f[2], '#ff6a4a', r); });
    const near = R(-800, 980, 3200, 300, '#0b1c2e') + grass + fl;
    return [{ name: 'Céu e sol', f: .9, svg: sky }, { name: 'Montanhas', f: .6, svg: far }, { name: 'Balões distantes', f: .4, svg: b3 }, { name: 'Balões', f: .25, svg: b2 + b1 }, { name: 'Vila', f: .1, svg: mid }, { name: 'Primeiro plano', f: -.05, svg: near }];
  }

  window.ARCO_SCENES = {
    paisagem: { title: 'Paisagem em camadas', layers: paisagem() },
    caminho: { title: 'Vila, moinho e mar', layers: caminho() },
    caminho_noite: { title: 'Vila, moinho e mar: madrugada', layers: caminho('noite') },
    caminho_aurora: { title: 'Vila, moinho e mar: amanhecer', layers: caminho('aurora') },
    paisagem_txt: { title: 'Paisagem com texto atrás da montanha', layers: paisagemTexto() },
    raposa: { title: 'Menina e balão', layers: raposa() },
    cidade: { title: 'Lagoa dos patos', layers: cidade() },
    mar: { title: 'Rio de outono', layers: mar() },
    escada: { title: 'O morro e a casinha', layers: escada() },
    cartaz: { title: 'Cartaz com texto', layers: cartaz() },
    arq: { title: 'Desenho de arquitetura', layers: arq() },
    baloes: { title: 'Festa dos balões', layers: baloes() },
    foto2: { title: 'Fotografia em preto e branco', layers: [{ name: 'Fotografia', f: 0, svg: '<rect x="-600" y="-500" width="2800" height="2000" fill="#111"/><image href="midia/foto1.jpg" x="0" y="65.8" width="1600" height="868.4" preserveAspectRatio="none"/>' }] },
    foto1: { title: 'Fotografia em preto e branco', layers: [{ name: 'Fotografia', f: 0, svg: '<rect x="-400" y="-300" width="2400" height="1600" fill="#111"/><image href="midia/foto1.jpg" x="-26.5" y="50" width="1653" height="900" preserveAspectRatio="xMidYMid slice"/>' }] }
  };
})();
