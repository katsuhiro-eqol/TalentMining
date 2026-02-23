import { NextResponse } from "next/server";
import { db, bucket } from "@/app/lib/firebaseAdmin"

export const runtime = "nodejs";

export async function POST(req: Request) {
    const { deviceId } = await req.json();
    console.log(deviceId)
    try {
      const snapshot = await db
        .collection("Analysis")
        .where("deviceId", "==", deviceId)
        .get();

      const docs = snapshot.docs.map((doc) => ({
        id: doc.id,
        title: doc.data().input.threads.join(" "),
      }));
      console.log(docs)
      return NextResponse.json({ data: docs });
    } catch (e: any) {
      return NextResponse.json(
        { error: e?.message ?? "ファイルの読み込みに失敗しました" },
        { status: 500 }
      );
    }
}