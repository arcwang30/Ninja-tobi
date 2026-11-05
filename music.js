'use strict';
/* 標題曲「鳶ノ影」— 模擬 NES + MMC5 擴充音源（4 方波＋三角波＋雜訊）
   都節音階（E F A B C）＋小調和弦，150 BPM。BGM.play(ac) 開始、BGM.stop() 停止 */
const BGM = (() => {
  const BPM = 150, STEP = 60 / BPM / 4;   // 十六分音符長度（秒）
  const MASTER = .5;                       // 總音量（峰值約 0.9，不會破音）
  let ac = null, out = null, timer = null, nextT = 0, step = 0, waves = null, noiseBuf = null;

  // ---- 音名 → 頻率 ----
  const SEMI = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };
  const hz = n => { const m = /^([A-G]#?)(\d)$/.exec(n); return 440 * Math.pow(2, (SEMI[m[1]] + (+m[2] + 1) * 12 - 69) / 12); };

  // ---- 曲譜 ----
  // 和弦（每小節一個），用於分解和弦與低音
  const CH = {
    Em: ['E4', 'G4', 'B4'], F: ['F4', 'A4', 'C5'], Am: ['A3', 'C4', 'E4'], C: ['C4', 'E4', 'G4'],
    D: ['D4', 'F#4', 'A4'], B5: ['B3', 'F#4', 'B4'],
  };
  const BASS = { Em: 'E2', F: 'F2', Am: 'A2', C: 'C2', D: 'D2', B5: 'B1' };
  // 主旋律：[音名, 長度（十六分音符數）]，'.' 為休止
  const MEL_A = [
    ['E5', 4], ['B4', 2], ['E5', 2], ['F5', 2], ['E5', 2], ['B4', 4],
    ['C5', 4], ['A4', 2], ['C5', 2], ['F5', 4], ['E5', 2], ['C5', 2],
    ['B4', 2], ['E5', 2], ['G5', 4], ['F5', 2], ['E5', 2], ['B4', 4],
    ['A4', 2], ['C5', 2], ['F5', 4], ['E5', 4], ['.', 4],
    ['A5', 4], ['G5', 2], ['E5', 2], ['A5', 2], ['B5', 2], ['C6', 4],
    ['B5', 2], ['A5', 2], ['G5', 4], ['E5', 4], ['G5', 4],
    ['F5', 2], ['E5', 2], ['C5', 2], ['A4', 2], ['C5', 4], ['F5', 4],
    ['E5', 2], ['F5', 2], ['F#5', 4], ['B5', 8],
  ];
  const MEL_B = [
    ['E6', 8], ['C6', 4], ['B5', 4],
    ['A5', 8], ['.', 4], ['E5', 4],
    ['F5', 4], ['A5', 4], ['C6', 4], ['B5', 2], ['A5', 2],
    ['A5', 12], ['.', 4],
    ['G5', 4], ['E5', 4], ['G5', 4], ['C6', 4],
    ['A5', 4], ['F#5', 4], ['D5', 4], ['F#5', 4],
    ['E5', 2], ['G5', 2], ['B5', 2], ['E6', 2], ['D6', 2], ['B5', 2], ['G5', 2], ['B5', 2],
    ['B5', 4], ['F#5', 4], ['B5', 8],
  ];
  const CHORD_A = ['Em', 'F', 'Em', 'F', 'Am', 'C', 'F', 'B5'];
  const CHORD_B = ['Am', 'Am', 'F', 'F', 'C', 'D', 'Em', 'B5'];
  // 前奏 2 小節（只有鼓、低音和分解和弦），之後 A→B 無限循環
  const SECTIONS = [
    { chords: ['Em', 'F'], mel: null, intro: true },
    { chords: CHORD_A, mel: MEL_A },
    { chords: CHORD_B, mel: MEL_B, pad: true },
  ];

  // 把曲譜展開成每個十六分音符的事件表
  function build() {
    const bars = [];   // 每小節：{ chord, mel: [16 個 null 或 {n, len}], pad, fill, intro }
    for (const sec of SECTIONS) {
      const mel = [];
      if (sec.mel) for (const [n, len] of sec.mel) { mel.push(n === '.' ? null : { n, len }); for (let i = 1; i < len; i++) mel.push(undefined); }
      sec.chords.forEach((c, i) => bars.push({ chord: c, mel: sec.mel ? mel.slice(i * 16, i * 16 + 16) : [], pad: sec.pad, intro: sec.intro, fill: i === sec.chords.length - 1 }));
    }
    return bars;
  }
  const BARS = build();
  const LOOP_FROM = 2;   // 循環時跳過前奏

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

  // 排程一個十六分音符的所有聲道
  function schedule(i, t) {
    const bar = BARS[Math.floor(i / 16)], s = i % 16, ch = CH[bar.chord];
    // 方波 1：主旋律（25%）；方波 2：回音（12.5%，晚 3 步、較小聲）
    const m = bar.mel[s];
    if (m) {
      const f = hz(m.n), d = m.len * STEP;
      note(waves.p25, f, t, d, .075, true);
      note(waves.p12, f, t + 3 * STEP, d, .03, false);
    }
    // 方波 3（MMC5）：分解和弦，高八度、每十六分音符一個音
    const arp = [0, 1, 2, 1][s % 4], af = hz(ch[arp]) * 2;
    note(waves.p12, af, t, STEP, bar.intro ? .035 : .022, false);
    // 方波 4（MMC5）：B 段和聲長音（和弦三音，每半小節一個）
    if (bar.pad && s % 8 === 0) note(waves.p50, hz(ch[1]), t, 8 * STEP, .03, true);
    // 三角波：八度跳動的低音（八分音符）。波形修正後基音變扎實，音量從 .16 降到 .1 維持平衡
    if (s % 2 === 0) { const b = hz(BASS[bar.chord]) * (s % 4 === 2 ? 2 : 1); note(waves.tri, b, t, 2 * STEP, .1, false); }
    // 雜訊與大鼓：太鼓節奏，段落最後一小節加小鼓連打
    if (s === 0 || s === 6 || s === 8 || (bar.intro && s === 14)) kick(t, .22);
    if (s === 4 || s === 12 || (bar.fill && s >= 12)) hit(t, .35, .12, .07);
    if (s % 2 === 1) hit(t, 1, .03, .025);
  }
  function tick() {
    while (nextT < ac.currentTime + .15) {
      schedule(step, nextT);
      nextT += STEP; step++;
      if (step >= BARS.length * 16) step = LOOP_FROM * 16;
    }
  }

  return {
    get playing() { return !!timer; },
    // 測試用：離線算出前 sec 秒的音訊，回傳每秒的音量（RMS）
    async test(sec = 8) {
      const prev = [ac, out, waves, noiseBuf];
      ac = new OfflineAudioContext(1, 44100 * sec, 44100);
      makeVoices();
      out = ac.createGain(); out.gain.value = MASTER; out.connect(ac.destination);
      for (let i = 0, t = .05; t < sec - .3; i++, t += STEP) schedule(i % (BARS.length * 16), t);
      const buf = await ac.startRendering(), d = buf.getChannelData(0), rms = [];
      for (let s = 0; s < sec; s++) { let a = 0; for (let k = s * 44100; k < (s + 1) * 44100; k++) a += d[k] * d[k]; rms.push(+Math.sqrt(a / 44100).toFixed(3)); }
      let peak = 0; for (const v of d) peak = Math.max(peak, Math.abs(v));
      // 高頻量：相鄰取樣差的 RMS（高頻聲音越多越大）
      let hf = 0; for (let k = 1; k < d.length; k++) hf += (d[k] - d[k - 1]) ** 2;
      hf = +Math.sqrt(hf / d.length).toFixed(4);
      [ac, out, waves, noiseBuf] = prev;
      return { bars: BARS.length, secPerLoop: +(BARS.length * 16 * STEP).toFixed(1), rms, peak: +peak.toFixed(2), hf };
    },
    play(ctx) {
      if (timer || !ctx) return;
      if (ac !== ctx) { ac = ctx; makeVoices(); }
      out = ac.createGain(); out.gain.value = MASTER; out.connect(ac.destination);
      step = 0; nextT = ac.currentTime + .08;
      timer = setInterval(tick, 25); tick();
    },
    stop() {
      if (!timer) return;
      clearInterval(timer); timer = null;
      const o = out; o.gain.setTargetAtTime(0, ac.currentTime, .05);   // 淡出，已排程的音不會突然斷掉
      setTimeout(() => o.disconnect(), 400);
    },
  };
})();
