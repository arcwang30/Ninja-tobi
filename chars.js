'use strict';
/* NINJA 鳶 TOBI — 角色造型與角色專屬技能（在 art.js 之後、game.js 之前載入；用到的 g、ctx 等都在呼叫時才讀取）
   造型：和主角同樣的「大福」比例，頭部完全不同；pal = 換裝顏色 { suit, dark, band }，髮色／面具／斗笠／虎斑不變色 */
const CH_SKIN = '#fadcbc';
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
function girlEye(c, x, y, rx, ry, iris, out, mood = 'open') {
  if (mood && mood !== 'open') { heroEye(c, x, y, rx, ry, mood); return; }   // 眨眼、受傷、專注時用一般的表情
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
  girlEye(c, 1, HY + 4, 4.4, 6, ['#5a1a3a', '#e85a9a'], -1, o.eye); girlEye(c, 13, HY + 4, 4.6, 6.2, ['#5a1a3a', '#e85a9a'], 1, o.eye);
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
  girlEye(c, 1, HY + 4, 4.4, 6, ['#4a1a00', '#f08a2a'], -1, o.eye); girlEye(c, 13, HY + 4, 4.6, 6.2, ['#4a1a00', '#f08a2a'], 1, o.eye);
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
  girlEye(c, 1, HY + 2, 4.4, 6, ['#2a0a4a', '#a86ae8'], -1, o.eye); girlEye(c, 13, HY + 2, 4.6, 6.2, ['#2a0a4a', '#a86ae8'], 1, o.eye);
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


// 遊戲裡用的造型（SKINS 的 id → 繪製函式）；鳶用 art.js 原本的 drawHeroNinja
const CHAR_DRAW = { ao: drawAo, sakura: drawSakura, kage: drawKage, homura: drawHomura, kon: drawKon, kasa: drawKasa, gan: drawGan, kasumi: drawKasumi, shizuku: drawShizuku };

// ===== 角色專屬技能 =====
// 爆炎札：貼在敵人身上，0.6 秒後爆炸／影分身：跟在身後，定時衝去斬敵人／水龍彈：往正上方貫穿一整列
// 毒霧：落地時留下一團毒霧（在 game.js 的 land() 呼叫 dropMist）／落石：從畫面上方砸下岩石／鎖鐮：在身邊掃出大弧
const csOf = () => g.cs || (g.cs = { tags: [], clones: [], waters: [], mists: [], rocks: [], swings: [], T: {} });
const hitBox = (e, x, y, r) => Math.abs(e.x - x) < ENEMY[e.type].w / 2 + r && Math.abs(e.y - y) < ENEMY[e.type].h / 2 + r;
function blastAt(x, y, r) {   // 爆炎：範圍內全部斬殺，回傳斬殺數（連鎖爆破成就）
  let n = 0;
  g.booms.push({ x, y, r, t: 0, c: '#ffb04a' }); burst(x, y, '#ff8a3a', 12);
  for (const e of g.enemies) if (!e.dead && Math.hypot(e.x - x, e.y - y) < r + ENEMY[e.type].w / 2) { autoHit(e); if (e.dead) n++; }
  if (n >= 3) unlock('chain3');
  if (n >= 5) unlock('chain5');
  SFX.impact(); g.shake = Math.max(g.shake, 5);
  return n;
}
function dropMist(x, y) {
  const C = csOf(), v = SKV.mist(sk('mist'));
  C.mists.push({ x, y: y - 14, r: v.r * (v.follow ? .7 : 1), life: v.life, max: v.life, tick: 0 });
  if (C.mists.length > 8) C.mists.shift();
}
function updateCharSkills(dt, vis, dist) {
  const C = csOf(), T = C.T, p = g.p, px = p.x, py = p.y - 20;
  let l, v;
  // 爆炎札
  if ((l = sk('tags'))) {
    v = SKV.tags(l); T.tag = (T.tag ?? 1) - dt;
    if (T.tag <= 0) {
      const ts = g.enemies.filter(e => vis(e) && dist(e) < 330 && !C.tags.some(o => o.e === e)).sort((a, b) => dist(a) - dist(b)).slice(0, v.n);
      if (ts.length) { for (const e of ts) C.tags.push({ e, x: px, y: py, t: 0, r: v.r, chain: v.chain }); T.tag = v.cd; SFX.throw(); } else T.tag = .3;
    }
  }
  const more = [];
  for (const o of C.tags) {
    o.t += dt; if (!o.e.dead) { o.ex = o.e.x; o.ey = o.e.y; }
    if (o.t >= .6 && !o.done) {
      o.done = true; const n = blastAt(o.ex ?? o.x, o.ey ?? o.y, o.r);
      if (o.chain && n) for (const e2 of g.enemies.filter(e => vis(e) && !e.dead && Math.hypot(e.x - o.ex, e.y - o.ey) < 160).slice(0, 3)) more.push({ e: e2, x: o.ex, y: o.ey, t: .3, r: o.r * .8 });
    }
  }
  C.tags = C.tags.filter(o => !o.done).concat(more);
  // 影分身
  if ((l = sk('clone'))) {
    v = SKV.clone(l);
    while (C.clones.length < v.n) C.clones.push({ x: px, y: py, at: 0, tg: null });
    T.cl = (T.cl ?? 1.5) - dt;
    if (T.cl <= 0) {
      const c2 = g.enemies.filter(e => vis(e) && dist(e) < 240);
      if (c2.length) { for (const cl of C.clones) if (!cl.tg) { cl.tg = pick(c2); cl.at = 0; } T.cl = v.cd; } else T.cl = .4;
    }
    if (v.guard) { T.gd = (T.gd ?? 12) - dt; if (T.gd <= 0 && g.barrier < 1) { g.barrier = 1; T.gd = 12; } }
    C.clones.forEach((cl, i) => {
      if (cl.tg) {   // 衝過去斬一刀再回來
        cl.at += dt * 3.2; const e = cl.tg;
        if (!e.dead) { cl.x += (e.x - cl.x) * Math.min(1, dt * 14); cl.y += (e.y - cl.y) * Math.min(1, dt * 14); }
        if (!e.dead && Math.hypot(cl.x - e.x, cl.y - e.y) < 22) { autoHit(e); cl.tg = null; }
        if (cl.at >= 1 || e.dead) cl.tg = null;
      } else {   // 跟在身後（一個接一個）
        const fx = px - p.face * (22 + i * 16), fy = py + 6 + i * 4;
        cl.x += (fx - cl.x) * Math.min(1, dt * 8); cl.y += (fy - cl.y) * Math.min(1, dt * 8);
      }
    });
  }
  // 水龍彈
  if ((l = sk('water'))) {
    v = SKV.water(l); T.wa = (T.wa ?? 1) - dt;
    if (T.wa <= 0) { T.wa = v.cd; const xs = v.n > 1 ? [px - 52, px, px + 52] : [px]; for (const x of xs) C.waters.push({ x: clamp(x, WALL + 10, W - WALL - 10), y: py, w: v.w, t: 0 }); SFX.wind(); }
  }
  for (const o of C.waters) {
    o.t += dt; o.y -= 900 * dt;
    for (const e of g.enemies) if (!e.dead && hitBox(e, o.x, o.y, o.w * .6)) autoHit(e);
    for (const s of g.eshots) if (Math.abs(s.x - o.x) < o.w && Math.abs(s.y - o.y) < 40) s.dead = true;
  }
  C.waters = C.waters.filter(o => o.y > g.camY - 80);
  // 毒霧
  if ((l = sk('mist'))) {
    v = SKV.mist(l);
    if (v.follow) { T.mf = (T.mf ?? 0) - dt; if (T.mf <= 0) { T.mf = .5; for (const e of g.enemies) if (!e.dead && Math.hypot(e.x - px, e.y - py) < v.r) autoHit(e); } }
  }
  for (const m of C.mists) {
    m.life -= dt; m.tick -= dt;
    if (m.tick <= 0) { m.tick = .35; for (const e of g.enemies) if (!e.dead && Math.hypot(e.x - m.x, e.y - m.y) < m.r + ENEMY[e.type].w / 2) autoHit(e); }
  }
  C.mists = C.mists.filter(m => m.life > 0);
  // 落石
  if ((l = sk('rock'))) {
    v = SKV.rock(l); T.rk = (T.rk ?? 1.5) - dt;
    if (T.rk <= 0) {
      const c2 = g.enemies.filter(vis);
      if (c2.length) { for (let i = 0; i < v.n; i++) { const e = c2[(Math.random() * c2.length) | 0]; C.rocks.push({ x: clamp(e.x + rnd(-10, 10), WALL + v.r, W - WALL - v.r), y: g.camY - 40, vy: 200, r: v.r, rot: 0 }); } T.rk = v.cd; } else T.rk = .4;
    }
  }
  for (const o of C.rocks) {
    o.vy += 1400 * dt; o.y += o.vy * dt; o.rot += dt * 4;
    for (const e of g.enemies) if (!e.dead && hitBox(e, o.x, o.y, o.r * .8)) { autoHit(e); g.shake = Math.max(g.shake, 3); }
    for (const s of g.eshots) if (Math.hypot(s.x - o.x, s.y - o.y) < o.r + 6) { s.dead = true; sparkle(s.x, s.y, '#ccc'); }
  }
  C.rocks = C.rocks.filter(o => o.y < g.camY + H + 60);
  // 鎖鐮
  if ((l = sk('sickle'))) {
    v = SKV.sickle(l); T.sc = (T.sc ?? 1) - dt;
    if (T.sc <= 0 && g.enemies.some(e => vis(e) && dist(e) < v.r + 20)) { T.sc = v.cd; C.swings.push({ t: 0, r: v.r, arc: v.arc, face: p.face, hit: new Set() }); SFX.slash(); }
    else if (T.sc <= 0) T.sc = .25;
  }
  for (const s of C.swings) {
    s.t += dt; const q = Math.min(1, s.t / .32);
    // 半圈多一點：從身後下方掃過頭頂到前方；進化：整圈
    const span = Math.PI * (s.arc > 1 ? 2 : 1.25), a0 = s.face > 0 ? Math.PI * .85 : Math.PI * .15;
    s.a0 = a0; s.a = a0 + span * q * (s.face > 0 ? 1 : -1);
    const lo = Math.min(a0, s.a), hi = Math.max(a0, s.a);
    for (const e of g.enemies) if (!e.dead && !s.hit.has(e)) {
      const d = Math.hypot(e.x - px, e.y - py); if (d > s.r + 14) continue;
      const ea = Math.atan2(e.y - py, e.x - px);
      for (const k of [-2, 0, 2]) { const aa = ea + k * Math.PI; if (aa >= lo && aa <= hi) { s.hit.add(e); autoHit(e); break; } }
    }
  }
  C.swings = C.swings.filter(s => s.t < .45);
}
function drawCharSkillFx() {
  if (!g || !g.cs) return;
  const c = ctx, C = g.cs, p = g.p, px = p.x, py = p.y - 20;
  // 毒霧：紫色的煙團
  for (const m of C.mists) { const a = Math.min(1, m.life / .5) * .55; for (let i = 0; i < 4; i++) { const ox = Math.sin(g.t * 1.5 + i * 1.7) * m.r * .35, oy = Math.cos(g.t * 1.2 + i) * m.r * .2; c.fillStyle = `rgba(170,110,230,${a * .6})`; aCirc(c, m.x + ox, m.y + oy, m.r * (.55 + i * .12)); c.fill(); } }
  if (sk('mist') > SK_MAX) { const r = SKV.mist(6).r; c.fillStyle = 'rgba(170,110,230,.16)'; aCirc(c, px, py, r); c.fill(); c.strokeStyle = 'rgba(200,150,255,.4)'; c.lineWidth = 2; c.stroke(); }
  // 爆炎札：飛過去、貼在敵人身上閃爍
  for (const o of C.tags) {
    const q = Math.min(1, o.t / .2), x = o.x + ((o.ex ?? o.x) - o.x) * q, y = o.y + ((o.ey ?? o.y) - o.y) * q;
    c.save(); c.translate(x, y); c.rotate(Math.sin(o.t * 20) * .2);
    aRR(c, -4, -6, 8, 12, 1); aFI(c, (o.t * 10 | 0) % 2 && o.t > .3 ? '#ffd27a' : '#f4ead0', 1); c.fillStyle = '#c0262d'; c.font = '900 5px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('爆', 0, 0); c.restore();
  }
  // 影分身：半透明的主角
  for (const cl of C.clones) { c.save(); c.globalAlpha = .42; drawHeroNinja(cl.x, cl.y + 20, { face: cl.tg ? (cl.tg.x > cl.x ? 1 : -1) : p.face, t: g.t + 1, vy: cl.tg ? 0 : p.vy, dash: !!cl.tg, dvx: 1, dvy: 0, skin: save.skin }); c.restore(); }
  // 水龍彈：往上衝的水柱，前端是龍頭
  for (const o of C.waters) {
    const tail = 160, gr = c.createLinearGradient(0, o.y, 0, o.y + tail); gr.addColorStop(0, 'rgba(120,220,255,.9)'); gr.addColorStop(1, 'rgba(120,220,255,0)');
    c.fillStyle = gr; c.beginPath();
    for (let k = 0; k <= 8; k++) { const yy = o.y + tail - k * tail / 8; c.lineTo(o.x - o.w / 2 + Math.sin(yy * .08 + g.t * 12) * 4, yy); }
    for (let k = 8; k >= 0; k--) { const yy = o.y + tail - k * tail / 8; c.lineTo(o.x + o.w / 2 + Math.sin(yy * .08 + g.t * 12) * 4, yy); }
    c.closePath(); c.fill();
    c.save(); c.translate(o.x, o.y); c.beginPath(); c.moveTo(0, -o.w * .9); c.quadraticCurveTo(o.w * .8, -o.w * .2, o.w * .5, o.w * .5); c.lineTo(-o.w * .5, o.w * .5); c.quadraticCurveTo(-o.w * .8, -o.w * .2, 0, -o.w * .9); aFI(c, '#bff0ff', 1.6);
    c.fillStyle = INK; aCirc(c, -o.w * .2, -o.w * .1, 1.6); c.fill(); aCirc(c, o.w * .2, -o.w * .1, 1.6); c.fill(); c.restore();
  }
  // 落石：灰色大岩石，旋轉落下
  for (const o of C.rocks) {
    c.save(); c.translate(o.x, o.y); c.rotate(o.rot); c.beginPath();
    for (let k = 0; k < 8; k++) { const a = k / 8 * TAU, r2 = o.r * (k % 2 ? .82 : 1); c.lineTo(Math.cos(a) * r2, Math.sin(a) * r2); }
    c.closePath(); aFI(c, '#8a8070', 2);
    c.fillStyle = 'rgba(255,255,255,.25)'; aEll(c, -o.r * .3, -o.r * .35, o.r * .35, o.r * .18); c.fill(); c.restore();
    c.strokeStyle = 'rgba(255,255,255,.4)'; c.lineWidth = 2; c.beginPath(); c.moveTo(o.x - o.r * .5, o.y - o.r - 6); c.lineTo(o.x - o.r * .5, o.y - o.r - 26); c.moveTo(o.x + o.r * .5, o.y - o.r - 6); c.lineTo(o.x + o.r * .5, o.y - o.r - 22); c.stroke();
  }
  // 鎖鐮：鎖鏈＋鐮刀，掃過的弧線留下白光
  for (const s of C.swings) {
    const k = 1 - Math.max(0, (s.t - .32) / .13);
    c.save(); c.globalAlpha = Math.max(0, k);
    c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.arc(px, py, s.r, Math.min(s.a0, s.a), Math.max(s.a0, s.a)); c.arc(px, py, s.r * .7, Math.max(s.a0, s.a), Math.min(s.a0, s.a), true); c.closePath(); c.fill();
    const hx = px + Math.cos(s.a) * s.r, hy = py + Math.sin(s.a) * s.r;
    c.strokeStyle = '#8a8f9c'; c.lineWidth = 1.6; c.setLineDash([3, 2]); c.beginPath(); c.moveTo(px, py); c.lineTo(hx, hy); c.stroke(); c.setLineDash([]);
    c.translate(hx, hy); c.rotate(s.a + (s.face > 0 ? 1.6 : -1.6)); c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(12, -8, 18, 3); c.quadraticCurveTo(10, -1, 2, 4); c.closePath(); aFI(c, '#e4e8f0', 1.3);
    c.restore();
  }
}
// 角色專屬技能的說明（升級三選一時顯示）
function charSkillDesc(id, v, f) {
  const D = {
    tags: () => ['每 ' + f(v.cd) + ' 秒把 ' + v.n + ' 張爆炎札貼到敵人身上，0.6 秒後爆炸', f(v.cd) + '秒ごとに爆炎札を' + v.n + '枚、0.6秒後に爆発', v.n + ' blast tag(s) every ' + f(v.cd) + 's, exploding 0.6s later'],
    clone: () => [v.n + ' 個分身跟在身後，每 ' + f(v.cd) + ' 秒衝去斬附近的敵人', '分身' + v.n + '体、' + f(v.cd) + '秒ごとに近くの敵へ斬りかかる', v.n + ' clone(s) slash nearby foes every ' + f(v.cd) + 's'],
    water: () => ['每 ' + f(v.cd) + ' 秒往正上方射出水龍，貫穿一整列敵人', f(v.cd) + '秒ごとに真上へ水龍、一列を貫く', 'A water dragon shoots straight up every ' + f(v.cd) + 's'],
    mist: () => ['落地時留下毒霧（停留 ' + f(v.life) + ' 秒），碰到的敵人會被毒倒', '着地すると毒霧（' + f(v.life) + '秒）、触れた敵を倒す', 'Landing leaves poison mist for ' + f(v.life) + 's'],
    rock: () => ['每 ' + f(v.cd) + ' 秒從上方砸下 ' + v.n + ' 顆岩石，也會砸碎飛鏢', f(v.cd) + '秒ごとに岩を' + v.n + 'つ落とし、飛び道具も砕く', v.n + ' boulder(s) every ' + f(v.cd) + 's, also crush projectiles'],
    sickle: () => ['每 ' + f(v.cd) + ' 秒甩出鎖鐮，掃過半徑 ' + v.r + ' 的大弧', f(v.cd) + '秒ごとに鎖鎌で半径' + v.r + 'を薙ぎ払う', 'Chain sickle sweeps a ' + v.r + 'px arc every ' + f(v.cd) + 's'],
  };
  return D[id] ? L(D[id]()) : '';
}

// ===== 背影（斬擊特寫、魔王 QTE 用）：從背後看，看不到臉，只看到髮型、兜帽、斗笠等特徵 =====
// pre：畫在身體後面；head：畫在身體前面（頭、從背後看得到的尾巴、披風等）。原點在腳底，HY＝頭的中心高度
const BK_HY = -30, BK_R = 21;
const bkBall = (c, col, r = BK_R) => heroSilhouette(c, [{ path: c => aCirc(c, 0, BK_HY, r), fill: col, after: c => { c.save(); aCirc(c, 0, BK_HY, r); c.clip(); const gr = c.createRadialGradient(-7, BK_HY - 10, 3, 0, BK_HY, r * 1.15); gr.addColorStop(0, 'rgba(255,255,255,.28)'); gr.addColorStop(.6, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(0,0,0,.18)'); c.fillStyle = gr; c.fillRect(-r, BK_HY - r, r * 2, r * 2); c.restore(); } }], 1.8);
// 綁在腦後的布結＋兩條飄動的布條
function bkKnot(c, col, y, t, len = 1) {
  for (const i of [0, 1]) {
    const w = Math.sin(t * 13 + i * 1.7) * 3, ex = (-16 - i * 7) * len, ey = y + 2 + i * 9 + w;
    c.beginPath(); c.moveTo(-1, y + 1); c.quadraticCurveTo(ex * .5, y - 2 + i * 4 + w, ex, ey); c.lineTo(ex + 2, ey + 4.5); c.quadraticCurveTo(ex * .45, y + 4 + i * 4 + w, 0, y + 5); c.closePath(); aFI(c, col, 1.4);
  }
  aCirc(c, 0, y + 3, 3.2); aFI(c, col, 1.4);
}
const bkBand = (c, col, y, h = 5) => { c.save(); aCirc(c, 0, BK_HY, BK_R); c.clip(); c.fillStyle = col; c.fillRect(-BK_R - 1, y, BK_R * 2 + 2, h); c.restore(); };
const bkScarf = (c, col, t) => { const fw = Math.sin(t * 14) * 3; c.beginPath(); c.moveTo(-3, -12); c.quadraticCurveTo(-14, 4 + fw, -10, 12 + fw); c.lineTo(-4, 10 + fw); c.quadraticCurveTo(-6, 0, 2, -10); c.closePath(); aFI(c, col, 1.6); };
const CHAR_BACK = {
  ao: { pre: (c, P, t) => bkScarf(c, P.band, t), head: (c, P, t) => {
    heroSilhouette(c, [{ path: c => { c.beginPath(); c.moveTo(-4, BK_HY - 19); c.quadraticCurveTo(-7, BK_HY - 34, 2, BK_HY - 38); c.quadraticCurveTo(0, BK_HY - 30, 4, BK_HY - 19); c.closePath(); }, fill: '#23315e' }], 1.8);
    bkBall(c, '#23315e');
    c.fillStyle = '#23315e'; c.strokeStyle = INK; c.lineWidth = 1.6; c.beginPath(); for (let i = 0; i <= 6; i++) { const x = -15 + i * 5; c.lineTo(x, BK_HY + 14 + (i % 2) * 5); } c.stroke();   // 後頸的刺刺髮尾
    bkBand(c, '#3a4058', BK_HY - 12); bkKnot(c, '#3a4058', BK_HY - 12, t);
  } },
  sakura: { head: (c, P, t) => {
    const sw = Math.sin(t * 6) * 2.5, hair = '#f08cb4';
    for (const sd of [-1, 1]) heroSilhouette(c, [{ path: c => { c.beginPath(); c.moveTo(sd * 12, BK_HY - 14); c.quadraticCurveTo(sd * 30, BK_HY - 8 + sw, sd * 24, BK_HY + 20 + sw); c.quadraticCurveTo(sd * 20, BK_HY + 30 + sw, sd * 15, BK_HY + 26 + sw); c.quadraticCurveTo(sd * 20, BK_HY + 8, sd * 8, BK_HY - 4); c.closePath(); }, fill: hair }], 1.8);
    bkBall(c, hair);
    c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(0, BK_HY - 20); c.lineTo(0, BK_HY + 12); c.stroke();   // 分線
    c.save(); c.translate(12, BK_HY - 14); for (let i = 0; i < 5; i++) { c.rotate(TAU / 5); aEll(c, 0, -3, 2.2, 3); aFI(c, '#ffe0ec', .9); } aCirc(c, 0, 0, 1.5); c.fillStyle = '#f2c14e'; c.fill(); c.restore();
  } },
  kage: { pre: (c, P, t) => bkScarf(c, '#f2c14e', t), head: (c, P, t) => {
    heroSilhouette(c, [{ path: c => { c.beginPath(); c.moveTo(-13, BK_HY - 15); c.quadraticCurveTo(-15, BK_HY - 22, -11, BK_HY - 27); c.quadraticCurveTo(-8, BK_HY - 21, -5, BK_HY - 18); c.closePath(); c.moveTo(13, BK_HY - 15); c.quadraticCurveTo(15, BK_HY - 22, 11, BK_HY - 27); c.quadraticCurveTo(8, BK_HY - 21, 5, BK_HY - 18); c.closePath(); }, fill: '#f6d24a' }], 1.8);
    bkBall(c, P.suit);
    c.beginPath(); c.moveTo(-3, BK_HY - 8); c.lineTo(2, BK_HY - 3); c.lineTo(-1, BK_HY - 2); c.lineTo(5, BK_HY + 4); c.lineTo(-4, BK_HY - 2); c.lineTo(-1, BK_HY - 3); c.closePath(); aFI(c, '#f6d24a', 1);
  } },
  homura: { head: (c, P, t) => {
    const sw = Math.sin(t * 7) * 3, hair = '#f0602e';
    bkBall(c, hair);
    c.fillStyle = hair; c.strokeStyle = INK; c.lineWidth = 1.6; c.beginPath(); for (let i = 0; i <= 8; i++) c.lineTo(-17 + i * 4.25, BK_HY + 13 + (i % 2) * 6); c.stroke();
    bkBand(c, P.suit, BK_HY - 12);
    heroSilhouette(c, [{ path: c => { c.beginPath(); c.moveTo(-5, BK_HY - 18); c.quadraticCurveTo(-10 + sw, BK_HY - 2, -6 + sw, BK_HY + 22); c.lineTo(-2 + sw, BK_HY + 14); c.lineTo(1 + sw, BK_HY + 26); c.lineTo(3 + sw * .6, BK_HY + 10); c.quadraticCurveTo(6, BK_HY - 4, 5, BK_HY - 18); c.closePath(); }, fill: hair }], 1.6);   // 高馬尾垂在背後
    aCirc(c, 0, BK_HY - 18, 3.4); aFI(c, P.suit, 1.2);
    bkKnot(c, P.suit, BK_HY - 12, t, .8);
  } },
  kon: { head: (c, P, t) => {
    const wag = Math.sin(t * 4) * .2;
    c.save(); c.translate(4, -8); c.rotate(.3 + wag);
    heroSilhouette(c, [{ path: c => { c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(24, 6, 30, -16); c.quadraticCurveTo(24, -34, 13, -26); c.quadraticCurveTo(8, -12, -4, -6); c.closePath(); }, fill: P.suit, after: c => { c.save(); c.clip(); c.fillStyle = chLt(P.suit, .55); aEll(c, 24, -26, 9, 8, -.4); c.fill(); c.restore(); } }], 1.8);
    c.restore();
    heroSilhouette(c, [{ path: c => { c.beginPath(); c.moveTo(-15, BK_HY - 11); c.quadraticCurveTo(-21, BK_HY - 26, -16, BK_HY - 33); c.quadraticCurveTo(-7, BK_HY - 27, -3, BK_HY - 20); c.closePath(); c.moveTo(15, BK_HY - 11); c.quadraticCurveTo(21, BK_HY - 26, 16, BK_HY - 33); c.quadraticCurveTo(7, BK_HY - 27, 3, BK_HY - 20); c.closePath(); }, fill: P.suit }], 1.8);
    bkBall(c, P.suit);
    bkKnot(c, '#e03a3a', BK_HY - 4, t, .7);   // 狐面的紅繩綁在腦後
  } },
  kasa: { head: (c, P, t) => {
    const sw = Math.sin(t * 5) * 2;
    heroSilhouette(c, [{ path: c => { c.beginPath(); c.moveTo(-14, -20); c.quadraticCurveTo(0, -26, 14, -20); c.lineTo(17 + sw * .5, 0); c.quadraticCurveTo(0, 4, -17 - sw * .5, 0); c.closePath(); }, fill: P.dark }], 1.8);   // 披風蓋住背
    bkBall(c, '#2a2c40', 18);
    heroSilhouette(c, [{ path: c => { c.beginPath(); c.moveTo(-29, BK_HY - 2); c.quadraticCurveTo(0, BK_HY + 3, 29, BK_HY - 2); c.quadraticCurveTo(13, BK_HY - 18, 0, BK_HY - 29); c.quadraticCurveTo(-13, BK_HY - 18, -29, BK_HY - 2); c.closePath(); }, fill: '#e2c27a',
      after: c => { c.save(); c.clip(); c.strokeStyle = 'rgba(150,100,40,.45)'; c.lineWidth = 1; for (let i = -5; i <= 5; i++) { c.beginPath(); c.moveTo(0, BK_HY - 29); c.lineTo(i * 6, BK_HY); c.stroke(); } c.restore(); } }], 1.8);
    c.strokeStyle = '#c0262d'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(-26, BK_HY - 2); c.quadraticCurveTo(0, BK_HY + 2, 26, BK_HY - 2); c.stroke();
    aCirc(c, 0, BK_HY - 29, 2.2); aFI(c, '#c0262d', 1);
  } },
  gan: { head: (c, P, t) => {
    heroSilhouette(c, [{ path: c => { c.beginPath(); c.arc(-BK_R + 1, BK_HY + 3, 4.2, 0, TAU); c.moveTo(BK_R - 1 + 4.2, BK_HY + 3); c.arc(BK_R - 1, BK_HY + 3, 4.2, 0, TAU); }, fill: '#f8cfa4' }], 1.8);
    bkBall(c, '#f8cfa4');
    c.fillStyle = 'rgba(255,255,255,.4)'; aEll(c, -6, BK_HY - 12, 8, 4, -.3); c.fill();
    bkBand(c, P.suit, BK_HY - 11); bkKnot(c, P.suit, BK_HY - 11, t);
    for (let i = 0; i < 7; i++) { const a = Math.PI * (.2 + i / 6 * .6); aCirc(c, Math.cos(a) * 15, -14 - Math.sin(a) * 2, 2.6); aFI(c, '#8a5428', 1); }   // 背後的念珠
  } },
  kasumi: { head: (c, P, t) => {
    const sw = Math.sin(t * 5) * 2, hair = '#2a2638';
    heroSilhouette(c, [{ path: c => { c.beginPath(); c.moveTo(-17, BK_HY - 4); c.quadraticCurveTo(-20, BK_HY + 20 + sw, -12, BK_HY + 30 + sw); c.lineTo(12, BK_HY + 30 - sw); c.quadraticCurveTo(20, BK_HY + 20 - sw, 17, BK_HY - 4); c.closePath(); }, fill: hair }], 1.8);   // 長髮垂到背上
    heroSilhouette(c, [{ path: c => aCirc(c, -12, BK_HY - 20, 7.5), fill: hair }, { path: c => aCirc(c, 12, BK_HY - 20, 7.5), fill: hair }], 1.8);
    bkBall(c, hair);
    c.strokeStyle = 'rgba(170,150,230,.5)'; c.lineWidth = 1.4; c.beginPath(); c.arc(0, BK_HY - 2, 15, Math.PI * 1.2, Math.PI * 1.5); c.stroke();
    for (const [x, y] of [[-12, BK_HY - 13], [12, BK_HY - 13]]) { c.beginPath(); c.moveTo(x, y); c.lineTo(x - 4, y - 2.5); c.lineTo(x - 4, y + 2.5); c.closePath(); c.moveTo(x, y); c.lineTo(x + 4, y - 2.5); c.lineTo(x + 4, y + 2.5); c.closePath(); aFI(c, P.suit, .9); }
    bkKnot(c, P.dark, BK_HY + 6, t, .8);   // 覆面在腦後的結
  } },
  shizuku: { head: (c, P, t) => {
    const wag = Math.sin(t * 5) * .3;
    c.save(); c.translate(3, -6); c.rotate(wag);
    heroSilhouette(c, [{ path: c => { c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(18, 2, 20, -14); c.quadraticCurveTo(21, -22, 15, -24); c.quadraticCurveTo(13, -16, 14, -12); c.quadraticCurveTo(12, -4, -2, -4); c.closePath(); }, fill: TABBY, after: c => { c.save(); c.clip(); c.fillStyle = TABBY_D; for (const [x, y] of [[6, -2], [13, -6], [18, -13], [17, -20]]) { aEll(c, x, y, 1.6, 3.4, -.6); c.fill(); } c.restore(); } }], 1.8);
    c.restore();
    heroSilhouette(c, [{ path: c => { c.beginPath(); c.moveTo(-17, BK_HY - 9); c.quadraticCurveTo(-21, BK_HY - 27, -14, BK_HY - 31); c.quadraticCurveTo(-7, BK_HY - 25, -4, BK_HY - 19); c.closePath(); c.moveTo(17, BK_HY - 9); c.quadraticCurveTo(21, BK_HY - 27, 14, BK_HY - 31); c.quadraticCurveTo(7, BK_HY - 25, 4, BK_HY - 19); c.closePath(); }, fill: TABBY }], 1.8);
    bkBall(c, TABBY);
    c.save(); aCirc(c, 0, BK_HY, BK_R); c.clip(); c.fillStyle = TABBY_D; for (let i = 0; i < 5; i++) { const y = BK_HY - 15 + i * 7; c.beginPath(); c.moveTo(-14 + i, y); c.quadraticCurveTo(0, y + 3, 14 - i, y); c.lineTo(12 - i, y + 2.4); c.quadraticCurveTo(0, y + 5, -12 + i, y + 2.4); c.closePath(); c.fill(); } c.restore();
  } },
};
