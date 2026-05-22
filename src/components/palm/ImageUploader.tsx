"use client";

import { useCallback, useState } from "react";
import Image from "next/image";

interface Props {
  onImageSelect: (file: File, previewUrl: string) => void;
  previewUrl: string | null;
}

export function ImageUploader({ onImageSelect, previewUrl }: Props) {
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) return;
      if (file.size > 10 * 1024 * 1024) return;
      const url = URL.createObjectURL(file);
      onImageSelect(file, url);
    },
    [onImageSelect]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div
      className={`relative rounded-2xl border-2 border-dashed transition-all duration-300 overflow-hidden
        ${isDragging
          ? "border-[oklch(0.78_0.12_85)] bg-[oklch(0.78_0.12_85/8%)]"
          : "border-[oklch(1_0_0/15%)] hover:border-[oklch(0.78_0.12_85/60%)] bg-[oklch(0.15_0.025_280)]"
        }`}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={onDrop}
    >
      {previewUrl ? (
        <div className="relative aspect-square w-full">
          <Image
            src={previewUrl}
            alt="手のひら画像"
            fill
            className="object-contain p-2"
          />
          <button
            onClick={() => onImageSelect(null as unknown as File, "")}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-[oklch(0.12_0.02_280/80%)] border border-[oklch(1_0_0/20%)] text-[oklch(0.65_0.02_80)] hover:text-[oklch(0.94_0.01_80)] flex items-center justify-center text-xs transition-colors"
          >
            ✕
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center gap-4 p-12 cursor-pointer aspect-square">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={onInputChange}
          />
          <div className="w-16 h-16 rounded-full border border-[oklch(0.78_0.12_85/40%)] flex items-center justify-center text-2xl text-[oklch(0.78_0.12_85/70%)]">
            ✋
          </div>
          <div className="text-center">
            <p className="text-[oklch(0.78_0.12_85)] text-sm font-light tracking-wider">
              画像をドロップ
            </p>
            <p className="text-[oklch(0.65_0.02_80)] text-xs mt-1 tracking-wide">
              または クリックして選択
            </p>
          </div>
          <p className="text-[oklch(0.45_0.01_80)] text-xs tracking-wide">
            JPEG / PNG / WebP・最大 10MB
          </p>
        </label>
      )}
    </div>
  );
}
