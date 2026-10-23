"use client";

import React, { useState } from "react";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
}

export function FileUpload({ onFileSelect, selectedFile }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
        isDragging
          ? "border-indigo-500 bg-indigo-950/20"
          : selectedFile
          ? "border-emerald-600/60 bg-emerald-950/10"
          : "border-slate-700/80 hover:border-slate-600 bg-slate-900/40"
      }`}
      onClick={() => document.getElementById("file-upload-input")?.click()}
    >
      <input
        id="file-upload-input"
        type="file"
        className="hidden"
        onChange={handleInputChange}
        accept=".txt,.pdf,.docx,.png,.jpg,.jpeg,.webp,.mp4"
      />

      <div className="w-12 h-12 mx-auto rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-2xl mb-3 shadow-inner">
        {selectedFile ? "📄" : "📁"}
      </div>

      {selectedFile ? (
        <div>
          <div className="text-sm font-bold text-emerald-400">{selectedFile.name}</div>
          <div className="text-xs text-slate-400 mt-1">
            {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for OCR & extraction
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onFileSelect(null as any);
            }}
            className="mt-3 text-xs text-rose-400 hover:underline font-semibold"
          >
            Remove file
          </button>
        </div>
      ) : (
        <div>
          <div className="text-sm font-semibold text-slate-200">
            Drag & drop brand document or media here, or <span className="text-indigo-400 underline">browse</span>
          </div>
          <p className="text-xs text-slate-400 mt-1.5">
            Supports PDF, DOCX, TXT, PNG, JPEG, WebP, MP4 (Max 25MB)
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5">
            {["PDF Extracts", "DOCX Parser", "Image OCR", "Video Transcript", "MIME Safe"].map(
              (tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700"
                >
                  {tag}
                </span>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}
