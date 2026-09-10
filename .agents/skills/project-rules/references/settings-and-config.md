# Settings, Audio & Global Configuration Standards

This reference documents global game settings, configuration management, audio controls, and local storage data persistence.

---

## ⚙️ Game Engine Configuration (`src/game/main.ts`)

| Setting | Value | Rationale |
| :--- | :--- | :--- |
| **Renderer** | `Phaser.AUTO` | Optimal WebGL / Canvas fallback |
| **Resolution** | `1920 x 1080` | Full HD standard canvas size |
| **Scale Mode** | `Phaser.Scale.FIT` (`3`) | Preserves aspect ratio on any screen/device |
| **Auto Center** | `Phaser.Scale.CENTER_BOTH` (`1`) | Centers game viewport horizontally & vertically |
| **Physics** | `Arcade` | Lightweight 2D collision engine (default gravity: 0) |
| **Parent Container** | `'game-container'` | Bound to `#game-container` in `index.html` |

---

## 🔊 Audio Management (`AudioManager.ts`)

All audio playback is managed through `AudioManager` singleton to maintain central volume levels and mute states.

### Standard Audio Keys & Formats
- **BGM**: `.mp3` format (streamed / looped)
- **SFX**: `.mp3` / `.wav` format (short sound effects)

### API Methods
```typescript
import { AudioManager } from '../services/AudioManager';

// Play Background Music (with fade & loop)
AudioManager.getInstance().playBGM('main-bgm', { loop: true, volume: 0.7 });

// Play Sound Effect
AudioManager.getInstance().playSFX('button-click');

// Update Volumes
AudioManager.getInstance().setMusicVolume(0.5);
AudioManager.getInstance().setSFXVolume(0.8);
```

---

## 💾 Data Persistence & Storage (`GameDataManager.ts`)

Progress, high scores, and settings are cached and saved to `localStorage`.

### Data Schema
```typescript
interface GameSaveData {
    settings: {
        musicVolume: number;      // 0.0 to 1.0
        sfxVolume: number;        // 0.0 to 1.0
        musicMuted: boolean;
        sfxMuted: boolean;
    };
    progress: {
        unlockedLevel: number;    // Highest level reached
        starsPerLevel: Record<number, number>; // Level ID -> Stars (1-3)
        highScores: Record<number, number>;    // Level ID -> Score
    };
}
```

### Access Pattern
```typescript
import { GameDataManager } from '../services/GameDataManager';

const dataManager = GameDataManager.getInstance();

// Read unlocked levels
const maxLevel = dataManager.getUnlockedLevel();

// Save level completion
dataManager.completeLevel(levelId, stars, score);
```

---

## 🎨 Design Theme & Colors (`Theme.ts`)

Always reference `Theme` constants instead of hardcoded hex values:

```typescript
import { Theme } from '../utils/Theme';

// Example:
const textStyle = {
    fontFamily: Theme.FONTS.PRIMARY,
    fontSize: '28px',
    color: Theme.COLORS.TEXT_PRIMARY
};
```
