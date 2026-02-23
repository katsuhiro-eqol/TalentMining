"use client";

import { useState } from "react";
import { ResultView } from "@/app//components/resultView";
import sample from "@/fixtures/snapshots/analysis_1771632733121.json";
import { AnalyzeApiResponseSchema, type AnalyzeApiResponse } from "@/app/lib/analysisSchema";

export default function Home() {
  const [data, setData] = useState<AnalyzeApiResponse | null>(sample);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);


  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-6 py-10 space-y-10">

        <section className="rounded-3xl bg-white p-8 shadow-sm border">
          <div className="space-y-3">
            <h1 className="text-2xl font-semibold leading-tight">
              AIとの対話ログを解析して、あなたの“問題解決の特徴”を、言語化・見える化します
            </h1>
            <p className="text-gray-700 leading-relaxed">
            AIとの対話ログからは、あなたの得意分野や課題解決の進め方、論理性などが垣間見えるものです。
            このサービスは、「AIとの技術的な対話」（質問部分）を解析することで、自分では気づきにくいあなたの技術的な特徴や癖をAIが客観的に整理します。
            </p>
            <div>評価や点数づけではなく、技術的な特徴を言語化することが目的です。</div>
            <div>
              解析結果の活用方法
              <li className="ml-5">求職活動における（あなた自身のための）参考資料</li>
              <li className="ml-5">（あなたが望めば）応募書類記載の参考資料</li>
              <li className="ml-5">自分の特徴の把握・気づき</li>
              など
            </div>
          </div>
        </section>
        <section className="rounded-3xl bg-white p-8 shadow-sm border">
        {data && (
            <div>
              <p className="text-xl font-semibold">解析結果の例<span className="text-sm text-green-500">（このアプリ開発者の質問ログをサンプルとしています）</span></p>
              <ResultView data={data} />
            </div>
          )}
        </section>

        <section id="faq" className="rounded-3xl bg-white p-6 shadow-sm border space-y-4">
          <h2 className="text-xl font-semibold">よくある質問</h2>

          <details className="border rounded-2xl p-4">
            <summary className="cursor-pointer font-medium">
              質問だけで本当に分かりますか？
            </summary>
            <p className="mt-2 text-sm text-gray-700">
              傾向（問題設定の仕方、掘り下げ方、関心領域）は十分に見えます。次の段階で回答に対する応答の観点も加味して解析を深めていくことができます。
            </p>
          </details>

          <details className="border rounded-2xl p-4">
            <summary className="cursor-pointer font-medium">
              スコアが低いと不利ですか？
            </summary>
            <p className="mt-2 text-sm text-gray-700">
              第一段階のスコアは優劣ではなく傾向です。不利になる使い方はしません。
            </p>
          </details>

          <details className="border rounded-2xl p-4">
            <summary className="cursor-pointer font-medium">
              機密情報が混ざる場合は？
            </summary>
            <p className="mt-2 text-sm text-gray-700">
              事前に削除してからアップロードしてください。個人情報・機密情報は入力しないでください。
            </p>
          </details>
        </section>
      </div>
    </main>
  );
}

  /*
  async function onAnalyze() {
    setError(null);
    setResult(null);
    if (files.length === 0) {
      setError("txtファイルを選択してください");
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      for (const f of files) fd.append("files", f);

      const res = await fetch("/api/analyze-ai", { method: "POST", body: fd });
      const text = await res.text();
      if (!res.ok) throw new Error(text.slice(0, 300));
      setResult(JSON.parse(text));
    } catch (e: any) {
      setError(e?.message ?? "解析に失敗しました");
    } finally {
      setLoading(false);
    }
  }
    */
/*

        <section>
          解析事例　アップロードした「質問ログ」　aaa.txt bbb.txt ccc.txt
        </section>

        <section id="upload" className="rounded-3xl bg-white p-6 shadow-sm border space-y-4">
          <h2 className="text-xl font-semibold">アップロード</h2>

          <div className="rounded-2xl bg-gray-50 p-4 space-y-2 border">
            <div className="font-medium">アップロードするもの</div>
            <p className="text-sm text-gray-700">
              1ファイル＝1スレッドとして扱います。複数ファイルのアップロードが可能です。<br />
              例：<span className="font-mono">2026-02-12_nextjs-audio.txt</span>
            </p>
          </div>

          <input
            type="file"
            accept=".txt,text/plain"
            multiple
            onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
          />

          {files.length > 0 && (
            <ul className="list-disc pl-5 text-sm text-gray-700">
              {files.map((f) => (
                <li key={f.name}>{f.name}</li>
              ))}
            </ul>
          )}

          <div className="flex gap-3">
            <button
              onClick={onAnalyze}
              disabled={loading}
              className="rounded-xl bg-black px-4 py-2 text-white disabled:opacity-50"
            >
              {loading ? "解析中..." : "解析する"}
            </button>
            <button
              type="button"
              onClick={() => {
                setFiles([]);
                setResult(null);
                setError(null);
              }}
              className="rounded-xl border px-4 py-2"
            >
              リセット
            </button>
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}

          {result && (
            <div className="rounded-2xl border p-4 bg-gray-50">
              <div className="font-medium">解析結果（JSON）</div>
              <pre className="mt-2 text-xs overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </section>


        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-3xl bg-white p-6 shadow-sm border space-y-3">
            <h2 className="text-xl font-semibold">このページで分かること</h2>
            <ul className="list-disc pl-5 text-gray-800 space-y-2">
              <li>問題解決スタイルの傾向（レーダーチャート）</li>
              <li>スレッド横断で共通する特徴（根拠となる質問例つき）</li>
              <li>場面別の特徴（例：実装/運用/探索など）</li>
              <li>応募書類に使える表現例（短い文章テンプレ）</li>
            </ul>
            <p className="text-sm text-gray-600">
              ※スコアは“優劣”ではなく、ログ内での傾向を可視化したものです。
            </p>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm border space-y-3">
            <h2 className="text-xl font-semibold">この分析は“評価”ではありません</h2>
            <p className="text-gray-800 leading-relaxed">
              本サービスは、あなたのAI活用や問題解決の進め方を整理して、
              自己理解や応募書類作成に役立てるためのツールです。
            </p>
            <ul className="text-sm text-gray-700 space-y-2">
              <li>・企業や第三者への共有は、あなたが提出を選んだ場合のみ</li>
              <li>・第一段階では合否や序列化を行いません</li>
              <li>・個人情報・機密情報は含めないでください</li>
            </ul>
          </div>
        </section>
  */