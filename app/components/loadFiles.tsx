"use client";

import { useState, useEffect } from "react";
import { getDeviceId } from "@/app/lib/deviceFingerprint";
import { TextModal } from "./textModal";

export function LoadFiles({ files }: { files: string[] }) {
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [modalData, setModalData] = useState<{ title: string; text: string } | null>(null);

  useEffect(() => {
    let device = getDeviceId();
    setDeviceId(device);
  }, []);

  const loadFile = async (file: string) => {
    const savedName = `${deviceId}_${file}`;
    const res = await fetch("/api/loadFile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ file: savedName }),
    });
    const { data } = await res.json();
    setModalData({ title: file, text: data });
  };

  return (
    <div>
      {Array.isArray(files) &&
        files.map((file, index) => (
          <button
            key={index}
            onClick={() => loadFile(file)}
            className="mr-3 my-0.5 space-y-1 px-2 py-1 border rounded-2xl bg-gray-500 text-white text-xs hover:bg-gray-700"
          >
            {file}
          </button>
        ))}

      {modalData && (
        <TextModal
          title={modalData.title}
          text={modalData.text}
          onClose={() => setModalData(null)}
        />
      )}
    </div>
  );
}