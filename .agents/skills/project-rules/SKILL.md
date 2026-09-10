---
name: project-rules
description: Project architecture, scene lifecycles, flow, UI positioning, depth layers, transitions, settings, and coding standards for this Phaser JS project.
---

# Phaser Game Project Rules & Architecture

This skill defines the development patterns, scene organization, UI layers, coordinates, and transitions for this Phaser project.

## 📁 Directory Structure & Architecture Overview

```text
/
├── public/
│   └── assets/             # Global and game-specific assets
│       ├── audio/          # UI SFX and BGM (royalty-free mp3/wav)
│       ├── globalUI/       # Standard buttons, panels, and icons
│       ├── loading/        # Splash screen assets
│       └── [GameSpecific]/ # Feature assets (cleared on new game)
├── src/
│   ├── game/
│   │   ├── components/     # Reusable game-world UI/graphics components
│   │   ├── entities/       # Physics objects, players, and NPCs
│   │   ├── features/       # CORE GAMEPLAY LOGIC (Feature-based controllers)
│   │   ├── scenes/         # Phaser Scene definitions (Boot, Preloader, MainMenu, etc.)
│   │   ├── services/       # Singleton managers (AudioManager, GameDataManager, API)
│   │   ├── ui/             # Screen-space UI components (IconButton, Panels, Sliders)
│   │   ├── utils/          # Constants, Math, UILayers, UIPositions, Theme
│   │   └── main.ts         # Phaser Config and Scene registration
│   └── main.ts             # Entry point
```

- **Engine & Resolution**: Phaser 3 (TypeScript), `1920x1080` Canvas (`Phaser.Scale.FIT`, `CENTER_BOTH`).
- **Feature-Based Gameplay**: Keep `Game.ts` clean; implement gameplay mechanics inside `src/game/features/`.
- **Global Services**: Singletons for audio, data persistence, and API in `src/game/services/`.
- **UI Components**: Screen-space components in `src/game/ui/`, using `UILayers` constants for depths.
- **Audio Standards**: Royalty-free audio only (`.mp3` for BGM, `.wav`/short `.mp3` for SFX).

---

## 🧹 Cleanup Checklist for New Games

When starting a new game within this repository:
1. [ ] **`src/game/features/`**: Clear previous game feature logic.
2. [ ] **`src/game/ui/`**: Remove game-specific overlays (keep standard `IconButton`, `SettingsPanel`, `PausePanel`, `GameOverPanel`).
3. [ ] **`src/game/scenes/Game.ts`**: Reset to skeleton structure with clean feature initialization.
4. [ ] **`src/game/scenes/Preloader.ts`**: Delete game-specific `load` calls.
5. [ ] **`public/assets/`**: Delete asset folders from previous game.
6. [ ] **`src/game/utils/`**: Delete game-specific generator/math files.

## 📚 Detailed Reference Documentation

Refer to these targeted documents when working on specific areas:

1. **Scenes & Lifecycle**: [scenes-and-flow.md](file:///d:/CV-Phaser/CV-Phaser-Project-Skeleton/.agents/skills/project-rules/references/scenes-and-flow.md)
   - Scene registry (`Boot`, `Preloader`, `MainMenu`, `LevelSelection`, `Game`, `UIScene`, `GlobalUI`).
   - Flow state diagram, switching conventions, and parallel scene launching.

2. **UI Layout & Depths**: [ui-layout.md](file:///d:/CV-Phaser/CV-Phaser-Project-Skeleton/.agents/skills/project-rules/references/ui-layout.md)
   - `1920x1080` coordinate layout table (HUD, Modals, Action Bars).
   - Strict `UILayers` depth hierarchy (Layer 0: Game, Layer 1: HUD, Layer 2: Overlays, Layer 3: Modals).
   - Reusable UI component conventions.

3. **Transitions & Animations**: [transitions-and-animations.md](file:///d:/CV-Phaser/CV-Phaser-Project-Skeleton/.agents/skills/project-rules/references/transitions-and-animations.md)
   - Camera fade-in/fade-out transitions.
   - Modal pop-in/pop-out tweens and easings.
   - Interactive button hover/press micro-animations.

4. **Settings & Persistence**: [settings-and-config.md](file:///d:/CV-Phaser/CV-Phaser-Project-Skeleton/.agents/skills/project-rules/references/settings-and-config.md)
   - Engine configuration (`main.ts`).
   - `AudioManager` audio channels and volume control.
   - `GameDataManager` local storage schema.
   - `Theme.ts` color & typography system.

5. **AI Edit Guardrails & Protected Scope**: [edit-guardrails.md](file:///d:/CV-Phaser/CV-Phaser-Project-Skeleton/.agents/skills/project-rules/references/edit-guardrails.md)
   - Protected Core Infrastructure (Global configs, Singletons, Core UI, Boot/Preloader/MainMenu).
   - Warning and user approval requirements before modifying protected files.
   - Permitted feature scope (`src/game/features/*`, `Game.ts`, `UIScene.ts`).

6. **Mobile & iOS Optimization Guide**: [mobile-and-ios-fixes.md](file:///d:/CV-Phaser/CV-Phaser-Project-Skeleton/.agents/skills/project-rules/references/mobile-and-ios-fixes.md)
   - Non-blocking audio/TTS decoupling (never gate gameplay state machines on speech callbacks).
   - `TTSService` WebKit garbage collection retention set & safety timeouts.
   - Mobile screen orientation handling (portrait rotation prompt overlay & Android lock).

---

## ⚡ Core Rules Checklist

- [ ] **Strict Edit Guardrails**: Never edit protected core files (`main.ts`, singletons, shared UI, configs) without warning the user and getting approval.
- [ ] **Decouple TTS & Audio Progression**: Never wait for voice/TTS callbacks to advance game cards/states; use visual animation durations as the timing source with speech playing concurrently.
- [ ] **Mobile & iOS Orientation Ready**: Ensure viewport meta tags, rotate-device overlay in `index.html`/`style.css`, and touch gesture orientation locks are in place.
- [ ] **No Hardcoded Hex Colors**: Use `Theme.COLORS.*`.
- [ ] **No Hardcoded Depths**: Use `UILayers.*` constants.
- [ ] **No Giant Files**: Files over 400 lines must be split into components or feature controllers.
- [ ] **Clean Asset Cleanup**: Game-specific assets must be isolated in feature folders or cleaned up when starting a new game.
