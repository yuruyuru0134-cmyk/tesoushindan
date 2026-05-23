// 黄金角（137.508°）を使って星を均等分散配置（SSRとのhyration不整合を避けるため乱数なし）
const STARS = Array.from({ length: 160 }, (_, i) => {
  const phi = i * 137.508;
  const r = [0.5, 0.7, 0.9, 1.3, 1.8, 2.4][i % 6];
  const opacity = 0.15 + (i % 8) * 0.09;
  return {
    cx: `${((phi * 2.7183) % 1000).toFixed(1)}`,
    cy: `${((i * 973.141) % 1000).toFixed(1)}`,
    r,
    opacity: +opacity.toFixed(2),
    dur: `${3 + (i % 7)}s`,
    begin: `-${(i % 11) + (i % 3) * 0.5}s`,
    glow: r >= 1.8,
  };
});

// 星雲の光班（ふわっとした色の霧）
const NEBULAE = [
  { cx: 200, cy: 300, rx: 220, ry: 160, color: "oklch(0.55 0.18 280 / 6%)" },
  { cx: 750, cy: 180, rx: 180, ry: 120, color: "oklch(0.65 0.15 320 / 5%)" },
  { cx: 600, cy: 750, rx: 250, ry: 180, color: "oklch(0.60 0.20 260 / 5%)" },
  { cx: 100, cy: 800, rx: 160, ry: 110, color: "oklch(0.70 0.12 85 / 4%)" },
];

export function StarField() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <svg
        viewBox="0 0 1000 1000"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* 大きい星用のグロー */}
          <filter id="sf-glow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {/* 星雲用のブラー */}
          <filter id="sf-nebula" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="30" />
          </filter>
        </defs>

        {/* 星雲（背景の霞） */}
        {NEBULAE.map((n, i) => (
          <ellipse
            key={`nebula-${i}`}
            cx={n.cx}
            cy={n.cy}
            rx={n.rx}
            ry={n.ry}
            fill={n.color}
            filter="url(#sf-nebula)"
          />
        ))}

        {/* 星 */}
        {STARS.map((s, i) => (
          <circle
            key={i}
            cx={s.cx}
            cy={s.cy}
            r={s.r}
            fill="white"
            filter={s.glow ? "url(#sf-glow)" : undefined}
          >
            <animate
              attributeName="opacity"
              values={`${s.opacity};0.03;${s.opacity}`}
              dur={s.dur}
              repeatCount="indefinite"
              begin={s.begin}
              calcMode="spline"
              keySplines="0.4 0 0.6 1; 0.4 0 0.6 1"
              keyTimes="0;0.5;1"
            />
          </circle>
        ))}
      </svg>
    </div>
  );
}
