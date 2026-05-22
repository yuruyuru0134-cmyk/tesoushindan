import Link from "next/link";

const PALM_LINES = [
  { name: "生命線", color: "#e05f5f" },
  { name: "感情線", color: "#e07ab0" },
  { name: "頭脳線", color: "#7ab8e0" },
  { name: "運命線", color: "#c9a84c" },
  { name: "太陽線", color: "#e0c06e" },
  { name: "結婚線", color: "#b07ae0" },
];

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      {/* 背景装飾 */}
      <div className="absolute inset-0 bg-gradient-to-b from-[oklch(0.08_0.03_280)] via-[oklch(0.12_0.02_280)] to-[oklch(0.10_0.025_260)]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-[oklch(0.78_0.12_85/4%)] blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-[oklch(0.6_0.15_280/6%)] blur-3xl pointer-events-none" />

      {/* コンテンツ */}
      <div className="relative z-10 text-center px-6 max-w-2xl mx-auto flex flex-col items-center gap-10">

        {/* タイトル */}
        <div className="flex flex-col items-center gap-3">
          <div className="text-[oklch(0.78_0.12_85)] text-5xl mb-2 select-none">✦</div>
          <h1
            className="text-4xl md:text-5xl font-light tracking-[0.15em] text-[oklch(0.94_0.01_80)]"
            style={{ fontFamily: "var(--font-cormorant), serif" }}
          >
            手相診てみます
          </h1>
          <p className="text-[oklch(0.78_0.12_85)] tracking-[0.3em] text-xs font-light uppercase">
            Palm Reading
          </p>
        </div>

        {/* 説明文 */}
        <p className="text-[oklch(0.65_0.02_80)] leading-relaxed tracking-wider text-sm md:text-base font-light">
          手のひらには、あなたの過去・現在・未来が刻まれています。<br />
          画像をアップロードすると、AIが手相を丁寧に読み解きます。
        </p>

        {/* 区切り */}
        <div className="flex items-center gap-4 w-full max-w-xs">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent to-[oklch(0.78_0.12_85/40%)]" />
          <span className="text-[oklch(0.78_0.12_85)] text-xs">✦</span>
          <div className="flex-1 h-px bg-gradient-to-l from-transparent to-[oklch(0.78_0.12_85/40%)]" />
        </div>

        {/* CTA */}
        <Link
          href="/diagnose"
          className="inline-flex items-center justify-center rounded-lg bg-[oklch(0.78_0.12_85)] hover:bg-[oklch(0.72_0.12_85)] text-[oklch(0.12_0.02_280)] font-medium tracking-[0.15em] px-10 py-4 text-sm transition-all duration-300 hover:shadow-[0_0_30px_oklch(0.78_0.12_85/30%)]"
        >
          診断をはじめる
        </Link>

        {/* 手相ライン凡例 */}
        <div className="grid grid-cols-3 gap-x-8 gap-y-3 mt-2">
          {PALM_LINES.map((line) => (
            <div key={line.name} className="flex items-center gap-2">
              <div
                className="w-4 h-0.5 rounded-full opacity-70"
                style={{ backgroundColor: line.color }}
              />
              <span className="text-[oklch(0.65_0.02_80)] text-xs tracking-wide">{line.name}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
