'use strict';
// ===== 新角色（商店「角色」分頁）：和主角同樣的「大福」比例，但頭部造型完全不同 =====
// 原點在腳底、面向右。pal = 換裝顏色 { suit, dark, band }；髮色、面具、斗笠等招牌特徵不隨換裝改變
const CH_SKIN = '#f9d8b4';
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
function chLt(hex, k) { return heroLighten(hex, k); }
// 頭的漸層球
function chBall(c, x, y, r, col) { const gr = c.createRadialGradient(x - r * .3, y - r * .55, 2, x, y, r * 1.15); gr.addColorStop(0, chLt(col, .35)); gr.addColorStop(.6, col); gr.addColorStop(1, chLt(col, -.0)); return gr; }
// 身體＋手腳（共用）。bw = 身寬倍率
function chBody(c, P, t, bw = 1, extra = []) {
  const bob = Math.sin(t * 6) * 1.2, BT = -12, BB = -3, wT = 8 * bw, wM = 11 * bw, wB = 6 * bw, bh = BB - BT, belt = BT + bh * .53;
  const parts = [
    ...extra,
    { path: c => aCirc(c, -14 * bw, -14 + bob, 4.3), fill: P.dark },   // 後手
    { path: c => aEll(c, -4, 0, 4.2, 2.9), fill: P.dark },              // 後腳
    { path: c => { c.beginPath(); c.moveTo(-wT, BT); c.quadraticCurveTo(0, BT - 4, wT, BT); c.quadraticCurveTo(wM, BT + bh * .63, wB, BB - 1); c.quadraticCurveTo(0, BB + 2, -wB, BB - 1); c.quadraticCurveTo(-wM, BT + bh * .63, -wT, BT); c.closePath(); }, fill: P.suit,
      after: c => { c.save(); c.clip(); c.fillStyle = '#1e1e26'; c.fillRect(-wM - 2, belt, wM * 2 + 4, 3.2); c.fillStyle = P.band; c.fillRect(-2, belt - .5, 4, 4.2); c.restore(); } },
    { path: c => aEll(c, 5, 0, 4.2, 2.9), fill: P.dark },               // 前腳
  ];
  return parts;
}
const chHand = (c, x, y, col) => { aCirc(c, x, y, 4.6); aFI(c, col, 1.8); };
const chBlush = (c, x, y) => { c.fillStyle = 'rgba(255,120,120,.45)'; aEll(c, x, y, 2.6, 1.4); c.fill(); };

// ---- 1. 焰（ほむら）：露臉的女忍，橘紅刺刺頭髮綁高馬尾，額頭綁頭巾 ----
function drawHomura(c, P, t, o = {}) {
  const HY = -30, R = 20, sw = Math.sin(t * 7) * 3;
  const hair = '#e8502a', hairD = '#a82a14';
  heroSilhouette(c, [
    { path: c => { c.beginPath(); c.moveTo(-6, HY - 18); c.quadraticCurveTo(-30, HY - 30 + sw, -38, HY - 8 + sw); c.lineTo(-30, HY - 12 + sw); c.lineTo(-34, HY + 4 + sw); c.lineTo(-24, HY - 4 + sw * .6); c.quadraticCurveTo(-16, HY - 4, -10, HY - 10); c.closePath(); }, fill: hair },   // 高馬尾
    ...chBody(c, P, t),
    { path: c => aCirc(c, 0, HY, R), fill: CH_SKIN },
    { path: c => { c.beginPath(); c.moveTo(-R - 1, HY + 4); c.quadraticCurveTo(-R - 2, HY - R - 4, 2, HY - R - 3); c.quadraticCurveTo(R + 2, HY - R, R + 1, HY - 2); c.lineTo(R - 4, HY - 8); c.lineTo(R - 7, HY - 3); c.lineTo(R - 10, HY - 10); c.lineTo(11, HY - 5); c.lineTo(7, HY - 11); c.lineTo(2, HY - 6); c.lineTo(-3, HY - 12); c.lineTo(-8, HY - 5); c.lineTo(-13, HY - 8); c.lineTo(-16, HY + 6); c.closePath(); }, fill: hair,   // 刺刺瀏海
      after: c => { c.fillStyle = 'rgba(255,200,150,.35)'; aEll(c, -6, HY - 17, 7, 2.6, -.2); c.fill(); } },
  ], 1.8);
  // 頭巾（換裝色）＋護額
  c.save(); c.beginPath(); c.arc(0, HY, R, 0, TAU); c.clip(); c.fillStyle = P.suit; c.beginPath(); c.moveTo(-R - 2, HY - 14); c.lineTo(R + 2, HY - 10); c.lineTo(R + 2, HY - 5); c.lineTo(-R - 2, HY - 9); c.closePath(); c.fill(); c.restore();
  aRR(c, 2, HY - 15, 11, 6, 2); aFI(c, '#dfe4ec', 1); c.fillStyle = P.suit; c.font = '900 4.6px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('焰', 7.5, HY - 11.8);
  c.beginPath(); c.moveTo(-R + 1, HY - 10); c.quadraticCurveTo(-30, HY - 14 + sw, -32, HY - 2 + sw); c.lineTo(-27, HY - 4 + sw); c.quadraticCurveTo(-24, HY - 8, -R + 2, HY - 6); c.closePath(); aFI(c, P.suit, 1.4);   // 頭巾尾
  heroEye(c, 1, HY + 3, 3.8, 5.2, o.eye || 'open'); heroEye(c, 12, HY + 3, 4, 5.4, o.eye || 'open');
  c.save(); c.fillStyle = '#e8502a'; c.beginPath(); c.moveTo(-3, HY - 3.5); c.lineTo(5, HY - 2.5); c.lineTo(5, HY - 1.5); c.lineTo(-3, HY - 2); c.fill(); c.beginPath(); c.moveTo(9, HY - 2.5); c.lineTo(16, HY - 3.5); c.lineTo(16, HY - 2); c.lineTo(9, HY - 1.5); c.fill(); c.restore();   // 眉
  chBlush(c, -4, HY + 9); chBlush(c, 17, HY + 9);
  c.strokeStyle = INK; c.lineWidth = 1.3; c.beginPath(); c.moveTo(4, HY + 11); c.quadraticCurveTo(8, HY + 14, 11, HY + 10.5); c.stroke();   // 笑
  c.fillStyle = '#fff'; c.beginPath(); c.moveTo(9.5, HY + 11); c.lineTo(10.5, HY + 13); c.lineTo(11.2, HY + 10.8); c.fill();   // 虎牙
  chHand(c, 15, -16 + Math.sin(t * 6) * -1.2, P.dark);
  // 手上的爆炎札
  c.save(); c.translate(19, -24); c.rotate(.25); aRR(c, -3, -7, 6, 12, 1); aFI(c, '#f4ead0', 1); c.fillStyle = '#c0262d'; c.font = '900 4px sans-serif'; c.textAlign = 'center'; c.fillText('爆', 0, 0); c.restore();
}

// ---- 2. 狐（こん）：白色狐耳兜帽＋臉上戴狐狸面具，背後一條蓬鬆大尾巴 ----
function drawKon(c, P, t, o = {}) {
  const HY = -30, R = 20, wag = Math.sin(t * 4) * .18;
  c.save(); c.translate(-8, -8); c.rotate(-.5 + wag);
  heroSilhouette(c, [{ path: c => { c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-26, 4, -30, -18); c.quadraticCurveTo(-22, -34, -12, -26); c.quadraticCurveTo(-8, -12, 4, -6); c.closePath(); }, fill: '#f0a040',
    after: c => { c.save(); c.clip(); c.fillStyle = '#fff6ea'; aEll(c, -24, -26, 9, 8, .4); c.fill(); c.restore(); } }], 1.8);
  c.restore();
  heroSilhouette(c, [
    ...chBody(c, P, t),
    { path: c => { c.beginPath(); c.arc(0, HY, R, 0, TAU);
        c.moveTo(-15, HY - 10); c.lineTo(-18, HY - 32); c.lineTo(-3, HY - 19); c.closePath();
        c.moveTo(4, HY - 19); c.lineTo(15, HY - 33); c.lineTo(16, HY - 11); c.closePath(); }, fill: P.suit,
      after: c => { c.fillStyle = '#ffb0c0'; c.beginPath(); c.moveTo(-14, HY - 14); c.lineTo(-16, HY - 27); c.lineTo(-7, HY - 19); c.fill(); c.beginPath(); c.moveTo(7, HY - 19); c.lineTo(14, HY - 28); c.lineTo(14, HY - 15); c.fill();
        c.save(); c.beginPath(); c.arc(0, HY, R, 0, TAU); c.clip(); c.fillStyle = chBall(c, 0, HY, R, P.suit); c.globalAlpha = .5; c.fillRect(-R, HY - R, R * 2, R * 2); c.restore(); } },
  ], 1.8);
  // 狐面：白色尖臉、紅色隈取、細長眼縫
  c.beginPath(); c.moveTo(-10, HY - 6); c.quadraticCurveTo(4, HY - 12, 17, HY - 5); c.quadraticCurveTo(22, HY + 4, 21, HY + 7); c.quadraticCurveTo(12, HY + 15, 4, HY + 13); c.quadraticCurveTo(-10, HY + 8, -10, HY - 6); c.closePath(); aFI(c, '#fffaf2', 1.5);
  c.fillStyle = '#d42a2a'; c.beginPath(); c.moveTo(-6, HY - 5); c.quadraticCurveTo(-1, HY - 9, 2, HY - 4); c.quadraticCurveTo(-2, HY - 6, -6, HY - 5); c.fill();
  c.beginPath(); c.moveTo(9, HY - 4); c.quadraticCurveTo(13, HY - 9, 17, HY - 4); c.quadraticCurveTo(13, HY - 6, 9, HY - 4); c.fill();
  c.strokeStyle = INK; c.lineWidth = 1.8; c.beginPath(); c.moveTo(-4, HY + 1); c.quadraticCurveTo(-1, HY - 1.5, 3, HY + 1); c.moveTo(10, HY + 1); c.quadraticCurveTo(13, HY - 1.5, 17, HY + 1); c.stroke();
  c.fillStyle = '#d42a2a'; for (const x of [-2, 14]) { c.beginPath(); c.moveTo(x - 3, HY + 6); c.lineTo(x + 2, HY + 5); c.lineTo(x - 2, HY + 8); c.fill(); }
  aEll(c, 20, HY + 6, 2, 1.6); c.fillStyle = INK; c.fill();   // 鼻頭
  c.strokeStyle = '#d42a2a'; c.lineWidth = 1; c.beginPath(); c.moveTo(12, HY + 10.5); c.quadraticCurveTo(16, HY + 12, 19, HY + 9); c.stroke();
  c.fillStyle = '#d42a2a'; c.beginPath(); c.arc(4, HY - 7, 1.4, 0, TAU); c.fill();
  chHand(c, 15, -16 + Math.sin(t * 6) * -1.2, P.dark);
  // 狐火
  for (const [x, y, s] of [[24, -36, 1], [-26, -44, .8]]) { const f = Math.sin(t * 8 + x) * 1.5; c.fillStyle = 'rgba(120,200,255,.85)'; c.beginPath(); c.moveTo(x, y - 7 * s + f); c.quadraticCurveTo(x + 5 * s, y, x, y + 4 * s); c.quadraticCurveTo(x - 5 * s, y, x, y - 7 * s + f); c.fill(); c.fillStyle = '#fff'; aCirc(c, x, y + 1, 1.4 * s); c.fill(); }
}

// ---- 3. 笠（かさ）：大斗笠遮住臉，只看到陰影裡發光的眼睛；高領斗篷、腰掛鎖鐮 ----
function drawKasa(c, P, t, o = {}) {
  const HY = -28, R = 18, sw = Math.sin(t * 5) * 2;
  heroSilhouette(c, [
    { path: c => { c.beginPath(); c.moveTo(-12, -22); c.quadraticCurveTo(-26, -8 + sw, -22, 2 + sw); c.lineTo(-6, -4); c.closePath(); }, fill: P.dark },   // 斗篷擺
    ...chBody(c, P, t, 1.1),
    { path: c => { c.beginPath(); c.moveTo(-13, -16); c.quadraticCurveTo(0, -24, 14, -16); c.lineTo(15, -9); c.quadraticCurveTo(0, -12, -13, -9); c.closePath(); }, fill: P.dark },   // 高領
    { path: c => aCirc(c, 1, HY, R), fill: '#1e2030' },   // 陰影中的臉
    { path: c => { c.beginPath(); c.moveTo(-32, HY - 4); c.quadraticCurveTo(0, HY - 2, 34, HY - 4); c.quadraticCurveTo(14, HY - 22, 1, HY - 34); c.quadraticCurveTo(-12, HY - 22, -32, HY - 4); c.closePath(); }, fill: '#d8b46a',   // 斗笠
      after: c => { c.save(); c.clip(); c.strokeStyle = 'rgba(122,82,30,.55)'; c.lineWidth = 1; for (let i = -6; i <= 6; i++) { c.beginPath(); c.moveTo(1, HY - 34); c.lineTo(1 + i * 6, HY - 2); c.stroke(); } c.fillStyle = 'rgba(255,255,255,.25)'; c.beginPath(); c.moveTo(1, HY - 33); c.quadraticCurveTo(-10, HY - 20, -26, HY - 6); c.lineTo(-18, HY - 7); c.quadraticCurveTo(-6, HY - 20, 1, HY - 33); c.fill(); c.restore(); } },
  ], 1.8);
  c.strokeStyle = '#8a1a1a'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(-28, HY - 4); c.quadraticCurveTo(1, HY + 1, 30, HY - 4); c.stroke();   // 笠緣的紅繩
  // 發光的眼睛
  const blink = ((t * .8) % 4) < .1;
  c.save(); c.shadowColor = '#ffe066'; c.shadowBlur = 6; c.fillStyle = '#ffe066';
  if (!blink) { aEll(c, 4, HY + 4, 2.6, 1.6, -.15); c.fill(); aEll(c, 13, HY + 4, 2.6, 1.6, .15); c.fill(); }
  else { c.fillRect(2, HY + 4, 5, 1); c.fillRect(11, HY + 4, 5, 1); }
  c.restore();
  // 鎖鐮：鎖鏈從手垂到地上
  const hx = 15, hy = -15 + Math.sin(t * 6) * -1.2;
  c.strokeStyle = '#8a8f9c'; c.lineWidth = 1.4; c.setLineDash([2, 1.5]); c.beginPath(); c.moveTo(hx, hy); c.quadraticCurveTo(28, -2, 24, -30); c.stroke(); c.setLineDash([]);
  c.save(); c.translate(24, -30); c.rotate(-.4); c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(10, -6, 14, 2); c.quadraticCurveTo(8, -1, 2, 3); c.closePath(); aFI(c, '#e4e8f0', 1.2); c.fillStyle = '#3a2a1a'; c.fillRect(-2, -1, 4, 10); c.restore();
  chHand(c, hx, hy, P.dark);
}

// ---- 4. 岩（がん）：壯碩的光頭僧兵，粗眉毛、大念珠，身體比別人寬 ----
function drawGan(c, P, t, o = {}) {
  const HY = -30, R = 19;
  heroSilhouette(c, [
    ...chBody(c, P, t, 1.45),
    { path: c => aCirc(c, 0, HY, R), fill: '#f4c79a',
      after: c => { c.save(); c.beginPath(); c.arc(0, HY, R, 0, TAU); c.clip(); c.fillStyle = 'rgba(255,255,255,.35)'; aEll(c, -6, HY - 12, 7, 4, -.3); c.fill(); c.fillStyle = 'rgba(160,90,50,.18)'; aEll(c, 4, HY + 14, 20, 8); c.fill(); c.restore(); } },
    { path: c => { c.beginPath(); c.arc(-R + 1, HY + 2, 4, 0, TAU); }, fill: '#f4c79a' },   // 耳
  ], 1.8);
  // 頭巾（換裝色）綁在額頭
  c.save(); c.beginPath(); c.arc(0, HY, R, 0, TAU); c.clip(); c.fillStyle = P.suit; c.fillRect(-R, HY - 12, R * 2, 5); c.restore();
  c.beginPath(); c.moveTo(-R + 1, HY - 10); c.lineTo(-R - 9, HY - 14); c.lineTo(-R - 7, HY - 6); c.closePath(); aFI(c, P.suit, 1.3);
  // 粗眉、瞇眼（專注）、鬍渣、嘴
  c.fillStyle = INK; c.beginPath(); c.moveTo(-3, HY - 3); c.lineTo(6, HY - 1); c.lineTo(6, HY + 1); c.lineTo(-3, HY - .5); c.fill(); c.beginPath(); c.moveTo(9, HY - 1); c.lineTo(18, HY - 4); c.lineTo(18, HY - 1.5); c.lineTo(9, HY + 1); c.fill();
  heroEye(c, 2, HY + 4, 3.4, 4.4, o.eye || 'focus'); heroEye(c, 13, HY + 4, 3.6, 4.6, o.eye || 'focus');
  c.strokeStyle = INK; c.lineWidth = 1.5; c.beginPath(); c.moveTo(4, HY + 12); c.lineTo(12, HY + 12); c.stroke();
  c.fillStyle = 'rgba(60,40,30,.25)'; for (let i = 0; i < 8; i++) { aCirc(c, 2 + i * 1.6, HY + 14 + (i % 2), .5); c.fill(); }
  // 大念珠
  for (let i = 0; i < 9; i++) { const a = Math.PI * (.15 + i / 8 * .7), x = Math.cos(a) * 15, y = -14 + Math.sin(a) * 6 - 2; aCirc(c, x, y, i === 4 ? 3.8 : 2.8); aFI(c, i === 4 ? '#c0262d' : '#6a3e1a', 1); }
  chHand(c, 20, -15 + Math.sin(t * 6) * -1.2, P.dark);
  // 手上的小岩石
  c.save(); c.translate(24, -28); c.beginPath(); c.moveTo(-6, 2); c.lineTo(-4, -5); c.lineTo(3, -7); c.lineTo(7, -1); c.lineTo(4, 5); c.lineTo(-3, 6); c.closePath(); aFI(c, '#8a8070', 1.4); c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(-3, -4, 4, 2); c.restore();
}

// ---- 5. 霞（かすみ）：紫色系女忍，黑長髮雙丸子頭＋髮簪，口罩面紗、睏睏的眼睛 ----
function drawKasumi(c, P, t, o = {}) {
  const HY = -30, R = 19, sw = Math.sin(t * 5) * 2;
  const hair = '#22202e';
  heroSilhouette(c, [
    { path: c => { c.beginPath(); c.moveTo(-R + 2, HY - 6); c.quadraticCurveTo(-R - 8, HY + 18 + sw, -14, HY + 30 + sw); c.lineTo(-4, HY + 20); c.lineTo(-6, HY); c.closePath(); }, fill: hair },   // 後面的長髮
    ...chBody(c, P, t),
    { path: c => aCirc(c, -12, HY - 19, 7.5), fill: hair }, { path: c => aCirc(c, 10, HY - 21, 7.5), fill: hair },   // 雙丸子
    { path: c => aCirc(c, 0, HY, R), fill: CH_SKIN },
    { path: c => { c.beginPath(); c.moveTo(-R - 1, HY + 8); c.quadraticCurveTo(-R - 3, HY - R - 3, 2, HY - R - 2); c.quadraticCurveTo(R + 3, HY - R + 1, R, HY - 1); c.quadraticCurveTo(14, HY - 6, 10, HY - 4); c.quadraticCurveTo(6, HY - 10, 0, HY - 6); c.quadraticCurveTo(-6, HY - 9, -11, HY - 3); c.quadraticCurveTo(-14, HY, -15, HY + 10); c.closePath(); }, fill: hair,
      after: c => { c.strokeStyle = 'rgba(160,140,220,.5)'; c.lineWidth = 1.4; c.beginPath(); c.arc(-2, HY - 4, 15, Math.PI * 1.15, Math.PI * 1.55); c.stroke(); } },
  ], 1.8);
  // 髮簪
  for (const [x, y, a] of [[-12, -49, -.7], [10, -51, .6]]) { c.save(); c.translate(x, y); c.rotate(a); c.fillStyle = '#e8b84a'; c.fillRect(-1, -10, 2, 14); aCirc(c, 0, -11, 2.4); aFI(c, '#e85a9a', 1); c.restore(); }
  // 睏睏的半睜眼
  for (const [x, rx] of [[2, 3.6], [13, 3.8]]) {
    c.save(); aEll(c, x, HY + 3, rx, 4.8); c.clip(); heroEye(c, x, HY + 3, rx, 4.8, 'open'); c.fillStyle = CH_SKIN; c.fillRect(x - rx - 1, HY - 3, rx * 2 + 2, 4.2); c.restore();
    c.strokeStyle = INK; c.lineWidth = 1.6; c.beginPath(); c.moveTo(x - rx - .5, HY + 1.3); c.lineTo(x + rx + .5, HY + 1); c.stroke();
    c.lineWidth = 1; c.beginPath(); c.moveTo(x + rx, HY + 1); c.lineTo(x + rx + 2, HY - .5); c.stroke();
  }
  // 面紗（換裝色，半透明）
  c.beginPath(); c.moveTo(-10, HY + 8); c.quadraticCurveTo(5, HY + 5, R + 1, HY + 7); c.quadraticCurveTo(R - 2, HY + 18, 6, HY + 19); c.quadraticCurveTo(-8, HY + 17, -10, HY + 8); c.closePath();
  c.fillStyle = P.suit; c.globalAlpha = .92; c.fill(); c.globalAlpha = 1; aInk(c, 1.4);
  c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 1; for (const x of [0, 6, 12]) { c.beginPath(); c.moveTo(x, HY + 9); c.lineTo(x - 1, HY + 17); c.stroke(); }
  // 毒霧小瓶
  c.save(); c.translate(22, -14); aRR(c, -3.5, -3, 7, 8, 2.5); aFI(c, '#b48ae0', 1.2); c.fillStyle = '#5a3a20'; c.fillRect(-1.6, -6, 3.2, 3); c.restore();
  for (let i = 0; i < 3; i++) { const p = (t * .8 + i / 3) % 1; c.fillStyle = `rgba(180,120,230,${.6 * (1 - p)})`; aCirc(c, 27 + i * 2, -20 - p * 14, 2.5 + p * 4); c.fill(); }
  chHand(c, 18, -10 + Math.sin(t * 6) * -1.2, P.dark);
}

// ---- 6. 雫（しずく）：貓耳兜帽、ω 嘴與鬍鬚、頸上金鈴鐺，背後細細的貓尾巴 ----
function drawShizuku(c, P, t, o = {}) {
  const HY = -30, R = 20, wag = Math.sin(t * 5) * .3;
  c.save(); c.translate(-8, -6); c.rotate(wag);
  heroSilhouette(c, [{ path: c => { c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-18, 2, -20, -14); c.quadraticCurveTo(-21, -22, -15, -24); c.quadraticCurveTo(-13, -16, -14, -12); c.quadraticCurveTo(-12, -4, 2, -4); c.closePath(); }, fill: P.suit }], 1.8);
  c.restore();
  heroSilhouette(c, [
    ...chBody(c, P, t),
    { path: c => { c.beginPath(); c.arc(0, HY, R, 0, TAU);
        c.moveTo(-17, HY - 8); c.quadraticCurveTo(-21, HY - 26, -14, HY - 30); c.quadraticCurveTo(-7, HY - 24, -4, HY - 18); c.closePath();
        c.moveTo(6, HY - 18); c.quadraticCurveTo(12, HY - 28, 19, HY - 27); c.quadraticCurveTo(21, HY - 18, 18, HY - 8); c.closePath(); }, fill: P.suit,
      after: c => { c.fillStyle = '#ffb0c0'; c.beginPath(); c.moveTo(-15, HY - 13); c.quadraticCurveTo(-17, HY - 24, -13, HY - 26); c.quadraticCurveTo(-9, HY - 22, -7, HY - 17); c.fill(); c.beginPath(); c.moveTo(9, HY - 17); c.quadraticCurveTo(13, HY - 24, 17, HY - 23); c.quadraticCurveTo(18, HY - 17, 16, HY - 12); c.fill();
        c.save(); c.beginPath(); c.arc(0, HY, R, 0, TAU); c.clip(); c.fillStyle = chBall(c, 0, HY, R, P.suit); c.globalAlpha = .5; c.fillRect(-R, HY - R, R * 2, R * 2); c.restore(); } },
  ], 1.8);
  aEll(c, 4, HY + 4, 14, 10); c.fillStyle = CH_SKIN; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.4; c.stroke();
  heroEye(c, -1, HY + 2.5, 4.4, 6, o.eye || 'open'); heroEye(c, 11, HY + 2.5, 4.6, 6.2, o.eye || 'open');
  // 藍綠色瞳孔的貓眼感：在眼睛上加一條細瞳
  c.strokeStyle = INK; c.lineWidth = 1.2; c.beginPath(); c.moveTo(4, HY + 10); c.quadraticCurveTo(5.5, HY + 12, 7, HY + 10); c.quadraticCurveTo(8.5, HY + 12, 10, HY + 10); c.stroke();   // ω
  c.lineWidth = .9; for (const [x, d] of [[-8, -1], [17, 1]]) for (const dy of [-1.5, 1.5]) { c.beginPath(); c.moveTo(x, HY + 9 + dy); c.lineTo(x + d * 6, HY + 8 + dy * 2); c.stroke(); }
  chBlush(c, -5, HY + 8); chBlush(c, 16, HY + 8);
  // 鈴鐺
  aCirc(c, 3, -12, 3.6); aFI(c, '#f2c14e', 1.2); c.fillStyle = INK; c.fillRect(1, -11.5, 4, .9); aCirc(c, 3, -9.6, .8); c.fill();
  chHand(c, 15, -16 + Math.sin(t * 6) * -1.2, P.dark);
  // 水珠
  for (let i = 0; i < 2; i++) { const p = (t * .7 + i * .5) % 1, x = 22 + i * 5, y = -30 - p * 10; c.globalAlpha = 1 - p; c.beginPath(); c.moveTo(x, y - 4); c.quadraticCurveTo(x + 3, y + 1, x, y + 2); c.quadraticCurveTo(x - 3, y + 1, x, y - 4); aFI(c, '#7ad8f0', .9); c.globalAlpha = 1; }
}

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
  { id: 'gan', draw: drawGan, out: 3, n: ['岩', 'がん', 'Gan'], sk: ['落石', '落石', 'Rockfall'],
    d: ['每 3 秒從畫面上方砸下大岩石，壓扁路線上的敵人，也會砸碎敵人的飛鏢', '3秒ごとに画面上から大岩を落とし、敵と飛び道具を砕く', 'Drops a boulder from above every 3s, crushing foes and projectiles'],
    evo: ['山崩：一次落下 3 顆，落地後滾動', '山崩れ：3つ同時に落ちて転がる', 'Landslide: 3 boulders that roll on landing'] },
  { id: 'kasumi', draw: drawKasumi, out: 6, n: ['霞', 'かすみ', 'Kasumi'], sk: ['毒霧', '毒霧', 'Poison Mist'],
    d: ['跳躍落地時留下一團毒霧，停留 3 秒，碰到的敵人會被毒倒', '着地すると毒霧を残し、3秒間触れた敵を倒す', 'Leaves a poison cloud where you land; it lingers 3s'],
    evo: ['朧：毒霧跟著身體移動，範圍加倍', '朧：毒霧が体にまとわり範囲倍増', 'Oboro: the mist follows you at double size'] },
  { id: 'shizuku', draw: drawShizuku, out: 9, n: ['雫', 'しずく', 'Shizuku'], sk: ['水龍彈', '水龍弾', 'Water Dragon'],
    d: ['每 2.8 秒往正上方射出水龍，貫穿一整列的敵人', '2.8秒ごとに真上へ水龍を放ち、一列の敵を貫く', 'Fires a water dragon straight up every 2.8s, piercing a whole column'],
    evo: ['大瀑布：左右兩條水龍＋中間一條', '大瀑布：左右と中央に3本の水龍', 'Great Falls: 3 dragons side by side'] },
];
