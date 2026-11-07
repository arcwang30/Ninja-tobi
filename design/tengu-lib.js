const lin = (c, y0, y1, a, b) => { const gr = c.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, a); gr.addColorStop(1, b); return gr; };
// 羽毛翅膀：從 (0,0) 往 sd 方向展開；n 片羽毛，len 長度，flap 拍翅（-1～1）
function wing(c, sd, len, h, n, col, edge, flap, tatter) {
  c.save(); c.scale(sd, 1); c.rotate(-flap * .35);
  const pts = [];
  for (let i = 0; i < n; i++) { const q = i / (n - 1), x = len * (.35 + .65 * Math.sin(q * Math.PI * .5 + .2)), y = -h * .55 + q * h * 1.15; pts.push([x, y]); }
  c.beginPath(); c.moveTo(0, -h * .2); c.quadraticCurveTo(len * .4, -h * .9, pts[0][0], pts[0][1]);
  pts.forEach(([x, y], i) => { const fl = tatter && i % 2 ? .82 : 1; c.lineTo(x * fl, y); if (i < n - 1) c.lineTo(x * .78, y + h * .06); });
  c.quadraticCurveTo(len * .3, h * .7, 0, h * .25); c.closePath();
  c.fillStyle = col; c.fill(); aInk(c, 2);
  c.strokeStyle = edge; c.lineWidth = 1.1;
  pts.forEach(([x, y]) => { c.beginPath(); c.moveTo(len * .18, y * .3); c.lineTo(x * .9, y); c.stroke(); });
  c.restore();
}
function tokin(c, x, y, s, col = '#1c1c22') {   // 頭襟（山伏的小黑帽）
  c.save(); c.translate(x, y); c.scale(s, s);
  c.beginPath(); c.moveTo(-7, 2); c.lineTo(-5, -5); c.lineTo(0, -8); c.lineTo(5, -5); c.lineTo(7, 2); c.quadraticCurveTo(0, 4, -7, 2); c.closePath(); aFI(c, col, 1.6);
  c.strokeStyle = '#c0262d'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(-6, 2.5); c.quadraticCurveTo(0, 4.5, 6, 2.5); c.stroke();
  c.restore();
}
function bonten(c, x, y, r, col) { for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; aCirc(c, x + Math.cos(a) * r * .5, y + Math.sin(a) * r * .5, r * .55); c.fillStyle = col; c.fill(); } aCirc(c, x, y, r); c.strokeStyle = INK; c.lineWidth = 1.3; c.stroke(); }
function geta1(c, x, y, s, col = '#a0703a') { c.save(); c.translate(x, y); c.scale(s, s); aRR(c, -6, -2, 12, 3.4, 1.4); aFI(c, col, 1.3); c.beginPath(); c.rect(-1.6, 1.4, 3.2, 6); aFI(c, '#6a4424', 1.2); c.strokeStyle = '#c0262d'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(-3, -2); c.lineTo(0, -5); c.lineTo(3, -2); c.stroke(); c.restore(); }
function yatsude(c, x, y, s, rot, col = '#4f9c48') {   // 八手的葉扇（天狗的團扇）
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s);
  c.beginPath(); c.rect(-1.2, 0, 2.4, 10); aFI(c, '#7a5230', 1);
  c.beginPath(); for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i - 3) * .42; c.lineTo(Math.cos(a - .12) * 6, Math.sin(a - .12) * 6); c.lineTo(Math.cos(a) * 16, Math.sin(a) * 16); c.lineTo(Math.cos(a + .12) * 6, Math.sin(a + .12) * 6); } c.closePath(); aFI(c, col, 1.3);
  c.strokeStyle = 'rgba(20,60,20,.6)'; c.lineWidth = .8; for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i - 3) * .42; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a) * 13, Math.sin(a) * 13); c.stroke(); }
  c.restore();
}
function featherFan(c, x, y, s, rot, col, tip, eye) {   // 羽團扇
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s);
  c.beginPath(); c.rect(-1.6, 0, 3.2, 13); aFI(c, '#8e1c16', 1.2); aCirc(c, 0, 14, 2.2); aFI(c, '#e8b84a', 1);
  for (let i = 0; i < 9; i++) { const a = -Math.PI / 2 + (i - 4) * .27; c.save(); c.rotate(a + Math.PI / 2); c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-4, -12, 0, -24); c.quadraticCurveTo(4, -12, 0, 0); c.fillStyle = i % 2 ? col : tip; c.fill(); aInk(c, 1); if (eye) { aEll(c, 0, -18, 2.4, 3.2); c.fillStyle = eye[0]; c.fill(); aCirc(c, 0, -18, 1.2); c.fillStyle = eye[1]; c.fill(); } c.restore(); }
  c.restore();
}
function staff(c, x0, y0, x1, y1) {   // 錫杖
  c.strokeStyle = INK; c.lineWidth = 4; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); c.strokeStyle = '#8a6a3a'; c.lineWidth = 2.2; c.stroke();
  aEll(c, x1, y1 - 5, 5, 7); c.strokeStyle = INK; c.lineWidth = 3.4; c.stroke(); c.strokeStyle = '#e8b84a'; c.lineWidth = 2; c.stroke();
  for (const sd of [-1, 1]) { aCirc(c, x1 + sd * 5, y1 - 2, 2.4); c.strokeStyle = '#e8b84a'; c.lineWidth = 1.4; c.stroke(); }
}
function claw(c, x, y, s, col) { c.save(); c.translate(x, y); c.scale(s, s); for (const a of [-.5, 0, .5]) { c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.sin(a) * 6, 5); c.strokeStyle = INK; c.lineWidth = 2.6; c.stroke(); c.strokeStyle = col; c.lineWidth = 1.4; c.stroke(); } aCirc(c, 0, 0, 2.6); aFI(c, col, 1.2); c.restore(); }

