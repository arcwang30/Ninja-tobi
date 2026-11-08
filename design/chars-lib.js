'use strict';
// ===== 角色（商店「角色」分頁）：和主角同樣的「大福」比例，但頭部造型完全不同 =====
// 原點在腳底、面向右。pal = 換裝顏色 { suit, dark, band }；髮色、面具、斗笠、虎斑等招牌特徵不隨換裝改變
const CH_SKIN = '#fadcbc';
const OUTFITS = [   // 換裝：10 種顏色
  { n: ['赤', '赤', 'Red'], suit: '#c0262d', dark: '#7a1218', band: '#ffffff' },
  { n: ['蒼', '蒼', 'Blue'], suit: '#2b5fb8', dark: '#173a78', band: '#ffd54a' },
  { n: ['桜', '桜', 'Sakura'], suit: '#e56aa0', dark: '#a03a6a', band: '#ffffff' },
  { n: ['影', '影', 'Shadow'], suit: '#2a2a33', dark: '#111116', band: '#e8403a' },
  { n: ['白', '白', 'White'], suit: '#eeeef2', dark: '#a8aab8', band: '#c0262d' },
  { n: ['翠', '翠', 'Jade'], suit: '#2e9a5a', dark: '#17603a', band: '#f4e27a' },
  { n: ['紫', '紫', 'Violet'], suit: '#7a3ec0', dark: '#4a2078', band: '#f2c14e' },
  { n: ['橙', '橙', 'Orange'], suit: '#ec7a22', dark: '#a84a10', band: '#2a2a33' },
  { n: ['金', '金', 'Gold'], suit: '#e8b84a', dark: '#9a6a1a', band: '#c0262d' },
  { n: ['水', '水', 'Aqua'], suit: '#2ab4c8', dark: '#147080', band: '#ffffff' },
];
const chLt = (hex, k) => heroLighten(hex, k);
function chBall(c, x, y, r, col) { const gr = c.createRadialGradient(x - r * .3, y - r * .55, 2, x, y, r * 1.15); gr.addColorStop(0, chLt(col, .35)); gr.addColorStop(.6, col); gr.addColorStop(1, col); return gr; }
// 身體＋手腳（共用）。bw = 身寬倍率
function chBody(c, P, t, bw = 1) {
  const bob = Math.sin(t * 6) * 1.2, BT = -12, BB = -3, wT = 8 * bw, wM = 11 * bw, wB = 6 * bw, bh = BB - BT, belt = BT + bh * .53;
  return [
    { path: c => aCirc(c, -14 * bw, -14 + bob, 4.3), fill: P.dark },
    { path: c => aEll(c, -4, 0, 4.2, 2.9), fill: P.dark },
    { path: c => { c.beginPath(); c.moveTo(-wT, BT); c.quadraticCurveTo(0, BT - 4, wT, BT); c.quadraticCurveTo(wM, BT + bh * .63, wB, BB - 1); c.quadraticCurveTo(0, BB + 2, -wB, BB - 1); c.quadraticCurveTo(-wM, BT + bh * .63, -wT, BT); c.closePath(); }, fill: P.suit,
      after: c => { c.save(); c.clip(); c.fillStyle = '#1e1e26'; c.fillRect(-wM - 2, belt, wM * 2 + 4, 3.2); c.fillStyle = P.band; c.fillRect(-2, belt - .5, 4, 4.2); c.restore(); } },
    { path: c => aEll(c, 5, 0, 4.2, 2.9), fill: P.dark },
  ];
}
const chHand = (c, x, y, col) => { aCirc(c, x, y, 4.6); aFI(c, col, 1.8); };
const chBlush = (c, x, y, r = 3) => { c.fillStyle = 'rgba(255,110,130,.5)'; aEll(c, x, y, r, r * .55); c.fill(); };
// 可愛大眼（比主角再大一點、亮點多一顆）。iris = [上, 下] 顏色
function chEye(c, x, y, rx, ry, iris = ['#1a0f0a', '#a0441c'], mood = 'open') {
  if (mood !== 'open') { heroEye(c, x, y, rx, ry, mood); return; }
  aEll(c, x, y, rx, ry); c.fillStyle = '#fff'; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.2; c.stroke();
  c.save(); aEll(c, x, y, rx, ry); c.clip();
  aEll(c, x + rx * .18, y + ry * .08, rx * .86, ry * .88); const gr = c.createLinearGradient(0, y - ry, 0, y + ry); gr.addColorStop(0, iris[0]); gr.addColorStop(1, iris[1]); c.fillStyle = gr; c.fill();
  aCirc(c, x + rx * .25, y + ry * .12, rx * .38); c.fillStyle = 'rgba(0,0,0,.75)'; c.fill();
  c.fillStyle = '#fff'; aCirc(c, x - rx * .15, y - ry * .38, rx * .36); c.fill(); aCirc(c, x + rx * .45, y + ry * .45, rx * .16); c.fill(); aCirc(c, x + rx * .5, y - ry * .5, rx * .1); c.fill();
  c.restore();
}
// 美少女眼：長睫毛、外眼角上挑，瞳孔漸層＋星星亮點。out = 外眼角方向（+1 往右、-1 往左）
function girlEye(c, x, y, rx, ry, iris, out) {
  chEye(c, x, y, rx, ry, iris);
  c.fillStyle = INK; c.beginPath(); c.moveTo(x - rx * 1.05, y - ry * .35); c.quadraticCurveTo(x, y - ry * 1.32, x + rx * 1.05, y - ry * .45);
  c.lineTo(x + rx * 1.05 * out + (out > 0 ? 0 : 0), y - ry * .45); c.quadraticCurveTo(x, y - ry * 1.05, x - rx * 1.05, y - ry * .2); c.closePath(); c.fill();
  // 外眼角的睫毛翹起
  const ox = x + out * rx * 1.0, oy = y - ry * .4;
  c.beginPath(); c.moveTo(ox, oy); c.quadraticCurveTo(ox + out * 2.6, oy - 1.2, ox + out * 3.6, oy - 3.4); c.quadraticCurveTo(ox + out * 2, oy - 1.4, ox - out * .6, oy - .9); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(ox - out * .8, oy - 1); c.quadraticCurveTo(ox + out * 1.2, oy - 3, ox + out * 1.6, oy - 5); c.quadraticCurveTo(ox + out * .3, oy - 2.6, ox - out * 1.8, oy - 1.4); c.closePath(); c.fill();
  c.strokeStyle = INK; c.lineWidth = .8; c.beginPath(); c.moveTo(x - rx * .6, y + ry * 1.02); c.quadraticCurveTo(x, y + ry * 1.12, x + rx * .6, y + ry * 1.02); c.stroke();
}
const smile = (c, x, y, w = 3) => { c.strokeStyle = INK; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x - w, y); c.quadraticCurveTo(x, y + w * .9, x + w, y); c.stroke(); };
const catMouth = (c, x, y) => { c.strokeStyle = INK; c.lineWidth = 1.1; c.beginPath(); c.moveTo(x - 3, y); c.quadraticCurveTo(x - 1.5, y + 2, x, y); c.quadraticCurveTo(x + 1.5, y + 2, x + 3, y); c.stroke(); };

// ---- 鳶以外的三名舊角色：重新設計 ----
// 蒼（あお）：深藍刺刺短髮綁一撮沖天髷、銀色鉢金、長圍巾；手上轉苦無。元氣少年
function drawAo(c, P, t, o = {}) {
  const HY = -30, R = 21, sw = Math.sin(t * 8) * 3, hair = '#23315e';
  heroSilhouette(c, [
    { path: c => heroScarf(c, -6, -12, [-1, .3], 26, 8, t, 0), fill: P.band },
    ...chBody(c, P, t),
    { path: c => { c.beginPath(); c.moveTo(-4, HY - 19); c.quadraticCurveTo(-8, HY - 34, 2, HY - 38 + sw * .3); c.quadraticCurveTo(0, HY - 30, 4, HY - 19); c.closePath(); }, fill: hair },   // 沖天髷
    { path: c => aCirc(c, 0, HY, R), fill: CH_SKIN },
    { path: c => { c.beginPath(); c.moveTo(-R - 1, HY + 6); c.quadraticCurveTo(-R - 3, HY - R - 3, 2, HY - R - 2); c.quadraticCurveTo(R + 3, HY - R, R + 1, HY - 3);
        for (const [x, y] of [[R - 3, HY - 6], [R - 6, HY - 2], [14, HY - 7], [10, HY - 3], [6, HY - 8], [1, HY - 4], [-4, HY - 9], [-9, HY - 4], [-13, HY - 7]]) c.lineTo(x, y);
        c.lineTo(-16, HY + 8); c.closePath(); }, fill: hair, after: c => { c.fillStyle = 'rgba(140,170,255,.35)'; aEll(c, -5, HY - 16, 8, 2.6, -.2); c.fill(); } },
  ], 1.8);
  aRR(c, -6, HY - 15, 22, 7, 2.5); const mg = c.createLinearGradient(0, HY - 15, 0, HY - 8); mg.addColorStop(0, '#f2f4f8'); mg.addColorStop(1, '#9aa4b4'); c.fillStyle = mg; c.fill(); aInk(c, 1.2);   // 鉢金
  c.fillStyle = P.suit; c.font = '900 5px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('蒼', 5, HY - 11.4);
  chEye(c, 1, HY + 4, 4.3, 5.8, ['#0e1a3a', '#3a7ad8'], o.eye); chEye(c, 13, HY + 4, 4.5, 6, ['#0e1a3a', '#3a7ad8'], o.eye);
  chBlush(c, -5, HY + 10); chBlush(c, 18, HY + 10);
  c.strokeStyle = INK; c.lineWidth = 1.3; c.beginPath(); c.moveTo(4, HY + 12); c.quadraticCurveTo(8, HY + 16, 12, HY + 12); c.closePath(); c.fillStyle = '#c03a3a'; c.fill(); c.stroke();   // 開口笑
  chHand(c, 16, -17 + Math.sin(t * 6) * -1.2, P.dark);
  for (const [x, y, r] of [[27, -8, 2.2], [-27, -24, .9]]) { c.save(); c.translate(x, y + Math.sin(t * 5 + x) * 2); c.rotate(r); c.beginPath(); c.moveTo(0, -6); c.lineTo(2.2, 1); c.lineTo(-2.2, 1); c.closePath(); aFI(c, '#d8dee8', 1); c.fillStyle = '#3a2a40'; c.fillRect(-1, 1, 2, 4); aCirc(c, 0, 6.5, 1.6); c.strokeStyle = INK; c.lineWidth = .8; c.stroke(); c.restore(); }
}
// 桜（さくら）：粉紅長雙馬尾＋櫻花髮飾，手拿摺扇（風）。開朗的女忍
function drawSakura(c, P, t, o = {}) {
  const HY = -30, R = 21, sw = Math.sin(t * 6) * 2.5, hair = '#f08cb4', hairD = '#c85a8a';
  const tail = (sd) => c => { c.beginPath(); const x0 = sd * 14; c.moveTo(x0, HY - 14); c.quadraticCurveTo(x0 + sd * 16, HY - 10 + sw, x0 + sd * 12, HY + 18 + sw); c.quadraticCurveTo(x0 + sd * 10, HY + 28 + sw, x0 + sd * 4, HY + 26 + sw); c.quadraticCurveTo(x0 + sd * 8, HY + 10, x0 - sd * 2, HY - 6); c.closePath(); };
  heroSilhouette(c, [
    { path: tail(-1), fill: hair },
    ...chBody(c, P, t),
    { path: c => aCirc(c, 0, HY, R), fill: CH_SKIN },
    { path: c => { c.beginPath(); c.moveTo(-R - 1, HY + 8); c.quadraticCurveTo(-R - 3, HY - R - 3, 2, HY - R - 2); c.quadraticCurveTo(R + 3, HY - R, R + 1, HY + 2); c.quadraticCurveTo(R - 3, HY - 6, 15, HY - 5); c.quadraticCurveTo(11, HY - 10, 6, HY - 6); c.quadraticCurveTo(1, HY - 11, -3, HY - 6); c.quadraticCurveTo(-8, HY - 10, -12, HY - 4); c.quadraticCurveTo(-15, HY, -16, HY + 10); c.closePath(); }, fill: hair,
      after: c => { c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 1.6; c.beginPath(); c.arc(-1, HY - 3, 15, Math.PI * 1.15, Math.PI * 1.5); c.stroke(); } },
    { path: tail(1), fill: hair },
  ], 1.8);
  // 櫻花髮飾
  c.save(); c.translate(11, HY - 16); for (let i = 0; i < 5; i++) { c.rotate(TAU / 5); aEll(c, 0, -3.2, 2.3, 3.2); aFI(c, '#ffe0ec', .9); } aCirc(c, 0, 0, 1.6); c.fillStyle = '#f2c14e'; c.fill(); c.restore();
  girlEye(c, 1, HY + 4, 4.4, 6, ['#5a1a3a', '#e85a9a'], -1); girlEye(c, 13, HY + 4, 4.6, 6.2, ['#5a1a3a', '#e85a9a'], 1);
  chBlush(c, -5, HY + 11); chBlush(c, 18, HY + 11); smile(c, 8, HY + 12.5, 2.2);
  // 摺扇
  c.save(); c.translate(22, -10); c.rotate(.3 + Math.sin(t * 5) * .15);
  c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, 14, -Math.PI * .95, -Math.PI * .05); c.closePath(); aFI(c, '#fff7fa', 1.3);
  c.strokeStyle = 'rgba(200,90,138,.6)'; c.lineWidth = .8; for (let i = 1; i < 7; i++) { const a = -Math.PI * (.95 - i * .9 / 7); c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a) * 14, Math.sin(a) * 14); c.stroke(); }
  c.beginPath(); c.arc(0, 0, 14, -Math.PI * .95, -Math.PI * .05); c.arc(0, 0, 10, -Math.PI * .05, -Math.PI * .95, true); c.closePath(); c.fillStyle = 'rgba(240,140,180,.55)'; c.fill(); c.restore();
  chHand(c, 20, -10 + Math.sin(t * 6) * -1.2, P.dark);
  for (let i = 0; i < 3; i++) { const p = (t * .5 + i / 3) % 1; c.save(); c.globalAlpha = 1 - p; c.translate(28 - p * 50, -48 + p * 30 + Math.sin(p * 9 + i) * 4); c.rotate(p * 6); aEll(c, 0, 0, 2.4, 1.6); c.fillStyle = '#ffb0d0'; c.fill(); c.restore(); }
}
// 影（かげ）：黑兜帽裡探出兩支小黃角的鬼之子，虎紋圍巾、帽上雷紋、一顆小虎牙
function drawKage(c, P, t, o = {}) {
  const HY = -30, R = 21;
  heroSilhouette(c, [
    { path: c => heroScarf(c, -6, -12, [-1, .3], 22, 9, t, 0), fill: '#f2c14e', after: c => { c.save(); c.clip(); c.fillStyle = INK; for (let i = 0; i < 5; i++) { c.save(); c.translate(-12 - i * 5, -12 + i); c.rotate(.5); c.fillRect(-1, -6, 2, 12); c.restore(); } c.restore(); } },
    ...chBody(c, P, t),
    { path: c => { c.beginPath(); c.moveTo(-13, HY - 15); c.quadraticCurveTo(-15, HY - 22, -11, HY - 27); c.quadraticCurveTo(-8, HY - 21, -5, HY - 18); c.closePath(); c.moveTo(6, HY - 19); c.quadraticCurveTo(10, HY - 25, 16, HY - 26); c.quadraticCurveTo(15, HY - 20, 13, HY - 15); c.closePath(); }, fill: '#f6d24a',
      after: c => { c.strokeStyle = 'rgba(160,110,0,.7)'; c.lineWidth = .9; for (const [x, y, a] of [[-11, HY - 20, .3], [-10, HY - 23, .3], [11, HY - 20, -.5], [13, HY - 22.5, -.5]]) { c.beginPath(); c.moveTo(x - 2 * Math.cos(a), y - 2 * Math.sin(a)); c.lineTo(x + 2 * Math.cos(a), y + 2 * Math.sin(a)); c.stroke(); } } },   // 小鬼角（有橫紋）
    { path: c => aCirc(c, 0, HY, R), fill: P.suit, after: c => { c.save(); c.beginPath(); c.arc(0, HY, R, 0, TAU); c.clip(); c.fillStyle = chBall(c, 0, HY, R, P.suit); c.globalAlpha = .6; c.fillRect(-R, HY - R, R * 2, R * 2); c.restore(); } },
  ], 1.8);
  // 帽上的雷紋
  c.beginPath(); c.moveTo(-6, HY - 19); c.lineTo(-1, HY - 14); c.lineTo(-4, HY - 13); c.lineTo(2, HY - 8); c.lineTo(-7, HY - 13); c.lineTo(-4, HY - 14); c.closePath(); aFI(c, '#f6d24a', 1);
  aEll(c, 4, HY + 4, 14, 9.5); c.fillStyle = CH_SKIN; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.4; c.stroke();
  chEye(c, -1, HY + 3, 4.3, 5.8, ['#3a2a00', '#f2b81a'], o.eye); chEye(c, 10, HY + 3, 4.5, 6, ['#3a2a00', '#f2b81a'], o.eye);
  chBlush(c, -6, HY + 9); chBlush(c, 16, HY + 9);
  c.strokeStyle = INK; c.lineWidth = 1.2; c.beginPath(); c.moveTo(2, HY + 10.5); c.quadraticCurveTo(5, HY + 13, 8, HY + 10.5); c.stroke();
  c.fillStyle = '#fff'; c.beginPath(); c.moveTo(6, HY + 11.3); c.lineTo(6.8, HY + 13.6); c.lineTo(7.8, HY + 11); c.closePath(); c.fill(); c.lineWidth = .6; c.stroke();   // 虎牙
  chHand(c, 15, -16 + Math.sin(t * 6) * -1.2, P.dark);
  // 小閃電
  c.save(); c.translate(26, -34 + Math.sin(t * 7) * 2); c.beginPath(); c.moveTo(1, -8); c.lineTo(-3, 0); c.lineTo(0, 0); c.lineTo(-2, 7); c.lineTo(4, -2); c.lineTo(1, -2); c.lineTo(3, -8); c.closePath(); aFI(c, '#ffe066', 1); c.restore();
}

// ---- 新角色 6 名 ----
// 焰（ほむら）：露臉的女忍，橘紅刺刺頭髮綁高馬尾，額頭綁頭巾
function drawHomura(c, P, t, o = {}) {
  const HY = -30, R = 21, sw = Math.sin(t * 7) * 3, hair = '#f0602e';
  heroSilhouette(c, [
    { path: c => { c.beginPath(); c.moveTo(-6, HY - 18); c.quadraticCurveTo(-30, HY - 30 + sw, -38, HY - 8 + sw); c.lineTo(-30, HY - 12 + sw); c.lineTo(-34, HY + 4 + sw); c.lineTo(-24, HY - 4 + sw * .6); c.quadraticCurveTo(-16, HY - 4, -10, HY - 10); c.closePath(); }, fill: hair },
    ...chBody(c, P, t),
    { path: c => aCirc(c, 0, HY, R), fill: CH_SKIN },
    { path: c => { c.beginPath(); c.moveTo(-R - 1, HY + 4); c.quadraticCurveTo(-R - 2, HY - R - 4, 2, HY - R - 3); c.quadraticCurveTo(R + 2, HY - R, R + 1, HY - 2); c.lineTo(R - 4, HY - 7); c.lineTo(R - 7, HY - 3); c.lineTo(R - 10, HY - 9); c.lineTo(11, HY - 5); c.lineTo(7, HY - 10); c.lineTo(2, HY - 6); c.lineTo(-3, HY - 11); c.lineTo(-8, HY - 5); c.lineTo(-13, HY - 8); c.lineTo(-16, HY + 6); c.closePath(); }, fill: hair,
      after: c => { c.fillStyle = 'rgba(255,210,160,.4)'; aEll(c, -6, HY - 17, 7, 2.6, -.2); c.fill(); } },
  ], 1.8);
  c.save(); c.beginPath(); c.arc(0, HY, R, 0, TAU); c.clip(); c.fillStyle = P.suit; c.beginPath(); c.moveTo(-R - 2, HY - 15); c.lineTo(R + 2, HY - 11); c.lineTo(R + 2, HY - 6); c.lineTo(-R - 2, HY - 10); c.closePath(); c.fill(); c.restore();
  aRR(c, 2, HY - 16, 11, 6, 2); aFI(c, '#dfe4ec', 1); c.fillStyle = P.suit; c.font = '900 4.6px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('焰', 7.5, HY - 12.8);
  c.beginPath(); c.moveTo(-R + 1, HY - 11); c.quadraticCurveTo(-30, HY - 15 + sw, -32, HY - 3 + sw); c.lineTo(-27, HY - 5 + sw); c.quadraticCurveTo(-24, HY - 9, -R + 2, HY - 7); c.closePath(); aFI(c, P.suit, 1.4);
  girlEye(c, 1, HY + 4, 4.4, 6, ['#4a1a00', '#f08a2a'], -1); girlEye(c, 13, HY + 4, 4.6, 6.2, ['#4a1a00', '#f08a2a'], 1);
  chBlush(c, -5, HY + 11); chBlush(c, 18, HY + 11);
  c.strokeStyle = INK; c.lineWidth = 1.2; c.beginPath(); c.moveTo(5, HY + 12.5); c.quadraticCurveTo(8, HY + 15, 11, HY + 12); c.stroke();
  c.fillStyle = '#fff'; c.beginPath(); c.moveTo(9.4, HY + 13); c.lineTo(10.2, HY + 15); c.lineTo(10.9, HY + 12.6); c.fill();
  chHand(c, 16, -16 + Math.sin(t * 6) * -1.2, P.dark);
  c.save(); c.translate(20, -24); c.rotate(.25); aRR(c, -3, -7, 6, 12, 1); aFI(c, '#f4ead0', 1); c.fillStyle = '#c0262d'; c.font = '900 4px sans-serif'; c.textAlign = 'center'; c.fillText('爆', 0, 0); c.restore();
}
// 狐（こん）：狐耳兜帽＋臉上的狐狸面具，大尾巴和忍服同色
function drawKon(c, P, t, o = {}) {
  const HY = -30, R = 21, wag = Math.sin(t * 4) * .18;
  c.save(); c.translate(-8, -8); c.rotate(-.5 + wag);
  heroSilhouette(c, [{ path: c => { c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-26, 4, -30, -18); c.quadraticCurveTo(-22, -34, -12, -26); c.quadraticCurveTo(-8, -12, 4, -6); c.closePath(); }, fill: P.suit,
    after: c => { c.save(); c.clip(); c.fillStyle = chLt(P.suit, .55); aEll(c, -24, -26, 9, 8, .4); c.fill(); c.strokeStyle = 'rgba(0,0,0,.12)'; c.lineWidth = 1; for (const k of [0, 1]) { c.beginPath(); c.moveTo(-6 - k * 8, -4 - k * 4); c.quadraticCurveTo(-14 - k * 6, -12 - k * 4, -10 - k * 6, -20 - k * 2); c.stroke(); } c.restore(); } }], 1.8);
  c.restore();
  heroSilhouette(c, [
    ...chBody(c, P, t),
    { path: c => { c.beginPath(); c.arc(0, HY, R, 0, TAU);
        c.moveTo(-15, HY - 11); c.quadraticCurveTo(-21, HY - 26, -16, HY - 33); c.quadraticCurveTo(-7, HY - 27, -3, HY - 20); c.closePath();
        c.moveTo(4, HY - 20); c.quadraticCurveTo(11, HY - 31, 17, HY - 33); c.quadraticCurveTo(19, HY - 22, 16, HY - 12); c.closePath(); }, fill: P.suit,
      after: c => { c.fillStyle = '#ffb4c4'; c.beginPath(); c.moveTo(-13, HY - 15); c.quadraticCurveTo(-17, HY - 25, -15, HY - 29); c.quadraticCurveTo(-9, HY - 24, -7, HY - 19); c.fill(); c.beginPath(); c.moveTo(7, HY - 19); c.quadraticCurveTo(12, HY - 27, 15, HY - 29); c.quadraticCurveTo(16, HY - 21, 14, HY - 15); c.fill();
        c.save(); c.beginPath(); c.arc(0, HY, R, 0, TAU); c.clip(); c.fillStyle = chBall(c, 0, HY, R, P.suit); c.globalAlpha = .5; c.fillRect(-R, HY - R, R * 2, R * 2); c.restore(); } },
  ], 1.8);
  // 圓圓的狐面
  c.beginPath(); c.moveTo(-9, HY - 4); c.quadraticCurveTo(4, HY - 11, 16, HY - 4); c.quadraticCurveTo(22, HY + 4, 20, HY + 8); c.quadraticCurveTo(12, HY + 16, 4, HY + 14); c.quadraticCurveTo(-10, HY + 11, -9, HY - 4); c.closePath(); aFI(c, '#fffaf2', 1.5);
  c.fillStyle = '#e03a3a'; c.beginPath(); c.moveTo(-5, HY - 3); c.quadraticCurveTo(-1, HY - 7, 2, HY - 3); c.quadraticCurveTo(-2, HY - 4.6, -5, HY - 3); c.fill(); c.beginPath(); c.moveTo(9, HY - 3); c.quadraticCurveTo(13, HY - 7, 16, HY - 3); c.quadraticCurveTo(13, HY - 4.6, 9, HY - 3); c.fill();
  c.strokeStyle = INK; c.lineWidth = 1.8; c.beginPath(); c.moveTo(-3, HY + 3); c.quadraticCurveTo(0, HY, 3, HY + 3); c.moveTo(10, HY + 3); c.quadraticCurveTo(13, HY, 16, HY + 3); c.stroke();
  chBlush(c, -3, HY + 8, 2.6); chBlush(c, 16, HY + 8, 2.6);
  aEll(c, 19.5, HY + 7, 1.8, 1.4); c.fillStyle = INK; c.fill();
  c.strokeStyle = INK; c.lineWidth = 1; c.beginPath(); c.moveTo(12, HY + 10.5); c.quadraticCurveTo(14, HY + 12.5, 16, HY + 10.5); c.quadraticCurveTo(18, HY + 12.5, 19.5, HY + 9); c.stroke();
  c.fillStyle = '#e03a3a'; c.beginPath(); c.arc(4, HY - 6, 1.4, 0, TAU); c.fill();
  chHand(c, 15, -16 + Math.sin(t * 6) * -1.2, P.dark);
  for (const [x, y, s] of [[25, -38, 1], [-26, -46, .8]]) { const f = Math.sin(t * 8 + x) * 1.5; c.fillStyle = 'rgba(120,200,255,.85)'; c.beginPath(); c.moveTo(x, y - 7 * s + f); c.quadraticCurveTo(x + 5 * s, y, x, y + 4 * s); c.quadraticCurveTo(x - 5 * s, y, x, y - 7 * s + f); c.fill(); c.fillStyle = '#fff'; aCirc(c, x, y + 1, 1.4 * s); c.fill(); }
}
// 笠（かさ）：大斗笠下圓圓的影子臉，兩顆發亮的大圓眼；高領斗篷、鎖鐮
function drawKasa(c, P, t, o = {}) {
  const HY = -29, R = 19, sw = Math.sin(t * 5) * 2;
  heroSilhouette(c, [
    { path: c => { c.beginPath(); c.moveTo(-12, -22); c.quadraticCurveTo(-24, -8 + sw, -20, 1 + sw); c.lineTo(-6, -4); c.closePath(); }, fill: P.dark },
    ...chBody(c, P, t, 1.1),
    { path: c => { c.beginPath(); c.moveTo(-13, -16); c.quadraticCurveTo(0, -23, 14, -16); c.lineTo(15, -9); c.quadraticCurveTo(0, -12, -13, -9); c.closePath(); }, fill: P.dark },
    { path: c => aCirc(c, 1, HY, R), fill: '#2a2c40' },
    { path: c => { c.beginPath(); c.moveTo(-29, HY - 6); c.quadraticCurveTo(1, HY - 3, 31, HY - 6); c.quadraticCurveTo(14, HY - 21, 1, HY - 31); c.quadraticCurveTo(-12, HY - 21, -29, HY - 6); c.closePath(); }, fill: '#e2c27a',
      after: c => { c.save(); c.clip(); c.strokeStyle = 'rgba(150,100,40,.45)'; c.lineWidth = 1; for (let i = -5; i <= 5; i++) { c.beginPath(); c.moveTo(1, HY - 31); c.lineTo(1 + i * 6, HY - 4); c.stroke(); } c.fillStyle = 'rgba(255,255,255,.3)'; c.beginPath(); c.moveTo(1, HY - 30); c.quadraticCurveTo(-10, HY - 20, -23, HY - 8); c.lineTo(-16, HY - 8); c.quadraticCurveTo(-5, HY - 20, 1, HY - 30); c.fill(); c.restore(); } },
  ], 1.8);
  c.strokeStyle = '#c0262d'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(-26, HY - 6); c.quadraticCurveTo(1, HY - 1, 28, HY - 6); c.stroke();
  aCirc(c, 1, HY - 31, 2.2); aFI(c, '#c0262d', 1);   // 笠頂的紅珠
  // 發亮的大圓眼＋小腮紅
  const blink = ((t * .8) % 4) < .1;
  c.save(); c.shadowColor = '#ffe066'; c.shadowBlur = 7;
  for (const x of [4, 14]) { if (blink) { c.fillStyle = '#ffe066'; c.fillRect(x - 3, HY + 4, 6, 1.2); continue; } aCirc(c, x, HY + 4, 3.6); c.fillStyle = '#ffe066'; c.fill(); }
  c.restore();
  if (!blink) { c.fillStyle = '#fff'; for (const x of [4, 14]) { aCirc(c, x - 1.2, HY + 2.6, 1.3); c.fill(); aCirc(c, x + 1.2, HY + 5.2, .6); c.fill(); } }
  c.fillStyle = 'rgba(255,120,150,.55)'; aEll(c, -2, HY + 9, 2.6, 1.3); c.fill(); aEll(c, 19, HY + 9, 2.6, 1.3); c.fill();
  c.strokeStyle = '#ffe066'; c.lineWidth = 1; c.beginPath(); c.moveTo(7.5, HY + 10); c.quadraticCurveTo(9, HY + 11.5, 10.5, HY + 10); c.stroke();
  const hx = 15, hy = -15 + Math.sin(t * 6) * -1.2;
  c.strokeStyle = '#8a8f9c'; c.lineWidth = 1.4; c.setLineDash([2, 1.5]); c.beginPath(); c.moveTo(hx, hy); c.quadraticCurveTo(28, -2, 25, -28); c.stroke(); c.setLineDash([]);
  c.save(); c.translate(25, -28); c.rotate(-.4); c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(10, -6, 14, 2); c.quadraticCurveTo(8, -1, 2, 3); c.closePath(); aFI(c, '#e4e8f0', 1.2); c.fillStyle = '#7a4a2a'; c.fillRect(-2, -1, 4, 10); c.restore();
  chHand(c, hx, hy, P.dark);
}
// 岩（がん）：圓滾滾的光頭小和尚兵，大念珠、笑瞇瞇
function drawGan(c, P, t, o = {}) {
  const HY = -29, R = 21;
  heroSilhouette(c, [
    ...chBody(c, P, t, 1.45),
    { path: c => { c.beginPath(); c.arc(-R + 1, HY + 3, 4.2, 0, TAU); }, fill: '#f8cfa4' },
    { path: c => aCirc(c, 0, HY, R), fill: '#f8cfa4',
      after: c => { c.save(); c.beginPath(); c.arc(0, HY, R, 0, TAU); c.clip(); c.fillStyle = 'rgba(255,255,255,.45)'; aEll(c, -6, HY - 13, 8, 4, -.3); c.fill(); c.restore(); } },
  ], 1.8);
  c.save(); c.beginPath(); c.arc(0, HY, R, 0, TAU); c.clip(); c.fillStyle = P.suit; c.fillRect(-R, HY - 13, R * 2, 5); c.restore();
  c.beginPath(); c.moveTo(-R + 1, HY - 11); c.lineTo(-R - 8, HY - 15); c.lineTo(-R - 6, HY - 7); c.closePath(); aFI(c, P.suit, 1.3);
  c.fillStyle = INK; aRR(c, -2, HY - 4, 7, 2.4, 1.2); c.fill(); aRR(c, 10, HY - 4, 7, 2.4, 1.2); c.fill();   // 短粗眉
  chEye(c, 2, HY + 3.5, 3.8, 5, ['#2a1408', '#8a5a2a'], o.eye); chEye(c, 13, HY + 3.5, 4, 5.2, ['#2a1408', '#8a5a2a'], o.eye);
  chBlush(c, -4, HY + 10, 3.4); chBlush(c, 19, HY + 10, 3.4);
  c.strokeStyle = INK; c.lineWidth = 1.3; c.beginPath(); c.moveTo(4, HY + 11); c.quadraticCurveTo(8, HY + 15.5, 12, HY + 11); c.closePath(); c.fillStyle = '#c03a3a'; c.fill(); c.stroke();
  for (let i = 0; i < 9; i++) { const a = Math.PI * (.15 + i / 8 * .7), x = Math.cos(a) * 15, y = -14 + Math.sin(a) * 6 - 2; aCirc(c, x, y, i === 4 ? 3.8 : 2.8); aFI(c, i === 4 ? '#c0262d' : '#8a5428', 1); }
  chHand(c, 20, -15 + Math.sin(t * 6) * -1.2, P.dark);
  c.save(); c.translate(24, -28); c.beginPath(); c.moveTo(-6, 2); c.quadraticCurveTo(-6, -6, 1, -6); c.quadraticCurveTo(7, -5, 6, 1); c.quadraticCurveTo(5, 6, -1, 6); c.quadraticCurveTo(-6, 6, -6, 2); c.closePath(); aFI(c, '#9a9080', 1.4); c.fillStyle = 'rgba(255,255,255,.35)'; aEll(c, -1, -3, 3, 1.5); c.fill(); c.restore();
}
// 霞（かすみ）：黑長髮雙丸子頭，美少女眼，覆面包住下半臉
function drawKasumi(c, P, t, o = {}) {
  const HY = -30, R = 21, sw = Math.sin(t * 5) * 2, hair = '#2a2638';
  heroSilhouette(c, [
    { path: c => { c.beginPath(); c.moveTo(-R + 2, HY - 6); c.quadraticCurveTo(-R - 8, HY + 18 + sw, -14, HY + 30 + sw); c.lineTo(-4, HY + 20); c.lineTo(-6, HY); c.closePath(); }, fill: hair },
    ...chBody(c, P, t),
    { path: c => aCirc(c, -12, HY - 20, 7.5), fill: hair }, { path: c => aCirc(c, 10, HY - 22, 7.5), fill: hair },
    { path: c => aCirc(c, 0, HY, R), fill: CH_SKIN },
    { path: c => { c.beginPath(); c.moveTo(-R - 1, HY + 8); c.quadraticCurveTo(-R - 3, HY - R - 3, 2, HY - R - 2); c.quadraticCurveTo(R + 3, HY - R + 1, R, HY - 1); c.quadraticCurveTo(15, HY - 6, 11, HY - 5); c.quadraticCurveTo(7, HY - 11, 1, HY - 7); c.quadraticCurveTo(-5, HY - 10, -10, HY - 4); c.quadraticCurveTo(-14, HY, -15, HY + 10); c.closePath(); }, fill: hair,
      after: c => { c.strokeStyle = 'rgba(170,150,230,.5)'; c.lineWidth = 1.4; c.beginPath(); c.arc(-2, HY - 4, 15, Math.PI * 1.15, Math.PI * 1.55); c.stroke(); } },
  ], 1.8);
  // 丸子上的小緞帶（換裝色）
  for (const [x, y] of [[-12, HY - 13], [10, HY - 15]]) { c.beginPath(); c.moveTo(x, y); c.lineTo(x - 4, y - 2.5); c.lineTo(x - 4, y + 2.5); c.closePath(); c.moveTo(x, y); c.lineTo(x + 4, y - 2.5); c.lineTo(x + 4, y + 2.5); c.closePath(); aFI(c, P.suit, .9); }
  girlEye(c, 1, HY + 2, 4.4, 6, ['#2a0a4a', '#a86ae8'], -1); girlEye(c, 13, HY + 2, 4.6, 6.2, ['#2a0a4a', '#a86ae8'], 1);
  // 覆面：從鼻樑以下包住整個下半臉，繞到頭的兩側
  c.save(); c.beginPath(); c.arc(0, HY, R + .5, 0, TAU); c.clip();
  c.beginPath(); c.moveTo(-R - 2, HY + 7); c.quadraticCurveTo(6, HY + 4, R + 2, HY + 6); c.lineTo(R + 2, HY + R + 2); c.lineTo(-R - 2, HY + R + 2); c.closePath();
  const mg = c.createLinearGradient(0, HY + 5, 0, HY + R); mg.addColorStop(0, chLt(P.suit, .15)); mg.addColorStop(1, P.dark); c.fillStyle = mg; c.fill();
  c.strokeStyle = 'rgba(0,0,0,.2)'; c.lineWidth = 1; for (const y of [12, 16]) { c.beginPath(); c.moveTo(-R, HY + y); c.quadraticCurveTo(6, HY + y - 2, R, HY + y); c.stroke(); }
  c.restore();
  c.strokeStyle = INK; c.lineWidth = 1.5; c.beginPath(); c.moveTo(-R + .5, HY + 7.5); c.quadraticCurveTo(6, HY + 4, R - .3, HY + 6.2); c.stroke();
  c.beginPath(); c.arc(0, HY, R, Math.asin(6.2 / R), Math.PI - Math.asin(7.5 / R)); c.stroke();
  c.fillStyle = 'rgba(255,255,255,.25)'; aEll(c, 12, HY + 8, 3, 1.2, -.1); c.fill();
  chBlush(c, -5, HY + 6.5, 2.4); chBlush(c, 18, HY + 6, 2.4);
  c.beginPath(); c.moveTo(-R - 1, HY + 9); c.quadraticCurveTo(-28, HY + 8 + sw, -30, HY + 16 + sw); c.lineTo(-25, HY + 15 + sw); c.quadraticCurveTo(-24, HY + 12, -R, HY + 13); c.closePath(); aFI(c, P.dark, 1.2);   // 覆面在腦後的結尾
  c.save(); c.translate(22, -14); aRR(c, -3.5, -3, 7, 8, 2.5); aFI(c, '#c8a0f0', 1.2); c.fillStyle = '#5a3a20'; c.fillRect(-1.6, -6, 3.2, 3); c.restore();
  for (let i = 0; i < 3; i++) { const p = (t * .8 + i / 3) % 1; c.fillStyle = `rgba(190,130,240,${.6 * (1 - p)})`; aCirc(c, 27 + i * 2, -20 - p * 14, 2.5 + p * 4); c.fill(); }
  chHand(c, 18, -10 + Math.sin(t * 6) * -1.2, P.dark);
}
// 雫（しずく）：灰色虎斑的貓耳兜帽＋同款尾巴、ω 嘴、鈴鐺（虎斑是招牌，不隨換裝變色）
const TABBY = '#a4a6ae', TABBY_D = '#5c5e68';
function tabbyStripes(c, x, y, r) { c.fillStyle = TABBY_D; for (const [dx, dy, a, l] of [[-3, -r + 2, 0, 5], [3, -r + 2.5, 0, 4.5], [-9, -r + 5, -.5, 4], [9, -r + 5.5, .5, 4], [-r + 2, -3, -1.3, 4], [r - 2, -3, 1.3, 4], [-r + 3, 5, -1.6, 3.4]]) { c.save(); c.translate(x + dx, y + dy); c.rotate(a); c.beginPath(); c.moveTo(-1.6, 0); c.quadraticCurveTo(0, l * 1.1, 1.6, 0); c.closePath(); c.fill(); c.restore(); } }
function drawShizuku(c, P, t, o = {}) {
  const HY = -30, R = 21, wag = Math.sin(t * 5) * .3;
  c.save(); c.translate(-8, -6); c.rotate(wag);
  heroSilhouette(c, [{ path: c => { c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-18, 2, -20, -14); c.quadraticCurveTo(-21, -22, -15, -24); c.quadraticCurveTo(-13, -16, -14, -12); c.quadraticCurveTo(-12, -4, 2, -4); c.closePath(); }, fill: TABBY,
    after: c => { c.save(); c.clip(); c.fillStyle = TABBY_D; for (const [x, y] of [[-6, -2], [-13, -6], [-18, -13], [-17, -20]]) { aEll(c, x, y, 1.6, 3.4, .6); c.fill(); } c.restore(); } }], 1.8);
  c.restore();
  heroSilhouette(c, [
    ...chBody(c, P, t),
    { path: c => { c.beginPath(); c.arc(0, HY, R, 0, TAU);
        c.moveTo(-17, HY - 9); c.quadraticCurveTo(-21, HY - 27, -14, HY - 31); c.quadraticCurveTo(-7, HY - 25, -4, HY - 19); c.closePath();
        c.moveTo(6, HY - 19); c.quadraticCurveTo(12, HY - 29, 19, HY - 28); c.quadraticCurveTo(21, HY - 19, 18, HY - 9); c.closePath(); }, fill: TABBY,
      after: c => { c.fillStyle = '#ffb4c4'; c.beginPath(); c.moveTo(-15, HY - 14); c.quadraticCurveTo(-17, HY - 25, -13, HY - 27); c.quadraticCurveTo(-9, HY - 23, -7, HY - 18); c.fill(); c.beginPath(); c.moveTo(9, HY - 18); c.quadraticCurveTo(13, HY - 25, 17, HY - 24); c.quadraticCurveTo(18, HY - 18, 16, HY - 13); c.fill();
        c.save(); c.beginPath(); c.arc(0, HY, R, 0, TAU); c.clip(); c.fillStyle = chBall(c, 0, HY, R, TABBY); c.globalAlpha = .5; c.fillRect(-R, HY - R, R * 2, R * 2); c.globalAlpha = 1; tabbyStripes(c, 0, HY, R); c.restore(); } },
  ], 1.8);
  aEll(c, 4, HY + 4, 14.5, 10.5); c.fillStyle = CH_SKIN; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.4; c.stroke();
  chEye(c, -1, HY + 3, 4.6, 6.2, ['#0a3a2a', '#3ac88a'], o.eye); chEye(c, 11, HY + 3, 4.8, 6.4, ['#0a3a2a', '#3ac88a'], o.eye);
  catMouth(c, 5.5, HY + 10.5);
  c.strokeStyle = INK; c.lineWidth = .9; for (const [x, d] of [[-8, -1], [18, 1]]) for (const dy of [-1.5, 1.5]) { c.beginPath(); c.moveTo(x, HY + 9 + dy); c.lineTo(x + d * 6, HY + 8 + dy * 2); c.stroke(); }
  chBlush(c, -5, HY + 8.5); chBlush(c, 16, HY + 8.5);
  aCirc(c, 3, -12, 3.6); aFI(c, '#f2c14e', 1.2); c.fillStyle = INK; c.fillRect(1, -11.5, 4, .9); aCirc(c, 3, -9.6, .8); c.fill();
  chHand(c, 15, -16 + Math.sin(t * 6) * -1.2, P.dark);
  for (let i = 0; i < 2; i++) { const p = (t * .7 + i * .5) % 1, x = 22 + i * 5, y = -30 - p * 10; c.globalAlpha = 1 - p; c.beginPath(); c.moveTo(x, y - 4); c.quadraticCurveTo(x + 3, y + 1, x, y + 2); c.quadraticCurveTo(x - 3, y + 1, x, y - 4); aFI(c, '#7ad8f0', .9); c.globalAlpha = 1; }
}

// 舊角色（重新設計外觀，技能不變）
const OLD_CHARS = [
  { id: 'ao', draw: drawAo, out: 1, n: ['蒼', 'あお', 'Ao'], sk: ['苦無環', '苦無の輪', 'Kunai Ring'], d: ['苦無在身邊繞圈，碰到的敵人會被斬', '苦無が周りを回り、触れた敵を斬る', 'Kunai circle you and slash what they touch'], evo: ['刃之結界：6 把苦無、半徑更大', '刃の結界：6本・輪が広がる', 'Blade Barrier: 6 kunai, wider ring'] },
  { id: 'sakura', draw: drawSakura, out: 4, n: ['桜', 'さくら', 'Sakura'], sk: ['風刃', '風刃', 'Wind Blades'], d: ['往左右射出風刃，貫穿路上的敵人', '左右へ風刃を放ち、敵を貫く', 'Fires wind blades left and right'], evo: ['鎌鼬：巨大風刃，在牆壁間反彈 3 次', '鎌鼬：巨大な風刃が壁で3回反射', 'Kamaitachi: giant blades that bounce 3 times'] },
  { id: 'kage', draw: drawKage, out: 3, n: ['影', 'かげ', 'Kage'], sk: ['雷遁', '雷遁', 'Lightning'], d: ['定時落雷打中附近的敵人', '一定間隔で近くの敵に雷を落とす', 'Calls lightning on nearby foes'], evo: ['雷神：3 道雷，每道再連鎖 2 名敵人', '雷神：雷3本、それぞれ2体へ連鎖', 'Raijin: 3 bolts that chain twice'] },
];
const NEW_CHARS = [
  { id: 'homura', draw: drawHomura, out: 0, n: ['焰', 'ほむら', 'Homura'], sk: ['爆炎札', '爆炎札', 'Blast Tags'],
    d: ['每 2.5 秒把爆炎札貼到最近的敵人身上，0.6 秒後爆炸，炸飛周圍敵人', '2.5秒ごとに近くの敵へ爆炎札、0.6秒後に周囲ごと爆発', 'Sticks a blast tag on the nearest foe every 2.5s; it explodes 0.6s later'],
    evo: ['紅蓮爆陣：一次貼 3 張，連鎖引爆', '紅蓮爆陣：3枚同時、連鎖爆発', 'Crimson Blast: 3 tags at once that chain'] },
  { id: 'kon', draw: drawKon, out: 4, n: ['狐', 'こん', 'Kon'], sk: ['影分身', '影分身', 'Shadow Clone'],
    d: ['一個半透明的分身跟在身後，每 3 秒自己衝向附近的敵人斬一刀', '半透明の分身が後ろについて、3秒ごとに近くの敵へ斬りかかる', 'A clone follows you and dashes to slash a nearby foe every 3s'],
    evo: ['九尾：分身變成 3 個，並會擋下一次攻擊', '九尾：分身が3体に、攻撃を1回防ぐ', 'Nine Tails: 3 clones that also block a hit'] },
  { id: 'kasa', draw: drawKasa, out: 7, n: ['笠', 'かさ', 'Kasa'], sk: ['鎖鐮', '鎖鎌', 'Chain Sickle'],
    d: ['每 2 秒甩出鎖鐮，在身體周圍掃出半圈大弧，範圍內的敵人全被斬', '2秒ごとに鎖鎌を振り回し、周囲を半円に薙ぎ払う', 'Swings a chain sickle in a wide half-circle every 2s'],
    evo: ['旋風鐮：整圈旋轉，範圍加大', '旋風鎌：一回転して範囲拡大', 'Whirlwind: full spin with bigger reach'] },
  { id: 'gan', draw: drawGan, out: 5, n: ['岩', 'がん', 'Gan'], sk: ['落石', '落石', 'Rockfall'],
    d: ['每 3 秒從畫面上方砸下大岩石，壓扁路線上的敵人，也會砸碎敵人的飛鏢', '3秒ごとに画面上から大岩を落とし、敵と飛び道具を砕く', 'Drops a boulder from above every 3s, crushing foes and projectiles'],
    evo: ['山崩：一次落下 3 顆，落地後滾動', '山崩れ：3つ同時に落ちて転がる', 'Landslide: 3 boulders that roll on landing'] },
  { id: 'kasumi', draw: drawKasumi, out: 6, n: ['霞', 'かすみ', 'Kasumi'], sk: ['毒霧', '毒霧', 'Poison Mist'],
    d: ['跳躍落地時留下一團毒霧，停留 3 秒，碰到的敵人會被毒倒', '着地すると毒霧を残し、3秒間触れた敵を倒す', 'Leaves a poison cloud where you land; it lingers 3s'],
    evo: ['朧：毒霧跟著身體移動，範圍加倍', '朧：毒霧が体にまとわり範囲倍増', 'Oboro: the mist follows you at double size'] },
  { id: 'shizuku', draw: drawShizuku, out: 9, n: ['雫', 'しずく', 'Shizuku'], sk: ['水龍彈', '水龍弾', 'Water Dragon'],
    d: ['每 2.8 秒往正上方射出水龍，貫穿一整列的敵人', '2.8秒ごとに真上へ水龍を放ち、一列の敵を貫く', 'Fires a water dragon straight up every 2.8s, piercing a whole column'],
    evo: ['大瀑布：左右兩條水龍＋中間一條', '大瀑布：左右と中央に3本の水龍', 'Great Falls: 3 dragons side by side'] },
];
const ALL_CHARS = [...OLD_CHARS, ...NEW_CHARS];
