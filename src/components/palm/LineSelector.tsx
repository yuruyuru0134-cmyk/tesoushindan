"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { PALM_LINES, PalmLineKey } from "@/types/palm";

interface Props {
  selected: PalmLineKey[];
  onChange: (selected: PalmLineKey[]) => void;
}

export function LineSelector({ selected, onChange }: Props) {
  const toggle = (key: PalmLineKey) => {
    if (selected.includes(key)) {
      onChange(selected.filter((k) => k !== key));
    } else {
      onChange([...selected, key]);
    }
  };

  const selectAll = () => onChange(PALM_LINES.map((l) => l.key));
  const clearAll = () => onChange([]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[oklch(0.78_0.12_85)] text-sm tracking-[0.15em] font-light">
          診断する手相を選択
        </h3>
        <div className="flex gap-3">
          <button
            onClick={selectAll}
            className="text-[oklch(0.65_0.02_80)] hover:text-[oklch(0.78_0.12_85)] text-xs tracking-wide transition-colors"
          >
            すべて選択
          </button>
          <span className="text-[oklch(0.45_0.01_80)] text-xs">|</span>
          <button
            onClick={clearAll}
            className="text-[oklch(0.65_0.02_80)] hover:text-[oklch(0.65_0.02_80/70%)] text-xs tracking-wide transition-colors"
          >
            クリア
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {PALM_LINES.map((line) => {
          const isSelected = selected.includes(line.key);
          return (
            <label
              key={line.key}
              className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-200
                ${isSelected
                  ? "border-[oklch(0.78_0.12_85/50%)] bg-[oklch(0.78_0.12_85/8%)]"
                  : "border-[oklch(1_0_0/10%)] bg-[oklch(0.15_0.025_280)] hover:border-[oklch(0.78_0.12_85/30%)]"
                }`}
            >
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => toggle(line.key)}
                className="border-[oklch(1_0_0/20%)] data-[state=checked]:bg-[oklch(0.78_0.12_85)] data-[state=checked]:border-[oklch(0.78_0.12_85)]"
              />
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full opacity-80"
                  style={{ backgroundColor: line.color }}
                />
                <span className="text-[oklch(0.85_0.01_80)] text-sm tracking-wide font-light">
                  {line.label}
                </span>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}
