# iOS 上架清單（App Store）

上架通路：**只做 iOS**（2026-11-09 決定）。廣告用 **Google AdMob 獎勵型廣告**。

## ✅ 已經做好的
- [x] 遊戲內「看廣告復活」（倒下時，每局一次，倒數 5 秒）與結算「看廣告，小判 ×2」（每局一次）— `ads.js`
- [x] 目前是**假廣告**（倒數 3 秒），換真廣告時只要改 `ads.js` 的 `ADS.ready()`／`ADS.show()`
- [x] 新手教學中不出現廣告；離線時按鈕隱藏；中途關掉廣告不給獎勵
- [x] 隱私權政策與支援頁（繁中／日文／英文，版型同節奏大王燒）：原始檔在 `site/ninjatobi/`，用 `bash tools/deploy-site.sh "說明"` 發佈到官網，設定頁有連結
  - 隱私權政策網址：https://arcconceptgames.github.io/ninjatobi/privacy/ （日文、英文加 `?lang=ja`、`?lang=en`）
  - 支援網址：https://arcconceptgames.github.io/ninjatobi/support/
  - 官網首頁已加忍者鳶的作品卡片（在 yaki_mochi 專案的 site/index.html，用那邊的 deploy-site.sh 發佈）
  - 聯絡信箱：arcconceptgames@gmail.com
  - ⚠️ 支援頁寫了「設定 → 恢復購買」，接 App Store 內購時要記得做這顆按鈕
- [x] 完整版鎖（林關免費，風／山／火要購買；購買目前是測試按鈕）

## 🧑 需要你本人處理的（之後再做）
- [ ] **申請 Apple Developer Program**（每年 US$99）
- [ ] **申請 Google AdMob 帳號**、建立 iOS App 與「獎勵型廣告」廣告單元，取得 App ID 與廣告單元 ID
- [ ] 填寫收款資料（AdMob、App Store Connect 的稅務與銀行資料）
- [x] 聯絡信箱：沿用 arcconceptgames@gmail.com
- [ ] App Store Connect：
  - [ ] 建立 App、填寫名稱、副標題、描述、關鍵字、分類（遊戲 › 動作／街機）
  - [ ] 上傳截圖（6.7 吋與 6.5 吋 iPhone，必要時 iPad）與宣傳影片（可選）
  - [ ] 隱私權政策網址、支援網址
  - [ ] 「App 隱私權」問卷（見下方建議答案）
  - [ ] 分級問卷（見下方建議答案）
  - [ ] 建立內購項目「完整版」（非消耗型）並決定價格
- [ ] 送審

## 🤖 我之後可以做的（等你有帳號後）
- [ ] 用 Capacitor 把網頁包成 iOS App（Xcode 專案）
- [ ] 接上 AdMob SDK（取代假廣告）＋ Google 的同意視窗（UMP，歐洲玩家需要）
- [ ] iOS「是否允許追蹤」提示（ATT）
  - Info.plist `NSUserTrackingUsageDescription` 建議文字：
    「我們會用這個識別碼為您顯示更相關的廣告。不允許也能正常遊玩並觀看廣告。」
- [ ] 接上 App Store 內購（StoreKit）：完整版購買與「恢復購買」按鈕
- [ ] 把測試模式 `TEST_FREE` 改回 `false`、拿掉設定頁的測試按鈕
- [ ] App 圖示各尺寸、啟動畫面

## 建議答案：App 隱私權問卷（使用 AdMob 時）
- **用來追蹤您的資料**：識別碼（裝置 ID）— 第三方廣告
- **與您連結的資料**：無
- **未與您連結的資料**：
  - 識別碼（裝置 ID）— 第三方廣告、分析
  - 使用資料（產品互動、廣告資料）— 第三方廣告、分析
  - 診斷（當機資料、效能資料）— App 功能
  - 位置（大略位置，由 IP 推算）— 第三方廣告
- 本遊戲自己不收集任何資料；以上都是 AdMob SDK 會收集的項目，送審前再對照 Google 官方的最新說明確認一次。

## 建議答案：分級問卷
- 卡通或奇幻暴力：**不常／輕微**（斬妖怪、敵人化成煙消失，沒有血腥）
- 其他（性、毒品、賭博、恐怖等）：無
- 預計分級：**9+**
- 含廣告：是；內購：是
