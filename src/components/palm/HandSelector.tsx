"use client";

import { HandType, HAND_LABELS } from "@/types/palm";

interface Props {
  selected: HandType;
  onChange: (hand: HandType) => void;
}

export function HandSelector({ selected, onChange }: Props) {
  return (
    <div className="space-y-2">
      <h3 className="text-[oklch(0.78_0.12_85)] text-sm tracking-[0.15em] font-light">
        どちらの手？
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {(["left", "right"] as HandType[]).map((hand) => {
          const info = HAND_LABELS[hand];
          const isSelected = selected === hand;
          return (
            <button
              key={hand}
              type="button"
              onClick={() => onChange(hand)}
              className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all duration-200 text-center
                ${isSelected
                  ? "border-[oklch(0.78_0.12_85/60%)] bg-[oklch(0.78_0.12_85/10%)]"
                  : "border-[oklch(1_0_0/10%)] bg-[oklch(0.15_0.025_280)] hover:border-[oklch(0.78_0.12_85/30%)]"
                }`}
            >
              <span className={`text-sm font-light tracking-wider ${isSelected ? "text-[oklch(0.78_0.12_85)]" : "text-[oklch(0.75_0.01_80)]"}`}>
                {info.label}
              </span>
              <span className="text-[oklch(0.50_0.01_80)] text-xs leading-snug tracking-wide">
                {info.meaning}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
