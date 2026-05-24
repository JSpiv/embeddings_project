"use client";

import { useRef, useState } from "react";
import { uploadFile } from "@/lib/api";

interface Props {
  onUpload: (fileId: string) => void;
  fileId: string | null;
}

export default function UploadPanel({ onUpload, fileId }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const id = await uploadFile(file);
      setFileName(file.name);
      onUpload(id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-medium text-gray-700">Dataset</h2>
      <button
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="w-full rounded border border-dashed border-gray-300 px-4 py-3 text-sm text-gray-500 hover:border-gray-400 hover:text-gray-700 transition disabled:opacity-50"
      >
        {uploading ? "Uploading…" : "Click to upload CSV or H5AD"}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.h5ad"
        className="hidden"
        onChange={handleChange}
      />
      <p className="text-xs text-gray-400">
        CSV or H5AD · max 50 MB · 10,000 cells
      </p>
      {fileName && fileId && (
        <p className="text-xs text-green-600 truncate">{fileName}</p>
      )}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
