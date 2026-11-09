'use strict';
/* NINJA 鳶 TOBI — 獎勵型廣告（玩家自己選擇要不要看，看完才給獎勵）
   目前是「假廣告」：畫面倒數 3 秒就算看完，用來測試流程。
   上架 iOS 時改接 Google AdMob（Capacitor 的 AdMob 外掛）：只要把 ADS.ready()／ADS.show() 換成真的 SDK 呼叫，遊戲其他地方不用改。
   使用的地方：倒下時「看廣告復活」（每局一次）、結算時「看廣告，小判 ×2」（每局一次）。新手教學中不出現。 */
const ADS = {
  fakeT: 3,   // 假廣告長度（秒）
  // 現在能不能播廣告（離線、或真 SDK 還沒載入好廣告時回傳 false，按鈕就隱藏）
  ready() { return navigator.onLine !== false; },
  // 播放廣告：看完回傳 true（給獎勵），中途關掉或失敗回傳 false
  show(kind) {
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
