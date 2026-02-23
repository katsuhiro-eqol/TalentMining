import { NextResponse } from "next/server";
import { db, bucket } from "@/app/lib/firebaseAdmin"

export const runtime = "nodejs";

export async function POST(req: Request) {
    const { id } = await req.json();
    console.log(id)
    try {
      const doc = await db
        .collection("Analysis")
        .doc(id)
        .get();

      const data = doc.data()

      return NextResponse.json({ data: data });
    } catch (e: any) {
      return NextResponse.json(
        { error: e?.message ?? "データの読み込みができませんでした" },
        { status: 500 }
      );
    }
}