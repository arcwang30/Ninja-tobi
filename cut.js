'use strict';
/* NINJA 鳶 TOBI — 開場演出（在 art.js 之後、game.js 之前載入；用到的 ctx、W、H、save… 都在呼叫時才讀取）
   流程（每次啟動）：團隊 LOGO（開機遮罩，等畫面尺寸量穩才淡出）→ 點一下開始 → 過場「月下的狼煙」→ 白光接標題
   標題畫面：背景是遊戲關卡的捲動背景（四幕隨機輪播）；主角輪流在兩個地方出現——
     「前景」：用忍術陣現身的大圖；「背景」：在左右竹牆間蹬牆跳的剪影。一邊消失時，另一邊就用忍術傳送出來
   閒置一陣子會播一小段待機展示，再回到標題 */
const INTRO = {
  ph: 'boot',        // boot | tap | cut | title
  t: 0, flash: 0, idle: 0, attract: -1, said: -1, sfx: {},
  cyc: 'front', ct: 0,   // 標題主角輪播：front 前景大圖／bg 背景剪影
  // 開機遮罩淡出後開始
  begin() {
    this.ph = 'tap'; this.t = 0;
    // 預覽用：網址加 ?cutshot=秒數 會停在過場的那一刻（截圖檢查用）
    const q = new URLSearchParams(location.search).get('cutshot');
    if (q !== null && !isNaN(+q)) { this.ph = 'cut'; this.t = +q; this.frozen = true; const b = $('boot'); if (b) b.remove(); }
    if (new URLSearchParams(location.search).has('still')) document.head.insertAdjacentHTML('beforeend', '<style>*,*::before,*::after{animation-duration:0s!important;animation-delay:0s!important;transition:none!important}</style>');   // 開發用：?still 讓 CSS 動畫直接跳到結束畫面（截圖用）
    const bg0 = new URLSearchParams(location.search).get('bg'); if (bg0 !== null) TB.cur = +bg0;   // 開發用：?bg=0～3 固定標題背景的幕
    if (new URLSearchParams(location.search).has('skip')) this.toTitle();   // 開發用：網址加 ?skip 直接到標題
    if (new URLSearchParams(location.search).has('still')) this.flash = 0;
    const skq = new URLSearchParams(location.search).get('skin'); if (skq) save.skin = +skq;   // 開發用：?skin=角色編號
    const lg = new URLSearchParams(location.search).get('lang'); if (lg) { LI = Math.max(0, LANGS.findIndex(l => l.id === lg)); applyLang(); buildDockIcons(); }   // 開發用：?lang=zh|ja|en
    const op = new URLSearchParams(location.search).get('open');   // 開發用：?open=help(,頁) ／ credit → 直接打開說明或製作名單
    if (op) { this.toTitle(); const [w, pg] = op.split(','); if (w === 'help') { helpPg = +pg || 0; openHelp(); } else if (w === 'hist') { openHist(); histTab = +pg || 0; renderHist(); } else if (w === 'cont' || w === 'ad' || w === 'overad') { save.seen = 2; startRun(0); hideAll(); state = 'play'; g.zi = null; for (let i = 0; i < 90; i++) update(1 / 60); if (w === 'overad') { g.coins = 120; showOver(); } else { g.p.inv = 0; g.hp = 0; die(); clearInterval(contIv); if (w === 'ad') { ADS.fakeT = 2; ADS.show(); } } } else if (w === 'full' || w === 'lvlock') { save.full = false; if (w === 'full') { openLvSel(); openFull(pg ? 'boss' : 'lv'); } else openLvSel(); } else { if (w === 'shop') shopTab = +pg || 0; if (w === 'rank') rankTab = +pg || 0; openSub(w); } const b = $('boot'); if (b) b.remove(); }
    // 開發用：?slashshot=敵人種類,第幾刀,這一刀經過秒數 → 停在斬擊特寫的那一刻（截圖檢查用）
    const ss = new URLSearchParams(location.search).get('slashshot');
    // 開發用：?shot=zintro,幕,秒 ／ ascend,幕,秒 ／ qte,第幾刀,這一刀經過秒數 → 停在關卡演出的那一刻（stagefx.js）
    const sh = new URLSearchParams(location.search).get('shot');
    if (sh) { const [k, a1, a2] = sh.split(','); this.toTitle(); save.seen = 2; startRun(+(new URLSearchParams(location.search).get('lv') || 0)); hideAll();   /* ?lv=關卡 */ const b = $('boot'); if (b) b.remove(); g.stage = +a1; g.bossN = +a1;
      if (k === 'zintro') { startZIntro(); g.zi.t = +a2; window.updateZIntro = () => {}; }
      if (k === 'ascend') { startAscend(); g.asc.t = +a2; window.updateAscend = () => {}; }
      if (k === 'qte') { g.stage = 0; spawnBoss(); g.boss.y = g.camY + 200; g.qte = { t: .5, hits: +a1 ? [{ a: .6, t: +a2, x: 0, y: 0 }] : [], n: +a1, rings: [{ x: W / 2 + 40, y: H * .45, t0: 0, res: null, rt: 0 }], log: ['perf'], i: 2, cnt: 3, perf: 1, next: 99, fl: 0, end: 0, dur: .95, R0: 120, RT: 34 }; state = 'qte'; window.updateQte = () => {}; } }
    // 預覽用：?finshow=關卡 → 直接看那一關第 10 舞台的擊倒演出（點一下開始，有音樂；播完自動重播，不會改到存檔）
    const fs = new URLSearchParams(location.search).get('finshow');
    if (fs !== null) { this.toTitle(); save.seen = 2; startRun(+fs || 0); hideAll(); const bt = $('boot'); if (bt) bt.remove();
      g.zi = null; state = 'play'; g.stage = 9; g.hp = g.maxHp = 9999; spawnBoss(); g.banner = null; g.preview = true;
      for (let i = 0; i < 90; i++) { g.p.inv = 1; update(1 / 60); } paused = true; toast('點一下開始播放 / Tap to play');
      addEventListener('pointerdown', () => { paused = false; g.qte = { kill: true }; endQte(); }, { once: true, capture: true }); }
    // 開發用：?play=關卡,舞台,模擬秒數 → 直接從某關某舞台開始，自動跑幾秒後停住（檢查時段色調與天候）
    const pl = new URLSearchParams(location.search).get('play');
    if (pl) { const [lv, st, sec, ch, sl] = pl.split(',').map(Number); this.toTitle(); save.seen = 2; if (ch) save.skin = ch; startRun(lv || 0); if (sl) g.skills[SKINS[save.skin].sk] = sl; hideAll();   /* 第 4、5 個參數：角色、技能等級 */ const b = $('boot'); if (b) b.remove();
      g.stage = st || 0; g.zi = null; state = 'play'; wxForStage(); if (g.wx) g.wx.cur = g.wx.lv; if (g.stage % 5 === 4) { spawnBoss(); g.wx.cur = g.wx.lv; }
      g.hp = g.maxHp = 9999; for (let i = 0; i < (sec || 2) * 60; i++) { g.lvQueue = 0; g.p.inv = 1; update(1 / 60); if (state === 'perk') { hide('perk'); state = 'play'; } } paused = true; }
    // 開發用：?tut=第幾步（0 起）→ 停在新手教學的那一步；&pauseui → ?play 跑完後打開暫停畫面（看技能列表）
    const tq = new URLSearchParams(location.search).get('tut');
    if (tq !== null) { this.toTitle(); startTutorial(); hideAll(); const b = $('boot'); if (b) b.remove(); g.tut.i = +tq; TUT_STEPS[g.tut.i].start(); for (let i = 0; i < 40; i++) update(1 / 60); paused = true; }
    if (pl && new URLSearchParams(location.search).has('pauseui')) { g.skills = { shuriken: 3, kunai: 6, thunder: 2, barrier: 1 }; g.perks = { bounce: 2, magnet: 1, hp: 3, vamp: 1 }; g.lv = 14; renderPauseSkills(); show('pause', true); }
    if (pl && new URLSearchParams(location.search).has('shdemo')) { g.skills = { shuriken: 3, kunai: 6, thunder: 2, barrier: 1 }; g.perks = { bounce: 2, magnet: 1, hp: 3, vamp: 1 }; g.lv = 14; g.scrolls = 2; g.bonus += 4200; }   // 開發用：側邊資訊欄的展示資料
    if (pl && new URLSearchParams(location.search).has('foetest')) { g.enemies = []; g.eshots = []; [0, 1, 2, 3, 4, 5, 6, 9, 7, 8, 10, 12].forEach((ty, i) => { const e = mkEnemy(ty, 70 + (i % 4) * 95, g.camY + 150 + Math.floor(i / 4) * 130, 0); e.amp = 0; e.bx = e.x; if (ty === 7) { e.by = e.y; e.vx = -1; } g.enemies.push(e); }); const m = mkEnemy(13, W / 2, g.camY + H - 210, 0); m.hp = m.max = 9; g.enemies.push(m); [[0, 'a'], ['arrow', 'b'], ['web', 'c'], ['ember', 'd'], ['frost', 'e']].forEach(([k], i) => g.eshots.push({ x: 50 + i * 60, y: g.camY + 560, vx: 120, vy: 20, t: .3, kind: k || undefined, skin: g.th })); for (let i = 0; i < 5; i++) g.fires.push({ x: 60 + i * 14, y: g.camY + H - 70, t: i * .2 }); g.mists.push({ x: W - 70, y: g.camY + H - 90, r: 60, t: .6 }); }   // 開發用：把這關所有敵人排出來檢查造型
    if (ss) { const [ty, n, lt] = ss.split(',').map(Number); this.toTitle(); save.seen = 2; startRun(); hideAll(); const e = mkEnemy(ty, W / 2, g.p.y - 120, 0); g.enemies.push(e); g.slash = { e, t: .5, dur: 9, lines: n ? [{ a: .6, t: lt, off: 0 }] : [], n, nextL: 9, frozen: true }; state = 'slash'; const b = $('boot'); if (b) b.remove(); }
  },
  // 進入過場（重看開場也從這裡開始）
  playCut() { hideAll(); this.ph = 'cut'; this.t = 0; this.said = -1; this.sfx = {}; },
  // 故事結尾 →「竹簾開幕」：轉暗 → 竹簾 → 鳶從下往上飛出畫面 → LOGO 蓋章在竹簾上 → 竹簾左右拉開、標題背景亮起 → 主角現身
  startOutro() { this.ph = 'outro'; this.t = 0; this.logoOn = false; },
  outroLogo() {   // 標題畫面先出現，但選單藏起來，只播 LOGO 蓋章
    if (this.logoOn) return; this.logoOn = true;
    if (state === 'menu') show('title');
    $('title').classList.add('curtain');
    const it = $('intro'); it.classList.remove('play', 'hero-in', 'hero-out'); void it.offsetWidth; it.classList.add('logo-only');
  },
  endOutro() {
    this.outroLogo();
    this.ph = 'title'; this.flash = 0; this.idle = 0; this.endAttract();
    $('title').classList.remove('curtain'); $('intro').classList.remove('logo-only');
    this.cyc = 'front'; this.ct = 0; TH.vis = 0; this.heroAnim('hero-in');   // 主角從忍術陣現身、選單淡入
  },
  replay() { this.playCut(); },
  // 接到標題：顯示標題選單並播放 LOGO 蓋章＋忍術陣現身
  toTitle() {
    this.ph = 'title'; this.flash = 1; this.idle = 0; this.endAttract();
    if (state === 'menu') { show('title'); playIntro(); }
  },
  // 標題的主角輪播：前景現身（playIntro 也會呼叫）
  heroFront() { this.cyc = 'front'; this.ct = 0; TH.vis = 0; poofAt(.85); },
  heroAnim(cls) { const it = $('intro'); it.classList.remove('play', 'hero-in', 'hero-out'); void it.offsetWidth; it.classList.add(cls); poofAt(cls === 'hero-in' ? .4 : .05); },
  // 畫布被點擊（只有開場階段會收到；回傳 true 表示已處理）
  tap() {
    if (this.ph === 'tap') { if (this.t > .3) { if (TRANS_K) { this.ph = 'trans'; this.t = 0; this.sfx = {}; } else this.playCut(); } return true; }
    if (this.ph === 'trans') { this.playCut(); return true; }   // 銜接演出：點一下直接進故事
    if (this.ph === 'cut') { if (this.t < CUT_FLASH) this.t = CUT_FLASH; return true; }
    if (this.ph === 'outro') { if (this.t > .3) this.endOutro(); return true; }   // 竹簾開幕：點一下直接到標題
    return false;
  },
  // 任何點擊或按鍵：重新計算閒置時間、結束待機展示
  poke() { this.idle = 0; if (this.attract >= 0) this.endAttract(); },
  endAttract() { this.attract = -1; const el = $('title'); if (el) el.classList.remove('attract'); },
  update(dt) {
    if (this.frozen) return;
    this.t += dt;
    if (this.ph === 'trans') { transSfx(this.t); if (this.t >= TRANS_T[TRANS_K]) this.playCut(); return; }
    if (this.ph === 'outro') { outroCue(this.t - dt, this.t); if (this.t >= OUT_T) this.endOutro(); return; }
    if (this.ph === 'cut') {
      cutSfx(this.t);
      if (this.t >= CUT_END) this.startOutro();   // 接「竹簾開幕」再到標題
    } else if (this.ph === 'title') {
      if (this.flash > 0) this.flash = Math.max(0, this.flash - dt / .7);
      titleBgUpdate(dt); frontHeroUpdate(dt);
      // 主角輪播：前景 7 秒 → 化煙消失、背景剪影現身；背景 9 秒 → 剪影化煙、前景用忍術陣傳送出來
      this.ct += dt;
      if (this.cyc === 'front' && this.ct >= FRONT_T) { this.cyc = 'bg'; this.ct = 0; this.heroAnim('hero-out'); TH.wait = .55; }
      else if (this.cyc === 'bg') {
        if (TH.wait > 0) { TH.wait -= dt; if (TH.wait <= 0) titleHeroShow(); }
        else titleHero(dt);
        if (this.ct >= BACK_T && TH.mode !== 'hop') { titleHeroHide(); this.cyc = 'front'; this.ct = 0; this.heroAnim('hero-in'); }
      }
      const onlyTitle = $('title').classList.contains('on') && !document.querySelector('.scr.on:not(#title)');
      if (this.attract >= 0) { this.attract += dt; if (this.attract >= ATTRACT_T) { this.endAttract(); this.idle = 0; } }
      else if (onlyTitle) { this.idle += dt; if (this.idle >= IDLE_T) { this.attract = 0; $('title').classList.add('attract'); } }
      else this.idle = 0;
      for (const p of TH.puffs) p.t += dt; TH.puffs = TH.puffs.filter(p => p.t < .5);
    }
  },
  draw() {
    const c = ctx;
    if (this.ph === 'boot') { c.fillStyle = '#000'; c.fillRect(0, 0, W, H); return; }
    if (this.ph === 'tap') return drawTapScreen(this.t);
    if (this.ph === 'trans') return drawTrans(this.t);
    if (this.ph === 'outro') return drawOutro(this.t);
    if (this.ph === 'cut') return drawCut(this.t);
    drawTitleBG(performance.now() / 1000); drawFrontHero(performance.now() / 1000); drawPoofs();
    if (this.attract >= 0) drawAttract(this.attract);
    if (this.flash > 0) { c.fillStyle = `rgba(255,255,255,${this.flash})`; c.fillRect(0, 0, W, H); }
  },
};
const CUT_T = [0, 4.2, 8.6, 12.2, 15.6];   // 五個鏡頭的開始時間
const CUT_FLASH = 15.6, CUT_END = 16.05, IDLE_T = 15, ATTRACT_T = 6.5, FRONT_T = 10, BACK_T = 9;
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
function scrollItem(c, x, y, s, rot, ch, col = '#c0262d') {   // ch：卷上的字（風／林／火／山），col：綁繩顏色
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s);
  aRR(c, -12, -5, 24, 10, 3); aFI(c, '#f4ead2', 1.6);
  c.fillStyle = col; c.fillRect(-2, -5, 4, 10);
  for (const sx of [-1, 1]) { aRR(c, sx * 12 - 2.5, -6.5, 5, 13, 2); aFI(c, '#6a3a1e', 1.4); }
  if (ch) { c.rotate(-rot * .6); aCirc(c, 0, -11, 5.2); aFI(c, col, 1.2); c.fillStyle = '#fff'; c.font = '900 6.5px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(ch, 0, -10.6); }
  c.restore();
}
// 風林火山四卷：字與綁繩顏色
const CUT_SCROLLS = [['風', '#3a8ad8'], ['林', '#2e9a5a'], ['火', '#d8402a'], ['山', '#7a4ac0']];
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
  c.globalAlpha *= .55 + .45 * Math.sin(t * 4);   // （「NINJA 鳶 TOBI」字樣已移除，只留「點一下開始」）
  txt(t_('tap_start'), W / 2, H * .68, 17, '#ffffff', 'center', '#000', 4);
  c.globalAlpha = 1;
  if (t < .6) { c.fillStyle = `rgba(0,0,0,${1 - ez(t / .6)})`; c.fillRect(0, 0, W, H); }   // 從開機遮罩的全黑淡入
}
const t_ = k => (typeof t === 'function' ? t(k) : k);

// ===== 「點一下開始」→ 故事的銜接演出（原型：?trans=A 推進月亮／?trans=D 拍子木＋墨染；未指定時維持原本直接切換） =====
// 正式採用 A；?trans=D 可再看 D，?trans=0 回到直接切換
const TRANS_K = (q => (q === 'D' ? 'D' : q === '0' ? null : 'A'))((new URLSearchParams(location.search).get('trans') || '').toUpperCase());
// 柔和的長音（慢慢浮現、慢慢消失），開場銜接的和聲墊底用
function softPad(f, dur, vol, delay = 0, type = 'sine') {
  if (!sfxV() || !ac) return;
  const t0 = ac.currentTime + delay, o = ac.createOscillator(), gn = ac.createGain(), v = vol * sfxV();
  o.type = type; o.frequency.setValueAtTime(f, t0);
  gn.gain.setValueAtTime(0, t0); gn.gain.linearRampToValueAtTime(v, t0 + dur * .45); gn.gain.linearRampToValueAtTime(0, t0 + dur);
  o.connect(gn).connect(ac.destination); o.start(t0); o.stop(t0 + dur + .05);
}
// 琴的撥弦：三角波＋高八度的正弦泛音，快速起音、自然衰減
function koto(f, delay, vol = .04) { tone(f, .9, 'triangle', vol, 0, delay); tone(f * 2, .5, 'sine', vol * .3, 0, delay + .005); }
const TRANS_T = { A: 1.5, D: 1.8 };
// 音效：一開始就把整段排好（錄影時也能直接離線算出來）
function transSound(k) {
  if (k === 'A') {   // 夜風 → 都節音階（E F A B C）的琴音往上撥，主旋律下面加一聲四度和音、裝飾音 → 最高音「押し手」滑下來 → 風鈴
    noise(1.1, .01);                                              // 很輕的夜風
    const N = { B4: 493.9, E5: 659.3, F5: 698.5, A5: 880, B5: 987.8, C6: 1046.5, E6: 1318.5, F6: 1396.9 };
    // 主旋律：B4（拾音）→ E5 F5 A5 B5 C6 → E6
    [['B4', .26], ['E5', .36], ['F5', .45], ['A5', .54], ['B5', .63], ['C6', .72], ['E6', .84]].forEach(([n, d], i) => koto(N[n], d, .03 + i * .002));
    // 和音：在 E5、A5、E6 底下各加一聲四度／五度，聽起來更飽滿
    [[N.B4, .36], [N.E5, .54], [N.B5, .84]].forEach(([f, d]) => koto(f, d + .01, .016));
    // 裝飾音：C6 前面一個快速的 B5→C6 倚音
    koto(N.B5, .69, .014);
    // 最高音「押し手」：F6 輕輕滑落到 E6（琴特有的推弦）
    tone(N.F6, .8, 'triangle', .022, N.E6 - N.F6, .98);
    // 風鈴：主音＋五度＋八度，長長的餘韻（略帶走音的第二顆鈴讓聲音有光澤）
    for (const [f, v, d] of [[1318.5, .032, 0], [1975.5, .016, .02], [2637, .009, .04], [1318.5 * 1.006, .014, .06]]) tone(f, 1.6, 'sine', v, 0, 1.14 + d);
  } else {   // 拍子木「咔、咔！」→ 低沉的鼓聲＋墨暈開 →「序」
    for (const d of [.05, .4]) { noise(.04, .14, d); tone(2400, .06, 'square', .05, -900, d); tone(1150, .09, 'triangle', .07, 0, d); }
    tone(90, .7, 'sine', .14, -40, .6); noise(.6, .05, .6);
    tone(659.3, .9, 'triangle', .035, 0, 1.0); tone(329.6, .9, 'triangle', .03, 0, 1.0);
  }
}
function transSfx(tt) { if (!INTRO.sfx.trans) { INTRO.sfx.trans = 1; transSound(TRANS_K); } }
function drawTrans(t) {
  const c = ctx, T = performance.now() / 1000, cl = x => Math.max(0, Math.min(1, x));
  if (TRANS_K === 'A') {   // 推進月亮：竹子往兩側滑開、屋頂下沉、月亮放大成白光、上下黑邊滑入
    const k = ez(cl(t / 1.25)), kb = ez(cl((t - .3) / .9));
    nightSky(0, H, T);
    bigMoon(W * (.7 - .2 * k), H * (.3 + .1 * k), W * .2 * (1 + 3.2 * k));
    for (const [fx, w] of [[.06, 16], [.18, 10], [.84, 14], [.95, 18]]) bambooSil(fx * W + Math.sign(fx - .5) * W * .7 * k, 0, H, w * (1 + 1.5 * k), '#05060f', 3, T);
    roofs(H * (.86 + .35 * k), '#05060f', 1, T); c.fillStyle = '#05060f'; c.fillRect(0, H * (.86 + .35 * k), W, H);
    const wa = ez(cl((t - .85) / .45)); if (wa > 0) { c.fillStyle = `rgba(255,252,236,${wa})`; c.fillRect(0, 0, W, H); }
    const { PY, PH } = cutBox(); c.fillStyle = '#000'; c.fillRect(0, 0, W, PY * kb); c.fillRect(0, H - (H - PY - PH) * kb, W, (H - PY - PH) * kb);
    if (t > 1.3) { c.fillStyle = `rgba(0,0,0,${cl((t - 1.3) / .2)})`; c.fillRect(0, 0, W, H); }   // 白光→黑場，接故事第一個鏡頭
  } else {   // 拍子木＋墨染
    const sk = (t < .15 ? 1 - t / .15 : t > .4 && t < .55 ? 1 - (t - .4) / .15 : 0) * 4;
    c.save(); c.translate((Math.random() - .5) * sk, (Math.random() - .5) * sk);
    nightSky(0, H, T); bigMoon(W * .7, H * .3, W * .2);
    for (const [fx, w] of [[.06, 16], [.18, 10], [.84, 14], [.95, 18]]) bambooSil(fx * W, 0, H, w, '#05060f', 3, T);
    roofs(H * .86, '#05060f', 1, T); c.fillStyle = '#05060f'; c.fillRect(0, H * .86, W, H * .14);
    c.restore();
    for (const d of [.05, .4]) if (t >= d && t < d + .12) { c.fillStyle = `rgba(255,255,255,${.5 * (1 - (t - d) / .12)})`; c.fillRect(0, 0, W, H); }   // 拍子木的閃光
    // 墨從中央暈開（邊緣不規則，外圍有墨滴）
    const ik = ez(cl((t - .6) / .55));
    if (ik > 0) {
      const R = ik * Math.hypot(W, H) * .62, cx = W / 2, cy = H * .48;
      c.fillStyle = '#060508'; c.beginPath();
      for (let i = 0; i <= 64; i++) { const a = i / 64 * TAU, r = R * (1 + .1 * Math.sin(a * 5 + 1.3) + .06 * Math.sin(a * 11 + .4) + .04 * Math.sin(a * 17)); c.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); }
      c.closePath(); c.fill();
      for (let i = 0; i < 14; i++) { const a = i * 2.39, r = R * (1.08 + (i % 4) * .05); aCirc(c, cx + Math.cos(a) * r, cy + Math.sin(a) * r, 3 + (i % 5) * 2.2 * ik); c.fill(); }
    }
    // 「序」
    const sa = cl((t - 1.0) / .25) * (1 - cl((t - 1.55) / .25));
    if (sa > 0) {
      const s = 1 + (1 - ez(cl((t - 1.0) / .25))) * .25;
      c.save(); c.globalAlpha = sa; c.translate(W / 2, H * .46); c.scale(s, s);
      c.font = `${Math.round(Math.min(W * .42, 150))}px "Yuji Boku","Yu Mincho",serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillStyle = '#f2e6c8'; c.fillText('序', 0, 0);
      c.fillStyle = '#c0262d'; c.beginPath(); c.rect(W * .12, W * .1, 24, 24); c.fill(); c.fillStyle = '#fff'; c.font = '16px "Yuji Boku",serif'; c.fillText('忍', W * .12 + 12, W * .1 + 13);
      c.restore();
    }
  }
}

// ===== 故事結尾的「竹簾開幕」 =====
const OUT_T = 3.7, OUT_KITE = .35, OUT_LOGO = 1.4, OUT_OPEN = 2.25;   // 總長、鳶起飛、LOGO 蓋章、竹簾拉開
function outroCue(e0, e1) {
  const at = x => e0 < x && e1 >= x;
  if (at(OUT_KITE + .15)) { tone(2100, .35, 'sine', .035, -500); tone(1650, .5, 'sine', .03, -350, .32); noise(.6, .02); }   // 鳶鳴「ピーヒョロ」＋翅膀帶起的風
  if (at(OUT_LOGO)) { INTRO.outroLogo(); SFX.impact(); vib(40); }
  if (at(OUT_OPEN)) {   // 「咔噠」＋琴的刷弦（都節音階往上）
    noise(.05, .1); tone(1100, .07, 'triangle', .06);
    [329.6, 349.2, 440, 493.9, 523.3, 659.3].forEach((f, i) => koto(f, .08 + i * .05, .03));
  }
}
// 一片竹簾（橫向細竹片＋縫隙透光＋綁繩＋上緣布邊＋內側的紅流蘇）。x0 = 這一片的左緣，side = -1 左片／+1 右片
function sudare(c, x0, w, side, sway) {
  const top = SAFE_T, slat = 7, gap = 1.6;
  for (let y = top + 22, i = 0; y < H; y += slat + gap, i++) {
    const sx = x0 + Math.sin(i * .9) * .6 + (y / H) * sway;   // 下緣跟著晃
    const gr = c.createLinearGradient(0, y, 0, y + slat); gr.addColorStop(0, '#d9b97e'); gr.addColorStop(.5, '#c29a5c'); gr.addColorStop(1, '#9c7640');
    c.globalAlpha *= .9; c.fillStyle = gr; c.fillRect(sx, y, w, slat); c.globalAlpha /= .9;   // 竹片微透，後面的月光透得過來
    c.fillStyle = 'rgba(90,60,25,.55)'; for (let k = 0; k < 3; k++) { const nx = sx + ((i * 47 + k * 83) % Math.max(20, w)); c.fillRect(nx, y, 2, slat); }   // 竹節
  }
  // 綁繩（三條直的深色繩）
  c.strokeStyle = '#3a2614'; c.lineWidth = 2;
  for (const f of [.2, .5, .8]) { const x = x0 + w * f; c.beginPath(); c.moveTo(x, top + 22); c.lineTo(x + sway, H); c.stroke(); }
  // 上緣布邊（深綠＋金紋）
  c.fillStyle = '#1e3a2c'; c.fillRect(x0, top, w, 22); c.fillStyle = '#c9a14a'; for (let x = x0 + 6; x < x0 + w; x += 18) { c.beginPath(); c.arc(x, top + 11, 3, 0, TAU); c.fill(); }
  c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(x0, top + 22, w, 3);
  // 內側邊緣的紅流蘇
  const ex = side < 0 ? x0 + w - 10 : x0 + 10, ty = H * .62, sw = sway * .7;
  c.strokeStyle = '#7a1a10'; c.lineWidth = 2; c.beginPath(); c.moveTo(ex, top + 22); c.lineTo(ex + sw * .5, ty); c.stroke();
  c.fillStyle = '#c0262d'; c.beginPath(); c.arc(ex + sw * .5, ty, 6, 0, TAU); c.fill();
  c.beginPath(); c.moveTo(ex + sw * .5 - 6, ty + 3); c.lineTo(ex + sw - 5, ty + 34); c.lineTo(ex + sw + 5, ty + 34); c.lineTo(ex + sw * .5 + 6, ty + 3); c.closePath(); c.fill();
}
function drawOutro(t) {
  const c = ctx, T = performance.now() / 1000, cl = x => Math.max(0, Math.min(1, x));
  const open = ez(cl((t - OUT_OPEN) / 1.25)), half = W / 2;
  // 竹簾後面：開幕前是暗暗的月光，開幕時換成標題背景慢慢亮起
  c.fillStyle = '#06060c'; c.fillRect(0, 0, W, H);
  if (open > 0) { drawTitleBG(T); c.fillStyle = `rgba(0,0,0,${1 - open})`; c.fillRect(0, 0, W, H); }
  else { const g2 = c.createRadialGradient(W * .7, H * .3, 10, W * .7, H * .3, W * .9); g2.addColorStop(0, 'rgba(255,236,180,.35)'); g2.addColorStop(1, 'rgba(255,236,180,0)'); c.fillStyle = g2; c.fillRect(0, 0, W, H); }
  // 竹簾（淡入、拉開時往兩側滑出並晃動）
  const fade = cl(t / .35), sway = open > 0 && open < 1 ? Math.sin(open * Math.PI) * 14 : Math.sin(T * 1.6) * 1.5;
  c.save(); c.globalAlpha = fade;
  sudare(c, -open * half * 1.06, half + 1, -1, -sway);
  sudare(c, half + open * half * 1.06, half, 1, sway);
  c.restore();
  if (t < .35) { c.fillStyle = `rgba(0,0,0,${1 - fade})`; c.fillRect(0, 0, W, H); }
  // 鳶的黑影：從畫面下方往上飛、由大變小，飛出上緣；後面帶著幾片竹葉
  const kq = (t - OUT_KITE) / 1.0;
  if (kq > 0 && kq < 1.05) {
    const e = ez(cl(kq)), x = W * (.42 + .16 * Math.sin(kq * 3)), y = H * 1.1 - e * H * 1.3, s = 2.6 - 1.6 * e;
    kiteBird(c, x, y, s, Math.sin(T * 16), 'rgba(8,6,14,.92)');
    for (let i = 0; i < 6; i++) { const lq = cl(kq - .08 - i * .05); if (lq <= 0) continue; const lx = x + Math.sin(i * 2.1 + kq * 5) * 40 * s / 2, ly = y + 60 + i * 22 + lq * 30;
      c.save(); c.translate(lx, ly); c.rotate(i + kq * 6); c.fillStyle = `rgba(40,70,40,${.8 * (1 - lq)})`; c.beginPath(); c.ellipse(0, 0, 7, 2.4, 0, 0, TAU); c.fill(); c.restore(); }
  }
}

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
  // 結尾轉暗（接竹簾開幕）
  if (t >= CUT_FLASH) { c.fillStyle = `rgba(0,0,0,${ez((t - CUT_FLASH) / (CUT_END - CUT_FLASH))})`; c.fillRect(0, 0, W, H); }
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
  // 風林火山四卷秘傳之卷：從村子各處被捲上天，一卷接一卷飛到鬼的身邊，繞著它浮在空中
  CUT_SCROLLS.forEach(([ch, col], i) => {
    const t0 = 2.2 + i * .22; if (st <= t0) return;
    const q = ez((st - t0) / 1.1), x0 = W * (.08 + i * .27), y0 = PY + PH * .98;
    const ang = -Math.PI * (.85 - i * .233) + (q >= 1 ? Math.sin(st * 1.5 + i) * .08 : 0), x1 = bx + Math.cos(ang) * 62 * s, y1 = by - 10 * s + Math.sin(ang) * 46 * s;
    const cx = W * (i < 2 ? .1 : .9), cy = PY + PH * .05;
    const x = (1 - q) * (1 - q) * x0 + 2 * (1 - q) * q * cx + q * q * x1, y = (1 - q) * (1 - q) * y0 + 2 * (1 - q) * q * cy + q * q * y1;
    for (let k = 0; k < 6; k++) { c.fillStyle = `rgba(255,230,150,${.5 - k * .08})`; aCirc(c, x - (x1 - x0) * .02 * k, y + k * 4, 3 - k * .4); c.fill(); }
    if (q >= 1) bossGlow(c, x, y, 20, col + '99');
    scrollItem(c, x, y + (q >= 1 ? Math.sin(st * 3 + i) * 2 : 0), 1.5, q < 1 ? st * 9 + i : .15 * (i - 1.5), ch, col);
  });
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
      if (pq < 1) { c.save(); c.translate(hx, ridge - PH * .3 - 26); c.scale(1.9, 1.9); poofSmoke(c, pq); c.restore(); }   // 化成一陣卡通煙霧
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

// ===== 標題背景：遊戲關卡的捲動背景（四幕隨機輪播）＋左右竹牆；主角剪影在竹牆間蹬牆跳、化煙瞬移 =====
// 換幕：下一幕從畫面上方往下蓋過來，交界處是一排雲（像往上爬進下一幕）
const TB = { cur: -1, nxt: -1, t: 0, wipe: 0, cam: 0, spd: 1 };   // cam：背景捲動位置；spd：捲動速度（主角往上奔跑時加快）
// 標題背景只從「已開放的關卡」裡輪播（和選關畫面相同的開放規則；測試模式下四關全開）
function titleThemes() { try { const n = TEST_FREE ? LEVELS.length : lvSave().open; return LEVELS.slice(0, Math.max(1, n)).map(l => l.th); } catch (e) { return [1]; } }
function tbFix() { const a = titleThemes(); if (!a.includes(TB.cur)) TB.cur = a[Math.random() * a.length | 0]; if (TB.nxt >= 0 && !a.includes(TB.nxt)) TB.nxt = -1; }
function titleBgUpdate(dt) {
  TB.t += dt;
  TB.spd += ((typeof FH !== 'undefined' && FH.mode === 'dash' && !FH.act && INTRO.cyc === 'front' && FH.vis ? 3.4 : 1) - TB.spd) * Math.min(1, dt * 3);
  TB.cam -= 40 * TB.spd * dt;
  tbFix();
  const pool = titleThemes().filter(k => k !== TB.cur);   // 只輪播已開放的關卡
  if (TB.nxt < 0 && TB.t >= 8 && pool.length) { TB.nxt = pool[Math.random() * pool.length | 0]; TB.wipe = 0; }
  if (TB.nxt >= 0) { TB.wipe += dt / 1.4; if (TB.wipe >= 1) { TB.cur = TB.nxt; TB.nxt = -1; TB.t = 0; } }
}
const TH = { mode: 'cling', t: 0, dur: 1, x: 0, y: 0, x0: 0, y0: 0, x1: 0, y1: 0, side: -1, face: 1, vis: 0, spin: 0, wait: 0, puffs: [] };
const wallX = sd => sd < 0 ? WALL + 13 : W - WALL - 13;
const heroPuff = () => TH.puffs.push({ x: TH.x, y: TH.y - 18, t: 0 });
function titleHeroShow() { TH.side = Math.random() < .5 ? -1 : 1; TH.x = wallX(TH.side); TH.y = H * (.45 + Math.random() * .25); TH.face = -TH.side; TH.vis = 1; TH.mode = 'cling'; TH.t = 0; TH.dur = .5; heroPuff(); }
function titleHeroHide() { if (TH.vis) heroPuff(); TH.vis = 0; TH.mode = 'cling'; }
function titleHero(dt) {
  const h = TH; h.t += dt;
  if (h.mode === 'warp') { if (h.t >= h.dur) { h.vis = 1; heroPuff(); h.mode = 'cling'; h.t = 0; h.dur = .5 + Math.random() * .5; } return; }
  if (!h.vis) return;
  if (h.t < h.dur) { if (h.mode === 'hop') { const q = h.t / h.dur; h.x = lerp2(h.x0, h.x1, q); h.y = lerp2(h.y0, h.y1, q) - Math.sin(q * Math.PI) * H * .1; } return; }
  if (h.mode === 'hop') { h.mode = 'cling'; h.t = 0; h.dur = .3 + Math.random() * .5; h.side = h.x1 < W / 2 ? -1 : 1; h.face = -h.side; return; }
  if (Math.random() < .22) {   // 化煙瞬移到另一處牆上
    heroPuff(); h.vis = 0; h.mode = 'warp'; h.t = 0; h.dur = .4;
    h.side = Math.random() < .5 ? -1 : 1; h.x = wallX(h.side); h.y = H * (.38 + Math.random() * .38); h.face = -h.side;
  } else {   // 蹬牆跳到對面的牆
    const ns = -h.side; h.mode = 'hop'; h.t = 0; h.dur = .6 + Math.random() * .18;
    h.x0 = h.x; h.y0 = h.y; h.x1 = wallX(ns); h.y1 = clamp(h.y + (Math.random() - .6) * H * .2, H * .3, H * .8); h.face = ns; h.spin = Math.random() < .35 ? 1 : 0;
  }
}
function drawTitleBG(t) {
  tbFix(); const c = ctx, camY = TB.cam;
  drawBG(camY, TB.cur, t); drawWalls(camY, TB.cur);
  if (TB.nxt >= 0) {   // 下一幕從上方蓋下來
    const ey = ez(TB.wipe) * (H + 40) - 20;
    c.save(); c.beginPath(); c.rect(0, 0, W, ey); c.clip(); drawBG(camY, TB.nxt, t); drawWalls(camY, TB.nxt); c.restore();
    for (let x = -10; x < W + 30; x += 26) { const r = 16 + Math.sin(x * .7) * 5; c.fillStyle = '#f2f6f2'; aCirc(c, x, ey + Math.sin(x + t * 3) * 3, r); c.fill(); }
    c.fillStyle = '#d8e2dc'; c.fillRect(0, ey + 6, W, 6);
  }
  c.fillStyle = 'rgba(0,12,12,.2)'; c.fillRect(0, 0, W, H);   // 稍微壓暗，讓標題字清楚
  const h = TH;
  if (h.vis) {
    const q = h.mode === 'hop' ? h.t / h.dur : 0, vy = h.mode === 'hop' ? (q < .5 ? -600 : 500) : 0;
    const spin = h.mode === 'hop' && h.spin ? .45 * (1 - q) : 0;
    drawSil(h.x, h.y, 100, 100, 50, 84, 'rgba(6,18,16,.9)', g3 => drawHeroNinja(0, 0, { face: h.face, t, vy, skin: save.skin, spin }, g3));
  }
  for (const p of h.puffs) { c.save(); c.translate(p.x, p.y - 4); c.scale(.7, .7); poofSmoke(c, p.t / .5); c.restore(); }   // 化煙瞬移：和前景同一種卡通煙霧
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
    drawSil(x, y, 130, 130, 65, 110, '#04030a', g3 => { g3.scale(1.3, 1.3); drawHeroNinja(0, 0, { face: 1, t: a, vy: hop < .5 ? -700 : 500, skin: save.skin, spin: hop > .3 && hop < .7 ? .45 * (1 - (hop - .3) / .4) : 0 }, g3); });
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

// ===== 標題的前景主角：改用畫布即時繪製，位置、大小、旋轉、透明度跟著原本的現身／浮動／消失動畫（DOM 的 .hero-art 只負責動畫時間） =====
// 表演：A 待機小動作（張望、伸懶腰、拔刀一半）、B 招牌姿勢（亮相、勝利、歡呼）、D 忍術（火遁、轉手裡劍、轉苦無）、
//       C 點他有反應（空翻、分身、被戳、開心）、E 背景換幕時的反應（林：葉子落頭上／風：被吹得搖晃／火：擦汗／山：轉身遠眺）
const FH = { act: null, at: 0, dur: 0, rest: 2.4, tapN: 0, stage: -1, bag: [], vis: false, box: null, mode: 'bounce', mt: 0, hop: 0, dust: [] };   // mode：沒在表演時的動態——bounce 在雲上原地彈跳／dash 往上奔跑（兩者輪流）
const FH_DUR = { look: 2.2, stretch: 1.7, draw: 1.9, mie: 2, victory: 1.6, cheer: 1.6, fire: 2.5, shuriken: 2.4, kunai: 2.2,
  spin: .9, clone: 1.4, poke: 1.1, happy: 1.3, leaf: 2.4, windy: 2.2, sweat: 2.2, gaze: 2.2 };
const FH_IDLE = ['look', 'stretch', 'draw', 'mie', 'victory', 'cheer', 'fire', 'shuriken', 'kunai'];
function fhStart(a) {
  FH.act = a; FH.at = 0; FH.dur = FH_DUR[a];
  const s = { draw: () => SFX.clank(), mie: () => SFX.impact(), victory: () => SFX.item(), cheer: () => SFX.item(), shuriken: () => SFX.throw(), kunai: () => SFX.throw(),
    spin: () => SFX.dash(), clone: () => SFX.scroll(), poke: () => tone(520, .12, 'square', .04, -260), happy: () => SFX.item(), windy: () => SFX.wind(), stretch: () => tone(330, .25, 'triangle', .03, 160) }[a];
  if (s) s();
}
function frontHeroBox(any) {   // any：不管目前透明度（噴煙用，主角還沒現身也要知道位置）
  const el = document.querySelector('#title .hero-art'), ti = $('title');
  if (!el || !ti.classList.contains('on') || ti.classList.contains('attract')) return null;
  const cs = getComputedStyle(el), op = +cs.opacity, par = el.offsetParent;
  if ((!any && op < .02) || !par) return null;
  const pr = par.getBoundingClientRect(), cr = cv.getBoundingClientRect(), k = W / cr.width;
  const m = cs.transform && cs.transform !== 'none' ? new DOMMatrix(cs.transform) : new DOMMatrix();
  return { x: (pr.left - cr.left + el.offsetLeft + el.offsetWidth / 2 + m.e) * k, y: (pr.top - cr.top + el.offsetTop + el.offsetHeight / 2 + m.f) * k,
    s: (any ? 1 : Math.hypot(m.a, m.b)) * el.offsetWidth * k / 84, rot: any ? 0 : Math.atan2(m.b, m.a), op };
}
function frontHeroUpdate(dt) {
  // 沒在表演時的動態：每 6 秒在「雲上原地彈跳」和「往上奔跑」之間切換；彈跳落地時噴小煙塵
  FH.mode = 'bounce';   // 已移除「往上快速奔跑」的演出，只保留在雲上彈跳
  const ph0 = FH.hop % 1; FH.hop += dt * 1.45; if (FH.hop % 1 < ph0 && FH.mode === 'bounce' && !FH.act) FH.dust.push({ t: 0 });
  for (const d of FH.dust) d.t += dt; FH.dust = FH.dust.filter(d => d.t < .45);
  if (!FH.vis || INTRO.cyc !== 'front') { FH.act = null; FH.rest = 1.3; return; }
  if (FH.act) {
    FH.at += dt;
    if (FH.act === 'fire' && FH.at - dt < .5 && FH.at >= .5) { noise(.45, .07); tone(180, .4, 'sawtooth', .04, -80); }
    if (FH.at >= FH.dur) { FH.act = null; FH.rest = 2.2 + Math.random() * 1.6; }
    return;
  }
  if (FH.stage !== TB.cur) { const first = FH.stage < 0; FH.stage = TB.cur; if (!first) { fhStart(['leaf', 'windy', 'sweat', 'gaze'][TB.cur]); return; } }
  FH.rest -= dt;
  if (FH.rest <= 0) { if (!FH.bag.length) FH.bag = FH_IDLE.slice().sort(() => Math.random() - .5); fhStart(FH.bag.pop()); }
}
// 點前景主角：依序換不同反應
document.getElementById('title').addEventListener('pointerdown', e => {
  if (!FH.vis || !FH.box || INTRO.cyc !== 'front') return;
  const cr = cv.getBoundingClientRect(), k = W / cr.width, x = (e.clientX - cr.left) * k, y = (e.clientY - cr.top) * k, b = FH.box;
  if (Math.hypot(x - b.x, y - b.y) > b.s * 34) return;
  fhStart(['spin', 'clone', 'poke', 'happy'][FH.tapN++ % 4]);
  INTRO.ct = Math.min(INTRO.ct, FRONT_T - 3);   // 互動中不會馬上換成背景剪影
});
function heart(c, x, y, r) { c.beginPath(); c.moveTo(x, y + r * .9); c.bezierCurveTo(x - r * 1.6, y - r * .2, x - r * .6, y - r * 1.3, x, y - r * .4); c.bezierCurveTo(x + r * .6, y - r * 1.3, x + r * 1.6, y - r * .2, x, y + r * .9); c.fill(); }
function drawFrontHero(t) {
  const b = frontHeroBox(); FH.box = b; FH.vis = !!b && b.op > .9;
  if (!b) return;
  const c = ctx, a = FH.act, q = a ? FH.at / FH.dur : 0, at = FH.at, sin = Math.sin;
  const o = { face: 1, t, vy: 0, skin: save.skin };
  let dx = 0, dy = 0, rot = 0;
  const back = [], front = [];   // 主角後面／前面的特效（座標：主角盒子單位，腳底在 (0,32)）
  switch (a) {
    case 'look': o.face = q > .22 && q < .62 ? -1 : 1; o.pose = 'apex'; break;
    case 'stretch': o.pose = 'fall'; o.sq = -sin(q * Math.PI) * .9; if (q > .2 && q < .8) o.eye = 'happy'; break;
    case 'draw':
      if (q > .15 && q < .85) { o.pose = 'dash'; o.eye = 'focus'; if (q > .25 && q < .6) front.push(() => drawStar4(c, 40, 20, 4 + sin((q - .25) / .35 * Math.PI) * 6, q * 6, '#ffffff')); }
      break;
    case 'mie':
      o.pose = 'fly'; o.eye = 'focus'; dx = q < .1 ? sin(at * 90) * 1.5 : 0;
      back.push(() => { c.strokeStyle = `rgba(255,236,170,${.7 * (1 - q)})`; c.lineWidth = 1.6; for (let i = 0; i < 16; i++) { const an = i / 16 * TAU; c.beginPath(); c.moveTo(Math.cos(an) * 26, 4 + sin(an) * 26); c.lineTo(Math.cos(an) * (40 + q * 10), 4 + sin(an) * (40 + q * 10)); c.stroke(); } });
      front.push(() => { const k = Math.min(1, q / .15); c.save(); c.translate(27, -16); c.scale(2 - k, 2 - k); c.globalAlpha *= k; aCirc(c, 0, 0, 9); aFI(c, '#c0262d', 1.6); txt('忍', 0, .5, 11, '#fff', 'center', null); c.restore(); });
      break;
    case 'victory':
      o.pose = 'up'; o.eye = 'happy'; dy = -sin(q * Math.PI) * 12;
      front.push(() => { for (let i = 0; i < 4; i++) { const an = i * 1.6 + at * 3; drawStar4(c, 12 + Math.cos(an) * 16, 6 + sin(an) * 10, 2.5 + sin(at * 8 + i) * 1.2, at * 4, '#ffe28a'); } });
      break;
    case 'cheer': o.pose = 'fall'; o.eye = 'happy'; dy = -Math.abs(sin(q * TAU)) * 10; break;
    case 'fire':
      o.eye = 'focus'; o.pose = q < .2 ? 'apex' : 'fly';
      if (q < .2) back.push(() => { c.strokeStyle = '#ffe28a'; c.lineWidth = 1.4; c.setLineDash([3, 2]); aCirc(c, 0, 6, 26 * ez(q / .2)); c.stroke(); c.setLineDash([]); });
      else front.push(() => { for (let i = 0; i < 18; i++) { const f = (at * 2.6 + i / 18) % 1, fx = 16 + f * 46, fy = 9 + sin(i * 3 + at * 20) * f * 9 - f * 4; c.fillStyle = f < .35 ? `rgba(255,240,150,${1 - f})` : f < .7 ? `rgba(255,140,40,${1 - f})` : `rgba(200,40,30,${1 - f})`; aCirc(c, fx, fy, 2.5 + f * 7); c.fill(); } });
      break;
    case 'shuriken':
      o.pose = 'up'; o.eye = 'happy';
      front.push(() => { for (let i = 0; i < 3; i++) { const an = at * 7 + i / 3 * TAU; drawStar4(c, 12 + Math.cos(an) * 12, -9 + sin(an) * 6, 5.5, at * 20, '#cfd6e2'); } });
      break;
    case 'kunai': o.pose = 'up'; if (q > .3 && q < .7) o.eye = 'happy'; front.push(() => drawKunai(c, 13, -8 - sin(q * Math.PI) * 12, at * 16, 1.5)); break;
    case 'spin': o.eye = 'happy'; o.pose = 'apex'; dy = -sin(q * Math.PI) * 34; o.spin = .45 * (1 - q) + .001; break;
    case 'clone':
      o.pose = 'apex'; o.eye = 'focus';
      back.push(() => { const sp = sin(q * Math.PI) * 34; for (const sd of [-1, 1]) { c.save(); c.globalAlpha *= .45; drawHeroNinja(sd * sp, 32, Object.assign({}, o, { face: sd }), c); c.restore(); } });
      break;
    case 'poke': o.pose = 'hurt'; o.eye = 'hurt'; dx = q < .5 ? sin(at * 70) * 2 : 0; front.push(() => txt('!?', 18, -22, 13, '#ffe28a', 'center', '#000', 3)); break;
    case 'happy':
      o.pose = 'up'; o.eye = 'happy'; dy = -Math.abs(sin(q * TAU)) * 9;
      front.push(() => { c.fillStyle = '#ff6a8a'; for (let i = 0; i < 3; i++) { const f = (q * 1.5 + i / 3) % 1; c.save(); c.globalAlpha *= 1 - f; heart(c, -14 + i * 14, -10 - f * 22, 4); c.restore(); } });
      break;
    case 'leaf':
      o.pose = 'apex'; if (q > .55 && q < .8) o.eye = 'blink';
      front.push(() => {
        const lq = Math.min(1, q / .55), off = q > .8 ? (q - .8) / .2 : 0, lx = lerp2(-24, 2, lq) + sin(lq * 9) * 6 + off * 40, ly = lerp2(-40, -20, lq) - off * 20;
        c.save(); c.translate(lx, ly); c.rotate(sin(at * 5) * .6 + off * 4); c.fillStyle = '#5fae4a'; c.beginPath(); c.moveTo(-6, 0); c.quadraticCurveTo(0, -4, 6, 0); c.quadraticCurveTo(0, 4, -6, 0); c.fill(); c.strokeStyle = INK; c.lineWidth = .8; c.stroke(); c.restore();
        if (q > .78 && q < .95) { c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 1.2; for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(4, -14 - i * 3); c.lineTo(12 + i * 3, -18 - i * 4); c.stroke(); } }
      });
      break;
    case 'windy':
      o.pose = 'fall'; o.eye = 'focus'; rot = sin(at * 7) * .14; dx = sin(at * 7) * 3;
      back.push(() => { c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = 1.4; for (let i = 0; i < 5; i++) { const x = 50 - ((at * 120 + i * 30) % 110); c.beginPath(); c.moveTo(x, -16 + i * 11); c.quadraticCurveTo(x - 10, -20 + i * 11, x - 22, -16 + i * 11); c.stroke(); } });
      break;
    case 'sweat':
      o.pose = 'up'; o.eye = 'blink';
      front.push(() => { c.fillStyle = '#9ad8ff'; for (let i = 0; i < 3; i++) { const f = (at * 1.4 + i / 3) % 1, x = -15 + i * 3, y = -8 + f * 18; c.save(); c.globalAlpha *= 1 - f; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x - 3, y + 6, x, y + 8); c.quadraticCurveTo(x + 3, y + 6, x, y); c.fill(); c.restore(); } });
      break;
    case 'gaze': o.pose = 'up'; o.eye = 'focus'; o.face = q < .5 ? 1 : -1; front.push(() => { if (sin(at * 9) > .3) drawStar4(c, o.face * 10, 3, 3, at * 3, '#ffffff'); }); break;
  }
  // 沒在表演時：A 在雲上原地彈跳（落地壓扁、噴煙塵、每三下空翻一次）／C 往上奔跑（速度線、殘影、背景加速捲動）
  const ground = [];
  if (!a && FH.mode === 'bounce') {
    const p = FH.hop % 1, n = Math.floor(FH.hop);
    dy = -Math.sin(p * Math.PI) * 24; o.vy = p < .5 ? -700 : 500;
    o.sq = p < .08 ? (.08 - p) * 9 : p > .93 ? (p - .93) * 9 : 0;
    if (n % 3 === 2 && p > .15 && p < .8) o.spin = .45 * (1 - (p - .15) / .65) + .001;
    ground.push(() => {
      heroSilhouette(c, [{ path: c => { c.beginPath(); for (const [x, y, r] of [[-15, 38, 7], [-5, 36, 8.5], [6, 36, 8.5], [16, 38, 7]]) { c.moveTo(x + r, y); c.arc(x, y, r, 0, TAU); } }, fill: '#f2f6f2' }], 1.6);
      c.fillStyle = '#d8e2dc'; c.fillRect(-21, 40, 42, 3);
      for (const d of FH.dust) { const k = d.t / .45; c.globalAlpha = (1 - k) * .9; for (const sd of [-1, 1]) { c.fillStyle = '#ffffff'; aCirc(c, sd * (10 + k * 16), 32 - k * 6, 4 * (1 - k * .5)); c.fill(); } c.globalAlpha = 1; }
    });
  } else if (!a && FH.mode === 'dash') {
    o.vy = -950; o.pose = 'up'; o.eye = 'focus'; rot = -.12; dy = Math.sin(t * 14) * 1.5;
    back.push(() => {
      c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineCap = 'round';
      for (let i = 0; i < 7; i++) { const x = -34 + i * 11, y = ((i * 37 + t * 260) % 90) - 30, l = 14 + (i % 3) * 8; c.lineWidth = 1.6 + (i % 2); c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + l); c.stroke(); }
      for (let k = 2; k >= 1; k--) { c.save(); c.globalAlpha *= .18 * (3 - k); drawHeroNinja(0, 32 + k * 9, Object.assign({}, o), c); c.restore(); }   // 殘影
    });
  }
  c.save(); c.globalAlpha *= b.op; c.translate(b.x, b.y); c.rotate(b.rot); c.scale(b.s, b.s);
  for (const f of ground) f();
  c.translate(dx, dy); c.rotate(rot);
  for (const f of back) f();
  drawHeroNinja(0, 32, o, c);
  for (const f of front) f();
  c.restore();
}

// ===== 忍術現身／消失的卡通煙霧（前景主角與背景剪影共用；座標：主角盒子單位，中心 (0,6)；k = 0→1 的進度） =====
function poofSmoke(c, k) {
  const a = 1 - ez((k - .65) / .35);
  if (a <= 0) return;
  c.save(); c.globalAlpha *= a;
  const parts = [];
  for (let i = 0; i < 9; i++) {
    const an = i / 9 * TAU + .3, d = 6 + ez(k / .5) * 26, s = (.35 + ez(k / .35) * .65) * (1 - ez((k - .7) / .3) * .4);
    const x = Math.cos(an) * d * 1.15, y = 8 + Math.sin(an) * d * .75 - k * 10;
    parts.push({ path: c => { c.beginPath(); for (const [ox, oy, r] of [[0, 0, 9], [-6, 3, 6.5], [6, 2.5, 7]]) { c.moveTo(x + ox * s + r * s, y + oy * s); c.arc(x + ox * s, y + oy * s, r * s, 0, TAU); } }, fill: i % 2 ? '#ffffff' : '#e9eef0',
      after: c => { c.save(); c.clip(); c.fillStyle = 'rgba(150,170,180,.35)'; aEll(c, x + 2 * s, y + 6 * s, 10 * s, 5 * s); c.fill(); c.restore(); } });
  }
  parts.push({ path: c => aCirc(c, 0, 8, (4 + ez(k / .4) * 16) * (1 - ez((k - .5) / .4) * .7)), fill: '#ffffff' });
  heroSilhouette(c, parts, 1.4);
  c.strokeStyle = INK; c.lineWidth = 1.2; c.lineCap = 'round';
  for (let i = 0; i < 4; i++) { const an = i / 4 * TAU + .8, d = 18 + k * 26, x = Math.cos(an) * d, y = 8 + Math.sin(an) * d * .7 - k * 12; c.beginPath(); for (let j = 0; j < 14; j++) { const r = 4 - j * .25, aa = j * .55; c.lineTo(x + Math.cos(aa) * r, y + Math.sin(aa) * r); } c.stroke(); }
  for (let i = 0; i < 5; i++) { const an = i / 5 * TAU + 1.2, d = 22 + k * 30; drawStar4(c, Math.cos(an) * d, 6 + Math.sin(an) * d * .8, 2.6 * (1 - k * .5), k * 4, '#ffe28a'); }
  c.restore();
}
// 排程：前景現身／消失時，在主角位置噴一團煙（delay 秒後開始，配合 CSS 動畫的時間）
const POOFS = [];
function poofAt(delay) { POOFS.push({ at: performance.now() / 1000 + delay }); }
function drawPoofs() {
  if (!POOFS.length) return;
  const now = performance.now() / 1000, b = frontHeroBox(true);
  for (let i = POOFS.length - 1; i >= 0; i--) {
    const k = (now - POOFS[i].at) / .8;
    if (k > 1) { POOFS.splice(i, 1); continue; }
    if (k < 0 || !b) continue;
    ctx.save(); ctx.translate(b.x, b.y); ctx.scale(b.s * 1.15, b.s * 1.15); poofSmoke(ctx, k); ctx.restore();
  }
}
