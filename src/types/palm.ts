// 診断テーマ（Difyのプロンプト選択肢と対応）
export type DiagnoseThemeKey =
  | "overall"
  | "longevity"
  | "money"
  | "love"
  | "rarity"
  | "aptitude";

export type HandType = "left" | "right";

export interface DiagnoseTheme {
  key: DiagnoseThemeKey;
  label: string;
  description: string;
  icon: string;
}

// Dify側に渡すラベルマップ
export const THEME_LABEL_MAP: Record<DiagnoseThemeKey, string> = {
  overall: "総合診断",
  longevity: "寿命",
  money: "金運",
  love: "恋愛運",
  rarity: "稀人度",
  aptitude: "向き不向き",
};

export const DIAGNOSE_THEMES: DiagnoseTheme[] = [
  {
    key: "overall",
    label: "総合診断",
    description: "手相全体からあなたの運勢を総合的に読み解きます",
    icon: "✦",
  },
  {
    key: "longevity",
    label: "寿命",
    description: "生命線から健康・活力・人生の長さを診断します",
    icon: "🌿",
  },
  {
    key: "money",
    label: "金運",
    description: "財運線・太陽線から金運・商才・富の可能性を診断します",
    icon: "◈",
  },
  {
    key: "love",
    label: "恋愛運",
    description: "感情線・結婚線から恋愛傾向・縁・結婚運を診断します",
    icon: "◇",
  },
  {
    key: "rarity",
    label: "稀人度",
    description: "マスカケ線・仏眼など珍しい手相があるか診断します",
    icon: "★",
  },
  {
    key: "aptitude",
    label: "向き不向き",
    description: "頭脳線・丘の状態から才能・適職・得意分野を診断します",
    icon: "◉",
  },
];

// 結果の型（Difyが返すJSON）
export interface DiagnoseResult {
  theme?: DiagnoseThemeKey;
  label: string;
  description: string;
  lines?: string[];       // 関連する手相ラインの名前（任意）
  coordinates?: [number, number][];
}

export interface DiagnoseResponse {
  results: DiagnoseResult[];
}

export const HAND_LABELS: Record<HandType, { label: string; meaning: string }> = {
  left: { label: "左手", meaning: "生まれ持った才能・本音・過去" },
  right: { label: "右手", meaning: "努力で築いた運命・現在〜未来" },
};
