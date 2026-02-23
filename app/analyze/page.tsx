"use client";

import { useState, useEffect } from "react";
import { ResultModal } from "../components/resultModal";
import UploadFiles from "../components/fileUpload";
import { getDeviceId } from "@/app/lib/deviceFingerprint";
import { AnalyzeApiResponseSchema, type AnalyzeApiResponse } from "@/app/lib/analysisSchema";
import { CheckCircle, AlertCircle, Files, ChevronDown, FileDiffIcon } from 'lucide-react';
import sample from "../../fixtures/snapshots/analysis_1770796975400.json";

type StoredData = {
  id: string;        // ファイル名など
  title: string;     // 1行=1質問（番号付きでもOK）
};

export default function Page() {
  const direction = {id:"000",title:"過去に実施した解析結果を見る"}
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
  const [storedData, setStoredData] = useState<StoredData[]>([direction])
  const [selected, setSelected] = useState<string>("")

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
  - もしダウンロードボタン等での保存ができない場合は、出力された抽出結果を回答すること`;

  async function onAnalyze() {
    setError(null);
    setData(null);

    if (files.length === 0) {
      setError("txtファイルを選択してください");
      return;
    }

    setLoading(true);
    try {
      // ── ステップ1: ファイルを送信し jobId を受け取る ──
      const fd = new FormData();
      for (const f of files) fd.append("files", f);
      fd.append("deviceId", deviceId ?? "guest");

      const res = await fetch("/api/analyze-ai", { method: "POST", body: fd });
      const submitJson = await res.json();
      if (!res.ok) {
        throw new Error(submitJson.error ?? `API error ${res.status}`);
      }
      const { jobId } = submitJson;

      // ── ステップ2: ポーリングで結果を待つ ──
      const result = await pollJob(jobId);
      const parsed = AnalyzeApiResponseSchema.parse(result);
      setData(parsed);
    } catch (e: any) {
      setError(e?.message ?? "解析に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  async function pollJob(jobId: string): Promise<unknown> {
    const MAX_ATTEMPTS = 60;
    const INTERVAL_MS = 3000;

    for (let i = 0; i < MAX_ATTEMPTS; i++) {
      await new Promise((r) => setTimeout(r, INTERVAL_MS));
      const res = await fetch(`/api/job/${jobId}`);
      const data = await res.json();

      if (data.status === "done") {
        return { input: data.input, analysis: data.analysis };
      }
      if (data.status === "error") {
        throw new Error(data.error ?? "解析に失敗しました");
      }
    }
    throw new Error("解析がタイムアウトしました。しばらくしてから再度お試しください");
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
    setFilenumber((prev) => prev + 1)
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey(null), 2000);
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

  const loadAnalyzedTitle = async (deviceId:string) => {
    try {
      const res = await fetch("/api/loadAnalyzedTitle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId: deviceId }),
      });
      const result = await res.json();
      setStoredData([direction, ...result.data])
    } catch (error){
      console.log(error)
    }
  }

  const selectData = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const select = e.target.value
    console.log(select)
    setSelected(select)
    if (select !== "000"){
      try {
        const res = await fetch("/api/loadAnalyzedData", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: select }),
        });
        const result = await res.json();
        setData(result.data)
      } catch (error){
        console.log(error)
      }
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
    loadAnalyzedTitle(device)
}, []);

  return (
    <main className="p-6">
      <div className="space-y-4">
      <section className="rounded-3xl bg-white p-8 shadow-sm border">
          <div className="space-y-3">
            <h1 className="text-2xl font-semibold leading-tight">
              質問ログをアップロード&解析する手順
            </h1>
            <p className="text-red-500 text-sm">①〜③の作業は、あなたがお使いのChatGPTなどのAIアシスタントにて、アップロードするスレッドを選んで実施してください。（別の手順でも構いません。対話ログの質問部分のみ抽出したテキストファイルを作成することが目的です。）
            </p>
            <p className="text-gray-700 leading-relaxed py-0.5">
            ①AIとの対話の質問部分のみを抜き出した.txtファイルを作成します。AIとの対話（スレッド）の最後に以下のプロンプト全文を貼り付けて実行してください。
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
            <p className="text-gray-700 leading-relaxed py-1">②AIのチャット画面に表示されるダウンロードボタンをクリックし保存してください。（ファイル名はAIの出力用に仮決めしているだけですので、変更しても構いませんが他のファイルと重複しないようにしてください。）</p>
            <p className="text-gray-700 leading-relaxed py-1">③TXTファイルのダウンロードができない場合は、AIの出力をコピーしメモ帳などにペーストしたのち、TXTファイルとして保存してください。ファイル名は任意ですが、他のファイルと重複しないようにしてください。</p>
            <p className="text-gray-700 leading-relaxed py-1">④ここまでの操作で作成したファイルを下のドロップボックスからアップロード（最大5ファイル）し、解析ボタンをクリックしてください。解析には数分かかることがあります。</p>
        </section>
        {!data && (
        <div className="mx-10">
          <UploadFiles files={files} setFiles={setFiles} />
        <div className="flex items-center mt-5">
          <button
            onClick={onAnalyze}
            disabled={!isReady}
            className={`text-sm px-3 py-2 border rounded-lg flex items-center space-x-2
              ${loading 
                ? 'bg-gray-200 cursor-not-allowed' 
                : 'bg-gray-500 hover:bg-gray-600 text-white'}`}
          >
            
            <span>{loading ? '解析中...' : '解析する'}</span>
          </button>
          <div className="ml-auto">
          <div className="relative inline-block">
            <select 
                className="appearance-none text-xs border rounded-lg px-3 py-2 pr-8 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-300" 
                value={selected} 
                onChange={selectData}
                style={{ 
                    textAlign: 'center',
                    textAlignLast: 'center',
                }}
            >
                {storedData.map((data) => {
                return <option className="text-center" key={data.id} value={data.id}>{data.title}</option>;
                })}
            </select>
            </div>
            <ChevronDown
              size={16}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
            />
          </div>
          
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


        {data && (
          <div>
          <ResultModal data={data} onClose={() => setData(null)} setSelected={setSelected} />
          </div>
        )}
        
      </div>
    </main>
  );
}

/*
          <button className="ml-4 my-4 text-sm px-3 py-1 rounded-lg bg-gray-200" onClick={() => anotherAnalysis()}>別のデータを解析</button>
          <button className="ml-4 my-2 px-3 py-1 rounded-lg bg-gray-200" onClick={() => saveResJSON()}>JSONを保存</button>
          <select 
              className="text-sm border rounded-lg px-3 py-1" 
              value={selected} 
              onChange={selectData}
              style={{ 
                  textAlign: 'center',
                  textAlignLast: 'center',
                  WebkitAppearance: 'none',
                  MozAppearance: 'none',
                  appearance: 'none'
              }}
          >
              {storedData.map((data, index) => {
              return <option className="text-center" key={index} value={data}>{data}</option>;
              })}
          </select>

                    <div className="mx-auto mt-32 text-sm">使用言語(language)</div>
                    <select 
                        className="mt-3 mx-auto text-sm w-36 h-8 text-center border-2 border-lime-600" 
                        value={dLang} 
                        onChange={selectLanguage}
                        style={{ 
                            textAlign: 'center',
                            textAlignLast: 'center',
                            WebkitAppearance: 'none',
                            MozAppearance: 'none',
                            appearance: 'none'
                        }}
                    >
                        {langList.map((lang, index) => {
                        return <option className="text-center" key={index} value={lang}>{lang}</option>;
                        })}
                    </select>

<button className="text-sm ml-auto border px-1 py-1 rounded-lg" >解析結果を見る</button>
                  <Files size={14}/>
                  {copiedKey === "prompt" ? "コピー済" : "コピー"}
              <button
                  type="button"
                  onClick={() => downloadTextFile("question_extraction_prompt.txt", extractionPrompt)}
                  className="rounded-xl border px-3 py-2 text-sm"
                >
                  .txtで保存
                </button>

<button className="px-4 py-2 mx-auto bg-blue-400" onClick={() => saveResJSON()}>JSONを保存</button>
*/