'use strict';
/* NINJA 鳶 TOBI — 獎勵型廣告（玩家自己選擇要不要看，看完才給獎勵）
   兩種模式，自動判斷：
   - iOS App（Capacitor 包裝，並安裝 @capacitor-community/admob 外掛）：播 Google AdMob 真廣告。
   - 網頁版（GitHub Pages／claude.ai）：沒有 SDK，依 ADS_CFG.web 決定用「假廣告」（倒數 3 秒，測試用）或直接隱藏廣告按鈕。
   使用的地方：倒下時「看廣告復活」（每局一次）、結算時「看廣告，小判 ×2」（每局一次）。新手教學中不出現。

   上架前要改的只有 ADS_CFG：
   1. testing 改成 false。
   2. rewardedId 換成你在 AdMob 後台建立的「獎勵型廣告」廣告單元 ID（ca-app-pub-xxxx/yyyy）。
   （AdMob 的「App ID」（ca-app-pub-xxxx~zzzz）不是寫在這裡，而是寫在 Xcode 專案的 Info.plist：GADApplicationIdentifier。） */
const ADS_CFG = {
  testing: true,                                          // true＝播 Google 的測試廣告（開發時一定要用測試廣告，否則帳號可能被停權）
  rewardedId: 'ca-app-pub-3940256099942544/1712485313',   // 目前是 Google 官方的 iOS 獎勵型「測試」廣告單元 ID
  web: 'fake',                                            // 網頁版：'fake'＝假廣告（測試流程用）、'off'＝不顯示廣告按鈕
  childDirected: false,                                   // 若 App Store 年齡分級把本遊戲列為兒童類別，改成 true
};

// ===== AdMob（只在 iOS App 裡啟用） =====
const NATIVE_AD = (() => {
  const C = window.Capacitor;
  if (!C || !C.isNativePlatform || !C.isNativePlatform()) return null;
  // Capacitor 的原生橋接會注入 window.Capacitor，外掛可直接取用，不需要打包工具
  const M = (C.Plugins && C.Plugins.AdMob) || (C.registerPlugin && C.registerPlugin('AdMob'));
  return M || null;
})();
const NA = { ok: false, loaded: false, loading: false, busy: false, retry: 0 };

// 預先載入下一支廣告（廣告要先載好，按鈕才會出現；播完後馬上再載下一支）
function adPrepare() {
  if (!NATIVE_AD || !NA.ok || NA.loaded || NA.loading) return;
  NA.loading = true;
  NATIVE_AD.prepareRewardVideoAd({ adId: ADS_CFG.rewardedId, isTesting: ADS_CFG.testing })
    .then(() => { NA.loading = false; NA.loaded = true; NA.retry = 0; })
    .catch(() => {   // 載入失敗（沒網路、暫時沒有廣告）：等一下再試，間隔越來越長，最多 2 分鐘
      NA.loading = false; NA.loaded = false;
      NA.retry = Math.min(120, (NA.retry || 5) * 2);
      setTimeout(adPrepare, NA.retry * 1000);
    });
}

// App 啟動：初始化 SDK → 歐洲等地區的同意視窗（UMP）→ iOS「是否允許追蹤」（ATT）→ 開始預載廣告
async function adInit() {
  if (!NATIVE_AD) return;
  try {
    await NATIVE_AD.initialize({ initializeForTesting: ADS_CFG.testing, tagForChildDirectedTreatment: ADS_CFG.childDirected });
    try {   // UMP：法規要求的地區（歐洲、英國等）才會跳出，其他地區直接略過
      const ci = await NATIVE_AD.requestConsentInfo();
      if (ci && ci.isConsentFormAvailable && ci.status === 'REQUIRED') await NATIVE_AD.showConsentForm();
    } catch (e) { }
    try {   // ATT：只問一次；玩家拒絕也照樣能看廣告（只是改成非個人化廣告）
      const tr = await NATIVE_AD.trackingAuthorizationStatus();
      if (tr && tr.status === 'notDetermined') await NATIVE_AD.requestTrackingAuthorization();
    } catch (e) { }
    // 播放事件：拿到獎勵／關掉廣告／播放失敗
    NATIVE_AD.addListener('onRewardedVideoAdReward', () => { NA.rewarded = true; });
    // 關掉廣告後稍等一下再結算，以免「拿到獎勵」的通知比「關掉」晚到而漏給獎勵
    NATIVE_AD.addListener('onRewardedVideoAdDismissed', () => setTimeout(adFinish, 300));
    NATIVE_AD.addListener('onRewardedVideoAdFailedToShow', () => adFinish());
    NA.ok = true; adPrepare();
  } catch (e) { NA.ok = false; }
}
// 廣告畫面結束：回報有沒有看完，恢復遊戲音效，並預載下一支
function adFinish() {
  if (!NA.busy) return;
  const ok = !!NA.rewarded, res = NA.res;
  NA.busy = false; NA.rewarded = false; NA.res = null; NA.loaded = false;
  if (typeof A === 'function') A();   // 播廣告時把遊戲音效暫停了，這裡喚醒
  adPrepare();
  if (res) res(ok);
}
adInit();

const ADS = {
  fakeT: 3,   // 假廣告長度（秒）
  native: !!NATIVE_AD,
  // 現在能不能播廣告（App：廣告已載好；網頁：web 設定為 'fake' 且有網路）。false 時按鈕就隱藏
  ready() {
    if (NATIVE_AD) return NA.ok && NA.loaded && !NA.busy;
    return ADS_CFG.web === 'fake' && navigator.onLine !== false;
  },
  // 播放廣告：看完回傳 true（給獎勵），中途關掉或失敗回傳 false
  show(kind) {
    if (NATIVE_AD) return new Promise(res => {
      if (!ADS.ready()) { res(false); return; }
      NA.busy = true; NA.rewarded = false; NA.res = res;
      try { if (ac && ac.suspend) ac.suspend(); } catch (e) { }   // 廣告自己有聲音，遊戲音效先停
      NATIVE_AD.showRewardVideoAd()
        .then(item => { if (item) NA.rewarded = true; })
        .catch(() => adFinish());   // 播放失敗：直接當作沒看完
    });
    return new Promise(res => {
      const el = $('adFake'); if (!el) { res(false); return; }
      let left = ADS.fakeT, done = false;
      const fin = ok => { if (done) return; done = true; clearInterval(iv); el.classList.remove('on'); res(ok); };
      const draw = () => { $('adFakeT').textContent = left > 0 ? t('ad_wait', left) : t('ad_done'); $('adFakeOk').disabled = left > 0; };
      $('adFakeOk').onclick = () => { if (left <= 0) fin(true); };
      $('adFakeX').onclick = () => fin(false);
      const iv = setInterval(() => { left--; draw(); }, 1000);
      draw(); el.classList.add('on');
    });
  },
};

// ===== 倒下時：看廣告復活（每局一次） =====
let contT = 0, contIv = null;
function offerContinue() {
  state = 'cont'; g.adRevUsed = true; contT = 5;
  const draw = () => { $('contTime').textContent = contT; };
  draw(); show('cont', true); SFX.die(); vib([80, 60, 120]);
  clearInterval(contIv);
  contIv = setInterval(() => { if (paused) return; contT--; draw(); if (contT <= 0) contResult(false); }, 1000);
}
// ok＝看完廣告：復活；否則照原本的流程倒下結算
function contResult(ok) {
  clearInterval(contIv); contIv = null; hide('cont');
  if (!g || state !== 'cont') return;
  if (ok) { state = g.contPrev === 'qte' ? 'qte' : 'play'; reviveNow(t('ad_revive')); lastT = performance.now(); }
  else { state = 'dying'; g.dieT = 1.1; g.p.vy = -500; }
}
function contWatch() {
  clearInterval(contIv);   // 看廣告的時候倒數先停
  ADS.show('revive').then(ok => { if (!ok) toast(t('ad_skip')); contResult(ok); });
}

// ===== 結算：看廣告，小判 ×2（每局一次） =====
function adCoinsBtn(coins) {
  const b = $('adCoins'); if (!b) return;
  const can = coins > 0 && !g.tut && ADS.ready();
  b.style.display = can ? '' : 'none'; b.disabled = false; b.dataset.n = coins;
  b.textContent = t('ad_coins', coins);
}
function adCoinsWatch() {
  const b = $('adCoins'), n = +b.dataset.n || 0; if (!n || b.disabled) return;
  b.disabled = true;
  ADS.show('coins').then(ok => {
    if (!ok) { b.disabled = false; toast(t('ad_skip')); return; }
    save.coins += n; save.stats.coins += n; persist(); SFX.coin();
    b.textContent = t('ad_coins_done', n);
    const tc = $('overCoins'); if (tc) tc.innerHTML = t('over_coins', n * 2, save.coins);
  });
}
