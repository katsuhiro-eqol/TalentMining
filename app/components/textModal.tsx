"use client";

interface TextModalProps {
  title: string;
  text: string;
  onClose: () => void;
}

export function TextModal({ title, text, onClose }: TextModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-lg w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-5 py-3 border-b">
          <h2 className="text-sm font-semibold truncate">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ✕
          </button>
        </div>

        {/* 本文 */}
        <div className="px-5 py-4 overflow-y-auto flex-1">
          <pre className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">
            {text}
          </pre>
        </div>

        {/* フッター */}
        <div className="px-5 py-3 border-t text-right">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-sm bg-gray-500 hover:bg-gray-600 text-white rounded-lg"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}