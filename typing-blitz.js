/**
 * TYPING BLITZ — 30-Second WPM Arcade Engine
 * Dynamic word streaming, character-level verification, live WPM math,
 * Web Audio typewriter sounds, canvas sparks, and viral duel links.
 */

(() => {
  'use strict';

  // =========================================================================
  // 1. Word Bank
  // =========================================================================
  const WORDS_BANK = [
    'reflex', 'speed', 'cyber', 'neural', 'optical', 'pulse', 'chrono', 'blitz',
    'quick', 'laser', 'matrix', 'stream', 'turbo', 'spark', 'rapid', 'rhythm',
    'precision', 'eagle', 'focus', 'ghost', 'titan', 'ultra', 'stealth', 'strike',
    'arcade', 'power', 'boost', 'human', 'react', 'flash', 'hyper', 'shadow',
    'target', 'pixel', 'clutch', 'drift', 'vortex', 'vector', 'glide', 'phase',
    'charge', 'apex', 'vision', 'signal', 'burst', 'screen', 'engine', 'click',
    'timer', 'light', 'sound', 'score', 'match', 'round', 'level', 'player',
    'glitch', 'nerve', 'optic', 'force', 'fluid', 'tempo', 'sharp', 'swift',
    'action', 'combo', 'streak', 'radar', 'sonar', 'atomic', 'quartz', 'motion',
    'energy', 'master', 'legend', 'winner', 'record', 'divide', 'future', 'orbit'
  ];

  // =========================================================================
  // 2. Audio Engine
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

    playKey() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;
      const freq = 600 + Math.random() * 200;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(now + 0.04);
    }

    playTypo() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(now + 0.12);
    }

    playWordComplete() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(now + 0.08);
    }

    playGameOver() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((f, i) => {
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
  // 3. Particle Engine
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

    burst(x, y, count = 18, color = '#38bdf8') {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 5 + 2;
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
  // 4. Typing Ranks
  // =========================================================================
  const TYPING_RANKS = [
    { minWpm: 90, tier: 'TIER S+', title: 'FIBER OPTIC TYPIST', icon: '⚡', quote: 'Inhuman keyboard execution. Your fingers fire faster than neural synapse limits.', pct: 'Top 1%' },
    { minWpm: 70, tier: 'TIER S', title: 'KEYBOARD GOD', icon: '⌨️', quote: 'Esports tournament typing speed. Smooth, accurate mechanical flow.', pct: 'Top 6%' },
    { minWpm: 50, tier: 'TIER A', title: 'PRO SPEED TYPIST', icon: '🏎️', quote: 'Fast, sharp cadence comfortably outrunning typical office benchmarks.', pct: 'Top 25%' },
    { minWpm: 32, tier: 'TIER B', title: 'AVERAGE HUMAN', icon: '🚶', quote: 'Reliable everyday speed, right in line with the global human median.', pct: 'Top 65%' },
    { minWpm: 0, tier: 'TIER D', title: 'TWO-FINGER PEKKER', icon: '🐢', quote: 'Are you searching for each key individually, or did your keyboard stick?', pct: 'Bottom 35%' }
  ];

  function getTypingRank(wpm) {
    return TYPING_RANKS.find(r => wpm >= r.minWpm) || TYPING_RANKS[TYPING_RANKS.length - 1];
  }

  // =========================================================================
  // 5. Main Game Controller
  // =========================================================================
  class TypingBlitzGame {
    constructor() {
      // DOM Elements
      this.wordsContainer = document.getElementById('words-container');
      this.typeInput = document.getElementById('type-input');
      this.btnRestart = document.getElementById('btn-restart');
      this.hudTimer = document.getElementById('hud-timer');
      this.hudWpm = document.getElementById('hud-wpm');
      this.hudAccuracy = document.getElementById('hud-accuracy');
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

      // Rival Elements
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
      this.words = [];
      this.currentWordIndex = 0;
      this.correctChars = 0;
      this.totalTypedChars = 0;
      this.completedWordsCount = 0;
      this.bestWpm = parseInt(localStorage.getItem('tb_best_wpm') || '0', 10);
      this.rivalTarget = null;

      this.updateSoundIcons();
      this.hudBest.textContent = this.bestWpm;
      this.checkUrlChallenge();
      this.bindEvents();
    }

    checkUrlChallenge() {
      const params = new URLSearchParams(window.location.search);
      const vs = params.get('vs');
      const name = params.get('challenger') || 'Rival';
      if (vs && !isNaN(parseInt(vs, 10))) {
        this.rivalTarget = { wpm: parseInt(vs, 10), name };
        this.challengerNameEl.textContent = name;
        this.challengerScoreEl.textContent = `${vs} WPM`;
        this.incomingBanner.classList.remove('hidden');
        this.challengeBadge.classList.remove('hidden');
        this.challengeBadgeText.textContent = `Beat ${vs} WPM (${name})`;
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

      this.btnRestart.addEventListener('click', () => {
        this.startBlitz();
      });

      this.typeInput.addEventListener('input', (e) => this.handleInput(e));

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

    generateWordsList(count = 90) {
      const list = [];
      for (let i = 0; i < count; i++) {
        const r = WORDS_BANK[Math.floor(Math.random() * WORDS_BANK.length)];
        list.push(r);
      }
      return list;
    }

    startBlitz() {
      this.isRunning = true;
      this.timeLeft = 30.0;
      this.currentWordIndex = 0;
      this.correctChars = 0;
      this.totalTypedChars = 0;
      this.completedWordsCount = 0;
      this.words = this.generateWordsList(90);

      this.hudWpm.textContent = '0';
      this.hudAccuracy.textContent = '100%';
      this.hudTimer.textContent = this.timeLeft.toFixed(1);
      this.hudTimer.classList.remove('low-time');

      this.renderWordsDOM();
      this.typeInput.value = '';
      this.typeInput.disabled = false;
      this.typeInput.focus();

      if (this.timerInterval) clearInterval(this.timerInterval);
      this.timerInterval = setInterval(() => this.tick(), 100);
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
        this.updateLiveWpm();
      }
    }

    renderWordsDOM() {
      this.wordsContainer.innerHTML = '';
      this.words.forEach((w, idx) => {
        const span = document.createElement('span');
        span.className = `word ${idx === 0 ? 'current' : ''}`;
        span.id = `word-${idx}`;

        // Wrap each character
        w.split('').forEach(char => {
          const cSpan = document.createElement('span');
          cSpan.className = 'char';
          cSpan.textContent = char;
          span.appendChild(cSpan);
        });

        this.wordsContainer.appendChild(span);
      });
    }

    handleInput(e) {
      if (!this.isRunning) return;

      const rawVal = this.typeInput.value;
      const targetWord = this.words[this.currentWordIndex];
      const wordEl = document.getElementById(`word-${this.currentWordIndex}`);
      if (!wordEl) return;

      // Check if user hit Space (word submission)
      if (rawVal.endsWith(' ')) {
        const typedWord = rawVal.trim();
        if (typedWord.length > 0) {
          if (typedWord === targetWord) {
            this.sound.playWordComplete();
            this.completedWordsCount++;
            this.correctChars += (targetWord.length + 1); // +1 for the space

            // Particle burst at input box
            const rect = this.typeInput.getBoundingClientRect();
            this.particles.burst(rect.left + rect.width / 2, rect.top, 14, '#38bdf8');
          } else {
            this.sound.playTypo();
          }

          wordEl.classList.remove('current');
          this.currentWordIndex++;

          const nextEl = document.getElementById(`word-${this.currentWordIndex}`);
          if (nextEl) {
            nextEl.classList.add('current');
            nextEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }

          this.typeInput.value = '';
          this.updateLiveWpm();
          return;
        }
      }

      // Character-by-character live validation
      this.totalTypedChars++;
      const charEls = wordEl.querySelectorAll('.char');
      let isMismatch = false;

      for (let i = 0; i < charEls.length; i++) {
        const cEl = charEls[i];
        if (i < rawVal.length) {
          if (rawVal[i] === targetWord[i]) {
            cEl.className = 'char correct';
          } else {
            cEl.className = 'char wrong';
            isMismatch = true;
          }
        } else {
          cEl.className = 'char';
        }
      }

      if (isMismatch) {
        this.sound.playTypo();
      } else {
        this.sound.playKey();
      }

      this.updateLiveWpm();
    }

    updateLiveWpm() {
      const elapsedSec = Math.max(0.5, 30.0 - this.timeLeft);
      const minutes = elapsedSec / 60;
      const wpm = Math.max(0, Math.round((this.correctChars / 5) / minutes));
      this.hudWpm.textContent = wpm;

      const acc = this.totalTypedChars > 0 ? Math.min(100, Math.round((this.correctChars / this.totalTypedChars) * 100)) : 100;
      this.hudAccuracy.textContent = `${acc}%`;
    }

    gameOver() {
      this.isRunning = false;
      clearInterval(this.timerInterval);
      this.typeInput.disabled = true;
      this.sound.playGameOver();

      const elapsedMin = 0.5; // exactly 30s
      const finalWpm = Math.max(0, Math.round((this.correctChars / 5) / elapsedMin));
      const acc = this.totalTypedChars > 0 ? Math.min(100, Math.round((this.correctChars / this.totalTypedChars) * 100)) : 100;
      const cpm = Math.round(finalWpm * 5);

      let isNewPb = false;
      if (finalWpm > this.bestWpm) {
        this.bestWpm = finalWpm;
        localStorage.setItem('tb_best_wpm', finalWpm.toString());
        this.hudBest.textContent = this.bestWpm;
        isNewPb = true;
      }

      const rank = getTypingRank(finalWpm);

      document.getElementById('final-wpm').textContent = finalWpm;
      document.getElementById('final-accuracy').textContent = `${acc}%`;
      document.getElementById('final-cpm').textContent = `${cpm} CPM`;
      document.getElementById('final-words').textContent = this.completedWordsCount;
      document.getElementById('final-rank-icon').textContent = rank.icon;
      document.getElementById('final-rank-tier').textContent = rank.tier;
      document.getElementById('final-rank-title').textContent = rank.title;
      document.getElementById('final-sassy-msg').textContent = `"${rank.quote}"`;
      document.getElementById('final-percentile').textContent = `${rank.pct} Global Typing Speed`;

      const pbBadge = document.getElementById('new-pb-badge');
      if (isNewPb) {
        pbBadge.classList.remove('hidden');
        this.particles.burst(window.innerWidth / 2, window.innerHeight / 3, 50, ['#38bdf8', '#00ff66', '#ffffff']);
      } else {
        pbBadge.classList.add('hidden');
      }

      // Rival Duel Comparison
      const rivalBox = document.getElementById('rival-comparison-box');
      if (this.rivalTarget) {
        rivalBox.classList.remove('hidden');
        const diff = finalWpm - this.rivalTarget.wpm;
        const outcomeEl = document.getElementById('rival-outcome-text');
        if (diff > 0) {
          outcomeEl.innerHTML = `You typed <span style="color:var(--neon-green)">+${diff} WPM faster</span> than ${this.escapeHtml(this.rivalTarget.name)}! 🏆`;
        } else if (diff === 0) {
          outcomeEl.textContent = `TIE with ${this.rivalTarget.name} at ${finalWpm} WPM!`;
        } else {
          outcomeEl.textContent = `${this.rivalTarget.name} was faster by ${Math.abs(diff)} WPM. Rematch!`;
        }
      } else {
        rivalBox.classList.add('hidden');
      }

      this.saveLeaderboard(finalWpm, acc, rank.title);
      this.gameOverModal.classList.remove('hidden');
    }

    saveLeaderboard(wpm, acc, rankTitle) {
      const records = JSON.parse(localStorage.getItem('tb_leaderboard_wpm') || '[]');
      records.push({
        wpm,
        acc: `${acc}%`,
        rank: rankTitle,
        date: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      });
      records.sort((a, b) => b.wpm - a.wpm);
      localStorage.setItem('tb_leaderboard_wpm', JSON.stringify(records.slice(0, 15)));
    }

    renderLeaderboard() {
      const tbody = document.getElementById('leaderboard-tbody');
      const empty = document.getElementById('leaderboard-empty');
      const records = JSON.parse(localStorage.getItem('tb_leaderboard_wpm') || '[]');
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
          <td style="color:var(--neon-blue); font-family:var(--font-mono); font-weight:800;">${r.wpm} WPM</td>
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
      const wpm = document.getElementById('final-wpm').textContent;
      const url = new URL(window.location.href.split('?')[0]);
      url.searchParams.set('vs', wpm);
      url.searchParams.set('challenger', 'Player');
      return url.toString();
    }

    copyChallengeLink() {
      const wpm = document.getElementById('final-wpm').textContent;
      const link = this.getShareableLink();
      navigator.clipboard.writeText(link).then(() => {
        this.showToast(`Duel link copied! Beat ${wpm} WPM`);
      });
    }

    shareWhatsApp() {
      const wpm = document.getElementById('final-wpm').textContent;
      const rank = getTypingRank(parseInt(wpm, 10));
      const link = this.getShareableLink();
      const text = `⌨️ TYPING BLITZ: I clocked ${wpm} WPM in 30 seconds (${rank.title} ${rank.icon})! Can your keyboard speed beat me? Play here:\n${link}`;
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
    }

    exportResultCard() {
      const canvas = document.getElementById('share-card-canvas');
      const ctx = canvas.getContext('2d');
      const wpm = parseInt(document.getElementById('final-wpm').textContent, 10);
      const rank = getTypingRank(wpm);

      const grad = ctx.createLinearGradient(0, 0, 1200, 675);
      grad.addColorStop(0, '#090a0f');
      grad.addColorStop(1, '#0c1a29');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1200, 675);

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 6;
      ctx.strokeRect(30, 30, 1140, 615);

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 42px Outfit, sans-serif';
      ctx.fillText("TYPING ", 70, 95);
      ctx.fillStyle = '#38bdf8';
      ctx.fillText("BLITZ", 235, 95);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '700 24px Outfit, sans-serif';
      ctx.fillText("30-SECOND WPM SPEED BENCHMARK", 70, 240);

      ctx.fillStyle = '#38bdf8';
      ctx.font = '900 120px "Space Grotesk", monospace';
      ctx.fillText(`${wpm}`, 70, 360);
      const tw = ctx.measureText(`${wpm}`).width;
      ctx.fillStyle = '#94a3b8';
      ctx.font = '700 40px "Space Grotesk", monospace';
      ctx.fillText("WPM", 85 + tw, 350);

      ctx.fillStyle = '#181d2e';
      ctx.fillRect(660, 180, 480, 220);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
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
      link.download = `typing-blitz-${wpm}-wpm.png`;
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
    window.game = new TypingBlitzGame();
  });
})();
