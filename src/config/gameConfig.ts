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
  dataFile: "data/Grade5-English-questions-ENG5-only.json",
  // ==========================================
  // 1. BALL DIMENSIONS & VISUAL SIZING
  // ==========================================
  balls: {
    // Answer balls enlarged by 20% with responsive stage-relative sizing.
    sizeClamp: "clamp(155.81px, 21.31cqw, 246.91px)",

    // Effective rendered ball diameter on the fixed 1920x1080 stage (px).
    // Used to auto-fit the answer text to the largest size that still fits.
    sizePx: 246.91,

    // TOP HALF-CIRCLE FORMATION (% from top of arena):
    // the centre ball sits at arcTopPercentY, and every ball drops parabolically
    // by up to arcDropPercent toward the outer edges — middle highest, the pair
    // beside it a little lower, the outermost pair lower still.
    arcTopPercentY: 28,
    arcDropPercent: 13,

    // Centered horizontal margins for a tighter, evenly spaced group.
    horizontalMarginLeft: 14,
    horizontalMarginRight: 86,

    // Border thickness (px)
    borderWidthNormal: 3.5,
    borderWidthTargeted: 4.5,

    // A ball counts as hit / targeted when the aim line (or projectile path)
    // comes within (visible ball radius + hitGrace) of the ball centre — i.e.
    // touching ANY part of the ball, plus a few px of kid-friendly forgiveness.
    // Targeting and collision use the exact same radius, so the highlighted
    // ball is always the one the shot connects with.
    hitGrace: 12,

    // Answer text is auto-fitted per ball (see getBallTextFit in EquationShooter):
    // a single word takes the largest size that stays on one line; a two-word
    // value is allowed to wrap onto two lines, sized to the longer word.
    textFit: {
      // fraction of the ball diameter usable for text width / height
      widthRatio: 0.82,
      // conservative bold-glyph advance estimate, including wide letters like W
      glyphRatio: 0.7,
      // hard caps as a fraction of the ball diameter
      singleLineMaxRatio: 0.6,
      twoLineMaxRatio: 0.34,
      minPx: 12,
    },
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

    // ------------------------------------------------------------------
    // CANNON GEOMETRY — fixed 1920x1080 stage space, matches the rendered
    // barrel. Shots, the trajectory preview and the muzzle flash all
    // originate from the muzzle tip = pivot + muzzleLength along the aim.
    // ------------------------------------------------------------------
    pivotX: 960, // barrel pivot X (horizontal centre of the arena)
    pivotY: 1032, // barrel pivot Y (bottom-centre of the rotating barrel)
    muzzleLength: 82, // pivot -> muzzle tip

    // Projectile reach, mapped from how far back the player drags (px).
    reachMin: 400,
    reachMax: 1260,
    reachPerDragPx: 3.6,

    // Spacing between aiming-trajectory dots (px).
    trajectoryDotSpacing: 34,

    // Recoil animation duration (ms)
    recoilDurationMs: 400,

    // Muzzle flash duration (ms)
    muzzleFlashDurationMs: 450,
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
      maxSpacing: 26,
    },
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
    maxLevel: 10,
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
    categoryStruggleThreshold: 2,
  },
};

export type GameConfig = typeof GAME_CONFIG;
