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
  g.zi = { t: 0, st: g.th, sfx: {}, hide: g.stage > 0 };   // 過關後的新一幕：倒數完才讓主角現身
  g.zoneY = g.camY + H + 90;              // 先藏在畫面下方
  const p = g.p; p.vy = 0; p.dash = 0; p.dive = false;
  if (g.zi.hide) {
    // 主角現身的位置：畫面中下方，腳下一定放一塊可以踩的地板，附近的敵人先清掉
    p.x = W / 2; p.y = g.camY + H * .66; p.vx = 0;
    g.plats = g.plats.filter(o => o.type === 'ground' || Math.abs(o.y - p.y) > 26 || Math.abs(o.x - p.x) > 90);
    g.plats.push({ x: p.x, y: p.y + 4, w: 96, type: 'normal', bx: p.x, ph: 0, sp: 0, amp: 0 });
    g.enemies = g.enemies.filter(e => Math.hypot(e.x - p.x, e.y - p.y) > 120);
  }
}
function updateZIntro(dt) {
  const z = g.zi; z.t += dt;
  const once = (k, at, fn) => { if (z.t >= at && !z.sfx[k]) { z.sfx[k] = 1; fn(); } };
  const T = [() => { SFX.throw(); }, () => SFX.wind(), () => SFX.crack(), () => SFX.thunder()][z.st];
  once('a', .15, T);
  once('b', .95, () => { [() => SFX.boom(), () => { noise(.6, .08); SFX.wind(); }, () => { SFX.impact(); g.shake = 8; }, () => { noise(.9, .1); SFX.impact(); g.shake = 8; }][z.st](); vib(60); });
  for (let i = 0; i < 3; i++) once('c' + i, 1.6 + i * .6, () => tone(660, .1, 'square', .05));
  once('go', 3.4, () => SFX.fever());
  // 追兵從畫面下方升上來，停在看得到的位置
  g.zoneY = g.camY + H + 90 - zez((z.t - .8) / .9) * 130;
  if ((z.st === 2 || z.st === 3) && z.t > .2 && z.t < 1.6) g.shake = Math.max(g.shake, 3);
  if (g.shake > 0) g.shake = Math.max(0, g.shake - dt * 20);
  if (z.t >= ZI_T) {
    if (z.hide) { g.puffs.push({ x: g.p.x, y: g.p.y - 20, t: 0, r: 30 }); SFX.scroll(); }   // 倒數完：主角化煙現身
    state = 'play'; g.zi = null; g.p.vy = -JUMP; g.p.inv = Math.max(g.p.inv, .6);
  }
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
  } else if (st === 1) {   // 風：烏雲壓下、狂風大作，巨大的龍捲風從下方捲上來
    c.fillStyle = `rgba(40,50,70,${.45 * zez(k / .6)})`; c.fillRect(0, 0, W, H);
    c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 2;
    for (let i = 0; i < 10; i++) { const x = ((k * 760 + i * 97) % (W + 160)) - 80, y = H * (.15 + i * .07); c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x - 30, y - 8, x - 70, y); c.stroke(); }
    const q = zez((k - .35) / .8);
    if (q > 0) {
      const top = H - q * H * .62, cx = W / 2 + Math.sin(k * 3) * 14;
      // 漏斗：越往上越寬，帶著旋轉的條紋
      c.save(); c.globalAlpha = .92;
      c.fillStyle = '#7a8aa4'; c.beginPath(); c.moveTo(cx - 14, H + 10); c.quadraticCurveTo(cx - 40, (H + top) / 2, cx - W * .42, top); c.quadraticCurveTo(cx, top - 26, cx + W * .42, top); c.quadraticCurveTo(cx + 40, (H + top) / 2, cx + 14, H + 10); c.closePath(); c.fill();
      c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 2.4;
      for (let j = 0; j < 9; j++) { const yy = top + (H - top) * (j / 9), ww = 14 + (W * .42 - 14) * (1 - j / 9), a = k * 9 + j; c.beginPath(); c.ellipse(cx, yy + 6, ww * .95, 5 + ww * .06, 0, a % TAU, a % TAU + 2.6); c.stroke(); }
      c.restore();
      for (let i = 0; i < 10; i++) { const a = k * 7 + i * .63, rr2 = 30 + (i % 4) * 30, y = H - (i * 41 + k * 260) % (H - top + 1); c.save(); c.translate(cx + Math.cos(a) * rr2, y); c.rotate(a * 3); c.fillStyle = i % 2 ? '#8a6a3a' : '#c8a46a'; c.fillRect(-4, -2, 8, 4); c.restore(); }
    }
  } else if (st === 2) {   // 火：火山爆發，紅光一閃，岩漿柱噴上來再從下方湧起
    const fl = k > .25 && k < .7 ? 1 - (k - .25) / .45 : 0;
    if (fl > 0) { c.fillStyle = `rgba(255,120,40,${fl * .55})`; c.fillRect(0, 0, W, H); }
    const q = zez((k - .3) / .45) * (1 - zez((k - 1.2) / .6));
    if (q > 0) {   // 中央的岩漿柱
      const top = H - q * H * .75, gr = c.createLinearGradient(0, top, 0, H); gr.addColorStop(0, '#ffe27a'); gr.addColorStop(.4, '#ff7a1a'); gr.addColorStop(1, '#a82a08');
      c.fillStyle = gr; c.beginPath(); c.moveTo(W / 2 - 34, H); c.quadraticCurveTo(W / 2 - 22, (H + top) / 2, W / 2 - 14, top + 10); c.quadraticCurveTo(W / 2, top - 14, W / 2 + 14, top + 10); c.quadraticCurveTo(W / 2 + 22, (H + top) / 2, W / 2 + 34, H); c.closePath(); c.fill();
    }
    for (let i = 0; i < 9; i++) {   // 飛出的熔岩塊
      const t0 = .45 + i * .06, u = k - t0; if (u <= 0 || u > 1.6) continue;
      const vx = (i - 4) * 55, x = W / 2 + vx * u, y = H * .45 - 520 * u + 600 * u * u;
      c.fillStyle = '#2a0e06'; aCirc(c, x, y, 6 + (i % 3) * 2); c.fill(); c.strokeStyle = '#ffb04a'; c.lineWidth = 1.6; c.stroke();
      c.fillStyle = 'rgba(255,150,50,.5)'; aCirc(c, x - vx * .02, y + 8, 3); c.fill();
    }
  } else {   // 山：山頂轟隆一響，大塊積雪崩落，雪浪從谷底翻湧上來
    for (let i = 0; i < 14; i++) {   // 從上方崩落的雪塊
      const t0 = .1 + (i % 7) * .08, u = k - t0; if (u <= 0) continue;
      const x = W * ((i * .137) % 1), y = -30 + 700 * u * u, r = 8 + (i % 4) * 5;
      if (y > H + 30) continue;
      c.fillStyle = '#ffffff'; aCirc(c, x, y, r); c.fill(); c.strokeStyle = 'rgba(140,170,210,.8)'; c.lineWidth = 1.4; c.stroke();
      c.fillStyle = 'rgba(255,255,255,.5)'; aCirc(c, x, y - r * 1.6, r * .8); c.fill();
    }
    c.fillStyle = `rgba(255,255,255,${.35 * zez((k - .2) / .5) * (1 - zez((k - 1.4) / .4))})`; c.fillRect(0, 0, W, H);   // 雪煙
    const q = zez((k - .6) / .7) * (1 - zez((k - 1.4) / .5));
    if (q > 0) {   // 雪浪
      const cy = H - q * H * .4;
      c.fillStyle = '#f4f8fd'; c.beginPath(); c.moveTo(-10, H); c.lineTo(-10, cy + 20);
      for (let x = 0; x <= W + 40; x += 40) c.quadraticCurveTo(x - 20, cy - 30 - Math.sin(x * .1 + k * 6) * 12, x, cy + 10);
      c.lineTo(W + 10, H); c.fill();
      c.fillStyle = 'rgba(150,180,215,.5)'; for (let x = 0; x < W; x += 36) { c.beginPath(); c.arc(x + 18, cy + 26, 14, 0, Math.PI); c.fill(); }
    }
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
  g.asc = { t: 0, from: 4, to: g.stage % 5, sfx: {} };   // 從魔王的天空飛到下一個舞台（白天）的天空
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
  const A = g.asc, a = A.t, c = ctx, T0 = THEMES[g.th], F = { sky: TOD[A.from].sky || T0.sky }, T = { sky: TOD[A.to].sky || T0.sky };
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
    const reveal = zez((a - .8) / .7), fade = 1 - zez((a - 2.3) / .45);
    const title = T0.k + '・' + t('st_n', g.stage + 1);
    c.save(); c.globalAlpha = fade;
    c.fillStyle = 'rgba(192,38,45,.85)'; c.beginPath(); c.arc(W / 2, H * .36, 64 * zez((a - .8) / .3), 0, Math.PI * 2); c.fill();   // 朱紅色的圓（像印章、落日）
    c.beginPath(); c.rect(0, 0, W * reveal * 1.1, H); c.clip();
    c.font = `900 ${LI === 2 ? 32 : 40}px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle';
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
