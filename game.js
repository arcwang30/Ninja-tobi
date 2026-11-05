'use strict';
/* NINJA 鳶 TOBI — 忍者跳躍 Roguelike「忍者修行」（主線四幕＋無盡之塔）。文字在 lang.js */

// ===== 常數 =====
const W = 360;
let H = 640;                    // 依螢幕比例在 640~800 之間調整（長螢幕手機不留黑邊）
const GRAV = 1500, JUMP = 740, SPRING = 1060, FLY_V = 820;
const STAGE_PX = 12000;         // 每一幕的高度（px），10px = 1m。約 2～3 分鐘一幕，主線約 10 分鐘
const SENS = 1.25;              // 手指滑動靈敏度
const DASH_V = 950, DASH_T = .2, DIVE_V = 1150;   // 衝刺斬／急降斬
const FLICK_PX = 42, FLICK_MS = 130;             // 快速滑動判定：130ms 內垂直移動 42px
const WALL = 14;                                 // 左右牆壁厚度
const PL_MIN = WALL + 11, PL_MAX = W - WALL - 11; // 玩家 x 可移動範圍
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
  { k: '風', sky: ['#4aa6e6', '#d4efff'], stalk: '#8ccf98', node: '#5aa070', far: '#a8d8f0', zone: 'sea' },
  { k: '火', sky: ['#5c1610', '#1e0604'], stalk: '#7a3626', node: '#4e1e14', far: '#3a100a', zone: 'monster' },
  { k: '山', sky: ['#33266a', '#e58a68'], stalk: '#5d4a8a', node: '#392d66', far: '#4a3a7a', zone: 'sea' },
];
const SKINS = [
  { n: '鳶', suit: '#c0262d', dark: '#7a1218', band: '#ffffff', cost: 0, sk: 'shuriken' },
  { n: '蒼', suit: '#2b5fb8', dark: '#173a78', band: '#ffd54a', cost: 300, sk: 'kunai' },
  { n: '桜', suit: '#e56aa0', dark: '#a03a6a', band: '#ffffff', cost: 600, sk: 'wind' },
  { n: '影', suit: '#2a2a33', dark: '#111116', band: '#e8403a', cost: 1000, sk: 'thunder' },
];
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
  { n: ['真妖鬼', '真妖鬼', 'True Oni'], skill: ['踩破站台', '足場破壊', 'Breaks platforms'], col: '#d0302a' },
  { n: ['怠惰鬼', '怠惰鬼', 'Sloth Oni'], skill: ['降速', '鈍足', 'Slows you'], col: '#8a3fd0' },
  { n: ['雪女鬼', '雪女鬼', 'Snow Oni'], skill: ['冰凍', '凍結', 'Freezes you'], col: '#3fa6e0' },
  { n: ['鐵甲鬼', '鉄甲鬼', 'Iron Oni'], skill: ['反彈', '弾き返し', 'Repels you'], col: '#5a5a66' },
];
const QTE_TYPES = [
  { id: 'mash', n: ['連打!', '連打!', 'MASH!'], hint: ['連續點擊畫面', '画面を連続タップ', 'Tap rapidly'] },
  { id: 'swipe', n: ['劃擊!', '斬り払い!', 'SWIPE!'], hint: ['快速滑動畫面', '画面を素早くスワイプ', 'Swipe fast'] },
];
const PERKS = [
  { id: 'bounce', n: ['強腳', '強脚', 'Strong Legs'], d: ['跳躍高度 +8%', 'ジャンプ力 +8%', 'Jump height +8%'], max: 3, ic: '🦶' },
  { id: 'slowzone', n: ['退潮', '引き潮', 'Ebb Tide'], d: ['死亡區域上升速度 -15%', '死の領域の上昇 -15%', 'Death zone rises 15% slower'], max: 3, ic: '🌊' },
  { id: 'magnet', n: ['吸魂', '吸魂', 'Soul Magnet'], d: ['擴大魂、小判與道具的吸收範圍', '魂・小判・道具を吸い寄せる範囲が広がる', 'Larger pickup range for souls, koban and items'], max: 3, ic: '🧲' },
  { id: 'combo', n: ['連斬之心', '連斬の心', 'Chain Heart'], d: ['連斬持續時間 +1.2 秒', '連斬の持続 +1.2秒', 'Chains last 1.2s longer'], max: 3, ic: '⚡' },
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
};
// HP：基礎 100，體魄／鋼身每級 +20；各種攻擊的傷害
const HP_BASE = 100, HP_STEP = 20;
const DMG = { shot: 15, kunai: 15, arrow: 20, spike: 20, onibi: 25, zone: 30 };
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
const META = [
  { id: 'hp', n: ['體魄', '体力', 'Vitality'], d: ['最大 HP +20', '最大HP +20', 'Max HP +20'], max: 3, cost: l => 150 * (l + 1), ic: '❤️' },
  { id: 'scroll', n: ['秘卷', '秘巻', 'Secret Scroll'], d: ['起始卷軸 +1', '開始時の巻物 +1', 'Start with +1 scroll'], max: 2, cost: l => 200 * (l + 1), ic: '📜' },
  { id: 'gold', n: ['商才', '商才', 'Merchant'], d: ['小判 +10%', '小判 +10%', 'Koban +10%'], max: 5, cost: l => 120 * (l + 1), ic: '💰' },
  { id: 'reroll', n: ['天眼', '天眼', 'Third Eye'], d: ['選擇秘傳時可重抽次數 +1', '秘伝の引き直し +1回', '+1 reroll when choosing Secret Arts'], max: 2, cost: l => 250 * (l + 1), ic: '👁️' },
];
const ACH = [
  { id: 'run1', n: ['初陣', '初陣', 'First Battle'], d: ['完成第一次挑戰', '初めての挑戦を終える', 'Finish your first run'] },
  { id: 'h100', n: ['見習忍者', '見習い忍者', 'Apprentice'], d: ['單局爬升 100m', '1回で100m登る', 'Climb 100m in one run'] },
  { id: 'h500', n: ['中忍', '中忍', 'Chunin'], d: ['單局爬升 500m', '1回で500m登る', 'Climb 500m in one run'] },
  { id: 'h1500', n: ['上忍', '上忍', 'Jonin'], d: ['單局爬升 1500m', '1回で1500m登る', 'Climb 1500m in one run'] },
  { id: 'combo5', n: ['五連斬', '五連斬', 'Five Chain'], d: ['達成 5 連斬', '5連斬を達成', 'Reach a 5 chain'] },
  { id: 'combo10', n: ['狂熱', 'フィーバー', 'Fever'], d: ['達成 10 連斬，進入狂熱狀態', '10連斬でフィーバー', 'Reach a 10 chain and enter FEVER'] },
  { id: 'chain3', n: ['連鎖爆破', '連鎖爆破', 'Chain Blast'], d: ['一次爆炸炸死 3 名以上敵人', '一度の爆発で3体以上倒す', 'Kill 3+ enemies with one explosion'] },
  { id: 'bank1', n: ['反射斬', '反射斬り', 'Bank Shot'], d: ['彈射斬撞牆反彈後斬殺敵人', '壁で跳ね返ってから敵を斬る', 'Slash an enemy after bouncing off a wall'] },
  { id: 'evo1', n: ['進化', '進化', 'Evolution'], d: ['第一次讓技能進化', '初めて技を進化させる', 'Evolve a skill for the first time'] },
  { id: 'mid1', n: ['天狗退治', '天狗退治', 'Tengu Hunter'], d: ['擊敗中 BOSS 大天狗', '中ボス大天狗を倒す', 'Defeat the Great Tengu'] },
  { id: 'boss1', n: ['鬼退治', '鬼退治', 'Oni Slayer'], d: ['擊敗第一隻魔王', '初めて魔王を倒す', 'Defeat your first boss'] },
  { id: 'slash100', n: ['百人斬', '百人斬り', 'Hundred Cuts'], d: ['累計斬殺 100 名敵忍者', '累計100体の敵を斬る', 'Slash 100 enemies in total'] },
  { id: 'scroll1', n: ['忍法帖', '忍法帖', 'Ninjutsu Scroll'], d: ['第一次發動忍法', '初めて忍法を使う', 'Use ninjutsu for the first time'] },
  { id: 'coin500', n: ['小判長者', '小判長者', 'Koban Tycoon'], d: ['累計獲得 500 小判', '累計500小判を得る', 'Earn 500 koban in total'] },
  { id: 'clear', n: ['風林火山', '風林火山', 'Wind Forest Fire Mountain'], d: ['通過四幕，修行完成', '四幕を越え修行完了', 'Clear all four acts'] },
  { id: 'loop2', n: ['無盡之塔', '無限の塔', 'Endless Tower'], d: ['在無盡之塔爬完一輪', '無限の塔を一周する', 'Finish a loop of the Endless Tower'] },
  { id: 's50k', n: ['名人', '名人', 'Master'], d: ['單局得分 50000', '1回で50000点', 'Score 50,000 in one run'] },
];

// ===== 存檔 =====
const defSave = () => ({
  coins: 0, skin: 0, skins: [0],
  meta: { hp: 0, scroll: 0, gold: 0, reroll: 0 }, ach: {}, opt: { snd: 1, vib: 1, lang: guessLang() }, seen: 0,
  best: { rogue: 0 }, rank: { rogue: [] },
  stats: { runs: 0, slashes: 0, bosses: 0, coins: 0 },
});
let save = defSave();
try {
  const s = JSON.parse(localStorage.getItem('tobi_save') || '{}');
  for (const k in s) save[k] = (typeof s[k] === 'object' && !Array.isArray(s[k]) && s[k]) ? Object.assign(save[k] || {}, s[k]) : s[k];
} catch (e) { }
LI = Math.max(0, LANGS.findIndex(l => l.id === save.opt.lang));
function persist() { try { localStorage.setItem('tobi_save', JSON.stringify(save)); } catch (e) { } }

// ===== 音效（WebAudio 合成） =====
let ac = null;
function A() {
  if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { } }
  if (ac && ac.state === 'suspended') ac.resume();
  // 瀏覽器要等使用者第一次操作後才能出聲，所以標題曲在這裡（第一次點擊時）開始
  if (ac && save.opt.snd && state === 'menu' && !document.hidden) BGM.play(ac);
  return ac;
}
function tone(f, d = .1, type = 'square', vol = .05, slide = 0, delay = 0) {
  if (!save.opt.snd || !ac) return;
  const t = ac.currentTime + delay, o = ac.createOscillator(), gn = ac.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), t + d);
  gn.gain.setValueAtTime(vol, t); gn.gain.exponentialRampToValueAtTime(.0001, t + d);
  o.connect(gn).connect(ac.destination); o.start(t); o.stop(t + d + .03);
}
function noise(d = .2, vol = .08, delay = 0) {
  if (!save.opt.snd || !ac) return;
  const len = ac.sampleRate * d, buf = ac.createBuffer(1, len, ac.sampleRate), ch = buf.getChannelData(0);
  for (let i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const s = ac.createBufferSource(), gn = ac.createGain(); s.buffer = buf; gn.gain.value = vol;
  s.connect(gn).connect(ac.destination); s.start(ac.currentTime + delay);
}
const SFX = {
  jump: () => tone(360, .11, 'square', .03, 260),
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
  soul: () => tone(1100 + Math.random() * 300, .05, 'sine', .025),
  thunder: () => { noise(.3, .12); tone(80, .3, 'sawtooth', .06, -30); },
  wind: () => tone(500, .12, 'triangle', .025, 500),
};
const MUS = [293.66, 329.63, 392, 440, 493.88, 587.33, 659.25];
let mStep = 0;
setInterval(() => {
  if (!ac || !save.opt.snd || paused || state !== 'play') return;   // 標題畫面改由 BGM 播放標題曲
  const bass = [0, 0, 3, 2, 0, 0, 4, 3][(mStep >> 3) & 7];
  if (mStep % 4 === 0) tone(MUS[bass] / 2, .32, 'triangle', .04);
  if (mStep % 2 === 0 && Math.random() < .7) tone(MUS[(Math.random() * 7) | 0], .14, 'sine', .022);
  mStep++;
}, 210);
function vib(ms) { if (save.opt.vib && navigator.vibrate) try { navigator.vibrate(ms); } catch (e) { } }

// ===== 畫面尺寸 =====
const APP_VER = 'v11';   // 顯示在設定頁的診斷資訊，方便對照手機上跑的是哪一版
const IS_IOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
// 是否從主畫面以 App 方式開啟（不同 iOS 版本回報方式不同，三種都看）
const isAppMode = () => navigator.standalone === true || matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches;
let DIAG = '';
function resize() {
  const app = $('app');
  let vw = innerWidth, vh = innerHeight, gap = 0;
  const appMode = isAppMode();
  // iOS「加入主畫面」＋透明狀態列：回報的高度少了一段狀態列，畫面卻整個上移，底部會空一條黑邊。
  // 這時改用「100vh、螢幕實際高度」中最高的來排版，少掉的那段就是狀態列（瀏海）高度。
  if (appMode && vw < vh) {
    const vp = $('vhProbe'), full = Math.max(vh, vp ? vp.offsetHeight : 0, IS_IOS ? Math.max(screen.height, screen.width) : 0);
    if (full > vh) { gap = full - vh; vh = full; }
  }
  // 依螢幕比例調整邏輯高度（640～900），長螢幕手機也能上下滿版
  H = clamp(Math.round(W * vh / vw), 640, 900);
  const w = Math.min(vw, vh * W / H), h = w * H / W;
  app.style.width = w + 'px'; app.style.height = h + 'px';
  // 主畫面模式從畫面頂端開始排，其餘置中
  // iOS 這個模式下，最下面那段不屬於「可視範圍」，固定定位的元素畫不到。
  // 所以讓網頁本身長到全高，遊戲改用一般定位從頂端排下來，才會一路畫到螢幕底。
  document.documentElement.style.height = document.body.style.height = gap ? vh + 'px' : '';
  app.style.position = gap ? 'absolute' : 'fixed';
  app.style.top = gap ? '0px' : '50%';
  app.style.transform = gap ? 'translateX(-50%)' : 'translate(-50%, -50%)';
  app.style.setProperty('--u', (w / W) + 'px');
  const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
  cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
  // 瀏海／狀態列高度：取系統回報值與上面算出的落差中較大的，HUD 和標題都會往下讓開這段
  const sa = $('safeProbe'), env = sa ? parseFloat(getComputedStyle(sa).paddingTop) || 0 : 0;
  let top = Math.max(env, gap);
  // 新版 iOS 會在狀態列下方再疊一段模糊漸層（約狀態列的一倍高），HUD 要再往下讓開才不會糊掉
  if (IS_IOS && appMode && top > 0) top += Math.max(20, top * .6);
  SAFE_T = top * W / w;
  app.style.setProperty('--sat', top + 'px');
  DIAG = `${APP_VER} · ${innerWidth}×${innerHeight} · screen ${screen.width}×${screen.height} · ${appMode ? 'App' : 'Web'} · env ${Math.round(env)} · gap ${Math.round(gap)} · top ${Math.round(top)}`;
  const dg = $('diag'); if (dg) dg.textContent = DIAG;
}
let SAFE_T = 0;
addEventListener('resize', resize);
addEventListener('orientationchange', () => setTimeout(resize, 300));
resize();
// iOS 從主畫面開啟時，瀏海高度會晚一點才給，開啟後再量幾次
for (const ms of [100, 400, 1000, 2500]) setTimeout(resize, ms);

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
  const p = toL(e);
  if (state === 'play' && !paused) {
    const hy = p.y - SAFE_T;   // HUD 往下讓開瀏海，點擊判定也一起位移
    if (p.x > W - 50 && hy < 50) { pauseGame(); return; }
    if (p.x < 120 && hy > 26 && hy < 62) { castScroll(); return; }
  }
  inp.down = true; inp.id = e.pointerId; inp.lx = p.x; inp.ly = p.y; inp.sw = 0;
  inp.hist = [{ x: p.x, y: p.y, t: performance.now() }]; inp.flicked = false;
  // 先進入「待定」：手指不動一下就變瞄準，一開始就滑動則是一般移動
  inp.mode = state === 'play' && !paused ? 'pending' : null;
  inp.hold = 0; inp.sx = inp.cx = p.x; inp.sy = inp.cy = p.y;
  try { cv.setPointerCapture(e.pointerId); } catch (er) { }
  if (state === 'qte' && g.qte.type === 'mash') qteHit(1);
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
  if (state === 'qte') {
    const q = g.qte;
    if (q.type === 'swipe') { inp.sw += Math.hypot(dx, dy); if (inp.sw > 55) { inp.sw = 0; qteHit(1); } }
  }
});
const endPtr = e => {
  if (e.pointerId !== inp.id) return;
  // 放開時發射彈射斬（拉得不夠遠就當作取消）
  if (inp.mode === 'aim' && e.type === 'pointerup' && state === 'play' && !paused) {
    const a = aimInfo();
    if (a && a.dive) startDive();
    else if (a) startDash(a.dx, a.dy, DASH_T_AIM, .2);
  }
  inp.down = false; inp.id = null; inp.mode = null;
};
cv.addEventListener('pointerup', endPtr);
cv.addEventListener('pointercancel', endPtr);
addEventListener('keydown', e => {
  inp.keys[e.code] = true; A();
  if (e.code === 'Escape' || e.code === 'KeyP') { if (state !== 'menu' && state !== 'over' && state !== 'perk' && state !== 'clearq') paused ? resumeGame() : pauseGame(); }
  if (e.code === 'Space' || e.code === 'Enter') {
    if (state === 'play' && !paused) castScroll();
    else if (state === 'qte') qteHit(1);
    e.preventDefault();
  }
  if (!e.repeat && state === 'play' && !paused) {
    if (e.code === 'ArrowUp' || e.code === 'KeyW') { startDash(g.p.face * .5, -1); e.preventDefault(); }
    if (e.code === 'ArrowDown' || e.code === 'KeyS') { startDive(); e.preventDefault(); }
  }
});
addEventListener('keyup', e => { inp.keys[e.code] = false; });
// 在畫面任何地方第一次點擊／按鍵就解鎖音訊（標題曲隨之開始）
addEventListener('pointerdown', () => A(), true);
// 切到背景時停止標題曲，回來時再播
document.addEventListener('visibilitychange', () => {
  if (document.hidden) BGM.stop();
  else if (ac && save.opt.snd && state === 'menu') BGM.play(ac);
});
document.addEventListener('visibilitychange', () => { if (document.hidden && g && state !== 'over' && state !== 'menu' && state !== 'perk') pauseGame(); });

// ===== 遊戲局 =====
const pk = id => (g && g.perks[id]) || 0;
const sk = id => (g && g.skills[id]) || 0;   // 自動技能等級（0 = 沒有）

function startRun() {
  hideAll(); BGM.stop();
  g = {
    t: 0, camY: -H * .68, top: 0, bonus: 0, coins: 0,
    p: { x: W / 2, y: 40, vx: 0, vy: -JUMP, face: 1, inv: 0, slow: 0, freeze: 0, sq: 0, dash: 0, dvx: 0, dvy: 0, dive: false, wallUsed: false, banks: 0 },
    plats: [], items: [], enemies: [], parts: [], texts: [], fx: [], shots: [],
    eshots: [], booms: [], ghosts: [], hitstop: 0,
    drops: [], bolts: [], blades: [], skills: {}, sks: {}, xp: 0, lv: 1, lvQueue: 0, barrier: 0, barT: 0,
    genY: 40, lastX: W / 2, rowN: 0, ladderCD: 3,
    zoneY: 360, boss: null, bossN: 0, stage: 0,
    combo: 0, comboT: 0, maxCombo: 0, kills: 0, vampN: 0, ki: 3, fever: 0,
    hp: 1, maxHp: 1, scrolls: 0, fly: 0, shake: 0,
    perks: {}, mod: null, wind: 0, windT: 0, spikeUsed: false, shurT: 2,
    banner: null, slash: null, qte: null, killT: 0, castT: 0, dieT: 0,
    rerolls: save.meta.reroll, usedScroll: false, cleared: false,
  };
  g.maxHp = g.hp = HP_BASE + HP_STEP * save.meta.hp;
  g.scrolls = save.meta.scroll;
  g.plats.push({ x: W / 2, y: 40, w: W * 1.4, type: 'ground' });
  while (g.genY > g.camY - 150) genRow();
  paused = false;
  inp.mode = null;
  g.skills[SKINS[save.skin].sk] = 1;   // 每個角色的起始技能不同
  state = 'play'; stageBanner();
  // 操作改版後（彈射、牆壁）再顯示一次說明
  if (save.seen < 2) { save.seen = 2; persist(); openHelp(); paused = true; }
}
const loopN = () => Math.floor(g.stage / 4);   // 無盡之塔第幾輪（0 = 主線）

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
  const pSpike = g.top < 600 ? 0 : (.05 + .12 * d) * (m === 'rich' ? 1.8 : 1);
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
  // 道具
  const lucky = 1 + pk('lucky') * .8;
  const coinP = (m === 'rich' ? .55 : .28);
  if (Math.random() < coinP) {
    const n = Math.random() < .3 ? 3 : 1;
    for (let i = 0; i < n; i++) g.items.push({ t: 'coin', x: clamp(x + (i - (n - 1) / 2) * 22, WALL + 10, W - WALL - 10), y: y - 30 - (n > 1 && i === 1 ? 10 : 0), ph: rnd(0, 6) });
  }
  if (Math.random() < .012 * lucky) g.items.push({ t: 'scroll', x: rnd(30, W - 30), y: y - gap / 2, ph: 0 });
  else if (Math.random() < .022 * lucky) g.items.push({ t: 'chest', x: rnd(30, W - 30), y: y - gap / 2, ph: 0 });
  // 敵忍者
  const pE = g.top < 250 ? 0 : (.08 + .14 * d) * (m === 'horde' ? 2.6 : 1) * (1 + .12 * g.stage + .3 * loopN());   // 越後面的幕敵人越多
  // 倖存者節奏：敵人密度比之前高（技能需要靶子，魂也從這裡來）
  if (Math.random() < pE * 1.4) g.enemies.push(mkEnemy(enemyType(d), rnd(30, W - 30), (y + prevY) / 2, rnd(10, 50)));
  // 敵人階梯：間距小於彈跳高度，可以一路空中連斬上去
  g.ladderCD--;
  if (g.top > 400 && g.ladderCD <= 0 && Math.random() < (.08 + .07 * d) * (m === 'horde' ? 2 : 1)) {
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
      return;
    }
    case 13: return midAI(e, ed, dt);
  }
  if (e.type === 11) earthCheck(e);
  // 其餘：原地左右巡邏
  if (e.type === 12) e.x = clamp(e.bx + Math.sin(e.ph * 1.6) * e.amp, WALL + ed.w / 2, W - WALL - ed.w / 2);   // 蜘蛛擺盪
  else e.x = clamp(e.bx + Math.sin(e.ph * (e.affix === 'fast' ? 2.6 : 1.3)) * e.amp, WALL + ed.w / 2, W - WALL - ed.w / 2);
  if (!onScreen) return;
  e.thr -= dt;
  e.warn = e.thr < .45;
  if (e.thr > 0) return;
  const a = Math.atan2(py - e.y, px - e.x);
  if (e.type === 3) { // 手裡劍：直線
    e.thr = rnd(2.3, 3);
    g.eshots.push({ x: e.x, y: e.y, vx: Math.cos(a) * 175, vy: Math.sin(a) * 175, t: 0 });
    SFX.throw();
  } else if (e.type === 9) { // 弓：瞄準玩家目前位置的拋物線
    e.thr = rnd(2.6, 3.2);
    const T = 1.1, G2 = 420;
    g.eshots.push({ x: e.x, y: e.y, vx: (px - e.x) / T, vy: (py - e.y) / T - G2 * T / 2, grav: G2, t: 0, kind: 'arrow' });
    SFX.throw();
  } else if (e.type === 12) { // 蜘蛛：吐絲（減速）
    e.thr = rnd(3, 3.8);
    g.eshots.push({ x: e.x, y: e.y, vx: Math.cos(a) * 120, vy: Math.sin(a) * 120, t: 0, kind: 'web' });
  } else e.thr = 99;
}
// ===== 中 BOSS 大天狗：每幕中段出現，停在畫面上方，扇形射擊；碰到它扣它的血 =====
function spawnMid() {
  const hp = 8 + 3 * g.stage;
  const e = mkEnemy(13, W / 2, g.camY - 60, 0);
  e.hp = e.max = hp; e.life = 25; e.thr = 2;
  g.enemies.push(e); g.mid = e; g.midDone = true;
  g.banner = { t: 2, a: t('mid_in'), b: t('mid_name'), c: t('mid_desc') };
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
    e.thr = Math.max(1.4, 2.4 - .15 * g.stage);
    const a0 = Math.atan2((p.y - 20) - e.y, p.x - e.x);
    for (let i = -2; i <= 2; i++) { const a = a0 + i * .28; g.eshots.push({ x: e.x, y: e.y + 20, vx: Math.cos(a) * 160, vy: Math.sin(a) * 160, t: 0 }); }
    SFX.throw();
  }
  if (e.life <= 0) { e.dead = true; g.mid = null; floatText(W / 2, g.camY + H * .4, t('mid_gone'), '#ccc', 20); }
}
// 中 BOSS 被擊倒：大量魂與小判，並開寶箱（可能進化）
function midDown(e) {
  g.mid = null;
  for (let i = 0; i < 14; i++) g.drops.push({ k: i < 10 ? 'soul' : 'coin', x: e.x + rnd(-30, 30), y: e.y, vx: rnd(-100, 100), vy: -rnd(140, 280), v: i < 10 ? 3 : 2, ph: rnd(0, 6) });
  burst(e.x, e.y, '#c0262d', 36); g.shake = 12; SFX.kill(); vib([60, 40, 120]);
  floatText(W / 2, g.camY + H * .4, t('mid_down'), '#ffd27a', 24);
  unlock('mid1');
  g.pendingChest = true;
}

// ===== 波次：一段時間就有一群敵人從畫面外湧入 =====
function spawnWave() {
  const st = g.stage, top = g.camY + 90, kinds = ['crow', 'tengu'];
  if (st >= 1 || g.top > 2500) kinds.push('onibi');
  if (st >= 1) kinds.push('archer');
  if (st >= 2) kinds.push('spider');
  const k = pick(kinds), n = Math.round(rnd(4, 6) + st * .8 + loopN() * 2);
  if (k === 'crow') { // 從左或右排成一列飛過
    const side = Math.random() < .5 ? -1 : 1, y = top + rnd(40, H * .4);
    for (let i = 0; i < n + 2; i++) { const e = mkEnemy(7, side < 0 ? -30 - i * 34 : W + 30 + i * 34, y, 0); e.by = y + (i % 2) * 18; e.vx = -side * rnd(120, 150); g.enemies.push(e); }
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
  floatText(W / 2, -24, t('wave_' + k), '#ff9a7a', 18, true);
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
  const T = g.top, w = [[0, .6 - .4 * d], [1, .3], [2, .1 + .2 * d]];
  if (T > 1500) w.push([3, .22]);
  if (T > 2500) w.push([5, .16]);
  if (T > 3200) w.push([4, .2]);
  if (T > 4500) w.push([6, .08]);
  let r = Math.random() * w.reduce((s, x) => s + x[1], 0);
  for (const [t, p] of w) { r -= p; if (r <= 0) return t; }
  return 0;
}

function stageBanner() {
  const th = THEMES[g.stage % 4];
  const loop = loopN();
  g.banner = {
    t: 2.6, a: L(STR.act)[g.stage % 4] + (loop ? t('loop', loop) : ''), b: th.k,
    c: g.mod ? t('mod_line', L(g.mod.n), L(g.mod.d)) : '',
  };
}

// ===== 主更新 =====
function update(dt) {
  if (state === 'menu') { updateDemo(dt); return; }
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
    case 'cast': g.castT -= dt; if (g.castT <= 0) { state = 'play'; g.fly = 1.7 * (1 + .4 * pk('feather')); g.p.inv = Math.max(g.p.inv, g.fly + .6); } break;
    case 'qte': updateQte(dt); break;
    case 'kill': g.killT -= dt; if (g.killT <= 0) finishBoss(true); break;
    case 'dying': g.dieT -= dt; g.p.vy += GRAV * dt; g.p.y += g.p.vy * dt; if (g.dieT <= 0) showOver(); break;
  }
  if (state !== 'perk') updateFx(dt);
}

function updateDemo(dt) {
  demo.t += dt; demo.vy += GRAV * dt; demo.y += demo.vy * dt;
  if (demo.y > 470) { demo.y = 470; demo.vy = -JUMP; }
  demo.x = W / 2 + Math.sin(demo.t * .7) * 110; demo.face = Math.cos(demo.t * .7) > 0 ? 1 : -1;
}

function updatePlay(dt) {
  const p = g.p;
  g.t += dt;
  if (g.fever > 0) { g.fever -= dt; g.ki = kiMax(); if (g.fever <= 0) settleCombo(); }
  else if (g.comboT > 0) { g.comboT -= dt; if (g.comboT <= 0) settleCombo(); }
  g.ki = Math.min(kiMax(), g.ki + dt * .12 * (sk('swift') ? SKV.swift(sk('swift')).regen : 1));
  if (g.lvQueue > 0) { g.lvQueue--; openPerks('lv'); return; }   // 有待選的升級就先暫停選擇
  if (g.pendingChest) { g.pendingChest = false; openPerks('chest'); return; }   // 中 BOSS 的寶箱
  p.inv =Math.max(0, p.inv - dt); p.slow = Math.max(0, p.slow - dt); p.freeze = Math.max(0, p.freeze - dt); p.sq = Math.max(0, p.sq - dt * 4);
  if (g.banner) { g.banner.t -= dt; if (g.banner.t <= 0) g.banner = null; }

  // 移動
  let mv = inp.dx * SENS; inp.dx = 0;
  const k = ((inp.keys.ArrowLeft || inp.keys.KeyA) ? -1 : 0) + ((inp.keys.ArrowRight || inp.keys.KeyD) ? 1 : 0);
  mv += k * 310 * dt;
  if (p.slow > 0) mv *= .45;
  if (p.freeze > 0) mv = 0;
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
      p.wallUsed = true; p.vy = -JUMP * .85; p.vx = -side * 340; p.face = -side; p.sq = .6;
      floatText(p.x, p.y - 50, t('wall_kick'), '#fff', 15);
      for (let i = 0; i < 5; i++) g.parts.push({ x: p.x + side * 10, y: p.y - 20 + rnd(-10, 10), vx: -side * rnd(40, 120), vy: rnd(-60, 30), life: .35, max: .35, c: '#ffffffaa', s: rnd(2, 3) });
      SFX.jump();
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
      floatText(p.x, p.y - 40, t('bank'), '#9ad8ff', 14); SFX.clank(); g.shake = Math.max(g.shake, 4);
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
  zs *= Math.pow(.85, pk('slowzone')) * (1 + .15 * loopN());
  if (g.boss) zs *= .6;
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
  const mag = pk('magnet') * 45;
  for (const it of g.items) {
    it.ph += dt * 4;
    const dx = p.x - it.x, dy = (p.y - 18) - it.y, dist = Math.hypot(dx, dy);
    if (mag && dist < 40 + mag) { it.x += dx * Math.min(1, dt * 8); it.y += dy * Math.min(1, dt * 8); }
    if (dist < (g.fly > 0 ? 40 : 24)) collect(it);
  }

  // 敵忍者
  const reach = pk('reach') * 9 + (p.dash > 0 || p.dive ? 8 : 0);
  for (const e of g.enemies) {
    if (e.dead) continue;
    e.ph += dt; e.cool = Math.max(0, e.cool - dt); e.flash = Math.max(0, e.flash - dt);
    const ed = ENEMY[e.type];
    enemyAI(e, ed, dt);
    if (e.dead) continue;
    if (e.hidden) continue;   // 土遁忍者藏在地板裡時碰不到
    if (e.cool <= 0 && Math.abs(p.x - e.x) < ed.w / 2 + 10 + reach && Math.abs((p.y - 20) - e.y) < ed.h / 2 + 18 + reach) {
      if (touchEnemy(e)) return;
    }
  }
  // 敵方攻擊：飛鏢／箭（有重力）／苦無／蛛絲（減速不扣血）
  for (const s of g.eshots) {
    s.t += dt; if (s.grav) s.vy += s.grav * dt;
    s.x += s.vx * dt; s.y += s.vy * dt;
    if (Math.hypot(s.x - p.x, s.y - (p.y - 20)) < (s.kind === 'web' ? 18 : 14)) {
      s.dead = true;
      if (p.dash > 0 || p.dive || g.fly > 0) { sparkle(s.x, s.y, '#fff'); SFX.clank(); }   // 衝刺中可以彈開
      else if (s.kind === 'web') { p.slow = Math.max(p.slow, 1.6); floatText(p.x, p.y - 50, t('webbed'), '#ddd', 15); }
      else if (hurt(s.kind || 'shot')) return;
    }
  }
  g.eshots = g.eshots.filter(s => !s.dead && s.t < 4);

  // 自動技能、掉落物
  updateSkills(dt);
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
  if (g.waveT <= 0 && !g.boss && g.top > 300) { spawnWave(); g.waveT = rnd(11, 16) * Math.max(.55, 1 - .07 * g.stage); }
  if (!g.midDone && !g.boss && !g.mid && g.top >= g.bossN * STAGE_PX + STAGE_PX * .5) spawnMid();

  // BOSS
  if (!g.boss && g.top >= (g.bossN + 1) * STAGE_PX) spawnBoss();
  if (g.boss) updateBoss(dt);

  checkLiveAch();
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
}

// ===== 掉落物：魂（經驗）與小判 =====
function dropLoot(x, y, type) {
  g.drops.push({ k: 'soul', x, y, vx: rnd(-50, 50), vy: -rnd(140, 240), v: SOUL_V[type] ?? 1, ph: rnd(0, 6) });
  const cn = type === 6 ? 5 : Math.random() < .25 ? 1 : 0;
  for (let i = 0; i < cn; i++) g.drops.push({ k: 'coin', x, y, vx: rnd(-80, 80), vy: -rnd(160, 260), v: 1, ph: rnd(0, 6) });
}
function updateDrops(dt) {
  const p = g.p, px = p.x, py = p.y - 20, R = 36 + pk('magnet') * 45;
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
  g.xp += v; SFX.soul();
  while (g.xp >= xpNeed(g.lv)) { g.xp -= xpNeed(g.lv); g.lv++; g.lvQueue++; }
}

function land(pl) {
  const p = g.p;
  p.y = pl.y; p.sq = 1; p.wallUsed = false;
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
  } else if (g.fever <= 0) settleCombo();
  if (pl.type === 'spring') { v = Math.max(v, SPRING * (1 + .05 * pk('bounce'))); pl.comp = .25; SFX.spring(); }
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
  for (let i = 0; i < 4; i++) g.parts.push({ x: p.x + rnd(-10, 10), y: pl.y, vx: rnd(-60, 60), vy: rnd(-40, -10), life: .35, max: .35, c: '#ffffffaa', s: rnd(2, 3) });
}

function hurt(src) {
  const p = g.p;
  if (p.inv > 0 && src !== 'zone') return false;
  // 結界：擋下這次傷害
  if (g.barrier > 0) {
    g.barrier--; g.barT = 0; p.inv = 1;
    if (sk('barrier') > 5) for (const e of g.enemies) if (!e.dead && Math.hypot(e.x - p.x, e.y - p.y) < 110) autoHit(e);   // 不動結界：震飛周圍
    g.booms.push({ x: p.x, y: p.y - 20, r: 45, t: 0, c: '#9ad8ff' });
    floatText(p.x, p.y - 50, t('blocked'), '#9ad8ff', 18); SFX.clank(); vib(40);
    return false;
  }
  const dmg = DMG[src] ?? 15;
  g.hp = Math.max(0, g.hp - dmg); g.shake = 12; SFX.hit(); vib(120);
  floatText(p.x, p.y - 50, '-' + dmg, '#ff4040', 20);
  if (g.hp <= 0) { die(); return true; }
  p.inv = 1.6;
  return false;
}

// 回復 HP（不超過上限）
function heal(n, x = g.p.x, y = g.p.y - 60) {
  const v = Math.min(n, g.maxHp - g.hp); if (v <= 0) return;
  g.hp += v; floatText(x, y, 'HP +' + v, '#7aff9a', 16);
}

function die() {
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
const kiMax = () => 3 + pk('kimax') + (sk('swift') ? SKV.swift(sk('swift')).ki : 0);

// 碰到敵人。回傳 true 表示進入了全畫面斬擊演出
function touchEnemy(e) {
  const p = g.p, fast = p.dash > 0 || p.dive || g.fly > 0;
  // 鬼火：不是衝刺／急降／豪天翔時碰到會受傷（鬼火也跟著消散）
  if (e.type === 10 && !fast) {
    e.dead = true; burst(e.x, e.y, '#b07aff', 10);
    if (p.inv <= 0) hurt('onibi');
    return false;
  }
  // 盾忍者：從下方往上撞會被重重打落並中斷連斬（衝刺斬可以破盾）
  if (e.type === 4 && !fast && p.vy < 0 && (p.y - 20) > e.y) {
    e.cool = .6; p.vy = 520; p.sq = 1;
    floatText(e.x, e.y - 30, '盾!', '#ccc', 18); SFX.clank(); g.shake = 7; vib(60);
    if (g.fever <= 0) { g.combo = 0; g.comboT = 0; }
    return false;
  }
  // 菁英：第一刀只會打退
  if (e.hp > 1) {
    e.hp--; e.cool = .35; e.flash = .3;
    if (!p.dive) { p.dash = 0; p.vy = -JUMP; }
    g.hitstop = .1; g.shake = 6; SFX.slash();
    g.fx.push({ x: e.x, y: e.y, a: rnd(0, 3.14), t: 0 });
    floatText(e.x, e.y - 30, e.type === 13 ? 'HP ' + e.hp : t('one_more'), '#e0b0ff', 14);
    return false;
  }
  // 連斬的第一刀才播放全畫面演出，之後改用短暫 HIT STOP，讓連斬節奏不中斷
  const cine = !fast && g.comboT <= 0 && g.fever <= 0;
  slay(e);
  if (g.fly > 0) return false;
  if (p.dive) { g.hitstop = .04; return false; }   // 急降斬穿過敵人繼續往下
  if (p.dash > 0 && p.banks > 0) unlock('bank1');
  p.dash = 0; p.vy = -JUMP * (1 + .08 * pk('bounce')); p.wallUsed = false;
  p.inv = Math.max(p.inv, .2);
  if (cine) {
    state = 'slash';
    g.slash = { e, t: 0, dur: ENEMY[e.type].dur, lines: [], n: 0, nextL: 0 };
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
  g.combo = (g.comboT > 0 || g.fever > 0) ? g.combo + 1 : 1;
  g.comboT = 3 + 1.2 * pk('combo');
  g.maxCombo = Math.max(g.maxCombo, g.combo);
  const mult = Math.min(g.combo, 20) * (g.fever > 0 ? 2 : 1);
  addBonus(ed.pts * mult);
  floatText(e.x, e.y - 10, `+${Math.round(ed.pts * mult * (1 + .2 * pk('score')))}`, g.fever > 0 ? '#ffd27a' : '#fff', 16);
  if (g.combo >= 2) { floatText(W / 2, 0, t('chain', g.combo), '#ffd27a', 26, true); SFX.combo(g.combo); }
  if (g.combo % 10 === 0) startFever();
  if (!auto) g.ki = Math.min(kiMax(), g.ki + .5);   // 只有自己斬的才回氣
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
  const r = 95;
  g.booms.push({ x, y, r, t: 0, c: '#ff8a3a' });
  burst(x, y, '#ff8a3a', 24); SFX.boom(); g.shake = 12; vib(80);
  let n = 0;
  for (const e of g.enemies) if (!e.dead && Math.hypot(e.x - x, e.y - y) < r) { slay(e); n++; }
  for (const pl of g.plats) if (!pl.broken && pl.type !== 'ground' && Math.hypot(pl.x - x, pl.y - y) < r * .8) { pl.broken = true; pl.vy = -100; }
  if (n >= 3) unlock('chain3');
}

// 連斬結束時依連斬數平方給額外分數
function settleCombo() {
  if (g.combo >= 2) {
    const b = 50 * g.combo * g.combo;
    addBonus(b);
    floatText(W / 2, 34, t('chain_bonus', g.combo, Math.round(b * (1 + .2 * pk('score')))), '#fff', 16, true);
  }
  g.combo = 0; g.comboT = 0;
}

function startFever() {
  g.fever = 6; g.ki = kiMax();
  g.banner = { t: 1.4, a: t('chain_hud', g.combo), b: t('fever'), c: t('fever_desc') };
  SFX.fever(); vib([40, 30, 40]);
  unlock('combo10');
}

// 衝刺斬：往滑動方向高速衝刺，撞到的敵人直接斬殺
function startDash(dx, dy, dur = DASH_T, minUp = .35) {
  const p = g.p;
  if (state !== 'play' || g.fly > 0 || p.dash > 0 || p.freeze > 0) return;
  if (g.ki < 1) { floatText(p.x, p.y - 60, t('ki_low'), '#9ad8ff', 14); return; }
  g.ki -= 1;
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
  if (g.ki < 1) { floatText(p.x, p.y - 60, t('ki_low'), '#9ad8ff', 14); return; }
  g.ki -= 1;
  p.dash = 0; p.dive = true; p.vy = DIVE_V;
  SFX.dive();
}

function updateSlash(dt) {
  const s = g.slash;
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
function castScroll() {
  if (!g || state !== 'play' || paused || g.scrolls <= 0 || g.fly > 0) return;
  g.scrolls--; state = 'cast'; g.castT = 1.0; SFX.scroll(); vib(60);
  g.p.dash = 0; g.p.dive = false;
  if (!g.usedScroll) { g.usedScroll = true; unlock('scroll1'); }
}

// ===== BOSS =====
function spawnBoss() {
  const n = g.bossN, kind = n % 4;
  const hp = 16 + 6 * n;
  g.boss = {
    n, kind, hp, max: hp, x: W / 2, y: g.camY - 60, t: 0, life: 22, cool: 0, skillT: 2.5,
    shield: false, shT: 1.5, r: 30, warn: 0, qtype: QTE_TYPES[(n + (Math.random() * QTE_TYPES.length | 0)) % QTE_TYPES.length].id,
  };
  g.banner = { t: 2.2, a: t('boss_in'), b: t('boss_appear', L(BOSS_KINDS[kind].n)), c: t('boss_desc', L(BOSS_KINDS[kind].skill)) };
  SFX.boss(); vib(200);
}
function updateBoss(dt) {
  const b = g.boss, p = g.p;
  b.t += dt; b.life -= dt; b.cool = Math.max(0, b.cool - dt);
  const ty = g.camY + 120 + Math.sin(b.t * 1.7) * 20;
  b.y += (ty - b.y) * Math.min(1, dt * 2.5);
  b.x = W / 2 + Math.sin(b.t * .9) * 120;
  // 技能
  b.skillT -= dt;
  if (b.kind === 0 && b.skillT <= 0) {
    b.skillT = 2.2;
    const c = g.plats.filter(o => !o.broken && !o.crack && o.type !== 'ground' && o.y > g.camY + H * .3 && o.y < g.camY + H * .9);
    if (c.length) { pick(c).crack = .7; }
  } else if (b.kind === 1 && b.skillT <= 0) {
    if (!b.warn) { b.warn = .7; floatText(b.x, b.y + 40, t('boss_slow'), '#c58aff', 20); }
    b.warn -= dt; if (b.warn <= 0) { b.warn = 0; b.skillT = 5.5; p.slow = 3; vib(60); }
  } else if (b.kind === 2 && b.skillT <= 0) {
    if (!b.warn) { b.warn = .8; floatText(b.x, b.y + 40, t('boss_freeze'), '#9ae0ff', 20); }
    b.warn -= dt; if (b.warn <= 0) { b.warn = 0; b.skillT = 6; p.freeze = 1.5; vib(60); }
  } else if (b.kind === 3) {
    b.shT -= dt; if (b.shT <= 0) { b.shield = !b.shield; b.shT = b.shield ? 1.6 : 1.8; }
  }
  // 接觸
  if (b.cool <= 0 && g.fly <= 0 && Math.abs(p.x - b.x) < b.r + 12 && Math.abs((p.y - 20) - b.y) < b.r + 18) {
    if (b.shield) {
      p.vy = 300; p.dash = 0; p.dive = false; p.x += (p.x < b.x ? -40 : 40); b.cool = .8; g.shake = 6; SFX.hit();
      floatText(b.x, b.y - 40, t('boss_repel'), '#ccc', 20);
    } else {
      state = 'qte';
      const qt = QTE_TYPES.find(q => q.id === b.qtype);
      g.qte = { type: b.qtype, q: qt, t: 0, tl: 4.5, hits: [], dmg0: b.hp };
      inp.sw = 0; p.dash = 0; p.dive = false;
      SFX.boss(); vib(80);
    }
  }
  if (b.life <= 0) finishBoss(false);
}
function qteHit(n) {
  const q = g.qte, b = g.boss; if (!q || !b) return;
  b.hp -= n * (q.type === 'mash' ? 1 : q.type === 'swipe' ? 1.6 : 1.4);
  q.hits.push({ a: rnd(0, Math.PI), t: 0, x: rnd(-40, 40), y: rnd(-40, 40) });
  g.shake = 5; SFX.slash(); vib(15);
  if (b.hp <= 0) { b.hp = 0; state = 'kill'; g.killT = 1.5; SFX.kill(); vib([60, 40, 160]); }
}
function updateQte(dt) {
  const q = g.qte;
  q.t += dt;
  for (const h of q.hits) h.t += dt;
  q.hits = q.hits.filter(h => h.t < .35);
  if (q.t >= q.tl) {
    // 時間到，回到遊戲
    state = 'play'; g.qte = null;
    g.boss.cool = 1.5; g.boss.life = Math.max(g.boss.life, 6);
    g.p.vy = -JUMP; g.p.inv = 1;
    floatText(W / 2, g.camY + H * .45, t('boss_flee'), '#ffd27a', 20);
  }
}
function finishBoss(killed) {
  const b = g.boss;
  g.boss = null; g.qte = null;
  if (killed) {
    const pts = 3000 + 2000 * b.n;
    addBonus(pts); addCoins(20 + 5 * b.n);
    floatText(W / 2, g.camY + H * .4, t('boss_down', Math.round(pts * (1 + .2 * pk('score')))), '#ffd27a', 24);
    burst(b.x, b.y, BOSS_KINDS[b.kind].col, 40);
    for (let i = 0; i < 12; i++) g.drops.push({ k: i < 8 ? 'soul' : 'coin', x: b.x + rnd(-30, 30), y: b.y, vx: rnd(-90, 90), vy: -rnd(120, 260), v: i < 8 ? 3 : 2, ph: rnd(0, 6) });
    save.stats.bosses++; unlock('boss1');
  } else {
    floatText(W / 2, g.camY + H * .4, t('boss_gone'), '#ccc', 22);
  }
  g.p.vy = -JUMP * 1.15; g.p.inv = 1.2; g.p.slow = 0; g.p.freeze = 0;
  g.bossN++; g.stage = g.bossN; g.spikeUsed = false;
  g.midDone = false; if (g.mid) { g.mid.dead = true; g.mid = null; }
  if (g.stage > 4 && g.stage % 4 === 0) unlock('loop2');
  g.mod = pick(MODS); g.wind = 0; g.windT = 0;
  g.pendingPerk = killed;
  // 主線第四幕結束：讓玩家選擇挑戰無盡之塔或結算
  if (g.stage === 4 && !g.cleared) {
    g.cleared = true; unlock('clear');
    state = 'clearq'; show('clear', true);
    return;
  }
  afterBoss();
}
function afterBoss() {
  if (g.pendingPerk) { openPerks('boss'); return; }
  state = 'play';
  stageBanner();
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
    out.push({ kind: 'skill', o: s, w: l ? 4 : 2.5 });   // 技能比被動更常出現
  }
  if (why !== 'start') for (const p of PERKS) if (pk(p.id) < p.max) out.push({ kind: 'perk', o: p, w: 1 });
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
  else if (g.rerolls > 0) h += `<button data-act="reroll">${t('reroll', g.rerolls)}</button>`;
  $('perkCards').innerHTML = h;
  show('perk', true);
}
function choosePerk(i) {
  const c = perkChoices[i];
  if (!c) { heal(30); addCoins(20); }
  else if (c.kind === 'evo') {
    g.skills[c.o.id] = SK_MAX + 1;
    if (c.o.id === 'barrier') g.barrier = SKV.barrier(6).max;
    floatText(W / 2, 64, t('evo_get', L(EVO[c.o.id].n)), '#ffd27a', 24, true);
    SFX.fever(); unlock('evo1');
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
  if (g.maxCombo >= 5) unlock('combo5');
  if (g.maxCombo >= 10) unlock('combo10');
  if (save.stats.slashes >= 100) unlock('slash100');
  if (score() >= 50000) unlock('s50k');
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

function drawBG(camY, stage, t) {
  const th = THEMES[stage % 4];
  const gr = ctx.createLinearGradient(0, 0, 0, H);
  gr.addColorStop(0, th.sky[0]); gr.addColorStop(1, th.sky[1]);
  ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
  const k = th.k;
  if (k === '風') { // 雲
    ctx.fillStyle = 'rgba(255,255,255,.75)';
    for (let i = 0; i < 6; i++) {
      const y = ((i * 170 - camY * .15) % 1020 + 1020) % 1020 - 120, x = (i * 97 + t * 8 * (i % 2 ? 1 : -1)) % (W + 160) - 80;
      ctx.beginPath(); ctx.ellipse(x, y, 60, 18, 0, 0, 7); ctx.ellipse(x + 30, y - 12, 34, 16, 0, 0, 7); ctx.fill();
    }
  } else if (k === '山') { // 遠山
    ctx.fillStyle = th.far;
    const off = (-camY * .05) % 200;
    ctx.beginPath(); ctx.moveTo(0, H);
    for (let x = -100; x <= W + 100; x += 100) ctx.lineTo(x + 50, H * .55 + off * .2 + ((x / 100) % 2 ? -60 : 30));
    ctx.lineTo(W, H); ctx.fill();
    ctx.fillStyle = '#ffd9a0'; ctx.beginPath(); ctx.arc(W * .75, 150, 34, 0, 7); ctx.fill();
  } else if (k === '火') { // 火星
    for (let i = 0; i < 18; i++) {
      const x = (i * 53) % W, y = H - (((t * 60 + i * 97) - camY * .2) % (H + 40));
      ctx.fillStyle = i % 2 ? '#ff8a3a' : '#ffcf5a'; ctx.fillRect(x + Math.sin(t + i) * 10, y, 3, 3);
    }
  }
  // 竹林兩層
  const layers = [[.18, 0.45, 10, th.far], [.4, 1, 18, th.stalk]];
  for (const [f, a, sw, col] of layers) {
    ctx.globalAlpha = a;
    for (let i = 0; i < 7; i++) {
      const x = (i * 61 + (f > .3 ? 20 : 45)) % W;
      ctx.fillStyle = col; ctx.fillRect(x, 0, sw, H);
      ctx.fillStyle = th.node;
      const seg = 90, o = ((-camY * f) % seg + seg) % seg;
      for (let y = o - seg; y < H; y += seg) ctx.fillRect(x - 1, y, sw + 2, 4);
      ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(x + 3, 0, 3, H);
    }
  }
  ctx.globalAlpha = 1;
}

function drawPlat(pl) {
  let x = pl.x - pl.w / 2, y = pl.y;
  if (pl.crack > 0) x += rnd(-2, 2);
  const h = 12;
  ctx.save();
  if (pl.broken) ctx.globalAlpha = .6;
  if (pl.type === 'ground') { ctx.fillStyle = '#6b4a22'; ctx.fillRect(x, y, pl.w, 300); ctx.fillStyle = '#4a8a3a'; ctx.fillRect(x, y, pl.w, 10); ctx.restore(); return; }
  const cols = { normal: ['#e3f3cf', '#4e7d3a'], spike: ['#e3f3cf', '#4e7d3a'], spring: ['#ffd25a', '#a06a00'], crumble: ['#c9a774', '#6b4a22'], move: ['#b5dcff', '#2a6fb8'] }[pl.type];
  if (pl.crack > 0) cols[0] = '#ff9a8a';
  rr(x, y, pl.w, h, 6); ctx.fillStyle = cols[0]; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = cols[1]; ctx.stroke();
  // 雲紋
  ctx.strokeStyle = cols[1]; ctx.lineWidth = 1.5;
  for (let i = 10; i < pl.w - 6; i += 16) { ctx.beginPath(); ctx.arc(x + i, y + 7, 3.5, Math.PI, Math.PI * 2.6); ctx.stroke(); }
  if (pl.type === 'crumble') { ctx.strokeStyle = '#4a2e10'; ctx.beginPath(); ctx.moveTo(x + pl.w * .4, y); ctx.lineTo(x + pl.w * .5, y + 6); ctx.lineTo(x + pl.w * .45, y + h); ctx.stroke(); }
  if (pl.type === 'spring') {
    const c = pl.comp > 0 ? 4 : 10;
    ctx.strokeStyle = '#c0262d'; ctx.lineWidth = 3; ctx.beginPath();
    for (let i = 0; i <= 4; i++) ctx.lineTo(pl.x + (i % 2 ? 7 : -7), y - c * i / 4);
    ctx.stroke(); ctx.fillStyle = '#c0262d'; ctx.fillRect(pl.x - 10, y - c - 3, 20, 4);
  }
  if (pl.type === 'spike') {
    ctx.fillStyle = '#bbb'; ctx.strokeStyle = '#444'; ctx.lineWidth = 1;
    for (let i = 4; i < pl.w - 4; i += 10) { ctx.beginPath(); ctx.moveTo(x + i, y); ctx.lineTo(x + i + 5, y - 11); ctx.lineTo(x + i + 10, y); ctx.fill(); ctx.stroke(); }
  }
  if (pl.type === 'move') { ctx.fillStyle = '#2a6fb8'; txt('◀▶', pl.x, y + 6, 8, '#2a6fb8', 'center', null); }
  ctx.restore();
}

function drawItem(it) {
  const { x, y } = it;
  if (it.t === 'coin') {
    const s = Math.abs(Math.cos(it.ph)) * .8 + .2;
    ctx.save(); ctx.translate(x, y); ctx.scale(s, 1);
    ctx.fillStyle = '#e8b020'; ctx.beginPath(); ctx.ellipse(0, 0, 8, 11, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = '#8a5a00'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = '#ffe58a'; ctx.beginPath(); ctx.ellipse(-2, -3, 3, 5, 0, 0, 7); ctx.fill();
    ctx.restore();
  } else if (it.t === 'scroll') {
    const b = Math.sin(it.ph) * 3;
    ctx.save(); ctx.translate(x, y + b); ctx.rotate(-.3);
    ctx.fillStyle = '#fff3d0'; ctx.fillRect(-14, -6, 28, 12); ctx.strokeStyle = '#6b4a22'; ctx.lineWidth = 1.5; ctx.strokeRect(-14, -6, 28, 12);
    ctx.fillStyle = '#c0262d'; ctx.fillRect(-3, -7, 6, 14);
    ctx.fillStyle = '#6b4a22'; ctx.fillRect(-17, -7, 4, 14); ctx.fillRect(13, -7, 4, 14);
    ctx.restore();
    ctx.globalAlpha = .3 + .2 * Math.sin(it.ph * 2); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y, 20, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
  } else if (it.t === 'chest') {
    const b = Math.sin(it.ph) * 2;
    ctx.save(); ctx.translate(x, y + b);
    ctx.fillStyle = '#8a4a1a'; rr(-14, -10, 28, 20, 3); ctx.fill(); ctx.strokeStyle = '#3a1a00'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#ffd25a'; ctx.fillRect(-14, -3, 28, 4); ctx.fillRect(-3, -4, 6, 8);
    ctx.restore();
  }
}

// ===== 主角圖：載入後為每個角色產生換色版本（紅色系的像素換成該角色的顏色） =====
const HERO_IMG = new Image();
const heroSprites = [];
// 每個角色：色相（null＝維持原本的紅）、飽和度倍率、亮度倍率
const SKIN_TINT = [{ h: null }, { h: 214, s: 1, l: 1 }, { h: 328, s: .75, l: 1.18 }, { h: 0, s: .08, l: .5 }];
HERO_IMG.onload = () => {
  for (let i = 0; i < SKINS.length; i++) heroSprites[i] = tintHero(SKIN_TINT[i]);
  updateHeroArt();
};
HERO_IMG.src = 'assets/hero.png';
function tintHero(tt) {
  const c = document.createElement('canvas'); c.width = HERO_IMG.width; c.height = HERO_IMG.height;
  const x = c.getContext('2d'); x.drawImage(HERO_IMG, 0, 0);
  if (tt.h == null) return c;
  try {
    const d = x.getImageData(0, 0, c.width, c.height), a = d.data;
    for (let i = 0; i < a.length; i += 4) {
      if (a[i + 3] < 10) continue;
      const r = a[i] / 255, gg = a[i + 1] / 255, b = a[i + 2] / 255;
      const mx = Math.max(r, gg, b), mn = Math.min(r, gg, b), l = (mx + mn) / 2, dd = mx - mn;
      if (dd < .2 || mx !== r || gg > r * .75) continue;   // 只換鮮豔的紅色（衣服），膚色、黑線、刀不動
      const s = dd / (1 - Math.abs(2 * l - 1));
      const [nr, ng, nb] = hsl2rgb(tt.h / 360, clamp(s * tt.s, 0, 1), clamp(l * tt.l, 0, 1));
      a[i] = nr; a[i + 1] = ng; a[i + 2] = nb;
    }
    x.putImageData(d, 0, 0);
  } catch (e) { }   // 以 file:// 開啟時無法讀像素，就用原色
  return c;
}
function hsl2rgb(h, s, l) {
  const f = n => { const k = (n + h * 12) % 12, a = s * Math.min(l, 1 - l); return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)))); };
  return [f(0), f(8), f(4)];
}
// 商店用的小頭像（快取成 dataURL）
const heroThumbs = [];
function heroThumb(i) {
  if (heroThumbs[i] || !heroSprites[i]) return heroThumbs[i];
  const c = document.createElement('canvas'); c.width = c.height = 96; c.getContext('2d').drawImage(heroSprites[i], 0, 0, 96, 96);
  try { heroThumbs[i] = c.toDataURL(); } catch (e) { }
  return heroThumbs[i];
}
// 標題畫面的大圖跟著目前選的角色換色
function updateHeroArt() {
  const s = heroSprites[save.skin || 0];
  if (!s) return;
  let url = 'assets/hero.png';
  try { if (save.skin) url = s.toDataURL(); } catch (e) { }
  for (const el of document.querySelectorAll('.hero-tint')) el.src = url;
}

function drawNinja(x, y, o) {
  const spr = heroSprites[o.skin || 0];
  if (spr) return drawHeroSprite(x, y, o, spr);
  const sk = SKINS[o.skin || 0];
  ctx.save(); ctx.translate(x, y);
  if (o.inv > 0 && !o.fly && ((o.t * 16) | 0) % 2) ctx.globalAlpha = .4;
  const sq = o.sq || 0, st = clamp(-o.vy / 2500, -.1, .12);
  ctx.scale(o.face * (1 + sq * .25 - st), 1 - sq * .2 + st);
  // 圍巾
  ctx.strokeStyle = sk.band; ctx.lineWidth = 4; ctx.lineCap = 'round';
  const w = Math.sin(o.t * 15) * 4;
  ctx.beginPath(); ctx.moveTo(-6, -40); ctx.quadraticCurveTo(-18, -40 + w, -30, -42 + o.vy * .012 + w); ctx.stroke();
  // 刀
  ctx.strokeStyle = '#333'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-9, -14); ctx.lineTo(-16, -44); ctx.stroke();
  ctx.fillStyle = '#d9a441'; ctx.fillRect(-15, -26, 7, 3);
  // 腳
  ctx.fillStyle = o.dark || sk.dark;
  const up = o.vy < 0;
  ctx.fillStyle = sk.dark;
  if (up) { rr(-8, -12, 7, 10, 3); ctx.fill(); rr(2, -10, 7, 8, 3); ctx.fill(); }
  else { rr(-8, -12, 6, 12, 3); ctx.fill(); rr(3, -12, 6, 12, 3); ctx.fill(); }
  // 身體
  ctx.fillStyle = sk.suit; rr(-10, -30, 20, 20, 6); ctx.fill();
  ctx.fillStyle = sk.dark; ctx.fillRect(-10, -17, 20, 3);
  // 手
  ctx.strokeStyle = sk.suit; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(6, -26); ctx.lineTo(up ? 14 : 15, up ? -36 : -18); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-6, -26); ctx.lineTo(up ? -13 : -14, up ? -34 : -18); ctx.stroke();
  // 頭
  ctx.fillStyle = sk.suit; ctx.beginPath(); ctx.arc(0, -40, 12, 0, 7); ctx.fill();
  ctx.fillStyle = '#f7d2a6'; ctx.beginPath(); ctx.ellipse(4, -40, 8, 5, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#111'; ctx.fillRect(3, -42, 2.5, 4); ctx.fillRect(8, -42, 2.5, 4);
  if (o.freeze > 0) { ctx.globalAlpha = .55; ctx.fillStyle = '#9ae0ff'; rr(-16, -56, 32, 58, 6); ctx.fill(); ctx.globalAlpha = 1; }
  ctx.restore();
  if (o.slow > 0) { ctx.strokeStyle = '#c58aff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y - 25, 24, o.t * 6, o.t * 6 + 4); ctx.stroke(); }
}

// 用主角圖畫玩家：依動作旋轉、壓扁伸展（圖本身朝右）
function drawHeroSprite(x, y, o, spr) {
  const S = 68, cy = y - 30;
  ctx.save(); ctx.translate(x, cy);
  if (o.inv > 0 && !o.fly && ((o.t * 16) | 0) % 2) ctx.globalAlpha *= .4;
  let rot;
  if (o.dash) rot = Math.atan2(o.dvy, Math.abs(o.dvx)) * .55;   // 衝刺：朝衝刺方向傾斜
  else if (o.dive) rot = .9;                                     // 急降斬：往下俯衝
  else if (o.fly) rot = -.35;
  else rot = clamp(o.vy / 2600, -.22, .3);                      // 上升前傾、下落後仰
  const sq = o.sq || 0, st = o.dash || o.fly ? .1 : clamp(-o.vy / 2600, -.08, .1);
  ctx.scale(o.face, 1); ctx.rotate(rot);
  ctx.scale(1 + sq * .22 - st, 1 - sq * .22 + st);
  ctx.drawImage(spr, -S / 2, -S / 2, S, S);
  if (o.freeze > 0) { ctx.globalAlpha = .5; ctx.fillStyle = '#9ae0ff'; rr(-S / 2, -S / 2, S, S, 10); ctx.fill(); }
  ctx.restore();
  if (o.slow > 0) { ctx.strokeStyle = '#c58aff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, cy, 30, o.t * 6, o.t * 6 + 4); ctx.stroke(); }
}

// 第 7 種以後的敵人（妖怪類）
function drawCreature(x, y, type, s, t, e) {
  const ed = ENEMY[type], fl = e && e.flash > 0;
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  if (type === 7) { // 烏鴉
    const w = Math.sin(t * 16) * 8, dir = e && e.vx < 0 ? -1 : 1;
    ctx.scale(dir, 1); ctx.fillStyle = fl ? '#fff' : ed.col;
    ctx.beginPath(); ctx.moveTo(-14, -w); ctx.lineTo(0, 2); ctx.lineTo(14, -w); ctx.lineTo(0, -4); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.ellipse(2, 0, 9, 5, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#e8b020'; ctx.beginPath(); ctx.moveTo(10, -1); ctx.lineTo(16, 1); ctx.lineTo(10, 3); ctx.fill();
    ctx.fillStyle = '#ff3a3a'; ctx.fillRect(6, -2, 2, 2);
  } else if (type === 8 || type === 13) { // 小天狗／大天狗：紅臉長鼻、黑翅膀
    const big = type === 13, w = Math.sin(t * (big ? 6 : 12)) * (big ? 10 : 6);
    ctx.fillStyle = '#1a1a22';
    ctx.beginPath(); ctx.moveTo(-8, -2); ctx.lineTo(-30, -14 - w); ctx.lineTo(-24, 6); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(8, -2); ctx.lineTo(30, -14 - w); ctx.lineTo(24, 6); ctx.closePath(); ctx.fill();
    ctx.fillStyle = fl ? '#fff' : ed.col; ctx.beginPath(); ctx.arc(0, 0, 13, 0, 7); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.fillRect(-7, -5, 5, 3); ctx.fillRect(2, -5, 5, 3);
    ctx.fillStyle = fl ? '#fff' : '#d8463a'; ctx.beginPath(); ctx.moveTo(-3, -1); ctx.lineTo(0, 13); ctx.lineTo(3, -1); ctx.fill();
    ctx.fillStyle = '#222'; ctx.fillRect(-11, -13, 22, 4);   // 頭巾
    if (big) { ctx.fillStyle = '#f5e6b8'; ctx.fillRect(-2, -22, 4, 9); ctx.beginPath(); ctx.arc(0, -24, 4, 0, 7); ctx.fill(); }
  } else if (type === 10) { // 鬼火：紫色火焰，沒有身體
    const f = Math.sin(t * 10) * 3;
    ctx.fillStyle = 'rgba(176,122,255,.3)'; ctx.beginPath(); ctx.arc(0, 0, 20, 0, 7); ctx.fill();
    ctx.fillStyle = fl ? '#fff' : '#9a5aff';
    ctx.beginPath(); ctx.moveTo(-10, 4); ctx.quadraticCurveTo(-8, -10, f, -20); ctx.quadraticCurveTo(8, -10, 10, 4); ctx.arc(0, 4, 10, 0, Math.PI); ctx.fill();
    ctx.fillStyle = '#efe0ff'; ctx.beginPath(); ctx.arc(0, 4, 4, 0, 7); ctx.fill();
  } else if (type === 12) { // 蜘蛛：從上方垂絲
    ctx.strokeStyle = 'rgba(230,230,240,.7)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(0, -140); ctx.stroke();
    ctx.strokeStyle = '#2a2030'; ctx.lineWidth = 2;
    for (const sd of [-1, 1]) for (let i = 0; i < 4; i++) { const a = (i - 1.5) * .45; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(sd * 16, -4 + i * 5 + Math.sin(t * 8 + i) * 2); ctx.lineTo(sd * 20, 6 + i * 4 + a); ctx.stroke(); }
    ctx.fillStyle = fl ? '#fff' : ed.col; ctx.beginPath(); ctx.ellipse(0, 0, 10, 12, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#ff3a3a'; ctx.fillRect(-5, -4, 3, 3); ctx.fillRect(2, -4, 3, 3);
  }
  if (e && e.warn) txt('!', 0, -ed.h / 2 - 12, 18, '#ff3a3a', 'center', '#fff', 3);
  ctx.restore();
}

function drawEnemy(x, y, type, s = 1, t = 0, e = null) {
  if (type === 13 && s === 1) s = 2.4;   // 大天狗畫大一點
  if (type >= 7 && type !== 9 && type !== 11) return drawCreature(x, y, type, s, t, e);
  const ed = ENEMY[type];
  if (e && e.hidden) { // 土遁忍者藏在地板裡：只露出土堆和眼睛
    ctx.fillStyle = '#6b4a22'; ctx.beginPath(); ctx.ellipse(x, y + 14, 20, 8, 0, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#ffd25a'; ctx.fillRect(x - 6, y + 9, 3, 2); ctx.fillRect(x + 3, y + 9, 3, 2);
    return;
  }
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const bw = ed.w * .5, bh = ed.h * .55, bob = Math.sin(t * 6) * 2;
  if (type === 6) { // 菁英光環
    ctx.fillStyle = `rgba(190,120,255,${.25 + .1 * Math.sin(t * 8)})`;
    ctx.beginPath(); ctx.arc(0, 0, ed.w * .75, 0, 7); ctx.fill();
  }
  if (type === 4) { // 盾（在下方）
    ctx.fillStyle = '#9aa4b0'; ctx.strokeStyle = '#3a4048'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(0, bh * .62, ed.w * .58, 12, 0, 0, Math.PI); ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  // 手臂（展開）
  ctx.fillStyle = e && e.flash > 0 ? '#fff' : ed.col;
  ctx.beginPath(); ctx.moveTo(-bw * .4, -bh * .2 + bob); ctx.lineTo(-ed.w * .62, bh * .35); ctx.lineTo(-ed.w * .5, bh * .45); ctx.lineTo(-bw * .3, 0); ctx.fill();
  ctx.beginPath(); ctx.moveTo(bw * .4, -bh * .2 + bob); ctx.lineTo(ed.w * .62, bh * .35); ctx.lineTo(ed.w * .5, bh * .45); ctx.lineTo(bw * .3, 0); ctx.fill();
  rr(-bw / 2, -bh * .3, bw, bh, bw * .35); ctx.fill();
  ctx.beginPath(); ctx.arc(0, -bh * .45, ed.w * .2 + 4, 0, 7); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.fillRect(-7, -bh * .5 - 2, 5, 3); ctx.fillRect(2, -bh * .5 - 2, 5, 3);
  ctx.fillStyle = type === 6 ? '#ffd27a' : type === 3 ? '#5ad1ff' : '#c0262d';
  ctx.fillRect(-ed.w * .2 - 4, -bh * .62, ed.w * .4 + 8, 3);
  txt(ed.n, 0, bh * .2, 10, '#fff', 'center', null);
  if (type === 3) { // 手中的手裡劍
    ctx.save(); ctx.translate(ed.w * .55, bh * .3); ctx.rotate(t * 10); ctx.fillStyle = '#ccd';
    ctx.fillRect(-6, -1.5, 12, 3); ctx.fillRect(-1.5, -6, 3, 12); ctx.restore();
  }
  if (type === 5) { // 背上的炸彈與引信
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(bw * .6, -bh * .5, 8, 0, 7); ctx.fill();
    ctx.strokeStyle = '#a07040'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(bw * .6 + 4, -bh * .5 - 6); ctx.lineTo(bw * .6 + 9, -bh * .5 - 12); ctx.stroke();
    ctx.fillStyle = Math.sin(t * 30) > 0 ? '#ffd25a' : '#ff5a1a'; ctx.beginPath(); ctx.arc(bw * .6 + 10, -bh * .5 - 13, 3, 0, 7); ctx.fill();
  }
  if (e && e.warn) txt('!', 0, -bh - 12, 20, '#ff3a3a', 'center', '#fff', 3);
  // 菁英詞綴標記
  if (e && e.affix) txt({ fast: '迅', split: '分', tough: '鐵' }[e.affix], ed.w * .45, -bh * .6, 10, '#ffd27a', 'center', '#000', 3);
  // 弓忍手上的弓
  if (type === 9) { ctx.strokeStyle = '#a07040'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(ed.w * .45, bh * .2, 12, -1.2, 1.2); ctx.stroke(); }
  if (e && type === 6) for (let i = 0; i < e.hp; i++) txt('◆', -5 + i * 10, -bh - 8, 9, '#e0b0ff', 'center', '#000', 2);
  ctx.restore();
}

function drawBoss(b, x, y, s) {
  const k = BOSS_KINDS[b.kind];
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  // 角
  ctx.fillStyle = '#f5e6b8';
  ctx.beginPath(); ctx.moveTo(-20, -18); ctx.lineTo(-30, -48); ctx.lineTo(-8, -26); ctx.fill();
  ctx.beginPath(); ctx.moveTo(20, -18); ctx.lineTo(30, -48); ctx.lineTo(8, -26); ctx.fill();
  ctx.fillStyle = k.col; ctx.beginPath(); ctx.arc(0, 0, 30, 0, 7); ctx.fill();
  ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = '#222'; ctx.fillRect(-30, -10, 60, 5);
  ctx.fillStyle = '#ffe24a';
  ctx.beginPath(); ctx.moveTo(-20, -2); ctx.lineTo(-6, 2); ctx.lineTo(-18, 6); ctx.fill();
  ctx.beginPath(); ctx.moveTo(20, -2); ctx.lineTo(6, 2); ctx.lineTo(18, 6); ctx.fill();
  ctx.fillStyle = '#300'; rr(-14, 12, 28, 10, 4); ctx.fill();
  ctx.fillStyle = '#fff';
  for (let i = -12; i < 12; i += 6) { ctx.beginPath(); ctx.moveTo(i, 12); ctx.lineTo(i + 3, 18); ctx.lineTo(i + 6, 12); ctx.fill(); }
  if (b.shield) { ctx.strokeStyle = 'rgba(200,220,255,.9)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, 0, 40, 0, 7); ctx.stroke(); ctx.fillStyle = 'rgba(200,220,255,.2)'; ctx.fill(); }
  ctx.restore();
}

// 自動技能與掉落物（世界座標）
function drawSkillFx() {
  const p = g.p, S = g.sks, px = p.x, py = p.y - 20;
  // 掉落物：魂是藍色人魂，小判是金幣
  for (const d of g.drops) {
    if (d.k === 'soul') {
      const r = 4 + Math.min(d.v, 8) * .6, fl = Math.sin(d.ph) * 2;
      ctx.fillStyle = 'rgba(90,209,255,.35)'; ctx.beginPath(); ctx.arc(d.x, d.y, r * 2.2, 0, 7); ctx.fill();
      ctx.fillStyle = '#5ad1ff'; ctx.beginPath(); ctx.moveTo(d.x - r, d.y); ctx.quadraticCurveTo(d.x + fl, d.y - r * 3.2, d.x + r, d.y); ctx.arc(d.x, d.y, r, 0, Math.PI); ctx.fill();
      ctx.fillStyle = '#e8fbff'; ctx.beginPath(); ctx.arc(d.x, d.y, r * .45, 0, 7); ctx.fill();
    } else {
      const s = Math.abs(Math.cos(d.ph)) * .8 + .2;
      ctx.save(); ctx.translate(d.x, d.y); ctx.scale(s, 1);
      ctx.fillStyle = '#e8b020'; ctx.beginPath(); ctx.ellipse(0, 0, 5, 7, 0, 0, 7); ctx.fill();
      ctx.strokeStyle = '#8a5a00'; ctx.lineWidth = 1; ctx.stroke(); ctx.restore();
    }
  }
  // 金剛氣：淡藍色範圍圈
  if (sk('aura')) { const v = SKV.aura(sk('aura')); ctx.strokeStyle = 'rgba(154,216,255,.25)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(px, py, v.r, 0, 7); ctx.stroke(); }
  // 結界：泡泡
  if (g.barrier > 0) {
    ctx.strokeStyle = `rgba(154,216,255,${.6 + .2 * Math.sin(g.t * 6)})`; ctx.lineWidth = 2.5;
    ctx.fillStyle = 'rgba(154,216,255,.12)'; ctx.beginPath(); ctx.arc(px, py - 4, 28, 0, 7); ctx.fill(); ctx.stroke();
    if (g.barrier > 1) { ctx.beginPath(); ctx.arc(px, py - 4, 33, 0, 7); ctx.stroke(); }
  }
  // 苦無環
  if (sk('kunai')) {
    const v = SKV.kunai(sk('kunai'));
    for (let i = 0; i < v.n; i++) {
      const a = (S.kunA || 0) + i * Math.PI * 2 / v.n;
      ctx.save(); ctx.translate(px + Math.cos(a) * v.r, py + Math.sin(a) * v.r); ctx.rotate(a + Math.PI / 2); if (sk('kunai') > SK_MAX) ctx.scale(1.5, 1.5);
      ctx.fillStyle = '#d8dde6'; ctx.beginPath(); ctx.moveTo(0, -9); ctx.lineTo(3.5, 2); ctx.lineTo(-3.5, 2); ctx.fill();
      ctx.fillStyle = '#5a3a1c'; ctx.fillRect(-1.5, 2, 3, 6); ctx.restore();
    }
  }
  // 風刃
  for (const b of g.blades) {
    const a = Math.atan2(b.vy, b.vx);
    ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(a); ctx.globalAlpha = Math.max(0, 1 - b.t / 2);
    ctx.strokeStyle = '#e8fff4'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(-b.size * .4, 0, b.size, -1.1, 1.1); ctx.stroke();
    ctx.strokeStyle = 'rgba(140,230,190,.6)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(-b.size * .6, 0, b.size, -.8, .8); ctx.stroke();
    ctx.restore();
  }
  ctx.globalAlpha = 1;
  // 雷（或式神鳥的啄擊線）
  for (const o of g.bolts) {
    ctx.globalAlpha = 1 - o.t / .25; ctx.strokeStyle = o.fx != null && !o.zap ? '#ffffff' : '#fff59a'; ctx.lineWidth = o.fx != null ? 2 : 3;
    ctx.beginPath();
    if (o.fx != null) { ctx.moveTo(o.fx, o.fy); ctx.lineTo(o.x, o.y); }
    else { let y = g.camY - 10, x = o.x + rnd(-20, 20); ctx.moveTo(x, y); while (y < o.y) { y += 28; x = o.x + (y < o.y ? rnd(-16, 16) : 0); ctx.lineTo(x, Math.min(y, o.y)); } }
    ctx.stroke();
    if (o.fx == null) { ctx.fillStyle = 'rgba(255,245,154,.5)'; ctx.beginPath(); ctx.arc(o.x, o.y, 18 * (1 - o.t / .25), 0, 7); ctx.fill(); }
  }
  ctx.globalAlpha = 1;
  // 式神鳥
  if (sk('shiki')) {
    const a = S.biA || 0, bx = px + Math.cos(a) * 30, by = py - 34 + Math.sin(a * 2) * 6, fl = Math.sin(g.t * 18) * 5;
    ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#c0262d'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(bx - 9, by - fl); ctx.lineTo(bx, by + 2); ctx.lineTo(bx + 9, by - fl); ctx.lineTo(bx, by - 2); ctx.closePath(); ctx.fill(); ctx.stroke();
  }
}

// 左右牆壁：粗竹柱，隨相機捲動
function drawWalls(camY, stage) {
  const th = THEMES[stage % 4], seg = 70, o = ((-camY) % seg + seg) % seg;
  for (const x0 of [0, W - WALL]) {
    ctx.fillStyle = th.node; ctx.fillRect(x0, 0, WALL, H);
    ctx.fillStyle = th.stalk; ctx.fillRect(x0 + 2, 0, WALL - 4, H);
    ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(x0 + 4, 0, 3, H);
    ctx.fillStyle = th.node;
    for (let y = o - seg; y < H; y += seg) ctx.fillRect(x0, y, WALL, 5);
  }
  ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(WALL, 0, 3, H); ctx.fillRect(W - WALL - 3, 0, 3, H);
}

// 彈射瞄準的軌跡預覽（世界座標）
function drawAim() {
  const p = g.p, a = aimInfo(), ok = g.ki >= 1;
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
  const a = aimInfo(), ok = g.ki >= 1;
  ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(inp.sx, inp.sy, AIM_MIN, 0, 7); ctx.stroke();
  ctx.strokeStyle = ok ? '#ffd27a' : '#888'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(inp.sx, inp.sy); ctx.lineTo(inp.cx, inp.cy); ctx.stroke();
  ctx.fillStyle = ok ? '#ffd27a' : '#888'; ctx.beginPath(); ctx.arc(inp.cx, inp.cy, 8, 0, 7); ctx.fill();
  const msg = !ok ? t('ki_low') : a ? t('aim_go') : t('aim_cancel');
  txt(msg, W / 2, H - 60, 14, ok ? '#fff' : '#9ad8ff', 'center', '#000', 3);
}

function drawZone(camY, stage, t) {
  const zy = Math.min(g.zoneY, camY + H - 26) - camY;
  const type = THEMES[stage % 4].zone;
  if (zy > H) return;
  if (type === 'fire') {
    const gr = ctx.createLinearGradient(0, zy, 0, H); gr.addColorStop(0, '#ff6a1a'); gr.addColorStop(1, '#9a0a00');
    ctx.fillStyle = gr; ctx.fillRect(0, zy, W, H - zy);
    for (let i = 0; i < 12; i++) {
      const x = i * 32 + 8, h = 26 + Math.sin(t * 9 + i * 1.7) * 12;
      ctx.fillStyle = i % 2 ? '#ffb23a' : '#ff6a1a';
      ctx.beginPath(); ctx.moveTo(x - 16, zy + 4); ctx.quadraticCurveTo(x - 4, zy - h * .5, x + Math.sin(t * 7 + i) * 4, zy - h); ctx.quadraticCurveTo(x + 6, zy - h * .4, x + 16, zy + 4); ctx.fill();
    }
  } else if (type === 'sea') {
    ctx.fillStyle = '#1a5aa8'; ctx.beginPath(); ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 10) ctx.lineTo(x, zy + Math.sin(x * .05 + t * 4) * 7);
    ctx.lineTo(W, H); ctx.fill();
    ctx.strokeStyle = '#e8f6ff'; ctx.lineWidth = 3; ctx.beginPath();
    for (let x = 0; x <= W; x += 10) ctx.lineTo(x, zy + Math.sin(x * .05 + t * 4) * 7);
    ctx.stroke();
    ctx.fillStyle = '#0d3a78'; ctx.fillRect(0, zy + 30, W, H);
  } else {
    ctx.fillStyle = '#2a0e2e'; ctx.fillRect(0, zy, W, H - zy);
    for (let i = 0; i < 5; i++) {
      const x = 36 + i * 72, yy = zy + 18 + Math.sin(t * 2 + i) * 4;
      ctx.fillStyle = '#ff2a2a'; ctx.beginPath(); ctx.ellipse(x, yy, 9, 6, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#000'; ctx.fillRect(x - 1.5, yy - 5, 3, 10);
    }
    ctx.fillStyle = '#f0e0c0';
    for (let x = 0; x < W; x += 18) { ctx.beginPath(); ctx.moveTo(x, zy); ctx.lineTo(x + 9, zy - 14 - Math.sin(t * 5 + x) * 4); ctx.lineTo(x + 18, zy); ctx.fill(); }
  }
}

function drawHUD() {
  ctx.save();
  // 整條 HUD 往下移到瀏海（含 iOS 模糊帶）下面；背景從畫面最頂端一路畫下來，不留接縫
  if (SAFE_T > 0) ctx.translate(0, SAFE_T);
  // 上方資訊列（忍術風）：夜行衣的深藍黑底＋淡金青海波紋，底部金線＋黑邊收尾
  const HB = 64, y0 = -SAFE_T;
  const hg = ctx.createLinearGradient(0, y0, 0, HB); hg.addColorStop(0, '#0a0d14'); hg.addColorStop(1, '#1a2236');
  ctx.fillStyle = hg; ctx.fillRect(0, y0, W, HB - y0);
  ctx.globalAlpha = .5; ctx.fillStyle = hudPattern(); ctx.fillRect(0, y0, W, HB - y0); ctx.globalAlpha = 1;
  ctx.fillStyle = 'rgba(232,184,74,.35)'; ctx.fillRect(0, HB - 5, W, 2);
  ctx.fillStyle = INK; ctx.fillRect(0, HB - 3, W, 4);
  // 分數：手裡劍圖示＋數字
  drawShuriken(15, 15, 10, g.t * 2);
  txt('SCORES ' + String(score()).padStart(7, '0'), 28, 15, 14, '#fff', 'left', INK, 4);
  // 小判
  ctx.fillStyle = '#e8b020'; ctx.beginPath(); ctx.ellipse(196, 15, 6, 8, 0, 0, 7); ctx.fill();
  txt(String(Math.floor(g.coins)), 206, 15, 14, '#ffd27a', 'left', '#000', 3);
  // 卷軸（可點擊）
  ctx.fillStyle = g.scrolls ? '#fff3d0' : '#777'; ctx.fillRect(12, 36, 22, 10); ctx.fillStyle = '#c0262d'; ctx.fillRect(20, 35, 5, 12);
  txt('x' + g.scrolls, 40, 42, 14, g.scrolls ? '#fff' : '#999', 'left', '#000', 3);
  if (g.scrolls && g.fly <= 0) txt(t('tap_use'), 64, 42, 9, '#ffd27a', 'left', null);
  // HP
  // HP 血條（低於 30% 會閃爍）
  const hr = g.hp / g.maxHp, low = hr < .3 && Math.sin(g.t * 10) > 0;
  // 血條左邊的紅色「命」字印章
  seal(110, 42, 17, '命');
  bar(122, 34, 104, 16, hr, low ? '#ff9a9a' : hr < .3 ? '#ff3a3a' : '#e5342a');
  txt(`${Math.ceil(g.hp)}/${g.maxHp}`, 174, 42, 10, '#fff', 'center', INK, 3);
  // 高度、幕名（紅色落款方印）
  txt(Math.floor(g.top / 10) + 'm', W - 52, 15, 13, '#fff', 'right', INK, 3);
  seal(W - 63, 42, 20, THEMES[g.stage % 4].k);
  // 暫停：金框圓形家紋
  const px = W - 25, py = 29;
  ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(px, py, 17, 0, 7); ctx.fill();
  ctx.fillStyle = '#141a28'; ctx.beginPath(); ctx.arc(px, py, 14.5, 0, 7); ctx.fill();
  ctx.strokeStyle = '#e8b84a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(px, py, 14.5, 0, 7); ctx.stroke();
  ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(px, py, 11, 0, 7); ctx.stroke();
  ctx.fillStyle = '#e8b84a'; ctx.fillRect(px - 6, py - 7, 4, 14); ctx.fillRect(px + 2, py - 7, 4, 14);
  // 本幕進度：底部金線亮起來的部分
  const pr = clamp((g.top - g.bossN * STAGE_PX) / STAGE_PX, 0, 1);
  ctx.fillStyle = '#ffe28a'; ctx.fillRect(0, HB - 5, W * pr, 2);
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
  ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(0, 67, W, 4);
  ctx.fillStyle = '#5ad1ff'; ctx.fillRect(0, 67, W * clamp(g.xp / xpNeed(g.lv), 0, 1), 4);
  txt(`Lv ${g.lv}`, W - 12, 80, 12, '#9ad8ff', 'right', '#000', 3);
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
      ctx.fillStyle = '#ffd27a'; ctx.fillRect(W / 2 - 40, 104, 80 * (g.comboT / (3 + 1.2 * pk('combo'))), 3);
      if (g.combo < 10) txt(t('chain_hint', 10 - g.combo), W / 2, 116, 9, '#fff', 'center', '#000', 2);
    }
  }
  // BOSS
  const b = g.boss;
  if (b) {
    bar(40, 110, W - 80, 16, b.hp / b.max, '#e5342a');
    bar(40, 127, W - 80, 9, clamp(b.life / 22, 0, 1), '#e8b84a');
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
  // 鐵灰帶＋紅色緞帶（竹林夜襲風格）
  const y0 = H * .3;
  ctx.fillStyle = INK; ctx.fillRect(0, y0 - 4, W, 128);
  const bg = ctx.createLinearGradient(0, y0, 0, y0 + 120); bg.addColorStop(0, '#4f5a5f'); bg.addColorStop(1, '#232a2d');
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
  ctx.save(); ctx.translate(rnd(-3, 3), rnd(-3, 3));
  drawEnemy(W / 2, H / 2, s.e.type, 3, s.t);
  ctx.restore();
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

function drawCast() {
  const k = 1 - g.castT;
  ctx.fillStyle = 'rgba(20,0,0,.75)'; ctx.fillRect(0, 0, W, H);
  speedLines(k * 8, 'rgba(255,200,120,.5)');
  ctx.save(); ctx.translate(W / 2, H / 2 + 40); ctx.rotate(-.2);
  ctx.fillStyle = '#fff3d0'; ctx.fillRect(-120, -40, 240, 80); ctx.fillStyle = '#6b4a22'; ctx.fillRect(-130, -44, 12, 88); ctx.fillRect(118, -44, 12, 88);
  ctx.restore();
  txt(t('cast_top'), W / 2, H * .3, 30, '#ffd27a', 'center', '#000', 5);
  const s = Math.min(1, k * 4);
  txt(t('cast_name'), W / 2, H / 2 + 34, 46 * (2 - s) * (LI === 2 ? .7 : 1), '#c0262d', 'center', '#fff', 6);
  drawNinja(W / 2, H * .82, { face: 1, t: g.t + k, vy: -800, skin: save.skin });
}

function drawQte() {
  const q = g.qte, b = g.boss;
  ctx.fillStyle = 'rgba(40,0,0,.8)'; ctx.fillRect(0, 0, W, H);
  speedLines(q.t * 6);
  const sh = q.hits.length ? 5 : 1;
  drawBoss(b, W / 2 + rnd(-sh, sh), H * .42 + rnd(-sh, sh), 3.2);
  for (const h of q.hits) {
    ctx.save(); ctx.translate(W / 2 + h.x, H * .42 + h.y); ctx.rotate(h.a); ctx.globalAlpha = 1 - h.t / .35; ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.moveTo(-120, 0); ctx.lineTo(0, -5); ctx.lineTo(120, 0); ctx.lineTo(0, 5); ctx.fill(); ctx.restore();
  }
  ctx.globalAlpha = 1;
  // HP
  ctx.fillStyle = '#000'; ctx.fillRect(30, 70, W - 60, 18);
  ctx.fillStyle = '#c0262d'; ctx.fillRect(32, 72, (W - 64) * (b.hp / b.max), 14);
  txt(`${L(BOSS_KINDS[b.kind].n)}  HP`, W / 2, 60, 13, '#fff', 'center', '#000', 3);
  // 時間
  ctx.fillStyle = '#000'; ctx.fillRect(30, H - 70, W - 60, 10);
  ctx.fillStyle = '#ffd27a'; ctx.fillRect(32, H - 68, (W - 64) * (1 - q.t / q.tl), 6);
  const pulse = 1 + Math.sin(q.t * 18) * .08;
  txt(L(q.q.n), W / 2, H * .74, 54 * pulse * (LI === 2 ? .8 : 1), '#fff', 'center', '#c0262d', 8);
  txt(L(q.q.hint), W / 2, H * .81, 14, '#ffd27a', 'center', '#000', 3);
  if (q.type === 'swipe') { ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 4; const x = (q.t * 500) % (W + 100) - 50; ctx.beginPath(); ctx.moveTo(x - 60, H * .88); ctx.lineTo(x, H * .86); ctx.stroke(); }
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
    ['一', '擊', '必', '殺'].forEach((c, i) => txt(c, W * .78, H * .2 + i * 70, 62 * (1.6 - .6 * s), '#fff', 'center', '#c0262d', 8));
  }
}

// 最外層背景色跟著畫面最底部走（標題＝底部選單、遊戲中＝死亡區域），
// iOS 主畫面模式下若還留一點畫不到的縫，也會和畫面融為一體
const ZONE_BG = { fire: '#9a0a00', sea: '#0d3a78', monster: '#2a0e2e' };
let rootBg = '';
function syncRootBg() {
  const c = state === 'menu' || !g ? '#161c1e' : ZONE_BG[THEMES[g.stage % 4].zone];
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
    drawBG(-t * 40, Math.floor(t / 6) % 4, t);
    ctx.fillStyle = '#6b4a22'; ctx.fillRect(0, H - 70, W, 70); ctx.fillStyle = '#4a8a3a'; ctx.fillRect(0, H - 80, W, 12);
    drawNinja(demo.x, demo.y + H - 550,{ face: demo.face, t: demo.t, vy: demo.vy, skin: save.skin });
    return;
  }
  const camY = g.camY;
  drawBG(camY, g.stage, g.t);
  drawWalls(camY, g.stage);
  ctx.save();
  if (g.shake > 0) ctx.translate(rnd(-g.shake, g.shake) * .5, rnd(-g.shake, g.shake) * .5);
  ctx.translate(0, -camY);
  for (const pl of g.plats) if (pl.y - camY > -20 && pl.y - camY < H + 20) drawPlat(pl);
  for (const it of g.items) drawItem(it);
  for (const e of g.enemies) if (!e.dead) drawEnemy(e.x, e.y, e.type, 1, e.ph, e);
  if (g.boss && state !== 'kill') drawBoss(g.boss, g.boss.x, g.boss.y, 1);
  const p = g.p;
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
  else drawNinja(p.x, p.y, { face: p.face, t: g.t, vy: p.vy, sq: p.sq, inv: p.inv, fly: g.fly > 0, slow: p.slow, freeze: p.freeze, skin: save.skin, dash: p.dash > 0, dvx: p.dvx, dvy: p.dvy, dive: p.dive });
  for (const s of g.shots) { ctx.save(); ctx.translate(s.cx, s.cy); ctx.rotate(s.t * 20); if (s.pierce) ctx.scale(2.2, 2.2); ctx.fillStyle = s.pierce ? '#ffe9a0' : '#ddd'; ctx.fillRect(-6, -1.5, 12, 3); ctx.fillRect(-1.5, -6, 3, 12); ctx.restore(); }
  drawSkillFx();
  // 敵方攻擊
  for (const s of g.eshots) {
    if (s.kind === 'arrow' || s.kind === 'kunai') { // 箭與苦無：朝飛行方向
      ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(Math.atan2(s.vy, s.vx));
      ctx.strokeStyle = s.kind === 'arrow' ? '#c8a060' : '#b8c0cc'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-12, 0); ctx.lineTo(8, 0); ctx.stroke();
      ctx.fillStyle = '#ff5a5a'; ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(6, -4); ctx.lineTo(6, 4); ctx.fill(); ctx.restore();
      continue;
    }
    if (s.kind === 'web') { // 蛛絲
      ctx.strokeStyle = 'rgba(240,240,250,.85)'; ctx.lineWidth = 1.2;
      for (let i = 0; i < 4; i++) { const a = i * Math.PI / 4 + s.t * 2; ctx.beginPath(); ctx.moveTo(s.x - Math.cos(a) * 10, s.y - Math.sin(a) * 10); ctx.lineTo(s.x + Math.cos(a) * 10, s.y + Math.sin(a) * 10); ctx.stroke(); }
      ctx.beginPath(); ctx.arc(s.x, s.y, 6, 0, 7); ctx.stroke();
      continue;
    }
    ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.t * 18);
    ctx.fillStyle = '#222'; ctx.strokeStyle = '#ff5a5a'; ctx.lineWidth = 1.5;
    ctx.beginPath(); for (let i = 0; i < 8; i++) { const r = i % 2 ? 3 : 9, a = i * Math.PI / 4; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
    ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
  }
  // 斬痕
  for (const o of g.fx) {
    ctx.save(); ctx.translate(o.x, o.y); ctx.rotate(o.a); ctx.globalAlpha = 1 - o.t / .3; ctx.fillStyle = '#fff';
    const L = 50 + o.t * 120;
    ctx.beginPath(); ctx.moveTo(-L, 0); ctx.lineTo(0, -3); ctx.lineTo(L, 0); ctx.lineTo(0, 3); ctx.fill(); ctx.restore();
  }
  // 爆炸／衝擊波
  for (const o of g.booms) {
    const k = o.t / .4;
    ctx.globalAlpha = 1 - k; ctx.strokeStyle = o.c; ctx.lineWidth = 6 * (1 - k) + 1;
    ctx.beginPath(); ctx.arc(o.x, o.y, o.r * (.3 + .7 * k), 0, 7); ctx.stroke();
    if (o.c !== '#ffffff') { ctx.fillStyle = 'rgba(255,160,60,.35)'; ctx.fill(); }
  }
  ctx.globalAlpha = 1;
  for (const o of g.parts) { ctx.globalAlpha = clamp(o.life / o.max, 0, 1); ctx.fillStyle = o.c; ctx.fillRect(o.x - o.s / 2, o.y - o.s / 2, o.s, o.s); }
  ctx.globalAlpha = 1;
  for (const tx of g.texts) if (!tx.screen) { ctx.globalAlpha = clamp(1.1 - tx.t, 0, 1); txt(tx.s, tx.x, tx.y, tx.size, tx.c, 'center', '#000', 3); }
  ctx.globalAlpha = 1;
  if (inp.mode === 'aim' && state === 'play') drawAim();
  ctx.restore();
  drawZone(camY, g.stage, g.t);
  for (const tx of g.texts) if (tx.screen) { ctx.globalAlpha = clamp(1.1 - tx.t, 0, 1); txt(tx.s, W / 2, H * .22 + tx.y - tx.t * 20, tx.size, tx.c, 'center', '#000', 4); }
  ctx.globalAlpha = 1;
  if (g.fly > 0 && state === 'play') { ctx.fillStyle = 'rgba(255,220,120,.12)'; ctx.fillRect(0, 0, W, H); }
  if (g.fever > 0) { // 狂熱：金色外框
    ctx.strokeStyle = `rgba(255,200,60,${.5 + .3 * Math.sin(g.t * 12)})`; ctx.lineWidth = 10; ctx.strokeRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(255,200,60,.08)'; ctx.fillRect(0, 0, W, H);
  }
  if (state === 'slash') drawSlash();
  else if (state === 'cast') drawCast();
  else if (state === 'qte') drawQte();
  else if (state === 'kill') drawKill();
  if (state !== 'slash' && state !== 'cast' && state !== 'qte' && state !== 'kill') drawHUD();
  if (state === 'play') drawBanner();
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
const SCRS = ['title', 'pause', 'perk', 'over', 'shop', 'rank', 'opt', 'help', 'clear'];
let backTo = 'title';
function show(id, keep) { if (!keep) hideAll(); $(id).classList.add('on'); }
function hide(id) { $(id).classList.remove('on'); }
function hideAll() { SCRS.forEach(hide); }
function goTitle() {
  state = 'menu'; g = null; paused = false;
  $('tCoins').textContent = save.coins;
  show('title');
  if (ac && save.opt.snd) BGM.play(ac);
  // 重播標題出場動畫
  const it = $('intro'); it.classList.remove('play'); void it.offsetWidth; it.classList.add('play');
}
function pauseGame() { if (!g || paused || state === 'over' || state === 'perk' || state === 'menu' || state === 'clearq') return; paused = true; show('pause', true); }
function resumeGame() { paused = false; hide('pause'); hide('help'); inp.dx = 0; lastT = performance.now(); }

function showOver() {
  state = 'over';
  const sc = score(), h = Math.floor(g.top / 10), coins = Math.floor(g.coins);
  save.coins += coins; save.stats.coins += coins; save.stats.runs++;
  const nr = sc > save.best.rogue;
  if (nr) save.best.rogue = sc;
  const list = save.rank.rogue;
  list.push({ s: sc, h, d: new Date().toLocaleDateString(), st: g.stage });
  list.sort((a, b) => b.s - a.s); list.length = Math.min(list.length, 10);
  unlock('run1');
  if (save.stats.coins >= 500) unlock('coin500');
  persist();
  $('overTitle').textContent = g.cleared ? t('over_clear') : t('over_fail');
  $('overBody').innerHTML =
    `<div class="sc">${sc.toLocaleString()}</div>${nr ? `<span class="nr">${t('new_record')}</span><br>` : ''}` +
    t('over_stats', h, g.kills, g.maxCombo) + '<br>' +
    t('over_reach', L(STR.act)[g.stage % 4] + (loopN() ? t('loop', loopN()) : ''), THEMES[g.stage % 4].k, g.bossN) + '<br>' +
    t('over_coins', coins, save.coins) + '<br>' + t('over_best', save.best.rogue.toLocaleString());
  show('over');
}

function openHelp() {
  backTo = (g && state !== 'over') ? 'game' : 'title';
  $('helpBtn').textContent = backTo === 'game' ? (paused && $('pause').classList.contains('on') ? t('back') : t('help_go')) : t('help_ok');
  show('help', backTo === 'game');
}

// 把 HTML 裡 data-i18n 的元素換成目前語言
function applyLang() {
  document.documentElement.lang = ['zh-Hant', 'ja', 'en'][LI];
  for (const el of document.querySelectorAll('[data-i18n]')) el.innerHTML = t(el.dataset.i18n);
}

// 商店
let shopTab = 0;
function tabs(id, names, sel, act) {
  $(id).innerHTML = names.map((n, i) => `<button class="${i === sel ? 'sel' : ''}" data-act="${act}" data-arg="${i}">${n}</button>`).join('');
}
function renderShop() {
  $('sCoins').textContent = save.coins;
  tabs('shopTabs', [t('tab_ninja'), t('tab_train')], shopTab, 'stab');
  let h = '';
  if (shopTab === 0) {
    h = SKINS.map((s, i) => {
      const own = save.skins.includes(i), sel = save.skin === i;
      return `<div class="item"><span class="ic" style="background:${s.suit};color:${s.band}">${heroThumb(i) ? `<img src="${heroThumb(i)}" alt="" style="width:140%;margin-top:10%">` : s.n}</span><span class="nm"><b>${t('ninja_name', s.n)}</b><small>${t('start_skill', SKILLS.find(x => x.id === s.sk).ic + ' ' + L(SKILLS.find(x => x.id === s.sk).n))}・${own ? t('owned') : t('price', s.cost)}</small></span>` +
        (sel ? `<button disabled>${t('equipped')}</button>` : own ? `<button data-act="skin" data-arg="${i}">${t('equip')}</button>` : `<button data-act="buyskin" data-arg="${i}" ${save.coins < s.cost ? 'disabled' : ''}>${t('buy')}</button>`) + '</div>';
    }).join('');
  } else {
    h = META.map(m => {
      const l = save.meta[m.id], max = l >= m.max, c = m.cost(l);
      return `<div class="item"><span class="ic" style="background:#fff3d0">${m.ic}</span><span class="nm"><b>${L(m.n)}　Lv ${l}/${m.max}</b><small>${L(m.d)}${max ? '' : '・' + t('price', c)}</small></span><button data-act="buymeta" data-arg="${m.id}" ${max || save.coins < c ? 'disabled' : ''}>${max ? 'MAX' : t('train')}</button></div>`;
    }).join('');
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
    h = ACH.map(a => `<div class="item ${save.ach[a.id] ? '' : 'locked'}"><span class="ic" style="background:${save.ach[a.id] ? '#ffd27a' : '#ccc'}">🏆</span><span class="nm"><b>${L(a.n)}</b><small>${L(a.d)}</small></span></div>`).join('');
  }
  $('rankBody').innerHTML = h;
}
function renderOpt() {
  $('bSnd').textContent = t('snd', save.opt.snd ? 'ON' : 'OFF');
  $('bVib').textContent = t('vib', save.opt.vib ? 'ON' : 'OFF');
  $('bLang').textContent = t('lang', LANGS[LI].name);
  const r = $('bReset'); delete r.dataset.armed; r.textContent = t('reset');
}

let menuFrom = 'title';
function openSub(id) {
  menuFrom = $('over').classList.contains('on') ? 'over' : 'title';
  if (id === 'shop') renderShop();
  if (id === 'rank') renderRank();
  if (id === 'opt') { renderOpt(); resize(); }
  show(id);
}

document.addEventListener('click', e => {
  const b = e.target.closest('[data-act]'); if (!b || b.disabled) return;
  A(); SFX.click();
  const a = b.dataset.act, arg = b.dataset.arg;
  switch (a) {
    case 'start': case 'retry': startRun(); break;
    case 'shop': case 'rank': case 'opt': openSub(a); break;
    case 'help': openHelp(); break;
    case 'back':
      if ($('help').classList.contains('on') && backTo === 'game') { hide('help'); if (!$('pause').classList.contains('on')) resumeGame(); break; }
      if (menuFrom === 'over' && g) { show('over'); menuFrom = 'title'; break; }
      goTitle(); break;
    case 'title': goTitle(); break;
    case 'resume': resumeGame(); break;
    case 'quit': if (g) { paused = false; hideAll(); showOver(); } else goTitle(); break;
    case 'endless': hide('clear'); afterBoss(); break;
    case 'finish': hide('clear'); showOver(); break;
    case 'perk': choosePerk(+arg); break;
    case 'reroll': g.rerolls--; openPerks(perkWhy); break;
    case 'stab': shopTab = +arg; renderShop(); break;
    case 'rtab': rankTab = +arg; renderRank(); break;
    case 'skin': save.skin = +arg; persist(); renderShop(); updateHeroArt(); break;
    case 'buyskin': { const s = SKINS[+arg]; if (save.coins >= s.cost) { save.coins -= s.cost; save.skins.push(+arg); save.skin = +arg; persist(); SFX.item(); } renderShop(); updateHeroArt(); break; }
    case 'buymeta': { const m = META.find(x => x.id === arg), c = m.cost(save.meta[arg]); if (save.coins >= c && save.meta[arg] < m.max) { save.coins -= c; save.meta[arg]++; persist(); SFX.item(); } renderShop(); break; }
    case 'snd': save.opt.snd ^= 1; persist(); renderOpt(); if (!save.opt.snd) BGM.stop(); else if (state === 'menu') BGM.play(A()); break;
    case 'vib': save.opt.vib ^= 1; persist(); renderOpt(); break;
    case 'lang': LI = (LI + 1) % LANGS.length; save.opt.lang = LANGS[LI].id; persist(); applyLang(); renderOpt(); break;
    case 'reset': // 按兩次才重置（不用 confirm()，部分嵌入環境不會顯示對話框）
      if (b.dataset.armed) { const lang = save.opt.lang; save = defSave(); save.opt.lang = lang; persist(); renderOpt(); toast(t('reset_done')); }
      else { b.dataset.armed = '1'; b.textContent = t('reset_confirm'); setTimeout(renderOpt, 3000); }
      break;
  }
});

applyLang();
goTitle();
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => { });
window.__tobi = { get g() { return g; }, get state() { return state; }, startRun, spawnBoss: () => spawnBoss(), save: () => save, inp,
  step(sec, dt = 1 / 60, draw = true) { for (let t = 0; t < sec; t += dt) update(dt); if (draw) render(); } };
