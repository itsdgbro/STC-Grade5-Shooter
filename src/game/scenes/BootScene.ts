import * as Phaser from "phaser";

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: "BootScene" });
  }

  preload() {
    // Fonts are preloaded in index.html, but we can verify readiness
  }

  async create() {
    // Ensure all web fonts (Mukta, Fredoka, Nunito) are decoded before any canvas text draws
    try {
      if (document.fonts) {
        await document.fonts.ready;
      }
    } catch {
      // Safe fallback if font API not supported
    }

    this.scene.start("PreloaderScene");
  }
}
