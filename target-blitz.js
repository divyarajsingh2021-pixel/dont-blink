/**
 * TARGET BLITZ — Precision Aim & Accuracy Arcade Engine
 * Dynamic target spawner, combo multiplier, accuracy tracking,
 * Web Audio laser pops, canvas sparks, and viral duel links.
 */

(() => {
  'use strict';

  // =========================================================================
  // 1. Audio Engine
  // =========================================================================
  class SoundFX {
    constructor() {
      this.ctx = null;
      this.enabled = localStorage.getItem('db_sound_enabled') !== 'false';
    }

    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) this.ctx = new AudioCtx();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    playHit(combo = 1) {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;
      const pitch = Math.min(1800, 750 + combo * 40);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(pitch, now);
      osc.frequency.exponentialRampToValueAtTime(pitch * 1.5, now + 0.06);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(now + 0.09);
    }

    playMiss() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.linearRampToValueAtTime(100, now + 0.15);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(now + 0.15);
    }

    playGameOver() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const chords = [523.25, 659.25, 783.99, 1046.50];
      chords.forEach((f, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const startTime = this.ctx.currentTime + i * 0.08;
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, startTime);
        gain.gain.setValueAtTime(0.2, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.35);
      });
    }
  }

  // =========================================================================
  // 2. Particle Engine
  // =========================================================================
  class ParticleEngine {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.particles = [];
      this.animId = null;
      this.resize();
      window.addEventListener('resize', () => this.resize());
    }

    resize() {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    }

    burst(x, y, count = 20, colors = ['#ff2a55', '#ffb703', '#ffffff']) {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 6 + 2;
        this.particles.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: Math.random() * 4 + 2,
          color: colors[Math.floor(Math.random() * colors.length)],
          alpha: 1,
          decay: Math.random() * 0.03 + 0.02,
        });
      }
      if (!this.animId) this.loop();
    }

    loop() {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;
        if (p.alpha <= 0) {
          this.particles.splice(i, 1);
          continue;
        }
        this.ctx.save();
        this.ctx.globalAlpha = p.alpha;
        this.ctx.fillStyle = p.color;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
      }
      if (this.particles.length > 0) {
        this.animId = requestAnimationFrame(() => this.loop());
      } else {
        this.animId = null;
      }
    }
  }

  // =========================================================================
  // 3. Aim Ranks
  // =========================================================================
  const AIM_RANKS = [
    { minHits: 45, tier: 'TIER S+', title: 'AIMBOT DEITY', icon: '🤖', quote: 'Inhuman twitch accuracy. You lock onto targets like military radar.', pct: 'Top 0.5%' },
    { minHits: 35, tier: 'TIER S', title: 'CYBER OPERATIVE', icon: '🎯', quote: 'Elite spatial targeting speed. Flawless optical-motor transmission.', pct: 'Top 4%' },
    { minHits: 25, tier: 'TIER A', title: 'TACTICAL SHOOTER', icon: '🔫', quote: 'Fast, sharp reflexes comfortably beating standard gamer averages.', pct: 'Top 20%' },
    { minHits: 15, tier: 'TIER B', title: 'SOLID MARKSMAN', icon: '⚡', quote: 'Reliable accuracy, but coffee might give you that extra edge.', pct: 'Top 60%' },
    { minHits: 0, tier: 'TIER D', title: 'POTATO AIM', icon: '🥔', quote: 'Were you clicking with your toes, or did your screen lag?', pct: 'Bottom 40%' }
  ];

  function getAimRank(hits) {
    return AIM_RANKS.find(r => hits >= r.minHits) || AIM_RANKS[AIM_RANKS.length - 1];
  }

  // =========================================================================
  // 4. Main Controller
  // =========================================================================
  class TargetBlitzGame {
    constructor() {
      // DOM Elements
      this.aimArena = document.getElementById('aim-arena');
      this.hudTimer = document.getElementById('hud-timer');
      this.hudScore = document.getElementById('hud-score');
      this.hudAccuracy = document.getElementById('hud-accuracy');
      this.hudCombo = document.getElementById('hud-combo');
      this.stageIntro = document.getElementById('stage-intro');
      this.gameOverModal = document.getElementById('game-over-modal');
      this.leaderboardModal = document.getElementById('leaderboard-modal');
      this.privacyModal = document.getElementById('privacy-modal');

      this.btnStart = document.getElementById('btn-start');
      this.btnRematch = document.getElementById('btn-rematch');
      this.btnSound = document.getElementById('btn-sound');
      this.soundIconOn = document.getElementById('sound-icon-on');
      this.soundIconOff = document.getElementById('sound-icon-off');
      this.btnLeaderboardModal = document.getElementById('btn-leaderboard-modal');
      this.btnOpenPrivacy = document.getElementById('btn-open-privacy');

      // Sharing
      this.btnShareWhatsapp = document.getElementById('btn-share-whatsapp');
      this.btnChallengeFriend = document.getElementById('btn-challenge-friend');
      this.btnDownloadCard = document.getElementById('btn-download-card');

      // Rival Duel Elements
      this.incomingBanner = document.getElementById('incoming-challenge-banner');
      this.challengerNameEl = document.getElementById('challenger-name');
      this.challengerScoreEl = document.getElementById('challenger-score');
      this.btnAcceptChallenge = document.getElementById('btn-accept-challenge');
      this.challengeBadge = document.getElementById('challenge-badge');
      this.challengeBadgeText = document.getElementById('challenge-badge-text');

      // Engines
      this.sound = new SoundFX();
      this.particles = new ParticleEngine(document.getElementById('particle-canvas'));

      // State
      this.isRunning = false;
      this.timeLeft = 30.0;
      this.timerInterval = null;
      this.hits = 0;
      this.totalClicks = 0;
      this.combo = 0;
      this.maxCombo = 0;
      this.activeTargets = new Map(); // id -> element
      this.targetIdCounter = 0;
      this.bestHits = parseInt(localStorage.getItem('tb_best_hits') || '0', 10);
      this.rivalTarget = null;

      this.updateSoundIcons();
      this.checkUrlChallenge();
      this.bindEvents();
    }

    checkUrlChallenge() {
      const params = new URLSearchParams(window.location.search);
      const vs = params.get('vs');
      const name = params.get('challenger') || 'Rival';
      if (vs && !isNaN(parseInt(vs, 10))) {
        this.rivalTarget = { hits: parseInt(vs, 10), name };
        this.challengerNameEl.textContent = name;
        this.challengerScoreEl.textContent = `${vs} hits`;
        this.incomingBanner.classList.remove('hidden');
        this.challengeBadge.classList.remove('hidden');
        this.challengeBadgeText.textContent = `Beat ${vs} Hits (${name})`;
      }
    }

    bindEvents() {
      this.btnStart.addEventListener('click', () => {
        this.stageIntro.classList.remove('active');
        this.startBlitz();
      });

      this.btnRematch.addEventListener('click', () => {
        this.gameOverModal.classList.add('hidden');
        this.startBlitz();
      });

      // Miss-click tracking on arena background
      this.aimArena.addEventListener('pointerdown', (e) => {
        if (!this.isRunning) return;
        if (e.target === this.aimArena) {
          this.handleMiss(e);
        }
      });

      this.btnSound.addEventListener('click', () => this.toggleSound());
      this.btnLeaderboardModal.addEventListener('click', () => {
        this.renderLeaderboard();
        this.leaderboardModal.classList.remove('hidden');
      });
      this.btnOpenPrivacy.addEventListener('click', () => this.privacyModal.classList.remove('hidden'));

      this.btnAcceptChallenge.addEventListener('click', () => {
        this.incomingBanner.classList.add('hidden');
        this.stageIntro.classList.remove('active');
        this.startBlitz();
      });

      document.querySelectorAll('[data-close]').forEach(btn => {
        btn.addEventListener('click', () => {
          const m = document.getElementById(btn.getAttribute('data-close'));
          if (m) m.classList.add('hidden');
        });
      });

      this.btnShareWhatsapp.addEventListener('click', () => this.shareWhatsApp());
      this.btnChallengeFriend.addEventListener('click', () => this.copyChallengeLink());
      this.btnDownloadCard.addEventListener('click', () => this.exportResultCard());
    }

    startBlitz() {
      this.isRunning = true;
      this.timeLeft = 30.0;
      this.hits = 0;
      this.totalClicks = 0;
      this.combo = 0;
      this.maxCombo = 0;
      this.activeTargets.clear();
      this.aimArena.innerHTML = '';

      this.hudScore.textContent = '0';
      this.hudCombo.textContent = '0x';
      this.hudAccuracy.textContent = '100%';
      this.hudTimer.textContent = this.timeLeft.toFixed(1);
      this.hudTimer.classList.remove('low-time');

      if (this.timerInterval) clearInterval(this.timerInterval);
      this.timerInterval = setInterval(() => this.tick(), 100);

      // Spawn initial 3 targets
      for (let i = 0; i < 3; i++) {
        this.spawnTarget();
      }
    }

    tick() {
      if (!this.isRunning) return;
      this.timeLeft -= 0.1;

      if (this.timeLeft <= 5.0) {
        this.hudTimer.classList.add('low-time');
      } else {
        this.hudTimer.classList.remove('low-time');
      }

      if (this.timeLeft <= 0) {
        this.timeLeft = 0;
        this.hudTimer.textContent = '0.0';
        this.gameOver();
      } else {
        this.hudTimer.textContent = this.timeLeft.toFixed(1);
      }
    }

    spawnTarget() {
      if (!this.isRunning) return;

      const target = document.createElement('button');
      target.className = 'aim-target';
      const id = ++this.targetIdCounter;

      // Random Target Size: shrinks slightly as score goes up (from 64px down to 44px)
      const size = Math.max(44, 64 - Math.floor(this.hits * 0.4));
      target.style.width = `${size}px`;
      target.style.height = `${size}px`;

      // Position within arena bounds with safe margin
      const rect = this.aimArena.getBoundingClientRect();
      const maxX = Math.max(10, rect.width - size - 15);
      const maxY = Math.max(10, rect.height - size - 15);
      const posX = Math.floor(Math.random() * maxX) + 8;
      const posY = Math.floor(Math.random() * maxY) + 8;

      target.style.left = `${posX}px`;
      target.style.top = `${posY}px`;

      // Handle Target Click / Tap
      target.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        if (!this.isRunning) return;
        this.handleHit(e, target, id);
      });

      // Target Despawn Lifetime (1.5s down to 0.9s)
      const lifetime = Math.max(900, 1600 - (this.hits * 15));
      const despawnTimer = setTimeout(() => {
        if (this.activeTargets.has(id)) {
          this.despawnTarget(id, true);
        }
      }, lifetime);

      this.activeTargets.set(id, { el: target, timer: despawnTimer });
      this.aimArena.appendChild(target);
    }

    despawnTarget(id, expired = false) {
      const item = this.activeTargets.get(id);
      if (!item) return;

      clearTimeout(item.timer);
      if (item.el.parentNode) {
        item.el.parentNode.removeChild(item.el);
      }
      this.activeTargets.delete(id);

      if (expired && this.isRunning) {
        // Target expired before being clicked -> break combo
        this.combo = 0;
        this.hudCombo.textContent = '0x';
        this.spawnTarget();
      }
    }

    handleHit(e, target, id) {
      this.hits++;
      this.totalClicks++;
      this.combo++;
      if (this.combo > this.maxCombo) this.maxCombo = this.combo;

      // Particle explosion at target center
      const rect = target.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      this.particles.burst(centerX, centerY, 24, ['#ff2a55', '#ffb703', '#ffffff']);

      // Combo text popup
      if (this.combo >= 3) {
        this.showComboFloat(centerX, centerY, `${this.combo}x!`);
      }

      this.sound.playHit(this.combo);
      this.updateHudStats();
      this.despawnTarget(id, false);

      // Spawn next target
      this.spawnTarget();
    }

    handleMiss(e) {
      this.totalClicks++;
      this.combo = 0;
      this.sound.playMiss();
      this.updateHudStats();

      // Show red X at click point
      this.showComboFloat(e.clientX, e.clientY, 'MISS', '#ff2a55');
      if ('vibrate' in navigator) {
        try { navigator.vibrate(50); } catch (_) {}
      }
    }

    showComboFloat(x, y, text, color = '#ffb703') {
      const fl = document.createElement('div');
      fl.className = 'combo-float';
      fl.style.left = `${x}px`;
      fl.style.top = `${y}px`;
      fl.style.color = color;
      fl.textContent = text;
      document.body.appendChild(fl);
      setTimeout(() => fl.remove(), 600);
    }

    updateHudStats() {
      this.hudScore.textContent = this.hits;
      this.hudCombo.textContent = `${this.combo}x`;
      const acc = this.totalClicks > 0 ? Math.round((this.hits / this.totalClicks) * 100) : 100;
      this.hudAccuracy.textContent = `${acc}%`;
    }

    gameOver() {
      this.isRunning = false;
      clearInterval(this.timerInterval);
      this.sound.playGameOver();

      // Clear all active targets
      this.activeTargets.forEach((item) => {
        clearTimeout(item.timer);
        if (item.el.parentNode) item.el.parentNode.removeChild(item.el);
      });
      this.activeTargets.clear();

      const finalHits = this.hits;
      const acc = this.totalClicks > 0 ? Math.round((this.hits / this.totalClicks) * 100) : 100;
      const hps = (finalHits / 30).toFixed(1);

      let isNewPb = false;
      if (finalHits > this.bestHits) {
        this.bestHits = finalHits;
        localStorage.setItem('tb_best_hits', finalHits.toString());
        isNewPb = true;
      }

      const rank = getAimRank(finalHits);

      document.getElementById('final-hits').textContent = finalHits;
      document.getElementById('final-accuracy').textContent = `${acc}%`;
      document.getElementById('final-hps').textContent = `${hps} hits/s`;
      document.getElementById('final-max-combo').textContent = `${this.maxCombo}x`;
      document.getElementById('final-rank-icon').textContent = rank.icon;
      document.getElementById('final-rank-tier').textContent = rank.tier;
      document.getElementById('final-rank-title').textContent = rank.title;
      document.getElementById('final-sassy-msg').textContent = `"${rank.quote}"`;
      document.getElementById('final-percentile').textContent = `${rank.pct} Aim Accuracy`;

      const pbBadge = document.getElementById('new-pb-badge');
      if (isNewPb) {
        pbBadge.classList.remove('hidden');
        this.particles.burst(window.innerWidth / 2, window.innerHeight / 3, 50, ['#ff2a55', '#ffb703', '#ffffff']);
      } else {
        pbBadge.classList.add('hidden');
      }

      // Rival Duel Comparison
      const rivalBox = document.getElementById('rival-comparison-box');
      if (this.rivalTarget) {
        rivalBox.classList.remove('hidden');
        const diff = finalHits - this.rivalTarget.hits;
        const outcomeEl = document.getElementById('rival-outcome-text');
        if (diff > 0) {
          outcomeEl.innerHTML = `You out-aimed ${this.escapeHtml(this.rivalTarget.name)} by <span style="color:var(--neon-green)">+${diff} hits</span>! 🏆`;
        } else if (diff === 0) {
          outcomeEl.textContent = `TIE with ${this.rivalTarget.name} at ${finalHits} hits!`;
        } else {
          outcomeEl.textContent = `${this.rivalTarget.name} was faster by ${Math.abs(diff)} hits. Try again!`;
        }
      } else {
        rivalBox.classList.add('hidden');
      }

      this.saveLeaderboard(finalHits, acc, rank.title);
      this.gameOverModal.classList.remove('hidden');
    }

    saveLeaderboard(hits, acc, rankTitle) {
      const records = JSON.parse(localStorage.getItem('tb_leaderboard') || '[]');
      records.push({
        hits,
        acc: `${acc}%`,
        rank: rankTitle,
        date: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      });
      records.sort((a, b) => b.hits - a.hits);
      localStorage.setItem('tb_leaderboard', JSON.stringify(records.slice(0, 15)));
    }

    renderLeaderboard() {
      const tbody = document.getElementById('leaderboard-tbody');
      const empty = document.getElementById('leaderboard-empty');
      const records = JSON.parse(localStorage.getItem('tb_leaderboard') || '[]');
      tbody.innerHTML = '';
      if (records.length === 0) {
        empty.classList.remove('hidden');
        return;
      }
      empty.classList.add('hidden');
      records.forEach((r, idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>#${idx + 1}</strong></td>
          <td style="color:var(--neon-red); font-family:var(--font-mono); font-weight:800;">${r.hits} Hits</td>
          <td>${r.acc}</td>
          <td>${r.rank}</td>
          <td>${r.date}</td>
        `;
        tbody.appendChild(tr);
      });
    }

    toggleSound() {
      this.sound.enabled = !this.sound.enabled;
      localStorage.setItem('db_sound_enabled', this.sound.enabled.toString());
      this.updateSoundIcons();
    }

    updateSoundIcons() {
      if (this.sound.enabled) {
        this.soundIconOn.classList.remove('hidden');
        this.soundIconOff.classList.add('hidden');
      } else {
        this.soundIconOn.classList.add('hidden');
        this.soundIconOff.classList.remove('hidden');
      }
    }

    getShareableLink() {
      const url = new URL(window.location.href.split('?')[0]);
      url.searchParams.set('vs', this.hits);
      url.searchParams.set('challenger', 'Player');
      return url.toString();
    }

    copyChallengeLink() {
      const link = this.getShareableLink();
      navigator.clipboard.writeText(link).then(() => {
        this.showToast(`Duel link copied! Beat ${this.hits} Hits`);
      });
    }

    shareWhatsApp() {
      const rank = getAimRank(this.hits);
      const link = this.getShareableLink();
      const text = `🎯 TARGET BLITZ: I scored ${this.hits} hits in 30 seconds (${rank.title} ${rank.icon})! Can your aim beat me? Play here:\n${link}`;
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
    }

    exportResultCard() {
      const canvas = document.getElementById('share-card-canvas');
      const ctx = canvas.getContext('2d');
      const rank = getAimRank(this.hits);

      const grad = ctx.createLinearGradient(0, 0, 1200, 675);
      grad.addColorStop(0, '#090a0f');
      grad.addColorStop(1, '#1c080d');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1200, 675);

      ctx.strokeStyle = '#ff2a55';
      ctx.lineWidth = 6;
      ctx.strokeRect(30, 30, 1140, 615);

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 42px Outfit, sans-serif';
      ctx.fillText("TARGET ", 70, 95);
      ctx.fillStyle = '#ff2a55';
      ctx.fillText("BLITZ", 240, 95);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '700 24px Outfit, sans-serif';
      ctx.fillText("30-SECOND AIM ACCURACY RECORD", 70, 240);

      ctx.fillStyle = '#ff2a55';
      ctx.font = '900 120px "Space Grotesk", monospace';
      ctx.fillText(`${this.hits}`, 70, 360);
      const tw = ctx.measureText(`${this.hits}`).width;
      ctx.fillStyle = '#94a3b8';
      ctx.font = '700 40px "Space Grotesk", monospace';
      ctx.fillText("HITS", 85 + tw, 350);

      ctx.fillStyle = '#181d2e';
      ctx.fillRect(660, 180, 480, 220);
      ctx.strokeStyle = 'rgba(255, 42, 85, 0.4)';
      ctx.lineWidth = 2;
      ctx.strokeRect(660, 180, 480, 220);

      ctx.font = '68px sans-serif';
      ctx.fillText(rank.icon, 700, 300);

      ctx.fillStyle = '#ffb703';
      ctx.font = '800 22px Outfit, sans-serif';
      ctx.fillText(rank.tier, 790, 255);

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 36px Outfit, sans-serif';
      ctx.fillText(rank.title, 790, 305);

      const link = document.createElement('a');
      link.download = `target-blitz-${this.hits}-hits.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      this.showToast('Result card downloaded!');
    }

    showToast(msg) {
      const toast = document.getElementById('toast');
      document.getElementById('toast-msg').textContent = msg;
      toast.classList.remove('hidden');
      setTimeout(() => toast.classList.add('hidden'), 2500);
    }

    escapeHtml(str) {
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    window.game = new TargetBlitzGame();
  });
})();
