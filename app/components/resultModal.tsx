"use client";

import { ResultView } from "./resultView";
import type { AnalyzeApiResponse } from "../lib/analysisSchema";

interface ResultModalProps {
  data: AnalyzeApiResponse;
  onClose: () => void;
  setSelected:(selected:string) => void;
}

export function ResultModal({ data, onClose, setSelected }: ResultModalProps) {
  const handleClose = () => {
    setSelected("000");
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/50"
      onClick={handleClose}
    >
      <div className="flex min-h-full items-center justify-center p-4">
      <div
        className="bg-white rounded-lg shadow-lg w-full max-w-5xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b">
          <h2 className="text-sm font-semibold">解析結果</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ✕
          </button>
        </div>

        <div className="px-5 py-4 overflow-y-auto flex-1">
          <ResultView data={data} />
        </div>

        <div className="px-5 py-3 border-t text-right">
          <button
            onClick={handleClose}
            className="px-4 py-1.5 text-sm bg-gray-500 hover:bg-gray-600 text-white rounded-lg"
          >
            閉じる
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}