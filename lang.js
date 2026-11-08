'use strict';
/* 多語系：每個字串是 [繁中, 日文, 英文]。{0}{1} 為參數。 */
const LANGS = [
  { id: 'zh', name: '中文' },
  { id: 'ja', name: '日本語' },
  { id: 'en', name: 'English' },
];
let LI = 0;   // 目前語言的索引
const L = x => Array.isArray(x) ? (x[LI] ?? x[0]) : x;
function t(k, ...a) {
  const v = STR[k];
  const s = v ? (v[LI] ?? v[0]) : k;
  return a.length ? s.replace(/\{(\d)\}/g, (m, i) => a[i]) : s;
}
function guessLang() {
  const n = (navigator.language || '').toLowerCase();
  return n.startsWith('ja') ? 'ja' : n.startsWith('zh') ? 'zh' : 'en';
}

const STR = {
  // ---- 開場 ----
  tap_start: ['點一下開始', 'タップしてスタート', 'TAP TO START'],
  cut_skip: ['點一下跳過', 'タップでスキップ', 'Tap to skip'],
  cut1: ['竹林之里，月圓之夜——', '竹林の里、満月の夜——', 'The Bamboo Village, on a night of the full moon—'],
  cut2: ['鬼族奪走了守護村子的「秘傳之卷」……', '鬼の一族が、里を守る「秘伝の巻」を奪い去った……', 'The Oni clan stole the Secret Scroll that guarded the village...'],
  cut3: ['「……交給我吧。」', '「……オレに任せろ。」', '"...Leave it to me."'],
  replay: ['重看開場', 'オープニングを見る', 'Watch Opening'],
  // ---- 每一幕的開場演出 ----
  zi_0: ['鬼火把竹林點燃了！', '鬼火が竹林に火を放った！', 'Oni fire set the bamboo ablaze!'],
  zi_1: ['大浪捲上來了！', '大波が押し寄せてくる！', 'A giant wave is rolling in!'],
  zi_2: ['鬼群從地底爬上來了！', '鬼の群れが地の底から這い上がる！', 'Oni are crawling up from below!'],
  zi_3: ['山洪暴發了！', '山津波だ！', 'A flash flood is coming!'],
  zi_run: ['往上逃！', '上へ逃げろ！', 'Climb for your life!'],
  zi_go: ['走！', '行け！', 'GO!'],
  zi_skip: ['點一下跳過', 'タップでスキップ', 'Tap to skip'],
  // ---- 製作名單 ----
  credit: ['製作名單', 'クレジット', 'Credits'],
  hist: ['了解歷史', '歴史を知る', 'History'],
  hist_fb: ['前往 Facebook 粉絲團', 'Facebook ファンページへ', 'Visit our Facebook page'],
  cr_r1: ['企劃・製作', '企画・制作', 'Planning & Production'],
  cr_r2: ['程式・美術', 'プログラム・アート', 'Code & Art'],
  cr_v2: ['全部以程式繪製（AI 協助製作）', 'すべてプログラムで描画（AI 協力）', 'Everything drawn in code (AI-assisted)'],
  cr_r3: ['樂曲・音效', '楽曲・効果音', 'Music & Sound'],
  cr_v3: ['全曲原創（AI 協助製作）', '全曲オリジナル（AI 協力）', 'All original (AI-assisted)'],
  cr_thx: ['感謝你的遊玩！', '遊んでくれてありがとう！', 'Thanks for playing!'],
  // ---- 標題與選單 ----
  tagline: ['我が名は鳶、いざ参る！', '我が名は鳶、いざ参る！', 'I am Tobi. Here I come!'],
  start: ['開始修行', '修行開始', 'Start Training'],
  shop: ['整備商店', '装備ショップ', 'Shop'],
  rank: ['排行・成就', '記録・実績', 'Records'],
  help: ['玩法說明', '遊び方', 'How to Play'],
  opt: ['設定', '設定', 'Settings'],
  koban: ['小判', '小判', 'Koban'],
  back: ['返回', '戻る', 'Back'],
  paused: ['暫停', 'ポーズ', 'Paused'],
  resume: ['繼續', '再開', 'Resume'],
  giveup: ['放棄並結算', '諦めて結果へ', 'Give Up'],
  retry: ['再次挑戰', 'もう一度', 'Try Again'],
  to_title: ['回標題', 'タイトルへ', 'Title'],
  help_ok: ['了解', 'OK', 'Got it'],
  help_go: ['開始', 'はじめる', 'Start'],
  snd: ['音效：{0}', 'サウンド：{0}', 'Sound: {0}'],
  vib: ['震動：{0}', '振動：{0}', 'Vibration: {0}'],
  lang: ['語言：{0}', '言語：{0}', 'Language: {0}'],
  reset: ['重置存檔', 'セーブデータ初期化', 'Reset Save Data'],
  reset_confirm: ['再按一次確認重置', 'もう一度押すと初期化', 'Tap again to confirm'],
  reset_done: ['存檔已重置', 'セーブデータを初期化しました', 'Save data reset'],
  // ---- 通關 ----
  clear_title: ['修行完成！', '修行完了！', 'Training Complete!'],
  clear_body: ['風・林・火・山 四幕全制霸。<br>要繼續挑戰<b>無盡之塔</b>嗎？每多爬一輪，敵人和死亡區域都會變得更強，分數也更高。', '風・林・火・山 の四幕を制覇。<br><b>無限の塔</b>に挑み続けますか？一周ごとに敵も死の領域も強くなり、スコアも上がります。', 'You conquered all four acts: Wind, Forest, Fire, Mountain.<br>Keep climbing the <b>Endless Tower</b>? Each loop makes enemies and the death zone stronger, and scores higher.'],
  clear_go: ['挑戰無盡之塔', '無限の塔へ', 'Climb the Endless Tower'],
  clear_end: ['在此結算', 'ここで終える', 'Finish Here'],
  // ---- 結算 ----
  over_clear: ['修行完成', '修行完了', 'Training Complete'],
  over_fail: ['修行中斷', '修行中断', 'Training Over'],
  new_record: ['新紀錄!', '新記録!', 'New Record!'],
  over_stats: ['高度 <b>{0}m</b>　斬殺 <b>{1}</b>　最大連斬 <b>{2}</b>', '高度 <b>{0}m</b>　撃破 <b>{1}</b>　最大連斬 <b>{2}</b>', 'Height <b>{0}m</b> · Kills <b>{1}</b> · Best chain <b>{2}</b>'],
  over_reach: ['到達 <b>{0}「{1}」</b>　擊破魔王 <b>{2}</b>', '到達 <b>{0}「{1}」</b>　魔王撃破 <b>{2}</b>', 'Reached <b>{0} "{1}"</b> · Bosses <b>{2}</b>'],
  over_coins: ['獲得小判 <b>+{0}</b>（持有 {1}）', '小判 <b>+{0}</b>（所持 {1}）', 'Koban <b>+{0}</b> (have {1})'],
  over_best: ['最佳紀錄 {0}', 'ベスト {0}', 'Best {0}'],
  // ---- 商店・排行 ----
  tab_ninja: ['角色', 'キャラ', 'Ninjas'],
  tab_train: ['修行', '修行', 'Training'],
  tab_rank: ['排行', 'ランキング', 'Ranking'],
  tab_ach: ['成就', '実績', 'Achievements'],
  ninja_name: ['忍者「{0}」', '忍者「{0}」', 'Ninja "{0}"'],
  owned: ['已擁有', '所持済み', 'Owned'],
  price: ['{0} 小判', '{0} 小判', '{0} Koban'],
  equipped: ['使用中', '使用中', 'Equipped'],
  equip: ['選用', '選択', 'Equip'],
  buy: ['購買', '購入', 'Buy'],
  train: ['修行', '修行', 'Train'],
  no_record: ['尚無紀錄', '記録なし', 'No records yet'],
  ach_toast: ['🏆 成就解鎖：{0}', '🏆 実績解除：{0}', '🏆 Achievement: {0}'],
  // ---- 秘傳 ----
  perk_start: ['修行開始：選擇起始技能', '修行開始：最初の技を選べ', 'Choose your starting skill'],
  perk_boss: ['擊破魔王！寶箱：選擇一項', '魔王撃破！宝箱：ひとつ選べ', 'Boss defeated! Treasure: choose one'],
  lvup: ['LEVEL UP！選擇一項', 'LEVEL UP！ひとつ選べ', 'LEVEL UP! Choose one'],
  perk_chest: ['寶箱！選擇一項', '宝箱！ひとつ選べ', 'Treasure! Choose one'],
  evo_hint: ['進化：Lv5 ＋ {0} → {1}', '進化：Lv5 ＋ {0} → {1}', 'Evolves: Lv5 + {0} → {1}'],
  evo_get: ['進化！{0}', '進化！{0}', 'EVOLVED! {0}'],
  start_skill: ['起始技能：{0}', '初期技：{0}', 'Starts with {0}'],
  mid_in: ['中 BOSS 出現', '中ボス出現', 'MID-BOSS'],
  mid_name: ['大天狗', '大天狗', 'Great Tengu'],
  mid_desc: ['碰到牠扣血・限時內擊倒可開寶箱', '触れてダメージ・時間内に倒すと宝箱', 'Touch it to deal damage · Defeat it in time for a chest'],
  mid_gone: ['大天狗飛走了…', '大天狗は飛び去った…', 'The Great Tengu flew off…'],
  mid_down: ['擊倒大天狗！', '大天狗撃破！', 'Great Tengu defeated!'],
  wave_crow: ['烏鴉群來襲！', 'カラスの群れ！', 'Crow flock!'],
  wave_tengu: ['小天狗俯衝！', '小天狗の急降下！', 'Tengu dive!'],
  wave_onibi: ['鬼火包圍！（碰到會受傷）', '鬼火に囲まれた！（触れると痛い）', 'Will-o-wisps! (they hurt)'],
  wave_archer: ['弓忍埋伏！', '弓忍の待ち伏せ！', 'Archer ambush!'],
  wave_spider: ['蜘蛛垂降！', '蜘蛛が降りてきた！', 'Spiders descend!'],
  webbed: ['被蛛絲纏住!', '蜘蛛の糸!', 'Webbed!'],
  perk_none: ['全部滿級！回復 30 HP 並獲得 20 小判', 'すべて最大！HP30回復と20小判', 'All maxed! Heal 30 HP and gain 20 koban'],
  cat: [['攻擊', '防禦', '輔助', '被動', '進化'], ['攻撃', '防御', '補助', 'パッシブ', '進化'], ['Attack', 'Defense', 'Support', 'Passive', 'Evolve']],
  blocked: ['結界!', '結界!', 'Blocked!'],
  sk_shuriken: ['每 {0} 秒自動朝最近的敵人投擲 {1} 枚手裡劍', '{0}秒ごとに近くの敵へ手裏剣を{1}枚投げる', 'Throws {1} shuriken at the nearest enemy every {0}s'],
  sk_kunai: ['{0} 把苦無繞身旋轉，斬殺碰到的敵人並擋下飛鏢', '{0}本の苦無が周りを回り、触れた敵を斬り手裏剣を防ぐ', '{0} kunai orbit you, cutting enemies and blocking shuriken'],
  sk_thunder: ['每 {0} 秒落雷擊中畫面上 {1} 名敵人', '{0}秒ごとに画面内の敵{1}体へ落雷', 'Every {0}s, lightning strikes {1} enemy(s) on screen'],
  sk_wind: ['每次著地向左右發出風刃{0}', '着地するたびに左右へ風刃を放つ{0}', 'Each landing sends wind blades left and right{0}'],
  wind_bounce: ['，撞牆反彈一次', '、壁で一度反射', ', bouncing off walls once'],
  wind_diag: ['，並往斜上方多發兩道', '、斜め上にも二本', ', plus two diagonal blades'],
  sk_barrier: ['抵擋 {1} 次傷害（含死亡區域），{0} 秒後重新充能', 'ダメージを{1}回防ぐ（死の領域も）、{0}秒で再充填', 'Blocks {1} hit(s), death zone included; recharges in {0}s'],
  sk_aura: ['半徑 {0} 內彈開飛鏢，每 {1} 秒震波斬殺{2}', '半径{0}内の手裏剣を弾き、{1}秒ごとの波動で{2}を倒す', 'Deflects shuriken within {0}px; every {1}s a pulse slashes {2}'],
  aura_weak: ['周圍的雜兵', '周りの雑兵', 'nearby weak enemies'],
  aura_all: ['周圍所有敵人', '周りの敵すべて', 'all nearby enemies'],
  sk_shiki: ['式神鳥收集半徑 {0} 內的魂與小判{1}', '式神の鳥が半径{0}内の魂と小判を集める{1}', 'A spirit bird gathers souls and koban within {0}px{1}'],
  shiki_atk: ['，並每 {0} 秒啄擊敵人', '、{0}秒ごとに敵をついばむ', ', and pecks an enemy every {0}s'],
  sk_swift: ['氣的回復速度 ×{0}{1}', '気の回復速度 ×{0}{1}', 'Ki regen ×{0}{1}'],
  swift_ki: ['，氣上限 +{0}', '、気の上限 +{0}', ', max Ki +{0}'],
  reroll: ['重抽（剩餘 {0}）', '引き直し（残り {0}）', 'Reroll ({0} left)'],
  // ---- 遊戲中 ----
  act: [['第一幕', '第二幕', '第三幕', '第四幕'], ['第一幕', '第二幕', '第三幕', '第四幕'], ['Act I', 'Act II', 'Act III', 'Act IV']],
  loop: [' ・ 無盡 第{0}巡', ' ・ 無限 {0}周目', ' · Endless Loop {0}'],
  mod_line: ['異變「{0}」：{1}', '異変「{0}」：{1}', 'Anomaly "{0}": {1}'],
  danger: ['危險!', '危ない!', 'Danger!'],
  scroll_plus: ['忍法卷軸 +1', '忍法巻物 +1', 'Scroll +1'],
  koban_plus: ['小判 +{0}', '小判 +{0}', 'Koban +{0}'],
  tailwind: ['追風!', '追い風!', 'Tailwind!'],
  one_more: ['還差一刀!', 'あと一太刀!', 'One more!'],
  chain: ['{0} 連斬!', '{0} 連斬!', '{0} CHAIN!'],
  chain_hud: ['{0} 連斬', '{0} 連斬', '{0} CHAIN'],
  chain_bonus: ['{0} 連斬結算 +{1}', '{0} 連斬ボーナス +{1}', '{0} Chain Bonus +{1}'],
  chain_hint: ['落地即結算・再 {0} 斬進入狂熱', '着地で精算・あと{0}斬でフィーバー', 'Land to cash in · {0} more for FEVER'],
  fever: ['狂 熱 !!', 'フィーバー!!', 'FEVER!!'],
  fever_desc: ['得分 ×2・落地不中斷連斬・氣無限', 'スコア×2・着地で途切れない・気が無限', 'Score ×2 · Landing keeps the chain · Infinite Ki'],
  fever_hud: ['狂熱 ×2  {0}', 'フィーバー ×2  {0}', 'FEVER ×2  {0}'],
  ki: ['氣', '気', 'Ki'],
  ki_low: ['氣不足', '気が足りない', 'Not enough Ki'],
  tap_use: ['點擊發動', 'タップで発動', 'Tap to use'],
  wall_kick: ['蹬!', '蹴!', 'Kick!'],
  bank: ['反射!', '反射!', 'Bank!'],
  aim_go: ['放開發射', '離して発射', 'Release to launch'],
  aim_cancel: ['拖回中心可取消', '中心に戻すとキャンセル', 'Drag back to cancel'],
  aim_dive: ['急降斬', '急降斬', 'Dive Slash'],
  boss_in: ['BOSS 襲來', 'BOSS 襲来', 'BOSS INCOMING'],
  boss_appear: ['{0}登場!!', '{0}見参!!', '{0} appears!!'],
  boss_desc: ['技能：{0}　限時內接觸魔王發動 QTE', 'スキル：{0}　時間内に触れてQTE', 'Skill: {0} · Touch it in time to start the QTE'],
  boss_slow: ['降速!', '鈍足!', 'Slow!'],
  boss_freeze: ['冰凍!', '凍結!', 'Freeze!'],
  boss_repel: ['反彈!', '弾き!', 'Repelled!'],
  boss_flee: ['魔王逃竄中!', '魔王が逃げる!', 'The boss is fleeing!'],
  boss_down: ['擊破! +{0}', '撃破! +{0}', 'Defeated! +{0}'],
  boss_gone: ['魔王逃走了…', '魔王に逃げられた…', 'The boss escaped…'],
  cast_top: ['忍  法', '忍  法', 'NINJUTSU'],
  cast_name: ['豪天翔!', '豪天翔!', 'SKY SOAR!'],
  hp_word: ['HP', 'HP', 'HP'],

  // ---- 說明 ----
  help_body: [
`<p><b>跳躍</b>：忍者會自動彈跳。按住畫面並<b>左右滑動</b>移動角色，放開手指就停在原位。兩側是牆壁，空中往牆推會自動<b>蹬牆跳</b>（每次落地前一次）。電腦可用 ← → / A D。</p>
<p><b>彈射斬</b>：手指<b>按住不動一下</b>進入瞄準，時間變慢；往<b>反方向拉</b>，畫面會顯示含牆壁反彈的軌跡，路線上的敵人會亮起，接近敵人時會自動吸附。<b>放開發射</b>。拉回中心再放開可取消。往上拉（瞄準下方）就是<b>急降斬</b>：劈穿敵人，著地衝擊波斬殺周圍敵人、擊碎釘刺並高高彈起。每次消耗 1 格<b>「氣」</b>，斬殺敵人可回氣。熟練後也可以直接<b>快速上滑／下滑</b>（電腦：↑ / ↓）。</p>
<p><b>空中連斬</b>：碰到敵人會自動斬殺並再彈跳一次。一路踩著敵人往上、不落地，連斬數就會累積，每一斬得分 × 連斬數，<b>落地時結算</b>。<b>10 連斬</b>進入<b>狂熱</b>：得分 ×2、氣無限、落地不中斷。</p>
<p><b>魂與升級</b>：斬殺敵人會掉落<b>魂</b>（藍色）和<b>小判</b>（金色）。它們會先往上噴再慢慢落下，靠近就會吸收，掉出畫面就沒了。魂集滿畫面上方的藍色經驗條就<b>升級</b>，從 3 個選項選 1 個：<b>自動技能</b>（攻擊／防禦／輔助，最多同時 4 種，各到 Lv5）或<b>被動強化</b>。小判帶回整備商店使用。</p>
<p><b>敵人</b>：一般忍者和<b>烏鴉、小天狗</b>這類雜兵碰到就斬。攻擊型敵人的攻擊才會傷人：<b>投</b> 射手裡劍、<b>弓</b> 拋物線射箭、<b>土</b> 藏在地板裡，靠近時冒出來往上射苦無、<b>蛛</b> 吐絲讓你減速、<b>火</b>（鬼火）會飄向你，<b>直接碰到會受傷</b>，要用彈射斬、急降斬或技能打掉。<b>盾</b> 從下方撞到會被打落並中斷連斬，<b>爆</b> 斬殺後連鎖爆炸，<b>強</b>（菁英）要斬兩刀以上，帶有「迅捷／分裂／鐵壁」詞綴並掉寶箱。每隔一段時間會有一群敵人湧入（波次）。</p>
<p><b>中 BOSS 與進化</b>：每一幕中段會出現<b>大天狗</b>，碰到牠就扣牠的血，限時內擊倒會開寶箱。技能練到 <b>Lv5</b>，再持有卡片上寫的對應被動，打開魔王或大天狗的寶箱時就會出現<b>進化</b>選項。</p>
<p><b>角色</b>：每個角色的起始技能不同（鳶＝手裡劍、蒼＝苦無環、桜＝風刃、影＝雷遁），在整備商店購買與切換。</p>
<p><b>忍法卷軸</b>：點擊左上卷軸圖示（電腦：空白鍵）發動「豪天翔」，無敵並急速上升。</p>
<p><b>死亡區域</b>：畫面下方的火海／海嘯／怪獸不斷上升，掉進去會失去 HP。</p>
<p><b>機關</b>：<span class="t-spring">跳台</span>雙倍彈跳、<span class="t-crumble">半毀地板</span>只能踩一次、<span class="t-move">移動地板</span>、<span class="t-spike">釘刺</span>踩到受傷。</p>
<p><b>BOSS</b>：每一幕最後出現魔王，限時內碰到牠進入 QTE：<b>連打</b>（連續點擊）或<b>劃擊</b>（快速滑動）。擊破後打開寶箱，再選 1 項強化。</p>
<p><b>主線與無盡</b>：通過 風・林・火・山 四幕即修行完成，可選擇繼續挑戰<b>無盡之塔</b>，每一輪難度和分數都會提高。</p>`,
`<p><b>ジャンプ</b>：忍者は自動で跳ねる。画面を押したまま<b>左右にスライド</b>して移動、指を離すとその場に留まる。両側は壁。空中で壁に向かうと自動で<b>壁蹴り</b>（着地までに一回）。PC は ← → / A D。</p>
<p><b>弾き斬り</b>：指を<b>少し押したまま止める</b>と照準モードになり、時間が遅くなる。<b>反対方向に引く</b>と壁の反射も含めた軌道が表示され、軌道上の敵が光る。敵の近くを狙うと自動で吸い付く。<b>離して発射</b>。中心に戻して離すとキャンセル。上に引く（下を狙う）と<b>急降斬</b>：敵を貫き、着地の衝撃波で周りの敵を斬り、まきびしを砕いて高く跳ねる。一回につき<b>「気」</b>を1つ消費、敵を斬ると回復。慣れたら<b>素早く上下にフリック</b>でも出せる（PC：↑ / ↓）。</p>
<p><b>空中連斬</b>：敵に触れると自動で斬り、もう一度跳ねる。着地せずに敵を踏み続けると連斬数が増え、得点 × 連斬数。<b>着地で精算</b>。<b>10 連斬</b>で<b>フィーバー</b>：スコア×2、気が無限、着地しても途切れない。</p>
<p><b>魂とレベルアップ</b>：敵を斬ると<b>魂</b>（青）と<b>小判</b>（金）を落とす。一度跳ね上がってからゆっくり落ちてくるので、近づくと吸収、画面外に落ちると消える。魂で上の青い経験値バーが満ちると<b>レベルアップ</b>、3つから1つ選ぶ：<b>自動技</b>（攻撃／防御／補助、同時に4種まで、各Lv5）か<b>パッシブ強化</b>。小判はショップで使う。</p>
<p><b>敵</b>：普通の忍者や<b>カラス・小天狗</b>などの雑兵は触れれば斬れる。攻撃型の敵の攻撃だけがダメージ：<b>投</b> は手裏剣、<b>弓</b> は放物線の矢、<b>土</b> は床に潜み近づくと飛び出して苦無を撃つ、<b>蛛</b> は糸で足止め、<b>火</b>（鬼火）は寄ってきて<b>触れるとダメージ</b>、弾き斬り・急降斬・技で倒そう。<b>盾</b> は下からぶつかると叩き落とされ連斬が途切れる、<b>爆</b> は誘爆、<b>強</b>（精鋭）は二太刀以上必要で「迅速／分裂／鉄壁」の特性を持ち宝箱を落とす。一定時間ごとに敵の群れが押し寄せる。</p>
<p><b>中ボスと進化</b>：各幕の中盤に<b>大天狗</b>が現れる。触れるとダメージを与え、時間内に倒すと宝箱。技を<b>Lv5</b>にしてカードに書かれたパッシブを持っていると、魔王か大天狗の宝箱で<b>進化</b>を選べる。</p>
<p><b>キャラ</b>：キャラごとに初期技が違う（鳶＝手裏剣、蒼＝苦無の輪、桜＝風刃、影＝雷遁）。ショップで購入・切り替え。</p>
<p><b>忍法巻物</b>：左上の巻物アイコンをタップ（PC：スペース）で「豪天翔」、無敵で急上昇。</p>
<p><b>死の領域</b>：画面下の火の海・津波・怪獣がせり上がってくる。落ちると HP を失う。</p>
<p><b>仕掛け</b>：<span class="t-spring">跳び台</span>は二倍ジャンプ、<span class="t-crumble">朽ちた床</span>は一度きり、<span class="t-move">動く床</span>、<span class="t-spike">まきびし</span>は踏むとダメージ。</p>
<p><b>BOSS</b>：各幕の最後に魔王が現れる。時間内に触れると QTE：<b>連打</b>（連続タップ）か<b>斬り払い</b>（素早くスワイプ）。撃破すると宝箱から強化を1つ選べる。</p>
<p><b>本編と無限</b>：風・林・火・山 の四幕を越えると修行完了。続けて<b>無限の塔</b>に挑むと、周回ごとに難しく、スコアも高くなる。</p>`,
`<p><b>Jumping</b>: your ninja bounces automatically. Hold the screen and <b>slide left or right</b> to move; let go to stay put. There are walls on both sides: push into a wall in mid-air to <b>wall-kick</b> (once per landing). PC: ← → / A D.</p>
<p><b>Slingshot Slash</b>: <b>hold your finger still</b> for a moment to aim, and time slows down. <b>Pull back</b> in the opposite direction: a trajectory appears, including wall bounces, and enemies on the path light up. Aim near an enemy and it snaps on. <b>Release to launch</b>; drag back to the center to cancel. Pull up (aim down) for a <b>Dive Slash</b>: cut through enemies, and the landing shockwave slashes nearby foes, smashes spikes and bounces you high. Each costs 1 <b>Ki</b>; slashing enemies restores it. Once you get the hang of it, you can also <b>flick up / down</b> quickly (PC: ↑ / ↓).</p>
<p><b>Air Chains</b>: touching an enemy slashes it and bounces you again. Keep chaining enemies without landing to build a chain: each kill scores × chain count, <b>cashed in when you land</b>. A <b>10 chain</b> starts <b>FEVER</b>: score ×2, infinite Ki, landing keeps the chain.</p>
<p><b>Souls and Level Ups</b>: slain enemies drop <b>souls</b> (blue) and <b>koban</b> (gold). They pop up, then drift down slowly: get close to absorb them, and they're lost if they fall off screen. Fill the blue XP bar at the top to <b>level up</b> and choose 1 of 3: an <b>auto skill</b> (Attack / Defense / Support, up to 4 at once, each to Lv5) or a <b>passive upgrade</b>. Spend koban in the shop.</p>
<p><b>Enemies</b>: regular ninjas and fodder like <b>crows</b> and <b>tengu</b> are slashed on touch. Only attackers can hurt you: <b>投</b> throws shuriken, <b>弓</b> lobs arrows, <b>土</b> hides in floors and bursts out firing kunai upward, <b>蛛</b> spits webs that slow you, and <b>火</b> (will-o-wisps) float toward you and <b>hurt on contact</b>: take them out with a slingshot, dive or skills. Hitting a <b>盾</b> shield from below knocks you down and breaks your chain, <b>爆</b> explodes in chains, and <b>強</b> elites take 2+ hits, carry an affix (Swift / Split / Tough) and drop chests. Every so often a wave of enemies pours in.</p>
<p><b>Mid-boss and Evolution</b>: halfway through each act the <b>Great Tengu</b> appears. Touch it to deal damage; defeat it in time for a chest. Get a skill to <b>Lv5</b> and own the passive shown on its card, and a boss or Great Tengu chest offers an <b>Evolution</b>.</p>
<p><b>Ninjas</b>: each one starts with a different skill (Tobi: Shuriken, Ao: Kunai Ring, Sakura: Wind Blades, Kage: Lightning). Buy and switch in the shop.</p>
<p><b>Ninjutsu Scroll</b>: tap the scroll icon at top left (PC: Space) for SKY SOAR: invincible, rocketing upward.</p>
<p><b>Death Zone</b>: the fire, tsunami or monster at the bottom keeps rising. Fall in and you lose HP.</p>
<p><b>Traps</b>: <span class="t-spring">springs</span> double your jump, <span class="t-crumble">cracked floors</span> break after one step, <span class="t-move">moving floors</span>, and <span class="t-spike">spikes</span> hurt.</p>
<p><b>BOSS</b>: each act ends with a boss. Touch it in time to start a QTE: <b>MASH</b> (tap rapidly) or <b>SWIPE</b> (swipe fast). Defeat it to open a treasure chest and choose an upgrade.</p>
<p><b>Story and Endless</b>: clear all four acts (Wind, Forest, Fire, Mountain) to complete your training, then keep climbing the <b>Endless Tower</b>, where every loop gets harder and scores higher.</p>`,
  ],
};
