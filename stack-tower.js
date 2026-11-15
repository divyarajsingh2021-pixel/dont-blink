/**
 * STACK TOWER — 2D Timing Reflex Block Stacker
 * Oscillating block physics, sliced overhang mechanics, smooth camera scrolling,
 * Web Audio pentatonic scale feedback, canvas debris, and viral duel links.
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
      // Pentatonic scale frequencies
      this.scale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99, 880.00, 1046.50];
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

    playPlace(combo = 0) {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const noteIdx = Math.min(this.scale.length - 1, combo);
      const freq = this.scale[noteIdx];

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.16);
    }

    playPerfect(combo = 1) {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // Two-note bright harmonic chord
      const noteIdx = Math.min(this.scale.length - 2, combo);
      const f1 = this.scale[noteIdx];
      const f2 = this.scale[noteIdx + 2] || (f1 * 1.5);

      [f1, f2].forEach((freq) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.25);
      });
    }

    playSlice() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.08);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.08);
    }

    playGameOver() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.4);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.4);
    }

    toggle() {
      this.enabled = !this.enabled;
      localStorage.setItem('db_sound_enabled', this.enabled ? 'true' : 'false');
      return this.enabled;
    }
  }

  // =========================================================================
  // 2. Global Particle Sparks Engine
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

    burst(x, y, color = '#06b6d4', count = 20) {
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
          size: 3 + Math.random() * 3,
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
        p.vy += 0.15;
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
  // 3. Stack Tower Engine
  // =========================================================================
  class StackTowerApp {
    constructor() {
      this.sound = new SoundFX();
      this.particles = new ParticleEngine('particle-canvas');

      this.canvas = document.getElementById('tower-canvas');
      this.ctx = this.canvas.getContext('2d');

      // Dimensions
      this.width = this.canvas.width;
      this.height = this.canvas.height;
      this.blockHeight = 24;
      this.baseBlockWidth = 220;

      // Game state
      this.isPlaying = false;
      this.floors = 0;
      this.perfects = 0;
      this.combo = 0;
      this.maxCombo = 0;
      this.bestScore = parseInt(localStorage.getItem('db_stack_tower_best') || '0', 10);

      // Slices / Debris
      this.fallingBlocks = [];

      // Stack structures
      this.blocks = [];
      this.currentBlock = null;
      this.cameraY = 0;
      this.targetCameraY = 0;

      // Challenger
      this.rivalTarget = null;
      this.rivalName = null;

      // DOM Elements
      this.dom = {
        btnStart: document.getElementById('btn-start'),
        stageIntro: document.getElementById('stage-intro'),
        gameArena: document.getElementById('game-arena-wrapper'),
        hudScore: document.getElementById('hud-score'),
        hudPerfects: document.getElementById('hud-perfects'),
        hudCombo: document.getElementById('hud-combo'),
        hudBest: document.getElementById('hud-best'),
        comboBadge: document.getElementById('combo-floating-badge'),
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
        finalPerfects: document.getElementById('final-perfects'),
        finalCombo: document.getElementById('final-combo'),
        finalAccuracy: document.getElementById('final-accuracy'),
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
        btnOpenPrivacy: document.getElementById('btn-open-privacy'),
        privacyModal: document.getElementById('privacy-modal'),
        toast: document.getElementById('toast'),
        toastMsg: document.getElementById('toast-msg'),
        shareCanvas: document.getElementById('share-card-canvas')
      };

      this.init();
    }

    init() {
      this.updateSoundIcons();
      this.dom.hudBest.textContent = this.bestScore;
      this.parseUrlChallenge();
      this.bindEvents();
      this.resetTower();
      this.renderLoop();
    }

    bindEvents() {
      this.dom.btnStart.addEventListener('click', () => this.startGame());

      // Drop on canvas or arena click
      this.dom.gameArena.addEventListener('pointerdown', (e) => {
        if (!this.isPlaying) return;
        e.preventDefault();
        this.dropBlock();
      });

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

      this.dom.soundBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const state = this.sound.toggle();
        this.updateSoundIcons();
        this.showToast(state ? 'Sound Enabled' : 'Sound Muted');
      });

      this.dom.btnLeaderboard.addEventListener('click', (e) => {
        e.stopPropagation();
        this.showLeaderboard();
      });

      this.dom.btnOpenPrivacy.addEventListener('click', () => {
        this.dom.privacyModal.classList.remove('hidden');
      });

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

      // Keyboard space
      window.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
          e.preventDefault();
          if (!this.isPlaying && this.dom.gameOverModal.classList.contains('hidden')) {
            this.startGame();
          } else if (this.isPlaying) {
            this.dropBlock();
          } else if (!this.dom.gameOverModal.classList.contains('hidden')) {
            this.dom.gameOverModal.classList.add('hidden');
            this.startGame();
          }
        }
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
      const vs = parseInt(params.get('vs'), 10);
      const by = params.get('by') || 'Rival';

      if (!isNaN(vs) && vs > 0) {
        this.rivalTarget = vs;
        this.rivalName = by;

        this.dom.challengeBadge.classList.remove('hidden');
        this.dom.challengeBadgeText.textContent = `Target: ${vs} Floors`;

        this.dom.challengerName.textContent = by;
        this.dom.challengerScore.textContent = `${vs} floors`;
        this.dom.incomingBanner.classList.remove('hidden');
      }
    }

    getColor(index) {
      const hue = (180 + index * 12) % 360;
      return `hsl(${hue}, 85%, 60%)`;
    }

    resetTower() {
      this.blocks = [];
      this.fallingBlocks = [];
      this.cameraY = 0;
      this.targetCameraY = 0;

      // Base anchor block
      const baseWidth = this.baseBlockWidth;
      const baseX = (this.width - baseWidth) / 2;
      const baseY = this.height - 60;

      this.blocks.push({
        x: baseX,
        y: baseY,
        width: baseWidth,
        color: this.getColor(0)
      });
    }

    startGame() {
      this.sound.init();
      this.isPlaying = true;
      this.floors = 0;
      this.perfects = 0;
      this.combo = 0;
      this.maxCombo = 0;

      this.dom.stageIntro.classList.remove('active');
      this.dom.gameOverModal.classList.add('hidden');

      this.dom.hudScore.textContent = '0';
      this.dom.hudPerfects.textContent = '0 ✨';
      this.dom.hudCombo.textContent = 'x1';

      this.resetTower();
      this.spawnNextBlock();
    }

    spawnNextBlock() {
      const topBlock = this.blocks[this.blocks.length - 1];
      const y = topBlock.y - this.blockHeight;
      const width = topBlock.width;

      // Speed increases gradually
      const speed = 2.8 + Math.min(6.5, this.floors * 0.12);
      const direction = Math.random() < 0.5 ? 1 : -1;
      const startX = direction === 1 ? -width + 10 : this.width - 10;

      this.currentBlock = {
        x: startX,
        y: y,
        width: width,
        direction: direction,
        speed: speed,
        color: this.getColor(this.blocks.length)
      };

      // Camera target adjusts if tower gets higher than halfway
      const screenY = y - this.targetCameraY;
      if (screenY < 240) {
        this.targetCameraY += (240 - screenY);
      }
    }

    dropBlock() {
      if (!this.isPlaying || !this.currentBlock) return;

      const cur = this.currentBlock;
      const prev = this.blocks[this.blocks.length - 1];
      const offset = cur.x - prev.x;

      // Check if completely missed
      if (Math.abs(offset) >= prev.width) {
        // Complete collapse
        this.fallingBlocks.push({
          x: cur.x,
          y: cur.y,
          width: cur.width,
          height: this.blockHeight,
          vy: 2,
          vx: cur.direction * 3,
          rotation: 0,
          vRot: (Math.random() - 0.5) * 0.1,
          color: cur.color
        });
        this.currentBlock = null;
        this.endGame();
        return;
      }

      // Check for PERFECT placement (under 4px difference)
      if (Math.abs(offset) <= 3.8) {
        this.combo++;
        if (this.combo > this.maxCombo) this.maxCombo = this.combo;
        this.perfects++;

        // Snap block directly
        cur.x = prev.x;

        // Combo bonus: extend width slightly if combo >= 3
        if (this.combo >= 3 && cur.width < this.baseBlockWidth) {
          cur.width = Math.min(this.baseBlockWidth, cur.width + 6);
          cur.x -= 3;
        }

        this.sound.playPerfect(this.combo);

        // Visual flash & combo badge
        this.showComboBadge(`PERFECT! x${this.combo}`);
        const rect = this.canvas.getBoundingClientRect();
        this.particles.burst(rect.left + (cur.x + cur.width / 2) * (rect.width / this.width), rect.top + (cur.y - this.cameraY) * (rect.height / this.height), '#06b6d4', 24);

      } else {
        // Sliced block
        this.combo = 0;
        this.sound.playSlice();

        let newWidth = prev.width - Math.abs(offset);
        let newX = offset > 0 ? cur.x : prev.x;
        let sliceWidth = Math.abs(offset);
        let sliceX = offset > 0 ? prev.x + prev.width : cur.x;

        // Falling slice piece
        this.fallingBlocks.push({
          x: sliceX,
          y: cur.y,
          width: sliceWidth,
          height: this.blockHeight,
          vy: 2,
          vx: offset > 0 ? 3 : -3,
          rotation: 0,
          vRot: (offset > 0 ? 0.05 : -0.05),
          color: cur.color
        });

        cur.x = newX;
        cur.width = newWidth;
      }

      this.blocks.push({
        x: cur.x,
        y: cur.y,
        width: cur.width,
        color: cur.color
      });

      this.floors++;
      this.dom.hudScore.textContent = this.floors;
      this.dom.hudPerfects.textContent = `${this.perfects} ✨`;
      this.dom.hudCombo.textContent = `x${Math.max(1, this.combo)}`;

      this.spawnNextBlock();
    }

    showComboBadge(text) {
      this.dom.comboBadge.textContent = text;
      this.dom.comboBadge.classList.remove('hidden');
      setTimeout(() => {
        this.dom.comboBadge.classList.add('hidden');
      }, 700);
    }

    endGame() {
      this.isPlaying = false;
      this.sound.playGameOver();

      const isNewPb = this.floors > this.bestScore;
      if (isNewPb) {
        this.bestScore = this.floors;
        localStorage.setItem('db_stack_tower_best', this.bestScore.toString());
        this.dom.hudBest.textContent = this.bestScore;
      }

      // Save to Leaderboard
      this.saveScoreToLeaderboard(this.floors, this.perfects);

      // Rank & percentile
      const rankData = this.calculateRank(this.floors);
      const accuracy = this.floors > 0 ? Math.round((this.perfects / this.floors) * 100) : 0;

      // Populate Result Modal
      this.dom.finalScore.textContent = this.floors;
      this.dom.finalPerfects.textContent = `${this.perfects} ✨`;
      this.dom.finalCombo.textContent = `x${this.maxCombo}`;
      this.dom.finalAccuracy.textContent = `${accuracy}%`;

      if (isNewPb && this.floors > 0) {
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
        if (this.floors > this.rivalTarget) {
          const diff = this.floors - this.rivalTarget;
          this.dom.rivalOutcomeText.textContent = `You outstacked ${this.rivalName} by ${diff} floor${diff > 1 ? 's' : ''}! 🏆`;
          this.dom.rivalOutcomeText.style.color = '#10b981';
        } else if (this.floors === this.rivalTarget) {
          this.dom.rivalOutcomeText.textContent = `Dead tie with ${this.rivalName} at ${this.floors} floors! 🤝`;
          this.dom.rivalOutcomeText.style.color = '#f59e0b';
        } else {
          const diff = this.rivalTarget - this.floors;
          this.dom.rivalOutcomeText.textContent = `${this.rivalName} leads by ${diff} floor${diff > 1 ? 's' : ''}. Rematch! ⚔️`;
          this.dom.rivalOutcomeText.style.color = '#ef4444';
        }
      } else {
        this.dom.rivalBox.classList.add('hidden');
      }

      setTimeout(() => {
        this.dom.gameOverModal.classList.remove('hidden');
      }, 700);
    }

    calculateRank(floors) {
      if (floors >= 35) {
        return {
          tier: 'TIER S+',
          title: 'STRATOSPHERE ARCHITECT',
          icon: '👑',
          percentile: 'Top 0.5% Motor Precision',
          quote: '"Your sub-millisecond tap timing constructed a neon skyscraper in the clouds."'
        };
      } else if (floors >= 24) {
        return {
          tier: 'TIER S',
          title: 'SKYLINE MASTER',
          icon: '⚡',
          percentile: 'Top 3% Tower Altitude',
          quote: '"Flawless cadence and rhythm. Very few humans reach this altitude."'
        };
      } else if (floors >= 16) {
        return {
          tier: 'TIER A',
          title: 'PRECISION BUILDER',
          icon: '🏗️',
          percentile: 'Top 15% Timing Reflex',
          quote: '"Impressive streak consistency. Perfect snaps kept your tower wide."'
        };
      } else if (floors >= 9) {
        return {
          tier: 'TIER B',
          title: 'URBAN APPRENTICE',
          icon: '🏙️',
          percentile: 'Top 45% Timing Reflex',
          quote: '"Decent foundation. Work on timing consecutive perfect snaps."'
        };
      } else {
        return {
          tier: 'TIER C',
          title: 'GROUNDWORK ROOKIE',
          icon: '🧱',
          percentile: 'Top 80% Timing Reflex',
          quote: '"The overhang slice is unforgiving. Keep practicing your tap timing."'
        };
      }
    }

    saveScoreToLeaderboard(floors, perfects) {
      if (floors <= 0) return;
      try {
        const list = JSON.parse(localStorage.getItem('db_stack_tower_scores') || '[]');
        const rank = this.calculateRank(floors).title;
        list.push({
          score: floors,
          perfects: perfects,
          rank: rank,
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        });
        list.sort((a, b) => b.score - a.score);
        const top10 = list.slice(0, 10);
        localStorage.setItem('db_stack_tower_scores', JSON.stringify(top10));
      } catch (e) {
        console.error('Failed to save score:', e);
      }
    }

    showLeaderboard() {
      const tbody = this.dom.leaderboardTbody;
      tbody.innerHTML = '';
      try {
        const list = JSON.parse(localStorage.getItem('db_stack_tower_scores') || '[]');
        if (list.length === 0) {
          this.dom.leaderboardEmpty.classList.remove('hidden');
        } else {
          this.dom.leaderboardEmpty.classList.add('hidden');
          list.forEach((item, idx) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
              <td><strong>#${idx + 1}</strong></td>
              <td style="color:var(--neon-cyan); font-weight:800;">${item.score} fl</td>
              <td>${item.perfects} ✨</td>
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
      return `${base}?vs=${this.floors}&by=Player`;
    }

    shareWhatsApp() {
      const duelUrl = this.getDuelUrl();
      const text = `🏗️ I stacked a ${this.floors}-floor tower in STACK TOWER! Can you beat my timing and reach higher? Play: ${duelUrl}`;
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
      bgGrad.addColorStop(0.5, '#12141c');
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
      ctx.fillText('🏗️ STACK TOWER', 60, 90);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '20px "Space Grotesk", sans-serif';
      ctx.fillText('PRECISION TIMING ARCADE • DONT-BLINK PLATFORM', 60, 125);

      // Score Hero
      ctx.fillStyle = '#f3f4f6';
      ctx.font = 'bold 24px "Space Grotesk", sans-serif';
      ctx.fillText('FLOORS STACKED', 60, 220);

      ctx.fillStyle = '#06b6d4';
      ctx.font = 'bold 120px "Space Grotesk", sans-serif';
      ctx.fillText(this.floors.toString(), 60, 340);

      // Rank & Percentile
      const rank = this.calculateRank(this.floors);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 42px "Space Grotesk", sans-serif';
      ctx.fillText(`${rank.icon} ${rank.tier}: ${rank.title}`, 60, 420);

      ctx.fillStyle = '#a855f7';
      ctx.font = '26px "Space Grotesk", sans-serif';
      ctx.fillText(rank.percentile, 60, 465);

      // Performance Stats
      ctx.fillStyle = '#94a3b8';
      ctx.font = '22px "Space Grotesk", sans-serif';
      ctx.fillText(`Perfect Snaps: ${this.perfects} ✨   •   Max Combo: x${this.maxCombo}`, 60, 520);

      // Call to Action
      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 26px "Space Grotesk", sans-serif';
      ctx.fillText('CAN YOU OUTSTACK ME? Play free at dont-blink-two.vercel.app/stack-tower', 60, 600);

      // Trigger download
      try {
        const link = document.createElement('a');
        link.download = `stack-tower-record-${this.floors}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        this.showToast('📸 Result card exported successfully!');
      } catch (err) {
        console.error('Card export error:', err);
        this.showToast('Card download failed');
      }
    }

    renderLoop() {
      // Smooth camera interpolation
      this.cameraY += (this.targetCameraY - this.cameraY) * 0.1;

      // Clear canvas
      this.ctx.clearRect(0, 0, this.width, this.height);

      // Draw subtle background guide lines
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      this.ctx.lineWidth = 1;
      const step = 40;
      for (let y = 0; y < this.height; y += step) {
        this.ctx.beginPath();
        this.ctx.moveTo(0, y);
        this.ctx.lineTo(this.width, y);
        this.ctx.stroke();
      }

      this.ctx.save();
      this.ctx.translate(0, this.cameraY);

      // Draw stacked blocks
      for (let i = 0; i < this.blocks.length; i++) {
        const b = this.blocks[i];
        this.ctx.fillStyle = b.color;
        this.ctx.shadowColor = b.color;
        this.ctx.shadowBlur = 10;
        this.ctx.fillRect(b.x, b.y, b.width, this.blockHeight);

        // Highlight top border
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.fillRect(b.x, b.y, b.width, 2);
      }

      // Draw current moving block
      if (this.isPlaying && this.currentBlock) {
        const cb = this.currentBlock;
        cb.x += cb.direction * cb.speed;

        // Bounce back at screen boundaries
        if (cb.direction === 1 && cb.x + cb.width > this.width + 30) {
          cb.direction = -1;
        } else if (cb.direction === -1 && cb.x < -30) {
          cb.direction = 1;
        }

        this.ctx.fillStyle = cb.color;
        this.ctx.shadowColor = cb.color;
        this.ctx.shadowBlur = 15;
        this.ctx.fillRect(cb.x, cb.y, cb.width, this.blockHeight);

        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        this.ctx.fillRect(cb.x, cb.y, cb.width, 3);
      }

      // Draw falling debris
      for (let i = this.fallingBlocks.length - 1; i >= 0; i--) {
        const fb = this.fallingBlocks[i];
        fb.x += fb.vx;
        fb.y += fb.vy;
        fb.vy += 0.4; // gravity
        fb.rotation += fb.vRot;

        this.ctx.save();
        this.ctx.translate(fb.x + fb.width / 2, fb.y + fb.height / 2);
        this.ctx.rotate(fb.rotation);
        this.ctx.fillStyle = fb.color;
        this.ctx.shadowBlur = 5;
        this.ctx.fillRect(-fb.width / 2, -fb.height / 2, fb.width, fb.height);
        this.ctx.restore();

        if (fb.y - this.cameraY > this.height + 200) {
          this.fallingBlocks.splice(i, 1);
        }
      }

      this.ctx.restore();

      requestAnimationFrame(() => this.renderLoop());
    }
  }

  // Initialize once DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new StackTowerApp());
  } else {
    new StackTowerApp();
  }
})();
