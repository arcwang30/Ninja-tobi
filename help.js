'use strict';
/* NINJA 鳶 TOBI — 玩法說明（分類分頁）＋製作名單（CREDIT）
   玩法說明：每一頁是一個分類（基本操作／斬擊／成長／敵人／魔王與關卡），每一項＝圖示＋一句話說明；
   左右箭頭或左右滑動切頁。圖示在開機時用遊戲的繪圖函式畫好（開機遮罩還蓋著時），之後直接用圖片 */
const HELP_PAGES = [
  { t: ['基本操作', '基本操作', 'Basics'], items: [
    ['move', ['移動與跳躍', '移動とジャンプ', 'Move & Jump'], ['忍者會自動彈跳；按住畫面左右滑動來移動。', '忍者は自動で跳ねる。押したまま左右にスライドで移動。', 'You bounce automatically. Hold and slide left/right to move.']],
    ['wall', ['蹬牆跳', '壁蹴り', 'Wall Kick'], ['空中往牆推會自動蹬牆，每次落地前一次。', '空中で壁に向かうと自動で壁蹴り（着地まで一回）。', 'Push into a wall mid-air to kick off (once per landing).']],
    ['scroll', ['忍法卷軸', '忍法巻物', 'Ninjutsu Scroll'], ['點一下畫面下方中間的卷軸按鈕發動「豪天翔」：無敵並急速上升。', '画面下中央の巻物ボタンで「豪天翔」：無敵で急上昇。', 'Tap the scroll button (lower center) to soar up, invincible.']],
  ] },
  { t: ['斬擊', '斬撃', 'Slashing'], items: [
    ['aim', ['彈射斬', '弾き斬り', 'Sling Slash'], ['按住不動瞄準、往反方向拉、放開發射。消耗 1 格氣。', '押したまま止めて照準、反対に引いて離すと発射。気を1消費。', 'Hold still to aim, pull back and release. Uses 1 Ki.']],
    ['dive', ['急降斬', '急降斬', 'Dive Slash'], ['往上拉（或快速下滑）往下劈，著地的衝擊波斬殺周圍。', '上に引く（下フリック）と急降下、着地の衝撃波で周りを斬る。', 'Pull up (or flick down) to dive; the landing shockwave cuts nearby foes.']],
    ['combo', ['空中連斬', '空中連斬', 'Air Combo'], ['不落地連續斬殺，得分 × 連斬數，落地時結算。', '着地せずに斬り続けると得点×連斬数、着地で精算。', 'Chain kills without landing: score × combo, cashed in on landing.']],
    ['fever', ['狂熱', 'フィーバー', 'Fever'], ['10 連斬進入狂熱：得分 ×2、氣無限。', '10連斬でフィーバー：得点×2、気が無限。', 'A 10-hit combo starts Fever: score ×2, infinite Ki.']],
  ] },
  { t: ['成長', '成長', 'Growth'], items: [
    ['soul', ['魂與升級', '魂とレベルアップ', 'Souls & Level Up'], ['吸收藍色的魂，集滿經驗條就升級，從三個強化選一個。', '青い魂を集めてレベルアップ、3つから1つ強化を選ぶ。', 'Collect blue souls to level up and pick 1 of 3 upgrades.']],
    ['koban', ['小判', '小判', 'Koban'], ['金色小判帶回整備商店，買新忍者和強化。', '金の小判はショップで忍者や強化に使う。', 'Spend gold koban in the shop on ninjas and upgrades.']],
    ['evo', ['技能進化', '技の進化', 'Evolution'], ['技能練到 Lv5 並持有對應被動，寶箱就會出現進化。', '技をLv5にして対応する強化を持つと、宝箱で進化が出る。', 'Max a skill (Lv5) with its paired perk to evolve it from a chest.']],
  ] },
  { t: ['敵人', '敵', 'Enemies'], items: [
    ['foe', ['雜兵', '雑兵', 'Minions'], ['一般忍者、烏鴉、小天狗，碰到就斬。', '普通の忍者・カラス・小天狗は触れれば斬れる。', 'Ninjas, crows and small tengu are cut on contact.']],
    ['shooter', ['攻擊型', '攻撃型', 'Attackers'], ['手裡劍、弓、土遁、蜘蛛、鬼火的攻擊會傷人。', '手裏剣・弓・土遁・蜘蛛・鬼火の攻撃はダメージ。', 'Shuriken, arrows, earth ninja, spiders and wisps can hurt you.']],
    ['shield', ['盾與爆彈', '盾と爆弾', 'Shield & Bomb'], ['盾忍從下方撞會被打落；爆彈忍斬殺後會爆炸。', '盾忍者は下からぶつかると落とされる。爆弾忍者は斬ると爆発。', 'Hit a shield ninja from below and you fall; bombers explode.']],
    ['elite', ['菁英', '精鋭', 'Elite'], ['要斬兩刀以上，帶有詞綴並掉寶箱。', '二回以上斬る必要あり、特性付きで宝箱を落とす。', 'Takes 2+ hits, has a trait and drops a chest.']],
  ] },
  { t: ['魔王與關卡', '魔王とステージ', 'Bosses & Stages'], items: [
    ['tengu', ['大天狗', '大天狗', 'Great Tengu'], ['每一幕中段出現，限時內擊倒可以開寶箱。', '各幕の中盤に出現、時間内に倒すと宝箱。', 'Appears mid-act; defeat it in time for a chest.']],
    ['boss', ['魔王 QTE', '魔王 QTE', 'Boss QTE'], ['碰到魔王進入 QTE：連打或快速滑動。', '魔王に触れるとQTE：連打かスワイプ。', 'Touch the boss to start a QTE: mash or swipe.']],
    ['zone', ['追上來的危險', '迫る危険', 'Rising Danger'], ['下方的火海、龍捲風、熔岩、雪崩會上升，掉進去會扣 HP。', '下から炎・竜巻・溶岩・雪崩が迫る。落ちるとHPが減る。', 'Fire, tornadoes, lava or avalanches rise from below — falling in costs HP.']],
    ['plat', ['機關', 'しかけ', 'Gimmicks'], ['跳台雙倍彈跳、半毀地板只能踩一次、釘刺會受傷。', 'ジャンプ台は2倍、壊れる床は一度だけ、まきびしは痛い。', 'Springs boost, cracked floors break, spikes hurt.']],
  ] },
];
let helpPg = 0;
const HELP_IC = {};
// 圖示：借用主畫布左上角畫好再複製出來（開機遮罩蓋著時畫，玩家看不到；之後每一幀主畫布都會重畫）
function buildHelpIcons() {
  if (HELP_IC.move) return;
  const S = 160, kinds = HELP_PAGES.flatMap(p => p.items.map(i => i[0]));
  for (const k of kinds) {
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, S, S); ctx.scale(S / 100, S / 100);
    try { helpIconDraw(k); } catch (e) { }
    ctx.restore();
    const ic = document.createElement('canvas'); ic.width = ic.height = S; ic.getContext('2d').drawImage(cv, 0, 0, S, S, 0, 0, S, S);
    try { HELP_IC[k] = ic.toDataURL(); } catch (e) { HELP_IC[k] = ''; }
  }
}
function helpIconDraw(k) {
  const c = ctx, hero = (x, y, s, o) => { c.save(); c.translate(x, y); c.scale(s, s); drawHeroNinja(0, 0, Object.assign({ face: 1, t: .4, vy: 0, skin: save.skin }, o), c); c.restore(); };
  const arrow = (x, y, a) => { c.save(); c.translate(x, y); c.rotate(a); c.fillStyle = '#ffd27a'; c.beginPath(); c.moveTo(10, 0); c.lineTo(-4, -8); c.lineTo(-4, 8); c.closePath(); c.fill(); c.strokeStyle = INK; c.lineWidth = 2; c.stroke(); c.restore(); };
  if (k === 'move') { hero(50, 84, 1.25, { vy: -700 }); arrow(14, 54, Math.PI); arrow(86, 54, 0); }
  else if (k === 'wall') { c.fillStyle = '#4f9c48'; c.fillRect(6, 0, 14, 100); c.fillStyle = '#2b6a30'; for (let y = 10; y < 100; y += 30) c.fillRect(4, y, 18, 4); hero(54, 80, 1.15, { face: 1, vy: -600, spin: .3 }); }
  else if (k === 'scroll') { bossGlow(c, 50, 50, 44, 'rgba(255,220,120,.7)'); scrollItem(c, 50, 50, 2.6, -.3); }
  else if (k === 'aim') { hero(36, 86, 1.1, { pose: 'apex', eye: 'focus' }); c.strokeStyle = '#ffffff'; c.lineWidth = 3; c.setLineDash([5, 5]); c.beginPath(); c.moveTo(48, 52); c.quadraticCurveTo(70, 26, 90, 12); c.stroke(); c.setLineDash([]); arrow(88, 14, -.7); }
  else if (k === 'dive') { c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 3; for (const x of [32, 50, 68]) { c.beginPath(); c.moveTo(x, 4); c.lineTo(x, 30); c.stroke(); } hero(50, 72, 1.15, { dive: true }); c.fillStyle = 'rgba(255,255,255,.7)'; aEll(c, 50, 92, 36, 5); c.fill(); }
  else if (k === 'combo') { txt('連', 44, 48, 52, '#ffffff', 'center', '#c0262d', 8); txt('×10', 72, 78, 24, '#ffd27a', 'center', '#000', 5); }
  else if (k === 'fever') { for (let i = 0; i < 5; i++) { c.fillStyle = ['#ff6a1a', '#ffd25a'][i % 2]; c.beginPath(); c.moveTo(14 + i * 18, 92); c.quadraticCurveTo(6 + i * 18, 60, 22 + i * 18, 30 + (i % 2) * 14); c.quadraticCurveTo(32 + i * 18, 64, 30 + i * 18, 92); c.closePath(); c.fill(); } txt('×2', 50, 54, 34, '#ffffff', 'center', '#c0262d', 7); }
  else if (k === 'soul') { const gr = c.createRadialGradient(46, 46, 4, 50, 52, 30); gr.addColorStop(0, '#ffffff'); gr.addColorStop(.4, '#8ae0ff'); gr.addColorStop(1, '#2a7ad8'); c.fillStyle = gr; c.beginPath(); c.moveTo(50, 22); c.quadraticCurveTo(80, 40, 72, 66); c.quadraticCurveTo(50, 90, 30, 70); c.quadraticCurveTo(20, 46, 50, 22); c.fill(); aInk(c, 2.4); c.fillStyle = INK; aEll(c, 42, 56, 3, 4.4); c.fill(); aEll(c, 58, 56, 3, 4.4); c.fill(); }
  else if (k === 'koban') { drawKoban(c, 50, 52, 24, 34, 1, 0); }
  else if (k === 'evo') { for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; c.fillStyle = i % 2 ? '#ffd25a' : '#ffffff'; c.beginPath(); c.moveTo(50 + Math.cos(a - .1) * 14, 50 + Math.sin(a - .1) * 14); c.lineTo(50 + Math.cos(a) * 46, 50 + Math.sin(a) * 46); c.lineTo(50 + Math.cos(a + .1) * 14, 50 + Math.sin(a + .1) * 14); c.fill(); } txt('EVO', 50, 52, 24, '#c0262d', 'center', '#fff', 6); }
  else if (k === 'foe') drawEnemy(50, 50, 0, 1.7, .4, { look: 1, bx: 0 });
  else if (k === 'shooter') drawEnemy(50, 50, 3, 1.6, .4, { look: 1, bx: 1, warn: 1 });
  else if (k === 'shield') drawEnemy(50, 46, 4, 1.5, .4, { look: 1, bx: 2 });
  else if (k === 'elite') drawEnemy(50, 52, 6, 1.5, .4, { look: 1, bx: 3 });
  else if (k === 'tengu') drawEnemy(50, 54, 13, .62, .4, { look: 1, bx: 4 });
  else if (k === 'boss') drawBoss({ kind: 0, t: .6, skillT: 9, warn: 0 }, 50, 50, .68);
  else if (k === 'zone') { for (let i = 0; i < 6; i++) { c.fillStyle = ['#d8300a', '#ff7a1a', '#ffd25a'][i % 3]; c.beginPath(); c.moveTo(i * 18 - 6, 100); c.quadraticCurveTo(i * 18 - 10, 66, i * 18 + 6, 40 + (i % 2) * 16); c.quadraticCurveTo(i * 18 + 16, 70, i * 18 + 14, 100); c.closePath(); c.fill(); } hero(50, 40, .95, { hurt: .3 }); }
  else if (k === 'plat') { aRR(c, 14, 62, 72, 12, 6); aFI(c, '#f2f4ef', 2.4); c.strokeStyle = '#c0262d'; c.lineWidth = 3.4; c.beginPath(); for (let i = 0; i < 5; i++) c.lineTo(i % 2 ? 58 : 42, 60 - i * 7); c.stroke(); aRR(c, 34, 22, 32, 8, 3); aFI(c, '#ffd27a', 2); arrow(50, 12, -Math.PI / 2); }
}
function renderHelp() {
  const P = HELP_PAGES[helpPg];
  $('hpTitle').textContent = L(P.t);
  $('hpDots').innerHTML = HELP_PAGES.map((_, i) => `<i class="${i === helpPg ? 'on' : ''}"></i>`).join('');
  $('hpPage').innerHTML = P.items.map(([k, n, d]) => `<div class="hp-row"><img src="${HELP_IC[k] || ''}" alt=""><div><b>${L(n)}</b><small>${L(d)}</small></div></div>`).join('');
  $('hpPage').classList.remove('turn'); void $('hpPage').offsetWidth; $('hpPage').classList.add('turn');
}
function helpPage(d) { helpPg = (helpPg + d + HELP_PAGES.length) % HELP_PAGES.length; renderHelp(); }
// 左右滑動切頁
(() => {
  const el = document.getElementById('hpPage'); let sx = null;
  el.addEventListener('pointerdown', e => { sx = e.clientX; });
  el.addEventListener('pointerup', e => { if (sx === null) return; const dx = e.clientX - sx; sx = null; if (Math.abs(dx) > 40) { SFX.click(); helpPage(dx < 0 ? 1 : -1); } });
})();
