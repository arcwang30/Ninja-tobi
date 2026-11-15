'use strict';
/* NINJA 鳶 TOBI — 玩法說明（分類分頁）＋製作名單（CREDIT）
   玩法說明：每一頁是一個分類（基本操作&關卡／斬擊／成長；「敵人」「魔王與關卡」兩頁已移除），每一項＝圖示＋一句話說明；
   左右箭頭或左右滑動切頁。圖示在開機時用遊戲的繪圖函式畫好（開機遮罩還蓋著時），之後直接用圖片 */
const HELP_PAGES = [
  { t: ['畫面說明', '画面の見かた', 'Screen Guide'], shot: 'assets/help_screen.webp', items: [   // 第一頁：一張標好編號的遊戲畫面＋逐項說明（圖片是遊戲畫面加上編號，存成 assets/help_screen.webp）
    ['1', ['分數', 'スコア', 'Score'], ['斬殺敵人、往上爬、連斬都會加分。', '敵を斬る・上へ登る・連斬でスコアが増える。', 'Earn points by cutting foes, climbing and chaining combos.']],
    ['2', ['高度', '高さ', 'Height'], ['這一局爬了幾公尺。', 'この回で登った高さ。', 'How high you have climbed this run.']],
    ['3', ['關卡與舞台', 'ステージと舞台', 'Stage'], ['目前的關卡和第幾舞台；小黃條是舞台進度，第 5、10 舞台出現魔王（數字變紅）。', '今のステージと舞台。黄色いバーは進み具合、第5・10舞台は魔王（数字が赤）。', 'Current stage and part; the bar shows progress. Bosses appear on parts 5 and 10 (red number).']],
    ['4', ['暫停', 'ポーズ', 'Pause'], ['暫停遊戲，可以查看技能、說明或離開。', '一時停止。技やヘルプの確認、終了ができる。', 'Pause to check skills, read help or quit.']],
    ['5', ['HP（命）', 'HP（命）', 'HP'], ['剩下的血量；低於 30% 會閃爍，畫面四周出現紅色心跳警示。', '残りの体力。30%未満で点滅し、画面の四隅が赤く脈打つ。', 'Your health. Below 30% it flashes and the screen edges pulse red.']],
    ['6', ['小判', '小判', 'Koban'], ['這一局撿到的小判數，帶回藏寶箱使用。', 'この回で拾った小判。宝箱で使える。', 'Koban collected this run, spent in the Treasure Chest.']],
    ['7', ['氣', '気', 'Ki'], ['衝刺斬、急降斬要消耗的次數，落地後慢慢回復。', '突進斬り・急降斬で使う回数。着地すると少しずつ回復。', 'Charges for Dash and Dive Slash; they refill after landing.']],
    ['8', ['技能', '技', 'Skills'], ['目前擁有的自動技能，小數字是等級。', '持っている自動の技。小さい数字はレベル。', 'Your automatic skills; the small number is the level.']],
    ['9', ['等級與經驗條', 'レベルと経験値', 'Level & XP'], ['經驗條集滿就升級，從三個強化選一個。', '経験値がたまるとレベルアップ、3つから強化を1つ選ぶ。', 'Fill the bar to level up and pick 1 of 3 upgrades.']],
    ['10', ['忍法卷軸按鈕', '忍法巻物ボタン', 'Ninjutsu Button'], ['有卷軸時才出現在下方中間，紅色數字是張數，點一下發動忍法。', '巻物があるときだけ下中央に出る。赤い数字は枚数、タップで忍法。', 'Appears at the bottom center when you have scrolls (red number = count). Tap to cast.']],
    ['11', ['追上來的危險', '迫る危険', 'Rising Danger'], ['下方的火海、狂風、熔岩、雪崩會往上追，掉進去會扣 HP。', '下から炎・暴風・溶岩・雪崩が迫る。落ちるとHPが減る。', 'Fire, gales, lava or avalanches rise from below — falling in costs HP.']],
    ['12', ['一般敵人', '普通の敵', 'Regular Foes'], ['碰到就自動斬殺，並再往上彈跳一次。', '触れると自動で斬って、もう一度跳ねる。', 'Touch to cut them automatically and bounce again.']],
    ['13', ['危險敵人', '危険な敵', 'Dangerous Foes'], ['外圍有紅色鋸齒光暈的（例如鬼火）碰到會扣 HP，不能斬，要閃開。', '赤いギザギザの光をまとう敵（鬼火など）は触れるとHPが減る。斬れないので避けよう。', 'Foes with a red jagged aura (like will-o\'-wisps) hurt on touch and can\'t be cut — dodge them.']],
    ['14', ['攻擊型敵人', '攻撃してくる敵', 'Attacking Foes'], ['會丟手裡劍或射箭，打中會扣 HP；本體碰到一樣可以斬殺。', '手裏剣や矢を撃ってくる。当たるとHPが減るが、本体は触れれば斬れる。', 'They throw shuriken or shoot arrows that hurt, but touching them still cuts them.']],
    ['15', ['道具', 'アイテム', 'Items'], ['碰到就自動撿起：金色小判帶回商店、卷軸增加忍法次數、寶箱得到技能或強化、藍色的魂是經驗值。', '触れると自動で拾う：小判はショップで使い、巻物は忍法の回数、宝箱は技や強化、青い魂は経験値。', 'Touch to collect: koban for the shop, scrolls for ninjutsu, chests for skills or upgrades, blue souls for XP.']],
  ] },
  { t: ['操作&關卡', '操作&ステージ', 'Controls & Stages'], items: [   // 原本「魔王與關卡」頁的「追上來的危險」「機關」併到這一頁
    ['move', ['移動與跳躍', '移動とジャンプ', 'Move & Jump'], ['忍者會自動彈跳；按住畫面左右滑動來移動。', '忍者は自動で跳ねる。押したまま左右にスライドで移動。', 'You bounce automatically. Hold and slide left/right to move.']],
    ['wall', ['蹬牆跳', '壁蹴り', 'Wall Kick'], ['空中往牆推會自動蹬牆，每次落地前一次。', '空中で壁に向かうと自動で壁蹴り（着地まで一回）。', 'Push into a wall mid-air to kick off (once per landing).']],
    ['scroll', ['忍法卷軸', '忍法巻物', 'Ninjutsu Scroll'], ['點一下畫面下方中間的卷軸按鈕發動「豪天翔」：無敵並急速上升。', '画面下中央の巻物ボタンで「豪天翔」：無敵で急上昇。', 'Tap the scroll button (lower center) to soar up, invincible.']],
    ['zone', ['追上來的危險', '迫る危険', 'Rising Danger'], ['下方的火海、龍捲風、熔岩、雪崩會上升，掉進去會扣 HP。', '下から炎・竜巻・溶岩・雪崩が迫る。落ちるとHPが減る。', 'Fire, tornadoes, lava or avalanches rise from below — falling in costs HP.']],
    ['plat', ['機關', 'しかけ', 'Gimmicks'], ['跳台雙倍彈跳、半毀地板只能踩一次、釘刺會受傷。', 'ジャンプ台は2倍、壊れる床は一度だけ、まきびしは痛い。', 'Springs boost, cracked floors break, spikes hurt.']],
  ] },
  { t: ['斬擊', '斬撃', 'Slashing'], items: [
    ['dash', ['衝刺斬', '突進斬り', 'Dash Slash'], ['手指快速往上、左上或右上滑，就往那個方向高速衝刺，沿路碰到的敵人一律斬殺；撞到牆會反彈。消耗 1 格氣。', '指を素早く上・左上・右上へはらうと、その方向へ高速で突進し、触れた敵をすべて斬る。壁に当たると跳ね返る。気を1消費。', 'Flick up, up-left or up-right to dash that way, cutting every foe in your path. Walls bounce you back. Uses 1 Ki.']],
    ['dive', ['急降斬', '急降斬', 'Dive Slash'], ['手指快速往下滑，往下劈，著地的衝擊波斬殺周圍。', '指を素早く下へはらうと急降下、着地の衝撃波で周りを斬る。', 'Flick down fast to dive; the landing shockwave cuts nearby foes.']],
    ['combo', ['空中連斬', '空中連斬', 'Air Combo'], ['連續斬殺，得分 × 連斬數；落地 0.8 秒內再斬可延續。', '連続で斬ると得点×連斬数。着地後0.8秒以内に斬れば継続。', 'Chain kills: score × combo. Slash within 0.8s of landing to keep it.']],
    ['fever', ['狂熱', 'フィーバー', 'Fever'], ['10 連斬進入狂熱：得分 ×2、衝刺只花半格氣。', '10連斬でフィーバー：得点×2、突進の気が半分。', 'A 10-hit combo starts Fever: score ×2, dashes cost ½ Ki.']],
  ] },
  { t: ['成長', '成長', 'Growth'], items: [
    ['soul', ['魂與升級', '魂とレベルアップ', 'Souls & Level Up'], ['吸收藍色的魂，集滿經驗條就升級，從三個強化選一個。', '青い魂を集めてレベルアップ、3つから1つ強化を選ぶ。', 'Collect blue souls to level up and pick 1 of 3 upgrades.']],
    ['koban', ['小判', '小判', 'Koban'], ['金色小判帶回藏寶箱，買新忍者和換裝。', '金の小判は宝箱で忍者や着せ替えに使う。', 'Spend gold koban in the Treasure Chest on ninjas and outfits.']],
    ['evo', ['技能進化', '技の進化', 'Evolution'], ['技能練到 Lv5 並持有對應被動，寶箱就會出現進化。', '技をLv5にして対応する強化を持つと、宝箱で進化が出る。', 'Max a skill (Lv5) with its paired perk to evolve it from a chest.']],
  ] },
];
let helpPg = 0;
const HELP_IC = {};
// 圖示：借用主畫布左上角畫好再複製出來（開機遮罩蓋著時畫，玩家看不到；之後每一幀主畫布都會重畫）
function buildHelpIcons() {
  if (HELP_IC.move) return;
  const S = 160, kinds = HELP_PAGES.filter(p => !p.shot).flatMap(p => p.items.map(i => i[0]));   // 畫面說明頁用編號，不畫圖示
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
  else if (k === 'dash') { c.strokeStyle = '#ffd27a'; c.lineWidth = 4; c.lineCap = 'round'; for (const a of [-Math.PI / 2, -Math.PI / 2 - .75, -Math.PI / 2 + .75]) { const x0 = 50 + Math.cos(a) * 26, y0 = 50 + Math.sin(a) * 26, x1 = 50 + Math.cos(a) * 40, y1 = 50 + Math.sin(a) * 40; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); arrow(50 + Math.cos(a) * 44, 50 + Math.sin(a) * 44, a); } hero(50, 92, 1.0, { pose: 'dash', eye: 'focus' }); }   // 衝刺斬：往上、左上、右上三個方向的箭頭
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
  else if (k === 'boss') drawBoss({ kind: 0, t: .6, skillT: 9, warn: 0 }, 50, 50, .68);   // 真妖鬼（林關魔王）
  else if (k === 'zone') { for (let i = 0; i < 6; i++) { c.fillStyle = ['#d8300a', '#ff7a1a', '#ffd25a'][i % 3]; c.beginPath(); c.moveTo(i * 18 - 6, 100); c.quadraticCurveTo(i * 18 - 10, 66, i * 18 + 6, 40 + (i % 2) * 16); c.quadraticCurveTo(i * 18 + 16, 70, i * 18 + 14, 100); c.closePath(); c.fill(); } hero(50, 40, .95, { hurt: .3 }); }
  else if (k === 'plat') { aRR(c, 14, 62, 72, 12, 6); aFI(c, '#f2f4ef', 2.4); c.strokeStyle = '#c0262d'; c.lineWidth = 3.4; c.beginPath(); for (let i = 0; i < 5; i++) c.lineTo(i % 2 ? 58 : 42, 60 - i * 7); c.stroke(); aRR(c, 34, 22, 32, 8, 3); aFI(c, '#ffd27a', 2); arrow(50, 12, -Math.PI / 2); }
}
function renderHelp() {
  const P = HELP_PAGES[helpPg];
  tabs('hpTabs', HELP_PAGES.map(p => L(p.t)), helpPg, 'hptab');   // 分頁按鈕（和商店、成就同款）
  $('hpPage').innerHTML = (P.shot ? `<button class="hp-shot" data-act="hpzoom" aria-label="zoom"><img src="${P.shot}" alt=""><i>🔍</i></button>` : '') +   // 畫面說明：上方一張標好編號的遊戲畫面（點一下放大）
    P.items.map(([k, n, d]) => `<div class="hp-row">${P.shot ? `<span class="hp-num">${k}</span>` : `<img src="${HELP_IC[k] || ''}" alt="">`}<div><b>${L(n)}</b><small>${L(d)}</small></div></div>`).join('');
  $('hpPage').classList.remove('turn'); void $('hpPage').offsetWidth; $('hpPage').classList.add('turn');
  $('hpPage').scrollTop = 0; requestAnimationFrame(helpScrollHint); const im = $('hpPage').querySelector('img'); if (im && !im.complete) im.onload = helpScrollHint;   // 捲動提示（圖片載入後高度才確定）
}
function helpPage(d) { helpPg = (helpPg + d + HELP_PAGES.length) % HELP_PAGES.length; renderHelp(); }
// 左右滑動切頁
(() => {
  const el = document.getElementById('hpPage'); let sx = null;
  el.addEventListener('pointerdown', e => { sx = e.clientX; });
  el.addEventListener('pointerup', e => { if (sx === null) return; const dx = e.clientX - sx; sx = null; if (Math.abs(dx) > 40) { SFX.click(); helpPage(dx < 0 ? 1 : -1); } });
})();
// 畫面說明的截圖：點一下全螢幕放大，再點一下關閉
function helpZoom() {
  const P = HELP_PAGES[helpPg]; if (!P || !P.shot) return;
  const d = document.createElement('div'); d.id = 'hpZoom'; d.innerHTML = `<img src="${P.shot}" alt="">`;
  d.addEventListener('click', () => d.remove());
  $('help').appendChild(d);
}
// 捲動提示：內容比可視範圍長時，清單底部淡出＋「上下滑動看更多」的提示；捲到底就不再淡出，捲動過一次提示就收起
function helpScrollHint() {
  const el = $('hpPage'), hint = $('hpMore'); if (!el || !hint) return;
  const more = el.scrollHeight - el.clientHeight > 8, end = el.scrollTop + el.clientHeight >= el.scrollHeight - 6;
  el.classList.toggle('fade-b', more && !end);
  el.classList.toggle('fade-t', el.scrollTop > 6);
  hint.classList.toggle('on', more && !end && el.scrollTop < 30);
}
$('hpPage').addEventListener('scroll', helpScrollHint, { passive: true });
