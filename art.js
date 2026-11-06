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

function drawFoeNinja(type, t, e, look, near) {
  const c = ctx, ed = ENEMY[type], fl = e && e.flash > 0, P = fl ? WHITE_PAL : FOE[type];
  const u = ed.h / 44, fat = type === 2, warn = e && e.warn, atk = e && e.atk > 0;
  const seed = e ? e.bx || 0 : 0, bob = Math.sin(t * 5 + seed) * 1.6;
  c.save(); c.scale(u * look, u); c.translate(0, bob);
  const legSw = Math.sin(t * 4 + seed) * 2.2;
  const alarm = near && type !== 6 && type !== 4 && !warn;
  // --- 背後的東西 ---
  if (type === 6 && !fl) { // 菁英：紫色火焰光環
    for (let i = 0; i < 7; i++) {
      const a = i / 7 * TAU + t * 1.5, r = 22 + Math.sin(t * 7 + i * 2) * 3;
      c.fillStyle = `rgba(170,110,255,${.18 + .08 * Math.sin(t * 9 + i)})`;
      c.beginPath(); c.moveTo(Math.cos(a - .35) * 12, Math.sin(a - .35) * 12 + 2); c.lineTo(Math.cos(a) * r, Math.sin(a) * r + 2); c.lineTo(Math.cos(a + .35) * 12, Math.sin(a + .35) * 12 + 2); c.fill();
    }
  }
  if (type === 0 || type === 1 || type === 11) { // 背上的刀
    c.save(); c.rotate(-.75);
    c.beginPath(); c.rect(-16, -2.2, 26, 4.4); aFI(c, P.dk, 1.6);
    c.beginPath(); c.rect(10, -2.6, 2.5, 5.2); aFI(c, fl ? '#fff' : '#c9a14a', 1.2);
    c.restore();
  }
  if (type === 9) { // 箭筒
    c.save(); c.rotate(.5); c.beginPath(); c.rect(-15, -3, 18, 6); aFI(c, fl ? '#fff' : '#7a5230', 1.5);
    for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(-15, -2 + i * 2); c.lineTo(-20, -3 + i * 3); c.strokeStyle = fl ? '#fff' : '#e8e0d0'; c.lineWidth = 1.4; c.stroke(); }
    c.restore();
  }
  if (type === 5) { // 背上的大炸彈＋引信火花
    aCirc(c, -10, 3, 10); aFI(c, fl ? '#fff' : '#1c1c22', 2);
    if (!fl) { aCirc(c, -13, -1, 3); c.fillStyle = 'rgba(255,255,255,.35)'; c.fill(); }
    c.beginPath(); c.moveTo(-12, -7); c.quadraticCurveTo(-16, -14, -12, -17); c.strokeStyle = fl ? '#fff' : '#a07040'; c.lineWidth = 2; c.stroke();
    if (!fl) for (let i = 0; i < 5; i++) { const a = t * 20 + i * 1.26, r = 2.5 + (i % 2) * 2.5; c.fillStyle = i % 2 ? '#ffd25a' : '#ff6a1a'; c.fillRect(-12 + Math.cos(a) * r - 1, -17 + Math.sin(a) * r - 1, 2, 2); }
  }
  // --- 腳 ---
  if (type === 4) { // 盾忍者：蹲在盾牌上
    aLimb(c, [-4, 12, -8, 15, -6, 19], 4.6, P.dk); aLimb(c, [4, 12, 8, 15, 6, 19], 4.6, P.dk);
  } else {
    aLimb(c, [-4, 12, -5 + legSw, 20], 4.6, P.dk); aLimb(c, [4, 12, 5 - legSw, 20], 4.6, P.dk);
  }
  // --- 後手 ---
  const handB = type === 6 ? [-2, 6] : alarm ? [-12, -6] : [-11, 9 + Math.sin(t * 5 + seed) * 1.5];
  if (type !== 6) aLimb(c, [-6, 2, handB[0], handB[1]], 4.2, P.suit);
  // --- 身體 ---
  if (fat) { aEll(c, 0, 6, 14, 10.5); aFI(c, P.suit); if (!fl) { aEll(c, -5, 3, 4, 3); c.fillStyle = 'rgba(255,255,255,.12)'; c.fill(); } }
  else { rr(-8.5, -1, 17, 14, 6); aFI(c, P.suit); }
  if (!fl) { c.beginPath(); c.moveTo(-6, 0); c.lineTo(3, 9); c.strokeStyle = P.dk; c.lineWidth = 1.6; c.stroke(); }   // 衣襟
  c.fillStyle = P.dk; c.fillRect(fat ? -13 : -8.5, 7, fat ? 26 : 17, 2.6);                                            // 腰帶
  if (type === 1 && !fl) { aEll(c, 5, 1, 4.5, 3, -.3); aFI(c, P.guard, 1.5); }                                         // 肩甲
  if (type === 11 && !fl) { c.fillStyle = '#8a6a3e'; for (const [dx, dy] of [[-4, 4], [3, 10], [5, 2]]) { aCirc(c, dx, dy, 1.4); c.fill(); } }  // 身上的泥土
  // --- 頭（兜帽） ---
  c.beginPath(); c.arc(0, -10, 11.5, 0, TAU); c.moveTo(-9, -17); c.quadraticCurveTo(-13, -24, -6, -21);   // 兜帽尖
  aFI(c, P.suit);
  if (!fl) { aEll(c, -4, -15, 4, 2.5, -.5); c.fillStyle = 'rgba(255,255,255,.12)'; c.fill(); }
  // 頭巾＋飄動的結
  c.save(); aCirc(c, 0, -10, 11.5); c.clip(); c.fillStyle = P.band; c.fillRect(-13, -16, 26, 3.6); c.restore();
  c.beginPath(); c.rect(-12, -16, 24, 3.6); aInk(c, 1.2);
  const fw = Math.sin(t * 9 + seed) * 2.5;
  c.beginPath(); c.moveTo(-10, -14); c.quadraticCurveTo(-17, -16 + fw, -22, -12 + fw); c.lineTo(-20, -10 + fw); c.quadraticCurveTo(-16, -12, -10, -12); c.closePath();
  aFI(c, P.band, 1.4);
  if (type === 6 && !fl) { c.beginPath(); c.moveTo(2, -17); c.lineTo(4, -14); c.lineTo(2, -11); c.lineTo(0, -14); c.closePath(); aFI(c, '#fff6c8', 1); }   // 菁英頭巾徽章
  // 臉（面罩開口）與眼睛：朝向玩家
  aEll(c, 3, -8.5, 8, 4.3); aFI(c, P.skin, 1.4);
  const blink = e && aBlink(t, seed), eyeY = -8.5;
  for (const ex of [0, 6]) {
    if (blink) { c.beginPath(); c.moveTo(ex - 1.8, eyeY); c.lineTo(ex + 1.8, eyeY); c.strokeStyle = INK; c.lineWidth = 1.4; c.stroke(); continue; }
    aEll(c, ex, eyeY, 2.2, 2.6); c.fillStyle = '#fff'; c.fill();
    aCirc(c, ex + .9, eyeY + (warn ? -.4 : .2), 1.35); c.fillStyle = type === 6 && !fl ? P.eye : INK; c.fill();
    // 眉毛：生氣的斜線；警戒時更斜
    c.beginPath(); c.moveTo(ex - 2.4, eyeY - 4.2 + (ex ? 1.2 : 0)); c.lineTo(ex + 2.4, eyeY - 4.2 + (ex ? 0 : 1.2) + (warn || alarm ? (ex ? .8 : -.8) : 0));
    c.strokeStyle = INK; c.lineWidth = 1.3; c.stroke();
  }
  if (type === 5 && near && !fl) { aEll(c, 9, -12, 1.4, 2.2); c.fillStyle = '#9ad8ff'; c.fill(); }   // 炸彈忍者：冒冷汗
  if (type === 6 && !fl) { c.fillStyle = 'rgba(217,184,255,.5)'; aCirc(c, 0, eyeY, 4); c.fill(); aCirc(c, 6, eyeY, 4); c.fill(); }  // 菁英：眼睛發光
  // --- 前手（依類型與狀態） ---
  if (type === 6) { // 菁英：雙手抱胸
    aLimb(c, [-6, 2, 4, 6], 4.2, P.suit); aLimb(c, [6, 2, -3, 5], 4.2, P.suit);
  } else if (type === 3) { // 手裡劍忍者：蓄力時手往後，出手後往前
    const hx = warn ? -5 : atk ? 17 : 12, hy = warn ? -17 : atk ? 0 : 6;
    aLimb(c, [6, 2, hx, hy], 4.2, P.suit);
    if (!atk) drawStar4(c, hx, hy, 5, t * (warn ? 25 : 8), fl ? '#fff' : '#cfd6e2');
  } else if (type === 9) { // 弓忍：弓朝玩家方向，蓄力時拉弓
    const a = e && g && g.p ? clamp(Math.atan2((g.p.y - 20) - e.y, Math.abs(g.p.x - e.x)), -1.1, 1.1) : 0;
    c.save(); c.translate(4, 2); c.rotate(a);
    const pull = warn ? 7 : atk ? 0 : 2;
    aLimb(c, [0, 0, 11, 0], 4.2, P.suit);
    c.beginPath(); c.arc(9, 0, 11, -1.25, 1.25); c.strokeStyle = INK; c.lineWidth = 4; c.stroke(); c.strokeStyle = fl ? '#fff' : '#a8743c'; c.lineWidth = 2.4; c.stroke();
    c.beginPath(); c.moveTo(9 + Math.cos(-1.25) * 11, Math.sin(-1.25) * 11); c.lineTo(9 - pull, 0); c.lineTo(9 + Math.cos(1.25) * 11, Math.sin(1.25) * 11); c.strokeStyle = fl ? '#fff' : '#efe6d2'; c.lineWidth = 1; c.stroke();
    if (warn) { c.beginPath(); c.moveTo(9 - pull, 0); c.lineTo(24, 0); c.strokeStyle = '#7a5230'; c.lineWidth = 1.6; c.stroke(); c.fillStyle = '#ff5a5a'; c.beginPath(); c.moveTo(27, 0); c.lineTo(23, -2.5); c.lineTo(23, 2.5); c.fill(); }
    c.restore();
  } else if (type === 11) { // 土遁忍者：舉起苦無
    const hx = warn ? 9 : 12, hy = warn ? -12 : 5;
    aLimb(c, [6, 2, hx, hy], 4.2, P.suit); drawKunai(c, hx, hy - 4, -Math.PI / 2, 1, fl);
  } else if (type === 4) { // 盾忍者：雙手扶著盾
    aLimb(c, [6, 2, 12, 14], 4.2, P.suit);
  } else {
    const hx = alarm ? 12 : 12, hy = alarm ? -6 : 8 + Math.sin(t * 5 + seed + 1.5) * 1.5;
    aLimb(c, [6, 2, hx, hy], 4.2, P.suit);
  }
  if (type === 4) { // 盾牌（腳下）：玩家在下方時閃光
    const below = e && g && g.p && g.p.y - 20 > e.y && Math.abs(g.p.x - e.x) < 40;
    aEll(c, 0, 22, 19, 5.5); aFI(c, fl ? '#fff' : '#9aa4b0', 2);
    if (!fl) {
      aEll(c, 0, 21, 14, 3.4); c.strokeStyle = '#d8dee6'; c.lineWidth = 1.2; c.stroke();
      c.fillStyle = '#5a626e'; for (let i = -2; i <= 2; i++) { aCirc(c, i * 6.5, 22 + Math.abs(i) * -.4, 1); c.fill(); }
      if (below) { aEll(c, 0, 22, 21, 7); c.strokeStyle = `rgba(255,255,255,${.5 + .4 * Math.sin(t * 20)})`; c.lineWidth = 2; c.stroke(); }
    }
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
  aEll(c, 0, 0, 10, 6.5); aFI(c, body, 1.6);
  aCirc(c, 8, -3, 5.5); aFI(c, body, 1.6);
  c.beginPath(); c.moveTo(12, -4); c.lineTo(18, -2); c.lineTo(12, 0); c.closePath(); aFI(c, fl ? '#fff' : '#f2c14e', 1.2);
  if (!fl) { aCirc(c, 9.5, -4.5, 1.6); c.fillStyle = '#ff3a3a'; c.fill(); c.fillStyle = 'rgba(255,58,58,.35)'; aCirc(c, 9.5, -4.5, 3); c.fill(); c.fillStyle = '#d8323c'; c.fillRect(3, -6.5, 6, 1.6); }
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
  // 身體（山伏服）
  aEll(c, 0, 12, 9, 7); aFI(c, fl ? '#fff' : '#f0ead8', 1.6);
  if (!fl) { aCirc(c, -3, 10, 1.8); c.fillStyle = '#e8463a'; c.fill(); aCirc(c, 3, 10, 1.8); c.fill(); }   // 梵天（毛球）
  // 頭
  aCirc(c, 0, 0, 12.5); aFI(c, red, 2);
  // 頭巾（兜巾）
  c.beginPath(); c.moveTo(-5, -12); c.lineTo(0, -19); c.lineTo(5, -12); c.closePath(); aFI(c, blk, 1.4);
  // 白眉
  c.save(); c.scale(look, 1);
  c.fillStyle = fl ? '#fff' : '#ffffff';
  c.beginPath(); c.moveTo(-8, -5); c.quadraticCurveTo(-4, -9, 0, -5); c.lineTo(-1, -3); c.quadraticCurveTo(-4, -6, -8, -3); c.fill();
  c.beginPath(); c.moveTo(1, -5); c.quadraticCurveTo(5, -9, 9, -5); c.lineTo(9, -3); c.quadraticCurveTo(5, -6, 2, -3); c.fill();
  // 眼睛
  c.fillStyle = INK; aCirc(c, -3.5, -1, 1.6); c.fill(); aCirc(c, 4, -1, 1.6); c.fill();
  // 長鼻子
  c.beginPath(); c.moveTo(-1.5, 1); c.quadraticCurveTo(6, 4, 13, 2); c.quadraticCurveTo(8, 6, -1, 5); c.closePath(); aFI(c, fl ? '#fff' : '#e8584a', 1.4);
  if (big && !fl) { // 大天狗：白鬍子
    c.beginPath(); c.moveTo(-8, 4); c.quadraticCurveTo(-6, 16, 0, 20); c.quadraticCurveTo(6, 16, 8, 4); c.quadraticCurveTo(0, 9, -8, 4); aFI(c, '#ffffff', 1.4);
  }
  c.restore();
  if (big) { // 羽扇：蓄力時舉起
    const up = e && e.warn ? -1 : 0, ang = up ? -1.2 + Math.sin(t * 18) * .15 : .3 + Math.sin(t * 2) * .1;
    c.save(); c.translate(look * 11, 8); c.rotate(look * ang);
    c.beginPath(); c.rect(-1.2, 0, 2.4, 8); aFI(c, fl ? '#fff' : '#7a5230', 1);
    c.beginPath(); c.moveTo(0, 0); for (let i = 0; i <= 6; i++) { const a = -Math.PI / 2 - .9 + i * .3; c.lineTo(Math.cos(a) * 14, Math.sin(a) * 14); } c.closePath(); aFI(c, fl ? '#fff' : '#e9f2e0', 1.2);
    if (!fl) { c.strokeStyle = '#9ab08a'; c.lineWidth = .8; for (let i = 0; i <= 6; i++) { const a = -Math.PI / 2 - .9 + i * .3; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a) * 13, Math.sin(a) * 13); c.stroke(); } }
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
  c.fillStyle = INK; aEll(c, -2.5, 4, 1.3, 1.9); c.fill(); aEll(c, 2.5, 4, 1.3, 1.9); c.fill();
  c.beginPath(); c.arc(0, 7, 1.8, .2, Math.PI - .2); c.strokeStyle = INK; c.lineWidth = 1; c.stroke();
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
  aEll(c, 0, 5, 10 * sw, 11 * sw); aFI(c, body, 1.8);
  if (!fl) { c.fillStyle = '#e8463a'; c.beginPath(); c.moveTo(0, 0); c.lineTo(3, 5); c.lineTo(0, 10); c.lineTo(-3, 5); c.closePath(); c.fill(); aEll(c, -4, 1, 3, 2, -.6); c.fillStyle = 'rgba(255,255,255,.15)'; c.fill(); }
  // 頭
  aCirc(c, 0, -7, 6.5); aFI(c, body, 1.6);
  if (!fl) { c.fillStyle = '#ff4a4a'; for (const [x, y, r] of [[-2.4, -8, 1.6], [2.4, -8, 1.6], [-4.4, -6, 1], [4.4, -6, 1]]) { aCirc(c, x, y, r); c.fill(); } }
  c.beginPath(); c.moveTo(-2, -2.5); c.lineTo(-1, -.5); c.moveTo(2, -2.5); c.lineTo(1, -.5); c.strokeStyle = fl ? '#fff' : '#e8e0d0'; c.lineWidth = 1.2; c.stroke();
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
  if (type === 13 && s === 1) s = 2.4;   // 大天狗畫大一點
  if (e && e.hidden) return drawMound(x, y, t, e);
  const ed = ENEMY[type], fl = e && e.flash > 0;
  const look = e && e.look ? e.look : e && g && g.p ? (Math.sign(g.p.x - x) || 1) : 1;
  const near = e && g && g.p ? Math.hypot(g.p.x - x, g.p.y - 20 - y) < 110 : false;
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  if (FOE[type]) drawFoeNinja(type, t, e, look, near);
  else if (type === 7) drawCrow(t, e, fl);
  else if (type === 8) drawTengu(t, e, fl, false);
  else if (type === 13) drawTengu(t, e, fl, true);
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
function drawBoss(b, x, y, s) {
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
    c.save(); c.translate(24, 4); c.rotate(ang);
    aLimb(c, [0, 0, 0, -12], 7, P.body);
    c.beginPath(); c.moveTo(-2.5, -10); c.lineTo(-5, -38); c.lineTo(5, -38); c.lineTo(2.5, -10); c.closePath(); aFI(c, '#4a3a30', 1.8);
    c.fillStyle = '#d8dee6'; for (let i = 0; i < 4; i++) { const yy = -16 - i * 6; c.beginPath(); c.moveTo(-5, yy); c.lineTo(-8, yy - 2); c.lineTo(-4.4, yy - 3); c.fill(); c.beginPath(); c.moveTo(5, yy); c.lineTo(8, yy - 2); c.lineTo(4.4, yy - 3); c.fill(); }
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
  '風': {
    sky: (c, w, h) => {
      const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#3d96e0'); gr.addColorStop(.6, '#8cc8f2'); gr.addColorStop(1, '#d8f0ff');
      c.fillStyle = gr; c.fillRect(0, 0, w, h);
      const sun = c.createRadialGradient(w * .2, h * .12, 5, w * .2, h * .12, 120); sun.addColorStop(0, 'rgba(255,255,230,.9)'); sun.addColorStop(.15, 'rgba(255,250,210,.5)'); sun.addColorStop(1, 'rgba(255,250,210,0)');
      c.fillStyle = sun; c.fillRect(0, 0, w, h);
      paintCloud(c, w * .15, h * .88, 70, 'rgba(255,255,255,.9)'); paintCloud(c, w * .7, h * .92, 90, 'rgba(255,255,255,.95)'); paintCloud(c, w * .45, h * .97, 80, '#ffffff');
    },
    far: (c, w, h) => { const r = aRng(5); for (let i = 0; i < 7; i++) { const x = r() * w, y = r() * h, s = 18 + r() * 22; wrapDraw(w, h, x, y, 60, (xx, yy) => paintCloud(c, xx, yy, s, 'rgba(255,255,255,.55)')); } },
    mid: (c, w, h) => {
      const r = aRng(9);
      for (let i = 0; i < 3; i++) { const x = (i + .3 + r() * .4) * w / 3, sw = 11 + r() * 4; wrapDraw(w, h, x, 0, 20, (xx) => paintStalk(c, xx, w, h, sw, 'rgba(140,207,152,.85)', 'rgba(200,240,205,.9)', 'rgba(80,150,100,.8)', 'rgba(90,160,112,.9)', 160)); }
      for (let i = 0; i < 7; i++) { const x = r() * w, y = r() * h, s = 14 + r() * 10, ro = r() * 6; wrapDraw(w, h, x, y, 30, (xx, yy) => paintLeaves(c, xx, yy, s, 'rgba(110,190,130,.85)', ro)); }
    },
    live: (camY, t) => { // 風的線條
      ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
      for (let i = 0; i < 6; i++) { const x = ((t * 260 + i * 157) % (W + 200)) - 100, y = ((i * 131 - camY * .25) % H + H) % H; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 30, y - 6, x + 70, y); ctx.stroke(); }
    },
  },
  '火': {
    sky: (c, w, h) => {
      const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#1a0503'); gr.addColorStop(.5, '#4a120c'); gr.addColorStop(1, '#8a2a10');
      c.fillStyle = gr; c.fillRect(0, 0, w, h);
      // 遠方火山與熔岩
      c.fillStyle = '#2a0806'; c.beginPath(); c.moveTo(w * .1, h); c.lineTo(w * .42, h * .58); c.lineTo(w * .58, h * .58); c.lineTo(w * .95, h); c.fill();
      const lv = c.createRadialGradient(w * .5, h * .58, 2, w * .5, h * .58, 70); lv.addColorStop(0, 'rgba(255,160,60,.9)'); lv.addColorStop(1, 'rgba(255,80,20,0)'); c.fillStyle = lv; c.fillRect(0, 0, w, h);
      c.strokeStyle = 'rgba(255,120,40,.6)'; c.lineWidth = 2; c.beginPath(); c.moveTo(w * .5, h * .6); c.quadraticCurveTo(w * .46, h * .75, w * .4, h * .9); c.stroke();
      c.fillStyle = 'rgba(40,20,20,.45)'; for (let i = 0; i < 5; i++) { aCirc(c, w * .5 + Math.sin(i) * 20, h * .5 - i * 30, 22 + i * 6); c.fill(); }   // 煙
    },
    far: (c, w, h) => { const r = aRng(31); for (let i = 0; i < 6; i++) { const x = r() * w, sw = 6 + r() * 4; wrapDraw(w, h, x, 0, 10, (xx) => paintStalk(c, xx, w, h, sw, 'rgba(30,6,4,.75)', 'rgba(120,40,20,.4)', 'rgba(10,0,0,.5)', 'rgba(60,14,8,.8)', 80)); } },
    mid: (c, w, h) => {
      const r = aRng(37);
      for (let i = 0; i < 4; i++) { const x = (i + .2 + r() * .6) * w / 4, sw = 14 + r() * 5; wrapDraw(w, h, x, 0, 24, (xx) => { paintStalk(c, xx, w, h, sw, '#5a2418', '#8a3a24', '#2e0e08', '#3a140c', 160); c.fillStyle = 'rgba(255,120,50,.35)'; c.fillRect(xx + sw - 2, 0, 2, h); }); }
    },
    live: (camY, t) => { // 往上飄的火星
      for (let i = 0, n = Math.ceil(22 * WK()); i < n; i++) {
        const x = (i * 53 + Math.sin(t * 1.5 + i) * 14) % W, y = H - (((t * 60 + i * 97) - camY * .2) % (H + 40));
        ctx.fillStyle = i % 3 ? 'rgba(255,170,70,.9)' : 'rgba(255,230,140,.95)'; aCirc(ctx, x, y, 1.2 + (i % 3) * .6); ctx.fill();
      }
    },
  },
  '山': {
    sky: (c, w, h) => {
      const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#1e1850'); gr.addColorStop(.45, '#5a3a8a'); gr.addColorStop(.8, '#d8806a'); gr.addColorStop(1, '#f6b07a');
      c.fillStyle = gr; c.fillRect(0, 0, w, h);
      const mx = w * .74, my = h * .2, halo = c.createRadialGradient(mx, my, 20, mx, my, 110); halo.addColorStop(0, 'rgba(255,240,200,.45)'); halo.addColorStop(1, 'rgba(255,240,200,0)');
      c.fillStyle = halo; c.fillRect(0, 0, w, h); c.fillStyle = '#fff1c8'; aCirc(c, mx, my, 34); c.fill();
      c.fillStyle = 'rgba(230,210,170,.5)'; aCirc(c, mx - 10, my - 6, 6); c.fill(); aCirc(c, mx + 9, my + 8, 4); c.fill();
      // 三層山脈＋五重塔剪影
      const ridge = (base, amp, col, sd) => { const r = aRng(sd); c.fillStyle = col; c.beginPath(); c.moveTo(0, h); let x = 0; c.lineTo(0, base); while (x < w) { x += 30 + r() * 50; c.lineTo(x, base - r() * amp); } c.lineTo(w, h); c.fill(); };
      ridge(h * .62, 70, '#6a4a8a', 3); ridge(h * .72, 60, '#4a3470', 4);
      c.fillStyle = '#2e2050'; const px = w * .22, py = h * .72;
      for (let i = 0; i < 5; i++) { const ww = 26 - i * 4, yy = py - i * 12; c.fillRect(px - ww / 6, yy - 10, ww / 3, 10); c.beginPath(); c.moveTo(px - ww / 2 - 4, yy - 9); c.lineTo(px + ww / 2 + 4, yy - 9); c.lineTo(px + ww / 2 - 2, yy - 13); c.lineTo(px - ww / 2 + 2, yy - 13); c.fill(); }
      c.fillRect(px - 1, py - 76, 2, 16);
      ridge(h * .84, 50, '#2e2050', 5);
    },
    far: (c, w, h) => { const r = aRng(41); for (let i = 0; i < 6; i++) { const x = r() * w, sw = 6 + r() * 3; wrapDraw(w, h, x, 0, 10, (xx) => paintStalk(c, xx, w, h, sw, 'rgba(60,40,110,.45)', 'rgba(150,120,200,.25)', 'rgba(20,10,50,.3)', 'rgba(40,25,80,.5)', 80)); } },
    mid: (c, w, h) => {
      const r = aRng(43);
      for (let i = 0; i < 4; i++) { const x = (i + .2 + r() * .6) * w / 4, sw = 13 + r() * 5; wrapDraw(w, h, x, 0, 24, (xx) => paintStalk(c, xx, w, h, sw, '#5d4a8a', '#8a74b8', '#392d66', '#392d66', 160)); }
      for (let i = 0; i < 8; i++) { const x = r() * w, y = r() * h, s = 15 + r() * 10, ro = r() * 6; wrapDraw(w, h, x, y, 40, (xx, yy) => paintLeaves(c, xx, yy, s, '#4a3a7a', ro)); }
    },
    live: (camY, t) => { // 閃爍的星星＋飄起的燈火
      for (let i = 0; i < 14; i++) { const x = (i * 89) % W, y = (i * 37) % (H * .35), a = .4 + .4 * Math.sin(t * 2 + i * 3); ctx.fillStyle = `rgba(255,255,230,${a})`; ctx.fillRect(x, y, 1.6, 1.6); }
      for (let i = 0; i < 5; i++) { const x = (i * 151 + Math.sin(t * .5 + i) * 25 + W) % W, y = H - (((t * 18 + i * 140) - camY * .1) % (H + 60)) + 30; ctx.fillStyle = 'rgba(255,190,110,.25)'; aCirc(ctx, x, y, 6); ctx.fill(); ctx.fillStyle = '#ffd08a'; aCirc(ctx, x, y, 2); ctx.fill(); }
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
  const tile = bgCanvas(th.k + 'wall', ww, SEG, (c, w, h) => {
    const gr = c.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, th.node); gr.addColorStop(.25, th.stalk); gr.addColorStop(.45, '#ffffff55'); gr.addColorStop(.55, th.stalk); gr.addColorStop(1, th.node);
    c.fillStyle = gr; c.fillRect(0, 0, w, h);
    c.fillStyle = th.stalk; c.fillRect(2, 0, w - 4, h); c.fillStyle = gr; c.globalAlpha = .7; c.fillRect(0, 0, w, h); c.globalAlpha = 1;
    c.fillStyle = 'rgba(255,255,255,.25)'; c.fillRect(w * .3, 0, 2, h);
    c.fillStyle = INK; c.fillRect(0, h - 5, w, 2); c.fillStyle = th.node; c.fillRect(0, h - 3, w, 4);
    c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(1, h - 6, w - 2, 1);
    c.fillStyle = INK; c.fillRect(0, 0, 1.4, h); c.fillRect(w - 1.4, 0, 1.4, h);
  });
  const o = ((-camY) % SEG + SEG) % SEG;
  for (const [x0, f] of [[-2, 1], [W - ww + 2, -1]]) for (let y = o - SEG; y < H; y += SEG) {
    ctx.save(); ctx.translate(x0 + ww / 2, y); ctx.scale(f, 1); ctx.drawImage(tile, -ww / 2, 0, ww, SEG); ctx.restore();
  }
  ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.fillRect(WALL + 2, 0, 3, H); ctx.fillRect(W - WALL - 5, 0, 3, H);
}

// ===== 死亡區域：火海／海浪／妖怪群 =====
function drawZone(camY, stage, t) {
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

// ===== 主角（程式繪圖）=====
// 原點在腳底、面向右（+x）；依速度與狀態切換姿勢：上升、頂點、下落、衝刺斬、急降斬、飛行、受傷
// 每個姿勢定義：前手／後手的手部位置、前腳／後腳（膝→腳）、眼神
const HERO_POSE = {
  up:   { fa: [19, -41], ba: [-11, -14], fl: [8, -8, 3, -3], bl: [-2, -4, -6, 1], eye: 'open' },
  apex: { fa: [13, -28], ba: [-12, -25], fl: [6, -6, 6, 0], bl: [-3, -5, -7, -1], eye: 'open' },
  fall: { fa: [18, -37], ba: [-14, -37], fl: [4, -5, 5, 2], bl: [-4, -5, -4, 2], eye: 'open' },
  dash: { fa: [17, -25], ba: [-13, -21], fl: [7, -9, 2, -6], bl: [-6, -6, -14, -4], eye: 'focus' },
  dive: { fa: [13, -20], ba: [11, -18], fl: [-6, -12, -12, -13], bl: [-8, -8, -15, -7], eye: 'focus' },
  fly:  { fa: [18, -34], ba: [-18, -34], fl: [3, -5, 2, 1], bl: [-2, -5, -3, 1], eye: 'happy' },
  hurt: { fa: [18, -42], ba: [-14, -39], fl: [7, -4, 9, 1], bl: [-6, -4, -9, 1], eye: 'hurt' },
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
function drawHeroNinja(x, y, o, c = ctx) {
  const sk = SKINS[o.skin || 0], t = o.t || 0, vy = o.vy || 0;
  const flash = o.hurt > 0 && ((t * 20) | 0) % 2;
  const P = flash ? { suit: '#ff6a5a', dk: '#c03a30', band: '#ffd0c8', skin: '#ffc4b4' } : { suit: sk.suit, dk: sk.dark, band: sk.band, skin: '#f8d6b0' };
  const pn = heroPoseOf(o), Q = HERO_POSE[pn];
  const cy = y - 30;
  // 往上衝很快時，身後拉出速度線
  if (vy < -700 && !o.dash && !o.dive) {
    c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 1.5;
    for (let i = 0; i < 3; i++) { const lx = x + (i - 1) * 12 + Math.sin(t * 30 + i) * 2, l = 14 + ((t * 90 + i * 17) % 18); c.beginPath(); c.moveTo(lx, cy + 30); c.lineTo(lx, cy + 30 + l); c.stroke(); }
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
  c.translate(0, 30);   // 之後以腳底為原點
  if (o.fly) { // 豪天翔：金色旋風
    c.lineCap = 'round';
    for (let i = 0; i < 3; i++) { const a = t * 6 + i * 2.1; c.strokeStyle = `rgba(255,214,90,${.55 - i * .12})`; c.lineWidth = 3 - i * .6; c.beginPath(); c.ellipse(0, -28, 26 + i * 5, 14 + i * 3, -.3, a, a + 2.2); c.stroke(); }
  }
  // 圍巾：從脖子後方往「速度的反方向」飄，帶波浪
  const vyL = o.dash ? .15 : o.fly ? .9 : vy < -200 ? .95 : vy > 150 ? -.75 : .2;
  const dl = Math.hypot(1, vyL), dx = -1 / dl, dy = vyL / dl, px = -dy, py = dx;
  for (const [len, ph, wd] of [[30, 0, 5], [22, 1.7, 4]]) {
    const L = [], R = [], N = 8;
    for (let i = 0; i <= N; i++) {
      const s = i / N, wv = Math.sin(t * 13 - s * 5 + ph) * 5 * s, bx = -4 + dx * len * s + px * wv, by = -28 + dy * len * s + py * wv, w2 = wd * (1 - s * .55) / 2;
      L.push([bx + px * w2, by + py * w2]); R.push([bx - px * w2, by - py * w2]);
    }
    c.beginPath(); L.forEach(([a, b], i) => i ? c.lineTo(a, b) : c.moveTo(a, b)); for (let i = R.length - 1; i >= 0; i--) c.lineTo(R[i][0], R[i][1]); c.closePath();
    aFI(c, P.band, 1.6);
  }
  // 背上的刀鞘（衝刺／急降斬時刀在手上）
  const drawn = pn === 'dash' || pn === 'dive';
  c.save(); c.translate(-6, -22); c.rotate(-2.2);
  c.beginPath(); c.rect(-2.4, 0, 4.8, 24); aFI(c, '#2a1c18', 1.6);
  if (!drawn) {
    c.beginPath(); c.rect(-2.8, -2, 5.6, 2.4); aFI(c, '#d9a441', 1.2);
    c.beginPath(); c.rect(-1.8, -11, 3.6, 9); aFI(c, '#3a2a40', 1.2);
    c.strokeStyle = '#e8e0f0'; c.lineWidth = .8; for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(-1.8, -9 + i * 3); c.lineTo(1.8, -7.5 + i * 3); c.stroke(); }
  }
  c.restore();
  const sw = Math.sin(t * 6) * 1.2;
  // 後腳、後手
  aLimb(c, [-3, -11, Q.bl[0], Q.bl[1], Q.bl[2], Q.bl[3]], 5.4, P.dk);
  aEll(c, Q.bl[2] - 1, Q.bl[3], 3.2, 2.3); aFI(c, '#2a2a33', 1.3);
  aLimb(c, [-5, -24, (-5 + Q.ba[0]) / 2 - 2, (-24 + Q.ba[1]) / 2, Q.ba[0], Q.ba[1] + sw], 4.8, P.suit);
  aCirc(c, Q.ba[0], Q.ba[1] + sw, 2.8); aFI(c, P.dk, 1.3);
  // 身體
  c.beginPath(); c.moveTo(-8, -26); c.quadraticCurveTo(0, -30, 8, -26); c.lineTo(8.5, -14); c.quadraticCurveTo(0, -9, -8.5, -14); c.closePath();
  aFI(c, P.suit, 2);
  c.save(); c.clip(); c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(-9, -30, 6, 20); c.restore();   // 背側陰影
  c.beginPath(); c.moveTo(-5, -26); c.lineTo(2, -18); c.moveTo(5, -26); c.lineTo(0, -21); c.strokeStyle = P.dk; c.lineWidth = 1.4; c.stroke();   // 衣襟
  c.fillStyle = P.dk; c.fillRect(-8.5, -16.5, 17, 3);                                                                                        // 腰帶
  c.beginPath(); c.moveTo(-8, -15); c.lineTo(-13, -12 + sw); c.lineTo(-11, -16); c.closePath(); aFI(c, P.dk, 1.1);                          // 腰帶的結
  // 前腳
  aLimb(c, [3, -11, Q.fl[0], Q.fl[1], Q.fl[2], Q.fl[3]], 5.4, P.dk);
  aEll(c, Q.fl[2] + 1, Q.fl[3], 3.2, 2.3); aFI(c, '#2a2a33', 1.3);
  // 頭（兜帽，帽尖朝後）
  c.beginPath(); c.arc(0, -40, 14, 0, TAU); c.moveTo(-11, -49); c.quadraticCurveTo(-19, -58, -9, -56);
  aFI(c, P.suit, 2.2);
  aEll(c, 4, -49, 5, 3, -.3); c.fillStyle = 'rgba(255,255,255,.2)'; c.fill();
  // 頭巾＋護額（金屬片）＋後方的結
  c.save(); aCirc(c, 0, -40, 14); c.clip(); c.fillStyle = P.band; c.fillRect(-15, -50, 30, 4.4); c.restore();
  c.beginPath(); c.moveTo(-13, -50); c.lineTo(13, -50); c.moveTo(-13.5, -45.6); c.lineTo(13.5, -45.6); c.strokeStyle = INK; c.lineWidth = .9; c.stroke();
  c.beginPath(); if (c.roundRect) c.roundRect(1, -50.5, 9, 5, 1.5); else c.rect(1, -50.5, 9, 5); aFI(c, '#c8ced8', 1.1);
  c.beginPath(); c.moveTo(3.5, -48); c.lineTo(5.5, -47); c.lineTo(7.5, -49); c.strokeStyle = '#5a626e'; c.lineWidth = .9; c.stroke();
  const fw = Math.sin(t * 11) * 2;
  c.beginPath(); c.moveTo(-13, -49); c.quadraticCurveTo(-19, -52 + fw, -23, -48 + fw); c.lineTo(-20, -46 + fw); c.quadraticCurveTo(-17, -48, -13, -47); c.closePath(); aFI(c, P.band, 1.2);
  // 臉（面罩開口）與大眼睛
  aEll(c, 4, -38, 10, 5.6); aFI(c, P.skin, 1.5);
  const blink = pn === 'apex' && ((t * .9) % 3.4) < .12;
  for (const [ex, es] of [[0, 2.5], [8.5, 2.9]]) {   // 靠前的眼睛大一點（3/4 側臉）
    const ey = -38;
    c.strokeStyle = INK; c.lineWidth = 1.5; c.lineCap = 'round';
    if (blink) { c.beginPath(); c.moveTo(ex - es, ey); c.lineTo(ex + es, ey); c.stroke(); continue; }
    if (Q.eye === 'happy') { c.beginPath(); c.arc(ex, ey + 1, es * .9, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); continue; }
    if (Q.eye === 'hurt') { c.beginPath(); c.moveTo(ex - es, ey - 2); c.lineTo(ex + es * .6, ey); c.lineTo(ex - es, ey + 2); c.stroke(); continue; }
    const sy = Q.eye === 'focus' ? .65 : 1;
    aEll(c, ex, ey, es * .95, es * 1.25 * sy); c.fillStyle = '#ffffff'; c.fill();
    aEll(c, ex + .5, ey + .3, es * .72, es * 1.02 * sy); c.fillStyle = '#3a2418'; c.fill();
    aCirc(c, ex + .9, ey + .4, es * .35); c.fillStyle = INK; c.fill();
    aCirc(c, ex - .2, ey - es * .45 * sy, es * .3); c.fillStyle = '#ffffff'; c.fill();
    c.beginPath(); c.moveTo(ex - es, ey - es * 1.7 + (Q.eye === 'focus' ? 1 : 0)); c.lineTo(ex + es, ey - es * 1.55 + (Q.eye === 'focus' ? 1.6 : 0)); c.strokeStyle = INK; c.lineWidth = 1.3; c.stroke();   // 眉毛：專注時壓低
  }
  // 前手（衝刺／急降斬時拿刀）
  aLimb(c, [5, -24, (5 + Q.fa[0]) / 2 + 2, (-24 + Q.fa[1]) / 2 + 2, Q.fa[0], Q.fa[1] - sw], 4.8, P.suit);
  if (drawn) {
    c.save(); c.translate(Q.fa[0], Q.fa[1] - sw); c.rotate(pn === 'dash' ? -.08 : .35);
    c.beginPath(); c.moveTo(1, -1.6); c.quadraticCurveTo(16, -3.2, 30, -.6); c.lineTo(28, 1.4); c.quadraticCurveTo(15, .4, 1, 1.6); c.closePath();
    const bg = c.createLinearGradient(0, -2, 0, 2); bg.addColorStop(0, '#ffffff'); bg.addColorStop(1, '#a8b2c0');
    c.fillStyle = bg; c.fill(); aInk(c, 1.2);
    c.beginPath(); c.rect(-1.5, -3, 2.5, 6); aFI(c, '#d9a441', 1); c.beginPath(); c.rect(-9, -1.6, 8, 3.2); aFI(c, '#3a2a40', 1);
    c.restore();
  }
  aCirc(c, Q.fa[0], Q.fa[1] - sw, 2.9); aFI(c, P.dk, 1.3);
  c.restore();
  if (o.freeze > 0) { // 冰凍：半透明冰塊
    c.save(); c.globalAlpha = .5; c.fillStyle = '#bdeaff'; c.beginPath(); if (c.roundRect) c.roundRect(x - 20, y - 66, 40, 68, 8); else c.rect(x - 20, y - 66, 40, 68); c.fill();
    c.globalAlpha = .9; c.strokeStyle = '#ffffff'; c.lineWidth = 2; c.stroke(); c.restore();
  }
  if (o.slow > 0) { c.strokeStyle = '#c58aff'; c.lineWidth = 2; c.beginPath(); c.arc(x, cy, 30, t * 6, t * 6 + 4); c.stroke(); }
}
// 標題大圖與商店頭像：在獨立畫布上畫一張大的主角
function heroPortrait(skin, size) {
  const cnv = document.createElement('canvas'); cnv.width = cnv.height = size;
  const c = cnv.getContext('2d'), k = size / 84;
  c.scale(k, k);
  drawHeroNinja(42, 74, { face: 1, t: .35, vy: 0, skin }, c);   // 頂點姿勢：雙手張開、臉清楚
  return cnv;
}
