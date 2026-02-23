/*

"use client";

import { useState } from "react";
import { ResultView } from "../components/resultView";
import sample from "@/fixtures/snapshots/analysis_1770796975400.json";
import { AnalyzeApiResponseSchema, type AnalyzeApiResponse } from "@/app/lib/analysisSchema";
import { getDeviceId } from "@/app/lib/deviceFingerprint";

export default function Home() {

  const [data, setData] = useState<AnalyzeApiResponse | null>(null);

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-6 py-10 space-y-10">

      {data && (
          <div>
          <ResultView data={data} />
          </div>
        )}
      </div>
    </main>
  );
}
  */

/*
          <button className="ml-4 my-4 text-sm px-3 py-1 rounded-lg bg-gray-200" onClick={() => anotherAnalysis()}>別のデータを解析</button>
          <button className="ml-4 my-2 px-3 py-1 rounded-lg bg-gray-200" onClick={() => saveResJSON()}>JSONを保存</button>
*/