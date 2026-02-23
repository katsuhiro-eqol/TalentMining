"use client";

import { useState, useEffect } from "react";
import { ResultView } from "../components/resultView";
import UploadFiles from "../components/fileUpload";
import { getDeviceId } from "@/app/lib/deviceFingerprint";
import { AnalyzeApiResponseSchema, type AnalyzeApiResponse } from "@/app/lib/analysisSchema";
import { CheckCircle, AlertCircle, Files, FileDiffIcon } from 'lucide-react';
import sample from "../../fixtures/snapshots/analysis_1770796975400.json";



export default function Page() {
  const [files, setFiles] = useState<File[]>([]);
  const [data, setData] = useState<AnalyzeApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isReady, setIsReady] = useState<boolean>(false)
  const [errors, setErrors] = useState<string>("")
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null); 
  const [deviceId, setDeviceId] = useState<string | null>(null)
  const [filenumber, setFilenumber] = useState<number>(1)

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const date = `${yyyy}${mm}${dd}`

  const extractionPrompt = `
  このスレッドの私の質問部分だけを以下の条件で抽出して「${date}_${filenumber}.txt」としてダウンロードしてください。 
  
  条件： 
  - 1行=1質問で出力し、先頭に通し番号を付ける（例：1. ...） 
  - この質問は除外する 
  - 出力は抽出結果のみ 
  
  補足： 
  - もしダウンロードボタン等での保存ができない場合は、出力された抽出結果を出力すること`;

  async function onAnalyze() {
    setError(null);
    setData(null);

    if (files.length === 0) {
      setError("txtファイルを選択してください");
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      for (const f of files) fd.append("files", f);
      fd.append("deviceId",deviceId ?? "guest")

      const res = await fetch("/api/analyze-ai", { method: "POST", body: fd});

      // ここがポイント：まず text で受けて、デバッグ可能にする
      const text = await res.text();
      if (!res.ok) {
        throw new Error(`API error ${res.status}: ${text.slice(0, 300)}`);
      }
      // JSON parse
      const json = JSON.parse(text);
      // zodで検証して型安全に
      const parsed = AnalyzeApiResponseSchema.parse(json);
      console.log(parsed)
      setData(parsed);
    } catch (e: any) {
      setError(e?.message ?? "解析に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  const testAnalyze = () => {
    console.log("testAnalyze")
    setData(sample)
  }

  const anotherAnalysis = () => {
    setData(null)
    setFiles([])
  }

  const saveResJSON = async () => {
    console.log("save")
    if (data) {
      const res = await fetch("/api/save-fixture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const filename = res.json()
      console.log(filename)
    }
  }

  async function copyToClipboard(key: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey(null), 1200);
    } catch {
      // clipboardが使えない環境向けフォールバック
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey(null), 2000);
    }
  }

  useEffect(() => {
    if (files.length > 0){
      setIsReady(true)
    } else {
      setIsReady(false)
    }
  }, [files])

  useEffect(() => {
    let device = getDeviceId()
    setDeviceId(device)
}, []);

  return (
    <main className="p-6">
      <div className="space-y-4">

        {data && (
          <div>
          <ResultView data={data} />
          <button className="ml-4 my-4 text-sm px-3 py-1 rounded-lg bg-gray-200" onClick={() => anotherAnalysis()}>別のデータを解析</button>
          <button className="ml-4 my-2 px-3 py-1 rounded-lg bg-gray-200" onClick={() => saveResJSON()}>JSONを保存</button>
          </div>
        )}
        
      </div>
    </main>
  );
}

/*
      <section className="rounded-3xl bg-white p-8 shadow-sm border">
          <div className="space-y-3">
            <h1 className="text-2xl font-semibold leading-tight">
              質問ログをアップロード&解析する手順
            </h1>
            <p className="text-red-500">（注意）以下の作業はあなたがお使いのAIチャットにて、アップロードするスレッドを選んで実施してください。</p>
            <p className="text-gray-700 leading-relaxed">
            ①AIとのやりとりの質問部分のみを抜き出した.txtファイルを作成します。AIとのやりとり（スレッド）の最後に以下のプロンプト全文を貼り付けて実行してください。
            </p>
          </div>
            <pre className="my-4 whitespace-pre-wrap text-sm bg-gray-100 border rounded-sm p-2 overflow-auto">
            <div className="text-right mr-4">
                <button
                  type="button"
                  onClick={() => copyToClipboard("prompt", extractionPrompt)}
                  className="text-gray-600 text-sm"
                >
                  {copiedKey === "prompt" ? (
                    <div className="flex items-center text-orange-500">
                      <Files size={18}/>コピー済
                    </div>
                  ):(
                    <div className="flex items-center hover:text-blue-500">
                    <Files size={18}/>コピーする
                    </div>)}
                </button>

              </div>
              {extractionPrompt}
            </pre>
            <p>②AIのチャット画面に表示されるダウンロードボタンをクリックし、保存してください。ファイル名は変えても構いませんが他のファイルと重複しないようにしてください。</p>
            <p>③TXTファイルのダウンロードができない場合は、AIの出力をコピーしメモ帳などにペーストしたのち、TXTファイルとして保存してください。ファイル名は任意ですが、他のファイルと重複しないようにしてください。</p>
            <p>④ファイルを下のドロップボックスからアップロード（最大5ファイル）し、解析ボタンをクリックしてください。解析には数分から十数分程度かかることがあります。</p>
        </section>
        {!data && (
        <div className="mx-10">
          <UploadFiles files={files} setFiles={setFiles} setIsReady={setIsReady} setErrors={setErrors}/>
        <div className="flex items-center mt-5">
          <button
            onClick={testAnalyze}
            disabled={!isReady}
            className={`text-sm px-3 py-2 border rounded-lg flex items-center space-x-2
              ${loading 
                ? 'bg-gray-200 cursor-not-allowed' 
                : 'bg-gray-500 hover:bg-gray-600 text-white'}`}
          >
            
            <span>{uploading ? '解析中...' : '解析する'}</span>
          </button>
          <button className="text-sm ml-5 border px-1 py-1 rounded-lg" onClick={()=>setFiles([])}>アップロードやり直し</button>
          
          {uploadStatus && (
            <div className={`ml-4 flex items-center
              ${uploadStatus === 'success' ? 'text-green-600' : 'text-red-600'}`}>
              {uploadStatus === 'success' ? (
                <>
                  <CheckCircle className="h-5 w-5 mr-2" />
                  <span>アップロード完了</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 mr-2" />
                  <span>アップロード失敗。再試行してください。</span>
                </>
              )}
            </div>
          )}
        </div>
        </div>
        )}


        */