import * as Phaser from "phaser";
import { sfx } from "../../utils/sounds";

export class SettingsModal extends Phaser.GameObjects.Container {
  private onCloseCallback?: () => void;

  constructor(scene: Phaser.Scene, onClose?: () => void) {
    super(scene, 960, 540);
    this.onCloseCallback = onClose;

    this.setDepth(1000);

    // 1. Full-screen backdrop to intercept and block all clicks
    const backdrop = scene.add
      .rectangle(0, 0, 1920, 1080, 0x0f172a, 0.75)
      .setInteractive();

    // 2. Main Settings Card with Rounded Corner Radius Curve
    const cardW = 680;
    const cardH = 500;
    const cardRadius = 38;

    // 3D Ledge Shadow + Main Card Face + Cyan Border (drawn with Graphics for smooth rounded corners)
    const cardGfx = scene.add.graphics();

    // 3D Ledge Shadow (offset by +10px downwards)
    cardGfx.fillStyle(0x0284c7, 1);
    cardGfx.fillRoundedRect(-cardW / 2, -cardH / 2 + 10, cardW, cardH, cardRadius);

    // Main Card White Face
    cardGfx.fillStyle(0xffffff, 1);
    cardGfx.fillRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, cardRadius);

    // Cyan Border (5px stroke)
    cardGfx.lineStyle(5, 0x38bdf8, 1);
    cardGfx.strokeRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, cardRadius);

    // Card interactive hit area so clicking on card doesn't bubble to backdrop
    const cardHitArea = scene.add
      .rectangle(0, 0, cardW, cardH, 0x000000, 0)
      .setOrigin(0.5)
      .setInteractive();

    // Header Title
    const title = scene.add
      .text(0, -175, "GAME SETTINGS", {
        fontFamily: "'Fredoka', sans-serif",
        fontSize: "46px",
        fontStyle: "900",
        color: "#0f172a",
      })
      .setOrigin(0.5);

    // 3. Controller Rows (with rounded container curves)
    const rowW = 560;
    const rowH = 76;
    const rowRadius = 22;

    // Music Row Container Card
    const musicRowGfx = scene.add.graphics();
    musicRowGfx.fillStyle(0xf8fafc, 1);
    musicRowGfx.fillRoundedRect(-rowW / 2, -108, rowW, rowH, rowRadius);
    musicRowGfx.lineStyle(3, 0xe2e8f0, 1);
    musicRowGfx.strokeRoundedRect(-rowW / 2, -108, rowW, rowH, rowRadius);

    const musicLabel = scene.add
      .text(-240, -70, "🎵 Background Music", {
        fontFamily: "'Fredoka', sans-serif",
        fontSize: "28px",
        fontStyle: "bold",
        color: "#1e293b",
      })
      .setOrigin(0, 0.5);

    // Music Toggle Pill Button
    const musicBtnContainer = scene.add.container(180, -70);
    const musicBtnGfx = scene.add.graphics();

    const drawMusicBtn = (muted: boolean) => {
      musicBtnGfx.clear();
      // 3D bottom ledge
      musicBtnGfx.fillStyle(muted ? 0x991b1b : 0x15803d, 1);
      musicBtnGfx.fillRoundedRect(-65, -23 + 4, 130, 46, 23);
      // Main face
      musicBtnGfx.fillStyle(muted ? 0xef4444 : 0x22c55e, 1);
      musicBtnGfx.fillRoundedRect(-65, -23, 130, 46, 23);
      // White border
      musicBtnGfx.lineStyle(3, 0xffffff, 1);
      musicBtnGfx.strokeRoundedRect(-65, -23, 130, 46, 23);
    };
    drawMusicBtn(sfx.musicMuted);

    const musicBtnHit = scene.add
      .rectangle(0, 0, 130, 46, 0x000000, 0)
      .setInteractive({ useHandCursor: true });

    const musicStatus = scene.add
      .text(0, 0, sfx.musicMuted ? "MUTED" : "ON", {
        fontFamily: "'Fredoka', sans-serif",
        fontSize: "22px",
        fontStyle: "900",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    musicBtnContainer.add([musicBtnGfx, musicBtnHit, musicStatus]);

    musicBtnHit.on("pointerdown", () => {
      sfx.playPop();
      const nextMuted = !sfx.musicMuted;
      sfx.setMusicMuted(nextMuted);
      drawMusicBtn(nextMuted);
      musicStatus.setText(nextMuted ? "MUTED" : "ON");
      if (!nextMuted) {
        sfx.startBGM();
      }
    });

    musicBtnHit.on("pointerover", () => {
      scene.tweens.add({
        targets: musicBtnContainer,
        scaleX: 1.06,
        scaleY: 1.06,
        duration: 90,
      });
    });

    musicBtnHit.on("pointerout", () => {
      scene.tweens.add({
        targets: musicBtnContainer,
        scaleX: 1,
        scaleY: 1,
        duration: 90,
      });
    });

    // SFX Row Container Card
    const sfxRowGfx = scene.add.graphics();
    sfxRowGfx.fillStyle(0xf8fafc, 1);
    sfxRowGfx.fillRoundedRect(-rowW / 2, -12, rowW, rowH, rowRadius);
    sfxRowGfx.lineStyle(3, 0xe2e8f0, 1);
    sfxRowGfx.strokeRoundedRect(-rowW / 2, -12, rowW, rowH, rowRadius);

    const sfxLabel = scene.add
      .text(-240, 26, "🔊 Sound Effects", {
        fontFamily: "'Fredoka', sans-serif",
        fontSize: "28px",
        fontStyle: "bold",
        color: "#1e293b",
      })
      .setOrigin(0, 0.5);

    // SFX Toggle Pill Button
    const sfxBtnContainer = scene.add.container(180, 26);
    const sfxBtnGfx = scene.add.graphics();

    const drawSfxBtn = (muted: boolean) => {
      sfxBtnGfx.clear();
      // 3D bottom ledge
      sfxBtnGfx.fillStyle(muted ? 0x991b1b : 0x15803d, 1);
      sfxBtnGfx.fillRoundedRect(-65, -23 + 4, 130, 46, 23);
      // Main face
      sfxBtnGfx.fillStyle(muted ? 0xef4444 : 0x22c55e, 1);
      sfxBtnGfx.fillRoundedRect(-65, -23, 130, 46, 23);
      // White border
      sfxBtnGfx.lineStyle(3, 0xffffff, 1);
      sfxBtnGfx.strokeRoundedRect(-65, -23, 130, 46, 23);
    };
    drawSfxBtn(sfx.sfxMuted);

    const sfxBtnHit = scene.add
      .rectangle(0, 0, 130, 46, 0x000000, 0)
      .setInteractive({ useHandCursor: true });

    const sfxStatus = scene.add
      .text(0, 0, sfx.sfxMuted ? "MUTED" : "ON", {
        fontFamily: "'Fredoka', sans-serif",
        fontSize: "22px",
        fontStyle: "900",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    sfxBtnContainer.add([sfxBtnGfx, sfxBtnHit, sfxStatus]);

    sfxBtnHit.on("pointerdown", () => {
      sfx.playPop();
      const nextMuted = !sfx.sfxMuted;
      sfx.setSFXMuted(nextMuted);
      drawSfxBtn(nextMuted);
      sfxStatus.setText(nextMuted ? "MUTED" : "ON");
    });

    sfxBtnHit.on("pointerover", () => {
      scene.tweens.add({
        targets: sfxBtnContainer,
        scaleX: 1.06,
        scaleY: 1.06,
        duration: 90,
      });
    });

    sfxBtnHit.on("pointerout", () => {
      scene.tweens.add({
        targets: sfxBtnContainer,
        scaleX: 1,
        scaleY: 1,
        duration: 90,
      });
    });

    // 4. Corner Red Close Button (anchored at curved corner)
    const cornerX = cardW / 2 - 20;
    const cornerY = -cardH / 2 + 20;
    const cornerCloseLedge = scene.add.circle(cornerX, cornerY + 4, 28, 0x991b1b);
    const cornerCloseFace = scene.add
      .circle(cornerX, cornerY, 28, 0xef4444)
      .setStrokeStyle(3, 0xffffff)
      .setInteractive({ useHandCursor: true });
    const cornerCloseIcon = scene.add
      .text(cornerX, cornerY - 1, "✕", {
        fontFamily: "'Fredoka', sans-serif",
        fontSize: "30px",
        fontStyle: "900",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    // 5. 3D "CLOSE" Button at Bottom
    const closeBtnContainer = scene.add.container(0, 165);
    const closeBtn = scene.add
      .image(0, 0, "btn_green")
      .setInteractive({ useHandCursor: true });

    const closeLabel = scene.add
      .text(0, -4, "CLOSE", {
        fontFamily: "'Fredoka', sans-serif",
        fontSize: "32px",
        fontStyle: "900",
        color: "#ffffff",
        stroke: "#14532d",
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    closeBtnContainer.add([closeBtn, closeLabel]);

    const handleClose = () => {
      sfx.playPop();
      this.close();
    };

    closeBtn.on("pointerdown", handleClose);
    cornerCloseFace.on("pointerdown", handleClose);
    backdrop.on("pointerdown", handleClose);

    closeBtn.on("pointerover", () => {
      scene.tweens.add({
        targets: closeBtnContainer,
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 90,
      });
    });
    closeBtn.on("pointerout", () => {
      scene.tweens.add({
        targets: closeBtnContainer,
        scaleX: 1,
        scaleY: 1,
        duration: 90,
      });
    });

    cornerCloseFace.on("pointerover", () => {
      scene.tweens.add({
        targets: [cornerCloseFace, cornerCloseLedge, cornerCloseIcon],
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 90,
      });
    });
    cornerCloseFace.on("pointerout", () => {
      scene.tweens.add({
        targets: [cornerCloseFace, cornerCloseLedge, cornerCloseIcon],
        scaleX: 1,
        scaleY: 1,
        duration: 90,
      });
    });

    this.add([
      backdrop,
      cardGfx,
      cardHitArea,
      title,
      musicRowGfx,
      musicLabel,
      musicBtnContainer,
      sfxRowGfx,
      sfxLabel,
      sfxBtnContainer,
      cornerCloseLedge,
      cornerCloseFace,
      cornerCloseIcon,
      closeBtnContainer,
    ]);

    scene.add.existing(this);

    // Pop-in animation
    this.setScale(0.85);
    this.setAlpha(0);
    scene.tweens.add({
      targets: this,
      scaleX: 1,
      scaleY: 1,
      alpha: 1,
      duration: 160,
      ease: "Back.easeOut",
    });
  }

  public close() {
    this.scene.tweens.add({
      targets: this,
      scaleX: 0.9,
      scaleY: 0.9,
      alpha: 0,
      duration: 120,
      ease: "Quad.easeIn",
      onComplete: () => {
        if (this.onCloseCallback) {
          this.onCloseCallback();
        }
        this.destroy();
      },
    });
  }
}
