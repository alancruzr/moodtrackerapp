// ========================================
// BADGES SYSTEM
// Badge definitions, checking, and unlocking
// ========================================

// Badge definitions with conditions
const BADGES = {
  // ========================================
  // INICIO Y MONITOREO
  // ========================================
  first_steps: {
    id: 'first_steps',
    name: 'Primeros Pasos',
    icon: '👣',
    description: 'Registra tu primer ataque de pánico',
    category: 'inicio',
    xpReward: 50,
    condition: async (userId, supabase) => {
      const { count } = await supabase
        .from('panic_attacks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      return count >= 1;
    }
  },

  first_mood: {
    id: 'first_mood',
    name: 'Primer Registro',
    icon: '😌',
    description: 'Registra tu primer estado de ánimo',
    category: 'inicio',
    xpReward: 30,
    condition: async (userId, supabase) => {
      const { count } = await supabase
        .from('daily_moods')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      return count >= 1;
    }
  },

  week_warrior: {
    id: 'week_warrior',
    name: '7 Días Consecutivos',
    icon: '🔥',
    description: 'Registra tu estado de ánimo 7 días seguidos',
    category: 'monitoreo',
    xpReward: 150,
    condition: async (userId, supabase) => {
      const { data } = await supabase
        .from('user_streaks')
        .select('monitoring_streak')
        .eq('user_id', userId)
        .single();
      return data?.monitoring_streak >= 7;
    }
  },

  month_master: {
    id: 'month_master',
    name: 'Mes Completo',
    icon: '🌟',
    description: '30 días consecutivos de monitoreo',
    category: 'monitoreo',
    xpReward: 500,
    condition: async (userId, supabase) => {
      const { data } = await supabase
        .from('user_streaks')
        .select('monitoring_streak')
        .eq('user_id', userId)
        .single();
      return data?.monitoring_streak >= 30;
    }
  },

  // ========================================
  // ANÁLISIS Y COMPRENSIÓN
  // ========================================
  understand_cycle: {
    id: 'understand_cycle',
    name: 'Entiendo mi Pánico',
    icon: '💡',
    description: 'Completa el análisis paso a paso',
    category: 'analisis',
    xpReward: 100,
    condition: async (userId, supabase) => {
      const { count } = await supabase
        .from('step_by_step_analysis')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      return count >= 1;
    }
  },

  pattern_detective: {
    id: 'pattern_detective',
    name: 'Detective de Patrones',
    icon: '🔍',
    description: 'Analiza 5 ataques de pánico',
    category: 'analisis',
    xpReward: 150,
    condition: async (userId, supabase) => {
      const { count } = await supabase
        .from('panic_attacks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      return count >= 5;
    }
  },

  // ========================================
  // IDENTIFICACIÓN Y OBJETIVOS
  // ========================================
  hierarchy_created: {
    id: 'hierarchy_created',
    name: 'Mapa Creado',
    icon: '🗺️',
    description: 'Crea tu jerarquía de exposición',
    category: 'objetivos',
    xpReward: 200,
    condition: async (userId, supabase) => {
      const { count } = await supabase
        .from('agoraphobia_hierarchy')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      return count >= 3;
    }
  },

  goal_setter: {
    id: 'goal_setter',
    name: 'Establecedor de Metas',
    icon: '🎯',
    description: 'Identifica 10 situaciones agorafóbicas',
    category: 'objetivos',
    xpReward: 100,
    condition: async (userId, supabase) => {
      const { count } = await supabase
        .from('agoraphobia_situations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      return count >= 1;
    }
  },

  // ========================================
  // RESPIRACIÓN
  // ========================================
  first_breath: {
    id: 'first_breath',
    name: 'Primera Respiración',
    icon: '🫁',
    description: 'Completa tu primera sesión de respiración',
    category: 'respiracion',
    xpReward: 50,
    condition: async (userId, supabase) => {
      const { count } = await supabase
        .from('breathing_records')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      return count >= 1;
    }
  },

  breathing_week: {
    id: 'breathing_week',
    name: 'Semana de Respiración',
    icon: '🌬️',
    description: '7 días de práctica de respiración',
    category: 'respiracion',
    xpReward: 200,
    condition: async (userId, supabase) => {
      const { data } = await supabase
        .from('user_streaks')
        .select('breathing_streak')
        .eq('user_id', userId)
        .single();
      return data?.breathing_streak >= 7;
    }
  },

  breathing_master: {
    id: 'breathing_master',
    name: 'Maestro de Respiración',
    icon: '🧘',
    description: '14 días de práctica de respiración',
    category: 'respiracion',
    xpReward: 400,
    condition: async (userId, supabase) => {
      const { data } = await supabase
        .from('user_streaks')
        .select('breathing_streak')
        .eq('user_id', userId)
        .single();
      return data?.breathing_streak >= 14;
    }
  },

  perfect_rhythm: {
    id: 'perfect_rhythm',
    name: 'Ritmo Perfecto',
    icon: '🎯',
    description: '5 sesiones con BPM perfecto (9.5-10.5)',
    category: 'respiracion',
    xpReward: 150,
    condition: async (userId, supabase) => {
      const { count } = await supabase
        .from('breathing_records')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('avg_breaths_per_minute', 9.5)
        .lte('avg_breaths_per_minute', 10.5);
      return count >= 5;
    }
  },

  zen_master: {
    id: 'zen_master',
    name: 'Maestro Zen',
    icon: '☯️',
    description: 'Completa 30 sesiones de respiración',
    category: 'respiracion',
    xpReward: 600,
    condition: async (userId, supabase) => {
      const { count } = await supabase
        .from('breathing_records')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      return count >= 30;
    }
  },

  // ========================================
  // PENSAMIENTO
  // ========================================
  thought_challenger: {
    id: 'thought_challenger',
    name: 'Retador de Pensamientos',
    icon: '🧠',
    description: 'Reestructura 10 pensamientos negativos',
    category: 'pensamiento',
    xpReward: 200,
    condition: async (userId, supabase) => {
      const { count } = await supabase
        .from('changing_odds')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      return count >= 10;
    }
  },

  perspective_shifter: {
    id: 'perspective_shifter',
    name: 'Cambiador de Perspectiva',
    icon: '👁️',
    description: 'Cambia 5 perspectivas catastróficas',
    category: 'pensamiento',
    xpReward: 150,
    condition: async (userId, supabase) => {
      const { count } = await supabase
        .from('changing_perspective')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      return count >= 5;
    }
  },

  // ========================================
  // EXPOSICIÓN
  // ========================================
  symptom_warrior: {
    id: 'symptom_warrior',
    name: 'Guerrero de Síntomas',
    icon: '💪',
    description: '10 sesiones de enfrentamiento de síntomas',
    category: 'exposicion',
    xpReward: 300,
    condition: async (userId, supabase) => {
      const { count } = await supabase
        .from('facing_symptoms')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      return count >= 10;
    }
  },

  fear_facer: {
    id: 'fear_facer',
    name: 'Enfrentador de Miedos',
    icon: '🦁',
    description: 'Enfrenta tu primera situación de agorafobia',
    category: 'exposicion',
    xpReward: 150,
    condition: async (userId, supabase) => {
      const { count } = await supabase
        .from('facing_agoraphobia')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      return count >= 1;
    }
  },

  first_victory: {
    id: 'first_victory',
    name: 'Primera Victoria',
    icon: '🎯',
    description: 'Domina tu primer ítem de jerarquía (ansiedad ≤ 3)',
    category: 'exposicion',
    xpReward: 250,
    condition: async (userId, supabase) => {
      const { count } = await supabase
        .from('facing_agoraphobia')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .lte('max_anxiety', 3);
      return count >= 1;
    }
  },

  half_hierarchy: {
    id: 'half_hierarchy',
    name: 'A Mitad de Camino',
    icon: '⛰️',
    description: 'Domina la mitad de tu jerarquía',
    category: 'exposicion',
    xpReward: 400,
    condition: async (userId, supabase) => {
      // Count total items in hierarchy
      const { count: total } = await supabase
        .from('agoraphobia_hierarchy')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (!total || total === 0) return false;

      // Count mastered items (max_anxiety <= 3)
      const { data } = await supabase
        .from('facing_agoraphobia')
        .select('situation, max_anxiety')
        .eq('user_id', userId)
        .lte('max_anxiety', 3);

      const mastered = data ? data.length : 0;
      return mastered >= Math.ceil(total / 2);
    }
  },

  hierarchy_champion: {
    id: 'hierarchy_champion',
    name: 'Conquistador de Jerarquía',
    icon: '🏆',
    description: 'Domina toda tu jerarquía',
    category: 'exposicion',
    xpReward: 800,
    condition: async (userId, supabase) => {
      const { count: total } = await supabase
        .from('agoraphobia_hierarchy')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (!total || total === 0) return false;

      const { data } = await supabase
        .from('facing_agoraphobia')
        .select('situation, max_anxiety')
        .eq('user_id', userId)
        .lte('max_anxiety', 3);

      const mastered = data ? data.length : 0;
      return mastered >= total;
    }
  },

  // ========================================
  // ESPECIALES
  // ========================================
  night_warrior: {
    id: 'night_warrior',
    name: 'Guerrero Nocturno',
    icon: '🌙',
    description: 'Registra un ataque de pánico nocturno',
    category: 'especial',
    xpReward: 100,
    condition: async (userId, supabase) => {
      const { count } = await supabase
        .from('panic_attacks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .or('time_began.gte.22:00,time_began.lte.06:00');
      return count >= 1;
    }
  },

  brave_exposure: {
    id: 'brave_exposure',
    name: 'Exposición Valiente',
    icon: '🛡️',
    description: 'Completa una exposición con ansiedad > 8',
    category: 'especial',
    xpReward: 200,
    condition: async (userId, supabase) => {
      const { count } = await supabase
        .from('facing_agoraphobia')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('max_anxiety', 8);
      return count >= 1;
    }
  },

  no_panic_week: {
    id: 'no_panic_week',
    name: 'Semana Sin Pánico',
    icon: '☮️',
    description: 'Una semana completa sin ataques de pánico',
    category: 'especial',
    xpReward: 300,
    condition: async (userId, supabase) => {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const { count } = await supabase
        .from('panic_attacks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('date', oneWeekAgo.toISOString().split('T')[0]);

      return count === 0;
    }
  },

  // ========================================
  // COMPLETITUD
  // ========================================
  phase_3_complete: {
    id: 'phase_3_complete',
    name: 'Fase 3 Completa',
    icon: '🎯',
    description: 'Completa la Fase 3: Identificar',
    category: 'fases',
    xpReward: 300,
    condition: async (userId, supabase) => {
      const { data } = await supabase
        .from('user_progress')
        .select('current_phase')
        .eq('user_id', userId)
        .single();
      return data?.current_phase >= 4;
    }
  },

  phase_6_complete: {
    id: 'phase_6_complete',
    name: 'Fase 6 Completa',
    icon: '⚡',
    description: 'Completa la Fase 6: Síntomas',
    category: 'fases',
    xpReward: 600,
    condition: async (userId, supabase) => {
      const { data } = await supabase
        .from('user_progress')
        .select('current_phase')
        .eq('user_id', userId)
        .single();
      return data?.current_phase >= 7;
    }
  },

  program_complete: {
    id: 'program_complete',
    name: 'Programa Completo',
    icon: '👑',
    description: 'Completa todo el programa',
    category: 'fases',
    xpReward: 2000,
    condition: async (userId, supabase) => {
      const { data } = await supabase
        .from('user_progress')
        .select('current_phase')
        .eq('user_id', userId)
        .single();
      return data?.current_phase >= 9;
    }
  }
};

// Badge System Class
class BadgeSystem {
  constructor() {
    this.supabase = null;
    this.currentUser = null;
    this.unlockedBadges = [];
  }

  async initialize(supabase, currentUser) {
    this.supabase = supabase;
    this.currentUser = currentUser;

    if (!currentUser) return;

    // Load unlocked badges
    await this.loadUnlockedBadges();
  }

  async loadUnlockedBadges() {
    const { data, error } = await this.supabase
      .from('user_badges')
      .select('*')
      .eq('user_id', this.currentUser.id);

    if (error) {
      console.error('Error loading badges:', error);
      return;
    }

    this.unlockedBadges = data || [];
  }

  hasBadge(badgeId) {
    return this.unlockedBadges.some(b => b.badge_id === badgeId);
  }

  async checkBadge(badgeId) {
    const badge = BADGES[badgeId];
    if (!badge) return false;

    // Check if already has badge
    if (this.hasBadge(badgeId)) return false;

    // Check condition
    try {
      const unlocked = await badge.condition(this.currentUser.id, this.supabase);

      if (unlocked) {
        await this.unlockBadge(badgeId);
        return true;
      }
    } catch (error) {
      console.error(`Error checking badge ${badgeId}:`, error);
    }

    return false;
  }

  async unlockBadge(badgeId) {
    const badge = BADGES[badgeId];
    if (!badge) return;

    // Insert badge
    const { error } = await this.supabase
      .from('user_badges')
      .insert([{
        user_id: this.currentUser.id,
        badge_id: badgeId,
        badge_name: badge.name,
        badge_icon: badge.icon,
        description: badge.description
      }]);

    if (error) {
      console.error('Error unlocking badge:', error);
      return;
    }

    // Add to local array
    this.unlockedBadges.push({
      badge_id: badgeId,
      badge_name: badge.name,
      badge_icon: badge.icon,
      description: badge.description,
      unlocked_at: new Date().toISOString()
    });

    // Show unlock modal
    this.showBadgeUnlockModal(badge);

    // Award XP
    if (badge.xpReward && typeof awardXP === 'function') {
      await awardXP(badge.xpReward, `badge_${badgeId}`, badgeId);
    }
  }

  showBadgeUnlockModal(badge) {
    const modal = document.createElement('div');
    modal.className = 'badge-unlock-modal';
    modal.innerHTML = `
      <div class="badge-unlock-content">
        <div class="badge-unlock-animation">
          <div id="badge-unlock-lottie" style="width: 200px; height: 200px; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); pointer-events: none; z-index: 0;"></div>
          <div class="badge-unlock-sparkles">
            <div class="sparkle"></div>
            <div class="sparkle"></div>
            <div class="sparkle"></div>
            <div class="sparkle"></div>
            <div class="sparkle"></div>
            <div class="sparkle"></div>
            <div class="sparkle"></div>
            <div class="sparkle"></div>
          </div>
          <div class="badge-unlock-icon">${badge.icon}</div>
        </div>
        <h2 class="badge-unlock-title">🎉 ¡LOGRO DESBLOQUEADO!</h2>
        <div class="badge-unlock-name">${badge.name}</div>
        <div class="badge-unlock-description">${badge.description}</div>
        <div class="badge-unlock-xp">+${badge.xpReward} XP</div>
        <button class="badge-unlock-btn" onclick="this.closest('.badge-unlock-modal').remove()">
          ¡Genial!
        </button>
      </div>
    `;

    document.body.appendChild(modal);

    requestAnimationFrame(() => {
      modal.classList.add('show');
    });

    // Add Lottie animation if available
    if (typeof lottie !== 'undefined') {
      try {
        lottie.loadAnimation({
          container: document.getElementById('badge-unlock-lottie'),
          renderer: 'svg',
          loop: true,
          autoplay: true,
          path: 'https://assets9.lottiefiles.com/packages/lf20_s2lryxtd.json' // Trophy/star animation
        });
      } catch (e) {
        console.log('Lottie animation not loaded:', e);
      }
    }

    // Confetti
    if (typeof gamification !== 'undefined' && gamification.triggerConfetti) {
      gamification.triggerConfetti();
    }

    // Auto close after 5 seconds
    setTimeout(() => {
      modal.classList.remove('show');
      setTimeout(() => modal.remove(), 400);
    }, 5000);
  }

  async checkAllBadges() {
    for (const badgeId of Object.keys(BADGES)) {
      await this.checkBadge(badgeId);
    }
  }

  getBadgesByCategory() {
    const categories = {
      inicio: [],
      monitoreo: [],
      analisis: [],
      objetivos: [],
      respiracion: [],
      pensamiento: [],
      exposicion: [],
      especial: [],
      fases: []
    };

    Object.entries(BADGES).forEach(([id, badge]) => {
      const isUnlocked = this.hasBadge(id);
      categories[badge.category].push({
        ...badge,
        id,
        unlocked: isUnlocked
      });
    });

    return categories;
  }

  getUnlockedCount() {
    return this.unlockedBadges.length;
  }

  getTotalCount() {
    return Object.keys(BADGES).length;
  }

  getProgress() {
    return {
      unlocked: this.getUnlockedCount(),
      total: this.getTotalCount(),
      percent: Math.round((this.getUnlockedCount() / this.getTotalCount()) * 100)
    };
  }
}

// Global instance
let badgeSystem = null;

function initializeBadgeSystem() {
  if (!badgeSystem && currentUser && supabase) {
    badgeSystem = new BadgeSystem();
    badgeSystem.initialize(supabase, currentUser);
    console.log('Badge system initialized');
  }
  return badgeSystem;
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { BadgeSystem, BADGES };
}
