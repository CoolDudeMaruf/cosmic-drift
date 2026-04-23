/**
 * Cosmic Drift — Main Game Engine
 * @module game
 * @version 2.0.0
 * @license MIT
 */
(() => {
  'use strict';

  /* ── Canvas Setup ── */
  const bgCanvas = document.getElementById('bg-canvas');
  const bgCtx = bgCanvas.getContext('2d');
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  let W, H;

  function resize() {
    W = window.innerWidth; H = window.innerHeight;
    bgCanvas.width = canvas.width = W;
    bgCanvas.height = canvas.height = H;
  }
  resize();
  window.addEventListener('resize', resize);

  /* ── Starfield ── */
  const stars = [];
  function initStars() {
    stars.length = 0;
    for (let i = 0; i < 200; i++) {
      stars.push({ x: Math.random()*W, y: Math.random()*H, r: Math.random()*1.5+0.3, speed: Math.random()*0.6+0.15, alpha: Math.random()*0.6+0.2 });
    }
  }
  initStars();

  function updateStars() {
    for (const s of stars) { s.y += s.speed + (gameState==='playing'?1.2:0); if (s.y>H){s.y=-2;s.x=Math.random()*W;} }
  }
  function drawStars() {
    bgCtx.clearRect(0,0,W,H); bgCtx.fillStyle='#0a0a1a'; bgCtx.fillRect(0,0,W,H);
    for (const s of stars) { bgCtx.beginPath(); bgCtx.arc(s.x,s.y,s.r,0,Math.PI*2); bgCtx.fillStyle=`rgba(200,220,255,${s.alpha})`; bgCtx.fill(); }
  }

  /* ── Game State ── */
  let gameState = 'welcome';
  let score=0, lives=3, level=1, spawnTimer=0, powerUpTimer=0;
  let highScore = parseInt(localStorage.getItem('cosmicDriftHighScore')||'0',10);
  let shieldActive=false, shieldTimer=0, rapidFire=false, rapidFireTimer=0;
  let comboCount=0, comboTimer=0, maxCombo=0;
  let invulnerable=false, invulnTimer=0, screenShake=0;

  /* ── Player Ship ── */
  const player = { x:0,y:0, w:36,h:44, speed:6.5, dx:0, shootCooldown:0, thrustParticles:[] };

  function resetPlayer() { player.x=W/2; player.y=H-100; player.dx=0; player.shootCooldown=0; player.thrustParticles=[]; }

  function drawPlayer() {
    const {x,y,w,h}=player;
    const alpha = invulnerable?(Math.sin(Date.now()*0.02)*0.4+0.6):1;
    ctx.save(); ctx.globalAlpha=alpha; ctx.translate(x,y);
    const glowGrad=ctx.createRadialGradient(0,0,5,0,0,50);
    glowGrad.addColorStop(0,'rgba(0,240,255,0.12)'); glowGrad.addColorStop(1,'rgba(0,240,255,0)');
    ctx.fillStyle=glowGrad; ctx.beginPath(); ctx.arc(0,0,50,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(0,-h/2); ctx.lineTo(-w/2,h/2); ctx.lineTo(-w/4,h/3); ctx.lineTo(0,h/2.5); ctx.lineTo(w/4,h/3); ctx.lineTo(w/2,h/2); ctx.closePath();
    const bodyGrad=ctx.createLinearGradient(0,-h/2,0,h/2);
    bodyGrad.addColorStop(0,'#00f0ff'); bodyGrad.addColorStop(0.5,'#0088aa'); bodyGrad.addColorStop(1,'#004466');
    ctx.fillStyle=bodyGrad; ctx.fill(); ctx.strokeStyle='rgba(0,240,255,0.7)'; ctx.lineWidth=1.5; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(0,-h/6,5,8,0,0,Math.PI*2); ctx.fillStyle='#fff'; ctx.fill();
    ctx.strokeStyle='rgba(0,240,255,0.9)'; ctx.lineWidth=1; ctx.stroke();
    if(shieldActive){ctx.beginPath();ctx.arc(0,0,34,0,Math.PI*2);ctx.strokeStyle=`rgba(57,255,20,${0.4+Math.sin(Date.now()*0.008)*0.2})`;ctx.lineWidth=2;ctx.stroke();ctx.fillStyle='rgba(57,255,20,0.06)';ctx.fill();}
    ctx.restore();
    for(const p of player.thrustParticles){ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fillStyle=`rgba(${p.color},${p.alpha})`;ctx.fill();}
  }

  function updatePlayer(dt) {
    player.x+=player.dx*player.speed; player.x=Math.max(player.w,Math.min(W-player.w,player.x));
    if(player.shootCooldown>0) player.shootCooldown-=dt;
    if(gameState==='playing'&&Math.random()<0.6){
      player.thrustParticles.push({x:player.x+(Math.random()-0.5)*10,y:player.y+player.h/2.5,r:Math.random()*2.5+1,vx:(Math.random()-0.5)*1.5,vy:Math.random()*3+2,alpha:1,color:Math.random()>0.5?'0,240,255':'255,150,50'});
    }
    player.thrustParticles=player.thrustParticles.filter(p=>{p.x+=p.vx;p.y+=p.vy;p.alpha-=0.03;p.r*=0.97;return p.alpha>0;});
  }

  /* ── Bullets ── */
  let bullets = [];
  function shoot() {
    const cd=rapidFire?6:12; if(player.shootCooldown>0)return; player.shootCooldown=cd;
    bullets.push({x:player.x,y:player.y-player.h/2,vy:-12,r:3});
    if(rapidFire){bullets.push({x:player.x-12,y:player.y-player.h/3,vy:-12,r:2.5});bullets.push({x:player.x+12,y:player.y-player.h/3,vy:-12,r:2.5});}
  }
  function updateBullets(){bullets=bullets.filter(b=>{b.y+=b.vy;return b.y>-20;});}
  function drawBullets(){for(const b of bullets){const tg=ctx.createLinearGradient(b.x,b.y,b.x,b.y+20);tg.addColorStop(0,'rgba(0,240,255,0.8)');tg.addColorStop(1,'rgba(0,240,255,0)');ctx.fillStyle=tg;ctx.fillRect(b.x-1.5,b.y,3,20);ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,Math.PI*2);ctx.fillStyle='#fff';ctx.fill();ctx.shadowColor='#00f0ff';ctx.shadowBlur=10;ctx.fill();ctx.shadowBlur=0;}}

  /* ── Enemies ── */
  let enemies = [];
  const enemyTypes=[
    {name:'drone',w:28,h:28,hp:1,speed:2.5,points:10,color1:'#ff2d95',color2:'#aa1060'},
    {name:'cruiser',w:36,h:36,hp:2,speed:1.8,points:25,color1:'#b44dff',color2:'#7020b0'},
    {name:'tank',w:44,h:44,hp:4,speed:1.2,points:50,color1:'#ff6600',color2:'#aa3300'},
  ];

  function spawnEnemy(){
    const ti=Math.random()<0.6?0:(Math.random()<0.7?1:2); const t=enemyTypes[ti]; const sm=1+(level-1)*0.12;
    enemies.push({x:Math.random()*(W-80)+40,y:-50,...t,speed:t.speed*sm*(0.8+Math.random()*0.4),hp:t.hp,maxHp:t.hp,angle:0,wobble:Math.random()*Math.PI*2,wobbleSpeed:(Math.random()*0.02+0.01)*(Math.random()>0.5?1:-1)});
  }
  function updateEnemies(dt){enemies=enemies.filter(e=>{e.y+=e.speed;e.wobble+=e.wobbleSpeed;e.x+=Math.sin(e.wobble)*1.2;e.angle+=0.02;return e.y<H+60;});}
  function drawEnemies(){for(const e of enemies){ctx.save();ctx.translate(e.x,e.y);ctx.rotate(e.angle);const glow=ctx.createRadialGradient(0,0,2,0,0,e.w);glow.addColorStop(0,e.color1+'30');glow.addColorStop(1,e.color1+'00');ctx.fillStyle=glow;ctx.fillRect(-e.w,-e.w,e.w*2,e.w*2);const s=e.w/2;ctx.beginPath();ctx.moveTo(0,-s);ctx.lineTo(s,0);ctx.lineTo(0,s);ctx.lineTo(-s,0);ctx.closePath();const grad=ctx.createLinearGradient(0,-s,0,s);grad.addColorStop(0,e.color1);grad.addColorStop(1,e.color2);ctx.fillStyle=grad;ctx.fill();ctx.strokeStyle=e.color1+'aa';ctx.lineWidth=1.2;ctx.stroke();if(e.hp<e.maxHp){ctx.rotate(-e.angle);const bw=e.w*0.8,bh=3,ratio=e.hp/e.maxHp;ctx.fillStyle='rgba(255,255,255,0.15)';ctx.fillRect(-bw/2,-s-10,bw,bh);ctx.fillStyle=ratio>0.5?'#39ff14':'#ff6600';ctx.fillRect(-bw/2,-s-10,bw*ratio,bh);}ctx.restore();}}

  /* ── Power-Ups ── */
  let powerUps = [];
  const powerUpTypes=[{kind:'shield',color:'#39ff14',symbol:'S',duration:300},{kind:'rapid',color:'#ffe600',symbol:'R',duration:400},{kind:'life',color:'#ff2d95',symbol:'+'}];

  function spawnPowerUp(){const ti=Math.random()<0.35?0:(Math.random()<0.6?1:2);const t=powerUpTypes[ti];powerUps.push({x:Math.random()*(W-80)+40,y:-30,r:14,speed:2,...t,pulse:Math.random()*Math.PI*2});}
  function updatePowerUps(){powerUps=powerUps.filter(p=>{p.y+=p.speed;p.pulse+=0.06;return p.y<H+30;});}
  function drawPowerUps(){for(const p of powerUps){const pr=p.r+Math.sin(p.pulse)*3;ctx.beginPath();ctx.arc(p.x,p.y,pr+8,0,Math.PI*2);ctx.fillStyle=p.color+'15';ctx.fill();ctx.beginPath();ctx.arc(p.x,p.y,pr,0,Math.PI*2);ctx.strokeStyle=p.color+'aa';ctx.lineWidth=2;ctx.stroke();ctx.fillStyle=p.color+'30';ctx.fill();ctx.fillStyle=p.color;ctx.font='bold 14px Orbitron';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(p.symbol,p.x,p.y+1);}}

  /* ── Particles ── */
  let particles = [];
  function spawnExplosion(x,y,color,count=18){for(let i=0;i<count;i++){const angle=(Math.PI*2/count)*i+Math.random()*0.3;const speed=Math.random()*4+2;particles.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,r:Math.random()*3+1,alpha:1,color,decay:Math.random()*0.02+0.015});}}
  function updateParticles(){particles=particles.filter(p=>{p.x+=p.vx;p.y+=p.vy;p.vx*=0.98;p.vy*=0.98;p.alpha-=p.decay;p.r*=0.99;return p.alpha>0;});}
  function drawParticles(){for(const p of particles){ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fillStyle=`${p.color.slice(0,-1)},${p.alpha})`;ctx.fill();}}

  /* ── Collisions ── */
  function circleCollide(a,b,ra,rb){const dx=a.x-b.x,dy=a.y-b.y;return dx*dx+dy*dy<(ra+rb)*(ra+rb);}

  function checkCollisions(){
    for(let bi=bullets.length-1;bi>=0;bi--){const b=bullets[bi];for(let ei=enemies.length-1;ei>=0;ei--){const e=enemies[ei];if(circleCollide(b,e,b.r,e.w/2)){bullets.splice(bi,1);e.hp--;spawnExplosion(b.x,b.y,'rgba(0,240,255',6);if(e.hp<=0){spawnExplosion(e.x,e.y,`rgba(${hexToRgb(e.color1)}`,22);score+=e.points*(1+Math.floor(comboCount/5));comboCount++;if(comboCount>maxCombo)maxCombo=comboCount;comboTimer=90;if(comboCount>0&&comboCount%5===0)showComboPopup(e.x,e.y,comboCount);enemies.splice(ei,1);updateHUD();}break;}}}
    for(let ei=enemies.length-1;ei>=0;ei--){const e=enemies[ei];if(circleCollide(player,e,16,e.w/2)){if(shieldActive){shieldActive=false;shieldTimer=0;spawnExplosion(e.x,e.y,'rgba(57,255,20',15);enemies.splice(ei,1);}else if(!invulnerable){lives--;invulnerable=true;invulnTimer=90;screenShake=12;spawnExplosion(player.x,player.y,'rgba(255,45,149',25);enemies.splice(ei,1);updateHUD();if(lives<=0)endGame();}}}
    for(let pi=powerUps.length-1;pi>=0;pi--){const p=powerUps[pi];if(circleCollide(player,p,18,p.r)){if(p.kind==='shield'){shieldActive=true;shieldTimer=p.duration;}else if(p.kind==='rapid'){rapidFire=true;rapidFireTimer=p.duration;}else if(p.kind==='life'){lives=Math.min(lives+1,5);}spawnExplosion(p.x,p.y,`rgba(${hexToRgb(p.color)}`,12);powerUps.splice(pi,1);updateHUD();}}
  }

  /* ── HUD ── */
  function updateHUD(){
    document.getElementById('hud-score').textContent=score.toLocaleString();
    const livesEl=document.getElementById('hud-lives'); livesEl.innerHTML='';
    for(let i=0;i<5;i++){const h=document.createElement('div');h.className='hud-heart'+(i>=lives?' lost':'');livesEl.appendChild(h);}
  }

  function showComboPopup(x,y,count){
    const el=document.createElement('div');el.className='combo-popup';el.textContent=`${count}x COMBO!`;
    el.style.left=`${Math.min(W-150,Math.max(10,x-60))}px`;el.style.top=`${y-30}px`;
    el.style.color=count>=15?'#ff2d95':count>=10?'#b44dff':'#ffe600';
    el.style.textShadow=`0 0 20px ${el.style.color}`;
    document.body.appendChild(el);setTimeout(()=>el.remove(),1000);
  }

  /* ── Game Control ── */
  function startGame(){
    gameState='playing'; score=0; lives=3; level=1; spawnTimer=0; powerUpTimer=0;
    shieldActive=false; rapidFire=false; comboCount=0; comboTimer=0; maxCombo=0;
    invulnerable=false; screenShake=0; bullets=[]; enemies=[]; powerUps=[]; particles=[];
    resetPlayer(); updateHUD();
    document.getElementById('hud').classList.add('visible');
    hideAllScreens();
    // Show player name in HUD
    const session = CosmicAuth.getCurrentSession();
    const nameEl = document.getElementById('hud-player-name');
    if (session && !session.isGuest) {
      const user = CosmicAuth.getUser(session.username);
      nameEl.textContent = `${user?.country?.flag||''} ${session.username}`;
    } else {
      nameEl.textContent = '🚀 Guest';
    }
  }

  function endGame(){
    gameState='over';
    document.getElementById('hud').classList.remove('visible');
    document.getElementById('final-score').textContent=score.toLocaleString();
    const hsEl=document.getElementById('high-score-text');
    // Record score for logged-in users
    CosmicAuth.recordScore(score, maxCombo);
    // Use per-user high score for logged-in users, global for guests
    const session = CosmicAuth.getCurrentSession();
    let personalHigh = highScore;
    if (session && !session.isGuest) {
      const user = CosmicAuth.getUser(session.username);
      if (user) personalHigh = user.highScore;
    } else {
      if(score>highScore){highScore=score;localStorage.setItem('cosmicDriftHighScore',highScore);}
    }
    if(score>=personalHigh && score>0){hsEl.textContent='★ NEW HIGH SCORE! ★';}
    else{hsEl.textContent=`Best: ${personalHigh.toLocaleString()}`;}
    // Show rank for logged-in users
    const rank = CosmicLeaderboard.getCurrentRank();
    if (rank) { hsEl.textContent += ` · Rank #${rank}`; }
    document.getElementById('gameover-screen').classList.remove('hidden');
  }

  /* ── Screen Management ── */
  function hideAllScreens(){
    document.querySelectorAll('.screen-overlay').forEach(s=>s.classList.add('hidden'));
  }
  function showScreen(id){hideAllScreens();document.getElementById(id).classList.remove('hidden');}

  /* ── Input ── */
  const keys={};
  window.addEventListener('keydown',e=>{keys[e.key]=true;if(e.key==='Enter'&&gameState==='over')startGame();});
  window.addEventListener('keyup',e=>keys[e.key]=false);

  let touchX=null;
  const touchZone=document.getElementById('touch-zone');
  touchZone.addEventListener('touchstart',e=>{touchX=e.touches[0].clientX;});
  touchZone.addEventListener('touchmove',e=>{e.preventDefault();touchX=e.touches[0].clientX;},{passive:false});
  touchZone.addEventListener('touchend',()=>{touchX=null;});

  function processInput(){
    player.dx=0;
    if(keys['ArrowLeft']||keys['a']||keys['A'])player.dx=-1;
    if(keys['ArrowRight']||keys['d']||keys['D'])player.dx=1;
    if(keys[' '])shoot();
    if(touchX!==null){const diff=touchX-player.x;if(Math.abs(diff)>10)player.dx=diff>0?1:-1;shoot();}
  }

  /* ── Utils ── */
  function hexToRgb(hex){return`${parseInt(hex.slice(1,3),16)},${parseInt(hex.slice(3,5),16)},${parseInt(hex.slice(5,7),16)}`;}

  /* ══════════════════════════════════════
     AUTH / UI WIRING
     ══════════════════════════════════════ */

  // Populate country picker
  function buildCountryPicker(){
    const container=document.getElementById('country-picker');
    const countries=CosmicAuth.getCountries();
    const hidden=document.getElementById('create-country');
    container.innerHTML='';
    countries.forEach(c=>{
      const btn=document.createElement('button');
      btn.type='button'; btn.className='country-btn'; btn.dataset.code=c.code;
      btn.title=c.name; btn.innerHTML=`<span class="country-flag">${c.flag}</span><span class="country-name">${c.name}</span>`;
      btn.addEventListener('click',()=>{
        container.querySelectorAll('.country-btn').forEach(b=>b.classList.remove('selected'));
        btn.classList.add('selected'); hidden.value=c.code;
      });
      container.appendChild(btn);
    });
  }

  function showPlayerInfo(){
    const bar=document.getElementById('player-info-bar');
    const logoutBtn=document.getElementById('btn-logout');
    const session=CosmicAuth.getCurrentSession();
    if(!session){bar.innerHTML='';return;}
    if(session.isGuest){
      bar.innerHTML=`<div class="player-card"><span class="player-avatar">🚀</span><span class="player-name">Guest Pilot</span><span class="player-tag">No score tracking</span></div>`;
      logoutBtn.textContent='← Switch User';
      logoutBtn.style.display='';
    } else {
      const user=CosmicAuth.getUser(session.username);
      const rank=CosmicLeaderboard.getCurrentRank();
      if(user){
        bar.innerHTML=`<div class="player-card"><span class="player-avatar">${user.country?.flag||'🌍'}</span><span class="player-name">${user.username}</span><span class="player-tag">High: ${user.highScore.toLocaleString()}${rank?' · Rank #'+rank:''}</span></div>`;
      }
      logoutBtn.textContent='Sign Out';
      logoutBtn.style.display='';
    }
  }

  // Check for existing session on load
  function initAuth(){
    const session=CosmicAuth.getCurrentSession();
    if(session){
      showPlayerInfo();
      showScreen('start-screen');
      gameState='start';
    } else {
      showScreen('welcome-screen');
      gameState='welcome';
    }
    buildCountryPicker();
  }

  /* ── Button Handlers ── */
  document.getElementById('btn-guest').addEventListener('click',()=>{
    CosmicAuth.playAsGuest(); showPlayerInfo(); showScreen('start-screen'); gameState='start';
  });
  document.getElementById('btn-create-account').addEventListener('click',()=>{showScreen('create-screen');});
  document.getElementById('btn-signin').addEventListener('click',()=>{showScreen('signin-screen');});
  document.getElementById('btn-back-create').addEventListener('click',()=>{showScreen('welcome-screen');});
  document.getElementById('btn-back-signin').addEventListener('click',()=>{showScreen('welcome-screen');});

  // Create account form
  document.getElementById('create-form').addEventListener('submit',e=>{
    e.preventDefault();
    const errEl=document.getElementById('create-error');
    const user=document.getElementById('create-username').value;
    const pass=document.getElementById('create-password').value;
    const country=document.getElementById('create-country').value;
    const result=CosmicAuth.createAccount(user,pass,country);
    if(result.ok){errEl.classList.add('hidden');showPlayerInfo();showScreen('start-screen');gameState='start';}
    else{errEl.textContent=result.error;errEl.classList.remove('hidden');}
  });

  // Sign in form
  document.getElementById('signin-form').addEventListener('submit',e=>{
    e.preventDefault();
    const errEl=document.getElementById('signin-error');
    const user=document.getElementById('signin-username').value;
    const pass=document.getElementById('signin-password').value;
    const result=CosmicAuth.signIn(user,pass);
    if(result.ok){errEl.classList.add('hidden');showPlayerInfo();showScreen('start-screen');gameState='start';}
    else{errEl.textContent=result.error;errEl.classList.remove('hidden');}
  });

  document.getElementById('btn-start').addEventListener('click',startGame);
  document.getElementById('btn-restart').addEventListener('click',startGame);

  document.getElementById('btn-logout').addEventListener('click',()=>{
    CosmicAuth.signOut(); showScreen('welcome-screen'); gameState='welcome';
  });

  // Leaderboard
  let leaderboardReturnTo='start-screen';
  function openLeaderboard(returnTo){
    leaderboardReturnTo=returnTo||'start-screen';
    showScreen('leaderboard-screen');
    gameState='leaderboard';
    document.getElementById('lb-tab-global').classList.add('active');
    document.getElementById('lb-tab-personal').classList.remove('active');
    CosmicLeaderboard.renderGlobalBoard(document.getElementById('lb-table-wrap'));
  }
  document.getElementById('btn-leaderboard').addEventListener('click',()=>openLeaderboard('start-screen'));
  document.getElementById('btn-leaderboard-go').addEventListener('click',()=>openLeaderboard('gameover-screen'));
  document.getElementById('btn-lb-close').addEventListener('click',()=>{
    showScreen(leaderboardReturnTo);
    gameState=leaderboardReturnTo==='gameover-screen'?'over':'start';
    if(gameState==='start') showPlayerInfo();
  });

  document.querySelectorAll('.lb-tab').forEach(tab=>{
    tab.addEventListener('click',()=>{
      document.querySelectorAll('.lb-tab').forEach(t=>t.classList.remove('active'));
      tab.classList.add('active');
      const wrap=document.getElementById('lb-table-wrap');
      if(tab.dataset.tab==='global') CosmicLeaderboard.renderGlobalBoard(wrap);
      else CosmicLeaderboard.renderPersonalBoard(wrap);
    });
  });

  /* ══════════════════════════════════════
     MAIN LOOP
     ══════════════════════════════════════ */
  let lastTime=0;
  function gameLoop(timestamp){
    const dt=Math.min((timestamp-lastTime)/16.67,3); lastTime=timestamp;
    updateStars(); drawStars(); ctx.clearRect(0,0,W,H);

    if(gameState==='playing'){
      if(screenShake>0){const sx=(Math.random()-0.5)*screenShake,sy=(Math.random()-0.5)*screenShake;ctx.save();ctx.translate(sx,sy);screenShake*=0.85;if(screenShake<0.5)screenShake=0;}
      processInput(); updatePlayer(dt);
      spawnTimer+=dt; const spawnRate=Math.max(20,60-level*4);
      if(spawnTimer>=spawnRate){spawnTimer=0;spawnEnemy();}
      powerUpTimer+=dt; if(powerUpTimer>=300){powerUpTimer=0;spawnPowerUp();}
      const newLevel=Math.floor(score/200)+1;
      if(newLevel>level){level=newLevel;spawnExplosion(W/2,H/2,'rgba(0,240,255',40);}
      if(shieldActive){shieldTimer--;if(shieldTimer<=0)shieldActive=false;}
      if(rapidFire){rapidFireTimer--;if(rapidFireTimer<=0)rapidFire=false;}
      if(invulnerable){invulnTimer--;if(invulnTimer<=0)invulnerable=false;}
      if(comboTimer>0){comboTimer--;if(comboTimer<=0)comboCount=0;}
      updateBullets();updateEnemies(dt);updatePowerUps();updateParticles();checkCollisions();
      drawPowerUps();drawBullets();drawEnemies();drawPlayer();drawParticles();
      document.getElementById('hud-score').textContent=score.toLocaleString();
      if(screenShake>0)ctx.restore();
    }
    requestAnimationFrame(gameLoop);
  }

  initAuth();
  requestAnimationFrame(gameLoop);
})();
