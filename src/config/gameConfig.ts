/**
 * GAME CONFIGURATION
 * Central configuration file for game mechanics, sizing, visuals, physics, and gameplay tuning.
 */

export const GAME_CONFIG = {
  // ==========================================
  // 0. DATA SOURCE
  // ==========================================
  // Path to the assigned questions JSON file for the current game in the public folder.
  // Each game uses ONLY its assigned JSON file as its independent question pool.
  // DO NOT combine, merge, or cross-reference other question files.
  dataFile: 'data/Grade5-English-questions-ENG5-only.json',
  // ==========================================
  // 1. BALL DIMENSIONS & VISUAL SIZING
  // ==========================================
  balls: {
    // Answer balls scaled up 1% more (clamp(72.37px, 9.9vw, 114.69px))
    sizeClamp: 'clamp(72.37px, 9.9vw, 114.69px)',

    // Vertical position in the arena (% from top of arena)
    verticalPercentY: 29,

    // Centered horizontal margins for group formation (% of arena width)
    // Left: 5%, Right: 85% (Center of group is at 45%, perfectly uniform 20% step)
    // Keeps the group shifted slightly left with generous, even gaps and zero edge overflow.
    horizontalMarginLeft: 5,
    horizontalMarginRight: 85,

    // Border thickness (px)
    borderWidthNormal: 3.5,
    borderWidthTargeted: 4.5,

    // Invisible Hitbox collision radius (px) - Generous for mobile but strictly separated so neighboring hitboxes never overlap
    hitRadius: 62,

    // Aim tolerance for selecting/highlighting a target ball (px)
    targetToleranceDistance: 62,

    // Large, bold, highly readable typography scaling optimized for balls (ensures zero horizontal clipping)
    fontSizes: {
      singleDigit: 'clamp(1.75rem, 3.0vw, 2.45rem)',      // Single digit (e.g. 6, 7)
      twoDigits: 'clamp(1.48rem, 2.5vw, 2.05rem)',        // 2 digits (e.g. 22, 24, 63, 56)
      shortWord: 'clamp(1.22rem, 2.0vw, 1.72rem)',       // 3 chars (e.g. 100, 144, 200, Cat)
      mediumWord: 'clamp(1.05rem, 1.65vw, 1.42rem)',     // 4-5 chars (e.g. Brave, Plant, Flew)
      longWord: 'clamp(0.88rem, 1.35vw, 1.20rem)',       // 6-7 chars (e.g. Modern, Castle, Shrink)
      extraLongWord: 'clamp(0.74rem, 1.1vw, 1.02rem)'    // > 7 chars (e.g. Sparkling, Fearless, Children)
    }
  },

  // ==========================================
  // 2. CANNON & PHYSICS MECHANICS
  // ==========================================
  cannon: {
    // Speed of the cannonball projectile (pixels per frame)
    bulletSpeed: 24,

    // Projectile visual size (px)
    bulletSize: 40,

    // Max aiming angle in degrees (+/- from straight up)
    maxAimAngleDegrees: 78,

    // Drag power multiplier and sensitivity
    powerRatioMin: 0.35,
    powerRatioMax: 1.45,
    defaultPower: 0.9,

    // Distance offset from cannon pivot to muzzle tip (px)
    muzzleOffset: 68,

    // Recoil animation duration (ms)
    recoilDurationMs: 400,

    // Muzzle flash duration (ms)
    muzzleFlashDurationMs: 450
  },

  // ==========================================
  // 3. GAMEPLAY, EXP & ADAPTIVE PROGRESSION
  // ==========================================
  gameplay: {
    // Delay before advancing to next question on success (ms)
    nextQuestionDelayMs: 1000,

    // Wrong hit shake duration before resetting ball (ms)
    wrongBallResetDelayMs: 900,

    // Trajectory dots settings
    trajectory: {
      dotCount: 28,
      dotSize: 10,
      minSpacing: 18,
      maxSpacing: 26
    }
  },

  // ==========================================
  // 4. EXP LEVEL SYSTEM CONFIGURATION
  // ==========================================
  expSystem: {
    // Base EXP awarded for each correct answer (+20 EXP as specified)
    baseExpPerCorrect: 20,

    // Bonus EXP per correct streak count
    streakBonusExp: 5,

    // Base EXP required for Level 1 (e.g. 100 EXP)
    baseExpRequired: 100,

    // Additional EXP required per level step (e.g. Level 1: 100, Level 2: 150, Level 3: 200, Level 4: 250, Level 5: 300)
    expIncrementPerLevel: 50,

    // Helper formula to compute required EXP for any level
    getExpRequired: (lvl: number) => 100 + (Math.max(1, lvl) - 1) * 50,

    // Maximum display level before endless mastery
    maxLevel: 10
  },

  // ==========================================
  // 5. ADAPTIVE LEARNING ENGINE CONFIGURATION
  // ==========================================
  adaptive: {
    // Size of recent answers sliding window
    historyWindowSize: 6,

    // Accuracy threshold to increase difficulty (>= 80%)
    promotionAccuracy: 0.8,

    // Accuracy threshold to decrease difficulty (<= 40%)
    demotionAccuracy: 0.4,

    // Consecutive incorrect answers on a specific category before triggering practice mode
    categoryStruggleThreshold: 2
  }
};

export type GameConfig = typeof GAME_CONFIG;

