import * as Phaser from "phaser";
import { TextureGenerator } from "../utils/TextureGenerator";
import { loadGameLevels } from "../../utils/dataLoader";
import { adaptiveEngine } from "../../utils/adaptiveEngine";
import { flutterBridge } from "../../utils/flutterBridge";

export class PreloaderScene extends Phaser.Scene {
  private errorContainer: Phaser.GameObjects.Container | null = null;

  constructor() {
    super({ key: "PreloaderScene" });
  }

  preload() {
    // Load exact SVGs matching the original React app 100%
    this.load.svg("main_menu_bg", "assets/main_menu_bg.svg", {
      width: 1920,
      height: 1080,
    });
    this.load.svg("game_bg", "assets/game_bg.svg", {
      width: 1920,
      height: 1080,
    });
    this.load.svg("cannon_barrel", "assets/cannon_barrel.svg", {
      width: 80,
      height: 130,
    });
    this.load.svg("cannon_carriage", "assets/cannon_carriage.svg", {
      width: 180,
      height: 62,
    });
  }

  create() {
    // 1. Programmatically generate all 1080p game textures (balls, hearts, buttons, etc.)
    TextureGenerator.generateAllTextures(this);

    // 2. Fetch and initialize the curriculum dataset
    this.loadGameData();
  }

  private async loadGameData() {
    // Display loading text
    const loadingText = this.add
      .text(960, 540, "Loading Questions...", {
        fontFamily: "'Fredoka', 'Mukta', sans-serif",
        fontSize: "42px",
        color: "#bae6fd",
      })
      .setOrigin(0.5);

    try {
      const levels = await loadGameLevels();
      const firstLevel = (levels && levels.length > 0 ? levels[0] : null) as any;
      const rawQuestions =
        Array.isArray(levels) && !firstLevel?.questions
          ? levels
          : Array.isArray(firstLevel?.questions)
            ? firstLevel.questions
            : [];

      if (rawQuestions.length === 0) {
        throw new Error("Failed to fetch json file.");
      }

      let title = "CANNON BALL";
      let subtitle = "GRADE 5 MATH CHALLENGE";
      if (firstLevel && typeof firstLevel === "object") {
        if ("title" in firstLevel && typeof firstLevel.title === "string") {
          title = firstLevel.title;
        }
        if ("subtitle" in firstLevel && typeof firstLevel.subtitle === "string") {
          subtitle = firstLevel.subtitle;
        }
      }

      const targetFile = firstLevel?.sourceFileName || "data.json";
      adaptiveEngine.setQuestions(rawQuestions, targetFile);

      // Save metadata in registry for scenes
      this.registry.set("gameTitle", title);
      this.registry.set("gameSubtitle", subtitle);

      // Initialize Flutter Bridge
      flutterBridge.init({
        gameId: "stc_grade5_shooter",
        gameTitle: title,
      });

      loadingText.destroy();

      // Proceed to Main Menu
      this.scene.start("MainMenuScene");
    } catch {
      loadingText.destroy();
      this.showErrorScreen();
    }
  }

  private showErrorScreen() {
    if (this.errorContainer) {
      this.errorContainer.destroy();
    }

    this.errorContainer = this.add.container(960, 540);

    const bg = this.add.rectangle(0, 0, 1920, 1080, 0x0f172a);

    const warnIcon = this.add
      .text(0, -120, "⚠️", { fontSize: "80px" })
      .setOrigin(0.5);

    const title = this.add
      .text(0, -20, "Failed to fetch json file.", {
        fontFamily: "'Fredoka', 'Mukta', sans-serif",
        fontSize: "48px",
        color: "#fca5a5",
      })
      .setOrigin(0.5);

    const desc = this.add
      .text(
        0,
        50,
        "Could not load level questions. Please check your data source.",
        {
          fontFamily: "'Mukta', sans-serif",
          fontSize: "28px",
          color: "#cbd5e1",
        },
      )
      .setOrigin(0.5);

    // 3D Retry Button
    const retryBtn = this.add
      .image(0, 150, "btn_blue")
      .setInteractive({ useHandCursor: true });
    const retryLabel = this.add
      .text(0, 146, "RETRY", {
        fontFamily: "'Fredoka', 'Mukta', sans-serif",
        fontSize: "32px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    retryBtn.on("pointerdown", () => {
      this.loadGameData();
    });

    this.errorContainer.add([bg, warnIcon, title, desc, retryBtn, retryLabel]);
  }
}
