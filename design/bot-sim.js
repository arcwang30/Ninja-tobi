// 自動遊玩測試（平衡用）：在瀏覽器主控台或 javascript_tool 中 eval 這個檔案後呼叫 botRun(...)
// 機器人：上升時瞄準上方最高、搆得到的地板，下落時瞄準腳下最近的地板；附近有敵人就衝刺斬；
// 快掉出畫面就用卷軸；QTE 依 skill 機率打出完美／好／失誤；升級三選一隨機選。
window.botRun = function (opt) {
  const o = Object.assign({ lvl: 0, meta: {}, skin: 0, maxT: 1200, qteSkill: .7, dashCD: .9, seed: null }, opt);
  const keep = localStorage.getItem('tobi_save');
  save.meta = Object.assign(Object.fromEntries(META.map(m => [m.id, 0])), o.meta); save.skin = o.skin;
  const P0 = window.persist; window.persist = () => { };
  startRun(o.lvl); hideAll(); state = 'play'; paused = false; g.zi = null;
  const R = { lvl: o.lvl, stages: [], hurts: {}, dmg: 0, died: false, cleared: false, t: 0, kills0: 0 };
  const H0 = window.hurt; window.hurt = src => { const hp = g.hp; const r = H0(src); if (g.hp < hp) { R.hurts[src] = (R.hurts[src] || 0) + 1; R.dmg += hp - g.hp; } return r; };
  let st = g.stage, stT = 0, dashT = 0, lastHp = g.hp;
  const dt = 1 / 60;
  for (let f = 0; f < o.maxT * 60; f++) {
    R.t += dt; stT += dt; dashT -= dt;
    if (state === 'perk') { choosePerk(perkChoices.length ? Math.floor(Math.random() * perkChoices.length) : -1); continue; }
    if (state === 'clearq') { R.cleared = true; break; }
    if (state === 'over' || state === 'dying' && g.dieT < .05) { R.died = true; break; }
    if (state === 'qte' && g.qte && !g.qte.end) {
      const q = g.qte, cur = q.rings.find(r => !r.res);
      if (cur && !cur.plan) cur.plan = Math.random() < o.qteSkill ? 4 : Math.random() < .7 ? 13 : 40;
      if (cur && Math.abs(qteR(cur) - q.RT) <= cur.plan * .5 + .5) qteTap();
    }
    if (state === 'play' && g) {
      const p = g.p; let tx = p.x;
      const plats = g.plats.filter(pl => !pl.broken && (!o.avoid || pl.type !== 'spike'));
      if (p.vy < 0) {   // 上升：找搆得到的最高地板
        let best = null;
        for (const pl of plats) { const dy = p.y - pl.y, dx = Math.abs(pl.x - p.x); if (dy > 20 && dy < 175 && dx < 170 && (!best || pl.y < best.y)) best = pl; }
        if (best) tx = best.x;
      } else {          // 下落：找腳下最近的地板
        let best = null, bs = 1e9;
        for (const pl of plats) { const dy = pl.y - p.y; if (dy < -4) continue; const s = Math.abs(pl.x - p.x) + dy * .35; if (s < bs) { bs = s; best = pl; } }
        if (best) tx = best.x;
      }
      // 附近上方有敵人：衝刺斬
      if (dashT <= 0) {
        const en = (o.avoid && g.enemies.find(e => !e.dead && e.type === 10 && Math.hypot(e.x - p.x, e.y - (p.y - 20)) < 90)) || g.enemies.find(e => !e.dead && e.type !== 10 && e.y < p.y - 20 && p.y - e.y < 170 && Math.abs(e.x - p.x) < 130);
        if (en) { const before = p.dash; startDash(en.x - p.x, en.y - (p.y - 20)); dashT = o.dashCD; }
      }
      inp.keys.ArrowLeft = tx < p.x - 8; inp.keys.ArrowRight = tx > p.x + 8;
      if (g.scrolls > 0 && g.fly <= 0 && p.vy > 200 && p.y > g.camY + H - 130) castScroll();
    }
    update(dt);
    if (g && g.stage !== st) { R.stages.push({ s: st + 1, t: +stT.toFixed(1), lv: g.lv, hp: Math.round(g.hp), maxHp: g.maxHp, coins: Math.floor(g.coins), kills: g.kills }); st = g.stage; stT = 0; }
  }
  inp.keys.ArrowLeft = inp.keys.ArrowRight = false;
  Object.assign(R, { endStage: g ? g.stage + 1 : 0, lv: g ? g.lv : 0, coins: g ? Math.floor(g.coins) : 0, kills: g ? g.kills : 0, score: g ? score() : 0, skills: g ? Object.assign({}, g.skills) : {}, t: +R.t.toFixed(0), dmg: Math.round(R.dmg) });
  window.hurt = H0; window.persist = P0;
  if (keep != null) localStorage.setItem('tobi_save', keep); else localStorage.removeItem('tobi_save');
  return R;
};
