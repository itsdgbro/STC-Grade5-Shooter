import { useState, useEffect } from "react";
import { sfx } from "./utils/sounds";
import { EquationShooter } from "./components/EquationShooter";
import { SettingsModal } from "./components/SettingsModal";
import { loadGameLevels } from "./utils/dataLoader";
import { flutterBridge } from "./utils/flutterBridge";
import { Settings } from "lucide-react";

type Screen = "main-menu" | "equation-shooter";

export function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("main-menu");
  const [gameTitle, setGameTitle] = useState("MATH SHOOTER");
  const [gameSubtitle, setGameSubtitle] = useState("GRADE 5 MATH CHALLENGE");
  const [showSettings, setShowSettings] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [dataLoadError, setDataLoadError] = useState<string | null>(null);
  const [dataLoadAttempt, setDataLoadAttempt] = useState(0);

  useEffect(() => {
    const loadGameInfo = async () => {
      setIsDataLoading(true);
      setDataLoadError(null);
      try {
        const levels = await loadGameLevels();
        const firstLevel = levels[0];
        let title = "Grade 5 Math Shooter";
        if (firstLevel && typeof firstLevel === "object") {
          if ("title" in firstLevel && typeof firstLevel.title === "string") {
            setGameTitle(firstLevel.title);
            title = firstLevel.title;
          }
          if ("subtitle" in firstLevel && typeof firstLevel.subtitle === "string") {
            setGameSubtitle(firstLevel.subtitle);
          }
        }

        // Initialize Flutter Bridge metadata
        flutterBridge.init({
          gameId: "stc_grade5_shooter",
          gameTitle: title,
        });

        setIsDataLoading(false);
      } catch (err: unknown) {
        setIsDataLoading(false);
        setDataLoadError(
          err instanceof Error ? err.message : "Failed to fetch json file.",
        );
      }
    };
    loadGameInfo();
  }, [dataLoadAttempt]);

  // Start background music automatically on the user's first touch/click anywhere
  useEffect(() => {
    const events = ["touchstart", "touchend", "click", "pointerdown", "keydown"] as const;

    const handleFirstInteraction = () => {
      sfx.startBGM().then((started) => {
        if (started || sfx.isPlaying()) {
          events.forEach((evt) => {
            document.removeEventListener(evt, handleFirstInteraction, true);
          });
        }
      });
    };

    events.forEach((evt) => {
      document.addEventListener(evt, handleFirstInteraction, {
        capture: true,
        passive: true,
      });
    });

    return () => {
      events.forEach((evt) => {
        document.removeEventListener(evt, handleFirstInteraction, true);
      });
    };
  }, []);

  if (isDataLoading || dataLoadError) {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "24px",
          padding: "40px",
          boxSizing: "border-box",
          background: "linear-gradient(180deg, #0f172a 0%, #1e3a8a 100%)",
          color: "#FFFFFF",
          fontFamily: "'Mukta', 'Fredoka', 'Nunito', sans-serif",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "5rem" }}>{dataLoadError ? "⚠️" : "🎯"}</div>
        <h1
          style={{
            margin: 0,
            fontSize: "clamp(2rem, 4cqw, 3.5rem)",
            color: dataLoadError ? "#fca5a5" : "#bae6fd",
          }}
        >
          {dataLoadError ? "Failed to fetch json file." : "Loading Questions..."}
        </h1>
        {dataLoadError && (
          <>
            <p
              style={{
                maxWidth: "760px",
                margin: 0,
                color: "#cbd5e1",
                fontSize: "clamp(1.1rem, 2cqw, 1.6rem)",
                lineHeight: 1.4,
              }}
            >
              Failed to fetch json file.
            </p>
            <button
              className="btn-3d"
              onClick={() => setDataLoadAttempt((attempt) => attempt + 1)}
              style={{
                background: "#38bdf8",
                color: "#0f172a",
                border: "4px solid #FFFFFF",
                borderRadius: "9999px",
                padding: "16px 34px",
                fontSize: "clamp(1.2rem, 2cqw, 1.7rem)",
                fontWeight: 900,
                cursor: "pointer",
                boxShadow: "0 7px 0 #0284c7",
              }}
            >
              Retry
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background:
          "linear-gradient(180deg, #38bdf8 0%, #3b82f6 50%, #1d4ed8 100%)",
        fontFamily: "'Mukta', 'Fredoka', 'Nunito', sans-serif",
      }}
    >
      {/* ========================================================================= */}
      {/* RICH MULTI-LAYERED ILLUSTRATED CARTOON ADVENTURE WORLD BACKGROUND (16:9) */}
      {/* ========================================================================= */}
      {currentScreen === "main-menu" && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            overflow: "hidden",
            pointerEvents: "none",
            zIndex: 1,
          }}
        >
          {/* Layer 1: Radiant Blue Sky with Warm Sun & Soft Distant Lighting */}
          <svg
            viewBox="0 0 1920 1080"
            preserveAspectRatio="xMidYMid slice"
            style={{
              position: "absolute",
              width: "100%",
              height: "100%",
              top: 0,
              left: 0,
            }}
          >
            <defs>
              {/* Rich Sky Gradient */}
              <linearGradient
                id="worldSkyGrad"
                x1="0%"
                y1="0%"
                x2="0%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="45%" stopColor="#7dd3fc" />
                <stop offset="75%" stopColor="#bae6fd" />
                <stop offset="100%" stopColor="#e0f2fe" />
              </linearGradient>

              {/* Sun Radial Glow */}
              <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#fef08a" stopOpacity="0.85" />
                <stop offset="60%" stopColor="#fde047" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#facc15" stopOpacity="0" />
              </radialGradient>

              {/* Distant Mountains Gradient */}
              <linearGradient
                id="distantHillsGrad"
                x1="0%"
                y1="0%"
                x2="0%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#93c5fd" />
                <stop offset="40%" stopColor="#86efac" />
                <stop offset="100%" stopColor="#4ade80" />
              </linearGradient>

              {/* Middle Rolling Meadows Gradient */}
              <linearGradient
                id="midMeadowGrad"
                x1="0%"
                y1="0%"
                x2="0%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#4ade80" />
                <stop offset="50%" stopColor="#22c55e" />
                <stop offset="100%" stopColor="#16a34a" />
              </linearGradient>

              {/* Foreground Lush Grass Hills Gradient */}
              <linearGradient
                id="foreHillGrad"
                x1="0%"
                y1="0%"
                x2="0%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#22c55e" />
                <stop offset="50%" stopColor="#16a34a" />
                <stop offset="100%" stopColor="#15803d" />
              </linearGradient>

              {/* Tree Foliage Gradients */}
              <linearGradient id="treeGrad1" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#86efac" />
                <stop offset="100%" stopColor="#16a34a" />
              </linearGradient>
              <linearGradient id="treeGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#4ade80" />
                <stop offset="100%" stopColor="#15803d" />
              </linearGradient>
              <linearGradient id="trunkGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#92400e" />
                <stop offset="50%" stopColor="#b45309" />
                <stop offset="100%" stopColor="#78350f" />
              </linearGradient>
            </defs>

            {/* Sky background */}
            <rect width="1920" height="1080" fill="url(#worldSkyGrad)" />

            {/* Warm Golden Sun with Cheerful Cartoon Rays */}
            <g transform="translate(1650, 160)">
              <circle
                cx="0"
                cy="0"
                r="140"
                fill="url(#sunGlow)"
                opacity="0.6"
              />
              {/* Playful cartoon rays around the circumference */}
              <g
                className="animate-sun-pulse"
                style={{ transformOrigin: "0 0" }}
              >
                {[
                  0, 22.5, 45, 67.5, 90, 112.5, 135, 157.5, 180, 202.5, 225,
                  247.5, 270, 292.5, 315, 337.5,
                ].map((angle, i) => (
                  <g key={i} transform={`rotate(${angle})`}>
                    {i % 2 === 0 ? (
                      <path
                        d="M -13,-70 C -13,-98 -7,-125 0,-125 C 7,-125 13,-98 13,-70 Z"
                        fill="#fde047"
                        stroke="#f59e0b"
                        strokeWidth="4"
                        strokeLinejoin="round"
                      />
                    ) : (
                      <path
                        d="M -10.5,-70 C -10.5,-90 -6,-112 0,-112 C 6,-112 10.5,-90 10.5,-70 Z"
                        fill="#facc15"
                        stroke="#f59e0b"
                        strokeWidth="3.5"
                        strokeLinejoin="round"
                      />
                    )}
                  </g>
                ))}
              </g>
              <circle
                cx="0"
                cy="0"
                r="72"
                fill="#fde047"
                stroke="#f59e0b"
                strokeWidth="5"
              />
              {/* Friendly smiling face on the sun */}
              <circle cx="-20" cy="-10" r="6.5" fill="#854d0e" />
              <circle cx="20" cy="-10" r="6.5" fill="#854d0e" />
              <circle cx="-18" cy="-12" r="2.5" fill="#ffffff" />
              <circle cx="22" cy="-12" r="2.5" fill="#ffffff" />
              <ellipse
                cx="-26"
                cy="6"
                rx="7"
                ry="4.5"
                fill="#f472b6"
                opacity="0.85"
              />
              <ellipse
                cx="26"
                cy="6"
                rx="7"
                ry="4.5"
                fill="#f472b6"
                opacity="0.85"
              />
              <path
                d="M -15,12 Q 0,26 15,12"
                fill="none"
                stroke="#854d0e"
                strokeWidth="4"
                strokeLinecap="round"
              />
            </g>

            {/* Layer 2: Distant Soft Blue-Green Mountain Hills */}
            <path
              d="M -100,750 Q 250,560 650,680 T 1400,640 Q 1700,580 2050,720 L 2050,1100 L -100,1100 Z"
              fill="url(#distantHillsGrad)"
              opacity="0.65"
            />

            {/* Layer 3: Middle Rolling Green Hills */}
            <path
              d="M -100,820 Q 300,680 750,780 T 1550,760 Q 1850,710 2050,830 L 2050,1100 L -100,1100 Z"
              fill="url(#midMeadowGrad)"
            />

            {/* Mid-Hill Trees with Subtle Ambient Breeze */}
            {/* Layer 4: Foreground Lush Rolling Meadows */}
            <path
              d="M -50,910 Q 350,810 850,890 T 1600,870 Q 1850,820 2000,900 L 2000,1100 L -50,1100 Z"
              fill="url(#foreHillGrad)"
            />

            {/* Foreground Left Big Cartoon Tree with Highlights */}
            <g transform="translate(110, 830)">
              <rect
                x="-16"
                y="80"
                width="32"
                height="180"
                rx="12"
                fill="url(#trunkGrad)"
                stroke="#78350f"
                strokeWidth="3"
              />
              <path
                d="M -16,240 Q -35,265 -50,260 Q -25,240 -10,220"
                fill="#78350f"
              />
              <path
                d="M 16,240 Q 35,265 50,260 Q 25,240 10,220"
                fill="#78350f"
              />
              <g className="animate-tree-rustle">
                <circle
                  cx="0"
                  cy="50"
                  r="85"
                  fill="#15803d"
                  stroke="#14532d"
                  strokeWidth="2.5"
                />
                <circle cx="-55" cy="20" r="65" fill="#16a34a" />
                <circle cx="55" cy="15" r="68" fill="#22c55e" />
                <circle cx="-35" cy="-40" r="60" fill="#4ade80" />
                <circle cx="35" cy="-45" r="62" fill="#86efac" />
                <circle cx="0" cy="-65" r="55" fill="#bbf7d0" />
                {/* Apple / Orange fruits on tree */}
                <circle
                  cx="-30"
                  cy="10"
                  r="10"
                  fill="#ef4444"
                  stroke="#991b1b"
                  strokeWidth="2"
                />
                <circle
                  cx="45"
                  cy="30"
                  r="11"
                  fill="#f97316"
                  stroke="#c2410c"
                  strokeWidth="2"
                />
                <circle
                  cx="15"
                  cy="-35"
                  r="10"
                  fill="#ef4444"
                  stroke="#991b1b"
                  strokeWidth="2"
                />
                <circle
                  cx="-25"
                  cy="-25"
                  r="9"
                  fill="#facc15"
                  stroke="#ca8a04"
                  strokeWidth="2"
                />
              </g>
            </g>

            {/* Foreground Right Big Cartoon Tree */}
            <g transform="translate(1820, 760)">
              <rect
                x="-16"
                y="80"
                width="32"
                height="145"
                rx="12"
                fill="url(#trunkGrad)"
                stroke="#78350f"
                strokeWidth="3"
              />
              <path
                d="M -16,210 Q -35,235 -50,230 Q -25,210 -10,190"
                fill="#78350f"
              />
              <path
                d="M 16,210 Q 35,235 50,230 Q 25,210 10,190"
                fill="#78350f"
              />
              <g className="animate-tree-rustle">
                <circle
                  cx="0"
                  cy="50"
                  r="85"
                  fill="#15803d"
                  stroke="#14532d"
                  strokeWidth="2.5"
                />
                <circle cx="-55" cy="15" r="68" fill="#22c55e" />
                <circle cx="55" cy="20" r="65" fill="#16a34a" />
                <circle cx="-35" cy="-45" r="62" fill="#86efac" />
                <circle cx="35" cy="-40" r="60" fill="#4ade80" />
                <circle cx="0" cy="-65" r="55" fill="#bbf7d0" />
                {/* Fruits */}
                <circle
                  cx="-35"
                  cy="25"
                  r="10"
                  fill="#ef4444"
                  stroke="#991b1b"
                  strokeWidth="2"
                />
                <circle
                  cx="30"
                  cy="10"
                  r="11"
                  fill="#f97316"
                  stroke="#c2410c"
                  strokeWidth="2"
                />
                <circle
                  cx="-15"
                  cy="-35"
                  r="10"
                  fill="#ef4444"
                  stroke="#991b1b"
                  strokeWidth="2"
                />
                <circle
                  cx="25"
                  cy="-25"
                  r="9"
                  fill="#facc15"
                  stroke="#ca8a04"
                  strokeWidth="2"
                />
              </g>
            </g>

            {/* Decorative Bushes, Rocks & Flowers Along the Bottom Terrain */}
            {/* Left Bush & Rocks */}
            <g transform="translate(240, 940)">
              <ellipse
                cx="0"
                cy="15"
                rx="60"
                ry="32"
                fill="#16a34a"
                stroke="#14532d"
                strokeWidth="2"
              />
              <ellipse cx="-35" cy="5" rx="42" ry="26" fill="#22c55e" />
              <ellipse cx="30" cy="0" rx="46" ry="28" fill="#4ade80" />
              {/* Rock */}
              <path
                d="M -70,25 C -75,5 -45,-5 -30,12 C -20,25 -50,32 -70,25 Z"
                fill="#94a3b8"
                stroke="#64748b"
                strokeWidth="3"
              />
              <path
                d="M -50,15 C -55,0 -35,-8 -25,5 C -15,18 -35,22 -50,15 Z"
                fill="#cbd5e1"
              />
            </g>

            {/* Right Bush & Rocks */}
            <g transform="translate(1680, 950)">
              <ellipse
                cx="0"
                cy="15"
                rx="65"
                ry="34"
                fill="#15803d"
                stroke="#14532d"
                strokeWidth="2"
              />
              <ellipse cx="-35" cy="0" rx="48" ry="28" fill="#4ade80" />
              <ellipse cx="30" cy="5" rx="44" ry="26" fill="#22c55e" />
              {/* Smooth Boulder */}
              <path
                d="M 40,25 C 35,5 65,-5 80,12 C 90,25 60,32 40,25 Z"
                fill="#94a3b8"
                stroke="#64748b"
                strokeWidth="3"
              />
            </g>

            {/* Colorful Cartoon Flowers & Mushrooms across Meadow */}
            {/* Flower 1 - Pink */}
            <g transform="translate(420, 930)" className="animate-flower-sway">
              <path
                d="M 0,25 Q 4,10 0,0"
                fill="none"
                stroke="#15803d"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <ellipse
                cx="-6"
                cy="12"
                rx="7"
                ry="4"
                fill="#4ade80"
                transform="rotate(-30 -6 12)"
              />
              <circle
                cx="0"
                cy="0"
                r="14"
                fill="#f472b6"
                stroke="#db2777"
                strokeWidth="1.5"
              />
              <circle cx="-8" cy="-6" r="9" fill="#fb7185" />
              <circle cx="8" cy="-6" r="9" fill="#fb7185" />
              <circle cx="-8" cy="6" r="9" fill="#fb7185" />
              <circle cx="8" cy="6" r="9" fill="#fb7185" />
              <circle
                cx="0"
                cy="0"
                r="7"
                fill="#fde047"
                stroke="#ca8a04"
                strokeWidth="1.5"
              />
            </g>

            {/* Flower 2 - Sunflower Yellow */}
            <g transform="translate(620, 960)" className="animate-flower-sway">
              <path
                d="M 0,28 Q -3,12 0,0"
                fill="none"
                stroke="#15803d"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <circle
                cx="0"
                cy="0"
                r="16"
                fill="#facc15"
                stroke="#ca8a04"
                strokeWidth="1.5"
              />
              <circle cx="0" cy="-10" r="8" fill="#fde047" />
              <circle cx="10" cy="0" r="8" fill="#fde047" />
              <circle cx="0" cy="10" r="8" fill="#fde047" />
              <circle cx="-10" cy="0" r="8" fill="#fde047" />
              <circle cx="0" cy="0" r="8" fill="#92400e" />
            </g>

            {/* Cute Red Spotted Mushroom */}
            <g transform="translate(780, 975)">
              <path
                d="M -8,20 L -6,5 Q 0,4 6,5 L 8,20 Z"
                fill="#f8fafc"
                stroke="#cbd5e1"
                strokeWidth="2"
              />
              <ellipse
                cx="0"
                cy="5"
                rx="22"
                ry="16"
                fill="#ef4444"
                stroke="#b91c1c"
                strokeWidth="2.5"
              />
              <circle cx="-10" cy="0" r="4" fill="#ffffff" />
              <circle cx="6" cy="-2" r="5" fill="#ffffff" />
              <circle cx="0" cy="8" r="3.5" fill="#ffffff" />
            </g>

            {/* Flower 3 - Cyan Blue */}
            <g transform="translate(1150, 970)" className="animate-flower-sway">
              <path
                d="M 0,25 Q 3,10 0,0"
                fill="none"
                stroke="#15803d"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <circle
                cx="0"
                cy="0"
                r="14"
                fill="#38bdf8"
                stroke="#0284c7"
                strokeWidth="1.5"
              />
              <circle cx="-7" cy="-7" r="8" fill="#67e8f9" />
              <circle cx="7" cy="-7" r="8" fill="#67e8f9" />
              <circle cx="-7" cy="7" r="8" fill="#67e8f9" />
              <circle cx="7" cy="7" r="8" fill="#67e8f9" />
              <circle cx="0" cy="0" r="6" fill="#fef08a" />
            </g>

            {/* Flower 4 - Violet Purple */}
            <g transform="translate(1360, 940)" className="animate-flower-sway">
              <path
                d="M 0,26 Q -4,12 0,0"
                fill="none"
                stroke="#15803d"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <circle
                cx="0"
                cy="0"
                r="15"
                fill="#a855f7"
                stroke="#7e22ce"
                strokeWidth="1.5"
              />
              <circle cx="-8" cy="-6" r="9" fill="#c084fc" />
              <circle cx="8" cy="-6" r="9" fill="#c084fc" />
              <circle cx="-8" cy="6" r="9" fill="#c084fc" />
              <circle cx="8" cy="6" r="9" fill="#c084fc" />
              <circle
                cx="0"
                cy="0"
                r="7"
                fill="#fde047"
                stroke="#ca8a04"
                strokeWidth="1.5"
              />
            </g>

            {/* Cute Little Mushroom */}
            <g transform="translate(1500, 965)">
              <path
                d="M -6,18 L -4,4 Q 0,3 4,4 L 6,18 Z"
                fill="#f8fafc"
                stroke="#cbd5e1"
                strokeWidth="2"
              />
              <ellipse
                cx="0"
                cy="4"
                rx="18"
                ry="14"
                fill="#f97316"
                stroke="#c2410c"
                strokeWidth="2"
              />
              <circle cx="-7" cy="0" r="3.5" fill="#ffffff" />
              <circle cx="5" cy="-1" r="4" fill="#ffffff" />
            </g>

            {/* Grass Tufts sprinkled in foreground */}
            {[480, 560, 720, 880, 980, 1080, 1260, 1440, 1580].map((gx, i) => (
              <g key={i} transform={`translate(${gx}, 990)`}>
                <path
                  d="M -8,12 Q -14,0 -18,-8 Q -10,-2 -4,12"
                  fill="#86efac"
                />
                <path d="M 0,12 Q 0,-4 2,-14 Q 4,-2 6,12" fill="#4ade80" />
                <path d="M 8,12 Q 14,0 18,-8 Q 10,-2 4,12" fill="#86efac" />
              </g>
            ))}
          </svg>

          {/* Fluffy Cartoon Clouds with Calm Floating Motion */}
          <div
            style={{
              position: "absolute",
              top: "4%",
              left: "5%",
              fontSize: "5.2rem",
              opacity: 0.9,
              filter: "drop-shadow(0 8px 12px rgba(2, 132, 199, 0.2))",
            }}
            className="animate-float-slow"
          >
            ☁️
          </div>
          <div
            style={{
              position: "absolute",
              top: "8%",
              left: "26%",
              fontSize: "4.2rem",
              opacity: 0.82,
              filter: "drop-shadow(0 6px 10px rgba(2, 132, 199, 0.18))",
            }}
            className="animate-float-slow"
          >
            ☁️
          </div>
          <div
            style={{
              position: "absolute",
              top: "3%",
              right: "22%",
              fontSize: "5.8rem",
              opacity: 0.88,
              filter: "drop-shadow(0 8px 12px rgba(2, 132, 199, 0.2))",
            }}
            className="animate-float-slow"
          >
            ☁️
          </div>

          {/* Animated Flying Cartoon Butterflies */}
          <div
            style={{
              position: "absolute",
              top: "45%",
              left: "18%",
              fontSize: "2.6rem",
              filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.15))",
            }}
            className="animate-butterfly"
          >
            🦋
          </div>
          <div
            style={{
              position: "absolute",
              top: "52%",
              right: "20%",
              fontSize: "2.4rem",
              filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.15))",
              animationDelay: "3.5s",
            }}
            className="animate-butterfly"
          >
            🦋
          </div>

          {/* Floating Gentle Leaves & Magic Sparkles */}
          <div
            style={{
              position: "absolute",
              top: "38%",
              left: "12%",
              fontSize: "1.8rem",
              opacity: 0.85,
            }}
            className="animate-leaf"
          >
            🍃
          </div>
          <div
            style={{
              position: "absolute",
              top: "42%",
              right: "14%",
              fontSize: "1.9rem",
              opacity: 0.85,
              animationDelay: "4s",
            }}
            className="animate-leaf"
          >
            🍁
          </div>
          <div
            style={{
              position: "absolute",
              top: "22%",
              left: "38%",
              fontSize: "2.2rem",
              color: "#fef08a",
            }}
            className="animate-sparkle"
          >
            ✨
          </div>
          <div
            style={{
              position: "absolute",
              top: "28%",
              right: "34%",
              fontSize: "2.4rem",
              color: "#fde047",
              animationDelay: "2s",
            }}
            className="animate-sparkle"
          >
            ⭐
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. MAIN MENU SCREEN                                                       */}
      {/* ========================================================================= */}
      {currentScreen === "main-menu" && (
        <div
          className="animate-pop"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "3.2rem",
            textAlign: "center",
            zIndex: 10,
            padding: "20px",
            transform: "translateY(-28px)",
          }}
        >
          {/* Game Title & Grade 5 Badge */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "18px",
            }}
          >
            {/* Grade 5 Badge */}
            <div
              style={{
                background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                color: "#FFFFFF",
                padding: "12px 42px",
                borderRadius: "9999px",
                fontSize: "clamp(1.6rem, 3.2cqw, 2.4rem)",
                fontWeight: 900,
                letterSpacing: "3px",
                textTransform: "uppercase",
                border: "5px solid #fef08a",
                boxShadow: "0 10px 0 #92400e, 0 16px 25px rgba(0,0,0,0.3)",
                display: "flex",
                alignItems: "center",
                gap: "14px",
                textShadow: "0 3px 6px rgba(0,0,0,0.5)",
              }}
            >
              <span style={{ fontSize: "1.2em" }}>⭐</span>
              <span>{gameSubtitle}</span>
              <span style={{ fontSize: "1.2em" }}>⭐</span>
            </div>

            {/* Main Game Name */}
            <h1
              style={{
                fontSize: "clamp(4.8rem, 11cqw, 7.8rem)",
                fontWeight: 900,
                color: "#FFFFFF",
                textShadow:
                  "0 10px 0 #0284c7, 0 18px 0 #0369a1, 0 28px 45px rgba(0,0,0,0.45)",
                letterSpacing: "4px",
                margin: 0,
                lineHeight: 1.05,
              }}
            >
              {gameTitle}
            </h1>
          </div>

          {/* ONE large Play button -> directly launches Shooter Game */}
          <button
            onClick={() => {
              sfx.playPop();
              sfx.startBGM();
              setCurrentScreen("equation-shooter");
            }}
            className="btn-3d"
            style={{
              position: "relative",
              overflow: "hidden",
              fontSize: "clamp(2.28rem, 5.225cqw, 3.42rem)",
              fontWeight: 900,
              color: "#FFFFFF",
              background:
                "linear-gradient(180deg, #ff6b6b 0%, #ee5253 50%, #d63031 100%)",
              border: "5.7px solid #FFFFFF",
              borderRadius: "9999px",
              padding: "22.8px 91.2px",
              cursor: "pointer",
              letterSpacing: "2px",
              boxShadow:
                "0 11.4px 0 #9b1d1d, 0 19px 28px rgba(238, 82, 83, 0.45)",
              textShadow: "0 3px 0 #9b1d1d, 0 6px 12px rgba(0,0,0,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "11px",
            }}
          >
            {/* Top specular highlight pill */}
            <div
              style={{
                position: "absolute",
                top: "5px",
                left: "12%",
                width: "76%",
                height: "35%",
                borderRadius: "9999px",
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.65) 0%, rgba(255,255,255,0.05) 100%)",
                pointerEvents: "none",
              }}
            />

            {/* Subtle diagonal shine sweep */}
            <div className="btn-shine" />

            {/* Play Button Label & Play Icon */}
            <span style={{ fontSize: "1.1em", transform: "translateY(-1px)" }}>
              ▶
            </span>
            <span>PLAY</span>
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DYNAMIC TOP-LEFT TOOLBAR: Slot 0 Settings Button (MainMenu)                */}
      {/* Standard global icon button: 96px, centre anchored at (100, 100) per       */}
      {/* .agents ui-layout.md. Kept as a direct child of the stage so it is not     */}
      {/* offset by the menu content wrapper's translate transform.                  */}
      {/* ========================================================================= */}
      {currentScreen === "main-menu" && (
        <div
          style={{
            position: "absolute",
            top: "52px",
            left: "52px",
            zIndex: 30,
          }}
        >
          <button
            onClick={() => {
              sfx.playPop();
              setShowSettings(true);
            }}
            className="btn-3d"
            title="Game Settings"
            style={{
              background: "#FFFFFF",
              color: "#0284c7",
              border: "4px solid #bae6fd",
              borderRadius: "50%",
              width: "96px",
              height: "96px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 6px 0 #7dd3fc",
              cursor: "pointer",
            }}
          >
            <Settings size={42} />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. MAIN MENU SETTINGS MODAL (LAYER 3 MODAL)                               */}
      {/* ========================================================================= */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />

      {/* ========================================================================= */}
      {/* 3. EQUATION SHOOTER SCREEN                                                */}
      {/* ========================================================================= */}
      {currentScreen === "equation-shooter" && (
        <EquationShooter onBack={() => setCurrentScreen("main-menu")} />
      )}
    </div>
  );
}

export default App;
