/**
 * MATH SPRINT — 2-Second Rapid Mental Arithmetic Arcade Engine
 * Dynamic equation generation, deceptively close false answers,
 * shrinking time bar, Web Audio synthesizer, canvas particles,
 * Hall of Fame leaderboard, and viral duel links.
 */

(() => {
  'use strict';

  // =========================================================================
  // 1. Audio Engine (Web Audio API - Zero External Files)
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
      const now = this.ctx.currentTime;
      
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';
      osc1.frequency.setValueAtTime(587.33, now); // D5
      osc1.frequency.exponentialRampToValueAtTime(880.00, now + 0.1); // A5
      osc2.frequency.setValueAtTime(880.00, now);
      osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.1); // D6

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.14);
      osc2.stop(now + 0.14);
    }

    playWrong() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.25);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    }

    playTick() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(700, now);

      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.03);
    }

    playGameOver() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const notes = [330, 293.66, 261.63, 196]; // E4, D4, C4, G3
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const start = now + idx * 0.12;

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.2, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.22);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(start);
        osc.stop(start + 0.22);
      });
    }

    toggle() {
      this.enabled = !this.enabled;
      localStorage.setItem('db_sound_enabled', this.enabled ? 'true' : 'false');
      return this.enabled;
    }
  }

  // =========================================================================
  // 2. Particle Sparks Canvas
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

    burst(x, y, color = '#f59e0b', count = 24) {
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
      if (!this.animationFrame) {
        this.animate();
      }
    }

    animate() {
      if (!this.ctx) return;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.15; // gravity
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
  // 3. Main Game Logic
  // =========================================================================
  class MathSprintApp {
    constructor() {
      this.sound = new SoundFX();
      this.particles = new ParticleEngine('particle-canvas');

      // Game state
      this.isPlaying = false;
      this.score = 0;
      this.streak = 0;
      this.bestStreak = 0;
      this.bestScore = parseInt(localStorage.getItem('db_math_sprint_best') || '0', 10);
      this.responseTimes = [];
      this.currentQuestionStart = 0;
      this.timeLimitMs = 2500;
      this.timerAnimationId = null;
      this.questionDeadline = 0;

      // Current Equation
      this.currentEquation = null;

      // Challenger
      this.rivalTarget = null;
      this.rivalName = null;

      // DOM Elements
      this.dom = {
        btnStart: document.getElementById('btn-start'),
        stageIntro: document.getElementById('stage-intro'),
        eqText: document.getElementById('eq-text'),
        eqDisplay: document.getElementById('equation-display'),
        timerBar: document.getElementById('timer-bar-fill'),
        btnTrue: document.getElementById('btn-true'),
        btnFalse: document.getElementById('btn-false'),
        hudScore: document.getElementById('hud-score'),
        hudStreak: document.getElementById('hud-streak'),
        hudSpeed: document.getElementById('hud-speed'),
        hudBest: document.getElementById('hud-best'),
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
        finalSpeed: document.getElementById('final-speed'),
        finalStreak: document.getElementById('final-streak'),
        finalCause: document.getElementById('final-cause'),
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
    }

    bindEvents() {
      this.dom.btnStart.addEventListener('click', () => this.startGame());
      this.dom.btnTrue.addEventListener('click', () => this.handleAnswer(true));
      this.dom.btnFalse.addEventListener('click', () => this.handleAnswer(false));

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
        this.showToast(state ? 'Sound Effects Enabled' : 'Sound Muted');
      });

      // Modals
      this.dom.btnLeaderboard.addEventListener('click', () => this.showLeaderboard());
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

      // Keyboard support
      window.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
          if (!this.isPlaying && this.dom.gameOverModal.classList.contains('hidden')) {
            e.preventDefault();
            this.startGame();
          } else if (!this.dom.gameOverModal.classList.contains('hidden')) {
            e.preventDefault();
            this.dom.gameOverModal.classList.add('hidden');
            this.startGame();
          }
          return;
        }

        if (!this.isPlaying) return;

        if (e.code === 'ArrowLeft' || e.code === 'KeyA' || e.key === '1') {
          e.preventDefault();
          this.dom.btnTrue.classList.add('pressed');
          setTimeout(() => this.dom.btnTrue.classList.remove('pressed'), 120);
          this.handleAnswer(true);
        } else if (e.code === 'ArrowRight' || e.code === 'KeyD' || e.key === '2') {
          e.preventDefault();
          this.dom.btnFalse.classList.add('pressed');
          setTimeout(() => this.dom.btnFalse.classList.remove('pressed'), 120);
          this.handleAnswer(false);
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
        this.dom.challengeBadgeText.textContent = `Target: ${vs} Solved`;

        this.dom.challengerName.textContent = by;
        this.dom.challengerScore.textContent = `${vs} equations`;
        this.dom.incomingBanner.classList.remove('hidden');
      }
    }

    startGame() {
      this.sound.init();
      this.isPlaying = true;
      this.score = 0;
      this.streak = 0;
      this.bestStreak = 0;
      this.responseTimes = [];
      this.timeLimitMs = 2500;

      this.dom.stageIntro.classList.remove('active');
      this.dom.gameOverModal.classList.add('hidden');

      this.dom.hudScore.textContent = '0';
      this.dom.hudStreak.textContent = '0 🔥';
      this.dom.hudSpeed.textContent = '-- s';

      this.nextQuestion();
    }

    generateEquation() {
      // Dynamic difficulty scaling
      let op = '+';
      let a = 0;
      let b = 0;
      let correctAns = 0;

      if (this.score < 5) {
        // Easy addition & subtraction
        op = Math.random() < 0.5 ? '+' : '-';
        if (op === '+') {
          a = Math.floor(Math.random() * 12) + 1;
          b = Math.floor(Math.random() * 12) + 1;
          correctAns = a + b;
        } else {
          a = Math.floor(Math.random() * 15) + 5;
          b = Math.floor(Math.random() * a) + 1;
          correctAns = a - b;
        }
      } else if (this.score < 14) {
        // Medium addition, subtraction, simple multiplication
        const rand = Math.random();
        if (rand < 0.4) {
          op = '+';
          a = Math.floor(Math.random() * 30) + 10;
          b = Math.floor(Math.random() * 25) + 5;
          correctAns = a + b;
        } else if (rand < 0.75) {
          op = '-';
          a = Math.floor(Math.random() * 40) + 15;
          b = Math.floor(Math.random() * (a - 5)) + 5;
          correctAns = a - b;
        } else {
          op = '×';
          a = Math.floor(Math.random() * 8) + 2;
          b = Math.floor(Math.random() * 9) + 2;
          correctAns = a * b;
        }
      } else {
        // Hard mode: larger multiplication & addition
        const rand = Math.random();
        if (rand < 0.4) {
          op = '×';
          a = Math.floor(Math.random() * 11) + 2;
          b = Math.floor(Math.random() * 12) + 2;
          correctAns = a * b;
        } else if (rand < 0.7) {
          op = '+';
          a = Math.floor(Math.random() * 60) + 15;
          b = Math.floor(Math.random() * 50) + 15;
          correctAns = a + b;
        } else {
          op = '-';
          a = Math.floor(Math.random() * 90) + 20;
          b = Math.floor(Math.random() * (a - 10)) + 10;
          correctAns = a - b;
        }
      }

      // 50% probability of TRUE or FALSE
      const isActuallyTrue = Math.random() < 0.5;
      let displayedAns = correctAns;

      if (!isActuallyTrue) {
        // Create deceptively close fake answers
        const offsets = [-1, 1, -2, 2, -10, 10];
        let offset = offsets[Math.floor(Math.random() * offsets.length)];
        if (correctAns + offset <= 0) offset = 1;
        displayedAns = correctAns + offset;
      }

      return {
        text: `${a} ${op} ${b} = ${displayedAns}`,
        isTrue: isActuallyTrue
      };
    }

    nextQuestion() {
      this.currentEquation = this.generateEquation();
      this.dom.eqText.textContent = this.currentEquation.text;

      // Pop visual effect
      this.dom.eqDisplay.classList.add('pop');
      setTimeout(() => this.dom.eqDisplay.classList.remove('pop'), 120);

      // Adjust time limit (starts at 2500ms, decreases to 1400ms min)
      this.timeLimitMs = Math.max(1400, 2500 - (this.score * 35));

      const now = performance.now();
      this.currentQuestionStart = now;
      this.questionDeadline = now + this.timeLimitMs;

      this.startTimerLoop();
    }

    startTimerLoop() {
      if (this.timerAnimationId) cancelAnimationFrame(this.timerAnimationId);

      const updateBar = () => {
        if (!this.isPlaying) return;

        const now = performance.now();
        const remaining = Math.max(0, this.questionDeadline - now);
        const ratio = remaining / this.timeLimitMs;

        this.dom.timerBar.style.width = `${ratio * 100}%`;

        // Color transitions
        if (ratio > 0.5) {
          this.dom.timerBar.className = 'timer-bar-fill';
        } else if (ratio > 0.25) {
          this.dom.timerBar.className = 'timer-bar-fill warning';
        } else {
          this.dom.timerBar.className = 'timer-bar-fill danger';
        }

        if (remaining <= 0) {
          this.endGame('Time Out');
          return;
        }

        this.timerAnimationId = requestAnimationFrame(updateBar);
      };

      this.timerAnimationId = requestAnimationFrame(updateBar);
    }

    handleAnswer(userChoice) {
      if (!this.isPlaying) return;

      const responseTime = (performance.now() - this.currentQuestionStart) / 1000;
      this.responseTimes.push(responseTime);

      const isCorrect = (userChoice === this.currentEquation.isTrue);

      if (isCorrect) {
        this.sound.playCorrect();
        this.score++;
        this.streak++;
        if (this.streak > this.bestStreak) this.bestStreak = this.streak;

        // Visual spark
        const rect = this.dom.eqDisplay.getBoundingClientRect();
        this.particles.burst(rect.left + rect.width / 2, rect.top + rect.height / 2, '#10b981', 18);

        // Update HUD
        this.dom.hudScore.textContent = this.score;
        this.dom.hudStreak.textContent = `${this.streak} 🔥`;

        const avgSpeed = (this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length).toFixed(2);
        this.dom.hudSpeed.textContent = `${avgSpeed}s`;

        this.nextQuestion();
      } else {
        this.dom.eqDisplay.classList.add('shake');
        setTimeout(() => this.dom.eqDisplay.classList.remove('shake'), 350);
        this.endGame('Wrong Answer');
      }
    }

    endGame(cause) {
      this.isPlaying = false;
      if (this.timerAnimationId) cancelAnimationFrame(this.timerAnimationId);

      this.sound.playWrong();
      setTimeout(() => this.sound.playGameOver(), 200);

      const rect = this.dom.eqDisplay.getBoundingClientRect();
      this.particles.burst(rect.left + rect.width / 2, rect.top + rect.height / 2, '#ef4444', 36);

      // Check high score
      const isNewPb = this.score > this.bestScore;
      if (isNewPb) {
        this.bestScore = this.score;
        localStorage.setItem('db_math_sprint_best', this.bestScore.toString());
        this.dom.hudBest.textContent = this.bestScore;
      }

      const avgSpeed = this.responseTimes.length > 0
        ? (this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length).toFixed(2)
        : '0.00';

      // Save to Leaderboard
      this.saveScoreToLeaderboard(this.score, avgSpeed);

      // Calculate Rank & Percentile
      const rankData = this.calculateRank(this.score);

      // Populate Result Modal
      this.dom.finalScore.textContent = this.score;
      this.dom.finalSpeed.textContent = `${avgSpeed}s`;
      this.dom.finalStreak.textContent = `${this.bestStreak} 🔥`;
      this.dom.finalCause.textContent = cause;

      if (isNewPb && this.score > 0) {
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
        if (this.score > this.rivalTarget) {
          const diff = this.score - this.rivalTarget;
          this.dom.rivalOutcomeText.textContent = `You beat ${this.rivalName} by ${diff} equation${diff > 1 ? 's' : ''}! 🏆`;
          this.dom.rivalOutcomeText.style.color = '#10b981';
        } else if (this.score === this.rivalTarget) {
          this.dom.rivalOutcomeText.textContent = `Dead heat tie with ${this.rivalName} at ${this.score}! 🤝`;
          this.dom.rivalOutcomeText.style.color = '#f59e0b';
        } else {
          const diff = this.rivalTarget - this.score;
          this.dom.rivalOutcomeText.textContent = `${this.rivalName} leads by ${diff} equation${diff > 1 ? 's' : ''}. Rematch! ⚔️`;
          this.dom.rivalOutcomeText.style.color = '#ef4444';
        }
      } else {
        this.dom.rivalBox.classList.add('hidden');
      }

      setTimeout(() => {
        this.dom.gameOverModal.classList.remove('hidden');
      }, 500);
    }

    calculateRank(score) {
      if (score >= 35) {
        return {
          tier: 'TIER S+',
          title: 'QUANTUM ARITHMETICIAN',
          icon: '👑',
          percentile: 'Top 0.5% Rapid Math Reflexes',
          quote: '"Your brain processes mathematical truth faster than silicone chips."'
        };
      } else if (score >= 26) {
        return {
          tier: 'TIER S',
          title: 'SPEED NUMERIST',
          icon: '⚡',
          percentile: 'Top 3% Mental Calculation',
          quote: '"Sub-second optical equation evaluation. Absolutely lethal reflex speed."'
        };
      } else if (score >= 18) {
        return {
          tier: 'TIER A',
          title: 'NEURAL SCHOLAR',
          icon: '🧠',
          percentile: 'Top 15% Arithmetic Speed',
          quote: '"High computational dexterity. Your focus withstood intense time pressure."'
        };
      } else if (score >= 10) {
        return {
          tier: 'TIER B',
          title: 'CALCULATOR APPRENTICE',
          icon: '📊',
          percentile: 'Top 45% Mental Speed',
          quote: '"Solid arithmetic foundation. Train your 1-second reflexes to reach Tier S."'
        };
      } else {
        return {
          tier: 'TIER C',
          title: 'NUMBER NOVICE',
          icon: '🌱',
          percentile: 'Top 85% Arithmetic Speed',
          quote: '"The 2-second timer is unforgiving. Keep practicing to build numerical instincts."'
        };
      }
    }

    saveScoreToLeaderboard(score, avgSpeed) {
      if (score <= 0) return;
      try {
        const list = JSON.parse(localStorage.getItem('db_math_sprint_scores') || '[]');
        const rank = this.calculateRank(score).title;
        list.push({
          score: score,
          speed: avgSpeed,
          rank: rank,
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        });
        list.sort((a, b) => b.score - a.score);
        const top10 = list.slice(0, 10);
        localStorage.setItem('db_math_sprint_scores', JSON.stringify(top10));
      } catch (e) {
        console.error('Failed to save score:', e);
      }
    }

    showLeaderboard() {
      const tbody = this.dom.leaderboardTbody;
      tbody.innerHTML = '';
      try {
        const list = JSON.parse(localStorage.getItem('db_math_sprint_scores') || '[]');
        if (list.length === 0) {
          this.dom.leaderboardEmpty.classList.remove('hidden');
        } else {
          this.dom.leaderboardEmpty.classList.add('hidden');
          list.forEach((item, idx) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
              <td><strong>#${idx + 1}</strong></td>
              <td style="color:var(--neon-amber); font-weight:800;">${item.score} pts</td>
              <td>${item.speed}s</td>
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
      return `${base}?vs=${this.score}&by=Player`;
    }

    shareWhatsApp() {
      const duelUrl = this.getDuelUrl();
      const text = `🔢 I just solved ${this.score} rapid equations in MATH SPRINT! Can your brain calculate faster than mine? Accept my challenge: ${duelUrl}`;
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
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.08)';
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
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 4;
      ctx.strokeRect(20, 20, w - 40, h - 40);

      // Header Brand
      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 36px "Space Grotesk", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('🔢 MATH SPRINT', 60, 90);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '20px "Space Grotesk", sans-serif';
      ctx.fillText('NEURAL ARITHMETIC BENCHMARK • DONT-BLINK ARCADE', 60, 125);

      // Score Hero
      ctx.fillStyle = '#f3f4f6';
      ctx.font = 'bold 24px "Space Grotesk", sans-serif';
      ctx.fillText('RAPID EQUATIONS SOLVED', 60, 220);

      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 120px "Space Grotesk", sans-serif';
      ctx.fillText(this.score.toString(), 60, 340);

      // Rank & Percentile
      const rank = this.calculateRank(this.score);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 42px "Space Grotesk", sans-serif';
      ctx.fillText(`${rank.icon} ${rank.tier}: ${rank.title}`, 60, 420);

      ctx.fillStyle = '#38bdf8';
      ctx.font = '26px "Space Grotesk", sans-serif';
      ctx.fillText(rank.percentile, 60, 465);

      // Performance Stats
      const avgSpeed = this.responseTimes.length > 0
        ? (this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length).toFixed(2)
        : '0.00';

      ctx.fillStyle = '#94a3b8';
      ctx.font = '22px "Space Grotesk", sans-serif';
      ctx.fillText(`Avg Speed: ${avgSpeed}s   •   Max Streak: ${this.bestStreak} 🔥`, 60, 520);

      // Call to Action
      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 26px "Space Grotesk", sans-serif';
      ctx.fillText('CAN YOU BEAT MY RECORD? Play free at dont-blink-two.vercel.app/math-sprint', 60, 600);

      // Trigger download
      try {
        const link = document.createElement('a');
        link.download = `math-sprint-score-${this.score}.png`;
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
    document.addEventListener('DOMContentLoaded', () => new MathSprintApp());
  } else {
    new MathSprintApp();
  }
})();
