// ========================================
// CONSTANTS: Phase Definitions & Mappings
// ========================================

// Phase definitions with requirements and completion criteria
const PHASES = {
  0: {
    id: 0,
    name: 'Inicio',
    title: '📊 Panel de Control',
    description: 'Dashboard general',
    exercises: [0],
    required: false,
    duration: 'Siempre disponible',
    prerequisite: null,
    completionCriteria: null
  },

  1: {
    id: 1,
    name: 'Monitoreo',
    title: '📝 Fase 1: Monitoreo Baseline',
    description: 'Establecer línea base de tus síntomas',
    exercises: [1, 2, 3],
    required: true,
    duration: '1-2 semanas',
    minDays: 7,
    prerequisite: null,
    completionCriteria: {
      daily_moods: 7,  // Al menos 7 días de registro
      panic_attacks: 1  // Al menos 1 pánico registrado
    }
  },

  2: {
    id: 2,
    name: 'Entender',
    title: '🔍 Fase 2: Entender el Ciclo',
    description: 'Analizar tus patrones de pánico y ansiedad',
    exercises: [4, 5, 6],
    required: true,
    duration: '1 semana',
    prerequisite: 1,
    completionCriteria: {
      parts_of_panic: 1,
      parts_of_anxiety: 1,
      step_by_step_analysis: 1
    }
  },

  3: {
    id: 3,
    name: 'Identificar',
    title: '🎯 Fase 3: Identificar Objetivos',
    description: 'Crear tu jerarquía de exposición',
    exercises: [7, 8, 9, 10],
    required: true,
    duration: '1 semana',
    prerequisite: 2,
    completionCriteria: {
      agoraphobia_situations: 1,
      agoraphobia_hierarchy: 3,  // Al menos 3 items
      superstitious_objects: 1,
      safety_behaviors: 1
    }
  },

  4: {
    id: 4,
    name: 'Respiración',
    title: '🫁 Fase 4: Habilidad - Respiración',
    description: 'Dominar la respiración diafragmática',
    exercises: [11],
    required: true,
    duration: '1-2 semanas',
    minDays: 7,
    prerequisite: 3,
    completionCriteria: {
      breathing_records: 14,  // 14 días de práctica (2 veces al día)
      breathing_avg_rating: 7  // Promedio >= 7/10
    }
  },

  5: {
    id: 5,
    name: 'Pensamiento',
    title: '🧠 Fase 5: Habilidad - Reestructuración',
    description: 'Cambiar pensamientos catastróficos',
    exercises: [12, 13, 14],
    required: true,
    duration: '1-2 semanas',
    prerequisite: 4,
    completionCriteria: {
      negative_thoughts: 5,
      changing_odds: 5,
      changing_perspective: 5
    }
  },

  6: {
    id: 6,
    name: 'Síntomas',
    title: '⚡ Fase 6: Exposición a Síntomas',
    description: 'Enfrentar sensaciones físicas',
    exercises: [17, 18, 19, 20],
    required: true,
    duration: '3-4 semanas',
    prerequisite: 5,
    completionCriteria: {
      symptom_assessment: 1,
      facing_symptoms: 10,
      activities_hierarchy: 1,
      facing_activities: 5
    }
  },

  7: {
    id: 7,
    name: 'Situaciones',
    title: '🦁 Fase 7: Exposición a Situaciones',
    description: 'Enfrentar lugares que evitas',
    exercises: [15],
    required: true,
    duration: '3-4 semanas',
    prerequisite: 6,
    completionCriteria: {
      facing_agoraphobia: 10,
      hierarchy_items_mastered: 5  // Special check needed
    }
  },

  8: {
    id: 8,
    name: 'Combinado',
    title: '🔥 Fase 8: Exposición Combinada',
    description: 'Síntomas + Situaciones juntos',
    exercises: [16],
    required: true,
    duration: '2 semanas',
    prerequisite: 7,
    completionCriteria: {
      facing_combined: 5
    }
  },

  9: {
    id: 9,
    name: 'Mantenimiento',
    title: '🎓 Fase 9: Mantener Progreso',
    description: 'Plan a largo plazo',
    exercises: [21, 22],
    required: true,
    duration: 'Ongoing',
    prerequisite: 8,
    completionCriteria: {
      practice_plan: 1,
      long_term_goals: 1
    }
  }
};

// Mapping: Tab Number → Phase
const TAB_TO_PHASE = {
  0: 0,   // Dashboard
  1: 1,   // Panic Attack Record
  2: 1,   // Daily Mood
  3: 1,   // Progress Record
  4: 2,   // Parts of Panic
  5: 2,   // Parts of Anxiety
  6: 2,   // Step-by-Step Analysis
  7: 3,   // Agoraphobia Situations
  8: 3,   // Agoraphobia Hierarchy
  9: 3,   // Superstitious Objects
  10: 3,  // Safety Behaviors
  11: 4,  // Breathing Skills
  12: 5,  // Negative Thoughts
  13: 5,  // Changing Odds
  14: 5,  // Changing Perspective
  15: 7,  // Facing Agoraphobia
  16: 8,  // Facing Combined
  17: 6,  // Symptom Assessment
  18: 6,  // Facing Symptoms
  19: 6,  // Activities Hierarchy
  20: 6,  // Facing Activities
  21: 9,  // Practice Plan
  22: 9   // Long-Term Goals
};

// Tab names for display
const TAB_NAMES = {
  0: 'Dashboard',
  1: 'Registro de Pánico',
  2: 'Estado de Ánimo',
  3: 'Registro de Progreso',
  4: 'Partes del Pánico',
  5: 'Partes de la Ansiedad',
  6: 'Análisis Paso a Paso',
  7: 'Situaciones de Agorafobia',
  8: 'Jerarquía de Agorafobia',
  9: 'Objetos Supersticiosos',
  10: 'Comportamientos de Seguridad',
  11: 'Práctica de Respiración',
  12: 'Pensamientos Negativos',
  13: 'Cambiar Probabilidades',
  14: 'Cambiar Perspectiva',
  15: 'Enfrentar Agorafobia',
  16: 'Exposición Combinada',
  17: 'Evaluación de Síntomas',
  18: 'Enfrentar Síntomas',
  19: 'Jerarquía de Actividades',
  20: 'Enfrentar Actividades',
  21: 'Plan de Práctica',
  22: 'Metas a Largo Plazo'
};

// Export for use in other modules (if using modules)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PHASES, TAB_TO_PHASE, TAB_NAMES };
}
