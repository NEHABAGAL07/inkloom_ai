'use client';

import React, { useRef, useState } from 'react';

interface FileUploadZoneProps {
  onFileSelected: (file: File) => void;
  selectedFile: File | null;
  onClearFile: () => void;
}

export const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  onFileSelected,
  selectedFile,
  onClearFile,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      onFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelected(e.target.files[0]);
    }
  };

  return (
    <div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".txt,.pdf,.docx,.png,.jpg,.jpeg,.mp4"
      />

      {selectedFile ? (
        <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📄</span>
            <div>
              <p className="text-sm font-semibold text-slate-900">{selectedFile.name}</p>
              <p className="text-xs text-slate-500">
                {(selectedFile.size / 1024).toFixed(1)} KB • {selectedFile.type || 'Document'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClearFile}
            className="px-3 py-1 rounded-md text-xs font-medium text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors"
          >
            Remove
          </button>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`p-8 rounded-xl border-2 border-dashed text-center cursor-pointer transition-colors ${
            isDragging
              ? 'border-indigo-500 bg-indigo-50/50'
              : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
          }`}
        >
          <div className="w-12 h-12 mx-auto rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl mb-3">
            ☁️
          </div>
          <p className="text-sm font-medium text-slate-700">
            Click to upload document or drag and drop
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Supported formats: PDF, DOCX, TXT, PNG, JPEG, MP4 (Max 25 MB)
          </p>
          <div className="mt-3 flex items-center justify-center gap-2">
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">PDF</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">DOCX</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">IMAGES</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">VIDEO</span>
          </div>
        </div>
      )}
    </div>
  );
};
