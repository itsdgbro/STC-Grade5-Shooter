# Mobile & iOS Optimization Guide (Phaser 3 Games)

This guide documents the critical fixes for **iOS/iPhone card/question freezing**, **TTS WebKit quirks**, and **Mobile Screen Orientation (Portrait to Landscape prompt)** so they can be easily implemented across other games.

---

## 📑 Summary of Issues & Solutions

| Issue | Root Cause | Solution |
| :--- | :--- | :--- |
| **iPhone Freezing on Card #1 / Gameplay Flow** | iOS Safari WebKit drops `SpeechSynthesisUtterance.onend` callbacks or garbage-collects them mid-sentence. When gameplay progression waits for `ttsDone === true`, the state machine deadlocks. | 1. Decouple game progression from TTS (visual animations drive timing, voice is non-blocking).<br>2. Add an utterance retention `Set` and fallback safety timeouts to `TTSService.ts`. |
| **Screen Not Auto-Rotating on iPhone** | Apple strictly blocks the Web `screen.orientation.lock()` API on iOS Safari for security and UX policies. Android supports it. | 1. Add a responsive CSS/HTML "Please Rotate Your Device 🔄" overlay when portrait mode is detected on mobile/tablet.<br>2. Add touch-gesture `screen.orientation.lock('landscape')` for Android. |

---

## 🛠️ Step-by-Step Implementation

---

### Step 1: Decouple Game Progression from Voice/TTS Callbacks

**File:** `src/game/scenes/Game.ts` (or your main game scene / feature controller)

**Why:** Voice praise should never gate the state machine. If an audio/voice callback fails or is delayed on iOS, the player must still receive the next card/question seamlessly.

```diff
-   let ttsDone = false;
-   let animDone = false;
-
-   const tryFinishCorrect = () => {
-       if (ttsDone && animDone) {
-           this.session.finishCorrectFeedback();
-       }
-   };
-
-   TTSService.getInstance().speak(praise, {
-       onComplete: () => {
-           ttsDone = true;
-           tryFinishCorrect();
-       }
-   });

+   // Play voice praise concurrently as background audio (non-blocking)
+   TTSService.getInstance().speak(praise, { rate: 1.05, pitch: 1.15 });

    this.cardController.playCorrect(item.category, () => {
-       animDone = true;
-       tryFinishCorrect();
+       // Advance directly after visual animation finishes
+       this.time.delayedCall(120, () => {
+           this.session.finishCorrectFeedback();
+       });
    });
```

---

### Step 2: Harden `TTSService.ts` for iOS Safari WebKit

**File:** `src/game/services/TTSService.ts`

**Key Improvements:**
1. **Garbage Collection Retention:** Storing active `SpeechSynthesisUtterance` instances in a class `Set` prevents iOS Safari from deleting them mid-speech.
2. **Safety Fallback Timeout:** Guarantees that any callback expecting speech completion will fire even if WebKit drops the event.
3. **Multi-Gesture Unlock:** Adds `touchend` and `click` listeners to unlock speech synthesis on iOS.

```typescript
export class TTSService {
    private static instance: TTSService;
    private isSupported: boolean = false;
    private isEnabled: boolean = true;
    private selectedVoice: SpeechSynthesisVoice | null = null;
    private activeUtterance: SpeechSynthesisUtterance | null = null;
    private isPrimed: boolean = false;
    
    // Retain utterances in a Set to prevent iOS Safari GC from destroying them mid-speech
    private utteranceRetentionSet: Set<SpeechSynthesisUtterance> = new Set();

    private constructor() {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            this.isSupported = true;
            this.initVoices();
            this.setupUserGestureListener();
        }
    }

    public static getInstance(): TTSService {
        if (!TTSService.instance) {
            TTSService.instance = new TTSService();
        }
        return TTSService.instance;
    }

    private setupUserGestureListener() {
        if (typeof window === 'undefined') return;

        const unlockTTS = () => {
            if (this.isPrimed) return;
            this.isPrimed = true;
            try {
                if (window.speechSynthesis) {
                    window.speechSynthesis.resume();
                    const silentUtterance = new SpeechSynthesisUtterance('');
                    silentUtterance.volume = 0;
                    window.speechSynthesis.speak(silentUtterance);
                }
            } catch { }

            window.removeEventListener('pointerdown', unlockTTS);
            window.removeEventListener('keydown', unlockTTS);
            window.removeEventListener('touchstart', unlockTTS);
            window.removeEventListener('touchend', unlockTTS);
            window.removeEventListener('click', unlockTTS);
        };

        window.addEventListener('pointerdown', unlockTTS, { passive: true });
        window.addEventListener('keydown', unlockTTS, { passive: true });
        window.addEventListener('touchstart', unlockTTS, { passive: true });
        window.addEventListener('touchend', unlockTTS, { passive: true });
        window.addEventListener('click', unlockTTS, { passive: true });
    }

    public speak(
        text: string,
        options?: { voKey?: string; pitch?: number; rate?: number; onComplete?: () => void }
    ) {
        if (!this.isEnabled || !text || text.trim().length === 0) {
            options?.onComplete?.();
            return;
        }

        this.stop();

        try {
            if (AudioManager.getInstance().isSFXMuted()) {
                options?.onComplete?.();
                return;
            }
        } catch { }

        if (!this.isSupported) {
            options?.onComplete?.();
            return;
        }

        try {
            window.speechSynthesis.resume();

            if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
                window.speechSynthesis.cancel();
            }

            const utterance = new SpeechSynthesisUtterance(text);
            this.activeUtterance = utterance;
            this.utteranceRetentionSet.add(utterance); // Retain in set

            utterance.lang = 'en-US';
            if (this.selectedVoice) {
                utterance.voice = this.selectedVoice;
            }

            utterance.rate = options?.rate ?? 0.98;
            utterance.pitch = options?.pitch ?? 1.0;
            utterance.volume = 1.0;

            let hasCalledComplete = false;
            let fallbackTimer: ReturnType<typeof setTimeout> | null = null;

            const finish = () => {
                if (hasCalledComplete) return;
                hasCalledComplete = true;
                if (fallbackTimer) {
                    clearTimeout(fallbackTimer);
                    fallbackTimer = null;
                }
                this.utteranceRetentionSet.delete(utterance); // Release
                if (this.activeUtterance === utterance) {
                    this.activeUtterance = null;
                }
                options?.onComplete?.();
            };

            utterance.onend = finish;
            utterance.onerror = finish;

            // iOS WebKit safety timeout: guaranteed completion fallback
            const timeoutMs = Math.max(1000, Math.min(6000, text.length * 90 + 600));
            fallbackTimer = setTimeout(finish, timeoutMs);

            window.speechSynthesis.speak(utterance);
        } catch (err) {
            this.activeUtterance = null;
            options?.onComplete?.();
        }
    }

    public stop() {
        try { AudioManager.getInstance().stopVoice(); } catch { }
        if (this.isSupported) {
            try {
                window.speechSynthesis.cancel();
                this.activeUtterance = null;
                this.utteranceRetentionSet.clear();
            } catch { }
        }
    }
}
```

---

### Step 3: Add Viewport Meta & Orientation Prompt Overlay to `index.html`

**File:** `index.html`

```html
<!doctype html>
<html lang="en">

<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@600;700;800&family=Nunito:wght@700;800;900&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="/style.css">
    <title>Game Title</title>
</head>

<body>
    <div id="app">
        <div id="game-container"></div>
    </div>

    <!-- Mobile Portrait Orientation Prompt Overlay -->
    <div id="orientation-overlay" class="orientation-overlay">
        <div class="orientation-modal">
            <div class="phone-animation-container">
                <div class="phone-device">
                    <div class="phone-screen">
                        <div class="phone-dot"></div>
                    </div>
                </div>
                <div class="rotate-arrow-badge">🔄</div>
            </div>
            <h2 class="orientation-title">PLEASE ROTATE YOUR DEVICE</h2>
            <p class="orientation-subtitle">This game is best played in <strong>Landscape Mode</strong></p>
        </div>
    </div>

    <script type="module" src="src/main.ts"></script>
</body>

</html>
```

---

### Step 4: Add CSS Styles for Orientation Prompt & Mobile Touch

**File:** `public/style.css`

```css
body {
    margin: 0;
    padding: 0;
    font-family: 'Fredoka', 'Nunito', 'Arial Rounded MT Bold', sans-serif;
    color: rgba(255, 255, 255, 0.87);
    background-color: #0f0f0f;
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
    touch-action: manipulation;
    overflow: hidden;
}

#app {
    width: 100%;
    height: 100vh;
    overflow: hidden;
    display: flex;
    justify-content: center;
    align-items: center;
}

#game-container {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
}

/* ==========================================================================
   Mobile / Tablet Portrait Orientation Prompt Overlay
   ========================================================================== */
.orientation-overlay {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: radial-gradient(circle at center, rgba(15, 23, 42, 0.98), rgba(2, 6, 23, 0.99));
    z-index: 9999999;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    padding: 24px;
    box-sizing: border-box;
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
}

.orientation-modal {
    background: rgba(30, 41, 59, 0.9);
    border: 3px solid #38bdf8;
    border-radius: 28px;
    padding: 36px 28px;
    max-width: 360px;
    width: 88%;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6), 0 0 30px rgba(56, 189, 248, 0.25);
    display: flex;
    flex-direction: column;
    align-items: center;
}

.phone-animation-container {
    position: relative;
    width: 120px;
    height: 120px;
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 20px;
}

.phone-device {
    width: 52px;
    height: 88px;
    background: #0f172a;
    border: 3.5px solid #38bdf8;
    border-radius: 12px;
    display: flex;
    justify-content: center;
    align-items: center;
    box-shadow: 0 0 15px rgba(56, 189, 248, 0.4);
    animation: rotateDevice 2.2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}

.phone-screen {
    width: 38px;
    height: 68px;
    background: linear-gradient(135deg, #0284c7, #0369a1);
    border-radius: 6px;
    position: relative;
}

.phone-dot {
    position: absolute;
    bottom: -8px;
    left: 50%;
    transform: translateX(-50%);
    width: 4px;
    height: 4px;
    background: #38bdf8;
    border-radius: 50%;
}

.rotate-arrow-badge {
    position: absolute;
    font-size: 26px;
    bottom: 2px;
    right: 6px;
    animation: spinArrow 2.2s linear infinite;
}

.orientation-title {
    font-family: 'Fredoka', 'Nunito', sans-serif;
    font-size: 22px;
    font-weight: 800;
    color: #fde047;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.6);
    margin: 0 0 10px 0;
    letter-spacing: 0.5px;
}

.orientation-subtitle {
    font-family: 'Nunito', sans-serif;
    font-size: 15px;
    font-weight: 700;
    color: #e2e8f0;
    margin: 0;
    line-height: 1.45;
}

.orientation-subtitle strong {
    color: #38bdf8;
}

@keyframes rotateDevice {
    0%, 15% { transform: rotate(0deg); }
    45%, 80% { transform: rotate(90deg); }
    100% { transform: rotate(0deg); }
}

@keyframes spinArrow {
    0%, 15% { transform: rotate(0deg) scale(1); }
    45%, 80% { transform: rotate(-180deg) scale(1.15); }
    100% { transform: rotate(-360deg) scale(1); }
}

/* Display overlay whenever device is in Portrait AND mobile/tablet size */
@media screen and (orientation: portrait) and (max-width: 1024px) {
    .orientation-overlay {
        display: flex;
    }
}
```

---

### Step 5: Add Orientation Lock Listener to `src/main.ts`

**File:** `src/main.ts`

```typescript
import StartGame from './game/main';

document.addEventListener('DOMContentLoaded', () => {
    StartGame('game-container');

    // Attempt orientation lock for supporting platforms (Android Chrome)
    const tryLockLandscape = () => {
        try {
            if (screen.orientation && 'lock' in screen.orientation) {
                (screen.orientation as any).lock('landscape').catch(() => { });
            }
        } catch { }
    };

    window.addEventListener('pointerdown', tryLockLandscape, { once: true });
    window.addEventListener('touchstart', tryLockLandscape, { once: true });
});
```

---

## 🎯 Verification Checklist

- [ ] Open game on iPhone Safari: swipe/answer cards rapidly and confirm cards continuously advance without getting stuck.
- [ ] Hold iPhone in portrait: confirm the rotating prompt overlay appears.
- [ ] Rotate iPhone to landscape: confirm the prompt disappears and the game canvas scales cleanly.
- [ ] Open game on Android: confirm sound, landscape, and touch responsiveness work seamlessly.
