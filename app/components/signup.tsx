"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getDeviceId } from "@/app/lib/deviceFingerprint";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  type User,
} from "firebase/auth";
import { auth, googleProvider, facebookProvider, xProvider } from "@/app/lib/firebaseClient";

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deviceId, setDeviceId] = useState<string>("")

  const upsertUserProfile = async (user: User) => {
    const idToken = await user.getIdToken();

    const res = await fetch("/api/users/upsert", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        providerIds: user.providerData.map((p) => p.providerId).filter(Boolean),
        deviceId,
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body?.error ?? "ユーザー情報の保存に失敗しました");
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("パスワードが一致しません");
      return;
    }
    if (password.length < 6) {
      setError("パスワードは6文字以上で入力してください");
      return;
    }

    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await upsertUserProfile(cred.user);
      router.push("/account/user");
    } catch (err: any) {
      const code = err?.code;
      if (code === "auth/email-already-in-use") {
        setError("このメールアドレスは既に登録されています");
      } else if (code === "auth/invalid-email") {
        setError("メールアドレスの形式が正しくありません");
      } else {
        setError(err?.message ?? "アカウント作成に失敗しました");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleProviderSignUp = async (
    provider: typeof googleProvider | typeof facebookProvider | typeof xProvider
  ) => {
    setError(null);
    setLoading(true);
    try {
      const cred = await signInWithPopup(auth, provider);
      await upsertUserProfile(cred.user);
      router.push("/account/user");
    } catch (err: any) {
      const code = err?.code;
      if (code === "auth/popup-closed-by-user") {
        setError("ポップアップが閉じられました。もう一度お試しください");
      } else if (code === "auth/account-exists-with-different-credential") {
        setError("このメールアドレスは別の方法で登録済みです");
      } else {
        setError(err?.message ?? "サインアップに失敗しました");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let device = getDeviceId()
    setDeviceId(device)
}, []);

  return (
      <div className="mx-auto px-4" style={{ width: 480 }}>

        <h1 className="text-center text-lg font-semibold mb-8">アカウント登録</h1>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleEmailSignUp} className="space-y-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-3 text-sm outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
            placeholder="メールアドレス"
          />
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-3 text-sm outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
            placeholder="パスワード（6文字以上）"
          />
          <input
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-3 text-sm outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
            placeholder="パスワード（確認）"
          />
          <div className="flex justify-center mt-5">
          <button
            type="submit"
            disabled={loading}
            className="mx-auto rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            登録
          </button>
          </div>
        </form>

        <p className="mt-8 text-center text-sm text-gray-600">
          既にアカウントをお持ちの方は{" "}
        </p>
        <div className="my-6 text-center text-sm text-blue-500 hover:text-blue-700">
        <a href="/signIn" >サインイン</a>
        </div>

        <div className="my-6 flex items-center gap-4">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs uppercase text-gray-400">or</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <div className="space-y-3">
          <button
            type="button"
            onClick={() => handleProviderSignUp(googleProvider)}
            disabled={loading}
            className="w-full flex items-center rounded-md border border-gray-300 px-3 py-3 text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            <span className="flex-1 text-center">Google で続ける</span>
          </button>
        </div>
      </div>
  );
}