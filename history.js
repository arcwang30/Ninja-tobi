'use strict';
/* NINJA 鳶 TOBI — 了解歷史（照 mouse-hit 專案的做法：三個分頁、可捲動；段落開頭 # 為標題、• 為項目）
   第 3 頁「關於Arc遊戲庫」的中／日／英文原樣沿用 mouse-hit 專案（data/pages.js、data/history-i18n.js） */
const HIST = {
  tabs: [['忍者與跳躍', '忍者とジャンプ', 'Ninjas & Jumping'], ['概念結構', 'ゲームの作り方', 'How It\'s Made'], ['關於Arc遊戲庫', 'Arcの概遊庫について', 'About Arc Games']],
  fanPage: 'https://www.facebook.com/profile.php?id=61594197187795',
  body: {
    zh: [
      // 0：遊戲類型的歷史
      '《忍者鳶 NINJA TOBI》把三種遊戲類型揉在一起：「忍者動作遊戲」、一路「往上跳」的跳躍遊戲，以及每次都不一樣的「Roguelike」。它們各自走過了數十年的演進。\n' +
      '# 第一階段：忍者登上電玩（1980s）\n' +
      '忍者會跳、會丟手裡劍、會施展忍術，天生就適合做成動作遊戲。\n' +
      '• 1984 年《忍者くん 魔城の冒険》：UPL 推出的街機，Q 版小忍者在城牆間跳上跳下打倒敵人，可愛的忍者主角從這裡開始。\n' +
      '• 1987 年《Shinobi 忍》：SEGA 的街機名作，丟手裡劍、施展忍術清場，奠定了「帥氣忍者」的形象。\n' +
      '• 1988 年《忍者龍劍傳》：Tecmo 推出，紅白機版用電影般的過場來說故事，讓玩家看得熱血沸騰。本作開場「月下的狼煙」就是向它致敬。\n' +
      '# 第二階段：一路往上爬（1980s – 2010s）\n' +
      '「越爬越高」是最直覺的目標，也最容易讓人一玩再玩。\n' +
      '• 1981 年《大金剛》：任天堂的街機，主角一路往上爬到頂端救人，「往上爬」的玩法從這裡開始流行。\n' +
      '• 1985 年《溜冰攀登者》（Ice Climber）：任天堂推出，敲破頭上的冰塊一層層往上跳到山頂。\n' +
      '• 2001 年《Icy Tower》：電腦上的高塔跳躍遊戲，連跳越快、轉得越帥，分數就越高。\n' +
      '• 2009 年《Doodle Jump》：手機上的「自動彈跳、只管左右移動」，讓往上跳的遊戲在觸控時代爆紅。本作自動彈跳的操作，就是同一種樂趣。\n' +
      '# 第三階段：Roguelike 的復興（1980 – 至今）\n' +
      'Roguelike 的核心是「每次遊玩都不一樣」，讓人一玩再玩。\n' +
      '• 1980 年《Rogue》：隨機生成的地城、死亡就重來，這個類型的名字就是來自它。\n' +
      '• 2011 年《以撒的結合》：把 Roguelike 帶進動作遊戲，每次拿到的道具組合都不同。\n' +
      '• 2017 年《殺戮尖塔》：一路往塔頂爬、每一層都要做選擇，讓「爬塔」成為 Roguelike 的經典結構。\n' +
      '• 2022 年《吸血鬼倖存者》：技能會自動攻擊、升級時三選一，讓 Roguelike 變得人人都能上手。\n' +
      '《忍者鳶》的自動技能、升級三選一、四幕高塔與無盡之塔，正是向這些作品致敬的設計。',

      // 1：這款遊戲是怎麼做出來的
      '製作一款「忍者 × 往上跳 × Roguelike」的遊戲，可以分成以下幾個步驟。\n' +
      '# 1. 決定核心玩法\n' +
      '先想好玩家「一直在做什麼」。這款遊戲的答案是：忍者會自動彈跳，玩家只要左右移動，碰到敵人就自動斬殺。一隻手指就能玩。\n' +
      '# 2. 產生一路往上的關卡\n' +
      '畫面往上捲動時，一列一列隨機產生雲朵地板、只能踩一次的半毀地板、跳台和釘刺。越往上，地板越少、機關越多。\n' +
      '# 3. 設計斬擊\n' +
      '碰到敵人自動斬殺並再彈跳一次；按住瞄準的「彈射斬」、往下劈的「急降斬」，讓同一根手指有不同的判斷。不落地連續斬殺就能累積連斬、進入狂熱。\n' +
      '# 4. 加上追兵\n' +
      '只要往上跳太慢，下方的火海、大浪或鬼群就會追上來。這讓玩家一直有「要往上」的壓力。\n' +
      '# 5. 設計敵人\n' +
      '每種敵人都要「玩起來不一樣」：會丟手裡劍的、會射箭的、從下方撞到盾就會被打落的、斬殺後會爆炸的……\n' +
      '# 6. 魔王與 QTE\n' +
      '每一幕中段有大天狗、最後有魔王。碰到魔王就進入 QTE，用連打或快速滑動決勝負，加上斬擊特寫讓每一擊都有份量。\n' +
      '# 7. 加入 Roguelike 元素\n' +
      '收集魂升級、三選一技能與強化；技能練滿再配上對應的被動就能進化，每一局的組合都不同。\n' +
      '# 8. 美術與演出\n' +
      '主角、敵人、魔王與背景全部用程式繪圖，再加上開場過場、每一幕的開場演出與換幕轉場。\n' +
      '# 9. 音樂與音效\n' +
      '彈跳、斬擊、爆炸等音效與背景音樂，都用瀏覽器的音訊功能即時合成。\n' +
      '# 10. 測試遊戲\n' +
      '在手機與平板上反覆試玩，調整彈跳高度、追兵速度與敵人數量，讓新手能爬過第一幕、高手也有挑戰。\n' +
      '# 簡單來說\n' +
      '核心玩法 → 關卡產生 → 斬擊 → 追兵 → 敵人 → 魔王與 QTE → Roguelike → 美術演出 → 音效 → 測試\n' +
      '一步一步，就能做出一款屬於自己的忍者跳躍遊戲。',

      // 2：關於 Arc 遊戲庫（作者原文，原樣沿用自 mouse-hit 專案 data/pages.js）
    '「ARCの概遊庫」這個名字，發想起源於諧音「蓋油庫」(即:概念遊戲保藏庫)。期望自己，以及所有開發者所開發的作品，都能夠像「蓋油庫」一樣，賺大錢！\n' +
    '同時也可以很自豪、很酷地說出自己開發遊戲的喜悅，以及一路走來的心路歷程。除了可以從遊戲中遊玩雛型範本之外，同時可透過內建的歷史功能，了解各系列類型遊戲的組成與開發構成等相關知識，進而對遊戲開發產生興趣。\n' +
    '目前年過50的作者，回頭一看，進入遊戲業界也將近25年了。這一路走來，雖然參與、開發過不少遊戲，卻始終沒有真正做出一款讓自己「超級成名」的TITLE。\n' +
    '近年來AI開發盛行，遊戲產業也正面臨前所未有的變化。「選擇走遊戲這條路，究竟是正確的嗎？」這個問題開始不斷浮現在我的腦海裡。\n' +
    '因此我不得不重新思考——人生走到這個階段，我存在的意義究竟是什麼？而其中，我最常問自己的一個問題就是：「我能為這個產業留下什麼？」\n' +
    '常常在想，是否能夠運用自己這25年來所學到的東西，讓那些對遊戲開發有興趣的新生代，重新產生一點「想做遊戲」的衝動？但要怎麼做？\n' +
    '「不然，就來做一本可以玩的遊戲書吧！」從小，我就是個很不愛看「有字的書」的人。（漫畫除外！）與其坐在那裡讀一大堆文字，不如先親身體驗看看。覺得有興趣，再回頭鑽研。就這樣——「ARCの概遊庫」誕生了！\n' +
    '就像我常常形容的：大多數的遊戲開發者，幾乎很難能成為第二個宮本茂，也未必能像神話般屢屢敗部復活的小島秀夫桑一樣，成為世人熟知的大師。難道就因此喪志、放棄嗎？我想不必。\n' +
    '因為每一個開發者，都曾經擁有那顆熱愛遊戲的赤子之心。曾經捧著遊戲雜誌，期待下一款新作的到來；曾經跑進電玩店，投下硬幣，和朋友一起打《快打旋風》，為了輸贏大呼小叫；曾經為了一款遊戲可以興奮上一整天。\n' +
    '那些年華與時光，也許就像短暫的流星般一閃而過。但直到現在，我還是相信——玩遊戲，是因為好玩；而做遊戲，不也就是因為好玩嗎？\n' +
    '即使我們未必能成為那個站在聚光燈下的人，至少，也可以留下自己曾經努力做過、曾經熱愛過的作品。這，就是我想做「ARCの概遊庫」的理由。\n' +
    '「ARCの概遊庫」，一款可以玩的遊戲書、一段屬於遊戲開發者的故事。也是一群喜歡遊戲的人所留下的足跡。希望各位喜歡。感謝！！',
    ],
    ja: [
      '『忍者鳶 NINJA TOBI』は、3 つのジャンルを組み合わせたゲームです。「忍者アクション」、ひたすら「上へ跳ぶ」ジャンプゲーム、そして毎回ちがう「ローグライク」。それぞれが数十年かけて進化してきました。\n' +
      '# 第1段階：忍者、ゲームに登場(1980年代)\n' +
      '跳んで、手裏剣を投げて、忍術を使う。忍者はもともとアクションゲームにぴったりの存在です。\n' +
      '• 1984年『忍者くん 魔城の冒険』：UPL のアーケード作品。小さな忍者が城壁を跳び回って敵を倒す、かわいい忍者主人公の元祖です。\n' +
      '• 1987年『Shinobi 忍』：SEGA のアーケードの名作。手裏剣と忍術で敵を一掃する「かっこいい忍者」のイメージを決定づけました。\n' +
      '• 1988年『忍者龍剣伝』：テクモの作品。ファミコン版は映画のようなカットシーンで物語を描き、プレイヤーを熱くさせました。本作のオープニング「月下の狼煙」はそのオマージュです。\n' +
      '# 第2段階：ひたすら上へ(1980年代 – 2010年代)\n' +
      '「どんどん高く登る」は一番わかりやすい目標で、何度も遊びたくなります。\n' +
      '• 1981年『ドンキーコング』：任天堂のアーケード作品。主人公が頂上まで登って助けに行く「上へ登る」遊びの始まりです。\n' +
      '• 1985年『アイスクライマー』：任天堂の作品。頭上の氷を割りながら一段ずつ山頂を目指します。\n' +
      '• 2001年『Icy Tower』：PC の塔ジャンプゲーム。速く、かっこよく跳ぶほどスコアが伸びます。\n' +
      '• 2009年『Doodle Jump』：スマホで「自動でジャンプ、左右に動くだけ」。タッチ時代に上へ跳ぶゲームを大ヒットさせました。本作の自動ジャンプも同じ楽しさです。\n' +
      '# 第3段階：ローグライクの復興(1980年 – 現在)\n' +
      'ローグライクの核は「毎回ちがう」こと。何度でも遊びたくなります。\n' +
      '• 1980年『Rogue』：ランダム生成のダンジョンと、やられたら最初から。このジャンル名の由来です。\n' +
      '• 2011年『The Binding of Isaac』：ローグライクをアクションに持ち込み、毎回アイテムの組み合わせが変わります。\n' +
      '• 2017年『Slay the Spire』：塔の頂上を目指し、階ごとに選択する「塔登り」をローグライクの定番にしました。\n' +
      '• 2022年『Vampire Survivors』：技が自動で攻撃し、レベルアップで3択。誰でも遊べるローグライクを広めました。\n' +
      '『忍者鳶』の自動スキル、レベルアップの3択、4幕の塔と無限の塔は、これらの作品へのオマージュです。',

      '「忍者 × 上へ跳ぶ × ローグライク」のゲームは、次のような手順で作れます。\n' +
      '# 1. コアの遊びを決める\n' +
      'プレイヤーが「ずっと何をしているか」を決めます。このゲームの答えは、忍者が自動で跳ね、プレイヤーは左右に動くだけ。敵に触れれば自動で斬ります。指一本で遊べます。\n' +
      '# 2. 上へ続くステージを作る\n' +
      '画面が上へスクロールするたびに、雲の足場、一度しか乗れない壊れる床、ジャンプ台、まきびしを一列ずつランダムに作ります。上へ行くほど足場が減り、しかけが増えます。\n' +
      '# 3. 斬撃を作る\n' +
      '敵に触れると自動で斬ってもう一度跳ねる。押して狙う「弾き斬り」、下へ斬り下ろす「急降斬」で、同じ指の操作に判断が生まれます。着地せずに斬り続ければ連斬とフィーバー。\n' +
      '# 4. 追っ手を加える\n' +
      '登るのが遅いと、下から炎・大波・鬼の群れが迫ってきます。「上へ行かなきゃ」という緊張感が生まれます。\n' +
      '# 5. 敵を作る\n' +
      'どの敵も「遊んだ感触がちがう」ように。手裏剣を投げる敵、矢を射る敵、下からぶつかると落とされる盾の敵、斬ると爆発する敵……\n' +
      '# 6. 魔王とQTE\n' +
      '各幕の中盤に大天狗、最後に魔王。魔王に触れるとQTEになり、連打かスワイプで勝負。斬撃のクローズアップで一撃一撃に重みを持たせます。\n' +
      '# 7. ローグライク要素を入れる\n' +
      '魂を集めてレベルアップ、技と強化を3択。技を最大にして対応する強化を持てば進化。毎回組み合わせが変わります。\n' +
      '# 8. アートと演出\n' +
      '主人公・敵・魔王・背景はすべてプログラムで描画。オープニング、各幕の導入、幕の切り替えの演出も加えます。\n' +
      '# 9. 音楽と効果音\n' +
      'ジャンプ・斬撃・爆発などの効果音とBGMは、ブラウザの音声機能でその場で合成しています。\n' +
      '# 10. テスト\n' +
      'スマホやタブレットで何度も遊び、ジャンプの高さ、追っ手の速さ、敵の数を調整。初心者は第一幕を越えられ、上級者にも歯ごたえがあるように。\n' +
      '# つまり\n' +
      'コアの遊び → ステージ生成 → 斬撃 → 追っ手 → 敵 → 魔王とQTE → ローグライク → アート演出 → 効果音 → テスト\n' +
      '一歩ずつ進めれば、自分だけの忍者ジャンプゲームが作れます。',

      // 關於Arc遊戲庫（mouse-hit 專案 data/history-i18n.js 的日文譯文，原樣沿用）
        '「ARCの概遊庫（がいゆうこ）」という名前は、台湾華語の「蓋油庫（ガイヨウクー：油槽所を建てる）」という言葉の語呂合わせから生まれました（その真の意味は「概念ゲームの保藏庫」です）。自分自身、そしてすべての開発者が生み出す作品が、この「蓋油庫」の言葉通り、大儲けできる（油田を掘り当てる）ような存在になってほしいという願いが込められています。\n' +
        '同時に、自分がゲームを開発する喜びや、これまでの道のりを、誇らしく、そしてクールに語れる場所でもあります。ここではゲームのプロトタイプを実際に遊べるだけでなく、内蔵された「歴史機能」を通じて、様々なジャンルのゲームがどのように構成され、開発されてきたかという知識を学ぶことができます。そこから、ゲーム開発に興味を持つきっかけになれば幸いです。\n' +
        '現在、50歳を超えた私がふと振り返ると、ゲーム業界に入ってからもうすぐ25年になります。これまでの道のりで、数多くのゲームに関わり、開発してきましたが、自分を「超有名」にするような代表作（タイトル）には、ついに巡り合えませんでした。\n' +
        '近年、AI開発が盛んになり、ゲーム産業はかつてない変革期を迎えています。「ゲームの道を選んだことは、果たして正しかったのだろうか？」そんな問いが、最近頭をよぎるようになりました。\n' +
        '人生のこのステージに至り、「自分が存在する意味とは一体何だろう？」と、改めて考えざるを得なくなったのです。その中で、私が最も自分に問いかけたのは、「自分はこの産業に何を残せるだろうか？」ということでした。\n' +
        '自分がこの25年間で学んできたことを活かし、ゲーム開発に興味を持つ次世代の若者たちに、もう一度「ゲームを作りたい！」という衝動を呼び起こすことはできないだろうか？ ――そう常々考えていました。しかし、一体どうすればいいのか？\n' +
        '「それなら、“遊べるゲームの参考書”を作ってみよう！」幼い頃から、私は「文字ばかりの本」を読むのが大の苦手でした（漫画は別ですが！）。机に向かって膨大な文字を読むくらいなら、まずは体感してみる。面白いと思ったら、そこから深く掘り下げればいい。そうして生まれたのが、この「ARCの概遊庫」です。\n' +
        '私がよく口にする言葉があります。ほとんどのゲーム開発者は、第二の宮本茂氏になることは難しいですし、神話のように何度も窮地から復活を遂げた小島秀夫氏のように、世界に名を馳せる巨匠になれるわけでもありません。だからといって、志を失い、諦めるべきでしょうか？ 私はそうは思いません。\n' +
        'なぜなら、すべての開発者が、かつてゲームを純粋に愛する少年のような心を持っていたからです。ゲーム雑誌を握りしめ、新作の発売を心待ちにしていた日々。ゲームセンターに駆け込み、コインを投入し、友達と『ストリートファイター』で勝った負けたと大騒ぎしたこと。たった一本のゲームのために、丸一日中興奮していられたあの頃。\n' +
        'あの輝かしい青春や時間は、一瞬で駆け抜ける流れ星のようだったかもしれません。それでも私は今でも信じています。「ゲームを遊ぶのは楽しいからであり、ゲームを作るのもまた、楽しいからではないか」と。\n' +
        'たとえ私たちがスポットライトを浴びる存在になれなかったとしても、少なくとも、自分がかつて必死に作り、心から愛した作品をここに残すことはできる。それこそが、私が「ARCの概遊庫」を作ろうと思った理由です。\n' +
        '「ARCの概遊庫」――それは遊べるゲームの参考書であり、ゲーム開発者の物語。そして、ゲームを愛する者たちが残した足跡（そくせき）でもあります。皆さんに楽しんでいただけることを願っています。ありがとうございました！！',
    ],
    en: [
      'NINJA TOBI blends three game genres: ninja action, "keep climbing" jump games, and Roguelikes that are different every time. Each of them evolved over decades.\n' +
      '# Stage 1: Ninjas Enter Video Games (1980s)\n' +
      'They jump, throw shuriken and cast ninjutsu — ninjas were made for action games.\n' +
      '• 1984 — Ninja-kun: Majou no Bouken: an arcade game by UPL where a tiny ninja hops along castle walls defeating foes. The origin of the cute ninja hero.\n' +
      '• 1987 — Shinobi: SEGA\'s arcade classic. Shuriken and ninjutsu clearing the screen defined the image of the "cool ninja".\n' +
      '• 1988 — Ninja Gaiden: by Tecmo. The NES version told its story with movie-like cutscenes that got players fired up. NINJA TOBI\'s opening, "Smoke Under the Moon", is a tribute to it.\n' +
      '# Stage 2: Always Climbing (1980s – 2010s)\n' +
      '"Get higher and higher" is the most intuitive goal, and it keeps you coming back.\n' +
      '• 1981 — Donkey Kong: Nintendo\'s arcade game, where the hero climbs to the top to save the day. The "climb up" style started here.\n' +
      '• 1985 — Ice Climber: by Nintendo. Break the ice above your head and jump floor by floor to the summit.\n' +
      '• 2001 — Icy Tower: a PC tower-jumping game. The faster and flashier your jumps, the higher your score.\n' +
      '• 2009 — Doodle Jump: "bounce automatically, just move left and right" made jump-up games a hit in the touch era. NINJA TOBI\'s auto-bounce is the same kind of fun.\n' +
      '# Stage 3: The Roguelike Revival (1980 – today)\n' +
      'The heart of a Roguelike is that every run is different, so you play again and again.\n' +
      '• 1980 — Rogue: random dungeons and starting over when you die. The genre is named after it.\n' +
      '• 2011 — The Binding of Isaac: brought Roguelikes into action games, with a new item combo every run.\n' +
      '• 2017 — Slay the Spire: climbing a tower and choosing on every floor became a classic Roguelike structure.\n' +
      '• 2022 — Vampire Survivors: skills attack on their own and level-ups offer three choices, making Roguelikes easy for everyone.\n' +
      'NINJA TOBI\'s auto skills, pick-one-of-three level-ups, four-act tower and Endless Tower are a tribute to these games.',

      'A "ninja × climbing × Roguelike" game can be made in these steps.\n' +
      '# 1. Decide the Core Play\n' +
      'First decide what the player does all the time. Here, the ninja bounces automatically; you only move left and right, and touching an enemy cuts it down. One finger is enough.\n' +
      '# 2. Build an Endless Climb\n' +
      'As the screen scrolls up, rows of cloud platforms, crumbling floors, springs and spikes are generated at random. The higher you go, the fewer platforms and the more traps.\n' +
      '# 3. Design the Slashes\n' +
      'Touch an enemy to cut it and bounce again. The aimed Sling Slash and the downward Dive Slash add decisions to the same finger. Keep cutting without landing to build a combo and Fever.\n' +
      '# 4. Add a Chaser\n' +
      'Climb too slowly and fire, waves or oni rise from below. It keeps the pressure on to go up.\n' +
      '# 5. Design the Enemies\n' +
      'Every enemy should play differently: shuriken throwers, archers, shield ninjas that knock you down from below, bombers that explode when cut...\n' +
      '# 6. Bosses and QTEs\n' +
      'A Great Tengu appears mid-act and a boss at the end. Touch the boss to start a QTE — mash or swipe — with slash close-ups that give every hit weight.\n' +
      '# 7. Add Roguelike Elements\n' +
      'Collect souls to level up and pick one of three skills or perks. Max a skill with its paired perk to evolve it. Every run is a new combination.\n' +
      '# 8. Art and Staging\n' +
      'The hero, enemies, bosses and backgrounds are all drawn in code, plus the opening, each act\'s intro and the act transitions.\n' +
      '# 9. Music and Sound\n' +
      'Jumps, slashes, explosions and the music are all synthesized live with the browser\'s audio features.\n' +
      '# 10. Playtesting\n' +
      'Play again and again on phones and tablets, tuning jump height, chaser speed and enemy counts so beginners can clear Act I and experts still find a challenge.\n' +
      '# In Short\n' +
      'Core play → Level generation → Slashes → Chaser → Enemies → Bosses & QTE → Roguelike → Art & staging → Sound → Testing\n' +
      'Step by step, you can make a ninja jumping game of your own.',

      // About Arc Games（mouse-hit 專案 data/history-i18n.js 的英文譯文，原樣沿用）
        'The name "ARC\'s Concept Play-Chamber" (ARCの概遊庫) was inspired by a Chinese wordplay on "building an oil depot" (Gai You Ku), which in this context stands for a "Concept Game Repository." My hope is that my own work, alongside the creations of all fellow developers, can be just like that "oil depot"—bringing in massive wealth and striking it rich!\n' +
        'At the same time, it is a place where we can proudly and coolly share the sheer joy of game development, as well as the emotional journey we\'ve walked along the way. Beyond just playing prototype templates within the game, users can utilize the built-in history feature to understand the structural composition and development of various game genres. Through this hands-on knowledge, I hope to spark a genuine interest in game development for the next generation.\n' +
        'Now past the age of 50, I look back and realize I\'ve been in the game industry for nearly 25 years. Walking this path, though I\'ve participated in and developed quite a few games, I\'ve never truly made that one "megahit" title to skyrocket my name into stardom.\n' +
        'With the recent boom in AI development, the game industry is facing unprecedented shifts. Questions have begun to constantly haunt my mind: "Was choosing the path of game development really the right choice?"\n' +
        'Consequently, I found myself forced to rethink—at this stage of my life, what is the ultimate meaning of my existence? Among all my thoughts, the question I ask myself most frequently is: "What can I leave behind for this industry?"\n' +
        'I often wonder if I can take what I\'ve learned over these past 25 years and reignite that spark, that raw impulse of "I want to make games!" within the new generation who are interested in development. But how?\n' +
        '"Well, why not make a playable game-book?" Since childhood, I\'ve always been someone who hated reading "books with too many words" (except for manga, of course!). Instead of sitting there reading walls of text, I\'d rather experience it firsthand. If it sparks an interest, I can always go back and dive deeper later. And just like that—"ARC\'s Concept Play-Chamber" was born!\n' +
        'As I often say: most game developers will likely never become the next Shigeru Miyamoto. Nor will we necessarily become world-renowned masters like Hideo Kojima, who mythically rises from the ashes time and time again. Should we lose heart and give up because of that? I think not.\n' +
        'Because every single developer once possessed that innocent, childlike heart that deeply loved games. We once clutched gaming magazines, eagerly awaiting the arrival of the next new title. We once ran into arcades, dropped coins into the slots, and shouted at the top of our lungs with friends over a match of Street Fighter, living and dying by the win or loss. We once stayed excited for an entire day over just one game.\n' +
        'Those years and moments might have flashed by like a fleeting shooting star. But even now, I still believe—we play games because they are fun, and don\'t we make games for the exact same reason?\n' +
        'Even if we might never be the ones standing under the spotlight, at the very least, we can leave behind the works we once poured our hearts into, the works we once truly loved. This is precisely why I wanted to create "ARC\'s Concept Play-Chamber."\n' +
        '"ARC\'s Concept Play-Chamber"—a playable game-book, a story belonging to game developers, and the footprints left behind by a group of people who simply love games. I hope you all enjoy it. Thank you so much!',
    ],
  },
};
let histTab = 0;
function openHist() { histTab = 0; renderHist(); openSub('hist'); }
function renderHist() {
  $('histTabs').innerHTML = HIST.tabs.map((n, k) => `<button class="hs-tab${k === histTab ? ' on' : ''}" data-act="hist-tab" data-arg="${k}">${L(n)}</button>`).join('');
  const body = HIST.body[['zh', 'ja', 'en'][LI]] || HIST.body.zh;
  const html = body[histTab].split('\n').map(p => p.startsWith('# ') ? `<h3>${p.slice(2)}</h3>` : p.startsWith('• ') ? `<p class="li">${p.slice(2)}</p>` : `<p>${p}</p>`).join('');
  const arc = histTab === 2, el = $('histBody');
  el.innerHTML = (arc ? '<img class="arc-logo" src="assets/team_logo.webp" alt="ARCの概遊庫">' : '') + html;
  el.scrollTop = 0;
  const fb = $('histFb'); fb.href = HIST.fanPage; fb.style.display = arc ? '' : 'none';
}
