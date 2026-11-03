/**
 * CHIMP MEMORY — Spatial Working Memory Arcade Engine
 * Dynamic grid layout, hide-on-first-tap mechanic, strike system,
 * Web Audio crystal chimes, canvas sparks, and viral duel links.
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

    playCorrect(step = 1) {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;
      const pitch = Math.min(1600, 520 + step * 60);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(pitch, now);
      osc.frequency.exponentialRampToValueAtTime(pitch * 1.25, now + 0.08);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(now + 0.12);
    }

    playStrike() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.linearRampToValueAtTime(90, now + 0.25);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(now + 0.25);
    }

    playLevelClear() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((f, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const startTime = this.ctx.currentTime + i * 0.06;
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, startTime);
        gain.gain.setValueAtTime(0.2, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.2);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.2);
      });
    }

    playGameOver() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const chords = [440, 415.3, 392, 349.23];
      chords.forEach((f, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const startTime = this.ctx.currentTime + i * 0.1;
        osc.type = 'sawtooth';
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

    burst(x, y, count = 22, color = '#a855f7') {
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
  // 3. Chimp Memory Ranks
  // =========================================================================
  const CHIMP_RANKS = [
    { minNum: 12, tier: 'TIER S+', title: 'CHIMP GOD', icon: '🧠', quote: 'Inhuman spatial memory. You easily surpass the Kyoto University primates.', pct: 'Top 0.5%' },
    { minNum: 9, tier: 'TIER S', title: 'CHIMP GENIUS', icon: '🐵', quote: 'True photographic sequence recall. Outstanding frontal lobe working capacity.', pct: 'Top 4%' },
    { minNum: 7, tier: 'TIER A', title: 'SHARP HUMAN', icon: '⚡', quote: 'Above average human retention. Clean, sharp cognitive sequence processing.', pct: 'Top 25%' },
    { minNum: 5, tier: 'TIER B', title: 'CASUAL MEMORY', icon: '🚶', quote: 'Decent organic brain capacity, right around the global human median.', pct: 'Top 65%' },
    { minNum: 0, tier: 'TIER D', title: 'GOLDFISH BRAIN', icon: '🐟', quote: 'Did you forget the positions before you even clicked?', pct: 'Bottom 35%' }
  ];

  function getChimpRank(num) {
    return CHIMP_RANKS.find(r => num >= r.minNum) || CHIMP_RANKS[CHIMP_RANKS.length - 1];
  }

  // =========================================================================
  // 4. Main Controller
  // =========================================================================
  class ChimpMemoryGame {
    constructor() {
      // DOM Elements
      this.chimpGrid = document.getElementById('chimp-grid');
      this.hudScore = document.getElementById('hud-score');
      this.hudStrikes = document.getElementById('hud-strikes');
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
      this.currentNumbers = 4;
      this.expectedNext = 1;
      this.strikes = 0;
      this.maxStrikes = 3;
      this.hasHiddenNumbers = false;
      this.activeTileElements = [];
      this.bestScore = parseInt(localStorage.getItem('cm_best_score') || '0', 10);
      this.rivalTarget = null;

      this.updateSoundIcons();
      this.hudBest.textContent = this.bestScore;
      this.checkUrlChallenge();
      this.bindEvents();
    }

    checkUrlChallenge() {
      const params = new URLSearchParams(window.location.search);
      const vs = params.get('vs');
      const name = params.get('challenger') || 'Rival';
      if (vs && !isNaN(parseInt(vs, 10))) {
        this.rivalTarget = { numbers: parseInt(vs, 10), name };
        this.challengerNameEl.textContent = name;
        this.challengerScoreEl.textContent = `${vs} numbers`;
        this.incomingBanner.classList.remove('hidden');
        this.challengeBadge.classList.remove('hidden');
        this.challengeBadgeText.textContent = `Beat ${vs} Numbers (${name})`;
      }
    }

    bindEvents() {
      this.btnStart.addEventListener('click', () => {
        this.stageIntro.classList.remove('active');
        this.startGame();
      });

      this.btnRematch.addEventListener('click', () => {
        this.gameOverModal.classList.add('hidden');
        this.startGame();
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
        this.startGame();
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

    startGame() {
      this.currentNumbers = 4;
      this.strikes = 0;
      this.renderStrikes();
      this.hudScore.textContent = this.currentNumbers;
      this.renderRound();
    }

    renderRound() {
      this.expectedNext = 1;
      this.hasHiddenNumbers = false;
      this.chimpGrid.innerHTML = '';
      this.activeTileElements = [];

      const totalCells = 40; // 5x8 grid
      const chosenIndices = [];

      // Pick distinct random cell slots
      while (chosenIndices.length < this.currentNumbers) {
        const rand = Math.floor(Math.random() * totalCells);
        if (!chosenIndices.includes(rand)) {
          chosenIndices.push(rand);
        }
      }

      // Build 40 cells
      for (let i = 0; i < totalCells; i++) {
        const cell = document.createElement('div');
        cell.className = 'chimp-cell';

        const numIndex = chosenIndices.indexOf(i);
        if (numIndex !== -1) {
          const numberValue = numIndex + 1; // 1, 2, ... N
          const tile = document.createElement('button');
          tile.className = 'chimp-tile';
          tile.textContent = numberValue;
          tile.setAttribute('data-val', numberValue);

          tile.addEventListener('pointerdown', (e) => {
            this.handleTileClick(e, tile, numberValue);
          });

          cell.appendChild(tile);
          this.activeTileElements.push(tile);
        }

        this.chimpGrid.appendChild(cell);
      }
    }

    handleTileClick(e, tile, val) {
      if (val === this.expectedNext) {
        // Correct tap!
        this.sound.playCorrect(val);
        const rect = tile.getBoundingClientRect();
        this.particles.burst(rect.left + rect.width / 2, rect.top + rect.height / 2, 20, '#a855f7');

        tile.classList.add('solved');

        // On FIRST tap (value 1): hide numbers on all other tiles!
        if (val === 1 && !this.hasHiddenNumbers) {
          this.hasHiddenNumbers = true;
          this.activeTileElements.forEach(t => {
            if (!t.classList.contains('solved')) {
              t.classList.add('hidden-num');
            }
          });
        }

        this.expectedNext++;

        // Completed this number set?
        if (this.expectedNext > this.currentNumbers) {
          this.handleRoundSuccess();
        }
      } else {
        // Wrong tap!
        this.handleWrongTap(tile);
      }
    }

    handleRoundSuccess() {
      this.sound.playLevelClear();
      this.currentNumbers++;
      this.hudScore.textContent = this.currentNumbers;

      setTimeout(() => {
        this.renderRound();
      }, 500);
    }

    handleWrongTap(tile) {
      this.sound.playStrike();
      this.strikes++;
      this.renderStrikes();

      tile.classList.add('shake-tile');

      // Reveal all numbers so player sees the error
      this.activeTileElements.forEach(t => {
        t.classList.remove('hidden-num');
      });

      if ('vibrate' in navigator) {
        try { navigator.vibrate([100, 50, 100]); } catch (_) {}
      }

      if (this.strikes >= this.maxStrikes) {
        setTimeout(() => this.gameOver(), 1200);
      } else {
        setTimeout(() => {
          this.renderRound(); // Retry round with new placement
        }, 1200);
      }
    }

    renderStrikes() {
      const hearts = this.hudStrikes.querySelectorAll('.heart-icon');
      hearts.forEach((h, idx) => {
        if (idx < this.strikes) {
          h.classList.add('lost');
        } else {
          h.classList.remove('lost');
        }
      });
    }

    gameOver() {
      this.sound.playGameOver();
      const finalScore = Math.max(0, this.currentNumbers - 1);

      let isNewPb = false;
      if (finalScore > this.bestScore) {
        this.bestScore = finalScore;
        localStorage.setItem('cm_best_score', finalScore.toString());
        this.hudBest.textContent = this.bestScore;
        isNewPb = true;
      }

      const rank = getChimpRank(finalScore);

      document.getElementById('final-score').textContent = finalScore;
      document.getElementById('final-rank-icon').textContent = rank.icon;
      document.getElementById('final-rank-tier').textContent = rank.tier;
      document.getElementById('final-rank-title').textContent = rank.title;
      document.getElementById('final-sassy-msg').textContent = `"${rank.quote}"`;
      document.getElementById('final-percentile').textContent = `${rank.pct} Spatial Memory`;

      const pbBadge = document.getElementById('new-pb-badge');
      if (isNewPb) {
        pbBadge.classList.remove('hidden');
        this.particles.burst(window.innerWidth / 2, window.innerHeight / 3, 50, '#a855f7');
      } else {
        pbBadge.classList.add('hidden');
      }

      // Rival Duel comparison
      const rivalBox = document.getElementById('rival-comparison-box');
      if (this.rivalTarget) {
        rivalBox.classList.remove('hidden');
        const diff = finalScore - this.rivalTarget.numbers;
        const outcomeEl = document.getElementById('rival-outcome-text');
        if (diff > 0) {
          outcomeEl.innerHTML = `You beat ${this.escapeHtml(this.rivalTarget.name)} by <span style="color:var(--neon-green)">+${diff} numbers</span>! 🏆`;
        } else if (diff === 0) {
          outcomeEl.textContent = `TIE with ${this.rivalTarget.name} at ${finalScore} numbers!`;
        } else {
          outcomeEl.textContent = `${this.rivalTarget.name} remembered ${Math.abs(diff)} more numbers. Try again!`;
        }
      } else {
        rivalBox.classList.add('hidden');
      }

      this.saveLeaderboard(finalScore, rank.title);
      this.gameOverModal.classList.remove('hidden');
    }

    saveLeaderboard(numbers, rankTitle) {
      const records = JSON.parse(localStorage.getItem('cm_leaderboard') || '[]');
      records.push({
        numbers,
        rank: rankTitle,
        date: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      });
      records.sort((a, b) => b.numbers - a.numbers);
      localStorage.setItem('cm_leaderboard', JSON.stringify(records.slice(0, 15)));
    }

    renderLeaderboard() {
      const tbody = document.getElementById('leaderboard-tbody');
      const empty = document.getElementById('leaderboard-empty');
      const records = JSON.parse(localStorage.getItem('cm_leaderboard') || '[]');
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
          <td style="color:var(--neon-purple); font-family:var(--font-mono); font-weight:800;">${r.numbers} Numbers</td>
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
      const score = Math.max(0, this.currentNumbers - 1);
      const url = new URL(window.location.href.split('?')[0]);
      url.searchParams.set('vs', score);
      url.searchParams.set('challenger', 'Player');
      return url.toString();
    }

    copyChallengeLink() {
      const score = Math.max(0, this.currentNumbers - 1);
      const link = this.getShareableLink();
      navigator.clipboard.writeText(link).then(() => {
        this.showToast(`Duel link copied! Beat ${score} Numbers`);
      });
    }

    shareWhatsApp() {
      const score = Math.max(0, this.currentNumbers - 1);
      const rank = getChimpRank(score);
      const link = this.getShareableLink();
      const text = `🧠 CHIMP MEMORY: I remembered ${score} numbers after they vanished (${rank.title} ${rank.icon})! Can your working memory beat a chimp? Play here:\n${link}`;
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
    }

    exportResultCard() {
      const canvas = document.getElementById('share-card-canvas');
      const ctx = canvas.getContext('2d');
      const score = Math.max(0, this.currentNumbers - 1);
      const rank = getChimpRank(score);

      const grad = ctx.createLinearGradient(0, 0, 1200, 675);
      grad.addColorStop(0, '#090a0f');
      grad.addColorStop(1, '#160d26');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1200, 675);

      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 6;
      ctx.strokeRect(30, 30, 1140, 615);

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 42px Outfit, sans-serif';
      ctx.fillText("CHIMP ", 70, 95);
      ctx.fillStyle = '#a855f7';
      ctx.fillText("MEMORY", 220, 95);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '700 24px Outfit, sans-serif';
      ctx.fillText("SPATIAL SEQUENCE CAPACITY", 70, 240);

      ctx.fillStyle = '#a855f7';
      ctx.font = '900 120px "Space Grotesk", monospace';
      ctx.fillText(`${score}`, 70, 360);
      const tw = ctx.measureText(`${score}`).width;
      ctx.fillStyle = '#94a3b8';
      ctx.font = '700 40px "Space Grotesk", monospace';
      ctx.fillText("ITEMS", 85 + tw, 350);

      ctx.fillStyle = '#181d2e';
      ctx.fillRect(660, 180, 480, 220);
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.4)';
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
      link.download = `chimp-memory-${score}-numbers.png`;
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
    window.game = new ChimpMemoryGame();
  });
})();
