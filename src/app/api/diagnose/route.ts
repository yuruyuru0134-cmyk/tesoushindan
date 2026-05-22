import { NextRequest, NextResponse } from "next/server";
import { DiagnoseResponse, THEME_LABEL_MAP, DiagnoseThemeKey, DIAGNOSE_THEMES } from "@/types/palm";

const HAND_CONTEXT: Record<string, string> = {
  left: "左手（生まれ持った才能・本音・先天的な運勢を表す）",
  right: "右手（努力で築いた運命・現在〜未来を表す）",
};

const THEME_PROMPT: Record<DiagnoseThemeKey, string> = {
  overall: "手相全体（生命線・感情線・頭脳線・運命線・太陽線など主要な線すべて）を総合的に分析し、この人物の運勢・性格・才能の全体像を診断してください。",
  longevity: "生命線を中心に分析してください。線の長さ・太さ・濃さ・途切れの有無から、健康状態・体力・生命力・寿命の傾向を診断してください。",
  money: "財運線・太陽線・運命線を中心に分析してください。金運・商才・お金を引き寄せる力・富の可能性を診断してください。",
  love: "感情線・結婚線を中心に分析してください。恋愛傾向・愛情の質・結婚のタイミング・縁の強さを診断してください。",
  rarity: "マスカケ線（知能線と感情線が1本に繋がる線）、仏眼（親指第一関節が目の形）、覇王線、スター紋、フィッシュ紋などの特殊な手相・紋を探してください。珍しい手相が見つかった場合はその意味を、見つからなかった場合は「一般的な手相ですが〜」と伝えてください。",
  aptitude: "頭脳線（知能線）・各丘（木星丘・土星丘・太陽丘・水星丘・金星丘・月丘）の発達状況を分析し、この人物の才能・得意分野・適職・向いている仕事やライフスタイルを診断してください。",
};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const imageFile = formData.get("image") as File | null;
    const selectedThemesRaw = formData.get("selectedThemes") as string | null;
    const handType = (formData.get("handType") as string) || "right";

    if (!imageFile || !selectedThemesRaw) {
      return NextResponse.json({ error: "画像と診断内容が必要です" }, { status: 400 });
    }

    const selectedThemes: DiagnoseThemeKey[] = JSON.parse(selectedThemesRaw);
    const handContext = HAND_CONTEXT[handType] ?? HAND_CONTEXT.right;

    const difyApiUrl = process.env.DIFY_API_URL;
    const difyApiKey = process.env.DIFY_API_KEY;

    if (!difyApiUrl || !difyApiKey) {
      return NextResponse.json({ error: "Dify API設定が不足しています" }, { status: 500 });
    }

    // Dify にファイルをアップロードして file_id を取得
    const uploadForm = new FormData();
    uploadForm.append("file", imageFile);
    uploadForm.append("user", "palm-user");

    const uploadRes = await fetch(`${difyApiUrl}/files/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${difyApiKey}` },
      body: uploadForm,
    });

    if (!uploadRes.ok) {
      const err = await uploadRes.text();
      console.error("Dify file upload error:", err);
      return NextResponse.json({ error: "画像のアップロードに失敗しました" }, { status: 500 });
    }

    const uploadData = await uploadRes.json();
    const fileId: string = uploadData.id;

    // 選択されたテーマごとの診断指示を組み立て
    const themeInstructions = selectedThemes
      .map((key, i) => `【${i + 1}. ${THEME_LABEL_MAP[key]}】\n${THEME_PROMPT[key]}`)
      .join("\n\n");

    const query = `あなたは数千年の歴史を持つ手相の専門家です。
添付された手のひら画像（${handContext}）を詳しく分析し、以下の診断を行ってください。

${themeInstructions}

【出力形式】
以下のJSON配列のみを返してください。前置き・後書きは不要です。

[
  {
    "theme": "overall",
    "label": "総合診断",
    "description": "丁寧で具体的な診断コメント（150〜200文字）",
    "lines": ["生命線", "感情線"],
    "coordinates": [[0.3, 0.4], [0.35, 0.6]]
  }
]

【themeキーの値】overall / longevity / money / love / rarity / aptitude
【coordinatesについて】左上(0,0)・右下(1,1)の相対座標で、診断に使った手相ラインの位置を3〜5点で表してください。特定のラインが見当たらない場合は空配列にしてください。
【linesについて】診断に使用した手相ラインの名前を配列で記入してください。`;

    const runRes = await fetch(`${difyApiUrl}/chat-messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${difyApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: {
          tesougazou: [
            {
              transfer_method: "local_file",
              upload_file_id: fileId,
              type: "image",
            },
          ],
        },
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

    // JSON ブロックを抽出（```json ... ``` または裸の配列に対応）
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
      // JSONパース失敗時はプレーンテキストとして返す
      results = selectedThemes.map((key) => {
        const themeInfo = DIAGNOSE_THEMES.find((t) => t.key === key);
        return {
          theme: key,
          label: THEME_LABEL_MAP[key],
          description: rawAnswer || "診断結果を取得できませんでした。",
          lines: themeInfo ? [] : [],
        };
      });
    }

    return NextResponse.json({ results } satisfies DiagnoseResponse);
  } catch (err) {
    console.error("Diagnose API error:", err);
    return NextResponse.json({ error: "予期せぬエラーが発生しました" }, { status: 500 });
  }
}
