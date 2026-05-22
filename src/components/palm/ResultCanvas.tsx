"use client";

import { useEffect, useRef } from "react";
import { DiagnoseResult, DIAGNOSE_THEMES } from "@/types/palm";

const THEME_COLORS: Record<string, string> = {
  overall: "#c9a84c",
  longevity: "#e05f5f",
  money: "#7ae0a8",
  love: "#e07ab0",
  rarity: "#b07ae0",
  aptitude: "#7ab8e0",
};

interface Props {
  imageUrl: string;
  results: DiagnoseResult[];
}

export function ResultCanvas({ imageUrl, results }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const containerWidth = container.clientWidth;
      const scale = containerWidth / img.naturalWidth;
      canvas.width = containerWidth;
      canvas.height = img.naturalHeight * scale;

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // 各テーマの座標を描画
      results.forEach((result) => {
        if (!result.coordinates || result.coordinates.length < 2) return;
        const color = THEME_COLORS[result.theme ?? "overall"] ?? "#c9a84c";

        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.shadowColor = color;
        ctx.shadowBlur = 8;
        ctx.globalAlpha = 0.85;

        const [first, ...rest] = result.coordinates;
        ctx.moveTo(first[0] * canvas.width, first[1] * canvas.height);
        rest.forEach(([x, y]) => {
          ctx.lineTo(x * canvas.width, y * canvas.height);
        });
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
      });
    };
    img.src = imageUrl;
  }, [imageUrl, results]);

  // 凡例（座標があるテーマのみ表示）
  const legendItems = results
    .filter((r) => r.coordinates && r.coordinates.length >= 2)
    .map((r) => ({
      label: r.label,
      color: THEME_COLORS[r.theme ?? "overall"] ?? "#c9a84c",
    }));

  return (
    <div className="space-y-2">
      <div ref={containerRef} className="w-full rounded-2xl overflow-hidden bg-[oklch(0.10_0.02_280)]">
        <canvas ref={canvasRef} className="w-full h-auto" />
      </div>
      {legendItems.length > 0 && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 px-1">
          {legendItems.map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              <div className="w-4 h-0.5 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-[oklch(0.55_0.01_80)] text-xs tracking-wide">{item.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
