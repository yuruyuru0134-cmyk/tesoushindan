"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ImageUploader } from "@/components/palm/ImageUploader";
import { ThemeSelector } from "@/components/palm/ThemeSelector";
import { ResultCanvas } from "@/components/palm/ResultCanvas";
import { DiagnoseResultCard } from "@/components/palm/DiagnoseResult";
import { DiagnoseResult, DiagnoseThemeKey } from "@/types/palm";

type DiagnoseState = "idle" | "loading" | "done";

interface HandImage {
  file: File;
  previewUrl: string;
}

export default function DiagnosePage() {
  const [leftHand, setLeftHand] = useState<HandImage | null>(null);
  const [rightHand, setRightHand] = useState<HandImage | null>(null);
  const [selectedThemes, setSelectedThemes] = useState<DiagnoseThemeKey[]>(["overall"]);
  const [state, setState] = useState<DiagnoseState>("idle");
  const [results, setResults] = useState<DiagnoseResult[]>([]);

  const handleLeft = useCallback((file: File, url: string) => {
    setLeftHand(file ? { file, previewUrl: url } : null);
    setResults([]);
    setState("idle");
  }, []);

  const handleRight = useCallback((file: File, url: string) => {
    setRightHand(file ? { file, previewUrl: url } : null);
    setResults([]);
    setState("idle");
  }, []);

  const handleDiagnose = async () => {
    if (!leftHand && !rightHand) {
      toast.error("左手か右手、どちらかの画像をアップロードしてください");
      return;
    }
    if (selectedThemes.length === 0) {
      toast.error("診断内容を1つ以上選択してください");
      return;
    }

    setState("loading");
    try {
      const formData = new FormData();
      if (leftHand) formData.append("imageLeft", leftHand.file);
      if (rightHand) formData.append("imageRight", rightHand.file);
      formData.append("selectedThemes", JSON.stringify(selectedThemes));

      const res = await fetch("/api/diagnose", { method: "POST", body: formData });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "診断に失敗しました");
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let received = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (!raw) continue;

          let parsed: { type: string; results?: DiagnoseResult[]; message?: string };
          try {
            parsed = JSON.parse(raw);
          } catch {
            continue;
          }

          if (parsed.type === "result" && parsed.results) {
            const correctHand = !rightHand ? "left" : !leftHand ? "right" : null;
            const normalized = correctHand
              ? parsed.results.map((r) => ({ ...r, hand: correctHand as DiagnoseResult["hand"] }))
              : parsed.results;
            setResults(normalized);
            setState("done");
            toast.success("診断が完了しました");
            received = true;
          } else if (parsed.type === "error") {
            throw new Error(parsed.message ?? "診断に失敗しました");
          }
        }
      }

      if (!received) throw new Error("診断結果が受信できませんでした。再度お試しください。");
    } catch (err) {
      setState("idle");
      toast.error(err instanceof Error ? err.message : "診断に失敗しました");
    }
  };

  const handleReset = () => {
    setLeftHand(null);
    setRightHand(null);
    setResults([]);
    setState("idle");
  };

  const hasAnyImage = !!(leftHand || rightHand);
  const isBoth = !!(leftHand && rightHand);

  // 左右別に結果を分類（hand フィールドが未設定の場合は両手に表示）
  const leftResults = isBoth
    ? results.filter((r) => !r.hand || r.hand === "left" || r.hand === "both")
    : results;
  const rightResults = isBoth
    ? results.filter((r) => !r.hand || r.hand === "right" || r.hand === "both")
    : results;

  return (
    <div className="min-h-screen relative">
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
            <span className="text-sm tracking-[0.15em] font-light" style={{ fontFamily: "var(--font-cormorant), serif" }}>
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
        <div className="text-center mb-10 space-y-2">
          <p className="text-[oklch(0.78_0.12_85)] text-xs tracking-[0.3em] uppercase font-light">✦ Palm Reading ✦</p>
          <h1 className="text-2xl md:text-3xl font-light tracking-[0.1em] text-[oklch(0.94_0.01_80)]" style={{ fontFamily: "var(--font-cormorant), serif" }}>
            手相を診断する
          </h1>
        </div>

        {state !== "done" ? (
          <div className="max-w-3xl mx-auto space-y-6">
            {/* 左右アップロードエリア */}
            <div className="grid grid-cols-2 gap-4">
              {(["left", "right"] as const).map((side) => {
                const hand = side === "left" ? leftHand : rightHand;
                const label = side === "left" ? "左手" : "右手";
                const meaning = side === "left" ? "先天的な才能・過去" : "現在〜未来の運勢";
                return (
                  <div key={side} className="space-y-2">
                    <div className="flex flex-col">
                      <span className="text-[oklch(0.78_0.12_85)] text-sm tracking-wider font-light">{label}</span>
                      <span className="text-[oklch(0.45_0.01_80)] text-xs tracking-wide">{meaning}</span>
                    </div>
                    <ImageUploader
                      onImageSelect={side === "left" ? handleLeft : handleRight}
                      previewUrl={hand?.previewUrl ?? null}
                    />
                  </div>
                );
              })}
            </div>

            {/* 診断テーマ + ボタン */}
            <ThemeSelector selected={selectedThemes} onChange={setSelectedThemes} />

            <Button
              onClick={handleDiagnose}
              disabled={!hasAnyImage || selectedThemes.length === 0 || state === "loading"}
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
                `✦ ${isBoth ? "両手を診断する" : "診断する"}`
              )}
            </Button>
          </div>
        ) : (
          /* 結果エリア */
          <div className="max-w-4xl mx-auto space-y-8">
            {/* 両手の場合は2カラム、片手は1カラム */}
            <div className={`grid gap-6 ${isBoth ? "md:grid-cols-2" : "max-w-xl mx-auto"}`}>
              {leftHand && (
                <div className="space-y-3">
                  <div>
                    <p className="text-[oklch(0.78_0.12_85)] text-sm tracking-wider font-light">左手</p>
                    <p className="text-[oklch(0.45_0.01_80)] text-xs tracking-wide">先天的な才能・過去</p>
                  </div>
                  <ResultCanvas imageUrl={leftHand.previewUrl} results={leftResults} />
                </div>
              )}
              {rightHand && (
                <div className="space-y-3">
                  <div>
                    <p className="text-[oklch(0.78_0.12_85)] text-sm tracking-wider font-light">右手</p>
                    <p className="text-[oklch(0.45_0.01_80)] text-xs tracking-wide">現在〜未来の運勢</p>
                  </div>
                  <ResultCanvas imageUrl={rightHand.previewUrl} results={rightResults} />
                </div>
              )}
            </div>

            {/* 診断テキスト */}
            <DiagnoseResultCard results={results} isBoth={isBoth} />
          </div>
        )}
      </main>
    </div>
  );
}
