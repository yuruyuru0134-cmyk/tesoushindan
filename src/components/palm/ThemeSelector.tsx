"use client";

import { DIAGNOSE_THEMES, DiagnoseThemeKey } from "@/types/palm";

interface Props {
  selected: DiagnoseThemeKey[];
  onChange: (selected: DiagnoseThemeKey[]) => void;
}

export function ThemeSelector({ selected, onChange }: Props) {
  const toggle = (key: DiagnoseThemeKey) => {
    if (selected.includes(key)) {
      onChange(selected.filter((k) => k !== key));
    } else {
      onChange([...selected, key]);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-[oklch(0.78_0.12_85)] text-sm tracking-[0.15em] font-light">
          診断内容を選択
        </h3>
        <span className="text-[oklch(0.45_0.01_80)] text-xs tracking-wide">
          複数選択可
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {DIAGNOSE_THEMES.map((theme) => {
          const isSelected = selected.includes(theme.key);
          return (
            <button
              key={theme.key}
              type="button"
              onClick={() => toggle(theme.key)}
              className={`flex flex-col gap-1.5 p-3 rounded-xl border text-left transition-all duration-200
                ${isSelected
                  ? "border-[oklch(0.78_0.12_85/60%)] bg-[oklch(0.78_0.12_85/10%)]"
                  : "border-[oklch(1_0_0/10%)] bg-[oklch(0.15_0.025_280)] hover:border-[oklch(0.78_0.12_85/30%)]"
                }`}
            >
              <div className="flex items-center gap-2">
                <span className={`text-base ${isSelected ? "text-[oklch(0.78_0.12_85)]" : "text-[oklch(0.55_0.01_80)]"}`}>
                  {theme.icon}
                </span>
                <span className={`text-sm font-light tracking-wide ${isSelected ? "text-[oklch(0.90_0.01_80)]" : "text-[oklch(0.75_0.01_80)]"}`}>
                  {theme.label}
                </span>
              </div>
              <p className="text-[oklch(0.48_0.01_80)] text-xs leading-snug tracking-wide pl-6">
                {theme.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
