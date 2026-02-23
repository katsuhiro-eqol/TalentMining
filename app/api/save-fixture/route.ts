import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json();

  if (process.env.NODE_ENV === "development"){
    const dir = path.join(process.cwd(), "fixtures", "snapshots");
    await fs.mkdir(dir, { recursive: true });
  
    const filename = `analysis_${Date.now()}.json`;
    const filepath = path.join(dir, filename);
  
    await fs.writeFile(filepath, JSON.stringify(body, null, 2), "utf-8");
  
    return NextResponse.json({ ok: true, filename });
  } else {
    return  NextResponse.json({ ok: false });
  }
}
