"use client";

import { Badge } from "@/components/ui/badge";
import { DiagnoseResult as DiagnoseResultType, DIAGNOSE_THEMES } from "@/types/palm";

const HAND_BADGE: Record<string, { label: string; color: string }> = {
  left: { label: "左手", color: "#7ab8e0" },
  right: { label: "右手", color: "#e07ab0" },
  both: { label: "両手", color: "#c9a84c" },
};

interface Props {
  results: DiagnoseResultType[];
  isBoth?: boolean;
}

export function DiagnoseResultCard({ results, isBoth }: Props) {
  return (
    <div className="space-y-4">
      <h3 className="text-[oklch(0.78_0.12_85)] text-sm tracking-[0.15em] font-light">
        診断結果{isBoth ? "（左右比較）" : ""}
      </h3>
      <div className="space-y-3">
        {results.map((result, i) => {
          const themeInfo = DIAGNOSE_THEMES.find((t) => t.key === result.theme);
          const handInfo = result.hand ? HAND_BADGE[result.hand] : null;
          return (
            <div
              key={`${result.theme}-${result.hand}-${i}`}
              className="p-4 rounded-xl border border-[oklch(1_0_0/10%)] bg-[oklch(0.15_0.025_280)] space-y-2"
            >
              <div className="flex items-center gap-2 flex-wrap">
                {themeInfo && (
                  <span className="text-[oklch(0.78_0.12_85)] text-sm">{themeInfo.icon}</span>
                )}
                <Badge
                  variant="outline"
                  className="text-xs tracking-wider font-light border-[oklch(0.78_0.12_85/40%)] text-[oklch(0.78_0.12_85)] bg-[oklch(0.78_0.12_85/8%)]"
                >
                  {result.label}
                </Badge>
                {handInfo && (
                  <Badge
                    variant="outline"
                    className="text-xs tracking-wider font-light"
                    style={{
                      borderColor: `${handInfo.color}50`,
                      color: handInfo.color,
                      backgroundColor: `${handInfo.color}12`,
                    }}
                  >
                    {handInfo.label}
                  </Badge>
                )}
              </div>
              <p className="text-[oklch(0.80_0.01_80)] text-sm leading-relaxed tracking-wide font-light">
                {result.description}
              </p>
              {result.lines && result.lines.length > 0 && (
                <div className="flex gap-1.5 flex-wrap pt-1">
                  {result.lines.map((line) => (
                    <span
                      key={line}
                      className="text-[oklch(0.50_0.01_80)] text-xs border border-[oklch(1_0_0/10%)] rounded-full px-2 py-0.5 tracking-wide"
                    >
                      {line}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
