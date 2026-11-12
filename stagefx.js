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
  if (!g.zi.hide && !g.tut) { startZI2(); return; }   // 遊戲開始（第一幕）：新的開場演出
  if (g.zi.hide) {
    // 主角現身的位置：畫面中下方，腳下一定放一塊可以踩的地板，附近的敵人先清掉
    p.x = W / 2; p.y = g.camY + H * .66; p.vx = 0;
    g.plats = g.plats.filter(o => o.type === 'ground' || Math.abs(o.y - p.y) > 26 || Math.abs(o.x - p.x) > 90);
    g.plats.push({ x: p.x, y: p.y + 4, w: 96, type: 'normal', bx: p.x, ph: 0, sp: 0, amp: 0 });
    g.enemies = g.enemies.filter(e => Math.hypot(e.x - p.x, e.y - p.y) > 120);
  }
}
function updateZIntro(dt) {
  g.t += dt;   // 開場演出中也讓遊戲時間前進：下方追兵（火海等）的動畫才不會停住
  const z = g.zi; z.t += dt;
  if (z.v2) return updateZI2(dt);
  const once = (k, at, fn) => { if (z.t >= at && !z.sfx[k]) { z.sfx[k] = 1; fn(); } };
  const T =[() => { SFX.throw(); }, () => SFX.wind(), () => SFX.crack(), () => SFX.thunder()][z.st];
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
    if (g.promoPending) { g.promoPending = false; openFull('boss'); }   // 第一次在林關擊倒魔王：介紹完整版
  }
}
function skipZIntro() { if (g && g.zi) g.zi.t = Math.max(g.zi.t, g.zi.v2 ? ZI2_T : ZI_T); }
function drawZIntro() {
  if (g.zi.v2) return drawZI2();
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
  // （「鬼火把竹林點燃了！往上逃！」這類字幕已移除：會干擾畫面）
  // 倒數 3、2、1、走！
  if (k > 1.6) {
    const n = Math.floor((k - 1.6) / .6), f = ((k - 1.6) % .6) / .6, s = n < 3 ? String(3 - n) : t('zi_go');
    const sc = n < 3 ? 1.6 - zez(f / .3) * .6 : 1 + zez(f / .3) * .2;
    c.save(); c.translate(W / 2, H * .62); c.scale(sc, sc); c.globalAlpha = n < 3 ? 1 - Math.max(0, f - .7) / .3 : 1;
    txt(s, 0, 0, n < 3 ? 64 : 44, '#ffffff', 'center', '#c0262d', 8); c.restore();
  }
  txt(t('zi_skip'), W - 12, H - 16, 11, 'rgba(255,255,255,.6)', 'right', '#000', 3);
}


// ===== 遊戲開始（第一幕）的開場 =====
// 站在地板中央 →「轟」地一聲，地面的火從左右瞬間燒到主角腳下 → 起跳，下方火海高速竄起 → 高速上升被火海追趕一段時間 →
// 上升中開始倒數 3、2、1、走！（同時慢慢減速）→ 落在那一層的地板，正式開始（過關後的新一幕仍用上面的舊演出）
const ZI2_IGN = .45, ZI2_JUMP = .68, ZI2_CD = 3.18, ZI2_LAND = 5.28, ZI2_T = 5.43;   // 點火、起跳、開始倒數、落地（＝「走！」）、結束
const ZI2_APEX = ZI2_LAND - .45;   // 減速到最高點的時間，之後 0.45 秒往下落到地板上
// 地面上燒過來的東西（依關卡的追兵）：林＝火、風＝捲起的旋風沙塵、火＝熔岩、山＝雪浪
const ZI2_PAL = [['#d8300a', '#ff7a1a', '#ffd25a'], ['#8a9ab4', '#c4d0e0', '#f0f4f8'], ['#8a1a06', '#e8501a', '#ffb04a'], ['#b8cce4', '#e4eef8', '#ffffff']];
// 上升的距離（以最高速 V 為單位）：起跳加速 0.25 秒＋全速到開始倒數＋倒數中線性減速到最高點
const ZI2_DIST = .06 + (ZI2_CD - ZI2_JUMP - .12) + (ZI2_APEX - ZI2_CD) / 2;   // 起跳加速只花 0.12 秒（一跳就衝出去，不會被火燒到）
function zi2Rise(t, V) {   // 起跳後 t 秒往上升了多少
  const a = .12, b = ZI2_CD - ZI2_JUMP, c = ZI2_APEX - ZI2_JUMP;
  if (t <= a) return V * t * t / (2 * a);
  if (t <= b) return V * (a / 2 + (t - a));
  const u = Math.min(t, c) - b, dur = c - b;
  return V * (a / 2 + (b - a) + u - u * u / (2 * dur));
}
function startZI2() {
  const z = g.zi, p = g.p;
  z.v2 = true;
  p.x = W / 2; p.y = 40; p.vx = 0; p.vy = 0; p.face = 1;   // 站在地板中央
  // 以約 900 px/秒（和切幕時穿過雲海的速度相近）上升，算出最高點，落點選最高點下方約 150 的地板
  const V0 = 900, apex0 = 40 - ZI2_DIST * V0, tgt = apex0 + 150;
  while (g.genY > tgt - 400) genRow();
  const c2 = g.plats.filter(o => (o.type === 'normal' || o.type === 'crumble') && Math.abs(o.y - tgt) < 90);
  c2.sort((a, b) => Math.abs(a.x - W / 2) + Math.abs(a.y - tgt) * .5 - Math.abs(b.x - W / 2) - Math.abs(b.y - tgt) * .5);
  let pl = c2[0];
  if (!pl) { pl = { x: W / 2, y: tgt, w: 90, type: 'normal', bx: W / 2, ph: 0, sp: 0, amp: 0 }; g.plats.push(pl); }
  if (pl.type === 'crumble') pl.type = 'normal';   // 落地的那一塊一定踩得穩
  g.enemies = g.enemies.filter(e => Math.hypot(e.x - pl.x, e.y - pl.y) > 140);   // 落點附近的敵人先清掉
  g.items = g.items.filter(it => it.y < pl.y - 40);   // 上升途中會經過的道具、金幣、卷軸直接清掉（反正拿不到）
  z.pl = pl; z.x0 = p.x; z.y0 = p.y;
  z.V = (40 - (pl.y - 150)) / ZI2_DIST;   // 依實際的地板高度微調速度，剛好落在它上面
}
function updateZI2(dt) {
  const z = g.zi, p = g.p, k = z.t;
  const once = (key, at, fn) => { if (k >= at && !z.sfx[key]) { z.sfx[key] = 1; fn(); } };
  once('ign', ZI2_IGN, () => { SFX.boom(); noise(1.1, .1); g.shake = 6; vib(80); });   // 轟！
  once('crouch', ZI2_JUMP - .14, () => tone(220, .12, 'triangle', .05, -60));
  once('jump', ZI2_JUMP, () => { SFX.jump(); SFX.dash(); SFX.boom(); g.shake = 9; vib(80); });
  once('chase', ZI2_JUMP + .15, () => { noise(1.4, .07); tone(90, 1.4, 'sawtooth', .03, 40); });
  for (let i = 0; i < 3; i++) once('c' + i, ZI2_CD + i * .7, () => tone(660, .1, 'square', .05));
  once('go', ZI2_LAND, () => SFX.fever());
  once('land', ZI2_LAND, () => { SFX.impact(); g.puffs.push({ x: p.x, y: p.y - 6, t: 0, r: 18 }); });
  const py0 = p.y;
  if (k < ZI2_JUMP) {   // 站著：快起跳前蹲低
    p.x = z.x0; p.y = z.y0; p.vy = 0; p.sq = k > ZI2_JUMP - .14 ? Math.min(1, (k - ZI2_JUMP + .14) / .1) * .8 : 0;
  } else {
    const u = k - ZI2_JUMP; p.sq = 0;
    if (k < ZI2_APEX) p.y = z.y0 - zi2Rise(u, z.V);
    else { const f = Math.min(1, (k - ZI2_APEX) / (ZI2_LAND - ZI2_APEX)); p.y = z.pl.y - 150 + 150 * f * f; }   // 最高點往下落到地板
    p.x = z.x0 + (z.pl.x - z.x0) * zez((k - ZI2_CD) / (ZI2_LAND - ZI2_CD));   // 倒數時慢慢移到落點的正上方
    if (k >= ZI2_LAND) p.y = z.pl.y;
    // 姿勢用的速度：上升最快時也不超過 -650（不會畫出速度線）
    p.vy = dt > 0 ? Math.max(-650, (p.y - py0) / dt) : 0; p.face = z.pl.x >= z.x0 ? 1 : -1;
  }
  if (p.y < g.camY + H * .42) g.camY = p.y - H * .42;   // 鏡頭跟著往上
  while (g.genY > g.camY - 150) genRow();
  // 下方的火海：和地面的火同時點燃，從畫面下方以固定速度往上竄，起跳那一刻剛好淹沒地板；
  // 之後不停頓地接著追主角（和主角的距離由 20 慢慢拉開到約 0.3 個畫面高），只會往上、不會退
  const zh = z.zh ?? (z.zh = g.camY + H + 90), vz = (zh - 58) / (ZI2_JUMP + .1 - ZI2_IGN), free = k < ZI2_IGN ? zh : zh - vz * (k - ZI2_IGN);   // 速度和之後追趕的速度相近，銜接時不會頓一下
  if (k < ZI2_JUMP) g.zoneY = Math.max(free, 66);
  else { const gap = 40 + (H * .3 - 40) * Math.min(1, (k - ZI2_JUMP) / 1.5) + Math.max(0, k - ZI2_CD) * 40; g.zoneY = Math.min(g.zoneY, Math.max(free, p.y + gap)); }
  if (g.shake > 0) g.shake = Math.max(0, g.shake - dt * 20);
  if (k >= ZI2_T) {
    p.y = z.pl.y; state = 'play'; g.zi = null; p.vy = -JUMP; p.inv = Math.max(p.inv, .6);
    g.y0 = p.y; g.top = 0; g.base = 0;   // 開場上升的高度不算：高度、分數與舞台長度都從落地處重新算起
    if (g.promoPending) { g.promoPending = false; openFull('boss'); }
  }
}
function drawZI2() {
  const z = g.zi, c = ctx, k = z.t, pal = ZI2_PAL[z.st] || ZI2_PAL[0];
  const snow = z.st === 3, wind = z.st === 1;   // （左右兩旁的地面點火演出已移除：火海直接從下方竄上來）
  // 上升中：火海往上噴的火星（感受被追趕）
  if (k > ZI2_JUMP && k < ZI2_LAND && !snow && !wind) {
    const zy = Math.min(g.zoneY, g.camY + H - 26) - g.camY;
    for (let i = 0; i < 16; i++) { const f = (k * 1.3 + i / 16) % 1, x = (i * 53.7 + Math.sin(k * 3 + i) * 20) % W, y = zy - f * H * .35; c.fillStyle = `rgba(255,${160 + (i % 4) * 20},70,${(1 - f) * .9})`; aCirc(c, x, y, 2.6 * (1 - f) + .6); c.fill(); }
  }
  // 被追趕一段時間後才開始倒數 3、2、1、走！（放在畫面上方，不擋到主角）
  if (k >= ZI2_CD) {
    const u = k - ZI2_CD, n = Math.floor(u / .7), f = (u % .7) / .7, s = n < 3 ? String(3 - n) : t('zi_go');
    if (n <= 3) {
      const sc = n < 3 ? 1.6 - zez(f / .3) * .6 : 1 + zez(f / .3) * .2;
      c.save(); c.translate(W / 2, H * .2); c.scale(sc, sc); c.globalAlpha = n < 3 ? 1 - Math.max(0, f - .7) / .3 : 1 - Math.max(0, (u - 2.1) - .1) / .2;
      txt(s, 0, 0, n < 3 ? 64 : 44, '#ffffff', 'center', '#c0262d', 8); c.restore();
    }
  }
  if (k < ZI2_LAND) txt(t('zi_skip'), W - 12, H - 16, 11, 'rgba(255,255,255,.6)', 'right', '#000', 3);
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
