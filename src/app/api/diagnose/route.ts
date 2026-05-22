import { NextRequest, NextResponse } from "next/server";
import { DiagnoseResponse, LINE_LABEL_MAP, PalmLineKey } from "@/types/palm";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const imageFile = formData.get("image") as File | null;
    const selectedLinesRaw = formData.get("selectedLines") as string | null;

    if (!imageFile || !selectedLinesRaw) {
      return NextResponse.json({ error: "画像と診断種別が必要です" }, { status: 400 });
    }

    const selectedLines: PalmLineKey[] = JSON.parse(selectedLinesRaw);
    const lineLabels = selectedLines.map((k) => LINE_LABEL_MAP[k]).join("、");

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

    // Dify Chat-messages API（Chatflow / Chat アプリ向け）
    const query = `以下の手相ラインを診断してください：${lineLabels}。
各ラインについて、診断コメントと画像上の大まかな位置（左上を0,0、右下を1,1とした相対座標の配列）を
以下のJSON形式で返してください。余計な説明は不要です。

[
  {
    "line": "life",
    "label": "生命線",
    "description": "診断テキスト",
    "coordinates": [[0.3, 0.5], [0.35, 0.7]]
  }
]

lineキーの値は life / heart / head / fate / sun / marriage のいずれかを使用してください。`;

    const runRes = await fetch(`${difyApiUrl}/chat-messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${difyApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: {},
        query,
        response_mode: "blocking",
        conversation_id: "",
        user: "palm-user",
        files: [
          {
            type: "image",
            transfer_method: "local_file",
            upload_file_id: fileId,
          },
        ],
      }),
    });

    if (!runRes.ok) {
      const err = await runRes.text();
      console.error("Dify chat-messages error:", err);
      return NextResponse.json({ error: "診断の実行に失敗しました" }, { status: 500 });
    }

    const runData = await runRes.json();

    // Dify chatflow の応答テキストをパース
    const rawAnswer: string = runData?.answer ?? "";
    let results: DiagnoseResponse["results"] = [];

    // JSON ブロックを抽出（```json ... ``` または裸のJSONに対応）
    const jsonMatch = rawAnswer.match(/```(?:json)?\s*([\s\S]*?)```/) ??
      rawAnswer.match(/(\[[\s\S]*\])/);

    const jsonString = jsonMatch ? jsonMatch[1].trim() : rawAnswer.trim();

    try {
      const parsed = JSON.parse(jsonString);
      if (Array.isArray(parsed)) {
        results = parsed;
      }
    } catch {
      // JSONパース失敗時はプレーンテキストとして全ライン共通で返す
      results = selectedLines.map((key) => ({
        line: key,
        label: LINE_LABEL_MAP[key],
        description: rawAnswer || "診断結果を取得できませんでした。",
      }));
    }

    return NextResponse.json({ results } satisfies DiagnoseResponse);
  } catch (err) {
    console.error("Diagnose API error:", err);
    return NextResponse.json({ error: "予期せぬエラーが発生しました" }, { status: 500 });
  }
}
