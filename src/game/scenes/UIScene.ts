import * as Phaser from "phaser";
import { sfx } from "../../utils/sounds";
import { flutterBridge } from "../../utils/flutterBridge";
import { SettingsModal } from "../ui/SettingsModal";

export class UIScene extends Phaser.Scene {
  // Game Stats
  private score = 0;
  private health = 3;
  private currentHint = "Solve the equation step by step, then shoot the matching number ball!";

  // Top Header UI Objects
  private scoreText!: Phaser.GameObjects.Text;
  private heartSprites: Phaser.GameObjects.Image[] = [];

  // Bottom Buttons
  private shootBtnContainer!: Phaser.GameObjects.Container;
  private shootGfx!: Phaser.GameObjects.Graphics;
  private shootFace!: Phaser.GameObjects.Rectangle;
  private isShootOnCooldown = false;

  // Modals
  private activeModal: Phaser.GameObjects.Container | null = null;

  constructor() {
    super({ key: "UIScene" });
  }

  create() {
    this.score = 0;
    this.health = 3;
    this.activeModal = null;
    this.isShootOnCooldown = false;

    // 1. Build Top Header: Left Pause/Settings + Right Points/Health Cards
    this.createTopHeader();

    // 2. Build Bottom Area: Left HINT Pill + Right SHOOT Pill
    this.createBottomButtons();

    // 3. Setup Listeners
    this.setupListeners();

    // 4. Setup Flutter Bridge
    this.setupFlutterBridge();
  }

  // =========================================================================
  // 1. TOP HEADER (EXACT 100% REPLICATION OF EquationShooter.tsx)
  // Left buttons at (100, 80) and (220, 80).
  // Right cards at (1580, 80) and (1785, 80).
  // =========================================================================
  private createTopHeader() {
    // ---- LEFT BUTTON GROUP: PAUSE & SETTINGS (96px Circular White Buttons) ----
    const makeHeaderButton = (
      x: number,
      iconKey: string,
      onClick: () => void,
    ) => {
      const container = this.add.container(x, 80).setDepth(30);

      // 3D Ledge Shadow (0 6px 0 #7dd3fc)
      this.add
        .circle(x, 86, 48, 0x7dd3fc)
        .setDepth(29);

      // White Face (4px solid #bae6fd)
      const face = this.add
        .circle(0, 0, 48, 0xffffff)
        .setStrokeStyle(4, 0xbae6fd)
        .setInteractive({ useHandCursor: true });

      // Blue Icon (#0284c7)
      const icon = this.add
        .image(0, 0, iconKey)
        .setDisplaySize(42, 42)
        .setTint(0x0284c7);

      container.add([face, icon]);

      face.on("pointerover", () => {
        this.tweens.add({
          targets: container,
          scaleX: 1.06,
          scaleY: 1.06,
          duration: 100,
          ease: "Back.easeOut",
        });
      });

      face.on("pointerout", () => {
        this.tweens.add({
          targets: container,
          scaleX: 1,
          scaleY: 1,
          duration: 100,
          ease: "Quad.easeOut",
        });
      });

      face.on("pointerdown", () => {
        sfx.playPop();
        onClick();
      });

      return container;
    };

    makeHeaderButton(100, "icon_pause", () => this.showPauseModal());
    makeHeaderButton(220, "icon_settings", () => this.showSettingsModal());

    // ---- RIGHT STATUS GROUP: POINTS CARD & HEALTH CARD ----
    // 1. POINTS Card (width: 180, height: 96, shadow: 0 5px 0 #7dd3fc, border: 3px solid #bae6fd, radius: 10)
    const pointsContainer = this.add.container(1580, 80).setDepth(30);
    const pW = 180;
    const pH = 96;
    const pR = 10;

    const pointsGfx = this.add.graphics();
    // Shadow ledge
    pointsGfx.fillStyle(0x7dd3fc, 1);
    pointsGfx.fillRoundedRect(-pW / 2, -pH / 2 + 5, pW, pH, pR);

    // Face
    pointsGfx.fillStyle(0xffffff, 0.96);
    pointsGfx.fillRoundedRect(-pW / 2, -pH / 2, pW, pH, pR);

    // Border
    pointsGfx.lineStyle(3, 0xbae6fd, 1);
    pointsGfx.strokeRoundedRect(-pW / 2, -pH / 2, pW, pH, pR);

    const pointsLabel = this.add
      .text(0, -22, "POINTS", {
        fontFamily: "'Fredoka', sans-serif",
        fontSize: "22px",
        fontStyle: "900",
        color: "#0369a1",
      })
      .setOrigin(0.5);

    this.scoreText = this.add
      .text(0, 14, "0", {
        fontFamily: "'Fredoka', sans-serif",
        fontSize: "44px",
        fontStyle: "900",
        color: "#dc2626",
        stroke: "#991b1b",
        strokeThickness: 3,
      })
      .setOrigin(0.5);

    pointsContainer.add([pointsGfx, pointsLabel, this.scoreText]);

    // 2. HEALTH Card (width: 190, height: 96, shadow: 0 5px 0 #fb7185, border: 3px solid #fecdd3, radius: 10)
    const healthContainer = this.add.container(1785, 80).setDepth(30);
    const hW = 190;
    const hH = 96;
    const hR = 10;

    const healthGfx = this.add.graphics();
    // Shadow ledge
    healthGfx.fillStyle(0xfb7185, 1);
    healthGfx.fillRoundedRect(-hW / 2, -hH / 2 + 5, hW, hH, hR);

    // Face
    healthGfx.fillStyle(0xffffff, 0.96);
    healthGfx.fillRoundedRect(-hW / 2, -hH / 2, hW, hH, hR);

    // Border
    healthGfx.lineStyle(3, 0xfecdd3, 1);
    healthGfx.strokeRoundedRect(-hW / 2, -hH / 2, hW, hH, hR);

    healthContainer.add(healthGfx);

    this.heartSprites = [];
    [-54, 0, 54].forEach((hx) => {
      const heart = this.add
        .image(hx, 0, "heart_full")
        .setDisplaySize(44, 44);
      this.heartSprites.push(heart);
      healthContainer.add(heart);
    });
  }

  // =========================================================================
  // 2. BOTTOM AREA: HINT PILL BUTTON (LEFT) & SHOOT PILL BUTTON (RIGHT)
  // =========================================================================
  private createBottomButtons() {
    // ---- LEFT HINT PILL BUTTON (at X: 170, Y: 1010, radius: 10) ----
    const hintContainer = this.add.container(170, 1010).setDepth(30);
    const hintW = 220;
    const hintH = 74;
    const hintR = 10;

    const hintGfx = this.add.graphics();
    // Ledge shadow (0 7px 0 #ca8a04)
    hintGfx.fillStyle(0xca8a04, 1);
    hintGfx.fillRoundedRect(-hintW / 2, -hintH / 2 + 7, hintW, hintH, hintR);

    // Face (5px solid #FFFFFF, yellow #facc15)
    hintGfx.fillStyle(0xfacc15, 1);
    hintGfx.fillRoundedRect(-hintW / 2, -hintH / 2, hintW, hintH, hintR);

    // Border
    hintGfx.lineStyle(5, 0xffffff, 1);
    hintGfx.strokeRoundedRect(-hintW / 2, -hintH / 2, hintW, hintH, hintR);

    const hintFace = this.add
      .rectangle(0, 0, hintW, hintH, 0x000000, 0)
      .setInteractive({ useHandCursor: true });

    // Icon + Text
    const hintIcon = this.add.image(-48, -2, "icon_hint").setDisplaySize(38, 38);
    const hintLabel = this.add
      .text(14, -2, "HINT", {
        fontFamily: "'Fredoka', 'Mukta', sans-serif",
        fontSize: "32px",
        fontStyle: "900",
        color: "#854d0e",
      })
      .setOrigin(0.5);

    hintContainer.add([hintGfx, hintFace, hintIcon, hintLabel]);

    hintFace.on("pointerover", () => {
      this.tweens.add({
        targets: hintContainer,
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 100,
        ease: "Back.easeOut",
      });
    });

    hintFace.on("pointerout", () => {
      this.tweens.add({
        targets: hintContainer,
        scaleX: 1,
        scaleY: 1,
        duration: 100,
        ease: "Quad.easeOut",
      });
    });

    hintFace.on("pointerdown", () => {
      sfx.playPop();
      this.showHintModal();
    });

    // ---- RIGHT SHOOT PILL BUTTON (at X: 1740, Y: 1010, radius: 10) ----
    this.shootBtnContainer = this.add.container(1740, 1010).setDepth(30);
    const shootW = 230;
    const shootH = 74;

    this.shootGfx = this.add.graphics();
    this.drawShootBtn(0xef4444, 0x991b1b);

    this.shootFace = this.add
      .rectangle(0, 0, shootW, shootH, 0x000000, 0)
      .setInteractive({ useHandCursor: true });

    // Specular highlight with 6px corner radius
    const shootHighlight = this.add.graphics();
    shootHighlight.fillStyle(0xffffff, 0.4);
    shootHighlight.fillRoundedRect(-shootW * 0.38, -26, shootW * 0.76, shootH * 0.28, 6);

    const shootLabel = this.add
      .text(0, -2, "SHOOT", {
        fontFamily: "'Fredoka', sans-serif",
        fontSize: "34px",
        fontStyle: "900",
        color: "#ffffff",
        stroke: "#7f1d1d",
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    this.shootBtnContainer.add([
      this.shootGfx,
      this.shootFace,
      shootHighlight,
      shootLabel,
    ]);

    this.shootFace.on("pointerover", () => {
      if (this.isShootOnCooldown) return;
      this.tweens.add({
        targets: this.shootBtnContainer,
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 100,
        ease: "Back.easeOut",
      });
    });

    this.shootFace.on("pointerout", () => {
      this.tweens.add({
        targets: this.shootBtnContainer,
        scaleX: 1,
        scaleY: 1,
        duration: 100,
        ease: "Quad.easeOut",
      });
    });

    this.shootFace.on("pointerdown", () => {
      if (this.isShootOnCooldown || this.activeModal) return;
      this.triggerShootCooldown();
      this.game.events.emit("triggerShoot");
    });
  }

  private drawShootBtn(faceColor: number, ledgeColor: number) {
    const shootW = 230;
    const shootH = 74;
    const r = 10;
    this.shootGfx.clear();
    // Ledge shadow
    this.shootGfx.fillStyle(ledgeColor, 1);
    this.shootGfx.fillRoundedRect(-shootW / 2, -shootH / 2 + 9, shootW, shootH, r);
    // Face
    this.shootGfx.fillStyle(faceColor, 1);
    this.shootGfx.fillRoundedRect(-shootW / 2, -shootH / 2, shootW, shootH, r);
    // Border
    this.shootGfx.lineStyle(5, 0xffffff, 1);
    this.shootGfx.strokeRoundedRect(-shootW / 2, -shootH / 2, shootW, shootH, r);
  }

  private triggerShootCooldown() {
    this.isShootOnCooldown = true;
    this.drawShootBtn(0x64748b, 0x334155);
    this.shootBtnContainer.setAlpha(0.75);

    this.time.delayedCall(1000, () => {
      this.isShootOnCooldown = false;
      this.drawShootBtn(0xef4444, 0x991b1b);
      this.shootBtnContainer.setAlpha(1);
    });
  }

  // =========================================================================
  // 3. DEDICATED HINT CARD MODAL (EXACT 100% REPLICATION OF EquationShooter.tsx)
  // =========================================================================
  private showHintModal() {
    if (this.activeModal) return;
    this.game.events.emit("pauseGame");

    const modal = this.add.container(960, 540).setDepth(100);

    // Dim Backdrop
    const backdrop = this.add
      .rectangle(0, 0, 1920, 1080, 0x0f172a, 0.65)
      .setInteractive();

    const cardW = 1100;
    const cardH = 360;

    // 3D Ledge Shadow (0 12px 0 #ca8a04)
    const cardLedge = this.add
      .rectangle(0, 12, cardW, cardH, 0xca8a04)
      .setOrigin(0.5);

    // Main Card Face (7px solid #facc15)
    const cardFace = this.add
      .rectangle(0, 0, cardW, cardH, 0xfefce8)
      .setStrokeStyle(7, 0xfacc15)
      .setOrigin(0.5);

    // Header: Lightbulb Icon + "HINT" in #854d0e
    const hintIcon = this.add
      .image(-cardW / 2 + 80, -cardH / 2 + 65, "icon_hint")
      .setDisplaySize(48, 48);

    const hintTitle = this.add
      .text(-cardW / 2 + 120, -cardH / 2 + 65, "HINT", {
        fontFamily: "'Fredoka', sans-serif",
        fontSize: "40px",
        fontStyle: "900",
        color: "#854d0e",
      })
      .setOrigin(0, 0.5);

    // Circular Close Button ✕ (top-right: top -28px, right -28px, 84px red circle)
    const closeBtnX = cardW / 2 - 10;
    const closeBtnY = -cardH / 2 + 10;

    const closeLedge = this.add
      .circle(closeBtnX, closeBtnY + 6, 42, 0xb91c1c);

    const closeFace = this.add
      .circle(closeBtnX, closeBtnY, 42, 0xef4444)
      .setStrokeStyle(5, 0xffffff)
      .setInteractive({ useHandCursor: true });

    const closeIcon = this.add
      .text(closeBtnX, closeBtnY - 2, "✕", {
        fontSize: "42px",
        fontStyle: "900",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    const closeHint = () => {
      sfx.playPop();
      modal.destroy();
      this.activeModal = null;
      this.game.events.emit("resumeGame");
    };

    closeFace.on("pointerdown", closeHint);
    backdrop.on("pointerdown", closeHint);

    // Hint Text Body
    const hintBody = this.add
      .text(0, 30, `💡  ${this.currentHint}`, {
        fontFamily: "'Fredoka', 'Mukta', sans-serif",
        fontSize: "36px",
        fontStyle: "900",
        color: "#713f12",
        align: "left",
        wordWrap: { width: cardW - 140, useAdvancedWrap: true },
      })
      .setOrigin(0.5);

    modal.add([
      backdrop,
      cardLedge,
      cardFace,
      hintIcon,
      hintTitle,
      closeLedge,
      closeFace,
      closeIcon,
      hintBody,
    ]);

    this.activeModal = modal;
  }

  // =========================================================================
  // 4. SETTINGS MODAL (Matching SettingsModal.tsx)
  // =========================================================================
  private showSettingsModal() {
    if (this.activeModal) return;
    this.game.events.emit("pauseGame");

    this.activeModal = new SettingsModal(this, () => {
      this.activeModal = null;
      this.game.events.emit("resumeGame");
    });
  }

  // =========================================================================
  // 5. PAUSE MODAL
  // =========================================================================
  private showPauseModal() {
    if (this.activeModal) return;
    this.game.events.emit("pauseGame");

    const modal = this.add.container(960, 540).setDepth(100);
    const backdrop = this.add
      .rectangle(0, 0, 1920, 1080, 0x0f172a, 0.75)
      .setInteractive();

    const card = this.add
      .rectangle(0, 0, 560, 480, 0xffffff)
      .setStrokeStyle(5, 0x0284c7)
      .setOrigin(0.5);

    const title = this.add
      .text(0, -170, "GAME PAUSED", {
        fontFamily: "'Fredoka', sans-serif",
        fontSize: "48px",
        fontStyle: "900",
        color: "#0f172a",
      })
      .setOrigin(0.5);

    // Resume
    const resumeBtn = this.add
      .image(0, -60, "btn_green")
      .setInteractive({ useHandCursor: true });
    const resumeLabel = this.add
      .text(0, -64, "RESUME", {
        fontFamily: "'Fredoka', sans-serif",
        fontSize: "30px",
        fontStyle: "900",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    resumeBtn.on("pointerdown", () => {
      sfx.playPop();
      modal.destroy();
      this.activeModal = null;
      this.game.events.emit("resumeGame");
    });

    // Restart
    const restartBtn = this.add
      .image(0, 40, "btn_orange")
      .setInteractive({ useHandCursor: true });
    const restartLabel = this.add
      .text(0, 36, "RESTART", {
        fontFamily: "'Fredoka', sans-serif",
        fontSize: "30px",
        fontStyle: "900",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    restartBtn.on("pointerdown", () => {
      sfx.playPop();
      modal.destroy();
      this.activeModal = null;
      this.scene.restart();
      this.game.events.emit("restartGame");
    });

    // Menu
    const menuBtn = this.add
      .image(0, 140, "btn_blue")
      .setInteractive({ useHandCursor: true });
    const menuLabel = this.add
      .text(0, 136, "MAIN MENU", {
        fontFamily: "'Fredoka', sans-serif",
        fontSize: "28px",
        fontStyle: "900",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    menuBtn.on("pointerdown", () => {
      sfx.playPop();
      modal.destroy();
      this.activeModal = null;
      this.scene.stop("GameScene");
      this.scene.start("MainMenuScene");
    });

    modal.add([
      backdrop,
      card,
      title,
      resumeBtn,
      resumeLabel,
      restartBtn,
      restartLabel,
      menuBtn,
      menuLabel,
    ]);

    this.activeModal = modal;
  }

  // =========================================================================
  // 6. GAME OVER MODAL
  // =========================================================================
  private showGameOverModal() {
    if (this.activeModal) return;
    this.game.events.emit("pauseGame");

    flutterBridge.sendGameOver({
      score: this.score,
      stars: Math.min(3, Math.max(1, Math.floor(this.score / 150))),
      timeSpentSeconds: 60,
      totalQuestions: 10,
      correctAnswers: Math.floor(this.score / 20),
    });

    const modal = this.add.container(960, 540).setDepth(100);
    const backdrop = this.add
      .rectangle(0, 0, 1920, 1080, 0x0f172a, 0.8)
      .setInteractive();

    const card = this.add
      .rectangle(0, 0, 620, 480, 0xffffff)
      .setStrokeStyle(6, 0xef4444)
      .setOrigin(0.5);

    const title = this.add
      .text(0, -150, "GAME OVER", {
        fontFamily: "'Fredoka', sans-serif",
        fontSize: "52px",
        fontStyle: "900",
        color: "#dc2626",
      })
      .setOrigin(0.5);

    const scoreSummary = this.add
      .text(0, -40, `Final Points: ${this.score}`, {
        fontFamily: "'Fredoka', sans-serif",
        fontSize: "38px",
        fontStyle: "bold",
        color: "#1e293b",
      })
      .setOrigin(0.5);

    const retryBtn = this.add
      .image(0, 60, "btn_green")
      .setInteractive({ useHandCursor: true });
    const retryLabel = this.add
      .text(0, 56, "PLAY AGAIN", {
        fontFamily: "'Fredoka', sans-serif",
        fontSize: "30px",
        fontStyle: "900",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    retryBtn.on("pointerdown", () => {
      sfx.playPop();
      modal.destroy();
      this.activeModal = null;
      this.scene.restart();
      this.game.events.emit("restartGame");
    });

    const menuBtn = this.add
      .image(0, 150, "btn_blue")
      .setInteractive({ useHandCursor: true });
    const menuLabel = this.add
      .text(0, 146, "MAIN MENU", {
        fontFamily: "'Fredoka', sans-serif",
        fontSize: "28px",
        fontStyle: "900",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    menuBtn.on("pointerdown", () => {
      sfx.playPop();
      modal.destroy();
      this.activeModal = null;
      this.scene.stop("GameScene");
      this.scene.start("MainMenuScene");
    });

    modal.add([
      backdrop,
      card,
      title,
      scoreSummary,
      retryBtn,
      retryLabel,
      menuBtn,
      menuLabel,
    ]);

    this.activeModal = modal;
  }

  // =========================================================================
  // 7. EVENT LISTENERS
  // =========================================================================
  private setupListeners() {
    this.game.events.on("setHintText", (hint: string) => {
      this.currentHint = hint;
    });

    this.game.events.on("correctAnswer", () => {
      this.score += 200;
      this.scoreText.setText(`${this.score}`);

      // Score pop animation
      this.tweens.add({
        targets: this.scoreText,
        scaleX: 1.3,
        scaleY: 1.3,
        duration: 100,
        yoyo: true,
        ease: "Back.easeOut",
      });

      flutterBridge.send("GAME_PROGRESS", {
        score: this.score,
        health: this.health,
      });
    });

    this.game.events.on("wrongAnswer", () => {
      this.health = Math.max(0, this.health - 1);
      if (this.heartSprites[this.health]) {
        const heart = this.heartSprites[this.health];
        this.tweens.add({
          targets: heart,
          scaleX: 1.3,
          scaleY: 1.3,
          duration: 100,
          yoyo: true,
          onComplete: () => {
            heart.setTexture("heart_empty");
          },
        });
      }

      if (this.health === 0) {
        this.time.delayedCall(600, () => this.showGameOverModal());
      }
    });
  }

  private setupFlutterBridge() {
    flutterBridge.on("PAUSE", () => this.showPauseModal());
    flutterBridge.on("RESUME", () => {
      if (this.activeModal) {
        this.activeModal.destroy();
        this.activeModal = null;
        this.game.events.emit("resumeGame");
      }
    });
    flutterBridge.on("RESTART", () => {
      if (this.activeModal) {
        this.activeModal.destroy();
        this.activeModal = null;
      }
      this.scene.restart();
      this.game.events.emit("restartGame");
    });
  }
}
