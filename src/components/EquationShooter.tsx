import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { sfx } from '../utils/sounds';
import { ArrowLeft, Lightbulb, Zap } from 'lucide-react';
import { GAME_CONFIG } from '../config/gameConfig';
import { adaptiveEngine, isAnswerCorrect, shuffleArray, type QuestionData } from '../utils/adaptiveEngine';

interface Ball {
  id: number;
  value: string | number;
  bgGradient: string;
  borderColor: string;
  shadowColor: string;
  glowColor: string;
  x: number; // percentage horizontally
  yPercent: number; // percentage vertically
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

// Calculate dynamic horizontal percentage spacing for centered ball formation
// Treats the answer balls as a single centered group with consistent gaps and safe outer margins
function getDynamicXPositions(count: number): number[] {
  if (count <= 1) return [50];
  const leftMargin = GAME_CONFIG.balls.horizontalMarginLeft;
  const rightMargin = GAME_CONFIG.balls.horizontalMarginRight;
  const availableWidth = rightMargin - leftMargin;
  const step = availableWidth / (count - 1);
  return Array.from({ length: count }, (_, i) => leftMargin + i * step);
}

interface EquationShooterProps {
  onBack: () => void;
}

export const EquationShooter: React.FC<EquationShooterProps> = ({ onBack }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<QuestionData | null>(null);
  const [equation, setEquation] = useState<{ q: string; answer: string | number; hint: string }>({ q: '', answer: 0, hint: '' });
  const [showHint, setShowHint] = useState(false);
  const [balls, setBalls] = useState<Ball[]>([]);
  const [feedback, setFeedback] = useState<{ text: string; isCorrect: boolean } | null>(null);
  const [correctStreak, setCorrectStreak] = useState(0);

  // 5. EXP Level Progression State
  const [expLevel, setExpLevel] = useState(1);
  const [currentExp, setCurrentExp] = useState(0);
  const [levelUpCelebration, setLevelUpCelebration] = useState<{ newLevel: number } | null>(null);

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

  // Adaptive Question Loader Function
  const loadNextAdaptiveQuestion = useCallback((level: number, prevQId?: string | number) => {
    try {
      const nextQ = adaptiveEngine.selectNextQuestion(level, prevQId);
      setCurrentQuestion(nextQ);

      // Shuffle options so the correct answer position is varied every time
      const shuffledOptions = shuffleArray([...nextQ.options]);
      const count = shuffledOptions.length;
      const xPositions = getDynamicXPositions(count);

      console.log(
        `[Answer Balls] Shuffled options for question [${nextQ.id}]:`,
        shuffledOptions,
        `(Correct answer: "${nextQ.answer}")`
      );

      const newBalls: Ball[] = shuffledOptions.map((val, idx) => ({
        id: idx,
        value: val,
        bgGradient: BALL_THEMES[idx % BALL_THEMES.length].bg,
        borderColor: BALL_THEMES[idx % BALL_THEMES.length].borderColor,
        shadowColor: BALL_THEMES[idx % BALL_THEMES.length].shadowColor,
        glowColor: BALL_THEMES[idx % BALL_THEMES.length].glowColor,
        x: xPositions[idx],
        yPercent: GAME_CONFIG.balls.verticalPercentY,
        scale: 1,
        bobVariant: idx % 3,
        status: null
      }));

      setEquation({ q: nextQ.question, answer: nextQ.answer, hint: nextQ.hint });
      setBalls(newBalls);
      setFeedback(null);
      setShowHint(false);
    } catch (err) {
      console.error('Error selecting next adaptive question:', err);
    }
  }, []);

  // Load questions ONLY from the assigned JSON file for the current game
  const fetchAndInitializeQuestions = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const targetFile = GAME_CONFIG.dataFile;
      const filePath = targetFile.startsWith('/') ? targetFile.slice(1) : targetFile;
      const res = await fetch(`${import.meta.env.BASE_URL}${filePath}?t=${Date.now()}`);
      if (!res.ok) {
        throw new Error(`Failed to load ${filePath}: HTTP ${res.status}`);
      }
      const data = await res.json();
      const rawQuestions = Array.isArray(data)
        ? data
        : Array.isArray(data?.questions)
        ? data.questions
        : [];

      if (rawQuestions.length === 0) {
        throw new Error(`No questions found in assigned file: ${targetFile}`);
      }

      // Initialize adaptive engine using ONLY the questions from this single file
      adaptiveEngine.setQuestions(rawQuestions, targetFile);
      setIsLoading(false);
      loadNextAdaptiveQuestion(expLevel);
    } catch (err: any) {
      console.error('[EquationShooter] Developer Error loading question file:', err);
      setIsLoading(false);
      setLoadError(err?.message || 'Failed to load valid question file');
    }
  }, [expLevel, loadNextAdaptiveQuestion]);

  useEffect(() => {
    fetchAndInitializeQuestions();
  }, [fetchAndInitializeQuestions]);


  const getCannonOrigin = () => {
    if (!arenaRef.current) return { x: 700, y: 700 };
    const arenaRect = arenaRef.current.getBoundingClientRect();
    return {
      x: arenaRect.width / 2,
      y: arenaRect.height - GAME_CONFIG.cannon.muzzleOffset
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
    let minDistance = GAME_CONFIG.balls.targetToleranceDistance;

    for (let i = 0; i < balls.length; i++) {
      const ball = balls[i];
      const ballCenterX = (ball.x / 100) * arenaRect.width;
      const ballCenterY = (ball.yPercent / 100) * arenaHeightCalc(arenaRect.height);

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

  const arenaHeightCalc = (h: number) => h;

  const targetedBallIndex = getTargetedBallIndex();

  // 3. CONTINUOUS INTUITIVE DRAG-TO-AIM & VARIABLE POWER SYSTEM
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // If clicking on an interactive button, do not start aim dragging
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('.no-drag-aim')) {
      return;
    }

    if (isShooting || !arenaRef.current) return;
    try {
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    } catch {
      // safe fallback
    }
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
    if (!isAiming) return;
    setIsAiming(false);
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {
      // Safe fallback
    }
    // Note: In mobile-first controls, dragging solely aims. Shooting is explicitly triggered via SHOOT button
  };

  // Keyboard shortcut listener (Spacebar / Enter for desktop firing)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        fireCannon();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cannonAngle, maxDistanceReached, isShooting]);

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
    const bulletSpeed = GAME_CONFIG.cannon.bulletSpeed;
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

  // Collision Loop with Continuous Segment Detection and Configurable Hitboxes
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

      const hitRadius = GAME_CONFIG.balls.hitRadius;

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
    if (!currentQuestion) return;

    setFlyingBullet(null);
    setIsShooting(false);
    sfx.playBallHit();

    const targetBall = balls[ballIdx];
    const isCorrect = isAnswerCorrect(targetBall.value, equation.answer);

    // Record attempt into Adaptive Learning Engine
    adaptiveEngine.recordAttempt(currentQuestion, isCorrect);

    setImpactEffect({ x: hitX, y: hitY, isCorrect });
    setTimeout(() => setImpactEffect(null), 500);

    if (isCorrect) {
      sfx.playCorrect();
      const praise = PRAISE_MESSAGES[Math.floor(Math.random() * PRAISE_MESSAGES.length)];
      setFeedback({ text: praise, isCorrect: true });
      const newStreak = correctStreak + 1;
      setCorrectStreak(newStreak);

      // EXP Calculation
      const expGained = GAME_CONFIG.expSystem.baseExpPerCorrect;
      const expRequired = GAME_CONFIG.expSystem.getExpRequired(expLevel);

      let nextLevel = expLevel;
      const totalExp = currentExp + expGained;

      if (totalExp >= expRequired) {
        // Level Up Triggered!
        nextLevel = Math.min(GAME_CONFIG.expSystem.maxLevel, expLevel + 1);
        setExpLevel(nextLevel);
        setCurrentExp(Math.max(0, totalExp - expRequired));

        setLevelUpCelebration({ newLevel: nextLevel });
        sfx.playCorrect();
        confetti({
          particleCount: 110,
          spread: 100,
          origin: { y: 0.5 }
        });

        setTimeout(() => {
          setLevelUpCelebration(null);
        }, 2200);
      } else {
        setCurrentExp(totalExp);
      }

      setBalls((prev) =>
        prev.map((b, idx) => (idx === ballIdx ? { ...b, status: 'correct' } : b))
      );

      confetti({
        particleCount: 45,
        spread: 75,
        origin: { y: 0.6 }
      });

      setTimeout(() => {
        loadNextAdaptiveQuestion(nextLevel, currentQuestion.id);
      }, GAME_CONFIG.gameplay.nextQuestionDelayMs);
    } else {
      sfx.playGentleTryAgain();
      setCorrectStreak(0);

      setBalls((prev) =>
        prev.map((b, idx) => (idx === ballIdx ? { ...b, status: 'wrong' } : b))
      );

      // On incorrect answer: record mistake in adaptive learning,
      // and immediately transition smoothly to a fresh new question
      setTimeout(() => {
        loadNextAdaptiveQuestion(expLevel, currentQuestion.id);
      }, 350);
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
        padding: '8px 16px 8px 16px',
        overflow: 'hidden',
        boxSizing: 'border-box',
        touchAction: 'none',
        cursor: isAiming ? 'grabbing' : 'crosshair',
        background: 'linear-gradient(180deg, #60a5fa 0%, #93c5fd 40%, #bae6fd 60%)'
      }}
    >
      {/* Loading Overlay */}
      {isLoading && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 100,
            background: 'rgba(56, 189, 248, 0.92)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            color: '#FFFFFF'
          }}
        >
          <div style={{ fontSize: '3.5rem' }} className="animate-sun-pulse">
            🎯
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 900, textShadow: '0 3px 6px rgba(0,0,0,0.3)', margin: 0 }}>
            Loading Questions...
          </h2>
        </div>
      )}

      {/* Error Overlay with Retry */}
      {loadError && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 100,
            background: 'rgba(15, 23, 42, 0.92)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            padding: '24px',
            textAlign: 'center',
            color: '#FFFFFF'
          }}
        >
          <div style={{ fontSize: '3rem' }}>⚠️</div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 900, margin: 0, color: '#f87171' }}>
            Failed to Load Questions
          </h2>
          <p style={{ maxWidth: '400px', fontSize: '1rem', color: '#cbd5e1', margin: 0 }}>
            {loadError}
          </p>
          <button
            onClick={() => fetchAndInitializeQuestions()}
            className="btn-3d"
            style={{
              background: '#38bdf8',
              color: '#0f172a',
              border: '3px solid #FFFFFF',
              borderRadius: '9999px',
              padding: '10px 28px',
              fontWeight: 900,
              fontSize: '1.1rem',
              cursor: 'pointer',
              boxShadow: '0 4px 0 #0284c7'
            }}
          >
            Retry Loading
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* WIDE LAYERED CARTOON ENVIRONMENT BACKGROUND                               */}
      {/* ========================================================================= */}

      {/* SINGLE CHEERFUL CARTOON SUN WITH 360-DEGREE SURROUNDING RAYS */}
      <div
        style={{
          position: 'absolute',
          top: 10,
          left: 30,
          width: '160px',
          height: '160px',
          pointerEvents: 'none',
          zIndex: 2,
          filter: 'drop-shadow(0 6px 14px rgba(234, 88, 12, 0.25))'
        }}
      >
        <svg viewBox="0 0 200 200" width="100%" height="100%">
          <defs>
            <radialGradient id="singleSunGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="70%" stopColor="#fde047" />
              <stop offset="100%" stopColor="#facc15" />
            </radialGradient>
          </defs>

          {/* Complete 360° Ring of Playful Cartoon Sun Rays (Outward Radiating from Edge) */}
          <g transform="translate(100, 100)" className="animate-sun-pulse" style={{ transformOrigin: 'center' }}>
            {[0, 22.5, 45, 67.5, 90, 112.5, 135, 157.5, 180, 202.5, 225, 247.5, 270, 292.5, 315, 337.5].map((angle, i) => (
              <g key={i} transform={`rotate(${angle})`}>
                {i % 2 === 0 ? (
                  // Prominent rounded ray (Top, Diagonals, Sides, Bottom)
                  <path
                    d="M -9,-48 C -9,-68 -6,-88 0,-88 C 6,-88 9,-68 9,-48 Z"
                    fill="#fde047"
                    stroke="#f59e0b"
                    strokeWidth="3"
                    strokeLinejoin="round"
                  />
                ) : (
                  // Alternating cheerful rounded ray
                  <path
                    d="M -7.5,-48 C -7.5,-63 -4,-78 0,-78 C 4,-78 7.5,-63 7.5,-48 Z"
                    fill="#facc15"
                    stroke="#f59e0b"
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                  />
                )}
              </g>
            ))}
          </g>

          {/* Main Sun Face Body */}
          <circle cx="100" cy="100" r="48" fill="url(#singleSunGlow)" stroke="#f59e0b" strokeWidth="4.5" />

          {/* Soft Cheeks */}
          <ellipse cx="80" cy="106" rx="8" ry="5" fill="#f472b6" opacity="0.85" />
          <ellipse cx="120" cy="106" rx="8" ry="5" fill="#f472b6" opacity="0.85" />

          {/* Cheerful Friendly Eyes */}
          <ellipse cx="86" cy="94" rx="5" ry="7" fill="#854d0e" />
          <circle cx="88" cy="92" r="2" fill="#ffffff" />

          <ellipse cx="114" cy="94" rx="5" ry="7" fill="#854d0e" />
          <circle cx="116" cy="92" r="2" fill="#ffffff" />

          {/* Warm Friendly Smile */}
          <path
            d="M 88,110 Q 100,122 112,110"
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
      {/* 1. TOP AREA: QUESTION BANNER -> STAR BAR -> EXP BAR                        */}
      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* 1. TOP HEADER: LEFT/CENTER QUESTION BAR & RIGHT EXP LEVEL + PROGRESS BAR */}
      {/* ========================================================================= */}
      <div
        style={{
          width: '100%',
          maxWidth: '1280px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px',
          zIndex: 20
        }}
      >
        {/* SINGLE HEADER ROW: BACK BUTTON + QUESTION BAR (LEFT/CENTER) & EXP BAR + SCORE (RIGHT) */}
        <div
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'clamp(6px, 1.2vw, 12px)'
          }}
        >
          {/* Back Button */}
          <button
            onClick={() => {
              sfx.playPop();
              onBack();
            }}
            className="btn-3d"
            style={{
              background: '#FFFFFF',
              color: '#0284c7',
              border: '2.5px solid #bae6fd',
              borderRadius: '9999px',
              padding: '4px 12px',
              fontSize: 'clamp(0.8rem, 1.3vw, 1.0rem)',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              boxShadow: '0 3px 0 #7dd3fc',
              width: 'auto',
              minWidth: '72px',
              height: '42px',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <ArrowLeft size={16} /> Back
          </button>

          {/* PRIMARY HEADER QUESTION / EQUATION DISPLAY BANNER (LEFT / CENTER) */}
          <div
            className="animate-pop"
            style={{
              flex: 1,
              minWidth: '0',
              background: '#FFFFFF',
              borderRadius: '16px',
              padding: '2px 14px',
              boxShadow: '0 4px 0 #0284c7, 0 6px 14px rgba(0,0,0,0.15)',
              border: '3px solid #38bdf8',
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '42px',
              boxSizing: 'border-box',
              overflow: 'hidden'
            }}
          >
            <span
              style={{
                fontSize:
                  equation.q.length > 38
                    ? 'clamp(0.8rem, 1.5vw, 1.15rem)'
                    : equation.q.length > 28
                    ? 'clamp(0.92rem, 1.9vw, 1.35rem)'
                    : equation.q.length > 18
                    ? 'clamp(1.1rem, 2.4vw, 1.65rem)'
                    : equation.q.length > 10
                    ? 'clamp(1.25rem, 3.0vw, 1.95rem)'
                    : 'clamp(1.4rem, 3.6vw, 2.2rem)',
                fontWeight: 900,
                color: '#0f172a',
                letterSpacing: '0.3px',
                lineHeight: 1.15,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '100%',
                padding: '0 4px'
              }}
            >
              {equation.q}
            </span>
          </div>

          {/* RIGHT SIDE: EXP LEVEL & EXP PROGRESS BAR CONTAINER (OCCUPIES THE POINTS POSITION, +2% SIZE) */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              border: '2.5px solid #bae6fd',
              borderRadius: '14px',
              padding: '2px 10px',
              boxShadow: '0 3px 0 #7dd3fc, 0 4px 10px rgba(0,0,0,0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
              alignItems: 'center',
              justifyContent: 'center',
              height: '42.84px',
              width: 'clamp(117.3px, 16.32vw, 158.1px)',
              boxSizing: 'border-box',
              flexShrink: 0
            }}
          >
            {/* Level Title & Numeric EXP */}
            <div
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0 1px'
              }}
            >
              <span
                style={{
                  fontSize: 'clamp(0.72rem, 1.08vw, 0.85rem)',
                  fontWeight: 900,
                  color: '#0369a1',
                  letterSpacing: '0.2px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                  lineHeight: 1
                }}
              >
                <Zap size={12} fill="#0284c7" color="#0284c7" />
                LVL {expLevel}
              </span>

              <span
                style={{
                  fontSize: 'clamp(0.68rem, 1.02vw, 0.82rem)',
                  fontWeight: 900,
                  color: '#0284c7',
                  lineHeight: 1
                }}
              >
                {currentExp}/{GAME_CONFIG.expSystem.getExpRequired(expLevel)}
              </span>
            </div>

            {/* Visual Bar Track */}
            <div
              style={{
                width: '100%',
                height: '5.1px',
                background: '#e0f2fe',
                borderRadius: '9999px',
                overflow: 'hidden',
                border: '1px solid #bae6fd'
              }}
            >
              <div
                className="exp-bar-fill"
                style={{
                  width: `${Math.min(100, Math.max(0, (currentExp / GAME_CONFIG.expSystem.getExpRequired(expLevel)) * 100))}%`,
                  height: '100%',
                  borderRadius: '9999px'
                }}
              />
            </div>
          </div>
        </div>

        {/* COMPACT LEVEL-UP ACHIEVEMENT BADGE */}
        {levelUpCelebration && (
          <div
            className="animate-level-up"
            style={{
              position: 'absolute',
              top: '48px',
              background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 50%, #dc2626 100%)',
              border: '2.5px solid #fef08a',
              borderRadius: '9999px',
              padding: '3px 18px',
              boxShadow: '0 4px 0 #7c2d12, 0 8px 16px rgba(0,0,0,0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              zIndex: 50,
              pointerEvents: 'none'
            }}
          >
            <span className="animate-star-spin" style={{ fontSize: '1rem' }}>⭐</span>
            <span
              style={{
                fontSize: 'clamp(0.85rem, 1.6vw, 1.05rem)',
                fontWeight: 900,
                color: '#FFFFFF',
                textShadow: '0 1px 3px rgba(0,0,0,0.4)',
                letterSpacing: '1px'
              }}
            >
              LEVEL UP!
            </span>
            <span
              style={{
                fontSize: 'clamp(0.8rem, 1.4vw, 0.95rem)',
                fontWeight: 800,
                color: '#fef08a',
                textShadow: '0 1px 2px rgba(0,0,0,0.3)'
              }}
            >
              🎉 Level {levelUpCelebration.newLevel} Unlocked!
            </span>
            <span className="animate-star-spin" style={{ fontSize: '1rem' }}>⭐</span>
          </div>
        )}

        {/* Dedicated HINTS Card Overlay Panel */}
        {showHint && (
          <div
            className="animate-pop no-drag-aim"
            style={{
              position: 'absolute',
              bottom: '85px',
              left: '20px',
              background: 'linear-gradient(180deg, #ffffff 0%, #fefce8 100%)',
              border: '3.5px solid #facc15',
              borderRadius: '18px',
              padding: '12px 18px',
              boxShadow: '0 6px 0 #ca8a04, 0 12px 20px rgba(0,0,0,0.2)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: '4px',
              maxWidth: '360px',
              width: '85%',
              textAlign: 'left',
              zIndex: 40
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#854d0e', fontWeight: 900, fontSize: '1rem' }}>
                <Lightbulb size={18} fill="#ca8a04" color="#ca8a04" />
                <span>HINT</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowHint(false);
                }}
                style={{
                  background: '#fef08a',
                  border: 'none',
                  borderRadius: '50%',
                  width: '22px',
                  height: '22px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontWeight: 900,
                  color: '#854d0e',
                  fontSize: '0.8rem'
                }}
              >
                ✕
              </button>
            </div>
            <div style={{ color: '#713f12', fontSize: '1rem', fontWeight: 800, lineHeight: 1.3 }}>
              💡 {equation.hint || 'Solve the equation step by step, then shoot the matching number ball!'}
            </div>
          </div>
        )}

        {/* Compact Feedback Prompt Banner */}
        <div style={{ minHeight: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {feedback ? (
            <div
              className="animate-pop"
              style={{
                background: feedback.isCorrect
                  ? 'linear-gradient(180deg, #34d399 0%, #059669 100%)'
                  : 'linear-gradient(180deg, #fbbf24 0%, #d97706 100%)',
                color: '#FFFFFF',
                padding: '2px 16px',
                borderRadius: '9999px',
                fontSize: '0.95rem',
                fontWeight: 900,
                boxShadow: feedback.isCorrect ? '0 3px 0 #047857' : '0 3px 0 #b45309',
                border: '2px solid #FFFFFF'
              }}
            >
              {feedback.text}
            </div>
          ) : null}
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
                width: GAME_CONFIG.balls.sizeClamp,
                height: GAME_CONFIG.balls.sizeClamp,
                borderRadius: '50%',
                background:
                  ball.status === 'correct'
                    ? 'radial-gradient(circle at 35% 30%, #4ade80 0%, #16a34a 100%)'
                    : ball.status === 'wrong'
                    ? 'radial-gradient(circle at 35% 30%, #f87171 0%, #dc2626 100%)'
                    : ball.bgGradient,
                border: isTargeted
                  ? `${GAME_CONFIG.balls.borderWidthTargeted}px solid #fef08a`
                  : `${GAME_CONFIG.balls.borderWidthNormal}px solid ${ball.borderColor}`,
                boxShadow: isTargeted
                  ? `0 0 35px #fde047, 0 8px 0 ${ball.shadowColor}`
                  : `0 8px 0 ${ball.shadowColor}, 0 16px 24px rgba(0,0,0,0.35)`,
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
                    top: -16,
                    background: '#fef08a',
                    color: '#854d0e',
                    fontSize: '0.85rem',
                    fontWeight: 900,
                    padding: '2px 10px',
                    borderRadius: '9999px',
                    boxShadow: '0 3px 6px rgba(0,0,0,0.25)',
                    zIndex: 4
                  }}
                >
                  TARGET
                </div>
              )}

              {/* Value / Word with comfortable, consistent inner padding */}
              {(() => {
                const str = String(ball.value);
                let fontSize = GAME_CONFIG.balls.fontSizes.singleDigit;
                if (str.length > 7) {
                  fontSize = GAME_CONFIG.balls.fontSizes.extraLongWord;
                } else if (str.length > 5) {
                  fontSize = GAME_CONFIG.balls.fontSizes.longWord;
                } else if (str.length > 3) {
                  fontSize = GAME_CONFIG.balls.fontSizes.mediumWord;
                } else if (str.length === 3) {
                  fontSize = GAME_CONFIG.balls.fontSizes.shortWord;
                } else if (str.length === 2) {
                  fontSize = GAME_CONFIG.balls.fontSizes.twoDigits;
                }

                return (
                  <span
                    style={{
                      fontSize,
                      fontWeight: 900,
                      color: '#FFFFFF',
                      textShadow: '0 2px 6px rgba(0,0,0,0.65)',
                      zIndex: 2,
                      textAlign: 'center',
                      padding: '0 4px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      lineHeight: 1,
                      maxWidth: '88%',
                      maxHeight: '88%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      userSelect: 'none',
                      pointerEvents: 'none',
                      boxSizing: 'border-box'
                    }}
                  >
                    {ball.value}
                  </span>
                );
              })()}
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
      {/* 3. BOTTOM AREA: CANNON + BOTTOM-LEFT HINT + RIGHT-SIDE SHOOT BUTTON        */}
      {/* ========================================================================= */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          zIndex: 22,
          padding: '0 10px 4px 10px'
        }}
      >
        {/* 4. HINT BUTTON - MOVED TO BOTTOM LEFT FOR COMFORTABLE THUMB TAP */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start' }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              sfx.playPop();
              setShowHint((prev) => !prev);
            }}
            className="btn-3d btn-hint-mobile no-drag-aim"
            style={{
              background: showHint
                ? 'linear-gradient(180deg, #f59e0b 0%, #d97706 100%)'
                : 'linear-gradient(180deg, #fef08a 0%, #facc15 100%)',
              color: showHint ? '#FFFFFF' : '#854d0e',
              padding: '10px 18px',
              borderRadius: '9999px',
              fontSize: 'clamp(0.95rem, 1.8vw, 1.2rem)',
              fontWeight: 900,
              border: '3px solid #FFFFFF',
              boxShadow: showHint ? '0 5px 0 #b45309, 0 8px 14px rgba(0,0,0,0.2)' : '0 5px 0 #ca8a04, 0 8px 14px rgba(0,0,0,0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              zIndex: 25
            }}
          >
            <Lightbulb size={20} fill={showHint ? '#FFFFFF' : '#ca8a04'} color={showHint ? '#FFFFFF' : '#ca8a04'} />
            HINT
          </button>
        </div>

        {/* CANNON WITH GENTLE IDLE BREATH & RECOIL ANIMATION (COMPACT SIZING) */}
        <div
          className={`${!isAiming && !isShooting ? 'animate-cannon-idle' : ''} ${isRecoil ? 'animate-recoil' : ''}`}
          style={{
            position: 'relative',
            width: '180px',
            height: '110px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-end',
            zIndex: 18,
            cursor: 'grab',
            marginBottom: '0px'
          }}
        >
          {/* Cartoon Cannon Barrel */}
          <div
            style={{
              position: 'absolute',
              bottom: '28px',
              width: '58px',
              height: '84px',
              transformOrigin: 'bottom center',
              transform: `rotate(${cannonAngle}deg)`,
              transition: isAiming ? 'none' : 'transform 0.12s ease-out',
              filter: 'drop-shadow(0 8px 10px rgba(0,0,0,0.35))',
              zIndex: 11
            }}
          >
            <svg viewBox="0 0 80 115" width="58" height="84">
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
              width: '130px',
              height: '44px',
              zIndex: 12
            }}
          >
            <svg viewBox="0 0 180 62" width="130" height="44" style={{ filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.38))' }}>
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

        {/* 3. DEDICATED SHOOT BUTTON ON THE RIGHT SIDE (SLIGHTLY SMALLER, COMFORTABLE MOBILE THUMB PRESS) */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              fireCannon();
            }}
            disabled={isShooting}
            className="btn-3d btn-shoot-mobile no-drag-aim"
            style={{
              position: 'relative',
              overflow: 'hidden',
              background: isShooting
                ? 'linear-gradient(180deg, #94a3b8 0%, #64748b 100%)'
                : 'linear-gradient(180deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%)',
              color: '#FFFFFF',
              padding: '11px 26px',
              borderRadius: '9999px',
              fontSize: 'clamp(1.1rem, 2.2vw, 1.5rem)',
              fontWeight: 900,
              letterSpacing: '1.5px',
              border: '3.5px solid #FFFFFF',
              boxShadow: isShooting
                ? '0 4px 0 #475569'
                : '0 6px 0 #991b1b, 0 10px 18px rgba(220, 38, 38, 0.4)',
              textShadow: '0 2px 0 #7f1d1d, 0 3px 6px rgba(0,0,0,0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: isShooting ? 'not-allowed' : 'pointer',
              zIndex: 25,
              opacity: isShooting ? 0.75 : 1
            }}
          >
            {/* Specular top highlight */}
            <div
              style={{
                position: 'absolute',
                top: '2px',
                left: '10%',
                width: '80%',
                height: '35%',
                borderRadius: '9999px',
                background: 'linear-gradient(180deg, rgba(255,255,255,0.65) 0%, rgba(255,255,255,0.05) 100%)',
                pointerEvents: 'none'
              }}
            />
            <span style={{ fontSize: '1.15em', transform: 'translateY(-1px)' }}>🔥</span>
            <span>SHOOT</span>
          </button>
        </div>
      </div>
    </div>
  );
};

