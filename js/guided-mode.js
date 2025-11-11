// ========================================
// GUIDED MODE CONTROLLER
// Manages phase progression, locks, and prerequisites
// ========================================

class GuidedModeController {
  constructor() {
    this.isGuidedMode = true;
    this.userProgress = null;
    this.supabase = null;  // Will be set from main app
    this.currentUser = null;  // Will be set from main app
  }

  // Initialize the controller
  async initialize(supabase, currentUser) {
    this.supabase = supabase;
    this.currentUser = currentUser;

    if (!currentUser) {
      console.warn('GuidedMode: No user logged in');
      return;
    }

    // Load user progress from database
    const { data, error } = await this.supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', currentUser.id)
      .single();

    if (error && error.code !== 'PGRST116') {  // PGRST116 = no rows
      console.error('Error loading user progress:', error);
      return;
    }

    if (data) {
      this.userProgress = data;
      this.isGuidedMode = data.guided_mode;
    } else {
      // Create initial progress record
      await this.createInitialProgress();
    }

    // Update UI based on progress
    this.updateUI();

    // Set button states (new button design)
    const guidedBtn = document.getElementById('btn-guided');
    const freeBtn = document.getElementById('btn-free');
    if (guidedBtn && freeBtn) {
      if (this.isGuidedMode) {
        guidedBtn.classList.add('active');
        freeBtn.classList.remove('active');
      } else {
        guidedBtn.classList.remove('active');
        freeBtn.classList.add('active');
      }
    }

    console.log('GuidedMode initialized:', {
      currentPhase: this.userProgress?.current_phase,
      guidedMode: this.isGuidedMode
    });
  }

  // Create initial progress record for new users
  async createInitialProgress() {
    const { data, error } = await this.supabase
      .from('user_progress')
      .insert([{
        user_id: this.currentUser.id,
        current_phase: 1,
        current_exercise: 1,
        guided_mode: true,
        completed_exercises: [],
        phase_completion: {}
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating initial progress:', error);
      return;
    }

    this.userProgress = data;
    console.log('Initial progress created');
  }

  // Toggle between guided and free mode
  async toggleMode(enabled) {
    this.isGuidedMode = enabled;

    if (!this.userProgress) return;

    // Save preference to database
    const { error } = await this.supabase
      .from('user_progress')
      .update({ guided_mode: enabled })
      .eq('user_id', this.currentUser.id);

    if (error) {
      console.error('Error updating guided mode:', error);
      return;
    }

    this.updateUI();

    // Show notification
    this.showNotification(
      enabled ? '🎯 Modo Guiado activado' : '🗺️ Modo Libre activado',
      'success'
    );

    console.log('Mode toggled:', enabled ? 'Guided' : 'Free');
  }

  // Check if user can access a specific tab
  canAccessTab(tabIndex) {
    // Free mode: allow everything
    if (!this.isGuidedMode) return true;

    // No progress loaded: allow only dashboard and phase 1
    if (!this.userProgress) {
      return tabIndex === 0 || TAB_TO_PHASE[tabIndex] === 1;
    }

    const phase = TAB_TO_PHASE[tabIndex];
    const currentPhase = this.userProgress.current_phase;

    // Dashboard always available
    if (tabIndex === 0) return true;

    // Phase 1 (monitoring) always available
    if (phase === 1) return true;

    // Check if phase is unlocked
    const phaseInfo = PHASES[phase];
    if (!phaseInfo) return false;

    // Check prerequisite
    if (phaseInfo.prerequisite && currentPhase < phaseInfo.prerequisite) {
      return false;
    }

    // If current phase or earlier, allow access
    return phase <= currentPhase;
  }

  // Check if a phase is completed
  async checkPhaseCompletion(phase) {
    const phaseInfo = PHASES[phase];
    if (!phaseInfo || !phaseInfo.completionCriteria) {
      return true;  // No criteria = automatically complete
    }

    const criteria = phaseInfo.completionCriteria;

    // Check each criterion
    for (const [table, minCount] of Object.entries(criteria)) {
      // Special checks
      if (table === 'breathing_avg_rating') {
        const avgRating = await this.getBreathingAvgRating();
        if (avgRating < minCount) return false;
        continue;
      }

      if (table === 'hierarchy_items_mastered') {
        const mastered = await this.getHierarchyItemsMastered();
        if (mastered < minCount) return false;
        continue;
      }

      // Standard table count check
      const { count, error } = await this.supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
        .eq('user_id', this.currentUser.id);

      if (error) {
        console.error(`Error checking ${table}:`, error);
        return false;
      }

      if (count < minCount) {
        console.log(`Phase ${phase}: ${table} count ${count} < ${minCount}`);
        return false;
      }
    }

    // Phase-specific checks
    if (phase === 1) {
      // Check consecutive days of monitoring
      const days = await this.countMonitoringDays();
      if (days < (phaseInfo.minDays || 0)) {
        console.log(`Phase 1: only ${days} days monitored`);
        return false;
      }
    }

    if (phase === 4) {
      // Check breathing practice days
      const days = await this.countBreathingDays();
      if (days < (phaseInfo.minDays || 0)) {
        console.log(`Phase 4: only ${days} days breathing practice`);
        return false;
      }
    }

    return true;
  }

  // Advance to next phase
  async advancePhase() {
    if (!this.userProgress) return false;

    const currentPhase = this.userProgress.current_phase;
    const completed = await this.checkPhaseCompletion(currentPhase);

    if (!completed) {
      this.showNotification(
        `⚠️ Completa los requisitos de la Fase ${currentPhase}`,
        'warning',
        5000
      );
      return false;
    }

    // Advance to next phase
    const nextPhase = currentPhase + 1;

    if (nextPhase > 9) {
      // Program complete!
      this.showNotification('🎉 ¡Programa Completo!', 'success', 5000);
      return true;
    }

    const { error } = await this.supabase
      .from('user_progress')
      .update({
        current_phase: nextPhase,
        phase_completion: {
          ...this.userProgress.phase_completion,
          [currentPhase]: 100
        }
      })
      .eq('user_id', this.currentUser.id);

    if (error) {
      console.error('Error advancing phase:', error);
      return false;
    }

    this.userProgress.current_phase = nextPhase;

    // Celebrate!
    this.celebratePhaseCompletion(currentPhase, nextPhase);

    this.updateUI();
    return true;
  }

  // Celebrate phase completion
  celebratePhaseCompletion(completedPhase, nextPhase) {
    const phaseInfo = PHASES[completedPhase];
    const nextPhaseInfo = PHASES[nextPhase];

    // Show celebration message
    this.showNotification(
      `🎉 ¡Fase ${completedPhase} Completada! Ahora: ${nextPhaseInfo.title}`,
      'success',
      7000
    );

    // TODO: Award XP bonus (will be implemented in Week 2)
    // TODO: Show celebration modal with Lottie animation (Week 4)
    // TODO: Check and award phase completion badge (Week 3)

    console.log(`Phase ${completedPhase} completed! Advanced to phase ${nextPhase}`);
  }

  // Update UI based on current mode and progress
  updateUI() {
    const menuSections = document.querySelectorAll('.menu-section');

    menuSections.forEach(section => {
      const phase = parseInt(section.getAttribute('data-phase'));
      if (isNaN(phase)) return;  // Skip non-phase sections (like quick-access)

      const phaseStatus = document.getElementById(`phase${phase}-status`);
      const phaseHint = document.getElementById(`phase${phase}-hint`);

      if (this.isGuidedMode && this.userProgress) {
        const currentPhase = this.userProgress.current_phase;
        const isUnlocked = phase <= currentPhase || phase === 0 || phase === 1;
        const isCurrent = phase === currentPhase;

        // Update locked/unlocked state
        section.classList.toggle('locked', !isUnlocked && phase !== 0);
        section.classList.toggle('current-phase', isCurrent);

        // Update status text
        if (phaseStatus) {
          if (phase === 0 || phase === 1) {
            phaseStatus.textContent = '✓ Disponible';
            phaseStatus.style.color = 'var(--success)';
          } else if (isCurrent) {
            phaseStatus.textContent = '⏳ En progreso';
            phaseStatus.style.color = 'var(--primary)';
          } else if (phase < currentPhase) {
            phaseStatus.textContent = '✅ Completada';
            phaseStatus.style.color = 'var(--success)';
          } else {
            phaseStatus.textContent = '🔒 Bloqueada';
            phaseStatus.style.color = 'var(--text-secondary)';
          }
        }

        // Show/hide hint
        if (phaseHint) {
          phaseHint.style.display = !isUnlocked && phase !== 0 ? 'block' : 'none';
        }

        // Update menu items
        const menuItems = section.querySelectorAll('.menu-item');
        menuItems.forEach(item => {
          const tabIndex = parseInt(item.getAttribute('data-tab'));
          const itemCanAccess = this.canAccessTab(tabIndex);

          item.classList.toggle('disabled', !itemCanAccess);

          if (!itemCanAccess) {
            // Store original onclick
            const originalOnclick = item.getAttribute('onclick');
            if (originalOnclick && !item.getAttribute('data-original-onclick')) {
              item.setAttribute('data-original-onclick', originalOnclick);
              item.setAttribute('onclick', 'showLockedMessage()');
            }
          } else {
            // Restore original onclick
            const originalOnclick = item.getAttribute('data-original-onclick');
            if (originalOnclick) {
              item.setAttribute('onclick', originalOnclick);
              item.removeAttribute('data-original-onclick');
            }
          }
        });
      } else {
        // Free mode: unlock everything
        section.classList.remove('locked', 'current-phase');

        if (phaseStatus) {
          phaseStatus.textContent = '✓ Disponible';
          phaseStatus.style.color = 'var(--success)';
        }

        if (phaseHint) {
          phaseHint.style.display = 'none';
        }

        // Restore all menu items
        const menuItems = section.querySelectorAll('.menu-item');
        menuItems.forEach(item => {
          item.classList.remove('disabled');
          const originalOnclick = item.getAttribute('data-original-onclick');
          if (originalOnclick) {
            item.setAttribute('onclick', originalOnclick);
            item.removeAttribute('data-original-onclick');
          }
        });
      }
    });

    // Scroll to current phase if in guided mode
    if (this.isGuidedMode && this.userProgress) {
      this.highlightCurrentPhase();
    }
  }

  // Highlight and scroll to current phase
  highlightCurrentPhase() {
    const currentPhase = this.userProgress.current_phase;
    const phaseSection = document.querySelector(`.menu-section[data-phase="${currentPhase}"]`);

    if (phaseSection) {
      // Scroll into view (only if sidebar is open)
      const sidebar = document.querySelector('.sidebar');
      if (sidebar && sidebar.classList.contains('active')) {
        setTimeout(() => {
          phaseSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
      }
    }
  }

  // Helper: Count consecutive monitoring days
  async countMonitoringDays() {
    const { data, error } = await this.supabase
      .from('user_streaks')
      .select('monitoring_streak')
      .eq('user_id', this.currentUser.id)
      .single();

    if (error || !data) return 0;
    return data.monitoring_streak || 0;
  }

  // Helper: Count breathing practice days
  async countBreathingDays() {
    const { count, error } = await this.supabase
      .from('breathing_records')
      .select('date', { count: 'exact', head: false })
      .eq('user_id', this.currentUser.id);

    if (error) return 0;

    // Count unique dates
    if (count) return count;
    return 0;
  }

  // Helper: Get average breathing rating
  async getBreathingAvgRating() {
    const { data, error } = await this.supabase
      .from('breathing_records')
      .select('success_rating')
      .eq('user_id', this.currentUser.id)
      .not('success_rating', 'is', null);

    if (error || !data || data.length === 0) return 0;

    const sum = data.reduce((acc, rec) => acc + rec.success_rating, 0);
    return sum / data.length;
  }

  // Helper: Get mastered hierarchy items count
  async getHierarchyItemsMastered() {
    // Items with max_anxiety <= 3 are considered mastered
    const { count, error } = await this.supabase
      .from('facing_agoraphobia')
      .select('situation', { count: 'exact' })
      .eq('user_id', this.currentUser.id)
      .lte('max_anxiety', 3);

    if (error) return 0;
    return count || 0;
  }

  // Show notification
  showNotification(message, type = 'info', duration = 3000) {
    // Check if notification system exists
    if (typeof showNotification === 'function') {
      showNotification(message, type, duration);
      return;
    }

    // Fallback: create simple toast
    const toast = document.createElement('div');
    toast.className = `notification-toast ${type}`;
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      padding: 16px 24px;
      background: ${type === 'success' ? 'var(--success)' : type === 'warning' ? 'var(--warning)' : 'var(--primary)'};
      color: white;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      z-index: 10000;
      animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }
}

// Global instance
let guidedMode = null;

// Initialize when DOM is ready
function initializeGuidedMode() {
  if (!guidedMode) {
    guidedMode = new GuidedModeController();
  }
  return guidedMode;
}

// Toggle guided mode (called from toggle switch)
function toggleGuidedMode(checked) {
  if (guidedMode) {
    guidedMode.toggleMode(checked);
  }
}

// Show locked message (called when clicking locked tabs)
function showLockedMessage() {
  if (!guidedMode || !guidedMode.userProgress) {
    alert('🔒 Esta fase está bloqueada. Activa el Modo Libre para acceder.');
    return;
  }

  const currentPhase = guidedMode.userProgress.current_phase;
  const phaseInfo = PHASES[currentPhase];

  if (guidedMode.showNotification) {
    guidedMode.showNotification(
      `🔒 Completa la Fase ${currentPhase} (${phaseInfo.title}) para desbloquear`,
      'info',
      5000
    );
  } else {
    alert(`🔒 Completa la Fase ${currentPhase} (${phaseInfo.title}) para desbloquear esta sección.`);
  }
}

// Quick access functions
function quickBreathing() {
  // Check if allowed in guided mode
  if (guidedMode && guidedMode.isGuidedMode && !guidedMode.canAccessTab(11)) {
    showLockedMessage();
    return;
  }

  // Navigate to breathing tab
  if (typeof showTab === 'function') {
    showTab(11);
  }
}

function quickPanicRecord() {
  // Always allowed (phase 1)
  if (typeof showTab === 'function') {
    showTab(1);
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { GuidedModeController, initializeGuidedMode, toggleGuidedMode };
}
