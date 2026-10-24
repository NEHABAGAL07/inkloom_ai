"use client";

import React, { useState } from "react";
import { UploadCloud, File, X, CheckCircle } from "lucide-react";

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
          ? "border-teal bg-teal/5"
          : selectedFile
          ? "border-status-success bg-emerald-50/50"
          : "border-border hover:border-teal bg-workspace"
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

      <div className="w-12 h-12 mx-auto rounded-xl bg-surface border border-border flex items-center justify-center mb-3 shadow-subtle">
        {selectedFile ? (
          <File className="w-6 h-6 text-status-success" />
        ) : (
          <UploadCloud className="w-6 h-6 text-teal" />
        )}
      </div>

      {selectedFile ? (
        <div className="space-y-1">
          <div className="text-sm font-bold text-navy flex items-center justify-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-status-success" />
            <span>{selectedFile.name}</span>
          </div>
          <div className="text-xs text-ink-muted">
            {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for OCR extraction & audit
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onFileSelect(null as any);
            }}
            className="mt-3 text-xs text-status-error hover:underline font-semibold flex items-center gap-1 mx-auto"
          >
            <X className="w-3.5 h-3.5" />
            <span>Remove file</span>
          </button>
        </div>
      ) : (
        <div>
          <div className="text-sm font-semibold text-navy">
            Drag &amp; drop brand document or media here, or <span className="text-teal underline font-bold">browse</span>
          </div>
          <p className="text-xs text-ink-muted mt-1.5">
            Supports PDF, DOCX, TXT, PNG, JPEG, WebP, MP4 (Max 25MB)
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5">
            {["PDF Extracts", "DOCX Parser", "Image OCR", "Video Transcript", "MIME Safe"].map(
              (tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded text-[10px] font-semibold bg-surface text-ink-muted border border-border"
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
