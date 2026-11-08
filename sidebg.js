'use strict';
/* NINJA 鳶 TOBI — iPad／電腦橫向時兩側的背景：月下城（祭典之夜）全景
   中間是直版比例的遊戲畫面，這張夜景鋪滿整個視窗，左右兩側露出畫面的不同部分（左：祭典提燈與城下町、右：大滿月下的天守閣與站在屋頂的忍者）。
   在 resize() 時依視窗大小重畫一次（畫在 #sideBg 畫布上）。元件以「高度 820」的座標畫，再整體縮放 */
const SIDEBG = (() => {
  let c = null, VW = 1180, VH = 820, GW = 461, GX = 360;
  const mixCol = (a, b, q) => { const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)), A = p(a), B = p(b); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * q)).join(',')})`; };
  function sky(top, mid, bot, seed) {
    const gr = c.createLinearGradient(0, 0, 0, VH); gr.addColorStop(0, top); gr.addColorStop(.6, mid); gr.addColorStop(1, bot); c.fillStyle = gr; c.fillRect(0, 0, VW, VH);
    const r = aRng(seed); for (let i = 0; i < 220; i++) { const y = r() * VH * .6, a = .25 + r() * .7 * (1 - y / VH); c.fillStyle = `rgba(255,255,235,${a})`; const s = r() < .08 ? 2.4 : 1.4; c.fillRect(r() * VW, y, s, s); }
  }
  function moon(x, y, R, col = '#fff1c8') {
    const h = c.createRadialGradient(x, y, R * .6, x, y, R * 3); h.addColorStop(0, 'rgba(255,240,200,.38)'); h.addColorStop(1, 'rgba(255,240,200,0)'); c.fillStyle = h; c.fillRect(x - R * 3, y - R * 3, R * 6, R * 6);
    c.fillStyle = col; aCirc(c, x, y, R); c.fill();
    c.fillStyle = 'rgba(210,190,150,.35)'; for (const [dx, dy, r] of [[-.3, -.2, .16], [.25, .3, .12], [.1, -.4, .08], [-.1, .2, .1]]) { aCirc(c, x + dx * R, y + dy * R, r * R); c.fill(); }
  }
  function ridge(base, amp, col, seed, step = 40, x0 = 0, x1 = VW) {
    // 兩端不是直切，而是緩緩降到地面（沒有生硬的直線）
    const r = aRng(seed), fade = x1 - x0 < VW ? 120 : 0; c.fillStyle = col; c.beginPath();
    const pts = []; let x = x0; while (x <= x1) { pts.push([x, base - r() * amp]); x += step * (.6 + r() * .8); } pts.push([x1, base - r() * amp]);
    c.moveTo(x0 - (x0 > 0 ? fade : 0), VH);
    pts.forEach(([px, py], i) => { const e0 = x0 > 0 ? Math.min(1, (px - x0) / fade) : 1, e1 = x1 < VW ? Math.min(1, (x1 - px) / fade) : 1, k = Math.max(0, Math.min(e0, e1)); c.lineTo(px, VH - (VH - py) * (k < 1 ? k * k * (3 - 2 * k) : 1)); });
    c.lineTo(x1 + (x1 < VW ? fade : 0), VH); c.fill();
  }
  function peak(x, base, w, h, col, snow) {   // 單座大山（山頂可加淡淡月光）
    c.fillStyle = col; c.beginPath(); c.moveTo(x - w / 2, base); c.quadraticCurveTo(x - w * .2, base - h * .7, x, base - h); c.quadraticCurveTo(x + w * .25, base - h * .65, x + w / 2, base); c.fill();
    if (snow) { c.fillStyle = snow; c.beginPath(); c.moveTo(x, base - h); c.lineTo(x - w * .08, base - h * .82); c.lineTo(x - w * .02, base - h * .86); c.lineTo(x + w * .04, base - h * .8); c.lineTo(x + w * .09, base - h * .84); c.closePath(); c.fill(); }
  }
  function mist(y, h, a) { const gr = c.createLinearGradient(0, y - h, 0, y + h); gr.addColorStop(0, 'rgba(170,180,230,0)'); gr.addColorStop(.5, `rgba(170,180,230,${a})`); gr.addColorStop(1, 'rgba(170,180,230,0)'); c.fillStyle = gr; c.fillRect(0, y - h, VW, h * 2); }
  // 柔和的雲霧：很多個半透明的橢圓光團疊起來
  function cloud(x, y, w, a) { const r = aRng(Math.round(x + y)); for (let i = 0; i < 9; i++) { const cx = x + (r() - .5) * w, cy = y + (r() - .5) * w * .08, rx = w * (.15 + r() * .15), ry = rx * .32; const gr = c.createRadialGradient(cx, cy, 2, cx, cy, rx); gr.addColorStop(0, `rgba(170,180,230,${a * .8})`); gr.addColorStop(1, 'rgba(170,180,230,0)'); c.save(); c.translate(cx, cy); c.scale(1, ry / rx); c.translate(-cx, -cy); c.fillStyle = gr; aCirc(c, cx, cy, rx); c.fill(); c.restore(); } }
  // 天守閣：石垣＋多層屋頂（輪廓用 col，窗戶透出燈光）
  function castle(x, base, s, col, lit = '#ffcf6a') {
    c.save(); c.translate(x, base); c.scale(s, s); c.fillStyle = col;
    c.beginPath(); c.moveTo(-120, 0); c.quadraticCurveTo(-112, -40, -96, -64); c.lineTo(96, -64); c.quadraticCurveTo(112, -40, 120, 0); c.fill();   // 石垣（扇形勾配）
    let y = -64; const tiers = [[176, 34], [140, 30], [104, 28], [70, 26]];
    tiers.forEach(([w, h], i) => {
      c.fillStyle = col; c.fillRect(-w / 2 + 12, y - h, w - 24, h);
      c.beginPath(); c.moveTo(-w / 2 - 14, y - h + 6); c.quadraticCurveTo(0, y - h - 6, w / 2 + 14, y - h + 6); c.lineTo(w / 2 - 6, y - h - 12); c.quadraticCurveTo(0, y - h - 18, -w / 2 + 6, y - h - 12); c.closePath(); c.fill();
      if (i === 1 || i === 3) { c.beginPath(); c.moveTo(-18, y - h - 12); c.lineTo(0, y - h - 32); c.lineTo(18, y - h - 12); c.fill(); }   // 千鳥破風
      c.fillStyle = lit; for (let k = 0; k < Math.max(1, (w - 40) / 26 | 0); k++) { if ((k + i) % 3 === 1) continue; c.fillRect(-w / 2 + 22 + k * 26, y - h + 9, 8, 10); }
      y -= h + 12;
    });
    c.fillStyle = '#e8b84a'; for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(sd * 30, y + 2); c.quadraticCurveTo(sd * 40, y - 12, sd * 34, y - 18); c.lineTo(sd * 28, y - 4); c.fill(); }   // 鯱
    c.restore();
  }
  // 村子：一排一排的屋子，窗戶透出燈光，屋簷下掛著燈籠
  function village(x0, x1, base, rows, seed, col, s = 1) {
    // 後排顏色較淡（遠）、前排較大較暗（近）；屋子是寄棟屋頂，紙門透出暖光（有格子），偶爾掛一盞紅燈籠
    const r = aRng(seed);
    for (let row = 0; row < rows; row++) {
      const y = base + row * 24 * s, sc = s * (.7 + row * .18), far = 1 - row / Math.max(1, rows - 1);
      const wall = row === rows - 1 ? col : mixCol(col, '#2a2e66', far * .45);
      for (let x = x0 + r() * 20; x < x1; x += (40 + r() * 34) * sc) {
        const w = (32 + r() * 28) * sc, h = (14 + r() * 10) * sc, rh = (12 + r() * 6) * sc;
        c.fillStyle = wall; c.fillRect(x, y - h, w, h + 60);
        c.beginPath(); c.moveTo(x - 7 * sc, y - h + 1); c.lineTo(x + w * .18, y - h - rh); c.lineTo(x + w * .82, y - h - rh); c.lineTo(x + w + 7 * sc, y - h + 1); c.closePath(); c.fill();   // 寄棟屋頂
        if (r() < .3) { c.beginPath(); c.moveTo(x + w * .4, y - h - rh); c.lineTo(x + w * .5, y - h - rh - 8 * sc); c.lineTo(x + w * .6, y - h - rh); c.fill(); }
        const lit = r();
        if (lit < .7) {   // 紙門的燈光
          const ww = w * (.3 + r() * .25), wx = x + (w - ww) * r(), wh = h * .55, wy = y - h * .78;
          c.fillStyle = 'rgba(255,180,80,.22)'; aEll(c, wx + ww / 2, wy + wh / 2, ww, wh * 1.2); c.fill();
          c.fillStyle = lit < .2 ? '#ffe2a0' : '#ffc260'; c.fillRect(wx, wy, ww, wh);
          c.strokeStyle = wall; c.lineWidth = Math.max(.8, sc); c.beginPath(); for (let k = 1; k < 3; k++) { c.moveTo(wx + ww * k / 3, wy); c.lineTo(wx + ww * k / 3, wy + wh); } c.moveTo(wx, wy + wh / 2); c.lineTo(wx + ww, wy + wh / 2); c.stroke();
        }
        if (r() < .18) { const lx = x + w * (r() < .5 ? .05 : .95), ly = y - h + 6 * sc; c.fillStyle = 'rgba(255,90,50,.3)'; aCirc(c, lx, ly, 10 * sc); c.fill(); c.fillStyle = '#ff6a3a'; aEll(c, lx, ly, 4 * sc, 5.5 * sc); c.fill(); }
      }
    }
  }
  function lanternString(x0, y0, x1, y1, n) {   // 祭典的提燈串
    c.strokeStyle = 'rgba(40,20,20,.9)'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo((x0 + x1) / 2, Math.max(y0, y1) + 24, x1, y1); c.stroke();
    for (let i = 1; i < n; i++) { const t = i / n, x = x0 + (x1 - x0) * t, y = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * (Math.max(y0, y1) + 24) + t * t * y1 + 8;
      c.fillStyle = 'rgba(255,120,60,.3)'; aCirc(c, x, y, 10); c.fill(); c.fillStyle = i % 2 ? '#ff5a3a' : '#ffcf6a'; aEll(c, x, y, 4.5, 6); c.fill(); }
  }
  function pagoda(x, base, s, col) { c.save(); c.translate(x, base); c.scale(s, s); c.fillStyle = col; for (let i = 0; i < 5; i++) { const w = 46 - i * 7, y = -i * 18; c.fillRect(-w / 4, y - 12, w / 2, 12); c.beginPath(); c.moveTo(-w / 2 - 8, y - 10); c.quadraticCurveTo(0, y - 15, w / 2 + 8, y - 10); c.lineTo(w / 2 - 2, y - 18); c.lineTo(-w / 2 + 2, y - 18); c.closePath(); c.fill(); } c.fillRect(-1.5, -116, 3, 26); c.restore(); }
  function pine(x, base, s, col) { c.save(); c.translate(x, base); c.scale(s, s); c.fillStyle = col; c.fillRect(-3, -30, 6, 30); for (let i = 0; i < 4; i++) { const w = 34 - i * 7, y = -26 - i * 16; c.beginPath(); c.moveTo(-w, y); c.quadraticCurveTo(0, y - 22, w, y); c.quadraticCurveTo(0, y + 6, -w, y); c.fill(); } c.restore(); }
  function birds(x, y, n, s, col, seed) { const r = aRng(seed); c.strokeStyle = col; c.lineWidth = 1.6 * s; c.lineCap = 'round'; for (let i = 0; i < n; i++) { const bx = x + i * 22 * s + r() * 10, by = y + Math.abs(i - n / 2) * 8 * s + r() * 6, w = 7 * s; c.beginPath(); c.moveTo(bx - w, by - w * .4); c.quadraticCurveTo(bx - w * .4, by - w * .7, bx, by); c.quadraticCurveTo(bx + w * .4, by - w * .7, bx + w, by - w * .4); c.stroke(); } }
  // 忍者剪影：leap 躍起（張開手腳）、run 奔跑、crouch 蹲在屋頂、stand 持刀站立
  // 用遊戲主角的畫法畫成黑色剪影（大頭、頭巾飄帶、刀）：pose = up 躍起／dash 奔跑衝刺／apex 站立／fall 落下
  const NJ = document.createElement('canvas'); NJ.width = NJ.height = 240; const NJC = NJ.getContext('2d');
  function ninja(x, y, s, pose, col, face = 1) {
    const map = { leap: 'up', run: 'dash', crouch: 'fall', stand: 'apex' }, ps = map[pose] || pose;
    NJC.setTransform(1, 0, 0, 1, 0, 0); NJC.globalCompositeOperation = 'source-over'; NJC.clearRect(0, 0, 240, 240);
    NJC.setTransform(2.4, 0, 0, 2.4, 120, 190);
    drawHeroNinja(0, 0, { face: 1, t: .4, vy: ps === 'up' ? -400 : 0, pose: ps, dash: ps === 'dash', dvx: 1, dvy: -.2, skin: (typeof save !== 'undefined' && save.skin) || 0 }, NJC);
    NJC.setTransform(1, 0, 0, 1, 0, 0); NJC.globalCompositeOperation = 'source-in'; NJC.fillStyle = col; NJC.fillRect(0, 0, 240, 240);
    c.save(); c.translate(x, y); c.scale(face * s / 2.4, s / 2.4); c.drawImage(NJ, -120, -190); c.restore();
  }
  // 左側／右側可見區域中的位置（f = 0～1）
  const L = f => GX * f, R = f => GX + GW + (VW - GX - GW) * f;
  function scene() {
    const side = VW - GX - GW, cs = clamp(side / 250, .85, 1.5);   // 天守閣大小跟著側邊寬度調整
    sky('#080a26', '#21245a', '#4a2c5a', 21);
    moon(R(.5), VH * .3, 90 * Math.min(1, cs), '#fff0c0');
    castle(R(.5), VH * .74, cs, '#080920');
    birds(R(.15), VH * .14, 5, 1.2, 'rgba(10,12,30,.9)', 22); birds(L(.2), VH * .1, 4, 1, 'rgba(10,12,30,.8)', 23);
    peak(L(.2), VH * .6, 400, 220, '#1d2050', 'rgba(200,210,255,.3)'); peak(L(.75), VH * .62, 300, 160, '#191c46');
    mist(VH * .56, 50, .25); cloud(L(.55), VH * .46, 300, .3);
    ridge(VH * .74, 40, '#10123a', 24, 50);
    village(0, GX + 40, VH * .78, 3, 25, '#06071a', 1.05);
    village(GX + GW - 40, VW, VH * .78, 3, 26, '#06071a', 1.05);
    c.strokeStyle = '#06071a'; c.lineWidth = 8; c.beginPath(); c.moveTo(L(.05), VH * .9); c.quadraticCurveTo(L(.5), VH * .8, L(.95), VH * .9); c.stroke();   // 橋
    c.lineWidth = 3; for (let i = 0; i <= 8; i++) { const t = i / 8, x = L(.05 + .9 * t), y = (1 - t) * (1 - t) * VH * .9 + 2 * (1 - t) * t * VH * .8 + t * t * VH * .9; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - 16); c.stroke(); }
    for (let k = 0; k < 3; k++) lanternString(L(.02 + k * .33), VH * (.6 + k * .03), L(.34 + k * .33), VH * (.62 + k * .03), 7);
    ninja(R(.5), VH * .74 - 232 * cs, 1.5 * Math.min(1, cs), 'stand', '#04050f', -1);   // 站在天守閣頂端
    { const gg = c.createLinearGradient(0, VH * .88, 0, VH); gg.addColorStop(0, 'rgba(5,6,26,0)'); gg.addColorStop(.45, '#05061a'); gg.addColorStop(1, '#04050f'); c.fillStyle = gg; c.fillRect(0, VH * .88, VW, VH * .12); }
    { const rg = c.createLinearGradient(0, 0, GX, 0); rg.addColorStop(0, 'rgba(90,110,200,.35)'); rg.addColorStop(.7, 'rgba(90,110,200,.2)'); rg.addColorStop(1, 'rgba(90,110,200,0)'); c.fillStyle = rg; c.fillRect(0, VH * .935, GX, VH * .04); }
    mist(VH * .9, 34, .28);
    // 遊戲畫面兩側的陰影＋金色細邊
    const s1 = c.createLinearGradient(GX - 30, 0, GX, 0); s1.addColorStop(0, 'rgba(0,0,0,0)'); s1.addColorStop(1, 'rgba(0,0,0,.6)'); c.fillStyle = s1; c.fillRect(GX - 30, 0, 30, VH);
    const s2 = c.createLinearGradient(GX + GW, 0, GX + GW + 30, 0); s2.addColorStop(0, 'rgba(0,0,0,.6)'); s2.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = s2; c.fillRect(GX + GW, 0, 30, VH);
    c.fillStyle = '#c8a050'; c.fillRect(GX - 2, 0, 2, VH); c.fillRect(GX + GW, 0, 2, VH);
  }
  return {
    // vw×vh：視窗大小（CSS px）；gw：中間遊戲畫面的寬度（CSS px）
    draw(cnv, vw, vh, gw) {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cnv.width = Math.round(vw * dpr); cnv.height = Math.round(vh * dpr);
      c = cnv.getContext('2d'); const k = vh / 820;
      VH = 820; VW = vw / k; GW = gw / k; GX = (VW - GW) / 2;
      c.setTransform(dpr * k, 0, 0, dpr * k, 0, 0);
      try { scene(); } catch (e) { }
    },
  };
})();
