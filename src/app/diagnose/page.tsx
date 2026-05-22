"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ImageUploader } from "@/components/palm/ImageUploader";
import { ThemeSelector } from "@/components/palm/ThemeSelector";
import { HandSelector } from "@/components/palm/HandSelector";
import { ResultCanvas } from "@/components/palm/ResultCanvas";
import { DiagnoseResultCard } from "@/components/palm/DiagnoseResult";
import { DiagnoseResult, HandType, DiagnoseThemeKey } from "@/types/palm";

type DiagnoseState = "idle" | "loading" | "done";

export default function DiagnosePage() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedThemes, setSelectedThemes] = useState<DiagnoseThemeKey[]>(["overall"]);
  const [handType, setHandType] = useState<HandType>("right");
  const [state, setState] = useState<DiagnoseState>("idle");
  const [results, setResults] = useState<DiagnoseResult[]>([]);

  const handleImageSelect = useCallback((file: File, url: string) => {
    if (!file) {
      setImageFile(null);
      setPreviewUrl(null);
      setResults([]);
      setState("idle");
      return;
    }
    setImageFile(file);
    setPreviewUrl(url);
    setResults([]);
    setState("idle");
  }, []);

  const handleDiagnose = async () => {
    if (!imageFile) {
      toast.error("手のひら画像をアップロードしてください");
      return;
    }
    if (selectedThemes.length === 0) {
      toast.error("診断内容を1つ以上選択してください");
      return;
    }

    setState("loading");
    try {
      const formData = new FormData();
      formData.append("image", imageFile);
      formData.append("selectedThemes", JSON.stringify(selectedThemes));
      formData.append("handType", handType);

      const res = await fetch("/api/diagnose", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "診断に失敗しました");
      }

      setResults(data.results);
      setState("done");
      toast.success("診断が完了しました");
    } catch (err) {
      setState("idle");
      toast.error(err instanceof Error ? err.message : "診断に失敗しました");
    }
  };

  const handleReset = () => {
    setImageFile(null);
    setPreviewUrl(null);
    setResults([]);
    setState("idle");
  };

  return (
    <div className="min-h-screen relative">
      {/* 背景 */}
      <div className="fixed inset-0 bg-gradient-to-br from-[oklch(0.08_0.03_280)] via-[oklch(0.12_0.02_280)] to-[oklch(0.10_0.025_260)] -z-10" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-[oklch(0.78_0.12_85/3%)] blur-3xl -z-10 pointer-events-none" />

      {/* ヘッダー */}
      <header className="sticky top-0 z-20 border-b border-[oklch(1_0_0/8%)] bg-[oklch(0.10_0.025_280/90%)] backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-[oklch(0.78_0.12_85)] hover:text-[oklch(0.90_0.12_85)] transition-colors"
          >
            <span className="text-sm">←</span>
            <span
              className="text-sm tracking-[0.15em] font-light"
              style={{ fontFamily: "var(--font-cormorant), serif" }}
            >
              手相診てみます
            </span>
          </Link>
          {state === "done" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="text-[oklch(0.65_0.02_80)] hover:text-[oklch(0.85_0.01_80)] text-xs tracking-wide"
            >
              もう一度診断する
            </Button>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* タイトル */}
        <div className="text-center mb-10 space-y-2">
          <p className="text-[oklch(0.78_0.12_85)] text-xs tracking-[0.3em] uppercase font-light">
            ✦ Palm Reading ✦
          </p>
          <h1
            className="text-2xl md:text-3xl font-light tracking-[0.1em] text-[oklch(0.94_0.01_80)]"
            style={{ fontFamily: "var(--font-cormorant), serif" }}
          >
            手相を診断する
          </h1>
        </div>

        {state !== "done" ? (
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* 左: 画像アップロード */}
            <div className="space-y-3">
              <p className="text-[oklch(0.65_0.02_80)] text-xs tracking-wider">
                手のひら画像
              </p>
              <ImageUploader onImageSelect={handleImageSelect} previewUrl={previewUrl} />
            </div>

            {/* 右: 設定 */}
            <div className="space-y-5 flex flex-col">
              <HandSelector selected={handType} onChange={setHandType} />
              <div className="flex-1">
                <ThemeSelector selected={selectedThemes} onChange={setSelectedThemes} />
              </div>
              <Button
                onClick={handleDiagnose}
                disabled={!imageFile || selectedThemes.length === 0 || state === "loading"}
                className="w-full bg-[oklch(0.78_0.12_85)] hover:bg-[oklch(0.72_0.12_85)] disabled:opacity-40 text-[oklch(0.12_0.02_280)] font-medium tracking-[0.15em] py-6 text-sm transition-all duration-300 hover:shadow-[0_0_30px_oklch(0.78_0.12_85/25%)]"
              >
                {state === "loading" ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    診断中...
                  </span>
                ) : (
                  "✦ 診断する"
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* 左: 画像（ライン描画） */}
            <div className="space-y-3">
              <p className="text-[oklch(0.65_0.02_80)] text-xs tracking-wider">
                手相ライン
              </p>
              {previewUrl && <ResultCanvas imageUrl={previewUrl} results={results} />}
            </div>

            {/* 右: テキスト結果 */}
            <div className="space-y-3 overflow-y-auto max-h-[600px]">
              <DiagnoseResultCard results={results} handType={handType} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
