import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { sfx } from '../utils/sounds';
import { ArrowLeft, Star, Lightbulb } from 'lucide-react';

interface Ball {
  id: number;
  value: number;
  bgGradient: string;
  borderColor: string;
  shadowColor: string;
  glowColor: string;
  x: number; // percentage horizontally (15%, 32%, 50%, 68%, 85%)
  yPercent: number; // percentage vertically (45% to 58%)
  scale: number;
  bobVariant: number;
  status?: 'correct' | 'wrong' | null;
}

const BALL_THEMES = [
  {
    bg: 'radial-gradient(circle at 35% 30%, #ff8787 0%, #ee5253 60%, #c0392b 100%)',
    borderColor: '#ffeae6',
    shadowColor: '#871c14',
    glowColor: '#ff7675'
  },
  {
    bg: 'radial-gradient(circle at 35% 30%, #68d8d6 0%, #0abde3 60%, #0984e3 100%)',
    borderColor: '#e1f5fe',
    shadowColor: '#065279',
    glowColor: '#48dbfb'
  },
  {
    bg: 'radial-gradient(circle at 35% 30%, #7bed9f 0%, #2ed573 60%, #10ac84 100%)',
    borderColor: '#e8f8f5',
    shadowColor: '#0b664f',
    glowColor: '#1dd1a1'
  },
  {
    bg: 'radial-gradient(circle at 35% 30%, #ffeaa7 0%, #fed330 60%, #f39c12 100%)',
    borderColor: '#fffde7',
    shadowColor: '#9c5b05',
    glowColor: '#feca57'
  },
  {
    bg: 'radial-gradient(circle at 35% 30%, #d6a2e8 0%, #a55eea 60%, #8854d0 100%)',
    borderColor: '#f3e5f5',
    shadowColor: '#512782',
    glowColor: '#ff9ff3'
  }
];

const PRAISE_MESSAGES = ['GREAT! 🌟', 'CORRECT! 🎉', 'AWESOME! 🚀', 'SUPER STAR! ⭐', 'BRILLIANT! 🏆'];
const GENTLE_MESSAGES = ['Try Again! 😊', 'Almost! Give it another shot! 💪', 'Keep Trying! ✨'];

interface EquationShooterProps {
  onBack: () => void;
}

export const EquationShooter: React.FC<EquationShooterProps> = ({ onBack }) => {
  const [equation, setEquation] = useState<{ q: string; answer: number; hint: string }>({ q: '', answer: 0, hint: '' });
  const [showHint, setShowHint] = useState(false);
  const [balls, setBalls] = useState<Ball[]>([]);
  const [feedback, setFeedback] = useState<{ text: string; isCorrect: boolean } | null>(null);
  const [score, setScore] = useState(0);
  const [correctStreak, setCorrectStreak] = useState(0);

  // Cannon & Aiming Drag State
  const [isAiming, setIsAiming] = useState(false);
  const [cannonAngle, setCannonAngle] = useState(0); // -80° to +80°
  // Continuous power ratio: 0.35 (very short drag) to 1.45 (max power drag)
  const [power, setPower] = useState(0.9);
  const [maxDistanceReached, setMaxDistanceReached] = useState(300);
  const [isShooting, setIsShooting] = useState(false);
  const [isRecoil, setIsRecoil] = useState(false);

  // Muzzle flash / smoke effect
  const [muzzleFlash, setMuzzleFlash] = useState<{ x: number; y: number; angle: number } | null>(null);

  // Active Projectile in flight
  const [flyingBullet, setFlyingBullet] = useState<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    maxTravelDistance: number;
    traveled: number;
  } | null>(null);

  // Impact particle burst state
  const [impactEffect, setImpactEffect] = useState<{ x: number; y: number; isCorrect: boolean } | null>(null);

  const arenaRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  // 1. GENERATE 2–1–2 BALL FORMATION WITH SMOOTH LEVEL PROGRESSION
  const generateNewEquation = useCallback((streakCount: number) => {
    let q = '';
    let answer = 0;
    let hint = '';

    if (streakCount < 3) {
      const isAdd = Math.random() > 0.45;
      if (isAdd) {
        const a = Math.floor(Math.random() * 8) + 3; // 3-10
        const b = Math.floor(Math.random() * 8) + 2; // 2-9
        q = `${a} + ${b} = ?`;
        answer = a + b;
        hint = `Start at ${a} and count forward by ${b}.`;
      } else {
        const b = Math.floor(Math.random() * 6) + 3; // 3-8
        const a = b + Math.floor(Math.random() * 8) + 2; // b+2 to b+9
        q = `${a} - ${b} = ?`;
        answer = a - b;
        hint = `Start with ${a} and take away ${b}.`;
      }
    } else if (streakCount < 6) {
      const opChoice = Math.random();
      if (opChoice < 0.45) {
        const a = Math.floor(Math.random() * 4) + 2;
        const b = Math.floor(Math.random() * 5) + 2;
        q = `${a} × ${b} = ?`;
        answer = a * b;
        hint = `Think of ${a} groups of ${b}.`;
      } else if (opChoice < 0.75) {
        const divisor = Math.floor(Math.random() * 4) + 2;
        const quotient = Math.floor(Math.random() * 5) + 2;
        const dividend = divisor * quotient;
        q = `${dividend} ÷ ${divisor} = ?`;
        answer = quotient;
        hint = `How many groups of ${divisor} can you make from ${dividend}?`;
      } else {
        const a = Math.floor(Math.random() * 9) + 5;
        const b = Math.floor(Math.random() * 8) + 4;
        q = `${a} + ${b} = ?`;
        answer = a + b;
        hint = `Add ${a} and ${b} together by tens and ones.`;
      }
    } else {
      const op = ['add', 'sub', 'mult', 'div'][Math.floor(Math.random() * 4)];
      if (op === 'mult') {
        const a = Math.floor(Math.random() * 5) + 4;
        const b = Math.floor(Math.random() * 6) + 3;
        q = `${a} × ${b} = ?`;
        answer = a * b;
        hint = `Think of ${a} groups of ${b}.`;
      } else if (op === 'div') {
        const divisor = Math.floor(Math.random() * 6) + 3;
        const quotient = Math.floor(Math.random() * 6) + 3;
        q = `${divisor * quotient} ÷ ${divisor} = ?`;
        answer = quotient;
        hint = `How many groups of ${divisor} can you make from ${divisor * quotient}?`;
      } else if (op === 'sub') {
        const b = Math.floor(Math.random() * 9) + 4;
        const a = b + Math.floor(Math.random() * 12) + 5;
        q = `${a} - ${b} = ?`;
        answer = a - b;
        hint = `Start with ${a} and subtract ${b}.`;
      } else {
        const a = Math.floor(Math.random() * 12) + 6;
        const b = Math.floor(Math.random() * 10) + 5;
        q = `${a} + ${b} = ?`;
        answer = a + b;
        hint = `Combine ${a} and ${b} into a total sum.`;
      }
    }

    let startVal = answer - 2;
    if (startVal < 0) startVal = 0;

    let candidateSet = new Set<number>();
    for (let i = 0; i < 5; i++) {
      candidateSet.add(startVal + i);
    }
    if (!candidateSet.has(answer)) {
      candidateSet.add(answer);
    }
    while (candidateSet.size < 5) {
      startVal += 1;
      candidateSet.add(startVal + candidateSet.size);
    }

    const allValues = Array.from(candidateSet).slice(0, 5);
    allValues.sort(() => Math.random() - 0.5);

    // Single straight horizontal row (● ● ● ● ●) positioned higher in the arena (y = 38%)
    // Edge balls brought safely inward (16% to 84%) so they have generous margins from boundaries
    const xPositions = [16, 33, 50, 67, 84];
    const yPercentages = [38, 38, 38, 38, 38];

    const newBalls: Ball[] = allValues.map((val, idx) => ({
      id: idx,
      value: val,
      bgGradient: BALL_THEMES[idx % BALL_THEMES.length].bg,
      borderColor: BALL_THEMES[idx % BALL_THEMES.length].borderColor,
      shadowColor: BALL_THEMES[idx % BALL_THEMES.length].shadowColor,
      glowColor: BALL_THEMES[idx % BALL_THEMES.length].glowColor,
      x: xPositions[idx],
      yPercent: yPercentages[idx],
      scale: 1,
      bobVariant: idx % 3,
      status: null
    }));

    setEquation({ q, answer, hint });
    setBalls(newBalls);
    setFeedback(null);
    setShowHint(false);
  }, []);

  useEffect(() => {
    generateNewEquation(0);
  }, [generateNewEquation]);

  const getCannonOrigin = () => {
    if (!arenaRef.current) return { x: 700, y: 700 };
    const arenaRect = arenaRef.current.getBoundingClientRect();
    return {
      x: arenaRect.width / 2,
      y: arenaRect.height - 85
    };
  };

  // 2. ACCURATE TARGET RECOGNITION (Synchronized with displayed trajectory)
  const getTargetedBallIndex = (): number | null => {
    if (!arenaRef.current) return null;
    const arenaRect = arenaRef.current.getBoundingClientRect();
    const cannonPos = getCannonOrigin();
    const angleRad = (cannonAngle * Math.PI) / 180;
    const currentMaxReach = maxDistanceReached;

    let closestBallIdx: number | null = null;
    let minDistance = 95; // generous 95px hitbox tolerance matching expanded hitboxes

    for (let i = 0; i < balls.length; i++) {
      const ball = balls[i];
      const ballCenterX = (ball.x / 100) * arenaRect.width;
      const ballCenterY = (ball.yPercent / 100) * arenaRect.height;

      const deltaX = ballCenterX - cannonPos.x;
      const deltaY = ballCenterY - cannonPos.y;
      const distToBall = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      // Verify shot has enough power/range to reach the ball's outer boundary
      if (currentMaxReach >= distToBall - 85) {
        const projectedX = cannonPos.x + Math.tan(angleRad) * (-deltaY);
        const horizDiff = Math.abs(projectedX - ballCenterX);

        if (horizDiff < minDistance) {
          minDistance = horizDiff;
          closestBallIdx = i;
        }
      }
    }
    return closestBallIdx;
  };

  const targetedBallIndex = getTargetedBallIndex();

  // 3. CONTINUOUS INTUITIVE DRAG-TO-AIM & VARIABLE POWER SYSTEM
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isShooting || !arenaRef.current) return;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    setIsAiming(true);
    updateAimFromPointer(e.clientX, e.clientY);
  };

  const updateAimFromPointer = (clientX: number, clientY: number) => {
    if (!arenaRef.current) return;
    const arenaRect = arenaRef.current.getBoundingClientRect();
    const cannonPos = getCannonOrigin();

    const pointerX = clientX - arenaRect.left;
    const pointerY = clientY - arenaRect.top;

    let deltaX = pointerX - cannonPos.x;
    let deltaY = pointerY - cannonPos.y;

    // Invert when pulling down (slingshot pull-back style)
    if (deltaY > 15) {
      deltaX = -deltaX;
      deltaY = -deltaY;
    }

    const angleRad = Math.atan2(deltaX, -deltaY);
    let angleDeg = (angleRad * 180) / Math.PI;

    // Smooth clamped angle: -80° to +80° (easy comfortable reach to all far edge balls)
    angleDeg = Math.max(-80, Math.min(80, angleDeg));
    setCannonAngle(angleDeg);

    // Continuous drag mapping:
    const dragDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Power ratio smoothly scales from 0.4 to 1.6
    const normalizedPower = Math.min(1.6, Math.max(0.4, dragDistance / 160));
    setPower(normalizedPower);

    // Maximum trajectory reach in pixels (reaches all balls effortlessly)
    const calculatedRange = Math.min(900, Math.max(200, dragDistance * 3.3));
    setMaxDistanceReached(calculatedRange);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isAiming || isShooting) return;
    updateAimFromPointer(e.clientX, e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isAiming || isShooting) return;
    setIsAiming(false);
    try {
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {
      // Safe fallback
    }
    fireCannon();
  };


  // 4. FIRING ALONG EXACT TRAJECTORY WITH FORGIVING HIT DETECTION
  const fireCannon = () => {
    if (isShooting || !arenaRef.current) return;
    setIsShooting(true);

    setIsRecoil(true);
    setTimeout(() => setIsRecoil(false), 400);

    sfx.playCannonShoot();

    const cannonPos = getCannonOrigin();
    const angleRad = (cannonAngle * Math.PI) / 180;

    const muzzleOffset = 85;
    const startX = cannonPos.x + Math.sin(angleRad) * muzzleOffset;
    const startY = cannonPos.y - Math.cos(angleRad) * muzzleOffset;

    setMuzzleFlash({ x: startX, y: startY, angle: cannonAngle });
    setTimeout(() => setMuzzleFlash(null), 450);

    // Constant crisp velocity following exact angle
    const bulletSpeed = 24;
    const vx = Math.sin(angleRad) * bulletSpeed;
    const vy = -Math.cos(angleRad) * bulletSpeed;

    setFlyingBullet({
      x: startX,
      y: startY,
      vx,
      vy,
      maxTravelDistance: maxDistanceReached,
      traveled: muzzleOffset
    });
  };

  // Collision Loop with Continuous Segment Detection and 45-50% Enlarged Hitboxes
  useEffect(() => {
    if (!flyingBullet || !arenaRef.current) return;

    let posX = flyingBullet.x;
    let posY = flyingBullet.y;
    let velX = flyingBullet.vx;
    let velY = flyingBullet.vy;
    let traveled = flyingBullet.traveled;
    const maxDist = flyingBullet.maxTravelDistance;

    const arenaRect = arenaRef.current.getBoundingClientRect();
    const arenaWidth = arenaRect.width;
    const arenaHeight = arenaRect.height;

    // Helper: Distance from a point (px, py) to a line segment (x1, y1) -> (x2, y2)
    const distToSegment = (px: number, py: number, x1: number, y1: number, x2: number, y2: number) => {
      const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
      if (l2 === 0) return Math.sqrt((px - x1) * (px - x1) + (py - y1) * (py - y1));
      let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
      t = Math.max(0, Math.min(1, t));
      const projX = x1 + t * (x2 - x1);
      const projY = y1 + t * (y2 - y1);
      return Math.sqrt((px - projX) * (px - projX) + (py - projY) * (py - projY));
    };

    const checkCollision = (prevX: number, prevY: number, curX: number, curY: number) => {
      // Find the closest ball to the projectile's swept path
      let closestIdx = -1;
      let closestDist = 999;
      let hitTargetX = 0;
      let hitTargetY = 0;

      // Generous hitbox radius: 88px (45-50% larger than visible ~58px ball radius + 24px bullet radius)
      // Prevents bullet from tunneling or jumping over any ball including far-left and far-right
      const hitRadius = 88;

      for (let i = 0; i < balls.length; i++) {
        const ball = balls[i];
        const ballCenterX = (ball.x / 100) * arenaWidth;
        const ballCenterY = (ball.yPercent / 100) * arenaHeight;

        const pathDist = distToSegment(ballCenterX, ballCenterY, prevX, prevY, curX, curY);

        if (pathDist <= hitRadius && pathDist < closestDist) {
          closestDist = pathDist;
          closestIdx = i;
          hitTargetX = ballCenterX;
          hitTargetY = ballCenterY;
        }
      }

      if (closestIdx !== -1) {
        handleHitBall(closestIdx, hitTargetX, hitTargetY);
        return true;
      }

      // End shot if reached drag power distance or screen edge
      if (traveled >= maxDist || curY < -60 || curX < -60 || curX > arenaWidth + 60) {
        setFlyingBullet(null);
        setIsShooting(false);
        sfx.playGentleTryAgain();
        const gentle = GENTLE_MESSAGES[Math.floor(Math.random() * GENTLE_MESSAGES.length)];
        setFeedback({ text: gentle, isCorrect: false });
        return true;
      }

      return false;
    };

    const step = () => {
      const prevX = posX;
      const prevY = posY;
      posX += velX;
      posY += velY;
      const stepDist = Math.sqrt(velX * velX + velY * velY);
      traveled += stepDist;

      setFlyingBullet({
        x: posX,
        y: posY,
        vx: velX,
        vy: velY,
        maxTravelDistance: maxDist,
        traveled
      });

      if (!checkCollision(prevX, prevY, posX, posY)) {
        animationFrameRef.current = requestAnimationFrame(step);
      }
    };

    animationFrameRef.current = requestAnimationFrame(step);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [flyingBullet, balls]);

  // 5. HIT IMPACT & SUCCESS / RETRY
  const handleHitBall = (ballIdx: number, hitX: number, hitY: number) => {
    setFlyingBullet(null);
    setIsShooting(false);
    sfx.playBallHit();

    const targetBall = balls[ballIdx];
    const isCorrect = targetBall.value === equation.answer;

    setImpactEffect({ x: hitX, y: hitY, isCorrect });
    setTimeout(() => setImpactEffect(null), 500);

    if (isCorrect) {
      sfx.playCorrect();
      const praise = PRAISE_MESSAGES[Math.floor(Math.random() * PRAISE_MESSAGES.length)];
      setFeedback({ text: praise, isCorrect: true });
      setScore((prev) => prev + 10);
      const newStreak = correctStreak + 1;
      setCorrectStreak(newStreak);

      setBalls((prev) =>
        prev.map((b, idx) => (idx === ballIdx ? { ...b, status: 'correct' } : b))
      );

      confetti({
        particleCount: 65,
        spread: 85,
        origin: { y: 0.6 }
      });

      setTimeout(() => {
        generateNewEquation(newStreak);
      }, 1000);
    } else {
      sfx.playGentleTryAgain();
      const gentle = GENTLE_MESSAGES[Math.floor(Math.random() * GENTLE_MESSAGES.length)];
      setFeedback({ text: gentle, isCorrect: false });

      setBalls((prev) =>
        prev.map((b, idx) => (idx === ballIdx ? { ...b, status: 'wrong' } : b))
      );

      setTimeout(() => {
        setBalls((prev) =>
          prev.map((b, idx) => (idx === ballIdx ? { ...b, status: null } : b))
        );
      }, 900);
    }
  };

  // 6. PRECISE DYNAMIC TRAJECTORY PREVIEW (MATCHES EXACT PROJECTILE FLIGHT)
  const renderTrajectoryDots = () => {
    const cannonPos = getCannonOrigin();
    const angleRad = (cannonAngle * Math.PI) / 180;
    const dots = [];

    // Dynamically calculate number of dots based on drag power
    const numDots = Math.min(18, Math.max(4, Math.round(power * 12)));
    const spacing = 36;

    for (let i = 2; i <= numDots; i++) {
      const dotX = cannonPos.x + Math.sin(angleRad) * (i * spacing);
      const dotY = cannonPos.y - Math.cos(angleRad) * (i * spacing);
      dots.push({ x: dotX, y: dotY, opacity: 1 - (i / (numDots + 4)) });
    }

    const endDot = dots[dots.length - 1];

    return (
      <svg
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 14
        }}
      >
        {dots.map((d, i) => (
          <circle
            key={i}
            cx={d.x}
            cy={d.y}
            r={i === dots.length - 1 ? 9 : 6}
            fill="#fef08a"
            stroke="#ea580c"
            strokeWidth={2.5}
            opacity={d.opacity}
          />
        ))}

        {/* Dynamic Glowing Targeting Reticle at Endpoint */}
        {endDot && (
          <g transform={`translate(${endDot.x}, ${endDot.y})`}>
            <circle
              r={18}
              fill="rgba(254, 240, 138, 0.25)"
              stroke="#fde047"
              strokeWidth={3}
              strokeDasharray="5,4"
              opacity={0.95}
            />
            <circle r={5.5} fill="#ea580c" stroke="#ffffff" strokeWidth={1.5} />
          </g>
        )}
      </svg>
    );
  };

  return (
    <div
      ref={arenaRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        boxShadow: 'none',
        border: 'none',
        borderRadius: '0px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 32px 10px 32px',
        overflow: 'hidden',
        boxSizing: 'border-box',
        touchAction: 'none',
        cursor: isAiming ? 'grabbing' : 'crosshair',
        background: 'linear-gradient(180deg, #60a5fa 0%, #93c5fd 40%, #bae6fd 60%)'
      }}
    >
      {/* ========================================================================= */}
      {/* WIDE LAYERED CARTOON ENVIRONMENT BACKGROUND                               */}
      {/* ========================================================================= */}

      {/* SINGLE CHEERFUL CARTOON SUN WITH CLEAR NATURAL SUNRAYS (ONLY ONE SUN) */}
      <div
        style={{
          position: 'absolute',
          top: 15,
          left: 35,
          width: '150px',
          height: '150px',
          pointerEvents: 'none',
          zIndex: 2,
          filter: 'drop-shadow(0 6px 14px rgba(234, 88, 12, 0.25))'
        }}
      >
        <svg viewBox="0 0 160 160" width="100%" height="100%">
          <defs>
            <radialGradient id="singleSunGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="70%" stopColor="#fde047" />
              <stop offset="100%" stopColor="#facc15" />
            </radialGradient>
          </defs>

          {/* Natural Cartoon Sun Rays */}
          <g transform="translate(80, 80)" className="animate-sun-pulse">
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle, i) => (
              <g key={i} transform={`rotate(${angle})`}>
                {i % 2 === 0 ? (
                  // Long triangular rays
                  <polygon
                    points="-7,-52 0,-76 7,-52"
                    fill="#fde047"
                    stroke="#f59e0b"
                    strokeWidth="1.5"
                  />
                ) : (
                  // Rounded soft petal rays
                  <ellipse
                    cx="0"
                    cy="-62"
                    rx="5.5"
                    ry="9"
                    fill="#facc15"
                    stroke="#f59e0b"
                    strokeWidth="1.5"
                  />
                )}
              </g>
            ))}
          </g>

          {/* Main Sun Face Body */}
          <circle cx="80" cy="80" r="48" fill="url(#singleSunGlow)" stroke="#f59e0b" strokeWidth="4.5" />

          {/* Soft Cheeks */}
          <ellipse cx="60" cy="86" rx="8" ry="5" fill="#f472b6" opacity="0.85" />
          <ellipse cx="100" cy="86" rx="8" ry="5" fill="#f472b6" opacity="0.85" />

          {/* Cheerful Friendly Eyes */}
          <ellipse cx="66" cy="74" rx="5" ry="7" fill="#854d0e" />
          <circle cx="68" cy="72" r="2" fill="#ffffff" />

          <ellipse cx="94" cy="74" rx="5" ry="7" fill="#854d0e" />
          <circle cx="96" cy="72" r="2" fill="#ffffff" />

          {/* Warm Friendly Smile */}
          <path
            d="M 68,90 Q 80,102 92,90"
            fill="none"
            stroke="#854d0e"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Flying Bird */}
      <div
        className="animate-bird"
        style={{
          position: 'absolute',
          top: 70,
          left: 0,
          fontSize: '1.8rem',
          pointerEvents: 'none',
          zIndex: 2,
          opacity: 0.65
        }}
      >
        🕊️
      </div>

      {/* Fluffy Clouds */}
      <div
        style={{
          position: 'absolute',
          top: 25,
          right: '10%',
          fontSize: '5.2rem',
          opacity: 0.85,
          pointerEvents: 'none',
          zIndex: 2,
          animation: 'ballBob0 6s ease-in-out infinite 1s'
        }}
      >
        ☁️
      </div>
      <div
        style={{
          position: 'absolute',
          top: 90,
          left: '12%',
          fontSize: '4rem',
          opacity: 0.75,
          pointerEvents: 'none',
          zIndex: 2,
          animation: 'ballBob1 5s ease-in-out infinite'
        }}
      >
        ☁️
      </div>
      <div
        style={{
          position: 'absolute',
          top: 45,
          left: '45%',
          fontSize: '3.4rem',
          opacity: 0.6,
          pointerEvents: 'none',
          zIndex: 2,
          animation: 'ballBob2 7s ease-in-out infinite 0.5s'
        }}
      >
        ☁️
      </div>

      {/* Mountains */}
      <svg
        viewBox="0 0 1600 240"
        style={{
          position: 'absolute',
          bottom: '110px',
          left: 0,
          width: '100%',
          height: '240px',
          pointerEvents: 'none',
          zIndex: 3,
          opacity: 0.45
        }}
      >
        <path d="M0,180 Q400,40 800,160 T1600,140 L1600,240 L0,240 Z" fill="#818cf8" />
        <path d="M250,200 Q650,80 1050,190 T1600,180 L1600,240 L0,240 Z" fill="#6366f1" />
      </svg>

      {/* Green Hills */}
      <svg
        viewBox="0 0 1600 220"
        style={{
          position: 'absolute',
          bottom: '65px',
          left: 0,
          width: '100%',
          height: '220px',
          pointerEvents: 'none',
          zIndex: 4
        }}
      >
        <path d="M0,130 Q450,30 950,120 T1600,100 L1600,220 L0,220 Z" fill="#34d399" />
        <path d="M0,170 Q600,70 1200,160 T1600,150 L1600,220 L0,220 Z" fill="#10b981" />
      </svg>

      {/* Grass Ground with Flora */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
          height: '90px',
          background: 'linear-gradient(180deg, #10b981 0%, #059669 40%, #047857 100%)',
          borderTop: '6px solid #6ee7b7',
          zIndex: 5,
          pointerEvents: 'none'
        }}
      >
        <div style={{ position: 'absolute', left: '6%', bottom: 16, fontSize: '2rem' }} className="animate-flower-sway">
          🌸
        </div>
        <div style={{ position: 'absolute', left: '16%', bottom: 12, fontSize: '1.8rem' }}>
          🍄
        </div>
        <div style={{ position: 'absolute', left: '26%', bottom: 18, fontSize: '1.9rem' }} className="animate-flower-sway">
          🌼
        </div>
        <div style={{ position: 'absolute', right: '26%', bottom: 18, fontSize: '1.9rem' }} className="animate-flower-sway">
          🌻
        </div>
        <div style={{ position: 'absolute', right: '16%', bottom: 12, fontSize: '1.8rem' }}>
          🍄
        </div>
        <div style={{ position: 'absolute', right: '6%', bottom: 16, fontSize: '2rem' }} className="animate-flower-sway">
          🌷
        </div>
      </div>

      {/* Trees */}
      <div style={{ position: 'absolute', bottom: '70px', left: '1%', fontSize: '4.8rem', pointerEvents: 'none', zIndex: 6 }}>
        🌳
      </div>
      <div style={{ position: 'absolute', bottom: '75px', right: '1.5%', fontSize: '4.5rem', pointerEvents: 'none', zIndex: 6 }}>
        🌲
      </div>

      {/* ========================================================================= */}
      {/* 1. TOP AREA: COMPACT HEADER & MASSIVE EQUATION BANNER                     */}
      {/* ========================================================================= */}
      <div style={{ width: '100%', maxWidth: '1440px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', zIndex: 20 }}>
        {/* Navigation & Score Bar */}
        <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button
            onClick={() => {
              sfx.playPop();
              onBack();
            }}
            className="btn-3d"
            style={{
              background: '#FFFFFF',
              color: '#0284c7',
              border: '3px solid #bae6fd',
              borderRadius: '9999px',
              padding: '10px 24px',
              fontSize: '1.3rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 6px 0 #7dd3fc'
            }}
          >
            <ArrowLeft size={24} /> Back
          </button>

          {/* Level Tag & Hints Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.95)',
                color: '#0284c7',
                padding: '8px 24px',
                borderRadius: '9999px',
                fontSize: '1.25rem',
                fontWeight: 800,
                boxShadow: '0 6px 0 #bae6fd',
                border: '2px solid #e0f2fe'
              }}
            >
              {correctStreak >= 6 ? '⭐ Super Master' : correctStreak >= 3 ? '🚀 Explorer' : '🌱 Rookie'}
            </div>

            {/* Dedicated HINTS Button */}
            <button
              onClick={() => {
                sfx.playPop();
                setShowHint((prev) => !prev);
              }}
              className="btn-3d"
              style={{
                background: showHint
                  ? 'linear-gradient(180deg, #f59e0b 0%, #d97706 100%)'
                  : 'linear-gradient(180deg, #fef08a 0%, #facc15 100%)',
                color: showHint ? '#FFFFFF' : '#854d0e',
                padding: '8px 20px',
                borderRadius: '9999px',
                fontSize: '1.2rem',
                fontWeight: 800,
                border: '3px solid #FFFFFF',
                boxShadow: showHint ? '0 6px 0 #b45309' : '0 6px 0 #ca8a04',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer'
              }}
            >
              <Lightbulb size={20} fill={showHint ? '#FFFFFF' : '#ca8a04'} color={showHint ? '#FFFFFF' : '#ca8a04'} />
              HINTS
            </button>
          </div>

          {/* Star Score */}
          <div
            style={{
              background: '#fef08a',
              color: '#854d0e',
              padding: '8px 26px',
              borderRadius: '9999px',
              fontSize: '1.35rem',
              fontWeight: 800,
              boxShadow: '0 6px 0 #fde047',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              border: '2px solid #fef9c3'
            }}
          >
            <Star size={24} fill="#ca8a04" color="#ca8a04" /> {score}
          </div>
        </div>

        {/* Dedicated HINTS Card Overlay Panel */}
        {showHint && (
          <div
            className="animate-pop"
            style={{
              background: 'linear-gradient(180deg, #ffffff 0%, #fefce8 100%)',
              border: '4px solid #facc15',
              borderRadius: '24px',
              padding: '14px 28px',
              boxShadow: '0 10px 0 #ca8a04, 0 16px 25px rgba(0,0,0,0.18)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
              maxWidth: '650px',
              width: '90%',
              textAlign: 'center',
              zIndex: 35
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#854d0e', fontWeight: 900, fontSize: '1.15rem' }}>
              <Lightbulb size={22} fill="#ca8a04" color="#ca8a04" />
              <span>HINTS & METHOD</span>
            </div>
            <div style={{ color: '#713f12', fontSize: '1.25rem', fontWeight: 800, lineHeight: 1.3 }}>
              💡 {equation.hint || 'Solve the equation step by step, then shoot the matching number ball!'}
            </div>
            <div style={{ color: '#a16207', fontSize: '0.95rem', fontWeight: 700 }}>
              Aim your cannon and fire when ready! 🎯
            </div>
          </div>
        )}

        {/* Top Equation Display Banner */}
        <div
          className="animate-pop"
          style={{
            background: '#FFFFFF',
            borderRadius: '34px',
            padding: '12px 64px',
            boxShadow: '0 12px 0 #0284c7, 0 20px 35px rgba(0,0,0,0.22)',
            border: '6px solid #38bdf8',
            textAlign: 'center'
          }}
        >
          <span
            style={{
              fontSize: 'clamp(2.8rem, 6.5vw, 4.2rem)',
              fontWeight: 900,
              color: '#0f172a',
              letterSpacing: '2px'
            }}
          >
            {equation.q}
          </span>
        </div>

        {/* Feedback Prompt Banner */}
        <div style={{ minHeight: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {feedback ? (
            <div
              className="animate-pop"
              style={{
                background: feedback.isCorrect
                  ? 'linear-gradient(180deg, #34d399 0%, #059669 100%)'
                  : 'linear-gradient(180deg, #fbbf24 0%, #d97706 100%)',
                color: '#FFFFFF',
                padding: '6px 30px',
                borderRadius: '9999px',
                fontSize: '1.4rem',
                fontWeight: 900,
                boxShadow: feedback.isCorrect ? '0 6px 0 #047857' : '0 6px 0 #b45309',
                border: '3px solid #FFFFFF'
              }}
            >
              {feedback.text}
            </div>
          ) : (
            <div
              style={{
                background: 'rgba(0, 0, 0, 0.22)',
                padding: '4px 22px',
                borderRadius: '9999px',
                color: '#FFFFFF',
                fontSize: '1.2rem',
                fontWeight: 800,
                backdropFilter: 'blur(4px)',
                textShadow: '0 2px 4px rgba(0,0,0,0.4)'
              }}
            >
              🎯 Pull farther to shoot farther & release!
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MIDDLE AREA: 2–1–2 BALL FORMATION (FORGIVING HITBOXES)                 */}
      {/* ========================================================================= */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 16
        }}
      >
        {balls.map((ball, idx) => {
          const isTargeted = targetedBallIndex === idx && !isShooting;
          const bobAnimation =
            ball.bobVariant === 0
              ? 'ballBob0 3.8s ease-in-out infinite'
              : ball.bobVariant === 1
              ? 'ballBob1 4.2s ease-in-out infinite'
              : 'ballBob2 3.5s ease-in-out infinite';

          let animClass = '';
          if (ball.status === 'correct') animClass = 'animate-burst';
          else if (ball.status === 'wrong') animClass = 'animate-wobble';
          else if (isTargeted) animClass = 'animate-targeted';

          return (
            <div
              key={ball.id}
              className={animClass}
              style={{
                position: 'absolute',
                left: `${ball.x}%`,
                top: `${ball.yPercent}%`,
                transform: 'translate(-50%, -50%)',
                width: 'clamp(92px, 11.5vw, 134px)',
                height: 'clamp(92px, 11.5vw, 134px)',
                borderRadius: '50%',
                background:
                  ball.status === 'correct'
                    ? 'radial-gradient(circle at 35% 30%, #4ade80 0%, #16a34a 100%)'
                    : ball.status === 'wrong'
                    ? 'radial-gradient(circle at 35% 30%, #f87171 0%, #dc2626 100%)'
                    : ball.bgGradient,
                border: isTargeted ? '6px solid #fef08a' : `5px solid ${ball.borderColor}`,
                boxShadow: isTargeted
                  ? `0 0 36px #fde047, 0 10px 0 ${ball.shadowColor}`
                  : `0 10px 0 ${ball.shadowColor}, 0 16px 25px rgba(0,0,0,0.35)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: ball.status ? undefined : isTargeted ? 'targetPulse 1.2s ease-in-out infinite' : bobAnimation,
                transition: 'border 0.15s ease, box-shadow 0.15s ease'
              }}
            >
              {/* 3D Specular Highlight Reflection */}
              <div className="ball-glass-highlight" />
              <div className="ball-bottom-glow" />

              {/* Targeting Badge */}
              {isTargeted && (
                <div
                  style={{
                    position: 'absolute',
                    top: -15,
                    background: '#fef08a',
                    color: '#854d0e',
                    fontSize: '0.9rem',
                    fontWeight: 900,
                    padding: '3px 10px',
                    borderRadius: '8px',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.25)',
                    zIndex: 4
                  }}
                >
                  TARGET
                </div>
              )}

              {/* Number Value */}
              <span
                style={{
                  fontSize: 'clamp(2.5rem, 4.6vw, 3.8rem)',
                  fontWeight: 900,
                  color: '#FFFFFF',
                  textShadow: '0 3px 8px rgba(0,0,0,0.55)',
                  zIndex: 2
                }}
              >
                {ball.value}
              </span>
            </div>
          );
        })}
      </div>

      {/* DYNAMIC VARIABLE-LENGTH AIMING TRAJECTORY (SHORT DRAG = SHORT, LONG DRAG = LONG) */}
      {(isAiming || !isShooting) && renderTrajectoryDots()}

      {/* FLYING PROJECTILE BALL WITH GLOW */}
      {flyingBullet && (
        <div
          style={{
            position: 'absolute',
            left: flyingBullet.x - 24,
            top: flyingBullet.y - 24,
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: 'radial-gradient(circle at 30% 30%, #fef08a 0%, #f59e0b 50%, #ea580c 100%)',
            border: '4px solid #FFFFFF',
            boxShadow: '0 0 25px #f59e0b, 0 0 45px #ea580c',
            zIndex: 30,
            pointerEvents: 'none'
          }}
        />
      )}

      {/* MUZZLE FLASH & CARTOON SMOKE PUFF ON FIRING */}
      {muzzleFlash && (
        <div
          className="animate-muzzle-flash"
          style={{
            position: 'absolute',
            left: muzzleFlash.x,
            top: muzzleFlash.y,
            width: '90px',
            height: '90px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, #fef08a 0%, #f97316 50%, rgba(239, 68, 68, 0) 75%)',
            boxShadow: '0 0 35px #fde047, 0 0 60px #ea580c',
            pointerEvents: 'none',
            zIndex: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <span style={{ fontSize: '2.4rem', filter: 'drop-shadow(0 0 8px #f59e0b)' }}>💥</span>
        </div>
      )}

      {/* IMPACT PARTICLE EFFECT BURST */}
      {impactEffect && (
        <div
          className="animate-pop"
          style={{
            position: 'absolute',
            left: impactEffect.x - 45,
            top: impactEffect.y - 45,
            width: '90px',
            height: '90px',
            borderRadius: '50%',
            background: impactEffect.isCorrect
              ? 'radial-gradient(circle, rgba(74, 222, 128, 0.9) 0%, rgba(220, 38, 38, 0) 70%)'
              : 'radial-gradient(circle, rgba(248, 113, 113, 0.9) 0%, rgba(220, 38, 38, 0) 70%)',
            pointerEvents: 'none',
            zIndex: 35
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* 3. BOTTOM AREA: CANNON WITH GENTLE IDLE BREATH & RECOIL ANIMATION         */}
      {/* ========================================================================= */}
      <div
        className={`${!isAiming && !isShooting ? 'animate-cannon-idle' : ''} ${isRecoil ? 'animate-recoil' : ''}`}
        style={{
          position: 'relative',
          width: '260px',
          height: '145px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-end',
          zIndex: 18,
          cursor: 'grab',
          marginBottom: '5px'
        }}
      >
        {/* Cartoon Cannon Barrel */}
        <div
          style={{
            position: 'absolute',
            bottom: '42px',
            width: '80px',
            height: '115px',
            transformOrigin: 'bottom center',
            transform: `rotate(${cannonAngle}deg)`,
            transition: isAiming ? 'none' : 'transform 0.12s ease-out',
            filter: 'drop-shadow(0 10px 14px rgba(0,0,0,0.35))',
            zIndex: 11
          }}
        >
          <svg viewBox="0 0 80 115" width="80" height="115">
            <defs>
              <linearGradient id="barrelMetal" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#64748b" />
                <stop offset="30%" stopColor="#94a3b8" />
                <stop offset="70%" stopColor="#334155" />
                <stop offset="100%" stopColor="#1e293b" />
              </linearGradient>
              <linearGradient id="goldTrim" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#fde047" />
                <stop offset="50%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#b45309" />
              </linearGradient>
            </defs>

            {/* Rear Cannon Bulb Base */}
            <circle cx="40" cy="98" r="28" fill="url(#barrelMetal)" stroke="#0f172a" strokeWidth="4" />

            {/* Main Tapered Cannon Body */}
            <path d="M 18,92 L 23,20 L 57,20 L 62,92 Z" fill="url(#barrelMetal)" stroke="#0f172a" strokeWidth="4" />

            {/* Brass Gold Accent Ring 1 */}
            <rect x="21" y="44" width="38" height="10" rx="3" fill="url(#goldTrim)" stroke="#78350f" strokeWidth="2" />

            {/* Brass Gold Accent Ring 2 */}
            <rect x="22" y="74" width="36" height="8" rx="3" fill="url(#goldTrim)" stroke="#78350f" strokeWidth="2" />

            {/* Chunky Muzzle Bell Ring */}
            <rect x="15" y="10" width="50" height="16" rx="6" fill="#1e293b" stroke="#cbd5e1" strokeWidth="3" />
            <ellipse cx="40" cy="10" rx="20" ry="7" fill="#0f172a" stroke="#475569" strokeWidth="2" />
          </svg>
        </div>

        {/* Polished Cartoon Wooden Carriage & Wheels Base */}
        <div
          style={{
            position: 'relative',
            width: '180px',
            height: '62px',
            zIndex: 12
          }}
        >
          <svg viewBox="0 0 180 62" width="180" height="62" style={{ filter: 'drop-shadow(0 8px 12px rgba(0,0,0,0.4))' }}>
            <defs>
              <linearGradient id="woodGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="40%" stopColor="#d97706" />
                <stop offset="100%" stopColor="#78350f" />
              </linearGradient>
              <radialGradient id="wheelHub">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="60%" stopColor="#ca8a04" />
                <stop offset="100%" stopColor="#713f12" />
              </radialGradient>
            </defs>

            {/* Wooden Carriage Mount Body */}
            <path
              d="M 32,15 C 32,8 45,2 90,2 C 135,2 148,8 148,15 L 158,54 C 158,58 152,60 144,60 L 36,60 C 28,60 22,58 22,54 Z"
              fill="url(#woodGradient)"
              stroke="#451a03"
              strokeWidth="4"
            />

            {/* Carriage Brass Rivet Details */}
            <circle cx="90" cy="18" r="6" fill="url(#wheelHub)" stroke="#451a03" strokeWidth="2" />
            <circle cx="65" cy="40" r="4" fill="#fde047" stroke="#451a03" strokeWidth="1.5" />
            <circle cx="115" cy="40" r="4" fill="#fde047" stroke="#451a03" strokeWidth="1.5" />

            {/* Left Big Chunky Wooden Wheel */}
            <circle cx="28" cy="38" r="22" fill="#78350f" stroke="#451a03" strokeWidth="4" />
            <circle cx="28" cy="38" r="16" fill="#92400e" stroke="#fde047" strokeWidth="3" />
            <circle cx="28" cy="38" r="7" fill="url(#wheelHub)" stroke="#451a03" strokeWidth="2" />

            {/* Right Big Chunky Wooden Wheel */}
            <circle cx="152" cy="38" r="22" fill="#78350f" stroke="#451a03" strokeWidth="4" />
            <circle cx="152" cy="38" r="16" fill="#92400e" stroke="#fde047" strokeWidth="3" />
            <circle cx="152" cy="38" r="7" fill="url(#wheelHub)" stroke="#451a03" strokeWidth="2" />
          </svg>
        </div>
      </div>
    </div>
  );
};
