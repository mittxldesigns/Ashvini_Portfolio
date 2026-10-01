const marks = [
  [9, 22, "(016, 004)", 0.065],
  [70, 17, "(048, 012)", 0.075],
  [6, 49, "x 07 / y 24", 0.045],
  [62, 72, "(031, 052)", 0.08],
  [14, 91, "x 12 / y 63", 0.04],
  [72, 93, "(+04, -02)", 0.06],
];

export default function SketchPaper() {
  return (
    <svg className="sk-paper" aria-hidden="true">
      <defs>
        <filter id="sk-wobble" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" seed="11" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="1.2" />
        </filter>
        <filter id="sk-rough">
          <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="3" seed="4" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="3.4" />
        </filter>
        <filter id="sk-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" seed="2" />
          <feColorMatrix values="0 0 0 0 0.4  0 0 0 0 0.38  0 0 0 0 0.35  0 0 0 0.07 0" />
        </filter>
        <filter id="sk-smudge"><feGaussianBlur stdDeviation="28" /></filter>
        <filter id="sk-grid-fade" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.003 0.005" numOctaves="2" seed="17" />
          <feGaussianBlur stdDeviation="12" />
          <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  1.8 0 0 0 -0.65" />
        </filter>
        <mask id="sk-grid-wear" x="0" y="0" width="100%" height="100%" maskUnits="userSpaceOnUse" style={{ maskType: "alpha" }}>
          <rect width="100%" height="100%" filter="url(#sk-grid-fade)" />
        </mask>
        <pattern id="sk-grid" width="16" height="16" patternUnits="userSpaceOnUse">
          <path d="M16 .3 C10 -.3 5 .5 0 .1 M.2 0 C-.3 5 .5 10 .1 16" fill="none" stroke="#6f7984" strokeWidth="0.45" strokeOpacity="0.14" />
        </pattern>
        <pattern id="sk-grid-major" width="64" height="64" patternUnits="userSpaceOnUse">
          <path d="M64 .2 C42 .7 20 -.5 0 .2 M.2 0 C.7 20 -.5 42 .2 64" fill="none" stroke="#6f7984" strokeWidth="0.5" strokeOpacity="0.1" />
          <path d="M61 0h3v3" fill="none" stroke="#6f7984" strokeWidth="0.4" strokeOpacity="0.12" />
        </pattern>
      </defs>
      <g mask="url(#sk-grid-wear)" filter="url(#sk-wobble)">
        <rect width="100%" height="100%" fill="url(#sk-grid)" />
        <rect width="100%" height="100%" fill="url(#sk-grid-major)" />
      </g>
      <g fill="#62707f" stroke="#62707f" strokeWidth="0.5" fontFamily="Courier Prime, Courier New, monospace" fontSize="9">
        {marks.map(([x, y, label, opacity]) => (
          <svg key={label} x={`${x}%`} y={`${y}%`} width="80" height="16" overflow="visible" opacity={opacity}>
            <path d="M0 3h5M2.5 .5v5" fill="none" />
            <text x="9" y="6" stroke="none">{label}</text>
          </svg>
        ))}
      </g>
      <ellipse cx="82%" cy="18%" rx="180" ry="90" fill="#9aa0a6" opacity="0.045" filter="url(#sk-smudge)" />
      <ellipse cx="12%" cy="78%" rx="220" ry="110" fill="#9aa0a6" opacity="0.04" filter="url(#sk-smudge)" />
      <rect width="100%" height="100%" filter="url(#sk-grain)" />
    </svg>
  );
}
