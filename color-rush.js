/**
 * COLOR RUSH — Optical Reflex Arcade Engine
 * Pure Vanilla JavaScript implementation with Web Audio synthesis,
 * canvas particle explosions, progressive delta calculations, and viral sharing.
 */

(() => {
  'use strict';

  // =========================================================================
  // 1. Audio Engine (Web Audio API)
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

    playCorrect() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(650, now);
      osc.frequency.exponentialRampToValueAtTime(1100, now + 0.08);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(now + 0.12);
    }

    playWrong() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.25);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(now + 0.25);
    }

    playGameOver() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const chords = [440, 554.37, 659.25, 880];
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

    burst(x, y, count = 25, color = '#00f0ff') {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 6 + 2;
        this.particles.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: Math.random() * 4 + 2,
          color,
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
  // 3. Optical Ranks & Benchmark
  // =========================================================================
  const RANKS = [
    { minLevel: 36, tier: 'TIER S+', title: 'ELECTRON MICROSCOPE', icon: '🔬', quote: 'Inhuman retinal photoreceptors. You detect single-nanometer wavelength shifts.', pct: 'Top 0.5%' },
    { minLevel: 28, tier: 'TIER S', title: 'APEX EAGLE VISION', icon: '🦅', quote: 'Predatory optical discrimination. You could spot a mouse from a kilometer high.', pct: 'Top 4%' },
    { minLevel: 20, tier: 'TIER A', title: 'FELINE NIGHT VISION', icon: '🐱', quote: 'Sharp, agile color perception far outperforming typical human baselines.', pct: 'Top 22%' },
    { minLevel: 13, tier: 'TIER B', title: 'SOLID HUMAN VISION', icon: '🚶', quote: 'Standard human retina. Reliable everyday visual acuity.', pct: 'Top 60%' },
    { minLevel: 0, tier: 'TIER D', title: 'BLURRY BAT', icon: '🦇', quote: 'Are your screen brightness settings low, or did you blink right through the round?', pct: 'Bottom 40%' }
  ];

  function getRank(lvl) {
    return RANKS.find(r => lvl >= r.minLevel) || RANKS[RANKS.length - 1];
  }

  // =========================================================================
  // 4. Color Rush Game Controller
  // =========================================================================
  class ColorRushGame {
    constructor() {
      // DOM Elements
      this.gridContainer = document.getElementById('grid-container');
      this.hudTimer = document.getElementById('hud-timer');
      this.hudLevel = document.getElementById('hud-level');
      this.hudBest = document.getElementById('hud-best');
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

      // Rival Challenge Elements
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
      this.level = 1;
      this.timeLeft = 15.0;
      this.timerInterval = null;
      this.isRunning = false;
      this.bestLevel = parseInt(localStorage.getItem('cr_best_level') || '0', 10);
      this.rivalTarget = null;

      this.updateSoundIcons();
      this.hudBest.textContent = `Lvl ${this.bestLevel}`;
      this.checkUrlChallenge();
      this.bindEvents();
    }

    checkUrlChallenge() {
      const params = new URLSearchParams(window.location.search);
      const vs = params.get('vs');
      const name = params.get('challenger') || 'Rival';
      if (vs && !isNaN(parseInt(vs, 10))) {
        this.rivalTarget = { level: parseInt(vs, 10), name };
        this.challengerNameEl.textContent = name;
        this.challengerScoreEl.textContent = `Level ${vs}`;
        this.incomingBanner.classList.remove('hidden');
        this.challengeBadge.classList.remove('hidden');
        this.challengeBadgeText.textContent = `Beat Lvl ${vs} (${name})`;
      }
    }

    bindEvents() {
      this.btnStart.addEventListener('click', () => {
        this.stageIntro.classList.remove('active');
        this.startRush();
      });

      this.btnRematch.addEventListener('click', () => {
        this.gameOverModal.classList.add('hidden');
        this.startRush();
      });

      this.btnSound.addEventListener('click', () => this.toggleSound());
      this.btnLeaderboardModal.addEventListener('click', () => {
        this.renderLeaderboard();
        this.leaderboardModal.classList.remove('hidden');
      });
      this.btnOpenPrivacy.addEventListener('click', () => {
        this.privacyModal.classList.remove('hidden');
      });

      this.btnAcceptChallenge.addEventListener('click', () => {
        this.incomingBanner.classList.add('hidden');
        this.stageIntro.classList.remove('active');
        this.startRush();
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

    startRush() {
      this.level = 1;
      this.timeLeft = 15.0;
      this.isRunning = true;
      this.hudLevel.textContent = this.level;
      this.hudTimer.textContent = this.timeLeft.toFixed(1);
      this.hudTimer.classList.remove('low-time');

      if (this.timerInterval) clearInterval(this.timerInterval);
      this.timerInterval = setInterval(() => this.tick(), 100);

      this.renderLevel();
    }

    tick() {
      if (!this.isRunning) return;
      this.timeLeft -= 0.1;

      if (this.timeLeft <= 3.5) {
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

    renderLevel() {
      this.gridContainer.innerHTML = '';

      // Determine Grid Dimensions based on Level
      let cols = 2;
      if (this.level >= 30) cols = 8;
      else if (this.level >= 22) cols = 7;
      else if (this.level >= 15) cols = 6;
      else if (this.level >= 10) cols = 5;
      else if (this.level >= 6) cols = 4;
      else if (this.level >= 3) cols = 3;

      this.gridContainer.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
      const totalTiles = cols * cols;

      // Generate Color Scheme
      const hue = Math.floor(Math.random() * 360);
      const sat = Math.floor(Math.random() * 25 + 65); // 65-90%
      const light = Math.floor(Math.random() * 20 + 45); // 45-65%

      // Calculate Lightness Delta (progressively gets tighter)
      const maxDelta = 22;
      const minDelta = 2.4;
      const delta = Math.max(minDelta, maxDelta - (this.level * 0.65));
      const targetLight = light + (Math.random() < 0.5 ? delta : -delta);

      const baseColor = `hsl(${hue}, ${sat}%, ${light}%)`;
      const oddColor = `hsl(${hue}, ${sat}%, ${targetLight}%)`;

      // Pick Odd Tile Index
      const oddIndex = Math.floor(Math.random() * totalTiles);

      for (let i = 0; i < totalTiles; i++) {
        const tile = document.createElement('button');
        tile.className = 'color-tile';
        const isOdd = i === oddIndex;
        tile.style.backgroundColor = isOdd ? oddColor : baseColor;

        tile.addEventListener('pointerdown', (e) => {
          if (!this.isRunning) return;
          if (isOdd) {
            this.handleCorrectTap(e, tile, oddColor);
          } else {
            this.handleWrongTap(tile);
          }
        });

        this.gridContainer.appendChild(tile);
      }
    }

    handleCorrectTap(e, tile, color) {
      this.sound.playCorrect();

      // Particle explosion at tap
      const rect = tile.getBoundingClientRect();
      this.particles.burst(rect.left + rect.width / 2, rect.top + rect.height / 2, 22, color);

      // +1.0s bonus time (max 20.0s)
      this.timeLeft = Math.min(20.0, this.timeLeft + 1.0);
      this.level++;
      this.hudLevel.textContent = this.level;

      this.renderLevel();
    }

    handleWrongTap(tile) {
      this.sound.playWrong();

      // -3.0s penalty
      this.timeLeft = Math.max(0, this.timeLeft - 3.0);
      this.hudTimer.textContent = this.timeLeft.toFixed(1);

      tile.style.filter = 'brightness(0.3)';
      setTimeout(() => tile.style.filter = '', 150);

      if ('vibrate' in navigator) {
        try { navigator.vibrate([80, 40, 80]); } catch (_) {}
      }
    }

    gameOver() {
      this.isRunning = false;
      clearInterval(this.timerInterval);
      this.sound.playGameOver();

      const finalLevel = this.level;
      let isNewPb = false;

      if (finalLevel > this.bestLevel) {
        this.bestLevel = finalLevel;
        localStorage.setItem('cr_best_level', finalLevel.toString());
        this.hudBest.textContent = `Lvl ${this.bestLevel}`;
        isNewPb = true;
      }

      const rank = getRank(finalLevel);

      document.getElementById('final-level').textContent = finalLevel;
      document.getElementById('final-rank-icon').textContent = rank.icon;
      document.getElementById('final-rank-tier').textContent = rank.tier;
      document.getElementById('final-rank-title').textContent = rank.title;
      document.getElementById('final-sassy-msg').textContent = `"${rank.quote}"`;
      document.getElementById('final-percentile').textContent = `${rank.pct} Optical Acuity`;

      const pbBadge = document.getElementById('new-pb-badge');
      if (isNewPb) {
        pbBadge.classList.remove('hidden');
        this.particles.burst(window.innerWidth / 2, window.innerHeight / 3, 50, '#00f0ff');
      } else {
        pbBadge.classList.add('hidden');
      }

      this.saveLeaderboard(finalLevel, rank.title);
      this.gameOverModal.classList.remove('hidden');
    }

    saveLeaderboard(level, rankTitle) {
      const records = JSON.parse(localStorage.getItem('cr_leaderboard') || '[]');
      records.push({
        level,
        rank: rankTitle,
        date: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      });
      records.sort((a, b) => b.level - a.level);
      localStorage.setItem('cr_leaderboard', JSON.stringify(records.slice(0, 15)));
    }

    renderLeaderboard() {
      const tbody = document.getElementById('leaderboard-tbody');
      const empty = document.getElementById('leaderboard-empty');
      const records = JSON.parse(localStorage.getItem('cr_leaderboard') || '[]');
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
          <td style="color:var(--neon-cyan); font-family:var(--font-mono); font-weight:800;">Lvl ${r.level}</td>
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
      url.searchParams.set('vs', this.level);
      url.searchParams.set('challenger', 'Player');
      return url.toString();
    }

    copyChallengeLink() {
      const link = this.getShareableLink();
      navigator.clipboard.writeText(link).then(() => {
        this.showToast(`Copied Duel Link! Beat Level ${this.level}`);
      });
    }

    shareWhatsApp() {
      const rank = getRank(this.level);
      const link = this.getShareableLink();
      const text = `🎨 COLOR RUSH: I reached Level ${this.level} (${rank.title} ${rank.icon})! Can your optical vision beat me? Play here:\n${link}`;
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
    }

    exportResultCard() {
      const canvas = document.getElementById('share-card-canvas');
      const ctx = canvas.getContext('2d');
      const rank = getRank(this.level);

      const grad = ctx.createLinearGradient(0, 0, 1200, 675);
      grad.addColorStop(0, '#090a0f');
      grad.addColorStop(1, '#0e1726');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1200, 675);

      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 6;
      ctx.strokeRect(30, 30, 1140, 615);

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 42px Outfit, sans-serif';
      ctx.fillText("COLOR ", 70, 95);
      ctx.fillStyle = '#00f0ff';
      ctx.fillText("RUSH", 220, 95);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '700 24px Outfit, sans-serif';
      ctx.fillText("OPTICAL DISCRIMINATION RECORD", 70, 240);

      ctx.fillStyle = '#00f0ff';
      ctx.font = '900 130px "Space Grotesk", monospace';
      ctx.fillText(`LVL ${this.level}`, 70, 360);

      ctx.fillStyle = '#181d2e';
      ctx.fillRect(660, 180, 480, 220);
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
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
      link.download = `color-rush-level-${this.level}.png`;
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
  }

  document.addEventListener('DOMContentLoaded', () => {
    window.game = new ColorRushGame();
  });
})();
