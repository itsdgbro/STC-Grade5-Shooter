# Transitions, Animations & FX Standards

This reference documents screen transitions, UI tweening conventions, particle FX, and interaction feedback patterns.

---

## 🎬 Scene Transitions

### Standard Fade In / Fade Out
For standard scene transitions, use camera fades to ensure smooth visual flow:

```typescript
// Fade Out and Change Scene
this.cameras.main.fadeOut(300, 0, 0, 0);
this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
    this.scene.start('Game', { levelId: 1 });
});

// Fade In on Scene Enter (Inside create())
this.cameras.main.fadeIn(300, 0, 0, 0);
```

---

## 💫 Modal Transitions (Pop In / Pop Out)

Modals (Settings, Pause, Game Over) should animate in with an elastic or back ease for a lively, polished feel.

### Modal Enter Animation (Pop In)
```typescript
// Initial state
modalContainer.setScale(0.7);
modalContainer.setAlpha(0);

// Tween
scene.tweens.add({
    targets: modalContainer,
    scale: 1,
    alpha: 1,
    duration: 350,
    ease: 'Back.easeOut'
});
```

### Modal Exit Animation (Pop Out)
```typescript
scene.tweens.add({
    targets: modalContainer,
    scale: 0.8,
    alpha: 0,
    duration: 250,
    ease: 'Back.easeIn',
    onComplete: () => {
        modalContainer.destroy();
    }
});
```

---

## 🔘 Button Interaction Tweens

All interactive buttons should have subtle micro-animations for hover, click, and release:

```typescript
// Hover In
button.on('pointerover', () => {
    this.scene.tweens.add({
        targets: button,
        scale: 1.05,
        duration: 100,
        ease: 'Quad.easeOut'
    });
});

// Hover Out
button.on('pointerout', () => {
    this.scene.tweens.add({
        targets: button,
        scale: 1.0,
        duration: 100,
        ease: 'Quad.easeOut'
    });
});

// Click / Press
button.on('pointerdown', () => {
    this.scene.tweens.add({
        targets: button,
        scale: 0.95,
        duration: 80,
        yoyo: true,
        ease: 'Quad.easeInOut'
    });
});
```

---

## ⏱️ Standard Duration & Easing Guidelines

| Type | Duration | Recommended Ease | Purpose |
| :--- | :--- | :--- | :--- |
| **Scene Fade** | `300ms - 500ms` | `Linear` or `Quad.easeInOut` | Screen transitions |
| **Modal Open** | `300ms - 400ms` | `Back.easeOut` | Dialog appearance |
| **Modal Close** | `200ms - 300ms` | `Back.easeIn` | Dialog dismissal |
| **Button Hover** | `100ms` | `Quad.easeOut` | Tactile responsiveness |
| **Score / Badge Pop** | `400ms - 600ms` | `Bounce.easeOut` or `Back.easeOut` | Reward / celebration |
| **Toast Slide In** | `300ms` | `Cubic.easeOut` | Non-blocking alerts |
