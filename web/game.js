(() => {
  const st = document.createElement("style");
  st.textContent = `
    html,body{height:100dvh;margin:0;padding:6px 7px;box-sizing:border-box;overflow:hidden;display:flex;flex-direction:column;gap:6px}
    body>*:not(#top-event-bar):not(#arena-box):not(#bottom-hud-dock){display:none!important}
    #top-event-bar{flex:0 0 auto;min-height:54px;padding:6px 12px 8px;border-radius:10px;background:#18181b;border:1px solid #3f3f46;color:#f3f4f6;display:block;overflow:hidden;box-sizing:border-box}
    #top-event-bar #log{display:block!important;margin:14px 0 0 0!important;padding:0!important;background:none!important;border:none!important;font-size:11px!important;line-height:1.3!important;width:100%;white-space:normal;word-break:break-word;overflow:visible}
    #arena-box{flex:1 1 auto;min-height:165px;margin:0!important;border-radius:12px;position:relative;overflow:hidden;border:1px solid #38bdf8;background:linear-gradient(180deg,#075985 0%,#0284c7 48%,#7dd3fc 84%,#e0f2fe 100%)}
    #webgl-3d-canvas{position:absolute;inset:0;width:100%;height:100%;display:block;z-index:1}
    .hud-tag{position:absolute;left:50%;transform:translateX(-50%);font-size:10px;font-weight:700;color:#f8fafc;background:rgba(15,23,42,.84);border:1px solid rgba(148,163,184,.38);padding:1px 7px;border-radius:999px;white-space:nowrap;pointer-events:none;z-index:3}
    .boss-tag{top:6%;font-size:9px;padding:1px 6px;border-color:rgba(248,113,113,.6);color:#fecaca}
    .hero-tag{bottom:4%;border-color:rgba(125,211,252,.6);color:#e0f2fe}

    .gear-strip{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:3px;margin-top:2px}
    .gear-slot-btn{background:#1f2937!important;border:1px solid #374151!important;color:#e5e7eb!important;font-size:9.5px!important;height:24px!important;min-height:24px!important;padding:2px 4px!important;border-radius:6px!important;display:flex!important;align-items:center!important;justify-content:center!important;gap:2px;cursor:pointer}
    .gear-slot-btn.equipped{border-color:#ef4444!important;background:rgba(185,28,28,.45)!important;color:#fecaca!important;font-weight:700!important}

    #bottom-hud-dock{flex:0 0 auto;display:flex;flex-direction:column;gap:5px;background:#111827;border:1px solid #334155;border-radius:12px;padding:6px 7px;z-index:5}
    .moved-stats{display:flex;flex-direction:column;gap:4px;font-size:11px;color:#e5e7eb}
    .stats-top-row{display:flex;justify-content:space-between;align-items:center;gap:6px;font-weight:700}
    .stats-sub-row{display:flex;justify-content:space-between;align-items:center;gap:6px;font-size:10px;color:#cbd5e1}
    .mini-hp-track{width:100%;height:5px;border-radius:999px;background:#1f2937;overflow:hidden}
    .mini-hp-fill{height:100%;background:#22c55e;transition:width .2s}
    .mini-boss-fill{height:100%;background:#ef4444;transition:width .2s}
    #bottom-hud-dock .btns-grid,#bottom-hud-dock > div:last-child{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:4px!important}
    #bottom-hud-dock button,#bottom-hud-dock a{padding:5px 6px!important;min-height:28px!important;height:28px!important;font-size:11px!important;line-height:1.1!important;border-radius:8px!important;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:flex!important;align-items:center!important;justify-content:center!important}
    #btn-raid{grid-column:1 / -1!important}

    @keyframes hitPop3p{0%{opacity:1;transform:translate(-50%,0) scale(.9)}100%{opacity:0;transform:translate(-50%,-24px) scale(1.2)}}
    .dmg-3p{position:absolute;left:50%;top:18%;font-weight:900;font-size:16px;text-shadow:0 2px 8px rgba(0,0,0,.95);pointer-events:none;z-index:6;animation:hitPop3p .75s ease forwards}
  `;
  document.head.appendChild(st);

  const TERRARIA_LADDER = [
    { name: "Зелёный Слизень", tier: "Ранг 1 • Лес", rgb: [0.13, 0.77, 0.37], accent: [0.53, 0.94, 0.67], shape: "slime", hpMult: 1.0 },
    { name: "Синий Слизень", tier: "Ранг 2 • Лес", rgb: [0.23, 0.51, 0.96], accent: [0.58, 0.77, 0.99], shape: "slime", hpMult: 1.25 },
    { name: "Зомби", tier: "Ранг 3 • Ночь", rgb: [0.40, 0.64, 0.05], accent: [0.75, 0.95, 0.40], shape: "humanoid", hpMult: 1.5 },
    { name: "Демонический Глаз", tier: "Ранг 4 • Ночь", rgb: [0.95, 0.96, 0.98], accent: [0.94, 0.27, 0.27], shape: "eye", hpMult: 1.8 },
    { name: "Скелет", tier: "Ранг 5 • Подземелье", rgb: [0.89, 0.91, 0.94], accent: [0.98, 0.98, 0.99], shape: "humanoid", hpMult: 2.1 },
    { name: "Пожиратель Душ", tier: "Ранг 6 • Искажение", rgb: [0.49, 0.13, 0.81], accent: [0.85, 0.71, 0.99], shape: "wyrm", hpMult: 2.4 },
    { name: "Кровавый Ползун", tier: "Ранг 7 • Багрянец", rgb: [0.75, 0.07, 0.24], accent: [0.99, 0.64, 0.69], shape: "humanoid", hpMult: 2.75 },
    { name: "Тёмный Заклинатель", tier: "Ранг 8 • Подземелье", rgb: [0.26, 0.22, 0.79], accent: [0.65, 0.71, 0.99], shape: "humanoid", hpMult: 3.1 },
    { name: "Бронированный Скелет", tier: "Ранг 9 • Подземелье", rgb: [0.58, 0.64, 0.72], accent: [0.89, 0.91, 0.94], shape: "humanoid", hpMult: 3.5 },
    { name: "Кровавый Страж", tier: "Ранг 10 • Багрянец", rgb: [0.60, 0.11, 0.11], accent: [0.97, 0.44, 0.44], shape: "humanoid", hpMult: 4.0 },
    { name: "Огненный Имп", tier: "Ранг 11 • Преисподняя", rgb: [0.92, 0.35, 0.05], accent: [0.99, 0.73, 0.45], shape: "humanoid", hpMult: 4.5 },
    { name: "Виверна", tier: "Ранг 12 • Небеса", rgb: [0.01, 0.52, 0.78], accent: [0.49, 0.83, 0.99], shape: "wyrm", hpMult: 5.1 },
    { name: "Скелетрон", tier: "Ранг 13 • Босс Данжа", rgb: [0.80, 0.84, 0.89], accent: [0.99, 0.88, 0.28], shape: "humanoid", hpMult: 5.8 },
    { name: "Стена Плоти", tier: "Ранг 14 • Преисподняя", rgb: [0.62, 0.07, 0.25], accent: [0.98, 0.44, 0.53], shape: "eye", hpMult: 6.6 },
    { name: "Лунный Владыка", tier: "Ранг 15 • Финал", rgb: [0.06, 0.46, 0.44], accent: [0.37, 0.92, 0.83], shape: "humanoid", hpMult: 7.5 }
  ];

  function getMobForRank(rankIdx) {
    const idx = Math.max(0, Number(rankIdx || 0));
    if (idx < TERRARIA_LADDER.length) {
      return { ...TERRARIA_LADDER[idx], rankNum: idx + 1 };
    }
    const extra = idx - (TERRARIA_LADDER.length - 1);
    const base = TERRARIA_LADDER[TERRARIA_LADDER.length - 1];
    return {
      ...base,
      name: `${base.name} +${extra}`,
      tier: `Ранг ${idx + 1} • Кошмар`,
      rankNum: idx + 1,
      hpMult: +(base.hpMult + extra * 1.1).toFixed(2)
    };
  }

  const REAPER_SLOTS = [
    { key: "head", slotLabel: "Голова", short: "Гол", name: "Корона жнеца душ" },
    { key: "arms", slotLabel: "Руки", short: "Рук", name: "Наплечники жнеца душ" },
    { key: "legs", slotLabel: "Ноги", short: "Ног", name: "Ботинки жнеца душ" },
    { key: "torso", slotLabel: "Тело", short: "Тел", name: "Нагрудник жнеца душ" }
  ];

  const STORAGE_KEY = "reaper_set_state_3d_v9";
  function loadGearState() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      const hasSavedItems = raw && typeof raw.items === "object" && raw.items !== null;
      const items = {};
      for (const s of REAPER_SLOTS) {
        const savedItem = raw.items?.[s.key];
        items[s.key] = {
          equipped: hasSavedItems ? (savedItem?.equipped !== false) : true,
          kills: Number(savedItem?.kills || 0)
        };
      }
      return {
        items,
        bossKills: Number(raw.bossKills || 0),
        mobRank: Number(raw.mobRank || 0),
        lastBossHp: raw.lastBossHp ?? null
      };
    } catch {
      return {
        items: {
          head: { equipped: true, kills: 0 },
          arms: { equipped: true, kills: 0 },
          legs: { equipped: true, kills: 0 },
          torso: { equipped: true, kills: 0 }
        },
        bossKills: 0,
        mobRank: 0,
        lastBossHp: null
      };
    }
  }

  const gearState = loadGearState();
  function saveGearState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(gearState)); } catch {}
  }

  function getTotalBossKills() {
    return Number(gearState.bossKills || 0);
  }

  function getCritBonusPct() {
    return getTotalBossKills() * 10;
  }

  function getSetBonusPct() {
    let totalPct = 0;
    for (const s of REAPER_SLOTS) {
      const it = gearState.items[s.key];
      if (it?.equipped) totalPct += Number(it.kills || 0) * 10;
    }
    return totalPct;
  }

  function calcBoosted(baseVal) {
    const num = Number(baseVal || 0);
    const totalMult = 1 + (getSetBonusPct() + getCritBonusPct()) / 100;
    return Math.round(num * totalMult);
  }

  function applyReaperVisuals() {
    for (const s of REAPER_SLOTS) {
      const btn = document.getElementById("slot-" + s.key);
      const it = gearState.items[s.key];
      if (!btn || !it) continue;
      btn.classList.toggle("equipped", it.equipped);
      const bonus = it.kills * 10;
      btn.textContent = `${s.short}. ${it.equipped ? "+" + bonus + "%" : "снято"}`;
      btn.title = `${s.name} (${s.slotLabel}): ${it.equipped ? "надето" : "снято"}, убийств: ${it.kills} (+${bonus}% урона)`;
    }
    const bonusEl = document.getElementById("reaper-bonus-val");
    if (bonusEl) {
      bonusEl.textContent = `+${getSetBonusPct()}% • Крит +${getCritBonusPct()}% (${getTotalBossKills()} уб.)`;
    }
  }

  const logEl = document.getElementById("log") || (() => {
    const el = document.createElement("div");
    el.id = "log";
    return el;
  })();

  const topBar = document.createElement("div");
  topBar.id = "top-event-bar";
  topBar.appendChild(logEl);

  const arena = document.createElement("div");
  arena.id = "arena-box";
  arena.innerHTML = `
    <canvas id="webgl-3d-canvas"></canvas>
    <div id="ar-enemy-name" class="hud-tag boss-tag">Зелёный Слизень • Ранг 1</div>
    <div id="ar-hero-name" class="hud-tag hero-tag">Player • 100/100 HP</div>
  `;

  const bottomDock = document.createElement("div");
  bottomDock.id = "bottom-hud-dock";

  const statsBox = document.createElement("div");
  statsBox.className = "moved-stats";
  statsBox.innerHTML = `
    <div class="stats-top-row">
      <span id="hero-name">Player</span>
      <span id="hero-lvl">Lv.1 • 0/100 EXP</span>
      <span id="hero-gold">0 gold</span>
    </div>
    <div class="stats-sub-row">
      <span>HP: <strong id="hero-hp-text">100/100</strong></span>
      <span>Атака: <strong id="hero-atk">14</strong></span>
      <span>Босс: <strong id="hero-bdmg">0</strong></span>
      <span style="color:#fca5a5">Сет/Крит: <strong id="reaper-bonus-val">+0% • Крит +0% (0 уб.)</strong></span>
    </div>
    <div class="mini-hp-track"><div id="hero-hp-bar" class="mini-hp-fill" style="width:100%"></div></div>
    <div class="gear-strip">
      <button type="button" id="slot-head" class="gear-slot-btn equipped">Гол. +0%</button>
      <button type="button" id="slot-arms" class="gear-slot-btn equipped">Рук. +0%</button>
      <button type="button" id="slot-legs" class="gear-slot-btn equipped">Ног. +0%</button>
      <button type="button" id="slot-torso" class="gear-slot-btn equipped">Тел. +0%</button>
    </div>
    <div class="stats-sub-row">
      <span id="boss-title">Зелёный Слизень (Ранг 1 • Лес)</span>
      <span id="boss-hp-text">0/0</span>
    </div>
    <div class="mini-hp-track"><div id="boss-hp-bar" class="mini-boss-fill" style="width:0%"></div></div>
  `;

  const btnsBox = document.createElement("div");
  btnsBox.className = "btns-grid";
  ["btn-raid", "btn-hunt", "btn-atk", "btn-heal", "btn-support"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) btnsBox.appendChild(el);
  });

  bottomDock.appendChild(statsBox);
  bottomDock.appendChild(btnsBox);

  document.body.prepend(bottomDock);
  document.body.prepend(arena);
  document.body.prepend(topBar);

  // --- Лёгкий 3D WebGL движок ---
  const canvas3d = document.getElementById("webgl-3d-canvas");
  const gl = canvas3d.getContext("webgl", { antialias: true, alpha: true });

  const mat4 = {
    identity() {
      return [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];
    },
    multiply(a, b) {
      const out = new Array(16);
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
          out[i*4+j] = a[j]*b[i*4] + a[4+j]*b[i*4+1] + a[8+j]*b[i*4+2] + a[12+j]*b[i*4+3];
        }
      }
      return out;
    },
    translate(m, x, y, z) {
      return mat4.multiply(m, [1,0,0,0, 0,1,0,0, 0,0,1,0, x,y,z,1]);
    },
    scale(m, x, y, z) {
      return mat4.multiply(m, [x,0,0,0, 0,y,0,0, 0,0,z,0, 0,0,0,1]);
    },
    rotateX(m, rad) {
      const c = Math.cos(rad), s = Math.sin(rad);
      return mat4.multiply(m, [1,0,0,0, 0,c,s,0, 0,-s,c,0, 0,0,0,1]);
    },
    rotateY(m, rad) {
      const c = Math.cos(rad), s = Math.sin(rad);
      return mat4.multiply(m, [c,0,-s,0, 0,1,0,0, s,0,c,0, 0,0,0,1]);
    },
    rotateZ(m, rad) {
      const c = Math.cos(rad), s = Math.sin(rad);
      return mat4.multiply(m, [c,s,0,0, -s,c,0,0, 0,0,1,0, 0,0,0,1]);
    },
    perspective(fovy, aspect, near, far) {
      const f = 1 / Math.tan(fovy / 2);
      const nf = 1 / (near - far);
      return [
        f/aspect, 0, 0, 0,
        0, f, 0, 0,
        0, 0, (far+near)*nf, -1,
        0, 0, 2*far*near*nf, 0
      ];
    },
    lookAt(eye, center, up) {
      const zx = eye[0]-center[0], zy = eye[1]-center[1], zz = eye[2]-center[2];
      let zlen = Math.hypot(zx, zy, zz) || 1;
      const fx = zx/zlen, fy = zy/zlen, fz = zz/zlen;
      let xx = up[1]*fz - up[2]*fy, xy = up[2]*fx - up[0]*fz, xz = up[0]*fy - up[1]*fx;
      const xlen = Math.hypot(xx, xy, xz) || 1;
      xx /= xlen; xy /= xlen; xz /= xlen;
      const yx = fy*xz - fz*xy, yy = fz*xx - fx*xz, yz = fx*xy - fy*xx;
      return [
        xx, yx, fx, 0,
        xy, yy, fy, 0,
        xz, yz, fz, 0,
        -(xx*eye[0]+xy*eye[1]+xz*eye[2]),
        -(yx*eye[0]+yy*eye[1]+yz*eye[2]),
        -(fx*eye[0]+fy*eye[1]+fz*eye[2]),
        1
      ];
    }
  };

  function createCubeMesh() {
    const p = [
      -0.5,-0.5, 0.5,  0.5,-0.5, 0.5,  0.5, 0.5, 0.5, -0.5,-0.5, 0.5,  0.5, 0.5, 0.5, -0.5, 0.5, 0.5,
      -0.5,-0.5,-0.5, -0.5, 0.5,-0.5,  0.5, 0.5,-0.5, -0.5,-0.5,-0.5,  0.5, 0.5,-0.5,  0.5,-0.5,-0.5,
      -0.5, 0.5,-0.5, -0.5, 0.5, 0.5,  0.5, 0.5, 0.5, -0.5, 0.5,-0.5,  0.5, 0.5, 0.5,  0.5, 0.5,-0.5,
      -0.5,-0.5,-0.5,  0.5,-0.5,-0.5,  0.5,-0.5, 0.5, -0.5,-0.5,-0.5,  0.5,-0.5, 0.5, -0.5,-0.5, 0.5,
       0.5,-0.5,-0.5,  0.5, 0.5,-0.5,  0.5, 0.5, 0.5,  0.5,-0.5,-0.5,  0.5, 0.5, 0.5,  0.5,-0.5, 0.5,
      -0.5,-0.5,-0.5, -0.5,-0.5, 0.5, -0.5, 0.5, 0.5, -0.5,-0.5,-0.5, -0.5, 0.5, 0.5, -0.5, 0.5,-0.5
    ];
    const n = [
       0,0,1,  0,0,1,  0,0,1,  0,0,1,  0,0,1,  0,0,1,
       0,0,-1, 0,0,-1, 0,0,-1, 0,0,-1, 0,0,-1, 0,0,-1,
       0,1,0,  0,1,0,  0,1,0,  0,1,0,  0,1,0,  0,1,0,
       0,-1,0, 0,-1,0, 0,-1,0, 0,-1,0, 0,-1,0, 0,-1,0,
       1,0,0,  1,0,0,  1,0,0,  1,0,0,  1,0,0,  1,0,0,
      -1,0,0, -1,0,0, -1,0,0, -1,0,0, -1,0,0, -1,0,0
    ];
    return { pos: new Float32Array(p), norm: new Float32Array(n), count: p.length / 3 };
  }

  let glReady = false, prog, aPos, aNorm, uMvp, uModel, uColor, posBuf, normBuf, cubeCount = 0;
  if (gl) {
    const vsSrc = `
      attribute vec3 aPos;
      attribute vec3 aNorm;
      uniform mat4 uMvp;
      uniform mat4 uModel;
      varying vec3 vNormal;
      void main() {
        vNormal = normalize(mat3(uModel) * aNorm);
        gl_Position = uMvp * vec4(aPos, 1.0);
      }
    `;
    const fsSrc = `
      precision mediump float;
      uniform vec4 uColor;
      varying vec3 vNormal;
      void main() {
        vec3 lightDir = normalize(vec3(0.45, 0.85, 0.6));
        float diff = max(dot(normalize(vNormal), lightDir), 0.0);
        float shade = 0.48 + diff * 0.58;
        gl_FragColor = vec4(uColor.rgb * shade, uColor.a);
      }
    `;
    function compile(type, src) {
      const sh = gl.createShader(type);
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      return sh;
    }
    prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, vsSrc));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, fsSrc));
    gl.linkProgram(prog);
    if (gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      aPos = gl.getAttribLocation(prog, "aPos");
      aNorm = gl.getAttribLocation(prog, "aNorm");
      uMvp = gl.getUniformLocation(prog, "uMvp");
      uModel = gl.getUniformLocation(prog, "uModel");
      uColor = gl.getUniformLocation(prog, "uColor");
      const mesh = createCubeMesh();
      cubeCount = mesh.count;
      posBuf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
      gl.bufferData(gl.ARRAY_BUFFER, mesh.pos, gl.STATIC_DRAW);
      normBuf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, normBuf);
      gl.bufferData(gl.ARRAY_BUFFER, mesh.norm, gl.STATIC_DRAW);
      glReady = true;
    }
  }

  const BRIDGE_HALF_WIDTH = 2.45;
  function bridgeHalfWidthAt() {
    return BRIDGE_HALF_WIDTH;
  }
  function bridgeSurfaceY() {
    return 0.08;
  }

  const sceneState = {
    heroLevel: 1,
    attackStart: 0,
    attackDuration: 820,
    hurtUntil: 0,
    bleedUntil: 0,
    quakeUntil: 0,
    deathStart: 0,
    fallDuration: 850,
    pauseAfterFall: 320,
    dyingMob: null,
    spawnScaleInStart: 0,
    spawnScaleInDuration: 320,
    pendingHudMob: null,
    hitTimerId: null,
    drops: []
  };

  function clearDeathState() {
    sceneState.dyingMob = null;
    sceneState.deathStart = 0;
    sceneState.pendingHudMob = null;
  }

  function applyEnemyHud(mob) {
    if (!mob) return;
    const arEnemy = document.getElementById("ar-enemy-name");
    if (arEnemy) arEnemy.textContent = `${mob.name} • Ранг ${mob.rankNum}`;
  }

  function resize3d() {
    if (!canvas3d) return;
    const r = arena.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.max(1, Math.floor(r.width * dpr));
    const h = Math.max(1, Math.floor(r.height * dpr));
    if (canvas3d.width !== w || canvas3d.height !== h) {
      canvas3d.width = w;
      canvas3d.height = h;
    }
    if (gl) gl.viewport(0, 0, w, h);
  }
  resize3d();
  window.addEventListener("resize", resize3d);

  function spawn3dBlood(count = 10, targetX = 0.0, targetZ = -3.85) {
    const now = performance.now();
    sceneState.bleedUntil = now + 450;
    for (let i = 0; i < count; i++) {
      sceneState.drops.push({
        x: targetX + (Math.random() - 0.5) * 0.65,
        y: 1.55 + Math.random() * 0.45,
        z: targetZ + (Math.random() - 0.5) * 0.55,
        vx: (Math.random() - 0.5) * 0.055,
        vy: 0.02 + Math.random() * 0.035,
        vz: (Math.random() - 0.5) * 0.055,
        life: 0,
        maxLife: 28 + Math.floor(Math.random() * 14)
      });
    }
  }

  function drawBossArchetype(drawBox, mob, bossBase, isBleedingNow, t) {
    const col = isBleedingNow ? [0.95, 0.12, 0.12, 1] : [...mob.rgb, 1];
    const acc = [...mob.accent, 1];
    const dark = [0.08, 0.10, 0.16, 1];

    if (mob.shape === "slime") {
      const squash = 1 + Math.sin(t * 5) * 0.06;
      drawBox(mat4.scale(mat4.translate(bossBase, 0, 0.36, 0), 1.08 * squash, 0.72 / squash, 0.98), col);
      drawBox(mat4.scale(mat4.translate(bossBase, -0.18, 0.58, 0.20), 0.28, 0.18, 0.28), acc);
      drawBox(mat4.scale(mat4.translate(bossBase, -0.22, 0.38, 0.50), 0.12, 0.14, 0.06), dark);
      drawBox(mat4.scale(mat4.translate(bossBase,  0.22, 0.38, 0.50), 0.12, 0.14, 0.06), dark);
      return;
    }

    if (mob.shape === "eye") {
      const hover = 0.72 + Math.sin(t * 3.6) * 0.10;
      const eyeRoot = mat4.translate(bossBase, 0, hover, 0);
      drawBox(mat4.scale(eyeRoot, 0.92, 0.92, 0.92), isBleedingNow ? [0.95, 0.12, 0.12, 1] : [0.96, 0.97, 0.99, 1]);
      drawBox(mat4.scale(mat4.translate(eyeRoot, 0, 0, 0.48), 0.42, 0.42, 0.08), acc);
      drawBox(mat4.scale(mat4.translate(eyeRoot, 0, 0, 0.52), 0.18, 0.18, 0.08), [0.55, 0.05, 0.08, 1]);
      drawBox(mat4.scale(mat4.translate(eyeRoot, -0.58, -0.20, -0.12), 0.15, 0.58, 0.15), acc);
      drawBox(mat4.scale(mat4.translate(eyeRoot,  0.58, -0.20, -0.12), 0.15, 0.58, 0.15), acc);
      return;
    }

    if (mob.shape === "wyrm") {
      drawBox(mat4.scale(mat4.translate(bossBase, -0.28, 0.24, 0.36), 0.46, 0.42, 0.46), acc);
      drawBox(mat4.scale(mat4.translate(bossBase,  0.00, 0.46, 0.12), 0.64, 0.52, 0.64), col);
      drawBox(mat4.scale(mat4.translate(bossBase,  0.22, 0.76, -0.12), 0.78, 0.62, 0.74), col);
      drawBox(mat4.scale(mat4.translate(bossBase,  0.02, 1.12, -0.12), 0.14, 0.30, 0.14), acc);
      drawBox(mat4.scale(mat4.translate(bossBase,  0.42, 1.12, -0.12), 0.14, 0.30, 0.14), acc);
      return;
    }

    const step = Math.sin(t * 4.2) * 0.22;
    const legL = mat4.rotateX(mat4.translate(bossBase, -0.19, 0.46, 0), step);
    drawBox(mat4.scale(mat4.translate(legL, 0, -0.23, 0), 0.20, 0.46, 0.20), dark);

    const legR = mat4.rotateX(mat4.translate(bossBase,  0.19, 0.46, 0), -step);
    drawBox(mat4.scale(mat4.translate(legR, 0, -0.23, 0), 0.20, 0.46, 0.20), dark);

    const torso = mat4.translate(bossBase, 0, 0.74, 0);
    drawBox(mat4.scale(torso, 0.52, 0.54, 0.28), col);
    drawBox(mat4.scale(mat4.translate(torso, 0, 0.02, 0.16), 0.18, 0.22, 0.05), acc);

    const armL = mat4.rotateX(mat4.translate(torso, -0.35, 0.18, 0), -step * 1.1);
    drawBox(mat4.scale(mat4.translate(armL, 0, -0.22, 0), 0.17, 0.44, 0.17), col);
    drawBox(mat4.scale(mat4.translate(armL, -0.02, 0.03, 0), 0.22, 0.16, 0.22), acc);

    const armR = mat4.rotateX(mat4.translate(torso,  0.35, 0.18, 0), step * 1.1);
    drawBox(mat4.scale(mat4.translate(armR, 0, -0.22, 0), 0.17, 0.44, 0.17), col);
    drawBox(mat4.scale(mat4.translate(armR,  0.02, 0.03, 0), 0.22, 0.16, 0.22), acc);

    const head = mat4.rotateY(mat4.translate(torso, 0, 0.48, 0), Math.sin(t * 2.4) * 0.08);
    drawBox(mat4.scale(head, 0.42, 0.42, 0.42), acc);
    drawBox(mat4.scale(mat4.translate(head, -0.11, 0.02, 0.22), 0.08, 0.08, 0.04), dark);
    drawBox(mat4.scale(mat4.translate(head,  0.11, 0.02, 0.22), 0.08, 0.08, 0.04), dark);
    if (mob.rankNum >= 8) {
      drawBox(mat4.scale(mat4.translate(head, -0.24, 0.26, 0), 0.10, 0.22, 0.10), acc);
      drawBox(mat4.scale(mat4.translate(head,  0.24, 0.26, 0), 0.10, 0.22, 0.10), acc);
    }
  }

  function renderFrame3d(now) {
    requestAnimationFrame(renderFrame3d);
    if (!glReady) return;
    resize3d();

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(prog);

    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, normBuf);
    gl.enableVertexAttribArray(aNorm);
    gl.vertexAttribPointer(aNorm, 3, gl.FLOAT, false, 0, 0);

    const aspect = canvas3d.width / Math.max(1, canvas3d.height);
    const proj = mat4.perspective(0.92, aspect, 0.1, 70);

    let qx = 0, qy = 0;
    if (now < sceneState.quakeUntil) {
      qx = (Math.random() - 0.5) * 0.08;
      qy = (Math.random() - 0.5) * 0.08;
    }
    const view = mat4.lookAt([-2.65 + qx, 3.95 + qy, 6.5], [0.0, 1.25, -1.9], [0, 1, 0]);
    const vp = mat4.multiply(proj, view);

    function drawBox(m, color) {
      const mvp = mat4.multiply(vp, m);
      gl.uniformMatrix4fv(uMvp, false, mvp);
      gl.uniformMatrix4fv(uModel, false, m);
      gl.uniform4f(uColor, color[0], color[1], color[2], color[3] ?? 1.0);
      gl.drawArrays(gl.TRIANGLES, 0, cubeCount);
    }

    const t = now * 0.001;

    // 3D облака в небе
    const cloudDrift = Math.sin(t * 0.65) * 0.65;
    drawBox(mat4.scale(mat4.translate(mat4.identity(), -3.8 + cloudDrift, 3.3, -9.5), 2.3, 0.65, 1.2), [0.96, 0.99, 1.0, 0.72]);
    drawBox(mat4.scale(mat4.translate(mat4.identity(), 3.8 - cloudDrift, 3.5, -10.5), 2.5, 0.7, 1.3), [0.96, 0.99, 1.0, 0.72]);

    // Сплошной широкий 3D мост без пустот
    const fullWidth = BRIDGE_HALF_WIDTH * 2;
    drawBox(mat4.scale(mat4.translate(mat4.identity(), 0, -0.04, -1.4), fullWidth + 0.25, 0.18, 6.8), [0.42, 0.18, 0.02, 1]);
    const planks = 12;
    for (let i = 0; i < planks; i++) {
      const pFrac = i / (planks - 1);
      const pz = 1.75 - pFrac * 6.3;
      const woodCol = i % 2 === 0 ? [0.71, 0.33, 0.04, 1] : [0.57, 0.25, 0.03, 1];
      drawBox(mat4.scale(mat4.translate(mat4.identity(), 0, 0.03, pz), fullWidth, 0.12, 0.54), woodCol);
      drawBox(mat4.scale(mat4.translate(mat4.identity(), -BRIDGE_HALF_WIDTH, 0.36, pz), 0.12, 0.56, 0.12), [0.99, 0.90, 0.54, 1]);
      drawBox(mat4.scale(mat4.translate(mat4.identity(),  BRIDGE_HALF_WIDTH, 0.36, pz), 0.12, 0.56, 0.12), [0.99, 0.90, 0.54, 1]);
    }
    drawBox(mat4.scale(mat4.translate(mat4.identity(), -BRIDGE_HALF_WIDTH, 0.62, -1.4), 0.09, 0.09, 6.5), [0.99, 0.90, 0.54, 1]);
    drawBox(mat4.scale(mat4.translate(mat4.identity(),  BRIDGE_HALF_WIDTH, 0.62, -1.4), 0.09, 0.09, 6.5), [0.99, 0.90, 0.54, 1]);

    // Анимация атаки героя на поверхности моста
    let heroX = -0.35, heroZ = 1.35, jumpOffset = 0, heroScale = 0.92;
    let legLRot = Math.sin(t * 5.2) * 0.12;
    let legRRot = -Math.sin(t * 5.2) * 0.12;
    let armLRot = Math.sin(t * 5.2) * 0.16;
    let armRRot = -Math.sin(t * 5.2) * 0.16;
    let armRSwing = 0;
    let torsoPitch = 0;

    if (now - sceneState.attackStart < sceneState.attackDuration) {
      const k = (now - sceneState.attackStart) / sceneState.attackDuration;
      if (k < 0.20) {
        const u = k / 0.20;
        legLRot = -Math.sin(u * Math.PI) * 0.65;
        heroZ = 1.35 - u * 0.35;
      } else if (k < 0.36) {
        const u = (k - 0.20) / 0.16;
        legRRot = -Math.sin(u * Math.PI) * 0.68;
        heroZ = 1.00 - u * 0.45;
      } else if (k < 0.72) {
        const u = (k - 0.36) / 0.36;
        const arc = Math.sin(u * Math.PI);
        heroX = -0.35 + u * 0.35;
        heroZ = 0.55 - u * 4.40;
        jumpOffset = arc * 1.25;
        heroScale = 0.92 - u * 0.16;
        legLRot = -0.55 * arc;
        legRRot = -0.45 * arc;
        torsoPitch = -0.25 * arc;
        armRSwing = -Math.sin(u * Math.PI) * 1.35;
      } else {
        const u = (k - 0.72) / 0.28;
        heroX = 0.0 - u * 0.35;
        heroZ = -3.85 + u * 5.20;
        jumpOffset = Math.sin(u * Math.PI) * 0.14;
        heroScale = 0.76 + u * 0.16;
      }
    }

    const maxHeroX = Math.max(0.25, bridgeHalfWidthAt() - 0.45);
    heroX = Math.max(-maxHeroX, Math.min(maxHeroX, heroX));
    const heroGroundY = bridgeSurfaceY() + jumpOffset;

    const eqHead = gearState.items.head.equipped;
    const eqArms = gearState.items.arms.equipped;
    const eqLegs = gearState.items.legs.equipped;
    const eqTorso = gearState.items.torso.equipped;
    const reaperRed = [0.94, 0.24, 0.24, 1];
    const reaperGold = [0.99, 0.88, 0.28, 1];

    const heroBase = mat4.scale(
      mat4.rotateY(mat4.translate(mat4.identity(), heroX, heroGroundY, heroZ), 0.22),
      heroScale, heroScale, heroScale
    );

    const legLMat = mat4.rotateX(mat4.translate(heroBase, -0.21, 0.48, 0), legLRot);
    drawBox(mat4.scale(mat4.translate(legLMat, 0, -0.24, 0), 0.22, 0.48, 0.22), [0.12, 0.24, 0.55, 1]);
    if (eqLegs) {
      drawBox(mat4.scale(mat4.translate(legLMat, 0, -0.38, 0.02), 0.27, 0.22, 0.28), reaperRed);
    }

    const legRMat = mat4.rotateX(mat4.translate(heroBase, 0.21, 0.48, 0), legRRot);
    drawBox(mat4.scale(mat4.translate(legRMat, 0, -0.24, 0), 0.22, 0.48, 0.22), [0.15, 0.32, 0.75, 1]);
    if (eqLegs) {
      drawBox(mat4.scale(mat4.translate(legRMat, 0, -0.38, 0.02), 0.27, 0.22, 0.28), reaperRed);
    }

    const torsoMat = mat4.rotateX(mat4.translate(heroBase, 0, 0.76, 0), torsoPitch);
    drawBox(mat4.scale(torsoMat, 0.52, 0.56, 0.28), [0.23, 0.51, 0.96, 1]);
    if (eqTorso) {
      drawBox(mat4.scale(mat4.translate(torsoMat, 0, 0.03, 0.02), 0.58, 0.52, 0.34), reaperRed);
      drawBox(mat4.scale(mat4.translate(torsoMat, 0, 0.02, 0.19), 0.16, 0.22, 0.05), reaperGold);
    }

    const armLMat = mat4.rotateX(mat4.translate(torsoMat, -0.36, 0.18, 0), armLRot);
    drawBox(mat4.scale(mat4.translate(armLMat, 0, -0.22, 0), 0.18, 0.44, 0.18), [0.15, 0.39, 0.92, 1]);
    if (eqArms) {
      drawBox(mat4.scale(mat4.translate(armLMat, -0.02, 0.02, 0), 0.25, 0.20, 0.25), reaperRed);
    }

    const armRMat = mat4.rotateX(mat4.translate(torsoMat, 0.36, 0.18, 0), armRRot + armRSwing);
    drawBox(mat4.scale(mat4.translate(armRMat, 0, -0.18, 0.10), 0.18, 0.18, 0.36), [0.15, 0.39, 0.92, 1]);
    if (eqArms) {
      drawBox(mat4.scale(mat4.translate(armRMat, 0.02, 0.02, 0), 0.25, 0.20, 0.25), reaperRed);
    }
    const scythePole = mat4.rotateX(mat4.translate(armRMat, 0.04, -0.05, 0.28), 0.28);
    drawBox(mat4.scale(mat4.translate(scythePole, 0, -0.25, 0), 0.06, 1.65, 0.06), [0.24, 0.07, 0.09, 1]);
    drawBox(mat4.scale(mat4.translate(scythePole, 0.26, 0.54, 0.06), 0.62, 0.13, 0.07), [0.95, 0.18, 0.22, 1]);
    drawBox(mat4.scale(mat4.translate(scythePole, 0.52, 0.44, 0.08), 0.16, 0.26, 0.06), reaperGold);

    const headMat = mat4.rotateY(mat4.translate(torsoMat, 0, 0.52, 0), Math.sin(t * 2.6) * 0.08);
    drawBox(mat4.scale(headMat, 0.44, 0.44, 0.44), [0.96, 0.62, 0.04, 1]);
    if (eqHead) {
      drawBox(mat4.scale(mat4.translate(headMat, 0, 0.27, 0), 0.48, 0.15, 0.48), reaperRed);
      drawBox(mat4.scale(mat4.translate(headMat, 0, 0.36, 0.15), 0.12, 0.14, 0.12), reaperGold);
    }

    const totalDeathCycle = sceneState.fallDuration + sceneState.pauseAfterFall;
    const deathElapsed = sceneState.dyingMob ? (now - sceneState.deathStart) : totalDeathCycle;
    const isFalling = Boolean(sceneState.dyingMob && deathElapsed < sceneState.fallDuration);
    const isPausedOnGround = Boolean(
      sceneState.dyingMob &&
      deathElapsed >= sceneState.fallDuration &&
      deathElapsed < totalDeathCycle
    );

    if (sceneState.dyingMob && deathElapsed >= totalDeathCycle) {
      const nextHud = sceneState.pendingHudMob;
      clearDeathState();
      sceneState.spawnScaleInStart = now;
      if (nextHud) applyEnemyHud(nextHud);
    }

    if (!isPausedOnGround) {
      const activeMob = isFalling ? sceneState.dyingMob : getMobForRank(gearState.mobRank);
      const bossZ = -3.85;
      const bossGroundY = bridgeSurfaceY();
      const levelGrowth = Math.min(0.45, Math.max(0, (sceneState.heroLevel - 1) * 0.004));
      const rankGrowth = Math.min(0.45, (activeMob.rankNum - 1) * 0.025);
      let bossScale = Math.min(1.55, 0.76 + levelGrowth + rankGrowth);

      if (!isFalling && sceneState.spawnScaleInStart > 0) {
        const sp = Math.min(1, (now - sceneState.spawnScaleInStart) / sceneState.spawnScaleInDuration);
        bossScale *= (0.20 + 0.80 * (1 - Math.pow(1 - sp, 2)));
        if (sp >= 1) sceneState.spawnScaleInStart = 0;
      }

      let bossJitterX = 0, bossRotZ = 0, bossFallRotX = 0, bossDropY = 0;
      if (now < sceneState.hurtUntil && !isFalling) {
        bossJitterX = Math.sin(now * 0.05) * 0.10;
        bossRotZ = Math.sin(now * 0.05) * 0.12;
      }
      if (isFalling) {
        const dk = Math.min(1, deathElapsed / sceneState.fallDuration);
        const easeBack = 1 - Math.pow(1 - dk, 2.2);
        bossFallRotX = -easeBack * 1.38;
        bossDropY = -easeBack * 0.24 * bossScale;
      }

      const finalBossX = bossJitterX;
      const isBleedingNow = now < sceneState.bleedUntil;

      const bossBase = mat4.scale(
        mat4.rotateX(
          mat4.rotateZ(
            mat4.translate(mat4.identity(), finalBossX, bossGroundY + bossDropY, bossZ),
            bossRotZ
          ),
          bossFallRotX
        ),
        bossScale, bossScale, bossScale
      );

      drawBossArchetype(drawBox, activeMob, bossBase, isBleedingNow, t);
    }

    // 3D капли крови при ударе
    for (let i = sceneState.drops.length - 1; i >= 0; i--) {
      const d = sceneState.drops[i];
      d.x += d.vx;
      d.y += d.vy;
      d.z += d.vz;
      d.vy -= 0.0032;
      d.life += 1;
      drawBox(mat4.scale(mat4.translate(mat4.identity(), d.x, d.y, d.z), 0.14, 0.18, 0.14), [0.88, 0.08, 0.10, 0.95]);
      if (d.life >= d.maxLife) sceneState.drops.splice(i, 1);
    }
  }
  requestAnimationFrame(renderFrame3d);

  for (const s of REAPER_SLOTS) {
    document.getElementById("slot-" + s.key)?.addEventListener("click", () => {
      const it = gearState.items[s.key];
      it.equipped = !it.equipped;
      saveGearState();
      applyReaperVisuals();
      const baseAtk = Number(document.getElementById("hero-atk")?.dataset.base || 14);
      const baseBdmg = Number(document.getElementById("hero-bdmg")?.dataset.base || 0);
      document.getElementById("hero-atk").textContent = `${baseAtk} (${calcBoosted(baseAtk)})`;
      document.getElementById("hero-bdmg").textContent = `${baseBdmg} (${calcBoosted(baseBdmg)})`;
      setLog(it.equipped
        ? `Надето: ${s.name} (${s.slotLabel}) — +${it.kills * 10}% урона`
        : `Снято: ${s.name} (${s.slotLabel})`);
    });
  }

  applyReaperVisuals();

  const tg = window.Telegram?.WebApp;
  if (tg) { tg.ready(); tg.expand(); }
  const u = tg?.initDataUnsafe?.user || {};
  const uid = u.id || 10001, uname = u.first_name || "Player";

  function setLog(t, err = false) {
    if (!logEl) return;
    logEl.textContent = t;
    logEl.style.color = err ? "#f87171" : "#f3f4f6";
  }

  function spawnHitText(txt, col) {
    const d = document.createElement("div");
    d.className = "dmg-3p";
    d.textContent = txt;
    d.style.color = col;
    arena.appendChild(d);
    setTimeout(() => d.remove(), 760);
  }

  function playBattle(kind, killedNow = false, slainMob = null, nextMob = null) {
    const now = performance.now();
    sceneState.attackStart = now;

    if (sceneState.hitTimerId) {
      clearTimeout(sceneState.hitTimerId);
      sceneState.hitTimerId = null;
    }

    // Если этот удар НЕ убил босса — сбрасываем любое прошлое состояние смерти
    if (!killedNow) {
      clearDeathState();
    }

    sceneState.hitTimerId = setTimeout(() => {
      sceneState.hitTimerId = null;
      const hitAt = performance.now();
      sceneState.hurtUntil = hitAt + 380;
      sceneState.quakeUntil = hitAt + 280;
      spawn3dBlood(kind === "boss" ? 12 : 7, 0.0, -3.85);

      if (killedNow && slainMob) {
        sceneState.dyingMob = slainMob;
        sceneState.deathStart = hitAt;
        sceneState.spawnScaleInStart = 0;
        sceneState.pendingHudMob = nextMob || getMobForRank(gearState.mobRank);
        applyEnemyHud(slainMob);
      } else {
        clearDeathState();
      }

      const baseVal = kind === "boss"
        ? Number(document.getElementById("hero-bdmg")?.dataset.base || 0)
        : Number(document.getElementById("hero-atk")?.dataset.base || 0);
      const finalDmg = baseVal > 0 ? calcBoosted(baseVal) : (kind === "boss" ? "HIT" : "ATK");
      spawnHitText("-" + finalDmg, kind === "boss" ? "#f87171" : "#fbbf24");
    }, 480);
  }

  function processBossKillIfNeeded(bossObj, didRaidHit) {
    if (!bossObj) {
      gearState.lastBossHp = null;
      saveGearState();
      return { killed: false, slainMob: null };
    }
    const curHp = Number(bossObj.hp ?? 0);
    const prevHp = gearState.lastBossHp;

    // Убийство происходит только при ударе по боссу, когда HP было > 0 и стало <= 0
    const zeroHpKill = Boolean(didRaidHit && prevHp !== null && prevHp > 0 && curHp <= 0);
    gearState.lastBossHp = curHp;

    if (zeroHpKill) {
      const slainMob = getMobForRank(gearState.mobRank);
      gearState.bossKills = Number(gearState.bossKills || 0) + 1;
      gearState.mobRank += 1;
      const equippedList = REAPER_SLOTS.filter((s) => gearState.items[s.key].equipped);
      const targets = equippedList.length > 0 ? equippedList : REAPER_SLOTS;
      for (const s of targets) {
        gearState.items[s.key].kills = Number(gearState.items[s.key].kills || 0) + 1;
      }
      saveGearState();
      applyReaperVisuals();
      return { killed: true, slainMob };
    }
    saveGearState();
    return { killed: false, slainMob: null };
  }

  function render(d, didRaidHit = false) {
    const { hero: h, boss: b, need_exp: ne, upgrade_cost: uc, support_url: su } = d;
    if (h && h.level) {
      sceneState.heroLevel = Number(h.level);
    }
    const { killed, slainMob } = processBossKillIfNeeded(b, didRaidHit);
    const activeMob = getMobForRank(gearState.mobRank);

    if (h) {
      const atkEl = document.getElementById("hero-atk");
      const bdmgEl = document.getElementById("hero-bdmg");
      if (atkEl) {
        atkEl.dataset.base = String(h.atk ?? 0);
        atkEl.textContent = `${h.atk} (${calcBoosted(h.atk)})`;
      }
      if (bdmgEl) {
        bdmgEl.dataset.base = String(h.boss_damage ?? 0);
        bdmgEl.textContent = `${h.boss_damage} (${calcBoosted(h.boss_damage)})`;
      }
      document.getElementById("hero-name").textContent = h.name;
      document.getElementById("hero-lvl").textContent = "Lv." + h.level + " • " + h.exp + "/" + ne + " EXP";
      document.getElementById("hero-gold").textContent = h.gold + " gold";
      document.getElementById("hero-hp-text").textContent = h.hp + "/" + h.max_hp;
      document.getElementById("hero-hp-bar").style.width = Math.max(0, Math.min(100, (h.hp / h.max_hp) * 100)) + "%";
      document.getElementById("ar-hero-name").textContent = h.name + " • " + h.hp + "/" + h.max_hp + " HP";
    }
    const upEl = document.getElementById("up-cost");
    if (upEl) upEl.textContent = uc;

    if (b) {
      const scaledMax = Math.max(1, Math.round(Number(b.max_hp || 100) * activeMob.hpMult));
      const scaledHp = Math.max(0, Math.min(scaledMax, Math.round(Number(b.hp || 0) * activeMob.hpMult)));
      document.getElementById("boss-title").textContent = `${activeMob.name} (${activeMob.tier})`;
      document.getElementById("boss-hp-text").textContent = `${scaledHp}/${scaledMax}`;
      const pct = Math.max(0, Math.min(100, (scaledHp / scaledMax) * 100));
      document.getElementById("boss-hp-bar").style.width = pct + "%";
      if (!killed && !sceneState.dyingMob && !sceneState.pendingHudMob) {
        applyEnemyHud(activeMob);
      }
    } else if (!killed && !sceneState.dyingMob && !sceneState.pendingHudMob) {
      applyEnemyHud(activeMob);
    }
    applyReaperVisuals();

    const sb = document.getElementById("btn-support");
    if (sb) {
      if (su) { sb.href = su; sb.style.opacity = "1"; }
      else { sb.style.opacity = "0.5"; }
    }
    return { killed, slainMob, activeMob };
  }

  async function callApi(ep, p = {}, kind = null) {
    try {
      const r = await fetch(ep, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: uid, name: uname, ...p })
      });
      const j = await r.json();
      if (!r.ok) { setLog(j.error || "Error", true); return; }
      const { killed, slainMob, activeMob } = render(j, kind === "boss");
      const bonusPct = getSetBonusPct();
      const critPct = getCritBonusPct();
      const killsTotal = getTotalBossKills();
      let msg = j.log || "";
      if (msg && (bonusPct > 0 || critPct > 0) && kind) {
        msg += ` [Сет: +${bonusPct}%, Крит: +${critPct}%, уб.: ${killsTotal}]`;
      }
      if (killed) {
        msg = (msg ? msg + " • " : "") + `Новый ранг: ${activeMob.name}! Крит +${critPct}%`;
      }
      if (msg) setLog(msg);
      if (kind) playBattle(kind, killed, slainMob, activeMob);
      tg?.HapticFeedback?.impactOccurred("light");
    } catch (e) {
      setLog("Net err: " + e.message, true);
    }
  }

  document.getElementById("btn-hunt")?.addEventListener("click", () => callApi("/api/hunt", {}, "hunt"));
  document.getElementById("btn-raid")?.addEventListener("click", () => callApi("/api/raid-hit", {}, "boss"));
  document.getElementById("btn-atk")?.addEventListener("click", () => callApi("/api/upgrade", { kind: "atk" }));
  document.getElementById("btn-heal")?.addEventListener("click", () => callApi("/api/upgrade", { kind: "heal" }));
  callApi("/api/state");
})();
