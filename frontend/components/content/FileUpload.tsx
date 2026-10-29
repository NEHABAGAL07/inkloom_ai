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
          ? "border-[#10B981] bg-[#10B981]/5 dark:border-[#FFAA35] dark:bg-[#FFAA35]/5"
          : selectedFile
          ? "border-[#10B981] bg-[#10B981]/10 dark:border-[#72D6A1] dark:bg-[#72D6A1]/10"
          : "border-slate-200 bg-slate-50/60 hover:border-[#10B981] dark:border-[#383838] dark:hover:border-[#FFAA35]/60 dark:bg-[#141414]"
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

      <div className="w-12 h-12 mx-auto rounded-xl bg-white dark:bg-[#202020] border border-slate-200 dark:border-[#383838] flex items-center justify-center mb-3 shadow-xs">
        {selectedFile ? (
          <File className="w-6 h-6 text-[#10B981] dark:text-[#72D6A1]" />
        ) : (
          <UploadCloud className="w-6 h-6 text-[#0284C7] dark:text-[#FFAA35]" />
        )}
      </div>

      {selectedFile ? (
        <div className="space-y-1">
          <div className="text-sm font-bold text-[#0F172A] dark:text-[#F7F3ED] flex items-center justify-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-[#10B981] dark:text-[#72D6A1]" />
            <span>{selectedFile.name}</span>
          </div>
          <div className="text-xs text-[#64748B] dark:text-[#85817D]">
            {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for OCR extraction &amp; audit
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onFileSelect(null as any);
            }}
            className="mt-3 text-xs text-rose-500 dark:text-[#FF6B78] hover:underline font-semibold flex items-center gap-1 mx-auto"
          >
            <X className="w-3.5 h-3.5" />
            <span>Remove file</span>
          </button>
        </div>
      ) : (
        <div>
          <div className="text-sm font-semibold text-[#0F172A] dark:text-[#F7F3ED]">
            Drag &amp; drop brand document or media here, or <span className="text-[#2563EB] dark:text-[#FFAA35] underline font-bold">browse</span>
          </div>
          <p className="text-xs text-[#64748B] dark:text-[#85817D] mt-1.5">
            Supports PDF, DOCX, TXT, PNG, JPEG, WebP, MP4 (Max 25MB)
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5">
            {["PDF Extracts", "DOCX Parser", "Image OCR", "Video Transcript", "MIME Safe"].map(
              (tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-[#475569] border border-slate-200 dark:bg-[#202020] dark:text-[#85817D] dark:border-[#383838]"
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
