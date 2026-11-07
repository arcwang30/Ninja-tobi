'use strict';
/* NINJA 鳶 TOBI — 開場演出（在 art.js 之後、game.js 之前載入；用到的 ctx、W、H、save… 都在呼叫時才讀取）
   流程：團隊 LOGO →（第一次開啟）點一下開始 → 過場「月下的狼煙」→ 白光接標題
         第二次起：團隊 LOGO → 直接白光接標題；設定頁可「重看開場」
   標題畫面：背景畫夜空、滿月、竹林與主角剪影（用忍術在竹子間跳躍、化煙瞬移）；閒置一陣子會播一小段待機展示，再回到標題 */
const INTRO = {
  ph: 'boot',        // boot | logo | tap | cut | title
  t: 0, flash: 0, idle: 0, attract: -1, last: 0, said: -1, sfx: {},
  logo: (() => { const i = new Image(); i.src = 'assets/team_logo.webp'; return i; })(),
  // 開機遮罩拿掉後開始
  begin() {
    this.ph = 'logo'; this.t = 0; this.leave = -1;
    // 預覽用：網址加 ?cutshot=秒數 會停在過場的那一刻（截圖檢查用）
    const q = new URLSearchParams(location.search).get('cutshot');
    if (q !== null && !isNaN(+q)) { this.ph = 'cut'; this.t = +q; this.frozen = true; const b = $('boot'); if (b) b.remove(); }
  },
  // 進入過場（重看開場也從這裡開始）
  playCut() { hideAll(); this.ph = 'cut'; this.t = 0; this.said = -1; this.sfx = {}; },
  replay() { this.playCut(); },
  // 接到標題：顯示標題選單並播放 LOGO 蓋章＋忍術陣現身
  toTitle() {
    this.ph = 'title'; this.flash = 1; this.idle = 0; this.endAttract();
    if (!save.intro) { save.intro = 1; persist(); }
    if (state === 'menu') { show('title'); playIntro(); }
  },
  // 畫布被點擊（只有開場階段會收到；回傳 true 表示已處理）
  tap() {
    if (this.ph === 'logo') { if (this.t > .3 && this.leave < 0) this.leave = this.t; return true; }
    if (this.ph === 'tap') { this.playCut(); return true; }
    if (this.ph === 'cut') { if (this.t < CUT_FLASH) this.t = CUT_FLASH; return true; }
    return false;
  },
  // 任何點擊或按鍵：重新計算閒置時間、結束待機展示
  poke() { this.idle = 0; if (this.attract >= 0) this.endAttract(); },
  endAttract() { this.attract = -1; const el = $('title'); if (el) el.classList.remove('attract'); },
  update(dt) {
    if (this.frozen) return;
    this.t += dt;
    if (this.ph === 'logo') {
      const la = this.t;
      if (this.leave < 0 && la >= LOGO_IN + LOGO_HOLD) this.leave = this.t;
      if (this.leave >= 0 && this.t - this.leave >= LOGO_OUT) { this.t = 0; if (save.intro) this.toTitle(); else this.ph = 'tap'; }
    } else if (this.ph === 'cut') {
      cutSfx(this.t);
      if (this.t >= CUT_END) this.toTitle();
    } else if (this.ph === 'title') {
      if (this.flash > 0) this.flash = Math.max(0, this.flash - dt / .7);
      titleHero(dt);
      const onlyTitle = $('title').classList.contains('on') && !document.querySelector('.scr.on:not(#title)');
      if (this.attract >= 0) { this.attract += dt; if (this.attract >= ATTRACT_T) { this.endAttract(); this.idle = 0; } }
      else if (onlyTitle) { this.idle += dt; if (this.idle >= IDLE_T) { this.attract = 0; $('title').classList.add('attract'); } }
      else this.idle = 0;
    }
  },
  draw() {
    const c = ctx;
    if (this.ph === 'boot') { c.fillStyle = '#000'; c.fillRect(0, 0, W, H); return; }
    if (this.ph === 'logo') return drawTeamLogo(this.t, this.leave);
    if (this.ph === 'tap') return drawTapScreen(this.t);
    if (this.ph === 'cut') return drawCut(this.t);
    drawTitleBG(performance.now() / 1000);
    if (this.attract >= 0) drawAttract(this.attract);
    if (this.flash > 0) { c.fillStyle = `rgba(255,255,255,${this.flash})`; c.fillRect(0, 0, W, H); }
  },
};
const LOGO_IN = .6, LOGO_HOLD = 1.6, LOGO_OUT = .5;
const CUT_T = [0, 4.2, 8.6, 12.2, 15.6];   // 五個鏡頭的開始時間
const CUT_FLASH = 15.6, CUT_END = 16.05, IDLE_T = 15, ATTRACT_T = 6.5;
const ez = x => x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x);
const lerp2 = (a, b, q) => a + (b - a) * q;

// ===== 剪影：把任意畫法畫進暫存畫布，再整塊塗成單色 =====
const SIL = document.createElement('canvas'), SILC = SIL.getContext('2d');
function drawSil(x, y, w, h, ox, oy, col, draw) {
  const k = cv.width / W, pw = Math.ceil(w * k), ph = Math.ceil(h * k);
  if (SIL.width < pw || SIL.height < ph) { SIL.width = Math.max(SIL.width, pw); SIL.height = Math.max(SIL.height, ph); }
  SILC.setTransform(1, 0, 0, 1, 0, 0); SILC.globalCompositeOperation = 'source-over'; SILC.globalAlpha = 1; SILC.clearRect(0, 0, SIL.width, SIL.height);
  SILC.setTransform(k, 0, 0, k, ox * k, oy * k); draw(SILC);
  SILC.setTransform(1, 0, 0, 1, 0, 0); SILC.globalCompositeOperation = 'source-in'; SILC.fillStyle = col; SILC.fillRect(0, 0, pw, ph); SILC.globalCompositeOperation = 'source-over';
  ctx.drawImage(SIL, 0, 0, pw, ph, x - ox, y - oy, w, h);
}

// ===== 團隊 LOGO（照 yaki_mochi：深藍底、LOGO 由 0.94 倍放大淡入 → 停留 → 淡出到全黑） =====
function drawTeamLogo(t, leave) {
  const c = ctx, bg = c.createRadialGradient(W / 2, H * .45, 0, W / 2, H * .45, Math.max(W, H) * .7);
  bg.addColorStop(0, '#1a2048'); bg.addColorStop(1, '#070915'); c.fillStyle = bg; c.fillRect(0, 0, W, H);
  const img = INTRO.logo, fin = ez(t / LOGO_IN), out = leave < 0 ? 0 : ez((t - leave) / LOGO_OUT);
  if (img.complete && img.naturalWidth) {
    const box = Math.min(W * .78, H * .5), s = (.94 + .06 * fin) * box / Math.max(img.naturalWidth, img.naturalHeight), w = img.naturalWidth * s, h = img.naturalHeight * s;
    c.save(); c.globalAlpha = fin * (1 - out); c.drawImage(img, W / 2 - w / 2, H * .45 - h / 2, w, h); c.restore();
  }
  if (out > 0) { c.fillStyle = `rgba(0,0,0,${out})`; c.fillRect(0, 0, W, H); }
}

// ===== 共用的夜景零件 =====
function nightSky(y0, y1, t, top = '#0a0f2e', bot = '#2b1d4c') {
  const c = ctx, g2 = c.createLinearGradient(0, y0, 0, y1); g2.addColorStop(0, top); g2.addColorStop(1, bot); c.fillStyle = g2; c.fillRect(0, y0, W, y1 - y0);
  const r = aRng(11);
  for (let i = 0; i < 46; i++) { const x = r() * W, y = y0 + r() * (y1 - y0) * .8, tw = .5 + .5 * Math.sin(t * 3 + i * 1.7); c.fillStyle = `rgba(255,255,240,${.25 + tw * .6})`; c.fillRect(x, y, r() < .2 ? 2 : 1.2, r() < .2 ? 2 : 1.2); }
}
function bigMoon(x, y, r) {
  const c = ctx, gl = c.createRadialGradient(x, y, r * .8, x, y, r * 2.1); gl.addColorStop(0, 'rgba(255,241,194,.38)'); gl.addColorStop(1, 'rgba(255,241,194,0)');
  c.fillStyle = gl; aCirc(c, x, y, r * 2.1); c.fill();
  const mg = c.createRadialGradient(x - r * .3, y - r * .3, r * .1, x, y, r); mg.addColorStop(0, '#fffbe6'); mg.addColorStop(1, '#f6dc96');
  c.fillStyle = mg; aCirc(c, x, y, r); c.fill();
  c.fillStyle = 'rgba(214,180,110,.35)'; for (const [dx, dy, rr2] of [[-.3, -.2, .16], [.25, .1, .22], [-.05, .4, .12], [.35, -.35, .09]]) { aCirc(c, x + dx * r, y + dy * r, rr2 * r); c.fill(); }
}
function bambooSil(x, y0, y1, w, col, sway, t) {
  const c = ctx, sw = Math.sin(t * 1.3 + x) * sway;
  c.fillStyle = col; c.beginPath(); c.moveTo(x - w / 2, y1); c.lineTo(x - w / 2 + sw, y0); c.lineTo(x + w / 2 + sw, y0); c.lineTo(x + w / 2, y1); c.closePath(); c.fill();
  for (let yy = y1 - 40; yy > y0; yy -= 46) { const k = (y1 - yy) / (y1 - y0), xx = x + sw * k; c.fillRect(xx - w / 2 - 1.5, yy, w + 3, 3); }
  for (let i = 0; i < 3; i++) { const yy = y0 + 30 + i * 70, xx = x + sw * ((y1 - yy) / (y1 - y0)), d = i % 2 ? 1 : -1; c.beginPath(); c.moveTo(xx, yy); c.quadraticCurveTo(xx + d * 22, yy - 10, xx + d * 38, yy + 4); c.quadraticCurveTo(xx + d * 20, yy + 2, xx, yy + 5); c.fill(); }
}
// 日式屋頂剪影（亮著燈的窗）
function roofs(y, col, sc, t, lit = true) {
  const c = ctx, xs = [[-.05, 1], [.26, .8], [.55, 1.15], [.86, .9]];
  for (const [fx, k] of xs) {
    const x = fx * W, w = 120 * sc * k, h = 34 * sc * k, by = y - 30 * sc * k;
    c.fillStyle = col; c.fillRect(x + w * .14, by, w * .72, y - by + 40);
    c.beginPath(); c.moveTo(x - w * .05, by + 4); c.quadraticCurveTo(x + w * .12, by - 2, x + w * .3, by - h); c.lineTo(x + w * .7, by - h); c.quadraticCurveTo(x + w * .88, by - 2, x + w * 1.05, by + 4); c.closePath(); c.fill();
    if (lit) { const fl = .75 + .25 * Math.sin(t * 5 + fx * 9); c.fillStyle = `rgba(255,196,90,${.85 * fl})`; c.fillRect(x + w * .3, by + 10 * sc, 9 * sc, 11 * sc); c.fillRect(x + w * .56, by + 10 * sc, 9 * sc, 11 * sc); }
  }
}
// 卷軸（秘傳之卷）
function scrollItem(c, x, y, s, rot) {
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s);
  aRR(c, -12, -5, 24, 10, 3); aFI(c, '#f4ead2', 1.6);
  c.fillStyle = '#c0262d'; c.fillRect(-2, -5, 4, 10);
  for (const sx of [-1, 1]) { aRR(c, sx * 12 - 2.5, -6.5, 5, 13, 2); aFI(c, '#6a3a1e', 1.4); }
  c.restore();
}
// 鳶的剪影（展翅，wing = 拍翅角度）
function kiteBird(c, x, y, s, wing, col) {
  c.save(); c.translate(x, y); c.scale(s, s); c.fillStyle = col;
  for (const sd of [-1, 1]) {
    c.beginPath(); c.moveTo(0, -2);
    c.quadraticCurveTo(sd * 18, -12 - wing * 10, sd * 40, -6 - wing * 14);
    for (let i = 0; i < 4; i++) c.lineTo(sd * (38 - i * 5), -1 - wing * (12 - i * 3) + (i % 2) * 4);
    c.quadraticCurveTo(sd * 14, 4, 0, 4); c.closePath(); c.fill();
  }
  aEll(c, 0, 1, 5, 9); c.fill(); aCirc(c, 0, -8, 4.5); c.fill();
  c.beginPath(); c.moveTo(-5, 8); c.lineTo(-7, 18); c.lineTo(0, 15); c.lineTo(7, 18); c.lineTo(5, 8); c.closePath(); c.fill();
  c.restore();
}
function cutFont(size) { return `900 ${size}px ${FONT}`; }

// ===== 點一下開始 =====
function drawTapScreen(t) {
  const c = ctx;
  nightSky(0, H, t); bigMoon(W * .7, H * .3, W * .2);
  for (const [fx, w] of [[.06, 16], [.18, 10], [.84, 14], [.95, 18]]) bambooSil(fx * W, 0, H, w, '#05060f', 3, t);
  roofs(H * .86, '#05060f', 1, t);
  c.fillStyle = '#05060f'; c.fillRect(0, H * .86, W, H * .14);
  c.globalAlpha = ez(t / .6);
  txt('NINJA 鳶 TOBI', W / 2, H * .58, 30, '#ffe28a', 'center', '#000', 6);
  c.globalAlpha *= .55 + .45 * Math.sin(t * 4);
  txt(t_('tap_start'), W / 2, H * .68, 17, '#ffffff', 'center', '#000', 4);
  c.globalAlpha = 1;
}
const t_ = k => (typeof t === 'function' ? t(k) : k);

// ===== 過場「月下的狼煙」 =====
// 畫面上下有黑邊；圖在中間（PY～PY+PH），下面的黑色區域放逐字出現的文字（致敬紅白機的過場）
function cutBox() { const PY = Math.max(H * .1, SAFE_T + 10); return { PY, PH: H * .62, TY: PY + H * .62 }; }
const CUT_LINES = [['cut1', 0], ['cut2', 1], ['cut3', 2]];
function drawCut(t) {
  const c = ctx, { PY, PH, TY } = cutBox();
  c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
  const shot = t < CUT_T[1] ? 0 : t < CUT_T[2] ? 1 : t < CUT_T[3] ? 2 : 3, st = t - CUT_T[shot];
  c.save(); c.beginPath(); c.rect(0, PY, W, PH); c.clip();
  if (shot === 0) cutShot1(st, PY, PH);
  else if (shot === 1) cutShot2(st, PY, PH);
  else if (shot === 2) cutShot3(st, PY, PH);
  else cutShot4(st, PY, PH);
  // 鏡頭切換時短暫黑場
  const into = st < .25 ? 1 - st / .25 : 0, outro = shot < 3 ? ez((st - (CUT_T[shot + 1] - CUT_T[shot] - .2)) / .2) : 0;
  if (into + outro > 0) { c.fillStyle = `rgba(0,0,0,${Math.min(1, into + outro)})`; c.fillRect(0, PY, W, PH); }
  c.restore();
  // 圖框
  c.strokeStyle = 'rgba(255,255,255,.18)'; c.lineWidth = 1; c.strokeRect(.5, PY - .5, W - 1, PH + 1);
  // 文字（逐字出現）
  if (shot < 3) {
    const s = t_(CUT_LINES[shot][0]), n = Math.min(s.length, Math.floor(Math.max(0, st - .35) * 16));
    c.font = cutFont(17); c.textAlign = 'left'; c.textBaseline = 'top'; c.fillStyle = '#fff';
    const lines = wrapCut(s.slice(0, n), W - 48);
    lines.forEach((ln, i) => c.fillText(ln, 24, TY + 22 + i * 26));
    if (n >= s.length && Math.sin(t * 8) > 0) { c.fillStyle = '#ffe28a'; c.beginPath(); c.moveTo(W - 34, TY + 22 + lines.length * 26); c.lineTo(W - 24, TY + 22 + lines.length * 26); c.lineTo(W - 29, TY + 28 + lines.length * 26); c.fill(); }
    if (n > INTRO.said) { if (n < s.length && n % 2 === 0) tone(980, .025, 'square', .012); INTRO.said = n; }
    if (st < .1) INTRO.said = -1;
  }
  txt(t_('cut_skip'), W - 12, H - 18, 11, 'rgba(255,255,255,.4)', 'right', null);
  // 最後的白光
  if (t >= CUT_FLASH) { c.fillStyle = `rgba(255,255,255,${ez((t - CUT_FLASH) / (CUT_END - CUT_FLASH))})`; c.fillRect(0, 0, W, H); }
}
function wrapCut(s, w) {
  const c = ctx, out = []; let line = '';
  for (const ch of s) { if (ch === '\n' || c.measureText(line + ch).width > w) { out.push(line); line = ch === '\n' ? '' : ch; } else line += ch; }
  out.push(line); return out;
}
// 鏡頭的音效（每個只響一次）
function cutSfx(t) {
  const once = (k, at, fn) => { if (t >= at && !INTRO.sfx[k]) { INTRO.sfx[k] = 1; fn(); } };
  once('wind', .2, () => SFX.wind());
  once('slam', CUT_T[1] + 1.45, () => SFX.impact());
  once('thunder', CUT_T[1] + 2, () => { SFX.thunder(); vib(80); });
  once('scroll', CUT_T[1] + 2.3, () => SFX.scroll());
  once('kira', CUT_T[2] + 1.4, () => SFX.item());
  once('seal', CUT_T[3] + .1, () => SFX.scroll());
  once('jump', CUT_T[3] + .9, () => SFX.dash());
  once('puff', CUT_T[3] + 1.25, () => SFX.kill());
  once('flash', CUT_FLASH, () => SFX.fever());
}

// 鏡頭 1：竹林之里的夜晚，大滿月，遠方山頂冒出紅色狼煙
function cutShot1(st, PY, PH) {
  const c = ctx, cam = st * 6;
  nightSky(PY, PY + PH, st);
  bigMoon(W * .68, PY + PH * .3 - st * 2, PH * .16);
  const px = W * .76, py = PY + PH * .46;
  c.fillStyle = '#1a1533'; c.beginPath(); c.moveTo(-10, PY + PH * .78); c.lineTo(W * .25, PY + PH * .6); c.lineTo(W * .48, PY + PH * .66); c.lineTo(px, py); c.lineTo(W + 10, PY + PH * .62); c.lineTo(W + 10, PY + PH); c.lineTo(-10, PY + PH); c.closePath(); c.fill();
  const gl = c.createRadialGradient(px, py, 2, px, py, 40); gl.addColorStop(0, 'rgba(255,80,40,.7)'); gl.addColorStop(1, 'rgba(255,80,40,0)'); c.fillStyle = gl; aCirc(c, px, py, 40); c.fill();
  for (let i = 0; i < 14; i++) { const a = (st * .35 + i / 14) % 1; c.fillStyle = `rgba(${200 - a * 60},${40 + a * 20},${40 + a * 30},${.6 * (1 - a)})`; aCirc(c, px + Math.sin(a * 4 + i) * 6 + a * 26, py - a * PH * .4, 4 + a * 16); c.fill(); }   // 狼煙
  c.save(); c.translate(-cam * .4, 0); roofs(PY + PH * .9, '#06050d', 1.1, st); c.restore();
  c.fillStyle = '#06050d'; c.fillRect(0, PY + PH * .9, W, PH * .1);
  for (const [fx, w] of [[.04, 18], [.14, 11], [.9, 15], [.98, 20]]) bambooSil(fx * W - cam * .8, PY - 10, PY + PH, w, '#030308', 4, st);
}
// 鏡頭 2：滿月前的真妖鬼剪影，舉棒一砸、閃電劈下，秘傳之卷被捲上天
function cutShot2(st, PY, PH) {
  const c = ctx;
  const shake = st > 1.45 && st < 1.9 ? (Math.random() - .5) * 8 : 0;
  c.save(); c.translate(shake, shake * .6);
  nightSky(PY, PY + PH, st, '#140a24', '#3a1a2e');
  const mx = W * .5, my = PY + PH * .42, mr = PH * .33;
  bigMoon(mx, my, mr);
  // 岩峰
  c.fillStyle = '#07040a'; c.beginPath(); c.moveTo(-10, PY + PH); c.lineTo(W * .2, PY + PH * .86); c.lineTo(W * .38, PY + PH * .76); c.lineTo(W * .5, PY + PH * .72); c.lineTo(W * .64, PY + PH * .77); c.lineTo(W * .82, PY + PH * .9); c.lineTo(W + 10, PY + PH); c.closePath(); c.fill();
  // 真妖鬼剪影（揮棒：1.0 秒起舉棒、1.45 秒砸下）
  const s = PH / 250, bx = mx, by = PY + PH * .72 - 44 * s;
  const skillT = st < 1 ? 9 : Math.max(0, .45 - (st - 1) / 1.0 * .45);
  const boss = { kind: 0, t: st + 1, skillT, warn: 0, shield: false };
  drawSil(bx, by, 190 * s, 150 * s, 95 * s, 85 * s, '#07040a', g2 => drawBoss(boss, 0, 0, s, g2));
  for (const sd of [-1, 1]) { bossGlow(c, bx + sd * 10 * s, by - 7 * s, 9 * s, 'rgba(255,200,60,.9)'); c.fillStyle = '#ffe24a'; aEll(c, bx + sd * 10 * s, by - 7 * s, 4 * s, 2 * s, sd * .35); c.fill(); }
  // 閃電
  if (st > 2 && st < 2.35) {
    const a = 1 - (st - 2) / .35;
    c.fillStyle = `rgba(255,255,255,${a * .75})`; c.fillRect(0, PY, W, PH);
    c.strokeStyle = `rgba(255,250,200,${a})`; c.lineWidth = 4; c.beginPath(); let lx = W * .22, ly = PY; c.moveTo(lx, ly);
    const r = aRng(5); while (ly < PY + PH * .7) { lx += (r() - .45) * 40; ly += 20 + r() * 20; c.lineTo(lx, ly); } c.stroke();
  }
  // 秘傳之卷：從村子被捲上天，飛進鬼的手裡
  if (st > 2.2) {
    const q = ez((st - 2.2) / 1.5), x0 = W * .1, y0 = PY + PH * .98, x1 = bx + 30 * s, y1 = by - 6 * s, cx = W * .12, cy = PY + PH * .05;
    const x = (1 - q) * (1 - q) * x0 + 2 * (1 - q) * q * cx + q * q * x1, y = (1 - q) * (1 - q) * y0 + 2 * (1 - q) * q * cy + q * q * y1;
    for (let i = 0; i < 6; i++) { c.fillStyle = `rgba(255,230,150,${.5 - i * .08})`; aCirc(c, x - (x1 - x0) * .02 * i, y + i * 4, 3 - i * .4); c.fill(); }
    if (q >= 1) bossGlow(c, x, y, 26, 'rgba(255,220,120,.6)');
    scrollItem(c, x, y, 1.2, q < 1 ? st * 9 : .3);
  }
  c.restore();
}
// 鏡頭 3：主角眼睛的大特寫，閉眼 →「唰」地睜開，背景有速度線
function cutShot3(st, PY, PH) {
  const c = ctx, by0 = PY + PH * .27, bh = PH * .46;
  c.fillStyle = '#000'; c.fillRect(0, PY, W, PH);
  c.save(); c.beginPath(); c.rect(0, by0, W, bh); c.clip();
  const bg = c.createLinearGradient(0, by0, 0, by0 + bh); bg.addColorStop(0, '#2a0c14'); bg.addColorStop(1, '#5a1420'); c.fillStyle = bg; c.fillRect(0, by0, W, bh);
  const r = aRng(9); c.strokeStyle = 'rgba(255,255,255,.22)'; c.lineWidth = 2;
  for (let i = 0; i < 18; i++) { const y = by0 + r() * bh, x = ((r() * W * 2 - st * 900 * (.6 + r())) % (W * 1.4) + W * 1.4) % (W * 1.4) - W * .2; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 60 + r() * 80, y); c.stroke(); }
  const zq = ez((st - 2.1) / 1.1), S = lerp2(W / 26, W / 62, zq), ax = lerp2(4.4, 0, zq), ay = lerp2(-27.2, -24, zq);
  const mood = st < 1.4 ? 'blink' : st < 2.4 ? 'open' : 'focus';
  c.save(); c.translate(W / 2 - ax * S, by0 + bh / 2 - ay * S); c.scale(S, S);
  drawHeroNinja(0, 0, { face: 1, t: st * 1.6 + 3, vy: 0, skin: save.skin, eye: mood }, c);
  c.restore();
  if (st > 1.4 && st < 2.1) {   // 睜眼的閃光
    const k = (st - 1.4) / .7, a = 1 - k;
    for (const [ex, sz] of [[-2.6, 1], [10.6, 1.15]]) {
      const x = W / 2 + (ex * 1.1 - ax) * S, y = by0 + bh / 2 + (-27.2 - 2 - ay) * S;
      c.save(); c.translate(x, y); c.rotate(k * 1.5); c.globalAlpha = a; c.fillStyle = '#fff';
      const R = (10 + k * 26) * sz; c.beginPath(); for (let i = 0; i < 8; i++) { const rr2 = i % 2 ? R * .18 : R, an = i * Math.PI / 4; c.lineTo(Math.cos(an) * rr2, Math.sin(an) * rr2); } c.closePath(); c.fill(); c.restore();
    }
    c.fillStyle = `rgba(255,255,255,${(1 - k) * .35})`; c.fillRect(0, by0, W, bh);
  }
  c.restore();
  c.fillStyle = '#fff'; c.fillRect(0, by0 - 2, W, 2); c.fillRect(0, by0 + bh, W, 2);
}
// 鏡頭 4：屋頂上結印 → 跳起化成鳶的黑影 → 跳進竹林，鏡頭往上捲
function cutShot4(st, PY, PH) {
  const c = ctx, tun = ez((st - 2.05) / .35);
  if (tun < 1) {
    c.save(); c.translate(0, ez((st - 1.9) / .5) * PH * .5);
    nightSky(PY - PH, PY + PH, st);
    bigMoon(W * .72, PY + PH * .28, PH * .19);
    roofs(PY + PH * .84, '#0b0a18', 1.5, st, false);
    c.fillStyle = '#0b0a18'; c.fillRect(0, PY + PH * .84, W, PH * .3);
    const hx = W * .32, ridge = PY + PH * .84 - 30 * 1.5 * .8 - 34 * 1.5 * .8 + 2;
    if (st < .95) {   // 結印：背後浮現忍術陣
      const q = ez(st / .5), rr2 = 74 * q;
      c.save(); c.translate(hx, ridge - 40); c.rotate(st * 2.5); c.globalAlpha = .9;
      c.strokeStyle = '#ffe28a'; c.lineWidth = 3; c.setLineDash([7, 5]); aCirc(c, 0, 0, rr2); c.stroke(); c.setLineDash([]); aCirc(c, 0, 0, rr2 * .78); c.stroke();
      c.restore();
      if (q > .6) { c.globalAlpha = (q - .6) / .4; for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + st * 2.5; txt('忍', hx + Math.cos(a) * rr2 * .89, ridge - 40 + Math.sin(a) * rr2 * .89, 16, '#ffe28a', 'center', '#000', 4); } c.globalAlpha = 1; }
    }
    if (st < 1.25) {   // 主角（彩色）：結印 → 起跳
      const jq = ez((st - .9) / .35), y = ridge - jq * PH * .3;
      c.save(); c.translate(hx, y); c.scale(2, 2);
      drawHeroNinja(0, 0, { face: 1, t: st + 2, vy: st < .9 ? 0 : -900, skin: save.skin, eye: st < .9 ? 'focus' : undefined, spin: st > .9 ? .45 - (st - .9) * 1.2 : 0 }, c);
      c.restore();
    } else {   // 化煙 → 鳶的黑影飛過月亮、往竹林深處
      const pq = (st - 1.25) / .5;
      if (pq < 1) { c.globalAlpha = 1 - pq; for (let i = 0; i < 7; i++) { const a = i / 7 * TAU; c.fillStyle = i % 2 ? '#e8ecef' : '#c7cdd3'; aCirc(c, hx + Math.cos(a) * 26 * (.4 + pq), ridge - PH * .3 - 20 + Math.sin(a) * 18 * (.4 + pq), 16 * (1 - pq * .4)); c.fill(); } c.globalAlpha = 1; }
      const q = ez((st - 1.25) / .9), x0 = hx, y0 = ridge - PH * .3 - 24, x1 = W * .8, y1 = PY + PH * .14;
      const bxp = lerp2(x0, x1, q), byp = lerp2(y0, y1, q) - Math.sin(q * Math.PI) * PH * .12;
      kiteBird(c, bxp, byp, lerp2(1.4, .45, q), Math.sin(st * 14), '#05040c');
    }
    c.restore();
  }
  if (tun > 0) {   // 竹林隧道：竹子往下飛快掠過，鳶往上飛
    c.globalAlpha = tun;
    const tt = st - 2.05;
    nightSky(PY, PY + PH, st, '#12463a', '#2a7a5a');
    const r = aRng(21);
    for (let i = 0; i < 9; i++) { const x = r() * W, w = 10 + r() * 18, col = r() < .5 ? '#0e3a2c' : '#08241b'; const off = (tt * (700 + r() * 500) + r() * 400) % 160; c.fillStyle = col; c.fillRect(x - w / 2, PY, w, PH); for (let yy = PY - 160 + off; yy < PY + PH; yy += 160) c.fillRect(x - w / 2 - 2, yy, w + 4, 4); }
    c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 1.5; for (let i = 0; i < 14; i++) { const x = r() * W, l = 30 + r() * 60, y = PY + ((r() * PH + tt * 1400) % PH); c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + l); c.stroke(); }
    kiteBird(c, W / 2 + Math.sin(tt * 3) * 18, PY + PH * .5 - tt * 40, 1.3, Math.sin(st * 16), '#020806');
    c.globalAlpha = 1;
  }
}

// ===== 標題背景：夜空、滿月、竹林，主角剪影在竹子間跳躍、化煙瞬移 =====
const TH = { mode: 'cling', t: 0, dur: 1, i: 0, x: 0, y: 0, x0: 0, y0: 0, x1: 0, y1: 0, face: 1, vis: 1, spin: 0, puffs: [] };
const titleStalks = () => [.085, .32, .75, .915].map(f => f * W);
function titleHero(dt) {
  const h = TH; h.t += dt;
  for (const p of h.puffs) p.t += dt; h.puffs = h.puffs.filter(p => p.t < .5);
  const xs = titleStalks();
  if (!h.x) { h.i = 0; h.x = xs[0] + 9; h.y = H * .6; h.mode = 'cling'; h.t = 0; h.dur = 1; }
  if (h.t < h.dur) {
    if (h.mode === 'hop') { const q = h.t / h.dur; h.x = lerp2(h.x0, h.x1, q); h.y = lerp2(h.y0, h.y1, q) - Math.sin(q * Math.PI) * H * .14; }
    return;
  }
  // 決定下一個動作
  const pickStalk = () => { let j; do j = Math.random() * xs.length | 0; while (j === h.i); return j; };
  if (h.mode === 'warp' && !h.vis) { h.vis = 1; h.puffs.push({ x: h.x, y: h.y - 18, t: 0 }); h.mode = 'cling'; h.t = 0; h.dur = .6 + Math.random() * .6; return; }
  if (h.mode !== 'cling') { h.mode = 'cling'; h.t = 0; h.dur = .5 + Math.random() * .8; h.face = h.x < W / 2 ? 1 : -1; return; }
  const j = pickStalk(), side = xs[j] < W / 2 ? 9 : -9, ny = H * (.36 + Math.random() * .42);
  if (Math.random() < .3) {   // 化煙瞬移
    h.puffs.push({ x: h.x, y: h.y - 18, t: 0 }); h.vis = 0; h.mode = 'warp'; h.t = 0; h.dur = .35; h.i = j; h.x = xs[j] + side; h.y = ny;
  } else {
    h.mode = 'hop'; h.t = 0; h.dur = .7 + Math.random() * .25; h.x0 = h.x; h.y0 = h.y; h.x1 = xs[j] + side; h.y1 = ny; h.i = j;
    h.face = h.x1 > h.x0 ? 1 : -1; h.spin = Math.random() < .4 ? 1 : 0;
  }
}
function drawTitleBG(t) {
  const c = ctx, g2 = c.createLinearGradient(0, 0, 0, H); g2.addColorStop(0, '#0d2a2a'); g2.addColorStop(1, '#13443a'); c.fillStyle = g2; c.fillRect(0, 0, W, H);
  const r = aRng(3); for (let i = 0; i < 34; i++) { const x = r() * W, y = r() * H * .6, tw = .5 + .5 * Math.sin(t * 2.4 + i); c.fillStyle = `rgba(230,255,240,${.15 + tw * .4})`; c.fillRect(x, y, 1.4, 1.4); }
  bigMoon(W * .74, H * .2, W * .15);
  for (const [fx, w] of [[.2, 9], [.55, 8], [.66, 11]]) bambooSil(fx * W, -10, H, w, '#0f3a2c', 3, t);   // 遠景竹子
  const xs = titleStalks(); [16, 13, 19, 12].forEach((w, i) => bambooSil(xs[i], -10, H, w, '#134a38', 2.5, t));
  // 主角剪影
  const h = TH;
  if (h.vis) {
    const q = h.mode === 'hop' ? h.t / h.dur : 0, vy = h.mode === 'hop' ? (q < .5 ? -600 : 500) : 0;
    const spin = h.mode === 'hop' && h.spin ? .45 * (1 - q) : 0;
    drawSil(h.x, h.y, 100, 100, 50, 84, 'rgba(4,22,17,.92)', g3 => drawHeroNinja(0, 0, { face: h.face, t, vy, skin: 0, spin }, g3));
  }
  for (const p of h.puffs) { const k = p.t / .5; c.globalAlpha = (1 - k) * .8; for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; c.fillStyle = i % 2 ? '#cfe3da' : '#9fc2b4'; aCirc(c, p.x + Math.cos(a) * 14 * (.5 + k), p.y + Math.sin(a) * 10 * (.5 + k) - k * 8, 9 * (1 - k * .3)); c.fill(); } c.globalAlpha = 1; }
}
// 待機展示：黑邊滑入，主角剪影在滿月前連跳三下，最後四鬼的眼睛在山脊上亮起
function drawAttract(a) {
  const c = ctx, fin = ez(a / .5), fout = ez((ATTRACT_T - a) / .5), k = Math.min(fin, fout);
  c.globalAlpha = k;
  nightSky(0, H, a, '#08101e', '#1d1a38');
  const mr = W * .32; bigMoon(W / 2, H * .42, mr);
  c.fillStyle = '#04030a'; c.beginPath(); c.moveTo(-10, H * .76); for (let i = 0; i <= 8; i++) c.lineTo(i / 8 * W, H * (.72 + (i % 2) * .04)); c.lineTo(W + 10, H); c.lineTo(-10, H); c.closePath(); c.fill();
  if (a < 4.4) {   // 主角連跳三下橫越滿月
    const q = a / 4.4, hop = q * 3 % 1, x = lerp2(-40, W + 40, q), y = H * .72 - Math.sin(hop * Math.PI) * H * .2;
    drawSil(x, y, 130, 130, 65, 110, '#04030a', g3 => { g3.scale(1.3, 1.3); drawHeroNinja(0, 0, { face: 1, t: a, vy: hop < .5 ? -700 : 500, skin: 0, spin: hop > .3 && hop < .7 ? .45 * (1 - (hop - .3) / .4) : 0 }, g3); });
  } else {   // 四鬼的眼睛
    const e = ez((a - 4.4) / .5);
    [['#ffe24a', .2], ['#e0b8ff', .4], ['#8ae0ff', .6], ['#ff6a2a', .8]].forEach(([col, fx], i) => {
      const x = W * fx, y = H * .66 + (i % 2) * 10, ae = e * (.6 + .4 * Math.sin(a * 6 + i));
      for (const sd of [-1, 1]) { bossGlow(c, x + sd * 9, y, 14 * ae, col); c.fillStyle = col; c.globalAlpha = k * ae; aEll(c, x + sd * 9, y, 5, 2.2, sd * .35); c.fill(); }
      c.globalAlpha = k;
    });
  }
  const bar = H * .1 * fin * fout; c.fillStyle = '#000'; c.fillRect(0, 0, W, bar + SAFE_T * k); c.fillRect(0, H - bar, W, bar);
  txt('NINJA 鳶 TOBI', W / 2, H - bar / 2 - 2, 15, '#ffe28a', 'center', null);
  c.globalAlpha = 1;
}
