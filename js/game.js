/**
 * Cosmic Drift — Main Game Engine
 *
 * A neon-themed space arcade mini game built with vanilla Canvas API.
 *
 * @module game
 * @version 1.0.0
 * @license MIT
 */

(() => {
  'use strict';

  /* ══════════════════════════════════════
     CANVAS SETUP
     ══════════════════════════════════════ */
  const bgCanvas = document.getElementById('bg-canvas');
  const bgCtx = bgCanvas.getContext('2d');
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');

  let W, H;

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    bgCanvas.width = canvas.width = W;
    bgCanvas.height = canvas.height = H;
  }

  resize();
  window.addEventListener('resize', resize);

  /* ══════════════════════════════════════
     STARFIELD BACKGROUND
     ══════════════════════════════════════ */
  const stars = [];

  function initStars() {
    stars.length = 0;
    for (let i = 0; i < 200; i++) {
      stars.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 1.5 + 0.3,
        speed: Math.random() * 0.6 + 0.15,
        alpha: Math.random() * 0.6 + 0.2,
      });
    }
  }

  initStars();

  function updateStars() {
    for (const s of stars) {
      s.y += s.speed + (gameState === 'playing' ? 1.2 : 0);
      if (s.y > H) { s.y = -2; s.x = Math.random() * W; }
    }
  }

  function drawStars() {
    bgCtx.clearRect(0, 0, W, H);
    bgCtx.fillStyle = '#0a0a1a';
    bgCtx.fillRect(0, 0, W, H);
    for (const s of stars) {
      bgCtx.beginPath();
      bgCtx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      bgCtx.fillStyle = `rgba(200, 220, 255, ${s.alpha})`;
      bgCtx.fill();
    }
  }

  /* ══════════════════════════════════════
     GAME STATE
     ══════════════════════════════════════ */
  let gameState = 'start'; // start | playing | over
  let score = 0;
  let lives = 3;
  let level = 1;
  let spawnTimer = 0;
  let powerUpTimer = 0;
  let highScore = parseInt(localStorage.getItem('cosmicDriftHighScore') || '0', 10);
  let shieldActive = false;
  let shieldTimer = 0;
  let rapidFire = false;
  let rapidFireTimer = 0;
  let comboCount = 0;
  let comboTimer = 0;
  let invulnerable = false;
  let invulnTimer = 0;
  let screenShake = 0;

  /* ══════════════════════════════════════
     PLAYER SHIP
     ══════════════════════════════════════ */
  const player = {
    x: 0, y: 0,
    w: 36, h: 44,
    speed: 6.5,
    dx: 0,
    shootCooldown: 0,
    thrustParticles: [],
  };

  function resetPlayer() {
    player.x = W / 2;
    player.y = H - 100;
    player.dx = 0;
    player.shootCooldown = 0;
    player.thrustParticles = [];
  }

  function drawPlayer() {
    const { x, y, w, h } = player;
    const alpha = invulnerable ? (Math.sin(Date.now() * 0.02) * 0.4 + 0.6) : 1;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);

    // Ship glow
    const glowGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, 50);
    glowGrad.addColorStop(0, 'rgba(0, 240, 255, 0.12)');
    glowGrad.addColorStop(1, 'rgba(0, 240, 255, 0)');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 50, 0, Math.PI * 2);
    ctx.fill();

    // Ship body
    ctx.beginPath();
    ctx.moveTo(0, -h / 2);
    ctx.lineTo(-w / 2, h / 2);
    ctx.lineTo(-w / 4, h / 3);
    ctx.lineTo(0, h / 2.5);
    ctx.lineTo(w / 4, h / 3);
    ctx.lineTo(w / 2, h / 2);
    ctx.closePath();

    const bodyGrad = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
    bodyGrad.addColorStop(0, '#00f0ff');
    bodyGrad.addColorStop(0.5, '#0088aa');
    bodyGrad.addColorStop(1, '#004466');
    ctx.fillStyle = bodyGrad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.7)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Cockpit
    ctx.beginPath();
    ctx.ellipse(0, -h / 6, 5, 8, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,240,255,0.9)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Shield visual
    if (shieldActive) {
      ctx.beginPath();
      ctx.arc(0, 0, 34, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(57, 255, 20, ${0.4 + Math.sin(Date.now() * 0.008) * 0.2})`;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = `rgba(57, 255, 20, 0.06)`;
      ctx.fill();
    }

    ctx.restore();

    // Thrust particles
    for (const p of player.thrustParticles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.color}, ${p.alpha})`;
      ctx.fill();
    }
  }

  function updatePlayer(dt) {
    player.x += player.dx * player.speed;
    player.x = Math.max(player.w, Math.min(W - player.w, player.x));
    if (player.shootCooldown > 0) player.shootCooldown -= dt;

    // Thrust particles
    if (gameState === 'playing') {
      if (Math.random() < 0.6) {
        player.thrustParticles.push({
          x: player.x + (Math.random() - 0.5) * 10,
          y: player.y + player.h / 2.5,
          r: Math.random() * 2.5 + 1,
          vx: (Math.random() - 0.5) * 1.5,
          vy: Math.random() * 3 + 2,
          alpha: 1,
          color: Math.random() > 0.5 ? '0, 240, 255' : '255, 150, 50',
        });
      }
    }
    player.thrustParticles = player.thrustParticles.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= 0.03;
      p.r *= 0.97;
      return p.alpha > 0;
    });
  }

  /* ══════════════════════════════════════
     BULLETS
     ══════════════════════════════════════ */
  let bullets = [];

  function shoot() {
    const cooldown = rapidFire ? 6 : 12;
    if (player.shootCooldown > 0) return;
    player.shootCooldown = cooldown;
    bullets.push({
      x: player.x,
      y: player.y - player.h / 2,
      vy: -12,
      r: 3,
    });
    if (rapidFire) {
      bullets.push({ x: player.x - 12, y: player.y - player.h / 3, vy: -12, r: 2.5 });
      bullets.push({ x: player.x + 12, y: player.y - player.h / 3, vy: -12, r: 2.5 });
    }
  }

  function updateBullets() {
    bullets = bullets.filter(b => {
      b.y += b.vy;
      return b.y > -20;
    });
  }

  function drawBullets() {
    for (const b of bullets) {
      // Trail
      const trailGrad = ctx.createLinearGradient(b.x, b.y, b.x, b.y + 20);
      trailGrad.addColorStop(0, 'rgba(0, 240, 255, 0.8)');
      trailGrad.addColorStop(1, 'rgba(0, 240, 255, 0)');
      ctx.fillStyle = trailGrad;
      ctx.fillRect(b.x - 1.5, b.y, 3, 20);
      // Bullet head
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  /* ══════════════════════════════════════
     ENEMIES
     ══════════════════════════════════════ */
  let enemies = [];
  const enemyTypes = [
    { name: 'drone', w: 28, h: 28, hp: 1, speed: 2.5, points: 10, color1: '#ff2d95', color2: '#aa1060' },
    { name: 'cruiser', w: 36, h: 36, hp: 2, speed: 1.8, points: 25, color1: '#b44dff', color2: '#7020b0' },
    { name: 'tank', w: 44, h: 44, hp: 4, speed: 1.2, points: 50, color1: '#ff6600', color2: '#aa3300' },
  ];

  function spawnEnemy() {
    const typeIdx = Math.random() < 0.6 ? 0 : (Math.random() < 0.7 ? 1 : 2);
    const type = enemyTypes[typeIdx];
    const speedMult = 1 + (level - 1) * 0.12;
    enemies.push({
      x: Math.random() * (W - 80) + 40,
      y: -50,
      ...type,
      speed: type.speed * speedMult * (0.8 + Math.random() * 0.4),
      hp: type.hp,
      maxHp: type.hp,
      angle: 0,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: (Math.random() * 0.02 + 0.01) * (Math.random() > 0.5 ? 1 : -1),
    });
  }

  function updateEnemies(dt) {
    enemies = enemies.filter(e => {
      e.y += e.speed;
      e.wobble += e.wobbleSpeed;
      e.x += Math.sin(e.wobble) * 1.2;
      e.angle += 0.02;
      return e.y < H + 60;
    });
  }

  function drawEnemies() {
    for (const e of enemies) {
      ctx.save();
      ctx.translate(e.x, e.y);
      ctx.rotate(e.angle);

      // Glow
      const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, e.w);
      glow.addColorStop(0, e.color1 + '30');
      glow.addColorStop(1, e.color1 + '00');
      ctx.fillStyle = glow;
      ctx.fillRect(-e.w, -e.w, e.w * 2, e.w * 2);

      // Body (diamond shape)
      const s = e.w / 2;
      ctx.beginPath();
      ctx.moveTo(0, -s);
      ctx.lineTo(s, 0);
      ctx.lineTo(0, s);
      ctx.lineTo(-s, 0);
      ctx.closePath();

      const grad = ctx.createLinearGradient(0, -s, 0, s);
      grad.addColorStop(0, e.color1);
      grad.addColorStop(1, e.color2);
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = e.color1 + 'aa';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // HP bar if damaged
      if (e.hp < e.maxHp) {
        ctx.rotate(-e.angle); // un-rotate for bar
        const barW = e.w * 0.8;
        const barH = 3;
        const ratio = e.hp / e.maxHp;
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.fillRect(-barW / 2, -s - 10, barW, barH);
        ctx.fillStyle = ratio > 0.5 ? '#39ff14' : '#ff6600';
        ctx.fillRect(-barW / 2, -s - 10, barW * ratio, barH);
      }

      ctx.restore();
    }
  }

  /* ══════════════════════════════════════
     POWER-UPS
     ══════════════════════════════════════ */
  let powerUps = [];
  const powerUpTypes = [
    { kind: 'shield', color: '#39ff14', symbol: 'S', duration: 300 },
    { kind: 'rapid', color: '#ffe600', symbol: 'R', duration: 400 },
    { kind: 'life', color: '#ff2d95', symbol: '+' },
  ];

  function spawnPowerUp() {
    const typeIdx = Math.random() < 0.35 ? 0 : (Math.random() < 0.6 ? 1 : 2);
    const type = powerUpTypes[typeIdx];
    powerUps.push({
      x: Math.random() * (W - 80) + 40,
      y: -30,
      r: 14,
      speed: 2,
      ...type,
      pulse: Math.random() * Math.PI * 2,
    });
  }

  function updatePowerUps() {
    powerUps = powerUps.filter(p => {
      p.y += p.speed;
      p.pulse += 0.06;
      return p.y < H + 30;
    });
  }

  function drawPowerUps() {
    for (const p of powerUps) {
      const pulseR = p.r + Math.sin(p.pulse) * 3;
      // Outer glow
      ctx.beginPath();
      ctx.arc(p.x, p.y, pulseR + 8, 0, Math.PI * 2);
      ctx.fillStyle = p.color + '15';
      ctx.fill();
      // Ring
      ctx.beginPath();
      ctx.arc(p.x, p.y, pulseR, 0, Math.PI * 2);
      ctx.strokeStyle = p.color + 'aa';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = p.color + '30';
      ctx.fill();
      // Symbol
      ctx.fillStyle = p.color;
      ctx.font = 'bold 14px Orbitron';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.symbol, p.x, p.y + 1);
    }
  }

  /* ══════════════════════════════════════
     PARTICLES
     ══════════════════════════════════════ */
  let particles = [];

  function spawnExplosion(x, y, color, count = 18) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 / count) * i + Math.random() * 0.3;
      const speed = Math.random() * 4 + 2;
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r: Math.random() * 3 + 1,
        alpha: 1,
        color,
        decay: Math.random() * 0.02 + 0.015,
      });
    }
  }

  function updateParticles() {
    particles = particles.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.98;
      p.vy *= 0.98;
      p.alpha -= p.decay;
      p.r *= 0.99;
      return p.alpha > 0;
    });
  }

  function drawParticles() {
    for (const p of particles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `${p.color.slice(0, -1)}, ${p.alpha})`;
      ctx.fill();
    }
  }

  /* ══════════════════════════════════════
     COLLISIONS
     ══════════════════════════════════════ */
  function circleCollide(a, b, ra, rb) {
    const dx = a.x - b.x, dy = a.y - b.y;
    return dx * dx + dy * dy < (ra + rb) * (ra + rb);
  }

  function checkCollisions() {
    // Bullet ↔ Enemy
    for (let bi = bullets.length - 1; bi >= 0; bi--) {
      const b = bullets[bi];
      for (let ei = enemies.length - 1; ei >= 0; ei--) {
        const e = enemies[ei];
        if (circleCollide(b, e, b.r, e.w / 2)) {
          bullets.splice(bi, 1);
          e.hp--;
          spawnExplosion(b.x, b.y, 'rgba(0, 240, 255', 6);
          if (e.hp <= 0) {
            spawnExplosion(e.x, e.y, `rgba(${hexToRgb(e.color1)}`, 22);
            score += e.points * (1 + Math.floor(comboCount / 5));
            comboCount++;
            comboTimer = 90;
            if (comboCount > 0 && comboCount % 5 === 0) {
              showComboPopup(e.x, e.y, comboCount);
            }
            enemies.splice(ei, 1);
            updateHUD();
          }
          break;
        }
      }
    }

    // Player ↔ Enemy
    for (let ei = enemies.length - 1; ei >= 0; ei--) {
      const e = enemies[ei];
      if (circleCollide(player, e, 16, e.w / 2)) {
        if (shieldActive) {
          shieldActive = false;
          shieldTimer = 0;
          spawnExplosion(e.x, e.y, 'rgba(57, 255, 20', 15);
          enemies.splice(ei, 1);
        } else if (!invulnerable) {
          lives--;
          invulnerable = true;
          invulnTimer = 90;
          screenShake = 12;
          spawnExplosion(player.x, player.y, 'rgba(255, 45, 149', 25);
          enemies.splice(ei, 1);
          updateHUD();
          if (lives <= 0) {
            endGame();
          }
        }
      }
    }

    // Player ↔ PowerUp
    for (let pi = powerUps.length - 1; pi >= 0; pi--) {
      const p = powerUps[pi];
      if (circleCollide(player, p, 18, p.r)) {
        if (p.kind === 'shield') {
          shieldActive = true;
          shieldTimer = p.duration;
        } else if (p.kind === 'rapid') {
          rapidFire = true;
          rapidFireTimer = p.duration;
        } else if (p.kind === 'life') {
          lives = Math.min(lives + 1, 5);
        }
        spawnExplosion(p.x, p.y, `rgba(${hexToRgb(p.color)}`, 12);
        powerUps.splice(pi, 1);
        updateHUD();
      }
    }
  }

  /* ══════════════════════════════════════
     HUD
     ══════════════════════════════════════ */
  function updateHUD() {
    document.getElementById('hud-score').textContent = score.toLocaleString();
    const livesEl = document.getElementById('hud-lives');
    livesEl.innerHTML = '';
    for (let i = 0; i < 5; i++) {
      const heart = document.createElement('div');
      heart.className = 'hud-heart' + (i >= lives ? ' lost' : '');
      livesEl.appendChild(heart);
    }
  }

  /* ══════════════════════════════════════
     COMBO POPUP
     ══════════════════════════════════════ */
  function showComboPopup(x, y, count) {
    const el = document.createElement('div');
    el.className = 'combo-popup';
    el.textContent = `${count}x COMBO!`;
    el.style.left = `${Math.min(W - 150, Math.max(10, x - 60))}px`;
    el.style.top = `${y - 30}px`;
    el.style.color = count >= 15 ? '#ff2d95' : count >= 10 ? '#b44dff' : '#ffe600';
    el.style.textShadow = `0 0 20px ${el.style.color}`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1000);
  }

  /* ══════════════════════════════════════
     GAME CONTROL
     ══════════════════════════════════════ */
  function startGame() {
    gameState = 'playing';
    score = 0;
    lives = 3;
    level = 1;
    spawnTimer = 0;
    powerUpTimer = 0;
    shieldActive = false;
    rapidFire = false;
    comboCount = 0;
    comboTimer = 0;
    invulnerable = false;
    screenShake = 0;
    bullets = [];
    enemies = [];
    powerUps = [];
    particles = [];
    resetPlayer();
    updateHUD();
    document.getElementById('hud').classList.add('visible');
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('gameover-screen').classList.add('hidden');
  }

  function endGame() {
    gameState = 'over';
    document.getElementById('hud').classList.remove('visible');
    document.getElementById('final-score').textContent = score.toLocaleString();
    const hsEl = document.getElementById('high-score-text');
    if (score > highScore) {
      highScore = score;
      localStorage.setItem('cosmicDriftHighScore', highScore);
      hsEl.textContent = '★ NEW HIGH SCORE! ★';
    } else {
      hsEl.textContent = `Best: ${highScore.toLocaleString()}`;
    }
    document.getElementById('gameover-screen').classList.remove('hidden');
  }

  /* ══════════════════════════════════════
     INPUT
     ══════════════════════════════════════ */
  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    if (e.key === 'Enter' && gameState === 'over') startGame();
  });
  window.addEventListener('keyup', e => keys[e.key] = false);

  document.getElementById('btn-start').addEventListener('click', startGame);
  document.getElementById('btn-restart').addEventListener('click', startGame);

  // Touch controls
  let touchX = null;
  const touchZone = document.getElementById('touch-zone');
  touchZone.addEventListener('touchstart', e => {
    touchX = e.touches[0].clientX;
  });
  touchZone.addEventListener('touchmove', e => {
    e.preventDefault();
    touchX = e.touches[0].clientX;
  }, { passive: false });
  touchZone.addEventListener('touchend', () => { touchX = null; });

  function processInput() {
    player.dx = 0;
    if (keys['ArrowLeft'] || keys['a'] || keys['A']) player.dx = -1;
    if (keys['ArrowRight'] || keys['d'] || keys['D']) player.dx = 1;
    if (keys[' ']) shoot();

    // Touch
    if (touchX !== null) {
      const diff = touchX - player.x;
      if (Math.abs(diff) > 10) player.dx = diff > 0 ? 1 : -1;
      shoot(); // auto-shoot on mobile
    }
  }

  /* ══════════════════════════════════════
     UTILS
     ══════════════════════════════════════ */
  function hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `${r}, ${g}, ${b}`;
  }

  /* ══════════════════════════════════════
     MAIN LOOP
     ══════════════════════════════════════ */
  let lastTime = 0;

  function gameLoop(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 16.67, 3);
    lastTime = timestamp;

    /* ── Background ── */
    updateStars();
    drawStars();

    /* ── Clear game canvas ── */
    ctx.clearRect(0, 0, W, H);

    if (gameState === 'playing') {
      /* ── Screen shake ── */
      if (screenShake > 0) {
        const sx = (Math.random() - 0.5) * screenShake;
        const sy = (Math.random() - 0.5) * screenShake;
        ctx.save();
        ctx.translate(sx, sy);
        screenShake *= 0.85;
        if (screenShake < 0.5) screenShake = 0;
      }

      processInput();
      updatePlayer(dt);

      /* ── Spawning ── */
      spawnTimer += dt;
      const spawnRate = Math.max(20, 60 - level * 4);
      if (spawnTimer >= spawnRate) {
        spawnTimer = 0;
        spawnEnemy();
      }

      powerUpTimer += dt;
      if (powerUpTimer >= 300) {
        powerUpTimer = 0;
        spawnPowerUp();
      }

      /* ── Level progression ── */
      const newLevel = Math.floor(score / 200) + 1;
      if (newLevel > level) {
        level = newLevel;
        // Brief flash
        spawnExplosion(W / 2, H / 2, 'rgba(0, 240, 255', 40);
      }

      /* ── Timers ── */
      if (shieldActive) {
        shieldTimer--;
        if (shieldTimer <= 0) shieldActive = false;
      }
      if (rapidFire) {
        rapidFireTimer--;
        if (rapidFireTimer <= 0) rapidFire = false;
      }
      if (invulnerable) {
        invulnTimer--;
        if (invulnTimer <= 0) invulnerable = false;
      }
      if (comboTimer > 0) {
        comboTimer--;
        if (comboTimer <= 0) comboCount = 0;
      }

      updateBullets();
      updateEnemies(dt);
      updatePowerUps();
      updateParticles();
      checkCollisions();

      /* ── Draw ── */
      drawPowerUps();
      drawBullets();
      drawEnemies();
      drawPlayer();
      drawParticles();

      /* ── HUD score update ── */
      document.getElementById('hud-score').textContent = score.toLocaleString();

      if (screenShake > 0) ctx.restore();
    }

    requestAnimationFrame(gameLoop);
  }

  requestAnimationFrame(gameLoop);
})();
