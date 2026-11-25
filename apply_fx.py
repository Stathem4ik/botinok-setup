from pathlib import Path

p = Path("server.py")
src = p.read_text(encoding="utf-8")

fx_block = """
<!-- RPG_TACTICAL_FX_V2 -->
<style>
  .rpg-hit-flash { animation: rpgHitFlash 140ms ease-out; }
  @keyframes rpgHitFlash {
    0% { filter: brightness(1.9) contrast(1.25); transform: translate3d(0, -2px, 0) scale(1.02); }
    50% { filter: brightness(1.35); transform: translate3d(3px, 1px, 0) scale(0.99); }
    100% { filter: none; transform: none; }
  }
  .rpg-shake-burst { animation: rpgShakeBurst 180ms cubic-bezier(.36,.07,.19,.97); }
  @keyframes rpgShakeBurst {
    0%, 100% { transform: translate3d(0, 0, 0); }
    20% { transform: translate3d(-5px, 2px, 0); }
    40% { transform: translate3d(5px, -3px, 0); }
    60% { transform: translate3d(-4px, -2px, 0); }
    80% { transform: translate3d(3px, 2px, 0); }
  }
  #rpg-fx-overlay { position: fixed; inset: 0; pointer-events: none; z-index: 9999; overflow: hidden; }
  .rpg-dmg-pop {
    position: absolute; font-weight: 800; font-size: 16px; color: #ffdf5e;
    text-shadow: 0 2px 6px rgba(0,0,0,0.85); will-change: transform, opacity;
    transition: transform 520ms cubic-bezier(.16,.84,.44,1), opacity 520ms ease-out;
  }
  .rpg-part-piece {
    position: absolute; border-radius: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.45);
    will-change: transform, opacity;
  }

.rpg-bleed-drop {
  position: fixed;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, #ff3b3b, #780000);
  pointer-events: none;
  z-index: 10000;
  box-shadow: 0 0 6px rgba(210, 15, 15, 0.85);
  transition: transform 0.55s cubic-bezier(0.22, 0.8, 0.36, 1), opacity 0.55s ease-out;
}
</style>
<div id="rpg-fx-overlay"></div>
<script>
(() => {
  const overlay = document.getElementById("rpg-fx-overlay");
  let recentArchetypes = [];
  let deathLock = false;
  let pendingRespawnTimer = null;
  let tapStreak = 0;
  let tapStreakTimer = null;

  const ARCHETYPES = [
    { kind: "golem", hue: 165, scale: 1.15, title: "Каменный Страж" },
    { kind: "wraith", hue: 275, scale: 0.95, title: "Теневой Жнец" },
    { kind: "pyro", hue: 18, scale: 1.05, title: "Искровой Берсерк" },
    { kind: "frost", hue: 198, scale: 1.0, title: "Ледяной Культист" },
    { kind: "venom", hue: 112, scale: 0.92, title: "Болотный Охотник" },
    { kind: "titan", hue: 345, scale: 1.25, title: "Кровавый Колосс" },
    { kind: "void", hue: 235, scale: 1.08, title: "Разломный Странник" },
    { kind: "dune", hue: 42, scale: 1.02, title: "Песчаный Рейдер" }
  ];

  function pickDiverseEnemy() {
    const candidates = ARCHETYPES.filter(a => !recentArchetypes.includes(a.kind));
    const pool = candidates.length ? candidates : ARCHETYPES;
    const chosen = pool[Math.floor(Math.random() * pool.length)];
    recentArchetypes.push(chosen.kind);
    if (recentArchetypes.length > 4) recentArchetypes.shift();
    return {
      ...chosen,
      variantHue: (chosen.hue + Math.floor(Math.random() * 36) - 18 + 360) % 360,
      variantScale: +(chosen.scale * (0.88 + Math.random() * 0.28)).toFixed(2),
      seed: Math.floor(Math.random() * 1e9)
    };
  }

  function findEnemyTargets() {
    const els = Array.from(document.querySelectorAll("canvas, svg, [class*='boss'], [class*='enemy'], [class*='mob'], [id*='boss'], [id*='enemy'], [id*='mob']"));
    return els.filter(el => el !== overlay && el.id !== "rpg-fx-overlay" && el.offsetWidth > 24 && el.offsetHeight > 24);
  }

  
  function spawnBleedDrops(x, y, count) {
    if (!overlay) return;
    const targets = findEnemyTargets();
    let bx = (typeof x === "number" && x > 0) ? x : 0;
    let by = (typeof y === "number" && y > 0) ? y : 0;
    if ((!bx || !by) && targets[0]) {
      const r = targets[0].getBoundingClientRect();
      bx = r.left + r.width * (0.35 + Math.random() * 0.3);
      by = r.top + r.height * (0.3 + Math.random() * 0.35);
    }
    if (!bx || !by) {
      bx = window.innerWidth * 0.5;
      by = window.innerHeight * 0.42;
    }
    const n = count || 7;
    for (let i = 0; i < n; i++) {
      const drop = document.createElement("div");
      drop.className = "rpg-bleed-drop";
      const sz = 5 + Math.random() * 6;
      drop.style.width = sz + "px";
      drop.style.height = sz + "px";
      drop.style.left = bx + "px";
      drop.style.top = by + "px";
      overlay.appendChild(drop);

      const ang = Math.random() * Math.PI * 2;
      const dist = 22 + Math.random() * 72;
      const dx = Math.cos(ang) * dist;
      const dy = Math.sin(ang) * dist + 24;

      requestAnimationFrame(() => {
        drop.style.transform = `translate3d(${dx}px, ${dy}px, 0) scale(0.45)`;
        drop.style.opacity = "0";
      });
      setTimeout(() => drop.remove(), 580);
    }
  }

function triggerHitFeedback(x, y, dmgText) {
    spawnBleedDrops(x, y, 7);
    tapStreak += 1;
    clearTimeout(tapStreakTimer);
    tapStreakTimer = setTimeout(() => { tapStreak = 0; }, 350);

    const targets = findEnemyTargets();
    targets.slice(0, 3).forEach(el => {
      el.classList.remove("rpg-hit-flash", "rpg-shake-burst");
      void el.offsetWidth;
      el.classList.add("rpg-hit-flash");
      if (tapStreak >= 2) el.classList.add("rpg-shake-burst");
    });

    if (overlay) {
      const pop = document.createElement("div");
      pop.className = "rpg-dmg-pop";
      const px = (typeof x === "number" && x > 0) ? x : window.innerWidth * (0.35 + Math.random() * 0.3);
      const py = (typeof y === "number" && y > 0) ? y : window.innerHeight * (0.28 + Math.random() * 0.16);
      const jx = (Math.random() - 0.5) * 38;
      const jy = -18 - Math.random() * 24;
      pop.style.left = px + "px";
      pop.style.top = py + "px";
      pop.textContent = dmgText ? `-${dmgText}` : (tapStreak > 1 ? `-${tapStreak}x` : "-HIT");
      overlay.appendChild(pop);
      requestAnimationFrame(() => {
        pop.style.transform = `translate3d(${jx}px, ${jy - 36}px, 0) scale(${Math.min(1.45, 1 + tapStreak * 0.04)})`;
        pop.style.opacity = "0";
      });
      setTimeout(() => pop.remove(), 560);
    }
  }

  function shatterEnemyOnBridge(centerX, centerY) {
    if (!overlay || deathLock) return;
    deathLock = true;

    const rect = (() => {
      const t = findEnemyTargets()[0];
      if (t) {
        const r = t.getBoundingClientRect();
        return { cx: r.left + r.width * 0.5, cy: r.top + r.height * 0.55, w: r.width, h: r.height };
      }
      return { cx: centerX || window.innerWidth * 0.5, cy: centerY || window.innerHeight * 0.36, w: 120, h: 120 };
    })();

    const parts = [
      { name: "head", w: 22, h: 22, ox: 0, oy: -rect.h * 0.28, color: "#ff7675" },
      { name: "torso", w: 28, h: 34, ox: 0, oy: -rect.h * 0.05, color: "#74b9ff" },
      { name: "arm_l", w: 12, h: 26, ox: -22, oy: -rect.h * 0.06, color: "#ffeaa7" },
      { name: "arm_r", w: 12, h: 26, ox: 22, oy: -rect.h * 0.06, color: "#ffeaa7" },
      { name: "leg_l", w: 13, h: 26, ox: -10, oy: rect.h * 0.22, color: "#55efc4" },
      { name: "leg_r", w: 13, h: 26, ox: 10, oy: rect.h * 0.22, color: "#55efc4" },
      { name: "shard_1", w: 10, h: 10, ox: -14, oy: 4, color: "#fdcb6e" },
      { name: "shard_2", w: 10, h: 10, ox: 14, oy: -8, color: "#e17055" }
    ];

    const shuffled = parts.sort(() => Math.random() - 0.5);
    const bridgeFloorY = rect.cy + Math.max(24, rect.h * 0.28);

    shuffled.forEach((part, idx) => {
      const el = document.createElement("div");
      el.className = "rpg-part-piece";
      el.dataset.part = part.name;
      el.style.width = part.w + "px";
      el.style.height = part.h + "px";
      el.style.background = part.color;

      const startX = rect.cx + part.ox;
      const startY = rect.cy + part.oy;
      el.style.left = startX + "px";
      el.style.top = startY + "px";
      overlay.appendChild(el);

      const delay = idx * (25 + Math.floor(Math.random() * 45));
      const angle = Math.random() * Math.PI * 2;
      const dist = 55 + Math.random() * 115;
      const dx = Math.cos(angle) * dist;
      const dyBridge = Math.max(-25, Math.min(65, bridgeFloorY - startY + (Math.random() - 0.5) * 32));
      const rot = (Math.random() > 0.5 ? 1 : -1) * (180 + Math.floor(Math.random() * 540));

      setTimeout(() => {
        el.style.transition = "transform 680ms cubic-bezier(.22,1,.36,1), opacity 260ms ease-out 440ms";
        el.style.transform = `translate3d(${dx.toFixed(1)}px, ${dyBridge.toFixed(1)}px, 0) rotate(${rot}deg) scale(0.85)`;
        setTimeout(() => { el.style.opacity = "0"; }, 440);
        setTimeout(() => el.remove(), 740);
      }, delay);
    });

    window.__rpgNextEnemyProfile = pickDiverseEnemy();
    clearTimeout(pendingRespawnTimer);
    pendingRespawnTimer = setTimeout(() => { deathLock = false; }, 780);
  }

  window.addEventListener("pointerdown", (e) => {
    const btn = e.target.closest("button");
    const txt = (btn && btn.textContent || "").toLowerCase();
    if (txt.includes("удар") || txt.includes("атак") || txt.includes("вылаз") || e.target.closest("canvas")) {
      triggerHitFeedback(e.clientX, e.clientY, "");
    }
  }, true);

  const origFetch = window.fetch;
  if (typeof origFetch === "function") {
    window.fetch = async function(...args) {
      const res = await origFetch.apply(this, args);
      try {
        const clone = res.clone();
        const ct = clone.headers.get("content-type") || "";
        if (ct.includes("application/json")) {
          const data = await clone.json();
          const hpVal = Number(data?.boss_hp ?? data?.hp ?? data?.enemy_hp ?? NaN);
          const dmgVal = data?.damage ?? data?.dmg ?? "";
          if ((!Number.isNaN(hpVal) && hpVal <= 0) || data?.killed === true || data?.dead === true) {
            shatterEnemyOnBridge();
          } else if (dmgVal !== "") {
            triggerHitFeedback(0, 0, dmgVal);
          }
        }
      } catch (_) {}
      return res;
    };
  }

  window.RPG_FX = { hit: triggerHitFeedback, shatter: shatterEnemyOnBridge, nextEnemy: pickDiverseEnemy };
})();
</script>
"""

if "</body>" in src:
    src = src.replace("</body>", fx_block + "\n</body>", 1)
else:
    src = src + "\nif __name__ == '__main__':\n    pass\n"

p.write_text(src, encoding="utf-8")
print("APPLIED_CLEAN")
