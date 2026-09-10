# AI Edit Permissions & Hard Guardrails

This document sets the **strict editing boundaries** for any AI agent interacting with this codebase.

---

## 🚫 Protected Files & Directories (STRICT NO-EDIT / REQUIRE EXPLICIT APPROVAL)

The following files and components are **Protected Core Infrastructure**. The AI **MUST NOT** edit, refactor, or delete these without presenting a warning and requesting explicit user approval first:

1. **Global Configuration & Core Setup**:
   - `src/game/main.ts` (Phaser configuration, canvas sizing, scale manager)
   - `src/game/utils/Constants.ts` (API configuration, endpoints, testing flags)
   - `package.json` / `package-lock.json` / `tsconfig.json` / `vite.config.ts`

2. **Core Reusable UI Components**:
   - `src/game/ui/IconButton.ts`
   - `src/game/ui/Button.ts` / `src/game/ui/SpriteButton.ts`
   - `src/game/ui/SettingsPanel.ts`
   - `src/game/ui/PausePanel.ts`
   - `src/game/ui/Slider.ts`

3. **Core Singletons & Utilities**:
   - `src/game/services/AudioManager.ts`
   - `src/game/services/GameDataManager.ts`
   - `src/game/utils/UILayers.ts`
   - `src/game/utils/UIPositions.ts`
   - `src/game/utils/Theme.ts`

4. **Lifecycle Loading & Menus**:
   - `src/game/scenes/Boot.ts`
   - `src/game/scenes/Preloader.ts`
   - `src/game/scenes/MainMenu.ts`
   - `src/game/scenes/LevelSelection.ts`

---

## 🟢 Permitted AI Edit Scope (Safe for Routine Edits & Feature Development)

The AI is free to create, modify, and optimize code within these areas during normal task requests:

- **Game Features**: `src/game/features/*` (Game mechanics, target spawners, gameplay logic, minigames)
- **Active Gameplay Scene**: `src/game/scenes/Game.ts` (Gameplay hooks, event listeners, feature initialization)
- **Overlay HUD**: `src/game/scenes/UIScene.ts` (Game HUD counters, score triggers, in-game notifications)
- **New Feature UI / Panels**: Any new custom panels or feature-specific UI classes created inside `src/game/ui/`
- **Rule & Documentation Updates**: `.agents/skills/project-rules/*`

---

## ⚠️ Warning & Confirmation Protocol

If a user request or bug fix necessitates changes to any **Protected File**:
1. **Stop immediately before writing code**.
2. **Issue an explicit warning** clearly stating:
   - Which protected file needs modification.
   - Why the change is necessary.
   - What potential side-effects or risks are involved.
3. **Ask for confirmation** or present the exact planned diff before applying the edit.
