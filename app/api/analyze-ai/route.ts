import OpenAI from "openai";
import { NextResponse, after } from "next/server";
import { bucket, db } from "@/app/lib/firebaseAdmin";

// ── Vercel Pro: 最大300秒まで関数を延長（after() 内の処理にも適用される）
export const maxDuration = 300;
export const runtime = "nodejs";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

type ThreadInput = {
  threadId: string;
  questions: string[];
};

function normalizeQuestions(txt: string): string[] {
  const lines = txt.replace(/\r\n?/g, "\n").split("\n");

  const cleaned = lines
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) =>
      line
        .replace(/^\s*\d+\s*[\.\)\-:：]\s*/u, "")
        .replace(/^\s*[・\-–—]\s*/u, "")
        .trim()
    )
    .filter((line) => line.length > 0)
    .filter((line) => !line.includes("Claude は AI"))
    .filter((line) => line !== "Claude");

  return cleaned.slice(0, 200);
}

const RESPONSE_SCHEMA = {
  name: "candidate_profile_v1",
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      persona_summary: {
        type: "string",
        description:
          "複数スレッド横断での技術者像を2〜4文で。評価ではなく『傾向』として記述。",
      },
      common_traits: {
        type: "array",
        description:
          "スレッド全体で共通する特徴（行動特性）。各要素は『根拠（質問引用）』を最低1つ含む。",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            title: { type: "string", description: "特徴の短い見出し" },
            description: { type: "string", description: "特徴の説明（傾向表現）" },
            evidence: {
              type: "array",
              description: "根拠となる質問の引用（原文のまま短く）",
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  threadId: { type: "string" },
                  question: { type: "string" },
                },
                required: ["threadId", "question"],
              },
              minItems: 1,
              maxItems: 4,
            },
          },
          required: ["title", "description", "evidence"],
        },
        minItems: 2,
        maxItems: 5,
      },
      situational_traits: {
        type: "array",
        description:
          "場面（スレッド）ごとに強く出る特徴。各スレッド1件を目安。",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            threadId: { type: "string" },
            theme: { type: "string", description: "そのスレッドの主題（例：iOS音声、サーバ構築 等）" },
            traits: {
              type: "array",
              items: { type: "string" },
              minItems: 1,
              maxItems: 4,
            },
            evidence: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  question: { type: "string" },
                },
                required: ["question"],
              },
              minItems: 1,
              maxItems: 3,
            },
          },
          required: ["threadId", "theme", "traits", "evidence"],
        },
        minItems: 1,
        maxItems: 10,
      },
      radar_llm: {
        type: "object",
        description:
          "第一段階用：評価ではなく『傾向可視化』の0〜1。推定できない軸は0.5。",
        additionalProperties: false,
        properties: {
          continuity: { type: "number", minimum: 0, maximum: 1 },
          exploration: { type: "number", minimum: 0, maximum: 1 },
          breadth: { type: "number", minimum: 0, maximum: 1 },
          implementation: { type: "number", minimum: 0, maximum: 1 },
          practicality: { type: "number", minimum: 0, maximum: 1 },
          learning: { type: "number", minimum: 0, maximum: 1 },
        },
        required: [
          "continuity",
          "exploration",
          "breadth",
          "implementation",
          "practicality",
          "learning",
        ],
      },
      resume_phrases: {
        type: "array",
        description:
          "応募書類に転用しやすい文章例（短め）。言い切り過ぎず、ログに沿った表現。",
        items: { type: "string" },
        minItems: 1,
        maxItems: 3,
      },
      disclaimer: {
        type: "string",
        description:
          "『評価ではなく傾向です』の注意書き（固定文に近い）。",
      },
    },
    required: [
      "persona_summary",
      "common_traits",
      "situational_traits",
      "radar_llm",
      "resume_phrases",
      "disclaimer",
    ],
  },
} as const;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// POST ハンドラ
//  1) ファイル受け取り → Storage 保存 → Firestore にジョブ作成
//  2) after() でバックグラウンド処理を登録
//  3) すぐに jobId を返す
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY が未設定です" },
      { status: 500 }
    );
  }

  const form = await req.formData();
  const files = form.getAll("files").filter((x): x is File => x instanceof File);
  const deviceId = (form.get("deviceId") as string) ?? "guest";

  if (files.length === 0) {
    return NextResponse.json({ error: "files が空です" }, { status: 400 });
  }

  // ── ① ファイルを Storage に保存しつつ、threads データを組み立てる ──
  const threads: ThreadInput[] = [];
  for (const f of files) {
    const buffer = Buffer.from(await f.arrayBuffer());
    const destination = `Questions/${deviceId}_${f.name}`;
    await bucket.file(destination).save(buffer, {
      metadata: { contentType: f.type || "text/plain" },
    });

    const txt = buffer.toString("utf-8");
    threads.push({
      threadId: f.name || "thread",
      questions: normalizeQuestions(txt),
    });
  }

  // ── ② Firestore に「処理中」ジョブ + Analysis ドキュメントを作成 ──
  const inputMeta = {
    threads: threads.map((t) => t.threadId),
    questionCount: threads.reduce((a, t) => a + t.questions.length, 0),
  };

  const jobRef = await db.collection("jobs").add({
    deviceId,
    status: "pending",
    input: inputMeta,
    createdAt: new Date(),
  });
  const jobId = jobRef.id;

  // 後で結果を書き込む Analysis ドキュメントを先に作成し、ID をレスポンスで返せるようにする
  const analysisRef = await db.collection("Analysis").add({
    deviceId,
    status: "pending",
    input: inputMeta,
    createdAt: new Date(),
  });
  const documentId = analysisRef.id;

  // ── ③ after() でバックグラウンド処理を登録 ──
  //  after() に渡した関数は、レスポンスをクライアントに返した「後」に
  //  同じサーバーレス関数のプロセス内で実行される。
  //  つまりクライアントは待たなくてよいが、関数自体は maxDuration まで生き続ける。
  after(async () => {
    try {
      const inputPayload = {
        purpose:
          "応募者が自分の強みを発見するための第一段階アウトプットを作る。評価や合否判断はしない。",
        threads,
        output_style: {
          tone: "断定しすぎず『傾向が見られます』で記述",
          evidence: "必ず質問引用を添える。引用は原文を短く。",
          avoid: ["優劣評価", "合否", "他者比較", "スコアの絶対視"],
        },
      };

      const response = await client.responses.create({
        model: "gpt-4.1",
        input: [
          {
            role: "system",
            content:
              "あなたは採用の合否判定者ではなく、応募者の自己理解を支援するアナリストです。評価や優劣ではなく、質問ログから見える傾向を言語化してください。",
          },
          {
            role: "user",
            content:
              "次の質問ログ（複数スレッド）を分析し、指定スキーマのJSONのみを返してください。\n\n" +
              JSON.stringify(inputPayload),
          },
        ],
        text: {
          format: {
            type: "json_schema",
            ...RESPONSE_SCHEMA,
          },
        },
      });

      const parsed = JSON.parse(response.output_text);

      // 解析結果で Firestore を更新 → status: "done"
      await jobRef.update({
        status: "done",
        analysis: parsed,
        completedAt: new Date(),
      });

      // 先に作成した Analysis ドキュメントを完了状態で更新
      await analysisRef.update({
        status: "done",
        deviceId,
        input: inputMeta,
        analysis: parsed,
        completedAt: new Date(),
      });
    } catch (err) {
      console.error("Background analysis failed:", err);
      await jobRef.update({
        status: "error",
        error: err instanceof Error ? err.message : "Unknown error",
        completedAt: new Date(),
      });
      await analysisRef.update({
        status: "error",
        error: err instanceof Error ? err.message : "Unknown error",
        completedAt: new Date(),
      });
    }
  });

  // ── ④ クライアントにはすぐ jobId と Analysis の documentId を返す（数秒以内） ──
  return NextResponse.json({ jobId, documentId });
}
