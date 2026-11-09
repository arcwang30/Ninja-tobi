'use strict';
/* 遊戲音樂 — 模擬 NES + MMC5 擴充音源（4 方波＋三角波＋雜訊），WebAudio 即時合成
   曲目：title「鳶ノ影」（標題）、stage「疾風ノ道」（林）、wind「天翔」（風）、fire「紅蓮」（火）、mountain「雪嶺」（山）、boss「鬼哭」（魔王戰）
   BGM.play(ac, 曲名, { tr: 移調半音, sp: 速度倍率 }) 開始或切換；BGM.stop() 停止；BGM.hot = true 時加強節奏（狂熱） */
const BGM = (() => {
  const MASTER = .5;   // 總音量（峰值約 0.9，不會破音）
  let ac = null, out = null, timer = null, nextT = 0, step = 0, waves = null, noiseBuf = null;
  let song = null, key = '', tr = 1, STEP = .1, vol = 1;   // vol：設定頁的音樂音量（0～1.2）

  // ---- 音名 → 頻率 ----
  const SEMI = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };
  const hz = n => { const m = /^([A-G]#?)(\d)$/.exec(n); return 440 * Math.pow(2, (SEMI[m[1]] + (+m[2] + 1) * 12 - 69) / 12); };

  // 和弦（分解和弦、和聲用）與低音根音
  const CH = {
    Em: ['E4', 'G4', 'B4'], F: ['F4', 'A4', 'C5'], Am: ['A3', 'C4', 'E4'], C: ['C4', 'E4', 'G4'],
    D: ['D4', 'F#4', 'A4'], B5: ['B3', 'F#4', 'B4'],
    G: ['G3', 'B3', 'D4'], A: ['A3', 'C#4', 'E4'], Bm: ['B3', 'D4', 'F#4'], E: ['E4', 'G#4', 'B4'],
    Bb: ['A#3', 'D4', 'F4'], Dm: ['D4', 'F4', 'A4'], Gm: ['G3', 'A#3', 'D4'], Cm: ['C4', 'D#4', 'G4'], Eb: ['D#4', 'G4', 'A#4'],
  };
  const BASS = { Em: 'E2', F: 'F2', Am: 'A2', C: 'C2', D: 'D2', B5: 'B1', G: 'G2', A: 'A2', Bm: 'B1', E: 'E2', Bb: 'A#1', Dm: 'D2', Gm: 'G2', Cm: 'C2', Eb: 'D#2' };

  // ===== 曲譜：主旋律為 [音名, 長度（十六分音符數）]，'.' 為休止；每小節 16 步 =====
  // 標題「鳶ノ影」：都節音階（E F A B C）＋小調和弦
  const TITLE_A = [
    ['E5', 4], ['B4', 2], ['E5', 2], ['F5', 2], ['E5', 2], ['B4', 4],
    ['C5', 4], ['A4', 2], ['C5', 2], ['F5', 4], ['E5', 2], ['C5', 2],
    ['B4', 2], ['E5', 2], ['G5', 4], ['F5', 2], ['E5', 2], ['B4', 4],
    ['A4', 2], ['C5', 2], ['F5', 4], ['E5', 4], ['.', 4],
    ['A5', 4], ['G5', 2], ['E5', 2], ['A5', 2], ['B5', 2], ['C6', 4],
    ['B5', 2], ['A5', 2], ['G5', 4], ['E5', 4], ['G5', 4],
    ['F5', 2], ['E5', 2], ['C5', 2], ['A4', 2], ['C5', 4], ['F5', 4],
    ['E5', 2], ['F5', 2], ['F#5', 4], ['B5', 8],
  ];
  const TITLE_B = [
    ['E6', 8], ['C6', 4], ['B5', 4],
    ['A5', 8], ['.', 4], ['E5', 4],
    ['F5', 4], ['A5', 4], ['C6', 4], ['B5', 2], ['A5', 2],
    ['A5', 12], ['.', 4],
    ['G5', 4], ['E5', 4], ['G5', 4], ['C6', 4],
    ['A5', 4], ['F#5', 4], ['D5', 4], ['F#5', 4],
    ['E5', 2], ['G5', 2], ['B5', 2], ['E6', 2], ['D6', 2], ['B5', 2], ['G5', 2], ['B5', 2],
    ['B5', 4], ['F#5', 4], ['B5', 8],
  ];
  // 關卡「疾風ノ道」：前段緊湊的切分旋律（E 小調＋F 的和風色彩），後段拉長音、加和聲長音
  const STAGE_A = [
    ['E5', 2], ['B4', 1], ['E5', 1], ['G5', 2], ['F#5', 2], ['E5', 2], ['D5', 2], ['E5', 4],
    ['B5', 3], ['A5', 1], ['G5', 2], ['E5', 2], ['F5', 4], ['E5', 4],
    ['C6', 2], ['B5', 2], ['G5', 2], ['E5', 2], ['G5', 2], ['A5', 2], ['B5', 4],
    ['A5', 2], ['F#5', 2], ['D5', 2], ['F#5', 2], ['A5', 4], ['.', 4],
    ['E6', 2], ['D6', 2], ['B5', 2], ['G5', 2], ['E5', 2], ['G5', 2], ['B5', 4],
    ['A5', 2], ['G5', 2], ['F5', 2], ['E5', 2], ['F5', 2], ['G5', 2], ['A5', 4],
    ['C6', 4], ['A5', 2], ['F5', 2], ['A5', 4], ['C6', 4],
    ['B5', 2], ['A5', 2], ['F#5', 2], ['D#5', 2], ['B4', 8],
  ];
  const STAGE_B = [
    ['E6', 6], ['D6', 2], ['C6', 4], ['B5', 4],
    ['A5', 8], ['E5', 4], ['A5', 4],
    ['F5', 4], ['A5', 4], ['C6', 6], ['B5', 2],
    ['A5', 12], ['.', 4],
    ['G5', 4], ['C6', 4], ['E6', 4], ['D6', 4],
    ['C6', 8], ['B5', 4], ['G5', 4],
    ['F#5', 4], ['B5', 4], ['D#6', 4], ['F#6', 4],
    ['B5', 2], ['.', 2], ['B5', 2], ['.', 2], ['B5', 8],
  ];
  // 魔王「鬼哭」：E 與 F 半音反覆的壓迫感、斷奏的刺擊、半音階下降
  const BOSS_A = [
    ['E5', 1], ['.', 1], ['E5', 1], ['.', 1], ['F5', 2], ['E5', 2], ['B4', 2], ['.', 2], ['E5', 4],
    ['F5', 1], ['.', 1], ['F5', 1], ['.', 1], ['G5', 2], ['F5', 2], ['C5', 2], ['.', 2], ['F5', 4],
    ['B5', 2], ['A#5', 2], ['B5', 2], ['E6', 2], ['D6', 2], ['B5', 2], ['A#5', 2], ['B5', 2],
    ['C6', 2], ['B5', 2], ['C6', 2], ['F6', 2], ['E6', 2], ['C6', 2], ['B5', 2], ['C6', 2],
    ['E6', 4], ['D#6', 4], ['D6', 4], ['C#6', 4],
    ['C6', 4], ['B5', 4], ['A#5', 4], ['A5', 4],
    ['G5', 2], ['A#5', 2], ['B5', 4], ['G5', 2], ['A#5', 2], ['B5', 4],
    ['B5', 2], ['C6', 2], ['B5', 2], ['A#5', 2], ['B5', 8],
  ];

  // 風「天翔」：D 大調的陽音階（D E F# A B），明亮、往上飛的感覺，旋律多跳躍
  const WIND_A = [
    ['D5', 2], ['E5', 2], ['F#5', 4], ['A5', 4], ['F#5', 2], ['E5', 2],
    ['D5', 4], ['B4', 2], ['D5', 2], ['E5', 8],
    ['F#5', 2], ['A5', 2], ['B5', 4], ['A5', 2], ['F#5', 2], ['E5', 4],
    ['D5', 2], ['E5', 2], ['F#5', 2], ['A5', 2], ['E5', 8],
    ['A5', 2], ['B5', 2], ['D6', 4], ['B5', 2], ['A5', 2], ['F#5', 4],
    ['E5', 2], ['F#5', 2], ['A5', 4], ['B5', 4], ['A5', 4],
    ['F#5', 4], ['E5', 2], ['D5', 2], ['B4', 4], ['D5', 4],
    ['E5', 4], ['A4', 4], ['D5', 8],
  ];
  const WIND_B = [
    ['A5', 8], ['B5', 4], ['A5', 4],
    ['F#5', 8], ['E5', 4], ['D5', 4],
    ['E5', 4], ['F#5', 4], ['A5', 4], ['B5', 4],
    ['A5', 12], ['.', 4],
    ['D6', 6], ['B5', 2], ['A5', 4], ['F#5', 4],
    ['A5', 4], ['B5', 4], ['D6', 8],
    ['E6', 4], ['D6', 4], ['B5', 4], ['A5', 4],
    ['B5', 2], ['A5', 2], ['F#5', 2], ['E5', 2], ['D5', 8],
  ];
  // 火「紅蓮」：A 小調加降二級（A#）的弗里吉亞色彩，斷奏的刺擊、十六分音符低音，像岩漿翻滾
  const FIRE_A = [
    ['A4', 1], ['.', 1], ['A4', 1], ['.', 1], ['C5', 2], ['A4', 2], ['A#4', 2], ['A4', 2], ['E5', 4],
    ['A4', 1], ['.', 1], ['A4', 1], ['.', 1], ['C5', 2], ['A4', 2], ['G4', 2], ['A4', 2], ['E4', 4],
    ['A5', 2], ['G5', 2], ['E5', 2], ['C5', 2], ['D5', 2], ['E5', 2], ['A#4', 4],
    ['A4', 2], ['C5', 2], ['E5', 2], ['A5', 2], ['G#5', 4], ['E5', 4],
    ['F5', 2], ['E5', 2], ['D5', 2], ['C5', 2], ['A#4', 2], ['C5', 2], ['D5', 4],
    ['E5', 2], ['F5', 2], ['G5', 2], ['A5', 2], ['A#5', 4], ['A5', 4],
    ['G5', 2], ['F5', 2], ['E5', 2], ['D5', 2], ['C5', 2], ['A#4', 2], ['A4', 4],
    ['G#4', 2], ['A4', 2], ['B4', 2], ['C5', 2], ['E5', 8],
  ];
  const FIRE_B = [
    ['A5', 6], ['G5', 2], ['E5', 4], ['A5', 4],
    ['A#5', 6], ['A5', 2], ['G5', 4], ['F5', 4],
    ['E5', 4], ['G5', 4], ['A#5', 4], ['D6', 4],
    ['C6', 12], ['.', 4],
    ['A5', 4], ['C6', 4], ['E6', 4], ['D6', 4],
    ['C6', 4], ['A#5', 4], ['A5', 4], ['G5', 4],
    ['F5', 2], ['G5', 2], ['A5', 2], ['A#5', 2], ['A5', 2], ['G5', 2], ['F5', 2], ['E5', 2],
    ['E5', 2], ['.', 2], ['E5', 2], ['.', 2], ['E5', 8],
  ];
  // 山「雪嶺」：D 的陰音階（D D# G A C），慢板、長音像尺八，莊嚴的和聲長音
  const MOUNT_A = [
    ['D5', 6], ['D#5', 2], ['G5', 4], ['A5', 4],
    ['C6', 6], ['A#5', 2], ['A5', 8],
    ['G5', 4], ['A5', 2], ['G5', 2], ['D#5', 4], ['D5', 4],
    ['D5', 12], ['.', 4],
    ['A5', 6], ['C6', 2], ['D6', 4], ['C6', 4],
    ['A#5', 4], ['A5', 4], ['G5', 8],
    ['D#5', 4], ['G5', 4], ['A5', 2], ['G5', 2], ['D#5', 4],
    ['D5', 16],
  ];
  const MOUNT_B = [
    ['D6', 8], ['C6', 4], ['A5', 4],
    ['A#5', 8], ['A5', 4], ['G5', 4],
    ['A5', 4], ['C6', 4], ['D6', 4], ['F6', 4],
    ['E6', 12], ['.', 4],
    ['F6', 6], ['E6', 2], ['D6', 4], ['C6', 4],
    ['A#5', 4], ['C6', 4], ['D6', 8],
    ['G5', 4], ['A5', 4], ['A#5', 4], ['C6', 4],
    ['A5', 8], ['D5', 8],
  ];

  // 曲目設定：段落、各聲道的用法
  // bass：oct8＝八分音符八度跳動、drive＝八度跳動加十六分音符的推進、run16＝十六分音符持續反覆
  const SONGS = {
    title: {
      bpm: 150, loopFrom: 2,
      sections: [
        { chords: ['Em', 'F'], intro: true },
        { chords: ['Em', 'F', 'Em', 'F', 'Am', 'C', 'F', 'B5'], mel: TITLE_A },
        { chords: ['Am', 'Am', 'F', 'F', 'C', 'D', 'Em', 'B5'], mel: TITLE_B, pad: true },
      ],
      bass: 'oct8', kick: [0, 6, 8], snare: [4, 12], hat: 'odd', arp: .022,
    },
    stage: {
      bpm: 168, loopFrom: 1,
      sections: [
        { chords: ['Em'], intro: true },
        { chords: ['Em', 'Em', 'C', 'D', 'Em', 'Em', 'F', 'B5'], mel: STAGE_A },
        { chords: ['Am', 'Am', 'F', 'F', 'C', 'C', 'B5', 'B5'], mel: STAGE_B, pad: true },
      ],
      bass: 'drive', kick: [0, 8, 10], snare: [4, 12], hat: 'all', arp: .02,
    },
    wind: {   // 風「天翔」
      bpm: 172, loopFrom: 1,
      sections: [
        { chords: ['D'], intro: true },
        { chords: ['D', 'Bm', 'G', 'A', 'D', 'Bm', 'Em', 'D'], mel: WIND_A },
        { chords: ['G', 'D', 'Em', 'A', 'G', 'D', 'A', 'D'], mel: WIND_B, pad: true },
      ],
      bass: 'oct8', kick: [0, 8], snare: [4, 12], hat: 'odd', arp: .02,
    },
    fire: {   // 火「紅蓮」
      bpm: 176, loopFrom: 1,
      sections: [
        { chords: ['Am', 'Bb'], intro: true },
        { chords: ['Am', 'Am', 'Am', 'E', 'Bb', 'Am', 'Bb', 'E'], mel: FIRE_A },
        { chords: ['Am', 'Bb', 'Gm', 'C', 'Am', 'F', 'Dm', 'E'], mel: FIRE_B, pad: true },
      ],
      bass: 'run16', kick: [0, 6, 8, 14], snare: [4, 12], hat: 'all', arp: .017,
    },
    mountain: {   // 山「雪嶺」
      bpm: 138, loopFrom: 1,
      sections: [
        { chords: ['Dm', 'Dm'], intro: true },
        { chords: ['Dm', 'Gm', 'Cm', 'Dm', 'Dm', 'Gm', 'Eb', 'Dm'], mel: MOUNT_A, pad: true },
        { chords: ['Dm', 'Gm', 'F', 'A', 'Dm', 'Bb', 'Cm', 'Dm'], mel: MOUNT_B, pad: true },
      ],
      bass: 'oct8', kick: [0, 10], snare: [12], hat: 'odd', arp: .024,
    },
    boss: {
      bpm: 180, loopFrom: 0,
      sections: [
        { chords: ['Em', 'F', 'Em', 'F', 'Em', 'F', 'Em', 'B5'], mel: BOSS_A, pad: true },
      ],
      bass: 'run16', kick: [0, 4, 8, 12], snare: [4, 12], hat: 'all', arp: .018,
    },
  };

  // 把曲譜展開成每小節的事件表
  function build(sections) {
    const bars = [];
    for (const sec of sections) {
      const mel = [];
      if (sec.mel) for (const [n, len] of sec.mel) { mel.push(n === '.' ? null : { n, len }); for (let i = 1; i < len; i++) mel.push(undefined); }
      sec.chords.forEach((c, i) => bars.push({ chord: c, mel: sec.mel ? mel.slice(i * 16, i * 16 + 16) : [], pad: sec.pad, intro: sec.intro, fill: i === sec.chords.length - 1 }));
    }
    return bars;
  }
  for (const s of Object.values(SONGS)) s.bars = build(s.sections);
  // 短樂句（BGM.jingle）。位置與長度以十六分音符為單位
  const JINGLES = {
    fail: {   // 修行中斷「散華」：上行到高音後一路落下，最後停在主音 E 上，太鼓兩聲收尾
      bpm: 116,
      mel: [['E5', 1], ['F5', 1], ['A5', 1], ['B5', 1], ['C6', 4], ['B5', 2], ['A5', 2], ['F5', 4],
        ['E5', 2], ['F5', 2], ['B4', 4], ['E5', 12]],
      bass: [['E2', 0, 8], ['F2', 8, 8], ['F2', 16, 4], ['B1', 20, 4], ['E2', 24, 12]],
      koto: [['E4', 24], ['F4', 24.5], ['A4', 25], ['B4', 25.5], ['C5', 26], ['E5', 26.5]],   // 琴的刷弦
      taiko: [[0, .2], [3, .12], [8, .18], [16, .2], [20, .14], [24, .26], [25, .22]],
      hit: [[8, .35, .1, .05], [16, .35, .1, .05], [24, .45, .9, .05]],
    },
  };

  // ---- 波形 ----
  // 方波：依佔空比用傅立葉級數做 PeriodicWave（NES 方波有 12.5%／25%／50% 三種）
  function pulseWave(duty) {
    const N = 48, re = new Float32Array(N), im = new Float32Array(N);
    for (let n = 1; n < N; n++) re[n] = 2 * Math.sin(Math.PI * n * duty) / (Math.PI * n);
    return ac.createPeriodicWave(re, im);
  }
  // 三角波：NES 是 4-bit 階梯三角波，用 32 階取樣近似
  function stepTriWave() {
    const N = 32, re = new Float32Array(N), im = new Float32Array(N), s = [];
    for (let k = 0; k < 32; k++) s.push((k < 16 ? 15 - k : k - 16) / 7.5 - 1);
    // 只取前 15 個諧波：32 點取樣的第 16 個以上是鏡像，算進去會在低音上多出一個很亮的高頻「鈴聲」
    for (let n = 1; n < N / 2; n++) { let a = 0, b = 0; for (let k = 0; k < 32; k++) { const th = 2 * Math.PI * n * k / 32; a += s[k] * Math.cos(th); b += s[k] * Math.sin(th); } re[n] = a / 16; im[n] = b / 16; }
    return ac.createPeriodicWave(re, im);
  }
  // 雜訊：15-bit LFSR（和 NES 雜訊聲道同樣的回饋方式），用播放速率調音高
  function lfsrNoise() {
    const len = ac.sampleRate, b = ac.createBuffer(1, len, ac.sampleRate), d = b.getChannelData(0);
    let r = 1;
    for (let i = 0; i < len; i++) { const fb = (r ^ (r >> 1)) & 1; r = (r >> 1) | (fb << 14); d[i] = (r & 1) ? .9 : -.9; }
    return b;
  }
  function makeVoices() {
    waves = { p12: pulseWave(.125), p25: pulseWave(.25), p50: pulseWave(.5), tri: stepTriWave() };
    noiseBuf = lfsrNoise();
  }

  // ---- 發聲 ----
  // 方波／三角波一個音：快速起音、輕微衰減、音尾留 10% 空隙（NES 的斷奏感）；長音加顫音
  function note(wave, f, t, dur, vol, vib) {
    const o = ac.createOscillator(), gn = ac.createGain();
    o.setPeriodicWave(wave); o.frequency.setValueAtTime(f, t);
    if (vib && dur > .3) { // 顫音：延遲 0.15 秒後開始，6Hz
      const l = ac.createOscillator(), lg = ac.createGain();
      l.frequency.value = 6; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(f * .012, t + .25);
      l.connect(lg).connect(o.frequency); l.start(t); l.stop(t + dur);
    }
    const end = t + dur * .9;
    gn.gain.setValueAtTime(0, t); gn.gain.linearRampToValueAtTime(vol, t + .005);
    gn.gain.linearRampToValueAtTime(vol * .7, t + Math.min(.12, dur * .5));
    gn.gain.setValueAtTime(vol * .7, end - .01); gn.gain.linearRampToValueAtTime(0, end);
    o.connect(gn).connect(out); o.start(t); o.stop(end + .02);
  }
  // 雜訊打擊（小鼓／鈸）
  function hit(t, rate, dur, vol) {
    const s = ac.createBufferSource(), gn = ac.createGain();
    s.buffer = noiseBuf; s.playbackRate.value = rate; s.loop = true;
    gn.gain.setValueAtTime(vol, t); gn.gain.exponentialRampToValueAtTime(.001, t + dur);
    s.connect(gn).connect(out); s.start(t, Math.random() * .5); s.stop(t + dur + .02);
  }
  // 太鼓風的大鼓：三角波音高快速下滑（NES 遊戲常用的做法）
  function kick(t, vol) {
    const o = ac.createOscillator(), gn = ac.createGain();
    o.setPeriodicWave(waves.tri); o.frequency.setValueAtTime(180, t); o.frequency.exponentialRampToValueAtTime(42, t + .14);
    gn.gain.setValueAtTime(vol, t); gn.gain.linearRampToValueAtTime(0, t + .16);
    o.connect(gn).connect(out); o.start(t); o.stop(t + .18);
  }

  // 排程一首曲子的第 i 個十六分音符（所有聲道）
  function schedule(S, i, t, hot) {
    const bar = S.bars[Math.floor(i / 16)], s = i % 16, ch = CH[bar.chord];
    // 方波 1：主旋律（25%）；方波 2：回音（12.5%，晚 3 步、較小聲）
    const m = bar.mel[s];
    if (m) {
      const f = hz(m.n) * tr, d = m.len * STEP;
      note(waves.p25, f, t, d, .075, true);
      note(waves.p12, f, t + 3 * STEP, d, .03, false);
    }
    // 方波 3（MMC5）：分解和弦，高八度、每十六分音符一個音
    const arp = [0, 1, 2, 1][s % 4];
    note(waves.p12, hz(ch[arp]) * 2 * tr, t, STEP, bar.intro ? S.arp * 1.6 : S.arp * (hot ? 1.4 : 1), false);
    // 方波 4（MMC5）：和聲長音（和弦三音，每半小節一個）
    if (bar.pad && s % 8 === 0) note(waves.p50, hz(ch[1]) * tr, t, 8 * STEP, .03, true);
    // 三角波：低音（波形修正後基音扎實，音量 .1）
    const root = hz(BASS[bar.chord]) * tr;
    if (S.bass === 'oct8' && s % 2 === 0) note(waves.tri, root * (s % 4 === 2 ? 2 : 1), t, 2 * STEP, .1, false);
    if (S.bass === 'drive') {
      if (s % 2 === 0) note(waves.tri, root * (s % 4 === 2 ? 2 : 1), t, 2 * STEP, .1, false);
      else if (s === 15 || s === 7) note(waves.tri, root * 2, t, STEP, .08, false);   // 十六分音符的推進
    }
    if (S.bass === 'run16') note(waves.tri, root * ([1, 1, 2, 1][s % 4]), t, STEP, .1, false);
    // 雜訊與大鼓；段落最後一小節加小鼓連打；狂熱時大鼓每拍、鈸每個十六分音符
    if (S.kick.includes(s) || (bar.intro && s === 14) || (hot && s % 4 === 0)) kick(t, .22);
    if (S.snare.includes(s) || (bar.fill && s >= 12)) hit(t, .35, .12, .07);
    if (S.hat === 'all' || s % 2 === 1 || hot) hit(t, 1, .03, s % 2 ? .025 : (hot ? .03 : .015));
  }
  function tick() {
    const S = song, total = S.bars.length * 16;
    while (nextT < ac.currentTime + .15) {
      schedule(S, step, nextT, api.hot);
      nextT += STEP; step++;
      if (step >= total) step = S.loopFrom * 16;
    }
  }
  function stopNow() {
    if (!timer) return;
    clearInterval(timer); timer = null; key = '';
    const o = out; o.gain.setTargetAtTime(0, ac.currentTime, .05);   // 淡出，已排程的音不會突然斷掉
    setTimeout(() => o.disconnect(), 400);
  }

  const api = {
    hot: false,
    get playing() { return !!timer; },
    get current() { return timer ? key : ''; },
    // 開始播放或切換曲子；同一首、同樣的移調與速度就不重播
    play(ctx, id = 'title', opt = {}) {
      if (!ctx || !SONGS[id]) return;
      const k = `${id}|${opt.tr || 0}|${opt.sp || 1}`;
      if (timer && k === key) return;
      stopNow();
      if (ac !== ctx) { ac = ctx; makeVoices(); }
      song = SONGS[id]; key = k;
      tr = Math.pow(2, (opt.tr || 0) / 12);
      STEP = 60 / (song.bpm * (opt.sp || 1)) / 4;
      out = ac.createGain(); out.gain.value = MASTER * vol; out.connect(ac.destination);
      step = 0; nextT = ac.currentTime + .08;
      timer = setInterval(tick, 25); tick();
    },
    stop: stopNow,
    // 短樂句（只播一次）：修行中斷「散華」——都節音階（E F A B C）的下行收尾、琴的刷弦、太鼓「咚咚」
    jingle(ctx, id = 'fail') {
      if (!ctx || !vol) return;
      stopNow();
      if (ac !== ctx) { ac = ctx; makeVoices(); }
      const J = JINGLES[id]; if (!J) return;
      const st = 60 / J.bpm / 4, t0 = ac.currentTime + .06, prev = out;
      out = ac.createGain(); out.gain.value = MASTER * vol; out.connect(ac.destination);
      let s = 0;
      for (const [n, len] of J.mel) { if (n !== '.') { note(waves.p25, hz(n), t0 + s * st, len * st, .08, len >= 6); note(waves.p12, hz(n), t0 + (s + 2) * st, len * st, .025, false); } s += len; }
      for (const [n, at, len] of J.bass) note(waves.tri, hz(n), t0 + at * st, len * st, .11, false);
      for (const [n, at] of J.koto) note(waves.p12, hz(n), t0 + at * st, 6 * st, .035, false);
      for (const [at, v] of J.taiko) kick(t0 + at * st, v);
      for (const [at, r, d, v] of J.hit) hit(t0 + at * st, r, d, v);
      const o = out; out = prev;
      setTimeout(() => o.disconnect(), (s + 12) * st * 1000);
    },
    // 設定頁調整音樂音量：播放中的曲子立即套用
    setVol(v) { if (v === vol) return; vol = v; if (out && timer) out.gain.setTargetAtTime(MASTER * v, ac.currentTime, .03); },
    // 測試用：離線算出某首曲子前 sec 秒的音訊，回傳每秒音量（RMS）、峰值、一輪長度
    async test(id = 'title', sec = 8, opt = {}) {
      const prev = [ac, out, waves, noiseBuf, song, tr, STEP];
      ac = new OfflineAudioContext(1, 44100 * sec, 44100); makeVoices();
      song = SONGS[id]; tr = Math.pow(2, (opt.tr || 0) / 12); STEP = 60 / (song.bpm * (opt.sp || 1)) / 4;
      out = ac.createGain(); out.gain.value = MASTER; out.connect(ac.destination);
      const total = song.bars.length * 16;
      for (let i = 0, t = .05; t < sec - .3; i++, t += STEP) schedule(song, i < total ? i : song.loopFrom * 16 + (i - total) % (total - song.loopFrom * 16), t, !!opt.hot);
      const d = (await ac.startRendering()).getChannelData(0), rms = [];
      for (let s = 0; s < sec; s++) { let a = 0; for (let k = s * 44100; k < (s + 1) * 44100; k++) a += d[k] * d[k]; rms.push(+Math.sqrt(a / 44100).toFixed(3)); }
      let peak = 0; for (const v of d) peak = Math.max(peak, Math.abs(v));
      const loopSec = +(total * STEP).toFixed(1);
      [ac, out, waves, noiseBuf, song, tr, STEP] = prev;
      return { bars: SONGS[id].bars.length, loopSec, rms, peak: +peak.toFixed(2) };
    },
  };
  return api;
})();
