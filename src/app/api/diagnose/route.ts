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

    // Dify にファイルをアップロードしてfile_idを取得
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
      return NextResponse.json({ error: "画像のアップロードに失敗しました" }, { status: 502 });
    }

    const uploadData = await uploadRes.json();
    const fileId: string = uploadData.id;

    // Dify ワークフロー実行
    const runRes = await fetch(`${difyApiUrl}/workflows/run`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${difyApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: {
          selected_lines: lineLabels,
          image: {
            transfer_method: "local_file",
            upload_file_id: fileId,
            type: "image",
          },
        },
        response_mode: "blocking",
        user: "palm-user",
      }),
    });

    if (!runRes.ok) {
      const err = await runRes.text();
      console.error("Dify workflow error:", err);
      return NextResponse.json({ error: "診断の実行に失敗しました" }, { status: 502 });
    }

    const runData = await runRes.json();

    // Difyの出力をパース
    // ワークフローのoutputsキーから結果を取得し、フロントエンド用に整形
    const rawOutput = runData?.data?.outputs?.result ?? runData?.data?.outputs;
    let results: DiagnoseResponse["results"] = [];

    if (typeof rawOutput === "string") {
      // Difyが文字列JSONを返す場合
      try {
        results = JSON.parse(rawOutput);
      } catch {
        // JSONでない場合はプレーンテキストとして全体の結果を返す
        results = selectedLines.map((key) => ({
          line: key,
          label: LINE_LABEL_MAP[key],
          description: rawOutput,
        }));
      }
    } else if (Array.isArray(rawOutput)) {
      results = rawOutput;
    }

    return NextResponse.json({ results } satisfies DiagnoseResponse);
  } catch (err) {
    console.error("Diagnose API error:", err);
    return NextResponse.json({ error: "予期せぬエラーが発生しました" }, { status: 500 });
  }
}
