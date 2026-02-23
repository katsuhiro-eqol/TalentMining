'use client';

import { useState } from 'react';

export default function QuestionExtractor() {
  const [inputText, setInputText] = useState('');
  const [questions, setQuestions] = useState<string[]>([]);

  const extractQuestions = (text: string) => {
    // 時刻パターンを検出（例：2月6日、2月9日、12:03など）
    const lines = text.split('\n');
    const extractedQuestions: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // 時刻パターン（HH:MM形式）または日付パターン（X月X日）を検出
      const isTimePattern = /^\d{1,2}:\d{2}$/.test(line);
      const isDatePattern = /^\d{1,2}月\d{1,2}日$/.test(line);
      
      // 時刻や日付の直前の行が質問
      if ((isTimePattern || isDatePattern) && i > 0) {
        const prevLine = lines[i - 1].trim();
        // 空行でない、かつまだ追加していない質問の場合
        if (prevLine && !extractedQuestions.includes(prevLine)) {
          extractedQuestions.push(prevLine);
        }
      }
    }
    
    return extractedQuestions;
  };

  const handleExtract = () => {
    const extracted = extractQuestions(inputText);
    setQuestions(extracted);
  };

  const handleClear = () => {
    setInputText('');
    setQuestions([]);
  };

  const handleCopy = () => {
    const text = questions.join('\n\n');
    navigator.clipboard.writeText(text);
    alert('質問リストをクリップボードにコピーしました！');
  };

  const handleDownload = () => {
    const text = questions.map((q, i) => `${i + 1}. ${q}`).join('\n\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'claude_questions.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-2 text-center">
          Claude会話 質問抽出ツール
        </h1>
        <p className="text-gray-600 text-center mb-8">
          Claudeの会話全文を貼り付けて、質問部分だけを抽出します
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 入力エリア */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-700">
                会話全文を貼り付け
              </h2>
              <button
                onClick={handleClear}
                className="px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
              >
                クリア
              </button>
            </div>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Claudeの会話全文をここに貼り付けてください..."
              className="w-full h-96 p-4 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none resize-none font-mono text-sm"
            />
            <button
              onClick={handleExtract}
              disabled={!inputText.trim()}
              className="w-full mt-4 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors shadow-md"
            >
              質問を抽出
            </button>
          </div>

          {/* 結果エリア */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-700">
                抽出された質問
                {questions.length > 0 && (
                  <span className="ml-2 text-sm text-gray-500">
                    ({questions.length}件)
                  </span>
                )}
              </h2>
              {questions.length > 0 && (
                <div className="flex gap-2">
                  <button
                    onClick={handleCopy}
                    className="px-4 py-2 text-sm bg-green-500 hover:bg-green-600 text-white rounded-md transition-colors"
                  >
                    コピー
                  </button>
                  <button
                    onClick={handleDownload}
                    className="px-4 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
                  >
                    ダウンロード
                  </button>
                </div>
              )}
            </div>

            <div className="h-96 overflow-y-auto border-2 border-gray-200 rounded-lg p-4">
              {questions.length === 0 ? (
                <p className="text-gray-400 text-center mt-20">
                  質問が抽出されるとここに表示されます
                </p>
              ) : (
                <ol className="space-y-4">
                  {questions.map((question, index) => (
                    <li
                      key={index}
                      className="p-4 bg-blue-50 rounded-lg border-l-4 border-indigo-500"
                    >
                      <div className="flex items-start">
                        <span className="font-bold text-indigo-600 mr-3">
                          {index + 1}.
                        </span>
                        <p className="text-gray-800 flex-1">{question}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        </div>

        {/* 使い方ガイド */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">
            📖 使い方
          </h3>
          <ol className="space-y-2 text-gray-600">
            <li>1. Claude.aiの過去の会話を開く</li>
            <li>2. 会話全文を選択してコピー（Ctrl+A → Ctrl+C）</li>
            <li>3. 左側のテキストエリアに貼り付け</li>
            <li>4. 「質問を抽出」ボタンをクリック</li>
            <li>5. 右側に質問リストが表示されます</li>
            <li>6. 「コピー」または「ダウンロード」で保存できます</li>
          </ol>
        </div>
      </div>
    </div>
  );
}