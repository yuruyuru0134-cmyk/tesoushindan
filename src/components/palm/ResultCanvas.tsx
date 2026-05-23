"use client";

import { useEffect, useRef, useCallback } from "react";
import { DiagnoseResult } from "@/types/palm";

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
  const imgRef = useRef<HTMLImageElement>(null);

  const drawLines = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !img.complete || img.naturalWidth === 0) return;

    const rect = img.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    if (w === 0 || h === 0) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

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
      ctx.moveTo(first[0] * w, first[1] * h);
      rest.forEach(([x, y]) => ctx.lineTo(x * w, y * h));
      ctx.stroke();

      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
    });
  }, [results]);

  useEffect(() => {
    drawLines();
  }, [drawLines]);

  // リサイズ時にキャンバスを再描画
  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;
    const ro = new ResizeObserver(() => drawLines());
    ro.observe(img);
    return () => ro.disconnect();
  }, [drawLines]);

  const legendItems = results
    .filter((r) => r.coordinates && r.coordinates.length >= 2)
    .map((r) => ({
      label: r.label,
      color: THEME_COLORS[r.theme ?? "overall"] ?? "#c9a84c",
    }));

  return (
    <div className="space-y-2">
      <div className="relative w-full rounded-2xl overflow-hidden bg-[oklch(0.10_0.02_280)]">
        <img
          ref={imgRef}
          src={imageUrl}
          alt="手相"
          className="w-full h-auto block"
          onLoad={drawLines}
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 pointer-events-none"
        />
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
