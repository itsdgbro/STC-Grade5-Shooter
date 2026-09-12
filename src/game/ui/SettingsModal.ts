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

    // 2. Main Settings Card with Rounded Corner Radius Curve (Enlarged by 30%: 936x598, radius: 50)
    const cardW = 936;
    const cardH = 598;
    const cardRadius = 50;

    const cardGfx = scene.add.graphics();

    // 3D Ledge Shadow (offset by +13px downwards)
    cardGfx.fillStyle(0x0284c7, 1);
    cardGfx.fillRoundedRect(-cardW / 2, -cardH / 2 + 13, cardW, cardH, cardRadius);

    // Main Card White Face
    cardGfx.fillStyle(0xffffff, 1);
    cardGfx.fillRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, cardRadius);

    // Cyan Border (7px stroke)
    cardGfx.lineStyle(7, 0x38bdf8, 1);
    cardGfx.strokeRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, cardRadius);

    // Card interactive hit area so clicking on card doesn't bubble to backdrop
    const cardHitArea = scene.add
      .rectangle(0, 0, cardW, cardH, 0x000000, 0)
      .setOrigin(0.5)
      .setInteractive();

    // Header Title with Settings Gear Icon (Enlarged by 30%)
    const headerContainer = scene.add.container(0, -200);
    const gearIcon = scene.add
      .image(-145, 0, "icon_settings")
      .setDisplaySize(58, 58)
      .setTint(0x0284c7);

    const title = scene.add
      .text(24, 0, "SETTINGS", {
        fontFamily: "'Fredoka', sans-serif",
        fontSize: "58px",
        fontStyle: "900",
        color: "#0f172a",
        letterSpacing: 1,
      })
      .setOrigin(0.5);

    headerContainer.add([gearIcon, title]);

    // Red Circular ✕ Close Button at Bottom-Right Corner (Enlarged by 30%)
    const cornerX = cardW / 2 - 18;
    const cornerY = cardH / 2 - 18;
    const closeRadius = 47;

    const cornerCloseLedge = scene.add.circle(cornerX, cornerY + 7, closeRadius, 0x991b1b);
    const cornerCloseFace = scene.add
      .circle(cornerX, cornerY, closeRadius, 0xef4444)
      .setStrokeStyle(5, 0xffffff)
      .setInteractive({ useHandCursor: true });
    const cornerCloseIcon = scene.add
      .text(cornerX, cornerY - 2, "✕", {
        fontFamily: "'Fredoka', sans-serif",
        fontSize: "47px",
        fontStyle: "900",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    const handleClose = () => {
      sfx.playPop();
      this.close();
    };

    cornerCloseFace.on("pointerdown", handleClose);
    backdrop.on("pointerdown", handleClose);

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

    // -------------------------------------------------------------------------
    // 3. ROWS LAYOUT (SFX & MUSIC) - Enlarged by 30%
    // -------------------------------------------------------------------------
    const rowW = 820;
    const rowH = 146;
    const rowRadius = 34;

    const sliderW = 572;
    const sliderH = 29;
    const sliderLeft = -254;
    const sliderTop = 11;

    // --- ROW 1: SFX ---
    const sfxRowContainer = scene.add.container(0, -65);
    const sfxRowGfx = scene.add.graphics();
    sfxRowGfx.fillStyle(0xf8fafc, 1);
    sfxRowGfx.fillRoundedRect(-rowW / 2, -rowH / 2, rowW, rowH, rowRadius);
    sfxRowGfx.lineStyle(5, 0xe2e8f0, 1);
    sfxRowGfx.strokeRoundedRect(-rowW / 2, -rowH / 2, rowW, rowH, rowRadius);

    // Circular SFX Toggle Button
    const sfxBtnContainer = scene.add.container(-320, 0);
    const sfxBtnGfx = scene.add.graphics();
    const sfxBtnIcon = scene.add
      .image(0, 0, sfx.sfxMuted ? "icon_audio_off" : "icon_sfx_on")
      .setDisplaySize(55, 55);
    const sfxBtnHit = scene.add
      .circle(0, 0, 49, 0x000000, 0)
      .setInteractive({ useHandCursor: true });
    sfxBtnContainer.add([sfxBtnGfx, sfxBtnIcon, sfxBtnHit]);

    const drawSFXBtn = (muted: boolean) => {
      sfxBtnGfx.clear();
      sfxBtnGfx.fillStyle(muted ? 0x64748b : 0x0369a1, 1);
      sfxBtnGfx.fillCircle(0, 5, 49);
      sfxBtnGfx.fillStyle(muted ? 0x94a3b8 : 0x0284c7, 1);
      sfxBtnGfx.fillCircle(0, 0, 49);
      sfxBtnGfx.lineStyle(4.5, 0xffffff, 1);
      sfxBtnGfx.strokeCircle(0, 0, 49);
      sfxBtnIcon.setTexture(muted ? "icon_audio_off" : "icon_sfx_on");
    };

    // SFX Label & Value Text
    const sfxLabel = scene.add
      .text(sliderLeft, -31, "SFX", {
        fontFamily: "'Fredoka', sans-serif",
        fontSize: "36px",
        fontStyle: "900",
        color: "#1e293b",
      })
      .setOrigin(0, 0.5);

    const sfxValPct = Math.round(sfx.sfxVolume * 100);
    const sfxValueText = scene.add
      .text(sliderLeft + sliderW, -31, sfx.sfxMuted ? "OFF" : `${sfxValPct}%`, {
        fontFamily: "'Fredoka', sans-serif",
        fontSize: "34px",
        fontStyle: "900",
        color: sfx.sfxMuted ? "#94a3b8" : "#0284c7",
      })
      .setOrigin(1, 0.5);

    // SFX Slider Graphics
    const sfxSliderGfx = scene.add.graphics();
    const drawSFXSlider = (vol: number, muted: boolean) => {
      sfxSliderGfx.clear();
      // Track bg
      sfxSliderGfx.fillStyle(0xe2e8f0, 1);
      sfxSliderGfx.fillRoundedRect(sliderLeft, sliderTop, sliderW, sliderH, 14);
      // Track fill
      const fillW = muted ? 0 : Math.max(0, Math.min(sliderW, vol * sliderW));
      if (fillW > 0) {
        sfxSliderGfx.fillStyle(0x0284c7, 1);
        sfxSliderGfx.fillRoundedRect(sliderLeft, sliderTop, fillW, sliderH, 14);
      }
      // Knob
      const knobX = muted ? sliderLeft : sliderLeft + fillW;
      const knobY = sliderTop + sliderH / 2;
      sfxSliderGfx.fillStyle(muted ? 0x64748b : 0x0369a1, 1);
      sfxSliderGfx.fillCircle(knobX, knobY + 3, 18);
      sfxSliderGfx.fillStyle(0xffffff, 1);
      sfxSliderGfx.fillCircle(knobX, knobY, 18);
      sfxSliderGfx.lineStyle(4.5, muted ? 0x94a3b8 : 0x0284c7, 1);
      sfxSliderGfx.strokeCircle(knobX, knobY, 18);
    };

    const sfxSliderHit = scene.add
      .rectangle(sliderLeft + sliderW / 2, sliderTop + sliderH / 2, sliderW + 38, 57, 0x000000, 0)
      .setInteractive({ useHandCursor: true });

    sfxRowContainer.add([
      sfxRowGfx,
      sfxBtnContainer,
      sfxLabel,
      sfxValueText,
      sfxSliderGfx,
      sfxSliderHit,
    ]);

    drawSFXBtn(sfx.sfxMuted);
    drawSFXSlider(sfx.sfxVolume, sfx.sfxMuted);

    // --- ROW 2: MUSIC ---
    const musicRowContainer = scene.add.container(0, 100);
    const musicRowGfx = scene.add.graphics();
    musicRowGfx.fillStyle(0xf8fafc, 1);
    musicRowGfx.fillRoundedRect(-rowW / 2, -rowH / 2, rowW, rowH, rowRadius);
    musicRowGfx.lineStyle(5, 0xe2e8f0, 1);
    musicRowGfx.strokeRoundedRect(-rowW / 2, -rowH / 2, rowW, rowH, rowRadius);

    // Circular Music Toggle Button
    const musicBtnContainer = scene.add.container(-320, 0);
    const musicBtnGfx = scene.add.graphics();
    const musicBtnIcon = scene.add
      .image(0, 0, sfx.musicMuted ? "icon_audio_off" : "icon_music_on")
      .setDisplaySize(55, 55);
    const musicBtnHit = scene.add
      .circle(0, 0, 49, 0x000000, 0)
      .setInteractive({ useHandCursor: true });
    musicBtnContainer.add([musicBtnGfx, musicBtnIcon, musicBtnHit]);

    const drawMusicBtn = (muted: boolean) => {
      musicBtnGfx.clear();
      musicBtnGfx.fillStyle(muted ? 0x64748b : 0x6b21a8, 1);
      musicBtnGfx.fillCircle(0, 5, 49);
      musicBtnGfx.fillStyle(muted ? 0x94a3b8 : 0x9333ea, 1);
      musicBtnGfx.fillCircle(0, 0, 49);
      musicBtnGfx.lineStyle(4.5, 0xffffff, 1);
      musicBtnGfx.strokeCircle(0, 0, 49);
      musicBtnIcon.setTexture(muted ? "icon_audio_off" : "icon_music_on");
    };

    // Music Label & Value Text
    const musicLabel = scene.add
      .text(sliderLeft, -31, "Music", {
        fontFamily: "'Fredoka', sans-serif",
        fontSize: "36px",
        fontStyle: "900",
        color: "#1e293b",
      })
      .setOrigin(0, 0.5);

    const musicValPct = Math.round(sfx.musicVolume * 100);
    const musicValueText = scene.add
      .text(sliderLeft + sliderW, -31, sfx.musicMuted ? "OFF" : `${musicValPct}%`, {
        fontFamily: "'Fredoka', sans-serif",
        fontSize: "34px",
        fontStyle: "900",
        color: sfx.musicMuted ? "#94a3b8" : "#9333ea",
      })
      .setOrigin(1, 0.5);

    // Music Slider Graphics
    const musicSliderGfx = scene.add.graphics();
    const drawMusicSlider = (vol: number, muted: boolean) => {
      musicSliderGfx.clear();
      // Track bg
      musicSliderGfx.fillStyle(0xe2e8f0, 1);
      musicSliderGfx.fillRoundedRect(sliderLeft, sliderTop, sliderW, sliderH, 14);
      // Track fill
      const fillW = muted ? 0 : Math.max(0, Math.min(sliderW, vol * sliderW));
      if (fillW > 0) {
        musicSliderGfx.fillStyle(0x9333ea, 1);
        musicSliderGfx.fillRoundedRect(sliderLeft, sliderTop, fillW, sliderH, 14);
      }
      // Knob
      const knobX = muted ? sliderLeft : sliderLeft + fillW;
      const knobY = sliderTop + sliderH / 2;
      musicSliderGfx.fillStyle(muted ? 0x64748b : 0x6b21a8, 1);
      musicSliderGfx.fillCircle(knobX, knobY + 3, 18);
      musicSliderGfx.fillStyle(0xffffff, 1);
      musicSliderGfx.fillCircle(knobX, knobY, 18);
      musicSliderGfx.lineStyle(4.5, muted ? 0x94a3b8 : 0x9333ea, 1);
      musicSliderGfx.strokeCircle(knobX, knobY, 18);
    };

    const musicSliderHit = scene.add
      .rectangle(sliderLeft + sliderW / 2, sliderTop + sliderH / 2, sliderW + 38, 57, 0x000000, 0)
      .setInteractive({ useHandCursor: true });

    musicRowContainer.add([
      musicRowGfx,
      musicBtnContainer,
      musicLabel,
      musicValueText,
      musicSliderGfx,
      musicSliderHit,
    ]);

    drawMusicBtn(sfx.musicMuted);
    drawMusicSlider(sfx.musicVolume, sfx.musicMuted);

    // -------------------------------------------------------------------------
    // 4. INTERACTION LOGIC (BUTTON TOGGLES & SLIDER DRAGGING)
    // -------------------------------------------------------------------------
    // Toggle SFX
    sfxBtnHit.on("pointerdown", () => {
      sfx.playPop();
      const nextMuted = !sfx.sfxMuted;
      sfx.setSFXMuted(nextMuted);
      drawSFXBtn(nextMuted);
      drawSFXSlider(sfx.sfxVolume, nextMuted);
      sfxValueText.setText(nextMuted ? "OFF" : `${Math.round(sfx.sfxVolume * 100)}%`);
      sfxValueText.setColor(nextMuted ? "#94a3b8" : "#0284c7");
    });

    sfxBtnHit.on("pointerover", () => {
      scene.tweens.add({
        targets: sfxBtnContainer,
        scaleX: 1.08,
        scaleY: 1.08,
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

    // Toggle Music
    musicBtnHit.on("pointerdown", () => {
      sfx.playPop();
      const nextMuted = !sfx.musicMuted;
      sfx.setMusicMuted(nextMuted);
      if (!nextMuted) {
        sfx.startBGM();
      }
      drawMusicBtn(nextMuted);
      drawMusicSlider(sfx.musicVolume, nextMuted);
      musicValueText.setText(nextMuted ? "OFF" : `${Math.round(sfx.musicVolume * 100)}%`);
      musicValueText.setColor(nextMuted ? "#94a3b8" : "#9333ea");
    });

    musicBtnHit.on("pointerover", () => {
      scene.tweens.add({
        targets: musicBtnContainer,
        scaleX: 1.08,
        scaleY: 1.08,
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

    // Sliders Dragging Logic
    let isDraggingSFX = false;
    let isDraggingMusic = false;

    const updateSFXFromPointer = (pointer: Phaser.Input.Pointer) => {
      const localX = pointer.x - this.x - sfxRowContainer.x;
      const fraction = Phaser.Math.Clamp((localX - sliderLeft) / sliderW, 0, 1);
      sfx.setSFXMuted(false);
      sfx.setSFXVolume(fraction);
      drawSFXBtn(false);
      drawSFXSlider(fraction, false);
      sfxValueText.setText(`${Math.round(fraction * 100)}%`);
      sfxValueText.setColor("#0284c7");
    };

    const updateMusicFromPointer = (pointer: Phaser.Input.Pointer) => {
      const localX = pointer.x - this.x - musicRowContainer.x;
      const fraction = Phaser.Math.Clamp((localX - sliderLeft) / sliderW, 0, 1);
      sfx.setMusicMuted(false);
      sfx.setMusicVolume(fraction);
      sfx.startBGM();
      drawMusicBtn(false);
      drawMusicSlider(fraction, false);
      musicValueText.setText(`${Math.round(fraction * 100)}%`);
      musicValueText.setColor("#9333ea");
    };

    sfxSliderHit.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      isDraggingSFX = true;
      updateSFXFromPointer(pointer);
    });

    musicSliderHit.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      isDraggingMusic = true;
      updateMusicFromPointer(pointer);
    });

    const onPointerMove = (pointer: Phaser.Input.Pointer) => {
      if (isDraggingSFX) updateSFXFromPointer(pointer);
      if (isDraggingMusic) updateMusicFromPointer(pointer);
    };

    const onPointerUp = () => {
      isDraggingSFX = false;
      isDraggingMusic = false;
    };

    scene.input.on("pointermove", onPointerMove);
    scene.input.on("pointerup", onPointerUp);

    this.on("destroy", () => {
      scene.input.off("pointermove", onPointerMove);
      scene.input.off("pointerup", onPointerUp);
    });

    this.add([
      backdrop,
      cardGfx,
      cardHitArea,
      headerContainer,
      sfxRowContainer,
      musicRowContainer,
      cornerCloseLedge,
      cornerCloseFace,
      cornerCloseIcon,
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
