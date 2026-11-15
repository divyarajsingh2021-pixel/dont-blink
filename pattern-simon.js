/**
 * PATTERN SIMON — Audiovisual Working Memory Sequence Recall Engine
 * Dual-coded audio frequencies, 4-quadrant chromatic animations,
 * sequential playback, particle bursts, and viral duel links.
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
      // Harmonic tones for Green, Red, Yellow, Blue
      this.padFreqs = [329.63, 440.00, 554.37, 659.25]; // E4, A4, C#5, E5
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

    playPad(padIdx) {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const freq = this.padFreqs[padIdx] || 440;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    }

    playRoundSuccess() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const start = now + i * 0.06;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.12, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.12);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(start);
        osc.stop(start + 0.12);
      });
    }

    playGameOver() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.4);

      gain.gain.setValueAtTime(0.28, now);
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
  // 2. Particle Engine
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

    burst(x, y, color = '#a855f7', count = 22) {
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
        p.vy += 0.12;
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
  // 3. Pattern Simon Game App
  // =========================================================================
  class PatternSimonApp {
    constructor() {
      this.sound = new SoundFX();
      this.particles = new ParticleEngine('particle-canvas');

      // Colors for pads: Green, Red, Yellow, Blue
      this.padColors = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6'];

      // Game state
      this.isPlaying = false;
      this.isPlayerTurn = false;
      this.sequence = [];
      this.playerStep = 0;
      this.totalTaps = 0;
      this.bestScore = parseInt(localStorage.getItem('db_simon_best') || '0', 10);

      // Challenger
      this.rivalTarget = null;
      this.rivalName = null;

      // DOM Elements
      this.dom = {
        btnStart: document.getElementById('btn-start'),
        stageIntro: document.getElementById('stage-intro'),
        hudScore: document.getElementById('hud-score'),
        hudStatus: document.getElementById('hud-status'),
        hudStep: document.getElementById('hud-step'),
        hudBest: document.getElementById('hud-best'),
        centerCounter: document.getElementById('center-counter'),
        pads: [
          document.getElementById('pad-0'),
          document.getElementById('pad-1'),
          document.getElementById('pad-2'),
          document.getElementById('pad-3')
        ],
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
        finalTaps: document.getElementById('final-taps'),
        finalMistake: document.getElementById('final-mistake'),
        finalCapacity: document.getElementById('final-capacity'),
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
      this.dom.hudBest.textContent = this.bestScore;
      this.parseUrlChallenge();
      this.bindEvents();
    }

    bindEvents() {
      this.dom.btnStart.addEventListener('click', () => this.startGame());

      this.dom.pads.forEach((pad, idx) => {
        pad.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          this.handlePadInput(idx);
        });
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

      // Keyboard Controls
      window.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
          e.preventDefault();
          if (!this.isPlaying && this.dom.gameOverModal.classList.contains('hidden')) {
            this.startGame();
          } else if (!this.dom.gameOverModal.classList.contains('hidden')) {
            this.dom.gameOverModal.classList.add('hidden');
            this.startGame();
          }
          return;
        }

        if (!this.isPlaying || !this.isPlayerTurn) return;

        let padIdx = -1;
        if (e.code === 'KeyQ' || e.code === 'Numpad7') padIdx = 0;
        else if (e.code === 'KeyW' || e.code === 'Numpad8') padIdx = 1;
        else if (e.code === 'KeyA' || e.code === 'Numpad4') padIdx = 2;
        else if (e.code === 'KeyS' || e.code === 'Numpad5') padIdx = 3;

        if (padIdx !== -1) {
          e.preventDefault();
          this.handlePadInput(padIdx);
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
        this.dom.challengeBadgeText.textContent = `Target: ${vs} Steps`;

        this.dom.challengerName.textContent = by;
        this.dom.challengerScore.textContent = `${vs} steps`;
        this.dom.incomingBanner.classList.remove('hidden');
      }
    }

    startGame() {
      this.sound.init();
      this.isPlaying = true;
      this.sequence = [];
      this.playerStep = 0;
      this.totalTaps = 0;

      this.dom.stageIntro.classList.remove('active');
      this.dom.gameOverModal.classList.add('hidden');

      this.dom.hudScore.textContent = '0';
      this.dom.centerCounter.textContent = '0';
      this.dom.hudStep.textContent = '0 / 0';

      this.nextRound();
    }

    nextRound() {
      this.isPlayerTurn = false;
      this.playerStep = 0;
      this.dom.hudStatus.textContent = 'WATCH...';
      this.dom.hudStatus.style.color = '#f59e0b';

      // Add a random pad (0, 1, 2, 3) to sequence
      const nextPad = Math.floor(Math.random() * 4);
      this.sequence.push(nextPad);

      const len = this.sequence.length;
      this.dom.hudScore.textContent = (len - 1).toString();
      this.dom.centerCounter.textContent = len.toString();
      this.dom.hudStep.textContent = `0 / ${len}`;

      // Delay slightly before playing sequence
      setTimeout(() => this.playSequence(), 600);
    }

    playSequence() {
      let i = 0;
      // Interval speeds up as sequence grows longer
      const stepDuration = Math.max(260, 480 - this.sequence.length * 12);
      const gapDuration = 120;

      const playNextStep = () => {
        if (!this.isPlaying) return;

        if (i >= this.sequence.length) {
          // Playback finished -> Player turn starts!
          this.isPlayerTurn = true;
          this.dom.hudStatus.textContent = 'YOUR TURN';
          this.dom.hudStatus.style.color = '#10b981';
          return;
        }

        const padIdx = this.sequence[i];
        this.flashPad(padIdx, stepDuration);
        i++;

        setTimeout(playNextStep, stepDuration + gapDuration);
      };

      playNextStep();
    }

    flashPad(padIdx, duration = 300) {
      const pad = this.dom.pads[padIdx];
      if (!pad) return;

      this.sound.playPad(padIdx);
      pad.classList.add('active');

      // Visual particle flash
      const rect = pad.getBoundingClientRect();
      this.particles.burst(rect.left + rect.width / 2, rect.top + rect.height / 2, this.padColors[padIdx], 10);

      setTimeout(() => {
        pad.classList.remove('active');
      }, duration);
    }

    handlePadInput(padIdx) {
      if (!this.isPlaying || !this.isPlayerTurn) return;

      this.flashPad(padIdx, 200);
      this.totalTaps++;

      const expected = this.sequence[this.playerStep];

      if (padIdx === expected) {
        // Correct step!
        this.playerStep++;
        this.dom.hudStep.textContent = `${this.playerStep} / ${this.sequence.length}`;

        if (this.playerStep >= this.sequence.length) {
          // Round completed successfully!
          this.isPlayerTurn = false;
          this.dom.hudStatus.textContent = 'PERFECT!';
          this.dom.hudStatus.style.color = '#10b981';
          this.sound.playRoundSuccess();

          const score = this.sequence.length;
          this.dom.hudScore.textContent = score.toString();

          setTimeout(() => this.nextRound(), 900);
        }
      } else {
        // Wrong step! Game over
        this.endGame(this.playerStep + 1);
      }
    }

    endGame(mistakeAtStep) {
      this.isPlaying = false;
      this.isPlayerTurn = false;
      this.sound.playGameOver();

      const finalScore = Math.max(0, this.sequence.length - 1);
      const isNewPb = finalScore > this.bestScore;
      if (isNewPb) {
        this.bestScore = finalScore;
        localStorage.setItem('db_simon_best', this.bestScore.toString());
        this.dom.hudBest.textContent = this.bestScore;
      }

      // Save to Leaderboard
      this.saveScoreToLeaderboard(finalScore, this.totalTaps);

      // Rank & percentile
      const rankData = this.calculateRank(finalScore);

      // Populate Result Modal
      this.dom.finalScore.textContent = finalScore;
      this.dom.finalTaps.textContent = this.totalTaps;
      this.dom.finalMistake.textContent = `Step ${mistakeAtStep}`;

      const deltaMiller = finalScore - 7;
      this.dom.finalCapacity.textContent = deltaMiller >= 0 ? `Miller +${deltaMiller}` : `Miller ${deltaMiller}`;

      if (isNewPb && finalScore > 0) {
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
        if (finalScore > this.rivalTarget) {
          const diff = finalScore - this.rivalTarget;
          this.dom.rivalOutcomeText.textContent = `You beat ${this.rivalName} by ${diff} step${diff > 1 ? 's' : ''}! 🏆`;
          this.dom.rivalOutcomeText.style.color = '#10b981';
        } else if (finalScore === this.rivalTarget) {
          this.dom.rivalOutcomeText.textContent = `Dead tie with ${this.rivalName} at ${finalScore} steps! 🤝`;
          this.dom.rivalOutcomeText.style.color = '#f59e0b';
        } else {
          const diff = this.rivalTarget - finalScore;
          this.dom.rivalOutcomeText.textContent = `${this.rivalName} leads by ${diff} step${diff > 1 ? 's' : ''}. Rematch! ⚔️`;
          this.dom.rivalOutcomeText.style.color = '#ef4444';
        }
      } else {
        this.dom.rivalBox.classList.add('hidden');
      }

      setTimeout(() => {
        this.dom.gameOverModal.classList.remove('hidden');
      }, 600);
    }

    calculateRank(score) {
      if (score >= 18) {
        return {
          tier: 'TIER S+',
          title: 'EIDETIC POLYMATH',
          icon: '👑',
          percentile: 'Top 0.5% Audiovisual Working Memory',
          quote: '"Your brain memorized continuous sensory streams like lossless digital audio."'
        };
      } else if (score >= 14) {
        return {
          tier: 'TIER S',
          title: 'CHUNKING MASTER',
          icon: '⚡',
          percentile: 'Top 4% Memory Capacity',
          quote: '"Sublime dual-coding efficiency. You easily shattered Miller’s Law baseline."'
        };
      } else if (score >= 10) {
        return {
          tier: 'TIER A',
          title: 'NEURAL ENCODER',
          icon: '🔮',
          percentile: 'Top 20% Memory Capacity',
          quote: '"High working memory stamina. Solid sensory chunking rhythm."'
        };
      } else if (score >= 7) {
        return {
          tier: 'TIER B',
          title: 'MEMORY APPRENTICE',
          icon: '🧠',
          percentile: 'Top 50% Population Baseline',
          quote: '"Reached Miller’s magical number 7. Practice chunking into triplets to push higher."'
        };
      } else {
        return {
          tier: 'TIER C',
          title: 'SENSORY ROOKIE',
          icon: '🌱',
          percentile: 'Top 85% Memory Capacity',
          quote: '"Distractions easily clear the phonological loop. Focus on the pitch melodies."'
        };
      }
    }

    saveScoreToLeaderboard(score, taps) {
      if (score <= 0) return;
      try {
        const list = JSON.parse(localStorage.getItem('db_simon_scores') || '[]');
        const rank = this.calculateRank(score).title;
        list.push({
          score: score,
          taps: taps,
          rank: rank,
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        });
        list.sort((a, b) => b.score - a.score);
        const top10 = list.slice(0, 10);
        localStorage.setItem('db_simon_scores', JSON.stringify(top10));
      } catch (e) {
        console.error('Failed to save score:', e);
      }
    }

    showLeaderboard() {
      const tbody = this.dom.leaderboardTbody;
      tbody.innerHTML = '';
      try {
        const list = JSON.parse(localStorage.getItem('db_simon_scores') || '[]');
        if (list.length === 0) {
          this.dom.leaderboardEmpty.classList.remove('hidden');
        } else {
          this.dom.leaderboardEmpty.classList.add('hidden');
          list.forEach((item, idx) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
              <td><strong>#${idx + 1}</strong></td>
              <td style="color:#a855f7; font-weight:800;">${item.score} steps</td>
              <td>${item.taps} taps</td>
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
      const score = Math.max(0, this.sequence.length - 1);
      return `${base}?vs=${score}&by=Player`;
    }

    shareWhatsApp() {
      const duelUrl = this.getDuelUrl();
      const score = Math.max(0, this.sequence.length - 1);
      const text = `🔮 I recalled a ${score}-step sequence in PATTERN SIMON! Can your working memory beat mine? Accept my challenge: ${duelUrl}`;
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
      const score = Math.max(0, this.sequence.length - 1);

      // Background gradient
      const bgGrad = ctx.createLinearGradient(0, 0, w, h);
      bgGrad.addColorStop(0, '#090a0f');
      bgGrad.addColorStop(0.5, '#190d2e');
      bgGrad.addColorStop(1, '#090a0f');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Cyber grid lines
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.08)';
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
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 4;
      ctx.strokeRect(20, 20, w - 40, h - 40);

      // Header Brand
      ctx.fillStyle = '#a855f7';
      ctx.font = 'bold 36px "Space Grotesk", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('🔮 PATTERN SIMON', 60, 90);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '20px "Space Grotesk", sans-serif';
      ctx.fillText('AUDIOVISUAL SEQUENCE RECALL • DONT-BLINK ARCADE', 60, 125);

      // Score Hero
      ctx.fillStyle = '#f3f4f6';
      ctx.font = 'bold 24px "Space Grotesk", sans-serif';
      ctx.fillText('SEQUENCE LENGTH RECALLED', 60, 220);

      ctx.fillStyle = '#a855f7';
      ctx.font = 'bold 120px "Space Grotesk", sans-serif';
      ctx.fillText(score.toString(), 60, 340);

      // Rank & Percentile
      const rank = this.calculateRank(score);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 42px "Space Grotesk", sans-serif';
      ctx.fillText(`${rank.icon} ${rank.tier}: ${rank.title}`, 60, 420);

      ctx.fillStyle = '#38bdf8';
      ctx.font = '26px "Space Grotesk", sans-serif';
      ctx.fillText(rank.percentile, 60, 465);

      // Performance Stats
      ctx.fillStyle = '#94a3b8';
      ctx.font = '22px "Space Grotesk", sans-serif';
      ctx.fillText(`Total Taps: ${this.totalTaps}   •   Miller Standard: +${Math.max(0, score - 7)}`, 60, 520);

      // Call to Action
      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 26px "Space Grotesk", sans-serif';
      ctx.fillText('CAN YOU OUT-MEMORIZE ME? Play free at dont-blink-two.vercel.app/pattern-simon', 60, 600);

      // Trigger download
      try {
        const link = document.createElement('a');
        link.download = `pattern-simon-score-${score}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        this.showToast('📸 Result card exported successfully!');
      } catch (err) {
        console.error('Card export error:', err);
        this.showToast('Card download failed');
      }
    }
  }

  // Initialize once DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new PatternSimonApp());
  } else {
    new PatternSimonApp();
  }
})();
