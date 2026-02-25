"use client";

import { useRef } from "react";
import { ResultView } from "./resultView";
import { Share, X} from 'lucide-react';
import type { AnalyzeApiResponse } from "../lib/analysisSchema";

interface ResultModalProps {
  data: AnalyzeApiResponse;
  onClose: () => void;
  setSelected:(selected:string) => void;
}

export function ResultModal({ data, onClose, setSelected }: ResultModalProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  const handleClose = () => {
    setSelected("000");
    onClose();
  };

  const handleSharePdf = () => {
    if (!contentRef.current) return;
    const printWindow = window.open("", "_blank", "width=1000,height=800");
    if (!printWindow) return;

    const html = contentRef.current.innerHTML;
    printWindow.document.write(`
      <html>
        <head>
          <title>analysis-result</title>
          <meta charset="utf-8" />
          <style>
            body { font-family: sans-serif; margin: 24px; color: #111827; }
            .rounded-2xl, .rounded-xl { border-radius: 12px; }
            .shadow-sm { box-shadow: none !important; }
            .bg-white { background: white !important; }
            .border { border: 1px solid #e5e7eb; }
            .grid { display: block !important; }
            * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          </style>
        </head>
        <body>${html}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
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
            onClick={handleSharePdf}
            className="text-gray-400 hover:text-gray-600 text-xl ml-auto mr-4"
          >
            <Share />
          </button>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X />
          </button>
        </div>

        <div ref={contentRef} className="px-5 py-4 overflow-y-auto flex-1">
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