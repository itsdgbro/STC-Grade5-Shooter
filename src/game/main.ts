import * as Phaser from "phaser";
import { BootScene } from "./scenes/BootScene";
import { PreloaderScene } from "./scenes/PreloaderScene";
import { MainMenuScene } from "./scenes/MainMenuScene";
import { GameScene } from "./scenes/GameScene";
import { UIScene } from "./scenes/UIScene";

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1920,
  height: 1080,
  parent: "game-container",
  backgroundColor: "#000000",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  input: {
    activePointers: 2,
  },
  scene: [BootScene, PreloaderScene, MainMenuScene, GameScene, UIScene],
};

export function startGame() {
  return new Phaser.Game(gameConfig);
}
