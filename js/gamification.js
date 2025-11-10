// ========================================
// GAMIFICATION SYSTEM
// XP, Levels, Notifications, Celebrations
// ========================================

// Level Thresholds
const LEVEL_THRESHOLDS = [
  { level: 1, xp: 0, title: "Observador", color: "#E6EEF3", icon: "👀" },
  { level: 2, xp: 100, title: "Explorador", color: "#A8D5BA", icon: "🔍" },
  { level: 3, xp: 300, title: "Aprendiz", color: "#4A90E2", icon: "📚" },
  { level: 4, xp: 600, title: "Practicante", color: "#F6A192", icon: "💪" },
  { level: 5, xp: 1000, title: "Valiente", color: "#B4E1B3", icon: "🦁" },
  { level: 6, xp: 1500, title: "Guerrero", color: "#FFD93D", icon: "⚔️" },
  { level: 7, xp: 2200, title: "Maestro", color: "#FF6B9D", icon: "🎓" },
  { level: 8, xp: 3000, title: "Campeón", color: "#9D4EDD", icon: "🏆" },
  { level: 9, xp: 4000, title: "Leyenda", color: "#06FFA5", icon: "⭐" },
  { level: 10, xp: 5000, title: "Liberado", color: "gold", icon: "🦋" }
];

// XP Rewards
const XP_REWARDS = {
  // Monitoreo
  panic_attack_record: 10,
  daily_mood_record: 5,
  progress_record: 5,
  week_streak: 100,

  // Análisis
  parts_of_panic: 30,
  parts_of_anxiety: 30,
  step_by_step_analysis: 50,

  // Identificación
  agoraphobia_situations: 40,
  agoraphobia_hierarchy_item: 20,
  create_hierarchy: 100,
  superstitious_objects: 30,
  safety_behaviors: 30,

  // Respiración
  breathing_practice_session: 15,
  breathing_practice_day: 25,
  breathing_mastery: 150,
  perfect_breath_rate: 20,

  // Pensamiento
  negative_thought_identified: 20,
  changing_odds: 40,
  changing_perspective: 40,
  thought_restructured: 50,

  // Exposición
  symptom_assessment: 50,
  facing_symptoms_session: 80,
  facing_activity: 60,
  facing_situation: 100,
  hierarchy_item_mastered: 200,
  combined_exposure: 150,

  // Fases
  phase_1_complete: 100,
  phase_2_complete: 200,
  phase_3_complete: 300,
  phase_4_complete: 400,
  phase_5_complete: 500,
  phase_6_complete: 600,
  phase_7_complete: 700,
  phase_8_complete: 800,
  phase_9_complete: 1000,

  // Programa completo
  program_completed: 2000
};

class GamificationSystem {
  constructor() {
    this.supabase = null;
    this.currentUser = null;
    this.xpData = null;
  }

  // Initialize
  async initialize(supabase, currentUser) {
    this.supabase = supabase;
    this.currentUser = currentUser;

    if (!currentUser) return;

    // Load user XP data
    await this.loadXPData();
  }

  // Load user XP data
  async loadXPData() {
    const { data, error } = await this.supabase
      .from('user_xp')
      .select('*')
      .eq('user_id', this.currentUser.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error loading XP data:', error);
      return;
    }

    if (data) {
      this.xpData = data;
    } else {
      // Create initial XP record
      await this.createInitialXP();
    }
  }

  // Create initial XP record
  async createInitialXP() {
    const { data, error } = await this.supabase
      .from('user_xp')
      .insert([{
        user_id: this.currentUser.id,
        total_xp: 0,
        current_level: 1,
        xp_to_next_level: 100,
        xp_history: []
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating initial XP:', error);
      return;
    }

    this.xpData = data;
  }

  // Award XP
  async awardXP(amount, reason, exerciseId = null) {
    if (!this.xpData) {
      await this.loadXPData();
      if (!this.xpData) return;
    }

    const newTotal = this.xpData.total_xp + amount;
    const newLevel = this.calculateLevel(newTotal);
    const leveledUp = newLevel > this.xpData.current_level;

    // Update XP in database
    const { error } = await this.supabase
      .from('user_xp')
      .update({
        total_xp: newTotal,
        current_level: newLevel,
        xp_to_next_level: this.getXPForNextLevel(newLevel),
        xp_history: [
          ...this.xpData.xp_history,
          {
            date: new Date().toISOString(),
            amount,
            reason,
            exercise_id: exerciseId
          }
        ]
      })
      .eq('user_id', this.currentUser.id);

    if (error) {
      console.error('Error updating XP:', error);
      return;
    }

    // Update local data
    this.xpData.total_xp = newTotal;
    this.xpData.current_level = newLevel;

    // Update user_progress table as well
    await this.supabase
      .from('user_progress')
      .update({
        total_xp: newTotal,
        current_level: newLevel
      })
      .eq('user_id', this.currentUser.id);

    // Show XP notification
    this.showXPNotification(amount, reason);

    // Level up celebration
    if (leveledUp) {
      setTimeout(() => {
        this.celebrateLevelUp(newLevel);
      }, 1000);
    }

    return { newTotal, newLevel, leveledUp };
  }

  // Calculate level from XP
  calculateLevel(xp) {
    for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
      if (xp >= LEVEL_THRESHOLDS[i].xp) {
        return LEVEL_THRESHOLDS[i].level;
      }
    }
    return 1;
  }

  // Get XP needed for next level
  getXPForNextLevel(currentLevel) {
    const nextLevelData = LEVEL_THRESHOLDS.find(l => l.level === currentLevel + 1);
    return nextLevelData ? nextLevelData.xp : 999999;
  }

  // Get level info
  getLevelInfo(level) {
    return LEVEL_THRESHOLDS.find(l => l.level === level) || LEVEL_THRESHOLDS[0];
  }

  // Show XP notification
  showXPNotification(amount, reason) {
    const toast = document.createElement('div');
    toast.className = 'xp-toast';
    toast.innerHTML = `
      <div class="xp-toast-icon">⭐</div>
      <div class="xp-toast-details">
        <div class="xp-toast-amount">+${amount} XP</div>
        <div class="xp-toast-reason">${this.formatReason(reason)}</div>
      </div>
    `;

    document.body.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    // Animate out
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3500);

    // Play sound (optional)
    this.playSound('xp_gain');
  }

  // Format reason for display
  formatReason(reason) {
    const reasonMap = {
      panic_attack_record: 'Registro de pánico',
      daily_mood_record: 'Registro de ánimo',
      progress_record: 'Registro de progreso',
      week_streak: '¡7 días seguidos!',
      parts_of_panic: 'Analizar pánico',
      parts_of_anxiety: 'Analizar ansiedad',
      step_by_step_analysis: 'Análisis completo',
      agoraphobia_situations: 'Situaciones identificadas',
      create_hierarchy: 'Jerarquía creada',
      breathing_practice_session: 'Práctica de respiración',
      breathing_practice_day: 'Día de práctica completo',
      negative_thought_identified: 'Pensamiento identificado',
      changing_odds: 'Cambiar probabilidades',
      changing_perspective: 'Cambiar perspectiva',
      symptom_assessment: 'Evaluación de síntomas',
      facing_symptoms_session: 'Enfrentar síntomas',
      facing_situation: 'Enfrentar situación',
      hierarchy_item_mastered: '¡Item dominado!',
      combined_exposure: 'Exposición combinada'
    };

    return reasonMap[reason] || reason.replace(/_/g, ' ');
  }

  // Celebrate level up
  celebrateLevelUp(level) {
    const levelInfo = this.getLevelInfo(level);

    // Create celebration modal
    const modal = document.createElement('div');
    modal.className = 'level-up-modal';
    modal.innerHTML = `
      <div class="level-up-content">
        <div class="level-up-animation">
          <div class="level-up-icon">${levelInfo.icon}</div>
          <div class="level-up-rays"></div>
        </div>
        <h2 class="level-up-title">🎉 ¡SUBISTE DE NIVEL!</h2>
        <div class="level-up-number">Nivel ${level}</div>
        <div class="level-up-subtitle">${levelInfo.title}</div>
        <div class="level-up-xp">
          Total: ${this.xpData.total_xp} XP
        </div>
        <button class="btn-primary level-up-btn" onclick="this.closest('.level-up-modal').remove()">
          ¡Continuar!
        </button>
      </div>
    `;

    document.body.appendChild(modal);

    // Animate in
    requestAnimationFrame(() => {
      modal.classList.add('show');
    });

    // Confetti effect (simple CSS animation)
    this.triggerConfetti();

    // Play sound
    this.playSound('level_up');
  }

  // Trigger confetti animation
  triggerConfetti() {
    for (let i = 0; i < 50; i++) {
      setTimeout(() => {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.backgroundColor = ['#4A90E2', '#A8D5BA', '#F6A192', '#FFD93D', '#9D4EDD'][Math.floor(Math.random() * 5)];
        confetti.style.animationDelay = Math.random() * 0.3 + 's';
        confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';

        document.body.appendChild(confetti);

        setTimeout(() => confetti.remove(), 4000);
      }, i * 30);
    }
  }

  // Play sound (placeholder - can be implemented later)
  playSound(soundName) {
    // TODO: Implement sound effects
    // For now, just log
    console.log(`Sound: ${soundName}`);
  }

  // Get current progress to next level
  getProgressToNextLevel() {
    if (!this.xpData) return { current: 0, needed: 100, percent: 0 };

    const currentLevel = this.xpData.current_level;
    const currentXP = this.xpData.total_xp;
    const currentLevelThreshold = this.getLevelInfo(currentLevel).xp;
    const nextLevelThreshold = this.getXPForNextLevel(currentLevel);

    const xpInCurrentLevel = currentXP - currentLevelThreshold;
    const xpNeededForNext = nextLevelThreshold - currentLevelThreshold;
    const percent = (xpInCurrentLevel / xpNeededForNext) * 100;

    return {
      current: xpInCurrentLevel,
      needed: xpNeededForNext,
      percent: Math.min(percent, 100)
    };
  }
}

// Global instance
let gamification = null;

// Initialize gamification system
function initializeGamification() {
  if (!gamification && currentUser && supabase) {
    gamification = new GamificationSystem();
    gamification.initialize(supabase, currentUser);
    console.log('Gamification system initialized');
  }
  return gamification;
}

// Helper function to award XP (shortcut)
async function awardXP(amount, reason, exerciseId = null) {
  if (!gamification) {
    gamification = initializeGamification();
  }

  if (gamification) {
    return await gamification.awardXP(amount, reason, exerciseId);
  }
}

// Helper function to get XP reward amount
function getXPReward(actionKey) {
  return XP_REWARDS[actionKey] || 0;
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { GamificationSystem, LEVEL_THRESHOLDS, XP_REWARDS };
}
