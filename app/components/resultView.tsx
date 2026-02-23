"use client";

import {RadarChart} from "./radarChart"
import { LoadFiles} from "@/app//components/loadFiles"
import type { AnalyzeApiResponse, Radar } from "../lib/analysisSchema";

const AXES: Array<{ key: keyof Radar; label: string }> = [
  { key: "continuity", label: "課題継続性" },
  { key: "exploration", label: "探索・深掘り" },
  { key: "breadth", label: "技術横断性" },
  { key: "implementation", label: "実装具体性" },
  { key: "practicality", label: "運用・現実視点" },
  { key: "learning", label: "学習・理解志向" },
];

export function ResultView({ data }: { data: AnalyzeApiResponse }) {
  const a = data.analysis;
  const f = data.input.threads

  return (
    <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
      {/* 左：レーダー＋サマリ */}
      <div className="rounded-2xl bg-white p-5 shadow-sm space-y-3">
      <h2 className="text-lg font-semibold">解析した質問ログ</h2>
        <LoadFiles files={f} />
        <div className="text-sm text-gray-500">
          入力：{data.input.threads.length}スレッド / {data.input.questionCount}質問
        </div>

        <h2 className="mt-12 text-lg font-semibold">あなたの問題解決スタイル（傾向）</h2>
        <RadarChart radar={a.radar_llm} />

        <div className="text-sm text-gray-800 leading-relaxed">
          {a.persona_summary}
        </div>

        <div className="text-xs text-gray-500">
          {a.disclaimer}
        </div>

        <div className="pt-2">
          <h3 className="font-medium">軸ごとの値（0〜1）</h3>
          <ul className="mt-2 space-y-1 text-sm">
            {AXES.map((x) => (
              <li key={x.key} className="flex justify-between">
                <span className="text-gray-700">{x.label}</span>
                <span className="font-mono">{a.radar_llm[x.key].toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 右：共通特性＋根拠 */}
      <div className="rounded-2xl bg-white p-5 shadow-sm space-y-4">
        <h2 className="text-lg font-semibold">共通して見られる特徴</h2>

        <div className="space-y-4">
          {a.common_traits.map((t, idx) => (
            <div key={idx} className="rounded-xl border p-4 space-y-2">
              <div className="font-medium">{t.title}</div>
              <div className="text-sm text-gray-800">{t.description}</div>

              <div className="text-xs text-gray-600">
                根拠（質問例）
              </div>
              <ul className="text-sm list-disc pl-5 space-y-1">
                {t.evidence.map((e, i) => (
                  <li key={i}>
                    <span className="text-gray-500">[{e.threadId}]</span>{" "}
                    {e.question}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <h2 className="text-lg font-semibold pt-2">場面別の特徴</h2>
        <div className="space-y-3">
          {a.situational_traits.map((s, idx) => (
            <div key={idx} className="rounded-xl border p-4 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="font-medium">{s.theme}</div>
                <div className="text-xs text-gray-500">{s.threadId}</div>
              </div>

              <ul className="text-sm list-disc pl-5">
                {s.traits.map((tr, i) => (
                  <li key={i}>{tr}</li>
                ))}
              </ul>

              <details className="text-sm">
                <summary className="cursor-pointer text-gray-600">質問例</summary>
                <ul className="mt-2 list-disc pl-5 space-y-1">
                  {s.evidence.map((e, i) => (
                    <li key={i}>{e.question}</li>
                  ))}
                </ul>
              </details>
            </div>
          ))}
        </div>

        <h2 className="text-lg font-semibold pt-2">応募書類に使える表現例</h2>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          {a.resume_phrases.map((p, i) => (
            <li key={i}>{p}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
