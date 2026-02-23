import { NextResponse } from "next/server";

export const runtime = "nodejs"; // FormData + File を扱うので node 推奨

type Question = {
  text: string;
  threadId: string;
  order: number;
};

type Radar = {
  continuity: number;     // 課題継続性
  exploration: number;    // 探索・深掘り
  breadth: number;        // 技術横断性
  implementation: number; // 実装具体性
  practicality: number;   // 運用・現実視点
  learning: number;       // 学習・理解志向
};

const WHY_WORDS = ["なぜ", "理由", "どうして", "why"];
const NEXT_WORDS = ["次", "では", "踏まえ", "続いて", "その後", "次に", "さらに"];
const IMPLEMENT_WORDS = ["error", "エラー", "型", "shape", "dtype", "stack trace", "コンパイル", "ビルド", "実装", "コード", "route.ts", "swift", "xcode", "firebase", "firestore"];
const OPERATION_WORDS = ["本番", "安定", "無料", "低コスト", "コスト", "運用", "デプロイ", "vercel", "cloud", "gpu", "ssh", "nat", "ポート", "iOS", "Safari"];
const LEARN_WORDS = ["意味", "違い", "理解", "とは", "なに", "何", "どういう", "教えて"];

const ML_TERMS = ["st-gcn", "stgcn", "pytorch", "tensor", "embedding", "model", "学習", "推論", "精度", "accuracy", "loss", "ラベル", "前処理"];

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

function containsAny(text: string, words: string[]) {
  const t = text.toLowerCase();
  return words.some((w) => t.includes(w.toLowerCase()));
}

function cleanLineToQuestion(line: string): string | null {
  const t = line.trim();
  if (!t) return null;

  // 番号付き "1." "1)" "・" " - " 等を除去
  const stripped = t
    .replace(/^\s*\d+\s*[\.\)\-:：]\s*/u, "")
    .replace(/^\s*[・\-–—]\s*/u, "")
    .trim();

  // 免責っぽい行を弾く
  if (!stripped) return null;
  if (stripped.includes("Claude は AI")) return null;
  if (stripped === "Claude") return null;

  return stripped;
}

function parseQuestionsFromTxt(txt: string, threadId: string): Question[] {
  const lines = txt.replace(/\r\n?/g, "\n").split("\n");
  const qs: Question[] = [];

  for (const line of lines) {
    const q = cleanLineToQuestion(line);
    if (!q) continue;
    qs.push({ text: q, threadId, order: qs.length });
  }

  return qs;
}

function computeRadar(questions: Question[]): { radar: Radar; debug: any } {
  const total = questions.length;
  const threads = new Set(questions.map((q) => q.threadId));
  const numThreads = Math.max(1, threads.size);

  // 1) 課題継続性: avg questions per thread を3問基準で正規化
  const avgPerThread = total / numThreads;
  const continuity = clamp01(avgPerThread / 3);

  // 2) 探索・深掘り: WHY/NEXT の比率（3割以上で強い）
  const exploreCount = questions.filter((q) =>
    containsAny(q.text, WHY_WORDS) || containsAny(q.text, NEXT_WORDS)
  ).length;
  const exploration = clamp01((exploreCount / Math.max(1, total)) * 1.5);

  // 3) 技術横断性: theory / impl / env のカテゴリ数
  const categories = new Set<"theory" | "implementation" | "environment">();
  for (const q of questions) {
    const t = q.text.toLowerCase();
    if (ML_TERMS.some((w) => t.includes(w))) categories.add("theory");
    if (containsAny(q.text, IMPLEMENT_WORDS)) categories.add("implementation");
    if (containsAny(q.text, OPERATION_WORDS)) categories.add("environment");
  }
  const breadth = clamp01(categories.size / 3);

  // 4) 実装具体性
  const implCount = questions.filter((q) => containsAny(q.text, IMPLEMENT_WORDS)).length;
  const implementation = clamp01((implCount / Math.max(1, total)) * 1.2);

  // 5) 運用・現実視点
  const opCount = questions.filter((q) => containsAny(q.text, OPERATION_WORDS)).length;
  const practicality = clamp01(opCount / Math.max(1, total));

  // 6) 学習・理解志向
  const learnCount = questions.filter((q) => containsAny(q.text, LEARN_WORDS)).length;
  const learning = clamp01(learnCount / Math.max(1, total));

  return {
    radar: { continuity, exploration, breadth, implementation, practicality, learning },
    debug: {
      total,
      numThreads,
      avgPerThread,
      exploreCount,
      implCount,
      opCount,
      learnCount,
      categories: Array.from(categories),
    },
  };
}

function pickTopTraits(r: Radar): Array<{ key: keyof Radar; label: string; score: number }> {
  const items: Array<{ key: keyof Radar; label: string; score: number }> = [
    { key: "continuity", label: "課題継続性", score: r.continuity },
    { key: "exploration", label: "探索・深掘り", score: r.exploration },
    { key: "breadth", label: "技術横断性", score: r.breadth },
    { key: "implementation", label: "実装具体性", score: r.implementation },
    { key: "practicality", label: "運用・現実視点", score: r.practicality },
    { key: "learning", label: "学習・理解志向", score: r.learning },
  ];
  return items.sort((a, b) => b.score - a.score).slice(0, 2);
}

function buildSummary(radar: Radar) {
  const top2 = pickTopTraits(radar);
  const pieces = top2.map((t) => `「${t.label}」`).join("と");
  return `この質問ログからは、${pieces}の傾向が相対的に強く見られます（※これは評価ではなく傾向の可視化です）。`;
}

export async function POST(req: Request) {
  const form = await req.formData();
  const files = form.getAll("files").filter((x): x is File => x instanceof File);

  if (files.length === 0) {
    return NextResponse.json({ error: "files が空です" }, { status: 400 });
  }

  // 1ファイル = 1スレッド として扱う
  const allQuestions: Question[] = [];
  for (const f of files) {
    const txt = await f.text();
    const threadId = f.name || `thread_${allQuestions.length}`;
    allQuestions.push(...parseQuestionsFromTxt(txt, threadId));
  }

  const { radar, debug } = computeRadar(allQuestions);
  const summary = buildSummary(radar);

  return NextResponse.json({
    input: { threads: files.map((f) => f.name), questionCount: allQuestions.length },
    analysis: {radar_llm: radar},
    summary,
    debug, // MVPでは表示してOK。後でOFFにする
  });
}
