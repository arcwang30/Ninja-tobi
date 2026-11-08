'use strict';
/* NINJA 鳶 TOBI — 風／火／山三關的敵人造型（林關沿用 art.js 的原版敵人）
   每一關各 12 種一般敵人＋1 隻中魔王，編號和 ENEMY 表一一對應，判定大小、數值都和林系列相同。
   畫法和林系列一樣：深色描邊、大頭小身體、浮在身邊的手套和鞋子（沒有手臂和腿）、大眼睛。
   原點在身體中心、面向右（+x），人形敵人約 ±22 單位（依 ENEMY[type].h/44 縮放）。 */

// ===== 共用小工具 =====
const F2W = o => x => o.fl ? '#fff' : x;   // 被斬中時整隻閃白
// 忍者兜帽的尖角與頭巾結（加在頭的路徑上，和頭一起描邊）
function f2Hood(c, HY, fw) {
  c.moveTo(-11, HY - 10); c.quadraticCurveTo(-21, HY - 20, -7, HY - 17); c.closePath();
  c.moveTo(-13, HY - 7); c.quadraticCurveTo(-21, HY - 6 + fw, -25, HY - 1 + fw); c.quadraticCurveTo(-19, HY - 3, -13, HY - 2); c.closePath();
}
// 頭的明暗（中心偏左上較亮）
function f2Shade(c, col, dk, HY, R, cx = 0) {
  const gr = c.createRadialGradient(cx - 5, HY - 9, 2, cx, HY, R * 1.15);
  gr.addColorStop(0, heroLighten(col, .28)); gr.addColorStop(.6, col); gr.addColorStop(1, dk);
  c.fillStyle = gr; c.fillRect(cx - R - 1, HY - R - 1, R * 2 + 2, R * 2 + 2);
}
// 大福比例的人形：身體、頭、手套、鞋子一起描邊。S 是這隻敵人的設定（顏色、額外部件、臉）
function f2Chibi(c, o, S) {
  const t = o.t, sd = o.seed, hb = Math.sin(t * 5 + sd + 1.5) * 1.3, C = F2W(o), fw = Math.sin(t * 9 + sd) * 2.5;
  const HY = S.HY ?? -5, R = S.R ?? 15, fat = S.fat;
  const BT = fat ? 7 : 8.5, BB = fat ? 18 : 16.5, wTop = fat ? 10 : 6.5, wMid = fat ? 14.5 : 8.5, wBot = fat ? 9.5 : 5;
  const GR = 3.9, FR = [4.4, 3], alarm = o.near && !o.warn && !S.calm;
  const fa = S.fa || (alarm ? [fat ? 18 : 15, 1] : [fat ? 16 : 11.5, 12 + hb]), ba = S.ba || (alarm ? [fat ? -18 : -15, 0] : [fat ? -16 : -11.5, 12 - hb]);
  const ff = S.ff || [fat ? 5.5 : 4, fat ? 21.5 : 20.5], bf = S.bf || [-ff[0], ff[1]];
  const K = { C, HY, R, fa, ba, ff, bf, fw, t, o, hb };
  if (S.back) S.back(c, K);
  const parts = [];
  if (!S.noBa) parts.push({ path: c => aCirc(c, ba[0], ba[1], GR * .95), fill: C(S.glove || S.dk) });
  if (!S.noFeet) parts.push({ path: c => aEll(c, bf[0], bf[1], FR[0], FR[1]), fill: C(S.shoe || S.dk) });
  const bodyP = c => { c.beginPath(); c.moveTo(-wTop, BT); c.quadraticCurveTo(0, BT - 4, wTop, BT); c.quadraticCurveTo(wMid, BT + (BB - BT) * .63, wBot, BB - 1); c.quadraticCurveTo(0, BB + 2, -wBot, BB - 1); c.quadraticCurveTo(-wMid, BT + (BB - BT) * .63, -wTop, BT); c.closePath(); };
  parts.push({ path: bodyP, fill: C(S.body || S.suit), after: c => { c.save(); c.clip(); if (!o.fl) { c.fillStyle = S.belt || S.dk; c.fillRect(-wMid - 2, BT + (BB - BT) * .5, wMid * 2 + 4, 2.8); if (S.bodyAfter) S.bodyAfter(c, K, BT, BB, wMid); } c.restore(); } });
  if (!S.noFeet) parts.push({ path: c => aEll(c, ff[0], ff[1], FR[0], FR[1]), fill: C(S.shoe || S.dk) });
  for (const p of S.headBack || []) parts.push({ path: c => p.path(c, K), fill: C(p.fill), after: p.after && !o.fl ? c => p.after(c, K) : null });
  parts.push({ path: c => { c.beginPath(); c.arc(0, HY, R, 0, TAU); if (S.hood) f2Hood(c, HY, fw); if (S.headPath) S.headPath(c, K); }, fill: C(S.head || S.suit),
    after: c => { c.save(); c.beginPath(); c.arc(0, HY, R, 0, TAU); c.clip(); if (!o.fl) { f2Shade(c, S.head || S.suit, S.headDk || S.dk, HY, R); if (S.band) { c.fillStyle = S.band; c.fillRect(-R - 1, HY - 12, R * 2 + 2, 4.4); } if (S.headAfter) S.headAfter(c, K); } c.restore(); } });
  if (!S.noFa) parts.push({ path: c => aCirc(c, fa[0], fa[1], GR), fill: C(S.glove || S.dk) });
  heroSilhouette(c, parts, 1.6);
  if (S.hood && S.band) { c.beginPath(); c.moveTo(-13, HY - 7); c.quadraticCurveTo(-21, HY - 6 + fw, -25, HY - 1 + fw); c.quadraticCurveTo(-19, HY - 3, -13, HY - 2); c.closePath(); c.fillStyle = C(S.band); c.fill(); }
  if (S.mid) S.mid(c, K);
  if (S.face !== false) f2Face(c, o, S, HY, alarm);
  if (S.front) S.front(c, K);
}
// 臉：面罩開口（膚色）＋兩顆大眼睛＋生氣的眉毛
function f2Face(c, o, S, HY, alarm) {
  const ey = HY + 3.5 + (S.eyeDy || 0), ex = S.eyeDx || 0;
  if (S.mask !== false) { aEll(c, 4 + ex, HY + 3.5 + (S.maskDy || 0), S.maskW || 11, S.maskH || 6.8); c.fillStyle = o.fl ? '#fff' : (S.skin || '#f6d3ad'); c.fill(); c.strokeStyle = INK; c.lineWidth = 1.3; c.stroke(); }
  if (S.faceBack && !o.fl) S.faceBack(ey);
  const glow = S.glow && !o.fl ? S.glow : null;
  if (o.hurt) {
    c.strokeStyle = INK; c.lineWidth = 1.8; c.lineCap = 'round';
    for (const [x, sd] of [[-.5 + ex, 1], [8.5 + ex, -1]]) { c.beginPath(); c.moveTo(x - sd * 2.6, ey - 3); c.lineTo(x + sd * 2.2, ey); c.lineTo(x - sd * 2.6, ey + 3); c.stroke(); }
  } else { foeEye(c, -.5 + ex, ey, 3, 3.9, null, o.warn, o.blink, glow); foeEye(c, 8.5 + ex, ey, 3.2, 4.1, null, o.warn, o.blink, glow); }
  if (glow) { c.fillStyle = glow + '73'; aCirc(c, -.5 + ex, ey, 5); c.fill(); aCirc(c, 8.5 + ex, ey, 5); c.fill(); }
  if (S.brows !== false) {
    const ang = o.warn || alarm ? 1.4 : .6;
    c.strokeStyle = S.browCol && !o.fl ? S.browCol : INK; c.lineWidth = S.browW || 1.7; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-3.6 + ex, ey - 5.6); c.lineTo(2.4 + ex, ey - 4.6 + ang); c.moveTo(5.4 + ex, ey - 4.6 + ang); c.lineTo(11.8 + ex, ey - 5.8); c.stroke();
  }
  if (S.mouth && !o.fl) S.mouth(ey);
}
// 菁英的光環（顏色依關卡）
function f2Aura(c, t, rgb) {
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * TAU + t * 1.5, r = 25 + Math.sin(t * 7 + i * 2) * 3;
    c.fillStyle = `rgba(${rgb},${.2 + .08 * Math.sin(t * 9 + i)})`;
    c.beginPath(); c.moveTo(Math.cos(a - .3) * 14, Math.sin(a - .3) * 14); c.lineTo(Math.cos(a) * r, Math.sin(a) * r); c.lineTo(Math.cos(a + .3) * 14, Math.sin(a + .3) * 14); c.fill();
  }
}
// 腳下的盾牌（從下方撞到會被打落；玩家在下方時閃光）
function f2UnderShield(c, K, draw) {
  draw(c, K);
  const o = K.o; if (o.below && !o.fl) { aEll(c, 0, 24, 21, 7); c.strokeStyle = `rgba(255,255,255,${.5 + .4 * Math.sin(K.t * 20)})`; c.lineWidth = 2; c.stroke(); }
  for (const h of [K.fa, K.ba]) { aCirc(c, h[0], h[1], 3.5); aFI(c, K.C(K.o.S.dk), 1.6); }
}
// 弓：朝玩家方向，蓄力時拉弓；arrowCol＝箭頭顏色、fire＝火矢
function f2Bow(c, K, wood, fire) {
  const o = K.o, C = K.C;
  c.save(); c.translate(6, 6); c.rotate(o.bowA);
  const pull = o.warn ? 7 : o.atk ? 0 : 2;
  c.beginPath(); c.arc(9, 0, 11, -1.25, 1.25); c.strokeStyle = INK; c.lineWidth = 4; c.stroke(); c.strokeStyle = C(wood); c.lineWidth = 2.4; c.stroke();
  c.beginPath(); c.moveTo(9 + Math.cos(-1.25) * 11, Math.sin(-1.25) * 11); c.lineTo(9 - pull, 0); c.lineTo(9 + Math.cos(1.25) * 11, Math.sin(1.25) * 11); c.strokeStyle = C('#efe6d2'); c.lineWidth = 1; c.stroke();
  if (o.warn) {
    c.beginPath(); c.moveTo(9 - pull, 0); c.lineTo(24, 0); c.strokeStyle = '#7a5230'; c.lineWidth = 1.6; c.stroke();
    if (fire && !o.fl) { for (let i = 0; i < 3; i++) { c.fillStyle = i ? '#ffd25a' : '#ff5a1a'; aCirc(c, 27 + Math.sin(K.t * 30 + i) * 1.2, -i * 1.5, 3.2 - i); c.fill(); } }
    else { c.fillStyle = '#ff5a5a'; c.beginPath(); c.moveTo(27, 0); c.lineTo(23, -2.5); c.lineTo(23, 2.5); c.fill(); }
  }
  aCirc(c, 9, 0, 3.9); aFI(c, C(o.S.dk), 1.6);
  c.restore();
}
// 小火焰（往上飄動）
function f2Flame(c, x, y, s, t, fl, cols = ['#ff5a1a', '#ffb02a', '#fff2a0']) {
  const f = Math.sin(t * 12 + x) * 1.5 * s;
  cols.forEach((col, i) => {
    const k = 1 - i * .3;
    c.beginPath(); c.moveTo(x - 5 * s * k, y); c.quadraticCurveTo(x - 6 * s * k, y - 6 * s * k, x + f * k, y - 13 * s * k); c.quadraticCurveTo(x + 6 * s * k, y - 6 * s * k, x + 5 * s * k, y); c.arc(x, y, 5 * s * k, 0, Math.PI); c.closePath();
    c.fillStyle = fl ? '#fff' : col; c.fill(); if (!i) { c.strokeStyle = INK; c.lineWidth = 1.2; c.stroke(); }
  });
}
// 鳥的翅膀（翅尖分叉）
function f2Wing(c, x, y, len, flap, col, tips = 4) {
  c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x - len * .4, y - len * .7 - flap * len * .5, x - len, y - len * .75 - flap * len * .6);
  for (let i = 0; i < tips; i++) c.lineTo(x - len + i * len / tips * .8, y - len * .35 - flap * (len * .45 - i * 2) + (i % 2) * 3);
  c.lineTo(x + 2, y + 4); c.closePath(); aFI(c, col, 1.4);
}

// ===== 風：天空神社、雲海、風箏 =====
const FOE2_WIND = {
  0: { // 雲隱小忍：頭頂一團雲、乘著小雲
    suit: '#4f6690', dk: '#2e3c5c', band: '#e8f2ff', hood: true,
    back: (c, K) => foeRideBack(c, 'cloud', K.t, K.o.fl),
    front: (c, K) => { foeRideFront(c, 'cloud', K.t, K.o.fl); for (const [x, y, r] of [[-7, -19, 4.5], [0, -23, 5.5], [7, -19, 4.5]]) { aCirc(c, x, y + Math.sin(K.t * 3 + x) * .6, r); aFI(c, K.C('#ffffff'), 1.3); } },
  },
  1: { // 鎌鼬：拿鐮刀的鼬鼠，尾巴捲著風
    suit: '#c7955a', dk: '#8a5e30', head: '#d4a466', mask: false, eyeDy: -3, calm: false,
    back: (c, K) => {
      c.beginPath(); c.moveTo(-6, 12); c.quadraticCurveTo(-26, 16, -28, 0); c.quadraticCurveTo(-30, -12, -20, -14); c.quadraticCurveTo(-24, -4, -18, 2); c.quadraticCurveTo(-12, 8, -4, 8); c.closePath(); aFI(c, K.C('#d4a466'), 1.6);
      if (!K.o.fl) { c.strokeStyle = 'rgba(220,240,255,.85)'; c.lineWidth = 1.6; for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(-24, -4, 6 + i * 4, K.t * 4 + i, K.t * 4 + i + 1.8); c.stroke(); } }
    },
    headBack: [{ path: (c, K) => { aCirc(c, -9, K.HY - 12, 5); c.moveTo(9, K.HY - 13); c.arc(5, K.HY - 13, 5, 0, TAU); }, fill: '#d4a466', after: (c, K) => { c.fillStyle = '#f2a0a0'; aCirc(c, -9, K.HY - 12, 2.4); c.fill(); aCirc(c, 5, K.HY - 13, 2.4); c.fill(); } }],
    faceBack: ey => { },
    mid: (c, K) => { if (K.o.fl) return; aEll(c, 7, K.HY + 6, 8, 5.5); c.fillStyle = '#fff6e8'; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.2; c.stroke(); aEll(c, 13.5, K.HY + 4, 1.8, 1.4); c.fillStyle = INK; c.fill(); },
    front: (c, K) => { // 鐮刀
      const [x, y] = K.fa; c.save(); c.translate(x, y); c.rotate(K.o.warn ? -.9 : -.2);
      c.beginPath(); c.rect(-1.3, -12, 2.6, 15); aFI(c, K.C('#7a5230'), 1.1);
      c.beginPath(); c.moveTo(0, -12); c.quadraticCurveTo(12, -16, 15, -6); c.quadraticCurveTo(10, -11, 0, -9); c.closePath(); aFI(c, K.C('#dfe6ee'), 1.2);
      aCirc(c, 0, 0, 3.9); aFI(c, K.C('#8a5e30'), 1.5); c.restore();
    },
  },
  2: { // 風袋鬼：綠色胖鬼、背著鼓鼓的風袋
    fat: true, suit: '#5aae6a', dk: '#2f7a42', mask: false, browW: 2.2,
    back: (c, K) => {
      c.beginPath(); c.arc(0, -1, 21, Math.PI * 1.08, Math.PI * 1.92); c.strokeStyle = INK; c.lineWidth = 8.5; c.stroke(); c.strokeStyle = K.C('#f2f0e6'); c.lineWidth = 5.5; c.stroke();
      for (const sd of [-1, 1]) { aCirc(c, sd * 20, -1, 5); aFI(c, K.C('#f2f0e6'), 1.5); if (!K.o.fl) { c.strokeStyle = '#c8c0a8'; c.lineWidth = 1; c.beginPath(); c.moveTo(sd * 17, -3); c.lineTo(sd * 23, 1); c.stroke(); } }
      if (!K.o.fl) { c.strokeStyle = 'rgba(220,240,255,.8)'; c.lineWidth = 1.8; for (let i = 0; i < 3; i++) { const p = (K.t * 1.5 + i / 3) % 1; c.beginPath(); c.moveTo(26 + p * 8, -6 + i * 4); c.lineTo(32 + p * 12, -6 + i * 4); c.stroke(); } }
    },
    headPath: (c, K) => { c.moveTo(-3, K.HY - 13); c.lineTo(1, K.HY - 25); c.lineTo(5, K.HY - 13); c.closePath(); },
    bodyAfter: (c, K, BT, BB, w) => { c.fillStyle = '#f2c14e'; c.fillRect(-w - 2, BT + (BB - BT) * .55, w * 2 + 4, 6); c.fillStyle = INK; for (let i = -3; i <= 3; i++) { c.beginPath(); c.moveTo(i * 5 - 1, BT + (BB - BT) * .55); c.lineTo(i * 5 + 1.5, BT + (BB - BT) * .55 + 4); c.lineTo(i * 5 + 1, BT + (BB - BT) * .55); c.fill(); } },
    mouth: ey => { const c = ctx; c.beginPath(); c.moveTo(0, ey + 7); c.quadraticCurveTo(5, ey + 11, 10, ey + 7); c.strokeStyle = INK; c.lineWidth = 1.4; c.stroke(); c.fillStyle = '#fff'; c.beginPath(); c.moveTo(1.5, ey + 7.6); c.lineTo(2.6, ey + 10); c.lineTo(3.6, ey + 8.2); c.fill(); c.beginPath(); c.moveTo(7, ey + 8.2); c.lineTo(8, ey + 10); c.lineTo(9, ey + 7.6); c.fill(); },
    headAfter: (c, K) => { c.fillStyle = '#e8d23a'; c.beginPath(); c.moveTo(-3, K.HY - 13); c.lineTo(1, K.HY - 25); c.lineTo(5, K.HY - 13); c.fill(); },
  },
  3: { // 風車忍：拿著轉動的風車手裡劍
    suit: '#2a6e7c', dk: '#16434c', band: '#ffd27a', hood: true,
    fa: null,
    front: (c, K) => {
      const o = K.o, [x, y] = o.warn ? [-15, -14] : o.atk ? [19, 4] : K.fa;
      c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - 9); c.strokeStyle = INK; c.lineWidth = 2.6; c.stroke(); c.strokeStyle = K.C('#c9a46a'); c.lineWidth = 1.3; c.stroke();
      c.save(); c.translate(x, y - 10); c.rotate(K.t * (o.warn ? 22 : 6));
      ['#e8463a', '#ffd25a', '#4aa8e8', '#ffffff'].forEach((col, i) => { c.save(); c.rotate(i * Math.PI / 2); c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -8); c.lineTo(6, -6); c.closePath(); aFI(c, K.C(col), 1.1); c.restore(); });
      aCirc(c, 0, 0, 1.6); c.fillStyle = INK; c.fill(); c.restore();
      aCirc(c, x, y, 3.9); aFI(c, K.C('#16434c'), 1.5);
    },
    noFa: true,
  },
  4: { // 大團扇忍：踩在大團扇上當盾
    suit: '#3e4d72', dk: '#242e48', band: '#e8463a', hood: true, calm: true,
    fa: [12, 19.5], ba: [-12, 19.5], ff: [4, 19], bf: [-4, 19], noFa: true, noBa: true,
    front: (c, K) => f2UnderShield(c, K, (c, K) => {
      c.beginPath(); c.rect(18, 21, 12, 3.4); aFI(c, K.C('#7a5230'), 1.2);
      aEll(c, 0, 24, 20, 6); aFI(c, K.C('#f2ead2'), 2);
      if (!K.o.fl) { c.save(); aEll(c, 0, 24, 20, 6); c.clip(); c.strokeStyle = '#c8b890'; c.lineWidth = .8; for (let i = -4; i <= 4; i++) { c.beginPath(); c.moveTo(0, 30); c.lineTo(i * 6, 17); c.stroke(); } aEll(c, 0, 24, 6, 2.6); c.fillStyle = '#d8323c'; c.fill(); c.restore(); }
    }),
  },
  6: { // 鴉天狗武者（菁英）：黑羽、黃嘴、紅色鎧甲
    suit: '#b8322a', dk: '#6e1a16', head: '#24262f', headDk: '#0f1016', mask: false, glow: '#ffd27a', calm: true,
    fa: [5, 12.5], ba: [-3, 11.5],
    back: (c, K) => {
      if (!K.o.fl) f2Aura(c, K.t, '120,220,255');
      for (const s of [-1, 1]) { c.save(); c.scale(s, 1); f2Wing(c, 6, 2, 22, Math.sin(K.t * 4) * .3, K.C('#24262f'), 4); c.restore(); }
    },
    headPath: (c, K) => { c.moveTo(-6, K.HY - 13); c.lineTo(0, K.HY - 21); c.lineTo(6, K.HY - 13); c.closePath(); },
    headAfter: (c, K) => { c.fillStyle = '#0c0c10'; c.beginPath(); c.moveTo(-6, K.HY - 13); c.lineTo(0, K.HY - 21); c.lineTo(6, K.HY - 13); c.fill(); },
    bodyAfter: (c, K, BT, BB, w) => { c.fillStyle = '#f2c14e'; for (let i = 0; i < 3; i++) c.fillRect(-w - 2, BT + 2 + i * 3.4, w * 2 + 4, .9); },
    front: (c, K) => { // 嘴喙
      c.beginPath(); c.moveTo(1, K.HY + 6); c.quadraticCurveTo(7, K.HY + 6, 11.5, K.HY + 8.8); c.quadraticCurveTo(7, K.HY + 11.4, 1, K.HY + 11.4); c.quadraticCurveTo(-.4, K.HY + 8.7, 1, K.HY + 6); c.closePath(); aFI(c, K.C('#f2b02a'), 1.3);
      if (!K.o.fl) { c.beginPath(); c.moveTo(3, K.HY - 13); c.lineTo(5.5, K.HY - 9.8); c.lineTo(3, K.HY - 6.6); c.lineTo(.5, K.HY - 9.8); c.closePath(); aFI(c, '#fff6c8', 1); }
    },
    eyeDy: -2,
  },
  9: { // 紙鳶射手：站在風箏上拉弓
    suit: '#3a5c8e', dk: '#21385c', band: '#e8463a', hood: true, noFa: true,
    back: (c, K) => {
      c.save(); c.translate(0, 24); c.rotate(Math.sin(K.t * 2.5) * .08);
      c.beginPath(); c.moveTo(-22, 0); c.lineTo(0, -6); c.lineTo(22, 0); c.lineTo(0, 6); c.closePath(); aFI(c, K.C('#f4ead0'), 1.6);
      if (!K.o.fl) { c.strokeStyle = '#a8743c'; c.lineWidth = 1; c.beginPath(); c.moveTo(-22, 0); c.lineTo(22, 0); c.moveTo(0, -6); c.lineTo(0, 6); c.stroke(); aCirc(c, 0, 0, 3); c.fillStyle = '#d8323c'; c.fill(); }
      c.beginPath(); c.moveTo(-22, 0); for (let i = 1; i <= 3; i++) c.lineTo(-22 - i * 4, Math.sin(K.t * 6 + i) * 3 + i * 2); c.strokeStyle = INK; c.lineWidth = 3; c.stroke(); c.strokeStyle = K.C('#e8463a'); c.lineWidth = 1.6; c.stroke();
      c.restore();
    },
    front: (c, K) => f2Bow(c, K, '#a8743c'),
  },
};
// 風 5：爆風紙鳶（綁著炸藥的風箏，畫著鬼臉）
FOE2_WIND[5] = { custom: (c, o) => {
  const C = F2W(o), t = o.t, sw = Math.sin(t * 3 + o.seed) * .1;
  c.save(); c.rotate(sw);
  // 尾巴的飄帶
  c.beginPath(); c.moveTo(0, 20); for (let i = 1; i <= 5; i++) c.lineTo(Math.sin(t * 6 + i) * 4, 20 + i * 5); c.strokeStyle = INK; c.lineWidth = 3; c.stroke(); c.strokeStyle = C('#4aa8e8'); c.lineWidth = 1.6; c.stroke();
  // 吊在下面的炸彈
  c.beginPath(); c.moveTo(0, 20); c.lineTo(8, 24); c.strokeStyle = INK; c.lineWidth = 1.2; c.stroke();
  aCirc(c, 10, 28, 6.5); aFI(c, C('#1c1c22'), 1.6); if (!o.fl) { aCirc(c, 8, 26, 2); c.fillStyle = 'rgba(255,255,255,.35)'; c.fill(); for (let i = 0; i < 4; i++) { const a = t * 20 + i * 1.6; c.fillStyle = i % 2 ? '#ffd25a' : '#ff6a1a'; c.fillRect(14 + Math.cos(a) * 2.5, 21 + Math.sin(a) * 2.5, 2, 2); } }
  // 風箏本體
  c.beginPath(); c.moveTo(0, -23); c.lineTo(17, -2); c.lineTo(0, 21); c.lineTo(-17, -2); c.closePath(); aFI(c, C('#f4ead0'), 2);
  if (!o.fl) {
    c.save(); c.beginPath(); c.moveTo(0, -23); c.lineTo(17, -2); c.lineTo(0, 21); c.lineTo(-17, -2); c.closePath(); c.clip();
    c.fillStyle = '#e8463a'; c.fillRect(-20, 8, 40, 16);
    c.strokeStyle = '#a8743c'; c.lineWidth = 1; c.beginPath(); c.moveTo(0, -23); c.lineTo(0, 21); c.moveTo(-17, -2); c.lineTo(17, -2); c.stroke(); c.restore();
  }
  // 畫在風箏上的鬼臉
  foeEye(c, -5, -4, 3.2, 4, null, o.warn, o.blink); foeEye(c, 5, -4, 3.2, 4, null, o.warn, o.blink);
  c.strokeStyle = INK; c.lineWidth = 1.8; c.beginPath(); c.moveTo(-9, -10); c.lineTo(-2, -8); c.moveTo(2, -8); c.lineTo(9, -10); c.stroke();
  if (!o.fl) { c.beginPath(); c.moveTo(-5, 4); c.quadraticCurveTo(0, 8, 5, 4); c.strokeStyle = INK; c.lineWidth = 1.4; c.stroke(); }
  c.restore();
} };
// 風 7：燕子群
FOE2_WIND[7] = { custom: (c, o) => {
  const C = F2W(o), w = Math.sin(o.t * 16), dir = o.e && o.e.vx < 0 ? -1 : 1;
  c.save(); c.scale(dir, 1);
  f2Wing(c, -2, -1, 15, w, C('#22306a'), 3);
  c.beginPath(); c.moveTo(-6, 0); c.lineTo(-20, -3); c.lineTo(-14, 1); c.lineTo(-21, 5); c.lineTo(-6, 4); c.closePath(); aFI(c, C('#1a2452'), 1.3);   // 燕尾
  heroSilhouette(c, [
    { path: c => aEll(c, -3, 2, 7.5, 5), fill: C('#22306a'), after: o.fl ? null : c => { c.save(); c.clip(); c.fillStyle = '#ffffff'; c.fillRect(-12, 3, 18, 6); c.restore(); } },
    { path: c => aCirc(c, 5, -2, 8), fill: C('#22306a'), after: o.fl ? null : c => { c.save(); c.clip(); c.fillStyle = '#d8423a'; c.beginPath(); c.arc(9, 4, 4.5, 0, TAU); c.fill(); c.restore(); } },
  ], 1.4);
  c.beginPath(); c.moveTo(12, -2.5); c.lineTo(16.5, -1); c.lineTo(12, .8); c.closePath(); aFI(c, C('#2a2a2a'), 1);
  foeEye(c, 8, -3.5, 2.5, 2.9, null, false, o.blink);
  f2Wing(c, 2, -1, 15, -w, C('#2c3c80'), 3);
  c.restore();
} };
// 風 8：風鈴精（玻璃風鈴、下面掛著短籤）
FOE2_WIND[8] = { custom: (c, o) => {
  const C = F2W(o), t = o.t, vx = o.e ? o.e.vx || 0 : 0;
  c.save(); c.rotate(clamp(vx / 300, -.35, .35) + Math.sin(t * 5) * .06);
  c.beginPath(); c.moveTo(0, -17); c.lineTo(0, -24); c.strokeStyle = INK; c.lineWidth = 1.4; c.stroke();
  // 短籤（紙條）
  c.beginPath(); c.moveTo(0, 6); c.lineTo(Math.sin(t * 6) * 3, 12); c.strokeStyle = INK; c.lineWidth = 1; c.stroke();
  c.save(); c.translate(Math.sin(t * 6) * 3, 12); c.rotate(Math.sin(t * 6 + 1) * .25); c.beginPath(); c.rect(-3.5, 0, 7, 14); aFI(c, C('#ffe28a'), 1.2); if (!o.fl) { c.strokeStyle = '#c0262d'; c.lineWidth = .9; c.beginPath(); c.moveTo(0, 3); c.lineTo(0, 11); c.stroke(); } c.restore();
  // 玻璃鐘
  c.beginPath(); c.moveTo(-14, 6); c.quadraticCurveTo(-15, -17, 0, -17); c.quadraticCurveTo(15, -17, 14, 6); c.quadraticCurveTo(0, 9, -14, 6); c.closePath();
  c.fillStyle = o.fl ? '#fff' : 'rgba(190,232,255,.92)'; c.fill(); aInk(c, 1.8);
  if (!o.fl) { c.fillStyle = 'rgba(255,255,255,.75)'; aEll(c, -7, -9, 2.4, 4.5, .3); c.fill(); c.fillStyle = '#ff6a5a'; c.beginPath(); c.moveTo(8, 0); c.quadraticCurveTo(11, -4, 13, 0); c.quadraticCurveTo(11, 3, 8, 0); c.fill(); }   // 反光與金魚花紋
  aCirc(c, 0, 5, 2.4); aFI(c, C('#c9a14a'), 1);   // 舌
  foeEye(c, -4, -5, 2.7, 3.4, null, false, o.blink); foeEye(c, 4, -5, 2.7, 3.4, null, false, o.blink);
  if (!o.fl) { c.fillStyle = 'rgba(255,120,170,.5)'; aEll(c, -8, -1, 2, 1.1); c.fill(); aEll(c, 8, -1, 2, 1.1); c.fill(); c.beginPath(); c.arc(0, -1, 1.6, .2, Math.PI - .2); c.strokeStyle = INK; c.lineWidth = 1; c.stroke(); }
  c.restore();
} };
// 風 10：旋風玉（小龍捲風）
FOE2_WIND[10] = { custom: (c, o) => {
  const C = F2W(o), t = o.t;
  if (!o.fl) { const gl = c.createRadialGradient(0, 0, 2, 0, 0, 22); gl.addColorStop(0, 'rgba(200,240,255,.45)'); gl.addColorStop(1, 'rgba(200,240,255,0)'); c.fillStyle = gl; aCirc(c, 0, 0, 22); c.fill(); }
  for (let i = 4; i >= 0; i--) {
    const y = -10 + i * 5, rx = 13 - i * 2.2, sx = Math.sin(t * 6 + i) * 1.5;
    aEll(c, sx, y, rx, 3.6); aFI(c, C(i % 2 ? '#cfeaf2' : '#a8d8e6'), 1.4);
  }
  if (!o.fl) { c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 1.3; for (let i = 0; i < 3; i++) { c.beginPath(); c.ellipse(0, -10 + i * 6, 11 - i * 2.5, 3, 0, t * 8 + i, t * 8 + i + 2); c.stroke(); } }
  // 繞著轉的葉子
  const a = t * 5; c.save(); c.translate(Math.cos(a) * 15, Math.sin(a) * 5 - 4); c.rotate(a); c.beginPath(); c.ellipse(0, 0, 3.4, 1.6, 0, 0, TAU); aFI(c, C('#6abf4a'), 1); c.restore();
  foeEye(c, -3.5, -10, 2.6, 3.2, null, false, o.blink); foeEye(c, 4, -10, 2.6, 3.2, null, false, o.blink);
  c.strokeStyle = INK; c.lineWidth = 1.4; c.beginPath(); c.moveTo(-6.5, -15); c.lineTo(-1, -13.6); c.moveTo(1.5, -13.6); c.lineTo(7, -15); c.stroke();
} };
// 風 12：斷線紙鳶（奴風箏，吊在線上擺盪、吐線纏人）
FOE2_WIND[12] = { custom: (c, o) => {
  const C = F2W(o), t = o.t;
  c.strokeStyle = 'rgba(235,235,245,.75)'; c.lineWidth = 1; c.beginPath(); c.moveTo(0, -14); c.lineTo(0, -160); c.stroke();
  c.save(); c.rotate(Math.sin(t * 3) * .12);
  // 袖子（張開的手臂）
  c.beginPath(); c.moveTo(-22, -6); c.lineTo(22, -6); c.lineTo(20, 4); c.lineTo(-20, 4); c.closePath(); aFI(c, C('#3a6ad0'), 1.6);
  if (!o.fl) { c.fillStyle = '#ffffff'; for (let i = -2; i <= 2; i++) if (i) { aCirc(c, i * 8, -1, 1.6); c.fill(); } }
  // 身體（下擺）
  c.beginPath(); c.moveTo(-8, 4); c.lineTo(8, 4); c.lineTo(10, 14); c.lineTo(-10, 14); c.closePath(); aFI(c, C('#e8463a'), 1.6);
  // 臉（方形紙面）
  c.beginPath(); c.rect(-10, -16, 20, 16); aFI(c, C('#f6e6c8'), 1.8);
  if (!o.fl) { c.fillStyle = '#1c1c22'; c.fillRect(-10, -16, 20, 4); }
  c.strokeStyle = INK; c.lineWidth = 2.2; c.beginPath(); c.moveTo(-8, -9.5); c.lineTo(-2, -8); c.moveTo(2, -8); c.lineTo(8, -9.5); c.stroke();
  foeEye(c, -4.5, -5.5, 2.5, 2.8, null, o.warn, o.blink); foeEye(c, 4.5, -5.5, 2.5, 2.8, null, o.warn, o.blink);
  if (!o.fl) { c.fillStyle = '#e8463a'; aEll(c, 0, -1.5, 3, 1.4); c.fill(); }
  // 下面兩條飄帶
  for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(sd * 6, 14); c.quadraticCurveTo(sd * 8 + Math.sin(t * 6 + sd) * 4, 20, sd * 5, 27); c.strokeStyle = INK; c.lineWidth = 3; c.stroke(); c.strokeStyle = C('#ffd25a'); c.lineWidth = 1.6; c.stroke(); }
  c.restore();
} };

// ===== 火：熔岩洞、燒焦的鳥居 =====
const FOE2_FIRE = {
  0: { // 火鼠：圓耳朵、尾巴是火苗
    suit: '#8a5a4a', dk: '#55342a', head: '#9a6a58', mask: false, eyeDy: -2,
    back: (c, K) => { c.beginPath(); c.moveTo(-6, 13); c.quadraticCurveTo(-20, 18, -22, 6); c.strokeStyle = INK; c.lineWidth = 4.4; c.stroke(); c.strokeStyle = K.C('#c08a78'); c.lineWidth = 2; c.stroke(); f2Flame(c, -22, 6, .75, K.t, K.o.fl); },
    headBack: [{ path: (c, K) => { aCirc(c, -10, K.HY - 11, 6.5); c.moveTo(11, K.HY - 14); c.arc(4.5, K.HY - 14, 6.5, 0, TAU); }, fill: '#9a6a58', after: (c, K) => { c.fillStyle = '#f0a0a0'; aCirc(c, -10, K.HY - 11, 3.4); c.fill(); aCirc(c, 4.5, K.HY - 14, 3.4); c.fill(); } }],
    headPath: (c, K) => { c.moveTo(12, K.HY + 1); c.lineTo(19, K.HY + 5); c.lineTo(11, K.HY + 8); c.closePath(); },
    mid: (c, K) => { if (K.o.fl) return; aEll(c, 6, K.HY + 7, 7, 4.5); c.fillStyle = '#e8c8b0'; c.fill(); aCirc(c, 18.5, K.HY + 5, 1.8); c.fillStyle = '#ff7a8a'; c.fill(); c.strokeStyle = INK; c.lineWidth = .8; c.beginPath(); c.moveTo(12, K.HY + 6); c.lineTo(20, K.HY + 3); c.moveTo(12, K.HY + 8); c.lineTo(20, K.HY + 9); c.stroke(); },
  },
  1: { // 赤小鬼：單角、虎皮腰布、拿著火鉗
    suit: '#d8463a', dk: '#8e1c16', mask: false,
    headPath: (c, K) => { c.moveTo(-3, K.HY - 13); c.lineTo(2, K.HY - 24); c.lineTo(6, K.HY - 13); c.closePath(); },
    headAfter: (c, K) => { c.fillStyle = '#f5e6b8'; c.beginPath(); c.moveTo(-3, K.HY - 13); c.lineTo(2, K.HY - 24); c.lineTo(6, K.HY - 13); c.fill(); c.fillStyle = '#2a1410'; for (let i = -3; i <= 1; i++) { c.beginPath(); c.moveTo(i * 5 - 3, K.HY - 11); c.lineTo(i * 5, K.HY - 18); c.lineTo(i * 5 + 3, K.HY - 11); c.fill(); } },
    bodyAfter: (c, K, BT, BB, w) => { c.fillStyle = '#f2c14e'; c.fillRect(-w - 2, BT + (BB - BT) * .5, w * 2 + 4, 6); c.fillStyle = INK; for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(i * 5, BT + (BB - BT) * .5); c.lineTo(i * 5 + 2, BT + (BB - BT) * .5 + 4); c.lineTo(i * 5 + 1.4, BT + (BB - BT) * .5); c.fill(); } },
    mouth: ey => { const c = ctx; c.beginPath(); c.moveTo(1, ey + 7); c.quadraticCurveTo(5, ey + 10, 10, ey + 7); c.strokeStyle = INK; c.lineWidth = 1.3; c.stroke(); c.fillStyle = '#fff'; c.beginPath(); c.moveTo(8, ey + 7.6); c.lineTo(9, ey + 10); c.lineTo(10, ey + 7.2); c.fill(); },
    front: (c, K) => { const [x, y] = K.fa; c.save(); c.translate(x, y); c.rotate(-.35); for (const dx of [-1.4, 1.4]) { c.beginPath(); c.moveTo(dx, 2); c.lineTo(dx * .6, -16); c.strokeStyle = INK; c.lineWidth = 2.6; c.stroke(); c.strokeStyle = K.C('#8a8e9a'); c.lineWidth = 1.3; c.stroke(); } if (!K.o.fl) { aCirc(c, 0, -17, 2.6); c.fillStyle = '#ff6a1a'; c.fill(); aCirc(c, 0, -17, 1.3); c.fillStyle = '#ffe08a'; c.fill(); } aCirc(c, 0, 0, 3.9); aFI(c, K.C('#8e1c16'), 1.5); c.restore(); },
    noFa: true,
  },
  2: { // 熔岩力士：岩石身體、岩漿裂紋、髮髻、紅色兜襠
    fat: true, suit: '#3e3030', dk: '#221818', mask: false, glow: '#ffa040', belt: '#c0262d',
    headPath: (c, K) => { c.moveTo(-4, K.HY - 13); c.quadraticCurveTo(-6, K.HY - 22, 2, K.HY - 21); c.quadraticCurveTo(8, K.HY - 20, 5, K.HY - 13); c.closePath(); },
    headAfter: (c, K) => { c.strokeStyle = '#ff8a2a'; c.lineWidth = 1.6; c.lineJoin = 'miter'; c.beginPath(); c.moveTo(-14, K.HY - 2); c.lineTo(-9, K.HY + 1); c.lineTo(-11, K.HY + 6); c.lineTo(-6, K.HY + 10); c.moveTo(-6, K.HY - 13); c.lineTo(-3, K.HY - 8); c.lineTo(-7, K.HY - 5); c.stroke(); c.fillStyle = '#1a1414'; c.beginPath(); c.moveTo(-4, K.HY - 13); c.quadraticCurveTo(-6, K.HY - 22, 2, K.HY - 21); c.quadraticCurveTo(8, K.HY - 20, 5, K.HY - 13); c.fill(); },
    bodyAfter: (c, K, BT, BB, w) => { c.fillStyle = '#c0262d'; c.fillRect(-w - 2, BT + (BB - BT) * .45, w * 2 + 4, 6); c.strokeStyle = '#ff8a2a'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(-8, BT); c.lineTo(-4, BT + 4); c.lineTo(-7, BT + 6); c.moveTo(6, BT + 1); c.lineTo(9, BT + 4); c.stroke(); },
  },
  3: { // 焰忍：燃燒的手裡劍
    suit: '#5e1c1c', dk: '#381010', band: '#ff8a2a', hood: true, noFa: true,
    front: (c, K) => { const o = K.o, [x, y] = o.warn ? [-15, -14] : o.atk ? [19, 4] : K.fa; if (!o.atk) { if (!o.fl) { const gl = c.createRadialGradient(x, y - 4, 1, x, y - 4, 9); gl.addColorStop(0, 'rgba(255,160,40,.7)'); gl.addColorStop(1, 'rgba(255,90,20,0)'); c.fillStyle = gl; aCirc(c, x, y - 4, 9); c.fill(); } drawStar4(c, x, y - 4, 5, K.t * (o.warn ? 25 : 8), o.fl ? '#fff' : '#ffb02a'); } aCirc(c, x, y, 3.9); aFI(c, K.C('#381010'), 1.5); },
  },
  4: { // 鍛冶鐵甲：鐵盔、踩著燒紅的鐵砧
    suit: '#4a4c54', dk: '#2a2c32', band: '#ff8a2a', hood: false, calm: true,
    fa: [12, 19.5], ba: [-12, 19.5], ff: [4, 19], bf: [-4, 19], noFa: true, noBa: true,
    headPath: (c, K) => { c.moveTo(-17, K.HY + 1); c.lineTo(17, K.HY + 1); c.lineTo(15, K.HY - 2); c.lineTo(-15, K.HY - 2); c.closePath(); },
    headAfter: (c, K) => { c.fillStyle = '#7a7e8a'; c.fillRect(-16, K.HY - 16, 32, 15); c.fillStyle = '#c8ccd4'; for (let i = -2; i <= 2; i++) { aCirc(c, i * 5, K.HY - 5, 1.1); c.fill(); } },
    front: (c, K) => f2UnderShield(c, K, (c, K) => {
      c.beginPath(); c.moveTo(-14, 20); c.lineTo(14, 20); c.lineTo(24, 23); c.lineTo(14, 26); c.lineTo(8, 26); c.lineTo(10, 30); c.lineTo(-10, 30); c.lineTo(-8, 26); c.lineTo(-14, 26); c.closePath(); aFI(c, K.C('#3a3c44'), 2);
      if (!K.o.fl) { c.fillStyle = `rgba(255,120,40,${.6 + .3 * Math.sin(K.t * 6)})`; c.fillRect(-13, 20.5, 27, 1.6); }
    }),
  },
  6: { // 赤鬼武者（菁英）：短角、亂髮、額當、黑漆鎧甲配紅色編繩與袖甲、背著金棒、火焰光環
    suit: '#26262e', dk: '#121216', head: '#d8382e', headDk: '#8e1c16', mask: false, glow: '#ffe24a', calm: true, browW: 2.4,
    fa: [5, 12.5], ba: [-3, 11.5],
    back: (c, K) => {
      if (!K.o.fl) f2Aura(c, K.t, '255,120,40');
      c.save(); c.translate(-13, 5); c.rotate(-.55); c.scale(.8, .8);   // 背上的金棒
      c.beginPath(); c.moveTo(-2.4, 10); c.lineTo(-4.2, -22); c.lineTo(4.2, -22); c.lineTo(2.4, 10); c.closePath(); aFI(c, K.C('#3a3a44'), 1.5);
      if (!K.o.fl) { c.fillStyle = '#c9a14a'; for (let i = 0; i < 4; i++) for (const s of [-1, 1]) { aCirc(c, s * 2.4, -18 + i * 6, 1); c.fill(); } c.fillStyle = '#8a2a20'; c.fillRect(-2.6, 4, 5.2, 5); }
      c.restore();
    },
    headAfter: (c, K) => {
      const HY = K.HY;
      c.fillStyle = '#1a1214'; c.beginPath(); c.moveTo(-16, HY - 6);   // 亂髮
      for (let i = 0; i <= 8; i++) c.lineTo(-16 + i * 4, HY - 13 - (i % 2 ? 0 : 5) - Math.sin(i) * 1.5);
      c.lineTo(16, HY - 6); c.lineTo(16, HY - 16); c.lineTo(-16, HY - 16); c.closePath(); c.fill();
      c.fillStyle = '#8a8e9a'; c.fillRect(-16, HY - 10, 32, 4.6); c.fillStyle = '#c9a14a'; c.fillRect(-16, HY - 10, 32, 1.1); c.fillRect(-16, HY - 6.5, 32, 1.1);   // 額當
      c.fillStyle = '#d8dce4'; for (const x of [-9, -3, 3, 9]) { aCirc(c, x, HY - 7.7, .9); c.fill(); }
      c.fillStyle = 'rgba(255,140,120,.45)'; aEll(c, -4, HY + 8, 2.6, 1.4); c.fill(); aEll(c, 13, HY + 8, 2.4, 1.3); c.fill();   // 臉頰
    },
    mid: (c, K) => {
      const HY = K.HY;
      for (const s of [-1, 1]) {   // 短角（有環紋）
        c.beginPath(); c.moveTo(s * 2.5, HY - 12.5); c.quadraticCurveTo(s * 6, HY - 18, s * 9, HY - 23); c.quadraticCurveTo(s * 12.5, HY - 16, s * 11.5, HY - 9.5); c.closePath(); aFI(c, K.C('#f5e6b8'), 1.3);
        if (!K.o.fl) { c.strokeStyle = '#c8b080'; c.lineWidth = .9; c.beginPath(); c.moveTo(s * 6.5, HY - 14); c.lineTo(s * 10.4, HY - 13); c.moveTo(s * 8, HY - 17); c.lineTo(s * 10.4, HY - 16.5); c.stroke(); }
      }
      for (const s of [-1, 1]) {   // 袖甲（肩膀的漆板）
        c.save(); c.translate(s * 11, 10); c.rotate(s * .25);
        c.beginPath(); c.rect(-4.5, -3.5, 9, 9); aFI(c, K.C('#2a2a32'), 1.4);
        if (!K.o.fl) { c.fillStyle = '#c0262d'; for (let i = 0; i < 3; i++) c.fillRect(-4, -2.4 + i * 3, 8, 1); c.fillStyle = '#c9a14a'; c.fillRect(-4.5, -3.5, 9, 1.2); }
        c.restore();
      }
    },
    bodyAfter: (c, K, BT, BB, w) => {
      c.fillStyle = '#c0262d'; for (let i = 0; i < 3; i++) c.fillRect(-w - 2, BT + 1.6 + i * 3.2, w * 2 + 4, 1.1);   // 紅色編繩
      c.fillStyle = '#c9a14a'; for (let i = -2; i <= 2; i++) { aCirc(c, i * 3.2, BT + 11, .8); c.fill(); }
      c.fillStyle = '#f2c14e'; c.fillRect(-w - 2, BB - 4, w * 2 + 4, 2.4); c.fillStyle = INK; for (let i = -2; i <= 2; i++) c.fillRect(i * 3.4, BB - 4, 1.1, 2.4);   // 虎皮腰帶
    },
    mouth: ey => { const c = ctx; c.beginPath(); c.moveTo(0, ey + 8); c.quadraticCurveTo(5, ey + 6.6, 10, ey + 8); c.strokeStyle = INK; c.lineWidth = 1.4; c.stroke(); c.fillStyle = '#fff'; for (const x of [1.6, 8.4]) { c.beginPath(); c.moveTo(x - 1.3, ey + 7.8); c.lineTo(x, ey + 4.8); c.lineTo(x + 1.3, ey + 7.6); c.closePath(); c.fill(); c.strokeStyle = INK; c.lineWidth = .7; c.stroke(); } },
  },
  9: { // 火矢足輕：陣笠、拉弓射火矢
    suit: '#4a3a2a', dk: '#2a2016', noFa: true,
    headPath: (c, K) => { c.moveTo(-21, K.HY - 7); c.quadraticCurveTo(0, K.HY - 26, 21, K.HY - 7); c.quadraticCurveTo(0, K.HY - 11, -21, K.HY - 7); c.closePath(); },
    headAfter: (c, K) => { c.fillStyle = '#2a2a30'; c.beginPath(); c.moveTo(-21, K.HY - 7); c.quadraticCurveTo(0, K.HY - 26, 21, K.HY - 7); c.quadraticCurveTo(0, K.HY - 11, -21, K.HY - 7); c.fill(); c.fillStyle = '#c9a14a'; aCirc(c, 0, K.HY - 13, 2.4); c.fill(); },
    front: (c, K) => f2Bow(c, K, '#6a4a2a', true),
  },
};
// 陣笠超出頭的圓，另外蓋一次
FOE2_FIRE[9].mid = (c, K) => { c.beginPath(); c.moveTo(-21, K.HY - 7); c.quadraticCurveTo(0, K.HY - 26, 21, K.HY - 7); c.quadraticCurveTo(0, K.HY - 11, -21, K.HY - 7); c.closePath(); aFI(c, K.C('#2a2a30'), 1.6); if (!K.o.fl) { c.fillStyle = '#c9a14a'; aCirc(c, 0, K.HY - 14, 2.4); c.fill(); } };
// 火 5：火藥桶狸
FOE2_FIRE[5] = {
  suit: '#7a5a3e', dk: '#4a3420', head: '#8e6c4a', mask: false, eyeDy: -1,
  back: (c, K) => {
    // 大尾巴（有條紋）
    c.beginPath(); c.ellipse(-16, 14, 9, 5.5, -.5, 0, TAU); aFI(c, K.C('#8e6c4a'), 1.6);
    if (!K.o.fl) { c.save(); c.beginPath(); c.ellipse(-16, 14, 9, 5.5, -.5, 0, TAU); c.clip(); c.fillStyle = '#3a2814'; for (let i = 0; i < 3; i++) { c.save(); c.translate(-20 + i * 4, 16 - i * 2); c.rotate(1); c.fillRect(-1, -8, 2, 16); c.restore(); } c.restore(); }
    // 背上的火藥桶
    c.beginPath(); c.rect(-22, -6, 13, 17); aFI(c, K.C('#a8743c'), 1.6);
    if (!K.o.fl) { c.fillStyle = '#5a3a1e'; c.fillRect(-22, -3, 13, 1.6); c.fillRect(-22, 7, 13, 1.6); c.fillStyle = '#f4ead0'; c.fillRect(-19.5, 0, 8, 6); txt('火', -15.5, 3.2, 6, '#c0262d'); }
    c.beginPath(); c.moveTo(-15, -6); c.quadraticCurveTo(-18, -12, -14, -15); c.strokeStyle = K.C('#a07040'); c.lineWidth = 1.6; c.stroke();
    if (!K.o.fl) for (let i = 0; i < 5; i++) { const a = K.t * 20 + i * 1.26, r = 2 + (i % 2) * 2.4; c.fillStyle = i % 2 ? '#ffd25a' : '#ff6a1a'; c.fillRect(-14 + Math.cos(a) * r - 1, -15 + Math.sin(a) * r - 1, 2, 2); }
  },
  headBack: [{ path: (c, K) => { aCirc(c, -9, K.HY - 12, 4.5); c.moveTo(9, K.HY - 14); c.arc(4.5, K.HY - 14, 4.5, 0, TAU); }, fill: '#5a3a1e' }],
  faceBack: ey => { const c = ctx; c.fillStyle = '#3a2814'; aEll(c, -1, ey + .5, 5.5, 5); c.fill(); aEll(c, 9, ey + .5, 5.5, 5); c.fill(); },
  mid: (c, K) => { if (K.o.fl) return; aEll(c, 5, K.HY + 8, 7, 4); c.fillStyle = '#f2e2c8'; c.fill(); aEll(c, 9, K.HY + 6, 2, 1.5); c.fillStyle = INK; c.fill(); },
  brows: false,
};
// 火 7：火蝙蝠
FOE2_FIRE[7] = { custom: (c, o) => {
  const C = F2W(o), w = Math.sin(o.t * 18), dir = o.e && o.e.vx < 0 ? -1 : 1;
  c.save(); c.scale(dir, 1);
  for (const s of [-1, 1]) {
    c.save(); c.scale(s, 1);
    c.beginPath(); c.moveTo(3, -1); c.quadraticCurveTo(10, -10 - w * 8, 19, -8 - w * 10); c.lineTo(17, -3 - w * 5); c.lineTo(13, -2 - w * 4); c.lineTo(10, 1 - w * 2); c.lineTo(4, 3); c.closePath(); aFI(c, C('#3a1a24'), 1.3);
    if (!o.fl) { c.fillStyle = 'rgba(255,120,30,.85)'; c.beginPath(); c.moveTo(19, -8 - w * 10); c.lineTo(23, -12 - w * 11); c.lineTo(17, -3 - w * 5); c.fill(); }
    c.restore();
  }
  heroSilhouette(c, [{ path: c => { aCirc(c, 0, 0, 8.5); c.moveTo(-6, -6); c.lineTo(-5, -13); c.lineTo(-2, -7); c.closePath(); c.moveTo(6, -6); c.lineTo(5, -13); c.lineTo(2, -7); c.closePath(); }, fill: C('#4a2230') }], 1.4);
  foeEye(c, -3, -1, 2.4, 2.8, null, false, o.blink, o.fl ? null : '#ffb02a'); foeEye(c, 3.4, -1, 2.4, 2.8, null, false, o.blink, o.fl ? null : '#ffb02a');
  if (!o.fl) { c.fillStyle = '#fff'; c.beginPath(); c.moveTo(-1.6, 4); c.lineTo(-1, 6.4); c.lineTo(-.2, 4); c.moveTo(1, 4); c.lineTo(1.6, 6.4); c.lineTo(2.4, 4); c.fill(); }
  c.restore();
} };
// 火 8：火之雛鳥（頭上是火焰冠）
FOE2_FIRE[8] = { custom: (c, o) => {
  const C = F2W(o), t = o.t, vx = o.e ? o.e.vx || 0 : 0, w = Math.sin(t * 14);
  c.save(); c.rotate(clamp(vx / 300, -.35, .35));
  f2Flame(c, 0, -12, 1.05, t, o.fl);
  for (const s of [-1, 1]) { c.save(); c.scale(s, 1); c.beginPath(); c.moveTo(10, 0); c.quadraticCurveTo(18, -6 - w * 4, 20, 2 - w * 3); c.quadraticCurveTo(16, 6, 10, 6); c.closePath(); aFI(c, C('#ff8a2a'), 1.3); c.restore(); }
  heroSilhouette(c, [{ path: c => aCirc(c, 0, 1, 13), fill: C('#ffa830'), after: o.fl ? null : c => { c.save(); aCirc(c, 0, 1, 13); c.clip(); f2Shade(c, '#ffb840', '#e86a1a', 1, 13); c.fillStyle = '#ffe8a8'; aEll(c, 0, 9, 8, 5); c.fill(); c.restore(); } }], 1.5);
  foeEye(c, -4, -1, 2.7, 3.3, null, false, o.blink); foeEye(c, 4.5, -1, 2.7, 3.3, null, false, o.blink);
  c.beginPath(); c.moveTo(-2, 3); c.lineTo(2.5, 6.5); c.lineTo(6, 3); c.closePath(); aFI(c, C('#e84a2a'), 1.1);
  for (const x of [-4, 4]) { c.beginPath(); c.moveTo(x, 13); c.lineTo(x - 1.5, 17); c.moveTo(x, 13); c.lineTo(x + 1.5, 17); c.strokeStyle = INK; c.lineWidth = 1.4; c.stroke(); }
  c.restore();
} };
// 火 10：火車（燃燒的車輪）
FOE2_FIRE[10] = { custom: (c, o) => {
  const C = F2W(o), t = o.t;
  if (!o.fl) for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + t * 2; f2Flame(c, Math.cos(a) * 15, Math.sin(a) * 15 + 3, .55, t + i, false); }
  aCirc(c, 0, 0, 13); aFI(c, C('#6a4428'), 2);
  aCirc(c, 0, 0, 9.5); c.fillStyle = C('#3a2414'); c.fill();
  c.save(); c.rotate(t * 4); c.strokeStyle = C('#8a5a34'); c.lineWidth = 2.2; for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(i * Math.PI / 3) * 10, Math.sin(i * Math.PI / 3) * 10); c.stroke(); } c.restore();
  aCirc(c, 0, 0, 7); aFI(c, C('#ff8a3a'), 1.4);
  foeEye(c, -2.6, -.6, 2, 2.5, null, true, o.blink); foeEye(c, 2.8, -.6, 2, 2.5, null, true, o.blink);
  c.strokeStyle = INK; c.lineWidth = 1.3; c.beginPath(); c.moveTo(-5, -4.4); c.lineTo(-.6, -3); c.moveTo(.8, -3); c.lineTo(5.2, -4.4); c.stroke();
  c.beginPath(); c.moveTo(-2, 4); c.lineTo(2.4, 4); c.stroke();
} };
// 火 12：提燈妖怪（單眼、吐舌、噴火星）
FOE2_FIRE[12] = { custom: (c, o) => {
  const C = F2W(o), t = o.t;
  c.strokeStyle = 'rgba(235,235,245,.75)'; c.lineWidth = 1; c.beginPath(); c.moveTo(0, -16); c.lineTo(0, -160); c.stroke();
  c.save(); c.rotate(Math.sin(t * 3) * .1);
  c.beginPath(); c.rect(-6, -18, 12, 4); aFI(c, C('#2a2a30'), 1.3); c.beginPath(); c.rect(-6, 12, 12, 4); aFI(c, C('#2a2a30'), 1.3);
  aEll(c, 0, -1, 14, 14); aFI(c, C('#f4dca8'), 1.8);
  if (!o.fl) {
    c.save(); aEll(c, 0, -1, 14, 14); c.clip(); const gl = c.createRadialGradient(0, 0, 2, 0, 0, 16); gl.addColorStop(0, 'rgba(255,200,90,.7)'); gl.addColorStop(1, 'rgba(255,140,40,.1)'); c.fillStyle = gl; c.fillRect(-15, -16, 30, 30);
    c.strokeStyle = '#b8945a'; c.lineWidth = 1; for (let i = -3; i <= 3; i++) { c.beginPath(); c.moveTo(-15, i * 4 - 1); c.lineTo(15, i * 4 - 1); c.stroke(); } c.restore();
    // 破洞
    c.fillStyle = '#5a3a20'; c.beginPath(); c.moveTo(-9, 4); c.lineTo(-6, 2); c.lineTo(-5, 6); c.closePath(); c.fill();
  }
  foeEye(c, 1, -5, 5.2, 5.6, null, o.warn, o.blink, o.fl ? null : '#ff8a2a');
  // 嘴巴與舌頭
  c.beginPath(); c.moveTo(-6, 4); c.quadraticCurveTo(1, 9, 8, 4); c.quadraticCurveTo(1, 6, -6, 4); aFI(c, C('#3a0a0e'), 1.2);
  c.beginPath(); c.moveTo(0, 6); c.quadraticCurveTo(2, 15 + Math.sin(t * 5) * 2, 6, 13); c.quadraticCurveTo(5, 8, 4, 6); c.closePath(); aFI(c, C('#e8584a'), 1.2);
  c.restore();
} };
// 火 13：中魔王 輪入道（燃燒的牛車輪中間一顆大頭）
FOE2_FIRE[13] = { custom: (c, o) => {
  const C = F2W(o), t = o.t;
  if (!o.fl) for (let i = 0; i < 14; i++) { const a = i / 14 * TAU + t * 1.5; f2Flame(c, Math.cos(a) * 46, Math.sin(a) * 46 + 4, 1.1, t + i, false); }
  aCirc(c, 0, 0, 44); aFI(c, C('#5a3820'), 2.4);
  aCirc(c, 0, 0, 36); c.fillStyle = C('#2a1a0e'); c.fill(); aInk(c, 2);
  c.save(); c.rotate(t * 1.8); c.strokeStyle = C('#7a5030'); c.lineWidth = 5; for (let i = 0; i < 8; i++) { c.beginPath(); c.moveTo(Math.cos(i * Math.PI / 4) * 22, Math.sin(i * Math.PI / 4) * 22); c.lineTo(Math.cos(i * Math.PI / 4) * 36, Math.sin(i * Math.PI / 4) * 36); c.stroke(); } c.restore();
  if (!o.fl) { c.fillStyle = '#c9a14a'; for (let i = 0; i < 12; i++) { const a = i / 12 * TAU + t * 1.8; aCirc(c, Math.cos(a) * 40, Math.sin(a) * 40, 1.8); c.fill(); } }
  // 大頭（光頭和尚，怒目）
  heroSilhouette(c, [{ path: c => aCirc(c, 0, 0, 24), fill: C('#e8a070'), after: o.fl ? null : c => { c.save(); aCirc(c, 0, 0, 24); c.clip(); f2Shade(c, '#eeaa7a', '#b8643a', 0, 24); c.restore(); } }], 2);
  foeEye(c, -8, -3, 5, 6, null, true, o.blink, o.fl ? null : '#ffd25a'); foeEye(c, 8, -3, 5, 6, null, true, o.blink, o.fl ? null : '#ffd25a');
  c.strokeStyle = INK; c.lineWidth = 3.4; c.beginPath(); c.moveTo(-16, -13); c.lineTo(-3, -8); c.moveTo(3, -8); c.lineTo(16, -13); c.stroke();
  c.beginPath(); c.moveTo(-10, 10); c.quadraticCurveTo(0, 18, 10, 10); c.quadraticCurveTo(0, 13, -10, 10); aFI(c, C('#3a0a0e'), 1.6);
  if (!o.fl) { c.fillStyle = '#fff'; c.beginPath(); c.moveTo(-8, 11); c.lineTo(-6, 15); c.lineTo(-4, 12); c.moveTo(4, 12); c.lineTo(6, 15); c.lineTo(8, 11); c.fill(); }
} };

// ===== 山：雪山、松林、地藏 =====
const FOE2_MOUNT = {
  0: { // 雪兔忍：長耳朵、紅眼睛、紅圍巾
    suit: '#eef2f8', dk: '#b8c2d2', head: '#f6f8fc', headDk: '#c8d2e0', mask: false, glow: '#e8463a', brows: false,
    headBack: [{ path: (c, K) => { c.beginPath(); c.ellipse(-6, K.HY - 18, 4.5, 11, -.25, 0, TAU); c.moveTo(10, K.HY - 19); c.ellipse(5, K.HY - 19, 4.5, 11, .2, 0, TAU); }, fill: '#f6f8fc', after: (c, K) => { c.fillStyle = '#f6b8c4'; c.beginPath(); c.ellipse(-6, K.HY - 18, 2, 7, -.25, 0, TAU); c.fill(); c.beginPath(); c.ellipse(5, K.HY - 19, 2, 7, .2, 0, TAU); c.fill(); } }],
    bodyAfter: (c, K, BT, BB, w) => { c.fillStyle = '#d8323c'; c.fillRect(-w - 2, BT - 1, w * 2 + 4, 4); },
    mid: (c, K) => { if (K.o.fl) return; c.fillStyle = '#d8323c'; c.beginPath(); c.moveTo(-6, 8); c.lineTo(-14, 12 + Math.sin(K.t * 8) * 2); c.lineTo(-12, 15); c.lineTo(-4, 10); c.fill(); aEll(c, 12, K.HY + 7, 1.6, 1.2); c.fillStyle = '#f08a9a'; c.fill(); },
  },
  1: { // 雪童子：斗笠、白圍巾、紅手套
    suit: '#3c4c7e', dk: '#232e52', glove: '#d8323c', skin: '#fbe2cc',
    mid: (c, K) => {
      c.beginPath(); c.moveTo(-22, K.HY - 6); c.quadraticCurveTo(0, K.HY - 28, 22, K.HY - 6); c.quadraticCurveTo(0, K.HY - 10, -22, K.HY - 6); c.closePath(); aFI(c, K.C('#d8b878'), 1.6);
      if (!K.o.fl) { c.strokeStyle = '#a88a4a'; c.lineWidth = .9; for (let i = -3; i <= 3; i++) { c.beginPath(); c.moveTo(0, K.HY - 20); c.lineTo(i * 6, K.HY - 8); c.stroke(); } c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(-12, K.HY - 12); c.quadraticCurveTo(0, K.HY - 25, 12, K.HY - 12); c.quadraticCurveTo(0, K.HY - 17, -12, K.HY - 12); c.fill(); }
      c.beginPath(); c.moveTo(-10, 7); c.quadraticCurveTo(0, 11, 10, 7); c.lineTo(10, 10); c.quadraticCurveTo(0, 14, -10, 10); c.closePath(); aFI(c, K.C('#f4f6fa'), 1.3);
      c.beginPath(); c.moveTo(-8, 9); c.lineTo(-15, 15 + Math.sin(K.t * 7) * 2); c.lineTo(-11, 17); c.lineTo(-5, 11); c.closePath(); aFI(c, K.C('#f4f6fa'), 1.2);
    },
    mouth: ey => { const c = ctx; c.fillStyle = 'rgba(255,120,140,.5)'; aEll(c, -3, ey + 4.5, 2.2, 1.2); c.fill(); aEll(c, 12, ey + 4.5, 2.2, 1.2); c.fill(); },
    maskDy: 1,
  },
  2: { // 雪男：白色長毛、藍灰色的臉
    fat: true, suit: '#eef2f6', dk: '#aab6c6', head: '#f4f6fa', headDk: '#b8c4d4', skin: '#8ea4c4', maskW: 12, maskH: 8, maskDy: 1,
    headPath: (c, K) => { for (let i = 0; i < 7; i++) { const a = Math.PI + i * Math.PI / 6, x = Math.cos(a) * 15, y = K.HY + Math.sin(a) * 15; c.moveTo(x - 3, y); c.lineTo(x + Math.cos(a) * 5, y + Math.sin(a) * 5); c.lineTo(x + 3, y); c.closePath(); } },
    mouth: ey => { const c = ctx; c.beginPath(); c.moveTo(1, ey + 7); c.quadraticCurveTo(5, ey + 9.5, 10, ey + 7); c.strokeStyle = INK; c.lineWidth = 1.4; c.stroke(); c.fillStyle = '#fff'; c.beginPath(); c.moveTo(2.4, ey + 7.6); c.lineTo(3.4, ey + 10); c.lineTo(4.4, ey + 8); c.fill(); },
    bodyAfter: (c, K, BT, BB, w) => { c.strokeStyle = '#c8d0dc'; c.lineWidth = 1; for (let i = -3; i <= 3; i++) { c.beginPath(); c.moveTo(i * 4, BT + 3); c.lineTo(i * 4 + 1.5, BT + 7); c.stroke(); } },
    belt: '#c8d0dc',
  },
  3: { // 冰柱忍：拿著冰柱
    suit: '#2c4c70', dk: '#183048', band: '#9ad8ff', hood: true, noFa: true,
    front: (c, K) => { const o = K.o, [x, y] = o.warn ? [-15, -14] : o.atk ? [19, 4] : K.fa; if (!o.atk) { c.save(); c.translate(x, y - 3); c.rotate(o.warn ? -.6 : .2); c.beginPath(); c.moveTo(-2.6, 0); c.lineTo(2.6, 0); c.lineTo(0, -15); c.closePath(); aFI(c, K.C('#cfeeff'), 1.2); if (!o.fl) { c.fillStyle = 'rgba(255,255,255,.85)'; c.beginPath(); c.moveTo(-1, -1); c.lineTo(0, -11); c.lineTo(.4, -1); c.fill(); } c.restore(); } aCirc(c, x, y, 3.9); aFI(c, K.C('#183048'), 1.5); },
  },
  4: { // 石佛僧兵：白頭巾裹頭、踩著地藏石盾
    suit: '#4a3e36', dk: '#2a221c', head: '#f2f0ea', headDk: '#c4c0b4', calm: true, maskW: 9, maskH: 5, skin: '#f6d3ad',
    fa: [12, 19.5], ba: [-12, 19.5], ff: [4, 19], bf: [-4, 19], noFa: true, noBa: true,
    headPath: (c, K) => { c.moveTo(-12, K.HY + 8); c.quadraticCurveTo(-20, K.HY + 16, -16, K.HY + 20); c.quadraticCurveTo(-11, K.HY + 14, -8, K.HY + 11); c.closePath(); },
    front: (c, K) => f2UnderShield(c, K, (c, K) => {
      aEll(c, 0, 24, 19, 6); aFI(c, K.C('#9a9a94'), 2);
      if (!K.o.fl) { aEll(c, 0, 23, 13, 3.6); c.strokeStyle = '#c8c8c0'; c.lineWidth = 1.2; c.stroke(); c.strokeStyle = '#5a5a54'; c.lineWidth = 1; c.beginPath(); c.arc(-3, 23.5, 1.6, Math.PI * .1, Math.PI * .9); c.moveTo(4.6, 23.5); c.arc(3, 23.5, 1.6, Math.PI * .1, Math.PI * .9); c.stroke(); c.fillStyle = '#d8323c'; c.fillRect(-7, 25.5, 14, 2); }
    }),
  },
  6: { // 山伏武者（菁英）：頭襟、梵天、錫杖
    suit: '#eceae2', dk: '#a8a49a', band: null, glow: '#9ae8ff', calm: true,
    fa: [12, 10], ba: [-3, 11.5],
    back: (c, K) => { if (!K.o.fl) f2Aura(c, K.t, '140,220,255'); c.beginPath(); c.moveTo(13, 22); c.lineTo(17, -22); c.strokeStyle = INK; c.lineWidth = 3.6; c.stroke(); c.strokeStyle = K.C('#8a6a3a'); c.lineWidth = 2; c.stroke(); c.beginPath(); c.ellipse(17, -25, 4.5, 5.5, .1, 0, TAU); c.strokeStyle = INK; c.lineWidth = 3; c.stroke(); c.strokeStyle = K.C('#c9a14a'); c.lineWidth = 1.6; c.stroke(); if (!K.o.fl) { c.fillStyle = '#c9a14a'; aCirc(c, 13, -23, 1.6); c.fill(); aCirc(c, 21, -23, 1.6); c.fill(); } },
    headAfter: (c, K) => { c.fillStyle = '#3a3a40'; c.fillRect(-15, K.HY - 16, 30, 4); },
    mid: (c, K) => { c.beginPath(); c.moveTo(-5, K.HY - 13); c.lineTo(-2, K.HY - 19); c.lineTo(4, K.HY - 19); c.lineTo(7, K.HY - 13); c.closePath(); aFI(c, K.C('#1c1c22'), 1.3); if (!K.o.fl) for (const [x, col] of [[-4, '#ff8a2a'], [0, '#ffffff'], [4, '#ff8a2a']]) { aCirc(c, x, 9.5, 2.2); c.fillStyle = col; c.fill(); c.strokeStyle = INK; c.lineWidth = .9; c.stroke(); } },
  },
  9: { // 獵師：毛皮帽、毛皮背心
    suit: '#6a5038', dk: '#3e2c1c', noFa: true, skin: '#f2c8a0',
    headBack: [{ path: (c, K) => { aEll(c, 0, K.HY - 9, 17, 10); }, fill: '#8a6a4a', after: (c, K) => { c.fillStyle = '#6a4a2e'; for (let i = -3; i <= 3; i++) { aCirc(c, i * 4.5, K.HY - 15 + Math.abs(i) * 1.2, 1.4); c.fill(); } } }],
    bodyAfter: (c, K, BT, BB, w) => { c.fillStyle = '#c8b090'; c.fillRect(-w - 2, BT, 5, BB - BT); },
    front: (c, K) => f2Bow(c, K, '#8a5a2a'),
  },
};
// 山 5：雪崩球（滾成雪球的小妖，頭上冒著引信）
FOE2_MOUNT[5] = { custom: (c, o) => {
  const C = F2W(o), t = o.t, rl = Math.sin(t * 3 + o.seed) * .15;
  c.save(); c.rotate(rl);
  // 樹枝手
  for (const s of [-1, 1]) { c.beginPath(); c.moveTo(s * 15, 2); c.lineTo(s * 23, -4 + Math.sin(t * 6 + s) * 2); c.moveTo(s * 20, -2); c.lineTo(s * 23, 2); c.strokeStyle = INK; c.lineWidth = 3.2; c.stroke(); c.strokeStyle = C('#7a5230'); c.lineWidth = 1.6; c.stroke(); }
  heroSilhouette(c, [{ path: c => { aCirc(c, 0, 3, 17); for (const [x, y, r] of [[-12, -8, 6], [10, -10, 6], [14, 10, 5], [-14, 12, 5]]) { c.moveTo(x + r, y + 3); c.arc(x, y + 3, r, 0, TAU); } }, fill: C('#f4f8fc'),
    after: o.fl ? null : c => { c.save(); aCirc(c, 0, 3, 17); c.clip(); f2Shade(c, '#ffffff', '#b8c8dc', 3, 17); c.fillStyle = 'rgba(160,190,220,.5)'; aCirc(c, -6, 12, 3); c.fill(); aCirc(c, 9, 0, 2); c.fill(); c.restore(); } }], 1.6);
  // 引信
  c.beginPath(); c.moveTo(0, -14); c.quadraticCurveTo(-3, -20, 1, -24); c.strokeStyle = C('#a07040'); c.lineWidth = 1.8; c.stroke();
  if (!o.fl) for (let i = 0; i < 5; i++) { const a = t * 20 + i * 1.26, r = 2 + (i % 2) * 2.4; c.fillStyle = i % 2 ? '#ffd25a' : '#ff6a1a'; c.fillRect(1 + Math.cos(a) * r - 1, -24 + Math.sin(a) * r - 1, 2, 2); }
  foeEye(c, -4, 2, 3.2, 4, null, o.warn, o.blink); foeEye(c, 6, 2, 3.4, 4.2, null, o.warn, o.blink);
  c.strokeStyle = INK; c.lineWidth = 1.8; c.beginPath(); c.moveTo(-8, -3.5); c.lineTo(-1, -1.8); c.moveTo(3, -1.8); c.lineTo(10, -3.5); c.stroke();
  if (o.near && !o.fl) { aEll(c, 13, -6, 1.5, 2.3); c.fillStyle = '#9ad8ff'; c.fill(); }
  c.restore();
} };
// 山 8：雪鴞（俯衝的白色貓頭鷹）
FOE2_MOUNT[8] = { custom: (c, o) => {
  const C = F2W(o), t = o.t, vx = o.e ? o.e.vx || 0 : 0, w = Math.sin(t * 9);
  c.save(); c.rotate(clamp(vx / 300, -.35, .35));
  for (const s of [-1, 1]) { c.save(); c.scale(s, 1); f2Wing(c, 8, 2, 20, w * .5, C('#eef2f8'), 4); if (!o.fl) { c.fillStyle = '#4a4e5a'; for (let i = 0; i < 3; i++) { aCirc(c, -2 - i * 4, -6 - w * 4 + i, .9); c.fill(); } } c.restore(); }
  heroSilhouette(c, [{ path: c => { aCirc(c, 0, 2, 14); c.moveTo(-10, -8); c.lineTo(-11, -15); c.lineTo(-5, -11); c.closePath(); c.moveTo(10, -8); c.lineTo(11, -15); c.lineTo(5, -11); c.closePath(); }, fill: C('#f6f8fc'),
    after: o.fl ? null : c => { c.save(); aCirc(c, 0, 2, 14); c.clip(); f2Shade(c, '#ffffff', '#c0cad8', 2, 14); c.fillStyle = '#4a4e5a'; for (const [x, y] of [[-6, 10], [0, 12], [6, 10], [-3, 7], [3, 7]]) { c.beginPath(); c.moveTo(x - 1.4, y); c.lineTo(x, y + 1.4); c.lineTo(x + 1.4, y); c.fill(); } c.restore(); } }], 1.5);
  foeEye(c, -4.5, -1, 3.6, 3.8, null, false, o.blink, o.fl ? null : '#ffc82a'); foeEye(c, 4.5, -1, 3.6, 3.8, null, false, o.blink, o.fl ? null : '#ffc82a');
  c.beginPath(); c.moveTo(-1.6, 2); c.lineTo(1.6, 2); c.lineTo(0, 5.5); c.closePath(); aFI(c, C('#3a3a40'), 1);
  c.restore();
} };
// 山 10：雪靈（冰藍色的魂，中心是雪花）
FOE2_MOUNT[10] = { custom: (c, o) => {
  const C = F2W(o), t = o.t, f = Math.sin(t * 10) * 3;
  const gl = c.createRadialGradient(0, 2, 2, 0, 2, 22); gl.addColorStop(0, o.fl ? 'rgba(255,255,255,.6)' : 'rgba(170,230,255,.55)'); gl.addColorStop(1, 'rgba(120,200,255,0)'); c.fillStyle = gl; aCirc(c, 0, 2, 22); c.fill();
  c.beginPath(); c.moveTo(-11, 5); c.quadraticCurveTo(-12, -6, -4 + f * .5, -12); c.quadraticCurveTo(-3, -6, f, -21); c.quadraticCurveTo(5, -9, 6 - f * .4, -13); c.quadraticCurveTo(12, -4, 11, 5); c.arc(0, 5, 11, 0, Math.PI); c.closePath(); aFI(c, C('#6ac8f0'), 1.8);
  c.beginPath(); c.moveTo(-6, 6); c.quadraticCurveTo(-6, -3, f * .6, -10); c.quadraticCurveTo(6, -3, 6, 6); c.arc(0, 6, 6, 0, Math.PI); c.closePath(); c.fillStyle = C('#d8f4ff'); c.fill();
  if (!o.fl) drawFlake(c, 0, -6, 3.2);
  foeEye(c, -3.2, 3.5, 2.6, 3.3, null, false, o.blink); foeEye(c, 3.6, 3.5, 2.6, 3.3, null, false, o.blink);
  if (!o.fl) { c.fillStyle = 'rgba(120,180,255,.5)'; aEll(c, -6.5, 7.5, 2, 1.1); c.fill(); aEll(c, 7, 7.5, 2, 1.1); c.fill(); }
  c.beginPath(); c.arc(.2, 9.5, 1.4, Math.PI + .3, -.3); c.strokeStyle = INK; c.lineWidth = 1; c.stroke();
} };
// 山 12：雪蓑蟲（吊在絲上、裹著松葉和雪）
FOE2_MOUNT[12] = { custom: (c, o) => {
  const C = F2W(o), t = o.t;
  c.strokeStyle = 'rgba(235,235,245,.75)'; c.lineWidth = 1; c.beginPath(); c.moveTo(0, -16); c.lineTo(0, -160); c.stroke();
  c.save(); c.rotate(Math.sin(t * 3) * .12);
  c.beginPath(); c.moveTo(0, -17); c.quadraticCurveTo(13, -12, 11, 4); c.quadraticCurveTo(8, 12, 0, 12); c.quadraticCurveTo(-8, 12, -11, 4); c.quadraticCurveTo(-13, -12, 0, -17); c.closePath(); aFI(c, C('#7a6a4a'), 1.8);
  if (!o.fl) {
    c.save(); c.clip(); c.strokeStyle = '#3e7a4a'; c.lineWidth = 1.4; for (let i = 0; i < 14; i++) { const y = -14 + i * 2, x = (i % 3 - 1) * 6; c.beginPath(); c.moveTo(x - 5, y); c.lineTo(x + 5, y + 3); c.stroke(); } c.restore();
    c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(-9, -9); c.quadraticCurveTo(0, -20, 9, -9); c.quadraticCurveTo(4, -6, 0, -8); c.quadraticCurveTo(-4, -6, -9, -9); c.fill(); aInk(c, 1.1);
  }
  // 從袋口探出的頭
  heroSilhouette(c, [{ path: c => aEll(c, 0, 13, 7.5, 6), fill: C('#c8d8a8') }], 1.4);
  foeEye(c, -2.6, 13, 2.2, 2.6, null, o.warn, o.blink); foeEye(c, 2.8, 13, 2.2, 2.6, null, o.warn, o.blink);
  c.restore();
} };


// 山 7：雷鳥群（白色圓滾滾的山雞；翅膀是圓弧形，身上不畫分隔線）
FOE2_MOUNT[7] = { custom: (c, o) => {
  const C = F2W(o), w = Math.sin(o.t * 15), dir = o.e && o.e.vx < 0 ? -1 : 1;
  c.save(); c.scale(dir, 1);
  c.save(); c.translate(-3, -2); c.rotate(-.9 - w * .5); aEll(c, 0, -6, 4.5, 8); aFI(c, C('#dde3ec'), 1.3); c.restore();   // 後翅
  c.beginPath(); c.moveTo(-9, 0); c.lineTo(-15, -2.5); c.quadraticCurveTo(-17, 1, -15, 4); c.closePath(); aFI(c, C('#2a2a30'), 1.2);   // 黑色尾羽
  heroSilhouette(c, [{ path: c => { aEll(c, -2, 2, 9, 7); c.moveTo(13, -2); c.arc(6, -2, 7, 0, TAU); }, fill: C('#f6f8fc'),
    after: o.fl ? null : c => { c.save(); c.clip(); c.fillStyle = 'rgba(180,192,210,.45)'; aEll(c, -2, 8, 9, 3.5); c.fill(); c.restore(); } }], 1.4);
  if (!o.fl) { c.fillStyle = '#e8463a'; c.beginPath(); c.moveTo(4, -7); c.quadraticCurveTo(7, -10.5, 10, -7); c.quadraticCurveTo(7, -6, 4, -7); c.fill(); }   // 紅色眉冠
  c.beginPath(); c.moveTo(12.5, -2.5); c.lineTo(15.5, -1.2); c.lineTo(12.5, .4); c.closePath(); aFI(c, C('#2a2a30'), 1);
  foeEye(c, 8.5, -3, 2.3, 2.7, null, false, o.blink);
  c.save(); c.translate(-3, 1); c.rotate(-.25 + w * .45); aEll(c, -3, 0, 6.5, 3.8); aFI(c, C('#e6ebf2'), 1.2); c.restore();   // 前翅（圓弧）
  c.restore();
} };

// ===== 中魔王候選：迦樓羅三款 =====
// 一層層的翅膀羽毛（右翅；左翅用鏡像）
function f2Feathers(c, C, w, cols, big = 1) {
  const lift = w * .12;
  for (let row = 0; row < 3; row++) {
    const n = 5 - row, len = (48 - row * 13) * big;
    for (let i = n - 1; i >= 0; i--) {
      const a = -1.05 + i * .34 + lift - row * .06;
      c.save(); c.translate(12, 6 + row * 3); c.rotate(a);
      c.beginPath(); c.moveTo(0, -3); c.quadraticCurveTo(len * .55, -7 + row, len, -1); c.quadraticCurveTo(len * .6, 6 - row, 0, 4); c.closePath();
      aFI(c, C(cols[row]), 1.4);
      c.restore();
    }
  }
}
// 共用的迦樓羅身體：P = 顏色與裝飾設定
function f2Karura(c, o, P) {
  const C = F2W(o), t = o.t, w = Math.sin(t * 5), hb = Math.sin(t * 3) * 2;
  if (!o.fl && P.halo) P.halo(c, t);
  for (const s of [-1, 1]) { c.save(); c.scale(s, 1); f2Feathers(c, C, w, P.wings, P.wingBig || 1); c.restore(); }
  if (P.tail) P.tail(c, C, t);
  const parts = [
    { path: c => aEll(c, -9, 42, 7, 4.5), fill: C(P.claw) }, { path: c => aEll(c, 9, 42, 7, 4.5), fill: C(P.claw) },
    { path: c => { c.beginPath(); c.moveTo(-16, 16); c.quadraticCurveTo(0, 10, 16, 16); c.quadraticCurveTo(19, 30, 11, 38); c.quadraticCurveTo(0, 42, -11, 38); c.quadraticCurveTo(-19, 30, -16, 16); c.closePath(); }, fill: C(P.body),
      after: o.fl ? null : c => { c.save(); c.clip(); P.bodyDeco(c); c.restore(); } },
  ];
  if (P.crestBack) parts.push({ path: c => P.crestBack(c, t), fill: C(P.crestCol) });
  parts.push({ path: c => aCirc(c, 0, -6, 22), fill: C(P.head), after: o.fl ? null : c => { c.save(); aCirc(c, 0, -6, 22); c.clip(); f2Shade(c, P.head, P.headDk, -6, 22); if (P.headDeco) P.headDeco(c); c.restore(); } });
  parts.push({ path: c => aCirc(c, -24, 22 + hb, 6.5), fill: C(P.hand) }, { path: c => aCirc(c, 24, 22 - hb, 6.5), fill: C(P.hand) });
  heroSilhouette(c, parts, 2);
  if (P.crestFront) P.crestFront(c, C, t);
  // 眼睛（金色發光）＋眉
  foeEye(c, -8, -7, 5, 5.8, null, o.warn, o.blink, o.fl ? null : P.eye); foeEye(c, 8, -7, 5, 5.8, null, o.warn, o.blink, o.fl ? null : P.eye);
  c.strokeStyle = o.fl ? INK : (P.brow || INK); c.lineWidth = 3; c.lineCap = 'round'; c.beginPath(); c.moveTo(-15, -15); c.lineTo(-3, -12); c.moveTo(3, -12); c.lineTo(15, -15); c.stroke();
  // 正面的勾嘴（往下彎）
  c.beginPath(); c.moveTo(-7, 0); c.quadraticCurveTo(0, -3, 7, 0); c.quadraticCurveTo(6, 8, 1.5, 13); c.quadraticCurveTo(0, 15, -1.5, 13); c.quadraticCurveTo(-6, 8, -7, 0); c.closePath(); aFI(c, C(P.beak), 1.8);
  if (!o.fl) { c.fillStyle = 'rgba(255,255,255,.45)'; aEll(c, -2.5, 3, 1.6, 3); c.fill(); c.fillStyle = INK; aEll(c, -2.4, 1.5, .9, .6); c.fill(); aEll(c, 2.4, 1.5, .9, .6); c.fill(); }
}
const FOE2_KARURA = {
  // A 金翅鳥王：金色鳥頭、紅色三根冠羽、金紅翅膀、紅色鎧甲
  A: (c, o) => f2Karura(c, o, {
    head: '#f2c040', headDk: '#c08a10', beak: '#ff7a2a', eye: '#ff5a2a', hand: '#f2c040', claw: '#c08a10', body: '#c8322a', crestCol: '#e8463a',
    wings: ['#e8463a', '#f29a2a', '#f2d050'],
    halo: (c, t) => { const gl = c.createRadialGradient(0, -6, 20, 0, -6, 52); gl.addColorStop(0, 'rgba(255,220,120,.5)'); gl.addColorStop(1, 'rgba(255,200,80,0)'); c.fillStyle = gl; aCirc(c, 0, -6, 52); c.fill(); },
    crestBack: (c, t) => { c.beginPath(); for (const [x, a] of [[-8, -.35], [0, 0], [8, .35]]) { const sw = Math.sin(t * 4 + x) * .08; c.save(); c.translate(x, -24); c.rotate(a + sw); c.moveTo(-3.5, 2); c.quadraticCurveTo(-5, -14, 0, -22); c.quadraticCurveTo(5, -14, 3.5, 2); c.closePath(); c.restore(); } },
    headDeco: c => { c.fillStyle = 'rgba(255,255,255,.35)'; aEll(c, 0, 4, 12, 6); c.fill(); },
    bodyDeco: c => { c.fillStyle = '#f2c14e'; c.fillRect(-20, 26, 40, 3.5); c.fillRect(-1.5, 12, 3, 30); c.fillStyle = '#ffe28a'; aCirc(c, 0, 20, 3.4); c.fill(); },
  }),
  // B 迦樓羅面（伎樂面）：綠色鳥頭、紅色火焰冠、青綠翅膀鑲金、深藍鎧甲、背後金色法輪
  B: (c, o) => f2Karura(c, o, {
    head: '#3aa070', headDk: '#1e6a48', beak: '#f2c14e', eye: '#ffd27a', hand: '#3aa070', claw: '#c9a14a', body: '#24305a', crestCol: '#d8323c', brow: '#0e2a1e',
    wings: ['#1e7a74', '#2aa0a0', '#e8c060'],
    halo: (c, t) => { c.save(); c.translate(0, -6); c.rotate(t * .4); c.strokeStyle = '#e8c060'; c.lineWidth = 3; aCirc(c, 0, 0, 34); c.stroke(); c.lineWidth = 1.5; aCirc(c, 0, 0, 29); c.stroke(); for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; c.fillStyle = '#e8c060'; c.beginPath(); c.moveTo(Math.cos(a) * 34, Math.sin(a) * 34); c.lineTo(Math.cos(a + .1) * 41, Math.sin(a + .1) * 41); c.lineTo(Math.cos(a - .1) * 41, Math.sin(a - .1) * 41); c.fill(); } c.restore(); },
    crestBack: (c, t) => { c.beginPath(); c.moveTo(-12, -22); for (let i = 0; i <= 4; i++) { const x = -12 + i * 6, f = Math.sin(t * 8 + i) * 1.5; c.quadraticCurveTo(x - 1, -36 - (i % 2 ? 0 : 6) + f, x + 3, -26); } c.lineTo(12, -22); c.closePath(); },
    headDeco: c => { c.strokeStyle = '#1e6a48'; c.lineWidth = 1.4; for (const s of [-1, 1]) { c.beginPath(); c.moveTo(s * 18, -4); c.quadraticCurveTo(s * 12, 2, s * 15, 8); c.stroke(); } c.fillStyle = '#d8323c'; aEll(c, 0, -22, 4, 2.4); c.fill(); },
    bodyDeco: c => { c.fillStyle = '#e8c060'; for (let i = 0; i < 4; i++) c.fillRect(-20, 18 + i * 5, 40, 1.2); c.fillStyle = '#d8323c'; c.fillRect(-20, 33, 40, 4); },
  }),
  // C 火焰大鵬：紅橘色、火焰冠與火焰翅膀、背後一圈火焰
  C: (c, o) => f2Karura(c, o, {
    head: '#ea4a2a', headDk: '#a8240e', beak: '#ffd25a', eye: '#fff2a0', hand: '#ea4a2a', claw: '#8a2a10', body: '#f28a2a', crestCol: '#ffb02a', wingBig: 1.05,
    wings: ['#d8321a', '#f2701a', '#ffc040'],
    halo: (c, t) => { for (let i = 0; i < 16; i++) { const a = i / 16 * TAU + t * .5; f2Flame(c, Math.cos(a) * 34, -6 + Math.sin(a) * 34 + 6, 1, t + i, false); } },
    tail: (c, C, t) => { for (const s of [-1, 0, 1]) f2Flame(c, s * 9, 46, 1.2, t + s, false); },
    crestBack: (c, t) => { c.beginPath(); for (const [x, h] of [[-10, 14], [-3, 22], [4, 18], [11, 12]]) { const f = Math.sin(t * 10 + x) * 2; c.moveTo(x - 5, -20); c.quadraticCurveTo(x - 4, -20 - h * .6, x + f, -20 - h); c.quadraticCurveTo(x + 4, -20 - h * .6, x + 5, -20); c.closePath(); } },
    crestFront: (c, C, t) => { if (C('#000') === '#fff') return; c.fillStyle = 'rgba(255,240,150,.85)'; for (const [x, h] of [[-3, 14], [4, 11]]) { c.beginPath(); c.moveTo(x - 2.5, -22); c.quadraticCurveTo(x, -22 - h, x + 2.5, -22); c.fill(); } },
    headDeco: c => { c.fillStyle = '#ffb02a'; aEll(c, 0, 6, 13, 7); c.fill(); },
    bodyDeco: c => { c.fillStyle = '#ffe08a'; aEll(c, 0, 30, 10, 9); c.fill(); c.fillStyle = '#c8321a'; c.fillRect(-20, 20, 40, 3); },
  }),
};

// ===== 中魔王候選：狒狒（灰白長毛雪怪）三款 =====
// 毛茸茸的鋸齒輪廓
function f2Shag(c, cx, cy, rx, ry, n, amp, ph = 0) {
  c.beginPath();
  for (let i = 0; i <= n * 2; i++) { const a = i / (n * 2) * TAU + ph, r = i % 2 ? 1 : 1 + amp; c.lineTo(cx + Math.cos(a) * rx * r, cy + Math.sin(a) * ry * r); }
  c.closePath();
}
function f2Hihi(c, o, P) {
  const C = F2W(o), t = o.t, hb = Math.sin(t * 3) * 2, br = Math.sin(t * 2.4) * .8;
  if (!o.fl && P.aura) P.aura(c, t);
  heroSilhouette(c, [
    { path: c => aEll(c, -12, 44, 9, 5.5), fill: C(P.skinDk) }, { path: c => aEll(c, 12, 44, 9, 5.5), fill: C(P.skinDk) },
    { path: c => f2Shag(c, 0, 24, 24, 20, 14, .12), fill: C(P.body), after: o.fl ? null : c => { c.save(); c.clip(); f2Shade(c, P.body, P.bodyDk, 24, 26); c.fillStyle = P.belly; aEll(c, 0, 30, 11, 10); c.fill(); c.restore(); } },
    { path: c => f2Shag(c, 0, -6 + br, P.maneR, P.maneR * .95, 16, .16, .1), fill: C(P.mane), after: o.fl ? null : c => { c.save(); c.clip(); f2Shade(c, P.mane, P.maneDk, -6, P.maneR); c.restore(); } },
    { path: c => { c.beginPath(); c.ellipse(0, -4, 14.5, 16.5, 0, 0, TAU); }, fill: C(P.face), after: o.fl ? null : c => { c.save(); c.clip(); f2Shade(c, P.face, P.faceDk, -4, 17); c.restore(); } },
    { path: c => f2Shag(c, -30, 22 + hb, 9, 9, 7, .14), fill: C(P.hand) }, { path: c => f2Shag(c, 30, 22 - hb, 9, 9, 7, .14), fill: C(P.hand) },
  ], 2);
  if (P.decoBack && !o.fl) P.decoBack(c, t);
  // 突出的眉骨＋深陷的眼睛
  c.beginPath(); c.moveTo(-14, -12); c.quadraticCurveTo(-7, -17, 0, -12.5); c.quadraticCurveTo(7, -17, 14, -12); c.quadraticCurveTo(7, -13, 0, -10); c.quadraticCurveTo(-7, -13, -14, -12); c.closePath(); aFI(c, C(P.brow), 1.4);
  foeEye(c, -6.5, -7, 3.8, 3.6, null, o.warn, o.blink, o.fl ? null : P.eye); foeEye(c, 6.5, -7, 3.8, 3.6, null, o.warn, o.blink, o.fl ? null : P.eye);
  // 狒狒的長吻：從兩眼之間往下延伸，前端是鼻孔
  c.beginPath(); c.moveTo(-4, -6); c.quadraticCurveTo(-9, 4, -8.5, 10); c.quadraticCurveTo(-8, 15, 0, 15.5); c.quadraticCurveTo(8, 15, 8.5, 10); c.quadraticCurveTo(9, 4, 4, -6); c.closePath(); aFI(c, C(P.muzzle), 1.6);
  if (!o.fl) {
    if (P.ridge) { c.strokeStyle = P.ridge; c.lineWidth = 1.2; for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(s * (4.5 + i * 1.4), -2 + i * 2.5); c.lineTo(s * (5.5 + i * 1.4), 6 + i * 1.5); c.stroke(); } }
    c.fillStyle = P.nose; aEll(c, 0, 12, 6, 3); c.fill();
    c.fillStyle = INK; aEll(c, -2.4, 12, 1.4, 1); c.fill(); aEll(c, 2.4, 12, 1.4, 1); c.fill();
  }
  // 嘴巴與獠牙
  c.beginPath(); c.moveTo(-8, 18); c.quadraticCurveTo(0, o.warn ? 26 : 22, 8, 18); c.quadraticCurveTo(0, 20, -8, 18); aFI(c, C('#3a1418'), 1.4);
  if (!o.fl) { c.fillStyle = '#fff'; for (const s of [-1, 1]) { c.beginPath(); c.moveTo(s * 6, 18.6); c.lineTo(s * 5, 23); c.lineTo(s * 3.6, 19.4); c.fill(); } }
  if (P.decoFront && !o.fl) P.decoFront(c, t);
}
const FOE2_HIHI = {
  // A 灰白長毛雪怪：全身灰白長毛、深灰色長臉、琥珀色眼睛
  A: (c, o) => f2Hihi(c, o, {
    body: '#d4d8de', bodyDk: '#8e96a2', belly: '#bcc2cc', mane: '#e6e9ee', maneDk: '#9aa2ae', maneR: 32, hand: '#c8cdd4', skinDk: '#6a6e78',
    face: '#7a7e8a', faceDk: '#4a4e58', brow: '#5a5e68', muzzle: '#8a8e98', nose: '#5a5e68', eye: '#ffb02a',
  }),
  // B 銀鬃狒狒：大片銀色鬃毛、灰色身體、粉紅色的臉、紅色鼻樑
  B: (c, o) => f2Hihi(c, o, {
    body: '#9aa0aa', bodyDk: '#5e646e', belly: '#c4c8d0', mane: '#f2f4f8', maneDk: '#a8b0bc', maneR: 38, hand: '#8a909a', skinDk: '#4a4e58',
    face: '#e0a090', faceDk: '#b06a5a', brow: '#a85a4a', muzzle: '#eab4a4', nose: '#d8423a', eye: '#ffe24a', ridge: '#c87060',
    decoBack: (c, t) => { c.fillStyle = 'rgba(255,255,255,.55)'; for (let i = 0; i < 9; i++) { const a = Math.PI * 1.1 + i * .12; c.beginPath(); c.moveTo(Math.cos(a) * 26, -6 + Math.sin(a) * 26); c.lineTo(Math.cos(a) * 36, -6 + Math.sin(a) * 36); c.lineTo(Math.cos(a + .05) * 28, -6 + Math.sin(a + .05) * 28); c.fill(); } },
  }),
  // C 冰霜狒狒：帶藍的白毛、掛著冰柱、藍灰色臉、冰藍色眼睛、吐出寒氣
  C: (c, o) => f2Hihi(c, o, {
    body: '#dce8f2', bodyDk: '#8aa4bc', belly: '#c4d6e6', mane: '#eef6fc', maneDk: '#9ab8d0', maneR: 34, hand: '#ccdcea', skinDk: '#5a7088',
    face: '#7a90aa', faceDk: '#4a5e78', brow: '#4a5e78', muzzle: '#8ea4bc', nose: '#4a5e78', eye: '#8ae8ff',
    aura: (c, t) => { for (let i = 0; i < 10; i++) { const a = t * .8 + i / 10 * TAU, r = 50 + Math.sin(t * 2 + i) * 4; drawFlake(c, Math.cos(a) * r, Math.sin(a) * r * .7, 3.5); } },
    decoFront: (c, t) => {
      c.fillStyle = '#d8f4ff'; c.strokeStyle = INK; c.lineWidth = 1.2;
      for (const [x, y, h] of [[-26, 14, 9], [-18, 22, 7], [20, 21, 8], [27, 13, 10], [-8, 40, 6], [9, 40, 7], [-34, 30, 6], [34, 30, 6]]) { c.beginPath(); c.moveTo(x - 2.4, y); c.lineTo(x + 2.4, y); c.lineTo(x, y + h); c.closePath(); c.fill(); c.stroke(); }
      for (let i = 0; i < 3; i++) { const p = (t * .8 + i / 3) % 1; c.fillStyle = `rgba(220,245,255,${.7 * (1 - p)})`; aCirc(c, Math.sin(t * 3 + i) * 3, 26 + p * 14, 3 + p * 4); c.fill(); }
    },
  }),
};
// ===== 中魔王候選（第二輪）：鬼怪形體的迦樓羅，造型簡化 =====
// 和魔王一樣是圓滾滾的鬼身體（頭身一體），加上鳥嘴、短角、簡單的翅膀；P＝顏色與少量裝飾
function f2KaruraOni(c, o, P) {
  const C = F2W(o), t = o.t, w = Math.sin(t * 4), hb = Math.sin(t * 3.2) * 2.5, br = 1 + Math.sin(t * 3) * .03;
  // 翅膀：每邊三片大羽毛（扁平、少細節）
  for (const s of [-1, 1]) {
    c.save(); c.scale(s, 1); c.translate(24, -4); c.rotate(-w * .12);
    for (let i = 2; i >= 0; i--) { c.save(); c.rotate(-.75 + i * .42); c.beginPath(); c.moveTo(0, -6); c.quadraticCurveTo(28, -11, 46 - i * 5, 0); c.quadraticCurveTo(26, 9, 0, 6); c.closePath(); aFI(c, C(i === 1 ? P.wing2 : P.wing), 1.8); c.restore(); }
    c.restore();
  }
  // 腳、身體（圓）、浮空的拳頭
  for (const s of [-1, 1]) { aEll(c, s * 13, 35, 10, 6); aFI(c, C(P.dk), 2); }
  c.save(); c.scale(br, 2 - br);
  aCirc(c, 0, 0, 30); if (o.fl) c.fillStyle = '#fff'; else { const bg = c.createRadialGradient(-9, -10, 4, 0, 0, 32); bg.addColorStop(0, P.body); bg.addColorStop(1, P.dk); c.fillStyle = bg; } c.fill(); aInk(c, 2.2);
  c.restore();
  if (!o.fl) { c.save(); aCirc(c, 0, 0, 30); c.clip(); c.fillStyle = P.belt; c.fillRect(-32, 20, 64, 11); if (P.beltDeco) P.beltDeco(c); c.restore(); }
  for (const [x, y] of [[-36, 10 + hb], [36, 10 - hb]]) { aCirc(c, x, y, 8.5); aFI(c, C(P.dk), 2); }
  // 頭頂：短角＋冠
  if (P.crest) P.crest(c, C, t);
  for (const s of [-1, 1]) { c.beginPath(); c.moveTo(s * 9, -24); c.quadraticCurveTo(s * 17, -32, s * 16, -40); c.quadraticCurveTo(s * 12, -30, s * 2, -27); c.closePath(); aFI(c, C(P.horn), 1.8); }
  // 眉毛與發光的眼睛
  c.fillStyle = INK; for (const s of [-1, 1]) { c.beginPath(); c.moveTo(s * 22, -13); c.lineTo(s * 5, -7); c.lineTo(s * 6, -4); c.lineTo(s * 22, -9); c.closePath(); c.fill(); }
  for (const s of [-1, 1]) { c.fillStyle = o.fl ? '#fff' : P.eye; c.beginPath(); c.moveTo(s * 19, -4); c.lineTo(s * 6, -1); c.lineTo(s * 17, 4); c.closePath(); c.fill(); aInk(c, 1.4); c.fillStyle = INK; aCirc(c, s * 12, 0, 1.9); c.fill(); }
  // 鳥嘴（往下勾，張開時露出舌頭）
  const open = o.warn ? 4 : 0;
  c.beginPath(); c.moveTo(-6, 9 + open); c.quadraticCurveTo(0, 13 + open * 2, 6, 9 + open); c.quadraticCurveTo(3, 15 + open, 0, 15 + open * 1.5); c.quadraticCurveTo(-3, 15 + open, -6, 9 + open); c.closePath(); aFI(c, C(P.beakDk), 1.6);   // 下嘴
  c.beginPath(); c.moveTo(-9, 5); c.quadraticCurveTo(0, 1, 9, 5); c.quadraticCurveTo(7, 12, 0, 19); c.quadraticCurveTo(-7, 12, -9, 5); c.closePath(); aFI(c, C(P.beak), 1.8);   // 上嘴
  if (!o.fl) { c.fillStyle = 'rgba(255,255,255,.45)'; aEll(c, -3, 7, 1.8, 2.6, -.3); c.fill(); }
  if (P.extra && !o.fl) P.extra(c, t);
}
const FOE2_KARURA2 = {
  // A 金翼鬼：金黃色鬼身體、紅色鳥嘴、紅白翅膀、虎皮腰帶
  A: (c, o) => f2KaruraOni(c, o, { body: '#f2b830', dk: '#b8760e', horn: '#fff2d0', eye: '#ffffff', beak: '#e8463a', beakDk: '#a82a20', wing: '#e8463a', wing2: '#fff2d0', belt: '#f4ead0',
    beltDeco: c => { c.fillStyle = INK; for (let i = -4; i <= 4; i++) { c.beginPath(); c.moveTo(i * 8 - 2, 20); c.lineTo(i * 8 + 2, 26); c.lineTo(i * 8, 20); c.fill(); } },
    crest: (c, C, t) => { c.beginPath(); c.moveTo(-4, -27); c.quadraticCurveTo(-2, -42 + Math.sin(t * 5) * 2, 4, -46); c.quadraticCurveTo(2, -36, 5, -28); c.closePath(); aFI(c, C('#e8463a'), 1.6); } }),
  // B 青嵐鬼：青綠色鬼身體、金色鳥嘴、深藍翅膀、紅色火焰冠
  B: (c, o) => f2KaruraOni(c, o, { body: '#3aa88a', dk: '#1e6a56', horn: '#f5e6b8', eye: '#ffe24a', beak: '#f2c14e', beakDk: '#b8862a', wing: '#24406e', wing2: '#4a7ab8', belt: '#c0262d',
    beltDeco: c => { c.fillStyle = '#f2c14e'; c.fillRect(-32, 24, 64, 2); },
    crest: (c, C, t) => { c.beginPath(); c.moveTo(-10, -26); for (let i = 0; i < 3; i++) { const x = -10 + i * 10, f = Math.sin(t * 8 + i) * 1.5; c.quadraticCurveTo(x - 2, -38 - (i === 1 ? 6 : 0) + f, x + 5, -27); } c.lineTo(10, -24); c.closePath(); aFI(c, C('#e8463a'), 1.6); } }),
  // C 嵐鬼（風神風）：紫灰色鬼身體、背著風袋當翅膀、黃色鳥嘴、白色亂髮
  C: (c, o) => f2KaruraOni(c, o, { body: '#8a6ac8', dk: '#55398f', horn: '#f0e0ff', eye: '#ffe24a', beak: '#f2c14e', beakDk: '#b8862a', wing: '#f0f0f6', wing2: '#c8c8d8', belt: '#f2c14e',
    beltDeco: c => { c.fillStyle = INK; for (let i = -4; i <= 4; i++) { c.beginPath(); c.moveTo(i * 8 - 2, 20); c.lineTo(i * 8 + 2, 26); c.lineTo(i * 8, 20); c.fill(); } },
    crest: (c, C, t) => { c.beginPath(); for (let i = -3; i <= 3; i++) { const f = Math.sin(t * 6 + i) * 1.5; c.moveTo(i * 6 - 4, -24); c.lineTo(i * 7 + f, -34 - Math.abs(Math.cos(i)) * 5); c.lineTo(i * 6 + 4, -24); } aFI(c, C('#f4f6fa'), 1.4); },
    extra: (c, t) => { c.strokeStyle = 'rgba(230,240,255,.85)'; c.lineWidth = 2; for (let i = 0; i < 3; i++) { const p = (t * 1.2 + i / 3) % 1; c.beginPath(); c.arc(0, 0, 40 + p * 10, -1 + p, -0.2 + p); c.stroke(); c.beginPath(); c.arc(0, 0, 40 + p * 10, Math.PI + .2 - p, Math.PI + 1 - p); c.stroke(); } } }),
};
// ===== 中魔王候選（第三輪）：火鳳凰（全身鳥形） =====
// 大翅膀：一片片長羽毛排成扇形（右翅；左翅鏡像），cols＝由外到內的顏色
function f2PhxWing(c, C, w, cols, n, len, up) {
  for (let i = n - 1; i >= 0; i--) {
    const a = -up + i * (up + .35) / (n - 1) - w * .18, L = len * (1 - i * .07);
    c.save(); c.translate(10, -2); c.rotate(a);
    c.beginPath(); c.moveTo(0, -4); c.quadraticCurveTo(L * .6, -9, L, -2); c.quadraticCurveTo(L * .6, 6, 0, 5); c.closePath(); aFI(c, C(cols[i % cols.length]), 1.6);
    c.restore();
  }
}
// 尾羽：從身體下方往外散開的長羽毛，尾端可加圓形花紋（eye＝花紋顏色）
function f2PhxTail(c, C, t, cols, n, len, spread, eye) {
  for (let i = 0; i < n; i++) {
    const k = n === 1 ? 0 : i / (n - 1) - .5, a = k * spread + Math.sin(t * 2.5 + i) * .05;
    c.save(); c.translate(0, 18); c.rotate(a);
    c.beginPath(); c.moveTo(-3, 0); c.quadraticCurveTo(-9, len * .55, -2, len); c.quadraticCurveTo(0, len + 6, 2, len); c.quadraticCurveTo(9, len * .55, 3, 0); c.closePath(); aFI(c, C(cols[i % cols.length]), 1.5);
    if (eye && C('#000') !== '#fff') { aEll(c, 0, len - 6, 4, 5); c.fillStyle = eye[0]; c.fill(); aEll(c, 0, len - 6, 2, 2.6); c.fillStyle = eye[1]; c.fill(); }
    c.restore();
  }
}
const FOE2_PHOENIX = {
  // A 朱雀雛鳳：圓滾滾的紅色身體（頭身一體）、三根火焰冠羽、三條火焰長尾、金色小嘴
  A: (c, o) => {
    const C = F2W(o), t = o.t, w = Math.sin(t * 4);
    if (!o.fl) { const gl = c.createRadialGradient(0, 0, 18, 0, 0, 58); gl.addColorStop(0, 'rgba(255,170,60,.45)'); gl.addColorStop(1, 'rgba(255,120,40,0)'); c.fillStyle = gl; aCirc(c, 0, 0, 58); c.fill(); }
    f2PhxTail(c, C, t, ['#e8401a', '#ff8a1a', '#e8401a'], 3, 38, .9);
    for (const s of [-1, 1]) { c.save(); c.scale(s, 1); f2PhxWing(c, C, w, ['#ffb02a', '#ff7a1a', '#e8401a'], 5, 40, 1.1); c.restore(); }
    heroSilhouette(c, [{ path: c => aCirc(c, 0, 0, 27), fill: C('#e8401a'), after: o.fl ? null : c => { c.save(); aCirc(c, 0, 0, 27); c.clip(); f2Shade(c, '#ff5a2a', '#a8200a', 0, 27); c.fillStyle = '#ffc860'; aEll(c, 0, 16, 17, 13); c.fill(); c.restore(); } }], 2);
    for (const [x, h] of [[-8, 16], [0, 22], [8, 16]]) f2Flame(c, x, -24, h / 16, t + x, o.fl);
    foeEye(c, -9, -5, 5, 6, null, o.warn, o.blink, o.fl ? null : '#ffd25a'); foeEye(c, 9, -5, 5, 6, null, o.warn, o.blink, o.fl ? null : '#ffd25a');
    c.strokeStyle = INK; c.lineWidth = 2.6; c.lineCap = 'round'; c.beginPath(); c.moveTo(-16, -14); c.lineTo(-4, -11); c.moveTo(4, -11); c.lineTo(16, -14); c.stroke();
    c.beginPath(); c.moveTo(-5, 4); c.quadraticCurveTo(0, 2, 5, 4); c.lineTo(0, 11); c.closePath(); aFI(c, C('#ffd25a'), 1.6);
    if (!o.fl) { c.fillStyle = 'rgba(255,120,150,.5)'; aEll(c, -17, 5, 3.4, 1.8); c.fill(); aEll(c, 17, 5, 3.4, 1.8); c.fill(); }
  },
  // B 鳳凰：小頭大身體的鳥形，頭上三根帶珠的冠羽，孔雀般展開的長尾（尾端花紋），金紅雙色翅膀
  B: (c, o) => {
    const C = F2W(o), t = o.t, w = Math.sin(t * 4);
    f2PhxTail(c, C, t, ['#c8281a', '#f26a1a', '#e8a020', '#f26a1a', '#c8281a'], 7, 46, 2.2, ['#ffd25a', '#2a8a7a']);
    for (const s of [-1, 1]) { c.save(); c.scale(s, 1); f2PhxWing(c, C, w, ['#f2b830', '#e8401a', '#f2b830', '#e8401a'], 6, 44, 1.25); c.restore(); }
    heroSilhouette(c, [
      { path: c => aEll(c, 0, 14, 17, 15), fill: C('#d8321a'), after: o.fl ? null : c => { c.save(); aEll(c, 0, 14, 17, 15); c.clip(); f2Shade(c, '#ea4a2a', '#9a1e0e', 14, 17); c.fillStyle = '#ffd27a'; aEll(c, 0, 20, 9, 10); c.fill(); c.restore(); } },
      { path: c => aCirc(c, 0, -10, 17), fill: C('#e8401a'), after: o.fl ? null : c => { c.save(); aCirc(c, 0, -10, 17); c.clip(); f2Shade(c, '#ff5a2a', '#a8200a', -10, 17); c.restore(); } },
    ], 2);
    for (const [a, l] of [[-.45, 16], [0, 20], [.45, 16]]) { c.save(); c.translate(0, -25); c.rotate(a + Math.sin(t * 3 + a) * .06); c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -l); c.strokeStyle = INK; c.lineWidth = 3; c.stroke(); c.strokeStyle = C('#f2b830'); c.lineWidth = 1.5; c.stroke(); aCirc(c, 0, -l - 2.5, 3.2); aFI(c, C('#ffd25a'), 1.3); c.restore(); }
    foeEye(c, -6.5, -10, 3.8, 4.6, null, o.warn, o.blink, o.fl ? null : '#ffe24a'); foeEye(c, 6.5, -10, 3.8, 4.6, null, o.warn, o.blink, o.fl ? null : '#ffe24a');
    c.strokeStyle = INK; c.lineWidth = 2.2; c.lineCap = 'round'; c.beginPath(); c.moveTo(-12, -17); c.lineTo(-3, -15); c.moveTo(3, -15); c.lineTo(12, -17); c.stroke();
    c.beginPath(); c.moveTo(-4.5, -3); c.quadraticCurveTo(0, -5, 4.5, -3); c.quadraticCurveTo(3, 3, 0, 6); c.quadraticCurveTo(-3, 3, -4.5, -3); c.closePath(); aFI(c, C('#ffd25a'), 1.5);
  },
  // C 不死鳥：整隻由火焰構成，外紅內黃的漸層，翅膀和尾巴都是火舌，白熱的眼睛
  C: (c, o) => {
    const C = F2W(o), t = o.t, w = Math.sin(t * 4);
    if (!o.fl) for (let i = 0; i < 12; i++) { const a = i / 12 * TAU + t * .6; f2Flame(c, Math.cos(a) * 40, Math.sin(a) * 36 + 8, .9, t + i, false); }
    for (const s of [-1, 1]) {
      c.save(); c.scale(s, 1);
      for (let i = 0; i < 4; i++) { const a = -1 + i * .4 - w * .15, L = 46 - i * 5, f = Math.sin(t * 9 + i) * 3; c.save(); c.translate(10, 0); c.rotate(a); c.beginPath(); c.moveTo(0, -5); c.quadraticCurveTo(L * .5, -12 + f, L, f * .5); c.quadraticCurveTo(L * .6, 4, L * .45, 3); c.quadraticCurveTo(L * .3, 8, 0, 5); c.closePath(); aFI(c, C(['#ff4a1a', '#ff7a1a', '#ffa02a', '#ffc040'][i]), 1.6); c.restore(); }
      c.restore();
    }
    for (let i = -2; i <= 2; i++) { const f = Math.sin(t * 8 + i) * 4; c.beginPath(); c.moveTo(i * 5 - 5, 18); c.quadraticCurveTo(i * 10, 38, i * 14 + f, 54 - Math.abs(i) * 6); c.quadraticCurveTo(i * 7, 36, i * 5 + 5, 18); c.closePath(); aFI(c, C(Math.abs(i) % 2 ? '#ff7a1a' : '#ff4a1a'), 1.5); }
    heroSilhouette(c, [{ path: c => { c.beginPath(); c.moveTo(-22, 8); c.quadraticCurveTo(-26, -22, -8, -28); c.quadraticCurveTo(-6, -38 + Math.sin(t * 9) * 3, 0, -44); c.quadraticCurveTo(4, -36, 8, -30); c.quadraticCurveTo(14, -38 + Math.sin(t * 7) * 3, 18, -34); c.quadraticCurveTo(26, -18, 22, 8); c.quadraticCurveTo(14, 26, 0, 26); c.quadraticCurveTo(-14, 26, -22, 8); c.closePath(); }, fill: C('#ff4a1a'),
      after: o.fl ? null : c => { c.save(); c.clip(); const gr = c.createRadialGradient(0, 4, 4, 0, 0, 34); gr.addColorStop(0, '#fff2a0'); gr.addColorStop(.45, '#ffb02a'); gr.addColorStop(1, '#e8301a'); c.fillStyle = gr; c.fillRect(-30, -46, 60, 76); c.restore(); } }], 2);
    for (const s of [-1, 1]) { c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(s * 15, -10); c.lineTo(s * 4, -6); c.lineTo(s * 13, -3); c.closePath(); c.fill(); aInk(c, 1.6); c.fillStyle = INK; aCirc(c, s * 9.5, -6.5, 1.8); c.fill(); }
    c.strokeStyle = INK; c.lineWidth = 2.6; c.lineCap = 'round'; c.beginPath(); c.moveTo(-16, -15); c.lineTo(-4, -10); c.moveTo(4, -10); c.lineTo(16, -15); c.stroke();
    c.beginPath(); c.moveTo(-4.5, 0); c.quadraticCurveTo(0, -2, 4.5, 0); c.quadraticCurveTo(2.5, 6, 0, 9); c.quadraticCurveTo(-2.5, 6, -4.5, 0); c.closePath(); aFI(c, C('#8a2a10'), 1.4);
  },
};
// ===== 火鳳凰 B 細緻化（三款） =====
// 有羽軸、金邊的翅膀羽毛；flame＝羽尖變成火舌
function f2PhxWingB(c, C, t, w, opt) {
  const n = 6, up = 1.25, cols = ['#f2b830', '#e8401a', '#f2b830', '#e8401a', '#f2b830', '#e8401a'];
  for (let layer = 0; layer < 2; layer++) {   // 0＝外層長羽、1＝內層短羽（覆羽）
    const len = layer ? 26 : 46;
    for (let i = n - 1; i >= 0; i--) {
      const a = -up + i * (up + .35) / (n - 1) - w * .18 + layer * .08, L = len * (1 - i * .06);
      c.save(); c.translate(10, -2); c.rotate(a);
      c.beginPath(); c.moveTo(0, -4); c.quadraticCurveTo(L * .6, -9, L, -2); c.quadraticCurveTo(L * .6, 6, 0, 5); c.closePath();
      aFI(c, C(layer ? (i % 2 ? '#ff7a2a' : '#ffc040') : cols[i]), 1.5);
      if (C('#000') !== '#fff') {
        c.save(); c.clip(); c.strokeStyle = 'rgba(120,30,10,.45)'; c.lineWidth = 1; c.beginPath(); c.moveTo(2, .5); c.quadraticCurveTo(L * .6, -2.5, L - 2, -1.6); c.stroke();   // 羽軸
        if (!layer) { c.strokeStyle = 'rgba(255,240,180,.8)'; c.lineWidth = 1.3; c.beginPath(); c.moveTo(L * .35, -6.2); c.quadraticCurveTo(L * .65, -8, L - 1, -2.4); c.stroke(); }   // 金邊
        c.restore();
        if (!layer && opt.flame) f2Flame(c, L - 1, 1, .55, t + i, false);
      }
      c.restore();
    }
  }
}
// 尾羽：兩層，外層長（尾端花紋或火焰）、內層短
function f2PhxTailB(c, C, t, opt) {
  const cols = ['#c8281a', '#f26a1a', '#e8a020', '#f26a1a', '#c8281a', '#f26a1a', '#c8281a'];
  for (let layer = 0; layer < 2; layer++) {
    const n = layer ? 5 : 7, len = layer ? 30 : 48, spread = layer ? 1.4 : 2.3;
    for (let i = 0; i < n; i++) {
      const k = i / (n - 1) - .5, a = k * spread + Math.sin(t * 2.5 + i) * .05;
      c.save(); c.translate(0, 20); c.rotate(a);
      c.beginPath(); c.moveTo(-3, 0); c.quadraticCurveTo(-9, len * .55, -2, len); c.quadraticCurveTo(0, len + 6, 2, len); c.quadraticCurveTo(9, len * .55, 3, 0); c.closePath();
      aFI(c, C(layer ? (i % 2 ? '#ffb02a' : '#ff7a1a') : cols[i]), 1.5);
      if (C('#000') !== '#fff') {
        c.strokeStyle = 'rgba(120,30,10,.45)'; c.lineWidth = .9; c.beginPath(); c.moveTo(0, 2); c.lineTo(0, len - 3); c.stroke();
        if (!layer) {
          if (opt.flame) f2Flame(c, 0, len + 4, .7, t + i, false);
          else { aEll(c, 0, len - 6, 4.6, 5.6); c.fillStyle = '#ffd25a'; c.fill(); c.strokeStyle = '#8a3a10'; c.lineWidth = .8; c.stroke(); aEll(c, 0, len - 6, 2.4, 3); c.fillStyle = '#2a8a7a'; c.fill(); aEll(c, 0, len - 6.5, 1, 1.3); c.fillStyle = '#123a34'; c.fill(); }
        }
      }
      c.restore();
    }
  }
}
function f2PhxB(c, o, opt) {
  const C = F2W(o), t = o.t, w = Math.sin(t * 4);
  if (!o.fl) { const gl = c.createRadialGradient(0, 4, 14, 0, 4, 60); gl.addColorStop(0, 'rgba(255,190,80,.4)'); gl.addColorStop(1, 'rgba(255,130,40,0)'); c.fillStyle = gl; aCirc(c, 0, 4, 60); c.fill(); }
  f2PhxTailB(c, C, t, opt);
  for (const s of [-1, 1]) { c.save(); c.scale(s, 1); f2PhxWingB(c, C, t, w, opt); c.restore(); }
  if (opt.ruff) {   // 頸部的羽毛領
    for (let i = 0; i < 11; i++) { const a = Math.PI * .1 + i / 10 * Math.PI * .8, x = Math.cos(a) * 21, y = 1 + Math.sin(a) * 10; c.save(); c.translate(x, y); c.rotate(a - Math.PI / 2); c.beginPath(); c.moveTo(-4.4, 0); c.quadraticCurveTo(-1, 10, 0, 15); c.quadraticCurveTo(1, 10, 4.4, 0); c.closePath(); aFI(c, C(i % 2 ? '#ffc040' : '#ff8a2a'), 1.2); c.restore(); }
  }
  heroSilhouette(c, [
    { path: c => aEll(c, 0, 14, 17, 15), fill: C('#d8321a'), after: o.fl ? null : c => {
      c.save(); aEll(c, 0, 14, 17, 15); c.clip(); f2Shade(c, '#ea4a2a', '#9a1e0e', 14, 17); c.fillStyle = '#ffd27a'; aEll(c, 0, 20, 9.5, 10.5); c.fill();
      c.strokeStyle = 'rgba(200,110,30,.7)'; c.lineWidth = 1; for (let r = 0; r < 3; r++) for (let k = -2; k <= 2; k++) { const x = k * 3.6 + (r % 2) * 1.8, y = 13 + r * 4.2; if (Math.abs(x) > 8 - r) continue; c.beginPath(); c.moveTo(x - 1.8, y); c.quadraticCurveTo(x, y + 2.4, x + 1.8, y); c.stroke(); }   // 胸前的鱗狀羽毛
      c.restore(); } },
    { path: c => aCirc(c, 0, -10, 17), fill: C('#e8401a'), after: o.fl ? null : c => { c.save(); aCirc(c, 0, -10, 17); c.clip(); f2Shade(c, '#ff5a2a', '#a8200a', -10, 17); c.restore(); } },
  ], 2);
  // 冠羽（三根帶金珠，crown＝再加一頂小金冠）
  for (const [a, l] of [[-.45, 16], [0, 21], [.45, 16]]) { c.save(); c.translate(0, -25); c.rotate(a + Math.sin(t * 3 + a) * .06); c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(a * 6, -l * .5, 0, -l); c.strokeStyle = INK; c.lineWidth = 3; c.stroke(); c.strokeStyle = C('#f2b830'); c.lineWidth = 1.5; c.stroke(); aCirc(c, 0, -l - 2.5, 3.4); aFI(c, C(opt.crown ? '#ff5a3a' : '#ffd25a'), 1.3); if (!o.fl) { aCirc(c, -1, -l - 3.5, 1); c.fillStyle = 'rgba(255,255,255,.7)'; c.fill(); } c.restore(); }
  if (opt.crown) { c.beginPath(); c.moveTo(-9, -24); c.lineTo(-10, -31); c.lineTo(-5, -27); c.lineTo(0, -33); c.lineTo(5, -27); c.lineTo(10, -31); c.lineTo(9, -24); c.closePath(); aFI(c, C('#f2c14e'), 1.4); if (!o.fl) { c.fillStyle = '#2a8a7a'; aCirc(c, 0, -27, 1.6); c.fill(); } }
  // 臉：金色眼線、眼睛、眉、勾嘴、兩側的金色臉紋
  if (!o.fl) { c.strokeStyle = '#ffd25a'; c.lineWidth = 1.4; for (const s of [-1, 1]) { c.beginPath(); c.moveTo(s * 2.5, -14.5); c.quadraticCurveTo(s * 9, -16.5, s * 13.5, -12); c.stroke(); c.beginPath(); c.moveTo(s * 12.5, -6); c.quadraticCurveTo(s * 16.5, -2, s * 13.5, 3); c.stroke(); } }
  foeEye(c, -6.5, -10, 3.8, 4.6, null, o.warn, o.blink, o.fl ? null : '#ffe24a'); foeEye(c, 6.5, -10, 3.8, 4.6, null, o.warn, o.blink, o.fl ? null : '#ffe24a');
  c.strokeStyle = INK; c.lineWidth = 2.2; c.lineCap = 'round'; c.beginPath(); c.moveTo(-12, -17.5); c.lineTo(-3, -15.5); c.moveTo(3, -15.5); c.lineTo(12, -17.5); c.stroke();
  c.beginPath(); c.moveTo(-4.5, -3); c.quadraticCurveTo(0, -5, 4.5, -3); c.quadraticCurveTo(3, 3, 0, 6.5); c.quadraticCurveTo(-3, 3, -4.5, -3); c.closePath(); aFI(c, C('#ffd25a'), 1.5);
  if (!o.fl) { c.fillStyle = 'rgba(255,255,255,.5)'; aEll(c, -1.6, -1.5, .9, 1.8); c.fill(); }
  if (opt.sparkle && !o.fl) for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + t * .7, r = 52 + Math.sin(t * 3 + i) * 5, x = Math.cos(a) * r, y = 4 + Math.sin(a) * r * .8, s = 2 + Math.sin(t * 6 + i) * 1; c.fillStyle = 'rgba(255,240,170,.9)'; c.beginPath(); c.moveTo(x, y - s * 2); c.lineTo(x + s * .6, y); c.lineTo(x, y + s * 2); c.lineTo(x - s * .6, y); c.closePath(); c.fill(); }
  if (opt.ember && !o.fl) for (let i = 0; i < 10; i++) { const p = (t * .5 + i / 10) % 1, x = Math.sin(i * 7.3) * 40, y = 40 - p * 90; c.fillStyle = `rgba(255,${150 + (i % 3) * 40},60,${1 - p})`; aCirc(c, x + Math.sin(t * 3 + i) * 4, y, 1.6 + (i % 2)); c.fill(); }
}
const FOE2_PHOENIX_B = {
  B1: (c, o) => f2PhxB(c, o, {}),                                   // 細緻版：羽軸、金邊、兩層翅膀與尾羽、胸前鱗羽、金色臉紋
  B2: (c, o) => f2PhxB(c, o, { ruff: true, crown: true, sparkle: true }),   // 華麗版：再加羽毛領、小金冠、周圍金色光點
  B3: (c, o) => f2PhxB(c, o, { flame: true, ember: true }),               // 燄羽版：翅膀羽尖和尾端變成火焰，周圍飄著火星
};
// 目前遊戲用的版本（定案後改成選中的那一款）
FOE2_WIND[13] = { custom: FOE2_PHOENIX_B.B2 };   // 定案：火鳳凰 B2 華麗版
FOE2_MOUNT[13] = { custom: FOE2_HIHI.B };   // 定案：B 銀鬃狒狒
// 關卡（THEMES 索引）→ 敵人造型表；林（0）沿用 art.js 原版
const FOE2 = { 1: FOE2_WIND, 2: FOE2_FIRE, 3: FOE2_MOUNT };
const FOE2_HUMAN = { 0: 1, 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1, 9: 1, 11: 1 };   // 用人形比例（依 ENEMY.h 縮放、跟著玩家轉向）
// 畫一隻風／火／山的敵人；沒有對應造型就回傳 false（改畫林版）
function drawFoe2(th, type, t, e, look, near) {
  const set = FOE2[th], S = set && set[type]; if (!S) return false;
  const c = ctx, ed = ENEMY[type], fl = e && e.flash > 0, seed = e ? e.bx || 0 : 0;
  const o = { t, e, fl, seed, near, warn: e && e.warn, atk: e && e.atk > 0, hurt: e && e.hurt, blink: (e && e.hurt) || aBlink(t, seed), S };
  if (type === 4) o.below = e && g && g.p && g.p.y - 20 > e.y && Math.abs(g.p.x - e.x) < 40;
  if (type === 9) o.bowA = e && g && g.p ? clamp(Math.atan2((g.p.y - 20) - e.y, Math.abs(g.p.x - e.x)), -1.1, 1.1) : 0;
  c.save();
  if (FOE2_HUMAN[type]) {
    const u = ed.h / 44, bob = Math.sin(t * 5 + seed) * 1.4;
    if (e && e.tilt) c.rotate(e.tilt * .32);
    c.scale(u * look, u); c.translate(0, bob);
  } else if (type === 8 || type === 10 || type === 13) c.scale(look, 1);
  if (S.custom) S.custom(c, o); else f2Chibi(c, o, S);
  c.restore();
  return true;
}

// ===== 風／火／山關的敵方攻擊與場地效果 =====
// 回傳 true＝已經畫好（不用再畫林的版本）
function drawEShot2(s) {
  const c = ctx, sk = s.skin || 0;
  if (!sk) return false;
  if (s.kind === 'arrow' && sk === 2) {   // 火矢：箭頭帶火（先畫火，箭本體交給原本的畫法）
    c.save(); c.translate(s.x, s.y); c.rotate(Math.atan2(s.vy, s.vx));
    const gl = c.createRadialGradient(12, 0, 1, 12, 0, 10); gl.addColorStop(0, 'rgba(255,200,80,.85)'); gl.addColorStop(1, 'rgba(255,90,20,0)'); c.fillStyle = gl; aCirc(c, 12, 0, 10); c.fill();
    c.restore(); return false;
  }
  if (s.kind === 'ember') {   // 提燈妖怪的火星
    c.save(); c.translate(s.x, s.y);
    const gl = c.createRadialGradient(0, 0, 1, 0, 0, 11); gl.addColorStop(0, 'rgba(255,230,140,.95)'); gl.addColorStop(.5, 'rgba(255,130,40,.7)'); gl.addColorStop(1, 'rgba(255,80,20,0)'); c.fillStyle = gl; aCirc(c, 0, 0, 11); c.fill();
    for (let i = 0; i < 3; i++) { c.fillStyle = 'rgba(255,170,60,.7)'; aCirc(c, -s.vx * .02 * (i + 1), -s.vy * .02 * (i + 1), 3 - i * .8); c.fill(); }
    c.restore(); return true;
  }
  if (s.kind === 'frost') {   // 雪蓑蟲的冰絲球
    c.save(); c.translate(s.x, s.y); c.rotate(s.t * 2);
    c.fillStyle = 'rgba(200,240,255,.45)'; aCirc(c, 0, 0, 9); c.fill();
    drawFlake(c, 0, 0, 7);
    c.restore(); return true;
  }
  if (s.kind === 'web' && sk === 1) {   // 斷線紙鳶吐出的線團（紅線）
    c.save(); c.translate(s.x, s.y); c.rotate(s.t * 3);
    c.strokeStyle = 'rgba(232,70,58,.9)'; c.lineWidth = 1.3;
    for (let i = 0; i < 3; i++) { c.beginPath(); c.ellipse(0, 0, 8, 3.5, i * 1.05, 0, TAU); c.stroke(); }
    c.restore(); return true;
  }
  if (!s.kind) {   // 手裡劍：風＝風車、火＝燃燒手裡劍、山＝冰柱
    c.save(); c.translate(s.x, s.y);
    if (sk === 1) {
      c.fillStyle = 'rgba(160,220,255,.35)'; aCirc(c, 0, 0, 12); c.fill();
      c.rotate(s.t * 20);
      ['#e8463a', '#ffd25a', '#4aa8e8', '#ffffff'].forEach((col, i) => { c.save(); c.rotate(i * Math.PI / 2); c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -9); c.lineTo(6.5, -6.5); c.closePath(); aFI(c, col, 1.1); c.restore(); });
      aCirc(c, 0, 0, 1.6); c.fillStyle = INK; c.fill();
    } else if (sk === 2) {
      const gl = c.createRadialGradient(0, 0, 2, 0, 0, 14); gl.addColorStop(0, 'rgba(255,200,80,.8)'); gl.addColorStop(1, 'rgba(255,80,20,0)'); c.fillStyle = gl; aCirc(c, 0, 0, 14); c.fill();
      c.rotate(s.t * 18); drawStar4(c, 0, 0, 9, 0, '#ffb02a');
    } else {
      c.fillStyle = 'rgba(170,230,255,.35)'; aCirc(c, 0, 0, 11); c.fill();
      c.rotate(Math.atan2(s.vy, s.vx));
      c.beginPath(); c.moveTo(11, 0); c.lineTo(-7, -3.4); c.lineTo(-9, 0); c.lineTo(-7, 3.4); c.closePath(); aFI(c, '#cfeeff', 1.3);
      c.fillStyle = 'rgba(255,255,255,.85)'; c.beginPath(); c.moveTo(8, -.4); c.lineTo(-6, -1.6); c.lineTo(-6, 0); c.fill();
    }
    c.restore(); return true;
  }
  return false;
}
// 火關：火車留下的火焰（1.5 秒內慢慢變小）
function drawFireTrail(f) {
  const k = f.t / 1.5, s = .75 * (1 - k * .6);
  ctx.save(); ctx.globalAlpha = Math.min(1, (1 - k) * 1.6);
  f2Flame(ctx, f.x, f.y + 6, s, f.t * 3 + f.x, false);
  ctx.restore();
}
// 山關：雪崩球爆開後的冰霧（2 秒）
function drawIceMist(m) {
  const k = m.t / 2, a = Math.min(1, m.t * 4) * (1 - k);
  ctx.save(); ctx.globalAlpha = a;
  const gl = ctx.createRadialGradient(m.x, m.y, 4, m.x, m.y, m.r); gl.addColorStop(0, 'rgba(220,245,255,.65)'); gl.addColorStop(.7, 'rgba(190,230,255,.4)'); gl.addColorStop(1, 'rgba(190,230,255,0)');
  ctx.fillStyle = gl; aCirc(ctx, m.x, m.y, m.r); ctx.fill();
  for (let i = 0; i < 6; i++) { const an = i / 6 * TAU + m.t * .8, r = m.r * .55; drawFlake(ctx, m.x + Math.cos(an) * r, m.y + Math.sin(an) * r * .7, 3); }
  ctx.restore();
}
