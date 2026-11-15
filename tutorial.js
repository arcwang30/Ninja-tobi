'use strict';
/* NINJA 鳶 TOBI — 新手教學（在 levels.js 之後載入）
   在林的竹林裡一步一步練習：移動 → 往上爬 → 碰到敵人斬殺 → 衝刺斬 → 急降斬 → 蹬牆跳 → 吸魂升級 → 忍法卷軸
   教學中不會受傷、下方沒有追兵、沒有魔王；右上角有「跳過教學」。第一次按「開始修行」會自動進入，之後可在選關畫面重玩 */
const TUT_STEPS = [
  { k: 'move', t: ['按住畫面，左右滑動來移動', '画面を押したまま左右にスライドで移動', 'Hold and slide left/right to move'],
    start() { g.tut.mx = 0; }, done: () => g.tut.mx > 260 },
  { k: 'climb', t: ['忍者會自動彈跳，踩著雲往上爬吧', '忍者は自動で跳ねる。雲を踏んで上へ', 'You bounce on your own. Climb the clouds!'],
    start() { g.tut.y0 = g.top; }, done: () => g.top - g.tut.y0 > 450 },
  { k: 'touch', t: ['碰到敵人就會自動斬殺！斬掉 3 個', '敵に触れると自動で斬る！3体斬ろう', 'Touch enemies to slash them! Defeat 3'],
    start() { g.tut.k0 = g.kills; tutFoes(3, 0); }, done: () => g.kills - g.tut.k0 >= 3, refill: 3 },
  { k: 'flick', t: ['手指快速往上、左上或右上滑：衝刺斬，往滑的方向衝過去斬殺敵人', '指を素早く上・左上・右上へはらう：突進斬り、その方向へ突っ込んで敵を斬る', 'Flick up, up-left or up-right: Dash Slash — charge and cut foes'],
    start() { g.tut.dash = 0; g.ki = kiMax(); tutFoes(2, 0); }, done: () => g.tut.dash > 0 },
  { k: 'dive', t: ['手指快速往下滑：急降斬，著地震波斬殺周圍', '指を素早く下へはらう：急降斬、着地の衝撃波で周りを斬る', 'Flick down: Dive Slash, the landing shockwave cuts foes'],
    start() { g.tut.dive = 0; }, done: () => g.tut.dive > 0 },
  { k: 'wall', t: ['在空中往牆壁推：蹬牆跳', '空中で壁に向かって押す：壁蹴り', 'Push into a wall mid-air: Wall Kick'],
    start() { g.tut.w0 = g.walls; }, done: () => g.walls > g.tut.w0 },
  { k: 'soul', t: ['吸收藍色的魂，集滿就升級，從三個強化選一個', '青い魂を集めてレベルアップ、3つから1つ選ぶ', 'Collect blue souls to level up, then pick 1 of 3'],
    start() { g.tut.lv0 = g.lv; tutSouls(); },
    done: () => g.lv > g.tut.lv0 && state === 'play' },
  { k: 'scroll', t: ['點一下畫面下方中間的卷軸按鈕：忍法「豪天翔」，無敵並急速上升', '画面下の中央の巻物ボタンをタップ：忍法「豪天翔」で無敵の急上昇', 'Tap the scroll button (lower center): soar up, invincible'],
    start() { g.scrolls = Math.max(g.scrolls, 1); g.tut.s0 = g.scrollN; }, done: () => g.scrollN > g.tut.s0 },
];
// 在主角身邊放一圈魂：總量一定夠升一級（之前固定 12 點，等級高時不夠升級，教學就卡住）
function tutSouls() {
  const p = g.p, need = Math.max(1, xpNeed(g.lv) - g.xp) / (1 + .08 * mt('xp')), n = 6, v = Math.ceil(need / n) + 1;
  for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; g.drops.push({ k: 'soul', x: clamp(p.x + Math.cos(a) * 50, WALL + 20, W - WALL - 20), y: p.y - 40 + Math.sin(a) * 40, vx: 0, vy: -60, v, ph: rnd(0, 6), pull: true }); }
}
// 在主角上方放幾個敵人（不會攻擊的一般忍者）
function tutFoes(n, type) {
  const p = g.p;
  for (let i = 0; i < n; i++) { const e = mkEnemy(type, clamp(p.x + (i - (n - 1) / 2) * 70 + rnd(-10, 10), WALL + 30, W - WALL - 30), p.y - 150 - i * 30, 0); e.amp = 0; e.tut = 1; g.enemies.push(e); }
}
function startTutorial() {
  save.seen = Math.max(save.seen || 0, 2);
  startRun(LEVELS.findIndex(l => l.th === 0));   // 林的關卡
  g.zi = null; state = 'play'; g.banner = null;
  g.skills = {};   // 先不給自動技能，免得敵人被技能搶先斬掉
  g.zoneY = 1e9;
  g.tut = { i: 0, t: 0, ok: 0 };
  g.items = []; g.drops = [];   // 開局已經生成的小判、卷軸、寶箱也清掉
  TUT_STEPS[0].start();
  document.body.classList.add('tut');
}
const TUT_REWARD = 300;
function endTutorial(finished) {
  document.body.classList.remove('tut');
  // 第一次就把教學做完：獎勵 300 小判（跳過不給；之後從說明重玩也不給）
  const reward = finished && !save.tut ? TUT_REWARD : 0;
  if (reward) { save.coins += reward; if (save.stats) save.stats.coins += reward; SFX.coin(); }
  save.tut = 1; persist();
  if (finished) toast(reward ? t('tut_done_r', reward) : t('tut_done'));
  g = null; paused = false; hideAll();
  goTitle(); openLvSel();
}
function updateTutorial(dt) {
  const T = g.tut, S = TUT_STEPS[T.i], p = g.p;
  if (T.fin) { T.finT += dt; if (T.finT > 2.2 && !T.ending) { T.ending = true; setTimeout(() => endTutorial(true), 0); } return; }   // 等這一幀跑完再結束   // 全部完成：顯示 2 秒後回選關
  T.t += dt; g.ki = kiMax();   // 教學中「氣」永遠是滿的（急降斬、衝刺斬才不會因為沒氣而卡住）
  if (S.k === 'move') T.mx += Math.abs(p.x - (T.px ?? p.x)); T.px = p.x;
  // 掉出畫面就把主角救回來（教學裡沒有追兵）
  if (p.y > g.camY + H + 40) { p.y = g.camY + H * .5; p.vy = -JUMP; g.plats.push({ x: p.x, y: p.y + 4, w: 90, type: 'normal', bx: p.x, ph: 0, sp: 0, amp: 0 }); }
  // 敵人被斬光或跑出畫面了：再補
  if (S.refill && !T.ok && !g.enemies.some(e => e.tut && !e.dead && e.y > g.camY - 40 && e.y < g.camY + H)) tutFoes(S.refill, 0);
  if (S.k === 'flick' && !T.ok) { g.ki = kiMax(); if (!g.enemies.some(e => e.tut && !e.dead && e.y > g.camY && e.y < g.camY + H)) tutFoes(2, 0); }
  // 魂被吃完卻還沒升級（或掉出畫面）：再補一圈
  if (S.k === 'soul' && !T.ok && state === 'play' && !g.drops.some(d => d.k === 'soul')) tutSouls();
  if (!T.ok && S.done()) { T.ok = T.t; SFX.item(); floatText(W / 2, 120, t('tut_good'), '#ffd27a', 22, true); }
  if (T.ok && T.t - T.ok > 1.1) {
    T.i++; T.ok = 0; T.t = 0;
    if (T.i >= TUT_STEPS.length) { T.fin = true; T.i = TUT_STEPS.length - 1; T.finT = 0; SFX.fever(); }
    else TUT_STEPS[T.i].start();
  }

}
// 教學提示：上方的說明框（第幾步、要做什麼）＋手勢動畫
function drawTutorial() {
  const T = g.tut, S = TUT_STEPS[T.i], c = ctx, y = SAFE_T + HUD_Y1 + 58, bw = W * .9, bh = 74;
  c.save();
  c.globalAlpha = .92; c.fillStyle = '#10141e'; rr(W / 2 - bw / 2, y, bw, bh, 12); c.fill(); c.globalAlpha = 1;
  c.strokeStyle = T.ok || T.fin ? '#7aff9a' : '#e8b84a'; c.lineWidth = 2.5; rr(W / 2 - bw / 2, y, bw, bh, 12); c.stroke();
  if (T.fin) { txt(t('tut_fin'), W / 2, y + bh / 2, 20, '#ffd27a', 'center', '#000', 4); c.restore(); return; }
  txt(t('tut_step', T.i + 1, TUT_STEPS.length), W / 2 - bw / 2 + 12, y + 14, 11, '#ffd27a', 'left', '#000', 3);
  // 說明文字（太長就換行）
  const s = L(S.t), mw = bw - 80; c.font = `900 14px ${FONT}`; const lines = []; let ln = '';
  for (const ch of s) { if (c.measureText(ln + ch).width > mw) { lines.push(ln); ln = ch; } else ln += ch; } lines.push(ln);
  lines.forEach((l, i) => txt(l, W / 2 - bw / 2 + 12, y + 34 + i * 19 - (lines.length - 1) * 4, 14, T.ok ? '#7aff9a' : '#fff', 'left', '#000', 3));
  // 手勢圖示
  const gx = W / 2 + bw / 2 - 36, gy = y + bh / 2, k = (g.t * 1.2) % 1;
  c.strokeStyle = '#fff'; c.fillStyle = '#fff'; c.lineWidth = 2.4; c.lineCap = 'round';
  const finger = (x, y2, press) => { c.globalAlpha = .95; aCirc(c, x, y2, press ? 7 : 8); c.fillStyle = press ? '#ffd27a' : '#fff'; c.fill(); c.globalAlpha = 1; };
  const arrow = (x1, y1, x2, y2) => { c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke(); const a = Math.atan2(y2 - y1, x2 - x1); c.beginPath(); c.moveTo(x2, y2); c.lineTo(x2 - Math.cos(a - .5) * 7, y2 - Math.sin(a - .5) * 7); c.moveTo(x2, y2); c.lineTo(x2 - Math.cos(a + .5) * 7, y2 - Math.sin(a + .5) * 7); c.stroke(); };
  if (S.k === 'move') { arrow(gx - 4, gy, gx - 22, gy); arrow(gx + 4, gy, gx + 22, gy); finger(gx + Math.sin(g.t * 4) * 16, gy + 12, true); }
  else if (S.k === 'scroll') {   // 豪天翔：畫一顆縮小版的卷軸按鈕（和畫面下方中間那顆一樣），手指點一下
    const r = 19, pu = .5 + .5 * Math.sin(g.t * 5), j = curJutsu();
    c.save();
    const gl = c.createRadialGradient(gx, gy, r * .6, gx, gy, r * 1.5); gl.addColorStop(0, `rgba(255,210,90,${.3 + .25 * pu})`); gl.addColorStop(1, 'rgba(255,210,90,0)'); c.fillStyle = gl; aCirc(c, gx, gy, r * 1.5); c.fill();
    aCirc(c, gx, gy, r + 2.5); c.fillStyle = INK; c.fill();
    const bg = c.createRadialGradient(gx - 6, gy - 7, 3, gx, gy, r); bg.addColorStop(0, '#3a4a7a'); bg.addColorStop(1, '#141a36'); aCirc(c, gx, gy, r); c.fillStyle = bg; c.fill();
    c.lineWidth = 2.4; c.strokeStyle = '#e8b84a'; aCirc(c, gx, gy, r - 1.5); c.stroke();
    c.translate(gx, gy - 1); c.rotate(-.35); c.scale(.72, .72);
    c.beginPath(); if (c.roundRect) c.roundRect(-16, -7, 32, 14, 3); else c.rect(-16, -7, 32, 14); c.fillStyle = '#fff3d0'; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.6; c.stroke();
    c.fillStyle = jutsuBand(j); c.fillRect(-3, -7, 6, 14);
    for (const sx of [-1, 1]) { c.beginPath(); if (c.roundRect) c.roundRect(sx * 16 - 3, -9, 6, 18, 2); else c.rect(sx * 16 - 3, -9, 6, 18); c.fillStyle = '#6a3a1e'; c.fill(); c.stroke(); }
    c.restore();
    const tap = k < .25;   // 每一拍的開頭按下去
    finger(gx + 10, gy + 12 - (tap ? 0 : 3), tap);
    if (tap) { c.strokeStyle = `rgba(255,255,255,${1 - k * 4})`; c.lineWidth = 2; aCirc(c, gx, gy, r + 3 + k * 24); c.stroke(); }   // 點擊漣漪
  }
  else if (S.k === 'climb') { arrow(gx, gy + 18, gx, gy - 20); }
  else if (S.k === 'touch') { drawStar4(c, gx, gy, 10 + Math.sin(g.t * 6) * 3, g.t * 3, '#ffd27a'); }
  else if (S.k === 'flick') { const D = [[0, -1], [-.72, -.7], [.72, -.7]], di = Math.floor(g.t * 1.2) % 3; for (const [dx, dy] of D) arrow(gx - dx * 12, gy - dy * 12 + 6, gx + dx * 22, gy + dy * 22 + 6); const [fx, fy] = D[di]; finger(gx + fx * (-12 + k * 34), gy + 6 + fy * (-12 + k * 34), true); }   // 往上、左上、右上三個方向，手指輪流示範
  else if (S.k === 'dive') { arrow(gx, gy - 18, gx, gy + 20); finger(gx, gy - 18 + k * 38, true); }
  else if (S.k === 'wall') { c.fillStyle = '#8a6a3a'; c.fillRect(gx + 16, gy - 22, 6, 44); c.strokeStyle = '#fff'; arrow(gx - 14, gy, gx + 12, gy); }
  else if (S.k === 'soul') { c.fillStyle = '#5ad1ff'; aCirc(c, gx, gy + Math.sin(g.t * 5) * 4, 8); c.fill(); }
  // 卷軸那一步：在 HUD 的卷軸上畫一個閃爍的圈
  if (S.k === 'scroll' && !T.ok) { const sb = scrollBtnPos(); c.strokeStyle = `rgba(255,210,90,${.5 + .5 * Math.sin(g.t * 8)})`; c.lineWidth = 4; aCirc(c, sb.x, sb.y, sb.r + 8 + 4 * Math.sin(g.t * 8)); c.stroke(); }
  c.restore();
}
