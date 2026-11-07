'use strict';
/* NINJA 鳶 TOBI — 關卡演出（在 game.js 之後載入；用到的 g、ctx、W、H… 都在呼叫時才讀取）
   ・每一幕開始：交代下方為什麼有東西追上來（林：鬼火點燃竹林／風：大浪捲來／火：鬼群從地底爬上／山：山洪暴發），
     接著倒數 3、2、1 才開始往上追；點一下可跳過
   ・打倒魔王：衝擊波把主角彈上高空、穿過雲海，天空漸漸換成下一幕的顏色，同時用毛筆字寫出「第N幕・X」，
     字幕消失、雲層散開後才接下一幕的開場演出 */
const ZI_T = 3.6, AS_T = 3.4;
const zez = x => x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x);

// ===== 每一幕的開場演出 =====
function startZIntro() {
  state = 'zintro';
  g.zi = { t: 0, st: g.stage % 4, sfx: {} };
  g.zoneY = g.camY + H + 90;              // 先藏在畫面下方
  const p = g.p; p.vy = 0; p.dash = 0; p.dive = false;
}
function updateZIntro(dt) {
  const z = g.zi; z.t += dt;
  const once = (k, at, fn) => { if (z.t >= at && !z.sfx[k]) { z.sfx[k] = 1; fn(); } };
  const T = [() => { SFX.throw(); }, () => SFX.wind(), () => SFX.crack(), () => SFX.thunder()][z.st];
  once('a', .15, T);
  once('b', .95, () => { [() => SFX.boom(), () => { noise(.6, .08); SFX.wind(); }, () => { SFX.impact(); g.shake = 8; }, () => { SFX.thunder(); g.shake = 6; }][z.st](); vib(60); });
  for (let i = 0; i < 3; i++) once('c' + i, 1.6 + i * .6, () => tone(660, .1, 'square', .05));
  once('go', 3.4, () => SFX.fever());
  // 追兵從畫面下方升上來，停在看得到的位置
  g.zoneY = g.camY + H + 90 - zez((z.t - .8) / .9) * 130;
  if (z.st === 2 && z.t > .2 && z.t < 1.6) g.shake = Math.max(g.shake, 3);
  if (g.shake > 0) g.shake = Math.max(0, g.shake - dt * 20);
  if (z.t >= ZI_T) { state = 'play'; g.zi = null; g.p.vy = -JUMP; g.p.inv = Math.max(g.p.inv, .6); }
}
function skipZIntro() { if (g && g.zi) g.zi.t = Math.max(g.zi.t, ZI_T); }
function drawZIntro() {
  const z = g.zi, c = ctx, k = z.t, st = z.st;
  // 情境演出
  if (st === 0) {   // 林：鬼火飛上來點燃竹林
    for (let i = 0; i < 5; i++) {
      const t0 = .15 + i * .08, q = zez((k - t0) / .7);
      if (q <= 0) continue;
      const x = W * (.12 + i * .19), y = H + 30 - Math.sin(q * Math.PI * .5) * H * .32;
      if (q < 1) drawEnemy(x + Math.sin(k * 6 + i) * 6, y, 10, 1.1, k + i, { vx: 0, vy: -200 });
      else if (k - t0 - .7 < .5) { const f = (k - t0 - .7) / .5; c.globalAlpha = 1 - f; for (let j = 0; j < 7; j++) { const a = j / 7 * Math.PI * 2; c.fillStyle = j % 2 ? '#ffd25a' : '#ff6a1a'; c.beginPath(); c.arc(x + Math.cos(a) * 26 * f, y + Math.sin(a) * 20 * f - f * 20, 8 * (1 - f) + 2, 0, Math.PI * 2); c.fill(); } c.globalAlpha = 1; }
    }
  } else if (st === 1) {   // 風：狂風＋大浪捲上來
    c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 2;
    for (let i = 0; i < 9; i++) { const x = ((k * 700 + i * 97) % (W + 160)) - 80, y = H * (.2 + i * .07); c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x - 30, y - 8, x - 70, y); c.stroke(); }
    const q = zez((k - .4) / .7) * (1 - zez((k - 1.3) / .5)), cy = H - q * H * .42;
    if (q > 0) {
      c.fillStyle = '#2f8ad8'; c.beginPath(); c.moveTo(-10, H); c.lineTo(-10, cy + 40);
      c.quadraticCurveTo(W * .35, cy - 30, W * .62, cy); c.quadraticCurveTo(W * .8, cy + 6, W * .74, cy + 34); c.quadraticCurveTo(W * .9, cy + 24, W + 10, cy + 50); c.lineTo(W + 10, H); c.fill();
      c.strokeStyle = '#ffffff'; c.lineWidth = 4; c.beginPath(); c.moveTo(-10, cy + 40); c.quadraticCurveTo(W * .35, cy - 30, W * .62, cy); c.quadraticCurveTo(W * .8, cy + 6, W * .74, cy + 34); c.stroke();
      c.fillStyle = 'rgba(255,255,255,.85)'; for (let i = 0; i < 10; i++) { c.beginPath(); c.arc(W * .3 + i * 22 + Math.sin(k * 9 + i) * 6, cy - 12 - (i % 3) * 8 - Math.sin(k * 7 + i) * 5, 3 + (i % 2), 0, Math.PI * 2); c.fill(); }
    }
  } else if (st === 2) {   // 火：地面龜裂，鬼爪從地底伸上來
    const q = zez((k - .3) / .5);
    c.strokeStyle = `rgba(255,120,40,${q})`; c.lineWidth = 3;
    for (let i = 0; i < 5; i++) { let x = W * (.1 + i * .2), y = H; c.beginPath(); c.moveTo(x, y); for (let j = 0; j < 5; j++) { x += (j % 2 ? 12 : -10); y -= 18 * q; c.lineTo(x, y); } c.stroke(); }
    for (let i = 0; i < 4; i++) {
      const h = zez((k - .6 - i * .1) / .7), x = W * (.16 + i * .23), y = H + 40 - h * 120;
      if (h <= 0) continue;
      c.fillStyle = i % 2 ? '#8a2a8a' : '#c0262d'; c.strokeStyle = '#0e1414'; c.lineWidth = 3;
      c.beginPath(); c.moveTo(x - 12, H + 40); c.lineTo(x - 10, y + 10); c.quadraticCurveTo(x, y - 6, x + 10, y + 10); c.lineTo(x + 12, H + 40); c.closePath(); c.fill(); c.stroke();
      for (let f = -1; f <= 1; f++) { c.beginPath(); c.moveTo(x + f * 6 - 3, y + 4); c.lineTo(x + f * 8, y - 14 - Math.abs(f) * -4); c.lineTo(x + f * 6 + 3, y + 4); c.closePath(); c.fillStyle = '#f5e6b8'; c.fill(); c.stroke(); }
    }
    if (k > 1) { c.fillStyle = `rgba(255,220,60,${.6 + .4 * Math.sin(k * 10)})`; for (let i = 0; i < 4; i++) { c.beginPath(); c.ellipse(W * (.24 + i * .18) - 5, H - 18, 3.5, 1.8, .3, 0, Math.PI * 2); c.ellipse(W * (.24 + i * .18) + 5, H - 18, 3.5, 1.8, -.3, 0, Math.PI * 2); c.fill(); } }
  } else {   // 山：大雨、雷光，山洪漫上來
    c.strokeStyle = 'rgba(200,220,255,.55)'; c.lineWidth = 1.5;
    for (let i = 0; i < 40; i++) { const x = (i * 53 + k * 90) % W, y = ((i * 97) + k * 900) % H; c.beginPath(); c.moveTo(x, y); c.lineTo(x - 6, y + 18); c.stroke(); }
    if (k > .4 && k < .7) { c.fillStyle = `rgba(255,255,255,${(1 - (k - .4) / .3) * .7})`; c.fillRect(0, 0, W, H); }
    if (k > .9 && k < 1.2) { c.fillStyle = `rgba(255,255,255,${(1 - (k - .9) / .3) * .5})`; c.fillRect(0, 0, W, H); }
  }
  // 字幕：發生什麼事＋往上逃
  if (k > .9) {
    const a = zez((k - .9) / .25), sc = 1 + (1 - a) * .5, y = H * .42;
    c.save(); c.globalAlpha = a; c.translate(W / 2, y); c.scale(sc, sc);
    c.fillStyle = 'rgba(0,0,0,.55)'; rr(-W * .44, -38, W * .88, 76, 14); c.fill();
    txt(t('zi_' + st), 0, -12, 18, '#ffffff', 'center', '#000', 4);
    txt(t('zi_run'), 0, 18, 22, '#ffd27a', 'center', '#c0262d', 5);
    c.restore();
  }
  // 倒數 3、2、1、走！
  if (k > 1.6) {
    const n = Math.floor((k - 1.6) / .6), f = ((k - 1.6) % .6) / .6, s = n < 3 ? String(3 - n) : t('zi_go');
    const sc = n < 3 ? 1.6 - zez(f / .3) * .6 : 1 + zez(f / .3) * .2;
    c.save(); c.translate(W / 2, H * .62); c.scale(sc, sc); c.globalAlpha = n < 3 ? 1 - Math.max(0, f - .7) / .3 : 1;
    txt(s, 0, 0, n < 3 ? 64 : 44, '#ffffff', 'center', '#c0262d', 8); c.restore();
  }
  txt(t('zi_skip'), W - 12, H - 16, 11, 'rgba(255,255,255,.6)', 'right', '#000', 3);
}

// ===== 打倒魔王：飛昇過雲海＋毛筆字標題 =====
function startAscend() {
  g.ascendPending = false;
  state = 'ascend';
  g.asc = { t: 0, from: Math.max(0, g.stage - 1), to: g.stage, sfx: {} };
  SFX.dash(); SFX.wind();
}
function updateAscend(dt) {
  const a = g.asc; a.t += dt;
  if (a.t >= .8 && !a.sfx.title) { a.sfx.title = 1; SFX.impact(); }
  if (a.t >= 2.8 && !a.sfx.out) { a.sfx.out = 1; SFX.wind(); }
  updateFx(dt);
  if (a.t >= AS_T) { g.asc = null; startZIntro(); }
}
function skipAscend() { if (g && g.asc && g.asc.t < 2.8) g.asc.t = 2.8; }
const mixHex = (h1, h2, q) => { const a = parseInt(h1.slice(1), 16), b = parseInt(h2.slice(1), 16), m = (s) => Math.round(((a >> s) & 255) * (1 - q) + ((b >> s) & 255) * q); return `rgb(${m(16)},${m(8)},${m(0)})`; };
function drawAscend() {
  const A = g.asc, a = A.t, c = ctx, F = THEMES[A.from % 4], T = THEMES[A.to % 4];
  // 雲層的邊界：先從上往下蓋住畫面，最後再往下散開露出新的一幕
  const e1 = -40 + (H + 80) * zez(a / .55), e2 = -40 + (H + 80) * zez((a - 2.8) / .6);
  const y0 = a < 2.8 ? 0 : e2, y1 = a < 2.8 ? e1 : H + 40;
  c.save(); c.beginPath(); c.rect(0, y0, W, y1 - y0); c.clip();
  const q = zez((a - .6) / 1.8);
  const gr = c.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, mixHex(F.sky[0], T.sky[0], q)); gr.addColorStop(1, mixHex(F.sky[1], T.sky[1], q));
  c.fillStyle = gr; c.fillRect(0, 0, W, H);
  // 雲海往下飛過（兩層，近的快）
  for (const [sp, sz, al] of [[260, 1, .55], [620, 1.6, .9]]) {
    c.fillStyle = `rgba(255,255,255,${al})`;
    for (let i = 0; i < 7; i++) { const x = ((i * 137) % (W + 80)) - 40, y = ((i * 211 + a * sp) % (H + 200)) - 100; for (const [dx, dy, r] of [[0, 0, 24], [-22, 8, 17], [24, 6, 19]]) { c.beginPath(); c.arc(x + dx * sz, y + dy * sz, r * sz, 0, Math.PI * 2); c.fill(); } }
  }
  c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = 2;
  for (let i = 0; i < 12; i++) { const x = (i * 71) % W, y = ((i * 133) + a * 1300) % (H + 100) - 50; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + 40); c.stroke(); }
  drawHeroNinja(W / 2 + Math.sin(a * 3) * 10, H * .74 + Math.sin(a * 5) * 6, { face: 1, t: a, vy: -900, skin: save.skin, eye: 'focus' }, ctx);
  // 毛筆字標題「第N幕・X」：由左到右像寫字一樣出現，停留後淡出
  if (a > .8 && a < 2.8) {
    const reveal = zez((a - .8) / .7), fade = 1 - zez((a - 2.3) / .45), loop = Math.floor(A.to / 4);
    const title = L(STR.act)[A.to % 4] + '・' + T.k + (loop ? t('loop', loop) : '');
    c.save(); c.globalAlpha = fade;
    c.fillStyle = 'rgba(192,38,45,.85)'; c.beginPath(); c.arc(W / 2, H * .36, 64 * zez((a - .8) / .3), 0, Math.PI * 2); c.fill();   // 朱紅色的圓（像印章、落日）
    c.beginPath(); c.rect(0, 0, W * reveal * 1.1, H); c.clip();
    c.font = `900 ${LI === 2 ? 34 : 46}px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.lineWidth = 10; c.lineJoin = 'round'; c.strokeStyle = 'rgba(255,255,255,.9)'; c.strokeText(title, W / 2, H * .36);
    c.fillStyle = '#141414'; c.fillText(title, W / 2, H * .36);
    // 筆刷的飛白：在字下方拉一道墨色筆畫
    c.fillStyle = '#141414'; c.beginPath(); c.moveTo(W * .14, H * .36 + 34); c.quadraticCurveTo(W * .5, H * .36 + 26, W * .86, H * .36 + 36); c.lineTo(W * .86, H * .36 + 40); c.quadraticCurveTo(W * .5, H * .36 + 34, W * .14, H * .36 + 40); c.fill();
    c.restore();
  }
  c.restore();
  // 雲層的邊緣（一排蓬鬆的雲）
  for (const ey of [a < 2.8 ? e1 : e2]) {
    if (ey <= -30 || ey >= H + 30) continue;
    c.fillStyle = '#ffffff';
    for (let x = -10; x < W + 30; x += 26) { c.beginPath(); c.arc(x, ey + Math.sin(x + a * 4) * 4, 18 + Math.sin(x * .7) * 5, 0, Math.PI * 2); c.fill(); }
  }
  if (a < 2.8) txt(t('zi_skip'), W - 12, H - 16, 11, 'rgba(0,0,0,.45)', 'right', null);
}
