/**
 * DON'T BLINK — Premium Reflex Arcade Engine
 * Pure Vanilla JavaScript implementation with Web Audio synthesis,
 * canvas particle explosions, high-precision timing, and viral mechanics.
 */

(() => {
  'use strict';

  // =========================================================================
  // 1. Audio Synthesis Engine (Zero External Audio Files Needed)
  // =========================================================================
  class SoundFX {
    constructor() {
      this.ctx = null;
      this.enabled = true;
    }

    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    playClick() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.04);
    }

    playGo() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now); // A5
      osc.frequency.exponentialRampToValueAtTime(1760, now + 0.08); // A6
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(now + 0.2);
    }

    playFakeFlash() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(240, now);
      osc.frequency.linearRampToValueAtTime(180, now + 0.15);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(now + 0.18);
    }

    playFalseStart() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(70, now + 0.35);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(now + 0.35);
    }

    playRoundSuccess() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
      notes.forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const startTime = this.ctx.currentTime + i * 0.06;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0.2, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.2);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.2);
      });
    }

    playFanfare() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const chords = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      chords.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const startTime = this.ctx.currentTime + idx * 0.09;
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0.25, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.4);
      });
    }

    playAchievement() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const notes = [783.99, 987.77, 1174.66, 1567.98]; // G5, B5, D6, G6
      notes.forEach((f, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const startTime = this.ctx.currentTime + i * 0.08;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, startTime);
        gain.gain.setValueAtTime(0.22, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.35);
      });
    }
  }

  // =========================================================================
  // 2. Particle Explosions (HTML5 Canvas)
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

    burst(x, y, count = 40, colors = ['#00ff66', '#00f0ff', '#ffffff']) {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 8 + 2;
        this.particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: Math.random() * 5 + 3,
          color: colors[Math.floor(Math.random() * colors.length)],
          alpha: 1,
          decay: Math.random() * 0.025 + 0.015,
        });
      }
      if (!this.animId) {
        this.loop();
      }
    }

    loop() {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.12; // light gravity
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          this.particles.splice(i, 1);
          continue;
        }

        this.ctx.save();
        this.ctx.globalAlpha = p.alpha;
        this.ctx.fillStyle = p.color;
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = p.color;
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
  // 3. Benchmarks, Ranking & Sassy Persona
  // =========================================================================
  const BENCHMARKS = {
    // Mean and standard deviation from empirical human visual reaction tests
    mean: 273,
    sd: 45,

    calculatePercentile(ms) {
      // Approximate normal cumulative distribution
      const z = (BENCHMARKS.mean - ms) / BENCHMARKS.sd;
      const t = 1.0 / (1.0 + 0.2316419 * Math.abs(z));
      const d = 0.3989423 * Math.exp(-z * z / 2.0);
      let prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
      if (z > 0) prob = 1.0 - prob;
      const percentile = Math.min(99.9, Math.max(1, Math.round(prob * 100)));
      return percentile;
    },

    getRank(avgMs) {
      if (avgMs < 185) {
        return {
          tier: 'TIER S+',
          title: 'CYBERNETIC DEITY',
          icon: '🤖',
          quote: "Are you overclocked? Human biological neurons aren't supposed to fire this fast.",
        };
      }
      if (avgMs <= 215) {
        return {
          tier: 'TIER S',
          title: 'F1 APEX REFLEX',
          icon: '🏎️',
          quote: "You have the neurological wiring of an elite Formula 1 driver on triple espresso.",
        };
      }
      if (avgMs <= 250) {
        return {
          tier: 'TIER A',
          title: 'SHADOW NINJA',
          icon: '🥷',
          quote: "Esports tournament-tier optical processing speed. Absolute menace with a mouse.",
        };
      }
      if (avgMs <= 290) {
        return {
          tier: 'TIER B',
          title: 'PRO GAMER',
          icon: '⚡',
          quote: "Crisp, solid reflexes. Safely outrunning the average human population.",
        };
      }
      if (avgMs <= 340) {
        return {
          tier: 'TIER C',
          title: 'SOLID HUMAN',
          icon: '🚶',
          quote: "Decent organic biology, but a shot of espresso might shave off another 30ms.",
        };
      }
      if (avgMs <= 420) {
        return {
          tier: 'TIER D',
          title: 'CAFFEINE NEEDED',
          icon: '☕',
          quote: "Were you checking your notifications mid-round, or is your Wi-Fi connected to your brain?",
        };
      }
      return {
        tier: 'TIER F',
        title: 'DIAL-UP SLOTH',
        icon: '🦥',
        quote: "Did you blink? Or did you take a quick power nap waiting for the green?",
      };
    },

    getRoundRating(ms) {
      if (ms < 190) return { title: '⚡ Inhuman Speed!', comment: 'Blink and you missed it.' };
      if (ms < 230) return { title: '🔥 Apex Reflexes!', comment: 'Flawless neural synapse response.' };
      if (ms < 270) return { title: '🎯 Sharp & Fast!', comment: 'Beating the global average.' };
      if (ms < 330) return { title: '👍 Good Reaction', comment: 'Solid, reliable timing.' };
      return { title: '🐢 A Bit Sluggish', comment: 'Wake up! Green means tap immediately.' };
    }
  };

  // =========================================================================
  // 4. Achievement Definitions
  // =========================================================================
  const ACHIEVEMENTS_DEF = [
    { id: 'first_blood', icon: '⚔️', title: 'First Blood', desc: 'Finish your first complete 5-round challenge' },
    { id: 'sub_200', icon: '⚡', title: 'Sub-200 Club', desc: 'React in under 200ms in any single round' },
    { id: 'speed_demon', icon: '🏎️', title: 'Speed Demon', desc: 'Achieve a 5-round average under 220ms' },
    { id: 'consistency_god', icon: '🎯', title: 'Machine Precision', desc: 'Finish 5 rounds with consistency variance under ±15ms' },
    { id: 'eagle_eye', icon: '👁️', title: 'Eagle Eye', desc: 'Survive a deceptive fake flash in Tricky mode without clicking' },
    { id: 'clean_sheet', icon: '🛡️', title: 'Flawless Focus', desc: 'Complete all 5 rounds without a single false start' },
    { id: 'daily_devotee', icon: '📅', title: 'Daily Devotee', desc: 'Complete today\'s official Daily Seed Challenge' },
    { id: 'rival_slayer', icon: '👑', title: 'Rival Slayer', desc: 'Beat an incoming friend challenge score' }
  ];

  // =========================================================================
  // 5. Main Game Engine Controller
  // =========================================================================
  class DontBlinkGame {
    constructor() {
      // DOM Elements
      this.playArea = document.getElementById('play-area');
      this.btnStart = document.getElementById('btn-start');
      this.btnNextRound = document.getElementById('btn-next-round');
      this.btnContinueRound = document.getElementById('btn-continue-round');
      this.btnRematch = document.getElementById('btn-rematch');
      this.btnCloseModal = document.getElementById('btn-close-modal');

      // Stages
      this.stageIdle = document.getElementById('stage-idle');
      this.stageWaiting = document.getElementById('stage-waiting');
      this.stageFake = document.getElementById('stage-fake');
      this.stageReady = document.getElementById('stage-ready');
      this.stageFalseStart = document.getElementById('stage-false-start');
      this.stageRoundResult = document.getElementById('stage-round-result');

      // Modals
      this.gameOverModal = document.getElementById('game-over-modal');
      this.leaderboardModal = document.getElementById('leaderboard-modal');
      this.achievementsModal = document.getElementById('achievements-modal');
      this.themeModal = document.getElementById('theme-modal');
      this.privacyModal = document.getElementById('privacy-modal');
      this.aboutModal = document.getElementById('about-modal');

      // HUD Stats
      this.hudPb = document.getElementById('hud-pb');
      this.hudStreak = document.getElementById('hud-streak');
      this.hudGamesCount = document.getElementById('hud-games-count');
      this.roundPips = document.querySelectorAll('.round-pip');

      // Header Buttons
      this.btnSound = document.getElementById('btn-sound');
      this.soundIconOn = document.getElementById('sound-icon-on');
      this.soundIconOff = document.getElementById('sound-icon-off');
      this.btnTheme = document.getElementById('btn-theme');
      this.btnLeaderboardModal = document.getElementById('btn-leaderboard-modal');
      this.btnAchievementsModal = document.getElementById('btn-achievements-modal');
      this.achievementUnreadDot = document.getElementById('achievement-unread');

      // Social / Share Buttons
      this.btnShareWhatsapp = document.getElementById('btn-share-whatsapp');
      this.btnChallengeFriend = document.getElementById('btn-challenge-friend');
      this.btnDownloadCard = document.getElementById('btn-download-card');

      // Incoming Rival Elements
      this.incomingBanner = document.getElementById('incoming-challenge-banner');
      this.challengerNameEl = document.getElementById('challenger-name');
      this.challengerScoreEl = document.getElementById('challenger-score');
      this.btnAcceptChallenge = document.getElementById('btn-accept-challenge');
      this.challengeBadge = document.getElementById('challenge-badge');
      this.challengeBadgeText = document.getElementById('challenge-badge-text');

      // Sound & Particle Engines
      this.sound = new SoundFX();
      this.particles = new ParticleEngine(document.getElementById('particle-canvas'));

      // Game State
      this.state = 'IDLE'; // IDLE | WAITING | FAKE_FLASH | READY | FALSE_START | ROUND_RESULT | GAME_OVER
      this.currentMode = 'classic'; // classic | tricky | sudden | daily
      this.round = 1;
      this.maxRounds = 5;
      this.roundScores = [];
      this.hadFalseStartThisRound = false;
      this.totalFalseStartsThisGame = 0;
      this.survivedFakeThisGame = false;

      // Timers & Timestamps
      this.waitTimeout = null;
      this.fakeTimeout = null;
      this.readyTimestamp = 0;
      this.currentRoundMs = 0;

      // Rival Challenge State
      this.rivalData = null; // { score: number, name: string }

      // Daily Challenge Seed
      this.dailySeed = this.getTodayDateString();

      // Initial Setup
      this.loadStoredData();
      this.checkUrlChallenge();
      this.bindEvents();
      this.updateHud();
      this.renderAchievementsModal();
      this.initAdSense();
    }

    initAdSense() {
      // Safely initialize Google AdSense units without throwing if blocked by client
      try {
        if (window.adsbygoogle) {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
        }
      } catch (err) {
        // Silently handled: Ads blocked by user extension or pending publisher activation
      }
    }

    // -----------------------------------------------------------------------
    // Initialization & Storage
    // -----------------------------------------------------------------------
    loadStoredData() {
      // Sound Preference
      const soundPref = localStorage.getItem('db_sound_enabled');
      this.sound.enabled = soundPref !== null ? soundPref === 'true' : true;
      this.updateSoundIcons();

      // Theme Preference
      const themePref = localStorage.getItem('db_theme') || 'cyber';
      document.body.setAttribute('data-theme', themePref);
      this.highlightActiveTheme(themePref);

      // Games Count
      this.gamesPlayed = parseInt(localStorage.getItem('db_games_count') || '0', 10);

      // Personal Best
      this.pb = parseInt(localStorage.getItem('db_pb_score') || '0', 10);

      // Daily Streaks
      this.updateDailyStreak();

      // Achievements
      this.unlockedAchievements = JSON.parse(localStorage.getItem('db_achievements') || '[]');
      this.updateAchievementBadge();
    }

    getTodayDateString() {
      const now = new Date();
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    }

    updateDailyStreak() {
      const lastDailyDate = localStorage.getItem('db_last_daily_date');
      const today = this.getTodayDateString();
      let streak = parseInt(localStorage.getItem('db_daily_streak') || '0', 10);

      if (lastDailyDate) {
        const lastDate = new Date(lastDailyDate);
        const currDate = new Date(today);
        const diffDays = Math.round((currDate - lastDate) / (1000 * 60 * 60 * 24));
        if (diffDays > 1) {
          // Streak broken
          streak = 0;
          localStorage.setItem('db_daily_streak', '0');
        }
      }
      this.dailyStreak = streak;
    }

    updateHud() {
      this.hudPb.textContent = this.pb > 0 ? `${this.pb} ms` : '-- ms';
      this.hudStreak.textContent = `${this.dailyStreak} 🔥`;
      this.hudGamesCount.textContent = this.gamesPlayed;
    }

    // -----------------------------------------------------------------------
    // URL Challenge Handling
    // -----------------------------------------------------------------------
    checkUrlChallenge() {
      const params = new URLSearchParams(window.location.search);
      const vs = params.get('vs');
      const name = params.get('challenger') || 'Rival';
      const mode = params.get('mode') || 'classic';

      if (vs && !isNaN(parseInt(vs, 10))) {
        const targetMs = parseInt(vs, 10);
        this.rivalData = { score: targetMs, name };
        
        // Populate and show incoming banner
        this.challengerNameEl.textContent = name;
        this.challengerScoreEl.textContent = `${targetMs}ms`;
        this.incomingBanner.classList.remove('hidden');

        // Show challenge badge in header
        this.challengeBadge.classList.remove('hidden');
        this.challengeBadgeText.textContent = `Beat ${targetMs}ms (${name})`;

        // Select mode if valid
        if (['classic', 'tricky', 'sudden', 'daily'].includes(mode)) {
          this.switchMode(mode);
        }
      }
    }

    // -----------------------------------------------------------------------
    // Event Listeners
    // -----------------------------------------------------------------------
    bindEvents() {
      // Tap / Click on the main play area
      const handlePlayAreaTrigger = (e) => {
        // Prevent action if clicking inside interactive buttons
        if (e.target.closest('button')) return;
        this.handleArenaInteraction(e);
      };

      this.playArea.addEventListener('pointerdown', handlePlayAreaTrigger);

      // Start Button inside Idle Stage
      this.btnStart.addEventListener('click', (e) => {
        e.stopPropagation();
        this.sound.playClick();
        this.startChallenge();
      });

      // Next Round Button
      this.btnNextRound.addEventListener('click', (e) => {
        e.stopPropagation();
        this.sound.playClick();
        this.advanceToNextRound();
      });

      // Continue Round after False Start
      this.btnContinueRound.addEventListener('click', (e) => {
        e.stopPropagation();
        this.sound.playClick();
        this.restartCurrentRound();
      });

      // Rematch Button
      this.btnRematch.addEventListener('click', () => {
        this.sound.playClick();
        this.closeAllModals();
        this.startChallenge();
      });

      // Close Final Result Modal
      this.btnCloseModal.addEventListener('click', () => {
        this.sound.playClick();
        this.closeAllModals();
        this.setStage('IDLE');
      });

      // Spacebar Keyboard Navigation
      window.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
          // If modal open, trigger Rematch or Next
          if (!this.gameOverModal.classList.contains('hidden')) {
            e.preventDefault();
            this.btnRematch.click();
            return;
          }
          if (!this.stageRoundResult.classList.contains('active')) {
            // Trigger arena action
            e.preventDefault();
            this.handleArenaInteraction(e);
          } else {
            // In Round Result -> Go to next round
            e.preventDefault();
            this.advanceToNextRound();
          }
        }
      });

      // Mode Selector Tabs
      document.querySelectorAll('.mode-chip').forEach(chip => {
        chip.addEventListener('click', () => {
          const mode = chip.getAttribute('data-mode');
          this.sound.playClick();
          this.switchMode(mode);
        });
      });

      // Header Icons
      this.btnSound.addEventListener('click', () => this.toggleSound());
      this.btnTheme.addEventListener('click', () => this.openModal(this.themeModal));
      this.btnLeaderboardModal.addEventListener('click', () => {
        this.renderLeaderboard();
        this.openModal(this.leaderboardModal);
      });
      this.btnAchievementsModal.addEventListener('click', () => {
        this.renderAchievementsModal();
        this.openModal(this.achievementsModal);
      });

      // Footer Modals (Privacy & About)
      const btnPrivacy = document.getElementById('btn-open-privacy');
      if (btnPrivacy) {
        btnPrivacy.addEventListener('click', () => this.openModal(this.privacyModal));
      }
      const btnAbout = document.getElementById('btn-open-about');
      if (btnAbout) {
        btnAbout.addEventListener('click', () => this.openModal(this.aboutModal));
      }

      // Theme Selection in Modal
      document.querySelectorAll('.theme-choice').forEach(choice => {
        choice.addEventListener('click', () => {
          const theme = choice.getAttribute('data-set-theme');
          this.setTheme(theme);
        });
      });

      // Generic Modal Close Buttons
      document.querySelectorAll('.modal-close-btn, [data-close]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const modalId = btn.getAttribute('data-close');
          if (modalId) {
            document.getElementById(modalId).classList.add('hidden');
          } else {
            const modal = btn.closest('.modal-overlay');
            if (modal) modal.classList.add('hidden');
          }
        });
      });

      // Accept Rival Challenge Banner CTA
      this.btnAcceptChallenge.addEventListener('click', () => {
        this.incomingBanner.classList.add('hidden');
        this.startChallenge();
      });

      // Clear Leaderboard
      document.getElementById('btn-clear-scores').addEventListener('click', () => {
        if (confirm('Are you sure you want to clear your local Hall of Fame records?')) {
          localStorage.removeItem('db_leaderboard');
          this.renderLeaderboard();
          this.showToast('Leaderboard reset.', '🗑️');
        }
      });

      // Leaderboard Filter Tabs
      document.querySelectorAll('.lb-tab').forEach(tab => {
        tab.addEventListener('click', () => {
          document.querySelectorAll('.lb-tab').forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          const filter = tab.getAttribute('data-lb-filter');
          this.renderLeaderboard(filter);
        });
      });

      // Social Share Buttons
      this.btnShareWhatsapp.addEventListener('click', () => this.shareWhatsApp());
      this.btnChallengeFriend.addEventListener('click', () => this.copyChallengeLink());
      this.btnDownloadCard.addEventListener('click', () => this.exportResultCard());
    }

    // -----------------------------------------------------------------------
    // State Machine & Arena Flow
    // -----------------------------------------------------------------------
    switchMode(mode) {
      if (this.state !== 'IDLE' && this.state !== 'ROUND_RESULT' && this.state !== 'GAME_OVER') {
        this.cancelTimers();
      }
      this.currentMode = mode;
      document.querySelectorAll('.mode-chip').forEach(c => {
        c.classList.toggle('active', c.getAttribute('data-mode') === mode);
      });
      this.setStage('IDLE');
    }

    setStage(stageName) {
      this.state = stageName;
      this.playArea.className = 'play-arena';
      if (stageName !== 'FAKE_FLASH') {
        this.playArea.style.backgroundColor = '';
      }

      // Hide all stage views
      [this.stageIdle, this.stageWaiting, this.stageFake, this.stageReady, 
       this.stageFalseStart, this.stageRoundResult].forEach(v => v.classList.remove('active'));

      switch (stageName) {
        case 'IDLE':
          this.playArea.classList.add('state-idle');
          this.stageIdle.classList.add('active');
          this.resetRoundPips();
          break;

        case 'WAITING':
          this.playArea.classList.add('state-waiting');
          this.stageWaiting.classList.add('active');
          this.updateRoundPips();
          break;

        case 'FAKE_FLASH':
          this.playArea.classList.add('state-fake');
          this.stageFake.classList.add('active');
          break;

        case 'READY':
          this.playArea.classList.add('state-ready');
          this.stageReady.classList.add('active');
          break;

        case 'FALSE_START':
          this.playArea.classList.add('state-false-start');
          this.stageFalseStart.classList.add('active');
          this.vibrate([100, 50, 100]);
          break;

        case 'ROUND_RESULT':
          this.playArea.classList.add('state-round-result');
          this.stageRoundResult.classList.add('active');
          break;

        case 'GAME_OVER':
          this.playArea.classList.add('state-idle');
          this.openModal(this.gameOverModal);
          break;
      }
    }

    startChallenge() {
      this.round = 1;
      this.roundScores = [];
      this.hadFalseStartThisRound = false;
      this.totalFalseStartsThisGame = 0;
      this.survivedFakeThisGame = false;
      this.resetRoundPips();
      this.scheduleRoundTrigger();
    }

    scheduleRoundTrigger() {
      this.cancelTimers();
      this.setStage('WAITING');

      // Calculate unpredictable random wait between 1.2s and 4.6s
      let delayMs = 1200 + Math.random() * 3400;

      // If Daily Challenge, use seeded pseudo-randomness based on date & round
      if (this.currentMode === 'daily') {
        const seedVal = this.getDailySeedValue(this.round);
        delayMs = 1300 + (seedVal % 3100);
      }

      // In Tricky mode: 70% chance of a decoy flash; in other modes: 20% surprise chance
      const shouldFake = this.currentMode === 'tricky' ? Math.random() < 0.70 : Math.random() < 0.20;

      if (shouldFake) {
        // Trigger fake flash around 40-50% of total wait delay
        const fakeTriggerTime = Math.max(800, delayMs * 0.45);
        this.waitTimeout = setTimeout(() => {
          this.triggerFakeFlash(delayMs - fakeTriggerTime);
        }, fakeTriggerTime);
      } else {
        this.waitTimeout = setTimeout(() => {
          this.triggerGreenLight();
        }, delayMs);
      }
    }

    triggerFakeFlash(remainingWait) {
      const decoyColors = [
        { bg: '#ff9100', text: "DON'T TAP! (AMBER DECOY)", desc: 'Only tap on NEON GREEN!' },
        { bg: '#ff0055', text: "DON'T TAP! (RED TRAP)", desc: 'Hold your fire!' },
        { bg: '#a855f7', text: "DON'T TAP! (PURPLE FLASH)", desc: 'Wait for GREEN!' },
        { bg: '#00d2ff', text: "DON'T TAP! (CYAN DECOY)", desc: 'Not green! Hold on!' },
      ];
      const decoy = decoyColors[Math.floor(Math.random() * decoyColors.length)];

      const fakeTitle = document.getElementById('fake-title');
      const fakeDesc = document.getElementById('fake-desc');
      if (fakeTitle) fakeTitle.textContent = decoy.text;
      if (fakeDesc) fakeDesc.textContent = decoy.desc;
      this.playArea.style.backgroundColor = decoy.bg;

      this.setStage('FAKE_FLASH');
      this.sound.playFakeFlash();

      // Fake flash lasts for 380ms
      this.fakeTimeout = setTimeout(() => {
        // Clear override style
        this.playArea.style.backgroundColor = '';

        // Player successfully didn't click during the decoy!
        this.survivedFakeThisGame = true;
        this.unlockAchievement('eagle_eye');
        this.setStage('WAITING');

        // Continue towards the genuine green light
        const remainingDelay = Math.max(900, remainingWait + 400);
        this.waitTimeout = setTimeout(() => {
          this.triggerGreenLight();
        }, remainingDelay);
      }, 380);
    }

    triggerGreenLight() {
      this.setStage('READY');
      this.readyTimestamp = performance.now();
      this.sound.playGo();
      this.vibrate(60);
    }

    handleArenaInteraction(e) {
      if (this.state === 'IDLE') {
        this.startChallenge();
        return;
      }

      if (this.state === 'FALSE_START') {
        this.restartCurrentRound();
        return;
      }

      if (this.state === 'ROUND_RESULT') {
        this.advanceToNextRound();
        return;
      }

      if (this.state === 'WAITING' || this.state === 'FAKE_FLASH') {
        // FALSE START!
        this.cancelTimers();
        this.hadFalseStartThisRound = true;
        this.totalFalseStartsThisGame++;
        this.sound.playFalseStart();

        // Update pip to failed
        const currPip = document.querySelector(`.round-pip[data-round="${this.round}"]`);
        if (currPip) {
          currPip.classList.remove('current');
          currPip.classList.add('failed');
        }

        // Custom false start message
        const msgEl = document.getElementById('false-start-msg');
        if (this.state === 'FAKE_FLASH') {
          msgEl.textContent = 'Decoy trap caught you! Only tap when you see genuine NEON GREEN.';
        } else {
          msgEl.textContent = 'Too eager! You clicked before the screen turned green.';
        }

        // If Sudden Death mode, false start ends game immediately!
        if (this.currentMode === 'sudden') {
          msgEl.textContent = 'Sudden Death failure! Only 1 strike allowed.';
          setTimeout(() => this.finishGame(), 1100);
          return;
        }

        this.setStage('FALSE_START');
        return;
      }

      if (this.state === 'READY') {
        // SUCCESSFUL REACTION HIT!
        const tapTimestamp = performance.now();
        const reactionTime = Math.round(tapTimestamp - this.readyTimestamp);
        this.currentRoundMs = reactionTime;
        this.roundScores.push(reactionTime);

        // Particle explosion at tap point
        const rect = this.playArea.getBoundingClientRect();
        const clickX = e && e.clientX ? e.clientX : rect.left + rect.width / 2;
        const clickY = e && e.clientY ? e.clientY : rect.top + rect.height / 2;
        const colors = reactionTime < 210 ? ['#00ff66', '#00f0ff', '#ffd700'] : ['#00ff66', '#ffffff'];
        this.particles.burst(clickX, clickY, reactionTime < 200 ? 55 : 35, colors);

        // Sound & Haptics
        this.sound.playRoundSuccess();
        this.vibrate([30, 40]);

        // Check single round achievements
        if (reactionTime < 200) {
          this.unlockAchievement('sub_200');
        }

        this.showRoundResult(reactionTime);
      }
    }

    restartCurrentRound() {
      this.cancelTimers();
      this.scheduleRoundTrigger();
    }

    showRoundResult(ms) {
      document.getElementById('round-ms').textContent = ms;
      const rating = BENCHMARKS.getRoundRating(ms);
      document.getElementById('round-grade').textContent = rating.title;
      document.getElementById('round-comment').textContent = `"${rating.comment}"`;

      // Update round indicator pip
      const currPip = document.querySelector(`.round-pip[data-round="${this.round}"]`);
      if (currPip) {
        currPip.classList.remove('current');
        currPip.classList.add('done');
      }

      const nextBtnText = document.getElementById('next-round-btn-text');
      if (this.round >= this.maxRounds) {
        nextBtnText.textContent = 'View Final Results';
      } else {
        nextBtnText.textContent = `Round ${this.round + 1} of ${this.maxRounds}`;
      }

      this.setStage('ROUND_RESULT');
    }

    advanceToNextRound() {
      if (this.round >= this.maxRounds) {
        this.finishGame();
      } else {
        this.round++;
        this.hadFalseStartThisRound = false;
        this.scheduleRoundTrigger();
      }
    }

    cancelTimers() {
      if (this.waitTimeout) {
        clearTimeout(this.waitTimeout);
        this.waitTimeout = null;
      }
      if (this.fakeTimeout) {
        clearTimeout(this.fakeTimeout);
        this.fakeTimeout = null;
      }
    }

    // -----------------------------------------------------------------------
    // Round Pips Rendering
    // -----------------------------------------------------------------------
    resetRoundPips() {
      this.roundPips.forEach(pip => {
        pip.className = 'round-pip';
      });
    }

    updateRoundPips() {
      this.roundPips.forEach(pip => {
        const roundNum = parseInt(pip.getAttribute('data-round'), 10);
        if (roundNum === this.round) {
          pip.className = 'round-pip current';
        } else if (roundNum < this.round) {
          pip.className = 'round-pip done';
        } else {
          pip.className = 'round-pip';
        }
      });
    }

    // -----------------------------------------------------------------------
    // Final Results & Scoring Calculation
    // -----------------------------------------------------------------------
    finishGame() {
      this.cancelTimers();
      this.gamesPlayed++;
      localStorage.setItem('db_games_count', this.gamesPlayed.toString());

      // If sudden death ended prematurely with 0 rounds
      if (this.roundScores.length === 0) {
        this.roundScores.push(500);
      }

      // Calculate Average & Best
      const sum = this.roundScores.reduce((acc, val) => acc + val, 0);
      const avgMs = Math.round(sum / this.roundScores.length);
      const bestRoundMs = Math.min(...this.roundScores);

      // Calculate Consistency (Standard Deviation)
      const variance = this.roundScores.reduce((acc, val) => acc + Math.pow(val - avgMs, 2), 0) / this.roundScores.length;
      const stdDev = Math.round(Math.sqrt(variance));

      // Personal Best Handling
      let isNewPb = false;
      if (this.pb === 0 || avgMs < this.pb) {
        this.pb = avgMs;
        localStorage.setItem('db_pb_score', avgMs.toString());
        isNewPb = true;
      }

      // Daily Challenge Streak Increment
      if (this.currentMode === 'daily') {
        const today = this.getTodayDateString();
        const lastDaily = localStorage.getItem('db_last_daily_date');
        if (lastDaily !== today) {
          this.dailyStreak++;
          localStorage.setItem('db_daily_streak', this.dailyStreak.toString());
          localStorage.setItem('db_last_daily_date', today);
          this.unlockAchievement('daily_devotee');
        }
      }

      // Check Achievements
      this.unlockAchievement('first_blood');
      if (avgMs <= 220) this.unlockAchievement('speed_demon');
      if (stdDev <= 15) this.unlockAchievement('consistency_god');
      if (this.totalFalseStartsThisGame === 0) this.unlockAchievement('clean_sheet');

      // Benchmark & Rank Evaluation
      const percentile = BENCHMARKS.calculatePercentile(avgMs);
      const rank = BENCHMARKS.getRank(avgMs);

      // Populate Result Modal
      document.getElementById('final-avg-ms').textContent = avgMs;
      document.getElementById('final-rank-icon').textContent = rank.icon;
      document.getElementById('final-rank-tier').textContent = rank.tier;
      document.getElementById('final-rank-title').textContent = rank.title;
      document.getElementById('final-sassy-msg').textContent = `"${rank.quote}"`;
      document.getElementById('final-percentile').textContent = `Faster than ${percentile}%`;
      document.getElementById('final-consistency').textContent = `Consistency: ±${stdDev}ms`;
      document.getElementById('mode-badge-display').textContent = this.currentMode.toUpperCase();

      const pbBadge = document.getElementById('new-pb-badge');
      if (isNewPb) {
        pbBadge.classList.remove('hidden');
        this.particles.burst(window.innerWidth / 2, window.innerHeight / 3, 60, ['#ffd700', '#00ff66', '#ffffff']);
      } else {
        pbBadge.classList.add('hidden');
      }

      // Populate Round Breakdown Bars
      const barsContainer = document.getElementById('rounds-bars-container');
      barsContainer.innerHTML = '';
      this.roundScores.forEach((ms, i) => {
        const cell = document.createElement('div');
        cell.className = `round-cell ${ms === bestRoundMs ? 'best' : ''}`;
        cell.innerHTML = `
          <span class="round-cell-tag">R${i + 1}</span>
          <span class="round-cell-val">${ms}ms</span>
        `;
        barsContainer.appendChild(cell);
      });

      // Rival Challenge Comparison
      const rivalBox = document.getElementById('rival-comparison-box');
      if (this.rivalData) {
        rivalBox.classList.remove('hidden');
        const diff = this.rivalData.score - avgMs;
        const outcomeEl = document.getElementById('rival-outcome-text');
        if (diff > 0) {
          outcomeEl.innerHTML = `You CRUSHED ${this.escapeHtml(this.rivalData.name)} by <span class="neon-green">${diff}ms</span>! 🏆`;
          this.unlockAchievement('rival_slayer');
        } else if (diff === 0) {
          outcomeEl.innerHTML = `An EXACT TIE with ${this.escapeHtml(this.rivalData.name)} (${avgMs}ms)! ⚔️`;
        } else {
          outcomeEl.innerHTML = `${this.escapeHtml(this.rivalData.name)} was faster by ${Math.abs(diff)}ms. Rematch to claim victory!`;
        }
      } else {
        rivalBox.classList.add('hidden');
      }

      // Save to Leaderboard
      this.saveLeaderboardRecord({
        avg: avgMs,
        best: bestRoundMs,
        mode: this.currentMode,
        rank: rank.title,
        date: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      });

      this.sound.playFanfare();
      this.updateHud();
      this.setStage('GAME_OVER');
    }

    // -----------------------------------------------------------------------
    // Leaderboard System
    // -----------------------------------------------------------------------
    saveLeaderboardRecord(record) {
      const records = JSON.parse(localStorage.getItem('db_leaderboard') || '[]');
      records.push(record);
      // Sort ascending by fastest avg reaction time
      records.sort((a, b) => a.avg - b.avg);
      // Keep top 20
      const trimmed = records.slice(0, 20);
      localStorage.setItem('db_leaderboard', JSON.stringify(trimmed));
    }

    renderLeaderboard(filter = 'all') {
      const tbody = document.getElementById('leaderboard-tbody');
      const emptyState = document.getElementById('leaderboard-empty');
      const records = JSON.parse(localStorage.getItem('db_leaderboard') || '[]');

      const filtered = filter === 'all' ? records : records.filter(r => r.mode === filter);

      tbody.innerHTML = '';
      if (filtered.length === 0) {
        emptyState.classList.remove('hidden');
        return;
      }
      emptyState.classList.add('hidden');

      filtered.forEach((rec, idx) => {
        const tr = document.createElement('tr');
        tr.className = `rank-${idx + 1}`;
        tr.innerHTML = `
          <td><span class="rank-badge-num">#${idx + 1}</span></td>
          <td><span class="lb-ms">${rec.avg} ms</span></td>
          <td>${rec.best} ms</td>
          <td><span class="lb-mode-tag">${rec.mode}</span></td>
          <td>${rec.rank}</td>
          <td>${rec.date}</td>
        `;
        tbody.appendChild(tr);
      });
    }

    // -----------------------------------------------------------------------
    // Achievements Engine
    // -----------------------------------------------------------------------
    unlockAchievement(id) {
      if (this.unlockedAchievements.includes(id)) return;
      this.unlockedAchievements.push(id);
      localStorage.setItem('db_achievements', JSON.stringify(this.unlockedAchievements));

      const def = ACHIEVEMENTS_DEF.find(a => a.id === id);
      if (def) {
        this.sound.playAchievement();
        this.showToast(`Achievement: ${def.title}!`, def.icon);
        this.updateAchievementBadge(true);
      }
    }

    updateAchievementBadge(showUnread = false) {
      if (showUnread) {
        this.achievementUnreadDot.classList.remove('hidden');
      } else {
        this.achievementUnreadDot.classList.add('hidden');
      }
    }

    renderAchievementsModal() {
      this.updateAchievementBadge(false);
      const grid = document.getElementById('achievements-grid');
      const progressText = document.getElementById('achievements-progress-text');
      const progressFill = document.getElementById('achievements-progress-fill');

      grid.innerHTML = '';
      const unlockedCount = this.unlockedAchievements.length;
      const totalCount = ACHIEVEMENTS_DEF.length;
      const pct = Math.round((unlockedCount / totalCount) * 100);

      progressText.textContent = `Unlocked: ${unlockedCount} / ${totalCount} (${pct}%)`;
      progressFill.style.width = `${pct}%`;

      ACHIEVEMENTS_DEF.forEach(ach => {
        const isUnlocked = this.unlockedAchievements.includes(ach.id);
        const card = document.createElement('div');
        card.className = `achieve-card ${isUnlocked ? 'unlocked' : ''}`;
        card.innerHTML = `
          <div class="achieve-icon">${ach.icon}</div>
          <div class="achieve-info">
            <span class="achieve-title">${ach.title} ${isUnlocked ? '✓' : ''}</span>
            <span class="achieve-desc">${ach.desc}</span>
          </div>
        `;
        grid.appendChild(card);
      });
    }

    // -----------------------------------------------------------------------
    // Themes & Personalization
    // -----------------------------------------------------------------------
    setTheme(themeName) {
      document.body.setAttribute('data-theme', themeName);
      localStorage.setItem('db_theme', themeName);
      this.highlightActiveTheme(themeName);
      this.sound.playClick();
      this.showToast(`Theme updated to ${themeName.toUpperCase()}`, '🎨');
    }

    highlightActiveTheme(themeName) {
      document.querySelectorAll('.theme-choice').forEach(tc => {
        tc.classList.toggle('active', tc.getAttribute('data-set-theme') === themeName);
      });
    }

    toggleSound() {
      this.sound.enabled = !this.sound.enabled;
      localStorage.setItem('db_sound_enabled', this.sound.enabled.toString());
      this.updateSoundIcons();
      if (this.sound.enabled) {
        this.sound.playClick();
        this.showToast('Sound Enabled', '🔊');
      } else {
        this.showToast('Sound Muted', '🔇');
      }
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

    vibrate(pattern) {
      if ('vibrate' in navigator) {
        try {
          navigator.vibrate(pattern);
        } catch (_) {}
      }
    }

    // -----------------------------------------------------------------------
    // Viral Social Sharing & Duel Links
    // -----------------------------------------------------------------------
    getShareableLink() {
      const avg = document.getElementById('final-avg-ms').textContent;
      const url = new URL(window.location.href.split('?')[0]);
      url.searchParams.set('vs', avg);
      url.searchParams.set('challenger', 'Player');
      url.searchParams.set('mode', this.currentMode);
      return url.toString();
    }

    copyChallengeLink() {
      const link = this.getShareableLink();
      const avg = document.getElementById('final-avg-ms').textContent;

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(link).then(() => {
          this.showToast(`Copied Duel Link! Beat ${avg}ms`, '⚔️');
          const btnText = document.getElementById('challenge-btn-text');
          btnText.textContent = 'Link Copied!';
          setTimeout(() => btnText.textContent = 'Copy Duel Link', 2500);
        }).catch(() => {
          this.fallbackCopy(link);
        });
      } else {
        this.fallbackCopy(link);
      }
    }

    fallbackCopy(text) {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      this.showToast('Duel Link copied!', '⚔️');
    }

    shareWhatsApp() {
      const avg = document.getElementById('final-avg-ms').textContent;
      const rankTitle = document.getElementById('final-rank-title').textContent;
      const link = this.getShareableLink();
      const message = `⚡ DON'T BLINK: I scored an average reaction time of ${avg}ms (${rankTitle})! Think you're faster? Beat my score here:\n${link}`;
      const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
      window.open(waUrl, '_blank');
    }

    // -----------------------------------------------------------------------
    // Canvas Share Card Generator (Export to PNG)
    // -----------------------------------------------------------------------
    exportResultCard() {
      const canvas = document.getElementById('share-card-canvas');
      const ctx = canvas.getContext('2d');
      const avg = document.getElementById('final-avg-ms').textContent;
      const rankTitle = document.getElementById('final-rank-title').textContent;
      const rankTier = document.getElementById('final-rank-tier').textContent;
      const rankIcon = document.getElementById('final-rank-icon').textContent;
      const percentile = document.getElementById('final-percentile').textContent;

      // 1. Background Gradient
      const grad = ctx.createLinearGradient(0, 0, 1200, 675);
      grad.addColorStop(0, '#090a0f');
      grad.addColorStop(0.5, '#121624');
      grad.addColorStop(1, '#08090d');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1200, 675);

      // 2. Cyber Grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      for (let x = 0; x < 1200; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 675);
        ctx.stroke();
      }
      for (let y = 0; y < 675; y += 50) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(1200, y);
        ctx.stroke();
      }

      // 3. Glowing Outer Border
      ctx.strokeStyle = '#00ff66';
      ctx.lineWidth = 6;
      ctx.strokeRect(30, 30, 1140, 615);

      // 4. Logo Header
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 42px Outfit, sans-serif';
      ctx.fillText("DON'T ", 70, 95);
      ctx.fillStyle = '#00ff66';
      ctx.fillText("BLINK", 205, 95);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '700 18px "Space Grotesk", monospace';
      ctx.fillText("REFLEX ARCADE VERIFIED SCORE", 70, 130);

      // 5. Hero Score Display
      ctx.fillStyle = '#94a3b8';
      ctx.font = '700 24px Outfit, sans-serif';
      ctx.fillText("AVERAGE REACTION SPEED", 70, 240);

      ctx.fillStyle = '#00ff66';
      ctx.font = '900 130px "Space Grotesk", monospace';
      ctx.fillText(`${avg}`, 70, 360);
      const textWidth = ctx.measureText(`${avg}`).width;
      ctx.fillStyle = '#94a3b8';
      ctx.font = '700 48px "Space Grotesk", monospace';
      ctx.fillText("ms", 85 + textWidth, 350);

      // 6. Rank Box
      ctx.fillStyle = '#181d2e';
      ctx.fillRect(660, 180, 480, 220);
      ctx.strokeStyle = 'rgba(0, 255, 102, 0.4)';
      ctx.lineWidth = 2;
      ctx.strokeRect(660, 180, 480, 220);

      ctx.font = '68px sans-serif';
      ctx.fillText(rankIcon, 700, 300);

      ctx.fillStyle = '#ffb703';
      ctx.font = '800 22px Outfit, sans-serif';
      ctx.fillText(rankTier, 790, 255);

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 36px Outfit, sans-serif';
      ctx.fillText(rankTitle, 790, 305);

      // 7. Human Benchmark comparison pill
      ctx.fillStyle = 'rgba(0, 240, 255, 0.15)';
      ctx.fillRect(70, 420, 1070, 75);
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
      ctx.lineWidth = 2;
      ctx.strokeRect(70, 420, 1070, 75);

      ctx.fillStyle = '#ffffff';
      ctx.font = '700 28px Outfit, sans-serif';
      ctx.fillText(`🧬 ${percentile} of human benchmarks (Global Avg: 273ms)`, 100, 468);

      // 8. Footer Watermark
      ctx.fillStyle = '#64748b';
      ctx.font = '600 20px "Space Grotesk", monospace';
      ctx.fillText("Challenge your friends • Test your optical synapses at dont-blink.arcade", 70, 580);

      // Trigger Download or Web Share API
      try {
        canvas.toBlob((blob) => {
          if (!blob) return;
          const file = new File([blob], `dont-blink-${avg}ms.png`, { type: 'image/png' });

          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            navigator.share({
              files: [file],
              title: "DON'T BLINK Reflex Score",
              text: `I clocked ${avg}ms in DON'T BLINK! Can you beat me?`,
            }).catch(() => this.downloadCanvasImage(canvas, avg));
          } else {
            this.downloadCanvasImage(canvas, avg);
          }
        }, 'image/png');
      } catch (_) {
        this.downloadCanvasImage(canvas, avg);
      }
    }

    downloadCanvasImage(canvas, avg) {
      const link = document.createElement('a');
      link.download = `dont-blink-score-${avg}ms.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      this.showToast('Result card downloaded!', '📥');
    }

    // -----------------------------------------------------------------------
    // Modals & UI Utilities
    // -----------------------------------------------------------------------
    openModal(modal) {
      this.closeAllModals();
      modal.classList.remove('hidden');
    }

    closeAllModals() {
      document.querySelectorAll('.modal-overlay').forEach(m => m.classList.add('hidden'));
    }

    showToast(msg, icon = '✨') {
      const toast = document.getElementById('toast');
      document.getElementById('toast-msg').textContent = msg;
      document.getElementById('toast-icon').textContent = icon;
      toast.classList.remove('hidden');

      if (this.toastTimer) clearTimeout(this.toastTimer);
      this.toastTimer = setTimeout(() => {
        toast.classList.add('hidden');
      }, 2800);
    }

    escapeHtml(str) {
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    }

    // Pseudo-random deterministic daily seed generator
    getDailySeedValue(round) {
      let hash = 0;
      const str = `${this.dailySeed}-round-${round}`;
      for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0;
      }
      return Math.abs(hash);
    }
  }

  // =========================================================================
  // Initialize Application on DOM Ready
  // =========================================================================
  document.addEventListener('DOMContentLoaded', () => {
    window.game = new DontBlinkGame();
  });
})();
