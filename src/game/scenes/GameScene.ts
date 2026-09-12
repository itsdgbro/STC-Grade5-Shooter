import * as Phaser from "phaser";
import confetti from "canvas-confetti";
import { GAME_CONFIG } from "../../config/gameConfig";
import {
  adaptiveEngine,
  isAnswerCorrect,
  shuffleArray,
  type QuestionData,
} from "../../utils/adaptiveEngine";
import { sfx } from "../../utils/sounds";

interface BallItem {
  id: number;
  value: string | number;
  container: Phaser.GameObjects.Container;
  ballSprite: Phaser.GameObjects.Sprite;
  targetBadge: Phaser.GameObjects.Container;
  textObj: Phaser.GameObjects.Text;
  themeId: number;
  baseX: number;
  baseY: number;
  isHit: boolean;
}

const PRAISE_MESSAGES = [
  "GREAT! 🌟",
  "CORRECT! 🎉",
  "AWESOME! 🚀",
  "SUPER STAR! ⭐",
  "BRILLIANT! 🏆",
];

const GENTLE_MESSAGES = [
  "Try Again! 😊",
  "Almost! Give it another shot! 💪",
  "Keep Trying! ✨",
];

export class GameScene extends Phaser.Scene {
  // Game State
  private currentQuestion: QuestionData | null = null;
  private balls: BallItem[] = [];
  private currentLevel = 1;
  private isQuestionLoading = false;
  private isPaused = false;

  // Aiming & Cannon
  private isAiming = false;
  private cannonAngle = 0; // degrees (-maxAim to +maxAim)
  private maxDistanceReached = 700;
  private isShooting = false;
  private cooldownRemainingMs = 0;

  // Game Objects
  private cannonCarriage!: Phaser.GameObjects.Image;
  private cannonBarrel!: Phaser.GameObjects.Image;
  private muzzleFlash!: Phaser.GameObjects.Image;
  private trajectoryGraphics!: Phaser.GameObjects.Graphics;
  private clouds: Phaser.GameObjects.Text[] = [];

  private activeBullet: {
    sprite: Phaser.GameObjects.Image;
    vx: number;
    vy: number;
    traveled: number;
    maxDist: number;
    prevX: number;
    prevY: number;
  } | null = null;

  // Question Card (Center of Top Header)
  private questionContainer!: Phaser.GameObjects.Container;
  private questionText!: Phaser.GameObjects.Text;

  // Targeted ball index
  private targetedBallIndex = -1;

  constructor() {
    super({ key: "GameScene" });
  }

  create() {
    this.isPaused = false;
    this.isShooting = false;
    this.activeBullet = null;
    this.balls = [];

    // 1. Exact Game Background (Indigo Mountains, Emerald Hills, Grass with Flora & Trees)
    this.add.image(960, 540, "game_bg");

    // 2. Animated Floating Clouds ☁️
    this.createClouds();

    // 3. Trajectory Graphics Layer
    this.trajectoryGraphics = this.add.graphics().setDepth(15);

    // 4. Primary Header Question Display Banner (at X: 960, Y: 80, height: 140)
    this.createQuestionBanner();

    // 5. Cannon (Exact Barrel + Carriage SVGs at Bottom Center)
    this.createCannon();

    // 6. Input Listeners (Drag to Aim & Keyboard Firing)
    this.setupInputs();

    // 7. Event Listeners from UIScene
    this.setupUIEvents();

    // 8. Load First Question
    this.loadNextQuestion();
  }

  // =========================================================================
  // 1. QUESTION BANNER (EXACT MATCH: X: 960, Y: 80, Width: 1080, Height: 140)
  // =========================================================================
  private createQuestionBanner() {
    this.questionContainer = this.add.container(960, 80);

    const cardW = 920;
    const cardH = 140;
    const cornerRadius = 10;

    const questionGfx = this.add.graphics();

    // Bottom 3D ledge shadow (0 7px 0 #0284c7)
    questionGfx.fillStyle(0x0284c7, 1);
    questionGfx.fillRoundedRect(-cardW / 2, -cardH / 2 + 7, cardW, cardH, cornerRadius);

    // White Card Face (5px solid #38bdf8)
    questionGfx.fillStyle(0xffffff, 1);
    questionGfx.fillRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, cornerRadius);

    // 5px cyan border
    questionGfx.lineStyle(5, 0x38bdf8, 1);
    questionGfx.strokeRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, cornerRadius);

    // Question Prompt Text (bold #0f172a)
    this.questionText = this.add
      .text(0, 0, "Loading Question...", {
        fontFamily: "'Fredoka', 'Mukta', sans-serif",
        fontSize: "54px",
        fontStyle: "900",
        color: "#0f172a",
        align: "center",
        lineSpacing: 2,
        wordWrap: { width: cardW - 80, useAdvancedWrap: true },
      })
      .setOrigin(0.5);

    this.questionContainer.add([questionGfx, this.questionText]);
  }

  private createClouds() {
    const cloudConfigs = [
      { x: 220, y: 130, size: 75, speed: 0.35 },
      { x: 860, y: 80, size: 62, speed: 0.25 },
      { x: 1540, y: 140, size: 84, speed: 0.4 },
    ];

    cloudConfigs.forEach((cfg) => {
      const cloud = this.add
        .text(cfg.x, cfg.y, "☁️", { fontSize: `${cfg.size}px` })
        .setOrigin(0.5)
        .setAlpha(0.8);
      (cloud as any).speed = cfg.speed;
      this.clouds.push(cloud);

      this.tweens.add({
        targets: cloud,
        y: cfg.y + 10,
        duration: 3500 + Math.random() * 1500,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    });
  }

  // =========================================================================
  // 2. CANNON (EXACT BARREL & CARRIAGE SVGS)
  // =========================================================================
  private createCannon() {
    const pivotX = 960;
    const pivotY = 1032;

    // Cannon Barrel (Rotates around its rear bulb base at 0.5, 0.75)
    // Texture width 80, height 130. Bulb center is at (40, 98) -> origin = (0.5, 98/130 = 0.754)
    this.cannonBarrel = this.add
      .image(pivotX, pivotY, "cannon_barrel")
      .setOrigin(0.5, 0.754)
      .setDepth(18);

    // Wooden Carriage Mount (Fixed in front of barrel base)
    this.cannonCarriage = this.add
      .image(pivotX, 1045, "cannon_carriage")
      .setOrigin(0.5, 0.5)
      .setDepth(20);

    // Muzzle Flash
    this.muzzleFlash = this.add
      .image(pivotX, pivotY - GAME_CONFIG.cannon.muzzleLength, "muzzle_flash")
      .setOrigin(0.5, 0.5)
      .setVisible(false)
      .setDepth(25);
  }

  private getCannonMuzzle(angleDeg: number) {
    const { pivotX, pivotY, muzzleLength } = GAME_CONFIG.cannon;
    const rad = Phaser.Math.DegToRad(angleDeg);
    return {
      x: pivotX + Math.sin(rad) * muzzleLength,
      y: pivotY - Math.cos(rad) * muzzleLength,
    };
  }

  // =========================================================================
  // 3. INPUT HANDLING & AIMING DRAG
  // =========================================================================
  private setupInputs() {
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (this.isShooting || this.isPaused) return;
      if (pointer.y < 165 || (pointer.y > 920 && (pointer.x < 320 || pointer.x > 1600))) {
        return;
      }
      this.isAiming = true;
      this.updateAim(pointer);
    });

    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      // Only follow when mouse or touch is actively held down
      if (!this.isAiming || !pointer.isDown) return;
      if (this.isShooting || this.isPaused) return;
      if (pointer.y < 165 || (pointer.y > 920 && (pointer.x < 320 || pointer.x > 1600))) {
        return;
      }
      this.updateAim(pointer);
    });

    this.input.on("pointerup", () => {
      this.isAiming = false;
    });

    this.input.on("gameout", () => {
      this.isAiming = false;
    });

    this.input.keyboard?.on("keydown-SPACE", () => this.fireCannon());
    this.input.keyboard?.on("keydown-ENTER", () => this.fireCannon());
  }

  private updateAim(pointer: Phaser.Input.Pointer) {
    const { pivotX, pivotY, maxAimAngleDegrees, reachMin, reachMax, reachPerDragPx } =
      GAME_CONFIG.cannon;

    let deltaX = pointer.x - pivotX;
    let deltaY = pointer.y - pivotY;

    if (deltaY > 15) {
      deltaX = -deltaX;
      deltaY = -deltaY;
    }

    const angleDeg = Phaser.Math.Clamp(
      (Math.atan2(deltaX, -deltaY) * 180) / Math.PI,
      -maxAimAngleDegrees,
      maxAimAngleDegrees,
    );

    this.cannonAngle = angleDeg;
    this.cannonBarrel.angle = angleDeg;

    const dragDist = Math.hypot(deltaX, deltaY);
    this.maxDistanceReached = Phaser.Math.Clamp(
      dragDist * reachPerDragPx,
      reachMin,
      reachMax,
    );

    this.checkTargetedBall();
  }

  private checkTargetedBall() {
    const muzzle = this.getCannonMuzzle(this.cannonAngle);
    const rad = Phaser.Math.DegToRad(this.cannonAngle);
    const dirX = Math.sin(rad);
    const dirY = -Math.cos(rad);

    let closestIdx = -1;
    let nearestAlong = Infinity;

    const hitRadius = GAME_CONFIG.balls.sizePx * 0.48 + GAME_CONFIG.balls.hitGrace;

    for (let i = 0; i < this.balls.length; i++) {
      const b = this.balls[i];
      if (b.isHit) continue;

      const toBallX = b.container.x - muzzle.x;
      const toBallY = b.container.y - muzzle.y;

      const along = toBallX * dirX + toBallY * dirY;
      if (along < 0 || along > this.maxDistanceReached + hitRadius) continue;

      const perp = Math.abs(toBallX * -dirY + toBallY * dirX);
      if (perp <= hitRadius && along < nearestAlong) {
        nearestAlong = along;
        closestIdx = i;
      }
    }

    if (closestIdx !== this.targetedBallIndex) {
      this.targetedBallIndex = closestIdx;
      this.balls.forEach((b, idx) => {
        const isTargeted = idx === closestIdx;
        b.ballSprite.setTexture(
          isTargeted ? `ball_targeted_${b.themeId}` : `ball_theme_${b.themeId}`,
        );
        b.targetBadge.setVisible(isTargeted);
        b.container.setScale(isTargeted ? 1.08 : 1);
      });
    }
  }

  // Exact trajectory dots matching original SVG preview - kept visible all the time
  private renderTrajectory() {
    this.trajectoryGraphics.clear();

    const muzzle = this.getCannonMuzzle(this.cannonAngle);
    const rad = Phaser.Math.DegToRad(this.cannonAngle);
    const dirX = Math.sin(rad);
    const dirY = -Math.cos(rad);

    const spacing = GAME_CONFIG.cannon.trajectoryDotSpacing;
    const count = Math.max(3, Math.floor(this.maxDistanceReached / spacing));

    for (let i = 1; i <= count; i++) {
      const dist = i * spacing;
      const dotX = muzzle.x + dirX * dist;
      const dotY = muzzle.y + dirY * dist;
      const opacity = Math.max(0.2, 1 - i / (count + 3));

      // Light Yellow fill with Orange outline
      this.trajectoryGraphics.fillStyle(0xfef08a, opacity);
      this.trajectoryGraphics.lineStyle(2.5, 0xea580c, opacity);
      this.trajectoryGraphics.fillCircle(dotX, dotY, i === count ? 8 : 6);
      this.trajectoryGraphics.strokeCircle(dotX, dotY, i === count ? 8 : 6);
    }

    // Targeting Reticle at endpoint
    const endX = muzzle.x + dirX * this.maxDistanceReached;
    const endY = muzzle.y + dirY * this.maxDistanceReached;

    this.trajectoryGraphics.lineStyle(3, 0xfde047, 0.95);
    this.trajectoryGraphics.fillStyle(0xfef08a, 0.25);
    this.trajectoryGraphics.fillCircle(endX, endY, 18);
    this.trajectoryGraphics.strokeCircle(endX, endY, 18);

    this.trajectoryGraphics.fillStyle(0xea580c, 1);
    this.trajectoryGraphics.lineStyle(1.5, 0xffffff, 1);
    this.trajectoryGraphics.fillCircle(endX, endY, 5.5);
    this.trajectoryGraphics.strokeCircle(endX, endY, 5.5);
  }

  // =========================================================================
  // 4. FIRING & PROJECTILE
  // =========================================================================
  public fireCannon() {
    if (
      this.isShooting ||
      this.cooldownRemainingMs > 0 ||
      this.isPaused ||
      this.isQuestionLoading
    ) {
      return;
    }

    this.isShooting = true;
    this.cooldownRemainingMs = GAME_CONFIG.cannon.cooldownMs;

    // Recoil Tween (Pushes barrel back along angle)
    const rad = Phaser.Math.DegToRad(this.cannonAngle);
    const recoilDist = 18;
    const recoilX = GAME_CONFIG.cannon.pivotX - Math.sin(rad) * recoilDist;
    const recoilY = GAME_CONFIG.cannon.pivotY + Math.cos(rad) * recoilDist;

    this.tweens.add({
      targets: this.cannonBarrel,
      x: recoilX,
      y: recoilY,
      duration: 100,
      yoyo: true,
      ease: "Quad.easeOut",
      onComplete: () => {
        this.cannonBarrel.setPosition(
          GAME_CONFIG.cannon.pivotX,
          GAME_CONFIG.cannon.pivotY,
        );
      },
    });

    // Muzzle Flash
    const muzzle = this.getCannonMuzzle(this.cannonAngle);
    this.muzzleFlash.setPosition(muzzle.x, muzzle.y).setVisible(true);
    this.time.delayedCall(GAME_CONFIG.cannon.muzzleFlashDurationMs, () => {
      this.muzzleFlash.setVisible(false);
    });

    sfx.playCannonShoot();

    // Spawn Projectile
    const bulletSpeed = GAME_CONFIG.cannon.bulletSpeed;
    const bulletSprite = this.add
      .image(muzzle.x, muzzle.y, "cannon_bullet")
      .setDisplaySize(GAME_CONFIG.cannon.bulletSize, GAME_CONFIG.cannon.bulletSize)
      .setDepth(22);

    this.activeBullet = {
      sprite: bulletSprite,
      vx: Math.sin(rad) * bulletSpeed,
      vy: -Math.cos(rad) * bulletSpeed,
      traveled: 0,
      maxDist: this.maxDistanceReached,
      prevX: muzzle.x,
      prevY: muzzle.y,
    };
  }

  private updateBullet() {
    if (!this.activeBullet) return;

    const b = this.activeBullet;
    b.prevX = b.sprite.x;
    b.prevY = b.sprite.y;

    b.sprite.x += b.vx;
    b.sprite.y += b.vy;

    const stepDist = Math.hypot(b.vx, b.vy);
    b.traveled += stepDist;

    let hitBallIdx = -1;
    let closestDist = Infinity;
    const hitRadius = GAME_CONFIG.balls.sizePx * 0.48 + GAME_CONFIG.balls.hitGrace;

    for (let i = 0; i < this.balls.length; i++) {
      const ball = this.balls[i];
      if (ball.isHit) continue;

      const dist = this.distToSegment(
        ball.container.x,
        ball.container.y,
        b.prevX,
        b.prevY,
        b.sprite.x,
        b.sprite.y,
      );

      if (dist <= hitRadius && dist < closestDist) {
        closestDist = dist;
        hitBallIdx = i;
      }
    }

    if (hitBallIdx !== -1) {
      this.handleHit(hitBallIdx);
      b.sprite.destroy();
      this.activeBullet = null;
      this.isShooting = false;
      return;
    }

    if (
      b.traveled >= b.maxDist ||
      b.sprite.y < -60 ||
      b.sprite.x < -60 ||
      b.sprite.x > 1920 + 60
    ) {
      b.sprite.destroy();
      this.activeBullet = null;
      this.isShooting = false;
      this.handleMiss();
    }
  }

  private distToSegment(
    px: number,
    py: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
  ): number {
    const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
    if (l2 === 0) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    const projX = x1 + t * (x2 - x1);
    const projY = y1 + t * (y2 - y1);
    return Math.hypot(px - projX, py - projY);
  }

  private handleHit(ballIdx: number) {
    const ball = this.balls[ballIdx];
    if (!ball || !this.currentQuestion) return;

    const isCorrect = isAnswerCorrect(ball.value, this.currentQuestion.answer);

    if (isCorrect) {
      ball.isHit = true;
      sfx.playCorrect();

      try {
        confetti({
          particleCount: 85,
          spread: 70,
          origin: {
            x: ball.container.x / 1920,
            y: ball.container.y / 1080,
          },
        });
      } catch { }

      this.tweens.add({
        targets: ball.container,
        scaleX: 1.35,
        scaleY: 1.35,
        alpha: 0,
        duration: 350,
        ease: "Back.easeIn",
      });

      const praise =
        PRAISE_MESSAGES[Math.floor(Math.random() * PRAISE_MESSAGES.length)];
      this.showFloatingFeedback(ball.container.x, ball.container.y - 40, praise, true);

      adaptiveEngine.recordAttempt(this.currentQuestion, true);
      this.game.events.emit("correctAnswer");

      this.isQuestionLoading = true;
      this.time.delayedCall(GAME_CONFIG.gameplay.nextQuestionDelayMs, () => {
        this.loadNextQuestion();
      });
    } else {
      sfx.playWrong();

      this.tweens.add({
        targets: ball.container,
        x: ball.baseX + 16,
        duration: 60,
        yoyo: true,
        repeat: 4,
        ease: "Sine.easeInOut",
        onComplete: () => {
          ball.container.x = ball.baseX;
        },
      });

      const gentle =
        GENTLE_MESSAGES[Math.floor(Math.random() * GENTLE_MESSAGES.length)];
      this.showFloatingFeedback(ball.container.x, ball.container.y - 40, gentle, false);

      adaptiveEngine.recordAttempt(this.currentQuestion, false);
      this.game.events.emit("wrongAnswer");
    }
  }

  private handleMiss() {
    sfx.playGentleTryAgain();
    const gentle =
      GENTLE_MESSAGES[Math.floor(Math.random() * GENTLE_MESSAGES.length)];
    this.showFloatingFeedback(960, 480, gentle, false);
  }

  private showFloatingFeedback(
    x: number,
    y: number,
    text: string,
    isCorrect: boolean,
  ) {
    const feedback = this.add
      .text(x, y, text, {
        fontFamily: "'Fredoka', 'Mukta', sans-serif",
        fontSize: "44px",
        fontStyle: "900",
        color: isCorrect ? "#4ade80" : "#fbbf24",
        stroke: "#0f172a",
        strokeThickness: 8,
      })
      .setOrigin(0.5)
      .setDepth(40);

    this.tweens.add({
      targets: feedback,
      y: y - 50,
      alpha: 0,
      duration: 1000,
      ease: "Quad.easeOut",
      onComplete: () => feedback.destroy(),
    });
  }

  // =========================================================================
  // 5. ADAPTIVE QUESTION & BALL ARCHITECTURE
  // =========================================================================
  private loadNextQuestion() {
    this.isQuestionLoading = false;

    this.balls.forEach((b) => b.container.destroy());
    this.balls = [];
    this.targetedBallIndex = -1;

    try {
      const q = adaptiveEngine.selectNextQuestion(
        this.currentLevel,
        this.currentQuestion?.id,
      );
      this.currentQuestion = q;

      // Update question text in banner with dynamic sizing
      this.questionText.setText(q.question);
      const len = q.question.length;

      let fontSize = 54;
      if (len <= 20) {
        fontSize = 62;
      } else if (len <= 32) {
        fontSize = 54;
      } else if (len <= 48) {
        fontSize = 48;
      } else if (len <= 65) {
        fontSize = 42;
      } else if (len <= 85) {
        fontSize = 36;
      } else {
        fontSize = 30;
      }

      this.questionText.setFontSize(fontSize);

      // Auto-fit check: ensure text fits within the card height with comfortable margins
      const maxTextHeight = 114;
      while (this.questionText.height > maxTextHeight && fontSize > 22) {
        fontSize -= 2;
        this.questionText.setFontSize(fontSize);
      }

      // Pass hint to UIScene
      this.game.events.emit("setHintText", q.hint);

      // Shuffle options & arrange on parabolic arc
      const options = shuffleArray([...q.options]);
      const count = options.length;

      const xPositions = this.getDynamicXPositions(count);
      const yPositions = this.getArcYPositions(count);

      options.forEach((val, idx) => {
        const x = xPositions[idx];
        const y = yPositions[idx];
        const themeId = idx % 5;

        const container = this.add.container(x, y).setDepth(16);

        // Radial gradient ball orb
        const ballSprite = this.add.sprite(0, 0, `ball_theme_${themeId}`);
        ballSprite.setDisplaySize(
          GAME_CONFIG.balls.sizePx,
          GAME_CONFIG.balls.sizePx,
        );

        // Value text
        const strVal = String(val);
        const fontSize = strVal.length > 8 ? 32 : strVal.length > 4 ? 40 : 50;

        const textObj = this.add
          .text(0, 0, strVal, {
            fontFamily: "'Fredoka', 'Mukta', sans-serif",
            fontSize: `${fontSize}px`,
            fontStyle: "900",
            color: "#ffffff",
            stroke: "#0f172a",
            strokeThickness: 6,
          })
          .setOrigin(0.5);

        // "TARGET" pill badge at bottom
        const targetBadge = this.add.container(0, 118);
        const badgeBg = this.add
          .rectangle(0, 0, 120, 36, 0xfef08a)
          .setStrokeStyle(2, 0xca8a04);
        const badgeTxt = this.add
          .text(0, 0, "TARGET", {
            fontFamily: "'Fredoka', sans-serif",
            fontSize: "20px",
            fontStyle: "900",
            color: "#854d0e",
          })
          .setOrigin(0.5);
        targetBadge.add([badgeBg, badgeTxt]);
        targetBadge.setVisible(false);

        container.add([ballSprite, textObj, targetBadge]);

        // Idle Bobbing Animation
        this.tweens.add({
          targets: container,
          y: y + (idx % 2 === 0 ? 8 : -8),
          duration: 1800 + idx * 120,
          yoyo: true,
          repeat: -1,
          ease: "Sine.easeInOut",
        });

        this.balls.push({
          id: idx,
          value: val,
          container,
          ballSprite,
          targetBadge,
          textObj,
          themeId,
          baseX: x,
          baseY: y,
          isHit: false,
        });
      });
      this.checkTargetedBall();
    } catch { }
  }

  private getDynamicXPositions(count: number): number[] {
    if (count <= 1) return [960];
    const leftPx = (GAME_CONFIG.balls.horizontalMarginLeft / 100) * 1920;
    const rightPx = (GAME_CONFIG.balls.horizontalMarginRight / 100) * 1920;
    const available = rightPx - leftPx;
    const step = available / (count - 1);
    return Array.from({ length: count }, (_, i) => leftPx + i * step);
  }

  private getArcYPositions(count: number): number[] {
    const topY =
      (GAME_CONFIG.balls.arcTopPercentY / 100) * 1080 +
      GAME_CONFIG.balls.verticalOffsetPx;
    const drop = (GAME_CONFIG.balls.arcDropPercent / 100) * 1080;
    if (count <= 1) return [topY];
    const center = (count - 1) / 2;
    return Array.from({ length: count }, (_, i) => {
      const t = (i - center) / center;
      return topY + drop * t * t;
    });
  }

  private setupUIEvents() {
    this.game.events.off("triggerShoot");
    this.game.events.off("pauseGame");
    this.game.events.off("resumeGame");
    this.game.events.off("restartGame");

    this.events.once("shutdown", () => {
      this.game.events.off("triggerShoot");
      this.game.events.off("pauseGame");
      this.game.events.off("resumeGame");
      this.game.events.off("restartGame");
    });

    this.game.events.on("triggerShoot", () => this.fireCannon());
    this.game.events.on("pauseGame", () => (this.isPaused = true));
    this.game.events.on("resumeGame", () => (this.isPaused = false));
    this.game.events.on("restartGame", () => {
      this.scene.restart();
    });
  }

  update(_time: number, delta: number) {
    if (this.isPaused) return;

    if (this.cooldownRemainingMs > 0) {
      this.cooldownRemainingMs = Math.max(0, this.cooldownRemainingMs - delta);
    }

    this.clouds.forEach((cloud) => {
      cloud.x += (cloud as any).speed;
      if (cloud.x > 1920 + 100) {
        cloud.x = -100;
      }
    });

    this.renderTrajectory();
    this.updateBullet();
  }
}
