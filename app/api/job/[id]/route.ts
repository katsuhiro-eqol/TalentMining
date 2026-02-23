import { NextResponse } from "next/server";
import { db } from "@/app/lib/firebaseAdmin";

export const runtime = "nodejs";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GET /api/job/[id]
//  クライアントがポーリングで叩くエンドポイント。
//  Firestore の jobs ドキュメントを読み、status と結果を返す。
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const doc = await db.collection("jobs").doc(id).get();

  if (!doc.exists) {
    return NextResponse.json({ error: "ジョブが見つかりません" }, { status: 404 });
  }

  const data = doc.data()!;

  // pending → まだ処理中
  if (data.status === "pending") {
    return NextResponse.json({ status: "pending" });
  }

  // error → バックグラウンド処理が失敗
  if (data.status === "error") {
    return NextResponse.json({
      status: "error",
      error: data.error ?? "解析に失敗しました",
    });
  }

  // done → 解析完了。結果を返す
  return NextResponse.json({
    status: "done",
    input: data.input,
    analysis: data.analysis,
  });
}
