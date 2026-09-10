# UI Layout, Standard Positions & Depth Standards

This reference documents dynamic toolbar positioning, screen anchors, the `UILayers` depth hierarchy, and component rules.

---

## 🎯 Dynamic Top-Left Toolbar Slots (`UIPositions.ts`)

Top-left navigation and tool buttons (**Back**, **Settings**, **Pause**, **Sound Toggle**, etc.) must dynamically arrange based on the **number of buttons present** in the scene:

- **Start Position**: `(100, 100)`
- **Horizontal Spacing**: `120px` between button centers.

```typescript
import { UIPositions } from '../utils/UIPositions';

// Calculate position based on button order/slot index (0-indexed):
const posSlot0 = UIPositions.getTopLeftButtonPos(0); // -> (100, 100)
const posSlot1 = UIPositions.getTopLeftButtonPos(1); // -> (220, 100)
const posSlot2 = UIPositions.getTopLeftButtonPos(2); // -> (340, 100)
```

---

## 📍 Standard Scene Button Mapping

| Scene | Button Count | Slot 0 `(100, 100)` | Slot 1 `(220, 100)` | Slot 2 `(340, 100)` |
| :--- | :--- | :--- | :--- | :--- |
| **MainMenu** | 1 Button | **Settings Button** | *(None)* | *(None)* |
| **LevelSelection** | 2 Buttons | **Back Button** | **Settings Button** | *(None)* |
| **UIScene / Game** | 2 Buttons | **Pause Button** | **Settings Button** | *(None)* |
| **Custom 3-Button Screen** | 3 Buttons | Primary Action / Back | Secondary Action / Settings | Info / Help Button |

---

## 📐 Screen Anchor Coordinates (1920x1080)

| UI Element | Anchor Constant | Coordinates `(X, Y)` | Description / Usage |
| :--- | :--- | :--- | :--- |
| **Center Modal** | `UIPositions.SCREEN_CENTER` | `(960, 540)` | Anchor for Modals, Popups, Pause/Settings Dialogs |
| **Top HUD Center** | `UIPositions.TOP_HUD_CENTER` | `(960, 100)` | Level title, Score counter, or Timer bar |
| **Bottom Action** | `UIPositions.BOTTOM_ACTION_CENTER` | `(960, 950)` | Play button, Start button, or Action tray |

---

## 📐 Implementation Pattern in Scenes

```typescript
import { UIPositions } from '../utils/UIPositions';
import { UILayers } from '../utils/UILayers';
import { IconButton } from '../ui/IconButton';

// Example: Scene with 1 button (e.g. MainMenu)
const pos = UIPositions.getTopLeftButtonPos(0); // (100, 100)
const settingsBtn = new IconButton(this, pos.x, pos.y, 'settings_icon', () => {
    new SettingsPanel(this, () => {});
}).setDepth(UILayers.UI_BUTTONS);

// Example: Scene with 2 buttons (e.g. LevelSelection)
const backPos = UIPositions.getTopLeftButtonPos(0);     // (100, 100)
const settingsPos = UIPositions.getTopLeftButtonPos(1); // (220, 100)

const backBtn = new IconButton(this, backPos.x, backPos.y, 'back_icon', () => {
    this.scene.start('MainMenu');
}).setDepth(UILayers.UI_BUTTONS);

const settingsBtn2 = new IconButton(this, settingsPos.x, settingsPos.y, 'settings_icon', () => {
    new SettingsPanel(this, () => {});
}).setDepth(UILayers.UI_BUTTONS);
```

---

## 🧱 UI Layer Depth Hierarchy (`UILayers.ts`)

Every visual object in the game MUST adhere to `UILayers` constants:

| Layer Tier | Range | Layer Constants (`UILayers.*`) | Target Elements |
| :--- | :--- | :--- | :--- |
| **Layer 0: Game** | `0 - 20` | `GAME_BACKGROUND` (0)<br>`GAME_WALLS` (1)<br>`GAME_OBSTACLES` (2)<br>`GAME_RINGS` (3)<br>`GAME_PLAYER` (10)<br>`GAME_EFFECTS` (20) | Gameplay world sprites, terrain, entities, VFX |
| **Layer 1: Non-Blocking UI** | `100 - 130` | `UI_BACKGROUND_PANELS` (100)<br>`UI_TEXT` (110)<br>`UI_BUTTONS` (120)<br>`UI_ICONS` (130) | HUD buttons, score text, health bars, minimap |
| **Layer 2: Full Overlays** | `900 - 1030` | `OVERLAY_BLOCKER` (900)<br>`OVERLAY_BACKGROUND` (1000)<br>`OVERLAY_PANEL` (1010)<br>`OVERLAY_TEXT` (1020)<br>`OVERLAY_BUTTONS` (1030) | Tutorial popups, hint dialogues, interactive blockers |
| **Layer 3: Top Modals** | `10000+` | `MODAL_BACKGROUND` (10000)<br>`MODAL_PANEL` (10010)<br>`MODAL_TEXT` (10020)<br>`MODAL_BUTTONS` (10030)<br>`MODAL_CONTROLS` (10040) | Pause Menu, Settings Panel, Game Over / Win Screens |

---

## 📋 Scene & Component Layer Mapping

| Component / Scene | Target Layer | Constants Used |
| :--- | :--- | :--- |
| **`UIScene.ts`** | Layer 1 (HUD) | `UI_BUTTONS`, `UI_TEXT` |
| **`PausePanel.ts`** | Layer 3 (Modals) | `MODAL_BACKGROUND`, `MODAL_PANEL`, `MODAL_BUTTONS` |
| **`SettingsPanel.ts`** | Layer 3 (Modals) | `MODAL_BACKGROUND`, `MODAL_PANEL`, `MODAL_CONTROLS` |
| **`GameOverPanel.ts`** | Layer 3 (Modals) | `MODAL_BACKGROUND`, `MODAL_PANEL`, `MODAL_BUTTONS` |
| **`MainMenu.ts`** | Layer 0 & 1 | `GAME_BACKGROUND`, `UI_TEXT`, `UI_BUTTONS` |
| **`LevelSelection.ts`** | Layer 0 & 1 | `GAME_BACKGROUND`, `UI_BACKGROUND_PANELS`, `UI_BUTTONS` |

---

## 🔧 Depth Usage Examples

```typescript
import { UILayers } from '../utils/UILayers';

// Layer 0: Game entity
sprite.setDepth(UILayers.GAME_PLAYER);

// Layer 1: UI button
button.setDepth(UILayers.UI_BUTTONS);

// Layer 2: Tutorial overlay
overlay.setDepth(UILayers.OVERLAY_BACKGROUND);

// Layer 3: Modal panel
panel.setDepth(UILayers.MODAL_PANEL);
```

---

## 🔘 Reusable UI Components Pattern

Always use reusable components from `src/game/ui/`:

- **`IconButton`**: Standard circular icon buttons (`back_icon`, `pause_icon`, `settings_icon`). Always leave origin as default center `(0.5, 0.5)` to ensure consistent positioning across scenes.
- **`SpriteButton` / `SpriteTextButton`**: Skinned themed buttons with interactive scaling.
- **`Slider`**: Volume or sensitivity adjustment sliders.
- **`SettingsPanel`**: Standard modal for sound/music/gameplay settings.
- **`PausePanel` & `GameOverPanel`**: Standardized dialogs with replay, menu, and resume buttons.
