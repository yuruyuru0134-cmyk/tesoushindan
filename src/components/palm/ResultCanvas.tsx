"use client";

import { useEffect, useRef } from "react";
import { DiagnoseResult, PALM_LINES } from "@/types/palm";

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

      // 各ラインの座標を描画
      results.forEach((result) => {
        if (!result.coordinates || result.coordinates.length < 2) return;
        const lineInfo = PALM_LINES.find((l) => l.key === result.line);
        if (!lineInfo) return;

        ctx.beginPath();
        ctx.strokeStyle = lineInfo.color;
        ctx.lineWidth = 2.5;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.shadowColor = lineInfo.color;
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

  return (
    <div ref={containerRef} className="w-full rounded-2xl overflow-hidden bg-[oklch(0.10_0.02_280)]">
      <canvas ref={canvasRef} className="w-full h-auto" />
    </div>
  );
}
