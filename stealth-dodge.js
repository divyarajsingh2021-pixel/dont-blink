/**
 * STEALTH DODGE — Continuous Spatial Obstacle Evasion Engine
 * Closed-loop motor tracking, procedural hazard patterns,
 * close-shave graze mechanics, Web Audio synthesizers, and viral duel links.
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

    playGraze() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(987.77, now); // B5
      osc.frequency.exponentialRampToValueAtTime(1318.51, now + 0.08); // E6

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.08);
    }

    playSpeedAlert() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.15);
    }

    playCrash() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.45);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.45);
    }

    toggle() {
      this.enabled = !this.enabled;
      localStorage.setItem('db_sound_enabled', this.enabled ? 'true' : 'false');
      return this.enabled;
    }
  }

  // =========================================================================
  // 2. Global Particle Engine
  // =========================================================================
  class ParticleEngine {
    constructor(canvasId) {
      this.canvas = document.getElementById(canvasId);
      this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
      this.particles = [];
      this.animationFrame = null;
      this.resize();
      window.addEventListener('resize', () => this.resize());
    }

    resize() {
      if (!this.canvas) return;
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    }

    burst(x, y, color = '#06b6d4', count = 24) {
      if (!this.ctx) return;
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 6;
        this.particles.push({
          x: x,
          y: y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1.0,
          decay: 0.02 + Math.random() * 0.03,
          size: 3 + Math.random() * 4,
          color: color
        });
      }
      if (!this.animationFrame) this.animate();
    }

    animate() {
      if (!this.ctx) return;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;

        if (p.life <= 0) {
          this.particles.splice(i, 1);
          continue;
        }

        this.ctx.save();
        this.ctx.globalAlpha = p.life;
        this.ctx.fillStyle = p.color;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
      }

      if (this.particles.length > 0) {
        this.animationFrame = requestAnimationFrame(() => this.animate());
      } else {
        this.animationFrame = null;
      }
    }
  }

  // =========================================================================
  // 3. Stealth Dodge Simulation Engine
  // =========================================================================
  class StealthDodgeApp {
    constructor() {
      this.sound = new SoundFX();
      this.particles = new ParticleEngine('particle-canvas');

      this.canvas = document.getElementById('dodge-canvas');
      this.ctx = this.canvas.getContext('2d');
      this.width = this.canvas.width;
      this.height = this.canvas.height;

      // Pilot Craft
      this.ship = {
        x: this.width / 2,
        y: this.height - 80,
        radius: 12,
        targetX: this.width / 2,
        targetY: this.height - 80,
        trail: []
      };

      // Hazards & Spawning
      this.hazards = [];
      this.lastSpawnTime = 0;
      this.spawnInterval = 380; // ms

      // Game State
      this.isPlaying = false;
      this.startTime = 0;
      this.elapsedSec = 0;
      this.grazes = 0;
      this.velocityMultiplier = 1.0;
      this.bestTime = parseFloat(localStorage.getItem('db_dodge_best') || '0.00');

      // Key states
      this.keys = {};

      // Challenger
      this.rivalTarget = null;
      this.rivalName = null;

      // DOM Elements
      this.dom = {
        btnStart: document.getElementById('btn-start'),
        stageIntro: document.getElementById('stage-intro'),
        gameArena: document.getElementById('game-arena-wrapper'),
        hudScore: document.getElementById('hud-score'),
        hudGrazes: document.getElementById('hud-grazes'),
        hudVelocity: document.getElementById('hud-velocity'),
        hudBest: document.getElementById('hud-best'),
        grazeBadge: document.getElementById('graze-floating-badge'),
        soundBtn: document.getElementById('btn-sound'),
        soundIconOn: document.getElementById('sound-icon-on'),
        soundIconOff: document.getElementById('sound-icon-off'),
        challengeBadge: document.getElementById('challenge-badge'),
        challengeBadgeText: document.getElementById('challenge-badge-text'),
        incomingBanner: document.getElementById('incoming-challenge-banner'),
        challengerName: document.getElementById('challenger-name'),
        challengerScore: document.getElementById('challenger-score'),
        btnAcceptChallenge: document.getElementById('btn-accept-challenge'),
        gameOverModal: document.getElementById('game-over-modal'),
        finalScore: document.getElementById('final-score'),
        newPbBadge: document.getElementById('new-pb-badge'),
        finalRankIcon: document.getElementById('final-rank-icon'),
        finalRankTier: document.getElementById('final-rank-tier'),
        finalRankTitle: document.getElementById('final-rank-title'),
        finalGrazes: document.getElementById('final-grazes'),
        finalVelocity: document.getElementById('final-velocity'),
        finalRank: document.getElementById('final-rank'),
        finalPercentile: document.getElementById('final-percentile'),
        finalSassyMsg: document.getElementById('final-sassy-msg'),
        rivalBox: document.getElementById('rival-comparison-box'),
        rivalOutcomeText: document.getElementById('rival-outcome-text'),
        btnRematch: document.getElementById('btn-rematch'),
        btnShareWhatsapp: document.getElementById('btn-share-whatsapp'),
        btnChallengeFriend: document.getElementById('btn-challenge-friend'),
        btnDownloadCard: document.getElementById('btn-download-card'),
        btnLeaderboard: document.getElementById('btn-leaderboard-modal'),
        leaderboardModal: document.getElementById('leaderboard-modal'),
        leaderboardTbody: document.getElementById('leaderboard-tbody'),
        leaderboardEmpty: document.getElementById('leaderboard-empty'),
        toast: document.getElementById('toast'),
        toastMsg: document.getElementById('toast-msg'),
        shareCanvas: document.getElementById('share-card-canvas')
      };

      this.init();
    }

    init() {
      this.updateSoundIcons();
      this.dom.hudBest.textContent = `${this.bestTime.toFixed(2)}s`;
      this.parseUrlChallenge();
      this.bindEvents();
      this.renderLoop();
    }

    bindEvents() {
      this.dom.btnStart.addEventListener('click', () => this.startGame());

      // Mouse / Touch navigation
      const updatePointer = (e) => {
        if (!this.isPlaying) return;
        const rect = this.canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        const scaleX = this.width / rect.width;
        const scaleY = this.height / rect.height;

        this.ship.targetX = Math.max(15, Math.min(this.width - 15, (clientX - rect.left) * scaleX));
        this.ship.targetY = Math.max(20, Math.min(this.height - 20, (clientY - rect.top) * scaleY));
      };

      this.canvas.addEventListener('mousemove', updatePointer);
      this.canvas.addEventListener('touchmove', updatePointer, { passive: false });
      this.canvas.addEventListener('touchstart', updatePointer, { passive: false });

      if (this.dom.btnAcceptChallenge) {
        this.dom.btnAcceptChallenge.addEventListener('click', () => {
          this.dom.incomingBanner.classList.add('hidden');
          this.startGame();
        });
      }

      this.dom.btnRematch.addEventListener('click', () => {
        this.dom.gameOverModal.classList.add('hidden');
        this.startGame();
      });

      this.dom.soundBtn.addEventListener('click', () => {
        const state = this.sound.toggle();
        this.updateSoundIcons();
        this.showToast(state ? 'Sound Enabled' : 'Sound Muted');
      });

      this.dom.btnLeaderboard.addEventListener('click', () => this.showLeaderboard());

      document.querySelectorAll('[data-close]').forEach(btn => {
        btn.addEventListener('click', () => {
          const targetId = btn.getAttribute('data-close');
          const modal = document.getElementById(targetId);
          if (modal) modal.classList.add('hidden');
        });
      });

      // Sharing
      this.dom.btnShareWhatsapp.addEventListener('click', () => this.shareWhatsApp());
      this.dom.btnChallengeFriend.addEventListener('click', () => this.copyDuelLink());
      this.dom.btnDownloadCard.addEventListener('click', () => this.exportResultCard());

      // Keyboard Controls (WASD / Arrows)
      window.addEventListener('keydown', (e) => {
        this.keys[e.code] = true;
        if (e.code === 'Space') {
          e.preventDefault();
          if (!this.isPlaying && this.dom.gameOverModal.classList.contains('hidden')) {
            this.startGame();
          } else if (!this.dom.gameOverModal.classList.contains('hidden')) {
            this.dom.gameOverModal.classList.add('hidden');
            this.startGame();
          }
        }
      });

      window.addEventListener('keyup', (e) => {
        this.keys[e.code] = false;
      });
    }

    updateSoundIcons() {
      if (this.sound.enabled) {
        this.dom.soundIconOn.classList.remove('hidden');
        this.dom.soundIconOff.classList.add('hidden');
      } else {
        this.dom.soundIconOn.classList.add('hidden');
        this.dom.soundIconOff.classList.remove('hidden');
      }
    }

    parseUrlChallenge() {
      const params = new URLSearchParams(window.location.search);
      const vs = parseFloat(params.get('vs'));
      const by = params.get('by') || 'Rival';

      if (!isNaN(vs) && vs > 0) {
        this.rivalTarget = vs;
        this.rivalName = by;

        this.dom.challengeBadge.classList.remove('hidden');
        this.dom.challengeBadgeText.textContent = `Target: ${vs.toFixed(2)}s`;

        this.dom.challengerName.textContent = by;
        this.dom.challengerScore.textContent = `${vs.toFixed(2)}s`;
        this.dom.incomingBanner.classList.remove('hidden');
      }
    }

    startGame() {
      this.sound.init();
      this.isPlaying = true;
      this.startTime = performance.now();
      this.elapsedSec = 0;
      this.grazes = 0;
      this.velocityMultiplier = 1.0;
      this.hazards = [];

      this.ship.x = this.width / 2;
      this.ship.y = this.height - 80;
      this.ship.targetX = this.ship.x;
      this.ship.targetY = this.ship.y;
      this.ship.trail = [];

      this.dom.stageIntro.classList.remove('active');
      this.dom.gameOverModal.classList.add('hidden');

      this.dom.hudScore.textContent = '0.00s';
      this.dom.hudGrazes.textContent = '0 ⚡';
      this.dom.hudVelocity.textContent = '1.0x';
    }

    spawnHazard(now) {
      if (now - this.lastSpawnTime < this.spawnInterval) return;
      this.lastSpawnTime = now;

      // Dynamically accelerate velocity with time
      this.velocityMultiplier = 1.0 + (this.elapsedSec * 0.025);
      this.dom.hudVelocity.textContent = `${this.velocityMultiplier.toFixed(1)}x`;

      const type = Math.random();
      if (type < 0.6) {
        // Standard Laser Orb
        const radius = 9 + Math.random() * 10;
        this.hazards.push({
          type: 'orb',
          x: Math.random() * (this.width - 40) + 20,
          y: -20,
          radius: radius,
          vy: (2.8 + Math.random() * 2.2) * this.velocityMultiplier,
          vx: (Math.random() - 0.5) * 1.5,
          color: '#ef4444',
          grazed: false
        });
      } else if (type < 0.85) {
        // High-Speed Pulsar Needle
        this.hazards.push({
          type: 'laser',
          x: Math.random() * (this.width - 30) + 15,
          y: -40,
          length: 35,
          radius: 6,
          vy: (5.2 + Math.random() * 2.5) * this.velocityMultiplier,
          vx: 0,
          color: '#f59e0b',
          grazed: false
        });
      } else {
        // Sweeping Horizontal Plasma Barrier
        const w = 70 + Math.random() * 40;
        this.hazards.push({
          type: 'bar',
          x: Math.random() * (this.width - w),
          y: -25,
          width: w,
          height: 12,
          radius: 14,
          vy: (2.2 + Math.random() * 1.4) * this.velocityMultiplier,
          vx: (Math.random() < 0.5 ? 1 : -1) * 1.2,
          color: '#ec4899',
          grazed: false
        });
      }
    }

    triggerGraze(hazard) {
      if (hazard.grazed) return;
      hazard.grazed = true;
      this.grazes++;
      this.sound.playGraze();

      this.dom.hudGrazes.textContent = `${this.grazes} ⚡`;
      this.dom.grazeBadge.classList.remove('hidden');
      setTimeout(() => this.dom.grazeBadge.classList.add('hidden'), 500);

      this.particles.burst(this.ship.x, this.ship.y, '#f59e0b', 12);
    }

    endGame() {
      this.isPlaying = false;
      this.sound.playCrash();

      const rect = this.canvas.getBoundingClientRect();
      this.particles.burst(
        rect.left + (this.ship.x / this.width) * rect.width,
        rect.top + (this.ship.y / this.height) * rect.height,
        '#ef4444',
        40
      );

      const isNewPb = this.elapsedSec > this.bestTime;
      if (isNewPb) {
        this.bestTime = this.elapsedSec;
        localStorage.setItem('db_dodge_best', this.bestTime.toString());
        this.dom.hudBest.textContent = `${this.bestTime.toFixed(2)}s`;
      }

      // Save to Leaderboard
      this.saveScoreToLeaderboard(this.elapsedSec, this.grazes);

      // Rank & percentile
      const rankData = this.calculateRank(this.elapsedSec);

      // Populate Result Modal
      this.dom.finalScore.textContent = this.elapsedSec.toFixed(2);
      this.dom.finalGrazes.textContent = `${this.grazes} ⚡`;
      this.dom.finalVelocity.textContent = `${this.velocityMultiplier.toFixed(1)}x`;
      this.dom.finalRank.textContent = rankData.tier;

      if (isNewPb && this.elapsedSec > 0) {
        this.dom.newPbBadge.classList.remove('hidden');
      } else {
        this.dom.newPbBadge.classList.add('hidden');
      }

      this.dom.finalRankIcon.textContent = rankData.icon;
      this.dom.finalRankTier.textContent = rankData.tier;
      this.dom.finalRankTitle.textContent = rankData.title;
      this.dom.finalPercentile.textContent = rankData.percentile;
      this.dom.finalSassyMsg.textContent = rankData.quote;

      // Handle Rival duel check
      if (this.rivalTarget !== null) {
        this.dom.rivalBox.classList.remove('hidden');
        if (this.elapsedSec > this.rivalTarget) {
          const diff = (this.elapsedSec - this.rivalTarget).toFixed(2);
          this.dom.rivalOutcomeText.textContent = `You outlasted ${this.rivalName} by ${diff}s! 🏆`;
          this.dom.rivalOutcomeText.style.color = '#10b981';
        } else {
          const diff = (this.rivalTarget - this.elapsedSec).toFixed(2);
          this.dom.rivalOutcomeText.textContent = `${this.rivalName} leads by ${diff}s. Rematch! ⚔️`;
          this.dom.rivalOutcomeText.style.color = '#ef4444';
        }
      } else {
        this.dom.rivalBox.classList.add('hidden');
      }

      setTimeout(() => {
        this.dom.gameOverModal.classList.remove('hidden');
      }, 700);
    }

    calculateRank(sec) {
      if (sec >= 50.0) {
        return {
          tier: 'TIER S+',
          title: 'APEX INTERCEPTOR',
          icon: '👑',
          percentile: 'Top 0.5% Spatial Evasion Reflex',
          quote: '"Your ocular tracking navigated hyper-dense collision fields with surgical precision."'
        };
      } else if (sec >= 38.0) {
        return {
          tier: 'TIER S',
          title: 'STEALTH ACE',
          icon: '⚡',
          percentile: 'Top 3% Motor Stamina',
          quote: '"Flawless micro-adjustments. You held center gravity under extreme projectile velocity."'
        };
      } else if (sec >= 26.0) {
        return {
          tier: 'TIER A',
          title: 'COMBAT PILOT',
          icon: '🚀',
          percentile: 'Top 18% Spatial Tracking',
          quote: '"Excellent evasive instincts. Pushed deep into the 1.4x velocity wave."'
        };
      } else if (sec >= 16.0) {
        return {
          tier: 'TIER B',
          title: 'CADET DODGER',
          icon: '🛸',
          percentile: 'Top 50% Population Baseline',
          quote: '"Decent survival time. Avoid getting trapped in screen corners."'
        };
      } else {
        return {
          tier: 'TIER C',
          title: 'FLIGHT ROOKIE',
          icon: '🌱',
          percentile: 'Top 85% Spatial Reflexes',
          quote: '"Panic over-steering caused collision. Keep your movements small and smooth."'
        };
      }
    }

    saveScoreToLeaderboard(sec, grazes) {
      if (sec <= 0) return;
      try {
        const list = JSON.parse(localStorage.getItem('db_dodge_scores') || '[]');
        const rank = this.calculateRank(sec).title;
        list.push({
          score: `${sec.toFixed(2)}s`,
          raw: sec,
          grazes: grazes,
          rank: rank,
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        });
        list.sort((a, b) => b.raw - a.raw);
        const top10 = list.slice(0, 10);
        localStorage.setItem('db_dodge_scores', JSON.stringify(top10));
      } catch (e) {
        console.error('Failed to save score:', e);
      }
    }

    showLeaderboard() {
      const tbody = this.dom.leaderboardTbody;
      tbody.innerHTML = '';
      try {
        const list = JSON.parse(localStorage.getItem('db_dodge_scores') || '[]');
        if (list.length === 0) {
          this.dom.leaderboardEmpty.classList.remove('hidden');
        } else {
          this.dom.leaderboardEmpty.classList.add('hidden');
          list.forEach((item, idx) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
              <td><strong>#${idx + 1}</strong></td>
              <td style="color:var(--neon-cyan); font-weight:800;">${item.score}</td>
              <td>${item.grazes} ⚡</td>
              <td>${item.rank}</td>
              <td style="color:var(--text-muted);">${item.date}</td>
            `;
            tbody.appendChild(tr);
          });
        }
      } catch (e) {
        this.dom.leaderboardEmpty.classList.remove('hidden');
      }
      this.dom.leaderboardModal.classList.remove('hidden');
    }

    getDuelUrl() {
      const base = window.location.origin + window.location.pathname;
      return `${base}?vs=${this.elapsedSec.toFixed(2)}&by=Pilot`;
    }

    shareWhatsApp() {
      const duelUrl = this.getDuelUrl();
      const text = `🚀 I survived ${this.elapsedSec.toFixed(2)}s in STEALTH DODGE! Can your spatial reflexes outlast mine? Accept my challenge: ${duelUrl}`;
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
    }

    copyDuelLink() {
      const duelUrl = this.getDuelUrl();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(duelUrl).then(() => {
          this.showToast('⚔️ Duel link copied to clipboard!');
        }).catch(() => {
          this.showToast('Link: ' + duelUrl);
        });
      } else {
        this.showToast('Link: ' + duelUrl);
      }
    }

    showToast(message) {
      this.dom.toastMsg.textContent = message;
      this.dom.toast.classList.remove('hidden');
      setTimeout(() => {
        this.dom.toast.classList.add('hidden');
      }, 2500);
    }

    exportResultCard() {
      const canvas = this.dom.shareCanvas;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const w = canvas.width;
      const h = canvas.height;

      // Background gradient
      const bgGrad = ctx.createLinearGradient(0, 0, w, h);
      bgGrad.addColorStop(0, '#090a0f');
      bgGrad.addColorStop(0.5, '#0b1928');
      bgGrad.addColorStop(1, '#090a0f');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Cyber grid lines
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.08)';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 50) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Border glow
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 4;
      ctx.strokeRect(20, 20, w - 40, h - 40);

      // Header Brand
      ctx.fillStyle = '#06b6d4';
      ctx.font = 'bold 36px "Space Grotesk", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('🚀 STEALTH DODGE', 60, 90);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '20px "Space Grotesk", sans-serif';
      ctx.fillText('SPATIAL EVASION MOTOR BENCHMARK • DONT-BLINK ARCADE', 60, 125);

      // Score Hero
      ctx.fillStyle = '#f3f4f6';
      ctx.font = 'bold 24px "Space Grotesk", sans-serif';
      ctx.fillText('TIME SURVIVED', 60, 220);

      ctx.fillStyle = '#06b6d4';
      ctx.font = 'bold 120px "Space Grotesk", sans-serif';
      ctx.fillText(`${this.elapsedSec.toFixed(2)}s`, 60, 340);

      // Rank & Percentile
      const rank = this.calculateRank(this.elapsedSec);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 42px "Space Grotesk", sans-serif';
      ctx.fillText(`${rank.icon} ${rank.tier}: ${rank.title}`, 60, 420);

      ctx.fillStyle = '#38bdf8';
      ctx.font = '26px "Space Grotesk", sans-serif';
      ctx.fillText(rank.percentile, 60, 465);

      // Performance Stats
      ctx.fillStyle = '#94a3b8';
      ctx.font = '22px "Space Grotesk", sans-serif';
      ctx.fillText(`Grazes: ${this.grazes} ⚡   •   Velocity Reached: ${this.velocityMultiplier.toFixed(1)}x`, 60, 520);

      // Call to Action
      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 26px "Space Grotesk", sans-serif';
      ctx.fillText('CAN YOU OUTLAST MY PILOT RECORD? Play free at dont-blink-two.vercel.app/stealth-dodge', 60, 600);

      // Trigger download
      try {
        const link = document.createElement('a');
        link.download = `stealth-dodge-score-${this.elapsedSec.toFixed(1)}s.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        this.showToast('📸 Result card exported successfully!');
      } catch (err) {
        console.error('Card export error:', err);
        this.showToast('Card download failed');
      }
    }

    renderLoop() {
      const now = performance.now();

      if (this.isPlaying) {
        this.elapsedSec = (now - this.startTime) / 1000;
        this.dom.hudScore.textContent = `${this.elapsedSec.toFixed(2)}s`;

        // Keyboard navigation
        const speed = 6;
        if (this.keys['ArrowLeft'] || this.keys['KeyA']) this.ship.targetX -= speed;
        if (this.keys['ArrowRight'] || this.keys['KeyD']) this.ship.targetX += speed;
        if (this.keys['ArrowUp'] || this.keys['KeyW']) this.ship.targetY -= speed;
        if (this.keys['ArrowDown'] || this.keys['KeyS']) this.ship.targetY += speed;

        this.ship.targetX = Math.max(15, Math.min(this.width - 15, this.ship.targetX));
        this.ship.targetY = Math.max(20, Math.min(this.height - 20, this.ship.targetY));

        // Smooth ship lerp
        this.ship.x += (this.ship.targetX - this.ship.x) * 0.22;
        this.ship.y += (this.ship.targetY - this.ship.y) * 0.22;

        // Trail
        this.ship.trail.push({ x: this.ship.x, y: this.ship.y, alpha: 1.0 });
        if (this.ship.trail.length > 8) this.ship.trail.shift();

        // Spawn hazards
        this.spawnHazard(now);
      }

      // Clear canvas
      this.ctx.clearRect(0, 0, this.width, this.height);

      // Subtle background grid
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      this.ctx.lineWidth = 1;
      for (let x = 0; x < this.width; x += 40) {
        this.ctx.beginPath();
        this.ctx.moveTo(x, 0);
        this.ctx.lineTo(x, this.height);
        this.ctx.stroke();
      }

      // Draw Ship Trail
      for (let i = 0; i < this.ship.trail.length; i++) {
        const t = this.ship.trail[i];
        t.alpha -= 0.08;
        this.ctx.fillStyle = `rgba(6, 182, 212, ${Math.max(0, t.alpha * 0.4)})`;
        this.ctx.beginPath();
        this.ctx.arc(t.x, t.y, this.ship.radius * 0.7, 0, Math.PI * 2);
        this.ctx.fill();
      }

      // Draw Ship
      this.ctx.save();
      this.ctx.translate(this.ship.x, this.ship.y);
      this.ctx.fillStyle = '#06b6d4';
      this.ctx.shadowColor = '#06b6d4';
      this.ctx.shadowBlur = 15;

      // Draw Triangle Ship
      this.ctx.beginPath();
      this.ctx.moveTo(0, -this.ship.radius * 1.3);
      this.ctx.lineTo(-this.ship.radius, this.ship.radius);
      this.ctx.lineTo(this.ship.radius, this.ship.radius);
      this.ctx.closePath();
      this.ctx.fill();

      // Cockpit glow
      this.ctx.fillStyle = '#ffffff';
      this.ctx.beginPath();
      this.ctx.arc(0, 0, 4, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();

      // Update & Draw Hazards
      for (let i = this.hazards.length - 1; i >= 0; i--) {
        const h = this.hazards[i];

        if (this.isPlaying) {
          h.y += h.vy;
          h.x += h.vx;

          // Boundary bounce for bouncing bars
          if (h.type === 'bar') {
            if (h.x < 0 || h.x + h.width > this.width) h.vx *= -1;
          }

          // Check Graze & Collision
          const dist = Math.hypot(this.ship.x - (h.x + (h.width ? h.width / 2 : 0)), this.ship.y - h.y);
          const collisionDist = this.ship.radius + h.radius;
          const grazeDist = collisionDist + 16;

          if (dist < collisionDist) {
            // Collision!
            this.endGame();
            return;
          } else if (dist < grazeDist) {
            this.triggerGraze(h);
          }
        }

        // Draw hazard
        this.ctx.save();
        this.ctx.fillStyle = h.color;
        this.ctx.shadowColor = h.color;
        this.ctx.shadowBlur = 10;

        if (h.type === 'orb') {
          this.ctx.beginPath();
          this.ctx.arc(h.x, h.y, h.radius, 0, Math.PI * 2);
          this.ctx.fill();
        } else if (h.type === 'laser') {
          this.ctx.fillRect(h.x - 3, h.y - h.length, 6, h.length);
        } else if (h.type === 'bar') {
          this.ctx.fillRect(h.x, h.y - h.height / 2, h.width, h.height);
        }

        this.ctx.restore();

        if (h.y > this.height + 50) {
          this.hazards.splice(i, 1);
        }
      }

      requestAnimationFrame(() => this.renderLoop());
    }
  }

  // Initialize once DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new StealthDodgeApp());
  } else {
    new StealthDodgeApp();
  }
})();
