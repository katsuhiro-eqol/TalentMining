import { NextResponse } from "next/server";
import { db } from "@/app/lib/firebaseAdmin";
import { getAuth } from "firebase-admin/auth";
import { FieldValue } from "firebase-admin/firestore";

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
    const { providerIds, deviceId } = (await req.json().catch(() => ({}))) as {
      providerIds?: string[];
      deviceId?: string;
    };

    const uid = decoded.uid;
    const email = decoded.email ?? null;
    const displayName = decoded.name ?? null;
    const photoURL = decoded.picture ?? null;

    const userRef = db.collection("Users").doc(uid);
    const existing = await userRef.get();

    const payload: Record<string, unknown> = {
      uid,
      email,
      displayName,
      photoURL,
      providerIds: Array.isArray(providerIds) ? providerIds : [],
      status: "active",
      lastLoginAt: new Date(),
      updatedAt: new Date(),
    };

    if (!existing.exists) {
      payload.createdAt = new Date();
    }

    if (typeof deviceId === "string" && deviceId.length > 0) {
      payload.lastDeviceId = deviceId;
      payload.deviceIds = FieldValue.arrayUnion(deviceId);
    }

    await userRef.set(payload, { merge: true });

    return NextResponse.json({ ok: true, uid });
  } catch (err) {
    console.error("users/upsert failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "ユーザー保存に失敗しました" },
      { status: 500 }
    );
  }
}
