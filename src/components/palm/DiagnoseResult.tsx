"use client";

import { Badge } from "@/components/ui/badge";
import { DiagnoseResult as DiagnoseResultType, PALM_LINES } from "@/types/palm";

interface Props {
  results: DiagnoseResultType[];
}

export function DiagnoseResultCard({ results }: Props) {
  return (
    <div className="space-y-4">
      <h3 className="text-[oklch(0.78_0.12_85)] text-sm tracking-[0.15em] font-light">
        診断結果
      </h3>
      <div className="space-y-3">
        {results.map((result) => {
          const lineInfo = PALM_LINES.find((l) => l.key === result.line);
          return (
            <div
              key={result.line}
              className="p-4 rounded-xl border border-[oklch(1_0_0/10%)] bg-[oklch(0.15_0.025_280)] space-y-2"
            >
              <div className="flex items-center gap-2">
                {lineInfo && (
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: lineInfo.color }}
                  />
                )}
                <Badge
                  variant="outline"
                  className="text-xs tracking-wider font-light"
                  style={
                    lineInfo
                      ? {
                          borderColor: `${lineInfo.color}60`,
                          color: lineInfo.color,
                          backgroundColor: `${lineInfo.color}10`,
                        }
                      : undefined
                  }
                >
                  {result.label}
                </Badge>
              </div>
              <p className="text-[oklch(0.80_0.01_80)] text-sm leading-relaxed tracking-wide font-light">
                {result.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
