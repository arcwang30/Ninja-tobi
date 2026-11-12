'use strict';
/* NINJA 鳶 TOBI — 選關、舞台時段、天候（在 game.js 之後載入）
   ・四大關：林、風、山、火（解鎖順序；火關最難、最後解鎖）。每關 10 個舞台，白天→黃昏→夜晚→凌晨→魔王 5 個為一輪，第 6 舞台起進入第二輪
   ・關卡解鎖：在前一關到達第 5 舞台（魔王舞台）就開放下一關（參考吸血鬼倖存者：前一關達成條件才開下一關）
   ・天候：每關有招牌天候（第 2～4 舞台輕微、第 6～9 舞台加強），魔王登場時會換成魔王自己的天候 */

// th = THEMES 的索引（林 0、風 1、火 2、山 3）；LEVELS 的順序＝選關與解鎖順序（v64 起火關和山關對調）
const LEVELS = [
  { th: 0, wx: 'fog', motto: ['其徐如林', '徐かなること林の如く', 'Silent as the Forest'] },
  { th: 1, wx: 'rain', motto: ['其疾如風', '疾きこと風の如く', 'Swift as the Wind'] },
  { th: 3, wx: 'snow', motto: ['不動如山', '動かざること山の如し', 'Steady as the Mountain'] },
  { th: 2, wx: 'dark', motto: ['侵掠如火', '侵掠すること火の如く', 'Fierce as Fire'] },   // 火關：難度最高、最後解鎖
];
const ST_N = 10, ST_UNLOCK = 4;   // 一關 10 個舞台；到達第 5 舞台（索引 4）開下一關
// 時段：白天、黃昏、夜晚、凌晨、魔王。mul = 乘色（整個背景的色調）、glow = 天空上方的光
const TOD = [
  { n: ['白天', '昼', 'Day'], mul: null, sky: null },
  { n: ['黃昏', '夕暮れ', 'Dusk'], mul: '#ffb08a', glow: 'rgba(255,150,70,.28)', sky: ['#5a3a6a', '#f08a4a'] },
  { n: ['夜晚', '夜', 'Night'], mul: '#6676b8', glow: 'rgba(40,60,140,.2)', stars: 1, moon: '#fff4d0', sky: ['#0c1430', '#2a3a6a'] },
  { n: ['凌晨', '夜明け', 'Dawn'], mul: '#c8b4e4', glow: 'rgba(255,190,210,.22)', stars: .4, sky: ['#3a3a7a', '#f4b8c8'] },
  { n: ['魔王', '魔王', 'Boss'], mul: '#b85466', glow: 'rgba(140,0,30,.22)', moon: '#ff6a4a', sky: ['#1a0408', '#6a1420'] },
];
const tod = () => g.stage % 5;
const stageName = st => t('st_n', st + 1) + '・' + L(TOD[st % 5].n);
const lvName = i => THEMES[LEVELS[i].th].k;
// 天候：rain 暴風雨、fog 濃霧、dark 黑暗雷閃、snow 暴雪
const WX = {
  rain: { n: ['暴風雨', '暴風雨', 'Storm'], ic: '🌧️' },
  fog: { n: ['濃霧', '濃霧', 'Thick Fog'], ic: '🌫️' },
  dark: { n: ['黑暗雷閃', '暗闇と雷', 'Dark Thunder'], ic: '⚡' },
  snow: { n: ['暴雪', '吹雪', 'Blizzard'], ic: '❄️' },
  // 以下三種只在魔王登場時出現
  leaf: { n: ['狂葉亂舞', '狂葉乱舞', 'Leaf Storm'], ic: '🍃' },     // 只有畫面效果，不影響操作（林關是第一關）
  ember: { n: ['火雨', '火の雨', 'Fire Rain'], ic: '🔥' },            // 有預告落點的火球，碰到扣少量 HP
  white: { n: ['吹雪白幕', '白い闇', 'Whiteout'], ic: '🌨️' },        // 暴雪升級：遠處一片白、視野縮小、一樣會打滑
};
// 魔王登場時換成的天候（依魔王種類）：真妖鬼＝狂葉亂舞（林）／怠惰鬼＝濃霧（風）／雪女鬼＝吹雪白幕（山）／鐵甲鬼＝火雨（火）
const BOSS_WX = ['leaf', 'fog', 'white', 'ember'];
const EMBER_WARN = .9;   // 火雨：落點預告的秒數

// ===== 存檔 =====
function lvSave() {
  if (!save.lv) save.lv = {};
  const s = save.lv;
  if (!Array.isArray(s.best)) s.best = [0, 0, 0, 0];   // 到過的最高舞台（1～10）
  if (!Array.isArray(s.clear)) s.clear = [0, 0, 0, 0];
  if (!s.open) s.open = 1;                              // 已開放幾關
  if (s.sel == null) s.sel = 0;
  // 舊存檔（v51 以前第一關是風、第二關是林）：把兩關的紀錄與成就對調一次
  if (!s.v2) {
    s.v2 = 1;
    if (s.best[0] || s.best[1] || s.clear[0] || s.clear[1] || (save.ach && (save.ach.lv0r5 || save.ach.lv1r5 || save.ach.lv0c || save.ach.lv1c))) {
      [s.best[0], s.best[1]] = [s.best[1], s.best[0]]; [s.clear[0], s.clear[1]] = [s.clear[1], s.clear[0]];
      const A = save.ach || {}; for (const k of ['r5', 'c']) { const a = A['lv0' + k], b = A['lv1' + k]; if (b) A['lv0' + k] = b; else delete A['lv0' + k]; if (a) A['lv1' + k] = a; else delete A['lv1' + k]; }
      if (s.sel <= 1) s.sel = 1 - s.sel;
    }
    persist();
  }
  // v64：火關和山關的選關位置對調（火關改成最後解鎖），把兩關的紀錄與成就也對調一次
  if (!s.v3) {
    s.v3 = 1;
    [s.best[2], s.best[3]] = [s.best[3], s.best[2]]; [s.clear[2], s.clear[3]] = [s.clear[3], s.clear[2]];
    const A = save.ach || {}; for (const k of ['r5', 'c']) { const a = A['lv2' + k], b = A['lv3' + k]; if (b) A['lv2' + k] = b; else delete A['lv2' + k]; if (a) A['lv3' + k] = a; else delete A['lv3' + k]; }
    if (s.sel >= 2) s.sel = 5 - s.sel;
    persist();
  }
  // 遇過哪幾關的魔王（選關圖卡顯示彩圖或剪影）。舊存檔：到過第 6 舞台或破台就算遇過
  if (!Array.isArray(s.boss)) { s.boss = s.best.map((b, i) => b >= 6 || s.clear[i] ? 1 : 0); persist(); }
  return s;
}
// 到達新舞台時呼叫：記錄最佳、檢查是否開放下一關
function lvReach() {
  const s = lvSave(), i = g.lvl, st = g.stage + 1;
  if (st > s.best[i]) s.best[i] = st;
  if (g.stage >= ST_UNLOCK && i + 1 < LEVELS.length && s.open < i + 2 && !TEST_FREE) {
    s.open = i + 2;
    floatText(W / 2, 30, t('lv_open', lvName(i + 1)), '#ffd27a', 20, true); SFX.fever();
  }
  persist();
}

// ===== 天候 =====
function wxSet(k, lv, announce) {
  const w = g.wx && g.wx.k === k ? g.wx : { k, lv: 0, cur: 0, t: 0, flash: 0, boltT: rnd(2, 4), gust: 0, gustT: 2, v: 0 };
  w.k = k; w.lv = lv; g.wx = k ? w : null;
  if (k && announce) { floatText(W / 2, 58, WX[k].ic + ' ' + L(WX[k].n), '#cfe8ff', 18, true); g.wxSeen = g.wxSeen || {}; g.wxSeen[k] = 1; }
}
// 依目前舞台決定天候：第 1 舞台晴朗、2～4 輕微、6～9 加強；魔王舞台在魔王登場時才換
function wxForStage() {
  const s = g.stage % 5, loop = g.stage >= 5;
  if (s === 0 && !loop) { wxSet(null); return; }
  if (s === 4) { if (g.wx) g.wx.lv = .3; return; }   // 魔王舞台：魔王出場前先轉小
  wxSet(LEVELS[g.lvl].wx, loop ? 1 : .5, true);
}
function wxBoss(kind) { wxSet(BOSS_WX[kind], g.stage >= 5 ? 1 : .75, true); }
// 每幀更新：強度慢慢變化、閃電、陣風
function updateWx(dt) {
  const w = g.wx; if (!w) return;
  w.t += dt; w.cur += (w.lv - w.cur) * Math.min(1, dt * .8);
  w.flash = Math.max(0, w.flash - dt * 2.6);
  if (w.k === 'dark' || (w.k === 'rain' && w.cur > .7)) {
    w.boltT -= dt;
    if (w.boltT <= 0) { w.boltT = rnd(3.5, 6.5) * (w.k === 'dark' ? 1 : 1.6); w.flash = 1; w.boltX = rnd(W * .15, W * .85); SFX.thunder && SFX.thunder(); vib(30); }
  }
  if (w.k === 'rain') { w.gustT -= dt; if (w.gustT <= 0) { w.gustT = rnd(2.5, 4.5); w.gust = (Math.random() < .5 ? -1 : 1) * rnd(30, 60) * w.cur; } }
  if (w.k === 'ember') updateEmber(w, dt);
}
// 火雨：每隔一段時間在主角附近預告一個落點（0.9 秒），之後火球從天而降；碰到扣 HP（和火關火星同樣 8 點）
function updateEmber(w, dt) {
  w.drops = w.drops || []; w.dropT = (w.dropT ?? 1.5) - dt;
  if (w.dropT <= 0 && state === 'play' && w.cur > .3) {
    w.dropT = rnd(1.5, 2.6) / (.6 + .4 * w.cur);
    w.drops.push({ x: clamp(g.p.x + rnd(-90, 90), 24, W - 24), t: 0, y: -30 });
  }
  const p = g.p, py = p.y - g.camY - 20;
  for (const d of w.drops) {
    d.t += dt; if (d.t < EMBER_WARN) continue;
    d.y += 560 * dt;
    if (!d.hit && Math.abs(d.x - p.x) < 20 && Math.abs(d.y - py) < 26) {
      d.hit = 1;
      g.booms.push({ x: d.x, y: d.y + g.camY, r: 30, t: 0, c: '#ff8a3a' });
      hurt('ember');
    }
  }
  w.drops = w.drops.filter(d => d.y < H + 40 && !d.hit);
}
// 影響移動：暴風雨有陣風；暴雪會打滑（帶慣性）
function wxMove(mv, dt) {
  const w = g.wx; if (!w || dt <= 0) return mv;
  if (w.k === 'rain') return mv + w.gust * dt;
  if (w.k === 'snow' || w.k === 'white') { const k = Math.min(1, dt * (14 - 5.5 * w.cur));   /* v64：打滑減輕（原本 14 - 9） */ w.v += (mv / dt - w.v) * k; return w.v * dt; }
  return mv;
}

// ===== 繪製：時段色調（畫在背景與牆壁上，角色不受影響） =====
function drawTodLayer(i, a) {
  const T = TOD[i]; if (!T.mul || a <= 0) return;
  const c = ctx;
  c.save(); c.globalAlpha = a;
  c.globalCompositeOperation = 'multiply'; c.fillStyle = T.mul; c.fillRect(0, 0, W, H);
  c.globalCompositeOperation = 'source-over';
  const gr = c.createLinearGradient(0, 0, 0, H * .6); gr.addColorStop(0, T.glow); gr.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = gr; c.fillRect(0, 0, W, H * .6);
  if (T.stars) for (let k = 0; k < 26; k++) { const x = (k * 89 + 13) % W, y = (k * 53) % (H * .45), s = .4 + .4 * Math.sin(g.t * 2 + k * 3); c.fillStyle = `rgba(255,255,235,${s * T.stars})`; c.fillRect(x, y, 1.6, 1.6); }
  if (T.moon) {
    const mx = W * .78, my = H * .13, halo = c.createRadialGradient(mx, my, 10, mx, my, 70); halo.addColorStop(0, T.moon + '88'); halo.addColorStop(1, T.moon + '00');
    c.fillStyle = halo; c.fillRect(mx - 70, my - 70, 140, 140); c.fillStyle = T.moon; aCirc(c, mx, my, 20); c.fill();
    c.fillStyle = 'rgba(0,0,0,.12)'; aCirc(c, mx - 6, my - 4, 4); c.fill(); aCirc(c, mx + 6, my + 6, 3); c.fill();
  }
  c.restore();
}
function drawTOD() {
  const f = g.todF;   // 換時段時的淡入：{ from, q }
  if (f && f.q < 1) { drawTodLayer(f.from, 1 - f.q); drawTodLayer(tod(), f.q); }
  else drawTodLayer(tod(), 1);
}
// ===== 繪製：天候（畫在所有遊戲物件上面、HUD 下面） =====
let FOG_TILE = null;
function fogTile() {
  if (FOG_TILE) return FOG_TILE;
  const cv2 = document.createElement('canvas'); cv2.width = 360; cv2.height = 320; const c = cv2.getContext('2d'), r = aRng(77);
  for (let i = 0; i < 18; i++) { const x = r() * 360, y = r() * 320, rad = 50 + r() * 70; for (const dx of [-360, 0, 360]) for (const dy of [-320, 0, 320]) { const gr = c.createRadialGradient(x + dx, y + dy, 5, x + dx, y + dy, rad); gr.addColorStop(0, 'rgba(235,240,245,.55)'); gr.addColorStop(1, 'rgba(235,240,245,0)'); c.fillStyle = gr; c.fillRect(x + dx - rad, y + dy - rad, rad * 2, rad * 2); } }   // 上下左右都無縫接合（之前只接左右，上下會出現一條分割線）
  return FOG_TILE = cv2;
}
function drawWeather() {
  const w = g.wx; if (!w || w.cur < .02) return;
  const c = ctx, a = w.cur, tt = g.t, camY = g.camY;
  c.save();
  if (w.k === 'rain') {
    c.fillStyle = `rgba(20,30,60,${.18 * a})`; c.fillRect(0, 0, W, H);
    c.strokeStyle = `rgba(190,215,255,${.35 + .25 * a})`; c.lineWidth = 1.3;
    const n = Math.round(70 * a * WK()), sl = 6 + w.gust * .15;
    c.beginPath();
    for (let i = 0; i < n; i++) { const x = ((i * 47.3 + tt * 60) % (W + 40)) - 20, y = ((i * 91.7 + tt * 900 - camY * .5) % (H + 40) + H + 40) % (H + 40) - 20; c.moveTo(x, y); c.lineTo(x - sl, y + 20); }
    c.stroke();
  } else if (w.k === 'fog') {
    const tile = fogTile(), oy = ((-camY * .6) % 320 + 320) % 320, ox = (tt * 18) % 360;
    // 霧集中在畫面上半部：上方的敵人與地板看不清楚
    c.globalAlpha = .55 + .4 * a;
    for (let y = oy - 320; y < H; y += 320) for (let x = -ox; x < W; x += 360) c.drawImage(tile, x, y);
    c.globalAlpha = 1;
    const gr = c.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, `rgba(225,232,238,${.7 * a})`); gr.addColorStop(.55, `rgba(225,232,238,${.25 * a})`); gr.addColorStop(1, 'rgba(225,232,238,0)');
    c.fillStyle = gr; c.fillRect(0, 0, W, H);
  } else if (w.k === 'snow') {
    c.fillStyle = `rgba(220,235,255,${.12 * a})`; c.fillRect(0, 0, W, H);
    const n = Math.round(80 * a * WK());
    for (let i = 0; i < n; i++) { const s = 1 + (i % 3), x = ((i * 61.1 + Math.sin(tt * 1.3 + i) * 18 + tt * 25) % (W + 20) + W + 20) % (W + 20) - 10, y = ((i * 83.3 + tt * (50 + s * 22) - camY * .4) % (H + 20) + H + 20) % (H + 20) - 10; c.fillStyle = 'rgba(255,255,255,.9)'; aCirc(c, x, y, s); c.fill(); }
  } else if (w.k === 'dark') {
    // 火山灰
    c.fillStyle = 'rgba(120,110,100,.6)';
    for (let i = 0; i < 30 * a; i++) { const x = ((i * 71 + tt * 12) % W), y = ((i * 113 + tt * 30 - camY * .3) % H + H) % H; c.fillRect(x, y, 1.6, 1.6); }
    // 只有主角周圍一圈亮，其他地方一片黑；打雷的瞬間看到全景
    const p = g.p, px = p.x, py = p.y - 20 - camY, r0 = 70 - 15 * a, r1 = 150 - 30 * a;
    const dark = (.62 + .3 * a) * (1 - w.flash);
    if (dark > .01) {
      const gr = c.createRadialGradient(px, py, r0, px, py, r1); gr.addColorStop(0, 'rgba(4,4,10,0)'); gr.addColorStop(1, `rgba(4,4,10,${dark})`);
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      // 主角身邊的一盞燈：暖色光暈
      c.globalCompositeOperation = 'lighter'; const lg = c.createRadialGradient(px, py, 4, px, py, r0 + 10); lg.addColorStop(0, `rgba(255,200,120,${.18 * a})`); lg.addColorStop(1, 'rgba(255,200,120,0)'); c.fillStyle = lg; c.fillRect(px - r0 - 10, py - r0 - 10, (r0 + 10) * 2, (r0 + 10) * 2); c.globalCompositeOperation = 'source-over';
    }
  }
  else if (w.k === 'leaf') {
    // 狂葉亂舞：竹葉與紅葉隨陣陣狂風斜掃過畫面，再加幾道風痕（只有畫面效果）
    const gust = .65 + .35 * Math.sin(tt * 1.6);
    c.strokeStyle = `rgba(255,255,255,${.22 * a * gust})`; c.lineWidth = 1.5; c.lineCap = 'round';
    for (let i = 0; i < 9; i++) { const x = ((i * 131 + tt * 520) % (W + 260)) - 130, y = ((i * 97.1 - camY * .2) % H + H) % H, l = 60 + (i % 3) * 30; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + l * .5, y - 6, x + l, y + 4); c.stroke(); }
    const LC = ['#6fbf5a', '#3f8f3a', '#9ad06a', '#d8502a', '#e8a030'], n = Math.round(60 * a * WK());
    for (let i = 0; i < n; i++) {
      const sp = (150 + (i % 5) * 35) * gust, x = ((i * 57.7 + tt * sp) % (W + 60) + W + 60) % (W + 60) - 30;
      const y = ((i * 97.3 + tt * (40 + (i % 4) * 15) + Math.sin(tt * 2 + i) * 22 - camY * .3) % (H + 40) + H + 40) % (H + 40) - 20;
      const s = 1.2 + (i % 3) * .4;
      c.save(); c.translate(x, y); c.rotate(tt * (2 + (i % 3)) + i); c.scale(s, s * (.4 + .6 * Math.abs(Math.sin(tt * 3 + i))));   // 翻轉
      c.fillStyle = LC[i % LC.length]; c.beginPath(); c.ellipse(0, 0, 7, 2.8, 0, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = .8; c.beginPath(); c.moveTo(-7, 0); c.lineTo(7, 0); c.stroke();
      c.restore();
    }
  } else if (w.k === 'ember') {
    // 火雨：上方泛橘紅熱浪＋飄落的火星與灰燼；預告落點與墜落的火球
    const hg = c.createLinearGradient(0, 0, 0, H); hg.addColorStop(0, `rgba(255,110,30,${.22 * a})`); hg.addColorStop(.6, `rgba(200,40,10,${.08 * a})`); hg.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = hg; c.fillRect(0, 0, W, H);
    for (let i = 0; i < 40 * a * WK(); i++) {
      const x = ((i * 71.3 + Math.sin(tt + i) * 14 + tt * 10) % W + W) % W, y = ((i * 113.7 + tt * (40 + (i % 4) * 18) - camY * .3) % H + H) % H;
      if (i % 3) { c.fillStyle = 'rgba(110,100,95,.55)'; c.fillRect(x, y, 1.8, 1.8); }
      else { c.fillStyle = `rgba(255,${150 + (i % 5) * 20},60,${.55 + .4 * Math.sin(tt * 6 + i)})`; aCirc(c, x, y, 1.6); c.fill(); }
    }
    const y0 = SAFE_T + HUD_Y1 + 18;
    for (const d of w.drops || []) {
      if (d.t < EMBER_WARN) {
        // 預告：落點的直線光柱＋上方閃爍的火焰記號
        const k = d.t / EMBER_WARN, bl = .5 + .5 * Math.sin(d.t * 22);
        const cg = c.createLinearGradient(0, y0, 0, H); cg.addColorStop(0, `rgba(255,90,30,${.28 * k})`); cg.addColorStop(1, 'rgba(255,90,30,0)');
        c.fillStyle = cg; c.fillRect(d.x - 10, y0, 20, H - y0);
        c.fillStyle = `rgba(255,${120 + 80 * bl},40,${.6 + .4 * bl})`; c.beginPath(); c.moveTo(d.x, y0 + 12); c.lineTo(d.x - 8, y0 - 2); c.lineTo(d.x + 8, y0 - 2); c.closePath(); c.fill();
      } else {
        // 火球：發光的核心＋往上拖的火尾
        c.globalCompositeOperation = 'lighter';
        const tg = c.createLinearGradient(0, d.y - 48, 0, d.y); tg.addColorStop(0, 'rgba(255,80,20,0)'); tg.addColorStop(1, 'rgba(255,150,40,.85)');
        c.fillStyle = tg; c.beginPath(); c.moveTo(d.x - 8, d.y); c.quadraticCurveTo(d.x, d.y - 60, d.x + 8, d.y); c.closePath(); c.fill();
        const fg = c.createRadialGradient(d.x, d.y, 2, d.x, d.y, 16); fg.addColorStop(0, 'rgba(255,250,210,1)'); fg.addColorStop(.4, 'rgba(255,160,50,.9)'); fg.addColorStop(1, 'rgba(255,60,10,0)');
        c.fillStyle = fg; c.fillRect(d.x - 16, d.y - 16, 32, 32);
        c.globalCompositeOperation = 'source-over';
      }
    }
  } else if (w.k === 'white') {
    // 吹雪白幕：主角周圍還看得到，遠處一片白；大雪橫向猛吹
    const p = g.p, px = p.x, py = p.y - 20 - camY, r0 = 100 - 15 * a, r1 = 220 - 40 * a;
    const gr = c.createRadialGradient(px, py, r0, px, py, r1); gr.addColorStop(0, 'rgba(238,244,252,0)'); gr.addColorStop(1, `rgba(238,244,252,${.5 + .3 * a})`);
    c.fillStyle = gr; c.fillRect(0, 0, W, H);
    const n = Math.round(130 * a * WK());
    for (let i = 0; i < n; i++) {
      const s = 1.2 + (i % 4) * .8, x = ((i * 61.1 + Math.sin(tt * 1.7 + i) * 14 + tt * (110 + s * 30)) % (W + 20) + W + 20) % (W + 20) - 10;
      const y = ((i * 83.3 + tt * (70 + s * 25) - camY * .4) % (H + 20) + H + 20) % (H + 20) - 10;
      c.fillStyle = 'rgba(255,255,255,.92)'; aCirc(c, x, y, s); c.fill();
    }
  }
  // 閃電：白光＋一道雷
  if (w.flash > 0) {
    c.fillStyle = `rgba(255,255,255,${w.flash * .55})`; c.fillRect(0, 0, W, H);
    if (w.flash > .6) { c.strokeStyle = `rgba(255,255,220,${w.flash})`; c.lineWidth = 3; c.beginPath(); let x = w.boltX, y = 0; c.moveTo(x, y); while (y < H * .55) { x += rnd(-22, 22); y += rnd(24, 44); c.lineTo(x, y); } c.stroke(); }
  }
  c.restore();
}


// ===== 完整版：林關免費；風、山、火三關要購買完整版（價格上架前再定，目前用測試按鈕） =====
const FULL_LV = 1;   // LEVELS 索引 >= 1 的關卡屬於完整版
// 測試模式：沒有特別設定時視為已擁有（設定頁有「完整版（測試）」開關可以切換）
function hasFull() { return save.full === true || (TEST_FREE && save.full !== false); }
const lvPaid = i => i >= FULL_LV && !hasFull();
function openFull(why) {
  if (g && state === 'play') { paused = true; inp.dx = 0; }
  if (why === 'boss') { save.fullSeen = 1; persist(); }
  $('fullLead').textContent = t(why === 'boss' ? 'full_lead_boss' : 'full_lead');
  $('fullLvs').innerHTML = LEVELS.slice(FULL_LV).map((L0, k) => `<span class="full-lv" style="background-image:url(${lvThumb(FULL_LV + k)})"><b>${lvName(FULL_LV + k)}</b></span>`).join('');
  $('fullList').innerHTML = ['full_p1', 'full_p2', 'full_p3', 'full_p4'].map(k => `<li>${t(k)}</li>`).join('');
  $('fullBuy').style.display = hasFull() ? 'none' : '';
  show('full', true);
}
function closeFull() {
  hide('full');
  if (g && paused && state === 'play') resumeGame();
  if (state === 'menu' && $('lvsel').classList.contains('on')) openLvSel();
}
// 測試用的購買：直接設為已擁有（上架時改接 App Store／Google Play 的付款）
function buyFull() {
  // 購買處理中：顯示 LOADING 遮罩（正式上架後在這裡呼叫商店的購買 API，完成或失敗時 busyHide）；目前是測試，模擬 1.2 秒的處理時間
  busyShow('busy_buy');
  setTimeout(() => {
    busyHide();
    save.full = true; persist(); SFX.fever();
    toast(t('full_thanks'));
    closeFull();
  }, 1200);
}
// ===== 選關畫面（吸血鬼倖存者風：大張的關卡圖卡，未開放的顯示剪影與開放條件） =====
const lvThumbs = {};
function lvThumb(i) {
  const seen = !!lvSave().boss[i], key = i + (seen ? 'c' : 's');
  if (lvThumbs[key]) return lvThumbs[key];
  const k = THEMES[LEVELS[i].th].k, B = BG_THEME[k], w = 240, h = 300;
  const cv2 = document.createElement('canvas'); cv2.width = w; cv2.height = h; const c = cv2.getContext('2d');
  try {
    B.sky(c, w, h); B.far(c, w, h); B.mid(c, w, h);
    // 這一關的魔王站在下方：遇過才是彩圖，沒遇過是剪影
    const sv = { t: 1, hp: 1, max: 1, kind: BOSS_OF[LEVELS[i].th], n: 0, shield: false, warn: 0, skillT: 9 };
    try {
      if (seen) drawBoss2(sv, w * .5, h * .66, 1.45, c);
      else {
        const sc = document.createElement('canvas'); sc.width = w; sc.height = h; const c3 = sc.getContext('2d');
        drawBoss2(sv, w * .5, h * .66, 1.45, c3);
        c3.globalCompositeOperation = 'source-in'; c3.fillStyle = '#0a0612'; c3.fillRect(0, 0, w, h);
        c.drawImage(sc, 0, 0);
        c.font = `bold 46px ${FONT}`; c.textAlign = 'center'; c.fillStyle = 'rgba(255,255,255,.55)'; c.fillText('?', w * .5, h * .66 + 16);
      }
    } catch (e) { }
    const gr = c.createLinearGradient(0, h * .55, 0, h); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.7)'); c.fillStyle = gr; c.fillRect(0, 0, w, h);
  } catch (e) { }
  return lvThumbs[key] = cv2.toDataURL();
}
function openLvSel() {
  const s = lvSave();
  const h = LEVELS.map((L0, i) => {
    const paid = lvPaid(i), open = !paid && i < (TEST_FREE ? LEVELS.length : s.open),   // 測試模式：四關全開；完整版的關卡沒買就顯示「完整版」
      best = s.best[i], clr = s.clear[i];
    const wx = WX[L0.wx];
    const info = open
      ? `<span class="lv-best">${clr ? '✓ ' + t('lv_cleared') : best ? t('lv_best', best) : t('lv_new')}</span><span class="lv-wx">${wx.ic} ${L(wx.n)}</span>`
      : paid ? `<span class="lv-full">${t('full_tag')}</span>${i < s.open || TEST_FREE ? '' : `<span class="lv-cond">🔒 ${t('lv_cond', lvName(i - 1), ST_UNLOCK + 1)}</span>`}`
      : `<span class="lv-cond">🔒 ${t('lv_cond', lvName(i - 1), ST_UNLOCK + 1)}</span>`;
    return `<button class="lv-card ${open ? '' : paid ? 'paid' : 'locked'} ${s.sel === i && open ? 'sel' : ''}" ${open ? `data-act="lvgo" data-arg="${i}"` : paid ? 'data-act="fullinfo"' : 'data-act="lvlock"'}>
      <span class="lv-art" style="background-image:url(${lvThumb(i)})"></span>
      <span class="lv-k">${lvName(i)}</span><span class="lv-motto">${L(L0.motto)}</span>${info}</button>`;
  }).join('');
  $('lvList').innerHTML = h;
  renderJutsuPick();
  show('lvsel', state === 'menu');
}
// 帶進關卡的忍法：豪天翔＋已取得卷軸解鎖的新忍法（沒解鎖的顯示鎖頭與取得條件）
function renderJutsuPick() {
  const cur = curJutsu().id;
  $('lvJutsu').innerHTML = `<div class="lj-h">${t('ju_title')}<small>${t('jd_' + cur)}</small></div><div class="lj-row">` +
    JUTSU.map(j => jutsuOK(j)
      ? `<button class="lj ${j.id === cur ? 'on' : ''}" data-act="jutsu" data-arg="${j.id}"><img class="lj-ic" src="${emblemIcon(j)}" alt=""><span>${t('ju_' + j.id)}</span></button>`
      : `<button class="lj lock" data-act="jutsulock" data-arg="${j.th}"><img class="lj-ic" src="${emblemIcon(j, true)}" alt=""><span>🔒</span></button>`).join('') + `</div>`;   // 每顆按鈕上方是該忍法的毛筆墨標誌
}
