import { NextRequest, NextResponse } from "next/server";
import { DiagnoseResponse, THEME_LABEL_MAP, DiagnoseThemeKey, DIAGNOSE_THEMES } from "@/types/palm";

const THEME_PROMPT: Record<DiagnoseThemeKey, string> = {
  overall: "手相全体（生命線・感情線・頭脳線・運命線・太陽線など主要な線すべて）を総合的に分析し、この人物の運勢・性格・才能の全体像を診断してください。",
  longevity: "生命線を中心に分析してください。線の長さ・太さ・濃さ・途切れの有無から、健康状態・体力・生命力・寿命の傾向を診断してください。",
  money: "財運線・太陽線・運命線を中心に分析してください。金運・商才・お金を引き寄せる力・富の可能性を診断してください。",
  love: "感情線・結婚線を中心に分析してください。恋愛傾向・愛情の質・結婚のタイミング・縁の強さを診断してください。",
  rarity: "マスカケ線・仏眼・覇王線・スター紋・フィッシュ紋などの特殊な手相・紋を探してください。珍しい手相があれば意味を、なければ「一般的な手相ですが〜」と伝えてください。",
  aptitude: "頭脳線（知能線）・各丘（木星丘・土星丘・太陽丘・水星丘・金星丘・月丘）の発達状況を分析し、才能・得意分野・適職・向いているライフスタイルを診断してください。",
};

async function uploadToDify(
  apiUrl: string,
  apiKey: string,
  file: File
): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  form.append("user", "palm-user");

  const res = await fetch(`${apiUrl}/files/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("Dify file upload error:", err);
    throw new Error("画像のアップロードに失敗しました");
  }

  const data = await res.json();
  return data.id as string;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const imageLeft = formData.get("imageLeft") as File | null;
    const imageRight = formData.get("imageRight") as File | null;
    const selectedThemesRaw = formData.get("selectedThemes") as string | null;

    if (!imageLeft && !imageRight) {
      return NextResponse.json({ error: "少なくとも1枚の手のひら画像が必要です" }, { status: 400 });
    }
    if (!selectedThemesRaw) {
      return NextResponse.json({ error: "診断内容が必要です" }, { status: 400 });
    }

    const selectedThemes: DiagnoseThemeKey[] = JSON.parse(selectedThemesRaw);
    const difyApiUrl = process.env.DIFY_API_URL;
    const difyApiKey = process.env.DIFY_API_KEY;

    if (!difyApiUrl || !difyApiKey) {
      return NextResponse.json({ error: "Dify API設定が不足しています" }, { status: 500 });
    }

    // 左右の画像を並行アップロード
    const [leftId, rightId] = await Promise.all([
      imageLeft ? uploadToDify(difyApiUrl, difyApiKey, imageLeft) : null,
      imageRight ? uploadToDify(difyApiUrl, difyApiKey, imageRight) : null,
    ]);

    // tesougazou 配列を構築（左→右の順）
    const tesougazou: { transfer_method: string; upload_file_id: string; type: string }[] = [];
    if (leftId) tesougazou.push({ transfer_method: "local_file", upload_file_id: leftId, type: "image" });
    if (rightId) tesougazou.push({ transfer_method: "local_file", upload_file_id: rightId, type: "image" });

    // 画像の構成をプロンプトに明示
    const imageContext = [
      leftId ? "画像1 = 左手（生まれ持った才能・本音・先天的な運勢）" : null,
      rightId ? `画像${leftId ? 2 : 1} = 右手（努力で築いた運命・現在〜未来）` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const isBoth = leftId && rightId;

    const themeInstructions = selectedThemes
      .map((key, i) => `【${i + 1}. ${THEME_LABEL_MAP[key]}】\n${THEME_PROMPT[key]}`)
      .join("\n\n");

    const bothHandsNote = isBoth
      ? `左右の手を比較しながら診断し、各診断結果に "hand" フィールドで "left" / "right" / "both" を明記してください。`
      : `診断結果の "hand" フィールドは "${leftId ? "left" : "right"}" を使用してください。`;

    const query = `あなたは数千年の歴史を持つ手相の専門家です。
添付された手のひら画像を詳しく分析し、以下の診断を行ってください。

【画像の構成】
${imageContext}

${themeInstructions}

【出力ルール】
${bothHandsNote}

以下のJSON配列のみを返してください。前置き・後書きは不要です。

[
  {
    "hand": "left",
    "theme": "overall",
    "label": "総合診断（左手）",
    "description": "丁寧で具体的な診断コメント（150〜200文字）",
    "lines": ["生命線", "感情線"],
    "coordinates": [[0.3, 0.4], [0.35, 0.6]]
  },
  {
    "hand": "right",
    "theme": "overall",
    "label": "総合診断（右手）",
    "description": "丁寧で具体的な診断コメント（150〜200文字）",
    "lines": ["運命線"],
    "coordinates": [[0.5, 0.3], [0.52, 0.7]]
  }
]

【themeキーの値】overall / longevity / money / love / rarity / aptitude
【coordinatesについて】左上(0,0)・右下(1,1)の相対座標で3〜5点。見当たらない場合は空配列。
【linesについて】診断に使用した手相ラインの名前を配列で記入。`;

    const runRes = await fetch(`${difyApiUrl}/chat-messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${difyApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: { tesougazou },
        query,
        response_mode: "blocking",
        user: "palm-user",
      }),
    });

    if (!runRes.ok) {
      const err = await runRes.text();
      console.error("Dify chat-messages error:", err);
      return NextResponse.json({ error: "診断の実行に失敗しました" }, { status: 500 });
    }

    const runData = await runRes.json();
    const rawAnswer: string = runData?.answer ?? "";
    let results: DiagnoseResponse["results"] = [];

    const jsonMatch =
      rawAnswer.match(/```(?:json)?\s*([\s\S]*?)```/) ??
      rawAnswer.match(/(\[[\s\S]*\])/);

    const jsonString = jsonMatch ? jsonMatch[1].trim() : rawAnswer.trim();

    try {
      const parsed = JSON.parse(jsonString);
      if (Array.isArray(parsed)) {
        results = parsed;
      }
    } catch {
      results = selectedThemes.map((key) => {
        const themeInfo = DIAGNOSE_THEMES.find((t) => t.key === key);
        return {
          hand: "both" as const,
          theme: key,
          label: THEME_LABEL_MAP[key],
          description: rawAnswer || "診断結果を取得できませんでした。",
          lines: themeInfo ? [] : [],
        };
      });
    }

    // 選択したテーマ以外の結果を除去
    results = results.filter(
      (r) => !r.theme || selectedThemes.includes(r.theme as DiagnoseThemeKey)
    );

    // 片手モード: 正しい手の結果のみ残し、テーマ重複を除去
    if (!isBoth) {
      const targetHand = leftId ? "left" : "right";
      results = results.filter(
        (r) => !r.hand || r.hand === targetHand || r.hand === "both"
      );
      const seen = new Set<string>();
      results = results.filter((r) => {
        const key = r.theme ?? "_unknown";
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }

    return NextResponse.json({
      results,
      hasLeft: !!leftId,
      hasRight: !!rightId,
    });
  } catch (err) {
    console.error("Diagnose API error:", err);
    return NextResponse.json({ error: "予期せぬエラーが発生しました" }, { status: 500 });
  }
}
