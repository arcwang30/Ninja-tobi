'use strict';
/* NINJA 鳶 TOBI — 忍者跳躍 Roguelike「忍者修行」（主線四幕＋無盡之塔）。文字在 lang.js */

// ===== 常數 =====
// 遊戲世界的邏輯寬度：手機固定 360；iPad 這類較寬的螢幕會把世界加寬（最多 960），左右才會滿版。
// 一局進行中不會改變（W_LOCK），轉向時先以原寬度縮放，回到標題或開新局再套用新寬度。
let W = 360, W_LOCK = false;
let H = 640;                    // 依螢幕比例在 640~900 之間調整（長螢幕手機不留黑邊）
const WK = () => W / 360;       // 世界比手機寬幾倍，生成地板和敵人時用來補密度
const GRAV = 1500, JUMP = 740, SPRING = 1060, FLY_V = 820;
const STAGE_PX = 6000;          // 每個舞台的高度（px），10px = 1m。約 1～1.5 分鐘一個舞台，一關 10 個舞台
const SENS = 1.25;              // 手指滑動靈敏度
const DASH_V = 950, DASH_T = .2, DIVE_V = 1150;   // 衝刺斬／急降斬
const FLICK_PX = 42, FLICK_MS = 130;             // 快速滑動判定：130ms 內垂直移動 42px
const WALL = 14;                                 // 左右牆壁厚度
const PL_MIN = WALL + 11; let PL_MAX = W - WALL - 11; // 玩家 x 可移動範圍（PL_MAX 隨 W 更新）
// 彈射瞄準：按住不動 AIM_HOLD 秒進入瞄準，拉超過 AIM_MIN 才會發射
const AIM_HOLD = .15, AIM_MIN = 22, AIM_MOVE = 10, AIM_SLOW = .3, AIM_SLOW_MAX = 2.5, DASH_T_AIM = .3;
const FONT = '"Noto Sans TC","Noto Sans JP","Microsoft JhengHei","PingFang TC","Hiragino Sans","Yu Gothic","Meiryo",sans-serif';

const INK = '#0e1414';          // 描邊用的黑（竹林夜襲風格）
const $ = id => document.getElementById(id);
const cv = $('cv'), ctx = cv.getContext('2d');
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = a => a[(Math.random() * a.length) | 0];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const THEMES = [
  { k: '林', sky: ['#1f7a40', '#0b3a20'], stalk: '#4f9c48', node: '#2b6a30', far: '#2d6e3a', zone: 'fire' },
  { k: '風', sky: ['#2f7fd8', '#d6f0ff'], stalk: '#8ccf98', node: '#5aa070', far: '#a8d8f0', zone: 'tornado' },
  { k: '火', sky: ['#0e0302', '#8a2208'], stalk: '#7a3626', node: '#4e1e14', far: '#3a100a', zone: 'lava' },
  { k: '山', sky: ['#7fa8d6', '#f2f8fd'], stalk: '#5d4a8a', node: '#392d66', far: '#4a3a7a', zone: 'avalanche' },
];
// 角色（商店「角色」分頁）：每名角色外觀不同、開局自帶專屬技能。
// out = 預設換裝顏色（OUTFITS 的索引，免費）；req = 要先達成的成就才會在商店上架（參考吸血鬼倖存者）
const SKINS = [
  { id: 'tobi', n: ['鳶', '鳶', 'Tobi'], cost: 0, sk: 'shuriken', out: 0 },
  { id: 'ao', n: ['蒼', '蒼', 'Ao'], cost: 300, sk: 'kunai', out: 1, req: 'run1' },
  { id: 'sakura', n: ['桜', '桜', 'Sakura'], cost: 600, sk: 'wind', out: 4, req: 'lv0r5' },
  { id: 'kage', n: ['影', '影', 'Kage'], cost: 1000, sk: 'thunder', out: 3, req: 'boss1' },
  { id: 'homura', n: ['焰', '焔', 'Homura'], cost: 1200, sk: 'tags', out: 0, req: 'chain3' },
  { id: 'kon', n: ['狐', '狐', 'Kon'], cost: 1500, sk: 'clone', out: 4, req: 'combo30' },
  { id: 'shizuku', n: ['雫', '雫', 'Shizuku'], cost: 1500, sk: 'water', out: 9, req: 'wx_rain' },
  { id: 'kasumi', n: ['霞', '霞', 'Kasumi'], cost: 1500, sk: 'mist', out: 6, req: 'wx_fog' },
  { id: 'gan', n: ['岩', '岩', 'Gan'], cost: 2500, sk: 'rock', out: 5, req: 'lv3c' },
  { id: 'kasa', n: ['笠', '笠', 'Kasa'], cost: 2500, sk: 'sickle', out: 7, req: 'boss10' },
];
// 換裝：10 種顏色（所有角色共用）。髮色、面具、斗笠、虎斑等招牌特徵不會變色
const OUTFITS = [
  { n: ['赤', '赤', 'Red'], suit: '#c0262d', dark: '#7a1218', band: '#ffffff', cost: 0 },
  { n: ['蒼', '蒼', 'Blue'], suit: '#2b5fb8', dark: '#173a78', band: '#ffd54a', cost: 300 },
  { n: ['桜', '桜', 'Sakura'], suit: '#e56aa0', dark: '#a03a6a', band: '#ffffff', cost: 300 },
  { n: ['影', '影', 'Shadow'], suit: '#2a2a33', dark: '#111116', band: '#e8403a', cost: 300 },
  { n: ['白', '白', 'White'], suit: '#eeeef2', dark: '#a8aab8', band: '#c0262d', cost: 300 },
  { n: ['翠', '翠', 'Jade'], suit: '#2e9a5a', dark: '#17603a', band: '#f4e27a', cost: 300 },
  { n: ['紫', '紫', 'Violet'], suit: '#7a3ec0', dark: '#4a2078', band: '#f2c14e', cost: 300 },
  { n: ['橙', '橙', 'Orange'], suit: '#ec7a22', dark: '#a84a10', band: '#2a2a33', cost: 300 },
  { n: ['金', '金', 'Gold'], suit: '#e8b84a', dark: '#9a6a1a', band: '#c0262d', cost: 1000 },
  { n: ['水', '水', 'Aqua'], suit: '#2ab4c8', dark: '#147080', band: '#ffffff', cost: 300 },
];
const outOf = i => { const v = save.charOut && save.charOut[i]; return v != null ? v : SKINS[i].out; };   // 角色目前穿的換裝
const heroPal = i => OUTFITS[outOf(i || 0)] || OUTFITS[0];
// 測試模式：商店全部開放、免費（正式上線前改回 false）
const TEST_FREE = true;
const outOwned = (o, ci = save.skin) => TEST_FREE || o === SKINS[ci].out || (save.outfits || []).includes(o);   // 預設色永遠可穿
const ENEMY = [
  { n: '敵', w: 34, h: 42, dur: .45, pts: 100, col: '#15151c' },  // 0 瘦
  { n: '敵', w: 42, h: 46, dur: .8, pts: 200, col: '#15151c' },   // 1 中
  { n: '敵', w: 56, h: 50, dur: 1.2, pts: 400, col: '#15151c' },  // 2 胖
  { n: '投', w: 38, h: 44, dur: .6, pts: 300, col: '#1c2a4a' },   // 3 手裡劍忍者：會射飛鏢
  { n: '盾', w: 44, h: 48, dur: .8, pts: 350, col: '#2a2a2a' },   // 4 盾忍者：從下方撞到會被打落
  { n: '爆', w: 40, h: 44, dur: .6, pts: 250, col: '#3a1414' },   // 5 爆彈忍者：斬殺後爆炸
  { n: '強', w: 46, h: 50, dur: 1.0, pts: 800, col: '#3a1a5a' },  // 6 菁英：要斬兩次，掉寶箱
  { n: '烏', w: 30, h: 22, dur: .3, pts: 60, col: '#1a1a22' },    // 7 烏鴉：成群橫越畫面的雜兵
  { n: '天', w: 34, h: 34, dur: .4, pts: 120, col: '#b8322a' },   // 8 小天狗：從上方俯衝的雜兵
  { n: '弓', w: 38, h: 44, dur: .6, pts: 300, col: '#2a3a1c' },   // 9 弓忍：拋物線射箭
  { n: '火', w: 28, h: 30, dur: .3, pts: 200, col: '#7a3ad0' },   // 10 鬼火：慢慢飄向玩家，直接碰到會受傷
  { n: '土', w: 40, h: 44, dur: .6, pts: 300, col: '#5a4026' },   // 11 土遁忍者：藏在地板，靠近時冒出並往上射苦無
  { n: '蛛', w: 34, h: 30, dur: .5, pts: 250, col: '#2a2030' },   // 12 蜘蛛：垂絲擺盪，吐絲讓玩家減速
  { n: '大', w: 72, h: 72, dur: 1.2, pts: 3000, col: '#c0262d' }, // 13 中 BOSS 大天狗
];
// 以下名稱與說明皆為 [繁中, 日文, 英文]
const BOSS_KINDS = [
  { n: ['真妖鬼', '真妖鬼', 'True Oni'], skill: ['金棒落', '金棒落とし', 'Club drops'], skill2: ['三連金棒落・踩裂站台', '三連金棒落とし・足場破壊', 'Triple club drops, breaks platforms'], col: '#d0302a' },
  { n: ['怠惰鬼', '怠惰鬼', 'Sloth Oni'], skill: ['睡魔霧（降速）', '睡魔の霧（鈍足）', 'Sleep mist (slows you)'], skill2: ['雙重睡魔霧・七連飛彈', '二重の睡魔の霧・七連弾', 'Double sleep mist, 7-way volley'], col: '#8a3fd0' },
  { n: ['雪女鬼', '雪女鬼', 'Snow Oni'], skill: ['吹雪（冰凍）', '吹雪（凍結）', 'Blizzard (freezes you)'], skill2: ['左右吹雪（冰凍）', '左右の吹雪（凍結）', 'Sweeping blizzard (freezes you)'], col: '#3fa6e0' },
  { n: ['鐵甲鬼', '鉄甲鬼', 'Iron Oni'], skill: ['突進', '突進', 'Charge'], skill2: ['護盾・連續突進', '盾・連続突進', 'Shield, double charge'], col: '#5a5a66' },
];
const PERKS = [
  { id: 'bounce', n: ['強腳', '強脚', 'Strong Legs'], d: ['跳躍高度 +8%', 'ジャンプ力 +8%', 'Jump height +8%'], max: 3, ic: '🦶' },
  { id: 'slowzone', n: ['退潮', '引き潮', 'Ebb Tide'], d: ['死亡區域上升速度 -15%', '死の領域の上昇 -15%', 'Death zone rises 15% slower'], max: 3, ic: '🌊' },
  { id: 'magnet', n: ['吸魂', '吸魂', 'Soul Magnet'], d: ['擴大魂、小判與道具的吸收範圍', '魂・小判・道具を吸い寄せる範囲が広がる', 'Larger pickup range for souls, koban and items'], max: 3, ic: '🧲' },
  { id: 'combo', n: ['連斬之心', '連斬の心', 'Chain Heart'], d: ['連斬持續時間 +1.2 秒、落地寬限 +0.2 秒', '連斬の持続 +1.2秒、着地猶予 +0.2秒', 'Chains last 1.2s longer, +0.2s landing grace'], max: 3, ic: '⚡' },
  { id: 'kimax', n: ['丹田', '丹田', 'Inner Core'], d: ['「氣」上限 +1（可多衝刺一次）', '「気」の上限 +1', 'Max Ki +1 (one more dash)'], max: 2, ic: '🔷' },
  { id: 'quake', n: ['震地', '震地', 'Earthshaker'], d: ['急降斬衝擊波範圍 +50%', '急降斬の衝撃波範囲 +50%', 'Dive Slash shockwave +50% size'], max: 2, ic: '💥' },
  { id: 'reach', n: ['長刀', '長刀', 'Long Blade'], d: ['斬擊接觸範圍擴大', '斬撃の当たり判定が広がる', 'Larger slash reach'], max: 3, ic: '🗡️' },
  { id: 'hp', n: ['鋼身', '鋼の体', 'Steel Body'], d: ['最大 HP +20 並回復 20', '最大HP +20、HPを20回復', 'Max HP +20 and heal 20'], max: 5, ic: '❤️' },
  { id: 'scroll', n: ['忍法修行', '忍法修行', 'Scroll Study'], d: ['立即獲得 1 張忍法卷軸', '忍法巻物を1枚得る', 'Gain 1 ninjutsu scroll now'], max: 99, ic: '📜' },
  { id: 'gold', n: ['黃金之手', '黄金の手', 'Golden Hand'], d: ['小判獲得量 +50%', '小判の獲得量 +50%', 'Koban gain +50%'], max: 3, ic: '💰' },
  { id: 'vamp', n: ['血刃', '血刃', 'Blood Blade'], d: ['每斬殺 6 名敵人回復 10 HP', '敵を6体斬るごとにHP10回復', 'Heal 10 HP every 6 kills'], max: 1, ic: '🩸' },
  { id: 'spikeproof', n: ['鐵足袋', '鉄足袋', 'Iron Tabi'], d: ['每一幕第一次踩到釘刺無效', '各幕で最初のまきびしを無効化', 'Ignore the first spikes each act'], max: 1, ic: '🥾' },
  { id: 'score', n: ['武運', '武運', 'Fortune of War'], d: ['得分 +20%', 'スコア +20%', 'Score +20%'], max: 3, ic: '🎯' },
  { id: 'lucky', n: ['福運', '福運', 'Good Luck'], d: ['寶箱與卷軸出現率提升', '宝箱と巻物が出やすくなる', 'More chests and scrolls'], max: 3, ic: '🎁' },
  { id: 'feather', n: ['鳶之羽', '鳶の羽', 'Kite Feather'], d: ['忍法「豪天翔」持續時間 +40%', '「豪天翔」の持続 +40%', 'SKY SOAR lasts 40% longer'], max: 2, ic: '🌀' },
];
// 自動技能：cat 0 攻擊、1 防禦、2 輔助。最多同時持有 SK_SLOTS 種，每種最高 SK_MAX 級
const SK_MAX = 5, SK_SLOTS = 4;
const SKILLS = [
  { id: 'shuriken', cat: 0, ic: '✴️', n: ['手裡劍', '手裏剣', 'Shuriken'] },
  { id: 'kunai', cat: 0, ic: '⚔️', n: ['苦無環', '苦無の輪', 'Kunai Ring'] },
  { id: 'thunder', cat: 0, ic: '🌩️', n: ['雷遁', '雷遁', 'Lightning'] },
  { id: 'wind', cat: 0, ic: '🌪️', n: ['風刃', '風刃', 'Wind Blades'] },
  { id: 'barrier', cat: 1, ic: '🛡️', n: ['結界', '結界', 'Barrier'] },
  { id: 'aura', cat: 1, ic: '💠', n: ['金剛氣', '金剛気', 'Diamond Aura'] },
  { id: 'shiki', cat: 2, ic: '🐦', n: ['式神鳥', '式神の鳥', 'Spirit Bird'] },
  { id: 'swift', cat: 2, ic: '💨', n: ['疾風', '疾風', 'Swift Wind'] },
  // 角色專屬技能（own：只有開局自帶的角色會在升級時抽到）
  { id: 'tags', cat: 0, ic: '🧧', own: 1, n: ['爆炎札', '爆炎札', 'Blast Tags'] },
  { id: 'clone', cat: 0, ic: '👥', own: 1, n: ['影分身', '影分身', 'Shadow Clone'] },
  { id: 'water', cat: 0, ic: '🌊', own: 1, n: ['水龍彈', '水龍弾', 'Water Dragon'] },
  { id: 'mist', cat: 0, ic: '☁️', own: 1, n: ['毒霧', '毒霧', 'Poison Mist'] },
  { id: 'rock', cat: 0, ic: '🪨', own: 1, n: ['落石', '落石', 'Rockfall'] },
  { id: 'sickle', cat: 0, ic: '⛓️', own: 1, n: ['鎖鐮', '鎖鎌', 'Chain Sickle'] },
];
// 各技能在第 l 級的數值；l = 6 代表已進化
const SKV = {
  shuriken: l => l > 5 ? { cd: .7, n: 4, pierce: true } : { cd: 2.2 - .3 * (l - 1), n: l >= 5 ? 3 : l >= 3 ? 2 : 1 },
  kunai: l => l > 5 ? { n: 6, r: 64, sp: 4.5 } : { n: [2, 2, 3, 3, 4][l - 1], r: 40 + 4 * l, sp: 3 + .4 * l },
  thunder: l => l > 5 ? { cd: 1.4, n: 3, chain: 2 } : { cd: 3.5 - .4 * (l - 1), n: l >= 5 ? 3 : l >= 4 ? 2 : 1, chain: 0 },
  wind: l => l > 5 ? { sp: 520, size: 28, bounce: 3, diag: true } : { sp: 380 + 30 * l, size: 14 + 2 * l, bounce: l >= 3 ? 1 : 0, diag: l >= 4 },
  barrier: l => l > 5 ? { cd: 7, max: 3, wave: true } : { cd: 22 - 3 * (l - 1), max: l >= 5 ? 2 : 1 },
  aura: l => l > 5 ? { r: 120, cd: 1.1, all: true } : { r: 50 + 8 * l, cd: 2.6 - .3 * (l - 1), all: l >= 3 },
  shiki: l => l > 5 ? { r: 2000, atk: 1.2 } : { r: 120 + 45 * l, atk: l >= 3 ? 4.5 - .5 * (l - 3) : 0 },
  swift: l => l > 5 ? { regen: 4, ki: 2 } : { regen: 1 + .3 * l, ki: l >= 5 ? 1 : 0 },
  tags: l => l > 5 ? { cd: 1.3, n: 3, r: 85, chain: true } : { cd: 2.5 - .25 * (l - 1), n: l >= 4 ? 2 : 1, r: 50 + 6 * l },
  clone: l => l > 5 ? { cd: 1.2, n: 3, guard: true } : { cd: 3 - .3 * (l - 1), n: l >= 4 ? 2 : 1 },
  water: l => l > 5 ? { cd: 1.6, w: 30, n: 3 } : { cd: 2.8 - .25 * (l - 1), w: 16 + 3 * l, n: 1 },
  mist: l => l > 5 ? { r: 80, life: 3.5, follow: true } : { r: 30 + 5 * l, life: 2.4 + .2 * l },
  rock: l => l > 5 ? { cd: 1.5, n: 3, r: 38, roll: true } : { cd: 3.2 - .3 * (l - 1), n: l >= 4 ? 2 : 1, r: 22 + 3 * l },
  sickle: l => l > 5 ? { cd: 1.2, r: 115, arc: 2 } : { cd: 2.2 - .2 * (l - 1), r: 70 + 8 * l, arc: 1 },
};
// 進化：技能 Lv5 ＋ 持有對應的被動（p），打開魔王或中 BOSS 的寶箱時出現
const EVO = {
  shuriken: { p: 'reach', ic: '🌀', n: ['風魔大手裡劍', '風魔大手裏剣', 'Fuma Shuriken'], d: ['每 0.7 秒投出 4 枚巨大手裡劍，貫穿敵人並飛回手中', '0.7秒ごとに巨大手裏剣を4枚、敵を貫いて手元に戻る', '4 giant shuriken every 0.7s that pierce enemies and return'] },
  kunai: { p: 'hp', ic: '⚔️', n: ['刃之結界', '刃の結界', 'Blade Barrier'], d: ['6 把苦無以更大的半徑高速旋轉', '6本の苦無がより大きな輪で高速回転', '6 kunai spin fast in a wider ring'] },
  thunder: { p: 'combo', ic: '⚡', n: ['雷神', '雷神', 'Raijin'], d: ['每 1.4 秒落下 3 道雷，每道再連鎖 2 名附近敵人', '1.4秒ごとに雷3本、それぞれ近くの敵2体へ連鎖', '3 bolts every 1.4s, each chaining to 2 nearby enemies'] },
  wind: { p: 'bounce', ic: '🌪️', n: ['鎌鼬', '鎌鼬', 'Kamaitachi'], d: ['巨大風刃，在牆壁間反彈 3 次', '巨大な風刃が壁の間で3回反射', 'Giant wind blades that bounce between walls 3 times'] },
  barrier: { p: 'kimax', ic: '🛡️', n: ['不動結界', '不動結界', 'Immovable Barrier'], d: ['最多 3 層、7 秒充能，擋下攻擊時震飛周圍敵人', '最大3層・7秒で再充填、防いだ時に周囲の敵を吹き飛ばす', 'Up to 3 layers, 7s recharge; blocking blasts nearby enemies'] },
  aura: { p: 'quake', ic: '💠', n: ['金剛震', '金剛震', 'Diamond Quake'], d: ['半徑 120 的震波每 1.1 秒斬殺所有敵人', '半径120の波動が1.1秒ごとに全ての敵を斬る', 'A 120px pulse slashes every enemy every 1.1s'] },
  shiki: { p: 'magnet', ic: '🐦', n: ['八咫烏', '八咫烏', 'Yatagarasu'], d: ['收集整個畫面的魂與小判，每 1.2 秒啄擊敵人', '画面全体の魂と小判を集め、1.2秒ごとに敵をついばむ', 'Gathers every soul and koban on screen; pecks every 1.2s'] },
  swift: { p: 'feather', ic: '💨', n: ['神速', '神速', 'Godspeed'], d: ['氣的回復速度 ×4，氣上限 +2', '気の回復速度 ×4、気の上限 +2', 'Ki regen ×4, max Ki +2'] },
  tags: { p: 'score', ic: '💥', n: ['紅蓮爆陣', '紅蓮爆陣', 'Crimson Blast'], d: ['每 1.3 秒貼 3 張爆炎札，爆炸會連鎖引爆', '1.3秒ごとに爆炎札3枚、爆発が連鎖する', '3 blast tags every 1.3s; explosions chain'] },
  clone: { p: 'vamp', ic: '🦊', n: ['九尾', '九尾', 'Nine Tails'], d: ['分身變成 3 個，每 12 秒替你擋下一次攻擊', '分身が3体に、12秒ごとに攻撃を1回防ぐ', '3 clones; they block a hit every 12s'] },
  water: { p: 'slowzone', ic: '🌊', n: ['大瀑布', '大瀑布', 'Great Falls'], d: ['左右與中間同時射出 3 條粗大的水龍', '左右と中央に太い水龍を3本', '3 huge water dragons side by side'] },
  mist: { p: 'lucky', ic: '🌫️', n: ['朧', '朧', 'Oboro'], d: ['毒霧纏在身上跟著移動，範圍加倍', '毒霧が体にまとわり、範囲が倍に', 'The mist clings to you at double size'] },
  rock: { p: 'quake', ic: '⛰️', n: ['山崩', '山崩れ', 'Landslide'], d: ['一次落下 3 顆巨岩，貫穿整個畫面', '巨岩を3つ同時に落とし、画面を貫く', '3 giant boulders that crush through the screen'] },
  sickle: { p: 'reach', ic: '🌀', n: ['旋風鐮', '旋風鎌', 'Whirlwind'], d: ['鎖鐮整圈旋轉，範圍大幅擴大', '鎖鎌が一回転し、範囲が大きく広がる', 'The sickle spins a full circle with huge reach'] },
};
// HP：基礎 100，體魄／鋼身每級 +20；各種攻擊的傷害
const HP_BASE = 100, HP_STEP = 20;
const DMG = { shot: 15, kunai: 15, arrow: 20, spike: 20, onibi: 25, zone: 30, ember: 8, fire: 12, boss: 20, mist: 12, qte: 10, qte5: 6 };   // ember＝火關提燈妖怪的火星、fire＝火車留下的火焰
const SOUL_V = [1, 2, 3, 2, 3, 2, 8, 1, 1, 2, 2, 2, 2, 25];   // 各種敵人掉落的魂量
const xpNeed = l => Math.round(5 + 3.5 * (l - 1) + .4 * (l - 1) ** 2);
const MODS = [
  { id: 'wind', n: ['暴風', '暴風', 'Gale'], d: ['強風會把你吹向左右', '強風が左右に吹きつける', 'Strong winds push you sideways'] },
  { id: 'rise', n: ['怒潮', '怒涛', 'Surge'], d: ['死亡區域上升速度 +50%', '死の領域の上昇 +50%', 'Death zone rises 50% faster'] },
  { id: 'sparse', n: ['斷崖', '断崖', 'Cliffs'], d: ['地板間距變大', '足場の間隔が広い', 'Wider gaps between floors'] },
  { id: 'horde', n: ['忍者村', '忍者の里', 'Ninja Village'], d: ['敵忍者大量出現', '敵忍者が大量に出る', 'Lots of enemy ninjas'] },
  { id: 'rich', n: ['黃金鄉', '黄金郷', 'El Dorado'], d: ['小判倍增，但釘刺也變多', '小判が倍、まきびしも増える', 'Double koban, but more spikes'] },
  { id: 'crumble', n: ['朽木', '朽ち木', 'Rotten Wood'], d: ['大部分地板只能踩一次', 'ほとんどの床が一度きり', 'Most floors break after one step'] },
];
// 修行（永久強化）：16 項，共 56 級。cost(l) = 從 Lv l 升到 Lv l+1 的價格
const META = [
  { id: 'hp', n: ['體魄', '体力', 'Vitality'], d: ['最大 HP +20', '最大HP +20', 'Max HP +20'], max: 5, cost: l => 105 * (l + 1), ic: '❤️' },
  { id: 'armor', n: ['鎖帷子', '鎖帷子', 'Chain Mail'], d: ['受到的傷害 -6%', '受けるダメージ -6%', 'Damage taken -6%'], max: 5, cost: l => 180 * (l + 1), ic: '🛡️' },
  { id: 'revive', n: ['再起', '再起', 'Second Wind'], d: ['每局一次：倒下時以一半 HP 復活', '1回だけ、倒れてもHP半分で復活', 'Once per run, revive with half HP'], max: 1, cost: () => 2000, ic: '🔥' },
  { id: 'reach', n: ['長刀', '長刀', 'Long Blade'], d: ['斬擊接觸範圍擴大', '斬撃の当たり判定が広がる', 'Larger slash reach'], max: 3, cost: l => 140 * (l + 1), ic: '🗡️' },
  { id: 'power', n: ['剛力', '剛力', 'Might'], d: ['對魔王與大天狗的傷害 +10%', '魔王・大天狗へのダメージ +10%', 'Damage to bosses +10%'], max: 5, cost: l => 200 * (l + 1), ic: '💪' },
  { id: 'cd', n: ['迅術', '迅術', 'Quick Arts'], d: ['自動技能的冷卻縮短 5%', '自動技の再使用 -5%', 'Skill cooldowns -5%'], max: 5, cost: l => 220 * (l + 1), ic: '⏱️' },
  { id: 'speed', n: ['輕身', '軽身', 'Light Feet'], d: ['左右移動速度 +5%', '左右の移動速度 +5%', 'Move speed +5%'], max: 3, cost: l => 110 * (l + 1), ic: '👟' },
  { id: 'ki', n: ['丹田', '丹田', 'Inner Core'], d: ['「氣」上限 +1', '「気」の上限 +1', 'Max Ki +1'], max: 2, cost: l => 400 * (l + 1), ic: '🔷' },
  { id: 'kireg', n: ['調息', '調息', 'Breathing'], d: ['「氣」回復速度 +15%', '「気」の回復 +15%', 'Ki regen +15%'], max: 3, cost: l => 180 * (l + 1), ic: '🌬️' },
  { id: 'magnet', n: ['吸魂', '吸魂', 'Soul Magnet'], d: ['魂與小判的吸收範圍擴大', '魂と小判を吸い寄せる範囲が広がる', 'Larger pickup range'], max: 3, cost: l => 105 * (l + 1), ic: '🧲' },
  { id: 'xp', n: ['悟性', '悟性', 'Insight'], d: ['獲得的經驗 +8%', '経験値 +8%', 'XP +8%'], max: 5, cost: l => 200 * (l + 1), ic: '📖' },
  { id: 'gold', n: ['商才', '商才', 'Merchant'], d: ['小判 +10%', '小判 +10%', 'Koban +10%'], max: 5, cost: l => 85 * (l + 1), ic: '💰' },
  { id: 'luck', n: ['福運', '福運', 'Good Luck'], d: ['寶箱與卷軸更容易出現', '宝箱と巻物が出やすい', 'More chests and scrolls'], max: 3, cost: l => 220 * (l + 1), ic: '🍀' },
  { id: 'scroll', n: ['秘卷', '秘巻', 'Secret Scroll'], d: ['起始卷軸 +1', '開始時の巻物 +1', 'Start with +1 scroll'], max: 2, cost: l => 140 * (l + 1), ic: '📜' },
  { id: 'reroll', n: ['天眼', '天眼', 'Third Eye'], d: ['三選一時可重抽 +1 次', '三択の引き直し +1回', '+1 reroll on level-up choices'], max: 3, cost: l => 250 * (l + 1), ic: '👁️' },
  { id: 'banish', n: ['封印', '封印', 'Seal'], d: ['三選一時可封印 +1 次（被封印的選項本局不再出現）', '三択で封印 +1回（その選択肢はもう出ない）', '+1 Seal: remove a choice for the rest of the run'], max: 3, cost: l => 300 * (l + 1), ic: '🈲' },
];
const mt = id => (save.meta && save.meta[id]) || 0;   // 修行等級
// 修行分三階段開放：一開始 6 項／開放第 2 關後再 6 項／任一關破台後最後 4 項
const META_TIER = { armor: 1, power: 1, ki: 1, kireg: 1, xp: 1, luck: 1, revive: 2, cd: 2, reroll: 2, banish: 2 };
const metaOpen = m => { if (TEST_FREE) return true; const tr = META_TIER[m.id] || 0, s = save.lv || {}; return tr === 0 || (tr === 1 && (s.open || 1) >= 2) || (tr === 2 && (s.clear || []).some(x => x)); };
const metaSpent = () => META.reduce((s, m) => { let n = 0; for (let l = 0; l < mt(m.id); l++) n += metaCost(m, l); return s + n; }, 0);
const metaCost = (m, l) => TEST_FREE ? 0 : m.cost(l);
// 成就：cat 0 關卡／1 戰鬥／2 成長／3 累計／4 挑戰與天候／5 收集（共 76 個）
const ACH = [];
{
  const add = (id, cat, n, d) => ACH.push({ id, cat, n, d });
  const LV = [['林', '林', 'Forest'], ['風', '風', 'Wind'], ['山', '山', 'Mountain'], ['火', '火', 'Fire']];   // 和 LEVELS 的順序一致（v64 起山在火前面）
  add('run1', 0, ['初陣', '初陣', 'First Battle'], ['完成第一次挑戰', '初めての挑戦を終える', 'Finish your first run']);
  LV.forEach((k, i) => {
    add('lv' + i + 'r5', 0, [k[0] + '之卷・中', k[1] + 'の巻・中', k[2] + ' Midway'], ['在「' + k[0] + '」到達第 5 舞台', '「' + k[1] + '」で第5舞台に到達', 'Reach Stage 5 in ' + k[2]]);
    add('lv' + i + 'c', 0, [k[0] + '之卷・破', k[1] + 'の巻・破', k[2] + ' Cleared'], ['「' + k[0] + '」破台（突破第 10 舞台）', '「' + k[1] + '」をクリア（第10舞台突破）', 'Clear all 10 stages of ' + k[2]]);
  });
  add('clear', 0, ['風林火山', '風林火山', 'Wind Forest Fire Mountain'], ['四關全部破台', '四つのステージをすべてクリア', 'Clear all four stages']);
  add('loop2', 0, ['第二輪', '二周目', 'Second Round'], ['在任一關到達第 6 舞台', 'どこかで第6舞台に到達', 'Reach Stage 6 anywhere']);
  add('lvopen', 0, ['天下布武', '天下布武', 'All Roads Open'], ['開放全部四關', '四ステージすべてを解放', 'Unlock all four stages']);
  add('night', 0, ['夜行', '夜行', 'Night Walker'], ['到達夜晚的舞台', '夜の舞台に到達', 'Reach a night stage']);
  for (const [id, m, z, j, e] of [['h100', 100, '見習忍者', '見習い忍者', 'Apprentice'], ['h500', 500, '中忍', '中忍', 'Chunin'], ['h1500', 1500, '上忍', '上忍', 'Jonin'], ['h3000', 3000, '影忍', '影忍', 'Shadow'], ['h6000', 6000, '天狗', '天狗', 'Tengu']])
    add(id, 0, [z, j, e], ['單局爬升 ' + m + 'm', '1回で' + m + 'm登る', 'Climb ' + m + 'm in one run']);
  for (const [id, n, z, j, e] of [['combo5', 5, '五連斬', '五連斬', 'Five Chain'], ['combo10', 10, '狂熱', 'フィーバー', 'Fever'], ['combo30', 30, '三十連斬', '三十連斬', 'Thirty Chain'], ['combo50', 50, '五十連斬', '五十連斬', 'Fifty Chain']])
    add(id, 1, [z, j, e], ['達成 ' + n + ' 連斬', n + '連斬を達成', 'Reach a ' + n + ' chain']);
  add('chain3', 1, ['連鎖爆破', '連鎖爆破', 'Chain Blast'], ['一次爆炸炸死 3 名以上敵人', '一度の爆発で3体以上倒す', 'Kill 3+ enemies with one explosion']);
  add('chain5', 1, ['大爆破', '大爆破', 'Big Bang'], ['一次爆炸炸死 5 名以上敵人', '一度の爆発で5体以上倒す', 'Kill 5+ enemies with one explosion']);
  add('bank1', 1, ['反射斬', '反射斬り', 'Bank Shot'], ['彈射斬撞牆反彈後斬殺敵人', '壁で跳ね返ってから敵を斬る', 'Slash an enemy after bouncing off a wall']);
  add('mid1', 1, ['天狗退治', '天狗退治', 'Tengu Hunter'], ['擊敗中 BOSS 大天狗', '中ボス大天狗を倒す', 'Defeat the Great Tengu']);
  add('mid5', 1, ['天狗殺', '天狗殺し', 'Tengu Slayer'], ['累計擊敗 5 隻大天狗', '大天狗を累計5体倒す', 'Defeat 5 Great Tengu in total']);
  add('boss1', 1, ['鬼退治', '鬼退治', 'Oni Slayer'], ['擊敗第一隻魔王', '初めて魔王を倒す', 'Defeat your first boss']);
  BOSS_KINDS.forEach((b, i) => add('bk' + i, 1, ['討伐・' + b.n[0], '討伐・' + b.n[1], 'Beat ' + b.n[2]], ['擊敗' + b.n[0], b.n[1] + 'を倒す', 'Defeat the ' + b.n[2]]));
  add('boss10', 1, ['鬼殺', '鬼殺し', 'Oni Bane'], ['累計擊敗 10 隻魔王', '魔王を累計10体倒す', 'Defeat 10 bosses in total']);
  add('boss30', 1, ['鬼神', '鬼神', 'Demon God'], ['累計擊敗 30 隻魔王', '魔王を累計30体倒す', 'Defeat 30 bosses in total']);
  add('bossfast', 1, ['一閃', '一閃', 'Flash Cut'], ['魔王出現後 20 秒內擊敗它', '魔王を出現から20秒以内に倒す', 'Defeat a boss within 20s']);
  add('kill200', 1, ['千軍', '千軍', 'Army Breaker'], ['單局斬殺 200 名敵人', '1回で200体を倒す', 'Defeat 200 enemies in one run']);
  add('kill500', 1, ['萬軍辟易', '万軍辟易', 'Legion Breaker'], ['單局斬殺 500 名敵人', '1回で500体を倒す', 'Defeat 500 enemies in one run']);
  add('evo1', 2, ['進化', '進化', 'Evolution'], ['第一次讓技能進化', '初めて技を進化させる', 'Evolve a skill for the first time']);
  for (const s of SKILLS) add('evo_' + s.id, 2, EVO[s.id].n, ['讓「' + s.n[0] + '」進化', '「' + s.n[1] + '」を進化させる', 'Evolve ' + s.n[2]]);
  add('lv20', 2, ['修練', '修練', 'Disciple'], ['單局升到 Lv20', '1回でLv20', 'Reach Lv20 in one run']);
  add('lv40', 2, ['達人', '達人', 'Expert'], ['單局升到 Lv40', '1回でLv40', 'Reach Lv40 in one run']);
  add('scroll1', 2, ['忍法帖', '忍法帖', 'Ninjutsu Scroll'], ['第一次發動忍法', '初めて忍法を使う', 'Use ninjutsu for the first time']);
  add('scroll5', 2, ['忍法帖・極', '忍法帖・極', 'Scroll Master'], ['單局發動 5 次忍法', '1回で忍法を5回使う', 'Use ninjutsu 5 times in one run']);
  add('fever3', 2, ['狂熱三昧', 'フィーバー三昧', 'Fever Trio'], ['單局進入 3 次狂熱', '1回で3回フィーバー', 'Enter FEVER 3 times in one run']);
  for (const [id, n, z, j, e] of [['slash100', 100, '百人斬', '百人斬り', 'Hundred Cuts'], ['slash1000', 1000, '千人斬', '千人斬り', 'Thousand Cuts'], ['slash5000', 5000, '五千人斬', '五千人斬り', '5,000 Cuts'], ['slash20000', 20000, '一騎當千', '一騎当千', 'One Against a Thousand']])
    add(id, 3, [z, j, e], ['累計斬殺 ' + n + ' 名敵人', '累計' + n + '体を倒す', 'Defeat ' + n + ' enemies in total']);
  for (const [id, n, z, j, e] of [['coin500', 500, '小判長者', '小判長者', 'Koban Tycoon'], ['coin5000', 5000, '豪商', '豪商', 'Rich Merchant'], ['coin20000', 20000, '天下的廚房', '天下の台所', 'Nation\'s Kitchen']])
    add(id, 3, [z, j, e], ['累計獲得 ' + n + ' 小判', '累計' + n + '小判を得る', 'Earn ' + n + ' koban in total']);
  for (const [id, n, z, j, e] of [['runs10', 10, '十度挑戰', '十度目', 'Ten Runs'], ['runs50', 50, '百折不撓', '百折不撓', 'Never Give Up'], ['runs100', 100, '修行僧', '修行僧', 'Ascetic']])
    add(id, 3, [z, j, e], ['累計挑戰 ' + n + ' 次', '累計' + n + '回挑戦', 'Play ' + n + ' runs']);
  for (const [id, n, z, j, e] of [['s50k', 50000, '名人', '名人', 'Master'], ['s100k', 100000, '名人上手', '名人上手', 'Grand Master'], ['s300k', 300000, '傳說', '伝説', 'Legend']])
    add(id, 3, [z, j, e], ['單局得分 ' + n, '1回で' + n + '点', 'Score ' + n + ' in one run']);
  for (const [k, z, j, e] of [['rain', '暴風雨', '暴風雨', 'storm'], ['fog', '濃霧', '濃霧', 'fog'], ['dark', '黑暗雷閃', '暗闇と雷', 'darkness'], ['snow', '暴雪', '吹雪', 'blizzard']])
    add('wx_' + k, 4, ['越過' + z, j + 'を越えて', 'Through the ' + e], ['在' + z + '中突破一個舞台', j + 'の中で舞台を突破', 'Clear a stage in the ' + e]);
  add('nohit', 4, ['無傷', '無傷', 'Untouched'], ['不受傷突破一個舞台', '無傷で舞台を突破', 'Clear a stage without taking damage']);
  add('noscroll', 4, ['無忍法', '忍法いらず', 'No Ninjutsu'], ['不使用忍法破台', '忍法を使わずにクリア', 'Clear a stage set without ninjutsu']);
  add('lowhp', 4, ['九死一生', '九死に一生', 'Close Call'], ['HP 低於 20% 時擊敗魔王', 'HP20%未満で魔王を倒す', 'Defeat a boss under 20% HP']);
  add('wall50', 4, ['壁走', '壁走り', 'Wall Runner'], ['單局蹬牆跳 50 次', '1回で壁蹴り50回', 'Wall-jump 50 times in one run']);
  add('skins_all', 5, ['千變萬化', '千変万化', 'Many Faces'], ['擁有全部角色', 'すべてのキャラを入手', 'Own every ninja']);
  add('meta1', 5, ['一藝', '一芸', 'Specialist'], ['任一修行項目練滿', '修行をひとつ極める', 'Max out any training']);
  add('metaall', 5, ['免許皆傳', '免許皆伝', 'Full Mastery'], ['全部修行練滿', '修行をすべて極める', 'Max out all training']);
  add('rich3000', 5, ['千兩箱', '千両箱', 'Treasure Chest'], ['一次持有 3000 小判', '小判を3000枚持つ', 'Hold 3,000 koban at once']);
}

// ===== 存檔 =====
const defSave = () => ({
  coins: 0, skin: 0, skins: [0], outfits: [0], charOut: {},
  meta: Object.fromEntries(META.map(m => [m.id, 0])), ach: {}, lv: { open: 1, best: [0, 0, 0, 0], clear: [0, 0, 0, 0], sel: 0 }, opt: { mus: 4, sfx: 4, vib: 1, lang: guessLang() }, seen: 0, intro: 0, maki: [0, 0, 0, 0], jutsu: 'soar',
  best: { rogue: 0 }, rank: { rogue: [] },
  stats: { runs: 0, slashes: 0, bosses: 0, coins: 0, mids: 0 },
});
let save = defSave();
try {
  const s = JSON.parse(localStorage.getItem('tobi_save') || '{}');
  for (const k in s) save[k] = (typeof s[k] === 'object' && !Array.isArray(s[k]) && s[k]) ? Object.assign(save[k] || {}, s[k]) : s[k];
} catch (e) { }
LI = Math.max(0, LANGS.findIndex(l => l.id === save.opt.lang));
// 音量：音樂與音效分開，各 0（靜音）～5 格；4 格＝原本的音量。舊存檔的「音效 OFF」兩者都設為 0
const VOLS = [0, .2, .4, .65, 1, 1.25];
if ('snd' in save.opt) { if (!save.opt.snd) save.opt.mus = save.opt.sfx = 0; delete save.opt.snd; }
const sfxV = () => VOLS[save.opt.sfx] || 0, musV = () => VOLS[save.opt.mus] || 0;
// 舊存檔：以前買過的蒼／桜／影（當時只是換色）一併送對應的換裝顏色
if (!save.outfits) save.outfits = [0];
for (const i of save.skins || []) if (i >= 1 && i <= 3 && !save.outfits.includes(i)) save.outfits.push(i);
function persist() { try { localStorage.setItem('tobi_save', JSON.stringify(save)); } catch (e) { } }

// ===== 音效（WebAudio 合成） =====
let ac = null;
function A() {
  if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { } }
  if (ac && ac.state === 'suspended') ac.resume();
  // 瀏覽器要等使用者第一次操作後才能出聲，所以標題曲在這裡（第一次點擊時）開始
  musicFor();
  return ac;
}
function tone(f, d = .1, type = 'square', vol = .05, slide = 0, delay = 0) {
  if (!sfxV() || !ac) return;
  vol *= sfxV();
  const t = ac.currentTime + delay, o = ac.createOscillator(), gn = ac.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), t + d);
  gn.gain.setValueAtTime(vol, t); gn.gain.exponentialRampToValueAtTime(.0001, t + d);
  o.connect(gn).connect(ac.destination); o.start(t); o.stop(t + d + .03);
}
function noise(d = .2, vol = .08, delay = 0) {
  if (!sfxV() || !ac) return;
  vol *= sfxV();
  const len = ac.sampleRate * d, buf = ac.createBuffer(1, len, ac.sampleRate), ch = buf.getChannelData(0);
  for (let i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const s = ac.createBufferSource(), gn = ac.createGain(); s.buffer = buf; gn.gain.value = vol;
  s.connect(gn).connect(ac.destination); s.start(ac.currentTime + delay);
}
const SFX = {
  jump: () => { const f = 480 + Math.random() * 60; tone(f, .1, 'triangle', .09, f * 1.1); tone(f * 1.5, .07, 'square', .025, f, .015); },   // 彈跳：可愛的「啵嚶」聲（每次音高略有不同，不會單調）
  wallJump: () => { tone(380, .07, 'square', .04, -120); tone(620, .12, 'triangle', .08, 700, .04); },   // 蹬牆跳：先「咚」一下再往上揚
  spring: () => tone(260, .28, 'square', .05, 800),
  coin: () => { tone(988, .06, 'square', .035); tone(1319, .12, 'square', .035, 0, .05); },
  item: () => { tone(660, .1, 'triangle', .06); tone(880, .1, 'triangle', .06, 0, .08); tone(1320, .2, 'triangle', .06, 0, .16); },
  slash: () => { noise(.12, .09); tone(1200, .12, 'sawtooth', .04, -900); },
  hit: () => { noise(.25, .12); tone(120, .3, 'sawtooth', .07, -60); },
  scroll: () => { for (let i = 0; i < 6; i++) tone(440 * Math.pow(1.19, i), .14, 'triangle', .05, 0, i * .07); },
  boss: () => { tone(110, .6, 'sawtooth', .07, -30); tone(165, .6, 'sawtooth', .05, -40, .15); },
  crack: () => noise(.15, .06),
  kill: () => { noise(.4, .14); for (let i = 0; i < 4; i++) tone(880 - i * 120, .2, 'square', .05, 0, .1 + i * .08); },
  combo: n => tone(500 + Math.min(n, 12) * 70, .08, 'square', .04),
  die: () => { for (let i = 0; i < 5; i++) tone(500 - i * 80, .18, 'square', .05, 0, i * .12); },
  click: () => tone(700, .05, 'square', .03),
  dash: () => { noise(.12, .07); tone(300, .15, 'sawtooth', .04, 900); },
  dive: () => tone(900, .2, 'sawtooth', .04, -700),
  impact: () => { noise(.25, .12); tone(90, .25, 'square', .07, -40); },
  boom: () => { noise(.5, .16); tone(70, .45, 'sawtooth', .08, -30); },
  throw: () => tone(1500, .06, 'square', .025, -400),
  clank: () => { tone(1800, .08, 'square', .04, -200); tone(1200, .1, 'triangle', .04); },
  fever: () => { for (let i = 0; i < 8; i++) tone(523 * Math.pow(1.122, i), .1, 'square', .045, 0, i * .05); },
  aim: () => tone(620, .08, 'triangle', .04, 200),
  warn: () => { tone(880, .07, 'square', .04); tone(880, .07, 'square', .04, 0, .13); },   // 魔王出招的預兆
  ring: () => tone(1320, .05, 'triangle', .03),
  soul: () => tone(1100 + Math.random() * 300, .05, 'sine', .025),
  thunder: () => { noise(.3, .12); tone(80, .3, 'sawtooth', .06, -30); },
  wind: () => tone(500, .12, 'triangle', .025, 500),
};
// 依遊戲狀態決定要放哪首曲子（每一幀呼叫；同一首不會重播）
// 標題＝鳶ノ影；關卡＝疾風ノ道（每一幕換調、無盡之塔每輪加快）；魔王登場＝鬼哭；暫停／死亡／結算＝停止
const ACT_KEY = [0, 2, 5, 3];   // 林／風／火／山 的移調（半音）
function musicFor() {
  if (!ac || !musV() || document.hidden) return BGM.stop();
  BGM.setVol(musV());
  if (state === 'menu') return INTRO.ph === 'cut' ? BGM.play(ac, 'boss', { sp: .85, tr: -3 }) : INTRO.ph === 'title' ? BGM.play(ac, 'title') : BGM.stop();
  if (!g || paused || state === 'over' || state === 'dying' || state === 'fin' || state === 'clearq') return BGM.stop();
  BGM.hot = g.fever > 0;
  // 每關的樂曲：林「疾風ノ道」、風「天翔」、火「紅蓮」、山「雪嶺」；魔王戰共用「鬼哭」並依關卡移調
  const song = g.boss ? 'boss' : ['stage', 'wind', 'fire', 'mountain'][g.th];
  BGM.play(ac, song, { tr: g.boss ? ACT_KEY[g.th] : 0, sp: 1 + Math.min(.2, .04 * loopN()) });
}
function vib(ms) { if (save.opt.vib && navigator.vibrate) try { navigator.vibrate(ms); } catch (e) { } }

// ===== 畫面尺寸 =====
const APP_VER = 'v82';   // 顯示在設定頁的診斷資訊，方便對照手機上跑的是哪一版
const IS_IOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
// 手機：觸控為主、螢幕短邊小於 600（iPad 與電腦不算）
const IS_PHONE = matchMedia('(pointer: coarse)').matches && Math.min(screen.width, screen.height) < 600;
// 是否從主畫面以 App 方式開啟（不同 iOS 版本回報方式不同，三種都看）
const isAppMode = () => navigator.standalone === true || matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches;
let DIAG = '';
let APPFIX = { w: 0, full: 0, gap: 0 };   // iOS 主畫面模式的高度修正（只增不減，避免畫面來回跳）
// iPad／電腦橫向時遊戲的邏輯高度（越小＝畫面越放大、上下看得越少）
const PL_H = clamp(+new URLSearchParams(location.search).get('plh') || 640, 640, 760);
function resize() {
  const app = $('app');
  let vw = innerWidth, vh = innerHeight, gap = 0;
  const appMode = isAppMode();
  // iOS「加入主畫面」＋透明狀態列：回報的高度少了一段狀態列，畫面卻整個上移，底部會空一條黑邊。
  // 這時改用「100vh、螢幕實際高度」中最高的來排版，少掉的那段就是狀態列（瀏海）高度。
  // 量到的高度會被「網頁長到全高」本身影響（長高後回報值變大、落差變 0，又縮回去……），一來一回畫面就會抖個不停。
  // 所以同一個寬度下，量到過的最高值與落差都記住、只增不減，排版固定在補好的狀態（轉向、寬度改變時才重新量）。
  if (appMode && vw < vh) {
    const vp = $('vhProbe'), full = Math.max(vh, vp ? vp.offsetHeight : 0, IS_IOS ? Math.max(screen.height, screen.width) : 0);
    if (APPFIX.w !== vw) APPFIX = { w: vw, full: 0, gap: 0 };
    APPFIX.full = Math.max(APPFIX.full, full);
    APPFIX.gap = Math.max(APPFIX.gap, APPFIX.full - vh);
    if (APPFIX.gap > 0) { gap = APPFIX.gap; vh = APPFIX.full; }
  } else APPFIX = { w: 0, full: 0, gap: 0 };
  // 手機（iPhone 等）只能直向玩：橫拿時蓋上「請轉成直向」並暫停
  const land = vw > vh, rot = land && IS_PHONE;
  document.body.classList.toggle('rotate', rot);
  if (rot) setTimeout(() => { if (g && state !== 'menu' && state !== 'over') pauseGame(); }, 0);   // 延後執行（第一次 resize 時 g、state 還沒宣告）
  // iPad／電腦橫向：遊戲維持直版比例放在中間，左右鋪上月下城的夜景（sidebg.js）
  const pillar = land && !IS_PHONE;
  document.body.classList.toggle('pillar', pillar);
  // 比 9:16 還寬的直向螢幕（iPad 直拿）：高度固定 640，把世界加寬到剛好填滿左右；橫向時固定 360 寬
  if (!W_LOCK) { W = pillar ? 360 : vh / vw >= 640 / 360 ? 360 : clamp(640 * vw / vh, 360, 960); PL_MAX = W - WALL - 11; }
  // 依螢幕比例調整邏輯高度（640～900），長螢幕手機也能上下滿版
  H = pillar ? PL_H :   /* 橫向時用接近手機的直長比例 */ clamp(Math.round(W * vh / vw), 640, 900);
  const w = Math.min(vw, vh * W / H), h = w * H / W;
  const sb = $('sideBg');
  if (pillar && sb && typeof SIDEBG !== 'undefined') { const key = `${vw}x${vh}x${Math.round(w)}x${save.skin}`; if (sb.dataset.k !== key) { sb.dataset.k = key; SIDEBG.draw(sb, vw, vh, w); } }
  app.style.width = w + 'px'; app.style.height = h + 'px';
  document.body.style.setProperty('--gw', w + 'px');   // 側邊資訊欄用：遊戲畫面的寬度
  // 主畫面模式從畫面頂端開始排，其餘置中
  // iOS 這個模式下，最下面那段不屬於「可視範圍」，固定定位的元素畫不到。
  // 所以讓網頁本身長到全高，遊戲改用一般定位從頂端排下來，才會一路畫到螢幕底。
  document.documentElement.style.height = document.body.style.height = gap ? vh + 'px' : '';
  app.style.position = gap ? 'absolute' : 'fixed';
  app.style.top = gap ? '0px' : '50%';
  app.style.transform = gap ? 'translateX(-50%)' : 'translate(-50%, -50%)';
  app.style.setProperty('--u', (w / W) + 'px');
  const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
  // 尺寸沒變就不重設 canvas（重設會清空畫面、造成閃一下）
  const cw = Math.round(w * dpr), ch = Math.round(h * dpr);
  if (cv.width !== cw || cv.height !== ch) { cv.width = cw; cv.height = ch; }
  // 瀏海／狀態列高度：取系統回報值與上面算出的落差中較大的，HUD 和標題都會往下讓開這段
  const sa = $('safeProbe'), env = sa ? parseFloat(getComputedStyle(sa).paddingTop) || 0 : 0;
  let top = Math.max(env, gap);
  SAFE_T = top * W / w;
  // iOS App 模式下瀏海下方約 30pt 會被系統模糊，HUD 這段只放紋樣
  BLUR_T = IS_IOS && appMode && top > 0 ? 30 * W / w : 0;
  app.style.setProperty('--sat', top + 'px');
  DIAG = `${APP_VER} · ${innerWidth}×${innerHeight} · screen ${screen.width}×${screen.height} · ${appMode ? 'App' : 'Web'} · env ${Math.round(env)} · gap ${Math.round(gap)} · top ${Math.round(top)} · blur ${Math.round(BLUR_T)}`;
  const dg = $('diag'); if (dg) dg.textContent = DIAG;
}
let SAFE_T = 0, BLUR_T = 0;
const HUD_ROW = 40;            // HUD 單列的高度（遊戲座標）
let HUD_Y0 = 0, HUD_Y1 = 64;   // HUD 那一列的上下緣（扣掉瀏海後），點擊判定用
addEventListener('resize', resize);
addEventListener('orientationchange', () => setTimeout(resize, 300));
resize();
// iOS 從主畫面開啟時，瀏海高度會晚一點才給，開啟後再量幾次
for (const ms of [100, 400, 1000, 2500]) setTimeout(resize, ms);
// 開機遮罩（兼團隊 LOGO）：每 100ms 量一次，至少等 2.7 秒（LOGO 播完，也涵蓋 iOS 晚給瀏海高度的 2.5 秒重量）且連續兩次結果一樣（最多 4 秒）才淡出，之後才開始畫面演出
let booting = true;
(() => {
  const t0 = performance.now(); let last = DIAG, same = 0;
  const tick = () => {
    resize();
    same = DIAG === last ? same + 1 : 0; last = DIAG;
    const el = performance.now() - t0;
    if ((same < 2 || el < 2700) && el < 4000) return setTimeout(tick, 100);
    try { buildHelpIcons(); } catch (e) { }   // 玩法說明的圖示：趁開機遮罩還蓋著時先畫好
    booting = false;
    const b = $('boot'); if (b) b.classList.add('off');
    if (state === "menu") setTimeout(() => INTRO.begin(), 450);   // 遮罩淡出到全黑後：點一下開始 → 過場 → 標題（cut.js）
  };
  setTimeout(tick, 100);
})();

// ===== 狀態 =====
let state = 'menu';   // menu | play | slash | cast | qte | kill | dying | perk | clearq | over
let paused = false;
let g = null;         // 當前遊戲局
let demo = { x: W / 2, y: 470, vy: -JUMP, t: 0, face: 1 };

// ===== 輸入 =====
const inp = { down: false, id: null, lx: 0, ly: 0, dx: 0, keys: {}, sw: 0 };
function toL(e) { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H }; }
cv.addEventListener('pointerdown', e => {
  A();
  if (state === 'menu' && INTRO.tap()) return;   // 開場：點一下開始／跳過
  if (state === 'zintro') { skipZIntro(); return; }   // 每一幕的開場演出：點一下跳過
  if (state === 'ascend') { skipAscend(); return; }
  if (state === 'cast') { g.castT = Math.min(g.castT, CAST_T - .85); return; }   // 豪天翔：點一下直接跳到燒卷軸、衝天
  if (state === 'fin') {   // 決戰擊倒演出：點一下跳到卷軸展開、再點一下看完整卷軸；演出完成後停在卷軸畫面，點一下才進結算（預覽則重播）
    if (g.finT < .4) return;
    if (g.finT >= FIN_T) { if ((g.finHoldT || 0) < .4) return; if (g.preview) { g.finT = 0; g.finHoldT = 0; if (ac && musV()) BGM.jingle(ac, 'finish'); } else finishBoss(true); }
    else g.finT = g.finT < 3 ? 3 : FIN_T;
    return;
  }
  const p = toL(e);
  if (state === 'play' && !paused) {
    const hy = p.y - SAFE_T;   // HUD 往下讓開瀏海，點擊判定也一起位移
    const inG = p.x >= 0 && p.x <= W;   // iPad 橫向：點在兩側背景時只算移動，不判定 HUD 與按鈕
    if (inG && hy < HUD_Y1 + 6 && p.x > W - 40) { pauseGame(); return; }
    if (inG && hy > HUD_Y0 - 4 && hy < HUD_Y1 + 6 && p.x > 116 && p.x < 172) { castScroll(); return; }
    // 豪天翔按鈕（畫面中間偏下）：按鈕在操作區中間，所以只有「點一下就放開」才算按鈕；按住滑動仍是一般移動
    { const sb = scrollBtnPos(); inp.btn = g.scrolls > 0 && g.fly <= 0 && Math.hypot(p.x - sb.x, p.y - sb.y) < sb.r + 8 ? { t: performance.now(), x: p.x, y: p.y } : null; }   // 只有按鈕出現時才算
  }
  inp.down = true; inp.id = e.pointerId; inp.lx = p.x; inp.ly = p.y; inp.sw = 0;
  inp.hist = [{ x: p.x, y: p.y, t: performance.now() }]; inp.flicked = false;
  // 先進入「待定」：手指不動一下就變瞄準，一開始就滑動則是一般移動
  inp.mode = state === 'play' && !paused ? 'pending' : null;
  inp.hold = 0; inp.sx = inp.cx = p.x; inp.sy = inp.cy = p.y;
  try { cv.setPointerCapture(e.pointerId); } catch (er) { }
  if (state === 'qte') qteTap(p.x, p.y);
});
cv.addEventListener('pointermove', e => {
  if (!inp.down || e.pointerId !== inp.id) return;
  const p = toL(e), dx = p.x - inp.lx, dy = p.y - inp.ly;
  inp.lx = p.x; inp.ly = p.y;
  // 瞄準中：手指只用來拉彈弓，不移動角色
  if (inp.mode === 'aim') { inp.cx = p.x; inp.cy = p.y; return; }
  if (inp.mode === 'pending' && Math.hypot(p.x - inp.sx, p.y - inp.sy) > AIM_MOVE) inp.mode = 'move';
  inp.dx += dx;
  // 快速上滑＝衝刺斬、快速下滑＝急降斬；手指放慢後可再次觸發
  const now = performance.now(), hs = inp.hist;
  hs.push({ x: p.x, y: p.y, t: now });
  while (hs.length > 2 && now - hs[0].t > FLICK_MS) hs.shift();
  if (state === 'play' && !paused) {
    const fx = p.x - hs[0].x, fy = p.y - hs[0].y;
    if (!inp.flicked) {
      if (fy < -FLICK_PX && -fy > Math.abs(fx) * .6) { inp.flicked = true; inp.dx = 0; startDash(fx, fy); }
      else if (fy > FLICK_PX && fy > Math.abs(fx) * .8) { inp.flicked = true; inp.dx = 0; startDive(); }
    } else if (Math.abs(fy) < 8) inp.flicked = false;
  }
});
const endPtr = e => {
  if (e.pointerId !== inp.id) return;
  // 點一下豪天翔按鈕（沒怎麼移動、很快放開）：發動忍法，不當作瞄準或移動
  if (inp.btn && e.type === 'pointerup' && state === 'play' && !paused) {
    const p = toL(e), b = inp.btn;
    if (performance.now() - b.t < 350 && Math.hypot(p.x - b.x, p.y - b.y) < 14) {
      inp.btn = null; inp.down = false; inp.id = null; inp.mode = null;
      if (g.scrolls > 0) castScroll(); else { const sb = scrollBtnPos(); floatText(sb.x, g.camY + sb.y - 44, t('no_scroll'), '#ccc', 13); }
      return;
    }
  }
  inp.btn = null;
  // 放開時發射彈射斬（拉得不夠遠就當作取消）
  if (inp.mode === 'aim' && e.type === 'pointerup' && state === 'play' && !paused) {
    const a = aimInfo();
    if (a && a.dive) startDive();
    else if (a) { startDash(a.dx, a.dy, DASH_T_AIM, .2); if (g.tut && g.p.dash > 0) g.tut.sling = 1; }   // 新手教學：彈射斬
  }
  inp.down = false; inp.id = null; inp.mode = null;
};
cv.addEventListener('pointerup', endPtr);
cv.addEventListener('pointercancel', endPtr);
// iPad／電腦橫向：點住兩側的背景也能操控角色（把觸控轉給遊戲畫布，座標超出畫面也照樣用位移量移動）
{ const sbg = $('sideBg');
  ['pointerdown', 'pointermove', 'pointerup', 'pointercancel'].forEach(ty => sbg.addEventListener(ty, e => {
    if (ty === 'pointerdown' && state !== 'play' && state !== 'qte') return;
    e.preventDefault(); cv.dispatchEvent(new PointerEvent(ty, e));
  })); }
addEventListener('keydown', e => {
  inp.keys[e.code] = true; A();
  if (state === 'menu') { INTRO.poke(); if (!e.repeat && INTRO.tap()) { e.preventDefault(); return; } }
  if (e.code === 'Escape' || e.code === 'KeyP') { if (state !== 'menu' && state !== 'over' && state !== 'perk' && state !== 'clearq') paused ? resumeGame() : pauseGame(); }
  if (e.code === 'Space' || e.code === 'Enter') {
    if (state === 'play' && !paused) castScroll();
    else if (state === 'qte') qteTap();
    e.preventDefault();
  }
  if (!e.repeat && state === 'play' && !paused) {
    if (e.code === 'ArrowUp' || e.code === 'KeyW') { startDash(g.p.face * .5, -1); e.preventDefault(); }
    if (e.code === 'ArrowDown' || e.code === 'KeyS') { startDive(); e.preventDefault(); }
  }
});
addEventListener('keyup', e => { inp.keys[e.code] = false; });
// 在畫面任何地方第一次點擊／按鍵就解鎖音訊（標題曲隨之開始）
addEventListener('pointerdown', () => { A(); INTRO.poke(); }, true);   // 同時重算標題的閒置時間、結束待機展示
// 切到背景時停止音樂，回來時由 musicFor() 接著播
document.addEventListener('visibilitychange', () => { if (document.hidden) BGM.stop(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && g && state !== 'over' && state !== 'menu' && state !== 'perk') pauseGame(); });

// ===== 遊戲局 =====
const pk = id => (g && g.perks[id]) || 0;
const sk = id => (g && g.skills[id]) || 0;   // 自動技能等級（0 = 沒有）

function startRun(lvl) {
  if (lvl == null) lvl = (g && g.lvl != null) ? g.lvl : lvSave().sel;   // 「再次挑戰」：同一關
  lvSave().sel = lvl;
  hideAll();
  W_LOCK = false; resize(); W_LOCK = true;   // 開局時套用目前螢幕的寬度，整局固定
  g = {
    t: 0, camY: -H * .68, top: 0, bonus: 0, coins: 0,
    p: { x: W / 2, y: 40, vx: 0, vy: -JUMP, face: 1, inv: 0, slow: 0, freeze: 0, sq: 0, dash: 0, dvx: 0, dvy: 0, dive: false, wallUsed: false, banks: 0 },
    plats: [], items: [], enemies: [], parts: [], texts: [], fx: [], shots: [],
    eshots: [], booms: [], fires: [], mists: [], ghosts: [], corpses: [], puffs: [], hitstop: 0,
    drops: [], bolts: [], blades: [], skills: {}, sks: {}, xp: 0, lv: 1, lvQueue: 0, barrier: 0, barT: 0,
    genY: 40, lastX: W / 2, rowN: 0, ladderCD: 3,
    zoneY: 360, boss: null, bossN: 0, stage: 0, base: 0,
    combo: 0, comboT: 0, maxCombo: 0, kills: 0, vampN: 0, ki: 3, kiChain: 0, fever: 0,
    hp: 1, maxHp: 1, scrolls: 0, fly: 0, shake: 0,
    perks: {}, mod: null, wind: 0, windT: 0, spikeUsed: false, shurT: 2,
    banner: null, slash: null, qte: null, killT: 0, castT: 0, dieT: 0,
    rerolls: mt('reroll'), banishes: mt('banish'), banned: {}, revives: mt('revive'), usedScroll: false, cleared: false,
    lvl, th: LEVELS[lvl].th, wx: null, todF: null, midDone: false,
    // 成就用的單局紀錄
    scrollN: 0, feverN: 0, walls: 0, stHit: false, bossT0: 0,
  };
  g.maxHp = g.hp = HP_BASE + HP_STEP * save.meta.hp;
  g.scrolls = save.meta.scroll;
  g.plats.push({ x: W / 2, y: 40, w: W * 1.4, type: 'ground' });
  while (g.genY > g.camY - 150) genRow();
  paused = false;
  inp.mode = null;
  g.skills[SKINS[save.skin].sk] = 1;   // 每個角色的起始技能不同
  stageBanner(); startZIntro();   // 第一幕的開場演出（stagefx.js）
  // 操作改版後（彈射、牆壁）再顯示一次說明
  if (save.seen < 2) { save.seen = 2; persist(); openHelp(); paused = true; }
}
const loopN = () => Math.floor(g.stage / 5);   // 第幾輪（0 = 第 1～5 舞台、1 = 第 6～10 舞台）
const hardN = () => loopN() + g.lvl * .6;       // 難度：第二輪與後面的關卡更難

function diff() { return Math.min(1, g.top / 16000); }   // 地形難度：爬到 1600m 達到最高

function genRow() {
  const d = diff(), m = g.mod && g.mod.id;
  const prevY = g.genY;
  let gap = rnd(62, 86 + 58 * d) * (m === 'sparse' ? 1.22 : 1);
  gap = Math.min(gap, 150);
  g.genY -= gap; g.rowN++;
  const y = g.genY;
  const w = Math.round(68 - 18 * d);
  const xMin = WALL + w / 2 + 2, xMax = W - WALL - w / 2 - 2;   // 地板不能超出牆壁
  let x = clamp(g.lastX + rnd(-180, 180), xMin, xMax);
  g.lastX = x;
  // 種類
  const r = Math.random();
  let type = 'normal';
  const pCrumble = m === 'crumble' ? .6 : .06 + .16 * d;
  if (r < .065) type = 'spring';
  else if (r < .065 + .06 + .2 * d) type = 'move';
  else if (r < .125 + .2 * d + pCrumble) type = 'crumble';
  const pl = { x, y, w, type, bx: x, ph: rnd(0, 6.28), sp: rnd(1, 1.8 + d), amp: rnd(40, 90) };
  g.plats.push(pl);
  // 釘刺（另外加一塊安全地板）
  const pSpike = g.top < 600 || (g.th === 0 && g.stage < 1) ? 0 :   /* 林關第 1 舞台沒有釘刺 */ (.05 + .12 * d) * (m === 'rich' ? 1.8 : 1);
  if (type !== 'move' && Math.random() < pSpike) {
    pl.type = 'spike';
    let x2 = x + (x < W / 2 ? rnd(110, 180) : -rnd(110, 180));
    x2 = clamp(x2, xMin, xMax);
    g.plats.push({ x: x2, y: y + rnd(-10, 10), w, type: 'normal', bx: x2, ph: 0, sp: 0, amp: 0 });
    g.lastX = x2;
  } else if (Math.random() < .18 + .12 * (1 - d)) {
    // 額外地板，降低難度
    const x2 = rnd(xMin, xMax);
    if (Math.abs(x2 - x) > w + 10) g.plats.push({ x: x2, y: y + rnd(-20, 20), w, type: Math.random() < .3 ? 'crumble' : 'normal', bx: x2, ph: 0, sp: 0, amp: 0 });
  }
  // 加寬的世界（iPad）：依多出來的寬度補幾塊地板，畫面兩側才不會空蕩蕩
  for (let k = WK() - 1; k > 0; k--) {
    if (Math.random() > Math.min(1, k) * (.45 + .2 * (1 - d))) continue;
    const x2 = rnd(xMin, xMax);
    if (g.plats.some(q => Math.abs(q.y - y) < 30 && Math.abs(q.x - x2) < w + 10)) continue;
    g.plats.push({ x: x2, y: y + rnd(-25, 25), w, type: Math.random() < .25 ? 'crumble' : 'normal', bx: x2, ph: 0, sp: 0, amp: 0 });
  }
  // 道具
  const lucky = 1 + pk('lucky') * .8 + mt('luck') * .35;
  const coinP = Math.min(.9, (m === 'rich' ? .55 : .28) * (1 + (WK() - 1) * .5));
  if (Math.random() < coinP) {
    const n = Math.random() < .3 ? 3 : 1;
    for (let i = 0; i < n; i++) g.items.push({ t: 'coin', x: clamp(x + (i - (n - 1) / 2) * 22, WALL + 10, W - WALL - 10), y: y - 30 - (n > 1 && i === 1 ? 10 : 0), ph: rnd(0, 6) });
  }
  if (Math.random() < .012 * lucky) g.items.push({ t: 'scroll', x: rnd(30, W - 30), y: y - gap / 2, ph: 0 });
  else if (Math.random() < .022 * lucky) g.items.push({ t: 'chest', x: rnd(30, W - 30), y: y - gap / 2, ph: 0 });
  // 敵忍者
  const pE = g.top < 250 || g.tut ? 0 : (.08 + .14 * d) * (m === 'horde' ? 2.6 : 1) * (1 + .06 * g.stage + .3 * hardN()) * (g.th === 2 ? 1.2 : 1);   /* 火關敵人多 20% */   // 越後面的幕敵人越多
  // 倖存者節奏：敵人密度比之前高（技能需要靶子，魂也從這裡來）
  // 世界加寬時敵人也按比例增加（例如 1.5 倍寬 → 平均 1.5 倍敵人）
  for (let k = WK(); k > 0; k--) if (Math.random() < pE * 1.4 * Math.min(1, k)) g.enemies.push(mkEnemy(enemyType(d), rnd(30, W - 30), (y + prevY) / 2, rnd(10, 50)));
  // 敵人階梯：間距小於彈跳高度，可以一路空中連斬上去
  g.ladderCD--;
  if (g.top > 400 && !g.tut && g.ladderCD <= 0 && Math.random() < (.08 + .07 * d) * (m === 'horde' ? 2 : 1)) {
    g.ladderCD = 6;
    const n = 3 + (Math.random() * 3 | 0);
    let lx = rnd(60, W - 60), ly = y - 70;
    for (let i = 0; i < n; i++) {
      const last = i === n - 1;
      const t = last && g.top > 2000 && Math.random() < .5 ? 5 : last && g.top > 4500 && Math.random() < .3 ? 6 : Math.random() < .7 ? 0 : 1;
      g.enemies.push(mkEnemy(t, lx, ly, rnd(8, 22)));
      ly -= rnd(100, 125); lx = clamp(lx + rnd(-60, 60), 30, W - 30);
    }
  }
}

function mkEnemy(type, x, y, amp) {
  const e = { type, x, bx: x, y, ph: rnd(0, 6), amp: type === 3 || type === 9 ? rnd(0, 15) : amp, hp: type === 6 ? 2 : 1, thr: rnd(1, 2.5), warn: 0, cool: 0, flash: 0, vx: 0, vy: 0 };
  if (type === 11) { e.hidden = true; e.amp = 0; }        // 土遁：先藏著
  if (type === 12) { e.amp = rnd(20, 40); e.thr = rnd(1.5, 3); }
  // 菁英詞綴：迅捷（動很快）／分裂（死後分成兩隻）／鐵壁（要斬三刀）
  if (type === 6) {
    e.affix = pick(['fast', 'split', 'tough']);
    if (e.affix === 'fast') e.amp = rnd(70, 110);
    if (e.affix === 'tough') e.hp = 3;
  }
  return e;
}
// 各種敵人的移動與攻擊
function enemyAI(e, ed, dt) {
  const p = g.p, px = p.x, py = p.y - 20;
  const onScreen = e.y > g.camY + 70 && e.y < g.camY + H - 120;
  const free = () => { e.x += e.vx * dt; e.y += e.vy * dt; };
  switch (e.type) {
    case 7: // 烏鴉：水平飛過，上下擺動，飛出畫面就消失
      e.x += e.vx * dt; e.y = e.by + Math.sin(e.ph * 4) * 10;
      if (e.x < -50 || e.x > W + 50) e.dead = true;
      return;
    case 8: // 小天狗：朝玩家慢慢俯衝
    case 10: { // 鬼火：慢慢飄向玩家
      const sp = e.type === 8 ? 115 : 55, a = Math.atan2(py - e.y, px - e.x);
      e.vx += (Math.cos(a) * sp - e.vx) * Math.min(1, dt * 1.5);
      e.vy += (Math.sin(a) * sp - e.vy) * Math.min(1, dt * 1.5);
      free(); e.x = clamp(e.x, WALL + ed.w / 2, W - WALL - ed.w / 2);
      if (e.type === 10 && g.th === 2 && (e.trT = (e.trT || 0) - dt) <= 0) { e.trT = .18; g.fires.push({ x: e.x, y: e.y + 6, t: 0 }); }   // 火關火車：沿路留下火焰
      return;
    }
    case 13: return midAI(e, ed, dt);
  }
  if (e.type === 11) earthCheck(e);
  // 其餘：原地左右巡邏
  const ox = e.x;
  if (e.type === 12) e.x = clamp(e.bx + Math.sin(e.ph * 1.6) * e.amp, WALL + ed.w / 2, W - WALL - ed.w / 2);   // 蜘蛛擺盪
  else e.x = clamp(e.bx + Math.sin(e.ph * (e.affix === 'fast' ? 2.6 : 1.3)) * e.amp, WALL + ed.w / 2, W - WALL - ed.w / 2);
  // 畫圖用：左右飄的速度 → 身體往移動方向傾斜、快的時候留殘影
  if (dt > 0) { e.sv = (e.x - ox) / dt; e.tilt = (e.tilt || 0) + (clamp(e.sv / 80, -1, 1) - (e.tilt || 0)) * Math.min(1, dt * 6); }
  if (!onScreen) return;
  e.thr -= dt;
  e.warn = e.thr < .45;
  if (e.thr > 0) return;
  e.atk = .3;   // 出手後的動作（手往前揮、弓弦回彈）
  const a = Math.atan2(py - e.y, px - e.x);
  if (e.type === 3) { // 手裡劍：直線
    e.thr = rnd(2.3, 3);
    g.eshots.push({ x: e.x, y: e.y, vx: Math.cos(a) * 175, vy: Math.sin(a) * 175, t: 0, skin: g.th, wave: g.th === 1 ? a : null });   // 風關：風車手裡劍走 S 形
    SFX.throw();
  } else if (e.type === 9) { // 弓：瞄準玩家目前位置的拋物線
    e.thr = rnd(2.6, 3.2);
    const T = 1.1, G2 = 420;
    g.eshots.push({ x: e.x, y: e.y, vx: (px - e.x) / T, vy: (py - e.y) / T - G2 * T / 2, grav: G2, t: 0, kind: 'arrow', skin: g.th });
    SFX.throw();
  } else if (e.type === 12) { // 蜘蛛：吐絲（減速）
    e.thr = rnd(3, 3.8);
    g.eshots.push({ x: e.x, y: e.y, vx: Math.cos(a) * 120, vy: Math.sin(a) * 120, t: 0, kind: ['web', 'web', 'ember', 'frost'][g.th] || 'web', skin: g.th });   // 火關噴火星（小傷害）、山關冰絲（凍住 0.5 秒）
  } else e.thr = 99;
}
// ===== 中 BOSS 大天狗：每幕中段出現，停在畫面上方，扇形射擊；碰到它扣它的血 =====
// 依關卡換文字：有 key_1／key_2／key_3（風／火／山）就用那個，沒有就用林的
const tl = (k, ...a) => g && g.th && STR[k + '_' + g.th] ? t(k + '_' + g.th, ...a) : t(k, ...a);
function spawnMid() {
  const hp = 8 + 2 * g.stage + 4 * g.lvl;
  const e = mkEnemy(13, W / 2, g.camY - 60, 0);
  e.hp = e.max = hp; e.life = 25; e.thr = 2;
  g.enemies.push(e); g.mid = e; g.midDone = true;
  g.banner = { t: 2, a: t('mid_in'), b: tl('mid_name'), c: t('mid_desc') };
  SFX.boss(); vib(120);
}
function midAI(e, ed, dt) {
  const p = g.p;
  e.life -= dt;
  const ty = g.camY + 150 + Math.sin(e.ph * 1.4) * 25;
  e.y += (ty - e.y) * Math.min(1, dt * 2);
  e.x = W / 2 + Math.sin(e.ph * .8) * 105;
  e.thr -= dt; e.warn = e.thr < .5;
  if (e.thr <= 0) { // 五方向扇形手裡劍
    e.thr = Math.max(1.4, 2.4 - .08 * g.stage - .15 * g.lvl);
    const a0 = Math.atan2((p.y - 20) - e.y, p.x - e.x);
    for (let i = -2; i <= 2; i++) { const a = a0 + i * .28; g.eshots.push({ x: e.x, y: e.y + 20, vx: Math.cos(a) * 160, vy: Math.sin(a) * 160, t: 0 }); }
    SFX.throw();
  }
  if (e.life <= 0) { e.dead = true; g.mid = null; floatText(W / 2, g.camY + H * .4, tl('mid_gone'), '#ccc', 20); }
}
// 中 BOSS 被擊倒：大量魂與小判，並開寶箱（可能進化）
function midDown(e) {
  g.mid = null;
  for (let i = 0; i < 14; i++) g.drops.push({ k: i < 10 ? 'soul' : 'coin', x: e.x + rnd(-30, 30), y: e.y, vx: rnd(-100, 100), vy: -rnd(140, 280), v: i < 10 ? 3 : 2, ph: rnd(0, 6) });
  burst(e.x, e.y, '#c0262d', 36); g.shake = 12; SFX.kill(); vib([60, 40, 120]);
  floatText(W / 2, g.camY + H * .4, tl('mid_down'), '#ffd27a', 24);
  unlock('mid1'); if (++save.stats.mids >= 5) unlock('mid5');
  g.pendingChest = true;
}

// ===== 波次：一段時間就有一群敵人從畫面外湧入 =====
function spawnWave() {
  const st = g.stage, top = g.camY + 90, kinds = ['crow', 'tengu'];
  if (st >= 1 || g.top > 2500) kinds.push('onibi');
  if (st >= 1) kinds.push('archer');
  if (st >= 2) kinds.push('spider');
  const k = pick(kinds), n = Math.round((rnd(4, 6) + st * .4 + hardN() * 2) * Math.sqrt(WK()));   // 寬螢幕稍微多幾隻
  if (k === 'crow') { // 從左或右排成一列飛過
    const side = Math.random() < .5 ? -1 : 1, y = top + rnd(40, H * .4);
    for (let i = 0; i < n + 2; i++) { const e = mkEnemy(7, side < 0 ? -30 - i * 34 : W + 30 + i * 34, y, 0); e.by = y + (i % 2) * 18; e.vx = -side * rnd(120, 150) * (g.th === 1 ? 1.2 : 1); g.enemies.push(e); }   /* 風關燕子飛得快 20% */
  } else if (k === 'tengu') { // 從畫面上方俯衝下來
    for (let i = 0; i < n; i++) { const e = mkEnemy(8, rnd(WALL + 30, W - WALL - 30), g.camY - 30 - i * 40, 0); e.vy = 60; g.enemies.push(e); }
  } else if (k === 'onibi') { // 從畫面兩側包圍
    for (let i = 0; i < Math.ceil(n * .6); i++) g.enemies.push(mkEnemy(10, i % 2 ? WALL + 20 : W - WALL - 20, top + rnd(0, H * .55), 0));
  } else if (k === 'archer') { // 在上方地板埋伏
    const pls = g.plats.filter(pl => !pl.broken && pl.type !== 'ground' && pl.y < g.camY + H * .35 && pl.y > g.camY - 200);
    for (let i = 0; i < Math.min(3, pls.length); i++) { const pl = pls.splice(Math.random() * pls.length | 0, 1)[0]; const e = mkEnemy(9, pl.x, pl.y - 24, 0); e.amp = 0; g.enemies.push(e); }
  } else { // 蜘蛛從上方垂下
    for (let i = 0; i < Math.ceil(n * .5); i++) g.enemies.push(mkEnemy(12, rnd(WALL + 40, W - WALL - 40), g.camY - 20 - i * 60, 0));
  }
  floatText(W / 2, -24, tl('wave_' + k), '#ff9a7a', 18, true);
}

// 土遁忍者：玩家靠近時從地板冒出，往上散射三支苦無
function earthCheck(e) {
  const p = g.p;
  if (!e.hidden || Math.hypot(p.x - e.x, p.y - e.y) > 130) return;
  e.hidden = false; e.flash = .3;
  for (const ang of [-2.0, -1.57, -1.14]) g.eshots.push({ x: e.x, y: e.y - 10, vx: Math.cos(ang) * 200, vy: Math.sin(ang) * 200, t: 0, kind: 'kunai' });
  sparkle(e.x, e.y, '#a07a4a'); SFX.throw();
}
// 依高度逐步解鎖新敵人
function enemyType(d) {
  const T = g.top + g.lvl * 2000, w = [[0, .6 - .4 * d], [1, .3], [2, .1 + .2 * d]];
  if (T > 1500) w.push([3, .22]);
  if (T > 2500) w.push([5, .16]);
  if (T > 3200) w.push([4, .2]);
  if (T > 4500) w.push([6, .08]);
  let r = Math.random() * w.reduce((s, x) => s + x[1], 0);
  for (const [t, p] of w) { r -= p; if (r <= 0) return t; }
  return 0;
}

function stageBanner() {
  g.banner = {
    t: 2.6, a: stageName(g.stage), b: THEMES[g.th].k,
    c: g.mod ? t('mod_line', L(g.mod.n), L(g.mod.d)) : '',
  };
}

// ===== 主更新 =====
function update(dt) {
  musicFor();
  if (state === 'menu') { INTRO.update(dt); return; }
  if (!g || paused) return;
  if (state !== 'play' && inp.mode === 'aim') inp.mode = null;   // 進入演出時取消瞄準
  switch (state) {
    case 'play':
      // 按住不動一下 → 進入彈射瞄準；瞄準時時間變慢（最多 AIM_SLOW_MAX 秒）
      if (inp.mode === 'pending') { inp.hold += dt; if (inp.hold >= AIM_HOLD) { inp.mode = 'aim'; inp.aimT = 0; SFX.aim(); } }
      if (inp.mode === 'aim') { inp.aimT += dt; if (inp.aimT < AIM_SLOW_MAX) dt *= AIM_SLOW; }
      if (g.hitstop > 0) g.hitstop -= dt;   // HIT STOP：世界短暫停格
      else updatePlay(dt);
      break;
    case 'slash': updateSlash(dt); break;
    case 'cast': { const e0 = CAST_T - g.castT; g.castT -= dt; castCue(e0, CAST_T - g.castT); } if (g.castT <= 0) jutsuGo(g.castJ || JUTSU[0]); break;
    case 'qte': updateQte(dt); break;
    case 'zintro': updateZIntro(dt); break;
    case 'ascend': updateAscend(dt); break;
    case 'kill': g.killT -= dt; if (g.killT <= 0) startFin(); break;   // 連續斬擊特寫（不出字）→ 居合一閃＋封印演出
    case 'flee': updateFlee(dt); break;   // 初戰擊退：魔王逃走演出
    case 'fin': updateFin(dt); break;   // 決戰擊倒演出
    case 'dying': g.dieT -= dt; g.p.vy += GRAV * dt; g.p.y += g.p.vy * dt; if (g.dieT <= 0) showOver(); break;
  }
  if (g && state !== 'perk') updateFx(dt);
}

function updateDemo(dt) {
  demo.t += dt; demo.vy += GRAV * dt; demo.y += demo.vy * dt;
  if (demo.y > 470) { demo.y = 470; demo.vy = -JUMP; }
  demo.x = W / 2 + Math.sin(demo.t * .7) * 110; demo.face = Math.cos(demo.t * .7) > 0 ? 1 : -1;
}

function updatePlay(dt) {
  const p = g.p;
  g.t += dt;
  if (g.fever > 0) { g.fever -= dt; if (g.fever <= 0) settleCombo(); }
  else if (g.comboT > 0) { g.comboT -= dt; if (g.comboT <= 0) settleCombo(); }
  g.ki = Math.min(kiMax(), g.ki + dt * .12 * (sk('swift') ? SKV.swift(sk('swift')).regen : 1) * (1 + .15 * mt('kireg')));
  updateWx(dt);   // 天候（levels.js）
  if (g.todF && g.todF.q < 1) g.todF.q = Math.min(1, g.todF.q + dt / 2.2);   // 換時段的淡入
  if (g.lvQueue > 0) { g.lvQueue--; openPerks('lv'); return; }   // 有待選的升級就先暫停選擇
  if (g.pendingChest) { g.pendingChest = false; openPerks('chest'); return; }   // 中 BOSS 的寶箱
  p.inv =Math.max(0, p.inv - dt); p.spin = Math.max(0, (p.spin || 0) - dt); p.swing = Math.max(0, (p.swing || 0) - dt); p.hurt = Math.max(0, (p.hurt || 0) - dt); p.slow = Math.max(0, p.slow - dt); p.freeze = Math.max(0, p.freeze - dt); p.sq = Math.max(0, p.sq - dt * 4);
  if (g.banner) { g.banner.t -= dt; if (g.banner.t <= 0) g.banner = null; }
  // 忍法的持續效果
  if (g.kongo > 0) g.kongo -= dt;
  if (g.kishinT > 0) g.kishinT -= dt;
  if (g.jfx) { g.jfx.t -= dt * 1.4; if (g.jfx.t <= 0) g.jfx = null; }

  // 移動
  let mv = inp.dx * SENS; inp.dx = 0;
  const k = ((inp.keys.ArrowLeft || inp.keys.KeyA) ? -1 : 0) + ((inp.keys.ArrowRight || inp.keys.KeyD) ? 1 : 0);
  mv += k * 310 * dt;
  if (p.slow > 0) mv *= .45;
  mv *= 1 + .05 * mt('speed');
  if (p.freeze > 0) mv = 0;
  mv = wxMove(mv, dt);   // 暴風雨的陣風、暴雪打滑
  if (g.mod && g.mod.id === 'wind') {
    g.windT -= dt; if (g.windT <= 0) { g.windT = rnd(3, 5); g.wind = (Math.random() < .5 ? -1 : 1) * rnd(50, 85); }
    mv += g.wind * dt;
  }
  p.x += mv + p.vx * dt; if (Math.abs(mv) > .3) p.face = mv > 0 ? 1 : -1;
  p.vx *= Math.max(0, 1 - 5 * dt);
  // 牆壁：空中往牆推且不在上升時，自動蹬牆跳（每次落地前限一次）
  if (p.x < PL_MIN || p.x > PL_MAX) {
    const side = p.x < PL_MIN ? -1 : 1;
    p.x = clamp(p.x, PL_MIN, PL_MAX);
    if (p.vx * side > 0) p.vx = 0;
    if (!p.wallUsed && Math.sign(mv) === side && p.vy > -150 && p.dash <= 0 && !p.dive && g.fly <= 0) {
      p.wallUsed = true; g.walls++; p.vy = -JUMP * .85; p.vx = -side * 340; p.face = -side; p.sq = .6; p.spin = .45;   // 蹬牆跳：空翻一圈
      // （「蹬!」飄字已移除）
      for (let i = 0; i < 5; i++) g.parts.push({ x: p.x + side * 10, y: p.y - 20 + rnd(-10, 10), vx: -side * rnd(40, 120), vy: rnd(-60, 30), life: .35, max: .35, c: '#ffffffaa', s: rnd(2, 3) });
      SFX.wallJump();
    }
  }

  // 垂直
  if (g.fly > 0) {
    g.fly -= dt; p.vy = -FLY_V;
    if (g.fly <= 0) p.vy = -420;
    if (Math.random() < .8) g.parts.push({ x: p.x + rnd(-8, 8), y: p.y, vx: rnd(-30, 30), vy: rnd(80, 200), life: .5, max: .5, c: pick(['#fff', '#ffd27a', '#ff8a3a']), s: rnd(2, 5) });
  } else if (p.dash > 0) {
    p.dash -= dt; p.vy = p.dvy;
    p.x += p.dvx * dt;
    // 衝刺撞牆會反射（彈射斬的軌跡預覽也照這個規則畫）
    if (p.x < PL_MIN || p.x > PL_MAX) {
      p.x = clamp(p.x, PL_MIN, PL_MAX); p.dvx = -p.dvx; p.face = p.dvx > 0 ? 1 : -1; p.banks++;
      SFX.clank(); g.shake = Math.max(g.shake, 4);
    }
    if (p.dash <= 0) p.vy = p.dvy * .4;
    g.ghosts.push({ x: p.x, y: p.y, face: p.face, t: 0 });
  } else if (p.dive) {
    p.vy = DIVE_V;
    if (Math.random() < .6) g.ghosts.push({ x: p.x, y: p.y, face: p.face, t: 0 });
  } else p.vy += GRAV * dt;
  const py = p.y;
  p.y += p.vy * dt;

  // 地板
  for (const pl of g.plats) {
    if (pl.type === 'move') pl.x = clamp(pl.bx + Math.sin(g.t * pl.sp + pl.ph) * pl.amp, WALL + pl.w / 2, W - WALL - pl.w / 2);
    if (pl.crack > 0) { pl.crack -= dt; if (pl.crack <= 0) { pl.broken = true; pl.vy = 0; SFX.crack(); } }
    if (pl.broken) { pl.vy += GRAV * dt; pl.y += pl.vy * dt; }
    if (pl.comp > 0) pl.comp -= dt;
  }
  if (p.vy > 0 && g.fly <= 0 && p.dash <= 0) {
    for (const pl of g.plats) {
      if (pl.broken) continue;
      if (py <= pl.y + 3 && p.y >= pl.y && Math.abs(p.x - pl.x) < pl.w / 2 + 9) { land(pl); break; }
    }
  }

  // 相機與高度
  if (p.y < g.camY + H * .42) g.camY = p.y - H * .42;
  g.top = Math.max(g.top, -p.y + 40);
  while (g.genY > g.camY - 150) genRow();
  const cut = g.camY + H + 120;
  g.plats = g.plats.filter(o => o.y < cut);
  g.items = g.items.filter(o => o.y < cut && !o.dead);
  g.enemies = g.enemies.filter(o => o.y < cut && !o.dead);

  // 死亡區域
  let zs = Math.min(110, 24 + g.top / 180);
  if (g.mod && g.mod.id === 'rise') zs *= 1.5;
  zs *= Math.pow(.85, pk('slowzone')) * (1 + .15 * hardN());
  if (g.boss) zs *= .6;
  if (g.th === 0 && g.stage < 2) zs *= .8;   // 林關前兩個舞台：追兵慢 20%
  if (g.th === 2) zs *= 1.12;   // 火關（最後一關）：追兵快 12%
  if (g.tut) zs = 0;   // 新手教學：下方沒有追兵
  g.zoneY -= zs * dt;
  const zVis = Math.min(g.zoneY, g.camY + H - 26);
  if (p.y > zVis + 6 && g.fly <= 0) {
    if (hurt('zone')) return;
    // 救援
    p.y = g.camY + H * .5; p.vy = -JUMP * 1.1; p.inv = 2; p.dive = false; p.dash = 0; p.wallUsed = false;
    p.x = clamp(p.x, PL_MIN + 30, PL_MAX - 30);
    g.plats.push({ x: p.x, y: p.y + 4, w: 80, type: 'normal', bx: p.x, ph: 0, sp: 0, amp: 0 });
    g.zoneY = g.camY + H + 260;
    floatText(p.x, p.y - 60, t('danger'), '#ff5a3a', 22);
  }

  // 道具
  const mag = pk('magnet') * 45 + mt('magnet') * 20;
  for (const it of g.items) {
    it.ph += dt * 4;
    const dx = p.x - it.x, dy = (p.y - 18) - it.y, dist = Math.hypot(dx, dy);
    if (mag && dist < 40 + mag) { it.x += dx * Math.min(1, dt * 8); it.y += dy * Math.min(1, dt * 8); }
    if (dist < (g.fly > 0 ? 40 : 24)) collect(it);
  }

  // 敵忍者
  const reach = pk('reach') * 9 + mt('reach') * 4 + (p.dash > 0 || p.dive ? 8 : 0);
  for (const e of g.enemies) {
    if (e.dead) continue;
    e.ph += dt; e.cool = Math.max(0, e.cool - dt); e.flash = Math.max(0, e.flash - dt); e.atk = Math.max(0, (e.atk || 0) - dt);
    const ed = ENEMY[e.type];
    if (e.sleep > 0 || e.frozen > 0) { e.sleep = Math.max(0, (e.sleep || 0) - dt); e.frozen = Math.max(0, (e.frozen || 0) - dt); }   // 夢幻術／雪華封：不動、不攻擊
    else enemyAI(e, ed, dt);
    if (e.dead) continue;
    if (e.hidden) continue;   // 土遁忍者藏在地板裡時碰不到
    if (e.cool <= 0 && Math.abs(p.x - e.x) < ed.w / 2 + 10 + reach && Math.abs((p.y - 20) - e.y) < ed.h / 2 + 18 + reach) {
      if (touchEnemy(e)) return;
    }
  }
  // 敵方攻擊：飛鏢／箭（有重力）／苦無／蛛絲（減速不扣血）
  for (const s of g.eshots) {
    s.t += dt; if (s.grav) s.vy += s.grav * dt;
    if (s.wave != null) { const sp = Math.hypot(s.vx, s.vy), an = s.wave + Math.sin(s.t * 7) * .52; s.vx = Math.cos(an) * sp; s.vy = Math.sin(an) * sp; }
    s.x += s.vx * dt; s.y += s.vy * dt;
    if (Math.hypot(s.x - p.x, s.y - (p.y - 20)) < (s.kind === 'web' || s.kind === 'frost' ? 18 : 14)) {
      s.dead = true;
      if (p.dash > 0 || p.dive || g.fly > 0 || g.kongo > 0) { sparkle(s.x, s.y, '#fff'); SFX.clank(); }   // 衝刺中可以彈開
      else if (s.kind === 'web') { p.slow = Math.max(p.slow, 1.6); floatText(p.x, p.y - 50, t(s.skin === 1 ? 'webbed_1' : 'webbed'), '#ddd', 15); }
      else if (s.kind === 'frost') { p.freeze = Math.max(p.freeze, .5); floatText(p.x, p.y - 50, t('frozen'), '#bfefff', 15); }
      else if (hurt(s.kind || 'shot')) return;
    }
  }
  g.eshots = g.eshots.filter(s => !s.dead && s.t < 4);
  // 火關：火車留下的火焰（1.5 秒，碰到會受傷）；山關：雪崩球爆開後的冰霧（2 秒，在裡面會變慢）
  for (const f of g.fires) { f.t += dt; if (f.t < 1.5 && !(p.dash > 0 || p.dive || g.fly > 0 || g.kongo > 0) && Math.hypot(f.x - p.x, f.y - (p.y - 10)) < 13) { f.t = 1.5; if (hurt('fire')) return; } }
  g.fires = g.fires.filter(f => f.t < 1.5);
  for (const m of g.mists) { m.t += dt; if (Math.hypot(m.x - p.x, m.y - (p.y - 20)) < m.r) p.slow = Math.max(p.slow, .25); }
  g.mists = g.mists.filter(m => m.t < 2);

  // 自動技能、掉落物
  updateSkills(dt * (1 + .05 * mt('cd')));   // 修行「迅術」：技能冷卻更快
  for (const s of g.shots) {
    s.t += dt * (s.pierce ? 2.5 : 4); const e = s.back ? { x: p.x, y: p.y - 20 } : s.tg;
    s.cx = s.x + (e.x - s.x) * Math.min(1, s.t); s.cy = s.y + (e.y - s.y) * Math.min(1, s.t);
    // 風魔大手裡劍：沿路貫穿，到達後飛回手中
    if (s.pierce) for (const o of g.enemies) if (!o.dead && Math.abs(o.x - s.cx) < ENEMY[o.type].w / 2 + 14 && Math.abs(o.y - s.cy) < ENEMY[o.type].h / 2 + 14) autoHit(o);
    if (s.t >= 1) {
      if (s.pierce && !s.back) { s.back = true; s.x = s.cx; s.y = s.cy; s.t = 0; }
      else { s.done = true; if (!s.back) autoHit(e); }
    }
  }
  g.shots = g.shots.filter(s => !s.done);
  updateDrops(dt);

  // 波次與中 BOSS
  g.waveT = (g.waveT ?? 8) - dt;
  if (g.waveT <= 0 && !g.boss && !g.tut && g.top > 300) { spawnWave(); g.waveT = rnd(11, 16) * Math.max(.55, 1 - .035 * g.stage - .05 * g.lvl); }
  // 舞台：第 3、8 舞台中段出現大天狗；第 5、10 舞台（魔王舞台）爬到三成時魔王登場，打倒後才進下一個舞台；其餘舞台爬滿就換下一個
  const bossSt = g.stage % 5 === 4;
  if (!g.tut && g.stage % 5 === 2 && !g.midDone && !g.boss && !g.mid && g.top >= g.base + STAGE_PX * .5) spawnMid();

  // BOSS
  if (!g.tut && !bossSt && g.top >= g.base + STAGE_PX) nextStage();
  if (!g.tut && bossSt && !g.boss && g.top >= g.base + STAGE_PX * .3) spawnBoss();
  if (g.boss) updateBoss(dt);

  checkLiveAch();
  if (g.tut) updateTutorial(dt);   // 新手教學（tutorial.js）
}

// ===== 自動技能 =====
// 技能命中：菁英要打兩次（有短暫冷卻），其他直接斬殺
function autoHit(e) {
  if (e.dead || e.cool > 0) return;
  if (e.hidden) return;
  if (e.hp > 1) { e.hp--; e.cool = .4; e.flash = .3; SFX.slash(); return; }
  slay(e, true);
}
function updateSkills(dt) {
  const p = g.p, S = g.sks, px = p.x, py = p.y - 20;
  const vis = e => !e.dead && e.y > g.camY + 70 && e.y < g.camY + H - 30;
  const dist = e => Math.hypot(e.x - px, e.y - py);
  let l, v;
  // 手裡劍：朝最近的幾個敵人投擲
  if ((l = sk('shuriken'))) {
    v = SKV.shuriken(l); S.shurT = (S.shurT ?? 1) - dt;
    if (S.shurT <= 0) {
      const ts = g.enemies.filter(e => vis(e) && dist(e) < 320).sort((a, b) => dist(a) - dist(b)).slice(0, v.n);
      if (ts.length) { for (const e of ts) g.shots.push({ x: px, y: py, tg: e, t: 0, pierce: v.pierce }); S.shurT = v.cd; SFX.throw(); }
      else S.shurT = .25;
    }
  }
  // 苦無環：繞身旋轉，碰到的敵人斬殺、飛鏢擋下
  if ((l = sk('kunai'))) {
    v = SKV.kunai(l); S.kunA = (S.kunA || 0) + v.sp * dt;
    for (let i = 0; i < v.n; i++) {
      const a = S.kunA + i * Math.PI * 2 / v.n, kx = px + Math.cos(a) * v.r, ky = py + Math.sin(a) * v.r;
      for (const e of g.enemies) if (!e.dead && Math.abs(e.x - kx) < ENEMY[e.type].w / 2 + 6 && Math.abs(e.y - ky) < ENEMY[e.type].h / 2 + 6) autoHit(e);
      for (const s of g.eshots) if (Math.hypot(s.x - kx, s.y - ky) < 12) { s.dead = true; sparkle(s.x, s.y, '#fff'); }
    }
  }
  // 雷遁：隨機打畫面上的敵人
  if ((l = sk('thunder'))) {
    v = SKV.thunder(l); S.thT = (S.thT ?? 1.5) - dt;
    if (S.thT <= 0) {
      const c = g.enemies.filter(vis);
      if (c.length) {
        for (let i = 0; i < v.n && c.length; i++) { const e = c.splice(Math.random() * c.length | 0, 1)[0]; g.bolts.push({ x: e.x, y: e.y, t: 0 }); autoHit(e);
          // 雷神：每道雷再連鎖到附近的敵人
          let from = e;
          for (let k = 0; k < v.chain; k++) {
            const nx = g.enemies.filter(o => !o.dead && o !== from && Math.hypot(o.x - from.x, o.y - from.y) < 130).sort((a, b) => Math.hypot(a.x - from.x, a.y - from.y) - Math.hypot(b.x - from.x, b.y - from.y))[0];
            if (!nx) break;
            g.bolts.push({ x: nx.x, y: nx.y, t: 0, fx: from.x, fy: from.y, zap: true }); autoHit(nx); from = nx;
          }
        }
        SFX.thunder(); g.shake = Math.max(g.shake, 4); S.thT = v.cd;
      } else S.thT = .3;
    }
  }
  // 風刃（著地時在 land() 發射）
  for (const b of g.blades) {
    b.x += b.vx * dt; b.y += b.vy * dt; b.t += dt;
    if (b.x < WALL + 4 || b.x > W - WALL - 4) {
      if (b.bounce > 0) { b.bounce--; b.vx = -b.vx; b.x = clamp(b.x, WALL + 4, W - WALL - 4); } else b.dead = true;
    }
    for (const e of g.enemies) if (!e.dead && Math.abs(e.x - b.x) < ENEMY[e.type].w / 2 + b.size && Math.abs(e.y - b.y) < ENEMY[e.type].h / 2 + b.size * .6) autoHit(e);
  }
  g.blades = g.blades.filter(b => !b.dead && b.t < 2);
  // 結界：用掉後重新充能
  if ((l = sk('barrier'))) {
    v = SKV.barrier(l);
    if (g.barrier < v.max) { g.barT += dt; if (g.barT >= v.cd) { g.barT = 0; g.barrier++; } }
  }
  // 金剛氣：持續彈開飛鏢，定時震波
  if ((l = sk('aura'))) {
    v = SKV.aura(l);
    for (const s of g.eshots) if (!s.dead && Math.hypot(s.x - px, s.y - py) < v.r) { s.dead = true; sparkle(s.x, s.y, '#bfe8ff'); }
    S.auT = (S.auT ?? v.cd) - dt;
    if (S.auT <= 0) {
      S.auT = v.cd; g.booms.push({ x: px, y: py, r: v.r, t: 0, c: '#9ad8ff' });
      for (const e of g.enemies) if (!e.dead && (v.all || e.type <= 1) && dist(e) < v.r + ENEMY[e.type].w / 2) autoHit(e);
    }
  }
  // 式神鳥：定時把範圍內的掉落物吸過來，Lv3 起會啄擊敵人
  if ((l = sk('shiki'))) {
    v = SKV.shiki(l); S.biA = (S.biA || 0) + dt * 2.2;
    S.biT = (S.biT ?? 1) - dt;
    if (S.biT <= 0) { S.biT = 1.2; for (const d of g.drops) if (Math.hypot(d.x - px, d.y - py) < v.r) d.pull = true; }
    if (v.atk) {
      S.bkT = (S.bkT ?? v.atk) - dt;
      if (S.bkT <= 0) {
        const c = g.enemies.filter(e => vis(e) && dist(e) < v.r);
        if (c.length) { const e = pick(c); g.bolts.push({ x: e.x, y: e.y, t: 0, fx: px + Math.cos(S.biA) * 30, fy: py - 34 }); autoHit(e); S.bkT = v.atk; }
        else S.bkT = .4;
      }
    }
  }
  updateCharSkills(dt, vis, dist);   // 角色專屬技能（chars.js）
}

// ===== 掉落物：魂（經驗）與小判 =====
function dropLoot(x, y, type) {
  g.drops.push({ k: 'soul', x, y, vx: rnd(-50, 50), vy: -rnd(140, 240), v: SOUL_V[type] ?? 1, ph: rnd(0, 6) });
  const cn = type === 6 ? 5 : Math.random() < .25 ? 1 : 0;
  for (let i = 0; i < cn; i++) g.drops.push({ k: 'coin', x, y, vx: rnd(-80, 80), vy: -rnd(160, 260), v: 1, ph: rnd(0, 6) });
}
function updateDrops(dt) {
  const p = g.p, px = p.x, py = p.y - 20, R = 36 + pk('magnet') * 45 + mt('magnet') * 20;
  for (const d of g.drops) {
    d.ph += dt * 5;
    const dx = px - d.x, dy = py - d.y, dist = Math.hypot(dx, dy);
    if (d.pull || dist < R || (g.fly > 0 && dist < 90)) {
      // 被吸收：直線飛向玩家
      d.pull = true; const s = Math.min(1, 700 * dt / Math.max(dist, 1));
      d.x += dx * s; d.y += dy * s;
    } else {
      // 先往上噴，再慢慢飄落
      d.vy = Math.min(70, d.vy + 320 * dt); d.vx *= 1 - 2 * dt;
      d.x = clamp(d.x + d.vx * dt, WALL + 6, W - WALL - 6); d.y += d.vy * dt;
    }
    if (dist < 16) {
      d.dead = true;
      if (d.k === 'soul') gainXp(d.v); else { addCoins(d.v); SFX.coin(); }
    }
  }
  g.drops = g.drops.filter(d => !d.dead && d.y < g.camY + H + 40);
}
// 風刃：著地時向左右（Lv4 起含斜上方）發射
function fireBlades() {
  const p = g.p, v = SKV.wind(sk('wind')), y = p.y - 18;
  for (const sd of [-1, 1]) {
    g.blades.push({ x: p.x, y, vx: sd * v.sp, vy: 0, size: v.size, bounce: v.bounce, t: 0 });
    if (v.diag) g.blades.push({ x: p.x, y, vx: sd * v.sp * .7, vy: -v.sp * .7, size: v.size, bounce: v.bounce, t: 0 });
  }
  SFX.wind();
}
function gainXp(v) {
  g.xp += v * (1 + .08 * mt('xp')); SFX.soul();
  while (g.xp >= xpNeed(g.lv)) { g.xp -= xpNeed(g.lv); g.lv++; g.lvQueue++; }
}

function land(pl) {
  const p = g.p;
  p.y = pl.y; p.sq = 1; p.wallUsed = false; g.kiChain = 0;
  let v = JUMP * (1 + .08 * pk('bounce')) * (p.slow > 0 ? .85 : 1);
  if (p.dive) {
    // 急降斬著地：衝擊波斬殺周圍敵人、擊碎釘刺，並高高彈起；不會中斷連斬
    p.dive = false;
    const r = 90 * (1 + .5 * pk('quake'));
    g.booms.push({ x: p.x, y: pl.y, r, t: 0, c: '#ffffff' });
    for (const e of g.enemies) if (!e.dead && Math.hypot(e.x - p.x, e.y - pl.y) < r) slay(e);
    if (pl.type === 'spike') { pl.type = 'normal'; floatText(p.x, p.y - 50, '破!', '#fff', 22); }
    g.shake = 9; SFX.impact(); vib(50);
    v = Math.max(v * 1.3, pl.type === 'spring' ? SPRING * 1.1 : 0);
  } else if (g.fever <= 0 && g.combo >= 1 && g.comboT > 0) {
    // 落地寬限：不立刻結算，剩下的連斬時間縮成寬限（0.8 秒＋連斬之心每級 0.2 秒），這段時間內再斬到就接上
    g.comboT = Math.min(g.comboT, comboGrace()); g.grace = true;
  }
  if (pl.type === 'spring') { v = Math.max(v, SPRING * (1 + .05 * pk('bounce'))); pl.comp = .25; SFX.spring(); p.spin = .55; }   // 彈簧：空翻
  else if (pl.type === 'spike') {
    if (p.inv <= 0) {
      if (pk('spikeproof') && !g.spikeUsed) { g.spikeUsed = true; floatText(p.x, p.y - 50, L(PERKS.find(x => x.id === 'spikeproof').n) + '!', '#ffd27a', 18); }
      else { p.vy = -v; if (hurt('spike')) return; }
    }
    SFX.jump();
  } else SFX.jump();
  if (pl.type === 'crumble') { pl.broken = true; pl.vy = 50; for (let i = 0; i < 6; i++) g.parts.push({ x: pl.x + rnd(-pl.w / 2, pl.w / 2), y: pl.y + 4, vx: rnd(-40, 40), vy: rnd(-60, 20), life: .6, max: .6, c: '#8a6232', s: rnd(2, 4) }); }
  p.vy = -v;
  if (sk('wind')) fireBlades();
  if (sk('mist')) dropMist(p.x, pl.y);   // 毒霧（chars.js）
  for (let i = 0; i < 4; i++) g.parts.push({ x: p.x + rnd(-10, 10), y: pl.y, vx: rnd(-60, 60), vy: rnd(-40, -10), life: .35, max: .35, c: '#ffffffaa', s: rnd(2, 3) });
}

function hurt(src) {
  const p = g.p;
  if (g.tut) return false;   // 新手教學中不會受傷
  if (p.inv > 0 && src !== 'zone') return false;
  // 結界：擋下這次傷害
  if (g.barrier > 0) {
    g.barrier--; g.barT = 0; p.inv = 1;
    if (sk('barrier') > 5) for (const e of g.enemies) if (!e.dead && Math.hypot(e.x - p.x, e.y - p.y) < 110) autoHit(e);   // 不動結界：震飛周圍
    g.booms.push({ x: p.x, y: p.y - 20, r: 45, t: 0, c: '#9ad8ff' });
    floatText(p.x, p.y - 50, t('blocked'), '#9ad8ff', 18); SFX.clank(); vib(40);
    return false;
  }
  const dmg = Math.round((DMG[src] ?? 15) * (1 - .06 * mt('armor'))); g.stHit = true;
  g.hp = Math.max(0, g.hp - dmg); g.shake = 12; SFX.hit(); vib(120);
  floatText(p.x, p.y - 50, '-' + dmg, '#ff4040', 20);
  if (g.hp <= 0) { die(); return true; }
  p.inv = 1.6; p.hurt = .4;   // 受傷：往後仰、閃紅
  return false;
}

// 回復 HP（不超過上限）
function heal(n, x = g.p.x, y = g.p.y - 60) {
  const v = Math.min(n, g.maxHp - g.hp); if (v <= 0) return;
  g.hp += v; floatText(x, y, 'HP +' + v, '#7aff9a', 16);
}

// 復活（修行「再起」或看廣告）：一半 HP、短暫無敵、震飛身邊的敵人
function reviveNow(label) {
  g.hp = Math.round(g.maxHp / 2); const p = g.p; p.inv = 2.5; p.vy = -JUMP * 1.2; p.hurt = 0; p.dash = 0; p.dive = false;
  p.y = Math.min(p.y, g.camY + H * .5); g.zoneY = Math.max(g.zoneY, g.camY + H + 260);
  g.booms.push({ x: p.x, y: p.y - 20, r: 120, t: 0, c: '#ffb04a' }); for (const e of g.enemies) if (!e.dead && Math.hypot(e.x - p.x, e.y - p.y) < 120) slay(e, true);
  floatText(p.x, p.y - 60, label, '#ffb04a', 24); SFX.fever(); vib([60, 40, 60]);
}
function die() {
  if (g.revives > 0) { g.revives--; reviveNow(t('revive')); return; }   // 修行「再起」：以一半 HP 復活
  if (!g.adRevUsed && !g.tut && typeof ADS !== 'undefined' && ADS.ready()) { g.contPrev = state; offerContinue(); return; }   // 看廣告復活（ads.js，每局一次）
  state = 'dying'; g.dieT = 1.1; g.p.vy = -500; SFX.die(); vib([80, 60, 200]);
}

function collect(it) {
  it.dead = true;
  const p = g.p;
  if (it.t === 'coin') { addCoins(1); addBonus(10); SFX.coin(); sparkle(it.x, it.y, '#ffd27a'); }
  else if (it.t === 'scroll') { g.scrolls = Math.min(9, g.scrolls + 1); addBonus(300); SFX.item(); floatText(it.x, it.y, t('scroll_plus'), '#fff', 16); }
  else if (it.t === 'chest') {
    SFX.item(); sparkle(it.x, it.y, '#fff');
    const r = Math.random();
    if (r < .35) { const n = 5 + (Math.random() * 10 | 0); addCoins(n); floatText(it.x, it.y, t('koban_plus', n), '#ffd27a', 16); }
    else if (r < .55) { g.scrolls = Math.min(9, g.scrolls + 1); floatText(it.x, it.y, t('scroll_plus'), '#fff', 16); }
    else if (r < .75) { addBonus(800); floatText(it.x, it.y, '+800', '#fff', 18); }
    else if (r < .9 && g.hp < g.maxHp) heal(25, it.x, it.y);
    else { g.fly = 1; p.inv = 1.6; floatText(it.x, it.y, t('tailwind'), '#9ae0ff', 18); }
  }
}

function addCoins(n) {
  const mul = (1 + .5 * pk('gold')) * (1 + .1 * save.meta.gold) * (g.mod && g.mod.id === 'rich' ? 2 : 1);
  g.coins += n * mul;
}
function addBonus(n) { g.bonus += n * (1 + .2 * pk('score')); }
function score() { return Math.floor(g.top / 4 + g.bonus); }

// ===== 斬擊 =====
const kiCost = () => g.fever > 0 ? .5 : 1;   // 狂熱中衝刺／急降斬只花半格氣
const kiMax = () => 3 + pk('kimax') + mt('ki') + (sk('swift') ? SKV.swift(sk('swift')).ki : 0);

// 碰到敵人。回傳 true 表示進入了全畫面斬擊演出
function touchEnemy(e) {
  // 金剛身中、或被雪華封凍住的敵人：一碰就碎（大天狗除外）
  const thaw = (e.frozen > 0 || g.kongo > 0) && e.type !== 13;
  const p = g.p, fast = p.dash > 0 || p.dive || g.fly > 0 || thaw;
  // 鬼火：不是衝刺／急降／豪天翔時碰到會受傷（鬼火也跟著消散）
  if (e.type === 10 && !fast) {
    e.dead = true; burst(e.x, e.y, '#b07aff', 10);
    if (p.inv <= 0) hurt('onibi');
    return false;
  }
  // 盾忍者：從下方往上撞會被重重打落並中斷連斬（衝刺斬可以破盾）
  if (e.type === 4 && !fast && p.vy < 0 && (p.y - 20) > e.y) {
    e.cool = .6; p.vy = g.th === 1 ? 680 : 520; p.sq = 1;   /* 風關大團扇吹得更遠 */
    floatText(e.x, e.y - 30, '盾!', '#ccc', 18); SFX.clank(); g.shake = 7; vib(60);
    if (g.fever <= 0) { g.combo = 0; g.comboT = 0; }
    return false;
  }
  // 菁英：第一刀只會打退
  if (e.hp > 1 && !thaw) {
    e.hp--; e.cool = .35; e.flash = .3; e.tough = 1; p.swing = SWING_T;   // 要斬好幾刀的敵人（菁英、大天狗）：最後一刀播特寫
    if (!p.dive) { p.dash = 0; p.vy = -JUMP; }
    g.hitstop = .1; g.shake = 6; SFX.slash();
    g.fx.push({ x: e.x, y: e.y, a: rnd(0, 3.14), t: 0 });
    floatText(e.x, e.y - 30, e.type === 13 ? 'HP ' + e.hp : t('one_more'), '#e0b0ff', 14);
    return false;
  }
  slay(e); p.swing = SWING_T;   // 揮擊動作（art.js 的 heroSwing）
  // 全畫面特寫斬擊：連斬到 5、10、20、30…的那一刀，或菁英／大天狗的最後一刀。
  // 播過後 6 秒內不再播（10、20、30 連斬本來就隔很多刀，不受冷卻限制）、魔王戰和豪天翔中不播；其他時候只用短暫 HIT STOP
  const big = g.combo >= 10 && g.combo % 10 === 0;
  const cine = !g.boss && g.fly <= 0 && (big || (g.t - (g.cineT ?? -99) >= 6 && (e.tough || e.type === 13 || g.combo === 5)));
  if (cine) g.cineT = g.t;
  if (g.fly > 0) return false;
  if (p.dive) {   // 急降斬穿過敵人繼續往下（特寫結束後接著往下劈）
    if (cine) { state = 'slash'; g.slash = { e, t: 0, dur: ENEMY[e.type].dur, lines: [], n: 0, nextL: 0 }; return true; }
    g.hitstop = .04; return false;
  }
  if (p.dash > 0 && p.banks > 0) unlock('bank1');
  p.dash = 0; p.vy = -JUMP * (1 + .08 * pk('bounce')); p.wallUsed = false;
  if (g.combo >= 1) p.spin = .4;   // 連斬中踩著敵人往上：空翻
  p.inv = Math.max(p.inv, .2);
  if (cine) {
    state = 'slash';
    g.slash = { e, t: 0, dur: ENEMY[e.type].dur + (g.th === 3 && e.type === 2 ? .2 : 0),   /* 山關雪男比較硬 */ lines: [], n: 0, nextL: 0 };
    return true;
  }
  g.hitstop = .08;
  return false;
}

// 斬殺：計分、連斬、狂熱、爆彈連鎖、菁英掉寶、掉落魂與小判。auto＝技能擊殺（不回氣）
function slay(e, auto) {
  if (e.dead) return;
  e.dead = true;
  const ed = ENEMY[e.type];
  // 斬成兩半的屍體（沿斬擊方向切開，往兩邊飛散）＋消失的煙
  const pp = g.p, ca = pp.dash > 0 ? Math.atan2(pp.dvy, pp.dvx) : pp.dive ? Math.PI / 2 : rnd(-.6, .6);
  if (e.type !== 13) g.corpses.push({ type: e.type, x: e.x, y: e.y, a: ca, t: 0, ph: e.ph, vx: e.vx || 0, affix: e.affix, look: Math.sign(pp.x - e.x) || 1 });
  g.puffs.push({ x: e.x, y: e.y, t: 0, r: ed.w * .6 });
  g.combo = (g.comboT > 0 || g.fever > 0) ? g.combo + 1 : 1;
  g.comboT = comboMax(); g.grace = false;
  g.maxCombo = Math.max(g.maxCombo, g.combo);
  const mult = Math.min(g.combo, 20) * (g.fever > 0 ? 2 : 1);
  addBonus(ed.pts * mult);
  // （每斬一刀的得分飄字已移除：畫面太雜）
  if (g.combo >= 2) SFX.combo(g.combo);   // 「N 連斬!」飄字已移除（HUD 已有連斬數）
  if (g.combo % 10 === 0) startFever();
  // 只有自己斬的才回氣；衝刺／急降斬連續斬殺時第一隻回 0.5、之後每隻只回 0.2，踩到地板才重置（避免一路衝到底）
  if (!auto) g.ki = Math.min(kiMax(), g.ki + (pp.dash > 0 || pp.dive ? (g.kiChain++ ? .2 : .5) : .5));
  g.fx.push({ x: e.x, y: e.y, a: rnd(0, 3.14), t: 0 });
  burst(e.x, e.y, '#222', 12); SFX.slash(); vib(25);
  g.shake = Math.max(g.shake, 5);
  dropLoot(e.x, e.y, e.type);
  countKill();
  if (e.type === 6) g.items.push({ t: 'chest', x: e.x, y: e.y, ph: 0 });
  if (e.affix === 'split') for (const d of [-22, 22]) g.enemies.push(mkEnemy(0, clamp(e.x + d, WALL + 20, W - WALL - 20), e.y, 15));
  if (e.type === 13) midDown(e);
  if (e.type === 5) explode(e.x, e.y);
}

// 爆彈忍者爆炸：炸死附近敵人（可連鎖）並炸碎附近地板
function explode(x, y) {
  const r = g.th === 2 ? 119 : 95;   // 火關火藥桶狸的爆炸大 25%
  g.booms.push({ x, y, r, t: 0, c: g.th === 3 ? '#cfefff' : '#ff8a3a' });
  if (g.th === 3) g.mists.push({ x, y, r: 85, t: 0 });   // 山關雪崩球：留下冰霧
  burst(x, y, '#ff8a3a', 24); SFX.boom(); g.shake = 12; vib(80);
  let n = 0;
  for (const e of g.enemies) if (!e.dead && Math.hypot(e.x - x, e.y - y) < r) { slay(e); n++; }
  for (const pl of g.plats) if (!pl.broken && pl.type !== 'ground' && Math.hypot(pl.x - x, pl.y - y) < r * .8) { pl.broken = true; pl.vy = -100; }
  if (n >= 3) unlock('chain3');
  if (n >= 5) unlock('chain5');
}

// 連斬結束時依連斬數平方給額外分數
function settleCombo() {
  if (g.combo >= 2) {
    const b = 50 * g.combo * g.combo;
    addBonus(b);
    floatText(W / 2, 34, t('chain_bonus', g.combo, Math.round(b * (1 + .2 * pk('score')))), '#fff', 16, true);
  }
  g.combo = 0; g.comboT = 0; g.grace = false;
}
// 連斬時間：3.5 秒（連斬之心每級 +1.2）；落地寬限：0.8 秒（每級 +0.2）
const comboMax = () => 3.5 + 1.2 * pk('combo');
const comboGrace = () => .8 + .2 * pk('combo');

function startFever() {
  g.fever = 6;
  g.banner = { t: 1.4, a: t('chain_hud', g.combo), b: t('fever'), c: t('fever_desc') };
  SFX.fever(); vib([40, 30, 40]); if (++g.feverN >= 3) unlock('fever3');
  unlock('combo10');
}

// 衝刺斬：往滑動方向高速衝刺，撞到的敵人直接斬殺
function startDash(dx, dy, dur = DASH_T, minUp = .35) {
  const p = g.p;
  if (state !== 'play' || g.fly > 0 || p.dash > 0 || p.freeze > 0) return;
  if (g.ki < kiCost()) { floatText(p.x, p.y - 60, t('ki_low'), '#9ad8ff', 14); return; }
  g.ki -= kiCost(); if (g.tut) g.tut.dash = (g.tut.dash || 0) + 1;
  [dx, dy] = upDir(dx, dy, minUp);
  p.dash = dur; p.dvx = dx * DASH_V; p.dvy = dy * DASH_V; p.dive = false; p.banks = 0;
  if (Math.abs(dx) > .1) p.face = dx > 0 ? 1 : -1;
  p.inv = Math.max(p.inv, dur + .05);
  SFX.dash();
}
// 正規化方向，並確保至少有 minUp 的向上分量
function upDir(dx, dy, minUp) {
  let len = Math.hypot(dx, dy) || 1; dx /= len; dy /= len;
  if (dy > -minUp) { dy = -minUp; dx = Math.sign(dx || 1) * Math.sqrt(1 - minUp * minUp); }
  return [dx, dy];
}

// 彈射瞄準：依手指拉的方向算出發射方向、輔助吸附、含牆壁反射的軌跡，以及路線上會被斬到的敵人
function aimInfo() {
  const p = g.p;
  const px = inp.sx - inp.cx, py = inp.sy - inp.cy, len = Math.hypot(px, py);
  if (len < AIM_MIN) return null;
  if (py / len > .55) return { dive: true, pull: len };   // 往上拉＝瞄準下方＝急降斬
  let [dx, dy] = upDir(px, py, .2);
  const ox = p.x, oy = p.y - 20, R = DASH_V * DASH_T_AIM;
  // 輔助吸附：方向和某個敵人夾角小於約 11° 就直接對準它
  let lock = null, best = .2;
  for (const e of g.enemies) {
    if (e.dead) continue;
    const ex = e.x - ox, ey = e.y - oy, d = Math.hypot(ex, ey);
    if (d > R + 20 || d < 1 || ey / d > -.2) continue;
    const ang = Math.acos(clamp((ex * dx + ey * dy) / d, -1, 1));
    if (ang < best) { best = ang; lock = e; }
  }
  if (lock) { const ex = lock.x - ox, ey = lock.y - oy, d = Math.hypot(ex, ey); dx = ex / d; dy = ey / d; }
  // 模擬軌跡（每 6px 一步，碰牆反射）
  const pts = [[ox, oy]], hits = new Set();
  let x = ox, y = oy, vx = dx, rem = R;
  while (rem > 0) {
    const st = Math.min(6, rem); x += vx * st; y += dy * st; rem -= st;
    if (x < PL_MIN || x > PL_MAX) { x = clamp(x, PL_MIN, PL_MAX); vx = -vx; pts.push([x, y]); }
    for (const e of g.enemies) {
      if (e.dead || hits.has(e)) continue;
      const ed = ENEMY[e.type];
      if (Math.abs(x - e.x) < ed.w / 2 + 10 && Math.abs(y - e.y) < ed.h / 2 + 10) hits.add(e);
    }
  }
  pts.push([x, y]);
  return { dx, dy, pts, hits, lock, pull: len };
}

// 急降斬：高速往下劈，穿過途中的敵人，著地產生衝擊波
function startDive() {
  const p = g.p;
  if (state !== 'play' || g.fly > 0 || p.dive || p.freeze > 0) return;
  if (g.ki < kiCost()) { floatText(p.x, p.y - 60, t('ki_low'), '#9ad8ff', 14); return; }
  g.ki -= kiCost(); if (g.tut) g.tut.dive = 1;
  p.dash = 0; p.dive = true; p.vy = DIVE_V;
  SFX.dive();
}

function updateSlash(dt) {
  const s = g.slash;
  if (s.frozen) return;   // 預覽截圖用（cut.js 的 ?slashshot）
  s.t += dt; s.nextL -= dt;
  if (s.nextL <= 0 && s.t < s.dur - .08) {
    s.nextL = .09; s.n++;
    s.lines.push({ a: rnd(0, Math.PI), t: 0, off: rnd(-14, 14) });
    SFX.slash(); g.shake = 4;
  }
  for (const l of s.lines) l.t += dt;
  if (s.t >= s.dur) {
    g.p.vy = -JUMP; g.p.inv = Math.max(g.p.inv, .25);
    g.slash = null; state = 'play';
  }
}
function countKill() {
  g.kills++; save.stats.slashes++;
  if (pk('vamp')) { g.vampN++; if (g.vampN >= 6) { g.vampN = 0; heal(10); } }
}

// ===== 忍法 =====
// 卷軸按鈕施展的忍法：豪天翔＋打倒各關第 10 舞台魔王拿到的卷軸所解鎖的新忍法（出發前在選關畫面選一個）
// th＝需要哪一關的卷軸（THEMES 索引：林 0、風 1、火 2、山 3）
const JUTSU = [
  { id: 'soar', n: '豪天翔', th: -1, col: '#ffd25a' },
  { id: 'kongo', n: '金剛身', th: 0, col: '#ffd25a' },   // 林之卷軸（鐵甲鬼）：無敵、撞到就斬
  { id: 'yume', n: '夢幻術', th: 1, col: '#b88aff' },    // 風之卷軸（怠惰鬼）：畫面上的敵人睡著
  { id: 'sekka', n: '雪華封', th: 3, col: '#bfeaff' },   // 山之卷軸（雪女鬼）：冰封敵人與飛行道具
  { id: 'kishin', n: '鬼神斬', th: 2, col: '#ff6a4a' },  // 火之卷軸（真妖鬼）：巨大金棒清場
];
const MAKI_N = ['林之卷軸', '風之卷軸', '火之卷軸', '山之卷軸'];
const hasMaki = th => !!(save.maki && save.maki[th]);
const jutsuOK = j => j.th < 0 || hasMaki(j.th);
const curJutsu = () => { const j = JUTSU.find(x => x.id === save.jutsu); return j && jutsuOK(j) ? j : JUTSU[0]; };
function castScroll() {
  if (!g || state !== 'play' || paused || g.scrolls <= 0 || g.fly > 0) return;
  g.scrolls--; state = 'cast'; g.castT = CAST_T; g.castJ = curJutsu(); SFX.scroll(); vib(60);
  g.p.dash = 0; g.p.dive = false;
  if (!g.usedScroll) { g.usedScroll = true; unlock('scroll1'); }
  if (++g.scrollN >= 5) unlock('scroll5');
}
// 卷軸演出結束：發動忍法
function jutsuGo(j) {
  const p = g.p, on = e => !e.dead && e.y > g.camY - 40 && e.y < g.camY + H + 40;   // 畫面上的敵人
  state = 'play'; g.jfx = { col: j.col, t: 1 };
  if (j.id === 'kongo') { g.kongo = 4.5; p.inv = Math.max(p.inv, 4.6); p.vy = -JUMP * 1.15; SFX.clank(); }
  else if (j.id === 'yume') { for (const e of g.enemies) if (on(e)) e.sleep = 5; g.eshots = []; p.vy = -JUMP; p.inv = Math.max(p.inv, 1); SFX.scroll(); }
  else if (j.id === 'sekka') { for (const e of g.enemies) if (on(e)) e.frozen = 6; g.eshots = []; g.fires = []; p.vy = -JUMP; p.inv = Math.max(p.inv, 1); noise(.4, .06); tone(1800, .5, 'triangle', .04, -900); }
  else if (j.id === 'kishin') {
    g.kishinT = .7; g.shake = 16; SFX.boom(); vib([60, 40, 120]); p.vy = -JUMP * 1.1; p.inv = Math.max(p.inv, 1);
    // 只清雜兵：一般敵人斬殺；菁英只打掉一層、大天狗扣 3 血；魔王只累積 2 點破綻（不會直接暈眩）
    for (const e of [...g.enemies]) if (on(e)) {
      if (e.type === 13) { e.hp -= 3; e.flash = .3; e.tough = 1; floatText(e.x, e.y - 30, 'HP ' + Math.max(0, e.hp), '#e0b0ff', 14); if (e.hp <= 0) { e.hp = 1; slay(e); } }
      else if (e.hp > 1) { e.hp--; e.flash = .3; e.tough = 1; floatText(e.x, e.y - 30, t('one_more'), '#e0b0ff', 14); }
      else slay(e);
    }
    const b = g.boss; if (b && !b.stun) { b.st = Math.min(b.stN - 1, b.st + 2); b.flash = .3; b.hp = Math.max(1, b.hp - 1); floatText(b.x, b.y - 46, '-1', '#fff', 18); }
  } else { g.fly = 1.7 * (1 + .4 * pk('feather')); p.inv = Math.max(p.inv, g.fly + .6); }
}

// ===== BOSS =====
// 魔王戰：在平台上用衝刺斬／急降斬（或從上方踩下去）打魔王的身體，累積「破綻」後魔王會暈眩；
// 暈眩時碰到它進入「時機斬」（QTE）。魔王會輪流放有預兆的攻擊，放完會喘一下，那就是反擊的空檔。
// 從下方直接跳上去撞（沒有衝刺）會被擋開，所以要留「氣」來打它。
const BOSS_ATK = [['club', 'club', 'fan'], ['mist', 'mist', 'fan'], ['snow', 'snow', 'fan'], ['charge', 'charge', 'fan']];
// 每一關的魔王（以 THEMES 索引）：林＝鐵甲鬼、風＝怠惰鬼、火＝真妖鬼、山＝雪女鬼。
// 第 5 舞台是「初戰」（弱化版、招式較少，打完魔王會逃走），第 10 舞台是「決戰」（完整招式，打倒才破關）
const BOSS_OF = [3, 1, 0, 2];
function spawnBoss() {
  const fin = g.stage >= 5, kind = BOSS_OF[g.th], lv = g.lvl;
  // 選關畫面：遇過這一關的魔王之後，圖卡上才顯示它的彩圖（之前是剪影）
  if (!g.tut && !fin) { const ls = lvSave(); if (!ls.boss[g.lvl]) { ls.boss[g.lvl] = 1; persist(); } }
  const hp = fin ? 16 + 5 * lv : 8 + 3 * lv;
  g.bossT0 = g.t; wxBoss(kind);   // 魔王登場時換成魔王的天候（levels.js）
  g.boss = {
    n: lv * 2 + fin, lv, fin, kind, hp, max: hp, x: W / 2, y: g.camY - 60, t: 0, ai: 0, cool: 0, skillT: 9, crT: 2.6,
    shield: false, shT: 1.5, r: 30, warn: 0, flash: 0,
    st: 0, stN: fin && lv >= 2 ? 4 : 3, stun: 0,   // 破綻：打滿 stN 下就暈眩
    atk: null, atkT: 3, rest: 0, blockN: 0,
    warnT: fin ? Math.max(.6, .9 - .08 * lv) : 1, gapT: fin ? Math.max(1.6, 3 - .3 * lv) : 3.4,   // 預兆時間、出招間隔
  };
  const K = BOSS_KINDS[kind];
  g.banner = { t: 2.2, a: t(fin ? 'boss_in_fin' : 'boss_in_first'), b: t('boss_appear', L(K.n)), c: t('boss_desc', L(fin ? K.skill2 : K.skill)) };
  SFX.boss(); vib(200);
}
function updateBoss(dt) {
  const b = g.boss, p = g.p, fast = p.dash > 0 || p.dive || g.fly > 0;
  b.t += dt; b.cool = Math.max(0, b.cool - dt); b.flash = Math.max(0, b.flash - dt); b.rest = Math.max(0, b.rest - dt);
  const a = b.atk, charging = a && a.k === 'charge' && a.ph === 'act';
  // 移動：暈眩時往下掉到玩家附近；預兆時停住；攻擊後喘氣時降低、變慢
  if (b.stun > 0) {
    b.stun -= dt;
    b.y += (g.camY + H * .36 - b.y) * Math.min(1, dt * 3);
    if (b.stun <= 0) { b.stun = 0; b.atkT = 1.2; floatText(b.x, b.y - 50, t('boss_recover'), '#ccc', 18); }
  } else if (!charging) {
    const ty = g.camY + (b.rest > 0 ? 215 : 165) + Math.sin(b.t * 1.7) * 20;   // 比 HUD 低一點，衝刺搆得到
    b.y += (ty - b.y) * Math.min(1, dt * 2.5);
    if (!a || a.ph !== 'warn') b.ai += dt * (b.rest > 0 ? .4 : 1);
    const tx = W / 2 + Math.sin(b.ai * .9) * Math.min(120, W / 2 - WALL - 50);
    b.x += (tx - b.x) * Math.min(1, dt * 3);
  }
  // 常駐技能（只有決戰）：真妖鬼踩裂站台；鐵甲鬼的護盾開關（出招和喘氣時沒有護盾）
  if (b.stun <= 0 && b.kind === 0 && b.fin) {
    b.crT -= dt;
    if (b.crT <= 0) {
      b.crT = 2.6;
      const c = g.plats.filter(o => !o.broken && !o.crack && o.type !== 'ground' && o.y > g.camY + H * .3 && o.y < g.camY + H * .9);
      if (c.length) pick(c).crack = .7;
    }
  }
  if (b.kind === 3) {
    if (!b.fin || b.stun > 0 || a || b.rest > 0) b.shield = false;
    else { b.shT -= dt; if (b.shT <= 0) { b.shield = !b.shield; b.shT = b.shield ? 1.6 : 1.8; } }
  }
  // 出招
  if (b.stun <= 0 && !a && b.rest <= 0) { b.atkT -= dt; if (b.atkT <= 0) bossAttack(b); }
  if (b.atk && updateBossAtk(b, b.atk, dt)) return;
  // 接觸
  if (b.cool <= 0 && Math.abs(p.x - b.x) < b.r + 12 && Math.abs((p.y - 20) - b.y) < b.r + 18) {
    if (b.stun > 0) startQte();
    else if (charging && !fast) { b.cool = .6; p.vy = 320; p.x += p.x < b.x ? -30 : 30; if (hurt('boss')) return; }
    else if (b.shield || charging) {
      p.vy = 300; p.dash = 0; p.dive = false; p.x += (p.x < b.x ? -40 : 40); b.cool = .8; g.shake = 6; SFX.hit();
      floatText(b.x, b.y - 40, t('boss_repel'), '#ccc', 20);
    } else if (fast || p.vy > 0) bossHit(b);
    else {   // 從下方跳上去撞：被擋開，提示要用衝刺斬
      p.vy = 160; b.cool = .5; SFX.clank();
      floatText(b.x, b.y - 40, t(b.blockN++ < 3 ? 'boss_block' : 'boss_repel'), '#ccc', 15);
    }
  }
  // 魔王不會逃走：一定要打倒才能進入下一個舞台
}
// 打到魔王身體：小傷害＋累積破綻（不會直接打死，最後一擊一定是時機斬）
const SWING_T = .24;   // 揮擊動作的長度（秒）
function bossHit(b) {
  g.p.swing = SWING_T;
  const p = g.p, dv = p.dive, d = (dv ? 1.5 : 1) * (1 + .1 * mt('power'));
  b.hp = Math.max(1, b.hp - d); b.st += dv ? 2 : 1; b.cool = g.fly > 0 ? .8 : .45; b.flash = .15;
  g.fx.push({ x: b.x, y: b.y, a: rnd(0, 3.14), t: 0 }); burst(b.x, b.y, BOSS_KINDS[b.kind].col, 14);
  g.hitstop = .1; g.shake = 7; SFX.slash(); vib(40);
  floatText(b.x, b.y - 46, '-' + Math.round(d * 10) / 10, '#fff', 18);
  if (g.fly <= 0) { p.dash = 0; p.dive = false; p.vy = -JUMP; p.wallUsed = false; }
  p.inv = Math.max(p.inv, .3);
  g.ki = Math.min(kiMax(), g.ki + .5);
  if (b.st >= b.stN || b.hp <= 1) {   // 破綻：暈眩 3 秒，碰到它就能時機斬
    b.stun = 3; b.st = 0; b.atk = null; b.warn = 0; b.shield = false; b.rest = 0; b.skillT = 9;
    floatText(W / 2, 0, t('boss_stun'), '#ffd27a', 28, true); SFX.boom(); vib([40, 30, 80]);
  }
}
// 出招：先預兆（地上畫出危險範圍、魔王眼睛發光），時間到才判定
function bossAttack(b) {
  const p = g.p, fin = b.fin, k = pick(BOSS_ATK[b.kind]);
  const a = { k, ph: 'warn', t: b.warnT, hit: false };
  if (k === 'club') {   // 金棒落：幾道直線從天而降，其中一道對準玩家（初戰 2 道、決戰 3 道）
    a.w = 54; a.xs = [clamp(p.x, WALL + 30, W - WALL - 30)];
    const m = 1 + fin + (W > 500);
    for (let tries = 0; a.xs.length < m + 1 && tries < 40; tries++) { const x = rnd(WALL + 30, W - WALL - 30); if (a.xs.every(o => Math.abs(o - x) > 80)) a.xs.push(x); }
  } else if (k === 'mist') {   // 睡魔霧：在玩家身邊冒出紫霧（降速＋小傷害）
    a.r = 72; a.cs = [{ x: p.x, y: p.y - 20 }];
    if (fin) a.cs.push({ x: clamp(p.x + (p.x < W / 2 ? 1 : -1) * rnd(110, 160), WALL + 40, W - WALL - 40), y: p.y - 20 - rnd(40, 110) });
  } else if (k === 'snow') {   // 吹雪：掃過玩家所在的那半邊（冰凍），強化後兩邊輪流
    a.side = p.x < W / 2 ? -1 : 1; a.twice = fin;
  } else if (k === 'charge') {   // 突進：鎖定玩家的位置直線衝過去（決戰連衝兩次）
    a.tx = p.x; a.ty = p.y - 20; a.t += .1; a.twice = fin;
  } else a.t = .6;   // 扇形飛彈
  b.atk = a; b.warn = a.t;
  floatText(b.x, b.y + 48, t('batk_' + k), '#ffd27a', 16); SFX.warn();
}
// 回傳 true：玩家死了（這一幀不要再處理）
function updateBossAtk(b, a, dt) {
  const p = g.p;
  a.t -= dt; b.warn = a.ph === 'warn' ? Math.max(.01, a.t) : 0;
  if (b.kind === 0) b.skillT = a.ph === 'warn' && a.k === 'club' ? a.t : 9;   // 真妖鬼的狼牙棒高舉、砸下（art.js）
  if (a.ph === 'warn') {
    if (a.k === 'charge') b.x += rnd(-1.5, 1.5);
    if (a.t > 0) return false;
    a.ph = 'act';
    if (a.k === 'club') { a.t = .3; g.shake = 10; SFX.impact(); vib(60); for (const x of a.xs) burst(x, g.camY + H * .55, '#ffb090', 10); }
    else if (a.k === 'mist') { a.t = 1.3; SFX.wind(); }
    else if (a.k === 'snow') { a.t = .4; SFX.wind(); g.shake = 4; }
    else if (a.k === 'charge') { const dx = a.tx - b.x, dy = a.ty - b.y, d = Math.hypot(dx, dy) || 1; a.vx = dx / d * 680; a.vy = dy / d * 680; a.t = (d + 70) / 680; SFX.dash(); }
    else {
      const a0 = Math.atan2((p.y - 20) - b.y, p.x - b.x), m = b.fin ? 7 : 5;
      for (let i = 0; i < m; i++) { const an = a0 + (i - (m - 1) / 2) * .26; g.eshots.push({ x: b.x, y: b.y + 20, vx: Math.cos(an) * 175, vy: Math.sin(an) * 175, t: 0, skin: g.th }); }
      a.t = .1; SFX.throw();
    }
    return false;
  }
  // 判定（衝刺／急降斬中無敵，所以衝刺也能用來閃招）
  let hit = false;
  if (a.k === 'club') hit = a.xs.some(x => Math.abs(p.x - x) < a.w / 2 + 6);
  else if (a.k === 'mist') { if (a.cs.some(c => Math.hypot(p.x - c.x, p.y - 20 - c.y) < a.r)) { p.slow = Math.max(p.slow, 2.5); hit = true; } }
  else if (a.k === 'snow') { if (a.side < 0 ? p.x < W / 2 : p.x > W / 2) { if (p.inv <= 0) p.freeze = Math.max(p.freeze, 1); hit = true; } }
  else if (a.k === 'charge') { b.x = clamp(b.x + a.vx * dt, WALL + 30, W - WALL - 30); b.y += a.vy * dt; }
  if (hit && !a.hit) { a.hit = true; if (hurt(a.k === 'mist' ? 'mist' : 'boss')) return true; }
  if (a.t > 0) return false;
  if (a.k === 'snow' && a.twice) { a.twice = false; a.side = -a.side; a.ph = 'warn'; a.t = .55; a.hit = false; return false; }
  if (a.k === 'charge' && a.twice) { a.twice = false; a.tx = p.x; a.ty = p.y - 20; a.ph = 'warn'; a.t = .5; a.hit = false; return false; }   // 再鎖定一次
  b.atk = null; b.warn = 0; b.skillT = 9;
  b.rest = a.k === 'charge' ? 1.8 : .9; b.atkT = b.gapT;
  if (a.k === 'charge') floatText(b.x, b.y - 46, t('boss_tired'), '#9ae0ff', 16);
  return false;
}
// ===== 時機斬（QTE）：圓圈縮到白圈上時點擊，連續 3 次 =====
function startQte() {
  const b = g.boss, p = g.p;
  state = 'qte'; p.dash = 0; p.dive = false;
  g.qte = { t: 0, hits: [], n: 0, rings: [], log: [], i: 0, cnt: 3, perf: 0, next: .45, fl: 0, end: 0, kill: false,
    dur: b.fin ? Math.max(.62, .9 - .05 * b.lv) : 1, R0: 120, RT: 34,   // 初戰的圓圈縮得比較慢
    rip: [], sparks: [], shards: [], slow: 0, wf: 0 };   // 特效：點擊漣漪、火花、碎片、完美慢動作、閃白
  SFX.boom(); vib(80);
}
const qteR = r => g.qte.R0 * (1 - (g.qte.t - r.t0) / g.qte.dur);
const QTE_TICKS = [.3, .48, .6, .68];   // 外圈縮小時越來越密的「滴」（最後一聲之後就是完美時機）
function qteTap(x, y) {
  const q = g.qte; if (!q || q.end) return;
  const cur = q.rings.find(r => !r.res);
  q.rip.push({ x: x ?? (cur ? cur.x : W / 2), y: y ?? (cur ? cur.y : H * .42), t: 0 });   // 點擊的位置冒出漣漪
  if (!cur) return;
  const d = Math.abs(qteR(cur) - q.RT);
  qteRes(cur, d <= 8 ? 2 : d <= 18 ? 1 : 0);
}
function qteRes(r, lv) {
  const q = g.qte, b = g.boss, pw = 1 + .1 * mt('power');
  r.res = ['miss', 'good', 'perf'][lv]; r.rt = 0; r.endR = Math.max(10, qteR(r)); q.next = q.t + .28; q.log.push(r.res);
  const burst = (n, col, sp) => { for (let i = 0; i < n; i++) { const a = rnd(0, TAU), v = rnd(sp * .4, sp); q.sparks.push({ x: r.x + Math.cos(a) * q.RT, y: r.y + Math.sin(a) * q.RT, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: 0, life: rnd(.35, .6), c: col, s: rnd(2, 4) }); } };
  if (lv) {
    b.hp -= (lv === 2 ? 2.5 : 1.5) * pw;
    if (lv === 2 && ++q.perf === q.cnt) { b.hp -= 2 * pw; q.allP = 0; }   // 三連完美：追加傷害
    q.hits.push({ a: rnd(0, Math.PI), t: 0, x: r.x - W / 2, y: r.y - H * .42 }); q.n++;
    g.shake = lv === 2 ? 9 : 5; SFX.slash(); vib(lv === 2 ? 40 : 20);
    if (lv === 2) { q.slow = .08; q.wf = .12; burst(20, '#ffd25a', 420); tone(1760, .16, 'triangle', .05); tone(2640, .24, 'triangle', .03, 0, .05); }   // 完美：慢動作、閃白、金色碎光、清脆的鈴聲
    else burst(9, '#ffffff', 260);   // 良：白色小火花
  } else {   // 失誤：外圈碎裂、紅叉，魔王反擊
    for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; q.shards.push({ a, r: r.endR, x: r.x, y: r.y, v: rnd(120, 220), rot: 0, vr: rnd(-8, 8), t: 0 }); }
    noise(.25, .07); tone(320, .22, 'square', .04, -220);
    q.fl = .35; g.shake = 9; g.p.inv = 0;
    if (hurt(b.fin ? 'qte' : 'qte5')) return;
  }
  if (b.hp <= 0) { b.hp = 0; q.end = .45; q.kill = true; }
  else if (q.i >= q.cnt) q.end = .6;
}
function updateQte(dt) {
  const q = g.qte;
  // 特效（用真實時間）
  q.wf = Math.max(0, q.wf - dt);
  for (const o of q.rip) o.t += dt; q.rip = q.rip.filter(o => o.t < .4);
  for (const o of q.sparks) { o.t += dt; o.x += o.vx * dt; o.y += o.vy * dt; o.vx *= .9; o.vy = o.vy * .9 + 300 * dt; } q.sparks = q.sparks.filter(o => o.t < o.life);
  for (const o of q.shards) { o.t += dt; o.rot += o.vr * dt; } q.shards = q.shards.filter(o => o.t < .5);
  if (q.slow > 0) { q.slow -= dt; dt *= .25; }   // 完美：一瞬間的慢動作
  // 外圈縮小時的提示音
  { const cur = q.rings.find(r => !r.res); if (cur) { const u = (q.t - cur.t0) / q.dur; cur.tk = cur.tk || 0; if (cur.tk < QTE_TICKS.length && u >= QTE_TICKS[cur.tk]) { tone(1300 + cur.tk * 180, .04, 'square', .022); cur.tk++; } } }
  q.t += dt; q.fl = Math.max(0, q.fl - dt);
  if (q.allP != null) q.allP += dt;
  for (const h of q.hits) h.t += dt;
  q.hits = q.hits.filter(h => h.t < .35);
  for (const r of q.rings) if (r.res) r.rt += dt;
  q.rings = q.rings.filter(r => !r.res || r.rt < .6);
  if (q.end) { q.end -= dt; if (q.end <= 0) endQte(); return; }
  const cur = q.rings.find(r => !r.res);
  if (cur) { if (qteR(cur) < q.RT - 18) qteRes(cur, 0); return; }   // 縮過頭＝錯過
  if (q.i < q.cnt && q.t >= q.next) {
    const sx = Math.min(100, W / 2 - 70);
    q.rings.push({ x: W / 2 + rnd(-sx, sx), y: H * .42 + rnd(-60, 80), t0: q.t, res: null, rt: 0 }); q.i++; SFX.ring();
  }
}
function endQte() {
  const q = g.qte, b = g.boss;
  if (q.kill && !b.fin) { startFlee(); return; }   // 初戰：魔王被擊退、逃走
  if (q.kill) { state = 'kill'; g.killT = 1.5; g.killWord = pick(KILL_WORDS); SFX.kill(); vib([60, 40, 160]); return; }   // 決戰：先播連續斬擊特寫，再接居合一閃（四字詞在居合時出現）→ 封印成卷軸 → 任務達成
  state = 'play'; g.qte = null;
  b.stun = 0; b.cool = 1.2; b.atkT = 1.4; b.rest = 0;
  g.p.vy = -JUMP; g.p.inv = 1;
  floatText(W / 2, g.camY + H * .45, t('boss_flee'), '#ffd27a', 20);
}
// ===== 初戰擊退：魔王踉蹌冒煙 → 往上跳走（殘影）→ 字幕「逃走了…第 10 舞台再決勝負」 =====
// ===== 決戰擊倒：居合一閃（A）＋封印之卷（C） =====
// 0～0.7 夕陽剪影對峙 → 0.7 白閃一刀 → 0.9 收刀「喀」、魔王斜斷 → 1.5 符咒封印陣、墨氣被吸入 → 2.4 化為卷軸落入手中
// → 3.0 卷軸展開：卷軸名、「任務達成」、獲得的忍法 → 4.4 結算。點一下可跳到卷軸展開
const FIN_T = 4.4, MAKI_COIN = 100;
const MAKI_COL = { 3: ['#3a3d46', '#d9a441'], 1: ['#5a2a8a', '#d8dce8'], 2: ['#5aa8d8', '#ffffff'], 0: ['#b01e18', '#1a1010'] };   // 卷軸顏色（依魔王）：[軸身, 邊]
function startFin() {
  state = 'fin'; g.qte = null; g.finT = 0; g.finHoldT = 0;
  g.finInfo = { first: !hasMaki(g.th), th: g.th, kind: g.boss.kind, jutsu: JUTSU.find(j => j.th === g.th) };
  if (ac && musV()) { BGM.setVol(musV()); BGM.jingle(ac, 'finish'); }
}
function updateFin(dt) {
  const e0 = g.finT; g.finT += dt; const e1 = g.finT, at = x => e0 < x && e1 >= x;
  if (g.boss) g.boss.t += dt;
  if (at(.7)) { vib(80); g.shake = 0; }
  if (at(.95)) SFX.clank();
  if (at(2.4)) vib([30, 30, 60]);
  if (at(3.9)) { SFX.impact(); vib(40); }
  if (g.finT >= FIN_T) { g.finT = FIN_T; g.finHoldT = (g.finHoldT || 0) + dt; }   // 演出完成：停在卷軸畫面，等玩家點一下（見 pointerdown）
}
// 封印陣：外圈雙環＋九字環（臨兵闘者皆陣烈在前）＋反向旋轉的刻度環＋五芒星＋內圈「封」，依進度 L 依序浮現；k＝整段進度（最後放光）
function drawSeal(x, y, R, L, k, T) {
  const G = '255,214,90', ph = f => clamp((L - f[0]) / (f[1] - f[0]), 0, 1);   // 每一層的出現進度
  ctx.save(); ctx.translate(x, y);
  // 底光
  const bg = ctx.createRadialGradient(0, 0, R * .1, 0, 0, R * 1.35); bg.addColorStop(0, `rgba(${G},${.28 * L})`); bg.addColorStop(.7, `rgba(${G},${.08 * L})`); bg.addColorStop(1, `rgba(${G},0)`);
  ctx.fillStyle = bg; ctx.fillRect(-R * 1.4, -R * 1.4, R * 2.8, R * 2.8);
  ctx.globalCompositeOperation = 'lighter'; ctx.shadowColor = `rgb(${G})`; ctx.lineCap = 'round';
  const ring = (r, w, p, a = 1) => { if (p <= 0) return; ctx.strokeStyle = `rgba(${G},${a})`; ctx.lineWidth = w; ctx.shadowBlur = 10; ctx.beginPath(); ctx.arc(0, 0, r, -Math.PI / 2, -Math.PI / 2 + TAU * p); ctx.stroke(); };
  // ① 外圈雙環
  const p1 = ph([0, .3]); ring(R, 3, p1); ring(R * .93, 1.5, p1, .8);
  // ② 九字環：在兩圈之間繞著轉
  const p2 = ph([.15, .55]), rot = T * .35;
  if (p2 > 0) {
    const W9 = [...'臨兵闘者皆陣烈在前'];
    ctx.font = `${Math.round(R * .14)}px ${BRUSH}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.shadowBlur = 8;
    W9.forEach((ch, i) => {
      const a = rot + i / W9.length * TAU, v = clamp(p2 * W9.length - i, 0, 1); if (v <= 0) return;
      ctx.save(); ctx.rotate(a); ctx.translate(0, -R * .865); ctx.globalCompositeOperation = 'source-over';   // 字用一般疊色，才不會被光暈吃掉
      ctx.fillStyle = `rgba(255,244,205,${v})`; ctx.fillText(ch, 0, 0); ctx.restore();
      ctx.save(); ctx.rotate(a + TAU / W9.length / 2); ctx.fillStyle = `rgba(${G},${v * .9})`; ctx.beginPath(); ctx.moveTo(0, -R * .89); ctx.lineTo(3, -R * .865); ctx.lineTo(0, -R * .84); ctx.lineTo(-3, -R * .865); ctx.closePath(); ctx.fill(); ctx.restore();   // 字與字之間的菱形
    });
  }
  // ③ 刻度環（反向旋轉）
  const p3 = ph([.3, .6]);
  if (p3 > 0) {
    ring(R * .79, 1.2, p3, .9);
    ctx.save(); ctx.rotate(-T * .6); ctx.strokeStyle = `rgba(${G},${.85 * p3})`; ctx.shadowBlur = 4;
    for (let i = 0; i < 48; i++) { const a = i / 48 * TAU, l = i % 4 ? 5 : 10; ctx.lineWidth = i % 4 ? 1 : 2; ctx.beginPath(); ctx.moveTo(Math.cos(a) * R * .79, Math.sin(a) * R * .79); ctx.lineTo(Math.cos(a) * (R * .79 - l), Math.sin(a) * (R * .79 - l)); ctx.stroke(); }
    ctx.restore();
  }
  // ④ 五芒星＋外接圓（跟著九字環慢慢轉），頂點有光珠
  const p4 = ph([.45, .8]);
  if (p4 > 0) {
    const r5 = R * .66; ring(r5, 2, p4, .9);
    ctx.save(); ctx.rotate(rot * .6); ctx.strokeStyle = `rgba(${G},.95)`; ctx.lineWidth = 2.4; ctx.shadowBlur = 12;
    const pts = [0, 2, 4, 1, 3, 0].map(i => [Math.cos(-Math.PI / 2 + i * TAU / 5) * r5, Math.sin(-Math.PI / 2 + i * TAU / 5) * r5]);
    ctx.beginPath(); let len = 0; const seg = 5 * p4;
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) { const f = clamp(seg - (i - 1), 0, 1); if (f <= 0) break; ctx.lineTo(pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * f, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * f); len++; }
    ctx.stroke();
    for (let i = 0; i < 5; i++) if (seg > i) { const a = -Math.PI / 2 + i * TAU / 5, px = Math.cos(a) * r5, py = Math.sin(a) * r5; ctx.fillStyle = 'rgba(255,248,210,.95)'; ctx.beginPath(); ctx.arc(px, py, 3.5 + Math.sin(T * 8 + i) * 1, 0, TAU); ctx.fill(); }
    ctx.restore();
  }
  // ⑤ 內圈＋「封」
  const p5 = ph([.7, 1]);
  if (p5 > 0) {
    ring(R * .3, 2, p5); ring(R * .25, 1, p5, .7);
  }
  // 最後：光柱般的放射光
  if (k > .78) {
    const f = (k - .78) / .22; ctx.shadowBlur = 0;
    for (let i = 0; i < 12; i++) { const a = i / 12 * TAU + T * .5, gl = ctx.createLinearGradient(0, 0, Math.cos(a) * R * 1.6, Math.sin(a) * R * 1.6); gl.addColorStop(0, `rgba(255,240,190,${.5 * f})`); gl.addColorStop(1, 'rgba(255,240,190,0)');
      ctx.strokeStyle = gl; ctx.lineWidth = 6 + (i % 3) * 4; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * R * 1.6, Math.sin(a) * R * 1.6); ctx.stroke(); }
  }
  // 往上飄的金色光點
  ctx.shadowBlur = 6;
  for (let i = 0; i < 26; i++) { const u = (T * .5 + i * .137) % 1, a = i * 2.39, r = R * (.2 + (i * .31) % .9); ctx.fillStyle = `rgba(255,230,150,${(1 - u) * L * .9})`; ctx.beginPath(); ctx.arc(Math.cos(a) * r, Math.sin(a) * r * .9 - u * 40, 1.6 + (i % 3) * .6, 0, TAU); ctx.fill(); }
  // 中央的「封」：深紅描邊＋金字，蓋在所有光的上面
  const p5b = ph([.7, 1]);
  if (p5b > 0) {
    ctx.globalCompositeOperation = 'source-over'; ctx.shadowBlur = 14; ctx.shadowColor = 'rgba(255,214,90,.9)';
    const s = 1 + .6 * (1 - easeO(p5b)); ctx.scale(s, s);
    ctx.font = `${Math.round(R * .34)}px ${BRUSH}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.globalAlpha = p5b;
    ctx.lineWidth = 5; ctx.strokeStyle = '#6a120c'; ctx.strokeText('封', 0, 2); ctx.fillStyle = '#ffe9a0'; ctx.fillText('封', 0, 2);
  }
  ctx.restore();
}
function drawFin() {
  const e = g.finT, b = g.boss, fi = g.finInfo || {}, cx = W / 2, T = performance.now() / 1000;
  const bossSil = (x, y, s, col) => drawSil(x, y, 150 * s, 150 * s, 75 * s, 80 * s, col, c2 => drawBoss(b, 0, 0, s, c2));
  const njSil = (x, y, s, col, o = {}) => drawSil(x, y, 100 * s, 110 * s, 50 * s, 95 * s, col, c2 => { c2.scale(s, s); drawHeroNinja(0, 0, Object.assign({ face: -1, t: 1, vy: 0, skin: save.skin }, o), c2); });
  const sunset = () => {
    const gr = ctx.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#1a0406'); gr.addColorStop(.6, '#5a1210'); gr.addColorStop(1, '#2a0606'); ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
    const sg = ctx.createRadialGradient(cx, H * .42, 10, cx, H * .42, 150); sg.addColorStop(0, '#ffd67a'); sg.addColorStop(.55, '#e5342a'); sg.addColorStop(1, 'rgba(229,52,42,0)'); ctx.fillStyle = sg; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#120406'; ctx.fillRect(0, H * .66, W, H * .34);
    for (let i = 0; i < 4; i++) { ctx.fillStyle = `rgba(255,190,140,${.06})`; ctx.fillRect(0, H * (.2 + i * .07), W, 3); }   // 雲的細線
  };
  if (e < .7) {   // ① 對峙
    sunset(); bossSil(W * .7, H * .66 - 52, 1.45, '#0a0608'); njSil(W * .2, H * .66, 1.5, '#0a0608', { face: 1 });
    ctx.fillStyle = 'rgba(255,220,180,.5)'; for (let i = 0; i < 6; i++) { const lx = (T * 260 + i * 97) % (W + 60) - 30; ctx.fillRect(lx, H * (.3 + i * .08), 22, 1.5); }   // 風
  } else if (e < .9) {   // ② 一閃
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#0e1414'; ctx.fillRect(0, H * .55 - 4, W, 8);
    bossSil(W * .5, H * .66 - 52, 1.45, '#0a0608'); njSil(W * .86, H * .66, 1.5, '#0a0608', { face: -1, pose: 'dash' });
  } else if (e < 1.5) {   // ③ 收刀・斷
    sunset();
    const d = easeO(clamp((e - .9) / .6, 0, 1)) * 22, bx = W * .5, by = H * .66 - 52;
    for (const sd of [-1, 1]) {   // 沿斜線切成兩半，往兩邊滑開
      ctx.save(); ctx.translate(sd * d * .6, sd * d); ctx.beginPath();
      if (sd < 0) { ctx.moveTo(0, 0); ctx.lineTo(W, 0); ctx.lineTo(W, by - 60); ctx.lineTo(0, by + 60); }
      else { ctx.moveTo(0, by + 60); ctx.lineTo(W, by - 60); ctx.lineTo(W, H); ctx.lineTo(0, H); }
      ctx.closePath(); ctx.clip(); bossSil(bx, by, 1.45, '#0a0608'); ctx.restore();
    }
    ctx.globalAlpha = Math.max(0, 1 - (e - .9) * 3); ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, by + 60); ctx.lineTo(W, by - 60); ctx.stroke(); ctx.globalAlpha = 1;
    njSil(W * .86, H * .66, 1.5, '#0a0608', { face: -1 });
    if (e < 1.25) txt('喀', W * .86 - 26, H * .66 - 90, 26, '#ffe28a', 'center', '#000', 4);
    // 居合一閃的四字詞（每次隨機）：左側直書、一字一字蓋上來
    if (g.killWord) {
      const cs = Math.min(58, H * .085); ctx.font = `${cs}px ${BRUSH}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      [...g.killWord].forEach((ch, i) => {
        const p = clamp((e - .92 - i * .06) / .08, 0, 1); if (p <= 0) return;
        const s = 1 + (1 - easeO(p)) * .8, x = W * .16, y = H * .14 + i * cs * 1.08;
        ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.globalAlpha = p;
        ctx.lineWidth = 6; ctx.strokeStyle = '#7a120c'; ctx.strokeText(ch, 0, 0); ctx.fillStyle = '#fff6e0'; ctx.fillText(ch, 0, 0); ctx.restore();
      });
    }
  } else if (e < 2.4) {   // ④ 封印
    ctx.fillStyle = '#120c1c'; ctx.fillRect(0, 0, W, H);
    const k = (e - 1.5) / .9, ccx = cx, ccy = H * .44, S = Math.min(W * .32, 120);
    const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
    // 墨氣（魔王）被吸進陣中、越縮越小
    ctx.save(); ctx.translate(ccx, ccy); ctx.rotate(k * 3); ctx.globalAlpha = .85 - k * .5;
    drawSil(0, 0, 150 * 1.6, 150 * 1.6, 75 * 1.6, 80 * 1.6, '#3a2a4a', c2 => drawBoss(b, 0, 0, 1.6 * (1 - k * .85), c2)); ctx.restore(); ctx.globalAlpha = 1;
    for (let i = 0; i < 16; i++) { const a = i / 16 * TAU + T * 3, r = S * 1.3 * (1 - ((T * .9 + i * .13) % 1)); ctx.fillStyle = 'rgba(80,50,110,.8)'; aCirc(ctx, ccx + Math.cos(a) * r, ccy + Math.sin(a) * r, 4); ctx.fill(); }
    // 金色封印陣（先畫，符咒蓋在上面）
    const L = clamp((k - .3) / .5, 0, 1);
    if (L > 0) drawSeal(ccx, ccy, S * 1.25, L, k, T);
    // 符咒從主角手中飛到陣的四個斜角
    const fly = easeO(clamp(k / .3, 0, 1)), FR = S * 1.25 * 1.12;
    corners.forEach(([sx, sy]) => {
      const tx = ccx + sx * FR * .7071, ty = ccy + sy * FR * .7071, x = cx + (tx - cx) * fly, y = H * .86 - 40 + (ty - (H * .86 - 40)) * fly;
      if (fly >= 1) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const gl = ctx.createRadialGradient(x, y, 2, x, y, 28); gl.addColorStop(0, 'rgba(255,214,90,.7)'); gl.addColorStop(1, 'rgba(255,214,90,0)'); ctx.fillStyle = gl; ctx.fillRect(x - 30, y - 30, 60, 60); ctx.restore(); }
      ctx.save(); ctx.translate(x, y); ctx.rotate(sx * .15 + Math.sin(T * 6 + sx) * .05); ctx.fillStyle = '#f4e8c0'; ctx.fillRect(-9, -16, 18, 32); ctx.strokeStyle = '#c0262d'; ctx.lineWidth = 2; ctx.strokeRect(-9, -16, 18, 32);
      ctx.beginPath(); ctx.moveTo(-4, -9); ctx.lineTo(4, -9); ctx.moveTo(0, -9); ctx.lineTo(0, 10); ctx.moveTo(-5, 2); ctx.lineTo(5, 2); ctx.stroke(); ctx.restore();
    });
    drawNinja(cx, H * .86, { face: 1, t: T, vy: 0, skin: save.skin, pose: 'apex' });
  } else {   // ⑤ 化為卷軸 → ⑥ 展開
    const [rc, ec] = MAKI_COL[fi.kind] || MAKI_COL[3];
    const sr = clamp((e - 3.0) / 1.4, 0, 1);
    const gr = ctx.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, sr > 0 ? '#3a2a40' : '#120c1c'); gr.addColorStop(1, sr > 0 ? '#c86a3a' : '#2a1c3a'); ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
    if (sr > 0) { const sg = ctx.createRadialGradient(cx, H * 1.05, 10, cx, H * 1.05, H * .6); sg.addColorStop(0, `rgba(255,200,110,${.8 * sr})`); sg.addColorStop(1, 'rgba(255,200,110,0)'); ctx.fillStyle = sg; ctx.fillRect(0, 0, W, H); }   // 日出
    if (e < 3.0) {   // 捲起來的卷軸落進手中
      const k = (e - 2.4) / .6, y = H * .44 + (H * .7 - H * .44) * easeO(k);
      if (k < .25) { ctx.fillStyle = `rgba(255,255,255,${1 - k * 4})`; ctx.fillRect(0, 0, W, H); }
      const glow = ctx.createRadialGradient(cx, y, 4, cx, y, 70); glow.addColorStop(0, 'rgba(255,214,90,.6)'); glow.addColorStop(1, 'rgba(255,214,90,0)'); ctx.fillStyle = glow; ctx.fillRect(cx - 80, y - 80, 160, 160);
      ctx.fillStyle = rc; ctx.fillRect(cx - 14, y - 34, 28, 68); ctx.strokeStyle = ec; ctx.lineWidth = 2.5; ctx.strokeRect(cx - 14, y - 34, 28, 68);
      ctx.fillStyle = ec; ctx.fillRect(cx - 18, y - 38, 36, 7); ctx.fillRect(cx - 18, y + 31, 36, 7);
      drawNinja(cx, H * .86, { face: 1, t: T, vy: 0, skin: save.skin, pose: 'apex' });
    } else {   // 卷軸展開
      const SW = Math.min(W - 30, 340), SH = 230, w = 30 + (SW - 30) * easeO(clamp((e - 3.0) / .3, 0, 1)), y = H * .42;
      ctx.save(); ctx.translate(cx, y);
      ctx.fillStyle = '#efe3c2'; ctx.fillRect(-w / 2, -SH / 2, w, SH);
      ctx.strokeStyle = '#c9b07a'; ctx.lineWidth = 2; ctx.strokeRect(-w / 2 + 8, -SH / 2 + 8, w - 16, SH - 16);
      ctx.save(); ctx.beginPath(); ctx.rect(-w / 2, -SH / 2, w, SH); ctx.clip();
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      if (e > 3.2) { ctx.globalAlpha = Math.min(1, (e - 3.2) * 5); ctx.fillStyle = '#6b4a22'; ctx.font = `26px ${BRUSH}`; ctx.fillText(t('maki_' + fi.th), 0, -SH / 2 + 34); ctx.globalAlpha = 1; }
      const word = [...'任務達成'], cs = Math.min(70, (SW - 50) / 4);
      ctx.font = `${cs}px ${BRUSH}`;
      word.forEach((ch, i) => {
        const p = clamp((e - 3.3 - i * .11) / .1, 0, 1); if (p <= 0) return;
        const x = (i - 1.5) * cs * .98;
        ctx.save(); ctx.beginPath(); ctx.rect(x - cs * .7, -cs * .7 + 4, cs * 1.4, cs * 1.4 * p); ctx.clip();
        ctx.translate(x, 4 + [3, -3, 4, -2][i]); ctx.rotate([-.04, .03, -.02, .04][i]); ctx.shadowColor = 'rgba(26,16,16,.35)'; ctx.shadowBlur = 3;
        ctx.fillStyle = '#140c0c'; ctx.fillText(ch, 0, 0); ctx.restore();
      });
      if (e > 3.8) {
        ctx.globalAlpha = Math.min(1, (e - 3.8) * 5); ctx.font = `700 16px ${FONT}`; ctx.fillStyle = '#6b4a22';
        ctx.fillText(fi.first && fi.jutsu ? t('fin_new', t('ju_' + fi.jutsu.id)) : t('fin_have', MAKI_COIN), 0, SH / 2 - 34); ctx.globalAlpha = 1;
      }
      if (e >= 3.9) {   // 紅印
        const s = 1 + 1.5 * (1 - easeO(clamp((e - 3.9) / .08, 0, 1)));
        ctx.save(); ctx.translate(SW / 2 - 40, SH / 2 - 52); ctx.rotate(.12); ctx.scale(s, s); ctx.fillStyle = '#c0262d';
        ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(-16, -16, 32, 32, 4); else ctx.rect(-16, -16, 32, 32); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = `22px ${BRUSH}`; ctx.fillText('忍', 0, 2); ctx.restore();
      }
      ctx.restore();
      for (const sx of [-1, 1]) {   // 兩端的軸（魔王的顏色）
        const rx = sx * w / 2; ctx.fillStyle = rc; ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(rx - 7, -SH / 2 - 10, 14, SH + 20, 7); else ctx.rect(rx - 7, -SH / 2 - 10, 14, SH + 20); ctx.fill();
        ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.stroke(); ctx.fillStyle = ec; ctx.fillRect(rx - 8, -SH / 2 - 13, 16, 6); ctx.fillRect(rx - 8, SH / 2 + 7, 16, 6);
      }
      ctx.restore();
      drawNinja(cx, H * .9, { face: 1, t: T, vy: 0, skin: save.skin });
      // 演出完成：停在這裡，提示點一下繼續（一閃一閃）
      if (e >= FIN_T && (g.finHoldT || 0) > .3) { ctx.globalAlpha = .55 + .45 * Math.sin(T * 5); txt(t('tap_next'), cx, H * .42 + 150, 16, '#fff', 'center', '#000', 4); ctx.globalAlpha = 1; }
    }
  }
}
const FLEE_T = 2.2;
function startFlee() {
  const b = g.boss;
  state = 'flee'; g.qte = null; g.fleeT = 0;
  b.stun = 0; b.atk = null; b.warn = 0; b.shield = false; b.fy = b.y; b.vy = 0; b.trail = [];
  b.y = Math.min(b.y, g.camY + H * .38);
  SFX.boom(); vib([60, 40, 120]); g.shake = 10;
}
function updateFlee(dt) {
  const b = g.boss; g.fleeT += dt; b.t += dt;
  const k = g.fleeT;
  if (k < .7) { b.x += Math.sin(k * 60) * 1.5; if (Math.random() < .5) g.parts.push({ x: b.x + rnd(-26, 26), y: b.y + rnd(-20, 20), vx: rnd(-30, 30), vy: rnd(-90, -40), life: .7, max: .7, c: 'rgba(80,80,90,.7)', s: rnd(4, 8) }); }
  else {
    if (!b.jump) { b.jump = 1; b.vy = -260; SFX.dash(); for (let i = 0; i < 14; i++) g.parts.push({ x: b.x + rnd(-30, 30), y: b.y + 20, vx: rnd(-120, 120), vy: rnd(-40, 60), life: .6, max: .6, c: '#ddd', s: rnd(4, 9) }); }
    b.vy -= 1500 * dt; b.y += b.vy * dt;
    b.trail.push({ x: b.x, y: b.y }); if (b.trail.length > 6) b.trail.shift();
  }
  if (k >= FLEE_T) finishBoss(true);
}
function drawFlee() {
  const b = g.boss, k = g.fleeT;
  const s = Math.min(1, k * 4);
  txt(t('flee_big'), W / 2, H * .3, 54 * (1.5 - .5 * s) * (LI === 2 ? .7 : 1), '#fff', 'center', '#c0262d', 8);
  if (k > .8) { ctx.globalAlpha = Math.min(1, (k - .8) * 3); txt(t('boss_fled', L(BOSS_KINDS[b.kind].n)), W / 2, H * .3 + 46, 15, '#ffd27a', 'center', '#000', 4); ctx.globalAlpha = 1; }
}
function finishBoss(killed) {
  const b = g.boss;
  g.boss = null; g.qte = null;
  if (killed && !b.fin) {   // 初戰：擊退（獎勵較少，仍然開寶箱）
    const pts = 2000 + 1000 * b.lv;
    addBonus(pts); addCoins(15 + 5 * b.lv);
    floatText(W / 2, g.camY + H * .4, t('boss_repelled', Math.round(pts * (1 + .2 * pk('score')))), '#ffd27a', 24);
    for (let i = 0; i < 8; i++) g.drops.push({ k: i < 5 ? 'soul' : 'coin', x: W / 2 + rnd(-40, 40), y: g.camY + H * .3, vx: rnd(-90, 90), vy: -rnd(120, 260), v: i < 5 ? 3 : 2, ph: rnd(0, 6) });
    save.stats.bosses++; unlock('boss1');   // 擊退也算進累計（「討伐・〇〇」只在決戰擊破時才算）
    if (save.stats.bosses >= 10) unlock('boss10');
    if (save.stats.bosses >= 30) unlock('boss30');
    if (g.t - g.bossT0 <= 20) unlock('bossfast');
    if (g.hp < g.maxHp * .2) unlock('lowhp');
  } else if (killed) {
    const pts = 5000 + 3000 * b.lv;
    addBonus(pts); addCoins(30 + 15 * b.lv);
    floatText(W / 2, g.camY + H * .4, t('boss_down', Math.round(pts * (1 + .2 * pk('score')))), '#ffd27a', 24);
    burst(b.x, b.y, BOSS_KINDS[b.kind].col, 40);
    for (let i = 0; i < 12; i++) g.drops.push({ k: i < 8 ? 'soul' : 'coin', x: b.x + rnd(-30, 30), y: b.y, vx: rnd(-90, 90), vy: -rnd(120, 260), v: i < 8 ? 3 : 2, ph: rnd(0, 6) });
    save.stats.bosses++; unlock('boss1'); unlock('bk' + b.kind);
    if (save.stats.bosses >= 10) unlock('boss10');
    if (save.stats.bosses >= 30) unlock('boss30');
    if (g.t - g.bossT0 <= 20) unlock('bossfast');
    if (g.hp < g.maxHp * .2) unlock('lowhp');
  }
  g.p.vy = -JUMP * 1.15; g.p.inv = 1.2; g.p.slow = 0; g.p.freeze = 0;
  g.bossN++;
  stageDone();
  g.stage++; g.spikeUsed = false; g.base = g.top;
  g.midDone = false; if (g.mid) { g.mid.dead = true; g.mid = null; }
  g.mod = pick(MODS); g.wind = 0; g.windT = 0;
  g.pendingPerk = killed;
  if (killed) stageCoins();
  if (killed && g.lvl === 0 && !hasFull() && !save.fullSeen) g.promoPending = true;   // 第一次在林關擊倒魔王：下一個舞台開始時介紹完整版
  // 第 10 舞台的魔王倒下：破台
  if (g.stage >= ST_N) {
    g.stage = ST_N - 1; g.cleared = true;
    const s = lvSave(); s.clear[g.lvl] = 1; s.best[g.lvl] = ST_N; persist();
    unlock('lv' + g.lvl + 'c');
    if (s.clear.every(x => x)) unlock('clear');
    if (!g.scrollN) unlock('noscroll');
    // 這一關的卷軸：第一次取得解鎖新忍法；已經有了就改給小判
    const fi = g.finInfo || { first: !hasMaki(g.th) };
    if (fi.first) { save.maki[g.th] = 1; g.makiGot = g.th; } else addCoins(MAKI_COIN);
    persist();
    showOver();   // 擊倒演出最後已經寫了「任務達成」，直接進結算（標題也是任務達成）
    return;
  }
  g.todF = null; wxForStage(); lvReach(); stageAch();
  afterBoss();
}
// 一般舞台爬滿：不停下來，背景時段慢慢換色、天候跟著變
function nextStage() {
  stageDone();
  g.todF = { from: g.stage % 5, q: 0 };
  g.stage++; g.base = g.top; g.midDone = false;
  wxForStage(); lvReach(); stageAch();
  stageBanner(); SFX.item();
}
// 突破一個舞台時的成就檢查（天候、無傷）
// 過舞台獎勵：舞台數 × 15 小判（前期收入比較不會太少）
function stageCoins() { const n = (g.stage + 1) * 15; addCoins(n); }   // 過舞台小判照給，不再飄字
function stageDone() {
  stageCoins();
  if (g.wx && g.wx.cur > .3) unlock('wx_' + g.wx.k);
  if (!g.stHit && g.stage >= 2) unlock('nohit');   // 第 3 舞台起才算
  g.stHit = false;
}
function stageAch() {
  if (g.stage >= ST_UNLOCK) unlock('lv' + g.lvl + 'r5');
  if (g.stage >= 5) unlock('loop2');
  if (g.stage % 5 === 2) unlock('night');
  if (lvSave().open >= LEVELS.length) unlock('lvopen');
}
function afterBoss() {
  g.ascendPending = true;   // 選完寶箱的秘傳後，接「飛昇過雲海」換幕（stagefx.js）
  if (g.pendingPerk) { openPerks('boss'); return; }
  startAscend();
}

// ===== 秘傳（Roguelike 強化） =====
// 升級／開局／寶箱的三選一：自動技能（未滿級、或還有空欄的新技能）＋被動強化
let perkChoices = [], perkWhy = '';
function pickPool(why) {
  const owned = Object.keys(g.skills).length, out = [];
  // 寶箱（魔王／中 BOSS）：條件達成的進化一定排在最前面
  if (why === 'boss' || why === 'chest') for (const s of SKILLS) if (sk(s.id) === SK_MAX && pk(EVO[s.id].p) > 0) out.push({ kind: 'evo', o: s, w: 1e6 });
  for (const s of SKILLS) {
    const l = sk(s.id);
    if (why === 'start' && s.cat !== 0) continue;          // 開局只給攻擊技能
    if (l >= SK_MAX || (!l && owned >= SK_SLOTS)) continue;
    if (s.own && !l) continue;   // 角色專屬技能：只有自帶的角色會抽到
    if (g.banned['skill' + s.id]) continue;   // 被封印的選項不再出現
    out.push({ kind: 'skill', o: s, w: l ? 4 : 2.5 });   // 技能比被動更常出現
  }
  if (why !== 'start') for (const p of PERKS) if (pk(p.id) < p.max && !g.banned['perk' + p.id]) out.push({ kind: 'perk', o: p, w: 1 });
  return out;
}
function skillDesc(id, l) {
  if (l > SK_MAX) return L(EVO[id].d);
  const v = SKV[id](l), f = x => +x.toFixed(1);
  switch (id) {
    case 'shuriken': return t('sk_shuriken', f(v.cd), v.n);
    case 'kunai': return t('sk_kunai', v.n);
    case 'thunder': return t('sk_thunder', f(v.cd), v.n);
    case 'wind': return t('sk_wind', (v.bounce ? t('wind_bounce') : '') + (v.diag ? t('wind_diag') : ''));
    case 'barrier': return t('sk_barrier', f(v.cd), v.max);
    case 'aura': return t('sk_aura', v.r, f(v.cd), t(v.all ? 'aura_all' : 'aura_weak'));
    case 'shiki': return t('sk_shiki', v.r, v.atk ? t('shiki_atk', f(v.atk)) : '');
    case 'swift': return t('sk_swift', f(v.regen), v.ki ? t('swift_ki', v.ki) : '');
    default: return charSkillDesc(id, v, f);   // 角色專屬技能（chars.js）
  }
}
function openPerks(why) {
  perkWhy = why;
  state = 'perk';
  const pool = pickPool(why);
  perkChoices = [];
  while (perkChoices.length < 3 && pool.length) {
    let r = Math.random() * pool.reduce((s, c) => s + c.w, 0), i = 0;
    for (; i < pool.length - 1; i++) { r -= pool[i].w; if (r <= 0) break; }
    perkChoices.push(pool.splice(i, 1)[0]);
  }
  $('perkTitle').textContent = t({ start: 'perk_start', boss: 'perk_boss', chest: 'perk_chest' }[why] || 'lvup');
  let h = perkChoices.map((c, i) => {
    const o = c.o;
    if (c.kind === 'evo') {
      const ev = EVO[o.id];
      return `<div class="card evo k4" data-act="perk" data-arg="${i}"><span class="ic">${ev.ic}</span><span><em class="cat c4">${L(STR.cat)[4]}</em><b>${L(ev.n)}</b><small>${L(ev.d)}</small></span><span class="lv">EVO</span></div>`;
    }
    const isS = c.kind === 'skill', cur = isS ? sk(o.id) : pk(o.id), cat = isS ? o.cat : 3;
    const desc = isS ? skillDesc(o.id, cur + 1) : L(o.d);
    // 技能卡顯示進化條件，讓玩家知道要搭配哪個被動
    const hint = isS ? `<small class="evo-hint">${t('evo_hint', L(PERKS.find(x => x.id === EVO[o.id].p).n), L(EVO[o.id].n))}</small>` : '';
    return `<div class="card k${cat}" data-act="perk" data-arg="${i}"><span class="ic">${o.ic}</span><span><em class="cat c${cat}">${L(STR.cat)[cat]}</em><b>${L(o.n)}</b><small>${desc}</small>${hint}</span><span class="lv">${cur ? 'Lv' + (cur + 1) : 'NEW'}</span></div>`;
  }).join('');
  if (!perkChoices.length) h = `<button data-act="perk" data-arg="-1">${t('perk_none')}</button>`;
  else {
    if (g.rerolls > 0) h += `<button data-act="reroll">${t('reroll', g.rerolls)}</button>`;
    if (g.banishes > 0) h += `<button data-act="banish" class="banish-btn">🈲 ${t('banish', g.banishes)}</button>`;
  }
  g.banishMode = false; $('perkCards').classList.remove('banishing');
  $('perkCards').innerHTML = h;
  show('perk', true);
}
function choosePerk(i) {
  const c = perkChoices[i];
  if (g.banishMode && c && c.kind !== 'evo') {   // 修行「封印」：這個選項本局不再出現，重新抽
    g.banned[c.kind + c.o.id] = 1; g.banishes--; g.banishMode = false; SFX.clank(); openPerks(perkWhy); return;
  }
  if (!c) { heal(30); addCoins(20); }
  else if (c.kind === 'evo') {
    g.skills[c.o.id] = SK_MAX + 1;
    if (c.o.id === 'barrier') g.barrier = SKV.barrier(6).max;
    floatText(W / 2, 64, t('evo_get', L(EVO[c.o.id].n)), '#ffd27a', 24, true);
    SFX.fever(); unlock('evo1'); unlock('evo_' + c.o.id);
  } else if (c.kind === 'skill') {
    g.skills[c.o.id] = sk(c.o.id) + 1;
    if (c.o.id === 'barrier' && g.skills.barrier === 1) g.barrier = 1;   // 剛學會就先有一層
  } else {
    const p = c.o;
    g.perks[p.id] = pk(p.id) + 1;
    if (p.id === 'hp') { g.maxHp += HP_STEP; heal(HP_STEP); }
    if (p.id === 'scroll') g.scrolls++;
  }
  SFX.item();
  hide('perk');
  if (g.lvQueue > 0) { g.lvQueue--; openPerks('lv'); return; }   // 一次升了好幾級就接著選
  if (g.ascendPending) { startAscend(); return; }
  state = 'play';
  if (perkWhy === 'start' || perkWhy === 'boss') stageBanner();
}

// ===== 特效 =====
function floatText(x, y, s, c, size, screen) { g.texts.push({ x, y, s, c, size, t: 0, screen }); }
function sparkle(x, y, c) { for (let i = 0; i < 8; i++) g.parts.push({ x, y, vx: rnd(-90, 90), vy: rnd(-120, 40), life: .5, max: .5, c, s: rnd(2, 4) }); }
function burst(x, y, c, n) {
  for (let i = 0; i < n; i++) g.parts.push({ x, y, vx: rnd(-220, 220), vy: rnd(-260, 120), life: rnd(.4, .9), max: .9, c: Math.random() < .3 ? '#c0262d' : c, s: rnd(2, 6) });
}
function updateFx(dt) {
  for (const o of g.parts) { o.life -= dt; o.vy += 400 * dt; o.x += o.vx * dt; o.y += o.vy * dt; }
  g.parts = g.parts.filter(o => o.life > 0);
  for (const t of g.texts) { t.t += dt; if (!t.screen) t.y -= 40 * dt; }
  g.texts = g.texts.filter(t => t.t < 1.1);
  for (const o of g.ghosts) o.t += dt;
  for (const o of g.corpses) o.t += dt; g.corpses = g.corpses.filter(o => o.t < .7);
  for (const o of g.puffs) o.t += dt; g.puffs = g.puffs.filter(o => o.t < .5);
  g.ghosts = g.ghosts.filter(o => o.t < .25);
  for (const o of g.fx) o.t += dt;
  g.fx = g.fx.filter(o => o.t < .3);
  for (const o of g.bolts) o.t += dt;
  g.bolts = g.bolts.filter(o => o.t < .25);
  for (const o of g.booms) o.t += dt;
  g.booms = g.booms.filter(o => o.t < .4);
  g.shake = Math.max(0, g.shake - dt * 30);
}

// ===== 成就 =====
function unlock(id) {
  if (save.ach[id]) return;
  save.ach[id] = Date.now(); persist();
  const a = ACH.find(a => a.id === id);
  toast(t('ach_toast', L(a.n)));
}
function checkLiveAch() {
  const h = g.top / 10;
  if (h >= 100) unlock('h100');
  if (h >= 500) unlock('h500');
  if (h >= 1500) unlock('h1500');
  if (h >= 3000) unlock('h3000');
  if (h >= 6000) unlock('h6000');
  for (const n of [30, 50]) if (g.maxCombo >= n) unlock('combo' + n);
  for (const n of [1000, 5000, 20000]) if (save.stats.slashes >= n) unlock('slash' + n);
  if (score() >= 100000) unlock('s100k');
  if (score() >= 300000) unlock('s300k');
  if (g.kills >= 200) unlock('kill200');
  if (g.kills >= 500) unlock('kill500');
  if (g.lv >= 20) unlock('lv20');
  if (g.lv >= 40) unlock('lv40');
  if (g.walls >= 50) unlock('wall50');
  if (g.maxCombo >= 5) unlock('combo5');
  if (g.maxCombo >= 10) unlock('combo10');
  if (save.stats.slashes >= 100) unlock('slash100');
  if (score() >= 50000) unlock('s50k');
}
// 收集類成就（買東西、結算時檢查）
function collAch() {
  if (save.skins.length >= SKINS.length) unlock('skins_all');
  if (META.some(m => mt(m.id) >= m.max)) unlock('meta1');
  if (META.every(m => mt(m.id) >= m.max)) unlock('metaall');
  if (save.coins >= 3000) unlock('rich3000');
}
let toastT = null;
function toast(s) {
  const t = $('toast'); t.textContent = s; t.classList.add('on');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 2200);
}

// ===== 繪圖 =====
function txt(s, x, y, size, color = '#fff', align = 'center', stroke = '#000', lw = 4) {
  ctx.font = `900 ${size}px ${FONT}`; ctx.textAlign = align; ctx.textBaseline = 'middle';
  if (stroke) { ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.lineJoin = 'round'; ctx.strokeText(s, x, y); }
  ctx.fillStyle = color; ctx.fillText(s, x, y);
}
function rr(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h); }

// ===== 主角：全部用程式畫（art.js 的 drawHeroNinja）。標題大圖與商店頭像也用同一套畫法產生 =====
const heroSprites = [];
function buildDockIcons() {
  const stb = document.querySelector('#title [data-act=start]');   // 「開始修行」按鈕：忍者風底圖（art.js startBg）
  if (stb && START_STYLE && !stb.classList.contains('st')) { stb.classList.add('st', 'st-' + START_STYLE); try { stb.style.setProperty('--stbg', 'url(' + startBg(START_STYLE).toDataURL() + ')'); } catch (e) { } }
  for (const el of document.querySelectorAll('.scroll-ic')) {
    // 每次都換一張新的圖片元素（iPhone 有時只改 src 不會重畫），文字依目前語言重畫
    const im = new Image(); im.alt = ''; try { im.src = dockPlate(el.dataset.ic, 220).toDataURL(); } catch (e) { }
    el.replaceChildren(im);
    el.parentNode.setAttribute('aria-label', L(DOCK_LABEL[el.dataset.ic]));
  }
  // 右上角的商店寶箱：平常是關著的，點下去先打開再進商店
  const sc = $('shopIc'); if (sc) { const im = new Image(); im.id = 'shopIc'; im.alt = ''; try { im.src = shopIcon(SHOP_STYLE, 200, false).toDataURL(); im.dataset.open = shopIcon(SHOP_STYLE, 200, true).toDataURL(); im.dataset.shut = im.src; } catch (e) { } sc.parentNode.setAttribute('aria-label', L(DOCK_LABEL.shop)); sc.replaceWith(im); }
}
function buildHeroArt() {
  for (let i = 0; i < SKINS.length; i++) heroSprites[i] = heroPortrait(i, 400);
  heroThumbs.length = 0;
  updateHeroArt();
  // 底部選單：「護額」圖示（art.js dockPlate；文字在圖示裡，換語言時重畫）
  buildDockIcons();
}
// 商店用的小頭像（快取成 dataURL）
const heroThumbs = [];
function heroThumb(i) {
  if (heroThumbs[i] || !heroSprites[i]) return heroThumbs[i];
  const c = document.createElement('canvas'); c.width = c.height = 96; c.getContext('2d').drawImage(heroSprites[i], 0, 0, 96, 96);
  try { heroThumbs[i] = c.toDataURL(); } catch (e) { }
  return heroThumbs[i];
}
// 換裝預覽：某角色穿某顏色的小圖（快取）
const outThumbs = {};
function outThumb(ci, oi) {
  const k = ci + '_' + oi; if (outThumbs[k]) return outThumbs[k];
  const cnv = document.createElement('canvas'); cnv.width = cnv.height = 112; const c = cnv.getContext('2d'); c.scale(112 / 84, 112 / 84);
  try { drawHeroNinja(42, 74, { face: 1, t: .35, vy: 0, skin: ci, pal: OUTFITS[oi] }, c); outThumbs[k] = cnv.toDataURL(); } catch (e) { outThumbs[k] = ''; }
  return outThumbs[k];
}
// 換角色或換裝後：重畫這名角色的大圖、頭像與標題圖
function refreshHero(i = save.skin) { heroSprites[i] = heroPortrait(i, 400); heroThumbs[i] = null; updateHeroArt(); resetHelpIcons(); }
// 說明頁的插圖也是用目前角色畫的：換角色／換裝後清掉快取，下次打開說明時重畫
function resetHelpIcons() { if (typeof HELP_IC !== 'undefined') for (const k in HELP_IC) delete HELP_IC[k]; }
// 標題畫面的大圖跟著目前選的角色
function updateHeroArt() {
  const s = heroSprites[save.skin || 0];
  if (!s) return;
  let url = '';
  try { url = s.toDataURL(); } catch (e) { return; }
  for (const el of document.querySelectorAll('.hero-tint')) el.src = url;
}
function drawNinja(x, y, o) { drawHeroNinja(x, y, o); }

// 彈射瞄準的軌跡預覽（世界座標）
function drawAim() {
  const p = g.p, a = aimInfo(), ok = g.ki >= kiCost();
  ctx.fillStyle = 'rgba(120,200,255,.08)'; ctx.fillRect(0, g.camY, W, H);   // 慢動作的淡藍色
  if (!a) return;
  const col = ok ? '#ffffff' : '#888888';
  if (a.dive) {
    // 急降斬：往下的虛線到第一塊地板，並畫出衝擊波範圍
    let ty = g.camY + H - 30;
    for (const pl of g.plats) if (!pl.broken && pl.y > p.y && pl.y < ty && Math.abs(pl.x - p.x) < pl.w / 2 + 9) ty = pl.y;
    ctx.fillStyle = col;
    for (let y = p.y; y < ty; y += 12) { ctx.beginPath(); ctx.arc(p.x, y, 2.5, 0, 7); ctx.fill(); }
    ctx.strokeStyle = ok ? 'rgba(255,255,255,.7)' : '#888'; ctx.lineWidth = 2; ctx.setLineDash([6, 6]);
    ctx.beginPath(); ctx.arc(p.x, ty, 90 * (1 + .5 * pk('quake')), 0, 7); ctx.stroke(); ctx.setLineDash([]);
    txt(t('aim_dive'), p.x, p.y - 64, 14, ok ? '#fff' : '#999', 'center', '#000', 3);
    return;
  }
  // 路線上會被斬到的敵人
  for (const e of a.hits) {
    ctx.strokeStyle = '#ff4a3a'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(e.x, e.y, ENEMY[e.type].w * .6, 0, 7); ctx.stroke();
  }
  if (a.lock) { // 吸附準星
    const e = a.lock, r = ENEMY[e.type].w * .75, s = g.t * 3;
    ctx.strokeStyle = '#ffd27a'; ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) { const an = s + i * Math.PI / 2; ctx.beginPath(); ctx.arc(e.x, e.y, r, an, an + .9); ctx.stroke(); }
  }
  // 虛線軌跡：沿折線每 12px 畫一個點
  ctx.fillStyle = col;
  let carry = 0;
  for (let i = 1; i < a.pts.length; i++) {
    const [x0, y0] = a.pts[i - 1], [x1, y1] = a.pts[i], d = Math.hypot(x1 - x0, y1 - y0);
    for (let s = carry; s < d; s += 12) { ctx.beginPath(); ctx.arc(x0 + (x1 - x0) * s / d, y0 + (y1 - y0) * s / d, 2.5, 0, 7); ctx.fill(); }
    carry = (carry - d) % 12; if (carry < 0) carry += 12;
  }
  // 終點箭頭
  const [ex, ey] = a.pts[a.pts.length - 1], [bx, by] = a.pts[a.pts.length - 2];
  const an = Math.atan2(ey - by, ex - bx);
  ctx.save(); ctx.translate(ex, ey); ctx.rotate(an); ctx.fillStyle = col;
  ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(-6, -7); ctx.lineTo(-6, 7); ctx.fill(); ctx.restore();
}

// 手指位置的彈弓橡皮筋（畫面座標）
function drawSling() {
  const a = aimInfo(), ok = g.ki >= kiCost();
  ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(inp.sx, inp.sy, AIM_MIN, 0, 7); ctx.stroke();
  ctx.strokeStyle = ok ? '#ffd27a' : '#888'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(inp.sx, inp.sy); ctx.lineTo(inp.cx, inp.cy); ctx.stroke();
  ctx.fillStyle = ok ? '#ffd27a' : '#888'; ctx.beginPath(); ctx.arc(inp.cx, inp.cy, 8, 0, 7); ctx.fill();
  const msg = !ok ? t('ki_low') : a ? t('aim_go') : t('aim_cancel');
  txt(msg, W / 2, H - 60, 14, ok ? '#fff' : '#9ad8ff', 'center', '#000', 3);
}

// 右下角的豪天翔按鈕：大圓鈕、裡面是卷軸，有卷軸時發光並顯示張數（拇指最好按的位置）
function scrollBtnPos() { return { x: W / 2, y: H * 5 / 6, r: 32 }; }   // 畫面中間偏下（下方六分之一處）
function drawScrollBtn() {
  const { x, y, r } = scrollBtnPos(), c = ctx, has = g.scrolls > 0 && g.fly <= 0, pu = has ? .5 + .5 * Math.sin(g.t * 5) : 0;
  if (!has) return;   // 有卷軸、可以發動時才出現
  c.save();
  if (has) { const gl = c.createRadialGradient(x, y, r * .6, x, y, r * 1.6); gl.addColorStop(0, `rgba(255,210,90,${.35 + .25 * pu})`); gl.addColorStop(1, 'rgba(255,210,90,0)'); c.fillStyle = gl; aCirc(c, x, y, r * 1.6); c.fill(); }
  c.globalAlpha = has ? .85 : .4;   // 在畫面中間，半透明一點才不會擋住視線
  aCirc(c, x, y, r + 3); c.fillStyle = INK; c.fill();
  const bg = c.createRadialGradient(x - 8, y - 10, 4, x, y, r); bg.addColorStop(0, has ? '#3a4a7a' : '#3a3a44'); bg.addColorStop(1, has ? '#141a36' : '#1a1a20'); aCirc(c, x, y, r); c.fillStyle = bg; c.fill();
  c.lineWidth = 3; c.strokeStyle = has ? '#e8b84a' : '#777'; aCirc(c, x, y, r - 2); c.stroke();
  // 卷軸圖示
  c.save(); c.translate(x, y - 3); c.rotate(-.35);
  rr(-16, -7, 32, 14, 3); c.fillStyle = has ? '#fff3d0' : '#999'; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.4; c.stroke();
  c.fillStyle = '#c0262d'; c.fillRect(-3, -7, 6, 14);
  for (const sx of [-1, 1]) { rr(sx * 16 - 3, -9, 6, 18, 2); c.fillStyle = '#6a3a1e'; c.fill(); c.stroke(); }
  c.restore();
  txt(t('ju_' + curJutsu().id), x, y + 16, 9, has ? '#ffd27a' : '#aaa', 'center', INK, 3);
  if (g.scrolls > 0) { aCirc(c, x + r * .72, y - r * .72, 10); c.fillStyle = '#c0262d'; c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 1.6; c.stroke(); txt(String(g.scrolls), x + r * .72, y - r * .72, 11, '#fff', 'center', null); }
  c.restore();
}
function drawHUD() {
  ctx.save();
  // 整條 HUD 往下移到瀏海下面；背景從畫面最頂端一路畫下來，不留接縫
  if (SAFE_T > 0) ctx.translate(0, SAFE_T);
  // 上方資訊列（忍術風）：夜行衣的深藍黑底＋淡金青海波紋。
  // iOS 會在瀏海下方疊一段模糊帶（BLUR_T），那段只放紋樣，所有文字和按鈕排成一列放在它下面
  const BY = BLUR_T, HB = BY + HUD_ROW, cy = BY + HUD_ROW / 2, y0 = -SAFE_T;
  HUD_Y0 = BY; HUD_Y1 = HB;
  const hg = ctx.createLinearGradient(0, y0, 0, HB); hg.addColorStop(0, '#0a0d14'); hg.addColorStop(1, '#1a2236');
  ctx.fillStyle = hg; ctx.fillRect(0, y0, W, HB - y0);
  ctx.globalAlpha = .5; ctx.fillStyle = hudPattern(); ctx.fillRect(0, y0, W, HB - y0); ctx.globalAlpha = 1;
  // 底部不畫線，用柔和的陰影漸層接到遊戲畫面
  const fade = ctx.createLinearGradient(0, HB, 0, HB + 12); fade.addColorStop(0, 'rgba(10,13,20,.55)'); fade.addColorStop(1, 'rgba(10,13,20,0)');
  ctx.fillStyle = fade; ctx.fillRect(0, HB, W, 12);
  // 分數：手裡劍＋數字
  drawShuriken(14, cy, 9, g.t * 2);
  txt(String(score()), 27, cy, 15, '#fff', 'left', INK, 4);
  // 小判
  ctx.fillStyle = INK; ctx.beginPath(); ctx.ellipse(93, cy, 7, 9, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#e8b020'; ctx.beginPath(); ctx.ellipse(93, cy, 5.5, 7.5, 0, 0, 7); ctx.fill();
  txt(String(Math.floor(g.coins)), 102, cy, 13, '#ffd27a', 'left', INK, 3);
  // 卷軸（可點擊發動忍法）
  ctx.fillStyle = INK; rr(124, cy - 7, 24, 14, 3); ctx.fill();
  ctx.fillStyle = g.scrolls ? '#fff3d0' : '#777'; ctx.fillRect(126, cy - 5, 20, 10);
  ctx.fillStyle = '#c0262d'; ctx.fillRect(133, cy - 6, 6, 12);
  txt('×' + g.scrolls, 151, cy, 12, g.scrolls ? '#fff' : '#999', 'left', INK, 3);
  // HP：「命」字印章＋血條（低於 30% 會閃爍）
  const hr = g.hp / g.maxHp, low = hr < .3 && Math.sin(g.t * 10) > 0;
  seal(181, cy, 16, '命');
  bar(192, cy - 8, 76, 16, hr, low ? '#ff9a9a' : hr < .3 ? '#ff3a3a' : '#e5342a');
  txt(`${Math.ceil(g.hp)}/${g.maxHp}`, 230, cy, 9, '#fff', 'center', INK, 3);
  // 幕名（紅色落款方印）、高度＋本幕進度小條
  seal(283, cy, 18, THEMES[g.th].k);
  txt((g.stage + 1) + '/' + ST_N, 323, cy - 4, 11, g.stage % 5 === 4 ? '#ff9a8a' : '#fff', 'right', INK, 3);   // 舞台 N/10（魔王舞台是紅字）
  const pr = g.boss ? 1 : clamp((g.top - g.base) / STAGE_PX, 0, 1);
  ctx.fillStyle = 'rgba(0,0,0,.55)'; rr(296, cy + 6, 27, 3, 1.5); ctx.fill();
  ctx.fillStyle = '#ffe28a'; rr(296, cy + 6, 27 * pr, 3, 1.5); ctx.fill();
  // 暫停：金框圓形家紋
  const px = W - 18, py = cy;
  ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(px, py, 14, 0, 7); ctx.fill();
  ctx.fillStyle = '#141a28'; ctx.beginPath(); ctx.arc(px, py, 12, 0, 7); ctx.fill();
  ctx.strokeStyle = '#e8b84a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(px, py, 12, 0, 7); ctx.stroke();
  ctx.fillStyle = '#e8b84a'; ctx.fillRect(px - 5, py - 6, 3.5, 12); ctx.fillRect(px + 1.5, py - 6, 3.5, 12);
  // 以下（氣、技能、連斬、魔王血量…）原本以 HUD 高 64 排版，依新的 HUD 高度整體平移
  ctx.translate(0, HB - 64);
  // 氣（衝刺斬／急降斬的次數）
  const km = kiMax();
  txt(t('ki'), 14, 80, 11, '#9ad8ff', 'center', '#000', 3);
  for (let i = 0; i < km; i++) {
    const f = clamp(g.ki - i, 0, 1), x = 32 + i * 16;
    ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.beginPath(); ctx.arc(x, 80, 6, 0, 7); ctx.fill();
    ctx.fillStyle = f >= 1 ? '#5ad1ff' : '#2a6a8a';
    ctx.beginPath(); ctx.moveTo(x, 80); ctx.arc(x, 80, 5, -Math.PI / 2, -Math.PI / 2 + f * Math.PI * 2); ctx.fill();
  }
  // 經驗條（魂）、等級、已持有的技能
  txt(`Lv ${g.lv}`, W - 12, 78, 12, '#9ad8ff', 'right', '#000', 3);
  // 經驗條：Lv 下方的小條
  ctx.fillStyle = 'rgba(0,0,0,.55)'; rr(W - 56, 87, 44, 4, 2); ctx.fill();
  ctx.fillStyle = '#5ad1ff'; rr(W - 56, 87, 44 * clamp(g.xp / xpNeed(g.lv), 0, 1), 4, 2); ctx.fill();
  let ix = 40 + km * 16;
  ctx.font = `12px ${FONT}`;
  for (const s of SKILLS) {
    const l = sk(s.id); if (!l) continue;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(l > SK_MAX ? EVO[s.id].ic : s.ic, ix, 80);
    txt(l > SK_MAX ? '★' : String(l), ix + 8, 86, 8, l > SK_MAX ? '#ffd27a' : '#fff', 'center', '#000', 2);
    ix += 24;
  }
  if (sk('barrier')) txt('🛡️' + '×' + g.barrier, ix + 6, 80, 10, '#9ad8ff', 'left', '#000', 2);
  // 連斬
  if (g.combo >= 1 && (g.comboT > 0 || g.fever > 0)) {
    if (g.combo >= 2) txt(t('chain_hud', g.combo), W / 2, 90, 22, '#ffd27a', 'center', '#000', 4);
    if (g.fever > 0) {
      txt(t('fever_hud', g.fever.toFixed(1)), W / 2, 112, 13, '#ffd27a', 'center', '#000', 3);
    } else {
      // 落地寬限中：計時條變紅、變粗並閃爍「快接上！」
      if (g.grace) {
        ctx.fillStyle = '#000'; ctx.fillRect(W / 2 - 41, 103, 82, 6);
        ctx.fillStyle = Math.sin(g.t * 30) > 0 ? '#ff4a3a' : '#ff9a6a'; ctx.fillRect(W / 2 - 40, 104, 80 * clamp(g.comboT / comboGrace(), 0, 1), 4);
        // （寬限的文字提示已移除，只留紅色計時條）
      } else {
        ctx.fillStyle = '#ffd27a'; ctx.fillRect(W / 2 - 40, 104, 80 * (g.comboT / comboMax()), 3);
        // （連斬下方的白色說明文字已移除：畫面太雜）
      }
    }
  }
  // BOSS
  const b = g.boss;
  if (b) {
    bar(40, 110, W - 80, 16, b.hp / b.max, '#e5342a');
    // 破綻：打滿就暈眩（暈眩中改成閃爍提示）
    if (b.stun > 0) txt(t('boss_stun_hud'), W / 2, 137, 11, Math.sin(g.t * 12) > 0 ? '#ffd27a' : '#fff', 'center', '#000', 3);
    else txt(t('boss_st') + ' ' + '◆'.repeat(b.st) + '◇'.repeat(Math.max(0, b.stN - b.st)), W / 2, 137, 11, '#ffd27a', 'center', '#000', 3);
    txt(L(BOSS_KINDS[b.kind].n), W / 2, 119, 9, '#fff', 'center', '#000', 2);
  }
  // 中 BOSS
  const m = g.mid;
  if (m && !m.dead) {
    bar(60, 122, W - 120, 13, m.hp / m.max, '#e5342a');
    bar(60, 136, W - 120, 8, clamp(m.life / 25, 0, 1), '#e8b84a');
  }
  // 異變
  if (g.mod && g.mod.id === 'wind' && g.wind) txt(g.wind > 0 ? '風 ≫≫' : '≪≪ 風', W / 2, 150, 14, '#cfefff', 'center', '#000', 3);
  ctx.restore();
}

// HUD 背景的青海波紋（只做一次，之後重複貼）
let HUD_PAT = null;
function hudPattern() {
  if (HUD_PAT) return HUD_PAT;
  const c = document.createElement('canvas'); c.width = 48; c.height = 24;
  const x = c.getContext('2d');
  // 由上往下一排排畫半圓（每排錯開半格），後畫的會蓋住前面，做出波浪層疊感
  for (let j = -2; j <= 4; j++) {
    const y = j * 6, off = (j & 1) ? 12 : 0;
    for (let k = -1; k <= 2; k++) {
      const cx = off + k * 24;
      x.fillStyle = '#121a2a'; x.beginPath(); x.arc(cx, y, 12, 0, 7); x.fill();
      x.strokeStyle = 'rgba(232,184,74,.5)'; x.lineWidth = 1;
      for (const r of [12, 8, 4]) { x.beginPath(); x.arc(cx, y, r, Math.PI, 0); x.stroke(); }
    }
  }
  HUD_PAT = ctx.createPattern(c, 'repeat');
  return HUD_PAT;
}
// 手裡劍圖示（銀色、粗黑框、中間有孔）
function drawShuriken(x, y, r, rot) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.beginPath();
  for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, rr2 = i % 2 ? r * .32 : r; ctx.lineTo(Math.cos(a) * rr2, Math.sin(a) * rr2); }
  ctx.closePath(); ctx.fillStyle = '#eef2f4'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(0, 0, r * .22, 0, 7); ctx.fill();
  ctx.restore();
}
// 紅色落款印章（方形、粗黑框、白字）
function seal(x, y, s, ch) {
  ctx.fillStyle = INK; rr(x - s / 2 - 2, y - s / 2 - 2, s + 4, s + 4, 4); ctx.fill();
  ctx.fillStyle = '#c0262d'; rr(x - s / 2, y - s / 2, s, s, 3); ctx.fill();
  ctx.strokeStyle = 'rgba(255,240,220,.6)'; ctx.lineWidth = 1; rr(x - s / 2 + 2, y - s / 2 + 2, s - 4, s - 4, 2); ctx.stroke();
  txt(ch, x, y + 1, s * .62, '#fff3e0', 'center', null);
}

// 粗黑框＋高光的量條（HP、魔王血量、時間）
function bar(x, y, w, h, r, col) {
  ctx.fillStyle = INK; rr(x, y, w, h, h / 2); ctx.fill();
  ctx.fillStyle = '#1a2022'; rr(x + 2, y + 2, w - 4, h - 4, (h - 4) / 2); ctx.fill();
  if (r > 0) {
    ctx.fillStyle = col; rr(x + 2, y + 2, Math.max(h - 4, (w - 4) * clamp(r, 0, 1)), h - 4, (h - 4) / 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.fillRect(x + 5, y + 3, Math.max(0, (w - 10) * clamp(r, 0, 1)), Math.max(1, (h - 4) * .3));
  }
}

function drawBanner() {
  const b = g.banner; if (!b) return;
  const a = Math.min(1, b.t * 2, (2.6 - b.t) * 4);
  ctx.globalAlpha = clamp(a, 0, 1);
  // 半透明的深色帶＋紅色緞帶。放在 HUD 正下方、主角上面（相機把主角固定在畫面 42% 高），才不會把主角蓋住
  const y0 = Math.max(H * .14, SAFE_T + HUD_Y1 + 14);
  const bg = ctx.createLinearGradient(0, y0, 0, y0 + 120); bg.addColorStop(0, 'rgba(10,13,20,0)'); bg.addColorStop(.18, 'rgba(10,13,20,.62)');
  bg.addColorStop(.82, 'rgba(10,13,20,.62)'); bg.addColorStop(1, 'rgba(10,13,20,0)');
  ctx.fillStyle = bg; ctx.fillRect(0, y0, W, 120);
  ctx.fillStyle = INK; rr(W / 2 - 112, y0 + 38, 224, 50, 4); ctx.fill();
  ctx.fillStyle = '#e5342a'; rr(W / 2 - 108, y0 + 42, 216, 42, 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.22)'; ctx.fillRect(W / 2 - 104, y0 + 45, 208, 8);
  txt(b.a, W / 2, y0 + 20, 15, '#ffe28a', 'center', INK, 4);
  txt(b.b, W / 2, y0 + 64, 34, '#fff', 'center', INK, 6);
  if (b.c) txt(b.c, W / 2, y0 + 104, 11, '#dfe6e8', 'center', INK, 3);
  ctx.globalAlpha = 1;
}

function speedLines(t, col = 'rgba(255,255,255,.5)') {
  ctx.strokeStyle = col; ctx.lineWidth = 2;
  for (let i = 0; i < 28; i++) {
    const a = i / 28 * Math.PI * 2 + t * .3, r1 = 140 + ((i * 37 + t * 600) % 120);
    ctx.beginPath(); ctx.moveTo(W / 2 + Math.cos(a) * r1, H / 2 + Math.sin(a) * r1); ctx.lineTo(W / 2 + Math.cos(a) * 420, H / 2 + Math.sin(a) * 420); ctx.stroke();
  }
}

function drawSlash() {
  const s = g.slash;
  ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(0, 0, W, H);
  speedLines(s.t * 10);
  // 最近一刀：揮刀方向左右交替；敵人受擊＝閃白、往刀的方向被打退、壓扁回彈、眼睛變 ＞＜
  const last = s.lines[s.lines.length - 1], lt = last ? last.t : 1, d = s.n % 2 ? 1 : -1;
  const u = Math.min(1, lt / .07), eu = 1 - (1 - u) * (1 - u);
  const kb = last ? (1 - Math.min(1, lt / .16)) * 18 : 0, sq = last ? 1 - Math.min(1, lt / .12) : 0;
  const ex = W / 2 + 18 + d * kb, ey = H * .42 - kb * .35;
  ctx.save(); ctx.translate(ex + rnd(-2, 2), ey + rnd(-2, 2)); ctx.scale(1 + sq * .16, 1 - sq * .12);
  drawEnemy(0, 0, s.e.type, 3, s.t, { flash: last && lt < .06 ? 1 : 0, hurt: !!last, look: -1, bx: s.e.bx, x: s.e.x });
  ctx.restore();
  if (last && lt < .14) {   // 命中的火花
    const k = lt / .14; ctx.save(); ctx.translate(ex - d * 10, ey - 6); ctx.rotate(last.a); ctx.globalAlpha = 1 - k;
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, r1 = 10 + k * 30, r2 = 26 + k * 50; ctx.strokeStyle = i % 2 ? '#ffe28a' : '#fff'; ctx.lineWidth = 4 - k * 3; ctx.beginPath(); ctx.moveTo(Math.cos(a) * r1, Math.sin(a) * r1); ctx.lineTo(Math.cos(a) * r2, Math.sin(a) * r2); ctx.stroke(); }
    ctx.restore(); ctx.globalAlpha = 1;
  }
  if (last) for (let i = 0; i < 3; i++) { const a = s.t * 6 + i * 2.1; drawStar4(ctx, ex + Math.cos(a) * 46, ey - 70 + Math.sin(a) * 12, 6, s.t * 8, '#ffe28a'); }   // 頭上轉圈的星星
  // 主角背影：在畫面左下方往前揮刀（揮刀時往敵人方向衝一點）
  const A0 = d > 0 ? -2.7 : -.35, A1 = d > 0 ? .05 : -3.05, ang = last ? A0 + (A1 - A0) * eu : -2.3;
  drawHeroBack(ctx, W * .3 + eu * 10 * (last ? 1 : 0), H * .99 - eu * 8, 2.8, ang, s.t, save.skin, A0, last ? 1 - Math.min(1, lt / .14) : 0);
  for (const l of s.lines) {
    const a = Math.max(0, 1 - l.t * 3); if (a <= 0) continue;
    ctx.save(); ctx.translate(W / 2, H / 2 + l.off); ctx.rotate(l.a);
    ctx.globalAlpha = a; ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.moveTo(-170, 0); ctx.lineTo(0, -4); ctx.lineTo(170, 0); ctx.lineTo(0, 4); ctx.fill();
    ctx.restore();
  }
  ctx.globalAlpha = 1;
  txt('斬!', W / 2, H * .25, 56 + Math.sin(s.t * 30) * 4, '#fff', 'center', '#c0262d', 8);
  txt(`斬+${s.n}`, W / 2 + 70, H * .72, 26, '#ffd27a', 'center', '#000', 5);
  if (g.combo >= 2) txt(t('chain_hud', g.combo), W / 2, H * .8, 22, '#ffd27a', 'center', '#000', 4);
}

// 鬼神斬：巨大金棒從天而降，砸在畫面中央（k：0→1）
function drawKishin(k) {
  const fall = Math.min(1, k / .3), cx = W / 2, y = -260 + (H * .62 + 260) * fall * fall;
  ctx.save(); ctx.globalAlpha = k < .75 ? 1 : 1 - (k - .75) / .25;
  ctx.translate(cx, y); ctx.rotate(-.12);
  ctx.fillStyle = '#4a2a20'; ctx.fillRect(-9, -320, 18, 200); ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.strokeRect(-9, -320, 18, 200);
  ctx.fillStyle = '#7a1a14'; ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(-34, -130, 68, 140, 16); else ctx.rect(-34, -130, 68, 140); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#d9a441'; for (let r = 0; r < 4; r++) for (const sx of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sx * 34, -110 + r * 34); ctx.lineTo(sx * 48, -100 + r * 34); ctx.lineTo(sx * 34, -90 + r * 34); ctx.fill(); }
  ctx.restore();
  if (fall >= 1) {   // 落地的衝擊波
    const r = (k - .3) / .7; ctx.strokeStyle = `rgba(255,140,80,${1 - r})`; ctx.lineWidth = 10 * (1 - r) + 2;
    ctx.beginPath(); ctx.ellipse(cx, H * .62, 40 + r * W, 14 + r * 80, 0, 0, TAU); ctx.stroke();
    if (k < .4) { ctx.fillStyle = `rgba(255,255,255,${(.4 - k) * 5})`; ctx.fillRect(0, 0, W, H); }
  }
}
// ===== 豪天翔：卷軸展開・揮毫 =====
// 0～0.15 秒卷軸飛入 → 0.35 秒攤開 → 0.35～0.75 毛筆逐字寫出「豪天翔」→ 0.75 蓋「忍」印 → 0.85～1.2 卷軸燒成金焰、主角衝天
const CAST_T = 1.2, BRUSH = '"Yuji Boku","Yu Mincho","Hiragino Mincho ProN","Noto Serif TC","Noto Serif JP","PMingLiU","MS Mincho",serif';
const easeO = x => 1 - (1 - x) * (1 - x);
// 時間軸上的音效（e0→e1 這一幀跨過的時間點）
function castCue(e0, e1) {
  const at = x => e0 < x && e1 >= x;
  if (at(.15)) { noise(.18, .06); tone(500, .14, 'triangle', .03, 600); }   // 唰：攤開
  for (const x of [.35, .48, .61]) if (at(x)) noise(.09, .045);            // 毛筆
  if (at(.75)) { SFX.impact(); vib(40); }                                     // 蓋印
  if (at(.85)) { noise(.5, .08); tone(220, .45, 'sawtooth', .04, 500); }     // 燒起來
}
function drawCast() {
  const e = CAST_T - g.castT, T = performance.now() / 1000, cx = W / 2;
  const burn = clamp((e - .85) / .35, 0, 1), SW = Math.min(W - 36, 330), SH = 150;
  ctx.fillStyle = `rgba(22,6,8,${Math.min(.95, e * 9)})`; ctx.fillRect(0, 0, W, H);
  speedLines(e * 8, `rgba(255,200,120,${.3 * (1 - burn) + .15})`);
  // 光柱（燒起來之後）
  if (burn > 0) {
    const pw = 60 + burn * 90, gr = ctx.createLinearGradient(cx - pw / 2, 0, cx + pw / 2, 0);
    gr.addColorStop(0, 'rgba(255,210,90,0)'); gr.addColorStop(.5, `rgba(255,240,180,${.75 * burn})`); gr.addColorStop(1, 'rgba(255,210,90,0)');
    ctx.fillStyle = gr; ctx.fillRect(cx - pw / 2, 0, pw, H);
  }
  // 卷軸位置與寬度
  const y = e < .15 ? -80 + (H * .44 + 80) * easeO(e / .15) : H * .44;
  const w = e < .15 ? 22 : 22 + (SW - 22) * easeO(clamp((e - .15) / .2, 0, 1));
  const sk = e >= .75 && e < .85 ? Math.sin(e * 140) * 5 * (1 - (e - .75) / .1) : 0;   // 蓋印的震動
  ctx.save(); ctx.translate(cx + sk, y + sk * .4);
  ctx.globalAlpha = 1;
  // 紙：從下往上燒掉
  const ph = SH * (1 - burn), top = -SH / 2;
  if (ph > 0) {
    ctx.fillStyle = '#efe3c2'; ctx.fillRect(-w / 2, top, w, ph);
    ctx.strokeStyle = '#c9b07a'; ctx.lineWidth = 2; ctx.strokeRect(-w / 2 + 8, top + 8, w - 16, Math.max(0, ph - 16));
    ctx.save(); ctx.beginPath(); ctx.rect(-w / 2, top, w, ph); ctx.clip();
    // 揮毫：每個字由上往下顯現（毛筆）
    if (w > SW * .9) {
      const cs = Math.min(100, (SW - 40) / 3);
      ctx.font = `${cs}px ${BRUSH}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      [...(g.castJ || JUTSU[0]).n].forEach((ch, i) => {
        const p = clamp((e - .35 - i * .13) / .12, 0, 1); if (p <= 0) return;
        const x = (i - 1) * cs * .98 - 12, yy = [6, -4, 8][i];   // 毛筆字：每個字高低錯落、微微傾斜
        ctx.save(); ctx.beginPath(); ctx.rect(x - cs * .7, -cs * .7, cs * 1.4, cs * 1.4 * p); ctx.clip();
        ctx.translate(x, yy); ctx.rotate([-.06, .04, -.03][i]);
        ctx.shadowColor = 'rgba(26,16,16,.35)'; ctx.shadowBlur = 3;   // 墨暈
        ctx.fillStyle = '#140c0c'; ctx.fillText(ch, 0, 0); ctx.restore();
        if (p < 1) { ctx.fillStyle = 'rgba(26,16,16,.85)'; aCirc(ctx, x + Math.sin(p * 9) * cs * .2, -cs * .5 + cs * 1.1 * p, 4); ctx.fill(); }   // 筆尖
      });
      // 「忍」印
      if (e >= .75) {
        const s = 1 + 1.6 * (1 - easeO(clamp((e - .75) / .08, 0, 1))), sx = SW / 2 - 28;
        ctx.save(); ctx.translate(sx, 46); ctx.rotate(.14); ctx.scale(s, s);
        ctx.globalAlpha = Math.min(1, (e - .75) / .03);
        ctx.fillStyle = '#c0262d'; ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(-15, -15, 30, 30, 4); else ctx.rect(-15, -15, 30, 30); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = `900 22px ${BRUSH}`; ctx.fillText('忍', 0, 2); ctx.restore();
      }
    }
    ctx.restore();
    // 燒到的邊緣：火舌與餘燼
    if (burn > 0) {
      const ey = top + ph;
      for (let i = 0; i <= 12; i++) {
        const x = -w / 2 + i * w / 12, fh = 14 + Math.sin(T * 30 + i * 2.1) * 6;
        ctx.fillStyle = i % 2 ? '#ffd25a' : '#ff7a2a';
        ctx.beginPath(); ctx.moveTo(x - 10, ey + 4); ctx.quadraticCurveTo(x - 4, ey - fh * .5, x, ey - fh); ctx.quadraticCurveTo(x + 4, ey - fh * .5, x + 10, ey + 4); ctx.closePath(); ctx.fill();
      }
      ctx.fillStyle = 'rgba(40,20,10,.6)'; ctx.fillRect(-w / 2, ey - 3, w, 3);   // 焦痕
      for (let i = 0; i < 14; i++) { const ex = -w / 2 + ((i * 53 + T * 40) % w), eyy = ey - ((T * 160 + i * 37) % 150); ctx.fillStyle = i % 2 ? '#ffe28a' : '#ff9a4a'; ctx.fillRect(ex, eyy, 3, 3); }
    }
  }
  // 卷軸兩端的軸
  ctx.globalAlpha = 1 - burn;
  for (const sx of [-1, 1]) {
    const rx = sx * w / 2;
    ctx.fillStyle = '#6b4a22'; ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(rx - 6, top - 9, 12, SH + 18, 6); else ctx.rect(rx - 6, top - 9, 12, SH + 18); ctx.fill();
    ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#d9a441'; ctx.fillRect(rx - 7, top - 12, 14, 6); ctx.fillRect(rx - 7, top + SH + 6, 14, 6);
  }
  ctx.globalAlpha = 1;
  ctx.restore();
  // 「忍法」與英文副標
  ctx.globalAlpha = Math.min(1, e * 5) * (1 - burn);
  txt(t('cast_top'), cx, y - SH / 2 - 30, 28, '#ffd27a', 'center', '#000', 5);
  if (LI === 2) txt(t('ju_' + (g.castJ || JUTSU[0]).id).toUpperCase(), cx, y + SH / 2 + 30, 20, '#fff', 'center', '#000', 4);
  ctx.globalAlpha = 1;
  // 主角：最後從光柱中往上衝
  const ny = H * .9 - easeO(burn) * H * .62;
  drawNinja(cx, ny, { face: 1, t: T, vy: -900, skin: save.skin, fly: burn > 0 });
}

function drawQte() {
  const q = g.qte, b = g.boss;
  ctx.fillStyle = 'rgba(40,0,0,.8)'; ctx.fillRect(0, 0, W, H);
  speedLines(q.t * 6);
  const sh = q.hits.length ? 5 : 1;
  // 魔王受擊：往刀的方向被打退、閃白
  const last = q.hits[q.hits.length - 1], lt = last ? last.t : 1, d = (q.n || 0) % 2 ? 1 : -1;
  const kb = last ? (1 - Math.min(1, lt / .16)) * 22 : 0, bx = W / 2 + d * kb + rnd(-sh, sh), by = H * .42 - kb * .3 + rnd(-sh, sh);
  drawBoss(b, bx, by, 3.2);
  if (last && lt < .06) drawSil(bx, by, 420, 420, 210, 210, 'rgba(255,255,255,.85)', c2 => drawBoss(b, 0, 0, 3.2, c2));
  // 主角背影：在畫面左下方左右交替揮刀（和一般斬擊特寫相同）
  const u = Math.min(1, lt / .07), eu = 1 - (1 - u) * (1 - u), A0 = d > 0 ? -2.7 : -.35, A1 = d > 0 ? .05 : -3.05;
  drawHeroBack(ctx, W * .24 + (last ? eu * 10 : 0), H * 1.02 - eu * 8, 2.6, last ? A0 + (A1 - A0) * eu : -2.3, q.t, save.skin, A0, last ? 1 - Math.min(1, lt / .14) : 0);
  for (const h of q.hits) {
    ctx.save(); ctx.translate(W / 2 + h.x, H * .42 + h.y); ctx.rotate(h.a); ctx.globalAlpha = 1 - h.t / .35; ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.moveTo(-120, 0); ctx.lineTo(0, -5); ctx.lineTo(120, 0); ctx.lineTo(0, 5); ctx.fill(); ctx.restore();
  }
  ctx.globalAlpha = 1;
  // HP
  ctx.fillStyle = '#000'; ctx.fillRect(30, 70, W - 60, 18);
  ctx.fillStyle = '#c0262d'; ctx.fillRect(32, 72, (W - 64) * Math.max(0, b.hp / b.max), 14);
  txt(`${L(BOSS_KINDS[b.kind].n)}  HP`, W / 2, 60, 13, '#fff', 'center', '#000', 3);
  // 時機圈：外圈往內縮，縮到白圈上時點擊（淡金色帶＝「良」的範圍）
  for (const r of q.rings) {
    if (!r.res) {
      const rr = Math.max(0, qteR(r)), diff = Math.abs(rr - q.RT), close = clamp(1 - diff / 50, 0, 1), perfect = diff <= 8;
      // 「良」的範圍帶、白色目標圈（外圈越靠近越亮）
      ctx.lineWidth = 36; ctx.strokeStyle = `rgba(255,210,122,${.14 + .2 * close})`; ctx.beginPath(); ctx.arc(r.x, r.y, q.RT, 0, 7); ctx.stroke();
      ctx.save(); ctx.shadowColor = '#ffd25a'; ctx.shadowBlur = 6 + 16 * close;
      ctx.lineWidth = 4 + 2 * close; ctx.strokeStyle = perfect ? '#fffbe8' : '#fff'; ctx.beginPath(); ctx.arc(r.x, r.y, q.RT, 0, 7); ctx.stroke(); ctx.restore();
      ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.beginPath(); ctx.arc(r.x, r.y, q.RT - 3, 0, 7); ctx.fill();
      txt(t('qte_mark'), r.x, r.y + 9, 26 + 4 * close, '#fff', 'center', '#c0262d', 4);
      // 外圈：越接近時機，從白色轉成金色、越來越粗；完美時機的瞬間整圈閃亮
      const cr = 255, cg = Math.round(255 - 45 * close), cb = Math.round(255 - 170 * close);
      ctx.save(); ctx.shadowColor = `rgb(${cr},${cg},${cb})`; ctx.shadowBlur = perfect ? 24 : 8 * close;
      ctx.lineWidth = perfect ? 9 : 4 + 3 * close; ctx.strokeStyle = perfect ? '#ffffff' : `rgb(${cr},${cg},${cb})`; ctx.beginPath(); ctx.arc(r.x, r.y, rr, 0, 7); ctx.stroke(); ctx.restore();
      // 外圈上的四個刻記，跟著縮小一起轉
      for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + (q.t - r.t0) * 3; ctx.fillStyle = `rgba(${cr},${cg},${cb},.9)`; aCirc(ctx, r.x + Math.cos(a) * rr, r.y + Math.sin(a) * rr, 3.5); ctx.fill(); }
    } else {
      const k = r.rt / .6, col = { perf: '#ffd27a', good: '#fff', miss: '#ff5050' }[r.res];
      if (r.res !== 'miss') { ctx.globalAlpha = Math.max(0, 1 - k * 1.6); ctx.lineWidth = r.res === 'perf' ? 9 : 6; ctx.strokeStyle = col; ctx.beginPath(); ctx.arc(r.x, r.y, q.RT + k * (r.res === 'perf' ? 110 : 70), 0, 7); ctx.stroke(); }
      else {   // 失誤：紅色叉叉
        const s = 1 + (1 - Math.min(1, k * 5)) * .6; ctx.globalAlpha = Math.max(0, 1 - k); ctx.strokeStyle = '#ff3a3a'; ctx.lineWidth = 7; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(r.x - 18 * s, r.y - 18 * s); ctx.lineTo(r.x + 18 * s, r.y + 18 * s); ctx.moveTo(r.x + 18 * s, r.y - 18 * s); ctx.lineTo(r.x - 18 * s, r.y + 18 * s); ctx.stroke(); ctx.lineCap = 'butt';
      }
      ctx.globalAlpha = Math.max(0, 1 - k);
      if (r.res === 'perf') {   // 完美：毛筆字放大彈出
        const s = 1 + (1 - easeO(Math.min(1, k * 4))) * .9; ctx.save(); ctx.translate(r.x, r.y - 44 - k * 16); ctx.scale(s, s);
        ctx.font = `${LI === 2 ? 30 : 38}px ${BRUSH}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineWidth = 6; ctx.strokeStyle = '#6a120c'; ctx.strokeText(t('qte_perf'), 0, 0); ctx.fillStyle = '#ffe28a'; ctx.fillText(t('qte_perf'), 0, 0); ctx.restore();
      } else txt(t('qte_' + r.res), r.x, r.y - 30 - k * 20, 24 * (LI === 2 ? .8 : 1), col, 'center', '#000', 5);
      ctx.globalAlpha = 1;
    }
  }
  // 失誤：外圈碎成弧形碎片飛散
  for (const o of q.shards) {
    const d = o.r + o.v * o.t; ctx.save(); ctx.globalAlpha = Math.max(0, 1 - o.t / .5); ctx.translate(o.x + Math.cos(o.a) * d, o.y + Math.sin(o.a) * d); ctx.rotate(o.a + Math.PI / 2 + o.rot);
    ctx.strokeStyle = '#ff7a6a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, o.r, o.r, -Math.PI / 2 - .2, -Math.PI / 2 + .2); ctx.stroke(); ctx.restore();
  }
  // 火花（完美＝金色、良＝白色）
  for (const o of q.sparks) { ctx.globalAlpha = Math.max(0, 1 - o.t / o.life); ctx.fillStyle = o.c; ctx.beginPath(); ctx.arc(o.x, o.y, o.s, 0, TAU); ctx.fill(); }
  ctx.globalAlpha = 1;
  // 點擊漣漪
  for (const o of q.rip) { const k = o.t / .4; ctx.strokeStyle = `rgba(255,255,255,${.8 * (1 - k)})`; ctx.lineWidth = 3 * (1 - k) + 1; ctx.beginPath(); ctx.arc(o.x, o.y, 8 + k * 46, 0, TAU); ctx.stroke(); }
  if (q.wf > 0) { ctx.fillStyle = `rgba(255,255,255,${q.wf / .12 * .55})`; ctx.fillRect(0, 0, W, H); }   // 完美：閃白
  if (q.allP != null && q.allP < 1.2) txt(t('qte_allp'), W / 2, H * .25, 26 * (LI === 2 ? .8 : 1), '#ffd27a', 'center', '#c0262d', 6);
  // 標題與三次結果
  txt(t('qte_n'), W / 2, H * .76, 46 * (LI === 2 ? .8 : 1), '#fff', 'center', '#c0262d', 8);
  txt(t('qte_hint'), W / 2, H * .82, 14, '#ffd27a', 'center', '#000', 3);
  for (let i = 0; i < q.cnt; i++) {
    const res = q.log[i], x = W / 2 + (i - 1) * 30, y = H * .87;
    if (res === 'perf') { const pu = .5 + .5 * Math.sin(q.t * 9 + i); ctx.fillStyle = `rgba(255,210,90,${.25 + .25 * pu})`; ctx.beginPath(); ctx.arc(x, y, 12 + 3 * pu, 0, 7); ctx.fill(); }   // 完美：脈動的光暈
    ctx.fillStyle = { perf: '#ffd27a', good: '#fff', miss: '#ff5050' }[res] || 'rgba(255,255,255,.25)';
    ctx.beginPath(); ctx.arc(x, y, 7, 0, 7); ctx.fill();
  }
  if (q.fl > 0) { ctx.fillStyle = `rgba(255,30,30,${q.fl})`; ctx.fillRect(0, 0, W, H); }
}

// 遊戲畫面中的魔王：攻擊預兆、暈眩、受擊閃白
function drawBossWorld(b) {
  drawBossAtk(b);
  if (b.trail) b.trail.forEach((o, i) => { ctx.save(); ctx.globalAlpha = .08 + i * .05; drawBoss(b, o.x, o.y + (b.trail.length - i) * 14, 1); ctx.restore(); });   // 逃走時的殘影
  ctx.save(); ctx.translate(b.x, b.y);
  if (b.stun > 0) ctx.rotate(Math.sin(g.t * 7) * .14);
  drawBoss(b, 0, 0, 1);
  ctx.restore();
  if (b.flash > 0) drawSil(b.x, b.y, 150, 150, 75, 75, 'rgba(255,255,255,.85)', c2 => drawBoss(b, 0, 0, 1, c2));
  if (b.stun > 0) {
    for (let i = 0; i < 3; i++) { const an = g.t * 4 + i * 2.09; txt('★', b.x + Math.cos(an) * 34, b.y - 44 + Math.sin(an) * 9, 14, '#ffe27a', 'center', '#000', 2); }
    if (Math.sin(g.t * 10) > -.3) txt(t('boss_stun_tap'), b.x, b.y + 62, 14, '#ffd27a', 'center', '#000', 3);
  }
}
function drawBossAtk(b) {
  const a = b.atk; if (!a) return;
  const y0 = g.camY, wv = a.ph === 'warn', bl = .5 + .5 * Math.sin(g.t * 28);
  ctx.save();
  if (a.k === 'club') for (const x of a.xs) {
    if (wv) {
      ctx.fillStyle = `rgba(230,40,30,${.12 + .12 * bl})`; ctx.fillRect(x - a.w / 2, y0, a.w, H);
      ctx.strokeStyle = 'rgba(255,90,70,.85)'; ctx.lineWidth = 2; ctx.setLineDash([8, 6]); ctx.strokeRect(x - a.w / 2, y0 - 4, a.w, H + 8); ctx.setLineDash([]);
    } else {
      const k = clamp(a.t / .3, 0, 1);
      ctx.fillStyle = `rgba(255,120,80,${.5 * k})`; ctx.fillRect(x - a.w / 2, y0, a.w, H);
      ctx.fillStyle = `rgba(255,245,230,${.9 * k})`; ctx.fillRect(x - a.w * .22, y0, a.w * .44, H);
    }
  }
  else if (a.k === 'mist') for (const c of a.cs) {
    if (wv) {
      ctx.fillStyle = `rgba(160,90,230,${.1 + .1 * bl})`; ctx.beginPath(); ctx.arc(c.x, c.y, a.r, 0, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(200,140,255,.9)'; ctx.lineWidth = 2; ctx.setLineDash([7, 6]); ctx.stroke(); ctx.setLineDash([]);
    } else {
      const k = clamp(a.t / 1.3, 0, 1);
      for (let i = 0; i < 6; i++) { const an = g.t * 1.5 + i * 1.05; ctx.fillStyle = `rgba(150,80,220,${.22 * Math.min(1, k * 3)})`; ctx.beginPath(); ctx.arc(c.x + Math.cos(an) * a.r * .4, c.y + Math.sin(an) * a.r * .35, a.r * .6, 0, 7); ctx.fill(); }
    }
  }
  else if (a.k === 'snow') {
    const x0 = a.side < 0 ? WALL : W / 2, w = W / 2 - WALL;
    if (wv) {
      ctx.fillStyle = `rgba(150,215,255,${.1 + .12 * bl})`; ctx.fillRect(x0, y0, w, H);
      ctx.strokeStyle = 'rgba(190,235,255,.9)'; ctx.lineWidth = 2; ctx.setLineDash([8, 6]); ctx.strokeRect(x0, y0 - 4, w, H + 8); ctx.setLineDash([]);
      txt(a.side < 0 ? '≪≪' : '≫≫', x0 + w / 2, y0 + H * .5, 30, 'rgba(220,245,255,.8)', 'center', '#000', 3);
    } else {
      const k = clamp(a.t / .4, 0, 1);
      ctx.fillStyle = `rgba(225,245,255,${.55 * k})`; ctx.fillRect(x0, y0, w, H);
      ctx.strokeStyle = `rgba(255,255,255,${k})`; ctx.lineWidth = 2;
      for (let i = 0; i < 14; i++) { const yy = y0 + ((i * 97 + g.t * 900) % H), xx = x0 + ((i * 53) % w); ctx.beginPath(); ctx.moveTo(xx, yy); ctx.lineTo(xx - a.side * 40, yy + 8); ctx.stroke(); }
    }
  }
  else if (a.k === 'charge' && wv) {
    const dx = a.tx - b.x, dy = a.ty - b.y, d = Math.hypot(dx, dy) || 1, ex = b.x + dx / d * (d + 70), ey = b.y + dy / d * (d + 70);
    ctx.strokeStyle = `rgba(230,40,30,${.18 + .12 * bl})`; ctx.lineWidth = b.r * 2 + 10; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(ex, ey); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,90,70,.9)'; ctx.lineWidth = 2; ctx.setLineDash([8, 6]); ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(ex, ey); ctx.stroke(); ctx.setLineDash([]);
    ctx.lineCap = 'butt';
  }
  ctx.restore();
}

function drawKill() {
  const t = 1.5 - g.killT;
  ctx.fillStyle = t < .1 ? '#fff' : 'rgba(0,0,0,.85)'; ctx.fillRect(0, 0, W, H);
  if (t >= .1) {
    ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(-.5);
    ctx.fillStyle = '#c0262d'; ctx.fillRect(-300, -3 - t * 2, 600, 6 + t * 4); ctx.restore();
    ctx.save(); ctx.globalAlpha = Math.max(0, 1 - t); drawBoss(g.boss, W / 2 - t * 40, H / 2 - t * 40, 3); ctx.restore();
    ctx.globalAlpha = 1;
    const s = Math.min(1, (t - .1) * 5);
    // 四字詞改在之後的居合一閃出現（drawFin），這裡只播斬擊特寫
  }
}
// 擊破魔王時的四字詞（每次隨機一個）
const KILL_WORDS = ['橫掃千軍', '戰無不勝', '勢如破竹', '克敵制勝', '攻無不克', '銳不可當', '掃穴犁庭', '手刃強敵'];

// 最外層背景色：iOS 狀態列下方的模糊帶會沾到這個顏色，所以用畫面頂端的顏色
// （標題＝夜空深綠、遊戲中＝HUD 深藍），避免頂端出現紅色霧罩
let rootBg = '';
function syncRootBg() {
  const c = (state === 'menu' || !g) && INTRO.ph === 'title' ? '#161c1e' : state === 'menu' || !g ? '#000' : '#0a0d14';
  if (c === rootBg) return;
  rootBg = c;
  document.documentElement.style.background = document.body.style.background = c;
}

function render() {
  syncRootBg();
  const sc = cv.width / W;
  ctx.setTransform(sc, 0, 0, cv.height / H, 0, 0);
  const t = performance.now() / 1000;
  if (state === 'menu' || !g) {
    INTRO.draw();   // 開場（團隊 LOGO／過場）或標題背景（cut.js）
    return;
  }
  const camY = g.camY;
  drawBG(camY, g.th, g.t);
  drawWalls(camY, g.th);
  drawTOD();   // 舞台時段的色調（levels.js）
  ctx.save();
  if (g.shake > 0) ctx.translate(rnd(-g.shake, g.shake) * .5, rnd(-g.shake, g.shake) * .5);
  ctx.translate(0, -camY);
  for (const pl of g.plats) if (pl.y - camY > -20 && pl.y - camY < H + 20) drawPlat(pl);
  for (const it of g.items) drawItem(it);
  for (const o of g.corpses) drawCorpse(o);   // 斬成兩半的敵人
  for (const e of g.enemies) if (!e.dead) drawEnemy(e.x, e.y, e.type, 1, e.ph, e);
  for (const e of g.enemies) if (!e.dead) {   // 夢幻術：飄出 Z；雪華封：冰塊
    if (e.sleep > 0) { const k = (g.t * 1.2 + e.ph) % 1; ctx.globalAlpha = 1 - k; txt('z', e.x + 10 + k * 10, e.y - 22 - k * 18, 12 + k * 6, '#d8c0ff', 'center', '#000', 2); ctx.globalAlpha = 1; }
    if (e.frozen > 0) { const ed = ENEMY[e.type]; ctx.fillStyle = 'rgba(190,234,255,.45)'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(e.x - ed.w / 2 - 4, e.y - ed.h / 2 - 4, ed.w + 8, ed.h + 8, 5); else ctx.rect(e.x - ed.w / 2 - 4, e.y - ed.h / 2 - 4, ed.w + 8, ed.h + 8); ctx.fill(); ctx.stroke(); }
  }
  if (g.boss && state !== 'kill' && state !== 'fin') drawBossWorld(g.boss);
  const p = g.p;
  if (g.kongo > 0) {   // 金剛身：金色光環
    const a = Math.min(1, g.kongo) * (.55 + .25 * Math.sin(g.t * 20));
    ctx.strokeStyle = `rgba(255,214,90,${a})`; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(p.x, p.y - 22, 30 + Math.sin(g.t * 12) * 2, 0, TAU); ctx.stroke();
    ctx.fillStyle = `rgba(255,214,90,${a * .25})`; ctx.fill();
  }
  // 殘影
  for (const o of g.ghosts) {
    ctx.save(); ctx.globalAlpha = .45 * (1 - o.t / .25);
    drawNinja(o.x, o.y, { face: o.face, t: g.t, vy: -500, skin: save.skin });
    ctx.restore();
  }
  if (p.dive) {
    ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 2;
    for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(p.x + i * 9, p.y - 60); ctx.lineTo(p.x + i * 9, p.y - 110); ctx.stroke(); }
  }
  if (state === 'dying') { ctx.save(); ctx.translate(p.x, p.y - 20); ctx.rotate(g.t * 10 + (1.1 - g.dieT) * 12); drawNinja(0, 20, { face: p.face, t: g.t, vy: 0, skin: save.skin }); ctx.restore(); }
  else if (!(g.zi && g.zi.hide)) drawNinja(p.x, p.y, { face: p.face, t: g.t, vy: p.vy, sq: p.sq, inv: p.inv, fly: g.fly > 0, slow: p.slow, freeze: p.freeze, skin: save.skin, dash: p.dash > 0, dvx: p.dvx, dvy: p.dvy, dive: p.dive, spin: p.spin, hurt: p.hurt, swing: p.swing > 0 ? 1 - p.swing / SWING_T : null });
  for (const s of g.shots) drawPlayerShot(s);
  drawSkillFx();
  for (const f of g.fires) drawFireTrail(f); for (const m of g.mists) drawIceMist(m);   // 火關的火焰、山關的冰霧
  for (const s of g.eshots) drawEShot(s);   // 敵方攻擊
  for (const o of g.fx) drawSlashFx(o);     // 斬痕
  for (const o of g.booms) drawBoom(o);     // 爆炸／衝擊波
  ctx.globalAlpha = 1;
  drawParts();
  for (const o of g.puffs) drawPuff(o);     // 敵人消失的煙
  ctx.globalAlpha = 1;
  for (const tx of g.texts) if (!tx.screen) { ctx.globalAlpha = clamp(1.1 - tx.t, 0, 1); txt(tx.s, tx.x, tx.y, tx.size, tx.c, 'center', '#000', 3); }
  ctx.globalAlpha = 1;
  if (inp.mode === 'aim' && state === 'play') drawAim();
  ctx.restore();
  drawZone(camY, g.th, g.t);
  drawWeather();   // 天候（levels.js）
  for (const tx of g.texts) if (tx.screen) { ctx.globalAlpha = clamp(1.1 - tx.t, 0, 1); txt(tx.s, W / 2, H * .22 + tx.y - tx.t * 20, tx.size, tx.c, 'center', '#000', 4); }
  ctx.globalAlpha = 1;
  if (g.fly > 0 && state === 'play') { ctx.fillStyle = 'rgba(255,220,120,.12)'; ctx.fillRect(0, 0, W, H); }
  if (g.jfx) { ctx.globalAlpha = Math.max(0, g.jfx.t) * .4; ctx.fillStyle = g.jfx.col; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }   // 忍法發動的閃光
  if (g.kishinT > 0) drawKishin(1 - g.kishinT / .7);
  if (g.fever > 0) { // 狂熱：金色外框
    ctx.strokeStyle = `rgba(255,200,60,${.5 + .3 * Math.sin(g.t * 12)})`; ctx.lineWidth = 10; ctx.strokeRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(255,200,60,.08)'; ctx.fillRect(0, 0, W, H);
  }
  if (state === 'slash') drawSlash();
  else if (state === 'cast') drawCast();
  else if (state === 'qte') drawQte();
  else if (state === 'kill') drawKill();
  else if (state === 'flee') drawFlee();
  else if (state === 'fin') drawFin();
  else if (state === 'zintro') drawZIntro();
  else if (state === 'ascend') drawAscend();
  if (state !== 'slash' && state !== 'cast' && state !== 'qte' && state !== 'kill' && state !== 'fin') { drawHUD(); if (state === 'play' || state === 'zintro') drawScrollBtn(); }
  sideHudTick();
  if (state === 'play') drawBanner();
  if (g.tut && state !== 'slash' && state !== 'cast') drawTutorial();
  if (inp.mode === 'aim' && state === 'play') drawSling();
}

// ===== 主迴圈 =====
let lastT = performance.now();
function frame(now) {
  const dt = Math.min(.033, (now - lastT) / 1000); lastT = now;
  update(dt); render();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// ===== UI =====
const SCRS = ['title', 'pause', 'perk', 'over', 'shop', 'rank', 'opt', 'help', 'clear', 'credit', 'hist', 'lvsel'];
let backTo = 'title';
function show(id, keep) { if (!keep) hideAll(); $(id).classList.add('on'); }
function hide(id) { $(id).classList.remove('on'); }
function hideAll() { SCRS.forEach(hide); }
function goTitle() {
  state = 'menu'; g = null; paused = false;
  if (W_LOCK) { W_LOCK = false; resize(); }
  $('tCoins').textContent = save.coins;
  // 開場演出還沒播完時先不顯示標題選單（由 INTRO.toTitle() 接上）
  if (INTRO.ph !== 'title') { hideAll(); $('intro').classList.remove('play'); musicFor(); return; }
  show('title'); INTRO.poke();
  musicFor();
  playIntro();
}
function playIntro() { const it = $('intro'); it.classList.remove('play', 'hero-in', 'hero-out'); void it.offsetWidth; it.classList.add('play'); INTRO.heroFront(); }
function pauseGame() { if (!g || paused || state === 'over' || state === 'perk' || state === 'menu' || state === 'clearq') return; paused = true; renderPauseSkills(); show('pause', true); }
// 暫停畫面：列出目前的自動技能（等級／進化）與秘傳（被動）
function renderPauseSkills(el = $('pauseSk')) {
  if (!el || !g) return;
  const sks = SKILLS.filter(s => sk(s.id)).map(s => {
    const l = sk(s.id), evo = l > SK_MAX, nm = evo ? L(EVO[s.id].n) : L(s.n), ic = evo ? EVO[s.id].ic : s.ic;
    const pips = evo ? '<em class="ps-evo">EVO</em>' : `<span class="ps-pips">${'●'.repeat(l)}${'○'.repeat(SK_MAX - l)}</span>`;
    return `<div class="ps-row ${evo ? 'evo' : ''}"><span class="ps-ic">${ic}</span><b>${nm}</b>${pips}</div>`;
  }).join('');
  const pks = PERKS.filter(p => pk(p.id)).map(p => `<span class="ps-perk" title="${L(p.d)}">${p.ic} ${L(p.n)}${p.max > 1 && p.max < 99 ? ` <small>${pk(p.id)}/${p.max}</small>` : ''}</span>`).join('');
  el.innerHTML = `<div class="ps-head">${t('ps_skills', Object.keys(g.skills).length, SK_SLOTS)}<small>Lv ${g.lv}</small></div>` + (sks || `<div class="ps-none">—</div>`) +
    `<div class="ps-head">${t('ps_perks')}</div>` + (pks ? `<div class="ps-perks">${pks}</div>` : `<div class="ps-none">—</div>`);
}
function resumeGame() { paused = false; hide('pause'); hide('help'); inp.dx = 0; lastT = performance.now(); }

function showOver() {
  state = 'over';
  const sc = score(), h = Math.floor(g.top / 10), coins = Math.floor(g.coins);
  save.coins += coins; save.stats.coins += coins; save.stats.runs++;
  const nr = sc > save.best.rogue;
  if (nr) save.best.rogue = sc;
  const list = save.rank.rogue;
  list.push({ s: sc, h, d: new Date().toLocaleDateString(), st: g.stage, lv: g.lvl });
  list.sort((a, b) => b.s - a.s); list.length = Math.min(list.length, 10);
  unlock('run1');
  if (save.stats.coins >= 500) unlock('coin500');
  if (save.stats.coins >= 5000) unlock('coin5000');
  if (save.stats.coins >= 20000) unlock('coin20000');
  if (save.stats.runs >= 10) unlock('runs10');
  if (save.stats.runs >= 50) unlock('runs50');
  if (save.stats.runs >= 100) unlock('runs100');
  collAch();
  persist();
  $('overTitle').textContent = g.cleared ? t('over_clear') : t('over_fail');
  // 成績卡片：分數＋新紀錄，下面六格（高度、斬殺、最大連斬、到達舞台、魔王、最佳紀錄）
  const card = (ic, v, k) => `<div class="ov-st"><em>${ic}</em><b>${v}</b><small>${t(k)}</small></div>`;
  $('overBody').innerHTML =
    `<div class="sc">${sc.toLocaleString()}</div>${nr ? `<span class="nr">${t('new_record')}</span>` : ''}` +
    `<div class="ov-grid">` +
    card('⛰️', h + 'm', 'st_h') + card('⚔️', g.kills, 'st_kill') + card('⚡', g.maxCombo, 'st_combo') +
    card('🏯', THEMES[g.th].k + ' ' + (g.stage + 1) + '/' + ST_N, 'st_reach') + card('👹', g.bossN, 'st_boss') + card('🏆', save.best.rogue.toLocaleString(), 'st_best') +
    `</div>`;
  $('overCoins').innerHTML = t('over_coins', coins, save.coins);
  const jm = g.makiGot != null && JUTSU.find(j => j.th === g.makiGot);   // 這一局拿到的卷軸
  $('overReach').innerHTML = jm ? `<span class="ov-maki">📜 ${t('over_maki', t('maki_' + g.makiGot), t('ju_' + jm.id))}</span>` : t('over_reach2', THEMES[g.th].k, stageName(g.stage));
  if (typeof adCoinsBtn === 'function') adCoinsBtn(coins);   // 看廣告，小判 ×2（ads.js）
  if (ac && musV()) { BGM.setVol(musV()); BGM.jingle(ac, g.cleared ? 'clear' : 'fail'); }   // 收尾短曲：任務達成／修行中斷（music.js）
  show('over');
}

function openHelp() {
  buildHelpIcons(); renderHelp();   // 分類分頁的玩法說明（help.js）
  backTo = (g && state !== 'over') ? 'game' : 'title';
  $('helpBtn').textContent = backTo === 'game' ? (paused && $('pause').classList.contains('on') ? t('back') : t('help_go')) : t('help_ok');
  show('help', backTo === 'game' || (state === 'menu' && $('title').classList.contains('on')));
}

// 把 HTML 裡 data-i18n 的元素換成目前語言
function applyLang() {
  document.documentElement.lang = ['zh-Hant', 'ja', 'en'][LI];
  for (const el of document.querySelectorAll('[data-i18n]')) el.innerHTML = t(el.dataset.i18n);
  if (typeof dockPlate === 'function' && document.querySelector('.scroll-ic')) buildDockIcons();   // 圖示上的文字也跟著換語言
}

// 商店
let shopTab = 0;
function tabs(id, names, sel, act) {
  $(id).innerHTML = names.map((n, i) => `<button class="${i === sel ? 'sel' : ''}" data-act="${act}" data-arg="${i}">${n}</button>`).join('');
}
function renderShop() {
  $('sCoins').textContent = save.coins;
  tabs('shopTabs', [t('tab_ninja'), t('tab_outfit'), t('tab_train')], shopTab, 'stab');
  let h = '';
  if (shopTab === 0) {   // 角色：達成條件才上架，再用小判購買
    h = SKINS.map((s, i) => {
      const own = TEST_FREE || save.skins.includes(i), sel = save.skin === i, avail = own || !s.req || save.ach[s.req], sd = SKILLS.find(x => x.id === s.sk);
      const req = s.req && !avail ? `<small class="req">🔒 ${t('char_req', L(ACH.find(a => a.id === s.req).d))}</small>` : '';
      return `<div class="item ${avail ? '' : 'locked'}"><span class="ic char-ic">${avail && heroThumb(i) ? `<img src="${heroThumb(i)}" alt="">` : '？'}</span><span class="nm"><b>${avail ? L(s.n) : '？？？'}</b><small>${t('start_skill', sd.ic + ' ' + L(sd.n))}${avail ? '・' + (own ? t('owned') : t('price', s.cost)) : ''}</small>${req}</span>` +
        (sel ? `<button disabled>${t('equipped')}</button>` : own ? `<button data-act="skin" data-arg="${i}">${t('equip')}</button>` : `<button data-act="buyskin" data-arg="${i}" ${!avail || save.coins < s.cost ? 'disabled' : ''}>${t('buy')}</button>`) + '</div>';
    }).join('');
  } else if (shopTab === 1) {   // 換裝：目前角色穿上各種顏色的預覽
    const ci = save.skin, cur = outOf(ci);
    h = `<div class="meta-head">${t('outfit_for', L(SKINS[ci].n))}</div><div class="outfits">` + [SKINS[ci].out, ...OUTFITS.map((_, k) => k).filter(k => k !== SKINS[ci].out)].map(i => {   // 第一格固定是這名角色的預設顏色
      const o = OUTFITS[i], def = i === SKINS[ci].out;
      const own = outOwned(i, ci), sel = cur === i;
      return `<button class="of ${sel ? 'sel' : ''} ${own ? '' : 'nown'}" data-act="${own ? 'outfit' : 'buyout'}" data-arg="${i}" ${!own && save.coins < o.cost ? 'disabled' : ''}><img src="${outThumb(ci, i)}" alt="">${def ? `<em class="of-def">${t('outfit_def')}</em>` : ''}<b style="color:${o.suit}">${L(o.n)}</b><small>${sel ? t('equipped') : own ? t('equip') : t('price', o.cost)}</small></button>`;
    }).join('') + '</div>';
  } else {
    const tot = META.reduce((s, m) => s + m.max, 0), now = META.reduce((s, m) => s + mt(m.id), 0), spent = metaSpent();
    h = `<div class="meta-head">${t('meta_total', now, tot)}</div>` + META.map(m => {
      const l = mt(m.id), max = l >= m.max, c = metaCost(m, l), op = metaOpen(m);
      if (!op) return `<div class="item locked"><span class="ic" style="background:#ccc">🔒</span><span class="nm"><b>${L(m.n)}</b><small>${t(META_TIER[m.id] === 1 ? 'meta_t1' : 'meta_t2')}</small></span><button disabled>${t('train')}</button></div>`;
      return `<div class="item"><span class="ic" style="background:#fff3d0">${m.ic}</span><span class="nm"><b>${L(m.n)}　Lv ${l}/${m.max}</b><small>${L(m.d)}${max ? '' : '・' + t('price', c)}</small></span><button data-act="buymeta" data-arg="${m.id}" ${max || save.coins < c ? 'disabled' : ''}>${max ? 'MAX' : t('train')}</button></div>`;
    }).join('') + ((spent || (TEST_FREE && now)) ? `<button class="meta-refund" data-act="refund">${t('meta_refund', spent)}</button>` : '');
  }
  $('shopBody').innerHTML = h;
}
// 排行
let rankTab = 0;
function renderRank() {
  tabs('rankTabs', [t('tab_rank'), t('tab_ach')], rankTab, 'rtab');
  let h = '';
  if (rankTab === 0) {
    const l = save.rank.rogue;
    h = l.length ? l.map((r, i) => `<div class="rk"><span>${i + 1}</span><span>${r.s.toLocaleString()}</span><span>${r.h}m・${r.d}</span></div>`).join('') : `<div class="empty">${t('no_record')}</div>`;
  } else {
    // 分類顯示，最上面是達成數
    const got = ACH.filter(a => save.ach[a.id]).length;
    h = `<div class="meta-head">${t('ach_count', got, ACH.length)}</div>`;
    t('ach_cat').forEach((cn, ci) => {
      const list = ACH.filter(a => a.cat === ci), n = list.filter(a => save.ach[a.id]).length;
      h += `<div class="ach-cat">${cn}<small>${n}/${list.length}</small></div>` + list.map(a => `<div class="item ${save.ach[a.id] ? '' : 'locked'}"><span class="ic" style="background:${save.ach[a.id] ? '#ffd27a' : '#ccc'}">🏆</span><span class="nm"><b>${L(a.n)}</b><small>${L(a.d)}</small></span></div>`).join('');
    });
  }
  $('rankBody').innerHTML = h;
}
function renderOpt() {
  // 音量：5 格，點格子直接設定（再點同一格＝靜音到那格以下）
  for (const [k, id] of [['mus', 'segMus'], ['sfx', 'segSfx']])
    $(id).innerHTML = [1, 2, 3, 4, 5].map(i => `<button class="${save.opt[k] >= i ? 'on' : ''}" data-act="vol" data-arg="${k}=${i}" aria-label="${i}"></button>`).join('');
  $('bVib').classList.toggle('on', !!save.opt.vib);
  $('langPills').innerHTML = LANGS.map((l, i) => `<button class="${i === LI ? 'on' : ''}" data-act="setlang" data-arg="${i}">${['中', '日', 'EN'][i] || l.name}</button>`).join('');
  const bf = $('bFull'); bf.style.display = TEST_FREE ? '' : 'none'; bf.textContent = t('full_test', hasFull() ? t('full_own') : t('full_none'));   // 測試模式才顯示
  const r = $('bReset'); delete r.dataset.armed; $('bResetT').textContent = t('reset');
}

let menuFrom = 'title';
function openSub(id) {
  if (id === 'lvsel') return openLvSel();
  menuFrom = $('over').classList.contains('on') ? 'over' : 'title';
  if (id === 'shop') renderShop();
  if (id === 'rank') renderRank();
  if (id === 'opt') { renderOpt(); resize(); }
  show(id, menuFrom === 'title' && state === 'menu');   // 從主畫面打開時保留主畫面在底下，關掉後不必重演開場、可以立刻再選
}

document.addEventListener('click', e => {
  const b = e.target.closest('[data-act]'); if (!b || b.disabled) return;
  A(); SFX.click();
  const a = b.dataset.act, arg = b.dataset.arg;
  switch (a) {
    case 'start': if (!save.tut) startTutorial(); else openLvSel(); break;   // 第一次開始：先進新手教學（tutorial.js），之後進選關
    case 'tutorial': startTutorial(); break;
    case 'tutskip': if (g && g.tut) endTutorial(false); break;
    case 'retry': startRun(); break;
    case 'lvgo': if (lvPaid(+arg)) openFull('lv'); else startRun(+arg); break;
    case 'fullinfo': openFull('lv'); break;   // 完整版（levels.js）
    case 'jutsu': save.jutsu = arg; persist(); renderJutsuPick(); break;   // 選關畫面：選擇帶進關卡的忍法
    case 'jutsulock': toast(t('ju_locked', lvName(LEVELS.findIndex(l => l.th === +arg)))); break;
    case 'fullbuy': buyFull(); break;
    case 'fullclose': closeFull(); break;
    case 'contad': contWatch(); break;   // 看廣告復活（ads.js）
    case 'contgive': contResult(false); break;
    case 'adcoins': adCoinsWatch(); break;
    case 'privacy': window.open('https://arcconceptgames.github.io/ninjatobi/privacy/?lang=' + ['zh', 'ja', 'en'][LI], '_blank', 'noopener'); break;   // 隱私權政策（官網，原始檔在 site/ninjatobi，用 tools/deploy-site.sh 發佈）
    case 'fulltest': save.full = !hasFull(); persist(); renderOpt(); break;   // 測試模式：切換是否擁有完整版
    case 'lvlock': toast(t('lv_locked')); break;
    case 'shop':
      if (b.classList.contains('shop-corner')) {   // 主畫面寶箱：打開蓋子、噴出金光，0.4 秒後才進商店
        if (b.classList.contains('opening')) break;
        const im = $('shopIc'); if (im && im.dataset.open) im.src = im.dataset.open;
        b.classList.add('opening'); SFX.coin && SFX.coin(); vib(20);
        setTimeout(() => { openSub('shop'); setTimeout(() => { b.classList.remove('opening'); const m = $('shopIc'); if (m && m.dataset.shut) m.src = m.dataset.shut; }, 500); }, 420);
        break;
      }
      openSub(a); break;
    case 'rank': case 'opt': openSub(a); break;
    case 'replay': INTRO.replay(); break;   // 設定頁：重看開場
    case 'credit': openSub('credit'); break;   // 製作名單（help.js）
    case 'hist': openHist(); break;                                   // 了解歷史（history.js）
    case 'hist-tab': histTab = +b.dataset.arg; SFX.click(); renderHist(); break;
    case 'hp-prev': helpPage(-1); break;       // 玩法說明：上一頁／下一頁
    case 'hp-next': helpPage(1); break;
    case 'help': openHelp(); break;
    case 'back':
      if ($('help').classList.contains('on') && backTo === 'game') { hide('help'); if (!$('pause').classList.contains('on')) resumeGame(); break; }
      if (menuFrom === 'over' && g) { show('over'); menuFrom = 'title'; break; }
      if (state === 'menu' && $('title').classList.contains('on')) { SCRS.forEach(s => { if (s !== 'title') hide(s); }); break; }   // 回到還開著的主畫面：直接關掉子畫面
      goTitle(); break;
    case 'title': goTitle(); break;
    case 'resume': resumeGame(); break;
    case 'quit': if (g && g.tut) { endTutorial(false); break; } if (g) { paused = false; hideAll(); showOver(); } else goTitle(); break;

    case 'finish': hide('clear'); showOver(); break;
    case 'perk': choosePerk(+arg); break;
    case 'reroll': g.rerolls--; openPerks(perkWhy); break;
    case 'stab': shopTab = +arg; renderShop(); break;
    case 'rtab': rankTab = +arg; renderRank(); break;
    case 'skin': save.skin = +arg; persist(); renderShop(); updateHeroArt(); resetHelpIcons(); break;
    case 'outfit': if (!save.charOut) save.charOut = {}; save.charOut[save.skin] = +arg; persist(); refreshHero(); renderShop(); break;
    case 'buyout': { const o = OUTFITS[+arg]; if (save.coins >= o.cost && !outOwned(+arg)) { save.coins -= o.cost; save.outfits.push(+arg); if (!save.charOut) save.charOut = {}; save.charOut[save.skin] = +arg; persist(); SFX.item(); refreshHero(); collAch(); } renderShop(); break; }
    case 'buyskin': { const s = SKINS[+arg]; if (s.req && !save.ach[s.req]) break; if (save.coins >= s.cost) { save.coins -= s.cost; save.skins.push(+arg); save.skin = +arg; persist(); SFX.item(); collAch(); } renderShop(); updateHeroArt(); resetHelpIcons(); break; }
    case 'buymeta': { const m = META.find(x => x.id === arg), c = metaCost(m, mt(arg)); if (save.coins >= c && mt(arg) < m.max) { save.coins -= c; save.meta[arg] = mt(arg) + 1; persist(); SFX.item(); collAch(); } renderShop(); break; }
    case 'refund':   // 修行全部歸零、退還小判（按兩次確認）
      if (b.dataset.armed) { save.coins += metaSpent(); for (const m of META) save.meta[m.id] = 0; persist(); SFX.coin(); renderShop(); }
      else { b.dataset.armed = '1'; b.textContent = t('meta_refund_ok'); }
      break;
    case 'banish': g.banishMode = !g.banishMode; $('perkCards').classList.toggle('banishing', g.banishMode); break;
    case 'vol': {   // 音量：「mus:-1」＝減一格、「sfx=3」＝設成第 3 格（點已亮的最上面那格＝往下一格，可以點到靜音）
      const [k, v] = arg.split(/[:=]/), cur = save.opt[k];
      let n = arg.includes(':') ? cur + +v : (+v === cur ? cur - 1 : +v);
      save.opt[k] = clamp(n, 0, 5); persist(); renderOpt(); A(); musicFor();
      if (k === 'sfx') SFX.coin();   // 試聽
      break;
    }
    case 'vib': save.opt.vib ^= 1; persist(); renderOpt(); vib(60); break;
    case 'setlang': LI = +arg; save.opt.lang = LANGS[LI].id; persist(); applyLang(); renderOpt(); buildDockIcons(); break;
    case 'reset': // 按兩次才重置（不用 confirm()，部分嵌入環境不會顯示對話框）
      if (b.dataset.armed) { const lang = save.opt.lang; save = defSave(); save.opt.lang = lang; persist(); renderOpt(); toast(t('reset_done')); }
      else { b.dataset.armed = '1'; $('bResetT').textContent = t('reset_confirm'); setTimeout(renderOpt, 3000); }
      break;
  }
});

applyLang();
try { document.fonts.load('80px "Yuji Boku"', '豪天翔任務達成金剛身夢幻術雪華封鬼神斬風林火山之卷軸秘忍臨兵闘者皆陣烈在前橫掃千軍戰無不勝勢如破竹克敵制攻銳可當穴犁庭手刃強完美璧'); } catch (e) { }   // 先載好豪天翔卷軸的毛筆字（canvas 不會自己等字型）
buildHeroArt();   // 產生標題大圖與商店頭像（程式畫的主角）
goTitle();
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => { });
window.__tobi = { get g() { return g; }, get state() { return state; }, startRun, spawnBoss: () => spawnBoss(), save: () => save, inp,
  step(sec, dt = 1 / 60, draw = true) { for (let t = 0; t < sec; t += dt) update(dt); if (draw) render(); } };
// ===== iPad／電腦橫向：兩側的資訊欄（左：分數、關卡、技能與秘傳；右：豪天翔大按鈕） =====
const SH = { t: 0, key: '' };
function sideHudTick() {
  const on = document.body.classList.contains('pillar') && g && !g.tut && (state === 'play' || state === 'zintro' || state === 'ascend' || state === 'slash' || state === 'cast' || state === 'qte' || state === 'kill' || state === 'flee' || state === 'fin');
  document.body.classList.toggle('shud', !!on);
  if (!on) return;
  const now = performance.now(); if (now - SH.t < 250) return; SH.t = now;
  $('shStats').innerHTML = `<div class="sh-lv"><b>${'林風火山'[g.th] || ''}</b><span>${L(LEVELS[g.lvl] ? LEVELS[g.lvl].motto : ['', '', ''])}</span><em>${g.stage + 1} / 10</em></div>` +
    `<div class="sh-row"><span>✦</span><b>${score()}</b></div><div class="sh-row"><span class="sh-coin"></span><b>${Math.floor(g.coins)}</b><small>${Math.floor(g.top / 10)} m</small></div>`;
  const key = JSON.stringify([g.skills, g.perks, g.lv]);
  if (key !== SH.key) { SH.key = key; renderPauseSkills($('shSk')); }
  const b = $('shScroll'), has = g.scrolls > 0 && g.fly <= 0;
  b.classList.toggle('ready', has); b.querySelector('i').textContent = '×' + g.scrolls; b.querySelector('b').textContent = t('ju_' + curJutsu().id);
}
$('shScroll').addEventListener('pointerdown', e => {
  e.preventDefault(); e.stopPropagation(); A();
  if (state !== 'play' || paused || !g) return;
  if (g.scrolls > 0 && g.fly <= 0) castScroll();
  else floatText(W / 2, g.camY + H * .6, t('no_scroll'), '#ccc', 13);
});
