'use strict';
/* NINJA 鳶 TOBI — 美術繪圖：全部用程式畫（竹林夜襲風格：深色描邊、兩階明暗、可愛 Q 版）
   這個檔案在 game.js 之前載入，只定義繪圖函式；用到的 ctx、W、H、g、ENEMY… 都在呼叫時才讀取。
   內容：敵人（含動作）、魔王、背景（四幕視差圖層，快取成畫布）、牆壁、死亡區域、地板、道具、技能與攻擊特效、斬殺演出 */

// ===== 共用小工具 =====
const TAU = Math.PI * 2;
function aCirc(c, x, y, r) { c.beginPath(); c.arc(x, y, r, 0, TAU); }
function aEll(c, x, y, rx, ry, rot = 0) { c.beginPath(); c.ellipse(x, y, rx, ry, rot, 0, TAU); }
function aInk(c, lw = 2) { c.lineWidth = lw; c.strokeStyle = INK; c.lineJoin = 'round'; c.lineCap = 'round'; c.stroke(); }
function aFI(c, col, lw = 2) { c.fillStyle = col; c.fill(); aInk(c, lw); }
// 有描邊的粗線（手腳）：先畫粗黑線再畫顏色
function aLimb(c, pts, w, col) {
  c.lineCap = 'round'; c.lineJoin = 'round';
  for (const [lw, s] of [[w + 3.2, INK], [w, col]]) {
    c.beginPath(); c.moveTo(pts[0], pts[1]);
    if (pts.length === 6) c.quadraticCurveTo(pts[2], pts[3], pts[4], pts[5]); else c.lineTo(pts[2], pts[3]);
    c.lineWidth = lw; c.strokeStyle = s; c.stroke();
  }
}
// 可重現的亂數（背景圖層每次產生都一樣）
function aRng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const WHITE_PAL = new Proxy({}, { get: () => '#ffffff' });   // 被斬中閃白：所有顏色都變白

// ===== 敵忍者 =====
// 顏色：suit 衣服、dk 暗部、band 頭巾、eye 眼睛發光色（菁英）
const FOE = {
  0: { suit: '#262633', dk: '#16161f', band: '#d8323c', skin: '#f6d3ad' },
  1: { suit: '#2c2c3a', dk: '#191924', band: '#d8323c', skin: '#f6d3ad', guard: '#5a5f6e' },
  2: { suit: '#292935', dk: '#17171f', band: '#d8323c', skin: '#f6d3ad' },
  3: { suit: '#22305a', dk: '#141c38', band: '#6fc3f0', skin: '#f6d3ad' },
  4: { suit: '#41444d', dk: '#272a31', band: '#d8323c', skin: '#f6d3ad' },
  5: { suit: '#6a1f22', dk: '#3f1012', band: '#ff6a2a', skin: '#f6d3ad' },
  6: { suit: '#55308a', dk: '#341a5c', band: '#f2c14e', skin: '#f6d3ad', eye: '#d9b8ff' },
  9: { suit: '#2a4222', dk: '#172812', band: '#d8323c', skin: '#f6d3ad' },
  11: { suit: '#664a2c', dk: '#3f2c18', band: '#d8323c', skin: '#f6d3ad' },
};
// 眨眼：每個敵人錯開時間
const aBlink = (t, seed) => ((t * .8 + seed * 1.7) % 3.6) < .13;

// 敵忍者也用主角的「大福」比例：大頭、小豆子身體、浮在旁邊的手套和鞋子（沒有手臂和腿）。
// 原點在身體中心、面向右（+x，再依 look 翻面）；寬高約 ±22 個單位，依 ENEMY[type].h 縮放。
function foeEye(c, x, y, rx, ry, P, warn, blink, glow) {
  if (blink) { c.beginPath(); c.moveTo(x - rx, y + ry * .2); c.quadraticCurveTo(x, y + ry * .5, x + rx, y + ry * .2); c.strokeStyle = INK; c.lineWidth = 1.5; c.stroke(); return; }
  aEll(c, x, y, rx, ry); c.fillStyle = '#fff'; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.1; c.stroke();
  c.save(); aEll(c, x, y, rx, ry); c.clip();
  aCirc(c, x + rx * .3, y + (warn ? -ry * .2 : ry * .15), rx * .62); c.fillStyle = glow || INK; c.fill();
  if (glow) { aCirc(c, x + rx * .3, y + ry * .15, rx * .3); c.fillStyle = INK; c.fill(); }
  aCirc(c, x - rx * .05, y - ry * .3, rx * .26); c.fillStyle = '#fff'; c.fill();
  c.restore();
}
// 敵忍者的移動方式（walk = 舊的擺腳）
// ride 乘坐物、levit 忍術懸浮、kite 抓風箏、rope 垂繩；FOE_TILT 依移動方向傾斜
let FOE_MOVE = 'ride', FOE_TILT = true;   // 遊戲採用方案 A＋E；其餘方式保留給 design/enemy-move.html 比較
const FOE_RIDE = { 0: 'cloud', 1: 'leaf', 2: 'gourd', 3: 'star', 5: 'rocket', 6: 'lotus', 9: 'leaf', 11: 'rock' };
function foeRideBack(c, kind, t, fl) {
  const W2 = fl ? '#fff' : null;
  if (kind === 'leaf') {
    c.save(); c.translate(0, 23.5); c.rotate(Math.sin(t * 3) * .08);
    c.beginPath(); c.moveTo(-22, 1); c.quadraticCurveTo(-4, -6, 20, -1); c.quadraticCurveTo(26, 0, 27, -3); c.quadraticCurveTo(24, 5, 16, 5); c.quadraticCurveTo(-4, 8, -22, 1); c.closePath(); aFI(c, W2 || '#5fae4a', 1.6);
    if (!fl) { c.beginPath(); c.moveTo(-20, 1); c.quadraticCurveTo(0, 0, 22, 0); c.strokeStyle = '#3e7d30'; c.lineWidth = 1; c.stroke(); }
    c.restore();
  } else if (kind === 'gourd') {
    aCirc(c, 0, 15, 8.5); aFI(c, W2 || '#e0a84a', 1.8);
    aCirc(c, 0, 31, 12); aFI(c, W2 || '#e0a84a', 1.8);
    if (!fl) { aEll(c, -5, 27, 3.5, 2.4, -.5); c.fillStyle = 'rgba(255,255,255,.35)'; c.fill(); c.fillStyle = '#b8323c'; c.fillRect(-7, 20.5, 14, 2.6); }
  } else if (kind === 'star') {
    c.save(); c.translate(0, 25); c.scale(1, .34); c.rotate(t * 6);
    c.beginPath(); for (let i = 0; i < 8; i++) { const r = i % 2 ? 7 : 24, a = i * Math.PI / 4; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.closePath();
    c.fillStyle = W2 || '#cfd6e2'; c.fill(); c.restore();
    c.save(); c.translate(0, 25); c.scale(1, .34); c.rotate(t * 6);
    c.beginPath(); for (let i = 0; i < 8; i++) { const r = i % 2 ? 7 : 24, a = i * Math.PI / 4; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.closePath(); c.restore(); aInk(c, 1.6);
    c.save(); c.translate(0, 25); c.scale(1, .34); aCirc(c, 0, 0, 4); c.restore(); c.fillStyle = INK; c.fill();
  } else if (kind === 'rocket') {
    if (!fl) for (let i = 0; i < 3; i++) { const fx = -24 - i * 5 - Math.sin(t * 30 + i) * 2; c.fillStyle = i ? '#ffd25a' : '#ff6a1a'; aEll(c, fx + 3, 24, 6 - i * 1.5, 3 - i * .6); c.fill(); }
    c.beginPath(); c.rect(-20, 19.5, 30, 9); aFI(c, W2 || '#d8323c', 1.6);
    c.beginPath(); c.moveTo(10, 19.5); c.lineTo(20, 24); c.lineTo(10, 28.5); c.closePath(); aFI(c, W2 || '#f2c14e', 1.5);
    if (!fl) { c.fillStyle = '#f4ead2'; c.fillRect(-12, 19.5, 4, 9); c.fillRect(0, 19.5, 4, 9); }
  } else if (kind === 'rock') {
    c.beginPath(); c.moveTo(-16, 21); c.lineTo(-10, 18.5); c.lineTo(12, 18.5); c.lineTo(17, 22); c.lineTo(9, 32); c.lineTo(-6, 33); c.closePath(); aFI(c, W2 || '#7a5a34', 1.6);
    if (!fl) { c.fillStyle = '#5a4026'; aCirc(c, -4, 25, 1.8); c.fill(); aCirc(c, 6, 28, 1.5); c.fill(); }
  }
}
function foeRideFront(c, kind, t, fl) {
  if (kind === 'cloud') {
    const pf = [[-12, 23, 6], [-4, 21, 7.5], [5, 21.5, 7.5], [12.5, 23.5, 6]];
    heroSilhouette(c, [{ path: c => { c.beginPath(); for (const [x, y, r] of pf) { c.moveTo(x + r, y + Math.sin(t * 3 + x) * .6); c.arc(x, y + Math.sin(t * 3 + x) * .6, r, 0, TAU); } }, fill: fl ? '#fff' : '#f2f4ef' }], 1.4);
    if (!fl) { c.fillStyle = '#d6dde0'; c.fillRect(-15, 26, 30, 2.5); }
  } else if (kind === 'lotus') {
    for (let i = -3; i <= 3; i++) {
      const x = i * 5.5, h = 10 - Math.abs(i) * 1.6 + Math.sin(t * 8 + i) * 1.5;
      c.beginPath(); c.moveTo(x - 4.5, 25); c.quadraticCurveTo(x - 3, 23 - h, x, 22 - h); c.quadraticCurveTo(x + 3, 23 - h, x + 4.5, 25); c.closePath();
      aFI(c, fl ? '#fff' : i % 2 ? '#9a5aff' : '#c49aff', 1.3);
    }
    aEll(c, 0, 26, 20, 3.5); aFI(c, fl ? '#fff' : '#55308a', 1.4);
  }
}
// 忍術懸浮：腳下的氣流（back = 後半圈）
function foeSwirl(c, t, back) {
  c.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    const a = t * 7 + i * 2.1, a0 = back ? Math.PI + a % .6 : a % .6;
    c.strokeStyle = `rgba(230,245,255,${.6 - i * .15})`; c.lineWidth = 2 - i * .4;
    c.beginPath(); c.ellipse(0, 24 + i * 2.5, 15 - i * 2, 4 - i * .6, 0, a0, a0 + 2.4); c.stroke();
  }
}
// 忍者風箏：頭頂上方，隨傾斜擺動；兩條線連到手上
function foeKite(c, t, fl, h1, h2, look = 1) {
  const sway = Math.sin(t * 2.2) * .18, kx = Math.sin(t * 2.2) * 4, ky = -50;
  for (const h of [h1, h2]) { c.beginPath(); c.moveTo(h[0], h[1]); c.lineTo(kx + (h[0] > 0 ? 9 : -9), ky + 14); c.strokeStyle = 'rgba(240,240,240,.8)'; c.lineWidth = .9; c.stroke(); }
  c.save(); c.translate(kx, ky); c.rotate(sway);
  c.beginPath(); c.moveTo(0, 14); c.quadraticCurveTo(-5, 22, 2, 28); c.quadraticCurveTo(7, 33, 3, 38); c.strokeStyle = fl ? '#fff' : '#d8323c'; c.lineWidth = 2; c.stroke();   // 尾巴
  c.beginPath(); if (c.roundRect) c.roundRect(-13, -15, 26, 30, 3); else c.rect(-13, -15, 26, 30); aFI(c, fl ? '#fff' : '#f4ead2', 1.8);
  if (!fl) {
    c.strokeStyle = '#d8323c'; c.lineWidth = 2; c.strokeRect(-10.5, -12.5, 21, 25);
    c.strokeStyle = 'rgba(122,82,48,.6)'; c.lineWidth = 1; c.beginPath(); c.moveTo(-12, -14); c.lineTo(12, 14); c.moveTo(12, -14); c.lineTo(-12, 14); c.stroke();
    c.save(); c.scale(look, 1); c.fillStyle = INK; c.font = '900 15px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('忍', 0, 1); c.restore();
  }
  c.restore();
}
function drawFoeNinja(type, t, e, look, near) {
  const c = ctx, ed = ENEMY[type], fl = e && e.flash > 0, P = fl ? WHITE_PAL : FOE[type];
  const u = ed.h / 44, fat = type === 2, warn = e && e.warn, atk = e && e.atk > 0;
  const seed = e ? e.bx || 0 : 0, bob = Math.sin(t * 5 + seed) * 1.4;
  const MV = type === 4 ? 'walk' : FOE_MOVE, ride = MV === 'ride' ? FOE_RIDE[type] : null;
  c.save();
  if (FOE_TILT && e && e.tilt) c.rotate(e.tilt * .32);   // 往移動方向傾斜
  c.scale(u * look, u); c.translate(0, bob);
  const sw = MV === 'walk' ? Math.sin(t * 4 + seed) * 1.6 : MV === 'kite' || MV === 'rope' ? Math.sin(t * 3 + seed) * .8 : 0, hb = Math.sin(t * 5 + seed + 1.5) * 1.3;
  const alarm = near && type !== 6 && type !== 4 && !warn;
  const HY = -5, R = 15, BT = fat ? 7 : 8.5, BB = fat ? 18 : 16.5;
  const wTop = fat ? 10 : 6.5, wMid = fat ? 14.5 : 8.5, wBot = fat ? 9.5 : 5;
  const GR = 3.9, FR = [4.4, 3];
  // --- 背後的東西 ---
  if (type === 6 && !fl) { // 菁英：紫色火焰光環
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * TAU + t * 1.5, r = 25 + Math.sin(t * 7 + i * 2) * 3;
      c.fillStyle = `rgba(170,110,255,${.18 + .08 * Math.sin(t * 9 + i)})`;
      c.beginPath(); c.moveTo(Math.cos(a - .3) * 14, Math.sin(a - .3) * 14); c.lineTo(Math.cos(a) * r, Math.sin(a) * r); c.lineTo(Math.cos(a + .3) * 14, Math.sin(a + .3) * 14); c.fill();
    }
  }
  if (type === 0 || type === 1 || type === 11) { // 背上的刀：刀柄從背後斜斜露出
    c.save(); c.translate(-17, 3); c.rotate(.5);
    c.beginPath(); c.rect(0, -2, 28, 4); aFI(c, P.dk, 1.4);
    c.beginPath(); c.rect(0, -2, 7, 4); aFI(c, fl ? '#fff' : '#3a2a40', 1.2);
    c.beginPath(); c.rect(7, -2.8, 2.4, 5.6); aFI(c, fl ? '#fff' : '#c9a14a', 1.1);
    c.restore();
  }
  if (type === 9) { // 箭筒
    c.save(); c.translate(-12, 9); c.rotate(-.55);
    c.beginPath(); c.rect(-3, -8, 6, 15); aFI(c, fl ? '#fff' : '#7a5230', 1.4);
    for (let i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(i * 1.6, -8); c.lineTo(i * 1.6, -13); c.strokeStyle = fl ? '#fff' : '#e8e0d0'; c.lineWidth = 1.3; c.stroke(); c.fillStyle = fl ? '#fff' : '#d8323c'; c.fillRect(i * 1.6 - 1, -14, 2, 2.5); }
    c.restore();
  }
  if (type === 5) { // 背上的大炸彈＋引信火花
    aCirc(c, -13, 10, 8.5); aFI(c, fl ? '#fff' : '#1c1c22', 1.8);
    if (!fl) { aCirc(c, -15.5, 7, 2.6); c.fillStyle = 'rgba(255,255,255,.35)'; c.fill(); }
    c.beginPath(); c.moveTo(-16, 2.5); c.quadraticCurveTo(-21, -2, -18, -6); c.strokeStyle = fl ? '#fff' : '#a07040'; c.lineWidth = 1.8; c.stroke();
    if (!fl) for (let i = 0; i < 5; i++) { const a = t * 20 + i * 1.26, r = 2 + (i % 2) * 2.4; c.fillStyle = i % 2 ? '#ffd25a' : '#ff6a1a'; c.fillRect(-18 + Math.cos(a) * r - 1, -6 + Math.sin(a) * r - 1, 2, 2); }
  }
  // --- 手腳的位置（依類型與狀態） ---
  let fa = alarm ? [15, 1] : [11.5, 12 + hb], ba = alarm ? [-15, 0] : [-11.5, 12 - hb];
  let ff = [4.5 + sw * .6, 20.5], bf = [-4.5 - sw * .6, 20.5];
  if (fat) { fa = alarm ? [18, 2] : [16, 12 + hb]; ba = alarm ? [-18, 1] : [-16, 12 - hb]; ff = [6 + sw * .6, 21.5]; bf = [-6 - sw * .6, 21.5]; }
  if (type === 6) { fa = [5, 12.5]; ba = [-3, 11.5]; }                                     // 雙手抱胸
  if (type === 4) { fa = [12, 19.5]; ba = [-12, 19.5]; ff = [4, 19]; bf = [-4, 19]; }        // 扶著腳下的盾
  if (type === 3) fa = warn ? [-15, -14] : atk ? [19, 4] : [12.5, 11 + hb];                 // 手裡劍：往後蓄力、往前丟
  if (type === 11) fa = warn ? [15, -12] : [12.5, 11 + hb];                                  // 土遁：舉起苦無
  let bowA = 0;
  if (type === 9) { bowA = e && g && g.p ? clamp(Math.atan2((g.p.y - 20) - e.y, Math.abs(g.p.x - e.x)), -1.1, 1.1) : 0; fa = [6 + Math.cos(bowA) * 9, 6 + Math.sin(bowA) * 9]; }
  // 依移動方式調整手腳
  const free = type === 0 || type === 1 || type === 2 || type === 5;   // 手上沒有武器
  if (MV !== 'walk') { ff = [fat ? 5.5 : 4, fat ? 21.5 : 20.5]; bf = [-ff[0], ff[1]]; }
  if (ride === 'gourd') { ff = [13, 22]; bf = [-11, 22.5]; }
  if (ride === 'lotus' || MV === 'levit') { ff = [3.5, 20]; bf = [-3.5, 20.5]; }                 // 盤腿
  if (MV === 'levit' && free) { fa = [3.5, 10.5]; ba = [-1.5, 10]; }                             // 雙手結印
  if (MV === 'kite') { ff = [3 + sw, 21.5]; bf = [-3 - sw, 22]; ba = [-9, -21]; if (free || type === 6) fa = [9, -21]; }
  if (MV === 'rope') { ff = [2.5 + sw, 21.5]; bf = [-1.5 - sw, 22.5]; ba = [-4, -21]; if (free || type === 6) fa = [-4, -27]; }
  // 身後的東西：繩子、風箏、乘坐物、氣流
  if (MV === 'rope') { c.beginPath(); c.moveTo(-4, -260); c.lineTo(-4, 10); c.strokeStyle = INK; c.lineWidth = 3.4; c.stroke(); c.strokeStyle = fl ? '#fff' : '#c9a46a'; c.lineWidth = 1.8; c.stroke(); }
  if (MV === 'kite') foeKite(c, t, fl, ba, fa, look);
  if (ride) foeRideBack(c, ride, t, fl);
  if (MV === 'levit') foeSwirl(c, t, true);
  // --- 身體、頭、手套、鞋子：先描黑邊再填色（不會有關節接縫） ---
  const fw = Math.sin(t * 9 + seed) * 2.5, belt = BT + (BB - BT) * .5;
  const parts = [];
  if (type !== 6 || MV === 'kite' || MV === 'rope') parts.push({ path: c => aCirc(c, ba[0], ba[1], GR * .95), fill: P.dk });
  parts.push({ path: c => aEll(c, bf[0], bf[1], FR[0], FR[1]), fill: P.dk });
  parts.push({ path: c => { c.beginPath(); c.moveTo(-wTop, BT); c.quadraticCurveTo(0, BT - 4, wTop, BT); c.quadraticCurveTo(wMid, BT + (BB - BT) * .63, wBot, BB - 1); c.quadraticCurveTo(0, BB + 2, -wBot, BB - 1); c.quadraticCurveTo(-wMid, BT + (BB - BT) * .63, -wTop, BT); c.closePath(); }, fill: P.suit,
    after: c => { c.save(); c.clip(); c.fillStyle = P.dk; c.fillRect(-wMid - 2, belt, wMid * 2 + 4, 2.8);
      if (type === 11 && !fl) { c.fillStyle = '#8a6a3e'; for (const [dx, dy] of [[-4, 11], [3, 15], [5, 10]]) { aCirc(c, dx, dy, 1.3); c.fill(); } }
      c.restore(); } });
  parts.push({ path: c => aEll(c, ff[0], ff[1], FR[0], FR[1]), fill: P.dk });
  parts.push({ path: c => { c.beginPath(); c.arc(0, HY, R, 0, TAU);
      c.moveTo(-11, HY - 10); c.quadraticCurveTo(-21, HY - 20, -7, HY - 17); c.closePath();                        // 兜帽尖
      c.moveTo(-13, HY - 7); c.quadraticCurveTo(-21, HY - 6 + fw, -25, HY - 1 + fw); c.quadraticCurveTo(-19, HY - 3, -13, HY - 2); c.closePath(); },  // 頭巾結
    fill: P.suit,
    after: c => { c.save(); c.beginPath(); c.arc(0, HY, R, 0, TAU); c.clip();
      if (!fl) { const gr = c.createRadialGradient(-5, HY - 9, 2, 0, HY, R * 1.15); gr.addColorStop(0, heroLighten(P.suit, .28)); gr.addColorStop(.6, P.suit); gr.addColorStop(1, P.dk); c.fillStyle = gr; c.fillRect(-R - 1, HY - R - 1, R * 2 + 2, R * 2 + 2); }
      c.fillStyle = P.band; c.fillRect(-R - 1, HY - 12, R * 2 + 2, 4.4); c.restore(); } });
  if (type !== 9) parts.push({ path: c => aCirc(c, fa[0], fa[1], GR), fill: P.dk });
  heroSilhouette(c, parts, 1.6);
  if (ride) foeRideFront(c, ride, t, fl);
  if (MV === 'levit') foeSwirl(c, t, false);
  // 頭巾結的顏色（蓋在頭巾結上）
  c.beginPath(); c.moveTo(-13, HY - 7); c.quadraticCurveTo(-21, HY - 6 + fw, -25, HY - 1 + fw); c.quadraticCurveTo(-19, HY - 3, -13, HY - 2); c.closePath(); c.fillStyle = P.band; c.fill();
  if (type === 1 && !fl) { aEll(c, 6, 9.5, 4.2, 2.8, -.3); aFI(c, P.guard, 1.3); }                            // 肩甲
  if (type === 6 && !fl) { c.beginPath(); c.moveTo(3, HY - 13); c.lineTo(5.5, HY - 9.8); c.lineTo(3, HY - 6.6); c.lineTo(.5, HY - 9.8); c.closePath(); aFI(c, '#fff6c8', 1); }   // 菁英頭巾徽章
  // 臉（面罩開口）與大眼睛：朝向玩家
  aEll(c, 4, HY + 3.5, 11, 6.8); c.fillStyle = P.skin; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.3; c.stroke();
  const blink = e && aBlink(t, seed), ey = HY + 3.5, glow = type === 6 && !fl ? P.eye : null;
  if (e && e.hurt) {   // 受擊（斬擊特寫）：眼睛變成 ＞＜
    c.strokeStyle = INK; c.lineWidth = 1.8; c.lineCap = 'round';
    for (const [ex, sd] of [[-.5, 1], [8.5, -1]]) { c.beginPath(); c.moveTo(ex - sd * 2.6, ey - 3); c.lineTo(ex + sd * 2.2, ey); c.lineTo(ex - sd * 2.6, ey + 3); c.stroke(); }
  } else { foeEye(c, -.5, ey, 3, 3.9, P, warn, blink, glow); foeEye(c, 8.5, ey, 3.2, 4.1, P, warn, blink, glow); }
  // 眉毛：生氣的斜線（內側壓低）；警戒時更斜
  const ang = warn || alarm ? 1.4 : .6;
  c.strokeStyle = INK; c.lineWidth = 1.7; c.lineCap = 'round';
  c.beginPath(); c.moveTo(-3.6, ey - 5.6); c.lineTo(2.4, ey - 4.6 + ang); c.moveTo(5.4, ey - 4.6 + ang); c.lineTo(11.8, ey - 5.8); c.stroke();
  if (type === 5 && near && !fl) { aEll(c, 14, HY - 3, 1.5, 2.3); c.fillStyle = '#9ad8ff'; c.fill(); }      // 炸彈忍者：冒冷汗
  if (glow) { c.fillStyle = 'rgba(217,184,255,.45)'; aCirc(c, -.5, ey, 5); c.fill(); aCirc(c, 8.5, ey, 5); c.fill(); }   // 菁英：眼睛發光
  // --- 手上的武器 ---
  if (type === 3 && !atk) drawStar4(c, fa[0], fa[1] - 4, 5, t * (warn ? 25 : 8), fl ? '#fff' : '#cfd6e2');
  if (type === 11) drawKunai(c, fa[0], fa[1] - 4, -Math.PI / 2, 1, fl);
  if (type === 9) { // 弓忍：弓朝玩家方向，蓄力時拉弓
    c.save(); c.translate(6, 6); c.rotate(bowA);
    const pull = warn ? 7 : atk ? 0 : 2;
    c.beginPath(); c.arc(9, 0, 11, -1.25, 1.25); c.strokeStyle = INK; c.lineWidth = 4; c.stroke(); c.strokeStyle = fl ? '#fff' : '#a8743c'; c.lineWidth = 2.4; c.stroke();
    c.beginPath(); c.moveTo(9 + Math.cos(-1.25) * 11, Math.sin(-1.25) * 11); c.lineTo(9 - pull, 0); c.lineTo(9 + Math.cos(1.25) * 11, Math.sin(1.25) * 11); c.strokeStyle = fl ? '#fff' : '#efe6d2'; c.lineWidth = 1; c.stroke();
    if (warn) { c.beginPath(); c.moveTo(9 - pull, 0); c.lineTo(24, 0); c.strokeStyle = '#7a5230'; c.lineWidth = 1.6; c.stroke(); c.fillStyle = '#ff5a5a'; c.beginPath(); c.moveTo(27, 0); c.lineTo(23, -2.5); c.lineTo(23, 2.5); c.fill(); }
    aCirc(c, 9, 0, GR); aFI(c, P.dk, 1.6);   // 握弓的手套
    c.restore();
  }
  if (type === 4) { // 盾牌（腳下）：玩家在下方時閃光
    const below = e && g && g.p && g.p.y - 20 > e.y && Math.abs(g.p.x - e.x) < 40;
    aEll(c, 0, 24, 19, 5.5); aFI(c, fl ? '#fff' : '#9aa4b0', 2);
    if (!fl) {
      aEll(c, 0, 23, 14, 3.4); c.strokeStyle = '#d8dee6'; c.lineWidth = 1.2; c.stroke();
      c.fillStyle = '#5a626e'; for (let i = -2; i <= 2; i++) { aCirc(c, i * 6.5, 24 + Math.abs(i) * -.4, 1); c.fill(); }
      if (below) { aEll(c, 0, 24, 21, 7); c.strokeStyle = `rgba(255,255,255,${.5 + .4 * Math.sin(t * 20)})`; c.lineWidth = 2; c.stroke(); }
    }
    for (const h of [fa, ba]) { aCirc(c, h[0], h[1], GR * .9); aFI(c, P.dk, 1.6); }   // 手套壓在盾上
  }
  c.restore();
}
function drawStar4(c, x, y, r, rot, col) {
  c.save(); c.translate(x, y); c.rotate(rot);
  c.beginPath(); for (let i = 0; i < 8; i++) { const rr2 = i % 2 ? r * .35 : r, a = i * Math.PI / 4; c.lineTo(Math.cos(a) * rr2, Math.sin(a) * rr2); } c.closePath();
  aFI(c, col, 1.2); aCirc(c, 0, 0, r * .18); c.fillStyle = INK; c.fill();
  c.restore();
}
function drawKunai(c, x, y, a, s = 1, fl) {
  c.save(); c.translate(x, y); c.rotate(a); c.scale(s, s);
  c.beginPath(); c.moveTo(9, 0); c.lineTo(1, -2.6); c.lineTo(1, 2.6); c.closePath(); aFI(c, fl ? '#fff' : '#cfd6e2', 1.2);
  c.beginPath(); c.rect(-5, -1.2, 6, 2.4); aFI(c, fl ? '#fff' : '#6a3a1e', 1);
  aCirc(c, -7, 0, 1.8); aInk(c, 1.2);
  c.restore();
}

// ===== 妖怪類敵人 =====
function drawCrow(t, e, fl) {
  const c = ctx, w = Math.sin(t * 16), dir = e && e.vx < 0 ? -1 : 1;
  c.save(); c.scale(dir, 1);
  const body = fl ? '#fff' : '#1f2233', wing = fl ? '#fff' : '#2c3048';
  // 後翅
  c.beginPath(); c.moveTo(-2, -2); c.quadraticCurveTo(-8, -12 - w * 8, -16, -10 - w * 10); c.lineTo(-10, -4 - w * 4); c.lineTo(-13, -2 - w * 5); c.lineTo(-4, 1); c.closePath(); aFI(c, wing, 1.4);
  // 尾巴
  c.beginPath(); c.moveTo(-8, 1); c.lineTo(-17, 4); c.lineTo(-15, 0); c.lineTo(-17, -2); c.lineTo(-8, -2); c.closePath(); aFI(c, body, 1.4);
  // 大福比例：小身體＋大圓頭（先描邊再填色）
  heroSilhouette(c, [
    { path: c => aEll(c, -4, 2, 7.5, 5), fill: body },
    { path: c => aCirc(c, 5, -2.5, 8.5), fill: body,
      after: c => { if (fl) return; c.save(); aCirc(c, 5, -2.5, 8.5); c.clip(); c.fillStyle = '#d8323c'; c.fillRect(-4, -8.5, 18, 2.4); c.restore(); } },
  ], 1.4);
  c.beginPath(); c.moveTo(12, -2.5); c.lineTo(18, 0); c.lineTo(12, 2); c.closePath(); aFI(c, fl ? '#fff' : '#f2c14e', 1.2);
  foeEye(c, 8.5, -3, 2.6, 3, null, false, (e && e.hurt) || aBlink(t, e ? e.bx || 0 : 0), fl ? null : '#ff3a3a');
  c.beginPath(); c.moveTo(5.8, -7.4); c.lineTo(11, -6); c.strokeStyle = INK; c.lineWidth = 1.5; c.stroke();
  // 前翅（羽毛尖）
  c.beginPath(); c.moveTo(2, -1); c.quadraticCurveTo(-2, -14 - w * 9, -9, -16 - w * 11); c.lineTo(-5, -9 - w * 6); c.lineTo(-9, -8 - w * 7); c.lineTo(-3, -4 - w * 3); c.lineTo(-6, -3 - w * 3); c.lineTo(0, 2); c.closePath(); aFI(c, wing, 1.4);
  c.restore();
}
function drawTengu(t, e, fl, big) {
  const c = ctx, w = Math.sin(t * (big ? 6 : 13)), red = fl ? '#fff' : '#d8463a', blk = fl ? '#fff' : '#1c1d28';
  const vx = e ? e.vx || 0 : 0, tilt = big ? 0 : clamp(vx / 300, -.35, .35), look = e && g && g.p ? Math.sign(g.p.x - e.x) || 1 : 1;
  c.save(); c.rotate(tilt);
  // 翅膀（左右）
  for (const s of [-1, 1]) {
    c.save(); c.scale(s, 1);
    c.beginPath(); c.moveTo(6, 0); c.quadraticCurveTo(18, -14 - w * 10, 32, -16 - w * 12);
    for (let i = 0; i < 4; i++) c.lineTo(30 - i * 5, -8 - w * (9 - i * 2) + (i % 2) * 3);
    c.lineTo(8, 6); c.closePath(); aFI(c, blk, 1.6);
    if (!fl) { c.strokeStyle = '#3a3c50'; c.lineWidth = 1; c.beginPath(); c.moveTo(10, 1); c.lineTo(26, -12 - w * 10); c.stroke(); }
    c.restore();
  }
  // 大福比例：小身體（山伏服）＋浮空的手和木屐，大頭
  const dk = fl ? '#fff' : '#a8302a', hb = Math.sin(t * 6) * 1.2;
  const parts = [
    { path: c => aEll(c, -4.5, 19.5, 3.8, 2.6), fill: dk },
    { path: c => aEll(c, 4.5, 19.5, 3.8, 2.6), fill: dk },
    { path: c => aEll(c, 0, 13, 7.5, 5.6), fill: fl ? '#fff' : '#f0ead8' },
    { path: c => { c.beginPath(); c.arc(0, -2, 14.5, 0, TAU); c.moveTo(-5.5, -15); c.lineTo(0, -22); c.lineTo(5.5, -15); c.closePath(); }, fill: red,
      after: c => { if (fl) return; c.save(); c.beginPath(); c.arc(0, -2, 14.5, 0, TAU); c.clip(); const gr = c.createRadialGradient(-5, -8, 2, 0, -2, 17); gr.addColorStop(0, '#f27a6a'); gr.addColorStop(.6, red); gr.addColorStop(1, '#a8302a'); c.fillStyle = gr; c.fill(); c.restore(); } },
  ];
  if (!big) parts.push({ path: c => aCirc(c, -11, 12 - hb, 3.2), fill: red }, { path: c => aCirc(c, 11, 12 + hb, 3.2), fill: red });
  heroSilhouette(c, parts, 1.5);
  c.beginPath(); c.moveTo(-5.5, -15); c.lineTo(0, -22); c.lineTo(5.5, -15); c.closePath(); aFI(c, blk, 1.3);   // 頭巾（兜巾）
  if (!fl) { aCirc(c, -3, 11, 1.8); c.fillStyle = '#e8463a'; c.fill(); aCirc(c, 3, 11, 1.8); c.fill(); }      // 梵天（毛球）
  // 白眉
  c.save(); c.scale(look, 1);
  c.fillStyle = '#ffffff';
  c.beginPath(); c.moveTo(-9, -8); c.quadraticCurveTo(-4.5, -12, 0, -7); c.lineTo(-1, -5); c.quadraticCurveTo(-4.5, -9, -9, -6); c.fill();
  c.beginPath(); c.moveTo(1.5, -7); c.quadraticCurveTo(6, -12, 10.5, -8); c.lineTo(10.5, -6); c.quadraticCurveTo(6, -9, 2.5, -5); c.fill();
  // 大眼睛
  const bl = (e && e.hurt) || aBlink(t, e ? e.x || 0 : 0);
  foeEye(c, -4, -1.5, 3, 3.6, null, e && e.warn, bl); foeEye(c, 5.5, -1.5, 3, 3.6, null, e && e.warn, bl);
  // 長鼻子
  c.beginPath(); c.moveTo(-1, 2); c.quadraticCurveTo(6, 4.5, 14, 3); c.quadraticCurveTo(8, 7.5, -.5, 6.5); c.closePath(); aFI(c, fl ? '#fff' : '#e8584a', 1.3);
  if (big && !fl) { // 大天狗：白鬍子
    c.beginPath(); c.moveTo(-9, 6); c.quadraticCurveTo(-7, 17, 0, 21); c.quadraticCurveTo(7, 17, 9, 6); c.quadraticCurveTo(0, 11, -9, 6); aFI(c, '#ffffff', 1.3);
  }
  c.restore();
  if (big) { // 羽扇：蓄力時舉起（浮空的手握著）
    const up = e && e.warn ? -1 : 0, ang = up ? -1.2 + Math.sin(t * 18) * .15 : .3 + Math.sin(t * 2) * .1;
    aCirc(c, -look * 12, 12 - hb, 3.2); aFI(c, red, 1.5);
    c.save(); c.translate(look * 12, 11); c.rotate(look * ang);
    c.beginPath(); c.rect(-1.2, 0, 2.4, 8); aFI(c, fl ? '#fff' : '#7a5230', 1);
    c.beginPath(); c.moveTo(0, 0); for (let i = 0; i <= 6; i++) { const a = -Math.PI / 2 - .9 + i * .3; c.lineTo(Math.cos(a) * 14, Math.sin(a) * 14); } c.closePath(); aFI(c, fl ? '#fff' : '#e9f2e0', 1.2);
    if (!fl) { c.strokeStyle = '#9ab08a'; c.lineWidth = .8; for (let i = 0; i <= 6; i++) { const a = -Math.PI / 2 - .9 + i * .3; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a) * 13, Math.sin(a) * 13); c.stroke(); } }
    aCirc(c, 0, 3, 3.2); aFI(c, red, 1.5);   // 握扇的手
    c.restore();
  }
  c.restore();
}
function drawOnibi(t, e, fl) {
  const c = ctx, f = Math.sin(t * 10) * 3, vx = e ? e.vx || 0 : 0, vy = e ? e.vy || 0 : 0;
  // 拖尾的小火球
  if (!fl) for (let i = 1; i <= 3; i++) { c.fillStyle = `rgba(176,122,255,${.35 - i * .09})`; aCirc(c, -vx * .03 * i, -vy * .03 * i + 6, 6 - i * 1.4); c.fill(); }
  const gl = c.createRadialGradient(0, 2, 2, 0, 2, 22); gl.addColorStop(0, fl ? 'rgba(255,255,255,.6)' : 'rgba(190,140,255,.55)'); gl.addColorStop(1, 'rgba(150,90,255,0)');
  c.fillStyle = gl; aCirc(c, 0, 2, 22); c.fill();
  // 外焰
  c.beginPath(); c.moveTo(-11, 5); c.quadraticCurveTo(-12, -6, -4 + f * .5, -12); c.quadraticCurveTo(-3, -6, f, -21); c.quadraticCurveTo(5, -9, 6 - f * .4, -13); c.quadraticCurveTo(12, -4, 11, 5); c.arc(0, 5, 11, 0, Math.PI); c.closePath();
  aFI(c, fl ? '#fff' : '#9a5aff', 1.8);
  // 內焰
  c.beginPath(); c.moveTo(-6, 6); c.quadraticCurveTo(-6, -3, f * .6, -10); c.quadraticCurveTo(6, -3, 6, 6); c.arc(0, 6, 6, 0, Math.PI); c.closePath();
  c.fillStyle = fl ? '#fff' : '#d4b8ff'; c.fill();
  // 臉
  const bl = (e && e.hurt) || aBlink(t, e ? e.bx || 0 : 0);
  foeEye(c, -3.2, 3.5, 2.6, 3.3, null, false, bl); foeEye(c, 3.6, 3.5, 2.6, 3.3, null, false, bl);
  if (!fl) { c.fillStyle = 'rgba(255,120,200,.4)'; aEll(c, -6.5, 7.5, 2, 1.1); c.fill(); aEll(c, 7, 7.5, 2, 1.1); c.fill(); }
  c.beginPath(); c.arc(.2, 8, 1.6, .2, Math.PI - .2); c.strokeStyle = INK; c.lineWidth = 1; c.stroke();
}
function drawSpider(t, e, fl) {
  const c = ctx, warn = e && e.warn, body = fl ? '#fff' : '#3a2a48';
  // 垂絲
  c.strokeStyle = 'rgba(235,235,245,.75)'; c.lineWidth = 1; c.beginPath(); c.moveTo(0, -12); c.lineTo(0, -160); c.stroke();
  // 腳：四對，走路般輪流擺動
  for (const sd of [-1, 1]) for (let i = 0; i < 4; i++) {
    const ph = Math.sin(t * 9 + i * 1.3 + (sd > 0 ? 1.5 : 0)) * 2.5, ky = -6 + i * 4.5;
    aLimb(c, [sd * 5, ky * .5, sd * (14 + i), ky - 6 + ph, sd * (19 + i * .5), ky + 6 + ph * .6], 1.6, fl ? '#fff' : '#2a1e36');
  }
  // 腹部（蓄力時鼓起）＋紅色花紋
  const sw = warn ? 1 + Math.sin(t * 25) * .08 + .08 : 1;
  // 大福比例：小小的腹部在下、大頭在上（同樣先描邊再填色）
  heroSilhouette(c, [
    { path: c => aEll(c, 0, 9, 7.5 * sw, 7 * sw), fill: body,
      after: c => { if (fl) return; c.fillStyle = '#e8463a'; c.beginPath(); c.moveTo(0, 6); c.lineTo(2.6, 10); c.lineTo(0, 14); c.lineTo(-2.6, 10); c.closePath(); c.fill(); } },
    { path: c => aCirc(c, 0, -4, 10.5), fill: body,
      after: c => { if (fl) return; c.save(); aCirc(c, 0, -4, 10.5); c.clip(); const gr = c.createRadialGradient(-4, -9, 1, 0, -4, 12); gr.addColorStop(0, '#6a5480'); gr.addColorStop(1, body); c.fillStyle = gr; c.fill(); c.restore(); } },
  ], 1.5);
  const bl = (e && e.hurt) || aBlink(t, e ? e.bx || 0 : 0);
  foeEye(c, -3.6, -4, 2.8, 3.4, null, warn, bl, fl ? null : '#ff3a4a'); foeEye(c, 3.6, -4, 2.8, 3.4, null, warn, bl, fl ? null : '#ff3a4a');
  if (!fl) { c.fillStyle = '#ff4a4a'; aCirc(c, -7.6, -8, 1.1); c.fill(); aCirc(c, 7.6, -8, 1.1); c.fill(); }   // 小眼睛
  c.beginPath(); c.moveTo(-2, 2.5); c.lineTo(-1, 4.6); c.moveTo(2, 2.5); c.lineTo(1, 4.6); c.strokeStyle = fl ? '#fff' : '#e8e0d0'; c.lineWidth = 1.3; c.stroke();   // 小獠牙
}
// 土遁忍者藏在地板裡：土堆＋偷看的眼睛（玩家靠近時土堆抖動）
function drawMound(x, y, t, e) {
  const c = ctx, near = g && g.p && Math.abs(g.p.x - x) < 70 && Math.abs(g.p.y - y) < 120;
  const sh = near ? Math.sin(t * 40) * 1.2 : 0;
  c.save(); c.translate(x + sh, y + 14);
  c.beginPath(); c.moveTo(-22, 0); c.quadraticCurveTo(-14, -14, 0, -13); c.quadraticCurveTo(14, -14, 22, 0); c.closePath(); aFI(c, '#7a5a34', 1.8);
  c.fillStyle = '#5a4026'; for (const [px, py] of [[-10, -4], [6, -7], [13, -3], [-3, -9]]) { aCirc(c, px, py, 1.8); c.fill(); }
  if (!aBlink(t, x)) { c.fillStyle = '#ffd25a'; aEll(c, -4, -7, 2, 1.4); c.fill(); aEll(c, 4, -7, 2, 1.4); c.fill(); c.fillStyle = INK; aCirc(c, -3.5, -7, .8); c.fill(); aCirc(c, 4.5, -7, .8); c.fill(); }
  c.restore();
}

// ===== 敵人總入口（game.js 呼叫） =====
function drawEnemy(x, y, type, s = 1, t = 0, e = null) {
  if (type === 13 && s === 1) s = .78;   // 中魔王山伏天狗（設計稿約 110 單位高，縮到和判定框差不多大）
  if (e && e.hidden) return drawMound(x, y, t, e);
  const ed = ENEMY[type], fl = e && e.flash > 0;
  const look = e && e.look ? e.look : e && g && g.p ? (Math.sign(g.p.x - x) || 1) : 1;
  const near = e && g && g.p ? Math.hypot(g.p.x - x, g.p.y - 20 - y) < 110 : false;
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  if (FOE[type]) {
    if (FOE_TILT && !fl && Math.abs(e && e.sv || 0) > 90) for (let k = 3; k >= 1; k--) { ctx.save(); ctx.globalAlpha *= .12 * (4 - k); ctx.translate(-e.sv * .035 * k / s, 0); drawFoeNinja(type, t, e, look, near); ctx.restore(); }   // 快速移動的殘影
    drawFoeNinja(type, t, e, look, near);
  }
  else if (type === 7) drawCrow(t, e, fl);
  else if (type === 8) drawLeafTengu(t, e, fl);   // 小天狗＝木葉天狗「葉丸子」
  else if (type === 13) drawYamaTengu(t, e, look);   // 中魔王：山伏天狗
  else if (type === 10) drawOnibi(t, e, fl);
  else if (type === 12) drawSpider(t, e, fl);
  // 警告「!」與菁英標記
  if (e && e.warn && type !== 13) { const bo = Math.abs(Math.sin(t * 14)) * 3; txt('!', 0, -ed.h / 2 - 12 - bo, 20, '#ff3a3a', 'center', '#fff', 3); }
  if (e && e.affix) txt({ fast: '迅', split: '分', tough: '鐵' }[e.affix], ed.w * .5, -ed.h * .35, 10, '#ffd27a', 'center', '#000', 3);
  if (e && type === 6) for (let i = 0; i < e.hp; i++) txt('◆', -5 + i * 10, -ed.h / 2 - 6, 9, '#e0b0ff', 'center', '#000', 2);
  ctx.restore();
}

// 斬成兩半：沿斬擊方向切開，兩半往外飛、往下掉並淡出
function drawCorpse(o) {
  const k = o.t / .7, a = o.a, nx = -Math.sin(a), ny = Math.cos(a), d = 6 + o.t * 70, fall = o.t * o.t * 500;
  for (const sd of [-1, 1]) {
    ctx.save();
    ctx.globalAlpha = clamp(1.3 - k * 1.3, 0, 1);
    ctx.translate(o.x + nx * d * sd, o.y + ny * d * sd + fall);
    ctx.rotate(sd * o.t * 2.2);
    // 用旋轉後的半平面裁切
    ctx.save(); ctx.rotate(a); ctx.beginPath(); ctx.rect(-80, sd > 0 ? 0 : -80, 160, 80); ctx.restore(); ctx.clip();
    drawEnemy(0, 0, o.type, 1, o.ph, { look: o.look, flash: o.t < .06 ? 1 : 0, vx: o.vx });
    ctx.restore();
  }
  if (o.t < .14) { // 切口的白光
    ctx.save(); ctx.translate(o.x, o.y); ctx.rotate(a); ctx.globalAlpha = 1 - o.t / .14;
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(-34, 0); ctx.lineTo(0, -2.5); ctx.lineTo(34, 0); ctx.lineTo(0, 2.5); ctx.fill(); ctx.restore();
  }
}
// 敵人消失的煙（忍者「咚」一聲）
function drawPuff(o) {
  const k = o.t / .5, r = o.r * (.5 + k * .9);
  ctx.save(); ctx.globalAlpha = (1 - k) * .85;
  for (let i = 0; i < 6; i++) {
    const a = i / 6 * TAU + o.x * .1, dx = Math.cos(a) * r * .7, dy = Math.sin(a) * r * .5 - k * 10;
    ctx.fillStyle = i % 2 ? '#e8ecef' : '#c7cdd3'; aCirc(ctx, o.x + dx, o.y + dy, r * (.42 + (i % 3) * .08)); ctx.fill();
  }
  ctx.restore();
}

// ===== 魔王 =====
const BOSS_ART = [
  { body: '#d8382e', dk: '#8e1c16', horn: '#f5e6b8', eye: '#ffe24a' },   // 真妖鬼
  { body: '#8a4fd0', dk: '#55298f', horn: '#f0e0ff', eye: '#ffe24a' },   // 怠惰鬼
  { body: '#5ab8e8', dk: '#2a7cb0', horn: '#dff6ff', eye: '#ffffff' },   // 雪女鬼
  { body: '#6a6e7a', dk: '#3a3d46', horn: '#c8ccd4', eye: '#ff6a3a' },   // 鐵甲鬼
];
function drawBoss(b, x, y, s, cc) {   // cc：要畫到哪個畫布（預設主畫布；開場剪影用暫存畫布）
  if (BOSS_STYLE === 'new') return drawBoss2(b, x, y, s, cc || ctx);
  const c = ctx, k = b.kind, P = BOSS_ART[k], t = b.t || performance.now() / 1000, br = 1 + Math.sin(t * 3) * .03;
  const warn = b.warn > 0, slam = k === 0 && b.skillT < .45;
  c.save(); c.translate(x, y); c.scale(s, s);
  // 背後的氣場
  const au = c.createRadialGradient(0, 0, 20, 0, 0, 52); au.addColorStop(0, P.body + '55'); au.addColorStop(1, P.body + '00');
  c.fillStyle = au; aCirc(c, 0, 0, 52); c.fill();
  if (k === 1) { // 怠惰鬼：坐在紫色雲上
    c.fillStyle = '#b89ae8'; for (const [dx, r] of [[-22, 11], [-8, 13], [8, 13], [22, 11]]) { aCirc(c, dx, 28, r); c.fill(); }
    c.beginPath(); for (const [dx, r] of [[-22, 11], [-8, 13], [8, 13], [22, 11]]) { c.moveTo(dx + r, 28); c.arc(dx, 28, r, 0, TAU); } aInk(c, 1.6);
  }
  if (k === 0) { // 真妖鬼：狼牙棒（踩破站台前高舉、砸下）
    const ang = slam ? .1 + (1 - b.skillT / .45) * 2.3 : .45 + Math.sin(t * 2) * .12;   // 平常扛在右上方，技能時往下砸
    c.save(); c.translate(36, 8); c.rotate(ang);
    c.beginPath(); c.moveTo(-2.5, -10); c.lineTo(-5, -38); c.lineTo(5, -38); c.lineTo(2.5, -10); c.closePath(); aFI(c, '#4a3a30', 1.8);
    c.fillStyle = '#d8dee6'; for (let i = 0; i < 4; i++) { const yy = -16 - i * 6; c.beginPath(); c.moveTo(-5, yy); c.lineTo(-8, yy - 2); c.lineTo(-4.4, yy - 3); c.fill(); c.beginPath(); c.moveTo(5, yy); c.lineTo(8, yy - 2); c.lineTo(4.4, yy - 3); c.fill(); }
    aCirc(c, 0, -2, 8.5); aFI(c, P.dk, 2);   // 握棒的拳頭
    c.restore();
  }
  // 角
  for (const sd of [-1, 1]) {
    c.beginPath(); c.moveTo(sd * 12, -22); c.quadraticCurveTo(sd * 26, -34, sd * 24, -50); c.quadraticCurveTo(sd * 18, -36, sd * 4, -27); c.closePath();
    aFI(c, P.horn, 1.8);
    if (k === 2) { c.fillStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.moveTo(sd * 18, -34); c.lineTo(sd * 22, -44); c.lineTo(sd * 20, -33); c.fill(); }
  }
  if (k === 0) { c.fillStyle = '#2a1410'; for (let i = -3; i <= 3; i++) { c.beginPath(); c.moveTo(i * 7 - 4, -24); c.lineTo(i * 8, -36 - Math.abs(Math.sin(i)) * 6); c.lineTo(i * 7 + 4, -24); c.fill(); } }   // 亂髮
  if (k === 2) { c.fillStyle = '#f4fbff'; c.beginPath(); c.moveTo(-28, -10); c.quadraticCurveTo(-34, 14, -24, 30); c.lineTo(-18, 6); c.lineTo(18, 6); c.lineTo(24, 30); c.quadraticCurveTo(34, 14, 28, -10); c.closePath(); c.fill(); aInk(c, 1.4); }   // 雪白長髮
  // 浮空的拳頭與腳（和主角一樣沒有手臂和腿）：身體後面先畫
  const fb = Math.sin(t * 3.2) * 2.5, fist = (x2, y2) => { aCirc(c, x2, y2, 8.5); aFI(c, P.dk, 2); c.beginPath(); c.moveTo(x2 - 4, y2 - 3); c.lineTo(x2 + 1, y2 - 3.5); c.strokeStyle = 'rgba(255,255,255,.25)'; c.lineWidth = 1.6; c.stroke(); };
  if (k !== 1) for (const sd of [-1, 1]) { aEll(c, sd * 13, 35, 10, 6); aFI(c, P.dk, 2); }
  fist(-36, 10 + fb);
  if (k !== 0) fist(36, 10 - fb);
  // 身體
  c.save(); c.scale(br, 2 - br);
  const bg = c.createRadialGradient(-9, -10, 4, 0, 0, 32); bg.addColorStop(0, P.body); bg.addColorStop(1, P.dk);
  aCirc(c, 0, 0, 30); c.fillStyle = bg; c.fill(); aInk(c, 2.2);
  c.restore();
  if (k === 3) { // 鐵甲鬼：頭盔與護甲片、鉚釘
    c.beginPath(); c.arc(0, -4, 30, Math.PI * 1.08, Math.PI * 1.92); c.lineTo(22, -12); c.quadraticCurveTo(0, -20, -22, -12); c.closePath(); aFI(c, '#8a8e9a', 1.8);
    c.fillStyle = '#c8ccd4'; for (let i = -2; i <= 2; i++) { aCirc(c, i * 9, -16 + Math.abs(i) * 2, 1.6); c.fill(); }
    c.beginPath(); c.rect(-20, 14, 40, 10); aFI(c, '#8a8e9a', 1.6);
    c.strokeStyle = '#5a5e6a'; c.lineWidth = 1; for (let i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(i * 10, 14); c.lineTo(i * 10, 24); c.stroke(); }
  }
  // 虎皮腰帶
  if (k !== 3) {
    c.save(); aCirc(c, 0, 0, 30); c.clip();
    c.fillStyle = '#f2c14e'; c.fillRect(-32, 20, 64, 12); c.fillStyle = INK; for (let i = -4; i <= 4; i++) { c.beginPath(); c.moveTo(i * 8 - 2, 20); c.lineTo(i * 8 + 2, 26); c.lineTo(i * 8, 20); c.fill(); }
    c.restore();
  }
  // 眉毛
  c.fillStyle = INK;
  for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(sd * 22, -12 + (k === 1 && !warn ? 4 : 0)); c.lineTo(sd * 5, -6); c.lineTo(sd * 6, -3); c.lineTo(sd * 22, -8 + (k === 1 && !warn ? 4 : 0)); c.closePath(); c.fill(); }
  // 眼睛（發光）；怠惰鬼平常半閉
  const lid = k === 1 && !warn;
  for (const sd of [-1, 1]) {
    c.fillStyle = P.eye; c.beginPath();
    if (lid) { c.moveTo(sd * 18, 0); c.quadraticCurveTo(sd * 12, 3, sd * 6, 0); c.lineTo(sd * 18, 0); }
    else { c.moveTo(sd * 19, -3); c.lineTo(sd * 6, 0); c.lineTo(sd * 17, 5); c.closePath(); }
    c.fill(); aInk(c, 1.4);
    if (!lid) { c.fillStyle = INK; aCirc(c, sd * 12, 1, 1.8); c.fill(); }
    if (warn || k === 3) { c.fillStyle = P.eye + '55'; aCirc(c, sd * 12, 1, 7); c.fill(); }
  }
  // 嘴巴
  if (k === 1 && !warn) { aEll(c, 0, 14, 7, 5 + Math.sin(t * 1.5) * 2); aFI(c, '#4a0f18', 1.6); }   // 打哈欠
  else {
    c.beginPath(); c.moveTo(-15, 10); c.quadraticCurveTo(0, 22, 15, 10); c.quadraticCurveTo(0, 14, -15, 10); aFI(c, '#3a0a0e', 1.6);
    c.fillStyle = '#fff'; for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(sd * 12, 11); c.lineTo(sd * 9, 18); c.lineTo(sd * 7, 12); c.fill(); }
  }
  // 各魔王的特效
  if (k === 1) {
    if (!warn) for (let i = 0; i < 3; i++) { const zt = (t * .6 + i / 3) % 1; c.globalAlpha = 1 - zt; txt('Z', 26 + zt * 14, -20 - zt * 26, 9 + i * 3, '#e9dcff', 'center', INK, 2); c.globalAlpha = 1; }
    else { c.strokeStyle = 'rgba(197,138,255,.8)'; c.lineWidth = 3; for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(0, 0, 38 + i * 6 + (t * 30) % 6, t * 3 + i, t * 3 + i + 2.5); c.stroke(); } }
  }
  if (k === 2) { // 雪女鬼：繞身的雪花，蓄力時冰光
    for (let i = 0; i < 6; i++) { const a = t * .9 + i / 6 * TAU, r = 40 + Math.sin(t * 2 + i) * 4; drawFlake(c, Math.cos(a) * r, Math.sin(a) * r * .7, 3.5); }
    if (warn) { c.strokeStyle = `rgba(200,240,255,${.6 + .3 * Math.sin(t * 20)})`; c.lineWidth = 3; aCirc(c, 0, 0, 40); c.stroke(); }
    c.fillStyle = 'rgba(230,248,255,.5)'; for (let i = 0; i < 3; i++) { aCirc(c, Math.sin(t * 3 + i) * 3, 20 + i * 4 + (t * 20 % 4), 2 + i); c.fill(); }   // 寒氣
  }
  if (b.shield) { // 護盾：六角形紋路的泡泡
    c.strokeStyle = 'rgba(200,225,255,.95)'; c.lineWidth = 3; aCirc(c, 0, 0, 42); c.stroke();
    c.fillStyle = 'rgba(200,225,255,.16)'; c.fill();
    c.save(); aCirc(c, 0, 0, 42); c.clip(); c.strokeStyle = 'rgba(220,235,255,.35)'; c.lineWidth = 1;
    for (let r2 = -3; r2 <= 3; r2++) for (let q = -3; q <= 3; q++) { const hx = q * 15 + (r2 % 2) * 7.5, hy = r2 * 13; c.beginPath(); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; c.lineTo(hx + Math.cos(a) * 8, hy + Math.sin(a) * 8); } c.closePath(); c.stroke(); }
    c.restore();
  }
  c.restore();
}
function drawFlake(c, x, y, r) {
  c.save(); c.translate(x, y); c.strokeStyle = '#ffffff'; c.lineWidth = 1.2;
  for (let i = 0; i < 3; i++) { c.rotate(Math.PI / 3); c.beginPath(); c.moveTo(-r, 0); c.lineTo(r, 0); c.stroke(); }
  c.restore();
}

// ===== 背景：四幕各有天空（固定）＋遠景、中景（無縫重複、視差捲動），畫好後快取成畫布 =====
const BGC = { sc: 0 };
function bgCanvas(id, w, h, paint) {
  const sc = cv.width / W;
  if (Math.abs(BGC.sc - sc) > .01) { for (const k in BGC) if (k !== 'sc') delete BGC[k]; BGC.sc = sc; }
  const key = `${id}|${Math.round(w)}|${Math.round(h)}`;
  if (!BGC[key]) {
    const c = document.createElement('canvas'); c.width = Math.ceil(w * sc); c.height = Math.ceil(h * sc);
    const x = c.getContext('2d'); x.scale(sc, sc); paint(x, w, h);
    BGC[key] = c;
  }
  return BGC[key];
}
// 無縫重複：在圖塊邊緣附近的東西，另外在對側再畫一次
function wrapDraw(w, h, x, y, m, fn) { for (const dx of [-w, 0, w]) for (const dy of [-h, 0, h]) if (x + dx > -m && x + dx < w + m && y + dy > -m && y + dy < h + m) fn(x + dx, y + dy); }
// 一根竹子（整條直穿圖塊；節距能整除圖塊高度才會上下無縫）
function paintStalk(c, x, w, h, sw, col, hi, sh, node, seg) {
  c.fillStyle = col; c.fillRect(x, 0, sw, h);
  c.fillStyle = hi; c.fillRect(x + sw * .18, 0, sw * .18, h);
  c.fillStyle = sh; c.fillRect(x + sw * .72, 0, sw * .28, h);
  for (let y = 0; y < h; y += seg) { c.fillStyle = node; c.fillRect(x - 1, y, sw + 2, 3); c.fillStyle = hi; c.fillRect(x, y + 3, sw, 1); }
}
function paintLeaves(c, x, y, s, col, rot) {
  c.save(); c.translate(x, y); c.rotate(rot); c.fillStyle = col;
  for (let i = 0; i < 4; i++) { c.save(); c.rotate(-.7 + i * .45); c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(s * .5, -s * .22, s, 0); c.quadraticCurveTo(s * .5, s * .22, 0, 0); c.fill(); c.restore(); }
  c.restore();
}
function paintCloud(c, x, y, s, col) {
  c.fillStyle = col;
  for (const [dx, dy, r] of [[-.9, .1, .45], [-.4, -.2, .6], [.2, -.35, .7], [.8, -.05, .5], [1.2, .15, .35], [0, .15, .55]]) { aCirc(c, x + dx * s, y + dy * s, r * s); c.fill(); }
}
// ---- 背景小物件（風／火／山三關用） ----
// 有陰影的雲：底部偏藍的陰影、本體、頂部亮邊
function paintCloud2(c, x, y, s, a = 1, sh = 'rgba(150,180,220,') {
  const L = [[-.9, .1, .45], [-.4, -.2, .6], [.2, -.35, .7], [.8, -.05, .5], [1.2, .15, .35], [0, .15, .55]];
  c.fillStyle = sh + (.55 * a) + ')'; for (const [dx, dy, r] of L) { aCirc(c, x + dx * s, y + dy * s + s * .14, r * s); c.fill(); }
  c.fillStyle = `rgba(255,255,255,${a})`; for (const [dx, dy, r] of L) { aCirc(c, x + dx * s, y + dy * s, r * s * .96); c.fill(); }
  c.fillStyle = `rgba(255,255,255,${.6 * a})`; for (const [dx, dy, r] of L) { aCirc(c, x + dx * s - r * s * .25, y + dy * s - r * s * .3, r * s * .45); c.fill(); }
}
// 鳥居：x,y 為笠木中心。dark = 笠木上的黑漆；有額束上的匾額與注連繩
function paintTorii(c, x, y, s, col, dark) {
  c.save(); c.translate(x, y); c.scale(s, s); c.fillStyle = col;
  c.beginPath(); c.moveTo(-34, -3); c.quadraticCurveTo(0, 2, 34, -3); c.lineTo(36, -9); c.quadraticCurveTo(0, -4, -36, -9); c.closePath(); c.fill();
  if (dark) { c.fillStyle = dark; c.beginPath(); c.moveTo(-37, -9); c.quadraticCurveTo(0, -4, 37, -9); c.lineTo(36, -13); c.quadraticCurveTo(0, -8, -36, -13); c.closePath(); c.fill(); c.fillStyle = col; }
  c.fillRect(-27, 4, 54, 4);
  c.fillRect(-22, -2, 5, 44); c.fillRect(17, -2, 5, 44);
  if (dark) {
    c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(-19, -2, 2, 44); c.fillRect(20, -2, 2, 44);   // 柱的陰影面
    c.fillStyle = dark; c.fillRect(-23, 36, 7, 6); c.fillRect(16, 36, 7, 6);
    c.fillStyle = '#1e1a1a'; c.fillRect(-5, -2, 10, 9); c.fillStyle = '#d8a43a'; c.fillRect(-3.5, -.5, 7, 6);   // 匾額
    c.strokeStyle = '#d8c48a'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(-17, 14); c.quadraticCurveTo(0, 19, 17, 14); c.stroke();   // 注連繩
    c.fillStyle = '#fff'; for (const sx of [-9, 0, 9]) { c.beginPath(); c.moveTo(sx - 1.5, 16); c.lineTo(sx + 1.5, 16); c.lineTo(sx, 20); c.lineTo(sx + 1.5, 20); c.lineTo(sx - 1, 24); c.closePath(); c.fill(); }
  } else c.fillRect(-3, -2, 6, 8);
  c.restore();
}
// 五重塔：x,y 為塔基中心；每層有朱柱、白壁、黑瓦屋簷、簷角的風鐸
function paintPagoda(c, x, y, s) {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.fillStyle = '#8a8a90'; c.fillRect(-24, 30, 48, 6); c.fillStyle = '#6a6a72'; c.fillRect(-24, 34, 48, 2);
  for (let i = 0; i < 5; i++) {
    const ww = 40 - i * 6, yy = 30 - i * 15;
    c.fillStyle = '#f2ead8'; c.fillRect(-ww / 4, yy - 9, ww / 2, 9);
    c.fillStyle = '#c8402a'; c.fillRect(-ww / 4, yy - 9, 2, 9); c.fillRect(ww / 4 - 2, yy - 9, 2, 9); c.fillRect(-1, yy - 9, 2, 9);
    c.fillStyle = '#2a2430'; c.beginPath(); c.moveTo(-ww / 2 - 8, yy - 7); c.quadraticCurveTo(0, yy - 12, ww / 2 + 8, yy - 7); c.lineTo(ww / 2 - 2, yy - 14); c.lineTo(-ww / 2 + 2, yy - 14); c.closePath(); c.fill();
    c.fillStyle = '#5a5464'; c.fillRect(-ww / 2 + 2, yy - 14, ww - 4, 1.5);
    c.fillStyle = '#d8a43a'; for (const sd of [-1, 1]) { aCirc(c, sd * (ww / 2 + 7), yy - 5, 1.4); c.fill(); }
  }
  c.fillStyle = '#d8a43a'; c.fillRect(-1.2, -64, 2.4, 22); for (let i = 0; i < 5; i++) { aCirc(c, 0, -46 - i * 3.6, 2.4 - i * .3); c.fill(); }
  c.restore();
}
// 浮島：下方尖尖的岩塊，上面長草
function paintIsland(c, x, y, w) {
  c.save(); c.translate(x, y);
  c.fillStyle = '#7a6a5a'; c.beginPath(); c.moveTo(-w / 2, 0); c.lineTo(w / 2, 0); c.lineTo(w * .3, w * .2); c.lineTo(w * .1, w * .45); c.lineTo(-w * .05, w * .32); c.lineTo(-w * .2, w * .5); c.lineTo(-w * .35, w * .18); c.closePath(); c.fill();
  c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.moveTo(0, 0); c.lineTo(w / 2, 0); c.lineTo(w * .3, w * .2); c.lineTo(w * .1, w * .45); c.closePath(); c.fill();
  c.fillStyle = '#6aaa4a'; aRR(c, -w / 2 - 2, -4, w + 4, 7, 3); c.fill(); c.fillStyle = '#8aca5a'; c.fillRect(-w / 2, -4, w, 2);
  c.restore();
}
// 鳶形風箏（紅白），拖著長尾巴
function paintKite(c, x, y, s, rot) {
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s);
  c.strokeStyle = 'rgba(80,60,40,.5)'; c.lineWidth = .8; c.beginPath(); c.moveTo(0, 10); c.quadraticCurveTo(-20, 40, -10, 80); c.stroke();
  c.fillStyle = '#c0262d'; c.beginPath(); c.moveTo(0, -12); c.lineTo(12, 0); c.lineTo(0, 12); c.lineTo(-12, 0); c.closePath(); c.fill();
  c.fillStyle = '#fff'; c.beginPath(); c.moveTo(0, -7); c.lineTo(7, 0); c.lineTo(0, 7); c.lineTo(-7, 0); c.closePath(); c.fill();
  c.fillStyle = '#c0262d'; c.font = '900 7px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('鳶', 0, .5);
  c.fillStyle = '#ffd25a'; for (let i = 0; i < 3; i++) { c.save(); c.translate(-2 - i * 3, 16 + i * 8); c.rotate(.5); c.fillRect(-3, -1, 6, 2); c.restore(); }
  c.restore();
}
// 吹流（五色布條在竿上飄）
function paintStreamer(c, x, y, s) {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.fillStyle = '#6a4a2a'; c.fillRect(-1, -30, 2, 46);
  const cols = ['#2b5fb8', '#ffffff', '#e8b84a', '#c0262d', '#2e9a5a'];
  cols.forEach((col, i) => { c.fillStyle = col; c.beginPath(); c.moveTo(1, -28 + i * 3); c.quadraticCurveTo(14, -30 + i * 3, 30, -24 + i * 3.5); c.lineTo(30, -21 + i * 3.5); c.quadraticCurveTo(14, -27 + i * 3, 1, -25 + i * 3); c.closePath(); c.fill(); });
  c.fillStyle = '#d8a43a'; aCirc(c, 0, -31, 2); c.fill();
  c.restore();
}
// 玄武岩柱群：幾根高低不同的六角柱，頂面亮、裂縫透光
function paintBasaltCols(c, x, y, s) {
  c.save(); c.translate(x, y); c.scale(s, s);
  const cols = [[-18, 34], [-6, 48], [6, 40], [18, 28]];
  for (const [cx, hh] of cols) {
    const gr = c.createLinearGradient(cx - 6, 0, cx + 6, 0); gr.addColorStop(0, '#1a0e0c'); gr.addColorStop(.5, '#3e2a26'); gr.addColorStop(1, '#120806');
    c.fillStyle = gr; c.fillRect(cx - 6, -hh, 12, hh + 10);
    c.fillStyle = '#5a403a'; c.beginPath(); c.moveTo(cx - 6, -hh); c.lineTo(cx - 3, -hh - 3); c.lineTo(cx + 3, -hh - 3); c.lineTo(cx + 6, -hh); c.lineTo(cx + 3, -hh + 2); c.lineTo(cx - 3, -hh + 2); c.closePath(); c.fill();
    c.fillStyle = 'rgba(255,120,40,.7)'; c.fillRect(cx + 5, -hh + 6, 1.2, hh);
  }
  c.strokeStyle = '#ffb04a'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(-8, -20); c.lineTo(-4, -10); c.lineTo(-8, 0); c.stroke();
  c.fillStyle = 'rgba(255,140,50,.16)'; aEll(c, 0, 6, 34, 12); c.fill();
  c.restore();
}
// 玄武岩塊（浮空）
function paintBasalt(c, x, y, s, rot) {
  c.save(); c.translate(x, y); c.rotate(rot);
  c.fillStyle = 'rgba(255,140,50,.14)'; aCirc(c, 0, s * .2, s * 1.3); c.fill();
  c.beginPath(); for (let k = 0; k < 6; k++) { const a = k / 6 * TAU + .5; c.lineTo(Math.cos(a) * s, Math.sin(a) * s * .8); } c.closePath();
  const gr = c.createLinearGradient(0, -s, 0, s); gr.addColorStop(0, '#4a3430'); gr.addColorStop(1, '#140a08'); c.fillStyle = gr; c.fill(); c.strokeStyle = '#ff7a2a'; c.lineWidth = 1.2; c.stroke();
  c.strokeStyle = '#ffb04a'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(-s * .5, -s * .2); c.lineTo(-s * .1, s * .1); c.lineTo(s * .2, -s * .1); c.lineTo(s * .5, s * .3); c.stroke();
  c.fillStyle = '#ffd25a'; aCirc(c, s * .5, s * .3, 1.6); c.fill();
  c.restore();
}
// 燒焦的鳥居（火關的遺跡）
function paintBurntTorii(c, x, y, s) {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.fillStyle = '#1a0c08'; c.beginPath(); c.moveTo(-30, -3); c.quadraticCurveTo(0, 1, 18, -3); c.lineTo(24, -10); c.lineTo(10, -6); c.quadraticCurveTo(-10, -4, -32, -9); c.closePath(); c.fill();
  c.fillRect(-24, 4, 40, 4); c.fillRect(-20, -2, 5, 44); c.beginPath(); c.moveTo(15, -2); c.lineTo(20, -2); c.lineTo(20, 26); c.lineTo(17, 30); c.lineTo(15, 22); c.closePath(); c.fill();
  c.fillStyle = '#ff7a2a'; c.fillRect(-19, 10, 1.2, 14); c.fillRect(16, 8, 1, 12);
  c.fillStyle = 'rgba(255,160,60,.6)'; aCirc(c, 18, 28, 2.4); c.fill();
  c.restore();
}
// 覆雪的松樹：四層枝葉、每層下緣有陰影、上面堆雪
function paintPine(c, x, y, s, col, snow, dark) {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.fillStyle = '#4a3428'; c.fillRect(-2.5, -10, 5, 10);
  for (let i = 0; i < 4; i++) {
    const ww = 24 - i * 5, yy = -8 - i * 10;
    c.fillStyle = dark || col; c.beginPath(); c.moveTo(-ww, yy); c.lineTo(0, yy - 16); c.lineTo(ww, yy); c.quadraticCurveTo(0, yy + 3, -ww, yy); c.fill();
    c.fillStyle = col; c.beginPath(); c.moveTo(-ww * .9, yy - 2); c.lineTo(0, yy - 16); c.lineTo(ww * .7, yy - 3); c.closePath(); c.fill();
    c.fillStyle = snow; c.beginPath(); c.moveTo(-ww * .62, yy - 6); c.quadraticCurveTo(-ww * .2, yy - 13, 0, yy - 17); c.quadraticCurveTo(ww * .3, yy - 12, ww * .62, yy - 6); c.quadraticCurveTo(ww * .2, yy - 9, 0, yy - 8); c.quadraticCurveTo(-ww * .3, yy - 10, -ww * .62, yy - 6); c.fill();
  }
  c.restore();
}
// 山寺：朱柱白壁、積雪的瓦屋頂、吊鐘
function paintTempleRoof(c, x, y, s) {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.fillStyle = '#f2ead8'; c.fillRect(-26, 0, 52, 38);
  c.fillStyle = '#a83a2a'; for (const px of [-26, -9, 9, 22]) c.fillRect(px, 0, 4, 40);
  c.fillStyle = '#3a2a24'; c.fillRect(-20, 14, 10, 18); c.fillRect(12, 14, 8, 18);
  c.fillStyle = '#d8a43a'; c.fillRect(-4, 6, 8, 10); c.fillStyle = '#6a4a1a'; c.fillRect(-3, 7, 6, 8);   // 匾額
  c.fillStyle = '#3a3440'; c.beginPath(); c.moveTo(-52, 4); c.quadraticCurveTo(0, -4, 52, 4); c.lineTo(38, -18); c.lineTo(-38, -18); c.closePath(); c.fill();
  c.strokeStyle = 'rgba(255,255,255,.12)'; c.lineWidth = 1; for (let i = -34; i <= 34; i += 5) { c.beginPath(); c.moveTo(i * 1.2, 2); c.lineTo(i, -16); c.stroke(); }
  c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(-46, -2); c.quadraticCurveTo(-20, -9, 0, -10); c.quadraticCurveTo(20, -9, 46, -2); c.lineTo(36, -19); c.quadraticCurveTo(0, -27, -36, -19); c.closePath(); c.fill();
  c.fillStyle = 'rgba(150,180,215,.6)'; c.beginPath(); c.moveTo(-46, -2); c.quadraticCurveTo(0, -12, 46, -2); c.quadraticCurveTo(0, -8, -46, -2); c.fill();
  c.fillStyle = '#ffffff'; for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(-40 + i * 16, 2); c.lineTo(-38 + i * 16, 8 + (i % 2) * 3); c.lineTo(-36 + i * 16, 2); c.fill(); }   // 冰柱
  c.restore();
}
// 石燈籠（頂上積雪、火袋透出燈光）
function paintLantern(c, x, y, s) {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.fillStyle = 'rgba(255,210,120,.25)'; aCirc(c, 0, -20, 14); c.fill();
  c.fillStyle = '#8a8c94'; c.fillRect(-7, -3, 14, 3); c.fillRect(-3, -14, 6, 11); c.fillRect(-8, -17, 16, 3); c.fillRect(-6, -27, 12, 10);
  c.fillStyle = '#6a6c74'; c.fillRect(1, -14, 2, 11); c.fillRect(3, -27, 3, 10);
  c.fillStyle = '#ffd27a'; c.fillRect(-3, -24, 6, 5);
  c.fillStyle = '#7a7c84'; c.beginPath(); c.moveTo(-12, -27); c.lineTo(12, -27); c.lineTo(4, -33); c.lineTo(-4, -33); c.closePath(); c.fill();
  c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(-12, -28); c.quadraticCurveTo(0, -35, 12, -28); c.lineTo(4, -34); c.lineTo(-4, -34); c.closePath(); c.fill();
  c.fillStyle = '#7a7c84'; aCirc(c, 0, -36, 2); c.fill(); c.fillStyle = '#fff'; aEll(c, 0, -37.5, 2.2, 1); c.fill();
  c.restore();
}
// 地藏：紅色圍兜、頭上積雪
function paintJizo(c, x, y, s) {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.fillStyle = '#9a9ca4'; aEll(c, 0, -8, 7, 9); c.fill(); aCirc(c, 0, -20, 5.5); c.fill();
  c.fillStyle = '#c0262d'; c.beginPath(); c.moveTo(-6, -15); c.lineTo(6, -15); c.lineTo(3, -7); c.lineTo(-3, -7); c.closePath(); c.fill();
  c.fillStyle = '#5a5c64'; c.fillRect(-1.6, -21, 1, 1); c.fillRect(.8, -21, 1, 1);
  c.fillStyle = '#fff'; aEll(c, 0, -25, 5, 2); c.fill();
  c.fillStyle = '#7a7c84'; c.fillRect(-8, -1, 16, 3);
  c.restore();
}
// 冰柱（掛在岩棚下）
function paintIcicles(c, x, y, w) {
  c.fillStyle = 'rgba(220,240,255,.9)';
  for (let i = 0; i < w / 6; i++) { const l = 6 + ((i * 7) % 11); c.beginPath(); c.moveTo(x + i * 6, y); c.lineTo(x + i * 6 + 2.5, y + l); c.lineTo(x + i * 6 + 5, y); c.fill(); }
  c.fillStyle = '#fff'; c.fillRect(x - 2, y - 3, w + 4, 4);
}
// ---- 左右牆壁：林是竹柱；風是朱漆鳥居柱、火是發光裂縫的火山岩柱、山是覆雪岩壁 ----
const WALL_PAINT = {
  '風': (c, w, h) => {
    const gr = c.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, '#8a1e14'); gr.addColorStop(.3, '#e2462e'); gr.addColorStop(.5, '#ff8a6a'); gr.addColorStop(.7, '#d8402a'); gr.addColorStop(1, '#7a1a10');
    c.fillStyle = gr; c.fillRect(0, 0, w, h);
    c.fillStyle = '#1e1a1a'; c.fillRect(0, h - 12, w, 6);   // 黑漆的箍
    c.fillStyle = '#d8a43a'; c.fillRect(0, h - 13, w, 1.4); c.fillRect(0, h - 5, w, 1.4);
    // 注連繩與紙垂
    c.strokeStyle = '#d8c48a'; c.lineWidth = 3; c.beginPath(); c.moveTo(0, h * .4); c.quadraticCurveTo(w / 2, h * .46, w, h * .4); c.stroke();
    c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(w * .5 - 2, h * .44); c.lineTo(w * .5 + 3, h * .44); c.lineTo(w * .5 - 1, h * .52); c.lineTo(w * .5 + 3, h * .52); c.lineTo(w * .5 - 2, h * .6); c.closePath(); c.fill();
    c.fillStyle = INK; c.fillRect(0, 0, 1.4, h); c.fillRect(w - 1.4, 0, 1.4, h);
  },
  '火': (c, w, h) => {
    const gr = c.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, '#0a0404'); gr.addColorStop(.4, '#3a2420'); gr.addColorStop(.6, '#2a1814'); gr.addColorStop(1, '#0a0404');
    c.fillStyle = gr; c.fillRect(0, 0, w, h);
    c.strokeStyle = '#ff7a2a'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(w * .3, 0); c.lineTo(w * .6, h * .3); c.lineTo(w * .35, h * .55); c.lineTo(w * .7, h * .85); c.lineTo(w * .5, h); c.stroke();
    c.strokeStyle = 'rgba(255,200,90,.8)'; c.lineWidth = .7; c.stroke();
    c.fillStyle = INK; c.fillRect(0, h - 4, w, 2);
    c.fillStyle = INK; c.fillRect(0, 0, 1.4, h); c.fillRect(w - 1.4, 0, 1.4, h);
  },
  '山': (c, w, h) => {
    const gr = c.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, '#4a5a70'); gr.addColorStop(.45, '#8a9ab0'); gr.addColorStop(1, '#4a5a70');
    c.fillStyle = gr; c.fillRect(0, 0, w, h);
    c.fillStyle = 'rgba(30,40,60,.35)'; c.fillRect(w * .2, h * .2, w * .5, 2); c.fillRect(w * .4, h * .7, w * .4, 2);
    // 積雪的岩棚
    c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(0, h * .48); c.quadraticCurveTo(w / 2, h * .42, w, h * .48); c.lineTo(w, h * .52); c.quadraticCurveTo(w / 2, h * .5, 0, h * .53); c.closePath(); c.fill();
    c.fillStyle = '#ffffff'; c.fillRect(w * .1, 0, w * .2, 3);
    c.fillStyle = INK; c.fillRect(0, 0, 1.4, h); c.fillRect(w - 1.4, 0, 1.4, h);
  },
};
const BG_THEME = {
  '林': {
    sky: (c, w, h) => {
      const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#3f9a52'); gr.addColorStop(.55, '#1c6436'); gr.addColorStop(1, '#0b3a20');
      c.fillStyle = gr; c.fillRect(0, 0, w, h);
      c.globalCompositeOperation = 'lighter';   // 斜射的光束
      for (let i = 0; i < 5; i++) { const x0 = w * (.35 + i * .16); c.fillStyle = 'rgba(220,255,200,.045)'; c.beginPath(); c.moveTo(x0, 0); c.lineTo(x0 + 40, 0); c.lineTo(x0 - 120, h); c.lineTo(x0 - 190, h); c.fill(); }
      c.globalCompositeOperation = 'source-over';
      const fog = c.createLinearGradient(0, h * .65, 0, h); fog.addColorStop(0, 'rgba(200,240,210,0)'); fog.addColorStop(1, 'rgba(200,240,210,.12)'); c.fillStyle = fog; c.fillRect(0, h * .65, w, h * .35);
    },
    far: (c, w, h) => {
      const r = aRng(11);
      for (let i = 0; i < 7; i++) { const x = r() * w, sw = 5 + r() * 4; wrapDraw(w, h, x, 0, 10, (xx) => paintStalk(c, xx, w, h, sw, 'rgba(70,150,90,.5)', 'rgba(140,210,150,.3)', 'rgba(20,70,40,.3)', 'rgba(30,90,50,.5)', 80)); }
      for (let i = 0; i < 14; i++) { const x = r() * w, y = r() * h, s = 10 + r() * 10, ro = r() * 6; wrapDraw(w, h, x, y, 30, (xx, yy) => paintLeaves(c, xx, yy, s, 'rgba(60,140,80,.55)', ro)); }
    },
    mid: (c, w, h) => {
      const r = aRng(23);
      for (let i = 0; i < 4; i++) { const x = (i + .2 + r() * .6) * w / 4, sw = 14 + r() * 6; wrapDraw(w, h, x, 0, 24, (xx) => paintStalk(c, xx, w, h, sw, '#4f9c48', '#7cc46a', '#2f6a30', '#2b6a30', 160)); }
      for (let i = 0; i < 10; i++) { const x = r() * w, y = r() * h, s = 16 + r() * 12, ro = r() * 6; wrapDraw(w, h, x, y, 40, (xx, yy) => paintLeaves(c, xx, yy, s, '#3f8a3c', ro)); }
    },
    live: (camY, t) => { // 飄落的竹葉＋螢火蟲
      for (let i = 0; i < 6; i++) { const x = ((i * 97 + t * 14 + Math.sin(t + i) * 20) % (W + 40)) - 20, y = ((i * 173 + t * 38 - camY * .3) % (H + 40) + H + 40) % (H + 40) - 20; paintLeaves(ctx, x, y, 7, 'rgba(150,210,110,.75)', t * 2 + i); }
      for (let i = 0; i < 8; i++) { const x = (i * 131 + Math.sin(t * .7 + i) * 30 + W) % W, y = ((i * 211 - camY * .2 + Math.cos(t * .5 + i) * 20) % H + H) % H, a = .35 + .35 * Math.sin(t * 3 + i * 2); ctx.fillStyle = `rgba(220,255,150,${a * .3})`; aCirc(ctx, x, y, 5); ctx.fill(); ctx.fillStyle = `rgba(240,255,190,${a})`; aCirc(ctx, x, y, 1.6); ctx.fill(); }
    },
  },
  // ---- 風：雲海天空。藍天、光束、層層雪峰浮在雲海上；雲間有浮島、朱色鳥居、五重塔、鳶形風箏與吹流 ----
  '風': {
    sky: (c, w, h) => {
      const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#2a74cc'); gr.addColorStop(.5, '#6cb4ec'); gr.addColorStop(.8, '#bfe4fb'); gr.addColorStop(1, '#e8f6ff');
      c.fillStyle = gr; c.fillRect(0, 0, w, h);
      const sun = c.createRadialGradient(w * .78, h * .12, 5, w * .78, h * .12, 150); sun.addColorStop(0, 'rgba(255,255,235,.95)'); sun.addColorStop(.15, 'rgba(255,250,215,.5)'); sun.addColorStop(1, 'rgba(255,250,215,0)');
      c.fillStyle = sun; c.fillRect(0, 0, w, h);
      c.save(); c.globalCompositeOperation = 'lighter';   // 從太陽斜射下來的光束
      for (let i = 0; i < 5; i++) { const a = 1.9 + i * .16; c.fillStyle = 'rgba(255,255,230,.05)'; c.beginPath(); c.moveTo(w * .78, h * .12); c.lineTo(w * .78 + Math.cos(a) * h * 1.2, h * .12 + Math.sin(a) * h * 1.2); c.lineTo(w * .78 + Math.cos(a + .07) * h * 1.2, h * .12 + Math.sin(a + .07) * h * 1.2); c.fill(); }
      c.restore();
      // 高空的薄雲
      c.fillStyle = 'rgba(255,255,255,.35)'; for (const [x, y, ww] of [[.15, .1, 90], [.5, .22, 120], [.3, .34, 70]]) { aEll(c, w * x, h * y, ww, 5); c.fill(); aEll(c, w * x + 30, h * y + 6, ww * .6, 4); c.fill(); }
      // 兩層雪峰：受光面亮、背光面藍
      const peaks = (base, pts, col, shade) => { c.fillStyle = col; c.beginPath(); c.moveTo(0, h); c.lineTo(0, base); for (const [x, y] of pts) c.lineTo(w * x, h * y); c.lineTo(w, base); c.lineTo(w, h); c.fill();
        c.fillStyle = shade; for (let i = 0; i < pts.length; i++) { const [x, y] = pts[i]; if (y > (base / h) - .06) continue; c.beginPath(); c.moveTo(w * x, h * y); c.lineTo(w * x + 34, h * y + 60); c.lineTo(w * x + 8, h * y + 60); c.closePath(); c.fill();
          c.fillStyle = '#f6faff'; c.beginPath(); c.moveTo(w * x, h * y); c.lineTo(w * x - 16, h * y + 16); c.lineTo(w * x - 6, h * y + 12); c.lineTo(w * x, h * y + 18); c.lineTo(w * x + 7, h * y + 12); c.lineTo(w * x + 15, h * y + 15); c.fill(); c.fillStyle = shade; } };
      peaks(h * .74, [[.08, .64], [.2, .5], [.34, .62], [.52, .44], [.68, .6], [.84, .5], [.96, .6]], '#a8c4e0', 'rgba(110,140,190,.45)');
      peaks(h * .8, [[.12, .7], [.4, .6], [.6, .68], [.9, .62]], '#86a8cc', 'rgba(80,110,160,.45)');
      // 雲海（有陰影、一層層疊上來）
      for (const [x, y, s] of [[.05, .8, 60], [.35, .79, 80], [.7, .81, 70], [.95, .8, 60]]) paintCloud2(c, w * x, h * y, s, .9);
      for (const [x, y, s] of [[.18, .88, 90], [.55, .9, 100], [.88, .88, 85]]) paintCloud2(c, w * x, h * y, s, 1);
      for (const [x, y, s] of [[0, .97, 90], [.38, .99, 110], [.78, .98, 100]]) paintCloud2(c, w * x, h * y, s, 1);
    },
    far: (c, w, h) => {
      const r = aRng(5);
      for (let i = 0; i < 6; i++) { const x = r() * w, y = r() * h, s = 16 + r() * 16; wrapDraw(w, h, x, y, 60, (xx, yy) => paintCloud2(c, xx, yy, s, .5, 'rgba(170,200,235,')); }
      // 遠處的浮島與小鳥居
      { const x = r() * w, y = r() * h; wrapDraw(w, h, x, y, 50, (xx, yy) => { c.globalAlpha = .55; paintIsland(c, xx, yy, 46); paintTorii(c, xx, yy - 18, .4, '#d65c46', null); c.globalAlpha = 1; }); }
      { const x = r() * w, y = r() * h; wrapDraw(w, h, x, y, 50, (xx, yy) => { c.globalAlpha = .5; paintPagoda(c, xx, yy, .45); c.globalAlpha = 1; }); }
      // 飛鳥群
      c.strokeStyle = 'rgba(60,90,130,.5)'; c.lineWidth = 1.3;
      for (let k = 0; k < 2; k++) { const bx = r() * w, by = r() * h; for (let i = 0; i < 5; i++) { const x = bx + i * 12 - (i % 2) * 4, y = by + Math.abs(i - 2) * 7, s = 4; wrapDraw(w, h, x, y, 10, (xx, yy) => { c.beginPath(); c.moveTo(xx - s, yy - s * .4); c.quadraticCurveTo(xx - s * .4, yy - s * .6, xx, yy); c.quadraticCurveTo(xx + s * .4, yy - s * .6, xx + s, yy - s * .4); c.stroke(); }); } }
    },
    mid: (c, w, h) => {
      const r = aRng(9);
      // 浮島上的朱色鳥居
      { const x = w * (.2 + r() * .2), y = h * (.18 + r() * .1); wrapDraw(w, h, x, y, 80, (xx, yy) => { paintCloud2(c, xx + 10, yy + 52, 36, .95); paintIsland(c, xx, yy + 42, 80); paintTorii(c, xx, yy, 1, '#d8432c', '#1e1a1a'); }); }
      // 雲上的五重塔
      { const x = w * (.6 + r() * .25), y = h * (.62 + r() * .1); wrapDraw(w, h, x, y, 90, (xx, yy) => { paintIsland(c, xx, yy + 36, 66); paintCloud2(c, xx - 26, yy + 46, 30, .95); paintCloud2(c, xx + 34, yy + 44, 26, .95); paintPagoda(c, xx, yy, .9); }); }
      // 吹流
      { const x = w * (.75 + r() * .15), y = h * (.3 + r() * .1); wrapDraw(w, h, x, y, 50, (xx, yy) => { paintCloud2(c, xx, yy + 18, 22, .95); paintStreamer(c, xx, yy, 1); }); }
      // 鳶形風箏
      { const x = w * (.1 + r() * .2), y = h * (.5 + r() * .15); wrapDraw(w, h, x, y, 50, (xx, yy) => paintKite(c, xx, yy, 1, -.2)); }
      for (let i = 0; i < 4; i++) { const x = r() * w, y = r() * h, s = 22 + r() * 14; wrapDraw(w, h, x, y, 70, (xx, yy) => paintCloud2(c, xx, yy, s, .85)); }
    },
    live: (camY, t) => { // 風的線條＋被吹過的紙片與花瓣
      ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
      for (let i = 0; i < 7; i++) { const x = ((t * 280 + i * 157) % (W + 200)) - 100, y = ((i * 131 - camY * .25) % H + H) % H; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 30, y - 6, x + 70, y); ctx.stroke(); }
      for (let i = 0; i < 6; i++) { const x = ((t * 160 + i * 211) % (W + 60)) - 30, y = ((i * 197 - camY * .3 + Math.sin(t * 3 + i) * 20) % H + H) % H; ctx.save(); ctx.translate(x, y); ctx.rotate(t * 6 + i); ctx.fillStyle = i % 2 ? 'rgba(255,255,255,.9)' : 'rgba(255,190,210,.9)'; if (i % 2) ctx.fillRect(-3, -4, 6, 8); else { aEll(ctx, 0, 0, 3, 2); ctx.fill(); } ctx.restore(); }
    },
  },
  // ---- 火：火山熔岩洞窟。洞頂的鐘乳石、多層岩壁、岩漿湖的光、岩漿瀑布；玄武岩柱群與燒焦的鳥居 ----
  '火': {
    sky: (c, w, h) => {
      const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#0a0201'); gr.addColorStop(.45, '#32090a'); gr.addColorStop(.8, '#6a1806'); gr.addColorStop(1, '#a83208');
      c.fillStyle = gr; c.fillRect(0, 0, w, h);
      // 遠方岩壁的層次（越遠越紅）
      const wall = (col, base, amp, sd) => { const r = aRng(sd); c.fillStyle = col; c.beginPath(); c.moveTo(0, h); let y = base; for (let x = 0; x <= w; x += 20) { y = base - r() * amp; c.lineTo(x, y); } c.lineTo(w, h); c.fill(); };
      wall('rgba(120,30,10,.6)', h * .55, 60, 11); wall('rgba(70,16,8,.85)', h * .7, 50, 12);
      // 岩漿瀑布（帶流動條紋）
      for (const [x, ww, top] of [[.16, 9, .25], [.6, 15, .18], [.86, 7, .32]]) {
        const lg = c.createLinearGradient(0, h * top, 0, h); lg.addColorStop(0, 'rgba(255,140,40,0)'); lg.addColorStop(.25, 'rgba(255,150,50,.8)'); lg.addColorStop(1, 'rgba(255,220,100,.95)');
        c.fillStyle = lg; c.fillRect(w * x - ww / 2, h * top, ww, h * (1 - top));
        c.fillStyle = 'rgba(255,240,170,.5)'; for (let y = h * top + 20; y < h; y += 26) c.fillRect(w * x - ww / 2 + 2, y, 2, 12);
        const glow = c.createRadialGradient(w * x, h * .96, 4, w * x, h * .96, 80); glow.addColorStop(0, 'rgba(255,180,70,.6)'); glow.addColorStop(1, 'rgba(255,90,20,0)'); c.fillStyle = glow; c.fillRect(0, 0, w, h);
      }
      // 岩漿湖的反光
      const lake = c.createLinearGradient(0, h * .9, 0, h); lake.addColorStop(0, 'rgba(255,120,30,0)'); lake.addColorStop(1, 'rgba(255,170,60,.7)'); c.fillStyle = lake; c.fillRect(0, h * .9, w, h * .1);
      // 煙霧
      c.fillStyle = 'rgba(30,10,8,.35)'; for (let i = 0; i < 6; i++) { aCirc(c, w * (.1 + i * .17), h * (.42 + (i % 2) * .06), 40 + (i % 3) * 14); c.fill(); }
      // 洞頂的鐘乳石（兩層）
      for (const [col, base, sd] of [['#1a0604', 50, 4], ['#060101', 20, 3]]) { c.fillStyle = col; c.beginPath(); c.moveTo(0, 0); const r = aRng(sd); let x = 0; while (x < w) { const sw = 16 + r() * 28; c.lineTo(x + sw * .5, base + 20 + r() * 60); x += sw; c.lineTo(x, base * .2 + r() * 8); } c.lineTo(w, 0); c.fill(); }
      c.fillStyle = 'rgba(255,120,40,.5)'; for (let i = 0; i < 8; i++) { aCirc(c, w * ((i * .137 + .05) % 1), 60 + (i % 3) * 20, 1.6); c.fill(); }   // 鐘乳石尖端的岩漿滴
    },
    far: (c, w, h) => {
      const r = aRng(31);
      // 遠處的岩柱（暗紅剪影，右緣被岩漿照亮）
      for (let i = 0; i < 5; i++) { const x = r() * w, sw = 12 + r() * 16; wrapDraw(w, h, x, 0, 30, (xx) => { c.fillStyle = 'rgba(40,8,4,.85)'; c.fillRect(xx, 0, sw, h); c.fillStyle = 'rgba(255,110,40,.3)'; c.fillRect(xx + sw - 2, 0, 2, h); c.fillStyle = 'rgba(0,0,0,.25)'; for (let y = 0; y < h; y += 46) c.fillRect(xx, y, sw, 2); }); }
      // 發光的岩漿結晶
      for (let i = 0; i < 4; i++) { const x = r() * w, y = r() * h; wrapDraw(w, h, x, y, 12, (xx, yy) => { c.fillStyle = 'rgba(255,120,40,.25)'; aCirc(c, xx, yy, 10); c.fill(); c.fillStyle = '#ff9a3a'; c.beginPath(); c.moveTo(xx, yy - 7); c.lineTo(xx + 3, yy); c.lineTo(xx, yy + 5); c.lineTo(xx - 3, yy); c.closePath(); c.fill(); }); }
      c.fillStyle = 'rgba(255,140,60,.35)'; for (let i = 0; i < 14; i++) { const x = r() * w, y = r() * h; wrapDraw(w, h, x, y, 4, (xx, yy) => { aCirc(c, xx, yy, 1.4); c.fill(); }); }
    },
    mid: (c, w, h) => {
      const r = aRng(37);
      { const x = w * (.15 + r() * .2), y = h * (.3 + r() * .1); wrapDraw(w, h, x, y, 60, (xx, yy) => paintBasaltCols(c, xx, yy, 1)); }
      { const x = w * (.65 + r() * .2), y = h * (.72 + r() * .1); wrapDraw(w, h, x, y, 60, (xx, yy) => { paintBasaltCols(c, xx, yy + 10, .8); paintBurntTorii(c, xx, yy - 36, .8); }); }
      for (let i = 0; i < 4; i++) { const x = r() * w, y = r() * h, s = 14 + r() * 12, rot = r() * .6 - .3; wrapDraw(w, h, x, y, 50, (xx, yy) => paintBasalt(c, xx, yy, s, rot)); }
    },
    live: (camY, t) => { // 往上飄的火星＋熱浪
      for (let i = 0, n = Math.ceil(26 * WK()); i < n; i++) {
        const x = (i * 53 + Math.sin(t * 1.5 + i) * 14) % W, y = H - (((t * 70 + i * 97) - camY * .2) % (H + 40));
        ctx.fillStyle = i % 3 ? 'rgba(255,170,70,.9)' : 'rgba(255,230,140,.95)'; aCirc(ctx, x, y, 1.2 + (i % 3) * .6); ctx.fill();
      }
      ctx.fillStyle = 'rgba(255,120,40,.06)'; ctx.fillRect(0, H * (.55 + .05 * Math.sin(t * 2)), W, H);
    },
  },
  // ---- 山：雪山山寺。冬空、層層雪峰（受光面與陰影面）、山腰的雲；覆雪松樹、山寺、石燈籠、地藏、冰柱 ----
  '山': {
    sky: (c, w, h) => {
      const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#6e9ad0'); gr.addColorStop(.55, '#c6dcf2'); gr.addColorStop(1, '#f2f8fd');
      c.fillStyle = gr; c.fillRect(0, 0, w, h);
      const sun = c.createRadialGradient(w * .25, h * .15, 4, w * .25, h * .15, 100); sun.addColorStop(0, 'rgba(255,255,250,.95)'); sun.addColorStop(1, 'rgba(255,255,250,0)'); c.fillStyle = sun; c.fillRect(0, 0, w, h);
      // 雪峰：先畫山體，再在每個峰頂右側畫陰影面、山頂覆雪
      const ridge = (base, amp, col, shade, snowCol, sd, snowLine) => {
        const r = aRng(sd), pts = [[0, base]]; let x = 0; while (x < w) { x += 50 + r() * 60; pts.push([Math.min(x, w), base - r() * amp]); }
        c.fillStyle = col; c.beginPath(); c.moveTo(0, h); pts.forEach(([a, b]) => c.lineTo(a, b)); c.lineTo(w, h); c.fill();
        for (let i = 1; i < pts.length - 1; i++) {
          const [a, b] = pts[i], [a2, b2] = pts[i + 1];
          c.fillStyle = shade; c.beginPath(); c.moveTo(a, b); c.lineTo(a2, b2); c.lineTo(a2, h); c.lineTo(a + (a2 - a) * .3, h); c.closePath(); c.fill();
          if (b < base - amp * snowLine) { c.fillStyle = snowCol; c.beginPath(); c.moveTo(a, b); c.lineTo(a - 22, b + 22); c.lineTo(a - 10, b + 17); c.lineTo(a - 3, b + 24); c.lineTo(a + 6, b + 16); c.lineTo(a + 20, b + 21); c.closePath(); c.fill(); }
        } };
      ridge(h * .56, 130, '#a9c0dc', 'rgba(110,140,185,.35)', '#f6faff', 3, .4);
      c.fillStyle = 'rgba(255,255,255,.6)'; for (const [x, y, s] of [[.2, .55, 60], [.7, .58, 80]]) { aEll(c, w * x, h * y, s, 10); c.fill(); }   // 山腰的雲
      ridge(h * .7, 90, '#8aa6c8', 'rgba(80,110,160,.35)', '#eef5fc', 4, .45);
      // 遠方峰頂的小山寺
      c.fillStyle = '#4a4a5a'; c.fillRect(w * .62, h * .55, 14, 8); c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(w * .62 - 4, h * .55); c.lineTo(w * .62 + 7, h * .55 - 6); c.lineTo(w * .62 + 18, h * .55); c.fill();
      c.fillStyle = 'rgba(255,255,255,.55)'; c.fillRect(0, h * .8, w, h * .2);
      ridge(h * .86, 40, '#6a86aa', 'rgba(60,80,120,.3)', '#e6f0fa', 5, .2);
      // 遠方的松林
      for (let i = 0; i < 18; i++) paintPine(c, w * (i / 17), h * (.9 + (i % 3) * .02), .5, 'rgba(70,100,120,.7)', 'rgba(240,248,255,.8)');
    },
    far: (c, w, h) => {
      const r = aRng(41);
      for (let i = 0; i < 8; i++) { const x = r() * w, y = r() * h, s = .55 + r() * .35; wrapDraw(w, h, x, y, 30, (xx, yy) => paintPine(c, xx, yy, s, 'rgba(90,120,150,.55)', 'rgba(240,248,255,.75)')); }
      c.fillStyle = 'rgba(255,255,255,.35)'; for (let i = 0; i < 3; i++) { const x = r() * w, y = r() * h; wrapDraw(w, h, x, y, 70, (xx, yy) => { aEll(c, xx, yy, 60, 8); c.fill(); }); }   // 山嵐
    },
    mid: (c, w, h) => {
      const r = aRng(43);
      // 積雪岩棚＋冰柱＋松樹
      for (let i = 0; i < 2; i++) { const x = w * (i ? .72 : .18) + r() * 30, y = h * (.12 + i * .45 + r() * .1); wrapDraw(w, h, x, y, 60, (xx, yy) => {
        c.fillStyle = '#6a7a90'; c.beginPath(); c.moveTo(xx - 40, yy); c.lineTo(xx + 40, yy); c.lineTo(xx + 26, yy + 18); c.lineTo(xx - 30, yy + 14); c.closePath(); c.fill();
        paintIcicles(c, xx - 30, yy + 2, 58); paintPine(c, xx - 16, yy - 2, 1.1, '#2f5a48', '#ffffff', '#1e4034'); paintPine(c, xx + 18, yy - 2, .8, '#2f5a48', '#ffffff', '#1e4034'); }); }
      // 山寺
      { const x = w * (.35 + r() * .3), y = h * (.36 + r() * .08); wrapDraw(w, h, x, y, 80, (xx, yy) => { c.fillStyle = '#ffffff'; aRR(c, xx - 60, yy + 36, 120, 10, 5); c.fill(); paintTempleRoof(c, xx, yy, 1); paintLantern(c, xx - 44, yy + 38, .9); paintLantern(c, xx + 44, yy + 38, .9); }); }
      // 地藏與石燈籠
      { const x = w * (.1 + r() * .2), y = h * (.86 + r() * .06); wrapDraw(w, h, x, y, 30, (xx, yy) => { c.fillStyle = '#ffffff'; aRR(c, xx - 24, yy - 2, 48, 6, 3); c.fill(); paintJizo(c, xx - 10, yy, 1); paintJizo(c, xx + 10, yy, .9); }); }
      for (let i = 0; i < 2; i++) { const x = r() * w, y = r() * h, s = .9 + r() * .4; wrapDraw(w, h, x, y, 50, (xx, yy) => paintPine(c, xx, yy, s, '#2f5a48', '#ffffff', '#1e4034')); }
    },
    live: (camY, t) => { // 細細的飄雪＋山嵐
      for (let i = 0; i < 26; i++) { const x = ((i * 61 + Math.sin(t + i) * 14 + t * 10) % W + W) % W, y = ((i * 83 + t * 38 - camY * .3) % H + H) % H; ctx.fillStyle = 'rgba(255,255,255,.85)'; aCirc(ctx, x, y, 1 + (i % 3) * .6); ctx.fill(); }
      const mg = ctx.createLinearGradient(0, H * .65, 0, H); mg.addColorStop(0, 'rgba(255,255,255,0)'); mg.addColorStop(1, 'rgba(255,255,255,.18)'); ctx.fillStyle = mg; ctx.fillRect(0, H * .65, W, H * .35);
    },
  },
};
function drawBG(camY, stage, t) {
  const th = THEMES[stage % 4], B = BG_THEME[th.k];
  ctx.drawImage(bgCanvas(th.k + 'sky', W, H, B.sky), 0, 0, W, H);
  const TW = 360, TH = 640;
  for (const [layer, f, a] of [['far', .12, 1], ['mid', .35, 1]]) {
    const tile = bgCanvas(th.k + layer, TW, TH, B[layer]), oy = ((-camY * f) % TH + TH) % TH;
    ctx.globalAlpha = a;
    for (let y = oy - TH; y < H; y += TH) for (let x = 0; x < W; x += TW) ctx.drawImage(tile, x, y, TW, TH);
  }
  ctx.globalAlpha = 1;
  B.live(camY, t);
}

// 左右牆壁：粗竹柱（每幕不同色），快取成圖塊後捲動
function drawWalls(camY, stage) {
  const th = THEMES[stage % 4], SEG = 140, ww = WALL + 4;
  const tile = bgCanvas(th.k + 'wall', ww, SEG, WALL_PAINT[th.k] || ((c, w, h) => {   // 風火山用 WALL_PAINT，林是竹柱
    const gr = c.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, th.node); gr.addColorStop(.25, th.stalk); gr.addColorStop(.45, '#ffffff55'); gr.addColorStop(.55, th.stalk); gr.addColorStop(1, th.node);
    c.fillStyle = gr; c.fillRect(0, 0, w, h);
    c.fillStyle = th.stalk; c.fillRect(2, 0, w - 4, h); c.fillStyle = gr; c.globalAlpha = .7; c.fillRect(0, 0, w, h); c.globalAlpha = 1;
    c.fillStyle = 'rgba(255,255,255,.25)'; c.fillRect(w * .3, 0, 2, h);
    c.fillStyle = INK; c.fillRect(0, h - 5, w, 2); c.fillStyle = th.node; c.fillRect(0, h - 3, w, 4);
    c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(1, h - 6, w - 2, 1);
    c.fillStyle = INK; c.fillRect(0, 0, 1.4, h); c.fillRect(w - 1.4, 0, 1.4, h);
  }));
  const o = ((-camY) % SEG + SEG) % SEG;
  for (const [x0, f] of [[-2, 1], [W - ww + 2, -1]]) for (let y = o - SEG; y < H; y += SEG) {
    ctx.save(); ctx.translate(x0 + ww / 2, y); ctx.scale(f, 1); ctx.drawImage(tile, -ww / 2, 0, ww, SEG); ctx.restore();
  }
  ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.fillRect(WALL + 2, 0, 3, H); ctx.fillRect(W - WALL - 5, 0, 3, H);
}

// ===== 死亡區域：火海／海浪／妖怪群 =====
function drawZone(camY, stage, t) {
  if (g && g.tut) return;   // 新手教學：沒有追兵
  const zy = Math.min(g.zoneY, camY + H - 26) - camY;
  const type = THEMES[stage % 4].zone;
  if (zy > H) return;
  const c = ctx;
  if (type === 'fire') {
    const gr = c.createLinearGradient(0, zy, 0, H); gr.addColorStop(0, '#ff7a1a'); gr.addColorStop(.4, '#d8300a'); gr.addColorStop(1, '#6a0600');
    // 後層火焰（暗、慢）
    c.fillStyle = '#c8280a'; c.beginPath(); c.moveTo(0, H); c.lineTo(0, zy);
    for (let x = 0; x <= W + 20; x += 20) c.lineTo(x, zy - 18 - Math.sin(x * .07 + t * 4) * 9 - Math.sin(x * .19 + t * 7) * 5);
    c.lineTo(W, H); c.fill();
    c.fillStyle = gr; c.fillRect(0, zy, W, H - zy);
    // 前層火舌
    for (let i = 0; i < Math.ceil(W / 26) + 1; i++) {
      const x = i * 26 + 8, h = 26 + Math.sin(t * 9 + i * 1.7) * 11, sw = Math.sin(t * 7 + i) * 5;
      c.fillStyle = i % 2 ? '#ffb23a' : '#ff7a1a';
      c.beginPath(); c.moveTo(x - 15, zy + 6); c.quadraticCurveTo(x - 6, zy - h * .5, x + sw, zy - h); c.quadraticCurveTo(x + 6, zy - h * .4, x + 15, zy + 6); c.fill();
      c.fillStyle = '#ffe58a'; c.beginPath(); c.moveTo(x - 6, zy + 6); c.quadraticCurveTo(x - 2, zy - h * .25, x + sw * .5, zy - h * .5); c.quadraticCurveTo(x + 3, zy - h * .2, x + 6, zy + 6); c.fill();
    }
    for (let i = 0; i < 10; i++) { const x = (i * 71 + t * 30) % W, y = zy - ((t * 80 + i * 37) % 70); c.fillStyle = `rgba(255,220,120,${1 - ((t * 80 + i * 37) % 70) / 70})`; c.fillRect(x, y, 2, 2); }
  } else if (type === 'sea') {
    // 後浪
    c.fillStyle = '#1a4a90'; c.beginPath(); c.moveTo(0, H);
    for (let x = 0; x <= W; x += 10) c.lineTo(x, zy - 6 + Math.sin(x * .04 - t * 2.5) * 8);
    c.lineTo(W, H); c.fill();
    const gr = c.createLinearGradient(0, zy, 0, H); gr.addColorStop(0, '#2f78c8'); gr.addColorStop(1, '#0a2a5a');
    c.fillStyle = gr; c.beginPath(); c.moveTo(0, H);
    for (let x = 0; x <= W; x += 8) c.lineTo(x, zy + Math.sin(x * .05 + t * 4) * 7);
    c.lineTo(W, H); c.fill();
    // 浪頭的白色浪花捲（浮世繪風）
    c.strokeStyle = '#ffffff'; c.lineWidth = 2.5; c.lineCap = 'round';
    for (let x = ((t * 30) % 40) - 40; x < W + 40; x += 40) {
      const y = zy + Math.sin(x * .05 + t * 4) * 7;
      c.beginPath(); c.arc(x, y + 4, 6, Math.PI * .9, Math.PI * 2.1); c.stroke();
      c.fillStyle = '#ffffff'; aCirc(c, x + 7, y + 1, 2); c.fill(); aCirc(c, x + 11, y + 4, 1.4); c.fill();
    }
    // 青海波紋
    c.strokeStyle = 'rgba(160,210,255,.18)'; c.lineWidth = 1.5;
    for (let row = 0; row < 5; row++) { const yy = zy + 30 + row * 16; if (yy > H) break; for (let x = (row % 2) * 16; x < W + 20; x += 32) { c.beginPath(); c.arc(x, yy, 14, Math.PI, 0); c.stroke(); c.beginPath(); c.arc(x, yy, 8, Math.PI, 0); c.stroke(); } }
  } else if (type === 'tornado') {
    // 風：龍捲風與暴風雲。灰藍色的雲牆往上翻滾，裡面捲著旋轉的白色風線與碎片
    const gr = c.createLinearGradient(0, zy - 20, 0, H); gr.addColorStop(0, '#6a7c96'); gr.addColorStop(1, '#2a3446');
    c.fillStyle = gr; c.beginPath(); c.moveTo(0, H); c.lineTo(0, zy);
    for (let x = 0; x <= W + 24; x += 24) { const k = Math.sin(x * .05 + t * 3); c.quadraticCurveTo(x - 12, zy - 22 - k * 8, x, zy - 4 + k * 4); }
    c.lineTo(W, H); c.closePath(); c.fill();
    c.fillStyle = 'rgba(200,215,235,.55)'; for (let x = ((t * 40) % 60) - 60; x < W + 60; x += 60) { aCirc(c, x, zy + 4 + Math.sin(x + t * 2) * 4, 18); c.fill(); }
    c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = 2; c.lineCap = 'round';
    for (let i = 0; i < 8; i++) { const cx = (i * 97 + t * 50) % (W + 80) - 40, cy = zy + 30 + (i % 3) * 22, r = 16 + (i % 2) * 8, a = t * 6 + i; if (cy > H) continue; c.beginPath(); c.ellipse(cx, cy, r, r * .35, 0, a, a + 3.6); c.stroke(); }
    for (let i = 0; i < 8; i++) { const a = t * 4 + i * .8, x = (W / 2 + Math.cos(a) * (W * .45)) % W, y = zy + 20 + ((i * 23 + t * 30) % 60); c.save(); c.translate(x, y); c.rotate(a * 2); c.fillStyle = i % 2 ? '#8a6a3a' : '#c8a46a'; c.fillRect(-3, -1.5, 6, 3); c.restore(); }
  } else if (type === 'lava') {
    // 火：熔岩。橘黃色的岩漿表面，浮著黑色岩殼，冒泡噴出火星
    const gr = c.createLinearGradient(0, zy, 0, H); gr.addColorStop(0, '#ffd25a'); gr.addColorStop(.25, '#ff7a1a'); gr.addColorStop(1, '#8a1a04');
    c.fillStyle = 'rgba(255,120,30,.35)'; c.fillRect(0, zy - 30, W, 30);
    c.fillStyle = gr; c.beginPath(); c.moveTo(0, H); for (let x = 0; x <= W; x += 10) c.lineTo(x, zy + Math.sin(x * .04 + t * 1.6) * 4); c.lineTo(W, H); c.fill();
    for (let i = 0; i < Math.ceil(W / 50); i++) { const x = (i * 50 + t * 12) % (W + 50) - 25, y = zy + 16 + (i % 3) * 18; if (y > H) continue; c.fillStyle = '#2a0e06'; c.beginPath(); c.moveTo(x - 16, y); c.lineTo(x - 6, y - 5); c.lineTo(x + 12, y - 3); c.lineTo(x + 16, y + 4); c.lineTo(x - 4, y + 6); c.closePath(); c.fill(); c.strokeStyle = '#ffb04a'; c.lineWidth = 1; c.stroke(); }
    for (let i = 0; i < 6; i++) { const ph = (t * .8 + i * .37) % 1, x = (i * 71 + 20) % W, y = zy + 6; c.fillStyle = `rgba(255,230,120,${1 - ph})`; aCirc(c, x, y - ph * 10, 3 + ph * 5); c.fill(); }
    for (let i = 0; i < 10; i++) { const x = (i * 61 + t * 20) % W, y = zy - ((t * 90 + i * 37) % 80); c.fillStyle = `rgba(255,200,90,${1 - ((t * 90 + i * 37) % 80) / 80})`; c.fillRect(x, y, 2, 2); }
  } else if (type === 'avalanche') {
    // 山：雪崩。白色的雪浪翻滾湧上，帶著藍色陰影、滾動的雪球與岩塊
    c.fillStyle = 'rgba(255,255,255,.4)'; c.fillRect(0, zy - 24, W, 24);
    const gr = c.createLinearGradient(0, zy, 0, H); gr.addColorStop(0, '#ffffff'); gr.addColorStop(.5, '#dce8f6'); gr.addColorStop(1, '#9ab4d4');
    c.fillStyle = gr; c.beginPath(); c.moveTo(0, H); c.lineTo(0, zy);
    for (let x = 0; x <= W + 30; x += 30) { const k = Math.sin(x * .07 + t * 4); c.quadraticCurveTo(x - 15, zy - 26 - k * 10, x, zy - 2 + k * 3); }
    c.lineTo(W, H); c.closePath(); c.fill();
    c.fillStyle = 'rgba(150,180,215,.45)'; for (let x = ((t * 30) % 40) - 40; x < W + 40; x += 40) { c.beginPath(); c.arc(x, zy + 18, 12, 0, Math.PI); c.fill(); }
    for (let i = 0; i < 6; i++) { const x = (i * 83 + t * 40) % (W + 40) - 20, y = zy + 10 + (i % 3) * 20, r = 6 + (i % 3) * 3, a = t * 5 + i; if (y > H) continue; c.save(); c.translate(x, y); c.rotate(a); if (i % 3 === 2) { c.fillStyle = '#7a7c84'; c.fillRect(-r * .7, -r * .6, r * 1.4, r * 1.2); } else { c.fillStyle = '#ffffff'; aCirc(c, 0, 0, r); c.fill(); c.strokeStyle = 'rgba(120,150,190,.7)'; c.lineWidth = 1.2; c.beginPath(); c.arc(0, 0, r * .6, 0, 2); c.stroke(); } c.restore(); }
    c.fillStyle = 'rgba(255,255,255,.9)'; for (let i = 0; i < 14; i++) { const x = (i * 37 + t * 60) % W, y = zy - ((t * 70 + i * 29) % 50); aCirc(c, x, y, 1.6); c.fill(); }
  } else {
    // 妖怪群：黑紫色的大嘴，很多眨眼的紅眼睛看著玩家
    const gr = c.createLinearGradient(0, zy, 0, H); gr.addColorStop(0, '#3a1440'); gr.addColorStop(1, '#12040f');
    c.fillStyle = gr; c.beginPath(); c.moveTo(0, H); c.lineTo(0, zy + 4);
    for (let x = 0; x <= W; x += 30) c.quadraticCurveTo(x + 15, zy - 10 + Math.sin(t * 3 + x) * 4, x + 30, zy + 4);
    c.lineTo(W, H); c.fill();
    c.fillStyle = '#f2e6c8'; c.strokeStyle = INK; c.lineWidth = 1.2;
    for (let x = 0; x < W; x += 18) { const hh = 14 + Math.sin(t * 5 + x) * 4; c.beginPath(); c.moveTo(x, zy + 2); c.lineTo(x + 9, zy - hh); c.lineTo(x + 18, zy + 2); c.closePath(); c.fill(); c.stroke(); }
    const px = g && g.p ? g.p.x : W / 2;
    for (let i = 0, n = Math.ceil(W / 64); i < n; i++) {
      const x = 32 + i * 64 + Math.sin(i * 3) * 10, y = zy + 26 + (i % 2) * 14 + Math.sin(t * 2 + i) * 3;
      if (y > H) continue;
      if (((t * .7 + i * .9) % 4) < .15) { c.strokeStyle = '#ff4a4a'; c.lineWidth = 2; c.beginPath(); c.moveTo(x - 7, y); c.lineTo(x + 7, y); c.stroke(); continue; }
      c.fillStyle = 'rgba(255,40,40,.25)'; aEll(c, x, y, 12, 8); c.fill();
      c.fillStyle = '#ff3030'; aEll(c, x, y, 8, 5.5); c.fill();
      c.fillStyle = '#ffd25a'; aEll(c, x + clamp((px - x) / 60, -3, 3), y, 2.2, 4); c.fill();
    }
  }
}

// ===== 地板 =====
const PLAT_COL = {
  normal: ['#f6fbe9', '#cfe3b0', '#6a9a50'], spike: ['#f6fbe9', '#cfe3b0', '#6a9a50'],
  spring: ['#ffe68a', '#f0b432', '#b07a10'], move: ['#e2f2ff', '#a8d0f2', '#3a7ac0'],
};
function drawPlat(pl) {
  const c = ctx; let x = pl.x - pl.w / 2; const y = pl.y, w = pl.w, h = 12;
  if (pl.crack > 0) x += rnd(-2, 2);
  c.save();
  if (pl.broken) c.globalAlpha = .6;
  if (pl.type === 'ground') {
    const gk = g && g.th != null ? THEMES[g.th].k : '林';
    if (gk === '火') {   // 火：黑色熔岩地，裂縫透出紅光
      c.fillStyle = '#24140f'; c.fillRect(x, y, w, 300);
      c.strokeStyle = '#ff7a2a'; c.lineWidth = 2; for (let i = 0; i < w; i += 46) { c.beginPath(); c.moveTo(x + i, y + 4); c.lineTo(x + i + 12, y + 24); c.lineTo(x + i + 6, y + 44); c.stroke(); }
      c.fillStyle = '#3a2420'; c.fillRect(x, y, w, 8); c.fillStyle = '#ff9a3a'; c.fillRect(x, y, w, 1.5);
      c.restore(); return;
    }
    if (gk === '山') {   // 山：積雪的地面
      c.fillStyle = '#5a5058'; c.fillRect(x, y, w, 300);
      c.fillStyle = '#ffffff'; c.fillRect(x, y, w, 12); c.fillStyle = 'rgba(150,180,215,.6)'; c.fillRect(x, y + 10, w, 3);
      c.fillStyle = '#ffffff'; for (let i = 0; i < w; i += 22) { aEll(c, x + i + 11, y + 1, 12, 5); c.fill(); }
      c.restore(); return;
    }
    c.fillStyle = '#6b4a22'; c.fillRect(x, y, w, 300);
    c.fillStyle = '#5a3c1a'; for (let i = 0; i < w; i += 37) { aEll(c, x + i + 10, y + 30 + (i % 3) * 18, 5, 3); c.fill(); }
    c.fillStyle = '#4a8a3a'; c.fillRect(x, y, w, 10); c.fillStyle = '#6aaa4a'; c.fillRect(x, y, w, 3);
    c.fillStyle = '#4a8a3a'; for (let i = 0; i < w; i += 9) { c.beginPath(); c.moveTo(x + i, y); c.lineTo(x + i + 3, y - 6 - (i % 4)); c.lineTo(x + i + 6, y); c.fill(); }
    c.restore(); return;
  }
  if (pl.type === 'crumble') { // 朽木：三片木板，有木紋和釘子；快崩塌時變紅抖動
    const n = 3, pw = (w - 4) / n;
    for (let i = 0; i < n; i++) {
      const px = x + i * (pw + 2), tilt = pl.crack > 0 ? Math.sin(i * 2 + y) * 1.5 : 0;
      rr(px, y + tilt, pw, h, 2); c.fillStyle = pl.crack > 0 ? '#e09a7a' : '#c9a774'; c.fill(); aInk(c, 1.6);
      c.strokeStyle = 'rgba(90,60,30,.5)'; c.lineWidth = 1; c.beginPath(); c.moveTo(px + 3, y + 4 + tilt); c.lineTo(px + pw - 3, y + 5 + tilt); c.moveTo(px + 4, y + 8 + tilt); c.lineTo(px + pw - 5, y + 8 + tilt); c.stroke();
      c.fillStyle = '#5a4026'; aCirc(c, px + 3, y + 6 + tilt, 1); c.fill(); aCirc(c, px + pw - 3, y + 6 + tilt, 1); c.fill();
    }
    if (pl.crack > 0) { c.strokeStyle = INK; c.lineWidth = 1.4; c.beginPath(); c.moveTo(x + w * .45, y); c.lineTo(x + w * .52, y + 6); c.lineTo(x + w * .47, y + h); c.stroke(); }
    c.restore(); return;
  }
  const C = PLAT_COL[pl.type] || PLAT_COL.normal;
  // 雲朵形狀：本體＋上緣三個鼓起
  c.beginPath(); c.moveTo(x + 6, y + h);
  c.arcTo(x, y + h, x, y + h / 2, 6); c.arcTo(x, y + 2, x + 6, y + 2, 6);
  const bumps = Math.max(2, Math.round(w / 22));
  for (let i = 0; i < bumps; i++) { const bx = x + 6 + (w - 12) * (i + .5) / bumps; c.arc(bx, y + 3, (w - 12) / bumps / 2 + 1, Math.PI, 0); }
  c.arcTo(x + w, y + 2, x + w, y + h / 2, 6); c.arcTo(x + w, y + h, x + w - 6, y + h, 6); c.closePath();
  const gr = c.createLinearGradient(0, y - 4, 0, y + h); gr.addColorStop(0, C[0]); gr.addColorStop(1, C[1]);
  c.fillStyle = gr; c.fill(); aInk(c, 2);
  // 雲紋
  c.strokeStyle = C[2]; c.lineWidth = 1.3;
  for (let i = 10; i < w - 8; i += 15) { c.beginPath(); c.arc(x + i, y + 7.5, 3, Math.PI * .9, Math.PI * 2.5); c.stroke(); }
  if (pl.type === 'move') { // 左右箭頭＋移動的殘影線
    c.fillStyle = C[2]; c.beginPath(); c.moveTo(x + w / 2 - 12, y + 7); c.lineTo(x + w / 2 - 6, y + 3.5); c.lineTo(x + w / 2 - 6, y + 10.5); c.fill(); c.beginPath(); c.moveTo(x + w / 2 + 12, y + 7); c.lineTo(x + w / 2 + 6, y + 3.5); c.lineTo(x + w / 2 + 6, y + 10.5); c.fill();
    c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = 1.5; const dv = Math.cos(g.t * pl.sp + pl.ph) > 0 ? -1 : 1;
    for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(x + (dv > 0 ? w + 4 : -4), y + 3 + i * 3); c.lineTo(x + (dv > 0 ? w + 12 + i * 3 : -12 - i * 3), y + 3 + i * 3); c.stroke(); }
  }
  if (pl.type === 'spring') { // 彈簧：被踩時壓扁
    const cm = pl.comp > 0 ? 4 : 11, cx = pl.x;
    c.lineCap = 'round';
    for (const [lw, col] of [[4.5, INK], [2.6, '#c8ced8']]) { c.strokeStyle = col; c.lineWidth = lw; c.beginPath(); c.moveTo(cx - 6, y); for (let i = 1; i <= 4; i++) c.lineTo(cx + (i % 2 ? 6 : -6), y - cm * i / 4); c.stroke(); }
    rr(cx - 10, y - cm - 4, 20, 5, 2); aFI(c, '#e8463a', 1.6);
    c.fillStyle = 'rgba(255,255,255,.5)'; c.fillRect(cx - 8, y - cm - 3.4, 8, 1.4);
  }
  if (pl.type === 'spike') { // 撒菱釘刺（金屬光澤）
    for (let i = 4; i < w - 6; i += 10) {
      c.beginPath(); c.moveTo(x + i, y + 2); c.lineTo(x + i + 5, y - 10); c.lineTo(x + i + 10, y + 2); c.closePath();
      const sg = c.createLinearGradient(x + i, 0, x + i + 10, 0); sg.addColorStop(0, '#f2f4f8'); sg.addColorStop(.5, '#aeb6c2'); sg.addColorStop(1, '#6a7280');
      c.fillStyle = sg; c.fill(); aInk(c, 1.3);
    }
  }
  c.restore();
}

// ===== 道具 =====
function drawKoban(c, x, y, rx, ry, spin, ph) {
  c.save(); c.translate(x, y); c.scale(spin, 1);
  aEll(c, 0, 0, rx, ry); const gr = c.createLinearGradient(-rx, -ry, rx, ry); gr.addColorStop(0, '#ffe58a'); gr.addColorStop(.5, '#e8b020'); gr.addColorStop(1, '#b07a10');
  c.fillStyle = gr; c.fill(); aInk(c, 1.5);
  aEll(c, 0, 0, rx * .72, ry * .78); c.strokeStyle = '#a06a00'; c.lineWidth = 1; c.stroke();
  c.strokeStyle = 'rgba(140,90,0,.6)'; for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(-rx * .4, i * ry * .25); c.lineTo(rx * .4, i * ry * .25); c.stroke(); }
  // 掃過的高光
  const sh = ((ph * .8) % 3) - 1.5;
  if (Math.abs(sh) < 1) { c.save(); aEll(c, 0, 0, rx, ry); c.clip(); c.fillStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.moveTo(sh * rx * 1.5 - 3, -ry); c.lineTo(sh * rx * 1.5 + 2, -ry); c.lineTo(sh * rx * 1.5 - 4, ry); c.lineTo(sh * rx * 1.5 - 9, ry); c.fill(); c.restore(); }
  c.restore();
}
function drawItem(it) {
  const c = ctx, { x, y } = it;
  if (it.t === 'coin') {
    drawKoban(c, x, y + Math.sin(it.ph * 2) * 1.5, 8, 11, Math.abs(Math.cos(it.ph)) * .8 + .2, it.ph);
  } else if (it.t === 'scroll') {
    const b = Math.sin(it.ph) * 3, pu = .3 + .2 * Math.sin(it.ph * 2);
    const gl = c.createRadialGradient(x, y + b, 4, x, y + b, 26); gl.addColorStop(0, `rgba(255,240,180,${pu + .2})`); gl.addColorStop(1, 'rgba(255,240,180,0)'); c.fillStyle = gl; aCirc(c, x, y + b, 26); c.fill();
    c.save(); c.translate(x, y + b); c.rotate(-.3);
    rr(-14, -6, 28, 12, 3); const gr = c.createLinearGradient(0, -6, 0, 6); gr.addColorStop(0, '#fffbe6'); gr.addColorStop(.6, '#f2e2b0'); gr.addColorStop(1, '#d8c08a'); c.fillStyle = gr; c.fill(); aInk(c, 1.6);
    for (const sx of [-1, 1]) { rr(sx * 16 - 2, -8, 4, 16, 2); aFI(c, '#7a4a22', 1.4); }
    c.fillStyle = '#d8323c'; c.fillRect(-3, -7, 6, 14); c.strokeStyle = INK; c.lineWidth = 1; c.strokeRect(-3, -7, 6, 14);
    c.restore();
    for (let i = 0; i < 3; i++) { const a = it.ph * 2 + i * 2.1; drawSparkle(c, x + Math.cos(a) * 18, y + b + Math.sin(a) * 12, 2.5 + Math.sin(it.ph * 4 + i) * 1); }
  } else if (it.t === 'chest') {
    const b = Math.sin(it.ph) * 2;
    c.save(); c.translate(x, y + b);
    rr(-14, -4, 28, 14, 3); const gr = c.createLinearGradient(0, -4, 0, 10); gr.addColorStop(0, '#a05a22'); gr.addColorStop(1, '#6a3410'); c.fillStyle = gr; c.fill(); aInk(c, 1.8);
    c.beginPath(); c.moveTo(-14, -3); c.quadraticCurveTo(-14, -13, 0, -13); c.quadraticCurveTo(14, -13, 14, -3); c.closePath(); aFI(c, '#b8682a', 1.8);
    c.fillStyle = '#ffd25a'; c.fillRect(-14, -4, 28, 3); c.fillRect(-10, -12, 3, 22); c.fillRect(7, -12, 3, 22);
    rr(-3.5, -6, 7, 8, 1.5); aFI(c, '#ffe58a', 1.2); c.fillStyle = INK; c.fillRect(-.7, -3.5, 1.4, 3);
    c.restore();
    drawSparkle(c, x + 12, y - 12 + b, 3 + Math.sin(it.ph * 5) * 1.5);
  }
}
function drawSparkle(c, x, y, r) {
  if (r <= 0) return;
  c.fillStyle = '#fffbe0'; c.beginPath(); c.moveTo(x, y - r * 2); c.lineTo(x + r * .4, y - r * .4); c.lineTo(x + r * 2, y); c.lineTo(x + r * .4, y + r * .4); c.lineTo(x, y + r * 2); c.lineTo(x - r * .4, y + r * .4); c.lineTo(x - r * 2, y); c.lineTo(x - r * .4, y - r * .4); c.closePath(); c.fill();
}

// ===== 自動技能與掉落物（世界座標） =====
function drawSkillFx() {
  const c = ctx, p = g.p, S = g.sks, px = p.x, py = p.y - 20;
  for (const d of g.drops) {
    if (d.k === 'soul') { // 人魂：藍色火焰＋白色核心＋拖尾
      const r = 4 + Math.min(d.v, 8) * .6, fl = Math.sin(d.ph * 1.3) * 2;
      c.fillStyle = 'rgba(90,209,255,.28)'; aCirc(c, d.x, d.y, r * 2.4); c.fill();
      c.beginPath(); c.moveTo(d.x - r, d.y); c.quadraticCurveTo(d.x - r * .6 + fl, d.y - r * 2, d.x + fl * 1.5, d.y - r * 3.4); c.quadraticCurveTo(d.x + r * .4, d.y - r * 1.6, d.x + r, d.y); c.arc(d.x, d.y, r, 0, Math.PI);
      c.fillStyle = '#5ad1ff'; c.fill(); c.strokeStyle = '#1a6a9a'; c.lineWidth = 1; c.stroke();
      c.fillStyle = '#e8fbff'; aCirc(c, d.x, d.y, r * .5); c.fill();
    } else drawKoban(c, d.x, d.y, 5, 7, Math.abs(Math.cos(d.ph)) * .8 + .2, d.ph);
  }
  if (sk('aura')) { // 金剛氣：菱形紋的範圍圈
    const v = SKV.aura(sk('aura'));
    c.strokeStyle = 'rgba(154,216,255,.3)'; c.lineWidth = 2; aCirc(c, px, py, v.r); c.stroke();
    c.fillStyle = 'rgba(190,230,255,.55)';
    for (let i = 0; i < 8; i++) { const a = g.t * .8 + i / 8 * TAU, ax = px + Math.cos(a) * v.r, ay = py + Math.sin(a) * v.r; c.beginPath(); c.moveTo(ax, ay - 4); c.lineTo(ax + 2.5, ay); c.lineTo(ax, ay + 4); c.lineTo(ax - 2.5, ay); c.fill(); }
  }
  if (g.barrier > 0) { // 結界：泡泡＋外圈符文
    const pu = Math.sin(g.t * 6);
    const bg2 = c.createRadialGradient(px - 8, py - 12, 4, px, py - 4, 30); bg2.addColorStop(0, 'rgba(230,248,255,.35)'); bg2.addColorStop(1, 'rgba(154,216,255,.08)');
    c.fillStyle = bg2; aCirc(c, px, py - 4, 28); c.fill();
    c.strokeStyle = `rgba(154,216,255,${.65 + .2 * pu})`; c.lineWidth = 2.5; c.stroke();
    c.save(); c.translate(px, py - 4); c.rotate(g.t * .8); c.strokeStyle = 'rgba(200,235,255,.6)'; c.lineWidth = 1;
    for (let i = 0; i < 6; i++) { c.rotate(TAU / 6); c.beginPath(); c.moveTo(24, -3); c.lineTo(30, 0); c.lineTo(24, 3); c.stroke(); }
    c.restore();
    if (g.barrier > 1) { c.strokeStyle = 'rgba(255,220,120,.7)'; c.lineWidth = 2; aCirc(c, px, py - 4, 33); c.stroke(); }
  }
  if (sk('kunai')) { // 苦無環
    const v = SKV.kunai(sk('kunai')), evo = sk('kunai') > SK_MAX;
    for (let i = 0; i < v.n; i++) {
      const a = (S.kunA || 0) + i * TAU / v.n;
      drawKunai(c, px + Math.cos(a) * v.r, py + Math.sin(a) * v.r, a + Math.PI / 2, evo ? 1.5 : 1.1, false);   // 刀尖朝旋轉方向
    }
  }
  for (const b of g.blades) { // 風刃：月牙形，帶殘影
    const a = Math.atan2(b.vy, b.vx);
    c.save(); c.translate(b.x, b.y); c.rotate(a); c.globalAlpha = Math.max(0, 1 - b.t / 2);
    for (let i = 2; i >= 0; i--) {
      c.beginPath(); c.arc(-b.size * .4 - i * 6, 0, b.size, -1.1, 1.1); c.arc(-b.size * .75 - i * 6, 0, b.size * .85, .95, -.95, true); c.closePath();
      c.fillStyle = i ? `rgba(140,230,190,${.25 / i})` : 'rgba(230,255,244,.95)'; c.fill();
    }
    c.restore();
  }
  c.globalAlpha = 1;
  for (const o of g.bolts) { // 雷（或式神鳥的啄擊線）
    const k = 1 - o.t / .25;
    if (o.fx != null) { c.globalAlpha = k; c.strokeStyle = o.zap ? '#fff59a' : '#ffffff'; c.lineWidth = 2; c.beginPath(); c.moveTo(o.fx, o.fy); c.lineTo(o.x, o.y); c.stroke(); c.globalAlpha = 1; continue; }
    const pts = []; let y = g.camY - 10, x = o.x + rnd(-20, 20); pts.push([x, y]);
    while (y < o.y) { y += 26; x = o.x + (y < o.y ? rnd(-16, 16) : 0); pts.push([x, Math.min(y, o.y)]); }
    for (const [lw, col] of [[10, `rgba(255,240,120,${.25 * k})`], [5, `rgba(255,245,160,${.8 * k})`], [2, `rgba(255,255,255,${k})`]]) {
      c.strokeStyle = col; c.lineWidth = lw; c.lineJoin = 'round'; c.beginPath(); pts.forEach(([a, b2], i) => i ? c.lineTo(a, b2) : c.moveTo(a, b2)); c.stroke();
    }
    const fl = c.createRadialGradient(o.x, o.y, 2, o.x, o.y, 24); fl.addColorStop(0, `rgba(255,255,220,${k})`); fl.addColorStop(1, 'rgba(255,240,120,0)');
    c.fillStyle = fl; aCirc(c, o.x, o.y, 24); c.fill();
  }
  if (sk('shiki')) { // 式神鳥：白色紙鶴，拍翅
    const evo = sk('shiki') > SK_MAX, a = S.biA || 0, bx = px + Math.cos(a) * 30, by = py - 34 + Math.sin(a * 2) * 6, fl = Math.sin(g.t * 18) * 6;
    c.save(); c.translate(bx, by); if (evo) c.scale(1.4, 1.4);
    if (evo) { c.fillStyle = 'rgba(255,210,90,.35)'; aCirc(c, 0, 0, 12); c.fill(); }
    c.beginPath(); c.moveTo(-10, -fl); c.lineTo(0, 2); c.lineTo(10, -fl); c.lineTo(0, -2); c.closePath(); aFI(c, evo ? '#1a1a22' : '#ffffff', 1.2);
    c.beginPath(); c.moveTo(0, -2); c.lineTo(6, -5); c.lineTo(2, 1); c.closePath(); aFI(c, evo ? '#1a1a22' : '#ffffff', 1);
    c.fillStyle = evo ? '#ffd25a' : '#d8323c'; aCirc(c, 4.5, -4.2, 1); c.fill();
    c.restore();
  }
  if (typeof drawCharSkillFx === 'function') drawCharSkillFx();   // 角色專屬技能（chars.js）
}

// ===== 攻擊物與特效 =====
function drawPlayerShot(s) {
  const c = ctx;
  if (!s.pierce) { c.strokeStyle = 'rgba(255,255,255,.25)'; c.lineWidth = 3; c.beginPath(); c.arc(s.cx, s.cy, 9, s.t * 20, s.t * 20 + 1.6); c.stroke(); }
  const sc = s.pierce ? 2.4 : 1;
  c.save(); c.translate(s.cx, s.cy); c.scale(sc, sc);
  if (s.pierce) { c.fillStyle = 'rgba(255,220,120,.35)'; aCirc(c, 0, 0, 9); c.fill(); }
  drawStar4(c, 0, 0, 6, s.t * 20, s.pierce ? '#ffe9a0' : '#dfe4ec');
  c.restore();
}
function drawEShot(s) {
  const c = ctx;
  if (s.kind === 'arrow' || s.kind === 'kunai') {
    c.save(); c.translate(s.x, s.y); c.rotate(Math.atan2(s.vy, s.vx));
    if (s.kind === 'arrow') {
      c.strokeStyle = INK; c.lineWidth = 3.5; c.beginPath(); c.moveTo(-13, 0); c.lineTo(8, 0); c.stroke();
      c.strokeStyle = '#c8a060'; c.lineWidth = 2; c.stroke();
      c.fillStyle = '#ffffff'; for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(-13, 0); c.lineTo(-17, sd * 4); c.lineTo(-9, sd * 1); c.closePath(); c.fill(); }
      c.beginPath(); c.moveTo(13, 0); c.lineTo(6, -4); c.lineTo(6, 4); c.closePath(); aFI(c, '#cfd6e2', 1.2);
    } else { c.fillStyle = 'rgba(255,80,80,.35)'; aCirc(c, 4, 0, 7); c.fill(); drawKunai(c, -2, 0, 0, 1.2, false); }
    c.restore(); return;
  }
  if (s.kind === 'web') { // 黏答答的蛛絲球
    c.save(); c.translate(s.x, s.y); c.rotate(s.t * 2);
    c.fillStyle = 'rgba(240,240,250,.35)'; aCirc(c, 0, 0, 8); c.fill();
    c.strokeStyle = 'rgba(245,245,255,.9)'; c.lineWidth = 1.2;
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 4; c.beginPath(); c.moveTo(-Math.cos(a) * 11, -Math.sin(a) * 11); c.lineTo(Math.cos(a) * 11, Math.sin(a) * 11); c.stroke(); }
    for (const r of [4, 8]) { c.beginPath(); for (let i = 0; i <= 8; i++) { const a = i * Math.PI / 4; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.stroke(); }
    c.restore(); return;
  }
  // 敵人的手裡劍：黑色、紅色邊光
  c.save(); c.translate(s.x, s.y);
  c.fillStyle = 'rgba(255,60,60,.3)'; aCirc(c, 0, 0, 12); c.fill();
  c.rotate(s.t * 18);
  c.beginPath(); for (let i = 0; i < 8; i++) { const r = i % 2 ? 3 : 9.5, a = i * Math.PI / 4; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.closePath();
  c.fillStyle = '#26262e'; c.fill(); c.strokeStyle = '#ff5a5a'; c.lineWidth = 1.6; c.stroke();
  aCirc(c, 0, 0, 1.6); c.fillStyle = '#ff5a5a'; c.fill();
  c.restore();
}
// 斬痕：白色刀光＋淡紅殘光
function drawSlashFx(o) {
  const c = ctx, k = o.t / .3, L = 50 + o.t * 140;
  c.save(); c.translate(o.x, o.y); c.rotate(o.a);
  c.globalAlpha = (1 - k) * .55; c.fillStyle = '#ff6a5a'; c.beginPath(); c.moveTo(-L * 1.05, 2); c.lineTo(0, -5); c.lineTo(L * 1.05, 2); c.lineTo(0, 6); c.fill();
  c.globalAlpha = 1 - k; const gr = c.createLinearGradient(-L, 0, L, 0); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(.5, '#ffffff'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = gr; c.beginPath(); c.moveTo(-L, 0); c.lineTo(0, -3.5); c.lineTo(L, 0); c.lineTo(0, 3.5); c.fill();
  c.restore();
}
// 爆炸／衝擊波：依顏色分成火球、白色衝擊波、藍色結界擋下
function drawBoom(o) {
  const c = ctx, k = o.t / .4, r = o.r * (.3 + .7 * k);
  c.save();
  if (o.c === '#ff8a3a') {
    const fb = c.createRadialGradient(o.x, o.y, 0, o.x, o.y, r);
    fb.addColorStop(0, `rgba(255,255,220,${1 - k})`); fb.addColorStop(.35, `rgba(255,200,80,${.9 * (1 - k)})`); fb.addColorStop(.7, `rgba(255,110,30,${.7 * (1 - k)})`); fb.addColorStop(1, 'rgba(120,30,10,0)');
    c.fillStyle = fb; aCirc(c, o.x, o.y, r); c.fill();
    c.globalAlpha = (1 - k) * .7; c.fillStyle = '#4a3a38';
    for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + o.x; aCirc(c, o.x + Math.cos(a) * r * .8, o.y + Math.sin(a) * r * .8 - k * 12, r * .22); c.fill(); }
    c.globalAlpha = 1 - k; c.strokeStyle = '#ffd27a'; c.lineWidth = 4 * (1 - k) + 1; aCirc(c, o.x, o.y, r * 1.05); c.stroke();
  } else {
    c.globalAlpha = 1 - k; c.strokeStyle = o.c; c.lineWidth = 7 * (1 - k) + 1; aCirc(c, o.x, o.y, r); c.stroke();
    c.lineWidth = 2; c.globalAlpha = (1 - k) * .6; aCirc(c, o.x, o.y, r * .75); c.stroke();
    if (o.c === '#ffffff') { c.fillStyle = 'rgba(230,220,200,.6)'; for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; aCirc(c, o.x + Math.cos(a) * r, o.y + Math.sin(a) * r * .5, 4 * (1 - k) + 1); c.fill(); } }
  }
  c.restore();
}
// 粒子：圓形，越往後越淡
function drawParts() {
  const c = ctx;
  for (const o of g.parts) { c.globalAlpha = clamp(o.life / o.max, 0, 1); c.fillStyle = o.c; aCirc(c, o.x, o.y, o.s * .6); c.fill(); }
  c.globalAlpha = 1;
}

// ===== 主角（程式繪圖）：「豆丁浮空」風格 =====
// 頭身比約 1:1 的超 Q 版；手套與鞋子浮在身體旁邊，沒有手臂和腿，所以不會出現關節接縫。
// 畫法：所有形狀先畫一圈黑色外輪廓、再整批填色（silhouette），內部不會有交疊的描邊線。
// 原點在腳底、面向右（+x）；依速度與狀態切換姿勢：上升、頂點、下落、衝刺斬、急降斬、飛行、受傷
const HERO_POSE = {
  up:   { fa: [16, -44], ba: [-12, -16], ff: [7, -6], bf: [-5, 1], eye: 'open', vy: -1 },
  apex: { fa: [15, -28], ba: [-14, -26], ff: [6, 0], bf: [-6, -1], eye: 'open', vy: 0 },
  fall: { fa: [17, -40], ba: [-16, -38], ff: [5, 3], bf: [-5, 3], eye: 'open', vy: 1 },
  dash: { fa: [19, -25], ba: [-14, -20], ff: [3, -6], bf: [-14, -4], eye: 'focus', vy: 0, dash: 1 },
  dive: { fa: [15, -20], ba: [13, -18], ff: [-11, -12], bf: [-15, -6], eye: 'focus', vy: 0, dive: 1 },
  fly:  { fa: [21, -34], ba: [-21, -34], ff: [3, 1], bf: [-3, 1], eye: 'happy', vy: -1, fly: 1 },
  hurt: { fa: [19, -42], ba: [-16, -40], ff: [9, 1], bf: [-9, 1], eye: 'hurt', vy: 0 },
};
function heroPoseOf(o) {
  if (o.hurt > 0) return 'hurt';
  if (o.fly) return 'fly';
  if (o.dash) return 'dash';
  if (o.dive) return 'dive';
  if (o.vy < -250) return 'up';
  if (o.vy > 150) return 'fall';
  return 'apex';
}
// 把顏色調亮（頭部漸層的亮面用）
function heroLighten(hex, k) {
  const n = parseInt(hex.slice(1), 16), r = n >> 16, g2 = (n >> 8) & 255, b = n & 255, f = v => Math.round(v + (255 - v) * k);
  return `rgb(${f(r)},${f(g2)},${f(b)})`;
}
// 兩段式：先畫所有形狀的黑色外輪廓，再全部填色
function heroSilhouette(c, parts, ol) {
  c.save(); c.lineJoin = 'round'; c.lineCap = 'round';
  for (const p of parts) { p.path(c); c.fillStyle = INK; c.fill(); c.strokeStyle = INK; c.lineWidth = ol * 2; c.stroke(); }
  for (const p of parts) { p.path(c); c.fillStyle = p.fill; c.fill(); if (p.after) p.after(c); }
  c.restore();
}
// 圍巾：沿速度反方向飄、帶波浪，尾端剪成燕尾
function heroScarf(c, ax, ay, dir, len, wd, t, ph) {
  const dl = Math.hypot(dir[0], dir[1]), dx = dir[0] / dl, dy = dir[1] / dl, px = -dy, py = dx, L = [], R = [], N = 10;
  for (let i = 0; i <= N; i++) {
    const s = i / N, wv = Math.sin(t * 9 - s * 5 + ph) * 5 * s, bx = ax + dx * len * s + px * wv, by = ay + dy * len * s + py * wv, w2 = wd * (1 - s * .5) / 2;
    L.push([bx + px * w2, by + py * w2]); R.push([bx - px * w2, by - py * w2]);
  }
  c.beginPath(); L.forEach(([a, b], i) => i ? c.lineTo(a, b) : c.moveTo(a, b));
  c.lineTo(L[N][0] + dx * 4, L[N][1] + dy * 4);
  for (let i = R.length - 1; i >= 0; i--) c.lineTo(R[i][0], R[i][1]); c.closePath();
}
// 大眼睛：漸層瞳孔＋兩個亮點；開心 ^^、受傷 ><、專注時瞇眼、眨眼
function heroEye(c, x, y, rx, ry, mood) {
  c.strokeStyle = INK; c.lineCap = 'round'; c.lineWidth = 1.7;
  if (mood === 'blink') { c.beginPath(); c.moveTo(x - rx, y + ry * .2); c.quadraticCurveTo(x, y + ry * .5, x + rx, y + ry * .2); c.stroke(); return; }
  if (mood === 'happy') { c.beginPath(); c.arc(x, y + ry * .4, rx, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); return; }
  if (mood === 'hurt') { c.beginPath(); c.moveTo(x - rx, y - ry * .6); c.lineTo(x + rx * .7, y); c.lineTo(x - rx, y + ry * .6); c.stroke(); return; }
  const sy = mood === 'focus' ? .6 : 1;
  aEll(c, x, y, rx, ry * sy); c.fillStyle = '#fff'; c.fill(); c.lineWidth = 1.2; c.stroke();
  c.save(); aEll(c, x, y, rx, ry * sy); c.clip();
  aEll(c, x + rx * .25, y + ry * .1, rx * .78, ry * .82);
  const gr = c.createLinearGradient(0, y - ry, 0, y + ry); gr.addColorStop(0, '#1a0f0a'); gr.addColorStop(1, '#a0441c'); c.fillStyle = gr; c.fill();
  aCirc(c, x + rx * .3, y + ry * .1, rx * .35); c.fillStyle = '#0a0606'; c.fill();
  aCirc(c, x - rx * .1, y - ry * .35, rx * .32); c.fillStyle = '#fff'; c.fill();
  aCirc(c, x + rx * .45, y + ry * .45, rx * .14); c.fill();
  c.restore();
}
function heroKatana(c, x, y, a) {
  c.save(); c.translate(x, y); c.rotate(a);
  c.beginPath(); c.moveTo(1, -1.7); c.quadraticCurveTo(17, -3.4, 32, -.6); c.lineTo(30, 1.5); c.quadraticCurveTo(16, .5, 1, 1.7); c.closePath();
  const bg = c.createLinearGradient(0, -2, 0, 2); bg.addColorStop(0, '#ffffff'); bg.addColorStop(1, '#a8b2c0'); c.fillStyle = bg; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.1; c.stroke();
  c.fillStyle = '#d9a441'; c.fillRect(-1.5, -3.2, 2.6, 6.4); c.fillStyle = '#3a2a40'; c.fillRect(-9, -1.7, 8, 3.4);
  c.restore();
}
// 主角比例：頭的半徑與高度、身體上下緣與寬度、手腳的位置。改這組數字就能調整頭身比
// （遊戲使用「大福」；now 是之前的比例，其餘為提案，可用 design/hero-proportions.html 比較）
const HERO_PROPS = {
  now:   { hr: 19, hy: -40, bt: -24, bb: -5, bw: 1,    hcy: -22, hk: .7,  hx: .82, fy: 1,  fx: .8,  fs: 1,   gl: 1,   pivot: -30 },
  round: { hr: 19, hy: -33, bt: -17, bb: -4, bw: 1.18, hcy: -12, hk: .45, hx: .78, fy: 0,  fx: .62, fs: .9,  gl: .9,  pivot: -24 },  // 圓滾滾
  mochi: { hr: 21, hy: -30, bt: -12, bb: -3, bw: .9,   hcy: -8,  hk: .35, hx: .72, fy: 0,  fx: .5,  fs: .78, gl: .78, pivot: -24 },  // 大福（頭最大）
  egg:   { hr: 18, hy: -31, bt: -20, bb: -1, bw: 1.45, hcy: -11, hk: .38, hx: .9,  fy: 1,  fx: .55, fs: .8,  gl: .85, pivot: -22 },  // 蛋形一體
};
let HERO_PROP = HERO_PROPS.mochi;   // 使用中的比例：大福（頭最大）
function drawHeroNinja(x, y, o, c = ctx, PR = HERO_PROP) {
  const sk = o.pal || heroPal(o.skin || 0), t = o.t || 0, vy = o.vy || 0;   // 顏色＝這名角色目前的換裝（o.pal 可指定，商店預覽用）
  const flash = o.hurt > 0 && ((t * 20) | 0) % 2;
  const C = flash ? { suit: '#ff6a5a', dk: '#c03a30', lt: '#ffb0a0', band: '#ffd0c8', skin: '#ffc4b4' }
    : { suit: sk.suit, dk: sk.dark, lt: heroLighten(sk.suit, .35), band: sk.band, skin: '#f9d8b4' };
  const pn = o.pose || heroPoseOf(o), Q = HERO_POSE[pn], cy = y + PR.pivot;
  const k = PR.hr / 19, HY = PR.hy, BT = PR.bt, BB = PR.bb, BW = PR.bw;
  // 往上衝很快時，身後拉出速度線
  if (vy < -700 && !o.dash && !o.dive) {
    c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 1.5;
    for (let i = 0; i < 3; i++) { const lx = x + (i - 1) * 12 + Math.sin(t * 30 + i) * 2, l = 14 + ((t * 90 + i * 17) % 18); c.beginPath(); c.moveTo(lx, y); c.lineTo(lx, y + l); c.stroke(); }
  }
  c.save(); c.translate(x, cy);
  if (o.inv > 0 && !o.fly && !(o.hurt > 0) && ((t * 16) | 0) % 2) c.globalAlpha *= .4;
  let rot;
  if (o.dash) rot = Math.atan2(o.dvy || 0, Math.abs(o.dvx || 1)) * .55;
  else if (o.dive) rot = 1.25;
  else if (o.fly) rot = -.3 + Math.sin(t * 9) * .06;
  else if (o.hurt > 0) rot = -.5 * (o.hurt / .4);
  else rot = clamp(vy / 2600, -.18, .25);
  if (o.spin > 0) rot += (1 - o.spin / .45) * TAU;
  const sq = o.sq || 0, st = o.dash || o.fly ? .1 : clamp(-vy / 2600, -.08, .1);
  c.scale(o.face || 1, 1); c.rotate(rot); c.scale(1 + sq * .22 - st, 1 - sq * .22 + st);
  c.translate(0, -PR.pivot);   // 之後以腳底為原點
  if (o.fly) { // 豪天翔：金色旋風
    c.lineCap = 'round';
    for (let i = 0; i < 3; i++) { const a = t * 6 + i * 2.1; c.strokeStyle = `rgba(255,214,90,${.6 - i * .14})`; c.lineWidth = 3 - i * .6; c.beginPath(); c.ellipse(0, (HY + BB) / 2, 28 + i * 5, 15 + i * 3, -.3, a, a + 2.4); c.stroke(); }
  }
  // 其他角色（chars.js）：同樣的旋轉、壓扁、受傷閃紅，只換成各自的造型
  const CD = typeof CHAR_DRAW !== 'undefined' && CHAR_DRAW[(SKINS[o.skin || 0] || {}).id];
  if (CD) {
    const mood = o.eye || (pn === 'apex' && ((t * .9) % 3.4) < .12 ? 'blink' : Q.eye);
    CD(c, { suit: C.suit, dark: C.dk, band: C.band }, t, { eye: mood });
    if (Q.dash || Q.dive) heroKatana(c, 16, -18, Q.dash ? -.08 : .35);
  } else {
  // 浮在身體旁的手腳：以身體附近的點為基準，依姿勢偏移，並隨呼吸上下浮動
  const bob = Math.sin(t * 6) * 1.5;
  const hand = (p, s) => [p[0] * PR.hx * (p[0] > 0 ? 1 : 1) + (p[0] > 0 ? 1 : -1) * (BW - 1) * 6, PR.hcy + (p[1] + 22) * PR.hk + s * bob];
  const foot = p => [p[0] * PR.fx, Math.min(PR.fy + 1, p[1] * .9 * PR.fs + PR.fy)];
  const fa = hand(Q.fa, -1), ba = hand(Q.ba, 1), ff = foot(Q.ff), bf = foot(Q.bf);
  const sdir = Q.dash ? [-1, .15] : Q.fly ? [-1, .9] : Q.vy < 0 ? [-1, 1] : Q.vy > 0 ? [-1, -.8] : [-1, .25];
  const drawn = Q.dash || Q.dive, GR = 4.8 * PR.gl, FR = [5.2 * PR.fs, 3.6 * PR.fs];
  const parts = [];
  parts.push({ path: c => heroScarf(c, -6 * BW, BT, sdir, 24 * k, 8 * k, t, 0), fill: C.band });
  parts.push({ path: c => aCirc(c, ba[0], ba[1], GR * .95), fill: C.dk });   // 後手套
  parts.push({ path: c => aEll(c, bf[0], bf[1], FR[0], FR[1]), fill: C.dk });  // 後鞋
  // 豆子形的小身體＋腰帶
  const bh = BB - BT, wTop = 8 * BW, wMid = 11 * BW, wBot = 6 * BW, belt = BT + bh * .53;
  parts.push({ path: c => { c.beginPath(); c.moveTo(-wTop, BT); c.quadraticCurveTo(0, BT - 4, wTop, BT); c.quadraticCurveTo(wMid, BT + bh * .63, wBot, BB - 1); c.quadraticCurveTo(0, BB + 2, -wBot, BB - 1); c.quadraticCurveTo(-wMid, BT + bh * .63, -wTop, BT); c.closePath(); }, fill: C.suit,
    after: c => { c.save(); c.clip(); c.fillStyle = '#1e1e26'; c.fillRect(-wMid - 2, belt, wMid * 2 + 4, 3.4); c.fillStyle = C.band; c.fillRect(-2, belt - .5, 4, 4.4); c.restore(); } });
  parts.push({ path: c => aEll(c, ff[0], ff[1], FR[0], FR[1]), fill: C.dk });  // 前鞋
  // 大頭（兜帽尖＋腦後頭巾結，和頭一起描邊）
  const knot = Math.sin(t * 9) * 2, R = PR.hr;
  parts.push({ path: c => { c.beginPath(); c.arc(0, HY, R, 0, TAU);
      c.moveTo(-14 * k, HY - 12 * k); c.quadraticCurveTo(-26 * k, HY - 24 * k, -10 * k, HY - 21 * k); c.closePath();
      c.moveTo(-17 * k, HY - 6 * k); c.quadraticCurveTo(-26 * k, HY - 4 * k + knot, -28 * k, HY + 2 * k); c.quadraticCurveTo(-22 * k, HY - 2 * k, -17 * k, HY); c.closePath(); }, fill: C.suit,
    after: c => { c.save(); c.beginPath(); c.arc(0, HY, R, 0, TAU); c.clip();
      const gr = c.createRadialGradient(-6 * k, HY - 12 * k, 3, 0, HY, R * 1.16); gr.addColorStop(0, C.lt); gr.addColorStop(.6, C.suit); gr.addColorStop(1, C.dk); c.fillStyle = gr; c.fillRect(-R - 1, HY - R - 1, R * 2 + 2, R * 2 + 2);
      c.fillStyle = C.band; c.fillRect(-R - 1, HY - 15 * k, R * 2 + 2, 5.5 * k); c.restore(); } });
  parts.push({ path: c => aCirc(c, fa[0], fa[1], GR), fill: C.dk });          // 前手套
  heroSilhouette(c, parts, 1.8);
  // 臉：面罩開口、超大眼睛、腮紅、護額
  aEll(c, 4 * k, HY + 3 * k, 14 * k, 8.5 * k); c.fillStyle = C.skin; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.4; c.stroke();
  const mood = o.eye || (pn === 'apex' && ((t * .9) % 3.4) < .12 ? 'blink' : Q.eye);   // o.eye 可指定眼神（開場特寫用）
  heroEye(c, -2 * k, HY + 2.5 * k, 4 * k, 5.6 * k, mood); heroEye(c, 10 * k, HY + 2.5 * k, 4.3 * k, 5.9 * k, mood);
  c.fillStyle = 'rgba(255,120,120,.45)'; aEll(c, -6 * k, HY + 7.5 * k, 2.6 * k, 1.4 * k); c.fill(); aEll(c, 15 * k, HY + 7.5 * k, 2.6 * k, 1.4 * k); c.fill();
  c.beginPath(); if (c.roundRect) c.roundRect(-4 * k, HY - 17 * k, 12 * k, 6 * k, 2); else c.rect(-4 * k, HY - 17 * k, 12 * k, 6 * k);
  c.fillStyle = '#dfe4ec'; c.fill(); c.strokeStyle = INK; c.lineWidth = 1; c.stroke();
  c.fillStyle = C.suit; c.font = `900 ${5 * k}px sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('鳶', 2 * k, HY - 13.8 * k);
  // 刀：衝刺斬／急降斬時握在手上，其餘背在背後
  if (drawn) heroKatana(c, fa[0], fa[1], Q.dash ? -.08 : .35);
  else { c.save(); c.translate(-9 * BW, BT + 8); c.rotate(-2.3); c.fillStyle = '#2a1c18'; c.fillRect(-2, -6, 4, 18); c.strokeStyle = INK; c.lineWidth = 1.2; c.strokeRect(-2, -6, 4, 18); c.fillStyle = '#d9a441'; c.fillRect(-2.6, -7.5, 5.2, 2); c.restore(); }
  }
  c.restore();
  const top = y + HY - PR.hr - 4;
  if (o.freeze > 0) { // 冰凍：半透明冰塊
    c.save(); c.globalAlpha = .5; c.fillStyle = '#bdeaff'; c.beginPath(); if (c.roundRect) c.roundRect(x - 25, top, 50, y - top + 3, 8); else c.rect(x - 25, top, 50, y - top + 3); c.fill();
    c.globalAlpha = .9; c.strokeStyle = '#ffffff'; c.lineWidth = 2; c.stroke(); c.restore();
  }
  if (o.slow > 0) { c.strokeStyle = '#c58aff'; c.lineWidth = 2; c.beginPath(); c.arc(x, (y + top) / 2, 32, t * 6, t * 6 + 4); c.stroke(); }
}
// 主角背影（斬擊特寫用）：從背後看到的大頭、頭巾結與飄動的布條、小身體；右手握刀，ang = 刀身方向（弧度）
// 原點在腳底；比例與正面的「大福」相同
function drawHeroBack(c, x, y, s, ang, t, skin = 0, from = null, trail = 0) {   // from＋trail：從 from 揮到 ang 的刀光（trail 是透明度）
  const sk = heroPal(skin), PR = HERO_PROP, R = PR.hr, HY = PR.hy, BT = PR.bt, BB = PR.bb;
  const C = { suit: sk.suit, dk: sk.dark, lt: heroLighten(sk.suit, .35), band: sk.band };
  c.save(); c.translate(x, y); c.scale(s, s);
  const sx = 4, sy = HY + 12;                                   // 右肩（握刀的手繞著它轉）
  const hx = sx + Math.cos(ang) * 17, hy = sy + Math.sin(ang) * 17;
  // 刀光殘影（揮刀的弧線）
  if (trail > 0 && from !== null) {
    c.save(); c.globalAlpha *= trail; c.fillStyle = 'rgba(255,255,255,.85)';
    const a0 = from;
    c.beginPath(); c.arc(sx, sy, 58, Math.min(a0, ang), Math.max(a0, ang)); c.arc(sx, sy, 30, Math.max(a0, ang), Math.min(a0, ang), true); c.closePath(); c.fill();
    c.restore();
  }
  const fw = Math.sin(t * 14) * 3;
  // 其他角色：用 chars.js 的背影（髮型、兜帽、斗笠等），手、腳、身體共用
  const CB = typeof CHAR_BACK !== "undefined" && CHAR_BACK[(SKINS[skin] || {}).id];
  if (CB) {
    const P = { suit: C.suit, dark: C.dk, band: C.band };
    if (CB.pre) CB.pre(c, P, t);
    heroSilhouette(c, [
      { path: c => aCirc(c, -15, sy + 10, 4.6), fill: C.dk },
      { path: c => aEll(c, -5, -1, 5, 3.4), fill: C.dk }, { path: c => aEll(c, 5, -1, 5, 3.4), fill: C.dk },
      { path: c => { c.beginPath(); c.moveTo(-8, BT); c.quadraticCurveTo(0, BT - 4, 8, BT); c.quadraticCurveTo(10, BT + 6, 6, BB); c.quadraticCurveTo(0, BB + 2, -6, BB); c.quadraticCurveTo(-10, BT + 6, -8, BT); c.closePath(); }, fill: C.suit,
        after: c => { c.save(); c.clip(); c.fillStyle = "#1e1e26"; c.fillRect(-12, BT + 4, 24, 3); c.restore(); } },
    ], 1.8);
    CB.head(c, P, t);
  } else {
  heroSilhouette(c, [
    { path: c => { c.beginPath(); c.moveTo(-3, HY + 6); c.quadraticCurveTo(-14, HY + 22 + fw, -10, HY + 38 + fw); c.lineTo(-4, HY + 36 + fw); c.quadraticCurveTo(-6, HY + 22, 2, HY + 8); c.closePath(); }, fill: C.band },   // 圍巾尾
    { path: c => aCirc(c, -15, sy + 10, 4.6), fill: C.dk },                                                     // 左手套
    { path: c => aEll(c, -5, -1, 5, 3.4), fill: C.dk }, { path: c => aEll(c, 5, -1, 5, 3.4), fill: C.dk },       // 鞋
    { path: c => { c.beginPath(); c.moveTo(-8, BT); c.quadraticCurveTo(0, BT - 4, 8, BT); c.quadraticCurveTo(10, BT + 6, 6, BB); c.quadraticCurveTo(0, BB + 2, -6, BB); c.quadraticCurveTo(-10, BT + 6, -8, BT); c.closePath(); }, fill: C.suit,
      after: c => { c.save(); c.clip(); c.fillStyle = '#1e1e26'; c.fillRect(-12, BT + 4, 24, 3); c.restore(); } },
    { path: c => { c.beginPath(); c.arc(0, HY, R, 0, TAU); c.moveTo(-6, HY - R + 2); c.quadraticCurveTo(0, HY - R - 10, 7, HY - R + 2); c.closePath(); }, fill: C.suit,   // 頭＋兜帽尖
      after: c => { c.save(); c.beginPath(); c.arc(0, HY, R, 0, TAU); c.clip();
        const gr = c.createRadialGradient(-7, HY - 10, 3, 0, HY, R * 1.15); gr.addColorStop(0, C.lt); gr.addColorStop(.6, C.suit); gr.addColorStop(1, C.dk); c.fillStyle = gr; c.fillRect(-R - 1, HY - R - 1, R * 2 + 2, R * 2 + 2);
        c.fillStyle = C.band; c.fillRect(-R - 1, HY - 8, R * 2 + 2, 6); c.restore(); } },
  ], 1.8);
  // 頭巾結與兩條飄動的布條（背影最明顯的特徵）
  for (const i of [0, 1]) {   // 兩條布條一起往左後方飄（衝刺時迎風）
    const w = Math.sin(t * 13 + i * 1.7) * 3, ex = -18 - i * 7, ey = HY - 8 + i * 9 + w;
    c.beginPath(); c.moveTo(-1, HY - 7); c.quadraticCurveTo(ex * .5, HY - 10 + i * 4 + w, ex, ey); c.lineTo(ex + 2, ey + 4.5); c.quadraticCurveTo(ex * .45, HY - 4 + i * 4 + w, 0, HY - 3); c.closePath(); aFI(c, C.band, 1.4);
  }
  aCirc(c, 0, HY - 5, 3.4); aFI(c, C.band, 1.4);
  }
  // 刀與握刀的手
  c.save(); c.translate(hx, hy); c.rotate(ang);
  c.beginPath(); c.moveTo(4, -2); c.quadraticCurveTo(26, -4, 46, -.5); c.lineTo(44, 2); c.quadraticCurveTo(24, 1, 4, 2); c.closePath();
  const bg = c.createLinearGradient(0, -3, 0, 3); bg.addColorStop(0, '#ffffff'); bg.addColorStop(1, '#a8b2c0'); c.fillStyle = bg; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.2; c.stroke();
  c.fillStyle = '#d9a441'; c.fillRect(2, -3.4, 2.6, 6.8); c.fillStyle = '#3a2a40'; c.fillRect(-7, -1.8, 9, 3.6);
  c.restore();
  aCirc(c, hx, hy, 5); aFI(c, C.dk, 1.8);
  c.restore();
}
// 標題大圖與商店頭像：在獨立畫布上畫一張大的主角
function heroPortrait(skin, size) {
  const cnv = document.createElement('canvas'); cnv.width = cnv.height = size;
  const c = cnv.getContext('2d'), k = size / 84;
  c.scale(k, k);
  drawHeroNinja(42, 74, { face: 1, t: .35, vy: 0, skin }, c);   // 頂點姿勢：雙手張開、臉清楚
  return cnv;
}

// ===== 魔王（新版造型：和主角同樣的大頭小身體＋浮空拳腳，四隻輪廓各不相同） =====
// 真妖鬼：圓壯的赤鬼大將／怠惰鬼：躺在雲上喝酒抽菸管的醉鬼／雪女鬼：細長的雪姬／鐵甲鬼：方正的鎧武者
let BOSS_STYLE = 'new';   // 遊戲使用新造型；'old' 是舊的圓球版（比較頁用）
function aRR(c, x, y, w, h, r) { c.beginPath(); if (c.roundRect) c.roundRect(x, y, w, h, r); else c.rect(x, y, w, h); }
function bossBall(c, x, y, r, lt, mid, dk) { const gr = c.createRadialGradient(x - r * .35, y - r * .42, r * .08, x, y, r * 1.12); gr.addColorStop(0, lt); gr.addColorStop(.55, mid); gr.addColorStop(1, dk); return gr; }
// 魔王的大眼睛：漸層虹膜、亮點；slit 細長瞳孔、lid 上眼皮蓋住比例、glow 發光
function bossEye(c, x, y, rx, ry, iris, iris2, o = {}) {
  c.save();
  aEll(c, x, y, rx, ry); c.fillStyle = o.sclera || '#fff'; c.fill();
  c.save(); aEll(c, x, y, rx, ry); c.clip();
  aEll(c, x + rx * .1, y + ry * .1, rx * .76, ry * .82);
  const gr = c.createLinearGradient(0, y - ry, 0, y + ry); gr.addColorStop(0, iris2); gr.addColorStop(1, iris); c.fillStyle = gr; c.fill();
  if (o.slit) aEll(c, x + rx * .1, y + ry * .1, rx * .14, ry * .64); else aCirc(c, x + rx * .1, y + ry * .1, rx * .34);
  c.fillStyle = '#0a0606'; c.fill();
  aCirc(c, x - rx * .2, y - ry * .3, rx * .26); c.fillStyle = '#fff'; c.fill();
  aCirc(c, x + rx * .42, y + ry * .42, rx * .11); c.fill();
  if (o.lid) { c.fillStyle = o.lidCol; c.fillRect(x - rx - 1, y - ry - 1, rx * 2 + 2, ry * 2 * o.lid + 1); }
  c.restore();
  aEll(c, x, y, rx, ry); c.strokeStyle = INK; c.lineWidth = 1.6; c.stroke();
  if (o.lid) { const ly = y - ry + ry * 2 * o.lid; c.beginPath(); c.moveTo(x - rx * 1.08, ly); c.quadraticCurveTo(x, ly + 1.6, x + rx * 1.08, ly); c.lineWidth = 2.4; c.lineCap = 'round'; c.stroke(); }
  if (o.glow) bossGlow(c, x, y, rx * 2.4, o.glow);
  c.restore();
}
function bossGlow(c, x, y, r, col) { c.save(); c.globalCompositeOperation = 'lighter'; const gg = c.createRadialGradient(x, y, 1, x, y, r); gg.addColorStop(0, col); gg.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = gg; aCirc(c, x, y, r); c.fill(); c.restore(); }

// ---- 手與腳 ----
// 拳頭：四個指節＋指縫＋橫過前面的拇指；o.claw 指節上的爪、o.cuff 腕環（o.spike 腕環上的尖刺）、o.plate 鐵手甲
function bossFist(c, x, y, r, col, dk, o = {}) {
  c.save(); c.translate(x, y); if (o.rot) c.rotate(o.rot); if (o.flip) c.scale(-1, 1);   // flip：拇指換到另一邊（左右手對稱）
  const parts = [];
  if (o.cuff) parts.push({ path: c => aRR(c, -r * .82, r * .6, r * 1.64, r * .72, r * .22), fill: o.cuff,
    after: c => { if (o.cuffLine) { c.save(); c.clip(); c.strokeStyle = o.cuffLine; c.lineWidth = 1.1; for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(i * r * .32, r * .6); c.lineTo(i * r * .32, r * 1.32); c.stroke(); } c.restore(); } } });
  parts.push({ path: c => { c.beginPath(); c.moveTo(-r * 1.02, -r * .2); for (let i = 0; i < 4; i++) c.arc(-r * .75 + r * .5 * i, -r * .4, r * .29, Math.PI * 1.05, -.05); c.lineTo(r * 1.02, r * .25); c.quadraticCurveTo(r * 1.02, r * 1.02, 0, r * 1.02); c.quadraticCurveTo(-r * 1.02, r * 1.02, -r * 1.02, r * .25); c.closePath(); }, fill: col });
  heroSilhouette(c, parts, 1.6);
  if (o.spike) for (let i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(i * r * .5 - r * .14, r * 1.32); c.lineTo(i * r * .5, r * 1.75); c.lineTo(i * r * .5 + r * .14, r * 1.32); c.closePath(); aFI(c, o.spike, 1); }
  c.strokeStyle = dk; c.lineWidth = 1.3; c.lineCap = 'round';
  for (let i = 1; i < 4; i++) { c.beginPath(); c.moveTo(-r + r * .5 * i, -r * .32); c.quadraticCurveTo(-r + r * .5 * i + r * .06, -r * .05, -r + r * .5 * i, r * .12); c.stroke(); }
  c.beginPath(); c.moveTo(-r * .85, r * .12); c.quadraticCurveTo(0, r * .26, r * .85, r * .12); c.stroke();
  if (o.plate) for (let i = 0; i < 4; i++) { aRR(c, -r * .95 + r * .5 * i, -r * .66, r * .4, r * .36, 1.5); aFI(c, o.plate, 1); c.fillStyle = '#e8ecf2'; aCirc(c, -r * .75 + r * .5 * i, -r * .48, r * .06); c.fill(); }
  if (o.claw) for (let i = 0; i < 4; i++) { const kx = -r * .75 + r * .5 * i; c.beginPath(); c.moveTo(kx - r * .13, -r * .62); c.quadraticCurveTo(kx, -r * .88, kx + r * .08, -r * .92); c.quadraticCurveTo(kx + r * .05, -r * .74, kx + r * .13, -r * .62); c.closePath(); aFI(c, '#fff6e0', 1); }
  c.save(); c.translate(-r * .38, r * .45); c.rotate(-.35); aEll(c, 0, 0, r * .46, r * .25); aFI(c, col, 1.5); aEll(c, r * .26, -r * .02, r * .12, r * .1); c.fillStyle = "rgba(255,255,255,.35)"; c.fill(); c.restore();   // 拇指（從一側彎過來）
  aEll(c, -r * .45, -r * .1, r * .22, r * .12, -.4); c.fillStyle = 'rgba(255,255,255,.28)'; c.fill();
  c.restore();
}
// 鬼的赤腳：腳掌＋三根腳趾與白爪，sd 腳尖朝向；o.ring 腳踝金環
function bossOniFoot(c, x, y, w, col, dk, sd, o = {}) {
  c.save(); c.translate(x, y); c.scale(sd, 1);
  const parts = [{ path: c => aEll(c, -w * .1, 0, w, w * .55), fill: col }];
  for (let i = 0; i < 3; i++) { const tx = w * .7, ty = -w * .3 + i * w * .3; parts.push({ path: c => aCirc(c, tx, ty, w * .26), fill: col }); }
  if (o.ring) parts.push({ path: c => aRR(c, -w * .75, -w * .95, w * .9, w * .4, w * .15), fill: o.ring });
  heroSilhouette(c, parts, 1.6);
  for (let i = 0; i < 3; i++) { const tx = w * .7 + w * .22, ty = -w * .3 + i * w * .3; c.beginPath(); c.moveTo(tx - w * .04, ty - w * .12); c.lineTo(tx + w * .24, ty); c.lineTo(tx - w * .04, ty + w * .12); c.closePath(); aFI(c, '#fff6e0', 1); }
  c.strokeStyle = dk; c.lineWidth = 1.2; c.beginPath(); c.moveTo(-w * .5, w * .2); c.quadraticCurveTo(0, w * .35, w * .4, w * .15); c.stroke();
  c.restore();
}
// 足袋＋草鞋／木屐：o.geta 木屐（否則草鞋）
function bossTabi(c, x, y, w, sd, o = {}) {
  c.save(); c.translate(x, y); c.scale(sd, 1); if (o.rot) c.rotate(o.rot);
  if (o.geta) { aRR(c, -w * .9, w * .48, w * 2, w * .32, 2); aFI(c, '#b07a40', 1.4); for (const gx of [-w * .5, w * .6]) { c.beginPath(); c.rect(gx - w * .12, w * .8, w * .24, w * .42); aFI(c, '#8a5a2a', 1.2); } }
  else { aRR(c, -w * .95, w * .42, w * 2.05, w * .26, 3); aFI(c, '#d8b46a', 1.4); }
  heroSilhouette(c, [{ path: c => { c.beginPath(); c.moveTo(-w * .8, -w * .6); c.lineTo(-w * .8, w * .5); c.lineTo(w * .9, w * .5); c.quadraticCurveTo(w * 1.1, w * .1, w * .75, -w * .05); c.lineTo(w * .2, -w * .1); c.lineTo(w * .2, -w * .6); c.closePath(); }, fill: '#f6f6fa' }], 1.4);
  c.strokeStyle = '#b8bcc8'; c.lineWidth = 1; c.beginPath(); c.moveTo(w * .6, 0); c.lineTo(w * .55, w * .45); c.stroke();
  c.strokeStyle = '#d8323c'; c.lineWidth = 2; c.beginPath(); c.moveTo(w * .55, w * .45); c.lineTo(w * .3, w * .1); c.moveTo(w * .55, w * .45); c.lineTo(w * .1, w * .3); c.stroke();   // 鼻緒
  c.restore();
}
// 鎧的腳：脛當＋甲掛（腳背的鐵片）＋紅色繫繩
function bossArmorFoot(c, x, y, w, I, ID, sd) {
  c.save(); c.translate(x, y); c.scale(sd, 1);
  heroSilhouette(c, [
    { path: c => aRR(c, -w * .55, -w * 1.1, w * 1.1, w * 1.05, 2.5), fill: I },
    { path: c => { c.beginPath(); c.moveTo(-w * .7, -w * .1); c.lineTo(w * .6, -w * .1); c.quadraticCurveTo(w * 1.2, 0, w * 1.15, w * .45); c.lineTo(-w * .7, w * .45); c.closePath(); }, fill: ID },
  ], 1.6);
  c.strokeStyle = '#1a1b20'; c.lineWidth = 1.2; for (let i = 1; i < 3; i++) { c.beginPath(); c.moveTo(-w * .45 + i * w * .3, -w * 1.05); c.lineTo(-w * .45 + i * w * .3, -w * .1); c.stroke(); }
  c.fillStyle = '#e8b84a'; c.fillRect(-w * .55, -w * 1.1, w * 1.1, w * .18);
  c.strokeStyle = '#c0262d'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(-w * .6, -w * .55); c.lineTo(w * .6, -w * .7); c.moveTo(-w * .6, -w * .7); c.lineTo(w * .6, -w * .55); c.stroke();
  c.fillStyle = '#9aa0ae'; for (let i = 0; i < 3; i++) { aCirc(c, -w * .3 + i * w * .45, w * .18, w * .08); c.fill(); }
  c.restore();
}
// 纖細的手：手掌＋四根手指（雪女鬼）
function bossHand(c, x, y, r, col, rot) {
  c.save(); c.translate(x, y); c.rotate(rot);
  heroSilhouette(c, [
    { path: c => aEll(c, 0, 0, r, r * .8), fill: col },
    ...[0, 1, 2, 3].map(i => ({ path: c => aEll(c, -r * .66 + i * r * .44, r * .95, r * .2, r * .52), fill: col })),
    { path: c => aEll(c, r * .95, r * .1, r * .2, r * .48, -.7), fill: col },
  ], 1.2);
  c.restore();
}

// --- 真妖鬼：赤鬼大將（火焰鬃毛、粗角、狼牙棒、虎皮腰布、金腕環） ---
function bossOni(c, b, t) {
  const R = '#e23b2c', RD = '#8e1c16', RL = '#ff9070', fb = Math.sin(t * 3.2) * 2;
  // 揮棒姿勢：以右肩為支點。平常扛在肩上；技能時先把棒子往後舉過頭頂（蓄力），再從頭頂往前下方砸
  const slam = b.skillT < .45, sk = slam ? 1 - Math.max(0, b.skillT) / .45 : 0;
  const SX = 22, SY = 6 - fb, lerp = (a2, b2, q) => a2 + (b2 - a2) * q;
  const pose = p => {   // p：0 平常 → .35 舉到最高 → 1 砸到底
    if (p <= 0) return [.28, .3 + Math.sin(t * 2) * .06];
    if (p < .35) { const q = Math.sin(p / .35 * Math.PI / 2); return [lerp(.28, -1.35, q), lerp(.3, -.65, q)]; }
    const q = 1 - Math.pow(1 - (p - .35) / .65, 3); return [lerp(-1.35, 1.25, q), lerp(-.65, 2.9, q)];
  };
  const [phi, ang] = pose(sk), striking = sk >= .35;
  const fx = SX + Math.cos(phi) * 20, fy = SY + Math.sin(phi) * 20;                 // 拳頭位置
  const hx = fx + Math.sin(ang) * 13, hy = fy - Math.cos(ang) * 13;                  // 狼牙棒的基準點（握柄穿過拳頭）
  const frot = Math.atan2(-(SX - fx), SY - fy);                                       // 手腕永遠朝向肩膀
  for (let i = 0; i < 13; i++) {   // 火焰氣場
    const a = Math.PI * (.92 + i / 12 * 1.16), f = 1 + Math.sin(t * 9 + i * 1.7) * .16, r1 = 26, r2 = (46 + (i % 2) * 9) * f;
    c.fillStyle = i % 2 ? 'rgba(255,110,30,.5)' : 'rgba(255,205,70,.42)';
    c.beginPath(); c.moveTo(Math.cos(a - .2) * r1, -8 + Math.sin(a - .2) * r1);
    c.quadraticCurveTo(Math.cos(a - .1) * r2 * .8, -8 + Math.sin(a - .1) * r2 * .8, Math.cos(a + .04) * r2, -8 + Math.sin(a + .04) * r2);
    c.lineTo(Math.cos(a + .2) * r1, -8 + Math.sin(a + .2) * r1); c.fill();
  }
  // 狼牙棒：揮動時在棒頭軌跡留下白色殘影
  const club = withFist => {
    if (striking) {
      c.lineCap = 'round';
      for (let k = 3; k >= 1; k--) { const [p2, a2] = pose(Math.max(.35, sk - k * .07)), f2x = SX + Math.cos(p2) * 20, f2y = SY + Math.sin(p2) * 20; c.strokeStyle = `rgba(255,255,255,${.16 * (4 - k)})`; c.lineWidth = 12 - k * 2; c.beginPath(); c.moveTo(f2x + Math.sin(a2) * 30, f2y - Math.cos(a2) * 30); c.lineTo(f2x + Math.sin(a2) * 58, f2y - Math.cos(a2) * 58); c.stroke(); }
    }
  c.save(); c.translate(hx, hy); c.rotate(ang);
  c.beginPath(); c.moveTo(-3, 7); c.lineTo(-4.5, -8); c.lineTo(-8.5, -48); c.quadraticCurveTo(0, -55, 8.5, -48); c.lineTo(4.5, -8); c.lineTo(3, 7); c.closePath();
  const ig = c.createLinearGradient(-9, 0, 9, 0); ig.addColorStop(0, '#26222c'); ig.addColorStop(.38, '#7a7482'); ig.addColorStop(1, '#26222c');
  c.fillStyle = ig; c.fill(); aInk(c, 2.2);
  // 握柄：纏著布條往下延伸，穿過拳頭從另一側露出，尾端有金環
  c.beginPath(); c.rect(-2.8, 4, 5.6, 20); aFI(c, '#6a3a1e', 1.6);
  c.strokeStyle = '#3a1e0e'; c.lineWidth = 1.1; for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(-2.8, 6 + i * 4); c.lineTo(2.8, 8 + i * 4); c.stroke(); }
  aCirc(c, 0, 26.5, 3.4); aFI(c, '#e8b84a', 1.5); aCirc(c, 0, 26.5, 1.3); c.fillStyle = INK; c.fill();
  c.fillStyle = '#d9a441'; c.fillRect(-5.5, -10, 11, 3.4); c.strokeStyle = INK; c.lineWidth = 1.2; c.strokeRect(-5.5, -10, 11, 3.4);
  for (let r = 0; r < 5; r++) for (const sx of [-1, 0, 1]) {
    if (r % 2 && sx === 0) continue;
    const yy = -17 - r * 6.6, px = sx * (3.4 + r * .7);
    c.beginPath(); c.moveTo(px - 2, yy + 1.6); c.lineTo(px + sx * 2.6, yy - 2.6); c.lineTo(px + 2, yy + 1.6); c.closePath(); c.fillStyle = '#eef2f6'; c.fill(); c.strokeStyle = INK; c.lineWidth = .9; c.stroke();
  }
  c.restore();
    if (withFist) bossFist(c, fx, fy, 10, R, RD, { claw: 1, cuff: '#e8b84a', cuffLine: '#9a6a1a', spike: '#fff6e0', rot: frot });
  };
  if (!striking) club(false);
  bossOniFoot(c, -14, 42, 8.5, RD, '#5a0e0a', -1, { ring: '#e8b84a' }); bossOniFoot(c, 14, 42, 8.5, RD, '#5a0e0a', 1, { ring: '#e8b84a' });
  const horn = sd => ({ path: c => { c.beginPath(); c.moveTo(sd * 5, -27); c.quadraticCurveTo(sd * 10, -47, sd * 27, -57); c.quadraticCurveTo(sd * 25, -40, sd * 20, -26); c.closePath(); }, fill: '#f7e9c0',
    after: c => { c.save(); c.clip(); c.strokeStyle = '#c99a5a'; c.lineWidth = 2.2; for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(sd * (4 + i * 4), -34 - i * 6.5); c.lineTo(sd * (22 + i * 2), -31 - i * 7); c.stroke(); } c.restore(); } });
  heroSilhouette(c, [
    horn(-1), horn(1),
    { path: c => { c.beginPath(); for (let i = 0; i <= 14; i++) { const a = Math.PI * (.9 + i / 14 * 1.2), r = i % 2 ? 26 : 37 + Math.sin(t * 6 + i) * 1.6; c.lineTo(Math.cos(a) * r, -8 + Math.sin(a) * r); } c.closePath(); }, fill: '#2a0f0c' },
    { path: c => { c.beginPath(); c.moveTo(-20, 14); c.quadraticCurveTo(0, 8, 20, 14); c.quadraticCurveTo(25, 28, 16, 39); c.quadraticCurveTo(0, 43, -16, 39); c.quadraticCurveTo(-25, 28, -20, 14); c.closePath(); }, fill: R,
      after: c => { c.save(); c.clip(); c.fillStyle = '#f5c44e'; c.fillRect(-27, 30, 54, 14); c.fillStyle = INK; for (let i = -4; i <= 4; i++) { c.beginPath(); c.moveTo(i * 6.4 - 1.6, 30); c.lineTo(i * 6.4 + 2.6, 36.5); c.lineTo(i * 6.4 + 1, 30); c.fill(); }
        c.fillStyle = '#6a3a1e'; c.fillRect(-27, 29, 54, 2.4);
        c.strokeStyle = RD; c.lineWidth = 1.5; c.beginPath(); c.moveTo(0, 19); c.lineTo(0, 28); c.moveTo(-8, 22); c.quadraticCurveTo(-4, 24.5, -1, 22); c.moveTo(8, 22); c.quadraticCurveTo(4, 24.5, 1, 22); c.stroke(); c.restore(); } },
    { path: c => { c.beginPath(); c.arc(0, -8, 25, 0, TAU); c.moveTo(-23, -11); c.lineTo(-34, -18); c.lineTo(-24, -1); c.closePath(); c.moveTo(23, -11); c.lineTo(34, -18); c.lineTo(24, -1); c.closePath(); }, fill: bossBall(c, 0, -8, 25, RL, R, RD) },
  ], 2.2);
  // 念珠項鍊（頭下方露出兩側）
  for (const sd of [-1, 1]) for (let i = 0; i < 3; i++) { aCirc(c, sd * (14 + i * 4.2), 15.5 + i * 1.6, 2.8); aFI(c, '#7a4a26', 1.1); }
  c.fillStyle = 'rgba(255,255,255,.28)'; aEll(c, -9, -25, 7, 3.2, -.3); c.fill();
  // 臉：金色細瞳大眼、粗眉、獠牙嘴（獠牙小一點）
  bossEye(c, -10, -7, 7.2, 7.8, '#ff8a10', '#ffe85a', { slit: 1 }); bossEye(c, 10, -7, 7.2, 7.8, '#ff8a10', '#ffe85a', { slit: 1 });
  c.fillStyle = INK;
  for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(sd * 2.5, -12); c.lineTo(sd * 19, -21); c.lineTo(sd * 21, -15.5); c.lineTo(sd * 4, -8.5); c.closePath(); c.fill(); }
  aEll(c, 0, 2, 4.4, 2.8); c.fillStyle = RD; c.fill(); c.fillStyle = INK; aCirc(c, -1.8, 2.6, .9); c.fill(); aCirc(c, 1.8, 2.6, .9); c.fill();
  c.beginPath(); c.moveTo(-11, 7); c.quadraticCurveTo(0, 10, 11, 7); c.quadraticCurveTo(9, 15, 0, 15.5); c.quadraticCurveTo(-9, 15, -11, 7); c.closePath(); aFI(c, '#4a0a10', 1.7);
  c.save(); c.clip(); c.fillStyle = '#fff'; c.fillRect(-12, 6, 24, 2.6); c.fillStyle = '#e8566a'; aEll(c, 0, 15.5, 5, 3); c.fill(); c.restore();
  for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(sd * 7.4, 13.6); c.lineTo(sd * 6.4, 9.6); c.lineTo(sd * 5, 13.8); c.closePath(); aFI(c, '#fff', 1); }
  if (slam) { c.fillStyle = 'rgba(255,255,255,.7)'; for (const sd of [-1, 1]) { aCirc(c, sd * 7, 3 + sk * 4, 2 + sk * 2); c.fill(); } }   // 鼻孔噴氣
  // 拳頭：白爪＋帶尖刺的金腕環
  bossFist(c, -37, 13 + fb, 10, R, RD, { claw: 1, cuff: '#e8b84a', cuffLine: '#9a6a1a', spike: '#fff6e0', rot: -Math.PI / 2 + .2, flip: 1 });
  if (striking) club(true);   // 砸下時棒子在身體前面
  else bossFist(c, fx, fy, 10, R, RD, { claw: 1, cuff: '#e8b84a', cuffLine: '#9a6a1a', spike: '#fff6e0', rot: frot });
}

// --- 怠惰鬼：躺在雲上的醉鬼（亂髮與一長一斷的角、大酒鼻、敞開的半纏、菸管與酒杯、木屐） ---
function bossSleepy(c, b, t, warn) {
  const P = '#8e5ad6', PD = '#4a2480', PL = '#cfb0ff', fb = Math.sin(t * 1.6) * 1.5;
  // 菸管的煙（平常飄成一圈圈；施法時變成大煙圈）
  for (let i = 0; i < 4; i++) { const st = (t * .35 + i / 4) % 1; c.globalAlpha = (1 - st) * .7; c.strokeStyle = '#d8c4ff'; c.lineWidth = 2.2 - st; c.beginPath(); c.arc(-52 - st * 6 + Math.sin(t * 2 + i) * 3, -10 - st * 30, 3 + st * 7, 0, TAU); c.stroke(); c.globalAlpha = 1; }
  // 箱枕（木頭枕座＋小枕頭）
  c.save(); c.translate(-36, 6); c.rotate(-.12);
  heroSilhouette(c, [
    { path: c => { c.beginPath(); c.moveTo(-12, 0); c.lineTo(12, 0); c.lineTo(9, 14); c.lineTo(-9, 14); c.closePath(); }, fill: '#a0522d', after: c => { c.fillStyle = '#7a3a1e'; c.fillRect(-11, 5, 22, 2); } },
    { path: c => aEll(c, 0, -3, 14, 6), fill: '#f2e6ff', after: c => { c.save(); c.clip(); c.fillStyle = '#b48ae8'; c.fillRect(-15, -4.5, 30, 3); c.restore(); } },
  ], 1.8);
  c.restore();
  // 身體：大肚子、敞開的深藍半纏（白色龜甲紋）、虎皮腰布
  const coat = c.createLinearGradient(0, 4, 0, 38); coat.addColorStop(0, '#3a3f8a'); coat.addColorStop(1, '#1e2258');
  heroSilhouette(c, [
    { path: c => aEll(c, 0, 21, 25, 16), fill: coat,
      after: c => { c.save(); c.clip(); c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 1;
        for (let gx = -30; gx <= 30; gx += 9) for (let gy = 6; gy <= 40; gy += 8) { c.beginPath(); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; c.lineTo(gx + (gy / 8 % 2) * 4.5 + Math.cos(a) * 4, gy + Math.sin(a) * 4); } c.closePath(); c.stroke(); }
        c.restore(); } },
    { path: c => aEll(c, 1, 21, 15, 13), fill: bossBall(c, 1, 21, 15, PL, P, PD),
      after: c => { c.save(); c.clip(); c.fillStyle = '#f5c44e'; c.fillRect(-16, 27, 34, 8); c.fillStyle = INK; for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(i * 6.5 - 1.4, 27); c.lineTo(i * 6.5 + 2.4, 32); c.lineTo(i * 6.5 + 1, 27); c.fill(); } c.restore();
        c.strokeStyle = PD; c.lineWidth = 1.3; c.beginPath(); c.arc(1, 20, 1.8, 0, TAU); c.stroke(); } },
  ], 2.2);
  c.strokeStyle = '#f5c44e'; c.lineWidth = 2.4; for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(sd * 14, 9); c.quadraticCurveTo(sd * 17, 22, sd * 14, 33); c.stroke(); }   // 半纏的金色衣襟
  // 頭（往枕頭歪一邊）
  c.save(); c.translate(0, 12); c.rotate(-.14 + Math.sin(t * 1.2) * .03); c.translate(0, -12);
  heroSilhouette(c, [
    { path: c => { c.beginPath(); c.moveTo(-15, -27); c.quadraticCurveTo(-24, -46, -14, -58); c.quadraticCurveTo(-8, -44, -5, -29); c.closePath(); }, fill: '#f3e4c0',
      after: c => { c.save(); c.clip(); c.strokeStyle = '#c4a068'; c.lineWidth = 2; for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(-22, -36 - i * 6); c.lineTo(-6, -33 - i * 7); c.stroke(); } c.restore(); } },
    { path: c => { c.beginPath(); c.moveTo(8, -29); c.quadraticCurveTo(10, -38, 17, -41); c.lineTo(19, -35); c.lineTo(16, -32); c.quadraticCurveTo(17, -30, 17, -26); c.closePath(); }, fill: '#f3e4c0' },   // 斷掉的短角
    { path: c => { c.beginPath(); for (let i = 0; i <= 16; i++) { const a = Math.PI * (.75 + i / 16 * 1.5), r = i % 2 ? 26 : 33 + Math.sin(t * 2 + i) * 1.2; c.lineTo(Math.cos(a) * r + (i % 2 ? 0 : 2), -8 + Math.sin(a) * r + (i % 2 ? 0 : 3)); } c.closePath(); }, fill: '#2a1840' },
    { path: c => { c.beginPath(); c.arc(0, -8, 25, 0, TAU); c.moveTo(-23, -10); c.lineTo(-32, -15); c.lineTo(-24, -2); c.closePath(); c.moveTo(23, -10); c.lineTo(32, -15); c.lineTo(24, -2); c.closePath(); }, fill: bossBall(c, 0, -8, 25, PL, P, PD) },
  ], 2.2);
  c.fillStyle = 'rgba(255,255,255,.22)'; aEll(c, -8, -26, 7, 3, -.3); c.fill();
  // 亂瀏海
  c.beginPath(); c.moveTo(-20, -22); for (let i = 0; i <= 8; i++) { const x2 = -20 + i * 5, y2 = i % 2 ? -14 - (i % 4 === 1 ? 2 : 0) : -24; c.lineTo(x2, y2); } c.quadraticCurveTo(0, -36, -20, -22); c.closePath(); aFI(c, '#2a1840', 1.6);
  // 臉：醉醺醺的紅臉頰、大酒鼻、下垂的粗眉
  c.fillStyle = 'rgba(255,80,120,.45)'; aEll(c, -15, 3, 6, 3.4); c.fill(); aEll(c, 15, 3, 6, 3.4); c.fill();
  if (warn) {
    for (const sd of [-1, 1]) bossEye(c, sd * 10, -6, 7.4, 7.8, '#c01aff', '#ffd2ff', { slit: 1, glow: 'rgba(200,120,255,.7)' });
    c.fillStyle = INK; for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(sd * 3, -14); c.lineTo(sd * 18, -20); c.lineTo(sd * 19, -16); c.lineTo(sd * 4, -11); c.closePath(); c.fill(); }
  } else {
    for (const sd of [-1, 1]) bossEye(c, sd * 10, -6, 7, 7.2, '#d89a10', '#ffe85a', { slit: 1, lid: .56, lidCol: P });
    c.fillStyle = INK; for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(sd * 4, -15); c.quadraticCurveTo(sd * 12, -19, sd * 19, -13); c.lineTo(sd * 18, -10.5); c.quadraticCurveTo(sd * 12, -15, sd * 5, -12); c.closePath(); c.fill(); }
    c.strokeStyle = PD; c.lineWidth = 1.3; for (const sd of [-1, 1]) { c.beginPath(); c.arc(sd * 10, -4, 7.5, .4, Math.PI - .4); c.stroke(); }
  }
  aCirc(c, 0, 2.5, 5.2); c.fillStyle = bossBall(c, 0, 2.5, 5.2, '#ffb0d0', '#e0508a', '#a02a5a'); c.fill(); aInk(c, 1.5);   // 大酒鼻
  if (warn) { aEll(c, 1, 13, 8, 5.5 + Math.sin(t * 10) * 1.2); aFI(c, '#3a0a20', 1.6); }
  else { c.beginPath(); c.moveTo(-8, 11); c.quadraticCurveTo(0, 15, 9, 10); c.strokeStyle = INK; c.lineWidth = 1.8; c.stroke(); }
  c.beginPath(); c.moveTo(6.5, warn ? 9.6 : 12); c.lineTo(8, warn ? 4.6 : 7.2); c.lineTo(9.6, warn ? 9.8 : 11.4); c.closePath(); aFI(c, '#fff', 1.1);   // 一顆露出來的獠牙
  c.restore();
  // 雲床
  const pf = [[-42, 35, 10], [-28, 31, 13], [-10, 34, 13], [9, 34, 13], [27, 31, 13], [42, 35, 10]];
  heroSilhouette(c, [{ path: c => { c.beginPath(); for (const [x, y2, r] of pf) { const yy = y2 + Math.sin(t * 2 + x) * .8; c.moveTo(x + r, yy); c.arc(x, yy, r, 0, TAU); } }, fill: '#dccbf7' }], 2);
  c.fillStyle = '#c3aeea'; c.fillRect(-48, 38, 96, 5);
  c.strokeStyle = '#b49ae0'; c.lineWidth = 1.4; for (const [x, y2, r] of pf) { c.beginPath(); c.arc(x, y2 + 2, r * .55, Math.PI * 1.1, Math.PI * 1.7); c.stroke(); }
  // 翹起來的腳：足袋＋木屐（掛在腳趾上晃）
  bossTabi(c, 40, 18 + Math.sin(t * 2.5) * 1.5, 7, 1, { geta: 1, rot: -.5 + Math.sin(t * 2.5) * .1 });
  // 左手拿菸管、右手拿紅漆酒杯
  // 菸管：吸嘴叼在嘴角，手從下方握住菸管中段（手腕朝下連到手肘），菸斗從拳頭外側穿出
  const pa = -2.87, px0 = -25, py0 = 6 - fb * .5;
  c.save(); c.translate(px0, py0); c.rotate(pa);
  c.beginPath(); c.moveTo(-17, 0); c.lineTo(26, 0); c.strokeStyle = INK; c.lineWidth = 3.8; c.stroke(); c.strokeStyle = '#6a3a1e'; c.lineWidth = 2.2; c.stroke();
  c.beginPath(); c.moveTo(22, 1.6); c.lineTo(26, 1.6); c.lineTo(27, 5.5); c.lineTo(32, 5.5); c.lineTo(31, -1.8); c.lineTo(22, -1.8); c.closePath(); aFI(c, '#e8b84a', 1.2);   // 雁首（菸斗）
  c.beginPath(); c.rect(-21, -1.6, 7, 3.2); aFI(c, '#e8b84a', 1);   // 吸嘴
  c.restore();
  bossFist(c, px0, py0, 8, P, PD, { cuff: '#7a4a26', cuffLine: '#4a2a12', rot: pa + Math.PI });
  // 酒碟：平放在攤開的手掌上，拇指壓著碟緣
  c.save(); c.translate(16, 15 + fb); c.rotate(-.12);
  heroSilhouette(c, [
    { path: c => aRR(c, -14, 3, 7, 7, 2), fill: '#7a4a26' },   // 木珠腕環
    { path: c => aEll(c, 0, 4, 9.5, 4.4), fill: P },
    ...[0, 1, 2, 3].map(i => ({ path: c => aEll(c, 8.2, 3 - i * 1.6 + 1.6, 2.4, 1.6, -.4), fill: P })),
  ], 1.5);
  c.strokeStyle = PD; c.lineWidth = 1; c.beginPath(); c.moveTo(-4, 6.5); c.quadraticCurveTo(1, 8, 6, 6); c.stroke();
  c.beginPath(); c.moveTo(-9, -1); c.quadraticCurveTo(0, 5.5, 9, -1); c.closePath(); aFI(c, '#d8323c', 1.5);   // 紅漆酒碟
  c.fillStyle = '#e8b84a'; c.fillRect(-6.5, .6, 13, 1.3);
  aEll(c, 0, -1, 9, 1.8); aFI(c, '#ffe9c8', 1.1);   // 碟裡的酒
  aEll(c, -7.5, -1.2, 2.2, 3.4, .5); aFI(c, P, 1.4);   // 拇指壓著碟緣
  c.restore();
  // 酒葫蘆（綁著紅繩靠在雲邊）
  c.save(); c.translate(-46, 26); c.rotate(.25);
  heroSilhouette(c, [{ path: c => { c.beginPath(); c.arc(0, -6, 5, 0, TAU); c.moveTo(8, 6); c.arc(0, 6, 8, 0, TAU); }, fill: '#e8a84a' }], 1.6);
  c.fillStyle = '#d8323c'; c.fillRect(-4.5, -1.4, 9, 2.4); c.fillStyle = '#7a4a26'; c.fillRect(-1.6, -13, 3.2, 3);
  c.fillStyle = 'rgba(255,255,255,.35)'; aEll(c, -3, 4, 2.4, 1.6); c.fill();
  c.restore();
  if (warn) { c.strokeStyle = 'rgba(197,138,255,.8)'; c.lineWidth = 3; for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(0, 0, 50 + i * 7 + (t * 30) % 7, t * 3 + i, t * 3 + i + 2.5); c.stroke(); } }
}

// --- 雪女鬼：雪姬（白色長髮公主切、冰晶角、層疊衣襟的振袖和服、冰扇、冰木屐） ---
function bossYuki(c, b, t, warn) {
  const SK = '#f4f9ff', OB = '#22407e', sw = Math.sin(t * 1.8), fb = Math.sin(t * 2.4) * 1.8;
  const hairG = c.createLinearGradient(0, -34, 0, 44); hairG.addColorStop(0, '#ffffff'); hairG.addColorStop(1, '#a9d4f7');
  const kimG = c.createLinearGradient(0, 8, 0, 52); kimG.addColorStop(0, '#f2fbff'); kimG.addColorStop(.45, '#8fd0f2'); kimG.addColorStop(1, '#2c66b0');   // 由白漸層到深藍（暈染）
  for (let i = 0; i < 7; i++) { const a = t * .9 + i / 7 * TAU, r = 50 + Math.sin(t * 2 + i) * 4; drawFlake(c, Math.cos(a) * r, Math.sin(a) * r * .75, 3.8); }
  // 和服花紋：青海波＋雪輪
  const waves = (x0, x1, y0, y1) => { c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = .9; for (let y = y0, row = 0; y <= y1; y += 4, row++) for (let x = x0 + (row % 2) * 4; x <= x1; x += 8) for (const r of [4, 2.6]) { c.beginPath(); c.arc(x, y, r, Math.PI, 0); c.stroke(); } };
  const crest = (x, y, r) => { c.fillStyle = 'rgba(255,255,255,.85)'; c.beginPath(); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; c.moveTo(x + Math.cos(a) * r * 1.05, y + Math.sin(a) * r * 1.05); c.arc(x + Math.cos(a) * r * .75, y + Math.sin(a) * r * .75, r * .32, 0, TAU); } c.fill(); drawFlake(c, x, y, r * .55); };
  const horn = sd => ({ path: c => { c.beginPath(); c.moveTo(sd * 5, -25); c.lineTo(sd * 8, -44); c.lineTo(sd * 12, -53); c.lineTo(sd * 16, -43); c.lineTo(sd * 17, -24); c.closePath(); }, fill: 'rgba(222,246,255,1)',
    after: c => { c.strokeStyle = 'rgba(120,200,255,.8)'; c.lineWidth = 1; c.beginPath(); c.moveTo(sd * 12, -51); c.lineTo(sd * 11, -27); c.moveTo(sd * 8, -42); c.lineTo(sd * 12, -36); c.stroke(); } });
  const sleeve = sd => ({ path: c => { c.save(); c.translate(sd * 31, 13 + fb); c.rotate(sd * -.1); aRR(c, -9.5, 0, 19, 28, [3, 3, 9, 9]); c.restore(); }, fill: kimG,
    after: c => { c.save(); c.clip(); c.translate(sd * 31, 13 + fb); c.rotate(sd * -.1); waves(-10, 10, 18, 30); crest(0, 8, 3.6);
      c.fillStyle = '#ffffff'; c.fillRect(-10, 25.5, 20, 2.5); c.fillStyle = '#e88ab0'; c.fillRect(-10, 23.5, 20, 2);   // 袖口的襯裡（白＋淡紅）
      c.strokeStyle = 'rgba(30,70,130,.35)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(sd * -4, 2); c.quadraticCurveTo(sd * -6, 14, sd * -3, 24); c.stroke(); c.restore(); } });
  heroSilhouette(c, [
    { path: c => { c.beginPath(); c.moveTo(-22, -24); c.quadraticCurveTo(-37, 6, -32 + sw * 3, 41); c.quadraticCurveTo(-25, 47, -18 + sw * 2, 39); c.lineTo(18 + sw * 2, 39); c.quadraticCurveTo(25, 47, 32 + sw * 3, 41); c.quadraticCurveTo(37, 6, 22, -24); c.closePath(); }, fill: hairG,
      after: c => { c.save(); c.clip(); c.strokeStyle = 'rgba(130,180,230,.5)'; c.lineWidth = 1; for (let i = -3; i <= 3; i++) { c.beginPath(); c.moveTo(i * 9, -10); c.quadraticCurveTo(i * 11 + sw * 2, 20, i * 10 + sw * 3, 44); c.stroke(); } c.restore(); } },
    sleeve(-1), sleeve(1),
    { path: c => { c.beginPath(); c.moveTo(-14, 12); c.quadraticCurveTo(0, 8, 14, 12); c.quadraticCurveTo(20, 28, 22, 40); c.quadraticCurveTo(13 + sw * 2, 52, 5, 44); c.quadraticCurveTo(-3 - sw * 2, 55, -10, 44); c.quadraticCurveTo(-17, 50, -22, 40); c.quadraticCurveTo(-20, 28, -14, 12); c.closePath(); }, fill: kimG,
      after: c => { c.save(); c.clip();
        waves(-24, 24, 36, 54); crest(-11, 39, 3.4); crest(12, 42, 3);
        c.strokeStyle = 'rgba(30,70,130,.3)'; c.lineWidth = 1.3; for (const fx of [-12, -3, 10]) { c.beginPath(); c.moveTo(fx, 33); c.quadraticCurveTo(fx + 2, 42, fx - 1, 52); c.stroke(); }   // 布料皺褶
        // 層疊的衣襟：白襦袢、銀色、深藍（左前右後交疊）
        for (const [col, off] of [['#2c66b0', 4.5], ['#c8d4e0', 2.5], ['#ffffff', .8]]) { c.fillStyle = col; c.beginPath(); c.moveTo(-8 - off, 10); c.lineTo(2, 25); c.lineTo(8 + off, 10); c.lineTo(8 + off - 2, 10); c.lineTo(2, 22 - off * .2); c.lineTo(-8 - off + 2, 10); c.closePath(); c.fill(); }
        c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(-6, 10); c.lineTo(2, 22); c.lineTo(6, 10); c.closePath(); c.fill();
        c.strokeStyle = 'rgba(20,40,80,.5)'; c.lineWidth = 1; c.beginPath(); c.moveTo(-12.5, 10); c.lineTo(2, 25.5); c.lineTo(10, 16); c.stroke();
        // 帶：帶揚（淡紅）＋深藍帶＋金色帶締＋冰晶帶留
        c.fillStyle = '#f0a8c4'; c.fillRect(-24, 23.5, 48, 2.2);
        c.fillStyle = OB; c.fillRect(-24, 25.5, 48, 8);
        c.strokeStyle = 'rgba(255,255,255,.25)'; c.lineWidth = 1; for (let x = -22; x <= 22; x += 5) { c.beginPath(); c.moveTo(x, 26); c.lineTo(x + 2.5, 33); c.stroke(); }
        c.fillStyle = '#f2c14e'; c.fillRect(-24, 29, 48, 1.6);
        c.restore();
        c.beginPath(); c.moveTo(2, 27); c.lineTo(5, 29.8); c.lineTo(2, 32.6); c.lineTo(-1, 29.8); c.closePath(); aFI(c, '#9ae6ff', 1); } },
    horn(-1), horn(1),
    { path: c => aCirc(c, 0, -8, 23.5), fill: bossBall(c, 0, -8, 23.5, '#ffffff', SK, '#c8e2f6') },
  ], 2);
  // 冰木屐（雪霧下露出一點）
  for (const sd of [-1, 1]) { c.save(); c.translate(sd * 7, 53); aRR(c, -6, 0, 12, 3.2, 1.5); aFI(c, 'rgba(190,235,255,.95)', 1.3); aEll(c, 0, -1.5, 4.6, 2.6); aFI(c, '#ffffff', 1.2); c.strokeStyle = '#5aa8e8'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(-3, -1); c.lineTo(0, -3.4); c.lineTo(3, -1); c.stroke(); c.restore(); }
  // 前髮（公主切）與兩側髮束
  c.beginPath(); c.moveTo(-25.5, 13); c.lineTo(-25.5, -8); c.arc(0, -8, 25.5, Math.PI, 0); c.lineTo(25.5, 13); c.lineTo(22, 11); c.lineTo(19, 14); c.lineTo(17, -11); c.lineTo(-17, -11); c.lineTo(-19, 14); c.lineTo(-22, 11); c.closePath();
  c.fillStyle = hairG; c.fill(); aInk(c, 2);
  c.strokeStyle = 'rgba(150,205,250,.9)'; c.lineWidth = 2.4; c.beginPath(); c.arc(0, -8, 20, Math.PI * 1.15, Math.PI * 1.55); c.stroke();
  c.strokeStyle = 'rgba(130,180,230,.6)'; c.lineWidth = 1; for (const sx of [-21, 21]) { c.beginPath(); c.moveTo(sx, -6); c.lineTo(sx + (sx > 0 ? 1 : -1), 12); c.stroke(); }
  c.beginPath(); c.moveTo(0, -30); c.lineTo(3.5, -25); c.lineTo(0, -19); c.lineTo(-3.5, -25); c.closePath(); aFI(c, '#7fd6ff', 1.3);   // 冰晶額飾
  for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(sd * 6, -26); c.lineTo(sd * 8, -23); c.lineTo(sd * 6, -20.5); c.lineTo(sd * 4, -23); c.closePath(); aFI(c, '#bfefff', 1); }
  // 臉：長睫毛的冰藍眼睛、小獠牙微笑
  for (const sd of [-1, 1]) {
    bossEye(c, sd * 9, -1, 6.2, 6.8, '#1d5aa8', '#8ae0ff', warn ? { glow: 'rgba(140,220,255,.75)' } : { lid: .22, lidCol: SK });
    c.strokeStyle = INK; c.lineWidth = 2.6; c.lineCap = 'round';
    const ly = warn ? -7.6 : -5;
    c.beginPath(); c.moveTo(sd * 3, ly + .5); c.quadraticCurveTo(sd * 9, ly - 2.2, sd * 15.5, ly + 1); c.lineTo(sd * 18, ly - 2.5); c.stroke();
  }
  c.fillStyle = 'rgba(255,150,195,.4)'; aEll(c, -14, 6.5, 3.6, 2); c.fill(); aEll(c, 14, 6.5, 3.6, 2); c.fill();
  c.beginPath(); c.moveTo(-3.5, 9); c.quadraticCurveTo(0, 11.5, 3.5, 9); c.strokeStyle = '#5a6ad0'; c.lineWidth = 1.7; c.stroke();
  c.beginPath(); c.moveTo(1.4, 9.8); c.lineTo(2.4, 12); c.lineTo(3, 9.4); c.closePath(); c.fillStyle = '#fff'; c.fill();
  // 左手（從袖口伸出）
  bossHand(c, -31, 43 + fb, 4.4, SK, .25);
  // 冰扇（右手）：扇骨在拳頭裡收成扇柄，扇釘從拳頭內側露出、垂著流蘇；蓄力時舉高發光
  const fa2 = warn ? -1.05 + Math.sin(t * 16) * .08 : .25, fx0 = 31, fy0 = 41 + fb, fdx = Math.cos(fa2), fdy = Math.sin(fa2);
  const pvx = fx0 - fdx * 7, pvy = fy0 - fdy * 7, fr = warn ? 25 : 20;
  c.save(); c.translate(pvx, pvy); c.rotate(fa2 + Math.PI / 2);
  for (let i = 0; i <= 6; i++) {
    const a = -Math.PI / 2 - .85 + i * .283;
    c.beginPath(); c.moveTo(Math.cos(a) * 2, Math.sin(a) * 2); c.lineTo(Math.cos(a) * 12, Math.sin(a) * 12); c.strokeStyle = INK; c.lineWidth = 2.4; c.stroke(); c.strokeStyle = '#d8f2ff'; c.lineWidth = 1; c.stroke();   // 扇骨
    c.beginPath(); c.moveTo(Math.cos(a - .1) * 10, Math.sin(a - .1) * 10); c.lineTo(Math.cos(a - .13) * fr * .86, Math.sin(a - .13) * fr * .86); c.lineTo(Math.cos(a) * fr, Math.sin(a) * fr); c.lineTo(Math.cos(a + .13) * fr * .86, Math.sin(a + .13) * fr * .86); c.lineTo(Math.cos(a + .1) * 10, Math.sin(a + .1) * 10); c.closePath();
    aFI(c, i % 2 ? 'rgba(200,240,255,.95)' : 'rgba(150,215,250,.95)', 1.1);
  }
  if (warn) bossGlow(c, 0, -fr * .7, fr, 'rgba(160,230,255,.5)');
  c.restore();
  bossFist(c, fx0, fy0, 4.8, SK, '#b8cfe4', { rot: fa2 + Math.PI });
  aCirc(c, pvx, pvy, 1.9); aFI(c, '#bfefff', 1);   // 扇釘
  c.beginPath(); c.moveTo(pvx, pvy + 1.5); c.quadraticCurveTo(pvx - 1.5 + Math.sin(t * 3) * 1.5, pvy + 6, pvx + Math.sin(t * 3) * 2, pvy + 10); c.strokeStyle = '#5ab0f0'; c.lineWidth = 1.2; c.stroke();
  aEll(c, pvx + Math.sin(t * 3) * 2, pvy + 12, 1.4, 2.6); aFI(c, '#8ad0ff', .9);   // 流蘇
  if (warn) { c.strokeStyle = `rgba(200,240,255,${.6 + .3 * Math.sin(t * 20)})`; c.lineWidth = 3; aCirc(c, 0, 0, 52); c.stroke(); }
  c.fillStyle = 'rgba(235,248,255,.55)'; for (let i = 0; i < 4; i++) { const mt = (t * .7 + i / 4) % 1; aCirc(c, -14 + i * 9 + Math.sin(t + i) * 3, 46 + mt * 10, 3 + mt * 3); c.globalAlpha = 1 - mt; c.fill(); c.globalAlpha = 1; }   // 下襬的雪霧
}

// --- 鐵甲鬼：鎧武者（金色鍬形角、頭盔與護頸、紅漆面甲、大袖、背旗、鐵手甲、脛當） ---
function bossArmor(c, b, t, warn) {
  const I = '#6c717e', ID = '#30333b', IL = '#c0c6d2', RD = '#c0262d', fb = Math.sin(t * 2.4) * 1.5, sh = b.shield;
  const gold = c.createLinearGradient(0, -64, 0, -20); gold.addColorStop(0, '#fff0a0'); gold.addColorStop(.5, '#e8b84a'); gold.addColorStop(1, '#a8701a');
  // 背旗
  c.save(); c.translate(-30, 0); c.rotate(-.14);
  c.beginPath(); c.moveTo(0, 22); c.lineTo(0, -78); c.strokeStyle = INK; c.lineWidth = 4.4; c.stroke(); c.strokeStyle = '#6a4424'; c.lineWidth = 2.2; c.stroke();
  const wv = Math.sin(t * 4) * 2.5;
  c.beginPath(); c.moveTo(0, -76); c.lineTo(-19, -76 + wv * .3); c.quadraticCurveTo(-18 + wv, -56, -19, -34 + wv * .5); c.lineTo(0, -34); c.closePath(); aFI(c, RD, 2);
  c.fillStyle = '#fff'; c.font = '900 14px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('鬼', -9.5, -55);
  c.restore();
  const lace = (x0, x1, y) => { c.fillStyle = RD; for (let x = x0; x <= x1; x += 5) c.fillRect(x - .9, y - 1.6, 1.8, 3.2); };
  const sode = sd => ({ path: c => { c.save(); c.translate(sd * 37, 4 + fb); c.rotate(sd * .14); aRR(c, -10, 0, 20, 27, 3); c.restore(); }, fill: I,
    after: c => { c.save(); c.clip(); c.translate(sd * 37, 4 + fb); c.rotate(sd * .14); c.strokeStyle = ID; c.lineWidth = 1.4; for (let i = 1; i < 4; i++) { c.beginPath(); c.moveTo(-11, i * 6.8); c.lineTo(11, i * 6.8); c.stroke(); lace(-7, 8, i * 6.8 - 3.4); } c.fillStyle = '#e8b84a'; c.fillRect(-11, 0, 22, 2.4); c.restore(); } });
  const kuwa = sd => ({ path: c => { c.beginPath(); c.moveTo(sd * 4, -29); c.quadraticCurveTo(sd * 30, -34, sd * 35, -64); c.quadraticCurveTo(sd * 23, -45, sd * 6, -23); c.closePath(); }, fill: gold });
  bossArmorFoot(c, -13, 42, 8.5, I, ID, -1); bossArmorFoot(c, 13, 42, 8.5, I, ID, 1);
  heroSilhouette(c, [
    { path: c => { c.beginPath(); c.moveTo(-25, -12); c.lineTo(25, -12); c.lineTo(44, 13); c.quadraticCurveTo(0, 22, -44, 13); c.closePath(); }, fill: I,
      after: c => { c.save(); c.clip(); c.strokeStyle = ID; c.lineWidth = 1.5; for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(-46, -2 + i * 7); c.quadraticCurveTo(0, 6 + i * 7, 46, -2 + i * 7); c.stroke(); } for (let i = 0; i < 3; i++) { lace(-40, -26, 1 + i * 7); lace(26, 40, 1 + i * 7); } c.restore(); } },
    sode(-1), sode(1),
    { path: c => aRR(c, -21, 12, 42, 26, 8), fill: I,
      after: c => { c.save(); c.clip(); c.fillStyle = ID; c.fillRect(-22, 12, 44, 5); c.strokeStyle = ID; c.lineWidth = 1.4; for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(-22, 22 + i * 6); c.lineTo(22, 22 + i * 6); c.stroke(); lace(-17, 17, 19 + i * 6); }
        c.fillStyle = 'rgba(255,255,255,.18)'; c.fillRect(-16, 13, 6, 22); c.restore(); } },
    { path: c => { c.beginPath(); c.rect(-20, 35, 12, 9); c.rect(-6, 36, 12, 9); c.rect(8, 35, 12, 9); }, fill: ID },
    { path: c => aCirc(c, 0, -6, 24.5), fill: bossBall(c, 0, -6, 24.5, IL, I, ID),
      after: c => { c.save(); aCirc(c, 0, -6, 24.5); c.clip(); c.strokeStyle = 'rgba(30,32,38,.55)'; c.lineWidth = 1.3; for (let i = -3; i <= 3; i++) { c.beginPath(); c.moveTo(i * 3, -31); c.quadraticCurveTo(i * 9, -22, i * 9.5, -12); c.stroke(); }
        aEll(c, 0, 3, 19, 14); c.fillStyle = '#121318'; c.fill(); c.restore(); } },
    kuwa(-1), kuwa(1),
  ], 2.2);
  // 兇狠的眼睛：往內下斜的細長發光眼＋直立瞳孔（盾開啟或蓄力時更亮）
  const hot = sh || warn;
  for (const sd of [-1, 1]) {
    c.beginPath(); c.moveTo(sd * 2.5, -.5); c.quadraticCurveTo(sd * 9, -6.5, sd * 15, -5.5); c.quadraticCurveTo(sd * 13, 2.5, sd * 4, 2); c.closePath();
    const eg = c.createLinearGradient(0, -6, 0, 3); eg.addColorStop(0, '#fff2a0'); eg.addColorStop(1, hot ? '#ff3a10' : '#ff7a1a'); c.fillStyle = eg; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.3; c.stroke();
    aEll(c, sd * 9.5, -1.6, 1.1, 3); c.fillStyle = INK; c.fill();
    bossGlow(c, sd * 9, -1.5, hot ? 15 : 10, hot ? 'rgba(255,110,30,.95)' : 'rgba(255,110,30,.5)');
  }
  // 眉庇（帽簷）壓在眼睛上方，正中間往下壓 → 皺眉
  c.beginPath(); c.moveTo(-26, -12); c.quadraticCurveTo(-12, -17, 0, -10); c.quadraticCurveTo(12, -17, 26, -12); c.lineTo(23, -5); c.quadraticCurveTo(10, -10, 0, -4); c.quadraticCurveTo(-10, -10, -23, -5); c.closePath(); aFI(c, ID, 1.8);
  c.strokeStyle = '#e8b84a'; c.lineWidth = 1.3; c.beginPath(); c.moveTo(-23, -6.5); c.quadraticCurveTo(-10, -11.5, 0, -5.5); c.quadraticCurveTo(10, -11.5, 23, -6.5); c.stroke();
  for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(sd * 22, -12); c.quadraticCurveTo(sd * 32, -14, sd * 31, -4); c.quadraticCurveTo(sd * 27, -8, sd * 22, -6); c.closePath(); aFI(c, I, 1.6); }   // 吹返
  // 面甲：紅漆、皺起的鼻樑、白牙、金鬍鬚
  c.beginPath(); c.moveTo(-17, 5); c.quadraticCurveTo(0, 1, 17, 5); c.lineTo(15, 14); c.quadraticCurveTo(0, 22, -15, 14); c.closePath(); aFI(c, '#9a2018', 1.8);
  c.strokeStyle = '#5a0e0a'; c.lineWidth = 1.2; for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(sd * 2, 4); c.quadraticCurveTo(sd * 6, 6, sd * 9, 4.5); c.stroke(); }
  c.beginPath(); c.moveTo(-10, 9.5); c.quadraticCurveTo(0, 13, 10, 9.5); c.lineTo(9, 15); c.quadraticCurveTo(0, 18, -9, 15); c.closePath(); aFI(c, '#1a0a0a', 1.2);
  c.save(); c.clip(); c.fillStyle = '#fff'; for (let i = -3; i <= 3; i++) { c.beginPath(); c.moveTo(i * 2.6 - 1.2, 10); c.lineTo(i * 2.6, 13.4); c.lineTo(i * 2.6 + 1.2, 10); c.fill(); c.beginPath(); c.moveTo(i * 2.6 - 1.2, 17); c.lineTo(i * 2.6, 13.8); c.lineTo(i * 2.6 + 1.2, 17); c.fill(); } c.restore();
  c.strokeStyle = '#e8b84a'; c.lineWidth = 1.6; c.lineCap = 'round'; for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(sd * 5, 8); c.quadraticCurveTo(sd * 12, 5.5, sd * 17, 9.5); c.stroke(); }
  // 前立：金色圓徽＋紅寶石
  aCirc(c, 0, -26, 5.5); c.fillStyle = gold; c.fill(); aInk(c, 1.6); aCirc(c, 0, -26, 2.4); c.fillStyle = RD; c.fill();
  // 鐵手甲：指節鐵片＋鉚釘、鎖子甲腕套
  bossFist(c, -38, 36 + fb, 8.5, ID, '#15161a', { plate: '#8a8e9a', cuff: '#4a4e58', cuffLine: '#c0262d', rot: -Math.PI / 2 - .32, flip: 1 });   // 和握刀的右手對稱：手腕朝向身體
  // 右手握武士刀：刀柄穿過拳頭（柄頭從拳頭下方露出），平常斜舉；開啟護盾時刀舉直、刀身發出藍光
  const ka = sh ? -.12 + Math.sin(t * 6) * .03 : .32 + Math.sin(t * 2) * .05, kfx = 38, kfy = 36 + fb;
  const kpx = kfx + Math.sin(ka) * 6, kpy = kfy - Math.cos(ka) * 6;
  c.save(); c.translate(kpx, kpy); c.rotate(ka);
  if (sh) bossGlow(c, 1, -30, 30, 'rgba(150,200,255,.55)');
  c.beginPath(); c.moveTo(-2.3, -4); c.quadraticCurveTo(-1.2, -32, 3.4, -58); c.lineTo(5.4, -52); c.quadraticCurveTo(3.4, -28, 2.3, -4); c.closePath();
  const kg = c.createLinearGradient(-3, 0, 4, 0); kg.addColorStop(0, '#8a93a4'); kg.addColorStop(.5, '#ffffff'); kg.addColorStop(1, '#c4ccd8');
  c.fillStyle = kg; c.fill(); aInk(c, 1.6);
  c.beginPath(); for (let i = 0; i <= 10; i++) { const yy = -6 - i * 4.6; c.lineTo(1.2 + yy * -.045 + (i % 2 ? .7 : 0), yy); } c.strokeStyle = 'rgba(120,150,190,.7)'; c.lineWidth = .9; c.stroke();   // 刃紋
  c.beginPath(); c.rect(-2.6, -5.5, 5.2, 2.4); aFI(c, '#e8b84a', 1);                   // 鎺
  aEll(c, 0, -2.4, 7, 2.2); aFI(c, '#c9a14a', 1.4);                                     // 鍔
  c.beginPath(); c.rect(-2.8, -1, 5.6, 17); aFI(c, '#1e1e26', 1.5);                     // 柄
  c.fillStyle = '#f2f2f2'; for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(0, 1 + i * 4); c.lineTo(2.2, 3 + i * 4); c.lineTo(0, 5 + i * 4); c.lineTo(-2.2, 3 + i * 4); c.closePath(); c.fill(); }   // 菱形柄卷
  c.beginPath(); c.rect(-3.2, 16, 6.4, 3); aFI(c, '#e8b84a', 1.2);                     // 柄頭
  c.beginPath(); c.moveTo(0, 19); c.quadraticCurveTo(3 + Math.sin(t * 3) * 2, 24, 1 + Math.sin(t * 3) * 3, 29); c.strokeStyle = RD; c.lineWidth = 1.6; c.stroke();   // 下緒
  c.restore();
  bossFist(c, kfx, kfy, 8.5, ID, '#15161a', { plate: '#8a8e9a', cuff: '#4a4e58', cuffLine: '#c0262d', rot: ka + Math.PI / 2 });
}

function drawBoss2(b, x, y, s, c = ctx) {
  const k = b.kind, P = BOSS_ART[k], t = b.t || performance.now() / 1000, warn = b.warn > 0;
  c.save(); c.translate(x, y); c.scale(s, s);
  const au = c.createRadialGradient(0, 0, 18, 0, 0, 64); au.addColorStop(0, P.body + '60'); au.addColorStop(1, P.body + '00');
  c.fillStyle = au; aCirc(c, 0, 0, 64); c.fill();
  const br = Math.sin(t * 3) * .022; c.scale(1 + br, 1 - br);
  if (k === 0) bossOni(c, b, t); else if (k === 1) bossSleepy(c, b, t, warn); else if (k === 2) bossYuki(c, b, t, warn); else bossArmor(c, b, t, warn);
  if (b.shield) { // 護盾：六角形紋路的泡泡
    c.strokeStyle = 'rgba(200,225,255,.95)'; c.lineWidth = 3; aCirc(c, 0, 0, 54); c.stroke();
    c.fillStyle = 'rgba(200,225,255,.16)'; c.fill();
    c.save(); aCirc(c, 0, 0, 54); c.clip(); c.strokeStyle = 'rgba(220,235,255,.35)'; c.lineWidth = 1;
    for (let r2 = -4; r2 <= 4; r2++) for (let q = -4; q <= 4; q++) { const hx = q * 15 + (r2 % 2) * 7.5, hy = r2 * 13; c.beginPath(); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; c.lineTo(hx + Math.cos(a) * 8, hy + Math.sin(a) * 8); } c.closePath(); c.stroke(); }
    c.restore();
  }
  c.restore();
}

// ===== 主畫面底部選單的圖示：「護額」風格（布帶綁著金屬板，板上刻著圖案和文字） =====
const DOCK_LABEL = { shop: ['商店', 'ショップ', 'SHOP'], rank: ['成就', '実績', 'AWARDS'], hist: ['歷史', '歴史', 'HISTORY'], help: ['說明', '遊び方', 'HELP'], opt: ['設定', '設定', 'SETTING'], credit: ['製作', '制作', 'CREDIT'] };
// 單色線條圖案（中心 (0,0)，約 ±16）
function dockGlyph(c, k, col, lw = 3.6) {
  c.save(); c.strokeStyle = col; c.fillStyle = col; c.lineWidth = lw; c.lineCap = 'round'; c.lineJoin = 'round';
  if (k === 'shop') { aEll(c, 0, 0, 10, 14); c.stroke(); for (const y of [-6, 0, 6]) { c.beginPath(); c.moveTo(-5, y); c.lineTo(5, y); c.stroke(); } }
  else if (k === 'rank') { c.beginPath(); c.moveTo(-11, -12); c.lineTo(11, -12); c.quadraticCurveTo(11, 4, 0, 5); c.quadraticCurveTo(-11, 4, -11, -12); c.stroke(); c.beginPath(); c.moveTo(0, 5); c.lineTo(0, 11); c.moveTo(-7, 13); c.lineTo(7, 13); c.stroke(); c.beginPath(); c.arc(-12, -6, 4.5, Math.PI * .5, Math.PI * 1.5); c.stroke(); c.beginPath(); c.arc(12, -6, 4.5, -Math.PI * .5, Math.PI * .5); c.stroke(); }
  else if (k === 'help') { aRR(c, -12, -12, 24, 24, 4); c.stroke(); c.font = '900 20px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('?', 0, 1); }
  else if (k === 'opt') { c.beginPath(); for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; c.moveTo(Math.cos(a) * 8, Math.sin(a) * 8); c.lineTo(Math.cos(a) * 14, Math.sin(a) * 14); } c.stroke(); aCirc(c, 0, 0, 8.5); c.stroke(); aCirc(c, 0, 0, 3); c.fill(); }
  else if (k === 'hist') { c.beginPath(); c.moveTo(0, -9); c.quadraticCurveTo(-7, -13, -14, -10); c.lineTo(-14, 11); c.quadraticCurveTo(-7, 8, 0, 12); c.quadraticCurveTo(7, 8, 14, 11); c.lineTo(14, -10); c.quadraticCurveTo(7, -13, 0, -9); c.closePath(); c.stroke(); c.beginPath(); c.moveTo(0, -9); c.lineTo(0, 12); c.stroke(); for (const sd of [-1, 1]) for (const y of [-4, 1]) { c.beginPath(); c.moveTo(sd * 4, y); c.lineTo(sd * 10, y - .5); c.stroke(); } }   // 了解歷史：攤開的書
  else { c.save(); c.rotate(.7); aRR(c, -2.6, -14, 5.2, 18, 2); c.stroke(); c.beginPath(); c.moveTo(-3.4, 4); c.quadraticCurveTo(0, 16, 3.4, 4); c.closePath(); c.fill(); c.restore(); c.beginPath(); c.moveTo(-12, 12); c.quadraticCurveTo(-4, 8, 2, 13); c.stroke(); }
  c.restore();
}
function dockPlate(kind, size = 220) {
  const cnv = document.createElement('canvas'); cnv.width = cnv.height = size;
  const c = cnv.getContext('2d'); c.scale(size / 100, size / 100);
  if (DOCK_STYLE !== 'plate') { DOCK_STYLES[DOCK_STYLE](c, kind); return cnv; }   // 手裡劍徽章＋框（B1／B2／B3）
  // 布帶（深藍，橫過金屬板後面）
  c.fillStyle = '#2a3a6a'; c.beginPath(); c.moveTo(0, 38); c.quadraticCurveTo(50, 30, 100, 38); c.lineTo(100, 64); c.quadraticCurveTo(50, 56, 0, 64); c.closePath(); c.fill(); aInk(c, 2);
  c.strokeStyle = 'rgba(255,255,255,.12)'; c.lineWidth = 1; for (let x = 6; x < 100; x += 8) { c.beginPath(); c.moveTo(x, 38); c.lineTo(x, 62); c.stroke(); }
  // 金屬板＋四角鉚釘
  aRR(c, 14, 12, 72, 76, 12); const mg = c.createLinearGradient(0, 12, 0, 88); mg.addColorStop(0, '#f4f6fa'); mg.addColorStop(.5, '#b8c0cc'); mg.addColorStop(1, '#8a94a4'); c.fillStyle = mg; c.fill(); aInk(c, 2.6);
  c.fillStyle = 'rgba(255,255,255,.45)'; aRR(c, 19, 16, 62, 8, 4); c.fill();
  for (const [x, y] of [[21, 19], [79, 19], [21, 81], [79, 81]]) { aCirc(c, x, y, 2.6); c.fillStyle = '#6a7484'; c.fill(); c.strokeStyle = INK; c.lineWidth = 1; c.stroke(); }
  // 刻在板上的圖案與文字
  c.save(); c.translate(50, 41); dockGlyph(c, kind, '#2a3240'); c.restore();
  const s = L(DOCK_LABEL[kind]); let fs = 15;
  c.font = `900 ${fs}px ${FONT}`; while (c.measureText(s).width > 62 && fs > 8) { fs -= .5; c.font = `900 ${fs}px ${FONT}`; }
  c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#2a3240'; c.fillText(s, 50, 71);
  return cnv;
}

// ===== 小天狗：木葉天狗「葉丸子」（頭和身體合成一顆圓球、超大眼睛＋小鉤嘴、頭頂嫩芽、葉子翅膀） =====
function drawLeafTengu(t, e, fl) {
  const c = ctx, W2 = col => fl ? '#ffffff' : col, hurt = e && e.hurt;
  const fly = Math.sin(t * 9 + (e ? e.bx || 0 : 0));
  const look = e && g && g.p ? (Math.sign(g.p.x - e.x) || 1) : 1;
  // 葉子翅膀（左右各三片，拍動）
  for (const sd of [-1, 1]) {
    c.save(); c.translate(sd * 8, 2); c.scale(sd, 1); c.rotate(-.4 - fly * .35);
    for (let i = 0; i < 3; i++) { c.save(); c.rotate(i * .5); c.scale(.75, .75); c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(10, -8, 24, -2); c.quadraticCurveTo(10, 6, 0, 0); c.fillStyle = W2(['#8fd06a', '#5fae4a', '#3f8a36'][i]); c.fill(); aInk(c, 1.9); if (!fl) { c.strokeStyle = 'rgba(20,60,20,.55)'; c.lineWidth = 1; c.beginPath(); c.moveTo(2, 0); c.lineTo(21, -2); c.stroke(); } c.restore(); }
    c.restore();
  }
  // 小爪子
  for (const sd of [-1, 1]) { c.save(); c.translate(sd * 5, 17); c.scale(.8, .8); for (const a of [-.5, 0, .5]) { c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.sin(a) * 6, 5); c.strokeStyle = INK; c.lineWidth = 2.6; c.stroke(); c.strokeStyle = W2('#e8a84a'); c.lineWidth = 1.4; c.stroke(); } aCirc(c, 0, 0, 2.6); aFI(c, W2('#e8a84a'), 1.2); c.restore(); }
  // 圓球身體
  aCirc(c, 0, 0, 17); c.fillStyle = fl ? '#ffffff' : bossBall(c, 0, 0, 17, '#d8b088', '#9a6a3c', '#6a4422'); c.fill(); aInk(c, 2.6);
  if (!fl) { c.fillStyle = '#f2e2c2'; aEll(c, 0, 8, 9, 7); c.fill(); }
  // 臉（朝向玩家）
  c.save(); c.scale(look, 1);
  if (hurt) { c.strokeStyle = INK; c.lineWidth = 2; c.lineCap = 'round'; for (const [ex, sd] of [[-6, 1], [6, -1]]) { c.beginPath(); c.moveTo(ex - sd * 3, -6); c.lineTo(ex + sd * 2.5, -3); c.lineTo(ex - sd * 3, 0); c.stroke(); } }
  else for (const sd of [-1, 1]) bossEye(c, sd * 6 + 1, -3, 5.2, 6, '#c86a10', '#ffd25a', { lid: aBlink(t, e ? e.bx || 0 : 0) ? .95 : 0, lidCol: '#9a6a3c' });
  c.beginPath(); c.moveTo(-1.2, 2); c.quadraticCurveTo(1, 4, 3.2, 2); c.lineTo(1, 6); c.closePath(); aFI(c, W2('#f2a81e'), 1.2);
  if (!fl) { c.fillStyle = 'rgba(255,120,150,.5)'; aEll(c, -10, 4, 2.6, 1.5); c.fill(); aEll(c, 12, 4, 2.6, 1.5); c.fill(); }
  c.restore();
  // 頭頂的嫩芽（跟著搖）
  c.save(); c.translate(0, -17); c.rotate(Math.sin(t * 3) * .2); c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-1, -6, 2, -9); c.strokeStyle = W2('#3f8a36'); c.lineWidth = 1.8; c.stroke(); c.beginPath(); c.moveTo(2, -9); c.quadraticCurveTo(9, -14, 12, -8); c.quadraticCurveTo(6, -6, 2, -9); c.fillStyle = W2('#8fd06a'); c.fill(); aInk(c, 1.2); c.restore();
}

// ===== 中魔王：山伏天狗（大頭圓壯身形＋金邊天狗面具、往上翹的小黃瓜鼻、金色怒目；右拳羽團扇、左拳金環錫杖、背後黑翼） =====
function tgWing(c, sd, len, h, n, col, edge, flap, tatter) {
  c.save(); c.scale(sd, 1); c.rotate(-flap * .35);
  const pts = [];
  for (let i = 0; i < n; i++) { const q = i / (n - 1), x = len * (.35 + .65 * Math.sin(q * Math.PI * .5 + .2)), y = -h * .55 + q * h * 1.15; pts.push([x, y]); }
  c.beginPath(); c.moveTo(0, -h * .2); c.quadraticCurveTo(len * .4, -h * .9, pts[0][0], pts[0][1]);
  pts.forEach(([x, y], i) => { const fl = tatter && i % 2 ? .82 : 1; c.lineTo(x * fl, y); if (i < n - 1) c.lineTo(x * .78, y + h * .06); });
  c.quadraticCurveTo(len * .3, h * .7, 0, h * .25); c.closePath();
  c.fillStyle = col; c.fill(); aInk(c, 2);
  c.strokeStyle = edge; c.lineWidth = 1.1;
  pts.forEach(([x, y]) => { c.beginPath(); c.moveTo(len * .18, y * .3); c.lineTo(x * .9, y); c.stroke(); });
  c.restore();
}
function tgBonten(c, x, y, r, col) { for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; aCirc(c, x + Math.cos(a) * r * .5, y + Math.sin(a) * r * .5, r * .55); c.fillStyle = col; c.fill(); } aCirc(c, x, y, r); c.strokeStyle = INK; c.lineWidth = 1.3; c.stroke(); }
function tgFan(c, x, y, s, rot, col, tip, eye) {   // 羽團扇
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s);
  c.beginPath(); c.rect(-1.6, 0, 3.2, 13); aFI(c, '#8e1c16', 1.2); aCirc(c, 0, 14, 2.2); aFI(c, '#e8b84a', 1);
  for (let i = 0; i < 9; i++) { const a = -Math.PI / 2 + (i - 4) * .27; c.save(); c.rotate(a + Math.PI / 2); c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-4, -12, 0, -24); c.quadraticCurveTo(4, -12, 0, 0); c.fillStyle = i % 2 ? col : tip; c.fill(); aInk(c, 1); if (eye) { aEll(c, 0, -18, 2.4, 3.2); c.fillStyle = eye[0]; c.fill(); aCirc(c, 0, -18, 1.2); c.fillStyle = eye[1]; c.fill(); } c.restore(); }
  c.restore();
}
function tgStaff(c, x0, y0, x1, y1) {   // 錫杖
  c.strokeStyle = INK; c.lineWidth = 4; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); c.strokeStyle = '#8a6a3a'; c.lineWidth = 2.2; c.stroke();
  aEll(c, x1, y1 - 5, 5, 7); c.strokeStyle = INK; c.lineWidth = 3.4; c.stroke(); c.strokeStyle = '#e8b84a'; c.lineWidth = 2; c.stroke();
  for (const sd of [-1, 1]) { aCirc(c, x1 + sd * 5, y1 - 2, 2.4); c.strokeStyle = '#e8b84a'; c.lineWidth = 1.4; c.stroke(); }
}
const TG_MX = -2, TG_MY = -14, TG_SKIN = '#f4c8a0';
// 往上微彎的小黃瓜鼻：粗線條＋圓頭，從面具中央往左伸、尾端往上翹
function tgNose(c) {
  const path = () => { c.beginPath(); c.moveTo(TG_MX - 1, TG_MY + 6); c.quadraticCurveTo(TG_MX - 22, TG_MY + 12, TG_MX - 36, TG_MY - 4); };
  c.lineCap = 'round';
  path(); c.strokeStyle = INK; c.lineWidth = 13; c.stroke();
  path(); c.strokeStyle = '#a02218'; c.lineWidth = 10; c.stroke();
  c.save(); c.translate(-1, -1.6); path(); c.strokeStyle = '#e0402e'; c.lineWidth = 7; c.stroke(); c.restore();
  c.save(); c.translate(-.5, -3.6); path(); c.strokeStyle = 'rgba(255,200,180,.75)'; c.lineWidth = 1.6; c.stroke(); c.restore();
  c.fillStyle = 'rgba(255,210,190,.6)'; for (const [x, y] of [[-16, 8], [-25, 5], [-31, 0]]) { aCirc(c, TG_MX + x, TG_MY + y, .9); c.fill(); }
}
// 大面具：金邊、額頭皺紋；eye：'gold' 細長金色怒目／'glow' 面具眼洞透出紅光／'white' 三白眼
function tgMask(c, eye, rim) {
  aEll(c, TG_MX, TG_MY, 25, 29); c.fillStyle = bossBall(c, TG_MX - 5, TG_MY - 8, 30, '#ff6a52', '#d02e26', '#82120e'); c.fill(); aInk(c, 2.6);
  c.save(); aEll(c, TG_MX, TG_MY, 25, 29); c.clip(); c.strokeStyle = rim; c.lineWidth = 3.6; aEll(c, TG_MX, TG_MY, 24, 28); c.stroke(); c.restore();
  c.strokeStyle = 'rgba(90,10,10,.6)'; c.lineWidth = 1.3; for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(TG_MX - 10 + i, TG_MY - 22 + i * 3); c.quadraticCurveTo(TG_MX, TG_MY - 26 + i * 3, TG_MX + 10 - i, TG_MY - 22 + i * 3); c.stroke(); }
  // 眼睛（兇狠版）
  for (const sd of [-1, 1]) {
    const ex = TG_MX + sd * 9.5, ey = TG_MY - 3;
    c.save(); c.translate(ex, ey); c.rotate(sd * .3);   // 外側往上吊
    if (eye === 'gold') {
      c.beginPath(); c.moveTo(-6.5, 1.5); c.quadraticCurveTo(0, -4, 6.5, -1.5); c.quadraticCurveTo(0, 3, -6.5, 1.5); c.closePath();
      c.fillStyle = '#ffd23a'; c.fill(); c.save(); c.clip(); aEll(c, -1, 0, 1.1, 3.4); c.fillStyle = INK; c.fill(); c.restore(); c.strokeStyle = INK; c.lineWidth = 1.8; c.stroke();
      bossGlow(c, 0, 0, 9, 'rgba(255,200,60,.35)');
    } else if (eye === 'glow') {
      c.beginPath(); c.moveTo(-7, 2); c.lineTo(-4, -3.5); c.lineTo(6.5, -2.5); c.lineTo(5, 2.5); c.closePath(); c.fillStyle = '#120808'; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.6; c.stroke();
      bossGlow(c, -.5, -.3, 10, 'rgba(255,60,40,.9)'); c.fillStyle = '#ff6a3a'; aEll(c, -.5, -.3, 2.2, 1.6); c.fill();
    } else {
      c.beginPath(); c.moveTo(-6.5, 1.5); c.quadraticCurveTo(0, -4.5, 6.5, -1); c.quadraticCurveTo(0, 3.5, -6.5, 1.5); c.closePath();
      c.fillStyle = '#ffffff'; c.fill(); c.save(); c.clip(); aCirc(c, -1.6, -.4, 1.5); c.fillStyle = INK; c.fill(); c.strokeStyle = 'rgba(200,40,40,.6)'; c.lineWidth = .6; c.beginPath(); c.moveTo(3, 0); c.lineTo(6, -1); c.moveTo(3.5, 1); c.lineTo(6, 1.5); c.stroke(); c.restore(); c.strokeStyle = INK; c.lineWidth = 1.8; c.stroke();
    }
    c.restore();
  }
  // 濃眉：往眉心狠狠壓下
  c.fillStyle = INK;
  for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(TG_MX + sd * 1.5, TG_MY - 6); for (let i = 0; i <= 5; i++) c.lineTo(TG_MX + sd * (3 + i * 3.2), TG_MY - 10 - i * 2.2 + (i % 2 ? -2.2 : 0)); c.lineTo(TG_MX + sd * 20, TG_MY - 16); c.quadraticCurveTo(TG_MX + sd * 11, TG_MY - 9, TG_MX + sd * 2.5, TG_MY - 3); c.closePath(); c.fill(); }
  c.strokeStyle = 'rgba(90,10,10,.7)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(TG_MX - 1.5, TG_MY - 8); c.lineTo(TG_MX - 1, TG_MY - 4); c.moveTo(TG_MX + 1.5, TG_MY - 8); c.lineTo(TG_MX + 1, TG_MY - 4); c.stroke();   // 眉心皺紋
}
function tgMouth(c, snarl) {
  if (snarl) { c.beginPath(); c.moveTo(TG_MX - 9, TG_MY + 16); c.quadraticCurveTo(TG_MX, TG_MY + 12, TG_MX + 9, TG_MY + 16); c.quadraticCurveTo(TG_MX, TG_MY + 22, TG_MX - 9, TG_MY + 16); c.closePath(); aFI(c, '#3a0a0a', 1.6); c.save(); c.clip(); c.fillStyle = '#fff'; for (let i = -3; i <= 3; i++) { c.beginPath(); c.moveTo(TG_MX + i * 2.4 - 1.1, TG_MY + 14); c.lineTo(TG_MX + i * 2.4, TG_MY + 17); c.lineTo(TG_MX + i * 2.4 + 1.1, TG_MY + 14); c.fill(); } c.restore(); }
  else { c.strokeStyle = INK; c.lineWidth = 2.2; c.beginPath(); c.moveTo(TG_MX - 9, TG_MY + 18); c.quadraticCurveTo(TG_MX, TG_MY + 12, TG_MX + 9, TG_MY + 18); c.stroke(); }
  c.fillStyle = INK; for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(TG_MX + sd * 1, TG_MY + 11); c.quadraticCurveTo(TG_MX + sd * 10, TG_MY + 8, TG_MX + sd * 16, TG_MY + 15); c.quadraticCurveTo(TG_MX + sd * 12, TG_MY + 11.5, TG_MX + sd * 10, TG_MY + 13); c.quadraticCurveTo(TG_MX + sd * 5, TG_MY + 12, TG_MX + sd * 1, TG_MY + 13.5); c.closePath(); c.fill(); }
  c.beginPath(); c.moveTo(TG_MX - 3, TG_MY + 22); c.lineTo(TG_MX, TG_MY + 29); c.lineTo(TG_MX + 3, TG_MY + 22); c.closePath(); c.fill();
}
// 和真妖鬼同比例的圓壯身體：山伏背心（深藍）＋白襟＋紫袴＋梵天球；浮空拳頭與木屐
function tgBody(c, t, o) {
  heroSilhouette(c, [
    { path: c => { c.beginPath(); c.moveTo(-20, 14); c.quadraticCurveTo(0, 8, 20, 14); c.quadraticCurveTo(25, 28, 16, 39); c.quadraticCurveTo(0, 43, -16, 39); c.quadraticCurveTo(-25, 28, -20, 14); c.closePath(); }, fill: '#f4f2ea',
      after: c => { c.save(); c.clip();
        c.fillStyle = o.vest; c.beginPath(); c.moveTo(-26, 10); c.lineTo(-6, 10); c.lineTo(-4, 30); c.lineTo(-26, 30); c.closePath(); c.fill(); c.beginPath(); c.moveTo(26, 10); c.lineTo(6, 10); c.lineTo(4, 30); c.lineTo(26, 30); c.closePath(); c.fill();
        c.fillStyle = o.hakama; c.fillRect(-27, 30, 54, 14); c.fillStyle = 'rgba(0,0,0,.25)'; for (const x of [-12, -2, 8]) c.fillRect(x, 30, 1.6, 14);
        c.fillStyle = '#e8b84a'; c.fillRect(-27, 28, 54, 3);
        c.strokeStyle = INK; c.lineWidth = 1.4; c.beginPath(); c.moveTo(-6, 11); c.lineTo(2, 24); c.moveTo(6, 11); c.lineTo(0, 20); c.stroke();
        c.restore(); } },
  ], 2.2);
  for (const [x, y] of [[-12, 17], [12, 17], [-12, 25], [12, 25]]) tgBonten(c, x, y, 2.8, '#ff8a2a');
  bossTabi(c, -12, 44, 7.5, -1, { geta: 1 }); bossTabi(c, 12, 44, 7.5, 1, { geta: 1 });
}
function tgHead(c) {
  aCirc(c, TG_MX + 8, TG_MY - 3, 25); c.fillStyle = TG_SKIN; c.fill(); aInk(c, 2.4);
  c.strokeStyle = INK; c.lineWidth = 4.4; c.beginPath(); c.moveTo(TG_MX + 14, TG_MY - 12); c.quadraticCurveTo(TG_MX + 30, TG_MY - 8, TG_MX + 32, TG_MY + 2); c.stroke();
  aEll(c, TG_MX + 30, TG_MY + 5, 4.6, 6.4); c.fillStyle = TG_SKIN; c.fill(); aInk(c, 1.8);
}
function tgTokin(c, crest) {
  c.save(); c.translate(TG_MX + 1, TG_MY - 31);
  c.beginPath(); c.moveTo(-15, 7); c.lineTo(-13, -7); c.lineTo(0, -13); c.lineTo(13, -7); c.lineTo(15, 7); c.quadraticCurveTo(0, 10, -15, 7); c.closePath(); aFI(c, '#1c1c22', 2.2);
  c.fillStyle = 'rgba(255,255,255,.18)'; c.beginPath(); c.moveTo(-10, -6); c.lineTo(0, -10); c.lineTo(-2, -3); c.closePath(); c.fill();
  c.fillStyle = crest; c.beginPath(); c.moveTo(-5, 1); c.lineTo(-4, -3.5); c.lineTo(-1.5, -1); c.lineTo(0, -5); c.lineTo(1.5, -1); c.lineTo(4, -3.5); c.lineTo(5, 1); c.closePath(); c.fill();
  c.restore();
}
// 遊戲中的山伏天狗：臉朝向玩家（預設朝左）；蓄力時把羽團扇舉高；被斬中時閃白
function drawYamaTengu(t, e, look) {
  const c = ctx, fl = e && e.flash > 0, warn = e && e.warn;
  c.save(); c.scale(-look, 1);   // 設計稿朝左，玩家在右邊時翻過來
  const draw = c => {
    const fw = Math.sin(t * 4);
    c.save(); c.translate(0, -6); tgWing(c, -1, 56, 46, 7, '#16171e', '#3a3e56', fw * .4); tgWing(c, 1, 56, 46, 7, '#16171e', '#3a3e56', fw * .4); c.restore();
    tgStaff(c, 38, 36, 40, -36);
    tgBody(c, t, { vest: '#2a3a6a', hakama: '#3a2a5a' });
    tgHead(c); tgMask(c, 'gold', '#ffd25a'); tgMouth(c, warn ? 1 : 0); tgTokin(c, '#ffd25a'); tgNose(c);
    const fy = warn ? -16 : 6, fr = warn ? -.75 + Math.sin(t * 18) * .12 : -.35 + Math.sin(t * 2) * .08;
    tgFan(c, -38, fy, .85, fr, '#ffffff', '#e8eef4');
    bossFist(c, -37, fy + 7, 9, TG_SKIN, '#c89a78', { rot: -Math.PI / 2 + .2, flip: 1, cuff: '#2a3a6a', cuffLine: '#ffd25a' });
    bossFist(c, 38, 13, 9, TG_SKIN, '#c89a78', { rot: Math.PI / 2 - .2, cuff: '#2a3a6a', cuffLine: '#ffd25a' });
  };
  draw(c);
  if (fl && typeof drawSil === 'function') drawSil(0, 0, 150, 150, 75, 85, 'rgba(255,255,255,.85)', draw);
  c.restore();
}

// ===== 底部選單：手裡劍徽章＋框（B1 鋼框方牌／B2 金環圓徽／B3 朱漆八角框）；網址 ?dock=b1|b2|b3 可預覽 =====
let DOCK_STYLE = new URLSearchParams(location.search).get('dock') || 'plate';   // 遊戲使用「護額」
function dkShuriken(c, x, y, R, r) {
  c.save(); c.translate(x, y); c.rotate(Math.PI / 4);
  c.beginPath(); for (let i = 0; i < 8; i++) { const rr = i % 2 ? r : R, a = i * Math.PI / 4; c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } c.closePath();
  const sg = c.createLinearGradient(-R, -R, R, R); sg.addColorStop(0, '#f2f5fa'); sg.addColorStop(1, '#78828f'); c.fillStyle = sg; c.fill(); aInk(c, 2.4);
  c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 1; for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; c.beginPath(); c.moveTo(Math.cos(a) * r * 1.2, Math.sin(a) * r * 1.2); c.lineTo(Math.cos(a) * R * .85, Math.sin(a) * R * .85); c.stroke(); }
  c.restore();
}
function dkBadge(c, k, x, y, r) { aCirc(c, x, y, r); c.fillStyle = '#20262c'; c.fill(); aInk(c, 2.2); c.save(); c.translate(x, y); c.scale(r / 21, r / 21); dockGlyph(c, k, '#ffd25a', 3.4); c.restore(); }
function dkRibbon(c, k, y, col = '#c0262d') {
  c.beginPath(); c.moveTo(12, y - 8); c.lineTo(88, y - 8); c.lineTo(82, y); c.lineTo(88, y + 8); c.lineTo(12, y + 8); c.lineTo(18, y); c.closePath(); c.fillStyle = col; c.fill(); aInk(c, 2);
  const s = L(DOCK_LABEL[k]); let fs = 14; c.font = `900 ${fs}px ${FONT}`; while (c.measureText(s).width > 58 && fs > 8) { fs -= .5; c.font = `900 ${fs}px ${FONT}`; }
  c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#fff'; c.fillText(s, 50, y + .5);
}
const DOCK_STYLES_LIST = [
  ['B1　鋼框方牌', '深色鐵框方牌、四角金鉚釘，裡面是手裡劍徽章，下方紅布條寫字', (c, k) => {
    aRR(c, 3, 3, 94, 94, 14); const fg = c.createLinearGradient(0, 3, 0, 97); fg.addColorStop(0, '#5a6270'); fg.addColorStop(1, '#2a3038'); c.fillStyle = fg; c.fill(); aInk(c, 3);
    aRR(c, 10, 10, 80, 80, 9); c.fillStyle = '#1a2026'; c.fill(); c.strokeStyle = 'rgba(255,255,255,.18)'; c.lineWidth = 1.4; c.stroke();
    for (const [x, y] of [[9, 9], [91, 9], [9, 91], [91, 91]]) { aCirc(c, x, y, 3.4); c.fillStyle = '#e8b84a'; c.fill(); aInk(c, 1.2); }
    dkShuriken(c, 50, 42, 34, 12); dkBadge(c, k, 50, 42, 15);
    dkRibbon(c, k, 77);
  }],
  ['B2　金環圓徽', '粗金色圓環當框、內圈深藍，手裡劍和徽章在中間，布條橫過下緣', (c, k) => {
    aCirc(c, 50, 46, 44); const rg = c.createLinearGradient(0, 2, 0, 90); rg.addColorStop(0, '#fff0a8'); rg.addColorStop(.5, '#e8b84a'); rg.addColorStop(1, '#9a6a1a'); c.fillStyle = rg; c.fill(); aInk(c, 3);
    aCirc(c, 50, 46, 36); c.fillStyle = '#1e2a4a'; c.fill(); aInk(c, 2);
    c.strokeStyle = 'rgba(122,74,16,.7)'; c.lineWidth = 1.2; for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; c.beginPath(); c.moveTo(50 + Math.cos(a) * 38, 46 + Math.sin(a) * 38); c.lineTo(50 + Math.cos(a) * 42, 46 + Math.sin(a) * 42); c.stroke(); }
    dkShuriken(c, 50, 44, 30, 11); dkBadge(c, k, 50, 44, 13.5);
    dkRibbon(c, k, 82);
  }],
  ['B3　朱漆八角框', '紅漆八角形外框、內緣一圈金線，像神社的額匾；文字在下方黑色帶上', (c, k) => {
    const oct = (r, cy) => { c.beginPath(); for (let i = 0; i < 8; i++) { const a = Math.PI / 8 + i * Math.PI / 4; c.lineTo(50 + Math.cos(a) * r, cy + Math.sin(a) * r); } c.closePath(); };
    oct(50, 50); const lg = c.createLinearGradient(0, 0, 0, 100); lg.addColorStop(0, '#e0463a'); lg.addColorStop(1, '#8e1c16'); c.fillStyle = lg; c.fill(); aInk(c, 3);
    oct(41, 50); c.fillStyle = '#20180f'; c.fill(); c.strokeStyle = '#e8b84a'; c.lineWidth = 2.2; c.stroke();
    dkShuriken(c, 50, 42, 28, 10); dkBadge(c, k, 50, 42, 12.5);
    c.fillStyle = '#0e0e10'; c.fillRect(18, 66, 64, 15); c.strokeStyle = '#e8b84a'; c.lineWidth = 1.2; c.strokeRect(18, 66, 64, 15);
    const s = L(DOCK_LABEL[k]); let fs = 13; c.font = `900 ${fs}px ${FONT}`; while (c.measureText(s).width > 58 && fs > 8) { fs -= .5; c.font = `900 ${fs}px ${FONT}`; }
    c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#ffe28a'; c.fillText(s, 50, 74);
  }],
];
const DOCK_STYLES = { b1: DOCK_STYLES_LIST[0][2], b2: DOCK_STYLES_LIST[1][2], b3: DOCK_STYLES_LIST[2][2] };

// ===== 主畫面左上角的商店圖示（三案；網址 ?shop=a|b|c 可預覽） =====
let SHOP_STYLE = new URLSearchParams(location.search).get('shop') || 'c';   // 遊戲使用 C 千兩箱
function shopIcon(style = SHOP_STYLE, size = 200, open = true) {
  const cnv = document.createElement('canvas'); cnv.width = cnv.height = size;
  const c = cnv.getContext('2d'); c.scale(size / 100, size / 100);
  const label = L(DOCK_LABEL.shop);
  const fitText = (s, max, fs0) => { let fs = fs0; c.font = `900 ${fs}px ${FONT}`; while (c.measureText(s).width > max && fs > 8) { fs -= .5; c.font = `900 ${fs}px ${FONT}`; } };
  if (style === 'b') {   // 暖簾：木桿上掛著深藍布簾，中間白色圓紋寫「商店」
    c.fillStyle = 'rgba(0,0,0,.3)'; aEll(c, 50, 94, 36, 4); c.fill();
    for (let i = 0; i < 3; i++) {
      const x = 14 + i * 24.5, sw = Math.sin(i * 1.7) * 1.5;
      c.beginPath(); c.moveTo(x, 18); c.lineTo(x + 22, 18); c.lineTo(x + 22 + sw, 86); c.quadraticCurveTo(x + 11 + sw, 90, x + sw, 86); c.closePath();
      const ng = c.createLinearGradient(0, 18, 0, 88); ng.addColorStop(0, '#2c4a8a'); ng.addColorStop(1, '#1a2c5a'); c.fillStyle = ng; c.fill(); aInk(c, 2);
    }
    c.fillStyle = 'rgba(255,255,255,.12)'; c.fillRect(14, 22, 72, 3);
    aRR(c, 6, 11, 88, 9, 4); const wg = c.createLinearGradient(0, 11, 0, 20); wg.addColorStop(0, '#b0743a'); wg.addColorStop(1, '#6a3e1a'); c.fillStyle = wg; c.fill(); aInk(c, 2);
    for (const x of [6, 94]) { aCirc(c, x, 15.5, 5); aFI(c, '#e8b84a', 1.6); }
    aCirc(c, 50, 54, 22); c.fillStyle = '#f4efe2'; c.fill(); aInk(c, 2); aCirc(c, 50, 54, 18.5); c.strokeStyle = '#2c4a8a'; c.lineWidth = 1.4; c.stroke();
    c.save(); c.translate(50, 47); c.scale(.62, .62); dockGlyph(c, 'shop', '#1a2c5a', 4); c.restore();
    fitText(label, 30, 10); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#1a2c5a'; c.fillText(label, 50, 63);
  } else if (style === 'c' && !open) {   // 千兩箱（關著）：圓頂蓋子蓋好，縫隙透出金光；點下去才換成打開的樣子
    c.fillStyle = 'rgba(0,0,0,.3)'; aEll(c, 50, 92, 38, 4); c.fill();
    bossGlow(c, 50, 48, 34, 'rgba(255,220,120,.35)');
    aRR(c, 14, 48, 72, 32, 5); const bg = c.createLinearGradient(0, 48, 0, 80); bg.addColorStop(0, '#a8682e'); bg.addColorStop(1, '#6a3e1a'); c.fillStyle = bg; c.fill(); aInk(c, 2.4);
    c.beginPath(); c.moveTo(14, 50); c.lineTo(14, 38); c.quadraticCurveTo(14, 22, 50, 22); c.quadraticCurveTo(86, 22, 86, 38); c.lineTo(86, 50); c.closePath();   // 圓頂蓋
    const lg = c.createLinearGradient(0, 22, 0, 50); lg.addColorStop(0, '#c07a38'); lg.addColorStop(1, '#7a4620'); c.fillStyle = lg; c.fill(); aInk(c, 2.4);
    c.fillStyle = 'rgba(255,255,255,.18)'; aEll(c, 36, 30, 14, 3.4, -.1); c.fill();
    c.fillStyle = '#2a2a30'; for (const x of [28, 68]) { c.fillRect(x, 23, 4, 57); }
    c.fillStyle = '#ffe9a0'; c.fillRect(16, 48, 68, 2.6);   // 蓋縫的金光
    c.fillStyle = 'rgba(255,233,160,.55)'; c.fillRect(16, 45.5, 68, 1.6);
    for (const [x, y] of [[14, 74], [80, 74]]) { c.fillStyle = '#e8b84a'; c.fillRect(x, y, 6, 6); }
    aRR(c, 42, 42, 16, 16, 3); aFI(c, '#e8b84a', 1.8); aCirc(c, 50, 48.5, 2.2); c.fillStyle = INK; c.fill(); c.fillRect(49, 49, 2, 5);   // 鎖
    c.beginPath(); c.moveTo(10, 82); c.lineTo(90, 82); c.lineTo(84, 90); c.lineTo(90, 98); c.lineTo(10, 98); c.lineTo(16, 90); c.closePath(); c.fillStyle = '#c0262d'; c.fill(); aInk(c, 2);
    fitText(label, 58, 13); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#fff'; c.fillText(label, 50, 90.5);
  } else if (style === 'c') {   // 千兩箱：打開的木箱裝滿小判，閃閃發光，下方紅布條
    c.fillStyle = 'rgba(0,0,0,.3)'; aEll(c, 50, 92, 38, 4); c.fill();
    bossGlow(c, 50, 40, 42, 'rgba(255,220,120,.55)');
    c.save(); c.translate(50, 34); c.rotate(-.18); aRR(c, -34, -16, 68, 16, 4); aFI(c, '#8a5428', 2.2); c.fillStyle = '#e8b84a'; c.fillRect(-34, -16, 6, 16); c.fillRect(28, -16, 6, 16); c.restore();   // 打開的蓋子
    for (const [x, y, r] of [[34, 42, 1], [48, 38, 1.1], [62, 42, 1], [41, 47, .9], [56, 47, .9]]) drawKoban(c, x, y, 7 * r, 9.5 * r, 1, x);
    aRR(c, 14, 46, 72, 34, 5); const bg = c.createLinearGradient(0, 46, 0, 80); bg.addColorStop(0, '#a8682e'); bg.addColorStop(1, '#6a3e1a'); c.fillStyle = bg; c.fill(); aInk(c, 2.4);
    c.fillStyle = '#2a2a30'; for (const y of [52, 72]) c.fillRect(14, y, 72, 4);
    for (const [x, y] of [[14, 46], [80, 46], [14, 74], [80, 74]]) { c.fillStyle = '#e8b84a'; c.fillRect(x, y, 6, 6); }
    aRR(c, 44, 56, 12, 12, 2); aFI(c, '#e8b84a', 1.6); aCirc(c, 50, 61, 1.8); c.fillStyle = INK; c.fill();
    for (const [x, y, r] of [[22, 22, 4], [80, 26, 3.4], [68, 14, 2.6]]) drawStar4(c, x, y, r, .4, '#fff6c8');
    c.beginPath(); c.moveTo(10, 82); c.lineTo(90, 82); c.lineTo(84, 90); c.lineTo(90, 98); c.lineTo(10, 98); c.lineTo(16, 90); c.closePath(); c.fillStyle = '#c0262d'; c.fill(); aInk(c, 2);
    fitText(label, 58, 13); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#fff'; c.fillText(label, 50, 90.5);
  } else {   // 錢袋金環：和底部選單同款的金色圓環，裡面放紫色錢袋＋小判，紅布條寫字
    aCirc(c, 50, 46, 44); const rg = c.createLinearGradient(0, 2, 0, 90); rg.addColorStop(0, '#fff0a8'); rg.addColorStop(.5, '#e8b84a'); rg.addColorStop(1, '#9a6a1a'); c.fillStyle = rg; c.fill(); aInk(c, 3);
    aCirc(c, 50, 46, 36); c.fillStyle = '#3a1a4a'; c.fill(); aInk(c, 2);
    c.strokeStyle = 'rgba(122,74,16,.7)'; c.lineWidth = 1.2; for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; c.beginPath(); c.moveTo(50 + Math.cos(a) * 38, 46 + Math.sin(a) * 38); c.lineTo(50 + Math.cos(a) * 42, 46 + Math.sin(a) * 42); c.stroke(); }
    c.save(); c.translate(46, 46); c.scale(1.15, 1.15);
    c.beginPath(); c.moveTo(-14, -6); c.quadraticCurveTo(-20, 16, -2, 18); c.quadraticCurveTo(14, 18, 12, -6); c.quadraticCurveTo(0, -10, -14, -6); c.closePath(); aFI(c, '#8a4ac0', 2);
    c.beginPath(); c.moveTo(-14, -6); c.lineTo(-17, -14); c.lineTo(-8, -10); c.lineTo(-1, -16); c.lineTo(5, -10); c.lineTo(14, -14); c.lineTo(12, -6); c.closePath(); aFI(c, '#a86ad8', 1.8);
    c.strokeStyle = '#f2c14e'; c.lineWidth = 2.4; c.beginPath(); c.moveTo(-13, -6); c.quadraticCurveTo(-1, -2, 12, -6); c.stroke();
    c.fillStyle = 'rgba(255,255,255,.25)'; aEll(c, -7, 4, 3, 5, -.3); c.fill();
    drawKoban(c, 12, 8, 7, 9.5, 1, 0);
    c.restore();
    dkRibbon(c, 'shop', 82);
  }
  return cnv;
}

// ===== 「開始修行」按鈕的底圖（三案；網址 ?start=a|b|c 預覽；文字仍是網頁文字，會跟著換語言） =====
let START_STYLE = new URLSearchParams(location.search).get('start') || 'a';   // 遊戲使用 A 卷軸
function startBg(style, w = 320, h = 96) {
  const cnv = document.createElement('canvas'); cnv.width = w * 2; cnv.height = h * 2;
  const c = cnv.getContext('2d'); c.scale(2, 2);
  if (style === 'a') {   // 卷軸：兩端木軸、米色紙面、紅色毛筆底紋、右邊朱印「忍」
    const px = 18, pw = w - 36;
    c.fillStyle = 'rgba(0,0,0,.35)'; aRR(c, px, 14, pw, h - 22, 4); c.fill();
    aRR(c, px, 8, pw, h - 22, 3); const pg = c.createLinearGradient(0, 8, 0, h - 14); pg.addColorStop(0, '#fbf3df'); pg.addColorStop(1, '#e6d2a6'); c.fillStyle = pg; c.fill(); aInk(c, 3);
    c.fillStyle = 'rgba(192,38,45,.85)'; c.beginPath(); c.moveTo(px + 26, h * .5 - 14); c.quadraticCurveTo(w * .5, h * .5 - 24, w - px - 50, h * .5 - 12); c.lineTo(w - px - 40, h * .5 + 2); c.quadraticCurveTo(w * .5, h * .5 + 12, px + 20, h * .5 + 4); c.closePath(); c.fill();   // 毛筆底紋
    c.fillStyle = 'rgba(192,38,45,.5)'; for (const [x, y, r] of [[px + 18, h * .5 - 10, 2.4], [w - px - 36, h * .5 + 8, 2], [w * .6, h * .5 - 22, 1.6]]) { aCirc(c, x, y, r); c.fill(); }
    for (const x of [px, w - px]) { aRR(c, x - 9, 2, 18, h - 10, 6); const wg = c.createLinearGradient(x - 9, 0, x + 9, 0); wg.addColorStop(0, '#4a2a14'); wg.addColorStop(.45, '#a8663a'); wg.addColorStop(1, '#4a2a14'); c.fillStyle = wg; c.fill(); aInk(c, 2.6); for (const y of [2, h - 8]) { aEll(c, x, y, 11, 4.6); aFI(c, '#e8b84a', 2); } }
    aRR(c, w - px - 40, h - 40, 22, 22, 3); aFI(c, '#c0262d', 2); c.fillStyle = '#fff'; c.font = '900 14px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('忍', w - px - 29, h - 28.5);
  } else if (style === 'b') {   // 刀身：左邊是柄與鍔，右邊是刀尖；文字寫在刀身上
    const y0 = 16, y1 = h - 20, my = (y0 + y1) / 2;
    c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.moveTo(70, y0 + 6); c.lineTo(w - 44, y0 + 6); c.lineTo(w - 6, my + 6); c.lineTo(w - 44, y1 + 6); c.lineTo(70, y1 + 6); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(66, y0); c.lineTo(w - 46, y0); c.quadraticCurveTo(w - 16, y0 + 4, w - 8, my); c.quadraticCurveTo(w - 30, y1, w - 52, y1); c.lineTo(66, y1); c.closePath();
    const bg = c.createLinearGradient(0, y0, 0, y1); bg.addColorStop(0, '#ffffff'); bg.addColorStop(.45, '#d8dee8'); bg.addColorStop(1, '#8a94a4'); c.fillStyle = bg; c.fill(); aInk(c, 3);
    c.strokeStyle = 'rgba(120,150,190,.7)'; c.lineWidth = 1.4; c.beginPath(); for (let x = 70; x < w - 40; x += 10) c.lineTo(x, y1 - 9 + ((x / 10) % 2 ? -2.5 : 1.5)); c.stroke();   // 刃紋
    c.fillStyle = '#e8b84a'; aRR(c, 56, y0 - 8, 12, y1 - y0 + 16, 4); c.fill(); aInk(c, 2.4);   // 鍔
    aRR(c, 6, y0 + 4, 52, y1 - y0 - 8, 6); c.fillStyle = '#1c1c26'; c.fill(); aInk(c, 2.4);   // 柄
    c.fillStyle = '#f2f2f2'; for (let i = 0; i < 4; i++) { const x = 12 + i * 11; c.beginPath(); c.moveTo(x, my); c.lineTo(x + 5, my - 6); c.lineTo(x + 10, my); c.lineTo(x + 5, my + 6); c.closePath(); c.fill(); }
    c.fillStyle = '#c0262d'; c.beginPath(); c.moveTo(8, my); c.quadraticCurveTo(-2, my + 18, 6, h - 2); c.lineTo(10, h - 4); c.quadraticCurveTo(4, my + 16, 12, my + 2); c.closePath(); c.fill();   // 下緒
  } else {   // 朱漆護符：紅漆板、金色雙邊框、青海波紋，兩端掛著黑色繩結與流蘇
    c.fillStyle = 'rgba(0,0,0,.35)'; aRR(c, 22, 14, w - 44, h - 22, 12); c.fill();
    aRR(c, 22, 8, w - 44, h - 22, 12); const rg = c.createLinearGradient(0, 8, 0, h - 14); rg.addColorStop(0, '#ef4a3a'); rg.addColorStop(1, '#8e1c16'); c.fillStyle = rg; c.fill(); aInk(c, 3);
    c.save(); aRR(c, 22, 8, w - 44, h - 22, 12); c.clip(); c.strokeStyle = 'rgba(255,220,180,.13)'; c.lineWidth = 1.2;
    for (let y = 18, row = 0; y < h; y += 9, row++) for (let x = 22 + (row % 2) * 9; x < w; x += 18) for (const r of [9, 6, 3]) { c.beginPath(); c.arc(x, y, r, Math.PI, 0); c.stroke(); }
    c.restore();
    aRR(c, 29, 14, w - 58, h - 34, 8); c.strokeStyle = '#e8b84a'; c.lineWidth = 2.2; c.stroke(); aRR(c, 33, 18, w - 66, h - 42, 6); c.lineWidth = 1; c.stroke();
    for (const sd of [-1, 1]) {   // 繩結＋流蘇
      const x = sd < 0 ? 22 : w - 22, y = h * .5 - 4;
      c.strokeStyle = INK; c.lineWidth = 4; c.beginPath(); c.arc(x - sd * 2, y - 4, 6, 0, Math.PI * 2); c.stroke(); c.strokeStyle = '#2a2a30'; c.lineWidth = 2.4; c.stroke();
      c.fillStyle = '#2a2a30'; c.beginPath(); c.moveTo(x - 4, y + 2); c.lineTo(x + 4, y + 2); c.lineTo(x + 6, y + 22); c.lineTo(x - 6, y + 22); c.closePath(); c.fill(); aInk(c, 1.2);
      aRR(c, x - 4.5, y + 1, 9, 4, 1.5); aFI(c, '#e8b84a', 1);
    }
  }
  return cnv;
}
