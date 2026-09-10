/**
 * GAME CONFIGURATION
 * Central configuration file for game mechanics, sizing, visuals, physics, and gameplay tuning.
 */

export const GAME_CONFIG = {
  // ==========================================
  // 0. DATA SOURCE
  // ==========================================
  // Path to the active questions JSON file in the public folder.
  // Examples: 'data/questions.json', 'data/questions_math.json', 'data/questions_english.json'
  dataFile: 'data/questions_math.json',

  // ==========================================
  // 1. BALL DIMENSIONS & VISUAL SIZING
  // ==========================================
  balls: {
    // Dynamic CSS clamp for ball width & height
    sizeClamp: 'clamp(118px, 14.5vw, 168px)',

    // Vertical position (% from top of arena)
    verticalPercentY: 38,

    // Safe side margins for horizontal distribution (%)
    horizontalMarginLeft: 16,
    horizontalMarginRight: 84,

    // Border thickness (px)
    borderWidthNormal: 6,
    borderWidthTargeted: 7,

    // Hitbox collision radius (px)
    hitRadius: 105,

    // Generous aim tolerance for selecting/highlighting a target ball (px)
    targetToleranceDistance: 95,

    // Dynamic typography scaling based on text character length (calibrated for single-line display)
    fontSizes: {
      singleDigit: 'clamp(2.8rem, 5.0vw, 4.2rem)',
      shortWord: 'clamp(2.1rem, 3.8vw, 3.2rem)',       // <= 3 chars (e.g. 100, Cat, Old)
      mediumWord: 'clamp(1.6rem, 2.9vw, 2.4rem)',      // <= 5 chars (e.g. Brave, Plant, 144)
      longWord: 'clamp(1.3rem, 2.3vw, 1.95rem)',       // <= 7 chars (e.g. Modern, Castle, Receive)
      extraLongWord: 'clamp(1.05rem, 1.8vw, 1.55rem)'  // > 7 chars (e.g. Sparkling, Fearless, Children)
    }
  },

  // ==========================================
  // 2. CANNON & PHYSICS MECHANICS
  // ==========================================
  cannon: {
    // Speed of the cannonball projectile (pixels per frame)
    bulletSpeed: 24,

    // Projectile visual size (px)
    bulletSize: 48,

    // Max aiming angle in degrees (+/- from straight up)
    maxAimAngleDegrees: 78,

    // Drag power multiplier and sensitivity
    powerRatioMin: 0.35,
    powerRatioMax: 1.45,
    defaultPower: 0.9,

    // Distance offset from cannon pivot to muzzle tip (px)
    muzzleOffset: 85,

    // Recoil animation duration (ms)
    recoilDurationMs: 400,

    // Muzzle flash duration (ms)
    muzzleFlashDurationMs: 450
  },

  // ==========================================
  // 3. GAMEPLAY & PROGRESSION
  // ==========================================
  gameplay: {
    // Score gained per correct shot
    scorePerCorrect: 10,

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
  }
};

export type GameConfig = typeof GAME_CONFIG;
