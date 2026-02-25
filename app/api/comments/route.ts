import { NextResponse } from "next/server";
import { db } from "@/app/lib/firebaseAdmin";
import { getAuth } from "firebase-admin/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") ?? "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length)
      : "";

    if (!token) {
      return NextResponse.json({ error: "認証トークンがありません" }, { status: 401 });
    }

    const decoded = await getAuth().verifyIdToken(token);
    const { text } = (await req.json().catch(() => ({}))) as { text?: string };

    if (!text || !text.trim()) {
      return NextResponse.json({ error: "コメントが空です" }, { status: 400 });
    }

    const uid = decoded.uid;
    const email = decoded.email ?? null;

    const docRef = await db.collection("Comment").add({
      uid,
      email,
      text: text.trim(),
      createdAt: new Date(),
    });

    return NextResponse.json({ ok: true, id: docRef.id });
  } catch (err) {
    console.error("comments/create failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "コメント保存に失敗しました" },
      { status: 500 }
    );
  }
}
