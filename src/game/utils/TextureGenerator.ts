import * as Phaser from "phaser";

export class TextureGenerator {
  /**
   * Generates all programmatic textures for the game to ensure crisp 1080p resolution.
   */
  static generateAllTextures(scene: Phaser.Scene) {
    this.createBackgroundTexture(scene);
    this.createCloudTexture(scene);
    this.createCannonTextures(scene);
    this.createBulletTexture(scene);
    this.createMuzzleFlashTexture(scene);
    this.createBallTextures(scene);
    this.createHeartTextures(scene);
    this.createStarTexture(scene);
    this.createIconTextures(scene);
    this.createButtonTextures(scene);
  }

  // 1. RICH CARTOON ADVENTURE BACKGROUND (1920x1080)
  private static createBackgroundTexture(scene: Phaser.Scene) {
    if (scene.textures.exists("game_background")) return;

    const canvas = scene.textures.createCanvas("game_background", 1920, 1080);
    if (!canvas) return;
    const ctx = canvas.getContext();

    // Sky Gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 1080);
    skyGrad.addColorStop(0, "#38bdf8");
    skyGrad.addColorStop(0.45, "#7dd3fc");
    skyGrad.addColorStop(0.75, "#bae6fd");
    skyGrad.addColorStop(1, "#e0f2fe");
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, 1920, 1080);

    // Warm Glowing Sun (Centered-ish at X: 960, Y: 180)
    const sunGrad = ctx.createRadialGradient(960, 180, 0, 960, 180, 240);
    sunGrad.addColorStop(0, "rgba(254, 240, 138, 0.9)");
    sunGrad.addColorStop(0.4, "rgba(253, 224, 71, 0.5)");
    sunGrad.addColorStop(0.8, "rgba(250, 204, 21, 0.2)");
    sunGrad.addColorStop(1, "rgba(250, 204, 21, 0)");
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(960, 180, 240, 0, Math.PI * 2);
    ctx.fill();

    // Distant Rolling Mountains (Soft Blue-Green)
    const distGrad = ctx.createLinearGradient(0, 500, 0, 900);
    distGrad.addColorStop(0, "#93c5fd");
    distGrad.addColorStop(0.5, "#86efac");
    distGrad.addColorStop(1, "#4ade80");
    ctx.fillStyle = distGrad;
    ctx.beginPath();
    ctx.moveTo(0, 720);
    ctx.bezierCurveTo(320, 580, 640, 620, 960, 660);
    ctx.bezierCurveTo(1280, 700, 1600, 580, 1920, 640);
    ctx.lineTo(1920, 1080);
    ctx.lineTo(0, 1080);
    ctx.closePath();
    ctx.fill();

    // Middle Rolling Meadows
    const midGrad = ctx.createLinearGradient(0, 650, 0, 1050);
    midGrad.addColorStop(0, "#4ade80");
    midGrad.addColorStop(0.5, "#22c55e");
    midGrad.addColorStop(1, "#16a34a");
    ctx.fillStyle = midGrad;
    ctx.beginPath();
    ctx.moveTo(0, 800);
    ctx.bezierCurveTo(450, 700, 800, 780, 1200, 720);
    ctx.bezierCurveTo(1550, 670, 1750, 760, 1920, 740);
    ctx.lineTo(1920, 1080);
    ctx.lineTo(0, 1080);
    ctx.closePath();
    ctx.fill();

    // Foreground Lush Grass Hill (Bottom Mount for Cannon)
    const foreGrad = ctx.createLinearGradient(0, 820, 0, 1080);
    foreGrad.addColorStop(0, "#22c55e");
    foreGrad.addColorStop(0.4, "#16a34a");
    foreGrad.addColorStop(1, "#15803d");
    ctx.fillStyle = foreGrad;
    ctx.beginPath();
    ctx.moveTo(0, 930);
    ctx.bezierCurveTo(500, 860, 850, 840, 960, 840);
    ctx.bezierCurveTo(1070, 840, 1420, 860, 1920, 930);
    ctx.lineTo(1920, 1080);
    ctx.lineTo(0, 1080);
    ctx.closePath();
    ctx.fill();

    // Grass edge highlight line
    ctx.strokeStyle = "rgba(134, 239, 172, 0.6)";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(0, 930);
    ctx.bezierCurveTo(500, 860, 850, 840, 960, 840);
    ctx.bezierCurveTo(1070, 840, 1420, 860, 1920, 930);
    ctx.stroke();

    canvas.refresh();
  }

  // 2. SOFT DRIFTING CLOUDS
  private static createCloudTexture(scene: Phaser.Scene) {
    if (scene.textures.exists("cloud")) return;
    const canvas = scene.textures.createCanvas("cloud", 240, 100);
    if (!canvas) return;
    const ctx = canvas.getContext();

    ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
    ctx.beginPath();
    ctx.arc(60, 60, 36, 0, Math.PI * 2);
    ctx.arc(110, 44, 44, 0, Math.PI * 2);
    ctx.arc(160, 50, 38, 0, Math.PI * 2);
    ctx.arc(195, 62, 28, 0, Math.PI * 2);
    ctx.fill();

    canvas.refresh();
  }

  // 3. CANNON BARREL AND BASE
  private static createCannonTextures(scene: Phaser.Scene) {
    // Cannon Barrel Texture
    // Authoring canvas: 160 x 240. Pivot sits at (80, 206).
    if (!scene.textures.exists("cannon_barrel")) {
      const canvas = scene.textures.createCanvas("cannon_barrel", 160, 240);
      if (canvas) {
        const ctx = canvas.getContext();
        const pivotX = 80;
        const pivotY = 206;

        // Shadow
        ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
        ctx.shadowBlur = 12;
        ctx.shadowOffsetY = 6;

        // Metallic Barrel Gradient
        const metalGrad = ctx.createLinearGradient(pivotX - 40, 0, pivotX + 40, 0);
        metalGrad.addColorStop(0, "#475569");
        metalGrad.addColorStop(0.25, "#94a3b8");
        metalGrad.addColorStop(0.65, "#334155");
        metalGrad.addColorStop(1, "#1e293b");

        // Brass Gold Gradient
        const goldGrad = ctx.createLinearGradient(pivotX - 35, 0, pivotX + 35, 0);
        goldGrad.addColorStop(0, "#fde047");
        goldGrad.addColorStop(0.5, "#f59e0b");
        goldGrad.addColorStop(1, "#b45309");

        // Rear Breech Bulb (Circle centered around pivot)
        ctx.fillStyle = metalGrad;
        ctx.strokeStyle = "#0f172a";
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(pivotX, pivotY - 8, 38, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Main Tapered Barrel
        ctx.beginPath();
        ctx.moveTo(pivotX - 30, pivotY - 8);
        ctx.lineTo(pivotX - 22, pivotY - 150);
        ctx.lineTo(pivotX + 22, pivotY - 150);
        ctx.lineTo(pivotX + 30, pivotY - 8);
        ctx.closePath();
        ctx.fillStyle = metalGrad;
        ctx.fill();
        ctx.stroke();

        // Brass Gold Accent Ring 1
        ctx.fillStyle = goldGrad;
        ctx.strokeStyle = "#78350f";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.roundRect(pivotX - 25, pivotY - 60, 50, 14, 4);
        ctx.fill();
        ctx.stroke();

        // Brass Gold Accent Ring 2
        ctx.beginPath();
        ctx.roundRect(pivotX - 23, pivotY - 110, 46, 12, 4);
        ctx.fill();
        ctx.stroke();

        // Chunky Muzzle Bell Ring
        ctx.fillStyle = "#1e293b";
        ctx.strokeStyle = "#cbd5e1";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(pivotX - 32, pivotY - 170, 64, 24, 7);
        ctx.fill();
        ctx.stroke();

        // Muzzle Bore Opening
        ctx.fillStyle = "#0f172a";
        ctx.strokeStyle = "#475569";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(pivotX, pivotY - 170, 25, 9, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        canvas.refresh();
      }
    }

    // Cannon Base Mount Texture (Wood cart bracket with brass wheels)
    if (!scene.textures.exists("cannon_base")) {
      const canvas = scene.textures.createCanvas("cannon_base", 180, 110);
      if (canvas) {
        const ctx = canvas.getContext();

        // Cart mount shadow
        ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 6;

        // Wooden Cart Bracket
        const woodGrad = ctx.createLinearGradient(0, 20, 0, 90);
        woodGrad.addColorStop(0, "#b45309");
        woodGrad.addColorStop(0.5, "#78350f");
        woodGrad.addColorStop(1, "#451a03");
        ctx.fillStyle = woodGrad;
        ctx.strokeStyle = "#291205";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.roundRect(40, 20, 100, 65, 8);
        ctx.fill();
        ctx.stroke();

        // Rivets / Bolts
        ctx.fillStyle = "#facc15";
        ctx.strokeStyle = "#713f12";
        ctx.lineWidth = 1.5;
        [
          [52, 32],
          [128, 32],
          [52, 72],
          [128, 72],
        ].forEach(([x, y]) => {
          ctx.beginPath();
          ctx.arc(x, y, 4.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        });

        // Left Wheel
        ctx.fillStyle = "#78350f";
        ctx.strokeStyle = "#291205";
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(32, 60, 26, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Right Wheel
        ctx.beginPath();
        ctx.arc(148, 60, 26, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Wheel Brass Hubs
        ctx.fillStyle = "#facc15";
        [32, 148].forEach((wx) => {
          ctx.beginPath();
          ctx.arc(wx, 60, 9, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        });

        canvas.refresh();
      }
    }
  }

  // 4. CANNONBALL PROJECTILE
  private static createBulletTexture(scene: Phaser.Scene) {
    if (scene.textures.exists("cannon_bullet")) return;
    const canvas = scene.textures.createCanvas("cannon_bullet", 56, 56);
    if (!canvas) return;
    const ctx = canvas.getContext();

    // Outer glow
    ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 4;

    // Metallic Sphere Gradient
    const grad = ctx.createRadialGradient(20, 18, 2, 28, 28, 24);
    grad.addColorStop(0, "#ffffff");
    grad.addColorStop(0.2, "#cbd5e1");
    grad.addColorStop(0.55, "#475569");
    grad.addColorStop(0.85, "#1e293b");
    grad.addColorStop(1, "#0f172a");

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(28, 28, 22, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    canvas.refresh();
  }

  // 5. MUZZLE FLASH
  private static createMuzzleFlashTexture(scene: Phaser.Scene) {
    if (scene.textures.exists("muzzle_flash")) return;
    const canvas = scene.textures.createCanvas("muzzle_flash", 120, 120);
    if (!canvas) return;
    const ctx = canvas.getContext();

    const grad = ctx.createRadialGradient(60, 60, 0, 60, 60, 55);
    grad.addColorStop(0, "rgba(255, 255, 255, 1)");
    grad.addColorStop(0.25, "rgba(254, 240, 138, 0.95)");
    grad.addColorStop(0.6, "rgba(249, 115, 22, 0.7)");
    grad.addColorStop(1, "rgba(239, 68, 68, 0)");

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(60, 60, 55, 0, Math.PI * 2);
    ctx.fill();

    // Spikes
    ctx.fillStyle = "rgba(254, 240, 138, 0.85)";
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      ctx.save();
      ctx.translate(60, 60);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(-8, 0);
      ctx.lineTo(0, -56);
      ctx.lineTo(8, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    canvas.refresh();
  }

  // 6. MULTI-THEMED ANSWER BALLS
  private static createBallTextures(scene: Phaser.Scene) {
    const BALL_THEMES = [
      {
        id: 0,
        c1: "#ff8787",
        c2: "#ee5253",
        c3: "#c0392b",
        border: "#ffeae6",
        glow: "#ff7675",
      },
      {
        id: 1,
        c1: "#68d8d6",
        c2: "#0abde3",
        c3: "#0984e3",
        border: "#e1f5fe",
        glow: "#48dbfb",
      },
      {
        id: 2,
        c1: "#7bed9f",
        c2: "#2ed573",
        c3: "#10ac84",
        border: "#e8f8f5",
        glow: "#1dd1a1",
      },
      {
        id: 3,
        c1: "#ffeaa7",
        c2: "#fed330",
        c3: "#f39c12",
        border: "#fffde7",
        glow: "#feca57",
      },
      {
        id: 4,
        c1: "#d6a2e8",
        c2: "#a55eea",
        c3: "#8854d0",
        border: "#f3e5f5",
        glow: "#ff9ff3",
      },
    ];

    const size = 260;
    const r = 118;
    const cx = size / 2;
    const cy = size / 2;

    BALL_THEMES.forEach((theme) => {
      // Normal state
      const keyNormal = `ball_theme_${theme.id}`;
      if (!scene.textures.exists(keyNormal)) {
        const canvas = scene.textures.createCanvas(keyNormal, size, size);
        if (canvas) {
          const ctx = canvas.getContext();

          // Drop Shadow
          ctx.shadowColor = "rgba(0, 0, 0, 0.35)";
          ctx.shadowBlur = 14;
          ctx.shadowOffsetY = 8;

          // Radial 3D Sphere Gradient
          const grad = ctx.createRadialGradient(
            cx - 36,
            cy - 42,
            10,
            cx,
            cy,
            r,
          );
          grad.addColorStop(0, theme.c1);
          grad.addColorStop(0.55, theme.c2);
          grad.addColorStop(1, theme.c3);

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.fill();

          // Inner Specular Glare Arc
          ctx.shadowColor = "transparent";
          const glareGrad = ctx.createLinearGradient(
            cx,
            cy - r + 10,
            cx,
            cy - 10,
          );
          glareGrad.addColorStop(0, "rgba(255, 255, 255, 0.65)");
          glareGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
          ctx.fillStyle = glareGrad;
          ctx.beginPath();
          ctx.ellipse(cx, cy - 42, 60, 26, 0, 0, Math.PI * 2);
          ctx.fill();

          // Crisp Outer Border
          ctx.strokeStyle = theme.border;
          ctx.lineWidth = 4.5;
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.stroke();

          canvas.refresh();
        }
      }

      // Targeted / Highlighted State
      const keyTargeted = `ball_targeted_${theme.id}`;
      if (!scene.textures.exists(keyTargeted)) {
        const canvas = scene.textures.createCanvas(keyTargeted, size, size);
        if (canvas) {
          const ctx = canvas.getContext();

          // Intense Golden / Neon Glow
          ctx.shadowColor = theme.glow;
          ctx.shadowBlur = 24;

          const grad = ctx.createRadialGradient(
            cx - 36,
            cy - 42,
            10,
            cx,
            cy,
            r,
          );
          grad.addColorStop(0, theme.c1);
          grad.addColorStop(0.55, theme.c2);
          grad.addColorStop(1, theme.c3);

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.fill();

          // Outer Highlight Ring
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 7;
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.stroke();

          canvas.refresh();
        }
      }
    });
  }

  // 7. HEARTS (Full and Empty)
  private static createHeartTextures(scene: Phaser.Scene) {
    const drawHeart = (
      key: string,
      color: string,
      border: string,
      shadow: string,
    ) => {
      if (scene.textures.exists(key)) return;
      const canvas = scene.textures.createCanvas(key, 64, 64);
      if (!canvas) return;
      const ctx = canvas.getContext();

      ctx.shadowColor = shadow;
      ctx.shadowBlur = 8;
      ctx.shadowOffsetY = 4;

      ctx.fillStyle = color;
      ctx.strokeStyle = border;
      ctx.lineWidth = 3;

      ctx.beginPath();
      ctx.moveTo(32, 52);
      ctx.bezierCurveTo(12, 36, 6, 20, 16, 12);
      ctx.bezierCurveTo(24, 6, 30, 14, 32, 20);
      ctx.bezierCurveTo(34, 14, 40, 6, 48, 12);
      ctx.bezierCurveTo(58, 20, 52, 36, 32, 52);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      canvas.refresh();
    };

    drawHeart("heart_full", "#ef4444", "#ffffff", "rgba(239, 68, 68, 0.6)");
    drawHeart("heart_empty", "#475569", "#94a3b8", "rgba(0, 0, 0, 0.3)");
  }

  // 8. GOLDEN STAR
  private static createStarTexture(scene: Phaser.Scene) {
    if (scene.textures.exists("star")) return;
    const canvas = scene.textures.createCanvas("star", 64, 64);
    if (!canvas) return;
    const ctx = canvas.getContext();

    ctx.shadowColor = "rgba(245, 158, 11, 0.7)";
    ctx.shadowBlur = 10;

    const cx = 32;
    const cy = 32;
    const spikes = 5;
    const outerRadius = 26;
    const innerRadius = 12;

    let rot = (Math.PI / 2) * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;

    const grad = ctx.createLinearGradient(cx, cy - outerRadius, cx, cy + outerRadius);
    grad.addColorStop(0, "#fef08a");
    grad.addColorStop(0.5, "#facc15");
    grad.addColorStop(1, "#d97706");

    ctx.fillStyle = grad;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2.5;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y);
      rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    canvas.refresh();
  }

  // 9. UI ICONS
  private static createIconTextures(scene: Phaser.Scene) {
    // Settings Gear Icon
    if (!scene.textures.exists("icon_settings")) {
      const canvas = scene.textures.createCanvas("icon_settings", 64, 64);
      if (canvas) {
        const ctx = canvas.getContext();
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(32, 32, 14, 0, Math.PI * 2);
        ctx.fill();
        for (let i = 0; i < 6; i++) {
          const ang = (i * Math.PI) / 3;
          ctx.save();
          ctx.translate(32, 32);
          ctx.rotate(ang);
          ctx.fillRect(-5, -24, 10, 10);
          ctx.restore();
        }
        ctx.fillStyle = "#0f172a";
        ctx.beginPath();
        ctx.arc(32, 32, 7, 0, Math.PI * 2);
        ctx.fill();
        canvas.refresh();
      }
    }

    // Pause Icon
    if (!scene.textures.exists("icon_pause")) {
      const canvas = scene.textures.createCanvas("icon_pause", 64, 64);
      if (canvas) {
        const ctx = canvas.getContext();
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.roundRect(18, 16, 9, 32, 3);
        ctx.roundRect(37, 16, 9, 32, 3);
        ctx.fill();
        canvas.refresh();
      }
    }

    // Hint Lightbulb Icon
    if (!scene.textures.exists("icon_hint")) {
      const canvas = scene.textures.createCanvas("icon_hint", 64, 64);
      if (canvas) {
        const ctx = canvas.getContext();
        ctx.fillStyle = "#facc15";
        ctx.beginPath();
        ctx.arc(32, 25, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#e2e8f0";
        ctx.fillRect(26, 39, 12, 8);
        ctx.fillStyle = "#94a3b8";
        ctx.fillRect(28, 48, 8, 4);
        canvas.refresh();
      }
    }
  }

  // 10. REUSABLE 3D BUTTON TEXTURES
  private static createButtonTextures(scene: Phaser.Scene) {
    const make3DButton = (
      key: string,
      topColor: string,
      bottomColor: string,
      shadowColor: string,
      width = 240,
      height = 76,
    ) => {
      if (scene.textures.exists(key)) return;
      const canvas = scene.textures.createCanvas(key, width, height + 8);
      if (!canvas) return;
      const ctx = canvas.getContext();

      // Bottom 3D ledge
      ctx.fillStyle = shadowColor;
      ctx.beginPath();
      ctx.roundRect(0, 8, width, height, height / 2);
      ctx.fill();

      // Top Button Face
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, topColor);
      grad.addColorStop(1, bottomColor);
      ctx.fillStyle = grad;
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 3.5;

      ctx.beginPath();
      ctx.roundRect(0, 0, width, height, height / 2);
      ctx.fill();
      ctx.stroke();

      canvas.refresh();
    };

    make3DButton("btn_green", "#4ade80", "#16a34a", "#15803d", 260, 80);
    make3DButton("btn_blue", "#38bdf8", "#0284c7", "#0369a1", 240, 76);
    make3DButton("btn_orange", "#fb923c", "#ea580c", "#c2410c", 240, 76);
    make3DButton("btn_shoot", "#f43f5e", "#e11d48", "#9f1239", 200, 76);
  }
}
