"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/app/lib/firebaseClient";

export default function AccountUserPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        console.log(currentUser)
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/signIn");
  };

  const handleSaveComment = async () => {
    if (!user) return;
    if (!comment.trim()) {
      setMessage("コメントを入力してください");
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          text: comment.trim(),
        }),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body?.error ?? "コメントの送信に失敗しました");
      }

      setComment("");
      setMessage("送信完了");
    } catch (err: any) {
      setMessage(err?.message ?? "送信エラー");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="p-6">
    <div className="space-y-4">
      <section className="rounded-3xl bg-white p-8 shadow-sm border">
        <h1 className="text-xl font-semibold">ユーザーページ</h1>
        <p className="mt-3 text-sm text-gray-600">
          サインイン済みユーザー:  
          <span>
          {user?.email ? `${user.email}` : "ログイン情報を取得中..."}
          </span>
        </p>
        <div className="flex">
        <button onClick={handleLogout} className="bg-gray-500 rounded-lg text-white text-sm py-1 px-3 mt-5 mx-auto hover:bg-gray-600">ログアウト</button>
        </div>
      </section>
      <section className="rounded-3xl bg-white p-8 shadow-sm border">
        <p className="text-sm">やってほしい解析やアイデアがありましたらコメントをお待ちしています</p>
        <textarea
          className="mt-4 w-full min-h-40 rounded-md border border-gray-300 px-3 py-2 text-sm hover:bg-gray-500"
          placeholder="コメントを入力してください"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
          <div className="flex">
            <button onClick={handleSaveComment} disabled={saving} className="bg-gray-500 rounded-lg text-white text-sm py-1 px-3 mt-5 mx-auto hover:bg-gray-600">{saving ? "送信中..." : "送信"}</button>
            </div>{message && <p className="mt-2 text-center text-xs text-blue-600">{message}</p>}<div>
            
        </div>
      </section>
      </div>
    </main>
  );
}

/*
        <button
          type="button"
          onClick={handleLogout}
          className="mt-6 rounded-md bg-gray-700 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
        >
          ログアウト
        </button>
        */