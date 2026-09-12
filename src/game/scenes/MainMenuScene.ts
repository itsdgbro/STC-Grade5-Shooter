import * as Phaser from "phaser";
import { sfx } from "../../utils/sounds";
import { SettingsModal } from "../ui/SettingsModal";

export class MainMenuScene extends Phaser.Scene {
  private clouds: Phaser.GameObjects.Text[] = [];
  private butterflies: Phaser.GameObjects.Text[] = [];

  constructor() {
    super({ key: "MainMenuScene" });
  }

  create() {
    // 1. Exact Rich Multi-Layered Cartoon Adventure World Background (SVG)
    this.add.image(960, 540, "main_menu_bg");

    // 2. Animated Floating Clouds (Matching original ☁️ style)
    this.createClouds();

    // 3. Animated Flying Butterflies & Sparkles
    this.createDecorations();

    // 4. Top-Left Toolbar: Slot 0 Settings Button (centre anchored at (100, 100), 96px circular)
    const settingsBtn = this.add
      .circle(100, 100, 48, 0xffffff)
      .setStrokeStyle(4, 0xbae6fd)
      .setInteractive({ useHandCursor: true });

    // 3D ledge shadow
    this.add
      .circle(100, 106, 48, 0x7dd3fc)
      .setDepth(-1);

    const gearIcon = this.add
      .image(100, 100, "icon_settings")
      .setDisplaySize(42, 42)
      .setTint(0x0284c7);

    let activeSettingsModal: SettingsModal | null = null;
    settingsBtn.on("pointerdown", () => {
      if (activeSettingsModal) return;
      sfx.playPop();
      activeSettingsModal = new SettingsModal(this, () => {
        activeSettingsModal = null;
      });
    });

    settingsBtn.on("pointerover", () => {
      this.tweens.add({
        targets: [settingsBtn, gearIcon],
        scaleX: 1.08,
        scaleY: 1.08,
        duration: 100,
        ease: "Back.easeOut",
      });
    });

    settingsBtn.on("pointerout", () => {
      this.tweens.add({
        targets: [settingsBtn, gearIcon],
        scaleX: 1,
        scaleY: 1,
        duration: 100,
        ease: "Quad.easeOut",
      });
    });

    // 5. Center Main Menu Content (Pop Animation)
    const centerContainer = this.add.container(960, 470);

    const titleText = this.registry.get("gameTitle") || "CANNON BALL";
    const subtitleText =
      this.registry.get("gameSubtitle") || "GRADE 5 MATH CHALLENGE";

    // Grade 5 Badge Pill
    const badgeW = 620;
    const badgeH = 68;
    const badgeBg = this.add
      .rectangle(0, -115, badgeW, badgeH, 0xd97706)
      .setStrokeStyle(5, 0xfef08a);

    // Inner orange gradient simulation
    const badgeInner = this.add
      .rectangle(0, -117, badgeW - 8, badgeH - 8, 0xf59e0b);

    const badgeLabel = this.add
      .text(0, -115, `⭐  ${subtitleText.toUpperCase()}  ⭐`, {
        fontFamily: "'Fredoka', 'Mukta', sans-serif",
        fontSize: "30px",
        fontStyle: "900",
        color: "#ffffff",
        stroke: "#92400e",
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    // Main 3D Title "CANNON BALL"
    const title = this.add
      .text(0, 0, titleText, {
        fontFamily: "'Fredoka', 'Mukta', sans-serif",
        fontSize: "128px",
        fontStyle: "900",
        color: "#ffffff",
        stroke: "#0369a1",
        strokeThickness: 16,
        shadow: {
          offsetX: 0,
          offsetY: 14,
          color: "#0284c7",
          blur: 0,
          stroke: true,
          fill: true,
        },
      })
      .setOrigin(0.5);

    // Play Button (Increased by 40% per user request)
    const playBtnContainer = this.add.container(0, 180);
    const playW = Math.round(390 * 1.4); // 546
    const playH = Math.round(92 * 1.4);  // 129

    // Bottom 3D shadow ledge
    const playLedge = this.add
      .rectangle(0, 15, playW, playH, 0x9b1d1d, 1)
      .setOrigin(0.5);

    // Main Red Face
    const playFace = this.add
      .rectangle(0, 0, playW, playH, 0xee5253)
      .setStrokeStyle(8, 0xffffff)
      .setInteractive({ useHandCursor: true });

    // Specular highlight top pill
    const playHighlight = this.add
      .rectangle(0, -28, playW * 0.78, playH * 0.32, 0xffffff, 0.45)
      .setOrigin(0.5);

    // Label
    const playLabel = this.add
      .text(0, -2, "▶  PLAY", {
        fontFamily: "'Fredoka', 'Mukta', sans-serif",
        fontSize: "66px",
        fontStyle: "900",
        color: "#ffffff",
        stroke: "#9b1d1d",
        strokeThickness: 8,
      })
      .setOrigin(0.5);

    playBtnContainer.add([playLedge, playFace, playHighlight, playLabel]);

    // Button interactions
    playFace.on("pointerover", () => {
      this.tweens.add({
        targets: playBtnContainer,
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 100,
        ease: "Back.easeOut",
      });
    });

    playFace.on("pointerout", () => {
      this.tweens.add({
        targets: playBtnContainer,
        scaleX: 1,
        scaleY: 1,
        duration: 100,
        ease: "Quad.easeOut",
      });
    });

    playFace.on("pointerdown", () => {
      playBtnContainer.y = 190;
      sfx.playPop();
      sfx.startBGM();

      this.time.delayedCall(160, () => {
        this.scene.start("GameScene");
        this.scene.launch("UIScene");
      });
    });

    centerContainer.add([
      badgeBg,
      badgeInner,
      badgeLabel,
      title,
      playBtnContainer,
    ]);

    // Title gentle breathing idle animation
    this.tweens.add({
      targets: centerContainer,
      scaleX: 1.02,
      scaleY: 1.02,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // 6. Audio Autostart on first interaction
    this.input.once("pointerdown", () => {
      sfx.startBGM();
    });
  }

  private createClouds() {
    const cloudConfigs = [
      { x: 180, y: 70, size: 75, speed: 0.35 },
      { x: 550, y: 110, size: 62, speed: 0.25 },
      { x: 1420, y: 60, size: 84, speed: 0.4 },
    ];

    cloudConfigs.forEach((cfg) => {
      const cloud = this.add
        .text(cfg.x, cfg.y, "☁️", { fontSize: `${cfg.size}px` })
        .setOrigin(0.5)
        .setAlpha(0.85);
      (cloud as any).speed = cfg.speed;
      this.clouds.push(cloud);

      // Gentle vertical bob
      this.tweens.add({
        targets: cloud,
        y: cfg.y + 12,
        duration: 3500 + Math.random() * 1500,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    });
  }

  private createDecorations() {
    // Butterflies 🦋
    const b1 = this.add.text(320, 520, "🦋", { fontSize: "46px" }).setOrigin(0.5);
    const b2 = this.add.text(1520, 580, "🦋", { fontSize: "42px" }).setOrigin(0.5);

    [b1, b2].forEach((b, i) => {
      this.butterflies.push(b);
      this.tweens.add({
        targets: b,
        y: b.y - 30,
        x: b.x + (i === 0 ? 40 : -40),
        duration: 2200 + i * 800,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    });

    // Sparkles & Stars ✨ ⭐
    const s1 = this.add.text(720, 240, "✨", { fontSize: "38px" }).setOrigin(0.5);
    const s2 = this.add.text(1280, 290, "⭐", { fontSize: "42px" }).setOrigin(0.5);

    [s1, s2].forEach((s) => {
      this.tweens.add({
        targets: s,
        scaleX: 1.3,
        scaleY: 1.3,
        alpha: 0.6,
        duration: 1500,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    });
  }

  update() {
    this.clouds.forEach((cloud) => {
      cloud.x += (cloud as any).speed;
      if (cloud.x > 1920 + 100) {
        cloud.x = -100;
      }
    });
  }
}
