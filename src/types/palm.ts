export type PalmLineKey =
  | "life"
  | "heart"
  | "head"
  | "fate"
  | "sun"
  | "marriage";

export interface PalmLine {
  key: PalmLineKey;
  label: string;
  color: string;
}

export interface DiagnoseResult {
  line: PalmLineKey;
  label: string;
  description: string;
  coordinates?: [number, number][];
}

export interface DiagnoseResponse {
  results: DiagnoseResult[];
}

export const PALM_LINES: PalmLine[] = [
  { key: "life", label: "生命線", color: "#e05f5f" },
  { key: "heart", label: "感情線", color: "#e07ab0" },
  { key: "head", label: "頭脳線", color: "#7ab8e0" },
  { key: "fate", label: "運命線", color: "#c9a84c" },
  { key: "sun", label: "太陽線", color: "#e0c06e" },
  { key: "marriage", label: "結婚線", color: "#b07ae0" },
];

export const LINE_LABEL_MAP: Record<PalmLineKey, string> = {
  life: "生命線",
  heart: "感情線",
  head: "頭脳線",
  fate: "運命線",
  sun: "太陽線",
  marriage: "結婚線",
};
