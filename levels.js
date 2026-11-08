'use strict';
/* NINJA 鳶 TOBI — 選關、舞台時段、天候（在 game.js 之後載入）
   ・四大關：風、林、火、山。每關 10 個舞台，白天→黃昏→夜晚→凌晨→魔王 5 個為一輪，第 6 舞台起進入第二輪
   ・關卡解鎖：在前一關到達第 5 舞台（魔王舞台）就開放下一關（參考吸血鬼倖存者：前一關達成條件才開下一關）
   ・天候：每關有招牌天候（第 2～4 舞台輕微、第 6～9 舞台加強），魔王登場時會換成魔王自己的天候 */

// th = THEMES 的索引（林 0、風 1、火 2、山 3）
const LEVELS = [
  { th: 1, wx: 'rain', motto: ['其疾如風', '疾きこと風の如く', 'Swift as the Wind'] },
  { th: 0, wx: 'fog', motto: ['其徐如林', '徐かなること林の如く', 'Silent as the Forest'] },
  { th: 2, wx: 'dark', motto: ['侵掠如火', '侵掠すること火の如く', 'Fierce as Fire'] },
  { th: 3, wx: 'snow', motto: ['不動如山', '動かざること山の如し', 'Steady as the Mountain'] },
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
};
const BOSS_WX = ['dark', 'fog', 'snow', 'rain'];   // 真妖鬼：黑暗／怠惰鬼：菸霧／雪女鬼：暴雪／鐵甲鬼：雷雨

// ===== 存檔 =====
function lvSave() {
  if (!save.lv) save.lv = {};
  const s = save.lv;
  if (!Array.isArray(s.best)) s.best = [0, 0, 0, 0];   // 到過的最高舞台（1～10）
  if (!Array.isArray(s.clear)) s.clear = [0, 0, 0, 0];
  if (!s.open) s.open = 1;                              // 已開放幾關
  if (s.sel == null) s.sel = 0;
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
}
// 影響移動：暴風雨有陣風；暴雪會打滑（帶慣性）
function wxMove(mv, dt) {
  const w = g.wx; if (!w || dt <= 0) return mv;
  if (w.k === 'rain') return mv + w.gust * dt;
  if (w.k === 'snow') { const k = Math.min(1, dt * (14 - 9 * w.cur)); w.v += (mv / dt - w.v) * k; return w.v * dt; }
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
  for (let i = 0; i < 18; i++) { const x = r() * 360, y = r() * 320, rad = 50 + r() * 70; for (const dx of [-360, 0, 360]) { const gr = c.createRadialGradient(x + dx, y, 5, x + dx, y, rad); gr.addColorStop(0, 'rgba(235,240,245,.55)'); gr.addColorStop(1, 'rgba(235,240,245,0)'); c.fillStyle = gr; c.fillRect(x + dx - rad, y - rad, rad * 2, rad * 2); } }
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
  // 閃電：白光＋一道雷
  if (w.flash > 0) {
    c.fillStyle = `rgba(255,255,255,${w.flash * .55})`; c.fillRect(0, 0, W, H);
    if (w.flash > .6) { c.strokeStyle = `rgba(255,255,220,${w.flash})`; c.lineWidth = 3; c.beginPath(); let x = w.boltX, y = 0; c.moveTo(x, y); while (y < H * .55) { x += rnd(-22, 22); y += rnd(24, 44); c.lineTo(x, y); } c.stroke(); }
  }
  c.restore();
}

// ===== 選關畫面（吸血鬼倖存者風：大張的關卡圖卡，未開放的顯示剪影與開放條件） =====
const lvThumbs = {};
function lvThumb(i) {
  if (lvThumbs[i]) return lvThumbs[i];
  const k = THEMES[LEVELS[i].th].k, B = BG_THEME[k], w = 240, h = 300;
  const cv2 = document.createElement('canvas'); cv2.width = w; cv2.height = h; const c = cv2.getContext('2d');
  try {
    B.sky(c, w, h); B.far(c, w, h); B.mid(c, w, h);
    // 這一關的魔王剪影站在下方
    const sv = { t: 1, hp: 1, max: 1, kind: LEVELS[i].th, n: 0, shield: false, warn: 0, skillT: 9 };
    try { drawBoss2(sv, w * .5, h * .66, 1.45, c); } catch (e) { }
    const gr = c.createLinearGradient(0, h * .55, 0, h); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.7)'); c.fillStyle = gr; c.fillRect(0, 0, w, h);
  } catch (e) { }
  return lvThumbs[i] = cv2.toDataURL();
}
function openLvSel() {
  const s = lvSave();
  const h = LEVELS.map((L0, i) => {
    const open = i < (TEST_FREE ? LEVELS.length : s.open),   // 測試模式：四關全開
      best = s.best[i], clr = s.clear[i];
    const wx = WX[L0.wx];
    const info = open
      ? `<span class="lv-best">${clr ? '✓ ' + t('lv_cleared') : best ? t('lv_best', best) : t('lv_new')}</span><span class="lv-wx">${wx.ic} ${L(wx.n)}</span>`
      : `<span class="lv-cond">🔒 ${t('lv_cond', lvName(i - 1), ST_UNLOCK + 1)}</span>`;
    return `<button class="lv-card ${open ? '' : 'locked'} ${s.sel === i && open ? 'sel' : ''}" ${open ? `data-act="lvgo" data-arg="${i}"` : 'data-act="lvlock"'}>
      <span class="lv-art" style="background-image:url(${lvThumb(i)})"></span>
      <span class="lv-k">${lvName(i)}</span><span class="lv-motto">${L(L0.motto)}</span>${info}</button>`;
  }).join('');
  $('lvList').innerHTML = h;
  show('lvsel', state === 'menu');
}
