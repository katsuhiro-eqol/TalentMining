"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { auth, googleProvider, facebookProvider } from "@/app/lib/firebaseClient";

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
      await createUserWithEmailAndPassword(auth, email, password);
      router.push("/analyze");
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

  const handleProviderSignUp = async (provider: typeof googleProvider | typeof facebookProvider) => {
    setError(null);
    setLoading(true);
    try {
      await signInWithPopup(auth, provider);
      router.push("/analyze");
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

  return (
    <main className="flex min-h-screen items-center justify-center bg-white">
      <div className="w-full max-w-[340px] px-4">
        {/* ロゴ */}
        <div className="flex justify-center mb-8">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <span className="text-white text-xl font-bold">AI</span>
          </div>
        </div>

        <h1 className="text-center text-[32px] font-semibold mb-2">Create your account</h1>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* メール入力 */}
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
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-[#10a37f] px-4 py-3 text-sm font-medium text-white hover:bg-[#0e9272] transition-colors disabled:opacity-50"
          >
            {loading ? "作成中..." : "続ける"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          既にアカウントをお持ちの方は{" "}
          <a href="/signIn" className="text-[#10a37f] hover:underline">
            サインイン
          </a>
        </p>

        {/* 区切り線 */}
        <div className="my-6 flex items-center gap-4">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs uppercase text-gray-400">or</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* プロバイダ */}
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

          <button
            type="button"
            onClick={() => handleProviderSignUp(facebookProvider)}
            disabled={loading}
            className="w-full flex items-center rounded-md border border-gray-300 px-3 py-3 text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#1877F2">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            <span className="flex-1 text-center">Facebook で続ける</span>
          </button>
        </div>
      </div>
    </main>
  );
}
