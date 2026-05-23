import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { THEME_LABEL_MAP, DiagnoseThemeKey, DiagnoseResponse } from "@/types/palm";

export const maxDuration = 60;

const THEME_PROMPT: Record<DiagnoseThemeKey, string> = {
  overall: "手相全体（生命線・感情線・頭脳線・運命線など）を総合的に分析し、運勢・性格・才能を診断してください。",
  longevity: "生命線の長さ・太さ・途切れの有無から健康状態・体力・寿命の傾向を診断してください。",
  money: "財運線・太陽線・運命線から金運・商才・富の可能性を診断してください。",
  love: "感情線・結婚線から恋愛傾向・愛情の質・結婚運を診断してください。",
  rarity: "マスカケ線・仏眼・覇王線などの特殊な手相を探し、あれば意味を、なければ一般的な手相として伝えてください。",
  aptitude: "頭脳線・各丘の発達から才能・得意分野・適職を診断してください。",
};

async function compressImage(file: File): Promise<Buffer> {
  const raw = Buffer.from(await file.arrayBuffer());
  try {
    return await sharp(raw)
      .resize(1024, 1024, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();
  } catch {
    return raw;
  }
}

async function uploadToDify(
  apiUrl: string,
  apiKey: string,
  buffer: Buffer,
  filename: string
): Promise<string> {
  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(buffer)], { type: "image/jpeg" }), filename);
  form.append("user", "palm-user");

  const res = await fetch(`${apiUrl}/files/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });

  if (!res.ok) {
    console.error("Dify file upload error:", await res.text());
    throw new Error("画像のアップロードに失敗しました");
  }

  const data = await res.json();
  return data.id as string;
}

function parseAndFilterResults(
  rawAnswer: string,
  selectedThemes: DiagnoseThemeKey[],
  isBoth: boolean,
  leftId: string | null
): DiagnoseResponse["results"] {
  let results: DiagnoseResponse["results"] = [];

  const jsonMatch =
    rawAnswer.match(/```(?:json)?\s*([\s\S]*?)```/) ??
    rawAnswer.match(/(\[[\s\S]*\])/);

  const jsonString = jsonMatch ? jsonMatch[1].trim() : rawAnswer.trim();

  try {
    const parsed = JSON.parse(jsonString);
    if (Array.isArray(parsed)) results = parsed;
  } catch {
    results = selectedThemes.map((key) => ({
      hand: "both" as const,
      theme: key,
      label: THEME_LABEL_MAP[key],
      description: rawAnswer || "診断結果を取得できませんでした。",
      lines: [],
    }));
  }

  results = results.filter(
    (r) => !r.theme || selectedThemes.includes(r.theme as DiagnoseThemeKey)
  );

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

  return results;
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

    // 圧縮→アップロードをパイプライン化して左右並行実行
    const [leftId, rightId] = await Promise.all([
      imageLeft
        ? compressImage(imageLeft).then((buf) =>
            uploadToDify(difyApiUrl, difyApiKey, buf, "left.jpg")
          )
        : Promise.resolve(null),
      imageRight
        ? compressImage(imageRight).then((buf) =>
            uploadToDify(difyApiUrl, difyApiKey, buf, "right.jpg")
          )
        : Promise.resolve(null),
    ]);

    const tesougazou: { transfer_method: string; upload_file_id: string; type: string }[] = [];
    if (leftId) tesougazou.push({ transfer_method: "local_file", upload_file_id: leftId, type: "image" });
    if (rightId) tesougazou.push({ transfer_method: "local_file", upload_file_id: rightId, type: "image" });

    const isBoth = !!(leftId && rightId);

    const imageContext = [
      leftId ? "画像1 = 左手" : null,
      rightId ? `画像${leftId ? 2 : 1} = 右手` : null,
    ].filter(Boolean).join("、");

    const themeInstructions = selectedThemes
      .map((key, i) => `【${i + 1}. ${THEME_LABEL_MAP[key]}】${THEME_PROMPT[key]}`)
      .join("\n");

    const bothHandsNote = isBoth
      ? `左右を比較し、各結果の "hand" に "left"/"right"/"both" を明記。`
      : `"hand" フィールドは "${leftId ? "left" : "right"}" 固定。`;

    const query = `手相専門家として添付の手のひら画像を分析してください。

【画像】${imageContext}
${themeInstructions}

【出力ルール】${bothHandsNote}
JSON配列のみ返してください（前置き・後書き不要）。

[{"hand":"left","theme":"overall","label":"総合診断（左手）","description":"80〜120文字の具体的な診断","lines":["生命線"],"coordinates":[[0.35,0.15],[0.32,0.28],[0.28,0.42],[0.25,0.55],[0.23,0.68],[0.22,0.80]]}]

themeキー: overall/longevity/money/love/rarity/aptitude

【coordinates - 最重要】
診断に使用した手相ラインを画像上で実際になぞるように座標を記録してください。
・座標系: 画像の左上隅=(0,0)、右下隅=(1,1)
・各ラインの始点→途中の曲がり目→終点まで8〜12点を順番に記録
・ラインの曲がり方・弧を忠実に再現する（直線ではなく実際のカーブに沿って）
・画像内でラインが明確に視認できる場合のみ座標を記録。不明確な場合は[]
・精度が最重要: 実際のラインの位置に正確に配置してください`;

    const runRes = await fetch(`${difyApiUrl}/chat-messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${difyApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: { tesougazou },
        query,
        response_mode: "streaming",
        user: "palm-user",
      }),
    });

    if (!runRes.ok) {
      console.error("Dify chat-messages error:", await runRes.text());
      return NextResponse.json({ error: "診断の実行に失敗しました" }, { status: 500 });
    }

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        const reader = runRes.body!.getReader();
        const decoder = new TextDecoder();
        let lineBuffer = "";
        let fullAnswer = "";
        let resultsSent = false;

        const send = (data: unknown) =>
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            lineBuffer += decoder.decode(value, { stream: true });
            const lines = lineBuffer.split("\n");
            lineBuffer = lines.pop() ?? "";

            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;
              const raw = line.slice(6).trim();
              if (!raw || raw === "[DONE]") continue;

              try {
                const parsed = JSON.parse(raw);
                if (parsed.event === "message" && parsed.answer) {
                  fullAnswer += parsed.answer;
                } else if (parsed.event === "message_end") {
                  const results = parseAndFilterResults(fullAnswer, selectedThemes, isBoth, leftId);
                  send({ type: "result", results, hasLeft: !!leftId, hasRight: !!rightId });
                  resultsSent = true;
                } else if (parsed.event === "error") {
                  send({ type: "error", message: "Dify処理中にエラーが発生しました" });
                  resultsSent = true;
                }
              } catch {
                // malformed SSE line はスキップ
              }
            }
          }

          if (!resultsSent && fullAnswer) {
            const results = parseAndFilterResults(fullAnswer, selectedThemes, isBoth, leftId);
            send({ type: "result", results, hasLeft: !!leftId, hasRight: !!rightId });
          }
        } catch (err) {
          console.error("Stream processing error:", err);
          if (!resultsSent) send({ type: "error", message: "予期せぬエラーが発生しました" });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (err) {
    console.error("Diagnose API error:", err);
    return NextResponse.json({ error: "予期せぬエラーが発生しました" }, { status: 500 });
  }
}
