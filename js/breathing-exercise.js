// ========================================
// BREATHING EXERCISE CLASS
// Advanced interactive breathing practice
// ========================================

class BreathingExercise {
  constructor() {
    this.mode = 'therapeutic';  // therapeutic | resonance
    this.pattern = {
      inhale: 3000,   // ms
      hold1: 0,       // ms
      exhale: 3000,   // ms
      hold2: 0        // ms
    };

    this.state = 'idle';  // idle | running | paused | completed
    this.currentPhase = null;  // inhale | hold1 | exhale | hold2
    this.phaseIndex = 0;
    this.cycleCount = 0;
    this.startTime = null;
    this.pauseTime = null;
    this.totalPausedTime = 0;
    this.sessionDuration = 600000;  // 10 minutes in ms
    this.animationFrame = null;
    this.phaseTimeout = null;

    // Stats
    this.stats = {
      elapsedTime: 0,
      cycles: 0,
      currentBPM: 0
    };

    // Supabase (will be set from main app)
    this.supabase = null;
    this.currentUser = null;
  }

  // Initialize with supabase instance
  initialize(supabase, currentUser) {
    this.supabase = supabase;
    this.currentUser = currentUser;
    this.loadHistory();
  }

  // Select mode (therapeutic / resonance)
  selectMode(mode) {
    if (this.state !== 'idle') {
      alert('Detén la práctica actual antes de cambiar de modo');
      return;
    }

    this.mode = mode;

    // Update UI
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-mode') === mode);
    });

    // Show/hide settings panel
    const settingsPanel = document.getElementById('breathing-settings');
    if (mode === 'resonance') {
      settingsPanel.style.display = 'block';
    } else {
      settingsPanel.style.display = 'none';
      // Reset to therapeutic pattern
      this.pattern = {
        inhale: 3000,
        hold1: 0,
        exhale: 3000,
        hold2: 0
      };
    }

    this.updatePatternDisplay();
  }

  // Apply preset pattern
  applyPreset(presetName) {
    const presets = {
      coherence: { inhale: 5000, hold1: 0, exhale: 5000, hold2: 0 },
      box: { inhale: 4000, hold1: 4000, exhale: 4000, hold2: 4000 },
      '478': { inhale: 4000, hold1: 7000, exhale: 8000, hold2: 0 },
      calm: { inhale: 4000, hold1: 0, exhale: 6000, hold2: 0 }
    };

    if (!presets[presetName]) return;

    this.pattern = presets[presetName];

    // Update sliders
    document.getElementById('inhale-slider').value = this.pattern.inhale / 1000;
    document.getElementById('hold1-slider').value = this.pattern.hold1 / 1000;
    document.getElementById('exhale-slider').value = this.pattern.exhale / 1000;
    document.getElementById('hold2-slider').value = this.pattern.hold2 / 1000;

    // Update active preset button
    document.querySelectorAll('.preset-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    event.target.classList.add('active');

    this.updatePatternDisplay();
  }

  // Update pattern from slider
  updatePattern(phase, value) {
    const ms = parseFloat(value) * 1000;
    this.pattern[phase] = ms;

    // Update value display
    document.getElementById(`${phase}-value`).textContent = value;

    // Deselect all presets (custom pattern)
    document.querySelectorAll('.preset-btn').forEach(btn => {
      btn.classList.remove('active');
    });

    this.updatePatternDisplay();
  }

  // Update pattern display
  updatePatternDisplay() {
    const { inhale, hold1, exhale, hold2 } = this.pattern;
    const patternStr = `${inhale/1000}-${hold1/1000}-${exhale/1000}-${hold2/1000}`;
    document.getElementById('pattern-display').textContent = patternStr;

    // Calculate BPM
    const cycleDuration = (inhale + hold1 + exhale + hold2) / 1000;  // seconds
    const bpm = (60 / cycleDuration).toFixed(1);
    document.getElementById('pattern-bpm').textContent = bpm;
  }

  // Start exercise
  start() {
    if (this.state === 'running') return;

    this.state = 'running';
    this.startTime = Date.now();
    this.totalPausedTime = 0;
    this.cycleCount = 0;
    this.phaseIndex = 0;

    // Update UI
    document.getElementById('btn-start').style.display = 'none';
    document.getElementById('btn-pause').style.display = 'inline-block';
    document.getElementById('btn-stop').style.display = 'inline-block';
    document.getElementById('breathing-stats').style.display = 'grid';

    // Start first phase
    this.nextPhase();
    this.updateStats();
  }

  // Pause exercise
  pause() {
    if (this.state !== 'running') return;

    this.state = 'paused';
    this.pauseTime = Date.now();

    // Stop animations
    if (this.phaseTimeout) {
      clearTimeout(this.phaseTimeout);
      this.phaseTimeout = null;
    }
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }

    // Update UI
    document.getElementById('btn-pause').style.display = 'none';
    document.getElementById('btn-resume').style.display = 'inline-block';

    const instruction = document.getElementById('breathing-instruction');
    instruction.textContent = 'Pausado';
  }

  // Resume exercise
  resume() {
    if (this.state !== 'paused') return;

    this.state = 'running';

    // Calculate paused time
    const pauseDuration = Date.now() - this.pauseTime;
    this.totalPausedTime += pauseDuration;
    this.pauseTime = null;

    // Update UI
    document.getElementById('btn-pause').style.display = 'inline-block';
    document.getElementById('btn-resume').style.display = 'none';

    // Resume from current phase
    this.nextPhase();
    this.updateStats();
  }

  // Stop exercise
  stop() {
    if (this.state === 'idle') return;

    const wasRunning = this.state === 'running' || this.state === 'paused';

    this.state = 'idle';

    // Stop animations
    if (this.phaseTimeout) {
      clearTimeout(this.phaseTimeout);
      this.phaseTimeout = null;
    }
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }

    // Update UI
    document.getElementById('btn-start').style.display = 'inline-block';
    document.getElementById('btn-pause').style.display = 'none';
    document.getElementById('btn-resume').style.display = 'none';
    document.getElementById('btn-stop').style.display = 'none';

    const bubble = document.getElementById('breathing-bubble');
    bubble.className = 'breathing-bubble';

    const instruction = document.getElementById('breathing-instruction');
    instruction.innerHTML = 'Pulsa <strong>Iniciar</strong> para comenzar';

    // If session was meaningful (> 1 minute), show save modal
    const elapsedTime = this.calculateElapsedTime();
    if (wasRunning && elapsedTime > 60000) {
      this.showSaveModal();
    } else {
      // Reset stats
      document.getElementById('breathing-stats').style.display = 'none';
      this.resetStats();
    }
  }

  // Next phase in cycle
  nextPhase() {
    if (this.state !== 'running') return;

    const phases = ['inhale', 'hold1', 'exhale', 'hold2'];
    const phaseNames = {
      inhale: 'Inhala',
      hold1: 'Mantén',
      exhale: 'Exhala',
      hold2: 'Mantén'
    };

    this.currentPhase = phases[this.phaseIndex];
    const phaseDuration = this.pattern[this.currentPhase];

    // Skip phase if duration is 0
    if (phaseDuration === 0) {
      this.phaseIndex = (this.phaseIndex + 1) % 4;
      if (this.phaseIndex === 0) {
        this.cycleCount++;
      }
      this.nextPhase();
      return;
    }

    // Update instruction
    const instruction = document.getElementById('breathing-instruction');
    instruction.textContent = phaseNames[this.currentPhase];

    // Animate bubble
    this.animateBubble(this.currentPhase, phaseDuration);

    // Schedule next phase
    this.phaseTimeout = setTimeout(() => {
      this.phaseIndex = (this.phaseIndex + 1) % 4;

      // Completed a cycle
      if (this.phaseIndex === 0) {
        this.cycleCount++;
      }

      // Check if session duration reached
      const elapsed = this.calculateElapsedTime();
      if (elapsed >= this.sessionDuration) {
        this.complete();
      } else {
        this.nextPhase();
      }
    }, phaseDuration);
  }

  // Animate bubble
  animateBubble(phase, duration) {
    const bubble = document.getElementById('breathing-bubble');
    bubble.className = 'breathing-bubble ' + phase;
    bubble.style.setProperty('--inhale-duration', `${this.pattern.inhale}ms`);
    bubble.style.setProperty('--hold1-duration', `${this.pattern.hold1}ms`);
    bubble.style.setProperty('--exhale-duration', `${this.pattern.exhale}ms`);
    bubble.style.setProperty('--hold2-duration', `${this.pattern.hold2}ms`);

    // Set hold scale based on phase
    if (phase === 'hold1') {
      bubble.style.setProperty('--hold-scale', '2');
    } else if (phase === 'hold2') {
      bubble.style.setProperty('--hold-scale', '1');
    }
  }

  // Update stats panel
  updateStats() {
    if (this.state !== 'running') return;

    const elapsed = this.calculateElapsedTime();
    const minutes = Math.floor(elapsed / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    const totalMinutes = Math.floor(this.sessionDuration / 60000);

    // Timer
    document.getElementById('stat-timer').textContent =
      `${minutes}:${seconds.toString().padStart(2, '0')} / ${totalMinutes}:00`;

    // Cycles
    document.getElementById('stat-cycles').textContent = this.cycleCount;

    // BPM (real-time)
    if (this.cycleCount > 0 && elapsed > 0) {
      const bpm = (this.cycleCount / (elapsed / 60000)).toFixed(1);
      document.getElementById('stat-bpm').textContent = bpm;
    }

    // Progress bar
    const progress = (elapsed / this.sessionDuration) * 100;
    document.getElementById('stat-progress-bar').style.width = `${progress}%`;

    // Continue updating
    this.animationFrame = requestAnimationFrame(() => this.updateStats());
  }

  // Calculate elapsed time
  calculateElapsedTime() {
    if (!this.startTime) return 0;

    let elapsed = Date.now() - this.startTime - this.totalPausedTime;

    if (this.state === 'paused' && this.pauseTime) {
      elapsed -= (Date.now() - this.pauseTime);
    }

    return elapsed;
  }

  // Complete session
  complete() {
    this.state = 'completed';

    // Stop animations
    if (this.phaseTimeout) {
      clearTimeout(this.phaseTimeout);
      this.phaseTimeout = null;
    }
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }

    const instruction = document.getElementById('breathing-instruction');
    instruction.textContent = '✅ ¡Sesión Completada!';

    // Show save modal
    setTimeout(() => {
      this.showSaveModal();
    }, 1000);
  }

  // Show save modal
  showSaveModal() {
    const elapsed = this.calculateElapsedTime();
    const minutes = Math.floor(elapsed / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    const avgBPM = this.cycleCount > 0 ? (this.cycleCount / (elapsed / 60000)).toFixed(1) : 0;

    // Create modal HTML
    const modalHTML = `
      <div class="modal-overlay" id="save-breathing-modal">
        <div class="modal-content">
          <h2>📊 Resumen de Sesión</h2>

          <div class="summary-stats">
            <div class="summary-item">
              <span class="summary-icon">⏱️</span>
              <span class="summary-value">${minutes}:${seconds.toString().padStart(2, '0')}</span>
              <span class="summary-label">Duración</span>
            </div>
            <div class="summary-item">
              <span class="summary-icon">🔄</span>
              <span class="summary-value">${this.cycleCount}</span>
              <span class="summary-label">Ciclos</span>
            </div>
            <div class="summary-item">
              <span class="summary-icon">💓</span>
              <span class="summary-value">${avgBPM}</span>
              <span class="summary-label">BPM promedio</span>
            </div>
          </div>

          <div class="rating-section">
            <div class="rating-group">
              <label>¿Qué tan concentrado estuviste? (0-10)</label>
              <div class="scale-selector-modal" id="modal-concentration"></div>
              <input type="hidden" id="concentration-rating" value="5">
            </div>

            <div class="rating-group">
              <label>¿Qué tan exitosa fue la práctica? (0-10)</label>
              <div class="scale-selector-modal" id="modal-success"></div>
              <input type="hidden" id="success-rating" value="5">
            </div>
          </div>

          <div class="modal-buttons">
            <button class="btn-secondary" onclick="breathingExercise.cancelSave()">
              Cancelar
            </button>
            <button class="btn-primary" onclick="breathingExercise.saveSession()">
              💾 Guardar Sesión
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Initialize rating scales
    this.initializeModalScales();
  }

  // Initialize modal rating scales
  initializeModalScales() {
    ['modal-concentration', 'modal-success'].forEach(scaleId => {
      const container = document.getElementById(scaleId);
      const inputId = scaleId.replace('modal-', '') + '-rating';

      for (let i = 0; i <= 10; i++) {
        const option = document.createElement('div');
        option.className = 'scale-option-modal';
        option.textContent = i;
        option.onclick = () => {
          // Remove active from all
          container.querySelectorAll('.scale-option-modal').forEach(opt => {
            opt.classList.remove('active');
          });
          // Set active
          option.classList.add('active');
          document.getElementById(inputId).value = i;
        };

        // Default to 5
        if (i === 5) {
          option.classList.add('active');
        }

        container.appendChild(option);
      }
    });
  }

  // Cancel save (discard session)
  cancelSave() {
    const modal = document.getElementById('save-breathing-modal');
    if (modal) {
      modal.remove();
    }

    // Reset
    this.resetStats();
    document.getElementById('breathing-stats').style.display = 'none';

    const instruction = document.getElementById('breathing-instruction');
    instruction.innerHTML = 'Pulsa <strong>Iniciar</strong> para comenzar';
  }

  // Save session to Supabase
  async saveSession() {
    const concentrationRating = parseInt(document.getElementById('concentration-rating').value);
    const successRating = parseInt(document.getElementById('success-rating').value);

    const elapsed = this.calculateElapsedTime();
    const durationSeconds = Math.floor(elapsed / 1000);
    const avgBPM = this.cycleCount > 0 ? (this.cycleCount / (elapsed / 60000)) : 0;

    const sessionData = {
      user_id: this.currentUser.id,
      date: new Date().toISOString().split('T')[0],
      mode: this.mode,
      pattern: this.pattern,
      duration_seconds: durationSeconds,
      total_cycles: this.cycleCount,
      avg_breaths_per_minute: parseFloat(avgBPM.toFixed(1)),
      concentration_rating: concentrationRating,
      success_rating: successRating,
      completed: this.state === 'completed',
      practice_number: await this.getPracticeNumberToday()
    };

    const { data, error } = await this.supabase
      .from('breathing_records')
      .insert([sessionData]);

    if (error) {
      console.error('Error saving breathing session:', error);
      alert('Error al guardar la sesión. Por favor intenta de nuevo.');
      return;
    }

    // Close modal
    const modal = document.getElementById('save-breathing-modal');
    if (modal) {
      modal.remove();
    }

    // Show success message
    alert('✅ ¡Sesión guardada exitosamente!');

    // Reset and reload history
    this.resetStats();
    this.loadHistory();
    document.getElementById('breathing-stats').style.display = 'none';

    const instruction = document.getElementById('breathing-instruction');
    instruction.innerHTML = 'Pulsa <strong>Iniciar</strong> para comenzar';
  }

  // Get practice number for today
  async getPracticeNumberToday() {
    const today = new Date().toISOString().split('T')[0];

    const { count, error } = await this.supabase
      .from('breathing_records')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', this.currentUser.id)
      .eq('date', today);

    if (error) return 1;
    return (count || 0) + 1;
  }

  // Reset stats
  resetStats() {
    this.startTime = null;
    this.pauseTime = null;
    this.totalPausedTime = 0;
    this.cycleCount = 0;
    this.phaseIndex = 0;
    this.currentPhase = null;

    document.getElementById('stat-timer').textContent = '0:00 / 10:00';
    document.getElementById('stat-cycles').textContent = '0';
    document.getElementById('stat-bpm').textContent = '--';
    document.getElementById('stat-progress-bar').style.width = '0%';
  }

  // Load session history
  async loadHistory() {
    if (!this.supabase || !this.currentUser) return;

    const { data, error } = await this.supabase
      .from('breathing_records')
      .select('*')
      .eq('user_id', this.currentUser.id)
      .order('date', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error loading breathing history:', error);
      return;
    }

    const historyContainer = document.getElementById('breathing-history');
    if (!data || data.length === 0) {
      historyContainer.innerHTML = '<p style="color: var(--text-secondary); text-align: center;">No hay sesiones anteriores</p>';
      return;
    }

    historyContainer.innerHTML = data.map(session => {
      const minutes = Math.floor(session.duration_seconds / 60);
      const seconds = session.duration_seconds % 60;

      return `
        <div class="history-item">
          <div class="history-header">
            <span class="history-date">${new Date(session.date).toLocaleDateString('es-ES')}</span>
            <span class="history-mode">${session.mode === 'therapeutic' ? '🫁 Terapéutico' : '💙 Resonancia'}</span>
          </div>

          <div class="history-stats">
            <div class="history-stat">
              <span class="history-stat-label">⏱️ Duración</span>
              <span class="history-stat-value">${minutes}:${seconds.toString().padStart(2, '0')}</span>
            </div>
            <div class="history-stat">
              <span class="history-stat-label">🔄 Ciclos</span>
              <span class="history-stat-value">${session.total_cycles}</span>
            </div>
            <div class="history-stat">
              <span class="history-stat-label">💓 BPM</span>
              <span class="history-stat-value">${session.avg_breaths_per_minute}</span>
            </div>
          </div>

          <div class="history-ratings">
            <div class="rating-item">
              <span class="rating-label">Concentración</span>
              <span class="rating-value">${session.concentration_rating}/10</span>
            </div>
            <div class="rating-item">
              <span class="rating-label">Éxito</span>
              <span class="rating-value">${session.success_rating}/10</span>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }
}

// Global instance
let breathingExercise = null;

// Initialize after user is loaded
function initializeBreathingExercise() {
  if (!breathingExercise && currentUser && supabase) {
    breathingExercise = new BreathingExercise();
    breathingExercise.initialize(supabase, currentUser);
    console.log('Breathing exercise initialized');
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { BreathingExercise };
}
