/**
 * PERFECT 10.000 — Chrono Reflex Stopwatch Engine
 * High-precision sub-millisecond stopwatch game with Blindfold mode,
 * Web Audio chronometer ticks, particle bursts, and viral duel sharing.
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

    playStart() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(now + 0.15);
    }

    playStop() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(987.77, now); // B5
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(now + 0.2);
    }

    playTick() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, now);
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(now + 0.02);
    }

    playPerfectFanfare() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
      notes.forEach((f, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const startTime = this.ctx.currentTime + i * 0.08;
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, startTime);
        gain.gain.setValueAtTime(0.25, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.4);
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

    burst(x, y, count = 35, colors = ['#ffb703', '#00ff66', '#ffffff']) {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 7 + 2;
        this.particles.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: Math.random() * 4 + 2,
          color: colors[Math.floor(Math.random() * colors.length)],
          alpha: 1,
          decay: Math.random() * 0.025 + 0.015,
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
  // 3. Chrono Precision Ranks
  // =========================================================================
  const CHRONO_RANKS = [
    { maxDeltaMs: 5, tier: 'TIER S+', title: 'GOD OF TIME', icon: '⏳', quote: 'Absolute perfection. Your biological clock syncs with atomic standards.', pct: 'Top 0.1%' },
    { maxDeltaMs: 25, tier: 'TIER S', title: 'SWISS CHRONO', icon: '⌚', quote: 'Flawless micro-timing. You have the rhythm of a master watchmaker.', pct: 'Top 2%' },
    { maxDeltaMs: 80, tier: 'TIER A', title: 'HUMAN METRONOME', icon: '🎵', quote: 'Incredible rhythm precision. Far outperforming standard human intuition.', pct: 'Top 12%' },
    { maxDeltaMs: 250, tier: 'TIER B', title: 'STEADY CADENCE', icon: '⚡', quote: 'Solid internal tempo. You feel the seconds passing with good accuracy.', pct: 'Top 45%' },
    { maxDeltaMs: 600, tier: 'TIER C', title: 'CASUAL TIMING', icon: '🚶', quote: 'A little early or late, but within standard human margins.', pct: 'Top 75%' },
    { maxDeltaMs: Infinity, tier: 'TIER D', title: 'BROKEN CLOCK', icon: '🕰️', quote: 'Were you distracted, or did time fly right past you?', pct: 'Bottom 25%' },
  ];

  function getChronoRank(deltaMs) {
    return CHRONO_RANKS.find(r => deltaMs <= r.maxDeltaMs) || CHRONO_RANKS[CHRONO_RANKS.length - 1];
  }

  // =========================================================================
  // 4. Main Stopwatch Controller
  // =========================================================================
  class Perfect10Game {
    constructor() {
      // DOM Elements
      this.clockDisplay = document.getElementById('clock-display');
      this.btnTrigger = document.getElementById('btn-trigger');
      this.btnLabel = document.getElementById('btn-label');
      this.btnSub = document.getElementById('btn-sub');
      this.blindNotice = document.getElementById('blind-notice');
      this.chronoTip = document.getElementById('chrono-tip');
      this.attemptsPills = document.getElementById('attempts-pills');

      this.hudBestDelta = document.getElementById('hud-best-delta');
      this.hudAttempts = document.getElementById('hud-attempts');
      this.btnSound = document.getElementById('btn-sound');
      this.soundIconOn = document.getElementById('sound-icon-on');
      this.soundIconOff = document.getElementById('sound-icon-off');
      this.btnLeaderboardModal = document.getElementById('btn-leaderboard-modal');
      this.btnOpenPrivacy = document.getElementById('btn-open-privacy');

      // Modals
      this.resultModal = document.getElementById('result-modal');
      this.leaderboardModal = document.getElementById('leaderboard-modal');
      this.privacyModal = document.getElementById('privacy-modal');
      this.btnTryAgain = document.getElementById('btn-try-again');

      // Social / Sharing
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
      this.mode = 'normal'; // normal | blind
      this.isRunning = false;
      this.startTime = 0;
      this.animFrameId = null;
      this.lastStoppedSeconds = 0;
      this.lastDeltaMs = 0;
      this.lastTickSec = 0;

      this.attemptsCount = parseInt(localStorage.getItem('p10_attempts') || '0', 10);
      this.bestDeltaMs = parseInt(localStorage.getItem('p10_best_delta') || '9999', 10);
      this.rivalTarget = null;

      this.updateHud();
      this.updateSoundIcons();
      this.renderRecentAttempts();
      this.checkUrlChallenge();
      this.bindEvents();
    }

    checkUrlChallenge() {
      const params = new URLSearchParams(window.location.search);
      const vs = params.get('vs');
      const name = params.get('challenger') || 'Rival';
      if (vs && !isNaN(parseInt(vs, 10))) {
        this.rivalTarget = { deltaMs: parseInt(vs, 10), name };
        this.challengerNameEl.textContent = name;
        this.challengerScoreEl.textContent = `±${vs}ms`;
        this.incomingBanner.classList.remove('hidden');
        this.challengeBadge.classList.remove('hidden');
        this.challengeBadgeText.textContent = `Beat ±${vs}ms (${name})`;
      }
    }

    bindEvents() {
      this.btnTrigger.addEventListener('click', () => this.toggleStopwatch());

      window.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
          e.preventDefault();
          if (!this.resultModal.classList.contains('hidden')) {
            this.btnTryAgain.click();
          } else {
            this.toggleStopwatch();
          }
        }
      });

      this.btnTryAgain.addEventListener('click', () => {
        this.resultModal.classList.add('hidden');
        this.resetToReady();
      });

      document.querySelectorAll('.mode-chip').forEach(chip => {
        chip.addEventListener('click', () => {
          if (this.isRunning) return;
          document.querySelectorAll('.mode-chip').forEach(c => c.classList.remove('active'));
          chip.classList.add('active');
          this.mode = chip.getAttribute('data-mode');
          this.resetToReady();
        });
      });

      this.btnSound.addEventListener('click', () => this.toggleSound());
      this.btnLeaderboardModal.addEventListener('click', () => {
        this.renderLeaderboard();
        this.leaderboardModal.classList.remove('hidden');
      });
      this.btnOpenPrivacy.addEventListener('click', () => this.privacyModal.classList.remove('hidden'));

      this.btnAcceptChallenge.addEventListener('click', () => {
        this.incomingBanner.classList.add('hidden');
        this.resetToReady();
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

    toggleStopwatch() {
      if (!this.isRunning) {
        this.start();
      } else {
        this.stop();
      }
    }

    start() {
      this.isRunning = true;
      this.startTime = performance.now();
      this.lastTickSec = 0;

      this.btnTrigger.className = 'btn-trigger state-running';
      this.btnLabel.textContent = 'STOP!';
      this.btnSub.textContent = 'Tap to Freeze';
      this.clockDisplay.classList.remove('blind-mode-active');
      this.blindNotice.classList.add('hidden');

      this.sound.playStart();
      if ('vibrate' in navigator) {
        try { navigator.vibrate(30); } catch (_) {}
      }

      this.loop();
    }

    loop() {
      if (!this.isRunning) return;

      const elapsedMs = performance.now() - this.startTime;
      const elapsedSec = elapsedMs / 1000;

      // Subtle ticking sound on whole seconds
      const currentSec = Math.floor(elapsedSec);
      if (currentSec > this.lastTickSec && currentSec <= 12) {
        this.sound.playTick();
        this.lastTickSec = currentSec;
      }

      // Blindfold Mode logic: Blanks out at 5.000s!
      if (this.mode === 'blind' && elapsedSec >= 5.000) {
        this.clockDisplay.textContent = '??.???';
        this.clockDisplay.classList.add('blind-mode-active');
        this.blindNotice.classList.remove('hidden');
      } else {
        this.clockDisplay.textContent = this.formatSeconds(elapsedSec);
      }

      // Auto-stop safety if player wanders away past 25s
      if (elapsedSec >= 25.0) {
        this.stop();
        return;
      }

      this.animFrameId = requestAnimationFrame(() => this.loop());
    }

    stop() {
      this.isRunning = false;
      cancelAnimationFrame(this.animFrameId);

      const elapsedMs = performance.now() - this.startTime;
      const stoppedSeconds = elapsedMs / 1000;
      this.lastStoppedSeconds = stoppedSeconds;

      // Reveal actual stopped time
      this.clockDisplay.textContent = this.formatSeconds(stoppedSeconds);
      this.clockDisplay.classList.remove('blind-mode-active');
      this.blindNotice.classList.add('hidden');

      // Calculate Delta from 10.000s
      const deltaSec = stoppedSeconds - 10.000;
      const deltaMs = Math.round(Math.abs(deltaSec) * 1000);
      this.lastDeltaMs = deltaMs;

      this.sound.playStop();
      if ('vibrate' in navigator) {
        try { navigator.vibrate([40, 50]); } catch (_) {}
      }

      this.attemptsCount++;
      localStorage.setItem('p10_attempts', this.attemptsCount.toString());

      let isNewPb = false;
      if (deltaMs < this.bestDeltaMs) {
        this.bestDeltaMs = deltaMs;
        localStorage.setItem('p10_best_delta', deltaMs.toString());
        isNewPb = true;
      }

      this.updateHud();
      this.saveRecentAttempt(stoppedSeconds, deltaMs);

      // Check for Mythical Perfect 10.000s Hit!
      if (deltaMs <= 5) {
        this.sound.playPerfectFanfare();
        this.particles.burst(window.innerWidth / 2, window.innerHeight / 2, 70, ['#ffd700', '#00ff66', '#00f0ff']);
      }

      this.showResultModal(stoppedSeconds, deltaSec, deltaMs, isNewPb);
    }

    resetToReady() {
      this.isRunning = false;
      cancelAnimationFrame(this.animFrameId);
      this.btnTrigger.className = 'btn-trigger state-ready';
      this.btnLabel.textContent = 'START';
      this.btnSub.textContent = 'Click or Press SPACE';
      this.clockDisplay.textContent = '00.000';
      this.clockDisplay.classList.remove('blind-mode-active');
      this.blindNotice.classList.add('hidden');
    }

    formatSeconds(sec) {
      const s = Math.min(99.999, Math.max(0, sec));
      return s.toFixed(3).padStart(6, '0');
    }

    showResultModal(stoppedSec, deltaSec, deltaMs, isNewPb) {
      const rank = getChronoRank(deltaMs);

      document.getElementById('modal-stop-time').textContent = stoppedSec.toFixed(3);
      const sign = deltaSec >= 0 ? '+' : '-';
      document.getElementById('modal-delta-badge').textContent = `DELTA: ${sign}${deltaMs}ms (${deltaSec >= 0 ? 'LATE' : 'EARLY'})`;
      document.getElementById('modal-rank-icon').textContent = rank.icon;
      document.getElementById('modal-rank-tier').textContent = rank.tier;
      document.getElementById('modal-rank-title').textContent = rank.title;
      document.getElementById('modal-quote').textContent = `"${rank.quote}"`;
      document.getElementById('modal-percentile').textContent = `${rank.pct} Chrono Precision`;

      const pbEl = document.getElementById('modal-new-pb');
      if (isNewPb) {
        pbEl.classList.remove('hidden');
      } else {
        pbEl.classList.add('hidden');
      }

      // Rival Duel comparison
      const rivalBox = document.getElementById('rival-comparison-box');
      if (this.rivalTarget) {
        rivalBox.classList.remove('hidden');
        const diff = this.rivalTarget.deltaMs - deltaMs;
        const outcomeEl = document.getElementById('rival-outcome-text');
        if (diff > 0) {
          outcomeEl.innerHTML = `You beat ${this.escapeHtml(this.rivalTarget.name)} by <span style="color:var(--neon-green)">${diff}ms</span> closer to 10.000s! 🏆`;
        } else if (diff === 0) {
          outcomeEl.textContent = `TIE with ${this.rivalTarget.name}! Both at ±${deltaMs}ms!`;
        } else {
          outcomeEl.textContent = `${this.rivalTarget.name} was closer by ${Math.abs(diff)}ms. Try again!`;
        }
      } else {
        rivalBox.classList.add('hidden');
      }

      this.saveLeaderboard(stoppedSec, deltaMs, rank.title);
      this.resultModal.classList.remove('hidden');
    }

    saveRecentAttempt(sec, deltaMs) {
      const attempts = JSON.parse(localStorage.getItem('p10_recent_history') || '[]');
      attempts.unshift({ sec: sec.toFixed(3), delta: deltaMs });
      localStorage.setItem('p10_recent_history', JSON.stringify(attempts.slice(0, 5)));
      this.renderRecentAttempts();
    }

    renderRecentAttempts() {
      const attempts = JSON.parse(localStorage.getItem('p10_recent_history') || '[]');
      this.attemptsPills.innerHTML = '';
      if (attempts.length === 0) {
        this.attemptsPills.innerHTML = '<span style="font-size:0.75rem; color:#64748b;">No recent attempts</span>';
        return;
      }
      attempts.forEach(a => {
        const pill = document.createElement('span');
        pill.className = `attempt-pill ${a.delta <= 25 ? 'insane' : a.delta <= 100 ? 'good' : ''}`;
        pill.textContent = `${a.sec}s (±${a.delta}ms)`;
        this.attemptsPills.appendChild(pill);
      });
    }

    saveLeaderboard(sec, deltaMs, rankTitle) {
      const records = JSON.parse(localStorage.getItem('p10_leaderboard') || '[]');
      records.push({
        stopTime: `${sec.toFixed(3)}s`,
        delta: `±${deltaMs}ms`,
        deltaNum: deltaMs,
        rank: rankTitle,
        mode: this.mode.toUpperCase()
      });
      records.sort((a, b) => a.deltaNum - b.deltaNum);
      localStorage.setItem('p10_leaderboard', JSON.stringify(records.slice(0, 15)));
    }

    renderLeaderboard() {
      const tbody = document.getElementById('leaderboard-tbody');
      const empty = document.getElementById('leaderboard-empty');
      const records = JSON.parse(localStorage.getItem('p10_leaderboard') || '[]');
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
          <td style="font-family:var(--font-mono); font-weight:800;">${r.stopTime}</td>
          <td style="color:var(--neon-gold); font-family:var(--font-mono); font-weight:800;">${r.delta}</td>
          <td>${r.rank}</td>
          <td><span style="font-size:0.68rem; background:rgba(255,255,255,0.08); padding:2px 6px; border-radius:4px;">${r.mode}</span></td>
        `;
        tbody.appendChild(tr);
      });
    }

    updateHud() {
      this.hudAttempts.textContent = this.attemptsCount;
      this.hudBestDelta.textContent = this.bestDeltaMs < 9999 ? `±${this.bestDeltaMs}ms` : '-- ms';
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
      url.searchParams.set('vs', this.lastDeltaMs);
      url.searchParams.set('challenger', 'Player');
      return url.toString();
    }

    copyChallengeLink() {
      const link = this.getShareableLink();
      navigator.clipboard.writeText(link).then(() => {
        this.showToast(`Duel link copied! Beat ±${this.lastDeltaMs}ms`);
      });
    }

    shareWhatsApp() {
      const link = this.getShareableLink();
      const text = `⏱️ PERFECT 10.000: I stopped the timer at ${this.lastStoppedSeconds.toFixed(3)}s (only ±${this.lastDeltaMs}ms away from 10.000s)! Can your internal rhythm beat me? Try here:\n${link}`;
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
    }

    exportResultCard() {
      const canvas = document.getElementById('share-card-canvas');
      const ctx = canvas.getContext('2d');
      const rank = getChronoRank(this.lastDeltaMs);

      const grad = ctx.createLinearGradient(0, 0, 1200, 675);
      grad.addColorStop(0, '#090a0f');
      grad.addColorStop(1, '#1a1405');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1200, 675);

      ctx.strokeStyle = '#ffb703';
      ctx.lineWidth = 6;
      ctx.strokeRect(30, 30, 1140, 615);

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 42px Outfit, sans-serif';
      ctx.fillText("PERFECT ", 70, 95);
      ctx.fillStyle = '#ffb703';
      ctx.fillText("10.000", 255, 95);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '700 24px Outfit, sans-serif';
      ctx.fillText("STOPWATCH CHRONO ACCURACY", 70, 240);

      ctx.fillStyle = '#ffb703';
      ctx.font = '900 120px "Space Grotesk", monospace';
      ctx.fillText(`${this.lastStoppedSeconds.toFixed(3)}s`, 70, 360);

      ctx.fillStyle = '#181d2e';
      ctx.fillRect(660, 180, 480, 220);
      ctx.strokeStyle = 'rgba(255, 183, 3, 0.4)';
      ctx.lineWidth = 2;
      ctx.strokeRect(660, 180, 480, 220);

      ctx.font = '68px sans-serif';
      ctx.fillText(rank.icon, 700, 300);

      ctx.fillStyle = '#00ff66';
      ctx.font = '800 22px Outfit, sans-serif';
      ctx.fillText(`DELTA: ±${this.lastDeltaMs}ms`, 790, 255);

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 36px Outfit, sans-serif';
      ctx.fillText(rank.title, 790, 305);

      const link = document.createElement('a');
      link.download = `perfect-10-${this.lastStoppedSeconds.toFixed(3)}s.png`;
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
    window.game = new Perfect10Game();
  });
})();
