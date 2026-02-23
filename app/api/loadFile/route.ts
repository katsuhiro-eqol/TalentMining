import { NextResponse } from "next/server";
import { bucket } from "@/app/lib/firebaseAdmin"

export const runtime = "nodejs";

export async function POST(req: Request) {
    const { file } = await req.json();
    const path = `Questions/${file}`;
  
    try {
      const fileRef = bucket.file(path);
      const [exists] = await fileRef.exists();
      if (!exists) {
        return NextResponse.json(
          { error: `ファイルが見つかりません: ${path}` },
          { status: 404 }
        );
      }
  
      const [buffer] = await fileRef.download();
      const text = buffer.toString("utf-8");
  
      return NextResponse.json({ data: text });
    } catch (e: any) {
      return NextResponse.json(
        { error: e?.message ?? "ファイルの読み込みに失敗しました" },
        { status: 500 }
      );
    }
}